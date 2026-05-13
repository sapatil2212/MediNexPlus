import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getAllBeds, createBedService, bulkCreateBeds, getBedStatsService, BedServiceError,
} from "../../../../../backend/services/bed.service";
import { z } from "zod";

const createSchema = z.object({
  wardId: z.string().min(1),
  roomId: z.string().optional(),
  bedNumber: z.string().min(1),
  bedType: z.enum(["NORMAL","ICU","VENTILATOR","ELECTRIC","PEDIATRIC"]).optional(),
  pricePerDay: z.number().min(0).optional(),
});

const bulkSchema = z.object({
  wardId: z.string().min(1),
  roomId: z.string().min(1),
  count: z.number().int().min(1).max(50),
  prefix: z.string().optional(),
  startFrom: z.number().int().min(1).optional(),
  bedType: z.enum(["NORMAL","ICU","VENTILATOR","ELECTRIC","PEDIATRIC"]).optional(),
  pricePerDay: z.number().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const sp = req.nextUrl.searchParams;
    if (sp.get("stats") === "true") {
      const wardId = sp.get("wardId") || undefined;
      const data = await getBedStatsService(auth.hospitalId, wardId);
      return successResponse(data, "Stats fetched");
    }
    const filters = {
      wardId: sp.get("wardId") || undefined,
      roomId: sp.get("roomId") || undefined,
      status: sp.get("status") || undefined,
      bedType: sp.get("bedType") || undefined,
    };
    const data = await getAllBeds(auth.hospitalId, filters);
    return successResponse(data, "Beds fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (body.bulk === true) {
      const result = bulkSchema.safeParse(body);
      if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
      const data = await bulkCreateBeds(auth.hospitalId, result.data);
      return successResponse(data, `${result.data.count} beds created`, 201);
    }
    const result = createSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await createBedService(auth.hospitalId, result.data);
    return successResponse(data, "Bed created", 201);
  } catch (e: any) {
    if (e instanceof BedServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message || "Server error", 500);
  }
}
