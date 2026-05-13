import {
  createStaff as createStaffRepo,
  findAllStaff,
  findStaffById,
  findStaffByEmail,
  findStaffByEmailGlobal,
  findStaffByUserId,
  updateStaff as updateStaffRepo,
  deleteStaff as deleteStaffRepo,
  checkDuplicateEmail,
  toggleStaffStatus,
  countStaff,
  StaffQueryOptions,
} from "../repositories/staff.repo";
import { createUser, findUserByEmail, updateUser } from "../repositories/user.repo";
import { CreateStaffInput, UpdateStaffInput } from "../validations/staff.validation";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";
import { Role } from "@prisma/client";
import prisma from "../config/db";
import crypto from "crypto";

export class StaffServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "StaffServiceError";
  }
}

const generateRandomPassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
  
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const createStaff = async (hospitalId: string, input: CreateStaffInput) => {
  const isDuplicate = await checkDuplicateEmail(hospitalId, input.email);
  if (isDuplicate) {
    throw new StaffServiceError(
      "A staff member with this email already exists in your hospital",
      "DUPLICATE_EMAIL",
      409
    );
  }

  const staff = await createStaffRepo({
    hospitalId,
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone || null,
    role: input.role,
    departmentId: input.departmentId || null,
    salary: input.salary || 0,
    joinDate: input.joinDate || new Date(),
    isActive: input.isActive ?? true,
    password: null,
    mustChangePassword: true,
    credentialsSent: false,
    workingDays: input.workingDays ?? 26,
    dateOfBirth: input.dateOfBirth || null,
    bankName: input.bankName || null,
    bankAccountNo: input.bankAccountNo || null,
    panNo: input.panNo || null,
    pfAccountNo: input.pfAccountNo || null,
    pfUan: input.pfUan || null,
    address: input.address || null,
  } as any);

  return staff;
};

export const getStaff = async (options: StaffQueryOptions) => {
  return findAllStaff(options);
};

export const getStaffById = async (id: string, hospitalId: string) => {
  const staff = await findStaffById(id, hospitalId);
  if (!staff) {
    throw new StaffServiceError("Staff member not found", "NOT_FOUND", 404);
  }
  return staff;
};

export const getStaffByUserId = async (userId: string) => {
  const staff = await findStaffByUserId(userId);
  if (!staff) {
    throw new StaffServiceError("Staff member not found", "NOT_FOUND", 404);
  }
  return staff;
};

export const updateStaff = async (
  id: string,
  hospitalId: string,
  input: UpdateStaffInput
) => {
  const existing = await findStaffById(id, hospitalId);
  if (!existing) {
    throw new StaffServiceError("Staff member not found", "NOT_FOUND", 404);
  }

  if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
    const isDuplicate = await checkDuplicateEmail(hospitalId, input.email, id);
    if (isDuplicate) {
      throw new StaffServiceError(
        "A staff member with this email already exists",
        "DUPLICATE_EMAIL",
        409
      );
    }
  }

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined) updateData.email = input.email.toLowerCase();
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.role !== undefined) updateData.role = input.role;
  if (input.departmentId !== undefined) updateData.departmentId = input.departmentId;
  if (input.salary !== undefined) updateData.salary = input.salary;
  if (input.joinDate !== undefined) updateData.joinDate = input.joinDate;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.workingDays !== undefined) updateData.workingDays = input.workingDays;
  if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth;
  if (input.bankName !== undefined) updateData.bankName = input.bankName;
  if (input.bankAccountNo !== undefined) updateData.bankAccountNo = input.bankAccountNo;
  if (input.panNo !== undefined) updateData.panNo = input.panNo;
  if (input.pfAccountNo !== undefined) updateData.pfAccountNo = input.pfAccountNo;
  if (input.pfUan !== undefined) updateData.pfUan = input.pfUan;
  if (input.address !== undefined) updateData.address = input.address;

  return updateStaffRepo(id, hospitalId, updateData);
};

export const deleteStaff = async (id: string, hospitalId: string) => {
  const existing = await findStaffById(id, hospitalId);
  if (!existing) {
    throw new StaffServiceError("Staff member not found", "NOT_FOUND", 404);
  }

  await deleteStaffRepo(id, hospitalId);
  return { id, deleted: true };
};

export const toggleStatus = async (id: string, hospitalId: string, isActive: boolean) => {
  const existing = await findStaffById(id, hospitalId);
  if (!existing) {
    throw new StaffServiceError("Staff member not found", "NOT_FOUND", 404);
  }

  await toggleStaffStatus(id, hospitalId, isActive);
  return { id, isActive };
};

export const createStaffCredentials = async (
  staffId: string,
  hospitalId: string
): Promise<{ email: string; password: string; userId: string }> => {
  const staff = await findStaffById(staffId, hospitalId);
  if (!staff) {
    throw new StaffServiceError("Staff member not found", "NOT_FOUND", 404);
  }

  if (staff.credentialsSent) {
    throw new StaffServiceError(
      "Credentials have already been sent to this staff member",
      "CREDENTIALS_ALREADY_SENT",
      400
    );
  }

  const existingUser = await findUserByEmail(staff.email);
  if (existingUser) {
    throw new StaffServiceError(
      "A user account with this email already exists",
      "USER_EXISTS",
      409
    );
  }

  const password = generateRandomPassword();
  const hashedPassword = await hashPassword(password);

  const roleMap: Record<string, Role> = {
    RECEPTIONIST: Role.RECEPTIONIST,
    NURSE: Role.STAFF,
    TECHNICIAN: Role.STAFF,
    PHARMACIST: Role.STAFF,
    LAB_TECHNICIAN: Role.STAFF,
    ACCOUNTANT: Role.STAFF,
    ADMIN: Role.STAFF,
    SUPPORT: Role.STAFF,
    OTHER: Role.STAFF,
  };

  const userRole = roleMap[staff.role] || Role.STAFF;

  const user = await createUser({
    name: staff.name,
    email: staff.email,
    password: hashedPassword,
    role: userRole,
    isActive: staff.isActive,
    hospital: { connect: { id: hospitalId } },
  });

  await updateStaffRepo(staffId, hospitalId, {
    user: { connect: { id: user.id } },
    credentialsSent: true,
    password: hashedPassword,
  });

  return {
    email: staff.email,
    password,
    userId: user.id,
  };
};

export const resendStaffCredentials = async (
  staffId: string,
  hospitalId: string
): Promise<{ email: string; password: string }> => {
  const staff = await findStaffById(staffId, hospitalId) as any;
  if (!staff) {
    throw new StaffServiceError("Staff member not found", "NOT_FOUND", 404);
  }

  if (!staff.credentialsSent || !staff.userId) {
    throw new StaffServiceError(
      "Credentials have not been sent yet. Use Send Credentials instead.",
      "CREDENTIALS_NOT_SENT",
      400
    );
  }

  const newPassword = generateRandomPassword();
  const hashedPassword = await hashPassword(newPassword);

  await updateUser(staff.userId, { password: hashedPassword });

  await updateStaffRepo(staffId, hospitalId, {
    password: hashedPassword,
    mustChangePassword: true,
  } as any);

  return { email: staff.email, password: newPassword };
};

export const staffLogin = async (email: string, password: string) => {
  const staff = await findStaffByEmailGlobal(email) as any;
  if (!staff || !staff.password) {
    throw new StaffServiceError("Invalid credentials", "INVALID_CREDENTIALS", 401);
  }

  if (!staff.isActive) {
    throw new StaffServiceError("Your account is inactive", "INACTIVE_ACCOUNT", 403);
  }

  const isPasswordValid = await comparePassword(password, staff.password);
  if (!isPasswordValid) {
    throw new StaffServiceError("Invalid credentials", "INVALID_CREDENTIALS", 401);
  }

  if (!staff.userId) {
    throw new StaffServiceError("User account not linked", "NO_USER_ACCOUNT", 500);
  }

  const tokenParams = {
    userId: staff.userId,
    role: staff.user?.role || Role.STAFF,
    hospitalId: staff.hospitalId,
  };

  const token = generateToken(tokenParams);

  return {
    token,
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      hospitalId: staff.hospitalId,
      mustChangePassword: staff.mustChangePassword,
    },
  };
};

export const changeStaffPassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const staff = await findStaffByUserId(userId);
  if (!staff || !staff.password) {
    throw new StaffServiceError("Staff member not found", "NOT_FOUND", 404);
  }

  const isOldPasswordValid = await comparePassword(oldPassword, staff.password);
  if (!isOldPasswordValid) {
    throw new StaffServiceError("Old password is incorrect", "INVALID_PASSWORD", 400);
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await updateStaffRepo(staff.id, staff.hospitalId, {
    password: hashedNewPassword,
    mustChangePassword: false,
  });

  return { success: true };
};

export const getStaffStats = async (hospitalId: string) => {
  const [total, active, roleGroups] = await Promise.all([
    countStaff(hospitalId),
    countStaff(hospitalId, { isActive: true }),
    prisma.staff.groupBy({
      by: ["role"],
      where: { hospitalId },
      _count: { role: true },
    }),
  ]);

  const byRole: Record<string, number> = {};
  roleGroups.forEach((g: any) => { byRole[g.role] = g._count.role; });

  return {
    total,
    active,
    inactive: total - active,
    byRole,
  };
};
