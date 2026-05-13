import { z } from "zod";

export const createTreatmentPlanSchema = z.object({
  patientId: z.string().optional(),
  serviceId: z.string().optional(),
  procedureId: z.string().optional(),
  departmentId: z.string().optional(),
  subDepartmentId: z.string().optional(),
  doctorId: z.string().optional(),
  planName: z.string().min(1, "Plan name is required"),
  totalSessions: z.number().int().min(1).default(1),
  totalCost: z.number().min(0).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateTreatmentPlanSchema = z.object({
  id: z.string(),
  patientId: z.string().optional(),
  planName: z.string().optional(),
  totalSessions: z.number().int().min(1).optional(),
  completedSessions: z.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD"]).optional(),
  totalCost: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  billingStatus: z.enum(["PENDING", "PARTIAL", "PAID", "CANCELLED"]).optional(),
});

export const createTreatmentSessionSchema = z.object({
  treatmentPlanId: z.string().min(1, "Treatment plan ID is required"),
  sessionNumber: z.number().int().min(1),
  appointmentId: z.string().optional(),
  scheduledDate: z.string().optional(),
  performedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const updateTreatmentSessionSchema = z.object({
  id: z.string(),
  status: z.enum(["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED", "RESCHEDULED"]).optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  performedBy: z.string().optional(),
  notes: z.string().optional(),
  beforePhotos: z.string().optional(),
  afterPhotos: z.string().optional(),
  appointmentId: z.string().optional(),
});

export const queryTreatmentPlanSchema = z.object({
  patientId: z.string().optional(),
  departmentId: z.string().optional(),
  subDepartmentId: z.string().optional(),
  doctorId: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD"]).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>;
export type UpdateTreatmentPlanInput = z.infer<typeof updateTreatmentPlanSchema>;
export type CreateTreatmentSessionInput = z.infer<typeof createTreatmentSessionSchema>;
export type UpdateTreatmentSessionInput = z.infer<typeof updateTreatmentSessionSchema>;
export type QueryTreatmentPlanInput = z.infer<typeof queryTreatmentPlanSchema>;
