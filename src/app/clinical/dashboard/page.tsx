"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Building2, CalendarDays, Users, Activity,
  RefreshCw, Loader2, ChevronRight, UserCheck, IndianRupee,
  Stethoscope, ArrowLeft, Power,
  ClipboardList, CheckCircle2, Info, MapPin, Phone, Mail,
  Pencil, Trash2, Eye, Download, ChevronUp, ChevronDown, X, AlertTriangle,
  CheckCircle, Plus, Search, Edit3, Save,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const ReportsPanel = dynamic(() => import("@/components/ReportsPanel"), { ssr: false });
const PatientsManagementPanel = dynamic(() => import("@/app/subdept/dashboard/PatientsManagementPanel").then(mod => mod.PatientsManagementPanel), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Patient Management...</span></div> });

/* ─── constants ─── */
const TEAL  = "#0E898F";
const TEAL2 = "#07595D";
const TEAL_LIGHT = "#E6F4F4";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  SCHEDULED:   { label: "Scheduled",   cls: "cl-badge-blue"  },
  CONFIRMED:   { label: "Confirmed",   cls: "cl-badge-teal"  },
  COMPLETED:   { label: "Completed",   cls: "cl-badge-green" },
  CANCELLED:   { label: "Cancelled",   cls: "cl-badge-red"   },
  NO_SHOW:     { label: "No Show",     cls: "cl-badge-amber" },
  RESCHEDULED: { label: "Rescheduled", cls: "cl-badge-gray"  },
};

const PIE_COLORS = [TEAL, "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#6366f1"];

const SD_META: Record<string, { gradient: string; accent: string; lightBg: string }> = {
  OPD:                { gradient: "linear-gradient(135deg,#0ea5e9,#0369a1)", accent: "#0369a1", lightBg: "#e0f2fe" },
  IPD:                { gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)", accent: "#6d28d9", lightBg: "#f5f3ff" },
  ICU:                { gradient: "linear-gradient(135deg,#f97316,#c2410c)", accent: "#c2410c", lightBg: "#fff7ed" },
  NURSING:            { gradient: "linear-gradient(135deg,#ec4899,#be185d)", accent: "#be185d", lightBg: "#fdf2f8" },
  CLINICAL_PROCEDURE: { gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: TEAL2,     lightBg: TEAL_LIGHT },
};
const sdMeta = (t: string) => SD_META[t] || { gradient: "linear-gradient(135deg,#64748b,#334155)", accent: "#334155", lightBg: "#f8fafc" };

type Tab = "overview" | "subdepts" | "appointments" | "queue" | "patients" | "reports" | "analytics" | "dept-info";

/* ─── helpers ─── */
const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtTime = (t?: string) => t ? t.slice(0, 5) : "—";
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short" });
const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmt12 = (t: string) => { const [h,m] = t.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; };

/* ─────────────────────────────────────────────────────────────────
   RESCHEDULE MODAL
───────────────────────────────────────────────────────────────── */
function RescheduleModal({ appt, onClose, onConfirm }: { appt: any; onClose: () => void; onConfirm: (date: string, time: string) => void }) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const [newDate, setNewDate]           = useState(toLocalDateStr(tomorrow));
  const [selectedTime, setSelectedTime] = useState("");
  const [allSlots, setAllSlots]         = useState<string[]>([]);
  const [bookedSlots, setBookedSlots]   = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [noAvailability, setNoAvailability] = useState(false);
  const [slotErr, setSlotErr]           = useState("");
  const [err, setErr]                   = useState("");
  const [saving, setSaving]             = useState(false);

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
        let all: string[] = r.data?.allSlots || r.data?.slots || [];
        let booked: string[] = r.data?.bookedSlots || [];
        if (isSameDate(date)) booked = booked.filter((s: string) => s !== appt.timeSlot);
        const isToday = date === toLocalDateStr(new Date());
        if (isToday) {
          const now = new Date();
          const nowMins = now.getHours() * 60 + now.getMinutes();
          all   = all.filter(s   => { const [h,m] = s.split(":").map(Number); return h*60+m > nowMins; });
          booked = booked.filter(s => { const [h,m] = s.split(":").map(Number); return h*60+m > nowMins; });
        }
        if (!all.length) setNoAvailability(true);
        else { setAllSlots(all); setBookedSlots(booked); }
      } else {
        setSlotErr(r.message || "Could not load slots.");
      }
    } catch { setSlotErr("Network error loading slots."); }
    finally { setSlotsLoading(false); }
  }, [appt.doctorId, appt.timeSlot, appt.appointmentDate]); // eslint-disable-line

  useEffect(() => { if (newDate) fetchSlots(newDate); }, [newDate, fetchSlots]);

  const handleConfirm = () => {
    if (!newDate) { setErr("Please select a date."); return; }
    if (!selectedTime) { setErr("Please select a time slot."); return; }
    setSaving(true);
    onConfirm(newDate, selectedTime);
  };

  const availableSlots = allSlots.filter(s => !bookedSlots.includes(s));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(4px)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,.18)", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>Reschedule Appointment</div>
            <div style={{ fontSize:11, color: "#64748b" }}>{appt.patient?.name} &nbsp;·&nbsp; {appt.doctor?.name}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexShrink: 0 }}><X size={14} /></button>
        </div>

        {/* Current appointment info */}
        <div style={{ background: TEAL_LIGHT, borderRadius: 12, padding: "12px 14px", marginBottom: 20, border: `1px solid #B3E0E0` }}>
          <div style={{ fontSize:10, fontWeight: 700, color: TEAL2, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Current Appointment</div>
          <div style={{ fontSize:12, fontWeight: 600, color: TEAL2 }}>
            {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—"} &nbsp;at&nbsp; {fmt12(appt.timeSlot || "00:00")}
          </div>
        </div>

        {/* Date picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Select New Date</label>
          <input type="date" value={newDate} min={toLocalDateStr(new Date())}
            onChange={e => { setNewDate(e.target.value); setErr(""); }}
            style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid #B3E0E0`, background: "#f8fafc", fontSize:13, color: "#334155", outline: "none", boxSizing: "border-box", cursor: "pointer" }}
          />
        </div>

        {/* Slots */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Available Time Slots</label>
            {!slotsLoading && allSlots.length > 0 && (
              <span style={{ fontSize:10, color: TEAL, fontWeight: 600, background: TEAL_LIGHT, padding: "2px 8px", borderRadius: 100, border: "1px solid #B3E0E0" }}>
                {availableSlots.length} available
              </span>
            )}
          </div>

          {slotsLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 0", color: "#94a3b8", fontSize:12 }}>
              <Loader2 size={16} style={{ animation: "cl-spin .7s linear infinite" }} /> Loading doctor schedule…
            </div>
          ) : slotErr ? (
            <div style={{ fontSize:11, color: "#ef4444", fontWeight: 600, padding: "12px", background: "#fff5f5", borderRadius: 9, border: "1px solid #fecaca" }}>{slotErr}</div>
          ) : noAvailability ? (
            <div style={{ fontSize:12, color: "#f59e0b", fontWeight: 600, padding: "14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", textAlign: "center" }}>
              Doctor is not available on this day. Please choose another date.
            </div>
          ) : allSlots.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {allSlots.map(slot => {
                const isBooked   = bookedSlots.includes(slot);
                const isSelected = selectedTime === slot;
                return (
                  <button key={slot} disabled={isBooked}
                    onClick={() => { if (!isBooked) { setSelectedTime(slot); setErr(""); } }}
                    style={{
                      padding: "9px 6px", borderRadius: 9, position: "relative",
                      border: isSelected ? `2px solid ${TEAL}` : isBooked ? "1px solid #e2e8f0" : "1.5px solid #B3E0E0",
                      background: isSelected ? TEAL : isBooked ? "#f1f5f9" : TEAL_LIGHT,
                      color: isSelected ? "#fff" : isBooked ? "#cbd5e1" : TEAL2,
                      fontSize:11, fontWeight: 700,
                      cursor: isBooked ? "not-allowed" : "pointer",
                      textDecoration: isBooked ? "line-through" : "none",
                      transition: "all .15s",
                    }}>
                    {slot}
                    {isBooked && (
                      <span style={{ position: "absolute", top: -6, right: -4, fontSize:9, background: "#ef4444", color: "#fff", borderRadius: 100, padding: "1px 4px", fontWeight: 700 }}>Full</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}

          {selectedTime && (
            <div style={{ marginTop: 10, fontSize:11, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <CheckCircle size={13} /> Selected: {fmt12(selectedTime)}
            </div>
          )}
        </div>

        {err && <div style={{ fontSize:11, color: "#ef4444", marginBottom: 12, fontWeight: 600 }}>{err}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={saving}
            style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: `2px solid ${TEAL}`, background: "#fff", color: TEAL, fontSize:12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={saving || !selectedTime}
            style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: saving || !selectedTime ? "#94a3b8" : TEAL, color: "#fff", fontSize:12, fontWeight: 700, cursor: saving || !selectedTime ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {saving
              ? <><Loader2 size={13} style={{ animation: "cl-spin .7s linear infinite" }} /> Saving…</>
              : <><RefreshCw size={13} /> Confirm Reschedule</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildWeekData(appointments: any[]) {
  const days: Record<string, { day: string; booked: number; completed: number; cancelled: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = { day: dayLabel(key), booked: 0, completed: 0, cancelled: 0 };
  }
  for (const a of appointments) {
    const key = (a.appointmentDate || "").slice(0, 10);
    if (days[key]) {
      days[key].booked++;
      if (a.status === "COMPLETED") days[key].completed++;
      if (a.status === "CANCELLED" || a.status === "NO_SHOW") days[key].cancelled++;
    }
  }
  return Object.values(days);
}

/* ══════════════════════════════════════════════════════════════
   Page root
══════════════════════════════════════════════════════════════ */
export default function ClinicalDashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>}>
      <ClinicalDashboard />
    </Suspense>
  );
}

function ClinicalDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "overview";
  const [deptProfile, setDeptProfile] = useState<any>(null);

  useEffect(() => {
    fetch("/api/parentdept/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setDeptProfile(d.data); })
      .catch(() => {});
  }, []);

  const navTo = (t: Tab) => router.push(`/clinical/dashboard${t !== "overview" ? `?tab=${t}` : ""}`, { scroll: false });

  /* sub-dept detail view */
  const sdId = searchParams.get("subdept");
  if (tab === "subdepts" && sdId) {
    return <SubDeptDetail subDeptId={sdId} onBack={() => router.push("/clinical/dashboard?tab=subdepts", { scroll: false })} />;
  }

  return (
    <>
      {(tab === "reports" || tab === "analytics") && <ReportsPanel />}
      {tab === "overview"      && <OverviewTab deptProfile={deptProfile} onNavTo={navTo} />}
      {tab === "subdepts"      && !sdId && <SubDeptsTab onView={id => router.push(`/clinical/dashboard?tab=subdepts&subdept=${id}`, { scroll: false })} />}
      {tab === "appointments"  && <AppointmentsTab deptProfile={deptProfile} />}
      {tab === "queue"         && <QueueTab deptProfile={deptProfile} />}
      {tab === "patients"      && <PatientsTab deptProfile={deptProfile} />}
      {tab === "dept-info"     && <DeptInfoTab deptProfile={deptProfile} />}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════════════════════ */
function OverviewTab({ deptProfile, onNavTo }: { deptProfile: any; onNavTo: (t: Tab) => void }) {
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [appts, setAppts]       = useState<any[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [ptStats, setPtStats]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [deptId, setDeptId]     = useState<string | null>(deptProfile?.id || null);

  useEffect(() => {
    if (deptProfile?.id) { setDeptId(deptProfile.id); return; }
    fetch("/api/parentdept/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.id) setDeptId(d.data.id); })
      .catch(() => {});
  }, [deptProfile?.id]);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [sdRes, apRes, ptRes] = await Promise.all([
        fetch("/api/parentdept/subdepartments", { credentials: "include" }).then(r => r.json()),
        fetch(`/api/appointments?limit=100&departmentId=${id}&sortBy=appointmentDate&sortOrder=desc`, { credentials: "include" }).then(r => r.json()),
        fetch("/api/patients?limit=1", { credentials: "include" }).then(r => r.json()),
      ]);
      if (sdRes.success) setSubDepts(sdRes.data || []);
      if (apRes.success) {
        setAppts(apRes.data?.data || []);
        setStats(apRes.data?.stats || null);
      }
      if (ptRes.success) setPtStats(ptRes.data?.stats || null);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (deptId) load(deptId); }, [deptId, load]);

  const activeSD = subDepts.filter(s => s.isActive).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppts = appts.filter(a => (a.appointmentDate || "").slice(0, 10) === todayStr);
  const todayCompleted = todayAppts.filter(a => a.status === "COMPLETED").length;
  const todayRevenue = todayAppts.reduce((s, a) => s + (a.consultationFee || 0), 0);
  const weekData = buildWeekData(appts);

  /* pie data from sub-dept referrals */
  const pieData = subDepts
    .filter(s => (s._count?.appointments || 0) > 0)
    .map(s => ({ name: s.name, value: s._count?.appointments || 0 }));
  if (pieData.length === 0) pieData.push({ name: "No data", value: 1 });

  /* status breakdown */
  const statusCount: Record<string, number> = {};
  for (const a of appts) { statusCount[a.status] = (statusCount[a.status] || 0) + 1; }

  const statCards = [
    { label: "Sub-Departments",     value: loading ? "—" : activeSD,                                          sub: `${subDepts.length} total`,               Icon: Building2 },
    { label: "Today's Appointments", value: loading ? "—" : todayAppts.length,                                sub: `${todayCompleted} completed`,            Icon: CalendarDays },
    { label: "Total Patients",       value: loading ? "—" : (ptStats?.total ?? (stats?.totalPatients ?? "—")), sub: "registered",                             Icon: Users },
    { label: "Today's Revenue",      value: loading ? "—" : `₹${todayRevenue.toLocaleString("en-IN")}`,       sub: `${stats?.totalAppointments ?? "—"} total appts`, Icon: IndianRupee },
  ];

  return (
    <>
      {/* Dept Banner */}
      <div className="cl-dept-banner" style={{ marginBottom: 24 }}>
        <div className="cl-dept-banner-ic"><Stethoscope size={26} color="#fff" /></div>
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <div className="cl-dept-banner-name">{deptProfile?.name || "Clinical Department"}</div>
          <div className="cl-dept-banner-sub">{deptProfile?.description || "Clinical Department Head Dashboard"}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <div className="cl-dept-badge"><Activity size={10} />CLINICAL</div>
            {deptProfile?.code && <div className="cl-dept-badge">Code: {deptProfile.code}</div>}
            <div className="cl-dept-badge" style={{ background: deptProfile?.isActive ? "rgba(16,185,129,.25)" : "rgba(239,68,68,.25)" }}>
              {deptProfile?.isActive ? "● Active" : "● Inactive"}
            </div>
          </div>
        </div>
        <button className="cl-btn-ghost" style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", flexShrink: 0 }} onClick={() => deptId && load(deptId)}>
          <RefreshCw size={13} style={loading ? { animation: "cl-spin .7s linear infinite" } : {}} />
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="cl-stats">
        {statCards.map((s, i) => (
          <div key={i} className="cl-sc">
            <div className="cl-sc-ic" style={{ background: TEAL_LIGHT }}>
              <s.Icon size={20} color={TEAL} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="cl-sc-lbl">{s.label}</div>
              <div className="cl-sc-val">{s.value}</div>
              <div className="cl-sc-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="cl-charts">
        {/* 7-day Appointment Trend */}
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <div className="cl-card-title">7-Day Appointment Trend</div>
              <div className="cl-card-sub">Booked vs Completed vs Cancelled</div>
            </div>
            <button className="cl-btn-ghost" style={{ fontSize:10, padding: "5px 10px" }} onClick={() => onNavTo("appointments")}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="cl-card-body" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize:10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize:10, borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}
                  labelStyle={{ fontWeight: 700, color: "#1e293b" }}
                />
                <Legend wrapperStyle={{ fontSize:10, paddingTop: 8 }} />
                <Bar dataKey="booked"    name="Booked"    fill={TEAL}      radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="completed" name="Completed" fill="#10b981"   radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#f87171"   radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sub-Dept Referral Distribution */}
        <div className="cl-card">
          <div className="cl-card-head">
            <div>
              <div className="cl-card-title">Sub-Dept Referrals</div>
              <div className="cl-card-sub">Distribution by unit</div>
            </div>
          </div>
          <div className="cl-card-body" style={{ height: 230, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_: any, idx: number) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize:10, borderRadius: 10, border: "1px solid #e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", justifyContent: "center", marginTop: 4 }}>
              {pieData.filter(d => d.name !== "No data").map((d: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize:10, color: "#64748b" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Status Breakdown */}
      {Object.keys(statusCount).length > 0 && (
        <div className="cl-card" style={{ marginBottom: 22 }}>
          <div className="cl-card-head">
            <div className="cl-card-title">Appointment Status Breakdown</div>
          </div>
          <div className="cl-card-body">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {Object.entries(statusCount).map(([st, count]) => {
                const m = STATUS_META[st] || { label: st, cls: "cl-badge-gray" };
                const pct = Math.round((count / appts.length) * 100);
                return (
                  <div key={st} style={{ flex: "1 1 130px", background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span className={`cl-badge ${m.cls}`}>{m.label}</span>
                      <span style={{ fontSize:10, color: "#94a3b8" }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize:20, fontWeight: 800, color: "#1e293b" }}>{count}</div>
                    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 4, marginTop: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: TEAL, borderRadius: 4, transition: "width 1s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Departments Quick Grid */}
      {subDepts.length > 0 && (
        <>
          <div className="cl-section-title">
            <div className="cl-section-title-dot" />
            Sub-Departments
            <span style={{ fontSize:10, color: "#94a3b8", fontWeight: 400 }}>({activeSD} active)</span>
          </div>
          <div className="cl-sd-grid">
            {subDepts.filter(s => s.isActive).map(sd => {
              const m = sdMeta(sd.type);
              return (
                <div
                  key={sd.id}
                  className="cl-sd-card"
                  onClick={() => window.location.href = `/clinical/dashboard?tab=subdepts&subdept=${sd.id}`}
                  style={{ borderColor: "#B3E0E0" }}
                >
                  <div className="cl-sd-strip" style={{ background: m.gradient }} />
                  <div className="cl-sd-body">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: m.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Stethoscope size={16} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="cl-sd-name">{sd.name}</div>
                        <div className="cl-sd-type" style={{ color: m.accent }}>{sd.type?.replace(/_/g, " ")}</div>
                      </div>
                      <ChevronRight size={14} color="#94a3b8" />
                    </div>
                    <div className="cl-sd-stats">
                      <div className="cl-sd-stat" style={{ background: m.lightBg }}>
                        <div className="cl-sd-stat-v" style={{ color: m.accent }}>{sd._count?.procedures || 0}</div>
                        <div className="cl-sd-stat-l">Procedures</div>
                      </div>
                      <div className="cl-sd-stat" style={{ background: m.lightBg }}>
                        <div className="cl-sd-stat-v" style={{ color: m.accent }}>{sd._count?.appointments || 0}</div>
                        <div className="cl-sd-stat-l">Referrals</div>
                      </div>
                    </div>
                    {sd.hodStaffName && (
                      <div style={{ marginTop: 10, fontSize:10, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                        <UserCheck size={10} color="#94a3b8" /> {sd.hodStaffName}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Recent Appointments */}
      <div className="cl-section-title">
        <div className="cl-section-title-dot" />
        Recent Appointments
        <button className="cl-btn-ghost" style={{ marginLeft: "auto", fontSize:10, padding: "4px 10px" }} onClick={() => onNavTo("appointments")}>
          View All <ChevronRight size={11} />
        </button>
      </div>
      <div className="cl-card">
        <div className="cl-tbl-wrap">
          <table className="cl-tbl">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                  <Loader2 size={16} style={{ animation: "cl-spin .7s linear infinite", verticalAlign: "middle", marginRight: 8 }} />Loading…
                </td></tr>
              ) : appts.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No appointments found</td></tr>
              ) : appts.slice(0, 10).map(a => {
                const sm = STATUS_META[a.status] || { label: a.status, cls: "cl-badge-gray" };
                return (
                  <tr key={a.id}>
                    <td><span className="cl-td-name">{a.patient?.name || "—"}</span><div style={{ fontSize:10, color: "#94a3b8" }}>{a.patient?.patientId}</div></td>
                    <td>{a.doctor?.name || "—"}</td>
                    <td>{a.appointmentDate ? fmt(a.appointmentDate) : "—"}</td>
                    <td>{fmtTime(a.timeSlot)}</td>
                    <td><span className="cl-badge cl-badge-gray">{a.type?.replace(/_/g, " ") || "—"}</span></td>
                    <td><span className={`cl-badge ${sm.cls}`}>{sm.label}</span></td>
                    <td style={{ fontWeight: 600 }}>{a.consultationFee ? `₹${a.consultationFee}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   APPOINTMENTS TAB — full CRUD + sort + multi-select + export
══════════════════════════════════════════════════════════════ */
function AppointmentsTab({ deptProfile }: { deptProfile: any }) {
  const [appts, setAppts]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deptId, setDeptId]       = useState<string | null>(deptProfile?.id || null);
  const [filter, setFilter]       = useState("ALL");
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState("appointmentDate");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [viewAppt, setViewAppt]   = useState<any>(null);
  const [editAppt, setEditAppt]   = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget]         = useState<any>(null);
  const [hardDeleting, setHardDeleting]         = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<any>(null);
  const [rescheduleAlert, setRescheduleAlert]   = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (deptProfile?.id) { setDeptId(deptProfile.id); return; }
    fetch("/api/parentdept/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.id) setDeptId(d.data.id); })
      .catch(() => {});
  }, [deptProfile?.id]);

  const load = useCallback((id: string) => {
    setLoading(true);
    fetch(`/api/appointments?limit=300&departmentId=${id}&sortBy=appointmentDate&sortOrder=desc`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setAppts(d.data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (deptId) load(deptId); }, [deptId, load]);

  /* ── derived stats ── */
  const counts = useMemo(() => {
    const c = { total: appts.length, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const a of appts) {
      if (a.status === "SCHEDULED")  c.scheduled++;
      else if (a.status === "CONFIRMED") c.confirmed++;
      else if (a.status === "COMPLETED") c.completed++;
      else if (a.status === "CANCELLED" || a.status === "NO_SHOW") c.cancelled++;
    }
    return c;
  }, [appts]);

  /* ── filtered + sorted ── */
  const filtered = useMemo(() => {
    let list = [...appts];
    if (filter !== "ALL") list = list.filter(a => a.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.patient?.name || "").toLowerCase().includes(q) ||
        (a.doctor?.name  || "").toLowerCase().includes(q) ||
        (a.patient?.patientId || "").toLowerCase().includes(q)
      );
    }
    if (dateFrom) list = list.filter(a => (a.appointmentDate || "") >= dateFrom);
    if (dateTo)   list = list.filter(a => (a.appointmentDate || "") <= dateTo);
    list.sort((a, b) => {
      let va: any, vb: any;
      if (sortBy === "patient")  { va = a.patient?.name || ""; vb = b.patient?.name || ""; }
      else if (sortBy === "doctor")   { va = a.doctor?.name  || ""; vb = b.doctor?.name  || ""; }
      else if (sortBy === "status")   { va = a.status || ""; vb = b.status || ""; }
      else if (sortBy === "fee")      { va = a.consultationFee || 0; vb = b.consultationFee || 0; }
      else { va = a.appointmentDate || ""; vb = b.appointmentDate || ""; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return list;
  }, [appts, filter, search, dateFrom, dateTo, sortBy, sortDir]);

  /* ── helpers ── */
  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };
  const SortIco = ({ col }: { col: string }) => sortBy !== col ? <span style={{ opacity:.3 }}><ChevronUp size={10} /></span>
    : sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;

  const allSel = filtered.length > 0 && filtered.every(a => selected.has(a.id));
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(filtered.map(a => a.id)));
  const toggleOne = (id: string) => setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  /* ── export ── */
  const exportCSV = (rows: any[]) => {
    const hdr = "Token,Patient,Patient ID,Doctor,Date,Time,Type,Status,Fee\n";
    const body = rows.map(a => [
      a.tokenNumber || "",
      `"${a.patient?.name || ""}"`,
      a.patient?.patientId || "",
      `"${a.doctor?.name || ""}"`,
      a.appointmentDate ? fmt(a.appointmentDate) : "",
      fmtTime(a.timeSlot),
      a.type || "",
      a.status || "",
      a.consultationFee || 0,
    ].join(",")).join("\n");
    const blob = new Blob([hdr + body], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `appointments-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── CRUD ── */
  const saveStatus = async () => {
    if (!editAppt || !editStatus) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/appointments/${editAppt.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ status: editStatus }),
      });
      if (r.ok) setAppts(p => p.map(a => a.id === editAppt.id ? { ...a, status: editStatus } : a));
      setEditAppt(null);
    } finally { setSaving(false); }
  };

  const cancelOne = async (id: string) => {
    setDeleting(p => new Set([...p, id]));
    try {
      await fetch(`/api/appointments/${id}`, { method: "DELETE", credentials: "include" });
      setAppts(p => p.map(a => a.id === id ? { ...a, status: "CANCELLED" } : a));
    } finally { setDeleting(p => { const s = new Set(p); s.delete(id); return s; }); }
  };

  const bulkCancel = async () => {
    await Promise.all([...selected].map(id => cancelOne(id)));
    setSelected(new Set());
  };

  const doReschedule = async (newDate: string, newTime: string) => {
    if (!rescheduleTarget) return;
    try {
      const r = await fetch(`/api/appointments/${rescheduleTarget.id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESCHEDULED", appointmentDate: newDate, timeSlot: newTime }),
      }).then(x => x.json());
      if (r.success) {
        setAppts(p => p.map(a => a.id === rescheduleTarget.id
          ? { ...a, status: "RESCHEDULED", appointmentDate: newDate, timeSlot: newTime }
          : a
        ));
        setRescheduleAlert({ ok: true, text: `Rescheduled to ${new Date(newDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${fmt12(newTime)}` });
        setTimeout(() => setRescheduleAlert(null), 5000);
      } else {
        setRescheduleAlert({ ok: false, text: r.message || "Failed to reschedule." });
        setTimeout(() => setRescheduleAlert(null), 5000);
      }
    } finally {
      setRescheduleTarget(null);
    }
  };

  const hardDeleteOne = async () => {
    if (!deleteTarget) return;
    setHardDeleting(true);
    try {
      const r = await fetch(`/api/appointments/${deleteTarget.id}/hard-delete`, {
        method: "DELETE", credentials: "include",
      });
      if (r.ok) {
        setAppts(p => p.filter(a => a.id !== deleteTarget.id));
        setSelected(p => { const s = new Set(p); s.delete(deleteTarget.id); return s; });
      }
    } finally {
      setHardDeleting(false);
      setDeleteTarget(null);
    }
  };

  const STAT_CARDS = [
    { label: "Total",             value: counts.total,     Icon: CalendarDays,  bg: TEAL_LIGHT, color: TEAL },
    { label: "Scheduled",         value: counts.scheduled, Icon: ClipboardList, bg: "#eff6ff",  color: "#3b82f6" },
    { label: "Completed",         value: counts.completed, Icon: CheckCircle2,  bg: "#f0fdf4",  color: "#16a34a" },
    { label: "Cancelled / No-Show", value: counts.cancelled, Icon: X,           bg: "#fef2f2",  color: "#ef4444" },
  ];

  return (
    <>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div className="cl-section-title" style={{ marginBottom: 0 }}>
          <div className="cl-section-title-dot" />Appointments
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {selected.size > 0 && (
            <>
              <button className="cl-btn-ghost" style={{ color: "#ef4444", border: "1px solid #fecaca" }} onClick={bulkCancel}>
                <Trash2 size={12} /> Cancel {selected.size}
              </button>
              <button className="cl-btn-ghost" onClick={() => exportCSV(filtered.filter(a => selected.has(a.id)))}>
                <Download size={12} /> Export {selected.size}
              </button>
            </>
          )}
          <button className="cl-btn-ghost" onClick={() => exportCSV(filtered)}>
            <Download size={12} /> Export CSV
          </button>
          <button className="cl-btn-ghost" onClick={() => deptId && load(deptId)}>
            <RefreshCw size={12} style={loading ? { animation: "cl-spin .7s linear infinite" } : {}} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="cl-stats" style={{ marginBottom: 20 }}>
        {STAT_CARDS.map((s, i) => (
          <div key={i} className="cl-sc">
            <div className="cl-sc-ic" style={{ background: s.bg }}><s.Icon size={16} color={s.color} /></div>
            <div>
              <div className="cl-sc-lbl">{s.label}</div>
              <div className="cl-sc-val">{loading ? "—" : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {["ALL", "SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "5px 11px", borderRadius: 7,
              border: `1.5px solid ${filter === f ? TEAL : "#e2e8f0"}`,
              background: filter === f ? TEAL_LIGHT : "#fff",
              color: filter === f ? TEAL2 : "#64748b",
              fontSize:10, fontWeight: 600, cursor: "pointer" }}>
            {f === "ALL" ? `All (${appts.length})` : `${f[0]+f.slice(1).toLowerCase()} (${appts.filter(a => a.status === f).length})`}
          </button>
        ))}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Patient / doctor / ID…"
            style={{ padding: "7px 12px 7px 28px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:11, outline: "none", width: 190 }}
            onFocus={e => (e.target.style.borderColor = TEAL)}
            onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
          <Users size={11} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:11, outline: "none" }}
          onFocus={e => (e.target.style.borderColor = TEAL)} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
        <span style={{ fontSize:10, color: "#94a3b8" }}>–</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:11, outline: "none" }}
          onFocus={e => (e.target.style.borderColor = TEAL)} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
        {(dateFrom || dateTo) && (
          <button className="cl-btn-ghost" style={{ padding: "5px 7px" }} onClick={() => { setDateFrom(""); setDateTo(""); }}>
            <X size={11} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="cl-card">
        <div className="cl-tbl-wrap">
          <table className="cl-tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={allSel} onChange={toggleAll} style={{ accentColor: TEAL, width: 14, height: 14 }} />
                </th>
                <th style={{ cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => toggleSort("appointmentDate")}>
                  Date &amp; Time <SortIco col="appointmentDate" />
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("patient")}>
                  Patient <SortIco col="patient" />
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("doctor")}>
                  Doctor <SortIco col="doctor" />
                </th>
                <th>Type</th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("status")}>
                  Status <SortIco col="status" />
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("fee")}>
                  Fee <SortIco col="fee" />
                </th>
                <th>#Token</th>
                <th style={{ width: 96, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                  <Loader2 size={16} style={{ animation: "cl-spin .7s linear infinite", verticalAlign: "middle", marginRight: 6 }} />Loading…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No appointments found</td></tr>
              ) : filtered.map(a => {
                const sm = STATUS_META[a.status] || { label: a.status, cls: "cl-badge-gray" };
                return (
                  <tr key={a.id} style={{ background: selected.has(a.id) ? "#f0faf9" : undefined }}>
                    <td>
                      <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleOne(a.id)} style={{ accentColor: TEAL, width: 14, height: 14 }} />
                    </td>
                    <td>
                      <div style={{ fontSize:11, fontWeight: 600, color: "#1e293b" }}>{a.appointmentDate ? fmt(a.appointmentDate) : "—"}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>{fmtTime(a.timeSlot)}</div>
                    </td>
                    <td>
                      <div className="cl-td-name">{a.patient?.name || "—"}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>{a.patient?.patientId}</div>
                    </td>
                    <td style={{ fontSize:11, color: "#475569" }}>{a.doctor?.name || "—"}</td>
                    <td><span className="cl-badge cl-badge-gray" style={{ fontSize:10 }}>{a.type?.replace(/_/g, " ") || "—"}</span></td>
                    <td><span className={`cl-badge ${sm.cls}`}>{sm.label}</span></td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{a.consultationFee ? `₹${a.consultationFee}` : "—"}</td>
                    <td style={{ color: "#94a3b8", fontSize:11 }}>#{a.tokenNumber || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                        <button title="View" onClick={() => setViewAppt(a)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px 5px", borderRadius: 6 }}>
                          <Eye size={14} />
                        </button>
                        <button title="Edit Status" onClick={() => { setEditAppt(a); setEditStatus(a.status); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: TEAL, padding: "4px 5px", borderRadius: 6 }}>
                          <Pencil size={14} />
                        </button>
                        {["SCHEDULED","CONFIRMED","RESCHEDULED"].includes(a.status) && (
                          <button title="Reschedule"
                            onClick={() => setRescheduleTarget(a)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#0891b2", padding: "4px 5px", borderRadius: 6 }}>
                            <RefreshCw size={14} />
                          </button>
                        )}
                        <button title="Cancel Appointment"
                          onClick={() => cancelOne(a.id)}
                          disabled={deleting.has(a.id) || a.status === "CANCELLED"}
                          style={{ background: "none", border: "none", cursor: a.status === "CANCELLED" ? "default" : "pointer",
                            color: deleting.has(a.id) ? "#94a3b8" : "#f59e0b", padding: "4px 5px", borderRadius: 6,
                            opacity: a.status === "CANCELLED" ? 0.3 : 1 }}>
                          {deleting.has(a.id)
                            ? <Loader2 size={14} style={{ animation: "cl-spin .7s linear infinite" }} />
                            : <X size={14} />}
                        </button>
                        <button title="Delete Permanently"
                          onClick={() => setDeleteTarget(a)}
                          style={{ background: "none", border: "none", cursor: "pointer",
                            color: "#ef4444", padding: "4px 5px", borderRadius: 6 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: "9px 18px", borderTop: "1px solid #f1f5f9", fontSize:10, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
            <span>Showing {filtered.length} of {appts.length} appointments</span>
            {selected.size > 0 && <span style={{ color: TEAL, fontWeight: 600 }}>{selected.size} selected</span>}
          </div>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewAppt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setViewAppt(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, maxHeight: "80vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize:14, fontWeight: 700, color: "#1e293b" }}>Appointment Details</div>
              <button onClick={() => setViewAppt(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
            </div>
            {([
              ["Patient", viewAppt.patient?.name],
              ["Patient ID", viewAppt.patient?.patientId],
              ["Doctor", viewAppt.doctor?.name],
              ["Date", viewAppt.appointmentDate ? fmt(viewAppt.appointmentDate) : null],
              ["Time", fmtTime(viewAppt.timeSlot)],
              ["Token", viewAppt.tokenNumber ? `#${viewAppt.tokenNumber}` : null],
              ["Type", viewAppt.type?.replace(/_/g, " ")],
              ["Status", viewAppt.status],
              ["Fee", viewAppt.consultationFee ? `₹${viewAppt.consultationFee}` : null],
              ["Notes", viewAppt.notes],
            ] as [string, string | null | undefined][]).map(([k, v]) => v ? (
              <div key={k} style={{ display: "flex", padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ width: 100, fontSize:10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", flexShrink: 0, paddingTop: 1 }}>{k}</div>
                <div style={{ fontSize:12, color: "#1e293b", fontWeight: 500 }}>{v}</div>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* ── Reschedule Alert toast ── */}
      {rescheduleAlert && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1100, background: rescheduleAlert.ok ? "#f0fdf4" : "#fff5f5", border: `1.5px solid ${rescheduleAlert.ok ? "#bbf7d0" : "#fecaca"}`, borderRadius: 12, padding: "12px 18px", boxShadow: "0 8px 24px rgba(0,0,0,.1)", display: "flex", alignItems: "center", gap: 10, maxWidth: 340 }}>
          {rescheduleAlert.ok
            ? <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} />
            : <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />}
          <span style={{ fontSize:12, fontWeight: 600, color: rescheduleAlert.ok ? "#15803d" : "#dc2626" }}>{rescheduleAlert.text}</span>
          <button onClick={() => setRescheduleAlert(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", marginLeft: "auto", padding: 2, flexShrink: 0 }}><X size={13} /></button>
        </div>
      )}

      {/* ── Reschedule Modal ── */}
      {rescheduleTarget && (
        <RescheduleModal
          appt={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onConfirm={doReschedule}
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => { if (!hardDeleting) setDeleteTarget(null); }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}
            onClick={e => e.stopPropagation()}>

            {/* Icon */}
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fff5f5", border: "1.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <AlertTriangle size={26} color="#ef4444" />
            </div>

            {/* Heading */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize:16, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>Delete Appointment?</div>
              <div style={{ fontSize:11.5, color: "#64748b", lineHeight: 1.65 }}>
                This will <strong>permanently remove</strong> this booking from all dashboards.<br />
                This action <strong style={{ color: "#ef4444" }}>cannot be undone</strong>.
              </div>
            </div>

            {/* Appointment summary */}
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", marginBottom: 22, border: "1px solid #e2e8f0" }}>
              {([
                ["Patient",    deleteTarget.patient?.name],
                ["Patient ID", deleteTarget.patient?.patientId],
                ["Doctor",     deleteTarget.doctor?.name],
                ["Date",       deleteTarget.appointmentDate ? fmt(deleteTarget.appointmentDate) : null],
                ["Time",       fmtTime(deleteTarget.timeSlot)],
                ["Token",      deleteTarget.tokenNumber ? `#${deleteTarget.tokenNumber}` : null],
                ["Status",     deleteTarget.status],
              ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize:10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{k}</span>
                  <span style={{ fontSize:11, fontWeight: 600, color: "#1e293b" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={hardDeleting}
                style={{ padding: "9px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", fontSize:12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
                Keep Appointment
              </button>
              <button
                onClick={hardDeleteOne}
                disabled={hardDeleting}
                style={{ padding: "9px 22px", borderRadius: 9, border: "none", background: hardDeleting ? "#fca5a5" : "#ef4444", color: "#fff", fontSize:12, fontWeight: 700, cursor: hardDeleting ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {hardDeleting
                  ? <><Loader2 size={13} style={{ animation: "cl-spin .7s linear infinite" }} /> Deleting…</>
                  : <><Trash2 size={13} /> Delete Permanently</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Status Modal ── */}
      {editAppt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setEditAppt(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 360 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Change Status</div>
            <div style={{ fontSize:11, color: "#64748b", marginBottom: 18 }}>
              {editAppt.patient?.name} — {editAppt.appointmentDate ? fmt(editAppt.appointmentDate) : "—"}
            </div>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", marginBottom: 18, background: "#fff", cursor: "pointer" }}>
              {["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"].map(s => (
                <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase().replace(/_/g, " ")}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="cl-btn-ghost" onClick={() => setEditAppt(null)}>Cancel</button>
              <button onClick={saveStatus} disabled={saving}
                style={{ padding: "8px 20px", borderRadius: 9, background: TEAL, color: "#fff", border: "none", fontSize:12, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   QUEUE TAB — table design with inline status actions
══════════════════════════════════════════════════════════════ */
function QueueTab({ deptProfile }: { deptProfile: any }) {
  const [all, setAll]           = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deptId, setDeptId]     = useState<string | null>(deptProfile?.id || null);
  const [search, setSearch]     = useState("");
  const [view, setView]         = useState<"pending" | "completed" | "all">("pending");
  const [updating, setUpdating] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateStr(new Date()));

  useEffect(() => {
    if (deptProfile?.id) { setDeptId(deptProfile.id); return; }
    fetch("/api/parentdept/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.id) setDeptId(d.data.id); })
      .catch(() => {});
  }, [deptProfile?.id]);

  const load = useCallback((id: string) => {
    setLoading(true);
    fetch(`/api/appointments?limit=500&departmentId=${id}&sortBy=appointmentDate&sortOrder=asc`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setAll(d.data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (deptId) load(deptId); }, [deptId, load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(p => ({ ...p, [id]: status }));
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ status }),
      });
      setAll(p => p.map(a => a.id === id ? { ...a, status } : a));
    } finally { setUpdating(p => { const n = { ...p }; delete n[id]; return n; }); }
  };

  /* ── date helpers ── */
  const todayStr    = toLocalDateStr(new Date());
  const tomorrowStr = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return toLocalDateStr(d); })();
  const dateLabel = selectedDate === todayStr ? "Today" : selectedDate === tomorrowStr ? "Tomorrow" : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  /* ── date-filtered base ── */
  const byDate = useMemo(() => all.filter(a => (a.appointmentDate || "").slice(0, 10) === selectedDate), [all, selectedDate]);

  /* ── stats (date-scoped) ── */
  const waiting   = byDate.filter(a => a.status === "SCHEDULED").length;
  const confirmed = byDate.filter(a => a.status === "CONFIRMED").length;
  const completed = byDate.filter(a => a.status === "COMPLETED").length;
  const noShow    = byDate.filter(a => a.status === "NO_SHOW").length;

  /* ── filtered ── */
  const filtered = useMemo(() => {
    let list = [...byDate];
    if (view === "pending")        list = list.filter(a => ["SCHEDULED", "CONFIRMED"].includes(a.status));
    else if (view === "completed") list = list.filter(a => ["COMPLETED", "NO_SHOW", "CANCELLED"].includes(a.status));
    else                           list = list.filter(a => !["COMPLETED", "NO_SHOW", "CANCELLED"].includes(a.status));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.patient?.name || "").toLowerCase().includes(q) ||
        (a.doctor?.name  || "").toLowerCase().includes(q) ||
        String(a.tokenNumber || "").includes(q)
      );
    }
    return list;
  }, [byDate, view, search]);

  const STAT_CARDS = [
    { label: "Waiting",    value: waiting,   bg: "#fffbeb",  color: "#b45309",  icon: <ClipboardList size={16} color="#b45309" /> },
    { label: "Confirmed",  value: confirmed, bg: TEAL_LIGHT, color: TEAL2,      icon: <CheckCircle2  size={16} color={TEAL2} /> },
    { label: "Completed",  value: completed, bg: "#f0fdf4",  color: "#16a34a",  icon: <CheckCircle2  size={16} color="#16a34a" /> },
    { label: "No-Show",    value: noShow,    bg: "#fef2f2",  color: "#ef4444",  icon: <X             size={16} color="#ef4444" /> },
  ];

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="cl-section-title" style={{ marginBottom: 4 }}>
            <div className="cl-section-title-dot" />Patient Queue
          </div>
          <div style={{ fontSize:10, color: "#94a3b8", paddingLeft: 14 }}>{dateLabel}</div>
        </div>
        <button className="cl-btn-ghost" onClick={() => deptId && load(deptId)}>
          <RefreshCw size={12} style={loading ? { animation: "cl-spin .7s linear infinite" } : {}} /> Refresh
        </button>
      </div>

      {/* Date selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedDate(todayStr)}
          style={{ padding: "6px 14px", borderRadius: 8,
            border: `1.5px solid ${selectedDate === todayStr ? TEAL : "#e2e8f0"}`,
            background: selectedDate === todayStr ? TEAL : "#fff",
            color: selectedDate === todayStr ? "#fff" : "#64748b",
            fontSize:11, fontWeight: 700, cursor: "pointer" }}>
          Today
        </button>
        <button
          onClick={() => setSelectedDate(tomorrowStr)}
          style={{ padding: "6px 14px", borderRadius: 8,
            border: `1.5px solid ${selectedDate === tomorrowStr ? TEAL : "#e2e8f0"}`,
            background: selectedDate === tomorrowStr ? TEAL : "#fff",
            color: selectedDate === tomorrowStr ? "#fff" : "#64748b",
            fontSize:11, fontWeight: 700, cursor: "pointer" }}>
          Tomorrow
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8,
            border: `1.5px solid ${selectedDate !== todayStr && selectedDate !== tomorrowStr ? TEAL : "#e2e8f0"}`,
            fontSize:11, outline: "none", color: "#334155", cursor: "pointer",
            background: selectedDate !== todayStr && selectedDate !== tomorrowStr ? TEAL_LIGHT : "#fff" }}
          onFocus={e => (e.target.style.borderColor = TEAL)}
          onBlur={e  => (e.target.style.borderColor = selectedDate !== todayStr && selectedDate !== tomorrowStr ? TEAL : "#e2e8f0")}
        />
        {selectedDate !== todayStr && (
          <button onClick={() => setSelectedDate(todayStr)}
            style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#94a3b8", fontSize:10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <X size={10} /> Clear
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="cl-stats" style={{ marginBottom: 20 }}>
        {STAT_CARDS.map((s, i) => (
          <div key={i} className="cl-sc">
            <div className="cl-sc-ic" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="cl-sc-lbl">{s.label}</div>
              <div className="cl-sc-val" style={{ color: s.color }}>{loading ? "—" : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        {(["pending", "completed", "all"] as const).map(v => {
          const label = v === "pending" ? `Pending (${waiting + confirmed})` : v === "completed" ? `Done (${completed + noShow})` : `All (${byDate.length})`;
          return (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "5px 12px", borderRadius: 7,
                border: `1.5px solid ${view === v ? TEAL : "#e2e8f0"}`,
                background: view === v ? TEAL_LIGHT : "#fff",
                color: view === v ? TEAL2 : "#64748b",
                fontSize:10, fontWeight: 600, cursor: "pointer" }}>
              {label}
            </button>
          );
        })}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Patient / token / doctor…"
            style={{ padding: "7px 12px 7px 28px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:11, outline: "none", width: 200 }}
            onFocus={e => (e.target.style.borderColor = TEAL)}
            onBlur={e  => (e.target.style.borderColor = "#e2e8f0")} />
          <Users size={11} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        </div>
      </div>

      {/* Table */}
      <div className="cl-card">
        <div className="cl-tbl-wrap">
          <table className="cl-tbl">
            <thead>
              <tr>
                <th style={{ width: 56 }}>Token</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Time</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                  <Loader2 size={16} style={{ animation: "cl-spin .7s linear infinite", verticalAlign: "middle", marginRight: 6 }} />Loading queue…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <CheckCircle2 size={36} color={TEAL} style={{ display: "block", margin: "0 auto 10px" }} />
                    <div style={{ fontSize:12, color: "#64748b" }}>
                      {view === "pending" ? "Queue is clear — no pending patients" : "No records for this filter"}
                    </div>
                  </div>
                </td></tr>
              ) : filtered.map((a, i) => {
                const sm       = STATUS_META[a.status] || { label: a.status, cls: "cl-badge-gray" };
                const isPending = ["SCHEDULED", "CONFIRMED"].includes(a.status);
                const isFirst   = view === "pending" && i === 0 && isPending;
                return (
                  <tr key={a.id} style={{ background: isFirst ? "#f0faf9" : undefined }}>
                    <td>
                      <div style={{ width: 34, height: 34, borderRadius: 8,
                        background: isFirst ? `linear-gradient(135deg,${TEAL},${TEAL2})` : TEAL_LIGHT,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize:12, fontWeight: 800, color: isFirst ? "#fff" : TEAL }}>
                        {a.tokenNumber || "—"}
                      </div>
                    </td>
                    <td>
                      <div className="cl-td-name">{a.patient?.name || "—"}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>{a.patient?.patientId}</div>
                    </td>
                    <td style={{ fontSize:11, color: "#475569" }}>Dr. {a.doctor?.name || "—"}</td>
                    <td style={{ fontSize:11, fontWeight: 600, color: "#1e293b" }}>{fmtTime(a.timeSlot)}</td>
                    <td><span className="cl-badge cl-badge-gray" style={{ fontSize:10 }}>{a.type?.replace(/_/g, " ") || "—"}</span></td>
                    <td><span className={`cl-badge ${sm.cls}`}>{sm.label}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {a.status === "SCHEDULED" && (
                          <button onClick={() => updateStatus(a.id, "CONFIRMED")} disabled={!!updating[a.id]}
                            style={{ padding: "4px 10px", borderRadius: 6, background: TEAL_LIGHT, color: TEAL2, border: `1px solid #B3E0E0`, fontSize:10, fontWeight: 600, cursor: "pointer" }}>
                            {updating[a.id] === "CONFIRMED" ? <Loader2 size={10} style={{ animation: "cl-spin .7s linear infinite", verticalAlign: "middle" }} /> : "Confirm"}
                          </button>
                        )}
                        {isPending && (
                          <>
                            <button onClick={() => updateStatus(a.id, "COMPLETED")} disabled={!!updating[a.id]}
                              style={{ padding: "4px 10px", borderRadius: 6, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontSize:10, fontWeight: 600, cursor: "pointer" }}>
                              {updating[a.id] === "COMPLETED" ? <Loader2 size={10} style={{ animation: "cl-spin .7s linear infinite", verticalAlign: "middle" }} /> : "Complete"}
                            </button>
                            <button onClick={() => updateStatus(a.id, "NO_SHOW")} disabled={!!updating[a.id]}
                              style={{ padding: "4px 10px", borderRadius: 6, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", fontSize:10, fontWeight: 600, cursor: "pointer" }}>
                              No-Show
                            </button>
                          </>
                        )}
                        {!isPending && <span style={{ fontSize:10, color: "#94a3b8", fontStyle: "italic" }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {byDate.length > 0 && (
          <div style={{ padding: "9px 18px", borderTop: "1px solid #f1f5f9", fontSize:10, color: "#94a3b8" }}>
            Showing {filtered.length} of {byDate.length} appointments · {dateLabel}
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PATIENTS TAB — complete list of patients for this department
══════════════════════════════════════════════════════════════ */
function PatientsTab({ deptProfile }: { deptProfile: any }) {
  const [deptId, setDeptId] = useState<string | null>(deptProfile?.id || null);

  useEffect(() => {
    if (deptProfile?.id) { setDeptId(deptProfile.id); return; }
    fetch("/api/parentdept/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.id) setDeptId(d.data.id); })
      .catch(() => {});
  }, [deptProfile?.id]);

  if (!deptId) return (
    <div style={{ padding: "80px 0", textAlign: "center" }}>
      <Loader2 size={32} color={TEAL} style={{ animation: "cl-spin 1s linear infinite", margin: "0 auto" }} />
      <p style={{ marginTop: 14, color: "#64748b", fontSize:13 }}>Loading department context...</p>
    </div>
  );

  return <PatientsManagementPanel departmentId={deptId} />;
}

/* ══════════════════════════════════════════════════════════════
   SUB-DEPARTMENTS TAB
══════════════════════════════════════════════════════════════ */
function SubDeptsTab({ onView }: { onView: (id: string) => void }) {
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/parentdept/subdepartments", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setSubDepts(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (e: React.MouseEvent, sd: any) => {
    e.stopPropagation();
    setToggling(sd.id);
    await fetch("/api/parentdept/subdepartments", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sd.id, isActive: !sd.isActive }),
    });
    setToggling(null);
    load();
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div className="cl-section-title" style={{ marginBottom: 0 }}>
          <div className="cl-section-title-dot" />Sub-Departments
          <span style={{ fontSize:10, color: "#94a3b8", fontWeight: 400 }}>({subDepts.filter(s => s.isActive).length} active)</span>
        </div>
        <button className="cl-btn-ghost" onClick={load}>
          <RefreshCw size={13} style={loading ? { animation: "cl-spin .7s linear infinite" } : {}} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="cl-empty"><Loader2 size={24} style={{ animation: "cl-spin .7s linear infinite" }} className="cl-empty-icon" /></div>
      ) : subDepts.length === 0 ? (
        <div className="cl-empty">
          <Building2 size={40} className="cl-empty-icon" />
          <div style={{ fontSize:13, fontWeight: 600, color: "#1e293b", marginTop: 8 }}>No sub-departments</div>
          <div style={{ fontSize:11, marginTop: 4 }}>Ask hospital admin to create sub-departments under this department</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {subDepts.map(sd => {
            const m = sdMeta(sd.type);
            const off = !sd.isActive;
            return (
              <div key={sd.id}
                onClick={() => !off && onView(sd.id)}
                style={{ 
                  background: off ? "#fafafa" : "#fff", 
                  borderRadius: 16, 
                  border: `1px solid ${off ? "#e2e8f0" : "#f1f5f9"}`, 
                  overflow: "hidden", 
                  cursor: off ? "default" : "pointer", 
                  transition: "all .2s", 
                  opacity: off ? 0.65 : 1
                }}
                onMouseEnter={e => { if (!off) { e.currentTarget.style.borderColor = m.accent; e.currentTarget.style.background = "#f8fafc"; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.background = "#fff"; }}
              >
                <div style={{ padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: off ? "#f1f5f9" : m.lightBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: off ? "#94a3b8" : m.accent }}>
                      <Stethoscope size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize:15, fontWeight: 700, color: off ? "#94a3b8" : "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sd.name}</div>
                      <div style={{ fontSize:10, color: off ? "#cbd5e1" : m.accent, fontWeight: 600, marginTop: 1, textTransform: "uppercase", letterSpacing: ".02em" }}>{sd.code ? `${sd.code} · ` : ""}{sd.type?.replace(/_/g, " ")}</div>
                    </div>
                    <button onClick={e => toggle(e, sd)} disabled={toggling === sd.id}
                      style={{ background: "none", border: "none", cursor: "pointer", color: sd.isActive ? m.accent : "#94a3b8", padding: 4, flexShrink: 0, opacity: .6 }}>
                      {toggling === sd.id
                        ? <Loader2 size={18} style={{ animation: "cl-spin .7s linear infinite" }} />
                        : <Power size={18} />}
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                    {[
                      { v: sd._count?.procedures || 0, l: "Procedures" },
                      { v: sd._count?.procedureRecords || 0, l: "Records" },
                      { v: sd._count?.appointments || 0, l: "Referrals" },
                    ].map((s, i) => (
                      <div key={i} style={{ background: off ? "#f8fafc" : "#f8fafc", borderRadius: 12, padding: "12px 8px", textAlign: "center", border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize:18, fontWeight: 800, color: off ? "#cbd5e1" : "#1e293b" }}>{s.v}</div>
                        <div style={{ fontSize:9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginTop: 1 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                    {sd.hodStaffName ? (
                      <div style={{ fontSize:11, color: "#64748b", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                        <UserCheck size={13} color="#94a3b8" /> {sd.hodStaffName}
                      </div>
                    ) : <div style={{ fontSize:11, color: "#cbd5e1" }}>No HOD</div>}
                    {sd.isActive && <div style={{ fontSize:11, fontWeight: 700, color: m.accent, display: "flex", alignItems: "center", gap: 4 }}>View <ChevronRight size={14} /></div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-DEPT DETAIL (reuse from parentdept/dashboard pattern)
══════════════════════════════════════════════════════════════ */
function SubDeptDetail({ subDeptId, onBack }: { subDeptId: string; onBack: () => void }) {
  const [data, setData]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState<"overview" | "queue" | "procedures" | "records">("overview");

  const load = useCallback(async (refresh = false) => {
    if (!refresh) setLoading(true);
    try {
      const r = await fetch(`/api/parentdept/subdepartments/${subDeptId}/dashboard`, { credentials: "include" }).then(x => x.json());
      if (r.success) { setData(r.data); setError(""); }
      else setError(r.message || "Failed to load");
    } catch { setError("Network error"); }
    setLoading(false);
  }, [subDeptId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const iv = setInterval(() => load(true), 30000);
    return () => clearInterval(iv);
  }, [load]);

  if (loading) return <div className="cl-empty"><Loader2 size={24} className="cl-spin cl-empty-icon" style={{ display: "block" }} /><div style={{ marginTop: 12, fontSize:12, color: "#94a3b8" }}>Loading…</div></div>;
  if (error || !data) return <div style={{ padding: 40, textAlign: "center" }}><div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div><button className="cl-btn-primary" onClick={onBack}>← Back</button></div>;

  const { profile, stats, queue = [], completedList = [] } = data;
  const m = sdMeta(profile?.type);

  const SECS = [
    { id: "overview",   label: `Overview` },
    { id: "queue",      label: `Queue (${stats.pendingQueue})` },
    { id: "procedures", label: `Procedures (${stats.totalProcedures})` },
    { id: "records",    label: `Records (${stats.totalRecords})` },
  ];

  return (
    <>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize:12, fontWeight: 500, marginBottom: 16, padding: "6px 0" }}
        onMouseEnter={e => { e.currentTarget.style.color = m.accent; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; }}>
        <ArrowLeft size={16} /> Back to Sub-Departments
      </button>

      {/* Hero */}
      <div style={{ background: m.gradient, borderRadius: 18, padding: "22px 26px", marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Stethoscope size={24} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize:10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", opacity: .75, marginBottom: 3 }}>{profile.type?.replace(/_/g, " ")} Sub-Dept</div>
            <h2 style={{ fontSize:19, fontWeight: 800, lineHeight: 1.2 }}>{profile.name}</h2>
            {profile.description && <p style={{ fontSize:11, opacity: .8, marginTop: 4 }}>{profile.description}</p>}
          </div>
          <button onClick={() => load(true)} style={{ background: "rgba(255,255,255,.2)", padding: "7px 14px", borderRadius: 9, fontSize:11, fontWeight: 600, border: "1px solid rgba(255,255,255,.3)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Pending Queue",   v: stats.pendingQueue,   color: "#f59e0b", bg: "#fffbeb" },
          { l: "Today Referrals", v: stats.todayReferrals, color: m.accent,  bg: m.lightBg },
          { l: "Completed Today", v: stats.completedToday, color: "#10b981", bg: "#f0fdf4" },
          { l: "Active Procs",    v: stats.activeProcedures, color: "#6366f1", bg: "#eef2ff" },
          { l: "Today Revenue",   v: `₹${(stats.todayRevenue || 0).toLocaleString("en-IN")}`, color: "#059669", bg: "#f0fdf4" },
        ].map((s, i) => (
          <div key={i} className="cl-sc" style={{ padding: 12, gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Activity size={15} color={s.color} />
            </div>
            <div><div style={{ fontSize:15, fontWeight: 800, color: "#1e293b" }}>{s.v}</div><div style={{ fontSize:9, color: "#94a3b8" }}>{s.l}</div></div>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {SECS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id as any)}
            style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${section === s.id ? m.accent : "#e2e8f0"}`, background: section === s.id ? m.lightBg : "#fff", color: section === s.id ? m.accent : "#64748b", fontSize:11, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
            {s.label}
          </button>
        ))}
      </div>

      {section === "overview" && (
        <div className="cl-card">
          <div className="cl-card-head"><div className="cl-card-title">Sub-Department Info</div></div>
          <div className="cl-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[["Name", profile.name], ["Type", profile.type], ["Code", profile.code || "—"], ["HOD", profile.hodStaffName || "Not assigned"], ["Status", profile.isActive ? "Active" : "Inactive"], ["Login Email", profile.loginEmail || "—"]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {section === "queue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {queue.length === 0 ? <div className="cl-empty"><CheckCircle2 size={32} className="cl-empty-icon" color={m.accent} /><div style={{ marginTop: 8, fontSize:12, color: "#94a3b8" }}>Queue is clear</div></div>
          : queue.map((q: any, i: number) => (
            <div key={q.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: m.lightBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: m.accent, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{q.patient?.name || "—"}</div>
                <div style={{ fontSize:10, color: "#64748b", marginTop: 2 }}>Dr. {q.doctor?.name || "—"} · {q.subDeptNote ? "Referral note attached" : "No note"}</div>
              </div>
              <span className="cl-badge cl-badge-teal">{q.status}</span>
            </div>
          ))}
        </div>
      )}
      {section === "procedures" && (
        <div className="cl-card">
          <div className="cl-tbl-wrap">
            <table className="cl-tbl">
              <thead><tr><th>Procedure</th><th>Type</th><th>Fee</th><th>Duration</th><th>Status</th></tr></thead>
              <tbody>
                {(data.procedures || []).length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 28, color: "#94a3b8" }}>No procedures</td></tr>
                : (data.procedures || []).map((p: any) => (
                  <tr key={p.id}>
                    <td className="cl-td-name">{p.name}</td>
                    <td><span className="cl-badge cl-badge-gray">{p.type}</span></td>
                    <td style={{ fontWeight: 600 }}>₹{p.fee}</td>
                    <td style={{ color: "#64748b" }}>{p.duration ? `${p.duration} min` : "—"}</td>
                    <td><span className={`cl-badge ${p.isActive ? "cl-badge-green" : "cl-badge-red"}`}>{p.isActive ? "Active" : "Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {section === "records" && (
        <div className="cl-card">
          <div className="cl-tbl-wrap">
            <table className="cl-tbl">
              <thead><tr><th>Patient</th><th>Procedure</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {(data.records || []).length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 28, color: "#94a3b8" }}>No records</td></tr>
                : (data.records || []).map((r: any) => (
                  <tr key={r.id}>
                    <td className="cl-td-name">{r.patient?.name || "—"}</td>
                    <td style={{ color: "#64748b" }}>{r.procedure?.name || "—"}</td>
                    <td style={{ fontWeight: 600 }}>₹{r.amount}</td>
                    <td><span className={`cl-badge ${r.status === "COMPLETED" ? "cl-badge-green" : "cl-badge-amber"}`}>{r.status}</span></td>
                    <td style={{ color: "#94a3b8" }}>{r.performedAt ? fmt(r.performedAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   DEPARTMENT INFORMATION TAB
══════════════════════════════════════════════════════════════ */
function DeptInfoTab({ deptProfile }: { deptProfile: any }) {
  const [profile, setProfile] = useState<any>(deptProfile);

  useEffect(() => {
    fetch("/api/parentdept/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setProfile(d.data); })
      .catch(() => {});
  }, []);

  const p = profile;

  const InfoRow = ({ label, value, icon }: { label: string; value?: string | null; icon: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: TEAL_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize:12, fontWeight: 600, color: value ? "#1e293b" : "#cbd5e1" }}>{value || "Not set"}</div>
      </div>
    </div>
  );

  return (
    <>
      <div className="cl-section-title" style={{ marginBottom: 20 }}>
        <div className="cl-section-title-dot" />Department Information
      </div>

      {!p ? (
        <div className="cl-empty">
          <Loader2 size={24} style={{ animation: "cl-spin .7s linear infinite", display: "block", margin: "0 auto" }} />
          <div style={{ marginTop: 12, fontSize:12 }}>Loading…</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Basic Info — full width */}
          <div className="cl-card" style={{ gridColumn: "1 / -1" }}>
            <div className="cl-card-head">
              <div>
                <div className="cl-card-title">Basic Information</div>
                <div className="cl-card-sub">Core department details</div>
              </div>
              <span className={`cl-badge ${p.isActive ? "cl-badge-green" : "cl-badge-red"}`}>
                {p.isActive ? "● Active" : "● Inactive"}
              </span>
            </div>
            <div className="cl-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                <InfoRow label="Department Name" value={p.name}                    icon={<Info size={14} color={TEAL} />} />
                <InfoRow label="Department Code" value={p.code}                    icon={<Info size={14} color={TEAL} />} />
                <InfoRow label="Type"            value={p.type?.replace(/_/g," ")} icon={<Activity size={14} color={TEAL} />} />
                <InfoRow label="Status"          value={p.isActive ? "Active — Accepting patients" : "Inactive"} icon={<Activity size={14} color={TEAL} />} />
              </div>
              {p.description && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize:12, color: "#475569", lineHeight: 1.7 }}>{p.description}</div>
                </div>
              )}
            </div>
          </div>

          {/* HOD / Contact */}
          <div className="cl-card">
            <div className="cl-card-head"><div className="cl-card-title">Head of Department</div></div>
            <div className="cl-card-body" style={{ paddingTop: 4 }}>
              <InfoRow label="HOD Name"    value={p.hodName || p.hodStaffName}  icon={<UserCheck size={14} color={TEAL} />} />
              <InfoRow label="HOD Email"   value={p.hodEmail}                   icon={<Mail size={14} color={TEAL} />} />
              <InfoRow label="HOD Phone"   value={p.hodPhone}                   icon={<Phone size={14} color={TEAL} />} />
              <InfoRow label="Login Email" value={p.loginEmail}                 icon={<Mail size={14} color={TEAL} />} />
            </div>
          </div>

          {/* Operational Details */}
          <div className="cl-card">
            <div className="cl-card-head"><div className="cl-card-title">Operational Details</div></div>
            <div className="cl-card-body" style={{ paddingTop: 4 }}>
              <InfoRow label="Location / Wing"  value={p.location || p.wing}          icon={<MapPin size={14} color={TEAL} />} />
              <InfoRow label="Floor / Room"     value={p.floor || p.room}             icon={<Building2 size={14} color={TEAL} />} />
              <InfoRow label="Contact Number"   value={p.contactNumber || p.phone}    icon={<Phone size={14} color={TEAL} />} />
              <InfoRow label="Created On"       value={p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined} icon={<Activity size={14} color={TEAL} />} />
            </div>
          </div>

          {/* Credentials banner — full width */}
          <div className="cl-card" style={{ gridColumn: "1 / -1" }}>
            <div className="cl-card-head"><div className="cl-card-title">Login Credentials Status</div></div>
            <div className="cl-card-body">
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: p.credentialsSent ? "#f0fdf4" : "#fffbeb", border: `1px solid ${p.credentialsSent ? "#bbf7d0" : "#fde68a"}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: p.credentialsSent ? "#dcfce7" : "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Mail size={16} color={p.credentialsSent ? "#16a34a" : "#b45309"} />
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight: 600, color: p.credentialsSent ? "#15803d" : "#92400e" }}>
                    {p.credentialsSent ? "Login credentials have been sent to HOD" : "Login credentials not yet sent"}
                  </div>
                  <div style={{ fontSize:10, color: "#64748b", marginTop: 2 }}>
                    {p.loginEmail ? `Login email: ${p.loginEmail}` : "No login email configured"}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
