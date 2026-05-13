import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import {
  setAvailability,
  getDoctorWeeklySchedule,
  getDayAvailability,
  copyScheduleToAllDays,
  copyDayToOtherDays,
  toggleDayAvailability,
  removeDayAvailability,
  clearDoctorAvailability,
  getAvailableSlotsForDate,
  AvailabilityServiceError,
} from "../../../../../../../backend/services/availability.service";
import {
  availabilitySchema,
  bulkAvailabilitySchema,
  DayOfWeekEnum,
} from "../../../../../../../backend/validations/doctor.validation";
import { z } from "zod";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/config/doctors/[id]/availability - Get weekly schedule
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id: doctorId } = await params;
    const { searchParams } = new URL(req.url);

    // Get specific day availability
    const day = searchParams.get("day");
    if (day) {
      const validDay = DayOfWeekEnum.safeParse(day);
      if (!validDay.success) {
        return errorResponse("Invalid day", 400);
      }
      const availability = await getDayAvailability(doctorId, auth.hospitalId, validDay.data);
      return successResponse(availability, "Day availability fetched");
    }

    // Get available slots for a specific date
    const date = searchParams.get("date");
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return errorResponse("Invalid date format", 400);
      }
      const slots = await getAvailableSlotsForDate(doctorId, auth.hospitalId, parsedDate);
      return successResponse(slots, "Available slots fetched");
    }

    // Get full weekly schedule
    const schedule = await getDoctorWeeklySchedule(doctorId, auth.hospitalId);
    return successResponse(schedule, "Weekly schedule fetched");
  } catch (e: any) {
    if (e instanceof AvailabilityServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/config/doctors/[id]/availability - Set/update availability
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id: doctorId } = await params;
    const body = await req.json();
    const { searchParams } = new URL(req.url);

    // Bulk schedule update from ScheduleModal
    if (body.schedules && Array.isArray(body.schedules)) {
      const prisma = (await import("../../../../../../../backend/config/db")).default;
      
      // Delete existing schedules
      await prisma.doctorAvailability.deleteMany({
        where: { doctorId, hospitalId: auth.hospitalId },
      });

      // Create new schedules
      const created = await prisma.doctorAvailability.createMany({
        data: body.schedules.map((s: any) => ({
          doctorId,
          hospitalId: auth.hospitalId,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration || 30,
          bufferTime: s.bufferTime || 0,
          maxPatientsPerSlot: s.maxPatientsPerSlot || 1,
          breaks: s.breaks || null,
          generatedSlots: s.generatedSlots || null,
          isActive: s.isActive !== false,
        })),
      });

      return successResponse({ count: created.count }, "Weekly schedule saved successfully", 201);
    }

    // Bulk update - copy to multiple days
    if (searchParams.get("bulk") === "true") {
      const result = bulkAvailabilitySchema.safeParse(body);
      if (!result.success) {
        return errorResponse("Validation failed", 400, result.error.issues);
      }
      const response = await copyScheduleToAllDays(doctorId, auth.hospitalId, result.data);
      return successResponse(response, "Availability copied to selected days", 201);
    }

    // Copy from one day to others
    if (searchParams.get("copy") === "true") {
      const copySchema = z.object({
        sourceDay: DayOfWeekEnum,
        targetDays: z.array(DayOfWeekEnum).min(1),
      });
      const result = copySchema.safeParse(body);
      if (!result.success) {
        return errorResponse("Validation failed", 400, result.error.issues);
      }
      const response = await copyDayToOtherDays(
        doctorId,
        auth.hospitalId,
        result.data.sourceDay,
        result.data.targetDays
      );
      return successResponse(response, "Schedule copied successfully", 201);
    }

    // Single day availability
    const result = availabilitySchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const availability = await setAvailability(doctorId, auth.hospitalId, result.data);
    return successResponse(availability, "Availability set successfully", 201);
  } catch (e: any) {
    if (e instanceof AvailabilityServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/config/doctors/[id]/availability - Toggle day active status
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id: doctorId } = await params;
    const body = await req.json();

    const toggleSchema = z.object({
      day: DayOfWeekEnum,
      isActive: z.boolean(),
    });

    const result = toggleSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const response = await toggleDayAvailability(
      doctorId,
      auth.hospitalId,
      result.data.day,
      result.data.isActive
    );
    return successResponse(response, "Availability status updated");
  } catch (e: any) {
    if (e instanceof AvailabilityServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/config/doctors/[id]/availability - Remove availability
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id: doctorId } = await params;
    const { searchParams } = new URL(req.url);

    // Clear all availability
    if (searchParams.get("all") === "true") {
      const response = await clearDoctorAvailability(doctorId, auth.hospitalId);
      return successResponse(response, "All availability cleared");
    }

    // Remove specific day
    const day = searchParams.get("day");
    if (!day) {
      return errorResponse("Provide 'day' query param or 'all=true'", 400);
    }

    const validDay = DayOfWeekEnum.safeParse(day);
    if (!validDay.success) {
      return errorResponse("Invalid day", 400);
    }

    const response = await removeDayAvailability(doctorId, auth.hospitalId, validDay.data);
    return successResponse(response, "Day availability removed");
  } catch (e: any) {
    if (e instanceof AvailabilityServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}
