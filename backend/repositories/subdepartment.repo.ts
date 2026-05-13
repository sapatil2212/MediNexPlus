import prisma from "../config/db";
import { CreateSubDepartmentInput, UpdateSubDepartmentInput, CreateProcedureInput, UpdateProcedureInput } from "../validations/subdepartment.validation";

// ─── SubDepartment Queries ────────────────────────────────────────────────────

export const findSubDepartments = async (params: {
  hospitalId: string;
  search?: string;
  type?: string;
  isActive?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}) => {
  const { hospitalId, search, type, isActive, departmentId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: any = { hospitalId };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
      { hodName: { contains: search } },
    ];
  }
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive === "true";
  if (departmentId) where.departmentId = departmentId;

  const [data, total] = await Promise.all([
    prisma.subDepartment.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, type: true } },
        procedures: { where: { isActive: true }, orderBy: { sequence: "asc" }, select: { id: true, name: true, type: true, fee: true, sequence: true, isActive: true } },
        _count: { select: { procedures: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.subDepartment.count({ where }),
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

export const findSubDepartmentById = async (id: string, hospitalId: string) => {
  return prisma.subDepartment.findFirst({
    where: { id, hospitalId },
    include: {
      department: { select: { id: true, name: true, type: true } },
      procedures: { orderBy: { sequence: "asc" } },
      user: { select: { id: true, email: true, isActive: true } },
      _count: { select: { procedures: true } },
    },
  });
};

export const findSubDepartmentByLoginEmail = async (loginEmail: string) => {
  return prisma.subDepartment.findUnique({ where: { loginEmail } });
};

export const findSubDepartmentByUserId = async (userId: string) => {
  return prisma.subDepartment.findUnique({
    where: { userId },
    include: {
      department: { select: { id: true, name: true, type: true } },
      procedures: { where: { isActive: true }, orderBy: { sequence: "asc" } },
    },
  });
};

export const createSubDepartment = async (hospitalId: string, data: CreateSubDepartmentInput) => {
  return prisma.subDepartment.create({
    data: {
      hospitalId,
      name: data.name,
      code: data.code || null,
      type: data.type as any,
      description: data.description || null,
      color: data.color || "#0E898F",
      flow: data.flow || null,
      departmentId: data.departmentId || null,
      hodStaffId: data.hodStaffId || null,
      hodName: data.hodName || null,
      hodEmail: data.hodEmail || null,
      hodPhone: data.hodPhone || null,
      loginEmail: data.loginEmail || null,
      isActive: data.isActive ?? true,
      accessFeatures: data.accessFeatures || null,
      customName: data.customName || null,
    } as any,
    include: {
      department: { select: { id: true, name: true, type: true } },
      procedures: true,
    },
  });
};

export const updateSubDepartment = async (id: string, hospitalId: string, data: UpdateSubDepartmentInput) => {
  return prisma.subDepartment.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.flow !== undefined && { flow: data.flow }),
      ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
      ...(data.hodStaffId !== undefined && { hodStaffId: data.hodStaffId }),
      ...(data.hodName !== undefined && { hodName: data.hodName }),
      ...(data.hodEmail !== undefined && { hodEmail: data.hodEmail }),
      ...(data.hodPhone !== undefined && { hodPhone: data.hodPhone }),
      ...(data.loginEmail !== undefined && { loginEmail: data.loginEmail }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.accessFeatures !== undefined && { accessFeatures: data.accessFeatures }),
      ...(data.customName !== undefined && { customName: data.customName }),
    } as any,
    include: {
      department: { select: { id: true, name: true, type: true } },
      procedures: { orderBy: { sequence: "asc" } },
    },
  });
};

export const deleteSubDepartment = async (id: string, hospitalId: string) => {
  return prisma.subDepartment.delete({ where: { id } });
};

export const toggleSubDepartmentStatus = async (id: string, isActive: boolean) => {
  return prisma.subDepartment.update({ where: { id }, data: { isActive } });
};

export const setSubDepartmentCredentials = async (id: string, userId: string, credentialsSent = true) => {
  return prisma.subDepartment.update({ where: { id }, data: { userId, credentialsSent } });
};

// ─── Procedure Queries ────────────────────────────────────────────────────────

export const findProcedures = async (params: {
  hospitalId: string;
  subDepartmentId?: string;
  search?: string;
  type?: string;
  isActive?: string;
}) => {
  const { hospitalId, subDepartmentId, search, type, isActive } = params;
  const where: any = { hospitalId };
  if (subDepartmentId) where.subDepartmentId = subDepartmentId;
  if (search) where.name = { contains: search };
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive === "true";

  return prisma.procedure.findMany({
    where,
    include: {
      subDepartment: { select: { id: true, name: true, type: true, color: true } },
    },
    orderBy: [{ subDepartmentId: "asc" }, { sequence: "asc" }],
  });
};

export const findProcedureById = async (id: string, hospitalId: string) => {
  return prisma.procedure.findFirst({
    where: { id, hospitalId },
    include: { subDepartment: { select: { id: true, name: true, type: true } } },
  });
};

export const createProcedure = async (hospitalId: string, data: CreateProcedureInput) => {
  return prisma.procedure.create({
    data: {
      hospitalId,
      subDepartmentId: data.subDepartmentId,
      name: data.name,
      description: data.description || null,
      type: data.type || "OTHER",
      fee: data.fee ?? null,
      duration: data.duration ?? null,
      sequence: data.sequence ?? 0,
      isActive: data.isActive ?? true,
    },
  });
};

export const updateProcedure = async (id: string, hospitalId: string, data: UpdateProcedureInput) => {
  return prisma.procedure.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.fee !== undefined && { fee: data.fee }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.sequence !== undefined && { sequence: data.sequence }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

export const deleteProcedure = async (id: string, hospitalId: string) => {
  return prisma.procedure.delete({ where: { id } });
};

export const bulkCreateProcedures = async (hospitalId: string, subDepartmentId: string, procedures: Array<{ name: string; type?: string; description?: string; fee?: number; sequence?: number }>) => {
  return prisma.procedure.createMany({
    data: procedures.map((p, i) => ({
      hospitalId,
      subDepartmentId,
      name: p.name,
      type: (p.type as any) || "OTHER",
      description: p.description || null,
      fee: p.fee ?? null,
      sequence: p.sequence ?? i,
      isActive: true,
    })),
    skipDuplicates: true,
  });
};
