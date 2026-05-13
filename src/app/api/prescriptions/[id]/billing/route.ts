import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  generateBill,
  PrescriptionServiceError,
} from "../../../../../../backend/services/prescription.service";
import { generateBillSchema } from "../../../../../../backend/validations/prescription.validation";

export const dynamic = "force-dynamic";

// POST /api/prescriptions/[id]/billing — generate bill from prescription
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "STAFF", "RECEPTIONIST", "DOCTOR", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = generateBillSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const bill = await generateBill(
      params.id,
      auth.hospitalId,
      result.data.discount,
      result.data.tax,
      result.data.notes
    );
    return successResponse(bill, "Bill generated");
  } catch (e: any) {
    if (e instanceof PrescriptionServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
