import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

async function generateOrderNo(hospitalId: string): Promise<string> {
  const count = await (prisma as any).labOrder.count({ where: { hospitalId } });
  return `LAB-${String(count + 1).padStart(5, "0")}`;
}

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    let hospitalId: string;
    let subDeptId: string | undefined;

    if (user!.role === "SUB_DEPT_HEAD") {
      const profile = await getSubDeptProfile(user!.userId);
      hospitalId = (profile as any).hospitalId;
      subDeptId = (profile as any).id;
    } else {
      const u = await (prisma as any).user.findUnique({ where: { id: user!.userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
      subDeptId = req.nextUrl.searchParams.get("subDepartmentId") || undefined;
    }

    const status = req.nextUrl.searchParams.get("status") || undefined;
    const priority = req.nextUrl.searchParams.get("priority") || undefined;
    const search = req.nextUrl.searchParams.get("search") || undefined;
    const date = req.nextUrl.searchParams.get("date") || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const skip = parseInt(req.nextUrl.searchParams.get("skip") || "0");

    const where: any = { hospitalId };
    if (subDeptId) where.subDepartmentId = subDeptId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: d, lt: end };
    }
    if (search) {
      where.OR = [
        { orderNo: { contains: search } },
        { patient: { name: { contains: search } } },
        { patient: { patientId: { contains: search } } },
        { patient: { phone: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      (prisma as any).labOrder.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true } },
          doctor: { select: { id: true, name: true, specialization: true } },
          items: {
            include: {
              test: { select: { id: true, name: true, code: true, unit: true, normalRangeMin: true, normalRangeMax: true, normalRangeText: true } },
              panel: { select: { id: true, name: true, code: true } },
            },
          },
          sample: true,
          report: { select: { id: true, status: true, verifiedBy: true, verifiedAt: true, deliveredAt: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      (prisma as any).labOrder.count({ where }),
    ]);

    return successResponse({ data: orders, total, limit, skip });
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN", "STAFF"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    let hospitalId: string;
    let subDeptId: string;

    const body = await req.json();

    if (user!.role === "SUB_DEPT_HEAD") {
      const profile = await getSubDeptProfile(user!.userId);
      hospitalId = (profile as any).hospitalId;
      subDeptId = (profile as any).id;
    } else {
      const u = await (prisma as any).user.findUnique({ where: { id: user!.userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
      subDeptId = body.subDepartmentId;
    }

    let { patientId, appointmentId, doctorId, priority, orderType, clinicalNotes, referralNotes, isHomeCollection, collectionAddress, items, billingAction, paymentMethod, discount, taxPercent, billingSubdeptId } = body;
    if (!items || items.length === 0) return errorResponse("At least one test or panel required", 400);

    // Auto-register new patient inline if patientId absent but name provided
    if (!patientId && body.patientName) {
      if (body.phone) {
        // Use service with dedup-by-phone
        const { registerPatient } = await import("../../../../../backend/services/patient.service");
        const { patient } = await registerPatient(hospitalId, "", {
          name: body.patientName,
          phone: body.phone,
          gender: body.gender || undefined,
          dateOfBirth: body.dob ? new Date(body.dob) : undefined,
          email: body.email || undefined,
          address: body.address || undefined,
        });
        patientId = patient.id;
      } else {
        // No phone — create patient directly via prisma
        const pCount = await (prisma as any).patient.count({ where: { hospitalId } });
        const pId = `PT-${String(pCount + 1).padStart(4, "0")}`;
        const np = await (prisma as any).patient.create({
          data: {
            hospitalId, patientId: pId,
            name: body.patientName,
            phone: null,
            gender: body.gender || null,
            dateOfBirth: body.dob ? new Date(body.dob) : null,
            email: body.email || null,
            address: body.address || null,
          },
        });
        patientId = np.id;
      }
    }
    if (!patientId) return errorResponse("Patient is required — provide patientId or patientName", 400);

    const orderNo = await generateOrderNo(hospitalId);
    const grossAmount = items.reduce((s: number, i: any) => s + (parseFloat(i.price) || 0), 0);
    const discountPct = parseFloat(discount || "0") || 0;
    const taxPct = parseFloat(taxPercent || "0") || 0;
    const totalAmount = Math.max(0, grossAmount * (1 - discountPct / 100) * (1 + taxPct / 100));

    const order = await (prisma as any).labOrder.create({
      data: {
        hospitalId, subDepartmentId: subDeptId,
        patientId, appointmentId: appointmentId || null,
        doctorId: doctorId || null,
        orderNo, priority: priority || "ROUTINE",
        orderType: orderType || "MANUAL",
        clinicalNotes, referralNotes,
        isHomeCollection: isHomeCollection || false,
        collectionAddress,
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            testId: item.testId || null,
            panelId: item.panelId || null,
            unit: item.unit || null,
            normalRange: item.normalRange || null,
          })),
        },
      },
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true } },
        doctor: { select: { id: true, name: true } },
        items: {
          include: {
            test: { select: { id: true, name: true, code: true } },
            panel: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Auto-create bill if billing action is requested
    let bill: any = null;
    if (billingAction === "send_to_billing" || billingAction === "collect_at_lab") {
      try {
        const billCount = await (prisma as any).bill.count({ where: { hospitalId } });
        const billNo = `LAB-BILL-${String(billCount + 1).padStart(5, "0")}`;
        const itemsSummary = items.map((i: any) => i.name || "Lab Test").join(", ");
        bill = await (prisma as any).bill.create({
          data: {
            hospitalId,
            billNo,
            patientId,
            items: JSON.stringify(items.map((i: any) => ({ name: i.name, price: i.price, testId: i.testId, panelId: i.panelId }))),
            subtotal: grossAmount,
            total: totalAmount,
            paidAmount: billingAction === "collect_at_lab" ? totalAmount : 0,
            paidAt: billingAction === "collect_at_lab" ? new Date() : null,
            discount: 0,
            status: billingAction === "collect_at_lab" ? "PAID" : "PENDING",
            paymentMethod: billingAction === "collect_at_lab" ? (paymentMethod || "CASH") : null,
            notes: `Lab Order ${orderNo} — ${itemsSummary}`,
            billItems: {
              create: items.map((item: any) => ({
                hospitalId,
                type: "LAB_TEST",
                referenceId: order.id,
                name: item.name || "Lab Test",
                quantity: 1,
                unitPrice: parseFloat(item.price) || 0,
                amount: parseFloat(item.price) || 0,
              })),
            },
          },
          include: { billItems: true, payments: true },
        });
        // If collecting at lab, create payment record
        if (billingAction === "collect_at_lab" && totalAmount > 0) {
          const payCount = await (prisma as any).payment.count({ where: { hospitalId } });
          await (prisma as any).payment.create({
            data: {
              hospitalId,
              billId: bill.id,
              amount: totalAmount,
              method: paymentMethod || "CASH",
              status: "SUCCESS",
              transactionId: `LAB-PAY-${String(payCount + 1).padStart(5, "0")}`,
            },
          });
          // Revenue entry
          await (prisma as any).revenue.create({
            data: { hospitalId, sourceType: "OTHER", referenceId: order.id, referenceType: "LabOrder", amount: totalAmount, description: `Lab Order ${orderNo}` },
          }).catch(() => {});
        }
      } catch (billErr: any) {
        console.error("[LabOrder] Billing creation failed (non-fatal):", billErr.message);
      }
    }

    return successResponse({ ...order, bill });
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}
