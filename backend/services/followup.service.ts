import {
  createFollowUp as createFollowUpRepo,
  findAllFollowUps,
  findFollowUpById,
  updateFollowUp as updateFollowUpRepo,
  deleteFollowUp as deleteFollowUpRepo,
  getFollowUpStats,
} from "../repositories/followup.repo";
import { findPatientById } from "../repositories/patient.repo";
import { CreateFollowUpInput, UpdateFollowUpInput } from "../validations/followup.validation";

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW-UP SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export class FollowUpServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "FollowUpServiceError";
  }
}

/**
 * Schedule a new follow-up.
 */
export const scheduleFollowUp = async (
  hospitalId: string,
  input: CreateFollowUpInput
) => {
  const patient = await findPatientById(input.patientId, hospitalId);
  if (!patient) {
    throw new FollowUpServiceError("Patient not found", "PATIENT_NOT_FOUND", 404);
  }

  return createFollowUpRepo({
    hospitalId,
    patientId: input.patientId,
    appointmentId: input.appointmentId || null,
    followUpDate: new Date(input.followUpDate),
    reason: input.reason || null,
    notes: input.notes || null,
    status: "PENDING",
  });
};

/**
 * Get follow-ups with filters.
 */
export const getFollowUps = async (options: Parameters<typeof findAllFollowUps>[0]) => {
  return findAllFollowUps(options);
};

/**
 * Get single follow-up by ID.
 */
export const getFollowUpById = async (id: string, hospitalId: string) => {
  const followUp = await findFollowUpById(id, hospitalId);
  if (!followUp) {
    throw new FollowUpServiceError("Follow-up not found", "NOT_FOUND", 404);
  }
  return followUp;
};

/**
 * Update follow-up (reschedule, add notes, mark complete).
 */
export const updateFollowUp = async (
  id: string,
  hospitalId: string,
  input: UpdateFollowUpInput
) => {
  const existing = await findFollowUpById(id, hospitalId);
  if (!existing) {
    throw new FollowUpServiceError("Follow-up not found", "NOT_FOUND", 404);
  }

  const updateData: any = {};
  if (input.followUpDate !== undefined) updateData.followUpDate = new Date(input.followUpDate);
  if (input.reason !== undefined) updateData.reason = input.reason;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.status !== undefined) updateData.status = input.status;

  return updateFollowUpRepo(id, hospitalId, updateData);
};

/**
 * Delete a follow-up.
 */
export const deleteFollowUp = async (id: string, hospitalId: string) => {
  const existing = await findFollowUpById(id, hospitalId);
  if (!existing) {
    throw new FollowUpServiceError("Follow-up not found", "NOT_FOUND", 404);
  }
  await deleteFollowUpRepo(id, hospitalId);
  return { id, deleted: true };
};

/**
 * Get follow-up statistics.
 */
export const getStats = async (hospitalId: string) => {
  return getFollowUpStats(hospitalId);
};
