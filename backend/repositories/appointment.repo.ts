import prisma from "../config/db";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface AppointmentQueryOptions {
  hospitalId: string;
  search?: string;
  doctorId?: string;
  patientId?: string;
  departmentId?: string;
  subDepartmentId?: string;
  status?: string;
  type?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: "appointmentDate" | "createdAt" | "timeSlot";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const appointmentInclude = {
  patient: {
    select: { id: true, patientId: true, name: true, phone: true, email: true, gender: true },
  },
  doctor: {
    select: { id: true, name: true, specialization: true, consultationFee: true },
  },
  department: { select: { id: true, name: true, code: true } },
};

// Create a new appointment
export const createAppointment = async (data: Prisma.AppointmentUncheckedCreateInput) => {
  return prisma.appointment.create({ data, include: appointmentInclude });
};

// Find all appointments with pagination and filters
export const findAllAppointments = async (
  options: AppointmentQueryOptions
): Promise<PaginatedResult<any>> => {
  const {
    hospitalId,
    search,
    doctorId,
    patientId,
    departmentId,
    subDepartmentId,
    status,
    type,
    date,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    sortBy = "appointmentDate",
    sortOrder = "asc",
  } = options;

  const skip = (page - 1) * limit;

  // Build date filter
  let dateFilter: any = {};
  if (date) {
    const d = new Date(date);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    dateFilter = { appointmentDate: { gte: dayStart, lt: dayEnd } };
  } else if (dateFrom || dateTo) {
    dateFilter = {
      appointmentDate: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      },
    };
  }

  const where: Prisma.AppointmentWhereInput = {
    hospitalId,
    ...(doctorId ? { doctorId } : {}),
    ...(patientId ? { patientId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(subDepartmentId ? { subDepartmentId } : {}),
    ...(status ? { status: status as any } : {}),
    ...(type ? { type: type as any } : {}),
    ...dateFilter,
    ...(search
      ? {
          OR: [
            { patient: { name: { contains: search } } },
            { patient: { phone: { contains: search } } },
            { patient: { patientId: { contains: search } } },
            { doctor: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ [sortBy]: sortOrder }, { timeSlot: "asc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// Find appointment by ID
export const findAppointmentById = async (id: string, hospitalId: string) => {
  return prisma.appointment.findFirst({
    where: { id, hospitalId },
    include: {
      ...appointmentInclude,
      followUps: { orderBy: { followUpDate: "asc" } },
    },
  });
};

// Update appointment
export const updateAppointment = async (
  id: string,
  hospitalId: string,
  data: Prisma.AppointmentUpdateInput
) => {
  return prisma.appointment.update({
    where: { id },
    data,
    include: appointmentInclude,
  });
};

// Delete appointment
export const deleteAppointment = async (id: string, hospitalId: string) => {
  return prisma.appointment.deleteMany({ where: { id, hospitalId } });
};

// Check slot conflict (double booking)
export const checkSlotConflict = async (
  hospitalId: string,
  doctorId: string,
  appointmentDate: Date,
  timeSlot: string,
  excludeId?: string
): Promise<boolean> => {
  const dayStart = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate()
  );
  const dayEnd = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate() + 1
  );

  const existing = await prisma.appointment.findFirst({
    where: {
      hospitalId,
      doctorId,
      timeSlot,
      appointmentDate: { gte: dayStart, lt: dayEnd },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  return !!existing;
};

// Get next token number for a doctor on a date
export const getNextToken = async (
  hospitalId: string,
  doctorId: string,
  appointmentDate: Date
): Promise<number> => {
  const dayStart = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate()
  );
  const dayEnd = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate() + 1
  );

  const count = await prisma.appointment.count({
    where: {
      hospitalId,
      doctorId,
      appointmentDate: { gte: dayStart, lt: dayEnd },
      status: { notIn: ["CANCELLED"] },
    },
  });

  return count + 1;
};

// Get booked slots for a doctor on a date
export const getBookedSlots = async (
  hospitalId: string,
  doctorId: string,
  date: Date
): Promise<string[]> => {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      hospitalId,
      doctorId,
      appointmentDate: { gte: dayStart, lt: dayEnd },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { timeSlot: true },
  });

  return appointments.map((a) => a.timeSlot).filter((slot): slot is string => slot !== null);
};

// Get appointment stats
export const getAppointmentStats = async (hospitalId: string) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const [total, todayCount, scheduled, completed, cancelled] = await Promise.all([
    prisma.appointment.count({ where: { hospitalId } }),
    prisma.appointment.count({
      where: { hospitalId, appointmentDate: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.appointment.count({ where: { hospitalId, status: "SCHEDULED" } }),
    prisma.appointment.count({ where: { hospitalId, status: "COMPLETED" } }),
    prisma.appointment.count({ where: { hospitalId, status: "CANCELLED" } }),
  ]);

  return { total, today: todayCount, scheduled, completed, cancelled };
};
