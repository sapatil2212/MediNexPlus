import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getBedStatusOverviewService, getAllAllocationsService } from "../../../../../backend/services/allocation.service";

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const [overview, activeAdmissions] = await Promise.all([
      getBedStatusOverviewService(auth.hospitalId),
      getAllAllocationsService(auth.hospitalId, "ACTIVE"),
    ]);
    const beds: any[] = (overview as any).beds || [];
    const summary = {
      totalBeds: beds.length,
      availableBeds: beds.filter((b: any) => b.status === "AVAILABLE").length,
      occupiedBeds: beds.filter((b: any) => b.status === "OCCUPIED").length,
      maintenanceBeds: beds.filter((b: any) => b.status === "MAINTENANCE").length,
      reservedBeds: beds.filter((b: any) => b.status === "RESERVED").length,
      activeAdmissions: Array.isArray(activeAdmissions) ? activeAdmissions.length : 0,
    };
    return successResponse({ summary, activeAdmissions }, "IPD dashboard data fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Server error", 500);
  }
}
