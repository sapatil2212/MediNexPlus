import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { getAvailableSlots, AppointmentServiceError } from "../../../../../../backend/services/appointment.service";
import prisma from "../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

async function resolveHid(hid: string | null, slug: string | null): Promise<string | null> {
  if (hid) return hid;
  if (slug) {
    const s = await prisma.hospitalSettings.findUnique({ where: { bookingSlug: slug }, select: { hospitalId: true } });
    return s?.hospitalId || null;
  }
  return null;
}

/* ── GET /api/public/booking/slots?hid=HOSPITAL_ID&doctorId=...&date=YYYY-MM-DD ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let hid = await resolveHid(searchParams.get("hid"), searchParams.get("slug"));
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!doctorId || !date) {
    return errorResponse("doctorId and date are required", 400);
  }

  try {
    if (!hid) return errorResponse("Hospital not found", 404);

    const result = await getAvailableSlots(hid, doctorId, date);
    return successResponse(result, "Available slots fetched");
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
