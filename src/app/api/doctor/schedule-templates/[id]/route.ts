import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";

type Params = { params: Promise<{ id: string }> };

async function getDoctor(userId: string) {
  const prisma = (await import("../../../../../../backend/config/db")).default;
  return (prisma as any).doctor.findFirst({ where: { userId } });
}

// PUT /api/doctor/schedule-templates/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const { id } = await params;
    const body = await req.json();

    const prisma = (await import("../../../../../../backend/config/db")).default;
    
    // Verify ownership
    const existing = await (prisma as any).doctorScheduleTemplate.findUnique({
      where: { id },
    });

    if (!existing) return errorResponse("Template not found", 404);
    if (existing.doctorId !== doctor.id) {
      return errorResponse("You can only edit your own templates", 403);
    }

    const updated = await (prisma as any).doctorScheduleTemplate.update({
      where: { id },
      data: {
        name: body.name || existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        scheduleData: body.scheduleData ? (typeof body.scheduleData === "string" ? body.scheduleData : JSON.stringify(body.scheduleData)) : existing.scheduleData,
      },
    });

    return successResponse(updated, "Template updated");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to update template", 500);
  }
}

// DELETE /api/doctor/schedule-templates/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    const doctor = await getDoctor(user!.userId);
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const { id } = await params;
    const prisma = (await import("../../../../../../backend/config/db")).default;

    // Verify ownership
    const existing = await (prisma as any).doctorScheduleTemplate.findUnique({
      where: { id },
    });

    if (!existing) return errorResponse("Template not found", 404);
    if (existing.doctorId !== doctor.id) {
      return errorResponse("You can only delete your own templates", 403);
    }

    await (prisma as any).doctorScheduleTemplate.delete({ where: { id } });

    return successResponse(null, "Template deleted");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to delete template", 500);
  }
}
