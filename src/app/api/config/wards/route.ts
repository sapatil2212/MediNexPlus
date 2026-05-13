import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getAllWards, createWardService, updateWardService, deleteWardService, WardServiceError,
} from "../../../../../backend/services/ward.service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["GENERAL","PRIVATE","SEMI_PRIVATE","ICU","NICU","PICU","EMERGENCY","MATERNITY","ISOLATION"]),
  floor: z.string().nullish(),
  description: z.string().nullish(),
});

const updateSchema = createSchema.partial().extend({ isActive: z.boolean().optional() });

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const data = await getAllWards(auth.hospitalId);
    return successResponse(data, "Wards fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await createWardService(auth.hospitalId, result.data);
    return successResponse(data, "Ward created", 201);
  } catch (e: any) {
    if (e instanceof WardServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message || "Server error", 500);
  }
}
