import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { errorResponse } from "../../../../../../backend/utils/response";
import prisma from "../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["SUB_DEPT_HEAD", "HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const search   = searchParams.get("search")          || undefined;
    const subDeptId = searchParams.get("subDepartmentId") || undefined;

    const where: any = { hospitalId: auth.hospitalId };
    if (subDeptId) where.subDepartmentId = subDeptId;
    if (search) {
      where.OR = [
        { patient:      { name:  { contains: search, mode: "insensitive" } } },
        { patient:      { patientId: { contains: search, mode: "insensitive" } } },
        { performedBy:  { contains: search, mode: "insensitive" } },
        { notes:        { contains: search, mode: "insensitive" } },
      ];
    }

    const records = await (prisma as any).procedureRecord.findMany({
      where,
      include: {
        patient:       { select: { name: true, patientId: true, phone: true } },
        procedure:     { select: { name: true, type: true } },
        subDepartment: { select: { name: true } },
      },
      orderBy: { performedAt: "desc" },
      take: 1000,
    });

    const rows = records.map((r: any) => [
      r.patient?.patientId     ?? "",
      r.patient?.name          ?? "",
      r.patient?.phone         ?? "",
      r.subDepartment?.name    ?? "",
      r.procedure?.name        ?? "",
      r.procedure?.type        ?? "",
      String(r.amount ?? 0),
      r.status                 ?? "",
      r.performedBy            ?? "",
      r.notes                  ?? "",
      new Date(r.performedAt).toLocaleDateString("en-IN"),
    ]);

    const header = [
      "Patient ID", "Patient Name", "Phone", "Sub-Dept", "Procedure",
      "Type", "Amount", "Status", "Performed By", "Notes", "Date",
    ];

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row: string[]) => row.map(escape).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="procedure-records-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
