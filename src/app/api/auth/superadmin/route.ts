import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { generateToken } from "../../../../../backend/utils/jwt";
import { Role } from "@prisma/client";
import { env } from "../../../../../backend/config/env";
import { z } from "zod";

const superAdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  securityKey: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = superAdminLoginSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const { email, password, securityKey } = result.data;

    if (
      email === env.SUPER_ADMIN_EMAIL &&
      password === env.SUPER_ADMIN_PASSWORD &&
      securityKey === env.SUPER_ADMIN_SECURITY_KEY
    ) {
      const token = generateToken({
        userId: "super-admin-001",
        role: Role.SUPER_ADMIN,
      });

      const response = successResponse(
        { user: { id: "super-admin-001", name: "Super Admin", role: Role.SUPER_ADMIN, email } }, 
        "Super Admin Login Successful"
      );

      const secureFlag = process.env.NODE_ENV === "production";
      
      response.cookies.set({
        name: "hms_session",
        value: token,
        httpOnly: true,
        secure: secureFlag,
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    return errorResponse("Invalid Super Admin Credentials", 401);
  } catch (error: any) {
    return errorResponse(error.message, 401);
  }
}
