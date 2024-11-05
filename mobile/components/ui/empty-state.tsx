"use client";

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from './icon';
import { Colors } from '../../constants/colors';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  fullScreen?: boolean;
}

export function EmptyState({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
  fullScreen = false,
}: EmptyStateProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: fullScreen ? 1 : undefined,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
    icon: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: message ? 8 : actionLabel ? 16 : 0,
    },
    message: {
      fontSize: 14,
      textAlign: 'center',
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      marginBottom: actionLabel ? 16 : 0,
    },
    actionButton: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    actionText: {
      color: Colors.white,
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <Icon
        name={icon}
        size={48}
        color={theme === 'dark' ? Colors.grayLight : Colors.grayDark}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}