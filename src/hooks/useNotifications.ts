import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useNotificationStore } from '../stores/useNotificationStore';
import { NotificationConfig } from '../services/notificationService';

export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();

  const initialize = useCallback(async () => {
    try {
      const success = await notificationService.initialize();
      setIsInitialized(success);
      setPermissionGranted(success);
      return success;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setIsInitialized(false);
      setPermissionGranted(false);
      return false;
    }
  }, []);

  const scheduleNotification = useCallback(async (
    config: NotificationConfig,
    trigger?: any
  ) => {
    if (!isInitialized) {
      await initialize();
    }

    try {
      const notificationId = await notificationService.scheduleNotification(config, trigger);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }, [isInitialized, initialize]);

  const scheduleIrrigationReminder = useCallback(async (
    fieldName: string,
    scheduledTime: Date
  ) => {
    try {
      const notificationId = await notificationService.scheduleIrrigationReminder(
        fieldName,
        scheduledTime
      );
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule irrigation reminder:', error);
      return null;
    }
  }, []);

  const scheduleWeatherAlert = useCallback(async (
    condition: string,
    severity: 'low' | 'medium' | 'high'
  ) => {
    try {
      const notificationId = await notificationService.scheduleWeatherAlert(
        condition,
        severity
      );
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule weather alert:', error);
      return null;
    }
  }, []);

  const scheduleDiseaseAlert = useCallback(async (
    cropName: string,
    diseaseName: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    try {
      const notificationId = await notificationService.scheduleDiseaseAlert(
        cropName,
        diseaseName,
        severity
      );
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule disease alert:', error);
      return null;
    }
  }, []);

  const scheduleHarvestReminder = useCallback(async (
    cropName: string,
    fieldName: string,
    scheduledTime: Date
  ) => {
    try {
      const notificationId = await notificationService.scheduleHarvestReminder(
        cropName,
        fieldName,
        scheduledTime
      );
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule harvest reminder:', error);
      return null;
    }
  }, []);

  const cancelNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.cancelNotification(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    try {
      await notificationService.cancelAllNotifications();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }, []);

  const getScheduledNotifications = useCallback(async () => {
    try {
      return await notificationService.getScheduledNotifications();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }, []);

  const setupNotificationListeners = useCallback(() => {
    return notificationService.setupNotificationListeners();
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized) {
      const cleanup = setupNotificationListeners();
      return cleanup;
    }
  }, [isInitialized, setupNotificationListeners]);

  return {
    isInitialized,
    permissionGranted,
    notifications,
    unreadCount,
    scheduleNotification,
    scheduleIrrigationReminder,
    scheduleWeatherAlert,
    scheduleDiseaseAlert,
    scheduleHarvestReminder,
    cancelNotification,
    cancelAllNotifications,
    getScheduledNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
};

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState({
    irrigation: true,
    weather: true,
    disease: true,
    harvest: true,
  });

  const updateSetting = useCallback((key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({
      irrigation: true,
      weather: true,
      disease: true,
      harvest: true,
    });
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
};
