"use client";

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSync } from '../hooks/use-sync';
import { useTheme } from '../../../hooks/use-theme';
import { Icon } from '../../../components/ui/icon';
import { Colors } from '../../../constants/colors';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function SyncIndicator() {
  const { status, isSyncing, sync } = useSync();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      borderRadius: 8,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    content: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
    },
    syncButton: {
      padding: 8,
    },
  });

  if (!status) return null;

  const lastSync = status.lastSyncAttempt
    ? formatDistanceToNow(status.lastSyncAttempt, { locale: tr, addSuffix: true })
    : 'hiç';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {status.pendingOperations} bekleyen işlem
        </Text>
        <Text style={styles.subtitle}>Son senkronizasyon: {lastSync}</Text>
      </View>
      <TouchableOpacity
        style={styles.syncButton}
        onPress={sync}
        disabled={isSyncing}>
        <Icon
          name={isSyncing ? 'loader' : 'refresh-cw'}
          size={20}
          color={theme === 'dark' ? Colors.white : Colors.black}
        />
      </TouchableOpacity>
    </View>
  );
}