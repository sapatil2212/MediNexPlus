import { NextRequest } from "next/server";
import { requireRole } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import * as service from "../../../../backend/services/central-inventory.service";
import { getSubDeptProfile } from "../../../../backend/services/subdepartment.service";

// GET /api/dept-inventory — Returns stock for the logged-in user's department
// For SUB_DEPT_HEAD: auto-detects subDepartmentId from profile
// For HOSPITAL_ADMIN: requires ?subDepartmentId= query param
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD", "DEPT_HEAD", "STAFF"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    let subDepartmentId = searchParams.get("subDepartmentId");

    // Auto-detect for SUB_DEPT_HEAD
    if (!subDepartmentId && (auth.user.role === "SUB_DEPT_HEAD" || auth.user.role === "DEPT_HEAD")) {
      try {
        const profile = await getSubDeptProfile(auth.user.userId);
        subDepartmentId = (profile as any)?.id;
      } catch {
        return errorResponse("Could not resolve department profile", 404);
      }
    }

    if (!subDepartmentId) {
      return errorResponse("subDepartmentId is required", 400);
    }

    const data = await service.getLocationStockForDept(auth.hospitalId, subDepartmentId);
    return successResponse(data, "Department stock fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
