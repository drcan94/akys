import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { pusherServer, toPusherKey } from "@/lib/pusher";
import { createPreoperativeEvaluationNotification } from "@/lib/notifications";

export const preoperativeEvaluationRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const evaluation = await ctx.db.preoperativeEvaluation.findUnique({
        where: { id: input },
        include: {
          patient: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          lastModifiedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!evaluation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preoperatif değerlendirme bulunamadı",
        });
      }

      return evaluation;
    }),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        asaScore: z.enum([
          "ASA_1",
          "ASA_2",
          "ASA_3",
          "ASA_4",
          "ASA_5",
          "ASA_6",
          "ASA_1E",
          "ASA_2E",
          "ASA_3E",
          "ASA_4E",
          "ASA_5E",
        ]),
        comorbidities: z.array(z.string()),
        requiredTests: z.array(z.string()),
        consentObtained: z.boolean(),
        evaluationDate: z.date(), // Added evaluationDate here
        allergies: z.string().optional(),
        medications: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const evaluation = await ctx.db.preoperativeEvaluation.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
        },
      });

      await createPreoperativeEvaluationNotification({
        userId: ctx.session.user.id,
        evaluationId: evaluation.id,
        patientId: input.patientId,
        action: "created",
        performedBy: {
          id: ctx.session.user.id,
          name: ctx.session.user.name ?? "Bir kullanıcı",
        },
      });

      return evaluation;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          asaScore: z
            .enum([
              "ASA_1",
              "ASA_2",
              "ASA_3",
              "ASA_4",
              "ASA_5",
              "ASA_6",
              "ASA_1E",
              "ASA_2E",
              "ASA_3E",
              "ASA_4E",
              "ASA_5E",
            ])
            .optional(),
          comorbidities: z.array(z.string()).optional(),
          requiredTests: z.array(z.string()).optional(),
          consentObtained: z.boolean().optional(),
          evaluationDate: z.date().optional(), // Added evaluationDate here for updates as well
          allergies: z.string().optional(),
          medications: z.array(z.string()).optional(),
          notes: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const evaluation = await ctx.db.preoperativeEvaluation.findUnique({
        where: { id: input.id },
        include: {
          patient: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!evaluation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preoperatif değerlendirme bulunamadı",
        });
      }

      // Update role checks in the router
      if (
        evaluation.createdById !== ctx.session.user.id &&
        !["LECTURER", "SUPERADMIN"].includes(ctx.session.user.role)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bu değerlendirmeyi düzenleme yetkiniz yok",
        });
      }

      const updatedEvaluation = await ctx.db.preoperativeEvaluation.update({
        where: { id: input.id },
        data: {
          ...input.data,
          lastModifiedById: ctx.session.user.id,
          lastModifiedAt: new Date(),
        },
      });

      await createPreoperativeEvaluationNotification({
        userId: evaluation.createdById,
        evaluationId: evaluation.id,
        patientId: evaluation.patientId,
        action: "updated",
        performedBy: {
          id: ctx.session.user.id,
          name: ctx.session.user.name ?? "Bir kullanıcı",
        },
      });

      await pusherServer.trigger(
        toPusherKey(`preoperative-evaluation:${input.id}`),
        "evaluation-updated",
        updatedEvaluation,
      );

      return updatedEvaluation;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const evaluation = await ctx.db.preoperativeEvaluation.findUnique({
        where: { id: input },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!evaluation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preoperatif değerlendirme bulunamadı",
        });
      }

      // Update role checks in the router
      if (
        evaluation.createdById !== ctx.session.user.id &&
        !["LECTURER", "SUPERADMIN"].includes(ctx.session.user.role)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bu değerlendirmeyi silme yetkiniz yok",
        });
      }

      await ctx.db.preoperativeEvaluation.delete({
        where: { id: input },
      });

      return { success: true };
    }),
});
