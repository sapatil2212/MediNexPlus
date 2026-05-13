import { NextRequest, NextResponse } from "next/server";
import { treatmentService } from "../../../../backend/services/treatment.service";
import { createTreatmentPlanSchema, queryTreatmentPlanSchema } from "../../../../backend/validations/treatment.validation";
import { withAuth, checkPermission, createPermissionError, createUnauthorizedError } from "../../../../backend/middlewares/permission.middleware";

export async function GET(req: NextRequest) {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    if (!checkPermission(authReq, "PATIENT_VIEW")) {
      return createPermissionError("PATIENT_VIEW");
    }

    const { searchParams } = new URL(req.url);
    const query = {
      patientId: searchParams.get("patientId") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      subDepartmentId: searchParams.get("subDepartmentId") || undefined,
      doctorId: searchParams.get("doctorId") || undefined,
      status: searchParams.get("status") as any || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const validated = queryTreatmentPlanSchema.parse(query);
    const result = await treatmentService.getTreatmentPlans(authReq.user.hospitalId, validated);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Get treatment plans error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch treatment plans" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    if (!checkPermission(authReq, "PROCEDURE_PERFORM")) {
      return createPermissionError("PROCEDURE_PERFORM");
    }

    const body = await req.json();
    const validated = createTreatmentPlanSchema.parse(body);

    const plan = await treatmentService.createTreatmentPlan(authReq.user.hospitalId, validated);

    return NextResponse.json({
      success: true,
      message: "Treatment plan created successfully",
      data: plan,
    });
  } catch (error: any) {
    console.error("Create treatment plan error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create treatment plan" },
      { status: 400 }
    );
  }
}
