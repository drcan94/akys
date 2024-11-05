import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const channelRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userWithRole = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { role: true },
      });

      if (!userWithRole) {
        throw new Error("User not found");
      }

      return ctx.db.channel.findMany({
        where: {
          roleAccess: {
            has: userWithRole.role,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }),
});
