"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { api } from '../lib/api';

interface PushNotificationContextType {
  isEnabled: boolean;
  isPending: boolean;
  token: string | null;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
}

export const PushNotificationContext = createContext<PushNotificationContextType>({
  isEnabled: false,
  isPending: true,
  token: null,
  enableNotifications: async () => {},
  disableNotifications: async () => {},
});

export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  const setupPushNotifications = useCallback(async () => {
    try {
      // Request permission (required for iOS)
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        setIsPending(false);
        return;
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();
      setToken(fcmToken);

      // Register token with backend
      if (user?.id) {
        await api.post('/api/users/device-token', {
          token: fcmToken,
          platform: 'mobile',
        });
      }

      // Configure local notifications
      PushNotification.configure({
        onNotification: function (notification) {
          console.log('LOCAL NOTIFICATION:', notification);
        },
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        popInitialNotification: true,
        requestPermissions: true,
      });

      setIsPending(false);
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      setIsPending(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      setupPushNotifications();
    }
  }, [user?.id, setupPushNotifications]);

  useEffect(() => {
    // Handle FCM messages when app is in foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Received foreground message:', remoteMessage);

      // Show local notification
      PushNotification.localNotification({
        title: remoteMessage.notification?.title,
        message: remoteMessage.notification?.body || '',
        playSound: true,
        soundName: 'default',
      });
    });

    return unsubscribe;
  }, []);

  const enableNotifications = async () => {
    try {
      await setupPushNotifications();
      showToast({
        type: 'success',
        message: 'Bildirimler başarıyla etkinleştirildi',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Bildirimler etkinleştirilemedi',
      });
    }
  };

  const disableNotifications = async () => {
    try {
      if (token && user?.id) {
        await api.delete('/api/users/device-token', {
          data: { token },
        });
        setToken(null);
        showToast({
          type: 'success',
          message: 'Bildirimler devre dışı bırakıldı',
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Bildirimler devre dışı bırakılamadı',
      });
    }
  };

  return (
    <PushNotificationContext.Provider
      value={{
        isEnabled: !!token,
        isPending,
        token,
        enableNotifications,
        disableNotifications,
      }}>
      {children}
    </PushNotificationContext.Provider>
  );
}