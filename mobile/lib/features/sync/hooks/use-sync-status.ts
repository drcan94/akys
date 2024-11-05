"use client";

import { useState, useEffect } from 'react';
import { dataService } from '../../../core/data/data-service';
import { type SyncStatus } from '../types';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const newStatus = await dataService.getSyncStatus();
        setStatus(newStatus);
      } catch (error) {
        console.error('Error getting sync status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const retryFailedOperations = async () => {
    try {
      await dataService.retryFailedOperations();
      const newStatus = await dataService.getSyncStatus();
      setStatus(newStatus);
    } catch (error) {
      console.error('Error retrying failed operations:', error);
      throw error;
    }
  };

  return {
    status,
    isLoading,
    retryFailedOperations,
  };
}