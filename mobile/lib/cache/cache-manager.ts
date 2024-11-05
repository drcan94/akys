"use client";

import { storageManager } from '../storage/storage-manager';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private static instance: CacheManager;
  private prefix = 'cache_';

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private getCacheKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    const timestamp = Date.now();
    const cacheItem: CacheItem<T> = {
      data,
      timestamp,
      expiresAt: timestamp + ttl,
    };

    await storageManager.set(this.getCacheKey(key), cacheItem);
  }

  async get<T>(key: string): Promise<T | null> {
    const cacheItem = await storageManager.get<CacheItem<T>>(
      this.getCacheKey(key)
    );

    if (!cacheItem) return null;

    if (Date.now() > cacheItem.expiresAt) {
      await this.remove(key);
      return null;
    }

    return cacheItem.data;
  }

  async remove(key: string): Promise<void> {
    await storageManager.remove(this.getCacheKey(key));
  }

  async clear(): Promise<void> {
    const keys = await storageManager.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
    await storageManager.multiRemove(cacheKeys);
  }

  async getMetadata(key: string): Promise<{
    timestamp: number;
    expiresAt: number;
  } | null> {
    const cacheItem = await storageManager.get<CacheItem<any>>(
      this.getCacheKey(key)
    );

    if (!cacheItem) return null;

    return {
      timestamp: cacheItem.timestamp,
      expiresAt: cacheItem.expiresAt,
    };
  }

  async isExpired(key: string): Promise<boolean> {
    const metadata = await this.getMetadata(key);
    if (!metadata) return true;
    return Date.now() > metadata.expiresAt;
  }

  async getTimeToLive(key: string): Promise<number | null> {
    const metadata = await this.getMetadata(key);
    if (!metadata) return null;
    return Math.max(0, metadata.expiresAt - Date.now());
  }
}

export const cacheManager = CacheManager.getInstance();