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
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "FINANCE_HEAD", "RECEPTIONIST", "STAFF"]);
  if (auth.error) return auth.error;

  const sp = req.nextUrl.searchParams;
  const dateFrom = sp.get("dateFrom");
  const dateTo   = sp.get("dateTo");
  const status   = sp.get("status");

  const where: any = { hospitalId: auth.hospitalId };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   where.createdAt.lte = new Date(dateTo + "T23:59:59");
  }
  if (status) where.status = status;

  const bills = await (prisma as any).bill.findMany({
    where,
    include: {
      patient:  { select: { patientId: true, name: true, phone: true } },
      payments: { select: { amount: true, method: true, paidAt: true, transactionId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = [
    "Bill No", "Date", "Patient ID", "Patient Name", "Phone",
    "Subtotal", "Discount", "Tax", "Total", "Paid Amount",
    "Status", "GST?", "CGST%", "SGST%", "Payment Methods", "Notes"
  ];

  const rows = bills.map((b: any) => {
    const methods = (b.payments || []).map((p: any) => p.method).filter(Boolean).join("; ");
    return [
      b.billNo ?? "",
      new Date(b.createdAt).toLocaleDateString("en-IN"),
      b.patient?.patientId ?? "",
      b.patient?.name ?? "",
      b.patient?.phone ?? "",
      String(b.subtotal ?? 0),
      String(b.discount ?? 0),
      String(b.tax ?? 0),
      String(b.total ?? 0),
      String(b.paidAmount ?? 0),
      b.status ?? "",
      b.isGst ? "Yes" : "No",
      String(b.cgst ?? 0),
      String(b.sgst ?? 0),
      methods,
      b.notes ?? "",
    ];
  });

  const csv = toCSV([header, ...rows]);
  const filename = `billing_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
