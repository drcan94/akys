"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const requiredTestsByComorbidity: Record<string, string[]> = {
  diabetes: ["HbA1c", "Açlık Kan Şekeri"],
  hypertension: ["EKG", "Kardiyoloji Konsültasyonu"],
  coronary_artery_disease: ["EKG", "Kardiyoloji Konsültasyonu", "Troponin"],
  copd: ["Solunum Fonksiyon Testi", "Akciğer Grafisi"],
  ckd: ["Kreatinin", "BUN", "Elektrolit Paneli"],
  liver_disease: ["Karaciğer Fonksiyon Testleri", "Koagülasyon Profili"],
};

interface RequiredTestsSectionProps {
  form: UseFormReturn<any>;
  comorbidities: string[];
}

export function RequiredTestsSection({
  form,
  comorbidities,
}: RequiredTestsSectionProps) {
  const requiredTests = new Set<string>();
  comorbidities.forEach((comorbidity) => {
    const tests = requiredTestsByComorbidity[comorbidity];
    if (tests) {
      tests.forEach((test) => requiredTests.add(test));
    }
  });

  const tests = Array.from(requiredTests);

  if (tests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Seçilen komorbiditeler için aşağıdaki testler gereklidir
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {tests.map((test, index) => (
          <FormField
            key={test}
            control={form.control}
            name={`requiredTests.${index}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{test}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Test sonucu..."
                    {...field}
                    onChange={(e) =>
                      field.onChange({
                        name: test,
                        result: e.target.value,
                        isRequired: true,
                      })
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
