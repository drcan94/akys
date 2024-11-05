"use client";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ChannelListProps {
  userId: string;
  userRole: UserRole;
  selectedChannel: string | null;
  onSelectChannel: (channelId: string) => void;
}

export function ChannelList({
  userId,
  selectedChannel,
  onSelectChannel,
}: ChannelListProps) {
  const { data: channels, isLoading } = api.channel.list.useQuery({ userId });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {channels?.map((channel) => (
        <Button
          key={channel.id}
          variant="ghost"
          className={cn(
            "w-full justify-start",
            selectedChannel === channel.id && "bg-muted",
          )}
          onClick={() => onSelectChannel(channel.id)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          {channel.name}
        </Button>
      ))}
    </div>
  );
}
