import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useNotificationStore } from '../stores/useNotificationStore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationConfig {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  badge?: number;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
}

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('farming-alerts', {
          name: 'Farming Alerts',
          description: 'Important farming notifications and alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('irrigation-reminders', {
          name: 'Irrigation Reminders',
          description: 'Reminders for irrigation schedules',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
        });

        await Notifications.setNotificationChannelAsync('weather-updates', {
          name: 'Weather Updates',
          description: 'Weather condition updates and forecasts',
          importance: Notifications.AndroidImportance.DEFAULT,
        });

        await Notifications.setNotificationChannelAsync('disease-alerts', {
          name: 'Disease Alerts',
          description: 'Crop disease detection and treatment alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async scheduleNotification(
    config: NotificationConfig,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const isReady = await this.initialize();
      if (!isReady) return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data || {},
          sound: config.sound !== false,
          badge: config.badge,
          priority: config.priority || 'default',
        },
        trigger: trigger || null,
      });

      // Add to store
      const store = useNotificationStore.getState();
      store.addNotification({
        title: config.title,
        message: config.body,
        type: 'info',
        actionUrl: config.data?.actionUrl,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  async scheduleIrrigationReminder(
    fieldName: string,
    scheduledTime: Date
  ): Promise<string | null> {
    return this.scheduleNotification(
      {
        title: 'Irrigation Reminder',
        body: `Time to irrigate ${fieldName}`,
        data: { type: 'irrigation', fieldName },
        priority: 'high',
      },
      { date: scheduledTime }
    );
  }

  async scheduleWeatherAlert(
    condition: string,
    severity: 'low' | 'medium' | 'high'
  ): Promise<string | null> {
    const priority = severity === 'high' ? 'max' : severity === 'medium' ? 'high' : 'default';
    
    return this.scheduleNotification(
      {
        title: 'Weather Alert',
        body: `Weather condition: ${condition}`,
        data: { type: 'weather', condition, severity },
        priority,
      }
    );
  }

  async scheduleDiseaseAlert(
    cropName: string,
    diseaseName: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<string | null> {
    const priority = severity === 'critical' ? 'max' : severity === 'high' ? 'high' : 'default';
    
    return this.scheduleNotification(
      {
        title: 'Disease Detected',
        body: `${diseaseName} detected in ${cropName}`,
        data: { type: 'disease', cropName, diseaseName, severity },
        priority,
      }
    );
  }

  async scheduleHarvestReminder(
    cropName: string,
    fieldName: string,
    scheduledTime: Date
  ): Promise<string | null> {
    return this.scheduleNotification(
      {
        title: 'Harvest Ready',
        body: `${cropName} in ${fieldName} is ready for harvest`,
        data: { type: 'harvest', cropName, fieldName },
        priority: 'high',
      },
      { date: scheduledTime }
    );
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Handle notification received while app is in foreground
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // You can add custom handling here
      }
    );

    // Handle notification tapped
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        // Handle navigation based on notification data
        if (data?.actionUrl) {
          // Navigate to specific screen
          console.log('Navigate to:', data.actionUrl);
        }
      }
    );

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }
}

export const notificationService = new NotificationService();
