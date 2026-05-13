import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../../backend/config/db";

const px = prisma as any;

/**
 * GET /api/pharmacy/counter-sale/history
 * Returns recent counter sales (bills tagged with PHARMACY_COUNTER_SALE)
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF, Role.RECEPTIONIST]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const bills = await px.bill.findMany({
      where: {
        hospitalId: auth.hospitalId,
        notes: { contains: "PHARMACY_COUNTER_SALE" },
      },
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const history = bills.map((bill: any) => {
      let items = [];
      try { items = typeof bill.items === "string" ? JSON.parse(bill.items) : bill.items; } catch {}
      return {
        id: bill.id,
        billNo: bill.billNo,
        patient: bill.patient,
        items,
        paymentMethod: bill.paymentMethod,
        transactionId: bill.transactionId,
        total: bill.total,
        discount: bill.discount,
        status: bill.status,
        createdAt: bill.createdAt,
      };
    });

    return successResponse(history, "Counter sale history fetched");
  } catch (err: any) {
    console.error("Counter-sale history error:", err);
    return errorResponse(err.message || "Failed to fetch history", 500);
  }
}
