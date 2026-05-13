import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import prisma from "../../../../../../backend/config/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  try {
    const order = await (prisma as any).labOrder.findUnique({
      where: { id: params.id },
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true, address: true } },
        doctor: { select: { id: true, name: true, specialization: true, qualification: true } },
        items: {
          include: {
            test: true,
            panel: { include: { items: { include: { test: true } } } },
          },
        },
        sample: true,
        report: true,
      },
    });
    if (!order) return errorResponse("Not found", 404);
    return successResponse(order);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    const body = await req.json();
    const { status, priority, clinicalNotes, referralNotes, interpretation, impression, pathologistRemarks, recommendation, verifiedBy, deliveryMode, items } = body;

    const updated = await (prisma as any).labOrder.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(clinicalNotes !== undefined && { clinicalNotes }),
        ...(referralNotes !== undefined && { referralNotes }),
        ...(interpretation !== undefined && { interpretation }),
        ...(impression !== undefined && { impression }),
        ...(pathologistRemarks !== undefined && { pathologistRemarks }),
        ...(recommendation !== undefined && { recommendation }),
      },
    });

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id) {
          await (prisma as any).labOrderItem.update({
            where: { id: item.id },
            data: {
              ...(item.result !== undefined && { result: item.result }),
              ...(item.unit !== undefined && { unit: item.unit }),
              ...(item.normalRange !== undefined && { normalRange: item.normalRange }),
              ...(item.isAbnormal !== undefined && { isAbnormal: item.isAbnormal }),
              ...(item.isCritical !== undefined && { isCritical: item.isCritical }),
              ...(item.status !== undefined && { status: item.status }),
              ...(item.notes !== undefined && { notes: item.notes }),
              ...(item.enteredBy !== undefined && { enteredBy: item.enteredBy, enteredAt: new Date() }),
              ...(item.verifiedBy !== undefined && { verifiedBy: item.verifiedBy, verifiedAt: new Date() }),
            },
          });
        }
      }
    }

    return successResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    await (prisma as any).labOrder.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}
