import prisma from "../config/db";

const db = prisma as any;

// ─── IPD Admission ────────────────────────────────────────────────────────────

export const generateIPDNumber = async (hospitalId: string): Promise<string> => {
  const count = await db.iPDAdmission.count({ where: { hospitalId } });
  return `IPD-${String(count + 1).padStart(5, "0")}`;
};

export const createIPDAdmission = async (data: {
  hospitalId: string;
  allocationId: string;
  patientId?: string | null;
  ipdNumber: string;
  admissionType?: string;
  assignedDoctorId?: string | null;
  departmentId?: string | null;
  insuranceProvider?: string | null;
  insuranceId?: string | null;
  corporateName?: string | null;
  admissionNotes?: string | null;
}) => {
  return db.iPDAdmission.create({
    data,
    include: ipdAdmissionInclude,
  });
};

export const findIPDAdmissionById = async (id: string, hospitalId: string) => {
  return db.iPDAdmission.findFirst({
    where: { id, hospitalId },
    include: ipdAdmissionInclude,
  });
};

export const findIPDAdmissionByAllocationId = async (allocationId: string, hospitalId: string) => {
  return db.iPDAdmission.findFirst({
    where: { allocationId, hospitalId },
    include: ipdAdmissionInclude,
  });
};

export const findAllIPDAdmissions = async (
  hospitalId: string,
  opts: { status?: string; search?: string; page?: number; limit?: number } = {}
) => {
  const { status, search, page = 1, limit = 20 } = opts;
  const skip = (page - 1) * limit;

  const where: any = { hospitalId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { ipdNumber: { contains: search } },
      { allocation: { patientName: { contains: search } } },
    ];
  }

  const [data, total] = await Promise.all([
    db.iPDAdmission.findMany({
      where,
      include: ipdAdmissionInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.iPDAdmission.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const updateIPDAdmission = async (id: string, hospitalId: string, data: any) => {
  return db.iPDAdmission.updateMany({ where: { id, hospitalId }, data });
};

export const getIPDDashboardStats = async (hospitalId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalAdmitted,
    dischargedToday,
    admittedToday,
    allAdmitted,
  ] = await Promise.all([
    db.iPDAdmission.count({ where: { hospitalId, status: "ADMITTED" } }),
    db.iPDAdmission.count({
      where: { hospitalId, status: "DISCHARGED", updatedAt: { gte: today, lt: tomorrow } },
    }),
    db.iPDAdmission.count({
      where: { hospitalId, createdAt: { gte: today, lt: tomorrow } },
    }),
    db.iPDAdmission.findMany({
      where: { hospitalId, status: "ADMITTED" },
      select: { createdAt: true, allocation: { select: { admissionDate: true } } },
    }),
  ]);

  // Average length of stay (days)
  const now = Date.now();
  const alos =
    allAdmitted.length > 0
      ? Math.round(
          allAdmitted.reduce((sum: number, a: any) => {
            const admDate = a.allocation?.admissionDate
              ? new Date(a.allocation.admissionDate).getTime()
              : new Date(a.createdAt).getTime();
            return sum + (now - admDate) / (1000 * 60 * 60 * 24);
          }, 0) / allAdmitted.length
        )
      : 0;

  return { totalAdmitted, dischargedToday, admittedToday, alos };
};

// ─── Vitals ───────────────────────────────────────────────────────────────────

export const createVitals = async (data: {
  hospitalId: string;
  admissionId: string;
  recordedBy?: string | null;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  pulse?: number | null;
  temperature?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  bloodSugar?: number | null;
  weight?: number | null;
  notes?: string | null;
}) => {
  return db.iPDVitals.create({ data });
};

export const findVitalsForAdmission = async (admissionId: string, hospitalId: string) => {
  return db.iPDVitals.findMany({
    where: { admissionId, hospitalId },
    orderBy: { recordedAt: "desc" },
  });
};

export const getLatestVitals = async (admissionId: string, hospitalId: string) => {
  return db.iPDVitals.findFirst({
    where: { admissionId, hospitalId },
    orderBy: { recordedAt: "desc" },
  });
};

// ─── Clinical Notes ───────────────────────────────────────────────────────────

export const createClinicalNote = async (data: {
  hospitalId: string;
  admissionId: string;
  type: string;
  content: string;
  authorName: string;
  authorRole?: string | null;
}) => {
  return db.iPDClinicalNote.create({ data });
};

export const findNotesForAdmission = async (admissionId: string, hospitalId: string) => {
  return db.iPDClinicalNote.findMany({
    where: { admissionId, hospitalId },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Medication Orders ────────────────────────────────────────────────────────

export const createMedicationOrder = async (data: {
  hospitalId: string;
  admissionId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route?: string;
  startDate?: Date;
  endDate?: Date | null;
  prescribedBy?: string | null;
  notes?: string | null;
}) => {
  return db.iPDMedicationOrder.create({ data, include: { administrations: true } });
};

export const findMedicationsForAdmission = async (admissionId: string, hospitalId: string) => {
  return db.iPDMedicationOrder.findMany({
    where: { admissionId, hospitalId },
    include: { administrations: { orderBy: { scheduledTime: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
};

export const updateMedicationOrder = async (id: string, hospitalId: string, data: any) => {
  return db.iPDMedicationOrder.updateMany({ where: { id, hospitalId }, data });
};

// ─── Medication Administration ────────────────────────────────────────────────

export const createMedicationAdmin = async (data: {
  hospitalId: string;
  orderId: string;
  scheduledTime: Date;
  administeredAt?: Date | null;
  administeredBy?: string | null;
  status?: string;
  notes?: string | null;
}) => {
  return db.iPDMedicationAdministration.create({ data });
};

export const findMARForOrder = async (orderId: string, hospitalId: string) => {
  return db.iPDMedicationAdministration.findMany({
    where: { orderId, hospitalId },
    orderBy: { scheduledTime: "asc" },
  });
};

// ─── Bed Transfers ────────────────────────────────────────────────────────────

export const createBedTransfer = async (data: {
  hospitalId: string;
  admissionId: string;
  fromBedId?: string | null;
  toBedId?: string | null;
  fromWardId?: string | null;
  toWardId?: string | null;
  reason?: string | null;
  transferredBy?: string | null;
}) => {
  return db.iPDBedTransfer.create({ data });
};

export const findTransfersForAdmission = async (admissionId: string, hospitalId: string) => {
  return db.iPDBedTransfer.findMany({
    where: { admissionId, hospitalId },
    orderBy: { transferredAt: "desc" },
  });
};

// ─── Discharge Summary ────────────────────────────────────────────────────────

export const createDischargeSummary = async (data: {
  hospitalId: string;
  admissionId: string;
  finalDiagnosis?: string | null;
  conditionAtDischarge?: string | null;
  dischargeMedications?: string | null;
  followUpInstructions?: string | null;
  dietaryInstructions?: string | null;
  billingCleared?: boolean;
  dischargedBy?: string | null;
}) => {
  return db.iPDDischargeSummary.create({ data });
};

export const findDischargeSummary = async (admissionId: string, hospitalId: string) => {
  return db.iPDDischargeSummary.findFirst({ where: { admissionId, hospitalId } });
};

// ─── Shared include ───────────────────────────────────────────────────────────

const ipdAdmissionInclude = {
  allocation: {
    include: {
      bed: {
        include: {
          ward: { select: { name: true, type: true } },
          room: { select: { roomNumber: true } },
        },
      },
    },
  },
  patient: {
    select: { id: true, patientId: true, name: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true },
  },
  vitals: { orderBy: { recordedAt: "desc" as const }, take: 1 },
  dischargeSummary: true,
};
