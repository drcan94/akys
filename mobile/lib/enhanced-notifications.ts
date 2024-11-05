import messaging from '@react-native-firebase/messaging';
import PushNotification, { Importance } from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { enhancedApi } from './enhanced-api';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const NOTIFICATION_QUEUE_KEY = '@notification_queue';
const FCM_TOKEN_KEY = '@fcm_token';

interface NotificationSettings {
  operationNotes: boolean;
  messages: boolean;
  patientUpdates: boolean;
  mentions: boolean;
  reactions: boolean;
  emergencyAlerts: boolean;
  sound: boolean;
  vibration: boolean;
}

interface QueuedNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
  shown: boolean;
}

class EnhancedNotificationManager {
  private static instance: EnhancedNotificationManager;
  private initialized: boolean = false;
  private maxStoredNotifications: number = 100;

  private constructor() {}

  static getInstance(): EnhancedNotificationManager {
    if (!EnhancedNotificationManager.instance) {
      EnhancedNotificationManager.instance = new EnhancedNotificationManager();
    }
    return EnhancedNotificationManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Configure local notifications
    PushNotification.configure({
      onNotification: this.handleNotification.bind(this),
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      this.createNotificationChannels();
    }

    this.initialized = true;
  }

  private createNotificationChannels(): void {
    PushNotification.createChannel(
      {
        channelId: 'emergency_channel',
        channelName: 'Emergency Notifications',
        channelDescription: 'Urgent notifications for critical updates',
        importance: Importance.HIGH,
        vibrate: true,
        playSound: true,
        soundName: 'default',
      },
      () => {}
    );

    PushNotification.createChannel(
      {
        channelId: 'default_channel',
        channelName: 'Default Notifications',
        channelDescription: 'Regular app notifications',
        importance: Importance.DEFAULT,
        vibrate: true,
        playSound: true,
        soundName: 'default',
      },
      () => {}
    );
  }

  private async handleNotification(notification: any): Promise<void> {
    // Store notification in queue
    await this.queueNotification({
      id: notification.id || String(Date.now()),
      title: notification.title,
      body: notification.message,
      data: notification.data,
      timestamp: Date.now(),
      shown: true,
    });

    // Update badge count for iOS
    if (Platform.OS === 'ios') {
      const count = await this.getUnreadCount();
      PushNotification.setApplicationIconBadgeNumber(count);
    }
  }

  async requestPermission(): Promise<string | null> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        throw new Error('Permission denied');
      }

      const token = await this.getToken();
      if (token) {
        await this.saveToken(token);
      }

      return token;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  private async getToken(): Promise<string> {
    let token = await messaging().getToken();
    let retryCount = 0;
    const maxRetries = 3;

    while (!token && retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      token = await messaging().getToken();
      retryCount++;
    }

    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    return token;
  }

  private async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      await enhancedApi.post('/api/users/device-token', {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async loadSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return settings ? JSON.parse(settings) : this.getDefaultSettings();
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      operationNotes: true,
      messages: true,
      patientUpdates: true,
      mentions: true,
      reactions: true,
      emergencyAlerts: true,
      sound: true,
      vibration: true,
    };
  }

  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
      throw error;
    }
  }

  private async queueNotification(notification: QueuedNotification): Promise<void> {
    try {
      const queue = await this.getNotificationQueue();
      queue.unshift(notification);

      // Limit queue size
      if (queue.length > this.maxStoredNotifications) {
        queue.splice(this.maxStoredNotifications);
      }

      await AsyncStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error queuing notification:', error);
    }
  }

  private async getNotificationQueue(): Promise<QueuedNotification[]> {
    try {
      const queue = await AsyncStorage.getItem(NOTIFICATION_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting notification queue:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const queue = await this.getNotificationQueue();
      return queue.filter(n => !n.shown).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const queue = await this.getNotificationQueue();
      const updatedQueue = queue.map(n => ({ ...n, shown: true }));
      await AsyncStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(updatedQueue));

      if (Platform.OS === 'ios') {
        PushNotification.setApplicationIconBadgeNumber(0);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NOTIFICATION_QUEUE_KEY);
      PushNotification.cancelAllLocalNotifications();
      
      if (Platform.OS === 'ios') {
        PushNotification.setApplicationIconBadgeNumber(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

export const enhancedNotifications = EnhancedNotificationManager.getInstance();