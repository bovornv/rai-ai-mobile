import { create } from 'zustand';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  
  // Computed
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: Notification['type']) => Notification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(notif => ({ ...notif, read: true })),
    unreadCount: 0,
  })),
  
  deleteNotification: (id) => set((state) => {
    const notification = state.notifications.find(n => n.id === id);
    return {
      notifications: state.notifications.filter(notif => notif.id !== id),
      unreadCount: notification?.read ? state.unreadCount : Math.max(0, state.unreadCount - 1),
    };
  }),
  
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
  
  getUnreadNotifications: () => get().notifications.filter(notif => !notif.read),
  getNotificationsByType: (type) => get().notifications.filter(notif => notif.type === type),
}));
