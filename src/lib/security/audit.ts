import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

export interface AuditLogData {
  action: string;
  details: Prisma.InputJsonValue; // Use Prisma's InputJsonValue to ensure type compatibility
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    // Remove sensitive information from audit details
    const sanitizedDetails = sanitizeAuditData(data.details);

    await db.auditLog.create({
      data: {
        action: data.action,
        details: sanitizedDetails,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error to prevent disrupting main application flow
  }
}

export async function getAuditLogs(options: {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const where = {
      ...(options.userId && { userId: options.userId }),
      ...(options.action && { action: options.action }),
      ...(options.startDate &&
        options.endDate && {
          timestamp: {
            gte: options.startDate,
            lte: options.endDate,
          },
        }),
    };

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: options.limit,
        skip: options.offset,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      pages: Math.ceil(total / (options.limit ?? 10)),
    };
  } catch (error) {
    console.error("Failed to retrieve audit logs:", error);
    throw new Error("Failed to retrieve audit logs");
  }
}

function sanitizeAuditData(data: Prisma.InputJsonValue): Prisma.InputJsonValue {
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
  ];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return data;
  }

  return Object.entries(data).reduce(
    (acc, [key, value]) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        acc[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        acc[key] = sanitizeAuditData(value as Prisma.InputJsonValue);
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>,
  ) as Prisma.InputJsonValue;
}

export async function archiveAuditLogs(date: Date) {
  try {
    // Archive logs older than the specified date
    const logsToArchive = await db.auditLog.findMany({
      where: {
        timestamp: {
          lt: date,
        },
      },
    });

    // Store archived logs (implement your archival strategy here)
    // For example, write to a separate database or file storage

    // Delete archived logs from main database
    await db.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: date,
        },
      },
    });

    return logsToArchive.length;
  } catch (error) {
    console.error("Failed to archive audit logs:", error);
    throw new Error("Failed to archive audit logs");
  }
}
