"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, X, Loader2, Calendar, Clock, User, Stethoscope,
  Building2, CheckCircle, XCircle, AlertCircle, RefreshCw, Hash,
  Phone, Mail, MessageCircle, ChevronRight, Eye, ClipboardList, CalendarCheck,
  Edit, Trash2, FileText, AlertTriangle, Download, Bell,
  ArrowLeft, Zap, Sun, Sunset, Moon, FileSpreadsheet, FileType, Activity,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType, TextRun, HeadingLevel, BorderStyle, AlignmentType } from "docx";
import AdminRescheduleModal from "./AdminRescheduleModal";

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Patient { id: string; patientId: string; name: string; phone: string; email?: string; gender?: string; dateOfBirth?: string; bloodGroup?: string; }
interface Doctor { id: string; name: string; specialization?: string; departmentId?: string; department?: { name: string }; consultationFee?: number; }
interface Department { id: string; name: string; code: string; type?: string; }
interface SubDepartment { id: string; name: string; type: string; code?: string; }
interface Appointment {
  id: string; patientId: string; doctorId: string; departmentId?: string;
  appointmentDate: string; timeSlot: string; type: string; status: string;
  consultationFee?: number; tokenNumber?: number; notes?: string;
  patient?: Patient; doctor?: Doctor; department?: Department;
  createdAt: string;
}

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SCHEDULED: { label: "Scheduled", color: "#0A6B70", bg: "#E6F4F4", border: "#B3E0E0" },
  CONFIRMED: { label: "Confirmed", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  COMPLETED: { label: "Completed", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  CANCELLED: { label: "Cancelled", color: "#dc2626", bg: "#fff5f5", border: "#fecaca" },
  NO_SHOW: { label: "No Show", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  RESCHEDULED: { label: "Rescheduled", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
};

const TYPE_COLORS: Record<string, string> = {
  OPD: "#0E898F", ONLINE: "#8b5cf6", FOLLOW_UP: "#10b981", EMERGENCY: "#ef4444",
};

const fmt12 = (t: string | null | undefined) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT SEARCH / QUICK-ADD
// ─────────────────────────────────────────────────────────────────────────────
function PatientSearchBox({ onSelect }: { onSelect: (p: Patient) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", gender: "", bloodGroup: "", dateOfBirth: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [dupPatient, setDupPatient] = useState<Patient | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const search = useCallback((val: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!val.trim()) { setResults([]); setShowResults(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const d = await api(`/api/patients?q=${encodeURIComponent(val)}`);
      const r = d.data || [];
      setResults(r);
      setShowResults(r.length > 0);
      setLoading(false);
    }, 300);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(""); setDupPatient(null);
    // Basic client-side validation
    if (form.name.trim().length < 2) { setMsg("Full name is required (at least 2 characters)"); setSaving(false); return; }
    if (form.phone.trim().length < 7) { setMsg("Valid phone number is required (at least 7 digits)"); setSaving(false); return; }

    const payload: any = {
      name: form.name.trim(),
      phone: form.phone.trim(),
    };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.gender) payload.gender = form.gender;
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.bloodGroup) payload.bloodGroup = form.bloodGroup;
    if (form.address.trim()) payload.address = form.address.trim();

    const d = await api("/api/patients", "POST", payload);
    if (d.success) {
      if (d.data.isNew) {
        // Newly registered — proceed directly
        onSelect(d.data.patient);
        setShowAdd(false);
        setForm({ name: "", phone: "", email: "", gender: "", bloodGroup: "", dateOfBirth: "", address: "" });
      } else {
        // Phone already exists — show duplicate warning
        setDupPatient(d.data.patient);
      }
    } else {
      setMsg(d.message || "Error registering patient");
    }
    setSaving(false);
  };

  const confirmDupPatient = () => {
    if (dupPatient) {
      onSelect(dupPatient);
      setShowAdd(false);
      setDupPatient(null);
      setForm({ name: "", phone: "", email: "", gender: "", bloodGroup: "", dateOfBirth: "", address: "" });
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
        Step 1 — Select or Register Patient
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: 1 }} ref={dropdownRef}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
            <Search size={15} color="#94a3b8" />
            <input
              style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "#334155", flex: 1 }}
              placeholder="Search by name, phone, or Patient ID..."
              value={q}
              onFocus={() => results.length > 0 && setShowResults(true)}
              onChange={e => { setQ(e.target.value); search(e.target.value); }}
            />
            {loading && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} color="#94a3b8" />}
            {q && (
              <button onClick={() => { setQ(""); setResults([]); setShowResults(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 0 }}><X size={13} /></button>
            )}
          </div>
          {showResults && results.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 280, overflowY: "auto", marginTop: 4 }}>
              <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em" }}>
                {results.length} patient{results.length > 1 ? "s" : ""} found — click to select
              </div>
              {results.map(p => (
                <button key={p.id} onClick={() => { onSelect(p); setShowResults(false); setResults([]); setQ(""); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f1f5f9", transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.patientId} · {p.phone}{p.email ? ` · ${p.email}` : ""}</div>
                  </div>
                  {p.gender && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>{p.gender}</span>}
                  <ChevronRight size={13} color="#cbd5e1" />
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => { setShowAdd(v => !v); setDupPatient(null); setMsg(""); }}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px dashed #cbd5e1", background: showAdd ? "#E6F4F4" : "#fff", color: showAdd ? "#0A6B70" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <Plus size={14} />New Patient
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 20, marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 4 }}>Register New Patient</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>Fill in patient details. Phone number must be unique per patient.</div>

          {/* Duplicate patient warning */}
          {dupPatient && (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertCircle size={18} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>Phone number already registered</div>
                  <div style={{ fontSize: 12, color: "#a16207", marginBottom: 10 }}>
                    The phone number <strong>{form.phone}</strong> is already registered to:
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 9, padding: "10px 14px", border: "1px solid #fde68a", marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>
                      {dupPatient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{dupPatient.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{dupPatient.patientId} · {dupPatient.phone}{dupPatient.gender ? ` · ${dupPatient.gender}` : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={confirmDupPatient}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Yes, book for {dupPatient.name}
                    </button>
                    <button type="button" onClick={() => { setDupPatient(null); setForm(p => ({ ...p, phone: "" })); }}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Change phone number
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Full Name *</label>
              <input style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", outline: "none" }}
                placeholder="e.g. Rahul Sharma" value={form.name} required
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Phone Number *</label>
              <input style={{ background: "#fff", border: `1.5px solid ${dupPatient ? "#fde68a" : "#e2e8f0"}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", outline: "none" }}
                placeholder="e.g. 9876543210" value={form.phone} required
                onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setDupPatient(null); }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Email</label>
              <input style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", outline: "none" }}
                type="email" placeholder="e.g. patient@email.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Gender</label>
              <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="">Select gender...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Date of Birth</label>
              <input type="date" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Blood Group</label>
              <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))}>
                <option value="">Select...</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Address</label>
              <input style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1e293b", outline: "none" }}
                placeholder="e.g. 123, MG Road, Mumbai" value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            {msg && (
              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#ef4444", fontWeight: 600, background: "#fff5f5", padding: "10px 14px", borderRadius: 9, border: "1px solid #fecaca" }}>
                <AlertCircle size={13} />{msg}
              </div>
            )}
            <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, marginTop: 4 }}>
              <button type="button" onClick={() => { setShowAdd(false); setDupPatient(null); setMsg(""); }}
                style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={saving || !!dupPatient}
                style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: (saving || dupPatient) ? "#e2e8f0" : "#0ea5e9", color: (saving || dupPatient) ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, cursor: (saving || dupPatient) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {saving && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}Register & Select
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING FORM
// ─────────────────────────────────────────────────────────────────────────────
function BookingForm({ patient, onSuccess, onCancel }: { patient: Patient; onSuccess: () => void; onCancel: () => void }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({
    departmentId: "", doctorId: "", appointmentDate: "", timeSlot: "",
    type: "OPD", notes: "", consultationFee: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/api/config/departments?simple=true").then(d => setDepartments(d.data || []));
  }, []);

  useEffect(() => {
    const url = form.departmentId
      ? `/api/config/doctors?simple=true&departmentId=${form.departmentId}`
      : `/api/config/doctors?simple=true`;
    api(url).then(d => setDoctors(d.data || []));
  }, [form.departmentId]);

  useEffect(() => {
    if (!form.doctorId || !form.appointmentDate) { setSlots([]); return; }
    setLoadingSlots(true);
    api(`/api/appointments/slots?doctorId=${form.doctorId}&date=${form.appointmentDate}`)
      .then(d => {
        setSlots(d.data?.slots || []);
        setBookedSlots(d.data?.bookedSlots || []);
      })
      .finally(() => setLoadingSlots(false));
  }, [form.doctorId, form.appointmentDate]);

  const selectedDoctor = doctors.find(d => d.id === form.doctorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");

    const now = new Date();
    const [y, m, day] = form.appointmentDate.split('-').map(Number);
    const [h, min] = form.timeSlot.split(':').map(Number);
    const selectedDate = new Date(y, m - 1, day, h, min, 0);

    if (selectedDate < now) {
      setMsg("The selected time slot has already passed. Please choose a future time.");
      setSaving(false);
      return;
    }

    const payload: any = {
      patientId: patient.id,
      doctorId: form.doctorId,
      appointmentDate: form.appointmentDate,
      timeSlot: form.timeSlot,
      type: form.type,
      notes: form.notes || null,
    };
    if (form.departmentId) payload.departmentId = form.departmentId;
    if (form.consultationFee) payload.consultationFee = parseFloat(form.consultationFee);

    const d = await api("/api/appointments", "POST", payload);
    if (d.success) { onSuccess(); }
    else setMsg(d.message || "Failed to book appointment");
    setSaving(false);
  };

  const today = toLocalDateStr(new Date());
  const tmrwDate = new Date();
  tmrwDate.setDate(tmrwDate.getDate() + 1);
  const tomorrow = toLocalDateStr(tmrwDate);

  const isSlotPassed = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return false;
    const now = new Date();
    const [y, m, day] = dateStr.split("-").map(Number);
    const [h, min] = timeStr.split(":").map(Number);
    const slotDate = new Date(y, m - 1, day, h, min, 0);
    return slotDate < now;
  };

  return (
    <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
      {/* Selected Patient Banner */}
      <div style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
          {patient.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{patient.name}</div>
          <div style={{ fontSize: 11, color: "#bae6fd" }}>{patient.patientId} · {patient.phone}</div>
        </div>
        <button onClick={onCancel} style={{ marginLeft: "auto", background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          <X size={13} />
        </button>
      </div>

      <div style={{ fontWeight: 700, fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>
        Step 2 — Appointment Details
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Department */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Department</label>
          <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value, doctorId: "", timeSlot: "" }))}>
            <option value="">Select Department...</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Doctor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Doctor *</label>
          <select required style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            value={form.doctorId} onChange={e => {
              const doc = doctors.find(d => d.id === e.target.value);
              setForm(p => ({
                ...p,
                doctorId: e.target.value,
                timeSlot: "",
                consultationFee: doc?.consultationFee ? String(doc.consultationFee) : "",
                departmentId: p.departmentId || doc?.departmentId || "",
              }));
            }}>
            <option value="">Select Doctor...</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ""}</option>)}
          </select>
        </div>

        {/* Date */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Appointment Date *</label>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={() => setForm(p => ({ ...p, appointmentDate: today, timeSlot: "" }))}
                style={{ padding: "2px 8px", borderRadius: 6, border: `1px solid ${form.appointmentDate === today ? "#0ea5e9" : "#e2e8f0"}`, background: form.appointmentDate === today ? "#E6F4F4" : "#f8fafc", color: form.appointmentDate === today ? "#0ea5e9" : "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
                Today
              </button>
              <button type="button" onClick={() => setForm(p => ({ ...p, appointmentDate: tomorrow, timeSlot: "" }))}
                style={{ padding: "2px 8px", borderRadius: 6, border: `1px solid ${form.appointmentDate === tomorrow ? "#0ea5e9" : "#e2e8f0"}`, background: form.appointmentDate === tomorrow ? "#E6F4F4" : "#f8fafc", color: form.appointmentDate === tomorrow ? "#0ea5e9" : "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
                Tomorrow
              </button>
            </div>
          </div>
          <input required type="date" min={today}
            style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            value={form.appointmentDate} onChange={e => setForm(p => ({ ...p, appointmentDate: e.target.value, timeSlot: "" }))} />
        </div>

        {/* Type */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Type</label>
          <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            <option value="OPD">OPD</option>
            <option value="ONLINE">Online</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>

        {/* Time Slots */}
        {form.doctorId && form.appointmentDate && (
          <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Time Slot *{loadingSlots && <Loader2 size={11} style={{ marginLeft: 6, animation: "spin .7s linear infinite" }} />}
            </label>
            {loadingSlots ? (
              <div style={{ fontSize: 13, color: "#94a3b8", padding: "12px 0" }}>Loading available slots...</div>
            ) : slots.length === 0 ? (
              <div style={{ fontSize: 13, color: "#ef4444", padding: "12px 16px", background: "#fff5f5", borderRadius: 9, border: "1px solid #fecaca" }}>
                No available slots for this date. Doctor may be unavailable or all slots are booked.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {slots.map(slot => {
                  const isBooked = bookedSlots.includes(slot);
                  const isPast = isSlotPassed(form.appointmentDate, slot);
                  const isDisabled = isBooked || isPast;
                  const isSelected = form.timeSlot === slot;
                  return (
                    <button key={slot} type="button" disabled={isDisabled}
                      onClick={() => !isDisabled && setForm(p => ({ ...p, timeSlot: slot }))}
                      title={isPast ? "Time slot has already passed" : isBooked ? "Already booked" : "Available"}
                      style={{
                        padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${isSelected ? "#0ea5e9" : isDisabled ? "#f1f5f9" : "#e2e8f0"}`,
                        background: isSelected ? "#0ea5e9" : isDisabled ? "#f8fafc" : "#fff",
                        color: isSelected ? "#fff" : isDisabled ? "#cbd5e1" : "#334155",
                        fontSize: 12, fontWeight: isSelected ? 700 : 500,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        transition: "all .15s",
                        textDecoration: isDisabled ? "line-through" : "none",
                      }}>
                      {fmt12(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Fee */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Consultation Fee {selectedDoctor?.consultationFee !== undefined ? `(Default: ₹${selectedDoctor.consultationFee})` : ""}
          </label>
          <input type="number" min="0" step="0.01"
            style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            placeholder={selectedDoctor?.consultationFee?.toString() || "0"}
            value={form.consultationFee} onChange={e => setForm(p => ({ ...p, consultationFee: e.target.value }))} />
        </div>

        {/* Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Notes</label>
          <input
            style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
            placeholder="Chief complaint or notes..."
            value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>

        {msg && (
          <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ef4444", fontWeight: 600, background: "#fff5f5", padding: "10px 14px", borderRadius: 9, border: "1px solid #fecaca" }}>
            <AlertCircle size={14} />{msg}
          </div>
        )}

        <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, marginTop: 4 }}>
          <button type="button" onClick={onCancel}
            style={{ padding: "10px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.timeSlot}
            style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: !form.timeSlot ? "#e2e8f0" : "linear-gradient(135deg,#0ea5e9,#0369a1)", color: !form.timeSlot ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, cursor: (saving || !form.timeSlot) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: form.timeSlot ? "0 4px 12px rgba(14,165,233,.3)" : "none" }}>
            {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <CalendarCheck size={14} />}
            Book Appointment
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW-UP MODAL
// ─────────────────────────────────────────────────────────────────────────────
function FollowUpModal({ appointment, onClose, onSuccess }: { appointment: Appointment; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ followUpDate: "", reason: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");
    const d = await api("/api/followups", "POST", {
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      followUpDate: form.followUpDate,
      reason: form.reason || null,
      notes: form.notes || null,
    });
    if (d.success) { onSuccess(); onClose(); }
    else setMsg(d.message || "Failed to schedule follow-up");
    setSaving(false);
  };

  const today = toLocalDateStr(new Date());

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.4)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#1e293b" }}>Schedule Follow-up</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>
        <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: 9, border: "1px solid #bbf7d0", marginBottom: 18, fontSize: 13, color: "#166534" }}>
          <strong>{appointment.patient?.name}</strong> · {appointment.patient?.patientId}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Follow-up Date *</label>
            <input required type="date" min={today}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
              value={form.followUpDate} onChange={e => setForm(p => ({ ...p, followUpDate: e.target.value }))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Reason</label>
            <input
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
              placeholder="Reason for follow-up..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Doctor Notes</label>
            <textarea rows={3}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none", resize: "none", fontFamily: "Inter, sans-serif" }}
              placeholder="Clinical notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          {msg && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT APPOINTMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EditAppointmentModal({ appointment, onClose, onSave }: { appointment: Appointment; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    appointmentDate: appointment.appointmentDate,
    timeSlot: appointment.timeSlot,
    type: appointment.type,
    status: appointment.status,
    consultationFee: appointment.consultationFee?.toString() || "",
    notes: appointment.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      appointmentDate: form.appointmentDate,
      timeSlot: form.timeSlot,
      type: form.type,
      status: form.status,
      notes: form.notes || null,
    };
    if (form.consultationFee) payload.consultationFee = parseFloat(form.consultationFee);
    await onSave(payload);
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>Edit Appointment</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 12, marginBottom: 18, fontSize: 12, color: "#0369a1" }}>
          <strong>{appointment.patient?.name}</strong> ({appointment.patient?.patientId}) with Dr. {appointment.doctor?.name}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Date</label>
              <input type="date" required
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.appointmentDate} onChange={e => setForm(p => ({ ...p, appointmentDate: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Time Slot</label>
              <input type="time" required
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.timeSlot} onChange={e => setForm(p => ({ ...p, timeSlot: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Type</label>
              <select
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="OPD">OPD</option>
                <option value="ONLINE">Online</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Status</label>
              <select
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
                value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Consultation Fee</label>
            <input type="number" min="0" step="0.01"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none" }}
              placeholder="0" value={form.consultationFee} onChange={e => setForm(p => ({ ...p, consultationFee: e.target.value }))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Notes</label>
            <textarea rows={3}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none", resize: "none", fontFamily: "Inter, sans-serif" }}
              placeholder="Additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .5 : 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "#d97706", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESCHEDULE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function RescheduleModal({ appt, onClose, onConfirm }: { appt: Appointment; onClose: () => void; onConfirm: (date: string, time: string) => void }) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const [newDate, setNewDate] = useState(toLocalDateStr(tomorrow));
  const [selectedTime, setSelectedTime] = useState("");
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [noAvailability, setNoAvailability] = useState(false);
  const [slotErr, setSlotErr] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const isSameDate = (date: string) => {
    const apptDate = appt.appointmentDate ? toLocalDateStr(new Date(appt.appointmentDate)) : "";
    return date === apptDate;
  };

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setAllSlots([]); setBookedSlots([]); setSelectedTime("");
    setNoAvailability(false); setSlotErr(""); setErr("");
    try {
      const r = await fetch(`/api/appointments/slots?doctorId=${appt.doctorId}&date=${date}`, { credentials: "include" }).then(x => x.json());
      if (r.success) {
        let all: string[] = r.data?.allSlots || [];
        let booked: string[] = r.data?.bookedSlots || [];
        if (isSameDate(date)) booked = booked.filter((s: string) => s !== appt.timeSlot);
        const isToday = date === toLocalDateStr(new Date());
        if (isToday) {
          const now = new Date();
          const nowMins = now.getHours() * 60 + now.getMinutes();
          all = all.filter(s => { const [h, m] = s.split(":").map(Number); return h * 60 + m > nowMins; });
          booked = booked.filter(s => { const [h, m] = s.split(":").map(Number); return h * 60 + m > nowMins; });
        }
        if (!all.length) setNoAvailability(true);
        else { setAllSlots(all); setBookedSlots(booked); }
      } else {
        setSlotErr(r.message || "Could not load slots.");
      }
    } catch { setSlotErr("Network error loading slots."); }
    finally { setSlotsLoading(false); }
  }, [appt.doctorId, appt.timeSlot, appt.appointmentDate]);

  useEffect(() => { if (newDate) fetchSlots(newDate); }, [newDate, fetchSlots]);

  const handleConfirm = () => {
    if (!newDate) { setErr("Please select a date."); return; }
    if (!selectedTime) { setErr("Please select a time slot."); return; }
    setSaving(true);
    onConfirm(newDate, selectedTime);
  };

  const availableSlots = allSlots.filter(s => !bookedSlots.includes(s));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,.18)", fontFamily: "'Inter',sans-serif", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>Reschedule Appointment</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{appt.patient?.name} &nbsp;·&nbsp; {appt.doctor?.name}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexShrink: 0 }}><X size={14} /></button>
        </div>

        <div style={{ background: "#E6F4F4", borderRadius: 12, padding: "12px 14px", marginBottom: 20, border: "1px solid #B3E0E0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Current Appointment</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#07595D" }}>
            {new Date(appt.appointmentDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} &nbsp;at&nbsp; {fmt12(appt.timeSlot)}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Select New Date</label>
          <input type="date" value={newDate} min={toLocalDateStr(new Date())}
            onChange={e => { setNewDate(e.target.value); setErr(""); }}
            style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #B3E0E0", background: "#f8fafc", fontSize: 14, color: "#334155", outline: "none", fontFamily: "'Inter',sans-serif", boxSizing: "border-box", cursor: "pointer" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Available Time Slots</label>
            {!slotsLoading && allSlots.length > 0 && (
              <span style={{ fontSize: 10, color: "#0E898F", fontWeight: 600, background: "#E6F4F4", padding: "2px 8px", borderRadius: 100, border: "1px solid #B3E0E0" }}>
                {availableSlots.length} available
              </span>
            )}
          </div>

          {slotsLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 0", color: "#94a3b8", fontSize: 13 }}>
              <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> Loading doctor schedule...
            </div>
          ) : slotErr ? (
            <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, padding: "12px", background: "#fff5f5", borderRadius: 9, border: "1px solid #fecaca" }}>{slotErr}</div>
          ) : noAvailability ? (
            <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, padding: "14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", textAlign: "center" }}>
              Doctor is not available on this day. Please choose another date.
            </div>
          ) : allSlots.length === 0 ? null : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {allSlots.map(slot => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedTime === slot;
                return (
                  <button key={slot} disabled={isBooked}
                    onClick={() => { if (!isBooked) { setSelectedTime(slot); setErr(""); } }}
                    style={{
                      padding: "9px 6px", borderRadius: 9,
                      border: isSelected ? "2px solid #0E898F" : isBooked ? "1px solid #e2e8f0" : "1.5px solid #B3E0E0",
                      background: isSelected ? "#0E898F" : isBooked ? "#f1f5f9" : "#E6F4F4",
                      color: isSelected ? "#fff" : isBooked ? "#cbd5e1" : "#0A6B70",
                      fontSize: 12, fontWeight: 700,
                      cursor: isBooked ? "not-allowed" : "pointer",
                      textDecoration: isBooked ? "line-through" : "none",
                      fontFamily: "'Inter',sans-serif", transition: "all .15s", position: "relative",
                    }}>
                    {slot}
                    {isBooked && (
                      <span style={{ position: "absolute", top: -6, right: -4, fontSize: 8, background: "#ef4444", color: "#fff", borderRadius: 100, padding: "1px 4px", fontWeight: 700 }}>Full</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedTime && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <CheckCircle size={13} /> Selected: {fmt12(selectedTime)}
            </div>
          )}
        </div>

        {err && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12, fontWeight: 600 }}>{err}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={saving}
            style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "2px solid #0E898F", background: "#fff", color: "#0E898F", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={saving || !selectedTime}
            style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: saving || !selectedTime ? "#94a3b8" : "#0E898F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving || !selectedTime ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: saving || !selectedTime ? "none" : "0 4px 14px rgba(14,137,143,.35)" }}>
            {saving ? <><Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> Saving…</> : <><RefreshCw size={13} /> Confirm Reschedule</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT TABLE
// ─────────────────────────────────────────────────────────────────────────────
function AppointmentTable({ onRefresh, onViewPatient }: { onRefresh: number; onViewPatient: (id: string) => void }) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(toLocalDateStr(new Date()));
  const [showAll, setShowAll] = useState(false);
  const [followUpTarget, setFollowUpTarget] = useState<Appointment | null>(null);
  const [viewTarget, setViewTarget] = useState<Appointment | null>(null);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"appointment" | "complete" | null>(null);
  const [page, setPage] = useState(1);
  const [reminderSending, setReminderSending] = useState<Set<string>>(new Set());
  const [reminderMsg, setReminderMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<"appointment" | "complete" | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<{ ok: boolean; text: string } | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  // ── Reschedule Alert (when doctor reschedules, show popup to admin/reception) ──
  const [rescheduledAlertAppt, setRescheduledAlertAppt] = useState<Appointment | null>(null);
  const [dismissedRescheduledIds, setDismissedRescheduledIds] = useState<Set<string>>(new Set());
  const [adminRescheduleTarget, setAdminRescheduleTarget] = useState<Appointment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (!showAll && dateFilter) params.set("date", dateFilter);
    const d = await api(`/api/appointments?${params}`);
    if (d.success) { setAppointments(d.data.data || []); setPagination(d.data.pagination || { page: 1, total: 0, totalPages: 1 }); }
    setLoading(false);
  }, [page, search, statusFilter, dateFilter, showAll, onRefresh]);

  useEffect(() => { load(); }, [load]);

  // ── Poll for RESCHEDULED appointments and show alert ──
  useEffect(() => {
    const check = () => {
      const found = appointments.find((a: Appointment) =>
        a.status === "RESCHEDULED" && !dismissedRescheduledIds.has(a.id)
      );
      if (found && !rescheduledAlertAppt && !adminRescheduleTarget) {
        setRescheduledAlertAppt(found);
      }
    };
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [appointments, dismissedRescheduledIds, rescheduledAlertAppt, adminRescheduleTarget]);

  const updateStatus = async (id: string, status: string, appt?: Appointment) => {
    if (status === "RESCHEDULED" && appt) {
      setRescheduleTarget(appt);
      return;
    }
    try {
      const d = await api(`/api/appointments/${id}`, "PUT", { status });
      if (!d.success) {
        setDeleteAlert({ ok: false, text: d.message || "Failed to update status" });
        setTimeout(() => setDeleteAlert(null), 5000);
      }
      load();
    } catch (e: any) {
      setDeleteAlert({ ok: false, text: e.message || "Network error updating status" });
      setTimeout(() => setDeleteAlert(null), 5000);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteMode) return;
    setDeleting(true);
    const endpoint = deleteMode === "complete" 
      ? `/api/appointments/${deleteTarget.id}/delete-complete`
      : `/api/appointments/${deleteTarget.id}`;
    const d = await api(endpoint, "DELETE");
    if (d.success) {
      const name = deleteTarget.patient?.name || "Appointment";
      const msg = deleteMode === "complete"
        ? `Patient "${name}" and all related history permanently deleted`
        : `Appointment for "${name}" cancelled — slot freed`;
      setDeleteTarget(null);
      setDeleteMode(null);
      selectedIds.delete(deleteTarget.id);
      setSelectedIds(new Set(selectedIds));
      setDeleteAlert({ ok: true, text: msg });
      setTimeout(() => setDeleteAlert(null), 5000);
      load();
    } else {
      setDeleteAlert({ ok: false, text: d.message || "Failed to delete" });
      setTimeout(() => setDeleteAlert(null), 5000);
    }
    setDeleting(false);
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteMode) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    let ok = 0, fail = 0;
    for (const id of ids) {
      const endpoint = bulkDeleteMode === "complete"
        ? `/api/appointments/${id}/delete-complete`
        : `/api/appointments/${id}`;
      const d = await api(endpoint, "DELETE");
      if (d.success) ok++; else fail++;
    }
    const msg = bulkDeleteMode === "complete"
      ? `${ok} patient(s) and all history permanently deleted${fail ? `, ${fail} failed` : ""}`
      : `${ok} appointment(s) cancelled — slots freed${fail ? `, ${fail} failed` : ""}`;
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
    setBulkDeleteMode(null);
    setBulkDeleting(false);
    setDeleteAlert({ ok: fail === 0, text: msg });
    setTimeout(() => setDeleteAlert(null), 5000);
    load();
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };
  const toggleAll = () => {
    if (selectedIds.size === appointments.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(appointments.map(a => a.id)));
  };

  const handleEdit = async (updatedData: any) => {
    if (!editTarget) return;
    const d = await api(`/api/appointments/${editTarget.id}`, "PUT", updatedData);
    if (d.success) {
      setEditTarget(null);
      load();
    } else {
      alert(d.message || "Failed to update appointment");
    }
  };

  // ── Reschedule Alert handlers ──
  const handleAlertConfirm = async (id: string) => {
    const d = await api(`/api/appointments/${id}`, "PUT", { status: "CONFIRMED" });
    if (d.success) {
      setRescheduledAlertAppt(null);
      setDismissedRescheduledIds(prev => new Set(prev).add(id));
      load();
    } else {
      setDeleteAlert({ ok: false, text: d.message || "Failed to confirm" });
      setTimeout(() => setDeleteAlert(null), 5000);
    }
  };
  const handleAlertCancel = async (id: string) => {
    const d = await api(`/api/appointments/${id}`, "PUT", { status: "CANCELLED" });
    if (d.success) {
      setRescheduledAlertAppt(null);
      setDismissedRescheduledIds(prev => new Set(prev).add(id));
      load();
    } else {
      setDeleteAlert({ ok: false, text: d.message || "Failed to cancel" });
      setTimeout(() => setDeleteAlert(null), 5000);
    }
  };
  const handleAdminRescheduleConfirm = async (id: string, payload: { doctorId: string; departmentId: string; appointmentDate: string; timeSlot: string }) => {
    const d = await api(`/api/appointments/${id}`, "PUT", {
      ...payload,
      status: "SCHEDULED",
    });
    if (d.success) {
      setAdminRescheduleTarget(null);
      setRescheduledAlertAppt(null);
      setDismissedRescheduledIds(prev => new Set(prev).add(id));
      // Fire-and-forget email notification
      api("/api/appointments/reschedule-email", "POST", { appointmentId: id }).catch(() => { });
      load();
    } else {
      setDeleteAlert({ ok: false, text: d.message || "Failed to reschedule" });
      setTimeout(() => setDeleteAlert(null), 5000);
    }
  };

  const getExportData = () => appointments.map(a => ({
    Patient: a.patient?.name || "—",
    "Patient ID": a.patient?.patientId || "—",
    Doctor: a.doctor?.name || "—",
    Department: a.department?.name || "—",
    Date: new Date(a.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    Time: fmt12(a.timeSlot),
    Type: a.type,
    Status: a.status,
    Fee: a.consultationFee != null ? `₹${a.consultationFee}` : "—",
    Token: a.tokenNumber ?? "—",
  }));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Appointments Report", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
    const rows = getExportData();
    autoTable(doc, {
      startY: 28,
      head: [["Patient", "Patient ID", "Doctor", "Dept", "Date", "Time", "Type", "Status", "Fee"]],
      body: rows.map(r => [r.Patient, r["Patient ID"], r.Doctor, r.Department, r.Date, r.Time, r.Type, r.Status, r.Fee]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 137, 143] },
    });
    doc.save(`appointments-${new Date().toISOString().slice(0, 10)}.pdf`);
    setShowExport(false);
  };

  const exportExcel = () => {
    const rows = getExportData();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Appointments");
    XLSX.writeFile(wb, `appointments-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExport(false);
  };

  const exportWord = async () => {
    const rows = getExportData();
    const keys = ["Patient", "Patient ID", "Doctor", "Department", "Date", "Time", "Type", "Status", "Fee"] as const;
    const headerRow = new TableRow({
      children: keys.map(k => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 18, font: "Calibri" })] })],
        width: { size: 100 / keys.length, type: WidthType.PERCENTAGE },
        shading: { fill: "0E898F" },
      })),
    });
    const dataRows = rows.map(r => new TableRow({
      children: keys.map(k => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String((r as any)[k] ?? ""), size: 18, font: "Calibri" })] })],
      })),
    }));
    const doc = new DocxDocument({
      sections: [{
        children: [
          new Paragraph({ text: "Appointments Report", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-IN")}`, size: 18, color: "888888" })] }),
          new Paragraph({ text: "" }),
          new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `appointments-${new Date().toISOString().slice(0, 10)}.docx`);
    setShowExport(false);
  };

  return (
    <div>
      {/* Delete Alert */}
      {deleteAlert && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, marginBottom: 14, background: deleteAlert.ok ? "#f0fdf4" : "#fef2f2", border: `1.5px solid ${deleteAlert.ok ? "#bbf7d0" : "#fecaca"}`, animation: "fadeIn .2s ease" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: deleteAlert.ok ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {deleteAlert.ok ? <CheckCircle size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#ef4444" />}
          </div>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: deleteAlert.ok ? "#166534" : "#991b1b" }}>{deleteAlert.text}</div>
          <button onClick={() => setDeleteAlert(null)} style={{ background: "none", border: "none", cursor: "pointer", color: deleteAlert.ok ? "#16a34a" : "#ef4444", padding: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", flex: 1, minWidth: 200 }}>
          <Search size={13} color="#94a3b8" />
          <input style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "#334155", width: "100%" }}
            placeholder="Search patient, doctor..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <input type="date"
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: showAll ? "#f1f5f9" : "#f8fafc", fontSize: 13, color: "#334155", outline: "none", opacity: showAll ? 0.5 : 1 }}
          value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} disabled={showAll} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#334155", cursor: "pointer", userSelect: "none" }}>
          <input type="checkbox" checked={showAll} onChange={e => { setShowAll(e.target.checked); setPage(1); }}
            style={{ width: 14, height: 14, cursor: "pointer", accentColor: "#0ea5e9" }} />
          Show All Appointments
        </label>
        <select style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#334155", outline: "none" }}
          value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => { setDateFilter(toLocalDateStr(new Date())); setSearch(""); setStatusFilter(""); setShowAll(false); }}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <RefreshCw size={12} />Clear
        </button>
        {selectedIds.size > 0 && (
          <button onClick={() => setShowBulkConfirm(true)}
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #fecaca", background: "#fff5f5", fontSize: 12, color: "#ef4444", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Trash2 size={12} />Delete ({selectedIds.size})
          </button>
        )}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowExport(!showExport)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}>
            <Download size={14} />Export
          </button>
          {showExport && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 50, minWidth: 180, padding: 6 }}>
              <button onClick={exportPDF}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize: 13, color: "#334155", fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff5f5", color: "#ef4444" }}><FileText size={13} /></span>Export as PDF
              </button>
              <button onClick={exportExcel}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize: 13, color: "#334155", fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", color: "#16a34a" }}><FileSpreadsheet size={13} /></span>Export as Excel
              </button>
              <button onClick={exportWord}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize: 13, color: "#334155", fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "#eff6ff", color: "#2563eb" }}><FileType size={13} /></span>Export as Word
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 0", color: "#94a3b8", fontSize: 14 }}>
          <Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} />Loading...
        </div>
      ) : appointments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0" }}>
          <CalendarCheck size={32} style={{ marginBottom: 10, opacity: .4 }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>No appointments found</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting the date or filters</div>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #ffffff, #f8fafc)", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "12px 10px 12px 14px", borderBottom: "2px solid #f1f5f9", width: 36 }}>
                  <input type="checkbox" checked={appointments.length > 0 && selectedIds.size === appointments.length}
                    onChange={toggleAll} style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#0E898F" }} />
                </th>
                {["Token", "Patient", "Doctor", "Date & Time", "Type", "Fee", "Status", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "12px 14px", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => {
                const sc = STATUS_CONFIG[appt.status] || STATUS_CONFIG.SCHEDULED;
                const date = new Date(appt.appointmentDate);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <tr key={appt.id} style={{ borderBottom: "1px solid #f8fafc", background: selectedIds.has(appt.id) ? "#f0fdfa" : "transparent" }}
                    onMouseEnter={e => { if (!selectedIds.has(appt.id)) e.currentTarget.style.background = "#fafbfc"; }}
                    onMouseLeave={e => { if (!selectedIds.has(appt.id)) e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "12px 10px 12px 14px", width: 36 }}>
                      <input type="checkbox" checked={selectedIds.has(appt.id)} onChange={() => toggleSelect(appt.id)}
                        style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#0E898F" }} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "#E6F4F4", border: "1px solid #B3E0E0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0E898F", fontWeight: 800, fontSize: 13 }}>
                        {appt.tokenNumber || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{appt.patient?.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{appt.patient?.patientId}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>{appt.doctor?.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{appt.doctor?.specialization || appt.department?.name || "—"}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? "#0A6B70" : "#334155" }}>
                        {isToday ? "Today" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmt12(appt.timeSlot)}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 100, background: `${TYPE_COLORS[appt.type]}15`, color: TYPE_COLORS[appt.type], fontWeight: 700, border: `1px solid ${TYPE_COLORS[appt.type]}30` }}>
                        {appt.type.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                      {appt.consultationFee !== null && appt.consultationFee !== undefined ? `₹${appt.consultationFee}` : "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <select value={appt.status}
                        onChange={e => updateStatus(appt.id, e.target.value, appt)}
                        style={{ fontSize: 11, padding: "4px 10px", borderRadius: 100, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 700, cursor: "pointer", outline: "none" }}>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => setViewTarget(appt)} title="View Details"
                          style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#E6F4F4", color: "#0E898F", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Eye size={13} />
                        </button>
                        {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED" || appt.status === "RESCHEDULED") && (
                          <button onClick={() => setRescheduleTarget(appt)} title="Reschedule Appointment"
                            style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#ecfeff", color: "#0891b2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <RefreshCw size={13} />
                          </button>
                        )}
                        <button onClick={() => setEditTarget(appt)} title="Edit Appointment"
                          style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#fef3c7", color: "#d97706", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Edit size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(appt)} title="Delete Appointment"
                          style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#fff5f5", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 size={13} />
                        </button>
                        {appt.status === "COMPLETED" && (
                          <button onClick={() => setFollowUpTarget(appt)} title="Schedule Follow-up"
                            style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#f0fdf4", color: "#10b981", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CalendarCheck size={13} />
                          </button>
                        )}
                        {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && appt.patient?.email && (
                          <button
                            disabled={reminderSending.has(appt.id)}
                            title="Send Reminder Email"
                            onClick={async () => {
                              setReminderSending(s => new Set(s).add(appt.id));
                              try {
                                const d = await api("/api/appointments/remind", "POST", { appointmentId: appt.id });
                                setReminderMsg({ id: appt.id, ok: d.success, text: d.success ? "Reminder sent!" : (d.message || "Failed") });
                                setTimeout(() => setReminderMsg(null), 3000);
                              } finally {
                                setReminderSending(s => { const n = new Set(s); n.delete(appt.id); return n; });
                              }
                            }}
                            style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: reminderSending.has(appt.id) ? "#f1f5f9" : "#fffbeb", color: reminderSending.has(appt.id) ? "#94a3b8" : "#d97706", cursor: reminderSending.has(appt.id) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {reminderSending.has(appt.id) ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <Bell size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Showing {appointments.length} of {pagination.total} appointments</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .5 : 1 }}>
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: page === pagination.totalPages ? "not-allowed" : "pointer", opacity: page === pagination.totalPages ? .5 : 1 }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {reminderMsg && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 500, background: reminderMsg.ok ? "#f0fdf4" : "#fff5f5", border: `1px solid ${reminderMsg.ok ? "#bbf7d0" : "#fecaca"}`, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", fontSize: 13, fontWeight: 600, color: reminderMsg.ok ? "#16a34a" : "#ef4444" }}>
          {reminderMsg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {reminderMsg.text}
        </div>
      )}

      {rescheduleTarget && (
        <RescheduleModal
          appt={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onConfirm={async (newDate, newTime) => {
            const d = await api(`/api/appointments/${rescheduleTarget.id}`, "PUT", {
              status: "RESCHEDULED",
              appointmentDate: newDate,
              timeSlot: newTime,
            });
            if (d.success) {
              setRescheduleTarget(null);
              setDeleteAlert({ ok: true, text: `Appointment for "${rescheduleTarget.patient?.name}" rescheduled to ${new Date(newDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${newTime}` });
              setTimeout(() => setDeleteAlert(null), 5000);
              load();
            } else {
              setRescheduleTarget(null);
              setDeleteAlert({ ok: false, text: d.message || "Failed to reschedule" });
              setTimeout(() => setDeleteAlert(null), 5000);
            }
          }}
        />
      )}

      {followUpTarget && (
        <FollowUpModal
          appointment={followUpTarget}
          onClose={() => setFollowUpTarget(null)}
          onSuccess={load}
        />
      )}

      {/* View Appointment Details Modal */}
      {viewTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setViewTarget(null); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>Appointment Details</div>
              <button onClick={() => setViewTarget(null)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Patient Information</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{viewTarget.patient?.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{viewTarget.patient?.patientId} • {viewTarget.patient?.phone}</div>
                {viewTarget.patient?.email && <div style={{ fontSize: 13, color: "#64748b" }}>{viewTarget.patient.email}</div>}
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Doctor & Department</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{viewTarget.doctor?.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{viewTarget.doctor?.specialization || viewTarget.department?.name || "—"}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Date & Time</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{new Date(viewTarget.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{fmt12(viewTarget.timeSlot)}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Token Number</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#7c3aed" }}>{viewTarget.tokenNumber || "—"}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Type</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TYPE_COLORS[viewTarget.type] }}>{viewTarget.type.replace("_", " ")}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Status</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: STATUS_CONFIG[viewTarget.status]?.color }}>{STATUS_CONFIG[viewTarget.status]?.label}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Fee</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{viewTarget.consultationFee ? `₹${viewTarget.consultationFee}` : "—"}</div>
                </div>
              </div>
              {viewTarget.notes && (
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Notes</div>
                  <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{viewTarget.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {editTarget && (
        <EditAppointmentModal
          appointment={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget && !deleting) { setDeleteTarget(null); setDeleteMode(null); } }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Delete Appointment</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  Choose how you want to delete this appointment for <strong>{deleteTarget.patient?.name}</strong>
                </div>
              </div>
            </div>
            
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12, marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#92400e", fontWeight: 600, marginBottom: 4 }}>📋 Appointment Details</div>
              <div style={{ fontSize: 11, color: "#a16207" }}>
                {new Date(deleteTarget.appointmentDate).toLocaleDateString("en-IN")} at {fmt12(deleteTarget.timeSlot)} with Dr. {deleteTarget.doctor?.name}
              </div>
            </div>

            {!deleteMode ? (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 12 }}>Select deletion option:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => setDeleteMode("appointment")}
                    style={{ padding: "14px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", textAlign: "left", cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.background = "#fffbeb"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>🗑️ Cancel Appointment Only</div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>Marks appointment as cancelled and frees the date & time slot. Patient record and history remain intact.</div>
                  </button>
                  <button onClick={() => setDeleteMode("complete")}
                    style={{ padding: "14px 16px", borderRadius: 10, border: "1.5px solid #fee2e2", background: "#fff5f5", textAlign: "left", cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#fee2e2"; e.currentTarget.style.background = "#fff5f5"; }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>⚠️ Delete Complete Patient History</div>
                    <div style={{ fontSize: 11, color: "#991b1b", lineHeight: 1.4 }}><strong>PERMANENT:</strong> Deletes the patient record along with all appointments, prescriptions, bills, payments, procedures, visits, and follow-ups. This cannot be undone!</div>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: deleteMode === "complete" ? "#fef2f2" : "#f0fdf4", border: `1.5px solid ${deleteMode === "complete" ? "#fecaca" : "#bbf7d0"}`, borderRadius: 10, padding: 14, marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: deleteMode === "complete" ? "#991b1b" : "#166534", marginBottom: 6 }}>
                  {deleteMode === "complete" ? "⚠️ Complete Deletion Selected" : "✓ Cancel Appointment Selected"}
                </div>
                <div style={{ fontSize: 11, color: deleteMode === "complete" ? "#991b1b" : "#166534", lineHeight: 1.4 }}>
                  {deleteMode === "complete" 
                    ? "This will permanently delete the patient and ALL related records (appointments, prescriptions, bills, visits, procedures). This cannot be undone."
                    : "This appointment will be marked as cancelled and the slot will be freed. Patient record will remain intact."}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { if (deleteMode) setDeleteMode(null); else { setDeleteTarget(null); setDeleteMode(null); } }} disabled={deleting}
                style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? .5 : 1 }}>
                {deleteMode ? "Back" : "Cancel"}
              </button>
              {deleteMode && (
                <button onClick={handleDelete} disabled={deleting}
                  style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: deleteMode === "complete" ? "#dc2626" : "#f59e0b", color: "#fff", fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? .7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {deleting && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
                  {deleting ? "Processing..." : (deleteMode === "complete" ? "Delete Everything" : "Cancel Appointment")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showBulkConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget && !bulkDeleting) { setShowBulkConfirm(false); setBulkDeleteMode(null); } }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Delete {selectedIds.size} Appointment(s)</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  Choose how you want to handle <strong>{selectedIds.size}</strong> selected appointment(s)
                </div>
              </div>
            </div>

            {!bulkDeleteMode ? (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 12 }}>Select deletion option:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => setBulkDeleteMode("appointment")}
                    style={{ padding: "14px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", textAlign: "left", cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.background = "#fffbeb"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>🗑️ Cancel Appointments Only</div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>Marks all selected appointments as cancelled and frees their slots. Patient records remain intact.</div>
                  </button>
                  <button onClick={() => setBulkDeleteMode("complete")}
                    style={{ padding: "14px 16px", borderRadius: 10, border: "1.5px solid #fee2e2", background: "#fff5f5", textAlign: "left", cursor: "pointer", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#fee2e2"; e.currentTarget.style.background = "#fff5f5"; }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>⚠️ Delete Complete Patient History</div>
                    <div style={{ fontSize: 11, color: "#991b1b", lineHeight: 1.4 }}><strong>PERMANENT:</strong> Deletes each patient record along with all their appointments, prescriptions, bills, payments, procedures, visits, and follow-ups. This cannot be undone!</div>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: bulkDeleteMode === "complete" ? "#fef2f2" : "#f0fdf4", border: `1.5px solid ${bulkDeleteMode === "complete" ? "#fecaca" : "#bbf7d0"}`, borderRadius: 10, padding: 14, marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: bulkDeleteMode === "complete" ? "#991b1b" : "#166534", marginBottom: 6 }}>
                  {bulkDeleteMode === "complete" ? `⚠️ Complete Deletion — ${selectedIds.size} patient(s)` : `✓ Cancel ${selectedIds.size} Appointment(s)`}
                </div>
                <div style={{ fontSize: 11, color: bulkDeleteMode === "complete" ? "#991b1b" : "#166534", lineHeight: 1.4 }}>
                  {bulkDeleteMode === "complete"
                    ? "This will permanently delete each patient and ALL their related records. This cannot be undone."
                    : "Selected appointments will be marked as cancelled and their slots freed. Patient records stay intact."}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { if (bulkDeleteMode) setBulkDeleteMode(null); else { setShowBulkConfirm(false); setBulkDeleteMode(null); } }} disabled={bulkDeleting}
                style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: bulkDeleting ? "not-allowed" : "pointer", opacity: bulkDeleting ? .5 : 1 }}>
                {bulkDeleteMode ? "Back" : "Cancel"}
              </button>
              {bulkDeleteMode && (
                <button onClick={handleBulkDelete} disabled={bulkDeleting}
                  style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: bulkDeleteMode === "complete" ? "#dc2626" : "#f59e0b", color: "#fff", fontSize: 13, fontWeight: 700, cursor: bulkDeleting ? "not-allowed" : "pointer", opacity: bulkDeleting ? .7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {bulkDeleting && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
                  {bulkDeleting ? "Processing..." : (bulkDeleteMode === "complete" ? `Delete ${selectedIds.size} Patient(s)` : `Cancel ${selectedIds.size} Appointment(s)`)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS BAR
// ─────────────────────────────────────────────────────────────────────────────
function StatsBar() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    api("/api/appointments?stats=true").then(a => setStats(a.data || {}));
  }, []);

  if (!stats) return null;
  const remaining = Math.max(0, (stats.today || 0) - (stats.completed || 0));
  const items = [
    { label: "Today's Appointments", value: stats.today ?? 0,     color: "#0E898F", iconBg: "#E6F4F4", Icon: CalendarCheck },
    { label: "Completed",            value: stats.completed ?? 0,  color: "#0E898F", iconBg: "#E6F4F4", Icon: CheckCircle },
    { label: "Remaining",            value: remaining,              color: "#d97706", iconBg: "#fffbeb", Icon: Clock },
    { label: "Total Appointments",   value: stats.total ?? 0,       color: "#7c3aed", iconBg: "#f5f3ff", Icon: ClipboardList },
    { label: "Cancelled",            value: stats.cancelled ?? 0,   color: "#ef4444", iconBg: "#fff5f5", Icon: XCircle },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
      {items.map(i => {
        const Icon = i.Icon;
        return (
          <div key={i.label} style={{ background: "linear-gradient(135deg, #ffffff, #f8fafc)", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: i.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} color={i.color} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>{i.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: i.color, lineHeight: 1 }}>{i.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING WIZARD — Streamlined 4-step appointment booking
// ─────────────────────────────────────────────────────────────────────────────
type WizardStep = 1 | 2 | 3 | 4;

export function BookingWizard({ onSuccess, onClose, initialPatient }: { onSuccess: (name: string) => void; onClose: () => void; initialPatient?: { id: string; patientId: string; name: string; phone: string; email?: string; gender?: string } | null }) {
  const [step, setStep] = useState<WizardStep>(initialPatient ? 2 : 1);
  const [patient, setPatient] = useState<Patient | null>(initialPatient ? { id: initialPatient.id, patientId: initialPatient.patientId, name: initialPatient.name, phone: initialPatient.phone, email: initialPatient.email, gender: initialPatient.gender } : null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [type, setType] = useState("OPD");
  const [notes, setNotes] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", phone: "", whatsapp: "", email: "", gender: "" });
  const [registerSaving, setRegisterSaving] = useState(false);
  const [registerMsg, setRegisterMsg] = useState("");
  const [dupPatient, setDupPatient] = useState<{ id: string; patientId: string; name: string; phone: string; email?: string; matchedBy?: "phone" | "email" } | null>(null);
  const [checkingDup, setCheckingDup] = useState(false);
  const [forceNewPatient, setForceNewPatient] = useState(false);
  const [subDepts, setSubDepts] = useState<SubDepartment[]>([]);
  const [selectedSubDeptId, setSelectedSubDeptId] = useState("");
  const [loadingSubDepts, setLoadingSubDepts] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    api("/api/patients?limit=6&sortBy=createdAt&sortOrder=desc").then(d => setRecentPatients(d.data?.data || d.data || []));
    api("/api/config/departments?simple=true").then(d => {
      const BOOKING_TYPES = ["CLINICAL", "DIAGNOSTIC"];
      setDepartments((d.data || []).filter((dp: Department) => BOOKING_TYPES.includes(dp.type || "")));
    });
  }, []);

  useEffect(() => {
    const url = deptFilter ? `/api/config/doctors?simple=true&departmentId=${deptFilter}` : `/api/config/doctors?simple=true`;
    api(url).then(d => setDoctors(d.data || []));
  }, [deptFilter]);

  const selectedDeptObj = departments.find(d => d.id === deptFilter);
  const isDiagnosticDept = selectedDeptObj?.type === "DIAGNOSTIC";

  useEffect(() => {
    if (!isDiagnosticDept || !deptFilter) { setSubDepts([]); setSelectedSubDeptId(""); return; }
    setLoadingSubDepts(true);
    api(`/api/config/subdepartments?departmentId=${deptFilter}&limit=100`)
      .then(d => setSubDepts(d.data?.data || d.data || []))
      .finally(() => setLoadingSubDepts(false));
  }, [deptFilter, isDiagnosticDept]);

  useEffect(() => {
    if (!doctor?.id || !appointmentDate) { setSlots([]); return; }
    setLoadingSlots(true);
    api(`/api/appointments/slots?doctorId=${doctor.id}&date=${appointmentDate}`)
      .then(d => { setSlots(d.data?.slots || []); setBookedSlots(d.data?.bookedSlots || []); })
      .finally(() => setLoadingSlots(false));
  }, [doctor?.id, appointmentDate]);

  const checkDup = async ({ phone, email }: { phone?: string; email?: string }) => {
    if (!phone && !email) return;
    if (phone && phone.trim().length < 7) return;
    setCheckingDup(true);
    try {
      const params = new URLSearchParams();
      if (phone) params.set("phone", phone.trim());
      if (email) params.set("email", email.trim());
      const r = await fetch(`/api/public/booking/check-patient?${params}`, { credentials: "include" });
      const d = await r.json();
      if (d.data?.id) { setDupPatient(d.data); setForceNewPatient(false); }
    } catch {}
    finally { setCheckingDup(false); }
  };

  const searchPatients = useCallback((val: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!val.trim()) { setSearchResults([]); return; }
    debounce.current = setTimeout(async () => {
      setSearchLoading(true);
      const d = await api(`/api/patients?q=${encodeURIComponent(val)}`);
      setSearchResults(d.data || []);
      setSearchLoading(false);
    }, 300);
  }, []);

  const groupSlots = (allSlots: string[]) => {
    const morning: string[] = [], afternoon: string[] = [], evening: string[] = [];
    allSlots.forEach(s => {
      const h = parseInt(s.split(":")[0]);
      if (h < 12) morning.push(s);
      else if (h < 17) afternoon.push(s);
      else evening.push(s);
    });
    return { morning, afternoon, evening };
  };

  const isSlotPassed = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return false;
    const [y, m, d] = dateStr.split("-").map(Number);
    const [h, min] = timeStr.split(":").map(Number);
    return new Date(y, m - 1, d, h, min) < new Date();
  };

  const today = toLocalDateStr(new Date());
  const tmrwDate2 = new Date(); tmrwDate2.setDate(tmrwDate2.getDate() + 1);
  const tmrw = toLocalDateStr(tmrwDate2);

  const selectPatient = (p: Patient) => { setPatient(p); setStep(2); setMsg(""); };
  const selectDoctor = (d: Doctor) => {
    setDoctor(d);
    setConsultationFee(d.consultationFee ? String(d.consultationFee) : "");
    if (!deptFilter && d.departmentId) setDeptFilter(d.departmentId);
    setStep(3);
    if (!appointmentDate) setAppointmentDate(today);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setRegisterSaving(true); setRegisterMsg("");
    if (newForm.name.trim().length < 2) { setRegisterMsg("Name required (min 2 chars)"); setRegisterSaving(false); return; }
    if (newForm.phone.trim().length < 7) { setRegisterMsg("Valid phone required"); setRegisterSaving(false); return; }
    const payload: any = { name: newForm.name.trim(), phone: newForm.phone.trim(), forceNew: forceNewPatient };
    if (newForm.whatsapp.trim()) payload.whatsapp = newForm.whatsapp.trim();
    if (newForm.email.trim()) payload.email = newForm.email.trim();
    if (newForm.gender) payload.gender = newForm.gender;
    const d = await api("/api/patients", "POST", payload);
    if (d.success) {
      if (d.data.isNew || forceNewPatient) {
        selectPatient(d.data.patient);
        setShowNewPatient(false);
        setNewForm({ name: "", phone: "", whatsapp: "", email: "", gender: "" });
        setForceNewPatient(false);
      } else {
        setDupPatient({ ...d.data.patient, matchedBy: "phone" });
      }
    } else setRegisterMsg(d.message || "Error");
    setRegisterSaving(false);
  };

  const handleBook = async () => {
    if (!patient || (!doctor && !selectedSubDeptId) || !appointmentDate) return;
    if (doctor && !timeSlot) return;
    setSaving(true); setMsg("");
    if (timeSlot) {
      const [y, m, d] = appointmentDate.split("-").map(Number);
      const [h, min] = timeSlot.split(":").map(Number);
      if (new Date(y, m - 1, d, h, min) < new Date()) { setMsg("Selected time has passed"); setSaving(false); return; }
    }
    const payload: any = { patientId: patient.id, doctorId: doctor?.id || null, appointmentDate, timeSlot: timeSlot || null, type, notes: notes || null };
    if (deptFilter) payload.departmentId = deptFilter;
    if (selectedSubDeptId) payload.subDepartmentId = selectedSubDeptId;
    if (consultationFee) payload.consultationFee = parseFloat(consultationFee);
    const res = await api("/api/appointments", "POST", payload);
    if (res.success) { onSuccess(patient.name); reset(); }
    else setMsg(res.message || "Failed to book");
    setSaving(false);
  };

  const reset = () => {
    setStep(1); setPatient(null); setDoctor(null); setDeptFilter("");
    setAppointmentDate(""); setTimeSlot(""); setType("OPD");
    setNotes(""); setConsultationFee(""); setMsg("");
    setShowNewPatient(false); setSearchQ(""); setSearchResults([]);
    setDupPatient(null); setRegisterMsg(""); setForceNewPatient(false);
    setNewForm({ name: "", phone: "", whatsapp: "", email: "", gender: "" });
    setSelectedSubDeptId(""); setSubDepts([]);
  };

  const grouped = groupSlots(slots);

  const STEPS = [
    { num: 1, label: "Patient", icon: User },
    { num: 2, label: "Doctor", icon: Stethoscope },
    { num: 3, label: "Schedule", icon: Calendar },
    { num: 4, label: "Confirm", icon: CheckCircle },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(14,137,143,.08)", backdropFilter: "blur(2px)", animation: "fadeIn .2s ease" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,.18)", width: "90%", maxWidth: 720, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#E6F4F4", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #B3E0E0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={15} color="#0E898F" />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#0E898F" }}>Quick Book Appointment</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {step > 1 && (
            <button onClick={reset} style={{ background: "#fff", border: "1px solid #B3E0E0", borderRadius: 8, padding: "6px 14px", color: "#0E898F", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <RefreshCw size={11} />Start Over
            </button>
          )}
          <button onClick={onClose} style={{ background: "#fff", border: "1px solid #B3E0E0", borderRadius: 8, padding: "6px 10px", color: "#0E898F", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <button onClick={() => { if (isDone) setStep(s.num as WizardStep); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, border: isActive ? "1.5px solid #0E898F" : isDone ? "1.5px solid #10b981" : "1.5px solid transparent", background: isActive ? "#E6F4F4" : isDone ? "#f0fdf4" : "transparent", cursor: isDone ? "pointer" : "default", transition: "all .15s" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? "#0E898F" : isDone ? "#10b981" : "#e2e8f0", color: isActive || isDone ? "#fff" : "#94a3b8", fontSize: 10, fontWeight: 800 }}>
                  {isDone ? <CheckCircle size={10} /> : <Icon size={10} />}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? "#0E898F" : isDone ? "#10b981" : "#94a3b8", whiteSpace: "nowrap" }}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: isDone ? "#10b981" : "#e2e8f0", margin: "0 6px", borderRadius: 1 }} />}
            </div>
          );
        })}
      </div>

      <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>
        {/* ── STEP 1: Patient ── */}
        {step === 1 && (
          <div>
            {recentPatients.length > 0 && !showNewPatient && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                  Recent Patients — Quick Select
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10 }}>
                  {recentPatients.slice(0, 6).map(p => (
                    <button key={p.id} onClick={() => selectPatient(p)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", transition: "all .15s", textAlign: "left" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#0E898F"; e.currentTarget.style.background = "#E6F4F4"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.patientId} · {p.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showNewPatient && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Search Patient</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "8px 12px" }}>
                      <Search size={13} color="#94a3b8" />
                      <input style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "#334155", flex: 1 }}
                        placeholder="Search by name, phone, or Patient ID..." autoFocus
                        value={searchQ} onChange={e => { setSearchQ(e.target.value); searchPatients(e.target.value); }} />
                      {searchLoading && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} color="#94a3b8" />}
                      {searchQ && <button onClick={() => { setSearchQ(""); setSearchResults([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 0 }}><X size={13} /></button>}
                    </div>
                    {searchResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 260, overflowY: "auto", marginTop: 4 }}>
                        <div style={{ padding: "6px 14px 2px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                          {searchResults.length} found — click to select
                        </div>
                        {searchResults.map(p => (
                          <button key={p.id} onClick={() => { selectPatient(p); setSearchResults([]); setSearchQ(""); }}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f1f5f9" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{p.name.charAt(0).toUpperCase()}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.patientId} · {p.phone}{p.email ? ` · ${p.email}` : ""}</div>
                            </div>
                            <ChevronRight size={13} color="#cbd5e1" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowNewPatient(true)}
                    style={{ padding: "8px 14px", borderRadius: 9, border: "1.5px dashed #0E898F", background: "#E6F4F4", color: "#0A6B70", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                    <Plus size={12} />New Patient
                  </button>
                </div>
              </div>
            )}

            {showNewPatient && (
              <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Quick Register</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Minimal info to get started. Full details can be added later.</div>
                  </div>
                  <button onClick={() => { setShowNewPatient(false); setDupPatient(null); setRegisterMsg(""); }}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={13} /></button>
                </div>
                {dupPatient && !forceNewPatient && (
                  <div style={{ background: "#fffbeb", border: "1.5px solid #f59e0b", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                      {dupPatient.matchedBy === "email" ? "Email already registered" : "Mobile already registered"}
                    </div>
                    <div style={{ fontSize: 12, color: "#78350f", marginBottom: 10 }}>
                      This {dupPatient.matchedBy === "email" ? "email" : "mobile number"} is linked to{" "}
                      <strong>{dupPatient.name}</strong> ({dupPatient.patientId}).
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 9, padding: "9px 12px", border: "1px solid #fde68a", marginBottom: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>{dupPatient.name.charAt(0)}</div>
                      <div><div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{dupPatient.name}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{dupPatient.patientId} · {dupPatient.phone}</div></div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => { selectPatient(dupPatient as any); setShowNewPatient(false); setDupPatient(null); }}
                        style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Book for {dupPatient.name}</button>
                      <button type="button" onClick={() => { setForceNewPatient(true); setDupPatient(null); }}
                        style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #d97706", background: "transparent", color: "#92400e", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Register as new patient</button>
                    </div>
                  </div>
                )}
                {forceNewPatient && (
                  <div style={{ background: "#eff6ff", border: "1.5px solid #60a5fa", borderRadius: 10, padding: "9px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <User size={13} color="#2563eb" />
                    <span style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>Registering as a new patient profile</span>
                    <button type="button" onClick={() => setForceNewPatient(false)}
                      style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 11, color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}>Change</button>
                  </div>
                )}
                <form onSubmit={handleRegister} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Full Name *</label>
                    <input required style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#1e293b", outline: "none" }}
                      placeholder="e.g. Rahul Sharma" value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Phone *</label>
                    <input required style={{ background: "#fff", border: `1.5px solid ${(dupPatient && !forceNewPatient) ? "#fde68a" : "#e2e8f0"}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#1e293b", outline: "none" }}
                      placeholder="e.g. 9876543210" value={newForm.phone}
                      onChange={e => { setNewForm(p => ({ ...p, phone: e.target.value })); setDupPatient(null); setForceNewPatient(false); }}
                      onBlur={e => checkDup({ phone: e.target.value })} />
                    {checkingDup && <span style={{ fontSize: 10, color: "#0E898F", marginTop: 2 }}>Checking...</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Email</label>
                    <input type="email" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#1e293b", outline: "none" }}
                      placeholder="Optional" value={newForm.email}
                      onChange={e => { setNewForm(p => ({ ...p, email: e.target.value })); setDupPatient(null); setForceNewPatient(false); }}
                      onBlur={e => { if (!dupPatient && e.target.value.trim()) checkDup({ phone: newForm.phone, email: e.target.value }); }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>WhatsApp <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span></label>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 10px" }}>
                      <MessageCircle size={13} color="#25D366" />
                      <input type="tel" style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "#1e293b", padding: "7px 0", flex: 1 }}
                        placeholder="e.g. 9876543210" value={newForm.whatsapp} onChange={e => setNewForm(p => ({ ...p, whatsapp: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Gender</label>
                    <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#1e293b", outline: "none" }}
                      value={newForm.gender} onChange={e => setNewForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select...</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                    </select>
                  </div>
                  {registerMsg && <div style={{ gridColumn: "1/-1", fontSize: 12, color: "#ef4444", fontWeight: 600, background: "#fff5f5", padding: "8px 12px", borderRadius: 8, border: "1px solid #fecaca" }}><AlertCircle size={12} style={{ display: "inline", marginRight: 5 }} />{registerMsg}</div>}
                  <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, marginTop: 2 }}>
                    <button type="submit" disabled={registerSaving || (!!dupPatient && !forceNewPatient)}
                      style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: (registerSaving || (dupPatient && !forceNewPatient)) ? "#e2e8f0" : "#0E898F", color: (registerSaving || (dupPatient && !forceNewPatient)) ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700, cursor: (registerSaving || (dupPatient && !forceNewPatient)) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      {registerSaving && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}Register & Continue
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Doctor ── */}
        {step === 2 && (
          <div>
            <div style={{ background: "linear-gradient(135deg,#0ea5e9,#0369a1)", borderRadius: 9, padding: "8px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>{patient!.name.charAt(0)}</div>
              <div><div style={{ fontWeight: 700, color: "#fff", fontSize: 12 }}>{patient!.name}</div><div style={{ fontSize: 10, color: "#bae6fd" }}>{patient!.patientId} · {patient!.phone}</div></div>
              <button onClick={() => setStep(1)} style={{ marginLeft: "auto", background: "rgba(255,255,255,.2)", border: "none", borderRadius: 7, padding: "5px 12px", cursor: "pointer", color: "#fff", fontSize: 11, fontWeight: 600 }}>Change</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Filter by Dept:</span>
              <button onClick={() => setDeptFilter("")}
                style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${!deptFilter ? "#0E898F" : "#e2e8f0"}`, background: !deptFilter ? "#E6F4F4" : "#fff", color: !deptFilter ? "#0E898F" : "#64748b", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .1s" }}>All</button>
              {departments.map(dp => (
                <button key={dp.id} onClick={() => setDeptFilter(dp.id)}
                  style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${deptFilter === dp.id ? "#0E898F" : "#e2e8f0"}`, background: deptFilter === dp.id ? "#E6F4F4" : "#fff", color: deptFilter === dp.id ? "#0E898F" : "#64748b", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .1s" }}>{dp.name}</button>
              ))}
            </div>

            {isDiagnosticDept && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Building2 size={12} />Select Diagnostic Unit
                </div>
                {loadingSubDepts ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 12 }}><Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />Loading units...</div>
                ) : subDepts.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>No diagnostic units configured for this department.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {subDepts.map(sd => (
                      <button key={sd.id} type="button" onClick={() => { setSelectedSubDeptId(sd.id); setDoctor(null); setStep(3); if (!appointmentDate) setAppointmentDate(today); }}
                        style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${selectedSubDeptId === sd.id ? "#059669" : "#e2e8f0"}`, background: selectedSubDeptId === sd.id ? "#f0fdf4" : "#fff", color: selectedSubDeptId === sd.id ? "#059669" : "#334155", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .12s", display: "flex", alignItems: "center", gap: 6 }}>
                        <Building2 size={12} />{sd.name}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 12, fontSize: 11, color: "#64748b" }}>Select a unit above to proceed. Doctor selection is optional for diagnostic appointments.</div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
              {doctors.map(d => (
                <button key={d.id} onClick={() => selectDoctor(d)}
                  style={{ textAlign: "left", padding: 12, borderRadius: 11, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", transition: "all .15s", display: "flex", flexDirection: "column", gap: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#0E898F"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(14,137,143,.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#0E898F,#0A6B70)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>{d.name.charAt(0)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{d.specialization || d.department?.name || "General"}</div>
                    </div>
                  </div>
                  {d.consultationFee != null && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0A6B70", background: "#E6F4F4", padding: "2px 8px", borderRadius: 5, width: "fit-content" }}>₹{d.consultationFee}</div>
                  )}
                </button>
              ))}
              {doctors.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  <Stethoscope size={28} style={{ marginBottom: 8, opacity: .4 }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>No doctors found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try changing the department filter</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Schedule ── */}
        {step === 3 && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 9, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                <User size={12} color="#0369a1" /><span style={{ fontSize: 12, fontWeight: 600, color: "#0369a1" }}>{patient!.name}</span>
                <button onClick={() => setStep(1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#93c5fd", display: "flex", padding: 0 }}><Edit size={10} /></button>
              </div>
              {doctor && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 9, background: "#E6F4F4", border: "1px solid #B3E0E0" }}>
                  <Stethoscope size={12} color="#0A6B70" /><span style={{ fontSize: 12, fontWeight: 600, color: "#0A6B70" }}>{doctor.name}</span>
                  <button onClick={() => setStep(2)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6ee7b7", display: "flex", padding: 0 }}><Edit size={10} /></button>
                </div>
              )}
              {selectedSubDeptId && !doctor && (() => {
                const sd = subDepts.find(s => s.id === selectedSubDeptId);
                return sd ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 9, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <Building2 size={12} color="#059669" /><span style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>{sd.name}</span>
                    <button onClick={() => setStep(2)} style={{ background: "none", border: "none", cursor: "pointer", color: "#86efac", display: "flex", padding: 0 }}><Edit size={10} /></button>
                  </div>
                ) : null;
              })()}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Select Date</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => { setAppointmentDate(today); setTimeSlot(""); }}
                  style={{ padding: "8px 20px", borderRadius: 9, border: `1.5px solid ${appointmentDate === today ? "#0E898F" : "#e2e8f0"}`, background: appointmentDate === today ? "#0E898F" : "#fff", color: appointmentDate === today ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .12s" }}>Today</button>
                <button onClick={() => { setAppointmentDate(tmrw); setTimeSlot(""); }}
                  style={{ padding: "8px 20px", borderRadius: 9, border: `1.5px solid ${appointmentDate === tmrw ? "#0E898F" : "#e2e8f0"}`, background: appointmentDate === tmrw ? "#0E898F" : "#fff", color: appointmentDate === tmrw ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .12s" }}>Tomorrow</button>
                <input type="date" min={today} value={appointmentDate}
                  onChange={e => { setAppointmentDate(e.target.value); setTimeSlot(""); }}
                  style={{ padding: "8px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#334155", outline: "none" }} />
              </div>
            </div>

            {appointmentDate && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
                  Available Slots {loadingSlots && <Loader2 size={11} style={{ marginLeft: 6, animation: "spin .7s linear infinite", display: "inline-block" }} />}
                </div>
                {loadingSlots ? (
                  <div style={{ padding: "30px 0", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                    <Loader2 size={20} style={{ animation: "spin .7s linear infinite", marginBottom: 8 }} /><br />Loading available time slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div style={{ padding: "16px", background: "#fff5f5", borderRadius: 10, border: "1px solid #fecaca", color: "#ef4444", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={15} />No available slots. Doctor may be unavailable or fully booked for this date.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { label: "Morning", icon: Sun, slots: grouped.morning, color: "#f59e0b", bg: "#fffbeb" },
                      { label: "Afternoon", icon: Sun, slots: grouped.afternoon, color: "#f97316", bg: "#fff7ed" },
                      { label: "Evening", icon: Sunset, slots: grouped.evening, color: "#8b5cf6", bg: "#f5f3ff" },
                    ].filter(g => g.slots.length > 0).map(group => {
                      const GIcon = group.icon;
                      const availCount = group.slots.filter(s => !bookedSlots.includes(s) && !isSlotPassed(appointmentDate, s)).length;
                      return (
                        <div key={group.label}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: 6, background: group.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <GIcon size={12} color={group.color} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: group.color }}>{group.label}</span>
                            <span style={{ fontSize: 11, color: "#cbd5e1" }}>({availCount} available)</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {group.slots.map(slot => {
                              const isBooked = bookedSlots.includes(slot);
                              const isPast = isSlotPassed(appointmentDate, slot);
                              const disabled = isBooked || isPast;
                              const selected = timeSlot === slot;
                              return (
                                <button key={slot} disabled={disabled}
                                  onClick={() => { setTimeSlot(slot); setStep(4); }}
                                  title={isPast ? "Time has passed" : isBooked ? "Already booked" : `Select ${fmt12(slot)}`}
                                  style={{
                                    padding: "6px 12px", borderRadius: 8,
                                    border: `1.5px solid ${selected ? "#0E898F" : disabled ? "#f1f5f9" : "#e2e8f0"}`,
                                    background: selected ? "#0E898F" : disabled ? "#f8fafc" : "#fff",
                                    color: selected ? "#fff" : disabled ? "#cbd5e1" : "#334155",
                                    fontSize: 11, fontWeight: selected ? 700 : 500,
                                    cursor: disabled ? "not-allowed" : "pointer",
                                    textDecoration: disabled ? "line-through" : "none",
                                    transition: "all .12s",
                                  }}>
                                  {fmt12(slot)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: Confirm ── */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", marginBottom: 14 }}>Review & Confirm</div>

            <div style={{ background: "linear-gradient(135deg,#f8fafc,#f0f9ff)", borderRadius: 12, padding: 16, border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Patient</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{patient!.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{doctor ? "Doctor" : "Diagnostic Unit"}</div>
                  {doctor ? (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{doctor.name}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{doctor.specialization || doctor.department?.name || "—"}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{subDepts.find(s => s.id === selectedSubDeptId)?.name || "—"}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Direct Diagnostic Appointment</div>
                    </>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Date & Time</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0E898F" }}>
                    {appointmentDate === today ? "Today" : appointmentDate === tmrw ? "Tomorrow" : new Date(appointmentDate + "T00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {" · "}{fmt12(timeSlot)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Consultation Fee</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{consultationFee ? `₹${consultationFee}` : "As per doctor"}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Appointment Type</label>
                <select style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#1e293b", outline: "none" }}
                  value={type} onChange={e => setType(e.target.value)}>
                  <option value="OPD">OPD</option><option value="FOLLOW_UP">Follow-up</option><option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Fee Override (₹)</label>
                <input type="number" min="0" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#1e293b", outline: "none" }}
                  placeholder={doctor?.consultationFee?.toString() || "0"} value={consultationFee} onChange={e => setConsultationFee(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>Chief Complaint / Notes</label>
                <input style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#1e293b", outline: "none" }}
                  placeholder="e.g. Fever, headache..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            {msg && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ef4444", fontWeight: 600, background: "#fff5f5", padding: "10px 14px", borderRadius: 9, border: "1px solid #fecaca", marginBottom: 14 }}>
                <AlertCircle size={14} />{msg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
              <button onClick={() => setStep(3)}
                style={{ padding: "9px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <ArrowLeft size={13} />Back
              </button>
              <button onClick={handleBook} disabled={saving}
                style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: saving ? "#94a3b8" : "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all .15s" }}>
                {saving ? <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> : <CalendarCheck size={13} />}
                {saving ? "Booking..." : "Confirm & Book Appointment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────────────────────
export default function AppointmentPanel({ onViewPatient, openTrigger, onResetTrigger }: { onViewPatient?: (id: string) => void; openTrigger?: number; onResetTrigger?: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (openTrigger && openTrigger > 0) {
      setShowModal(true);
      onResetTrigger?.();
    }
  }, [openTrigger, onResetTrigger]);

  const handleBookingSuccess = (name: string) => {
    setShowModal(false);
    setRefreshKey(k => k + 1);
    setSuccessMsg(`Appointment booked successfully for ${name}`);
    setTimeout(() => setSuccessMsg(""), 6000);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <StatsBar />

      {successMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "12px 18px", marginBottom: 16, animation: "fadeIn .3s ease" }}>
          <CheckCircle size={18} color="#059669" />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#166534" }}>{successMsg}</div>
          <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#86efac", display: "flex" }}><X size={14} /></button>
        </div>
      )}

      {/* Book Appointment Trigger Button */}
      <button onClick={() => setShowModal(true)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderRadius: 14, border: "1.5px dashed #0E898F", background: "#E6F4F4", cursor: "pointer", transition: "all .15s", marginBottom: 24 }}
        onMouseEnter={e => { e.currentTarget.style.background = "#D4EDED"; e.currentTarget.style.borderColor = "#0A6B70"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#E6F4F4"; e.currentTarget.style.borderColor = "#0E898F"; }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg,#0E898F,#0A6B70)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(14,137,143,.25)" }}>
          <Plus size={20} color="#fff" />
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0A6B70" }}>Book New Appointment</div>
          <div style={{ fontSize: 12, color: "#0E898F", opacity: .7 }}>Click to open the quick booking wizard</div>
        </div>
        <ChevronRight size={18} color="#0E898F" style={{ marginLeft: "auto", opacity: .5 }} />
      </button>

      {/* Booking Modal */}
      {showModal && <BookingWizard onSuccess={handleBookingSuccess} onClose={() => setShowModal(false)} />}

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <ClipboardList size={18} color="#0E898F" />Appointments
        </div>
        <AppointmentTable onRefresh={refreshKey} onViewPatient={(id) => onViewPatient?.(id)} />
      </div>
    </div>
  );
}
