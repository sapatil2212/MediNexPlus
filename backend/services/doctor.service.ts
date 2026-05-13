import {
  createDoctor as createDoctorRepo,
  findAllDoctors,
  findAllDoctorsSimple,
  findDoctorById,
  updateDoctor as updateDoctorRepo,
  deleteDoctor as deleteDoctorRepo,
  checkDuplicateEmail,
  toggleDoctorStatus,
  countDoctors,
  DoctorQueryOptions,
} from "../repositories/doctor.repo";
import { CreateDoctorInput, UpdateDoctorInput } from "../validations/doctor.validation";

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR SERVICE - Business logic layer
// ─────────────────────────────────────────────────────────────────────────────

export class DoctorServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "DoctorServiceError";
  }
}

/**
 * Create a new doctor
 */
export const createDoctor = async (hospitalId: string, input: CreateDoctorInput) => {
  // Check for duplicate email
  const isDuplicate = await checkDuplicateEmail(hospitalId, input.email);
  if (isDuplicate) {
    throw new DoctorServiceError(
      "A doctor with this email already exists in your hospital",
      "DUPLICATE_EMAIL",
      409
    );
  }

  // Create the doctor
  return createDoctorRepo({
    hospitalId,
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone || null,
    gender: input.gender || null,
    profileImage: input.profileImage || null,
    dateOfBirth: input.dateOfBirth || null,
    bloodGroup: input.bloodGroup || null,
    address: input.address || null,
    specialization: input.specialization || null,
    qualification: input.qualification || null,
    experience: input.experience || 0,
    registrationNo: input.registrationNo || null,
    licenseNo: input.licenseNo || null,
    agreementDoc: input.agreementDoc || null,
    govtIdCard: input.govtIdCard || null,
    signature: input.signature || null,
    hospitalStamp: input.hospitalStamp || null,
    departmentId: input.departmentId || null,
    consultationFee: input.consultationFee || 0,
    followUpFee: input.followUpFee || null,
    isActive: input.isActive ?? true,
    isAvailable: input.isAvailable ?? true,
  });
};

/**
 * Get doctors with pagination and filters
 */
export const getDoctors = async (options: DoctorQueryOptions) => {
  return findAllDoctors(options);
};

/**
 * Get all doctors for dropdowns (simple list)
 */
export const getDoctorsForDropdown = async (hospitalId: string, activeOnly = true) => {
  return findAllDoctorsSimple(hospitalId, activeOnly);
};

/**
 * Get a single doctor by ID
 */
export const getDoctorById = async (id: string, hospitalId: string) => {
  const doctor = await findDoctorById(id, hospitalId);
  if (!doctor) {
    throw new DoctorServiceError("Doctor not found", "NOT_FOUND", 404);
  }
  return doctor;
};

/**
 * Update a doctor
 */
export const updateDoctor = async (
  id: string,
  hospitalId: string,
  input: UpdateDoctorInput
) => {
  // Check if doctor exists
  const existing = await findDoctorById(id, hospitalId);
  if (!existing) {
    throw new DoctorServiceError("Doctor not found", "NOT_FOUND", 404);
  }

  // If email is being updated, check for duplicates
  if (input.email && input.email.toLowerCase() !== existing.email.toLowerCase()) {
    const isDuplicate = await checkDuplicateEmail(hospitalId, input.email, id);
    if (isDuplicate) {
      throw new DoctorServiceError(
        "A doctor with this email already exists",
        "DUPLICATE_EMAIL",
        409
      );
    }
  }

  // Build update data
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined) updateData.email = input.email.toLowerCase();
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.gender !== undefined) updateData.gender = input.gender;
  if (input.profileImage !== undefined) updateData.profileImage = input.profileImage;
  if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth;
  if (input.bloodGroup !== undefined) updateData.bloodGroup = input.bloodGroup;
  if (input.address !== undefined) updateData.address = input.address;
  if (input.specialization !== undefined) updateData.specialization = input.specialization;
  if (input.qualification !== undefined) updateData.qualification = input.qualification;
  if (input.experience !== undefined) updateData.experience = input.experience;
  if (input.registrationNo !== undefined) updateData.registrationNo = input.registrationNo;
  if (input.licenseNo !== undefined) updateData.licenseNo = input.licenseNo;
  if (input.agreementDoc !== undefined) updateData.agreementDoc = input.agreementDoc;
  if (input.govtIdCard !== undefined) updateData.govtIdCard = input.govtIdCard;
  if (input.signature !== undefined) updateData.signature = input.signature;
  if (input.hospitalStamp !== undefined) updateData.hospitalStamp = input.hospitalStamp;
  if (input.departmentId !== undefined) updateData.departmentId = input.departmentId;
  if (input.consultationFee !== undefined) updateData.consultationFee = input.consultationFee;
  if (input.followUpFee !== undefined) updateData.followUpFee = input.followUpFee;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.isAvailable !== undefined) updateData.isAvailable = input.isAvailable;

  return updateDoctorRepo(id, hospitalId, updateData);
};

/**
 * Toggle doctor status (isActive or isAvailable)
 */
export const toggleStatus = async (
  id: string,
  hospitalId: string,
  status: { isActive?: boolean; isAvailable?: boolean }
) => {
  const existing = await findDoctorById(id, hospitalId);
  if (!existing) {
    throw new DoctorServiceError("Doctor not found", "NOT_FOUND", 404);
  }

  await toggleDoctorStatus(id, hospitalId, status);
  return { id, ...status };
};

/**
 * Delete a doctor
 */
export const deleteDoctor = async (id: string, hospitalId: string) => {
  const existing = await findDoctorById(id, hospitalId);
  if (!existing) {
    throw new DoctorServiceError("Doctor not found", "NOT_FOUND", 404);
  }

  await deleteDoctorRepo(id, hospitalId);
  return { id, deleted: true };
};

/**
 * Get doctor statistics
 */
export const getDoctorStats = async (hospitalId: string) => {
  const [total, active, available] = await Promise.all([
    countDoctors(hospitalId),
    countDoctors(hospitalId, { isActive: true }),
    countDoctors(hospitalId, { isActive: true }),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    available,
  };
};
