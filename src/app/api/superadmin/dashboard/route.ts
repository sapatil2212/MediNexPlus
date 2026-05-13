import { NextRequest, NextResponse } from "next/server";
import { getSuperAdminDashboardStats } from "../../../../../backend/services/hospital.service";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";

export async function GET(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (authResult.error || authResult.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const dashboardData = await getSuperAdminDashboardStats();

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error: any) {
    console.error("Superadmin dashboard error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
