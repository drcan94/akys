"use client";

import React, { useCallback } from 'react';
import {
  FlatList,
  ActivityIndicator,
  StyleSheet,
  View,
  type FlatListProps,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';
import { EmptyState } from './empty-state';

interface InfiniteScrollProps<T> extends Omit<FlatListProps<T>, 'onEndReached'> {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: string;
}

export function InfiniteScroll<T>({
  data,
  isLoading,
  isError,
  hasNextPage,
  fetchNextPage,
  onRefresh,
  emptyTitle = 'Veri bulunamadı',
  emptyMessage,
  emptyIcon,
  ...props
}: InfiniteScrollProps<T>) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
    footer: {
      padding: 16,
    },
  });

  const renderFooter = useCallback(() => {
    if (!hasNextPage) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator
          size="small"
          color={theme === 'dark' ? Colors.white : Colors.primary}
        />
      </View>
    );
  }, [hasNextPage, theme]);

  if (isLoading && !data.length) {
    return <LoadingState fullScreen />;
  }

  if (isError && !data.length) {
    return <ErrorState fullScreen onRetry={onRefresh} />;
  }

  if (!isLoading && !isError && !data.length) {
    return (
      <EmptyState
        fullScreen
        icon={emptyIcon}
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  return (
    <FlatList
      {...props}
      data={data}
      style={[styles.container, props.style]}
      onEndReached={() => {
        if (hasNextPage && !isLoading) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      refreshing={isLoading}
      onRefresh={onRefresh}
    />
  );
}