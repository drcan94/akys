"use client";

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';
import { Shimmer } from './shimmer';

interface LoadingStateProps {
  type?: 'spinner' | 'list' | 'card';
  rows?: number;
  fullScreen?: boolean;
}

export function LoadingState({ 
  type = 'list', 
  rows = 3, 
  fullScreen = false 
}: LoadingStateProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: fullScreen ? 1 : undefined,
      padding: 16,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
    row: {
      marginBottom: 16,
    },
    card: {
      borderRadius: 8,
      padding: 16,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  });

  const renderListShimmer = () => (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.row}>
          <Shimmer height={20} />
          <View style={{ height: 8 }} />
          <Shimmer width="60%" height={16} />
        </View>
      ))}
    </>
  );

  const renderCardShimmer = () => (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={[styles.row, styles.card]}>
          <Shimmer height={24} width="70%" />
          <View style={{ height: 12 }} />
          <Shimmer height={16} />
          <View style={{ height: 8 }} />
          <Shimmer height={16} width="40%" />
        </View>
      ))}
    </>
  );

  return (
    <View style={styles.container}>
      {type === 'list' && renderListShimmer()}
      {type === 'card' && renderCardShimmer()}
    </View>
  );
}