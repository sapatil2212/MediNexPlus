import { NextRequest } from "next/server";
import { findUserByEmail, updateUser } from "../../../../../backend/repositories/user.repo";
import { verifyOTP } from "../../../../../backend/services/otp.service";
import { hashPassword } from "../../../../../backend/utils/hash";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const { email, otp, newPassword } = result.data;

    // Check if the email is registered
    const user = await findUserByEmail(email);
    if (!user) {
      return errorResponse("No account found with this email address.", 404);
    }

    // Verify the OTP
    await verifyOTP(email, otp);

    // Hash the new password and update the user
    const hashedPassword = await hashPassword(newPassword);
    await updateUser(user.id, { password: hashedPassword });

    return successResponse({}, "Password reset successfully. You can now log in with your new password.");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
