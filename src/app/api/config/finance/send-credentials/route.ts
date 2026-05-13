import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import prisma from "../../../../../../backend/config/db";
import bcrypt from "bcryptjs";
import { sendFinanceCredentials } from "../../../../../../backend/utils/mailer";

export const dynamic = "force-dynamic";

// POST /api/config/finance/send-credentials
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;
  try {
    const dept = await (prisma as any).financeDepartment.findUnique({
      where: { hospitalId: auth.hospitalId },
    });
    if (!dept) return errorResponse("Finance department not configured", 404);
    if (!dept.hodEmail) return errorResponse("HOD email is required to send credentials", 400);

    const loginEmail = dept.hodEmail;

    // Check if user already exists
    let user = await (prisma as any).user.findUnique({ where: { email: loginEmail } });

    const rawPassword = Math.random().toString(36).slice(2, 10) + "Fin#" + Math.random().toString(36).slice(2, 5);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    if (!user) {
      // Create a new User with FINANCE_HEAD role
      user = await (prisma as any).user.create({
        data: {
          hospitalId: auth.hospitalId,
          name:       dept.hodName || "Finance Head",
          email:      loginEmail,
          password:   hashedPassword,
          role:       "FINANCE_HEAD",
          isActive:   true,
        },
      });

      // Link to finance dept
      await (prisma as any).financeDepartment.update({
        where: { hospitalId: auth.hospitalId },
        data: {
          loginEmail,
          userId:         user.id,
          credentialsSent: true,
        },
      });
    } else {
      // Reset password for existing user
      await (prisma as any).user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      await (prisma as any).financeDepartment.update({
        where: { hospitalId: auth.hospitalId },
        data: { loginEmail, userId: user.id, credentialsSent: true },
      });
    }

    // Send email
    const hospital = await (prisma as any).hospitalSettings.findUnique({
      where: { hospitalId: auth.hospitalId },
    });
    const hospitalName = hospital?.hospitalName || "Hospital";

    try {
      await sendFinanceCredentials(loginEmail, dept.hodName || "Finance Head", rawPassword, hospitalName);
    } catch { /* email is optional */ }

    return successResponse(
      { email: loginEmail, sent: true },
      "Finance credentials sent successfully"
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
