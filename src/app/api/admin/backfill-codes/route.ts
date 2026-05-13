import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user?.role !== "HOSPITAL_ADMIN") return errorResponse("Unauthorized", 403);

  try {
    const hospitalId = user.hospitalId;

    // Backfill doctorCode for doctors without one
    const doctors = await (prisma as any).doctor.findMany({
      where: { hospitalId, doctorCode: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    for (let i = 0; i < doctors.length; i++) {
      const existingCount = await (prisma as any).doctor.count({
        where: { hospitalId, doctorCode: { not: null } },
      });
      const code = `DOC-${String(existingCount + 1).padStart(4, "0")}`;
      await (prisma as any).doctor.update({
        where: { id: doctors[i].id },
        data: { doctorCode: code },
      });
    }

    // Backfill userCode for users without one
    const users = await (prisma as any).user.findMany({
      where: { hospitalId, userCode: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    for (let i = 0; i < users.length; i++) {
      const existingCount = await (prisma as any).user.count({
        where: { hospitalId, userCode: { not: null } },
      });
      const code = `USR-${String(existingCount + 1).padStart(4, "0")}`;
      await (prisma as any).user.update({
        where: { id: users[i].id },
        data: { userCode: code },
      });
    }

    return successResponse(
      { doctorsUpdated: doctors.length, usersUpdated: users.length },
      `Backfill complete: ${doctors.length} doctors, ${users.length} users updated`
    );
  } catch (err: any) {
    return errorResponse(err.message || "Backfill failed", 500);
  }
}
