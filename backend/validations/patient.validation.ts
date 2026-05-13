import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const createPatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(7, "Phone must be at least 7 characters").max(20),
  whatsapp: z.string().max(20).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  profilePhoto: z.string().url().optional().nullable(),
  documents: z.string().optional().nullable(),
  patientType: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  emergencyName: z.string().optional().nullable(),
  emergencyRelation: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial();
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const queryPatientSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["name", "phone", "createdAt", "patientId"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  departmentId: z.string().optional(),
});

export type QueryPatientInput = z.infer<typeof queryPatientSchema>;
