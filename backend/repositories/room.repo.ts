import prisma from "../config/db";

export const createRoom = async (data: any) => {
  return (prisma as any).room.create({
    data,
    include: { ward: { select: { name: true } }, _count: { select: { beds: true } } },
  });
};

export const findAllRooms = async (hospitalId: string, wardId?: string) => {
  return (prisma as any).room.findMany({
    where: { hospitalId, ...(wardId ? { wardId } : {}) },
    include: {
      ward: { select: { name: true, type: true } },
      _count: { select: { beds: true } },
      beds: { select: { id: true, status: true, bedNumber: true, bedType: true } },
    },
    orderBy: [{ ward: { name: "asc" } }, { roomNumber: "asc" }],
  });
};

export const findRoomById = async (id: string, hospitalId: string) => {
  return (prisma as any).room.findFirst({
    where: { id, hospitalId },
    include: {
      ward: { select: { name: true, type: true, floor: true } },
      beds: {
        include: {
          allocations: {
            where: { status: "ACTIVE" },
            take: 1,
            orderBy: { admissionDate: "desc" },
          },
        },
        orderBy: { bedNumber: "asc" },
      },
    },
  });
};

export const updateRoom = async (id: string, hospitalId: string, data: any) => {
  return (prisma as any).room.updateMany({ where: { id, hospitalId }, data });
};

export const deleteRoom = async (id: string, hospitalId: string) => {
  return (prisma as any).room.deleteMany({ where: { id, hospitalId } });
};

export const checkDuplicateRoomNumber = async (wardId: string, roomNumber: string, excludeId?: string) => {
  return (prisma as any).room.findFirst({
    where: { wardId, roomNumber, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
};
