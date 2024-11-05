import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import { env } from "@/env";

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }

    const token = await getToken(messaging, {
      vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    return token;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}

export function onMessageListener(callback: (payload: MessagePayload) => void) {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    // Create system notification if app is in background
    if (document.hidden && payload.notification) {
      const { title, body } = payload.notification;
      new Notification(title || "New Notification", {
        body,
        icon: "/icons/notification-icon.png",
      });
    }

    callback(payload);
  });
}

export async function sendPushNotification({
  token,
  title,
  body,
  data,
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  try {
    const response = await fetch("/api/notifications/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        notification: {
          title,
          body,
        },
        data,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send push notification");
    }

    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}