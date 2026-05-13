import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { admitPatientIPD, getIPDAdmissions, IPDServiceError } from "../../../../../backend/services/ipd.service";
import { allocateBed, getAllAllocationsService, AllocationServiceError } from "../../../../../backend/services/allocation.service";
import { z } from "zod";

const admitSchema = z.object({
  // Bed allocation fields (creates allocation + IPD admission in one step)
  bedId: z.string().min(1),
  patientId: z.string().optional(),
  entryType: z.enum(["PATIENT", "MANUAL"]).optional(),
  patientName: z.string().min(2),
  patientAge: z.number().int().min(0).max(150).optional(),
  patientGender: z.enum(["Male", "Female", "Other"]).optional(),
  patientPhone: z.string().optional(),
  attendantName: z.string().optional(),
  attendantPhone: z.string().optional(),
  diagnosis: z.string().optional(),
  admittingDoctorName: z.string().optional(),
  departmentId: z.string().optional(),
  admissionDate: z.string().optional(),
  expectedDischargeDate: z.string().optional(),
  notes: z.string().optional(),
  // IPD-specific fields
  admissionType: z.enum(["EMERGENCY", "PLANNED", "TRANSFER"]).optional(),
  assignedDoctorId: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceId: z.string().optional(),
  corporateName: z.string().optional(),
  admissionNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") || undefined;
    const search = sp.get("search") || undefined;
    const page = parseInt(sp.get("page") || "1");
    const limit = parseInt(sp.get("limit") || "20");

    // If no IPD-specific filter, fall back to allocation list for backward compat
    if (!status && !search && page === 1) {
      const allData = await getAllAllocationsService(auth.hospitalId, undefined);
      return successResponse(allData, "Admissions fetched");
    }

    const data = await getIPDAdmissions(auth.hospitalId, { status, search, page, limit });
    return successResponse(data, "IPD admissions fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = admitSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const { admissionType, assignedDoctorId, insuranceProvider, insuranceId, corporateName, admissionNotes, ...allocData } = result.data;

    // Step 1: create bed allocation
    const allocation = await allocateBed(auth.hospitalId, allocData) as any;

    // Step 2: create IPD admission record
    const ipdAdmission = await admitPatientIPD(auth.hospitalId, {
      allocationId: allocation.id,
      admissionType,
      assignedDoctorId,
      departmentId: allocData.departmentId,
      insuranceProvider,
      insuranceId,
      corporateName,
      admissionNotes,
    });

    return successResponse({ allocation, ipdAdmission }, "Patient admitted to IPD successfully", 201);
  } catch (e: any) {
    if (e instanceof AllocationServiceError) return errorResponse(e.message, e.status, { code: e.code });
    if (e instanceof IPDServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message || "Server error", 500);
  }
}
