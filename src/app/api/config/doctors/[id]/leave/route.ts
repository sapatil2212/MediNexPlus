import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import {
  createLeave,
  getDoctorLeaves,
  getUpcomingLeaves,
  getLeaveById,
  updateLeave,
  cancelLeave,
  checkDoctorAvailableOnDate,
  getDoctorLeaveStats,
  setLeaveApprovalStatus,
  LeaveServiceError,
} from "../../../../../../../backend/services/leave.service";
import {
  createLeaveSchema,
  queryLeaveSchema,
} from "../../../../../../../backend/validations/doctor.validation";
import { z } from "zod";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];

type Params = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/config/doctors/[id]/leave - Get doctor's leaves
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id: doctorId } = await params;
    const { searchParams } = new URL(req.url);

    // Get leave stats
    if (searchParams.get("stats") === "true") {
      const stats = await getDoctorLeaveStats(doctorId, auth.hospitalId);
      return successResponse(stats, "Leave statistics fetched");
    }

    // Check availability on a specific date
    const checkDate = searchParams.get("checkDate");
    if (checkDate) {
      const parsedDate = new Date(checkDate);
      if (isNaN(parsedDate.getTime())) {
        return errorResponse("Invalid date format", 400);
      }
      const availability = await checkDoctorAvailableOnDate(doctorId, auth.hospitalId, parsedDate);
      return successResponse(availability, "Availability checked");
    }

    // Get specific leave by ID
    const leaveId = searchParams.get("leaveId");
    if (leaveId) {
      const leave = await getLeaveById(leaveId, auth.hospitalId);
      return successResponse(leave, "Leave fetched");
    }

    // Get upcoming leaves only
    if (searchParams.get("upcoming") === "true") {
      const leaves = await getUpcomingLeaves(doctorId, auth.hospitalId);
      return successResponse(leaves, "Upcoming leaves fetched");
    }

    // Parse query parameters
    const queryParams = {
      upcoming: searchParams.get("upcoming") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    };

    const validatedQuery = queryLeaveSchema.safeParse(queryParams);
    if (!validatedQuery.success) {
      return errorResponse("Invalid query parameters", 400, validatedQuery.error.issues);
    }

    const result = await getDoctorLeaves(doctorId, auth.hospitalId, validatedQuery.data);
    return successResponse(result, "Leaves fetched");
  } catch (e: any) {
    if (e instanceof LeaveServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/config/doctors/[id]/leave - Create leave
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id: doctorId } = await params;
    const body = await req.json();

    const result = createLeaveSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const leave = await createLeave(doctorId, auth.hospitalId, result.data);
    return successResponse(leave, "Leave created successfully", 201);
  } catch (e: any) {
    if (e instanceof LeaveServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/config/doctors/[id]/leave - Update leave
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const leaveId = searchParams.get("leaveId");

    if (!leaveId) {
      return errorResponse("leaveId query parameter is required", 400);
    }

    const result = createLeaveSchema.partial().safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const response = await updateLeave(leaveId, auth.hospitalId, result.data);
    return successResponse(response, "Leave updated successfully");
  } catch (e: any) {
    if (e instanceof LeaveServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/config/doctors/[id]/leave - Approve/reject leave
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const leaveId = searchParams.get("leaveId");

    if (!leaveId) {
      return errorResponse("leaveId query parameter is required", 400);
    }

    const approvalSchema = z.object({
      isApproved: z.boolean(),
    });

    const result = approvalSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const response = await setLeaveApprovalStatus(leaveId, auth.hospitalId, result.data.isApproved);
    return successResponse(response, result.data.isApproved ? "Leave approved" : "Leave rejected");
  } catch (e: any) {
    if (e instanceof LeaveServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/config/doctors/[id]/leave - Cancel leave
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const leaveId = searchParams.get("leaveId");

    if (!leaveId) {
      return errorResponse("leaveId query parameter is required", 400);
    }

    const response = await cancelLeave(leaveId, auth.hospitalId);
    return successResponse(response, "Leave cancelled successfully");
  } catch (e: any) {
    if (e instanceof LeaveServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}
