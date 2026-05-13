import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getIPDAdmission,
  updateIPDAdmissionService,
  dischargePatientIPD,
  IPDServiceError,
} from "../../../../../../backend/services/ipd.service";
import { z } from "zod";

const updateSchema = z.object({
  admissionType: z.enum(["EMERGENCY", "PLANNED", "TRANSFER"]).optional(),
  assignedDoctorId: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceId: z.string().optional(),
  corporateName: z.string().optional(),
  admissionNotes: z.string().optional(),
  status: z.enum(["ADMITTED", "DISCHARGED", "TRANSFERRED"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const data = await getIPDAdmission(params.id, auth.hospitalId);
    return successResponse(data, "IPD admission fetched");
  } catch (e: any) {
    if (e instanceof IPDServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message || "Server error", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await updateIPDAdmissionService(params.id, auth.hospitalId, result.data);
    return successResponse(data, "IPD admission updated");
  } catch (e: any) {
    if (e instanceof IPDServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message || "Server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json().catch(() => ({}));
    const data = await dischargePatientIPD(auth.hospitalId, params.id, body);
    return successResponse(data, "Patient discharged successfully");
  } catch (e: any) {
    if (e instanceof IPDServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message || "Server error", 500);
  }
}
