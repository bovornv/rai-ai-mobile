import { create } from 'zustand';
import { FarmField, Crop, SensorData, WeatherData, AIPrediction, User } from '../types';

interface FarmState {
  // Data
  fields: FarmField[];
  crops: Crop[];
  sensors: SensorData[];
  weather: WeatherData | null;
  predictions: AIPrediction[];
  user: User | null;
  
  // Loading states
  loading: {
    fields: boolean;
    crops: boolean;
    sensors: boolean;
    weather: boolean;
    predictions: boolean;
  };
  
  // Error states
  errors: {
    fields: string | null;
    crops: string | null;
    sensors: string | null;
    weather: string | null;
    predictions: string | null;
  };
  
  // Actions
  setFields: (fields: FarmField[]) => void;
  addField: (field: FarmField) => void;
  updateField: (id: string, updates: Partial<FarmField>) => void;
  deleteField: (id: string) => void;
  
  setCrops: (crops: Crop[]) => void;
  addCrop: (crop: Crop) => void;
  updateCrop: (id: string, updates: Partial<Crop>) => void;
  deleteCrop: (id: string) => void;
  
  setSensors: (sensors: SensorData[]) => void;
  addSensor: (sensor: SensorData) => void;
  updateSensor: (id: string, updates: Partial<SensorData>) => void;
  
  setWeather: (weather: WeatherData) => void;
  setPredictions: (predictions: AIPrediction[]) => void;
  setUser: (user: User) => void;
  
  setLoading: (key: keyof FarmState['loading'], value: boolean) => void;
  setError: (key: keyof FarmState['errors'], error: string | null) => void;
  
  // Computed values
  getFieldById: (id: string) => FarmField | undefined;
  getCropsByField: (fieldId: string) => Crop[];
  getSensorsByField: (fieldId: string) => SensorData[];
  getFieldHealthScore: (fieldId: string) => number;
}

export const useFarmStore = create<FarmState>((set, get) => ({
  // Initial state
  fields: [],
  crops: [],
  sensors: [],
  weather: null,
  predictions: [],
  user: null,
  
  loading: {
    fields: false,
    crops: false,
    sensors: false,
    weather: false,
    predictions: false,
  },
  
  errors: {
    fields: null,
    crops: null,
    sensors: null,
    weather: null,
    predictions: null,
  },
  
  // Field actions
  setFields: (fields) => set({ fields }),
  addField: (field) => set((state) => ({ fields: [...state.fields, field] })),
  updateField: (id, updates) => set((state) => ({
    fields: state.fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    )
  })),
  deleteField: (id) => set((state) => ({
    fields: state.fields.filter(field => field.id !== id)
  })),
  
  // Crop actions
  setCrops: (crops) => set({ crops }),
  addCrop: (crop) => set((state) => ({ crops: [...state.crops, crop] })),
  updateCrop: (id, updates) => set((state) => ({
    crops: state.crops.map(crop => 
      crop.id === id ? { ...crop, ...updates } : crop
    )
  })),
  deleteCrop: (id) => set((state) => ({
    crops: state.crops.filter(crop => crop.id !== id)
  })),
  
  // Sensor actions
  setSensors: (sensors) => set({ sensors }),
  addSensor: (sensor) => set((state) => ({ sensors: [...state.sensors, sensor] })),
  updateSensor: (id, updates) => set((state) => ({
    sensors: state.sensors.map(sensor => 
      sensor.id === id ? { ...sensor, ...updates } : sensor
    )
  })),
  
  // Weather and predictions
  setWeather: (weather) => set({ weather }),
  setPredictions: (predictions) => set({ predictions }),
  setUser: (user) => set({ user }),
  
  // Loading and error states
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  })),
  setError: (key, error) => set((state) => ({
    errors: { ...state.errors, [key]: error }
  })),
  
  // Computed values
  getFieldById: (id) => get().fields.find(field => field.id === id),
  getCropsByField: (fieldId) => get().crops.filter(crop => 
    get().fields.find(field => field.id === fieldId)?.crops.some(c => c.id === crop.id)
  ),
  getSensorsByField: (fieldId) => get().sensors.filter(sensor => 
    get().fields.find(field => field.id === fieldId)?.sensors.some(s => s.id === sensor.id)
  ),
  getFieldHealthScore: (fieldId) => {
    const field = get().getFieldById(fieldId);
    if (!field) return 0;
    
    const cropHealthScores = field.crops.map(crop => crop.healthScore);
    const sensorHealthScores = field.sensors
      .filter(sensor => sensor.status === 'active')
      .map(sensor => {
        // Convert sensor values to health scores (simplified)
        switch (sensor.type) {
          case 'temperature':
            return sensor.value >= 20 && sensor.value <= 30 ? 100 : 50;
          case 'humidity':
            return sensor.value >= 40 && sensor.value <= 70 ? 100 : 50;
          case 'soil_moisture':
            return sensor.value >= 30 && sensor.value <= 60 ? 100 : 50;
          default:
            return 75;
        }
      });
    
    const allScores = [...cropHealthScores, ...sensorHealthScores];
    return allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
      : 0;
  },
}));
