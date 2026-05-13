import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";
import { findDepartmentByUserId } from "../../../../../backend/repositories/department.repo";

/**
 * GET /api/parentdept/subdepartments
 * List all sub-departments under the logged-in dept head's department
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const dept = await findDepartmentByUserId(auth.user.userId);
    if (!dept) return errorResponse("Department not found", 404);

    const subDepts = await (prisma as any).subDepartment.findMany({
      where: { departmentId: dept.id, hospitalId: auth.hospitalId },
      include: {
        _count: { select: { procedures: true, appointments: true, procedureRecords: true } },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(subDepts, "Sub-departments fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch sub-departments", 500);
  }
}

/**
 * PUT /api/parentdept/subdepartments
 * Update a sub-department under the parent dept
 * Body: { id, ...updateData }
 */
export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ["DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const dept = await findDepartmentByUserId(auth.user.userId);
    if (!dept) return errorResponse("Department not found", 404);

    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return errorResponse("Sub-department ID is required", 400);

    // Verify the sub-dept belongs to this parent dept
    const subDept = await (prisma as any).subDepartment.findFirst({
      where: { id, departmentId: dept.id, hospitalId: auth.hospitalId },
    });
    if (!subDept) return errorResponse("Sub-department not found under this department", 404);

    await (prisma as any).subDepartment.update({
      where: { id },
      data: updateData,
    });

    return successResponse(null, "Sub-department updated");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update sub-department", 500);
  }
}

/**
 * DELETE /api/parentdept/subdepartments?id=xxx
 * Delete a sub-department under the parent dept
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ["DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const dept = await findDepartmentByUserId(auth.user.userId);
    if (!dept) return errorResponse("Department not found", 404);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("Sub-department ID is required", 400);

    // Verify the sub-dept belongs to this parent dept
    const subDept = await (prisma as any).subDepartment.findFirst({
      where: { id, departmentId: dept.id, hospitalId: auth.hospitalId },
    });
    if (!subDept) return errorResponse("Sub-department not found under this department", 404);

    await (prisma as any).subDepartment.delete({ where: { id } });
    return successResponse(null, "Sub-department deleted");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete sub-department", 500);
  }
}
