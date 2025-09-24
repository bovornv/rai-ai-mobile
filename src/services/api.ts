import { 
  FarmField, 
  Crop, 
  SensorData, 
  WeatherData, 
  AIPrediction, 
  User,
  ApiResponse,
  PaginatedResponse 
} from '../types';
import { environment } from '../config/environment';

class ApiService {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor(baseUrl: string = environment.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        data: null as T,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Field management
  async getFields(): Promise<ApiResponse<FarmField[]>> {
    return this.request<FarmField[]>('/fields');
  }

  async getFieldById(id: string): Promise<ApiResponse<FarmField>> {
    return this.request<FarmField>(`/fields/${id}`);
  }

  async createField(field: Omit<FarmField, 'id'>): Promise<ApiResponse<FarmField>> {
    return this.request<FarmField>('/fields', {
      method: 'POST',
      body: JSON.stringify(field),
    });
  }

  async updateField(id: string, updates: Partial<FarmField>): Promise<ApiResponse<FarmField>> {
    return this.request<FarmField>(`/fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteField(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/fields/${id}`, {
      method: 'DELETE',
    });
  }

  // Crop management
  async getCrops(fieldId?: string): Promise<ApiResponse<Crop[]>> {
    const endpoint = fieldId ? `/crops?fieldId=${fieldId}` : '/crops';
    return this.request<Crop[]>(endpoint);
  }

  async getCropById(id: string): Promise<ApiResponse<Crop>> {
    return this.request<Crop>(`/crops/${id}`);
  }

  async createCrop(crop: Omit<Crop, 'id'>): Promise<ApiResponse<Crop>> {
    return this.request<Crop>('/crops', {
      method: 'POST',
      body: JSON.stringify(crop),
    });
  }

  async updateCrop(id: string, updates: Partial<Crop>): Promise<ApiResponse<Crop>> {
    return this.request<Crop>(`/crops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCrop(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/crops/${id}`, {
      method: 'DELETE',
    });
  }

  // Sensor data
  async getSensorData(fieldId?: string, type?: string): Promise<ApiResponse<SensorData[]>> {
    let endpoint = '/sensors';
    const params = new URLSearchParams();
    
    if (fieldId) params.append('fieldId', fieldId);
    if (type) params.append('type', type);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return this.request<SensorData[]>(endpoint);
  }

  async getLatestSensorData(fieldId: string): Promise<ApiResponse<SensorData[]>> {
    return this.request<SensorData[]>(`/sensors/latest?fieldId=${fieldId}`);
  }

  // Weather data (server-side proxy)
  async getWeatherData(lat: number, lng: number): Promise<ApiResponse<WeatherData>> {
    return this.request<WeatherData>(`/api/weather?lat=${lat}&lng=${lng}`);
  }

  async getWeatherForecast(lat: number, lng: number, days: number = 7): Promise<ApiResponse<WeatherData>> {
    return this.request<WeatherData>(`/api/weather/forecast?lat=${lat}&lng=${lng}&days=${days}`);
  }

  // Geocoding (server-side proxy)
  async geocodeAddress(query: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/geocode?query=${encodeURIComponent(query)}`);
  }

  async reverseGeocode(lat: number, lng: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
  }

  // AI Predictions
  async getPredictions(fieldId?: string): Promise<ApiResponse<AIPrediction[]>> {
    const endpoint = fieldId ? `/predictions?fieldId=${fieldId}` : '/predictions';
    return this.request<AIPrediction[]>(endpoint);
  }

  async generatePrediction(
    type: AIPrediction['type'],
    fieldId: string,
    cropId?: string
  ): Promise<ApiResponse<AIPrediction>> {
    return this.request<AIPrediction>('/predictions/generate', {
      method: 'POST',
      body: JSON.stringify({ type, fieldId, cropId }),
    });
  }

  // Disease detection (server-side proxy)
  async detectDisease(imageUri: string, cropId: string): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'crop_image.jpg',
    } as any);
    formData.append('cropId', cropId);

    return this.request('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData as any,
    });
  }

  // Market prices (server-side proxy)
  async getMarketPrices(cropType?: string, location?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (cropType) params.append('cropType', cropType);
    if (location) params.append('location', location);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/prices?${queryString}` : '/api/prices';
    
    return this.request<any>(endpoint);
  }

  // User management
  async getUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/user/profile');
  }

  async updateUser(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    farmName: string;
    location: { lat: number; lng: number };
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Mock data for development
export const mockData = {
  fields: [
    {
      id: '1',
      name: 'North Field',
      area: 5.2,
      location: { lat: 40.7128, lng: -74.0060 },
      soilType: 'loamy' as const,
      crops: [],
      sensors: [],
      lastIrrigation: new Date('2024-01-15'),
      irrigationSchedule: {
        id: '1',
        fieldId: '1',
        frequency: 3,
        duration: 30,
        waterAmount: 1000,
        isActive: true,
        nextIrrigation: new Date('2024-01-18'),
      },
    },
    {
      id: '2',
      name: 'South Field',
      area: 3.8,
      location: { lat: 40.7100, lng: -74.0080 },
      soilType: 'sandy' as const,
      crops: [],
      sensors: [],
      lastIrrigation: new Date('2024-01-14'),
      irrigationSchedule: {
        id: '2',
        fieldId: '2',
        frequency: 2,
        duration: 25,
        waterAmount: 800,
        isActive: true,
        nextIrrigation: new Date('2024-01-16'),
      },
    },
  ],
  crops: [
    {
      id: '1',
      name: 'Tomatoes',
      type: 'vegetable' as const,
      variety: 'Roma',
      plantingDate: new Date('2024-01-01'),
      expectedHarvestDate: new Date('2024-04-01'),
      status: 'growing' as const,
      healthScore: 85,
      growthStage: 'vegetative' as const,
    },
    {
      id: '2',
      name: 'Lettuce',
      type: 'vegetable' as const,
      variety: 'Romaine',
      plantingDate: new Date('2024-01-10'),
      expectedHarvestDate: new Date('2024-02-10'),
      status: 'growing' as const,
      healthScore: 92,
      growthStage: 'vegetative' as const,
    },
  ],
  sensors: [
    {
      id: '1',
      type: 'temperature' as const,
      value: 24.5,
      unit: '°C',
      timestamp: new Date(),
      location: { lat: 40.7128, lng: -74.0060 },
      status: 'active' as const,
    },
    {
      id: '2',
      type: 'humidity' as const,
      value: 65,
      unit: '%',
      timestamp: new Date(),
      location: { lat: 40.7128, lng: -74.0060 },
      status: 'active' as const,
    },
    {
      id: '3',
      type: 'soil_moisture' as const,
      value: 45,
      unit: '%',
      timestamp: new Date(),
      location: { lat: 40.7128, lng: -74.0060 },
      status: 'active' as const,
    },
  ],
};
