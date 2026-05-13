import { findAllUsers, findUserById, updateUser, deleteUser, createUser } from "../repositories/user.repo";
import { hashPassword } from "../utils/hash";
import { Role } from "@prisma/client";

export const createUserService = async (data: any, hospitalId: string) => {
  const hashedPassword = await hashPassword(data.password);
  
  return await createUser({
    ...data,
    hospital: { connect: { id: hospitalId } },
    password: hashedPassword,
  });
};

export const listUsersService = async (hospitalId: string) => {
  return await findAllUsers(hospitalId);
};

export const updateUserService = async (id: string, data: any, hospitalId: string) => {
  if (data.password) {
    data.password = await hashPassword(data.password);
  }
  return await updateUser(id, data, hospitalId);
};

export const deleteUserService = async (id: string, hospitalId: string) => {
  return await deleteUser(id, hospitalId);
};
