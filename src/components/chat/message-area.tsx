"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageInput } from "./message-input";
import { MessageReactions } from "./message-reactions";
import { pusherClient, toPusherKey } from "@/lib/pusher";
import { type UserRole } from "@prisma/client";

interface MessageAreaProps {
  userId: string;
  userRole: UserRole;
  channelId: string | null;
}

interface TypingUser {
  userId: string;
  userName: string | null;
  timestamp: number;
}

export function MessageArea({ userId, channelId }: MessageAreaProps) {
  const { data: session } = useSession();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(
    new Map(),
  );

  const { data: messagesData, isLoading } = api.message.list.useInfiniteQuery(
    {
      channelId: channelId!,
      limit: 50,
    },
    {
      enabled: !!channelId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (!channelId) return;

    const channel = pusherClient.subscribe(
      toPusherKey(`channel:${channelId}:messages`),
    );

    channel.bind("new-message", () => {
      scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });

    channel.bind(
      "user-typing",
      ({
        userId,
        userName,
        isTyping,
      }: {
        userId: string;
        userName: string | null;
        isTyping: boolean;
      }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          if (isTyping) {
            next.set(userId, {
              userId,
              userName,
              timestamp: Date.now(),
            });
          } else {
            next.delete(userId);
          }
          return next;
        });
      },
    );

    return () => {
      pusherClient.unsubscribe(toPusherKey(`channel:${channelId}:messages`));
    };
  }, [channelId]);

  // Clean up typing indicators after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        for (const [userId, user] of next) {
          if (Date.now() - user.timestamp > 3000) {
            next.delete(userId);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!channelId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Bir kanal seçin</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const messages = messagesData?.pages.flatMap((page) => page.messages) ?? [];
  const activeTypingUsers = Array.from(typingUsers.values()).filter(
    (user) => user.userId !== session?.user.id,
  );

  return (
    <div className="flex h-full flex-col">
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="flex flex-col-reverse space-y-4 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.userId === userId ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.user.image ?? undefined} />
                <AvatarFallback>
                  {message.user.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div
                className={`flex max-w-[70%] flex-col ${
                  message.userId === userId ? "items-end" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.createdAt), "p", {
                      locale: tr,
                    })}
                  </span>
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    message.userId === userId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
                <MessageReactions
                  messageId={message.id}
                  reactions={message.reactions}
                  currentUserId={userId}
                />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {activeTypingUsers.length > 0 && (
        <Alert className="mx-4 mt-2">
          <AlertDescription>
            {activeTypingUsers.map((user) => user.userName).join(", ")}{" "}
            yazıyor...
          </AlertDescription>
        </Alert>
      )}

      <div className="border-t p-4">
        <MessageInput
          channelId={channelId}
          onMessageSent={() =>
            scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
        />
      </div>
    </div>
  );
}
