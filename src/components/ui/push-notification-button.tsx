"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushNotificationButton() {
  const { isEnabled, isPending, enableNotifications, disableNotifications } =
    usePushNotifications();

  if (isPending) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={isEnabled ? disableNotifications : enableNotifications}
          >
            {isEnabled ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isEnabled
            ? "Acil durum bildirimlerini kapat"
            : "Acil durum bildirimlerini aç"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
