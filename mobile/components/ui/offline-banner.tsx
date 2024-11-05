"use client";

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from './icon';
import { Colors } from '../../constants/colors';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const { theme } = useTheme();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, animation]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme === 'dark' ? Colors.errorDark : Colors.error,
      padding: 8,
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

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  if (!isOffline) return null;

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