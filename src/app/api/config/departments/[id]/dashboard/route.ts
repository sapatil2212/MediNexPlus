import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import prisma from "../../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/config/departments/[id]/dashboard
 * Returns department details + sub-departments with stats.
 * Accessible by HOSPITAL_ADMIN only.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id: deptId } = await params;

    const dept = await (prisma as any).department.findFirst({
      where: { id: deptId, hospitalId: auth.hospitalId },
      include: {
        hodDoctor: { select: { id: true, name: true, specialization: true } },
        hodUser: { select: { id: true, name: true, email: true } },
        _count: { select: { doctors: true, staff: true, subDepartments: true, appointments: true } },
      },
    });
    if (!dept) return errorResponse("Department not found", 404);

    // Fetch sub-departments with counts
    const subDepts = await (prisma as any).subDepartment.findMany({
      where: { departmentId: deptId, hospitalId: auth.hospitalId },
      include: {
        _count: { select: { procedures: true, appointments: true, procedureRecords: true } },
      },
      orderBy: { name: "asc" },
    });

    // Fetch doctors in this department
    const doctors = await (prisma as any).doctor.findMany({
      where: { departmentId: deptId, hospitalId: auth.hospitalId },
      select: { id: true, name: true, specialization: true, isActive: true },
      orderBy: { name: "asc" },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Appointment stats for this department
    const [totalAppts, todayAppts] = await Promise.all([
      (prisma as any).appointment.count({
        where: { departmentId: deptId, hospitalId: auth.hospitalId },
      }),
      (prisma as any).appointment.count({
        where: { departmentId: deptId, hospitalId: auth.hospitalId, appointmentDate: { gte: todayStart } },
      }),
    ]);

    // Revenue from procedure records across all sub-depts in this department
    const subDeptIds = subDepts.map((sd: any) => sd.id);
    let totalRevenue = 0;
    let todayRevenue = 0;
    let totalRecords = 0;
    let todayRecords = 0;

    if (subDeptIds.length > 0) {
      const [allStats, todayStats] = await Promise.all([
        (prisma as any).procedureRecord.aggregate({
          where: { hospitalId: auth.hospitalId, subDepartmentId: { in: subDeptIds } },
          _sum: { amount: true },
          _count: { id: true },
        }),
        (prisma as any).procedureRecord.aggregate({
          where: { hospitalId: auth.hospitalId, subDepartmentId: { in: subDeptIds }, performedAt: { gte: todayStart } },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);
      totalRevenue = allStats._sum.amount || 0;
      todayRevenue = todayStats._sum.amount || 0;
      totalRecords = allStats._count.id || 0;
      todayRecords = todayStats._count.id || 0;
    }

    return successResponse({
      department: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        type: dept.type,
        description: dept.description,
        isActive: dept.isActive,
        color: dept.color,
        loginEmail: dept.loginEmail,
        hodDoctor: dept.hodDoctor,
        hodUser: dept.hodUser,
        counts: dept._count,
      },
      stats: {
        totalDoctors: doctors.length,
        activeDoctors: doctors.filter((d: any) => d.isActive).length,
        totalSubDepts: subDepts.length,
        activeSubDepts: subDepts.filter((sd: any) => sd.isActive).length,
        totalAppointments: totalAppts,
        todayAppointments: todayAppts,
        totalRevenue,
        todayRevenue,
        totalRecords,
        todayRecords,
        totalStaff: dept._count.staff,
      },
      subDepartments: subDepts.map((sd: any) => ({
        id: sd.id,
        name: sd.name,
        code: sd.code,
        type: sd.type,
        description: sd.description,
        color: sd.color,
        flow: sd.flow,
        isActive: sd.isActive,
        hodStaffName: sd.hodStaffName,
        hodStaffEmail: sd.hodStaffEmail,
        hodStaffPhone: sd.hodStaffPhone,
        _count: sd._count,
      })),
      doctors,
    }, "Department dashboard data fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch department dashboard", 500);
  }
}
