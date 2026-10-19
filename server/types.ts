export type UserRole = 'donor' | 'recipient' | 'organization' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  organizationDetails?: {
    orgName: string;
    registrationNumber: string;
    mission: string;
    website?: string;
    isVerified: boolean;
    verificationRequestedAt?: string;
    verifiedAt?: string;
  };
  avatarUrl?: string;
  mealsRescued: number;
  kgCO2Saved: number;
  createdAt: string;
  updatedAt: string;
}

export type FoodCategory =
  | 'Prepared Meals'
  | 'Bakery & Pastries'
  | 'Fresh Produce'
  | 'Dairy & Eggs'
  | 'Pantry & Dry Goods'
  | 'Beverages'
  | 'Snacks & Packaged';

export type FoodStatus = 'available' | 'requested' | 'accepted' | 'collected' | 'expired';

export type RescuePriority = 'Urgent' | 'High' | 'Normal';

export interface FoodListing {
  id: string;
  donorId: string;
  donorName: string;
  donorOrgName?: string;
  donorAvatar?: string;
  title: string;
  description: string;
  category: FoodCategory;
  quantity: number;
  unit: string; // e.g., 'portions', 'boxes', 'kg', 'platters', 'loaves'
  estimatedServings: number;
  dietaryTags: string[]; // e.g. 'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Nut-Free', 'Dairy-Free'
  status: FoodStatus;
  rescuePriority: RescuePriority;
  imageUrl: string;
  pickupAddress: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  expiryDate: string; // ISO string
  preparedAt?: string; // ISO string
  storageInstructions?: string;
  pickupTimeWindow: string; // e.g. "Today 2:00 PM - 6:00 PM"
  activeRequestId?: string;
  activeRecipientId?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'declined' | 'collected' | 'cancelled';

export type PickupTrackingStatus = 'accepted' | 'on_the_way' | 'arrived' | 'collected';

export interface LiveLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

export interface PickupSession {
  requestId: string;
  foodId: string;
  donorId: string;
  donorName: string;
  donorPhone?: string;
  recipientId: string;
  recipientName: string;
  trackingStatus: PickupTrackingStatus;
  receiverLocation?: LiveLocation;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    donorName: string;
  };
  isTrackingActive: boolean;
  distanceKm?: number;
  etaMinutes?: number;
  lastUpdated: string;
}

export interface FoodRequest {
  id: string;
  foodId: string;
  foodTitle: string;
  foodImageUrl: string;
  donorId: string;
  donorName: string;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  recipientOrgName?: string;
  requestedQuantity: number;
  unit: string;
  message: string;
  status: RequestStatus;
  trackingStatus?: PickupTrackingStatus;
  receiverLocation?: LiveLocation;
  pickupCode: string; // 6-digit confirmation PIN
  pickupTime?: string;
  acceptedAt?: string;
  collectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'request_new' | 'request_accepted' | 'request_declined' | 'food_collected' | 'food_expiring' | 'org_verified' | 'system';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface ImpactStats {
  totalMealsRescued: number;
  totalKgCO2Saved: number;
  totalDonors: number;
  totalOrganizations: number;
  activeListingsCount: number;
  rescuedListingsCount: number;
}
