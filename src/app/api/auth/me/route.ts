import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { findUserById } from "../../../../../backend/repositories/user.repo";
import { env } from "../../../../../backend/config/env";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  // Super Admin is not a database user — return data from JWT + env
  if (user!.role === "SUPER_ADMIN") {
    return successResponse({
      id: user!.userId,
      name: "Super Admin",
      email: env.SUPER_ADMIN_EMAIL,
      role: "SUPER_ADMIN",
      hospitalId: null,
      hospital: null,
    }, "Current user");
  }

  // Regular DB users
  const dbUser = await findUserById(user!.userId);
  if (!dbUser) {
    return errorResponse("User not found", 404);
  }

  return successResponse({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    hospitalId: dbUser.hospitalId,
    hospital: dbUser.hospital,
    profilePhoto: dbUser.profilePhoto ?? null,
  }, "Current user");
}
