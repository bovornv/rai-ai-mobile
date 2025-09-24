import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Body, SmallText } from '../../ui/Typography';
import { apiService } from '../../services/api';

interface HomeScreenProps {
  navigation: any;
}

interface WeatherData {
  hourly12h: Array<{
    time: string;
    rainProb: number;
    windSpeed: number;
    temp: number;
  }>;
  lastUpdated: Date;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t, i18n } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'th' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Spray Window computation logic
  const computeSprayWindowStatus = (hourly12h: WeatherData['hourly12h']) => {
    if (!hourly12h || hourly12h.length === 0) {
      return {
        state: 'unknown',
        reason: '',
        maxRain: 0,
        maxWind: 0,
        avgTemp: 25
      };
    }

    let state = 'good';
    let reason = '';
    let maxRain = 0;
    let maxWind = 0;
    let avgTemp = 0;
    
    for (const h of hourly12h) {
      maxRain = Math.max(maxRain, h.rainProb || 0);
      maxWind = Math.max(maxWind, h.windSpeed || 0);
      avgTemp += (h.temp || 25);
      
      if (h.rainProb >= 40 || h.windSpeed >= 18) { 
        state = 'dont'; 
        reason = i18n.language === 'th' ? 'เนื่องจากมีโอกาสฝนตก' : 'Because of expected rain';
        break; 
      }
      if (h.rainProb >= 20 || h.windSpeed >= 12) { 
        state = 'caution'; 
        reason = i18n.language === 'th' ? 'เนื่องจากลมแรง' : 'Due to strong winds';
      }
    }
    
    avgTemp = Math.round(avgTemp / hourly12h.length);
    
    return { state, reason, maxRain, maxWind, avgTemp };
  };

  // Load weather data
  const loadWeatherData = async () => {
    try {
      setIsLoadingWeather(true);
      
      // Use actual coordinates for Nakhon Ratchasima, Thailand
      const lat = 14.97;
      const lng = 102.08;
      
      const response = await apiService.getWeatherForecast(lat, lng, 1);
      
      if (response.success && response.data) {
        // Transform API response to our format
        const weatherData: WeatherData = {
          hourly12h: response.data.forecast?.slice(0, 12).map((forecast: any) => ({
            time: forecast.date.toISOString(),
            rainProb: forecast.precipitation || 0,
            windSpeed: forecast.windSpeed || 0,
            temp: forecast.temperature || 25
          })) || [
            { time: new Date().toISOString(), rainProb: 15, windSpeed: 8, temp: 28 },
            { time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), rainProb: 25, windSpeed: 12, temp: 30 },
            { time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), rainProb: 35, windSpeed: 15, temp: 32 },
            { time: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(), rainProb: 45, windSpeed: 18, temp: 31 },
          ],
          lastUpdated: new Date()
        };
        
        setWeatherData(weatherData);
      } else {
        // Fallback to mock data if API fails
        const mockWeatherData: WeatherData = {
          hourly12h: [
            { time: new Date().toISOString(), rainProb: 15, windSpeed: 8, temp: 28 },
            { time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), rainProb: 25, windSpeed: 12, temp: 30 },
            { time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), rainProb: 35, windSpeed: 15, temp: 32 },
            { time: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(), rainProb: 45, windSpeed: 18, temp: 31 },
          ],
          lastUpdated: new Date()
        };
        
        setWeatherData(mockWeatherData);
      }
    } catch (error) {
      console.error('Weather loading error:', error);
      // Fallback to mock data on error
      const mockWeatherData: WeatherData = {
        hourly12h: [
          { time: new Date().toISOString(), rainProb: 15, windSpeed: 8, temp: 28 },
          { time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), rainProb: 25, windSpeed: 12, temp: 30 },
          { time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), rainProb: 35, windSpeed: 15, temp: 32 },
          { time: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(), rainProb: 45, windSpeed: 18, temp: 31 },
        ],
        lastUpdated: new Date()
      };
      
      setWeatherData(mockWeatherData);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
  }, []);

  const tasks = [
    {
      id: 1,
      title: t('follow_up_scan_plot2'),
      subtitle: t('follow_up_scan'),
      status: 'pending',
      action: 'view'
    },
    {
      id: 2,
      title: t('apply_fertilizer_large_plot'),
      subtitle: t('apply_fertilizer'),
      status: 'completed',
      action: 'done'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>R</Text>
              </View>
              <Text style={styles.appName}>RaiAI</Text>
            </View>
            <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
              <Ionicons name="language" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.todayText}>{t('today')}</Text>
          <Text style={styles.dateText}>{t('monday_oct_21')}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.locationText}>{t('thepalai_nakhon_ratchasima')}</Text>
            <Ionicons name="create-outline" size={14} color="#666" />
          </View>

          {/* Crop Selection */}
          <View style={styles.cropSelector}>
            <TouchableOpacity
              style={[styles.cropButton, selectedCrop === 'rice' && styles.cropButtonActive]}
              onPress={() => setSelectedCrop('rice')}
            >
              <Text style={[styles.cropButtonText, selectedCrop === 'rice' && styles.cropButtonTextActive]}>
                {t('rice')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cropButton, selectedCrop === 'durian' && styles.cropButtonActive]}
              onPress={() => setSelectedCrop('durian')}
            >
              <Text style={[styles.cropButtonText, selectedCrop === 'durian' && styles.cropButtonTextActive]}>
                {t('durian')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spray Window Section */}
        <View style={styles.section}>
          <View style={styles.sprayWindowCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={20} color="#FFA726" />
              <Text style={styles.sectionTitle}>{t('spray_window')}</Text>
            </View>
            
            {isLoadingWeather ? (
              <Text style={styles.loadingText}>{t('loading')}...</Text>
            ) : weatherData ? (
              <>
                {(() => {
                  const { state, reason, maxRain, maxWind, avgTemp } = computeSprayWindowStatus(weatherData.hourly12h);
                  const label = state === 'good' ? (i18n.language === 'th' ? 'ดี' : 'Good') : 
                                state === 'caution' ? (i18n.language === 'th' ? 'ระวัง' : 'Caution') : 
                                (i18n.language === 'th' ? 'ห้ามพ่น' : "Don't spray");
                  const stateStyle = state === 'good' ? styles.sprayGood : 
                                   state === 'caution' ? styles.sprayCaution : styles.sprayDont;
                  
                  return (
                    <>
                      <View style={[styles.statusBadge, stateStyle]}>
                        <Text style={styles.statusBadgeText}>{label}</Text>
                      </View>
                      
                      {reason ? <Text style={styles.reasonText}>{reason}</Text> : null}
                      
                      {/* Weather factors display */}
                      <View style={styles.weatherFactors}>
                        <View style={styles.weatherFactor}>
                          <Text style={styles.weatherFactorLabel}>{i18n.language === 'th' ? 'ลม' : 'Wind'}</Text>
                          <Text style={styles.weatherFactorValue}>{maxWind} {i18n.language === 'th' ? 'กม./ชม.' : 'km/h'}</Text>
                        </View>
                        <View style={styles.weatherFactor}>
                          <Text style={styles.weatherFactorLabel}>{i18n.language === 'th' ? 'ฝน' : 'Rain'}</Text>
                          <Text style={styles.weatherFactorValue}>{maxRain}%</Text>
                        </View>
                        <View style={styles.weatherFactor}>
                          <Text style={styles.weatherFactorLabel}>{i18n.language === 'th' ? 'อุณหภูมิ' : 'Temp'}</Text>
                          <Text style={styles.weatherFactorValue}>{avgTemp}°C</Text>
                        </View>
                      </View>
                    </>
                  );
                })()}
                
                {/* Last updated timestamp */}
                <Text style={styles.lastUpdated}>
                  {i18n.language === 'th' ? 'อัปเดตล่าสุด' : 'Last updated'} {weatherData.lastUpdated.toLocaleTimeString('th-TH', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </Text>
              </>
            ) : (
              <Text style={styles.errorText}>{t('weather_data_unavailable')}</Text>
            )}
          </View>
        </View>

        {/* Outbreak Radar Section */}
        <View style={styles.section}>
          <View style={styles.outbreakCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={20} color="#FFA726" />
              <Text style={styles.sectionTitle}>{t('outbreak_radar')}</Text>
            </View>
            
            <Text style={styles.outbreakText}>{t('brown_spot_disease')}</Text>
            
            <View style={styles.outbreakWarning}>
              <Ionicons name="alert-circle" size={16} color="#F44336" />
              <Text style={styles.outbreakWarningText}>{t('prepare_prevention')}</Text>
            </View>
            
            <TouchableOpacity style={styles.shareWarningButton}>
              <Ionicons name="share-outline" size={16} color="#4CAF50" />
              <Text style={styles.shareText}>{t('share_warning_neighbors')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Tasks Section */}
        <View style={styles.section}>
          <View style={styles.tasksCard}>
            <Text style={styles.sectionTitle}>{t('todays_tasks')} · {t('todays_tasks')}</Text>
            
            {tasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                </View>
                <TouchableOpacity style={[
                  styles.taskButton,
                  task.status === 'completed' ? styles.taskButtonCompleted : styles.taskButtonPending
                ]}>
                  <Ionicons 
                    name={task.action === 'view' ? 'eye' : 'checkmark'} 
                    size={16} 
                    color={task.status === 'completed' ? '#666' : '#4CAF50'} 
                  />
                  <Text style={[
                    styles.taskButtonText,
                    task.status === 'completed' ? styles.taskButtonTextCompleted : styles.taskButtonTextPending
                  ]}>
                    {task.action === 'view' ? t('view') : t('done')}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('Scan')}
          >
            <Ionicons name="scan" size={20} color="#4CAF50" />
            <Text style={styles.actionButtonText}>{t('scan')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('Fields')}
          >
            <Ionicons name="location" size={20} color="#4CAF50" />
            <Text style={styles.actionButtonText}>{t('fields')}</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Scan')}>
          <Ionicons name="scan" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
  header: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  languageButton: {
    padding: 8,
  },
  todayText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    marginRight: 8,
  },
  cropSelector: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    padding: 4,
  },
  cropButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cropButtonActive: {
    backgroundColor: '#4CAF50',
  },
  cropButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cropButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sprayWindowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  weatherFactors: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  weatherFactor: {
    alignItems: 'center',
    flex: 1,
  },
  weatherFactorLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weatherFactorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sprayGood: {
    backgroundColor: '#4CAF50',
  },
  sprayCaution: {
    backgroundColor: '#FF9800',
  },
  sprayDont: {
    backgroundColor: '#F44336',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
  outbreakCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tasksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  outbreakText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  outbreakWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  outbreakWarningText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
  },
  shareWarningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  taskSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  taskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  taskButtonPending: {
    backgroundColor: '#E8F5E8',
  },
  taskButtonCompleted: {
    backgroundColor: '#F5F5F5',
  },
  taskButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  taskButtonTextPending: {
    color: '#4CAF50',
  },
  taskButtonTextCompleted: {
    color: '#666',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
