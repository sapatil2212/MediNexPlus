import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getDoctorWeeklySchedule,
  setAvailability,
  removeDayAvailability,
  clearDoctorAvailability,
  toggleDayAvailability,
  AvailabilityServiceError,
} from "../../../../../backend/services/availability.service";
import {
  availabilitySchema,
  DayOfWeekEnum,
} from "../../../../../backend/validations/doctor.validation";
import { z } from "zod";

async function getDoctor(userId: string) {
  const prisma = (await import("../../../../../backend/config/db")).default;
  return (prisma as any).doctor.findFirst({ where: { userId } });
}

// GET /api/doctor/availability — weekly schedule for logged-in doctor
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const schedule = await getDoctorWeeklySchedule(doctor.id, doctor.hospitalId);
    return successResponse(schedule, "Weekly schedule fetched");
  } catch (e: any) {
    if (e instanceof AvailabilityServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message || "Failed to fetch schedule", 500);
  }
}

// POST /api/doctor/availability — set/update a day's schedule
export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const body = await req.json();

    // Bulk schedules array (from weekly editor)
    if (body.schedules && Array.isArray(body.schedules)) {
      const prisma = (await import("../../../../../backend/config/db")).default;
      await prisma.doctorAvailability.deleteMany({
        where: { doctorId: doctor.id, hospitalId: doctor.hospitalId },
      });
      const created = await prisma.doctorAvailability.createMany({
        data: body.schedules.map((s: any) => ({
          doctorId: doctor.id,
          hospitalId: doctor.hospitalId,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration || 30,
          bufferTime: s.bufferTime || 0,
          maxPatientsPerSlot: s.maxPatientsPerSlot || 1,
          isActive: s.isActive !== false,
        })),
      });
      return successResponse({ count: created.count }, "Weekly schedule saved");
    }

    // Single day
    const result = availabilitySchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const saved = await setAvailability(doctor.id, doctor.hospitalId, result.data);
    return successResponse(saved, "Availability set");
  } catch (e: any) {
    if (e instanceof AvailabilityServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message || "Failed to save schedule", 500);
  }
}

// PATCH /api/doctor/availability — toggle a day active/inactive
export async function PATCH(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const body = await req.json();
    const schema = z.object({ day: DayOfWeekEnum, isActive: z.boolean() });
    const result = schema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const res = await toggleDayAvailability(doctor.id, doctor.hospitalId, result.data.day, result.data.isActive);
    return successResponse(res, "Day status updated");
  } catch (e: any) {
    if (e instanceof AvailabilityServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message || "Failed to toggle", 500);
  }
}

// DELETE /api/doctor/availability?day=MONDAY or ?all=true
export async function DELETE(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const sp = req.nextUrl.searchParams;
    if (sp.get("all") === "true") {
      const res = await clearDoctorAvailability(doctor.id, doctor.hospitalId);
      return successResponse(res, "All availability cleared");
    }

    const day = sp.get("day");
    if (!day) return errorResponse("Provide ?day= or ?all=true", 400);
    const validDay = DayOfWeekEnum.safeParse(day);
    if (!validDay.success) return errorResponse("Invalid day", 400);

    const res = await removeDayAvailability(doctor.id, doctor.hospitalId, validDay.data);
    return successResponse(res, "Day removed");
  } catch (e: any) {
    if (e instanceof AvailabilityServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message || "Failed to delete", 500);
  }
}
