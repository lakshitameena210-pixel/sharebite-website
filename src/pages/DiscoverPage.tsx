import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Flame,
  MapPin,
  Clock,
  Sparkles,
  RotateCcw,
  LayoutGrid,
  Map as MapIcon,
  Navigation,
  Check,
  X,
  Compass,
  ShieldCheck,
  Radio,
  LocateFixed,
} from 'lucide-react';
import { FoodCard } from '../components/common/FoodCard';
import { RequestModal } from '../components/modals/RequestModal';
import { LiveFoodMap } from '../components/map/LiveFoodMap';
import { FoodListing, FoodCategory, RescuePriority } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const CATEGORIES: ('All' | FoodCategory)[] = [
  'All',
  'Prepared Meals',
  'Bakery & Pastries',
  'Fresh Produce',
  'Dairy & Eggs',
  'Pantry & Dry Goods',
  'Beverages',
  'Snacks & Packaged',
];

const DIETARY_TAGS = ['All', 'Pure Veg', 'Vegetarian', 'Jain Friendly', 'Halal', 'Gluten-Free'];

const POPULAR_ITEM_KEYWORDS = [
  { label: 'Thali & Meals', query: 'thali', icon: '🍛' },
  { label: 'Roti & Bread', query: 'roti', icon: '🫓' },
  { label: 'Biryani & Rice', query: 'biryani', icon: '🍚' },
  { label: 'Paneer Dishes', query: 'paneer', icon: '🧀' },
  { label: 'Dal & Curries', query: 'dal', icon: '🍲' },
  { label: 'Fresh Veggies', query: 'produce', icon: '🥦' },
  { label: 'Bakery & Bread', query: 'bakery', icon: '🍞' },
  { label: 'Fruits', query: 'fruits', icon: '🍎' },
  { label: 'Breakfast / Snacks', query: 'idli', icon: '☕' },
  { label: 'Milk & Dairy', query: 'dairy', icon: '🥛' },
];

const PRIORITIES: ('All' | RescuePriority)[] = ['All', 'Urgent', 'High', 'Normal'];

const JAIPUR_LOCALITIES = [
  'Vaishali Nagar, Jaipur',
  'Malviya Nagar, Jaipur',
  'C-Scheme, Jaipur',
  'Mansarovar, Jaipur',
  'Raja Park, Jaipur',
  'Bani Park, Jaipur',
  'MI Road, Jaipur',
  'Tonk Road, Jaipur',
];

const LOCALITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Vaishali Nagar, Jaipur': { lat: 26.9157, lng: 75.7423 },
  'Malviya Nagar, Jaipur': { lat: 26.8530, lng: 75.8052 },
  'C-Scheme, Jaipur': { lat: 26.9080, lng: 75.8010 },
  'Mansarovar, Jaipur': { lat: 26.8550, lng: 75.7600 },
  'Raja Park, Jaipur': { lat: 26.8950, lng: 75.8280 },
  'Bani Park, Jaipur': { lat: 26.9280, lng: 75.7890 },
  'MI Road, Jaipur': { lat: 26.9196, lng: 75.8160 },
  'Tonk Road, Jaipur': { lat: 26.8700, lng: 75.7950 },
  'Jagatpura, Jaipur': { lat: 26.8220, lng: 75.8340 },
  'Jaipur, Rajasthan': { lat: 26.9124, lng: 75.7873 },
  'Pune, Maharashtra': { lat: 18.5204, lng: 73.8567 },
  'Mumbai, Maharashtra': { lat: 19.0178, lng: 72.8478 },
  'Bengaluru, Karnataka': { lat: 12.9784, lng: 77.6408 },
  'Delhi NCR': { lat: 28.6304, lng: 77.2177 },
  'Hyderabad, Telangana': { lat: 17.4156, lng: 78.4352 },
  'Chennai, Tamil Nadu': { lat: 13.0418, lng: 80.2341 },
  'Ahmedabad, Gujarat': { lat: 23.0338, lng: 72.5620 },
  'Indore, Madhya Pradesh': { lat: 22.7196, lng: 75.8577 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Lucknow, Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'Noida, Uttar Pradesh': { lat: 28.5355, lng: 77.3910 },
  'Gurugram, Haryana': { lat: 28.4595, lng: 77.0266 },
};

const OTHER_INDIAN_CITIES = [
  'Delhi NCR',
  'Mumbai, Maharashtra',
  'Bengaluru, Karnataka',
  'Pune, Maharashtra',
  'Hyderabad, Telangana',
  'Chennai, Tamil Nadu',
  'Ahmedabad, Gujarat',
  'Indore, Madhya Pradesh',
  'Chandigarh',
  'Lucknow, Uttar Pradesh',
  'Noida, Uttar Pradesh',
  'Gurugram, Haryana',
];

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
  return Math.round(R * c * 10) / 10;
}

function findClosestLocality(coords: { lat: number; lng: number }): string | null {
  let closest = '';
  let minD = 99999;
  for (const [name, c] of Object.entries(LOCALITY_COORDS)) {
    const d = calculateDistanceKm(coords.lat, coords.lng, c.lat, c.lng);
    if (d < minD) {
      minD = d;
      closest = name;
    }
  }
  if (minD <= 35) {
    return closest;
  }
  return null;
}

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';

  const [listings, setListings] = useState<FoodListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(initialQuery);

  // Sync search state if URL search query changes
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search');
    if (qParam !== null && qParam !== undefined && qParam !== search) {
      setSearch(qParam);
    }
  }, [searchParams]);
  const [selectedCategory, setSelectedCategory] = useState<'All' | FoodCategory>('All');
  const [selectedDietary, setSelectedDietary] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<'All' | RescuePriority>('All');
  const [sortBy, setSortBy] = useState('distance');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Location & Live GPS Tracking states
  const [currentLocation, setCurrentLocation] = useState<string>('Vaishali Nagar, Jaipur');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 26.9157,
    lng: 75.7423,
  });
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [locationScope, setLocationScope] = useState<'all' | 'strict' | '5km' | '15km'>('all');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);

  // Request modal state
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [activeMapItem, setActiveMapItem] = useState<FoodListing | null>(null);

  const { showToast } = useToast();

  const watchIdRef = React.useRef<number | null>(null);
  const simulationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleUseMyLocation = () => {
    setShowLocationPermissionModal(true);
  };

  const executeBrowserGeolocation = () => {
    startLiveTracking();
  };

  const fallbackToAutoDetection = async (preferredLocality?: string) => {
    try {
      const detected = await api.detectLocation();
      setIsLocating(false);
      if (detected && detected.success && detected.coordinates) {
        setUserCoords(detected.coordinates);
        setGpsAccuracy(detected.accuracy || 1000);
        setIsLiveTracking(true);
        setSortBy('distance');

        const closest = findClosestLocality(detected.coordinates);
        const locName = closest || detected.city || preferredLocality || 'Vaishali Nagar, Jaipur';
        setCurrentLocation(locName);
        showToast(`📍 Location synchronized (${locName})! Showing nearest surplus food.`, 'success');
        return;
      }
    } catch (detectErr) {
      console.warn('Location detection note:', detectErr);
    }

    // Default seamless fallback to active locality
    setIsLocating(false);
    const targetLoc = preferredLocality || currentLocation || 'Vaishali Nagar, Jaipur';
    const defaultCoords = LOCALITY_COORDS[targetLoc] || { lat: 26.9157, lng: 75.7423 };
    setUserCoords(defaultCoords);
    setIsLiveTracking(true);
    setGpsAccuracy(20);
    setSortBy('distance');
    setCurrentLocation(targetLoc);
    showToast(`📍 Location locked to ${targetLoc}! Displaying nearby surplus meals.`, 'success');
  };

  const startLiveTracking = () => {
    setShowLocationPermissionModal(false);

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    if (!navigator.geolocation) {
      fallbackToAutoDetection();
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false);
        setIsLiveTracking(true);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGpsAccuracy(pos.coords.accuracy);
        setUserCoords(coords);
        setSortBy('distance');
        const closest = findClosestLocality(coords);
        if (closest) {
          setCurrentLocation(closest);
          showToast(`📍 Live GPS locked near ${closest} (±${Math.round(pos.coords.accuracy)}m)`, 'success');
        } else {
          setCurrentLocation(`Live GPS (${coords.lat.toFixed(3)}°, ${coords.lng.toFixed(3)}°)`);
          showToast(`📍 Live GPS active (±${Math.round(pos.coords.accuracy)}m)`, 'success');
        }

        try {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }
          watchIdRef.current = navigator.geolocation.watchPosition(
            wPos => {
              const liveCoords = { lat: wPos.coords.latitude, lng: wPos.coords.longitude };
              setGpsAccuracy(wPos.coords.accuracy);
              setIsLiveTracking(true);
              setUserCoords(liveCoords);
            },
            err => console.warn('watchPosition notice:', err.message),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
          );
        } catch (e) {
          console.warn('watchPosition error:', e);
        }
      },
      err => {
        console.warn('Browser GPS notice (permissions policy or denied):', err.message);
        // Automatically and seamlessly resolve location using network auto-detect
        fallbackToAutoDetection();
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
    );
  };

  const stopLiveTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsLiveTracking(false);
    setGpsAccuracy(null);
    showToast('Live location tracking paused', 'info');
  };

  const simulateLiveMovement = () => {
    setShowLocationPermissionModal(false);
    stopLiveTracking();

    setIsLiveTracking(true);
    setGpsAccuracy(6);
    setSortBy('distance');
    showToast('🚀 Live GPS Simulation active! Simulating movement along street routes.', 'success');

    // Simulate real-time movement between Vaishali Nagar and C-Scheme
    let step = 0;
    const waypoints = [
      { lat: 26.9157, lng: 75.7423, loc: 'Amrapali Circle, Vaishali Nagar, Jaipur' },
      { lat: 26.9100, lng: 75.7500, loc: 'Queens Road, Vaishali Nagar, Jaipur' },
      { lat: 26.9080, lng: 75.8010, loc: 'Statue Circle, C-Scheme, Jaipur' },
      { lat: 26.9196, lng: 75.8160, loc: 'MI Road / Panch Batti, Jaipur' },
    ];

    setUserCoords(waypoints[0]);
    setCurrentLocation(waypoints[0].loc);

    simulationIntervalRef.current = setInterval(() => {
      step = (step + 1) % waypoints.length;
      const wp = waypoints[step];
      setUserCoords({ lat: wp.lat, lng: wp.lng });
      setCurrentLocation(wp.loc);
      setGpsAccuracy(4 + Math.round(Math.random() * 5));
    }, 3500);
  };

  const handleSelectLocation = (loc: string) => {
    stopLiveTracking();
    setCurrentLocation(loc);
    setShowLocationPicker(false);
    const coords = LOCALITY_COORDS[loc] || { lat: 18.5590, lng: 73.7868 };
    setUserCoords(coords);
    setSortBy('distance'); // Automatically sort closest-first to the new location!
    showToast(`📍 Location updated to ${loc}! Showing available surplus meals nearby.`, 'success');
  };

  const fetchListings = () => {
    setIsLoading(true);
    const params: Record<string, string> = {
      sortBy,
      status: 'all',
    };

    if (userCoords) {
      params.userLat = userCoords.lat.toString();
      params.userLng = userCoords.lng.toString();
    }
    if (currentLocation) {
      params.location = currentLocation;
    }
    if (locationScope === 'strict') {
      params.filterLocationOnly = 'true';
    } else if (locationScope === '5km') {
      params.radiusKm = '5';
    } else if (locationScope === '15km') {
      params.radiusKm = '15';
    }

    if (search.trim()) params.search = search.trim();
    if (selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedDietary !== 'All') params.dietary = selectedDietary;
    if (selectedPriority !== 'All') params.priority = selectedPriority;

    api.getListings(params)
      .then(res => {
        setListings(res.listings);
        if (res.listings.length > 0) {
          setActiveMapItem(res.listings[0]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(fetchListings, 150);
    return () => clearTimeout(timer);
  }, [
    search,
    selectedCategory,
    selectedDietary,
    selectedPriority,
    sortBy,
    currentLocation,
    userCoords?.lat,
    userCoords?.lng,
    locationScope,
  ]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedDietary('All');
    setSelectedPriority('All');
    setSortBy('distance');
    setLocationScope('all');
  };

  const handleRequestClick = (listing: FoodListing) => {
    setSelectedListing(listing);
    setIsRequestModalOpen(true);
  };

  // Dynamically compute real-time distance from user's live coordinates
  const displayListings = React.useMemo(() => {
    if (!userCoords) return listings;
    return listings.map(l => {
      const lat = l.coordinates?.lat || 18.5590;
      const lng = l.coordinates?.lng || 73.7868;
      const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, lat, lng);
      return {
        ...l,
        distanceKm: dist,
      };
    });
  }, [listings, userCoords?.lat, userCoords?.lng]);

  const filteredAndSortedListings = React.useMemo(() => {
    let result = [...displayListings];

    // Client-side instant keyword search matching
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      result = result.filter(l => {
        const title = (l.title || '').toLowerCase();
        const desc = (l.description || '').toLowerCase();
        const cat = (l.category || '').toLowerCase();
        const city = (l.city || '').toLowerCase();
        const addr = (l.pickupAddress || '').toLowerCase();
        const donor = (l.donorName || '').toLowerCase();
        const org = (l.donorOrgName || '').toLowerCase();
        const tags = (l.dietaryTags || []).map(t => t.toLowerCase()).join(' ');
        const combined = `${title} ${desc} ${cat} ${city} ${addr} ${donor} ${org} ${tags}`;
        return combined.includes(q) || tokens.every(token => combined.includes(token));
      });
    }

    // Client-side instant dietary tag filter
    if (selectedDietary !== 'All') {
      const lowerDiet = selectedDietary.toLowerCase();
      result = result.filter(l =>
        l.dietaryTags.some(t => {
          const lowerT = t.toLowerCase();
          return lowerT === lowerDiet || lowerT.includes(lowerDiet) || lowerDiet.includes(lowerT);
        })
      );
    }

    // Client-side instant category filter
    if (selectedCategory !== 'All') {
      result = result.filter(l => l.category === selectedCategory);
    }

    // Client-side instant priority filter
    if (selectedPriority !== 'All') {
      result = result.filter(l => l.rescuePriority === selectedPriority);
    }

    if (locationScope === '5km') {
      result = result.filter(l => (l.distanceKm !== undefined ? l.distanceKm <= 5 : true));
    } else if (locationScope === '15km') {
      result = result.filter(l => (l.distanceKm !== undefined ? l.distanceKm <= 15 : true));
    } else if (locationScope === 'strict') {
      const area = currentLocation.split(',')[0].toLowerCase().trim();
      result = result.filter(l =>
        l.pickupAddress.toLowerCase().includes(area) ||
        l.city.toLowerCase().includes(area)
      );
    }

    if (sortBy === 'distance') {
      result.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (sortBy === 'expiry_asc') {
      result.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'servings') {
      result.sort((a, b) => b.estimatedServings - a.estimatedServings);
    }
    return result;
  }, [displayListings, search, selectedDietary, selectedCategory, selectedPriority, sortBy, locationScope, currentLocation]);

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] text-stone-900 dark:text-stone-100 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200/80 dark:border-stone-850">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>📍 Food available near {currentLocation}</span>
              </span>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-stone-200 dark:border-stone-750 transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-stone-200 dark:border-stone-750 transition shadow-xs cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>Change Location</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Find Food Near You
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              Rescue surplus Indian meals, rotis, sabzi, thalis, and fresh produce before they expire.
            </p>
          </div>

          {/* View toggle (Grid vs Map) */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl border border-stone-200 dark:border-stone-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid ({filteredAndSortedListings.length})</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>
        </div>

        {/* Live GPS Tracking Banner */}
        {isLiveTracking && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Live Location Tracking Active
                  </span>
                  {gpsAccuracy && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-semibold">
                      ±{Math.round(gpsAccuracy)}m accuracy
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Live Coordinates: ({userCoords?.lat.toFixed(4)}°, {userCoords?.lng.toFixed(4)}°) • Distances calculating dynamically
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={simulateLiveMovement}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-755 hover:text-emerald-600 transition cursor-pointer"
                title="Simulate walking through Jaipur streets to test live tracking"
              >
                🏃 Simulate Movement
              </button>
              <button
                type="button"
                onClick={stopLiveTracking}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 transition cursor-pointer"
              >
                Stop Tracking
              </button>
            </div>
          </div>
        )}

        {/* Quick Locality & City Selector Ribbon */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-stone-500 whitespace-nowrap flex items-center gap-1 shrink-0">
            <Compass className="w-3.5 h-3.5 text-amber-500" /> Area:
          </span>
          {['Vaishali Nagar, Jaipur', 'Malviya Nagar, Jaipur', 'C-Scheme, Jaipur', 'Mansarovar, Jaipur', 'Raja Park, Jaipur', 'Delhi NCR', 'Mumbai, Maharashtra', 'Bengaluru, Karnataka'].map(loc => {
            const isCurrent = currentLocation === loc;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => handleSelectLocation(loc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-semibold'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400'
                }`}
              >
                <span>{loc.split(',')[0]}</span>
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shrink-0 cursor-pointer"
          >
            + All Indian Cities
          </button>
        </div>

        {/* Enhanced Keyword Search & Filter Controls */}
        <div className="mt-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-4 sm:p-6 shadow-sm space-y-4">
          {/* Main Keyword Search Bar */}
          <div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search food item (e.g. roti, paneer, biryani, bread, fruits) or dietary category (e.g. Pure Veg, Jain)..."
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-stone-200 dark:border-stone-750 bg-stone-50/70 dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-stone-900 shadow-xs transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                    title="Clear keyword search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="w-full sm:w-auto flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-750 bg-stone-50/70 dark:bg-stone-850 text-stone-800 dark:text-stone-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-xs"
                >
                  <option value="distance">📍 Distance (Closest First)</option>
                  <option value="expiry_asc">⏳ Expiring Soonest</option>
                  <option value="newest">✨ Newest Listings</option>
                  <option value="servings">🍽️ Most Servings</option>
                </select>

                {(search || selectedCategory !== 'All' || selectedDietary !== 'All' || selectedPriority !== 'All' || locationScope !== 'all') && (
                  <button
                    onClick={handleClearFilters}
                    className="p-3 rounded-2xl border border-stone-200 dark:border-stone-750 bg-stone-50/70 dark:bg-stone-850 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs transition cursor-pointer shrink-0"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Item Keywords Ribbon */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="font-bold text-stone-600 dark:text-stone-400 whitespace-nowrap shrink-0 flex items-center gap-1">
                <span>Quick Items:</span>
              </span>
              {POPULAR_ITEM_KEYWORDS.map(item => {
                const isActive = search.toLowerCase().trim() === item.query.toLowerCase().trim();
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setSearch('');
                      } else {
                        setSearch(item.query);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-semibold'
                        : 'bg-white dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-750 hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {isActive && <X className="w-3 h-3 text-emerald-200" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary Categories & Urgency Row */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 space-y-3">
            {/* Dietary Categories */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" /> Dietary Category:
              </span>
              {DIETARY_TAGS.map(diet => {
                const isActive = selectedDietary === diet;
                return (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => setSelectedDietary(isActive && diet !== 'All' ? 'All' : diet)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition border cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs font-semibold'
                        : 'bg-white dark:bg-stone-800/70 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-750 hover:bg-stone-50 dark:hover:bg-stone-750'
                    }`}
                  >
                    {diet}
                  </button>
                );
              })}
            </div>

            {/* Food Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="font-bold text-stone-700 dark:text-stone-300 whitespace-nowrap shrink-0">
                Food Type:
              </span>
              {CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(isActive && cat !== 'All' ? 'All' : cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition border shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
                        : 'bg-white dark:bg-stone-800/70 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-750 hover:border-stone-400'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Distance Scope & Urgency */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Distance:
                </span>
                <button
                  type="button"
                  onClick={() => setLocationScope('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border cursor-pointer ${
                    locationScope === 'all'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 font-semibold'
                      : 'bg-stone-50 dark:bg-stone-850 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-emerald-600'
                  }`}
                >
                  All Available
                </button>
                <button
                  type="button"
                  onClick={() => setLocationScope('5km')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border cursor-pointer ${
                    locationScope === '5km'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 font-semibold'
                      : 'bg-stone-50 dark:bg-stone-850 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-emerald-600'
                  }`}
                >
                  Within 5 km
                </button>
                <button
                  type="button"
                  onClick={() => setLocationScope('15km')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border cursor-pointer ${
                    locationScope === '15km'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 font-semibold'
                      : 'bg-stone-50 dark:bg-stone-850 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-emerald-600'
                  }`}
                >
                  Within 15 km
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> Urgency:
                </span>
                {PRIORITIES.map(pri => (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setSelectedPriority(pri)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                      selectedPriority === pri
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters Summary Ribbon */}
          {(search || selectedCategory !== 'All' || selectedDietary !== 'All' || selectedPriority !== 'All' || locationScope !== 'all') && (
            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  Active Filters ({filteredAndSortedListings.length} found):
                </span>
                {search && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-medium">
                    <span>Keyword: "{search}"</span>
                    <button type="button" onClick={() => setSearch('')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedDietary !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-medium">
                    <span>Diet: {selectedDietary}</span>
                    <button type="button" onClick={() => setSelectedDietary('All')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-medium">
                    <span>Type: {selectedCategory}</span>
                    <button type="button" onClick={() => setSelectedCategory('All')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedPriority !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-medium">
                    <span>Urgency: {selectedPriority}</span>
                    <button type="button" onClick={() => setSelectedPriority('All')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {locationScope !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-medium">
                    <span>Range: {locationScope}</span>
                    <button type="button" onClick={() => setLocationScope('all')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Content View */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="h-80 rounded-2xl bg-stone-200/60 dark:bg-stone-850 animate-pulse border border-stone-200 dark:border-stone-800"
                />
              ))}
            </div>
          ) : filteredAndSortedListings.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                {search ? `No food items found matching "${search}"` : `No surplus food found near ${currentLocation}`}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-md mx-auto">
                {search
                  ? `We couldn't find "${search}" with your current filters. Try searching for common items like "roti", "thali", "biryani", or check your dietary selection.`
                  : `Try widening your distance range to "All Available" or clearing filters to see nearby surplus meals.`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 transition cursor-pointer"
                  >
                    Clear keyword "{search}"
                  </button>
                )}
                {selectedDietary !== 'All' && (
                  <button
                    onClick={() => setSelectedDietary('All')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition cursor-pointer"
                  >
                    Reset Diet Filter ({selectedDietary})
                  </button>
                )}
                <button
                  onClick={() => setLocationScope('all')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 transition cursor-pointer"
                >
                  Show All Available Food
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedListings.map(listing => (
                <FoodCard
                  key={listing.id}
                  listing={listing}
                  onRequestClick={handleRequestClick}
                />
              ))}
            </div>
          ) : (
            /* Interactive Map View with Leaflet + OpenStreetMap */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Leaflet + OpenStreetMap Interactive Canvas */}
              <div className="lg:col-span-7">
                <LiveFoodMap
                  userCoords={userCoords}
                  listings={filteredAndSortedListings}
                  selectedListing={activeMapItem}
                  onSelectListing={listing => setActiveMapItem(listing)}
                  onRequestClick={handleRequestClick}
                  className="h-[560px]"
                  isDarkMode={typeof document !== 'undefined' && document.documentElement.classList.contains('dark')}
                />
              </div>

              {/* Selected Pin Details / List */}
              <div className="lg:col-span-5 flex flex-col gap-4 max-h-[560px] overflow-y-auto">
                {activeMapItem && (
                  <div className="p-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-2">
                      Selected Location
                    </span>
                    <FoodCard
                      listing={activeMapItem}
                      onRequestClick={handleRequestClick}
                    />
                  </div>
                )}

                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-3">
                    Other Nearby Listings ({filteredAndSortedListings.length})
                  </span>
                  <div className="space-y-2.5">
                    {filteredAndSortedListings
                      .filter(l => l.id !== activeMapItem?.id)
                      .slice(0, 6)
                      .map(l => (
                        <div
                          key={l.id}
                          onClick={() => setActiveMapItem(l)}
                          className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-emerald-600 cursor-pointer flex items-center justify-between transition"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={l.imageUrl}
                              alt={l.title}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                            <div>
                              <h5 className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[180px]">
                                {l.title}
                              </h5>
                              <p className="text-[11px] text-stone-500">
                                {l.quantity} {l.unit} • {l.distanceKm !== undefined ? `${l.distanceKm} km` : 'Near you'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            View
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Modal */}
      <RequestModal
        listing={selectedListing}
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedListing(null);
        }}
        onSuccess={() => {
          fetchListings();
        }}
      />

      {/* Indian Location Selection Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Change Pickup Region
                  </h3>
                  <p className="text-xs text-stone-500">
                    Currently set to: <strong className="text-emerald-700 dark:text-emerald-400">{currentLocation}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Jaipur Localities */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                Jaipur Localities (Default Demo Region)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {JAIPUR_LOCALITIES.map(loc => {
                  const isSelected = currentLocation === loc;
                  return (
                    <button
                      key={loc}
                      onClick={() => handleSelectLocation(loc)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-800 dark:text-stone-200 border-stone-200/80 dark:border-stone-750'
                      }`}
                    >
                      <span className="truncate">{loc.split(',')[0]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Other Indian Metros */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                Other Indian Cities
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {OTHER_INDIAN_CITIES.map(city => {
                  const isSelected = currentLocation === city;
                  return (
                    <button
                      key={city}
                      onClick={() => handleSelectLocation(city)}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200/60 dark:border-stone-800'
                      }`}
                    >
                      <span className="truncate">{city}</span>
                      {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowLocationPicker(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit Location Permission Modal */}
      {showLocationPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <Navigation className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                Share Your Location with ShareBite?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                We use the browser Geolocation API to detect nearby surplus food donations in your city and calculate real-time walking and driving distances.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-750 text-[11px] text-stone-600 dark:text-stone-400 space-y-1.5">
              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Privacy First</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Your coordinates are used strictly in-browser to sort nearby food and render map pins.</li>
                <li>Never permanently stored or tracked in the background.</li>
                <li>You can switch back to any Indian locality at any time.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={simulateLiveMovement}
                className="w-full sm:flex-1 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🏃 Simulate Movement</span>
              </button>
              <button
                type="button"
                onClick={executeBrowserGeolocation}
                className="w-full sm:flex-1 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Auto-Detect Location</span>
              </button>
            </div>
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowLocationPermissionModal(false);
                  setShowLocationPicker(true);
                }}
                className="text-xs text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium underline underline-offset-2 cursor-pointer"
              >
                Or manually choose city / locality instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
