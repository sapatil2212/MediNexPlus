import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import * as service from "../../../../../../backend/services/inventory.service";
import { z } from "zod";

const purchaseSchema = z.object({
  supplierId: z.string().uuid(),
  purchaseNo: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    sellingPrice: z.number().positive().optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional(), // ISO string
  })).min(1),
});

const purchaseUpdateSchema = z.object({
  id: z.string().uuid(),
  purchaseNo: z.string().min(1).optional(),
  notes: z.string().optional(),
});

// GET /api/subdept/inventory/purchase - List or get single purchase
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD", "STAFF"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const data = await service.getPurchaseById(id, auth.hospitalId);
      if (!data) return errorResponse("Purchase not found", 404);
      return successResponse(data, "Purchase fetched");
    }
    const data = await service.getPurchases(auth.hospitalId);
    return successResponse(data, "Purchases fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/subdept/inventory/purchase - Create new purchase order
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = purchaseSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    
    const data = await service.createPurchaseOrder(auth.hospitalId, result.data);
    return successResponse(data, "Purchase created", 201);
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Purchase number already exists", 409);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/subdept/inventory/purchase - Update purchase
export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = purchaseUpdateSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const data = await service.updatePurchase(result.data.id, auth.hospitalId, {
      purchaseNo: result.data.purchaseNo,
      notes: result.data.notes,
    });
    return successResponse(data, "Purchase updated");
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Purchase number already exists", 409);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/subdept/inventory/purchase - Cancel purchase
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    const data = await service.cancelPurchase(id, auth.hospitalId);
    return successResponse(data, "Purchase cancelled");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
