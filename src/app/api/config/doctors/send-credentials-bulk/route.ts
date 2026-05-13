import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { hashPassword } from "../../../../../../backend/utils/hash";
import { sendDoctorCredentials } from "../../../../../../backend/utils/mailer";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import prisma from "../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

// POST /api/config/doctors/send-credentials-bulk
// Sends credentials to all doctors where credentialsSent=false
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: auth.hospitalId },
      include: { settings: true },
    });
    const hospitalName = (hospital as any)?.settings?.hospitalName || hospital?.name || "Hospital";
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;

    const chars    = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const specials = "!@#$%";

    const doctors = await prisma.doctor.findMany({
      where: { hospitalId: auth.hospitalId, credentialsSent: false, email: { not: "" } },
      take: 100,
    });

    if (doctors.length === 0) {
      return successResponse({ sent: 0, failed: 0 }, "All doctors already have credentials");
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const doctor of doctors) {
      try {
        const rawPassword =
          Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") +
          specials[Math.floor(Math.random() * specials.length)] +
          Math.floor(Math.random() * 90 + 10);

        const hashedPassword = await hashPassword(rawPassword);

        if (doctor.userId) {
          await prisma.user.update({
            where: { id: doctor.userId },
            data: { password: hashedPassword, isActive: true, role: "DOCTOR" },
          });
        } else {
          const existingUser = await prisma.user.findUnique({ where: { email: doctor.email } });
          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { password: hashedPassword, isActive: true, role: "DOCTOR" },
            });
            await prisma.doctor.update({ where: { id: doctor.id }, data: { userId: existingUser.id } });
          } else {
            const newUser = await prisma.user.create({
              data: {
                hospitalId: auth.hospitalId,
                name: doctor.name,
                email: doctor.email,
                password: hashedPassword,
                role: "DOCTOR",
                isActive: true,
              },
            });
            await prisma.doctor.update({ where: { id: doctor.id }, data: { userId: newUser.id } });
          }
        }

        await prisma.doctor.update({ where: { id: doctor.id }, data: { credentialsSent: true } });

        try {
          await sendDoctorCredentials({ to: doctor.email, name: doctor.name, email: doctor.email, password: rawPassword, hospitalName, loginUrl });
          sent++;
        } catch {
          sent++;
        }
      } catch (e: any) {
        failed++;
        errors.push(`${doctor.name}: ${e.message}`);
      }
    }

    return successResponse(
      { sent, failed, total: doctors.length, errors },
      `Credentials sent to ${sent} doctor(s)${failed > 0 ? `, ${failed} failed` : ""}`
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
