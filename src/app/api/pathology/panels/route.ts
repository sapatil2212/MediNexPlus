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

    const where: any = { hospitalId };
    if (subDeptId) where.subDepartmentId = subDeptId;

    const panels = await (prisma as any).labPanel.findMany({
      where,
      include: {
        items: {
          include: { test: { select: { id: true, name: true, code: true, specimenType: true, unit: true } } },
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(panels);
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

    const body = await req.json();

    if (user!.role === "SUB_DEPT_HEAD") {
      const profile = await getSubDeptProfile(user!.userId);
      hospitalId = (profile as any).hospitalId;
      subDeptId = (profile as any).id;
    } else {
      const u = await (prisma as any).user.findUnique({ where: { id: user!.userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
      subDeptId = body.subDepartmentId;
    }

    const { name, code, description, price, testIds } = body;
    if (!name || !code) return errorResponse("Name and code required", 400);

    const existing = await (prisma as any).labPanel.findUnique({ where: { hospitalId_code: { hospitalId, code } } });
    if (existing) return errorResponse("Panel code already exists", 409);

    const panel = await (prisma as any).labPanel.create({
      data: {
        hospitalId, subDepartmentId: subDeptId,
        name, code, description, price: parseFloat(price) || 0,
        items: testIds?.length ? {
          create: (testIds as string[]).map((testId: string, i: number) => ({ testId, sequence: i })),
        } : undefined,
      },
      include: {
        items: { include: { test: { select: { id: true, name: true, code: true } } } },
      },
    });

    return successResponse(panel);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}
