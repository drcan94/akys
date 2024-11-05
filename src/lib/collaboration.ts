"use client";

import { pusherClient, toPusherKey } from "@/lib/pusher";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface CollaborationOptions {
  noteId: string;
  userId: string;
  userName: string | null;
  onStatusChange?: (status: "viewing" | "editing") => void;
  onCollaboratorJoin?: (userId: string, userName: string | null) => void;
  onCollaboratorLeave?: (userId: string) => void;
  onNoteLocked?: (userId: string, userName: string | null) => void;
  onNoteUnlocked?: () => void;
}

export function useCollaboration({
  noteId,
  userId,
  userName,
  onStatusChange,
  onCollaboratorJoin,
  onCollaboratorLeave,
  onNoteLocked,
  onNoteUnlocked,
}: CollaborationOptions) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<{
    id: string;
    name: string | null;
  } | null>(null);
  const { toast } = useToast();

  const { mutate: lockNote } = api.operationNote.lock.useMutation({
    onSuccess: () => {
      setIsLocked(true);
      setLockedBy({ id: userId, name: userName });
    },
    onError: (error: { message: any }) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  const { mutate: unlockNote } = api.operationNote.unlock.useMutation({
    onSuccess: () => {
      setIsLocked(false);
      setLockedBy(null);
    },
  });

  const { mutate: updateStatus } = api.operationNote.updateStatus.useMutation();

  useEffect(() => {
    if (!noteId) return;

    const channel = pusherClient.subscribe(
      toPusherKey(`operation-note:${noteId}:presence`)
    );

    // Handle user joining
    channel.bind(
      "user-joined",
      (data: {
        userId: string;
        user: {
          id: string;
          name: string | null;
          status: "viewing" | "editing";
        };
      }) => {
        if (data.userId !== userId) {
          onCollaboratorJoin?.(data.userId, data.user.name);
          toast({
            title: "Aktif Kullanıcı",
            description: `${data.user.name || "Bir kullanıcı"} notu ${
              data.user.status === "editing" ? "düzenliyor" : "görüntülüyor"
            }.`,
          });
        }
      }
    );

    // Handle user leaving
    channel.bind("user-left", (data: { userId: string }) => {
      if (data.userId !== userId) {
        onCollaboratorLeave?.(data.userId);
      }
    });

    // Handle status changes
    channel.bind(
      "user-status-changed",
      (data: { userId: string; status: "viewing" | "editing" }) => {
        if (data.userId !== userId) {
          onStatusChange?.(data.status);
        }
      }
    );

    // Handle note locking
    channel.bind(
      "note-locked",
      (data: { userId: string; userName: string | null }) => {
        if (data.userId !== userId) {
          setIsLocked(true);
          setLockedBy({ id: data.userId, name: data.userName });
          onNoteLocked?.(data.userId, data.userName);
        }
      }
    );

    // Handle note unlocking
    channel.bind("note-unlocked", (data: { userId: string }) => {
      if (data.userId !== userId) {
        setIsLocked(false);
        setLockedBy(null);
        onNoteUnlocked?.();
      }
    });

    // Join the channel
    updateStatus({
      noteId,
      status: "viewing",
    });

    return () => {
      pusherClient.unsubscribe(
        toPusherKey(`operation-note:${noteId}:presence`)
      );
      if (lockedBy?.id === userId) {
        unlockNote({ noteId });
      }
    };
  }, [
    noteId,
    userId,
    userName,
    onStatusChange,
    onCollaboratorJoin,
    onCollaboratorLeave,
    onNoteLocked,
    onNoteUnlocked,
    toast,
    updateStatus,
    unlockNote,
    lockedBy,
  ]);

  const startEditing = async () => {
    if (isLocked && lockedBy?.id !== userId) {
      toast({
        variant: "destructive",
        title: "Düzenleme Yapılamıyor",
        description: `Bu not ${
          lockedBy?.name || "başka bir kullanıcı"
        } tarafından düzenleniyor.`,
      });
      return false;
    }

    try {
      await lockNote({ noteId });
      updateStatus({
        noteId,
        status: "editing",
      });
      return true;
    } catch {
      return false;
    }
  };

  const stopEditing = async () => {
    if (lockedBy?.id === userId) {
      await unlockNote({ noteId });
      updateStatus({
        noteId,
        status: "viewing",
      });
    }
  };

  return {
    isLocked,
    lockedBy,
    startEditing,
    stopEditing,
  };
}
