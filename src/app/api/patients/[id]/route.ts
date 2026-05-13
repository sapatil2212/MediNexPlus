import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getPatientById,
  updatePatient,
  deletePatientForce,
  PatientServiceError,
} from "../../../../../backend/services/patient.service";
import { updatePatientSchema } from "../../../../../backend/validations/patient.validation";

const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR", "SUB_DEPT_HEAD", "DEPT_HEAD"];

// GET /api/patients/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const patient = await getPatientById(params.id, auth.hospitalId);
    return successResponse(patient, "Patient fetched");
  } catch (e: any) {
    if (e instanceof PatientServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/patients/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = updatePatientSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const patient = await updatePatient(params.id, auth.hospitalId, result.data);
    return successResponse(patient, "Patient updated");
  } catch (e: any) {
    if (e instanceof PatientServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/patients/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const result = await deletePatientForce(params.id, auth.hospitalId);
    return successResponse(result, "Patient and all history deleted");
  } catch (e: any) {
    if (e instanceof PatientServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
