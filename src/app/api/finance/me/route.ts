import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

// GET /api/finance/me — profile for FINANCE_HEAD
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  const role = (user as any)?.role;
  if (role !== "FINANCE_HEAD" && role !== "HOSPITAL_ADMIN") return errorResponse("Forbidden", 403);

  try {
    const where = role === "FINANCE_HEAD"
      ? { userId: (user as any).userId }
      : { hospitalId: (user as any).hospitalId };
    const finDept = await (prisma as any).financeDepartment.findFirst({ where });
    if (!finDept) return errorResponse("Finance department not found", 404);
    return successResponse(finDept, "Profile fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
