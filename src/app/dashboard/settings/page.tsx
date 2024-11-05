import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/src/server/auth";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { NotificationSettings } from "@/src/components/notifications/notification-settings";
import { TwoFactorSettings } from "@/src/components/settings/two-factor-settings";

export default async function SettingsPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <TwoFactorSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
