"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AsaScore } from "@prisma/client";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ComorbiditySelect } from "./comorbidity-select";
import { RequiredTestsSection } from "./required-tests-section";

const formSchema = z.object({
  patientId: z.string(),
  evaluationDate: z.date(),
  asaScore: z.nativeEnum(AsaScore),
  comorbidities: z.array(z.string()),
  requiredTests: z.array(
    z.object({
      name: z.string(),
      result: z.string().optional(),
      date: z.date().optional(),
      isRequired: z.boolean(),
    })
  ),
  consentObtained: z.boolean(),
  allergies: z.string().optional(),
  medications: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
    })
  ),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const asaScoreDescriptions: Record<AsaScore, string> = {
  ASA_1: "Sağlıklı hasta",
  ASA_2: "Hafif sistemik hastalık",
  ASA_3: "Ciddi sistemik hastalık",
  ASA_4: "Hayatı tehdit eden sistemik hastalık",
  ASA_5: "Ameliyat olmadan yaşaması beklenmeyen hasta",
  ASA_6: "Beyin ölümü gerçekleşmiş, organ donörü hasta",
  ASA_1E: "ASA 1 + Acil ameliyat",
  ASA_2E: "ASA 2 + Acil ameliyat",
  ASA_3E: "ASA 3 + Acil ameliyat",
  ASA_4E: "ASA 4 + Acil ameliyat",
  ASA_5E: "ASA 5 + Acil ameliyat",
};

interface PreoperativeEvaluationFormProps {
  patientId: string;
  onSuccess?: () => void;
}

export function PreoperativeEvaluationForm({
  patientId,
  onSuccess,
}: PreoperativeEvaluationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId,
      evaluationDate: new Date(),
      comorbidities: [],
      requiredTests: [],
      consentObtained: false,
      medications: [],
    },
  });

  const { mutate: createEvaluation } =
    api.preoperativeEvaluation.create.useMutation({
      onSuccess: () => {
        toast({
          title: "Başarılı",
          description: "Preoperatif değerlendirme kaydedildi.",
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error.message,
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    createEvaluation(values);
  };

  const watchedComorbidities = form.watch("comorbidities");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="evaluationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Değerlendirme Tarihi</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={format(field.value, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="asaScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ASA Skoru</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="ASA skoru seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(asaScoreDescriptions).map(
                      ([score, description]) => (
                        <SelectItem key={score} value={score}>
                          {score.replace("_", " ")} - {description}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="comorbidities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Komorbiditeler</FormLabel>
              <FormControl>
                <ComorbiditySelect
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <RequiredTestsSection
          form={form}
          comorbidities={watchedComorbidities}
        />

        <FormField
          control={form.control}
          name="allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alerjiler</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Bilinen alerjileri yazın..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consentObtained"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Onam Alındı</FormLabel>
                <FormDescription>
                  Hastadan veya yasal temsilcisinden onam alındığını onaylayın
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea placeholder="Ek notlar..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>
    </Form>
  );
}
