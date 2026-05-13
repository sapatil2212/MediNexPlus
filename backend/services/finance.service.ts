import prisma from "../config/db";

export class FinanceServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Get comprehensive finance dashboard statistics
 * - Revenue from billing (paid bills)
 * - Expenses from Expense table + Inventory purchases
 * - Bill statistics
 * - Revenue breakdown by source
 * - Expense breakdown by category
 */
export async function getFinanceDashboardStats(hospitalId: string): Promise<any> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    // Revenue from paid bills
    todayRevenue,
    monthRevenue,
    yearRevenue,
    
    // Manual revenue entries from Revenue table
    todayManualRevenue,
    monthManualRevenue,
    yearManualRevenue,
    
    // Bill counts
    pendingBills,
    paidBills,
    partialBills,
    totalBills,
    
    // Expenses from Expense table
    todayExpenseFromTable,
    monthExpenseFromTable,
    yearExpenseFromTable,
    
    // Expenses from Inventory Purchases
    todayPurchases,
    monthPurchases,
    yearPurchases,
    
    // Recent data
    recentBills,
    recentPayments,
    
    // Revenue breakdown by source (from Revenue table)
    revenueBySource,
    
    // Expense breakdown by category
    expenseByCategory,
    
    // Purchase expenses by month
    purchaseExpensesByMonth,
  ] = await Promise.all([
    // Revenue aggregations (from paid bills)
    (prisma as any).bill.aggregate({
      where: { hospitalId, status: "PAID", paidAt: { gte: todayStart } },
      _sum: { total: true },
    }),
    (prisma as any).bill.aggregate({
      where: { hospitalId, status: "PAID", paidAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    (prisma as any).bill.aggregate({
      where: { hospitalId, status: "PAID", paidAt: { gte: yearStart } },
      _sum: { total: true },
    }),
    
    // Manual revenue entries aggregations (exclude auto-logged billing entries)
    (prisma as any).revenue.aggregate({
      where: { hospitalId, referenceId: null, createdAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    (prisma as any).revenue.aggregate({
      where: { hospitalId, referenceId: null, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    (prisma as any).revenue.aggregate({
      where: { hospitalId, referenceId: null, createdAt: { gte: yearStart } },
      _sum: { amount: true },
    }),
    
    // Bill counts
    (prisma as any).bill.count({ where: { hospitalId, status: "PENDING" } }),
    (prisma as any).bill.count({ where: { hospitalId, status: "PAID" } }),
    (prisma as any).bill.count({ where: { hospitalId, status: "PARTIALLY_PAID" } }),
    (prisma as any).bill.count({ where: { hospitalId } }),
    
    // Expenses from Expense table
    (prisma as any).expense.aggregate({
      where: { hospitalId, date: { gte: todayStart } },
      _sum: { amount: true },
    }),
    (prisma as any).expense.aggregate({
      where: { hospitalId, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    (prisma as any).expense.aggregate({
      where: { hospitalId, date: { gte: yearStart } },
      _sum: { amount: true },
    }),
    
    // Expenses from Inventory Purchases
    (prisma as any).purchase?.aggregate({
      where: { hospitalId, createdAt: { gte: todayStart } },
      _sum: { totalAmount: true },
    }).catch(() => ({ _sum: { totalAmount: 0 } })) || Promise.resolve({ _sum: { totalAmount: 0 } }),
    (prisma as any).purchase?.aggregate({
      where: { hospitalId, createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    }).catch(() => ({ _sum: { totalAmount: 0 } })) || Promise.resolve({ _sum: { totalAmount: 0 } }),
    (prisma as any).purchase?.aggregate({
      where: { hospitalId, createdAt: { gte: yearStart } },
      _sum: { totalAmount: true },
    }).catch(() => ({ _sum: { totalAmount: 0 } })) || Promise.resolve({ _sum: { totalAmount: 0 } }),
    
    // Recent bills
    (prisma as any).bill.findMany({
      where: { hospitalId },
      include: { patient: { select: { name: true, patientId: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    
    // Recent payments
    (prisma as any).payment.findMany({
      where: { hospitalId },
      include: {
        bill: {
          select: {
            billNo: true,
            patient: { select: { name: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 10,
    }),
    
    // Revenue by source (from Revenue table)
    (prisma as any).revenue.groupBy({
      by: ["sourceType"],
      where: { hospitalId, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    
    // Expense by category (from Expense table only - this month)
    (prisma as any).expense.groupBy({
      by: ["category"],
      where: { hospitalId, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    
    // Purchase expenses grouped (this month)
    (prisma as any).purchase.findMany({
      where: { hospitalId, createdAt: { gte: monthStart } },
      select: { totalAmount: true, createdAt: true, purchaseNo: true },
    }),
  ]);

  // Calculate total expenses (Expense table + Inventory purchases)
  const todayExpenseTotal = (todayExpenseFromTable._sum.amount || 0) + (todayPurchases._sum.totalAmount || 0);
  const monthExpenseTotal = (monthExpenseFromTable._sum.amount || 0) + (monthPurchases._sum.totalAmount || 0);
  const yearExpenseTotal = (yearExpenseFromTable._sum.amount || 0) + (yearPurchases._sum.totalAmount || 0);

  // Combine billing revenue + manual revenue entries
  const todayRevenueTotal = (todayRevenue._sum.total || 0) + (todayManualRevenue._sum.amount || 0);
  const monthRevenueTotal = (monthRevenue._sum.total || 0) + (monthManualRevenue._sum.amount || 0);
  const yearRevenueTotal = (yearRevenue._sum.total || 0) + (yearManualRevenue._sum.amount || 0);
  
  const profit = monthRevenueTotal - monthExpenseTotal;

  // Add MEDICINE category for inventory purchases to expense breakdown
  const inventoryPurchaseTotal = monthPurchases._sum.totalAmount || 0;
  const expenseCategoryBreakdown = [...expenseByCategory];
  
  if (inventoryPurchaseTotal > 0) {
    expenseCategoryBreakdown.push({
      category: "MEDICINE",
      _sum: { amount: inventoryPurchaseTotal },
    });
  }

  return {
    revenue: {
      today: todayRevenueTotal,
      month: monthRevenueTotal,
      year: yearRevenueTotal,
      profit,
    },
    bills: {
      pending: pendingBills,
      paid: paidBills,
      partial: partialBills,
      total: totalBills,
    },
    expenses: {
      today: todayExpenseTotal,
      month: monthExpenseTotal,
      year: yearExpenseTotal,
      breakdown: {
        fromExpenseTable: monthExpenseFromTable._sum.amount || 0,
        fromInventoryPurchases: inventoryPurchaseTotal,
      },
    },
    recentBills,
    recentPayments,
    revenueBySource,
    expenseByCategory: expenseCategoryBreakdown,
  };
}

/**
 * Get detailed revenue statistics
 */
export async function getRevenueStats(
  hospitalId: string,
  opts: { dateFrom?: string; dateTo?: string; groupBy?: "day" | "month" | "source" }
): Promise<any> {
  const where: any = { hospitalId };
  
  if (opts.dateFrom || opts.dateTo) {
    where.createdAt = {};
    if (opts.dateFrom) where.createdAt.gte = new Date(opts.dateFrom);
    if (opts.dateTo) where.createdAt.lte = new Date(opts.dateTo + "T23:59:59");
  }

  const [revenues, total, bySource] = await Promise.all([
    (prisma as any).revenue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    (prisma as any).revenue.aggregate({
      where,
      _sum: { amount: true },
    }),
    (prisma as any).revenue.groupBy({
      by: ["sourceType"],
      where,
      _sum: { amount: true },
    }),
  ]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayTotal, monthTotal] = await Promise.all([
    (prisma as any).revenue.aggregate({
      where: { hospitalId, createdAt: { gte: todayStart } },
      _sum: { amount: true },
    }),
    (prisma as any).revenue.aggregate({
      where: { hospitalId, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
  ]);

  return {
    revenues,
    stats: {
      total: total._sum.amount || 0,
      today: todayTotal._sum.amount || 0,
      month: monthTotal._sum.amount || 0,
      bySource,
    },
  };
}

/**
 * Get detailed expense statistics including inventory purchases
 */
export async function getExpenseStats(
  hospitalId: string,
  opts: { dateFrom?: string; dateTo?: string }
): Promise<any> {
  const where: any = { hospitalId };
  const purchaseWhere: any = { hospitalId };
  
  if (opts.dateFrom || opts.dateTo) {
    where.date = {};
    purchaseWhere.createdAt = {};
    if (opts.dateFrom) {
      where.date.gte = new Date(opts.dateFrom);
      purchaseWhere.createdAt.gte = new Date(opts.dateFrom);
    }
    if (opts.dateTo) {
      where.date.lte = new Date(opts.dateTo + "T23:59:59");
      purchaseWhere.createdAt.lte = new Date(opts.dateTo + "T23:59:59");
    }
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    expenses,
    expenseTotal,
    expenseByCategory,
    todayExpense,
    monthExpense,
    purchases,
    purchaseTotal,
    todayPurchase,
    monthPurchase,
  ] = await Promise.all([
    // Expenses from Expense table
    (prisma as any).expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: 50,
    }),
    (prisma as any).expense.aggregate({
      where,
      _sum: { amount: true },
    }),
    (prisma as any).expense.groupBy({
      by: ["category"],
      where,
      _sum: { amount: true },
    }),
    (prisma as any).expense.aggregate({
      where: { hospitalId, date: { gte: todayStart } },
      _sum: { amount: true },
    }),
    (prisma as any).expense.aggregate({
      where: { hospitalId, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    
    // Inventory purchases
    (prisma as any).purchase?.findMany({
      where: purchaseWhere,
      include: {
        supplier: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []) || Promise.resolve([]),
    (prisma as any).purchase?.aggregate({
      where: purchaseWhere,
      _sum: { totalAmount: true },
    }).catch(() => ({ _sum: { totalAmount: 0 } })) || Promise.resolve({ _sum: { totalAmount: 0 } }),
    (prisma as any).purchase?.aggregate({
      where: { hospitalId, createdAt: { gte: todayStart } },
      _sum: { totalAmount: true },
    }).catch(() => ({ _sum: { totalAmount: 0 } })) || Promise.resolve({ _sum: { totalAmount: 0 } }),
    (prisma as any).purchase?.aggregate({
      where: { hospitalId, createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    }).catch(() => ({ _sum: { totalAmount: 0 } })) || Promise.resolve({ _sum: { totalAmount: 0 } }),
  ]);

  const totalExpenseAmount = (expenseTotal._sum.amount || 0) + (purchaseTotal._sum.totalAmount || 0);
  const todayExpenseAmount = (todayExpense._sum.amount || 0) + (todayPurchase._sum.totalAmount || 0);
  const monthExpenseAmount = (monthExpense._sum.amount || 0) + (monthPurchase._sum.totalAmount || 0);

  // Add inventory purchases to category breakdown
  const categoryBreakdown = [...expenseByCategory];
  if (purchaseTotal._sum.totalAmount && purchaseTotal._sum.totalAmount > 0) {
    categoryBreakdown.push({
      category: "MEDICINE",
      _sum: { amount: purchaseTotal._sum.totalAmount },
    });
  }

  return {
    expenses,
    purchases,
    stats: {
      total: totalExpenseAmount,
      today: todayExpenseAmount,
      month: monthExpenseAmount,
      fromExpenseTable: expenseTotal._sum.amount || 0,
      fromInventoryPurchases: purchaseTotal._sum.totalAmount || 0,
      categoryBreakdown,
    },
  };
}

/**
 * Get finance department info
 */
export async function getFinanceDept(hospitalId: string): Promise<any> {
  return (prisma as any).financeDepartment.findUnique({ where: { hospitalId } });
}

/**
 * Upsert finance department
 */
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
