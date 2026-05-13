import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import prisma from "../../../../../../backend/config/db";

const px = prisma as any;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/pharmacy/notifications/stream
 * Server-Sent Events stream for real-time pharmacy prescription notifications
 * Detects new prescriptions added to pharmacy queue and sends popup notifications
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

  // Get pharmacy sub-dept for this user
  let pharmacySubDeptId: string | null = null;
  if (user.role === "SUB_DEPT_HEAD") {
    const subDept = await px.subDepartment.findFirst({
      where: { userId: user.userId, hospitalId },
    });
    if (subDept) pharmacySubDeptId = subDept.id;
  } else {
    const subDept = await px.subDepartment.findFirst({
      where: { hospitalId, type: "PHARMACY" },
    });
    if (subDept) pharmacySubDeptId = subDept.id;
  }

  if (!pharmacySubDeptId) {
    return new Response("Pharmacy not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let lastCheckTime = new Date();

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
      send({ connected: true, pharmacyId: pharmacySubDeptId });

      // Track notified prescription IDs to avoid duplicates
      const notifiedRxIds = new Set<string>();

      // Poll for new prescriptions every 3 seconds
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const checkTime = lastCheckTime;
          
          // Find NEW prescriptions created since last check
          const newPrescriptions = await px.prescription.findMany({
            where: {
              hospitalId,
              createdAt: { gte: checkTime },
              medications: { not: null },
              OR: [
                { workflows: { some: { subDepartmentId: pharmacySubDeptId } } },
                { currentDeptId: pharmacySubDeptId },
              ],
            },
            include: {
              patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true } },
              doctor: { select: { id: true, name: true, specialization: true } },
              appointment: { select: { id: true, type: true, tokenNumber: true } },
              workflows: { where: { subDepartmentId: pharmacySubDeptId }, select: { id: true, status: true, totalCharge: true, charges: true }, take: 1 },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          });

          // Find prescriptions via NEW WORKFLOW STEPS (for referrals from doctor)
          const newWorkflowSteps = await px.prescriptionWorkflow.findMany({
            where: {
              hospitalId,
              subDepartmentId: pharmacySubDeptId,
              createdAt: { gte: checkTime },
            },
            include: {
              prescription: {
                include: {
                  patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true } },
                  doctor: { select: { id: true, name: true, specialization: true } },
                  appointment: { select: { id: true, type: true, tokenNumber: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          });

          // Combine and deduplicate
          const allNotifications = [];
          
          // Add new prescriptions
          for (const rx of newPrescriptions) {
            if (!notifiedRxIds.has(rx.id)) {
              allNotifications.push({ type: "prescription", data: rx });
              notifiedRxIds.add(rx.id);
            }
          }
          
          // Add prescriptions from new workflow steps
          for (const step of newWorkflowSteps) {
            if (step.prescription && !notifiedRxIds.has(step.prescription.id)) {
              allNotifications.push({ 
                type: "workflow", 
                data: step.prescription,
                workflow: { id: step.id, status: step.status, totalCharge: step.totalCharge, charges: step.charges }
              });
              notifiedRxIds.add(step.prescription.id);
            }
          }

          if (allNotifications.length > 0) {
            // Process and send notifications
            for (const item of allNotifications) {
              const rx = item.data;
              const workflow = item.type === "workflow" ? item.workflow : rx.workflows?.[0];
              
              // Parse medications for billing info
              let medications = [];
              try {
                medications = typeof rx.medications === "string" 
                  ? JSON.parse(rx.medications) 
                  : rx.medications || [];
              } catch { medications = []; }

              // Parse charges
              let charges = [];
              try {
                charges = workflow?.charges 
                  ? (typeof workflow.charges === "string" ? JSON.parse(workflow.charges) : workflow.charges)
                  : [];
              } catch { charges = []; }

              // Calculate totals
              const medsTotal = medications.reduce((sum: number, m: any) => {
                return sum + ((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1));
              }, 0);

              send({
                type: "NEW_PRESCRIPTION",
                prescription: {
                  id: rx.id,
                  prescriptionNo: rx.prescriptionNo,
                  patient: rx.patient,
                  doctor: rx.doctor,
                  appointment: rx.appointment,
                  diagnosis: rx.diagnosis,
                  medications: medications,
                  medicationCount: medications.length,
                  workflowStatus: workflow?.status || "PENDING",
                  billing: {
                    subtotal: medsTotal,
                    total: workflow?.totalCharge || medsTotal,
                    charges: charges,
                  },
                  createdAt: rx.createdAt,
                },
                timestamp: new Date().toISOString(),
              });
            }
          }

          // Update last check time
          lastCheckTime = new Date();
        } catch (err) {
          // Silently ignore errors to keep stream alive
          console.error("Pharmacy notification stream error:", err);
        }
      }, 3000);

      // Heartbeat every 25 seconds to keep connection alive
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
