import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
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

/* ── GET /api/public/booking/doctors?hid=HOSPITAL_ID&departmentId=DEPT_ID ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let hid = await resolveHid(searchParams.get("hid"), searchParams.get("slug"));

  try {
    if (!hid) return errorResponse("Hospital not found", 404);

    const where: any = { hospitalId: hid };
    const deptId = searchParams.get("departmentId");
    if (deptId) where.departmentId = deptId;

    const doctors = await prisma.doctor.findMany({
      where,
      select: {
        id: true,
        name: true,
        specialization: true,
        departmentId: true,
        consultationFee: true,
        department: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(doctors, "Doctors fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
