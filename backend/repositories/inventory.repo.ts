import prisma from "../config/db";
import { Prisma } from "@prisma/client";

// --- Items ---
export const createInventoryItem = async (data: Prisma.InventoryItemUncheckedCreateInput) => {
  return prisma.inventoryItem.create({ data });
};

export const updateInventoryItem = async (id: string, hospitalId: string, data: Prisma.InventoryItemUncheckedUpdateInput) => {
  return prisma.inventoryItem.update({ where: { id, hospitalId }, data });
};

export const deleteInventoryItem = async (id: string, hospitalId: string) => {
  return prisma.inventoryItem.delete({ where: { id, hospitalId } });
};

export const findInventoryItemById = async (id: string, hospitalId: string) => {
  return prisma.inventoryItem.findFirst({
    where: { id, hospitalId },
    include: {
      batches: {
        where: { remainingQty: { gt: 0 } },
        orderBy: { expiryDate: "asc" }
      }
    }
  });
};

export const findAllInventoryItems = async (params: {
  hospitalId: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { hospitalId, category, search, page = 1, limit = 10 } = params;
  const where: Prisma.InventoryItemWhereInput = {
    hospitalId,
    ...(category ? { category } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } }
      ]
    } : {})
  };

  const [data, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      include: {
        batches: {
          select: { remainingQty: true, expiryDate: true }
        }
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.inventoryItem.count({ where })
  ]);

  return {
    data: data.map(item => ({
      ...item,
      totalStock: item.batches.reduce((sum, b) => sum + b.remainingQty, 0)
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// --- Suppliers ---
export const createSupplier = async (data: Prisma.SupplierUncheckedCreateInput) => {
  if (!prisma.supplier) {
    console.error("Prisma supplier model is undefined. Available models:", Object.keys(prisma).filter(k => !k.startsWith('_')));
    throw new Error("Internal Server Error: Supplier model not initialized in database client.");
  }
  return prisma.supplier.create({ data });
};

export const updateSupplier = async (id: string, hospitalId: string, data: Prisma.SupplierUncheckedUpdateInput) => {
  return prisma.supplier.update({ where: { id, hospitalId }, data });
};

export const findAllSuppliers = async (hospitalId: string) => {
  return prisma.supplier.findMany({ where: { hospitalId, isActive: true }, orderBy: { name: "asc" } });
};

export const findSupplierById = async (id: string, hospitalId: string) => {
  return prisma.supplier.findFirst({ where: { id, hospitalId } });
};

export const softDeleteSupplier = async (id: string, hospitalId: string) => {
  return prisma.supplier.update({ where: { id, hospitalId }, data: { isActive: false } });
};

// --- Purchases ---
export const createPurchase = async (data: any, items: any[]) => {
  return (prisma as any).$transaction(async (tx: any) => {
    // 1. Create Purchase
    const purchase = await tx.purchase.create({ data });

    // 2. Create Purchase Items & Stock Batches & Movements
    for (const item of items) {
      await tx.purchaseItem.create({
        data: {
          hospitalId: data.hospitalId,
          purchaseId: purchase.id,
          itemId: item.itemId,
          quantity: item.quantity,
          price: item.price,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
        }
      });

      const batch = await tx.stockBatch.create({
        data: {
          hospitalId: data.hospitalId,
          itemId: item.itemId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          remainingQty: item.quantity,
          purchasePrice: item.price,
          sellingPrice: item.sellingPrice,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          supplierId: data.supplierId
        }
      });

      await tx.stockMovement.create({
        data: {
          hospitalId: data.hospitalId,
          itemId: item.itemId,
          batchId: batch.id,
          type: "IN",
          quantity: item.quantity,
          source: "Purchase",
          referenceId: purchase.id,
          notes: `Purchase Order: ${purchase.purchaseNo}`
        }
      });
    }

    return purchase;
  });
};

export const findAllPurchases = async (hospitalId: string, paymentStatus?: string) => {
  const where: any = { hospitalId };
  if (paymentStatus) where.paymentStatus = paymentStatus;
  return (prisma as any).purchase.findMany({
    where,
    include: {
      supplier: { select: { name: true, phone: true, email: true, gstNumber: true, address1: true, city: true, state: true } },
      subDepartment: { select: { id: true, name: true, type: true } },
      items: { include: { item: { select: { id: true, name: true, unit: true, category: true } } } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" }
  });
};

export const findDueReminders = async (hospitalId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (prisma as any).purchase.findMany({
    where: {
      hospitalId,
      paymentStatus: { in: ["PENDING", "PARTIAL"] },
      dueDate: { lte: tomorrow },
    },
    include: { supplier: { select: { name: true, phone: true, email: true } }, _count: { select: { items: true } } },
    orderBy: { dueDate: "asc" }
  });
};

export const findPurchaseById = async (id: string, hospitalId: string) => {
  return (prisma as any).purchase.findFirst({
    where: { id, hospitalId },
    include: {
      supplier: { select: { id: true, name: true, phone: true, email: true, gstNumber: true, address1: true, city: true, state: true, pincode: true, contactPerson: true } },
      subDepartment: { select: { id: true, name: true, type: true } },
      items: { include: { item: { select: { id: true, name: true, unit: true, category: true, hsnCode: true } } } },
      hospital: { select: { name: true, mobile: true, email: true } },
    },
  });
};

export const updatePurchase = async (id: string, hospitalId: string, data: any) => {
  return (prisma as any).purchase.update({ where: { id, hospitalId }, data });
};

// --- Stock Movements & FIFO Logic ---
export const deductStockFIFO = async (params: {
  hospitalId: string;
  itemId: string;
  quantity: number;
  source: string;
  referenceId?: string;
  performedBy?: string;
}) => {
  const { hospitalId, itemId, quantity, source, referenceId, performedBy } = params;

  return prisma.$transaction(async (tx) => {
    // 1. Find available batches ordered by expiry (FIFO)
    const batches = await tx.stockBatch.findMany({
      where: { hospitalId, itemId, remainingQty: { gt: 0 } },
      orderBy: [
        { expiryDate: "asc" }, // Use closest expiry first
        { createdAt: "asc" }  // Then oldest first
      ]
    });

    const totalAvailable = batches.reduce((sum, b) => sum + b.remainingQty, 0);
    if (totalAvailable < quantity) {
      throw new Error(`Insufficient stock for item ID: ${itemId}. Available: ${totalAvailable}, Requested: ${quantity}`);
    }

    let remainingToDeduct = quantity;
    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;

      const deductFromThisBatch = Math.min(batch.remainingQty, remainingToDeduct);
      
      // Update batch
      await tx.stockBatch.update({
        where: { id: batch.id },
        data: { remainingQty: { decrement: deductFromThisBatch } }
      });

      // Create movement
      await tx.stockMovement.create({
        data: {
          hospitalId,
          itemId,
          batchId: batch.id,
          type: "OUT",
          quantity: deductFromThisBatch,
          source,
          referenceId,
          performedBy
        }
      });

      remainingToDeduct -= deductFromThisBatch;
    }

    return { success: true };
  });
};

export const getStockMovements = async (hospitalId: string, itemId?: string) => {
  return prisma.stockMovement.findMany({
    where: { hospitalId, ...(itemId ? { itemId } : {}) },
    include: { item: { select: { name: true } }, batch: { select: { batchNumber: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
};

export const getInventoryAlerts = async (hospitalId: string) => {
  // 1. Low stock items
  const items = await prisma.inventoryItem.findMany({
    where: { hospitalId, isActive: true },
    include: { batches: { select: { remainingQty: true } } }
  });

  const lowStock = items.filter(item => {
    const total = item.batches.reduce((sum, b) => sum + b.remainingQty, 0);
    return total <= item.minStock;
  });

  // 2. Expiring soon (within 30 days)
  const expiringSoon = await prisma.stockBatch.findMany({
    where: {
      hospitalId,
      remainingQty: { gt: 0 },
      expiryDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        gt: new Date()
      }
    },
    include: { item: { select: { name: true } } }
  });

  return { lowStock, expiringSoon };
};
