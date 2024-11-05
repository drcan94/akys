"use client";

import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface PullToRefreshProps extends Omit<ScrollViewProps, 'refreshControl'> {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({
  onRefresh,
  children,
  ...props
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
  });

  return (
    <ScrollView
      {...props}
      style={[styles.container, props.style]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[Colors.primary]}
          tintColor={theme === 'dark' ? Colors.white : Colors.primary}
        />
      }>
      {children}
    </ScrollView>
  );
}