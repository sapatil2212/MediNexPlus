import { NextRequest, NextResponse } from "next/server";
import { permissionService } from "../../../../../backend/services/permission.service";
import { withAuth, createUnauthorizedError } from "../../../../../backend/middlewares/permission.middleware";

export async function POST(req: NextRequest) {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) {
      return createUnauthorizedError();
    }

    // Only admins can seed permissions
    if (authReq.user.role !== "HOSPITAL_ADMIN" && authReq.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Seed default permissions
    const permissions = await permissionService.seedDefaultPermissions();

    // Initialize role permissions
    await permissionService.initializeRolePermissions();

    return NextResponse.json({
      success: true,
      message: "Permissions seeded successfully",
      data: {
        permissionsCreated: permissions.length,
        rolesInitialized: 6,
      },
    });
  } catch (error: any) {
    console.error("Seed permissions error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to seed permissions" },
      { status: 500 }
    );
  }
}
