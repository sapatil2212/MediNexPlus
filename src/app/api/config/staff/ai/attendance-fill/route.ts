import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import prisma from "../../../../../../../backend/config/db";

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { staffId, month, year, mode } = body;

    if (!staffId || !month || !year) return errorResponse("staffId, month, year required", 400);

    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch existing records to avoid overwriting manual entries
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const existing = await (prisma as any).staffAttendance.findMany({
      where: { hospitalId: auth.hospitalId, staffId, date: { gte: startDate, lte: endDate } },
    });
    const existingDates = new Set(existing.map((r: any) => new Date(r.date).toISOString().split("T")[0]));

    // Fetch staff working days
    const staff = await (prisma as any).staff.findFirst({ where: { id: staffId, hospitalId: auth.hospitalId } });
    const workingDays = staff?.workingDays || 26;

    const records: any[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split("T")[0];

      // Don't overwrite existing manual entries unless mode is "overwrite"
      if (existingDates.has(dateStr) && mode !== "overwrite") continue;

      // Don't mark future dates
      if (date > today) continue;

      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
      let status = "PRESENT";
      let inTime = "09:00";
      let outTime = "18:00";

      if (dayOfWeek === 0) {
        // Sunday = Holiday
        status = "HOLIDAY";
        inTime = "";
        outTime = "";
      } else if (mode === "weekdays_only" && dayOfWeek === 6) {
        // Saturday off if weekdays_only mode
        status = "HOLIDAY";
        inTime = "";
        outTime = "";
      }

      records.push({
        hospitalId: auth.hospitalId,
        staffId,
        date,
        inTime: inTime || null,
        outTime: outTime || null,
        status,
        notes: status === "HOLIDAY" ? "Auto-filled (Holiday)" : "Auto-filled",
      });
    }

    // Bulk upsert
    let filled = 0;
    for (const rec of records) {
      await (prisma as any).staffAttendance.upsert({
        where: {
          hospitalId_staffId_date: {
            hospitalId: auth.hospitalId,
            staffId,
            date: rec.date,
          },
        },
        update: { inTime: rec.inTime, outTime: rec.outTime, status: rec.status, notes: rec.notes },
        create: rec,
      });
      filled++;
    }

    return successResponse(
      { filled, skipped: existingDates.size, total: daysInMonth },
      `Auto-filled ${filled} days. ${existingDates.size} existing entries ${mode === "overwrite" ? "overwritten" : "preserved"}.`
    );
  } catch (e: any) {
    console.error("Attendance fill error:", e);
    return errorResponse(e.message || "Failed to auto-fill attendance", 500);
  }
}
