// App configuration
export const APP_CONFIG = {
  name: 'RAI AI Farming',
  version: '1.0.0',
  apiBaseUrl: 'https://api.rai-ai-farming.com/v1',
  defaultLocation: {
    latitude: 40.7128,
    longitude: -74.0060,
  },
  refreshInterval: 30000, // 30 seconds
  maxRetries: 3,
  timeout: 10000, // 10 seconds
} as const;

// Crop types and their properties
export const CROP_TYPES = {
  vegetable: {
    name: 'Vegetable',
    icon: '🥬',
    colors: {
      primary: '#4CAF50',
      secondary: '#8BC34A',
      background: '#E8F5E8',
    },
    growthStages: [
      { name: 'Seedling', duration: 14, icon: '🌱' },
      { name: 'Vegetative', duration: 30, icon: '🌿' },
      { name: 'Flowering', duration: 14, icon: '🌸' },
      { name: 'Fruiting', duration: 21, icon: '🍅' },
      { name: 'Mature', duration: 7, icon: '✅' },
    ],
  },
  fruit: {
    name: 'Fruit',
    icon: '🍎',
    colors: {
      primary: '#FF9800',
      secondary: '#FFC107',
      background: '#FFF3E0',
    },
    growthStages: [
      { name: 'Seedling', duration: 21, icon: '🌱' },
      { name: 'Vegetative', duration: 60, icon: '🌿' },
      { name: 'Flowering', duration: 21, icon: '🌸' },
      { name: 'Fruiting', duration: 45, icon: '🍎' },
      { name: 'Mature', duration: 14, icon: '✅' },
    ],
  },
  grain: {
    name: 'Grain',
    icon: '🌾',
    colors: {
      primary: '#8BC34A',
      secondary: '#CDDC39',
      background: '#F1F8E9',
    },
    growthStages: [
      { name: 'Seedling', duration: 10, icon: '🌱' },
      { name: 'Vegetative', duration: 45, icon: '🌿' },
      { name: 'Flowering', duration: 14, icon: '🌸' },
      { name: 'Fruiting', duration: 30, icon: '🌾' },
      { name: 'Mature', duration: 7, icon: '✅' },
    ],
  },
  herb: {
    name: 'Herb',
    icon: '🌿',
    colors: {
      primary: '#4CAF50',
      secondary: '#8BC34A',
      background: '#E8F5E8',
    },
    growthStages: [
      { name: 'Seedling', duration: 7, icon: '🌱' },
      { name: 'Vegetative', duration: 21, icon: '🌿' },
      { name: 'Flowering', duration: 14, icon: '🌸' },
      { name: 'Fruiting', duration: 7, icon: '🌿' },
      { name: 'Mature', duration: 3, icon: '✅' },
    ],
  },
} as const;

// Sensor types and their properties
export const SENSOR_TYPES = {
  temperature: {
    name: 'Temperature',
    unit: '°C',
    icon: '🌡️',
    min: -10,
    max: 50,
    optimal: { min: 20, max: 30 },
    colors: {
      low: '#2196F3',
      normal: '#4CAF50',
      high: '#FF9800',
      critical: '#F44336',
    },
  },
  humidity: {
    name: 'Humidity',
    unit: '%',
    icon: '💧',
    min: 0,
    max: 100,
    optimal: { min: 40, max: 70 },
    colors: {
      low: '#FF9800',
      normal: '#4CAF50',
      high: '#2196F3',
      critical: '#F44336',
    },
  },
  soil_moisture: {
    name: 'Soil Moisture',
    unit: '%',
    icon: '🌱',
    min: 0,
    max: 100,
    optimal: { min: 30, max: 60 },
    colors: {
      low: '#FF9800',
      normal: '#4CAF50',
      high: '#2196F3',
      critical: '#F44336',
    },
  },
  ph: {
    name: 'pH Level',
    unit: 'pH',
    icon: '🧪',
    min: 0,
    max: 14,
    optimal: { min: 6.0, max: 7.5 },
    colors: {
      low: '#F44336',
      normal: '#4CAF50',
      high: '#2196F3',
      critical: '#9C27B0',
    },
  },
  light: {
    name: 'Light Intensity',
    unit: 'lux',
    icon: '☀️',
    min: 0,
    max: 100000,
    optimal: { min: 10000, max: 50000 },
    colors: {
      low: '#FF9800',
      normal: '#4CAF50',
      high: '#FFC107',
      critical: '#F44336',
    },
  },
  nutrients: {
    name: 'Nutrients',
    unit: 'ppm',
    icon: '🧬',
    min: 0,
    max: 1000,
    optimal: { min: 100, max: 500 },
    colors: {
      low: '#FF9800',
      normal: '#4CAF50',
      high: '#2196F3',
      critical: '#F44336',
    },
  },
} as const;

// Weather conditions
export const WEATHER_CONDITIONS = {
  sunny: { name: 'Sunny', icon: '☀️', color: '#FFC107' },
  cloudy: { name: 'Cloudy', icon: '☁️', color: '#9E9E9E' },
  rainy: { name: 'Rainy', icon: '🌧️', color: '#2196F3' },
  stormy: { name: 'Stormy', icon: '⛈️', color: '#673AB7' },
  snowy: { name: 'Snowy', icon: '❄️', color: '#E1F5FE' },
} as const;

// Disease types and treatments
export const DISEASE_TYPES = {
  blight: {
    name: 'Blight',
    symptoms: ['Brown spots on leaves', 'Wilting', 'Stunted growth'],
    treatment: ['Remove affected plants', 'Apply fungicide', 'Improve air circulation'],
    prevention: ['Proper spacing', 'Avoid overhead watering', 'Crop rotation'],
  },
  powdery_mildew: {
    name: 'Powdery Mildew',
    symptoms: ['White powdery coating', 'Yellowing leaves', 'Reduced yield'],
    treatment: ['Apply sulfur fungicide', 'Increase air circulation', 'Remove affected parts'],
    prevention: ['Proper spacing', 'Avoid overhead watering', 'Resistant varieties'],
  },
  root_rot: {
    name: 'Root Rot',
    symptoms: ['Wilting', 'Yellow leaves', 'Stunted growth', 'Brown roots'],
    treatment: ['Improve drainage', 'Apply fungicide', 'Remove affected plants'],
    prevention: ['Well-draining soil', 'Avoid overwatering', 'Proper spacing'],
  },
  aphids: {
    name: 'Aphids',
    symptoms: ['Curled leaves', 'Sticky residue', 'Ants on plants'],
    treatment: ['Spray with soapy water', 'Introduce beneficial insects', 'Apply neem oil'],
    prevention: ['Regular inspection', 'Companion planting', 'Healthy soil'],
  },
} as const;

// Soil types
export const SOIL_TYPES = {
  clay: {
    name: 'Clay',
    description: 'Heavy, retains water well',
    color: '#8D6E63',
    characteristics: ['High water retention', 'Slow drainage', 'Rich in nutrients'],
  },
  sandy: {
    name: 'Sandy',
    description: 'Light, drains quickly',
    color: '#D7CCC8',
    characteristics: ['Fast drainage', 'Low water retention', 'Requires frequent watering'],
  },
  loamy: {
    name: 'Loamy',
    description: 'Ideal soil type',
    color: '#A1887F',
    characteristics: ['Good drainage', 'Good water retention', 'Rich in nutrients'],
  },
  silty: {
    name: 'Silty',
    description: 'Smooth texture, holds moisture',
    color: '#BCAAA4',
    characteristics: ['Good water retention', 'Fertile', 'Can compact easily'],
  },
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  irrigation: {
    name: 'Irrigation',
    icon: '💧',
    color: '#2196F3',
    priority: 'high',
  },
  weather: {
    name: 'Weather',
    icon: '🌤️',
    color: '#FF9800',
    priority: 'medium',
  },
  disease: {
    name: 'Disease',
    icon: '🦠',
    color: '#F44336',
    priority: 'high',
  },
  harvest: {
    name: 'Harvest',
    icon: '🌾',
    color: '#4CAF50',
    priority: 'medium',
  },
} as const;

// Chart colors
export const CHART_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#FFC107', // Amber
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63', // Pink
] as const;

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  fields: {
    list: '/fields',
    detail: '/fields/:id',
    create: '/fields',
    update: '/fields/:id',
    delete: '/fields/:id',
  },
  crops: {
    list: '/crops',
    detail: '/crops/:id',
    create: '/crops',
    update: '/crops/:id',
    delete: '/crops/:id',
  },
  sensors: {
    list: '/sensors',
    latest: '/sensors/latest',
    history: '/sensors/history',
  },
  weather: {
    current: '/weather',
    forecast: '/weather/forecast',
  },
  ai: {
    predictions: '/predictions',
    diseaseDetection: '/ai/disease-detection',
    yieldPrediction: '/ai/yield-prediction',
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your internet connection.',
  unauthorized: 'Unauthorized. Please log in again.',
  forbidden: 'Access denied. You don\'t have permission to perform this action.',
  notFound: 'Resource not found.',
  serverError: 'Server error. Please try again later.',
  validation: 'Please check your input and try again.',
  location: 'Location access is required for this feature.',
  camera: 'Camera access is required to take photos.',
  notification: 'Notification permission is required for alerts.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  fieldCreated: 'Field created successfully',
  fieldUpdated: 'Field updated successfully',
  fieldDeleted: 'Field deleted successfully',
  cropAdded: 'Crop added successfully',
  cropUpdated: 'Crop updated successfully',
  cropDeleted: 'Crop deleted successfully',
  irrigationScheduled: 'Irrigation scheduled successfully',
  notificationEnabled: 'Notifications enabled',
  dataSynced: 'Data synced successfully',
} as const;
