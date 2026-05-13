import { NextRequest } from "next/server";
import { findUserByEmail } from "../../../../../backend/repositories/user.repo";
import { requestOTP } from "../../../../../backend/services/otp.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const { email } = result.data;

    // Check if the email is registered
    const user = await findUserByEmail(email);
    if (!user) {
      return errorResponse("No account found with this email address.", 404);
    }

    // Send OTP for password reset
    await requestOTP(email);

    return successResponse({ email }, "Password reset OTP sent successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
