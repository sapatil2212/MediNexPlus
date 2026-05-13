import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getDeptProfile, DepartmentServiceError } from "../../../../../backend/services/department.service";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const dept = await getDeptProfile(auth.user.userId);
    return successResponse(dept, "Department profile fetched");
  } catch (error: any) {
    if (error instanceof DepartmentServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to fetch profile", 500);
  }
}
