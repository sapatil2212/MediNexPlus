"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, Loader2, Sparkles, CheckCircle2, AlertCircle, Play, Pause, Square, FileText, X, MicOff } from "lucide-react";

interface VoicePrescriptionRecorderProps {
  prescriptionId: string;
  patientName: string;
  doctorName: string;
  onTranscriptionComplete: (result: any) => void;
  onClose: () => void;
  accent?: string;
}

export default function VoicePrescriptionRecorder({
  prescriptionId,
  patientName,
  doctorName,
  onTranscriptionComplete,
  onClose,
  accent = "#10b981",
}: VoicePrescriptionRecorderProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "complete" | "error" | "manual">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [manualText, setManualText] = useState("");
  const [autoFallback, setAutoFallback] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const liveTranscriptRef = useRef<string>("");
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
  const stoppingRef = useRef(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
    };
  }, []);

  const scheduleRestart = (recognition: any) => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(() => {
      if (isRecordingRef.current && !isPausedRef.current) {
        try { recognition.start(); } catch { }
      }
    }, 150);
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      microphone.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(100, (avg / 128) * 100));
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch { }
  };

  const startRecording = async () => {
    try {
      setErrorMsg("");
      finalTranscriptRef.current = "";
      setTranscript("");

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setErrorMsg("Speech recognition not supported. Please use Chrome or Edge browser.");
        setStatus("error");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setupAudioAnalyser(stream);

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = selectedLanguage;

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t + " ";
          else interim += t;
        }
        if (final) finalTranscriptRef.current += final;
        const live = finalTranscriptRef.current + interim;
        liveTranscriptRef.current = live;
        setTranscript(live);
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        if (err === "not-allowed") {
          setErrorMsg("Microphone access denied. Please allow microphone in browser settings.");
          setStatus("error");
          return;
        }
        // no-speech / audio-capture / network: restart silently
        if (err === "no-speech" || err === "audio-capture" || err === "network") {
          scheduleRestart(recognition);
          return;
        }
        // Other errors: attempt restart
        scheduleRestart(recognition);
      };

      recognition.onend = () => {
        if (stoppingRef.current) {
          stoppingRef.current = false;
          recognitionRef.current = null;
          processTranscript(liveTranscriptRef.current.trim());
          return;
        }
        scheduleRestart(recognition);
      };

      recognitionRef.current = recognition;
      isRecordingRef.current = true;
      isPausedRef.current = false;
      recognition.start();

      setStatus("recording");
      setIsPaused(false);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (err: any) {
      setErrorMsg("Could not access microphone. Please allow microphone permission.");
      setStatus("error");
    }
  };

  const pauseRecording = () => {
    isPausedRef.current = true;
    setIsPaused(true);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resumeRecording = () => {
    isPausedRef.current = false;
    setIsPaused(false);
    if (recognitionRef.current) { try { recognitionRef.current.start(); } catch {} }
    timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    isPausedRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    setIsPaused(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    if (recognitionRef.current) {
      stoppingRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch {
        stoppingRef.current = false;
        recognitionRef.current = null;
        processTranscript(liveTranscriptRef.current.trim());
      }
    } else {
      processTranscript(liveTranscriptRef.current.trim());
    }
  };

  const processTranscript = async (text: string) => {
    if (!text) {
      setAutoFallback(true);
      setManualText("");
      setStatus("manual");
      return;
    }
    setStatus("processing");
    try {
      const res = await fetch("/api/prescriptions/voice-transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prescriptionId, transcriptText: text, language: selectedLanguage }),
      });
      const result = await res.json();
      if (result.success) {
        setStatus("complete");
        onTranscriptionComplete(result.data);
      } else {
        setErrorMsg(result.message || "AI processing failed.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const LANG_NAMES: Record<string, string> = {
    "en-IN": "English (India)", "hi-IN": "Hindi", "mr-IN": "Marathi",
    "ta-IN": "Tamil", "te-IN": "Telugu", "kn-IN": "Kannada",
    "gu-IN": "Gujarati", "bn-IN": "Bengali", "ml-IN": "Malayalam", "pa-IN": "Punjabi",
  };

  const BARS = 18;

  const closeAll = () => {
    isRecordingRef.current = false;
    isPausedRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    setIsPaused(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,18,38,0.72)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 24, width: 500, maxWidth: "100%", boxShadow: "0 30px 80px rgba(0,0,0,0.35)", animation: "vModalIn .28s cubic-bezier(.34,1.4,.64,1)", overflow: "hidden", position: "relative" }}>

        {/* ── Modal Header ── */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${accent},#059669)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 10px ${accent}40` }}>
              <Mic size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>AI Voice Prescription</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Speak the consultation — AI fills the prescription</div>
            </div>
          </div>
          {status !== "processing" && (
            <button onClick={closeAll} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94a3b8", flexShrink: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── IDLE state ── */}
        {(status === "idle" || status === "error") && (
          <div style={{ padding: "20px 24px 24px" }}>
            {status === "error" && (
              <div style={{ padding: "10px 14px", background: "#fff5f5", borderRadius: 10, border: "1px solid #fecaca", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 2 }}>Recording failed</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{errorMsg}</div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, flexShrink: 0 }}>🌐 Language:</span>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#fff" }}
              >
                <option value="en-IN">🇮🇳 English (India)</option>
                <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
                <option value="mr-IN">🇮🇳 मराठी (Marathi)</option>
                <option value="ta-IN">🇮🇳 தமிழ் (Tamil)</option>
                <option value="te-IN">🇮🇳 తెలుగు (Telugu)</option>
                <option value="kn-IN">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                <option value="gu-IN">🇮🇳 ગુજરાતી (Gujarati)</option>
                <option value="bn-IN">🇮🇳 বাংলা (Bengali)</option>
                <option value="ml-IN">🇮🇳 മലയാളം (Malayalam)</option>
                <option value="pa-IN">🇮🇳 ਪੰਜਾਬੀ (Punjabi)</option>
              </select>
            </div>
            <div style={{ padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
                💡 <b>Tips for best results:</b> Speak clearly near the mic · Mention patient name, symptoms, BP, medicines · Use Chrome/Edge browser
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={startRecording}
                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 18px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${accent},#059669)`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${accent}45` }}
              >
                <Mic size={16} /> Start Recording
              </button>
              <button
                onClick={() => { setAutoFallback(false); setStatus("manual"); setManualText(""); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                <FileText size={14} /> Type
              </button>
            </div>
          </div>
        )}

        {/* ── RECORDING state (waves appear here in same modal) ── */}
        {status === "recording" && (
          <div style={{ padding: "24px 24px 28px" }}>
            {/* Mic + pulse rings */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
              <div style={{ position: "relative", width: 88, height: 88, marginBottom: 12 }}>
                <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: `2px solid ${accent}35`, animation: isPaused ? "none" : "vRingPulse 2s ease-out infinite" }} />
                <div style={{ position: "absolute", inset: -20, borderRadius: "50%", border: `2px solid ${accent}18`, animation: isPaused ? "none" : "vRingPulse 2s ease-out infinite .5s" }} />
                <div style={{ width: 88, height: 88, borderRadius: "50%", background: isPaused ? "#f1f5f9" : `linear-gradient(135deg,${accent},#059669)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isPaused ? "none" : `0 8px 28px ${accent}55`, transition: "all .3s" }}>
                  {isPaused ? <MicOff size={34} color="#94a3b8" /> : <Mic size={34} color="#fff" />}
                </div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: accent, letterSpacing: "-1.5px", fontVariantNumeric: "tabular-nums" }}>{formatTime(recordingTime)}</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3, color: isPaused ? "#f59e0b" : "#10b981" }}>
                {isPaused ? "⏸ Paused" : `🎙 Listening in ${LANG_NAMES[selectedLanguage] || "English"}...`}
              </div>
            </div>

            {/* Animated waveform bars */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, height: 52, marginBottom: 18 }}>
              {Array.from({ length: BARS }).map((_, i) => (
                <div key={i} style={{
                  width: 4,
                  borderRadius: 4,
                  background: isPaused ? "#e2e8f0" : `linear-gradient(180deg,${accent},#059669)`,
                  animation: isPaused ? "none" : `vWave ${0.55 + (i % 5) * 0.12}s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.05}s`,
                  height: isPaused ? 6 : 6,
                  minHeight: 4,
                  transition: "background .3s, height .3s",
                }} />
              ))}
            </div>

            {/* Live transcript */}
            <div style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e8edf3", padding: "10px 14px", marginBottom: 16, minHeight: 72, maxHeight: 120, overflowY: "auto" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#b0bec5", letterSpacing: ".08em", marginBottom: 4 }}>LIVE TRANSCRIPT</div>
              <div style={{ fontSize: 12.5, color: transcript ? "#334155" : "#94a3b8", lineHeight: 1.65 }}>
                {transcript || "Start speaking — I’m listening..."}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 10 }}>
              {!isPaused ? (
                <button onClick={pauseRecording} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <Pause size={14} /> Pause
                </button>
              ) : (
                <button onClick={resumeRecording} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", borderRadius: 11, border: "none", background: accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <Play size={14} /> Resume
                </button>
              )}
              <button onClick={stopRecording} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(239,68,68,.35)" }}>
                <Square size={14} /> Stop &amp; Generate Prescription
              </button>
            </div>
          </div>
        )}

        {/* ── PROCESSING state ── */}
        {status === "processing" && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Loader2 size={34} color={accent} style={{ animation: "vSpin 1s linear infinite" }} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>AI is generating prescription...</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Analysing transcript · Extracting diagnosis, medicines, vitals</div>
          </div>
        )}

        {/* ── COMPLETE state ── */}
        {status === "complete" && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", border: "2px solid #bbf7d0" }}>
              <CheckCircle2 size={34} color="#16a34a" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Prescription Filled!</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>All fields have been auto-populated from the conversation.</div>
            <button onClick={closeAll} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${accent},#059669)`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
        )}

        {/* ── MANUAL state ── */}
        {status === "manual" && (
          <div style={{ padding: "20px 24px 24px" }}>
            {autoFallback && (
              <div style={{ padding: "9px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, marginBottom: 12, fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
                🎤 <b>Speech not captured</b> — microphone may need a moment or your browser may not support auto-transcription. Type the consultation below and AI will process it.
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={14} color={accent} /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Type Consultation Text</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>AI will extract and fill the prescription</div>
              </div>
            </div>
            <textarea
              autoFocus
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder={`Example:\nPatient has fever since 2 days, 102\u00b0F. BP 120/80.\nPrescribed Paracetamol 500mg BD x 5 days, ORS.\nAdvised rest and fluids. Follow up after 3 days.`}
              rows={7}
              style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6, outline: "none" }}
              onFocus={e => (e.target.style.borderColor = accent)}
              onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={() => setStatus("idle")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Back</button>
              <button
                onClick={() => processTranscript(manualText.trim())}
                disabled={!manualText.trim()}
                style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", borderRadius: 10, border: "none", background: manualText.trim() ? `linear-gradient(135deg,${accent},#059669)` : "#e2e8f0", color: manualText.trim() ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: 700, cursor: manualText.trim() ? "pointer" : "default", boxShadow: manualText.trim() ? `0 4px 12px ${accent}40` : "none" }}
              >
                <Sparkles size={14} /> Generate Prescription
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes vSpin     { to { transform: rotate(360deg); } }
        @keyframes vModalIn  { from { opacity:0; transform:scale(.86) translateY(18px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes vRingPulse{ 0%{transform:scale(1);opacity:.9} 100%{transform:scale(1.65);opacity:0} }
        @keyframes vWave     { from { height: 4px; } to { height: 46px; } }
      `}</style>
    </div>
  );
}
