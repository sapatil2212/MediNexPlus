import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getWardById, updateWardService, deleteWardService, WardServiceError,
} from "../../../../../../backend/services/ward.service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(["GENERAL","PRIVATE","SEMI_PRIVATE","ICU","NICU","PICU","EMERGENCY","MATERNITY","ISOLATION"]).optional(),
  floor: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const data = await getWardById(params.id, auth.hospitalId);
    return successResponse(data, "Ward fetched");
  } catch (e: any) {
    if (e instanceof WardServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await updateWardService(params.id, auth.hospitalId, result.data);
    return successResponse(data, "Ward updated");
  } catch (e: any) {
    if (e instanceof WardServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    await deleteWardService(params.id, auth.hospitalId);
    return successResponse(null, "Ward deleted");
  } catch (e: any) {
    if (e instanceof WardServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message, 500);
  }
}
