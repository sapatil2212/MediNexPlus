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
    const search     = searchParams.get("search")       || undefined;
    const deptId     = searchParams.get("departmentId") || undefined;
    const isActive   = searchParams.get("isActive");

    const where: any = { hospitalId: auth.hospitalId };
    if (deptId)   where.departmentId = deptId;
    if (isActive !== null && isActive !== "") where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { name:           { contains: search, mode: "insensitive" } },
        { email:          { contains: search, mode: "insensitive" } },
        { specialization: { contains: search, mode: "insensitive" } },
        { phone:          { contains: search, mode: "insensitive" } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    const rows = doctors.map(d => [
      d.doctorCode        ?? "",
      d.name,
      d.email             ?? "",
      d.phone             ?? "",
      d.specialization    ?? "",
      d.qualification     ?? "",
      d.department?.name  ?? "",
      String(d.experience ?? 0),
      d.consultationFee   != null ? String(d.consultationFee) : "",
      d.registrationNo    ?? "",
      d.isActive ? "Active" : "Inactive",
      d.credentialsSent ? "Sent" : "Not Sent",
      new Date(d.createdAt).toLocaleDateString("en-IN"),
    ]);

    const header = [
      "Doctor Code", "Name", "Email", "Phone", "Specialization", "Qualification",
      "Department", "Experience (yrs)", "Consultation Fee", "Reg. No.",
      "Status", "Credentials", "Joined",
    ];

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map(row => row.map(escape).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="doctors-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
