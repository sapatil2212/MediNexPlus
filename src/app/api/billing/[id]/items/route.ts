import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { updateBillItems, BillingServiceError } from "../../../../../../backend/services/billing.service";

export const dynamic = "force-dynamic";

// PUT /api/billing/[id]/items — replace bill items and recalculate totals
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "FINANCE_HEAD", "RECEPTIONIST", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (!Array.isArray(body.items)) {
      return errorResponse("items array is required", 400);
    }
    const bill = await updateBillItems(params.id, auth.hospitalId, body.items);
    return successResponse(bill, "Bill items updated");
  } catch (e: any) {
    if (e instanceof BillingServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
