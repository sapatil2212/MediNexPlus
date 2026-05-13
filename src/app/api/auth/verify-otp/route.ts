import { NextRequest } from "next/server";
import { signupHospitalService } from "../../../../../backend/services/auth.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const verifySignupSchema = z.object({
  hospitalName: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(6),
  adminName: z.string().min(2),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifySignupSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const { hospital, user } = await signupHospitalService(result.data);
    return successResponse({ hospital, user }, "Hospital and Admin Registered Successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
