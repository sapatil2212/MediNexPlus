import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().default("PACKAGE"),
  departmentId: z.string().optional(),
  subDepartmentId: z.string().optional(),
  sessionCount: z.number().int().min(1).default(1),
  price: z.number().min(0).default(0),
  pricePerSession: z.number().min(0).default(0),
  duration: z.number().int().min(0).optional(),
  validityDays: z.number().int().min(0).optional(),
  requiresPharmacy: z.boolean().default(false),
  requiresLab: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metadata: z.string().optional(),
});

export const updateServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  departmentId: z.string().optional(),
  subDepartmentId: z.string().optional(),
  sessionCount: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  pricePerSession: z.number().min(0).optional(),
  duration: z.number().int().min(0).optional(),
  validityDays: z.number().int().min(0).optional(),
  requiresPharmacy: z.boolean().optional(),
  requiresLab: z.boolean().optional(),
  isActive: z.boolean().optional(),
  metadata: z.string().optional(),
});

export const queryServiceSchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().optional(),
  subDepartmentId: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type QueryServiceInput = z.infer<typeof queryServiceSchema>;
