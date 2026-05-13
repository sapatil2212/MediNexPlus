import prisma from "../config/db";
import { Prisma, DayOfWeek } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// AVAILABILITY REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface AvailabilityData {
  doctorId: string;
  hospitalId: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  isActive?: boolean;
}

// Create or update availability for a specific day
export const upsertAvailability = async (data: AvailabilityData) => {
  return prisma.doctorAvailability.upsert({
    where: {
      doctorId_day: { doctorId: data.doctorId, day: data.day },
    },
    update: {
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration ?? 30,
      isActive: data.isActive ?? true,
    },
    create: {
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration ?? 30,
      isActive: data.isActive ?? true,
    },
  });
};

// Find all availability slots for a doctor
export const findAvailabilityByDoctor = async (doctorId: string, hospitalId: string) => {
  return prisma.doctorAvailability.findMany({
    where: { doctorId, hospitalId },
    orderBy: { day: "asc" },
  });
};

// Find availability for a specific day
export const findAvailabilityByDay = async (
  doctorId: string,
  hospitalId: string,
  day: DayOfWeek
) => {
  return prisma.doctorAvailability.findFirst({
    where: { doctorId, hospitalId, day },
  });
};

// Update availability slot
export const updateAvailability = async (
  id: string,
  hospitalId: string,
  data: Partial<AvailabilityData>
) => {
  return prisma.doctorAvailability.updateMany({
    where: { id, hospitalId },
    data: {
      ...(data.startTime ? { startTime: data.startTime } : {}),
      ...(data.endTime ? { endTime: data.endTime } : {}),
      ...(data.slotDuration !== undefined ? { slotDuration: data.slotDuration } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
};

// Delete availability for a specific day
export const deleteAvailability = async (doctorId: string, hospitalId: string, day: DayOfWeek) => {
  return prisma.doctorAvailability.deleteMany({
    where: { doctorId, hospitalId, day },
  });
};

// Delete availability by ID
export const deleteAvailabilityById = async (id: string, hospitalId: string) => {
  return prisma.doctorAvailability.deleteMany({
    where: { id, hospitalId },
  });
};

// Bulk create/update availability (for copying to multiple days)
export const bulkUpsertAvailability = async (
  doctorId: string,
  hospitalId: string,
  days: DayOfWeek[],
  startTime: string,
  endTime: string,
  slotDuration: number = 30
) => {
  const operations = days.map((day) =>
    prisma.doctorAvailability.upsert({
      where: {
        doctorId_day: { doctorId, day },
      },
      update: {
        startTime,
        endTime,
        slotDuration,
        isActive: true,
      },
      create: {
        doctorId,
        hospitalId,
        day,
        startTime,
        endTime,
        slotDuration,
        isActive: true,
      },
    })
  );

  return prisma.$transaction(operations);
};

// Clear all availability for a doctor
export const clearAllAvailability = async (doctorId: string, hospitalId: string) => {
  return prisma.doctorAvailability.deleteMany({
    where: { doctorId, hospitalId },
  });
};

// Toggle availability active status
export const toggleAvailabilityStatus = async (
  id: string,
  hospitalId: string,
  isActive: boolean
) => {
  return prisma.doctorAvailability.updateMany({
    where: { id, hospitalId },
    data: { isActive },
  });
};

// Get weekly schedule for a doctor (formatted)
export const getWeeklySchedule = async (doctorId: string, hospitalId: string) => {
  const availability = await prisma.doctorAvailability.findMany({
    where: { doctorId, hospitalId },
    orderBy: { day: "asc" },
  });

  // Create a map with all days
  const schedule: Record<string, any> = {
    MONDAY: null,
    TUESDAY: null,
    WEDNESDAY: null,
    THURSDAY: null,
    FRIDAY: null,
    SATURDAY: null,
    SUNDAY: null,
  };

  availability.forEach((slot) => {
    schedule[slot.day] = {
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotDuration: slot.slotDuration,
      isActive: slot.isActive,
    };
  });

  return schedule;
};
