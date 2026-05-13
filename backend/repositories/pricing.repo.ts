import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createPricing = async (data: Prisma.PricingUncheckedCreateInput) => {
  return prisma.pricing.create({ data, include: { department: { select: { name: true } } } });
};

export const findAllPricing = async (hospitalId: string, type?: string) => {
  return prisma.pricing.findMany({
    where: { hospitalId, ...(type ? { type: type as any } : {}) },
    include: { department: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
};

export const updatePricing = async (id: string, hospitalId: string, data: Prisma.PricingUpdateInput) => {
  return prisma.pricing.updateMany({ where: { id, hospitalId }, data: data as any });
};

export const deletePricing = async (id: string, hospitalId: string) => {
  return prisma.pricing.deleteMany({ where: { id, hospitalId } });
};
