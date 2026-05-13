import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";
import prisma from "../../../../../../../backend/config/db";

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Lakh", "Crore"];

  const convert = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " And " + convert(n % 100) : "");
  };

  const n = Math.round(Math.abs(num));
  if (n < 1000) return convert(n);
  const parts: string[] = [];
  let rem = n;
  // ones, thousands
  parts.push(convert(rem % 1000));
  rem = Math.floor(rem / 1000);
  if (rem > 0) { parts.push(convert(rem % 100) + " Thousand"); rem = Math.floor(rem / 100); }
  if (rem > 0) { parts.push(convert(rem % 100) + " Lakh"); rem = Math.floor(rem / 100); }
  if (rem > 0) { parts.push(convert(rem) + " Crore"); }
  return parts.reverse().filter(Boolean).join(" ");
}

// GET: list payslips for a staff member
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = { hospitalId: auth.hospitalId, staffId: params.id };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const payslips = await (prisma as any).staffPayslip.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return successResponse(payslips);
  } catch (e: any) {
    return errorResponse(e.message || "Failed", 500);
  }
}

// POST: generate payslip for a month/year
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { month, year } = body;
    if (!month || !year) return errorResponse("month and year required", 400);

    // Fetch staff
    const staff = await (prisma as any).staff.findFirst({
      where: { id: params.id, hospitalId: auth.hospitalId },
    });
    if (!staff) return errorResponse("Staff not found", 404);

    // Fetch salary structure
    const salary = await (prisma as any).staffSalaryStructure.findUnique({ where: { staffId: params.id } });
    if (!salary) return errorResponse("Salary structure not configured. Please set up salary first.", 400);

    // Fetch attendance
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const totalDaysInMonth = endDate.getDate();

    const attendance = await (prisma as any).staffAttendance.findMany({
      where: { hospitalId: auth.hospitalId, staffId: params.id, date: { gte: startDate, lte: endDate } },
    });

    const presentDays = attendance.filter((a: any) => a.status === "PRESENT").length;
    const halfDays = attendance.filter((a: any) => a.status === "HALF_DAY").length;
    const effectiveDays = presentDays + (halfDays * 0.5);
    const workingDays = staff.workingDays || 26;
    const lopDays = Math.max(0, workingDays - effectiveDays);

    // Calculate pro-rated earnings
    const ratio = effectiveDays / workingDays;
    const basic = Math.round(salary.basic * ratio);
    const hra = Math.round(salary.hra * ratio);
    const conveyance = Math.round(salary.conveyanceAllowance * ratio);
    const medical = Math.round(salary.medicalAllowance * ratio);
    const special = Math.round(salary.specialAllowance * ratio);

    // Parse other earnings
    let otherEarningsItems: any[] = [];
    try { otherEarningsItems = salary.otherEarnings ? JSON.parse(salary.otherEarnings) : []; } catch {}
    const otherEarningsTotal = otherEarningsItems.reduce((s: number, i: any) => s + (i.amount || 0), 0);

    const grossEarnings = basic + hra + conveyance + medical + special + otherEarningsTotal;

    // Deductions
    const professionTax = salary.professionTax || 0;
    const providentFund = Math.round(salary.providentFund * ratio);
    const labourWelfareFund = salary.labourWelfareFund || 0;
    const incomeTax = salary.incomeTax || 0;

    let otherDeductionsItems: any[] = [];
    try { otherDeductionsItems = salary.otherDeductions ? JSON.parse(salary.otherDeductions) : []; } catch {}
    const otherDeductionsTotal = otherDeductionsItems.reduce((s: number, i: any) => s + (i.amount || 0), 0);

    const grossDeductions = professionTax + providentFund + labourWelfareFund + incomeTax + otherDeductionsTotal;
    const netPay = grossEarnings - grossDeductions;

    // Employer contributions
    const employerEps = Math.round(salary.employerEps * ratio);
    const employerPf = Math.round(salary.employerPf * ratio);
    const employerNps = Math.round(salary.employerNps * ratio);
    const employerTotal = employerEps + employerPf + employerNps;

    const totalCtc = grossEarnings + employerTotal;

    // Weekly payouts (4 weeks)
    const weeklyBase = Math.floor(netPay / 4);
    const week4 = netPay - (weeklyBase * 3);
    const weeklyPayouts = [weeklyBase, weeklyBase, weeklyBase, week4];

    const details = JSON.stringify({
      earnings: {
        basic: { reference: salary.basic, amount: basic, arrear: basic - salary.basic },
        hra: { reference: salary.hra, amount: hra, arrear: hra - salary.hra },
        conveyanceAllowance: { reference: salary.conveyanceAllowance, amount: conveyance, arrear: conveyance - salary.conveyanceAllowance },
        medicalAllowance: { reference: salary.medicalAllowance, amount: medical, arrear: medical - salary.medicalAllowance },
        specialAllowance: { reference: salary.specialAllowance, amount: special, arrear: special - salary.specialAllowance },
        otherEarnings: otherEarningsItems,
      },
      deductions: {
        professionTax,
        providentFund,
        labourWelfareFund,
        incomeTax,
        otherDeductions: otherDeductionsItems,
      },
      employerContributions: { eps: employerEps, pf: employerPf, nps: employerNps, total: employerTotal },
      weeklyPayouts,
      netPayWords: "Rupees " + numberToWords(netPay) + " Only",
      weeklyPayoutWords: weeklyPayouts.map(w => "Rupees " + numberToWords(w) + " Only"),
      staffInfo: {
        employeeId: staff.id.slice(-6).toUpperCase(),
        name: staff.name,
        dateOfBirth: staff.dateOfBirth,
        dateOfJoining: staff.joinDate,
        bankName: staff.bankName || "",
        bankAccountNo: staff.bankAccountNo || "",
        panNo: staff.panNo || "",
        pfAccountNo: staff.pfAccountNo || "",
        pfUan: staff.pfUan || "",
        workingDays,
      },
      attendance: { totalDays: totalDaysInMonth, workingDays, presentDays: effectiveDays, lopDays },
    });

    const payslip = await (prisma as any).staffPayslip.upsert({
      where: {
        hospitalId_staffId_month_year: { hospitalId: auth.hospitalId, staffId: params.id, month, year },
      },
      update: { totalDays: totalDaysInMonth, presentDays: effectiveDays, lopDays, grossEarnings, grossDeductions, netPay, totalCtc, details, status: "GENERATED" },
      create: { hospitalId: auth.hospitalId, staffId: params.id, month, year, totalDays: totalDaysInMonth, presentDays: effectiveDays, lopDays, grossEarnings, grossDeductions, netPay, totalCtc, details, status: "GENERATED" },
    });

    return successResponse(payslip, "Payslip generated");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to generate payslip", 500);
  }
}
