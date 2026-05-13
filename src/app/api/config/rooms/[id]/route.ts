import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getRoomById, updateRoomService, deleteRoomService, RoomServiceError,
} from "../../../../../../backend/services/room.service";
import { z } from "zod";

const updateSchema = z.object({
  roomNumber: z.string().min(1).optional(),
  roomType: z.enum(["SHARED","PRIVATE","SEMI_PRIVATE","ICU","ISOLATION"]).optional(),
  capacity: z.number().int().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const data = await getRoomById(params.id, auth.hospitalId);
    return successResponse(data, "Room fetched");
  } catch (e: any) {
    if (e instanceof RoomServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await updateRoomService(params.id, auth.hospitalId, result.data);
    return successResponse(data, "Room updated");
  } catch (e: any) {
    if (e instanceof RoomServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    await deleteRoomService(params.id, auth.hospitalId);
    return successResponse(null, "Room deleted");
  } catch (e: any) {
    if (e instanceof RoomServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message, 500);
  }
}
