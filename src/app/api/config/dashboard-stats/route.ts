import { NextRequest, NextResponse } from "next/server";
import { withAuth, createUnauthorizedError } from "../../../../../backend/middlewares/permission.middleware";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authReq = withAuth(req);
    if (!authReq.user) return createUnauthorizedError();

    const hospitalId = authReq.user.hospitalId;
    const db = prisma as any;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalServices,
      activeServices,
      totalPlans,
      activePlans,
      completedPlans,
      totalSessions,
      completedSessions,
      scheduledSessions,
      totalDepts,
      activeDepts,
      todayAppts,
      byCategory,
      recentPlans,
    ] = await Promise.all([
      db.service.count({ where: { hospitalId } }),
      db.service.count({ where: { hospitalId, isActive: true } }),
      db.treatmentPlan.count({ where: { hospitalId } }),
      db.treatmentPlan.count({ where: { hospitalId, status: "ACTIVE" } }),
      db.treatmentPlan.count({ where: { hospitalId, status: "COMPLETED" } }),
      db.treatmentSession.count({ where: { hospitalId } }),
      db.treatmentSession.count({ where: { hospitalId, status: "COMPLETED" } }),
      db.treatmentSession.count({ where: { hospitalId, status: "SCHEDULED" } }),
      db.department.count({ where: { hospitalId } }),
      db.department.count({ where: { hospitalId, isActive: true } }),
      db.appointment.count({
        where: { hospitalId, appointmentDate: { gte: today, lt: tomorrow } },
      }),
      db.service.groupBy({
        by: ["category"],
        where: { hospitalId },
        _count: true,
        _sum: { price: true },
      }),
      db.treatmentPlan.findMany({
        where: { hospitalId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          planName: true,
          status: true,
          totalSessions: true,
          completedSessions: true,
          totalCost: true,
          paidAmount: true,
          patient: { select: { name: true, patientId: true } },
          service: { select: { name: true } },
        },
      }),
    ]);

    const totalRevenuePotential = await db.treatmentPlan.aggregate({
      where: { hospitalId },
      _sum: { totalCost: true, paidAmount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        services: {
          total: totalServices,
          active: activeServices,
          inactive: totalServices - activeServices,
          byCategory: byCategory.map((c: any) => ({
            category: c.category,
            count: c._count,
            totalValue: c._sum?.price || 0,
          })),
        },
        treatmentPlans: {
          total: totalPlans,
          active: activePlans,
          completed: completedPlans,
          other: totalPlans - activePlans - completedPlans,
          totalRevenue: totalRevenuePotential._sum?.totalCost || 0,
          collectedRevenue: totalRevenuePotential._sum?.paidAmount || 0,
        },
        sessions: {
          total: totalSessions,
          completed: completedSessions,
          scheduled: scheduledSessions,
          completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        },
        departments: {
          total: totalDepts,
          active: activeDepts,
        },
        today: {
          appointments: todayAppts,
        },
        recentPlans,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
