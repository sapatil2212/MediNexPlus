import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import * as service from "../../../../../backend/services/inventory.service";
import { z } from "zod";

const itemSchema = z.object({
  // 1. Basic Info
  name: z.string().min(2),
  genericName: z.string().optional().nullable(),
  brandName: z.string().optional().nullable(),
  category: z.enum(["Medicine", "Consumables", "Surgical Items", "Equipment", "Lab Items"]),
  subCategory: z.string().optional().nullable(),
  itemType: z.enum(["Consumable", "Non-Consumable"]).optional().nullable(),
  description: z.string().optional().nullable(),

  // 2. Unit & Packaging
  unit: z.string().default("pcs"),
  packSize: z.string().optional().nullable(),
  conversion: z.string().optional().nullable(),

  // 3. Identification
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  hsnCode: z.string().optional().nullable(),

  // 4. Stock & Alerts
  minStock: z.number().int().min(0).default(5),
  maxStock: z.number().int().min(0).optional().nullable(),
  reorderLevel: z.number().int().min(0).optional().nullable(),
  reorderQty: z.number().int().min(0).optional().nullable(),

  // 5. Purchase Details
  purchasePrice: z.number().min(0).default(0),
  purchaseUnit: z.string().optional().nullable(),
  preferredVendorId: z.string().uuid().optional().nullable(),

  // 6. Pricing & Billing
  mrp: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  discount: z.number().min(0).max(100).default(0),
  gst: z.number().min(0).max(100).default(0),
  billingType: z.enum(["Tax Inclusive", "Tax Exclusive"]).optional().nullable(),

  // 8. Storage & Location
  location: z.enum(["Pharmacy Store", "OT Store", "Ward Stock"]).optional().nullable(),
  rackNumber: z.string().optional().nullable(),
  tempRequirement: z.enum(["Room Temp", "Refrigerated"]).optional().nullable(),

  // 9. Compliance & Safety
  drugSchedule: z.enum(["Schedule H", "Schedule X", "OTC"]).optional().nullable(),
  requiresRx: z.boolean().default(false),

  // 10. Status & Control
  isActive: z.boolean().default(true),
  isReturnable: z.boolean().default(true),
  isCritical: z.boolean().default(false),

  // 11. Media
  image: z.string().optional().nullable(),
  attachments: z.string().optional().nullable(),
});

// GET /api/subdept/inventory - List or get single inventory item
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD", "STAFF"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const data = await service.getItemDetails(id, auth.hospitalId);
      if (!data) return errorResponse("Item not found", 404);
      return successResponse(data, "Item fetched");
    }
    const params = {
      hospitalId: auth.hospitalId,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    };
    const data = await service.getItems(params);
    return successResponse(data, "Items fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/subdept/inventory - Create new medicine/item
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = itemSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    
    const data = await service.addItem(auth.hospitalId, result.data);
    return successResponse(data, "Item created", 201);
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Item with same name & category already exists", 409);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/subdept/inventory - Update medicine/item
export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return errorResponse("ID is required", 400);
    
    const result = itemSchema.partial().safeParse(updateData);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    
    const data = await service.updateItem(id, auth.hospitalId, result.data);
    return successResponse(data, "Item updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/subdept/inventory - Delete medicine/item
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    
    await service.deleteItem(id, auth.hospitalId);
    return successResponse(null, "Item deleted");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
