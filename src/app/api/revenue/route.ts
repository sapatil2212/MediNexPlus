import { NextRequest } from "next/server";
import { requireRole } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import prisma from "../../../../backend/config/db";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"];
export const dynamic = "force-dynamic";

// GET /api/revenue
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const url      = new URL(req.url);
    const page     = Math.max(1, parseInt(url.searchParams.get("page")       || "1"));
    const limit    = Math.min(100, parseInt(url.searchParams.get("limit")    || "30"));
    const source   = url.searchParams.get("source")   || "";
    const dateFrom = url.searchParams.get("dateFrom") || "";
    const dateTo   = url.searchParams.get("dateTo")   || "";

    const where: any = { hospitalId: auth.hospitalId, referenceId: null };
    if (source)   where.sourceType = source;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo)   where.createdAt.lte = new Date(dateTo + "T23:59:59");
    }

    const [revenues, total] = await Promise.all([
      (prisma as any).revenue.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).revenue.count({ where }),
    ]);

    // Aggregates
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayAgg, monthAgg, bySource] = await Promise.all([
      (prisma as any).revenue.aggregate({
        where: { hospitalId: auth.hospitalId, referenceId: null, createdAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
      (prisma as any).revenue.aggregate({
        where: { hospitalId: auth.hospitalId, referenceId: null, createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      (prisma as any).revenue.groupBy({
        by: ["sourceType"],
        where: { hospitalId: auth.hospitalId, referenceId: null, createdAt: { gte: monthStart } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
    ]);

    return successResponse({
      revenues,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        today: todayAgg._sum.amount || 0,
        month: monthAgg._sum.amount || 0,
        bySource,
      },
    }, "Revenue fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/revenue — manually add revenue entry
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { sourceType, amount, description, addedBy, department } = body;
    const parsed = parseFloat(amount);
    if (amount == null || isNaN(parsed) || parsed <= 0) return errorResponse("A valid positive amount is required", 400);

    const revenue = await (prisma as any).revenue.create({
      data: {
        hospitalId:  auth.hospitalId,
        sourceType:  sourceType || "OTHER",
        amount:      parsed,
        description: description || null,
        addedBy:     addedBy    || (auth.user as any)?.name || null,
        department:  department || "Hospital Administration",
      },
    });
    return successResponse(revenue, "Revenue added", 201);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
