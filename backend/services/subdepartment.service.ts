import prisma from "../config/db";
import { hashPassword } from "../utils/hash";
import {
  CreateSubDepartmentInput,
  UpdateSubDepartmentInput,
  CreateProcedureInput,
  UpdateProcedureInput,
} from "../validations/subdepartment.validation";
import * as repo from "../repositories/subdepartment.repo";

export class SubDeptServiceError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
  }
}

// ─── Predefined Procedures per type ──────────────────────────────────────────

const PRESET_PROCEDURES: Record<string, Array<{ name: string; type: string; description?: string }>> = {
  DENTAL: [
    { name: "Scaling (Teeth Cleaning)", type: "TREATMENT", description: "Professional dental scaling and polishing" },
    { name: "Filling (Cavities)", type: "TREATMENT", description: "Dental cavity filling procedure" },
    { name: "Root Canal Treatment (RCT)", type: "SURGERY", description: "Root canal treatment for infected tooth" },
    { name: "Tooth Extraction", type: "SURGERY", description: "Surgical or simple tooth extraction" },
    { name: "Braces Consultation / Fitting", type: "CONSULTATION", description: "Orthodontic braces consultation and fitting" },
    { name: "Dental X-Ray", type: "DIAGNOSTIC", description: "Intraoral or panoramic dental X-ray" },
    { name: "Minor Oral Surgery", type: "SURGERY", description: "Minor oral surgical procedures" },
  ],
  DERMATOLOGY: [
    { name: "Skin Treatment (Acne, Allergy)", type: "TREATMENT", description: "Treatment for acne, allergies and skin conditions" },
    { name: "Chemical Peeling", type: "THERAPY", description: "Chemical peel for skin rejuvenation" },
    { name: "Laser Therapy", type: "THERAPY", description: "Laser-based skin treatment" },
    { name: "Skin Biopsy", type: "DIAGNOSTIC", description: "Skin tissue biopsy for diagnosis" },
    { name: "Medication (Topical / Oral)", type: "MEDICATION", description: "Prescription topical or oral medication" },
  ],
  HAIR: [
    { name: "PRP Therapy (Hair Treatment)", type: "THERAPY", description: "Platelet-rich plasma therapy for hair growth" },
    { name: "Hair Fall Treatment Plan", type: "TREATMENT", description: "Comprehensive hair fall treatment program" },
    { name: "Scalp Analysis", type: "DIAGNOSTIC", description: "Trichoscopy and scalp analysis" },
    { name: "Hair Transplant", type: "SURGERY", description: "Surgical hair transplant (Daycare/IPD)" },
  ],
  ONCOLOGY: [
    { name: "Diagnostic Tests (Biopsy, CT, MRI)", type: "DIAGNOSTIC", description: "Biopsy, CT scan, MRI and oncology diagnostics" },
    { name: "Chemotherapy Sessions", type: "TREATMENT", description: "Chemotherapy infusion sessions" },
    { name: "Radiation Therapy", type: "THERAPY", description: "External beam radiation therapy" },
    { name: "Oncology Surgery (IPD)", type: "SURGERY", description: "Surgical oncology procedures requiring admission" },
    { name: "Palliative Care", type: "TREATMENT", description: "Comfort and palliative care services" },
  ],
  CARDIOLOGY: [
    { name: "ECG (Electrocardiogram)", type: "DIAGNOSTIC", description: "12-lead ECG recording" },
    { name: "2D Echo (Echocardiography)", type: "DIAGNOSTIC", description: "2D echocardiogram with colour doppler" },
    { name: "Stress Test (TMT)", type: "DIAGNOSTIC", description: "Treadmill stress test" },
    { name: "Blood Tests (Cardiac Panel)", type: "DIAGNOSTIC", description: "Troponin, lipid profile and cardiac markers" },
    { name: "Angiography", type: "DIAGNOSTIC", description: "Coronary angiography" },
    { name: "Angioplasty (IPD)", type: "SURGERY", description: "Percutaneous coronary intervention" },
    { name: "Medication Plan", type: "MEDICATION", description: "Cardiac medication protocol" },
  ],
  PATHOLOGY: [
    { name: "Complete Blood Count (CBC)", type: "DIAGNOSTIC" },
    { name: "Blood Sugar (Fasting/PP/Random)", type: "DIAGNOSTIC" },
    { name: "Liver Function Test (LFT)", type: "DIAGNOSTIC" },
    { name: "Kidney Function Test (KFT)", type: "DIAGNOSTIC" },
    { name: "Thyroid Profile (T3/T4/TSH)", type: "DIAGNOSTIC" },
    { name: "Urine Routine & Microscopy", type: "DIAGNOSTIC" },
    { name: "Lipid Profile", type: "DIAGNOSTIC" },
    { name: "Culture & Sensitivity", type: "DIAGNOSTIC" },
  ],
  PHARMACY: [
    { name: "OPD Prescription Dispensing", type: "MEDICATION" },
    { name: "IPD Medication Supply", type: "MEDICATION" },
    { name: "Injection Administration", type: "TREATMENT" },
    { name: "IV Fluid Supply", type: "MEDICATION" },
  ],
  BILLING: [
    { name: "OPD Billing", type: "CONSULTATION" },
    { name: "IPD Billing", type: "CONSULTATION" },
    { name: "Insurance Processing", type: "OTHER" },
    { name: "Discharge Summary Billing", type: "OTHER" },
  ],
};

const FLOW_TEMPLATES: Record<string, string> = {
  DENTAL: "OPD → Dental Procedure → Billing → Follow-up",
  DERMATOLOGY: "OPD → Procedure / Prescription → Follow-up",
  HAIR: "OPD → Session-based Treatment → Follow-up cycles",
  ONCOLOGY: "OPD → Diagnostic → Treatment Plan → (Chemo / Radiation / Surgery) → Follow-up",
  CARDIOLOGY: "OPD → Diagnostic → Treatment → (Medication / Procedure / Admission)",
  PATHOLOGY: "Request → Sample Collection → Processing → Report → Doctor Review",
  PHARMACY: "Prescription → Dispensing → Billing → Patient Handover",
  BILLING: "Service Rendered → Bill Generation → Payment → Receipt",
};

const TYPE_COLORS: Record<string, string> = {
  DENTAL: "#06b6d4",
  DERMATOLOGY: "#ec4899",
  HAIR: "#8b5cf6",
  ONCOLOGY: "#f97316",
  CARDIOLOGY: "#ef4444",
  PATHOLOGY: "#10b981",
  PHARMACY: "#0E898F",
  BILLING: "#f59e0b",
  RADIOLOGY: "#6366f1",
  LABORATORY: "#14b8a6",
  PROCEDURE: "#84cc16",
  OTHER: "#94a3b8",
};

// ─── Sub-Department Service ───────────────────────────────────────────────────

export const createSubDepartment = async (hospitalId: string, data: CreateSubDepartmentInput) => {
  // Check duplicate
  const exists = await prisma.subDepartment.findFirst({
    where: { hospitalId, name: data.name, type: data.type as any },
  });
  if (exists) throw new SubDeptServiceError("A sub-department with this name and type already exists", 409);

  // Auto-fill flow and color from type if not provided
  if (!data.flow && FLOW_TEMPLATES[data.type]) data.flow = FLOW_TEMPLATES[data.type];
  if (!data.color && TYPE_COLORS[data.type]) data.color = TYPE_COLORS[data.type];

  const subDept = await repo.createSubDepartment(hospitalId, data);

  // Seed preset procedures if available
  const presets = PRESET_PROCEDURES[data.type];
  if (presets && presets.length > 0) {
    await repo.bulkCreateProcedures(
      hospitalId,
      subDept.id,
      presets.map((p, i) => ({ ...p, sequence: i }))
    );
  }

  // Auto-create User record if loginEmail provided
  if (data.loginEmail) {
    const yr = new Date().getFullYear();
    const pfx = (data.hodName || data.name).split(" ")[0].replace(/[^a-zA-Z0-9]/g, "") || "Dept";
    const rawPw = `${pfx}@${yr}`;
    const hashed = await hashPassword(rawPw);
    const user = await prisma.user.upsert({
      where: { email: data.loginEmail },
      create: { hospitalId, name: data.hodName || data.name, email: data.loginEmail, password: hashed, role: "SUB_DEPT_HEAD" as any },
      update: { name: data.hodName || data.name, password: hashed, role: "SUB_DEPT_HEAD" as any, isActive: true },
    });
    await repo.setSubDepartmentCredentials(subDept.id, user.id, true);
  }

  return repo.findSubDepartmentById(subDept.id, hospitalId);
};

export const getSubDepartments = async (params: {
  hospitalId: string;
  search?: string;
  type?: string;
  isActive?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}) => {
  return repo.findSubDepartments(params);
};

export const getSubDepartmentById = async (id: string, hospitalId: string) => {
  const subDept = await repo.findSubDepartmentById(id, hospitalId);
  if (!subDept) throw new SubDeptServiceError("Sub-department not found", 404);
  return subDept;
};

export const updateSubDepartment = async (id: string, hospitalId: string, data: UpdateSubDepartmentInput) => {
  const existing = await repo.findSubDepartmentById(id, hospitalId);
  if (!existing) throw new SubDeptServiceError("Sub-department not found", 404);

  // Check duplicate name+type (only if changing either)
  if ((data.name && data.name !== existing.name) || (data.type && data.type !== existing.type)) {
    const nameToCheck = data.name || existing.name;
    const typeToCheck = (data.type || existing.type) as string;
    const dup = await prisma.subDepartment.findFirst({
      where: { hospitalId, name: nameToCheck, type: typeToCheck as any, NOT: { id } },
    });
    if (dup) throw new SubDeptServiceError("A sub-department with this name and type already exists", 409);
  }

  const updated = await repo.updateSubDepartment(id, hospitalId, data);

  // Auto-create/update User record if loginEmail provided
  const newEmail = data.loginEmail;
  if (newEmail) {
    const yr = new Date().getFullYear();
    const hodName = data.hodName || (updated as any)?.hodName || (existing as any)?.hodName || data.name || existing.name;
    const pfx = hodName.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "") || "Dept";
    const rawPw = `${pfx}@${yr}`;
    const hashed = await hashPassword(rawPw);
    const existingUserId = (existing as any)?.userId;
    if (existingUserId) {
      // Always reset password to DeptName@Year so admin can re-save to fix broken creds
      await prisma.user.update({
        where: { id: existingUserId },
        data: { email: newEmail, name: hodName, password: hashed, isActive: true },
      });
    } else {
      // Create new user and link — always set password on both create and update
      const user = await prisma.user.upsert({
        where: { email: newEmail },
        create: { hospitalId, name: hodName, email: newEmail, password: hashed, role: "SUB_DEPT_HEAD" as any },
        update: { name: hodName, password: hashed, role: "SUB_DEPT_HEAD" as any, isActive: true },
      });
      await repo.setSubDepartmentCredentials(id, user.id, true);
    }
  }

  return repo.findSubDepartmentById(id, hospitalId);
};

export const deleteSubDepartment = async (id: string, hospitalId: string) => {
  const existing = await repo.findSubDepartmentById(id, hospitalId);
  if (!existing) throw new SubDeptServiceError("Sub-department not found", 404);
  return repo.deleteSubDepartment(id, hospitalId);
};

export const toggleSubDepartmentStatus = async (id: string, hospitalId: string, isActive: boolean) => {
  const existing = await repo.findSubDepartmentById(id, hospitalId);
  if (!existing) throw new SubDeptServiceError("Sub-department not found", 404);
  return repo.toggleSubDepartmentStatus(id, isActive);
};

// ─── Credentials ──────────────────────────────────────────────────────────────

export const createSubDeptCredentials = async (id: string, hospitalId: string) => {
  const subDept = await repo.findSubDepartmentById(id, hospitalId);
  if (!subDept) throw new SubDeptServiceError("Sub-department not found", 404);

  if (subDept.credentialsSent && subDept.userId) {
    throw new SubDeptServiceError("Credentials already sent. Use resend instead.", 409);
  }

  const loginEmail = subDept.loginEmail;
  if (!loginEmail) throw new SubDeptServiceError("Login email not set for this sub-department", 400);

  const year = new Date().getFullYear();
  const prefix = (subDept.hodName || subDept.name).split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
  const rawPassword = `${prefix}@${year}`;
  const hashed = await hashPassword(rawPassword);

  // Create User record
  const user = await prisma.user.create({
    data: {
      hospitalId,
      name: subDept.hodName || subDept.name,
      email: loginEmail,
      password: hashed,
      role: "SUB_DEPT_HEAD",
    },
  });

  await repo.setSubDepartmentCredentials(id, user.id, true);
  await (prisma as any).subDepartment.update({ where: { id }, data: { loginPasswordPlain: rawPassword } });

  return { email: loginEmail, password: rawPassword };
};

export const resendSubDeptCredentials = async (id: string, hospitalId: string) => {
  const subDept = await repo.findSubDepartmentById(id, hospitalId);
  if (!subDept) throw new SubDeptServiceError("Sub-department not found", 404);

  const loginEmail = subDept.loginEmail;
  if (!loginEmail) throw new SubDeptServiceError("Login email not set for this sub-department", 400);

  const yr = new Date().getFullYear();
  const pfx = (subDept.hodName || subDept.name).split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
  const rawPassword = `${pfx}@${yr}`;
  const hashed = await hashPassword(rawPassword);

  if (subDept.userId) {
    await prisma.user.update({
      where: { id: subDept.userId },
      data: { password: hashed },
    });
  } else {
    const user = await prisma.user.create({
      data: {
        hospitalId,
        name: subDept.hodName || subDept.name,
        email: loginEmail,
        password: hashed,
        role: "SUB_DEPT_HEAD",
      },
    });
    await repo.setSubDepartmentCredentials(id, user.id, true);
  }
  await (prisma as any).subDepartment.update({ where: { id }, data: { loginPasswordPlain: rawPassword } });

  return { email: loginEmail, password: rawPassword };
};

// ─── Procedure Service ────────────────────────────────────────────────────────

export const createProcedure = async (hospitalId: string, data: CreateProcedureInput) => {
  const subDept = await repo.findSubDepartmentById(data.subDepartmentId, hospitalId);
  if (!subDept) throw new SubDeptServiceError("Sub-department not found", 404);
  return repo.createProcedure(hospitalId, data);
};

export const getProcedures = async (params: {
  hospitalId: string;
  subDepartmentId?: string;
  search?: string;
  type?: string;
  isActive?: string;
}) => {
  return repo.findProcedures(params);
};

export const getProcedureById = async (id: string, hospitalId: string) => {
  const proc = await repo.findProcedureById(id, hospitalId);
  if (!proc) throw new SubDeptServiceError("Procedure not found", 404);
  return proc;
};

export const updateProcedure = async (id: string, hospitalId: string, data: UpdateProcedureInput) => {
  const proc = await repo.findProcedureById(id, hospitalId);
  if (!proc) throw new SubDeptServiceError("Procedure not found", 404);
  return repo.updateProcedure(id, hospitalId, data);
};

export const deleteProcedure = async (id: string, hospitalId: string) => {
  const proc = await repo.findProcedureById(id, hospitalId);
  if (!proc) throw new SubDeptServiceError("Procedure not found", 404);
  return repo.deleteProcedure(id, hospitalId);
};

export const getSubDeptProfile = async (userId: string) => {
  const subDept = await repo.findSubDepartmentByUserId(userId);
  if (!subDept) throw new SubDeptServiceError("Sub-department profile not found", 404);
  return subDept;
};
