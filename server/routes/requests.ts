import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { RequestStatus, PickupTrackingStatus, LiveLocation } from '../types';
import { getIO, broadcastPickupStatus } from '../socket';

const router = Router();

// Create a food request
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { foodId, requestedQuantity, message, pickupTime } = req.body;

    if (!foodId) {
      return res.status(400).json({ error: 'foodId is required' });
    }

    const listing = db.getListingById(foodId);
    if (!listing) {
      return res.status(404).json({ error: 'Food listing not found' });
    }

    if (listing.donorId === user.id) {
      return res.status(400).json({ error: 'You cannot request your own food listing' });
    }

    if (listing.status === 'collected' || listing.status === 'expired') {
      return res.status(400).json({ error: `This food is no longer available (Status: ${listing.status})` });
    }

    // Check if user already has an active pending or accepted request for this food
    const existingReq = db.getRequests().find(
      r => r.foodId === foodId && r.recipientId === user.id && (r.status === 'pending' || r.status === 'accepted')
    );
    if (existingReq) {
      return res.status(400).json({ error: 'You already have an active request for this food listing' });
    }

    const qty = Number(requestedQuantity) || listing.quantity;

    const newRequest = db.createRequest({
      foodId: listing.id,
      foodTitle: listing.title,
      foodImageUrl: listing.imageUrl,
      donorId: listing.donorId,
      donorName: listing.donorName,
      recipientId: user.id,
      recipientName: user.name,
      recipientRole: user.role,
      recipientOrgName: user.organizationDetails?.orgName,
      requestedQuantity: qty,
      unit: listing.unit,
      message: message?.trim() || `Hello! I would love to rescue this food. Thank you!`,
      status: 'pending',
      pickupTime: pickupTime || listing.pickupTimeWindow,
    });

    return res.status(201).json({ request: newRequest });
  } catch (error) {
    console.error('Error creating request:', error);
    return res.status(500).json({ error: 'Failed to create food request' });
  }
});

// GET requests made by current user (as recipient)
router.get('/my', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const requests = db.getRequests()
      .filter(r => r.recipientId === user.id)
      .map(r => {
        const listing = db.getListingById(r.foodId);
        return {
          ...r,
          listing,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ requests });
  } catch (error) {
    console.error('Error fetching my requests:', error);
    return res.status(500).json({ error: 'Failed to retrieve your requests' });
  }
});

// GET requests received by current user (as donor)
router.get('/donor', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const requests = db.getRequests()
      .filter(r => r.donorId === user.id)
      .map(r => {
        const listing = db.getListingById(r.foodId);
        const recipient = db.getUserById(r.recipientId);
        return {
          ...r,
          listing,
          recipient: recipient
            ? {
                id: recipient.id,
                name: recipient.name,
                email: recipient.email,
                phone: recipient.phone,
                role: recipient.role,
                organizationDetails: recipient.organizationDetails,
                avatarUrl: recipient.avatarUrl,
              }
            : null,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ requests });
  } catch (error) {
    console.error('Error fetching donor requests:', error);
    return res.status(500).json({ error: 'Failed to retrieve donor requests' });
  }
});

// Update request status (accept, decline, collect, cancel)
router.patch('/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, pickupPin } = req.body as { status: RequestStatus; pickupPin?: string };

    const request = db.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const listing = db.getListingById(request.foodId);
    const isDonor = request.donorId === user.id;
    const isRecipient = request.recipientId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isDonor && !isRecipient && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to modify this request' });
    }

    // Role-specific status transitions
    if (status === 'accepted') {
      if (!isDonor && !isAdmin) {
        return res.status(403).json({ error: 'Only the donor can accept this request' });
      }

      db.updateRequest(request.id, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
      });

      if (listing) {
        db.updateListing(listing.id, {
          status: 'accepted',
          activeRequestId: request.id,
          activeRecipientId: request.recipientId,
        });
      }

      // Initialize live pickup tracking session for accepted request
      db.getOrCreatePickupSession(request.id);
      broadcastPickupStatus(request.id, 'accepted');

      // Notify recipient with pickup PIN & live tracking link
      db.createNotification({
        userId: request.recipientId,
        title: 'Food Request Accepted! 🎉',
        message: `${user.name} accepted your request for "${request.foodTitle}". Pickup code: ${request.pickupCode}. Live location tracking is now active!`,
        type: 'request_accepted',
        link: `/track/${request.id}`,
      });
    } else if (status === 'on_the_way') {
      db.updateRequest(request.id, {
        status: 'on_the_way',
        trackingStatus: 'on_the_way',
      });
      const session = db.updatePickupTrackingStatus(request.id, 'on_the_way');
      broadcastPickupStatus(request.id, 'on_the_way', session || undefined);

      db.createNotification({
        userId: request.donorId,
        title: 'Receiver is On the Way! 🛵',
        message: `${request.recipientName} is heading towards your location to collect "${request.foodTitle}".`,
        type: 'system',
        link: `/track/${request.id}`,
      });
    } else if (status === 'arrived') {
      db.updateRequest(request.id, {
        status: 'arrived',
        trackingStatus: 'arrived',
      });
      const session = db.updatePickupTrackingStatus(request.id, 'arrived');
      broadcastPickupStatus(request.id, 'arrived', session || undefined);

      db.createNotification({
        userId: request.donorId,
        title: 'Receiver has Arrived! 📍',
        message: `${request.recipientName} has arrived at the pickup location for "${request.foodTitle}". Please verify the 6-digit code.`,
        type: 'system',
        link: `/track/${request.id}`,
      });
    } else if (status === 'declined') {
      if (!isDonor && !isAdmin) {
        return res.status(403).json({ error: 'Only the donor can decline this request' });
      }

      db.updateRequest(request.id, { status: 'declined' });
      db.clearPickupSession(request.id);

      // If listing was locked to this request, reopen it to available
      if (listing && listing.activeRequestId === request.id) {
        db.updateListing(listing.id, {
          status: 'available',
          activeRequestId: undefined,
          activeRecipientId: undefined,
        });
      }

      db.createNotification({
        userId: request.recipientId,
        title: 'Request Declined',
        message: `Unfortunately, the donor was unable to fulfill your request for "${request.foodTitle}".`,
        type: 'request_declined',
        link: '/discover',
      });
    } else if (status === 'cancelled') {
      db.updateRequest(request.id, { status: 'cancelled' });
      db.clearPickupSession(request.id);

      if (listing && listing.activeRequestId === request.id) {
        db.updateListing(listing.id, {
          status: 'available',
          activeRequestId: undefined,
          activeRecipientId: undefined,
        });
      }
    } else if (status === 'collected') {
      // Both donor or recipient can confirm collection; check PIN if provided
      if (pickupPin && pickupPin.trim() !== request.pickupCode) {
        return res.status(400).json({ error: 'Invalid 6-digit pickup code' });
      }

      db.updateRequest(request.id, {
        status: 'collected',
        trackingStatus: 'collected',
        collectedAt: new Date().toISOString(),
      });
      db.updatePickupTrackingStatus(request.id, 'collected');

      const io = getIO();
      if (io) {
        io.to(`pickup:${request.id}`).emit('pickup_completed', { requestId: request.id });
      }

      if (listing) {
        db.updateListing(listing.id, { status: 'collected' });

        // Calculate and award impact
        const mealsRescued = listing.estimatedServings || request.requestedQuantity || 10;
        const kgCO2Saved = Math.round(mealsRescued * 2.5); // Average 2.5 kg CO2 per meal saved

        const donorUser = db.getUserById(listing.donorId);
        if (donorUser) {
          db.updateUser(donorUser.id, {
            mealsRescued: donorUser.mealsRescued + mealsRescued,
            kgCO2Saved: donorUser.kgCO2Saved + kgCO2Saved,
          });
        }

        const recipientUser = db.getUserById(request.recipientId);
        if (recipientUser) {
          db.updateUser(recipientUser.id, {
            mealsRescued: recipientUser.mealsRescued + mealsRescued,
            kgCO2Saved: recipientUser.kgCO2Saved + kgCO2Saved,
          });
        }

        // Notify both parties
        db.createNotification({
          userId: request.recipientId,
          title: 'Food Rescued Successfully! 🌿',
          message: `Awesome! You rescued ${mealsRescued} meals and prevented ${kgCO2Saved}kg of CO2 emissions. Pickup tracking session completed.`,
          type: 'food_collected',
          link: '/dashboard',
        });

        db.createNotification({
          userId: request.donorId,
          title: 'Donation Completed! 🌟',
          message: `"${request.foodTitle}" has been collected by ${request.recipientName}. Thank you for fighting food waste!`,
          type: 'food_collected',
          link: '/dashboard',
        });
      }
    }

    const updated = db.getRequestById(request.id);
    return res.json({ request: updated });
  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({ error: 'Failed to update request status' });
  }
});

// GET /api/requests/:id/tracking - Retrieve current tracking session details
router.get('/:id/tracking', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const request = db.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Food request not found' });
    }

    if (request.recipientId !== user.id && request.donorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to view tracking for this request' });
    }

    const session = db.getOrCreatePickupSession(request.id);
    const listing = db.getListingById(request.foodId);
    const donor = db.getUserById(request.donorId);
    const recipient = db.getUserById(request.recipientId);

    return res.json({
      session,
      request,
      listing,
      donor: donor ? { name: donor.name, phone: donor.phone, orgDetails: donor.organizationDetails } : null,
      recipient: recipient ? { name: recipient.name, phone: recipient.phone } : null,
      userRoleInPickup: user.id === request.recipientId ? 'receiver' : 'donor',
    });
  } catch (error) {
    console.error('Error fetching tracking session:', error);
    return res.status(500).json({ error: 'Failed to retrieve tracking session' });
  }
});

// POST /api/requests/:id/tracking/location - Update receiver live location
router.post('/:id/tracking/location', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const request = db.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Food request not found' });
    }

    if (request.recipientId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the receiver can share their live location' });
    }

    if (request.status === 'collected' || request.status === 'cancelled') {
      return res.status(400).json({ error: 'Pickup session is closed' });
    }

    const { lat, lng, accuracy, heading, speed } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Valid numeric lat and lng required' });
    }

    const location: LiveLocation = {
      lat,
      lng,
      accuracy,
      heading,
      speed,
      updatedAt: new Date().toISOString(),
    };

    const session = db.updatePickupLocation(request.id, location);

    const io = getIO();
    if (io && session) {
      io.to(`pickup:${request.id}`).emit('pickup_location_changed', {
        requestId: request.id,
        receiverLocation: session.receiverLocation,
        distanceKm: session.distanceKm,
        etaMinutes: session.etaMinutes,
        trackingStatus: session.trackingStatus,
        lastUpdated: session.lastUpdated,
      });
    }

    return res.json({ success: true, session });
  } catch (error) {
    console.error('Error updating live location:', error);
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

// POST /api/requests/:id/tracking/status - Update tracking progress
router.post('/:id/tracking/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const request = db.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Food request not found' });
    }

    if (request.recipientId !== user.id && request.donorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to change tracking status' });
    }

    const { status, pickupPin } = req.body;
    if (!['accepted', 'on_the_way', 'arrived', 'collected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid tracking status' });
    }

    if (status === 'collected') {
      if (pickupPin && pickupPin.trim() !== request.pickupCode) {
        return res.status(400).json({ error: 'Invalid 6-digit pickup code' });
      }
      db.updateRequest(request.id, { status: 'collected', collectedAt: new Date().toISOString() });
    }

    const session = db.updatePickupTrackingStatus(request.id, status as PickupTrackingStatus);

    const io = getIO();
    if (io) {
      io.to(`pickup:${request.id}`).emit('pickup_status_changed', {
        requestId: request.id,
        status,
        session,
      });
      if (status === 'collected') {
        io.to(`pickup:${request.id}`).emit('pickup_completed', { requestId: request.id });
      }
    }

    return res.json({ success: true, session });
  } catch (error) {
    console.error('Error updating tracking status:', error);
    return res.status(500).json({ error: 'Failed to update tracking status' });
  }
});

// POST /api/requests/:id/tracking/stop - Stop tracking & purge coordinates (Privacy protection)
router.post('/:id/tracking/stop', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const request = db.getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Food request not found' });
    }

    if (request.recipientId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the receiver can stop live location sharing' });
    }

    const session = db.stopPickupTracking(request.id);

    const io = getIO();
    if (io) {
      io.to(`pickup:${request.id}`).emit('pickup_tracking_stopped', {
        requestId: request.id,
        session,
      });
    }

    return res.json({ success: true, message: 'Live tracking stopped and coordinates cleared', session });
  } catch (error) {
    console.error('Error stopping tracking:', error);
    return res.status(500).json({ error: 'Failed to stop tracking' });
  }
});

export default router;
