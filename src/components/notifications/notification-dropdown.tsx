"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { pusherClient, toPusherKey } from "@/lib/pusher";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { type NotificationType } from "@prisma/client";

const notificationTypeLabels: Record<NotificationType, string> = {
  OPERATION_NOTE_CREATED: "Operasyon Notu Oluşturuldu",
  OPERATION_NOTE_UPDATED: "Operasyon Notu Güncellendi",
  NEW_MESSAGE: "Yeni Mesaj",
  MENTION: "Bahsedilme",
  PATIENT_UPDATE: "Hasta Güncellemesi",
  SYSTEM: "Sistem",
  REACTION: "Yeni Tepki",
};

const notificationTypeIcons: Record<NotificationType, JSX.Element> = {
  OPERATION_NOTE_CREATED: <Bell className="h-4 w-4 text-blue-500" />,
  OPERATION_NOTE_UPDATED: <Bell className="h-4 w-4 text-green-500" />,
  NEW_MESSAGE: <Bell className="h-4 w-4 text-purple-500" />,
  MENTION: <Bell className="h-4 w-4 text-yellow-500" />,
  PATIENT_UPDATE: <Bell className="h-4 w-4 text-orange-500" />,
  SYSTEM: <Bell className="h-4 w-4 text-gray-500" />,
  REACTION: <Bell className="h-4 w-4 text-pink-500" />,
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const utils = api.useUtils();

  const {
    data: notifications,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = api.notification.getAll.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const { data: unreadCount = 0 } = api.notification.getUnreadCount.useQuery();

  const { mutate: markAsRead } = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const { mutate: markAllAsRead } = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getAll.invalidate();
      toast({
        description: "Tüm bildirimler okundu olarak işaretlendi.",
      });
    },
  });

  const { mutate: deleteAll } = api.notification.deleteAll.useMutation({
    onSuccess: () => {
      utils.notification.getAll.invalidate();
      utils.notification.getUnreadCount.invalidate();
      toast({
        description: "Tüm bildirimler silindi.",
      });
      setIsOpen(false);
    },
  });

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = pusherClient.subscribe(
      toPusherKey(`user:${session.user.id}:notifications`)
    );

    channel.bind("new-notification", () => {
      utils.notification.getUnreadCount.invalidate();
      utils.notification.getAll.invalidate();
    });

    return () => {
      pusherClient.unsubscribe(
        toPusherKey(`user:${session.user.id}:notifications`)
      );
    };
  }, [
    session?.user?.id,
    utils.notification.getAll,
    utils.notification.getUnreadCount,
  ]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom =
      Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) <
      1;

    if (bottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleNotificationClick = async (
    notificationId: string,
    isRead: boolean,
    data: Record<string, any>
  ) => {
    if (!isRead) {
      markAsRead({ id: notificationId });
    }

    setIsOpen(false);

    if (data.channelId) {
      router.push(`/dashboard/messages?channel=${data.channelId}`);
    } else if (data.noteId) {
      router.push(
        `/dashboard/patients/${data.patientId}?tab=operations&note=${data.noteId}`
      );
    } else if (data.patientId) {
      router.push(`/dashboard/patients/${data.patientId}`);
    }
  };

  const allNotifications = notifications?.pages.flatMap(
    (page) => page.notifications
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between p-2">
          <h4 className="text-sm font-semibold">Bildirimler</h4>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => markAllAsRead()}
                disabled={isLoading}
              >
                <Check className="mr-2 h-3 w-3" />
                Tümünü Okundu İşaretle
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => deleteAll()}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Tümünü Sil
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea
          className="h-[300px] overflow-y-auto"
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : allNotifications?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Bildirim bulunmuyor
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {allNotifications?.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg p-2 ${
                    !notification.isRead ? "bg-muted/50" : ""
                  }`}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.isRead,
                      notification.data as Record<string, any>
                    )
                  }
                >
                  {notificationTypeIcons[notification.type]}
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {notification.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(notification.createdAt), "p", {
                          locale: tr,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
