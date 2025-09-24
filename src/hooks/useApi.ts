import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useFarmStore } from '../stores/useFarmStore';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export const useApi = <T>(
  apiCall: () => Promise<{ success: boolean; data: T; error?: string }>,
  options: UseApiOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      if (result.success) {
        setData(result.data);
        options.onSuccess?.(result.data);
      } else {
        setError(result.error || 'An error occurred');
        options.onError?.(result.error || 'An error occurred');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiCall, options]);

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, [execute, options.immediate]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
  };
};

export const useFields = () => {
  const { fields, setFields, setLoading, setError } = useFarmStore();

  const fetchFields = useCallback(async () => {
    setLoading('fields', true);
    setError('fields', null);

    try {
      const result = await apiService.getFields();
      
      if (result.success) {
        setFields(result.data);
      } else {
        setError('fields', result.error || 'Failed to fetch fields');
      }
    } catch (err) {
      setError('fields', err instanceof Error ? err.message : 'Failed to fetch fields');
    } finally {
      setLoading('fields', false);
    }
  }, [setFields, setLoading, setError]);

  const createField = useCallback(async (fieldData: Omit<any, 'id'>) => {
    setLoading('fields', true);
    setError('fields', null);

    try {
      const result = await apiService.createField(fieldData);
      
      if (result.success) {
        // Field will be added to store by the API call
        return result.data;
      } else {
        setError('fields', result.error || 'Failed to create field');
        return null;
      }
    } catch (err) {
      setError('fields', err instanceof Error ? err.message : 'Failed to create field');
      return null;
    } finally {
      setLoading('fields', false);
    }
  }, [setLoading, setError]);

  return {
    fields,
    loading: useFarmStore(state => state.loading.fields),
    error: useFarmStore(state => state.errors.fields),
    fetchFields,
    createField,
  };
};

export const useCrops = (fieldId?: string) => {
  const { crops, setCrops, setLoading, setError } = useFarmStore();

  const fetchCrops = useCallback(async () => {
    setLoading('crops', true);
    setError('crops', null);

    try {
      const result = await apiService.getCrops(fieldId);
      
      if (result.success) {
        setCrops(result.data);
      } else {
        setError('crops', result.error || 'Failed to fetch crops');
      }
    } catch (err) {
      setError('crops', err instanceof Error ? err.message : 'Failed to fetch crops');
    } finally {
      setLoading('crops', false);
    }
  }, [fieldId, setCrops, setLoading, setError]);

  const createCrop = useCallback(async (cropData: Omit<any, 'id'>) => {
    setLoading('crops', true);
    setError('crops', null);

    try {
      const result = await apiService.createCrop(cropData);
      
      if (result.success) {
        return result.data;
      } else {
        setError('crops', result.error || 'Failed to create crop');
        return null;
      }
    } catch (err) {
      setError('crops', err instanceof Error ? err.message : 'Failed to create crop');
      return null;
    } finally {
      setLoading('crops', false);
    }
  }, [setLoading, setError]);

  return {
    crops,
    loading: useFarmStore(state => state.loading.crops),
    error: useFarmStore(state => state.errors.crops),
    fetchCrops,
    createCrop,
  };
};

export const useSensorData = (fieldId?: string) => {
  const { sensors, setSensors, setLoading, setError } = useFarmStore();

  const fetchSensorData = useCallback(async () => {
    setLoading('sensors', true);
    setError('sensors', null);

    try {
      const result = await apiService.getSensorData(fieldId);
      
      if (result.success) {
        setSensors(result.data);
      } else {
        setError('sensors', result.error || 'Failed to fetch sensor data');
      }
    } catch (err) {
      setError('sensors', err instanceof Error ? err.message : 'Failed to fetch sensor data');
    } finally {
      setLoading('sensors', false);
    }
  }, [fieldId, setSensors, setLoading, setError]);

  return {
    sensors,
    loading: useFarmStore(state => state.loading.sensors),
    error: useFarmStore(state => state.errors.sensors),
    fetchSensorData,
  };
};

export const useWeather = (lat?: number, lng?: number) => {
  const { weather, setWeather, setLoading, setError } = useFarmStore();

  const fetchWeather = useCallback(async () => {
    if (!lat || !lng) return;

    setLoading('weather', true);
    setError('weather', null);

    try {
      const result = await apiService.getWeatherData(lat, lng);
      
      if (result.success) {
        setWeather(result.data);
      } else {
        setError('weather', result.error || 'Failed to fetch weather data');
      }
    } catch (err) {
      setError('weather', err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading('weather', false);
    }
  }, [lat, lng, setWeather, setLoading, setError]);

  return {
    weather,
    loading: useFarmStore(state => state.loading.weather),
    error: useFarmStore(state => state.errors.weather),
    fetchWeather,
  };
};

export const usePredictions = (fieldId?: string) => {
  const { predictions, setPredictions, setLoading, setError } = useFarmStore();

  const fetchPredictions = useCallback(async () => {
    setLoading('predictions', true);
    setError('predictions', null);

    try {
      const result = await apiService.getPredictions(fieldId);
      
      if (result.success) {
        setPredictions(result.data);
      } else {
        setError('predictions', result.error || 'Failed to fetch predictions');
      }
    } catch (err) {
      setError('predictions', err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      setLoading('predictions', false);
    }
  }, [fieldId, setPredictions, setLoading, setError]);

  const generatePrediction = useCallback(async (
    type: any,
    fieldId: string,
    cropId?: string
  ) => {
    setLoading('predictions', true);
    setError('predictions', null);

    try {
      const result = await apiService.generatePrediction(type, fieldId, cropId);
      
      if (result.success) {
        return result.data;
      } else {
        setError('predictions', result.error || 'Failed to generate prediction');
        return null;
      }
    } catch (err) {
      setError('predictions', err instanceof Error ? err.message : 'Failed to generate prediction');
      return null;
    } finally {
      setLoading('predictions', false);
    }
  }, [setLoading, setError]);

  return {
    predictions,
    loading: useFarmStore(state => state.loading.predictions),
    error: useFarmStore(state => state.errors.predictions),
    fetchPredictions,
    generatePrediction,
  };
};
