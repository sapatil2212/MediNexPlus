// ─── Constants ────────────────────────────────────────────────────────────────

const getGeminiKey = () => process.env.GEMINI_API_KEY || "";
const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1:free",
  "google/gemma-3-12b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

const VALID_PROC_TYPES = [
  "CONSULTATION",
  "TREATMENT",
  "SURGERY",
  "DIAGNOSTIC",
  "THERAPY",
  "MEDICATION",
  "OTHER",
] as const;

type ProcType = (typeof VALID_PROC_TYPES)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIProcedure = {
  name: string;
  type: ProcType;
  fee: number | null;
  duration: number | null;
  description: string | null;
};

// ─── Pure helper functions ────────────────────────────────────────────────────

export function buildProcedurePrompt(
  deptType: string,
  deptName: string,
  existingNames: string[]
): string {
  const existingList =
    existingNames.length > 0 ? existingNames.join(", ") : "none";

  return `You are a medical procedure catalog assistant.

Generate between 10 and 20 clinically appropriate procedures for a subdepartment with the following details:
- Department Type: ${deptType}
- Department Name: ${deptName}

Rules:
1. Return ONLY a raw JSON array. No explanation, no markdown, no code fences.
2. Each object must have exactly these fields:
   - "name": string (procedure name)
   - "type": one of CONSULTATION, TREATMENT, SURGERY, DIAGNOSTIC, THERAPY, MEDICATION, OTHER
   - "fee": number in Indian Rupees (INR), or null
   - "duration": number in minutes, or null
   - "description": short string (1-2 sentences), or null
3. Assign realistic INR fee values appropriate for the procedure type and Indian private clinic context.
4. Assign realistic duration values in minutes.
5. Do NOT include any of these already-existing procedures: ${existingList}

Return the JSON array now:`;
}

export function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

export function recoverTruncatedArray(text: string): any[] | null {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  const lastBrace = trimmed.lastIndexOf("}");
  if (lastBrace === -1) return null;

  const candidate = trimmed.slice(0, lastBrace + 1) + "]";
  const startBracket = candidate.indexOf("[");
  if (startBracket === -1) return null;

  try {
    const parsed = JSON.parse(candidate.slice(startBracket));
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return null;
}

export function filterDuplicates(
  suggestions: any[],
  existingNames: string[]
): AIProcedure[] {
  const existingLower = new Set(existingNames.map((n) => n.toLowerCase()));

  return suggestions
    .filter(
      (item) =>
        item &&
        typeof item.name === "string" &&
        item.name.trim() !== "" &&
        !existingLower.has(item.name.trim().toLowerCase())
    )
    .map((item) => ({
      name: item.name.trim(),
      type: (VALID_PROC_TYPES as readonly string[]).includes(item.type)
        ? (item.type as ProcType)
        : item.type === "PROCEDURE" ? "TREATMENT"
        : item.type === "VACCINATION" ? "MEDICATION"
        : "OTHER",
      fee: typeof item.fee === "number" ? item.fee : null,
      duration: typeof item.duration === "number" ? item.duration : null,
      description:
        typeof item.description === "string" ? item.description : null,
    }));
}

// ─── AI call helpers ──────────────────────────────────────────────────────────

export async function tryGemini(prompt: string): Promise<string | null> {
  const key = getGeminiKey();
  if (!key) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    });
    if (!res.ok) {
      console.error("AI Auto-Add: Gemini error", res.status);
      return null;
    }
    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (text) {
      console.log("AI Auto-Add: Gemini 2.0 Flash used");
      return text;
    }
  } catch (err: any) {
    console.error("AI Auto-Add: Gemini threw:", err.message);
  }
  return null;
}

export async function tryOpenRouter(prompt: string): Promise<string | null> {
  const key = getOpenRouterKey();
  if (!key) return null;

  const msgs = [{ role: "user", content: prompt }];

  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://celebaesthetica.com",
          "X-Title": "Celeb Aesthetica AI Procedures",
        },
        body: JSON.stringify({
          model,
          messages: msgs,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });
      if (!res.ok) {
        console.error(`AI Auto-Add: OpenRouter ${model} ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text: string = data?.choices?.[0]?.message?.content || "";
      if (text) {
        console.log(`AI Auto-Add: OpenRouter model used — ${model}`);
        return text;
      }
    } catch (err: any) {
      console.error(`AI Auto-Add: OpenRouter ${model} threw:`, err.message);
    }
  }
  return null;
}
