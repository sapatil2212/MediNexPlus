import {
  createAppointment as createAppointmentRepo,
  findAllAppointments,
  findAppointmentById,
  updateAppointment as updateAppointmentRepo,
  deleteAppointment as deleteAppointmentRepo,
  checkSlotConflict,
  getNextToken,
  getBookedSlots,
  getAppointmentStats,
} from "../repositories/appointment.repo";
import { findPatientById } from "../repositories/patient.repo";
import { findDoctorById } from "../repositories/doctor.repo";
import { CreateAppointmentInput, UpdateAppointmentInput } from "../validations/appointment.validation";
import { sendAppointmentConfirmation } from "../utils/mailer";
import { generateBillFromAppointment, addWorkflowChargesToBill } from "./billing.service";
import { getSettings } from "./config.service";
import prisma from "../config/db";

const px = prisma as any;

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export class AppointmentServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "AppointmentServiceError";
  }
}

/**
 * Book a new appointment with full validation.
 */
export const bookAppointment = async (
  hospitalId: string,
  hospitalName: string,
  input: CreateAppointmentInput
) => {
  const appointmentDate = new Date(input.appointmentDate);

  // Prevent past date bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    throw new AppointmentServiceError(
      "Cannot book appointments for past dates",
      "PAST_DATE",
      400
    );
  }

  const isDiagnosticBooking = !input.doctorId;

  // For diagnostic bookings (no doctor), only fetch patient
  // For clinical bookings, fetch patient + doctor + slot info in parallel
  let patient: any, doctor: any = null, hasConflict = false, tokenNumber: number | null = null;

  if (isDiagnosticBooking) {
    patient = await findPatientById(input.patientId, hospitalId);
  } else {
    [patient, doctor, hasConflict, tokenNumber] = await Promise.all([
      findPatientById(input.patientId, hospitalId),
      findDoctorById(input.doctorId!, hospitalId),
      checkSlotConflict(hospitalId, input.doctorId!, appointmentDate, input.timeSlot!),
      getNextToken(hospitalId, input.doctorId!, appointmentDate),
    ]);
  }

  if (!patient) {
    throw new AppointmentServiceError("Patient not found", "PATIENT_NOT_FOUND", 404);
  }
  if (!isDiagnosticBooking) {
    if (!doctor) {
      throw new AppointmentServiceError("Doctor not found", "DOCTOR_NOT_FOUND", 404);
    }
    if (!doctor.isActive) {
      throw new AppointmentServiceError("Doctor is not currently active", "DOCTOR_INACTIVE", 400);
    }
    if (hasConflict) {
      throw new AppointmentServiceError(
        "This time slot is already booked for the selected doctor",
        "SLOT_CONFLICT",
        409
      );
    }
  }

  // Use consultation fee from input, then doctor, then department
  const consultationFee =
    input.consultationFee ??
    doctor?.consultationFee ??
    (doctor as any)?.department?.consultationFee;

  const appointment = await px.appointment.create({
    data: {
      hospitalId,
      patientId: input.patientId,
      doctorId: input.doctorId || null,
      departmentId: input.departmentId || doctor?.departmentId || null,
      appointmentDate,
      timeSlot: input.timeSlot || null,
      type: input.type || "OPD",
      status: "SCHEDULED",
      consultationFee,
      tokenNumber,
      notes: input.notes || null,
      subDepartmentId: (input as any).subDepartmentId || null,
      subDeptNote: (input as any).subDeptNote || null,
    },
    include: {
      patient: { select: { id: true, name: true, patientId: true, phone: true, email: true } },
      doctor: { select: { id: true, name: true, specialization: true } },
      department: { select: { id: true, name: true } },
    },
  });

  // Send confirmation email — fully fire-and-forget (no await)
  if (patient.email) {
    const deptName = (appointment as any).department?.name || "General";
    (async () => {
      try {
        const settings = await getSettings(hospitalId);
        await sendAppointmentConfirmation({
          to: patient.email!,
          patientName: patient.name,
          patientId: patient.patientId,
          doctorName: doctor?.name || "Our Team",
          departmentName: deptName,
          appointmentDate: appointmentDate.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          timeSlot: input.timeSlot || "To be confirmed",
          tokenNumber,
          type: input.type || "OPD",
          hospitalName,
          hospitalLogo: settings?.logo || null,
        });
      } catch { /* ignore email failures */ }
    })();
  }

  return appointment;
};

/**
 * Get appointments with pagination and filters.
 */
export const getAppointments = async (options: Parameters<typeof findAllAppointments>[0]) => {
  return findAllAppointments(options);
};

/**
 * Get a single appointment by ID.
 */
export const getAppointmentById = async (id: string, hospitalId: string) => {
  const appointment = await findAppointmentById(id, hospitalId);
  if (!appointment) {
    throw new AppointmentServiceError("Appointment not found", "NOT_FOUND", 404);
  }
  return appointment;
};

/**
 * Update appointment status / details with conflict re-check on reschedule.
 */
export const updateAppointment = async (
  id: string,
  hospitalId: string,
  input: UpdateAppointmentInput
) => {
  const existing = await findAppointmentById(id, hospitalId);
  if (!existing) {
    throw new AppointmentServiceError("Appointment not found", "NOT_FOUND", 404);
  }

  // If rescheduling (date or time changes), validate no conflict (only for appointments with doctor)
  if ((input.appointmentDate || input.timeSlot) && existing.doctorId) {
    const newDate = input.appointmentDate ? new Date(input.appointmentDate) : existing.appointmentDate;
    const newSlot = input.timeSlot || existing.timeSlot;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      throw new AppointmentServiceError("Cannot reschedule to a past date", "PAST_DATE", 400);
    }

    if (newSlot) {
      const hasConflict = await checkSlotConflict(
        hospitalId,
        existing.doctorId,
        newDate,
        newSlot,
        id
      );
      if (hasConflict) {
        throw new AppointmentServiceError(
          "This time slot is already booked for the selected doctor",
          "SLOT_CONFLICT",
          409
        );
      }
    }
  }

  const updateData: any = {};
  if (input.appointmentDate !== undefined) updateData.appointmentDate = new Date(input.appointmentDate);
  if (input.timeSlot !== undefined) updateData.timeSlot = input.timeSlot;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.consultationFee !== undefined) updateData.consultationFee = input.consultationFee;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.tokenNumber !== undefined) updateData.tokenNumber = input.tokenNumber;
  if (input.subDepartmentId !== undefined) updateData.subDepartmentId = input.subDepartmentId;
  if (input.subDeptNote !== undefined) updateData.subDeptNote = input.subDeptNote;

  const updated = await updateAppointmentRepo(id, hospitalId, updateData);

  if (input.status !== undefined && input.status !== existing.status) {
    try {
      const rx = await px.prescription.findFirst({
        where: { hospitalId, appointmentId: id },
        select: { id: true, status: true, referrals: true },
      });

      if (rx) {
        if (input.status === "CANCELLED" || input.status === "NO_SHOW") {
          await px.prescription.update({
            where: { id: rx.id },
            data: { status: "CLOSED", currentDeptId: null },
          });
          await px.prescriptionWorkflow.updateMany({
            where: { prescriptionId: rx.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
            data: { status: "SKIPPED" },
          });
        }

        if (input.status === "SCHEDULED" || input.status === "CONFIRMED" || input.status === "IN_PROGRESS") {
          if (rx.status === "CLOSED") {
            await px.prescription.update({
              where: { id: rx.id },
              data: { status: "DRAFT" },
            });
          }
        }

        if (input.status === "COMPLETED") {
          let referrals: any[] = [];
          if (rx.referrals) {
            try { referrals = JSON.parse(rx.referrals); } catch { referrals = []; }
          }

          if (referrals.length > 0) {
            await px.prescription.update({
              where: { id: rx.id },
              data: { status: "IN_WORKFLOW", currentDeptId: referrals[0].subDeptId || null },
            });

            const stepCount = await px.prescriptionWorkflow.count({ where: { prescriptionId: rx.id } });
            if (stepCount === 0) {
              await px.prescriptionWorkflow.createMany({
                data: referrals.map((ref: any, idx: number) => ({
                  hospitalId,
                  prescriptionId: rx.id,
                  subDepartmentId: ref.subDeptId,
                  sequence: idx,
                  status: idx === 0 ? "IN_PROGRESS" : "PENDING",
                })),
              });
            }
          } else {
            await px.prescription.update({
              where: { id: rx.id },
              data: { status: "COMPLETED", currentDeptId: null },
            });
          }
        }
      }
    } catch {}
  }

  // Event: appointment COMPLETED → auto-generate consultation bill
  if (input.status === "COMPLETED" && existing.status !== "COMPLETED") {
    generateBillFromAppointment(id, hospitalId).catch(() => {});
  } else if (input.consultationFee !== undefined) {
    // If fee updated after completion, sync with existing bill if any
    const bill = await (prisma as any).bill.findFirst({ where: { visitId: id, hospitalId } });
    if (bill) {
      addWorkflowChargesToBill(bill.id, hospitalId).catch(() => {});
    }
  }

  return updated;
};

/**
 * Cancel an appointment.
 */
export const cancelAppointment = async (id: string, hospitalId: string) => {
  const existing = await findAppointmentById(id, hospitalId);
  if (!existing) {
    throw new AppointmentServiceError("Appointment not found", "NOT_FOUND", 404);
  }
  if (existing.status === "COMPLETED") {
    throw new AppointmentServiceError(
      "Cannot cancel a completed appointment",
      "ALREADY_COMPLETED",
      400
    );
  }
  return updateAppointmentRepo(id, hospitalId, { status: "CANCELLED" });
};

/**
 * Get available time slots for a doctor on a specific date.
 * Generates slots from availability and removes already-booked ones.
 */
export const getAvailableSlots = async (
  hospitalId: string,
  doctorId: string,
  date: string
) => {
  const doctor = await findDoctorById(doctorId, hospitalId);
  if (!doctor) {
    throw new AppointmentServiceError("Doctor not found", "NOT_FOUND", 404);
  }

  const targetDate = new Date(date + "T00:00:00");
  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayName = dayNames[targetDate.getDay()];

  // ── Check for a date-specific override FIRST ─────────────────────────────
  const dateOverride = await px.doctorDateOverride.findFirst({
    where: {
      doctorId,
      hospitalId,
      date: {
        gte: new Date(date + "T00:00:00.000Z"),
        lte: new Date(date + "T23:59:59.999Z"),
      },
    },
  });

  // Override says doctor is off → no slots
  if (dateOverride && dateOverride.isOff) {
    return { slots: [], bookedSlots: [], allSlots: [], message: "Doctor is not available on this date" };
  }

  // Determine effective schedule: override wins over weekly
  let effectiveStart: string;
  let effectiveEnd: string;
  let effectiveDuration: number;

  if (dateOverride && dateOverride.startTime && dateOverride.endTime) {
    effectiveStart    = dateOverride.startTime;
    effectiveEnd      = dateOverride.endTime;
    effectiveDuration = dateOverride.slotDuration || 30;
  } else {
    // Fall back to weekly DoctorAvailability
    const dayAvailability = doctor.availability?.find(
      (a: any) => a.day === dayName && a.isActive
    );
    if (!dayAvailability) {
      return { slots: [], bookedSlots: [], allSlots: [], message: "Doctor is not available on this day" };
    }
    effectiveStart    = dayAvailability.startTime;
    effectiveEnd      = dayAvailability.endTime;
    effectiveDuration = dayAvailability.slotDuration || 30;
  }

  // Generate time slots from effective schedule
  let slots = generateSlots(effectiveStart, effectiveEnd, effectiveDuration);

  // Remove break slots if the override has breaks defined
  if (dateOverride?.breaks) {
    try {
      const breaks: { start: string; end: string }[] = typeof dateOverride.breaks === "string"
        ? JSON.parse(dateOverride.breaks)
        : dateOverride.breaks;
      slots = slots.filter(slot => {
        const [sh, sm] = slot.split(":").map(Number);
        const slotMin = sh * 60 + sm;
        return !breaks.some(br => {
          const [bsh, bsm] = br.start.split(":").map(Number);
          const [beh, bem] = br.end.split(":").map(Number);
          return slotMin >= bsh * 60 + bsm && slotMin < beh * 60 + bem;
        });
      });
    } catch { /* ignore malformed breaks */ }
  }

  // Get already-booked slots
  const bookedSlots = await getBookedSlots(hospitalId, doctorId, targetDate);
  const availableSlots = slots.filter((s) => !bookedSlots.includes(s));

  return {
    slots: availableSlots,
    bookedSlots,
    allSlots: slots,
    availability: {
      startTime: effectiveStart,
      endTime: effectiveEnd,
      slotDuration: effectiveDuration,
      isOverride: !!dateOverride,
    },
  };
};

/**
 * Get appointment statistics.
 */
export const getStats = async (hospitalId: string) => {
  return getAppointmentStats(hospitalId);
};

// ─── Helpers ───

function generateSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur + duration <= end) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    cur += duration;
  }
  return slots;
}
