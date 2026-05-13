import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";

// GET /api/admin/attendance - Hospital admin view of all doctors' attendance
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  if (user!.role !== "HOSPITAL_ADMIN") return errorResponse("Forbidden", 403);

  try {
    const prisma = (await import("../../../../../backend/config/db")).default;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const doctorId = searchParams.get("doctorId");

    if (!(prisma as any).doctorAttendance) {
      return successResponse([], "Attendance tracking not yet available");
    }

    const hospital = await (prisma as any).hospital.findFirst({
      where: { users: { some: { id: user!.userId } } },
      select: { id: true },
    });
    if (!hospital) return errorResponse("Hospital not found", 404);

    const whereClause: any = { hospitalId: hospital.id };

    if (doctorId) whereClause.doctorId = doctorId;

    if (month) {
      const [yr, mo] = month.split("-").map(Number);
      whereClause.date = {
        gte: new Date(yr, mo - 1, 1),
        lte: new Date(yr, mo, 0, 23, 59, 59),
      };
    }

    const records = await (prisma as any).doctorAttendance.findMany({
      where: whereClause,
      include: {
        doctor: { select: { id: true, name: true, specialization: true, department: { select: { name: true } } } },
      },
      orderBy: [{ date: "desc" }, { loginTime: "desc" }],
    });

    // Build summary per doctor
    const doctorMap: Record<string, any> = {};
    for (const r of records) {
      if (!r.doctor) continue;
      const did = r.doctorId;
      if (!doctorMap[did]) {
        doctorMap[did] = {
          doctorId: did,
          name: r.doctor.name,
          specialization: r.doctor.specialization,
          department: r.doctor.department?.name || "",
          present: 0,
          late: 0,
          halfDay: 0,
          absent: 0,
          totalHours: 0,
          records: [],
        };
      }
      const d = doctorMap[did];
      if (r.status === "PRESENT") d.present++;
      else if (r.status === "LATE") d.late++;
      else if (r.status === "HALF_DAY") d.halfDay++;
      else if (r.status === "ABSENT") d.absent++;
      d.totalHours += r.totalWorkHours || 0;
      d.records.push(r);
    }

    return successResponse({
      records,
      summary: Object.values(doctorMap),
      total: records.length,
    }, "Attendance fetched");
  } catch (e: any) {
    console.error("Admin attendance error:", e);
    return errorResponse(e.message || "Failed to fetch attendance", 500);
  }
}
