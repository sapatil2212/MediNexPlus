import prisma from "../config/db";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR REPOSITORY - Enhanced with pagination, filtering, and relations
// ─────────────────────────────────────────────────────────────────────────────

export const generateDoctorCode = async (hospitalId: string): Promise<string> => {
  const count = await (prisma as any).doctor.count({ where: { hospitalId } });
  return `DOC-${String(count + 1).padStart(4, "0")}`;
};

export interface DoctorQueryOptions {
  hospitalId: string;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "name" | "email" | "specialization" | "experience" | "consultationFee" | "createdAt";
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

// Create a new doctor
export const createDoctor = async (data: Prisma.DoctorUncheckedCreateInput) => {
  const doctorCode = await generateDoctorCode(data.hospitalId as string);
  return (prisma as any).doctor.create({
    data: { ...data, doctorCode },
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { availability: true } },
    },
  });
};

// Find all doctors with pagination and filters
export const findAllDoctors = async (
  options: DoctorQueryOptions
): Promise<PaginatedResult<any>> => {
  const {
    hospitalId,
    search,
    departmentId,
    isActive,
    isAvailable,
    page = 1,
    limit = 20,
    sortBy = "name",
    sortOrder = "asc",
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.DoctorWhereInput = {
    hospitalId,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { specialization: { contains: search } },
          ],
        }
      : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(typeof isAvailable === "boolean" ? { isAvailable } : {}),
  };

  // Execute count and findMany in parallel
  const [total, data] = await Promise.all([
    prisma.doctor.count({ where }),
    prisma.doctor.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { availability: true } },
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

// Find all doctors for dropdowns (simple list)
export const findAllDoctorsSimple = async (hospitalId: string, activeOnly = true) => {
  return prisma.doctor.findMany({
    where: {
      hospitalId,
      ...(activeOnly ? { isActive: true, isAvailable: true } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      specialization: true,
      consultationFee: true,
      departmentId: true,
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
};

// Find doctor by ID with full details
export const findDoctorById = async (id: string, hospitalId: string) => {
  return prisma.doctor.findFirst({
    where: { id, hospitalId },
    include: {
      department: { select: { id: true, name: true, code: true } },
      availability: { orderBy: { day: "asc" } },
      _count: { select: { availability: true } },
    },
  });
};

// Check if doctor email exists for hospital
export const checkDuplicateEmail = async (
  hospitalId: string,
  email: string,
  excludeId?: string
): Promise<boolean> => {
  const existing = await prisma.doctor.findFirst({
    where: {
      hospitalId,
      email: email.toLowerCase(),
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  return !!existing;
};

// Update doctor by ID
export const updateDoctor = async (
  id: string,
  hospitalId: string,
  data: Prisma.DoctorUpdateInput
) => {
  return prisma.doctor.update({
    where: { id },
    data,
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { availability: true } },
    },
  });
};

// Toggle doctor status (isActive or isAvailable)
export const toggleDoctorStatus = async (
  id: string,
  hospitalId: string,
  status: { isActive?: boolean; isAvailable?: boolean }
) => {
  return prisma.doctor.updateMany({
    where: { id, hospitalId },
    data: status,
  });
};

// Delete doctor
export const deleteDoctor = async (id: string, hospitalId: string) => {
  return prisma.doctor.deleteMany({ where: { id, hospitalId } });
};

// Count doctors
export const countDoctors = async (hospitalId: string, filters?: { isActive?: boolean; departmentId?: string }) => {
  return prisma.doctor.count({
    where: {
      hospitalId,
      ...(typeof filters?.isActive === "boolean" ? { isActive: filters.isActive } : {}),
      ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
    },
  });
};

// Get doctors by department
export const findDoctorsByDepartment = async (hospitalId: string, departmentId: string) => {
  return prisma.doctor.findMany({
    where: { hospitalId, departmentId },
    select: {
      id: true,
      name: true,
      specialization: true,
      consultationFee: true,
      isAvailable: true,
    },
    orderBy: { name: "asc" },
  });
};
