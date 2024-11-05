"use client";

import { useState } from "react";
import { ChannelList } from "./channel-list";
import { MessageArea } from "./message-area";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Session } from "next-auth";

interface ChatLayoutProps {
  user: Session["user"];
}

export function ChatLayout({ user }: ChatLayoutProps) {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-background shadow">
      <div className="w-full max-w-xs flex-col">
        <div className="p-4 font-semibold">Kanallar</div>
        <Separator />
        <ScrollArea className="h-full">
          <ChannelList
            userId={user.id}
            userRole={user.role}
            selectedChannel={selectedChannel}
            onSelectChannel={setSelectedChannel}
          />
        </ScrollArea>
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-1 flex-col">
        <MessageArea
          userId={user.id}
          userRole={user.role}
          channelId={selectedChannel}
        />
      </div>
    </div>
  );
}
