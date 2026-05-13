import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import prisma from "../../../../../../backend/config/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authMiddleware(req);
    if (authResult.error || authResult.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const hospital = await (prisma as any).hospital.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            patients: true,
            doctors: true,
            staffMembers: true,
            appointments: true,
            departments: true,
          },
        },
      },
    });

    if (!hospital) {
      return NextResponse.json(
        { success: false, message: "Hospital not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...hospital,
        patients: hospital._count.patients,
        doctors: hospital._count.doctors,
        staff: hospital._count.staffMembers,
        appointments: hospital._count.appointments,
        departments: hospital._count.departments,
      },
    });
  } catch (error: any) {
    console.error("Get hospital error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch hospital" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authMiddleware(req);
    if (authResult.error || authResult.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const hospital = await (prisma as any).hospital.findUnique({
      where: { id: params.id },
    });

    if (!hospital) {
      return NextResponse.json(
        { success: false, message: "Hospital not found" },
        { status: 404 }
      );
    }

    await (prisma as any).hospital.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: `Hospital "${hospital.name}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("Delete hospital error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete hospital" },
      { status: 500 }
    );
  }
}
