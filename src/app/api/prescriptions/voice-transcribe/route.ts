import { NextRequest, NextResponse } from "next/server";
import { processVoiceRecording } from "@/../../backend/services/voice-prescription.service";
import { authMiddleware } from "@/../../backend/middlewares/auth.middleware";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { hospitalId, role } = authResult.user;

    if (role !== "DOCTOR") {
      return NextResponse.json({ success: false, message: "Only doctors can use voice prescription" }, { status: 403 });
    }

    if (!hospitalId) {
      return NextResponse.json({ success: false, message: "Hospital ID not found" }, { status: 400 });
    }

    const body = await req.json();
    const { prescriptionId, transcriptText, voiceRecordingUrl, language } = body;

    if (!prescriptionId || !transcriptText) {
      return NextResponse.json(
        { success: false, message: "Prescription ID and transcript text are required" },
        { status: 400 }
      );
    }

    const result = await processVoiceRecording(
      prescriptionId,
      hospitalId,
      transcriptText,
      voiceRecordingUrl,
      language
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: "Voice prescription processed successfully",
    });
  } catch (error: any) {
    console.error("Voice transcription API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process voice recording" },
      { status: 500 }
    );
  }
}
