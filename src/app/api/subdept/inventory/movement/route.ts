import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import * as service from "../../../../../../backend/services/inventory.service";
import { z } from "zod";

const adjustmentSchema = z.object({
  itemId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  quantity: z.number().int(), // positive for addition, negative for reduction
  reason: z.string().min(1),
  notes: z.string().optional(),
});

// GET /api/subdept/inventory/movement - Get stock movements
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD", "STAFF"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId") || undefined;
    const data = await service.getMovements(auth.hospitalId, itemId);
    return successResponse(data, "Movements fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/subdept/inventory/movement - Manual stock adjustment
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = adjustmentSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const { itemId, quantity, reason, notes } = result.data;
    
    // Record as consumption (negative) or addition (positive)
    if (quantity < 0) {
      await service.recordConsumption(auth.hospitalId, {
        itemId,
        quantity: Math.abs(quantity),
        source: "Manual Adjustment",
        referenceId: reason,
        performedBy: auth.user.userId,
      });
    } else {
      // For positive adjustments, we'd need a service method for stock addition
      // This is a placeholder - in production, implement proper stock addition
      return errorResponse("Stock addition not implemented yet. Use Purchase Orders.", 400);
    }

    return successResponse({ success: true }, "Stock adjusted");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
