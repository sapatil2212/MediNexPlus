import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import prisma from "../../../../../backend/config/db";

function esc(v: any): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(rows: string[][]): string {
  return rows.map(r => r.map(esc).join(",")).join("\r\n");
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR"]);
  if (auth.error) return auth.error;

  const sp = req.nextUrl.searchParams;
  const gender    = sp.get("gender");
  const bloodGroup = sp.get("bloodGroup");
  const search    = sp.get("search");

  const where: any = { hospitalId: auth.hospitalId };
  if (gender)     where.gender     = gender;
  if (bloodGroup) where.bloodGroup = bloodGroup;
  if (search) {
    where.OR = [
      { name:      { contains: search, mode: "insensitive" } },
      { phone:     { contains: search } },
      { patientId: { contains: search } },
    ];
  }

  const patients = await prisma.patient.findMany({
    where,
    include: {
      _count: { select: { appointments: true, followUps: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 10000,
  });

  const header = ["Patient ID", "Name", "Phone", "Email", "Gender", "Date of Birth", "Blood Group", "Address", "Total Appointments", "Follow-ups", "Registered On"];
  const rows = patients.map(p => [
    p.patientId,
    p.name,
    p.phone,
    p.email ?? "",
    p.gender ?? "",
    p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("en-IN") : "",
    p.bloodGroup ?? "",
    p.address ?? "",
    String(p._count.appointments),
    String(p._count.followUps),
    new Date(p.createdAt).toLocaleDateString("en-IN"),
  ]);

  const csv = toCSV([header, ...rows]);
  const filename = `patients_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
