import {
  createRoom, findAllRooms, findRoomById, updateRoom, deleteRoom, checkDuplicateRoomNumber,
} from "../repositories/room.repo";
import { findWardById } from "../repositories/ward.repo";

export class RoomServiceError extends Error {
  constructor(public message: string, public code: string, public status: number = 400) {
    super(message);
    this.name = "RoomServiceError";
  }
}

export const getAllRooms = async (hospitalId: string, wardId?: string) => {
  return findAllRooms(hospitalId, wardId);
};

export const getRoomById = async (id: string, hospitalId: string) => {
  const room = await findRoomById(id, hospitalId);
  if (!room) throw new RoomServiceError("Room not found", "NOT_FOUND", 404);
  return room;
};

export const createRoomService = async (hospitalId: string, data: {
  wardId: string; roomNumber: string; roomType?: string;
  capacity?: number; description?: string | null;
}) => {
  const ward = await findWardById(data.wardId, hospitalId);
  if (!ward) throw new RoomServiceError("Ward not found", "WARD_NOT_FOUND", 404);

  const existing = await checkDuplicateRoomNumber(data.wardId, data.roomNumber);
  if (existing) throw new RoomServiceError(
    `Room ${data.roomNumber} already exists in this ward`, "DUPLICATE_ROOM_NUMBER"
  );

  return createRoom({ hospitalId, ...data } as any);
};

export const updateRoomService = async (id: string, hospitalId: string, data: {
  roomNumber?: string; roomType?: string; capacity?: number; description?: string | null; isActive?: boolean;
}) => {
  const room = await findRoomById(id, hospitalId) as any;
  if (!room) throw new RoomServiceError("Room not found", "NOT_FOUND", 404);

  if (data.roomNumber && data.roomNumber !== room.roomNumber) {
    const existing = await checkDuplicateRoomNumber(room.wardId, data.roomNumber, id);
    if (existing) throw new RoomServiceError(
      `Room ${data.roomNumber} already exists in this ward`, "DUPLICATE_ROOM_NUMBER"
    );
  }

  await updateRoom(id, hospitalId, data as any);
  return findRoomById(id, hospitalId);
};

export const deleteRoomService = async (id: string, hospitalId: string) => {
  const room = await findRoomById(id, hospitalId) as any;
  if (!room) throw new RoomServiceError("Room not found", "NOT_FOUND", 404);
  if (room.beds?.length > 0) {
    throw new RoomServiceError(
      "Cannot delete room with existing beds. Remove all beds first.",
      "HAS_BEDS", 400
    );
  }
  return deleteRoom(id, hospitalId);
};
