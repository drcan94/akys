"use client";

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from '../ui/icon';
import { Colors } from '../../constants/colors';

const COMPLICATIONS = [
  "Hipotansiyon",
  "Hipertansiyon",
  "Bradikardi",
  "Taşikardi",
  "Desatürasyon",
  "Bronkospazm",
  "Laringospazm",
  "Bulantı/Kusma",
  "Alerjik Reaksiyon",
  "Zor Entübasyon",
];

interface ComplicationSelectProps {
  value: string[];
  onChange: (complications: string[]) => void;
  error?: string;
}

export function ComplicationSelect({
  value,
  onChange,
  error,
}: ComplicationSelectProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    complicationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    selected: {
      backgroundColor: theme === 'dark' ? Colors.primary : Colors.primaryLight,
    },
    complicationText: {
      flex: 1,
      fontSize: 14,
      color: theme === 'dark' ? Colors.white : Colors.black,
    },
    selectedText: {
      color: theme === 'dark' ? Colors.white : Colors.primary,
    },
    error: {
      color: Colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });

  const toggleComplication = (complication: string) => {
    const newValue = value.includes(complication)
      ? value.filter((c) => c !== complication)
      : [...value, complication];
    onChange(newValue);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ maxHeight: 200 }}>
        {COMPLICATIONS.map((complication) => {
          const isSelected = value.includes(complication);
          return (
            <TouchableOpacity
              key={complication}
              style={[
                styles.complicationItem,
                isSelected && styles.selected,
              ]}
              onPress={() => toggleComplication(complication)}>
              <Text
                style={[
                  styles.complicationText,
                  isSelected && styles.selectedText,
                ]}>
                {complication}
              </Text>
              {isSelected && (
                <Icon
                  name="check"
                  size={16}
                  color={theme === 'dark' ? Colors.white : Colors.primary}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}