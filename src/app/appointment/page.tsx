"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2, Loader2, ArrowLeft, ArrowUpRight, CalendarPlus,
  User, Phone, Mail, FileText, AlertCircle, CalendarCheck, Clock,
  Stethoscope, Sparkles, MapPin, Heart, Check,
} from "lucide-react";
import Link from "next/link";
import styles from "./appointment.module.css";

/* ── Types ── */
interface Doctor { id: string; name: string; specialization?: string; departmentId?: string; department?: { name: string }; consultationFee?: number; }
interface Department { id: string; name: string; code: string; type?: string; }
interface HospitalInfo { id: string; name: string; logo?: string | null; phone?: string | null; }

/* ── Helpers ── */
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

const isSlotPassed = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0) < new Date();
};

/* ──────────────────────────────────────────────────────────────────────── */
/* MAIN FORM COMPONENT                                                     */
/* ──────────────────────────────────────────────────────────────────────── */
function AppointmentForm() {
  const searchParams = useSearchParams();
  const hid = searchParams.get("hid") || "";

  /* ── Data state ── */
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const [loadingHospital, setLoadingHospital] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  /* ── Form state ── */
  const [step, setStep] = useState(1); // 1 = patient info, 2 = appointment
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    departmentId: "", doctorId: "", appointmentDate: "", timeSlot: "",
    notes: "", consultationFee: "", type: "OPD",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookedInfo, setBookedInfo] = useState<{ date: string; time: string; doctor: string; department: string; email: string; token?: number } | null>(null);

  const resolvedHid = hospitalInfo?.id || hid;

  const todayStr = toLocalDateStr(new Date());
  const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tmrw);

  /* ── Derived ── */
  const selectedDept = departments.find(d => d.id === form.departmentId);
  const isDiagnostic = selectedDept?.type === "DIAGNOSTIC";
  const filteredDoctors = form.departmentId
    ? allDoctors.filter(d => d.departmentId === form.departmentId)
    : allDoctors;
  const selectedDoctor = allDoctors.find(d => d.id === form.doctorId);

  /* ── Fetch hospital + departments ── */
  useEffect(() => {
    setLoadingHospital(true);
    const url = hid ? `/api/public/booking?hid=${hid}` : `/api/public/booking`;
    fetch(url).then(r => r.json()).then(d => {
      if (d.data?.hospital) setHospitalInfo(d.data.hospital);
      setDepartments(d.data?.departments || []);
    }).finally(() => setLoadingHospital(false));
  }, [hid]);

  /* ── Fetch doctors ── */
  useEffect(() => {
    if (!resolvedHid) return;
    setLoadingDoctors(true);
    fetch(`/api/public/booking/doctors?hid=${resolvedHid}`)
      .then(r => r.json())
      .then(d => setAllDoctors(d.data || []))
      .finally(() => setLoadingDoctors(false));
  }, [resolvedHid]);

  /* ── Fetch slots when doctor + date change ── */
  useEffect(() => {
    if (!form.doctorId || !form.appointmentDate || !resolvedHid) {
      setSlots([]); setBookedSlots([]); return;
    }
    setLoadingSlots(true);
    fetch(`/api/public/booking/slots?hid=${resolvedHid}&doctorId=${form.doctorId}&date=${form.appointmentDate}`)
      .then(r => r.json())
      .then(d => {
        setSlots(d.data?.allSlots || d.data?.slots || []);
        setBookedSlots(d.data?.bookedSlots || []);
      })
      .finally(() => setLoadingSlots(false));
  }, [resolvedHid, form.doctorId, form.appointmentDate]);

  /* ── Helpers ── */
  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field]; delete n.submit; return n; });
  };

  /* ── Step 1 validation ── */
  const goToStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  };

  /* ── Submit booking ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!isDiagnostic && !form.doctorId) errs.doctorId = "Select a doctor";
    if (!form.appointmentDate) errs.appointmentDate = "Select a date";
    if (!isDiagnostic && !form.timeSlot) errs.timeSlot = "Select a time slot";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Check if selected slot has passed (only for clinical)
    if (!isDiagnostic && isSlotPassed(form.appointmentDate, form.timeSlot)) {
      setErrors({ submit: "The selected time slot has already passed. Please choose a future time." });
      return;
    }

    setSaving(true); setErrors({});

    const payload = {
      hospitalId: resolvedHid,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      doctorId: form.doctorId,
      departmentId: form.departmentId || null,
      appointmentDate: form.appointmentDate,
      timeSlot: form.timeSlot,
      type: form.type,
      consultationFee: form.consultationFee ? Number(form.consultationFee) : null,
      notes: form.notes || null,
    };

    try {
      const res = await fetch("/api/public/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();

      if (res.ok && d.success) {
        const dept = departments.find(dp => dp.id === form.departmentId);
        setBookedInfo({
          date: form.appointmentDate,
          time: form.timeSlot,
          doctor: selectedDoctor?.name || "",
          department: dept?.name || selectedDoctor?.department?.name || "",
          email: form.email,
          token: d.data?.appointment?.tokenNumber,
        });
        setIsSuccess(true);
      } else {
        setErrors({ submit: d.message || "Booking failed. Please try again." });
      }
    } catch {
      setErrors({ submit: "Network error. Please check your connection." });
    } finally {
      setSaving(false);
    }
  };

  /* ── Common field style ── */
  const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 5 };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" };
  const inputStyle: React.CSSProperties = { background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize: 13, color: "#1e293b", outline: "none", width: "100%" };
  const errStyle: React.CSSProperties = { fontSize: 11, color: "#ef4444", fontWeight: 600, marginTop: 2 };

  /* ────────────────────────── RENDER ────────────────────────── */

  /* ── Full-page success view ── */
  if (isSuccess && bookedInfo) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.container}>
          <div className={styles.successPage}>
            {/* Decorative sparkles */}
            <div className={styles.successSparkle} style={{ top: 20, right: 30 }}><Sparkles size={24} /></div>
            <div className={styles.successSparkle} style={{ bottom: 30, left: 20 }}><Sparkles size={18} /></div>
            <div className={styles.successSparkle} style={{ top: 60, left: 40 }}><Heart size={14} /></div>

            {/* Animated check */}
            <div className={styles.successCircle}>
              <div className={styles.successCircleInner}>
                <Check size={36} strokeWidth={3} />
              </div>
              <div className={styles.successRing} />
            </div>

            <h2 className={styles.successTitle}>Appointment Confirmed!</h2>
            <p className={styles.successSubtitle}>
              Your appointment at <strong>{hospitalInfo?.name || "the hospital"}</strong> has been booked successfully.
            </p>

            {/* Summary card */}
            <div className={styles.successCard}>
              <div className={styles.successCardRow}>
                <div className={styles.successCardItem}>
                  <div className={styles.successCardIcon}><Stethoscope size={16} /></div>
                  <div>
                    <div className={styles.successCardLabel}>Doctor</div>
                    <div className={styles.successCardValue}>{bookedInfo.doctor}</div>
                    {bookedInfo.department && <div className={styles.successCardSub}>{bookedInfo.department}</div>}
                  </div>
                </div>
                <div className={styles.successCardDivider} />
                <div className={styles.successCardItem}>
                  <div className={styles.successCardIcon}><CalendarCheck size={16} /></div>
                  <div>
                    <div className={styles.successCardLabel}>Date</div>
                    <div className={styles.successCardValue}>{fmtDate(bookedInfo.date)}</div>
                  </div>
                </div>
                <div className={styles.successCardDivider} />
                <div className={styles.successCardItem}>
                  <div className={styles.successCardIcon}><Clock size={16} /></div>
                  <div>
                    <div className={styles.successCardLabel}>Time</div>
                    <div className={styles.successCardValue}>{fmt12(bookedInfo.time)}</div>
                  </div>
                </div>
              </div>
              {bookedInfo.token && (
                <div className={styles.successTokenRow}>
                  <span className={styles.successTokenLabel}>Token Number</span>
                  <span className={styles.successTokenBadge}>#{bookedInfo.token}</span>
                </div>
              )}
            </div>

            {/* Email notice */}
            <div className={styles.successEmailNotice}>
              <Mail size={14} />
              <span>A confirmation email will be sent to <strong>{bookedInfo.email}</strong></span>
            </div>

            {/* Actions */}
            <div className={styles.successActions}>
              <Link href="/" className={styles.successPrimaryBtn}>
                Return to Homepage <ArrowUpRight size={14} />
              </Link>
              <button type="button" onClick={() => { setIsSuccess(false); setStep(1); setForm({ name: "", phone: "", email: "", departmentId: "", doctorId: "", appointmentDate: "", timeSlot: "", notes: "", consultationFee: "", type: "OPD" }); }}
                className={styles.successSecondaryBtn}>
                <CalendarPlus size={14} /> Book Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}><ArrowLeft size={16} /> Back to Home</Link>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}><CalendarPlus size={22} /></div>
            <div>
              <h1 className={styles.headerH1}>
                {loadingHospital ? "Loading..." : hospitalInfo ? `Book at ${hospitalInfo.name}` : "Book an Appointment"}
              </h1>
              <p className={styles.headerSub}>Schedule your visit in a few simple steps</p>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          {/* ── Loading / error ── */}
          {loadingHospital && (
            <div className={styles.loadingState}><Loader2 size={28} className={styles.spinner} /><span>Loading form...</span></div>
          )}
          {!loadingHospital && !resolvedHid && (
            <div className={styles.errorState}>Unable to load booking form. Please use the QR code link provided by the hospital.</div>
          )}

          {/* ══════════ STEP 1: Patient Info ══════════ */}
          {!loadingHospital && resolvedHid && step === 1 && (
            <div style={{ padding: "28px 28px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#0E898F,#0d7a7f)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>1</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>Your Information</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Full Name *</label>
                  <div style={{ position: "relative" }}>
                    <User size={14} style={{ position: "absolute", left: 12, top: 12, color: "#94a3b8" }} />
                    <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="e.g. John Doe"
                      value={form.name} onChange={e => set("name", e.target.value)} />
                  </div>
                  {errors.name && <span style={errStyle}>{errors.name}</span>}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Phone Number *</label>
                  <div style={{ position: "relative" }}>
                    <Phone size={14} style={{ position: "absolute", left: 12, top: 12, color: "#94a3b8" }} />
                    <input style={{ ...inputStyle, paddingLeft: 34 }} type="tel" placeholder="e.g. 9876543210"
                      value={form.phone} onChange={e => set("phone", e.target.value)} />
                  </div>
                  {errors.phone && <span style={errStyle}>{errors.phone}</span>}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Email Address *</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={14} style={{ position: "absolute", left: 12, top: 12, color: "#94a3b8" }} />
                    <input style={{ ...inputStyle, paddingLeft: 34 }} type="email" placeholder="e.g. john@example.com"
                      value={form.email} onChange={e => set("email", e.target.value)} />
                  </div>
                  {errors.email && <span style={errStyle}>{errors.email}</span>}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button type="button" onClick={goToStep2}
                  style={{ padding: "10px 28px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#0E898F,#0d7a7f)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  Next — Appointment Details →
                </button>
              </div>
            </div>
          )}

          {/* ══════════ STEP 2: Appointment Booking (mirrors admin BookForm) ══════════ */}
          {!loadingHospital && resolvedHid && step === 2 && (
            <div style={{ padding: "28px 28px 20px" }}>
              {/* Patient banner */}
              <div style={{ background: "linear-gradient(135deg,#0E898F,#0d7a7f)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
                  {form.name.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{form.name}</div>
                  <div style={{ fontSize: 11, color: "#bae6fd" }}>{form.phone} &middot; {form.email}</div>
                </div>
                <button type="button" onClick={() => setStep(1)}
                  style={{ marginLeft: "auto", background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: "#fff", fontSize: 11, fontWeight: 600 }}>
                  Edit
                </button>
              </div>

              <div style={{ fontWeight: 700, fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#0E898F,#0d7a7f)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11 }}>2</div>
                Appointment Details
              </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* Department */}
                <div style={fieldStyle}>
                  <label style={labelStyle}>Department *</label>
                  <select style={inputStyle} value={form.departmentId}
                    onChange={e => { set("departmentId", e.target.value); set("doctorId", ""); set("timeSlot", ""); set("consultationFee", ""); }}>
                    <option value="">Select Department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Doctor — hidden for DIAGNOSTIC */}
                {!isDiagnostic && (
                <div style={fieldStyle}>
                  <label style={labelStyle}>Doctor *</label>
                  <select required style={inputStyle} value={form.doctorId}
                    onChange={e => {
                      const doc = allDoctors.find(d => d.id === e.target.value);
                      set("doctorId", e.target.value);
                      set("timeSlot", "");
                      if (doc?.consultationFee) set("consultationFee", String(doc.consultationFee));
                      if (doc?.departmentId && !form.departmentId) set("departmentId", doc.departmentId);
                    }}>
                    <option value="">{loadingDoctors ? "Loading..." : "Select Doctor..."}</option>
                    {filteredDoctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : d.department?.name ? ` — ${d.department.name}` : ""}</option>
                    ))}
                  </select>
                  {errors.doctorId && <span style={errStyle}>{errors.doctorId}</span>}
                </div>
                )}

                {/* Date */}
                <div style={fieldStyle}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={labelStyle}>Appointment Date *</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" onClick={() => { set("appointmentDate", todayStr); set("timeSlot", ""); }}
                        style={{ padding: "2px 8px", borderRadius: 6, border: `1px solid ${form.appointmentDate === todayStr ? "#0E898F" : "#e2e8f0"}`, background: form.appointmentDate === todayStr ? "#E6F4F4" : "#f8fafc", color: form.appointmentDate === todayStr ? "#0E898F" : "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        Today
                      </button>
                      <button type="button" onClick={() => { set("appointmentDate", tomorrowStr); set("timeSlot", ""); }}
                        style={{ padding: "2px 8px", borderRadius: 6, border: `1px solid ${form.appointmentDate === tomorrowStr ? "#0E898F" : "#e2e8f0"}`, background: form.appointmentDate === tomorrowStr ? "#E6F4F4" : "#f8fafc", color: form.appointmentDate === tomorrowStr ? "#0E898F" : "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        Tomorrow
                      </button>
                    </div>
                  </div>
                  <input required type="date" min={todayStr} style={inputStyle}
                    value={form.appointmentDate} onChange={e => { set("appointmentDate", e.target.value); set("timeSlot", ""); }} />
                  {errors.appointmentDate && <span style={errStyle}>{errors.appointmentDate}</span>}
                </div>

                {/* Type */}
                <div style={fieldStyle}>
                  <label style={labelStyle}>Appointment Type</label>
                  <select style={inputStyle} value={form.type} onChange={e => set("type", e.target.value)}>
                    <option value="OPD">OPD</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>

                {/* Diagnostic info banner */}
                {isDiagnostic && form.appointmentDate && (
                  <div style={{ gridColumn: "1/-1", padding: "12px 16px", background: "#eff6ff", border: "1.5px solid #93c5fd", borderRadius: 9, fontSize: 12, color: "#1e40af", fontWeight: 600 }}>
                    ℹ️ Our team will confirm your appointment time. Please arrive at the selected date and we will schedule your diagnostic visit.
                  </div>
                )}

                {/* Time Slots — clinical only */}
                {!isDiagnostic && form.doctorId && form.appointmentDate && (
                  <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={labelStyle}>
                      Time Slot * {loadingSlots && <Loader2 size={11} style={{ marginLeft: 6, animation: "spin .7s linear infinite" }} />}
                    </label>
                    {loadingSlots ? (
                      <div style={{ fontSize: 13, color: "#94a3b8", padding: "12px 0" }}>Loading available slots...</div>
                    ) : slots.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#ef4444", padding: "12px 16px", background: "#fff5f5", borderRadius: 9, border: "1px solid #fecaca" }}>
                        No available slots for this date. Doctor may be unavailable or fully booked.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                        {slots.map(slot => {
                          const isBooked = bookedSlots.includes(slot);
                          const isPast = isSlotPassed(form.appointmentDate, slot);
                          const disabled = isBooked || isPast;
                          const selected = form.timeSlot === slot;
                          return (
                            <button key={slot} type="button" disabled={disabled}
                              onClick={() => !disabled && set("timeSlot", slot)}
                              title={isPast ? "Time has passed" : isBooked ? "Already booked" : "Available"}
                              style={{
                                padding: "6px 4px", borderRadius: 9, textAlign: "center",
                                border: `1.5px solid ${selected ? "#0E898F" : disabled ? "#fecaca" : "#e2e8f0"}`,
                                background: selected ? "#0E898F" : disabled ? "#fef2f2" : "#fff",
                                color: selected ? "#fff" : disabled ? "#ef4444" : "#334155",
                                fontSize: 11, fontWeight: selected ? 700 : 500,
                                cursor: disabled ? "not-allowed" : "pointer",
                                transition: "all .15s",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                              }}>
                              <span>{fmt12(slot)}</span>
                              {disabled && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{isBooked ? "Booked" : "Past"}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {errors.timeSlot && <span style={errStyle}>{errors.timeSlot}</span>}
                  </div>
                )}

                {/* Notes */}
                <div style={fieldStyle}>
                  <label style={labelStyle}>Notes / Reason</label>
                  <input style={inputStyle} placeholder="Chief complaint or notes..."
                    value={form.notes} onChange={e => set("notes", e.target.value)} />
                </div>

                {/* Error */}
                {errors.submit && (
                  <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ef4444", fontWeight: 600, background: "#fff5f5", padding: "10px 14px", borderRadius: 9, border: "1px solid #fecaca" }}>
                    <AlertCircle size={14} />{errors.submit}
                  </div>
                )}

                {/* Actions */}
                <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ padding: "10px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    ← Back
                  </button>
                  <button type="submit" disabled={saving || (!isDiagnostic && !form.timeSlot)}
                    style={{
                      padding: "10px 24px", borderRadius: 9, border: "none",
                      background: (!isDiagnostic && !form.timeSlot) ? "#e2e8f0" : "linear-gradient(135deg,#0E898F,#0d7a7f)",
                      color: (!isDiagnostic && !form.timeSlot) ? "#94a3b8" : "#fff",
                      fontSize: 13, fontWeight: 700,
                      cursor: (saving || (!isDiagnostic && !form.timeSlot)) ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      boxShadow: (!isDiagnostic && !form.timeSlot) ? "none" : "0 4px 12px rgba(14,137,143,.3)",
                    }}>
                    {saving ? <><Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> Booking...</> : <><CheckCircle2 size={14} /> Book Appointment</>}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppointmentPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} /></div>}>
      <AppointmentForm />
    </Suspense>
  );
}
