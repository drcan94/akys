import { getServerAuthSession } from "@/src/server/auth";
import { redirect } from "next/navigation";
import { ChatLayout } from "@/src/components/chat/chat-layout";

export default async function MessagesPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/");
  }

  return <ChatLayout user={session.user} />;
}
