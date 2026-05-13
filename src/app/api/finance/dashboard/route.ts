import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getFinanceDashboardStats } from "../../../../../backend/services/finance.service";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"];
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const stats = await getFinanceDashboardStats(auth.hospitalId);
    return successResponse(stats, "Dashboard stats fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
