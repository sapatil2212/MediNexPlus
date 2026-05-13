import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import {
  createStaffCredentials,
  resendStaffCredentials,
  StaffServiceError,
} from "../../../../../../../backend/services/staff.service";
import { sendStaffCredentials } from "../../../../../../../backend/utils/mailer";
import prisma from "../../../../../../../backend/config/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  const isResend = req.nextUrl.searchParams.get("resend") === "true";

  try {
    const credentials = isResend
      ? await resendStaffCredentials(params.id, auth.hospitalId)
      : await createStaffCredentials(params.id, auth.hospitalId);

    const [hospital, staff] = await Promise.all([
      prisma.hospital.findUnique({ where: { id: auth.hospitalId }, select: { name: true } }),
      prisma.staff.findFirst({ where: { id: params.id, hospitalId: auth.hospitalId }, select: { name: true, email: true, role: true } }),
    ]);

    if (!staff) return errorResponse("Staff member not found", 404);

    const hospitalName = hospital?.name || "Hospital";
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;

    await sendStaffCredentials({
      to: credentials.email,
      name: staff.name,
      email: credentials.email,
      password: credentials.password,
      role: staff.role.replace(/_/g, " "),
      hospitalName,
      loginUrl,
    });

    return successResponse(
      { email: credentials.email },
      isResend
        ? "New login credentials sent successfully to staff member's email"
        : "Login credentials sent successfully to staff member's email"
    );
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error.message || "Failed to send credentials", 500);
  }
}
