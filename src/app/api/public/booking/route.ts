import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";
import { bookAppointment, AppointmentServiceError } from "../../../../../backend/services/appointment.service";
import { notify } from "../../../../../backend/services/notification.service";
import { findPatientByPhone, generatePatientId, createPatient } from "../../../../../backend/repositories/patient.repo";

export const dynamic = "force-dynamic";


async function resolveHospitalId(hid: string | null, slug: string | null): Promise<string | null> {
  if (hid) return hid;
  if (slug) {
    const settings = await prisma.hospitalSettings.findUnique({
      where: { bookingSlug: slug },
      select: { hospitalId: true },
    });
    return settings?.hospitalId || null;
  }
  return null;
}

/* ── GET /api/public/booking?hid=HOSPITAL_ID or ?slug=SLUG ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  try {
    const hid = await resolveHospitalId(searchParams.get("hid"), searchParams.get("slug"));
    if (!hid) return errorResponse("No hospital found. Please use a valid booking link.", 404);
    const hospital = await prisma.hospital.findUnique({
      where: { id: hid },
      select: { id: true, name: true },
    });
    if (!hospital) return errorResponse("Hospital not found", 404);

    const settings = await (prisma as any).hospitalSettings.findUnique({
      where: { hospitalId: hid },
      select: { hospitalName: true, logo: true, phone: true, address: true },
    }).catch(() => null);

    const departments = await (prisma as any).department.findMany({
      where: { hospitalId: hid, isActive: true, allowAppointments: true, type: "CLINICAL" },
      select: { id: true, name: true, code: true, type: true },
      orderBy: { name: "asc" },
    });

    return successResponse({
      hospital: {
        id: hospital.id,
        name: settings?.hospitalName || hospital.name,
        logo: settings?.logo || null,
        phone: settings?.phone || null,
        address: settings?.address || null,
      },
      departments,
    }, "Public booking info");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

/* ── POST /api/public/booking ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, doctorId, departmentId, appointmentDate, timeSlot, type, consultationFee, notes, existingPatientId, forceNew } = body;
    const hospitalId = await resolveHospitalId(body.hospitalId || null, body.slug || null);
    if (!hospitalId) return errorResponse("No hospital found", 404);

    if (!name || !phone || !appointmentDate) {
      return errorResponse("Missing required fields", 400);
    }

    // For DIAGNOSTIC departments, doctorId and timeSlot are optional
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId }, select: { type: true } });
      if (dept?.type !== "DIAGNOSTIC" && !doctorId) {
        return errorResponse("Doctor is required for this department", 400);
      }
    } else if (!doctorId) {
      return errorResponse("Doctor is required", 400);
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId }, select: { id: true, name: true } });
    if (!hospital) return errorResponse("Hospital not found", 404);

    let patient: any = null;

    if (existingPatientId) {
      // User chose "Book for existing patient" — use that patient directly
      patient = await prisma.patient.findFirst({ where: { id: existingPatientId, hospitalId } });
      if (!patient) return errorResponse("Patient not found", 404);
    } else if (forceNew) {
      // User chose "Register as new patient" — always create a fresh profile
      const patientId = await generatePatientId(hospitalId);
      patient = await createPatient({
        hospitalId,
        patientId,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
      });
    } else {
      // Default: dedup by phone — return existing or create new
      const byPhone = await findPatientByPhone(hospitalId, phone.trim());
      if (byPhone) {
        patient = byPhone;
        // Update name/email if changed since last booking
        const trimmedName = name.trim();
        const trimmedEmail = email?.trim() || null;
        if (patient.name !== trimmedName || (trimmedEmail && patient.email !== trimmedEmail)) {
          patient = await prisma.patient.update({
            where: { id: patient.id },
            data: { name: trimmedName, ...(trimmedEmail ? { email: trimmedEmail } : {}) },
          });
        }
      } else {
        const patientId = await generatePatientId(hospitalId);
        patient = await createPatient({
          hospitalId,
          patientId,
          name: name.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
        });
      }
    }

    // Book via existing service (handles conflict checks, token generation, email)
    const appointment = await bookAppointment(hospitalId, hospital.name, {
      patientId: patient.id,
      doctorId,
      departmentId: departmentId || null,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      type: type || "OPD",
      consultationFee: consultationFee ? Number(consultationFee) : undefined,
      notes: notes || null,
    });

    // Fire notification
    notify({
      hospitalId,
      type: "BOOKING_REQUEST",
      title: `QR Booking — ${name}`,
      message: `${name} (${phone}) booked an appointment via QR code.`,
      metadata: { patientId: patient.id, source: "QR_BOOKING" },
    }).catch(() => {});

    return successResponse({ appointment }, "Appointment booked successfully", 201);
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}
