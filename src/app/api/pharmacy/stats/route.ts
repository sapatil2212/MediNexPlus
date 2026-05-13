import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;

/**
 * GET /api/pharmacy/stats
 * Dashboard stats for pharmacy: today's dispensing, inventory alerts, revenue
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get pharmacy sub-dept for this user
    let pharmacySubDeptId: string | null = null;
    if (auth.user.role === "SUB_DEPT_HEAD") {
      const subDept = await px.subDepartment.findFirst({
        where: { userId: auth.user.userId, hospitalId: auth.hospitalId },
      });
      if (subDept) pharmacySubDeptId = subDept.id;
    }

    // Today's prescriptions with medications
    const todayRxCount = await px.prescription.count({
      where: {
        hospitalId: auth.hospitalId,
        medications: { not: null },
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // Today's completed pharmacy workflows
    const todayDispensed = await px.prescriptionWorkflow.count({
      where: {
        hospitalId: auth.hospitalId,
        ...(pharmacySubDeptId ? { subDepartmentId: pharmacySubDeptId } : {}),
        status: "COMPLETED",
        completedAt: { gte: today, lt: tomorrow },
      },
    });

    // Pending pharmacy workflows
    const pendingCount = await px.prescriptionWorkflow.count({
      where: {
        hospitalId: auth.hospitalId,
        ...(pharmacySubDeptId ? { subDepartmentId: pharmacySubDeptId } : {}),
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    // Inventory stats - low stock items (pharmacy category)
    const allItems = await px.inventoryItem.findMany({
      where: { hospitalId: auth.hospitalId, isActive: true },
      include: {
        batches: {
          where: { remainingQty: { gt: 0 } },
          select: { remainingQty: true, expiryDate: true },
        },
      },
    });

    let lowStockCount = 0;
    let expiringCount = 0;
    let totalItems = allItems.length;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const item of allItems) {
      const totalStock = item.batches.reduce((sum: number, b: any) => sum + b.remainingQty, 0);
      if (totalStock <= item.minStock) lowStockCount++;
      for (const batch of item.batches) {
        if (batch.expiryDate && new Date(batch.expiryDate) <= thirtyDaysFromNow) {
          expiringCount++;
          break; // count item only once
        }
      }
    }

    // Today's & all-time pharmacy revenue — via bill.findMany (avoids billItem.aggregate nested-relation issues)
    const sumPharmacyItems = (bills: any[]) =>
      bills.reduce((s: number, b: any) => s + (b.billItems || []).reduce((bs: number, i: any) => bs + (i.amount || 0), 0), 0);

    const [todayBillsRev, totalBillsRev] = await Promise.all([
      px.bill.findMany({
        where: { hospitalId: auth.hospitalId, status: "PAID", paidAt: { gte: today, lt: tomorrow }, billItems: { some: { type: "PHARMACY" } } },
        select: { billItems: { where: { type: "PHARMACY" }, select: { amount: true } } },
      }),
      px.bill.findMany({
        where: { hospitalId: auth.hospitalId, status: "PAID", billItems: { some: { type: "PHARMACY" } } },
        select: { billItems: { where: { type: "PHARMACY" }, select: { amount: true } } },
      }),
    ]);
    const todayRevenue = sumPharmacyItems(todayBillsRev);
    const totalRevenue = sumPharmacyItems(totalBillsRev);

    // Stock health percentage
    const stockHealthPct = totalItems > 0 ? Math.round(((totalItems - lowStockCount) / totalItems) * 100) : 100;

    // Yesterday revenue — bill.findMany approach
    const yesterdayStart = new Date(today);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayBillsRev = await px.bill.findMany({
      where: { hospitalId: auth.hospitalId, status: "PAID", paidAt: { gte: yesterdayStart, lt: today }, billItems: { some: { type: "PHARMACY" } } },
      select: { billItems: { where: { type: "PHARMACY" }, select: { amount: true } } },
    });
    const yesterdayRevenue = sumPharmacyItems(yesterdayBillsRev);

    // Last 7 days — revenue from BillItems (PHARMACY type), dispensing count from PrescriptionWorkflow
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [weekPharmaBills, weekDispenses] = await Promise.all([
      px.bill.findMany({
        where: { hospitalId: auth.hospitalId, status: "PAID", paidAt: { gte: sevenDaysAgo }, billItems: { some: { type: "PHARMACY" } } },
        select: { paidAt: true, billItems: { where: { type: "PHARMACY" }, select: { amount: true } } },
      }),
      px.prescriptionWorkflow.findMany({
        where: {
          hospitalId: auth.hospitalId,
          ...(pharmacySubDeptId ? { subDepartmentId: pharmacySubDeptId } : {}),
          status: "COMPLETED",
          completedAt: { gte: sevenDaysAgo },
        },
        select: { completedAt: true },
      }),
    ]);

    const dailySales: Record<string, { count: number; revenue: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailySales[key] = { count: 0, revenue: 0 };
    }
    for (const b of weekPharmaBills) {
      if (!b.paidAt) continue;
      const key = new Date(b.paidAt).toISOString().slice(0, 10);
      if (dailySales[key]) dailySales[key].revenue += (b.billItems || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
    }
    for (const w of weekDispenses) {
      if (!w.completedAt) continue;
      const key = new Date(w.completedAt).toISOString().slice(0, 10);
      if (dailySales[key]) dailySales[key].count++;
    }

    const chartData = Object.entries(dailySales).map(([date, data]) => ({
      date,
      label: new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" }),
      count: data.count,
      revenue: data.revenue,
    }));

    // Top dispensed medicines (last 30 days)
    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const topMedsMovements = await px.stockMovement.findMany({
      where: {
        hospitalId: auth.hospitalId,
        type: "OUT",
        source: { in: ["PHARMACY_DISPENSE", "PHARMACY_COUNTER_SALE"] },
        createdAt: { gte: thirtyDaysAgoDate },
      },
      include: { item: { select: { id: true, name: true, category: true, sellingPrice: true } } },
    });

    const medMap = new Map<string, { name: string; category: string; qty: number; revenue: number }>();
    for (const m of topMedsMovements) {
      const key = m.itemId;
      const existing = medMap.get(key);
      const rev = m.quantity * (m.item?.sellingPrice || 0);
      if (existing) {
        existing.qty += m.quantity;
        existing.revenue += rev;
      } else {
        medMap.set(key, { name: m.item?.name || "Unknown", category: m.item?.category || "", qty: m.quantity, revenue: rev });
      }
    }
    const topMedicines = Array.from(medMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // Previous week revenue (days -14 to -7) from Revenue table
    const prevWeekStart = new Date();
    prevWeekStart.setDate(prevWeekStart.getDate() - 14);
    prevWeekStart.setHours(0, 0, 0, 0);
    const prevWeekBills = await px.bill.findMany({
      where: { hospitalId: auth.hospitalId, status: "PAID", paidAt: { gte: prevWeekStart, lt: sevenDaysAgo }, billItems: { some: { type: "PHARMACY" } } },
      select: { billItems: { where: { type: "PHARMACY" }, select: { amount: true } } },
    });
    const prevWeekRevenue = prevWeekBills.reduce((s: number, b: any) => s + (b.billItems || []).reduce((bs: number, i: any) => bs + (i.amount || 0), 0), 0);
    const weekRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const revenueGrowth = prevWeekRevenue > 0
      ? Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
      : null;

    return successResponse({
      todayRxCount,
      todayDispensed,
      pendingCount,
      lowStockCount,
      expiringCount,
      totalItems,
      todayRevenue,
      yesterdayRevenue,
      totalRevenue,
      weekRevenue,
      prevWeekRevenue,
      revenueGrowth,
      stockHealthPct,
      chartData,
      topMedicines,
    }, "Pharmacy stats fetched");
  } catch (error: any) {
    console.error("[pharmacy/stats] Error:", error);
    return errorResponse(error.message || "Failed to fetch pharmacy stats", 500);
  }
}
