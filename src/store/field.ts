// Field store for MVP - Single field limit
export interface Field {
  id: string;
  name: string;
  polygon?: string; // JSON string of polygon coordinates
  lat: number;
  lng: number;
  placeText: string; // ตำบล, จังหวัด format
  updatedAt: number;
  dirty: number; // 0 = synced, 1 = needs sync
}

// Mock SQLite implementation for MVP
class FieldStore {
  private db: Field | null = null;
  private listeners: (() => void)[] = [];

  // Subscribe to field changes
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify listeners of changes
  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Get current field (only one allowed in MVP)
  getField(): Field | null {
    return this.db;
  }

  // Create or update field (MVP allows only 1)
  async createOrUpdateField(fieldData: Omit<Field, 'id' | 'updatedAt' | 'dirty'>): Promise<Field> {
    // Check if field already exists
    if (this.db) {
      // Update existing field
      const updatedField: Field = {
        ...this.db,
        ...fieldData,
        updatedAt: Date.now(),
        dirty: 1
      };
      this.db = updatedField;
    } else {
      // Create new field
      const newField: Field = {
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
  async deleteField(): Promise<void> {
    this.db = null;
    this.notify();
  }

  // Check if field exists
  hasField(): boolean {
    return this.db !== null;
  }

  // Get field location for weather
  getFieldLocation(): { lat: number; lng: number } | null {
    if (!this.db) return null;
    return { lat: this.db.lat, lng: this.db.lng };
  }

  // Get field place text
  getFieldPlaceText(): string | null {
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

export const fieldStore = new FieldStore();
