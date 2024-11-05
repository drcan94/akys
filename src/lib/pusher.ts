import PusherServer from "pusher";
import PusherClient from "pusher-js";
import { env } from "@/env";

export const pusherServer = new PusherServer({
  appId: env.PUSHER_APP_ID,
  key: env.PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.PUSHER_CLUSTER,
  useTLS: true,
});

export const pusherClient = new PusherClient(env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

export const toPusherKey = (key: string) => key.replace(/:/g, "__");

export const PRESENCE_EVENTS = {
  JOIN: "user-joined",
  LEAVE: "user-left",
  STATUS_CHANGE: "user-status-changed",
} as const;

export const NOTE_EVENTS = {
  LOCKED: "note-locked",
  UNLOCKED: "note-unlocked",
  UPDATED: "note-updated",
} as const;
