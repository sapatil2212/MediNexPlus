import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getAvailableSlots, AppointmentServiceError } from "../../../../../backend/services/appointment.service";

const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR", "SUB_DEPT_HEAD"];

export const dynamic = "force-dynamic";

// GET /api/appointments/slots?doctorId=...&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return errorResponse("doctorId and date are required", 400);
    }

    const result = await getAvailableSlots(auth.hospitalId, doctorId, date);
    return successResponse(result, "Available slots fetched");
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
