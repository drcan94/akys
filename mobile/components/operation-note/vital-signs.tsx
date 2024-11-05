"use client";

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/use-theme';
import { Input } from '../ui/input';
import { Colors } from '../../constants/colors';

interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  oxygenSaturation: string;
  temperature: string;
}

interface VitalSignsProps {
  value: VitalSigns;
  onChange: (vitalSigns: VitalSigns) => void;
  errors?: Partial<Record<keyof VitalSigns, string>>;
}

export function VitalSigns({ value, onChange, errors }: VitalSignsProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    inputWrapper: {
      flex: 1,
      minWidth: '45%',
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 8,
    },
    hint: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Kan Basıncı</Text>
          <Input
            value={value.bloodPressure}
            onChangeText={(text) =>
              onChange({ ...value, bloodPressure: text })
            }
            placeholder="120/80"
            error={errors?.bloodPressure}
          />
          <Text style={styles.hint}>Örn: 120/80</Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Kalp Hızı</Text>
          <Input
            value={value.heartRate}
            onChangeText={(text) =>
              onChange({ ...value, heartRate: text })
            }
            placeholder="80"
            keyboardType="numeric"
            error={errors?.heartRate}
          />
          <Text style={styles.hint}>atım/dk</Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>SpO2</Text>
          <Input
            value={value.oxygenSaturation}
            onChangeText={(text) =>
              onChange({ ...value, oxygenSaturation: text })
            }
            placeholder="98"
            keyboardType="numeric"
            error={errors?.oxygenSaturation}
          />
          <Text style={styles.hint}>%</Text>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Vücut Sıcaklığı</Text>
          <Input
            value={value.temperature}
            onChangeText={(text) =>
              onChange({ ...value, temperature: text })
            }
            placeholder="36.5"
            keyboardType="numeric"
            error={errors?.temperature}
          />
          <Text style={styles.hint}>°C</Text>
        </View>
      </View>
    </View>
  );
}