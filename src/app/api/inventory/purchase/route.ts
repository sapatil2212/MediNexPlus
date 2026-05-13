import { NextRequest } from "next/server";
import { requireHospitalAdmin, requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import * as service from "../../../../../backend/services/inventory.service";
import prisma from "../../../../../backend/config/db";
import { z } from "zod";

const purchaseSchema = z.object({
  supplierId: z.string().uuid().optional().nullable(),
  purchaseNo: z.string().min(1),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  notes: z.string().optional(),
  // Payment fields
  paymentType: z.enum(["CREDIT", "PAID"]).default("CREDIT"),
  paymentMethod: z.string().optional().nullable(),
  amountPaid: z.number().nonnegative().default(0),
  dueDate: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  discount: z.number().nonnegative().default(0),
  taxPercent: z.number().nonnegative().default(0),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
    sellingPrice: z.number().nonnegative().optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    mfgDate: z.string().optional(),
  })).min(1),
});

const purchaseUpdateSchema = z.object({
  id: z.string().uuid(),
  purchaseNo: z.string().min(1).optional(),
  notes: z.string().optional(),
  paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID"]).optional(),
  paymentMethod: z.string().optional(),
  amountPaid: z.number().nonnegative().optional(),
  transactionId: z.string().optional(),
  paidAt: z.string().optional(),
  reminderSent: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const paymentStatus = searchParams.get("paymentStatus");
    const dueReminders = searchParams.get("dueReminders");
    if (id) {
      const data = await service.getPurchaseById(id, auth.hospitalId);
      if (!data) return errorResponse("Purchase not found", 404);
      return successResponse(data, "Purchase fetched");
    }
    if (dueReminders === "true") {
      const data = await service.getDueReminders(auth.hospitalId);
      return successResponse(data, "Due reminders fetched");
    }
    const data = await service.getPurchases(auth.hospitalId, paymentStatus || undefined);
    return successResponse(data, "Purchases fetched");
  } catch (e: any) {
    console.error("[GET /api/inventory/purchase] Error:", e);
    return errorResponse(e.message || "Unknown error", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = purchaseSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    
    const data = await service.createPurchaseOrder(auth.hospitalId, result.data);

    // Auto-log expense if purchase was created with upfront payment
    const paidAmt = data.amountPaid || 0;
    if (paidAmt > 0) {
      let supplierName = "Unknown Supplier";
      if (result.data.supplierId) {
        const sup = await (prisma as any).supplier.findUnique({ where: { id: result.data.supplierId }, select: { name: true } });
        if (sup?.name) supplierName = sup.name;
      }
      (prisma as any).expense.create({
        data: {
          hospitalId: auth.hospitalId,
          title: `Supplier Payment — ${supplierName} (${data.purchaseNo})`,
          category: "INVENTORY",
          amount: paidAmt,
          date: data.paidAt || new Date(),
          description: [
            `PO: ${data.purchaseNo}`,
            `Supplier: ${supplierName}`,
            result.data.paymentMethod ? `Method: ${result.data.paymentMethod.replace(/_/g, " ")}` : null,
            result.data.transactionId ? `Txn ID: ${result.data.transactionId}` : null,
            `Total: ₹${(data.grandTotal || data.totalAmount || 0).toFixed(2)}`,
          ].filter(Boolean).join(" | "),
          addedBy: (auth.user as any)?.id || null,
        },
      }).catch((err: any) => console.error("[Expense auto-log POST] Failed:", err.message));
    }

    return successResponse(data, "Purchase created", 201);
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Purchase number already exists", 409);
    return errorResponse(e.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = purchaseUpdateSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    // Fetch existing purchase to compute payment delta for expense logging
    const existing = await service.getPurchaseById(result.data.id, auth.hospitalId);
    if (!existing) return errorResponse("Purchase not found", 404);
    const oldPaid = existing.amountPaid || 0;

    const updatePayload: any = {};
    if (result.data.purchaseNo) updatePayload.purchaseNo = result.data.purchaseNo;
    if (result.data.notes !== undefined) updatePayload.notes = result.data.notes;
    if (result.data.paymentStatus) updatePayload.paymentStatus = result.data.paymentStatus;
    if (result.data.paymentMethod) updatePayload.paymentMethod = result.data.paymentMethod;
    if (result.data.amountPaid !== undefined) updatePayload.amountPaid = result.data.amountPaid;
    if (result.data.transactionId) updatePayload.transactionId = result.data.transactionId;
    if (result.data.paidAt) updatePayload.paidAt = new Date(result.data.paidAt);
    if (result.data.reminderSent !== undefined) updatePayload.reminderSent = result.data.reminderSent;
    const data = await service.updatePurchase(result.data.id, auth.hospitalId, updatePayload);

    // Auto-log expense for the payment amount (fire-and-forget)
    const newPaid = result.data.amountPaid ?? oldPaid;
    const paymentDelta = newPaid - oldPaid;
    if (paymentDelta > 0) {
      const supplierName = existing.supplier?.name || "Unknown Supplier";
      const poNo = existing.purchaseNo || result.data.id;
      const payDate = result.data.paidAt ? new Date(result.data.paidAt) : new Date();
      const method = result.data.paymentMethod || existing.paymentMethod || "";
      const txnId = result.data.transactionId || "";

      (prisma as any).expense.create({
        data: {
          hospitalId: auth.hospitalId,
          title: `Supplier Payment — ${supplierName} (${poNo})`,
          category: "INVENTORY",
          amount: paymentDelta,
          date: payDate,
          description: [
            `PO: ${poNo}`,
            `Supplier: ${supplierName}`,
            method ? `Method: ${method.replace(/_/g, " ")}` : null,
            txnId ? `Txn ID: ${txnId}` : null,
            `Total PO: ₹${(existing.grandTotal || existing.totalAmount || 0).toFixed(2)}`,
            `Cumulative Paid: ₹${newPaid.toFixed(2)}`,
          ].filter(Boolean).join(" | "),
          addedBy: (auth.user as any)?.id || null,
        },
      }).catch((err: any) => console.error("[Expense auto-log] Failed:", err.message));
    }

    return successResponse(data, "Purchase updated");
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Purchase number already exists", 409);
    return errorResponse(e.message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    const data = await service.cancelPurchase(id, auth.hospitalId);
    return successResponse(data, "Purchase cancelled");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
