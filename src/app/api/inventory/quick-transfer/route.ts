import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import * as service from "../../../../../backend/services/central-inventory.service";

// POST /api/inventory/quick-transfer
// Body: { subDepartmentId, subDeptName, items: [{ itemId, quantity }], notes? }
// Auto-resolves Central→Dept locations + auto-approves transfer
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { subDepartmentId, subDeptName, items, notes } = body;

    if (!subDepartmentId || !subDeptName) {
      return errorResponse("Sub-department is required", 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse("At least one item with quantity is required", 400);
    }

    for (const item of items) {
      if (!item.itemId || !item.quantity || item.quantity <= 0) {
        return errorResponse("Each item must have a valid itemId and quantity > 0", 400);
      }
    }

    const result = await service.quickTransferToDept(
      auth.hospitalId,
      subDepartmentId,
      subDeptName,
      items,
      auth.user.userId,
      notes
    );

    return successResponse(result, "Stock transferred to department successfully", 201);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
