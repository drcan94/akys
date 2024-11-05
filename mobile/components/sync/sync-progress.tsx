"use client";

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';
import { Progress } from '../ui/progress';

interface SyncProgressProps {
  total: number;
  current: number;
  label?: string;
}

export function SyncProgress({ total, current, label }: SyncProgressProps) {
  const { theme } = useTheme();
  const progress = Math.round((current / total) * 100);

  const styles = StyleSheet.create({
    container: {
      padding: 12,
    },
    label: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      marginBottom: 8,
    },
    progressText: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginTop: 4,
      textAlign: 'right',
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Progress value={progress} />
      <Text style={styles.progressText}>
        {current} / {total} (%{progress})
      </Text>
    </View>
  );
}