import { NextRequest } from "next/server";
import { requireHospitalAdmin, requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import * as service from "../../../../../backend/services/central-inventory.service";

const INV_READ_ROLES = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"];

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, INV_READ_ROLES);
  if (auth.error) return auth.error;

  try {
    const data = await service.getLocations(auth.hospitalId);
    return successResponse(data, "Locations fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    if (!body.name || !body.code) return errorResponse("Name and code are required", 400);
    const data = await service.createLocation(auth.hospitalId, body);
    return successResponse(data, "Location created", 201);
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Location code already exists", 409);
    return errorResponse(e.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return errorResponse("ID is required", 400);
    const data = await service.updateLocation(id, auth.hospitalId, updateData);
    return successResponse(data, "Location updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    await service.deleteLocation(id, auth.hospitalId);
    return successResponse(null, "Location deleted");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
