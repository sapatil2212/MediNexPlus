import prisma from "../config/db";

const px = prisma as any;

// ─── Generate sequential prescription number ───
export async function generatePrescriptionNo(hospitalId: string): Promise<string> {
  const count = await px.prescription.count({ where: { hospitalId } });
  return `RX-${String(count + 1).padStart(4, "0")}`;
}

// ─── Generate sequential bill number ───
export async function generateBillNo(hospitalId: string): Promise<string> {
  const last = await px.bill.findFirst({
    where: { hospitalId, billNo: { startsWith: "BILL-" } },
    orderBy: { billNo: "desc" },
    select: { billNo: true },
  });
  let next = 1;
  if (last?.billNo) {
    const m = last.billNo.match(/(\d+)$/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `BILL-${String(next).padStart(4, "0")}`;
}

// ─── Create Prescription ───
export async function createPrescription(data: any) {
  return px.prescription.create({
    data,
    include: {
      patient: true,
      doctor: { include: { department: true } },
      appointment: true,
      workflows: { include: { subDepartment: true }, orderBy: { sequence: "asc" } },
    },
  });
}

// ─── Find Prescription by ID ───
export async function findPrescriptionById(id: string, hospitalId: string) {
  return px.prescription.findFirst({
    where: { id, hospitalId },
    include: {
      patient: true,
      doctor: { include: { department: true, hospital: { include: { settings: true } } } },
      appointment: true,
      workflows: { include: { subDepartment: true }, orderBy: { sequence: "asc" } },
      bill: true,
    },
  });
}

// ─── Find Prescription by Appointment ID ───
export async function findPrescriptionByAppointmentId(appointmentId: string, hospitalId: string) {
  return px.prescription.findFirst({
    where: { appointmentId, hospitalId },
    include: {
      patient: true,
      doctor: { include: { department: true, hospital: { include: { settings: true } } } },
      appointment: true,
      workflows: { include: { subDepartment: true }, orderBy: { sequence: "asc" } },
      bill: true,
    },
  });
}

// ─── List Prescriptions ───
export async function findAllPrescriptions(options: {
  hospitalId: string;
  patientId?: string;
  doctorId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { hospitalId, patientId, doctorId, status, search, page = 1, limit = 20 } = options;
  const where: any = { hospitalId };

  if (patientId) where.patientId = patientId;
  if (doctorId) where.doctorId = doctorId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { prescriptionNo: { contains: search } },
      { patient: { name: { contains: search } } },
      { patient: { patientId: { contains: search } } },
      { diagnosis: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    px.prescription.findMany({
      where,
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, specialization: true } },
        appointment: { select: { id: true, appointmentDate: true, timeSlot: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    px.prescription.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Update Prescription ───
export async function updatePrescription(id: string, hospitalId: string, data: any) {
  return px.prescription.update({
    where: { id },
    data,
    include: {
      patient: true,
      doctor: { include: { department: true } },
      appointment: true,
      workflows: { include: { subDepartment: true }, orderBy: { sequence: "asc" } },
      bill: true,
    },
  });
}

// ─── Create Workflow Steps ───
export async function createWorkflowSteps(steps: any[]) {
  return px.prescriptionWorkflow.createMany({ data: steps });
}

// ─── Update Workflow Step ───
export async function updateWorkflowStep(id: string, data: any) {
  return px.prescriptionWorkflow.update({
    where: { id },
    data,
    include: { subDepartment: true },
  });
}

// ─── Find Workflow Steps for a Prescription ───
export async function findWorkflowSteps(prescriptionId: string) {
  return px.prescriptionWorkflow.findMany({
    where: { prescriptionId },
    include: { subDepartment: true },
    orderBy: { sequence: "asc" },
  });
}

// ─── Find pending workflows for a sub-department ───
export async function findSubDeptWorkflows(hospitalId: string, subDepartmentId: string) {
  return px.prescriptionWorkflow.findMany({
    where: {
      hospitalId,
      subDepartmentId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: {
      prescription: {
        include: {
          patient: true,
          doctor: { select: { id: true, name: true } },
          appointment: { select: { appointmentDate: true, timeSlot: true } },
        },
      },
      subDepartment: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

// ─── Create Bill ───
export async function createBill(data: any) {
  return px.bill.create({
    data,
    include: {
      patient: true,
      prescription: true,
    },
  });
}

// ─── Find Bill by Prescription ───
export async function findBillByPrescription(prescriptionId: string, hospitalId: string) {
  return px.bill.findFirst({
    where: { prescriptionId, hospitalId },
    include: { patient: true, prescription: true },
  });
}

// ─── Get Patient History ───
export async function getPatientPrescriptionHistory(patientId: string, hospitalId: string, excludeId?: string) {
  const where: any = { patientId, hospitalId, status: { in: ["COMPLETED", "IN_WORKFLOW"] } };
  if (excludeId) where.id = { not: excludeId };

  return px.prescription.findMany({
    where,
    select: {
      id: true,
      prescriptionNo: true,
      chiefComplaint: true,
      diagnosis: true,
      medications: true,
      icdCodes: true,
      labTests: true,
      advice: true,
      followUpDate: true,
      createdAt: true,
      doctor: { select: { name: true, specialization: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
