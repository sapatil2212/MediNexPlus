import { permissionRepo } from "../repositories/permission.repo";
import type { CreatePermissionInput, AssignRolePermissionInput, AssignUserPermissionInput, CheckPermissionInput } from "../validations/permission.validation";

export const permissionService = {
  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================
  async createPermission(data: CreatePermissionInput) {
    // Check if code already exists
    const existing = await permissionRepo.findPermissionByCode(data.code);
    if (existing) {
      throw new Error(`Permission code '${data.code}' already exists`);
    }

    return await permissionRepo.createPermission(data);
  },

  async getPermission(id: string) {
    const permission = await permissionRepo.findPermissionById(id);
    if (!permission) {
      throw new Error("Permission not found");
    }
    return permission;
  },

  async getAllPermissions(module?: string) {
    return await permissionRepo.findAllPermissions(module);
  },

  async getPermissionsByModule() {
    return await permissionRepo.findPermissionsByModule();
  },

  async deletePermission(id: string) {
    const permission = await permissionRepo.findPermissionById(id);
    if (!permission) {
      throw new Error("Permission not found");
    }

    // Check if permission is being used
    if (permission._count?.rolePermissions > 0 || permission._count?.userPermissions > 0) {
      throw new Error("Cannot delete permission that is assigned to roles or users");
    }

    return await permissionRepo.deletePermission(id);
  },

  // ============================================================================
  // ROLE PERMISSION MANAGEMENT
  // ============================================================================
  async assignRolePermissions(data: AssignRolePermissionInput) {
    // Validate all permission IDs exist
    for (const permissionId of data.permissionIds) {
      const permission = await permissionRepo.findPermissionById(permissionId);
      if (!permission) {
        throw new Error(`Permission with ID '${permissionId}' not found`);
      }
    }

    return await permissionRepo.assignRolePermissions(data);
  },

  async getRolePermissions(role: string) {
    return await permissionRepo.getRolePermissions(role);
  },

  async getRolePermissionCodes(role: string) {
    return await permissionRepo.getRolePermissionCodes(role);
  },

  async checkRoleHasPermission(role: string, permissionCode: string) {
    return await permissionRepo.checkRoleHasPermission(role, permissionCode);
  },

  // ============================================================================
  // USER PERMISSION MANAGEMENT
  // ============================================================================
  async assignUserPermission(data: AssignUserPermissionInput) {
    // Validate permission exists
    const permission = await permissionRepo.findPermissionById(data.permissionId);
    if (!permission) {
      throw new Error("Permission not found");
    }

    return await permissionRepo.assignUserPermission(data);
  },

  async revokeUserPermission(userId: string, permissionId: string) {
    return await permissionRepo.revokeUserPermission(userId, permissionId);
  },

  async getUserPermissions(userId: string) {
    return await permissionRepo.getUserPermissions(userId);
  },

  async getUserEffectivePermissions(userId: string) {
    return await permissionRepo.getUserEffectivePermissions(userId);
  },

  // ============================================================================
  // PERMISSION CHECKING
  // ============================================================================
  async checkPermission(data: CheckPermissionInput) {
    if (data.userId) {
      return await permissionRepo.checkUserHasPermission(data.userId, data.permissionCode);
    } else if (data.role) {
      return await permissionRepo.checkRoleHasPermission(data.role, data.permissionCode);
    }

    throw new Error("Either userId or role must be provided");
  },

  async checkUserPermission(userId: string, permissionCode: string) {
    return await permissionRepo.checkUserHasPermission(userId, permissionCode);
  },

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================
  async seedDefaultPermissions() {
    return await permissionRepo.seedDefaultPermissions();
  },

  async initializeRolePermissions() {
    // Get all permissions
    const allPermissions = await permissionRepo.findAllPermissions();
    const permissionIds = allPermissions.map((p: any) => p.id);

    // HOSPITAL_ADMIN: Full access
    await permissionRepo.assignRolePermissions({
      role: "HOSPITAL_ADMIN",
      permissionIds,
    });

    // DOCTOR: Clinical + Patient access
    const doctorPermissions = allPermissions.filter((p: any) =>
      ["PATIENT_VIEW", "PATIENT_CREATE", "PATIENT_UPDATE", "PATIENT_HISTORY",
       "APPT_VIEW", "RX_CREATE", "RX_VIEW", "PROCEDURE_PERFORM", "REPORTS_VIEW"].includes(p.code)
    ).map((p: any) => p.id);
    await permissionRepo.assignRolePermissions({
      role: "DOCTOR",
      permissionIds: doctorPermissions,
    });

    // RECEPTIONIST: Front desk operations
    const receptionistPermissions = allPermissions.filter((p: any) =>
      ["PATIENT_VIEW", "PATIENT_CREATE", "PATIENT_UPDATE",
       "APPT_VIEW", "APPT_CREATE", "APPT_UPDATE", "APPT_CANCEL",
       "BILL_VIEW", "BILL_CREATE", "PAYMENT_PROCESS"].includes(p.code)
    ).map((p: any) => p.id);
    await permissionRepo.assignRolePermissions({
      role: "RECEPTIONIST",
      permissionIds: receptionistPermissions,
    });

    // SUB_DEPT_HEAD: Department-specific access
    const subDeptPermissions = allPermissions.filter((p: any) =>
      ["PATIENT_VIEW", "PATIENT_HISTORY", "PROCEDURE_PERFORM",
       "RX_VIEW", "REPORTS_VIEW", "INV_VIEW"].includes(p.code)
    ).map((p: any) => p.id);
    await permissionRepo.assignRolePermissions({
      role: "SUB_DEPT_HEAD",
      permissionIds: subDeptPermissions,
    });

    // FINANCE_HEAD: Financial access
    const financePermissions = allPermissions.filter((p: any) =>
      ["BILL_VIEW", "BILL_CREATE", "BILL_UPDATE", "PAYMENT_PROCESS",
       "FINANCE_REPORTS", "REPORTS_VIEW", "DATA_EXPORT"].includes(p.code)
    ).map((p: any) => p.id);
    await permissionRepo.assignRolePermissions({
      role: "FINANCE_HEAD",
      permissionIds: financePermissions,
    });

    // STAFF: Basic access
    const staffPermissions = allPermissions.filter((p: any) =>
      ["PATIENT_VIEW", "APPT_VIEW", "INV_VIEW"].includes(p.code)
    ).map((p: any) => p.id);
    await permissionRepo.assignRolePermissions({
      role: "STAFF",
      permissionIds: staffPermissions,
    });

    return { message: "Role permissions initialized successfully" };
  },
};
