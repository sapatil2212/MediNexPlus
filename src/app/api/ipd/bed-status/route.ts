import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getBedStatusOverviewService, getAllAllocationsService, updateBedStatusService, AllocationServiceError,
} from "../../../../../backend/services/allocation.service";
import { z } from "zod";

const statusSchema = z.object({
  bedId: z.string().min(1),
  status: z.enum(["AVAILABLE","MAINTENANCE","RESERVED"]),
});

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type");
    if (type === "allocations") {
      const status = sp.get("status") || undefined;
      const data = await getAllAllocationsService(auth.hospitalId, status);
      return successResponse(data, "Allocations fetched");
    }
    const raw = await getBedStatusOverviewService(auth.hospitalId);
    const beds: any[] = raw.beds || [];

    // Group beds by ward
    const wardMap = new Map<string, any>();
    for (const bed of beds) {
      const w = bed.ward;
      const wardKey = w?.id || "_no_ward";
      if (!wardMap.has(wardKey)) {
        wardMap.set(wardKey, {
          id: wardKey,
          name: w?.name || "Unknown Ward",
          type: w?.type || "GENERAL",
          totalBeds: 0, availableBeds: 0, occupiedBeds: 0, beds: [],
        });
      }
      const ward = wardMap.get(wardKey)!;
      const activeAllocation = bed.allocations?.[0] || null;
      ward.beds.push({
        id: bed.id,
        bedNumber: bed.bedNumber,
        status: bed.status,
        type: bed.type,
        activeAllocation,
      });
      ward.totalBeds++;
      if (bed.status === "AVAILABLE") ward.availableBeds++;
      if (bed.status === "OCCUPIED") ward.occupiedBeds++;
    }

    const summary = {
      total: beds.length,
      available: beds.filter(b => b.status === "AVAILABLE").length,
      occupied: beds.filter(b => b.status === "OCCUPIED").length,
      maintenance: beds.filter(b => b.status === "MAINTENANCE").length,
      reserved: beds.filter(b => b.status === "RESERVED").length,
    };

    return successResponse({ wards: Array.from(wardMap.values()), summary }, "Bed status overview fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = statusSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await updateBedStatusService(auth.hospitalId, result.data.bedId, result.data.status);
    return successResponse(data, "Bed status updated");
  } catch (e: any) {
    if (e instanceof AllocationServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message, 500);
  }
}
