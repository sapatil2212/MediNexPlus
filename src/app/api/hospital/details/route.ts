import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { roleMiddleware } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import { getHospitalDetailsService } from "../../../../../backend/services/hospital.service";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await authMiddleware(req);
    if (authError) return authError;

    // Must be at least hospital admin or part of the hospital staff to view details
    const roleCheck = roleMiddleware(user!, [Role.SUPER_ADMIN, Role.HOSPITAL_ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.STAFF, Role.SUB_DEPT_HEAD]);
    if (roleCheck.error) return roleCheck.error;

    if (!user!.hospitalId && user!.role !== Role.SUPER_ADMIN) {
      return errorResponse("No hospital linked to user", 400);
    }

    // You can also add query params `?id=xxx` for SUPER_ADMIN to check other hospitals.
    // Defaulting to user's hospitalId.
    const hospitalIdToFetch = user!.hospitalId as string;

    const details = await getHospitalDetailsService(hospitalIdToFetch);
    return successResponse(details, "Hospital details fetched");
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}
