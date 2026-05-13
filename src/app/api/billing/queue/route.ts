import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getBillingQueue, BillingServiceError } from "../../../../../backend/services/billing.service";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "RECEPTIONIST", "STAFF", "SUB_DEPT_HEAD"];
export const dynamic = "force-dynamic";

// GET /api/billing/queue — get billing queue (transferred appointments with bills)
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const url = new URL(req.url);
    const queue = await getBillingQueue(auth.hospitalId, {
      search: url.searchParams.get("search") || undefined,
      date: url.searchParams.get("date") || undefined,
      procedureOnly: url.searchParams.get("procedureOnly") === "true",
      subDeptId: url.searchParams.get("subDeptId") || undefined,
    });
    return successResponse(queue, "Billing queue fetched");
  } catch (e: any) {
    if (e instanceof BillingServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
