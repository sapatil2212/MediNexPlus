import prisma from "../config/db";

// ── Add workflow charges to bill ───────────────────────────────────────────
export async function addWorkflowChargesToBill(
  billId: string,
  hospitalId: string
): Promise<void> {
  const bill = await (prisma as any).bill.findFirst({
    where: { id: billId, hospitalId },
    select: { prescriptionId: true, visitId: true },
  });

  if (!bill) return;

  let prescriptionId = bill.prescriptionId;

  // If prescriptionId is missing but visitId exists, try to find the prescription
  if (!prescriptionId && bill.visitId) {
    const rx = await (prisma as any).prescription.findFirst({
      where: { appointmentId: bill.visitId, hospitalId },
      select: { id: true },
    });
    if (rx) {
      prescriptionId = rx.id;
      // Link the bill to the prescription for future syncs
      await (prisma as any).bill.update({
        where: { id: billId },
        data: { prescriptionId },
      });
    }
  }

  if (!prescriptionId) return;

  // 1. Check for Consultation Fee from Prescription/Appointment
  const prescription = await (prisma as any).prescription.findFirst({
    where: { id: prescriptionId, hospitalId },
    include: {
      appointment: {
        include: { doctor: { select: { name: true, consultationFee: true } } },
      },
      doctor: { select: { name: true, consultationFee: true } },
    },
  });

  if (prescription) {
    const consultationFee =
      prescription.consultationFee ??
      prescription.appointment?.consultationFee ??
      prescription.appointment?.doctor?.consultationFee ??
      prescription.doctor?.consultationFee ??
      0;

    if (consultationFee > 0) {
      const existingConsultation = await (prisma as any).billItem.findFirst({
        where: { billId, type: "CONSULTATION" },
      });

      if (!existingConsultation) {
        await (prisma as any).billItem.create({
          data: {
            hospitalId,
            billId,
            type: "CONSULTATION",
            referenceId: prescription.doctorId,
            name: `Consultation — Dr. ${prescription.doctor?.name || "Doctor"}`,
            quantity: 1,
            unitPrice: consultationFee,
            amount: consultationFee,
          },
        });
      } else if (existingConsultation.unitPrice !== consultationFee) {
        // Update if fee changed (e.g. doctor modified it in prescription)
        await (prisma as any).billItem.update({
          where: { id: existingConsultation.id },
          data: {
            unitPrice: consultationFee,
            amount: consultationFee,
          },
        });
      }
    }
  }

  // 2. Add Workflow Charges — only COMPLETED steps with charges
  const workflows = await (prisma as any).prescriptionWorkflow.findMany({
    where: { prescriptionId: prescriptionId, status: "COMPLETED", totalCharge: { gt: 0 } },
    include: { subDepartment: { select: { name: true, type: true } } },
  });

  for (const wf of workflows) {
    const isPharmacy = wf.subDepartment?.type === "PHARMACY";

    // ── PHARMACY: expand charges into individual per-medicine BillItems ──────
    if (isPharmacy && wf.charges) {
      try {
        const items: any[] = typeof wf.charges === "string" ? JSON.parse(wf.charges) : wf.charges;
        if (Array.isArray(items) && items.length > 0) {
          // Remove any stale aggregate BillItem (old single-row approach) for this workflow
          const staleAggregate = await (prisma as any).billItem.findFirst({
            where: { billId, referenceId: wf.id, name: { startsWith: "Service:" } },
          });
          if (staleAggregate) {
            await (prisma as any).billItem.delete({ where: { id: staleAggregate.id } });
          }

          for (const med of items) {
            const medName = med.name || "Medicine";
            const qty     = Number(med.quantity || 1);
            const unitPrice = Number(med.unitPrice ?? med.price ?? 0);
            const amount  = Number(med.amount ?? qty * unitPrice);

            const existingMed = await (prisma as any).billItem.findFirst({
              where: { billId, referenceId: wf.id, name: medName },
            });

            if (existingMed) {
              if (existingMed.quantity !== qty || existingMed.unitPrice !== unitPrice) {
                await (prisma as any).billItem.update({
                  where: { id: existingMed.id },
                  data: { quantity: qty, unitPrice, amount },
                });
              }
            } else {
              await (prisma as any).billItem.create({
                data: {
                  hospitalId,
                  billId,
                  type: "PHARMACY",
                  referenceId: wf.id,
                  name: medName,
                  quantity: qty,
                  unitPrice,
                  amount,
                },
              });
            }
          }
          continue; // skip aggregate creation below
        }
      } catch { /* fall through to aggregate */ }
    }

    // ── Non-pharmacy (or pharmacy with no charges breakdown): single aggregate row ──
    const existing = await (prisma as any).billItem.findFirst({
      where: { billId, referenceId: wf.id },
    });

    if (existing) {
      if (existing.unitPrice !== wf.totalCharge) {
        await (prisma as any).billItem.update({
          where: { id: existing.id },
          data: { unitPrice: wf.totalCharge, amount: wf.totalCharge },
        });
      }
      continue;
    }

    await (prisma as any).billItem.create({
      data: {
        hospitalId,
        billId,
        type: wf.subDepartment?.type || "OTHER",
        referenceId: wf.id,
        name: `Service: ${wf.subDepartment?.name || "Sub-department"}`,
        quantity: 1,
        unitPrice: wf.totalCharge,
        amount: wf.totalCharge,
      },
    });
  }

  await recalculateBill(billId, hospitalId);
}


export class BillingServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ── Sequential bill number ──────────────────────────────────────────────────
async function generateBillNo(hospitalId: string): Promise<string> {
  const last = await (prisma as any).bill.findFirst({
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

// ── Log revenue automatically ───────────────────────────────────────────────
export async function logRevenue(
  hospitalId: string,
  sourceType: string,
  amount: number,
  referenceId?: string,
  referenceType?: string,
  description?: string
) {
  try {
    await (prisma as any).revenue.create({
      data: { hospitalId, sourceType, amount, referenceId, referenceType, description },
    });
  } catch { /* fire and forget */ }
}

// ── Generate bill from appointment (consultation) ──────────────────────────
export async function generateBillFromAppointment(
  appointmentId: string,
  hospitalId: string
): Promise<any> {
  const appt = await (prisma as any).appointment.findFirst({
    where: { id: appointmentId, hospitalId },
    include: {
      patient: { select: { id: true, name: true, patientId: true } },
      doctor:  { select: { id: true, name: true, consultationFee: true } },
    },
  });
  if (!appt) throw new BillingServiceError("Appointment not found", 404);

  // Check if bill already exists for this appointment (by visitId)
  const existingByVisit = await (prisma as any).bill.findFirst({
    where: { visitId: appointmentId, hospitalId },
    include: { billItems: true },
  });
  if (existingByVisit) return existingByVisit;

  // Look up prescription's consultationFee (doctor may have modified it)
  const prescription = await (prisma as any).prescription.findFirst({
    where: { appointmentId, hospitalId },
    select: { id: true, consultationFee: true },
  });

  // Also check if a bill already exists for this prescription (different path, no visitId set yet)
  // prescriptionId has @unique — creating a duplicate would throw P2002
  if (prescription?.id) {
    const existingByRx = await (prisma as any).bill.findFirst({
      where: { prescriptionId: prescription.id, hospitalId },
      include: { billItems: true },
    });
    if (existingByRx) {
      // Link the visitId if not already set
      if (!existingByRx.visitId) {
        return (prisma as any).bill.update({
          where: { id: existingByRx.id },
          data: { visitId: appointmentId },
          include: { billItems: true },
        });
      }
      return existingByRx;
    }
  }

  // Priority: prescription fee > appointment fee > doctor default fee
  const fee = prescription?.consultationFee ?? appt.consultationFee ?? appt.doctor?.consultationFee ?? 0;

  // Retry loop: handles two concurrent-request race conditions:
  // 1) billNo collision → retry with fresh number
  // 2) prescriptionId collision → another request already created the bill
  let bill: any = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const billNo = await generateBillNo(hospitalId);
    try {
      bill = await (prisma as any).bill.create({
        data: {
          hospitalId,
          billNo,
          patientId: appt.patientId,
          visitId: appointmentId,
          prescriptionId: prescription?.id || null,
          items: JSON.stringify([]),
          subtotal: fee,
          discount: 0,
          tax: 0,
          total: fee,
          paidAmount: 0,
          status: "PENDING",
          billItems: {
            create: fee > 0 ? [{
              hospitalId,
              type: "CONSULTATION",
              referenceId: appt.doctorId,
              name: `Consultation — Dr. ${appt.doctor?.name || "Doctor"}`,
              quantity: 1,
              unitPrice: fee,
              amount: fee,
            }] : [],
          },
        },
        include: { billItems: true, payments: true },
      });
      break; // success
    } catch (e: any) {
      if (e?.code === "P2002") {
        // A concurrent request may have created the bill — re-check before retrying
        const existing = await (prisma as any).bill.findFirst({
          where: { visitId: appointmentId, hospitalId },
          include: { billItems: true, payments: true },
        }) || (prescription?.id ? await (prisma as any).bill.findFirst({
          where: { prescriptionId: prescription.id, hospitalId },
          include: { billItems: true, payments: true },
        }) : null);
        if (existing) return existing; // bill was created by the other request
        if (attempt < 4) continue; // pure billNo collision — retry
      }
      throw e;
    }
  }

  // Mark appointment as billing-transferred so it shows in billing queue
  await (prisma as any).appointment.update({
    where: { id: appointmentId },
    data: { billingTransferred: true },
  }).catch(() => {});

  // Log revenue
  if (fee > 0) {
    logRevenue(hospitalId, "CONSULTATION", fee, bill.id, "Bill", `Consultation — ${appt.patient?.name}`);
  }

  return bill;
}

// ── Add procedure charge to the SAME bill for this appointment ──────────────
export async function addProcedureChargeToBill(
  procedureRecordId: string,
  hospitalId: string
): Promise<any> {
  const rec = await (prisma as any).procedureRecord.findFirst({
    where: { id: procedureRecordId, hospitalId },
    include: {
      procedure: { select: { name: true, type: true } },
      patient:   { select: { id: true } },
    },
  });
  if (!rec) return null;

  // Find existing bill for this appointment — never create a separate bill
  let bill = rec.appointmentId
    ? await (prisma as any).bill.findFirst({ where: { visitId: rec.appointmentId, hospitalId } })
    : null;

  // If no bill exists yet, generate one from the appointment (creates with consultation fee)
  if (!bill && rec.appointmentId) {
    try {
      bill = await generateBillFromAppointment(rec.appointmentId, hospitalId);
    } catch { /* appointment may not exist */ }
  }

  // Last resort: no appointment linked — should not happen in normal flow, skip billing
  if (!bill) return null;

  // Avoid duplicate: check if this procedure record is already on the bill
  const existingItem = await (prisma as any).billItem.findFirst({
    where: { billId: bill.id, type: "PROCEDURE", referenceId: rec.procedureId },
  });

  if (existingItem) {
    // Update amount if it changed
    if (existingItem.unitPrice !== rec.amount) {
      await (prisma as any).billItem.update({
        where: { id: existingItem.id },
        data: { unitPrice: rec.amount, amount: rec.amount },
      });
      await recalculateBill(bill.id, hospitalId);
    }
    return bill;
  }

  // Add new BillItem for this procedure
  await (prisma as any).billItem.create({
    data: {
      hospitalId,
      billId: bill.id,
      type: "PROCEDURE",
      referenceId: rec.procedureId,
      name: rec.procedure?.name || "Procedure",
      quantity: 1,
      unitPrice: rec.amount,
      amount: rec.amount,
    },
  });

  // Recalculate bill total
  await recalculateBill(bill.id, hospitalId);

  // Log revenue
  logRevenue(hospitalId, "PROCEDURE", rec.amount, procedureRecordId, "ProcedureRecord", rec.procedure?.name);

  return bill;
}

// ── Recalculate bill total from BillItems ──────────────────────────────────
export async function recalculateBill(billId: string, hospitalId: string): Promise<void> {
  const items = await (prisma as any).billItem.findMany({ where: { billId, hospitalId } });
  const subtotal: number = items.reduce((s: number, i: any) => s + i.amount, 0);
  const bill = await (prisma as any).bill.findUnique({ where: { id: billId } });
  if (!bill) return;
  const tax = bill.tax || 0;
  const discount = bill.discount || 0;
  const total = subtotal + tax - discount;
  await (prisma as any).bill.update({
    where: { id: billId },
    data: { subtotal, total: Math.max(0, total) },
  });
}

// ── Replace bill items ──────────────────────────────────────────────────────
export async function updateBillItems(
  billId: string,
  hospitalId: string,
  items: { type: string; name: string; quantity: number; unitPrice: number; referenceId?: string }[]
): Promise<any> {
  const bill = await (prisma as any).bill.findFirst({ where: { id: billId, hospitalId } });
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  if (bill.status === "PAID" || Number(bill.paidAmount || 0) > 0) {
    throw new BillingServiceError("Cannot edit bill items after payments. Create an adjustment bill instead.", 400);
  }

  // Remove existing items
  await (prisma as any).billItem.deleteMany({ where: { billId } });

  // Create new items
  if (items.length > 0) {
    await (prisma as any).billItem.createMany({
      data: items.map((i: any) => ({
        hospitalId,
        billId,
        type: i.type || "OTHER",
        referenceId: i.referenceId || null,
        name: i.name,
        quantity: Number(i.quantity || 0),
        unitPrice: Number(i.unitPrice || 0),
        amount: Number(i.quantity || 0) * Number(i.unitPrice || 0),
      })),
    });
  }

  // Store items JSON snapshot too
  await (prisma as any).bill.update({
    where: { id: billId },
    data: { items: JSON.stringify(items) },
  });

  await recalculateBill(billId, hospitalId);

  return (prisma as any).bill.findFirst({
    where: { id: billId, hospitalId },
    include: { billItems: true, payments: true, patient: { select: { id: true, name: true, patientId: true, phone: true } } },
  });
}

// ── Create a full bill manually ────────────────────────────────────────────
export async function createBill(
  hospitalId: string,
  data: {
    patientId: string;
    visitId?: string;
    items: { type: string; name: string; quantity: number; unitPrice: number; referenceId?: string }[];
    discount?: number;
    tax?: number;
    notes?: string;
  }
): Promise<any> {
  const patient = await (prisma as any).patient.findFirst({
    where: { id: data.patientId, hospitalId },
  });
  if (!patient) throw new BillingServiceError("Patient not found", 404);

  if (data.visitId) {
    const existing = await (prisma as any).bill.findFirst({ where: { visitId: data.visitId, hospitalId } });
    if (existing) throw new BillingServiceError("A bill already exists for this visit", 409);
  }

  const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discount = data.discount ?? 0;
  const tax = data.tax ?? 0;
  const total = Math.max(0, subtotal + tax - discount);

  let bill: any = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const billNo = await generateBillNo(hospitalId);
    try {
      bill = await (prisma as any).bill.create({
        data: {
          hospitalId,
          billNo,
          patientId: data.patientId,
          visitId: data.visitId || null,
          items: JSON.stringify(data.items),
          subtotal,
          discount,
          tax,
          total,
          paidAmount: 0,
          status: "PENDING",
          notes: data.notes || null,
          billItems: {
            create: data.items.map(i => ({
              hospitalId,
              type: i.type || "OTHER",
              referenceId: i.referenceId || null,
              name: i.name,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              amount: i.quantity * i.unitPrice,
            })),
          },
        },
        include: {
          billItems: true,
          patient: { select: { id: true, name: true, patientId: true, phone: true } },
        },
      });
      break;
    } catch (e: any) {
      if (e?.code === "P2002" && attempt < 4) continue;
      throw e;
    }
  }

  // Sync with workflow charges (consultation fee + procedures)
  await addWorkflowChargesToBill(bill.id, hospitalId).catch(() => {});

  return bill;
}

// ── Record a payment ───────────────────────────────────────────────────────
export async function recordPayment(
  billId: string,
  hospitalId: string,
  data: { amount: number; method: string; transactionId?: string; notes?: string; collectedBy?: string }
): Promise<any> {
  const bill = await (prisma as any).bill.findFirst({ where: { id: billId, hospitalId } });
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  if (bill.status === "PAID") throw new BillingServiceError("Bill is already fully paid", 400);

  const paymentAmount = parseFloat(String(data.amount));
  if (paymentAmount <= 0) throw new BillingServiceError("Payment amount must be positive", 400);

  const remaining = bill.total - bill.paidAmount;
  if (paymentAmount > remaining + 0.01) {
    throw new BillingServiceError(`Payment (₹${paymentAmount}) exceeds remaining balance (₹${remaining.toFixed(2)})`, 400);
  }

  // Build payment notes: "Collected by [DeptName]" + optional extra notes
  const collectionRemark = data.collectedBy ? `Collected by ${data.collectedBy}` : null;
  const paymentNotes = [collectionRemark, data.notes].filter(Boolean).join(" — ") || null;

  const payment = await (prisma as any).payment.create({
    data: {
      hospitalId,
      billId,
      amount: paymentAmount,
      method: data.method || "CASH",
      transactionId: data.transactionId || null,
      status: "SUCCESS",
      notes: paymentNotes,
    },
  });

  const newPaid = bill.paidAmount + paymentAmount;
  const newStatus = newPaid >= bill.total - 0.01 ? "PAID" : "PARTIALLY_PAID";

  // Persist collection remark on the bill for display everywhere
  const existingNotes: string = bill.notes || "";
  const billNotesWithoutOldCollection = existingNotes.replace(/\s*\|\s*Collected by [^|]+/g, "").replace(/^Collected by [^|]+\s*\|?\s*/g, "").trim();
  const newBillNotes = collectionRemark
    ? [billNotesWithoutOldCollection, collectionRemark].filter(Boolean).join(" | ")
    : (existingNotes || null);

  await (prisma as any).bill.update({
    where: { id: billId },
    data: {
      paidAmount: newPaid,
      status: newStatus,
      paidAt: newStatus === "PAID" ? new Date() : bill.paidAt,
      paymentMethod: data.method,
      notes: newBillNotes || null,
    },
  });

  // Log revenue — detect pharmacy bills so they appear in pharmacy stats
  const pharmAgg = await (prisma as any).billItem.aggregate({
    where: { billId, type: "PHARMACY" },
    _sum: { amount: true },
  }).catch(() => ({ _sum: { amount: 0 } }));
  const sourceType = (pharmAgg._sum.amount || 0) > 0 ? "PHARMACY" : "OTHER";
  logRevenue(hospitalId, sourceType, paymentAmount, billId, "Bill", `Payment received — ${data.method}`);

  return payment;
}

// ── Get bills list ─────────────────────────────────────────────────────────
export async function getBills(
  hospitalId: string,
  opts: { page?: number; limit?: number; search?: string; status?: string; dateFrom?: string; dateTo?: string; patientId?: string; prescriptionId?: string; pharmacyOnly?: boolean; labOnly?: boolean; departmentId?: string }
) {
  const page  = Math.max(1, opts.page  || 1);
  const limit = Math.min(opts.pharmacyOnly ? 200 : 50, opts.limit || 20);
  const where: any = { hospitalId };

  if (opts.pharmacyOnly) {
    where.billItems = { some: { type: "PHARMACY" } };
  }

  if (opts.labOnly) {
    where.billItems = { some: { type: "LAB_TEST" } };
  }

  if (opts.patientId) where.patientId = opts.patientId;
  if (opts.prescriptionId) where.prescriptionId = opts.prescriptionId;
  if (opts.departmentId) {
    const deptAppts = await (prisma as any).appointment.findMany({
      where: { hospitalId, departmentId: opts.departmentId },
      select: { id: true },
    });
    where.visitId = { in: deptAppts.map((a: any) => a.id) };
  }
  if (opts.status) where.status = opts.status;
  if (opts.dateFrom || opts.dateTo) {
    where.createdAt = {};
    if (opts.dateFrom) where.createdAt.gte = new Date(opts.dateFrom);
    if (opts.dateTo)   where.createdAt.lte = new Date(opts.dateTo + "T23:59:59");
  }
  if (opts.search) {
    const searchOr = [
      { billNo: { contains: opts.search } },
      { patient: { OR: [{ name: { contains: opts.search } }, { patientId: { contains: opts.search } }] } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchOr }];
      delete where.OR;
    } else {
      where.OR = searchOr;
    }
  }

  const [bills, total] = await Promise.all([
    (prisma as any).bill.findMany({
      where,
      include: {
        patient:   { select: { id: true, name: true, patientId: true, phone: true } },
        billItems: true,
        payments:  { orderBy: { paidAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).bill.count({ where }),
  ]);

  // Stats — scope to lab-only or pharmacy-only when requested
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const scopeFilter: any = opts.labOnly ? { billItems: { some: { type: "LAB_TEST" } } } : opts.pharmacyOnly ? { billItems: { some: { type: "PHARMACY" } } } : {};

  let todayRevenueVal = 0, monthRevenueVal = 0, pendingCount = 0;

  if (opts.pharmacyOnly) {
    // Sum PHARMACY BillItem amounts via bill.findMany (more reliable than billItem.aggregate with nested relation filter)
    const itemType = "PHARMACY";
    const [todayBills, monthBills, pc] = await Promise.all([
      (prisma as any).bill.findMany({
        where: { hospitalId, status: "PAID", paidAt: { gte: today }, billItems: { some: { type: itemType } } },
        select: { billItems: { where: { type: itemType }, select: { amount: true } } },
      }),
      (prisma as any).bill.findMany({
        where: { hospitalId, status: "PAID", paidAt: { gte: monthStart }, billItems: { some: { type: itemType } } },
        select: { billItems: { where: { type: itemType }, select: { amount: true } } },
      }),
      (prisma as any).bill.count({ where: { hospitalId, status: "PENDING", ...scopeFilter } }),
    ]);
    const sumItems = (bills: any[]) => bills.reduce((s: number, b: any) => s + (b.billItems || []).reduce((bs: number, i: any) => bs + (i.amount || 0), 0), 0);
    todayRevenueVal = sumItems(todayBills);
    monthRevenueVal = sumItems(monthBills);
    pendingCount = pc;
  } else if (opts.labOnly) {
    const itemType = "LAB_TEST";
    const [todayBills, monthBills, pc] = await Promise.all([
      (prisma as any).bill.findMany({
        where: { hospitalId, status: "PAID", paidAt: { gte: today }, billItems: { some: { type: itemType } } },
        select: { billItems: { where: { type: itemType }, select: { amount: true } } },
      }),
      (prisma as any).bill.findMany({
        where: { hospitalId, status: "PAID", paidAt: { gte: monthStart }, billItems: { some: { type: itemType } } },
        select: { billItems: { where: { type: itemType }, select: { amount: true } } },
      }),
      (prisma as any).bill.count({ where: { hospitalId, status: "PENDING", ...scopeFilter } }),
    ]);
    const sumItems = (bills: any[]) => bills.reduce((s: number, b: any) => s + (b.billItems || []).reduce((bs: number, i: any) => bs + (i.amount || 0), 0), 0);
    todayRevenueVal = sumItems(todayBills);
    monthRevenueVal = sumItems(monthBills);
    pendingCount = pc;
  } else {
    const [todayAgg, monthAgg, pc] = await Promise.all([
      (prisma as any).bill.aggregate({ where: { hospitalId, status: "PAID", paidAt: { gte: today } }, _sum: { total: true } }),
      (prisma as any).bill.aggregate({ where: { hospitalId, status: "PAID", paidAt: { gte: monthStart } }, _sum: { total: true } }),
      (prisma as any).bill.count({ where: { hospitalId, status: "PENDING" } }),
    ]);
    todayRevenueVal = todayAgg._sum.total || 0;
    monthRevenueVal = monthAgg._sum.total || 0;
    pendingCount = pc;
  }

  return {
    bills,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: {
      todayRevenue: todayRevenueVal,
      monthRevenue: monthRevenueVal,
      pendingCount,
    },
  };
}

// ── Get single bill ────────────────────────────────────────────────────────
export async function getBillById(billId: string, hospitalId: string): Promise<any> {
  // Sync with workflow charges before returning
  await addWorkflowChargesToBill(billId, hospitalId).catch(() => {});

  const bill = await (prisma as any).bill.findFirst({
    where: { id: billId, hospitalId },
    include: {
      patient:  { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true } },
      billItems: { orderBy: { createdAt: "asc" } },
      payments:  { orderBy: { paidAt: "desc" } },
      prescription: { select: { prescriptionNo: true, doctorId: true, medications: true, diagnosis: true, doctor: { select: { name: true } } } },
    },
  });
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  return bill;
}

// ── Update bill (discount / tax / GST / notes) ────────────────────────────
export async function updateBill(
  billId: string,
  hospitalId: string,
  data: {
    discount?: number; tax?: number; notes?: string; status?: string;
    isGst?: boolean; cgst?: number; sgst?: number; igst?: number;
    addItem?: { name: string; unitPrice: number; quantity: number; type?: string };
  }
): Promise<any> {
  const bill = await (prisma as any).bill.findFirst({ where: { id: billId, hospitalId } });
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  if ((bill.status === "PAID" || Number(bill.paidAmount || 0) > 0) && (data.discount !== undefined || data.tax !== undefined || data.isGst !== undefined)) {
    throw new BillingServiceError("Cannot change tax/discount after payments. Create an adjustment bill instead.", 400);
  }

  // Handle addItem inline (also used standalone by billing queue)
  if (data.addItem) {
    const { name, unitPrice, quantity, type } = data.addItem;
    const amount = unitPrice * (quantity || 1);
    await (prisma as any).billItem.create({
      data: { billId, hospitalId, name, unitPrice, quantity: quantity || 1, amount, type: type || "OTHER" },
    });
    await recalculateBill(billId, hospitalId);
    // Reload bill after recalc so GST/discount below use fresh subtotal
    const refreshed = await (prisma as any).bill.findFirst({ where: { id: billId, hospitalId } });
    if (refreshed) Object.assign(bill, refreshed);
  }

  // Sync with workflow charges
  await addWorkflowChargesToBill(billId, hospitalId).catch(() => {});

  // Reload subtotal (may have changed from addItem / recalculate)
  const freshBill = await (prisma as any).bill.findFirst({ where: { id: billId, hospitalId } });
  const subtotal = freshBill?.subtotal ?? bill.subtotal;

  const isGst   = data.isGst   !== undefined ? data.isGst   : bill.isGst;
  const cgst    = data.cgst    !== undefined ? data.cgst    : bill.cgst;
  const sgst    = data.sgst    !== undefined ? data.sgst    : bill.sgst;
  const igst    = data.igst    !== undefined ? data.igst    : bill.igst;
  const discount = data.discount !== undefined ? data.discount : (freshBill?.discount ?? bill.discount);

  // Compute tax amount from GST percentages when isGst is true
  let tax: number;
  if (data.tax !== undefined) {
    tax = data.tax;
  } else if (isGst) {
    tax = (subtotal * ((cgst || 0) + (sgst || 0) + (igst || 0))) / 100;
  } else {
    tax = 0;
  }

  const total = Math.max(0, subtotal + tax - discount);

  let newStatus = freshBill?.status ?? bill.status;
  if (total <= (freshBill?.paidAmount ?? bill.paidAmount) + 0.01) {
    newStatus = "PAID";
  } else if ((freshBill?.paidAmount ?? bill.paidAmount) > 0) {
    newStatus = "PARTIALLY_PAID";
  } else {
    newStatus = "PENDING";
  }

  const finalStatus = data.status ?? newStatus;
  const paidAt = (finalStatus === "PAID" && bill.status !== "PAID") ? new Date() : bill.paidAt;

  return (prisma as any).bill.update({
    where: { id: billId },
    data: {
      discount,
      tax,
      total,
      isGst,
      cgst,
      sgst,
      igst,
      notes: data.notes ?? bill.notes,
      status: finalStatus,
      paidAt,
    },
    include: { billItems: true, payments: true },
  });
}

// ── Transfer appointment to billing queue ─────────────────────────────────
export async function transferToBilling(
  appointmentId: string,
  hospitalId: string,
  note?: string
): Promise<any> {
  const appt = await (prisma as any).appointment.findFirst({
    where: { id: appointmentId, hospitalId },
    include: {
      patient: { select: { id: true, name: true, patientId: true } },
      doctor: { select: { id: true, name: true, consultationFee: true } },
    },
  });
  if (!appt) throw new BillingServiceError("Appointment not found", 404);

  // Mark as billing transferred
  await (prisma as any).appointment.update({
    where: { id: appointmentId },
    data: {
      billingTransferred: true,
      ...(note ? { billingNote: note } : {}),
    },
  });

  // Create bill if it doesn't exist yet
  let bill = await (prisma as any).bill.findFirst({
    where: { visitId: appointmentId, hospitalId },
    include: { billItems: true, payments: true },
  });

  if (!bill) {
    bill = await generateBillFromAppointment(appointmentId, hospitalId);
  } else {
    // Sync charges (consultation + workflow) on the existing bill
    await addWorkflowChargesToBill(bill.id, hospitalId).catch(() => {});
    // Re-fetch with updated items
    bill = await (prisma as any).bill.findFirst({
      where: { id: bill.id },
      include: { billItems: true, payments: true },
    });
  }

  return bill;
}

// ── Get billing queue (transferred appointments + pharmacy walk-in bills) ──
export async function getBillingQueue(
  hospitalId: string,
  opts: { search?: string; date?: string; procedureOnly?: boolean; subDeptId?: string }
): Promise<any[]> {
  // ── 1. Appointment-based queue (billingTransferred = true) ──
  const apptWhere: any = {
    hospitalId,
    billingTransferred: true,
  };

  // ── Sub-department filter: scope to this sub-dept's referred appointments ──
  if (opts.procedureOnly && opts.subDeptId) {
    apptWhere.subDepartmentId = opts.subDeptId;
  }

  if (opts.date) {
    const d = new Date(opts.date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    apptWhere.appointmentDate = { gte: d, lt: nextDay };
  }

  if (opts.search) {
    apptWhere.OR = [
      { patient: { name: { contains: opts.search } } },
      { patient: { patientId: { contains: opts.search } } },
      { patient: { phone: { contains: opts.search } } },
      { doctor: { name: { contains: opts.search } } },
    ];
  }

  const appointments = await (prisma as any).appointment.findMany({
    where: apptWhere,
    include: {
      patient: { select: { id: true, name: true, patientId: true, phone: true, email: true } },
      doctor: { select: { id: true, name: true, specialization: true, consultationFee: true } },
      department: { select: { id: true, name: true } },
      subDepartment: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  // Attach bill info for each appointment
  const apptIds = appointments.map((a: any) => a.id);
  const apptBills = apptIds.length > 0
    ? await (prisma as any).bill.findMany({
        where: { visitId: { in: apptIds }, hospitalId },
        include: {
          billItems: true,
          payments: true,
          prescription: {
            select: {
              id: true, prescriptionNo: true, diagnosis: true, medications: true,
              doctor: { select: { id: true, name: true, specialization: true } },
            },
          },
        },
      })
    : [];

  const billMap = new Map(apptBills.map((b: any) => [b.visitId, b]));

  const apptQueue = appointments.map((a: any) => ({
    ...a,
    bill: billMap.get(a.id) || null,
    source: "appointment",
  }));

  // Auto-generate bills for appointments that are transferred but have no bill yet.
  // Sequential (not parallel) to avoid @@unique([hospitalId, billNo]) race conditions.
  const missingBill = apptQueue.filter((a: any) => !a.bill);
  for (const a of missingBill) {
    try {
      a.bill = await generateBillFromAppointment(a.id, hospitalId);
    } catch (err: any) {
      console.error(`[getBillingQueue] Auto-generate bill failed for appt ${a.id}:`, err?.message);
    }
  }

  // ── Procedure-only filter: return only bills that have at least one PROCEDURE item ──
  // (sub-dept scoping is already applied at DB level via apptWhere.subDepartmentId above)
  if (opts.procedureOnly) {
    return apptQueue.filter((a: any) =>
      (a.bill?.billItems || []).some((bi: any) => bi.type === "PROCEDURE")
    );
  }

  // ── 2. Pharmacy walk-in bills (no appointment, created from pharmacy queue) ──
  const rxBillWhere: any = {
    hospitalId,
    prescriptionId: { not: null },
    visitId: null,       // no appointment link — these are pharmacy walk-ins
  };

  if (opts.date) {
    const d = new Date(opts.date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    rxBillWhere.createdAt = { gte: d, lt: nextDay };
  }

  if (opts.search) {
    rxBillWhere.OR = [
      { patient: { name: { contains: opts.search } } },
      { patient: { patientId: { contains: opts.search } } },
      { patient: { phone: { contains: opts.search } } },
      { billNo: { contains: opts.search } },
    ];
  }

  const pharmacyBills = await (prisma as any).bill.findMany({
    where: rxBillWhere,
    include: {
      patient: { select: { id: true, name: true, patientId: true, phone: true, email: true } },
      billItems: true,
      payments: true,
      prescription: {
        select: { id: true, prescriptionNo: true, diagnosis: true, medications: true, doctorId: true,
          doctor: { select: { id: true, name: true, specialization: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Shape pharmacy bills to look like queue items (compatible with BillingQueue component)
  const rxQueue = pharmacyBills.map((b: any) => ({
    id: b.prescriptionId || b.id,
    appointmentDate: b.createdAt,
    type: "WALK_IN_RX",
    status: "COMPLETED",
    consultationFee: 0,
    billingNote: b.notes || "Walk-in Pharmacy",
    patient: b.patient,
    doctor: b.prescription?.doctor || null,
    department: null,
    subDepartment: { name: "Pharmacy" },
    bill: b,
    source: "pharmacy",
    prescriptionNo: b.prescription?.prescriptionNo || b.billNo,
  }));

  // ── 3. Pharmacy counter-sale bills (no prescription, no visit — direct POS) ──
  const csBillWhere: any = {
    hospitalId,
    prescriptionId: null,
    visitId: null,
    notes: { contains: "PHARMACY_COUNTER_SALE" },
  };

  if (opts.date) {
    const d = new Date(opts.date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    csBillWhere.createdAt = { gte: d, lt: nextDay };
  }

  if (opts.search) {
    csBillWhere.OR = [
      { patient: { name: { contains: opts.search } } },
      { patient: { patientId: { contains: opts.search } } },
      { patient: { phone: { contains: opts.search } } },
      { billNo: { contains: opts.search } },
    ];
  }

  const counterSaleBills = await (prisma as any).bill.findMany({
    where: csBillWhere,
    include: {
      patient: { select: { id: true, name: true, patientId: true, phone: true, email: true } },
      billItems: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const csQueue = counterSaleBills.map((b: any) => ({
    id: b.id,
    appointmentDate: b.createdAt,
    type: "COUNTER_SALE",
    status: "COMPLETED",
    consultationFee: 0,
    billingNote: b.notes || "Pharmacy Counter Sale",
    patient: b.patient,
    doctor: null,
    department: null,
    subDepartment: { name: "Pharmacy" },
    bill: b,
    source: "pharmacy_counter",
    prescriptionNo: b.billNo,
  }));

  // ── 4. Lab order bills (no appointment, no prescription — created from pathology orders) ──
  const labBillWhere: any = {
    hospitalId,
    prescriptionId: null,
    visitId: null,
    billItems: { some: { type: "LAB_TEST" } },
    NOT: { notes: { contains: "PHARMACY_COUNTER_SALE" } },
  };

  if (opts.date) {
    const d = new Date(opts.date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    labBillWhere.createdAt = { gte: d, lt: nextDay };
  }

  if (opts.search) {
    labBillWhere.OR = [
      { patient: { name: { contains: opts.search } } },
      { patient: { patientId: { contains: opts.search } } },
      { patient: { phone: { contains: opts.search } } },
      { billNo: { contains: opts.search } },
    ];
  }

  const labBills = await (prisma as any).bill.findMany({
    where: labBillWhere,
    include: {
      patient: { select: { id: true, name: true, patientId: true, phone: true, email: true } },
      billItems: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const labQueue = labBills.map((b: any) => ({
    id: b.id,
    appointmentDate: b.createdAt,
    type: "LAB_ORDER",
    status: "COMPLETED",
    consultationFee: 0,
    billingNote: b.notes || "Lab Order",
    patient: b.patient,
    doctor: null,
    department: null,
    subDepartment: { name: "Pathology Lab" },
    bill: b,
    source: "lab_order",
    timeSlot: null,
  }));

  // Only return appointment items that have a bill — ensures frontend never sees DRAFT rows
  const billedApptQueue = apptQueue.filter((a: any) => a.bill);

  return [...billedApptQueue, ...rxQueue, ...csQueue, ...labQueue];
}

// ── Revert bill to PENDING (for regeneration) ───────────────────────────
export async function revertBillToPending(billId: string, hospitalId: string): Promise<any> {
  const bill = await (prisma as any).bill.findFirst({
    where: { id: billId, hospitalId },
    include: { payments: true },
  });
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  if (bill.status !== "PAID" && bill.status !== "PARTIALLY_PAID") {
    throw new BillingServiceError("Bill is already pending", 400);
  }

  // Delete all payment records for this bill
  await (prisma as any).payment.deleteMany({ where: { billId } });

  // Reset bill payment state
  const updated = await (prisma as any).bill.update({
    where: { id: billId },
    data: {
      status: "PENDING",
      paidAmount: 0,
      paidAt: null,
      paymentMethod: null,
    },
    include: {
      billItems: true,
      payments: true,
      patient: { select: { id: true, name: true, patientId: true, phone: true, email: true } },
    },
  });

  return updated;
}

// ── Delete bill ────────────────────────────────────────────────────────────
export async function deleteBill(billId: string, hospitalId: string): Promise<void> {
  const bill = await (prisma as any).bill.findFirst({
    where: { id: billId, hospitalId },
    include: { payments: true },
  });
  
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  
  // Prevent deletion of paid bills
  if (bill.status === "PAID" || bill.paidAmount > 0) {
    throw new BillingServiceError("Cannot delete a bill with payments. Please void/cancel instead.", 400);
  }

  // Delete bill items first (cascade should handle this, but explicit is safer)
  await (prisma as any).billItem.deleteMany({ where: { billId } });
  
  // Delete the bill
  await (prisma as any).bill.delete({ where: { id: billId } });
}

// ── Finance Dept service ───────────────────────────────────────────────────
export async function getFinanceDept(hospitalId: string): Promise<any> {
  return (prisma as any).financeDepartment.findUnique({ where: { hospitalId } });
}

export async function upsertFinanceDept(
  hospitalId: string,
  data: { name?: string; hodName?: string; hodEmail?: string; hodPhone?: string; isActive?: boolean }
): Promise<any> {
  const existing = await (prisma as any).financeDepartment.findUnique({ where: { hospitalId } });
  if (existing) {
    return (prisma as any).financeDepartment.update({ where: { hospitalId }, data });
  }
  return (prisma as any).financeDepartment.create({ data: { hospitalId, ...data } });
}

// Note: getFinanceDashboardStats moved to backend/services/finance.service.ts
// to include inventory purchase expenses alongside operational expenses
