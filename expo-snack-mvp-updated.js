import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  TextInput,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Switch,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// MVP Configuration
const MVP = true;
const LIMITS = { maxFields: 1, maxScansPerDay: 1, maxAlerts: 1 };

// Mock MMKV Storage
const mockStorage = {
  prefs: {
    lang: 'th',
    weatherPlaceText: 'นครราชสีมา',
    weatherLatLng: { lat: 14.97, lng: 102.08 },
    notifySprayWindow: true,
    notifyTime: '06:00',
    improveModelOptIn: false
  }
};

// Translations
const translations = {
  th: {
    app_name: 'ไร่ AI',
    app_subtitle: 'ระบบเกษตรอัจฉริยะ',
    home: 'หน้าแรก',
    fields: 'แปลง',
    scan: 'สแกน',
    weather: 'อากาศ',
    settings: 'ตั้งค่า',
    spray_window: 'หน้าต่างฉีดพ่น',
    good: 'ดี',
    caution: 'ระวัง',
    dont_spray: 'ไม่ควรฉีด',
    wind_speed: 'ลม',
    rain_probability: 'ฝน',
    temperature: 'อุณหภูมิ',
    last_updated: 'อัปเดตล่าสุด',
    rice: 'ข้าว',
    durian: 'ทุเรียน',
    rice_price: 'ข้าวหอมมะลิ',
    durian_price: 'ทุเรียนหมอนทอง',
    per_ton: 'บ./ตัน',
    per_kg: 'บ./กก.',
    scan_now: 'สแกนตอนนี้',
    weather_forecast: 'พยากรณ์อากาศ 7 วัน',
    settings_title: 'การตั้งค่า',
    language: 'ภาษา',
    thai: 'ไทย',
    english: 'English',
    weather_location: 'ตำแหน่งพยากรณ์อากาศ',
    use_my_location: 'ใช้ตำแหน่งของฉัน',
    edit_location: 'แก้ไขตำแหน่ง',
    location_from_field: 'ตำแหน่งดึงจากแปลงของคุณ',
    notifications: 'การแจ้งเตือน',
    spray_reminder: 'เตือนหน้าต่างฉีดพ่น',
    remind_at: 'เตือนเวลา',
    data_privacy: 'ข้อมูลและความเป็นส่วนตัว',
    improve_model: 'อนุญาตให้ใช้การสแกนของฉันเพื่อพัฒนาระบบ',
    clear_cache: 'ล้างแคชข้อมูล',
    account: 'บัญชี',
    guest_mode: 'โหมดผู้ใช้ชั่วคราว',
    sign_in: 'เข้าสู่ระบบ',
    help_about: 'ช่วยเหลือและเกี่ยวกับ',
    contact_support: 'ติดต่อฝ่ายสนับสนุน',
    version: 'เวอร์ชัน',
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    clear: 'ล้าง'
  },
  en: {
    app_name: 'Rai AI',
    app_subtitle: 'Smart Farming System',
    home: 'Home',
    fields: 'Fields',
    scan: 'Scan',
    weather: 'Weather',
    settings: 'Settings',
    spray_window: 'Spray Window',
    good: 'Good',
    caution: 'Caution',
    dont_spray: "Don't Spray",
    wind_speed: 'Wind',
    rain_probability: 'Rain',
    temperature: 'Temp',
    last_updated: 'Last updated',
    rice: 'Rice',
    durian: 'Durian',
    rice_price: 'Jasmine Rice',
    durian_price: 'Monthong Durian',
    per_ton: '฿/Ton',
    per_kg: '฿/Kg',
    scan_now: 'Scan Now',
    weather_forecast: '7-Day Weather Forecast',
    settings_title: 'Settings',
    language: 'Language',
    thai: 'Thai',
    english: 'English',
    weather_location: 'Weather Location',
    use_my_location: 'Use my location',
    edit_location: 'Edit location',
    location_from_field: 'Location is driven by your Field',
    notifications: 'Notifications',
    spray_reminder: 'Spray Window reminder',
    remind_at: 'Remind at',
    data_privacy: 'Data & Privacy',
    improve_model: 'Allow my scans to improve the model',
    clear_cache: 'Clear cached data',
    account: 'Account',
    guest_mode: 'Guest mode',
    sign_in: 'Sign in',
    help_about: 'Help & About',
    contact_support: 'Contact support',
    version: 'Version',
    cancel: 'Cancel',
    save: 'Save',
    clear: 'Clear'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(mockStorage.prefs.lang);
  const [showSettings, setShowSettings] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationText, setLocationText] = useState(mockStorage.prefs.weatherPlaceText);
  const [notifySprayWindow, setNotifySprayWindow] = useState(mockStorage.prefs.notifySprayWindow);
  const [notifyTime, setNotifyTime] = useState(mockStorage.prefs.notifyTime);
  const [improveModelOptIn, setImproveModelOptIn] = useState(mockStorage.prefs.improveModelOptIn);

  const t = translations[language];

  // Mock data
  const mockData = {
    sprayWindow: {
      status: 'caution', // 'good', 'caution', 'dont_spray'
      reason: language === 'th' ? 'เนื่องจากมีโอกาสฝนตก' : 'Because of expected rain',
      windSpeed: 15,
      rainProbability: 60,
      temperature: 28,
      lastUpdated: '00:54'
    },
    prices: {
      rice: { price: 8500, unit: t.per_ton, change: '+2.5%' },
      durian: { price: 120, unit: t.per_kg, change: '+1.2%' }
    },
    weather: {
      current: {
        temperature: 28,
        humidity: 65,
        condition: language === 'th' ? 'มีเมฆบางส่วน' : 'Partly Cloudy',
        icon: 'partly-sunny'
      },
      forecast: [
        { day: language === 'th' ? 'วันนี้' : 'Today', temp: 28, condition: language === 'th' ? 'มีเมฆบางส่วน' : 'Partly Cloudy', icon: 'partly-sunny', rain: 20 },
        { day: language === 'th' ? 'พรุ่งนี้' : 'Tomorrow', temp: 30, condition: language === 'th' ? 'แดดจัด' : 'Sunny', icon: 'sunny', rain: 5 },
        { day: language === 'th' ? 'วันศุกร์' : 'Friday', temp: 26, condition: language === 'th' ? 'ฝนตก' : 'Rainy', icon: 'rainy', rain: 80 },
        { day: language === 'th' ? 'วันเสาร์' : 'Saturday', temp: 24, condition: language === 'th' ? 'มีเมฆมาก' : 'Cloudy', icon: 'cloudy', rain: 40 },
        { day: language === 'th' ? 'วันอาทิตย์' : 'Sunday', temp: 27, condition: language === 'th' ? 'มีเมฆบางส่วน' : 'Partly Cloudy', icon: 'partly-sunny', rain: 25 },
        { day: language === 'th' ? 'วันจันทร์' : 'Monday', temp: 29, condition: language === 'th' ? 'แดดจัด' : 'Sunny', icon: 'sunny', rain: 10 },
        { day: language === 'th' ? 'วันอังคาร' : 'Tuesday', temp: 31, condition: language === 'th' ? 'แดดจัด' : 'Sunny', icon: 'sunny', rain: 5 }
      ]
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    mockStorage.prefs.lang = newLang;
  };

  const handleLocationUpdate = () => {
    mockStorage.prefs.weatherPlaceText = locationText;
    setShowLocationModal(false);
  };

  const handleClearCache = () => {
    Alert.alert(
      t.clear_cache,
      language === 'th' ? 'ล้างข้อมูลแคชทั้งหมด?' : 'Clear all cached data?',
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.clear, onPress: () => {
          // Clear cache logic here
          Alert.alert('', language === 'th' ? 'ล้างข้อมูลเรียบร้อย' : 'Cache cleared');
        }}
      ]
    );
  };

  const getSprayWindowStatus = () => {
    const { status } = mockData.sprayWindow;
    switch (status) {
      case 'good':
        return { text: t.good, color: '#4CAF50', bgColor: '#E8F5E8' };
      case 'caution':
        return { text: t.caution, color: '#FF9800', bgColor: '#FFF3E0' };
      case 'dont_spray':
        return { text: t.dont_spray, color: '#F44336', bgColor: '#FFEBEE' };
      default:
        return { text: t.caution, color: '#FF9800', bgColor: '#FFF3E0' };
    }
  };

  const renderSprayWindowCard = () => {
    const { sprayWindow } = mockData;
    const statusInfo = getSprayWindowStatus();
    
    return (
      <View style={[styles.sprayWindowCard, { backgroundColor: statusInfo.bgColor }]}>
        <View style={styles.sprayWindowHeader}>
          <Text style={styles.sprayWindowTitle}>{t.spray_window}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>
        
        <Text style={styles.reasonText}>{sprayWindow.reason}</Text>
        
        <View style={styles.weatherFactors}>
          <View style={styles.weatherFactor}>
            <Text style={styles.weatherFactorLabel}>{t.wind_speed}</Text>
            <Text style={styles.weatherFactorValue}>{sprayWindow.windSpeed} km/h</Text>
          </View>
          <View style={styles.weatherFactor}>
            <Text style={styles.weatherFactorLabel}>{t.rain_probability}</Text>
            <Text style={styles.weatherFactorValue}>{sprayWindow.rainProbability}%</Text>
          </View>
          <View style={styles.weatherFactor}>
            <Text style={styles.weatherFactorLabel}>{t.temperature}</Text>
            <Text style={styles.weatherFactorValue}>{sprayWindow.temperature}°C</Text>
          </View>
        </View>
        
        <Text style={styles.lastUpdated}>{t.last_updated} {sprayWindow.lastUpdated}</Text>
      </View>
    );
  };

  const renderCropTabs = () => (
    <View style={styles.cropTabsContainer}>
      <TouchableOpacity style={[styles.cropTab, styles.cropTabActive]}>
        <Text style={[styles.cropTabText, styles.cropTabTextActive]}>{t.rice}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cropTab}>
        <Text style={styles.cropTabText}>{t.durian}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPriceCard = () => (
    <View style={styles.priceCard}>
      <Text style={styles.priceCardTitle}>{language === 'th' ? 'ราคาวันนี้' : "Today's Prices"}</Text>
      <View style={styles.priceItem}>
        <Text style={styles.priceCommodity}>{t.rice_price}</Text>
        <Text style={styles.priceValue}>{mockData.prices.rice.price.toLocaleString()} {mockData.prices.rice.unit}</Text>
        <Text style={styles.priceChange}>+2.5%</Text>
      </View>
      <View style={styles.priceItem}>
        <Text style={styles.priceCommodity}>{t.durian_price}</Text>
        <Text style={styles.priceValue}>{mockData.prices.durian.price} {mockData.prices.durian.unit}</Text>
        <Text style={styles.priceChange}>+1.2%</Text>
      </View>
      <Text style={styles.priceSource}>{language === 'th' ? 'ข้อมูลจากตลาดกลาง' : 'Source: Central Market'}</Text>
    </View>
  );

  const renderHomeScreen = () => (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.app_name}</Text>
        <Text style={styles.headerSubtitle}>{t.app_subtitle}</Text>
      </View>

      {/* Spray Window Card */}
      {renderSprayWindowCard()}

      {/* Crop Tabs */}
      {renderCropTabs()}

      {/* Price Card */}
      {renderPriceCard()}

      {/* Scan Button */}
      <TouchableOpacity style={styles.scanButton} onPress={() => setActiveTab('scan')}>
        <Ionicons name="scan" size={24} color="white" />
        <Text style={styles.scanButtonText}>{t.scan_now}</Text>
      </TouchableOpacity>

      {/* Weather Forecast */}
      <View style={styles.weatherCard}>
        <Text style={styles.weatherCardTitle}>{t.weather_forecast}</Text>
        <View style={styles.forecastContainer}>
          {mockData.weather.forecast.map((day, index) => (
            <View key={index} style={styles.forecastItem}>
              <Text style={styles.forecastDay}>{day.day}</Text>
              <Ionicons name={day.icon} size={20} color="#666" />
              <Text style={styles.forecastTemp}>{day.temp}°</Text>
              <Text style={styles.forecastRain}>{day.rain}%</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderSettingsScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settings_title}</Text>
      </View>

      {/* Language */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsLabel}>{t.language}</Text>
        <View style={styles.languageButtons}>
          <TouchableOpacity 
            style={[styles.languageButton, language === 'th' && styles.languageButtonActive]}
            onPress={() => handleLanguageChange('th')}
          >
            <Text style={[styles.languageButtonText, language === 'th' && styles.languageButtonTextActive]}>
              {t.thai}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>
              {t.english}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weather Location */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsLabel}>{t.weather_location}</Text>
        <Text style={styles.locationText}>{locationText}</Text>
        <View style={styles.locationButtons}>
          <TouchableOpacity style={styles.locationButton} onPress={() => setShowLocationModal(true)}>
            <Ionicons name="location" size={16} color="#4CAF50" />
            <Text style={styles.locationButtonText}>{t.use_my_location}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationButton} onPress={() => setShowLocationModal(true)}>
            <Ionicons name="create" size={16} color="#4CAF50" />
            <Text style={styles.locationButtonText}>{t.edit_location}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsLabel}>{t.notifications}</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t.spray_reminder}</Text>
          <Switch
            value={notifySprayWindow}
            onValueChange={setNotifySprayWindow}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={notifySprayWindow ? '#fff' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.timeLabel}>{t.remind_at}: {notifyTime}</Text>
      </View>

      {/* Data & Privacy */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsLabel}>{t.data_privacy}</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t.improve_model}</Text>
          <Switch
            value={improveModelOptIn}
            onValueChange={setImproveModelOptIn}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={improveModelOptIn ? '#fff' : '#f4f3f4'}
          />
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearCache}>
          <Text style={styles.clearButtonText}>{t.clear_cache}</Text>
        </TouchableOpacity>
      </View>

      {/* Account */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsLabel}>{t.account}</Text>
        <Text style={styles.guestText}>{t.guest_mode}</Text>
        <TouchableOpacity style={styles.signInButton}>
          <Text style={styles.signInButtonText}>{t.sign_in}</Text>
        </TouchableOpacity>
      </View>

      {/* Help & About */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsLabel}>{t.help_about}</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>{t.contact_support}</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>{t.version}: 1.0.0 (Build 1)</Text>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return renderHomeScreen();
      case 'settings': return renderSettingsScreen();
      default: return renderHomeScreen();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#2E7D32" />
      
      {renderContent()}
      
      {/* Bottom Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'home' && styles.activeTab]}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons 
            name={activeTab === 'home' ? 'home' : 'home-outline'} 
            size={24} 
            color={activeTab === 'home' ? '#4CAF50' : '#9E9E9E'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>
            {t.home}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'fields' && styles.activeTab]}
          onPress={() => setActiveTab('fields')}
        >
          <Ionicons 
            name={activeTab === 'fields' ? 'location' : 'location-outline'} 
            size={24} 
            color={activeTab === 'fields' ? '#4CAF50' : '#9E9E9E'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'fields' && styles.activeTabLabel]}>
            {t.fields}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
          onPress={() => setActiveTab('scan')}
        >
          <Ionicons 
            name={activeTab === 'scan' ? 'scan' : 'scan-outline'} 
            size={24} 
            color={activeTab === 'scan' ? '#4CAF50' : '#9E9E9E'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'scan' && styles.activeTabLabel]}>
            {t.scan}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'weather' && styles.activeTab]}
          onPress={() => setActiveTab('weather')}
        >
          <Ionicons 
            name={activeTab === 'weather' ? 'partly-sunny' : 'partly-sunny-outline'} 
            size={24} 
            color={activeTab === 'weather' ? '#4CAF50' : '#9E9E9E'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'weather' && styles.activeTabLabel]}>
            {t.weather}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons 
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'} 
            size={24} 
            color={activeTab === 'settings' ? '#4CAF50' : '#9E9E9E'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.activeTabLabel]}>
            {t.settings}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location Modal */}
      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.edit_location}</Text>
            <TextInput
              style={styles.locationInput}
              value={locationText}
              onChangeText={setLocationText}
              placeholder={language === 'th' ? 'ค้นหาตำบล, จังหวัด' : 'Search sub-district, province'}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowLocationModal(false)}>
                <Text style={styles.modalButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleLocationUpdate}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#E8F5E8',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sprayWindowCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sprayWindowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sprayWindowTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reasonText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  weatherFactors: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weatherFactor: {
    alignItems: 'center',
  },
  weatherFactorLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  weatherFactorValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  cropTabsContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cropTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  cropTabActive: {
    backgroundColor: '#4CAF50',
  },
  cropTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  cropTabTextActive: {
    color: 'white',
  },
  priceCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceCommodity: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  priceChange: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  priceSource: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  weatherCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  forecastContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  forecastItem: {
    alignItems: 'center',
    flex: 1,
  },
  forecastDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  forecastRain: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  settingsSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  languageButtonTextActive: {
    color: 'white',
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
  },
  clearButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
  },
  guestText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  signInButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  signInButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  helpButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  helpButtonText: {
    fontSize: 16,
    color: '#333',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    width: width - 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontWeight: '600',
  },
});
