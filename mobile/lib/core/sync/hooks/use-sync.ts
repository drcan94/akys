"use client";

import { useState, useEffect } from 'react';
import { syncService } from '../sync-service';
import type { SyncStatus, SyncEvent } from '../types';

export function useSync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const newStatus = await syncService.getSyncStatus();
        setStatus(newStatus);
      } catch (err) {
        console.error('Error getting sync status:', err);
      }
    };

    const handleSyncStart = () => {
      setIsSyncing(true);
      setError(null);
    };

    const handleSyncComplete = () => {
      setIsSyncing(false);
      updateStatus();
    };

    const handleSyncError = (event: SyncEvent) => {
      setIsSyncing(false);
      if (event.error) {
        setError(event.error);
      }
      updateStatus();
    };

    syncService.on('syncAllStart', handleSyncStart);
    syncService.on('syncAllComplete', handleSyncComplete);
    syncService.on('syncAllError', handleSyncError);

    updateStatus();

    return () => {
      syncService.removeListener('syncAllStart', handleSyncStart);
      syncService.removeListener('syncAllComplete', handleSyncComplete);
      syncService.removeListener('syncAllError', handleSyncError);
    };
  }, []);

  const sync = async () => {
    if (isSyncing) return;
    await syncService.syncAll();
  };

  const clearSyncData = async () => {
    await syncService.clearSyncData();
    const newStatus = await syncService.getSyncStatus();
    setStatus(newStatus);
  };

  return {
    status,
    isSyncing,
    error,
    sync,
    clearSyncData,
  };
}