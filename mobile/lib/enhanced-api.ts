import { api } from './api';
import { offlineManager } from './offline-manager';
import NetInfo from '@react-native-community/netinfo';

type ApiMethod = 'get' | 'post' | 'put' | 'delete';

interface ApiOptions {
  endpoint: string;
  method: ApiMethod;
  data?: any;
  requiresNetwork?: boolean;
  cacheDuration?: number;
}

export const enhancedApi = {
  async request<T>({ endpoint, method, data, requiresNetwork = true, cacheDuration }: ApiOptions): Promise<T> {
    const networkState = await NetInfo.fetch();
    
    // Handle GET requests with caching
    if (method === 'get') {
      const cachedData = await offlineManager.getCachedData<T>(endpoint, cacheDuration);
      if (cachedData) return cachedData;

      if (!networkState.isConnected) {
        throw new Error('No network connection available');
      }

      const response = await api[method](endpoint);
      await offlineManager.cacheData(endpoint, response);
      return response;
    }

    // Handle mutations (POST, PUT, DELETE)
    if (!networkState.isConnected) {
      if (requiresNetwork) {
        await offlineManager.queueOperation({
          type: method,
          endpoint,
          data,
        });
        throw new Error('Operation queued for later execution');
      }
    }

    return api[method](endpoint, data);
  },

  async get<T>(endpoint: string, options: Partial<ApiOptions> = {}): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'get',
      ...options,
    });
  },

  async post<T>(endpoint: string, data: any, options: Partial<ApiOptions> = {}): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'post',
      data,
      ...options,
    });
  },

  async put<T>(endpoint: string, data: any, options: Partial<ApiOptions> = {}): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'put',
      data,
      ...options,
    });
  },

  async delete<T>(endpoint: string, options: Partial<ApiOptions> = {}): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'delete',
      ...options,
    });
  },
};