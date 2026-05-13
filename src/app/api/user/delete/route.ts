import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { roleMiddleware } from "../../../../../backend/middlewares/role.middleware";
import { Role } from "@prisma/client";
import { deleteUserService } from "../../../../../backend/services/user.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const deleteUserSchema = z.object({
  id: z.string().uuid(),
});

export async function DELETE(req: NextRequest) {
  try {
    const { user, error: authError } = await authMiddleware(req);
    if (authError) return authError;

    const roleCheck = roleMiddleware(user!, [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN]);
    if (roleCheck.error) return roleCheck.error;

    const body = await req.json();
    const result = deleteUserSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const hospitalId = user!.hospitalId as string;
    
    // Only delete user in the SAME hospital scope
    await deleteUserService(result.data.id, hospitalId);

    return successResponse(null, "User deleted successfully");
  } catch (error: any) {
    if (error.code === 'P2025') {
        return errorResponse("User not found or you don't have access to delete them", 404);
    }
    return errorResponse(error.message, 500);
  }
}
