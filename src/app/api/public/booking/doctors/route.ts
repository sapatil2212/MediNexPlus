import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import prisma from "../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

/* ── GET /api/public/booking/doctors?hid=HOSPITAL_ID&departmentId=DEPT_ID ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let hid = searchParams.get("hid");

  try {
    // Hardcoded for MediNex+ portal (TODO: make configurable for multi-hospital)
    if (!hid) hid = "fd92c618-f6dc-42da-96ae-762a09d19f25";

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
