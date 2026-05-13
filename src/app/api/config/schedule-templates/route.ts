import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  scheduleData: z.string(),
  doctorId: z.string().uuid().optional(),
});

// GET /api/config/schedule-templates - List all templates
export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const prisma = (await import("../../../../../backend/config/db")).default;
    
    // Check if doctorScheduleTemplate exists in Prisma client
    if (!(prisma as any).doctorScheduleTemplate) {
      console.warn("⚠️ Prisma client not regenerated - doctorScheduleTemplate model not available. Run 'npx prisma generate'");
      return successResponse([], "Templates not available - Prisma client needs regeneration");
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    const templates = await (prisma as any).doctorScheduleTemplate.findMany({
      where: {
        hospitalId: auth.hospitalId,
        ...(doctorId ? { OR: [{ doctorId }, { doctorId: null }] } : {}),
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return successResponse(templates, "Templates fetched successfully");
  } catch (e: any) {
    console.error("Template fetch error:", e);
    return successResponse([], "Templates temporarily unavailable");
  }
}

// POST /api/config/schedule-templates - Create new template
export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const prisma = (await import("../../../../../backend/config/db")).default;
    
    // Check if doctorScheduleTemplate exists in Prisma client
    if (!(prisma as any).doctorScheduleTemplate) {
      console.warn("⚠️ Prisma client not regenerated - doctorScheduleTemplate model not available. Run 'npx prisma generate'");
      return errorResponse("Template feature unavailable - Prisma client needs regeneration. Please stop server and run 'npx prisma generate'", 503);
    }

    const body = await req.json();
    const result = createTemplateSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const template = await (prisma as any).doctorScheduleTemplate.create({
      data: {
        hospitalId: auth.hospitalId,
        name: result.data.name,
        description: result.data.description,
        scheduleData: result.data.scheduleData,
        doctorId: result.data.doctorId || null,
      },
    });

    return successResponse(template, "Template created successfully", 201);
  } catch (e: any) {
    console.error("Template creation error:", e);
    return errorResponse(e.message || "Failed to create template", 500);
  }
}
