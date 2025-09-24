import Constants from 'expo-constants';

// Environment configuration
export interface EnvironmentConfig {
  API_BASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  MAPBOX_PUBLIC_TOKEN?: string;
}

// Get environment variables from Expo Constants
const getEnvironmentConfig = (): EnvironmentConfig => {
  const config = Constants.expoConfig?.extra || {};
  
  return {
    API_BASE_URL: config.API_BASE_URL || 'https://api.rai-ai-farming.com/v1',
    NODE_ENV: (config.NODE_ENV || 'development') as EnvironmentConfig['NODE_ENV'],
    MAPBOX_PUBLIC_TOKEN: config.MAPBOX_PUBLIC_TOKEN,
  };
};

// Export the configuration
export const environment = getEnvironmentConfig();

// Validation function to ensure required environment variables are set
export const validateEnvironment = (): void => {
  if (!environment.API_BASE_URL) {
    throw new Error('API_BASE_URL is required but not set in environment configuration');
  }
  
  // Validate API_BASE_URL format
  try {
    new URL(environment.API_BASE_URL);
  } catch {
    throw new Error('API_BASE_URL must be a valid URL');
  }
};

// Development helper to log configuration (only in development)
if (__DEV__) {
  console.log('Environment Configuration:', {
    API_BASE_URL: environment.API_BASE_URL,
    NODE_ENV: environment.NODE_ENV,
    MAPBOX_PUBLIC_TOKEN: environment.MAPBOX_PUBLIC_TOKEN ? '***' : 'Not set',
  });
}
