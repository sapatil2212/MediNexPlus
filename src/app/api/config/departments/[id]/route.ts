import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  toggleStatus,
  handleDeptCredentialsOnSave,
  DepartmentServiceError,
} from "../../../../../../backend/services/department.service";
import { updateDepartmentSchema, toggleStatusSchema } from "../../../../../../backend/validations/department.validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/config/departments/[id]
 * Fetch a single department by ID with full relations
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const department = await getDepartmentById(id, auth.hospitalId);
    return successResponse(department, "Department fetched");
  } catch (e: any) {
    if (e instanceof DepartmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

/**
 * PUT /api/config/departments/[id]
 * Update a department by ID
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = updateDepartmentSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    // Update department
    const department = await updateDepartment(id, auth.hospitalId, result.data);

    // Auto-create/update DEPT_HEAD User if loginEmail + loginPassword provided
    const loginEmail = (result.data as any).loginEmail;
    const loginPassword = (result.data as any).loginPassword;
    let credentialWarning: string | null = null;
    if (loginEmail && loginPassword) {
      try {
        await handleDeptCredentialsOnSave(id, auth.hospitalId, loginEmail, loginPassword, department.name);
      } catch (credErr: any) {
        console.error("[DeptCredentials] Auto-save failed:", credErr.message, credErr.code);
        credentialWarning = `Department saved but login setup failed: ${credErr.message}`;
      }
    }

    return successResponse(
      { ...department, credentialWarning },
      credentialWarning ? `Department updated (Warning: ${credentialWarning})` : "Department updated"
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
 * PATCH /api/config/departments/[id]
 * Toggle department status (isActive)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = toggleStatusSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    // Toggle status
    const updated = await toggleStatus(id, auth.hospitalId, result.data.isActive);
    return successResponse(updated, `Department ${result.data.isActive ? "activated" : "deactivated"}`);
  } catch (e: any) {
    if (e instanceof DepartmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

/**
 * DELETE /api/config/departments/[id]
 * Delete a department by ID
 * Query params: 
 *   ?force=true - force delete department only, keep related items
 *   ?cascade=true - cascade delete department and all related items
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";
    const cascade = searchParams.get("cascade") === "true";

    const result = await deleteDepartment(id, auth.hospitalId, force, cascade);
    return successResponse(result, "Department deleted");
  } catch (e: any) {
    if (e instanceof DepartmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}
