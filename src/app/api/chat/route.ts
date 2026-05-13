import { NextResponse } from "next/server";

const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY || "";
const getGeminiKey    = () => process.env.GEMINI_API_KEY || "";
const OPENROUTER_URL  = "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1:free",
  "google/gemma-3-12b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

const SYSTEM_PROMPT = `
You are the official AI Assistant for MediNex+, a multi-tenant Hospital Management SaaS platform. Your role is to help hospital admins, doctors, staff, and patients navigate the platform, understand features, and get support.

=== ABOUT MEDINEX+ ===
MediNex+ is a cloud-based, multi-tenant Hospital Management System (HMS) designed for hospitals, clinics, diagnostic labs, and pharmacies of all sizes. It connects doctors, patients, admins, and staff in one unified and secure platform.

Key Features:
• **Multi-Tenant Architecture** — Each hospital gets its own isolated workspace under one platform
• **OPD & IPD Management** — Complete outpatient and inpatient workflows
• **Appointment Scheduling** — Smart booking with doctor availability and slot management
• **Pharmacy & Inventory** — Counter sales, stock alerts, and purchase order management
• **Lab & Diagnostics** — Sample tracking, test reports, and pathology dashboards
• **Billing & Finance** — Revenue analytics, invoice generation, insurance claims
• **Staff Management** — Role-based access for admins, doctors, nurses, receptionists, and finance heads
• **Patient Records** — Secure digital health records and treatment history
• **Analytics Dashboard** — Real-time KPIs, revenue insights, and operational reports
• **Telemedicine** — Virtual consultations and remote patient monitoring

=== USER ROLES ===
- **Super Admin** — Platform-level control across all tenants
- **Hospital Admin** — Full control of a single hospital tenant
- **Doctor** — Appointments, patient records, prescriptions
- **Receptionist / Staff** — OPD management, patient check-in, billing
- **Finance Head** — Billing, invoices, revenue reports
- **Department Head** — Department-level oversight
- **Nurse / Nursing Admin** — Ward management, patient care workflows

=== GETTING STARTED ===
- Register your hospital at /signup
- Sign in to your dashboard at /login
- Contact support: support@medinexplus.com
- Phone: +91 90590 53938

=== PRICING TIERS ===
- **Starter** — For small clinics, up to 5 doctors
- **Professional** — For mid-size hospitals, unlimited doctors
- **Enterprise** — Custom plan with dedicated support and SLA
- All plans include a free trial; pricing varies — contact sales for details

=== RESPONSE GUIDELINES ===
- Be professional, helpful, and concise (2–4 sentences typically)
- Use bullet points when listing features or steps
- For billing/pricing questions, direct to sales at support@medinexplus.com
- For platform issues, suggest checking the dashboard or contacting support
- Never share or ask for passwords or sensitive credentials
- If asked something unrelated to the platform or healthcare management, politely redirect
- Respond in the same language the user writes in
- Format key terms in **bold** for emphasis
`;

function buildMessages(history: any[], message: string) {
  const prior = (history || [])
    .filter((m: any) => m.content && !m.content.startsWith("Hello! 👋"))
    .map((m: any) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content as string,
    }));
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...prior,
    { role: "user" as const, content: message },
  ];
}

async function tryOpenRouter(msgs: ReturnType<typeof buildMessages>): Promise<string | null> {
  const key = getOpenRouterKey();
  if (!key) return null;

  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://medinexplus.com",
          "X-Title": "MediNex+ AI Assistant",
        },
        body: JSON.stringify({ model, messages: msgs, temperature: 0.5, max_tokens: 600 }),
      });
      if (!res.ok) { console.error(`OpenRouter ${model} ${res.status}`); continue; }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (text) { console.log(`Chat: OpenRouter model used — ${model}`); return text; }
    } catch (err: any) {
      console.error(`OpenRouter ${model} threw:`, err.message);
    }
  }
  return null;
}

async function tryGemini(msgs: ReturnType<typeof buildMessages>): Promise<string | null> {
  const key = getGeminiKey();
  if (!key) return null;

  // Build a single prompt from messages for Gemini
  const combined = msgs
    .filter(m => m.role !== "system")
    .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
  const prompt = `${SYSTEM_PROMPT}\n\n${combined}\nAssistant:`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 600 },
      }),
    });
    if (!res.ok) { console.error("Gemini fallback", res.status); return null; }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (text) { console.log("Chat: Gemini 2.0 Flash used"); return text; }
  } catch (err: any) {
    console.error("Gemini threw:", err.message);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    const msgs = buildMessages(history, message);

    // 1. Try OpenRouter models in order
    const orText = await tryOpenRouter(msgs);
    if (orText) return NextResponse.json({ text: orText });

    // 2. Fallback: Gemini 2.0 Flash
    const gemText = await tryGemini(msgs);
    if (gemText) return NextResponse.json({ text: gemText });

    // 3. All failed
    return NextResponse.json({
      text: "I'm having trouble connecting to AI services right now. Please call us at **+91 90590 53938** or visit /contact.",
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { text: "Something went wrong. Please call us at **+91 90590 53938**." },
      { status: 500 }
    );
  }
}
