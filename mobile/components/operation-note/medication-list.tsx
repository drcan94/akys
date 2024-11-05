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
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { TimePicker } from '../ui/time-picker';
import { Icon } from '../ui/icon';
import { Colors } from '../../constants/colors';

const COMMON_MEDICATIONS = [
  "Propofol",
  "Fentanil",
  "Remifentanil",
  "Midazolam",
  "Ketamin",
  "Rokuronyum",
  "Atropin",
  "Neostigmin",
  "Efedrin",
  "Atrakuryum",
  "Sugammadeks",
  "Tiyopental",
  "Sevofluran",
  "Desfluran",
];

const ROUTES = [
  { label: "IV", value: "IV" },
  { label: "IM", value: "IM" },
  { label: "SC", value: "SC" },
  { label: "PO", value: "PO" },
  { label: "İnhalasyon", value: "INHALATION" },
  { label: "Epidural", value: "EPIDURAL" },
  { label: "İntratekal", value: "INTRATHECAL" },
];

interface Medication {
  name: string;
  dosage: string;
  route: string;
  time: string;
}

interface MedicationListProps {
  value: Medication[];
  onChange: (medications: Medication[]) => void;
  error?: string;
}

export function MedicationList({ value, onChange, error }: MedicationListProps) {
  const [newMedication, setNewMedication] = useState<Medication>({
    name: '',
    dosage: '',
    route: 'IV',
    time: '',
  });
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    inputGroup: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    inputWrapper: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 8,
    },
    medicationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.white,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    medicationInfo: {
      flex: 1,
    },
    medicationName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 4,
    },
    medicationDetails: {
      fontSize: 14,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      borderRadius: 8,
      padding: 12,
    },
    addButtonText: {
      color: Colors.white,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
    },
    deleteButton: {
      padding: 8,
    },
    error: {
      color: Colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    suggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    suggestionButton: {
      backgroundColor: theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    suggestionText: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.white : Colors.black,
    },
  });

  const addMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.time) return;

    // Check for duplicates
    const isDuplicate = value.some(
      (med) =>
        med.name === newMedication.name &&
        med.route === newMedication.route &&
        med.time === newMedication.time
    );

    if (isDuplicate) return;

    onChange([...value, newMedication]);
    setNewMedication({
      name: '',
      dosage: '',
      route: 'IV',
      time: '',
    });
  };

  const removeMedication = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.suggestions}>
        {COMMON_MEDICATIONS.map((med) => (
          <TouchableOpacity
            key={med}
            style={styles.suggestionButton}
            onPress={() => setNewMedication({ ...newMedication, name: med })}>
            <Text style={styles.suggestionText}>{med}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <View style={[styles.inputWrapper, { flex: 2 }]}>
          <Text style={styles.label}>İlaç</Text>
          <Input
            value={newMedication.name}
            onChangeText={(text) =>
              setNewMedication({ ...newMedication, name: text })
            }
            placeholder="İlaç adı"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Doz</Text>
          <Input
            value={newMedication.dosage}
            onChangeText={(text) =>
              setNewMedication({ ...newMedication, dosage: text })
            }
            placeholder="100 mg"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Yol</Text>
          <Select
            value={newMedication.route}
            onValueChange={(value) =>
              setNewMedication({ ...newMedication, route: value })
            }
            options={ROUTES}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Saat</Text>
          <TimePicker
            value={newMedication.time}
            onChange={(time) =>
              setNewMedication({ ...newMedication, time: time })
            }
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={addMedication}
        disabled={!newMedication.name || !newMedication.dosage || !newMedication.time}>
        <Icon name="plus" size={16} color={Colors.white} />
        <Text style={styles.addButtonText}>İlaç Ekle</Text>
      </TouchableOpacity>

      <ScrollView style={{ maxHeight: 200, marginTop: 16 }}>
        {value.map((medication, index) => (
          <View key={index} style={styles.medicationItem}>
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDetails}>
                {medication.dosage} - {medication.route} - {medication.time}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeMedication(index)}>
              <Icon
                name="trash-2"
                size={20}
                color={theme === 'dark' ? Colors.error : Colors.errorDark}
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}