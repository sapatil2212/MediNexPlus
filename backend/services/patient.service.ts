import {
  createPatient as createPatientRepo,
  findAllPatients,
  findPatientById,
  findPatientByPhone,
  updatePatient as updatePatientRepo,
  deletePatient as deletePatinetRepo,
  generatePatientId,
  searchPatientsQuick,
  countPatients,
} from "../repositories/patient.repo";
import { Prisma } from "@prisma/client";
import { CreatePatientInput, UpdatePatientInput } from "../validations/patient.validation";
import { sendPatientWelcome } from "../utils/mailer";
import { getSettings } from "./config.service";

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delete a patient and all their history (Force delete)
 */
export const deletePatientForce = async (id: string, hospitalId: string) => {
  const patient = await findPatientById(id, hospitalId);
  if (!patient) {
    throw new PatientServiceError("Patient not found", "NOT_FOUND", 404);
  }

  // Force delete will remove all related records due to Prisma cascade or manual cleanup
  // Based on prisma schema, we might need manual cleanup if cascade is not set for all
  return deletePatinetRepo(id, hospitalId);
};

export class PatientServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "PatientServiceError";
  }
}

/**
 * Register a patient — deduplicates by phone per hospital.
 * Returns existing patient if phone already registered.
 */
export const registerPatient = async (
  hospitalId: string,
  hospitalName: string,
  input: CreatePatientInput
): Promise<{ patient: any; isNew: boolean }> => {
  // Check for existing patient by phone
  const existing = await findPatientByPhone(hospitalId, input.phone);
  if (existing) {
    return { patient: existing, isNew: false };
  }

  // Generate unique sequential patient ID with retry on race-condition collision
  let patient: any;
  for (let attempt = 0; attempt < 5; attempt++) {
    const patientId = await generatePatientId(hospitalId);
    try {
      patient = await createPatientRepo({
        hospitalId,
        patientId,
        name: input.name,
        phone: input.phone,
        whatsapp: (input as any).whatsapp || null,
        email: input.email || null,
        gender: input.gender || null,
        dateOfBirth: input.dateOfBirth || null,
        bloodGroup: input.bloodGroup || null,
        address: input.address || null,
        profilePhoto: input.profilePhoto || null,
        documents: input.documents || null,
        patientType: input.patientType || null,
        allergies: input.allergies || null,
        emergencyName: input.emergencyName || null,
        emergencyRelation: input.emergencyRelation || null,
        emergencyPhone: input.emergencyPhone || null,
      });
      break; // success
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        attempt < 4
      ) {
        // patientId collision (rare race condition) — regenerate and retry
        continue;
      }
      throw err;
    }
  }

  // Send welcome email asynchronously (fire-and-forget)
  if (input.email) {
    // Fetch hospital settings to get logo
    const settings = await getSettings(hospitalId);
    const hospitalLogo = settings?.logo || null;

    sendPatientWelcome({
      to: input.email,
      name: input.name,
      patientId: patient.patientId,
      hospitalName,
      hospitalLogo,
    }).catch(() => {
      // Email failure must not block registration
    });
  }

  return { patient, isNew: true };
};

/**
 * Get paginated list of patients.
 */
export const getPatients = async (options: Parameters<typeof findAllPatients>[0]) => {
  return findAllPatients(options);
};

/**
 * Get single patient by DB ID.
 */
export const getPatientById = async (id: string, hospitalId: string) => {
  const patient = await findPatientById(id, hospitalId);
  if (!patient) {
    throw new PatientServiceError("Patient not found", "NOT_FOUND", 404);
  }
  return patient;
};

/**
 * Quick search for autocomplete.
 */
export const searchPatients = async (hospitalId: string, query: string) => {
  return searchPatientsQuick(hospitalId, query);
};

/**
 * Update patient details.
 */
export const updatePatient = async (
  id: string,
  hospitalId: string,
  input: UpdatePatientInput
) => {
  const existing = await findPatientById(id, hospitalId);
  if (!existing) {
    throw new PatientServiceError("Patient not found", "NOT_FOUND", 404);
  }

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.gender !== undefined) updateData.gender = input.gender;
  if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth;
  if (input.bloodGroup !== undefined) updateData.bloodGroup = input.bloodGroup;
  if (input.address !== undefined) updateData.address = input.address;
  if (input.profilePhoto !== undefined) updateData.profilePhoto = input.profilePhoto;
  if (input.documents !== undefined) updateData.documents = input.documents;
  if (input.patientType !== undefined) updateData.patientType = input.patientType;
  if (input.allergies !== undefined) updateData.allergies = input.allergies;
  if (input.emergencyName !== undefined) updateData.emergencyName = input.emergencyName;
  if (input.emergencyRelation !== undefined) updateData.emergencyRelation = input.emergencyRelation;
  if (input.emergencyPhone !== undefined) updateData.emergencyPhone = input.emergencyPhone;

  return updatePatientRepo(id, hospitalId, updateData);
};

/**
 * Delete patient (hard delete — use with caution).
 */
export const deletePatient = async (id: string, hospitalId: string) => {
  const existing = await findPatientById(id, hospitalId);
  if (!existing) {
    throw new PatientServiceError("Patient not found", "NOT_FOUND", 404);
  }
  await deletePatinetRepo(id, hospitalId);
  return { id, deleted: true };
};

/**
 * Patient stats for dashboard.
 */
export const getPatientStats = async (hospitalId: string) => {
  const total = await countPatients(hospitalId);
  return { total };
};
