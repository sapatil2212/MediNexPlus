import prisma from "../config/db";
import { Prisma, DepartmentType } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENT REPOSITORY - Enhanced with pagination, filtering, and relations
// ─────────────────────────────────────────────────────────────────────────────

export interface DepartmentQueryOptions {
  hospitalId: string;
  search?: string;
  type?: DepartmentType;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "name" | "code" | "type" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Create a new department
export const createDepartment = async (data: Prisma.DepartmentUncheckedCreateInput) => {
  return prisma.department.create({
    data,
    include: {
      hodDoctor: { select: { id: true, name: true, specialization: true } },
      hodUser: { select: { id: true, name: true, role: true } },
      _count: { select: { doctors: true, staff: true, subDepartments: true } },
    },
  });
};

// Find all departments with pagination and filters
export const findAllDepartments = async (
  options: DepartmentQueryOptions
): Promise<PaginatedResult<any>> => {
  const {
    hospitalId,
    search,
    type,
    isActive,
    page = 1,
    limit = 20,
    sortBy = "name",
    sortOrder = "asc",
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.DepartmentWhereInput = {
    hospitalId,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
          ],
        }
      : {}),
    ...(type ? { type } : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
  };

  // Execute count and findMany in parallel
  const [total, data] = await Promise.all([
    prisma.department.count({ where }),
    prisma.department.findMany({
      where,
      include: {
        hodDoctor: { select: { id: true, name: true, specialization: true } },
        hodUser: { select: { id: true, name: true, role: true } },
        _count: { select: { doctors: true, staff: true, subDepartments: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Find all departments without pagination (for dropdowns, etc.)
export const findAllDepartmentsSimple = async (hospitalId: string, activeOnly = true) => {
  return prisma.department.findMany({
    where: {
      hospitalId,
      ...(activeOnly ? { isActive: true } : {}),
    },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
};

// Find department by ID with full relations
export const findDepartmentById = async (id: string, hospitalId: string) => {
  return prisma.department.findFirst({
    where: { id, hospitalId },
    include: {
      hodDoctor: { select: { id: true, name: true, email: true, specialization: true } },
      hodUser: { select: { id: true, name: true, role: true } },
      doctors: { select: { id: true, name: true, specialization: true, isAvailable: true } },
      staff: { select: { id: true, name: true, role: true, isActive: true } },
      subDepartments: { select: { id: true, name: true, type: true, isActive: true } },
      _count: { select: { doctors: true, staff: true, subDepartments: true, pricing: true } },
    },
  });
};

// Check if department code exists for hospital
export const checkDuplicateCode = async (
  hospitalId: string,
  code: string,
  excludeId?: string
): Promise<boolean> => {
  const existing = await prisma.department.findFirst({
    where: {
      hospitalId,
      code: code.toUpperCase(),
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  return !!existing;
};

// Update department by ID
export const updateDepartment = async (
  id: string,
  hospitalId: string,
  data: Prisma.DepartmentUncheckedUpdateInput
) => {
  return prisma.department.update({
    where: { id },
    data: {
      ...data,
      hospitalId,
    },
    include: {
      hodDoctor: { select: { id: true, name: true, specialization: true } },
      hodUser: { select: { id: true, name: true, role: true } },
      _count: { select: { doctors: true, staff: true, subDepartments: true } },
    },
  });
};

// Toggle department active status
export const toggleDepartmentStatus = async (
  id: string,
  hospitalId: string,
  isActive: boolean
) => {
  return prisma.department.updateMany({
    where: { id, hospitalId },
    data: { isActive },
  });
};

// Delete department (with dependency check)
export const deleteDepartment = async (id: string, hospitalId: string, cascade = false) => {
  if (cascade) {
    // Cascade delete: remove department and all related entities in a transaction
    return prisma.$transaction(async (tx) => {
      // Delete related entities first (due to foreign key constraints)
      await tx.doctor.updateMany({
        where: { departmentId: id, hospitalId },
        data: { departmentId: null },
      });
      await tx.staff.updateMany({
        where: { departmentId: id, hospitalId },
        data: { departmentId: null },
      });
      // Delete sub-departments (cascade will handle their related records)
      await (tx as any).subDepartment.deleteMany({
        where: { departmentId: id, hospitalId },
      });
      // Delete the department itself
      return tx.department.deleteMany({ where: { id, hospitalId } });
    });
  } else {
    // Force delete: just remove department, unlink related items
    return prisma.$transaction(async (tx) => {
      // Unlink doctors and staff
      await tx.doctor.updateMany({
        where: { departmentId: id, hospitalId },
        data: { departmentId: null },
      });
      await tx.staff.updateMany({
        where: { departmentId: id, hospitalId },
        data: { departmentId: null },
      });
      // Unlink sub-departments
      await (tx as any).subDepartment.updateMany({
        where: { departmentId: id, hospitalId },
        data: { departmentId: null },
      });
      // Delete the department
      return tx.department.deleteMany({ where: { id, hospitalId } });
    });
  }
};

// Check department dependencies before deletion
export const checkDepartmentDependencies = async (id: string, hospitalId: string) => {
  const department = await prisma.department.findFirst({
    where: { id, hospitalId },
    include: {
      _count: {
        select: { doctors: true, staff: true, subDepartments: true, pricing: true },
      },
    },
  });

  if (!department) return null;

  return {
    hasDoctor: department._count.doctors > 0,
    hasStaff: department._count.staff > 0,
    hasSubDepartments: department._count.subDepartments > 0,
    hasPricing: department._count.pricing > 0,
    counts: department._count,
  };
};

// Bulk create departments (for seeding defaults)
export const createManyDepartments = async (
  hospitalId: string,
  departments: Omit<Prisma.DepartmentUncheckedCreateInput, "hospitalId">[]
) => {
  const data = departments.map((dept) => ({ ...dept, hospitalId }));
  return prisma.department.createMany({ data, skipDuplicates: true });
};

// Count departments
export const countDepartments = async (hospitalId: string, isActive?: boolean) => {
  return prisma.department.count({
    where: {
      hospitalId,
      ...(typeof isActive === "boolean" ? { isActive } : {}),
    },
  });
};

// Set department login credentials (hodUserId + credentialsSent)
export const setDepartmentCredentials = async (id: string, userId: string, credentialsSent = true) => {
  return (prisma as any).department.update({ where: { id }, data: { hodUserId: userId, credentialsSent } });
};

// Find department by hodUserId (for DEPT_HEAD login)
export const findDepartmentByUserId = async (userId: string) => {
  return (prisma as any).department.findFirst({
    where: { hodUserId: userId },
    include: {
      hodDoctor: { select: { id: true, name: true, specialization: true } },
      hodUser: { select: { id: true, name: true, role: true } },
      subDepartments: {
        select: {
          id: true, name: true, type: true, isActive: true, code: true, color: true,
          hodName: true, hodEmail: true, hodPhone: true, credentialsSent: true,
          _count: { select: { procedures: true, appointments: true, procedureRecords: true } },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { doctors: true, staff: true, subDepartments: true, appointments: true } },
    },
  });
};

// Sub-departments
export const createSubDepartment = async (data: Prisma.SubDepartmentUncheckedCreateInput) => {
  return prisma.subDepartment.create({ data });
};

export const findAllSubDepartments = async (hospitalId: string) => {
  return prisma.subDepartment.findMany({
    where: { hospitalId },
    include: { department: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
};

export const updateSubDepartment = async (id: string, hospitalId: string, data: Prisma.SubDepartmentUpdateInput) => {
  return prisma.subDepartment.updateMany({ where: { id, hospitalId }, data: data as any });
};

export const deleteSubDepartment = async (id: string, hospitalId: string) => {
  return prisma.subDepartment.deleteMany({ where: { id, hospitalId } });
};
