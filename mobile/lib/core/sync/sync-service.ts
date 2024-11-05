"use client";

import { EventEmitter } from 'events';
import { networkService } from '../network/network-service';
import { storageService } from '../storage/storage-service';
import { queueService } from '../queue/queue-service';
import type { SyncConfig, SyncTask, SyncStatus } from './types';

class SyncService extends EventEmitter {
  private static instance: SyncService;
  private syncConfigs: Map<string, SyncConfig> = new Map();
  private syncTasks: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized: boolean = false;

  private constructor() {
    super();
    this.setupNetworkListener();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private setupNetworkListener(): void {
    networkService.on('online', () => {
      this.syncAll();
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load saved sync timestamps
      const timestamps = await storageService.get('sync_timestamps');
      if (timestamps) {
        const parsed = JSON.parse(timestamps);
        Object.entries(parsed).forEach(([key, lastSync]) => {
          const config = this.syncConfigs.get(key);
          if (config) {
            config.lastSync = lastSync as number;
          }
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing sync service:', error);
      throw error;
    }
  }

  registerSync(config: SyncConfig): void {
    this.syncConfigs.set(config.key, config);
    this.setupSyncInterval(config);
  }

  private setupSyncInterval(config: SyncConfig): void {
    // Clear existing interval if any
    const existingInterval = this.syncTasks.get(config.key);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Setup new interval
    const interval = setInterval(() => {
      this.syncData(config);
    }, config.interval);

    this.syncTasks.set(config.key, interval);
  }

  private async syncData(config: SyncConfig): Promise<void> {
    if (!networkService.isOnline) return;

    try {
      // Check if sync is needed based on interval
      const now = Date.now();
      if (config.lastSync && now - config.lastSync < config.interval) {
        return;
      }

      this.emit('syncStart', { key: config.key });

      // Process any queued operations first
      await queueService.processQueue();

      // Update last sync timestamp
      config.lastSync = now;
      await this.saveSyncTimestamps();

      this.emit('syncComplete', { key: config.key });
    } catch (error) {
      console.error(`Error syncing ${config.key}:`, error);
      this.emit('syncError', { key: config.key, error });
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
      await storageService.set('sync_timestamps', JSON.stringify(timestamps));
    } catch (error) {
      console.error('Error saving sync timestamps:', error);
    }
  }

  async syncAll(): Promise<void> {
    if (!networkService.isOnline) return;

    this.emit('syncAllStart');

    const promises = Array.from(this.syncConfigs.values()).map(config =>
      this.syncData(config)
    );

    try {
      await Promise.allSettled(promises);
      this.emit('syncAllComplete');
    } catch (error) {
      console.error('Error during sync all:', error);
      this.emit('syncAllError', error);
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const tasks = Array.from(this.syncConfigs.entries()).map(([key, config]) => ({
      key,
      lastSync: config.lastSync,
      nextSync: config.lastSync
        ? config.lastSync + config.interval
        : Date.now(),
    }));

    return {
      tasks,
      pendingOperations: await queueService.getQueueSize(),
      failedOperations: (await queueService.getFailedItems()).length,
      lastSyncAttempt: Math.max(...tasks.map(t => t.lastSync || 0)),
    };
  }

  async clearSyncData(): Promise<void> {
    await storageService.remove('sync_timestamps');
    this.syncConfigs.forEach(config => {
      config.lastSync = undefined;
    });
  }

  destroy(): void {
    this.syncTasks.forEach(interval => clearInterval(interval));
    this.syncTasks.clear();
    this.removeAllListeners();
  }
}

export const syncService = SyncService.getInstance();