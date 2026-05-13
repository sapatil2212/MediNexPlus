import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  doctorId: z.string().uuid("Invalid doctor ID").optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  appointmentDate: z.coerce.date(),
  timeSlot: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional()
    .nullable(),
  type: z.enum(["OPD", "ONLINE", "FOLLOW_UP", "EMERGENCY"]).default("OPD"),
  consultationFee: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  subDepartmentId: z.string().uuid("Invalid sub-department ID").optional().nullable(),
  subDeptNote: z.string().max(1000).optional().nullable(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z.object({
  appointmentDate: z.coerce.date().optional(),
  timeSlot: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  type: z.enum(["OPD", "ONLINE", "FOLLOW_UP", "EMERGENCY"]).optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"])
    .optional(),
  consultationFee: z.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  tokenNumber: z.number().int().min(1).optional().nullable(),
  subDepartmentId: z.string().uuid().optional().nullable(),
  subDeptNote: z.string().max(1000).optional().nullable(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

export const queryAppointmentSchema = z.object({
  search: z.string().optional(),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  subDepartmentId: z.string().uuid().optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"])
    .optional(),
  type: z.enum(["OPD", "ONLINE", "FOLLOW_UP", "EMERGENCY"]).optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(20),
  sortBy: z.enum(["appointmentDate", "createdAt", "timeSlot"]).default("appointmentDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type QueryAppointmentInput = z.infer<typeof queryAppointmentSchema>;
