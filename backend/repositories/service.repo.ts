import prisma from "../config/db";
import type { CreateServiceInput, UpdateServiceInput, QueryServiceInput } from "../validations/service.validation";

export const serviceRepo = {
  async create(hospitalId: string, data: CreateServiceInput) {
    return await (prisma as any).service.create({
      data: {
        ...data,
        hospitalId,
        pricePerSession: data.pricePerSession || (data.price / data.sessionCount),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        subDepartment: { select: { id: true, name: true, type: true } },
      },
    });
  },

  async findById(id: string, hospitalId: string) {
    return await (prisma as any).service.findFirst({
      where: { id, hospitalId },
      include: {
        department: { select: { id: true, name: true, code: true } },
        subDepartment: { select: { id: true, name: true, type: true } },
        _count: { select: { treatmentPlans: true } },
      },
    });
  },

  async findMany(hospitalId: string, query: QueryServiceInput) {
    const { search, departmentId, subDepartmentId, category, isActive, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { hospitalId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (departmentId) where.departmentId = departmentId;
    if (subDepartmentId) where.subDepartmentId = subDepartmentId;
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    const [services, total] = await Promise.all([
      (prisma as any).service.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        include: {
          department: { select: { id: true, name: true, code: true } },
          subDepartment: { select: { id: true, name: true, type: true } },
          _count: { select: { treatmentPlans: true } },
        },
      }),
      (prisma as any).service.count({ where }),
    ]);

    return {
      services,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(id: string, hospitalId: string, data: UpdateServiceInput) {
    const { id: _, ...updateData } = data;
    
    return await (prisma as any).service.update({
      where: { id, hospitalId },
      data: updateData,
      include: {
        department: { select: { id: true, name: true, code: true } },
        subDepartment: { select: { id: true, name: true, type: true } },
      },
    });
  },

  async delete(id: string, hospitalId: string) {
    return await (prisma as any).service.delete({
      where: { id, hospitalId },
    });
  },

  async checkCodeExists(hospitalId: string, code: string, excludeId?: string) {
    const where: any = { hospitalId, code };
    if (excludeId) where.NOT = { id: excludeId };

    const existing = await (prisma as any).service.findFirst({ where });
    return !!existing;
  },

  async getStats(hospitalId: string) {
    const [total, active, byCategory] = await Promise.all([
      (prisma as any).service.count({ where: { hospitalId } }),
      (prisma as any).service.count({ where: { hospitalId, isActive: true } }),
      (prisma as any).service.groupBy({
        by: ["category"],
        where: { hospitalId },
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byCategory: byCategory.map((item: any) => ({
        category: item.category,
        count: item._count,
      })),
    };
  },

  async getByDepartment(hospitalId: string, departmentId: string) {
    return await (prisma as any).service.findMany({
      where: { hospitalId, departmentId, isActive: true },
      orderBy: { name: "asc" },
    });
  },

  async getBySubDepartment(hospitalId: string, subDepartmentId: string) {
    return await (prisma as any).service.findMany({
      where: { hospitalId, subDepartmentId, isActive: true },
      orderBy: { name: "asc" },
    });
  },
};
