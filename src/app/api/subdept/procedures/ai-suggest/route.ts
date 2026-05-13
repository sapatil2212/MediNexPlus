import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getSubDeptProfile,
  SubDeptServiceError,
} from "../../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../../backend/config/db";
import {
  buildProcedurePrompt,
  stripFences,
  recoverTruncatedArray,
  filterDuplicates,
  tryGemini,
  tryOpenRouter,
} from "../../../../../../backend/utils/ai-procedures";

export const dynamic = "force-dynamic";



// ─── Route handler ────────────────────────────────────────────────────────────



/**

 * POST /api/subdept/procedures/ai-suggest

 *

 * Authenticated as SUB_DEPT_HEAD. Derives subdepartment context from the

 * session, calls Gemini (with OpenRouter fallback) to generate a list of

 * clinically relevant procedures, deduplicates against existing entries, and

 * bulk-inserts the results.

 */

export async function POST(req: NextRequest) {

  // 1. Auth guard

  const { user, error } = await authMiddleware(req);

  if (error) return error;

  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);



  try {

    // 2. Retrieve subdepartment profile

    const profile = await getSubDeptProfile(user!.userId);

    const subDept = profile as any;

    const { id: subDepartmentId, name: deptName, type: deptType, hospitalId } = subDept;



    // 3. Fetch existing procedure names for deduplication

    const existing = await (prisma as any).procedure.findMany({

      where: { subDepartmentId },

      select: { name: true },

    });

    const existingNames: string[] = existing.map((p: { name: string }) => p.name);



    // 4. Build prompt and call AI (Gemini first, OpenRouter fallback)

    const prompt = buildProcedurePrompt(deptType, deptName, existingNames);



    const rawText =

      (await tryGemini(prompt)) ?? (await tryOpenRouter(prompt));



    if (!rawText) {

      return errorResponse(

        "AI service is currently unavailable. Please try again later.",

        502

      );

    }



    // 5. Parse AI response (with truncation recovery)

    let parsed: any[];

    const stripped = stripFences(rawText);

    try {

      const direct = JSON.parse(stripped);

      if (!Array.isArray(direct)) throw new Error("Not an array");

      parsed = direct;

    } catch {

      // Response may be truncated — try to salvage complete objects

      const recovered = recoverTruncatedArray(stripped);

      if (recovered && recovered.length > 0) {

        console.warn("AI Auto-Add: Recovered truncated array with", recovered.length, "items");

        parsed = recovered;

      } else {

        console.error("AI Auto-Add: Failed to parse AI response:", rawText);

        return errorResponse(

          "AI returned an invalid response. Please try again.",

          502

        );

      }

    }



    // 6. Deduplicate and normalise

    const newProcedures = filterDuplicates(parsed, existingNames);

    const skipped = parsed.length - newProcedures.length;



    // 7. Nothing new to add

    if (newProcedures.length === 0) {

      return successResponse(

        { added: 0, skipped },

        "All suggested procedures already exist in your catalog.",

        200

      );

    }



    // 8. Bulk insert

    try {

      await (prisma as any).procedure.createMany({

        data: newProcedures.map((p) => ({

          hospitalId,

          subDepartmentId,

          name: p.name,

          type: p.type,

          fee: p.fee,

          duration: p.duration,

          description: p.description,

          sequence: 0,

          isActive: true,

        })),

      });

    } catch (dbErr: any) {

      console.error("AI Auto-Add: DB insertion failed:", dbErr);

      return errorResponse("Failed to save procedures", 500);

    }



    return successResponse(

      { added: newProcedures.length, skipped },

      `${newProcedures.length} procedure${newProcedures.length === 1 ? "" : "s"} added by AI.`,

      201

    );

  } catch (err: any) {

    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);

    console.error("AI Auto-Add: Unexpected error:", err);

    return errorResponse(err.message || "Internal server error", 500);

  }

}

