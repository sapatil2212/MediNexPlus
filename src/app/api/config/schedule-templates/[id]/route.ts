import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";

type Params = { params: Promise<{ id: string }> };

// PUT /api/config/schedule-templates/[id] - Full update (name, description, scheduleData)
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const prisma = (await import("../../../../../../backend/config/db")).default;
    const { id } = await params;
    const body = await req.json();

    const template = await (prisma as any).doctorScheduleTemplate.findFirst({
      where: { id, hospitalId: auth.hospitalId },
    });
    if (!template) return errorResponse("Template not found", 404);

    const data: any = {};
    if (body.name) data.name = body.name.trim();
    if (body.description !== undefined) data.description = body.description;
    if (body.scheduleData) data.scheduleData = typeof body.scheduleData === "string" ? body.scheduleData : JSON.stringify(body.scheduleData);

    const updated = await (prisma as any).doctorScheduleTemplate.update({
      where: { id },
      data,
    });

    return successResponse(updated, "Template updated successfully");
  } catch (e: any) {
    console.error("Template update error:", e);
    return errorResponse(e.message || "Failed to update template", 500);
  }
}

// PATCH /api/config/schedule-templates/[id] - Rename template
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const prisma = (await import("../../../../../../backend/config/db")).default;
    const { id } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name?.trim()) return errorResponse("Name is required", 400);

    const template = await (prisma as any).doctorScheduleTemplate.findFirst({
      where: { id, hospitalId: auth.hospitalId },
    });
    if (!template) return errorResponse("Template not found", 404);

    const updated = await (prisma as any).doctorScheduleTemplate.update({
      where: { id },
      data: { name: name.trim() },
    });

    return successResponse(updated, "Template renamed successfully");
  } catch (e: any) {
    console.error("Template rename error:", e);
    return errorResponse(e.message || "Failed to rename template", 500);
  }
}

// DELETE /api/config/schedule-templates/[id] - Delete template
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const prisma = (await import("../../../../../../backend/config/db")).default;
    const { id } = await params;

    const template = await (prisma as any).doctorScheduleTemplate.findFirst({
      where: { id, hospitalId: auth.hospitalId },
    });
    if (!template) return errorResponse("Template not found", 404);

    await (prisma as any).doctorScheduleTemplate.delete({ where: { id } });

    return successResponse({ id }, "Template deleted successfully");
  } catch (e: any) {
    console.error("Template deletion error:", e);
    return errorResponse(e.message || "Failed to delete template", 500);
  }
}
