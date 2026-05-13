import { z } from "zod";

// Gender Enum
export const GenderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
export type Gender = z.infer<typeof GenderEnum>;

// Day of Week Enum
export const DayOfWeekEnum = z.enum([
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
]);
export type DayOfWeek = z.infer<typeof DayOfWeekEnum>;

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

// Create Doctor Schema
export const createDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 characters").max(20).optional().nullable(),
  gender: GenderEnum.optional().nullable(),
  profileImage: z.string().url().optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  specialization: z.string().max(100).optional().nullable(),
  qualification: z.string().max(200).optional().nullable(),
  experience: z.number().int().min(0, "Experience cannot be negative").max(70).default(0),
  registrationNo: z.string().max(100).optional().nullable(),
  licenseNo: z.string().max(100).optional().nullable(),
  agreementDoc: z.string().url().optional().nullable(),
  govtIdCard: z.string().url().optional().nullable(),
  signature: z.string().url().optional().nullable(),
  hospitalStamp: z.string().url().optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  consultationFee: z.number().min(0, "Fee cannot be negative").default(0),
  followUpFee: z.number().min(0, "Fee cannot be negative").optional().nullable(),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;

// Update Doctor Schema (all fields optional)
export const updateDoctorSchema = createDoctorSchema.partial();
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;

// Query Doctor Schema for GET requests
export const queryDoctorSchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z.enum(["true", "false"]).optional().transform(v => v === "true" ? true : v === "false" ? false : undefined),
  isAvailable: z.enum(["true", "false"]).optional().transform(v => v === "true" ? true : v === "false" ? false : undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["name", "email", "specialization", "experience", "consultationFee", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type QueryDoctorInput = z.infer<typeof queryDoctorSchema>;

// Toggle Status Schema
export const toggleDoctorStatusSchema = z.object({
  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABILITY SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

// Time validation helper
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Create/Update Availability Schema
export const availabilitySchema = z.object({
  day: DayOfWeekEnum,
  startTime: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
  slotDuration: z.number().int().min(5).max(120).default(30),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return endMinutes > startMinutes;
  },
  { message: "End time must be after start time", path: ["endTime"] }
);

export type AvailabilityInput = z.infer<typeof availabilitySchema>;

// Bulk Availability Schema (for copying to all days)
export const bulkAvailabilitySchema = z.object({
  startTime: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
  slotDuration: z.number().int().min(5).max(120).default(30),
  days: z.array(DayOfWeekEnum).min(1, "Select at least one day"),
});

export type BulkAvailabilityInput = z.infer<typeof bulkAvailabilitySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

// Create Leave Schema
export const createLeaveSchema = z.object({
  leaveFrom: z.coerce.date(),
  leaveTo: z.coerce.date(),
  reason: z.string().max(500).optional().nullable(),
  isApproved: z.boolean().default(true),
}).refine(
  (data) => data.leaveTo >= data.leaveFrom,
  { message: "End date must be on or after start date", path: ["leaveTo"] }
);

export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;

// Query Leave Schema
export const queryLeaveSchema = z.object({
  upcoming: z.enum(["true", "false"]).optional().transform(v => v === "true"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type QueryLeaveInput = z.infer<typeof queryLeaveSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// Generate time slots from availability
export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  slotDuration: number
): string[] => {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + slotDuration <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    currentMinutes += slotDuration;
  }

  return slots;
};

// Check if two time ranges overlap
export const timeRangesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return s1 < e2 && s2 < e1;
};

// All days constant
export const ALL_DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
];
