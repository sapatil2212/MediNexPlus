import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import prisma from "../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

const px = prisma as any;
const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "DEPT_HEAD", "SUB_DEPT_HEAD"];

/**
 * DELETE /api/appointments/[id]/hard-delete
 * Permanently removes a single appointment and all of its directly linked records:
 *  - followUps (for this appointment)
 *  - prescription + prescriptionWorkflow (for this appointment)
 *  - procedureRecords (for this appointment)
 *  - treatmentSessions (for this appointment)
 * Bills linked via prescriptionId are NOT deleted (only unlinked) to preserve financial records.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const appt = await px.appointment.findFirst({
      where: { id, hospitalId: auth.hospitalId },
      include: {
        patient: { select: { name: true, patientId: true } },
        doctor:  { select: { name: true } },
        prescription: { select: { id: true } },
      },
    });

    if (!appt) return errorResponse("Appointment not found", 404);

    await px.$transaction(async (tx: any) => {
      // 1. Follow-ups linked to this appointment
      await tx.followUp.deleteMany({ where: { appointmentId: id } });

      // 2. Prescription linked to this appointment
      if (appt.prescription?.id) {
        const rxId = appt.prescription.id;
        // Unlink bill (do NOT delete — preserve financial records)
        await tx.bill.updateMany({
          where: { prescriptionId: rxId },
          data:  { prescriptionId: null },
        });
        // Delete workflow entries
        await tx.prescriptionWorkflow.deleteMany({ where: { prescriptionId: rxId } });
        // Delete prescription
        await tx.prescription.delete({ where: { id: rxId } });
      }

      // 3. Procedure records linked to this appointment
      await tx.procedureRecord.deleteMany({ where: { appointmentId: id } });

      // 4. Treatment sessions linked to this appointment
      await tx.treatmentSession.deleteMany({ where: { appointmentId: id } });

      // 5. Delete the appointment itself
      await tx.appointment.delete({ where: { id } });
    });

    return successResponse(
      {
        id,
        patientName: appt.patient?.name,
        patientId:   appt.patient?.patientId,
        doctorName:  appt.doctor?.name,
      },
      "Appointment permanently deleted"
    );
  } catch (e: any) {
    console.error("Hard-delete appointment error:", e);
    return errorResponse(e.message || "Failed to delete appointment", 500);
  }
}
