"use client";

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Icon } from './icon';
import { Badge } from './badge';
import { Colors } from '../../constants/colors';
import { COMORBIDITIES, COMORBIDITY_CATEGORIES } from '../../constants/comorbidities';

interface ComorbiditySelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function ComorbiditySelect({
  value,
  onChange,
  error,
}: ComorbiditySelectProps) {
  const [search, setSearch] = useState('');
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    searchInput: {
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
      padding: 12,
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 8,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginTop: 16,
      marginBottom: 8,
    },
    comorbidityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    selectedItem: {
      backgroundColor: theme === 'dark' ? Colors.primary : Colors.primaryLight,
    },
    itemText: {
      flex: 1,
      fontSize: 14,
      color: theme === 'dark' ? Colors.white : Colors.black,
    },
    selectedBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    error: {
      color: Colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });

  const filteredComorbidities = COMORBIDITIES.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const groupedComorbidities = Object.entries(COMORBIDITY_CATEGORIES).reduce(
    (acc, [category, label]) => {
      acc[category] = filteredComorbidities.filter(
        (item) => item.category === category
      );
      return acc;
    },
    {} as Record<string, typeof COMORBIDITIES>
  );

  const handleToggle = (comorbidityId: string) => {
    const newValue = value.includes(comorbidityId)
      ? value.filter((id) => id !== comorbidityId)
      : [...value, comorbidityId];
    onChange(newValue);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Komorbidite ara..."
        placeholderTextColor={theme === 'dark' ? Colors.grayLight : Colors.grayDark}
      />

      {value.length > 0 && (
        <View style={styles.selectedBadges}>
          {value.map((comorbidityId) => {
            const comorbidity = COMORBIDITIES.find((c) => c.id === comorbidityId);
            if (!comorbidity) return null;
            return (
              <Badge
                key={comorbidityId}
                onPress={() => handleToggle(comorbidityId)}>
                {comorbidity.label} ×
              </Badge>
            );
          })}
        </View>
      )}

      <ScrollView style={{ maxHeight: 300 }}>
        {Object.entries(groupedComorbidities).map(([category, items]) => {
          if (items.length === 0) return null;
          return (
            <View key={category}>
              <Text style={styles.categoryTitle}>
                {COMORBIDITY_CATEGORIES[category]}
              </Text>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.comorbidityItem,
                    value.includes(item.id) && styles.selectedItem,
                  ]}
                  onPress={() => handleToggle(item.id)}>
                  <Text style={styles.itemText}>{item.label}</Text>
                  {value.includes(item.id) && (
                    <Icon name="check" size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}