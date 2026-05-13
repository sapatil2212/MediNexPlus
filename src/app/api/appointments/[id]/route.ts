import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getAppointmentById,
  updateAppointment,
  AppointmentServiceError,
} from "../../../../../backend/services/appointment.service";
import { updateAppointmentSchema } from "../../../../../backend/validations/appointment.validation";
import { notifyAppointmentStatusChanged } from "../../../../../backend/services/notification.service";
import prisma from "../../../../../backend/config/db";

const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR", "SUB_DEPT_HEAD", "DEPT_HEAD"];

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const px = prisma as any;

// GET /api/appointments/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const appt = await getAppointmentById(id, auth.hospitalId);
    return successResponse(appt, "Appointment fetched");
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/appointments/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await req.json();
    const result = updateAppointmentSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const appt = await updateAppointment(id, auth.hospitalId, result.data);
    if (result.data.status) {
      notifyAppointmentStatusChanged(auth.hospitalId, {
        patientName: (appt as any).patient?.name || "Patient",
        status: result.data.status,
        doctorName: (appt as any).doctor?.name,
      }).catch(() => {});
    }
    return successResponse(appt, "Appointment updated");
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/appointments/[id] — cancel appointment (sets status to CANCELLED, frees the slot)
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const appt = await px.appointment.findFirst({
      where: { id, hospitalId: auth.hospitalId },
      include: { patient: true, doctor: true },
    });
    if (!appt) return errorResponse("Appointment not found", 404);

    await px.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return successResponse(
      { id, patientName: appt.patient?.name, doctorName: appt.doctor?.name },
      "Appointment cancelled and slot freed successfully"
    );
  } catch (e: any) {
    console.error("Cancel appointment error:", e);
    return errorResponse(e.message || "Failed to cancel appointment", 500);
  }
}
