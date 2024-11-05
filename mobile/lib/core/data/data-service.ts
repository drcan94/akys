"use client";

import { dataManager } from './data-manager';
import { offlineManager } from './offline-manager';
import { syncManager } from './sync-manager';
import { networkMonitor } from './network-monitor';
import { cacheManager } from './cache-manager';
import { queueManager } from './queue-manager';
import { syncScheduler } from './sync-scheduler';

export interface DataManagerConfig {
  syncInterval?: number;
  cacheDuration?: number;
  maxRetries?: number;
  queuePriority?: number;
}

class DataService {
  private static instance: DataService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await networkMonitor.initialize();
      await dataManager.initialize();
      await syncManager.initialize();
      this.setupSyncTasks();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing data service:', error);
      throw error;
    }
  }

  private setupSyncTasks(): void {
    syncScheduler.registerTask(
      'periodicSync',
      300000,
      async () => {
        await syncManager.syncAll();
      }
    );

    syncScheduler.registerTask(
      'cleanup',
      3600000,
      async () => {
        await cacheManager.clear();
        await this.cleanupQueue();
      }
    );
  }

  private async cleanupQueue(): Promise<void> {
    const failedItems = await queueManager.getFailedItems();
    for (const item of failedItems) {
      await queueManager.removeItem(item.id);
    }
  }

  async registerDataType<T>(
    key: string,
    endpoint: string,
    config?: DataManagerConfig
  ): Promise<void> {
    dataManager.registerData({
      key,
      endpoint,
      syncInterval: config?.syncInterval ?? 300000,
      cacheDuration: config?.cacheDuration ?? 3600000,
    });
  }

  async getData<T>(key: string): Promise<T | null> {
    return dataManager.getData<T>(key);
  }

  async updateData<T>(key: string, data: T): Promise<void> {
    return dataManager.updateData(key, data);
  }

  async invalidateData(key: string): Promise<void> {
    return dataManager.invalidateData(key);
  }

  async clearAllData(): Promise<void> {
    await dataManager.clearAllData();
    await cacheManager.clear();
    await queueManager.clear();
  }

  isOnline(): boolean {
    return networkMonitor.isOnline;
  }

  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    networkMonitor.on('change', callback);
    return () => networkMonitor.removeListener('change', callback);
  }

  async getSyncStatus(): Promise<{
    lastSync: Record<string, number>;
    pendingOperations: number;
    failedOperations: number;
  }> {
    const tasks = syncScheduler.getAllTasks();
    const lastSync: Record<string, number> = {};
    
    tasks.forEach(task => {
      if (task.lastRun) {
        lastSync[task.name] = task.lastRun;
      }
    });

    return {
      lastSync,
      pendingOperations: await queueManager.getQueueSize(),
      failedOperations: (await queueManager.getFailedItems()).length,
    };
  }

  async retryFailedOperations(): Promise<void> {
    await queueManager.retryFailedItems();
  }

  destroy(): void {
    networkMonitor.destroy();
    syncScheduler.destroy();
  }
}

export const dataService = DataService.getInstance();