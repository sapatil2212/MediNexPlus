import { NextRequest } from "next/server";
import { requireHospitalAdmin, requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import {
  createSubDepartment,
  getSubDepartments,
  SubDeptServiceError,
} from "../../../../../backend/services/subdepartment.service";
import { createSubDepartmentSchema, querySubDepartmentSchema } from "../../../../../backend/validations/subdepartment.validation";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.HOSPITAL_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.STAFF, Role.SUB_DEPT_HEAD]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    };

    const validated = querySubDepartmentSchema.safeParse(params);
    if (!validated.success) return errorResponse("Invalid query", 400, validated.error.issues);

    const result = await getSubDepartments({ hospitalId: auth.hospitalId, ...validated.data });
    return successResponse(result, "Sub-departments fetched");
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to fetch sub-departments", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const validated = createSubDepartmentSchema.safeParse(body);
    if (!validated.success) return errorResponse("Validation failed", 400, validated.error.issues);

    const subDept = await createSubDepartment(auth.hospitalId, validated.data);
    return successResponse(subDept, "Sub-department created successfully", 201);
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to create sub-department", 500);
  }
}
