"use client";

import { offlineManager } from './offline-manager';
import { syncManager } from './sync-manager';
import { enhancedApi } from './enhanced-api';

interface DataConfig {
  key: string;
  endpoint: string;
  syncInterval: number;
  cacheDuration: number;
}

class DataManager {
  private static instance: DataManager;
  private dataConfigs: Map<string, DataConfig> = new Map();

  private constructor() {}

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  async initialize(): Promise<void> {
    await Promise.all([
      syncManager.initialize(),
    ]);
  }

  registerData(config: DataConfig): void {
    this.dataConfigs.set(config.key, config);
    
    // Register with sync manager
    syncManager.registerSync({
      key: config.key,
      endpoint: config.endpoint,
      interval: config.syncInterval,
    });
  }

  async getData<T>(key: string): Promise<T | null> {
    const config = this.dataConfigs.get(key);
    if (!config) {
      throw new Error(`No configuration found for key: ${key}`);
    }

    try {
      // Try to get cached data first
      const cachedData = await offlineManager.getCachedData<T>(
        key,
        config.cacheDuration
      );
      
      if (cachedData) {
        return cachedData;
      }

      // If no cached data, fetch from API
      const data = await enhancedApi.get<T>(config.endpoint);
      
      // Cache the new data
      await offlineManager.cacheData(key, data);
      
      return data;
    } catch (error) {
      console.error(`Error getting data for ${key}:`, error);
      return null;
    }
  }

  async updateData<T>(key: string, data: T): Promise<void> {
    const config = this.dataConfigs.get(key);
    if (!config) {
      throw new Error(`No configuration found for key: ${key}`);
    }

    try {
      // Update cache immediately for optimistic UI
      await offlineManager.cacheData(key, data);

      // Try to update server
      await enhancedApi.put(config.endpoint, data);
    } catch (error) {
      console.error(`Error updating data for ${key}:`, error);
      throw error;
    }
  }

  async invalidateData(key: string): Promise<void> {
    await offlineManager.clearCache();
    await syncManager.clearSyncData();
  }

  async clearAllData(): Promise<void> {
    await offlineManager.clearCache();
    await offlineManager.clearQueue();
    await syncManager.clearSyncData();
  }
}

export const dataManager = DataManager.getInstance();