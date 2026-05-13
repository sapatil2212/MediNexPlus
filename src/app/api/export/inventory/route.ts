import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const search   = searchParams.get("search")   || undefined;
    const category = searchParams.get("category") || undefined;

    const where: any = { hospitalId: auth.hospitalId };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: "insensitive" } },
        { category:    { contains: search, mode: "insensitive" } },
        { supplier:    { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await (prisma as any).inventoryItem.findMany({
      where,
      include: {
        batches: {
          select: { quantity: true, expiryDate: true },
          orderBy: { expiryDate: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const rows = items.map((item: any) => {
      const totalStock = item.batches.reduce((sum: number, b: any) => sum + (b.quantity ?? 0), 0);
      const earliestExpiry = item.batches.find((b: any) => b.expiryDate)?.expiryDate;
      return [
        item.name,
        item.category      ?? "",
        item.unit          ?? "",
        String(totalStock),
        String(item.minStock    ?? 0),
        String(item.reorderLevel ?? 0),
        item.supplier      ?? "",
        item.unitPrice     != null ? String(item.unitPrice) : "",
        totalStock <= (item.reorderLevel ?? 0) ? "Low Stock" : "OK",
        earliestExpiry ? new Date(earliestExpiry).toLocaleDateString("en-IN") : "",
      ];
    });

    const header = [
      "Name", "Category", "Unit", "Current Stock", "Min Stock", "Reorder Level",
      "Supplier", "Unit Price", "Stock Status", "Earliest Expiry",
    ];

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row: string[]) => row.map(escape).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
