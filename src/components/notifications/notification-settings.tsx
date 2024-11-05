"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Bell,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const formSchema = z.object({
  operationNotes: z.boolean(),
  messages: z.boolean(),
  patientUpdates: z.boolean(),
  mentions: z.boolean(),
  reactions: z.boolean(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  dailyDigest: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function NotificationSettings() {
  const { toast } = useToast();
  const utils = api.useUtils();
  const {
    isEnabled: isPushEnabled,
    isPending: isPushPending,
    enableNotifications: enablePushNotifications,
    disableNotifications: disablePushNotifications,
  } = usePushNotifications();

  const { data: settings, isLoading: isLoadingSettings } =
    api.notification.getSettings.useQuery();

  const { mutate: updateSettings, isLoading: isUpdating } =
    api.notification.updateSettings.useMutation({
      onSuccess: () => {
        toast({
          description: "Bildirim ayarları başarıyla güncellendi.",
        });
        utils.notification.getSettings.invalidate();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Hata",
          description:
            error.message || "Ayarlar güncellenirken bir hata oluştu.",
        });
      },
    });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operationNotes: true,
      messages: true,
      patientUpdates: true,
      mentions: true,
      reactions: true,
      emailNotifications: false,
      pushNotifications: false,
      dailyDigest: false,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const onSubmit = async (values: FormValues) => {
    // Handle push notification permission
    if (values.pushNotifications && !isPushEnabled) {
      const success = await enablePushNotifications();
      if (!success) {
        form.setValue("pushNotifications", false);
        return;
      }
    } else if (!values.pushNotifications && isPushEnabled) {
      await disablePushNotifications();
    }

    updateSettings(values);
  };

  if (isLoadingSettings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirim Tercihleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="operationNotes"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <FormLabel className="text-base">
                              Operasyon Notları
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Yeni operasyon notu eklendiğinde veya mevcut notlar
                            güncellendiğinde bildirim al
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isUpdating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="messages"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            <FormLabel className="text-base">
                              Mesajlar
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Yeni mesaj aldığınızda bildirim al
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isUpdating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mentions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <FormLabel className="text-base">
                              Bahsedilmeler
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Bir mesajda veya notta bahsedildiğinizde bildirim al
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isUpdating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reactions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <FormLabel className="text-base">
                              Tepkiler
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Mesajlarınıza tepki eklendiğinde bildirim al
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isUpdating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patientUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <FormLabel className="text-base">
                              Hasta Güncellemeleri
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Hasta bilgileri güncellendiğinde bildirim al
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isUpdating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <FormLabel className="text-base">
                              Anlık Bildirimler
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Tarayıcı ve mobil cihazlarda anlık bildirimler al
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isUpdating || isPushPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <FormLabel className="text-base">
                              E-posta Bildirimleri
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Önemli bildirimleri e-posta olarak al
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isUpdating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dailyDigest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <FormLabel className="text-base">
                              Günlük Özet
                            </FormLabel>
                          </div>
                          <FormDescription>
                            Günlük aktivite özetini e-posta olarak al
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={
                              isUpdating || !form.watch("emailNotifications")
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {!form.watch("emailNotifications") &&
                  form.watch("dailyDigest") && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Günlük özet alabilmek için e-posta bildirimlerini
                        etkinleştirmelisiniz.
                      </AlertDescription>
                    </Alert>
                  )}
              </div>

              <Button type="submit" disabled={isUpdating || isPushPending}>
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUpdating ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
