"use client";

import { storageManager } from '../storage/storage-manager';
import { networkMonitor } from '../network/network-monitor';

export interface QueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  priority: number;
}

class QueueManager {
  private static instance: QueueManager;
  private queueKey = 'operation_queue';
  private maxRetries = 3;
  private isProcessing = false;

  private constructor() {
    this.setupNetworkListener();
  }

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  private setupNetworkListener(): void {
    networkMonitor.on('online', () => {
      this.processQueue();
    });
  }

  async enqueue(item: Omit<QueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queue = await this.getQueue();
    const newItem: QueueItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retryCount: 0,
    };

    queue.push(newItem);
    queue.sort((a, b) => b.priority - a.priority);
    await this.saveQueue(queue);

    if (networkMonitor.isOnline) {
      this.processQueue();
    }
  }

  private async getQueue(): Promise<QueueItem[]> {
    const queue = await storageManager.get<QueueItem[]>(this.queueKey);
    return queue || [];
  }

  private async saveQueue(queue: QueueItem[]): Promise<void> {
    await storageManager.set(this.queueKey, queue);
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !networkMonitor.isOnline) return;

    this.isProcessing = true;
    try {
      const queue = await this.getQueue();
      const updatedQueue: QueueItem[] = [];
      const processedIds: string[] = [];

      for (const item of queue) {
        if (item.retryCount >= this.maxRetries) continue;

        try {
          await this.processItem(item);
          processedIds.push(item.id);
        } catch (error) {
          item.retryCount++;
          if (item.retryCount < this.maxRetries) {
            updatedQueue.push(item);
          }
        }
      }

      const remainingQueue = queue.filter(
        item => !processedIds.includes(item.id)
      );
      await this.saveQueue([...remainingQueue, ...updatedQueue]);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    // Implementation would be provided by the API layer
    throw new Error('processItem must be implemented');
  }

  async clear(): Promise<void> {
    await storageManager.remove(this.queueKey);
  }

  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async getFailedItems(): Promise<QueueItem[]> {
    const queue = await this.getQueue();
    return queue.filter(item => item.retryCount >= this.maxRetries);
  }

  async removeItem(id: string): Promise<void> {
    const queue = await this.getQueue();
    const updatedQueue = queue.filter(item => item.id !== id);
    await this.saveQueue(updatedQueue);
  }

  async retryFailedItems(): Promise<void> {
    const queue = await this.getQueue();
    const updatedQueue = queue.map(item => ({
      ...item,
      retryCount: 0,
    }));
    await this.saveQueue(updatedQueue);
    this.processQueue();
  }
}

export const queueManager = QueueManager.getInstance();