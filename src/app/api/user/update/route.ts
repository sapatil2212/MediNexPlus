import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { roleMiddleware } from "../../../../../backend/middlewares/role.middleware";
import { Role } from "@prisma/client";
import { updateUserService } from "../../../../../backend/services/user.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum([Role.DOCTOR, Role.RECEPTIONIST, Role.STAFF, Role.HOSPITAL_ADMIN]).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const { user, error: authError } = await authMiddleware(req);
    if (authError) return authError;

    const roleCheck = roleMiddleware(user!, [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN]);
    if (roleCheck.error) return roleCheck.error;

    const body = await req.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const hospitalId = user!.hospitalId as string;
    const { id, ...updateData } = result.data;

    // Only update user in the SAME hospital scope
    const updatedUser = await updateUserService(id, updateData, hospitalId);

    // Filter out password
    const { password, ...userDisplay } = updatedUser;

    return successResponse(userDisplay, "User updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
