import { NextRequest } from "next/server";
import { requireHospitalAdmin, requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  createDepartment,
  getDepartments,
  getDepartmentsForDropdown,
  seedDefaultDepartments,
  generateUniqueCode,
  handleDeptCredentialsOnSave,
  DepartmentServiceError,
} from "../../../../../backend/services/department.service";
import {
  createSubDepartment,
  findAllSubDepartments,
  updateSubDepartment,
  deleteSubDepartment,
} from "../../../../../backend/repositories/department.repo";
import {
  createDepartmentSchema,
  queryDepartmentSchema,
} from "../../../../../backend/validations/department.validation";
import { z } from "zod";
import { DepartmentType } from "@prisma/client";

const DROPDOWN_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR", "SUB_DEPT_HEAD"];

// Sub-department validation schema
const subDeptSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["PHARMACY", "PATHOLOGY", "RADIOLOGY", "PROCEDURE", "LABORATORY", "OTHER"]),
  departmentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/config/departments
 * Fetch departments with pagination, search, and filters
 * Query params: search, type, isActive, page, limit, sortBy, sortOrder
 * Special: ?sub=true for sub-departments, ?simple=true for dropdown list
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const simple = searchParams.get("simple");

  // Simple list for dropdowns — allow broader roles (booking, etc.)
  if (simple === "true") {
    const dropAuth = await requireRole(req, DROPDOWN_ROLES);
    if (dropAuth.error) return dropAuth.error;
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const data = await getDepartmentsForDropdown(dropAuth.hospitalId, activeOnly);
    return successResponse(data, "Departments fetched");
  }

  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const sub = searchParams.get("sub");

    // Handle sub-departments
    if (sub === "true") {
      const data = await findAllSubDepartments(auth.hospitalId);
      return successResponse(data, "Sub-departments fetched");
    }

    // Parse and validate query parameters
    const queryParams = {
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    const parsed = queryDepartmentSchema.safeParse(queryParams);
    if (!parsed.success) {
      return errorResponse("Invalid query parameters", 400, parsed.error.issues);
    }

    const result = await getDepartments({
      hospitalId: auth.hospitalId,
      search: parsed.data.search,
      type: parsed.data.type as DepartmentType | undefined,
      isActive: parsed.data.isActive,
      page: parsed.data.page,
      limit: parsed.data.limit,
      sortBy: parsed.data.sortBy,
      sortOrder: parsed.data.sortOrder,
    });

    return successResponse(result, "Departments fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

/**
 * POST /api/config/departments
 * Create a new department or sub-department
 * Special: ?sub=true for sub-departments
 * Special: ?action=seed to seed default departments
 * Special: ?action=generate-code&name=X to generate unique code
 */
export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const sub = searchParams.get("sub");
    const action = searchParams.get("action");

    // Handle special actions
    if (action === "seed") {
      const body = await req.json().catch(() => ({}));
      const result = await seedDefaultDepartments(
        auth.hospitalId,
        body.overwrite === true
      );
      return successResponse(result, "Default departments seeded");
    }

    if (action === "generate-code") {
      const name = searchParams.get("name");
      if (!name) {
        return errorResponse("Name is required for code generation", 400);
      }
      const code = await generateUniqueCode(auth.hospitalId, name);
      return successResponse({ code }, "Code generated");
    }

    const body = await req.json();

    // Handle sub-departments
    if (sub === "true") {
      const result = subDeptSchema.safeParse(body);
      if (!result.success) {
        return errorResponse("Validation failed", 400, result.error.issues);
      }
      const data = await createSubDepartment({
        hospitalId: auth.hospitalId,
        ...result.data,
      });
      return successResponse(data, "Sub-department created", 201);
    }

    // Validate department input
    const result = createDepartmentSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    // Create department using service
    const data = await createDepartment(auth.hospitalId, result.data);

    // Auto-create DEPT_HEAD User if loginEmail + loginPassword provided
    let credentialWarning: string | null = null;
    if (result.data.loginEmail && result.data.loginPassword) {
      try {
        await handleDeptCredentialsOnSave(
          data.id,
          auth.hospitalId,
          result.data.loginEmail,
          result.data.loginPassword,
          data.name
        );
      } catch (credErr: any) {
        console.error("[DeptCredentials] Auto-create failed:", credErr.message, credErr.code);
        credentialWarning = `Department created but login setup failed: ${credErr.message}`;
      }
    }

    return successResponse(
      { ...data, credentialWarning },
      credentialWarning ? `Department created (Warning: ${credentialWarning})` : "Department created",
      201
    );
  } catch (e: any) {
    if (e instanceof DepartmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    if (e.code === "P2002") {
      return errorResponse("Department with this code already exists", 409);
    }
    return errorResponse(e.message, 500);
  }
}

/**
 * PUT /api/config/departments
 * Update sub-department (for backwards compatibility)
 * Note: For departments, use PUT /api/config/departments/[id]
 */
export async function PUT(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, sub, ...updateData } = body;
    if (!id) return errorResponse("ID is required", 400);

    // Only handle sub-departments here for backwards compatibility
    if (sub) {
      await updateSubDepartment(id, auth.hospitalId, updateData);
      return successResponse(null, "Sub-department updated");
    }

    // Redirect to use the [id] route for departments
    return errorResponse(
      "Use PUT /api/config/departments/[id] for department updates",
      400
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

/**
 * DELETE /api/config/departments
 * Delete sub-department by ID query param
 * Note: For departments, use DELETE /api/config/departments/[id]
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const sub = searchParams.get("sub");
    if (!id) return errorResponse("ID is required", 400);

    // Only handle sub-departments here
    if (sub === "true") {
      await deleteSubDepartment(id, auth.hospitalId);
      return successResponse(null, "Sub-department deleted");
    }

    // Redirect to use the [id] route for departments
    return errorResponse(
      "Use DELETE /api/config/departments/[id] for department deletion",
      400
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
