import { NextRequest } from "next/server";
import { requireRole } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import {
  registerPatient,
  getPatients,
  searchPatients,
  getPatientStats,
  PatientServiceError,
} from "../../../../backend/services/patient.service";
import { createPatient as createPatientRepo, generatePatientId } from "../../../../backend/repositories/patient.repo";
import { createPatientSchema, queryPatientSchema } from "../../../../backend/validations/patient.validation";
import prisma from "../../../../backend/config/db";
import { notifyPatientRegistered } from "../../../../backend/services/notification.service";

const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR", "SUB_DEPT_HEAD", "DEPT_HEAD"];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/patients — List patients or quick search
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);

    // Quick search for autocomplete
    if (searchParams.get("q")) {
      const results = await searchPatients(auth.hospitalId, searchParams.get("q")!);
      return successResponse(results, "Patients found");
    }

    // Stats
    if (searchParams.get("stats") === "true") {
      const stats = await getPatientStats(auth.hospitalId);
      return successResponse(stats, "Patient statistics");
    }

    const queryParams = {
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
      departmentId: searchParams.get("departmentId") || undefined,
    };

    const validated = queryPatientSchema.safeParse(queryParams);
    if (!validated.success) {
      return errorResponse("Invalid query parameters", 400, validated.error.issues);
    }

    const result = await getPatients({ hospitalId: auth.hospitalId, ...validated.data });
    return successResponse(result, "Patients fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/patients — Register patient (dedup by phone)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const result = createPatientSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    // Get hospital name for welcome email
    const hospital = await prisma.hospital.findUnique({
      where: { id: auth.hospitalId },
      select: { name: true },
    });
    const hospitalName = hospital?.name || "Hospital";

    let patient: any;
    let isNew: boolean;

    if (body.forceNew) {
      // User explicitly chose "Register as new patient" — bypass phone dedup
      const patientId = await generatePatientId(auth.hospitalId);
      patient = await createPatientRepo({
        hospitalId: auth.hospitalId,
        patientId,
        name: result.data.name,
        phone: result.data.phone,
        whatsapp: (result.data as any).whatsapp || null,
        email: result.data.email || null,
        gender: result.data.gender || null,
        dateOfBirth: result.data.dateOfBirth || null,
        bloodGroup: result.data.bloodGroup || null,
        address: result.data.address || null,
        profilePhoto: null,
        documents: null,
        patientType: null,
        allergies: null,
        emergencyName: null,
        emergencyRelation: null,
        emergencyPhone: null,
      });
      isNew = true;
    } else {
      ({ patient, isNew } = await registerPatient(auth.hospitalId, hospitalName, result.data));
    }

    if (isNew) {
      notifyPatientRegistered(auth.hospitalId, {
        patientName: patient.name,
        patientId:   patient.patientId,
        phone:       patient.phone || undefined,
      }).catch(() => {});
    }
    return successResponse(
      { patient, isNew },
      isNew ? "Patient registered successfully" : "Existing patient found",
      isNew ? 201 : 200
    );
  } catch (e: any) {
    if (e instanceof PatientServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    if (e.code === "P2002") {
      return errorResponse("A patient with this phone number already exists", 409);
    }
    return errorResponse(e.message, 500);
  }
}
