import messaging from '@react-native-firebase/messaging';
import PushNotification, { Importance } from 'react-native-push-notification';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from './api';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds

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

const defaultSettings: NotificationSettings = {
  operationNotes: true,
  messages: true,
  patientUpdates: true,
  mentions: true,
  reactions: true,
  emergencyAlerts: true,
  sound: true,
  vibration: true,
};

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : defaultSettings;
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return defaultSettings;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
    throw error;
  }
}

export async function requestNotificationPermission() {
  try {
    // Check if permission is already granted
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      throw new Error('Permission denied');
    }

    // Get FCM token with retry mechanism
    const token = await getTokenWithRetry();
    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    // Register token with backend
    await registerTokenWithBackend(token);

    return token;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
}

async function getTokenWithRetry(attempts = 0): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    if (attempts < MAX_RETRY_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return getTokenWithRetry(attempts + 1);
    }
    return null;
  }
}

async function registerTokenWithBackend(token: string) {
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected) {
    // Queue token registration for when network is available
    await AsyncStorage.setItem('pending_token_registration', token);
    return;
  }

  try {
    await api.post('/api/users/device-token', {
      token,
      platform: Platform.OS,
      deviceInfo: {
        os: Platform.OS,
        version: Platform.Version,
        manufacturer: Platform.select({ android: 'Android', ios: 'Apple' }),
      },
    });
    await AsyncStorage.removeItem('pending_token_registration');
  } catch (error) {
    console.error('Error registering token with backend:', error);
    await AsyncStorage.setItem('pending_token_registration', token);
  }
}

export function configurePushNotifications() {
  PushNotification.configure({
    onRegister: function (token) {
      console.log('TOKEN:', token);
    },
    onNotification: async function (notification) {
      // Handle notification when app is in foreground
      console.log('NOTIFICATION:', notification);

      // Update badge count
      if (Platform.OS === 'ios') {
        const count = await AsyncStorage.getItem('notification_badge_count');
        const newCount = (parseInt(count || '0', 10) + 1).toString();
        await AsyncStorage.setItem('notification_badge_count', newCount);
        PushNotification.setApplicationIconBadgeNumber(parseInt(newCount, 10));
      }

      // Required on iOS only
      notification.finish(PushNotification.FetchResult.NoData);
    },
    onRegistrationError: function(error: Error) {
      console.error('Registration error:', error.message);
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: true,
  });

  // Create default channels for Android
  if (Platform.OS === 'android') {
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
      (created) => console.log(`Emergency channel created: ${created}`)
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
      (created) => console.log(`Default channel created: ${created}`)
    );
  }
}

export function onMessageReceived(callback: (message: any) => void) {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('Received foreground message:', remoteMessage);

    const settings = await loadNotificationSettings();
    const notificationType = remoteMessage.data?.type;

    // Check if this type of notification is enabled
    if (!shouldShowNotification(notificationType, settings)) {
      return;
    }

    // Show local notification
    PushNotification.localNotification({
      channelId: remoteMessage.data?.emergency ? 'emergency_channel' : 'default_channel',
      title: remoteMessage.notification?.title,
      message: remoteMessage.notification?.body || '',
      playSound: settings.sound,
      vibrate: settings.vibration,
      priority: remoteMessage.data?.emergency ? 'high' : 'default',
      smallIcon: 'ic_notification',
      largeIcon: '',
      data: remoteMessage.data,
    });

    callback(remoteMessage);
  });
}

function shouldShowNotification(type: string | undefined, settings: NotificationSettings): boolean {
  switch (type) {
    case 'OPERATION_NOTE':
      return settings.operationNotes;
    case 'MESSAGE':
      return settings.messages;
    case 'PATIENT_UPDATE':
      return settings.patientUpdates;
    case 'MENTION':
      return settings.mentions;
    case 'REACTION':
      return settings.reactions;
    case 'EMERGENCY':
      return settings.emergencyAlerts;
    default:
      return true;
  }
}

export function onTokenRefresh(callback: (token: string) => void) {
  return messaging().onTokenRefresh(async (token) => {
    try {
      await registerTokenWithBackend(token);
      callback(token);
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  });
}

export async function clearNotifications() {
  PushNotification.cancelAllLocalNotifications();
  if (Platform.OS === 'ios') {
    await AsyncStorage.setItem('notification_badge_count', '0');
    PushNotification.setApplicationIconBadgeNumber(0);
  }
}

// Network state monitoring for token registration
NetInfo.addEventListener(async (state) => {
  if (state.isConnected) {
    const pendingToken = await AsyncStorage.getItem('pending_token_registration');
    if (pendingToken) {
      await registerTokenWithBackend(pendingToken);
    }
  }
});