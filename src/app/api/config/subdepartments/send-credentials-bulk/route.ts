import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { createSubDeptCredentials } from "../../../../../../backend/services/subdepartment.service";
import { sendSubDeptCredentials } from "../../../../../../backend/utils/mailer";
import prisma from "../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

// POST /api/config/subdepartments/send-credentials-bulk
// Sends credentials to all sub-departments where credentialsSent=false
export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: auth.hospitalId },
      select: { name: true },
    });
    const hospitalName = hospital?.name || "Hospital";
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subdept/login`;

    const subDepts = await (prisma as any).subDepartment.findMany({
      where: { hospitalId: auth.hospitalId, credentialsSent: false },
      take: 100,
    });

    if (subDepts.length === 0) {
      return successResponse({ sent: 0, failed: 0 }, "All sub-departments already have credentials");
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const sd of subDepts) {
      try {
        const credentials = await createSubDeptCredentials(sd.id, auth.hospitalId);

        try {
          await sendSubDeptCredentials({
            to:           credentials.email,
            name:         sd.hodName || sd.name,
            email:        credentials.email,
            password:     credentials.password,
            deptName:     sd.name,
            deptType:     sd.type,
            hospitalName,
            loginUrl,
          });
        } catch {
          // email failure is non-fatal
        }
        sent++;
      } catch (e: any) {
        failed++;
        errors.push(`${sd.name}: ${e.message}`);
      }
    }

    return successResponse(
      { sent, failed, total: subDepts.length, errors },
      `Credentials sent to ${sent} sub-department(s)${failed > 0 ? `, ${failed} failed` : ""}`
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
