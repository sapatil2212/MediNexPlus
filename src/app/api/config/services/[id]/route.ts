import { NextRequest, NextResponse } from "next/server";
import { serviceService } from "../../../../../../backend/services/service.service";
import { updateServiceSchema } from "../../../../../../backend/validations/service.validation";
import { withAuth, checkPermission, createPermissionError, createUnauthorizedError } from "../../../../../../backend/middlewares/permission.middleware";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    const service = await serviceService.getService(params.id, authReq.user.hospitalId);

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    console.error("Get service error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch service" },
      { status: 404 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    if (!checkPermission(authReq, "PROCEDURE_MANAGE")) {
      return createPermissionError("PROCEDURE_MANAGE");
    }

    const body = await req.json();
    const validated = updateServiceSchema.parse({ ...body, id: params.id });

    const service = await serviceService.updateService(params.id, authReq.user.hospitalId, validated);

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error: any) {
    console.error("Update service error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update service" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    if (!checkPermission(authReq, "PROCEDURE_MANAGE")) {
      return createPermissionError("PROCEDURE_MANAGE");
    }

    await serviceService.deleteService(params.id, authReq.user.hospitalId);

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete service error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete service" },
      { status: 400 }
    );
  }
}
