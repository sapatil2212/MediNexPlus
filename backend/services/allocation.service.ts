import {
  createAllocation, findActiveAllocationByBed, findAllocationById,
  findAllAllocations, updateAllocation, getBedStatusOverview,
} from "../repositories/allocation.repo";
import { findBedById, updateBed } from "../repositories/bed.repo";
import { createPatient, findPatientById } from "../repositories/patient.repo";
import { generatePatientId } from "../repositories/patient.repo";

export class AllocationServiceError extends Error {
  constructor(public message: string, public code: string, public status: number = 400) {
    super(message);
    this.name = "AllocationServiceError";
  }
}

export const allocateBed = async (hospitalId: string, data: {
  bedId: string;
  patientId?: string;
  entryType?: "PATIENT" | "MANUAL";
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  attendantName?: string;
  attendantPhone?: string;
  diagnosis?: string;
  admittingDoctorName?: string;
  admissionDate?: string;
  expectedDischargeDate?: string;
  notes?: string;
  departmentId?: string;
}) => {
  let patientId = data.patientId;

  // If manual entry, create a new patient
  if (data.entryType === "MANUAL") {
    if (!data.patientPhone) {
      throw new AllocationServiceError("Phone number is required for manual patient entry", "PHONE_REQUIRED", 400);
    }
    const patientIdGenerated = await generatePatientId(hospitalId);
    const newPatient = await createPatient({
      hospitalId,
      patientId: patientIdGenerated,
      name: data.patientName,
      phone: data.patientPhone,
      email: null,
      gender: data.patientGender || null,
      dateOfBirth: null, // Age will be stored in allocation
      bloodGroup: null,
      address: null,
      profilePhoto: null,
      documents: null,
      patientType: "IPD",
      allergies: null,
      emergencyName: data.attendantName || null,
      emergencyRelation: data.attendantName ? "Attendant" : null,
      emergencyPhone: data.attendantPhone || null,
    });
    patientId = newPatient.id;
  } else if (data.patientId) {
    // Verify patient exists
    const patient = await findPatientById(data.patientId, hospitalId);
    if (!patient) throw new AllocationServiceError("Patient not found", "PATIENT_NOT_FOUND", 404);
  }

  const bed = await findBedById(data.bedId, hospitalId) as any;
  if (!bed) throw new AllocationServiceError("Bed not found", "BED_NOT_FOUND", 404);
  if (bed.status !== "AVAILABLE") {
    throw new AllocationServiceError(
      `Bed is currently ${bed.status.toLowerCase()}. Only available beds can be allocated.`,
      "BED_NOT_AVAILABLE", 400
    );
  }

  const existingActive = await findActiveAllocationByBed(data.bedId);
  if (existingActive) {
    throw new AllocationServiceError(
      "This bed already has an active allocation", "ALREADY_ALLOCATED", 409
    );
  }

  await updateBed(data.bedId, hospitalId, { status: "OCCUPIED" });

  return createAllocation({
    hospitalId,
    bedId: data.bedId,
    patientId,
    patientName: data.patientName,
    patientAge: data.patientAge,
    patientGender: data.patientGender,
    patientPhone: data.patientPhone,
    attendantName: data.attendantName,
    attendantPhone: data.attendantPhone,
    diagnosis: data.diagnosis,
    admittingDoctorName: data.admittingDoctorName,
    admissionDate: data.admissionDate ? new Date(data.admissionDate) : new Date(),
    expectedDischargeDate: data.expectedDischargeDate ? new Date(data.expectedDischargeDate) : null,
    notes: data.notes,
    departmentId: data.departmentId,
    entryType: data.entryType || "PATIENT",
    status: "ACTIVE",
  });
};

export const dischargeBed = async (hospitalId: string, allocationId: string, data?: {
  actualDischargeDate?: string;
  notes?: string;
}) => {
  const allocation = await findAllocationById(allocationId, hospitalId) as any;
  if (!allocation) throw new AllocationServiceError("Allocation not found", "NOT_FOUND", 404);
  if (allocation.status !== "ACTIVE") {
    throw new AllocationServiceError("This allocation is already discharged", "ALREADY_DISCHARGED");
  }

  const dischargeDate = data?.actualDischargeDate
    ? new Date(data.actualDischargeDate)
    : new Date();

  await updateAllocation(allocationId, hospitalId, {
    status: "DISCHARGED",
    actualDischargeDate: dischargeDate,
    ...(data?.notes ? { notes: data.notes } : {}),
  });

  await updateBed(allocation.bedId, hospitalId, { status: "AVAILABLE" });

  return findAllocationById(allocationId, hospitalId);
};

export const getBedStatusOverviewService = async (hospitalId: string) => {
  return getBedStatusOverview(hospitalId);
};

export const getAllAllocationsService = async (hospitalId: string, status?: string) => {
  return findAllAllocations(hospitalId, status);
};

export const updateBedStatusService = async (hospitalId: string, bedId: string, status: string) => {
  const bed = await findBedById(bedId, hospitalId) as any;
  if (!bed) throw new AllocationServiceError("Bed not found", "BED_NOT_FOUND", 404);

  if (bed.status === "OCCUPIED" && status !== "OCCUPIED") {
    const active = await findActiveAllocationByBed(bedId);
    if (active) {
      throw new AllocationServiceError(
        "Cannot change status of occupied bed. Discharge patient first.",
        "BED_OCCUPIED", 400
      );
    }
  }

  await updateBed(bedId, hospitalId, { status });
  return findBedById(bedId, hospitalId);
};
