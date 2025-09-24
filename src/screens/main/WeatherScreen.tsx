import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LargeTitle, Body, SmallText } from '../../ui/Typography';
import Card from '../../components/Card';

interface WeatherScreenProps {
  navigation: any;
}

interface WeatherData {
  date: string;
  day: string;
  temperature: {
    high: number;
    low: number;
  };
  condition: string;
  humidity: number;
  rainChance: number;
  windSpeed: number;
  icon: string;
}

interface CurrentWeather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export default function WeatherScreen({ navigation }: WeatherScreenProps) {
  const { t } = useTranslation();
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<WeatherData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lat, setLat] = useState('14.97');
  const [lng, setLng] = useState('102.08');

  // Mock weather data
  const mockCurrentWeather: CurrentWeather = {
    temperature: 32,
    condition: 'sunny',
    humidity: 65,
    windSpeed: 12,
    icon: 'sunny',
  };

  // Generate 7-day forecast with local dates
  const days = useMemo(() => {
    const out: WeatherData[] = [];
    const now = new Date(); // device local time (Asia/Bangkok)
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const label = d.toLocaleDateString('th-TH', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
      
      // Generate weather data based on lat/lng and day
      const baseTemp = 30 + (parseFloat(lat) - 14) * 0.5; // Temperature varies with latitude
      const tmin = Math.round(baseTemp - 5 + i * 0.5);
      const tmax = Math.round(baseTemp + 5 + i * 0.3);
      const rain = Math.min(90, 20 + i * 10 + (parseFloat(lng) - 102) * 2);
      const wind = Math.round(10 + i * 2 + (parseFloat(lat) - 14) * 1.5);
      
      let condition = 'sunny';
      if (rain > 70) condition = 'rainy';
      else if (rain > 40) condition = 'cloudy';
      
      out.push({
        date: d.toISOString().split('T')[0],
        day: i === 0 ? t('today') : label,
        temperature: { high: tmax, low: tmin },
        condition,
        humidity: Math.round(60 + i * 3 + (parseFloat(lat) - 14) * 2),
        rainChance: Math.round(rain),
        windSpeed: wind,
        icon: condition,
      });
    }
    return out;
  }, [lat, lng, t]);

  const loadWeatherData = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentWeather(mockCurrentWeather);
      setForecast(days);
    } catch (error) {
      console.error('Weather data loading error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
  }, [days]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWeatherData();
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return 'sunny';
      case 'cloudy': return 'cloudy';
      case 'rainy': return 'rainy';
      case 'stormy': return 'thunderstorm';
      default: return 'partly-sunny';
    }
  };

  const getWeatherColor = (condition: string) => {
    switch (condition) {
      case 'sunny': return '#FFC107';
      case 'cloudy': return '#9E9E9E';
      case 'rainy': return '#2196F3';
      case 'stormy': return '#673AB7';
      default: return '#4CAF50';
    }
  };

  const getRainChanceColor = (chance: number) => {
    if (chance >= 70) return '#F44336';
    if (chance >= 40) return '#FF9800';
    return '#4CAF50';
  };

  const getFarmingRecommendation = (weather: WeatherData) => {
    if (weather.rainChance >= 70) {
      return 'ควรเก็บเกี่ยวก่อนฝนตก';
    } else if (weather.temperature.high >= 35) {
      return 'ควรให้น้ำเพิ่มเติม';
    } else if (weather.humidity >= 80) {
      return 'ระวังโรคเชื้อรา';
    } else {
      return 'สภาพอากาศเหมาะสม';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="cloud" size={48} color="#4CAF50" />
          <Body style={styles.loadingText}>{t('loading')}</Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <LargeTitle style={styles.title}>{t('weather')}</LargeTitle>
            <Body style={styles.subtitle}>{t('weather_forecast')}</Body>
          </View>

          {/* Location Inputs */}
          <View style={styles.locationInputs}>
            <TextInput
              placeholder="Latitude"
              keyboardType="numeric"
              value={lat}
              onChangeText={setLat}
              style={styles.input}
            />
            <TextInput
              placeholder="Longitude"
              keyboardType="numeric"
              value={lng}
              onChangeText={setLng}
              style={styles.input}
            />
          </View>

        {/* Current Weather */}
        {currentWeather && (
          <Card style={styles.currentWeatherCard}>
            <View style={styles.currentWeatherHeader}>
              <View style={styles.currentWeatherInfo}>
                <Body style={styles.currentTemp}>{currentWeather.temperature}°C</Body>
                <SmallText style={styles.currentCondition}>
                  {t(currentWeather.condition)}
                </SmallText>
              </View>
              <Ionicons 
                name={getWeatherIcon(currentWeather.condition) as any} 
                size={64} 
                color={getWeatherColor(currentWeather.condition)} 
              />
            </View>
            
            <View style={styles.currentWeatherDetails}>
              <View style={styles.weatherDetail}>
                <Ionicons name="water" size={20} color="#2196F3" />
                <SmallText style={styles.weatherDetailText}>
                  {currentWeather.humidity}% {t('humidity')}
                </SmallText>
              </View>
              <View style={styles.weatherDetail}>
                <Ionicons name="leaf" size={20} color="#4CAF50" />
                <SmallText style={styles.weatherDetailText}>
                  {currentWeather.windSpeed} km/h {t('wind_speed')}
                </SmallText>
              </View>
            </View>
          </Card>
        )}

        {/* 7-Day Forecast */}
        <Card style={styles.forecastCard}>
          <Body style={styles.forecastTitle}>7 {t('days_forecast')}</Body>
          
          {forecast.map((day, index) => (
            <View key={index} style={styles.forecastItem}>
              <View style={styles.forecastDay}>
                <Body style={styles.forecastDayName}>{day.day}</Body>
                <SmallText style={styles.forecastDate}>{day.date}</SmallText>
              </View>
              
              <View style={styles.forecastIcon}>
                <Ionicons 
                  name={getWeatherIcon(day.condition) as any} 
                  size={32} 
                  color={getWeatherColor(day.condition)} 
                />
              </View>
              
              <View style={styles.forecastTemp}>
                <Body style={styles.forecastHigh}>{day.temperature.high}°</Body>
                <SmallText style={styles.forecastLow}>{day.temperature.low}°</SmallText>
              </View>
              
              <View style={styles.forecastDetails}>
                <View style={[
                  styles.rainChance,
                  { backgroundColor: getRainChanceColor(day.rainChance) }
                ]}>
                  <SmallText style={styles.rainChanceText}>
                    {day.rainChance}%
                  </SmallText>
                </View>
                <SmallText style={styles.forecastHumidity}>
                  {day.humidity}%
                </SmallText>
              </View>
            </View>
          ))}
        </Card>

        {/* Farming Recommendations */}
        <Card style={styles.recommendationsCard}>
          <Body style={styles.recommendationsTitle}>คำแนะนำการเกษตร</Body>
          
          {forecast.slice(0, 3).map((day, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <Body style={styles.recommendationDay}>{day.day}</Body>
                <Ionicons 
                  name={getWeatherIcon(day.condition) as any} 
                  size={20} 
                  color={getWeatherColor(day.condition)} 
                />
              </View>
              <SmallText style={styles.recommendationText}>
                {getFarmingRecommendation(day)}
              </SmallText>
            </View>
          ))}
        </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  locationInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#4CAF50',
    marginTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666666',
    fontSize: 16,
  },
  currentWeatherCard: {
    marginBottom: 24,
    padding: 20,
  },
  currentWeatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentWeatherInfo: {
    flex: 1,
  },
  currentTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  currentCondition: {
    color: '#666666',
    fontSize: 16,
  },
  currentWeatherDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherDetailText: {
    color: '#666666',
  },
  forecastCard: {
    marginBottom: 24,
  },
  forecastTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  forecastDay: {
    flex: 1,
  },
  forecastDayName: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  forecastDate: {
    color: '#666666',
    fontSize: 12,
  },
  forecastIcon: {
    marginHorizontal: 16,
  },
  forecastTemp: {
    alignItems: 'center',
    marginRight: 16,
  },
  forecastHigh: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
  },
  forecastLow: {
    color: '#666666',
    fontSize: 14,
  },
  forecastDetails: {
    alignItems: 'center',
    gap: 4,
  },
  rainChance: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rainChanceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  forecastHumidity: {
    color: '#666666',
    fontSize: 12,
  },
  recommendationsCard: {
    marginBottom: 32,
  },
  recommendationsTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recommendationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationDay: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationText: {
    color: '#666666',
    lineHeight: 20,
  },
});
