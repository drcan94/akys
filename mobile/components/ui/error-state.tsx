"use client";

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from './icon';
import { Colors } from '../../constants/colors';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorState({
  message = 'Bir hata oluştu',
  onRetry,
  fullScreen = false,
}: ErrorStateProps) {
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
    message: {
      fontSize: 16,
      textAlign: 'center',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: onRetry ? 16 : 0,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    retryText: {
      color: Colors.white,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Icon
        name="alert-circle"
        size={48}
        color={theme === 'dark' ? Colors.error : Colors.errorDark}
        style={styles.icon}
      />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Icon name="refresh-cw" size={16} color={Colors.white} />
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}