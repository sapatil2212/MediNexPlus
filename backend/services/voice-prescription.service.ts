import prisma from "../config/db";

const px = prisma as any;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY || "";
const getGeminiKey = () => process.env.GEMINI_API_KEY || "";

const VOICE_MODELS = [
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "google/gemma-4-26b-a4b-it:free",
  "tencent/hy3-preview:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "openrouter/owl-alpha",
];

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fixJsonControlChars(json: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\" && inString) { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString) {
      const code = ch.charCodeAt(0);
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
      if (code < 0x20) continue;
    }
    result += ch;
  }
  return result;
}

async function callOpenRouterForVoice(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = getOpenRouterKey();
  const geminiKey = getGeminiKey();

  if (!key && !geminiKey) {
    console.error("[Voice AI] CRITICAL: No AI provider keys found. Please set OPENROUTER_API_KEY or GEMINI_API_KEY.");
    throw new Error("AI provider API key is missing. Voice features are disabled.");
  }

  console.log(`[Voice AI] Keys found — OpenRouter: ${!!key}, Gemini: ${!!geminiKey}`);

  const errors: string[] = [];

  // --- Gemini: PRIMARY provider (stable model names, reliable) ---
  if (geminiKey) {
    const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
    for (const gModel of GEMINI_MODELS) {
      try {
        console.log(`[Voice AI] Trying Gemini ${gModel}...`);
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${geminiKey}`;
        const res = await fetchWithTimeout(
          geminiUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 3000 },
            }),
          },
          20000
        );
        if (!res.ok) {
          const errBody = await res.text();
          errors.push(`Gemini ${gModel} HTTP ${res.status}`);
          console.error(`[Voice AI] Gemini ${gModel} error: ${errBody.slice(0, 200)}`);
          continue; // skip to next model immediately — no retries for quota/access errors
        }
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) {
          console.log(`[Voice AI] Success with Gemini ${gModel}.`);
          return text;
        }
        errors.push(`Gemini ${gModel} empty response`);
      } catch (err: any) {
        errors.push(`Gemini ${gModel}: ${err.message?.slice(0, 80)}`);
      }
    }
    console.error("[Voice AI] All Gemini models failed:", errors.join("; "));
  } else {
    console.warn("[Voice AI] No Gemini API key configured, skipping Gemini.");
  }

  // --- OpenRouter: FALLBACK provider ---
  if (key) {
    for (const model of VOICE_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetchWithTimeout(
            OPENROUTER_URL,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://hospital-management-system.com",
                "X-Title": "Hospital Management System",
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 3000,
              }),
            },
            25000
          );
          if (res.status === 429 && attempt === 0) {
            console.log(`[Voice AI] ${model} rate-limited, retrying in 1s...`);
            await sleep(1000);
            continue;
          }
          if (res.status === 404) {
            errors.push(`${model} not found (404)`);
            break;
          }
          if (!res.ok) {
            const body = await res.text();
            errors.push(`${model} HTTP ${res.status}`);
            console.error(`[Voice AI] ${model} error: ${body.slice(0, 200)}`);
            break;
          }
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content || "";
          if (!text) { errors.push(`${model} empty response`); break; }
          console.log(`[Voice AI] Success with model: ${model}`);
          return text;
        } catch (err: any) {
          errors.push(`${model}: ${err.message?.slice(0, 80)}`);
          break;
        }
      }
    }
    console.error("[Voice AI] All OpenRouter models also failed:", errors.join("; "));
  }

  throw new Error("All AI providers failed for voice prescription. Please check API keys and provider status.");
}

export interface VoiceTranscriptionResult {
  transcription: string;
  diagnosis: string;
  chiefComplaint: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
  }>;
  labTests: Array<{
    name: string;
    urgency: string;
    notes: string;
  }>;
  vitals: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
    height?: string;
    spo2?: string;
    rr?: string;
  };
  advice: string;
  icdCodes: string[];
  followUpDate?: string;
  followUpNotes?: string;
  metadata: {
    processingTime: number;
    confidence: number;
    language: string;
  };
}

export async function transcribeAndGeneratePrescription(
  transcriptText: string,
  patientInfo: {
    name: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    medicalHistory?: string;
  },
  doctorInfo: {
    name: string;
    specialization?: string;
    department?: string;
  },
  language?: string
): Promise<VoiceTranscriptionResult> {
  const startTime = Date.now();

  try {
    // Extract structured medical data from transcript
    const languageNote = language && language !== 'en-IN' 
      ? `\n\nNOTE: This transcript is in ${language}. Please translate the medical content to English while extracting the information.`
      : '';

    const systemPrompt = `You are an expert medical AI assistant fluent in multiple Indian languages (Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Bengali, Malayalam, Punjabi, and English). You help doctors extract structured medical information from consultation transcripts.${languageNote}`;

    const userPrompt = `Analyze this doctor-patient consultation transcript and extract structured medical information.

PATIENT INFORMATION:
- Name: ${patientInfo.name}
- Age: ${patientInfo.age || "Not specified"}
- Gender: ${patientInfo.gender || "Not specified"}
- Blood Group: ${patientInfo.bloodGroup || "Not specified"}
${patientInfo.medicalHistory ? `- Medical History: ${patientInfo.medicalHistory}` : ""}

DOCTOR INFORMATION:
- Dr. ${doctorInfo.name}
- Specialization: ${doctorInfo.specialization || "General Medicine"}
- Department: ${doctorInfo.department || "General"}

CONVERSATION TRANSCRIPT:
${transcriptText}

TASK: Extract structured medical information from the conversation transcript.

INSTRUCTIONS:
1. The transcription is already provided above
2. Identify the chief complaint (patient's main symptoms/concerns)
3. Determine the diagnosis based on the conversation
4. Extract any mentioned medications with complete details (name, dosage, frequency, duration, route, instructions)
5. Identify any lab tests or investigations recommended
6. Extract vital signs if mentioned (BP, pulse, temperature, weight, height, SpO2, respiratory rate)
7. Extract medical advice and lifestyle recommendations
8. Suggest relevant ICD-10 codes for the diagnosis
9. Determine if follow-up is needed and when

OUTPUT FORMAT (JSON):
{
  "chiefComplaint": "Patient's main symptoms and concerns",
  "diagnosis": "Primary diagnosis with clinical reasoning",
  "medications": [
    {
      "name": "Medicine name",
      "dosage": "Strength (e.g., 500mg)",
      "frequency": "How often (e.g., Twice daily (BD))",
      "duration": "How long (e.g., 5 days)",
      "route": "Administration route (e.g., Oral)",
      "instructions": "Special instructions (e.g., After food)"
    }
  ],
  "labTests": [
    {
      "name": "Test name",
      "urgency": "Routine/Urgent/STAT",
      "notes": "Any special instructions"
    }
  ],
  "vitals": {
    "bp": "Blood pressure if mentioned",
    "pulse": "Pulse rate if mentioned",
    "temp": "Temperature if mentioned",
    "weight": "Weight if mentioned",
    "height": "Height if mentioned",
    "spo2": "SpO2 if mentioned",
    "rr": "Respiratory rate if mentioned"
  },
  "advice": "Diet, lifestyle, precautions, and general advice",
  "icdCodes": ["ICD-10 codes relevant to diagnosis"],
  "followUpDate": "Recommended follow-up date (YYYY-MM-DD format) or null",
  "followUpNotes": "Follow-up instructions or null",
  "confidence": 0.95
}

IMPORTANT:
- Be accurate and conservative in medical interpretations
- Only include information explicitly mentioned or strongly implied
- Use standard medical terminology
- If something is unclear, mark it in notes
- Ensure medication details are complete and safe
- Return ONLY valid JSON, no markdown formatting`;

    let raw = await callOpenRouterForVoice(systemPrompt, userPrompt);
    // Strip markdown fences if model wraps the JSON
    let text = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    // Extract outermost JSON object in case there's surrounding prose
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }
    // Escape unescaped control chars ONLY inside JSON string values
    text = fixJsonControlChars(text);

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Last resort: extract individual fields with regex
      console.warn("[Voice AI] JSON.parse failed, falling back to regex extraction");
      const extractString = (key: string) => text.match(new RegExp(`"${key}"\\s*:\\s*"([^"\\\\]*(\\\\.[^"\\\\]*)*)"`  ))?.[1] || "";
      const extractArray = (key: string): any[] => {
        try {
          const m = text.match(new RegExp(`"${key}"\\s*:\\s*(\\[[\\s\\S]*?\\])`));
          if (m) return JSON.parse(fixJsonControlChars(m[1]));
        } catch { }
        return [];
      };
      const extractObject = (key: string): any => {
        try {
          const m = text.match(new RegExp(`"${key}"\\s*:\\s*(\\{[^}]*\\})`));
          if (m) return JSON.parse(fixJsonControlChars(m[1]));
        } catch { }
        return {};
      };
      parsed = {
        chiefComplaint: extractString("chiefComplaint"),
        diagnosis: extractString("diagnosis"),
        medications: extractArray("medications"),
        labTests: extractArray("labTests"),
        vitals: extractObject("vitals"),
        advice: extractString("advice"),
        icdCodes: extractArray("icdCodes"),
      };
    }
    const processingTime = Date.now() - startTime;

    return {
      transcription: transcriptText,
      diagnosis: parsed.diagnosis || "",
      chiefComplaint: parsed.chiefComplaint || "",
      medications: parsed.medications || [],
      labTests: parsed.labTests || [],
      vitals: parsed.vitals || {},
      advice: parsed.advice || "",
      icdCodes: parsed.icdCodes || [],
      followUpDate: parsed.followUpDate || undefined,
      followUpNotes: parsed.followUpNotes || undefined,
      metadata: {
        processingTime,
        confidence: parsed.confidence || 0.9,
        language: "en",
      },
    };
  } catch (error: any) {
    console.error("Voice transcription error:", error);
    throw new Error(`AI transcription failed: ${error.message}`);
  }
}

export async function processVoiceRecording(
  prescriptionId: string,
  hospitalId: string,
  transcriptText: string,
  voiceRecordingUrl?: string,
  language?: string
): Promise<any> {
  const prescription = await px.prescription.findFirst({
    where: { id: prescriptionId, hospitalId },
    include: {
      patient: true,
      doctor: { include: { department: true } },
      appointment: true,
    },
  });

  if (!prescription) {
    throw new Error("Prescription not found");
  }

  const patientAge = prescription.patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(prescription.patient.dateOfBirth).getTime()) / 31557600000)
    : undefined;

  const medicalHistory = await px.prescription
    .findMany({
      where: {
        patientId: prescription.patientId,
        hospitalId,
        status: { not: "DRAFT" },
        id: { not: prescriptionId },
      },
      select: { diagnosis: true, chiefComplaint: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
    .then((rxs: any[]) =>
      rxs
        .map((r) => r.diagnosis || r.chiefComplaint)
        .filter(Boolean)
        .join("; ")
    );

  const result = await transcribeAndGeneratePrescription(
    transcriptText,
    {
      name: prescription.patient.name,
      age: patientAge,
      gender: prescription.patient.gender,
      bloodGroup: prescription.patient.bloodGroup,
      medicalHistory: medicalHistory || undefined,
    },
    {
      name: prescription.doctor.name,
      specialization: prescription.doctor.specialization,
      department: prescription.doctor.department?.name,
    },
    language
  );

  const updateData: any = {
    transcription: result.transcription,
    chiefComplaint: result.chiefComplaint,
    diagnosis: result.diagnosis,
    medications: JSON.stringify(result.medications),
    labTests: JSON.stringify(result.labTests),
    vitals: JSON.stringify(result.vitals),
    advice: result.advice,
    icdCodes: JSON.stringify(result.icdCodes),
    followUpDate: result.followUpDate ? new Date(result.followUpDate) : null,
    followUpNotes: result.followUpNotes || null,
    transcriptionMetadata: JSON.stringify(result.metadata),
    aiProcessedAt: new Date(),
  };

  if (voiceRecordingUrl) {
    updateData.voiceRecordingUrl = voiceRecordingUrl;
  }

  const updated = await px.prescription.update({
    where: { id: prescriptionId },
    data: updateData,
  });

  return {
    prescription: updated,
    aiResult: result,
  };
}

export async function streamTranscription(
  audioChunk: string,
  context: {
    patientName: string;
    doctorName: string;
    previousTranscript?: string;
  }
): Promise<{ transcript: string; isComplete: boolean }> {
  try {
    const prompt = `You are transcribing a live doctor-patient conversation.

Doctor: Dr. ${context.doctorName}
Patient: ${context.patientName}
${context.previousTranscript ? `Previous transcript:\n${context.previousTranscript}\n\n` : ""}

New audio segment:
${audioChunk}

Provide ONLY the transcription of this segment. Format as:
Doctor: [what doctor said]
Patient: [what patient said]

Be accurate and use medical terminology where appropriate.`;

    const text = await callOpenRouterForVoice(
      "You are a medical transcription assistant. Transcribe doctor-patient conversations accurately.",
      prompt
    );

    return {
      transcript: text,
      isComplete: false,
    };
  } catch (error: any) {
    console.error("Stream transcription error:", error);
    return {
      transcript: "",
      isComplete: false,
    };
  }
}
