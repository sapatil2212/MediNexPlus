import {
  generatePrescriptionNo,
  generateBillNo,
  createPrescription as createPrescriptionRepo,
  findPrescriptionById,
  findPrescriptionByAppointmentId,
  findAllPrescriptions,
  updatePrescription as updatePrescriptionRepo,
  createWorkflowSteps,
  updateWorkflowStep as updateWorkflowStepRepo,
  findWorkflowSteps,
  createBill as createBillRepo,
  findBillByPrescription,
  getPatientPrescriptionHistory,
} from "../repositories/prescription.repo";
import { CreatePrescriptionInput, UpdatePrescriptionInput } from "../validations/prescription.validation";
import prisma from "../config/db";
import { generateBillFromAppointment, addWorkflowChargesToBill, recalculateBill } from "./billing.service";

const px = prisma as any;

export class PrescriptionServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "PrescriptionServiceError";
  }
}

// ─── Create or get existing prescription for an appointment ───
export async function createOrGetPrescription(hospitalId: string, input: CreatePrescriptionInput, doctorId: string) {
  // Check if prescription already exists for this appointment
  const existing = await findPrescriptionByAppointmentId(input.appointmentId, hospitalId);
  if (existing) return { prescription: existing, isNew: false };

  // Verify appointment exists and belongs to this doctor
  const appointment = await px.appointment.findFirst({
    where: { id: input.appointmentId, hospitalId },
    include: { patient: true, doctor: true },
  });

  if (!appointment) {
    throw new PrescriptionServiceError("Appointment not found", "NOT_FOUND", 404);
  }

  if (appointment.doctorId !== doctorId) {
    throw new PrescriptionServiceError("This appointment belongs to another doctor", "FORBIDDEN", 403);
  }

  const prescriptionNo = await generatePrescriptionNo(hospitalId);

  let prescription;
  try {
    prescription = await createPrescriptionRepo({
      hospitalId,
      prescriptionNo,
      appointmentId: input.appointmentId,
      patientId: appointment.patientId,
      doctorId,
      vitals: input.vitals || null,
      chiefComplaint: input.chiefComplaint || null,
      diagnosis: input.diagnosis || null,
      icdCodes: input.icdCodes || null,
      medications: input.medications || null,
      labTests: input.labTests || null,
      referrals: input.referrals || null,
      advice: input.advice || null,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      followUpNotes: input.followUpNotes || null,
      consultationFee: input.consultationFee ?? appointment.consultationFee ?? null,
      doctorNotes: input.doctorNotes || null,
      status: "DRAFT",
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      const race = await findPrescriptionByAppointmentId(input.appointmentId, hospitalId);
      if (race) return { prescription: race, isNew: false };
    }
    throw err;
  }

  // Update appointment to CONFIRMED (IN_CONSULTATION)
  await px.appointment.update({
    where: { id: input.appointmentId },
    data: { status: "CONFIRMED" },
  }).catch(() => {}); // Non-blocking — don't fail prescription creation if status update fails

  return { prescription, isNew: true };
}

// ─── Get prescription by ID ───
export async function getPrescriptionById(id: string, hospitalId: string) {
  const rx = await findPrescriptionById(id, hospitalId);
  if (!rx) throw new PrescriptionServiceError("Prescription not found", "NOT_FOUND", 404);
  return rx;
}

// ─── Get prescription by appointment ───
export async function getPrescriptionByAppointment(appointmentId: string, hospitalId: string) {
  return findPrescriptionByAppointmentId(appointmentId, hospitalId);
}

// ─── List prescriptions ───
export async function getPrescriptions(options: Parameters<typeof findAllPrescriptions>[0]) {
  return findAllPrescriptions(options);
}

// ─── Update prescription ───
export async function updatePrescriptionData(id: string, hospitalId: string, input: UpdatePrescriptionInput) {
  const existing = await findPrescriptionById(id, hospitalId);
  if (!existing) throw new PrescriptionServiceError("Prescription not found", "NOT_FOUND", 404);

  const data: any = {};
  if (input.vitals !== undefined) data.vitals = input.vitals;
  if (input.chiefComplaint !== undefined) data.chiefComplaint = input.chiefComplaint;
  if (input.diagnosis !== undefined) data.diagnosis = input.diagnosis;
  if (input.icdCodes !== undefined) data.icdCodes = input.icdCodes;
  if (input.medications !== undefined) data.medications = input.medications;
  if (input.labTests !== undefined) data.labTests = input.labTests;
  if (input.referrals !== undefined) data.referrals = input.referrals;
  if (input.advice !== undefined) data.advice = input.advice;
  if (input.followUpDate !== undefined) data.followUpDate = input.followUpDate ? new Date(input.followUpDate) : null;
  if (input.followUpNotes !== undefined) data.followUpNotes = input.followUpNotes;
  if (input.consultationFee !== undefined) data.consultationFee = input.consultationFee;
  if (input.aiSuggestions !== undefined) data.aiSuggestions = input.aiSuggestions;
  if (input.doctorNotes !== undefined) data.doctorNotes = input.doctorNotes;
  if (input.status !== undefined) data.status = input.status;

  const updated = await updatePrescriptionRepo(id, hospitalId, data);

  if (input.consultationFee !== undefined && (existing as any).appointmentId) {
    try {
      await px.appointment.update({
        where: { id: (existing as any).appointmentId },
        data: { consultationFee: input.consultationFee },
      });
    } catch {}

    try {
      const bill = await px.bill.findFirst({
        where: { visitId: (existing as any).appointmentId, hospitalId },
        select: { id: true },
      });
      if (bill?.id) await addWorkflowChargesToBill(bill.id, hospitalId).catch(() => {});
    } catch {}
  }

  return updated;
}

// ─── Complete prescription & create workflow ───
export async function completePrescription(id: string, hospitalId: string, input: UpdatePrescriptionInput) {
  const existing = await findPrescriptionById(id, hospitalId);
  if (!existing) throw new PrescriptionServiceError("Prescription not found", "NOT_FOUND", 404);

  // Update prescription data first
  const data: any = { ...buildUpdateData(input) };

  // Parse referrals to create workflow steps
  let referrals: any[] = [];
  const referralsStr = input.referrals || existing.referrals;
  if (referralsStr) {
    try { referrals = JSON.parse(referralsStr); } catch { referrals = []; }
  }

  const validReferrals = referrals.filter((ref: any) => ref.subDeptId && ref.subDeptId.trim());

  if (validReferrals.length > 0) {
    data.status = "IN_WORKFLOW";
    data.currentDeptId = validReferrals[0].subDeptId;

    // Create workflow steps for each referred sub-department
    const steps = validReferrals.map((ref: any, idx: number) => ({
      hospitalId,
      prescriptionId: id,
      subDepartmentId: ref.subDeptId,
      sequence: idx,
      status: idx === 0 ? "IN_PROGRESS" : "PENDING",
    }));

    const existingSteps = await findWorkflowSteps(id);
    if (!existingSteps || existingSteps.length === 0) {
      await createWorkflowSteps(steps);
    } else {
      const next = existingSteps.find((s: any) => s.status === "IN_PROGRESS") || existingSteps.find((s: any) => s.status === "PENDING") || existingSteps[0];
      if (next?.subDepartmentId) data.currentDeptId = next.subDepartmentId;
    }
  } else {
    data.status = "COMPLETED";
  }

  // Auto-route to pharmacy if medications are prescribed and no pharmacy referral exists
  const medsPayload = input.medications ?? existing.medications;
  if (medsPayload) {
    try {
      const parsedMeds = JSON.parse(medsPayload);
      if (Array.isArray(parsedMeds) && parsedMeds.length > 0) {
        const pharmacySubDept = await px.subDepartment.findFirst({
          where: { hospitalId, type: "PHARMACY" },
        });
        if (pharmacySubDept) {
          const alreadyInReferrals = validReferrals.some((r: any) => r.subDeptId === pharmacySubDept.id);
          if (!alreadyInReferrals) {
            const existingPharmWf = await px.prescriptionWorkflow.findFirst({
              where: { prescriptionId: id, subDepartmentId: pharmacySubDept.id, hospitalId },
            });
            if (!existingPharmWf) {
              await px.prescriptionWorkflow.create({
                data: {
                  hospitalId,
                  prescriptionId: id,
                  subDepartmentId: pharmacySubDept.id,
                  sequence: validReferrals.length,
                  status: "PENDING",
                },
              });
              // If no other referrals, set prescription to IN_WORKFLOW for pharmacy
              if (validReferrals.length === 0) {
                data.status = "IN_WORKFLOW";
                data.currentDeptId = pharmacySubDept.id;
              }
            }
          }
        }
      }
    } catch { /* non-blocking — pharmacy routing failure should not block prescription completion */ }
  }

  // Resolve the final consultation fee: prescription input > existing prescription > appointment
  const finalFee = input.consultationFee ?? existing.consultationFee ?? undefined;

  // Update appointment status to COMPLETED with the consultation fee
  // Always set billingTransferred=true so patient instantly appears in billing queue
  await px.appointment.update({
    where: { id: existing.appointmentId },
    data: {
      status: "COMPLETED",
      billingTransferred: true,
      billingNote: "Auto-transferred on prescription completion",
      notes: existing.chiefComplaint || input.chiefComplaint || undefined,
      ...(finalFee !== undefined ? { consultationFee: finalFee } : {}),
      // Also set sub-department referral on appointment if referrals exist
      ...(validReferrals.length > 0 ? {
        subDepartmentId: validReferrals[0].subDeptId,
        subDeptNote: validReferrals[0].notes || validReferrals[0].reason || null,
      } : {}),
    },
  });

  // Save prescription data first so the bill can read the fee
  const updatedRx = await updatePrescriptionRepo(id, hospitalId, data);

  // Generate bill from appointment automatically
  // This ensures OPD consultation fee is reflected instantly in billing
  let generatedBill: any = null;
  try {
    generatedBill = await generateBillFromAppointment(existing.appointmentId, hospitalId);
  } catch (billErr: any) {
    console.error("[completePrescription] Bill generation failed:", billErr?.message);
  }

  // If a treatment plan is assigned, link patient and add plan cost to bill
  if (input.treatmentPlanId && existing.patientId) {
    try {
      const plan = await (prisma as any).treatmentPlan.findFirst({
        where: { id: input.treatmentPlanId, hospitalId },
        select: { id: true, planName: true, totalCost: true, patientId: true },
      });
      if (plan) {
        // Assign patient to the plan (only if not already assigned)
        await (prisma as any).treatmentPlan.update({
          where: { id: plan.id },
          data: { patientId: existing.patientId },
        });
        // Add plan cost as a bill item if cost > 0
        const bill = generatedBill || await (prisma as any).bill.findFirst({
          where: { visitId: existing.appointmentId, hospitalId },
        });
        if (bill && plan.totalCost > 0) {
          const alreadyAdded = await (prisma as any).billItem.findFirst({
            where: { billId: bill.id, type: "OTHER", referenceId: plan.id },
          });
          if (!alreadyAdded) {
            await (prisma as any).billItem.create({
              data: {
                hospitalId,
                billId: bill.id,
                type: "OTHER",
                referenceId: plan.id,
                name: `Treatment Plan — ${plan.planName}`,
                quantity: 1,
                unitPrice: plan.totalCost,
                amount: plan.totalCost,
              },
            });
            await recalculateBill(bill.id, hospitalId);
          }
        }
      }
    } catch (planErr: any) {
      console.error("[completePrescription] Treatment plan assignment failed:", planErr?.message);
    }
  }

  // Create FollowUp record if follow-up date is set
  const followUpDate = input.followUpDate ? new Date(input.followUpDate) : existing.followUpDate;
  if (followUpDate) {
    try {
      // Upsert: avoid duplicates if prescription is completed again (edit mode)
      const existingFU = await px.followUp.findFirst({
        where: { appointmentId: existing.appointmentId, hospitalId },
      });
      if (existingFU) {
        await px.followUp.update({
          where: { id: existingFU.id },
          data: {
            followUpDate,
            reason: input.followUpNotes || existing.followUpNotes || existing.chiefComplaint || null,
            notes: existing.diagnosis || null,
          },
        });
      } else {
        await px.followUp.create({
          data: {
            hospitalId,
            patientId: existing.patientId,
            appointmentId: existing.appointmentId,
            followUpDate,
            reason: input.followUpNotes || existing.followUpNotes || existing.chiefComplaint || null,
            notes: existing.diagnosis || null,
            status: "PENDING",
          },
        });
      }
    } catch { /* non-blocking — follow-up creation failure should not block prescription */ }
  }

  return updatedRx;
}

// ─── Advance workflow ───
export async function advanceWorkflow(
  prescriptionId: string,
  hospitalId: string,
  workflowId: string,
  status: string,
  notes?: string,
  completedBy?: string,
  charges?: string,
  totalCharge?: number
) {
  const rx = await findPrescriptionById(prescriptionId, hospitalId);
  if (!rx) throw new PrescriptionServiceError("Prescription not found", "NOT_FOUND", 404);

  // Update the current workflow step
  const stepData: any = { status };
  if (notes) stepData.notes = notes;
  if (completedBy) stepData.completedBy = completedBy;
  if (charges) stepData.charges = charges;
  if (totalCharge !== undefined) stepData.totalCharge = totalCharge;
  if (status === "COMPLETED") stepData.completedAt = new Date();

  await updateWorkflowStepRepo(workflowId, stepData);

  // Get all workflow steps
  const steps = await findWorkflowSteps(prescriptionId);
  const currentIdx = steps.findIndex((s: any) => s.id === workflowId);

  if (status === "COMPLETED" || status === "SKIPPED") {
    // Find the bill — first check rx.bill, then look up by visitId (appointmentId)
    let billId = rx.bill?.id;
    if (!billId && rx.appointmentId) {
      const bill = await px.bill.findFirst({
        where: { visitId: rx.appointmentId, hospitalId },
        select: { id: true },
      });
      billId = bill?.id;
    }

    // Sync workflow charges to the bill whenever a step completes
    if (status === "COMPLETED" && billId) {
      await addWorkflowChargesToBill(billId, hospitalId).catch(() => {});
    }

    // Find next pending step
    const nextStep = steps.find((s: any, idx: number) => idx > currentIdx && s.status === "PENDING");

    if (nextStep) {
      await updateWorkflowStepRepo(nextStep.id, { status: "IN_PROGRESS" });
      await updatePrescriptionRepo(prescriptionId, hospitalId, { currentDeptId: nextStep.subDepartmentId });
    } else {
      // All steps done → move to billing
      await updatePrescriptionRepo(prescriptionId, hospitalId, {
        status: "BILLING_PENDING",
        currentDeptId: null,
      });

      // Final sync: ensure all workflow charges + consultation fee are on the bill
      if (billId) {
        await addWorkflowChargesToBill(billId, hospitalId).catch(() => {});
      }
    }
  }

  return findPrescriptionById(prescriptionId, hospitalId);
}

// ─── Generate Bill (or sync existing) ───
export async function generateBill(prescriptionId: string, hospitalId: string, discount = 0, tax = 0, notes?: string) {
  const rx = await findPrescriptionById(prescriptionId, hospitalId);
  if (!rx) throw new PrescriptionServiceError("Prescription not found", "NOT_FOUND", 404);

  // Check if bill already exists — by prescriptionId OR by visitId (appointmentId)
  let existingBill = await findBillByPrescription(prescriptionId, hospitalId);
  if (!existingBill && rx.appointmentId) {
    existingBill = await px.bill.findFirst({ where: { visitId: rx.appointmentId, hospitalId } });
  }

  if (existingBill) {
    // Link prescription if not already linked
    if (!existingBill.prescriptionId) {
      await px.bill.update({
        where: { id: existingBill.id },
        data: { prescriptionId },
      });
    }
    // Sync all charges (consultation + workflow) to the existing bill
    await addWorkflowChargesToBill(existingBill.id, hospitalId).catch(() => {});

    // Apply discount/tax/notes if provided
    if (discount > 0 || tax > 0 || notes) {
      await px.bill.update({
        where: { id: existingBill.id },
        data: {
          ...(discount > 0 ? { discount } : {}),
          ...(tax > 0 ? { tax } : {}),
          ...(notes ? { notes } : {}),
        },
      });
      await recalculateBill(existingBill.id, hospitalId);
    }

    // Update prescription status
    await updatePrescriptionRepo(prescriptionId, hospitalId, { status: "BILLED" });
    return existingBill;
  }

  // No bill exists — create one via generateBillFromAppointment for consistency
  if (rx.appointmentId) {
    try {
      const bill = await generateBillFromAppointment(rx.appointmentId, hospitalId);
      // Sync workflow charges onto this new bill
      await addWorkflowChargesToBill(bill.id, hospitalId).catch(() => {});
      await updatePrescriptionRepo(prescriptionId, hospitalId, { status: "BILLED" });
      return bill;
    } catch { /* fall through to legacy creation */ }
  }

  // Fallback: create bill via repo (no appointment linked — edge case)
  const items: any[] = [];
  if (rx.consultationFee) {
    items.push({
      description: `Consultation Fee - Dr. ${rx.doctor?.name}`,
      department: rx.doctor?.department?.name || "General",
      amount: rx.consultationFee,
      qty: 1,
      total: rx.consultationFee,
    });
  }
  if (rx.workflows && rx.workflows.length > 0) {
    for (const wf of rx.workflows) {
      if (wf.status === "COMPLETED" && wf.totalCharge > 0) {
        items.push({
          description: `${wf.subDepartment?.name} charges`,
          department: wf.subDepartment?.name || "Sub-Dept",
          amount: wf.totalCharge,
          qty: 1,
          total: wf.totalCharge,
        });
      }
    }
  }
  const subtotal = items.reduce((sum: number, i: any) => sum + (i.total || 0), 0);
  const total = subtotal - discount + tax;
  const billNo = await generateBillNo(hospitalId);
  const bill = await createBillRepo({
    hospitalId,
    billNo,
    prescriptionId,
    patientId: rx.patientId,
    items: JSON.stringify(items),
    subtotal,
    discount,
    tax,
    total: Math.max(0, total),
    notes: notes || null,
  });
  await updatePrescriptionRepo(prescriptionId, hospitalId, { status: "BILLED" });
  return bill;
}

// ─── Get Patient History ───
export async function getPatientHistory(patientId: string, hospitalId: string, excludeId?: string) {
  return getPatientPrescriptionHistory(patientId, hospitalId, excludeId);
}

// ─── Helpers ───
function buildUpdateData(input: UpdatePrescriptionInput): any {
  const data: any = {};
  if (input.vitals !== undefined) data.vitals = input.vitals;
  if (input.chiefComplaint !== undefined) data.chiefComplaint = input.chiefComplaint;
  if (input.diagnosis !== undefined) data.diagnosis = input.diagnosis;
  if (input.icdCodes !== undefined) data.icdCodes = input.icdCodes;
  if (input.medications !== undefined) data.medications = input.medications;
  if (input.labTests !== undefined) data.labTests = input.labTests;
  if (input.referrals !== undefined) data.referrals = input.referrals;
  if (input.advice !== undefined) data.advice = input.advice;
  if (input.followUpDate !== undefined) data.followUpDate = input.followUpDate ? new Date(input.followUpDate) : null;
  if (input.followUpNotes !== undefined) data.followUpNotes = input.followUpNotes;
  if (input.consultationFee !== undefined) data.consultationFee = input.consultationFee;
  if (input.aiSuggestions !== undefined) data.aiSuggestions = input.aiSuggestions;
  if (input.doctorNotes !== undefined) data.doctorNotes = input.doctorNotes;
  return data;
}
