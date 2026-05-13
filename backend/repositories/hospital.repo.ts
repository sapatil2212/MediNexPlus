import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createHospital = async (data: Prisma.HospitalCreateInput) => {
  return await prisma.hospital.create({ data });
};

export const findHospitalById = async (id: string) => {
  return await prisma.hospital.findUnique({ 
    where: { id },
    include: {
      settings: true
    }
  });
};

export const findAllHospitals = async () => {
  return await prisma.hospital.findMany();
};

export const updateHospital = async (id: string, data: Prisma.HospitalUpdateInput) => {
  return await prisma.hospital.update({
    where: { id },
    data,
  });
};
