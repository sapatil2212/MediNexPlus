import {
  createBed, createManyBeds, findAllBeds, findBedById, updateBed, deleteBed,
  checkDuplicateBedNumber, getBedStats,
} from "../repositories/bed.repo";
import { findWardById } from "../repositories/ward.repo";
import { findRoomById } from "../repositories/room.repo";

export class BedServiceError extends Error {
  constructor(public message: string, public code: string, public status: number = 400) {
    super(message);
    this.name = "BedServiceError";
  }
}

export const getAllBeds = async (hospitalId: string, filters?: {
  wardId?: string; roomId?: string; status?: string; bedType?: string;
}) => {
  return findAllBeds(hospitalId, filters);
};

export const getBedById = async (id: string, hospitalId: string) => {
  const bed = await findBedById(id, hospitalId);
  if (!bed) throw new BedServiceError("Bed not found", "NOT_FOUND", 404);
  return bed;
};

export const getBedStatsService = async (hospitalId: string, wardId?: string) => {
  return getBedStats(hospitalId, wardId);
};

export const createBedService = async (hospitalId: string, data: {
  wardId: string; roomId?: string; bedNumber: string;
  bedType?: string; pricePerDay?: number;
}) => {
  const ward = await findWardById(data.wardId, hospitalId);
  if (!ward) throw new BedServiceError("Ward not found", "WARD_NOT_FOUND", 404);

  if (data.roomId) {
    const room = await findRoomById(data.roomId, hospitalId);
    if (!room) throw new BedServiceError("Room not found", "ROOM_NOT_FOUND", 404);

    const existing = await checkDuplicateBedNumber(data.roomId, data.bedNumber);
    if (existing) throw new BedServiceError(
      `Bed ${data.bedNumber} already exists in this room`, "DUPLICATE_BED_NUMBER"
    );
  }

  return createBed({ hospitalId, status: "AVAILABLE", ...data } as any);
};

export const bulkCreateBeds = async (hospitalId: string, data: {
  wardId: string; roomId: string; count: number; prefix?: string;
  startFrom?: number; bedType?: string; pricePerDay?: number;
}) => {
  const ward = await findWardById(data.wardId, hospitalId);
  if (!ward) throw new BedServiceError("Ward not found", "WARD_NOT_FOUND", 404);

  const room = await findRoomById(data.roomId, hospitalId);
  if (!room) throw new BedServiceError("Room not found", "ROOM_NOT_FOUND", 404);

  const prefix = data.prefix || "Bed";
  const start = data.startFrom || 1;
  const beds = Array.from({ length: data.count }, (_, i) => ({
    hospitalId,
    wardId: data.wardId,
    roomId: data.roomId,
    bedNumber: `${prefix}-${start + i}`,
    bedType: data.bedType || "NORMAL",
    status: "AVAILABLE",
    pricePerDay: data.pricePerDay || 0,
  }));

  return createManyBeds(beds);
};

export const updateBedService = async (id: string, hospitalId: string, data: {
  bedNumber?: string; bedType?: string; status?: string; pricePerDay?: number; roomId?: string;
}) => {
  const bed = await findBedById(id, hospitalId) as any;
  if (!bed) throw new BedServiceError("Bed not found", "NOT_FOUND", 404);

  if (data.status === "AVAILABLE" && bed.status === "OCCUPIED") {
    throw new BedServiceError(
      "Cannot manually mark occupied bed as available. Use discharge instead.",
      "BED_OCCUPIED", 400
    );
  }

  await updateBed(id, hospitalId, data as any);
  return findBedById(id, hospitalId);
};

export const deleteBedService = async (id: string, hospitalId: string) => {
  const bed = await findBedById(id, hospitalId) as any;
  if (!bed) throw new BedServiceError("Bed not found", "NOT_FOUND", 404);
  if (bed.status === "OCCUPIED") {
    throw new BedServiceError(
      "Cannot delete an occupied bed. Discharge the patient first.",
      "BED_OCCUPIED", 400
    );
  }
  return deleteBed(id, hospitalId);
};
