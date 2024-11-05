import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem!.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
    });
  }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification || notification.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bildirim bulunamadı",
        });
      }

      return ctx.db.notification.update({
        where: { id: input.id },
        data: { isRead: true },
      });
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.deleteMany({
      where: {
        userId: ctx.session.user.id,
      },
    });

    return { success: true };
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        operationNotes: z.boolean(),
        messages: z.boolean(),
        patientUpdates: z.boolean(),
        mentions: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notificationSettings.upsert({
        where: {
          userId: ctx.session.user.id,
        },
        update: input,
        create: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notificationSettings.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
    });
  }),
});
