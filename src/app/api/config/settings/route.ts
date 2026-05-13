import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSettings, upsertSettings, getSetupProgress } from "../../../../../backend/services/config.service";
import { z } from "zod";

const settingsSchema = z.object({
  hospitalName: z.string().min(2),
  logo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  gstNumber: z.string().optional(),
  registrationNo: z.string().optional(),
  letterhead: z.string().optional().nullable(),
  letterheadType: z.enum(["IMAGE", "PDF"]).optional(),
  letterheadSize: z.enum(["A4", "A5", "Letter"]).optional(),
});

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  const hospitalId = user!.hospitalId;
  if (!hospitalId) return errorResponse("No hospital associated with this account", 403);
  const auth = { user: user!, hospitalId };

  try {
    const [settings, progress] = await Promise.all([
      getSettings(auth.hospitalId),
      getSetupProgress(auth.hospitalId),
    ]);
    return successResponse({ settings, progress }, "Settings fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = settingsSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    // Transform null to undefined for letterhead since upsertSettings expects string | undefined
    const data = {
      ...result.data,
      letterhead: result.data.letterhead ?? undefined,
    };

    const settings = await upsertSettings(auth.hospitalId, data);
    return successResponse(settings, "Settings saved", 201);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  return POST(req); // Upsert handles both create & update
}
