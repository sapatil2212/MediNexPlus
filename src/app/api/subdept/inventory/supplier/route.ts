import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import * as service from "../../../../../../backend/services/inventory.service";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
  contactPerson: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  altPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default("India"),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  drugLicense: z.string().optional(),
  fssaiLicense: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  upiId: z.string().optional(),
  paymentTerms: z.string().default("Immediate"),
  creditLimit: z.number().default(0),
  openingBalance: z.number().default(0),
  preferredPaymentMode: z.string().default("Bank Transfer"),
  categoriesSupplied: z.string().optional(),
  brandAssociations: z.string().optional(),
  deliveryLeadTime: z.number().default(0),
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
});

// GET /api/subdept/inventory/supplier - List or get single supplier
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD", "STAFF"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const data = await service.getSupplierById(id, auth.hospitalId);
      if (!data) return errorResponse("Supplier not found", 404);
      return successResponse(data, "Supplier fetched");
    }
    const data = await service.getSuppliers(auth.hospitalId);
    return successResponse(data, "Suppliers fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/subdept/inventory/supplier - Create new supplier
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = supplierSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    
    const data = await service.addSupplier(auth.hospitalId, result.data);
    return successResponse(data, "Supplier created", 201);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/subdept/inventory/supplier - Update supplier
export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return errorResponse("ID is required", 400);
    
    const result = supplierSchema.partial().safeParse(updateData);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    
    const data = await service.updateSupplier(id, auth.hospitalId, result.data);
    return successResponse(data, "Supplier updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/subdept/inventory/supplier - Delete supplier (soft delete)
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    await service.deleteSupplier(id, auth.hospitalId);
    return successResponse(null, "Supplier deleted");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
