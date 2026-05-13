import { NextRequest } from "next/server";
import { requireRole } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import {
  createOrGetPrescription,
  getPrescriptions,
  PrescriptionServiceError,
} from "../../../../backend/services/prescription.service";
import { createPrescriptionSchema } from "../../../../backend/validations/prescription.validation";

const ALLOWED = ["DOCTOR", "HOSPITAL_ADMIN"];

export const dynamic = "force-dynamic";

// GET /api/prescriptions — list prescriptions
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [...ALLOWED, "STAFF", "RECEPTIONIST"]);
  if (auth.error) return auth.error;

  const url = req.nextUrl.searchParams;
  try {
    const result = await getPrescriptions({
      hospitalId: auth.hospitalId,
      patientId: url.get("patientId") || undefined,
      doctorId: url.get("doctorId") || undefined,
      status: url.get("status") || undefined,
      search: url.get("search") || undefined,
      page: parseInt(url.get("page") || "1"),
      limit: parseInt(url.get("limit") || "20"),
    });
    return successResponse(result, "Prescriptions fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/prescriptions — create or get existing prescription
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = createPrescriptionSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    // Resolve actual Doctor record — userId in JWT ≠ Doctor.id
    const { default: prisma } = await import("../../../../backend/config/db");
    const doctor = await (prisma as any).doctor.findFirst({
      where: { userId: auth.user.userId },
      select: { id: true, hospitalId: true },
    });
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const { prescription, isNew } = await createOrGetPrescription(
      doctor.hospitalId,
      result.data,
      doctor.id
    );
    return successResponse(
      { prescription, isNew },
      isNew ? "Prescription created" : "Existing prescription found",
      isNew ? 201 : 200
    );
  } catch (e: any) {
    if (e instanceof PrescriptionServiceError) {
      return errorResponse(e.message, e.status);
    }
    console.error("Create Prescription Error:", e);
    return errorResponse("Could not create prescription", 500);
  }
}
