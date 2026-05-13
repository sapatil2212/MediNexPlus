import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "SUB_DEPT_HEAD"];
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { title, category, amount, date, description, receipt, addedByName, department } = body;
    const expense = await (prisma as any).expense.update({
      where: { id: params.id },
      data: {
        ...(title              && { title }),
        ...(category           && { category }),
        ...(amount             && { amount: parseFloat(amount) }),
        ...(date               && { date: new Date(date) }),
        ...(description !== undefined && { description }),
        ...(receipt     !== undefined && { receipt }),
        ...(addedByName !== undefined && { addedByName }),
        ...(department  !== undefined && { department }),
      },
    });
    return successResponse(expense, "Expense updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    await (prisma as any).expense.delete({ where: { id: params.id } });
    return successResponse(null, "Expense deleted");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
