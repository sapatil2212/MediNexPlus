import { NextRequest, NextResponse } from "next/server";
import { serviceService } from "../../../../../backend/services/service.service";
import { createServiceSchema, queryServiceSchema } from "../../../../../backend/validations/service.validation";
import { withAuth, checkPermission, createPermissionError, createUnauthorizedError } from "../../../../../backend/middlewares/permission.middleware";

export async function GET(req: NextRequest) {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    if (!checkPermission(authReq, "DEPT_VIEW")) {
      return createPermissionError("DEPT_VIEW");
    }

    const { searchParams } = new URL(req.url);
    const query = {
      search: searchParams.get("search") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      subDepartmentId: searchParams.get("subDepartmentId") || undefined,
      category: searchParams.get("category") || undefined,
      isActive: searchParams.get("isActive") === "true" ? true : searchParams.get("isActive") === "false" ? false : undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const validated = queryServiceSchema.parse(query);
    const result = await serviceService.getServices(authReq.user.hospitalId, validated);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Get services error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch services" },
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

    if (!checkPermission(authReq, "PROCEDURE_MANAGE")) {
      return createPermissionError("PROCEDURE_MANAGE");
    }

    const body = await req.json();
    const validated = createServiceSchema.parse(body);

    const service = await serviceService.createService(authReq.user.hospitalId, validated);

    return NextResponse.json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error: any) {
    console.error("Create service error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create service" },
      { status: 400 }
    );
  }
}
