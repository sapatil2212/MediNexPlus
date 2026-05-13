import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";
import { notify } from "../../../../../backend/services/notification.service";

// GET /api/followups/reminders — fetch overdue + today's PENDING follow-ups
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  const hospitalId = user!.hospitalId;
  if (!hospitalId) return errorResponse("No hospital context", 400);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [overdue, dueToday] = await Promise.all([
    prisma.followUp.findMany({
      where: { hospitalId, status: "PENDING", followUpDate: { lt: todayStart } },
      include: { patient: { select: { id: true, patientId: true, name: true, phone: true } } },
      orderBy: { followUpDate: "asc" },
      take: 50,
    }),
    prisma.followUp.findMany({
      where: { hospitalId, status: "PENDING", followUpDate: { gte: todayStart, lt: todayEnd } },
      include: { patient: { select: { id: true, patientId: true, name: true, phone: true } } },
      orderBy: { followUpDate: "asc" },
    }),
  ]);

  return successResponse(
    { overdue, dueToday, counts: { overdue: overdue.length, dueToday: dueToday.length } },
    "Reminders fetched"
  );
}

// POST /api/followups/reminders — fire notifications for overdue/today follow-ups
// Body: { type?: "overdue"|"today"|"both", followUpId?: string } — followUpId for individual send
export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  const allowed = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF"];
  if (!allowed.includes(user!.role)) return errorResponse("Forbidden", 403);
  const hospitalId = user!.hospitalId;
  if (!hospitalId) return errorResponse("No hospital context", 400);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const body = await req.json().catch(() => ({}));

  // ── Individual send ──────────────────────────────────────────────────────────
  if (body.followUpId) {
    const fu = await prisma.followUp.findFirst({
      where: { id: body.followUpId, hospitalId },
      include: { patient: { select: { id: true, name: true } } },
    });
    if (!fu) return errorResponse("Follow-up not found", 404);

    const isOverdue = new Date(fu.followUpDate) < todayStart;
    await notify({
      hospitalId,
      type:       "FOLLOW_UP_SCHEDULED",
      title:      isOverdue ? `Overdue Follow-up: ${fu.patient?.name}` : `Follow-up Reminder: ${fu.patient?.name}`,
      message:    isOverdue
        ? `Follow-up for ${fu.patient?.name} was due on ${new Date(fu.followUpDate).toLocaleDateString("en-IN")} and is overdue.`
        : `Follow-up for ${fu.patient?.name} is due on ${new Date(fu.followUpDate).toLocaleDateString("en-IN")}.${fu.reason ? ` Reason: ${fu.reason}` : ""}`,
      targetRole: "HOSPITAL_ADMIN",
      metadata:   { followUpId: fu.id, patientId: fu.patientId, patientName: fu.patient?.name },
    });
    return successResponse({ fired: 1 }, "Reminder sent");
  }

  // ── Bulk send (admin only) ───────────────────────────────────────────────────
  if (user!.role !== "HOSPITAL_ADMIN") return errorResponse("Bulk reminders require HOSPITAL_ADMIN role", 403);

  const type: "overdue" | "today" | "both" = body.type || "both";
  const where: any = { hospitalId, status: "PENDING" };
  if (type === "overdue")    where.followUpDate = { lt: todayStart };
  else if (type === "today") where.followUpDate = { gte: todayStart, lt: todayEnd };
  else                       where.followUpDate = { lt: todayEnd };

  const followUps = await prisma.followUp.findMany({
    where,
    include: { patient: { select: { id: true, name: true } } },
    take: 100,
  });

  let fired = 0;
  for (const fu of followUps) {
    try {
      const isOverdue = new Date(fu.followUpDate) < todayStart;
      await notify({
        hospitalId,
        type:       "FOLLOW_UP_SCHEDULED",
        title:      isOverdue ? `Overdue Follow-up: ${fu.patient?.name}` : `Follow-up Due Today: ${fu.patient?.name}`,
        message:    isOverdue
          ? `Follow-up for ${fu.patient?.name} was due on ${new Date(fu.followUpDate).toLocaleDateString("en-IN")} and is overdue.`
          : `Follow-up for ${fu.patient?.name} is scheduled for today.${fu.reason ? ` Reason: ${fu.reason}` : ""}`,
        targetRole: "HOSPITAL_ADMIN",
        metadata:   { followUpId: fu.id, patientId: fu.patientId, patientName: fu.patient?.name },
      });
      fired++;
    } catch { /* continue */ }
  }

  return successResponse({ fired, total: followUps.length }, `Sent ${fired} reminder notification(s)`);
}
