import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { getSubDeptProfile } from "../../../../../../backend/services/subdepartment.service";
import { recalculateBill } from "../../../../../../backend/services/billing.service";
import prisma from "../../../../../../backend/config/db";

// PUT /api/subdept/records/[id] - Update procedure record
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const hospitalId = (profile as any).hospitalId;
    const subDeptId = (profile as any).id;

    const body = await req.json();
    const { amount, performedBy, status, notes } = body;

    // Verify the record belongs to this subdepartment
    const existing = await (prisma as any).procedureRecord.findFirst({
      where: { id: params.id, hospitalId, subDepartmentId: subDeptId }
    });

    if (!existing) return errorResponse("Record not found", 404);

    const newAmount = amount !== undefined ? parseFloat(amount) : undefined;

    // Update the record
    const updated = await (prisma as any).procedureRecord.update({
      where: { id: params.id },
      data: {
        ...(newAmount !== undefined && { amount: newAmount }),
        ...(performedBy !== undefined && { performedBy }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true } },
        procedure: { select: { id: true, name: true, type: true } },
      }
    });

    // ── Sync BillItem if amount changed ──────────────────────────────────────
    if (newAmount !== undefined && newAmount !== existing.amount) {
      // Find the bill linked to this appointment (or directly by procedureRecordId)
      const bill = existing.appointmentId
        ? await (prisma as any).bill.findFirst({ where: { visitId: existing.appointmentId, hospitalId } })
        : null;

      if (bill) {
        // Find BillItem for this procedure (matched by procedureId as referenceId)
        const billItem = await (prisma as any).billItem.findFirst({
          where: { billId: bill.id, type: "PROCEDURE", referenceId: existing.procedureId }
        });

        if (billItem) {
          await (prisma as any).billItem.update({
            where: { id: billItem.id },
            data: { unitPrice: newAmount, amount: newAmount * (billItem.quantity || 1) },
          });
          await recalculateBill(bill.id, hospitalId);
        }
      }
    }

    return successResponse(updated, "Record updated successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update record", 500);
  }
}

// DELETE /api/subdept/records/[id] - Delete procedure record
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const hospitalId = (profile as any).hospitalId;
    const subDeptId = (profile as any).id;

    // Verify the record belongs to this subdepartment
    const existing = await (prisma as any).procedureRecord.findFirst({
      where: { id: params.id, hospitalId, subDepartmentId: subDeptId }
    });

    if (!existing) return errorResponse("Record not found", 404);

    await (prisma as any).procedureRecord.delete({ where: { id: params.id } });

    return successResponse(null, "Record deleted successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to delete record", 500);
  }
}
