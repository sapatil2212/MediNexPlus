import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  toggleStatus,
  DoctorServiceError,
} from "../../../../../../backend/services/doctor.service";
import {
  updateDoctorSchema,
  toggleDoctorStatusSchema,
} from "../../../../../../backend/validations/doctor.validation";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/config/doctors/[id] - Get single doctor with full details
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const doctor = await getDoctorById(id, auth.hospitalId);
    return successResponse(doctor, "Doctor fetched");
  } catch (e: any) {
    if (e instanceof DoctorServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/config/doctors/[id] - Update doctor
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const result = updateDoctorSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const doctor = await updateDoctor(id, auth.hospitalId, result.data);
    return successResponse(doctor, "Doctor updated successfully");
  } catch (e: any) {
    if (e instanceof DoctorServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    if (e.code === "P2002") {
      return errorResponse("Doctor with this email already exists", 409);
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/config/doctors/[id] - Toggle status (isActive/isAvailable)
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const result = toggleDoctorStatusSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    if (result.data.isActive === undefined && result.data.isAvailable === undefined) {
      return errorResponse("Provide isActive or isAvailable to toggle", 400);
    }

    const response = await toggleStatus(id, auth.hospitalId, result.data);
    return successResponse(response, "Doctor status updated");
  } catch (e: any) {
    if (e instanceof DoctorServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/config/doctors/[id] - Delete doctor
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const response = await deleteDoctor(id, auth.hospitalId);
    return successResponse(response, "Doctor deleted successfully");
  } catch (e: any) {
    if (e instanceof DoctorServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}
