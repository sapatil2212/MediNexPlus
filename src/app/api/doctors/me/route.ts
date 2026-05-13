import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";
import { z } from "zod";

const updateDoctorSelfSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  profileImage: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  qualification: z.string().optional().nullable(),
  experience: z.number().int().min(0).optional(),
  registrationNo: z.string().optional().nullable(),
  licenseNo: z.string().optional().nullable(),
  agreementDoc: z.string().optional().nullable(),
  govtIdCard: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
  hospitalStamp: z.string().optional().nullable(),
  consultationFee: z.number().min(0).optional(),
  followUpFee: z.number().min(0).optional().nullable(),
  isAvailable: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  try {
    if (user?.role !== "DOCTOR") {
      return errorResponse("Unauthorized: Only doctors can access this endpoint", 403);
    }

    const doctor = await (prisma as any).doctor.findFirst({
      where: { userId: user.userId },
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, name: true, profilePhoto: true, userCode: true, createdAt: true } },
      },
    });

    if (!doctor) {
      return errorResponse("Doctor profile not found", 404);
    }

    let hospitalSettings: any = null;
    if (doctor.hospitalId) {
      hospitalSettings = await (prisma as any).hospitalSettings.findUnique({
        where: { hospitalId: doctor.hospitalId },
        select: { logo: true, hospitalName: true },
      });
    }

    return successResponse({
      id: doctor.id,
      doctorCode: doctor.doctorCode,
      hospitalId: doctor.hospitalId,
      name: doctor.name,
      email: doctor.email || doctor.user?.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      consultationFee: doctor.consultationFee,
      followUpFee: doctor.followUpFee,
      profileImage: doctor.profileImage,
      gender: doctor.gender,
      isAvailable: doctor.isAvailable,
      isActive: doctor.isActive,
      address: doctor.address,
      bloodGroup: doctor.bloodGroup,
      dateOfBirth: doctor.dateOfBirth,
      registrationNo: doctor.registrationNo,
      licenseNo: doctor.licenseNo,
      agreementDoc: doctor.agreementDoc,
      govtIdCard: doctor.govtIdCard,
      signature: doctor.signature,
      hospitalStamp: doctor.hospitalStamp,
      credentialsSent: doctor.credentialsSent,
      userId: doctor.userId,
      prescriptionSettings: doctor.prescriptionSettings,
      departmentId: doctor.departmentId,
      department: doctor.department,
      user: doctor.user,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
      hospitalSettings,
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch doctor profile", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  try {
    if (user?.role !== "DOCTOR") {
      return errorResponse("Unauthorized: Only doctors can access this endpoint", 403);
    }

    const body = await req.json();
    const result = updateDoctorSelfSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const existing = await (prisma as any).doctor.findFirst({ where: { userId: user.userId } });
    if (!existing) {
      return errorResponse("Doctor profile not found", 404);
    }

    const data = result.data;
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
    if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.qualification !== undefined) updateData.qualification = data.qualification;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.registrationNo !== undefined) updateData.registrationNo = data.registrationNo;
    if (data.licenseNo !== undefined) updateData.licenseNo = data.licenseNo;
    if (data.agreementDoc !== undefined) updateData.agreementDoc = data.agreementDoc;
    if (data.govtIdCard !== undefined) updateData.govtIdCard = data.govtIdCard;
    if (data.signature !== undefined) updateData.signature = data.signature;
    if (data.hospitalStamp !== undefined) updateData.hospitalStamp = data.hospitalStamp;
    if (data.consultationFee !== undefined) updateData.consultationFee = data.consultationFee;
    if (data.followUpFee !== undefined) updateData.followUpFee = data.followUpFee;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }

    const updated = await (prisma as any).doctor.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, name: true, profilePhoto: true } },
      },
    });

    return successResponse(updated, "Profile updated successfully");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update doctor profile", 500);
  }
}
