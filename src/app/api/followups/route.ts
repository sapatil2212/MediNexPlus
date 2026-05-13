import { NextRequest } from "next/server";
import { requireRole } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import {
  scheduleFollowUp,
  getFollowUps,
  getStats,
  FollowUpServiceError,
} from "../../../../backend/services/followup.service";
import {
  createFollowUpSchema,
  queryFollowUpSchema,
} from "../../../../backend/validations/followup.validation";
import { notifyFollowUpScheduled } from "../../../../backend/services/notification.service";

const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR"];

// GET /api/followups
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("stats") === "true") {
      const stats = await getStats(auth.hospitalId);
      return successResponse(stats, "Follow-up statistics");
    }

    const queryParams = {
      patientId: searchParams.get("patientId") || undefined,
      appointmentId: searchParams.get("appointmentId") || undefined,
      status: searchParams.get("status") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      today: searchParams.get("today") || undefined,
      upcoming: searchParams.get("upcoming") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sortBy: searchParams.get("sortBy") || "followUpDate",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    const validated = queryFollowUpSchema.safeParse(queryParams);
    if (!validated.success) {
      return errorResponse("Invalid query parameters", 400, validated.error.issues);
    }

    const result = await getFollowUps({ hospitalId: auth.hospitalId, ...validated.data });
    return successResponse(result, "Follow-ups fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/followups
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = createFollowUpSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const followUp = await scheduleFollowUp(auth.hospitalId, result.data);
    notifyFollowUpScheduled(auth.hospitalId, {
      patientName: (followUp as any).patient?.name || "Patient",
      followUpDate: new Date((followUp as any).followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    }).catch(() => {});
    return successResponse(followUp, "Follow-up scheduled successfully", 201);
  } catch (e: any) {
    if (e instanceof FollowUpServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}
