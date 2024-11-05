"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { dataService } from '../lib/data';
import { LoadingState } from '../components/ui/loading-state';
import { ErrorState } from '../components/ui/error-state';
import { OfflineBanner } from '../components/ui/offline-banner';

interface DataContextType {
  isOnline: boolean;
  syncStatus: {
    lastSync: Record<string, number>;
    pendingOperations: number;
    failedOperations: number;
  } | null;
  retryFailedOperations: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<DataContextType['syncStatus']>(null);

  useEffect(() => {
    initializeDataService();

    return () => {
      dataService.destroy();
    };
  }, []);

  const initializeDataService = async () => {
    try {
      await dataService.initialize();
      setIsInitialized(true);

      // Setup network status listener
      const unsubscribe = dataService.onNetworkChange((online) => {
        setIsOnline(online);
      });

      // Start periodic sync status updates
      const interval = setInterval(updateSyncStatus, 30000);

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    } catch (error) {
      console.error('Failed to initialize data service:', error);
      setIsError(true);
    }
  };

  const updateSyncStatus = async () => {
    try {
      const status = await dataService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  };

  const retryFailedOperations = async () => {
    await dataService.retryFailedOperations();
    await updateSyncStatus();
  };

  const clearAllData = async () => {
    await dataService.clearAllData();
    await updateSyncStatus();
  };

  if (!isInitialized) {
    return <LoadingState fullScreen />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Uygulama başlatılırken bir hata oluştu"
        onRetry={initializeDataService}
        fullScreen
      />
    );
  }

  return (
    <DataContext.Provider
      value={{
        isOnline,
        syncStatus,
        retryFailedOperations,
        clearAllData,
      }}>
      <OfflineBanner />
      {children}
    </DataContext.Provider>
  );
}