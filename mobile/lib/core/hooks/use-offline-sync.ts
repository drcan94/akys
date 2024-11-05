"use client";

import { useState, useEffect } from 'react';
import { dataService } from '../data/data-service';
import { useToast } from '../../shared/hooks/use-toast';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = dataService.onNetworkChange((online) => {
      const wasOffline = !isOnline;
      setIsOnline(online);

      if (wasOffline && online) {
        handleSync();
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await dataService.retryFailedOperations();
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
      await dataService.clearAllData();
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