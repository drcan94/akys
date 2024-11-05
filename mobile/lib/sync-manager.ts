"use client";

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { enhancedApi } from './enhanced-api';
import { offlineManager } from './offline-manager';

interface SyncConfig {
  key: string;
  endpoint: string;
  interval: number;
  lastSync?: number;
}

class SyncManager {
  private static instance: SyncManager;
  private syncConfigs: Map<string, SyncConfig> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load saved sync timestamps
    try {
      const timestamps = await AsyncStorage.getItem('sync_timestamps');
      if (timestamps) {
        const parsed = JSON.parse(timestamps);
        Object.entries(parsed).forEach(([key, lastSync]) => {
          const config = this.syncConfigs.get(key);
          if (config) {
            config.lastSync = lastSync as number;
          }
        });
      }
    } catch (error) {
      console.error('Error loading sync timestamps:', error);
    }

    // Setup network change listener
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.syncAll();
      }
    });

    this.isInitialized = true;
  }

  registerSync(config: SyncConfig): void {
    this.syncConfigs.set(config.key, config);
    this.setupSyncInterval(config);
  }

  private setupSyncInterval(config: SyncConfig): void {
    // Clear existing interval if any
    const existingInterval = this.syncIntervals.get(config.key);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Setup new interval
    const interval = setInterval(() => {
      this.syncData(config);
    }, config.interval);

    this.syncIntervals.set(config.key, interval);
  }

  private async syncData(config: SyncConfig): Promise<void> {
    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) return;

      // Check if sync is needed based on interval
      const now = Date.now();
      if (config.lastSync && now - config.lastSync < config.interval) {
        return;
      }

      // Fetch data from server
      const data = await enhancedApi.get(config.endpoint);

      // Cache data locally
      await offlineManager.cacheData(config.key, data);

      // Update last sync timestamp
      config.lastSync = now;
      await this.saveSyncTimestamps();
    } catch (error) {
      console.error(`Error syncing ${config.key}:`, error);
    }
  }

  private async saveSyncTimestamps(): Promise<void> {
    try {
      const timestamps: Record<string, number> = {};
      this.syncConfigs.forEach((config, key) => {
        if (config.lastSync) {
          timestamps[key] = config.lastSync;
        }
      });
      await AsyncStorage.setItem('sync_timestamps', JSON.stringify(timestamps));
    } catch (error) {
      console.error('Error saving sync timestamps:', error);
    }
  }

  async syncAll(): Promise<void> {
    const promises = Array.from(this.syncConfigs.values()).map(config =>
      this.syncData(config)
    );
    await Promise.allSettled(promises);
  }

  async clearSyncData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('sync_timestamps');
      this.syncConfigs.forEach(config => {
        config.lastSync = undefined;
      });
    } catch (error) {
      console.error('Error clearing sync data:', error);
    }
  }

  destroy(): void {
    this.syncIntervals.forEach(interval => clearInterval(interval));
    this.syncIntervals.clear();
  }
}

export const syncManager = SyncManager.getInstance();