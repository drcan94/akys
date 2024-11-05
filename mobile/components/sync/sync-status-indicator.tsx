"use client";

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDataContext } from '../../providers/data-provider';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from '../ui/icon';
import { Colors } from '../../constants/colors';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function SyncStatusIndicator() {
  const { syncStatus, retryFailedOperations } = useDataContext();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      padding: 12,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      borderRadius: 8,
      marginHorizontal: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    content: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
    },
    button: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonText: {
      color: Colors.white,
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
    },
  });

  if (!syncStatus?.failedOperations) return null;

  const lastSyncTime = Math.max(...Object.values(syncStatus.lastSync));
  const lastSyncFormatted = lastSyncTime
    ? formatDistanceToNow(lastSyncTime, { locale: tr, addSuffix: true })
    : 'hiç';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {syncStatus.failedOperations} başarısız senkronizasyon
        </Text>
        <Text style={styles.subtitle}>
          Son senkronizasyon: {lastSyncFormatted}
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={retryFailedOperations}>
        <Icon name="refresh-cw" size={12} color={Colors.white} />
        <Text style={styles.buttonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );
}