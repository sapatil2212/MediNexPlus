import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import prisma from "../../../../../../../backend/config/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await (prisma as any).staffAttendance.findMany({
      where: {
        hospitalId: auth.hospitalId,
        staffId: params.id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    });

    const totalDays = endDate.getDate();
    const presentDays = records.filter((r: any) => r.status === "PRESENT").length;
    const absentDays = records.filter((r: any) => r.status === "ABSENT").length;
    const halfDays = records.filter((r: any) => r.status === "HALF_DAY").length;
    const leaveDays = records.filter((r: any) => r.status === "LEAVE").length;

    return successResponse({
      records,
      summary: { totalDays, presentDays, absentDays, halfDays, leaveDays, marked: records.length },
      month, year,
    });
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch attendance", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { date, inTime, outTime, status, notes } = body;
    if (!date) return errorResponse("Date is required", 400);

    const record = await (prisma as any).staffAttendance.upsert({
      where: {
        hospitalId_staffId_date: {
          hospitalId: auth.hospitalId,
          staffId: params.id,
          date: new Date(date),
        },
      },
      update: { inTime: inTime || null, outTime: outTime || null, status: status || "PRESENT", notes: notes || null },
      create: {
        hospitalId: auth.hospitalId,
        staffId: params.id,
        date: new Date(date),
        inTime: inTime || null,
        outTime: outTime || null,
        status: status || "PRESENT",
        notes: notes || null,
      },
    });
    return successResponse(record, "Attendance saved");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to save attendance", 500);
  }
}
