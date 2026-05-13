import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const generateUserCode = async (hospitalId: string): Promise<string> => {
  const count = await (prisma as any).user.count({ where: { hospitalId } });
  return `USR-${String(count + 1).padStart(4, "0")}`;
};

export const createUser = async (data: Prisma.UserCreateInput) => {
  const hospitalId = typeof data.hospital === "object" && "connect" in data.hospital
    ? (data.hospital as any).connect?.id
    : undefined;
  const userCode = hospitalId ? await generateUserCode(hospitalId) : undefined;
  return await (prisma as any).user.create({ data: { ...data, ...(userCode ? { userCode } : {}) } });
};

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { hospital: true },
  });
};

export const findUserById = async (id: string, hospitalId?: string) => {
  return await prisma.user.findUnique({
    where: {
      id,
      ...(hospitalId ? { hospitalId } : {}),
    },
    include: { hospital: true },
  });
};

export const findAllUsers = async (hospitalId: string) => {
  return await prisma.user.findMany({
    where: { hospitalId },
  });
};

export const updateUser = async (id: string, data: Prisma.UserUpdateInput, hospitalId?: string) => {
  return await prisma.user.update({
    where: {
      id,
      ...(hospitalId ? { hospitalId } : {}),
    },
    data,
  });
};

export const deleteUser = async (id: string, hospitalId?: string) => {
  return await prisma.user.delete({
    where: {
      id,
      ...(hospitalId ? { hospitalId } : {}),
    },
  });
};
