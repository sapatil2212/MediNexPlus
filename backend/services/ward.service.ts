import {
  createWard, findAllWards, findWardById, updateWard, deleteWard, checkDuplicateWardName,
} from "../repositories/ward.repo";

export class WardServiceError extends Error {
  constructor(public message: string, public code: string, public status: number = 400) {
    super(message);
    this.name = "WardServiceError";
  }
}

export const getAllWards = async (hospitalId: string) => {
  const wards = await findAllWards(hospitalId);
  return wards.map((w: any) => {
    const allBeds = w.beds || [];
    const available = allBeds.filter((b: any) => b.status === "AVAILABLE").length;
    const occupied = allBeds.filter((b: any) => b.status === "OCCUPIED").length;
    const maintenance = allBeds.filter((b: any) => b.status === "MAINTENANCE").length;
    const reserved = allBeds.filter((b: any) => b.status === "RESERVED").length;
    return {
      ...w,
      stats: { total: allBeds.length, available, occupied, maintenance, reserved },
    };
  });
};

export const getWardById = async (id: string, hospitalId: string) => {
  const ward = await findWardById(id, hospitalId);
  if (!ward) throw new WardServiceError("Ward not found", "NOT_FOUND", 404);
  return ward;
};

export const createWardService = async (hospitalId: string, data: {
  name: string; type: string; floor?: string | null; description?: string | null;
}) => {
  const existing = await checkDuplicateWardName(hospitalId, data.name);
  if (existing) throw new WardServiceError("A ward with this name already exists", "DUPLICATE_NAME");

  return createWard({ hospitalId, ...data } as any);
};

export const updateWardService = async (id: string, hospitalId: string, data: {
  name?: string; type?: string; floor?: string | null; description?: string | null; isActive?: boolean;
}) => {
  const ward = await findWardById(id, hospitalId);
  if (!ward) throw new WardServiceError("Ward not found", "NOT_FOUND", 404);

  if (data.name && data.name !== (ward as any).name) {
    const existing = await checkDuplicateWardName(hospitalId, data.name, id);
    if (existing) throw new WardServiceError("A ward with this name already exists", "DUPLICATE_NAME");
  }

  await updateWard(id, hospitalId, data as any);
  return findWardById(id, hospitalId);
};

export const deleteWardService = async (id: string, hospitalId: string) => {
  const ward = await findWardById(id, hospitalId) as any;
  if (!ward) throw new WardServiceError("Ward not found", "NOT_FOUND", 404);
  if (ward.beds?.length > 0) {
    throw new WardServiceError(
      "Cannot delete ward with existing beds. Remove all beds first.",
      "HAS_BEDS", 400
    );
  }
  return deleteWard(id, hospitalId);
};
