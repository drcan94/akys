"use client";

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  requestNotificationPermission,
  configurePushNotifications,
  onMessageReceived,
  onTokenRefresh,
  clearNotifications,
} from '../lib/notifications';
import { useToast } from './use-toast';
import { api } from '../lib/api';

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPending, setIsPending] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const setup = async () => {
      try {
        configurePushNotifications();
        
        // Check if notifications are already enabled
        if (Platform.OS === 'ios') {
          const permission = await messaging().hasPermission();
          setIsEnabled(permission > 0);
        } else {
          setIsEnabled(true); // Android permissions are granted at install time
        }

        const token = await requestNotificationPermission();
        if (token) {
          setToken(token);
          setIsEnabled(true);
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
        setIsEnabled(false);
      } finally {
        setIsPending(false);
      }
    };

    setup();
  }, []);

  useEffect(() => {
    const unsubscribeMessage = onMessageReceived((message) => {
      // Handle incoming messages
      console.log('Received message:', message);
    });

    const unsubscribeToken = onTokenRefresh(async (newToken) => {
      setToken(newToken);
      try {
        await api.post('/api/users/device-token', {
          token: newToken,
          platform: Platform.OS,
        });
      } catch (error) {
        console.error('Error updating token:', error);
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeToken();
    };
  }, []);

  const enableNotifications = useCallback(async () => {
    try {
      setIsPending(true);
      const token = await requestNotificationPermission();
      if (token) {
        setToken(token);
        setIsEnabled(true);
        showToast({
          type: 'success',
          message: 'Bildirimler başarıyla etkinleştirildi',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      showToast({
        type: 'error',
        message: 'Bildirimler etkinleştirilemedi',
      });
      return false;
    } finally {
      setIsPending(false);
    }
  }, [showToast]);

  const disableNotifications = useCallback(async () => {
    try {
      setIsPending(true);
      if (token) {
        await api.delete('/api/users/device-token', {
          data: { token },
        });
        await clearNotifications();
        setToken(null);
        setIsEnabled(false);
        showToast({
          type: 'success',
          message: 'Bildirimler devre dışı bırakıldı',
        });
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      showToast({
        type: 'error',
        message: 'Bildirimler devre dışı bırakılamadı',
      });
    } finally {
      setIsPending(false);
    }
  }, [token, showToast]);

  return {
    token,
    isEnabled,
    isPending,
    enableNotifications,
    disableNotifications,
  };
}