import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import prisma from "../../../../../backend/config/db";

const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF"];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/enquiries/[id] — Get single enquiry
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM Enquiry WHERE id = ? AND hospitalId = ? LIMIT 1`,
      id, auth.hospitalId
    );
    if (!rows.length) return errorResponse("Enquiry not found", 404);
    return successResponse(rows[0]);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch enquiry", 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/enquiries/[id] — Update status, notes, assignedTo
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, assignedTo } = body;

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM Enquiry WHERE id = ? AND hospitalId = ? LIMIT 1`,
      id, auth.hospitalId
    );
    if (!rows.length) return errorResponse("Enquiry not found", 404);

    const sets: string[] = [];
    const vals: any[] = [];
    if (status) { sets.push("status = ?"); vals.push(status); }
    if (notes !== undefined) { sets.push("notes = ?"); vals.push(notes); }
    if (assignedTo !== undefined) { sets.push("assignedTo = ?"); vals.push(assignedTo); }
    sets.push("updatedAt = ?"); vals.push(new Date());

    await prisma.$executeRawUnsafe(
      `UPDATE Enquiry SET ${sets.join(", ")} WHERE id = ?`,
      ...vals, id
    );

    const updated = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM Enquiry WHERE id = ? LIMIT 1`, id
    );
    return successResponse(updated[0], "Enquiry updated");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to update enquiry", 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/enquiries/[id] — Delete enquiry
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM Enquiry WHERE id = ? AND hospitalId = ? LIMIT 1`,
      id, auth.hospitalId
    );
    if (!rows.length) return errorResponse("Enquiry not found", 404);

    await prisma.$executeRawUnsafe(`DELETE FROM Enquiry WHERE id = ?`, id);
    return successResponse(null, "Enquiry deleted");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to delete enquiry", 500);
  }
}
