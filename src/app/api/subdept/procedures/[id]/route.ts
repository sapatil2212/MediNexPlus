import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { getSubDeptProfile, SubDeptServiceError } from "../../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

// PUT /api/subdept/procedures/[id] — update
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const subDeptId = (profile as any).id;

    const existing = await (prisma as any).procedure.findFirst({
      where: { id: params.id, subDepartmentId: subDeptId },
    });
    if (!existing) return errorResponse("Procedure not found", 404);

    const body = await req.json();
    const { name, description, type, fee, duration, sequence, isActive } = body;

    const updated = await (prisma as any).procedure.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(fee !== undefined && { fee: fee != null ? parseFloat(fee) : null }),
        ...(duration !== undefined && { duration: duration != null ? parseInt(duration) : null }),
        ...(sequence !== undefined && { sequence: parseInt(sequence) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return successResponse(updated, "Procedure updated");
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed", 500);
  }
}

// DELETE /api/subdept/procedures/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const subDeptId = (profile as any).id;

    const existing = await (prisma as any).procedure.findFirst({
      where: { id: params.id, subDepartmentId: subDeptId },
    });
    if (!existing) return errorResponse("Procedure not found", 404);

    await (prisma as any).procedure.delete({ where: { id: params.id } });
    return successResponse(null, "Procedure deleted");
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed", 500);
  }
}
