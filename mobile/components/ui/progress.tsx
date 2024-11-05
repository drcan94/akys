"use client";

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface ProgressProps {
  value: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export function Progress({
  value,
  color,
  backgroundColor,
  height = 4,
}: ProgressProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      height,
      backgroundColor:
        backgroundColor ||
        (theme === 'dark' ? Colors.darkBorder : Colors.lightBorder),
      borderRadius: height / 2,
      overflow: 'hidden',
    },
    progress: {
      height: '100%',
      backgroundColor: color || Colors.primary,
      width: `${Math.min(Math.max(value, 0), 100)}%`,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.progress} />
    </View>
  );
}