import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
} from "../repositories/notification.repo";

export const notify = async (data: {
  hospitalId: string;
  userId?: string | null;
  targetRole?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any> | null;
}) => {
  try {
    await createNotification({
      ...data,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    });
  } catch {
    // fire-and-forget: never block the caller
  }
};

export const listNotifications = async (
  hospitalId: string,
  opts: { userId?: string; role?: string; limit?: number; offset?: number; types?: string[] }
) => {
  const result = await getNotifications(hospitalId, opts);
  return {
    ...result,
    data: result.data.map((n: any) => ({
      ...n,
      metadata: n.metadata ? (() => { try { return JSON.parse(n.metadata); } catch { return null; } })() : null,
    })),
  };
};

export const countUnread = (hospitalId: string, opts: { userId?: string; role?: string; types?: string[] }) =>
  getUnreadCount(hospitalId, opts);

export const markNotificationsRead = (hospitalId: string, opts: { userId?: string; role?: string }) =>
  markAllRead(hospitalId, opts);

export const markSingleRead = (id: string) => markOneRead(id);

// ── Convenience helpers called by other services ────────────────────────────

export const notifyAppointmentBooked = (hospitalId: string, data: { patientName: string; doctorName: string; date: string; time: string }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "APPOINTMENT_BOOKED",
    title: "New Appointment Booked",
    message: `${data.patientName} booked an appointment with ${data.doctorName} on ${data.date} at ${data.time}.`,
    metadata: data,
  });

export const notifyAppointmentStatusChanged = (hospitalId: string, data: { patientName: string; status: string; doctorName?: string }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "APPOINTMENT_UPDATED",
    title: "Appointment Status Updated",
    message: `Appointment for ${data.patientName} is now ${data.status}${data.doctorName ? ` (Dr. ${data.doctorName})` : ""}.`,
    metadata: data,
  });

export const notifyPatientRegistered = (hospitalId: string, data: { patientName: string; patientId: string; phone?: string }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "PATIENT_REGISTERED",
    title: "New Patient Registered",
    message: `${data.patientName} (${data.patientId}) has been registered.`,
    metadata: data,
  });

export const notifyBillingTransfer = (hospitalId: string, data: { patientName: string; billNo?: string }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "BILLING_TRANSFER",
    title: "Patient Sent to Billing",
    message: `${data.patientName} has been transferred to the billing counter.`,
    metadata: data,
  });

export const notifyPaymentReceived = (hospitalId: string, data: { patientName: string; amount: number; method: string }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "PAYMENT_RECEIVED",
    title: "Payment Received",
    message: `₹${data.amount} received from ${data.patientName} via ${data.method}.`,
    metadata: data,
  });

export const notifyProcedureCompleted = (hospitalId: string, data: { patientName: string; procedureName: string; subDeptName?: string }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "PROCEDURE_COMPLETED",
    title: "Procedure Recorded",
    message: `${data.procedureName} completed for ${data.patientName}${data.subDeptName ? ` in ${data.subDeptName}` : ""}.`,
    metadata: data,
  });

export const notifyFollowUpScheduled = (hospitalId: string, data: { patientName: string; followUpDate: string }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "FOLLOW_UP_SCHEDULED",
    title: "Follow-Up Scheduled",
    message: `Follow-up scheduled for ${data.patientName} on ${data.followUpDate}.`,
    metadata: data,
  });

export const notifyTreatmentPlanCreated = (hospitalId: string, data: { patientName: string; planName: string; totalSessions: number; totalCost: number }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "TREATMENT_PLAN_CREATED",
    title: "Treatment Plan Created",
    message: `Treatment plan "${data.planName}" created for ${data.patientName} (${data.totalSessions} sessions, ₹${data.totalCost}).`,
    metadata: data,
  });

export const notifyTreatmentSessionCompleted = (hospitalId: string, data: { patientName: string; planName: string; sessionNumber: number; totalSessions: number }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "TREATMENT_SESSION_COMPLETED",
    title: "Treatment Session Completed",
    message: `Session ${data.sessionNumber}/${data.totalSessions} completed for ${data.patientName} (${data.planName}).`,
    metadata: data,
  });

export const notifyTreatmentPlanCompleted = (hospitalId: string, data: { patientName: string; planName: string }) =>
  notify({
    hospitalId,
    targetRole: null,
    type: "TREATMENT_PLAN_COMPLETED",
    title: "Treatment Plan Completed",
    message: `All sessions completed for "${data.planName}" — ${data.patientName}.`,
    metadata: data,
  });
