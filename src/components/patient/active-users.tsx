"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/trpc/react";
import { pusherClient, toPusherKey } from "@/lib/pusher";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ActiveUsersProps {
  noteId: string;
}

export function ActiveUsers({ noteId }: ActiveUsersProps) {
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const { data: lockInfo } = api.operationNote.getActiveUsers.useQuery(
    { noteId },
    { enabled: !!noteId }
  );

  useEffect(() => {
    if (!noteId) return;

    const channel = pusherClient.subscribe(
      toPusherKey(`operation-note:${noteId}`)
    );

    channel.bind("user-active", ({ userId }: { userId: string }) => {
      setActiveUsers((prev) => new Set(prev).add(userId));
    });

    channel.bind("user-inactive", ({ userId }: { userId: string }) => {
      setActiveUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      pusherClient.unsubscribe(toPusherKey(`operation-note:${noteId}`));
    };
  }, [noteId]);

  if (!lockInfo) return null;

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        {lockInfo.isLocked && lockInfo.lockedBy && (
          <Tooltip>
            <TooltipTrigger>
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarImage src={lockInfo.lockedBy.image || undefined} />
                <AvatarFallback>
                  {lockInfo.lockedBy.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{lockInfo.lockedBy.name} düzenliyor</p>
              {lockInfo.lockedAt && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(lockInfo.lockedAt), "PPp", { locale: tr })}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
        {Array.from(activeUsers).map((userId) => (
          <Tooltip key={userId}>
            <TooltipTrigger>
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aktif Kullanıcı</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
