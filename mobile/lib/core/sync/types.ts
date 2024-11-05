export interface SyncConfig {
  key: string;
  endpoint: string;
  interval: number;
  lastSync?: number;
}

export interface SyncTask {
  key: string;
  lastSync?: number;
  nextSync: number;
}

export interface SyncStatus {
  tasks: SyncTask[];
  pendingOperations: number;
  failedOperations: number;
  lastSyncAttempt: number;
}

export type SyncEventType =
  | 'syncStart'
  | 'syncComplete'
  | 'syncError'
  | 'syncAllStart'
  | 'syncAllComplete'
  | 'syncAllError';

export interface SyncEvent {
  key?: string;
  error?: Error;
}