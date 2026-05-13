import { serviceRepo } from "../repositories/service.repo";
import type { CreateServiceInput, UpdateServiceInput, QueryServiceInput } from "../validations/service.validation";

export const serviceService = {
  async createService(hospitalId: string, data: CreateServiceInput) {
    // Check if code already exists
    if (data.code) {
      const codeExists = await serviceRepo.checkCodeExists(hospitalId, data.code);
      if (codeExists) {
        throw new Error(`Service code '${data.code}' already exists`);
      }
    }

    // Auto-calculate pricePerSession if not provided
    if (!data.pricePerSession && data.price && data.sessionCount) {
      data.pricePerSession = data.price / data.sessionCount;
    }

    return await serviceRepo.create(hospitalId, data);
  },

  async getService(id: string, hospitalId: string) {
    const service = await serviceRepo.findById(id, hospitalId);
    if (!service) {
      throw new Error("Service not found");
    }
    return service;
  },

  async getServices(hospitalId: string, query: QueryServiceInput) {
    return await serviceRepo.findMany(hospitalId, query);
  },

  async updateService(id: string, hospitalId: string, data: UpdateServiceInput) {
    // Check if service exists
    const existing = await serviceRepo.findById(id, hospitalId);
    if (!existing) {
      throw new Error("Service not found");
    }

    // Check if code is being changed and if new code already exists
    if (data.code && data.code !== existing.code) {
      const codeExists = await serviceRepo.checkCodeExists(hospitalId, data.code, id);
      if (codeExists) {
        throw new Error(`Service code '${data.code}' already exists`);
      }
    }

    return await serviceRepo.update(id, hospitalId, data);
  },

  async deleteService(id: string, hospitalId: string) {
    const service = await serviceRepo.findById(id, hospitalId);
    if (!service) {
      throw new Error("Service not found");
    }

    // Check if service is being used in treatment plans
    if (service._count?.treatmentPlans > 0) {
      throw new Error("Cannot delete service that is being used in treatment plans");
    }

    return await serviceRepo.delete(id, hospitalId);
  },

  async getServiceStats(hospitalId: string) {
    return await serviceRepo.getStats(hospitalId);
  },

  async getServicesByDepartment(hospitalId: string, departmentId: string) {
    return await serviceRepo.getByDepartment(hospitalId, departmentId);
  },

  async getServicesBySubDepartment(hospitalId: string, subDepartmentId: string) {
    return await serviceRepo.getBySubDepartment(hospitalId, subDepartmentId);
  },

  async toggleServiceStatus(id: string, hospitalId: string, isActive: boolean) {
    return await serviceRepo.update(id, hospitalId, { id, isActive });
  },
};
