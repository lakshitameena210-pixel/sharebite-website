import { useState, useEffect, useRef, useCallback } from 'react';

export interface GeolocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoWatch?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 5000,
    autoWatch = false,
  } = options;

  const [coords, setCoords] = useState<GeolocationCoords | null>(null);
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  // Check initial permission status if Permissions API is supported
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission('unsupported');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    if ('permissions' in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then(result => {
          setPermission(result.state as PermissionState);
          result.onchange = () => {
            setPermission(result.state as PermissionState);
          };
        })
        .catch(() => {
          // Fallback if query fails
        });
    }
  }, []);

  const getCurrentPosition = useCallback((): Promise<GeolocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported by this browser.';
        setError(err);
        setPermission('unsupported');
        reject(new Error(err));
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        position => {
          const newCoords: GeolocationCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
            timestamp: position.timestamp,
          };
          setCoords(newCoords);
          setPermission('granted');
          setIsLoading(false);
          resolve(newCoords);
        },
        err => {
          setIsLoading(false);
          let message = 'Failed to retrieve your location.';
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Location access was denied. Please allow location permissions in your browser.';
            setPermission('denied');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = 'Location information is currently unavailable.';
          } else if (err.code === err.TIMEOUT) {
            message = 'Timed out while retrieving location.';
          }
          setError(message);
          reject(new Error(message));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  const startWatch = useCallback((onUpdate?: (c: GeolocationCoords) => void) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setPermission('unsupported');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setError(null);
    setIsWatching(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const newCoords: GeolocationCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp,
        };
        setCoords(newCoords);
        setPermission('granted');
        if (onUpdate) onUpdate(newCoords);
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied.');
          setPermission('denied');
          setIsWatching(false);
        } else {
          setError('Lost GPS signal or position unavailable.');
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  useEffect(() => {
    if (autoWatch) {
      startWatch();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoWatch, startWatch]);

  return {
    coords,
    setCoords,
    permission,
    isWatching,
    isLoading,
    error,
    getCurrentPosition,
    startWatch,
    stopWatch,
  };
}
