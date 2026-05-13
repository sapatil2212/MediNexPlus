import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import prisma from "../../../../../../../backend/config/db";
import { findDepartmentByUserId } from "../../../../../../../backend/repositories/department.repo";

export const dynamic = "force-dynamic";

/**
 * GET /api/parentdept/subdepartments/[id]/dashboard
 * Returns comprehensive dashboard data for a specific sub-department.
 * Accessible by DEPT_HEAD only — verifies the sub-dept belongs to their department.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, ["DEPT_HEAD"]);
  if (auth.error) return auth.error;

  try {
    const { id: subDeptId } = await params;
    const dept = await findDepartmentByUserId(auth.user.userId);
    if (!dept) return errorResponse("Department not found", 404);

    // Verify sub-dept belongs to this parent dept
    const subDept = await (prisma as any).subDepartment.findFirst({
      where: { id: subDeptId, departmentId: dept.id, hospitalId: auth.hospitalId },
      include: {
        procedures: { orderBy: [{ sequence: "asc" }, { name: "asc" }] },
        _count: { select: { procedures: true, appointments: true, procedureRecords: true } },
      },
    });
    if (!subDept) return errorResponse("Sub-department not found under this department", 404);

    const hospitalId = auth.hospitalId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // --- Queue: appointments referred to this sub-dept without procedure records yet ---
    const doneRecords = await (prisma as any).procedureRecord.findMany({
      where: { hospitalId, subDepartmentId: subDeptId, appointmentId: { not: null } },
      select: { appointmentId: true },
    });
    const doneAppointmentIds = new Set(doneRecords.map((r: any) => r.appointmentId));

    const appointments = await (prisma as any).appointment.findMany({
      where: {
        hospitalId,
        subDepartmentId: subDeptId,
        status: "COMPLETED",
        ...(doneAppointmentIds.size > 0 ? { id: { notIn: Array.from(doneAppointmentIds) } } : {}),
      },
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true } },
        doctor: { select: { id: true, name: true, specialization: true, department: { select: { name: true } } } },
      },
      orderBy: [{ appointmentDate: "desc" }, { timeSlot: "desc" }],
      take: 100,
    });

    const queue = appointments.map((a: any) => ({
      id: a.id,
      appointmentDate: a.appointmentDate,
      tokenNumber: a.tokenNumber,
      timeSlot: a.timeSlot,
      type: a.type,
      status: a.status,
      consultationFee: a.consultationFee,
      subDeptNote: a.subDeptNote,
      doctorNotes: a.notes,
      patient: {
        id: a.patient?.id,
        name: a.patient?.name || "Unknown",
        patientId: a.patient?.patientId,
        phone: a.patient?.phone,
        gender: a.patient?.gender,
      },
      doctor: {
        name: a.doctor?.name || "Unknown",
        specialization: a.doctor?.specialization,
        department: a.doctor?.department?.name,
      },
    }));

    // --- Completed queue (with procedure records) ---
    let completedList: any[] = [];
    if (doneAppointmentIds.size > 0) {
      const completedAppts = await (prisma as any).appointment.findMany({
        where: { hospitalId, subDepartmentId: subDeptId, id: { in: Array.from(doneAppointmentIds) } },
        include: {
          patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true } },
          doctor: { select: { name: true, specialization: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
      });

      const procRecords = await (prisma as any).procedureRecord.findMany({
        where: { hospitalId, subDepartmentId: subDeptId, appointmentId: { in: Array.from(doneAppointmentIds) } },
        include: { procedure: { select: { name: true, type: true } } },
        orderBy: { performedAt: "desc" },
      });
      const recordsByAppt: Record<string, any[]> = {};
      for (const r of procRecords) {
        if (!recordsByAppt[r.appointmentId]) recordsByAppt[r.appointmentId] = [];
        recordsByAppt[r.appointmentId].push(r);
      }

      completedList = completedAppts.map((a: any) => ({
        id: a.id,
        appointmentDate: a.appointmentDate,
        tokenNumber: a.tokenNumber,
        patient: { name: a.patient?.name, patientId: a.patient?.patientId },
        doctor: { name: a.doctor?.name },
        procedureRecords: (recordsByAppt[a.id] || []).map((r: any) => ({
          id: r.id, procedureName: r.procedure?.name, procedureType: r.procedure?.type,
          amount: r.amount, status: r.status, performedBy: r.performedBy, performedAt: r.performedAt,
        })),
      }));
    }

    // --- Recent records ---
    const recentRecords = await (prisma as any).procedureRecord.findMany({
      where: { hospitalId, subDepartmentId: subDeptId },
      include: {
        patient: { select: { name: true, patientId: true } },
        procedure: { select: { name: true, type: true, fee: true } },
      },
      orderBy: { performedAt: "desc" },
      take: 20,
    });

    // --- Stats ---
    const [allStats, todayStats, todayReferrals, totalReferrals] = await Promise.all([
      (prisma as any).procedureRecord.aggregate({
        where: { hospitalId, subDepartmentId: subDeptId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      (prisma as any).procedureRecord.aggregate({
        where: { hospitalId, subDepartmentId: subDeptId, performedAt: { gte: todayStart } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      (prisma as any).appointment.count({
        where: { hospitalId, subDepartmentId: subDeptId, appointmentDate: { gte: todayStart } },
      }),
      (prisma as any).appointment.count({
        where: { hospitalId, subDepartmentId: subDeptId },
      }),
    ]);

    // --- Daily trend (last 14 days) ---
    const allRecordsForTrend = await (prisma as any).procedureRecord.findMany({
      where: {
        hospitalId, subDepartmentId: subDeptId,
        performedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      select: { performedAt: true, amount: true },
    });
    const dailyMap: Record<string, { count: number; revenue: number }> = {};
    for (const r of allRecordsForTrend) {
      const day = new Date(r.performedAt).toISOString().slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { count: 0, revenue: 0 };
      dailyMap[day].count++;
      dailyMap[day].revenue += r.amount || 0;
    }
    const dailyTrend = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({
        date: key,
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        count: dailyMap[key]?.count || 0,
        revenue: dailyMap[key]?.revenue || 0,
      });
    }

    return successResponse({
      profile: {
        id: subDept.id,
        name: subDept.name,
        code: subDept.code,
        type: subDept.type,
        description: subDept.description,
        color: subDept.color,
        flow: subDept.flow,
        isActive: subDept.isActive,
        hodStaffName: subDept.hodStaffName,
        hodStaffEmail: subDept.hodStaffEmail,
        hodStaffPhone: subDept.hodStaffPhone,
      },
      procedures: subDept.procedures,
      stats: {
        totalRecords: allStats._count.id || 0,
        totalRevenue: allStats._sum.amount || 0,
        todayRecords: todayStats._count.id || 0,
        todayRevenue: todayStats._sum.amount || 0,
        todayReferrals,
        totalReferrals,
        pendingQueue: queue.length,
        completedToday: completedList.filter((c: any) => {
          const pr = c.procedureRecords?.[0];
          if (!pr) return false;
          return new Date(pr.performedAt) >= todayStart;
        }).length,
        activeProcedures: subDept.procedures.filter((p: any) => p.isActive).length,
        totalProcedures: subDept.procedures.length,
      },
      queue,
      completedList,
      recentRecords: recentRecords.map((r: any) => ({
        id: r.id,
        patientName: r.patient?.name || "—",
        patientId: r.patient?.patientId || "—",
        procedureName: r.procedure?.name || "—",
        procedureType: r.procedure?.type || "—",
        amount: r.amount,
        status: r.status,
        performedBy: r.performedBy || "—",
        performedAt: r.performedAt,
      })),
      dailyTrend,
    }, "Sub-department dashboard data fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch sub-department dashboard", 500);
  }
}
