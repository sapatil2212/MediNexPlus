import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  advanceWorkflow,
  PrescriptionServiceError,
} from "../../../../../../backend/services/prescription.service";
import { workflowUpdateSchema } from "../../../../../../backend/validations/prescription.validation";

export const dynamic = "force-dynamic";

// PATCH /api/prescriptions/[id]/workflow — update a workflow step
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["DOCTOR", "HOSPITAL_ADMIN", "SUB_DEPT_HEAD", "STAFF"]);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = workflowUpdateSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const rx = await advanceWorkflow(
      params.id,
      auth.hospitalId,
      result.data.workflowId,
      result.data.status,
      result.data.notes,
      result.data.completedBy,
      result.data.charges,
      result.data.totalCharge
    );
    return successResponse(rx, "Workflow updated");
  } catch (e: any) {
    if (e instanceof PrescriptionServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
