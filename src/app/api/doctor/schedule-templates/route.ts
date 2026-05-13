import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";

async function getDoctor(userId: string) {
  const prisma = (await import("../../../../../backend/config/db")).default;
  return (prisma as any).doctor.findFirst({ where: { userId } });
}

// GET /api/doctor/schedule-templates
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const prisma = (await import("../../../../../backend/config/db")).default;
    const templates = await (prisma as any).doctorScheduleTemplate.findMany({
      where: {
        hospitalId: doctor.hospitalId,
        OR: [
          { doctorId: doctor.id }, // Doctor's own templates
          { doctorId: null },      // Hospital-wide templates
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(templates, "Templates fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch templates", 500);
  }
}

// POST /api/doctor/schedule-templates
export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const body = await req.json();
    if (!body.name || !body.scheduleData) {
      return errorResponse("Name and scheduleData are required", 400);
    }

    const prisma = (await import("../../../../../backend/config/db")).default;
    const template = await (prisma as any).doctorScheduleTemplate.create({
      data: {
        hospitalId: doctor.hospitalId,
        doctorId: doctor.id,
        name: body.name,
        description: body.description || null,
        scheduleData: typeof body.scheduleData === "string" ? body.scheduleData : JSON.stringify(body.scheduleData),
        isDefault: false,
      },
    });

    return successResponse(template, "Template created", 201);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to create template", 500);
  }
}
