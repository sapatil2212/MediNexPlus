import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../utils/jwt";

export interface AuthUser {
  id: string;
  role: string;
  hospitalId: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

/**
 * Extract user from hms_session cookie (same JWT pattern as auth.middleware.ts)
 */
export function getUserFromRequest(req: NextRequest): AuthUser | undefined {
  try {
    const token =
      req.cookies.get("hms_session")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return undefined;

    const payload = verifyToken(token);
    if (!payload || !payload.hospitalId) return undefined;

    return {
      id: payload.userId,
      role: payload.role,
      hospitalId: payload.hospitalId,
    };
  } catch {
    return undefined;
  }
}

/**
 * Attach user to request — call at the top of every API handler
 */
export function withAuth(req: NextRequest): AuthenticatedRequest {
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = getUserFromRequest(req);
  return authenticatedReq;
}

/**
 * Role-level permission map — checked without hitting the DB.
 * This covers the default role grants seeded in the Permission tables.
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  HOSPITAL_ADMIN: ["*"],
  DOCTOR: [
    "PATIENT_VIEW", "PATIENT_CREATE", "PATIENT_UPDATE", "PATIENT_HISTORY",
    "APPT_VIEW", "RX_CREATE", "RX_VIEW", "PROCEDURE_PERFORM", "REPORTS_VIEW",
    "DEPT_VIEW",
  ],
  RECEPTIONIST: [
    "PATIENT_VIEW", "PATIENT_CREATE", "PATIENT_UPDATE",
    "APPT_VIEW", "APPT_CREATE", "APPT_UPDATE", "APPT_CANCEL",
    "BILL_VIEW", "BILL_CREATE", "PAYMENT_PROCESS", "DEPT_VIEW",
  ],
  SUB_DEPT_HEAD: [
    "PATIENT_VIEW", "PATIENT_HISTORY", "PROCEDURE_PERFORM",
    "RX_VIEW", "REPORTS_VIEW", "INV_VIEW", "DEPT_VIEW",
  ],
  DEPT_HEAD: [
    "PATIENT_VIEW", "PATIENT_HISTORY", "PROCEDURE_PERFORM",
    "RX_VIEW", "REPORTS_VIEW", "INV_VIEW", "DEPT_VIEW",
    "APPT_VIEW", "BILL_VIEW",
  ],
  FINANCE_HEAD: [
    "BILL_VIEW", "BILL_CREATE", "BILL_UPDATE", "PAYMENT_PROCESS",
    "FINANCE_REPORTS", "REPORTS_VIEW", "DATA_EXPORT",
  ],
  STAFF: ["PATIENT_VIEW", "APPT_VIEW", "INV_VIEW"],
};

/**
 * Check if a role has a permission (no DB hit)
 */
export function checkPermission(req: AuthenticatedRequest, permissionCode: string): boolean {
  if (!req.user) return false;
  const perms = ROLE_PERMISSIONS[req.user.role] ?? [];
  return perms.includes("*") || perms.includes(permissionCode);
}

/**
 * Throws if the user does NOT have the permission.
 * Returns false (not throws) so callers can .catch(() => false) safely.
 */
export function requirePermission(req: AuthenticatedRequest, permissionCode: string): boolean {
  if (!checkPermission(req, permissionCode)) {
    throw new Error(`Permission denied: ${permissionCode} required`);
  }
  return true;
}

/**
 * True if user has ANY of the listed permissions
 */
export function checkAnyPermission(req: AuthenticatedRequest, codes: string[]): boolean {
  return codes.some((code) => checkPermission(req, code));
}

/**
 * True if user has ALL of the listed permissions
 */
export function checkAllPermissions(req: AuthenticatedRequest, codes: string[]): boolean {
  return codes.every((code) => checkPermission(req, code));
}

/**
 * 403 response helper
 */
export function createPermissionError(permissionCode: string) {
  return NextResponse.json(
    { success: false, message: `Insufficient permissions. Required: ${permissionCode}`, error: "PERMISSION_DENIED" },
    { status: 403 }
  );
}

/**
 * 401 response helper
 */
export function createUnauthorizedError() {
  return NextResponse.json(
    { success: false, message: "Authentication required", error: "UNAUTHORIZED" },
    { status: 401 }
  );
}
