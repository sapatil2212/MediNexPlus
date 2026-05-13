import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getSubDepartmentById,
  updateSubDepartment,
  deleteSubDepartment,
  toggleSubDepartmentStatus,
  SubDeptServiceError,
} from "../../../../../../backend/services/subdepartment.service";
import { updateSubDepartmentSchema } from "../../../../../../backend/validations/subdepartment.validation";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const data = await getSubDepartmentById(params.id, auth.hospitalId);
    return successResponse(data, "Sub-department fetched");
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to fetch sub-department", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const validated = updateSubDepartmentSchema.safeParse(body);
    if (!validated.success) return errorResponse("Validation failed", 400, validated.error.issues);
    const data = await updateSubDepartment(params.id, auth.hospitalId, validated.data);
    return successResponse(data, "Sub-department updated successfully");
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to update sub-department", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (typeof body.isActive === "boolean") {
      const data = await toggleSubDepartmentStatus(params.id, auth.hospitalId, body.isActive);
      return successResponse(data, "Status updated");
    }
    return errorResponse("Invalid patch operation", 400);
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to update", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    await deleteSubDepartment(params.id, auth.hospitalId);
    return successResponse(null, "Sub-department deleted successfully");
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to delete sub-department", 500);
  }
}
