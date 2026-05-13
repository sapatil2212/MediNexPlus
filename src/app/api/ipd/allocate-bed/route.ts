import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { allocateBed, AllocationServiceError } from "../../../../../backend/services/allocation.service";
import { z } from "zod";

const schema = z.object({
  bedId: z.string().min(1),
  patientId: z.string().optional(),
  departmentId: z.string().optional(),
  entryType: z.enum(["PATIENT", "MANUAL"]).optional(),
  patientName: z.string().min(2),
  patientAge: z.number().int().min(0).max(150).optional(),
  patientGender: z.enum(["Male","Female","Other"]).optional(),
  patientPhone: z.string().optional(),
  attendantName: z.string().optional(),
  attendantPhone: z.string().optional(),
  diagnosis: z.string().optional(),
  admittingDoctorName: z.string().optional(),
  admissionDate: z.string().optional(),
  expectedDischargeDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await allocateBed(auth.hospitalId, result.data);
    return successResponse(data, "Bed allocated successfully", 201);
  } catch (e: any) {
    if (e instanceof AllocationServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message || "Server error", 500);
  }
}
