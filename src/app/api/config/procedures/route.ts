import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  createProcedure,
  getProcedures,
  SubDeptServiceError,
} from "../../../../../backend/services/subdepartment.service";
import { createProcedureSchema } from "../../../../../backend/validations/subdepartment.validation";

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const data = await getProcedures({
      hospitalId: auth.hospitalId,
      subDepartmentId: searchParams.get("subDepartmentId") || undefined,
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      isActive: searchParams.get("isActive") || undefined,
    });
    return successResponse(data, "Procedures fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch procedures", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const validated = createProcedureSchema.safeParse(body);
    if (!validated.success) return errorResponse("Validation failed", 400, validated.error.issues);
    const proc = await createProcedure(auth.hospitalId, validated.data);
    return successResponse(proc, "Procedure created successfully", 201);
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to create procedure", 500);
  }
}
