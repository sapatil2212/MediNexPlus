import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const search    = searchParams.get("search")   || undefined;
    const role      = searchParams.get("role")     || undefined;
    const isActive  = searchParams.get("isActive");

    const where: any = { hospitalId: auth.hospitalId };
    if (role) where.role = role;
    if (isActive !== null && isActive !== "") where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { name:  { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const staff = await prisma.staff.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    const rows = staff.map(s => [
      s.name,
      s.email,
      s.phone             ?? "",
      s.role,
      s.department?.name  ?? "",
      s.salary            != null ? String(s.salary) : "0",
      new Date(s.joinDate).toLocaleDateString("en-IN"),
      s.isActive ? "Active" : "Inactive",
      s.credentialsSent ? "Sent" : "Not Sent",
      new Date(s.createdAt).toLocaleDateString("en-IN"),
    ]);

    const header = ["Name", "Email", "Phone", "Role", "Department",
                    "Salary", "Join Date", "Status", "Credentials", "Created"];

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map(row => row.map(escape).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="staff-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
