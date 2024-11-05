"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";
import {
  requestNotificationPermission,
  onMessageListener,
} from "@/lib/pushNotifications";

interface PushNotificationContextType {
  isEnabled: boolean;
  isPending: boolean;
  token: string | null;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
}

export const PushNotificationContext =
  createContext<PushNotificationContextType>({
    isEnabled: false,
    isPending: true,
    token: null,
    enableNotifications: async () => false,
    disableNotifications: async () => {},
  });

export function PushNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(true);
  const { data: session } = useSession();
  const { toast } = useToast();
  const utils = api.useUtils();

  const { mutate: updateDeviceToken } = api.user.updateDeviceToken.useMutation({
    onSuccess: () => {
      utils.user.getSettings.invalidate();
    },
  });

  const { mutate: removeDeviceToken } = api.user.removeDeviceToken.useMutation({
    onSuccess: () => {
      utils.user.getSettings.invalidate();
    },
  });

  useEffect(() => {
    if (!session?.user) return;

    // Check if notifications are already enabled
    const checkPermission = async () => {
      if (Notification.permission === "granted") {
        const token = await requestNotificationPermission();
        if (token) {
          setToken(token);
          updateDeviceToken({ token });
        }
      }
      setIsPending(false);
    };

    checkPermission();

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
      const token = await requestNotificationPermission();
      if (token) {
        setToken(token);
        updateDeviceToken({ token });
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
    }
  };

  const disableNotifications = async () => {
    if (token) {
      removeDeviceToken({ token });
      setToken(null);
      toast({
        title: "Bildirimler Devre Dışı",
        description: "Artık acil durum bildirimi almayacaksınız.",
      });
    }
  };

  return (
    <PushNotificationContext.Provider
      value={{
        isEnabled: !!token,
        isPending,
        token,
        enableNotifications,
        disableNotifications,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
}
