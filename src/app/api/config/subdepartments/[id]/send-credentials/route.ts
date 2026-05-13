import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import {
  createSubDeptCredentials,
  resendSubDeptCredentials,
  SubDeptServiceError,
} from "../../../../../../../backend/services/subdepartment.service";
import { sendSubDeptCredentials } from "../../../../../../../backend/utils/mailer";
import prisma from "../../../../../../../backend/config/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  const isResend = req.nextUrl.searchParams.get("resend") === "true";

  try {
    const credentials = isResend
      ? await resendSubDeptCredentials(params.id, auth.hospitalId)
      : await createSubDeptCredentials(params.id, auth.hospitalId);

    const [hospital, subDept] = await Promise.all([
      prisma.hospital.findUnique({ where: { id: auth.hospitalId }, select: { name: true } }),
      prisma.subDepartment.findFirst({
        where: { id: params.id, hospitalId: auth.hospitalId },
        select: { name: true, hodName: true, loginEmail: true, type: true },
      }),
    ]);

    if (!subDept) return errorResponse("Sub-department not found", 404);

    const hospitalName = hospital?.name || "Hospital";
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subdept/login`;

    await sendSubDeptCredentials({
      to: credentials.email,
      name: subDept.hodName || subDept.name,
      email: credentials.email,
      password: credentials.password,
      deptName: subDept.name,
      deptType: subDept.type,
      hospitalName,
      loginUrl,
    });

    return successResponse(
      { email: credentials.email },
      isResend ? "New login credentials sent successfully" : "Login credentials sent successfully"
    );
  } catch (error: any) {
    if (error instanceof SubDeptServiceError) return errorResponse(error.message, error.status);
    return errorResponse(error.message || "Failed to send credentials", 500);
  }
}
