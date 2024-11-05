import { z } from "zod";
import { TRPCError } from "@trpc/server";
import sanitizeHtml from "sanitize-html";

// Common validation patterns
const patterns = {
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phoneNumber: /^\+?[1-9]\d{1,14}$/,
  medicalRecordNumber: /^[A-Z0-9]{6,10}$/,
};

// Input sanitization options
const sanitizeOptions = {
  allowedTags: ["b", "i", "em", "strong", "p", "br"],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

// Common validation schemas
export const userSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z
    .string()
    .regex(
      patterns.password,
      "Şifre en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir"
    ),
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  role: z.enum([
    "SUPERADMIN",
    "LECTURER",
    "RESIDENT",
    "TECHNICIAN",
    "NURSE",
    "STAFF",
    "PENDING",
  ]),
});

export const patientSchema = z.object({
  medicalRecordNumber: z
    .string()
    .regex(patterns.medicalRecordNumber, "Geçersiz protokol numarası"),
  firstName: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  lastName: z.string().min(2, "Soyisim en az 2 karakter olmalıdır"),
  dateOfBirth: z.date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phoneNumber: z
    .string()
    .regex(patterns.phoneNumber, "Geçersiz telefon numarası")
    .optional(),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional(),
});

// Input sanitization function
export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, sanitizeOptions);
}

// Validate and sanitize object fields recursively
export function validateAndSanitizeObject<T extends Record<string, any>>(
  obj: T,
  schema: z.ZodType<T>
): T {
  try {
    // First validate with Zod schema
    const validated = schema.parse(obj);

    // Then sanitize string fields recursively
    return Object.entries(validated).reduce((acc, [key, value]) => {
      if (typeof value === "string") {
        acc[key] = sanitizeInput(value);
      } else if (Array.isArray(value)) {
        acc[key] = value.map((item) =>
          typeof item === "string" ? sanitizeInput(item) : item
        );
      } else if (typeof value === "object" && value !== null) {
        acc[key] = validateAndSanitizeObject(value, schema);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as T);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error.errors[0].message,
      });
    }
    throw error;
  }
}

// Role-based access control validation
export function validateAccess(
  userRole: string,
  requiredRoles: string[],
  action: string
): void {
  if (!requiredRoles.includes(userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Bu işlem için yetkiniz yok: ${action}`,
    });
  }
}

// Validate file upload
export function validateFileUpload(
  file: {
    name: string;
    type: string;
    size: number;
  },
  allowedTypes: string[],
  maxSize: number
): void {
  if (!allowedTypes.includes(file.type)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Desteklenmeyen dosya türü",
    });
  }

  if (file.size > maxSize) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Dosya boyutu ${maxSize / (1024 * 1024)}MB'dan büyük olamaz`,
    });
  }
}
