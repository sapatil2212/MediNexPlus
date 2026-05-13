import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../../backend/config/db";

const px = prisma as any;

/**
 * POST /api/subdept/inventory/purchase-request
 * Creates a purchase order request from the counter sale flow
 * when an item is out of stock or not in inventory.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      itemName,
      quantity,
      supplierId,
      source,
      priority,
    } = body;

    if (!itemName || !itemName.trim()) {
      return errorResponse("Item name is required", 400);
    }
    if (!quantity || quantity < 1) {
      return errorResponse("Quantity must be >= 1", 400);
    }

    // Try to find the inventory item by name
    const invItem = await px.inventoryItem.findFirst({
      where: {
        hospitalId: auth.hospitalId,
        name: { contains: itemName.trim(), mode: "insensitive" },
      },
    });

    // Check if a pending purchase order already exists for this item
    if (invItem) {
      const existingPO = await px.purchaseOrder.findFirst({
        where: {
          hospitalId: auth.hospitalId,
          status: { in: ["PENDING", "APPROVED", "SENT"] },
          items: { some: { itemId: invItem.id } },
        },
      });
      if (existingPO) {
        return successResponse(
          { purchaseOrderId: existingPO.id, existing: true },
          `A pending purchase order already exists for ${itemName}`
        );
      }
    }

    // Create a new purchase order
    const poCount = await px.purchaseOrder.count({ where: { hospitalId: auth.hospitalId } });
    const orderNo = `PO-${String(poCount + 1).padStart(5, "0")}`;

    const purchaseOrder = await px.purchaseOrder.create({
      data: {
        hospitalId: auth.hospitalId,
        orderNo,
        supplierId: supplierId || null,
        status: "PENDING",
        orderDate: new Date(),
        expectedDate: null,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        notes: `[AUTO-GENERATED] ${source || "Counter Sale - Out of Stock"} — ${priority || "HIGH"} priority. Item: ${itemName.trim()}, Qty: ${quantity}`,
        createdBy: auth.user?.userId || null,
        items: invItem ? {
          create: {
            itemId: invItem.id,
            quantity,
            unitPrice: invItem.purchasePrice || 0,
            amount: (invItem.purchasePrice || 0) * quantity,
            hospitalId: auth.hospitalId,
          },
        } : undefined,
      },
      include: { items: true },
    });

    return successResponse(
      { purchaseOrderId: purchaseOrder.id, orderNo: purchaseOrder.orderNo },
      `Purchase request created for ${itemName}`
    );
  } catch (err: any) {
    console.error("Purchase request error:", err);
    return errorResponse(err.message || "Failed to create purchase request", 500);
  }
}
