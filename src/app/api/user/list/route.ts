import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { roleMiddleware } from "../../../../../backend/middlewares/role.middleware";
import { Role } from "@prisma/client";
import { listUsersService } from "../../../../../backend/services/user.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await authMiddleware(req);
    if (authError) return authError;

    // Must be Hospital Admin to list users
    const roleCheck = roleMiddleware(user!, [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN]);
    if (roleCheck.error) return roleCheck.error;

    if (!user!.hospitalId && user!.role !== Role.SUPER_ADMIN) {
      return errorResponse("No hospital linked", 400);
    }

    const hospitalId = user!.hospitalId as string;
    
    // Only fetch users under the SAME hospital
    const users = await listUsersService(hospitalId);

    // Filter out passwords
    const usersDisplay = users.map(({ password, ...rest }) => rest);

    return successResponse(usersDisplay, "Users fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
