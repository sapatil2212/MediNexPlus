import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;

/**
 * POST /api/pharmacy/stock
 * Add stock batch to an existing inventory item — SUB_DEPT_HEAD or HOSPITAL_ADMIN
 * Body: { itemId, quantity, price, batchNumber?, expiryDate?, supplierId? }
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { itemId, quantity, price, batchNumber, expiryDate, supplierId } = body;

    if (!itemId || !quantity || quantity <= 0) {
      return errorResponse("itemId and quantity (>0) are required", 400);
    }

    const item = await px.inventoryItem.findFirst({
      where: { id: itemId, hospitalId: auth.hospitalId },
    });
    if (!item) return errorResponse("Item not found", 404);

    const batch = await px.stockBatch.create({
      data: {
        hospitalId: auth.hospitalId,
        itemId,
        batchNumber: batchNumber || null,
        quantity,
        remainingQty: quantity,
        purchasePrice: price || item.purchasePrice || 0,
        sellingPrice: item.sellingPrice || price || 0,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplierId: supplierId || null,
      },
    });

    await px.stockMovement.create({
      data: {
        hospitalId: auth.hospitalId,
        itemId,
        batchId: batch.id,
        type: "IN",
        quantity,
        source: "ManualRestock",
        notes: batchNumber ? `Batch: ${batchNumber}` : "Manual stock addition",
        performedBy: auth.user.userId,
      },
    });

    return successResponse({ batch, item }, "Stock added successfully");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to add stock", 500);
  }
}
