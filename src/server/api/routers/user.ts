import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  updateDeviceToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { deviceTokens: true },
      });

      if (!user) return null;

      // Add token if it doesn't exist
      if (!user.deviceTokens.includes(input.token)) {
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            deviceTokens: {
              push: input.token,
            },
          },
        });
      }

      return { success: true };
    }),

  removeDeviceToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { deviceTokens: true },
      });

      if (!user) return null;

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          deviceTokens: user.deviceTokens.filter((t) => t !== input.token),
        },
      });

      return { success: true };
    }),

  // Add a search procedure to find users
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          name: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      return users;
    }),

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        deviceTokens: true,
        notificationSettings: true,
      },
    });

    if (!user) return null;

    return {
      deviceTokens: user.deviceTokens,
      notificationSettings: user.notificationSettings,
    };
  }),
});
