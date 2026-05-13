"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, ChevronDown, Search, Loader2, User, Phone, Mail,
  AlertCircle, Building2, Stethoscope, CalendarDays, Clock,
  FileText, IndianRupee, Sparkles, ArrowRight, ArrowLeft,
  CalendarCheck, Heart, CalendarPlus, MessageCircle,
} from "lucide-react";
import styles from "./AppointmentModal.module.css";

interface Doctor { id: string; name: string; specialization?: string; departmentId?: string; department?: { name: string }; consultationFee?: number; }
interface Department { id: string; name: string; code: string; type?: string; }
interface AppointmentModalProps { isOpen: boolean; onClose: () => void; }

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmt12 = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const fmtDate = (v: string) => {
  if (!v) return "";
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

/* ─── Validation helpers ─── */
const INVALID_PHONES = new Set(["1234567890", "9876543210", "0123456789", "1234554321", "0000000000"]);

const validatePhone = (val: string, required = true): string => {
  const digits = val.replace(/\D/g, "");
  if (!digits) return required ? "Phone number is required" : "";
  if (digits.length !== 10) return "Phone number must be exactly 10 digits";
  if (!/^[6-9]/.test(digits)) return "Must start with 6, 7, 8 or 9 (Indian mobile)";
  if (/^(\d)\1{9}$/.test(digits)) return "Enter a valid phone number";
  if (INVALID_PHONES.has(digits)) return "Enter a valid phone number";
  return "";
};

const validateWhatsApp = (val: string): string => {
  if (!val.trim()) return ""; // optional
  return validatePhone(val, false) || validatePhone(val, true).replace("is required", "is invalid");
};

const validateEmail = (val: string): string => {
  if (!val.trim()) return "Email address is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim())) return "Enter a valid email (e.g. john@example.com)";
  return "";
};

const isSlotPassed = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0) < new Date();
};

/* ─── Searchable Dropdown ─── */
function SearchableSelect({ options, value, onChange, placeholder, icon: Icon, error, renderOption, isLoading }: {
  options: { id: string; label: string; sub?: string }[];
  value: string; onChange: (v: string) => void; placeholder: string;
  icon: React.ElementType; error?: string; isLoading?: boolean;
  renderOption?: (o: { id: string; label: string; sub?: string }, selected: boolean) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);
  const filtered = search ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) || (o.sub || "").toLowerCase().includes(search.toLowerCase())) : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(o => !o);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div ref={triggerRef} onClick={openDropdown} className={`${styles.inputWrap} ${styles.customSelect} ${error ? styles.fieldError : ""}`}
        style={{ cursor: "pointer", borderColor: open ? "var(--primary)" : error ? "var(--error)" : undefined, boxShadow: open ? "0 0 0 3px var(--primary-100)" : undefined }}>
        <span className={styles.fieldIconWrap}><Icon size={15} /></span>
        <span className={styles.selectValue} style={{ color: selected ? "var(--gray-800)" : "var(--gray-400)" }}>
          {selected ? selected.label : isLoading ? "Loading..." : placeholder}
        </span>
        {isLoading ? <Loader2 size={14} style={{ color: "var(--primary)", animation: "spin 1s linear infinite", flexShrink: 0 }} /> : <ChevronDown size={15} className={`${styles.selectChevron} ${open ? styles.selectChevronOpen : ""}`} />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div ref={panelRef} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 99999 }} className={styles.dropdownPanel}>
            <div style={{ padding: "6px 8px 4px", borderBottom: "1px solid var(--gray-100)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 8, background: "var(--gray-50)" }}>
                <Search size={13} style={{ color: "var(--gray-400)", flexShrink: 0 }} />
                <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "var(--gray-700)", width: "100%", padding: "2px 0" }} />
              </div>
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto", padding: 4 }}>
              {isLoading && <div style={{ padding: "12px 8px", fontSize: 12, color: "var(--primary)", textAlign: "center" }}>Loading...</div>}
              {!isLoading && filtered.length === 0 && <div style={{ padding: "12px 8px", fontSize: 12, color: "var(--gray-400)", textAlign: "center" }}>No results found</div>}
              {filtered.map(o => {
                const isSel = o.id === value;
                return (
                  <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                    className={`${styles.dropdownOption} ${isSel ? styles.dropdownOptionSelected : ""}`}>
                    {renderOption ? renderOption(o, isSel) : (
                      <>
                        <div className={styles.optionIcon}><Icon size={14} /></div>
                        <div className={styles.optionLabel}>
                          <span>{o.label}</span>
                          {o.sub && <span className={styles.optionDesc}>{o.sub}</span>}
                        </div>
                        {isSel && <Check size={14} className={styles.optionCheck} />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Step Indicator ─── */
const STEPS = [
  { num: 1, label: "Patient Info", icon: User },
  { num: 2, label: "Appointment", icon: CalendarDays },
  { num: 3, label: "Confirmed", icon: Check },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className={styles.stepper}>
      {STEPS.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        return (
          <div key={s.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div className={`${styles.stepItem} ${done ? styles.stepActive : ""} ${active ? styles.stepCurrent : ""}`}>
              <div className={styles.stepCircle}>
                {done ? <Check size={15} /> : <s.icon size={15} />}
              </div>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function AppointmentModal({ isOpen, onClose }: AppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [hospitalId, setHospitalId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [apiError, setApiError] = useState("");
  const [dupPatient, setDupPatient] = useState<{ id: string; name: string; phone: string; patientId: string; matchedBy?: "phone" | "email" } | null>(null);
  const [bookMode, setBookMode] = useState<"ask" | "existing" | "new" | null>(null);
  const [checkingDup, setCheckingDup] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", whatsapp: "", email: "",
    departmentId: "", doctorId: "", appointmentDate: "", timeSlot: "",
    notes: "", consultationFee: "", type: "OPD",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookedInfo, setBookedInfo] = useState<{ doctor: string; department: string; date: string; time: string; email: string; token?: number } | null>(null);

  const todayStr = toLocalDateStr(new Date());
  const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tmrw);

  const selectedDept = departments.find(d => d.id === form.departmentId);
  const isDiagnostic = selectedDept?.type === "DIAGNOSTIC";
  const filteredDoctors = form.departmentId
    ? allDoctors.filter(d => d.departmentId === form.departmentId)
    : allDoctors;
  const selectedDoctor = allDoctors.find(d => d.id === form.doctorId);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setForm({ name: "", phone: "", whatsapp: "", email: "", departmentId: "", doctorId: "", appointmentDate: "", timeSlot: "", notes: "", consultationFee: "", type: "OPD" });
        setErrors({}); setIsSuccess(false); setBookedInfo(null);
        setDupPatient(null); setBookMode(null);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoadingDepts(true);
      setApiError("");
      fetch("/api/public/booking", { credentials: "include" })
        .then(async r => {
          const d = await r.json();
          if (!r.ok) {
            setApiError(d?.message || d?.error || `Server error ${r.status}: Could not load booking info`);
            setDepartments([]);
            return;
          }
          if (d.data?.hospital?.id) setHospitalId(d.data.hospital.id);
          setDepartments(d.data?.departments || []);
          if ((d.data?.departments || []).length === 0) {
            setApiError("No active departments found. Please contact the hospital to configure departments.");
          }
        })
        .catch(e => { setDepartments([]); setApiError("Network error: Could not reach server. " + (e?.message || "")); })
        .finally(() => setLoadingDepts(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && hospitalId) {
      fetch(`/api/public/booking/doctors?hid=${hospitalId}`, { credentials: "include" })
        .then(async r => {
          const d = await r.json();
          if (!r.ok) {
            setApiError(prev => prev || d?.message || `Could not load doctors (${r.status})`);
            setAllDoctors([]);
            return;
          }
          setAllDoctors(d.data || []);
        })
        .catch(() => setAllDoctors([]));
    }
  }, [isOpen, hospitalId]);

  useEffect(() => {
    if (!form.doctorId || !form.appointmentDate || !hospitalId) { setSlots([]); setBookedSlots([]); return; }
    setLoadingSlots(true);
    fetch(`/api/public/booking/slots?hid=${hospitalId}&doctorId=${form.doctorId}&date=${form.appointmentDate}`, { credentials: "include" })
      .then(r => r.json()).then(d => { setSlots(d.data?.allSlots || d.data?.slots || []); setBookedSlots(d.data?.bookedSlots || []); })
      .finally(() => setLoadingSlots(false));
  }, [hospitalId, form.doctorId, form.appointmentDate]);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field]; delete n.submit; return n; });
    if (field === "phone" || field === "email") { setDupPatient(null); setBookMode(null); }
  };

  const checkDuplicatePatient = async ({ phone, email }: { phone?: string; email?: string }) => {
    if (phone) { const err = validatePhone(phone); if (err) return; }
    if (!phone && !email) return;
    setCheckingDup(true);
    try {
      const params = new URLSearchParams();
      if (phone) params.set("phone", phone.trim());
      if (email) params.set("email", email.trim());
      const r = await fetch(`/api/public/booking/check-patient?${params}`, { credentials: "include" });
      const d = await r.json();
      if (d.data?.id) {
        setDupPatient(d.data);
        setBookMode("ask");
      }
    } catch {}
    finally { setCheckingDup(false); }
  };

  const goToStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    else if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    const waErr = validateWhatsApp(form.whatsapp);
    if (waErr) errs.whatsapp = waErr;
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.departmentId) errs.departmentId = "Select a department";
    if (!isDiagnostic && !form.doctorId) errs.doctorId = "Select a doctor";
    if (!form.appointmentDate) errs.appointmentDate = "Select a date";
    if (!isDiagnostic && !form.timeSlot) errs.timeSlot = "Select a time slot";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (isSlotPassed(form.appointmentDate, form.timeSlot)) {
      setErrors({ submit: "The selected time slot has already passed." }); return;
    }
    setSaving(true); setErrors({});
    try {
      const res = await fetch("/api/public/booking", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
          doctorId: form.doctorId, departmentId: form.departmentId || null,
          appointmentDate: form.appointmentDate, timeSlot: form.timeSlot,
          type: form.type, consultationFee: form.consultationFee ? Number(form.consultationFee) : null,
          notes: form.notes || null,
          ...(bookMode === "existing" && dupPatient ? { existingPatientId: dupPatient.id } : {}),
          ...(bookMode === "new" ? { forceNew: true } : {}),
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
            const dept = departments.find(dp => dp.id === form.departmentId);
            setBookedInfo({
              doctor: selectedDoctor?.name || "Doctor",
              department: dept?.name || selectedDoctor?.department?.name || "",
              date: form.appointmentDate,
              time: form.timeSlot,
              email: form.email,
              token: d.data?.appointment?.tokenNumber,
            });
            setIsSuccess(true); setStep(3);
          }
      else setErrors({ submit: d.message || "Booking failed. Please try again." });
    } catch { setErrors({ submit: "Network error. Please check your connection." }); }
    finally { setSaving(false); }
  };

  /* ── Slot grouping (Morning / Afternoon / Evening) ── */
  const groupSlots = (allSlots: string[]) => {
    const morning: string[] = [], afternoon: string[] = [], evening: string[] = [];
    allSlots.forEach(s => {
      const h = parseInt(s.split(":")[0], 10);
      if (h < 12) morning.push(s); else if (h < 17) afternoon.push(s); else evening.push(s);
    });
    return [
      { label: "Morning", slots: morning, emoji: "🌅" },
      { label: "Afternoon", slots: afternoon, emoji: "☀️" },
      { label: "Evening", slots: evening, emoji: "🌆" },
    ].filter(g => g.slots.length > 0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className={styles.modal}
            style={{ maxWidth: isSuccess ? 420 : 600, transition: "max-width 0.3s ease" }}
            initial={{ opacity: 0, scale: 0.92, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }} transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>

            {/* ── Step Indicator ── */}
            {!isSuccess && <StepIndicator current={step} />}

            {/* ── Saving Overlay ── */}
            <AnimatePresence>
              {saving && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(255,255,255,.88)", backdropFilter: "blur(4px)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, borderRadius: "var(--radius-2xl)" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Loader2 size={40} style={{ color: "var(--primary)" }} />
                  </motion.div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--gray-700)" }}>Booking your appointment...</div>
                  <div style={{ fontSize: 12, color: "var(--gray-400)" }}>Please wait a moment</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Success State ── */}
            {isSuccess && bookedInfo && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ flex: 1, position: "relative", background: "#fff",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "24px 20px 20px", textAlign: "center", overflow: "hidden" }}>

                {/* Animated check circle */}
                <div style={{ position: "relative", width: 64, height: 64, marginBottom: 16 }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                    style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 8px 32px rgba(16,185,129,.35)" }}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                        <Check size={28} strokeWidth={3} style={{ color: "#fff" }} />
                    </motion.div>
                  </motion.div>
                  <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "3px solid rgba(16,185,129,.15)" }} />
                </div>

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--gray-900)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Appointment Confirmed!</h3>
                  <p style={{ fontSize: 12, color: "var(--gray-500)", margin: "0 0 16px", lineHeight: 1.5 }}>
                    Your booking has been confirmed successfully.
                  </p>
                </motion.div>

                {/* Summary card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                  style={{ width: "100%", background: "var(--gray-50)", border: "1px solid var(--gray-200)",
                    borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "stretch", padding: "12px 14px" }}>
                    {/* Doctor */}
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 6, textAlign: "left" }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: "#fff", border: "1px solid var(--gray-200)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                        <Stethoscope size={12} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Doctor</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-900)" }}>{bookedInfo.doctor}</div>
                        {bookedInfo.department && <div style={{ fontSize: 10, color: "var(--gray-500)" }}>{bookedInfo.department}</div>}
                      </div>
                    </div>
                    {/* Divider */}
                    <div style={{ width: 1, background: "var(--gray-200)", margin: "0 8px", flexShrink: 0 }} />
                    {/* Date */}
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 6, textAlign: "left" }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: "#fff", border: "1px solid var(--gray-200)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                        <CalendarCheck size={12} />
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Date & Time</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gray-900)" }}>{fmtDate(bookedInfo.date)}</div>
                        <div style={{ fontSize: 10, color: "var(--gray-500)" }}>{fmt12(bookedInfo.time)}</div>
                      </div>
                    </div>
                  </div>
                  {bookedInfo.token && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 14px", borderTop: "1px solid var(--gray-200)",
                      background: "linear-gradient(135deg, rgba(14,137,143,.04), rgba(16,185,129,.04))" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-500)" }}>Token Number</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)",
                        background: "rgba(14,137,143,.1)", padding: "2px 10px", borderRadius: 6 }}>#{bookedInfo.token}</span>
                    </div>
                  )}
                </motion.div>

                {/* Email notice */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--gray-500)",
                    background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "6px 12px", marginBottom: 16 }}>
                  <Mail size={12} />
                  <span>Confirmation sent to <strong style={{ color: "#166534" }}>{bookedInfo.email}</strong></span>
                </motion.div>

                {/* Actions */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" onClick={onClose}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "none",
                      background: "linear-gradient(135deg,#0E898F,#0d7a7f)", color: "#fff",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      boxShadow: "0 4px 14px rgba(14,137,143,.3)", transition: "all .2s" }}>
                    Done
                  </button>
                  <button type="button" onClick={() => {
                    setIsSuccess(false); setBookedInfo(null); setStep(1);
                    setForm({ name: "", phone: "", whatsapp: "", email: "", departmentId: "", doctorId: "", appointmentDate: "", timeSlot: "", notes: "", consultationFee: "", type: "OPD" });
                  }}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid var(--gray-200)",
                      background: "#fff", color: "var(--gray-600)", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}>
                    <CalendarPlus size={13} /> Book Another
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* ── Step 1: Patient Info ── */}
            {!isSuccess && step === 1 && (
              <motion.div className={styles.stepBody} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                <h2 className={styles.stepTitle}>Your Information</h2>
                <p className={styles.stepSubtext}>Please fill in your details to proceed with booking</p>
                <div className={styles.formRow}>
                  <div className={`${styles.field} ${errors.name ? styles.fieldError : ""}`}>
                    <label className={styles.label}>Full Name *</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.fieldIconWrap}><User size={15} /></span>
                      <input className={styles.input} placeholder="e.g. John Doe" value={form.name} onChange={e => set("name", e.target.value)} />
                    </div>
                    {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                  </div>
                  <div className={`${styles.field} ${errors.phone ? styles.fieldError : ""}`}>
                    <label className={styles.label}>Phone Number *</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.fieldIconWrap}><Phone size={15} /></span>
                      <input className={styles.input} type="tel" placeholder="e.g. 9876543210" value={form.phone}
                        onChange={e => set("phone", e.target.value)}
                        onBlur={e => checkDuplicatePatient({ phone: e.target.value })} />
                    </div>
                    {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                    {checkingDup && <span style={{ fontSize: 11, color: "var(--primary)", marginTop: 4, display: "block" }}>Checking...</span>}
                  </div>
                </div>

                {/* ── Duplicate patient alert ── */}
                {dupPatient && bookMode === "ask" && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                    style={{ background: "#fffbeb", border: "1.5px solid #f59e0b", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AlertCircle size={16} style={{ color: "#d97706" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 3 }}>
                          {dupPatient.matchedBy === "email" ? "Email already registered" : "Mobile already registered"}
                        </div>
                        <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>
                          This {dupPatient.matchedBy === "email" ? "email" : "mobile number"} is already linked to{" "}
                          <strong>{dupPatient.name}</strong> ({dupPatient.patientId}).
                          Book the appointment for the same patient or register as a new patient?
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <button type="button"
                            onClick={() => { set("name", dupPatient.name); setBookMode("existing"); }}
                            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#0E898F",
                              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            Book for {dupPatient.name}
                          </button>
                          <button type="button"
                            onClick={() => setBookMode("new")}
                            style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #d97706",
                              background: "transparent", color: "#92400e", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            Register as new patient
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Existing patient chosen banner ── */}
                {dupPatient && bookMode === "existing" && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                    style={{ background: "#f0fdf4", border: "1.5px solid #22c55e", borderRadius: 12, padding: "10px 14px",
                      marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                    <Check size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>
                      Booking for existing patient: <strong>{dupPatient.name}</strong> ({dupPatient.patientId})
                    </span>
                    <button type="button" onClick={() => setBookMode("ask")}
                      style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 11, color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}>Change</button>
                  </motion.div>
                )}

                {/* ── New patient chosen banner ── */}
                {dupPatient && bookMode === "new" && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                    style={{ background: "#eff6ff", border: "1.5px solid #60a5fa", borderRadius: 12, padding: "10px 14px",
                      marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                    <User size={15} style={{ color: "#2563eb", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>Registering as a new patient profile</span>
                    <button type="button" onClick={() => setBookMode("ask")}
                      style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 11, color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}>Change</button>
                  </motion.div>
                )}

                <div className={styles.formRow}>
                  <div className={`${styles.field} ${errors.email ? styles.fieldError : ""}`}>
                    <label className={styles.label}>Email Address *</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.fieldIconWrap}><Mail size={15} /></span>
                      <input className={styles.input} type="email" placeholder="e.g. john@example.com" value={form.email}
                        onChange={e => set("email", e.target.value)}
                        onBlur={e => { if (!dupPatient) checkDuplicatePatient({ phone: form.phone, email: e.target.value }); }} />
                    </div>
                    {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
                  </div>
                  <div className={`${styles.field} ${errors.whatsapp ? styles.fieldError : ""}`}>
                    <label className={styles.label}>WhatsApp Number <span style={{ fontWeight: 400, color: "var(--gray-400)", fontSize: 11 }}>(optional)</span></label>
                    <div className={styles.inputWrap}>
                      <span className={styles.fieldIconWrap}><MessageCircle size={15} /></span>
                      <input className={styles.input} type="tel" placeholder="e.g. 9876543210" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} />
                    </div>
                    {errors.whatsapp && <span className={styles.errorMsg}>{errors.whatsapp}</span>}
                  </div>
                </div>
                <div className={styles.footer} style={{ borderTop: "none", padding: "12px 0 0" }}>
                  <div className={styles.footerSpacer} />
                  <button type="button" className={styles.footerBtn} onClick={goToStep2}
                    style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0E898F,#0d7a7f)",
                      color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      boxShadow: "0 4px 14px rgba(14,137,143,.3)" }}>
                    Next <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Appointment Details ── */}
            {!isSuccess && step === 2 && (
              <motion.div className={styles.stepBody} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                {/* API Error Banner */}
                {apiError && (
                  <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "10px 14px",
                    marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <AlertCircle size={15} style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", marginBottom: 2 }}>Could not load booking data</div>
                      <div style={{ fontSize: 11, color: "#b91c1c", lineHeight: 1.5 }}>{apiError}</div>
                    </div>
                    <button type="button" onClick={() => setApiError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 0 }}><X size={13} /></button>
                  </div>
                )}
                {/* Patient banner */}
                <div style={{ background: "linear-gradient(135deg,#0E898F,#0b7a80)", borderRadius: 12, padding: "12px 16px",
                  marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.18)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>
                    {form.name.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{form.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{form.phone} &middot; {form.email}</div>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className={styles.editBtn}
                    style={{ background: "rgba(255,255,255,.18)", color: "#fff", border: "none" }}>Edit</button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Department *</label>
                      <SearchableSelect icon={Building2} placeholder="Select Department..." value={form.departmentId} error={errors.departmentId}
                        options={departments.map(d => ({ id: d.id, label: d.name }))}
                  isLoading={loadingDepts} onChange={v => { set("departmentId", v); set("doctorId", ""); set("timeSlot", ""); set("consultationFee", ""); }} />
                      {errors.departmentId && <span className={styles.errorMsg}>{errors.departmentId}</span>}
                    </div>
                    {!isDiagnostic && (
                    <div className={styles.field}>
                      <label className={styles.label}>Doctor *</label>
                      <SearchableSelect icon={Stethoscope} placeholder="Select Doctor..." value={form.doctorId} error={errors.doctorId}
                        options={filteredDoctors.map(d => ({ id: d.id, label: d.name, sub: d.specialization || d.department?.name || "" }))}
                        onChange={v => {
                          const doc = allDoctors.find(d => d.id === v);
                          set("doctorId", v); set("timeSlot", "");
                          if (doc?.consultationFee) set("consultationFee", String(doc.consultationFee));
                          if (doc?.departmentId && !form.departmentId) set("departmentId", doc.departmentId);
                        }} />
                      {errors.doctorId && <span className={styles.errorMsg}>{errors.doctorId}</span>}
                    </div>
                    )}
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <label className={styles.label}>Date *</label>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[{ l: "Today", v: todayStr }, { l: "Tomorrow", v: tomorrowStr }].map(b => (
                            <button key={b.l} type="button" onClick={() => { set("appointmentDate", b.v); set("timeSlot", ""); }}
                              style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
                                border: `1px solid ${form.appointmentDate === b.v ? "var(--primary)" : "var(--gray-200)"}`,
                                background: form.appointmentDate === b.v ? "var(--primary-50)" : "var(--gray-50)",
                                color: form.appointmentDate === b.v ? "var(--primary)" : "var(--gray-500)" }}>{b.l}</button>
                          ))}
                        </div>
                      </div>
                      <div className={styles.inputWrap}>
                        <span className={styles.fieldIconWrap}><CalendarDays size={15} /></span>
                        <input className={styles.input} type="date" min={todayStr} value={form.appointmentDate}
                          onChange={e => { set("appointmentDate", e.target.value); set("timeSlot", ""); }} />
                      </div>
                      {errors.appointmentDate && <span className={styles.errorMsg}>{errors.appointmentDate}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Appointment Type</label>
                      <SearchableSelect icon={FileText} placeholder="OPD" value={form.type}
                        options={[
                          { id: "OPD", label: "First time visit", sub: "Outpatient" },
                          { id: "FOLLOW_UP", label: "Follow-up", sub: "Revisit" },
                          { id: "EMERGENCY", label: "Emergency", sub: "Urgent" },
                        ]} onChange={v => set("type", v)} />
                    </div>
                  </div>

                  {/* ── Time Slots ── */}
                  {!isDiagnostic && form.doctorId && form.appointmentDate && (
                    <div className={styles.slotsSection}>
                      <label className={styles.label} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={13} /> Time Slot *
                        {loadingSlots && <Loader2 size={12} className={styles.spinner} style={{ marginLeft: 4 }} />}
                      </label>
                      {loadingSlots ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0", color: "var(--gray-400)", fontSize: 13 }}>
                          <Loader2 size={16} className={styles.spinner} /> Loading available slots...
                        </div>
                      ) : slots.length === 0 ? (
                        <div className={styles.noSlots}>No available slots for this date. Doctor may be unavailable or fully booked.</div>
                      ) : (
                        <div>
                          {groupSlots(slots).map(group => (
                            <div key={group.label} className={styles.timeGroup}>
                              <span className={styles.timeGroupLabel}>{group.emoji} {group.label}</span>
                              <div className={styles.timeGrid}>
                                {group.slots.map(slot => {
                                  const isBooked = bookedSlots.includes(slot);
                                  const isPast = isSlotPassed(form.appointmentDate, slot);
                                  const disabled = isBooked || isPast;
                                  const selected = form.timeSlot === slot;
                                  return (
                                    <button key={slot} type="button" disabled={disabled}
                                      onClick={() => !disabled && set("timeSlot", slot)}
                                      title={isPast ? "Time has passed" : isBooked ? "Already booked" : "Available"}
                                      className={`${styles.timeChip} ${selected ? styles.timeChipSelected : ""} ${disabled ? styles.timeChipDisabled : ""}`}
                                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                      <span>{fmt12(slot)}</span>
                                      {disabled && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{isBooked ? "Booked" : "Past"}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.timeSlot && <span className={styles.errorMsg}>{errors.timeSlot}</span>}
                    </div>
                  )}

                  <div className={styles.formRow}>
                    <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                      <label className={styles.label}>Notes / Reason</label>
                      <div className={styles.inputWrap}>
                        <span className={styles.fieldIconWrap}><FileText size={15} /></span>
                        <input className={styles.input} placeholder="Chief complaint or notes..."
                          value={form.notes} onChange={e => set("notes", e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className={styles.submitError} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <AlertCircle size={14} /> {errors.submit}
                    </div>
                  )}

                  {/* Footer */}
                  <div className={styles.footer} style={{ borderTop: "none", padding: "14px 0 0" }}>
                    <button type="button" onClick={() => setStep(1)} className={styles.footerBtn}
                      style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid var(--gray-200)", background: "#fff",
                        color: "var(--gray-600)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <ArrowLeft size={14} /> Back
                    </button>
                    <div className={styles.footerSpacer} />
                    <button type="submit" disabled={saving || (!isDiagnostic && !form.timeSlot)} className={`${styles.footerBtn} ${styles.confirmBtn}`}
                      style={{ padding: "10px 24px", borderRadius: 10, border: "none",
                        background: (!isDiagnostic && !form.timeSlot) ? "var(--gray-200)" : "linear-gradient(135deg,#0E898F,#0d7a7f)",
                        color: (!isDiagnostic && !form.timeSlot) ? "var(--gray-400)" : "#fff", fontSize: 13, fontWeight: 700,
                        cursor: (saving || (!isDiagnostic && !form.timeSlot)) ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 8,
                        boxShadow: (!isDiagnostic && !form.timeSlot) ? "none" : "0 4px 14px rgba(14,137,143,.3)" }}>
                      {saving ? <><Loader2 size={14} className={styles.spinner} /> Booking...</> : <>Book Appointment <Check size={14} /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
