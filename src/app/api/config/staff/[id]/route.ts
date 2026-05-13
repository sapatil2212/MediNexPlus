import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getStaffById,
  updateStaff,
  deleteStaff,
  toggleStatus,
  StaffServiceError,
} from "../../../../../../backend/services/staff.service";
import { updateStaffSchema } from "../../../../../../backend/validations/staff.validation";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const staff = await getStaffById(params.id, auth.hospitalId);
    return successResponse(staff, "Staff member fetched");
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error.message || "Failed to fetch staff member", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const validated = updateStaffSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("Validation failed", 400, validated.error.issues);
    }

    const staff = await updateStaff(params.id, auth.hospitalId, validated.data);
    return successResponse(staff, "Staff member updated successfully");
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error.message || "Failed to update staff member", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    await deleteStaff(params.id, auth.hospitalId);
    return successResponse(null, "Staff member deleted successfully");
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error.message || "Failed to delete staff member", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return errorResponse("isActive must be a boolean", 400);
    }

    const result = await toggleStatus(params.id, auth.hospitalId, isActive);
    return successResponse(result, "Staff status updated");
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error.message || "Failed to update staff status", 500);
  }
}
