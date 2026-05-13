import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;
export const dynamic = "force-dynamic";

/**
 * GET /api/pharmacy/counter-sale
 * Returns counter sale history with KPI stats.
 * Query params: period (today|week|month|all), search, limit, page
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF, Role.RECEPTIONIST]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const period  = searchParams.get("period") || "month";
    const search  = searchParams.get("search") || "";
    const limit   = parseInt(searchParams.get("limit") || "50");
    const page    = parseInt(searchParams.get("page") || "1");

    const now = new Date();
    let fromDate: Date | null = null;
    if (period === "today") { fromDate = new Date(now); fromDate.setHours(0,0,0,0); }
    else if (period === "week")  { fromDate = new Date(now); fromDate.setDate(now.getDate() - 7); }
    else if (period === "month") { fromDate = new Date(now.getFullYear(), now.getMonth(), 1); }

    const where: any = {
      hospitalId: auth.hospitalId,
      notes: { contains: "PHARMACY_COUNTER_SALE" },
    };
    if (fromDate) where.createdAt = { gte: fromDate };
    if (search) {
      where.OR = [
        { billNo: { contains: search } },
        { patient: { name: { contains: search } } },
        { patient: { patientId: { contains: search } } },
      ];
    }

    const [bills, totalCount] = await Promise.all([
      px.bill.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, patientId: true, phone: true } },
          billItems: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      px.bill.count({ where }),
    ]);

    // ── KPI Stats ──
    const allBills: any[] = await px.bill.findMany({
      where: { hospitalId: auth.hospitalId, notes: { contains: "PHARMACY_COUNTER_SALE" }, ...(fromDate ? { createdAt: { gte: fromDate } } : {}) },
      include: { billItems: true },
    });

    const totalSales   = allBills.length;
    const totalRevenue = allBills.reduce((s: number, b: any) => s + (b.paidAmount || 0), 0);
    const totalDiscount= allBills.reduce((s: number, b: any) => s + (b.discount || 0), 0);

    // Best performer medicine
    const itemFreq: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const bill of allBills) {
      let items: any[] = [];
      try { items = bill.billItems?.length ? bill.billItems : (typeof bill.items === "string" ? JSON.parse(bill.items) : bill.items || []); } catch {}
      for (const it of items) {
        const nm = it.name || "Unknown";
        if (!itemFreq[nm]) itemFreq[nm] = { name: nm, qty: 0, revenue: 0 };
        itemFreq[nm].qty     += (it.quantity || 1);
        itemFreq[nm].revenue += (it.amount || 0);
      }
    }
    const bestMedicine = Object.values(itemFreq).sort((a, b) => b.revenue - a.revenue)[0] || null;

    const history = bills.map((bill: any) => {
      let items: any[] = [];
      try { items = bill.billItems?.length ? bill.billItems : (typeof bill.items === "string" ? JSON.parse(bill.items) : bill.items || []); } catch {}
      return {
        id: bill.id, billNo: bill.billNo, patient: bill.patient, items,
        subtotal: bill.subtotal, discount: bill.discount, tax: bill.tax,
        total: bill.total, paidAmount: bill.paidAmount, status: bill.status,
        paymentMethod: bill.paymentMethod, notes: bill.notes,
        createdAt: bill.createdAt,
      };
    });

    return successResponse({
      sales: history,
      pagination: { total: totalCount, page, totalPages: Math.ceil(totalCount / limit) },
      stats: { totalSales, totalRevenue, totalDiscount, bestMedicine },
    }, "Counter sales fetched");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch counter sales", 500);
  }
}

/**
 * DELETE /api/pharmacy/counter-sale?id=...
 * Deletes a counter sale bill record.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("id is required", 400);

    const bill = await px.bill.findFirst({ where: { id, hospitalId: auth.hospitalId, notes: { contains: "PHARMACY_COUNTER_SALE" } } });
    if (!bill) return errorResponse("Counter sale not found", 404);

    // Delete payments + bill items + revenue + bill
    await px.$transaction(async (tx: any) => {
      await tx.payment.deleteMany({ where: { billId: id } });
      await tx.billItem.deleteMany({ where: { billId: id } });
      await tx.revenue.deleteMany({ where: { referenceId: id } });
      await tx.bill.delete({ where: { id } });
    });

    return successResponse(null, "Counter sale deleted");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to delete counter sale", 500);
  }
}

/**
 * POST /api/pharmacy/counter-sale
 * Direct pharmacy counter sale — patient walks in, buys pharma items, pays.
 * Creates Bill + BillItems + Payment + Revenue. No prescription needed.
 * Bill is tagged with "PHARMACY_COUNTER_SALE" in notes so it appears in
 * hospital-admin / reception billing with a clear "Pharmacy Dept" remark.
 *
 * IMPORTANT: Deducts stock from inventory batches (FIFO) and records movements.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF, Role.RECEPTIONIST]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      patientId,
      items,           // [{ inventoryItemId, name, quantity, unitPrice }]
      paymentMethod,   // CASH | UPI | CARD | ONLINE
      transactionId,
      discount,
      remarks,
      notifyAdmin,
      notifyReception,
    } = body;

    if (!patientId) return errorResponse("patientId is required", 400);
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse("At least one item is required", 400);
    }

    // Validate items & check stock availability (combined quantities per inventory item)
    const combinedQty: Record<string, number> = {};
    for (const item of items) {
      if (!item.inventoryItemId) return errorResponse("All items must be selected from inventory (missing inventoryItemId)", 400);
      if (!item.name || !item.quantity || item.quantity < 1) {
        return errorResponse("Each item must have a name and quantity >= 1", 400);
      }
      combinedQty[item.inventoryItemId] = (combinedQty[item.inventoryItemId] || 0) + item.quantity;
    }

    // Verify stock availability for combined quantities
    for (const [itemId, totalQty] of Object.entries(combinedQty)) {
      const invItem = await px.inventoryItem.findFirst({
        where: { id: itemId, hospitalId: auth.hospitalId },
        include: { batches: { where: { remainingQty: { gt: 0 } }, orderBy: { expiryDate: "asc" } } },
      });
      if (!invItem) return errorResponse(`Inventory item not found: ${itemId}`, 404);
      const totalStock = invItem.batches.reduce((s: number, b: any) => s + b.remainingQty, 0);
      if (totalStock < totalQty) {
        return errorResponse(`Insufficient stock for ${invItem.name}. Available: ${totalStock}, Requested: ${totalQty}`, 400);
      }
    }

    // Verify patient exists
    const patient = await px.patient.findFirst({
      where: { id: patientId, hospitalId: auth.hospitalId },
    });
    if (!patient) return errorResponse("Patient not found", 404);

    // Generate bill number
    const billCount = await px.bill.count({ where: { hospitalId: auth.hospitalId } });
    const billNo = `BILL-${String(billCount + 1).padStart(5, "0")}`;

    // Calculate totals
    const billItems = items.map((item: any) => {
      const qty = parseInt(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      return {
        name: item.name,
        quantity: qty,
        unitPrice: price,
        amount: qty * price,
        type: "PHARMACY",
        referenceId: item.inventoryItemId || null,
      };
    });

    const subtotal = billItems.reduce((s: number, i: any) => s + i.amount, 0);
    const discountAmt = parseFloat(discount) || 0;
    const total = Math.max(subtotal - discountAmt, 0);

    const counterSaleRemark = `[PHARMACY_COUNTER_SALE] ${remarks || "Direct pharmacy purchase"}`;

    // Create bill + items + payment + revenue + deduct stock in a transaction
    const result = await px.$transaction(async (tx: any) => {
      // Create bill
      const bill = await tx.bill.create({
        data: {
          hospitalId: auth.hospitalId,
          billNo,
          patientId,
          prescriptionId: null,
          visitId: null,
          items: JSON.stringify(billItems),
          subtotal,
          discount: discountAmt,
          tax: 0,
          total,
          paidAmount: total,
          status: "PAID",
          paidAt: new Date(),
          paymentMethod: paymentMethod || "CASH",
          notes: counterSaleRemark,
        },
      });

      // Create bill items
      for (const bi of billItems) {
        await tx.billItem.create({
          data: {
            hospitalId: auth.hospitalId,
            billId: bill.id,
            type: bi.type,
            referenceId: bi.referenceId,
            name: bi.name,
            quantity: bi.quantity,
            unitPrice: bi.unitPrice,
            amount: bi.amount,
          },
        });
      }

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          hospitalId: auth.hospitalId,
          billId: bill.id,
          amount: total,
          method: paymentMethod || "CASH",
          transactionId: transactionId || null,
          status: "SUCCESS",
          notes: counterSaleRemark,
          paidAt: new Date(),
        },
      });

      // Log revenue
      await tx.revenue.create({
        data: {
          hospitalId: auth.hospitalId,
          sourceType: "PHARMACY",
          referenceId: bill.id,
          referenceType: "COUNTER_SALE",
          amount: total,
          description: counterSaleRemark,
        },
      });

      // ── Deduct stock from batches (FIFO — earliest expiry first) ──
      for (const [itemId, totalQty] of Object.entries(combinedQty)) {
        let remaining = totalQty;
        // Fetch batches with stock, ordered by expiry (FIFO)
        const batches = await tx.stockBatch.findMany({
          where: { itemId, hospitalId: auth.hospitalId, remainingQty: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
        });

        for (const batch of batches) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.remainingQty, remaining);
          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { remainingQty: batch.remainingQty - deduct },
          });
          // Record movement
          await tx.stockMovement.create({
            data: {
              hospitalId: auth.hospitalId,
              itemId,
              batchId: batch.id,
              type: "SALE",
              quantity: deduct,
              source: "PHARMACY_COUNTER_SALE",
              referenceId: bill.id,
              notes: `Counter sale — Bill ${billNo}`,
              performedBy: auth.user?.userId,
            },
          });
          remaining -= deduct;
        }

        // Update totalStock on InventoryItem
        const updatedBatches = await tx.stockBatch.findMany({
          where: { itemId, hospitalId: auth.hospitalId },
        });
        const newTotalStock = updatedBatches.reduce((s: number, b: any) => s + b.remainingQty, 0);
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: { updatedAt: new Date() },
        });
      }

      return { bill, payment };
    });

    return successResponse(
      { billId: result.bill.id, billNo: result.bill.billNo, total: result.bill.total },
      "Pharmacy counter sale completed successfully"
    );
  } catch (err: any) {
    console.error("Pharmacy counter-sale error:", err);
    return errorResponse(err.message || "Failed to process counter sale", 500);
  }
}
