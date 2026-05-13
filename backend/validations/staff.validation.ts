import { z } from "zod";

// StaffRole Enum
export const StaffRoleEnum = z.enum([
  "NURSE",
  "TECHNICIAN",
  "PHARMACIST",
  "RECEPTIONIST",
  "LAB_TECHNICIAN",
  "ACCOUNTANT",
  "ADMIN",
  "SUPPORT",
  "OTHER"
]);
export type StaffRole = z.infer<typeof StaffRoleEnum>;

// Create Staff Schema
export const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 characters").max(20).optional().nullable(),
  role: StaffRoleEnum,
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  salary: z.number().min(0, "Salary cannot be negative").default(0),
  joinDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  workingDays: z.number().min(1).max(31).default(26).optional(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  bankAccountNo: z.string().max(50).optional().nullable(),
  panNo: z.string().max(20).optional().nullable(),
  pfAccountNo: z.string().max(50).optional().nullable(),
  pfUan: z.string().max(30).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

// Update Staff Schema (all fields optional)
export const updateStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone must be at least 10 characters").max(20).optional().nullable(),
  role: StaffRoleEnum.optional(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  salary: z.number().min(0, "Salary cannot be negative").optional(),
  joinDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  workingDays: z.number().min(1).max(31).optional(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  bankAccountNo: z.string().max(50).optional().nullable(),
  panNo: z.string().max(20).optional().nullable(),
  pfAccountNo: z.string().max(50).optional().nullable(),
  pfUan: z.string().max(30).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// Query Staff Schema for GET requests
export const queryStaffSchema = z.object({
  search: z.string().optional(),
  role: StaffRoleEnum.optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z.enum(["true", "false"]).optional().transform(v => v === "true" ? true : v === "false" ? false : undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sortBy: z.enum(["name", "email", "role", "joinDate", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type QueryStaffInput = z.infer<typeof queryStaffSchema>;

// Staff Login Schema
export const staffLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;

// Change Password Schema
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] }
);

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
