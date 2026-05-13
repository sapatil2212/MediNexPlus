import { NextRequest } from "next/server";
import { requestOTP } from "../../../../../backend/services/otp.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const requestOTPSchema = z.object({
  email: z.string().email("Invalid email format"),
  mobile: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = requestOTPSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const res = await requestOTP(result.data.email, result.data.mobile);
    return successResponse(res, "OTP Request sent");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
