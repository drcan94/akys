"use client";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const AVAILABLE_REACTIONS = ["👍", "❤️", "😊", "🎉", "👏", "🤔", "😢", "🔥"];

interface MessageReactionsProps {
  messageId: string;
  reactions: {
    emoji: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
    };
  }[];
  currentUserId: string;
}

export function MessageReactions({
  messageId,
  reactions,
  currentUserId,
}: MessageReactionsProps) {
  const utils = api.useUtils();
  const { mutate: addReaction } = api.message.addReaction.useMutation({
    onSuccess: () => {
      void utils.message.list.invalidate();
    },
  });
  const { mutate: removeReaction } = api.message.removeReaction.useMutation({
    onSuccess: () => {
      void utils.message.list.invalidate();
    },
  });

  const reactionCounts = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const userReactions = reactions
    .filter((r) => r.userId === currentUserId)
    .map((r) => r.emoji);

  const handleReaction = (emoji: string) => {
    if (userReactions.includes(emoji)) {
      removeReaction({ messageId, emoji });
    } else {
      addReaction({ messageId, emoji });
    }
  };

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {AVAILABLE_REACTIONS.map((emoji) => {
        const count = reactionCounts[emoji] ?? 0;
        const hasReacted = userReactions.includes(emoji);

        if (count === 0 && !hasReacted) return null;

        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 space-x-1 rounded-full px-2 text-xs",
                    hasReacted && "bg-primary/10",
                  )}
                  onClick={() => handleReaction(emoji)}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span>{count}</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {hasReacted ? "Tepkiyi kaldır" : "Tepki ekle"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
