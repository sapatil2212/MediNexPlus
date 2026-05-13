import {
  upsertAvailability,
  findAvailabilityByDoctor,
  findAvailabilityByDay,
  updateAvailability,
  deleteAvailability,
  deleteAvailabilityById,
  bulkUpsertAvailability,
  clearAllAvailability,
  toggleAvailabilityStatus,
  getWeeklySchedule,
} from "../repositories/availability.repo";
import { findDoctorById } from "../repositories/doctor.repo";
import prisma from "../config/db";
const px = prisma as any;
import {
  AvailabilityInput,
  BulkAvailabilityInput,
  generateTimeSlots,
  DayOfWeek,
  ALL_DAYS,
} from "../validations/doctor.validation";

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABILITY SERVICE - Business logic layer
// ─────────────────────────────────────────────────────────────────────────────

export class AvailabilityServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "AvailabilityServiceError";
  }
}

/**
 * Validate doctor exists and belongs to hospital
 */
const validateDoctor = async (doctorId: string, hospitalId: string) => {
  const doctor = await findDoctorById(doctorId, hospitalId);
  if (!doctor) {
    throw new AvailabilityServiceError(
      "Doctor not found",
      "DOCTOR_NOT_FOUND",
      404
    );
  }
  return doctor;
};

/**
 * Set availability for a specific day
 */
export const setAvailability = async (
  doctorId: string,
  hospitalId: string,
  input: AvailabilityInput
) => {
  await validateDoctor(doctorId, hospitalId);

  const availability = await upsertAvailability({
    doctorId,
    hospitalId,
    day: input.day as any,
    startTime: input.startTime,
    endTime: input.endTime,
    slotDuration: input.slotDuration,
    isActive: input.isActive,
  });

  // Calculate time slots
  const timeSlots = generateTimeSlots(
    input.startTime,
    input.endTime,
    input.slotDuration || 30
  );

  return {
    ...availability,
    generatedSlots: timeSlots,
    totalSlots: timeSlots.length,
  };
};

/**
 * Get weekly schedule for a doctor
 */
export const getDoctorWeeklySchedule = async (
  doctorId: string,
  hospitalId: string
) => {
  await validateDoctor(doctorId, hospitalId);
  
  const schedule = await getWeeklySchedule(doctorId, hospitalId);
  
  // Add generated slots for each day
  const enhancedSchedule: Record<string, any> = {};
  
  for (const day of ALL_DAYS) {
    if (schedule[day]) {
      const slots = generateTimeSlots(
        schedule[day].startTime,
        schedule[day].endTime,
        schedule[day].slotDuration || 30
      );
      enhancedSchedule[day] = {
        ...schedule[day],
        generatedSlots: slots,
        totalSlots: slots.length,
      };
    } else {
      enhancedSchedule[day] = null;
    }
  }

  return enhancedSchedule;
};

/**
 * Get availability for a specific day
 */
export const getDayAvailability = async (
  doctorId: string,
  hospitalId: string,
  day: DayOfWeek
) => {
  await validateDoctor(doctorId, hospitalId);
  
  const availability = await findAvailabilityByDay(doctorId, hospitalId, day as any);
  
  if (!availability) {
    return null;
  }

  const slots = generateTimeSlots(
    availability.startTime,
    availability.endTime,
    availability.slotDuration || 30
  );

  return {
    ...availability,
    generatedSlots: slots,
    totalSlots: slots.length,
  };
};

/**
 * Copy schedule to multiple days
 */
export const copyScheduleToAllDays = async (
  doctorId: string,
  hospitalId: string,
  input: BulkAvailabilityInput
) => {
  await validateDoctor(doctorId, hospitalId);

  const result = await bulkUpsertAvailability(
    doctorId,
    hospitalId,
    input.days as any[],
    input.startTime,
    input.endTime,
    input.slotDuration || 30
  );

  return {
    updatedDays: input.days,
    count: result.length,
    schedule: await getDoctorWeeklySchedule(doctorId, hospitalId),
  };
};

/**
 * Copy a day's schedule to other selected days
 */
export const copyDayToOtherDays = async (
  doctorId: string,
  hospitalId: string,
  sourceDay: DayOfWeek,
  targetDays: DayOfWeek[]
) => {
  await validateDoctor(doctorId, hospitalId);

  // Get source day availability
  const sourceAvailability = await findAvailabilityByDay(
    doctorId,
    hospitalId,
    sourceDay as any
  );

  if (!sourceAvailability) {
    throw new AvailabilityServiceError(
      `No availability set for ${sourceDay}`,
      "NO_SOURCE_AVAILABILITY",
      400
    );
  }

  // Copy to target days
  const result = await bulkUpsertAvailability(
    doctorId,
    hospitalId,
    targetDays as any[],
    sourceAvailability.startTime,
    sourceAvailability.endTime,
    sourceAvailability.slotDuration
  );

  return {
    sourceDay,
    copiedToDays: targetDays,
    count: result.length,
  };
};

/**
 * Toggle availability status for a day
 */
export const toggleDayAvailability = async (
  doctorId: string,
  hospitalId: string,
  day: DayOfWeek,
  isActive: boolean
) => {
  await validateDoctor(doctorId, hospitalId);

  const availability = await findAvailabilityByDay(doctorId, hospitalId, day as any);
  if (!availability) {
    throw new AvailabilityServiceError(
      `No availability set for ${day}`,
      "AVAILABILITY_NOT_FOUND",
      404
    );
  }

  await toggleAvailabilityStatus(availability.id, hospitalId, isActive);
  
  return {
    day,
    isActive,
  };
};

/**
 * Remove availability for a specific day
 */
export const removeDayAvailability = async (
  doctorId: string,
  hospitalId: string,
  day: DayOfWeek
) => {
  await validateDoctor(doctorId, hospitalId);

  const result = await deleteAvailability(doctorId, hospitalId, day as any);
  
  if (result.count === 0) {
    throw new AvailabilityServiceError(
      `No availability found for ${day}`,
      "AVAILABILITY_NOT_FOUND",
      404
    );
  }

  return { day, deleted: true };
};

/**
 * Clear all availability for a doctor
 */
export const clearDoctorAvailability = async (
  doctorId: string,
  hospitalId: string
) => {
  await validateDoctor(doctorId, hospitalId);

  const result = await clearAllAvailability(doctorId, hospitalId);
  
  return { 
    doctorId, 
    cleared: true, 
    count: result.count 
  };
};

/**
 * Get available slots for a specific date
 * (Takes into account leaves and existing appointments in the future)
 */
export const getAvailableSlotsForDate = async (
  doctorId: string,
  hospitalId: string,
  date: Date
) => {
  await validateDoctor(doctorId, hospitalId);

  const dayNames: DayOfWeek[] = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
  ];
  const dayOfWeek = dayNames[date.getDay()];
  const dateStr = date.toISOString().split("T")[0];

  // ── Check for a date-specific override FIRST ─────────────────────────────
  const dateOverride = await px.doctorDateOverride.findFirst({
    where: {
      doctorId,
      hospitalId,
      date: {
        gte: new Date(dateStr + "T00:00:00.000Z"),
        lte: new Date(dateStr + "T23:59:59.999Z"),
      },
    },
  });

  // Override says doctor is off
  if (dateOverride && dateOverride.isOff) {
    return {
      date: dateStr,
      dayOfWeek,
      available: false,
      isOverride: true,
      message: "Doctor is not available on this date (override)",
      slots: [],
    };
  }

  // Use override times if present, else fall back to weekly
  let effectiveStart: string;
  let effectiveEnd: string;
  let effectiveDuration: number;

  if (dateOverride && dateOverride.startTime && dateOverride.endTime) {
    effectiveStart    = dateOverride.startTime;
    effectiveEnd      = dateOverride.endTime;
    effectiveDuration = dateOverride.slotDuration || 30;
  } else {
    const availability = await findAvailabilityByDay(doctorId, hospitalId, dayOfWeek as any);
    if (!availability || !availability.isActive) {
      return {
        date: dateStr,
        dayOfWeek,
        available: false,
        message: "Doctor is not available on this day",
        slots: [],
      };
    }
    effectiveStart    = availability.startTime;
    effectiveEnd      = availability.endTime;
    effectiveDuration = availability.slotDuration || 30;
  }

  let slots = generateTimeSlots(effectiveStart, effectiveEnd, effectiveDuration);

  // Remove break slots from override
  if (dateOverride?.breaks) {
    try {
      const breaks: { start: string; end: string }[] = typeof dateOverride.breaks === "string"
        ? JSON.parse(dateOverride.breaks)
        : dateOverride.breaks;
      slots = slots.filter(slot => {
        const [sh, sm] = slot.split(":").map(Number);
        const slotMin = sh * 60 + sm;
        return !breaks.some(br => {
          const [bsh, bsm] = br.start.split(":").map(Number);
          const [beh, bem] = br.end.split(":").map(Number);
          return slotMin >= bsh * 60 + bsm && slotMin < beh * 60 + bem;
        });
      });
    } catch { /* ignore */ }
  }

  return {
    date: dateStr,
    dayOfWeek,
    available: true,
    isOverride: !!dateOverride,
    startTime: effectiveStart,
    endTime: effectiveEnd,
    slotDuration: effectiveDuration,
    slots: slots.map((time) => ({ time, status: "available" })),
    totalSlots: slots.length,
  };
};
