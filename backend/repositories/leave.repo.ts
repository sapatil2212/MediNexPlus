import prisma from "../config/db";

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaveData {
  doctorId: string;
  hospitalId: string;
  leaveFrom: Date;
  leaveTo: Date;
  reason?: string | null;
  isApproved?: boolean;
}

// Create a new leave
export const createLeave = async (data: LeaveData) => {
  return prisma.doctorLeave.create({
    data: {
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      leaveFrom: data.leaveFrom,
      leaveTo: data.leaveTo,
      reason: data.reason || null,
      isApproved: data.isApproved ?? true,
    },
  });
};

// Find all leaves for a doctor
export const findLeavesByDoctor = async (
  doctorId: string,
  hospitalId: string,
  options?: { upcoming?: boolean; page?: number; limit?: number }
) => {
  const { upcoming = false, page = 1, limit = 20 } = options || {};
  const skip = (page - 1) * limit;

  const where: any = { doctorId, hospitalId };
  if (upcoming) {
    where.leaveTo = { gte: new Date() };
  }

  const [total, data] = await Promise.all([
    prisma.doctorLeave.count({ where }),
    prisma.doctorLeave.findMany({
      where,
      orderBy: { leaveFrom: "asc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Find upcoming leaves for a doctor
export const findUpcomingLeaves = async (doctorId: string, hospitalId: string) => {
  return prisma.doctorLeave.findMany({
    where: {
      doctorId,
      hospitalId,
      leaveTo: { gte: new Date() },
    },
    orderBy: { leaveFrom: "asc" },
  });
};

// Find leave by ID
export const findLeaveById = async (id: string, hospitalId: string) => {
  return prisma.doctorLeave.findFirst({
    where: { id, hospitalId },
  });
};

// Update leave
export const updateLeave = async (
  id: string,
  hospitalId: string,
  data: Partial<LeaveData>
) => {
  return prisma.doctorLeave.updateMany({
    where: { id, hospitalId },
    data: {
      ...(data.leaveFrom ? { leaveFrom: data.leaveFrom } : {}),
      ...(data.leaveTo ? { leaveTo: data.leaveTo } : {}),
      ...(data.reason !== undefined ? { reason: data.reason } : {}),
      ...(data.isApproved !== undefined ? { isApproved: data.isApproved } : {}),
    },
  });
};

// Delete leave
export const deleteLeave = async (id: string, hospitalId: string) => {
  return prisma.doctorLeave.deleteMany({
    where: { id, hospitalId },
  });
};

// Check for overlapping leaves
export const checkOverlappingLeave = async (
  doctorId: string,
  hospitalId: string,
  leaveFrom: Date,
  leaveTo: Date,
  excludeId?: string
) => {
  const overlapping = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      hospitalId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      OR: [
        {
          AND: [
            { leaveFrom: { lte: leaveFrom } },
            { leaveTo: { gte: leaveFrom } },
          ],
        },
        {
          AND: [
            { leaveFrom: { lte: leaveTo } },
            { leaveTo: { gte: leaveTo } },
          ],
        },
        {
          AND: [
            { leaveFrom: { gte: leaveFrom } },
            { leaveTo: { lte: leaveTo } },
          ],
        },
      ],
    },
  });

  return !!overlapping;
};

// Check if doctor is on leave on a specific date
export const isDoctorOnLeave = async (
  doctorId: string,
  hospitalId: string,
  date: Date
) => {
  const leave = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      hospitalId,
      leaveFrom: { lte: date },
      leaveTo: { gte: date },
      isApproved: true,
    },
  });

  return !!leave;
};

// Get leave statistics for a doctor
export const getLeaveStats = async (doctorId: string, hospitalId: string) => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [upcoming, thisYear] = await Promise.all([
    prisma.doctorLeave.count({
      where: {
        doctorId,
        hospitalId,
        leaveTo: { gte: now },
      },
    }),
    prisma.doctorLeave.findMany({
      where: {
        doctorId,
        hospitalId,
        leaveFrom: { gte: startOfYear },
      },
    }),
  ]);

  // Calculate total leave days this year
  const totalDays = thisYear.reduce((acc, leave) => {
    const from = new Date(leave.leaveFrom);
    const to = new Date(leave.leaveTo);
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return acc + days;
  }, 0);

  return {
    upcomingLeaves: upcoming,
    totalLeavesThisYear: thisYear.length,
    totalDaysThisYear: totalDays,
  };
};
