"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users, BarChart2, LayoutDashboard, Settings,
  LogOut, Bell, ArrowLeft, Loader2, UserCheck, UserX,
  Stethoscope, Activity, CheckCircle2, User,
  Shield, Send, ChevronRight, Clock, IndianRupee,
  Calendar, FileText, Download, Mail, Printer,
  ChevronLeft, Check, X, Save, Plus, Search, Eye,
  Sparkles, Zap, Brain, Info,
} from "lucide-react";
import StaffPanel from "@/components/StaffPanel";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

type Tab = "staff" | "attendance" | "salary" | "payslips" | "overview";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const STAFF_ROLES = [
  { value: "NURSE",          label: "Nurse",          color: "#07595D",  bg: "#E6F4F4",  border: "#B3E0E0" },
  { value: "TECHNICIAN",     label: "Technician",     color: "#6d28d9",  bg: "#faf5ff",  border: "#ede9fe" },
  { value: "PHARMACIST",     label: "Pharmacist",     color: "#15803d",  bg: "#f0fdf4",  border: "#bbf7d0" },
  { value: "RECEPTIONIST",   label: "Receptionist",   color: "#be185d",  bg: "#fdf2f8",  border: "#fbcfe8" },
  { value: "LAB_TECHNICIAN", label: "Lab Technician", color: "#92400e",  bg: "#fffbeb",  border: "#fde68a" },
  { value: "ACCOUNTANT",     label: "Accountant",     color: "#3730a3",  bg: "#eef2ff",  border: "#c7d2fe" },
  { value: "ADMIN",          label: "Admin",          color: "#b91c1c",  bg: "#fff5f5",  border: "#fecaca" },
  { value: "SUPPORT",        label: "Support",        color: "#475569",  bg: "#f8fafc",  border: "#e2e8f0" },
  { value: "OTHER",          label: "Other",          color: "#475569",  bg: "#f8fafc",  border: "#e2e8f0" },
];

const AVATAR_GRAD: Record<string, string> = {
  NURSE: "linear-gradient(135deg,#B3E0E0,#7fcfcf)",
  TECHNICIAN: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
  PHARMACIST: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
  RECEPTIONIST: "linear-gradient(135deg,#fce7f3,#fbcfe8)",
  LAB_TECHNICIAN: "linear-gradient(135deg,#fef9c3,#fde68a)",
  ACCOUNTANT: "linear-gradient(135deg,#e0e7ff,#c7d2fe)",
  ADMIN: "linear-gradient(135deg,#fee2e2,#fecaca)",
  SUPPORT: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
  OTHER: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
};

const AVATAR_COLOR: Record<string, string> = {
  NURSE: "#07595D", TECHNICIAN: "#6d28d9", PHARMACIST: "#15803d",
  RECEPTIONIST: "#be185d", LAB_TECHNICIAN: "#92400e", ACCOUNTANT: "#3730a3",
  ADMIN: "#b91c1c", SUPPORT: "#475569", OTHER: "#475569",
};

const initials = (n: string) => n.split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase();

export default function StaffPage() {
  const [tab, setTab] = useState<Tab>("staff");

  const TABS = [
    { id: "staff" as Tab,      label: "Staff Members", icon: Users },
    { id: "attendance" as Tab, label: "Attendance",     icon: Clock },
    { id: "salary" as Tab,     label: "Salary",        icon: IndianRupee },
    { id: "payslips" as Tab,   label: "Payslips",      icon: FileText },
    { id: "overview" as Tab,   label: "Overview",      icon: BarChart2 },
  ];

  const DESC: Record<Tab, string> = {
    staff: "Manage all hospital staff — add, edit, assign roles, and control portal access",
    attendance: "Mark and manage daily attendance — in time, out time, and leave tracking",
    salary: "Configure salary structure — earnings, deductions, and employer contributions",
    payslips: "Generate, view, download and email monthly salary slips",
    overview: "Summary of staff distribution, role breakdown, and recent activity",
  };

  return (
    <div className="hd-center">
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${active ? "#0E898F" : "#e2e8f0"}`, background: active ? "#E6F4F4" : "#fff", color: active ? "#0A6B70" : "#64748b", fontSize:12, fontWeight: active ? 600 : 500, cursor: "pointer" }}>
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize:12, color: "#94a3b8", marginBottom: 20 }}>{DESC[tab]}</div>
      {tab === "staff"      && <StaffPanel />}
      {tab === "attendance" && <AttendancePanel />}
      {tab === "salary"     && <SalaryPanel />}
      {tab === "payslips"   && <PayslipPanel />}
      {tab === "overview"   && <StaffOverviewPanel onManageStaff={() => setTab("staff")} />}
    </div>
  );
}

// ─── Shared Styles ───────────────────────────────────────────────────────────
const LBL: React.CSSProperties = { display: "block", fontSize:10, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" };
const INP: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", background: "#f8fafc", fontFamily: "inherit" };
const SEL: React.CSSProperties = { ...INP, background: "#f8fafc", cursor: "pointer" };
const CARD: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" };
const SECTION_HD: React.CSSProperties = { fontSize:12, fontWeight: 700, color: "#0E898F", marginBottom: 12, marginTop: 18, display: "flex", alignItems: "center", gap: 7 };
const BTN_PRIMARY: React.CSSProperties = { padding: "9px 18px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(14,137,143,.28)" };
const BTN_GHOST: React.CSSProperties = { padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" };
const BTN_AI: React.CSSProperties = { padding: "9px 18px", borderRadius: 9, border: "1.5px solid #a78bfa", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(124,58,237,.28)" };

// ─── Attendance Panel ────────────────────────────────────────────────────────
function AttendancePanel() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [filling, setFilling] = useState(false);
  const [fillMsg, setFillMsg] = useState<{type:string;text:string}|null>(null);

  const handleSmartFill = async (mode: string) => {
    if (!selectedStaff) return;
    setFilling(true); setFillMsg(null);
    const r = await api("/api/config/staff/ai/attendance-fill", "POST", { staffId: selectedStaff, month, year, mode });
    setFilling(false);
    if (r.success) {
      setFillMsg({ type: "success", text: r.message || `Filled ${r.data?.filled} days` });
      loadAttendance();
    } else setFillMsg({ type: "error", text: r.message || "Failed" });
  };

  useEffect(() => {
    api("/api/config/staff?limit=200").then(r => { if (r.success) setStaffList(r.data?.data || []); });
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!selectedStaff) return;
    setLoading(true);
    const r = await api(`/api/config/staff/${selectedStaff}/attendance?month=${month}&year=${year}`);
    if (r.success) { setRecords(r.data?.records || []); setSummary(r.data?.summary || null); }
    setLoading(false);
  }, [selectedStaff, month, year]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const dateList = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    return { num: i + 1, day: d.toLocaleDateString("en-US", { weekday: "short" }), date: d.toISOString().split("T")[0], isSunday: d.getDay() === 0 };
  });

  const getRecord = (dateStr: string) => records.find((r: any) => {
    const rd = new Date(r.date).toISOString().split("T")[0];
    return rd === dateStr;
  });

  const saveAttendance = async (dateStr: string, data: any) => {
    setSaving(dateStr);
    await api(`/api/config/staff/${selectedStaff}/attendance`, "POST", { date: dateStr, ...data });
    await loadAttendance();
    setSaving(null);
    setEditRow(null);
  };

  const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    PRESENT: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    ABSENT: { bg: "#fff5f5", color: "#ef4444", border: "#fecaca" },
    HALF_DAY: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
    LEAVE: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    HOLIDAY: { bg: "#faf5ff", color: "#7c3aed", border: "#ddd6fe" },
  };

  const staff = staffList.find(s => s.id === selectedStaff);

  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={LBL}>Staff Member</label>
          <select style={SEL} value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
            <option value="">Select Staff</option>
            {staffList.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
          </select>
        </div>
        <div>
          <label style={LBL}>Month</label>
          <select style={SEL} value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={LBL}>Year</label>
          <select style={SEL} value={year} onChange={e => setYear(+e.target.value)}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {selectedStaff && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleSmartFill("all_days")} disabled={filling} style={BTN_AI}>
              {filling ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <Zap size={14} />}
              {filling ? "Filling..." : "Smart Fill (Mon-Sat)"}
            </button>
            <button onClick={() => handleSmartFill("weekdays_only")} disabled={filling}
              style={{ ...BTN_AI, background: "linear-gradient(135deg,#6d28d9,#5b21b6)" }}>
              <Sparkles size={14} /> Mon-Fri Only
            </button>
          </div>
        )}
      </div>

      {fillMsg && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize:12, fontWeight: 600, background: fillMsg.type === "success" ? "#f0fdf4" : "#fff5f5", color: fillMsg.type === "success" ? "#16a34a" : "#ef4444", border: `1px solid ${fillMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`, display: "flex", alignItems: "center", gap: 8 }}>
          {fillMsg.type === "success" ? <Sparkles size={14} /> : <Info size={14} />} {fillMsg.text}
        </div>
      )}

      {!selectedStaff ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize:13 }}>
          <Clock size={32} style={{ margin: "0 auto 12px", display: "block", opacity: .3 }} />
          Select a staff member to manage attendance
        </div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}><Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} /></div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Working Days", val: staff?.workingDays || 26, color: "#0E898F", bg: "#E6F4F4" },
                { label: "Present", val: summary.presentDays, color: "#16a34a", bg: "#f0fdf4" },
                { label: "Absent", val: summary.absentDays, color: "#ef4444", bg: "#fff5f5" },
                { label: "Half Day", val: summary.halfDays, color: "#b45309", bg: "#fffbeb" },
                { label: "Leave", val: summary.leaveDays, color: "#2563eb", bg: "#eff6ff" },
              ].map((c, i) => (
                <div key={i} style={{ background: c.bg, borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize:20, fontWeight: 800, color: c.color }}>{c.val}</div>
                  <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>{c.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Attendance Table */}
          <div style={CARD}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Day</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>In Time</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Out Time</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Status</th>
                  <th style={{ textAlign: "center", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dateList.map(d => {
                  const rec = getRecord(d.date);
                  const isEdit = editRow === d.date;
                  const sc = STATUS_COLORS[rec?.status || ""] || { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" };
                  return (
                    <tr key={d.date} style={{ background: d.isSunday ? "#fafbfc" : "transparent", borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "8px 14px", fontSize:12, fontWeight: 600, color: "#1e293b" }}>{d.num}</td>
                      <td style={{ padding: "8px 14px", fontSize:11, color: d.isSunday ? "#ef4444" : "#64748b", fontWeight: d.isSunday ? 600 : 400 }}>{d.day}</td>
                      {isEdit ? (
                        <>
                          <td style={{ padding: "6px 10px" }}>
                            <input type="time" defaultValue={rec?.inTime || ""} id={`in-${d.date}`}
                              style={{ ...INP, padding: "6px 8px", fontSize:11 }} />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <input type="time" defaultValue={rec?.outTime || ""} id={`out-${d.date}`}
                              style={{ ...INP, padding: "6px 8px", fontSize:11 }} />
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <select defaultValue={rec?.status || "PRESENT"} id={`st-${d.date}`}
                              style={{ ...SEL, padding: "6px 8px", fontSize:11 }}>
                              <option value="PRESENT">Present</option>
                              <option value="ABSENT">Absent</option>
                              <option value="HALF_DAY">Half Day</option>
                              <option value="LEAVE">Leave</option>
                              <option value="HOLIDAY">Holiday</option>
                            </select>
                          </td>
                          <td style={{ padding: "6px 14px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                              <button disabled={saving === d.date}
                                onClick={() => {
                                  const inEl = document.getElementById(`in-${d.date}`) as HTMLInputElement;
                                  const outEl = document.getElementById(`out-${d.date}`) as HTMLInputElement;
                                  const stEl = document.getElementById(`st-${d.date}`) as HTMLSelectElement;
                                  saveAttendance(d.date, { inTime: inEl?.value || null, outTime: outEl?.value || null, status: stEl?.value || "PRESENT" });
                                }}
                                style={{ ...BTN_PRIMARY, padding: "5px 10px", fontSize:10 }}>
                                {saving === d.date ? <Loader2 size={11} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={11} />} Save
                              </button>
                              <button onClick={() => setEditRow(null)} style={{ ...BTN_GHOST, padding: "5px 10px", fontSize:10 }}>
                                <X size={11} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: "8px 14px", fontSize:12, color: rec?.inTime ? "#1e293b" : "#cbd5e1" }}>{rec?.inTime || "—"}</td>
                          <td style={{ padding: "8px 14px", fontSize:12, color: rec?.outTime ? "#1e293b" : "#cbd5e1" }}>{rec?.outTime || "—"}</td>
                          <td style={{ padding: "8px 14px" }}>
                            {rec ? (
                              <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize:10, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                {rec.status}
                              </span>
                            ) : <span style={{ color: "#cbd5e1", fontSize:11 }}>Not marked</span>}
                          </td>
                          <td style={{ padding: "8px 14px", textAlign: "center" }}>
                            <button onClick={() => setEditRow(d.date)}
                              style={{ background: "#E6F4F4", color: "#0E898F", border: "none", borderRadius: 7, padding: "5px 10px", fontSize:10, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Clock size={11} /> Mark
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Salary Panel ────────────────────────────────────────────────────────────
function SalaryPanel() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [structure, setStructure] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState("");

  const [form, setForm] = useState({
    basic: "", hra: "", conveyanceAllowance: "", medicalAllowance: "", specialAllowance: "",
    otherEarnings: "[]",
    professionTax: "", providentFund: "", labourWelfareFund: "", incomeTax: "",
    otherDeductions: "[]",
    employerEps: "", employerPf: "", employerNps: "",
  });

  const handleAiSuggest = async () => {
    const staff = staffList.find(s => s.id === selectedStaff);
    if (!staff) return;
    const totalCTC = staff.salary || 0;
    if (totalCTC <= 0) { setMsg({ type: "error", text: "Set monthly salary on the staff profile first" }); return; }
    setAiLoading(true); setMsg(null); setAiReasoning("");
    const r = await api("/api/config/staff/ai/salary-suggest", "POST", { totalCTC, role: staff.role, location: "India" });
    setAiLoading(false);
    if (r.success && r.data) {
      const d = r.data;
      setForm({
        basic: String(d.basic || ""), hra: String(d.hra || ""),
        conveyanceAllowance: String(d.conveyanceAllowance || ""),
        medicalAllowance: String(d.medicalAllowance || ""),
        specialAllowance: String(d.specialAllowance || ""),
        otherEarnings: "[]",
        professionTax: String(d.professionTax || ""),
        providentFund: String(d.providentFund || ""),
        labourWelfareFund: String(d.labourWelfareFund || ""),
        incomeTax: String(d.incomeTax || ""),
        otherDeductions: "[]",
        employerEps: String(d.employerEps || ""),
        employerPf: String(d.employerPf || ""),
        employerNps: String(d.employerNps || ""),
      });
      if (d.reasoning) setAiReasoning(d.reasoning);
      setMsg({ type: "success", text: "AI suggested salary structure applied. Review & save." });
    } else {
      setMsg({ type: "error", text: r.message || "AI suggestion failed" });
    }
  };

  useEffect(() => {
    api("/api/config/staff?limit=200").then(r => { if (r.success) setStaffList(r.data?.data || []); });
  }, []);

  const loadSalary = useCallback(async () => {
    if (!selectedStaff) return;
    setLoading(true);
    const r = await api(`/api/config/staff/${selectedStaff}/salary`);
    if (r.success && r.data) {
      const d = r.data;
      setForm({
        basic: String(d.basic || ""), hra: String(d.hra || ""), conveyanceAllowance: String(d.conveyanceAllowance || ""),
        medicalAllowance: String(d.medicalAllowance || ""), specialAllowance: String(d.specialAllowance || ""),
        otherEarnings: d.otherEarnings || "[]",
        professionTax: String(d.professionTax || ""), providentFund: String(d.providentFund || ""),
        labourWelfareFund: String(d.labourWelfareFund || ""), incomeTax: String(d.incomeTax || ""),
        otherDeductions: d.otherDeductions || "[]",
        employerEps: String(d.employerEps || ""), employerPf: String(d.employerPf || ""), employerNps: String(d.employerNps || ""),
      });
      setStructure(d);
    } else {
      setForm({ basic: "", hra: "", conveyanceAllowance: "", medicalAllowance: "", specialAllowance: "", otherEarnings: "[]", professionTax: "", providentFund: "", labourWelfareFund: "", incomeTax: "", otherDeductions: "[]", employerEps: "", employerPf: "", employerNps: "" });
      setStructure(null);
    }
    setLoading(false);
  }, [selectedStaff]);

  useEffect(() => { loadSalary(); }, [loadSalary]);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    const payload = {
      basic: parseFloat(form.basic) || 0, hra: parseFloat(form.hra) || 0,
      conveyanceAllowance: parseFloat(form.conveyanceAllowance) || 0,
      medicalAllowance: parseFloat(form.medicalAllowance) || 0,
      specialAllowance: parseFloat(form.specialAllowance) || 0,
      otherEarnings: form.otherEarnings,
      professionTax: parseFloat(form.professionTax) || 0,
      providentFund: parseFloat(form.providentFund) || 0,
      labourWelfareFund: parseFloat(form.labourWelfareFund) || 0,
      incomeTax: parseFloat(form.incomeTax) || 0,
      otherDeductions: form.otherDeductions,
      employerEps: parseFloat(form.employerEps) || 0,
      employerPf: parseFloat(form.employerPf) || 0,
      employerNps: parseFloat(form.employerNps) || 0,
    };
    const r = await api(`/api/config/staff/${selectedStaff}/salary`, "PUT", payload);
    setSaving(false);
    if (r.success) { setMsg({ type: "success", text: "Salary structure saved" }); loadSalary(); }
    else setMsg({ type: "error", text: r.message || "Failed" });
  };

  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const grossEarnings = [form.basic, form.hra, form.conveyanceAllowance, form.medicalAllowance, form.specialAllowance].reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const grossDeductions = [form.professionTax, form.providentFund, form.labourWelfareFund, form.incomeTax].reduce((s, v) => s + (parseFloat(v) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <label style={LBL}>Staff Member</label>
          <select style={SEL} value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
            <option value="">Select Staff</option>
            {staffList.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} — ₹{(s.salary || 0).toLocaleString()}/mo</option>)}
          </select>
        </div>
        {selectedStaff && (
          <button onClick={handleAiSuggest} disabled={aiLoading} style={BTN_AI}>
            {aiLoading ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <Brain size={14} />}
            {aiLoading ? "AI Thinking..." : "AI Auto-Fill Salary Structure"}
          </button>
        )}
      </div>

      {aiReasoning && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize:11, background: "linear-gradient(135deg,#faf5ff,#f3e8ff)", color: "#6d28d9", border: "1px solid #ddd6fe", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Brain size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div><strong>AI Reasoning:</strong> {aiReasoning}</div>
        </div>
      )}

      {!selectedStaff ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize:13 }}>
          <IndianRupee size={32} style={{ margin: "0 auto 12px", display: "block", opacity: .3 }} />
          Select a staff member to configure salary structure
        </div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}><Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} /></div>
      ) : (
        <div style={CARD}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize:14, fontWeight: 700, color: "#1e293b" }}>Salary Structure — {staffList.find(s => s.id === selectedStaff)?.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "#E6F4F4", borderRadius: 8, padding: "6px 14px" }}>
                <span style={{ fontSize:10, color: "#64748b" }}>Gross: </span>
                <span style={{ fontSize:13, fontWeight: 800, color: "#0E898F" }}>₹{grossEarnings.toLocaleString()}</span>
              </div>
              <div style={{ background: "#fff5f5", borderRadius: 8, padding: "6px 14px" }}>
                <span style={{ fontSize:10, color: "#64748b" }}>Deductions: </span>
                <span style={{ fontSize:13, fontWeight: 800, color: "#ef4444" }}>₹{grossDeductions.toLocaleString()}</span>
              </div>
              <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "6px 14px" }}>
                <span style={{ fontSize:10, color: "#64748b" }}>Net: </span>
                <span style={{ fontSize:13, fontWeight: 800, color: "#16a34a" }}>₹{(grossEarnings - grossDeductions).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={SECTION_HD}><IndianRupee size={14} /> Earnings (Monthly)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[
                { key: "basic", label: "Basic" }, { key: "hra", label: "H.R.A" },
                { key: "conveyanceAllowance", label: "Conveyance Allowance" },
                { key: "medicalAllowance", label: "Medical Allowance" },
                { key: "specialAllowance", label: "Special Allowance" },
              ].map(f => (
                <div key={f.key}>
                  <label style={LBL}>{f.label}</label>
                  <input style={INP} type="number" min="0" placeholder="0" value={(form as any)[f.key]} onChange={e => sf(f.key, e.target.value)} />
                </div>
              ))}
            </div>

            <div style={SECTION_HD}><Activity size={14} /> Deductions (Monthly)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[
                { key: "professionTax", label: "Profession Tax" }, { key: "providentFund", label: "Provident Fund (PF)" },
                { key: "labourWelfareFund", label: "Labour Welfare Fund" }, { key: "incomeTax", label: "Income Tax (TDS)" },
              ].map(f => (
                <div key={f.key}>
                  <label style={LBL}>{f.label}</label>
                  <input style={INP} type="number" min="0" placeholder="0" value={(form as any)[f.key]} onChange={e => sf(f.key, e.target.value)} />
                </div>
              ))}
            </div>

            <div style={SECTION_HD}><Users size={14} /> Employer Contributions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[
                { key: "employerEps", label: "Employer EPS" }, { key: "employerPf", label: "Employer PF" }, { key: "employerNps", label: "Employer NPS" },
              ].map(f => (
                <div key={f.key}>
                  <label style={LBL}>{f.label}</label>
                  <input style={INP} type="number" min="0" placeholder="0" value={(form as any)[f.key]} onChange={e => sf(f.key, e.target.value)} />
                </div>
              ))}
            </div>

            {msg && (
              <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize:12, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fff5f5", color: msg.type === "success" ? "#16a34a" : "#ef4444", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
                {msg.text}
              </div>
            )}

            <button onClick={handleSave} disabled={saving} style={BTN_PRIMARY}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={14} />}
              {saving ? "Saving..." : "Save Salary Structure"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payslip Panel ───────────────────────────────────────────────────────────
function PayslipPanel() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState<string | null>(null);
  const [viewSlip, setViewSlip] = useState<any>(null);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);

  useEffect(() => {
    api("/api/config/staff?limit=200").then(r => { if (r.success) setStaffList(r.data?.data || []); });
    api("/api/config/settings").then(r => { if (r.success && r.data?.settings) setHospitalInfo(r.data.settings); }).catch(() => {});
  }, []);

  const loadPayslips = useCallback(async () => {
    if (!selectedStaff) return;
    setLoading(true);
    const r = await api(`/api/config/staff/${selectedStaff}/payslip`);
    if (r.success) setPayslips(r.data || []);
    setLoading(false);
  }, [selectedStaff]);

  useEffect(() => { loadPayslips(); }, [loadPayslips]);

  const handleGenerate = async () => {
    setGenerating(true);
    const r = await api(`/api/config/staff/${selectedStaff}/payslip`, "POST", { month, year });
    setGenerating(false);
    if (r.success) { loadPayslips(); setViewSlip(r.data); }
    else alert(r.message || "Failed to generate");
  };

  const handleEmail = async (payslipId: string) => {
    setEmailing(payslipId);
    await api(`/api/config/staff/${selectedStaff}/payslip/email`, "POST", { payslipId });
    setEmailing(null);
    loadPayslips();
  };

  const staff = staffList.find(s => s.id === selectedStaff);

  const printPayslip = (slip: any) => {
    const d = slip.details ? JSON.parse(slip.details) : {};
    const info = d.staffInfo || {};
    const earn = d.earnings || {};
    const ded = d.deductions || {};
    const emp = d.employerContributions || {};
    const wpay = d.weeklyPayouts || [];
    const wpw = d.weeklyPayoutWords || [];
    const att = d.attendance || {};
    const hName = hospitalInfo?.hospitalName || "Hospital";
    const hLogo = hospitalInfo?.logo || "";
    const hAddr = hospitalInfo?.address || "";

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payslip</title>
<style>
body{font-family:Arial,sans-serif;font-size:10px;color:#333;margin:0;padding:20px}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ccc;padding:4px 8px;text-align:left;font-size:10px}
th{background:#f5f5f5;font-weight:700}
.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:10px}
.hdr-right{text-align:right;font-weight:700;font-size:12px}
.section{font-weight:700;font-size:11px;margin:12px 0 6px;padding:4px 0;border-bottom:1px solid #999}
.note{font-size:10px;color:#666;margin-top:16px;font-style:italic}
@media print{body{margin:0;padding:12px}}
</style></head><body>
<div class="hdr">
<div style="display:flex;align-items:center;gap:12px">
${hLogo ? `<img src="${hLogo}" style="max-height:50px"/>` : ""}
<div style="font-size:10px;color:#666;max-width:400px">${hAddr}</div>
</div>
<div class="hdr-right" style="font-size:10px;color:#0E898F;font-weight:600">Payslip for ${MONTHS[slip.month - 1]} ${slip.year}</div>
</div>
<table style="margin-bottom:8px">
<tr><td><b>Employee Id</b></td><td>${info.employeeId || ""}</td><td><b>Employee Name</b></td><td>${info.name || ""}</td></tr>
<tr><td><b>Date of Birth</b></td><td>${info.dateOfBirth ? new Date(info.dateOfBirth).toLocaleDateString("en-IN") : "—"}</td><td><b>Date of Joining</b></td><td>${info.dateOfJoining ? new Date(info.dateOfJoining).toLocaleDateString("en-IN") : "—"}</td></tr>
<tr><td><b>Bank Name</b></td><td>${info.bankName || "—"}</td><td><b>Bank A/C No</b></td><td>${info.bankAccountNo || "—"}</td></tr>
<tr><td><b>PAN No</b></td><td>${info.panNo || "—"}</td><td><b>PF A/c No.</b></td><td>${info.pfAccountNo || "—"}</td></tr>
<tr><td><b>No of Days / LOP</b></td><td>${att.presentDays || 0} / ${att.lopDays || 0}</td><td><b>PF UAN</b></td><td>${info.pfUan || "—"}</td></tr>
</table>
<div class="section">Payslip for the month of ${MONTHS[slip.month - 1]} ${slip.year}</div>
<table>
<tr><th>Earnings</th><th>Reference</th><th>Amount</th><th>Deductions</th><th>Amount</th></tr>
<tr><td>Basic</td><td>${earn.basic?.reference || 0}</td><td>${earn.basic?.amount || 0}</td><td>Profession Tax</td><td>${ded.professionTax || 0}</td></tr>
<tr><td>H.R.A</td><td>${earn.hra?.reference || 0}</td><td>${earn.hra?.amount || 0}</td><td>Provident Fund (PF)</td><td>${ded.providentFund || 0}</td></tr>
<tr><td>Conveyance Allowance</td><td>${earn.conveyanceAllowance?.reference || 0}</td><td>${earn.conveyanceAllowance?.amount || 0}</td><td>Labour Welfare Fund</td><td>${ded.labourWelfareFund || 0}</td></tr>
<tr><td>Medical Allowance</td><td>${earn.medicalAllowance?.reference || 0}</td><td>${earn.medicalAllowance?.amount || 0}</td><td>Income Tax</td><td>${ded.incomeTax || 0}</td></tr>
<tr><td>Special Allowance</td><td>${earn.specialAllowance?.reference || 0}</td><td>${earn.specialAllowance?.amount || 0}</td><td></td><td></td></tr>
<tr style="font-weight:700;background:#f9f9f9"><td>Gross Earnings</td><td></td><td>${slip.grossEarnings?.toLocaleString()}</td><td>Gross Deductions</td><td>${slip.grossDeductions?.toLocaleString()}</td></tr>
</table>
<table style="margin-top:8px">
<tr style="font-weight:700;background:#e8f5e9"><td>Net Pay (Gross Earnings - Gross Deductions)</td><td style="text-align:right">₹ ${slip.netPay?.toLocaleString()}</td></tr>
<tr><td><b>Net Pay In Words</b></td><td>${d.netPayWords || ""}</td></tr>
</table>
<table style="margin-top:8px">
<tr><th>Week</th><th>Payout</th><th>In Words</th></tr>
${wpay.map((w: number, i: number) => `<tr><td>Week ${i + 1} Payout</td><td>₹ ${w?.toLocaleString()}</td><td>${wpw[i] || ""}</td></tr>`).join("")}
<tr style="font-weight:700;background:#f9f9f9"><td>Total Payout for the month</td><td>₹ ${slip.netPay?.toLocaleString()}</td><td>${d.netPayWords || ""}</td></tr>
</table>
<table style="margin-top:8px">
<tr><th>Employer Contribution</th><th>Amount</th></tr>
<tr><td>Employer Contribution to EPS</td><td>${emp.eps || 0}</td></tr>
<tr><td>Employer Contribution to PF</td><td>${emp.pf || 0}</td></tr>
<tr><td>Employer Contribution to NPS</td><td>${emp.nps || 0}</td></tr>
<tr style="font-weight:700"><td>Sub Total</td><td>${emp.total || 0}</td></tr>
</table>
<div style="font-weight:700;margin-top:8px;font-size:11px">TOTAL CTC: ₹ ${slip.totalCtc?.toLocaleString()}</div>
<div class="note">Note: This is a computer generated payslip and does not require authentication.</div>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <label style={LBL}>Staff Member</label>
          <select style={SEL} value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
            <option value="">Select Staff</option>
            {staffList.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
          </select>
        </div>
        <div>
          <label style={LBL}>Month</label>
          <select style={SEL} value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={LBL}>Year</label>
          <select style={SEL} value={year} onChange={e => setYear(+e.target.value)}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {selectedStaff && (
          <button onClick={handleGenerate} disabled={generating} style={BTN_PRIMARY}>
            {generating ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <FileText size={14} />}
            {generating ? "Generating..." : "Generate Payslip"}
          </button>
        )}
      </div>

      {!selectedStaff ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize:13 }}>
          <FileText size={32} style={{ margin: "0 auto 12px", display: "block", opacity: .3 }} />
          Select a staff member to view/generate payslips
        </div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}><Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} /></div>
      ) : payslips.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize:13 }}>
          No payslips generated yet. Select month/year and click Generate.
        </div>
      ) : (
        <div style={CARD}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Period</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Gross Earnings</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Deductions</th>
                <th style={{ textAlign: "right", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Net Pay</th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Status</th>
                <th style={{ textAlign: "center", padding: "10px 14px", fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((slip: any) => (
                <tr key={slip.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b", fontSize:12 }}>{MONTHS[slip.month - 1]} {slip.year}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#0E898F", fontSize:12 }}>₹{slip.grossEarnings?.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#ef4444", fontSize:12 }}>₹{slip.grossDeductions?.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#16a34a", fontSize:13 }}>₹{slip.netPay?.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 100, fontSize:10, fontWeight: 700, background: slip.status === "GENERATED" ? "#f0fdf4" : "#fffbeb", color: slip.status === "GENERATED" ? "#16a34a" : "#b45309", border: `1px solid ${slip.status === "GENERATED" ? "#bbf7d0" : "#fde68a"}` }}>
                      {slip.status}
                    </span>
                    {slip.emailSentAt && <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>Emailed</div>}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button onClick={() => setViewSlip(slip)} title="View"
                        style={{ background: "#E6F4F4", color: "#0E898F", border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer" }}>
                        <Eye size={13} />
                      </button>
                      <button onClick={() => printPayslip(slip)} title="Print/Download"
                        style={{ background: "#faf5ff", color: "#7c3aed", border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer" }}>
                        <Printer size={13} />
                      </button>
                      <button onClick={() => handleEmail(slip.id)} disabled={emailing === slip.id} title="Email to Staff"
                        style={{ background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 7, padding: "5px 8px", cursor: emailing === slip.id ? "not-allowed" : "pointer", opacity: emailing === slip.id ? 0.5 : 1 }}>
                        {emailing === slip.id ? <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> : <Mail size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payslip View Modal */}
      {viewSlip && <PayslipViewModal slip={viewSlip} staff={staff} hospitalInfo={hospitalInfo} onClose={() => setViewSlip(null)} onPrint={() => printPayslip(viewSlip)} />}
    </div>
  );
}

// ─── Payslip View Modal ──────────────────────────────────────────────────────
function PayslipViewModal({ slip, staff, hospitalInfo, onClose, onPrint }: { slip: any; staff: any; hospitalInfo: any; onClose: () => void; onPrint: () => void }) {
  const d = slip.details ? JSON.parse(slip.details) : {};
  const info = d.staffInfo || {};
  const earn = d.earnings || {};
  const ded = d.deductions || {};
  const emp = d.employerContributions || {};
  const wpay = d.weeklyPayouts || [];
  const wpw = d.weeklyPayoutWords || [];
  const att = d.attendance || {};
  const hName = hospitalInfo?.hospitalName || "Hospital";
  const hLogo = hospitalInfo?.logo || "";
  const hAddr = hospitalInfo?.address || "";

  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    const r = await api("/api/config/staff/ai/payslip-insights", "POST", {
      staffName: info.name || staff?.name, role: staff?.role,
      month: slip.month, year: slip.year,
      grossEarnings: slip.grossEarnings, grossDeductions: slip.grossDeductions,
      netPay: slip.netPay, totalCtc: slip.totalCtc,
      presentDays: att.presentDays || 0, lopDays: att.lopDays || 0, workingDays: att.workingDays || 26,
    });
    setInsightsLoading(false);
    if (r.success && r.data) setInsights(r.data);
  }, [slip, staff, info, att]);

  useEffect(() => { fetchInsights(); }, []);

  const TH: React.CSSProperties = { padding: "6px 10px", fontSize:10, fontWeight: 700, color: "#475569", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" };
  const TD: React.CSSProperties = { padding: "5px 10px", fontSize:11, color: "#334155", borderBottom: "1px solid #f1f5f9" };
  const TDR: React.CSSProperties = { ...TD, textAlign: "right", fontWeight: 600 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 800, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", borderRadius: "18px 18px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {hLogo && <img src={hLogo} alt="Hospital Logo" style={{ maxHeight: 50, borderRadius: 8, objectFit: "contain" }} />}
            <div>
              {hAddr && <div style={{ fontSize:10, color: "#64748b", maxWidth: 300, marginBottom: 4 }}>{hAddr}</div>}
              <div style={{ fontSize:10, color: "#0E898F", fontWeight: 600 }}>Payslip for {MONTHS[slip.month - 1]} {slip.year}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onPrint} style={{ ...BTN_PRIMARY, padding: "7px 14px", fontSize:11 }}><Printer size={13} /> Print / Download</button>
            <button onClick={onClose} style={{ ...BTN_GHOST, padding: "7px 14px", fontSize:11 }}><X size={13} /> Close</button>
          </div>
        </div>

        <div style={{ padding: "16px 24px" }}>
          {/* Employee Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 16, border: "1px solid #e2e8f0" }}>
            {[
              ["Employee Id", info.employeeId], ["Employee Name", info.name],
              ["Date of Birth", info.dateOfBirth ? new Date(info.dateOfBirth).toLocaleDateString("en-IN") : "—"], ["Date of Joining", info.dateOfJoining ? new Date(info.dateOfJoining).toLocaleDateString("en-IN") : "—"],
              ["Bank Name", info.bankName || "—"], ["Bank A/C No", info.bankAccountNo || "—"],
              ["PAN No", info.panNo || "—"], ["PF A/c No.", info.pfAccountNo || "—"],
              ["Working Days / LOP", `${att.presentDays || 0} / ${att.lopDays || 0}`], ["PF UAN", info.pfUan || "—"],
            ].map(([k, v], i) => (
              <div key={i} style={{ background: "#fff", padding: "6px 12px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize:10, color: "#64748b", fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize:11, color: "#1e293b", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Earnings & Deductions Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={TH}>Earnings</th><th style={{ ...TH, textAlign: "right" }}>Reference</th><th style={{ ...TH, textAlign: "right" }}>Amount</th>
                <th style={TH}>Deductions</th><th style={{ ...TH, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={TD}>Basic</td><td style={TDR}>{earn.basic?.reference?.toLocaleString()}</td><td style={TDR}>{earn.basic?.amount?.toLocaleString()}</td><td style={TD}>Profession Tax</td><td style={TDR}>{ded.professionTax?.toLocaleString()}</td></tr>
              <tr><td style={TD}>H.R.A</td><td style={TDR}>{earn.hra?.reference?.toLocaleString()}</td><td style={TDR}>{earn.hra?.amount?.toLocaleString()}</td><td style={TD}>Provident Fund (PF)</td><td style={TDR}>{ded.providentFund?.toLocaleString()}</td></tr>
              <tr><td style={TD}>Conveyance Allowance</td><td style={TDR}>{earn.conveyanceAllowance?.reference?.toLocaleString()}</td><td style={TDR}>{earn.conveyanceAllowance?.amount?.toLocaleString()}</td><td style={TD}>Labour Welfare Fund</td><td style={TDR}>{ded.labourWelfareFund?.toLocaleString()}</td></tr>
              <tr><td style={TD}>Medical Allowance</td><td style={TDR}>{earn.medicalAllowance?.reference?.toLocaleString()}</td><td style={TDR}>{earn.medicalAllowance?.amount?.toLocaleString()}</td><td style={TD}>Income Tax</td><td style={TDR}>{ded.incomeTax?.toLocaleString()}</td></tr>
              <tr><td style={TD}>Special Allowance</td><td style={TDR}>{earn.specialAllowance?.reference?.toLocaleString()}</td><td style={TDR}>{earn.specialAllowance?.amount?.toLocaleString()}</td><td style={TD}></td><td style={TDR}></td></tr>
              <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                <td style={{ ...TD, fontWeight: 700 }}>Gross Earnings</td><td style={TDR}></td><td style={{ ...TDR, color: "#0E898F" }}>₹{slip.grossEarnings?.toLocaleString()}</td>
                <td style={{ ...TD, fontWeight: 700 }}>Gross Deductions</td><td style={{ ...TDR, color: "#ef4444" }}>₹{slip.grossDeductions?.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Net Pay */}
          <div style={{ background: "linear-gradient(135deg,#0E898F,#0A6B70)", borderRadius: 12, padding: "14px 20px", color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize:11, opacity: .8, marginBottom: 2 }}>Net Pay (Gross Earnings - Gross Deductions)</div>
              <div style={{ fontSize:10, opacity: .7 }}>{d.netPayWords}</div>
            </div>
            <div style={{ fontSize:24, fontWeight: 900 }}>₹{slip.netPay?.toLocaleString()}</div>
          </div>

          {/* Weekly Payouts */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            <thead><tr><th style={TH}>Week</th><th style={{ ...TH, textAlign: "right" }}>Payout</th><th style={TH}>In Words</th></tr></thead>
            <tbody>
              {wpay.map((w: number, i: number) => (
                <tr key={i}><td style={TD}>Week {i + 1} Payout</td><td style={TDR}>₹{w?.toLocaleString()}</td><td style={TD}>{wpw[i]}</td></tr>
              ))}
              <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                <td style={{ ...TD, fontWeight: 700 }}>Total Payout for the month</td>
                <td style={{ ...TDR, color: "#0E898F" }}>₹{slip.netPay?.toLocaleString()}</td>
                <td style={{ ...TD, fontWeight: 600 }}>{d.netPayWords}</td>
              </tr>
            </tbody>
          </table>

          {/* Employer Contributions */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            <thead><tr><th style={TH}>Employer Contribution</th><th style={{ ...TH, textAlign: "right" }}>Amount</th></tr></thead>
            <tbody>
              <tr><td style={TD}>Employer Contribution to EPS</td><td style={TDR}>{emp.eps?.toLocaleString()}</td></tr>
              <tr><td style={TD}>Employer Contribution to PF</td><td style={TDR}>{emp.pf?.toLocaleString()}</td></tr>
              <tr><td style={TD}>Employer Contribution to NPS</td><td style={TDR}>{emp.nps?.toLocaleString()}</td></tr>
              <tr style={{ background: "#f8fafc", fontWeight: 700 }}><td style={{ ...TD, fontWeight: 700 }}>Sub Total</td><td style={{ ...TDR, color: "#0E898F" }}>{emp.total?.toLocaleString()}</td></tr>
            </tbody>
          </table>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize:12, fontWeight: 700, color: "#1e293b" }}>TOTAL CTC (Gross Earnings + Employer Contributions)</span>
            <span style={{ fontSize:17, fontWeight: 900, color: "#0E898F" }}>₹{slip.totalCtc?.toLocaleString()}</span>
          </div>

          {/* AI Insights */}
          {insightsLoading ? (
            <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "linear-gradient(135deg,#faf5ff,#f3e8ff)", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", gap: 8 }}>
              <Loader2 size={14} style={{ animation: "spin .7s linear infinite", color: "#7c3aed" }} />
              <span style={{ fontSize:11, color: "#7c3aed", fontWeight: 600 }}>AI analyzing payslip...</span>
            </div>
          ) : insights ? (
            <div style={{ marginTop: 16, borderRadius: 12, background: "linear-gradient(135deg,#faf5ff,#f3e8ff)", border: "1px solid #ddd6fe", overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #ddd6fe", display: "flex", alignItems: "center", gap: 8 }}>
                <Brain size={14} style={{ color: "#7c3aed" }} />
                <span style={{ fontSize:11, fontWeight: 800, color: "#6d28d9" }}>AI Payslip Insights</span>
              </div>
              <div style={{ padding: "12px 16px", display: "grid", gap: 10 }}>
                {insights.summary && (
                  <div style={{ fontSize:11, color: "#4c1d95", lineHeight: 1.5 }}>
                    <strong>Summary:</strong> {insights.summary}
                  </div>
                )}
                {insights.attendanceNote && (
                  <div style={{ fontSize:11, color: "#4c1d95", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <Clock size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>Attendance:</strong> {insights.attendanceNote}</span>
                  </div>
                )}
                {insights.taxTip && (
                  <div style={{ fontSize:11, color: "#4c1d95", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <Sparkles size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>Tax Tip:</strong> {insights.taxTip}</span>
                  </div>
                )}
                {insights.complianceNote && (
                  <div style={{ fontSize:11, color: "#4c1d95", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <Shield size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>Compliance:</strong> {insights.complianceNote}</span>
                  </div>
                )}
                {insights.costToCompanyBreakdown && (
                  <div style={{ fontSize:11, color: "#4c1d95", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <IndianRupee size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><strong>CTC Breakdown:</strong> {insights.costToCompanyBreakdown}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div style={{ fontSize:10, color: "#94a3b8", marginTop: 12, fontStyle: "italic" }}>
            Note: This is a computer generated payslip and does not require authentication.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Staff Overview Panel ─────────────────────────────────────────────────────
function StaffOverviewPanel({ onManageStaff }: { onManageStaff: () => void }) {
  const router = useRouter();
  const [stats, setStats]       = useState<any>(null);
  const [recent, setRecent]     = useState<any[]>([]);
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, listRes] = await Promise.all([
          api("/api/config/staff?stats=true&limit=1"),
          api("/api/config/staff?limit=100&sortBy=joinDate&sortDir=desc"),
        ]);

        if (statsRes.success) {
          setStats(statsRes.data?.stats || statsRes.data?.pagination || null);
        }

        if (listRes.success) {
          const members: any[] = listRes.data?.data || [];
          setRecent(members.slice(0, 8));

          const counts: Record<string, number> = {};
          members.forEach((m: any) => {
            counts[m.role] = (counts[m.role] || 0) + 1;
          });
          setRoleCounts(counts);

          if (!statsRes.success || !statsRes.data?.stats) {
            const total    = listRes.data?.pagination?.total ?? members.length;
            const active   = members.filter((m: any) => m.isActive).length;
            const inactive = members.filter((m: any) => !m.isActive).length;
            const credSent = members.filter((m: any) => m.credentialsSent).length;
            setStats({ total, active, inactive, credentialsSent: credSent });
          }
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "80px 0", color: "#94a3b8" }}>
      <Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} />Loading overview...
    </div>
  );

  const total    = stats?.total    ?? 0;
  const active   = stats?.active   ?? 0;
  const inactive = stats?.inactive ?? (total - active);
  const credSent = stats?.credentialsSent ?? 0;

  const summaryCards = [
    { label: "Total Staff",         val: total,    icon: <Users size={20} color="#fff" />,        iconBg: "#0E898F", bg: "#E6F4F4" },
    { label: "Active",              val: active,   icon: <UserCheck size={20} color="#fff" />,    iconBg: "#10b981", bg: "#f0fdf4" },
    { label: "Inactive",            val: inactive, icon: <UserX size={20} color="#fff" />,        iconBg: "#f59e0b", bg: "#fffbeb" },
    { label: "Portal Access Sent",  val: credSent, icon: <Send size={20} color="#fff" />,         iconBg: "#8b5cf6", bg: "#faf5ff" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Gradient Header Banner */}
      <div style={{ background: "linear-gradient(135deg,#0E898F,#07595D)", borderRadius: 16, padding: "24px 28px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize:19, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={22} /> Staff & Team Overview
          </div>
          <div style={{ fontSize:11, color: "rgba(255,255,255,.75)" }}>
            {total} total staff members · {active} active · {inactive} inactive
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onManageStaff}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.2)", color: "#fff", fontSize:11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} /> Manage Staff
          </button>
          <button onClick={() => router.push("/hospitaladmin/configure?tab=doctors")}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", fontSize:11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Stethoscope size={14} /> Manage Doctors
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${c.iconBg}44` }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize:10, color: "#94a3b8", marginTop: 4 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Role Distribution */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>Staff by Role</div>
              <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>Distribution across all roles</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={15} color="#0E898F" />
            </div>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {STAFF_ROLES.filter(r => roleCounts[r.value] > 0).length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize:12 }}>
                No staff data available
              </div>
            ) : (
              STAFF_ROLES.filter(r => roleCounts[r.value] > 0).map(role => {
                const count = roleCounts[role.value] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={role.value}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 100, fontSize:10, fontWeight: 700, background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                          {role.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize:11, fontWeight: 700, color: "#1e293b" }}>{count}</span>
                        <span style={{ fontSize:10, color: "#94a3b8" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: role.color, borderRadius: 100, transition: "width .5s ease" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Staff */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>Recently Added</div>
              <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>Latest staff members onboarded</div>
            </div>
            <button onClick={onManageStaff}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize:10, fontWeight: 600, color: "#0E898F", background: "#E6F4F4", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {recent.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize:12 }}>
                <User size={26} style={{ margin: "0 auto 8px", display: "block", opacity: .3 }} />
                No staff members yet
              </div>
            ) : (
              recent.map((m: any) => {
                const role = STAFF_ROLES.find(r => r.value === m.role);
                return (
                  <div key={m.id}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f8fafc", cursor: "default" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: AVATAR_GRAD[m.role] || AVATAR_GRAD.OTHER, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize:12, color: AVATAR_COLOR[m.role] || "#475569", flexShrink: 0 }}>
                      {initials(m.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>{m.email}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 100, fontSize:10, fontWeight: 700, background: role?.bg || "#f8fafc", color: role?.color || "#475569", border: `1px solid ${role?.border || "#e2e8f0"}` }}>
                        {role?.label || m.role}
                      </span>
                      <span style={{ fontSize:10, padding: "1px 7px", borderRadius: 100, background: m.isActive ? "#f0fdf4" : "#f8fafc", color: m.isActive ? "#16a34a" : "#94a3b8", fontWeight: 600, border: `1px solid ${m.isActive ? "#bbf7d0" : "#e2e8f0"}` }}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Credential Status Row */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>Portal Access Status</div>
            <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>Staff members who can log into the portal</div>
          </div>
          <button onClick={onManageStaff}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1.5px solid #0E898F", background: "none", color: "#0E898F", fontSize:11, fontWeight: 600, cursor: "pointer" }}>
            <Send size={13} /> Send Credentials
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "Credentials Sent",    val: credSent,           color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", icon: <CheckCircle2 size={18} /> },
            { label: "Pending Send",        val: Math.max(0, active - credSent), color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: <Activity size={18} /> },
            { label: "Inactive (No Login)", val: inactive,            color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0", icon: <UserX size={18} /> },
          ].map((c, i) => (
            <div key={i} style={{ padding: "14px 18px", borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ color: c.color }}>{c.icon}</div>
              <div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize:10, color: "#94a3b8", marginTop: 3 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          {
            title: "Add New Staff",
            desc: "Onboard a new staff member to your hospital team",
            icon: <Users size={22} color="#fff" />,
            bg: "linear-gradient(135deg,#0E898F,#07595D)",
            action: onManageStaff,
            label: "Add Staff",
          },
          {
            title: "Configure Roles",
            desc: "Manage staff roles, permissions, and access levels",
            icon: <Shield size={22} color="#fff" />,
            bg: "linear-gradient(135deg,#6d28d9,#7c3aed)",
            action: () => router.push("/hospitaladmin/configure?tab=staff"),
            label: "Configure",
          },
          {
            title: "Manage Doctors",
            desc: "View and manage all registered doctors and their credentials",
            icon: <Stethoscope size={22} color="#fff" />,
            bg: "linear-gradient(135deg,#10b981,#059669)",
            action: () => router.push("/hospitaladmin/configure?tab=doctors"),
            label: "Go to Doctors",
          },
        ].map((card, i) => (
          <div key={i} style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ background: card.bg, padding: "20px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {card.icon}
              </div>
              <div style={{ color: "#fff" }}>
                <div style={{ fontSize:14, fontWeight: 700 }}>{card.title}</div>
                <div style={{ fontSize:10, opacity: .8, marginTop: 2 }}>{card.desc}</div>
              </div>
            </div>
            <div style={{ padding: "14px 22px" }}>
              <button onClick={card.action}
                style={{ width: "100%", padding: "9px 0", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#334155", fontSize:11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {card.label} <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
