import { NextRequest } from "next/server";
import { requireRole } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import { getBills, createBill, BillingServiceError } from "../../../../backend/services/billing.service";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "RECEPTIONIST", "SUB_DEPT_HEAD", "DEPT_HEAD"];
export const dynamic = "force-dynamic";

// GET /api/billing
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const url = new URL(req.url);
    const result = await getBills(auth.hospitalId, {
      page:           parseInt(url.searchParams.get("page")    || "1"),
      limit:          parseInt(url.searchParams.get("limit")   || "20"),
      search:         url.searchParams.get("search")         || undefined,
      status:         url.searchParams.get("status")         || undefined,
      dateFrom:       url.searchParams.get("dateFrom")       || undefined,
      dateTo:         url.searchParams.get("dateTo")         || undefined,
      patientId:      url.searchParams.get("patientId")      || undefined,
      prescriptionId: url.searchParams.get("prescriptionId") || undefined,
      pharmacyOnly:   url.searchParams.get("pharmacyOnly") === "true",
      labOnly:        url.searchParams.get("labOnly") === "true",
      departmentId:   url.searchParams.get("departmentId")   || undefined,
    });
    return successResponse(result, "Bills fetched");
  } catch (e: any) {
    if (e instanceof BillingServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// POST /api/billing — manually create a bill
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (!body.patientId) return errorResponse("patientId is required", 400);
    if (!Array.isArray(body.items) || body.items.length === 0)
      return errorResponse("At least one bill item is required", 400);
    const bill = await createBill(auth.hospitalId, body);
    return successResponse(bill, "Bill created", 201);
  } catch (e: any) {
    if (e instanceof BillingServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
