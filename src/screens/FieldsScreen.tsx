import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FieldMapEditor } from '../components/FieldMapEditor';
import { FieldService } from '../services/fields';
import { Field } from '../store/field';

interface FieldsScreenProps {
  lang: 'th' | 'en';
  onNavigate?: (screen: string) => void;
}

export const FieldsScreen: React.FC<FieldsScreenProps> = ({ lang, onNavigate }) => {
  const [field, setField] = useState<Field | null>(null);
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

  const handleSaveField = async (fieldData: {
    name: string;
    polygon?: string;
    lat: number;
    lng: number;
    placeText: string;
  }) => {
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

  const t = (key: string, fallback: string) => {
    const translations: Record<string, Record<string, string>> = {
      th: {
        fields: 'แปลง',
        add_field: 'เพิ่มแปลง',
        edit_field: 'แก้ไขแปลง',
        no_field: 'ยังไม่มีแปลง',
        no_field_desc: 'เพิ่มแปลงเพื่อเริ่มต้นใช้งาน',
        field_name: 'ชื่อแปลง',
        location: 'ตำแหน่ง',
        edit: 'แก้ไข',
        delete: 'ลบ',
        mvp_limit: 'รุ่นทดลองเพิ่มได้ 1 แปลง',
        mvp_limit_desc: 'รุ่นทดลองจำกัดการเพิ่มแปลงไว้ที่ 1 แปลงเท่านั้น'
      },
      en: {
        fields: 'Fields',
        add_field: 'Add Field',
        edit_field: 'Edit Field',
        no_field: 'No Field Yet',
        no_field_desc: 'Add a field to get started',
        field_name: 'Field Name',
        location: 'Location',
        edit: 'Edit',
        delete: 'Delete',
        mvp_limit: 'MVP allows 1 field',
        mvp_limit_desc: 'MVP version is limited to 1 field only'
      }
    };
    return translations[lang]?.[key] || fallback;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('fields', 'Fields')}</Text>
        {!field && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddField}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>
              {t('add_field', 'Add Field')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {!field ? (
        // Empty State
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {t('no_field', 'No Field Yet')}
          </Text>
          <Text style={styles.emptyDescription}>
            {t('no_field_desc', 'Add a field to get started')}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleAddField}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.emptyButtonText}>
              {t('add_field', 'Add Field')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Field Card
        <View style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldName}>{field.name}</Text>
              <View style={styles.fieldLocation}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.fieldLocationText}>{field.placeText}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditField}
            >
              <Ionicons name="create-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {lang === 'th' ? 'พิกัด' : 'Coordinates'}
              </Text>
              <Text style={styles.detailValue}>
                {field.lat.toFixed(4)}, {field.lng.toFixed(4)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {lang === 'th' ? 'อัปเดตล่าสุด' : 'Last Updated'}
              </Text>
              <Text style={styles.detailValue}>
                {new Date(field.updatedAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
              </Text>
            </View>
          </View>

          <View style={styles.fieldActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditField}
            >
              <Ionicons name="create-outline" size={16} color="#4CAF50" />
              <Text style={styles.actionButtonText}>
                {t('edit', 'Edit')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteField}
            >
              <Ionicons name="trash-outline" size={16} color="#f44336" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                {t('delete', 'Delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MVP Limit Notice */}
      {field && (
        <View style={styles.mvpNotice}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.mvpNoticeText}>
            {t('mvp_limit', 'MVP allows 1 field')}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fieldCard: {
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
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fieldLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLocationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
  },
  fieldDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButtonText: {
    color: '#f44336',
  },
  mvpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  mvpNoticeText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
  },
});
