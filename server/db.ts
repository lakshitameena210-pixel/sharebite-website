import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  FoodListing,
  FoodRequest,
  AppNotification,
  ImpactStats,
  LiveLocation,
  PickupTrackingStatus,
  PickupSession,
} from './types';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return Math.round(R * c * 10) / 10;
}

export function estimateEtaMinutes(distanceKm: number): number {
  // Approximate average urban city speed: 20 km/h + 2 min buffer
  const mins = Math.round((distanceKm / 20) * 60) + 2;
  return Math.max(1, mins);
}

// Storage file path for persistence across dev server reloads
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  listings: FoodListing[];
  requests: FoodRequest[];
  notifications: AppNotification[];
}

// Initial seed data generator with authentic Indian food rescue data (Jaipur, Rajasthan, India)
export function getInitialSeedData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const donorHash = bcrypt.hashSync('donor123', salt);
  const ngoHash = bcrypt.hashSync('ngo123', salt);
  const userHash = bcrypt.hashSync('user123', salt);

  const now = new Date();
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

  const users: User[] = [
    {
      id: 'usr_admin',
      name: 'Ananya Joshi (Platform Admin)',
      email: 'admin@sharebite.org',
      passwordHash: adminHash,
      role: 'admin',
      phone: '+91 98230 45001',
      address: 'ShareBite Operations Hub, MI Road / C-Scheme',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9196, lng: 75.8160 },
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      mealsRescued: 1450,
      kgCO2Saved: 3625,
      createdAt: hoursAgo(720),
      updatedAt: hoursAgo(24),
    },
    {
      id: 'usr_donor1',
      name: 'Rohit Kulkarni',
      email: 'greenleaf@sharebite.org',
      passwordHash: donorHash,
      role: 'donor',
      phone: '+91 98901 23412',
      address: 'Shop 4, Amrapali Circle, Queens Road, Vaishali Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9157, lng: 75.7423 },
      organizationDetails: {
        orgName: 'Green Leaf Pure Veg Restaurant',
        registrationNumber: 'RJ-FSSAI-21422010000412',
        mission: 'Authentic Rajasthani & North Indian pure veg dining committed to zero daily kitchen waste.',
        website: 'https://greenleafjaipur.example.in',
        isVerified: true,
        verifiedAt: hoursAgo(400),
      },
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      mealsRescued: 540,
      kgCO2Saved: 1350,
      createdAt: hoursAgo(360),
      updatedAt: hoursAgo(5),
    },
    {
      id: 'usr_donor2',
      name: 'Priya Patel',
      email: 'annapurna.caterers@sharebite.org',
      passwordHash: donorHash,
      role: 'donor',
      phone: '+91 91580 87654',
      address: 'Plot 18, Calgiri Marg, Near WTP, Malviya Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8530, lng: 75.8052 },
      organizationDetails: {
        orgName: 'Annapurna Caterers & Banquet',
        registrationNumber: 'RJ-JPR-CAT-88902',
        mission: 'Providing royal banquet catering with immediate distribution channel for surplus wedding meals.',
        isVerified: true,
        verifiedAt: hoursAgo(200),
      },
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      mealsRescued: 820,
      kgCO2Saved: 2050,
      createdAt: hoursAgo(240),
      updatedAt: hoursAgo(10),
    },
    {
      id: 'usr_ngo1',
      name: 'Sneha Deshmukh',
      email: 'robinhood.jaipur@ngo.org',
      passwordHash: ngoHash,
      role: 'organization',
      phone: '+91 97654 32190',
      address: 'Community Center, Near Statue Circle, C-Scheme',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9080, lng: 75.8010 },
      organizationDetails: {
        orgName: 'Robin Hood Army (Jaipur Chapter)',
        registrationNumber: '80G-12A-RJ-JPR-00921',
        mission: 'Volunteer-driven food rescue army connecting restaurant surplus to night shelters and underprivileged children.',
        website: 'https://robinhoodarmy.com',
        isVerified: true,
        verifiedAt: hoursAgo(500),
      },
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      mealsRescued: 2180,
      kgCO2Saved: 5450,
      createdAt: hoursAgo(600),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'usr_user1',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.in',
      passwordHash: userHash,
      role: 'recipient',
      phone: '+91 98220 11984',
      address: 'Flat 302, Madhyam Marg, Sector 5, Mansarovar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8550, lng: 75.7600 },
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      mealsRescued: 42,
      kgCO2Saved: 105,
      createdAt: hoursAgo(120),
      updatedAt: hoursAgo(1),
    },
  ];

  const listings: FoodListing[] = [
    {
      id: 'food_1',
      donorId: 'usr_donor1',
      donorName: 'Rohit Kulkarni',
      donorOrgName: 'Green Leaf Pure Veg Restaurant',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Dum Vegetable Biryani & Cucumber Raita Handis',
      description: 'Slow-cooked aromatic basmati rice dum biryani loaded with fresh paneer, green peas, carrots, french beans and whole garam masala. Served with chilled spiced cucumber mint raita. Cooked for a corporate lunch event at 1:00 PM in food-grade steel handis.',
      category: 'Prepared Meals',
      quantity: 30,
      unit: 'plates',
      estimatedServings: 35,
      dietaryTags: ['Pure Veg', 'No Onion / Garlic Option', 'Gluten-Free Friendly'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Amrapali Circle, Queens Road, Vaishali Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9157, lng: 75.7423 },
      expiryDate: hoursFromNow(3.5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep covered in insulated containers above 60°C or refrigerate upon pickup.',
      pickupTimeWindow: 'Today between 3:00 PM - 6:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_2',
      donorId: 'usr_donor2',
      donorName: 'Priya Patel',
      donorOrgName: 'Annapurna Caterers & Banquet',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Freshly Baked Rotis, Dal Tadka & Paneer Butter Masala',
      description: 'Surplus wedding catering: 80 fresh wheat chapatis/phulkas brushed with pure ghee, 2 large vessels of yellow dal tadka with cumin garlic tempering, and rich paneer butter masala. Packed hygienically in insulated hot cases.',
      category: 'Prepared Meals',
      quantity: 50,
      unit: 'meals',
      estimatedServings: 50,
      dietaryTags: ['Pure Veg', 'North Indian Thali'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Near WTP, Calgiri Marg, Malviya Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8530, lng: 75.8052 },
      expiryDate: hoursFromNow(4.5),
      preparedAt: hoursAgo(3),
      storageInstructions: 'Hot food: Distribute directly or refrigerate immediately.',
      pickupTimeWindow: 'Today before 7:30 PM',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    {
      id: 'food_3',
      donorId: 'usr_donor1',
      donorName: 'Rohit Kulkarni',
      donorOrgName: 'Green Leaf Pure Veg Restaurant',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Steamed Idli, Medu Vada & Piping Hot Sambar',
      description: 'Morning breakfast buffet surplus: 45 soft steamed rice idlis, 25 crispy urad dal medu vadas, and 8 litres of vegetable lentil sambar with drumsticks and curry leaves. Packed in clean takeaway boxes.',
      category: 'Prepared Meals',
      quantity: 25,
      unit: 'boxes',
      estimatedServings: 35,
      dietaryTags: ['Pure Veg', 'South Indian', 'Gluten-Free Friendly'],
      status: 'available',
      rescuePriority: 'High',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Queens Road, Near Nursery Circle, Vaishali Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9140, lng: 75.7450 },
      expiryDate: hoursFromNow(6),
      storageInstructions: 'Best consumed today. Reheat sambar before serving.',
      pickupTimeWindow: 'Today 2:00 PM - 5:00 PM',
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(4),
    },
    {
      id: 'food_4',
      donorId: 'usr_donor2',
      donorName: 'Priya Patel',
      donorOrgName: 'Annapurna Caterers & Banquet',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Crispy Punjabi Samosas & Mint Green Chutney',
      description: 'Surplus evening high-tea order: 40 golden fried triangular samosas filled with spiced mashed potatoes, green peas and whole coriander seeds. Comes with fresh coriander-mint chutney.',
      category: 'Snacks & Packaged',
      quantity: 40,
      unit: 'pieces',
      estimatedServings: 25,
      dietaryTags: ['Pure Veg', 'Snacks'],
      status: 'requested',
      rescuePriority: 'High',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Annapurna Banquet Hall, Calgiri Marg, Malviya Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8530, lng: 75.8052 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Store in dry place. Re-crisp in oven if desired.',
      pickupTimeWindow: 'Today 4:00 PM - 6:30 PM',
      activeRequestId: 'req_1',
      activeRecipientId: 'usr_ngo1',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'food_5',
      donorId: 'usr_donor1',
      donorName: 'Rohit Kulkarni',
      donorOrgName: 'Green Leaf Pure Veg Restaurant',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Mumbai Style Pav Bhaji & Butter Toasted Ladi Pav',
      description: 'Spiced mashed mixed vegetable bhaji prepared with butter, capsicum, tomatoes and potatoes, paired with 60 fresh soft ladi pavs. Ideal for evening shelter dinner.',
      category: 'Prepared Meals',
      quantity: 30,
      unit: 'portions',
      estimatedServings: 30,
      dietaryTags: ['Pure Veg'],
      status: 'accepted',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Amrapali Circle, Vaishali Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9157, lng: 75.7423 },
      expiryDate: hoursFromNow(3),
      storageInstructions: 'Keep hot or reheat thoroughly before distribution.',
      pickupTimeWindow: 'Today 4:30 PM - 6:30 PM',
      activeRequestId: 'req_2',
      activeRecipientId: 'usr_user1',
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'food_6',
      donorId: 'usr_donor2',
      donorName: 'Priya Patel',
      donorOrgName: 'Annapurna Caterers & Banquet',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Fresh Alphonso Mangoes, Bananas & Orange Crates',
      description: 'Surplus fresh fruit salad supplies from breakfast event: ripe sweet Alphonso mangoes, fresh bananas, and seasonal oranges.',
      category: 'Fresh Produce',
      quantity: 15,
      unit: 'kg',
      estimatedServings: 40,
      dietaryTags: ['Pure Veg', 'Fresh Fruits', '100% Organic'],
      status: 'collected',
      rescuePriority: 'Normal',
      imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Gaurav Tower (GT) Road, Malviya Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8530, lng: 75.8052 },
      expiryDate: hoursAgo(1),
      storageInstructions: 'Room temperature ambient storage.',
      pickupTimeWindow: 'Yesterday afternoon',
      createdAt: hoursAgo(24),
      updatedAt: hoursAgo(4),
    },
    // C-Scheme & MI Road, Jaipur
    {
      id: 'food_w1',
      donorId: 'usr_donor1',
      donorName: 'Aman Verma',
      donorOrgName: 'Spice Route Kitchen (C-Scheme)',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Yellow Dal Tadka & Jeera Rice with Hot Phulkas',
      description: 'Freshly prepared homestyle yellow dal tadka tempered with cumin, garlic and ghee, served with fragrant cumin basmati rice and 40 soft wheat phulkas. Packaged in sanitized steel catering trays.',
      category: 'Prepared Meals',
      quantity: 35,
      unit: 'meals',
      estimatedServings: 35,
      dietaryTags: ['Pure Veg', 'North Indian Thali'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Statue Circle, Bhagwan Das Road, C-Scheme',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9080, lng: 75.8010 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Hot food: Distribute directly or refrigerate upon pickup.',
      pickupTimeWindow: 'Today 3:30 PM - 6:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_w2',
      donorId: 'usr_donor1',
      donorName: 'Neha Singh',
      donorOrgName: 'C-Scheme Community Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Spiced Kanda Batata Poha & Roasted Peanuts',
      description: 'Fresh light flattened rice poha cooked with mustard seeds, green chillies, curry leaves, turmeric and potatoes. Garnished with freshly grated coconut and coriander.',
      category: 'Prepared Meals',
      quantity: 25,
      unit: 'boxes',
      estimatedServings: 30,
      dietaryTags: ['Pure Veg', 'Gluten-Free Friendly'],
      status: 'available',
      rescuePriority: 'High',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Ahinsa Circle, Ashok Nagar, C-Scheme',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9110, lng: 75.8050 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(3),
      storageInstructions: 'Keep in dry container.',
      pickupTimeWindow: 'Today before 6:00 PM',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    {
      id: 'food_w3',
      donorId: 'usr_donor1',
      donorName: 'Arjun Mehta',
      donorOrgName: 'City Bites Café & Restaurant (MI Road)',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Paneer Makhani Curry & Laccha Parathas',
      description: 'Creamy tomato-butter gravy with soft cottage cheese cubes, accompanied by 30 flaky whole-wheat tandoori laccha parathas from lunch service.',
      category: 'Prepared Meals',
      quantity: 20,
      unit: 'portions',
      estimatedServings: 25,
      dietaryTags: ['Pure Veg'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'MI Road, Near Panch Batti',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9196, lng: 75.8160 },
      expiryDate: hoursFromNow(3.5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Store in insulated containers.',
      pickupTimeWindow: 'Today 4:00 PM - 7:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Mansarovar, Jaipur
    {
      id: 'food_h1',
      donorId: 'usr_donor2',
      donorName: 'Rahul Sharma',
      donorOrgName: 'Mansarovar Campus Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Corporate Buffet Rajma Chawal & Boondi Raita',
      description: 'Slow-simmered Punjabi red kidney beans in thick spiced tomato gravy with long-grain steamed basmati rice and fresh curd boondi raita. Prepared for institution cafeteria.',
      category: 'Prepared Meals',
      quantity: 45,
      unit: 'plates',
      estimatedServings: 50,
      dietaryTags: ['Pure Veg', 'North Indian'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Madhyam Marg, Sector 7, Mansarovar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8550, lng: 75.7600 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep hot or refrigerate within 2 hours.',
      pickupTimeWindow: 'Today 3:00 PM - 6:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_h2',
      donorId: 'usr_donor2',
      donorName: 'Sneha Deshmukh',
      donorOrgName: 'Tiffin Seva Kitchen (Mansarovar)',
      donorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'Mixed Vegetable Pulao & Sweet Gujarati Kadhi',
      description: 'Aromatic basmati rice cooked with fresh carrots, beans, peas, and whole spices, paired with traditional sweet yogurt kadhi tempered with mustard seeds and curry leaves.',
      category: 'Prepared Meals',
      quantity: 30,
      unit: 'servings',
      estimatedServings: 35,
      dietaryTags: ['Pure Veg', 'Jain Friendly'],
      status: 'available',
      rescuePriority: 'High',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Shipra Path, Near RIICO Metro, Mansarovar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8520, lng: 75.7580 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(3),
      storageInstructions: 'Reheat before serving.',
      pickupTimeWindow: 'Today 4:00 PM - 7:00 PM',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    {
      id: 'food_h3',
      donorId: 'usr_donor1',
      donorName: 'Rohit Kulkarni',
      donorOrgName: 'Mansarovar Community Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Fresh Wheat Chapatis, Moong Dal & Aloo Gobi',
      description: '50 freshly rolled wheat chapatis with ghee, yellow moong dal fry, and dry spiced cauliflower potato sabzi. Healthy wholesome meals prepared in clean kitchen.',
      category: 'Prepared Meals',
      quantity: 25,
      unit: 'meals',
      estimatedServings: 30,
      dietaryTags: ['Pure Veg'],
      status: 'available',
      rescuePriority: 'Normal',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Varun Path, Sector 3, Mansarovar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8580, lng: 75.7630 },
      expiryDate: hoursFromNow(6),
      preparedAt: hoursAgo(3),
      storageInstructions: 'Packaged in food-grade foil containers.',
      pickupTimeWindow: 'Today 5:00 PM - 8:00 PM',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    // Raja Park, Jaipur
    {
      id: 'food_v1',
      donorId: 'usr_donor1',
      donorName: 'Ananya Joshi',
      donorOrgName: 'Annapurna Seva Trust (Raja Park)',
      donorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      title: 'South Indian Lemon Rice & Creamy Curd Rice',
      description: 'Zesty turmeric lemon rice with crunchy peanuts and curry leaves, alongside cooling curd rice tempered with mustard, green chillies, and ginger. 40 neat lunch boxes.',
      category: 'Prepared Meals',
      quantity: 40,
      unit: 'boxes',
      estimatedServings: 40,
      dietaryTags: ['Pure Veg', 'South Indian', 'Gluten-Free Friendly'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'LBS College Marg, Raja Park',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8950, lng: 75.8280 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep curd rice cool or chilled.',
      pickupTimeWindow: 'Today 3:00 PM - 6:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_v2',
      donorId: 'usr_donor2',
      donorName: 'Priya Patel',
      donorOrgName: 'City Bites Bakery & Deli (Raja Park)',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Artisan Whole Wheat Bread Loaves & Vegetable Cutlets',
      description: 'Fresh bakery surplus: 12 loaves of whole wheat multigrain bread and 30 baked spiced vegetable patties made with potatoes, peas, and carrots.',
      category: 'Bakery & Pastries',
      quantity: 30,
      unit: 'pieces',
      estimatedServings: 25,
      dietaryTags: ['Pure Veg'],
      status: 'available',
      rescuePriority: 'Normal',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Fashion Street, Near Dhruv Marg, Raja Park',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8930, lng: 75.8260 },
      expiryDate: hoursFromNow(12),
      preparedAt: hoursAgo(4),
      storageInstructions: 'Ambient temperature dry storage.',
      pickupTimeWindow: 'Today until 9:00 PM',
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(4),
    },
    {
      id: 'food_v3',
      donorId: 'usr_donor1',
      donorName: 'Rohit Kulkarni',
      donorOrgName: 'Jaipur Meals Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'North Indian Thali: Shahi Paneer, Dal & Rotis',
      description: 'Complete meal thalis with rich cashew-based shahi paneer, slow-cooked black dal makhani, 3 phulkas, and basmati jeera rice. Surplus from private conference.',
      category: 'Prepared Meals',
      quantity: 35,
      unit: 'meals',
      estimatedServings: 35,
      dietaryTags: ['Pure Veg'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Tilak Nagar Link Road, Raja Park',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8970, lng: 75.8300 },
      expiryDate: hoursFromNow(3.5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Hot insulated box delivery ready.',
      pickupTimeWindow: 'Today 4:00 PM - 6:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Bani Park, Jaipur
    {
      id: 'food_kp1',
      donorId: 'usr_donor1',
      donorName: 'Aman Verma',
      donorOrgName: 'Green Table Artisan Bistro (Bani Park)',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Whole Wheat Pitta, Hummus & Green Salad Boxes',
      description: 'Artisanal freshly baked whole-wheat pitta bread pockets, homemade classic garlic hummus, marinated olives, and crunchy cucumber lettuce salad bowls.',
      category: 'Prepared Meals',
      quantity: 25,
      unit: 'boxes',
      estimatedServings: 25,
      dietaryTags: ['Pure Veg', 'Vegan', 'Gluten-Free Friendly'],
      status: 'available',
      rescuePriority: 'Normal',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Collectorate Circle, Madho Singh Road, Bani Park',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9280, lng: 75.7890 },
      expiryDate: hoursFromNow(6),
      preparedAt: hoursAgo(3),
      storageInstructions: 'Keep chilled below 10°C.',
      pickupTimeWindow: 'Today 4:00 PM - 7:30 PM',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    {
      id: 'food_kp2',
      donorId: 'usr_donor2',
      donorName: 'Neha Singh',
      donorOrgName: 'Bani Park Community Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Tandoori Paneer Tikka Kathi Rolls & Mint Chutney',
      description: 'Grilled paneer cubes marinated in yogurt and tandoori spices, rolled in roomali rotis with sliced red onions and tangy mint chutney. 30 ready wraps.',
      category: 'Prepared Meals',
      quantity: 30,
      unit: 'wraps',
      estimatedServings: 30,
      dietaryTags: ['Pure Veg'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Kanti Chandra Road, Bani Park',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9250, lng: 75.7860 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Consume hot.',
      pickupTimeWindow: 'Today 4:30 PM - 7:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Tonk Road, Jaipur
    {
      id: 'food_hd1',
      donorId: 'usr_donor1',
      donorName: 'Sneha Deshmukh',
      donorOrgName: 'Seva Kitchen Tonk Road',
      donorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'Pure Ghee Masala Khichdi with Roasted Papad',
      description: 'Comforting Moong dal and rice khichdi prepared with pure desi ghee, cumin, black pepper, ginger, and diced vegetables. Paired with 40 roasted papads.',
      category: 'Prepared Meals',
      quantity: 40,
      unit: 'portions',
      estimatedServings: 45,
      dietaryTags: ['Pure Veg', 'Gluten-Free Friendly'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Near Nehru Garden, Tonk Road',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8700, lng: 75.7950 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Serve hot.',
      pickupTimeWindow: 'Today 3:30 PM - 6:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_hd2',
      donorId: 'usr_donor2',
      donorName: 'Rohit Kulkarni',
      donorOrgName: 'Jaipur Food Bank (Tonk Road)',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Chapatis, Bhindi Masala & Homestyle Toor Dal',
      description: 'Fresh wheat chapatis (60 count), dry spiced okra (bhindi masala) cooked with onions and tomatoes, and comforting yellow toor dal with cumin tadka.',
      category: 'Prepared Meals',
      quantity: 30,
      unit: 'meals',
      estimatedServings: 35,
      dietaryTags: ['Pure Veg'],
      status: 'available',
      rescuePriority: 'High',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Near Gandhi Nagar Station, Tonk Road',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8720, lng: 75.7980 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(3),
      storageInstructions: 'Refrigerate if not consumed within 3 hours.',
      pickupTimeWindow: 'Today 4:00 PM - 7:00 PM',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    // Jagatpura & Sitapura, Jaipur
    {
      id: 'food_sn1',
      donorId: 'usr_donor1',
      donorName: 'Priya Patel',
      donorOrgName: 'Jaipur Meals Kitchen (Jagatpura)',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Authentic Rajasthani Dal Baati Churma & Gatte Ki Sabzi',
      description: 'Traditional wood-baked wheat baatis with pure desi ghee, pan-roasted churma, spicy five-lentil dal, and gram flour gatte curry in seasoned yogurt gravy. 35 portions.',
      category: 'Prepared Meals',
      quantity: 35,
      unit: 'portions',
      estimatedServings: 35,
      dietaryTags: ['Pure Veg', 'Rajasthani Special'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Near Akshay Patra Temple, Mahal Road, Jagatpura',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8220, lng: 75.8340 },
      expiryDate: hoursFromNow(3.5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep warm.',
      pickupTimeWindow: 'Today 3:00 PM - 6:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_sn2',
      donorId: 'usr_donor2',
      donorName: 'Arjun Mehta',
      donorOrgName: 'Pink City Seva Trust',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Spiced Poha & Adrak Masala Chai Flasks',
      description: 'Hot spiced onion-potato poha with fresh lemon wedges, alongside 5 litres of freshly brewed adrak wali chai in thermal flasks for community evening distribution.',
      category: 'Prepared Meals',
      quantity: 25,
      unit: 'servings',
      estimatedServings: 30,
      dietaryTags: ['Pure Veg'],
      status: 'available',
      rescuePriority: 'High',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Sitapura Industrial Area, Near RIICO, Jaipur',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.7820, lng: 75.8300 },
      expiryDate: hoursFromNow(4.5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Serve hot.',
      pickupTimeWindow: 'Today 4:00 PM - 6:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Mumbai, Maharashtra
    {
      id: 'food_mb1',
      donorId: 'usr_donor1',
      donorName: 'Rahul Sharma',
      donorOrgName: 'Mumbai Food Rescue (Dadar)',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Mumbai Special Butter Pav Bhaji & Tawa Pulao',
      description: 'Iconic street-style spicy vegetable bhaji cooked with Amul butter on giant iron tawa, paired with 60 soft ladi pavs and fragrant basmati tawa pulao.',
      category: 'Prepared Meals',
      quantity: 50,
      unit: 'plates',
      estimatedServings: 50,
      dietaryTags: ['Pure Veg', 'Mumbai Special'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Senapati Bapat Marg, Dadar West, Mumbai',
      city: 'Mumbai, Maharashtra',
      coordinates: { lat: 19.0178, lng: 72.8478 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Reheat bhaji before serving.',
      pickupTimeWindow: 'Today 4:00 PM - 7:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_mb2',
      donorId: 'usr_donor2',
      donorName: 'Sneha Deshmukh',
      donorOrgName: 'City Seva Trust Bandra',
      donorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'Fresh Fruit Bowls & Vegetable Club Sandwiches',
      description: 'Catering leftover from Bandra corporate event: 30 freshly packed triple-layer cheese vegetable sandwiches and 25 fruit bowls with pomegranate, papaya, and apples.',
      category: 'Snacks & Packaged',
      quantity: 30,
      unit: 'boxes',
      estimatedServings: 30,
      dietaryTags: ['Pure Veg'],
      status: 'available',
      rescuePriority: 'Normal',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Hill Road, Near Bandra Station, Bandra West, Mumbai',
      city: 'Mumbai, Maharashtra',
      coordinates: { lat: 19.0596, lng: 72.8295 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Refrigerate sandwiches.',
      pickupTimeWindow: 'Today 3:30 PM - 6:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Bengaluru, Karnataka
    {
      id: 'food_blr1',
      donorId: 'usr_donor1',
      donorName: 'Ananya Joshi',
      donorOrgName: 'Bangalore Annapurna Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      title: 'Authentic Karnataka Bisi Bele Bath & Boondi',
      description: 'Hot lentil-rice delicacy loaded with fresh shallots, carrots, drumstick, and aromatic home-ground bisi bele bath spice blend. Served with crunchy spicy kara boondi.',
      category: 'Prepared Meals',
      quantity: 45,
      unit: 'servings',
      estimatedServings: 50,
      dietaryTags: ['Pure Veg', 'Karnataka Traditional'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      pickupAddress: '100 Feet Road, Indiranagar, Bengaluru',
      city: 'Bengaluru, Karnataka',
      coordinates: { lat: 12.9784, lng: 77.6408 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep hot in sealed drums.',
      pickupTimeWindow: 'Today 3:00 PM - 6:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Delhi NCR
    {
      id: 'food_dl1',
      donorId: 'usr_donor2',
      donorName: 'Aman Verma',
      donorOrgName: 'Delhi Food Bank',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Delhi Style Rajma Chawal & Boondi Raita',
      description: 'Rich slow-cooked Jammu rajma in buttery onion-tomato masala with fluffy steamed basmati rice, mint coriander chutney, and pickled onions. 50 hearty plates.',
      category: 'Prepared Meals',
      quantity: 50,
      unit: 'plates',
      estimatedServings: 50,
      dietaryTags: ['Pure Veg', 'North Indian'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Inner Circle, Connaught Place, New Delhi',
      city: 'Delhi NCR',
      coordinates: { lat: 28.6304, lng: 77.2177 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Reheat before serving.',
      pickupTimeWindow: 'Today 3:30 PM - 6:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Hyderabad, Telangana
    {
      id: 'food_hyd1',
      donorId: 'usr_donor1',
      donorName: 'Rohit Kulkarni',
      donorOrgName: 'Deccan Kitchen Hyderabad',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Hyderabadi Dum Vegetable Biryani & Mirchi Salan',
      description: 'Fragrant saffron basmati rice dum cooked with spiced vegetables, mint, and fried onions. Served with traditional peanut-sesame mirchi ka salan and onion raita.',
      category: 'Prepared Meals',
      quantity: 60,
      unit: 'plates',
      estimatedServings: 60,
      dietaryTags: ['Pure Veg', 'Hyderabadi Special'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Road No 12, Banjara Hills, Hyderabad',
      city: 'Hyderabad, Telangana',
      coordinates: { lat: 17.4156, lng: 78.4352 },
      expiryDate: hoursFromNow(4.5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep in insulated handis.',
      pickupTimeWindow: 'Today 4:00 PM - 7:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Jaipur, Rajasthan
    {
      id: 'food_jpr1',
      donorId: 'usr_donor2',
      donorName: 'Priya Patel',
      donorOrgName: 'Jaipur Seva Samiti',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Rajasthani Dal Baati Churma with Pure Desi Ghee',
      description: 'Panchmel dal simmered with ghee tempering, 40 baked whole wheat baatis, sweet cardamom churma, and fiery garlic chutney from traditional wedding caterer.',
      category: 'Prepared Meals',
      quantity: 40,
      unit: 'portions',
      estimatedServings: 40,
      dietaryTags: ['Pure Veg', 'Rajasthani Traditional'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'MI Road, Near Raj Mandir, Jaipur',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9157, lng: 75.8189 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Store in dry warm container.',
      pickupTimeWindow: 'Today 4:00 PM - 7:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Ahmedabad, Gujarat
    {
      id: 'food_ahd1',
      donorId: 'usr_donor1',
      donorName: 'Arjun Mehta',
      donorOrgName: 'Ahmedabad Seva Trust',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Gujarati Kathiyawadi Thali: Ringan No Olo & Rotla',
      description: 'Smoky roasted eggplant mash (Ringan Olo), fresh bajra rotlas with white butter, sweet Gujarati khatti meethi toor dal, and steamed rice. 35 complete meals.',
      category: 'Prepared Meals',
      quantity: 35,
      unit: 'meals',
      estimatedServings: 35,
      dietaryTags: ['Pure Veg', 'Jain Friendly'],
      status: 'available',
      rescuePriority: 'High',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'CG Road, Navrangpura, Ahmedabad',
      city: 'Ahmedabad, Gujarat',
      coordinates: { lat: 23.0338, lng: 72.5620 },
      expiryDate: hoursFromNow(4.5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep in warm containers.',
      pickupTimeWindow: 'Today 4:30 PM - 7:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Chennai, Tamil Nadu
    {
      id: 'food_chn1',
      donorId: 'usr_donor1',
      donorName: 'Murugan Pillai',
      donorOrgName: 'Madras Seva Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Steamed Podi Idli, Curd Rice & Drumstick Sambar',
      description: 'Traditional South Indian lunch surplus: 50 ghee podi mini idlis, cooling tempered curd rice with pomegranate and mustard, and rich vegetable drumstick sambar.',
      category: 'Prepared Meals',
      quantity: 45,
      unit: 'plates',
      estimatedServings: 50,
      dietaryTags: ['Pure Veg', 'South Indian', 'Gluten-Free Friendly'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'T Nagar, Near Panagal Park, Chennai',
      city: 'Chennai, Tamil Nadu',
      coordinates: { lat: 13.0418, lng: 80.2341 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep sambar warm, curd rice cool.',
      pickupTimeWindow: 'Today 3:30 PM - 6:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Indore, Madhya Pradesh
    {
      id: 'food_ind1',
      donorId: 'usr_donor2',
      donorName: 'Vikas Sharma',
      donorOrgName: 'Sarafa Street Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Indori Poha with Sev & Jalebi Plate Combo',
      description: 'Famous steamed Indori poha with fennel seeds, jeeravan masala, crispy ratlami sev, and fresh sweet warm jalebis. 40 fresh morning boxes.',
      category: 'Prepared Meals',
      quantity: 40,
      unit: 'boxes',
      estimatedServings: 40,
      dietaryTags: ['Pure Veg', 'Indori Special'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Sarafa Bazaar, Near Rajwada, Indore',
      city: 'Indore, Madhya Pradesh',
      coordinates: { lat: 22.7196, lng: 75.8577 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Dry clean packaging.',
      pickupTimeWindow: 'Today 4:00 PM - 7:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Chandigarh
    {
      id: 'food_chd1',
      donorId: 'usr_donor1',
      donorName: 'Gurpreet Singh',
      donorOrgName: 'Langar Seva Trust Chandigarh',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Dal Makhani, Shahi Paneer & Tandoori Rotis',
      description: 'Slow-cooked black lentils in butter and cream, spiced royal paneer gravy, and 60 whole-wheat tandoori rotis from community lunch gathering.',
      category: 'Prepared Meals',
      quantity: 50,
      unit: 'meals',
      estimatedServings: 50,
      dietaryTags: ['Pure Veg', 'Punjabi Special'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Sector 17 Plaza, Chandigarh',
      city: 'Chandigarh',
      coordinates: { lat: 30.7333, lng: 76.7794 },
      expiryDate: hoursFromNow(4.5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Insulated hot containers.',
      pickupTimeWindow: 'Today 4:00 PM - 7:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Lucknow, Uttar Pradesh
    {
      id: 'food_lko1',
      donorId: 'usr_donor2',
      donorName: 'Mohd. Rizwan',
      donorOrgName: 'Awadh Dastarkhwan Seva',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Awadhi Veg Biryani & Mughlai Dal Sultani',
      description: 'Fragrant saffron basmati dum rice with dry fruits, vegetables, and rich smoked toor dal sultani tempered with clove and desi ghee. 40 portions.',
      category: 'Prepared Meals',
      quantity: 40,
      unit: 'portions',
      estimatedServings: 40,
      dietaryTags: ['Pure Veg', 'Awadhi Special'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Hazratganj, Near Mayfair, Lucknow',
      city: 'Lucknow, Uttar Pradesh',
      coordinates: { lat: 26.8467, lng: 80.9462 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep in warm sealed handis.',
      pickupTimeWindow: 'Today 4:30 PM - 7:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Noida, Uttar Pradesh
    {
      id: 'food_nda1',
      donorId: 'usr_donor1',
      donorName: 'Pooja Tiwari',
      donorOrgName: 'Noida Community Food Drive',
      donorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      title: 'Paneer Lababdar with Butter Naan & Steamed Rice',
      description: 'Corporate catering surplus from Sector 62 tech park: 35 plates of velvety cottage cheese in creamy tomato onion gravy with fresh bread.',
      category: 'Prepared Meals',
      quantity: 35,
      unit: 'plates',
      estimatedServings: 35,
      dietaryTags: ['Pure Veg'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Sector 62, Near Electronic City Metro, Noida',
      city: 'Noida, Uttar Pradesh',
      coordinates: { lat: 28.5355, lng: 77.3910 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Reheat before distribution.',
      pickupTimeWindow: 'Today 3:30 PM - 6:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // Gurugram, Haryana
    {
      id: 'food_ggn1',
      donorId: 'usr_donor2',
      donorName: 'Aditya Kapoor',
      donorOrgName: 'Gurugram Cyber Hub Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Healthy Sprouted Moong Bowls & Artisan Multigrain Sandwiches',
      description: 'Fresh tech cafeteria surplus: 30 zesty lemon-pomegranate sprout chaat bowls and 25 grilled vegetable hummus multigrain sandwiches.',
      category: 'Snacks & Packaged',
      quantity: 30,
      unit: 'boxes',
      estimatedServings: 30,
      dietaryTags: ['Pure Veg', 'Healthy & Organic'],
      status: 'available',
      rescuePriority: 'Normal',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Cyber Hub, DLF Phase 2, Gurugram',
      city: 'Gurugram, Haryana',
      coordinates: { lat: 28.4595, lng: 77.0266 },
      expiryDate: hoursFromNow(6),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Keep in cool storage.',
      pickupTimeWindow: 'Today 4:00 PM - 8:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    // New Delicious Available Food Options
    {
      id: 'food_opt1',
      donorId: 'usr_donor1',
      donorName: 'Rohit Kulkarni',
      donorOrgName: 'Green Leaf Pure Veg Restaurant',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Royal Dal Makhani, Jeera Basmati Rice & Garlic Naan',
      description: 'Creamy slow-simmered 12-hour black dal makhani cooked with fresh butter and cream, accompanied by long-grain cumin basmati rice and 35 warm clay-oven tandoori garlic naans. Prepared for dinner banquet.',
      category: 'Prepared Meals',
      quantity: 35,
      unit: 'meals',
      estimatedServings: 40,
      dietaryTags: ['Pure Veg', 'North Indian'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Amrapali Circle, Queens Road, Vaishali Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9157, lng: 75.7423 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(1),
      storageInstructions: 'Packaged in insulated thermal catering containers. Keep warm above 60°C.',
      pickupTimeWindow: 'Today 4:00 PM - 7:30 PM',
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'food_opt2',
      donorId: 'usr_donor2',
      donorName: 'Priya Patel',
      donorOrgName: 'Annapurna Caterers & Banquet',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Artisan Sourdough Loaves, Croissants & Sweet Brioche Buns',
      description: 'Fresh evening bakery surplus from gourmet patisserie: 18 crusty artisan sourdough loaves, 25 flaky butter croissants, and 30 soft brioche buns. Baked fresh this morning.',
      category: 'Bakery & Pastries',
      quantity: 45,
      unit: 'pieces',
      estimatedServings: 45,
      dietaryTags: ['Pure Veg', 'Bakery Fresh'],
      status: 'available',
      rescuePriority: 'Normal',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Calgiri Marg, Near World Trade Park (WTP), Malviya Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8530, lng: 75.8052 },
      expiryDate: hoursFromNow(14),
      preparedAt: hoursAgo(3),
      storageInstructions: 'Store in dry ambient temperature. Ready for distribution.',
      pickupTimeWindow: 'Today until 9:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_opt3',
      donorId: 'usr_donor1',
      donorName: 'Aman Verma',
      donorOrgName: 'Spice Route Kitchen (C-Scheme)',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Fresh Farm Vegetable Crates (Spinach, Tomatoes, Carrots & Bell Peppers)',
      description: 'Organically grown fresh surplus vegetable crates from morning farmers delivery: crisp farm palak (spinach), ripe desi tomatoes, sweet winter carrots, and colorful bell peppers. Perfect for shelter community kitchens.',
      category: 'Fresh Produce',
      quantity: 28,
      unit: 'kg',
      estimatedServings: 60,
      dietaryTags: ['Pure Veg', '100% Organic', 'Gluten-Free', 'Vegan'],
      status: 'available',
      rescuePriority: 'Normal',
      imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Statue Circle, Bhagwan Das Road, C-Scheme',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9080, lng: 75.8010 },
      expiryDate: hoursFromNow(24),
      preparedAt: hoursAgo(4),
      storageInstructions: 'Store in cool ventilated vegetable crates.',
      pickupTimeWindow: 'Today 3:00 PM - 8:00 PM',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    {
      id: 'food_opt4',
      donorId: 'usr_donor2',
      donorName: 'Sneha Deshmukh',
      donorOrgName: 'Tiffin Seva Kitchen (Mansarovar)',
      donorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'Fresh Paneer Blocks, Spiced Chaas (Buttermilk) & Sweet Lassi Bottles',
      description: 'Surplus cold-chain dairy stock: 15 kg vacuum-sealed fresh malai paneer blocks, 40 chilled bottles of jeera-mint masala buttermilk (chaas), and 20 bottles of rich saffron sweet lassi.',
      category: 'Dairy & Eggs',
      quantity: 40,
      unit: 'bottles/kg',
      estimatedServings: 55,
      dietaryTags: ['Pure Veg', 'Rich Protein', 'Probiotic'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Madhyam Marg, Sector 5, Mansarovar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8550, lng: 75.7600 },
      expiryDate: hoursFromNow(8),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Refrigerate immediately between 2°C - 5°C.',
      pickupTimeWindow: 'Today 3:30 PM - 7:00 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_opt5',
      donorId: 'usr_donor1',
      donorName: 'Rohit Kulkarni',
      donorOrgName: 'Green Leaf Pure Veg Restaurant',
      donorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: 'Steamed Basmati Rice, Whole Wheat Atta & Yellow Moong Dal Bags',
      description: 'Dry pantry inventory surplus: 5 sealed 5kg bags of aged Kohinoor basmati rice, 4 bags of premium MP Sharbati wheat flour (atta), and 10kg yellow split moong dal.',
      category: 'Pantry & Dry Goods',
      quantity: 20,
      unit: 'bags',
      estimatedServings: 120,
      dietaryTags: ['Pure Veg', 'Dry Pantry', 'High Shelf Life'],
      status: 'available',
      rescuePriority: 'Normal',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Queens Road, Near Nursery Circle, Vaishali Nagar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9140, lng: 75.7450 },
      expiryDate: hoursFromNow(72),
      preparedAt: hoursAgo(6),
      storageInstructions: 'Dry sealed ambient storage away from moisture.',
      pickupTimeWindow: 'Today & Tomorrow 10:00 AM - 8:00 PM',
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(4),
    },
    {
      id: 'food_opt6',
      donorId: 'usr_donor2',
      donorName: 'Priya Patel',
      donorOrgName: 'City Bites Bakery & Deli (Raja Park)',
      donorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'Fresh Mango Mint Mojitos, Cold Pressed Juices & Lemon Iced Teas',
      description: 'Chilled beverage surplus from afternoon private gathering: 30 bottles of fresh Alphonso mango mint coolers, 20 bottles of cold-pressed orange-carrot juice, and 25 fresh brewed lemon iced teas.',
      category: 'Beverages',
      quantity: 50,
      unit: 'bottles',
      estimatedServings: 50,
      dietaryTags: ['Pure Veg', 'Refreshing Drinks', 'Vegan'],
      status: 'available',
      rescuePriority: 'High',
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Fashion Street, Near Dhruv Marg, Raja Park',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8930, lng: 75.8260 },
      expiryDate: hoursFromNow(6),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Chilled insulated icebox containers.',
      pickupTimeWindow: 'Today 4:00 PM - 7:30 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
    {
      id: 'food_opt7',
      donorId: 'usr_donor1',
      donorName: 'Aman Verma',
      donorOrgName: 'Green Table Artisan Bistro (Bani Park)',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Steaming Veg Momos, Schezwan Dip & Crispy Spring Rolls',
      description: 'Hot appetizer buffet surplus: 50 steamed Himalayan vegetable momos stuffed with cabbage, carrots and tofu, with authentic fire spicy red garlic dip, and 30 golden crispy spring rolls.',
      category: 'Snacks & Packaged',
      quantity: 40,
      unit: 'portions',
      estimatedServings: 40,
      dietaryTags: ['Pure Veg', 'Asian Snacks'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Collectorate Circle, Madho Singh Road, Bani Park',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.9280, lng: 75.7890 },
      expiryDate: hoursFromNow(4),
      preparedAt: hoursAgo(1.5),
      storageInstructions: 'Keep in bamboo steamers or covered insulated containers.',
      pickupTimeWindow: 'Today 4:30 PM - 7:00 PM',
      createdAt: hoursAgo(1.5),
      updatedAt: hoursAgo(1.5),
    },
    {
      id: 'food_opt8',
      donorId: 'usr_donor2',
      donorName: 'Rahul Sharma',
      donorOrgName: 'Mansarovar Campus Kitchen',
      donorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      title: 'Spicy Chana Masala, Fluffy Bhature & Pickled Onions',
      description: 'North Indian festive lunch surplus: 45 portions of rich spiced Amritsari chana masala in dark aromatic tea-infused gravy with 80 soft fluffy bhatures and sweet pickled green chilli onions.',
      category: 'Prepared Meals',
      quantity: 45,
      unit: 'meals',
      estimatedServings: 50,
      dietaryTags: ['Pure Veg', 'North Indian'],
      status: 'available',
      rescuePriority: 'Urgent',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
      pickupAddress: 'Shipra Path, Near RIICO Metro, Mansarovar',
      city: 'Jaipur, Rajasthan',
      coordinates: { lat: 26.8520, lng: 75.7580 },
      expiryDate: hoursFromNow(5),
      preparedAt: hoursAgo(2),
      storageInstructions: 'Serve hot or reheat chana before consumption.',
      pickupTimeWindow: 'Today 3:45 PM - 6:45 PM',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    }
  ];

  const requests: FoodRequest[] = [
    {
      id: 'req_1',
      foodId: 'food_4',
      foodTitle: 'Crispy Punjabi Samosas & Mint Green Chutney',
      foodImageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
      donorId: 'usr_donor2',
      donorName: 'Priya Patel',
      recipientId: 'usr_ngo1',
      recipientName: 'Sneha Deshmukh',
      recipientRole: 'organization',
      recipientOrgName: 'Robin Hood Army (Jaipur Chapter)',
      requestedQuantity: 40,
      unit: 'pieces',
      message: 'Namaste Priya ji! Our evening volunteer food distribution team is heading to the community near Malviya Nagar at 5:00 PM. We can immediately distribute all 40 samosas to the children.',
      status: 'pending',
      pickupCode: '492815',
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'req_2',
      foodId: 'food_5',
      foodTitle: 'Mumbai Style Pav Bhaji & Butter Toasted Ladi Pav',
      foodImageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80',
      donorId: 'usr_donor1',
      donorName: 'Rohit Kulkarni',
      recipientId: 'usr_user1',
      recipientName: 'Rahul Sharma',
      recipientRole: 'recipient',
      requestedQuantity: 10,
      unit: 'portions',
      message: 'Hello Rohit, I live in Mansarovar and will pass through Vaishali Nagar at 5:15 PM. Will collect 10 portions for our building security staff and cleaning crew. Have hot dabbas ready.',
      status: 'accepted',
      pickupCode: '731902',
      pickupTime: 'Today at 5:15 PM',
      acceptedAt: hoursAgo(1),
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(1),
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif_1',
      userId: 'usr_donor2',
      title: 'New Food Rescue Request',
      message: 'Robin Hood Army Jaipur requested 40 pieces from "Crispy Punjabi Samosas".',
      type: 'request_new',
      link: '/dashboard',
      read: false,
      createdAt: hoursAgo(1),
    },
    {
      id: 'notif_2',
      userId: 'usr_user1',
      title: 'Request Accepted by Green Leaf Pure Veg',
      message: 'Rohit Kulkarni accepted your request for 10 portions of Pav Bhaji. Your pickup verification PIN is 731902.',
      type: 'request_accepted',
      link: '/dashboard',
      read: false,
      createdAt: hoursAgo(1),
    },
    {
      id: 'notif_3',
      userId: 'usr_ngo1',
      title: 'Verified Non-Profit NGO Badge Active',
      message: 'Welcome to ShareBite Jaipur Verified Charity Partners. You now receive priority notifications for bulk wedding & catering rescues.',
      type: 'org_verified',
      link: '/dashboard',
      read: true,
      createdAt: hoursAgo(48),
    },
    {
      id: 'notif_4',
      userId: 'usr_donor1',
      title: 'Urgent Expiry Alert (Jaipur)',
      message: 'Dum Vegetable Biryani Handis in Vaishali Nagar expires in 3.5 hours. Local NGO volunteers alerted.',
      type: 'food_expiring',
      link: '/food/food_1',
      read: false,
      createdAt: hoursAgo(0.5),
    }
  ];

  return { users, listings, requests, notifications };
}

// In-Memory database with disk sync
class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    this.updateExpiredListings();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.listings) {
          // Merge any newly defined seed listings so all localities and cities have available food
          const initial = getInitialSeedData();
          const existingIds = new Set(parsed.listings.map((l: any) => l.id));
          let changed = false;
          for (const item of initial.listings) {
            if (!existingIds.has(item.id)) {
              parsed.listings.push(item);
              changed = true;
            }
          }
          if (changed) {
            this.saveData(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to read db.json, generating fresh seed data:', err);
    }

    const initial = getInitialSeedData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  public updateExpiredListings() {
    const now = new Date();
    let changed = false;

    // Check if there are active food listings available for users to rescue
    const activeCount = this.data.listings.filter(
      l => l.status === 'available' && new Date(l.expiryDate) > now
    ).length;

    // If active listings are getting low or have passed timestamp in a long-running demo instance,
    // refresh expiry dates for our standard available seed food options so users always see available food!
    if (activeCount < 10) {
      this.data.listings.forEach(listing => {
        if (listing.status === 'available' || listing.status === 'expired') {
          // If expired or expiring in under 1 hour, advance expiry window into the future
          const expiryTime = new Date(listing.expiryDate).getTime();
          if (isNaN(expiryTime) || expiryTime <= now.getTime() + 3600 * 1000) {
            listing.status = 'available';
            listing.expiryDate = new Date(now.getTime() + (4 + (Math.abs(listing.id.charCodeAt(listing.id.length - 1)) % 12)) * 3600 * 1000).toISOString();
            listing.preparedAt = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
            listing.updatedAt = now.toISOString();
            changed = true;
          }
        }
      });
    } else {
      this.data.listings.forEach(listing => {
        if (listing.status === 'available' || listing.status === 'requested') {
          if (new Date(listing.expiryDate) < now) {
            listing.status = 'expired';
            listing.updatedAt = now.toISOString();
            changed = true;
          }
        }
      });
    }

    if (changed) {
      this.saveData();
    }
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'mealsRescued' | 'kgCO2Saved'>): User {
    const newUser: User = {
      ...userData,
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      mealsRescued: 0,
      kgCO2Saved: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data.users[idx];
  }

  deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.saveData();
    return true;
  }

  // Food Listings
  getListings(): FoodListing[] {
    this.updateExpiredListings();
    return this.data.listings;
  }

  getListingById(id: string): FoodListing | undefined {
    this.updateExpiredListings();
    return this.data.listings.find(l => l.id === id);
  }

  createListing(listingData: Omit<FoodListing, 'id' | 'createdAt' | 'updatedAt'>): FoodListing {
    const newListing: FoodListing = {
      ...listingData,
      id: 'food_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.listings.unshift(newListing);
    this.saveData();
    return newListing;
  }

  updateListing(id: string, updates: Partial<FoodListing>): FoodListing | null {
    const idx = this.data.listings.findIndex(l => l.id === id);
    if (idx === -1) return null;
    this.data.listings[idx] = {
      ...this.data.listings[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data.listings[idx];
  }

  deleteListing(id: string): boolean {
    const idx = this.data.listings.findIndex(l => l.id === id);
    if (idx === -1) return false;
    this.data.listings.splice(idx, 1);
    this.saveData();
    return true;
  }

  // Requests
  getRequests(): FoodRequest[] {
    return this.data.requests;
  }

  getRequestById(id: string): FoodRequest | undefined {
    return this.data.requests.find(r => r.id === id);
  }

  createRequest(reqData: Omit<FoodRequest, 'id' | 'createdAt' | 'updatedAt' | 'pickupCode'>): FoodRequest {
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newReq: FoodRequest = {
      ...reqData,
      id: 'req_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      pickupCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.requests.unshift(newReq);

    this.updateListing(newReq.foodId, {
      status: 'requested',
      activeRequestId: newReq.id,
      activeRecipientId: newReq.recipientId,
    });

    this.createNotification({
      userId: newReq.donorId,
      title: 'New Food Rescue Request',
      message: `${newReq.recipientName} has requested ${newReq.requestedQuantity} ${newReq.unit} of "${newReq.foodTitle}".`,
      type: 'request_new',
      link: '/dashboard',
    });

    this.saveData();
    return newReq;
  }

  updateRequest(id: string, updates: Partial<FoodRequest>): FoodRequest | null {
    const idx = this.data.requests.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.requests[idx] = {
      ...this.data.requests[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If collected or cancelled, immediately purge live coordinates
    if (updates.status === 'collected' || updates.status === 'cancelled') {
      this.clearPickupSession(id);
      delete this.data.requests[idx].receiverLocation;
    }

    this.saveData();
    return this.data.requests[idx];
  }

  // Active pickup sessions (ephemeral, minimal storage, discarded upon collection)
  private activePickupSessions: Map<string, PickupSession> = new Map();

  getOrCreatePickupSession(requestId: string): PickupSession | null {
    if (this.activePickupSessions.has(requestId)) {
      return this.activePickupSessions.get(requestId)!;
    }

    const request = this.getRequestById(requestId);
    if (!request) return null;

    const listing = this.getListingById(request.foodId);
    const donor = this.getUserById(request.donorId);

    const pickupLocation = {
      lat: listing?.coordinates?.lat || 26.9157,
      lng: listing?.coordinates?.lng || 75.7423,
      address: listing?.pickupAddress || 'Amrapali Circle, Vaishali Nagar',
      city: listing?.city || 'Jaipur, Rajasthan',
      donorName: listing?.donorOrgName || listing?.donorName || donor?.name || 'Food Donor',
    };

    const recipient = this.getUserById(request.recipientId);
    const initialReceiverLoc: LiveLocation | undefined = request.receiverLocation || (recipient?.coordinates ? {
      lat: recipient.coordinates.lat,
      lng: recipient.coordinates.lng,
      updatedAt: new Date().toISOString(),
    } : undefined);

    let distanceKm: number | undefined;
    let etaMinutes: number | undefined;
    if (initialReceiverLoc) {
      distanceKm = calculateDistanceKm(initialReceiverLoc.lat, initialReceiverLoc.lng, pickupLocation.lat, pickupLocation.lng);
      etaMinutes = estimateEtaMinutes(distanceKm);
    }

    const session: PickupSession = {
      requestId: request.id,
      foodId: request.foodId,
      donorId: request.donorId,
      donorName: request.donorName,
      donorPhone: donor?.phone,
      recipientId: request.recipientId,
      recipientName: request.recipientName,
      trackingStatus: (request.trackingStatus || (request.status === 'collected' ? 'collected' : (request.status as PickupTrackingStatus) || 'accepted')),
      receiverLocation: initialReceiverLoc,
      pickupLocation,
      isTrackingActive: request.status !== 'collected',
      distanceKm,
      etaMinutes,
      lastUpdated: new Date().toISOString(),
    };

    this.activePickupSessions.set(requestId, session);
    return session;
  }

  updatePickupLocation(requestId: string, location: LiveLocation): PickupSession | null {
    const session = this.getOrCreatePickupSession(requestId);
    if (!session) return null;

    session.receiverLocation = {
      ...location,
      updatedAt: new Date().toISOString(),
    };
    session.isTrackingActive = true;

    if (session.pickupLocation) {
      const dist = calculateDistanceKm(
        location.lat,
        location.lng,
        session.pickupLocation.lat,
        session.pickupLocation.lng
      );
      session.distanceKm = dist;
      session.etaMinutes = estimateEtaMinutes(dist);

      // Auto-detect arrival if within 100 meters
      if (dist <= 0.1 && session.trackingStatus === 'on_the_way') {
        session.trackingStatus = 'arrived';
        this.updateRequest(requestId, { status: 'arrived', trackingStatus: 'arrived' });
      }
    }

    session.lastUpdated = new Date().toISOString();
    this.activePickupSessions.set(requestId, session);

    const req = this.getRequestById(requestId);
    if (req) {
      req.receiverLocation = session.receiverLocation;
      req.trackingStatus = session.trackingStatus;
    }

    return session;
  }

  updatePickupTrackingStatus(requestId: string, status: PickupTrackingStatus): PickupSession | null {
    const session = this.getOrCreatePickupSession(requestId);
    if (!session) return null;

    session.trackingStatus = status;
    session.lastUpdated = new Date().toISOString();

    if (status === 'collected') {
      session.isTrackingActive = false;
      this.clearPickupSession(requestId);
    } else {
      this.activePickupSessions.set(requestId, session);
    }

    this.updateRequest(requestId, {
      status: status as any,
      trackingStatus: status,
    });

    return session;
  }

  stopPickupTracking(requestId: string): PickupSession | null {
    const session = this.activePickupSessions.get(requestId);
    if (!session) return null;

    session.isTrackingActive = false;
    delete session.receiverLocation;
    session.lastUpdated = new Date().toISOString();

    const req = this.getRequestById(requestId);
    if (req) {
      delete req.receiverLocation;
    }

    return session;
  }

  clearPickupSession(requestId: string): void {
    const session = this.activePickupSessions.get(requestId);
    if (session) {
      delete session.receiverLocation;
    }
    this.activePickupSessions.delete(requestId);
  }

  // Notifications
  getNotifications(userId: string): AppNotification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(notifData: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notifData,
      id: 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    this.saveData();
    return newNotif;
  }

  markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.saveData();
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead(userId: string): boolean {
    let changed = false;
    this.data.notifications.forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) this.saveData();
    return changed;
  }

  // Global Impact Stats
  getImpactStats(): ImpactStats {
    let totalMeals = 0;
    let totalKgCO2 = 0;

    this.data.users.forEach(u => {
      totalMeals += u.mealsRescued;
      totalKgCO2 += u.kgCO2Saved;
    });

    const donors = this.data.users.filter(u => u.role === 'donor').length;
    const orgs = this.data.users.filter(u => u.role === 'organization').length;
    const active = this.data.listings.filter(l => l.status === 'available' || l.status === 'requested').length;
    const rescued = this.data.listings.filter(l => l.status === 'collected').length;

    return {
      totalMealsRescued: Math.max(totalMeals, 12480),
      totalKgCO2Saved: Math.max(totalKgCO2, 3240),
      totalDonors: Math.max(donors, 420),
      totalOrganizations: Math.max(orgs, 48),
      activeListingsCount: active,
      rescuedListingsCount: Math.max(rescued, 2850),
    };
  }

  // Reset demo data
  resetSeedData(): void {
    this.data = getInitialSeedData();
    this.saveData();
  }
}

export const db = new DatabaseService();
