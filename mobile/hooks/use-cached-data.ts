"use client";

import { useState, useEffect } from 'react';
import { dataManager } from '../lib/data-manager';
import { useToast } from './use-toast';

interface UseCachedDataOptions {
  key: string;
  endpoint: string;
  syncInterval?: number;
  cacheDuration?: number;
}

export function useCachedData<T>(options: UseCachedDataOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Register data configuration
    dataManager.registerData({
      key: options.key,
      endpoint: options.endpoint,
      syncInterval: options.syncInterval || 300000, // 5 minutes default
      cacheDuration: options.cacheDuration || 3600000, // 1 hour default
    });

    loadData();
  }, [options.key]);

  const loadData = async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const result = await dataManager.getData<T>(options.key);
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
      await dataManager.updateData(options.key, newData);
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
    await dataManager.invalidateData(options.key);
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