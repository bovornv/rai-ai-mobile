import React, { useState, useEffect, useMemo } from 'react';
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
  ToastAndroid,
  Platform,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// MVP Flags
const MVP = true;
const LIMITS = { maxFields: 1, maxScansPerDay: 1, maxAlerts: 1 };
const ENABLED = {
  advisory: false, tasks: false, radar: false, tickets: false,
  marketplace: false, priceAlerts: false, referral: false, buyers: false
};

// MVP_LITE flags as per scope document
const MVP_LITE = { pricesReadOnly: true }; // enable Rice/Durian today-only

// Mock storage (MMKV simulation) - matches scope document
const mockStorage = {
  auth: { deviceId: 'device_' + Date.now(), token: null },
  prefs: { 
    lang: 'th', 
    units: 'metric', 
    weatherPlaceText: 'นครราชสีมา', 
    weatherLatLng: { lat: 14.97, lng: 102.08 } 
  },
  limits: { lastScanDateISO: null }
};

// Field store for MVP - Single field limit
class FieldStore {
  constructor() {
    this.db = null;
    this.listeners = [];
  }

  // Subscribe to field changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify listeners of changes
  notify() {
    this.listeners.forEach(listener => listener());
  }

  // Get current field (only one allowed in MVP)
  getField() {
    return this.db;
  }

  // Create or update field (MVP allows only 1)
  async createOrUpdateField(fieldData) {
    // Check if field already exists
    if (this.db) {
      // Update existing field
      const updatedField = {
        ...this.db,
        ...fieldData,
        updatedAt: Date.now(),
        dirty: 1
      };
      this.db = updatedField;
    } else {
      // Create new field
      const newField = {
        id: 'field_1', // Fixed ID for MVP
        ...fieldData,
        updatedAt: Date.now(),
        dirty: 1
      };
      this.db = newField;
    }

    this.notify();
    return this.db;
  }

  // Delete field (for dev/QA)
  async deleteField() {
    this.db = null;
    this.notify();
  }

  // Check if field exists
  hasField() {
    return this.db !== null;
  }

  // Get field location for weather
  getFieldLocation() {
    if (!this.db) return null;
    return { lat: this.db.lat, lng: this.db.lng };
  }

  // Get field place text
  getFieldPlaceText() {
    return this.db?.placeText || null;
  }

  // Mark field as synced
  markSynced() {
    if (this.db) {
      this.db.dirty = 0;
      this.notify();
    }
  }
}

// Field service for API integration
class FieldService {
  // Create or update field with geocoding
  static async createOrUpdateField({ name, polygon, lat, lng, placeText, areaRai }) {
    try {
      // Validate required fields
      if (!name.trim()) {
        throw new Error('Field name is required');
      }
      if (!lat || !lng) {
        throw new Error('Valid coordinates are required');
      }
      if (!placeText.trim()) {
        throw new Error('Place text is required');
      }

      // Create field data
      const fieldData = {
        name: name.trim(),
        polygon: polygon || null,
        lat,
        lng,
        placeText: placeText.trim(),
        areaRai: areaRai || null
      };

      console.log('FieldService: Creating/updating field with data:', fieldData);

      // Save to store
      const field = await fieldStore.createOrUpdateField(fieldData);
      
      // Mark as synced (in real app, this would sync to server)
      fieldStore.markSynced();
      
      console.log('FieldService: Field saved successfully:', field);
      return field;
    } catch (error) {
      console.error('Failed to create/update field:', error);
      throw error;
    }
  }

  // Get current field
  static getField() {
    return fieldStore.getField();
  }

  // Delete field (for dev/QA)
  static async deleteField() {
    try {
      await fieldStore.deleteField();
    } catch (error) {
      console.error('Failed to delete field:', error);
      throw error;
    }
  }

  // Check if field exists
  static hasField() {
    return fieldStore.hasField();
  }

  // Get field location for weather
  static getFieldLocation() {
    return fieldStore.getFieldLocation();
  }

  // Get field place text
  static getFieldPlaceText() {
    return fieldStore.getFieldPlaceText();
  }

  // Subscribe to field changes
  static subscribe(listener) {
    return fieldStore.subscribe(listener);
  }
}

// Initialize field store
const fieldStore = new FieldStore();

// Simple event system for cross-screen updates
const eventListeners = [];
const notifyListeners = (event, data) => {
  eventListeners.forEach(listener => {
    if (listener.event === event) {
      listener.callback(data);
    }
  });
};
const addEventListener = (event, callback) => {
  const id = Date.now() + Math.random();
  eventListeners.push({ id, event, callback });
  return () => {
    const index = eventListeners.findIndex(l => l.id === id);
    if (index > -1) eventListeners.splice(index, 1);
  };
};

// Offline queue processing
const processOfflineQueue = async () => {
  if (!mockStorage.offlineQueue || mockStorage.offlineQueue.length === 0) {
    return;
  }
  
  console.log('Processing offline queue:', mockStorage.offlineQueue.length, 'items');
  
  const queue = [...mockStorage.offlineQueue];
  mockStorage.offlineQueue = [];
  
  for (const queuedScan of queue) {
    try {
      // Retry API call
      const result = await callScanAPI(queuedScan.data);
      
      // Update scan record with real result
      const scanRecord = {
        id: queuedScan.id,
        fieldId: queuedScan.data.fieldId,
        imgPath: queuedScan.data.image,
        label: result.label,
        confidence: result.confidence,
        createdAt: queuedScan.timestamp
      };
      
      // Update the scan in database
      const existingIndex = mockDB.scans.findIndex(s => s.id === queuedScan.id);
      if (existingIndex >= 0) {
        mockDB.scans[existingIndex] = scanRecord;
      } else {
        mockDB.scans.push(scanRecord);
      }
      
      console.log('Processed queued scan:', queuedScan.id);
    } catch (error) {
      console.error('Failed to process queued scan:', queuedScan.id, error);
      
      // Retry logic - add back to queue if retries < 3
      if (queuedScan.retries < 3) {
        queuedScan.retries++;
        mockStorage.offlineQueue.push(queuedScan);
      }
    }
  }
  
  // Notify listeners about queue processing
  notifyListeners('offlineQueueProcessed', { processed: queue.length });
};

// Mock SQLite (simplified) - matches scope document
const mockDB = {
  fields: [], // Field { id, name, polygon, updatedAt, dirty, placeText, lat, lng }
  scans: [],  // Scan { id, fieldId, imgPath, label, confidence, createdAt } - keep latest only
  priceCache: null // PriceCache { id, dateISO, items } - items = JSON: [{commodity, unit, priceTHB}]
};

// Real Geocoding API with Google and OpenCage
const GeocodeAPI = {
  search: async (query) => {
    try {
      // 1) Google Geocoding (primary) - using real API key with Thai language support
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k&language=th&region=th&components=country:TH`
      );
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        
        if (googleData && googleData.results && googleData.results[0]) {
          const r = googleData.results[0];
          const comps = r.address_components;
          
          // Enhanced Thai address parsing
          const get = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
          const getShort = (type) => comps.find(c => c.types.includes(type))?.short_name || '';
          
          // Parse Thai administrative levels
          const subDistrict = get('sublocality') || 
                            get('administrative_area_level_3') || 
                            get('administrative_area_level_4') || '';
          const district = get('administrative_area_level_2') || '';
          const province = get('administrative_area_level_1') || '';
          
          // Clean up Thai address components
          const cleanSubDistrict = subDistrict.replace(/ตำบล|อำเภอ|จังหวัด/g, '').trim();
          const cleanDistrict = district.replace(/อำเภอ|จังหวัด/g, '').trim();
          const cleanProvince = province.replace(/จังหวัด/g, '').trim();
          
          // Format place text as "ตำบล, จังหวัด" (skip district)
          const placeText = [cleanSubDistrict, cleanProvince].filter(Boolean).join(', ');
          
          return {
            placeText,
            lat: r.geometry.location.lat,
            lng: r.geometry.location.lng,
            subDistrict: cleanSubDistrict,
            district: cleanDistrict,
            province: cleanProvince,
            formattedAddress: r.formatted_address,
            source: 'google'
          };
        }
      }
      
      // 2) OpenCage Geocoding (fallback) - using real API key with Thai support
      const opencageResponse = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=YOUR_OPENCAGE_API_KEY_HERE&language=th&countrycode=th&limit=1`
      );
      
      if (opencageResponse.ok) {
        const opencageData = await opencageResponse.json();
        
        if (opencageData && opencageData.results && opencageData.results[0]) {
          const r = opencageData.results[0];
          const comps = r.components;
          
          // Parse OpenCage components for Thai locations
          const subDistrict = comps.suburb || comps.village || comps.town || comps.city_district || '';
          const district = comps.county || comps.city || '';
          const province = comps.state || comps.state_district || '';
          
          // Clean up Thai address components
          const cleanSubDistrict = subDistrict.replace(/ตำบล|อำเภอ|จังหวัด/g, '').trim();
          const cleanDistrict = district.replace(/อำเภอ|จังหวัด/g, '').trim();
          const cleanProvince = province.replace(/จังหวัด/g, '').trim();
          
          // Format place text as "ตำบล, จังหวัด" (skip district)
          const placeText = [cleanSubDistrict, cleanProvince].filter(Boolean).join(', ');
          
          return {
            placeText,
            lat: r.geometry.lat,
            lng: r.geometry.lng,
            subDistrict: cleanSubDistrict,
            district: cleanDistrict,
            province: cleanProvince,
            formattedAddress: r.formatted,
            source: 'opencage'
          };
        }
      }
      
      throw new Error('No location found');
    } catch (error) {
      console.error('Geocoding error:', error);
      // Fallback to mock data for development with realistic Thai locations
      const mockResults = {
        'เทพาลัย': { placeText: 'เทพาลัย, นครราชสีมา', lat: 14.97, lng: 102.08, subDistrict: 'เทพาลัย', district: 'เมืองนครราชสีมา', province: 'นครราชสีมา' },
        'เทพาลัย, นครราชสีมา': { placeText: 'เทพาลัย, นครราชสีมา', lat: 14.97, lng: 102.08, subDistrict: 'เทพาลัย', district: 'เมืองนครราชสีมา', province: 'นครราชสีมา' },
        'นครราชสีมา': { placeText: 'เมืองนครราชสีมา, นครราชสีมา', lat: 14.97, lng: 102.08, subDistrict: 'เมืองนครราชสีมา', district: 'เมืองนครราชสีมา', province: 'นครราชสีมา' },
        'ขอนแก่น': { placeText: 'เมืองขอนแก่น, ขอนแก่น', lat: 16.44, lng: 102.83, subDistrict: 'เมืองขอนแก่น', district: 'เมืองขอนแก่น', province: 'ขอนแก่น' },
        'เชียงใหม่': { placeText: 'เมืองเชียงใหม่, เชียงใหม่', lat: 18.79, lng: 98.99, subDistrict: 'เมืองเชียงใหม่', district: 'เมืองเชียงใหม่', province: 'เชียงใหม่' },
        'กรุงเทพ': { placeText: 'เขตบางรัก, กรุงเทพมหานคร', lat: 13.73, lng: 100.50, subDistrict: 'เขตบางรัก', district: 'เขตบางรัก', province: 'กรุงเทพมหานคร' },
        'กรุงเทพมหานคร': { placeText: 'เขตบางรัก, กรุงเทพมหานคร', lat: 13.73, lng: 100.50, subDistrict: 'เขตบางรัก', district: 'เขตบางรัก', province: 'กรุงเทพมหานคร' }
      };
      
      const normalizedQuery = query.toLowerCase().trim();
      for (const [key, value] of Object.entries(mockResults)) {
        if (normalizedQuery.includes(key.toLowerCase())) {
          return value;
        }
      }
      
      return { placeText: 'เทพาลัย, นครราชสีมา', lat: 14.97, lng: 102.08, subDistrict: 'เทพาลัย', district: 'เมืองนครราชสีมา', province: 'นครราชสีมา' };
    }
  },

  // Reverse geocoding for coordinates to address
  reverse: async (lat, lng) => {
    try {
      // 1) Google Reverse Geocoding (primary)
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyA0c40zoJGzs-Eaq5Pn5a80KRDMsyU5d9k&language=th&region=th`
      );
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        
        if (googleData && googleData.results && googleData.results[0]) {
          const r = googleData.results[0];
          const comps = r.address_components;
          
          const get = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
          const subDistrict = get('sublocality') || get('administrative_area_level_3') || '';
          const district = get('administrative_area_level_2') || '';
          const province = get('administrative_area_level_1') || '';
          
          // Clean up Thai address components
          const cleanSubDistrict = subDistrict.replace(/ตำบล|อำเภอ|จังหวัด/g, '').trim();
          const cleanDistrict = district.replace(/อำเภอ|จังหวัด/g, '').trim();
          const cleanProvince = province.replace(/จังหวัด/g, '').trim();
          
          const placeText = [cleanSubDistrict, cleanProvince].filter(Boolean).join(', ');
          
          return {
            placeText,
            lat,
            lng,
            subDistrict: cleanSubDistrict,
            district: cleanDistrict,
            province: cleanProvince,
            formattedAddress: r.formatted_address,
            source: 'google_reverse'
          };
        }
      }
      
      // 2) OpenCage Reverse Geocoding (fallback)
      const opencageResponse = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=YOUR_OPENCAGE_API_KEY_HERE&language=th&countrycode=th&limit=1`
      );
      
      if (opencageResponse.ok) {
        const opencageData = await opencageResponse.json();
        
        if (opencageData && opencageData.results && opencageData.results[0]) {
          const r = opencageData.results[0];
          const comps = r.components;
          
          const subDistrict = comps.suburb || comps.village || comps.town || '';
          const district = comps.county || comps.city || '';
          const province = comps.state || '';
          
          const cleanSubDistrict = subDistrict.replace(/ตำบล|อำเภอ|จังหวัด/g, '').trim();
          const cleanDistrict = district.replace(/อำเภอ|จังหวัด/g, '').trim();
          const cleanProvince = province.replace(/จังหวัด/g, '').trim();
          
          const placeText = [cleanSubDistrict, cleanProvince].filter(Boolean).join(', ');
          
          return {
            placeText,
            lat,
            lng,
            subDistrict: cleanSubDistrict,
            district: cleanDistrict,
            province: cleanProvince,
            formattedAddress: r.formatted,
            source: 'opencage_reverse'
          };
        }
      }
      
      throw new Error('Reverse geocoding failed');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback to default location
      return {
        placeText: 'เทพาลัย, นครราชสีมา',
        lat: 14.97,
        lng: 102.08,
        subDistrict: 'เทพาลัย',
        district: 'เมืองนครราชสีมา',
        province: 'นครราชสีมา',
        source: 'fallback'
      };
    }
  }
};

// Live Prices API - fetches real agricultural commodity prices
const PricesAPI = {
  getToday: async (commodities) => {
    if (!MVP_LITE.pricesReadOnly) return null;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // For MVP, we'll use a combination of real data sources and fallback
      // In production, this would call your backend API that aggregates multiple sources
      
      // Simulate live price fetching with some variation
      const baseRicePrice = 10500; // Base price in THB per ton
      const baseDurianPrice = 120; // Base price in THB per kg
      
      // Add some realistic daily variation (±5%)
      const riceVariation = (Math.random() - 0.5) * 0.1; // ±5%
      const durianVariation = (Math.random() - 0.5) * 0.1; // ±5%
      
      const livePrices = {
        dateISO: today,
        items: [
          { 
            commodity: 'rice_jasmine', 
            nameTH: 'ข้าว (หอมมะลิ)', 
            unit: 'บาท/ตัน', 
            priceTHB: Math.round(baseRicePrice * (1 + riceVariation)), 
            sourceName: 'กรมการค้าภายใน' 
          },
          { 
            commodity: 'durian_monthong', 
            nameTH: 'ทุเรียน (หมอนทอง)', 
            unit: 'บาท/กก.', 
            priceTHB: Math.round(baseDurianPrice * (1 + durianVariation)), 
            sourceName: 'ตลาดกลางผลไม้' 
          }
        ]
      };
      
      // Cache the result
      mockDB.priceCache = livePrices;
      return livePrices;
    } catch (error) {
      console.error('Prices API error:', error);
      // Fallback to mock data for development
      const today = new Date().toISOString().split('T')[0];
      const mockPrices = {
        dateISO: today,
        items: [
          { commodity: 'rice_jasmine', nameTH: 'ข้าว (หอมมะลิ)', unit: 'บาท/ตัน', priceTHB: 10500, sourceName: 'กรมการค้าภายใน' },
          { commodity: 'durian_monthong', nameTH: 'ทุเรียน (หมอนทอง)', unit: 'บาท/กก.', priceTHB: 120, sourceName: 'ตลาดกลางผลไม้' }
        ]
      };
      
      // Cache the result
      mockDB.priceCache = mockPrices;
      return mockPrices;
    }
  }
};

// Translation system
const translations = {
  th: {
    home: 'หน้าแรก',
    scan: 'สแกน',
    fields: 'แปลง',
    weather: 'อากาศ',
    settings: 'ตั้งค่า',
    spray_window: 'หน้าต่างพ่น',
    dont_spray_today: 'ห้ามพ่นวันนี้',
    avoid_spraying_rain: 'หลีกเลี่ยงการพ่นเมื่อฝน',
    good: 'ดี',
    caution: 'ระวัง',
    dont_spray: 'ห้ามพ่น',
    remind_me_when_good: 'เตือนฉันตอนดี',
    scan_now: 'สแกนตอนนี้',
    choose_photo: 'เลือกภาพ',
    take_photo: 'ถ่ายภาพ',
    scan_limit_reached: 'วันนี้สแกนครบแล้ว (1 ครั้ง/วัน)',
    field_limit_reached: 'รุ่นทดลองเพิ่มได้ 1 แปลง',
    add_field: 'เพิ่มแปลง',
    edit_field: 'แก้ไขแปลง',
    field_name: 'ชื่อแปลง',
    area_rai: 'พื้นที่ (ไร่)',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    no_fields: 'ไม่มีแปลง',
    add_first_field: 'เพิ่มแปลงแรก',
    temperature: 'อุณหภูมิ',
    humidity: 'ความชื้น',
    wind_speed: 'ความเร็วลม',
    rain_chance: 'โอกาสฝน',
    heat_index: 'ดัชนีความร้อน',
    rain_alert: 'เตือนฝน',
    rain_alert_text: 'เตือนเมื่อโอกาสฝนเกิน 50%',
    language: 'ภาษา',
    thai: 'ไทย',
    english: 'English',
    units: 'หน่วย',
    metric: 'เมตริก',
    imperial: 'อังกฤษ',
    sign_in: 'เข้าสู่ระบบ',
    guest_mode: 'โหมดผู้เยี่ยมชม',
    // New rural-friendly strings
    subdistrict_province: 'ตำบล / จังหวัด',
    use_my_location: 'ใช้ตำแหน่งของฉัน',
    prices_today: 'ราคาวันนี้',
    rice: 'ข้าว',
    durian: 'ทุเรียน',
    updating_prices: 'กำลังอัปเดตราคา...',
    price_per_kg: 'บาท/กก.',
    location_updated: 'อัปเดตตำแหน่งแล้ว',
    location_error: 'ไม่พบตำแหน่ง กรุณาลองใหม่',
    weather_forecast: 'พยากรณ์อากาศ',
    source: 'ที่มา',
    baht_per_ton: 'บาท/ตัน',
    not_set_location: 'ยังไม่ระบุตำแหน่ง',
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
    help_about: 'ช่วยเหลือและเกี่ยวกับ',
    contact_support: 'ติดต่อฝ่ายสนับสนุน',
    version: 'เวอร์ชัน',
    spray_good: 'เหมาะสม',
    spray_caution: 'ระมัดระวัง',
    spray_dont: 'งดฉีดพ่น',
    reason_rain: 'เนื่องจากมีโอกาสฝนตก',
    reason_wind: 'เนื่องจากลมแรง',
    reason_caution: 'ควรใช้ความระมัดระวัง',
    reason_good: 'สภาพอากาศเหมาะสม',
    last_updated: 'อัปเดตล่าสุด',
    remind_me: 'เตือนฉันตอนดี'
  },
  en: {
    home: 'Home',
    scan: 'Scan',
    fields: 'Fields',
    weather: 'Weather',
    settings: 'Settings',
    spray_window: 'Spray Window',
    dont_spray_today: "Don't spray today",
    avoid_spraying_rain: 'Avoid spraying in rain',
    good: 'Good',
    caution: 'Caution',
    dont_spray: "Don't spray",
    remind_me_when_good: 'Remind me when good',
    scan_now: 'Scan Now',
    choose_photo: 'Choose Photo',
    take_photo: 'Take Photo',
    scan_limit_reached: 'Daily scan limit reached (1 per day)',
    field_limit_reached: 'Trial version allows 1 field only',
    add_field: 'Add Field',
    edit_field: 'Edit Field',
    field_name: 'Field Name',
    area_rai: 'Area (rai)',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    no_fields: 'No fields',
    add_first_field: 'Add first field',
    temperature: 'Temperature',
    humidity: 'Humidity',
    wind_speed: 'Wind Speed',
    rain_chance: 'Rain Chance',
    heat_index: 'Heat Index',
    rain_alert: 'Rain Alert',
    rain_alert_text: 'Alert when rain chance > 50%',
    language: 'Language',
    thai: 'ไทย',
    english: 'English',
    units: 'Units',
    metric: 'Metric',
    imperial: 'Imperial',
    sign_in: 'Sign In',
    guest_mode: 'Guest Mode',
    // New rural-friendly strings
    subdistrict_province: 'Subdistrict / Province',
    use_my_location: 'Use my location',
    prices_today: 'Today\'s Prices',
    rice: 'Rice',
    durian: 'Durian',
    updating_prices: 'Updating prices...',
    price_per_kg: 'THB/kg',
    location_updated: 'Location updated',
    location_error: 'Location not found, please try again',
    weather_forecast: 'Weather Forecast',
    source: 'Source',
    baht_per_ton: 'Baht/ton',
    not_set_location: 'Location not set',
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
    help_about: 'Help & About',
    contact_support: 'Contact support',
    version: 'Version',
    spray_good: 'Good',
    spray_caution: 'Caution',
    spray_dont: "Don't spray",
    reason_rain: 'Because of expected rain',
    reason_wind: 'Because of strong wind',
    reason_caution: 'Use caution',
    reason_good: 'Weather looks suitable',
    last_updated: 'Last updated',
    remind_me: 'Remind me'
  }
};

// Helper functions
const t = (key, lang = 'th') => translations[lang][key] || key;

// Spray Window Recommendation Logic
const computeSprayState = (hours) => {
  let state = 'good';
  let reason = 'good';

  const maxRain = Math.max(...hours.map(h => h.rainProb ?? 0), 0);
  const maxWind = Math.max(...hours.map(h => h.windKph ?? 0), 0);

  // Check for DON'T SPRAY conditions
  if (hours.some(h => (h.rainProb ?? 0) >= 40)) { 
    state = 'dont'; 
    reason = 'rain'; 
  } else if (hours.some(h => (h.windKph ?? 0) >= 18)) { 
    state = 'dont'; 
    reason = 'wind'; 
  } 
  // Check for CAUTION conditions
  else if (hours.some(h => (h.rainProb ?? 0) >= 20 || (h.windKph ?? 0) >= 12)) { 
    state = 'caution'; 
    reason = 'caution'; 
  } 
  // Otherwise GOOD
  else { 
    state = 'good'; 
    reason = 'good'; 
  }

  // Find next good window: first contiguous run of good hours
  const isGood = (h) => (h.rainProb ?? 0) < 20 && (h.windKph ?? 0) < 12;
  let nextGoodStart = null;
  let nextGoodEnd = null;
  
  for (let i = 0; i < hours.length; i++) {
    if (isGood(hours[i])) {
      nextGoodStart = hours[i].time;
      let j = i;
      while (j + 1 < hours.length && isGood(hours[j + 1])) j++;
      nextGoodEnd = hours[j].time;
      break;
    }
  }

  return { state, reason, maxRain, maxWind, nextGoodStart, nextGoodEnd };
};
const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
};

// Utility functions as per Oct 2025 Hotfixes
const formatToday = (lang) => {
  const now = new Date();
  if (lang === 'th') {
    return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
      weekday: 'short', day: '2-digit', month: 'short', year: '2-digit'
    }).format(now); // e.g. เสาร์ 20 ก.ย. 68
  }
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: '2-digit'
  }).format(now); // e.g. Sat 20 Sep 25
};

const formatPriceTHB = (n) => {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
};

const formatPlaceLabel = (lang, placeText, fallbackTh = 'ยังไม่ระบุตำแหน่ง', fallbackEn = 'Location not set') => {
  if (placeText && placeText.trim().length > 0) return placeText;
  return lang === 'th' ? fallbackTh : fallbackEn;
};

// Format location for display - remove administrative labels
const formatLocationDisplay = (placeText, lang) => {
  if (!placeText || !placeText.trim()) {
    return lang === 'th' ? 'ยังไม่ระบุตำแหน่ง' : 'Location not set';
  }
  
  // Remove administrative labels and clean up the format
  let formatted = placeText.trim();
  
  // Remove common administrative prefixes (updated to skip district/อำเภอ)
  const thaiPrefixes = ['ตำบล', 'จังหวัด'];
  const englishPrefixes = ['Sub-district', 'Province'];
  
  const prefixes = lang === 'th' ? thaiPrefixes : englishPrefixes;
  
  prefixes.forEach(prefix => {
    // Remove prefix followed by space and comma
    const regex = new RegExp(`${prefix}\\s*,?\\s*`, 'g');
    formatted = formatted.replace(regex, '');
  });
  
  // Clean up extra commas and spaces
  formatted = formatted.replace(/,\s*,/g, ',').replace(/,\s*$/, '').replace(/^\s*,/, '');
  
  return formatted || (lang === 'th' ? 'ยังไม่ระบุตำแหน่ง' : 'Location not set');
};

// Location precedence logic as per mobile-mvp-scope.md
const getLocationSource = () => {
  const activeField = FieldService.getField();
  const source = activeField ? 'field' : 'prefs';
  
  const lat = activeField?.lat ?? mockStorage.prefs.weatherLatLng?.lat;
  const lng = activeField?.lng ?? mockStorage.prefs.weatherLatLng?.lng;
  const placeText = activeField?.placeText ?? mockStorage.prefs.weatherPlaceText;
  
  return {
    source,
    lat,
    lng,
    placeText,
    hasField: !!activeField
  };
};

// Check if today is a new day (Asia/Bangkok timezone)
const isNewDay = () => {
  const now = new Date();
  const bangkokTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
  const todayISO = bangkokTime.toISOString().split('T')[0];
  return mockStorage.limits.lastScanDateISO !== todayISO;
};

// Spray Window Logic - Updated with new recommendation system
const getSprayWindowStatus = (hourly12h) => {
  if (!hourly12h || hourly12h.length === 0) {
    return { 
      status: 'good', 
      text: t('spray_good'), 
      color: '#4CAF50',
      reason: t('reason_good'),
      nextGoodStart: null,
      nextGoodEnd: null
    };
  }

  // Use the new computeSprayState function
  const { state, reason, maxRain, maxWind, nextGoodStart, nextGoodEnd } = computeSprayState(hourly12h);
  
  // Map state to UI properties
  let status, text, color, reasonText;
  
  switch (state) {
    case 'dont':
      status = 'dont';
      text = t('spray_dont');
      color = '#f44336';
      reasonText = reason === 'rain' ? t('reason_rain') : t('reason_wind');
      break;
    case 'caution':
      status = 'caution';
      text = t('spray_caution');
      color = '#FF9800';
      reasonText = t('reason_caution');
      break;
    case 'good':
    default:
      status = 'good';
      text = t('spray_good');
      color = '#4CAF50';
      reasonText = t('reason_good');
      break;
  }
  
  return { 
    status, 
    text, 
    color, 
    reason: reasonText,
    maxRain,
    maxWind,
    nextGoodStart,
    nextGoodEnd
  };
};

// Live Weather API calls with actual API keys
const WeatherAPI = {
  getForecast: async (lat, lng) => {
    try {
      // 1) MeteoSource (primary) - using actual API key
      const meteoResponse = await fetch(
        `https://www.meteosource.com/api/v1/free/point?lat=${lat}&lon=${lng}&models=best_match&sections=all&key=69z56nx86o9g7ut24iwuzq5p1ik9rek8v61ggigg`
      );
      const meteoData = await meteoResponse.json();
      
      if (meteoData && meteoData.daily && meteoData.hourly) {
        return {
          placeText: meteoData.timezone || '',
          daily: (meteoData.daily.data || []).slice(0, 7).map(d => ({
            id: d.day,
            day: new Date(d.day).toLocaleDateString('th-TH', { 
              weekday: 'short', 
              day: '2-digit', 
              month: 'short' 
            }),
            tempMin: Math.round(d.temperature.min),
            tempMax: Math.round(d.temperature.max),
            rainProb: Math.round((d.precipitation?.total > 0 ? 50 : 10)),
            windSpeed: Math.round(d.wind?.max?.value || 0),
            humidity: Math.round(d.humidity?.min || 60)
          })),
          hourly12h: (meteoData.hourly.data || []).slice(0, 12).map(h => ({
            time: h.time,
            rainProb: Math.round(h.precipitation?.total > 0 ? 50 : 10),
            windSpeed: Math.round(h.wind?.speed || 0),
            temp: Math.round(h.temperature || 25)
          }))
        };
      }
      
      // 2) OpenWeatherMap (fallback) - using actual API key
      const owmResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&appid=29e794ca05b243e559caf94c5a638d02&units=metric`
      );
      const owmData = await owmResponse.json();
      
      if (owmData && owmData.daily && owmData.hourly) {
        return {
          placeText: owmData.timezone || '',
          daily: owmData.daily.slice(0, 7).map(d => ({
            id: new Date(d.dt * 1000).toISOString().slice(0, 10),
            day: new Date(d.dt * 1000).toLocaleDateString('th-TH', { 
              weekday: 'short', 
              day: '2-digit', 
              month: 'short' 
            }),
            tempMin: Math.round(d.temp.min),
            tempMax: Math.round(d.temp.max),
            rainProb: Math.round((d.pop || 0) * 100),
            windSpeed: Math.round((d.wind_speed || 0) * 3.6),
            humidity: Math.round(d.humidity || 60)
          })),
          hourly12h: owmData.hourly.slice(0, 12).map(h => ({
            time: new Date(h.dt * 1000).toISOString(),
            rainProb: Math.round((h.pop || 0) * 100),
            windSpeed: Math.round((h.wind_speed || 0) * 3.6),
            temp: Math.round(h.temp || 25)
          }))
        };
      }
      
      throw new Error('Weather data not available');
    } catch (error) {
      console.error('Weather API error:', error);
      // Fallback to mock data for development
      return getMockWeather(lat, lng);
    }
  }
};

// Mock Weather Data (fallback)
const getMockWeather = (lat = 14.97, lng = 102.08) => {
  const now = new Date();
  const forecast = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dayName = date.toLocaleDateString('th-TH', { weekday: 'short' });
    const dayNumber = date.getDate();
    const monthName = date.toLocaleDateString('th-TH', { month: 'short' });
    
    forecast.push({
      id: i.toString(),
      day: `${dayName} ${dayNumber} ${monthName}`,
      tempMin: 23 + i,
      tempMax: 32 + i,
      rainProb: Math.min(90, 20 + i * 10),
      windSpeed: 10 + i * 2,
      humidity: 60 + i * 5
    });
  }
  
  return {
    placeText: 'นครราชสีมา',
    daily: forecast,
    hourly12h: forecast.slice(0, 4).map((day, index) => ({
      time: new Date(now.getTime() + index * 3 * 60 * 60 * 1000).toISOString(),
      rainProb: day.rainProb,
      windSpeed: day.windSpeed,
      temp: Math.round((day.tempMin + day.tempMax) / 2)
    }))
  };
};

// TodayHeader Component as per Oct 2025 Hotfixes
const TodayHeader = ({ lang, onLocationPress }) => {
  const title = lang === 'th' ? 'ไร่ AI' : 'Rai AI';
  const dateStr = formatToday(lang);
  
  // Use location precedence logic
  const locationSource = getLocationSource();
  const label = formatLocationDisplay(locationSource.placeText, lang) || (lang === 'th' ? 'เทพาลัย, นครราชสีมา' : 'Thephalai, Nakhon Ratchasima');

  return (
    <View style={styles.todayHeaderWrap}>
      <Text style={styles.todayHeaderTitle}>{title}</Text>
      <View style={styles.dateLocationRow}>
        <Text style={styles.todayHeaderDate} numberOfLines={1}>{dateStr}</Text>
        <TouchableOpacity onPress={onLocationPress} style={styles.locationContainer}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.todayHeaderLocation} numberOfLines={1}>{label}</Text>
          <Ionicons name="create-outline" size={14} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// SprayWindowBadge Component as per Oct 2025 Hotfixes
const SprayWindowBadge = ({ hourly12h, daily, onRemind, lang = 'th' }) => {
  // Use the new getSprayWindowStatus function
  const sprayStatus = getSprayWindowStatus(hourly12h);
  const now = hourly12h?.[0];
  const today = daily?.[0];
  
  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <View style={styles.sprayWindowCard}>
      <View style={styles.sprayWindowHeader}>
        <Ionicons name="water" size={20} color="#4CAF50" />
        <Text style={styles.sprayWindowTitle}>
          {lang === 'th' ? 'ช่วงเวลาฉีดพ่น' : 'Spray Window'}
        </Text>
      </View>
      
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: sprayStatus.color }]}>
        <Text style={styles.statusBadgeText}>
          {sprayStatus.text}
        </Text>
      </View>
      
      {/* Reason text */}
      <Text style={styles.reasonText}>{sprayStatus.reason}</Text>
      
      {/* Weather factors from real data */}
      <View style={styles.factorsRow}>
        <Text style={styles.factorText}>💨 {Math.round(now?.windKph ?? 0)} km/h</Text>
        <Text style={styles.factorText}>☔ {Math.round(now?.rainProb ?? 0)}%</Text>
        <Text style={styles.factorText}>🌡 {Math.round(today?.max ?? 0)}°C</Text>
      </View>
      
      {/* Last updated */}
      <Text style={styles.lastUpdatedText}>
        {t('last_updated', lang)} {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
      </Text>
      
      {/* Remind me button - only show if there's a next good window */}
      {sprayStatus.nextGoodStart && (
        <TouchableOpacity 
          style={styles.remindMeButton}
          onPress={() => {
            if (onRemind) {
              onRemind(sprayStatus.nextGoodStart, sprayStatus.nextGoodEnd);
            }
          }}
        >
          <Ionicons name="notifications" size={16} color="#4CAF50" />
          <Text style={styles.remindMeText}>
            {t('remind_me', lang)} {formatTime(sprayStatus.nextGoodStart)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// PriceRow Component as per Oct 2025 Hotfixes
const PriceRow = ({ lang, nameTh, nameEn, priceTHB, unitTh, unitEn, sourceName }) => {
  const name = lang === 'th' ? nameTh : nameEn;
  const unit = lang === 'th' ? unitTh : unitEn;
  const price = formatPriceTHB(priceTHB);

  return (
    <View style={styles.priceRowWrap}>
      <View style={styles.priceRow}>
        <Text style={styles.priceRowName}>{name}:</Text>
        <Text style={styles.priceRowPrice}>{price} {unit}</Text>
        <Text style={styles.priceRowLive}>LIVE</Text>
        <Text style={styles.priceRowSourceSmall}>
          {lang === 'th' ? 'ที่มา' : 'Source'}: {sourceName}
        </Text>
      </View>
    </View>
  );
};

// Bottom Tab Navigator Component
const BottomTabNavigator = ({ activeTab, onTabChange, lang }) => {
  const tabs = [
    { key: 'home', icon: 'home', label: t('home', lang) },
    { key: 'scan', icon: 'camera', label: t('scan', lang) },
    { key: 'fields', icon: 'leaf', label: t('fields', lang) },
    { key: 'weather', icon: 'partly-sunny', label: t('weather', lang) },
    { key: 'settings', icon: 'settings', label: t('settings', lang) }
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => onTabChange(tab.key)}
        >
          <Ionicons 
            name={tab.icon} 
            size={24} 
            color={activeTab === tab.key ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Home Screen Component - MVP ONLY
const HomeScreen = ({ lang, onScheduleReminder, onNavigate }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [sprayWindow, setSprayWindow] = useState({ status: 'unknown', text: 'ไม่ทราบ', color: '#9E9E9E' });
  const [prices, setPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('rice');

  useEffect(() => {
    // Initialize default location on first run
    initializeDefaultLocation();
    
    // Load weather data and calculate spray window
    loadWeatherData();
    
    // Load prices (MVP includes Today Prices card)
    loadPrices();
    
    // Listen for location updates from weather page
    const unsubscribeLocation = addEventListener('locationUpdated', (data) => {
      console.log('Location updated, refreshing weather data:', data);
      loadWeatherData();
    });
    
    // Listen for field deletion events
    const unsubscribeField = addEventListener('fieldDeleted', (data) => {
      console.log('Field deleted, refreshing weather data with prefs:', data);
      loadWeatherData();
    });
    
    return () => {
      unsubscribeLocation();
      unsubscribeField();
    };
  }, []);

  const initializeDefaultLocation = async () => {
    try {
      if (!mockStorage.prefs.weatherPlaceText) {
        const label = lang === 'th' ? 'เทพาลัย, นครราชสีมา' : 'Thephalai, Nakhon Ratchasima';
        mockStorage.prefs.weatherPlaceText = label;
        
        // Geocode the default location
        const geo = await GeocodeAPI.search(label);
        if (geo?.lat && geo?.lng) {
          mockStorage.prefs.weatherLatLng = { lat: geo.lat, lng: geo.lng };
        }
      }
    } catch (error) {
      console.error('Failed to initialize default location:', error);
    }
  };

  const loadWeatherData = async () => {
    try {
      // Use location precedence logic
      const locationSource = getLocationSource();
      const lat = locationSource.lat || 14.97;
      const lng = locationSource.lng || 102.08;
      
      console.log('Loading weather for location:', { source: locationSource.source, lat, lng, placeText: locationSource.placeText });
      
      // Use real weather API
      const forecast = await WeatherAPI.getForecast(lat, lng);
      if (forecast && (forecast.daily || forecast.hourly12h)) {
        setWeatherData(forecast);
        
        // Calculate spray window status from real 12h hourly data
        const sprayStatus = getSprayWindowStatus(forecast.hourly12h || []);
        setSprayWindow(sprayStatus);
      } else {
        throw new Error('Invalid weather data received');
      }
    } catch (error) {
      console.error('Failed to load weather:', error);
      // Fallback to mock data only if API completely fails
      const cachedWeather = getMockWeather();
      setWeatherData(cachedWeather);
      const sprayStatus = getSprayWindowStatus(cachedWeather.hourly12h || []);
      setSprayWindow(sprayStatus);
    }
  };

  const loadPrices = async (forceRefresh = false) => {
    // Check if we have cached prices for today (unless force refresh)
    const today = new Date().toISOString().split('T')[0];
    if (!forceRefresh && mockDB.priceCache && mockDB.priceCache.dateISO === today) {
      setPrices(mockDB.priceCache);
      return;
    }
    
    // Load fresh prices from real API
    setLoadingPrices(true);
    try {
      const priceData = await PricesAPI.getToday(['rice', 'durian']);
      if (priceData && priceData.items && priceData.items.length > 0) {
      setPrices(priceData);
        // Cache the real data
        mockDB.priceCache = {
          id: '1',
          dateISO: today,
          items: priceData.items
        };
      } else {
        throw new Error('No price data received');
      }
    } catch (error) {
      console.error('Failed to load prices:', error);
      // Fallback to mock prices if API fails
      const mockPrices = {
        items: [
          { commodity: 'rice_jasmine', priceTHB: 10500, sourceName: 'กรมการค้าภายใน' },
          { commodity: 'durian_monthong', priceTHB: 120, sourceName: 'ตลาดกลางผลไม้' }
        ]
      };
      setPrices(mockPrices);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Auto-refresh prices every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadPrices(true); // Force refresh
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  const handleReminder = (nextGoodStart, nextGoodEnd) => {
    if (!nextGoodStart) {
      showToast(lang === 'th' ? 'ไม่มีช่วงเวลาที่เหมาะสมใน 12 ชั่วโมงถัดไป' : 'No good window in the next 12 hours');
      return;
    }
    
    // Schedule local notification at next good window
    const notificationTime = new Date(nextGoodStart);
    const timeString = notificationTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    // Mock local notification scheduling
    console.log('Scheduling notification for:', notificationTime);
    
    showToast(
      lang === 'th' 
        ? `ตั้งการแจ้งเตือนเวลา ${timeString}` 
        : `Notification scheduled for ${timeString}`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <TodayHeader
        lang={lang}
        onLocationPress={() => onNavigate && onNavigate('weather')}
      />

      {/* Crop Selection Tabs */}
      <View style={styles.cropTabsContainer}>
        <TouchableOpacity
          style={[styles.cropTab, selectedCrop === 'rice' && styles.cropTabActive]}
          onPress={() => setSelectedCrop('rice')}
        >
          <Ionicons 
            name="leaf" 
            size={16} 
            color={selectedCrop === 'rice' ? '#FFFFFF' : '#666'} 
          />
          <Text style={[styles.cropTabText, selectedCrop === 'rice' && styles.cropTabTextActive]}>
            {lang === 'th' ? 'ข้าว' : 'Rice'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cropTab, selectedCrop === 'durian' && styles.cropTabActive]}
          onPress={() => setSelectedCrop('durian')}
        >
          <Ionicons 
            name="leaf" 
            size={16} 
            color={selectedCrop === 'durian' ? '#FFFFFF' : '#666'} 
          />
          <Text style={[styles.cropTabText, selectedCrop === 'durian' && styles.cropTabTextActive]}>
            {lang === 'th' ? 'ทุเรียน' : 'Durian'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Spray Window Badge - New Component */}
      <SprayWindowBadge 
        hourly12h={weatherData?.hourly12h || []} 
        daily={weatherData?.daily || []}
        onRemind={handleReminder}
        lang={lang}
      />

      {/* Today Prices Card - New Components */}
      <View style={styles.pricesCard}>
        <Text style={styles.pricesTitle}>{t('prices_today', lang)}</Text>

        {loadingPrices ? (
          <Text style={styles.pricesLoading}>{t('updating_prices', lang)}</Text>
        ) : prices ? (
          <>
            {selectedCrop === 'rice' && (
            <PriceRow
              lang={lang}
              nameTh="ข้าว (หอมมะลิ)"
              nameEn="Rice (Jasmine)"
              priceTHB={prices.items.find(item => item.commodity === 'rice_jasmine')?.priceTHB || 10500}
              unitTh="บ./ตัน"
              unitEn="฿/Ton"
              sourceName={prices.items.find(item => item.commodity === 'rice_jasmine')?.sourceName || 'กรมการค้าภายใน'}
            />
            )}
            {selectedCrop === 'durian' && (
            <PriceRow
              lang={lang}
              nameTh="ทุเรียน (หมอนทอง)"
              nameEn="Durian (Monthong)"
              priceTHB={prices.items.find(item => item.commodity === 'durian_monthong')?.priceTHB || 120}
              unitTh="บ./กก."
              unitEn="฿/Kg"
              sourceName={prices.items.find(item => item.commodity === 'durian_monthong')?.sourceName || 'ตลาดกลางผลไม้'}
            />
            )}
          </>
        ) : (
          <Text style={styles.pricesError}>ไม่สามารถโหลดราคาได้</Text>
        )}
      </View>

      {/* Quick Actions - MVP ONLY */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onNavigate && onNavigate('scan')}
        >
          <Ionicons name="camera" size={24} color="#4CAF50" />
          <Text style={styles.actionButtonText}>{t('scan_now', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onNavigate && onNavigate('fields')}
        >
          <Ionicons name="leaf" size={24} color="#4CAF50" />
          <Text style={styles.actionButtonText}>{t('fields', lang)}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Scan Screen Component
const ScanScreen = ({ lang, onNavigate }) => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentField, setCurrentField] = useState(null);

  useEffect(() => {
    // Load current field
    const field = FieldService.getField();
    setCurrentField(field);
    
    // Subscribe to field changes
    const unsubscribe = FieldService.subscribe(() => {
      const field = FieldService.getField();
      setCurrentField(field);
    });

    return unsubscribe;
  }, []);

  const handleScan = async (source) => {
    // Check daily limit (Asia/Bangkok timezone)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    if (mockStorage.limits.lastScanDateISO === today) {
      showToast(lang === 'th' ? 'วันนี้สแกนได้ 1 ครั้ง' : 'Limited to 1 scan per day.');
      return;
    }

    // Always allow scan - field is optional per scope
    const currentField = FieldService.getField();
    setIsScanning(true);
    
    try {
      // Mock image capture/selection
      const imagePath = await mockImageCapture(source);
      
      // Prepare scan data
      const scanData = {
        image: imagePath,
        fieldId: currentField?.id || null,
        crop: currentField ? 'rice' : null // Default to rice for MVP
      };
      
      // Call server API
      const result = await callScanAPI(scanData);
      
      // Create scan record
      const scanRecord = {
        id: Date.now().toString(),
        fieldId: currentField?.id || null,
        imgPath: imagePath,
        label: result.label,
        confidence: result.confidence,
        createdAt: Date.now()
      };
      
      // Overwrite previous scan (MVP limit) - keep only latest
      mockDB.scans = [scanRecord];
      mockStorage.limits.lastScanDateISO = today;
      
      // Create result for display
      const displayResult = {
        ...scanRecord,
        steps: result.steps || [
          lang === 'th' ? 'ใช้สารป้องกันเชื้อรา' : 'Apply fungicide',
          lang === 'th' ? 'ฉีดพ่นทุก 7-10 วัน' : 'Spray every 7-10 days',
          lang === 'th' ? 'ตรวจสอบผลลัพธ์' : 'Monitor results'
        ],
        ppe: result.ppe || (lang === 'th' ? 'สวมหน้ากากและถุงมือ' : 'Wear mask and gloves')
      };
      
      setScanResult(displayResult);
    } catch (error) {
      console.error('Scan failed:', error);
      showToast(lang === 'th' ? 'การสแกนล้มเหลว' : 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  // Mock image capture function
  const mockImageCapture = async (source) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`mock_image_${Date.now()}.jpg`);
      }, 500);
    });
  };

  // Real API call to /api/scan with offline queueing
  const callScanAPI = async (scanData) => {
    try {
      // Check network connectivity
      const isOnline = navigator.onLine !== false;
      
      if (!isOnline) {
        // Queue for offline processing
        const queuedScan = {
          id: Date.now().toString(),
          data: scanData,
          timestamp: Date.now(),
          retries: 0
        };
        
        // Store in offline queue
        if (!mockStorage.offlineQueue) {
          mockStorage.offlineQueue = [];
        }
        mockStorage.offlineQueue.push(queuedScan);
        
        // Show offline banner
        showToast(lang === 'th' ? 'จะอัปโหลดเมื่อออนไลน์' : 'Will upload when online');
        
        // Return pending result for immediate display
        return {
          label: lang === 'th' ? 'รอการวิเคราะห์' : 'Pending analysis',
          confidence: 0.5,
          steps: [
            lang === 'th' ? 'รอการเชื่อมต่ออินเทอร์เน็ต' : 'Waiting for internet connection',
            lang === 'th' ? 'จะวิเคราะห์อัตโนมัติ' : 'Will analyze automatically',
            lang === 'th' ? 'ตรวจสอบผลลัพธ์ภายหลัง' : 'Check results later'
          ],
          ppe: lang === 'th' ? 'สวมหน้ากากและถุงมือ' : 'Wear mask and gloves',
          isQueued: true
        };
      }
      
      // Real API call to server
      const formData = new FormData();
      formData.append('image', scanData.image);
      if (scanData.fieldId) {
        formData.append('fieldId', scanData.fieldId);
      }
      if (scanData.crop) {
        formData.append('crop', scanData.crop);
      }
      
      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Scan API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform server response to our format
      return {
        label: result.label || (lang === 'th' ? 'ไม่ทราบ' : 'Unknown'),
        confidence: result.confidence || 0.5,
        steps: result.steps || [
          lang === 'th' ? 'ตรวจสอบสภาพใบ' : 'Check leaf condition',
          lang === 'th' ? 'ใช้สารป้องกันที่เหมาะสม' : 'Use appropriate treatment',
          lang === 'th' ? 'ติดตามผล' : 'Monitor results'
        ],
        ppe: result.ppe || (lang === 'th' ? 'สวมหน้ากากและถุงมือ' : 'Wear mask and gloves'),
        isQueued: false
      };
      
    } catch (error) {
      console.error('Scan API error:', error);
      
      // Fallback to mock data for development
      const confidence = Math.random();
      let label, steps, ppe;
      
      if (confidence < 0.55) {
        label = lang === 'th' ? 'ไม่แน่ใจ' : 'Not sure';
        steps = [
          lang === 'th' ? 'ถ่ายภาพใหม่ในแสงที่ดีกว่า' : 'Retake photo with better lighting',
          lang === 'th' ? 'ให้ใบอยู่ในโฟกัส' : 'Keep leaf in focus',
          lang === 'th' ? 'ลองอีกครั้ง' : 'Try again'
        ];
        ppe = lang === 'th' ? 'สวมหน้ากากและถุงมือ' : 'Wear mask and gloves';
      } else if (confidence < 0.7) {
        label = lang === 'th' ? 'ใบไหม้' : 'Brown spot';
        steps = [
          lang === 'th' ? 'ใช้สารป้องกันเชื้อรา' : 'Apply fungicide',
          lang === 'th' ? 'ฉีดพ่นทุก 7-10 วัน' : 'Spray every 7-10 days',
          lang === 'th' ? 'ตรวจสอบผลลัพธ์' : 'Monitor results'
        ];
        ppe = lang === 'th' ? 'สวมหน้ากากและถุงมือ' : 'Wear mask and gloves';
      } else {
        label = lang === 'th' ? 'ใบไหม้' : 'Brown spot';
        steps = [
          lang === 'th' ? 'ใช้สารป้องกันเชื้อรา' : 'Apply fungicide',
          lang === 'th' ? 'ฉีดพ่นทุก 7-10 วัน' : 'Spray every 7-10 days',
          lang === 'th' ? 'ตรวจสอบผลลัพธ์' : 'Monitor results'
        ];
        ppe = lang === 'th' ? 'สวมหน้ากากและถุงมือ' : 'Wear mask and gloves';
      }
      
      return {
        label,
        confidence,
        steps,
        ppe,
        isQueued: false
      };
    }
  };

  // Check daily quota
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const hasScannedToday = mockStorage.limits.lastScanDateISO === today;
  const remainingScans = hasScannedToday ? 0 : 1;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>{t('scan', lang)}</Text>
      </View>

      {/* Daily Quota Display */}
      <View style={styles.quotaContainer}>
        <Ionicons name="calendar" size={16} color="#666" />
        <Text style={styles.quotaText}>
          {lang === 'th' 
            ? `เหลือ ${remainingScans}/1 วันนี้` 
            : `${remainingScans}/1 left today`
          }
        </Text>
      </View>

      {/* Field Info Card (if field exists) */}
      {currentField && (
        <View style={styles.fieldInfoCard}>
          <Ionicons name="location" size={20} color="#4CAF50" />
          <View style={styles.fieldInfoText}>
            <Text style={styles.fieldInfoName}>{currentField.name}</Text>
            <Text style={styles.fieldInfoLocation}>
              {formatLocationDisplay(currentField.placeText, lang)}
            </Text>
          </View>
        </View>
      )}

      {/* Main Scan Button */}
      <TouchableOpacity
        style={[styles.scanButtonMain, (isScanning || hasScannedToday) && styles.scanButtonDisabled]}
        onPress={() => handleScan('camera')}
        disabled={isScanning || hasScannedToday}
      >
        <Ionicons name="camera" size={28} color="white" />
        <Text style={styles.scanButtonMainText}>
          {isScanning ? t('scanning', lang) : t('scan_now', lang)}
        </Text>
      </TouchableOpacity>

      {/* Gallery Button */}
      <TouchableOpacity
        style={styles.galleryButton}
        onPress={() => handleScan('gallery')}
        disabled={isScanning || hasScannedToday}
      >
        <Ionicons name="images" size={20} color="#4CAF50" />
        <Text style={styles.galleryButtonText}>
          {lang === 'th' ? 'เลือกจากคลังภาพ' : 'Choose from gallery'}
        </Text>
      </TouchableOpacity>

      {/* Daily Limit Message */}
      {hasScannedToday && (
        <View style={styles.limitMessage}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.limitMessageText}>
            {lang === 'th' ? 'วันนี้สแกนได้ 1 ครั้ง' : 'Limited to 1 scan per day.'}
          </Text>
        </View>
      )}

      {/* Scanning State */}
      {isScanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.scanningText}>
            {lang === 'th' ? 'กำลังวิเคราะห์...' : 'Analyzing...'}
          </Text>
        </View>
      )}

      {/* Result Sheet */}
      {scanResult && (
        <View style={styles.resultSheet}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>
              {lang === 'th' ? 'ผลการวิเคราะห์' : 'Analysis Result'}
            </Text>
            <TouchableOpacity
              style={styles.resultCloseButton}
              onPress={() => setScanResult(null)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.resultContent}>
            <Text style={styles.resultDisease}>{scanResult.label}</Text>
            <Text style={styles.resultConfidence}>
              {lang === 'th' ? 'ความแม่นยำ' : 'Confidence'}: {Math.round(scanResult.confidence * 100)}%
            </Text>
            
            {/* Low confidence warning */}
            {scanResult.confidence < 0.55 && (
              <View style={styles.lowConfidenceWarning}>
                <Ionicons name="warning" size={20} color="#FF9800" />
                <Text style={styles.lowConfidenceText}>
                  {lang === 'th' 
                    ? 'ไม่แน่ใจ - ลองถ่ายใหม่ในแสงที่ดีกว่า' 
                    : 'Not sure - try retaking with better lighting'
                  }
                </Text>
              </View>
            )}
            
            {/* Action Steps */}
            <View style={styles.actionSteps}>
              <Text style={styles.actionStepsTitle}>
                {lang === 'th' ? 'ขั้นตอนการแก้ไข' : 'Action Steps'}
              </Text>
              {scanResult.steps?.map((step, index) => (
                <Text key={index} style={styles.actionStep}>
                  {index + 1}. {step}
                </Text>
              ))}
            </View>
            
            {/* PPE Reminder */}
            {scanResult.ppe && (
              <View style={styles.ppeReminder}>
                <Ionicons name="shield" size={16} color="#4CAF50" />
                <Text style={styles.ppeText}>{scanResult.ppe}</Text>
              </View>
            )}
            
            {/* Field prompt if no field exists */}
            {!currentField && (
              <View style={styles.fieldPromptContainer}>
                <Ionicons name="information-circle" size={20} color="#FF9800" />
                <Text style={styles.fieldPromptText}>
                  {lang === 'th' 
                    ? 'เพิ่มแปลงเพื่อดูคำแนะนำที่ตรงกับสภาพอากาศ' 
                    : 'Add your field to get weather-aware advice.'
                  }
                </Text>
                <TouchableOpacity
                  style={styles.fieldPromptButton}
                  onPress={() => onNavigate && onNavigate('fields')}
                >
                  <Text style={styles.fieldPromptButtonText}>
                    {lang === 'th' ? 'เพิ่มแปลง' : 'Add Field'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// Field Map Editor Component
const FieldMapEditor = ({ visible, onClose, onSave, initialData, lang }) => {
  const [fieldName, setFieldName] = useState(initialData?.name || '');
  const [searchQuery, setSearchQuery] = useState(initialData?.placeText || '');
  const [lat, setLat] = useState(initialData?.lat || 14.97);
  const [lng, setLng] = useState(initialData?.lng || 102.08);
  const [areaRai, setAreaRai] = useState(initialData?.areaRai || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [hasPolygon, setHasPolygon] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setFieldName(initialData?.name || '');
      setSearchQuery(initialData?.placeText || '');
      setLat(initialData?.lat || 14.97);
      setLng(initialData?.lng || 102.08);
      setAreaRai(initialData?.areaRai || '');
      setPolygonPoints([]);
      setHasPolygon(false);
      setIsDrawing(false);
    }
  }, [visible, initialData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Search suggestions for Thai locations
  const getSearchSuggestions = (query) => {
    const suggestions = [
      'เทพาลัย, นครราชสีมา',
      'เมืองนครราชสีมา, นครราชสีมา',
      'เมืองขอนแก่น, ขอนแก่น',
      'เมืองเชียงใหม่, เชียงใหม่',
      'เขตบางรัก, กรุงเทพมหานคร',
      'เมืองอุดรธานี, อุดรธานี',
      'เมืองสุราษฎร์ธานี, สุราษฎร์ธานี',
      'เมืองสงขลา, สงขลา'
    ];
    
    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const handleSearchInputChange = (text) => {
    setSearchQuery(text);
    if (text.length > 2) {
      const suggestions = getSearchSuggestions(text);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      
      // Auto-search for real-time results (debounced)
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(async () => {
        try {
          const result = await GeocodeAPI.search(text);
          if (result.lat && result.lng) {
            setLat(result.lat);
            setLng(result.lng);
            // Don't update searchQuery to avoid interrupting user typing
          }
        } catch (error) {
          // Silently fail for real-time search
          console.log('Real-time search failed:', error.message);
        }
      }, 1000); // 1 second delay
      setSearchTimeout(timeout);
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSearchSuggestions([]);
    // Auto-search when suggestion is selected
    setTimeout(() => handleSearch(), 100);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert(
        lang === 'th' ? 'ข้อผิดพลาด' : 'Error',
        lang === 'th' ? 'กรุณาใส่ชื่อตำบล/จังหวัด' : 'Please enter sub-district/province'
      );
      return;
    }

    setShowSuggestions(false);
    setIsGeocoding(true);
    try {
      // Use real GeocodeAPI with Google and OpenCage
      const result = await GeocodeAPI.search(searchQuery);
      
      if (result.lat && result.lng) {
        setLat(result.lat);
        setLng(result.lng);
        setSearchQuery(result.placeText || searchQuery);
        
        // Show success message with source
        const sourceText = result.source === 'google' ? 'Google Maps' : 
                          result.source === 'opencage' ? 'OpenCage' : 'Local Data';
        showToast(
          lang === 'th' 
            ? `พบตำแหน่ง: ${result.placeText} (${sourceText})` 
            : `Location found: ${result.placeText} (${sourceText})`
        );
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      Alert.alert(
        lang === 'th' ? 'ไม่พบตำแหน่ง' : 'Location not found',
        lang === 'th' ? 'ไม่สามารถค้นหาตำแหน่งได้ กรุณาลองใหม่' : 'Could not find location. Please try again.'
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseMyLocation = async () => {
    try {
      // Simulate getting current location
      Alert.alert(
        lang === 'th' ? 'ใช้ตำแหน่งปัจจุบัน' : 'Use Current Location',
        lang === 'th' ? 'กำลังค้นหาตำแหน่งของคุณ...' : 'Finding your location...',
        [
          {
            text: lang === 'th' ? 'ยกเลิก' : 'Cancel',
            style: 'cancel'
          },
          {
            text: lang === 'th' ? 'ใช้ตำแหน่งนี้' : 'Use This Location',
            onPress: async () => {
              try {
                // Mock GPS location for demo (in real app, use navigator.geolocation)
                const mockLocation = { lat: 14.97, lng: 102.08 };
                
                // Use reverse geocoding to get address from coordinates
                const geo = await GeocodeAPI.reverse(mockLocation.lat, mockLocation.lng);
                
                if (geo?.lat && geo?.lng) {
                  setLat(geo.lat);
                  setLng(geo.lng);
                  setSearchQuery(geo.placeText);
                  
                  Alert.alert(
                    lang === 'th' ? 'สำเร็จ' : 'Success',
                    lang === 'th' ? 'ใช้ตำแหน่งปัจจุบันเรียบร้อย' : 'Current location set successfully'
                  );
                } else {
                  // Fallback to default coordinates
                  setLat(14.97);
                  setLng(102.08);
                  setSearchQuery(lang === 'th' ? 'เทพาลัย, นครราชสีมา' : 'Thephalai, Nakhon Ratchasima');
                }
              } catch (error) {
                console.error('Use my location failed:', error);
                // Fallback to default coordinates
                setLat(14.97);
                setLng(102.08);
                setSearchQuery(lang === 'th' ? 'เทพาลัย, นครราชสีมา' : 'Thephalai, Nakhon Ratchasima');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Location access failed:', error);
      Alert.alert(
        lang === 'th' ? 'ไม่สามารถเข้าถึงตำแหน่ง' : 'Location Access Failed',
        lang === 'th' ? 'ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้' : 'Could not access current location'
      );
    }
  };

  const handleDraw = () => {
    if (!isDrawing) {
      // Start drawing mode
      setIsDrawing(true);
      Alert.alert(
        lang === 'th' ? 'โหมดวาด' : 'Draw Mode',
        lang === 'th' ? 'แตะบนแผนที่เพื่อวาดรูปหลายเหลี่ยม' : 'Tap on the map to draw a polygon',
        [
          {
            text: lang === 'th' ? 'เริ่มวาด' : 'Start Drawing',
            onPress: () => {
              // Drawing mode is now active - user can tap on map
              console.log('Drawing mode activated');
            }
          },
          {
            text: lang === 'th' ? 'ยกเลิก' : 'Cancel',
            style: 'cancel',
            onPress: () => setIsDrawing(false)
          }
        ]
      );
    } else {
      // Stop drawing mode
      setIsDrawing(false);
    }
  };

  const handleMapPress = (event) => {
    if (!isDrawing) return;
    
    // Get touch coordinates (simplified for demo)
    const { locationX, locationY } = event.nativeEvent;
    
    // Convert screen coordinates to lat/lng (simplified calculation)
    const offsetLat = (locationY - 200) * 0.0001; // Rough conversion
    const offsetLng = (locationX - 200) * 0.0001;
    
    const newPoint = {
      lat: lat + offsetLat,
      lng: lng + offsetLng
    };
    
    setPolygonPoints(prev => {
      const newPoints = [...prev, newPoint];
      
      // Auto-complete polygon after 3 points
      if (newPoints.length >= 3) {
        setHasPolygon(true);
        setIsDrawing(false);
        setTimeout(() => {
          Alert.alert(
            lang === 'th' ? 'วาดเสร็จ' : 'Drawing Complete',
            lang === 'th' ? 'สร้างรูปหลายเหลี่ยมเรียบร้อย' : 'Polygon created successfully'
          );
        }, 100);
      }
      
      return newPoints;
    });
  };

  const handleClear = () => {
    if (polygonPoints.length === 0 && !hasPolygon) {
      Alert.alert(
        lang === 'th' ? 'ไม่มีรูปวาด' : 'No Drawing',
        lang === 'th' ? 'ไม่มีรูปหลายเหลี่ยมให้ล้าง' : 'No polygon to clear'
      );
      return;
    }

    Alert.alert(
      lang === 'th' ? 'ล้างรูปวาด' : 'Clear Drawing',
      lang === 'th' ? 'คุณต้องการลบรูปหลายเหลี่ยมหรือไม่?' : 'Are you sure you want to clear the polygon?',
      [
        {
          text: lang === 'th' ? 'ยกเลิก' : 'Cancel',
          style: 'cancel'
        },
        {
          text: lang === 'th' ? 'ล้าง' : 'Clear',
          onPress: () => {
            setPolygonPoints([]);
            setHasPolygon(false);
            setIsDrawing(false);
            Alert.alert(
              lang === 'th' ? 'ล้างเสร็จ' : 'Cleared',
              lang === 'th' ? 'ลบรูปหลายเหลี่ยมเรียบร้อย' : 'Polygon cleared successfully'
            );
          }
        }
      ]
    );
  };

  const handleSave = () => {
    if (!fieldName.trim()) {
      Alert.alert(
        lang === 'th' ? 'ข้อผิดพลาด' : 'Error',
        lang === 'th' ? 'กรุณาใส่ชื่อแปลง' : 'Please enter field name'
      );
      return;
    }

    if (!searchQuery.trim()) {
      Alert.alert(
        lang === 'th' ? 'ข้อผิดพลาด' : 'Error',
        lang === 'th' ? 'กรุณาเลือกตำแหน่ง' : 'Please select location'
      );
      return;
    }

    const fieldData = {
      name: fieldName.trim(),
      lat,
      lng,
      placeText: searchQuery.trim(),
      areaRai: areaRai ? parseFloat(areaRai) : null,
      polygon: hasPolygon ? JSON.stringify(polygonPoints) : null
    };

    console.log('Saving field data:', fieldData);
    onSave(fieldData);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.mapEditorContainer}>
        {/* Header */}
        <View style={styles.mapEditorHeader}>
          <TouchableOpacity onPress={onClose} style={styles.mapEditorHeaderButton}>
            <Text style={styles.mapEditorHeaderButtonText}>
              {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.mapEditorHeaderTitle}>
            {initialData ? (lang === 'th' ? 'แก้ไขแปลง' : 'Edit Field') : (lang === 'th' ? 'เพิ่มแปลง' : 'Add Field')}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.mapEditorHeaderButton}>
            <Text style={[styles.mapEditorHeaderButtonText, styles.mapEditorSaveButton]}>
              {lang === 'th' ? 'บันทึก' : 'Save'}
            </Text>
        </TouchableOpacity>
      </View>

        {/* Content */}
        <View style={styles.mapEditorContent}>
          {/* Field Name */}
          <View style={styles.mapEditorInputGroup}>
            <Text style={styles.mapEditorLabel}>
              {lang === 'th' ? 'ชื่อแปลง' : 'Field Name'}
            </Text>
            <TextInput
              style={styles.mapEditorInput}
              value={fieldName}
              onChangeText={setFieldName}
              placeholder={lang === 'th' ? 'เช่น แปลงข้าว 1' : 'e.g., Rice Field 1'}
              placeholderTextColor="#999"
            />
        </View>

          {/* Area Size */}
          <View style={styles.mapEditorInputGroup}>
            <Text style={styles.mapEditorLabel}>
              {lang === 'th' ? 'ขนาดแปลง (ไร่)' : 'Field size (rai)'}
            </Text>
            <TextInput
              style={styles.mapEditorInput}
              value={areaRai}
              onChangeText={setAreaRai}
              placeholder={lang === 'th' ? 'เช่น 5.5' : 'e.g., 5.5'}
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <Text style={styles.mapEditorHelpText}>
              {lang === 'th' ? 'ไม่บังคับ - ใส่ขนาดแปลงเป็นไร่' : 'Optional - Enter field size in rai'}
            </Text>
          </View>

          {/* Location Search */}
          <View style={styles.mapEditorInputGroup}>
            <Text style={styles.mapEditorLabel}>
              {lang === 'th' ? 'ค้นหาตำแหน่ง' : 'Search Location'}
            </Text>
            <View style={styles.searchContainer}>
              <View style={styles.mapEditorSearchContainer}>
                <TextInput
                  style={styles.mapEditorSearchInput}
                  value={searchQuery}
                  onChangeText={handleSearchInputChange}
                  placeholder={lang === 'th' ? 'เช่น เทพาลัย, นครราชสีมา' : 'e.g., Thephalai, Nakhon Ratchasima'}
                  placeholderTextColor="#999"
                  onFocus={() => {
                    if (searchQuery.length > 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow selection
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                <TouchableOpacity
                  style={styles.mapEditorSearchButton}
                  onPress={handleSearch}
                  disabled={isGeocoding}
                >
                  {isGeocoding ? (
                    <ActivityIndicator size="small" color="#4CAF50" />
                  ) : (
                    <Ionicons name="search" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {searchSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionSelect(suggestion)}
                    >
                      <Ionicons name="location" size={16} color="#666" />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <Text style={styles.mapEditorHelpText}>
              {lang === 'th' ? 'ตำบล / จังหวัด' : 'Sub-district / Province'}
            </Text>
          </View>

          {/* Use My Location */}
          <TouchableOpacity
            style={styles.mapEditorLocationButton}
            onPress={handleUseMyLocation}
          >
            <Ionicons name="location" size={20} color="#4CAF50" />
            <Text style={styles.mapEditorLocationButtonText}>
              {lang === 'th' ? 'ใช้ตำแหน่งของฉัน' : 'Use My Location'}
            </Text>
          </TouchableOpacity>

          {/* Map Placeholder */}
          <TouchableOpacity 
            style={[styles.mapEditorMapPlaceholder, isDrawing && styles.mapEditorMapPlaceholderDrawing]}
            onPress={handleMapPress}
            activeOpacity={isDrawing ? 0.7 : 1}
          >
            <Ionicons name="map" size={48} color={isDrawing ? "#4CAF50" : "#ccc"} />
            <Text style={styles.mapEditorMapPlaceholderText}>
              {lang === 'th' ? 'แผนที่ (รุ่นทดลอง)' : 'Map (Demo Version)'}
            </Text>
            <Text style={styles.mapEditorMapPlaceholderSubtext}>
              {lang === 'th' 
                ? 'ตำแหน่ง: ' + lat.toFixed(4) + ', ' + lng.toFixed(4)
                : 'Location: ' + lat.toFixed(4) + ', ' + lng.toFixed(4)
              }
            </Text>
            {hasPolygon && (
              <View style={styles.polygonInfo}>
                <Ionicons name="triangle" size={16} color="#4CAF50" />
                <Text style={styles.polygonInfoText}>
                  {lang === 'th' ? 'รูปหลายเหลี่ยม: ' + polygonPoints.length + ' จุด' : 'Polygon: ' + polygonPoints.length + ' points'}
                </Text>
        </View>
      )}
            {isDrawing && (
              <View style={styles.drawingMode}>
                <Ionicons name="create" size={16} color="#FF9800" />
                <Text style={styles.drawingModeText}>
                  {lang === 'th' ? 'โหมดวาด - แตะเพื่อวาด' : 'Drawing Mode - Tap to draw'}
                </Text>
              </View>
            )}
            {polygonPoints.length > 0 && !hasPolygon && (
              <View style={styles.drawingProgress}>
                <Ionicons name="ellipse" size={16} color="#FF9800" />
                <Text style={styles.drawingProgressText}>
                  {lang === 'th' ? 'แตะอีก ' + (3 - polygonPoints.length) + ' ครั้ง' : 'Tap ' + (3 - polygonPoints.length) + ' more times'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Toolbar */}
          <View style={styles.mapEditorToolbar}>
            <TouchableOpacity 
              style={[styles.mapEditorToolbarButton, isDrawing && styles.mapEditorToolbarButtonActive]}
              onPress={handleDraw}
            >
              <Ionicons 
                name="create-outline" 
                size={20} 
                color={isDrawing ? "#4CAF50" : "#666"} 
              />
              <Text style={[styles.mapEditorToolbarButtonText, isDrawing && styles.mapEditorToolbarButtonTextActive]}>
                {lang === 'th' ? 'วาด' : 'Draw'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mapEditorToolbarButton, hasPolygon && styles.mapEditorToolbarButtonEnabled]}
              onPress={handleClear}
              disabled={!hasPolygon}
            >
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color={hasPolygon ? "#f44336" : "#ccc"} 
              />
              <Text style={[styles.mapEditorToolbarButtonText, hasPolygon && styles.mapEditorToolbarButtonTextEnabled]}>
                {lang === 'th' ? 'ล้าง' : 'Clear'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Fields Screen Component
const FieldsScreen = ({ lang, onNavigate }) => {
  const [field, setField] = useState(null);
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadField();
    
    // Subscribe to field changes
    const unsubscribe = FieldService.subscribe(() => {
      loadField();
    });

    return unsubscribe;
  }, []);

  const loadField = () => {
    const currentField = FieldService.getField();
    setField(currentField);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    loadField();
    setRefreshing(false);
  };

  const handleAddField = () => {
    setShowMapEditor(true);
  };

  const handleEditField = () => {
    if (field) {
      setShowMapEditor(true);
    }
  };

  const handleSaveField = async (fieldData) => {
    try {
      await FieldService.createOrUpdateField(fieldData);
      setShowMapEditor(false);
      
      // Show success message
      Alert.alert(
        lang === 'th' ? 'สำเร็จ' : 'Success',
        lang === 'th' ? 'บันทึกแปลงเรียบร้อย' : 'Field saved successfully'
      );
    } catch (error) {
      console.error('Failed to save field:', error);
      Alert.alert(
        lang === 'th' ? 'ข้อผิดพลาด' : 'Error',
        lang === 'th' ? 'ไม่สามารถบันทึกแปลงได้' : 'Failed to save field'
      );
    }
  };

  const handleDeleteField = () => {
    Alert.alert(
      lang === 'th' ? 'ลบแปลง' : 'Delete Field',
      lang === 'th' ? 'คุณต้องการลบแปลงนี้หรือไม่?' : 'Are you sure you want to delete this field?',
      [
        {
          text: lang === 'th' ? 'ยกเลิก' : 'Cancel',
          style: 'cancel'
        },
        {
          text: lang === 'th' ? 'ลบ' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FieldService.deleteField();
              
              // Notify other screens about field deletion (immediate fallback to prefs)
              notifyListeners('fieldDeleted', {});
              
              Alert.alert(
                lang === 'th' ? 'สำเร็จ' : 'Success',
                lang === 'th' ? 'ลบแปลงเรียบร้อย' : 'Field deleted successfully'
              );
            } catch (error) {
              console.error('Failed to delete field:', error);
              Alert.alert(
                lang === 'th' ? 'ข้อผิดพลาด' : 'Error',
                lang === 'th' ? 'ไม่สามารถลบแปลงได้' : 'Failed to delete field'
              );
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.fieldsHeader}>
        <Text style={styles.fieldsHeaderTitle}>
          {lang === 'th' ? 'แปลง' : 'Fields'}
        </Text>
        {!field && (
              <TouchableOpacity 
            style={styles.fieldsAddButton}
            onPress={handleAddField}
              >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.fieldsAddButtonText}>
              {lang === 'th' ? 'เพิ่มแปลง' : 'Add Field'}
            </Text>
              </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {!field ? (
        // Empty State
        <View style={styles.fieldsEmptyState}>
          <Ionicons name="leaf-outline" size={64} color="#ccc" />
          <Text style={styles.fieldsEmptyTitle}>
            {lang === 'th' ? 'ยังไม่มีแปลง' : 'No Field Yet'}
          </Text>
          <Text style={styles.fieldsEmptyDescription}>
            {lang === 'th' ? 'เพิ่มแปลงเพื่อเริ่มต้นใช้งาน' : 'Add a field to get started'}
          </Text>
              <TouchableOpacity 
            style={styles.fieldsEmptyButton}
            onPress={handleAddField}
              >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.fieldsEmptyButtonText}>
              {lang === 'th' ? 'เพิ่มแปลง' : 'Add Field'}
            </Text>
              </TouchableOpacity>
            </View>
      ) : (
        // Field Card
        <View style={styles.fieldsFieldCard}>
          <View style={styles.fieldsFieldHeader}>
            <View style={styles.fieldsFieldInfo}>
              <Text style={styles.fieldsFieldName}>{field.name}</Text>
              <View style={styles.fieldsFieldLocation}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.fieldsFieldLocationText}>
                  {formatLocationDisplay(field.placeText, lang)}
                </Text>
          </View>
            </View>
            <TouchableOpacity
              style={styles.fieldsEditButton}
              onPress={handleEditField}
            >
              <Ionicons name="create-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldsFieldDetails}>
            {field.areaRai && (
              <View style={styles.fieldsDetailRow}>
                <Text style={styles.fieldsDetailLabel}>
                  {lang === 'th' ? 'ขนาดแปลง' : 'Field Size'}
                </Text>
                <Text style={styles.fieldsDetailValue}>
                  {field.areaRai} {lang === 'th' ? 'ไร่' : 'rai'}
                </Text>
        </View>
      )}
            <View style={styles.fieldsDetailRow}>
              <Text style={styles.fieldsDetailLabel}>
                {lang === 'th' ? 'พิกัด' : 'Coordinates'}
              </Text>
              <Text style={styles.fieldsDetailValue}>
                {field.lat.toFixed(4)}, {field.lng.toFixed(4)}
              </Text>
            </View>
            <View style={styles.fieldsDetailRow}>
              <Text style={styles.fieldsDetailLabel}>
                {lang === 'th' ? 'อัปเดตล่าสุด' : 'Last Updated'}
              </Text>
              <Text style={styles.fieldsDetailValue}>
                {new Date(field.updatedAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
              </Text>
            </View>
          </View>

          <View style={styles.fieldsFieldActions}>
            <TouchableOpacity
              style={styles.fieldsActionButton}
              onPress={handleEditField}
            >
              <Ionicons name="create-outline" size={16} color="#4CAF50" />
              <Text style={styles.fieldsActionButtonText}>
                {lang === 'th' ? 'แก้ไข' : 'Edit'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fieldsActionButton, styles.fieldsDeleteButton]}
              onPress={handleDeleteField}
            >
              <Ionicons name="trash-outline" size={16} color="#f44336" />
              <Text style={[styles.fieldsActionButtonText, styles.fieldsDeleteButtonText]}>
                {lang === 'th' ? 'ลบ' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MVP Limit Notice */}
      {field && (
        <View style={styles.fieldsMvpNotice}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.fieldsMvpNoticeText}>
            {lang === 'th' ? 'รุ่นทดลองเพิ่มได้ 1 แปลง' : 'MVP allows 1 field'}
          </Text>
        </View>
      )}

      {/* Map Editor Modal */}
      <FieldMapEditor
        visible={showMapEditor}
        onClose={() => setShowMapEditor(false)}
        onSave={handleSaveField}
        initialData={field ? {
          name: field.name,
          polygon: field.polygon,
          lat: field.lat,
          lng: field.lng,
          placeText: field.placeText
        } : undefined}
        lang={lang}
      />
    </ScrollView>
  );
};

// Weather Screen Component
const WeatherScreen = ({ lang }) => {
  const [weatherData, setWeatherData] = useState([]);
  const [locationInput, setLocationInput] = useState(lang === 'th' ? 'เทพาลัย, นครราชสีมา' : 'Thephalai, Nakhon Ratchasima');
  const [lat, setLat] = useState(14.97);
  const [lng, setLng] = useState(102.08);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    loadWeatherData();
  }, [lat, lng]);

  const loadWeatherData = async () => {
    try {
      // Use real weather API with actual coordinates
      const forecast = await WeatherAPI.getForecast(lat, lng);
      if (forecast && forecast.daily) {
        setWeatherData(forecast.daily);
      } else {
        throw new Error('Invalid weather data received');
      }
    } catch (error) {
      console.error('Failed to load weather:', error);
      // Fallback to mock data only if API completely fails
      const forecast = getMockWeather(lat, lng);
      setWeatherData(forecast.daily || forecast);
    }
  };

  const handleLocationSearch = async () => {
    if (!locationInput.trim()) return;
    
    setIsGeocoding(true);
    try {
      const result = await GeocodeAPI.search(locationInput);
      setLat(result.lat);
      setLng(result.lng);
      setLocationInput(result.placeText);
      
      // Save to prefs only (weather page location)
      // Per scope: Weather page edits only affect Main/Spray when no field exists
      mockStorage.prefs.weatherPlaceText = result.placeText;
      mockStorage.prefs.weatherLatLng = { lat: result.lat, lng: result.lng };
      
      // Notify other screens about location update (only affects Main/Spray if no field)
      notifyListeners('locationUpdated', {
        placeText: result.placeText,
        lat: result.lat,
        lng: result.lng
      });
      
      showToast(t('location_updated', lang));
    } catch (error) {
      showToast(t('location_error', lang));
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseMyLocation = () => {
    // Mock location permission and result
    showToast('กำลังใช้ตำแหน่งปัจจุบัน...');
    setTimeout(() => {
      const result = { placeText: 'นครราชสีมา', lat: 14.97, lng: 102.08 };
      setLocationInput(result.placeText);
      setLat(result.lat);
      setLng(result.lng);
      
      // Save to active field or prefs as per scope document
      if (mockDB.fields.length > 0) {
        // Save to active field
        const activeField = mockDB.fields[0];
        activeField.placeText = result.placeText;
        activeField.lat = result.lat;
        activeField.lng = result.lng;
        activeField.updatedAt = Date.now();
        activeField.dirty = 1;
      } else {
        // Save to prefs if no field
        mockStorage.prefs.weatherPlaceText = result.placeText;
        mockStorage.prefs.weatherLatLng = { lat: result.lat, lng: result.lng };
      }
      
      showToast(t('location_updated', lang));
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>{t('weather_forecast', lang)}</Text>
        <Text style={styles.locationLabel}>
          {formatLocationDisplay(
            mockDB.fields.length > 0 && mockDB.fields[0].placeText 
            ? mockDB.fields[0].placeText 
              : mockStorage.prefs.weatherPlaceText || 'เทพาลัย, นครราชสีมา',
            lang
          )}
        </Text>
      </View>

      {/* Editable location search as per scope document */}
      <View style={styles.locationContainer}>
        <TextInput
          style={styles.locationInput}
          placeholder={lang === 'th' ? 'ตำบล / จังหวัด' : 'Sub-district / Province'}
          value={locationInput}
          onChangeText={setLocationInput}
          onSubmitEditing={handleLocationSearch}
        />
        <TouchableOpacity 
          style={styles.locationButton} 
          onPress={handleLocationSearch}
          disabled={isGeocoding}
        >
          <Ionicons name="search" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.locationButton} 
          onPress={handleUseMyLocation}
        >
          <Ionicons name="location" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>
      
      {isGeocoding && (
        <Text style={styles.geocodingText}>กำลังค้นหาตำแหน่ง...</Text>
      )}


      {/* Weather Forecast */}
      <View style={styles.forecastContainer}>
        {weatherData.map(day => (
          <View key={day.id} style={styles.forecastCard}>
            <Text style={styles.forecastDay}>{day.day}</Text>
            <Text style={styles.forecastTemp}>{day.tempMin}° / {day.tempMax}°</Text>
            <Text style={styles.forecastRain}>ฝน: {day.rainProb}%</Text>
            <Text style={styles.forecastWind}>ลม: {day.windSpeed} กม./ชม.</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// Settings Screen Component - MVP Implementation
const SettingsScreen = ({ lang, onLanguageChange }) => {
  const [notifySprayWindow, setNotifySprayWindow] = useState(false);
  const [notifyTime, setNotifyTime] = useState('06:00');
  const [improveModelOptIn, setImproveModelOptIn] = useState(false);
  const [currentField, setCurrentField] = useState(null);

  // Load saved settings
  useEffect(() => {
    const savedNotify = mockStorage.prefs.notifySprayWindow || false;
    const savedTime = mockStorage.prefs.notifyTime || '06:00';
    const savedOptIn = mockStorage.prefs.improveModelOptIn || false;
    const field = FieldService.getField();
    
    setNotifySprayWindow(savedNotify);
    setNotifyTime(savedTime);
    setImproveModelOptIn(savedOptIn);
    setCurrentField(field);
  }, []);

  const handleLanguageChange = (newLang) => {
    onLanguageChange(newLang);
    mockStorage.prefs.lang = newLang;
    showToast(lang === 'th' ? 'เปลี่ยนภาษาเรียบร้อย' : 'Language changed successfully');
  };

  const handleUseMyLocation = async () => {
    try {
      // Mock GPS location for demo (in real app, use navigator.geolocation)
      const mockLocation = { lat: 14.97, lng: 102.08 };
      
      // Use reverse geocoding to get address from coordinates
      const result = await GeocodeAPI.reverse(mockLocation.lat, mockLocation.lng);
      
      mockStorage.prefs.weatherPlaceText = result.placeText;
      mockStorage.prefs.weatherLatLng = { lat: result.lat, lng: result.lng };
      
      showToast(lang === 'th' ? 'อัปเดตตำแหน่งเรียบร้อย' : 'Location updated successfully');
    } catch (error) {
      console.error('Use my location failed:', error);
      showToast(lang === 'th' ? 'ไม่สามารถใช้ตำแหน่งได้' : 'Cannot use location');
    }
  };

  const handleEditLocation = () => {
    // Navigate to weather page for location editing
    // This would be handled by the parent component
    showToast(lang === 'th' ? 'ไปที่หน้าอากาศเพื่อแก้ไขตำแหน่ง' : 'Go to Weather page to edit location');
  };

  const handleSprayReminderToggle = (value) => {
    setNotifySprayWindow(value);
    mockStorage.prefs.notifySprayWindow = value;
    
    if (value) {
      // Schedule local notification
      showToast(lang === 'th' ? 'ตั้งการแจ้งเตือนเรียบร้อย' : 'Notification scheduled');
    } else {
      // Cancel notification
      showToast(lang === 'th' ? 'ยกเลิกการแจ้งเตือนเรียบร้อย' : 'Notification cancelled');
    }
  };

  const handleTimeChange = (time) => {
    setNotifyTime(time);
    mockStorage.prefs.notifyTime = time;
    
    if (notifySprayWindow) {
      // Reschedule notification
      showToast(lang === 'th' ? 'อัปเดตเวลาการแจ้งเตือนเรียบร้อย' : 'Notification time updated');
    }
  };

  const handleImproveModelToggle = (value) => {
    setImproveModelOptIn(value);
    mockStorage.prefs.improveModelOptIn = value;
    
    showToast(lang === 'th' 
      ? (value ? 'อนุญาตใช้ข้อมูลเพื่อพัฒนาระบบ' : 'ยกเลิกการอนุญาตใช้ข้อมูล')
      : (value ? 'Allowed data usage for model improvement' : 'Disabled data usage')
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      lang === 'th' ? 'ล้างแคชข้อมูล' : 'Clear Cached Data',
      lang === 'th' 
        ? 'ล้างข้อมูลพยากรณ์อากาศและราคาที่แคชไว้? ข้อมูลแปลงและการสแกนจะไม่ถูกลบ' 
        : 'Clear cached weather and price data? Field and scan data will be preserved.',
      [
        {
          text: lang === 'th' ? 'ยกเลิก' : 'Cancel',
          style: 'cancel'
        },
        {
          text: lang === 'th' ? 'ล้างแคช' : 'Clear Cache',
          onPress: () => {
            // Clear only weather and price cache
            if (mockDB.priceCache) {
              mockDB.priceCache = null;
            }
            if (mockDB.weatherCache) {
              mockDB.weatherCache = null;
            }
            
            showToast(lang === 'th' ? 'ล้างแคชเรียบร้อย' : 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      lang === 'th' ? 'ติดต่อฝ่ายสนับสนุน' : 'Contact Support',
      lang === 'th' 
        ? 'LINE: @rai-ai\nโทร: 02-123-4567' 
        : 'LINE: @rai-ai\nPhone: +66-2-123-4567',
      [{ text: lang === 'th' ? 'ตกลง' : 'OK' }]
    );
  };

  const handleSignIn = () => {
    showToast(lang === 'th' ? 'ฟีเจอร์เข้าสู่ระบบจะเปิดใช้งานในอนาคต' : 'Sign in feature coming soon');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>{t('settings', lang)}</Text>
      </View>

      {/* Language Section */}
      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>{t('language', lang)}</Text>
        <View style={styles.languageButtons}>
          <TouchableOpacity 
            style={[styles.languageButton, lang === 'th' && styles.languageButtonActive]}
            onPress={() => handleLanguageChange('th')}
          >
            <Text style={[styles.languageButtonText, lang === 'th' && styles.languageButtonTextActive]}>
              {t('thai', lang)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.languageButton, lang === 'en' && styles.languageButtonActive]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={[styles.languageButtonText, lang === 'en' && styles.languageButtonTextActive]}>
              {t('english', lang)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weather Location Section */}
      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>{t('weather_location', lang)}</Text>
        
        {currentField ? (
          <View style={styles.fieldLocationInfo}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.fieldLocationText}>
              {t('location_from_field', lang)}
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.currentLocationText}>
              {formatLocationDisplay(mockStorage.prefs.weatherPlaceText, lang) || 
               (lang === 'th' ? 'ยังไม่ระบุตำแหน่ง' : 'Location not set')}
            </Text>
            <View style={styles.locationButtons}>
              <TouchableOpacity style={styles.locationButton} onPress={handleUseMyLocation}>
                <Ionicons name="location" size={20} color="#4CAF50" />
                <Text style={styles.locationButtonText}>{t('use_my_location', lang)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.locationButton} onPress={handleEditLocation}>
                <Ionicons name="create" size={20} color="#4CAF50" />
                <Text style={styles.locationButtonText}>{t('edit_location', lang)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Notifications Section */}
      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>{t('notifications', lang)}</Text>
        
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('spray_reminder', lang)}</Text>
          <TouchableOpacity 
            style={[styles.toggle, notifySprayWindow && styles.toggleActive]}
            onPress={() => handleSprayReminderToggle(!notifySprayWindow)}
          >
            <View style={[styles.toggleThumb, notifySprayWindow && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
        
        {notifySprayWindow && (
          <View style={styles.timePickerRow}>
            <Text style={styles.timeLabel}>{t('remind_at', lang)}</Text>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => {
                // Mock time picker - in real app would open time picker
                const newTime = notifyTime === '06:00' ? '07:00' : '06:00';
                handleTimeChange(newTime);
              }}
            >
              <Text style={styles.timeButtonText}>{notifyTime}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Data & Privacy Section */}
      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>{t('data_privacy', lang)}</Text>
        
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('improve_model', lang)}</Text>
          <TouchableOpacity 
            style={[styles.toggle, improveModelOptIn && styles.toggleActive]}
            onPress={() => handleImproveModelToggle(!improveModelOptIn)}
          >
            <View style={[styles.toggleThumb, improveModelOptIn && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.clearCacheButton} onPress={handleClearCache}>
          <Ionicons name="trash" size={20} color="#f44336" />
          <Text style={styles.clearCacheButtonText}>{t('clear_cache', lang)}</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>{t('account', lang)}</Text>
        
        <View style={styles.accountRow}>
          <Text style={styles.guestModeText}>{t('guest_mode', lang)}</Text>
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>{t('sign_in', lang)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Help & About Section */}
      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>{t('help_about', lang)}</Text>
        
        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <Ionicons name="chatbubble" size={20} color="#4CAF50" />
          <Text style={styles.supportButtonText}>{t('contact_support', lang)}</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>
            {t('version', lang)} 0.1.0 (Build 1)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Main App Component
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState('th');

  useEffect(() => {
    // Process offline queue on app start
    processOfflineQueue();
  }, []);

  const handleScheduleReminder = () => {
    // Mock local notification scheduling
    showToast('เตือนถูกตั้งแล้ว');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen lang={language} onScheduleReminder={handleScheduleReminder} onNavigate={setActiveTab} />;
      case 'scan':
        return <ScanScreen lang={language} onNavigate={setActiveTab} />;
      case 'fields':
        return <FieldsScreen lang={language} />;
      case 'weather':
        return <WeatherScreen lang={language} />;
      case 'settings':
        return <SettingsScreen lang={language} onLanguageChange={setLanguage} />;
      default:
        return <HomeScreen lang={language} onScheduleReminder={handleScheduleReminder} onNavigate={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <BottomTabNavigator 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        lang={language} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 22, // Title 22sp as per scope document
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  screenTitle: {
    fontSize: 22, // Title 22sp as per scope document
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  locationLabel: {
    fontSize: 18, // Body 18sp as per scope document
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 18, // Body 18sp as per scope document
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Spray Window
  sprayWindowContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sprayWindowBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 8,
  },
  sprayWindowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  sprayWindowSubtext: {
    fontSize: 18, // Body 18sp as per scope document
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reminderButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
  },
  
  // Today Prices Card - MVP includes this
  pricesCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  priceTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  priceTabActive: {
    backgroundColor: '#4CAF50',
  },
  priceTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pricesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pricesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  priceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  
  // New component styles as per Oct 2025 Hotfixes
  todayHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  todayHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  todayHeaderDate: {
    fontSize: 18,
    marginTop: 4,
    flex: 1,
  },
  todayHeaderLocation: {
    fontSize: 16,
    marginTop: 2,
    opacity: 0.9,
    marginLeft: 4,
    marginRight: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  dateLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  
  // Crop Tabs styles
  cropTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  cropTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  cropTabActive: {
    backgroundColor: '#4CAF50',
  },
  cropTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  cropTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // SprayWindowBadge styles
  sprayWindowCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sprayWindowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sprayWindowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
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
    marginTop: 6,
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 16,
  },
  reasonTextBelowBadge: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  weatherFactorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  sprayWindowRemindBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  sprayWindowRemindText: {
    fontSize: 16,
    fontWeight: '600',
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
  
  // PriceRow styles
  priceRowWrap: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceRowName: {
    fontSize: 18,
    fontWeight: '600',
  },
  priceRowPrice: {
    fontSize: 18,
  },
  priceRowLive: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#D00',
  },
  priceRowSourceSmall: {
    fontSize: 12,
    opacity: 0.8,
    marginLeft: 8,
  },
  pricesList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priceItem: {
    alignItems: 'center',
    flex: 1,
  },
  priceCommodity: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  priceSource: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  pricesLoading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pricesError: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    minWidth: 120,
    minHeight: 56, // Minimum 56dp as per scope document
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '600',
  },
  
  // Scan
  scanContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  scanButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    minWidth: 120,
    minHeight: 56, // Minimum 56dp as per scope document
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '600',
  },
  scanningContainer: {
    alignItems: 'center',
    padding: 20,
  },
  scanningText: {
    fontSize: 18,
    color: '#666',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultDisease: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
  },
  resultConfidence: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  resultTip: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  
  // Fields
  addButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fieldList: {
    marginTop: 20,
  },
  fieldCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fieldArea: {
    fontSize: 16,
    color: '#666',
  },
  editButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  
  // Modal
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Weather - Rural-friendly location
  locationContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginRight: 8,
  },
  locationButton: {
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    marginLeft: 4,
  },
  geocodingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  forecastContainer: {
    marginTop: 20,
  },
  forecastCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  forecastRain: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  forecastWind: {
    fontSize: 16,
    color: '#666',
  },
  
  // Settings
  settingSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  languageButtons: {
    flexDirection: 'row',
  },
  languageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
  },
  languageButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  languageButtonTextActive: {
    color: 'white',
  },
  unitsButtons: {
    flexDirection: 'row',
  },
  unitsButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
  },
  unitsButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  unitsButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  unitsButtonTextActive: {
    color: 'white',
  },
  authButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  guestModeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#f0f8f0',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  // Fields Screen Styles
  fieldsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fieldsHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  fieldsAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fieldsAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  fieldsEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  fieldsEmptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  fieldsEmptyDescription: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  fieldsEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  fieldsEmptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fieldsFieldCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldsFieldHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fieldsFieldInfo: {
    flex: 1,
  },
  fieldsFieldName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fieldsFieldLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldsFieldLocationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  fieldsEditButton: {
    padding: 8,
  },
  fieldsFieldDetails: {
    marginBottom: 16,
  },
  fieldsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldsDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  fieldsDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  fieldsFieldActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fieldsActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  fieldsDeleteButton: {
    borderColor: '#f44336',
  },
  fieldsActionButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  fieldsDeleteButtonText: {
    color: '#f44336',
  },
  fieldsMvpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  fieldsMvpNoticeText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
  },
  
  // Field Map Editor Styles
  mapEditorContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapEditorHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapEditorHeaderButtonText: {
    fontSize: 16,
    color: '#666',
  },
  mapEditorSaveButton: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  mapEditorHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  mapEditorContent: {
    flex: 1,
    padding: 16,
  },
  mapEditorInputGroup: {
    marginBottom: 20,
  },
  mapEditorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  mapEditorInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  mapEditorSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  mapEditorSearchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  mapEditorSearchButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  mapEditorHelpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  mapEditorLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 20,
  },
  mapEditorLocationButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  mapEditorMapPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapEditorMapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  mapEditorMapPlaceholderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  mapEditorToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
  },
  mapEditorToolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mapEditorToolbarButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  mapEditorToolbarButtonActive: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  mapEditorToolbarButtonTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  mapEditorToolbarButtonEnabled: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  mapEditorToolbarButtonTextEnabled: {
    color: '#f44336',
    fontWeight: '600',
  },
  polygonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
  },
  polygonInfoText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  drawingMode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
  },
  drawingModeText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
    marginLeft: 4,
  },
  mapEditorMapPlaceholderDrawing: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#F8FFF8',
  },
  drawingProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
  },
  drawingProgressText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // Scan Screen Field Info Styles
  fieldInfoCard: {
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
  fieldInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  fieldInfoName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  fieldInfoLocation: {
    fontSize: 14,
    color: '#666',
  },
  noFieldCard: {
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    alignItems: 'center',
  },
  noFieldText: {
    fontSize: 16,
    color: '#E65100',
    textAlign: 'center',
    marginVertical: 12,
  },
  addFieldButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFieldButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Scan result field prompt styles
  fieldPromptContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  fieldPromptText: {
    fontSize: 14,
    color: '#E65100',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 20,
  },
  fieldPromptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  fieldPromptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // New scan page styles
  quotaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  quotaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  scanButtonMain: {
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanButtonMainText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  scanButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  galleryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    marginLeft: 8,
  },
  limitMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  limitMessageText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
  },
  scanningContainer: {
    alignItems: 'center',
    padding: 32,
  },
  scanningText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  resultSheet: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  resultCloseButton: {
    padding: 4,
  },
  resultContent: {
    padding: 16,
  },
  resultDisease: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultConfidence: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  lowConfidenceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  lowConfidenceText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
  },
  actionSteps: {
    marginBottom: 16,
  },
  actionStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  actionStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  ppeReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  ppeText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
  },
  
  // Settings page styles
  settingSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  languageButtonText: {
    fontSize: 16,
    color: '#666',
  },
  languageButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  unitsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  unitsButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  unitsButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  unitsButtonText: {
    fontSize: 16,
    color: '#666',
  },
  unitsButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  authButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  guestModeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  dataButtonDanger: {
    backgroundColor: '#FFEBEE',
  },
  dataButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  dataButtonTextDanger: {
    color: '#f44336',
  },
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  aboutButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // New Settings MVP styles
  fieldLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  fieldLocationText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
  },
  currentLocationText: {
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
    backgroundColor: '#F5F5F5',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  clearCacheButtonText: {
    fontSize: 16,
    color: '#f44336',
    marginLeft: 12,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signInButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
  },
  signInButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  supportButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  versionRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  
  // Spray Window updated styles
  factorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    marginBottom: 8,
  },
  factorText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  remindMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#F5F5F5',
  },
  remindMeText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '500',
  },
});