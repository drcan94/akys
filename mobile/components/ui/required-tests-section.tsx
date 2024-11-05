"use client";

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Card } from './card';
import { Input } from './input';
import { Colors } from '../../constants/colors';
import { Icon } from './icon';

interface RequiredTest {
  name: string;
  result?: string;
  isRequired: boolean;
}

interface RequiredTestsSectionProps {
  comorbidities: string[];
  onTestResultChange: (testName: string, result: string) => void;
  values: RequiredTest[];
  errors?: Record<string, string>;
}

export function RequiredTestsSection({
  comorbidities,
  onTestResultChange,
  values,
  errors,
}: RequiredTestsSectionProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      marginBottom: 16,
      padding: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 12,
    },
    alert: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? Colors.primary : Colors.primaryLight,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    alertText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      color: theme === 'dark' ? Colors.white : Colors.primary,
    },
    testGroup: {
      marginBottom: 16,
    },
    testLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 8,
    },
    error: {
      color: Colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });

  const requiredTests = values.filter((test) => test.isRequired);

  if (requiredTests.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Gerekli Testler</Text>

      <View style={styles.alert}>
        <Icon name="alert-circle" size={20} color={Colors.primary} />
        <Text style={styles.alertText}>
          Seçilen komorbiditeler için aşağıdaki testler gereklidir
        </Text>
      </View>

      {requiredTests.map((test) => (
        <View key={test.name} style={styles.testGroup}>
          <Text style={styles.testLabel}>{test.name}</Text>
          <Input
            value={test.result}
            onChangeText={(text) => onTestResultChange(test.name, text)}
            placeholder="Test sonucu..."
            error={errors?.[test.name]}
          />
        </View>
      ))}
    </Card>
  );
}