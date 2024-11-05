import {
  Body,
  Button,
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

interface NotificationEmailProps {
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export function NotificationEmail({
  userName,
  title,
  message,
  actionUrl,
  actionText,
}: NotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded border border-solid border-gray-200 px-10 py-8">
            <Heading className="mx-0 mb-6 mt-0 text-2xl font-bold text-black">
              Merhaba {userName},
            </Heading>

            <Text className="text-lg text-black">{title}</Text>
            <Text className="text-base text-gray-600">{message}</Text>

            {actionUrl && actionText && (
              <Section className="mt-8 text-center">
                <Button
                  className="inline-block rounded bg-blue-600 px-6 py-3 text-center text-base font-medium text-white"
                  href={actionUrl}
                >
                  {actionText}
                </Button>
              </Section>
            )}

            <Hr className="my-6 border-gray-200" />

            <Text className="text-sm text-gray-500">
              Bu e-posta Anestezi Kliniği Yönetim Sistemi tarafından gönderilmiştir.
              Bildirimleri{" "}
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