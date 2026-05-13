import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z.string().min(1, "Permission name is required"),
  code: z.string().min(1, "Permission code is required"),
  module: z.string().min(1, "Module is required"),
  action: z.string().min(1, "Action is required"),
  description: z.string().optional(),
});

export const assignRolePermissionSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "HOSPITAL_ADMIN", "DOCTOR", "RECEPTIONIST", "STAFF", "SUB_DEPT_HEAD", "FINANCE_HEAD"]),
  permissionIds: z.array(z.string()),
});

export const assignUserPermissionSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  permissionId: z.string().min(1, "Permission ID is required"),
  granted: z.boolean().default(true),
});

export const checkPermissionSchema = z.object({
  userId: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "HOSPITAL_ADMIN", "DOCTOR", "RECEPTIONIST", "STAFF", "SUB_DEPT_HEAD", "FINANCE_HEAD"]).optional(),
  permissionCode: z.string().min(1, "Permission code is required"),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type AssignRolePermissionInput = z.infer<typeof assignRolePermissionSchema>;
export type AssignUserPermissionInput = z.infer<typeof assignUserPermissionSchema>;
export type CheckPermissionInput = z.infer<typeof checkPermissionSchema>;
