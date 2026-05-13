import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";

// GET /api/doctor/attendance - Get attendance history
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  if (user!.role !== "DOCTOR") return errorResponse("Forbidden: Doctor access required", 403);

  try {
    const prisma = (await import("../../../../../backend/config/db")).default;

    const doctor = await (prisma as any).doctor.findFirst({
      where: { userId: user!.userId },
    });
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    const whereClause: any = { doctorId: doctor.id };
    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      whereClause.date = {
        gte: new Date(Date.UTC(year, monthNum - 1, 1)),
        lte: new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999)),
      };
    }

    if (!(prisma as any).doctorAttendance) {
      return successResponse([], "Attendance tracking not yet available - run npx prisma generate");
    }

    const attendance = await (prisma as any).doctorAttendance.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: 31,
    });

    return successResponse(attendance, "Attendance history fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch attendance", 500);
  }
}

// POST /api/doctor/attendance - Mark attendance (auto-called on login)
export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  if (user!.role !== "DOCTOR") return errorResponse("Forbidden: Doctor access required", 403);

  try {
    const body = await req.json().catch(() => ({}));
    const { location, ip } = body;

    const prisma = (await import("../../../../../backend/config/db")).default;

    const doctor = await (prisma as any).doctor.findFirst({
      where: { userId: user!.userId },
    });
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    if (!(prisma as any).doctorAttendance) {
      return successResponse({ status: "SKIPPED" }, "Attendance tracking not yet available");
    }

    const now = new Date();
    // Use UTC midnight of the LOCAL calendar date so MySQL DATE stores the correct day
    // regardless of server timezone (fixes IST off-by-one-day bug)
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const loginHour = now.getHours();
    const loginMinute = now.getMinutes();

    let status: "PRESENT" | "LATE" | "HALF_DAY" = "PRESENT";
    if (loginHour > 9 || (loginHour === 9 && loginMinute > 30)) status = "LATE";
    if (loginHour >= 12) status = "HALF_DAY";

    // Prepare data - only include new fields if they exist in the schema
    // We check this by seeing if the keys exist in the prisma model definition or by try-catch
    const updateData: any = {
      loginTime: now,
      status,
    };
    const createData: any = {
      doctorId: doctor.id,
      hospitalId: doctor.hospitalId,
      date: today,
      loginTime: now,
      status,
    };

    const attendanceModel = (prisma as any).doctorAttendance;
    if (attendanceModel) {
      // Race-condition safe: findUnique → update or create (with P2002 catch)
      const existing = await attendanceModel.findUnique({
        where: { doctorId_date: { doctorId: doctor.id, date: today } },
      });

      let attendance: any;
      if (existing) {
        // Already checked in today — return the existing record without overwriting
        return successResponse(existing, "Already checked in for today");
      } else {
        try {
          attendance = await attendanceModel.create({
            data: {
              ...createData,
              loginLocation: location || null,
              loginIp: ip || null,
            },
          });
        } catch (createErr: any) {
          if (createErr.code === "P2002") {
            // Race condition: another concurrent request already created the record
            attendance = await attendanceModel.findUnique({
              where: { doctorId_date: { doctorId: doctor.id, date: today } },
            });
          } else {
            throw createErr;
          }
        }
      }

      return successResponse(attendance, "Attendance marked successfully");
    }
  } catch (e: any) {
    console.error("Attendance marking error:", e);
    return errorResponse(e.message || "Failed to mark attendance", 500);
  }
}

// PATCH /api/doctor/attendance - Mark check-out time
export async function PATCH(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  if (user!.role !== "DOCTOR") return errorResponse("Forbidden: Doctor access required", 403);

  try {
    const body = await req.json().catch(() => ({}));
    const { location, ip } = body;

    const prisma = (await import("../../../../../backend/config/db")).default;

    const doctor = await (prisma as any).doctor.findFirst({
      where: { userId: user!.userId },
    });
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    if (!(prisma as any).doctorAttendance) {
      return successResponse({ status: "SKIPPED" }, "Attendance tracking not yet available");
    }

    const now2 = new Date();
    const today = new Date(Date.UTC(now2.getFullYear(), now2.getMonth(), now2.getDate()));

    const attendance = await (prisma as any).doctorAttendance.findUnique({
      where: {
        doctorId_date: {
          doctorId: doctor.id,
          date: today,
        },
      },
    });

    if (!attendance) {
      return errorResponse("No check-in record found for today", 404);
    }

    if (attendance.logoutTime) {
      return errorResponse("Already checked out for today", 400);
    }

    const now = new Date();
    
    // Calculate work hours
    let totalWorkHours = 0;
    if (attendance.loginTime) {
      const diffMs = now.getTime() - new Date(attendance.loginTime).getTime();
      totalWorkHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
    }

    try {
      const updated = await (prisma as any).doctorAttendance.update({
        where: {
          doctorId_date: {
            doctorId: doctor.id,
            date: today,
          },
        },
        data: {
          logoutTime: now,
          logoutLocation: location || null,
          logoutIp: ip || null,
          totalWorkHours,
        },
      });
      return successResponse(updated, "Check-out recorded successfully");
    } catch (err: any) {
      if (err.message?.includes("Unknown argument") || err.name === "PrismaClientValidationError") {
        // Fallback to basic fields
        const updated = await (prisma as any).doctorAttendance.update({
          where: {
            doctorId_date: {
              doctorId: doctor.id,
              date: today,
            },
          },
          data: {
            logoutTime: now,
          },
        });
        return successResponse(updated, "Check-out recorded (basic mode - schema sync pending)");
      }
      throw err;
    }
  } catch (e: any) {
    console.error("Check-out error:", e);
    return errorResponse(e.message || "Failed to record check-out", 500);
  }
}
