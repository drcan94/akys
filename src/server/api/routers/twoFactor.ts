import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  enableTwoFactor,
  disableTwoFactor,
  verifyBackupCode,
} from "@/lib/auth/twoFactor";

export const twoFactorRouter = createTRPCRouter({
  generateSecret: protectedProcedure.mutation(async ({ ctx }) => {
    return generateTwoFactorSecret(ctx.session.user.id);
  }),

  verifyToken: protectedProcedure
    .input(
      z.object({
        token: z.string().length(6),
        isSetup: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return verifyTwoFactorToken(
        ctx.session.user.id,
        input.token,
        input.isSetup
      );
    }),

  enable: protectedProcedure
    .input(z.object({ token: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      return enableTwoFactor(ctx.session.user.id, input.token);
    }),

  disable: protectedProcedure
    .input(z.object({ token: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      return disableTwoFactor(ctx.session.user.id, input.token);
    }),

  verifyBackupCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return verifyBackupCode(ctx.session.user.id, input.code);
    }),
});