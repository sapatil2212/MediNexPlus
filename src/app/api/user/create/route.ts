import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { roleMiddleware } from "../../../../../backend/middlewares/role.middleware";
import { Role } from "@prisma/client";
import { createUserService } from "../../../../../backend/services/user.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([Role.DOCTOR, Role.RECEPTIONIST, Role.STAFF, Role.HOSPITAL_ADMIN]),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await authMiddleware(req);
    if (authError) return authError;

    // Must be Hospital Admin to create a user for that hospital
    const roleCheck = roleMiddleware(user!, [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN]);
    if (roleCheck.error) return roleCheck.error;

    if (!user!.hospitalId && user!.role !== Role.SUPER_ADMIN) {
      return errorResponse("No hospital linked", 400);
    }

    const body = await req.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const hospitalId = user!.hospitalId as string;
    
    // Create the user under the SAME hospital as the Admin
    const newUser = await createUserService(result.data, hospitalId);

    // Filter out password
    const { password, ...userDisplay } = newUser;

    return successResponse(userDisplay, "User created successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
