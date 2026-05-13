import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile, SubDeptServiceError } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

// GET /api/subdept/procedures — list this sub-dept's procedures
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const subDeptId = (profile as any).id;

    const procedures = await (prisma as any).procedure.findMany({
      where: { subDepartmentId: subDeptId },
      orderBy: [{ sequence: "asc" }, { name: "asc" }],
    });

    return successResponse(procedures, "Procedures fetched");
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed", 500);
  }
}

// POST /api/subdept/procedures — create a new procedure
export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const subDeptId = (profile as any).id;
    const hospitalId = (profile as any).hospitalId;

    const body = await req.json();
    const { name, description, type, fee, duration, sequence, isActive } = body;

    if (!name) return errorResponse("name is required", 400);

    const procedure = await (prisma as any).procedure.create({
      data: {
        hospitalId,
        subDepartmentId: subDeptId,
        name: name.trim(),
        description: description || null,
        type: type || "OTHER",
        fee: fee != null ? parseFloat(fee) : null,
        duration: duration != null ? parseInt(duration) : null,
        sequence: sequence != null ? parseInt(sequence) : 0,
        isActive: isActive !== false,
      },
    });

    return successResponse(procedure, "Procedure created", 201);
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed", 500);
  }
}
