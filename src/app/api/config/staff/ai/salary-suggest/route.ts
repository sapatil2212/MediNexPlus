import { NextRequest } from "next/server";
import { requireRole } from "../../../../../../../backend/middlewares/role.middleware";

const HR_ROLES = ["HOSPITAL_ADMIN", "SUB_DEPT_HEAD"];
import { successResponse, errorResponse } from "../../../../../../../backend/utils/response";

const getGeminiKey = () => process.env.GEMINI_API_KEY || "";

// Rule-based fallback when AI quota is exceeded
function calculateSalaryFallback(totalCTC: number) {
  // Indian payroll best practices
  const basic = Math.round(totalCTC * 0.45); // 45% of CTC
  const hra = Math.round(basic * 0.45); // 45% of Basic (metro city)
  const conveyanceAllowance = 1600; // Tax-exempt limit
  const medicalAllowance = 1250; // Common amount
  const specialAllowance = totalCTC - basic - hra - conveyanceAllowance - medicalAllowance;
  
  const professionTax = 200; // Standard for most states
  const providentFund = Math.min(Math.round(basic * 0.12), 1800); // 12% of Basic, capped at ₹1800
  const labourWelfareFund = 20;
  const incomeTax = Math.round(totalCTC * 12 * 0.05 / 12); // Rough 5% annual estimate
  
  const employerEps = Math.min(Math.round(basic * 0.0833), 1250); // 8.33% capped at ₹1250
  const employerPf = Math.min(Math.round(basic * 0.0367), 1800); // 3.67% capped
  const employerNps = 0;

  return {
    basic,
    hra,
    conveyanceAllowance,
    medicalAllowance,
    specialAllowance,
    professionTax,
    providentFund,
    labourWelfareFund,
    incomeTax,
    employerEps,
    employerPf,
    employerNps,
    reasoning: "Rule-based calculation: 45% Basic, 45% HRA of Basic, standard allowances. AI quota exceeded, using fallback."
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, HR_ROLES);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { totalCTC, role, location } = body;

    if (!totalCTC || totalCTC <= 0) return errorResponse("Total CTC is required", 400);

    const geminiKey = getGeminiKey();
    if (!geminiKey) return errorResponse("AI service not configured", 500);

    const prompt = `You are an Indian payroll expert AI. Given a total monthly CTC (Cost to Company) of ₹${totalCTC}, suggest the optimal salary breakdown following Indian labor laws and tax-efficient practices.

Role: ${role || "Staff"}
Location: ${location || "India"}

Rules:
- Basic should be 40-50% of CTC (higher basic = higher PF but better for gratuity/pension)
- HRA should be 40-50% of Basic for metro cities, 30-40% for non-metro
- Conveyance Allowance: ₹1600/month is tax-exempt
- Medical Allowance: ₹1250/month is common
- Special Allowance: remaining balance to reach total earnings
- Profession Tax: ₹200/month (standard for most Indian states)
- Provident Fund (employee): 12% of Basic (capped at ₹1800 if Basic > ₹15000)
- Labour Welfare Fund: ₹0-₹25 typically
- Income Tax (TDS): estimate based on annual CTC using new tax regime
- Employer PF: 3.67% of Basic (capped)
- Employer EPS: 8.33% of Basic (capped at ₹1250/month)
- Employer NPS: 0 unless specified

Return ONLY a JSON object (no markdown, no explanation) with these exact keys:
{
  "basic": number,
  "hra": number,
  "conveyanceAllowance": number,
  "medicalAllowance": number,
  "specialAllowance": number,
  "professionTax": number,
  "providentFund": number,
  "labourWelfareFund": number,
  "incomeTax": number,
  "employerEps": number,
  "employerPf": number,
  "employerNps": number,
  "reasoning": "brief 1-2 line explanation of the split logic"
}

All values should be monthly amounts rounded to nearest integer. Ensure: basic + hra + conveyanceAllowance + medicalAllowance + specialAllowance = totalCTC (gross earnings side). The employer contributions are additional cost above CTC.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini salary suggest error:", err);
      
      // Fallback to rule-based calculation if Gemini quota exceeded
      const fallback = calculateSalaryFallback(totalCTC);
      return successResponse(fallback, "Salary suggestion generated (rule-based fallback - AI quota exceeded)");
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const suggestion = JSON.parse(cleaned);

    return successResponse(suggestion, "AI salary suggestion generated");
  } catch (e: any) {
    console.error("AI salary suggest error:", e);
    return errorResponse(e.message || "AI suggestion failed", 500);
  }
}
