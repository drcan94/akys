import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Gender, BloodType } from "@prisma/client";

const patientSchema = z.object({
  medicalRecordNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.date(),
  gender: z.nativeEnum(Gender),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  bloodType: z.nativeEnum(BloodType).optional(),
  allergies: z.string().optional(),
  comorbidities: z.array(z.string()).optional(),
  medications: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
      }),
    )
    .optional(),
});

export const patientRouter = createTRPCRouter({
  create: protectedProcedure
    .input(patientSchema)
    .mutation(async ({ ctx, input }) => {
      const existingPatient = await ctx.db.patient.findUnique({
        where: { medicalRecordNumber: input.medicalRecordNumber },
      });

      if (existingPatient) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Bu protokol numarası zaten kullanımda",
        });
      }

      return ctx.db.patient.create({
        data: {
          ...input,
          comorbidities: input.comorbidities ?? [],
          medications: input.medications ?? [],
        },
      });
    }),

  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const where = input.search
        ? {
            OR: [
              {
                firstName: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
              {
                lastName: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
              {
                medicalRecordNumber: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {};

      const [patients, total] = await Promise.all([
        ctx.db.patient.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: input.limit,
        }),
        ctx.db.patient.count({ where }),
      ]);

      return {
        patients,
        totalPages: Math.ceil(total / input.limit),
        currentPage: input.page,
      };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { id: input },
        include: {
          preoperativeEvaluations: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { evaluationDate: "desc" },
          },
          operationNotes: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { procedureDate: "desc" },
          },
        },
      });

      if (!patient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Hasta bulunamadı",
        });
      }

      return patient;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: patientSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUnique({
        where: { id: input.id },
      });

      if (!patient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Hasta bulunamadı",
        });
      }

      return ctx.db.patient.update({
        where: { id: input.id },
        data: input.data,
      });
    }),
});
