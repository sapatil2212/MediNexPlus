import prisma from "../config/db";
import { hashPassword } from "../utils/hash";
import {
  createDepartment as createDepartmentRepo,
  findAllDepartments,
  findAllDepartmentsSimple,
  findDepartmentById,
  updateDepartment as updateDepartmentRepo,
  deleteDepartment as deleteDepartmentRepo,
  checkDuplicateCode,
  checkDepartmentDependencies,
  toggleDepartmentStatus,
  createManyDepartments,
  countDepartments,
  setDepartmentCredentials,
  findDepartmentByUserId,
  DepartmentQueryOptions,
} from "../repositories/department.repo";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  generateCodeFromName,
  DEFAULT_DEPARTMENTS,
} from "../validations/department.validation";

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENT SERVICE - Business logic layer
// ─────────────────────────────────────────────────────────────────────────────

export class DepartmentServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "DepartmentServiceError";
  }
}

/**
 * Create a new department
 */
export const createDepartment = async (
  hospitalId: string,
  input: CreateDepartmentInput
) => {
  // Auto-generate code from name if not provided
  let code = input.code;
  if (!code && input.name) {
    code = generateCodeFromName(input.name);
  }

  // Check for duplicate code
  const isDuplicate = await checkDuplicateCode(hospitalId, code);
  if (isDuplicate) {
    throw new DepartmentServiceError(
      `Department with code "${code}" already exists`,
      "DUPLICATE_CODE",
      409
    );
  }

  // Create the department
  return createDepartmentRepo({
    hospitalId,
    name: input.name,
    code: code.toUpperCase(),
    description: input.description || null,
    type: input.type || "OPD",
    consultationFee: input.consultationFee || null,
    allowAppointments: input.allowAppointments ?? true,
    isIPD: input.isIPD ?? false,
    hodDoctorId: input.hodDoctorId || null,
    hodUserId: (input as any).hodUserId || null,
    customTypeName: (input as any).customTypeName || null,
    location: input.location || null,
    billingCode: input.billingCode || null,
    isActive: input.isActive ?? true,
  } as any);
};

/**
 * Get departments with pagination and filters
 */
export const getDepartments = async (options: DepartmentQueryOptions) => {
  return findAllDepartments(options);
};

/**
 * Get all departments for dropdowns (simple list)
 */
export const getDepartmentsForDropdown = async (
  hospitalId: string,
  activeOnly = true
) => {
  return findAllDepartmentsSimple(hospitalId, activeOnly);
};

/**
 * Get a single department by ID
 */
export const getDepartmentById = async (id: string, hospitalId: string) => {
  const department = await findDepartmentById(id, hospitalId);
  if (!department) {
    throw new DepartmentServiceError(
      "Department not found",
      "NOT_FOUND",
      404
    );
  }
  return department;
};

/**
 * Update a department
 */
export const updateDepartment = async (
  id: string,
  hospitalId: string,
  input: UpdateDepartmentInput
) => {
  // Check if department exists
  const existing = await findDepartmentById(id, hospitalId);
  if (!existing) {
    throw new DepartmentServiceError(
      "Department not found",
      "NOT_FOUND",
      404
    );
  }

  // If code is being updated, check for duplicates
  if (input.code && input.code.toUpperCase() !== existing.code) {
    const isDuplicate = await checkDuplicateCode(
      hospitalId,
      input.code,
      id
    );
    if (isDuplicate) {
      throw new DepartmentServiceError(
        `Department with code "${input.code}" already exists`,
        "DUPLICATE_CODE",
        409
      );
    }
  }

  // Build update data
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.code !== undefined) updateData.code = input.code.toUpperCase();
  if (input.description !== undefined) updateData.description = input.description;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.consultationFee !== undefined) updateData.consultationFee = input.consultationFee;
  if (input.allowAppointments !== undefined) updateData.allowAppointments = input.allowAppointments;
  if (input.isIPD !== undefined) updateData.isIPD = input.isIPD;
  if (input.hodDoctorId !== undefined) updateData.hodDoctorId = input.hodDoctorId;
  if ((input as any).hodUserId !== undefined) updateData.hodUserId = (input as any).hodUserId;
  if ((input as any).customTypeName !== undefined) updateData.customTypeName = (input as any).customTypeName;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.billingCode !== undefined) updateData.billingCode = input.billingCode;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  return updateDepartmentRepo(id, hospitalId, updateData);
};

/**
 * Toggle department active status
 */
export const toggleStatus = async (
  id: string,
  hospitalId: string,
  isActive: boolean
) => {
  const existing = await findDepartmentById(id, hospitalId);
  if (!existing) {
    throw new DepartmentServiceError(
      "Department not found",
      "NOT_FOUND",
      404
    );
  }

  await toggleDepartmentStatus(id, hospitalId, isActive);
  return { id, isActive };
};

/**
 * Delete a department
 * @param force - If true, delete department only (unlink related items)
 * @param cascade - If true, delete department AND all related items
 */
export const deleteDepartment = async (
  id: string,
  hospitalId: string,
  force = false,
  cascade = false
) => {
  // Check if department exists
  const existing = await findDepartmentById(id, hospitalId);
  if (!existing) {
    throw new DepartmentServiceError(
      "Department not found",
      "NOT_FOUND",
      404
    );
  }

  // Check dependencies
  if (!force && !cascade) {
    const dependencies = await checkDepartmentDependencies(id, hospitalId);
    if (dependencies) {
      const { hasDoctor, hasStaff, hasSubDepartments, hasPricing, counts } = dependencies;
      if (hasDoctor || hasStaff || hasSubDepartments || hasPricing) {
        throw new DepartmentServiceError(
          `Cannot delete department: It has ${counts.doctors} doctors, ${counts.staff} staff, ${counts.subDepartments} sub-departments, and ${counts.pricing} pricing rules assigned. Remove these first or use force delete.`,
          "HAS_DEPENDENCIES",
          400
        );
      }
    }
  }

  await deleteDepartmentRepo(id, hospitalId, cascade);
  return { id, deleted: true, cascade };
};

/**
 * Seed default departments for a new hospital
 */
export const seedDefaultDepartments = async (
  hospitalId: string,
  overwrite = false
) => {
  // Check if hospital already has departments
  const existingCount = await countDepartments(hospitalId);
  if (existingCount > 0 && !overwrite) {
    return {
      seeded: false,
      message: "Hospital already has departments. Use overwrite=true to add defaults anyway.",
      existingCount,
    };
  }

  // Create default departments
  const result = await createManyDepartments(hospitalId, DEFAULT_DEPARTMENTS);

  return {
    seeded: true,
    count: result.count,
    departments: DEFAULT_DEPARTMENTS.map((d) => d.name),
  };
};

/**
 * Generate a unique department code
 */
export const generateUniqueCode = async (
  hospitalId: string,
  name: string
): Promise<string> => {
  let baseCode = generateCodeFromName(name);
  let code = baseCode;
  let counter = 1;

  // Keep checking until we find a unique code
  while (await checkDuplicateCode(hospitalId, code)) {
    code = `${baseCode.slice(0, 8)}${counter}`;
    counter++;
    if (counter > 99) {
      throw new DepartmentServiceError(
        "Unable to generate unique code. Please provide a custom code.",
        "CODE_GENERATION_FAILED",
        400
      );
    }
  }

  return code;
};

/**
 * Get department statistics
 */
export const getDepartmentStats = async (hospitalId: string) => {
  const [total, active, inactive] = await Promise.all([
    countDepartments(hospitalId),
    countDepartments(hospitalId, true),
    countDepartments(hospitalId, false),
  ]);

  return {
    total,
    active,
    inactive,
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENT CREDENTIALS (DEPT_HEAD login)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auto-create or update DEPT_HEAD User when department is saved with loginEmail + loginPassword.
 * Called from POST/PUT department API routes. Uses upsert-safe logic to handle duplicates.
 */
export const handleDeptCredentialsOnSave = async (
  deptId: string,
  hospitalId: string,
  loginEmail: string,
  loginPassword: string,
  deptName: string
) => {
  const hashed = await hashPassword(loginPassword);

  // Check if a User with this email already exists (handles duplicate gracefully)
  const existingByEmail = await prisma.user.findUnique({ where: { email: loginEmail } });

  let userId: string;

  if (existingByEmail) {
    // Update existing user's password + ensure role is DEPT_HEAD
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { password: hashed, role: "DEPT_HEAD" as any, name: deptName },
    });
    userId = existingByEmail.id;
    console.log(`[DeptCredentials] Updated existing User: email=${loginEmail}, id=${userId}`);
  } else {
    // Create a fresh User
    const newUser = await prisma.user.create({
      data: {
        hospitalId,
        name: deptName,
        email: loginEmail,
        password: hashed,
        role: "DEPT_HEAD" as any,
      },
    });
    userId = newUser.id;
    console.log(`[DeptCredentials] Created new User: email=${loginEmail}, id=${userId}`);
  }

  // Link user to department + save loginEmail
  await setDepartmentCredentials(deptId, userId, true);
  await (prisma as any).department.update({ where: { id: deptId }, data: { loginEmail } });
  console.log(`[DeptCredentials] Linked userId=${userId} to deptId=${deptId}`);

  return { email: loginEmail, password: loginPassword };
};

/**
 * Create login credentials for a department head
 */
export const createDeptCredentials = async (id: string, hospitalId: string, customPassword?: string) => {
  const dept = await findDepartmentById(id, hospitalId);
  if (!dept) throw new DepartmentServiceError("Department not found", "NOT_FOUND", 404);

  if ((dept as any).credentialsSent && (dept as any).userId) {
    throw new DepartmentServiceError("Credentials already sent. Use resend instead.", "ALREADY_SENT", 409);
  }

  const loginEmail = (dept as any).loginEmail;
  if (!loginEmail) throw new DepartmentServiceError("Login email not set for this department", "NO_EMAIL", 400);

  const year = new Date().getFullYear();
  const prefix = dept.name.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
  const rawPassword = customPassword || `${prefix}@${year}`;
  const hashed = await hashPassword(rawPassword);

  const user = await prisma.user.create({
    data: {
      hospitalId,
      name: dept.name,
      email: loginEmail,
      password: hashed,
      role: "DEPT_HEAD" as any,
    },
  });

  await setDepartmentCredentials(id, user.id, true);

  return { email: loginEmail, password: rawPassword };
};

/**
 * Resend credentials for a department head (reset password)
 */
export const resendDeptCredentials = async (id: string, hospitalId: string, customPassword?: string) => {
  const dept = await findDepartmentById(id, hospitalId);
  if (!dept) throw new DepartmentServiceError("Department not found", "NOT_FOUND", 404);

  const loginEmail = (dept as any).loginEmail;
  if (!loginEmail) throw new DepartmentServiceError("Login email not set for this department", "NO_EMAIL", 400);

  const year = new Date().getFullYear();
  const prefix = dept.name.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
  const rawPassword = customPassword || `${prefix}@${year}`;
  const hashed = await hashPassword(rawPassword);

  if ((dept as any).userId) {
    await prisma.user.update({
      where: { id: (dept as any).userId },
      data: { password: hashed },
    });
  } else {
    const user = await prisma.user.create({
      data: {
        hospitalId,
        name: dept.name,
        email: loginEmail,
        password: hashed,
        role: "DEPT_HEAD" as any,
      },
    });
    await setDepartmentCredentials(id, user.id, true);
  }

  return { email: loginEmail, password: rawPassword };
};

/**
 * Get department profile for DEPT_HEAD by userId
 */
export const getDeptProfile = async (userId: string) => {
  const dept = await findDepartmentByUserId(userId);
  if (!dept) throw new DepartmentServiceError("Department not found for this user", "NOT_FOUND", 404);
  return dept;
};
