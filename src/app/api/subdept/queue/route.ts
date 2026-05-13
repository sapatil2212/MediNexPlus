import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile, SubDeptServiceError } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const hospitalId = (profile as any).hospitalId;
    const departmentId = (profile as any).departmentId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const subDeptId = (profile as any).id;
    const subDeptType = (profile as any).type as string;
    const OPD_TYPES = ["OPD", "GENERAL_MEDICINE"];
    const isOPDMode = !!(profile as any).departmentId && OPD_TYPES.includes(subDeptType);

    // ── OPD MODE: query by departmentId (CLINICAL OPD sub-depts like derma-opd, dental-opd) ──
    if (isOPDMode) {
      const parentDeptId = (profile as any).departmentId;

      const apptInclude = {
        patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true } },
        doctor: { select: { id: true, name: true, specialization: true, department: { select: { name: true } } } },
        department: { select: { id: true, name: true } },
      };

      const [pendingAppts, completedAppts] = await Promise.all([
        (prisma as any).appointment.findMany({
          where: {
            hospitalId,
            departmentId: parentDeptId,
            appointmentDate: { gte: today, lt: tomorrow },
            status: { in: ["SCHEDULED", "CONFIRMED"] },
          },
          include: apptInclude,
          orderBy: [{ timeSlot: "asc" }, { tokenNumber: "asc" }],
          take: 200,
        }),
        (prisma as any).appointment.findMany({
          where: {
            hospitalId,
            departmentId: parentDeptId,
            appointmentDate: { gte: today, lt: tomorrow },
            status: "COMPLETED",
          },
          include: apptInclude,
          orderBy: { timeSlot: "asc" },
          take: 100,
        }),
      ]);

      const mapAppt = (a: any) => {
        const age = a.patient?.dateOfBirth
          ? Math.floor((Date.now() - new Date(a.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
          : null;
        return {
          id: a.id,
          appointmentDate: a.appointmentDate,
          tokenNumber: a.tokenNumber,
          timeSlot: a.timeSlot,
          type: a.type,
          status: a.status,
          consultationFee: a.consultationFee,
          doctorNotes: a.notes,
          subDeptNote: a.subDeptNote,
          patient: { id: a.patient?.id, name: a.patient?.name || "Unknown", patientId: a.patient?.patientId, phone: a.patient?.phone, gender: a.patient?.gender, age, bloodGroup: a.patient?.bloodGroup },
          doctor: { name: a.doctor?.name || "Unknown", specialization: a.doctor?.specialization, department: a.doctor?.department?.name },
          department: a.department?.name,
          suggestedProcedures: [],
        };
      };

      const recentTotal = await (prisma as any).appointment.count({
        where: {
          hospitalId,
          departmentId: parentDeptId,
          appointmentDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      });

      return successResponse(
        {
          queue: pendingAppts.map(mapAppt),
          completedList: completedAppts.map(mapAppt),
          date: today.toISOString(),
          subDeptName: (profile as any).name,
          subDeptId,
          flow: (profile as any).flow,
          total: pendingAppts.length,
          todayReferrals: pendingAppts.length,
          completedCount: completedAppts.length,
          recentTotal,
          isOPDMode: true,
        },
        "Queue fetched"
      );
    }

    // ── REFERRAL MODE: original logic for procedure-based sub-depts ──

    // Get IDs of appointments that already have a procedure record in this sub-dept
    const doneRecords = await (prisma as any).procedureRecord.findMany({
      where: { hospitalId, subDepartmentId: subDeptId, appointmentId: { not: null } },
      select: { appointmentId: true },
    });
    const doneAppointmentIds = new Set(doneRecords.map((r: any) => r.appointmentId));

    // Show appointments referred to THIS sub-department that don't yet have a procedure recorded
    const appointments = await (prisma as any).appointment.findMany({
      where: {
        hospitalId,
        subDepartmentId: subDeptId,
        status: "COMPLETED",
        ...(doneAppointmentIds.size > 0 ? { id: { notIn: Array.from(doneAppointmentIds) } } : {}),
      },
      include: {
        patient: {
          select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true },
        },
        doctor: {
          select: { id: true, name: true, specialization: true, department: { select: { name: true } } },
        },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ appointmentDate: "desc" }, { timeSlot: "desc" }],
      take: 200,
    });

    const procedures = (profile as any).procedures || [];

    const queue = appointments.map((a: any) => {
      const age = a.patient?.dateOfBirth
        ? Math.floor((Date.now() - new Date(a.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null;

      const matchedProcs = procedures.filter((p: any) =>
        (a.subDeptNote && a.subDeptNote.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])) ||
        (a.notes && a.notes.toLowerCase().includes(p.name.toLowerCase().split(" ")[0]))
      );

      return {
        id: a.id,
        appointmentDate: a.appointmentDate,
        tokenNumber: a.tokenNumber,
        timeSlot: a.timeSlot,
        type: a.type,
        status: a.status,
        consultationFee: a.consultationFee,
        doctorNotes: a.notes,
        subDeptNote: a.subDeptNote,
        patient: {
          id: a.patient?.id,
          name: a.patient?.name || "Unknown",
          patientId: a.patient?.patientId,
          phone: a.patient?.phone,
          gender: a.patient?.gender,
          age,
          bloodGroup: a.patient?.bloodGroup,
        },
        doctor: {
          name: a.doctor?.name || "Unknown",
          specialization: a.doctor?.specialization,
          department: a.doctor?.department?.name,
        },
        department: a.department?.name,
        suggestedProcedures: matchedProcs.slice(0, 5),
      };
    });

    // ── DIRECT BOOKINGS: appointments booked directly for this sub-dept (any status SCHEDULED/CONFIRMED) ──
    const directAppointments = await (prisma as any).appointment.findMany({
      where: {
        hospitalId,
        subDepartmentId: subDeptId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true } },
        doctor: { select: { id: true, name: true, specialization: true, department: { select: { name: true } } } },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ appointmentDate: "asc" }, { timeSlot: "asc" }],
      take: 200,
    });

    const directQueue = directAppointments.map((a: any) => {
      const age = a.patient?.dateOfBirth
        ? Math.floor((Date.now() - new Date(a.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null;
      return {
        id: a.id,
        appointmentDate: a.appointmentDate,
        tokenNumber: a.tokenNumber,
        timeSlot: a.timeSlot,
        type: a.type,
        status: a.status,
        consultationFee: a.consultationFee,
        doctorNotes: a.notes,
        subDeptNote: a.subDeptNote,
        isDirectBooking: true,
        patient: { id: a.patient?.id, name: a.patient?.name || "Unknown", patientId: a.patient?.patientId, phone: a.patient?.phone, gender: a.patient?.gender, age, bloodGroup: a.patient?.bloodGroup },
        doctor: a.doctor ? { name: a.doctor.name, specialization: a.doctor.specialization, department: a.doctor.department?.name } : null,
        department: a.department?.name,
        suggestedProcedures: [],
      };
    });

    // Count today's referrals for stats
    const todayReferrals = queue.filter((q: any) => {
      const apptDate = new Date(q.appointmentDate);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate.getTime() === today.getTime();
    }).length;

    // Fetch completed appointments (ones that have a procedure record in this sub-dept)
    let completedList: any[] = [];
    if (doneAppointmentIds.size > 0) {
      const completedAppts = await (prisma as any).appointment.findMany({
        where: {
          hospitalId,
          subDepartmentId: subDeptId,
          id: { in: Array.from(doneAppointmentIds) },
        },
        include: {
          patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true } },
          doctor: { select: { id: true, name: true, specialization: true, department: { select: { name: true } } } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });

      // Also fetch the procedure records for these appointments to show what was done
      const procRecords = await (prisma as any).procedureRecord.findMany({
        where: { hospitalId, subDepartmentId: subDeptId, appointmentId: { in: Array.from(doneAppointmentIds) } },
        include: { procedure: { select: { name: true, type: true } } },
        orderBy: { performedAt: "desc" },
      });
      const recordsByAppt: Record<string, any[]> = {};
      for (const r of procRecords) {
        if (!recordsByAppt[r.appointmentId]) recordsByAppt[r.appointmentId] = [];
        recordsByAppt[r.appointmentId].push(r);
      }

      completedList = completedAppts.map((a: any) => {
        const age = a.patient?.dateOfBirth
          ? Math.floor((Date.now() - new Date(a.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
          : null;
        const records = recordsByAppt[a.id] || [];
        return {
          id: a.id,
          appointmentDate: a.appointmentDate,
          tokenNumber: a.tokenNumber,
          timeSlot: a.timeSlot,
          type: a.type,
          consultationFee: a.consultationFee,
          subDeptNote: a.subDeptNote,
          patient: { id: a.patient?.id, name: a.patient?.name || "Unknown", patientId: a.patient?.patientId, phone: a.patient?.phone, gender: a.patient?.gender, age },
          doctor: { name: a.doctor?.name || "Unknown", specialization: a.doctor?.specialization, department: a.doctor?.department?.name },
          procedureRecords: records.map((r: any) => ({
            id: r.id, procedureName: r.procedure?.name, procedureType: r.procedure?.type,
            amount: r.amount, status: r.status, performedBy: r.performedBy,
            performedAt: r.performedAt, notes: r.notes,
          })),
        };
      });
    }

    // Also fetch historical referrals (last 30 days) for context
    const recentTotal = await (prisma as any).appointment.count({
      where: {
        hospitalId,
        subDepartmentId: subDeptId,
        appointmentDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    return successResponse(
      {
        queue,
        completedList,
        directQueue,
        date: today.toISOString(),
        subDeptName: (profile as any).name,
        subDeptId,
        flow: (profile as any).flow,
        total: queue.length,
        todayReferrals,
        completedCount: completedList.length,
        directTotal: directQueue.length,
        recentTotal,
      },
      "Queue fetched"
    );
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed to fetch queue", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const { appointmentId, status, remarks, newDate, newTimeSlot, patientName, patientPhone } = await req.json();
    if (!appointmentId || !status) return errorResponse("appointmentId and status required", 400);

    const profile = await getSubDeptProfile(user!.userId);
    const hospitalId = (profile as any).hospitalId;
    const subDeptName = (profile as any).name as string;

    const hospitalSettings = await (prisma as any).hospitalSettings.findUnique({
      where: { hospitalId },
      select: { hospitalName: true },
    }).catch(() => null);
    const hospitalInfo = hospitalSettings?.hospitalName
      ? { name: hospitalSettings.hospitalName }
      : await prisma.hospital.findUnique({ where: { id: hospitalId }, select: { name: true } }).catch(() => null);
    const hospitalName = hospitalInfo?.name || "Your Hospital";

    const appt = await (prisma as any).appointment.findFirst({
      where: { id: appointmentId, hospitalId },
      include: { patient: { select: { name: true, phone: true, email: true } } },
    });
    if (!appt) return errorResponse("Appointment not found", 404);

    const updateData: any = {
      status,
      ...(remarks ? { notes: remarks } : {}),
    };
    if (status === "RESCHEDULED" && newDate) {
      updateData.appointmentDate = new Date(newDate);
    }
    if (status === "RESCHEDULED" && newTimeSlot) {
      updateData.timeSlot = newTimeSlot;
    }

    const updated = await (prisma as any).appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });

    // Send confirmation email if rescheduled and patient has email
    if (status === "RESCHEDULED" && newDate && newTimeSlot) {
      const patientEmail = appt.patient?.email;
      const name = appt.patient?.name || patientName || "Patient";
      if (patientEmail) {
        try {
          const emailUsername = (process.env.EMAIL_USERNAME || "").trim();
          const emailPassword = (process.env.EMAIL_PASSWORD || "").replace(/\s/g, "");

          console.log("[SubDept Queue Mailer] SMTP config", {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            user: emailUsername ? `${emailUsername.slice(0, 4)}***${emailUsername.slice(-10)}` : "NOT SET",
            passLength: emailPassword.length,
          });

          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: false,
            auth: { user: emailUsername, pass: emailPassword },
          });
          const formattedDate = new Date(newDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
          const [h, m] = newTimeSlot.split(":");
          const hour = parseInt(h, 10);
          const formattedTime = `${hour % 12 || 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
          const year = new Date().getFullYear();
          const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Procedure Rescheduled</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr><td style="padding:28px 36px 20px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);">
        <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#bfdbfe;letter-spacing:.08em;text-transform:uppercase;">${hospitalName}</p>
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Procedure Rescheduled</h1>
      </td></tr>
      <tr><td style="padding:28px 36px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">Dear <strong>${name}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.65;">
          Your procedure at <strong style="color:#374151;">${subDeptName}</strong> has been rescheduled. Please find the updated details below.
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#eff6ff;border-radius:10px;border:1px solid #bfdbfe;margin-bottom:20px;">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">New Date</p>
            <p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#1d4ed8;">${formattedDate}</p>
            <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">New Time</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#1d4ed8;">${formattedTime}</p>
          </td></tr>
        </table>
        ${remarks ? `<p style="margin:0 0 20px;font-size:13px;color:#6b7280;background:#f9fafb;border-left:3px solid #3b82f6;padding:10px 14px;border-radius:0 8px 8px 0;line-height:1.6;"><strong>Note:</strong> ${remarks}</p>` : ""}
        <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">If you have any questions, please contact us. We apologize for any inconvenience.</p>
      </td></tr>
      <tr><td style="padding:16px 36px 24px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;font-size:11px;color:#d1d5db;">&copy; ${year} ${hospitalName} &middot; Automated message &mdash; please do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
          await transporter.sendMail({
            from: emailUsername ? `"${hospitalName}" <${emailUsername}>` : `"${hospitalName}" <no-reply@medinexplus.com>`,
            to: patientEmail,
            subject: `Procedure Rescheduled – ${formattedDate} at ${formattedTime} | ${subDeptName}`,
            text: `Dear ${name},\n\nYour procedure at ${subDeptName} has been rescheduled to ${formattedDate} at ${formattedTime}.\n\n${remarks ? `Note: ${remarks}\n\n` : ""}If you have questions, please contact us.\n\n${hospitalName}`,
            html,
          });
        } catch (emailErr) {
          console.error("[SubDept Queue] Failed to send reschedule email:", emailErr);
        }
      }
    }

    return successResponse(updated, status === "RESCHEDULED" ? "Appointment rescheduled and confirmation sent" : "Status updated");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update", 500);
  }
}
