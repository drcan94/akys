import { db } from "@/server/db";
import { pusherServer, toPusherKey } from "@/lib/pusher";
import { type NotificationType } from "@prisma/client";
import { encrypt } from "@/lib/encryption";
import { sendNotificationEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/pushNotifications";

interface NotificationPreferences {
  operationNotes: boolean;
  messages: boolean;
  patientUpdates: boolean;
  mentions: boolean;
  reactions: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyDigest: boolean;
}

interface NotificationChannels {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  const settings = await db.notificationSettings.findUnique({
    where: { userId },
  });

  if (!settings) return null;

  return {
    operationNotes: settings.operationNotes,
    messages: settings.messages,
    patientUpdates: settings.patientUpdates,
    mentions: settings.mentions,
    reactions: settings.reactions,
    emailNotifications: settings.emailNotifications,
    pushNotifications: settings.pushNotifications,
    dailyDigest: settings.dailyDigest,
  };
}

async function shouldSendNotification(
  userId: string,
  type: NotificationType,
): Promise<NotificationChannels> {
  const settings = await getNotificationPreferences(userId);

  if (!settings) {
    return {
      inApp: true,
      email: false,
      push: false,
    };
  }

  let shouldSend = false;

  switch (type) {
    case "OPERATION_NOTE_CREATED":
    case "OPERATION_NOTE_UPDATED":
      shouldSend = settings.operationNotes;
      break;
    case "NEW_MESSAGE":
      shouldSend = settings.messages;
      break;
    case "MENTION":
      shouldSend = settings.mentions;
      break;
    case "PATIENT_UPDATE":
      shouldSend = settings.patientUpdates;
      break;
    case "REACTION":
      shouldSend = settings.reactions;
      break;
    case "SYSTEM":
      shouldSend = true;
      break;
  }

  return {
    inApp: shouldSend,
    email: shouldSend && settings.emailNotifications,
    push: shouldSend && settings.pushNotifications,
  };
}

async function createNotificationLog(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannels;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  const channelsMetadata = {
    inApp: params.channels.inApp,
    email: params.channels.email,
    push: params.channels.push,
  };

  await db.notificationLog.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      body: params.body,
      metadata: params.metadata
        ? { ...channelsMetadata, ...params.metadata }
        : channelsMetadata,
    },
  });
}

export async function sendNotification({
  userId,
  type,
  title,
  message,
  data,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;
}) {
  try {
    const channels = await shouldSendNotification(userId, type);

    if (!channels.inApp && !channels.email && !channels.push) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        deviceTokens: true,
      },
    });

    if (!user) return null;

    const encryptedMessage = await encrypt(message);
    let notification = null;

    // Create in-app notification
    if (channels.inApp) {
      notification = await db.notification.create({
        data: {
          userId,
          type,
          title,
          message: encryptedMessage,
          data: data ?? {},
        },
      });

      await pusherServer.trigger(
        toPusherKey(`user:${userId}:notifications`),
        "new-notification",
        notification,
      );
    }

    // Send email notification
    if (channels.email && user.email) {
      await sendNotificationEmail({
        to: user.email,
        userName: user.name ?? "User",
        title,
        message,
        actionUrl: data?.url,
        actionText: data?.actionText,
      });
    }

    // Send push notifications
    if (channels.push && user.deviceTokens.length > 0) {
      await Promise.all(
        user.deviceTokens.map((token) =>
          sendPushNotification({
            token,
            title,
            body: message,
            data,
          }),
        ),
      );
    }

    // Log notification
    await createNotificationLog({
      userId,
      type,
      title,
      message: encryptedMessage,
      body: message,
      channels,
      metadata: data ? { ...data } : undefined,
    });

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
}

export async function createPreoperativeEvaluationNotification({
  userId,
  evaluationId,
  patientId,
  performedBy,
  action,
}: {
  userId: string;
  evaluationId: string;
  patientId: string;
  action: "created" | "updated";
  performedBy: {
    id: string;
    name: string;
  };
}) {
  const type =
    action === "created"
      ? "PREOPERATIVE_EVALUATION_CREATED"
      : "PREOPERATIVE_EVALUATION_UPDATED";

  const patient = await db.patient.findUnique({
    where: { id: patientId },
    select: {
      firstName: true,
      lastName: true,
    },
  });

  if (!patient) return null;

  return sendNotification({
    userId,
    type,
    title:
      action === "created"
        ? "Yeni Preoperatif Değerlendirme"
        : "Preoperatif Değerlendirme Güncellendi",
    message: `${performedBy.name} ${patient.firstName} ${
      patient.lastName
    } hastasının preoperatif değerlendirmesini ${
      action === "created" ? "oluşturdu" : "güncelledi"
    }`,
    data: {
      evaluationId,
      patientId,
      performedById: performedBy.id,
      url: `/dashboard/patients/${patientId}?tab=evaluations&evaluation=${evaluationId}`,
      actionText: "Değerlendirmeyi Görüntüle",
    },
  });
}

export async function createOperationNoteNotification({
  userId,
  noteId,
  patientId,
  action,
  performedBy,
}: {
  userId: string;
  noteId: string;
  patientId: string;
  action: "created" | "updated";
  performedBy: {
    id: string;
    name: string;
  };
}) {
  const type =
    action === "created" ? "OPERATION_NOTE_CREATED" : "OPERATION_NOTE_UPDATED";

  const patient = await db.patient.findUnique({
    where: { id: patientId },
    select: {
      firstName: true,
      lastName: true,
    },
  });

  if (!patient) return null;

  return sendNotification({
    userId,
    type,
    title:
      action === "created"
        ? "Yeni Operasyon Notu"
        : "Operasyon Notu Güncellendi",
    message: `${performedBy.name} ${patient.firstName} ${
      patient.lastName
    } hastasının operasyon notunu ${
      action === "created" ? "oluşturdu" : "güncelledi"
    }`,
    data: {
      noteId,
      patientId,
      performedById: performedBy.id,
      url: `/dashboard/patients/${patientId}?tab=operations&note=${noteId}`,
      actionText: "Notu Görüntüle",
    },
  });
}
export async function createMessageNotification({
  userId,
  senderId,
  senderName,
  message,
  channelId,
  channelName,
}: {
  userId: string;
  senderId: string;
  senderName: string;
  message: string;
  channelId: string;
  channelName: string;
}) {
  return sendNotification({
    userId,
    type: "NEW_MESSAGE", // 'type' değerini buradan belirle
    title: "Yeni Mesaj",
    message: `${senderName}: ${message}`,
    data: {
      channelId,
      channelName,
      senderId,
      url: `/dashboard/messages?channel=${channelId}`,
      actionText: "Mesajı Görüntüle",
    },
  });
}

export async function createMentionNotification({
  userId,
  senderId,
  senderName,
  message,
  channelId,
  channelName,
}: {
  userId: string;
  senderId: string;
  senderName: string;
  message: string;
  channelId: string;
  channelName: string;
}) {
  return sendNotification({
    userId,
    type: "MENTION", // 'type' değerini buradan belirle
    title: "Mesajda Bahsedildiniz",
    message: `${senderName} sizden bahsetti: ${message}`,
    data: {
      channelId,
      channelName,
      senderId,
      url: `/dashboard/messages?channel=${channelId}`,
      actionText: "Mesajı Görüntüle",
    },
  });
}
