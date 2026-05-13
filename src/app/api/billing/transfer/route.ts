import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { transferToBilling, BillingServiceError } from "../../../../../backend/services/billing.service";
import { notifyBillingTransfer } from "../../../../../backend/services/notification.service";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "RECEPTIONIST", "STAFF", "DOCTOR", "SUB_DEPT_HEAD"];
export const dynamic = "force-dynamic";

// POST /api/billing/transfer — transfer appointment to billing queue
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (!body.appointmentId) return errorResponse("appointmentId is required", 400);
    const bill = await transferToBilling(body.appointmentId, auth.hospitalId, body.note);
    notifyBillingTransfer(auth.hospitalId, {
      patientName: (bill as any).patient?.name || "Patient",
      billNo: (bill as any).billNo,
    }).catch(() => {});
    return successResponse(bill, "Transferred to billing");
  } catch (e: any) {
    if (e instanceof BillingServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
