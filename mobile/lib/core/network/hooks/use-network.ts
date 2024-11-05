"use client";

import { useState, useEffect } from 'react';
import { networkService } from '../network-service';
import type { NetworkState, NetworkChangeEvent } from '../types';

export function useNetwork() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: networkService.isOnline,
    connectionType: networkService.connectionType,
    isMetered: networkService.isMetered,
  });

  useEffect(() => {
    const handleNetworkChange = (event: NetworkChangeEvent) => {
      setNetworkState(event);
    };

    networkService.on('change', handleNetworkChange);

    // Get initial state
    networkService.checkConnectivity().then(setNetworkState);

    return () => {
      networkService.removeListener('change', handleNetworkChange);
    };
  }, []);

  return networkState;
}