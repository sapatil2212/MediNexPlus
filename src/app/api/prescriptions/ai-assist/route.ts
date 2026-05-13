import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getAiPrescriptionSuggestions } from "../../../../../backend/services/ai.service";
import { aiAssistSchema } from "../../../../../backend/validations/prescription.validation";

export const dynamic = "force-dynamic";

// POST /api/prescriptions/ai-assist — get AI suggestions for prescription
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["DOCTOR", "HOSPITAL_ADMIN"]);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    console.log("AI Assist Request Body:", JSON.stringify(body, null, 2));
    
    const result = aiAssistSchema.safeParse(body);
    if (!result.success) {
      console.error("AI Assist Validation Error:", result.error.issues);
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    const suggestions = await getAiPrescriptionSuggestions(result.data as any);
    return successResponse(suggestions, "AI suggestions generated");
  } catch (e: any) {
    console.error("AI Assist Error:", e);
    return errorResponse(e.message || "AI service error", 500);
  }
}
