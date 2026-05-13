"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Sparkles, Plus, Trash2, Save, CheckCircle2,
  Loader2, Download, Mail, ChevronDown, ChevronUp,
  Activity, Pill, FlaskConical, Building2, FileText,
  Heart, Thermometer, Weight, Eye, X, History, Brain, Stethoscope, Pencil,
  Search, Check, Mic, MicOff
} from "lucide-react";
import PatientProfilePanel from "@/components/PatientProfilePanel";
import VoicePrescriptionRecorder from "@/components/VoicePrescriptionRecorder";
import { useDoctorDashboardOptional } from "../../dashboard/DoctorDashboardContext";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  return (await fetch(url, opts)).json();
};

interface Med { name: string; dosage: string; frequency: string; duration: string; route: string; instructions: string; }
interface Test { name: string; urgency: string; notes: string; }
interface Ref { subDeptId: string; subDeptName: string; reason: string; priority: string; notes: string; }
interface Vit { bp: string; pulse: string; temp: string; weight: string; height: string; spo2: string; rr: string; }

const EMPTY_V: Vit = { bp: "", pulse: "", temp: "", weight: "", height: "", spo2: "", rr: "" };
const FREQS = ["Once daily (OD)", "Twice daily (BD)", "Thrice daily (TDS)", "Four times (QDS)", "Every 6h (Q6H)", "Every 8h (Q8H)", "Every 12h (Q12H)", "At bedtime (HS)", "As needed (SOS)", "Before food (AC)", "After food (PC)"];
const ROUTES = ["Oral", "IV", "IM", "SC", "Topical", "Sublingual", "Inhalation", "Rectal", "Ophthalmic", "Otic", "Nasal"];

const COMMON_COMPLAINTS = ["Fever and chills", "Headache", "Cough and cold", "Chest pain", "Abdominal pain", "Back pain", "Sore throat", "Vomiting", "Diarrhoea", "Breathlessness", "Joint pain", "Skin rash", "Urinary burning", "Fatigue", "Dizziness", "Nausea", "Ear pain", "Eye pain", "Toothache", "Leg swelling"];
const COMMON_DIAGNOSES = ["Hypertension", "Type 2 Diabetes Mellitus", "Upper Respiratory Tract Infection", "Acute Gastroenteritis", "Urinary Tract Infection", "Acute Bronchitis", "Migraine", "Osteoarthritis", "Iron Deficiency Anemia", "Hypothyroidism", "Dengue Fever", "Typhoid Fever", "Viral Fever", "Acid Peptic Disease", "Allergic Rhinitis"];
const COMMON_MEDS = ["Paracetamol", "Amoxicillin", "Metformin", "Atorvastatin", "Amlodipine", "Omeprazole", "Azithromycin", "Ciprofloxacin", "Ibuprofen", "Metronidazole", "Pantoprazole", "Cetirizine", "Doxycycline", "Salbutamol", "Cough Syrup", "ORS", "Multivitamin", "Vitamin D3", "Calcium Carbonate", "Aspirin"];

function SectionCard({ title, icon, accent, children, extra }: any) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, marginBottom: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.03)" }}>
      <div style={{ width: "100%", padding: "12px 18px", background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>{icon}</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{title}</span>
        </div>
        {extra && <div>{extra}</div>}
      </div>
      <div style={{ padding: "0 18px 16px" }}>{children}</div>
    </div>
  );
}

function SearchableSelect({ options, value, onChange, placeholder, disabled }: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flex: 2, zIndex: open ? 1000 : 1 }}>
      <div onClick={() => !disabled && setOpen(!open)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 9px", borderRadius: 7, border: "1px solid #bae6fd", fontSize: 10, background: disabled ? "#f8fafc" : "#fff", cursor: disabled ? "default" : "pointer", minHeight: 31 }}>
        <span style={{ color: selected ? "#1e293b" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={12} color="#64748b" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1px solid #bae6fd", borderRadius: 8, boxShadow: "0 10px 25px rgba(0,0,0,.15)", zIndex: 1001, maxHeight: 200, overflowY: "auto" }}>
          <div style={{ padding: 6, borderBottom: "1px solid #f0f9ff", position: "sticky", top: 0, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "#f8fafc", borderRadius: 5 }}>
              <Search size={10} color="#94a3b8" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                style={{ border: "none", background: "none", outline: "none", fontSize: 10, width: "100%", color: "#334155" }} />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: 10, color: "#94a3b8", textAlign: "center" }}>No options found</div>
          ) : (
            filtered.map(o => (
              <div key={o.id} onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                style={{ padding: "8px 12px", fontSize: 10, cursor: "pointer", background: o.id === value ? "#f0f9ff" : "none", color: o.id === value ? "#0ea5e9" : "#334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = o.id === value ? "#f0f9ff" : "none")}>
                {o.label}
                {o.id === value && <Check size={10} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function VoiceWave({ color = "#ef4444" }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 12 }}>
      {[0.4, 0.7, 1, 0.7, 0.4].map((v, i) => (
        <div key={i} style={{ 
          width: 2, 
          height: "100%", 
          background: color, 
          borderRadius: 2,
          animation: `voiceWaveAnim 0.8s ease-in-out infinite`,
          animationDelay: `${i * 0.15}s`,
          transform: `scaleY(${v})`
        }} />
      ))}
    </div>
  );
}

function getDeptAccent(n?: string): string {
  if (!n) return "#10b981";
  const l = n.toLowerCase();
  if (l.includes("cardio")) return "#ef4444";
  if (l.includes("neuro")) return "#8b5cf6";
  if (l.includes("ortho")) return "#f59e0b";
  if (l.includes("derma")) return "#14b8a6";
  return "#10b981";
}

export default function PrescriptionPage() {
  const router = useRouter();
  const { appointmentId } = useParams() as { appointmentId: string };
  const searchParams = useSearchParams();
  const dashCtx = useDoctorDashboardOptional();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [doctor, setDoctor] = useState<any>(null);
  const [appt, setAppt] = useState<any>(null);
  const [rx, setRx] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [hist, setHist] = useState<any[]>([]);
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [vitals, setVitals] = useState<Vit>(EMPTY_V);
  const [complaint, setComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [icdCodes, setIcdCodes] = useState<string[]>([]);
  const [meds, setMeds] = useState<Med[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [refs, setRefs] = useState<Ref[]>([]);
  const [advice, setAdvice] = useState("");
  const [fuDate, setFuDate] = useState("");
  const [fuNotes, setFuNotes] = useState("");
  const [fee, setFee] = useState(0);
  const [docNotes, setDocNotes] = useState("");
  const [aiData, setAiData] = useState<any>(null);
  const [showAi, setShowAi] = useState(true);
  const [showHist, setShowHist] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [msg, setMsg] = useState({ t: "", c: "" });
  const [sections, setSections] = useState<Record<string, boolean>>({ vitals: true, complaint: true, diag: true, meds: true, tests: false, refs: false, advice: true, fu: false, fee: true, hist: false });
  const [pSettings, setPSettings] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [histLoaded, setHistLoaded] = useState(false);
  const [expandedHistIdx, setExpandedHistIdx] = useState<number | null>(null);
  const [complaintSugg, setComplaintSugg] = useState<string[]>([]);
  const [diagSugg, setDiagSugg] = useState<string[]>([]);
  const [subDeptsLoaded, setSubDeptsLoaded] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [myPlans, setMyPlans] = useState<any[]>([]);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [activeVoiceTarget, setActiveVoiceTarget] = useState<string | null>(null);
  const voiceRecogRef = useRef<any>(null);
  const voiceStoppingRef = useRef(false);
  const voiceFinalRef = useRef("");

  const stopVoiceTyping = (triggerAi = false) => {
    voiceStoppingRef.current = true;
    const target = activeVoiceTarget;
    if (voiceRecogRef.current) {
      try { voiceRecogRef.current.stop(); } catch {}
      voiceRecogRef.current = null;
    }
    setActiveVoiceTarget(null);
    if (triggerAi && target === "diagnosis" && voiceFinalRef.current.trim()) {
      setTimeout(() => aiSmartAssist(true), 500);
    }
  };

  const startVoiceTyping = (target: "complaint" | "diagnosis" | "advice") => {
    // Toggle: if already listening on this target, stop it
    if (activeVoiceTarget === target) {
      stopVoiceTyping(true);
      return;
    }
    // Stop any existing recognition first
    if (voiceRecogRef.current) {
      voiceStoppingRef.current = true;
      try { voiceRecogRef.current.stop(); } catch {}
      voiceRecogRef.current = null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    voiceFinalRef.current = "";
    voiceStoppingRef.current = false;

    recognition.onstart = () => setActiveVoiceTarget(target);

    recognition.onend = () => {
      if (voiceStoppingRef.current) {
        voiceStoppingRef.current = false;
        return;
      }
      // Auto-restart (continuous listening until user clicks stop)
      try { recognition.start(); } catch {}
    };

    recognition.onerror = (event: any) => {
      const err = event.error;
      if (err === "not-allowed") {
        setActiveVoiceTarget(null);
        voiceRecogRef.current = null;
        return;
      }
      // no-speech / audio-capture / network: silently restart via onend
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          voiceFinalRef.current += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const fullText = voiceFinalRef.current + interimTranscript;
      if (fullText.trim()) {
        if (target === "complaint") setComplaint(fullText.trim());
        if (target === "diagnosis") setDiagnosis(fullText.trim());
        if (target === "advice") setAdvice(fullText.trim());
      }
    };

    voiceRecogRef.current = recognition;
    recognition.start();
  };

  const tog = (s: string) => setSections(p => ({ ...p, [s]: !p[s] }));
  const saveTimer = useRef<any>(null);
  const autoGenRef = useRef(false);
  const autoGenTimerRef = useRef<any>(null);
  // Reset auto-gen flag on new appointment
  useEffect(() => { autoGenRef.current = false; }, [appointmentId]);

  const viewOnly = searchParams.get("mode") === "view";
  const startInEdit = searchParams.get("edit") === "1" || searchParams.get("mode") === "edit";
  useEffect(() => {
    if (startInEdit) setEditMode(true);
  }, [startInEdit]);
  useEffect(() => {
    if (viewOnly) setEditMode(false);
  }, [viewOnly]);

  // Load data — uses cached context doctor for instant load, fetches full data in background
  useEffect(() => {
    (async () => {
      setLoading(true);
      setShowAi(false);
      setShowHist(false);
      setHist([]);
      setHistLoaded(false);
      setSections(prev => ({ ...prev, hist: false }));

      // Use context doctor data if available (instant, no API call)
      const cachedDoc = dashCtx?.doctor || null;
      let docData: any = cachedDoc;
      let ar: any, rr: any;

      if (cachedDoc) {
        // Fast path: only 2 API calls (doctor already in context)
        [ar, rr] = await Promise.all([
          api(`/api/appointments/${appointmentId}`),
          api("/api/prescriptions", "POST", { appointmentId }),
        ]);
      } else {
        // Fallback: no context (standalone mode), need all 3 calls
        const [me, _ar, _rr] = await Promise.all([
          api("/api/doctor/me"),
          api(`/api/appointments/${appointmentId}`),
          api("/api/prescriptions", "POST", { appointmentId }),
        ]);
        if (!me.success) { router.push("/login"); return; }
        docData = me.data;
        ar = _ar;
        rr = _rr;
      }

      setDoctor(docData);
      if (docData?.prescriptionSettings) {
        try { setPSettings(JSON.parse(docData.prescriptionSettings)); } catch { }
      }

      if (!ar.success) { setMsg({ t: "Appointment not found", c: "e" }); setLoading(false); return; }
      setAppt(ar.data);
      setPatient(ar.data.patient);
      setFee(ar.data.consultationFee || docData?.consultationFee || 0);

      if (rr.success && rr.data?.prescription) {
        const p = rr.data.prescription;
        setRx(p);
        if (p.vitals) try { setVitals({ ...EMPTY_V, ...JSON.parse(p.vitals) }); } catch { }
        if (p.chiefComplaint) setComplaint(p.chiefComplaint);
        if (p.diagnosis) setDiagnosis(p.diagnosis);
        if (p.icdCodes) try { setIcdCodes(JSON.parse(p.icdCodes)); } catch { }
        if (p.medications) try { setMeds(JSON.parse(p.medications)); } catch { }
        if (p.labTests) try { setTests(JSON.parse(p.labTests)); } catch { }
        if (p.referrals) try { setRefs(JSON.parse(p.referrals)); } catch { }
        if (p.advice) setAdvice(p.advice);
        if (p.followUpDate) setFuDate(new Date(p.followUpDate).toISOString().split("T")[0]);
        if (p.followUpNotes) setFuNotes(p.followUpNotes);
        if (p.consultationFee != null) setFee(p.consultationFee);
        if (p.doctorNotes) setDocNotes(p.doctorNotes);
        if (p.aiSuggestions) try { setAiData(JSON.parse(p.aiSuggestions)); } catch { }
      }

      setLoading(false);

      // Background: fetch full doctor data for hospital settings (PDF/email)
      if (cachedDoc) {
        api("/api/doctor/me").then(me => {
          if (me.success) {
            setDoctor(me.data);
            if (me.data.prescriptionSettings) {
              try { setPSettings(JSON.parse(me.data.prescriptionSettings)); } catch { }
            }
          }
        }).catch(() => {});
      }

      if (ar.data.patient?.id) {
        const rxId = rr.data?.prescription?.id || "";
        const histUrl = `/api/prescriptions/patient-history/${ar.data.patient.id}${rxId ? `?excludeId=${rxId}` : ""}`;
        api(histUrl).then(h => {
          const data: any[] = h.success ? (h.data || []) : [];
          setHist(data);
          if (data.length > 0) setSections(prev => ({ ...prev, hist: true }));
          setHistLoaded(true);
        }).catch(() => { setHistLoaded(true); });
      } else {
        setHistLoaded(true);
      }

      // Load doctor's active treatment plans for assignment
      if (!viewOnly && docData?.id) {
        api(`/api/treatment-plans?doctorId=${docData.id}&status=ACTIVE&limit=50`).then(r => {
          if (r.success) setMyPlans(r.data?.plans || []);
          setPlansLoaded(true);
        }).catch(() => { setPlansLoaded(true); });
      }
    })();
  }, [appointmentId, router, viewOnly]);

  const ensureHistoryLoaded = useCallback(async () => {
    if (histLoaded) return;
    if (!patient?.id) { setHistLoaded(true); return; }
    try {
      const h = await api(`/api/prescriptions/patient-history/${patient.id}`);
      if (h.success) setHist(h.data || []);
    } finally {
      setHistLoaded(true);
    }
  }, [histLoaded, patient?.id]);

  const ensureSubDeptsLoaded = useCallback(async () => {
    if (subDeptsLoaded) return;
    try {
      const r = await api("/api/config/subdepartments?limit=50");
      if (r.success) setSubDepts(r.data?.data || r.data || []);
    } finally {
      setSubDeptsLoaded(true);
    }
  }, [subDeptsLoaded]);

  const payload = useCallback(() => ({
    vitals: JSON.stringify(vitals), chiefComplaint: complaint, diagnosis, icdCodes: JSON.stringify(icdCodes),
    medications: JSON.stringify(meds), labTests: JSON.stringify(tests), referrals: JSON.stringify(refs),
    advice, followUpDate: fuDate || null, followUpNotes: fuNotes, consultationFee: fee, doctorNotes: docNotes,
    aiSuggestions: aiData ? JSON.stringify(aiData) : undefined,
    ...(selectedPlanId ? { treatmentPlanId: selectedPlanId } : {}),
  }), [vitals, complaint, diagnosis, icdCodes, meds, tests, refs, advice, fuDate, fuNotes, fee, docNotes, aiData, selectedPlanId]);

  const finalized = rx?.status && rx.status !== "DRAFT";
  const locked = !!finalized && !editMode;
  const canComplete = !viewOnly && !!rx?.id && (rx?.status === "DRAFT" || editMode);

  useEffect(() => {
    if (locked) return;
    void ensureSubDeptsLoaded();
  }, [locked, ensureSubDeptsLoaded]);

  // Auto-save
  useEffect(() => {
    if (!rx?.id || locked) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { api(`/api/prescriptions/${rx.id}`, "PUT", payload()); }, 3000);
    return () => clearTimeout(saveTimer.current);
  }, [vitals, complaint, diagnosis, icdCodes, meds, tests, refs, advice, fuDate, fuNotes, fee, docNotes]);

  // Auto-generate AI prescription for fresh/empty prescriptions when complaint is entered
  useEffect(() => {
    if (locked || viewOnly || autoGenRef.current) return;
    if (!rx?.id || complaint.trim().length < 8) return;
    if (meds.length > 0 || diagnosis.trim()) return;
    if (autoGenTimerRef.current) clearTimeout(autoGenTimerRef.current);
    autoGenTimerRef.current = setTimeout(() => {
      if (autoGenRef.current) return;
      void aiSmartAssist();
    }, 2500);
    return () => { if (autoGenTimerRef.current) clearTimeout(autoGenTimerRef.current); };
  }, [complaint, meds.length, diagnosis, rx?.id, locked, viewOnly]);

  const save = async () => {
    if (!rx?.id) return; setSaving(true);
    const r = await api(`/api/prescriptions/${rx.id}`, "PUT", payload());
    if (r.success) { setRx(r.data); flash("Saved!", "s"); } else flash(r.message || "Failed", "e");
    setSaving(false);
  };

  const complete = async () => {
    if (!rx?.id) return;
    if (!diagnosis.trim()) { flash("Enter diagnosis first", "e"); return; }
    setCompleting(true);
    const r = await api(`/api/prescriptions/${rx.id}/complete`, "POST", payload());
    if (r.success) { setRx(r.data); flash("Prescription completed!", "s"); } else flash(r.message || "Failed", "e");
    setCompleting(false);
  };

  const aiSmartAssist = async (forcePanel = false) => {
    if (!complaint.trim()) { flash("Enter chief complaint first", "e"); return; }
    setAiLoading(true);
    const isEmpty = !diagnosis.trim() && meds.length === 0;
    if (isEmpty || forcePanel) setShowAi(true);
    const age = patient?.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000) : undefined;
    const fv: Record<string, string> = {};
    Object.entries(vitals).forEach(([k, v]) => { if (v && v.trim()) fv[k] = v; });
    const r = await api("/api/prescriptions/ai-assist", "POST", {
      chiefComplaint: complaint,
      patientAge: age,
      patientGender: patient?.gender,
      vitals: Object.keys(fv).length > 0 ? fv : undefined,
      patientHistory: hist.map(h => h.diagnosis || h.chiefComplaint).filter(Boolean).join("; ") || undefined,
      doctorSpecialization: doctor?.specialization,
      departmentName: doctor?.department?.name,
    });
    if (r.success) {
      const d = r.data;
      setAiData(d);
      if (d.diagnosis?.length > 0) setDiagSugg(d.diagnosis);
      if (isEmpty) {
        if (d.diagnosis?.length > 0) setDiagnosis(d.diagnosis[0]);
        if (d.icdCodes?.length > 0) setIcdCodes(d.icdCodes);
        if (d.medications?.length > 0) setMeds(d.medications);
        if (d.labTests?.length > 0) setTests(d.labTests);
        if (d.advice?.length > 0) setAdvice(d.advice.map((a: string) => `\u2022 ${a}`).join("\n"));
        autoGenRef.current = true;
        flash("\u2728 AI prescription auto-generated!", "s");
      } else {
        flash("AI suggestions ready in the panel", "s");
      }
    } else {
      flash(r.message || "AI unavailable — check API key", "e");
    }
    setAiLoading(false);
  };

  const applyHistoryItem = (h: any) => {
    if (h.chiefComplaint) setComplaint(h.chiefComplaint);
    if (h.diagnosis) setDiagnosis(h.diagnosis);
    if (h.icdCodes) try { setIcdCodes(JSON.parse(h.icdCodes)); } catch { }
    if (h.medications) try { setMeds(JSON.parse(h.medications)); } catch { }
    if (h.labTests) try { setTests(JSON.parse(h.labTests)); } catch { }
    if (h.advice) setAdvice(h.advice);
    flash("Prescription auto-filled from history!", "s");
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const el = document.querySelector(".printonly") as HTMLElement;
      if (!el) { flash("Print view not ready", "e"); setDownloadingPdf(false); return; }
      const prevDisplay = el.style.display;
      el.style.display = "block";
      el.style.position = "absolute";
      el.style.left = "-9999px";
      el.style.top = "0";
      await new Promise(r => setTimeout(r, 200));
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const fname = `Rx_${(patient?.name || "Patient").replace(/\s+/g, "_")}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.pdf`;
      const _hs = doctor?.hospital?.settings as any;
      const hasImgLh = !!(_hs?.letterhead && _hs?.letterheadType === "IMAGE");

      if (hasImgLh) {
        // Multi-page: letterhead on every page
        const saved = { pt: el.style.paddingTop, pb: el.style.paddingBottom, bi: el.style.backgroundImage };
        el.style.paddingTop = "0px";
        el.style.paddingBottom = "0px";
        el.style.backgroundImage = "none";
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: "#ffffff" });
        el.style.display = prevDisplay;
        el.style.position = "";
        el.style.left = "";
        el.style.top = "";
        el.style.paddingTop = saved.pt;
        el.style.paddingBottom = saved.pb;
        el.style.backgroundImage = saved.bi;

        // Get letterhead dimensions
        const lhImg = new Image();
        lhImg.crossOrigin = "anonymous";
        await new Promise<void>((res, rej) => { lhImg.onload = () => res(); lhImg.onerror = () => rej(); lhImg.src = _hs.letterhead; });
        const pgW = 210;
        const pgH = pgW * (lhImg.naturalHeight / lhImg.naturalWidth);
        const topM = pgW * 0.16;
        const botM = pgW * 0.13;
        const cH = pgH - topM - botM;
        const scaledH = (canvas.height * pgW) / canvas.width;

        const lhCv = document.createElement("canvas");
        lhCv.width = lhImg.naturalWidth; lhCv.height = lhImg.naturalHeight;
        lhCv.getContext("2d")!.drawImage(lhImg, 0, 0);
        const lhUrl = lhCv.toDataURL("image/jpeg", 0.95);

        // Smart page-break: scan for white rows to avoid cutting content
        const findSafeCut = (tgt: number): number => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return tgt;
          const sL = Math.round(canvas.width * 0.1), sR = Math.round(canvas.width * 0.9);
          const step = Math.max(1, Math.floor((sR - sL) / 40));
          for (let y = Math.min(tgt, canvas.height - 1); y > Math.max(0, tgt - 250); y--) {
            const row = ctx.getImageData(sL, y, sR - sL, 1).data;
            let w = 0, t = 0;
            for (let x = 0; x < (sR - sL) * 4; x += step * 4) { if (row[x] > 240 && row[x+1] > 240 && row[x+2] > 240) w++; t++; }
            if (t > 0 && w / t > 0.95) return y;
          }
          return tgt;
        };

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pgW, pgH] });
        const pageHPx = Math.round((cH / scaledH) * canvas.height);
        let cut = 0, pg = 0;
        while (cut < canvas.height) {
          if (pg > 0) pdf.addPage([pgW, pgH]);
          pdf.addImage(lhUrl, "JPEG", 0, 0, pgW, pgH);
          const rawEnd = Math.min(cut + pageHPx, canvas.height);
          const safeCut = rawEnd >= canvas.height ? canvas.height : findSafeCut(rawEnd);
          const srcHt = safeCut - cut;
          if (srcHt <= 0) break;
          const sc = document.createElement("canvas");
          sc.width = canvas.width; sc.height = srcHt;
          sc.getContext("2d")!.drawImage(canvas, 0, cut, canvas.width, srcHt, 0, 0, canvas.width, srcHt);
          pdf.addImage(sc.toDataURL("image/jpeg", 0.95), "JPEG", 0, topM, pgW, (srcHt * pgW) / canvas.width);
          cut = safeCut;
          pg++;
          if (pg > 20) break;
        }
        pdf.save(fname);
      } else {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, logging: false });
        el.style.display = prevDisplay;
        el.style.position = "";
        el.style.left = "";
        el.style.top = "";
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdfW = 210;
        const pdfH = (canvas.height * pdfW) / canvas.width;
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfW, pdfH] });
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
        pdf.save(fname);
      }
    } catch (err) {
      flash("PDF generation failed", "e");
    }
    setDownloadingPdf(false);
  };

  const email = async () => {
    if (!rx?.id) return; setEmailSending(true); await save();
    const r = await api(`/api/prescriptions/${rx.id}/email`, "POST");
    flash(r.success ? "Emailed to patient!" : (r.message || "Failed"), r.success ? "s" : "e");
    setEmailSending(false);
  };

  const handleVoiceTranscription = useCallback((result: any) => {
    const aiResult = result.aiResult;
    if (!aiResult) return;

    // Track which sections need expanding
    const expand: Record<string, boolean> = {};

    if (aiResult.vitals && Object.keys(aiResult.vitals).filter(k => aiResult.vitals[k]).length > 0) {
      setVitals(prev => ({ ...prev, ...aiResult.vitals }));
      expand.vitals = true;
    }
    if (aiResult.chiefComplaint) { setComplaint(aiResult.chiefComplaint); expand.complaint = true; }
    if (aiResult.diagnosis) { setDiagnosis(aiResult.diagnosis); expand.diag = true; }
    if (aiResult.icdCodes?.length > 0) setIcdCodes(aiResult.icdCodes);
    if (aiResult.medications?.length > 0) {
      // Normalise field names from AI output → Med interface
      const meds = aiResult.medications.map((m: any) => ({
        name: m.name || m.medicine || "",
        dosage: m.dosage || m.dose || m.strength || "",
        frequency: m.frequency || m.freq || "Once daily (OD)",
        duration: m.duration || "",
        route: m.route || "Oral",
        instructions: m.instructions || m.notes || "",
      }));
      setMeds(meds);
      expand.meds = true;
    }
    if (aiResult.labTests?.length > 0) {
      const tests = aiResult.labTests.map((t: any) => ({
        name: t.name || t.test || "",
        urgency: t.urgency || t.priority || "Routine",
        notes: t.notes || t.instructions || "",
      }));
      setTests(tests);
      expand.tests = true;
    }
    if (aiResult.advice) { setAdvice(aiResult.advice); expand.advice = true; }
    if (aiResult.followUpDate) {
      // Ensure date is in YYYY-MM-DD format
      try {
        const d = new Date(aiResult.followUpDate);
        if (!isNaN(d.getTime())) setFuDate(d.toISOString().split("T")[0]);
      } catch { setFuDate(aiResult.followUpDate); }
      expand.fu = true;
    }
    if (aiResult.followUpNotes) { setFuNotes(aiResult.followUpNotes); expand.fu = true; }

    // Expand all sections that received data
    if (Object.keys(expand).length > 0) {
      setSections(prev => ({ ...prev, ...expand }));
    }

    setShowVoiceRecorder(false);
    const secs = aiResult.metadata?.processingTime ? (aiResult.metadata.processingTime / 1000).toFixed(1) : "?";
    flash(`Voice prescription filled in ${secs}s! Check all sections.`, "s");

    // Auto-save after state updates settle
    setTimeout(() => {
      if (rx?.id) {
        api(`/api/prescriptions/${rx.id}`, "PUT", payload()).catch(() => { });
      }
    }, 800);
  }, [rx?.id]);

  const flash = (t: string, c: string) => { setMsg({ t, c }); setTimeout(() => setMsg({ t: "", c: "" }), 4000); };
  const accent = getDeptAccent(doctor?.department?.name);

  if (loading) return (
    <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <Loader2 size={24} style={{ animation: "spin .7s linear infinite", color: "#10b981" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ marginLeft: 10, color: "#64748b" }}>Loading prescription...</span>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes voiceWaveAnim {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @media print {
          .noprint { display: none !important; }
          .printonly { display: block !important; }
          body { background: #fff !important; margin: 0; padding: 0; }
          @page { margin: 0; }
        }
        .printonly { display: none; }
        input, select, textarea, button { font-family: 'Inter', sans-serif; }
        .doc-center { overflow: visible !important; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
      <div style={{ minHeight: 400, fontFamily: "'Inter', sans-serif" }}>
        {selectedPatientId ? (
          <div style={{ padding: 24 }}>
            <PatientProfilePanel
              patientId={selectedPatientId}
              onBack={() => setSelectedPatientId(null)}
            />
          </div>
        ) : (
          <>
            {/* Topbar */}
            <div className="noprint" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "fixed", top: searchParams.get("isModal") === "1" ? 0 : 64, left: searchParams.get("isModal") === "1" ? 0 : 220, right: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {searchParams.get("isModal") !== "1" && (
                  <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}><ArrowLeft size={13} /> Back</button>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${accent},#0ea5e9)`, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={14} color="#fff" /></div>
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Prescription {rx?.prescriptionNo || ""}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{patient?.name} · {patient?.patientId}</div></div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {msg.t && <div style={{ padding: "5px 12px", borderRadius: 7, fontSize: 10, fontWeight: 600, animation: "fadeIn .3s", background: msg.c === "s" ? "#f0fdf4" : "#fff5f5", color: msg.c === "s" ? "#16a34a" : "#ef4444", border: `1px solid ${msg.c === "s" ? "#bbf7d0" : "#fecaca"}` }}>{msg.t}</div>}
                {finalized && locked && (
                  <button onClick={() => setEditMode(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px solid #B3E0E0", background: "#E6F4F4", color: "#0A6B70", fontSize: 10, fontWeight: 700, cursor: "pointer" }}><Pencil size={12} /> Edit</button>
                )}
                {finalized && editMode && (
                  <button onClick={() => setEditMode(false)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer" }}><Eye size={12} /> View</button>
                )}
                {!locked && <>
                  <button onClick={() => aiSmartAssist()} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "none", background: aiLoading ? "#e9d5ff" : "linear-gradient(135deg,#7c3aed,#5b21b6)", color: aiLoading ? "#7c3aed" : "#fff", fontSize: 10, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer" }}>{aiLoading ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <Sparkles size={12} />} AI Assist</button>
                  <button onClick={() => setShowVoiceRecorder(!showVoiceRecorder)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "none", background: showVoiceRecorder ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}><Stethoscope size={12} /> {showVoiceRecorder ? "Close Voice" : "Voice Rx"}</button>
                  <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 2px" }} />
                </>}
                <button onClick={downloadPdf} disabled={downloadingPdf} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: downloadingPdf ? "#f0fdf4" : "#fff", color: downloadingPdf ? "#16a34a" : "#64748b", fontSize: 10, fontWeight: 600, cursor: downloadingPdf ? "not-allowed" : "pointer" }}>{downloadingPdf ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <Download size={12} />} {downloadingPdf ? "Generating..." : "Download PDF"}</button>
                <button onClick={email} disabled={emailSending || !patient?.email} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: patient?.email ? "#0E898F" : "#cbd5e1", fontSize: 10, fontWeight: 600, cursor: patient?.email ? "pointer" : "not-allowed" }}>{emailSending ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <Mail size={12} />} Email</button>
                <button onClick={save} disabled={saving || locked} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 8, border: "none", background: locked ? "#e2e8f0" : "linear-gradient(135deg,#0E898F,#0A6B70)", color: locked ? "#94a3b8" : "#fff", fontSize: 10, fontWeight: 700, cursor: locked ? "default" : "pointer" }}>{saving ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={12} />} Save</button>
                <button onClick={complete} disabled={completing || !canComplete} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 8, border: "none", background: canComplete ? "linear-gradient(135deg,#10b981,#059669)" : "#dcfce7", color: canComplete ? "#fff" : "#16a34a", fontSize: 10, fontWeight: 700, cursor: canComplete ? "pointer" : "default" }}>{completing ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <CheckCircle2 size={12} />} {canComplete ? (rx?.status === "DRAFT" ? "Complete" : "Re-Complete") : rx?.status}</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", maxWidth: 1400, margin: "0 auto", paddingTop: 56, height: searchParams.get("isModal") === "1" ? "100vh" : "calc(100vh - 120px)", overflow: "hidden" }}>
              {/* Main */}
              <div style={{ padding: "16px 20px", overflowY: "auto", height: "100%" }}>
                {/* Patient Banner */}
                <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg,${accent},#0ea5e9)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 17, cursor: "pointer" }} onClick={() => setSelectedPatientId(patient?.id)}>
                        {(patient?.name || "?")[0].toUpperCase()}
                      </div>
                      <div style={{ cursor: "pointer" }} onClick={() => setSelectedPatientId(patient?.id)}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{patient?.name}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 2, fontSize: 10, color: "#64748b", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "1px 6px", borderRadius: 4 }}>{patient?.patientId}</span>
                          {patient?.gender && <span>{patient.gender}</span>}
                          {patient?.dateOfBirth && <span>{Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000)} yrs</span>}
                          {patient?.phone && <span>{patient.phone}</span>}
                          {patient?.bloodGroup && <span style={{ color: "#ef4444", fontWeight: 600 }}>{patient.bloodGroup}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {[["Date", appt?.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"], ["Time", appt?.timeSlot || "—"], ["Token", appt?.tokenNumber ? `#${appt.tokenNumber}` : "—"], ["Type", appt?.type || "OPD"], ["Doctor", `Dr. ${doctor?.name?.split(" ").pop() || ""}`], ["Dept", doctor?.department?.name || "General"]].map(([k, v]) => (
                      <div key={k} style={{ flex: 1, minWidth: 80, background: "#f8fafc", borderRadius: 7, padding: "6px 8px", border: "1px solid #f1f5f9", textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>{k}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#334155", marginTop: 1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Auto-Gen Loading Banner */}
                {aiLoading && meds.length === 0 && !diagnosis && (
                  <div style={{ background: "linear-gradient(135deg,#f0f9ff,#ede9fe)", borderRadius: 10, padding: "10px 16px", marginBottom: 14, border: "1px solid #bae6fd", display: "flex", alignItems: "center", gap: 10 }}>
                    <Loader2 size={14} style={{ animation: "spin .7s linear infinite", color: "#7c3aed", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#4c1d95" }}>AI is analyzing the chief complaint...</div>
                      <div style={{ fontSize: 10, color: "#6d28d9" }}>Generating diagnosis, medications and tests based on patient data</div>
                    </div>
                  </div>
                )}

                {/* Patient History — Inline expandable cards */}
                {histLoaded && hist.length > 0 && (
                  <SectionCard title={`Patient History (${hist.length})`} icon={<History size={14} />} accent="#0369a1" expanded={sections.hist} onToggle={() => tog("hist")}>
                    {hist.map((h, i) => {
                      let hMeds: any[] = [], hTests: any[] = [], hIcds: string[] = [];
                      try { hMeds = h.medications ? JSON.parse(h.medications) : []; } catch { }
                      try { hTests = h.labTests ? JSON.parse(h.labTests) : []; } catch { }
                      try { hIcds = h.icdCodes ? JSON.parse(h.icdCodes) : []; } catch { }
                      return (
                        <div key={i}
                          style={{ background: "#f0f9ff", borderRadius: 10, padding: 12, marginBottom: 8, border: "1px solid #bae6fd" }}>
                          {/* Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", fontFamily: "monospace" }}>{h.prescriptionNo}</span>
                              <span style={{ fontSize: 10, color: "#94a3b8" }}>{new Date(h.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                              {h.doctor && <span style={{ fontSize: 10, color: "#64748b" }}>Dr. {h.doctor.name}{h.doctor.specialization ? ` · ${h.doctor.specialization}` : ""}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {!locked && <button onClick={e => { e.stopPropagation(); applyHistoryItem(h); }} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "none", background: "#0ea5e9", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} /> Same Consult</button>}
                            </div>
                          </div>
                          {/* Summary always visible */}
                          <div style={{ marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {h.chiefComplaint && <span style={{ fontSize: 10, color: "#334155" }}><strong>CC:</strong> {h.chiefComplaint}</span>}
                            {h.diagnosis && <span style={{ fontSize: 10, fontWeight: 600, color: "#0369a1" }}>{h.diagnosis}</span>}
                          </div>
                          {/* Expanded details */}
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #bae6fd" }}>
                              {h.diagnosis && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Diagnosis</div>
                                  <div style={{ fontSize: 11, color: "#1e293b", fontWeight: 600 }}>{h.diagnosis}</div>
                                  {hIcds.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>{hIcds.map((c: string, ci: number) => <span key={ci} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 100, background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0", fontWeight: 600 }}>{c}</span>)}</div>}
                                </div>
                              )}
                              {hMeds.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Medications ({hMeds.length})</div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    {hMeds.map((m: any, mi: number) => (
                                      <div key={mi} style={{ background: "#fffbeb", borderRadius: 6, padding: "5px 8px", border: "1px solid #fde68a", fontSize: 10 }}>
                                        <span style={{ fontWeight: 700, color: "#92400e" }}>{m.name}</span>
                                        {m.dosage && <span style={{ color: "#64748b" }}> {m.dosage}</span>}
                                        {m.frequency && <span style={{ color: "#64748b" }}> · {m.frequency}</span>}
                                        {m.duration && <span style={{ color: "#64748b" }}> · {m.duration}</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {hTests.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Lab Tests</div>
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {hTests.map((t: any, ti: number) => <span key={ti} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "#faf5ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontWeight: 600 }}>{t.name}</span>)}
                                  </div>
                                </div>
                              )}
                              {h.advice && (
                                <div style={{ marginBottom: 6 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Advice</div>
                                  <div style={{ fontSize: 10, color: "#334155", whiteSpace: "pre-wrap" }}>{h.advice}</div>
                                </div>
                              )}
                              {h.followUpDate && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}><strong>Follow-up:</strong> {new Date(h.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>}
                            </div>
                        </div>
                      );
                    })}
                  </SectionCard>
                )}

                {/* Vitals */}
                <SectionCard title="Vitals" icon={<Activity size={14} />} accent="#ef4444" expanded={sections.vitals} onToggle={() => tog("vitals")}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                    {([["bp", "Blood Pressure", "120/80"], ["pulse", "Pulse", "72 bpm"], ["temp", "Temperature", "98.6°F"], ["weight", "Weight", "70 kg"], ["height", "Height", "170 cm"], ["spo2", "SpO2", "98%"], ["rr", "Resp Rate", "16/min"]] as const).map(([k, l, ph]) => (
                      <div key={k}><label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 3, display: "block" }}>{l}</label>
                        <input value={vitals[k]} onChange={e => setVitals(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} disabled={locked}
                          style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 11, color: "#334155", outline: "none", background: locked ? "#f8fafc" : "#fff" }} /></div>
                    ))}
                  </div>
                </SectionCard>

                {/* Chief Complaint */}
                <SectionCard 
                  title="Chief Complaint" 
                  icon={<Stethoscope size={14} />} 
                  accent="#0E898F" 
                  expanded={sections.complaint} 
                  onToggle={() => tog("complaint")}
                  extra={!locked && (
                    <button 
                      onClick={() => startVoiceTyping("complaint")}
                      disabled={activeVoiceTarget !== null && activeVoiceTarget !== "complaint"}
                      style={{ 
                        border: "none", 
                        background: activeVoiceTarget === "complaint" ? "#fecaca" : "#f1f5f9", 
                        color: activeVoiceTarget === "complaint" ? "#ef4444" : "#64748b", 
                        padding: "4px 10px", 
                        borderRadius: 6, 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        transition: "all 0.2s"
                      }}
                    >
                      {activeVoiceTarget === "complaint" ? <VoiceWave /> : <Mic size={12} />}
                      {activeVoiceTarget === "complaint" ? "Stop" : "Voice Type"}
                    </button>
                  )}
                >
                  <textarea value={complaint}
                    onChange={e => {
                      setComplaint(e.target.value);
                      const q = e.target.value.toLowerCase().trim();
                      if (q.length >= 2) {
                        const histCC = hist.map((h: any) => h.chiefComplaint).filter((c: string) => c?.toLowerCase().includes(q));
                        const common = COMMON_COMPLAINTS.filter(c => c.toLowerCase().includes(q));
                        setComplaintSugg([...new Set([...histCC.slice(0, 2), ...common])].slice(0, 6));
                      } else setComplaintSugg([]);
                    }}
                    placeholder="Patient's chief complaint, symptoms, duration..." rows={3} disabled={locked}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#334155", outline: "none", resize: "vertical", background: locked ? "#f8fafc" : "#fff" }} />
                  {complaintSugg.length > 0 && !locked && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                      {complaintSugg.map((s, i) => (
                        <button key={i} onClick={() => { setComplaint(s); setComplaintSugg([]); }}
                          style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, border: "1px solid #B3E0E0", background: "#E6F4F4", color: "#0A6B70", cursor: "pointer", fontWeight: 600 }}>{s}</button>
                      ))}
                    </div>
                  )}
                  {!locked && !complaint && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      <span style={{ fontSize: 9, color: "#94a3b8", alignSelf: "center" }}>Common:</span>
                      {COMMON_COMPLAINTS.slice(0, 8).map((s, i) => (
                        <button key={i} onClick={() => setComplaint(s)}
                          style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer" }}>{s}</button>
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* Voice Prescription Recorder — renders as fixed modal */}
                {showVoiceRecorder && !locked && rx?.id && (
                  <VoicePrescriptionRecorder
                    prescriptionId={rx.id}
                    patientName={patient?.name || "Patient"}
                    doctorName={doctor?.name || "Doctor"}
                    onTranscriptionComplete={handleVoiceTranscription}
                    onClose={() => setShowVoiceRecorder(false)}
                    accent={accent}
                  />
                )}

                {/* Diagnosis */}
                <SectionCard 
                  title="Diagnosis" 
                  icon={<FileText size={14} />} 
                  accent="#10b981" 
                  expanded={sections.diag} 
                  onToggle={() => tog("diag")}
                  extra={!locked && (
                    <button 
                      onClick={() => startVoiceTyping("diagnosis")}
                      disabled={activeVoiceTarget !== null && activeVoiceTarget !== "diagnosis"}
                      style={{ 
                        border: "none", 
                        background: activeVoiceTarget === "diagnosis" ? "#fecaca" : "#ecfdf5", 
                        color: activeVoiceTarget === "diagnosis" ? "#ef4444" : "#059669", 
                        padding: "4px 10px", 
                        borderRadius: 6, 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        transition: "all 0.2s",
                        boxShadow: "0 1px 2px rgba(5,150,105,0.1)"
                      }}
                    >
                      {activeVoiceTarget === "diagnosis" ? <VoiceWave /> : <Sparkles size={12} />}
                      {activeVoiceTarget === "diagnosis" ? "Stop" : "Smart Voice"}
                    </button>
                  )}
                >
                  <textarea value={diagnosis}
                    onChange={e => {
                      setDiagnosis(e.target.value);
                      const q = e.target.value.toLowerCase().trim();
                      if (q.length >= 2) {
                        const aiDx = (aiData?.diagnosis || []).filter((d: string) => d.toLowerCase().includes(q));
                        const common = COMMON_DIAGNOSES.filter(d => d.toLowerCase().includes(q));
                        setDiagSugg([...new Set([...aiDx, ...common])].slice(0, 6));
                      } else if (!q) setDiagSugg(aiData?.diagnosis || []);
                      else setDiagSugg([]);
                    }}
                    placeholder="Primary diagnosis..." rows={2} disabled={locked}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#334155", outline: "none", resize: "vertical", marginBottom: 6, background: locked ? "#f8fafc" : "#fff" }} />
                  {diagSugg.length > 0 && !locked && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                      <span style={{ fontSize: 9, color: "#94a3b8", alignSelf: "center" }}>Suggestions:</span>
                      {diagSugg.map((s, i) => (
                        <button key={i} onClick={() => { setDiagnosis(s); setDiagSugg([]); }}
                          style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a", cursor: "pointer", fontWeight: 600 }}>{s}</button>
                      ))}
                    </div>
                  )}
                  {!diagnosis && !locked && aiData?.differentialDiagnosis?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 9, color: "#94a3b8" }}>Differential: </span>
                      {aiData.differentialDiagnosis.slice(0, 4).map((d: string, i: number) => (
                        <button key={i} onClick={() => setDiagnosis(d)}
                          style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, border: "1px solid #ddd6fe", background: "#faf5ff", color: "#7c3aed", cursor: "pointer", marginRight: 4, fontWeight: 600 }}>{d}</button>
                      ))}
                    </div>
                  )}
                  {icdCodes.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {icdCodes.map((c, i) => <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>{c}{!locked && <X size={9} style={{ cursor: "pointer" }} onClick={() => setIcdCodes(p => p.filter((_, j) => j !== i))} />}</span>)}
                  </div>}
                </SectionCard>

                {/* Medications */}
                <datalist id="rx-med-names">
                  {[...COMMON_MEDS, ...(aiData?.medications?.map((m: any) => m.name) || [])].filter((v, i, a) => a.indexOf(v) === i).map((m: string, i: number) => <option key={i} value={m} />)}
                </datalist>
                <SectionCard title={`Medications (${meds.length})`} icon={<Pill size={14} />} accent="#f59e0b" expanded={sections.meds} onToggle={() => tog("meds")}>
                  {meds.length > 0 && <div style={{ overflowX: "auto", marginBottom: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr style={{ background: "#fffbeb" }}>
                        {["#", "Medication", "Dosage", "Frequency", "Duration", "Route", "Instructions", ""].map(h => <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 600, color: "#92400e", padding: "7px 6px", borderBottom: "2px solid #fde68a", whiteSpace: "nowrap" }}>{h}</th>)}
                      </tr></thead>
                      <tbody>{meds.map((m, i) => (
                        <tr key={i}>
                          <td style={{ padding: "5px 6px", fontSize: 10, color: "#94a3b8", borderBottom: "1px solid #f5f5f4" }}>{i + 1}</td>
                          <td style={{ padding: "5px 3px", borderBottom: "1px solid #f5f5f4" }}><input value={m.name} list="rx-med-names" onChange={e => { const n = [...meds]; n[i] = { ...n[i], name: e.target.value }; setMeds(n); }} placeholder="Drug" disabled={locked} style={{ width: "100%", padding: "5px 7px", borderRadius: 5, border: "1px solid #e2e8f0", fontSize: 10, outline: "none", minWidth: 100 }} /></td>
                          <td style={{ padding: "5px 3px", borderBottom: "1px solid #f5f5f4" }}><input value={m.dosage} onChange={e => { const n = [...meds]; n[i] = { ...n[i], dosage: e.target.value }; setMeds(n); }} placeholder="500mg" disabled={locked} style={{ width: "100%", padding: "5px 7px", borderRadius: 5, border: "1px solid #e2e8f0", fontSize: 10, outline: "none", minWidth: 60 }} /></td>
                          <td style={{ padding: "5px 3px", borderBottom: "1px solid #f5f5f4" }}><select value={m.frequency} onChange={e => { const n = [...meds]; n[i] = { ...n[i], frequency: e.target.value }; setMeds(n); }} disabled={locked} style={{ padding: "5px 7px", borderRadius: 5, border: "1px solid #e2e8f0", fontSize: 10, outline: "none", minWidth: 90 }}><option value="">Select</option>{FREQS.map(f => <option key={f} value={f}>{f}</option>)}</select></td>
                          <td style={{ padding: "5px 3px", borderBottom: "1px solid #f5f5f4" }}><input value={m.duration} onChange={e => { const n = [...meds]; n[i] = { ...n[i], duration: e.target.value }; setMeds(n); }} placeholder="5 days" disabled={locked} style={{ width: "100%", padding: "5px 7px", borderRadius: 5, border: "1px solid #e2e8f0", fontSize: 10, outline: "none", minWidth: 60 }} /></td>
                          <td style={{ padding: "5px 3px", borderBottom: "1px solid #f5f5f4" }}><select value={m.route} onChange={e => { const n = [...meds]; n[i] = { ...n[i], route: e.target.value }; setMeds(n); }} disabled={locked} style={{ padding: "5px 7px", borderRadius: 5, border: "1px solid #e2e8f0", fontSize: 10, outline: "none" }}>{ROUTES.map(r => <option key={r} value={r}>{r}</option>)}</select></td>
                          <td style={{ padding: "5px 3px", borderBottom: "1px solid #f5f5f4" }}><input value={m.instructions} onChange={e => { const n = [...meds]; n[i] = { ...n[i], instructions: e.target.value }; setMeds(n); }} placeholder="After food" disabled={locked} style={{ width: "100%", padding: "5px 7px", borderRadius: 5, border: "1px solid #e2e8f0", fontSize: 10, outline: "none", minWidth: 80 }} /></td>
                          <td style={{ padding: "5px 3px", borderBottom: "1px solid #f5f5f4" }}>{!locked && <button onClick={() => setMeds(p => p.filter((_, j) => j !== i))} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: 2 }}><Trash2 size={12} /></button>}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>}
                  {!locked && <button onClick={() => setMeds(p => [...p, { name: "", dosage: "", frequency: "", duration: "", route: "Oral", instructions: "" }])}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 7, border: "1.5px dashed #fde68a", background: "#fffbeb", color: "#92400e", fontSize: 10, fontWeight: 600, cursor: "pointer" }}><Plus size={12} /> Add Medication</button>}
                </SectionCard>

                {/* Lab Tests + Sub-Dept Referrals — side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
                  <SectionCard title={`Lab Tests (${tests.length})`} icon={<FlaskConical size={14} />} accent="#8b5cf6" expanded={sections.tests} onToggle={() => tog("tests")}>
                    {tests.map((t, i) => (
                      <div key={i} style={{ background: "#faf5ff", borderRadius: 9, padding: 10, marginBottom: 6, border: "1px solid #ddd6fe" }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <input value={t.name} onChange={e => { const n = [...tests]; n[i] = { ...n[i], name: e.target.value }; setTests(n); }} placeholder="Test name" disabled={locked} style={{ flex: 1, padding: "7px 9px", borderRadius: 7, border: "1px solid #ddd6fe", fontSize: 11, outline: "none", background: "#fff" }} />
                          <select value={t.urgency} onChange={e => { const n = [...tests]; n[i] = { ...n[i], urgency: e.target.value }; setTests(n); }} disabled={locked} style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid #ddd6fe", fontSize: 10, outline: "none", background: "#fff" }}><option>Routine</option><option>Urgent</option><option>STAT</option></select>
                          {!locked && <button onClick={() => setTests(p => p.filter((_, j) => j !== i))} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={12} /></button>}
                        </div>
                        <input value={t.notes} onChange={e => { const n = [...tests]; n[i] = { ...n[i], notes: e.target.value }; setTests(n); }} placeholder="Notes" disabled={locked} style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid #ddd6fe", fontSize: 11, outline: "none", background: "#fff" }} />
                      </div>
                    ))}
                    {!locked && <button onClick={() => setTests(p => [...p, { name: "", urgency: "Routine", notes: "" }])}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 7, border: "1.5px dashed #ddd6fe", background: "#faf5ff", color: "#7c3aed", fontSize: 10, fontWeight: 600, cursor: "pointer" }}><Plus size={12} /> Add Test</button>}
                  </SectionCard>

                  {/* Referrals */}
                  <SectionCard title={`Sub-Dept Referrals (${refs.length})`} icon={<Building2 size={14} />} accent="#0ea5e9" expanded={sections.refs} onToggle={() => tog("refs")}>
                    <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>Refer patient through departments. Ends at billing automatically.</p>
                    {refs.map((r, i) => (
                      <div key={i} style={{ background: "#f0f9ff", borderRadius: 9, padding: 10, marginBottom: 6, border: "1px solid #bae6fd" }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <SearchableSelect
                            options={subDepts.map((sd: any) => ({ id: sd.id, label: sd.name }))}
                            value={r.subDeptId}
                            placeholder="— Select Sub-Dept —"
                            disabled={locked}
                            onChange={val => {
                              const sd = subDepts.find((s: any) => s.id === val);
                              const n = [...refs];
                              n[i] = { ...n[i], subDeptId: val, subDeptName: sd?.name || "" };
                              setRefs(n);
                            }}
                          />
                          <select value={r.priority} onChange={e => { const n = [...refs]; n[i] = { ...n[i], priority: e.target.value }; setRefs(n); }} disabled={locked}
                            style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid #bae6fd", fontSize: 10, outline: "none", background: "#fff" }}><option>Normal</option><option>Urgent</option><option>STAT</option></select>
                          {!locked && <button onClick={() => setRefs(p => p.filter((_, j) => j !== i))} style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={12} /></button>}
                        </div>
                        <input value={r.reason} onChange={e => { const n = [...refs]; n[i] = { ...n[i], reason: e.target.value }; setRefs(n); }} placeholder="Reason for referral" disabled={locked}
                          style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid #bae6fd", fontSize: 10, outline: "none", background: "#fff" }} />
                      </div>
                    ))}
                    {!locked && <button onClick={() => setRefs(p => [...p, { subDeptId: "", subDeptName: "", reason: "", priority: "Normal", notes: "" }])}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 7, border: "1.5px dashed #7dd3fc", background: "#f0f9ff", color: "#0369a1", fontSize: 10, fontWeight: 600, cursor: "pointer" }}><Plus size={12} /> Add Referral</button>}
                  </SectionCard>
                </div>

                {/* Advice & Instructions + Follow-up — side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
                  <SectionCard 
                    title="Advice & Instructions" 
                    icon={<FileText size={14} />} 
                    accent="#10b981" 
                    expanded={sections.advice} 
                    onToggle={() => tog("advice")}
                    extra={!locked && (
                      <button 
                        onClick={() => startVoiceTyping("advice")}
                        disabled={activeVoiceTarget !== null && activeVoiceTarget !== "advice"}
                        style={{ 
                          border: "none", 
                          background: activeVoiceTarget === "advice" ? "#fecaca" : "#f1f5f9", 
                          color: activeVoiceTarget === "advice" ? "#ef4444" : "#64748b", 
                          padding: "4px 10px", 
                          borderRadius: 6, 
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 10,
                          fontWeight: 600,
                          transition: "all 0.2s"
                        }}
                      >
                        {activeVoiceTarget === "advice" ? <VoiceWave /> : <Mic size={12} />}
                        {activeVoiceTarget === "advice" ? "Stop" : "Voice Type"}
                      </button>
                    )}
                  >
                    <textarea value={advice} onChange={e => setAdvice(e.target.value)} placeholder="Diet, lifestyle, precautions..." rows={3} disabled={locked}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 11, color: "#334155", outline: "none", resize: "vertical", background: locked ? "#f8fafc" : "#fff" }} />
                  </SectionCard>

                  {/* Follow-up */}
                  <SectionCard title="Follow-up" icon={<History size={14} />} accent="#f59e0b" expanded={sections.fu} onToggle={() => tog("fu")}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1 }}><label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 3, display: "block" }}>Follow-up Date</label>
                        <input type="date" value={fuDate} onChange={e => setFuDate(e.target.value)} disabled={locked} style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 11, outline: "none" }} /></div>
                      <div style={{ flex: 2 }}><label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 3, display: "block" }}>Notes</label>
                        <input value={fuNotes} onChange={e => setFuNotes(e.target.value)} placeholder="Follow-up instructions" disabled={locked} style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 11, outline: "none" }} /></div>
                    </div>
                  </SectionCard>
                </div>

                {/* Treatment Plan Assignment */}
                {!locked && (
                  <div style={{ background: "#fff", borderRadius: 14, marginBottom: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.03)" }}>
                    <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: selectedPlanId ? "1px solid #e2e8f0" : "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#0E898F18", display: "flex", alignItems: "center", justifyContent: "center", color: "#0E898F" }}><Activity size={14} /></div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", flex: 1 }}>Assign Treatment Plan</span>
                      {selectedPlanId && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: "#E6F4F4", color: "#0A6B70", border: "1px solid #B3E0E0" }}>Plan Selected — will be assigned on Complete</span>}
                    </div>
                    <div style={{ padding: "14px 18px" }}>
                      {!plansLoaded ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 11 }}><Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> Loading plans...</div>
                      ) : myPlans.length === 0 ? (
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>No active treatment plans found. Create plans in your dashboard first.</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <select
                            value={selectedPlanId}
                            onChange={e => setSelectedPlanId(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #B3E0E0", fontSize: 12, color: "#1e293b", outline: "none", background: "#fff", cursor: "pointer" }}
                          >
                            <option value="">— Select a treatment plan to assign —</option>
                            {myPlans.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.planName} ({p.totalSessions} sessions · ₹{(p.totalCost || 0).toLocaleString()}){p.patient ? " — Already assigned" : ""}</option>
                            ))}
                          </select>
                          {selectedPlanId && (() => {
                            const plan = myPlans.find((p: any) => p.id === selectedPlanId);
                            if (!plan) return null;
                            return (
                              <div style={{ background: "#E6F4F4", borderRadius: 10, padding: "12px 14px", border: "1px solid #B3E0E0", display: "flex", flexDirection: "column", gap: 6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0A6B70" }}>{plan.planName}</span>
                                  <button onClick={() => setSelectedPlanId("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}><X size={14} /></button>
                                </div>
                                <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#475569", flexWrap: "wrap" }}>
                                  <span><strong>Sessions:</strong> {plan.totalSessions}</span>
                                  <span><strong>Total Cost:</strong> ₹{(plan.totalCost || 0).toLocaleString()}</span>
                                  {plan.startDate && <span><strong>Start:</strong> {new Date(plan.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                                  {plan.endDate && <span><strong>End:</strong> {new Date(plan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                                </div>
                                {plan.notes && <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{plan.notes}</div>}
                                <div style={{ fontSize: 10, color: "#0E898F", fontWeight: 600, marginTop: 2 }}>✓ This plan will be assigned to {patient?.name} and ₹{(plan.totalCost || 0).toLocaleString()} added to their bill on completion.</div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Consultation Fee + Doctor's Private Notes — side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
                  <SectionCard title="Consultation Fee" icon={<FileText size={14} />} accent="#059669" expanded={sections.fee} onToggle={() => tog("fee")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "#059669" }}>₹</span>
                      <input type="number" value={fee} onChange={e => setFee(Number(e.target.value))} disabled={locked}
                        style={{ width: 120, padding: "8px 10px", borderRadius: 8, border: "1.5px solid #bbf7d0", fontSize: 15, fontWeight: 700, color: "#059669", outline: "none", background: locked ? "#f0fdf4" : "#fff" }} />
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>Doctor can modify the fee</span>
                    </div>
                  </SectionCard>

                  {/* Doctor Notes */}
                  <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", marginBottom: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.03)" }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", marginBottom: 6, display: "block" }}>Doctor&apos;s Private Notes</label>
                    <textarea value={docNotes} onChange={e => setDocNotes(e.target.value)} placeholder="Internal notes (not shown on prescription)..." rows={2} disabled={locked}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 11, color: "#334155", outline: "none", resize: "vertical", background: locked ? "#f8fafc" : "#fff" }} />
                  </div>
                </div>
              </div>

              {/* Right Panel — always visible */}
              <div className="noprint" style={{ background: "#fff", borderLeft: "1px solid #e2e8f0", overflowY: "auto", height: "100%", display: "flex", flexDirection: "column" }}>
                {/* Tab bar */}
                <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
                  <button onClick={() => { setShowAi(true); setShowHist(false); }}
                    style={{ flex: 1, padding: "10px 6px", fontSize: 10, fontWeight: 700, border: "none", borderBottom: showAi ? "2px solid #7c3aed" : "2px solid transparent", background: showAi ? "#f5f3ff" : "#fff", color: showAi ? "#7c3aed" : "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Sparkles size={12} /> AI Suggestions
                  </button>
                  <button onClick={() => { setShowHist(true); setShowAi(false); void ensureHistoryLoaded(); }}
                    style={{ flex: 1, padding: "10px 6px", fontSize: 10, fontWeight: 700, border: "none", borderBottom: showHist ? "2px solid #0369a1" : "2px solid transparent", background: showHist ? "#f0f9ff" : "#fff", color: showHist ? "#0369a1" : "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <History size={12} /> History{histLoaded && hist.length > 0 ? ` (${hist.length})` : ""}
                  </button>
                </div>
                <div style={{ padding: "14px 14px", overflowY: "auto", flex: 1 }}>

                  {/* History Tab */}
                  {showHist && (
                    !histLoaded ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 11, padding: "16px 0" }}><Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> Loading history...</div>
                    ) : hist.length === 0 ? (
                      <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: "32px 0" }}>No previous prescriptions found</p>
                    ) : hist.map((h, i) => {
                      let pMeds: any[] = [];
                      try { pMeds = h.medications ? JSON.parse(h.medications) : []; } catch { }
                      return (
                        <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 8, border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "flex-start" }}>
                            <div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", fontFamily: "monospace" }}>{h.prescriptionNo}</span>
                              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6 }}>{new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                            </div>
                            {!locked && <button onClick={() => applyHistoryItem(h)} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 5, border: "none", background: "#0ea5e9", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}><Sparkles size={9} /> Same</button>}
                          </div>
                          {h.chiefComplaint && <p style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}><strong>CC:</strong> {h.chiefComplaint.length > 60 ? h.chiefComplaint.slice(0, 60) + "…" : h.chiefComplaint}</p>}
                          {h.diagnosis && <p style={{ fontSize: 10, color: "#1e293b", fontWeight: 600, marginBottom: 2 }}>{h.diagnosis.length > 60 ? h.diagnosis.slice(0, 60) + "…" : h.diagnosis}</p>}
                          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            {h.doctor && <span style={{ fontSize: 9, color: "#94a3b8" }}>Dr. {h.doctor.name}</span>}
                            {pMeds.length > 0 && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}>{pMeds.length} med{pMeds.length > 1 ? "s" : ""}</span>}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* AI Tab */}
                  {showAi && <>
                    {aiLoading ? <div style={{ textAlign: "center", padding: "32px 0", color: "#7c3aed" }}><Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} /><p style={{ fontSize: 11, marginTop: 8 }}>Analyzing symptoms...</p></div> :
                      !aiData ? <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>Click &quot;AI Assist&quot; after entering chief complaint</p> : <>
                        {/* Red Flags */}
                        {aiData.redFlags?.length > 0 && <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 9, padding: 10, marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>⚠️ Red Flags</div>
                          {aiData.redFlags.map((f: string, i: number) => <p key={i} style={{ fontSize: 10, color: "#991b1b", marginBottom: 2 }}>• {f}</p>)}
                        </div>}

                        {/* Diagnosis suggestions */}
                        {aiData.diagnosis?.length > 0 && <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Possible Diagnoses</div>
                          {aiData.diagnosis.map((d: string, i: number) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, background: "#f0fdf4", marginBottom: 3, border: "1px solid #bbf7d0" }}>
                              <span style={{ fontSize: 10, color: "#1e293b" }}>{d}</span>
                              {!locked && <button onClick={() => setDiagnosis(p => p ? `${p}, ${d}` : d)} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontWeight: 700 }}>+ Add</button>}
                            </div>
                          ))}
                        </div>}

                        {/* ICD Codes */}
                        {aiData.icdCodes?.length > 0 && <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>ICD-10 Codes</div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {aiData.icdCodes.map((c: string, i: number) => (
                              <button key={i} onClick={() => !locked && setIcdCodes(p => p.includes(c) ? p : [...p, c])}
                                style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, border: "1px solid #bbf7d0", background: icdCodes.includes(c) ? "#dcfce7" : "#fff", color: "#16a34a", fontWeight: 600, cursor: locked ? "default" : "pointer" }}>{c}</button>
                            ))}
                          </div>
                        </div>}

                        {/* Medication suggestions */}
                        {aiData.medications?.length > 0 && <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Suggested Medications</div>
                          {aiData.medications.map((m: any, i: number) => (
                            <div key={i} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 7, padding: "6px 8px", marginBottom: 4 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: "#1e293b" }}>{m.name} <span style={{ color: "#94a3b8", fontWeight: 400 }}>{m.dosage}</span></span>
                                {!locked && <button onClick={() => setMeds(p => [...p, m])} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer", fontWeight: 700 }}>+ Add</button>}
                              </div>
                              <div style={{ fontSize: 10, color: "#64748b" }}>{m.frequency} · {m.duration} · {m.route}</div>
                            </div>
                          ))}
                        </div>}

                        {/* Lab tests */}
                        {aiData.labTests?.length > 0 && <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Recommended Tests</div>
                          {aiData.labTests.map((t: any, i: number) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", borderRadius: 6, background: "#faf5ff", marginBottom: 3, border: "1px solid #ddd6fe" }}>
                              <div><span style={{ fontSize: 10, color: "#1e293b" }}>{t.name}</span><span style={{ fontSize: 9, color: "#94a3b8", marginLeft: 4 }}>({t.urgency})</span></div>
                              {!locked && <button onClick={() => setTests(p => [...p, t])} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, border: "none", background: "#8b5cf6", color: "#fff", cursor: "pointer", fontWeight: 700 }}>+ Add</button>}
                            </div>
                          ))}
                        </div>}

                        {/* Advice */}
                        {aiData.advice?.length > 0 && <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Advice</div>
                          {aiData.advice.map((a: string, i: number) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", borderRadius: 6, background: "#f0fdf4", marginBottom: 3, border: "1px solid #bbf7d0" }}>
                              <span style={{ fontSize: 10, color: "#1e293b" }}>{a}</span>
                              {!locked && <button onClick={() => setAdvice(p => p ? `${p}\n• ${a}` : `• ${a}`)} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontWeight: 700 }}>+ Add</button>}
                            </div>
                          ))}
                        </div>}

                        <p style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic", marginTop: 8 }}>AI suggestions are for reference only. Doctor&apos;s clinical judgment takes priority.</p>
                      </>}
                  </>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <PrescriptionPrintView
        doctor={doctor}
        patient={patient}
        appt={appt}
        rx={{ ...rx, vitals: JSON.stringify(vitals), chiefComplaint: complaint, diagnosis, icdCodes: JSON.stringify(icdCodes), medications: JSON.stringify(meds), labTests: JSON.stringify(tests), referrals: JSON.stringify(refs), advice, followUpDate: fuDate, followUpNotes: fuNotes, consultationFee: fee }}
        settings={pSettings}
      />
    </>
  );
}

function PrescriptionPrintView({ doctor, patient, appt, rx, settings }: { doctor: any; patient: any; appt: any; rx: any; settings: any }) {
  const s = settings || {
    header: { showHospitalName: true, showHospitalAddress: true, showHospitalPhone: true, alignment: "left" },
    footer: { text: "This is a computer-generated prescription." },
    display: { showVitals: true, showDiagnosis: true, showIcdCodes: true, showReferrals: true },
    layout: { paperSize: "A4", margins: { top: 20, bottom: 20, left: 20, right: 20 } }
  };

  const vitals = rx.vitals ? JSON.parse(rx.vitals) : {};
  const meds = rx.medications ? JSON.parse(rx.medications) : [];
  const tests = rx.labTests ? JSON.parse(rx.labTests) : [];
  const icd = rx.icdCodes ? JSON.parse(rx.icdCodes) : [];
  const refs = rx.referrals ? JSON.parse(rx.referrals) : [];

  const h = doctor?.hospital;
  const hs = h?.settings;

  const paperSize = hs?.letterheadSize || s.layout?.paperSize || "A4";
  const margins = s.layout?.margins || { top: 20, bottom: 20, left: 20, right: 20 };

  const dimensions = {
    "A4": { width: "210mm", height: "297mm" },
    "A5": { width: "148mm", height: "210mm" },
    "Letter": { width: "216mm", height: "279mm" }
  }[paperSize as "A4" | "A5" | "Letter"] || { width: "210mm", height: "297mm" };

  return (
    <div className="printonly" style={{
      color: "#000",
      background: "#fff",
      width: "210mm",
      fontSize: "10pt",
      margin: "0 auto",
      boxSizing: "border-box",
      paddingTop: hs?.letterhead && hs.letterheadType === "IMAGE" ? "16%" : margins.top,
      paddingBottom: hs?.letterhead && hs.letterheadType === "IMAGE" ? "13%" : margins.bottom,
      paddingLeft: hs?.letterhead && hs.letterheadType === "IMAGE" ? "5%" : 40,
      paddingRight: hs?.letterhead && hs.letterheadType === "IMAGE" ? "5%" : 40
    }}>

      {/* PDF Letterhead Warning/Link */}
      {hs?.letterhead && hs.letterheadType === "PDF" && (
        <div className="noprint" style={{ padding: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 10, fontSize: "10pt" }}>
          <strong>Note:</strong> A PDF letterhead is configured. Please print the prescription and then feed the letterhead paper into the printer, or use a PDF editor to merge them.
          <a href={hs.letterhead} target="_blank" rel="noreferrer" style={{ marginLeft: 10, color: "#0E898F" }}>View PDF Letterhead</a>
        </div>
      )}

      {/* Header - Only show if no IMAGE letterhead is used */}
      {(!hs?.letterhead || hs.letterheadType !== "IMAGE") && (
        <div style={{
          display: "flex",
          flexDirection: s.header.alignment === "center" ? "column" : "row",
          alignItems: s.header.alignment === "center" ? "center" : "center",
          justifyContent: s.header.alignment === "center" ? "center" : s.header.alignment === "right" ? "flex-end" : "space-between",
          borderBottom: "2px solid #000",
          paddingBottom: 15,
          marginBottom: 20,
          gap: 20
        }}>
          {hs?.logo && <img src={hs.logo} alt="Hospital Logo" style={{ height: 60, objectFit: "contain" }} />}
          <div style={{ textAlign: s.header.alignment }}>
            {s.header.showHospitalName && <h1 style={{ fontSize: "22pt", fontWeight: 800, margin: 0, color: "#000" }}>{hs?.hospitalName || h?.name || "Medical Center"}</h1>}
            {s.header.showHospitalAddress && <p style={{ margin: "4px 0", fontSize: "10pt" }}>{hs?.address || "Hospital Address"}</p>}
            <div style={{ display: "flex", gap: 15, justifyContent: s.header.alignment === "center" ? "center" : s.header.alignment === "right" ? "flex-end" : "flex-start", fontSize: "10pt" }}>
              {s.header.showHospitalPhone && <span>Tel: {hs?.phone || h?.mobile || "Phone"}</span>}
              {hs?.email && <span>Email: {hs.email}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Doctor & Patient Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20, padding: "10px 0", borderBottom: "1px solid #eee" }}>
        <div>
          <div style={{ fontSize: "12pt", fontWeight: 800 }}>Dr. {doctor?.name}</div>
          <div style={{ fontSize: "9pt", color: "#000", fontWeight: 600 }}>{doctor?.specialization}</div>
          <div style={{ fontSize: "9pt", color: "#444" }}>{doctor?.qualification}</div>
          <div style={{ fontSize: "9pt", color: "#666" }}>Reg No: {doctor?.registrationNo || "—"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: "10pt" }}>Patient: {patient?.name}</div>
          <div style={{ fontSize: "9pt" }}>ID: {patient?.patientId} | {patient?.gender} | {patient?.dateOfBirth ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000) : ""} yrs</div>
          <div style={{ fontSize: "9pt", fontWeight: 600 }}>Date: {new Date(rx.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
        </div>
      </div>

      {/* Vitals */}
      {s.display.showVitals && Object.values(vitals).some(v => v) && (
        <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 14 }}>
          {Object.entries(vitals).map(([k, v]) => v ? (
            <div key={k}>
            <span style={{ fontWeight: 700, textTransform: "uppercase", color: "#64748b", fontSize: "8pt" }}>{k}: </span>
            <span style={{ fontWeight: 600, fontSize: "9pt" }}>{v as string}</span>
          </div>
          ) : null)}
        </div>
      )}

      {/* Prescription Content */}
      <div>
        {(rx.chiefComplaint || rx.diagnosis) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div>
              {rx.chiefComplaint && (
                <>
                  <div style={{ fontWeight: 700, fontSize: "8pt", marginBottom: 2, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em" }}>Chief Complaint</div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: "9pt" }}>{rx.chiefComplaint}</div>
                </>
              )}
            </div>
            <div>
              {s.display.showDiagnosis && rx.diagnosis && (
                <>
                  <div style={{ fontWeight: 700, fontSize: "8pt", marginBottom: 2, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em" }}>Diagnosis</div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "9pt" }}>{rx.diagnosis}</span>
                    {s.display.showIcdCodes && icd.length > 0 && <div style={{ color: "#64748b", fontSize: "8pt", marginTop: 2 }}>(ICD: {icd.join(", ")})</div>}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {meds.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <div style={{ fontWeight: 800, fontSize: "13pt", marginBottom: 8, borderBottom: "1.5px solid #000", paddingBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "15pt", fontStyle: "italic" }}>Rx</span>
              <span style={{ fontSize: "9pt", fontWeight: 600, color: "#64748b" }}>Medications</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #000" }}>
                  <th style={{ textAlign: "left", padding: "4px 5px", fontSize: "8pt", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Medication</th>
                  <th style={{ textAlign: "left", padding: "4px 5px", fontSize: "8pt", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Dosage</th>
                  <th style={{ textAlign: "left", padding: "4px 5px", fontSize: "8pt", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Frequency</th>
                  <th style={{ textAlign: "left", padding: "4px 5px", fontSize: "8pt", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {meds.map((m: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "5px 5px" }}>
                      <div style={{ fontWeight: 700, fontSize: "10pt" }}>{m.name}</div>
                      {(m.route || m.instructions) && <div style={{ fontSize: "8pt", color: "#475569" }}>{[m.route, m.instructions].filter(Boolean).join(" · ")}</div>}
                    </td>
                    <td style={{ padding: "5px 5px", fontSize: "9pt" }}>{m.dosage}</td>
                    <td style={{ padding: "5px 5px", fontSize: "9pt" }}>{m.frequency}</td>
                    <td style={{ padding: "5px 5px", fontSize: "9pt" }}>{m.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tests.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: "8pt", marginBottom: 4, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em" }}>Investigations</div>
            {tests.map((t: any, i: number) => (
              <div key={i} style={{ fontSize: "9pt", marginBottom: 2 }}>
                <span style={{ fontWeight: 600 }}>{t.name}</span>
                {t.urgency && <span style={{ fontSize: "8pt", color: "#64748b", marginLeft: 5 }}>({t.urgency})</span>}
              </div>
            ))}
          </div>
        )}

        {rx.advice && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: "8pt", marginBottom: 2, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em" }}>Advice</div>
            <div style={{ fontSize: "9pt", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{rx.advice}</div>
          </div>
        )}

        {rx.followUpDate && (
          <div style={{ marginBottom: 10, fontSize: "9pt" }}>
            <span style={{ fontWeight: 700, color: "#475569" }}>Next Follow-up: </span>
            <span style={{ fontWeight: 600 }}>{new Date(rx.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            {rx.followUpNotes && <span style={{ color: "#64748b" }}> — {rx.followUpNotes}</span>}
          </div>
        )}
      </div>

      {/* Signature */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, marginTop: 10, paddingBottom: 8 }}>
        <div style={{ textAlign: "center", minWidth: 160, maxWidth: 220 }}>
          <div style={{ height: 90, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 4 }}>
            {doctor?.signature && (
              <img src={doctor.signature} alt="Doctor Signature" style={{ maxHeight: 85, maxWidth: 200, objectFit: "contain", mixBlendMode: "multiply", display: "block" }} />
            )}
          </div>
          <div style={{ borderTop: "1.5px solid #000", paddingTop: 5 }}>
            <div style={{ fontWeight: 700, fontSize: 11 }}>Dr. {doctor?.name}</div>
            {doctor?.specialization && <div style={{ fontSize: 9, color: "#475569" }}>{doctor.specialization}</div>}
            <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>Digital Signature</div>
          </div>
        </div>
      </div>

      {(!hs?.letterhead || hs.letterheadType !== "IMAGE") && (
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 15, fontSize: "9pt", color: "#64748b", textAlign: "center", marginTop: 16 }}>
          {s.footer?.text || "This is a computer-generated prescription and does not require a physical signature."}
        </div>
      )}
    </div>
  );
}
