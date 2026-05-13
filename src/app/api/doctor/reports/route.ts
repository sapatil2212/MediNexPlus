import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "DOCTOR") return errorResponse("Forbidden", 403);

  try {
    // Get doctor record
    const doctor = await (prisma as any).doctor.findFirst({
      where: { userId: user!.userId },
      select: { id: true, hospitalId: true, departmentId: true, name: true, specialization: true, consultationFee: true },
    });
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const doctorId = doctor.id;
    const hospitalId = doctor.hospitalId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // --- Appointment aggregates ---
    const allAppointments = await (prisma as any).appointment.findMany({
      where: { hospitalId, doctorId },
      select: {
        id: true, appointmentDate: true, timeSlot: true, type: true, status: true,
        consultationFee: true, createdAt: true,
        patient: { select: { id: true, name: true, patientId: true, gender: true } },
      },
      orderBy: { appointmentDate: "desc" },
      take: 500,
    });

    const totalAppointments = allAppointments.length;
    const todayAppointments = allAppointments.filter((a: any) => {
      const d = new Date(a.appointmentDate); d.setHours(0, 0, 0, 0);
      return d.getTime() === todayStart.getTime();
    });
    const todayCount = todayAppointments.length;
    const todayCompleted = todayAppointments.filter((a: any) => a.status === "COMPLETED").length;

    // --- By status ---
    const byStatus: Record<string, number> = {};
    for (const a of allAppointments) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    }

    // --- By type ---
    const byType: Record<string, number> = {};
    for (const a of allAppointments) {
      byType[a.type] = (byType[a.type] || 0) + 1;
    }

    // --- Revenue ---
    const totalRevenue = allAppointments
      .filter((a: any) => a.status === "COMPLETED")
      .reduce((s: number, a: any) => s + (a.consultationFee || 0), 0);
    const todayRevenue = todayAppointments
      .filter((a: any) => a.status === "COMPLETED")
      .reduce((s: number, a: any) => s + (a.consultationFee || 0), 0);

    // --- Unique patients ---
    const patientSet = new Set<string>();
    for (const a of allAppointments) {
      if (a.patient?.id) patientSet.add(a.patient.id);
    }
    const totalPatients = patientSet.size;

    // --- Daily trend (last 30 days) ---
    const dailyMap: Record<string, { count: number; completed: number; revenue: number }> = {};
    for (const a of allAppointments) {
      const day = new Date(a.appointmentDate).toISOString().slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { count: 0, completed: 0, revenue: 0 };
      dailyMap[day].count++;
      if (a.status === "COMPLETED") {
        dailyMap[day].completed++;
        dailyMap[day].revenue += a.consultationFee || 0;
      }
    }
    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({
        date: key,
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        count: dailyMap[key]?.count || 0,
        completed: dailyMap[key]?.completed || 0,
        revenue: dailyMap[key]?.revenue || 0,
      });
    }

    // --- Monthly trend (last 6 months) ---
    const monthlyMap: Record<string, { count: number; completed: number; revenue: number }> = {};
    for (const a of allAppointments) {
      const month = new Date(a.appointmentDate).toISOString().slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { count: 0, completed: 0, revenue: 0 };
      monthlyMap[month].count++;
      if (a.status === "COMPLETED") {
        monthlyMap[month].completed++;
        monthlyMap[month].revenue += a.consultationFee || 0;
      }
    }
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      monthlyTrend.push({
        month: key,
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        count: monthlyMap[key]?.count || 0,
        completed: monthlyMap[key]?.completed || 0,
        revenue: monthlyMap[key]?.revenue || 0,
      });
    }

    // --- Hourly distribution (what times are busiest) ---
    const hourlyMap: Record<string, number> = {};
    for (const a of allAppointments) {
      if (a.timeSlot) {
        const hour = a.timeSlot.split(":")[0] + ":00";
        hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
      }
    }
    const hourlyDistribution = Object.entries(hourlyMap)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // --- Gender distribution of patients ---
    const genderMap: Record<string, number> = {};
    const seenPatients = new Set<string>();
    for (const a of allAppointments) {
      if (a.patient?.id && !seenPatients.has(a.patient.id)) {
        seenPatients.add(a.patient.id);
        const g = a.patient.gender || "Unknown";
        genderMap[g] = (genderMap[g] || 0) + 1;
      }
    }

    // --- Follow-ups ---
    const [followUpStats] = await Promise.all([
      (prisma as any).followUp.aggregate({
        where: { hospitalId, appointment: { doctorId } },
        _count: { id: true },
      }).catch(() => ({ _count: { id: 0 } })),
    ]);

    // --- Treatment plans ---
    const [planStats, activePlans] = await Promise.all([
      (prisma as any).treatmentPlan.aggregate({
        where: { doctorId },
        _count: { id: true },
        _sum: { totalCost: true, paidAmount: true },
      }).catch(() => ({ _count: { id: 0 }, _sum: { totalCost: 0, paidAmount: 0 } })),
      (prisma as any).treatmentPlan.count({
        where: { doctorId, status: "ACTIVE" },
      }).catch(() => 0),
    ]);

    // --- Recent appointments (last 10 completed) ---
    const recentCompleted = allAppointments
      .filter((a: any) => a.status === "COMPLETED")
      .slice(0, 10)
      .map((a: any) => ({
        id: a.id,
        patientName: a.patient?.name || "—",
        patientId: a.patient?.patientId || "—",
        type: a.type,
        date: a.appointmentDate,
        timeSlot: a.timeSlot,
        fee: a.consultationFee || 0,
      }));

    // --- Completion rate ---
    const completedTotal = byStatus["COMPLETED"] || 0;
    const cancelledTotal = byStatus["CANCELLED"] || 0;
    const noShowTotal = byStatus["NO_SHOW"] || 0;
    const completionRate = totalAppointments > 0 ? Math.round((completedTotal / totalAppointments) * 100) : 0;

    return successResponse({
      summary: {
        totalAppointments,
        todayAppointments: todayCount,
        todayCompleted,
        totalRevenue,
        todayRevenue,
        totalPatients,
        completionRate,
        avgRevenuePerVisit: completedTotal > 0 ? Math.round(totalRevenue / completedTotal) : 0,
        totalFollowUps: followUpStats._count?.id || 0,
        totalPlans: planStats._count?.id || 0,
        activePlans,
        planRevenue: planStats._sum?.totalCost || 0,
        planCollected: planStats._sum?.paidAmount || 0,
      },
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      genderDistribution: Object.entries(genderMap).map(([gender, count]) => ({ gender, count })),
      hourlyDistribution,
      dailyTrend,
      monthlyTrend,
      recentCompleted,
    }, "Doctor reports fetched");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to fetch reports", 500);
  }
}
