import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";
import { sendAppointmentRescheduled } from "../../../../../backend/utils/mailer";
import { getSettings } from "../../../../../backend/services/config.service";

export const dynamic = "force-dynamic";

// POST /api/appointments/reschedule-email
// Body: { appointmentId } — sends reschedule confirmation email to the patient
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "SUB_DEPT_HEAD", "DOCTOR"]);
  if (auth.error) return auth.error;

  try {
    const { appointmentId } = await req.json();
    if (!appointmentId) return errorResponse("appointmentId is required", 400);

    const appt = await (prisma as any).appointment.findFirst({
      where: { id: appointmentId, hospitalId: auth.hospitalId },
      include: {
        patient:    { select: { name: true, patientId: true, email: true, phone: true } },
        doctor:     { select: { name: true } },
        department: { select: { name: true } },
        hospital:   { select: { name: true } },
      },
    });

    if (!appt) return errorResponse("Appointment not found", 404);

    const email = appt.patient?.email;
    if (!email) return errorResponse("Patient has no email address on record", 422);

    const settings = await getSettings(auth.hospitalId);
    const hospitalLogo = settings?.logo || null;

    await sendAppointmentRescheduled({
      to:              email,
      patientName:     appt.patient.name,
      patientId:       appt.patient.patientId,
      doctorName:      appt.doctor?.name   ?? "Doctor",
      departmentName:  appt.department?.name ?? "Department",
      oldDate:         new Date(appt.appointmentDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      oldTimeSlot:     appt.timeSlot,
      newDate:         new Date(appt.appointmentDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      newTimeSlot:     appt.timeSlot,
      tokenNumber:     appt.tokenNumber,
      type:            appt.type,
      hospitalName:    appt.hospital?.name ?? "Hospital",
      hospitalLogo:    hospitalLogo,
    });

    return successResponse({ sent: true }, "Reschedule email sent successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
