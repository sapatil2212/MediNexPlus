import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const where: any = { hospitalId: auth.hospitalId };
    if (status) where.status = status;

    const allocations = await (prisma as any).bedAllocation.findMany({
      where,
      include: {
        patient: { select: { patientId: true, name: true, phone: true, gender: true, bloodGroup: true } },
        bed: {
          select: { bedNumber: true, type: true, ward: { select: { name: true, type: true } } },
        },
      },
      orderBy: { admissionDate: "desc" },
      take: 2000,
    });

    const rows = allocations.map((a: any) => [
      a.patient?.patientId      ?? "",
      a.patient?.name           ?? "",
      a.patient?.phone          ?? "",
      a.patient?.gender         ?? "",
      a.patient?.bloodGroup     ?? "",
      a.bed?.ward?.name         ?? "",
      a.bed?.ward?.type         ?? "",
      a.bed?.bedNumber          ?? "",
      a.bed?.type               ?? "",
      a.status                  ?? "",
      a.admittingDoctorName     ?? "",
      a.diagnosis               ?? "",
      a.attendantName           ?? "",
      a.attendantPhone          ?? "",
      a.admissionDate ? new Date(a.admissionDate).toLocaleDateString("en-IN") : "",
      a.expectedDischargeDate ? new Date(a.expectedDischargeDate).toLocaleDateString("en-IN") : "",
      a.dischargeDate ? new Date(a.dischargeDate).toLocaleDateString("en-IN") : "",
      a.notes ?? "",
    ]);

    const header = [
      "Patient ID", "Patient Name", "Phone", "Gender", "Blood Group",
      "Ward", "Ward Type", "Bed No.", "Bed Type", "Status",
      "Admitting Doctor", "Diagnosis", "Attendant", "Attendant Phone",
      "Admission Date", "Expected Discharge", "Discharge Date", "Notes",
    ];

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row: string[]) => row.map(escape).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ipd-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
