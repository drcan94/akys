"use client";

import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type ViewStyle,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface CollapsibleHeaderProps {
  headerHeight: number;
  minHeaderHeight?: number;
  headerContent: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CollapsibleHeader({
  headerHeight,
  minHeaderHeight = 64,
  headerContent,
  children,
  style,
}: CollapsibleHeaderProps) {
  const { theme } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerHeightDiff = headerHeight - minHeaderHeight;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      zIndex: 1,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: headerHeight,
    },
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, headerHeightDiff],
    outputRange: [headerHeight, minHeaderHeight],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, headerHeightDiff],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            opacity: headerOpacity,
          },
        ]}>
        {headerContent}
      </Animated.View>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {children}
      </Animated.ScrollView>
    </View>
  );
}