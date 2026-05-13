import prisma from "../config/db";

const db = prisma as any;

// ─── Stock Locations ───
export const createLocation = async (data: any) => {
  return db.stockLocation.create({ data });
};

export const updateLocation = async (id: string, hospitalId: string, data: any) => {
  return db.stockLocation.update({ where: { id, hospitalId }, data });
};

export const getLocations = async (hospitalId: string) => {
  return db.stockLocation.findMany({
    where: { hospitalId },
    include: {
      subDepartment: { select: { id: true, name: true, type: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};

export const getLocationById = async (id: string, hospitalId: string) => {
  return db.stockLocation.findFirst({
    where: { id, hospitalId },
    include: {
      subDepartment: { select: { id: true, name: true, type: true } },
      department: { select: { id: true, name: true } },
    },
  });
};

export const deleteLocation = async (id: string, hospitalId: string) => {
  return db.stockLocation.delete({ where: { id, hospitalId } });
};

export const ensureCentralLocation = async (hospitalId: string) => {
  const existing = await db.stockLocation.findFirst({
    where: { hospitalId, type: "CENTRAL" },
  });
  if (existing) return existing;
  return db.stockLocation.create({
    data: {
      hospitalId,
      name: "Central Store",
      code: "CENTRAL",
      type: "CENTRAL",
    },
  });
};

// ─── Ensure Department Location ───
export const ensureDeptLocation = async (hospitalId: string, subDepartmentId: string, subDeptName: string) => {
  const existing = await db.stockLocation.findFirst({
    where: { hospitalId, subDepartmentId, isActive: true },
  });
  if (existing) return existing;
  return db.stockLocation.create({
    data: {
      hospitalId,
      name: `${subDeptName} Store`,
      code: subDeptName.toUpperCase().replace(/\s+/g, "_").slice(0, 20),
      type: "DEPARTMENT",
      subDepartmentId,
    },
  });
};

// ─── Stock Transfers ───
export const generateTransferNo = async (hospitalId: string) => {
  const count = await db.stockTransfer.count({ where: { hospitalId } });
  return `TRF-${String(count + 1).padStart(4, "0")}`;
};

export const createTransfer = async (data: any, items: any[]) => {
  return prisma.$transaction(async (tx: any) => {
    const transfer = await tx.stockTransfer.create({ data });

    for (const item of items) {
      await tx.stockTransferItem.create({
        data: {
          hospitalId: data.hospitalId,
          transferId: transfer.id,
          itemId: item.itemId,
          batchId: item.batchId || null,
          quantity: item.quantity,
          notes: item.notes || null,
        },
      });
    }

    return transfer;
  });
};

export const getTransfers = async (params: {
  hospitalId: string;
  status?: string;
  fromLocationId?: string;
  toLocationId?: string;
  page?: number;
  limit?: number;
}) => {
  const { hospitalId, status, fromLocationId, toLocationId, page = 1, limit = 20 } = params;
  const where: any = {
    hospitalId,
    ...(status ? { status } : {}),
    ...(fromLocationId ? { fromLocationId } : {}),
    ...(toLocationId ? { toLocationId } : {}),
  };

  const [data, total] = await Promise.all([
    db.stockTransfer.findMany({
      where,
      include: {
        fromLocation: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, category: true, unit: true, purchasePrice: true, mrp: true, sellingPrice: true } },
            batch: { select: { id: true, batchNumber: true, expiryDate: true, remainingQty: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.stockTransfer.count({ where }),
  ]);

  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getTransferById = async (id: string, hospitalId: string) => {
  return db.stockTransfer.findFirst({
    where: { id, hospitalId },
    include: {
      fromLocation: { select: { id: true, name: true, code: true } },
      toLocation: { select: { id: true, name: true, code: true } },
      items: {
        include: {
          item: { select: { id: true, name: true, category: true, unit: true, purchasePrice: true, mrp: true, sellingPrice: true } },
          batch: { select: { id: true, batchNumber: true, expiryDate: true, remainingQty: true } },
        },
      },
    },
  });
};

export const updateTransferItems = async (
  id: string,
  hospitalId: string,
  updatedItems: { transferItemId: string; newQty: number }[],
  updatedBy: string
) => {
  return prisma.$transaction(async (tx: any) => {
    const transfer = await tx.stockTransfer.findFirst({
      where: { id, hospitalId },
      include: { items: { include: { item: true } } },
    });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "COMPLETED") throw new Error("Only completed transfers can be edited");

    for (const upd of updatedItems) {
      const tItem = transfer.items.find((ti: any) => ti.id === upd.transferItemId);
      if (!tItem) continue;

      const diff = upd.newQty - tItem.receivedQty;
      if (diff === 0) continue;

      if (diff > 0) {
        // Increasing qty — need to deduct more from central batches (FEFO)
        const batches = await tx.stockBatch.findMany({
          where: { hospitalId, itemId: tItem.itemId, remainingQty: { gt: 0 } },
          orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
        });
        const totalAvail = batches.reduce((s: number, b: any) => s + b.remainingQty, 0);
        if (totalAvail < diff) throw new Error(`Insufficient stock for ${tItem.item.name}. Available: ${totalAvail}, Need: ${diff}`);

        let remaining = diff;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.remainingQty, remaining);
          await tx.stockBatch.update({ where: { id: batch.id }, data: { remainingQty: { decrement: deduct } } });
          await tx.stockMovement.create({
            data: {
              hospitalId, itemId: tItem.itemId, batchId: batch.id,
              type: "TRANSFER_OUT", quantity: deduct, source: "StockTransfer",
              referenceId: transfer.id, notes: `Edit ${transfer.transferNo}: +${diff} ${tItem.item.name}`,
              performedBy: updatedBy,
            },
          });
          remaining -= deduct;
        }
      } else {
        // Decreasing qty — restore stock to central batches
        const absReturn = Math.abs(diff);
        // Find the original TRANSFER_OUT movements to know which batches to restore
        const outMovements = await tx.stockMovement.findMany({
          where: { hospitalId, referenceId: transfer.id, type: "TRANSFER_OUT", itemId: tItem.itemId },
          orderBy: { createdAt: "desc" },
        });

        let toRestore = absReturn;
        for (const mov of outMovements) {
          if (toRestore <= 0) break;
          const restore = Math.min(mov.quantity, toRestore);
          if (mov.batchId) {
            await tx.stockBatch.update({ where: { id: mov.batchId }, data: { remainingQty: { increment: restore } } });
          }
          await tx.stockMovement.create({
            data: {
              hospitalId, itemId: tItem.itemId, batchId: mov.batchId,
              type: "TRANSFER_REVERSAL", quantity: restore, source: "StockTransfer",
              referenceId: transfer.id, notes: `Edit ${transfer.transferNo}: -${absReturn} ${tItem.item.name}`,
              performedBy: updatedBy,
            },
          });
          toRestore -= restore;
        }
      }

      // Update the transfer item record
      await tx.stockTransferItem.update({
        where: { id: tItem.id },
        data: { quantity: upd.newQty, receivedQty: upd.newQty },
      });
    }

    return tx.stockTransfer.findFirst({
      where: { id },
      include: {
        fromLocation: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, category: true, unit: true, purchasePrice: true, mrp: true, sellingPrice: true } },
            batch: { select: { id: true, batchNumber: true, expiryDate: true, remainingQty: true } },
          },
        },
      },
    });
  });
};

export const approveTransfer = async (id: string, hospitalId: string, approvedBy: string) => {
  return prisma.$transaction(async (tx: any) => {
    const transfer = await tx.stockTransfer.findFirst({
      where: { id, hospitalId, status: "PENDING" },
      include: { items: { include: { batch: true, item: true } } },
    });
    if (!transfer) throw new Error("Transfer not found or already processed");

    // Deduct stock from source (FEFO) for each item
    for (const tItem of transfer.items) {
      if (tItem.batchId) {
        // Specific batch transfer
        const batch = await tx.stockBatch.findFirst({
          where: { id: tItem.batchId, hospitalId, remainingQty: { gte: tItem.quantity } },
        });
        if (!batch) throw new Error(`Insufficient stock in batch for ${tItem.item.name}`);

        await tx.stockBatch.update({
          where: { id: tItem.batchId },
          data: { remainingQty: { decrement: tItem.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            hospitalId,
            itemId: tItem.itemId,
            batchId: tItem.batchId,
            type: "TRANSFER_OUT",
            quantity: tItem.quantity,
            source: "StockTransfer",
            referenceId: transfer.id,
            notes: `Transfer ${transfer.transferNo} → ${transfer.toLocationId}`,
            performedBy: approvedBy,
          },
        });
      } else {
        // FEFO deduction across batches
        const batches = await tx.stockBatch.findMany({
          where: { hospitalId, itemId: tItem.itemId, remainingQty: { gt: 0 } },
          orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
        });

        let remaining = tItem.quantity;
        const totalAvail = batches.reduce((s: number, b: any) => s + b.remainingQty, 0);
        if (totalAvail < remaining) throw new Error(`Insufficient stock for ${tItem.item.name}. Available: ${totalAvail}, Requested: ${remaining}`);

        for (const batch of batches) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.remainingQty, remaining);

          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { remainingQty: { decrement: deduct } },
          });

          await tx.stockMovement.create({
            data: {
              hospitalId,
              itemId: tItem.itemId,
              batchId: batch.id,
              type: "TRANSFER_OUT",
              quantity: deduct,
              source: "StockTransfer",
              referenceId: transfer.id,
              notes: `Transfer ${transfer.transferNo}`,
              performedBy: approvedBy,
            },
          });

          remaining -= deduct;
        }
      }

      // Record TRANSFER_IN movement at destination
      await tx.stockMovement.create({
        data: {
          hospitalId,
          itemId: tItem.itemId,
          batchId: tItem.batchId || null,
          type: "TRANSFER_IN",
          quantity: tItem.quantity,
          source: "StockTransfer",
          referenceId: transfer.id,
          notes: `Received via ${transfer.transferNo}`,
          performedBy: approvedBy,
        },
      });

      // Update received qty
      await tx.stockTransferItem.update({
        where: { id: tItem.id },
        data: { receivedQty: tItem.quantity },
      });
    }

    // Mark transfer as completed
    return tx.stockTransfer.update({
      where: { id },
      data: {
        status: "COMPLETED",
        approvedBy,
        transferredAt: new Date(),
      },
    });
  }, { timeout: 30000, maxWait: 10000 });
};

export const rejectTransfer = async (id: string, hospitalId: string, approvedBy: string) => {
  return db.stockTransfer.update({
    where: { id, hospitalId },
    data: { status: "REJECTED", approvedBy },
  });
};

export const cancelTransfer = async (id: string, hospitalId: string, cancelledBy: string) => {
  return prisma.$transaction(async (tx: any) => {
    const transfer = await tx.stockTransfer.findFirst({
      where: { id, hospitalId },
      include: { items: { include: { item: true } } },
    });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status === "CANCELLED") throw new Error("Transfer already cancelled");

    // If completed, reverse stock movements — restore batch quantities
    if (transfer.status === "COMPLETED") {
      // Find the TRANSFER_OUT movements for this transfer
      const outMovements = await tx.stockMovement.findMany({
        where: { hospitalId, referenceId: transfer.id, type: "TRANSFER_OUT", source: "StockTransfer" },
      });

      // Restore batch quantities
      for (const mov of outMovements) {
        if (mov.batchId) {
          await tx.stockBatch.update({
            where: { id: mov.batchId },
            data: { remainingQty: { increment: mov.quantity } },
          });
        }
        // Record reversal movement
        await tx.stockMovement.create({
          data: {
            hospitalId,
            itemId: mov.itemId,
            batchId: mov.batchId,
            type: "TRANSFER_REVERSAL",
            quantity: mov.quantity,
            source: "StockTransfer",
            referenceId: transfer.id,
            notes: `Cancelled transfer ${transfer.transferNo}`,
            performedBy: cancelledBy,
          },
        });
      }
    }

    return tx.stockTransfer.update({
      where: { id },
      data: { status: "CANCELLED", approvedBy: cancelledBy },
    });
  });
};

// ─── Stock Returns ───
export const generateReturnNo = async (hospitalId: string) => {
  const count = await db.stockReturn.count({ where: { hospitalId } });
  return `RET-${String(count + 1).padStart(4, "0")}`;
};

export const createReturn = async (data: any) => {
  return db.stockReturn.create({ data });
};

export const getReturns = async (params: {
  hospitalId: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { hospitalId, status, page = 1, limit = 20 } = params;
  const where: any = { hospitalId, ...(status ? { status } : {}) };

  const [data, total] = await Promise.all([
    db.stockReturn.findMany({
      where,
      include: {
        fromLocation: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
        item: { select: { id: true, name: true, category: true, unit: true } },
        batch: { select: { id: true, batchNumber: true, expiryDate: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.stockReturn.count({ where }),
  ]);

  return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const approveReturn = async (id: string, hospitalId: string, approvedBy: string) => {
  return prisma.$transaction(async (tx: any) => {
    const ret = await tx.stockReturn.findFirst({
      where: { id, hospitalId, status: "PENDING" },
      include: { item: true },
    });
    if (!ret) throw new Error("Return not found or already processed");

    // Add stock back to destination (central store)
    // Find or create batch
    if (ret.batchId) {
      await tx.stockBatch.update({
        where: { id: ret.batchId },
        data: { remainingQty: { increment: ret.quantity } },
      });
    }

    // Create movement records
    await tx.stockMovement.create({
      data: {
        hospitalId,
        itemId: ret.itemId,
        batchId: ret.batchId,
        type: "RETURN_IN",
        quantity: ret.quantity,
        source: "StockReturn",
        referenceId: ret.id,
        notes: `Return ${ret.returnNo}: ${ret.type} - ${ret.reason || ""}`,
        performedBy: approvedBy,
      },
    });

    return tx.stockReturn.update({
      where: { id },
      data: { status: "COMPLETED", approvedBy, returnedAt: new Date() },
    });
  });
};

export const rejectReturn = async (id: string, hospitalId: string, approvedBy: string) => {
  return db.stockReturn.update({
    where: { id, hospitalId },
    data: { status: "REJECTED", approvedBy },
  });
};

// ─── Department-wise Stock ───
export const getDeptWiseStock = async (hospitalId: string) => {
  // Get all department locations (exclude CENTRAL)
  const locations = await db.stockLocation.findMany({
    where: { hospitalId, isActive: true, type: { not: "CENTRAL" } },
    include: {
      subDepartment: { select: { id: true, name: true, type: true } },
      department: { select: { id: true, name: true } },
    },
  });

  // Get all completed transfers with item details + prices
  const transfers = await db.stockTransfer.findMany({
    where: { hospitalId, status: "COMPLETED" },
    include: {
      items: {
        include: {
          item: { select: { id: true, name: true, category: true, unit: true, purchasePrice: true, mrp: true, sellingPrice: true } },
        },
      },
      toLocation: { select: { id: true, name: true } },
    },
  });

  // Get completed returns
  const returns = await db.stockReturn.findMany({
    where: { hospitalId, status: "COMPLETED" },
    select: { fromLocationId: true, itemId: true, quantity: true },
  });

  // Build location-wise stock summary
  const locationStock: any[] = [];
  for (const loc of locations) {
    const inItems: Record<string, { itemName: string; category: string; unit: string; quantity: number; purchasePrice: number; sellingPrice: number }> = {};

    for (const t of transfers) {
      if (t.toLocation.id === loc.id) {
        for (const ti of t.items) {
          if (!inItems[ti.itemId]) {
            inItems[ti.itemId] = {
              itemName: ti.item.name,
              category: ti.item.category,
              unit: ti.item.unit,
              quantity: 0,
              purchasePrice: ti.item.purchasePrice || 0,
              sellingPrice: ti.item.sellingPrice || ti.item.mrp || 0,
            };
          }
          inItems[ti.itemId].quantity += ti.receivedQty;
        }
      }
    }

    // Subtract returned quantities
    for (const r of returns) {
      if (r.fromLocationId === loc.id && inItems[r.itemId]) {
        inItems[r.itemId].quantity -= r.quantity;
      }
    }

    const items = Object.entries(inItems)
      .map(([itemId, info]) => ({
        itemId,
        ...info,
        value: info.quantity * info.purchasePrice,
      }))
      .filter(i => i.quantity > 0);

    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    const totalValue = items.reduce((s, i) => s + i.value, 0);

    locationStock.push({
      name: loc.subDepartment?.name || loc.department?.name || loc.name,
      locationId: loc.id,
      subDepartmentId: loc.subDepartmentId,
      type: loc.subDepartment?.type || loc.type,
      items,
      totalQty,
      totalValue,
    });
  }

  return locationStock;
};

// ─── Department-specific Stock (for dept dashboards) ───
export const getLocationForSubDept = async (hospitalId: string, subDepartmentId: string) => {
  return db.stockLocation.findFirst({
    where: { hospitalId, subDepartmentId, isActive: true },
  });
};

export const getLocationStockForDept = async (hospitalId: string, subDepartmentId: string) => {
  // 1. Find the location linked to this subdepartment
  const location = await db.stockLocation.findFirst({
    where: { hospitalId, subDepartmentId, isActive: true },
    include: {
      subDepartment: { select: { id: true, name: true, type: true } },
    },
  });

  if (!location) return { location: null, items: [], transfers: [], returns: [], stats: { totalItems: 0, totalQty: 0, totalValue: 0, pendingTransfers: 0, pendingReturns: 0 } };

  // 2. Get all completed transfers TO this location
  const completedTransfers = await db.stockTransfer.findMany({
    where: { hospitalId, toLocationId: location.id, status: "COMPLETED" },
    include: {
      items: {
        include: {
          item: {
            select: {
              id: true, name: true, category: true, unit: true,
              purchasePrice: true, mrp: true, sellingPrice: true, gst: true,
              minStock: true, isActive: true, genericName: true, brandName: true,
            },
          },
          batch: { select: { id: true, batchNumber: true, expiryDate: true, remainingQty: true } },
        },
      },
      fromLocation: { select: { id: true, name: true, code: true } },
    },
    orderBy: { transferredAt: "desc" },
  });

  // 3. Get all completed returns FROM this location (stock that went back)
  const completedReturns = await db.stockReturn.findMany({
    where: { hospitalId, fromLocationId: location.id, status: "COMPLETED" },
    include: {
      item: { select: { id: true, name: true } },
    },
  });

  // 4. Get pending transfers and returns for this location
  const [pendingTransfers, pendingReturns] = await Promise.all([
    db.stockTransfer.count({ where: { hospitalId, toLocationId: location.id, status: "PENDING" } }),
    db.stockReturn.count({ where: { hospitalId, fromLocationId: location.id, status: "PENDING" } }),
  ]);

  // 5. Aggregate item-wise stock: sum receivedQty from transfers, subtract returned qty
  const itemStock: Record<string, {
    itemId: string; name: string; genericName: string; brandName: string;
    category: string; unit: string; receivedQty: number; returnedQty: number;
    availableQty: number; purchasePrice: number; mrp: number; sellingPrice: number;
    gst: number; minStock: number; batches: any[];
    lastTransferDate: string | null;
  }> = {};

  for (const t of completedTransfers) {
    for (const ti of t.items) {
      const key = ti.itemId;
      if (!itemStock[key]) {
        itemStock[key] = {
          itemId: ti.itemId,
          name: ti.item.name,
          genericName: ti.item.genericName || "",
          brandName: ti.item.brandName || "",
          category: ti.item.category,
          unit: ti.item.unit,
          receivedQty: 0,
          returnedQty: 0,
          availableQty: 0,
          purchasePrice: ti.item.purchasePrice,
          mrp: ti.item.mrp,
          sellingPrice: ti.item.sellingPrice || ti.item.mrp,
          gst: ti.item.gst || 0,
          minStock: ti.item.minStock,
          batches: [],
          lastTransferDate: null,
        };
      }
      itemStock[key].receivedQty += ti.receivedQty;
      if (ti.batch) {
        const existingBatch = itemStock[key].batches.find((b: any) => b.id === ti.batch.id);
        if (!existingBatch) {
          itemStock[key].batches.push({ ...ti.batch, transferredQty: ti.receivedQty });
        } else {
          existingBatch.transferredQty += ti.receivedQty;
        }
      }
      if (!itemStock[key].lastTransferDate || (t.transferredAt && new Date(t.transferredAt) > new Date(itemStock[key].lastTransferDate!))) {
        itemStock[key].lastTransferDate = t.transferredAt?.toISOString() || null;
      }
    }
  }

  // Subtract returned quantities
  for (const r of completedReturns) {
    if (itemStock[r.itemId]) {
      itemStock[r.itemId].returnedQty += r.quantity;
    }
  }

  // Calculate available
  const items = Object.values(itemStock).map(item => ({
    ...item,
    availableQty: item.receivedQty - item.returnedQty,
    totalValue: (item.receivedQty - item.returnedQty) * item.purchasePrice,
  })).filter(item => item.availableQty > 0 || item.receivedQty > 0);

  // 6. Recent transfer history for this location
  const recentTransfers = completedTransfers.slice(0, 20).map((t: any) => ({
    id: t.id,
    transferNo: t.transferNo,
    fromLocation: t.fromLocation,
    transferredAt: t.transferredAt,
    itemCount: t.items.length,
    totalQty: t.items.reduce((s: number, ti: any) => s + ti.receivedQty, 0),
  }));

  const totalQty = items.reduce((s, i) => s + i.availableQty, 0);
  const totalValue = items.reduce((s, i) => s + i.totalValue, 0);

  return {
    location,
    items,
    transfers: recentTransfers,
    returns: completedReturns.slice(0, 10),
    stats: {
      totalItems: items.length,
      totalQty,
      totalValue,
      pendingTransfers,
      pendingReturns,
    },
  };
};

// ─── Reports ───
export const getInventoryReport = async (hospitalId: string) => {
  const [items, batches, purchases, movements, transfers, returns] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { hospitalId, isActive: true },
      include: { batches: { select: { remainingQty: true, purchasePrice: true, sellingPrice: true, expiryDate: true } } },
    }),
    prisma.stockBatch.findMany({
      where: { hospitalId, remainingQty: { gt: 0 } },
    }),
    prisma.purchase.findMany({
      where: { hospitalId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.stockMovement.findMany({
      where: { hospitalId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.stockTransfer.count({ where: { hospitalId } }),
    db.stockReturn.count({ where: { hospitalId } }),
  ]);

  // Calculate totals
  const totalItems = items.length;
  const totalStockValue = items.reduce((sum, item) => {
    const stock = item.batches.reduce((s, b) => s + b.remainingQty, 0);
    return sum + stock * item.purchasePrice;
  }, 0);
  const totalRetailValue = items.reduce((sum, item) => {
    const stock = item.batches.reduce((s, b) => s + b.remainingQty, 0);
    return sum + stock * (item.sellingPrice || item.mrp);
  }, 0);

  const lowStockCount = items.filter(item => {
    const stock = item.batches.reduce((s, b) => s + b.remainingQty, 0);
    return stock <= item.minStock;
  }).length;

  const expiringCount = batches.filter(b =>
    b.expiryDate && new Date(b.expiryDate) <= new Date(Date.now() + 30 * 86400000) && new Date(b.expiryDate) > new Date()
  ).length;

  const expiredCount = batches.filter(b =>
    b.expiryDate && new Date(b.expiryDate) <= new Date()
  ).length;

  // Category breakdown
  const categoryMap: Record<string, { count: number; value: number; stock: number }> = {};
  for (const item of items) {
    if (!categoryMap[item.category]) categoryMap[item.category] = { count: 0, value: 0, stock: 0 };
    const stock = item.batches.reduce((s, b) => s + b.remainingQty, 0);
    categoryMap[item.category].count++;
    categoryMap[item.category].value += stock * item.purchasePrice;
    categoryMap[item.category].stock += stock;
  }

  // Purchase total (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const recentPurchaseTotal = purchases
    .filter(p => new Date(p.createdAt) >= thirtyDaysAgo)
    .reduce((s, p) => s + p.totalAmount, 0);

  // Monthly consumption (OUT movements last 30 days)
  const recentOuts = movements.filter(
    (m: any) => m.type === "OUT" && new Date(m.createdAt) >= thirtyDaysAgo
  );
  const monthlyConsumption = recentOuts.reduce((s: number, m: any) => s + m.quantity, 0);

  return {
    totalItems,
    totalStockValue,
    totalRetailValue,
    lowStockCount,
    expiringCount,
    expiredCount,
    transfersCount: transfers,
    returnsCount: returns,
    recentPurchaseTotal,
    monthlyConsumption,
    categories: Object.entries(categoryMap).map(([name, data]) => ({ name, ...data })),
  };
};
