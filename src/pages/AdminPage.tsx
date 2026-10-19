import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Utensils,
  HeartHandshake,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FoodListing, FoodRequest, User, UserRole } from '../types';

const COLORS = ['#15803d', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'listings' | 'requests'>('analytics');
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [listingsList, setListingsList] = useState<FoodListing[]>([]);
  const [requestsList, setRequestsList] = useState<FoodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, listingsRes, requestsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminListings(),
        api.getAdminRequests(),
      ]);
      setStats(statsRes);
      setUsersList(usersRes.users);
      setListingsList(listingsRes.listings);
      setRequestsList(requestsRes.requests);
    } catch (err: any) {
      showToast(err.message || 'Failed to load admin console', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyOrg = async (userId: string, verified: boolean) => {
    try {
      await api.verifyOrganization(userId, verified);
      showToast(verified ? 'Organization approved & verified!' : 'Verification rejected', 'success');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      showToast(`User role updated to ${newRole}`, 'success');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.deleteListing(listingId);
      showToast('Listing removed by moderator', 'info');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing', 'error');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold font-serif mb-1">Access Restricted</h2>
        <p className="text-xs text-stone-500">
          This section requires Platform Administrator privileges. Please use the Demo Role Switcher at the bottom-left to switch to the Admin account.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] text-stone-900 dark:text-stone-100 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80 dark:border-stone-850 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
              <ShieldAlert className="w-4 h-4" />
              Administrative Operations Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">
              ShareBite Platform Admin
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-semibold">
              Admin: {user.name}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pb-4 mb-8 border-b border-stone-200/80 dark:border-stone-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'analytics'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analytics & Impact</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'users'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Organizations ({usersList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'listings'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Food Moderation ({listingsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'requests'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Platform Requests ({requestsList.length})</span>
          </button>
        </div>

        {/* Tab 1: Analytics & Impact */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8">
            {/* Top metric row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
                  Total Rescued Meals
                </span>
                <span className="text-3xl font-extrabold font-serif text-emerald-700 dark:text-emerald-400 mt-2 block">
                  {stats.summary.totalMealsRescued.toLocaleString()}
                </span>
                <span className="text-[11px] text-stone-400 mt-1 block">Platform-wide cumulative</span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
                  CO2 Emissions Saved
                </span>
                <span className="text-3xl font-extrabold font-serif text-emerald-700 dark:text-emerald-400 mt-2 block">
                  {stats.summary.totalKgCO2Saved.toLocaleString()} kg
                </span>
                <span className="text-[11px] text-stone-400 mt-1 block">Methane / landfill diverted</span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
                  Registered Donors
                </span>
                <span className="text-3xl font-extrabold font-serif text-stone-900 dark:text-stone-100 mt-2 block">
                  {stats.summary.totalDonors}
                </span>
                <span className="text-[11px] text-stone-400 mt-1 block">Restaurants & Caterers</span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
                  Verified Charities
                </span>
                <span className="text-3xl font-extrabold font-serif text-amber-600 dark:text-amber-400 mt-2 block">
                  {stats.summary.verifiedOrgs}
                </span>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  {stats.summary.pendingOrgVerifications} pending review
                </span>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Rescued Trend Chart */}
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
                  Weekly Meals Rescued Growth
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.rescueTrends}>
                      <defs>
                        <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#15803d" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#15803d" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#a8a29e" fontSize={11} />
                      <YAxis stroke="#a8a29e" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1c1917',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="mealsRescued"
                        stroke="#15803d"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorMeals)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Food Category Breakdown */}
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
                  Food Waste Category Distribution
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categoryData}>
                      <XAxis dataKey="name" stroke="#a8a29e" fontSize={10} tickFormatter={t => t.split(' ')[0]} />
                      <YAxis stroke="#a8a29e" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1c1917',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="meals" fill="#15803d" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Leaderboard Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Donors */}
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                  Top Food Donor Impact
                </h4>
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {stats.topDonors.map((d: any, idx: number) => (
                    <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 font-bold text-stone-400">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-stone-900 dark:text-stone-100">{d.orgName}</p>
                          <p className="text-[11px] text-stone-500">{d.name}</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {d.mealsRescued} meals saved
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top NGOs */}
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                  Top Charity Distribution Network
                </h4>
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {stats.topOrgs.map((o: any, idx: number) => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 font-bold text-stone-400">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-stone-900 dark:text-stone-100">{o.name}</p>
                          <p className="text-[11px] text-stone-500">Lead: {o.contact}</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {o.mealsDistributed} meals served
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-base font-serif text-stone-900 dark:text-stone-100">
                User Accounts & Organization Verification
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs bg-stone-50 dark:bg-stone-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase text-[10px]">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Organization Status</th>
                    <th className="pb-3">Impact</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {usersList
                    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(u => (
                      <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                        <td className="py-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-bold text-stone-900 dark:text-stone-100">{u.name}</p>
                              <p className="text-[11px] text-stone-500">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5">
                          <select
                            value={u.role}
                            onChange={e => handleUpdateRole(u.id, e.target.value as UserRole)}
                            className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium cursor-pointer"
                          >
                            <option value="donor">Donor</option>
                            <option value="recipient">Recipient</option>
                            <option value="organization">Organization</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        <td className="py-3.5">
                          {u.organizationDetails ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-stone-800 dark:text-stone-200">
                                  {u.organizationDetails.orgName}
                                </span>
                                {u.organizationDetails.isVerified ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    Verified
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    Pending Review
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                                ID: {u.organizationDetails.registrationNumber}
                              </p>
                            </div>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>

                        <td className="py-3.5 font-semibold text-emerald-700 dark:text-emerald-400">
                          {u.mealsRescued} meals
                        </td>

                        <td className="py-3.5 text-right">
                          {u.organizationDetails && !u.organizationDetails.isVerified && (
                            <button
                              onClick={() => handleVerifyOrg(u.id, true)}
                              className="px-3 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] transition mr-2"
                            >
                              Approve Org
                            </button>
                          )}
                          {u.organizationDetails && u.organizationDetails.isVerified && (
                            <button
                              onClick={() => handleVerifyOrg(u.id, false)}
                              className="px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 text-[11px] transition"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Listings Moderation */}
        {activeTab === 'listings' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base font-serif text-stone-900 dark:text-stone-100">
              Active Food Listings Moderation
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase text-[10px]">
                    <th className="pb-3">Listing</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Donor</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {listingsList.map(l => (
                    <tr key={l.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img src={l.imageUrl} alt={l.title} className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <p className="font-bold text-stone-900 dark:text-stone-100 line-clamp-1">{l.title}</p>
                            <p className="text-[10px] text-stone-500">{l.pickupAddress}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{l.category}</td>
                      <td className="py-3 font-semibold">{l.quantity} {l.unit}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800">
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3">{l.donorOrgName || l.donorName}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteListing(l.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Platform Requests */}
        {activeTab === 'requests' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base font-serif text-stone-900 dark:text-stone-100">
              Platform Food Requests Audit Log
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase text-[10px]">
                    <th className="pb-3">Food Item</th>
                    <th className="pb-3">Donor</th>
                    <th className="pb-3">Recipient</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">PIN Code</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {requestsList.map(r => (
                    <tr key={r.id}>
                      <td className="py-3 font-semibold">{r.foodTitle}</td>
                      <td className="py-3">{r.donorName}</td>
                      <td className="py-3">{r.recipientName} {r.recipientOrgName ? `(${r.recipientOrgName})` : ''}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold">{r.pickupCode}</td>
                      <td className="py-3 text-stone-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
