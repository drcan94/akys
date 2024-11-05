export const COMORBIDITY_CATEGORIES = {
  CARDIOVASCULAR: "Kardiyovasküler",
  RESPIRATORY: "Solunum",
  ENDOCRINE: "Endokrin",
  RENAL: "Böbrek",
  HEPATIC: "Karaciğer",
  NEUROLOGICAL: "Nörolojik",
  HEMATOLOGIC: "Hematolojik",
  MUSCULOSKELETAL: "Kas-İskelet",
  PSYCHIATRIC: "Psikiyatrik",
  OTHER: "Diğer",
} as const;

export type ComorbidityCategory = keyof typeof COMORBIDITY_CATEGORIES;

export interface Comorbidity {
  id: string;
  label: string;
  category: ComorbidityCategory;
  icd10?: string;
  requiredTests?: string[];
}

export const COMORBIDITIES: Comorbidity[] = [
  // Cardiovascular
  {
    id: "hypertension",
    label: "Hipertansiyon",
    category: "CARDIOVASCULAR",
    icd10: "I10",
    requiredTests: ["EKG", "Kardiyoloji Konsültasyonu", "Kan Basıncı Takibi"],
  },
  {
    id: "cad",
    label: "Koroner Arter Hastalığı",
    category: "CARDIOVASCULAR",
    icd10: "I25.1",
    requiredTests: ["EKG", "Kardiyoloji Konsültasyonu", "Troponin", "EKO"],
  },
  // Respiratory
  {
    id: "copd",
    label: "KOAH",
    category: "RESPIRATORY",
    icd10: "J44.9",
    requiredTests: ["Solunum Fonksiyon Testi", "Akciğer Grafisi", "Arteriyel Kan Gazı"],
  },
  {
    id: "asthma",
    label: "Astım",
    category: "RESPIRATORY",
    icd10: "J45",
    requiredTests: ["Solunum Fonksiyon Testi", "Peak Flow Ölçümü"],
  },
  // Endocrine
  {
    id: "dm_type1",
    label: "Tip 1 Diabetes Mellitus",
    category: "ENDOCRINE",
    icd10: "E10",
    requiredTests: ["HbA1c", "Açlık Kan Şekeri", "Böbrek Fonksiyon Testleri"],
  },
  {
    id: "dm_type2",
    label: "Tip 2 Diabetes Mellitus",
    category: "ENDOCRINE",
    icd10: "E11",
    requiredTests: ["HbA1c", "Açlık Kan Şekeri", "Lipid Profili"],
  },
  {
    id: "hypothyroidism",
    label: "Hipotiroidi",
    category: "ENDOCRINE",
    icd10: "E03.9",
    requiredTests: ["TSH", "sT4", "sT3"],
  },
  // Renal
  {
    id: "ckd",
    label: "Kronik Böbrek Hastalığı",
    category: "RENAL",
    icd10: "N18",
    requiredTests: ["Kreatinin", "BUN", "eGFR", "Elektrolit Paneli"],
  },
  // Hepatic
  {
    id: "cirrhosis",
    label: "Karaciğer Sirozu",
    category: "HEPATIC",
    icd10: "K74.6",
    requiredTests: ["Karaciğer Fonksiyon Testleri", "Koagülasyon Profili", "Albümin"],
  },
  // Add more comorbidities as needed...
];