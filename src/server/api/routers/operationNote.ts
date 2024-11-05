import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { pusherServer, toPusherKey } from "@/lib/pusher";
import { createOperationNoteNotification } from "@/lib/notifications";
import { AnesthesiaMethod } from "@prisma/client";

export const operationNoteRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const note = await ctx.db.operationNote.findUnique({
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
          lockedBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          fileAttachments: true,
        },
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Operasyon notu bulunamadı",
        });
      }

      return note;
    }),

  lock: protectedProcedure
    .input(
      z.object({
        noteId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.operationNote.findUnique({
        where: { id: input.noteId },
        include: {
          lockedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Operasyon notu bulunamadı",
        });
      }

      if (note.isLocked && note.lockedById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Bu not ${
            note.lockedBy?.name ?? "başka bir kullanıcı"
          } tarafından düzenleniyor`,
        });
      }

      await ctx.db.operationNote.update({
        where: { id: input.noteId },
        data: {
          isLocked: true,
          lockedById: ctx.session.user.id,
          lockedAt: new Date(),
        },
      });

      await pusherServer.trigger(
        toPusherKey(`operation-note:${input.noteId}:presence`),
        "user-joined",
        {
          userId: ctx.session.user.id,
          user: {
            id: ctx.session.user.id,
            name: ctx.session.user.name,
            image: ctx.session.user.image,
            status: "editing",
          },
        },
      );

      return { success: true };
    }),

  unlock: protectedProcedure
    .input(
      z.object({
        noteId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.operationNote.findUnique({
        where: { id: input.noteId },
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Operasyon notu bulunamadı",
        });
      }

      if (note.lockedById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bu notu kilidini açma yetkiniz yok",
        });
      }

      await ctx.db.operationNote.update({
        where: { id: input.noteId },
        data: {
          isLocked: false,
          lockedById: null,
          lockedAt: null,
        },
      });

      await pusherServer.trigger(
        toPusherKey(`operation-note:${input.noteId}:presence`),
        "user-left",
        {
          userId: ctx.session.user.id,
        },
      );

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        noteId: z.string(),
        status: z.enum(["viewing", "editing"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await pusherServer.trigger(
        toPusherKey(`operation-note:${input.noteId}:presence`),
        "user-status-changed",
        {
          userId: ctx.session.user.id,
          status: input.status,
        },
      );

      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          procedureDate: z.date(),
          procedureStartTime: z.string(),
          procedureEndTime: z.string(),
          anesthesiaMethod: z.nativeEnum(AnesthesiaMethod), // Use nativeEnum here
          medicationsAdministered: z.array(
            z.object({
              name: z.string(),
              dosage: z.string(),
              route: z.string(),
              time: z.string(),
            }),
          ),
          monitoringDetails: z.string(),
          vitalSigns: z.object({
            bloodPressure: z.string(),
            heartRate: z.string(),
            oxygenSaturation: z.string(),
            temperature: z.string(),
          }),
          intraoperativeEvents: z.string(),
          complications: z.array(z.string()).optional(),
          postoperativeInstructions: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.operationNote.findUnique({
        where: { id: input.id },
        include: {
          patient: true,
          lockedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Operasyon notu bulunamadı",
        });
      }

      if (note.isLocked && note.lockedById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Bu not ${
            note.lockedBy?.name ?? "başka bir kullanıcı"
          } tarafından düzenleniyor`,
        });
      }

      const updatedNote = await ctx.db.operationNote.update({
        where: { id: input.id },
        data: input.data,
      });

      // Notify relevant users
      await createOperationNoteNotification({
        userId: note.createdById,
        noteId: note.id,
        patientId: note.patientId,
        action: "updated",
        performedBy: {
          id: ctx.session.user.id,
          name: ctx.session.user.name ?? "Bir kullanıcı",
        },
      });

      await pusherServer.trigger(
        toPusherKey(`operation-note:${input.id}`),
        "note-updated",
        updatedNote,
      );

      return updatedNote;
    }),
});
