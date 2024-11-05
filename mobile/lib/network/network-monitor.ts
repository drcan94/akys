"use client";

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

class NetworkMonitor extends EventEmitter {
  private static instance: NetworkMonitor;
  private _isOnline: boolean = true;
  private _isInitialized: boolean = false;

  private constructor() {
    super();
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    const state = await NetInfo.fetch();
    this._isOnline = !!state.isConnected;

    NetInfo.addEventListener(this.handleNetworkChange);
    this._isInitialized = true;
  }

  private handleNetworkChange = (state: NetInfoState) => {
    const wasOffline = !this._isOnline;
    this._isOnline = !!state.isConnected;

    if (wasOffline && state.isConnected) {
      this.emit('online');
    } else if (!wasOffline && !state.isConnected) {
      this.emit('offline');
    }

    this.emit('change', this._isOnline);
  };

  destroy(): void {
    NetInfo.removeEventListener(this.handleNetworkChange);
    this.removeAllListeners();
    this._isInitialized = false;
  }
}

export const networkMonitor = NetworkMonitor.getInstance();