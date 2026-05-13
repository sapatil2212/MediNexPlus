import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import prisma from "../../../../../../backend/config/db";
import { verifyToken } from "../../../../../../backend/utils/jwt";

export const dynamic = "force-dynamic";

async function resolveHospitalId(hid: string | null, slug: string | null, req: NextRequest): Promise<string | null> {
  if (hid) return hid;
  if (slug) {
    const s = await prisma.hospitalSettings.findUnique({ where: { bookingSlug: slug }, select: { hospitalId: true } });
    if (s?.hospitalId) return s.hospitalId;
  }
  const token = req.cookies.get("hms_session")?.value;
  if (token) {
    try {
      const payload = verifyToken(token);
      if (payload?.hospitalId) return payload.hospitalId;
    } catch {}
  }
  return null;
}

/* GET /api/public/booking/check-patient?phone=X&email=Y&hid=Z */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone")?.trim() || "";
  const email = searchParams.get("email")?.trim() || "";

  if (!phone && !email) return successResponse(null, "No patient found");

  try {
    const hid = await resolveHospitalId(searchParams.get("hid"), searchParams.get("slug"), req);
    if (!hid) return errorResponse("No hospital found", 404);

    // Check phone first (most reliable identifier)
    if (phone) {
      const byPhone = await prisma.patient.findFirst({
        where: { hospitalId: hid, phone },
        select: { id: true, name: true, phone: true, email: true, patientId: true },
        orderBy: { createdAt: "asc" },
      });
      if (byPhone) return successResponse({ ...byPhone, matchedBy: "phone" }, "Patient found");
    }

    // Fall back to email check
    if (email) {
      const byEmail = await prisma.patient.findFirst({
        where: { hospitalId: hid, email },
        select: { id: true, name: true, phone: true, email: true, patientId: true },
        orderBy: { createdAt: "asc" },
      });
      if (byEmail) return successResponse({ ...byEmail, matchedBy: "email" }, "Patient found");
    }

    return successResponse(null, "No patient found");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
