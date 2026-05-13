import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "FINANCE_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const sourceType = searchParams.get("sourceType") || undefined;
    const dateFrom   = searchParams.get("dateFrom")   || undefined;
    const dateTo     = searchParams.get("dateTo")     || undefined;

    const where: any = { hospitalId: auth.hospitalId };
    if (sourceType) where.sourceType = sourceType;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo)   where.createdAt.lte = new Date(dateTo + "T23:59:59");
    }

    const revenues = await (prisma as any).revenue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const rows = revenues.map((r: any) => [
      new Date(r.createdAt).toLocaleDateString("en-IN"),
      (r.sourceType ?? "").replace(/_/g, " "),
      r.description    ?? "",
      r.referenceType  ?? "",
      String(r.amount  ?? 0),
    ]);

    const header = ["Date", "Source Type", "Description", "Reference Type", "Amount"];

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row: string[]) => row.map(escape).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="revenue-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
