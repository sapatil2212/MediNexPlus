import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import prisma from "../../../../../../backend/config/db";

const ALLOWED_ROLES = ["HOSPITAL_ADMIN"];

export const dynamic = "force-dynamic";

/**
 * DELETE /api/appointments/[id]/delete-complete
 * Deletes the appointment AND the entire patient record with all related data.
 * This is a destructive operation that removes:
 * - The appointment
 * - All patient's appointments
 * - All patient's bills and bill items
 * - All patient's payments
 * - All patient's procedure records
 * - All patient's follow-ups
 * - The patient record itself
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  const { id } = await params;
  const px = prisma as any;

  try {
    // Get the appointment to find the patient
    const appointment = await px.appointment.findFirst({
      where: { id, hospitalId: auth.hospitalId },
      include: { patient: true },
    });

    if (!appointment) {
      return errorResponse("Appointment not found", 404);
    }

    const patientId = appointment.patientId;

    const hid = auth.hospitalId;

    // Delete all related records in a transaction (correct FK order)
    await px.$transaction(async (tx: any) => {
      // ── Visit children first ──
      const visits = await tx.visit.findMany({ where: { patientId, hospitalId: hid }, select: { id: true } });
      const visitIds = visits.map((v: any) => v.id);
      if (visitIds.length > 0) {
        await tx.workflowTask.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.doctorAction.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.visit.deleteMany({ where: { patientId, hospitalId: hid } });
      }

      // ── Prescription children ──
      const prescriptions = await tx.prescription.findMany({ where: { patientId, hospitalId: hid }, select: { id: true } });
      const rxIds = prescriptions.map((p: any) => p.id);
      if (rxIds.length > 0) {
        await tx.prescriptionWorkflow.deleteMany({ where: { prescriptionId: { in: rxIds } } });
        await tx.prescription.deleteMany({ where: { patientId, hospitalId: hid } });
      }

      // ── Bill children ──
      const bills = await tx.bill.findMany({ where: { patientId, hospitalId: hid }, select: { id: true } });
      const billIds = bills.map((b: any) => b.id);
      if (billIds.length > 0) {
        await tx.billItem.deleteMany({ where: { billId: { in: billIds } } });
        await tx.payment.deleteMany({ where: { billId: { in: billIds } } });
        await tx.bill.deleteMany({ where: { patientId, hospitalId: hid } });
      }

      // ── Remaining patient-level records ──
      await tx.procedureRecord.deleteMany({ where: { patientId, hospitalId: hid } });
      await tx.followUp.deleteMany({ where: { patientId, hospitalId: hid } });
      await tx.treatmentPlan.deleteMany({ where: { patientId, hospitalId: hid } });
      await tx.appointment.deleteMany({ where: { patientId, hospitalId: hid } });

      // ── Finally, delete the patient ──
      await tx.patient.delete({ where: { id: patientId } });
    });

    return successResponse(
      { patientId, patientName: appointment.patient?.name },
      "Appointment and complete patient history deleted successfully"
    );
  } catch (e: any) {
    console.error("Delete complete error:", e);
    return errorResponse(e.message || "Failed to delete patient history", 500);
  }
}
