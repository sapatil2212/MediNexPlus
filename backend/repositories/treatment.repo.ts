import prisma from "../config/db";
import type { CreateTreatmentPlanInput, UpdateTreatmentPlanInput, QueryTreatmentPlanInput, CreateTreatmentSessionInput, UpdateTreatmentSessionInput } from "../validations/treatment.validation";

export const treatmentRepo = {
  // ============================================================================
  // TREATMENT PLAN OPERATIONS
  // ============================================================================
  async createPlan(hospitalId: string, data: CreateTreatmentPlanInput) {
    return await (prisma as any).treatmentPlan.create({
      data: {
        ...data,
        hospitalId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        patient: { select: { id: true, patientId: true, name: true, phone: true } },
        service: { select: { id: true, name: true, sessionCount: true, price: true } },
        procedure: { select: { id: true, name: true, fee: true } },
        department: { select: { id: true, name: true } },
        subDepartment: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
        _count: { select: { sessions: true } },
      },
    });
  },

  async findPlanById(id: string, hospitalId: string) {
    return await (prisma as any).treatmentPlan.findFirst({
      where: { id, hospitalId },
      include: {
        patient: { select: { id: true, patientId: true, name: true, phone: true, email: true } },
        service: { select: { id: true, name: true, sessionCount: true, price: true } },
        procedure: { select: { id: true, name: true, fee: true } },
        department: { select: { id: true, name: true } },
        subDepartment: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
        sessions: {
          orderBy: { sessionNumber: "asc" },
          include: {
            appointment: { select: { id: true, appointmentDate: true, timeSlot: true } },
          },
        },
      },
    });
  },

  async findPlans(hospitalId: string, query: QueryTreatmentPlanInput) {
    const { patientId, departmentId, subDepartmentId, doctorId, status, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { hospitalId };

    if (patientId) where.patientId = patientId;
    if (departmentId) where.departmentId = departmentId;
    if (subDepartmentId) where.subDepartmentId = subDepartmentId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { planName: { contains: search, mode: "insensitive" } },
        { patient: { name: { contains: search, mode: "insensitive" } } },
        { patient: { phone: { contains: search } } },
      ];
    }

    const [plans, total] = await Promise.all([
      (prisma as any).treatmentPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { id: true, patientId: true, name: true, phone: true } },
          service: { select: { id: true, name: true } },
          procedure: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          subDepartment: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true } },
          _count: { select: { sessions: true } },
        },
      }),
      (prisma as any).treatmentPlan.count({ where }),
    ]);

    return {
      plans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async updatePlan(id: string, hospitalId: string, data: UpdateTreatmentPlanInput) {
    const { id: _, ...updateData } = data;
    
    const processedData: any = { ...updateData };
    if (updateData.startDate) processedData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) processedData.endDate = new Date(updateData.endDate);

    return await (prisma as any).treatmentPlan.update({
      where: { id, hospitalId },
      data: processedData,
      include: {
        patient: { select: { id: true, patientId: true, name: true } },
        service: { select: { id: true, name: true } },
        _count: { select: { sessions: true } },
      },
    });
  },

  async deletePlan(id: string, hospitalId: string) {
    return await (prisma as any).treatmentPlan.delete({
      where: { id, hospitalId },
    });
  },

  async getPlanStats(hospitalId: string, filters?: { departmentId?: string; subDepartmentId?: string; doctorId?: string }) {
    const where: any = { hospitalId, ...filters };

    const [total, active, completed, cancelled, onHold, revenue] = await Promise.all([
      (prisma as any).treatmentPlan.count({ where }),
      (prisma as any).treatmentPlan.count({ where: { ...where, status: "ACTIVE" } }),
      (prisma as any).treatmentPlan.count({ where: { ...where, status: "COMPLETED" } }),
      (prisma as any).treatmentPlan.count({ where: { ...where, status: "CANCELLED" } }),
      (prisma as any).treatmentPlan.count({ where: { ...where, status: "ON_HOLD" } }),
      (prisma as any).treatmentPlan.aggregate({
        where: { ...where, status: { in: ["ACTIVE", "COMPLETED"] } },
        _sum: { totalCost: true, paidAmount: true },
      }),
    ]);

    return {
      total,
      active,
      completed,
      cancelled,
      onHold,
      totalRevenue: revenue._sum.totalCost || 0,
      collectedRevenue: revenue._sum.paidAmount || 0,
      pendingRevenue: (revenue._sum.totalCost || 0) - (revenue._sum.paidAmount || 0),
    };
  },

  // ============================================================================
  // TREATMENT SESSION OPERATIONS
  // ============================================================================
  async createSession(hospitalId: string, data: CreateTreatmentSessionInput) {
    return await (prisma as any).treatmentSession.create({
      data: {
        ...data,
        hospitalId,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      },
      include: {
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
            patient: { select: { id: true, name: true } },
          },
        },
        appointment: { select: { id: true, appointmentDate: true, timeSlot: true } },
      },
    });
  },

  async findSessionById(id: string, hospitalId: string) {
    return await (prisma as any).treatmentSession.findFirst({
      where: { id, hospitalId },
      include: {
        treatmentPlan: {
          include: {
            patient: { select: { id: true, patientId: true, name: true, phone: true } },
            service: { select: { id: true, name: true } },
          },
        },
        appointment: true,
      },
    });
  },

  async findSessionsByPlan(treatmentPlanId: string, hospitalId: string) {
    return await (prisma as any).treatmentSession.findMany({
      where: { treatmentPlanId, hospitalId },
      orderBy: { sessionNumber: "asc" },
      include: {
        appointment: { select: { id: true, appointmentDate: true, timeSlot: true, status: true } },
      },
    });
  },

  async updateSession(id: string, hospitalId: string, data: UpdateTreatmentSessionInput) {
    const { id: _, ...updateData } = data;
    
    const processedData: any = { ...updateData };
    if (updateData.completedDate) processedData.completedDate = new Date(updateData.completedDate);

    return await (prisma as any).treatmentSession.update({
      where: { id, hospitalId },
      data: processedData,
      include: {
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
            patient: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async deleteSession(id: string, hospitalId: string) {
    return await (prisma as any).treatmentSession.delete({
      where: { id, hospitalId },
    });
  },

  async getUpcomingSessions(hospitalId: string, filters?: { departmentId?: string; subDepartmentId?: string; doctorId?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      hospitalId,
      status: "SCHEDULED",
      scheduledDate: { gte: today },
    };

    if (filters?.departmentId || filters?.subDepartmentId || filters?.doctorId) {
      where.treatmentPlan = {};
      if (filters.departmentId) where.treatmentPlan.departmentId = filters.departmentId;
      if (filters.subDepartmentId) where.treatmentPlan.subDepartmentId = filters.subDepartmentId;
      if (filters.doctorId) where.treatmentPlan.doctorId = filters.doctorId;
    }

    return await (prisma as any).treatmentSession.findMany({
      where,
      orderBy: { scheduledDate: "asc" },
      take: 50,
      include: {
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
            patient: { select: { id: true, patientId: true, name: true, phone: true } },
          },
        },
        appointment: { select: { id: true, appointmentDate: true, timeSlot: true } },
      },
    });
  },

  async completeSession(id: string, hospitalId: string, performedBy: string, notes?: string) {
    const session = await (prisma as any).treatmentSession.update({
      where: { id, hospitalId },
      data: {
        status: "COMPLETED",
        completedDate: new Date(),
        performedBy,
        notes,
      },
    });

    // Update treatment plan completed sessions count
    const plan = await (prisma as any).treatmentPlan.findUnique({
      where: { id: session.treatmentPlanId },
      select: { completedSessions: true, totalSessions: true },
    });

    const newCompletedCount = plan.completedSessions + 1;
    const updateData: any = { completedSessions: newCompletedCount };

    // Auto-complete plan if all sessions done
    if (newCompletedCount >= plan.totalSessions) {
      updateData.status = "COMPLETED";
    }

    await (prisma as any).treatmentPlan.update({
      where: { id: session.treatmentPlanId },
      data: updateData,
    });

    return session;
  },
};
