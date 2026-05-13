import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  completePrescription,
  PrescriptionServiceError,
} from "../../../../../../backend/services/prescription.service";
import { updatePrescriptionSchema } from "../../../../../../backend/validations/prescription.validation";

export const dynamic = "force-dynamic";

// POST /api/prescriptions/[id]/complete — finalize prescription & create workflow
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["DOCTOR", "HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = updatePrescriptionSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const rx = await completePrescription(params.id, auth.hospitalId, result.data);
    return successResponse(rx, "Prescription completed");
  } catch (e: any) {
    if (e instanceof PrescriptionServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
