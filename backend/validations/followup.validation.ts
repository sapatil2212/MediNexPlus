import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW-UP VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const createFollowUpSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  appointmentId: z.string().uuid("Invalid appointment ID").optional().nullable(),
  followUpDate: z.coerce.date(),
  reason: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;

export const updateFollowUpSchema = z.object({
  followUpDate: z.coerce.date().optional(),
  reason: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
});

export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;

export const queryFollowUpSchema = z.object({
  patientId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  today: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  upcoming: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["followUpDate", "createdAt"]).default("followUpDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type QueryFollowUpInput = z.infer<typeof queryFollowUpSchema>;
