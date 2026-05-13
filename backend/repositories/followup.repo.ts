import prisma from "../config/db";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW-UP REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface FollowUpQueryOptions {
  hospitalId: string;
  patientId?: string;
  appointmentId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  today?: boolean;
  upcoming?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "followUpDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const followUpInclude = {
  patient: {
    select: { id: true, patientId: true, name: true, phone: true, email: true },
  },
  appointment: {
    select: {
      id: true,
      appointmentDate: true,
      timeSlot: true,
      type: true,
      doctor: { select: { id: true, name: true, specialization: true } },
    },
  },
};

// Create follow-up
export const createFollowUp = async (data: Prisma.FollowUpUncheckedCreateInput) => {
  return prisma.followUp.create({ data, include: followUpInclude });
};

// Find all follow-ups with filters
export const findAllFollowUps = async (
  options: FollowUpQueryOptions
): Promise<PaginatedResult<any>> => {
  const {
    hospitalId,
    patientId,
    appointmentId,
    status,
    dateFrom,
    dateTo,
    today,
    upcoming,
    page = 1,
    limit = 20,
    sortBy = "followUpDate",
    sortOrder = "asc",
  } = options;

  const skip = (page - 1) * limit;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  let dateFilter: any = {};
  if (today) {
    dateFilter = { followUpDate: { gte: todayStart, lt: todayEnd } };
  } else if (upcoming) {
    dateFilter = { followUpDate: { gte: todayStart } };
  } else if (dateFrom || dateTo) {
    dateFilter = {
      followUpDate: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      },
    };
  }

  const where: Prisma.FollowUpWhereInput = {
    hospitalId,
    ...(patientId ? { patientId } : {}),
    ...(appointmentId ? { appointmentId } : {}),
    ...(status ? { status: status as any } : {}),
    ...dateFilter,
  };

  const [total, data] = await Promise.all([
    prisma.followUp.count({ where }),
    prisma.followUp.findMany({
      where,
      include: followUpInclude,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// Find follow-up by ID
export const findFollowUpById = async (id: string, hospitalId: string) => {
  return prisma.followUp.findFirst({
    where: { id, hospitalId },
    include: followUpInclude,
  });
};

// Update follow-up
export const updateFollowUp = async (
  id: string,
  hospitalId: string,
  data: Prisma.FollowUpUpdateInput
) => {
  return prisma.followUp.update({
    where: { id },
    data,
    include: followUpInclude,
  });
};

// Delete follow-up
export const deleteFollowUp = async (id: string, hospitalId: string) => {
  return prisma.followUp.deleteMany({ where: { id, hospitalId } });
};

// Get follow-up stats
export const getFollowUpStats = async (hospitalId: string) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [total, pending, todayCount, completed, overdue] = await Promise.all([
    prisma.followUp.count({ where: { hospitalId } }),
    prisma.followUp.count({ where: { hospitalId, status: "PENDING" } }),
    prisma.followUp.count({
      where: { hospitalId, followUpDate: { gte: todayStart, lt: todayEnd }, status: "PENDING" },
    }),
    prisma.followUp.count({ where: { hospitalId, status: "COMPLETED" } }),
    prisma.followUp.count({
      where: { hospitalId, status: "PENDING", followUpDate: { lt: todayStart } },
    }),
  ]);

  return { total, pending, today: todayCount, completed, overdue };
};
