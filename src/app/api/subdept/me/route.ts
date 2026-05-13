import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile, SubDeptServiceError } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const hospitalId = (profile as any)?.hospitalId;

    // Fetch hospital settings (logo, name) for sidebar branding
    let hospitalSettings: any = null;
    if (hospitalId) {
      hospitalSettings = await (prisma as any).hospitalSettings.findUnique({
        where: { hospitalId },
        select: { logo: true, hospitalName: true },
      });
    }

    return successResponse({ ...profile, hospitalSettings }, "Profile fetched");
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed to fetch profile", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const subdeptId = (profile as any)?.id;
    const hospitalId = (profile as any)?.hospitalId;
    if (!subdeptId) return errorResponse("Sub-department not found", 404);

    const body = await req.json();
    const allowed = ["name", "description", "hodPhone", "hodEmail", "hodName", "color"];
    const updateData: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updated = await (prisma as any).subDepartment.update({
      where: { id: subdeptId, hospitalId },
      data: updateData,
    });
    return successResponse(updated, "Department profile updated successfully");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update department profile", 500);
  }
}
