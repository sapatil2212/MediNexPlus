import { NextRequest } from "next/server";
import { requireHospitalAdmin, requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import * as service from "../../../../../backend/services/inventory.service";
import prisma from "../../../../../backend/config/db";
import { z } from "zod";

const itemSchema = z.object({
  // 1. Basic Info
  name: z.string().min(2),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  category: z.enum(["Medicine", "Consumables", "Surgical Items", "Equipment", "Lab Items"]),
  subCategory: z.string().optional(),
  itemType: z.enum(["Consumable", "Non-Consumable"]).optional(),
  description: z.string().optional(),

  // 2. Unit & Packaging
  unit: z.string().default("pcs"),
  packSize: z.string().optional(),
  conversion: z.string().optional(),

  // 3. Identification
  sku: z.string().optional(),
  barcode: z.string().optional(),
  hsnCode: z.string().optional(),

  // 4. Stock & Alerts
  minStock: z.number().int().min(0).default(5),
  maxStock: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  reorderQty: z.number().int().min(0).optional(),
  openingStock: z.number().int().min(0).optional(),

  // 5. Purchase Details
  purchasePrice: z.number().min(0).default(0),
  purchaseUnit: z.string().optional(),
  preferredVendorId: z.string().uuid().optional(),

  // 6. Pricing & Billing
  mrp: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  discount: z.number().min(0).max(100).default(0),
  gst: z.number().min(0).max(100).default(0),
  billingType: z.enum(["Tax Inclusive", "Tax Exclusive"]).optional(),

  // 8. Storage & Location
  location: z.enum(["Pharmacy Store", "OT Store", "Ward Stock"]).optional(),
  rackNumber: z.string().optional(),
  tempRequirement: z.enum(["Room Temp", "Refrigerated"]).optional(),

  // 9. Compliance & Safety
  drugSchedule: z.enum(["Schedule H", "Schedule X", "OTC"]).optional(),
  requiresRx: z.boolean().default(false),

  // 10. Status & Control
  isActive: z.boolean().default(true),
  isReturnable: z.boolean().default(true),
  isCritical: z.boolean().default(false),

  // 11. Media
  image: z.string().optional(),
  attachments: z.string().optional(),
});

const INV_READ_ROLES = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"];

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, INV_READ_ROLES);
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
      limit: parseInt(searchParams.get("limit") || "10"),
    };
    const data = await service.getItems(params);
    return successResponse(data, "Items fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = itemSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    
    const { openingStock, ...itemData } = result.data;
    const data = await service.addItem(auth.hospitalId, itemData);

    // Create initial StockBatch + StockMovement for opening stock
    if (openingStock && openingStock > 0) {
      const batch = await (prisma as any).stockBatch.create({
        data: {
          hospitalId: auth.hospitalId,
          itemId: data.id,
          batchNumber: "OPENING",
          quantity: openingStock,
          remainingQty: openingStock,
          purchasePrice: data.purchasePrice || 0,
          sellingPrice: data.sellingPrice || 0,
        },
      });
      await (prisma as any).stockMovement.create({
        data: {
          hospitalId: auth.hospitalId,
          itemId: data.id,
          batchId: batch.id,
          type: "IN",
          quantity: openingStock,
          source: "OpeningStock",
          notes: `Opening stock for ${data.name}`,
          performedBy: auth.user.userId,
        },
      });
    }

    return successResponse(data, "Item created", 201);
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Item with same name & category already exists", 409);
    return errorResponse(e.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
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

export async function DELETE(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
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
