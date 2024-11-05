export interface NetworkState {
  isOnline: boolean;
  connectionType: string | null;
  isMetered: boolean;
}

export interface NetworkChangeEvent extends NetworkState {}

export type NetworkEventType = 'online' | 'offline' | 'change';

export type NetworkEventCallback = (state: NetworkChangeEvent) => void;