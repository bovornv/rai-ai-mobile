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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// MVP Configuration
const MVP = true;
const LIMITS = { maxFields: 1, maxScansPerDay: 1, maxAlerts: 1 };

// Mock data for demonstration
const mockData = {
  fields: [
    {
      id: '1',
      name: 'ไร่นาข้าว ภาคกลาง',
      area: 5.2,
      location: { lat: 14.97, lng: 102.08 },
      soilType: 'ดินร่วนปนทราย',
      crops: [
        {
          id: '1',
          name: 'ข้าวหอมมะลิ',
          type: 'rice',
          variety: 'ข้าวหอมมะลิ 105',
          plantingDate: '2024-01-15',
          expectedHarvestDate: '2024-04-15',
          status: 'growing',
          healthScore: 85,
          growthStage: 'vegetative'
        }
      ],
      lastIrrigation: '2024-01-20',
      irrigationSchedule: {
        frequency: 3,
        duration: 30,
        waterAmount: 1000,
        isActive: true,
        nextIrrigation: '2024-01-23'
      }
    }
  ],
  weather: {
    current: {
      temperature: 28,
      humidity: 65,
      condition: 'Partly Cloudy',
      icon: 'partly-sunny'
    },
    forecast: [
      { day: 'วันนี้', temp: 28, condition: 'Partly Cloudy', icon: 'partly-sunny' },
      { day: 'พรุ่งนี้', temp: 30, condition: 'Sunny', icon: 'sunny' },
      { day: 'วันศุกร์', temp: 26, condition: 'Rainy', icon: 'rainy' },
      { day: 'วันเสาร์', temp: 24, condition: 'Cloudy', icon: 'cloudy' }
    ]
  },
  prices: [
    { commodity: 'ข้าวหอมมะลิ', price: 8500, unit: 'บาท/ตัน', change: '+2.5%' },
    { commodity: 'ข้าวเจ้า', price: 7800, unit: 'บาท/ตัน', change: '+1.2%' },
    { commodity: 'ข้าวเหนียว', price: 8200, unit: 'บาท/ตัน', change: '-0.8%' }
  ],
  tasks: [
    { id: '1', title: 'ตรวจสอบความชื้นในดิน', subtitle: 'ควรตรวจสอบทุก 3 วัน', status: 'pending', action: 'view' },
    { id: '2', title: 'รดน้ำแปลงข้าว', subtitle: 'กำหนดการรดน้ำครั้งต่อไป', status: 'pending', action: 'view' },
    { id: '3', title: 'ตรวจสอบโรคพืช', subtitle: 'สแกนใบข้าวเพื่อตรวจโรค', status: 'completed', action: 'view' }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleScan = () => {
    Alert.alert(
      'สแกนโรคพืช',
      'ฟีเจอร์นี้จะใช้กล้องเพื่อสแกนใบข้าวและตรวจสอบโรคพืช',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'สแกน', onPress: () => setLoading(true) }
      ]
    );
  };

  const renderHomeScreen = () => (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ไร่ AI</Text>
        <Text style={styles.headerSubtitle}>ระบบเกษตรอัจฉริยะ</Text>
      </View>

      {/* Weather Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="partly-sunny" size={24} color="#4CAF50" />
          <Text style={styles.cardTitle}>สภาพอากาศ</Text>
        </View>
        <View style={styles.weatherInfo}>
          <Text style={styles.temperature}>{mockData.weather.current.temperature}°C</Text>
          <Text style={styles.condition}>{mockData.weather.current.condition}</Text>
          <Text style={styles.humidity}>ความชื้น {mockData.weather.current.humidity}%</Text>
        </View>
        <View style={styles.forecast}>
          {mockData.weather.forecast.map((day, index) => (
            <View key={index} style={styles.forecastItem}>
              <Text style={styles.forecastDay}>{day.day}</Text>
              <Ionicons name={day.icon} size={20} color="#666" />
              <Text style={styles.forecastTemp}>{day.temp}°</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Field Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={24} color="#4CAF50" />
          <Text style={styles.cardTitle}>แปลงข้าว</Text>
        </View>
        <View style={styles.fieldInfo}>
          <Text style={styles.fieldName}>{mockData.fields[0].name}</Text>
          <Text style={styles.fieldArea}>พื้นที่ {mockData.fields[0].area} ไร่</Text>
          <Text style={styles.fieldSoil}>ดิน: {mockData.fields[0].soilType}</Text>
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>{mockData.fields[0].crops[0].name}</Text>
            <Text style={styles.cropStatus}>สถานะ: {mockData.fields[0].crops[0].status}</Text>
            <Text style={styles.cropHealth}>สุขภาพ: {mockData.fields[0].crops[0].healthScore}%</Text>
          </View>
        </View>
      </View>

      {/* Tasks Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="list" size={24} color="#4CAF50" />
          <Text style={styles.cardTitle}>งานที่ต้องทำ</Text>
        </View>
        {mockData.tasks.map(task => (
          <View key={task.id} style={styles.taskItem}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.taskButton,
                task.status === 'completed' ? styles.taskButtonCompleted : styles.taskButtonPending
              ]}
            >
              <Ionicons 
                name={task.action === 'view' ? 'eye' : 'checkmark'} 
                size={16} 
                color={task.status === 'completed' ? '#666' : '#4CAF50'} 
              />
              <Text style={[
                styles.taskButtonText,
                task.status === 'completed' ? styles.taskButtonTextCompleted : styles.taskButtonTextPending
              ]}>
                {task.action === 'view' ? 'ดู' : 'เสร็จ'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Scan Button */}
      <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
        <Ionicons name="scan" size={24} color="white" />
        <Text style={styles.scanButtonText}>สแกนโรคพืช</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderFieldsScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>จัดการแปลง</Text>
        <Text style={styles.headerSubtitle}>แปลงข้าวของคุณ</Text>
      </View>

      {mockData.fields.map(field => (
        <View key={field.id} style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <Ionicons name="location" size={24} color="#4CAF50" />
            <Text style={styles.fieldTitle}>{field.name}</Text>
          </View>
          <View style={styles.fieldDetails}>
            <Text style={styles.fieldDetail}>พื้นที่: {field.area} ไร่</Text>
            <Text style={styles.fieldDetail}>ดิน: {field.soilType}</Text>
            <Text style={styles.fieldDetail}>พืช: {field.crops[0].name}</Text>
            <Text style={styles.fieldDetail}>สุขภาพ: {field.crops[0].healthScore}%</Text>
          </View>
          <View style={styles.fieldActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="create" size={16} color="#4CAF50" />
              <Text style={styles.actionButtonText}>แก้ไข</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="eye" size={16} color="#4CAF50" />
              <Text style={styles.actionButtonText}>ดูรายละเอียด</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {MVP && (
        <View style={styles.mvpNotice}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.mvpNoticeText}>
            MVP: จำกัด 1 แปลง (อัปเกรดเพื่อเพิ่มเติม)
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderScanScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>สแกนโรคพืช</Text>
        <Text style={styles.headerSubtitle}>ใช้ AI ตรวจสอบสุขภาพพืช</Text>
      </View>

      <View style={styles.scanContainer}>
        <View style={styles.scanPlaceholder}>
          <Ionicons name="camera" size={80} color="#4CAF50" />
          <Text style={styles.scanPlaceholderText}>กดเพื่อเปิดกล้อง</Text>
          <Text style={styles.scanPlaceholderSubtext}>สแกนใบข้าวเพื่อตรวจโรค</Text>
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
          <Ionicons name="scan" size={24} color="white" />
          <Text style={styles.scanButtonText}>เริ่มสแกน</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>กำลังวิเคราะห์...</Text>
          </View>
        )}
      </View>

      <View style={styles.scanTips}>
        <Text style={styles.tipsTitle}>เคล็ดลับการสแกน:</Text>
        <Text style={styles.tipText}>• ถ่ายภาพใบข้าวที่ชัดเจน</Text>
        <Text style={styles.tipText}>• ใช้แสงธรรมชาติ</Text>
        <Text style={styles.tipText}>• หลีกเลี่ยงเงาและแสงสะท้อน</Text>
      </View>
    </View>
  );

  const renderPricesScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ราคาข้าว</Text>
        <Text style={styles.headerSubtitle}>ราคาปัจจุบัน</Text>
      </View>

      <View style={styles.pricesContainer}>
        {mockData.prices.map((price, index) => (
          <View key={index} style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Text style={styles.commodityName}>{price.commodity}</Text>
              <Text style={[
                styles.priceChange,
                price.change.startsWith('+') ? styles.priceUp : styles.priceDown
              ]}>
                {price.change}
              </Text>
            </View>
            <Text style={styles.priceValue}>{price.price.toLocaleString()} {price.unit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mvpNotice}>
        <Ionicons name="information-circle" size={20} color="#FF9800" />
        <Text style={styles.mvpNoticeText}>
          MVP: ราคาอ่านอย่างเดียว (อัปเกรดเพื่อแจ้งเตือนราคา)
        </Text>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return renderHomeScreen();
      case 'fields': return renderFieldsScreen();
      case 'scan': return renderScanScreen();
      case 'prices': return renderPricesScreen();
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
            หน้าแรก
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
            แปลง
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
            สแกน
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'prices' && styles.activeTab]}
          onPress={() => setActiveTab('prices')}
        >
          <Ionicons 
            name={activeTab === 'prices' ? 'trending-up' : 'trending-up-outline'} 
            size={24} 
            color={activeTab === 'prices' ? '#4CAF50' : '#9E9E9E'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'prices' && styles.activeTabLabel]}>
            ราคา
          </Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  weatherInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  condition: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  humidity: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  forecast: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  forecastItem: {
    alignItems: 'center',
  },
  forecastDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  fieldInfo: {
    marginTop: 8,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fieldArea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  fieldSoil: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cropInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  cropStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cropHealth: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  taskButtonPending: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8f9fa',
  },
  taskButtonCompleted: {
    borderColor: '#ddd',
    backgroundColor: '#f0f0f0',
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
  scanButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fieldCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  fieldDetails: {
    marginBottom: 16,
  },
  fieldDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fieldActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanPlaceholder: {
    alignItems: 'center',
    marginBottom: 40,
  },
  scanPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  scanPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  scanTips: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  pricesContainer: {
    padding: 16,
  },
  priceCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commodityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceUp: {
    color: '#4CAF50',
  },
  priceDown: {
    color: '#f44336',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  mvpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  mvpNoticeText: {
    fontSize: 12,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
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
});
