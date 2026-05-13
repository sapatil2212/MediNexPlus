import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createSession = async (data: Prisma.SessionCreateInput) => {
  return await prisma.session.create({ data });
};

export const findSessionByToken = async (token: string) => {
  return await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
};

export const deleteSession = async (token: string) => {
  return await prisma.session.delete({
    where: { token },
  });
};
