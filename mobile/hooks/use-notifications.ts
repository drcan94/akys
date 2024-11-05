import { useEffect, useState } from 'react';
import {
  requestNotificationPermission,
  configurePushNotifications,
  onMessageReceived,
  onTokenRefresh,
} from '../lib/notifications';
import { api } from '../lib/api';
import { useAuth } from './use-auth';

export function useNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPending, setIsPending] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const setup = async () => {
      try {
        configurePushNotifications();
        const token = await requestNotificationPermission();
        setToken(token);
        setIsEnabled(true);
      } catch (error) {
        console.error('Error setting up notifications:', error);
        setIsEnabled(false);
      } finally {
        setIsPending(false);
      }
    };

    setup();

    // Listen for token refresh
    const unsubscribeTokenRefresh = onTokenRefresh(async (newToken) => {
      setToken(newToken);
      try {
        await api.post('/api/users/device-token', {
          token: newToken,
          platform: 'mobile',
        });
      } catch (error) {
        console.error('Error updating token:', error);
      }
    });

    // Listen for messages
    const unsubscribeMessages = onMessageReceived((message) => {
      console.log('Received message:', message);
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeMessages();
    };
  }, [user?.id]);

  const enableNotifications = async () => {
    try {
      setIsPending(true);
      const token = await requestNotificationPermission();
      setToken(token);
      setIsEnabled(true);
      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const disableNotifications = async () => {
    try {
      setIsPending(true);
      if (token) {
        await api.delete('/api/users/device-token', {
          body: { token },
        });
      }
      setToken(null);
      setIsEnabled(false);
    } catch (error) {
      console.error('Error disabling notifications:', error);
    } finally {
      setIsPending(false);
    }
  };

  return {
    token,
    isEnabled,
    isPending,
    enableNotifications,
    disableNotifications,
  };
}