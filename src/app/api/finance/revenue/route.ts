import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getRevenueStats } from "../../../../../backend/services/finance.service";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD"];
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const groupBy = (searchParams.get("groupBy") as "day" | "month" | "source") || undefined;

    const stats = await getRevenueStats(auth.hospitalId, { dateFrom, dateTo, groupBy });
    return successResponse(stats, "Revenue stats fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
