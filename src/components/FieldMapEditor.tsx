import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FieldMapEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (fieldData: {
    name: string;
    polygon?: string;
    lat: number;
    lng: number;
    placeText: string;
  }) => void;
  initialData?: {
    name?: string;
    polygon?: string;
    lat?: number;
    lng?: number;
    placeText?: string;
  };
  lang: 'th' | 'en';
}

export const FieldMapEditor: React.FC<FieldMapEditorProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
  lang
}) => {
  const [fieldName, setFieldName] = useState(initialData?.name || '');
  const [searchQuery, setSearchQuery] = useState(initialData?.placeText || '');
  const [lat, setLat] = useState(initialData?.lat || 14.97);
  const [lng, setLng] = useState(initialData?.lng || 102.08);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setFieldName(initialData?.name || '');
      setSearchQuery(initialData?.placeText || '');
      setLat(initialData?.lat || 14.97);
      setLng(initialData?.lng || 102.08);
    }
  }, [visible, initialData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert(
        lang === 'th' ? 'ข้อผิดพลาด' : 'Error',
        lang === 'th' ? 'กรุณาใส่ชื่อตำบล/อำเภอ/จังหวัด' : 'Please enter sub-district/district/province'
      );
      return;
    }

    setIsGeocoding(true);
    try {
      // Simulate geocoding API call
      const response = await fetch(`/api/geocode?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.lat && data.lng) {
        setLat(data.lat);
        setLng(data.lng);
        setSearchQuery(data.placeText || searchQuery);
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

  const handleUseMyLocation = () => {
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
          onPress: () => {
            // In real app, use geolocation API
            setLat(14.97);
            setLng(102.08);
            setSearchQuery(lang === 'th' ? 'เทพาลัย, นครราชสีมา' : 'Thephalai, Nakhon Ratchasima');
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

    onSave({
      name: fieldName.trim(),
      lat,
      lng,
      placeText: searchQuery.trim()
    });
  };

  const t = (key: string, fallback: string) => {
    const translations: Record<string, Record<string, string>> = {
      th: {
        field_name: 'ชื่อแปลง',
        search_location: 'ค้นหาตำแหน่ง',
        subdistrict_district_province: 'ตำบล / อำเภอ / จังหวัด',
        use_my_location: 'ใช้ตำแหน่งของฉัน',
        draw: 'วาด',
        clear: 'ล้าง',
        save: 'บันทึก',
        cancel: 'ยกเลิก',
        field_name_placeholder: 'เช่น แปลงข้าว 1',
        search_placeholder: 'เช่น เทพาลัย, นครราชสีมา'
      },
      en: {
        field_name: 'Field Name',
        search_location: 'Search Location',
        subdistrict_district_province: 'Sub-district / District / Province',
        use_my_location: 'Use My Location',
        draw: 'Draw',
        clear: 'Clear',
        save: 'Save',
        cancel: 'Cancel',
        field_name_placeholder: 'e.g., Rice Field 1',
        search_placeholder: 'e.g., Thephalai, Nakhon Ratchasima'
      }
    };
    return translations[lang]?.[key] || fallback;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{t('cancel', 'Cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {initialData ? t('edit_field', 'Edit Field') : t('add_field', 'Add Field')}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, styles.saveButton]}>
              {t('save', 'Save')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Field Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('field_name', 'Field Name')}</Text>
            <TextInput
              style={styles.input}
              value={fieldName}
              onChangeText={setFieldName}
              placeholder={t('field_name_placeholder', 'e.g., Rice Field 1')}
              placeholderTextColor="#999"
            />
          </View>

          {/* Location Search */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('search_location', 'Search Location')}</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('search_placeholder', 'e.g., Thephalai, Nakhon Ratchasima')}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.searchButton}
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
            <Text style={styles.helpText}>
              {t('subdistrict_district_province', 'Sub-district / District / Province')}
            </Text>
          </View>

          {/* Use My Location */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleUseMyLocation}
          >
            <Ionicons name="location" size={20} color="#4CAF50" />
            <Text style={styles.locationButtonText}>
              {t('use_my_location', 'Use My Location')}
            </Text>
          </TouchableOpacity>

          {/* Map Placeholder */}
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color="#ccc" />
            <Text style={styles.mapPlaceholderText}>
              {lang === 'th' ? 'แผนที่ (รุ่นทดลอง)' : 'Map (Demo Version)'}
            </Text>
            <Text style={styles.mapPlaceholderSubtext}>
              {lang === 'th' 
                ? 'ตำแหน่ง: ' + lat.toFixed(4) + ', ' + lng.toFixed(4)
                : 'Location: ' + lat.toFixed(4) + ', ' + lng.toFixed(4)
              }
            </Text>
          </View>

          {/* Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolbarButton}>
              <Ionicons name="create-outline" size={20} color="#666" />
              <Text style={styles.toolbarButtonText}>{t('draw', 'Draw')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton}>
              <Ionicons name="trash-outline" size={20} color="#666" />
              <Text style={styles.toolbarButtonText}>{t('clear', 'Clear')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  locationButton: {
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
  locationButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  mapPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toolbarButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
});
