import { NextRequest } from "next/server";
import { requireRole } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import prisma from "../../../../backend/config/db";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"];
export const dynamic = "force-dynamic";

// GET /api/expense
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const url = new URL(req.url);
    const page     = Math.max(1, parseInt(url.searchParams.get("page")     || "1"));
    const limit    = Math.min(200, parseInt(url.searchParams.get("limit")  || "20"));
    const search     = url.searchParams.get("search")     || "";
    const category   = url.searchParams.get("category")   || "";
    const department = url.searchParams.get("department") || "";
    const dateFrom   = url.searchParams.get("dateFrom")   || "";
    const dateTo     = url.searchParams.get("dateTo")     || "";

    const where: any = { hospitalId: auth.hospitalId };
    if (search)     where.OR = [{ title: { contains: search } }, { description: { contains: search } }];
    if (category)   where.category = category;
    if (department) where.department = department;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo)   where.date.lte = new Date(dateTo + "T23:59:59");
    }

    const [expenses, total] = await Promise.all([
      (prisma as any).expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).expense.count({ where }),
    ]);

    // Stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [monthTotal, categoryBreakdown] = await Promise.all([
      (prisma as any).expense.aggregate({
        where: { hospitalId: auth.hospitalId, date: { gte: monthStart } },
        _sum: { amount: true },
      }),
      (prisma as any).expense.groupBy({
        by: ["category"],
        where: { hospitalId: auth.hospitalId, date: { gte: monthStart } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
    ]);

    return successResponse({
      expenses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: { monthTotal: monthTotal._sum.amount || 0, categoryBreakdown },
    }, "Expenses fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/expense
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { title, category, amount, date, description, receipt, addedByName, department } = body;
    const parsedAmt = parseFloat(amount);
    if (!title || amount == null || isNaN(parsedAmt) || parsedAmt <= 0 || !date) return errorResponse("title, a valid positive amount, and date are required", 400);

    const expense = await (prisma as any).expense.create({
      data: {
        hospitalId:  auth.hospitalId,
        title,
        category:    category || "OTHER",
        amount:      parsedAmt,
        date:        new Date(date),
        description: description || null,
        receipt:     receipt     || null,
        addedBy:     (auth.user as any)?.id || null,
        addedByName: addedByName || (auth.user as any)?.name || null,
        department:  department  || "Hospital Administration",
      },
    });
    return successResponse(expense, "Expense added", 201);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
