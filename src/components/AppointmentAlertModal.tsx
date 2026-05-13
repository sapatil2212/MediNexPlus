"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, CalendarDays, Clock, User, Stethoscope, Building2,
  Phone, Mail, IndianRupee, FileText, Bell, CheckCircle
} from "lucide-react";

const ACCENT = "#0E898F";
const BORDER = "#e2e8f0";
const LIGHT_BG = "#f8fafc";

interface AppointmentAlert {
  id: string;
  tokenNumber?: number;
  patient?: { id: string; name: string; patientId: string; phone?: string; email?: string; gender?: string };
  doctor?: { id: string; name: string; specialization?: string };
  department?: { id: string; name: string };
  appointmentDate: string;
  timeSlot: string;
  type: string;
  status: string;
  consultationFee?: number;
  notes?: string;
  createdAt: string;
}

// Generate alert sound using Web Audio API (no mp3 file needed)
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // First beep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    // Second beep (higher pitch, slight delay)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.35);
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
    osc2.start(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.65);

    // Third beep (even higher)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.frequency.setValueAtTime(1320, ctx.currentTime + 0.7);
    osc3.type = "sine";
    gain3.gain.setValueAtTime(0, ctx.currentTime);
    gain3.gain.setValueAtTime(0.35, ctx.currentTime + 0.7);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.1);
    osc3.start(ctx.currentTime + 0.7);
    osc3.stop(ctx.currentTime + 1.1);

    // Cleanup
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Audio not available
  }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function AppointmentAlertModal() {
  const [alerts, setAlerts] = useState<AppointmentAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<AppointmentAlert | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Connect to SSE stream
  useEffect(() => {
    const connectSSE = () => {
      const es = new EventSource("/api/appointments/stream", { withCredentials: true });
      esRef.current = es;

      es.onopen = () => {
        console.log("[AppointmentAlert] SSE connected");
      };

      es.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          console.log("[AppointmentAlert] SSE event:", data.type);
          if (data.type === "NEW_APPOINTMENT" && data.appointment) {
            setAlerts(prev => [data.appointment, ...prev]);
          }
        } catch {}
      };

      es.onerror = () => {
        console.log("[AppointmentAlert] SSE error, reconnecting in 10s");
        es.close();
        setTimeout(connectSSE, 10000);
      };
    };

    connectSSE();
    return () => { esRef.current?.close(); };
  }, []);

  // When new alerts come in, show the first one
  useEffect(() => {
    if (alerts.length > 0 && !currentAlert) {
      const next = alerts[0];
      setCurrentAlert(next);
      setAlerts(prev => prev.slice(1));
      setIsVisible(true);
      playAlertSound();
    }
  }, [alerts, currentAlert]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentAlert(null);
    }, 300);
  }, []);

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (!currentAlert) return;
    const timer = setTimeout(dismiss, 30000);
    return () => clearTimeout(timer);
  }, [currentAlert, dismiss]);

  if (!currentAlert) return null;

  const appt = currentAlert;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: isVisible ? "auto" : "none",
        }}
      />

      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: isVisible ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0.9)",
          opacity: isVisible ? 1 : 0,
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          zIndex: 100000,
          width: "min(520px, 92vw)",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Header with pulse animation */}
        <div style={{
          background: `linear-gradient(135deg, ${ACCENT}, #0A6B70)`,
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "apptAlertPulse 2s ease-in-out infinite",
            }}>
              <Bell size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>
                New Appointment Booked!
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                {appt.type || "OPD"} · Just now
              </div>
            </div>
          </div>
          <button
            onClick={dismiss}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,255,255,0.15)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", transition: "background 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>

          {/* Token Badge */}
          {appt.tokenNumber && (
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 20px", borderRadius: 50,
                background: `linear-gradient(135deg, ${ACCENT}12, ${ACCENT}08)`,
                border: `2px solid ${ACCENT}30`,
                fontSize: 18, fontWeight: 800, color: ACCENT,
                letterSpacing: "0.02em",
              }}>
                Token #{appt.tokenNumber}
              </span>
            </div>
          )}

          {/* Patient Info Card */}
          <div style={{
            display: "flex", gap: 14, padding: 16,
            background: LIGHT_BG, borderRadius: 14,
            border: `1px solid ${BORDER}`, marginBottom: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: ACCENT, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, flexShrink: 0,
            }}>
              {(appt.patient?.name || "P")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                {appt.patient?.name || "Unknown Patient"}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                {appt.patient?.patientId || "—"}
                {appt.patient?.gender ? ` · ${appt.patient.gender}` : ""}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                {appt.patient?.phone && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#475569" }}>
                    <Phone size={12} /> {appt.patient.phone}
                  </span>
                )}
                {appt.patient?.email && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#475569" }}>
                    <Mail size={12} /> {appt.patient.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Details Grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 10, marginBottom: 16,
          }}>
            {/* Doctor */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 12,
              background: "#f0fdfa", border: "1px solid #ccfbf1",
            }}>
              <Stethoscope size={16} color={ACCENT} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Doctor</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 1 }}>
                  {appt.doctor?.name || "—"}
                </div>
                {appt.doctor?.specialization && (
                  <div style={{ fontSize: 11, color: "#64748b" }}>{appt.doctor.specialization}</div>
                )}
              </div>
            </div>

            {/* Department */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 12,
              background: "#f0f9ff", border: "1px solid #bae6fd",
            }}>
              <Building2 size={16} color="#0284c7" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Department</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 1 }}>
                  {appt.department?.name || "—"}
                </div>
              </div>
            </div>

            {/* Date */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 12,
              background: "#fffbeb", border: "1px solid #fde68a",
            }}>
              <CalendarDays size={16} color="#d97706" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 1 }}>
                  {formatDate(appt.appointmentDate)}
                </div>
              </div>
            </div>

            {/* Time */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 12,
              background: "#faf5ff", border: "1px solid #e9d5ff",
            }}>
              <Clock size={16} color="#9333ea" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Time Slot</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 1 }}>
                  {appt.timeSlot || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Fee & Notes */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {appt.consultationFee != null && appt.consultationFee > 0 && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                fontSize: 13, fontWeight: 600, color: "#16a34a",
              }}>
                <IndianRupee size={14} /> {appt.consultationFee}
              </div>
            )}
            {appt.notes && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                background: LIGHT_BG, border: `1px solid ${BORDER}`,
                fontSize: 12, color: "#475569", maxWidth: "100%",
              }}>
                <FileText size={14} style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: `1px solid ${BORDER}`,
          display: "flex", justifyContent: "flex-end", gap: 10,
          background: LIGHT_BG,
        }}>
          <button
            onClick={dismiss}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 24px", borderRadius: 10,
              background: ACCENT, color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 600,
              transition: "all 0.2s",
              boxShadow: `0 2px 8px ${ACCENT}40`,
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <CheckCircle size={16} />
            Acknowledge
          </button>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes apptAlertPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </>
  );
}
