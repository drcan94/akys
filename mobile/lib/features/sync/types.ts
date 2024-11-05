export interface SyncStatus {
  lastSync: Record<string, number>;
  pendingOperations: number;
  failedOperations: number;
}

export interface SyncTask {
  id: string;
  name: string;
  interval: number;
  lastRun?: number;
  isRunning: boolean;
}

export interface SyncConfig {
  key: string;
  endpoint: string;
  interval: number;
  lastSync?: number;
}