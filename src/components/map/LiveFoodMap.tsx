import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FoodListing } from '../../types';

interface LiveFoodMapProps {
  userCoords: { lat: number; lng: number } | null;
  listings: FoodListing[];
  selectedListing: FoodListing | null;
  onSelectListing: (listing: FoodListing) => void;
  onRequestClick?: (listing: FoodListing) => void;
  className?: string;
  isDarkMode?: boolean;
}

export const LiveFoodMap: React.FC<LiveFoodMapProps> = ({
  userCoords,
  listings,
  selectedListing,
  onSelectListing,
  onRequestClick,
  className = 'h-[500px]',
  isDarkMode = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center: Jaipur, Rajasthan
    const initialLat = userCoords?.lat || 26.9124;
    const initialLng = userCoords?.lng || 75.7873;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
    });

    // Add Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap tile layer (dark matter for dark mode, OpenStreetMap standard for light)
    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Ensure map tiles render smoothly inside flex/grid containers
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer on dark mode toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
  }, [isDarkMode]);

  // Update User marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userCoords) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 border-2 border-white shadow-lg"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-stone-900">
            <strong class="text-xs text-emerald-700 block">📍 Your Live Position</strong>
            <span class="text-[11px] text-stone-500">Live coordinates active via Geolocation</span>
          </div>
        `);

      userMarkerRef.current = marker;
      // Center and pan smoothly to user's updated live location
      map.flyTo([userCoords.lat, userCoords.lng], 14, { duration: 1.0 });
    }
  }, [userCoords]);

  // Update Food markers and route
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    markersLayer.clearLayers();

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const bounds = L.latLngBounds([]);
    if (userCoords) {
      bounds.extend([userCoords.lat, userCoords.lng]);
    }

    listings.forEach(listing => {
      const lat = listing.coordinates?.lat || 18.5590;
      const lng = listing.coordinates?.lng || 73.7868;
      bounds.extend([lat, lng]);

      const isSelected = selectedListing?.id === listing.id;
      const isUrgent = listing.rescuePriority === 'Urgent';

      // Custom DivIcon for Food Donors
      const markerHtml = `
        <div class="relative transition-transform duration-200 cursor-pointer ${isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'}">
          <div class="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl shadow-xl font-sans text-xs font-bold border-2 ${
            isSelected
              ? 'bg-amber-400 text-stone-950 border-white ring-4 ring-amber-400/40'
              : isUrgent
              ? 'bg-rose-600 text-white border-white'
              : 'bg-emerald-800 text-white border-emerald-600'
          }">
            <span class="text-sm">🍱</span>
            <span class="max-w-[80px] truncate text-[11px]">${listing.title.split(' ')[0]}</span>
          </div>
          <div class="w-2 h-2 mx-auto rotate-45 -mt-1 ${
            isSelected ? 'bg-amber-400' : isUrgent ? 'bg-rose-600' : 'bg-emerald-800'
          }"></div>
        </div>
      `;

      const foodIcon = L.divIcon({
        className: 'food-listing-marker',
        html: markerHtml,
        iconSize: [110, 40],
        iconAnchor: [55, 38],
      });

      const marker = L.marker([lat, lng], { icon: foodIcon }).addTo(markersLayer);

      marker.on('click', () => {
        onSelectListing(listing);
      });

      // Bind detailed popup
      const popupHtml = `
        <div class="p-2.5 font-sans min-w-[200px]">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              isUrgent ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }">
              ${listing.category}
            </span>
            ${listing.distanceKm ? `<span class="text-[11px] font-semibold text-stone-600">${listing.distanceKm} km away</span>` : ''}
          </div>
          <h4 class="font-bold text-xs text-stone-900 leading-snug">${listing.title}</h4>
          <p class="text-[11px] text-stone-500 mt-1">${listing.donorOrgName || listing.donorName}</p>
          <div class="mt-2 text-xs font-semibold text-emerald-700">
            ${listing.quantity} ${listing.unit} • Feeds ~${listing.estimatedServings}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
    });

    // Draw routing line if user location and selected listing exist
    if (userCoords && selectedListing && selectedListing.coordinates) {
      const line = L.polyline(
        [
          [userCoords.lat, userCoords.lng],
          [selectedListing.coordinates.lat, selectedListing.coordinates.lng],
        ],
        {
          color: '#10b981',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.8,
        }
      ).addTo(map);

      routeLineRef.current = line;
    }
  }, [listings, selectedListing, userCoords]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (userCoords) {
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 14, { duration: 1.2 });
    } else if (listings.length > 0) {
      const first = listings[0];
      mapInstanceRef.current.flyTo([first.coordinates.lat, first.coordinates.lng], 13);
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([]);
    if (userCoords) bounds.extend([userCoords.lat, userCoords.lng]);
    listings.forEach(l => {
      bounds.extend([l.coordinates.lat, l.coordinates.lng]);
    });
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xl ${className}`}>
      {/* Map Container Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Header Floating Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-lg border border-stone-200/80 dark:border-stone-800 text-xs font-medium text-stone-800 dark:text-stone-200">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>OpenStreetMap Live Grid • {listings.length} Donors Nearby</span>
      </div>

      {/* Floating Action Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {userCoords && (
          <button
            type="button"
            onClick={handleRecenter}
            className="p-2.5 rounded-2xl bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-stone-800 shadow-lg border border-stone-200/80 dark:border-stone-800 transition"
            title="Recenter on My Location"
          >
            <span className="text-sm">🎯</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleFitAll}
          className="p-2.5 rounded-2xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 shadow-lg border border-stone-200/80 dark:border-stone-800 transition text-xs font-bold"
          title="Fit All Food Donors"
        >
          <span>🗺️</span>
        </button>
      </div>

      {/* Selected Item Floating Card on Mobile/Desktop */}
      {selectedListing && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-sm z-10 p-3.5 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-2xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 truncate">
            <img
              src={selectedListing.imageUrl}
              alt={selectedListing.title}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-200 dark:border-stone-700"
            />
            <div className="truncate">
              <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                {selectedListing.title}
              </h5>
              <p className="text-[11px] text-stone-500 truncate">
                {selectedListing.donorOrgName || selectedListing.donorName}
              </p>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {selectedListing.quantity} {selectedListing.unit} {selectedListing.distanceKm ? `• ${selectedListing.distanceKm} km away` : ''}
              </span>
            </div>
          </div>
          {onRequestClick && selectedListing.status === 'available' && (
            <button
              type="button"
              onClick={() => onRequestClick(selectedListing)}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs whitespace-nowrap shadow-xs transition shrink-0"
            >
              Request
            </button>
          )}
        </div>
      )}
    </div>
  );
};
