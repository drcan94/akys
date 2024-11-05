"use client";

import { networkMonitor } from '../network/network-monitor';
import { EventEmitter } from 'events';

interface SyncTask {
  id: string;
  name: string;
  interval: number;
  lastRun?: number;
  isRunning: boolean;
  execute: () => Promise<void>;
}

class SyncScheduler extends EventEmitter {
  private static instance: SyncScheduler;
  private tasks: Map<string, SyncTask> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    super();
    this.setupNetworkListener();
  }

  static getInstance(): SyncScheduler {
    if (!SyncScheduler.instance) {
      SyncScheduler.instance = new SyncScheduler();
    }
    return SyncScheduler.instance;
  }

  private setupNetworkListener(): void {
    networkMonitor.on('online', () => {
      this.runAllTasks();
    });
  }

  registerTask(
    name: string,
    interval: number,
    execute: () => Promise<void>
  ): string {
    const id = Math.random().toString(36).substr(2, 9);
    const task: SyncTask = {
      id,
      name,
      interval,
      isRunning: false,
      execute,
    };

    this.tasks.set(id, task);
    this.scheduleTask(task);

    return id;
  }

  private scheduleTask(task: SyncTask): void {
    const existingInterval = this.intervals.get(task.id);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(() => {
      this.runTask(task.id);
    }, task.interval);

    this.intervals.set(task.id, interval);
  }

  async runTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || task.isRunning || !networkMonitor.isOnline) return;

    task.isRunning = true;
    this.emit('taskStart', { taskId, name: task.name });

    try {
      await task.execute();
      task.lastRun = Date.now();
      this.emit('taskComplete', { taskId, name: task.name });
    } catch (error) {
      this.emit('taskError', { taskId, name: task.name, error });
    } finally {
      task.isRunning = false;
    }
  }

  async runAllTasks(): Promise<void> {
    const promises = Array.from(this.tasks.keys()).map(taskId =>
      this.runTask(taskId)
    );
    await Promise.allSettled(promises);
  }

  unregisterTask(taskId: string): void {
    const interval = this.intervals.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(taskId);
    }
    this.tasks.delete(taskId);
  }

  getTaskStatus(taskId: string): {
    isRunning: boolean;
    lastRun?: number;
  } | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    return {
      isRunning: task.isRunning,
      lastRun: task.lastRun,
    };
  }

  getAllTasks(): Array<{
    id: string;
    name: string;
    isRunning: boolean;
    lastRun?: number;
  }> {
    return Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      name: task.name,
      isRunning: task.isRunning,
      lastRun: task.lastRun,
    }));
  }

  destroy(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.tasks.clear();
    this.removeAllListeners();
  }
}

export const syncScheduler = SyncScheduler.getInstance();