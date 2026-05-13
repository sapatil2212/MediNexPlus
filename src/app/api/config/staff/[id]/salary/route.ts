import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import prisma from "../../../../../../../backend/config/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;
  try {
    const structure = await (prisma as any).staffSalaryStructure.findUnique({
      where: { staffId: params.id },
    });
    return successResponse(structure || null, "Salary structure fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch salary structure", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const data: any = {
      basic: body.basic || 0,
      hra: body.hra || 0,
      conveyanceAllowance: body.conveyanceAllowance || 0,
      medicalAllowance: body.medicalAllowance || 0,
      specialAllowance: body.specialAllowance || 0,
      otherEarnings: body.otherEarnings || null,
      professionTax: body.professionTax || 0,
      providentFund: body.providentFund || 0,
      labourWelfareFund: body.labourWelfareFund || 0,
      incomeTax: body.incomeTax || 0,
      otherDeductions: body.otherDeductions || null,
      employerEps: body.employerEps || 0,
      employerPf: body.employerPf || 0,
      employerNps: body.employerNps || 0,
    };

    const structure = await (prisma as any).staffSalaryStructure.upsert({
      where: { staffId: params.id },
      update: data,
      create: { ...data, hospitalId: auth.hospitalId, staffId: params.id },
    });
    return successResponse(structure, "Salary structure saved");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to save salary structure", 500);
  }
}
