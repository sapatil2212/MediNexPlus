import prisma from "../config/db";

export const createAllocation = async (data: any) => {
  return (prisma as any).bedAllocation.create({
    data,
    include: {
      bed: {
        include: {
          ward: { select: { name: true } },
          room: { select: { roomNumber: true } },
        },
      },
    },
  });
};

export const findActiveAllocationByBed = async (bedId: string) => {
  return (prisma as any).bedAllocation.findFirst({
    where: { bedId, status: "ACTIVE" },
    orderBy: { admissionDate: "desc" },
  });
};

export const findAllocationById = async (id: string, hospitalId: string) => {
  return (prisma as any).bedAllocation.findFirst({
    where: { id, hospitalId },
    include: {
      bed: {
        include: {
          ward: { select: { name: true, type: true } },
          room: { select: { roomNumber: true } },
        },
      },
      department: { select: { name: true } },
    },
  });
};

export const findAllAllocations = async (hospitalId: string, status?: string) => {
  return (prisma as any).bedAllocation.findMany({
    where: { hospitalId, ...(status ? { status } : {}) },
    include: {
      bed: {
        include: {
          ward: { select: { name: true, type: true } },
          room: { select: { roomNumber: true } },
        },
      },
      department: { select: { name: true } },
    },
    orderBy: { admissionDate: "desc" },
  });
};

export const updateAllocation = async (id: string, hospitalId: string, data: any) => {
  return (prisma as any).bedAllocation.updateMany({ where: { id, hospitalId }, data });
};

export const getBedStatusOverview = async (hospitalId: string) => {
  const [beds, activeAllocations] = await Promise.all([
    (prisma as any).bed.findMany({
      where: { hospitalId },
      include: {
        ward: { select: { name: true, type: true } },
        room: { select: { roomNumber: true } },
        allocations: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { admissionDate: "desc" },
        },
      },
      orderBy: [{ ward: { name: "asc" } }, { bedNumber: "asc" }],
    }),
    (prisma as any).bedAllocation.count({ where: { hospitalId, status: "ACTIVE" } }),
  ]);
  return { beds, activeAllocations };
};
