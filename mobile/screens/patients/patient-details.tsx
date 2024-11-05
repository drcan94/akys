"use client";

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/use-theme';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs } from '../../components/ui/tabs';
import { Icon } from '../../components/ui/icon';
import { Colors } from '../../constants/colors';
import { usePatient } from '../../hooks/use-patient';

export function PatientDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { patientId } = route.params as { patientId: string };
  const { data: patient, isLoading } = usePatient(patientId);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? Colors.darkBorder : Colors.lightBorder,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 8,
    },
    badgeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    content: {
      padding: 16,
    },
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
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
    },
    infoValue: {
      fontSize: 14,
      color: theme === 'dark' ? Colors.white : Colors.black,
      fontWeight: '500',
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
  });

  if (isLoading || !patient) {
    return null; // Show loading state
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {patient.firstName} {patient.lastName}
          </Text>
          <View style={styles.badgeContainer}>
            <Badge>{patient.medicalRecordNumber}</Badge>
            <Badge>
              {format(new Date(patient.dateOfBirth), 'P', { locale: tr })}
            </Badge>
            <Badge>{patient.gender}</Badge>
            {patient.bloodType && <Badge>{patient.bloodType}</Badge>}
          </View>
        </View>

        <View style={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Protokol No</Text>
              <Text style={styles.infoValue}>{patient.medicalRecordNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Doğum Tarihi</Text>
              <Text style={styles.infoValue}>
                {format(new Date(patient.dateOfBirth), 'P', { locale: tr })}
              </Text>
            </View>
            {patient.phoneNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{patient.phoneNumber}</Text>
              </View>
            )}
            {patient.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>E-posta</Text>
                <Text style={styles.infoValue}>{patient.email}</Text>
              </View>
            )}
          </Card>

          <Tabs
            tabs={[
              {
                key: 'evaluations',
                title: 'Değerlendirmeler',
                content: (
                  <Card style={styles.card}>
                    <Text style={styles.cardTitle}>
                      Preoperatif Değerlendirmeler
                    </Text>
                    {/* Preoperative evaluations list */}
                  </Card>
                ),
              },
              {
                key: 'operations',
                title: 'Operasyonlar',
                content: (
                  <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Operasyon Notları</Text>
                    {/* Operation notes list */}
                  </Card>
                ),
              },
            ]}
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('NewEvaluation', { patientId: patient.id })
        }>
        <Icon name="plus" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}