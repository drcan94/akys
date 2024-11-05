"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Users } from "lucide-react";
import { MedicationList } from "./medication-list";
import { pusherClient, toPusherKey } from "@/lib/pusher";
import {
  operationNoteSchema,
  type OperationNoteFormValues,
} from "@/lib/validations/operation-note";
import {
  type AnesthesiaMethod,
  type Patient,
  type OperationNote,
} from "@prisma/client";

interface OperationNoteFormProps {
  patient: Patient;
  initialData?: OperationNote | null;
  step: "basic" | "medications" | "monitoring" | "details";
  onNext?: (data: Partial<OperationNoteFormValues>) => void;
  onBack?: () => void;
}

export function OperationNoteForm({
  patient,
  initialData,
  step,
  onNext,
  onBack,
}: OperationNoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const { data: session } = useSession();
  const { toast } = useToast();
  const utils = api.useUtils();

  const form = useForm<OperationNoteFormValues>({
    resolver: zodResolver(operationNoteSchema),
    defaultValues: {
      patientId: patient.id,
      procedureDate: new Date(),
      procedureStartTime: format(new Date(), "HH:mm"),
      procedureEndTime: format(new Date(), "HH:mm"),
      anesthesiaMethod: initialData?.anesthesiaMethod || "GENERAL",
      medicationsAdministered: initialData?.medicationsAdministered || [],
      monitoringDetails: initialData?.monitoringDetails || "",
      vitalSigns: initialData?.vitalSigns || {
        bloodPressure: "",
        heartRate: "",
        oxygenSaturation: "",
        temperature: "",
      },
      intraoperativeEvents: initialData?.intraoperativeEvents || "",
      complications: initialData?.complications || [],
      postoperativeInstructions: initialData?.postoperativeInstructions || "",
      ...initialData,
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!initialData?.id) return;

    const channel = pusherClient.subscribe(
      toPusherKey(`operation-note:${initialData.id}`)
    );

    channel.bind("note-updated", (data: OperationNote) => {
      if (data.lockedById !== session?.user.id) {
        form.reset(data);
        toast({
          title: "Not Güncellendi",
          description: "Başka bir kullanıcı notu güncelledi.",
        });
      }
    });

    channel.bind(
      "user-active",
      ({ userId, userName }: { userId: string; userName: string }) => {
        setActiveUsers((prev) => new Set(prev).add(userId));
        if (userId !== session?.user.id) {
          toast({
            title: "Aktif Kullanıcı",
            description: `${userName} şu anda bu notu görüntülüyor.`,
          });
        }
      }
    );

    channel.bind("user-inactive", ({ userId }: { userId: string }) => {
      setActiveUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      pusherClient.unsubscribe(toPusherKey(`operation-note:${initialData.id}`));
    };
  }, [initialData?.id, session?.user.id, form, toast]);

  // Handle form submission
  const onSubmit = async (values: OperationNoteFormValues) => {
    if (step !== "details") {
      onNext?.(values);
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialData?.id) {
        await utils.operationNote.update.mutate({
          id: initialData.id,
          data: values,
        });
      } else {
        await utils.operationNote.create.mutate(values);
      }

      toast({
        title: "Başarılı",
        description: initialData?.id
          ? "Operasyon notu güncellendi."
          : "Operasyon notu oluşturuldu.",
      });

      onNext?.(values);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "basic":
        return (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="procedureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İşlem Tarihi</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={format(field.value, "yyyy-MM-dd")}
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="anesthesiaMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anestezi Yöntemi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Yöntem seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GENERAL">Genel Anestezi</SelectItem>
                        <SelectItem value="REGIONAL">
                          Rejyonel Anestezi
                        </SelectItem>
                        <SelectItem value="LOCAL">Lokal Anestezi</SelectItem>
                        <SelectItem value="SEDATION">Sedasyon</SelectItem>
                        <SelectItem value="COMBINED">
                          Kombine Anestezi
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedureStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlangıç Saati</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="procedureEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bitiş Saati</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );

      case "medications":
        return (
          <FormField
            control={form.control}
            name="medicationsAdministered"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Uygulanan İlaçlar</FormLabel>
                <FormControl>
                  <MedicationList
                    value={field.value}
                    onChange={field.onChange}
                    error={
                      form.formState.errors.medicationsAdministered?.message
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "monitoring":
        return (
          <>
            <FormField
              control={form.control}
              name="monitoringDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monitörizasyon Detayları</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Monitörizasyon detaylarını girin..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vitalSigns.bloodPressure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kan Basıncı</FormLabel>
                    <FormControl>
                      <Input placeholder="120/80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vitalSigns.heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kalp Hızı</FormLabel>
                    <FormControl>
                      <Input placeholder="80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vitalSigns.oxygenSaturation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SpO2</FormLabel>
                    <FormControl>
                      <Input placeholder="98" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vitalSigns.temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vücut Sıcaklığı</FormLabel>
                    <FormControl>
                      <Input placeholder="36.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );

      case "details":
        return (
          <>
            <FormField
              control={form.control}
              name="intraoperativeEvents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İntraoperatif Olaylar</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="İntraoperatif olayları girin..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="complications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Komplikasyonlar</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) =>
                        field.onChange([...field.value, value])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Komplikasyon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HYPOTENSION">
                          Hipotansiyon
                        </SelectItem>
                        <SelectItem value="HYPERTENSION">
                          Hipertansiyon
                        </SelectItem>
                        <SelectItem value="BRADYCARDIA">Bradikardi</SelectItem>
                        <SelectItem value="TACHYCARDIA">Taşikardi</SelectItem>
                        <SelectItem value="DESATURATION">
                          Desatürasyon
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {field.value.map((complication) => (
                      <Badge
                        key={complication}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() =>
                          field.onChange(
                            field.value.filter((c) => c !== complication)
                          )
                        }
                      >
                        {complication} ×
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postoperativeInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postoperatif Talimatlar</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Postoperatif talimatları girin..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {activeUsers.size > 1 && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              {activeUsers.size} kullanıcı bu notu görüntülüyor
            </AlertDescription>
          </Alert>
        )}

        {initialData?.isLocked &&
          initialData.lockedById !== session?.user.id && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bu not başka bir kullanıcı tarafından düzenleniyor
              </AlertDescription>
            </Alert>
          )}

        {renderStepContent()}

        <div className="flex justify-end gap-4">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Geri
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : step === "details" ? (
              "Kaydet"
            ) : (
              "İleri"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
