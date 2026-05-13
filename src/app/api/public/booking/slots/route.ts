import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { getAvailableSlots, AppointmentServiceError } from "../../../../../../backend/services/appointment.service";

export const dynamic = "force-dynamic";

/* ── GET /api/public/booking/slots?hid=HOSPITAL_ID&doctorId=...&date=YYYY-MM-DD ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let hid = searchParams.get("hid");
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!doctorId || !date) {
    return errorResponse("doctorId and date are required", 400);
  }

  try {
    // Hardcoded for MediNex+ portal (TODO: make configurable for multi-hospital)
    if (!hid) hid = "fd92c618-f6dc-42da-96ae-762a09d19f25";

    const result = await getAvailableSlots(hid, doctorId, date);
    return successResponse(result, "Available slots fetched");
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
