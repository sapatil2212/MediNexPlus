import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getPrescriptionById,
  updatePrescriptionData,
  PrescriptionServiceError,
} from "../../../../../backend/services/prescription.service";
import { updatePrescriptionSchema } from "../../../../../backend/validations/prescription.validation";

const ALLOWED = ["DOCTOR", "HOSPITAL_ADMIN", "STAFF", "RECEPTIONIST"];

export const dynamic = "force-dynamic";

// GET /api/prescriptions/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const rx = await getPrescriptionById(params.id, auth.hospitalId);
    return successResponse(rx, "Prescription fetched");
  } catch (e: any) {
    if (e instanceof PrescriptionServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/prescriptions/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["DOCTOR", "HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = updatePrescriptionSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const rx = await updatePrescriptionData(params.id, auth.hospitalId, result.data);
    return successResponse(rx, "Prescription updated");
  } catch (e: any) {
    if (e instanceof PrescriptionServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/prescriptions/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["DOCTOR", "HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;
  try {
    const { default: prisma } = await import("../../../../../backend/config/db");
    const rx = await (prisma as any).prescription.findUnique({
      where: { id: params.id },
      select: { hospitalId: true },
    });
    if (!rx || rx.hospitalId !== auth.hospitalId) {
      return errorResponse("Prescription not found", 404);
    }
    await (prisma as any).prescription.delete({
      where: { id: params.id },
    });
    return successResponse(null, "Prescription deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
