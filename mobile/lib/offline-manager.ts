import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from './api';

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

class OfflineManager {
  private static instance: OfflineManager;
  private isProcessing: boolean = false;
  private maxRetries: number = 3;
  private syncInterval: number = 60000; // 1 minute
  private intervalId?: NodeJS.Timeout;

  private constructor() {
    this.setupNetworkListener();
    this.startSyncInterval();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.processQueue();
      }
    });
  }

  private startSyncInterval() {
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, this.syncInterval);
  }

  private stopSyncInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newOperation: QueuedOperation = {
        ...operation,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        retryCount: 0,
      };
      queue.push(newOperation);
      await AsyncStorage.setItem('operationQueue', JSON.stringify(queue));
      this.processQueue();
    } catch (error) {
      console.error('Error queuing operation:', error);
    }
  }

  private async getQueue(): Promise<QueuedOperation[]> {
    try {
      const queue = await AsyncStorage.getItem('operationQueue');
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  private async updateQueue(queue: QueuedOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem('operationQueue', JSON.stringify(queue));
    } catch (error) {
      console.error('Error updating queue:', error);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) return;

    this.isProcessing = true;
    try {
      const queue = await this.getQueue();
      const updatedQueue: QueuedOperation[] = [];

      for (const operation of queue) {
        try {
          if (operation.retryCount >= this.maxRetries) {
            continue; // Skip failed operations that exceeded retry limit
          }

          switch (operation.type) {
            case 'create':
              await api.post(operation.endpoint, operation.data);
              break;
            case 'update':
              await api.put(operation.endpoint, operation.data);
              break;
            case 'delete':
              await api.delete(operation.endpoint);
              break;
          }
        } catch (error) {
          operation.retryCount++;
          if (operation.retryCount < this.maxRetries) {
            updatedQueue.push(operation);
          }
        }
      }

      await this.updateQueue(updatedQueue);
    } finally {
      this.isProcessing = false;
    }
  }

  async cacheData(key: string, data: any): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  async getCachedData<T>(key: string, maxAge: number = 3600000): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > maxAge) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data as T;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem('operationQueue');
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }

  destroy(): void {
    this.stopSyncInterval();
  }
}

export const offlineManager = OfflineManager.getInstance();