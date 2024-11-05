"use client";

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

class NetworkService extends EventEmitter {
  private static instance: NetworkService;
  private _isOnline: boolean = true;
  private _isInitialized: boolean = false;
  private _connectionType: string | null = null;
  private _isMetered: boolean = false;

  private constructor() {
    super();
  }

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  get connectionType(): string | null {
    return this._connectionType;
  }

  get isMetered(): boolean {
    return this._isMetered;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    const state = await NetInfo.fetch();
    this.updateConnectionState(state);

    NetInfo.addEventListener(this.handleNetworkChange);
    this._isInitialized = true;
  }

  private handleNetworkChange = (state: NetInfoState) => {
    const wasOffline = !this._isOnline;
    this.updateConnectionState(state);

    if (wasOffline && this._isOnline) {
      this.emit('online');
    } else if (!wasOffline && !this._isOnline) {
      this.emit('offline');
    }

    this.emit('change', {
      isOnline: this._isOnline,
      connectionType: this._connectionType,
      isMetered: this._isMetered,
    });
  };

  private updateConnectionState(state: NetInfoState) {
    this._isOnline = !!state.isConnected;
    this._connectionType = state.type;
    this._isMetered = state.isMetered ?? false;
  }

  async checkConnectivity(): Promise<{
    isOnline: boolean;
    connectionType: string | null;
    isMetered: boolean;
  }> {
    const state = await NetInfo.fetch();
    this.updateConnectionState(state);
    return {
      isOnline: this._isOnline,
      connectionType: this._connectionType,
      isMetered: this._isMetered,
    };
  }

  destroy(): void {
    NetInfo.removeEventListener(this.handleNetworkChange);
    this.removeAllListeners();
    this._isInitialized = false;
  }
}

export const networkService = NetworkService.getInstance();