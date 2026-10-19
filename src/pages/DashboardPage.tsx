import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  HeartHandshake,
  ShieldCheck,
  PlusCircle,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  Leaf,
  Users,
  Copy,
  ChevronRight,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import { FoodListing, FoodRequest, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PickupPinModal } from '../components/modals/PickupPinModal';
import { CountdownTimer } from '../components/common/CountdownTimer';

export const DashboardPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'requests' | 'organization'>('overview');
  const [myListings, setMyListings] = useState<FoodListing[]>([]);
  const [donorRequests, setDonorRequests] = useState<FoodRequest[]>([]);
  const [myRequests, setMyRequests] = useState<FoodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pickup PIN Modal
  const [pinModalRequest, setPinModalRequest] = useState<FoodRequest | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Org verification form state
  const [orgName, setOrgName] = useState(user?.organizationDetails?.orgName || '');
  const [regNumber, setRegNumber] = useState(user?.organizationDetails?.registrationNumber || '');
  const [mission, setMission] = useState(user?.organizationDetails?.mission || '');
  const [website, setWebsite] = useState(user?.organizationDetails?.website || '');
  const [isSubmittingOrg, setIsSubmittingOrg] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [listingsRes, donorReqRes, myReqRes] = await Promise.all([
        api.getListings({ donorId: user.id }),
        api.getDonorRequests(),
        api.getMyRequests(),
      ]);
      setMyListings(listingsRes.listings);
      setDonorRequests(donorReqRes.requests);
      setMyRequests(myReqRes.requests);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Request actions
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.updateRequestStatus(requestId, 'accepted');
      showToast('Request accepted! The recipient was sent a pickup code.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept request', 'error');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await api.updateRequestStatus(requestId, 'declined');
      showToast('Request declined.', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to decline request', 'error');
    }
  };

  const handleCancelMyRequest = async (requestId: string) => {
    try {
      await api.updateRequestStatus(requestId, 'cancelled');
      showToast('Request cancelled.', 'info');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel request', 'error');
    }
  };

  const handleApplyOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingOrg(true);
      const res = await api.applyVerification({
        orgName,
        registrationNumber: regNumber,
        mission,
        website,
      });
      updateUser(res.user);
      showToast('Verification submitted! Admin will review credentials shortly.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit verification', 'error');
    } finally {
      setIsSubmittingOrg(false);
    }
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    showToast(`Pickup code ${pin} copied to clipboard!`, 'success');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-sm text-stone-500">Please sign in to access your dashboard.</p>
      </div>
    );
  }

  const activeDonationsCount = myListings.filter(l => l.status === 'available' || l.status === 'requested').length;
  const activeRequestsCount = myRequests.filter(r => r.status === 'pending' || r.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] text-stone-900 dark:text-stone-100 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Hero Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600/30 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
                  {user.name}
                </h1>
                {user.organizationDetails?.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Partner
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 capitalize mt-0.5">
                Role: {user.role} • {user.city || 'Jaipur, Rajasthan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/donate"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Donate Food with AI</span>
            </Link>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition"
            >
              <span>Rescue Food</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200/80 dark:border-stone-800 pb-3 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'overview'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview & Impact</span>
          </button>

          <button
            onClick={() => setActiveTab('donations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'donations'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>My Donations ({myListings.length})</span>
            {donorRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'requests'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>My Requests ({myRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('organization')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'organization'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Charity Verification</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Impact Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Meals Rescued
                </span>
                <span className="text-3xl font-bold font-serif text-emerald-700 dark:text-emerald-400 mt-2 block">
                  {user.mealsRescued}
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">Nutritious portions</span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  CO2 Averted
                </span>
                <span className="text-3xl font-bold font-serif text-emerald-700 dark:text-emerald-400 mt-2 block">
                  {user.kgCO2Saved} kg
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">Greenhouse emissions</span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Active Listings
                </span>
                <span className="text-3xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-2 block">
                  {activeDonationsCount}
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">Available for pickup</span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  Active Requests
                </span>
                <span className="text-3xl font-bold font-serif text-amber-600 dark:text-amber-400 mt-2 block">
                  {activeRequestsCount}
                </span>
                <span className="text-[11px] text-stone-500 mt-1 block">Pending / Accepted</span>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incoming Donor Requests waiting action */}
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
                    Pending Incoming Requests ({donorRequests.filter(r => r.status === 'pending').length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('donations')}
                    className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    View all
                  </button>
                </div>

                {donorRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">
                    No pending requests waiting for your review.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {donorRequests.filter(r => r.status === 'pending').slice(0, 3).map(req => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/50 dark:border-stone-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                            {req.recipientName} {req.recipientOrgName ? `(${req.recipientOrgName})` : ''}
                          </h4>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Requested {req.requestedQuantity} {req.unit} of "{req.foodTitle}"
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-300 transition"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Outgoing Requests Status */}
              <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
                    My Active Pickups ({myRequests.filter(r => r.status === 'accepted').length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    View all
                  </button>
                </div>

                {myRequests.filter(r => r.status === 'accepted').length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">
                    No active accepted pickups right now.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myRequests.filter(r => r.status === 'accepted').map(req => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            {req.foodTitle}
                          </h4>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                            From: {req.donorName} • {req.pickupTime || 'Today'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/track/${req.id}`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Track</span>
                          </Link>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                              PIN Code
                            </span>
                            <button
                              onClick={() => copyPin(req.pickupCode)}
                              className="font-mono text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1 hover:text-emerald-600"
                            >
                              <span>{req.pickupCode}</span>
                              <Copy className="w-3 h-3 text-stone-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My Donations */}
        {activeTab === 'donations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-serif">My Donated Food Listings</h2>
                <p className="text-xs text-stone-500">Track and manage listings posted from your kitchen.</p>
              </div>
              <Link
                to="/donate"
                className="px-4 py-2 rounded-2xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post New Food</span>
              </Link>
            </div>

            {myListings.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <p className="text-sm text-stone-500 mb-4">You haven't posted any food listings yet.</p>
                <Link
                  to="/donate"
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-emerald-700"
                >
                  Create Listing with AI Assistant
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myListings.map(listing => {
                  const relatedRequests = donorRequests.filter(r => r.foodId === listing.id);

                  return (
                    <div
                      key={listing.id}
                      className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                            className="w-16 h-16 rounded-2xl object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                                {listing.title}
                              </h3>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                {listing.status}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                              {listing.quantity} {listing.unit} • ~{listing.estimatedServings} servings • {listing.pickupTimeWindow}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <CountdownTimer expiryDate={listing.expiryDate} />
                          <Link
                            to={`/food/${listing.id}`}
                            className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                          >
                            View
                          </Link>
                        </div>
                      </div>

                      {/* Associated Requests Sub-Section */}
                      {relatedRequests.length > 0 && (
                        <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80">
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                            Incoming Requests for this food ({relatedRequests.length}):
                          </h4>
                          <div className="space-y-2">
                            {relatedRequests.map(req => (
                              <div
                                key={req.id}
                                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-stone-900 dark:text-stone-100">
                                      {req.recipientName}
                                    </span>
                                    {req.recipientOrgName && (
                                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                        {req.recipientOrgName}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-stone-400">
                                      Status: {req.status}
                                    </span>
                                  </div>
                                  <p className="text-stone-600 dark:text-stone-400 mt-0.5 italic">
                                    "{req.message}"
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {req.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleAcceptRequest(req.id)}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition"
                                      >
                                        Accept Request
                                      </button>
                                      <button
                                        onClick={() => handleDeclineRequest(req.id)}
                                        className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 transition"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {req.status === 'accepted' && (
                                    <div className="flex items-center gap-2">
                                      <Link
                                        to={`/track/${req.id}`}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 font-bold text-xs transition flex items-center gap-1.5"
                                      >
                                        <Navigation className="w-3.5 h-3.5" />
                                        <span>Track Receiver</span>
                                      </Link>
                                      <button
                                        onClick={() => {
                                          setPinModalRequest(req);
                                          setIsPinModalOpen(true);
                                        }}
                                        className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition flex items-center gap-1.5"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Verify Recipient PIN</span>
                                      </button>
                                    </div>
                                  )}

                                  {req.status === 'collected' && (
                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Collected
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold font-serif">Food Requests & Pickups</h2>
              <p className="text-xs text-stone-500">Track status, donor locations, and pickup verification PINs.</p>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <p className="text-sm text-stone-500 mb-4">You have not submitted any food requests yet.</p>
                <Link
                  to="/discover"
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-emerald-700"
                >
                  Browse Available Food
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(req => {
                  const isAccepted = req.status === 'accepted';
                  const isCollected = req.status === 'collected';
                  const isPending = req.status === 'pending';

                  return (
                    <div
                      key={req.id}
                      className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={req.foodImageUrl}
                            alt={req.foodTitle}
                            className="w-16 h-16 rounded-2xl object-cover shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                                {req.foodTitle}
                              </h3>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  isAccepted
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : isCollected
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {req.status}
                              </span>
                            </div>

                            <p className="text-xs text-stone-500 mt-1">
                              Donor: <strong className="text-stone-800 dark:text-stone-200">{req.donorName}</strong> • Requested: {req.requestedQuantity} {req.unit}
                            </p>
                            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                              Preferred window: {req.pickupTime || 'Today'}
                            </p>
                          </div>
                        </div>

                        {/* PIN Code Box if accepted */}
                        {isAccepted && (
                          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center shrink-0">
                            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block tracking-wider">
                              Your Pickup PIN
                            </span>
                            <span className="text-2xl font-mono font-extrabold text-stone-950 dark:text-stone-50 tracking-widest block my-0.5">
                              {req.pickupCode}
                            </span>
                            <button
                              onClick={() => copyPin(req.pickupCode)}
                              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <Copy className="w-3 h-3" /> Copy Code
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Status timeline tracker */}
                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80">
                        <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                          <span className={isPending || isAccepted || isCollected ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>
                            1. Requested
                          </span>
                          <span className={isAccepted || isCollected ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>
                            2. Donor Accepted
                          </span>
                          <span className={isCollected ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>
                            3. Collected & Saved
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full bg-emerald-600 transition-all duration-500 ${
                              isCollected ? 'w-full' : isAccepted ? 'w-2/3' : 'w-1/3'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-3 pt-1">
                        {isAccepted && (
                          <Link
                            to={`/track/${req.id}`}
                            className="px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Live Pickup Tracking</span>
                          </Link>
                        )}
                        {isPending && (
                          <button
                            onClick={() => handleCancelMyRequest(req.id)}
                            className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Organization Verification */}
        {activeTab === 'organization' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                Non-Profit & Charity Verification
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Verified charities, food pantries, and shelters gain priority bulk claim privileges and trusted partner badges.
              </p>
            </div>

            {user.organizationDetails?.isVerified ? (
              <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200">
                  {user.organizationDetails.orgName} is Verified!
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Registration ID: {user.organizationDetails.registrationNumber}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto italic">
                  "{user.organizationDetails.mission}"
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleApplyOrg}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Legal Organization / Charity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="e.g. Jaipur Food Relief or Annapurna Seva Trust"
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    NGO Registration / 80G / 12A / Trust Number
                  </label>
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value)}
                    placeholder="e.g. 80G-12A-MH-PUN-00921"
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Organization Mission Statement
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={mission}
                    onChange={e => setMission(e.target.value)}
                    placeholder="Describe how your organization distributes food to underserved populations..."
                    className="w-full p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Official Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrg}
                  className="w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white bg-emerald-700 hover:bg-emerald-800 transition shadow-md disabled:opacity-50"
                >
                  {isSubmittingOrg ? 'Submitting Application...' : 'Submit for Verification'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Pickup PIN Verification Modal */}
      <PickupPinModal
        request={pinModalRequest}
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinModalRequest(null);
        }}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
};
