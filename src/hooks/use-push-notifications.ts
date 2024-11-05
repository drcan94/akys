"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
import {
  requestNotificationPermission,
  onMessageListener,
} from "@/lib/pushNotifications";

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPending, setIsPending] = useState(true);
  const { data: session } = useSession();
  const { toast } = useToast();
  const utils = api.useUtils();

  const { mutate: updateDeviceToken } = api.user.updateDeviceToken.useMutation({
    onSuccess: () => {
      void utils.user.getSettings.invalidate(); // Properly handle the promise
    },
  });

  const { mutate: removeDeviceToken } = api.user.removeDeviceToken.useMutation({
    onSuccess: () => {
      void utils.user.getSettings.invalidate(); // Properly handle the promise
    },
  });

  useEffect(() => {
    if (!session?.user) return;

    // Check if notifications are already enabled
    const checkPermission = async () => {
      if (Notification.permission === "granted") {
        try {
          const token = await requestNotificationPermission();
          if (token) {
            setToken(token);
            updateDeviceToken({ token });
          }
        } catch (error) {
          console.error("Failed to request notification permission:", error);
        }
      }
      setIsPending(false);
    };

    void checkPermission(); // Properly handle the promise

    // Listen for incoming messages
    const unsubscribe = onMessageListener((payload) => {
      if (payload.notification) {
        toast({
          title: payload.notification.title,
          description: payload.notification.body,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [session?.user, toast, updateDeviceToken]);

  const enableNotifications = async () => {
    try {
      setIsPending(true);
      const token = await requestNotificationPermission();
      if (token) {
        setToken(token);
        updateDeviceToken({ token });
        setIsEnabled(true);
        toast({
          title: "Bildirimler Etkin",
          description: "Artık acil durum bildirimlerini alacaksınız.",
        });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bildirimler etkinleştirilemedi. Lütfen tekrar deneyin.",
      });
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const disableNotifications = async () => {
    try {
      setIsPending(true);
      if (token) {
        removeDeviceToken({ token });
        setToken(null);
        setIsEnabled(false);
        toast({
          title: "Bildirimler Devre Dışı",
          description: "Artık acil durum bildirimi almayacaksınız.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bildirimler devre dışı bırakılamadı.",
      });
    } finally {
      setIsPending(false);
    }
  };

  return {
    isEnabled,
    isPending,
    token,
    enableNotifications,
    disableNotifications,
  };
}
