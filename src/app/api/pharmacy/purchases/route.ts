import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;

/**
 * GET /api/pharmacy/purchases
 * List purchases — accessible by SUB_DEPT_HEAD, DEPT_HEAD, HOSPITAL_ADMIN, STAFF
 * SUB_DEPT_HEAD: filtered to their own sub-department only
 * HOSPITAL_ADMIN / STAFF: all hospital purchases
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page  = parseInt(searchParams.get("page")  || "1");
    const skip  = (page - 1) * limit;

    const where: any = { hospitalId: auth.hospitalId };

    // SUB_DEPT_HEAD sees only their own sub-department's purchases
    if (auth.user.role === Role.SUB_DEPT_HEAD) {
      const subDept = await px.subDepartment.findFirst({
        where: { userId: auth.user.userId, hospitalId: auth.hospitalId },
        select: { id: true },
      });
      if (!subDept) return successResponse({ data: [], total: 0, page, limit }, "No sub-department found");
      where.subDepartmentId = subDept.id;
    }

    const [purchases, total] = await Promise.all([
      px.purchase.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, phone: true, email: true } },
          items: {
            include: { item: { select: { id: true, name: true, category: true } } },
          },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      px.purchase.count({ where }),
    ]);

    return successResponse({ data: purchases, total, page, limit }, "Purchases fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch purchases", 500);
  }
}

/**
 * POST /api/pharmacy/purchases
 * Create a new purchase order (SUB_DEPT_HEAD or HOSPITAL_ADMIN)
 * SUB_DEPT_HEAD: automatically tags purchase with their subDepartmentId
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      supplierId, purchaseNo, notes, items,
      invoiceNumber, invoiceDate,
      paymentType, paymentMethod, amountPaid, transactionId, dueDate,
      discount, taxPercent, grandTotal,
    } = body;

    if (!purchaseNo || !items?.length) {
      return errorResponse("purchaseNo and items are required", 400);
    }

    // Resolve subDepartmentId for SUB_DEPT_HEAD
    let subDepartmentId: string | null = null;
    if (auth.user.role === Role.SUB_DEPT_HEAD) {
      const subDept = await px.subDepartment.findFirst({
        where: { userId: auth.user.userId, hospitalId: auth.hospitalId },
        select: { id: true },
      });
      subDepartmentId = subDept?.id ?? null;
    }

    const totalAmount = items.reduce((sum: number, i: any) => sum + ((i.price || 0) * (i.quantity || 0)), 0);
    const finalGrandTotal = grandTotal ?? totalAmount;
    const pType = paymentType || "CREDIT";

    const purchase = await px.purchase.create({
      data: {
        hospitalId: auth.hospitalId,
        supplierId: supplierId || null,
        subDepartmentId,
        purchaseNo,
        totalAmount,
        grandTotal: finalGrandTotal,
        discount: discount || 0,
        taxPercent: taxPercent || 0,
        status: "PENDING",
        paymentStatus: pType === "PAID" ? "PAID" : "PENDING",
        paymentType: pType,
        paymentMethod: pType === "PAID" ? (paymentMethod || "BANK_TRANSFER") : null,
        amountPaid: pType === "PAID" ? (amountPaid || finalGrandTotal) : 0,
        transactionId: transactionId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        invoiceNumber: invoiceNumber || null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        notes: notes || null,
        items: {
          create: items.map((i: any) => ({
            hospitalId: auth.hospitalId,
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
            batchNumber: i.batchNumber || null,
            expiryDate: i.expiryDate ? new Date(i.expiryDate) : null,
          })),
        },
      },
      include: { supplier: true, items: { include: { item: true } } },
    });

    // Log expense when purchase is paid immediately
    if (pType === "PAID" && finalGrandTotal > 0) {
      const supplierName = purchase.supplier?.name || "Unknown Supplier";
      await px.expense.create({
        data: {
          hospitalId: auth.hospitalId,
          title: `Pharmacy Purchase: ${purchaseNo} — ${supplierName}`,
          category: "PHARMACY",
          amount: finalGrandTotal,
          date: new Date(),
          description: `Pharmacy purchase order ${purchaseNo}. ${notes || ""}`.trim(),
          addedBy: auth.user.userId || null,
        },
      }).catch(() => {});
    }

    return successResponse(purchase, "Purchase order created");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to create purchase", 500);
  }
}

/**
 * PATCH /api/pharmacy/purchases
 * Receive / update purchase status → auto-updates stock
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, status, action, paymentMethod, amountPaid, transactionId } = body;
    if (!id) return errorResponse("id is required", 400);

    const purchase = await px.purchase.findFirst({
      where: { id, hospitalId: auth.hospitalId },
      include: { items: true, supplier: { select: { name: true } } },
    });
    if (!purchase) return errorResponse("Purchase not found", 404);

    // Pay action — record payment for a credit purchase
    if (action === "pay") {
      const paidAmount = parseFloat(amountPaid) || purchase.grandTotal;
      const newPaidTotal = (purchase.amountPaid || 0) + paidAmount;
      const fullyPaid = newPaidTotal >= purchase.grandTotal;
      await px.purchase.update({
        where: { id },
        data: {
          amountPaid: newPaidTotal,
          paymentStatus: fullyPaid ? "PAID" : "PARTIAL",
          paymentMethod: paymentMethod || "BANK_TRANSFER",
          transactionId: transactionId || null,
        },
      });
      // Log expense for this payment
      if (paidAmount > 0) {
        await px.expense.create({
          data: {
            hospitalId: auth.hospitalId,
            title: `Pharmacy Payment: ${purchase.purchaseNo} — ${purchase.supplier?.name || "Supplier"}`,
            category: "PHARMACY",
            amount: paidAmount,
            date: new Date(),
            description: `Payment for pharmacy PO ${purchase.purchaseNo}. Method: ${paymentMethod || "BANK_TRANSFER"}`,
            addedBy: auth.user.userId || null,
          },
        }).catch(() => {});
      }
      return successResponse(null, "Payment recorded");
    }

    await px.purchase.update({
      where: { id },
      data: { status: status || "COMPLETED" },
    });

    // When COMPLETED → inward stock for each item
    if (status === "COMPLETED" && purchase.status !== "COMPLETED") {
      for (const item of purchase.items) {
        await px.stockBatch.create({
          data: {
            hospitalId: auth.hospitalId,
            itemId: item.itemId,
            batchNumber: item.batchNumber || null,
            quantity: item.quantity,
            remainingQty: item.quantity,
            purchasePrice: item.price,
            expiryDate: item.expiryDate || null,
            supplierId: purchase.supplierId,
          },
        });
        await px.stockMovement.create({
          data: {
            hospitalId: auth.hospitalId,
            itemId: item.itemId,
            type: "IN",
            quantity: item.quantity,
            source: "PURCHASE",
            referenceId: purchase.id,
            performedBy: auth.user.userId || "pharmacy",
          },
        });
      }
    }

    return successResponse(null, "Purchase updated");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update purchase", 500);
  }
}
