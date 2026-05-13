import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];

type Params = { params: Promise<{ id: string }> };

// GET /api/config/doctors/[id]/schedule-overrides?month=2026-01
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id: doctorId } = await params;
    const prisma = (await import("../../../../../../../backend/config/db")).default;
    const sp = req.nextUrl.searchParams;
    const month = sp.get("month");
    const year = sp.get("year");

    let dateFrom: Date, dateTo: Date;
    if (year) {
      dateFrom = new Date(`${year}-01-01T00:00:00.000Z`);
      dateTo   = new Date(`${year}-12-31T23:59:59.999Z`);
    } else if (month) {
      const [y, m] = month.split("-").map(Number);
      dateFrom = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      dateTo   = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    } else {
      const now = new Date();
      const y = now.getUTCFullYear(), m = now.getUTCMonth();
      dateFrom = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
      dateTo   = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    }

    const overrides = await (prisma as any).doctorDateOverride.findMany({
      where: {
        doctorId,
        hospitalId: auth.hospitalId,
        date: { gte: dateFrom, lte: dateTo },
      },
      orderBy: { date: "asc" },
    });

    return successResponse(overrides, "Date overrides fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch overrides", 500);
  }
}

// POST /api/config/doctors/[id]/schedule-overrides
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id: doctorId } = await params;
    const prisma = (await import("../../../../../../../backend/config/db")).default;
    const body = await req.json();

    if (body.overrides && Array.isArray(body.overrides)) {
      const results = [];
      for (const ov of body.overrides) {
        const dateObj = new Date(ov.date);
        const result = await (prisma as any).doctorDateOverride.upsert({
          where: { doctorId_date: { doctorId, date: dateObj } },
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
            doctorId,
            hospitalId: auth.hospitalId,
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

    const dateObj = new Date(body.date);
    const result = await (prisma as any).doctorDateOverride.upsert({
      where: { doctorId_date: { doctorId, date: dateObj } },
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
        doctorId,
        hospitalId: auth.hospitalId,
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

// DELETE /api/config/doctors/[id]/schedule-overrides?date=2026-01-15 or ?month=2026-01
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id: doctorId } = await params;
    const prisma = (await import("../../../../../../../backend/config/db")).default;
    const sp = req.nextUrl.searchParams;
    const date = sp.get("date");
    const month = sp.get("month");

    if (date) {
      const result = await (prisma as any).doctorDateOverride.deleteMany({
        where: {
          doctorId,
          hospitalId: auth.hospitalId,
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
        where: { doctorId, hospitalId: auth.hospitalId, date: { gte: dateFrom, lte: dateTo } },
      });
      return successResponse({ deleted: result.count }, "Month overrides cleared");
    }

    return errorResponse("Provide ?date= or ?month=", 400);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to delete override", 500);
  }
}
