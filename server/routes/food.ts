import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { FoodCategory, FoodStatus, RescuePriority } from '../types';

const router = Router();

// Fallback high-resolution food images by category (Indian Food)
const DEFAULT_CATEGORY_IMAGES: Record<FoodCategory, string> = {
  'Prepared Meals': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
  'Bakery & Pastries': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
  'Fresh Produce': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
  'Dairy & Eggs': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
  'Pantry & Dry Goods': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
  'Beverages': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
  'Snacks & Packaged': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
};

// Calculate Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// GET all food listings with filtering and sorting
router.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    let listings = db.getListings();

    const {
      search,
      category,
      status,
      dietary,
      priority,
      donorId,
      sortBy = 'distance',
      userLat,
      userLng,
      location,
      locality,
      city,
      radiusKm,
      filterLocationOnly,
    } = req.query as Record<string, string | undefined>;

    // Filter by donorId if requesting specific donor's posts
    if (donorId) {
      listings = listings.filter(l => l.donorId === donorId);
    }

    // Filter by status (default to active: 'available' or 'requested', unless specified or 'all')
    if (status && status !== 'all') {
      listings = listings.filter(l => l.status === status);
    } else if (!status && !donorId) {
      // By default show available and requested items on discover page
      listings = listings.filter(l => l.status === 'available' || l.status === 'requested');
    }

    // Location / Locality text filter
    const targetLoc = locality || location || city;
    if (targetLoc && targetLoc !== 'All Locations') {
      const lowerLoc = targetLoc.toLowerCase();

      // Check if user selected another major Indian city
      const OTHER_CITIES = [
        'mumbai',
        'bengaluru',
        'bangalore',
        'delhi',
        'hyderabad',
        'chennai',
        'jaipur',
        'ahmedabad',
        'indore',
        'chandigarh',
        'lucknow',
        'noida',
        'gurugram',
        'gurgaon',
      ];

      const matchedCity = OTHER_CITIES.find(c => lowerLoc.includes(c));

      if (matchedCity) {
        const cityFilterToken = matchedCity === 'bangalore' ? 'bengaluru' : matchedCity === 'gurgaon' ? 'gurugram' : matchedCity;
        const cityListings = listings.filter(l => l.city.toLowerCase().includes(cityFilterToken));
        if (cityListings.length > 0) {
          listings = cityListings;
        }
      } else if (lowerLoc.includes('jaipur') || [
        'vaishali nagar',
        'malviya nagar',
        'c-scheme',
        'mansarovar',
        'raja park',
        'bani park',
        'tonk road',
        'mi road',
        'jagatpura',
        'sitapura',
      ].some(loc => lowerLoc.includes(loc))) {
        // Target is in Jaipur
        const jaipurListings = listings.filter(l => l.city.toLowerCase().includes('jaipur'));
        if (jaipurListings.length > 0) {
          listings = jaipurListings;
        }

        // If specific locality filter is requested
        const JAIPUR_AREAS = [
          'vaishali nagar',
          'malviya nagar',
          'c-scheme',
          'mansarovar',
          'raja park',
          'bani park',
          'tonk road',
          'mi road',
          'jagatpura',
          'sitapura',
        ];
        const matchedArea = JAIPUR_AREAS.find(a => lowerLoc.includes(a));
        if (matchedArea && (filterLocationOnly === 'true')) {
          const areaListings = listings.filter(l =>
            l.pickupAddress.toLowerCase().includes(matchedArea) ||
            l.title.toLowerCase().includes(matchedArea)
          );
          if (areaListings.length > 0) {
            listings = areaListings;
          }
        }
      } else if (lowerLoc.includes('pune')) {
        const puneListings = listings.filter(l => l.city.toLowerCase().includes('pune'));
        if (puneListings.length > 0) {
          listings = puneListings;
        }
      }
    }

    // Search query - enhanced keyword search across title, description, category, dietary tags, address, and donor
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      listings = listings.filter(l => {
        const title = (l.title || '').toLowerCase();
        const desc = (l.description || '').toLowerCase();
        const cat = (l.category || '').toLowerCase();
        const city = (l.city || '').toLowerCase();
        const addr = (l.pickupAddress || '').toLowerCase();
        const donor = (l.donorName || '').toLowerCase();
        const org = (l.donorOrgName || '').toLowerCase();
        const tags = (l.dietaryTags || []).map(t => t.toLowerCase()).join(' ');
        const storage = (l.storageInstructions || '').toLowerCase();
        const combined = `${title} ${desc} ${cat} ${city} ${addr} ${donor} ${org} ${tags} ${storage}`;

        // Return true if combined string contains full query or all tokens
        return combined.includes(q) || tokens.every(token => combined.includes(token));
      });
    }

    // Category filter
    if (category && category !== 'All') {
      listings = listings.filter(l => l.category === category);
    }

    // Dietary filter - checks tags flexibly (e.g. 'Pure Veg', 'Vegetarian', 'Jain Friendly')
    if (dietary && dietary !== 'All') {
      const lowerDiet = dietary.toLowerCase();
      listings = listings.filter(l =>
        l.dietaryTags.some(t => {
          const lowerT = t.toLowerCase();
          return lowerT === lowerDiet || lowerT.includes(lowerDiet) || lowerDiet.includes(lowerT);
        })
      );
    }

    // Priority filter
    if (priority && priority !== 'All') {
      listings = listings.filter(l => l.rescuePriority === priority);
    }

    // Calculate distance if coordinates are available (Default: Vaishali Nagar, Jaipur)
    const uLat = userLat ? parseFloat(userLat) : req.user?.coordinates?.lat || 26.9157;
    const uLng = userLng ? parseFloat(userLng) : req.user?.coordinates?.lng || 75.7423;

    let listingsWithDistance = listings.map(item => {
      const distanceKm = calculateDistanceKm(
        uLat,
        uLng,
        item.coordinates.lat,
        item.coordinates.lng
      );
      return {
        ...item,
        distanceKm,
      };
    });

    // Radius filter (if requested, e.g. within 5 km, 15 km, 30 km)
    if (radiusKm && !isNaN(parseFloat(radiusKm))) {
      const maxR = parseFloat(radiusKm);
      listingsWithDistance = listingsWithDistance.filter(l => l.distanceKm <= maxR);
    }

    // Sorting
    listingsWithDistance.sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distanceKm - b.distanceKm;
      }
      if (sortBy === 'expiry_asc') {
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }
      if (sortBy === 'expiry_desc') {
        return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'servings') {
        return b.estimatedServings - a.estimatedServings;
      }
      return a.distanceKm - b.distanceKm;
    });

    return res.json({
      listings: listingsWithDistance,
      total: listingsWithDistance.length,
    });
  } catch (error) {
    console.error('Error fetching food listings:', error);
    return res.status(500).json({ error: 'Failed to retrieve food listings' });
  }
});

// Auto-detect user location via network/IP headers or geo lookup
router.get('/detect-location', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    // Check if valid public IP address (not localhost or internal)
    if (ip && ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('10.') && !ip.startsWith('192.168.') && !ip.startsWith('172.')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const geoRes = await fetch(`https://ipwho.is/${ip}`, { signal: controller.signal });
        clearTimeout(timeout);
        const geoData: any = await geoRes.json();
        if (geoData && geoData.success && geoData.latitude && geoData.longitude) {
          const detectedCity = geoData.city
            ? `${geoData.city}, ${geoData.region || geoData.country || 'India'}`
            : 'Jaipur, Rajasthan';
          return res.json({
            success: true,
            source: 'ip',
            coordinates: { lat: geoData.latitude, lng: geoData.longitude },
            city: detectedCity,
            accuracy: 1200,
          });
        }
      } catch {
        // Fallback below
      }
    }

    // Default Jaipur demo region when on localhost or private cloud network
    return res.json({
      success: true,
      source: 'default',
      coordinates: { lat: 26.9157, lng: 75.7423 },
      city: 'Vaishali Nagar, Jaipur',
      accuracy: 50,
    });
  } catch (error) {
    return res.json({
      success: true,
      source: 'fallback',
      coordinates: { lat: 26.9157, lng: 75.7423 },
      city: 'Vaishali Nagar, Jaipur',
      accuracy: 100,
    });
  }
});

// GET single food listing by ID
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const listing = db.getListingById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Food listing not found' });
    }

    const donor = db.getUserById(listing.donorId);
    const donorSafe = donor
      ? {
          id: donor.id,
          name: donor.name,
          email: donor.email,
          phone: donor.phone,
          role: donor.role,
          avatarUrl: donor.avatarUrl,
          organizationDetails: donor.organizationDetails,
          mealsRescued: donor.mealsRescued,
        }
      : null;

    let distanceKm = 1.2;
    if (req.user?.coordinates) {
      distanceKm = calculateDistanceKm(
        req.user.coordinates.lat,
        req.user.coordinates.lng,
        listing.coordinates.lat,
        listing.coordinates.lng
      );
    }

    return res.json({
      listing: { ...listing, distanceKm },
      donor: donorSafe,
    });
  } catch (error) {
    console.error('Error fetching listing details:', error);
    return res.status(500).json({ error: 'Failed to retrieve listing details' });
  }
});

// POST create food listing
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      title,
      description,
      category,
      quantity,
      unit,
      estimatedServings,
      dietaryTags = [],
      rescuePriority = 'High',
      imageUrl,
      pickupAddress,
      city = 'Jaipur, Rajasthan',
      coordinates,
      expiryDate,
      preparedAt,
      storageInstructions,
      pickupTimeWindow,
    } = req.body;

    if (!title || !category || !quantity || !unit || !expiryDate || !pickupAddress) {
      return res.status(400).json({
        error: 'Missing required listing fields: title, category, quantity, unit, expiryDate, pickupAddress',
      });
    }

    const foodCategory: FoodCategory = category;
    const priority: RescuePriority = rescuePriority;
    const finalImageUrl = imageUrl?.trim() || DEFAULT_CATEGORY_IMAGES[foodCategory] || DEFAULT_CATEGORY_IMAGES['Prepared Meals'];

    const newListing = db.createListing({
      donorId: user.id,
      donorName: user.name,
      donorOrgName: user.organizationDetails?.orgName,
      donorAvatar: user.avatarUrl,
      title: title.trim(),
      description: description || 'Fresh surplus food available for rescue.',
      category: foodCategory,
      quantity: Number(quantity),
      unit: unit.trim(),
      estimatedServings: Number(estimatedServings) || Number(quantity),
      dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
      status: 'available',
      rescuePriority: priority,
      imageUrl: finalImageUrl,
      pickupAddress: pickupAddress.trim(),
      city: city.trim(),
      coordinates: coordinates || user.coordinates || { lat: 18.5590, lng: 73.7868 },
      expiryDate: new Date(expiryDate).toISOString(),
      preparedAt: preparedAt ? new Date(preparedAt).toISOString() : new Date().toISOString(),
      storageInstructions: storageInstructions || 'Keep in clean, covered container at safe temperature.',
      pickupTimeWindow: pickupTimeWindow || 'Ready for immediate pickup',
    });

    // Notify registered organizations if this is an urgent or large listing
    if (priority === 'Urgent' || Number(estimatedServings) >= 15) {
      const orgUsers = db.getUsers().filter(u => u.role === 'organization');
      orgUsers.forEach(org => {
        db.createNotification({
          userId: org.id,
          title: `Urgent Food Rescue Available: ${newListing.title}`,
          message: `${user.name} posted ${newListing.quantity} ${newListing.unit} (${newListing.estimatedServings} servings). Requires pickup soon!`,
          type: 'request_new',
          link: `/food/${newListing.id}`,
        });
      });
    }

    return res.status(201).json({ listing: newListing });
  } catch (error) {
    console.error('Error creating food listing:', error);
    return res.status(500).json({ error: 'Failed to create food listing' });
  }
});

// PUT update food listing
router.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const listing = db.getListingById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.donorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own listings' });
    }

    const {
      title,
      description,
      category,
      quantity,
      unit,
      estimatedServings,
      dietaryTags,
      status,
      rescuePriority,
      imageUrl,
      pickupAddress,
      city,
      expiryDate,
      storageInstructions,
      pickupTimeWindow,
    } = req.body;

    const updated = db.updateListing(listing.id, {
      ...(title && { title }),
      ...(description && { description }),
      ...(category && { category }),
      ...(quantity !== undefined && { quantity: Number(quantity) }),
      ...(unit && { unit }),
      ...(estimatedServings !== undefined && { estimatedServings: Number(estimatedServings) }),
      ...(dietaryTags && { dietaryTags }),
      ...(status && { status }),
      ...(rescuePriority && { rescuePriority }),
      ...(imageUrl && { imageUrl }),
      ...(pickupAddress && { pickupAddress }),
      ...(city && { city }),
      ...(expiryDate && { expiryDate: new Date(expiryDate).toISOString() }),
      ...(storageInstructions && { storageInstructions }),
      ...(pickupTimeWindow && { pickupTimeWindow }),
    });

    return res.json({ listing: updated });
  } catch (error) {
    console.error('Error updating listing:', error);
    return res.status(500).json({ error: 'Failed to update listing' });
  }
});

// DELETE food listing
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const listing = db.getListingById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.donorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own listings' });
    }

    db.deleteListing(listing.id);
    return res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return res.status(500).json({ error: 'Failed to delete listing' });
  }
});

export default router;
