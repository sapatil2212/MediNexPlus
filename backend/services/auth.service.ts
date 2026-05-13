import { findUserByEmail, createUser } from "../repositories/user.repo";
import { createHospital } from "../repositories/hospital.repo";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";
import { Role } from "@prisma/client";
import { verifyOTP } from "./otp.service";

export const signupHospitalService = async (data: any) => {
  const { hospitalName, mobile, email, password, adminName, otp } = data;

  // Verify OTP
  try {
    await verifyOTP(email, otp);
  } catch (error: any) {
    throw new Error(error.message);
  }

  // Check if hospital admin already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create Hospital
  const newHospital = await createHospital({
    name: hospitalName,
    mobile,
    email,
    isVerified: true,
  });

  // Create Admin User
  const newUser = await createUser({
    name: adminName,
    email,
    password: hashedPassword,
    role: Role.HOSPITAL_ADMIN,
    hospital: { connect: { id: newHospital.id } },
  });

  return { hospital: newHospital, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } };
};

export const loginUserService = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) {
    throw new Error("Invalid credentials or inactive user");
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const tokenParams = {
    userId: user.id,
    role: user.role,
    hospitalId: user.hospitalId,
  };

  const token = generateToken(tokenParams);

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, hospitalId: user.hospitalId } };
};
