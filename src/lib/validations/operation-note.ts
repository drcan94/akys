"use client";

import * as z from "zod";
import { AnesthesiaMethod } from "@prisma/client";

export const medicationSchema = z.object({
  name: z.string().min(1, "İlaç adı gereklidir"),
  dosage: z.string()
    .min(1, "Doz bilgisi gereklidir")
    .regex(/^[\d.,]+\s*(?:mg|mcg|g|ml|IU|IE|U)?$/i, "Geçerli bir doz giriniz (örn: 100 mg)"),
  route: z.string().min(1, "Uygulama yolu gereklidir"),
  time: z.string().min(1, "Uygulama saati gereklidir"),
});

export const operationNoteSchema = z.object({
  patientId: z.string(),
  procedureDate: z.date(),
  procedureStartTime: z.string().min(1, "Başlangıç saati gereklidir"),
  procedureEndTime: z.string().min(1, "Bitiş saati gereklidir"),
  anesthesiaMethod: z.nativeEnum(AnesthesiaMethod),
  medicationsAdministered: z.array(medicationSchema)
    .min(1, "En az bir ilaç girilmelidir"),
  monitoringDetails: z.string()
    .min(10, "Monitörizasyon detayları en az 10 karakter olmalıdır")
    .max(1000, "Monitörizasyon detayları 1000 karakteri geçemez"),
  vitalSigns: z.object({
    bloodPressure: z.string()
      .regex(/^\d{2,3}\/\d{2,3}$/, "Geçerli bir kan basıncı değeri giriniz (örn: 120/80)"),
    heartRate: z.string()
      .regex(/^\d{2,3}$/, "Geçerli bir kalp hızı değeri giriniz")
      .refine((val) => parseInt(val) >= 30 && parseInt(val) <= 200, {
        message: "Kalp hızı 30-200 arasında olmalıdır",
      }),
    oxygenSaturation: z.string()
      .regex(/^\d{2,3}$/, "Geçerli bir SpO2 değeri giriniz")
      .refine((val) => parseInt(val) >= 70 && parseInt(val) <= 100, {
        message: "SpO2 70-100 arasında olmalıdır",
      }),
    temperature: z.string()
      .regex(/^\d{2}(\.\d)?$/, "Geçerli bir vücut sıcaklığı değeri giriniz")
      .refine((val) => parseFloat(val) >= 35 && parseFloat(val) <= 42, {
        message: "Vücut sıcaklığı 35-42°C arasında olmalıdır",
      }),
  }),
  intraoperativeEvents: z.string()
    .min(10, "İntraoperatif olaylar en az 10 karakter olmalıdır")
    .max(1000, "İntraoperatif olaylar 1000 karakteri geçemez"),
  complications: z.array(z.string()).optional(),
  postoperativeInstructions: z.string()
    .min(10, "Postoperatif talimatlar en az 10 karakter olmalıdır")
    .max(1000, "Postoperatif talimatlar 1000 karakteri geçemez"),
}).refine((data) => {
  const start = new Date(`2000-01-01T${data.procedureStartTime}`);
  const end = new Date(`2000-01-01T${data.procedureEndTime}`);
  return end > start;
}, {
  message: "Bitiş saati başlangıç saatinden sonra olmalıdır",
  path: ["procedureEndTime"],
});

export type OperationNoteFormValues = z.infer<typeof operationNoteSchema>;

export const anesthesiaMethodLabels: Record<AnesthesiaMethod, string> = {
  GENERAL: "Genel Anestezi",
  REGIONAL: "Rejyonel Anestezi",
  LOCAL: "Lokal Anestezi",
  SEDATION: "Sedasyon",
  COMBINED: "Kombine Anestezi",
};

export const commonComplications = [
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
] as const;