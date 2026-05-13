import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createBed = async (data: any) => {
  return (prisma as any).bed.create({
    data,
    include: {
      ward: { select: { name: true } },
      room: { select: { roomNumber: true } },
    },
  });
};

export const createManyBeds = async (data: any[]) => {
  return (prisma as any).bed.createMany({ data, skipDuplicates: true });
};

export const findAllBeds = async (hospitalId: string, filters?: {
  wardId?: string;
  roomId?: string;
  status?: string;
  bedType?: string;
}) => {
  const where: any = { hospitalId };
  if (filters?.wardId) where.wardId = filters.wardId;
  if (filters?.roomId) where.roomId = filters.roomId;
  if (filters?.status) where.status = filters.status;
  if (filters?.bedType) where.bedType = filters.bedType;

  return (prisma as any).bed.findMany({
    where,
    include: {
      ward: { select: { name: true, type: true } },
      room: { select: { roomNumber: true, roomType: true } },
      allocations: {
        where: { status: "ACTIVE" },
        take: 1,
        orderBy: { admissionDate: "desc" },
      },
    },
    orderBy: [{ ward: { name: "asc" } }, { room: { roomNumber: "asc" } }, { bedNumber: "asc" }],
  });
};

export const findBedById = async (id: string, hospitalId: string) => {
  return (prisma as any).bed.findFirst({
    where: { id, hospitalId },
    include: {
      ward: { select: { name: true, type: true, floor: true } },
      room: { select: { roomNumber: true, roomType: true } },
      allocations: {
        orderBy: { admissionDate: "desc" },
        take: 5,
      },
    },
  });
};

export const updateBed = async (id: string, hospitalId: string, data: any) => {
  return (prisma as any).bed.updateMany({ where: { id, hospitalId }, data });
};

export const deleteBed = async (id: string, hospitalId: string) => {
  return (prisma as any).bed.deleteMany({ where: { id, hospitalId } });
};

export const checkDuplicateBedNumber = async (roomId: string, bedNumber: string, excludeId?: string) => {
  return (prisma as any).bed.findFirst({
    where: { roomId, bedNumber, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
};

export const getBedStats = async (hospitalId: string, wardId?: string) => {
  const where: any = { hospitalId, ...(wardId ? { wardId } : {}) };
  const [total, available, occupied, maintenance, reserved] = await Promise.all([
    (prisma as any).bed.count({ where }),
    (prisma as any).bed.count({ where: { ...where, status: "AVAILABLE" } }),
    (prisma as any).bed.count({ where: { ...where, status: "OCCUPIED" } }),
    (prisma as any).bed.count({ where: { ...where, status: "MAINTENANCE" } }),
    (prisma as any).bed.count({ where: { ...where, status: "RESERVED" } }),
  ]);
  return { total, available, occupied, maintenance, reserved };
};
