import { z } from "zod";

// Department Type Enum
export const DepartmentTypeEnum = z.enum(["OPD", "IPD", "CLINICAL", "DIAGNOSTIC", "PROCEDURE", "SUPPORT", "ADMINISTRATIVE", "CUSTOM"]);
export type DepartmentType = z.infer<typeof DepartmentTypeEnum>;

// Create Department Schema
export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  code: z.string().min(1, "Code is required").max(10).transform(v => v.toUpperCase()),
  description: z.string().max(500).optional().nullable(),
  type: DepartmentTypeEnum.default("CLINICAL"),
  consultationFee: z.number().min(0, "Consultation fee cannot be negative").optional().nullable(),
  allowAppointments: z.boolean().default(true),
  isIPD: z.boolean().default(false),
  hodDoctorId: z.string().uuid("Invalid doctor ID").optional().nullable(),
  hodUserId: z.string().uuid("Invalid user ID").optional().nullable(),
  customTypeName: z.string().max(100).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  billingCode: z.string().max(20).optional().nullable(),
  isActive: z.boolean().default(true),
  loginEmail: z.string().email("Invalid login email").optional().nullable(),
  loginPassword: z.string().min(4, "Password must be at least 4 characters").optional().nullable(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

// Update Department Schema (all fields optional)
export const updateDepartmentSchema = createDepartmentSchema.partial();
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

// Query Department Schema for GET requests
export const queryDepartmentSchema = z.object({
  search: z.string().optional(),
  type: DepartmentTypeEnum.optional() as z.ZodOptional<typeof DepartmentTypeEnum>,
  isActive: z.enum(["true", "false"]).optional().transform(v => v === "true" ? true : v === "false" ? false : undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["name", "code", "type", "createdAt", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type QueryDepartmentInput = z.infer<typeof queryDepartmentSchema>;

// Toggle Status Schema
export const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

// Seed Defaults Schema
export const seedDefaultsSchema = z.object({
  overwrite: z.boolean().default(false),
});

// Helper function to generate department code from name
export const generateCodeFromName = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "") // Remove special characters
    .slice(0, 10); // Truncate to 10 characters
};

// Default departments for onboarding
export const DEFAULT_DEPARTMENTS = [
  {
    name: "General OPD",
    code: "GENOPD",
    description: "General Outpatient Department for routine consultations",
    type: "OPD" as const,
    allowAppointments: true,
    isIPD: false,
    isActive: true,
  },
  {
    name: "Dental",
    code: "DENTAL",
    description: "Dental care and oral health services",
    type: "OPD" as const,
    allowAppointments: true,
    isIPD: false,
    isActive: true,
  },
  {
    name: "Dermatology",
    code: "DERM",
    description: "Skin care and dermatological treatments",
    type: "OPD" as const,
    allowAppointments: true,
    isIPD: false,
    isActive: true,
  },
  {
    name: "Pediatrics",
    code: "PEDIA",
    description: "Child healthcare and pediatric services",
    type: "OPD" as const,
    allowAppointments: true,
    isIPD: false,
    isActive: true,
  },
];
