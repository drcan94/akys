"use client";

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineManager } from '../lib/offline-manager';
import { syncManager } from '../lib/sync-manager';
import { useToast } from './use-toast';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      setIsOnline(!!state.isConnected);

      // If coming back online, trigger sync
      if (wasOffline && state.isConnected) {
        handleSync();
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await syncManager.syncAll();
      showToast({
        type: 'success',
        message: 'Veriler başarıyla senkronize edildi',
      });
    } catch (error) {
      console.error('Sync error:', error);
      showToast({
        type: 'error',
        message: 'Senkronizasyon sırasında bir hata oluştu',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const clearOfflineData = async () => {
    try {
      await offlineManager.clearCache();
      await offlineManager.clearQueue();
      await syncManager.clearSyncData();
      showToast({
        type: 'success',
        message: 'Çevrimdışı veriler temizlendi',
      });
    } catch (error) {
      console.error('Clear data error:', error);
      showToast({
        type: 'error',
        message: 'Veriler temizlenirken bir hata oluştu',
      });
    }
  };

  return {
    isOnline,
    isSyncing,
    sync: handleSync,
    clearOfflineData,
  };
}