"use client";

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { usePushNotifications } from '../../hooks/use-push-notifications';
import { Icon } from './icon';
import { useTheme } from '../../hooks/use-theme';
import { Colors } from '../../constants/colors';

interface PushNotificationButtonProps {
  size?: number;
  color?: string;
}

export function PushNotificationButton({
  size = 24,
  color,
}: PushNotificationButtonProps) {
  const { theme } = useTheme();
  const { isEnabled, isPending, enableNotifications, disableNotifications } =
    usePushNotifications();

  const styles = StyleSheet.create({
    button: {
      padding: 8,
    },
  });

  if (isPending) {
    return (
      <TouchableOpacity style={styles.button} disabled>
        <Icon
          name="loader"
          size={size}
          color={color || (theme === 'dark' ? Colors.white : Colors.black)}
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={isEnabled ? disableNotifications : enableNotifications}>
      <Icon
        name={isEnabled ? 'bell' : 'bell-off'}
        size={size}
        color={color || (theme === 'dark' ? Colors.white : Colors.black)}
      />
    </TouchableOpacity>
  );
}