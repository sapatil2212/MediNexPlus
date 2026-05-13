import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getPrescriptionById,
  PrescriptionServiceError,
} from "../../../../../../backend/services/prescription.service";
import { sendPrescriptionEmail } from "../../../../../../backend/utils/mailer";
import prisma from "../../../../../../backend/config/db";

const px = prisma as any;

export const dynamic = "force-dynamic";

// POST /api/prescriptions/[id]/email — email prescription to patient
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["DOCTOR", "HOSPITAL_ADMIN", "STAFF", "RECEPTIONIST"]);
  if (auth.error) return auth.error;
  try {
    const rx = await getPrescriptionById(params.id, auth.hospitalId);

    if (!rx.patient?.email) {
      return errorResponse("Patient does not have an email address on file", 400);
    }

    // Get hospital settings for name
    const settings = await px.hospitalSettings.findFirst({
      where: { hospitalId: auth.hospitalId },
    });
    const hospitalName = settings?.hospitalName || "Hospital";

    await sendPrescriptionEmail({
      to: rx.patient.email,
      patientName: rx.patient.name,
      prescriptionNo: rx.prescriptionNo,
      doctorName: rx.doctor?.name || "Doctor",
      doctorSpecialization: rx.doctor?.specialization || "",
      departmentName: rx.doctor?.department?.name || "General",
      diagnosis: rx.diagnosis || "",
      medications: rx.medications || "[]",
      labTests: rx.labTests || "[]",
      advice: rx.advice || "",
      followUpDate: rx.followUpDate ? new Date(rx.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null,
      hospitalName,
      date: new Date(rx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    });

    return successResponse(null, "Prescription emailed to patient");
  } catch (e: any) {
    if (e instanceof PrescriptionServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
