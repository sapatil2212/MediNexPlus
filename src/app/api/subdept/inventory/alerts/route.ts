import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import * as service from "../../../../../../backend/services/inventory.service";

// GET /api/subdept/inventory/alerts - Get inventory alerts (low stock, expiring)
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD", "STAFF"]);
  if (auth.error) return auth.error;

  try {
    const data = await service.getAlerts(auth.hospitalId);
    return successResponse(data, "Alerts fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
