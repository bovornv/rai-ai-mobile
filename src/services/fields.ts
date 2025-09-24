import { Field, fieldStore } from '../store/field';

// Field service for API integration
export class FieldService {
  // Create or update field with geocoding
  static async createOrUpdateField({
    name,
    polygon,
    lat,
    lng,
    placeText
  }: {
    name: string;
    polygon?: string;
    lat: number;
    lng: number;
    placeText: string;
  }): Promise<Field> {
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
        placeText: placeText.trim()
      };

      // Save to store
      const field = await fieldStore.createOrUpdateField(fieldData);
      
      // Mark as synced (in real app, this would sync to server)
      fieldStore.markSynced();
      
      return field;
    } catch (error) {
      console.error('Failed to create/update field:', error);
      throw error;
    }
  }

  // Get current field
  static getField(): Field | null {
    return fieldStore.getField();
  }

  // Delete field (for dev/QA)
  static async deleteField(): Promise<void> {
    try {
      await fieldStore.deleteField();
    } catch (error) {
      console.error('Failed to delete field:', error);
      throw error;
    }
  }

  // Check if field exists
  static hasField(): boolean {
    return fieldStore.hasField();
  }

  // Get field location for weather
  static getFieldLocation(): { lat: number; lng: number } | null {
    return fieldStore.getFieldLocation();
  }

  // Get field place text
  static getFieldPlaceText(): string | null {
    return fieldStore.getFieldPlaceText();
  }

  // Subscribe to field changes
  static subscribe(listener: () => void) {
    return fieldStore.subscribe(listener);
  }
}
