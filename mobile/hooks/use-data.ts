"use client";

import { useState, useEffect } from 'react';
import { dataService } from '../lib/data';
import { useToast } from './use-toast';

interface UseDataOptions {
  key: string;
  endpoint: string;
  syncInterval?: number;
  cacheDuration?: number;
}

export function useData<T>(options: UseDataOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Register data type
    dataService.registerDataType<T>(
      options.key,
      options.endpoint,
      {
        syncInterval: options.syncInterval,
        cacheDuration: options.cacheDuration,
      }
    );

    loadData();

    // Setup network change listener
    const unsubscribe = dataService.onNetworkChange((isOnline) => {
      if (isOnline) {
        loadData();
      }
    });

    return () => unsubscribe();
  }, [options.key]);

  const loadData = async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const result = await dataService.getData<T>(options.key);
      setData(result);
    } catch (error) {
      console.error(`Error loading data for ${options.key}:`, error);
      setIsError(true);
      showToast({
        type: 'error',
        message: 'Veriler yüklenirken bir hata oluştu',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateData = async (newData: T) => {
    try {
      await dataService.updateData(options.key, newData);
      setData(newData);
      showToast({
        type: 'success',
        message: 'Veriler başarıyla güncellendi',
      });
    } catch (error) {
      console.error(`Error updating data for ${options.key}:`, error);
      showToast({
        type: 'error',
        message: 'Veriler güncellenirken bir hata oluştu',
      });
      throw error;
    }
  };

  const invalidateData = async () => {
    await dataService.invalidateData(options.key);
    loadData();
  };

  return {
    data,
    isLoading,
    isError,
    refresh: loadData,
    update: updateData,
    invalidate: invalidateData,
  };
}