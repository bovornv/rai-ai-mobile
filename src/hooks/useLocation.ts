import { useState, useEffect, useCallback } from 'react';
import { locationService, LocationData } from '../services/locationService';
import { Alert } from 'react-native';

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await locationService.requestLocationPermission();
      setPermissionGranted(hasPermission);

      if (!hasPermission) {
        setError('Location permission denied');
        return null;
      }

      const currentLocation = await locationService.getCurrentLocation();
      
      if (currentLocation) {
        setLocation(currentLocation);
        setError(null);
      } else {
        setError('Unable to get current location');
      }

      return currentLocation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const watchLocation = useCallback(() => {
    if (!permissionGranted) return () => {};

    return locationService.watchLocation(
      (newLocation) => {
        setLocation(newLocation);
        setError(null);
      },
      {
        accuracy: options.enableHighAccuracy ? 1 : 2, // LocationAccuracy enum values
        timeInterval: options.timeout || 10000,
        distanceInterval: 10,
      }
    );
  }, [permissionGranted, options.enableHighAccuracy, options.timeout]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      return await locationService.reverseGeocode(lat, lng);
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return null;
    }
  }, []);

  const calculateDistance = useCallback((
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    return locationService.calculateDistance(lat1, lng1, lat2, lng2);
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  useEffect(() => {
    if (options.watch && permissionGranted) {
      const stopWatching = watchLocation();
      return stopWatching;
    }
  }, [options.watch, permissionGranted, watchLocation]);

  return {
    location,
    loading,
    error,
    permissionGranted,
    getCurrentLocation,
    watchLocation,
    reverseGeocode,
    calculateDistance,
  };
};

export const useLocationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const checkPermission = useCallback(async () => {
    try {
      const hasPermission = await locationService.requestLocationPermission();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
      return hasPermission;
    } catch (err) {
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const hasPermission = await locationService.requestLocationPermission();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
      
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to provide weather data and field monitoring for your farm.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => locationService.requestLocationPermission() },
          ]
        );
      }
      
      return hasPermission;
    } catch (err) {
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    permissionStatus,
    checkPermission,
    requestPermission,
    isGranted: permissionStatus === 'granted',
  };
};
