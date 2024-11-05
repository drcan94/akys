import { type NextRequest } from "next/server";
import { getServerAuthSession } from "@/src/server/auth";
import { env } from "@/env.mjs";
import { prisma } from "@/src/server/db";

const FIREBASE_FCM_URL =
  "https://fcm.googleapis.com/v1/projects/your-project-id/messages:send";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { token, notification, data } = body;

    if (!token || !notification) {
      return new Response("Invalid request body", { status: 400 });
    }

    const response = await fetch(FIREBASE_FCM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification,
          data,
          android: {
            priority: "high",
            notification: {
              sound: "default",
              priority: "high",
              channelId: "emergency",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
                contentAvailable: true,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send FCM notification");
    }

    // Log the notification
    await prisma.notificationLog.create({
      data: {
        userId: session.user.id,
        type: "PUSH",
        title: notification.title,
        body: notification.body,
        deviceToken: token,
        metadata: data || {},
      },
    });

    return new Response("Notification sent successfully", { status: 200 });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
