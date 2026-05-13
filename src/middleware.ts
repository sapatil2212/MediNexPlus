import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Secret must match backend/utils/jwt.ts
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

// Route → allowed roles mapping
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/hospitaladmin": ["HOSPITAL_ADMIN"],
  "/doctor":        ["DOCTOR"],
  "/staff":         ["STAFF", "RECEPTIONIST"],
  "/superadmin":    ["SUPER_ADMIN"],
  "/receptionist":  ["RECEPTIONIST"],
  "/subdept":       ["SUB_DEPT_HEAD"],
  "/finance":        ["FINANCE_HEAD", "HOSPITAL_ADMIN"],
  "/parentdept":    ["DEPT_HEAD"],
};

// Which login page to redirect each role to
const ROLE_DASHBOARD: Record<string, string> = {
  HOSPITAL_ADMIN: "/hospitaladmin/dashboard",
  DOCTOR:         "/doctor/dashboard",
  STAFF:          "/staff/dashboard",
  RECEPTIONIST:   "/staff/dashboard",
  SUPER_ADMIN:    "/superadmin/dashboard",
  SUB_DEPT_HEAD:  "/subdept/dashboard",
  FINANCE_HEAD:   "/finance/dashboard",
  DEPT_HEAD:      "/parentdept/dashboard",
};

// Which login page to redirect to when unauthenticated
const LOGIN_FOR_ROUTE: Record<string, string> = {
  "/hospitaladmin": "/login",
  "/doctor":        "/login",
  "/staff":         "/staff/login",
  "/superadmin":    "/superadmin/login",
  "/receptionist":  "/staff/login",
  "/subdept":       "/subdept/login",
  "/finance":        "/finance/login",
  "/parentdept":    "/parentdept/login",
};

// Public paths that never need protection (login pages, API, etc.)
const PUBLIC_PREFIXES = [
  "/api/",
  "/login",
  "/signup",
  "/staff/login",
  "/staff/change-password",
  "/parentdept/login",
  "/doctor/change-password",
  "/hospitaladmin/change-password",
  "/superadmin/login",
  "/subdept/login",
  "/finance/login",
  "/_next",
  "/favicon",
  "/public",
  "/about",
  "/blog",
  "/contact",
  "/treatments",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public paths
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip root
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Find if the current path is a protected route
  const matchedBase = Object.keys(PROTECTED_ROUTES).find((base) =>
    pathname.startsWith(base)
  );

  if (!matchedBase) {
    return NextResponse.next();
  }

  // Extract JWT from cookie
  const token = req.cookies.get("hms_session")?.value;

  if (!token) {
    // Not logged in → redirect to appropriate login page
    const loginUrl = LOGIN_FOR_ROUTE[matchedBase] || "/login";
    return NextResponse.redirect(new URL(loginUrl, req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    const allowedRoles = PROTECTED_ROUTES[matchedBase];

    if (!allowedRoles.includes(role)) {
      // Logged in but wrong role → send to their correct dashboard
      const correctDashboard = ROLE_DASHBOARD[role] || "/login";
      return NextResponse.redirect(new URL(correctDashboard, req.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token → redirect to login
    const loginUrl = LOGIN_FOR_ROUTE[matchedBase] || "/login";
    const response = NextResponse.redirect(new URL(loginUrl, req.url));
    // Clear the bad cookie
    response.cookies.delete("hms_session");
    return response;
  }
}

export const config = {
  matcher: [
    "/hospitaladmin/:path*",
    "/doctor/:path*",
    "/staff/:path*",
    "/superadmin/:path*",
    "/receptionist/:path*",
    "/subdept/:path*",
    "/finance/:path*",
    "/parentdept/:path*",
  ],
};
