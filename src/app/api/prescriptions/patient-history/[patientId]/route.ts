import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { getPatientHistory } from "../../../../../../backend/services/prescription.service";

export const dynamic = "force-dynamic";

// GET /api/prescriptions/patient-history/[patientId]
export async function GET(req: NextRequest, { params }: { params: { patientId: string } }) {
  const auth = await requireRole(req, ["DOCTOR", "HOSPITAL_ADMIN", "STAFF", "RECEPTIONIST"]);
  if (auth.error) return auth.error;
  try {
    const excludeId = req.nextUrl.searchParams.get("excludeId") || undefined;
    const history = await getPatientHistory(params.patientId, auth.hospitalId, excludeId);
    return successResponse(history, "Patient history fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
