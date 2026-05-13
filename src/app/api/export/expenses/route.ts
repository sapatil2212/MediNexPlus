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
    const category = searchParams.get("category") || undefined;
    const dateFrom = searchParams.get("dateFrom")  || undefined;
    const dateTo   = searchParams.get("dateTo")    || undefined;

    const where: any = { hospitalId: auth.hospitalId };
    if (category) where.category = category;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo)   where.date.lte = new Date(dateTo + "T23:59:59");
    }

    const expenses = await (prisma as any).expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: 5000,
    });

    const rows = expenses.map((e: any) => [
      new Date(e.date).toLocaleDateString("en-IN"),
      e.title        ?? "",
      e.category     ?? "",
      String(e.amount ?? 0),
      e.description  ?? "",
      new Date(e.createdAt).toLocaleDateString("en-IN"),
    ]);

    const header = ["Date", "Title", "Category", "Amount", "Description", "Created"];

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row: string[]) => row.map(escape).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
