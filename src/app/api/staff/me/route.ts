import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getStaffByUserId, StaffServiceError } from "../../../../../backend/services/staff.service";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  try {
    const staff = await getStaffByUserId(user!.userId);
    const { ...safeStaff } = staff as any;
    delete safeStaff.password;
    return successResponse(safeStaff, "Staff profile fetched");
  } catch (err: any) {
    if (err instanceof StaffServiceError) {
      return errorResponse(err.message, err.status);
    }
    return errorResponse(err.message || "Failed to fetch profile", 500);
  }
}
