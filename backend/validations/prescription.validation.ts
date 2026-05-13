import { z } from "zod";

export const createPrescriptionSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  vitals: z.string().optional(),
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  icdCodes: z.string().optional(),
  medications: z.string().optional(),
  labTests: z.string().optional(),
  referrals: z.string().optional(),
  advice: z.string().optional(),
  followUpDate: z.string().optional(),
  followUpNotes: z.string().optional(),
  consultationFee: z.number().optional(),
  doctorNotes: z.string().optional(),
  status: z.enum(["DRAFT", "COMPLETED", "IN_WORKFLOW", "BILLING_PENDING", "BILLED", "CLOSED"]).optional(),
});

export const updatePrescriptionSchema = z.object({
  vitals: z.string().optional(),
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  icdCodes: z.string().optional(),
  medications: z.string().optional(),
  labTests: z.string().optional(),
  referrals: z.string().optional(),
  advice: z.string().optional(),
  followUpDate: z.string().nullable().optional(),
  followUpNotes: z.string().optional(),
  consultationFee: z.number().optional(),
  aiSuggestions: z.string().optional(),
  doctorNotes: z.string().optional(),
  status: z.enum(["DRAFT", "COMPLETED", "IN_WORKFLOW", "BILLING_PENDING", "BILLED", "CLOSED"]).optional(),
  treatmentPlanId: z.string().optional(),
});

export const aiAssistSchema = z.object({
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  patientAge: z.number().optional().nullable(),
  patientGender: z.string().optional().nullable(),
  vitals: z.record(z.string(), z.any()).optional().nullable(),
  patientHistory: z.string().optional().nullable(),
  doctorSpecialization: z.string().optional().nullable(),
  departmentName: z.string().optional().nullable(),
});

export const workflowUpdateSchema = z.object({
  workflowId: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"]),
  notes: z.string().optional(),
  completedBy: z.string().optional(),
  charges: z.string().optional(),
  totalCharge: z.number().optional(),
});

export const generateBillSchema = z.object({
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>;
export type AiAssistInput = z.infer<typeof aiAssistSchema>;
export type WorkflowUpdateInput = z.infer<typeof workflowUpdateSchema>;
export type GenerateBillInput = z.infer<typeof generateBillSchema>;
