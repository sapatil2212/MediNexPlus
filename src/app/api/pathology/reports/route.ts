import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";
import { sendLabReport } from "../../../../../backend/utils/mailer";

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
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "30");

    const where: any = { hospitalId };
    if (status) where.status = status;
    if (subDeptId) where.order = { subDepartmentId: subDeptId };

    const reports = await (prisma as any).labReport.findMany({
      where,
      include: {
        order: {
          include: {
            patient: { select: { id: true, name: true, patientId: true, phone: true, email: true, gender: true, dateOfBirth: true } },
            doctor: { select: { id: true, name: true, specialization: true, qualification: true } },
            sample: { select: { specimenType: true, barcodeId: true, collectedBy: true, collectedAt: true, receivedAt: true, status: true } },
            items: {
              include: {
                test: { select: { id: true, name: true, unit: true, normalRangeMin: true, normalRangeMax: true, normalRangeText: true, category: true, method: true } },
                panel: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { generatedAt: "desc" },
      take: limit,
    });

    return successResponse(reports);
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
    const { reportId, verifiedBy, notes, items } = body;
    if (!reportId) return errorResponse("Report ID required", 400);

    const report = await (prisma as any).labReport.findUnique({ where: { id: reportId } });
    if (!report) return errorResponse("Report not found", 404);

    const updated = await (prisma as any).labReport.update({
      where: { id: reportId },
      data: {
        ...(verifiedBy !== undefined ? { verifiedBy } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    // Update individual test results if provided
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.id) continue;
        await (prisma as any).labOrderItem.update({
          where: { id: item.id },
          data: {
            result: item.result,
            unit: item.unit,
            normalRange: item.normalRange,
            isAbnormal: !!item.isAbnormal,
            isCritical: !!item.isCritical,
            notes: item.notes || null,
            enteredBy: item.enteredBy || null,
          },
        });
      }
    }

    return successResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update report", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    const reportId = req.nextUrl.searchParams.get("reportId");
    if (!reportId) return errorResponse("Report ID required", 400);

    const report = await (prisma as any).labReport.findUnique({ where: { id: reportId }, select: { orderId: true } });
    if (!report) return errorResponse("Report not found", 404);

    await (prisma as any).labReport.delete({ where: { id: reportId } });

    // Reset order back to RESULT_ENTERED so report can be re-generated
    await (prisma as any).labOrder.update({
      where: { id: report.orderId },
      data: { status: "RESULT_ENTERED" },
    });

    return successResponse({ message: "Report deleted. Order reset to result-entry stage." });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to delete report", 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    const body = await req.json();
    const { orderId, notes, action, deliveryMethod } = body;
    if (!orderId) return errorResponse("Order ID required", 400);

    const order = await (prisma as any).labOrder.findUnique({
      where: { id: orderId },
      include: { report: true, items: true },
    });
    if (!order) return errorResponse("Order not found", 404);

    let hospitalId = order.hospitalId;
    let report: any;

    if (action === "verify") {
      if (!order.report) return errorResponse("Generate report first", 400);
      report = await (prisma as any).labReport.update({
        where: { orderId },
        data: { status: "VERIFIED", verifiedBy: "Pathologist", verifiedAt: new Date() },
      });
      await (prisma as any).labOrder.update({ where: { id: orderId }, data: { status: "VERIFIED" } });
    } else if (action === "deliver") {
      if (!order.report) return errorResponse("Report not ready", 400);
      report = await (prisma as any).labReport.update({
        where: { orderId },
        data: { status: "DELIVERED", deliveredAt: new Date(), deliveryMethod: deliveryMethod || "PORTAL" },
      });
      await (prisma as any).labOrder.update({ where: { id: orderId }, data: { status: "DELIVERED" } });
      // Send email to patient if deliveryMethod is EMAIL
      if (deliveryMethod === "EMAIL") {
        try {
          const fullOrder = await (prisma as any).labOrder.findUnique({
            where: { id: orderId },
            include: {
              patient: { select: { name: true, email: true } },
              doctor: { select: { name: true } },
              items: { include: { test: { select: { name: true, unit: true, normalRangeText: true } } } },
              hospital: { select: { name: true } },
            },
          });
          if (fullOrder?.patient?.email) {
            await sendLabReport({
              to: fullOrder.patient.email,
              patientName: fullOrder.patient.name,
              orderNo: fullOrder.orderNo,
              hospitalName: fullOrder.hospital?.name || "Hospital",
              doctorName: fullOrder.doctor?.name,
              reportDate: new Date().toLocaleDateString("en-IN"),
              items: (fullOrder.items || []).map((i: any) => ({
                testName: i.test?.name || i.panel?.name || "—",
                result: i.result || "Pending",
                unit: i.unit || i.test?.unit || "",
                normalRange: i.normalRange || i.test?.normalRangeText || "",
                isAbnormal: !!i.isAbnormal,
                isCritical: !!i.isCritical,
              })),
            });
          }
        } catch (emailErr: any) {
          console.error("[LabReport] Email failed (non-fatal):", emailErr.message);
        }
      }
    } else {
      if (order.report) {
        report = await (prisma as any).labReport.update({
          where: { orderId },
          data: { notes, generatedAt: new Date(), status: "DRAFT" },
        });
      } else {
        report = await (prisma as any).labReport.create({
          data: { orderId, hospitalId, notes, status: "DRAFT" },
        });
      }
      await (prisma as any).labOrder.update({ where: { id: orderId }, data: { status: "REPORTED" } });

      const allResultsEntered = order.items.every((i: any) => i.result || i.status === "CANCELLED");
      if (!allResultsEntered) {
        return errorResponse("All test results must be entered before generating report", 400);
      }
    }

    return successResponse(report);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}
