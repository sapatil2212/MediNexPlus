import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../../../backend/utils/response";
import prisma from "../../../../../../../../backend/config/db";
import { sendPayslipEmail } from "../../../../../../../../backend/utils/mailer";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { payslipId } = body;
    if (!payslipId) return errorResponse("payslipId required", 400);

    const payslip = await (prisma as any).staffPayslip.findFirst({
      where: { id: payslipId, hospitalId: auth.hospitalId, staffId: params.id },
    });
    if (!payslip) return errorResponse("Payslip not found", 404);

    const staff = await (prisma as any).staff.findFirst({
      where: { id: params.id, hospitalId: auth.hospitalId },
    });
    if (!staff || !staff.email) return errorResponse("Staff email not found", 400);

    const settings = await (prisma as any).hospitalSettings.findUnique({ where: { hospitalId: auth.hospitalId } });
    const hospitalName = settings?.hospitalName || "Hospital";
    const hospitalLogo = settings?.logo || null;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[payslip.month - 1] || "";

    await sendPayslipEmail({
      to: staff.email,
      staffName: staff.name,
      month: `${monthName} ${payslip.year}`,
      netPay: payslip.netPay,
      hospitalName,
      hospitalLogo,
    });

    await (prisma as any).staffPayslip.update({
      where: { id: payslipId },
      data: { emailSentAt: new Date() },
    });

    return successResponse({ emailSentAt: new Date() }, `Payslip emailed to ${staff.email}`);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to email payslip", 500);
  }
}
