import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { changeStaffPassword, StaffServiceError } from "../../../../../../backend/services/staff.service";
import { changePasswordSchema } from "../../../../../../backend/validations/staff.validation";

export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  try {
    const body = await req.json();
    const validated = changePasswordSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("Validation failed", 400, validated.error.issues);
    }

    const { oldPassword, newPassword } = validated.data;
    await changeStaffPassword(user!.userId, oldPassword, newPassword);

    return successResponse(null, "Password changed successfully");
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error.message || "Failed to change password", 500);
  }
}
