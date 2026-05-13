import {
  createLeave as createLeaveRepo,
  findLeavesByDoctor,
  findUpcomingLeaves,
  findLeaveById,
  updateLeave as updateLeaveRepo,
  deleteLeave as deleteLeaveRepo,
  checkOverlappingLeave,
  isDoctorOnLeave,
  getLeaveStats,
} from "../repositories/leave.repo";
import { findDoctorById } from "../repositories/doctor.repo";
import { CreateLeaveInput } from "../validations/doctor.validation";

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE SERVICE - Business logic layer
// ─────────────────────────────────────────────────────────────────────────────

export class LeaveServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "LeaveServiceError";
  }
}

/**
 * Validate doctor exists and belongs to hospital
 */
const validateDoctor = async (doctorId: string, hospitalId: string) => {
  const doctor = await findDoctorById(doctorId, hospitalId);
  if (!doctor) {
    throw new LeaveServiceError("Doctor not found", "DOCTOR_NOT_FOUND", 404);
  }
  return doctor;
};

/**
 * Create a new leave request
 */
export const createLeave = async (
  doctorId: string,
  hospitalId: string,
  input: CreateLeaveInput
) => {
  await validateDoctor(doctorId, hospitalId);

  // Check for overlapping leaves
  const hasOverlap = await checkOverlappingLeave(
    doctorId,
    hospitalId,
    input.leaveFrom,
    input.leaveTo
  );

  if (hasOverlap) {
    throw new LeaveServiceError(
      "Doctor already has leave scheduled for this period",
      "OVERLAPPING_LEAVE",
      409
    );
  }

  // Create the leave
  const leave = await createLeaveRepo({
    doctorId,
    hospitalId,
    leaveFrom: input.leaveFrom,
    leaveTo: input.leaveTo,
    reason: input.reason || null,
    isApproved: input.isApproved ?? true,
  });

  // Calculate days
  const days = Math.ceil(
    (input.leaveTo.getTime() - input.leaveFrom.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return {
    ...leave,
    totalDays: days,
  };
};

/**
 * Get leaves for a doctor with pagination
 */
export const getDoctorLeaves = async (
  doctorId: string,
  hospitalId: string,
  options?: { upcoming?: boolean; page?: number; limit?: number }
) => {
  await validateDoctor(doctorId, hospitalId);
  
  return findLeavesByDoctor(doctorId, hospitalId, options);
};

/**
 * Get upcoming leaves for a doctor
 */
export const getUpcomingLeaves = async (
  doctorId: string,
  hospitalId: string
) => {
  await validateDoctor(doctorId, hospitalId);
  
  const leaves = await findUpcomingLeaves(doctorId, hospitalId);
  
  return leaves.map((leave: any) => {
    const days = Math.ceil(
      (new Date(leave.leaveTo).getTime() - new Date(leave.leaveFrom).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;
    
    return {
      ...leave,
      totalDays: days,
    };
  });
};

/**
 * Get leave by ID
 */
export const getLeaveById = async (
  leaveId: string,
  hospitalId: string
) => {
  const leave = await findLeaveById(leaveId, hospitalId);
  
  if (!leave) {
    throw new LeaveServiceError("Leave not found", "LEAVE_NOT_FOUND", 404);
  }
  
  return leave;
};

/**
 * Update a leave
 */
export const updateLeave = async (
  leaveId: string,
  hospitalId: string,
  input: Partial<CreateLeaveInput>
) => {
  const existing = await findLeaveById(leaveId, hospitalId);
  
  if (!existing) {
    throw new LeaveServiceError("Leave not found", "LEAVE_NOT_FOUND", 404);
  }

  // If dates are being updated, check for overlaps
  if (input.leaveFrom || input.leaveTo) {
    const newFrom = input.leaveFrom || existing.leaveFrom;
    const newTo = input.leaveTo || existing.leaveTo;

    const hasOverlap = await checkOverlappingLeave(
      existing.doctorId,
      hospitalId,
      newFrom,
      newTo,
      leaveId // Exclude current leave from overlap check
    );

    if (hasOverlap) {
      throw new LeaveServiceError(
        "New dates overlap with existing leave",
        "OVERLAPPING_LEAVE",
        409
      );
    }
  }

  await updateLeaveRepo(leaveId, hospitalId, {
    ...(input.leaveFrom && { leaveFrom: input.leaveFrom }),
    ...(input.leaveTo && { leaveTo: input.leaveTo }),
    ...(input.reason !== undefined && { reason: input.reason }),
    ...(input.isApproved !== undefined && { isApproved: input.isApproved }),
  });

  return { leaveId, updated: true };
};

/**
 * Cancel (delete) a leave
 */
export const cancelLeave = async (
  leaveId: string,
  hospitalId: string
) => {
  const existing = await findLeaveById(leaveId, hospitalId);
  
  if (!existing) {
    throw new LeaveServiceError("Leave not found", "LEAVE_NOT_FOUND", 404);
  }

  await deleteLeaveRepo(leaveId, hospitalId);
  
  return { leaveId, cancelled: true };
};

/**
 * Check if doctor is available on a specific date
 */
export const checkDoctorAvailableOnDate = async (
  doctorId: string,
  hospitalId: string,
  date: Date
) => {
  await validateDoctor(doctorId, hospitalId);

  const onLeave = await isDoctorOnLeave(doctorId, hospitalId, date);

  return {
    doctorId,
    date: date.toISOString().split("T")[0],
    available: !onLeave,
    onLeave,
  };
};

/**
 * Get leave statistics for a doctor
 */
export const getDoctorLeaveStats = async (
  doctorId: string,
  hospitalId: string
) => {
  await validateDoctor(doctorId, hospitalId);
  
  return getLeaveStats(doctorId, hospitalId);
};

/**
 * Approve or reject a leave
 */
export const setLeaveApprovalStatus = async (
  leaveId: string,
  hospitalId: string,
  isApproved: boolean
) => {
  const existing = await findLeaveById(leaveId, hospitalId);
  
  if (!existing) {
    throw new LeaveServiceError("Leave not found", "LEAVE_NOT_FOUND", 404);
  }

  await updateLeaveRepo(leaveId, hospitalId, { isApproved });

  return {
    leaveId,
    isApproved,
  };
};

/**
 * Get all leaves for a hospital (admin view)
 */
export const getHospitalLeaves = async (
  hospitalId: string,
  options?: { upcoming?: boolean; page?: number; limit?: number }
) => {
  const { upcoming = true, page = 1, limit = 20 } = options || {};
  const skip = (page - 1) * limit;

  // Import prisma directly for hospital-wide query
  const prisma = (await import("../config/db")).default;

  const where: any = { hospitalId };
  if (upcoming) {
    where.leaveTo = { gte: new Date() };
  }

  const [total, data] = await Promise.all([
    prisma.doctorLeave.count({ where }),
    prisma.doctorLeave.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
          },
        },
      },
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
