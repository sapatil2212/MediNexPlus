import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

// GET /api/inventory/stock-notifications
// Returns completed transfers sent TO the logged-in sub-dept location since `since` param.
// Used for real-time stock-received popup notifications on sub-dept dashboards.
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["SUB_DEPT_HEAD", "HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000); // default 24h

    // Look up the sub-dept by userId (unique field — avoids relying on hospitalId in JWT)
    const subDept = await (prisma as any).subDepartment.findFirst({
      where: { userId: auth.user.userId },
      select: { id: true, name: true, hospitalId: true },
    });
    if (!subDept) return successResponse([], "No sub-department linked to this account");

    // Use the sub-dept's own hospitalId for all subsequent queries
    const hospitalId = subDept.hospitalId;

    const subDeptLocation = await (prisma as any).stockLocation.findFirst({
      where: { hospitalId, subDepartmentId: subDept.id, isActive: true },
      select: { id: true, name: true },
    });

    // If no stock location exists yet (no transfers ever made to this dept), return empty
    if (!subDeptLocation) return successResponse([], "No stock location found yet");

    // Fetch completed transfers to this location since `since`
    const transfers = await (prisma as any).stockTransfer.findMany({
      where: {
        hospitalId,
        toLocationId: subDeptLocation.id,
        status: "COMPLETED",
        transferredAt: { gte: since },
      },
      include: {
        fromLocation: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, category: true, unit: true } },
          },
        },
      },
      orderBy: { transferredAt: "desc" },
      take: 20,
    });

    return successResponse(transfers, "Stock notifications fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
