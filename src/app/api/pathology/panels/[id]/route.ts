import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import prisma from "../../../../../../backend/config/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    const body = await req.json();
    const { name, code, description, price, isActive, testIds } = body;

    await (prisma as any).labPanel.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) || 0 }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    if (testIds !== undefined) {
      await (prisma as any).labPanelItem.deleteMany({ where: { panelId: params.id } });
      if (testIds.length > 0) {
        await (prisma as any).labPanelItem.createMany({
          data: (testIds as string[]).map((testId: string, i: number) => ({ panelId: params.id, testId, sequence: i })),
        });
      }
    }

    const updated = await (prisma as any).labPanel.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { test: { select: { id: true, name: true, code: true } } }, orderBy: { sequence: "asc" } },
      },
    });

    return successResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (!["SUB_DEPT_HEAD", "HOSPITAL_ADMIN"].includes(user!.role)) return errorResponse("Forbidden", 403);

  try {
    await (prisma as any).labPanel.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch (err: any) {
    return errorResponse(err.message || "Failed", 500);
  }
}
