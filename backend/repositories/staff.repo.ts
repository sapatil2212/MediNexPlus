import prisma from "../config/db";
import { Prisma, StaffRole } from "@prisma/client";

export interface StaffQueryOptions {
  hospitalId: string;
  search?: string;
  role?: StaffRole;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const createStaff = async (data: Prisma.StaffUncheckedCreateInput) => {
  return prisma.staff.create({ 
    data, 
    include: { 
      department: { select: { name: true, code: true } },
      user: { select: { id: true, email: true, role: true } }
    } 
  });
};

export const findAllStaff = async (options: StaffQueryOptions) => {
  const {
    hospitalId,
    search,
    role,
    departmentId,
    isActive,
    page = 1,
    limit = 20,
    sortBy = "name",
    sortOrder = "asc",
  } = options;

  const where: Prisma.StaffWhereInput = {
    hospitalId,
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ],
    }),
    ...(role && { role }),
    ...(departmentId && { departmentId }),
    ...(isActive !== undefined && { isActive }),
  };

  const [staff, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      include: {
        department: { select: { name: true, code: true } },
        user: { select: { id: true, email: true, role: true, isActive: true } }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.staff.count({ where }),
  ]);

  return {
    data: staff,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const findStaffById = async (id: string, hospitalId: string) => {
  return prisma.staff.findFirst({ 
    where: { id, hospitalId }, 
    include: { 
      department: true,
      user: { select: { id: true, email: true, role: true, isActive: true } }
    } 
  });
};

export const findStaffByEmail = async (email: string, hospitalId: string, excludeId?: string) => {
  return prisma.staff.findFirst({
    where: {
      email: email.toLowerCase(),
      hospitalId,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
};

export const findStaffByEmailGlobal = async (email: string) => {
  return prisma.staff.findFirst({
    where: { email: email.toLowerCase() },
    include: {
      department: true,
      hospital: { select: { id: true, name: true } },
      user: { select: { id: true, role: true, isActive: true } },
    },
  }) as any;
};

export const findStaffByUserId = async (userId: string) => {
  return prisma.staff.findFirst({
    where: { userId },
    include: {
      department: true,
      hospital: { select: { id: true, name: true } },
    },
  });
};

export const updateStaff = async (id: string, hospitalId: string, data: Prisma.StaffUpdateInput) => {
  return prisma.staff.update({ 
    where: { id, hospitalId }, 
    data,
    include: {
      department: { select: { name: true, code: true } },
      user: { select: { id: true, email: true, role: true } }
    }
  });
};

export const deleteStaff = async (id: string, hospitalId: string) => {
  return prisma.staff.delete({ where: { id, hospitalId } });
};

export const checkDuplicateEmail = async (hospitalId: string, email: string, excludeId?: string) => {
  const existing = await prisma.staff.findFirst({
    where: {
      hospitalId,
      email: email.toLowerCase(),
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  return !!existing;
};

export const countStaff = async (hospitalId: string, filters?: { isActive?: boolean; role?: StaffRole }) => {
  return prisma.staff.count({
    where: {
      hospitalId,
      ...filters,
    },
  });
};

export const toggleStaffStatus = async (id: string, hospitalId: string, isActive: boolean) => {
  return prisma.staff.update({
    where: { id, hospitalId },
    data: { isActive },
  });
};
