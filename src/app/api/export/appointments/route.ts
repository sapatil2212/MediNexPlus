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
  const dateFrom = sp.get("dateFrom");
  const dateTo   = sp.get("dateTo");
  const status   = sp.get("status");
  const doctorId = sp.get("doctorId");

  const where: any = { hospitalId: auth.hospitalId };
  if (dateFrom || dateTo) {
    where.appointmentDate = {};
    if (dateFrom) where.appointmentDate.gte = new Date(dateFrom);
    if (dateTo)   where.appointmentDate.lte = new Date(dateTo);
  }
  if (status)   where.status   = status;
  if (doctorId) where.doctorId = doctorId;

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient:    { select: { patientId: true, name: true, phone: true, email: true, gender: true } },
      doctor:     { select: { name: true, specialization: true } },
      department: { select: { name: true } },
    },
    orderBy: [{ appointmentDate: "asc" }, { timeSlot: "asc" }],
    take: 5000,
  });

  const header = ["Token#", "Date", "Time Slot", "Patient ID", "Patient Name", "Phone", "Email", "Gender", "Doctor", "Specialization", "Department", "Type", "Status", "Consultation Fee", "Notes"];
  const rows = appointments.map(a => [
    String(a.tokenNumber ?? ""),
    new Date(a.appointmentDate).toLocaleDateString("en-IN"),
    a.timeSlot ?? "",
    a.patient?.patientId ?? "",
    a.patient?.name ?? "",
    a.patient?.phone ?? "",
    a.patient?.email ?? "",
    a.patient?.gender ?? "",
    a.doctor?.name ?? "",
    a.doctor?.specialization ?? "",
    a.department?.name ?? "",
    a.type,
    a.status,
    String(a.consultationFee ?? ""),
    a.notes ?? "",
  ]);

  const csv = toCSV([header, ...rows]);
  const filename = `appointments_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
