import { NextRequest } from "next/server";
import { requireHospitalAdmin, requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  createDoctor,
  getDoctors,
  getDoctorsForDropdown,
  getDoctorStats,
  DoctorServiceError,
} from "../../../../../backend/services/doctor.service";
import {
  createDoctorSchema,
  queryDoctorSchema,
} from "../../../../../backend/validations/doctor.validation";

const DROPDOWN_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR", "SUB_DEPT_HEAD"];
const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/config/doctors - List doctors with pagination and filters
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Simple list for dropdowns — allow broader roles (booking, etc.)
    if (searchParams.get("simple") === "true") {
      const dropAuth = await requireRole(req, DROPDOWN_ROLES);
      if (dropAuth.error) return dropAuth.error;
      const activeOnly = searchParams.get("activeOnly") !== "false";
      const deptFilter = searchParams.get("departmentId") || undefined;
      let data = await getDoctorsForDropdown(dropAuth.hospitalId, activeOnly);
      if (deptFilter) data = data.filter((d: any) => d.departmentId === deptFilter);
      return successResponse(data, "Doctors fetched");
    }

    const auth = await requireRole(req, HR_ROLES);
    if (auth.error) return auth.error;

    // Stats endpoint
    if (searchParams.get("stats") === "true") {
      const stats = await getDoctorStats(auth.hospitalId);
      return successResponse(stats, "Doctor statistics");
    }

    // Parse query parameters
    const queryParams = {
      search: searchParams.get("search") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      isAvailable: searchParams.get("isAvailable") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    const validatedQuery = queryDoctorSchema.safeParse(queryParams);
    if (!validatedQuery.success) {
      return errorResponse("Invalid query parameters", 400, validatedQuery.error.issues);
    }

    const result = await getDoctors({
      hospitalId: auth.hospitalId,
      ...validatedQuery.data,
    });

    return successResponse(result, "Doctors fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Internal server error", 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/config/doctors - Create new doctor
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();

    // Validate request body
    const result = createDoctorSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const doctor = await createDoctor(auth.hospitalId, result.data);
    return successResponse(doctor, "Doctor created successfully", 201);
  } catch (e: any) {
    if (e instanceof DoctorServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    if (e.code === "P2002") {
      return errorResponse("Doctor with this email already exists in your hospital", 409);
    }
    return errorResponse(e.message, 500);
  }
}
