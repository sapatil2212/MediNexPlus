import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";

async function getDoctor(userId: string) {
  const prisma = (await import("../../../../../backend/config/db")).default;
  return (prisma as any).doctor.findFirst({ where: { userId } });
}

// GET /api/doctor/schedule-overrides?month=2026-01
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const prisma = (await import("../../../../../backend/config/db")).default;
    const sp = req.nextUrl.searchParams;
    const month = sp.get("month"); // e.g. "2026-01"
    const year = sp.get("year");   // e.g. "2026"

    let dateFrom: Date, dateTo: Date;
    if (year) {
      dateFrom = new Date(`${year}-01-01T00:00:00.000Z`);
      dateTo   = new Date(`${year}-12-31T23:59:59.999Z`);
    } else if (month) {
      const [y, m] = month.split("-").map(Number);
      dateFrom = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      dateTo   = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)); // last day of month
    } else {
      const now = new Date();
      const y = now.getUTCFullYear(), m = now.getUTCMonth();
      dateFrom = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
      dateTo   = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    }

    const overrides = await (prisma as any).doctorDateOverride.findMany({
      where: {
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
        date: { gte: dateFrom, lte: dateTo },
      },
      orderBy: { date: "asc" },
    });

    return successResponse(overrides, "Date overrides fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch overrides", 500);
  }
}

// POST /api/doctor/schedule-overrides — upsert single or bulk
export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const prisma = (await import("../../../../../backend/config/db")).default;
    const body = await req.json();

    // Bulk upsert
    if (body.overrides && Array.isArray(body.overrides)) {
      const results = [];
      for (const ov of body.overrides) {
        const dateObj = new Date(ov.date);
        const result = await (prisma as any).doctorDateOverride.upsert({
          where: { doctorId_date: { doctorId: doctor.id, date: dateObj } },
          update: {
            isOff: ov.isOff ?? false,
            startTime: ov.isOff ? null : (ov.startTime || null),
            endTime: ov.isOff ? null : (ov.endTime || null),
            slotDuration: ov.isOff ? null : (ov.slotDuration || null),
            bufferTime: ov.bufferTime ?? null,
            maxPatientsPerSlot: ov.maxPatientsPerSlot ?? null,
            breaks: ov.breaks ? (typeof ov.breaks === "string" ? ov.breaks : JSON.stringify(ov.breaks)) : null,
            note: ov.note || null,
          },
          create: {
            doctorId: doctor.id,
            hospitalId: doctor.hospitalId,
            date: dateObj,
            isOff: ov.isOff ?? false,
            startTime: ov.isOff ? null : (ov.startTime || null),
            endTime: ov.isOff ? null : (ov.endTime || null),
            slotDuration: ov.isOff ? null : (ov.slotDuration || null),
            bufferTime: ov.bufferTime ?? null,
            maxPatientsPerSlot: ov.maxPatientsPerSlot ?? null,
            breaks: ov.breaks ? (typeof ov.breaks === "string" ? ov.breaks : JSON.stringify(ov.breaks)) : null,
            note: ov.note || null,
          },
        });
        results.push(result);
      }
      return successResponse({ count: results.length }, "Date overrides saved");
    }

    // Single upsert
    const dateObj = new Date(body.date);
    const result = await (prisma as any).doctorDateOverride.upsert({
      where: { doctorId_date: { doctorId: doctor.id, date: dateObj } },
      update: {
        isOff: body.isOff ?? false,
        startTime: body.isOff ? null : (body.startTime || null),
        endTime: body.isOff ? null : (body.endTime || null),
        slotDuration: body.isOff ? null : (body.slotDuration || null),
        bufferTime: body.bufferTime ?? null,
        maxPatientsPerSlot: body.maxPatientsPerSlot ?? null,
        breaks: body.breaks ? (typeof body.breaks === "string" ? body.breaks : JSON.stringify(body.breaks)) : null,
        note: body.note || null,
      },
      create: {
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
        date: dateObj,
        isOff: body.isOff ?? false,
        startTime: body.isOff ? null : (body.startTime || null),
        endTime: body.isOff ? null : (body.endTime || null),
        slotDuration: body.isOff ? null : (body.slotDuration || null),
        bufferTime: body.bufferTime ?? null,
        maxPatientsPerSlot: body.maxPatientsPerSlot ?? null,
        breaks: body.breaks ? (typeof body.breaks === "string" ? body.breaks : JSON.stringify(body.breaks)) : null,
        note: body.note || null,
      },
    });

    return successResponse(result, "Date override saved");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to save override", 500);
  }
}

// DELETE /api/doctor/schedule-overrides?date=2026-01-15 or ?month=2026-01
export async function DELETE(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const prisma = (await import("../../../../../backend/config/db")).default;
    const sp = req.nextUrl.searchParams;
    const date = sp.get("date");
    const month = sp.get("month");

    if (date) {
      const result = await (prisma as any).doctorDateOverride.deleteMany({
        where: {
          doctorId: doctor.id,
          hospitalId: doctor.hospitalId,
          date: {
            gte: new Date(date + "T00:00:00.000Z"),
            lte: new Date(date + "T23:59:59.999Z"),
          },
        },
      });
      return successResponse({ deleted: result.count }, "Override removed");
    }

    if (month) {
      const [y, m] = month.split("-").map(Number);
      const dateFrom = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const dateTo   = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      const result = await (prisma as any).doctorDateOverride.deleteMany({
        where: { doctorId: doctor.id, hospitalId: doctor.hospitalId, date: { gte: dateFrom, lte: dateTo } },
      });
      return successResponse({ deleted: result.count }, "Month overrides cleared");
    }

    return errorResponse("Provide ?date= or ?month=", 400);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to delete override", 500);
  }
}
