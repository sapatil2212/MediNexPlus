import { z } from "zod";

export const createSubDepartmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional(),
  type: z.enum([
    "PHARMACY", "PATHOLOGY", "RADIOLOGY", "PROCEDURE", "LABORATORY",
    "DENTAL", "DERMATOLOGY", "HAIR", "ONCOLOGY", "CARDIOLOGY", "BILLING", "RECEPTION", "OTHER",
    "HR", "ACCOUNTS", "NURSING", "HOUSEKEEPING", "AMBULANCE", "BIOMEDICAL",
    "OT", "DIALYSIS", "PHYSIOTHERAPY", "COSMETIC", "ENDOSCOPY",
    "BLOOD_BANK", "ECG",
    "OPD", "IPD", "EMERGENCY", "ICU", "GENERAL_MEDICINE", "SURGERY", "GYNECOLOGY", "PEDIATRICS",
    "CLINICAL_PROCEDURE",
    "CUSTOM",
  ]),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  flow: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  hodStaffId: z.string().optional().nullable(),
  hodName: z.string().optional().nullable(),
  hodEmail: z.string().email().optional().nullable(),
  hodPhone: z.string().optional().nullable(),
  loginEmail: z.string().email().optional().nullable(),
  isActive: z.boolean().optional(),
  accessFeatures: z.string().optional().nullable(),
  customName: z.string().optional().nullable(),
});

export const updateSubDepartmentSchema = createSubDepartmentSchema.partial();

export const querySubDepartmentSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  isActive: z.string().optional(),
  departmentId: z.string().optional(),
  page: z.string().optional().transform((v) => parseInt(v || "1")),
  limit: z.string().optional().transform((v) => parseInt(v || "20")),
});

export const createProcedureSchema = z.object({
  subDepartmentId: z.string().min(1, "Sub-department is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  type: z.enum(["DIAGNOSTIC", "TREATMENT", "CONSULTATION", "SURGERY", "THERAPY", "MEDICATION", "OTHER"]).optional(),
  fee: z.number().min(0).optional().nullable(),
  duration: z.number().int().min(1).optional().nullable(),
  sequence: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateProcedureSchema = createProcedureSchema.partial().omit({ subDepartmentId: true });

export type CreateSubDepartmentInput = z.infer<typeof createSubDepartmentSchema>;
export type UpdateSubDepartmentInput = z.infer<typeof updateSubDepartmentSchema>;
export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;
export type UpdateProcedureInput = z.infer<typeof updateProcedureSchema>;
