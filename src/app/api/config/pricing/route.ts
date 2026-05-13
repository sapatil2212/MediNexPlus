import { NextRequest } from "next/server";
import { requireHospitalAdmin, requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { createPricing, findAllPricing, updatePricing, deletePricing } from "../../../../../backend/repositories/pricing.repo";
import { z } from "zod";

const pricingSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["CONSULTATION","PROCEDURE","LAB_TEST","RADIOLOGY","PHARMACY","ROOM_CHARGE","SURGERY","OTHER"]),
  amount: z.number().min(0),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "FINANCE_HEAD", "RECEPTIONIST", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const data = await findAllPricing(auth.hospitalId, searchParams.get("type") || undefined);
    return successResponse(data, "Pricing fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = pricingSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await createPricing({ hospitalId: auth.hospitalId, ...result.data });
    return successResponse(data, "Pricing created", 201);
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function PUT(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return errorResponse("ID is required", 400);
    await updatePricing(id, auth.hospitalId, updateData);
    return successResponse(null, "Pricing updated");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    await deletePricing(id, auth.hospitalId);
    return successResponse(null, "Pricing deleted");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
