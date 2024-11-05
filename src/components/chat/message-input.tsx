"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMentions } from "@/hooks/use-mentions";

interface MessageInputProps {
  channelId: string;
  onMessageSent?: () => void;
}

export function MessageInput({ channelId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { mentions, setMentions, MentionList } = useMentions();

  const { mutate: sendMessage } = api.message.send.useMutation({
    onSuccess: () => {
      setMessage("");
      setMentions([]);
      onMessageSent?.();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const { mutate: setTypingStatus } = api.message.setTypingStatus.useMutation();

  const handleTyping = () => {
    if (!channelId || !session?.user) return;

    clearTimeout(typingTimeoutRef.current);
    setTypingStatus({ channelId, isTyping: true });

    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus({ channelId, isTyping: false });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        setTypingStatus({ channelId, isTyping: false });
      }
    };
  }, [channelId, setTypingStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    sendMessage({
      channelId,
      content: message,
      mentions: mentions.map((m) => m.id),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-2">
      <Textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping();
        }}
        placeholder="Mesajınızı yazın..."
        className="min-h-[80px] resize-none pr-20"
      />
      <MentionList />
      <Button
        type="submit"
        size="icon"
        className="absolute bottom-2 right-2"
        disabled={!message.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
