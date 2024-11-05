import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { NotificationEmail } from "@/emails/notification-email";
import { DailyDigestEmail } from "@/emails/daily-digest-email";
import { env } from "@/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function sendNotificationEmail({
  to,
  userName,
  title,
  message,
  actionUrl,
  actionText,
}: {
  to: string;
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}) {
  const html = render(
    NotificationEmail({
      userName,
      title,
      message,
      actionUrl,
      actionText,
    })
  );

  return sendEmail({
    to,
    subject: title,
    html,
  });
}

export async function sendDailyDigestEmail({
  to,
  userName,
  date,
  notifications,
  operationNotes,
  messages,
}: {
  to: string;
  userName: string;
  date: Date;
  notifications: {
    title: string;
    message: string;
    time: Date;
  }[];
  operationNotes: {
    patientName: string;
    type: string;
    time: Date;
  }[];
  messages: {
    channelName: string;
    count: number;
  }[];
}) {
  const html = render(
    DailyDigestEmail({
      userName,
      date,
      notifications,
      operationNotes,
      messages,
    })
  );

  return sendEmail({
    to,
    subject: `Günlük Özet - ${date.toLocaleDateString("tr-TR")}`,
    html,
  });
}