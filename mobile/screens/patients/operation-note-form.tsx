"use client";

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTheme } from '../../hooks/use-theme';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { DatePicker } from '../../components/ui/date-picker';
import { TimePicker } from '../../components/ui/time-picker';
import { MedicationList } from '../../components/operation-note/medication-list';
import { VitalSigns } from '../../components/operation-note/vital-signs';
import { ComplicationSelect } from '../../components/operation-note/complication-select';
import { ActiveCollaborators } from '../../components/operation-note/active-collaborators';
import { Colors } from '../../constants/colors';
import { useOperationNote } from '../../hooks/use-operation-note';
import { type AnesthesiaMethod } from '../../types';

const anesthesiaMethodOptions = [
  { label: 'Genel Anestezi', value: 'GENERAL' },
  { label: 'Rejyonel Anestezi', value: 'REGIONAL' },
  { label: 'Lokal Anestezi', value: 'LOCAL' },
  { label: 'Sedasyon', value: 'SEDATION' },
  { label: 'Kombine Anestezi', value: 'COMBINED' },
];

export function OperationNoteFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { patientId, noteId } = route.params as { patientId: string; noteId?: string };

  const {
    form,
    isSubmitting,
    isLocked,
    lockedBy,
    collaborators,
    handleSubmit,
    handleStartEditing,
    handleStopEditing,
  } = useOperationNote({ patientId, noteId });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
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
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 8,
    },
    error: {
      fontSize: 12,
      color: Colors.error,
      marginTop: 4,
    },
    timeInputs: {
      flexDirection: 'row',
      gap: 16,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.cardTitle}>
            {noteId ? 'Operasyon Notunu Düzenle' : 'Yeni Operasyon Notu'}
          </Text>
          <ActiveCollaborators
            collaborators={collaborators}
            lockedBy={lockedBy}
          />
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Temel Bilgiler</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>İşlem Tarihi</Text>
            <DatePicker
              value={form.values.procedureDate}
              onChange={(date) => form.setFieldValue('procedureDate', date)}
              error={form.errors.procedureDate}
            />
          </View>

          <View style={styles.timeInputs}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Başlangıç Saati</Text>
              <TimePicker
                value={form.values.procedureStartTime}
                onChange={(time) => form.setFieldValue('procedureStartTime', time)}
                error={form.errors.procedureStartTime}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Bitiş Saati</Text>
              <TimePicker
                value={form.values.procedureEndTime}
                onChange={(time) => form.setFieldValue('procedureEndTime', time)}
                error={form.errors.procedureEndTime}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Anestezi Yöntemi</Text>
            <Select
              value={form.values.anesthesiaMethod}
              onValueChange={(value) =>
                form.setFieldValue('anesthesiaMethod', value as AnesthesiaMethod)
              }
              options={anesthesiaMethodOptions}
              error={form.errors.anesthesiaMethod}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>İlaçlar</Text>
          <MedicationList
            value={form.values.medicationsAdministered}
            onChange={(medications) =>
              form.setFieldValue('medicationsAdministered', medications)
            }
            error={form.errors.medicationsAdministered}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Monitörizasyon</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Monitörizasyon Detayları</Text>
            <Input
              value={form.values.monitoringDetails}
              onChangeText={(text) =>
                form.setFieldValue('monitoringDetails', text)
              }
              placeholder="Monitörizasyon detaylarını girin..."
              multiline
              numberOfLines={4}
              error={form.errors.monitoringDetails}
            />
          </View>

          <VitalSigns
            value={form.values.vitalSigns}
            onChange={(vitalSigns) =>
              form.setFieldValue('vitalSigns', vitalSigns)
            }
            errors={form.errors.vitalSigns}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Detaylar</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>İntraoperatif Olaylar</Text>
            <Input
              value={form.values.intraoperativeEvents}
              onChangeText={(text) =>
                form.setFieldValue('intraoperativeEvents', text)
              }
              placeholder="İntraoperatif olayları girin..."
              multiline
              numberOfLines={4}
              error={form.errors.intraoperativeEvents}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Komplikasyonlar</Text>
            <ComplicationSelect
              value={form.values.complications}
              onChange={(complications) =>
                form.setFieldValue('complications', complications)
              }
              error={form.errors.complications}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Postoperatif Talimatlar</Text>
            <Input
              value={form.values.postoperativeInstructions}
              onChangeText={(text) =>
                form.setFieldValue('postoperativeInstructions', text)
              }
              placeholder="Postoperatif talimatları girin..."
              multiline
              numberOfLines={4}
              error={form.errors.postoperativeInstructions}
            />
          </View>
        </Card>

        <View style={{ marginBottom: 24 }}>
          <Button
            onPress={handleSubmit}
            disabled={isSubmitting || (isLocked && lockedBy?.id !== userId)}
            loading={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}