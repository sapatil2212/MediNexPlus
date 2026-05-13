import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile, SubDeptServiceError } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const subDeptId = (profile as any).id;
    const hospitalId = (profile as any).hospitalId;
    const isReception = (profile as any).type === "RECEPTION";
    const isOPD = ["OPD", "DENTAL", "GENERAL_MEDICINE", "DERMATOLOGY", "HAIR", "ONCOLOGY", "CARDIOLOGY", "COSMETIC", "PHYSIOTHERAPY", "DIALYSIS", "GYNECOLOGY", "PEDIATRICS"].includes((profile as any).type);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (isReception) {
      // --- Reception Specific Logic ---
      const [totalAppts, todayAppts, totalPatients, todayPatients, apptStatuses, allAppts, allPatients] = await Promise.all([
         (prisma as any).appointment.count({ where: { hospitalId } }),
         (prisma as any).appointment.count({ where: { hospitalId, appointmentDate: { gte: todayStart } } }),
         (prisma as any).patient.count({ where: { hospitalId } }),
         (prisma as any).patient.count({ where: { hospitalId, createdAt: { gte: todayStart } } }),
         (prisma as any).appointment.groupBy({
           where: { hospitalId },
           by: ["status"],
           _count: { id: true }
         }),
         (prisma as any).appointment.findMany({
           where: { hospitalId },
           orderBy: { appointmentDate: "desc" },
           take: 1000,
           select: { appointmentDate: true, status: true }
         }),
         (prisma as any).patient.findMany({
           where: { hospitalId },
           orderBy: { createdAt: "desc" },
           take: 1000,
           select: { createdAt: true }
         })
       ]);
 
       const dailyMap: Record<string, { appts: number; patients: number }> = {};
       const statusMap: Record<string, number> = {};
 
       for (const a of allAppts) {
         if (!a.appointmentDate) continue;
         const day = new Date(a.appointmentDate).toISOString().slice(0, 10);
         if (!dailyMap[day]) dailyMap[day] = { appts: 0, patients: 0 };
         dailyMap[day].appts++;
       }
      for (const p of allPatients) {
        const day = new Date(p.createdAt).toISOString().slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { appts: 0, patients: 0 };
        dailyMap[day].patients++;
      }

      const dailyTrend = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dailyTrend.push({
          date: key,
          label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          count: dailyMap[key]?.appts || 0,
          patients: dailyMap[key]?.patients || 0,
        });
      }

      const STATUS_COLORS: Record<string, string> = { 
        BOOKED: "#3b82f6", 
        ARRIVED: "#8b5cf6", 
        COMPLETED: "#10b981", 
        CANCELLED: "#ef4444", 
        PENDING: "#f59e0b" 
      };

      return successResponse({
        isReception: true,
        summary: {
          totalAppointments: totalAppts,
          todayAppointments: todayAppts,
          totalPatients: totalPatients,
          todayPatients: todayPatients,
          avgApptsPerDay: totalAppts > 30 ? Math.round(totalAppts / 30) : totalAppts,
        },
        byStatus: apptStatuses.map((s: any) => ({ 
          name: s.status, 
          value: s._count.id,
          fill: STATUS_COLORS[s.status] || "#94a3b8"
        })),
        dailyTrend,
      }, "Reception reports fetched");
    }

    // --- OPD / Appointment-based departments ---
    if (isOPD) {
      const deptIdForQuery = (profile as any).departmentId || null;
      const apptWhereClause = deptIdForQuery
        ? { hospitalId, departmentId: deptIdForQuery }
        : { hospitalId, subDepartmentId: subDeptId };
      const allAppointments = await (prisma as any).appointment.findMany({
        where: apptWhereClause,
        select: {
          id: true, appointmentDate: true, timeSlot: true, type: true, status: true,
          consultationFee: true,
          patient: { select: { id: true, name: true, patientId: true, gender: true } },
        },
        orderBy: { appointmentDate: "desc" },
        take: 500,
      });

      const totalAppointments = allAppointments.length;
      const todayAppts = allAppointments.filter((a: any) => {
        const d = new Date(a.appointmentDate); d.setHours(0,0,0,0);
        return d.getTime() === todayStart.getTime();
      });

      const totalRevenue = allAppointments.filter((a: any) => a.status === "COMPLETED").reduce((s: number, a: any) => s + (a.consultationFee || 0), 0);
      const todayRevenue = todayAppts.filter((a: any) => a.status === "COMPLETED").reduce((s: number, a: any) => s + (a.consultationFee || 0), 0);

      const byStatusMap: Record<string, number> = {};
      const byTypeMap: Record<string, number> = {};
      const dailyMap: Record<string, { count: number; revenue: number }> = {};
      const monthlyMap: Record<string, { count: number; revenue: number }> = {};
      const hourlyMap: Record<string, number> = {};
      const genderMap: Record<string, number> = {};
      const seenPatients = new Set<string>();

      for (const a of allAppointments) {
        byStatusMap[a.status] = (byStatusMap[a.status] || 0) + 1;
        byTypeMap[a.type] = (byTypeMap[a.type] || 0) + 1;

        const day = new Date(a.appointmentDate).toISOString().slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { count: 0, revenue: 0 };
        dailyMap[day].count++;
        if (a.status === "COMPLETED") dailyMap[day].revenue += a.consultationFee || 0;

        const month = new Date(a.appointmentDate).toISOString().slice(0, 7);
        if (!monthlyMap[month]) monthlyMap[month] = { count: 0, revenue: 0 };
        monthlyMap[month].count++;
        if (a.status === "COMPLETED") monthlyMap[month].revenue += a.consultationFee || 0;

        if (a.timeSlot) {
          const hour = a.timeSlot.split(":")[0] + ":00";
          hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
        }

        if (a.patient?.id && !seenPatients.has(a.patient.id)) {
          seenPatients.add(a.patient.id);
          const g = a.patient.gender || "Unknown";
          genderMap[g] = (genderMap[g] || 0) + 1;
        }
      }

      const dailyTrendOPD = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dailyTrendOPD.push({ date: key, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), count: dailyMap[key]?.count || 0, revenue: dailyMap[key]?.revenue || 0 });
      }

      const monthlyTrendOPD = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = d.toISOString().slice(0, 7);
        monthlyTrendOPD.push({ month: key, label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), count: monthlyMap[key]?.count || 0, revenue: monthlyMap[key]?.revenue || 0 });
      }

      const completedCount = byStatusMap["COMPLETED"] || 0;
      const completionRate = totalAppointments > 0 ? Math.round((completedCount / totalAppointments) * 100) : 0;

      const activePlans = await (prisma as any).treatmentPlan.count({ where: { hospitalId, status: "ACTIVE" } }).catch(() => 0);

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

      return successResponse({
        isOPD: true,
        summary: {
          totalAppointments,
          todayAppointments: todayAppts.length,
          totalRevenue,
          todayRevenue,
          totalPatients: seenPatients.size,
          completionRate,
          avgRevenuePerVisit: completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0,
          activePlans,
        },
        byStatus: Object.entries(byStatusMap).map(([status, count]) => ({ status, count })),
        byType: Object.entries(byTypeMap).map(([type, count]) => ({ type, count })),
        genderDistribution: Object.entries(genderMap).map(([gender, count]) => ({ gender, count })),
        hourlyDistribution: Object.entries(hourlyMap).map(([hour, count]) => ({ hour, count })).sort((a, b) => a.hour.localeCompare(b.hour)),
        dailyTrend: dailyTrendOPD,
        monthlyTrend: monthlyTrendOPD,
        recentCompleted,
      }, "OPD reports fetched");
    }

    // --- Original Logic for other departments ---
    // --- Aggregate stats ---
    const [allStats, todayStats, procedureCount, activeProcedureCount] = await Promise.all([
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
      (prisma as any).procedure.count({ where: { hospitalId, subDepartmentId: subDeptId } }),
      (prisma as any).procedure.count({ where: { hospitalId, subDepartmentId: subDeptId, isActive: true } }),
    ]);

    // --- Procedures by type (pie chart) ---
    const allRecords = await (prisma as any).procedureRecord.findMany({
      where: { hospitalId, subDepartmentId: subDeptId },
      include: {
        procedure: { select: { name: true, type: true } },
        patient: { select: { id: true, name: true, patientId: true, gender: true } },
      },
      orderBy: { performedAt: "desc" },
      take: 500,
    });

    const byType: Record<string, { count: number; revenue: number }> = {};
    const byProcedure: Record<string, { count: number; revenue: number; type: string }> = {};
    const byStatus: Record<string, number> = {};
    const byPerformer: Record<string, { count: number; revenue: number }> = {};
    const dailyMap: Record<string, { count: number; revenue: number }> = {};
    const monthlyMap: Record<string, { count: number; revenue: number }> = {};

    for (const r of allRecords) {
      const type = r.procedure?.type || "UNKNOWN";
      const name = r.procedure?.name || "Unknown";
      const status = r.status || "COMPLETED";
      const performer = r.performedBy || "Unknown";
      const amt = r.amount || 0;

      // By type
      if (!byType[type]) byType[type] = { count: 0, revenue: 0 };
      byType[type].count++;
      byType[type].revenue += amt;

      // By procedure name
      if (!byProcedure[name]) byProcedure[name] = { count: 0, revenue: 0, type };
      byProcedure[name].count++;
      byProcedure[name].revenue += amt;

      // By status
      byStatus[status] = (byStatus[status] || 0) + 1;

      // By performer
      if (!byPerformer[performer]) byPerformer[performer] = { count: 0, revenue: 0 };
      byPerformer[performer].count++;
      byPerformer[performer].revenue += amt;

      // Daily (last 30 days)
      const day = new Date(r.performedAt).toISOString().slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { count: 0, revenue: 0 };
      dailyMap[day].count++;
      dailyMap[day].revenue += amt;

      // Monthly
      const month = new Date(r.performedAt).toISOString().slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { count: 0, revenue: 0 };
      monthlyMap[month].count++;
      monthlyMap[month].revenue += amt;
    }

    // Fill last 30 days for daily trend
    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
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

    // Fill last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      monthlyTrend.push({
        month: key,
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        count: monthlyMap[key]?.count || 0,
        revenue: monthlyMap[key]?.revenue || 0,
      });
    }

    // --- Hourly distribution ---
    const hourlyMap: Record<string, number> = {};
    for (const r of allRecords) {
      if (r.performedAt) {
        const hour = new Date(r.performedAt).getHours();
        const label = `${String(hour).padStart(2, "0")}:00`;
        hourlyMap[label] = (hourlyMap[label] || 0) + 1;
      }
    }
    const hourlyDistribution = Object.entries(hourlyMap)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // --- Gender distribution from patients ---
    const genderMap: Record<string, number> = {};
    const seenPatients = new Set<string>();
    for (const r of allRecords) {
      if (r.patientId && !seenPatients.has(r.patientId)) {
        seenPatients.add(r.patientId);
        const g = r.patient?.gender || "Unknown";
        genderMap[g] = (genderMap[g] || 0) + 1;
      }
    }
    const genderDistribution = Object.entries(genderMap).map(([gender, count]) => ({ gender, count }));

    // Queue stats
    const totalReferred = await (prisma as any).appointment.count({
      where: { hospitalId, subDepartmentId: subDeptId },
    });
    const todayReferred = await (prisma as any).appointment.count({
      where: { hospitalId, subDepartmentId: subDeptId, appointmentDate: { gte: todayStart } },
    });

    // Procedure records for "recent" table (last 10)
    const recentRecords = allRecords.slice(0, 10).map((r: any) => ({
      id: r.id,
      patientName: r.patient?.name || "—",
      patientId: r.patient?.patientId || "—",
      procedureName: r.procedure?.name || "—",
      procedureType: r.procedure?.type || "—",
      amount: r.amount,
      status: r.status,
      performedBy: r.performedBy || "—",
      performedAt: r.performedAt,
    }));

    // Top procedures by count
    const topProcedures = Object.entries(byProcedure)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Performers leaderboard
    const performers = Object.entries(byPerformer)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return successResponse({
      summary: {
        totalRecords: allStats._count.id || 0,
        totalRevenue: allStats._sum.amount || 0,
        todayRecords: todayStats._count.id || 0,
        todayRevenue: todayStats._sum.amount || 0,
        totalProcedures: procedureCount,
        activeProcedures: activeProcedureCount,
        totalReferred: totalReferred,
        todayReferred: todayReferred,
        avgRevenuePerRecord: allStats._count.id ? Math.round((allStats._sum.amount || 0) / allStats._count.id) : 0,
      },
      byType: Object.entries(byType).map(([type, d]) => ({ type, ...d })),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      dailyTrend,
      monthlyTrend,
      topProcedures,
      performers,
      recentRecords,
      hourlyDistribution,
      genderDistribution,
    }, "Reports data fetched");
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed to fetch reports", 500);
  }
}
