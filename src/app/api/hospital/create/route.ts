import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { roleMiddleware } from "../../../../../backend/middlewares/role.middleware";
import { Role } from "@prisma/client";
import { createHospital } from "../../../../../backend/repositories/hospital.repo";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const createHospitalSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await authMiddleware(req);
    if (authError) return authError;

    // Only Super Admin can directly create a hospital without signing up via OTP
    const roleCheck = roleMiddleware(user!, [Role.SUPER_ADMIN]);
    if (roleCheck.error) return roleCheck.error;

    const body = await req.json();
    const result = createHospitalSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const hospital = await createHospital({
      ...result.data,
      isVerified: true,
    });

    return successResponse(hospital, "Hospital created successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
