"use client";

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Icon } from '../ui/icon';
import { Colors } from '../../constants/colors';

interface ActiveCollaboratorsProps {
  collaborators: Set<string>;
  lockedBy: {
    id: string;
    name: string;
  } | null;
}

export function ActiveCollaborators({
  collaborators,
  lockedBy,
}: ActiveCollaboratorsProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? Colors.error : Colors.errorLight,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginLeft: 8,
    },
    badgeText: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.white : Colors.error,
      marginLeft: 4,
    },
  });

  return (
    <View style={styles.container}>
      {lockedBy && (
        <View style={styles.avatarContainer}>
          <Avatar
            size={32}
            fallback={<Text>{lockedBy.name.charAt(0)}</Text>}
          />
          <View style={styles.badge}>
            <Icon
              name="lock"
              size={12}
              color={theme === 'dark' ? Colors.white : Colors.error}
            />
            <Text style={styles.badgeText}>Düzenleniyor</Text>
          </View>
        </View>
      )}

      {Array.from(collaborators).map((userId) => (
        <Avatar
          key={userId}
          size={32}
          fallback={<Text>U</Text>}
        />
      ))}
    </View>
  );
}