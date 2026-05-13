import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { updateUser } from "../../../../../backend/repositories/user.repo";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  profilePhoto: z.string().nullish(),
});

export async function PUT(req: NextRequest) {
  try {
    const { user, error: authError } = await authMiddleware(req);
    if (authError) return authError;

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const { profilePhoto, ...userFields } = result.data;

    // Build user update data (only fields that exist on User model)
    const userUpdateData: { name?: string; email?: string; profilePhoto?: string | null } = {};
    if (userFields.name !== undefined) userUpdateData.name = userFields.name;
    if (userFields.email !== undefined) userUpdateData.email = userFields.email;
    if (profilePhoto !== undefined) userUpdateData.profilePhoto = profilePhoto ?? null;

    // Update user record
    const updatedUser = await updateUser(user!.userId, userUpdateData);

    // Handle profile photo for different roles
    if (profilePhoto && user!.role === "DOCTOR") {
      await prisma.doctor.updateMany({
        where: { userId: user!.userId },
        data: { profileImage: profilePhoto },
      });
    }

    // Filter out password
    const { password, ...userDisplay } = updatedUser;

    return successResponse(userDisplay, "Profile updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
