import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  const hospitalId = auth.hospitalId;
  const db = prisma as any;

  const now   = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // Last 7 days
  const last7  = new Date(todayStart); last7.setDate(last7.getDate() - 6);
  // Last 30 days
  const last30 = new Date(todayStart); last30.setDate(last30.getDate() - 29);
  // Current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const [
      // Appointment stats
      totalAppts,
      todayAppts,
      last7Appts,
      last30Appts,
      completedAppts,
      cancelledAppts,
      // Patient stats
      totalPatients,
      newPatientsToday,
      newPatientsMonth,
      // Follow-up stats
      totalFollowUps,
      pendingFollowUps,
      overdueFollowUps,
      todayFollowUps,
      completedFollowUps,
      // Billing stats
      totalBills,
      paidBills,
      pendingBills,
      // Doctor stats
      totalDoctors,
      activeDoctors,
      // Appointment type breakdown
      apptTypes,
      // Appointment status breakdown
      apptStatuses,
      // Daily appointments last 7 days
      dailyAppts,
    ] = await Promise.all([
      // Appointments
      db.appointment.count({ where: { hospitalId } }),
      db.appointment.count({ where: { hospitalId, appointmentDate: { gte: todayStart, lt: todayEnd } } }),
      db.appointment.count({ where: { hospitalId, appointmentDate: { gte: last7 } } }),
      db.appointment.count({ where: { hospitalId, appointmentDate: { gte: last30 } } }),
      db.appointment.count({ where: { hospitalId, status: "COMPLETED" } }),
      db.appointment.count({ where: { hospitalId, status: "CANCELLED" } }),
      // Patients
      db.patient.count({ where: { hospitalId } }),
      db.patient.count({ where: { hospitalId, createdAt: { gte: todayStart, lt: todayEnd } } }),
      db.patient.count({ where: { hospitalId, createdAt: { gte: monthStart } } }),
      // Follow-ups
      db.followUp.count({ where: { hospitalId } }),
      db.followUp.count({ where: { hospitalId, status: "PENDING" } }),
      db.followUp.count({ where: { hospitalId, status: "PENDING", followUpDate: { lt: todayStart } } }),
      db.followUp.count({ where: { hospitalId, status: "PENDING", followUpDate: { gte: todayStart, lt: todayEnd } } }),
      db.followUp.count({ where: { hospitalId, status: "COMPLETED" } }),
      // Billing
      db.bill.count({ where: { hospitalId } }),
      db.bill.count({ where: { hospitalId, status: "PAID" } }),
      db.bill.count({ where: { hospitalId, status: "PENDING" } }),
      // Doctors
      prisma.doctor.count({ where: { hospitalId } }),
      prisma.doctor.count({ where: { hospitalId, isActive: true } }),
      // Appointment type breakdown
      db.appointment.groupBy({ by: ["type"], where: { hospitalId }, _count: { id: true } }),
      // Appointment status breakdown
      db.appointment.groupBy({ by: ["status"], where: { hospitalId }, _count: { id: true } }),
      // Daily appointments last 7 days (raw)
      db.appointment.groupBy({
        by: ["appointmentDate"],
        where: { hospitalId, appointmentDate: { gte: last7, lt: todayEnd } },
        _count: { id: true },
        orderBy: { appointmentDate: "asc" },
      }),
    ]);

    // Revenue totals
    const revData = await db.bill.aggregate({
      where: { hospitalId },
      _sum: { total: true, paidAmount: true, discount: true },
    });

    const monthRevData = await db.bill.aggregate({
      where: { hospitalId, createdAt: { gte: monthStart } },
      _sum: { total: true, paidAmount: true },
    });

    // Top doctors by appointment count (last 30 days)
    const topDoctors = await db.appointment.groupBy({
      by: ["doctorId"],
      where: { hospitalId, appointmentDate: { gte: last30 } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const doctorIds = topDoctors.map((d: any) => d.doctorId);
    const doctorNames = doctorIds.length
      ? await prisma.doctor.findMany({ where: { id: { in: doctorIds } }, select: { id: true, name: true, specialization: true } })
      : [];

    const topDoctorsList = topDoctors.map((d: any) => ({
      doctorId: d.doctorId,
      count: d._count.id,
      ...doctorNames.find((dn: any) => dn.id === d.doctorId),
    }));

    return successResponse({
      appointments: {
        total: totalAppts,
        today: todayAppts,
        last7days: last7Appts,
        last30days: last30Appts,
        completed: completedAppts,
        cancelled: cancelledAppts,
        completionRate: totalAppts ? Math.round((completedAppts / totalAppts) * 100) : 0,
        byType: apptTypes.map((t: any) => ({ type: t.type, count: t._count.id })),
        byStatus: apptStatuses.map((s: any) => ({ status: s.status, count: s._count.id })),
        daily: dailyAppts.map((d: any) => ({
          date: new Date(d.appointmentDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
          count: d._count.id,
        })),
      },
      patients: {
        total: totalPatients,
        newToday: newPatientsToday,
        newThisMonth: newPatientsMonth,
      },
      followUps: {
        total: totalFollowUps,
        pending: pendingFollowUps,
        overdue: overdueFollowUps,
        today: todayFollowUps,
        completed: completedFollowUps,
        completionRate: totalFollowUps ? Math.round((completedFollowUps / totalFollowUps) * 100) : 0,
      },
      billing: {
        totalBills,
        paidBills,
        pendingBills,
        totalRevenue: revData._sum.total ?? 0,
        collectedRevenue: revData._sum.paidAmount ?? 0,
        totalDiscount: revData._sum.discount ?? 0,
        monthRevenue: monthRevData._sum.total ?? 0,
        monthCollected: monthRevData._sum.paidAmount ?? 0,
        collectionRate: revData._sum.total ? Math.round(((revData._sum.paidAmount ?? 0) / revData._sum.total) * 100) : 0,
      },
      doctors: { total: totalDoctors, active: activeDoctors },
      topDoctors: topDoctorsList,
    }, "Reports summary fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
