import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LargeTitle, Body, SmallText } from '../../ui/Typography';
import LargeButton from '../../ui/LargeButton';
import Card from '../../components/Card';
import Input from '../../components/Input';

interface FieldsScreenProps {
  navigation: any;
}

interface Field {
  id: string;
  name: string;
  area: number;
  cropType: string;
  plantingDate: string;
  harvestDate: string;
  status: 'active' | 'inactive' | 'harvested';
  health: 'good' | 'warning' | 'critical';
  location: string;
}

export default function FieldsScreen({ navigation }: FieldsScreenProps) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    area: '',
    cropType: '',
    plantingDate: '',
    harvestDate: '',
  });

  // Mock field data
  const mockFields: Field[] = [
    {
      id: '1',
      name: 'แปลงข้าว 1',
      area: 2.5,
      cropType: t('rice'),
      plantingDate: '2024-01-01',
      harvestDate: '2024-04-01',
      status: 'active',
      health: 'good',
      location: 'ภาคกลาง',
    },
    {
      id: '2',
      name: 'แปลงทุเรียน 1',
      area: 1.0,
      cropType: t('durian'),
      plantingDate: '2023-06-01',
      harvestDate: '2024-08-01',
      status: 'active',
      health: 'warning',
      location: 'ภาคใต้',
    },
    {
      id: '3',
      name: 'แปลงข้าวโพด 1',
      area: 3.0,
      cropType: t('corn'),
      plantingDate: '2023-12-01',
      harvestDate: '2024-03-01',
      status: 'harvested',
      health: 'good',
      location: 'ภาคเหนือ',
    },
  ];

  const cropTypes = [
    { id: 'rice', name: t('rice') },
    { id: 'durian', name: t('durian') },
    { id: 'corn', name: t('corn') },
    { id: 'sugarcane', name: t('sugarcane') },
    { id: 'cassava', name: t('cassava') },
    { id: 'rubber', name: t('rubber') },
    { id: 'palm_oil', name: t('palm_oil') },
  ];

  const loadFields = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFields(mockFields);
    } catch (error) {
      console.error('Fields loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const handleAddField = () => {
    if (!newField.name || !newField.area || !newField.cropType) {
      Alert.alert(t('error'), t('please_fill_all_fields'));
      return;
    }

    const field: Field = {
      id: Date.now().toString(),
      name: newField.name,
      area: parseFloat(newField.area),
      cropType: newField.cropType,
      plantingDate: newField.plantingDate,
      harvestDate: newField.harvestDate,
      status: 'active',
      health: 'good',
      location: 'ภาคกลาง',
    };

    setFields([...fields, field]);
    setNewField({
      name: '',
      area: '',
      cropType: '',
      plantingDate: '',
      harvestDate: '',
    });
    setShowAddForm(false);
    Alert.alert(t('success'), 'เพิ่มแปลงเรียบร้อยแล้ว');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#FF9800';
      case 'harvested': return '#9E9E9E';
      default: return '#666666';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#666666';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'good': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'critical': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'ใช้งาน';
      case 'inactive': return 'ไม่ใช้งาน';
      case 'harvested': return 'เก็บเกี่ยวแล้ว';
      default: return 'ไม่ทราบ';
    }
  };

  const getHealthText = (health: string) => {
    switch (health) {
      case 'good': return 'ดี';
      case 'warning': return 'เตือน';
      case 'critical': return 'วิกฤต';
      default: return 'ไม่ทราบ';
    }
  };

  const calculateDaysToHarvest = (harvestDate: string) => {
    const today = new Date();
    const harvest = new Date(harvestDate);
    const diffTime = harvest.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="leaf" size={48} color="#4CAF50" />
          <Body style={styles.loadingText}>{t('loading')}</Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <LargeTitle style={styles.title}>{t('fields')}</LargeTitle>
          <Body style={styles.subtitle}>{t('field_management')}</Body>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Body style={styles.statValue}>{fields.length}</Body>
            <SmallText style={styles.statLabel}>{t('total_fields')}</SmallText>
          </View>
          <View style={styles.statItem}>
            <Body style={styles.statValue}>
              {fields.filter(f => f.status === 'active').length}
            </Body>
            <SmallText style={styles.statLabel}>{t('active_fields')}</SmallText>
          </View>
          <View style={styles.statItem}>
            <Body style={styles.statValue}>
              {fields.reduce((sum, f) => sum + f.area, 0).toFixed(1)}
            </Body>
            <SmallText style={styles.statLabel}>ไร่</SmallText>
          </View>
        </View>

        {/* Add Field Button */}
        <LargeButton
          label={t('add_field')}
          onPress={() => setShowAddForm(true)}
          style={styles.addButton}
          variant="primary"
        />

        {/* Add Field Form */}
        {showAddForm && (
          <Card style={styles.formCard}>
            <Body style={styles.formTitle}>เพิ่มแปลงใหม่</Body>
            
            <Input
              label={t('field_name')}
              value={newField.name}
              onChangeText={(text) => setNewField({ ...newField, name: text })}
              placeholder="ชื่อแปลง"
            />
            
            <Input
              label={t('field_area')}
              value={newField.area}
              onChangeText={(text) => setNewField({ ...newField, area: text })}
              placeholder="พื้นที่ (ไร่)"
              keyboardType="numeric"
            />
            
            <View style={styles.cropTypeContainer}>
              <Body style={styles.cropTypeLabel}>{t('crop_type')}</Body>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {cropTypes.map((crop) => (
                  <TouchableOpacity
                    key={crop.id}
                    style={[
                      styles.cropTypeButton,
                      newField.cropType === crop.name && styles.cropTypeButtonActive
                    ]}
                    onPress={() => setNewField({ ...newField, cropType: crop.name })}
                  >
                    <SmallText style={[
                      styles.cropTypeButtonText,
                      newField.cropType === crop.name && styles.cropTypeButtonTextActive
                    ]}>
                      {crop.name}
                    </SmallText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <Input
              label={t('planting_date')}
              value={newField.plantingDate}
              onChangeText={(text) => setNewField({ ...newField, plantingDate: text })}
              placeholder="YYYY-MM-DD"
            />
            
            <Input
              label={t('harvest_date')}
              value={newField.harvestDate}
              onChangeText={(text) => setNewField({ ...newField, harvestDate: text })}
              placeholder="YYYY-MM-DD"
            />
            
            <View style={styles.formButtons}>
              <LargeButton
                label={t('save')}
                onPress={handleAddField}
                style={styles.saveButton}
                variant="primary"
              />
              <LargeButton
                label={t('cancel')}
                onPress={() => setShowAddForm(false)}
                style={styles.cancelButton}
                variant="outline"
              />
            </View>
          </Card>
        )}

        {/* Fields List */}
        {fields.map((field) => (
          <Card key={field.id} style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldInfo}>
                <Body style={styles.fieldName}>{field.name}</Body>
                <SmallText style={styles.fieldLocation}>{field.location}</SmallText>
              </View>
              <View style={styles.fieldStatus}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(field.status) }
                ]}>
                  <SmallText style={styles.statusText}>
                    {getStatusText(field.status)}
                  </SmallText>
                </View>
              </View>
            </View>
            
            <View style={styles.fieldDetails}>
              <View style={styles.fieldDetail}>
                <Ionicons name="leaf" size={16} color="#4CAF50" />
                <SmallText style={styles.fieldDetailText}>
                  {field.cropType}
                </SmallText>
              </View>
              <View style={styles.fieldDetail}>
                <Ionicons name="resize" size={16} color="#2196F3" />
                <SmallText style={styles.fieldDetailText}>
                  {field.area} ไร่
                </SmallText>
              </View>
              <View style={styles.fieldDetail}>
                <Ionicons name="calendar" size={16} color="#FF9800" />
                <SmallText style={styles.fieldDetailText}>
                  ปลูก: {field.plantingDate}
                </SmallText>
              </View>
            </View>
            
            <View style={styles.fieldFooter}>
              <View style={styles.healthIndicator}>
                <Ionicons 
                  name={getHealthIcon(field.health) as any} 
                  size={16} 
                  color={getHealthColor(field.health)} 
                />
                <SmallText style={[
                  styles.healthText,
                  { color: getHealthColor(field.health) }
                ]}>
                  {getHealthText(field.health)}
                </SmallText>
              </View>
              
              {field.status === 'active' && (
                <SmallText style={styles.harvestCountdown}>
                  เก็บเกี่ยวใน {calculateDaysToHarvest(field.harvestDate)} วัน
                </SmallText>
              )}
            </View>
          </Card>
        ))}

        {/* Map Placeholder */}
        <Card style={styles.mapCard}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color="#CCCCCC" />
            <Body style={styles.mapText}>แผนที่แปลง</Body>
            <SmallText style={styles.mapSubtext}>
              ฟีเจอร์แผนที่และตัวแก้ไขรูปหลายเหลี่ยมจะมาในอนาคต
            </SmallText>
          </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666666',
    textAlign: 'center',
  },
  addButton: {
    marginBottom: 20,
  },
  formCard: {
    marginBottom: 20,
  },
  formTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  cropTypeContainer: {
    marginBottom: 16,
  },
  cropTypeLabel: {
    color: '#333333',
    fontSize: 16,
    marginBottom: 8,
  },
  cropTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cropTypeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  cropTypeButtonText: {
    color: '#666666',
    fontSize: 14,
  },
  cropTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  fieldCard: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldLocation: {
    color: '#666666',
  },
  fieldStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fieldDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldDetailText: {
    color: '#666666',
    fontSize: 12,
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  harvestCountdown: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
  },
  mapCard: {
    marginBottom: 32,
  },
  mapPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  mapText: {
    color: '#666666',
    marginTop: 12,
    marginBottom: 4,
  },
  mapSubtext: {
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
