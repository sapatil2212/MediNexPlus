import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getAllRooms, createRoomService, RoomServiceError,
} from "../../../../../backend/services/room.service";
import { z } from "zod";

const createSchema = z.object({
  wardId: z.string().min(1, "Ward is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.enum(["SHARED","PRIVATE","SEMI_PRIVATE","ICU","ISOLATION"]).optional(),
  capacity: z.number().int().min(1).optional(),
  description: z.string().nullish(),
});

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const wardId = req.nextUrl.searchParams.get("wardId") || undefined;
    const data = await getAllRooms(auth.hospitalId, wardId);
    return successResponse(data, "Rooms fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await createRoomService(auth.hospitalId, result.data);
    return successResponse(data, "Room created", 201);
  } catch (e: any) {
    if (e instanceof RoomServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message || "Server error", 500);
  }
}
