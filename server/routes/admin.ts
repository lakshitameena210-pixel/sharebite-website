import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Middleware: all admin routes require admin role
router.use(requireAuth);
router.use(requireRole(['admin']));

// GET admin dashboard stats and chart analytics
router.get('/stats', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.getUsers();
    const listings = db.getListings();
    const requests = db.getRequests();

    const totalDonors = users.filter(u => u.role === 'donor').length;
    const totalRecipients = users.filter(u => u.role === 'recipient').length;
    const totalOrgs = users.filter(u => u.role === 'organization').length;
    const verifiedOrgs = users.filter(u => u.organizationDetails?.isVerified).length;
    const pendingOrgVerifications = users.filter(
      u => u.role === 'organization' && u.organizationDetails && !u.organizationDetails.isVerified
    ).length;

    const availableListings = listings.filter(l => l.status === 'available').length;
    const requestedListings = listings.filter(l => l.status === 'requested').length;
    const collectedListings = listings.filter(l => l.status === 'collected').length;
    const expiredListings = listings.filter(l => l.status === 'expired').length;

    // Aggregate category distribution
    const categoryCounts: Record<string, number> = {};
    const categoryMeals: Record<string, number> = {};
    listings.forEach(l => {
      categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
      categoryMeals[l.category] = (categoryMeals[l.category] || 0) + (l.estimatedServings || l.quantity);
    });

    const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      meals: categoryMeals[name] || 0,
      co2Kg: (categoryMeals[name] || 0) * 2.5,
    }));

    // Daily rescued trend mock/actual
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const rescueTrends = days.map((day, idx) => ({
      day,
      mealsRescued: 40 + idx * 18 + (idx === 6 ? 35 : 0),
      co2SavedKg: Math.round((40 + idx * 18 + (idx === 6 ? 35 : 0)) * 2.5),
      activeListings: 12 + idx * 3,
    }));

    // Top donors leaderboard
    const topDonors = users
      .filter(u => u.role === 'donor')
      .sort((a, b) => b.mealsRescued - a.mealsRescued)
      .slice(0, 5)
      .map(u => ({
        id: u.id,
        name: u.name,
        orgName: u.organizationDetails?.orgName || 'Independent Donor',
        mealsRescued: u.mealsRescued,
        kgCO2Saved: u.kgCO2Saved,
      }));

    // Top NGOs
    const topOrgs = users
      .filter(u => u.role === 'organization')
      .sort((a, b) => b.mealsRescued - a.mealsRescued)
      .slice(0, 5)
      .map(u => ({
        id: u.id,
        name: u.organizationDetails?.orgName || u.name,
        contact: u.name,
        isVerified: !!u.organizationDetails?.isVerified,
        mealsDistributed: u.mealsRescued,
      }));

    const globalImpact = db.getImpactStats();

    return res.json({
      summary: {
        totalUsers: users.length,
        totalRecipients,
        verifiedOrgs,
        pendingOrgVerifications,
        totalListings: listings.length,
        availableListings,
        requestedListings,
        collectedListings,
        expiredListings,
        totalRequests: requests.length,
        ...globalImpact,
      },
      categoryData,
      rescueTrends,
      topDonors,
      topOrgs,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin stats' });
  }
});

// GET all users
router.get('/users', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.getUsers().map(u => {
      const { passwordHash: _, ...safeUser } = u;
      return safeUser;
    });
    return res.json({ users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// PATCH update user role or status
router.patch('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    const target = db.getUserById(req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = db.updateUser(target.id, {
      ...(role && { role }),
    });

    const { passwordHash: _, ...safeUser } = updated!;
    return res.json({ user: safeUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH verify organization
router.patch('/verify-org/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { verified } = req.body;
    const user = db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = db.updateUser(user.id, {
      organizationDetails: {
        ...user.organizationDetails!,
        isVerified: verified === true,
        verifiedAt: verified ? new Date().toISOString() : undefined,
      },
    });

    // Notify user
    db.createNotification({
      userId: user.id,
      title: verified ? 'Organization Verified! 🎉' : 'Verification Update',
      message: verified
        ? 'Your organization has been officially verified on ShareBite. You now have priority food matching badges.'
        : 'Your verification status has been updated by an administrator.',
      type: 'org_verified',
      link: '/dashboard',
    });

    const { passwordHash: _, ...safeUser } = updated!;
    return res.json({ user: safeUser });
  } catch (error) {
    console.error('Error verifying organization:', error);
    return res.status(500).json({ error: 'Failed to update organization status' });
  }
});

// GET all food listings for admin moderation
router.get('/listings', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const listings = db.getListings();
    return res.json({ listings });
  } catch (error) {
    console.error('Error fetching admin listings:', error);
    return res.status(500).json({ error: 'Failed to retrieve listings' });
  }
});

// GET all food requests for admin oversight
router.get('/requests', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = db.getRequests();
    return res.json({ requests });
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    return res.status(500).json({ error: 'Failed to retrieve requests' });
  }
});

export default router;
