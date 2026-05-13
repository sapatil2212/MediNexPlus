import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { comparePassword, hashPassword } from "../../../../../backend/utils/hash";
import prisma from "../../../../../backend/config/db";
import { z } from "zod";

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

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

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: user!.userId },
      select: { password: true },
    });

    if (!currentUser) {
      return errorResponse("User not found", 404);
    }

    // Verify old password
    const isValid = await comparePassword(oldPassword, currentUser.password);
    if (!isValid) {
      return errorResponse("Current password is incorrect", 401);
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user!.userId },
      data: { password: hashedPassword },
    });

    // Sync plaintext password to SubDepartment record so admin can see the updated password
    const subDept = await (prisma as any).subDepartment.findFirst({
      where: { userId: user!.userId },
      select: { id: true },
    });
    if (subDept) {
      await (prisma as any).subDepartment.update({
        where: { id: subDept.id },
        data: { loginPasswordPlain: newPassword },
      });
    }

    return successResponse(null, "Password changed successfully");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to change password", 500);
  }
}
