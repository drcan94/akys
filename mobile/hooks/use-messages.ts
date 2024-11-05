"use client";

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { pusherClient, toPusherKey } from '../lib/pusher';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  reactions: {
    emoji: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
    };
  }[];
}

// ... existing interfaces ...

export function useMessages(channelId: string | null) {
  // ... existing state ...

  // Subscribe to real-time updates
  useEffect(() => {
    if (!channelId) return;

    const channel = pusherClient.subscribe(
      toPusherKey(`channel:${channelId}:messages`)
    );

    channel.bind('new-message', (message: Message) => {
      setMessages((prev) => [message, ...prev]);
    });

    channel.bind('new-reaction', (data: {
      messageId: string;
      reaction: Message['reactions'][0];
    }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === data.messageId
            ? {
                ...message,
                reactions: [...message.reactions, data.reaction],
              }
            : message
        )
      );
    });

    channel.bind('remove-reaction', (data: {
      messageId: string;
      userId: string;
      emoji: string;
    }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === data.messageId
            ? {
                ...message,
                reactions: message.reactions.filter(
                  (r) =>
                    !(
                      r.userId === data.userId &&
                      r.emoji === data.emoji
                    )
                ),
              }
            : message
        )
      );
    });

    return () => {
      pusherClient.unsubscribe(toPuskerKey(`channel:${channelId}:messages`));
    };
  }, [channelId]);

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await api.post(`/api/messages/${messageId}/reactions`, {
        emoji,
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    try {
      await api.delete(`/api/messages/${messageId}/reactions`, {
        data: { emoji },
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  };

  return {
    messages,
    channels,
    isLoading,
    hasNextPage,
    sendMessage,
    addReaction,
    removeReaction,
    markAsRead,
    fetchNextPage,
  };
}