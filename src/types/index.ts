// Core farming data types
export interface Crop {
  id: string;
  name: string;
  type: 'vegetable' | 'fruit' | 'grain' | 'herb';
  variety: string;
  plantingDate: Date;
  expectedHarvestDate: Date;
  status: 'planted' | 'growing' | 'ready' | 'harvested';
  healthScore: number; // 0-100
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'mature';
}

export interface SensorData {
  id: string;
  type: 'temperature' | 'humidity' | 'soil_moisture' | 'ph' | 'light' | 'nutrients';
  value: number;
  unit: string;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'warning' | 'error';
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  uvIndex: number;
  timestamp: Date;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
  };
  precipitation: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  description: string;
}

export interface FarmField {
  id: string;
  name: string;
  area: number; // in acres
  location: {
    lat: number;
    lng: number;
  };
  soilType: 'clay' | 'sandy' | 'loamy' | 'silty';
  crops: Crop[];
  sensors: SensorData[];
  lastIrrigation: Date;
  irrigationSchedule: IrrigationSchedule;
}

export interface IrrigationSchedule {
  id: string;
  fieldId: string;
  frequency: number; // days
  duration: number; // minutes
  waterAmount: number; // liters
  isActive: boolean;
  nextIrrigation: Date;
}

// AI Prediction types
export interface AIPrediction {
  id: string;
  type: 'yield' | 'disease' | 'pest' | 'weather' | 'irrigation';
  confidence: number; // 0-100
  prediction: string;
  recommendations: string[];
  timestamp: Date;
  fieldId: string;
  cropId?: string;
}

export interface DiseaseDetection {
  id: string;
  cropId: string;
  diseaseName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  symptoms: string[];
  treatment: string[];
  imageUrl?: string;
  detectedAt: Date;
}

// User and Settings
export interface User {
  id: string;
  name: string;
  email: string;
  farmName: string;
  location: {
    lat: number;
    lng: number;
  };
  preferences: UserPreferences;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  notifications: {
    irrigation: boolean;
    weather: boolean;
    disease: boolean;
    harvest: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  FieldDetail: { fieldId: string };
  CropDetail: { cropId: string };
  SensorDetail: { sensorId: string };
  Settings: undefined;
  Profile: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Fields: undefined;
  Weather: undefined;
  AI: undefined;
  Settings: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Chart data types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: string;
    strokeWidth?: number;
  }[];
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}
