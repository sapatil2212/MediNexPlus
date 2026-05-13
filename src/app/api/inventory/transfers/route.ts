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
    const id = searchParams.get("id");
    if (id) {
      const data = await service.getTransferById(id, auth.hospitalId);
      if (!data) return errorResponse("Transfer not found", 404);
      return successResponse(data, "Transfer fetched");
    }
    const params = {
      hospitalId: auth.hospitalId,
      status: searchParams.get("status") || undefined,
      fromLocationId: searchParams.get("fromLocationId") || undefined,
      toLocationId: searchParams.get("toLocationId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };
    const data = await service.getTransfers(params);
    return successResponse(data, "Transfers fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    if (!body.fromLocationId || !body.toLocationId) return errorResponse("From and To locations are required", 400);
    if (!body.items || body.items.length === 0) return errorResponse("At least one item is required", 400);

    const data = await service.createTransfer(auth.hospitalId, {
      ...body,
      requestedBy: auth.user.userId,
    });
    return successResponse(data, "Transfer created", 201);
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
      const data = await service.approveTransfer(id, auth.hospitalId, approvedBy);
      return successResponse(data, "Transfer approved and stock moved");
    } else if (action === "reject") {
      const data = await service.rejectTransfer(id, auth.hospitalId, approvedBy);
      return successResponse(data, "Transfer rejected");
    } else if (action === "cancel") {
      const data = await service.cancelTransfer(id, auth.hospitalId, approvedBy);
      return successResponse(data, "Transfer cancelled and stock reversed");
    } else if (action === "update_items") {
      const { items: updatedItems } = body;
      if (!updatedItems || !Array.isArray(updatedItems) || updatedItems.length === 0) {
        return errorResponse("Items array is required for update_items action", 400);
      }
      const data = await service.updateTransferItems(id, auth.hospitalId, updatedItems, approvedBy);
      return successResponse(data, "Transfer items updated");
    }

    return errorResponse("Invalid action. Use 'approve', 'reject', 'cancel', or 'update_items'", 400);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
