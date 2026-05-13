import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;

/**
 * GET /api/pharmacy/suppliers
 * List suppliers — accessible by SUB_DEPT_HEAD, DEPT_HEAD, HOSPITAL_ADMIN, STAFF
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit  = parseInt(searchParams.get("limit") || "100");

    const where: any = {
      hospitalId: auth.hospitalId,
      isActive: true,
    };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
        { gstNumber: { contains: search } },
      ];
    }

    const suppliers = await px.supplier.findMany({
      where,
      select: {
        id: true, name: true, code: true, contactPerson: true,
        phone: true, email: true, gstNumber: true, city: true, state: true,
        isActive: true, paymentTerms: true, isPreferred: true,
        _count: { select: { purchases: true } },
      },
      orderBy: [{ isPreferred: "desc" }, { name: "asc" }],
      take: limit,
    });

    return successResponse(suppliers, "Suppliers fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch suppliers", 500);
  }
}

/**
 * POST /api/pharmacy/suppliers
 * Create a supplier — SUB_DEPT_HEAD or HOSPITAL_ADMIN
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { name, contactPerson, phone, email, gstNumber, address1, city, state, paymentTerms } = body;

    if (!name) return errorResponse("Supplier name is required", 400);

    const supplier = await px.supplier.create({
      data: {
        hospitalId: auth.hospitalId,
        name,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        gstNumber: gstNumber || null,
        address1: address1 || null,
        city: city || null,
        state: state || null,
        paymentTerms: paymentTerms || "Immediate",
        isActive: true,
      },
    });

    return successResponse(supplier, "Supplier created");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to create supplier", 500);
  }
}

/**
 * PUT /api/pharmacy/suppliers
 * Update supplier — body: { id, ...fields }
 */
export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return errorResponse("id is required", 400);

    const supplier = await px.supplier.findFirst({
      where: { id, hospitalId: auth.hospitalId },
    });
    if (!supplier) return errorResponse("Supplier not found", 404);

    const updated = await px.supplier.update({
      where: { id },
      data: updateData,
    });

    return successResponse(updated, "Supplier updated");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update supplier", 500);
  }
}

/**
 * DELETE /api/pharmacy/suppliers?id=
 * Soft-delete a supplier — SUB_DEPT_HEAD or HOSPITAL_ADMIN
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("id is required", 400);

    const existing = await px.supplier.findFirst({ where: { id, hospitalId: auth.hospitalId } });
    if (!existing) return errorResponse("Supplier not found", 404);

    await px.supplier.update({ where: { id }, data: { isActive: false } });

    return successResponse(null, "Supplier deleted");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete supplier", 500);
  }
}
