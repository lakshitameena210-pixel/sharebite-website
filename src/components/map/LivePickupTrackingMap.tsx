import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LivePickupTrackingMapProps {
  receiverLocation?: { lat: number; lng: number; accuracy?: number } | null;
  pickupLocation: { lat: number; lng: number; address: string; donorName: string };
  distanceKm?: number;
  etaMinutes?: number;
  trackingStatus: 'accepted' | 'on_the_way' | 'arrived' | 'collected';
  isTrackingActive?: boolean;
  className?: string;
}

export const LivePickupTrackingMap: React.FC<LivePickupTrackingMapProps> = ({
  receiverLocation,
  pickupLocation,
  distanceKm,
  etaMinutes,
  trackingStatus,
  isTrackingActive = true,
  className = 'h-[440px] sm:h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const receiverMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const donorMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Check dark mode
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = receiverLocation?.lat ?? pickupLocation.lat;
    const initialLng = receiverLocation?.lng ?? pickupLocation.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Fix map tile rendering inside grid/flex containers
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers, Route, and Bounds
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // 1. Donor Pickup Marker
    if (donorMarkerRef.current) {
      map.removeLayer(donorMarkerRef.current);
      donorMarkerRef.current = null;
    }

    const donorIcon = L.divIcon({
      className: 'donor-pickup-marker',
      html: `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500 text-stone-950 font-bold text-xs shadow-2xl border-2 border-white ring-4 ring-amber-400/40 whitespace-nowrap">
            <span class="text-sm">🍱</span>
            <span class="max-w-[110px] truncate">${pickupLocation.donorName}</span>
          </div>
          <div class="w-2.5 h-2.5 bg-amber-500 rotate-45 -mt-1 border-r border-b border-stone-800"></div>
          <span class="mt-0.5 px-2 py-0.5 rounded-full bg-stone-900/90 text-amber-300 text-[10px] font-semibold border border-amber-500/40">Pickup Spot</span>
        </div>
      `,
      iconSize: [160, 60],
      iconAnchor: [80, 52],
    });

    const donorMarker = L.marker([pickupLocation.lat, pickupLocation.lng], { icon: donorIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-2.5 font-sans min-w-[180px]">
          <strong class="text-xs text-amber-700 block">🍱 Pickup Location</strong>
          <h4 class="font-bold text-sm text-stone-900 mt-1">${pickupLocation.donorName}</h4>
          <p class="text-xs text-stone-600 mt-0.5">${pickupLocation.address}</p>
        </div>
      `);
    donorMarkerRef.current = donorMarker;

    // 2. Receiver Live Location Marker & Accuracy Circle
    if (receiverMarkerRef.current) {
      map.removeLayer(receiverMarkerRef.current);
      receiverMarkerRef.current = null;
    }
    if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }

    if (receiverLocation && typeof receiverLocation.lat === 'number' && typeof receiverLocation.lng === 'number') {
      const receiverIcon = L.divIcon({
        className: 'receiver-live-marker',
        html: `
          <div class="relative flex flex-col items-center">
            <div class="relative flex items-center justify-center w-10 h-10">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex items-center justify-center rounded-full h-7 w-7 bg-emerald-600 text-white font-bold text-xs border-2 border-white shadow-xl">
                📍
              </span>
            </div>
            <div class="px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-200 text-[10px] font-bold border border-emerald-400/50 shadow-md whitespace-nowrap -mt-1">
              You (Receiver)
            </div>
          </div>
        `,
        iconSize: [100, 56],
        iconAnchor: [50, 48],
      });

      const receiverMarker = L.marker([receiverLocation.lat, receiverLocation.lng], { icon: receiverIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 font-sans">
            <strong class="text-xs text-emerald-700 block">📍 Your Current Position</strong>
            <span class="text-xs text-stone-600">Active live geolocation broadcast</span>
            ${receiverLocation.accuracy ? `<div class="text-[10px] text-stone-400 mt-1">Accuracy: ±${Math.round(receiverLocation.accuracy)}m</div>` : ''}
          </div>
        `);
      receiverMarkerRef.current = receiverMarker;

      if (receiverLocation.accuracy && receiverLocation.accuracy < 200) {
        const circle = L.circle([receiverLocation.lat, receiverLocation.lng], {
          radius: receiverLocation.accuracy,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4',
        }).addTo(map);
        accuracyCircleRef.current = circle;
      }
    }

    // 3. Routing Polyline
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (receiverLocation && typeof receiverLocation.lat === 'number' && typeof receiverLocation.lng === 'number') {
      const line = L.polyline(
        [
          [receiverLocation.lat, receiverLocation.lng],
          [pickupLocation.lat, pickupLocation.lng],
        ],
        {
          color: '#059669',
          weight: 5,
          opacity: 0.85,
          dashArray: '10, 8',
        }
      ).addTo(map);
      routeLineRef.current = line;

      // Fit bounds to include both receiver and donor
      const bounds = L.latLngBounds([
        [receiverLocation.lat, receiverLocation.lng],
        [pickupLocation.lat, pickupLocation.lng],
      ]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 16 });
    } else {
      map.setView([pickupLocation.lat, pickupLocation.lng], 15);
    }
  }, [receiverLocation, pickupLocation, trackingStatus]);

  const handleRecenterReceiver = () => {
    if (!mapInstanceRef.current) return;
    if (receiverLocation) {
      mapInstanceRef.current.flyTo([receiverLocation.lat, receiverLocation.lng], 16, { duration: 1.2 });
    }
  };

  const handleRecenterPickup = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([pickupLocation.lat, pickupLocation.lng], 16, { duration: 1.2 });
  };

  const handleFitBoth = () => {
    if (!mapInstanceRef.current) return;
    if (receiverLocation) {
      const bounds = L.latLngBounds([
        [receiverLocation.lat, receiverLocation.lng],
        [pickupLocation.lat, pickupLocation.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
    } else {
      mapInstanceRef.current.setView([pickupLocation.lat, pickupLocation.lng], 15);
    }
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xl ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Live Status Overlay Header */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-lg border border-stone-200/80 dark:border-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isTrackingActive && trackingStatus !== 'collected'
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-stone-400'
            }`}
          />
          <span>
            {trackingStatus === 'collected'
              ? 'Pickup Completed'
              : trackingStatus === 'arrived'
              ? 'Arrived at Destination'
              : isTrackingActive
              ? 'Live GPS Active'
              : 'Static View'}
          </span>
        </div>

        {distanceKm !== undefined && (
          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-700 text-white shadow-lg text-xs font-bold flex items-center gap-1.5">
            <span>📏 {distanceKm} km</span>
            {etaMinutes !== undefined && <span>• ~{etaMinutes} min</span>}
          </div>
        )}
      </div>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {receiverLocation && (
          <button
            type="button"
            onClick={handleRecenterReceiver}
            className="p-2.5 rounded-2xl bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-stone-800 shadow-lg border border-stone-200/80 dark:border-stone-800 transition"
            title="Focus on My Position"
          >
            <span className="text-sm">📍</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleRecenterPickup}
          className="p-2.5 rounded-2xl bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-stone-800 shadow-lg border border-stone-200/80 dark:border-stone-800 transition"
          title="Focus on Food Pickup Location"
        >
          <span className="text-sm">🍱</span>
        </button>
        <button
          type="button"
          onClick={handleFitBoth}
          className="p-2.5 rounded-2xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 shadow-lg border border-stone-200/80 dark:border-stone-800 transition text-xs font-bold"
          title="Fit Both Locations"
        >
          <span>↔️</span>
        </button>
      </div>

      {/* Bottom Route Summary Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 p-3 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-2xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="text-base">🛣️</span>
          <span className="font-semibold text-stone-700 dark:text-stone-300 truncate">
            Heading to <strong className="text-stone-900 dark:text-stone-100">{pickupLocation.donorName}</strong> ({pickupLocation.address})
          </span>
        </div>
        {distanceKm !== undefined && (
          <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0 ml-2">
            {distanceKm} km away
          </span>
        )}
      </div>
    </div>
  );
};
