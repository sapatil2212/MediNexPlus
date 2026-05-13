import { NextRequest } from "next/server";
import { requireHospitalAdmin, requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import * as service from "../../../../../backend/services/central-inventory.service";

const INV_READ_ROLES = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"];

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, INV_READ_ROLES);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      hospitalId: auth.hospitalId,
      status: searchParams.get("status") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };
    const data = await service.getReturns(params);
    return successResponse(data, "Returns fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    if (!body.fromLocationId || !body.toLocationId || !body.itemId || !body.quantity) {
      return errorResponse("fromLocationId, toLocationId, itemId, and quantity are required", 400);
    }

    const data = await service.createReturn(auth.hospitalId, {
      ...body,
      requestedBy: auth.user.userId,
    });
    return successResponse(data, "Return request created", 201);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, action } = body;
    if (!id || !action) return errorResponse("ID and action are required", 400);

    const approvedBy = auth.user.userId;

    if (action === "approve") {
      const data = await service.approveReturn(id, auth.hospitalId, approvedBy);
      return successResponse(data, "Return approved and stock restored");
    } else if (action === "reject") {
      const data = await service.rejectReturn(id, auth.hospitalId, approvedBy);
      return successResponse(data, "Return rejected");
    }

    return errorResponse("Invalid action. Use 'approve' or 'reject'", 400);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
