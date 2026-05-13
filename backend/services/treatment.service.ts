import { treatmentRepo } from "../repositories/treatment.repo";
import { serviceRepo } from "../repositories/service.repo";
import type { CreateTreatmentPlanInput, UpdateTreatmentPlanInput, QueryTreatmentPlanInput, CreateTreatmentSessionInput, UpdateTreatmentSessionInput } from "../validations/treatment.validation";
import { notifyTreatmentPlanCreated, notifyTreatmentSessionCompleted, notifyTreatmentPlanCompleted } from "./notification.service";

export const treatmentService = {
  // ============================================================================
  // TREATMENT PLAN OPERATIONS
  // ============================================================================
  async createTreatmentPlan(hospitalId: string, data: CreateTreatmentPlanInput) {
    // If service is selected, auto-populate sessions and cost
    if (data.serviceId) {
      const service = await serviceRepo.findById(data.serviceId, hospitalId);
      if (!service) {
        throw new Error("Service not found");
      }

      // Auto-set values from service if not provided
      if (!data.totalSessions) data.totalSessions = service.sessionCount;
      if (!data.totalCost) data.totalCost = service.price;
      if (!data.planName) data.planName = service.name;
    }

    const plan = await treatmentRepo.createPlan(hospitalId, data);

    // Auto-create sessions if totalSessions > 0
    if (plan.totalSessions > 0) {
      const sessions = [];
      for (let i = 1; i <= plan.totalSessions; i++) {
        sessions.push({
          treatmentPlanId: plan.id,
          sessionNumber: i,
        });
      }

      await Promise.all(
        sessions.map((session) =>
          treatmentRepo.createSession(hospitalId, session)
        )
      );
    }

    // Fire notification (fire-and-forget)
    notifyTreatmentPlanCreated(hospitalId, {
      patientName: (plan as any).patient?.name || "Patient",
      planName: plan.planName,
      totalSessions: plan.totalSessions,
      totalCost: plan.totalCost,
    });

    return plan;
  },

  async getTreatmentPlan(id: string, hospitalId: string) {
    const plan = await treatmentRepo.findPlanById(id, hospitalId);
    if (!plan) {
      throw new Error("Treatment plan not found");
    }
    return plan;
  },

  async getTreatmentPlans(hospitalId: string, query: QueryTreatmentPlanInput) {
    return await treatmentRepo.findPlans(hospitalId, query);
  },

  async updateTreatmentPlan(id: string, hospitalId: string, data: UpdateTreatmentPlanInput) {
    const existing = await treatmentRepo.findPlanById(id, hospitalId);
    if (!existing) {
      throw new Error("Treatment plan not found");
    }

    return await treatmentRepo.updatePlan(id, hospitalId, data);
  },

  async deleteTreatmentPlan(id: string, hospitalId: string) {
    const plan = await treatmentRepo.findPlanById(id, hospitalId);
    if (!plan) {
      throw new Error("Treatment plan not found");
    }

    // Only allow deletion if no sessions are completed
    const completedSessions = plan.sessions?.filter((s: any) => s.status === "COMPLETED").length || 0;
    if (completedSessions > 0) {
      throw new Error("Cannot delete treatment plan with completed sessions");
    }

    return await treatmentRepo.deletePlan(id, hospitalId);
  },

  async getTreatmentPlanStats(hospitalId: string, filters?: { departmentId?: string; subDepartmentId?: string; doctorId?: string }) {
    return await treatmentRepo.getPlanStats(hospitalId, filters);
  },

  async getPatientTreatmentPlans(hospitalId: string, patientId: string) {
    return await treatmentRepo.findPlans(hospitalId, {
      patientId,
      page: 1,
      limit: 100,
    });
  },

  // ============================================================================
  // TREATMENT SESSION OPERATIONS
  // ============================================================================
  async createTreatmentSession(hospitalId: string, data: CreateTreatmentSessionInput) {
    // Check if treatment plan exists
    const plan = await treatmentRepo.findPlanById(data.treatmentPlanId, hospitalId);
    if (!plan) {
      throw new Error("Treatment plan not found");
    }

    return await treatmentRepo.createSession(hospitalId, data);
  },

  async getTreatmentSession(id: string, hospitalId: string) {
    const session = await treatmentRepo.findSessionById(id, hospitalId);
    if (!session) {
      throw new Error("Treatment session not found");
    }
    return session;
  },

  async getPlanSessions(treatmentPlanId: string, hospitalId: string) {
    return await treatmentRepo.findSessionsByPlan(treatmentPlanId, hospitalId);
  },

  async updateTreatmentSession(id: string, hospitalId: string, data: UpdateTreatmentSessionInput) {
    const existing = await treatmentRepo.findSessionById(id, hospitalId);
    if (!existing) {
      throw new Error("Treatment session not found");
    }

    const wasCompleted = existing.status === "COMPLETED";
    const willBeCompleted = data.status === "COMPLETED";

    if (!wasCompleted && willBeCompleted && !data.completedDate) {
      data = { ...data, completedDate: new Date().toISOString() };
    }

    const session = await treatmentRepo.updateSession(id, hospitalId, data);

    if (wasCompleted !== willBeCompleted && existing.treatmentPlanId) {
      const planId = existing.treatmentPlanId;
      const allSessions = await treatmentRepo.findSessionsByPlan(planId, hospitalId);
      const completedCount = allSessions.filter((s: any) => s.status === "COMPLETED").length;
      const planUpdate: any = { completedSessions: completedCount };
      if (completedCount >= allSessions.length && completedCount > 0) {
        planUpdate.status = "COMPLETED";
      } else if (completedCount < allSessions.length) {
        const currentPlan = await treatmentRepo.findPlanById(planId, hospitalId);
        if (currentPlan?.status === "COMPLETED") planUpdate.status = "ACTIVE";
      }
      await treatmentRepo.updatePlan(planId, hospitalId, { id: planId, ...planUpdate });

      // Notify on session complete or plan complete
      if (!wasCompleted && willBeCompleted) {
        const plan = await treatmentRepo.findPlanById(planId, hospitalId);
        if (plan) {
          notifyTreatmentSessionCompleted(hospitalId, {
            patientName: (plan as any).patient?.name || "Patient",
            planName: plan.planName,
            sessionNumber: existing.sessionNumber,
            totalSessions: plan.totalSessions,
          });
          if (planUpdate.status === "COMPLETED") {
            notifyTreatmentPlanCompleted(hospitalId, {
              patientName: (plan as any).patient?.name || "Patient",
              planName: plan.planName,
            });
          }
        }
      }
    }

    return session;
  },

  async deleteTreatmentSession(id: string, hospitalId: string) {
    const session = await treatmentRepo.findSessionById(id, hospitalId);
    if (!session) {
      throw new Error("Treatment session not found");
    }

    // Don't allow deletion of completed sessions
    if (session.status === "COMPLETED") {
      throw new Error("Cannot delete completed session");
    }

    return await treatmentRepo.deleteSession(id, hospitalId);
  },

  async completeSession(id: string, hospitalId: string, performedBy: string, notes?: string) {
    const session = await treatmentRepo.findSessionById(id, hospitalId);
    if (!session) {
      throw new Error("Treatment session not found");
    }

    if (session.status === "COMPLETED") {
      throw new Error("Session is already completed");
    }

    return await treatmentRepo.completeSession(id, hospitalId, performedBy, notes);
  },

  async getUpcomingSessions(hospitalId: string, filters?: { departmentId?: string; subDepartmentId?: string; doctorId?: string }) {
    return await treatmentRepo.getUpcomingSessions(hospitalId, filters);
  },

  async scheduleSession(id: string, hospitalId: string, scheduledDate: string, appointmentId?: string) {
    return await treatmentRepo.updateSession(id, hospitalId, {
      id,
      scheduledDate,
      appointmentId,
      status: "SCHEDULED",
    });
  },

  async rescheduleSession(id: string, hospitalId: string, newDate: string) {
    return await treatmentRepo.updateSession(id, hospitalId, {
      id,
      scheduledDate: newDate,
      status: "RESCHEDULED",
    });
  },

  async markSessionMissed(id: string, hospitalId: string) {
    return await treatmentRepo.updateSession(id, hospitalId, {
      id,
      status: "MISSED",
    });
  },

  async cancelSession(id: string, hospitalId: string, reason?: string) {
    return await treatmentRepo.updateSession(id, hospitalId, {
      id,
      status: "CANCELLED",
      notes: reason,
    });
  },
};
