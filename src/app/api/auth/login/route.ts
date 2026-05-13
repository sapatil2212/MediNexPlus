import { NextRequest } from "next/server";
import { loginUserService } from "../../../../../backend/services/auth.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const { token, user } = await loginUserService(result.data.email, result.data.password);

    const response = successResponse({ user }, "Login Successful");

    // Extract env variable conditionally to handle type warnings
    const secureFlag = process.env.NODE_ENV === "production";
    
    // Set HTTP-only Cookie
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
  } catch (error: any) {
    const msg = String(error?.message || "");
    const code = String(error?.code || "");
    const isDbDown =
      code === "P1001" ||
      msg.includes("Can't reach database server") ||
      msg.includes("Can't reach database") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("ETIMEDOUT");
    if (isDbDown) {
      return errorResponse("Unable to connect. Please check your internet connection and try again.", 503);
    }
    const isAuthError =
      msg.toLowerCase().includes("invalid credentials") ||
      msg.toLowerCase().includes("inactive user");
    return errorResponse(msg || "Login failed", isAuthError ? 401 : 500);
  }
}
