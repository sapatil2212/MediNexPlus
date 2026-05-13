import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  createStaff,
  getStaff,
  getStaffStats,
  StaffServiceError,
} from "../../../../../backend/services/staff.service";
import {
  createStaffSchema,
  queryStaffSchema,
} from "../../../../../backend/validations/staff.validation";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("stats") === "true") {
      const stats = await getStaffStats(auth.hospitalId);
      return successResponse(stats, "Staff statistics");
    }

    const queryParams = {
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    const validated = queryStaffSchema.safeParse(queryParams);
    if (!validated.success) {
      return errorResponse("Invalid query parameters", 400, validated.error.issues);
    }

    const result = await getStaff({
      hospitalId: auth.hospitalId,
      ...validated.data,
    });

    return successResponse(result, "Staff fetched");
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error.message || "Failed to fetch staff", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const validated = createStaffSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("Validation failed", 400, validated.error.issues);
    }

    const staff = await createStaff(auth.hospitalId, validated.data);
    return successResponse(staff, "Staff member created successfully", 201);
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error.message || "Failed to create staff member", 500);
  }
}
