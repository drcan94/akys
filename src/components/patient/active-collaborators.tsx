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
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { pusherClient, toPusherKey } from "@/lib/pusher";
import { type User } from "@prisma/client";

interface ActiveCollaborator extends Pick<User, "id" | "name" | "image"> {
  status: "viewing" | "editing";
  lastActivity: Date;
}

interface ActiveCollaboratorsProps {
  noteId: string;
  currentUserId: string;
  lockedBy?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  lockedAt?: Date | null;
}

export function ActiveCollaborators({
  noteId,
  currentUserId,
  lockedBy,
  lockedAt,
}: ActiveCollaboratorsProps) {
  const [collaborators, setCollaborators] = useState<
    Map<string, ActiveCollaborator>
  >(new Map());

  useEffect(() => {
    if (!noteId) return;

    const channel = pusherClient.subscribe(
      toPusherKey(`operation-note:${noteId}:presence`)
    );

    channel.bind(
      "user-joined",
      (data: {
        userId: string;
        user: Omit<ActiveCollaborator, "lastActivity">;
      }) => {
        setCollaborators((prev) => {
          const next = new Map(prev);
          next.set(data.userId, {
            ...data.user,
            lastActivity: new Date(),
          });
          return next;
        });
      }
    );

    channel.bind("user-left", (data: { userId: string }) => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    channel.bind(
      "user-status-changed",
      (data: { userId: string; status: "viewing" | "editing" }) => {
        setCollaborators((prev) => {
          const next = new Map(prev);
          const user = next.get(data.userId);
          if (user) {
            next.set(data.userId, {
              ...user,
              status: data.status,
              lastActivity: new Date(),
            });
          }
          return next;
        });
      }
    );

    // Clean up inactive users after 30 seconds
    const interval = setInterval(() => {
      setCollaborators((prev) => {
        const next = new Map(prev);
        const now = new Date();
        for (const [userId, user] of next) {
          if (now.getTime() - user.lastActivity.getTime() > 30000) {
            next.delete(userId);
          }
        }
        return next;
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      pusherClient.unsubscribe(
        toPusherKey(`operation-note:${noteId}:presence`)
      );
    };
  }, [noteId]);

  const activeCollaborators = Array.from(collaborators.values()).filter(
    (user) => user.id !== currentUserId
  );

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        {lockedBy && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-destructive">
                  <AvatarImage src={lockedBy.image || undefined} />
                  <AvatarFallback>
                    {lockedBy.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <Badge variant="destructive" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Düzenleniyor
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{lockedBy.name} düzenliyor</p>
              {lockedAt && (
                <p className="text-xs text-muted-foreground">
                  {format(lockedAt, "PPp", { locale: tr })}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}

        {activeCollaborators.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger>
              <Avatar
                className={`h-8 w-8 border-2 ${
                  user.status === "editing"
                    ? "border-yellow-500"
                    : "border-green-500"
                }`}
              >
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">
                {user.name}{" "}
                {user.status === "editing" ? "düzenliyor" : "görüntülüyor"}
              </p>
              <p className="text-xs text-muted-foreground">
                Son aktivite: {format(user.lastActivity, "PPp", { locale: tr })}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
