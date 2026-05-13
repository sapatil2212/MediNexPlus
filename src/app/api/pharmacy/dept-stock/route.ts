import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import { getLocationStockForDept } from "../../../../../backend/repositories/central-inventory.repo";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;

/**
 * GET /api/pharmacy/dept-stock
 * Returns stock available to a sub-department by merging:
 *  1. Stock received via admin quick-transfers (StockTransfer records)
 *  2. Stock received via their own completed Purchase Orders
 *
 * SUB_DEPT_HEAD  — auto-resolves their own subDepartmentId
 * HOSPITAL_ADMIN — requires ?subDepartmentId= query param
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    let subDepartmentId: string | null = null;

    if (auth.user.role === Role.SUB_DEPT_HEAD) {
      const subDept = await px.subDepartment.findFirst({
        where: { userId: auth.user.userId, hospitalId: auth.hospitalId },
        select: { id: true },
      });
      if (!subDept) {
        return successResponse(
          { items: [], stats: { totalItems: 0, totalQty: 0, totalValue: 0 }, location: null },
          "No sub-department found"
        );
      }
      subDepartmentId = subDept.id;
    } else {
      const { searchParams } = new URL(req.url);
      subDepartmentId = searchParams.get("subDepartmentId");
      if (!subDepartmentId) return errorResponse("subDepartmentId is required", 400);
    }

    // ── 1. Transfer-based stock ──────────────────────────────────────────
    const locationStock = await getLocationStockForDept(auth.hospitalId, subDepartmentId!);

    // ── 2. Purchase-based stock (completed POs by this sub-dept) ─────────
    const completedPurchases = await px.purchase.findMany({
      where: {
        hospitalId: auth.hospitalId,
        subDepartmentId,
        status: "COMPLETED",
      },
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true, name: true, genericName: true, category: true,
                unit: true, purchasePrice: true, mrp: true,
                minStock: true, isActive: true,
              },
            },
          },
        },
      },
    });

    // Aggregate purchased qty per item
    const purchaseStock: Record<string, any> = {};
    for (const po of completedPurchases) {
      for (const pi of po.items) {
        if (!pi.item) continue;
        if (!purchaseStock[pi.itemId]) {
          purchaseStock[pi.itemId] = {
            itemId: pi.itemId,
            name: pi.item.name,
            genericName: pi.item.genericName || "",
            category: pi.item.category,
            unit: pi.item.unit,
            purchasePrice: pi.item.purchasePrice,
            mrp: pi.item.mrp,
            minStock: pi.item.minStock,
            isActive: pi.item.isActive,
            purchasedQty: 0,
          };
        }
        purchaseStock[pi.itemId].purchasedQty += pi.quantity;
      }
    }

    // ── 3. Merge ─────────────────────────────────────────────────────────
    const merged: Record<string, any> = {};

    // From transfers
    for (const item of locationStock.items) {
      merged[item.itemId] = {
        id: item.itemId,
        name: item.name,
        genericName: item.genericName || "",
        category: item.category,
        unit: item.unit,
        purchasePrice: item.purchasePrice,
        mrp: item.mrp,
        minStock: item.minStock,
        isActive: true,
        transferredStock: item.availableQty,
        purchasedStock: 0,
        totalStock: item.availableQty,
        lastTransferDate: item.lastTransferDate || null,
      };
    }

    // Layer in purchase stock
    for (const [itemId, ps] of Object.entries(purchaseStock) as [string, any][]) {
      if (merged[itemId]) {
        merged[itemId].purchasedStock += ps.purchasedQty;
        merged[itemId].totalStock += ps.purchasedQty;
      } else {
        merged[itemId] = {
          id: ps.itemId,
          name: ps.name,
          genericName: ps.genericName,
          category: ps.category,
          unit: ps.unit,
          purchasePrice: ps.purchasePrice,
          mrp: ps.mrp,
          minStock: ps.minStock,
          isActive: ps.isActive,
          transferredStock: 0,
          purchasedStock: ps.purchasedQty,
          totalStock: ps.purchasedQty,
          lastTransferDate: null,
        };
      }
    }

    const items = Object.values(merged);

    const stats = {
      totalItems: items.length,
      totalQty: items.reduce((s: number, i: any) => s + i.totalStock, 0),
      totalValue: items.reduce((s: number, i: any) => s + i.totalStock * i.purchasePrice, 0),
    };

    return successResponse(
      { items, stats, location: locationStock.location },
      "Dept stock fetched"
    );
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch dept stock", 500);
  }
}
