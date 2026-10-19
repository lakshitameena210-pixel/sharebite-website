import {
  User,
  FoodListing,
  FoodRequest,
  AppNotification,
  ImpactStats,
  AISuggestion,
  RequestStatus,
  PickupSession,
  PickupTrackingStatus,
} from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('sharebite_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email?: string; username?: string; password: string }) => request<{ user: User; token: string; isNewUser?: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  demoLogin: (role: string) => request<{ user: User; token: string }>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request<{ user: User; unreadNotificationsCount: number }>('/auth/me'),
  updateProfile: (body: any) => request<{ user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Food
  detectLocation: () =>
    request<{
      success: boolean;
      source: string;
      coordinates: { lat: number; lng: number };
      city: string;
      accuracy: number;
    }>('/food/detect-location'),
  getListings: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ listings: FoodListing[]; total: number }>(`/food${query ? `?${query}` : ''}`);
  },
  getListingById: (id: string) => request<{ listing: FoodListing; donor: Partial<User> | null }>(`/food/${id}`),
  createListing: (body: any) => request<{ listing: FoodListing }>('/food', { method: 'POST', body: JSON.stringify(body) }),
  updateListing: (id: string, body: any) => request<{ listing: FoodListing }>(`/food/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteListing: (id: string) => request<{ success: boolean }>(`/food/${id}`, { method: 'DELETE' }),

  // Requests
  createRequest: (body: { foodId: string; requestedQuantity: number; message: string; pickupTime?: string }) =>
    request<{ request: FoodRequest }>('/requests', { method: 'POST', body: JSON.stringify(body) }),
  getMyRequests: () => request<{ requests: FoodRequest[] }>('/requests/my'),
  getDonorRequests: () => request<{ requests: FoodRequest[] }>('/requests/donor'),
  updateRequestStatus: (id: string, status: RequestStatus, pickupPin?: string) =>
    request<{ request: FoodRequest }>(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, pickupPin }),
    }),

  // Live Pickup Tracking
  getPickupTracking: (requestId: string) =>
    request<{
      session: PickupSession;
      request: FoodRequest;
      listing: FoodListing;
      donor?: any;
      recipient?: any;
      userRoleInPickup: 'receiver' | 'donor';
    }>(`/requests/${requestId}/tracking`),

  updateLiveLocation: (requestId: string, location: { lat: number; lng: number; accuracy?: number; heading?: number; speed?: number }) =>
    request<{ success: boolean; session: PickupSession }>(`/requests/${requestId}/tracking/location`, {
      method: 'POST',
      body: JSON.stringify(location),
    }),

  updateTrackingStatus: (requestId: string, status: PickupTrackingStatus, pickupPin?: string) =>
    request<{ success: boolean; session: PickupSession }>(`/requests/${requestId}/tracking/status`, {
      method: 'POST',
      body: JSON.stringify({ status, pickupPin }),
    }),

  stopLiveTracking: (requestId: string) =>
    request<{ success: boolean; message: string; session?: PickupSession }>(`/requests/${requestId}/tracking/stop`, {
      method: 'POST',
    }),

  // Notifications
  getNotifications: () => request<{ notifications: AppNotification[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/mark-all-read', { method: 'POST' }),

  // Organizations
  getOrganizations: () => request<{ organizations: any[] }>('/organizations'),
  applyVerification: (body: { orgName: string; registrationNumber: string; mission: string; website?: string }) =>
    request<{ success: boolean; message: string; user: User }>('/organizations/apply-verification', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // AI Assistant with Dedicated Authentication Token
  suggestListing: (prompt: string, customToken?: string) => {
    const token = customToken || localStorage.getItem('sharebite_ai_token') || localStorage.getItem('sharebite_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-ai-auth-token'] = token;
    }
    return request<{ suggestion: AISuggestion; auth?: any }>('/ai/suggest-listing', {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
    });
  },
  generateAiToken: (donorName?: string) =>
    request<{ success: boolean; token: string; type: string; scope: string; donorName: string; expiresAt: string }>('/ai/token', {
      method: 'POST',
      body: JSON.stringify({ donorName }),
    }),
  verifyAiToken: (token?: string) => {
    const activeToken = token || localStorage.getItem('sharebite_ai_token') || localStorage.getItem('sharebite_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
      headers['x-ai-auth-token'] = activeToken;
    }
    return request<{ valid: boolean; user?: any; message: string }>('/ai/token/verify', {
      headers,
    });
  },

  // Public Impact & Admin
  getPublicImpact: () => request<{ stats: ImpactStats }>('/impact/stats'),
  getAdminStats: () => request<any>('/admin/stats'),
  getAdminUsers: () => request<{ users: User[] }>('/admin/users'),
  updateUserRole: (id: string, role: string) => request<{ user: User }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  verifyOrganization: (id: string, verified: boolean) =>
    request<{ user: User }>(`/admin/verify-org/${id}`, { method: 'PATCH', body: JSON.stringify({ verified }) }),
  getAdminListings: () => request<{ listings: FoodListing[] }>('/admin/listings'),
  getAdminRequests: () => request<{ requests: FoodRequest[] }>('/admin/requests'),
  resetDemoData: () => request<{ success: boolean }>('/reset-demo', { method: 'POST' }),

  // Contact
  submitContact: (body: { name: string; email: string; phone?: string; category: string; subject: string; message: string }) =>
    request<{ success: boolean; message: string; id: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
