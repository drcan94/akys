"use client";

import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  type ImageSourcePropType,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface AvatarProps {
  size?: number;
  source?: ImageSourcePropType | null;
  fallback?: React.ReactNode;
}

export function Avatar({ size = 40, source, fallback }: AvatarProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: size,
      height: size,
    },
  });

  return (
    <View style={styles.container}>
      {source ? (
        <Image source={source} style={styles.image} />
      ) : (
        fallback
      )}
    </View>
  );
}