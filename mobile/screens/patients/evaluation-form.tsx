"use client";

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { DatePicker } from '../../components/ui/date-picker';
import { ComorbiditySelect } from '../../components/ui/comorbidity-select';
import { RequiredTestsSection } from '../../components/ui/required-tests-section';
import { Icon } from '../../components/ui/icon';
import { Colors } from '../../constants/colors';
import { useToast } from '../../hooks/use-toast';
import { usePatientEvaluation } from '../../hooks/use-patient-evaluation';
import { AsaScore } from '../../types';

const asaScoreOptions = [
  { label: 'ASA 1 - Sağlıklı hasta', value: 'ASA_1' },
  { label: 'ASA 2 - Hafif sistemik hastalık', value: 'ASA_2' },
  { label: 'ASA 3 - Ciddi sistemik hastalık', value: 'ASA_3' },
  { label: 'ASA 4 - Hayatı tehdit eden sistemik hastalık', value: 'ASA_4' },
  { label: 'ASA 5 - Ameliyat olmadan yaşaması beklenmeyen hasta', value: 'ASA_5' },
  { label: 'ASA 6 - Beyin ölümü gerçekleşmiş, organ donörü hasta', value: 'ASA_6' },
  { label: 'ASA 1E - ASA 1 + Acil ameliyat', value: 'ASA_1E' },
  { label: 'ASA 2E - ASA 2 + Acil ameliyat', value: 'ASA_2E' },
  { label: 'ASA 3E - ASA 3 + Acil ameliyat', value: 'ASA_3E' },
  { label: 'ASA 4E - ASA 4 + Acil ameliyat', value: 'ASA_4E' },
  { label: 'ASA 5E - ASA 5 + Acil ameliyat', value: 'ASA_5E' },
];

export function EvaluationFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { patientId } = route.params as { patientId: string };

  const {
    form,
    isSubmitting,
    handleSubmit,
    handleComorbidityChange,
    handleTestResultChange,
  } = usePatientEvaluation(patientId);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.darker : Colors.lighter,
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
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme === 'dark' ? Colors.white : Colors.black,
      marginBottom: 8,
    },
    description: {
      fontSize: 12,
      color: theme === 'dark' ? Colors.grayLight : Colors.grayDark,
      marginTop: 4,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 8,
    },
    error: {
      fontSize: 12,
      color: Colors.error,
      marginTop: 4,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Temel Bilgiler</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Değerlendirme Tarihi</Text>
            <DatePicker
              value={form.values.evaluationDate}
              onChange={(date) => form.setFieldValue('evaluationDate', date)}
              error={form.errors.evaluationDate}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>ASA Skoru</Text>
            <Select
              value={form.values.asaScore}
              onValueChange={(value) => form.setFieldValue('asaScore', value)}
              options={asaScoreOptions}
              error={form.errors.asaScore}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Komorbiditeler</Text>
          <ComorbiditySelect
            value={form.values.comorbidities}
            onChange={handleComorbidityChange}
            error={form.errors.comorbidities}
          />
        </Card>

        <RequiredTestsSection
          comorbidities={form.values.comorbidities}
          onTestResultChange={handleTestResultChange}
          values={form.values.requiredTests}
          errors={form.errors.requiredTests}
        />

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Alerjiler ve İlaçlar</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Alerjiler</Text>
            <Input
              value={form.values.allergies}
              onChangeText={(text) => form.setFieldValue('allergies', text)}
              placeholder="Bilinen alerjileri yazın..."
              multiline
              error={form.errors.allergies}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Kullandığı İlaçlar</Text>
            <Input
              value={form.values.medications}
              onChangeText={(text) => form.setFieldValue('medications', text)}
              placeholder="Düzenli kullandığı ilaçları yazın..."
              multiline
              error={form.errors.medications}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Onam ve Notlar</Text>
          
          <View style={styles.switchContainer}>
            <View>
              <Text style={styles.label}>Onam Alındı</Text>
              <Text style={styles.description}>
                Hastadan veya yasal temsilcisinden onam alındığını onaylayın
              </Text>
            </View>
            <Switch
              value={form.values.consentObtained}
              onValueChange={(value) =>
                form.setFieldValue('consentObtained', value)
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ek Notlar</Text>
            <Input
              value={form.values.notes}
              onChangeText={(text) => form.setFieldValue('notes', text)}
              placeholder="Ek notlar..."
              multiline
              numberOfLines={4}
              error={form.errors.notes}
            />
          </View>
        </Card>

        <View style={{ marginBottom: 24 }}>
          <Button
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}