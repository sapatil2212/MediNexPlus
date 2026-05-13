import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";

const getGeminiKey = () => process.env.GEMINI_API_KEY || "";

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { staffName, role, month, year, grossEarnings, grossDeductions, netPay, totalCtc, presentDays, lopDays, workingDays } = body;

    const geminiKey = getGeminiKey();
    if (!geminiKey) return errorResponse("AI service not configured", 500);

    const prompt = `You are an Indian HR/Payroll analytics AI. Analyze this payslip and provide brief professional insights.

Staff: ${staffName} (${role})
Period: ${month}/${year}
Working Days: ${workingDays}, Present: ${presentDays}, LOP: ${lopDays}
Gross Earnings: ₹${grossEarnings}
Gross Deductions: ₹${grossDeductions}
Net Pay: ₹${netPay}
Total CTC: ₹${totalCtc}

Return ONLY a JSON object (no markdown) with:
{
  "summary": "1-2 sentence professional payslip summary",
  "attendanceNote": "brief note on attendance (good/needs improvement/etc)",
  "taxTip": "one practical Indian tax saving tip relevant to this salary range",
  "complianceNote": "any PF/ESI/PT compliance note if applicable",
  "costToCompanyBreakdown": "brief note on what % goes to employee vs statutory"
}

Keep each field to 1-2 sentences max. Be professional and factual.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) return errorResponse("AI service unavailable", 502);

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const insights = JSON.parse(cleaned);

    return successResponse(insights, "Payslip insights generated");
  } catch (e: any) {
    console.error("AI payslip insights error:", e);
    return errorResponse(e.message || "AI insights failed", 500);
  }
}
