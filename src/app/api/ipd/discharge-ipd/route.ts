import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { dischargeBed, AllocationServiceError } from "../../../../../backend/services/allocation.service";
import { z } from "zod";

const schema = z.object({
  allocationId: z.string().min(1),
  actualDischargeDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const { allocationId, ...rest } = result.data;
    const data = await dischargeBed(auth.hospitalId, allocationId, rest);
    return successResponse(data, "Patient discharged successfully");
  } catch (e: any) {
    if (e instanceof AllocationServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message || "Server error", 500);
  }
}
