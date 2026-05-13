import prisma from "../config/db";

export const createWard = async (data: any) => {
  return (prisma as any).ward.create({
    data,
    include: { _count: { select: { rooms: true, beds: true } } },
  });
};

export const findAllWards = async (hospitalId: string) => {
  return (prisma as any).ward.findMany({
    where: { hospitalId },
    include: {
      _count: { select: { rooms: true, beds: true } },
      rooms: {
        include: {
          _count: { select: { beds: true } },
          beds: { select: { id: true, status: true } },
        },
        orderBy: { roomNumber: "asc" },
      },
      beds: { select: { id: true, status: true } },
    },
    orderBy: { name: "asc" },
  });
};

export const findWardById = async (id: string, hospitalId: string) => {
  return (prisma as any).ward.findFirst({
    where: { id, hospitalId },
    include: {
      rooms: {
        include: {
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
        orderBy: { roomNumber: "asc" },
      },
      beds: { select: { id: true, status: true } },
    },
  });
};

export const updateWard = async (id: string, hospitalId: string, data: any) => {
  return (prisma as any).ward.updateMany({ where: { id, hospitalId }, data });
};

export const deleteWard = async (id: string, hospitalId: string) => {
  return (prisma as any).ward.deleteMany({ where: { id, hospitalId } });
};

export const checkDuplicateWardName = async (hospitalId: string, name: string, excludeId?: string) => {
  return (prisma as any).ward.findFirst({
    where: { hospitalId, name, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
};
