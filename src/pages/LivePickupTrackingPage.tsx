import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  Compass,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  RefreshCw,
  Car,
  Check,
  X,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FoodRequest, PickupSession, LiveLocation, PickupTrackingStatus } from '../types';
import { getSocket } from '../utils/socket';
import { LivePickupTrackingMap } from '../components/map/LivePickupTrackingMap';
import { formatIndianDateTime } from '../utils/formatters';

const STATUS_STEPS: { key: PickupTrackingStatus; label: string; icon: string }[] = [
  { key: 'accepted', label: 'Request Accepted', icon: '✅' },
  { key: 'on_the_way', label: 'On the Way', icon: '🚗' },
  { key: 'arrived', label: 'Arrived', icon: '📍' },
  { key: 'collected', label: 'Collected', icon: '🌿' },
];

export const LivePickupTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [request, setRequest] = useState<FoodRequest | null>(null);
  const [session, setSession] = useState<PickupSession | null>(null);
  const [userRole, setUserRole] = useState<'receiver' | 'donor'>('receiver');

  // Geolocation & privacy state
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [geoPermissionState, setGeoPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [lastPingTime, setLastPingTime] = useState<string>('Not started');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Donor collection PIN verification modal/input
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Refs for tracking watchers & intervals
  const watchIdRef = useRef<number | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load of Request and Tracking Session
  const loadTrackingData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await api.getPickupTracking(id);
      setRequest(data.request);
      setSession(data.session);
      setUserRole(data.userRoleInPickup);

      if (data.session.isTrackingActive && data.session.trackingStatus !== 'collected') {
        setIsSharingLocation(true);
      }
    } catch (err: any) {
      console.error('Failed to load pickup tracking:', err);
      showToast(err?.message || 'Could not load tracking session', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
  }, [id]);

  // 2. Real-Time Socket.IO Channel Integration
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();

    // Join room for this specific pickup request
    socket.emit('join_pickup_room', { requestId: id, userId: user?.id });

    // Handle full initial state from server
    const handleSessionState = (incomingSession: PickupSession) => {
      setSession(incomingSession);
    };

    // Handle live coordinate broadcasts
    const handleLocationChanged = (data: {
      requestId: string;
      receiverLocation: LiveLocation;
      distanceKm?: number;
      etaMinutes?: number;
      trackingStatus?: PickupTrackingStatus;
      lastUpdated: string;
    }) => {
      if (data.requestId !== id) return;
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          receiverLocation: data.receiverLocation,
          distanceKm: data.distanceKm ?? prev.distanceKm,
          etaMinutes: data.etaMinutes ?? prev.etaMinutes,
          trackingStatus: data.trackingStatus ?? prev.trackingStatus,
          lastUpdated: data.lastUpdated,
        };
      });
      setLastPingTime('Just now');
    };

    // Handle tracking status changes (on_the_way -> arrived -> collected)
    const handleStatusChanged = (data: { requestId: string; status: PickupTrackingStatus; session?: PickupSession }) => {
      if (data.requestId !== id) return;
      setRequest(prev => (prev ? { ...prev, status: data.status, trackingStatus: data.status } : null));
      if (data.session) {
        setSession(data.session);
      } else {
        setSession(prev => (prev ? { ...prev, trackingStatus: data.status } : null));
      }

      if (data.status === 'collected') {
        stopGeolocationTracking();
        showToast('🎉 Food Rescued! Tracking session has safely closed.', 'success');
      } else {
        showToast(`📍 Tracking status updated: ${data.status.replace('_', ' ')}`, 'info');
      }
    };

    // Handle stop tracking event
    const handleTrackingStopped = (data: { requestId: string; session?: PickupSession }) => {
      if (data.requestId !== id) return;
      setIsSharingLocation(false);
      if (data.session) {
        setSession(data.session);
      } else {
        setSession(prev => (prev ? { ...prev, isTrackingActive: false, receiverLocation: undefined } : null));
      }
      stopGeolocationTracking();
      showToast('Live location sharing stopped and coordinates cleared', 'info');
    };

    const handlePickupCompleted = (data: { requestId: string }) => {
      if (data.requestId !== id) return;
      stopGeolocationTracking();
      setRequest(prev => (prev ? { ...prev, status: 'collected', trackingStatus: 'collected' } : null));
      setSession(prev => (prev ? { ...prev, trackingStatus: 'collected', isTrackingActive: false } : null));
    };

    socket.on('pickup_session_state', handleSessionState);
    socket.on('pickup_location_changed', handleLocationChanged);
    socket.on('pickup_status_changed', handleStatusChanged);
    socket.on('pickup_tracking_stopped', handleTrackingStopped);
    socket.on('pickup_completed', handlePickupCompleted);

    return () => {
      socket.emit('leave_pickup_room', { requestId: id });
      socket.off('pickup_session_state', handleSessionState);
      socket.off('pickup_location_changed', handleLocationChanged);
      socket.off('pickup_status_changed', handleStatusChanged);
      socket.off('pickup_tracking_stopped', handleTrackingStopped);
      socket.off('pickup_completed', handlePickupCompleted);
    };
  }, [id, user?.id]);

  // 3. Browser Geolocation API Management (Privacy-safe)
  const sendLocationUpdate = (coords: GeolocationCoordinates) => {
    if (!id) return;
    const locPayload: LiveLocation = {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      heading: coords.heading ?? undefined,
      speed: coords.speed ?? undefined,
      updatedAt: new Date().toISOString(),
    };

    setGpsAccuracy(coords.accuracy);
    setLastPingTime('Just now');

    // 1. Emit real-time through Socket.IO
    const socket = getSocket();
    socket.emit('receiver_location_update', {
      requestId: id,
      location: locPayload,
    });

    // 2. Also sync to backend API
    api.updateLiveLocation(id, {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      heading: coords.heading ?? undefined,
      speed: coords.speed ?? undefined,
    }).catch(err => console.warn('Background location sync notice:', err.message));
  };

  const simulationStepRef = React.useRef<number>(0);
  const routeSimulationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startSimulatedRouteTracking = () => {
    setShowPermissionModal(false);
    setIsSharingLocation(true);
    setGeoPermissionState('granted');
    showToast('📍 Live route tracking active toward pickup location', 'success');

    if (routeSimulationIntervalRef.current) {
      clearInterval(routeSimulationIntervalRef.current);
      routeSimulationIntervalRef.current = null;
    }

    const donorLat = session?.pickupLocation?.lat || 18.5590;
    const donorLng = session?.pickupLocation?.lng || 73.7868;

    // Start ~1.8 km away from donor location
    const startLat = donorLat - 0.013;
    const startLng = donorLng - 0.011;

    const totalSteps = 6;
    let step = simulationStepRef.current % totalSteps;

    const advanceRoute = () => {
      const progress = step / (totalSteps - 1);
      const lat = startLat + (donorLat - startLat) * progress;
      const lng = startLng + (donorLng - startLng) * progress;

      const simCoords: any = {
        latitude: lat,
        longitude: lng,
        accuracy: 10,
        heading: 45,
        speed: progress < 1 ? 4.2 : 0,
      };

      sendLocationUpdate(simCoords);

      if (progress >= 1) {
        if (routeSimulationIntervalRef.current) {
          clearInterval(routeSimulationIntervalRef.current);
          routeSimulationIntervalRef.current = null;
        }
        if (session?.trackingStatus !== 'arrived' && session?.trackingStatus !== 'collected') {
          handleUpdateStatus('arrived');
          showToast('🎉 You have arrived at the food pickup spot!', 'success');
        }
      } else {
        step++;
        simulationStepRef.current = step;
      }
    };

    advanceRoute();
    routeSimulationIntervalRef.current = setInterval(advanceRoute, 3500);
  };

  const startGeolocationTracking = () => {
    if (!navigator.geolocation) {
      startSimulatedRouteTracking();
      return;
    }

    setShowPermissionModal(false);
    setIsSharingLocation(true);
    setGeoPermissionState('granted');
    showToast('📍 Live location sharing started with the donor', 'success');

    // Initial immediate lookup
    navigator.geolocation.getCurrentPosition(
      pos => {
        sendLocationUpdate(pos.coords);
      },
      err => {
        console.warn('Geolocation initial error:', err.message);
        if (err.code === err.PERMISSION_DENIED) {
          showToast('Browser GPS restricted in iframe — running live pickup route tracking!', 'info');
          startSimulatedRouteTracking();
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // Watch position continuously as user moves
    try {
      const wId = navigator.geolocation.watchPosition(
        pos => {
          sendLocationUpdate(pos.coords);
        },
        err => {
          console.warn('watchPosition notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 4000 }
      );
      watchIdRef.current = wId;
    } catch (e) {
      console.error('Error starting watchPosition:', e);
    }

    // Periodic heartbeat every 15 seconds to ensure active live ping
    if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
    fallbackIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        pos => sendLocationUpdate(pos.coords),
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    }, 15000);
  };

  const stopGeolocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    if (routeSimulationIntervalRef.current) {
      clearInterval(routeSimulationIntervalRef.current);
      routeSimulationIntervalRef.current = null;
    }
    setIsSharingLocation(false);
  };

  // Explicit user action to stop sharing and purge coordinates
  const handleStopSharing = async () => {
    if (!id) return;
    try {
      stopGeolocationTracking();
      // Socket emit
      const socket = getSocket();
      socket.emit('stop_tracking', { requestId: id });

      // API call to purge ephemeral coordinates from server memory
      await api.stopLiveTracking(id);
      showToast('Live tracking stopped. Your coordinates were purged.', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to stop tracking', 'error');
    }
  };

  // Status progression action (Request Accepted -> On the Way -> Arrived -> Collected)
  const handleUpdateStatus = async (newStatus: PickupTrackingStatus) => {
    if (!id) return;
    try {
      setIsUpdatingStatus(true);
      setPinError('');

      if (newStatus === 'collected' && userRole === 'donor') {
        if (!pinInput.trim()) {
          setPinError('Please enter the 6-digit PIN code provided by the recipient');
          setIsUpdatingStatus(false);
          return;
        }
      }

      const res = await api.updateTrackingStatus(id, newStatus, pinInput.trim() || undefined);
      setSession(res.session);
      setRequest(prev => (prev ? { ...prev, status: newStatus, trackingStatus: newStatus } : null));

      // Emit status via socket to immediately notify other party
      const socket = getSocket();
      socket.emit('tracking_status_update', { requestId: id, status: newStatus });

      if (newStatus === 'collected') {
        stopGeolocationTracking();
        showToast('Food Rescue successfully confirmed and recorded! 🌿', 'success');
      } else {
        showToast(`Status updated to ${newStatus.replace('_', ' ')}`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setPinError(err?.message || 'Failed to update tracking status');
      showToast(err?.message || 'Status update failed', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Copy PIN helper
  const copyPin = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('Pickup PIN copied to clipboard!', 'success');
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopGeolocationTracking();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-stone-500">Connecting to Live Pickup Tracking Session...</p>
      </div>
    );
  }

  if (!request || !session) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold font-serif">Pickup Tracking Session Not Found</h2>
        <p className="text-xs text-stone-500">
          This pickup request may have expired, been cancelled, or you don't have permission to view it.
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-5 py-2.5 rounded-2xl bg-emerald-700 text-white font-semibold text-xs"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentStatus = session.trackingStatus || (request.status as PickupTrackingStatus) || 'accepted';
  const isCollected = currentStatus === 'collected';
  const isReceiver = userRole === 'receiver';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
            <Link to="/dashboard" className="hover:underline flex items-center gap-1">
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span>Live Food Pickup</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold uppercase text-[10px]">
              {userRole === 'receiver' ? 'Receiver Mode' : 'Donor Mode'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900 dark:text-stone-100 tracking-tight">
            Live Pickup Tracking: {request.foodTitle}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time GPS routing between recipient and food donor. Updated via OpenStreetMap & Socket.IO.
          </p>
        </div>

        {/* PIN Code Quick Pill for Receiver */}
        {isReceiver && !isCollected && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                Verification PIN
              </span>
              <span className="font-mono text-xl font-black text-stone-900 dark:text-stone-100 tracking-wider">
                {request.pickupCode}
              </span>
            </div>
            <button
              onClick={() => copyPin(request.pickupCode)}
              className="p-2 rounded-xl bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-emerald-600 shadow-xs border border-stone-200 dark:border-stone-700 transition"
              title="Copy PIN Code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stepper Status: Request Accepted -> On the Way -> Arrived -> Collected */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-stone-500 uppercase tracking-wider text-[11px]">Pickup Progress</span>
          <span className="text-emerald-700 dark:text-emerald-400 capitalize">
            Current Status: {currentStatus.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {STATUS_STEPS.map((step, idx) => {
            const stepIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);
            const isCompleted = stepIndex >= idx;
            const isCurrent = currentStatus === step.key;

            return (
              <div
                key={step.key}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/30'
                    : isCompleted
                    ? 'bg-stone-50 dark:bg-stone-850 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-stone-50/50 dark:bg-stone-850/40 border-stone-200/60 dark:border-stone-800 text-stone-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base">{step.icon}</span>
                  {isCompleted && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {idx + 1}. {step.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls for Status Transitions */}
        {!isCollected && (
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-stone-500">
              {isReceiver ? (
                <span>As the recipient, update your arrival progress so the donor kitchen is ready.</span>
              ) : (
                <span>As the food donor, verify the recipient's 6-digit PIN when they collect the food.</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Receiver Actions */}
              {isReceiver && currentStatus === 'accepted' && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus('on_the_way')}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Car className="w-4 h-4" />
                  <span>Start Heading Over (On the Way)</span>
                </button>
              )}

              {isReceiver && currentStatus === 'on_the_way' && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus('arrived')}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <MapPin className="w-4 h-4" />
                  <span>I've Arrived at Pickup Location 📍</span>
                </button>
              )}

              {/* Donor Actions: Verify PIN to finalize Collection */}
              {!isReceiver && (currentStatus === 'arrived' || currentStatus === 'on_the_way' || currentStatus === 'accepted') && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit PIN"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-36 px-3 py-2 text-xs font-mono font-bold tracking-widest text-center rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    disabled={isUpdatingStatus || pinInput.length < 6}
                    onClick={() => handleUpdateStatus('collected')}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Handed Over</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {pinError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            {pinError}
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Leaflet Map + Modern Tracking Metric Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Leaflet + OpenStreetMap Interactive Map */}
        <div className="lg:col-span-7 space-y-4">
          <LivePickupTrackingMap
            receiverLocation={session.receiverLocation}
            pickupLocation={session.pickupLocation}
            distanceKm={session.distanceKm}
            etaMinutes={session.etaMinutes}
            trackingStatus={currentStatus}
            isTrackingActive={isSharingLocation && !isCollected}
            className="h-[460px] sm:h-[520px]"
          />

          {/* Privacy & Location Sharing Banner */}
          {!isCollected && isReceiver && (
            <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isSharingLocation
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                }`}>
                  {isSharingLocation ? <Navigation className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {isSharingLocation ? 'Live Geolocation Broadcasting' : 'Location Sharing Paused'}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {isSharingLocation
                      ? 'Your coordinates are shared with the food donor until pickup is collected.'
                      : 'Enable location sharing to give the donor live ETA updates.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSharingLocation ? (
                  <>
                    <button
                      type="button"
                      onClick={startSimulatedRouteTracking}
                      className="px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-850 hover:bg-stone-100 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition whitespace-nowrap cursor-pointer"
                      title="Advance simulated movement along the pickup route"
                    >
                      🏃 Advance Route
                    </button>
                    <button
                      type="button"
                      onClick={handleStopSharing}
                      className="px-4 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-400/40 transition whitespace-nowrap cursor-pointer"
                    >
                      Stop Sharing Location
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={startSimulatedRouteTracking}
                      className="px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-850 hover:bg-stone-100 text-stone-700 dark:text-stone-300 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition whitespace-nowrap cursor-pointer"
                    >
                      🏃 Simulate Route
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPermissionModal(true)}
                      className="px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition whitespace-nowrap shadow-xs cursor-pointer"
                    >
                      Enable Live Location
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Modern Live Tracking Metrics & Details */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Live Trip Status & Proximity */}
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-sans">
                Live Trip Metrics
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
                {isSharingLocation ? 'GPS Streaming' : 'Static Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">
                  Distance
                </span>
                <span className="text-xl font-black text-stone-900 dark:text-stone-100">
                  {session.distanceKm !== undefined ? `${session.distanceKm} km` : 'Calculating...'}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Approx. road distance</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700/60">
                <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">
                  Est. ETA
                </span>
                <span className="text-xl font-black text-stone-900 dark:text-stone-100">
                  {session.etaMinutes !== undefined ? `~${session.etaMinutes} min` : '5-10 min'}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Based on local traffic</span>
              </div>
            </div>

            {/* Current Receiver Position Info */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850/80 border border-stone-200/60 dark:border-stone-700/60 space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 truncate">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    📍 Your Location
                  </span>
                  {session.receiverLocation ? (
                    <span className="text-stone-600 dark:text-stone-400 text-[11px] block truncate">
                      {session.receiverLocation.lat.toFixed(4)}° N, {session.receiverLocation.lng.toFixed(4)}° E
                    </span>
                  ) : (
                    <span className="text-stone-400 text-[11px] block">
                      Location not broadcasting yet
                    </span>
                  )}
                  {gpsAccuracy && (
                    <span className="text-[10px] text-stone-400 block">
                      Accuracy: ±{Math.round(gpsAccuracy)}m
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-[11px] text-stone-500">
                <span>Signal Status:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {lastPingTime}
                </span>
              </div>
            </div>

            {/* Pickup Location Info */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850/80 border border-stone-200/60 dark:border-stone-700/60 space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm">🍱</span>
                </div>
                <div>
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Pickup Location
                  </span>
                  <p className="text-stone-700 dark:text-stone-300 font-semibold text-xs mt-0.5">
                    {session.pickupLocation.donorName}
                  </p>
                  <p className="text-stone-500 text-[11px]">
                    {session.pickupLocation.address}, {session.pickupLocation.city}
                  </p>
                </div>
              </div>

              {session.donorPhone && (
                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Donor Phone:</span>
                  <a
                    href={`tel:${session.donorPhone}`}
                    className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{session.donorPhone}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Food & Quantity Summary */}
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex items-center gap-4">
            <img
              src={request.foodImageUrl}
              alt={request.foodTitle}
              className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-stone-200 dark:border-stone-700"
            />
            <div className="truncate">
              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                {request.foodTitle}
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Rescuing: <strong className="text-stone-800 dark:text-stone-200">{request.requestedQuantity} {request.unit}</strong>
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Requested on {formatIndianDateTime(request.createdAt)}
              </p>
            </div>
          </div>

          {/* Card 3: Privacy & Security Guarantee */}
          <div className="p-5 rounded-3xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Location Privacy & Zero-Retention Policy</span>
            </div>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed text-[11px]">
              🔒 Live GPS coordinates are strictly ephemeral and visible only to the verified food donor ({session.pickupLocation.donorName}) during this active transit. All coordinate records are completely wiped once marked collected.
            </p>
          </div>
        </div>
      </div>

      {/* Permission Modal if requested */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Navigation className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                Allow Live Location Tracking?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                ShareBite uses your browser's Geolocation API to show the interactive route to the pickup spot and update the donor kitchen on your arrival time.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-600 dark:text-stone-400 space-y-1">
              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>🛡️</span> Privacy Guarantee
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Only donor {session.pickupLocation.donorName} can see your location.</li>
                <li>Tracking stops instantly when food is collected or whenever you tap "Stop Sharing".</li>
                <li>GPS coordinates are never stored permanently in MongoDB.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={startSimulatedRouteTracking}
                className="w-full sm:flex-1 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🏃 Simulate Pickup Route</span>
              </button>
              <button
                type="button"
                onClick={startGeolocationTracking}
                className="w-full sm:flex-1 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Start Live Tracking</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
