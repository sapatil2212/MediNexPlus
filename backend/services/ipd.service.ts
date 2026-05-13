import {
  generateIPDNumber,
  createIPDAdmission,
  findIPDAdmissionById,
  findIPDAdmissionByAllocationId,
  findAllIPDAdmissions,
  updateIPDAdmission,
  getIPDDashboardStats,
  createVitals,
  findVitalsForAdmission,
  getLatestVitals,
  createClinicalNote,
  findNotesForAdmission,
  createMedicationOrder,
  findMedicationsForAdmission,
  updateMedicationOrder,
  createMedicationAdmin,
  findMARForOrder,
  createBedTransfer,
  findTransfersForAdmission,
  createDischargeSummary,
  findDischargeSummary,
} from "../repositories/ipd.repo";
import {
  findAllocationById,
  updateAllocation,
  getBedStatusOverview,
} from "../repositories/allocation.repo";
import { findBedById, updateBed } from "../repositories/bed.repo";

export class IPDServiceError extends Error {
  constructor(public message: string, public code: string, public status: number = 400) {
    super(message);
    this.name = "IPDServiceError";
  }
}

// ─── Admissions ───────────────────────────────────────────────────────────────

export const admitPatientIPD = async (
  hospitalId: string,
  data: {
    allocationId: string;
    admissionType?: string;
    assignedDoctorId?: string;
    departmentId?: string;
    insuranceProvider?: string;
    insuranceId?: string;
    corporateName?: string;
    admissionNotes?: string;
  }
) => {
  const allocation = await findAllocationById(data.allocationId, hospitalId) as any;
  if (!allocation) throw new IPDServiceError("Allocation not found", "NOT_FOUND", 404);

  const existing = await findIPDAdmissionByAllocationId(data.allocationId, hospitalId);
  if (existing) throw new IPDServiceError("IPD admission already exists for this allocation", "ALREADY_EXISTS", 409);

  const ipdNumber = await generateIPDNumber(hospitalId);

  return createIPDAdmission({
    hospitalId,
    allocationId: data.allocationId,
    patientId: allocation.patientId || null,
    ipdNumber,
    admissionType: data.admissionType || "PLANNED",
    assignedDoctorId: data.assignedDoctorId || null,
    departmentId: data.departmentId || allocation.departmentId || null,
    insuranceProvider: data.insuranceProvider || null,
    insuranceId: data.insuranceId || null,
    corporateName: data.corporateName || null,
    admissionNotes: data.admissionNotes || null,
  });
};

export const getIPDAdmissions = async (
  hospitalId: string,
  opts: { status?: string; search?: string; page?: number; limit?: number } = {}
) => {
  return findAllIPDAdmissions(hospitalId, opts);
};

export const getIPDAdmission = async (id: string, hospitalId: string) => {
  const admission = await findIPDAdmissionById(id, hospitalId);
  if (!admission) throw new IPDServiceError("IPD admission not found", "NOT_FOUND", 404);
  return admission;
};

export const updateIPDAdmissionService = async (id: string, hospitalId: string, data: any) => {
  await findIPDAdmissionById(id, hospitalId).then(a => {
    if (!a) throw new IPDServiceError("IPD admission not found", "NOT_FOUND", 404);
  });
  await updateIPDAdmission(id, hospitalId, data);
  return findIPDAdmissionById(id, hospitalId);
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getIPDOverview = async (hospitalId: string) => {
  const [ipdStats, bedOverview] = await Promise.all([
    getIPDDashboardStats(hospitalId),
    getBedStatusOverview(hospitalId),
  ]);

  const beds: any[] = (bedOverview as any).beds || [];
  const bedSummary = {
    total: beds.length,
    available: beds.filter((b: any) => b.status === "AVAILABLE").length,
    occupied: beds.filter((b: any) => b.status === "OCCUPIED").length,
    maintenance: beds.filter((b: any) => b.status === "MAINTENANCE").length,
    reserved: beds.filter((b: any) => b.status === "RESERVED").length,
    occupancyRate: beds.length > 0
      ? Math.round((beds.filter((b: any) => b.status === "OCCUPIED").length / beds.length) * 100)
      : 0,
  };

  // Ward-wise breakdown
  const wardMap: Record<string, { name: string; total: number; occupied: number }> = {};
  for (const bed of beds) {
    const wName = bed.ward?.name || "Unknown";
    if (!wardMap[wName]) wardMap[wName] = { name: wName, total: 0, occupied: 0 };
    wardMap[wName].total++;
    if (bed.status === "OCCUPIED") wardMap[wName].occupied++;
  }
  const wardBreakdown = Object.values(wardMap);

  return { ...ipdStats, bedSummary, wardBreakdown };
};

// ─── Vitals ───────────────────────────────────────────────────────────────────

export const recordVitals = async (
  hospitalId: string,
  admissionId: string,
  data: {
    recordedBy?: string;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    pulse?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    bloodSugar?: number;
    weight?: number;
    notes?: string;
  }
) => {
  const admission = await findIPDAdmissionById(admissionId, hospitalId);
  if (!admission) throw new IPDServiceError("Admission not found", "NOT_FOUND", 404);
  return createVitals({ hospitalId, admissionId, ...data });
};

export const getVitalsHistory = async (admissionId: string, hospitalId: string) => {
  return findVitalsForAdmission(admissionId, hospitalId);
};

// ─── Clinical Notes ───────────────────────────────────────────────────────────

export const addClinicalNote = async (
  hospitalId: string,
  admissionId: string,
  data: { type: string; content: string; authorName: string; authorRole?: string }
) => {
  const admission = await findIPDAdmissionById(admissionId, hospitalId);
  if (!admission) throw new IPDServiceError("Admission not found", "NOT_FOUND", 404);
  return createClinicalNote({ hospitalId, admissionId, ...data });
};

export const getClinicalNotes = async (admissionId: string, hospitalId: string) => {
  return findNotesForAdmission(admissionId, hospitalId);
};

// ─── Medications ──────────────────────────────────────────────────────────────

export const orderMedication = async (
  hospitalId: string,
  admissionId: string,
  data: {
    medicationName: string;
    dosage: string;
    frequency: string;
    route?: string;
    startDate?: string;
    endDate?: string;
    prescribedBy?: string;
    notes?: string;
  }
) => {
  const admission = await findIPDAdmissionById(admissionId, hospitalId);
  if (!admission) throw new IPDServiceError("Admission not found", "NOT_FOUND", 404);
  return createMedicationOrder({
    hospitalId,
    admissionId,
    medicationName: data.medicationName,
    dosage: data.dosage,
    frequency: data.frequency,
    route: data.route,
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    endDate: data.endDate ? new Date(data.endDate) : null,
    prescribedBy: data.prescribedBy || null,
    notes: data.notes || null,
  });
};

export const getMedicationChart = async (admissionId: string, hospitalId: string) => {
  return findMedicationsForAdmission(admissionId, hospitalId);
};

export const administerMedication = async (
  hospitalId: string,
  orderId: string,
  data: { administeredBy?: string; notes?: string; status?: string }
) => {
  return createMedicationAdmin({
    hospitalId,
    orderId,
    scheduledTime: new Date(),
    administeredAt: new Date(),
    administeredBy: data.administeredBy || null,
    status: data.status || "GIVEN",
    notes: data.notes || null,
  });
};

export const discontinueMedication = async (id: string, hospitalId: string) => {
  return updateMedicationOrder(id, hospitalId, { status: "DISCONTINUED" });
};

// ─── Transfers ────────────────────────────────────────────────────────────────

export const transferBed = async (
  hospitalId: string,
  admissionId: string,
  data: {
    newBedId: string;
    reason?: string;
    transferredBy?: string;
  }
) => {
  const admission = await findIPDAdmissionById(admissionId, hospitalId) as any;
  if (!admission) throw new IPDServiceError("Admission not found", "NOT_FOUND", 404);
  if (admission.status !== "ADMITTED") throw new IPDServiceError("Patient is not currently admitted", "INVALID_STATUS");

  const currentBed = admission.allocation?.bed;
  const newBed = await findBedById(data.newBedId, hospitalId) as any;
  if (!newBed) throw new IPDServiceError("Target bed not found", "BED_NOT_FOUND", 404);
  if (newBed.status !== "AVAILABLE") throw new IPDServiceError("Target bed is not available", "BED_NOT_AVAILABLE");

  // Free old bed, occupy new bed
  if (currentBed?.id) await updateBed(currentBed.id, hospitalId, { status: "AVAILABLE" });
  await updateBed(data.newBedId, hospitalId, { status: "OCCUPIED" });

  // Update allocation to point to new bed
  await updateAllocation(admission.allocationId, hospitalId, { bedId: data.newBedId });

  // Record transfer
  await createBedTransfer({
    hospitalId,
    admissionId,
    fromBedId: currentBed?.id || null,
    toBedId: data.newBedId,
    fromWardId: currentBed?.ward?.id || null,
    toWardId: newBed.wardId || null,
    reason: data.reason || null,
    transferredBy: data.transferredBy || null,
  });

  return findIPDAdmissionById(admissionId, hospitalId);
};

export const getTransferHistory = async (admissionId: string, hospitalId: string) => {
  return findTransfersForAdmission(admissionId, hospitalId);
};

// ─── Discharge ────────────────────────────────────────────────────────────────

export const dischargePatientIPD = async (
  hospitalId: string,
  admissionId: string,
  data: {
    finalDiagnosis?: string;
    conditionAtDischarge?: string;
    dischargeMedications?: string;
    followUpInstructions?: string;
    dietaryInstructions?: string;
    billingCleared?: boolean;
    dischargedBy?: string;
    actualDischargeDate?: string;
    notes?: string;
  }
) => {
  const admission = await findIPDAdmissionById(admissionId, hospitalId) as any;
  if (!admission) throw new IPDServiceError("Admission not found", "NOT_FOUND", 404);
  if (admission.status !== "ADMITTED") throw new IPDServiceError("Patient is not currently admitted", "INVALID_STATUS");

  // Create discharge summary
  await createDischargeSummary({
    hospitalId,
    admissionId,
    finalDiagnosis: data.finalDiagnosis || null,
    conditionAtDischarge: data.conditionAtDischarge || null,
    dischargeMedications: data.dischargeMedications || null,
    followUpInstructions: data.followUpInstructions || null,
    dietaryInstructions: data.dietaryInstructions || null,
    billingCleared: data.billingCleared || false,
    dischargedBy: data.dischargedBy || null,
  });

  // Update IPD admission status
  await updateIPDAdmission(admissionId, hospitalId, { status: "DISCHARGED" });

  // Update bed allocation
  const dischargeDate = data.actualDischargeDate ? new Date(data.actualDischargeDate) : new Date();
  await updateAllocation(admission.allocationId, hospitalId, {
    status: "DISCHARGED",
    actualDischargeDate: dischargeDate,
    ...(data.notes ? { notes: data.notes } : {}),
  });

  // Free the bed
  const bedId = admission.allocation?.bed?.id;
  if (bedId) await updateBed(bedId, hospitalId, { status: "AVAILABLE" });

  return findIPDAdmissionById(admissionId, hospitalId);
};

export const getDischargeSummaryService = async (admissionId: string, hospitalId: string) => {
  return findDischargeSummary(admissionId, hospitalId);
};
