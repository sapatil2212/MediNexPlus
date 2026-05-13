import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  if (user!.role !== "DOCTOR") {
    return errorResponse("Forbidden: Doctor access required", 403);
  }

  try {
    const doctor = await prisma.doctor.findFirst({
      where: { userId: user!.userId },
      include: {
        department: { select: { id: true, name: true, code: true } },
        hospital: { select: { id: true, name: true, email: true, mobile: true, settings: true } },
        availability: { where: { isActive: true }, orderBy: { day: "asc" } },
        _count: { select: { availability: true, leaves: true } },
      },
    });

    if (!doctor) return errorResponse("Doctor profile not found", 404);

    if ((doctor as any).hospital?.id) {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT *
        FROM HospitalSettings
        WHERE hospitalId = ${(doctor as any).hospital.id}
        LIMIT 1
      `;
      const settings = rows?.[0] || null;
      (doctor as any).hospital.settings = settings;
    }

    return successResponse(doctor, "Doctor profile fetched successfully");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch profile", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  if (user!.role !== "DOCTOR") {
    return errorResponse("Forbidden: Doctor access required", 403);
  }

  try {
    const body = await req.json();
    const doctor = await prisma.doctor.findFirst({
      where: { userId: user!.userId },
    });

    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        signature: body.signature !== undefined ? body.signature : undefined,
        hospitalStamp: body.hospitalStamp !== undefined ? body.hospitalStamp : undefined,
        prescriptionSettings: body.prescriptionSettings !== undefined ? body.prescriptionSettings : undefined,
      },
    });

    return successResponse(updatedDoctor, "Profile updated successfully");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to update profile", 500);
  }
}
