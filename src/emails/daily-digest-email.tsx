import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface DailyDigestEmailProps {
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
}

export function DailyDigestEmail({
  userName,
  date,
  notifications,
  operationNotes,
  messages,
}: DailyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Günlük Özet - {format(date, "d MMMM yyyy", { locale: tr })}
      </Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded border border-solid border-gray-200 px-10 py-8">
            <Heading className="mx-0 mb-6 mt-0 text-2xl font-bold text-black">
              Merhaba {userName},
            </Heading>

            <Text className="text-lg text-black">
              {format(date, "d MMMM yyyy", { locale: tr })} tarihli günlük özetiniz:
            </Text>

            {notifications.length > 0 && (
              <Section className="mt-6">
                <Heading className="m-0 text-base font-bold">Bildirimler</Heading>
                {notifications.map((notification, index) => (
                  <Text key={index} className="my-2 text-sm text-gray-600">
                    {format(notification.time, "HH:mm", { locale: tr })} -{" "}
                    <strong>{notification.title}:</strong> {notification.message}
                  </Text>
                ))}
              </Section>
            )}

            {operationNotes.length > 0 && (
              <Section className="mt-6">
                <Heading className="m-0 text-base font-bold">
                  Operasyon Notları
                </Heading>
                {operationNotes.map((note, index) => (
                  <Text key={index} className="my-2 text-sm text-gray-600">
                    {format(note.time, "HH:mm", { locale: tr })} -{" "}
                    <strong>{note.patientName}</strong> - {note.type}
                  </Text>
                ))}
              </Section>
            )}

            {messages.length > 0 && (
              <Section className="mt-6">
                <Heading className="m-0 text-base font-bold">Mesajlar</Heading>
                {messages.map((channel, index) => (
                  <Text key={index} className="my-2 text-sm text-gray-600">
                    <strong>{channel.channelName}</strong> - {channel.count} yeni mesaj
                  </Text>
                ))}
              </Section>
            )}

            <Hr className="my-6 border-gray-200" />

            <Text className="text-sm text-gray-500">
              Bu e-posta Anestezi Kliniği Yönetim Sistemi tarafından gönderilmiştir.
              Günlük özet ayarlarını{" "}
              <Link href="/settings/notifications" className="text-blue-600">
                ayarlar sayfasından
              </Link>{" "}
              yönetebilirsiniz.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}