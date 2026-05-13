import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/appointments/stream
 * SSE stream for real-time new appointment alerts (admin & reception dashboards)
 * Polls for appointments created since last check and pushes them as events
 */
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hospitalId = user.hospitalId;
  if (!hospitalId) {
    return new Response("No hospital context", { status: 400 });
  }

  // Only allow admin and receptionist roles
  const allowedRoles = ["HOSPITAL_ADMIN", "RECEPTIONIST", "SUPER_ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let lastCheckTime = new Date();

  // Track already-notified appointment IDs to avoid duplicates
  const notifiedIds = new Set<string>();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial connection confirmation
      send({ connected: true, role: user.role });

      // Poll every 3 seconds for new appointments
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const checkTime = lastCheckTime;

          const newAppointments = await prisma.appointment.findMany({
            where: {
              hospitalId,
              createdAt: { gte: checkTime },
            },
            include: {
              patient: {
                select: {
                  id: true,
                  name: true,
                  patientId: true,
                  phone: true,
                  email: true,
                  gender: true,
                },
              },
              doctor: {
                select: {
                  id: true,
                  name: true,
                  specialization: true,
                },
              },
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          });

          for (const appt of newAppointments) {
            if (!notifiedIds.has(appt.id)) {
              notifiedIds.add(appt.id);
              send({
                type: "NEW_APPOINTMENT",
                appointment: {
                  id: appt.id,
                  tokenNumber: appt.tokenNumber,
                  patient: appt.patient,
                  doctor: appt.doctor,
                  department: appt.department,
                  appointmentDate: appt.appointmentDate,
                  timeSlot: appt.timeSlot,
                  type: appt.type,
                  status: appt.status,
                  consultationFee: appt.consultationFee,
                  notes: appt.notes,
                  createdAt: appt.createdAt,
                },
                timestamp: new Date().toISOString(),
              });
            }
          }

          lastCheckTime = new Date();
        } catch (err) {
          console.error("Appointment stream error:", err);
        }
      }, 3000);

      // Heartbeat every 25 seconds
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          closed = true;
          clearInterval(heartbeat);
          clearInterval(interval);
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
