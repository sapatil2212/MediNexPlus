import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;
export const dynamic = "force-dynamic";

/**
 * GET /api/pharmacy/revenue-expense
 * Returns pharmacy-specific revenue (bills) and expenses (purchases) for the current sub-dept
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const url    = new URL(req.url);
    const period = url.searchParams.get("period") || "month"; // today | week | month | all

    const now = new Date();
    let fromDate: Date | null = null;
    if (period === "today") {
      fromDate = new Date(now); fromDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 7); fromDate.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // ── Revenue: pharmacy bills (counter-sale + dispensed prescriptions) ──
    const billWhere: any = {
      hospitalId: auth.hospitalId,
      OR: [
        { notes: { contains: "PHARMACY_COUNTER_SALE" } },
        { notes: { contains: "PHARMACY" } },
        { billItems: { some: { type: "PHARMACY" } } },
      ],
    };
    if (fromDate) billWhere.createdAt = { gte: fromDate };

    const bills = await px.bill.findMany({
      where: billWhere,
      include: {
        patient: { select: { id: true, name: true, patientId: true } },
        billItems: true,
        payments: { orderBy: { paidAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // ── Expenses: purchases made by this sub-dept ──
    let subDeptId: string | null = null;
    if (auth.user.role === "SUB_DEPT_HEAD") {
      const sd = await px.subDepartment.findFirst({ where: { userId: auth.user.userId, hospitalId: auth.hospitalId } });
      if (sd) subDeptId = sd.id;
    }

    const purchaseWhere: any = { hospitalId: auth.hospitalId };
    if (subDeptId) purchaseWhere.subDepartmentId = subDeptId;
    if (fromDate) purchaseWhere.createdAt = { gte: fromDate };

    const purchases = await px.purchase.findMany({
      where: purchaseWhere,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { item: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // ── Aggregates ──
    const totalRevenue   = bills.reduce((s: number, b: any) => s + (b.paidAmount || 0), 0);
    const totalExpenses  = purchases.reduce((s: number, p: any) => s + (p.grandTotal || p.totalAmount || 0), 0);
    const pendingPayouts = purchases.filter((p: any) => p.paymentStatus === "PENDING" || p.paymentStatus === "PARTIAL")
                                    .reduce((s: number, p: any) => s + (p.grandTotal || p.totalAmount || 0), 0);

    // Revenue by payment method
    const methodMap: Record<string, number> = {};
    for (const b of bills) {
      const m = b.paymentMethod || (b.payments?.[0]?.method) || "OTHER";
      methodMap[m] = (methodMap[m] || 0) + (b.paidAmount || 0);
    }

    return successResponse({
      revenue: { items: bills, total: totalRevenue, byMethod: methodMap },
      expenses: { items: purchases, total: totalExpenses, pendingPayouts },
      net: totalRevenue - totalExpenses,
    }, "Revenue & expense data fetched");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch revenue/expense data", 500);
  }
}

/**
 * POST /api/pharmacy/revenue-expense
 * Manually add an expense (purchase/operational cost) for this pharmacy
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { title, amount, category, date, description } = body;
    const parsed = parseFloat(amount);
    if (!title || isNaN(parsed) || parsed <= 0 || !date)
      return errorResponse("title, amount (>0), and date are required", 400);

    const expense = await px.expense.create({
      data: {
        hospitalId:  auth.hospitalId,
        title,
        category:    category || "OTHER",
        amount:      parsed,
        date:        new Date(date),
        description: description || null,
        addedBy:     (auth.user as any)?.id || null,
      },
    });
    return successResponse(expense, "Expense added", 201);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to add expense", 500);
  }
}
