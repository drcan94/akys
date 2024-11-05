"use client";

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { api } from '../lib/api';
import { useToast } from './use-toast';
import { useNavigation } from '@react-navigation/native';
import { type AsaScore } from '../types';

const validationSchema = Yup.object().shape({
  evaluationDate: Yup.date().required('Değerlendirme tarihi gereklidir'),
  asaScore: Yup.string().required('ASA skoru gereklidir'),
  comorbidities: Yup.array().of(Yup.string()),
  requiredTests: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required(),
      result: Yup.string(),
      isRequired: Yup.boolean(),
    })
  ),
  consentObtained: Yup.boolean(),
  allergies: Yup.string(),
  medications: Yup.string(),
  notes: Yup.string(),
});

export function usePatientEvaluation(patientId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigation = useNavigation();

  const form = useFormik({
    initialValues: {
      patientId,
      evaluationDate: new Date(),
      asaScore: '' as AsaScore,
      comorbidities: [],
      requiredTests: [],
      consentObtained: false,
      allergies: '',
      medications: '',
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        await api.post('/api/evaluations', values);
        showToast({
          type: 'success',
          message: 'Değerlendirme başarıyla kaydedildi',
        });
        navigation.goBack();
      } catch (error) {
        showToast({
          type: 'error',
          message: 'Değerlendirme kaydedilirken bir hata oluştu',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleComorbidityChange = (comorbidities: string[]) => {
    form.setFieldValue('comorbidities', comorbidities);
  };

  const handleTestResultChange = (testName: string, result: string) => {
    const tests = [...form.values.requiredTests];
    const testIndex = tests.findIndex((t) => t.name === testName);
    
    if (testIndex >= 0) {
      tests[testIndex] = { ...tests[testIndex], result };
    } else {
      tests.push({ name: testName, result, isRequired: true });
    }
    
    form.setFieldValue('requiredTests', tests);
  };

  return {
    form,
    isSubmitting,
    handleSubmit: form.handleSubmit,
    handleComorbidityChange,
    handleTestResultChange,
  };
}