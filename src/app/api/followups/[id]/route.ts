import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
  FollowUpServiceError,
} from "../../../../../backend/services/followup.service";
import { updateFollowUpSchema } from "../../../../../backend/validations/followup.validation";

const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR"];

// GET /api/followups/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;
  try {
    const followUp = await getFollowUpById(params.id, auth.hospitalId);
    return successResponse(followUp, "Follow-up fetched");
  } catch (e: any) {
    if (e instanceof FollowUpServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/followups/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = updateFollowUpSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const followUp = await updateFollowUp(params.id, auth.hospitalId, result.data);
    return successResponse(followUp, "Follow-up updated");
  } catch (e: any) {
    if (e instanceof FollowUpServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/followups/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;
  try {
    const result = await deleteFollowUp(params.id, auth.hospitalId);
    return successResponse(result, "Follow-up deleted");
  } catch (e: any) {
    if (e instanceof FollowUpServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
