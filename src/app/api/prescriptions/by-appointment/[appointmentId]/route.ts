import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { getPrescriptionByAppointment } from "../../../../../../backend/services/prescription.service";

export const dynamic = "force-dynamic";

// GET /api/prescriptions/by-appointment/[appointmentId]
export async function GET(req: NextRequest, { params }: { params: { appointmentId: string } }) {
  const auth = await requireRole(req, ["DOCTOR", "HOSPITAL_ADMIN", "STAFF", "RECEPTIONIST", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;
  try {
    const rx = await getPrescriptionByAppointment(params.appointmentId, auth.hospitalId);
    if (!rx) return successResponse(null, "No prescription found for this appointment");
    return successResponse(rx, "Prescription fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
