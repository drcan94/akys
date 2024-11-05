import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { pusherServer, toPusherKey } from "@/lib/pusher";
import {
  createMessageNotification,
  createMentionNotification,
} from "@/lib/notifications";

const messageSchema = z.object({
  channelId: z.string(),
  content: z.string().min(1, "Mesaj boş olamaz"),
  mentions: z.array(z.string()).optional(),
});

export const messageRouter = createTRPCRouter({
  send: protectedProcedure
    .input(messageSchema)
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.channel.findUnique({
        where: { id: input.channelId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kanal bulunamadı",
        });
      }

      const isMember = channel.members.some(
        (member) => member.userId === ctx.session.user.id,
      );

      if (!isMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bu kanala mesaj gönderme yetkiniz yok",
        });
      }

      const message = await ctx.db.message.create({
        data: {
          content: input.content,
          channelId: input.channelId,
          userId: ctx.session.user.id,
          mentions: input.mentions ?? [],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // Send real-time update
      await pusherServer.trigger(
        toPusherKey(`channel:${input.channelId}:messages`),
        "new-message",
        message,
      );

      // Notify channel members except the sender
      const notifyUsers = channel.members
        .filter((member) => member.userId !== ctx.session.user.id)
        .map((member) => member.user);

      await Promise.all(
        notifyUsers.map((user) =>
          createMessageNotification({
            userId: user.id,
            senderId: ctx.session.user.id,
            senderName: ctx.session.user.name ?? "Bir kullanıcı",
            message: input.content,
            channelId: input.channelId,
            channelName: channel.name,
          }),
        ),
      );

      // Handle mentions
      if (input.mentions?.length) {
        await Promise.all(
          input.mentions.map((userId) =>
            createMentionNotification({
              userId,
              senderId: ctx.session.user.id,
              senderName: ctx.session.user.name ?? "Bir kullanıcı",
              message: input.content,
              channelId: input.channelId,
              channelName: channel.name,
            }),
          ),
        );
      }

      return message;
    }),

  list: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db.message.findMany({
        where: {
          channelId: input.channelId,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  addReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        emoji: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.message.findUnique({
        where: { id: input.messageId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mesaj bulunamadı",
        });
      }

      const reaction = await ctx.db.messageReaction.create({
        data: {
          messageId: input.messageId,
          userId: ctx.session.user.id,
          emoji: input.emoji,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Notify message author about the reaction
      if (message.userId !== ctx.session.user.id) {
        await createMessageNotification({
          userId: message.userId,
          senderId: ctx.session.user.id,
          senderName: ctx.session.user.name ?? "Bir kullanıcı",
          message: `${input.emoji} tepkisi ekledi`,
          channelId: message.channelId,
          channelName: "",
        });
      }

      await pusherServer.trigger(
        toPusherKey(`message:${input.messageId}:reactions`),
        "new-reaction",
        reaction,
      );

      return reaction;
    }),

  removeReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        emoji: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const reaction = await ctx.db.messageReaction.findFirst({
        where: {
          messageId: input.messageId,
          userId: ctx.session.user.id,
          emoji: input.emoji,
        },
      });

      if (!reaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tepki bulunamadı",
        });
      }

      await ctx.db.messageReaction.delete({
        where: { id: reaction.id },
      });

      await pusherServer.trigger(
        toPusherKey(`message:${input.messageId}:reactions`),
        "remove-reaction",
        {
          messageId: input.messageId,
          emoji: input.emoji,
          userId: ctx.session.user.id,
        },
      );

      return { success: true };
    }),

  setTypingStatus: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        isTyping: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await pusherServer.trigger(
        toPusherKey(`channel:${input.channelId}:typing`),
        "user-typing",
        {
          userId: ctx.session.user.id,
          userName: ctx.session.user.name,
          isTyping: input.isTyping,
        },
      );

      return { success: true };
    }),
});
