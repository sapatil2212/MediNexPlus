import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { createStaffCredentials } from "../../../../../../backend/services/staff.service";
import { sendStaffCredentials } from "../../../../../../backend/utils/mailer";
import prisma from "../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

// POST /api/config/staff/send-credentials-bulk
// Sends credentials to all staff where credentialsSent=false
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: auth.hospitalId },
      select: { name: true },
    });
    const hospitalName = hospital?.name || "Hospital";
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;

    const staffList = await prisma.staff.findMany({
      where: { hospitalId: auth.hospitalId, credentialsSent: false },
      take: 100,
    });

    if (staffList.length === 0) {
      return successResponse({ sent: 0, failed: 0 }, "All staff already have credentials");
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const member of staffList) {
      try {
        const credentials = await createStaffCredentials(member.id, auth.hospitalId);

        try {
          await sendStaffCredentials({
            to:           credentials.email,
            name:         member.name,
            email:        credentials.email,
            password:     credentials.password,
            role:         member.role.replace(/_/g, " "),
            hospitalName,
            loginUrl,
          });
        } catch {
          // email failure is non-fatal
        }
        sent++;
      } catch (e: any) {
        failed++;
        errors.push(`${member.name}: ${e.message}`);
      }
    }

    return successResponse(
      { sent, failed, total: staffList.length, errors },
      `Credentials sent to ${sent} staff member(s)${failed > 0 ? `, ${failed} failed` : ""}`
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
