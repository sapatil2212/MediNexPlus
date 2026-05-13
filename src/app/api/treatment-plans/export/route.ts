import { NextRequest, NextResponse } from "next/server";
import { withAuth, checkPermission, createPermissionError, createUnauthorizedError } from "../../../../../backend/middlewares/permission.middleware";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

const px = prisma as any;

export async function GET(req: NextRequest) {
  const authReq = withAuth(req);
  if (!authReq.user) return createUnauthorizedError();
  if (!checkPermission(authReq, "REPORTS_VIEW")) return createPermissionError("REPORTS_VIEW");

  const { hospitalId } = authReq.user;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const format = searchParams.get("format") || "csv";
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const where: any = { hospitalId };
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to + "T23:59:59");
  }

  const plans = await px.treatmentPlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      patient: { select: { patientId: true, name: true, phone: true } },
      service:  { select: { name: true } },
      doctor:   { select: { name: true } },
      department:    { select: { name: true } },
      subDepartment: { select: { name: true } },
      _count: { select: { sessions: true } },
    },
  });

  if (format === "json") {
    return NextResponse.json({ success: true, data: { plans, total: plans.length } });
  }

  // CSV
  const headers = [
    "Plan ID", "Plan Name", "Patient ID", "Patient Name", "Patient Phone",
    "Service", "Doctor", "Department", "Sub-Department",
    "Status", "Billing Status",
    "Total Sessions", "Completed Sessions",
    "Total Cost", "Paid Amount", "Balance",
    "Start Date", "End Date", "Created At",
  ];

  const rows = plans.map((p: any) => [
    p.id,
    `"${(p.planName || "").replace(/"/g, '""')}"`,
    p.patient?.patientId || "",
    `"${(p.patient?.name || "").replace(/"/g, '""')}"`,
    p.patient?.phone || "",
    `"${(p.service?.name || "").replace(/"/g, '""')}"`,
    `"${(p.doctor?.name || "").replace(/"/g, '""')}"`,
    `"${(p.department?.name || "").replace(/"/g, '""')}"`,
    `"${(p.subDepartment?.name || "").replace(/"/g, '""')}"`,
    p.status || "",
    p.billingStatus || "",
    p.totalSessions ?? 0,
    p.completedSessions ?? 0,
    p.totalCost ?? 0,
    p.paidAmount ?? 0,
    (p.totalCost ?? 0) - (p.paidAmount ?? 0),
    p.startDate ? new Date(p.startDate).toLocaleDateString("en-IN") : "",
    p.endDate   ? new Date(p.endDate).toLocaleDateString("en-IN")   : "",
    new Date(p.createdAt).toLocaleDateString("en-IN"),
  ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `treatment-plans-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
