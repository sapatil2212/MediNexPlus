import prisma from "../config/db";
import type { CreatePermissionInput, AssignRolePermissionInput, AssignUserPermissionInput } from "../validations/permission.validation";

export const permissionRepo = {
  // ============================================================================
  // PERMISSION CRUD
  // ============================================================================
  async createPermission(data: CreatePermissionInput) {
    return await (prisma as any).permission.create({
      data,
    });
  },

  async findPermissionById(id: string) {
    return await (prisma as any).permission.findUnique({
      where: { id },
      include: {
        rolePermissions: { select: { role: true } },
        _count: { select: { userPermissions: true } },
      },
    });
  },

  async findPermissionByCode(code: string) {
    return await (prisma as any).permission.findUnique({
      where: { code },
    });
  },

  async findAllPermissions(module?: string) {
    const where = module ? { module } : {};
    return await (prisma as any).permission.findMany({
      where,
      orderBy: [{ module: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { rolePermissions: true, userPermissions: true } },
      },
    });
  },

  async findPermissionsByModule() {
    const permissions = await (prisma as any).permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });

    const grouped: Record<string, any[]> = {};
    permissions.forEach((perm: any) => {
      if (!grouped[perm.module]) grouped[perm.module] = [];
      grouped[perm.module].push(perm);
    });

    return grouped;
  },

  async deletePermission(id: string) {
    return await (prisma as any).permission.delete({
      where: { id },
    });
  },

  // ============================================================================
  // ROLE PERMISSIONS
  // ============================================================================
  async assignRolePermissions(data: AssignRolePermissionInput) {
    const { role, permissionIds } = data;

    // Delete existing role permissions
    await (prisma as any).rolePermission.deleteMany({
      where: { role },
    });

    // Create new role permissions
    const rolePermissions = permissionIds.map((permissionId) => ({
      role,
      permissionId,
    }));

    await (prisma as any).rolePermission.createMany({
      data: rolePermissions,
    });

    return { role, assignedPermissions: permissionIds.length };
  },

  async getRolePermissions(role: string) {
    const rolePermissions = await (prisma as any).rolePermission.findMany({
      where: { role },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rp: any) => rp.permission);
  },

  async getRolePermissionCodes(role: string) {
    const permissions = await this.getRolePermissions(role);
    return permissions.map((p: any) => p.code);
  },

  async checkRoleHasPermission(role: string, permissionCode: string) {
    const rolePermission = await (prisma as any).rolePermission.findFirst({
      where: {
        role,
        permission: { code: permissionCode },
      },
    });

    return !!rolePermission;
  },

  // ============================================================================
  // USER PERMISSIONS (Override role permissions)
  // ============================================================================
  async assignUserPermission(data: AssignUserPermissionInput) {
    const { userId, permissionId, granted } = data;

    return await (prisma as any).userPermission.upsert({
      where: {
        userId_permissionId: { userId, permissionId },
      },
      create: { userId, permissionId, granted },
      update: { granted },
    });
  },

  async revokeUserPermission(userId: string, permissionId: string) {
    return await (prisma as any).userPermission.delete({
      where: {
        userId_permissionId: { userId, permissionId },
      },
    });
  },

  async getUserPermissions(userId: string) {
    const userPermissions = await (prisma as any).userPermission.findMany({
      where: { userId },
      include: {
        permission: true,
      },
    });

    return {
      granted: userPermissions.filter((up: any) => up.granted).map((up: any) => up.permission),
      revoked: userPermissions.filter((up: any) => !up.granted).map((up: any) => up.permission),
    };
  },

  // ============================================================================
  // PERMISSION CHECKING (Combined role + user permissions)
  // ============================================================================
  async checkUserHasPermission(userId: string, permissionCode: string) {
    // Get user to find their role
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // Check user-specific permission override
    const userPermission = await (prisma as any).userPermission.findFirst({
      where: {
        userId,
        permission: { code: permissionCode },
      },
    });

    // If user has explicit permission setting, use that
    if (userPermission) {
      return userPermission.granted;
    }

    // Otherwise, check role permission
    return await this.checkRoleHasPermission(user.role, permissionCode);
  },

  async getUserEffectivePermissions(userId: string) {
    // Get user role
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return [];

    // Get role permissions
    const rolePermissions = await this.getRolePermissions(user.role);
    const rolePermissionCodes = new Set(rolePermissions.map((p: any) => p.code));

    // Get user-specific permissions
    const userPerms = await this.getUserPermissions(userId);

    // Add granted user permissions
    userPerms.granted.forEach((p: any) => rolePermissionCodes.add(p.code));

    // Remove revoked user permissions
    userPerms.revoked.forEach((p: any) => rolePermissionCodes.delete(p.code));

    // Get full permission objects
    const effectiveCodes = Array.from(rolePermissionCodes);
    return await (prisma as any).permission.findMany({
      where: { code: { in: effectiveCodes } },
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });
  },

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================
  async seedDefaultPermissions() {
    const defaultPermissions = [
      // Department Management
      { name: "View Departments", code: "DEPT_VIEW", module: "DEPARTMENT", action: "READ", description: "View department list and details" },
      { name: "Create Department", code: "DEPT_CREATE", module: "DEPARTMENT", action: "CREATE", description: "Create new departments" },
      { name: "Edit Department", code: "DEPT_UPDATE", module: "DEPARTMENT", action: "UPDATE", description: "Edit department configuration" },
      { name: "Delete Department", code: "DEPT_DELETE", module: "DEPARTMENT", action: "DELETE", description: "Delete departments" },
      { name: "Manage Sub-Departments", code: "SUBDEPT_MANAGE", module: "DEPARTMENT", action: "MANAGE", description: "Full sub-department management" },
      { name: "Manage Procedures", code: "PROCEDURE_MANAGE", module: "DEPARTMENT", action: "MANAGE", description: "Manage procedures and services" },

      // Patient Management
      { name: "View Patients", code: "PATIENT_VIEW", module: "PATIENT", action: "READ", description: "View patient records" },
      { name: "Create Patient", code: "PATIENT_CREATE", module: "PATIENT", action: "CREATE", description: "Register new patients" },
      { name: "Edit Patient", code: "PATIENT_UPDATE", module: "PATIENT", action: "UPDATE", description: "Edit patient information" },
      { name: "Delete Patient", code: "PATIENT_DELETE", module: "PATIENT", action: "DELETE", description: "Delete patient records" },
      { name: "View Patient History", code: "PATIENT_HISTORY", module: "PATIENT", action: "READ", description: "View full patient medical history" },

      // Appointment Management
      { name: "View Appointments", code: "APPT_VIEW", module: "APPOINTMENT", action: "READ", description: "View appointment schedule" },
      { name: "Book Appointment", code: "APPT_CREATE", module: "APPOINTMENT", action: "CREATE", description: "Book new appointments" },
      { name: "Edit Appointment", code: "APPT_UPDATE", module: "APPOINTMENT", action: "UPDATE", description: "Modify appointments" },
      { name: "Cancel Appointment", code: "APPT_CANCEL", module: "APPOINTMENT", action: "DELETE", description: "Cancel appointments" },

      // Billing & Finance
      { name: "View Bills", code: "BILL_VIEW", module: "BILLING", action: "READ", description: "View billing records" },
      { name: "Create Bill", code: "BILL_CREATE", module: "BILLING", action: "CREATE", description: "Generate bills" },
      { name: "Edit Bill", code: "BILL_UPDATE", module: "BILLING", action: "UPDATE", description: "Modify bills" },
      { name: "Process Payment", code: "PAYMENT_PROCESS", module: "BILLING", action: "CREATE", description: "Collect payments" },
      { name: "View Financial Reports", code: "FINANCE_REPORTS", module: "FINANCE", action: "READ", description: "Access financial dashboards" },

      // Prescription & Clinical
      { name: "Create Prescription", code: "RX_CREATE", module: "PRESCRIPTION", action: "CREATE", description: "Write prescriptions" },
      { name: "View Prescriptions", code: "RX_VIEW", module: "PRESCRIPTION", action: "READ", description: "View prescription history" },
      { name: "Perform Procedure", code: "PROCEDURE_PERFORM", module: "CLINICAL", action: "CREATE", description: "Perform and record procedures" },

      // Inventory
      { name: "View Inventory", code: "INV_VIEW", module: "INVENTORY", action: "READ", description: "View inventory items" },
      { name: "Manage Inventory", code: "INV_MANAGE", module: "INVENTORY", action: "MANAGE", description: "Full inventory management" },

      // Staff Management
      { name: "View Staff", code: "STAFF_VIEW", module: "STAFF", action: "READ", description: "View staff list" },
      { name: "Manage Staff", code: "STAFF_MANAGE", module: "STAFF", action: "MANAGE", description: "Full staff management" },

      // System Configuration
      { name: "System Settings", code: "SYS_SETTINGS", module: "SYSTEM", action: "MANAGE", description: "Configure system settings" },
      { name: "View Reports", code: "REPORTS_VIEW", module: "REPORTS", action: "READ", description: "Access system reports" },
      { name: "Export Data", code: "DATA_EXPORT", module: "SYSTEM", action: "EXPORT", description: "Export system data" },
    ];

    const created = [];
    for (const perm of defaultPermissions) {
      const existing = await this.findPermissionByCode(perm.code);
      if (!existing) {
        const newPerm = await this.createPermission(perm);
        created.push(newPerm);
      }
    }

    return created;
  },
};
