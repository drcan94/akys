"use client";

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useDataContext } from '../../providers/data-provider';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from '../ui/icon';
import { Colors } from '../../constants/colors';

export function OfflineIndicator() {
  const { isOnline } = useDataContext();
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOnline ? -50 : 0,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme === 'dark' ? Colors.errorDark : Colors.error,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    },
    text: {
      color: Colors.white,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}>
      <Icon name="wifi-off" size={16} color={Colors.white} />
      <Text style={styles.text}>İnternet bağlantısı yok</Text>
    </Animated.View>
  );
}