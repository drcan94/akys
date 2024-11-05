"use client";

import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { api } from '../lib/api';
import { useToast } from './use-toast';
import { useNavigation } from '@react-navigation/native';
import { pusherClient, toPusherKey } from '../lib/pusher';
import { type AnesthesiaMethod } from '../types';

const validationSchema = Yup.object().shape({
  patientId: Yup.string().required(),
  procedureDate: Yup.date().required('İşlem tarihi gereklidir'),
  procedureStartTime: Yup.string().required('Başlangıç saati gereklidir'),
  procedureEndTime: Yup.string().required('Bitiş saati gereklidir'),
  anesthesiaMethod: Yup.string().required('Anestezi yöntemi gereklidir'),
  medicationsAdministered: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().required('İlaç adı gereklidir'),
        dosage: Yup.string().required('Doz bilgisi gereklidir'),
        route: Yup.string().required('Uygulama yolu gereklidir'),
        time: Yup.string().required('Uygulama saati gereklidir'),
      })
    )
    .min(1, 'En az bir ilaç girilmelidir'),
  monitoringDetails: Yup.string()
    .required('Monitörizasyon detayları gereklidir')
    .min(10, 'En az 10 karakter olmalıdır'),
  vitalSigns: Yup.object().shape({
    bloodPressure: Yup.string()
      .required('Kan basıncı gereklidir')
      .matches(/^\d{2,3}\/\d{2,3}$/, 'Geçerli bir kan basıncı değeri giriniz'),
    heartRate: Yup.string()
      .required('Kalp hızı gereklidir')
      .matches(/^\d{2,3}$/, 'Geçerli bir kalp hızı değeri giriniz'),
    oxygenSaturation: Yup.string()
      .required('SpO2 gereklidir')
      .matches(/^\d{2,3}$/, 'Geçerli bir SpO2 değeri giriniz'),
    temperature: Yup.string()
      .required('Vücut sıcaklığı gereklidir')
      .matches(/^\d{2}(\.\d)?$/, 'Geçerli bir vücut sıcaklığı değeri giriniz'),
  }),
  intraoperativeEvents: Yup.string()
    .required('İntraoperatif olaylar gereklidir')
    .min(10, 'En az 10 karakter olmalıdır'),
  complications: Yup.array().of(Yup.string()),
  postoperativeInstructions: Yup.string()
    .required('Postoperatif talimatlar gereklidir')
    .min(10, 'En az 10 karakter olmalıdır'),
});

interface UseOperationNoteParams {
  patientId: string;
  noteId?: string;
}

export function useOperationNote({ patientId, noteId }: UseOperationNoteParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [collaborators, setCollaborators] = useState<Set<string>>(new Set());
  const { showToast } = useToast();
  const navigation = useNavigation();

  const form = useFormik({
    initialValues: {
      patientId,
      procedureDate: new Date(),
      procedureStartTime: '',
      procedureEndTime: '',
      anesthesiaMethod: '' as AnesthesiaMethod,
      medicationsAdministered: [],
      monitoringDetails: '',
      vitalSigns: {
        bloodPressure: '',
        heartRate: '',
        oxygenSaturation: '',
        temperature: '',
      },
      intraoperativeEvents: '',
      complications: [],
      postoperativeInstructions: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        if (noteId) {
          await api.put(`/api/operation-notes/${noteId}`, values);
        } else {
          await api.post('/api/operation-notes', values);
        }
        showToast({
          type: 'success',
          message: noteId
            ? 'Operasyon notu güncellendi'
            : 'Operasyon notu oluşturuldu',
        });
        navigation.goBack();
      } catch (error) {
        showToast({
          type: 'error',
          message: 'Bir hata oluştu',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Load initial data
  useEffect(() => {
    if (!noteId) return;

    const loadNote = async () => {
      try {
        const note = await api.get(`/api/operation-notes/${noteId}`);
        form.setValues(note);
      } catch (error) {
        showToast({
          type: 'error',
          message: 'Not yüklenirken bir hata oluştu',
        });
      }
    };

    loadNote();
  }, [noteId]);

  // Real-time collaboration
  useEffect(() => {
    if (!noteId) return;

    const channel = pusherClient.subscribe(
      toPusherKey(`operation-note:${noteId}`)
    );

    channel.bind('note-updated', (data: any) => {
      if (data.lockedById !== userId) {
        form.setValues(data);
      }
    });

    channel.bind('user-joined', (data: {
      userId: string;
      userName: string;
    }) => {
      setCollaborators((prev) => new Set(prev).add(data.userId));
    });

    channel.bind('user-left', (data: { userId: string }) => {
      setCollaborators((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    channel.bind('note-locked', (data: {
      userId: string;
      userName: string;
    }) => {
      setIsLocked(true);
      setLockedBy({
        id: data.userId,
        name: data.userName,
      });
    });

    channel.bind('note-unlocked', () => {
      setIsLocked(false);
      setLockedBy(null);
    });

    return () => {
      pusherClient.unsubscribe(toPusherKey(`operation-note:${noteId}`));
    };
  }, [noteId]);

  const handleStartEditing = async () => {
    if (!noteId) return;

    try {
      await api.post(`/api/operation-notes/${noteId}/lock`);
      return true;
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Not düzenlenemedi',
      });
      return false;
    }
  };

  const handleStopEditing = async () => {
    if (!noteId) return;

    try {
      await api.post(`/api/operation-notes/${noteId}/unlock`);
    } catch (error) {
      console.error('Error unlocking note:', error);
    }
  };

  return {
    form,
    isSubmitting,
    isLocked,
    lockedBy,
    collaborators,
    handleSubmit: form.handleSubmit,
    handleStartEditing,
    handleStopEditing,
  };
}