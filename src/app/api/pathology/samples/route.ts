import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

function generateBarcode(hospitalId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BC-${ts}-${rand}`;
}

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    let hospitalId: string;
    let subDeptId: string | undefined;

    if (user!.role === "SUB_DEPT_HEAD") {
      const profile = await getSubDeptProfile(user!.userId);
      hospitalId = (profile as any).hospitalId;
      subDeptId = (profile as any).id;
    } else {
      const u = await (prisma as any).user.findUnique({ where: { id: user!.userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
    }

    const status = req.nextUrl.searchParams.get("status") || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

    const where: any = { hospitalId };
    if (status) where.status = status;
    if (subDeptId) where.order = { subDepartmentId: subDeptId };

    const samples = await (prisma as any).labSample.findMany({
      where,
      include: {
        order: {
          select: {
            id: true, orderNo: true, priority: true, status: true,
            patient: { select: { id: true, name: true, patientId: true, phone: true } },
            items: {
              select: { id: true, status: true, test: { select: { name: true, specimenType: true } }, panel: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { collectedAt: "desc" },
      take: limit,
    });

    return successResponse(samples);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    let hospitalId: string;

    if (user!.role === "SUB_DEPT_HEAD") {
      const profile = await getSubDeptProfile(user!.userId);
      hospitalId = (profile as any).hospitalId;
    } else {
      const u = await (prisma as any).user.findUnique({ where: { id: user!.userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
    }

    const body = await req.json();
    const { orderId, specimenType, collectedBy, notes, customBarcode } = body;

    if (!orderId) return errorResponse("Order ID required", 400);

    const order = await (prisma as any).labOrder.findUnique({ where: { id: orderId }, include: { sample: true } });
    if (!order) return errorResponse("Order not found", 404);
    if (order.sample) return errorResponse("Sample already collected for this order", 409);

    const barcodeId = customBarcode || generateBarcode(hospitalId);

    const [sample] = await Promise.all([
      (prisma as any).labSample.create({
        data: {
          orderId, hospitalId, barcodeId,
          specimenType: specimenType || "BLOOD",
          collectedBy: collectedBy || "Lab Staff",
          notes,
        },
        include: { order: { select: { orderNo: true, patient: { select: { name: true, patientId: true } } } } },
      }),
      (prisma as any).labOrder.update({
        where: { id: orderId },
        data: { status: "SAMPLE_COLLECTED" },
      }),
    ]);

    return successResponse(sample);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    const body = await req.json();
    const { sampleId, status, receivedBy, rejectionReason, notes } = body;

    if (!sampleId) return errorResponse("Sample ID required", 400);

    const sample = await (prisma as any).labSample.update({
      where: { id: sampleId },
      data: {
        status,
        ...(receivedBy && { receivedBy, receivedAt: new Date() }),
        ...(rejectionReason && { rejectionReason }),
        ...(notes && { notes }),
      },
    });

    if (status === "IN_PROCESS") {
      await (prisma as any).labOrder.update({
        where: { id: sample.orderId },
        data: { status: "IN_PROCESS" },
      });
    } else if (status === "REJECTED") {
      await (prisma as any).labOrder.update({
        where: { id: sample.orderId },
        data: { status: "CANCELLED" },
      });
    }

    return successResponse(sample);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}
