import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    let hospitalId: string;
    let subDeptId: string | undefined;

    if (user!.role === "SUB_DEPT_HEAD") {
      const profile = await getSubDeptProfile(user!.userId);
      hospitalId = (profile as any).hospitalId;
      subDeptId = (profile as any).id;
    } else {
      const u = await (prisma as any).user.findUnique({ where: { id: user!.userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
      subDeptId = req.nextUrl.searchParams.get("subDepartmentId") || undefined;
    }

    const category = req.nextUrl.searchParams.get("category") || undefined;
    const search = req.nextUrl.searchParams.get("search") || undefined;
    const activeOnly = req.nextUrl.searchParams.get("active") === "true";

    const where: any = { hospitalId };
    if (subDeptId) where.subDepartmentId = subDeptId;
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;
    if (search) where.name = { contains: search };

    const tests = await (prisma as any).labTest.findMany({
      where,
      include: { panelItems: { include: { panel: { select: { id: true, name: true } } } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return successResponse(tests);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    let hospitalId: string;
    let subDeptId: string;

    if (user!.role === "SUB_DEPT_HEAD") {
      const profile = await getSubDeptProfile(user!.userId);
      hospitalId = (profile as any).hospitalId;
      subDeptId = (profile as any).id;
    } else {
      const body = await req.json();
      const u = await (prisma as any).user.findUnique({ where: { id: user!.userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
      subDeptId = body.subDepartmentId;
    }

    const body = await req.json().catch(() => ({}));
    const { name, code, category, specimenType, price, unit, normalRangeMin, normalRangeMax, normalRangeText, method, turnaroundHrs, machineId } = body;

    if (!name || !code) return errorResponse("Name and code are required", 400);

    const existing = await (prisma as any).labTest.findUnique({ where: { hospitalId_code: { hospitalId, code } } });
    if (existing) return errorResponse("Test code already exists", 409);

    const test = await (prisma as any).labTest.create({
      data: {
        hospitalId, subDepartmentId: subDeptId,
        name, code, category: category || "OTHER", specimenType: specimenType || "BLOOD",
        price: parseFloat(price) || 0, unit, normalRangeMin: normalRangeMin ? parseFloat(normalRangeMin) : null,
        normalRangeMax: normalRangeMax ? parseFloat(normalRangeMax) : null, normalRangeText, method,
        turnaroundHrs: parseInt(turnaroundHrs) || 24, machineId,
      },
    });
    return successResponse(test);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}
