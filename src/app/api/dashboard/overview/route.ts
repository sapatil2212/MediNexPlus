import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

const px = prisma as any;

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;

  const { hospitalId } = auth;

  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build last 9 months range
    const monthlyData: { month: string; label: string; start: Date; end: Date }[] = [];
    for (let i = 8; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      monthlyData.push({
        month: d.toISOString().slice(0, 7),
        label: d.toLocaleString("default", { month: "short" }),
        start: d,
        end,
      });
    }

    // Parallel queries
    const [
      // Patient stats
      totalPatients,
      newPatientsToday,
      newPatientsMonth,

      // Appointment stats
      todayAppts,
      completedAppts,
      cancelledAppts,
      scheduledAppts,
      pendingAppts,

      // Staff & Doctor counts
      totalStaff,
      activeStaff,
      totalDoctors,
      activeDoctors,

      // Finance
      todayRevenue,
      monthRevenue,
      pendingBills,

      // Inventory alerts
      lowStockCount,
      expiringSoonCount,

      // Recent patients
      recentPatients,

      // Today's appointments with doctor info
      todayApptsDetailed,

      // Treatment plan stats
      activeTreatmentPlans,
      completedTreatmentPlans,
      treatmentRevenue,
    ] = await Promise.all([
      // Patient stats
      prisma.patient.count({ where: { hospitalId } }),
      prisma.patient.count({ where: { hospitalId, createdAt: { gte: todayStart } } }),
      prisma.patient.count({ where: { hospitalId, createdAt: { gte: monthStart } } }),

      // Appointment counts
      px.appointment.count({ where: { hospitalId, appointmentDate: { gte: todayStart, lte: todayEnd } } }),
      px.appointment.count({ where: { hospitalId, appointmentDate: { gte: todayStart, lte: todayEnd }, status: "COMPLETED" } }),
      px.appointment.count({ where: { hospitalId, appointmentDate: { gte: todayStart, lte: todayEnd }, status: "CANCELLED" } }),
      px.appointment.count({ where: { hospitalId, appointmentDate: { gte: todayStart, lte: todayEnd }, status: "SCHEDULED" } }),
      px.appointment.count({ where: { hospitalId, appointmentDate: { gte: todayStart, lte: todayEnd }, status: "CONFIRMED" } }),

      // Staff counts
      px.staff.count({ where: { hospitalId } }).catch(() => 0),
      px.staff.count({ where: { hospitalId, isActive: true } }).catch(() => 0),
      px.doctor.count({ where: { hospitalId } }).catch(() => 0),
      px.doctor.count({ where: { hospitalId, isActive: true } }).catch(() => 0),

      // Finance - revenue from paid bills today & month
      px.bill.aggregate({ where: { hospitalId, status: "PAID", paidAt: { gte: todayStart } }, _sum: { total: true } }).catch(() => ({ _sum: { total: 0 } })),
      px.bill.aggregate({ where: { hospitalId, status: "PAID", paidAt: { gte: monthStart } }, _sum: { total: true } }).catch(() => ({ _sum: { total: 0 } })),
      px.bill.count({ where: { hospitalId, status: "PENDING" } }).catch(() => 0),

      // Inventory low stock count (items where sum of remainingQty <= minStock)
      px.inventoryItem.findMany({
        where: { hospitalId, isActive: true },
        select: { minStock: true, batches: { select: { remainingQty: true } } },
      }).then((items: any[]) => items.filter((it: any) => {
        const total = (it.batches ?? []).reduce((s: number, b: any) => s + (b.remainingQty || 0), 0);
        return total <= (it.minStock ?? 0);
      }).length).catch(() => 0),
      // Inventory expiring batches count
      px.stockBatch.count({
        where: {
          hospitalId,
          expiryDate: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), gte: now },
          remainingQty: { gt: 0 },
        },
      }).catch(() => 0),

      // Recent patients (last 6)
      prisma.patient.findMany({
        where: { hospitalId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, patientId: true, name: true, gender: true, bloodGroup: true, dateOfBirth: true, createdAt: true, phone: true, _count: { select: { appointments: true } } },
      }),

      // Today's appointments with doctor info
      px.appointment.findMany({
        where: { hospitalId, appointmentDate: { gte: todayStart, lte: todayEnd } },
        select: {
          id: true,
          timeSlot: true,
          status: true,
          doctor: { select: { id: true, name: true, specialization: true, department: { select: { name: true } } } },
        },
        orderBy: { timeSlot: "asc" },
        take: 50,
      }).catch(() => []),

      // Treatment plan stats
      px.treatmentPlan.count({ where: { hospitalId, status: "ACTIVE" } }).catch(() => 0),
      px.treatmentPlan.count({ where: { hospitalId, status: "COMPLETED" } }).catch(() => 0),
      px.treatmentPlan.aggregate({ where: { hospitalId }, _sum: { paidAmount: true } }).catch(() => ({ _sum: { paidAmount: 0 } })),
    ]);

    // Monthly appointment trends (last 9 months)
    const monthlyTrends = await Promise.all(
      monthlyData.map(async (m) => {
        const [appts, patients] = await Promise.all([
          px.appointment.count({ where: { hospitalId, appointmentDate: { gte: m.start, lte: m.end } } }).catch(() => 0),
          prisma.patient.count({ where: { hospitalId, createdAt: { gte: m.start, lte: m.end } } }).catch(() => 0),
        ]);
        return { month: m.month, label: m.label, appointments: appts, patients };
      })
    );

    // Build "doctors on duty today" — unique doctors with appts today
    const doctorMap = new Map<string, any>();
    for (const appt of todayApptsDetailed) {
      if (appt.doctor && !doctorMap.has(appt.doctor.id)) {
        doctorMap.set(appt.doctor.id, {
          id: appt.doctor.id,
          name: appt.doctor.name,
          specialization: appt.doctor.specialization,
          department: appt.doctor.department?.name || appt.doctor.specialization,
          appointmentCount: 0,
          firstSlot: appt.timeSlot,
          lastSlot: appt.timeSlot,
          fromAvailability: false,
        });
      }
      if (appt.doctor && doctorMap.has(appt.doctor.id)) {
        doctorMap.get(appt.doctor.id).appointmentCount++;
        if (appt.timeSlot > doctorMap.get(appt.doctor.id).lastSlot) {
          doctorMap.get(appt.doctor.id).lastSlot = appt.timeSlot;
        }
      }
    }

    // Also include doctors with scheduled availability for today's day-of-week
    const DAY_NAMES = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    const todayDayName = DAY_NAMES[now.getDay()];
    const availableDoctors = await px.doctorAvailability.findMany({
      where: { isActive: true, day: todayDayName, doctor: { hospitalId, isActive: true } },
      select: {
        startTime: true,
        endTime: true,
        doctor: { select: { id: true, name: true, specialization: true, department: { select: { name: true } } } },
      },
    }).catch(() => []);

    for (const av of availableDoctors) {
      if (!av.doctor) continue;
      if (!doctorMap.has(av.doctor.id)) {
        doctorMap.set(av.doctor.id, {
          id: av.doctor.id,
          name: av.doctor.name,
          specialization: av.doctor.specialization,
          department: av.doctor.department?.name || av.doctor.specialization,
          appointmentCount: 0,
          firstSlot: av.startTime,
          lastSlot: av.endTime,
          fromAvailability: true,
        });
      }
    }

    const doctorsOnDuty = Array.from(doctorMap.values()).slice(0, 10);

    // Follow-up stats
    const followUpStats = await px.followUp.findMany({
      where: { hospitalId, followUpDate: { gte: todayStart, lte: todayEnd } },
      select: { status: true },
    }).catch(() => []);

    const todayFollowUps = followUpStats.length;
    const pendingFollowUps = followUpStats.filter((f: any) => f.status === "PENDING").length;

    return successResponse({
      patients: {
        total: totalPatients,
        newToday: newPatientsToday,
        newThisMonth: newPatientsMonth,
      },
      appointments: {
        today: todayAppts,
        completed: completedAppts,
        cancelled: cancelledAppts,
        scheduled: scheduledAppts,
        pending: pendingAppts,
      },
      staff: {
        total: totalStaff,
        active: activeStaff,
        doctors: totalDoctors,
        activeDoctors,
      },
      finance: {
        revenueToday: todayRevenue._sum?.total || 0,
        revenueMonth: monthRevenue._sum?.total || 0,
        pendingBills,
      },
      inventory: {
        lowStockCount,
        expiringSoonCount,
      },
      followUps: {
        today: todayFollowUps,
        pending: pendingFollowUps,
      },
      treatmentPlans: {
        active: activeTreatmentPlans,
        completed: completedTreatmentPlans,
        totalRevenue: treatmentRevenue._sum?.paidAmount || 0,
      },
      monthlyTrends,
      recentPatients,
      doctorsOnDuty,
      generatedAt: new Date().toISOString(),
    }, "Dashboard overview fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
