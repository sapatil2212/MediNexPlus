import { NextRequest } from "next/server";
import { requireHospitalAdmin, requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { notify } from "../../../../../backend/services/notification.service";
import prisma from "../../../../../backend/config/db";

const INV_READ_ROLES = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"];

// GET /api/inventory/low-stock — list items at or below minStock/reorderLevel
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, INV_READ_ROLES);
  if (auth.error) return auth.error;

  const items = await prisma.inventoryItem.findMany({
    where: { hospitalId: auth.hospitalId, isActive: true },
    include: {
      batches: { where: { remainingQty: { gt: 0 } }, select: { remainingQty: true } },
    },
  });

  const lowStock = items
    .map(item => {
      const currentStock = item.batches.reduce((s, b) => s + b.remainingQty, 0);
      const threshold = item.reorderLevel ?? item.minStock;
      return { ...item, currentStock, threshold, batches: undefined };
    })
    .filter(item => item.currentStock <= item.threshold)
    .sort((a, b) => a.currentStock - b.currentStock);

  return successResponse(
    { items: lowStock, count: lowStock.length },
    `${lowStock.length} item(s) at or below reorder level`
  );
}

// POST /api/inventory/low-stock — send notifications for low-stock items
export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  const items = await prisma.inventoryItem.findMany({
    where: { hospitalId: auth.hospitalId, isActive: true },
    include: {
      batches: { where: { remainingQty: { gt: 0 } }, select: { remainingQty: true } },
    },
  });

  const lowStock = items
    .map(item => {
      const currentStock = item.batches.reduce((s, b) => s + b.remainingQty, 0);
      const threshold = item.reorderLevel ?? item.minStock;
      return { ...item, currentStock, threshold };
    })
    .filter(item => item.currentStock <= item.threshold);

  let fired = 0;
  for (const item of lowStock) {
    try {
      const critical = item.currentStock === 0;
      await notify({
        hospitalId: auth.hospitalId,
        type: "LOW_STOCK",
        title: critical
          ? `Out of Stock: ${item.name}`
          : `Low Stock Alert: ${item.name}`,
        message: critical
          ? `${item.name} (${item.category}) is completely out of stock. Immediate reorder required.`
          : `${item.name} (${item.category}) has only ${item.currentStock} ${item.unit} remaining (threshold: ${item.threshold}).${item.reorderQty ? ` Suggested reorder qty: ${item.reorderQty}.` : ""}`,
        targetRole: "HOSPITAL_ADMIN",
        metadata: {
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          currentStock: item.currentStock,
          threshold: item.threshold,
          unit: item.unit,
        },
      });
      fired++;
    } catch { /* continue */ }
  }

  return successResponse(
    { fired, total: lowStock.length },
    `Sent ${fired} low-stock notification(s)`
  );
}
