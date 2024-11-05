"use client";

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: ShimmerProps) {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const styles = StyleSheet.create({
    container: {
      width,
      height,
      borderRadius,
      backgroundColor: theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
      overflow: 'hidden',
    },
    shimmer: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      backgroundColor: theme === 'dark' ? '#ffffff10' : '#ffffff80',
      transform: [{ translateX }],
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={styles.shimmer} />
    </View>
  );
}