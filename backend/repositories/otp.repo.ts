import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createOTP = async (data: Prisma.OTPCreateInput) => {
  return await prisma.oTP.create({ data });
};

export const findLatestOTP = async (email: string) => {
  return await prisma.oTP.findFirst({
    where: { email },
    orderBy: { expiresAt: "desc" },
  });
};

export const verifyOTPMark = async (id: string) => {
  return await prisma.oTP.update({
    where: { id },
    data: { verified: true },
  });
};
