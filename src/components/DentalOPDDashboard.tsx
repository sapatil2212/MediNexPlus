"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Stethoscope, Users, RefreshCw, Loader2,
  CheckCircle2, Clock,
  BarChart2, Search, TrendingUp,
  FileText, UserCheck, Building2,
  AlertCircle, CheckCheck, Timer, User2, ArrowRight,
  CalendarDays, UserPlus, ClipboardList,
  Phone, X, ChevronDown, ChevronUp, Edit3, Check,
  IndianRupee, Plus, Receipt, LayoutDashboard,
  Mail, Activity, TrendingDown, Wallet, CreditCard,
  History, Settings, LogOut, Menu, User,
  Download, FileType, FileSpreadsheet, ArrowUpDown,
  Eye, Trash2, Pencil
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Bar,
  Line,
  BarChart
} from "recharts";
import { BookingWizard } from "@/components/AppointmentPanel";
import { PatientsManagementPanel } from "@/app/subdept/dashboard/PatientsManagementPanel";

// --- Components from parent or local ---
const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string; Icon: any }> = {
  SCHEDULED:   { label: "Waiting",         bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", Icon: Clock },
  CONFIRMED:   { label: "In Consultation",  bg: "#fffbeb", color: "#b45309", border: "#fde68a", Icon: Timer },
  COMPLETED:   { label: "Completed",       bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0", Icon: CheckCheck },
  CANCELLED:   { label: "Cancelled",       bg: "#fff5f5", color: "#ef4444", border: "#fecaca", Icon: AlertCircle },
  NO_SHOW:     { label: "No Show",         bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", Icon: User2 },
  RESCHEDULED: { label: "Rescheduled",     bg: "#fef3c7", color: "#92400e", border: "#fcd34d", Icon: CalendarDays },
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (t?: string) => t ? t.slice(0, 5) : "—";
const todayISO = () => new Date().toISOString().slice(0, 10);
const tomorrowISO = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

export default function DentalOPDDashboard({ profile, user, activeTab, onTabChange, meta }: {
  profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void; meta: any
}) {
  const [tab, setTab] = useState<string>((activeTab as any) || "overview");
  useEffect(() => { if (activeTab) setTab(activeTab); }, [activeTab]);

  const switchTab = (t: string) => {
    setTab(t);
    onTabChange?.(t);
  };

  // Dynamic department name
  const deptName = profile?.customName || profile?.name || "OPD";
  const deptType = profile?.type || "OPD";

  // --- States ---
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [done,  setDone]  = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsMeta, setRecordsMeta] = useState<any>({});
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recSearch, setRecSearch] = useState("");

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this procedure record?")) return;
    setRecordsLoading(true);
    await fetch(`/api/subdept/records/${id}`, { method: "DELETE", credentials: "include" });
    loadRecords();
  };

  const filteredRecords = records.filter(r => !recSearch || r.patient?.name?.toLowerCase().includes(recSearch.toLowerCase()) || r.procedure?.name?.toLowerCase().includes(recSearch.toLowerCase()));
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState<"revenue" | "expense" | null>(null);
  const [financeForm, setFinanceForm] = useState({ title: "", amount: "", category: "OTHER", date: todayISO(), description: "" });
  const [submittingFinance, setSubmittingFinance] = useState(false);

  const [qType, setQType] = useState<"pending" | "completed">("pending");
  const [qData, setQData] = useState<any>(null);

  // --- Reports State ---
  const [recentSearch, setRecentSearch] = useState("");
  const [recentSortField, setRecentSortField] = useState("date");
  const [recentSortDir, setRecentSortDir] = useState<"asc" | "desc">("desc");
  const [recentExportOpen, setRecentExportOpen] = useState(false);

  // --- Reports Helpers ---
  const handleRecentSort = (f: string) => {
    if (recentSortField === f) setRecentSortDir(prev => prev === "asc" ? "desc" : "asc");
    else { setRecentSortField(f); setRecentSortDir("desc"); }
  };

  const sortIcon = (f: string, curF: string, dir: "asc" | "desc") => {
    if (f !== curF) return <ArrowUpDown size={10} color="#94a3b8" />;
    return dir === "asc" ? <ChevronUp size={10} color="#0E898F" /> : <ChevronDown size={10} color="#0E898F" />;
  };

  const exportRecent = (fmt: "pdf" | "excel" | "word") => {
    alert(`Exporting as ${fmt.toUpperCase()}... (Functionality to be implemented with backend)`);
  };

  const ExportDropdown = ({ open, onClose, onExport }: { open: boolean; onClose: () => void; onExport: (fmt: "pdf" | "excel" | "word") => void }) => {
    if (!open) return null;
    return (
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.10)", zIndex: 200, minWidth: 160, padding: "6px 0" }}>
        {([["pdf", <FileText size={13} />, "Export PDF"], ["excel", <FileSpreadsheet size={13} />, "Export Excel"], ["word", <FileType size={13} />, "Export Word"]] as any[]).map(([f, icon, label]) => (
          <button key={f} onClick={() => { onExport(f); onClose(); }}
            style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#334155", fontWeight: 500, fontFamily: "inherit", textAlign: "left" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >{icon}{label}</button>
        ))}
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: -1 }} />
      </div>
    );
  };

  // --- Loaders ---
  const loadRecords = useCallback(async (search = "") => {
    setRecordsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200", ...(search ? { search } : {}), ...(profile?.departmentId ? { departmentId: profile.departmentId } : {}) });
      const res = await fetch(`/api/subdept/records?${params.toString()}`, { credentials: "include" }).then(r => r.json());
      if (res.success) {
        setRecords(res.data?.data || []);
        setRecordsMeta(res.data?.stats || {});
      }
    } catch (err) {
      console.error("Failed to load records", err);
    } finally {
      setRecordsLoading(false);
    }
  }, [profile?.departmentId]);

  const loadAppointments = useCallback(async (dateParam?: string) => {
    setApptLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateParam) params.set("date", dateParam);
      params.set("limit", "200");
      if (profile?.departmentId) params.set("departmentId", profile.departmentId);
      params.set("sortBy", "appointmentDate");
      params.set("sortOrder", "desc");
      const res = await fetch(`/api/appointments?${params.toString()}`, { credentials: "include" }).then(r => r.json());
      if (res.success) {
        const appts = res.data?.appointments || res.data?.data || res.data || [];
        setAppointments(Array.isArray(appts) ? appts : []);
      }
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setApptLoading(false);
    }
  }, [profile?.departmentId]);

  const loadOverviewData = useCallback(async () => {
    setQueueLoading(true);
    setRecordsLoading(true);
    setReportLoading(true);

    try {
      const [queueRes, recordRes, reportRes] = await Promise.all([
        fetch("/api/subdept/queue", { credentials: "include" }).then(r => r.json()),
        fetch(`/api/subdept/records?limit=5${profile?.departmentId ? `&departmentId=${profile.departmentId}` : ""}`, { credentials: "include" }).then(r => r.json()),
        fetch("/api/subdept/reports", { credentials: "include" }).then(r => r.json())
      ]);

      if (queueRes.success) {
        setQData(queueRes.data);
        setQueue(queueRes.data?.queue || []);
        setDone(queueRes.data?.completedList || []);
      }
      if (recordRes.success) {
        setRecords(recordRes.data?.data || []);
        setRecordsMeta(recordRes.data?.stats || {});
      }
      if (reportRes.success) setReportData(reportRes.data);
    } catch (err) {
      console.error("Failed to load overview data", err);
    } finally {
      setQueueLoading(false);
      setRecordsLoading(false);
      setReportLoading(false);
    }
  }, []);

  const loadFinanceData = useCallback(async () => {
    setRevenueLoading(true);
    setExpensesLoading(true);
    try {
      const deptId = profile?.departmentId || "";
      const [billRes, expRes] = await Promise.all([
        fetch(`/api/billing?departmentId=${deptId}&limit=50`, { credentials: "include" }).then(r => r.json()),
        fetch("/api/expense?limit=100", { credentials: "include" }).then(r => r.json())
      ]);

      if (billRes.success) setRevenueData(billRes.data);
      if (expRes.success) setExpenses(expRes.data?.expenses || []);
    } catch (err) {
      console.error("Failed to load finance data", err);
    } finally {
      setRevenueLoading(false);
      setExpensesLoading(false);
    }
  }, [profile?.departmentId]);

  const [qSearch, setQSearch] = useState("");
  const [apptSearch, setApptSearch] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptDateFilter, setApptDateFilter] = useState<"all"|"today"|"tomorrow"|"custom">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [apptExpand, setApptExpand] = useState<string | null>(null);
  const [apptViewItem,   setApptViewItem]   = useState<any>(null);
  const [apptEditItem,   setApptEditItem]   = useState<any>(null);
  const [apptEditStatus, setApptEditStatus] = useState("");
  const [apptEditNotes,  setApptEditNotes]  = useState("");
  const [apptSaving,     setApptSaving]     = useState(false);
  const [apptDeleteItem, setApptDeleteItem] = useState<any>(null);

  const apptDateParam = apptDateFilter === "today" ? todayISO() : apptDateFilter === "tomorrow" ? tomorrowISO() : apptDateFilter === "custom" ? apptDate : undefined;

  useEffect(() => {
    if (tab === "overview") {
      loadOverviewData();
      loadAppointments(todayISO());
    }
    if (tab === "queue") loadOverviewData();
    if (tab === "reports") loadOverviewData();
    if (tab === "appointments") loadAppointments(apptDateParam);
    if (tab === "records") loadRecords();
    if (tab === "revenue" || tab === "expenses") loadFinanceData();
  }, [tab, loadOverviewData, loadAppointments, loadRecords, loadFinanceData, apptDateFilter, apptDate]); // eslint-disable-line

  const initials = (n: string) => (n || "SD").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

  const updateApptStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/appointments/${id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    loadOverviewData();
    setUpdatingId(null);
  };

  const saveApptEdit = async () => {
    if (!apptEditItem) return;
    setApptSaving(true);
    await fetch(`/api/appointments/${apptEditItem.id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: apptEditStatus, notes: apptEditNotes })
    });
    setApptEditItem(null);
    setApptSaving(false);
    loadAppointments(apptDateParam);
  };

  const confirmDeleteAppt = async () => {
    if (!apptDeleteItem) return;
    setUpdatingId(apptDeleteItem.id);
    await fetch(`/api/appointments/${apptDeleteItem.id}`, { method: "DELETE", credentials: "include" });
    setApptDeleteItem(null);
    setUpdatingId(null);
    loadAppointments(apptDateParam);
  };

  const deleteAppt = async (id: string) => {
    if (!confirm("Are you sure you want to cancel/delete this appointment?")) return;
    setUpdatingId(id);
    await fetch(`/api/appointments/${id}`, { method: "DELETE", credentials: "include" });
    loadOverviewData();
    setUpdatingId(null);
  };

  const updateQueueStatus = async (appointmentId: string, status: string) => {
    setUpdatingId(appointmentId);
    await fetch("/api/subdept/queue", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, status })
    });
    loadOverviewData();
    setUpdatingId(appointmentId === null ? "" : null);
  };

  const filteredQueue = queue.filter(q => !qSearch || q.patient?.name?.toLowerCase().includes(qSearch.toLowerCase()) || String(q.tokenNumber || "").includes(qSearch));
  const filteredAppts = appointments.filter(a => !apptSearch || a.patient?.name?.toLowerCase().includes(apptSearch.toLowerCase()) || a.patient?.patientId?.toLowerCase().includes(apptSearch.toLowerCase()));

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFinance(true);
    try {
      const isExpense = showFinanceModal === "expense";
      const endpoint = isExpense ? "/api/expense" : "/api/pharmacy/revenue-expense";
      const payload = isExpense
        ? { title: financeForm.title, category: financeForm.category, amount: financeForm.amount, date: financeForm.date, description: financeForm.description, department: deptName }
        : { ...financeForm, type: "REVENUE" };
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) {
        setShowFinanceModal(null);
        setFinanceForm({ title: "", amount: "", category: "OTHER", date: todayISO(), description: "" });
        loadFinanceData();
        loadOverviewData();
      } else {
        alert(res.message || "Failed to save entry");
      }
    } catch (err) {
      console.error("Finance submit error", err);
    } finally {
      setSubmittingFinance(false);
    }
  };

  return (
    <div style={{ animation: "fadeUp .35s ease" }}>
      {/* ── BookingWizard Modal ── */}
      {showBooking && <BookingWizard onSuccess={() => { setShowBooking(false); loadOverviewData(); }} onClose={() => setShowBooking(false)} />}

      {/* ── Finance Modal (Manual Revenue/Expense) ── */}
      {showFinanceModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowFinanceModal(null)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 24px 80px rgba(0,0,0,.18)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Add Manual {showFinanceModal === "revenue" ? "Revenue" : "Expense"}</div>
              <button onClick={() => setShowFinanceModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleFinanceSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Title / Reason</label>
                <input required value={financeForm.title} onChange={e => setFinanceForm({ ...financeForm, title: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} placeholder={showFinanceModal === "revenue" ? "e.g. Lab Consultation Fee" : "e.g. Medical Supplies"} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Amount (₹)</label>
                  <input required type="number" value={financeForm.amount} onChange={e => setFinanceForm({ ...financeForm, amount: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} placeholder="0.00" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Date</label>
                  <input required type="date" value={financeForm.date} onChange={e => setFinanceForm({ ...financeForm, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Category</label>
                <select value={financeForm.category} onChange={e => setFinanceForm({ ...financeForm, category: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff" }}>
                  <option value="OTHER">Other</option>
                  <option value="SUPPLIES">Supplies</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="SALARY">Salary</option>
                  <option value="CONSULTATION">Consultation</option>
                  <option value="EQUIPMENT">Equipment</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Remarks / Description</label>
                <textarea value={financeForm.description} onChange={e => setFinanceForm({ ...financeForm, description: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, minHeight: 80, resize: "none" }} placeholder="Additional details..." />
              </div>
              <button type="submit" disabled={submittingFinance} style={{
                marginTop: 8, padding: "12px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #0E898F, #0A6B70)", color: "#fff",
                fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
                {submittingFinance ? <Loader2 size={16} className="opd2-spin" /> : <Plus size={16} />}
                Save {showFinanceModal === "revenue" ? "Revenue" : "Expense"} Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ OVERVIEW TAB ══ */}
      {tab === "overview" && (
        <>
          {/* Header: title + live indicator + refresh */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>{deptName} Overview</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 3px #dcfce7", flexShrink: 0 }} />
                Live &middot; Updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setShowBooking(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12,
                  border: "none", background: "linear-gradient(135deg, #0E898F, #0A6B70)",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
              >
                <Plus size={16} strokeWidth={3} />
                New Appointment
              </button>
              <button
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}
                onClick={() => loadOverviewData()}
              >
                <RefreshCw size={13} className={apptLoading ? "opd2-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {/* Stats Grid - 6 Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              {
                label: "Today's Appts", value: appointments.length, Icon: CalendarDays, color: "#0891b2", bg: "#ecfeff",
                badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                onClick: () => switchTab("appointments")
              },
              {
                label: "Waiting Patients", value: queue.length, Icon: Clock, color: queue.length > 5 ? "#ea580c" : "#0891b2", bg: queue.length > 5 ? "#fff7ed" : "#ecfeff",
                badge: queue.length > 5 ? { text: "URGENT", bg: "#fff3e6", color: "#ea580c", border: "#fed7aa" } : { text: "NORMAL", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                onClick: () => switchTab("queue")
              },
              {
                label: "Completed Today", value: done.length, Icon: CheckCircle2, color: "#10b981", bg: "#f0fdf4",
                badge: { text: "DONE", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                onClick: () => switchTab("queue")
              },
              {
                label: "Procedure Records", value: recordsMeta.todayRecords || 0, Icon: ClipboardList, color: "#6366f1", bg: "#eef2ff",
                badge: { text: "TODAY", bg: "#eef2ff", color: "#6366f1", border: "#c7d2fe" },
                onClick: () => switchTab("records")
              },
              {
                label: "Revenue Today", value: `₹${(recordsMeta.todayRevenue || 0).toLocaleString("en-IN")}`, Icon: IndianRupee, color: "#16a34a", bg: "#f0fdf4",
                badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                onClick: () => switchTab("revenue")
              },
              {
                label: "Total Patients", value: recordsMeta.totalRecords || 0, Icon: Users, color: "#059669", bg: "#f0fdf4",
                onClick: () => switchTab("patients")
              },
            ].map((s, i) => {
              const SI = s.Icon;
              return (
                <div key={i} onClick={s.onClick} style={{
                  cursor: "pointer",
                  padding: "10px 12px",
                  gap: 10,
                  background: "#fff",
                  borderRadius: 12,
                  border: `1px solid ${s.badge?.color === "#ea580c" ? "#fed7aa" : "#e2e8f0"}`,
                  display: "flex",
                  alignItems: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                  transition: "transform .18s, box-shadow .18s"
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SI size={18} color={s.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.value}</div>
                      {s.badge && (
                        <span style={{
                          fontSize: 7,
                          fontWeight: 700,
                          color: s.badge.color,
                          background: s.badge.bg,
                          padding: "1px 4px",
                          borderRadius: 8,
                          border: `1px solid ${s.badge.border}`,
                          flexShrink: 0
                        }}>
                          {s.badge.text}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          {reportLoading || !reportData ? (
            <div style={{ height: 280, background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: "#94a3b8", fontSize: 12, gap: 8 }}>
              <Loader2 size={16} className="opd2-spin" />Loading {deptName} analytics...
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 20 }}>
              {/* Daily Trend Chart */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{deptName} Patient Flow & Revenue</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>Activity trend for the last 7 days</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#64748b" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: "#0891b2" }} /> Patients
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#64748b" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: "#10b981" }} /> Revenue
                    </div>
                  </div>
                </div>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData?.dailyTrend?.slice(-8) || []} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradOverCount" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2" stopOpacity={.3} /><stop offset="100%" stopColor="#0891b2" stopOpacity={0} /></linearGradient>
                        <linearGradient id="gradOverRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={.25} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#f1f5f9" }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 10, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }} />
                      <Area yAxisId="left" type="monotone" dataKey="count" stroke="#0891b2" fill="url(#gradOverCount)" strokeWidth={2.5} name="Patients" dot={{ r: 4, fill: "#0891b2", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                      <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#gradOverRev)" strokeWidth={2.5} name="Revenue" dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribution Pie Chart */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Procedure Distribution</div>
                <div style={{ width: "100%", height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={(Array.isArray(reportData?.byType) ? reportData.byType.map((d: any) => ({ name: d.type || d.name || "Unknown", value: d.count || 0 })) : Object.entries(reportData?.byType || {}).map(([name, val]: [string, any]) => ({ name, value: val.count || 0 })))}
                        dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} strokeWidth={0}
                      >
                        {(Array.isArray(reportData?.byType) ? reportData.byType : Object.entries(reportData?.byType || {})).map((_: any, i: number) => (
                          <Cell key={i} fill={["#0891b2", "#6366f1", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#8b5cf6", "#06b6d4"][i % 8]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginTop: 10 }}>
                  {(Array.isArray(reportData?.byType)
                    ? reportData.byType.map((d: any) => ({ name: d.type || d.name || "Unknown", count: d.count || 0 }))
                    : Object.entries(reportData?.byType || {}).map(([name, val]: any) => ({ name, count: val.count || 0 }))
                  ).slice(0, 6).map((item: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9, color: "#64748b" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ width: 6, height: 6, borderRadius: 1, background: ["#0891b2", "#6366f1", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#8b5cf6", "#06b6d4"][i % 8], flexShrink: 0 }} />
                        {item.name}
                      </span>
                      <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Completed Patients Today strip */}
          {done.length > 0 && (
            <div className="opd2-card" style={{marginBottom:16}}>
              <div className="opd2-card-hd">
                <span className="opd2-card-title">
                  <CheckCircle2 size={14} color="#16a34a"/>Completed OPD Visits Today
                  <span style={{fontSize:10,background:"#f0fdf4",color:"#15803d",padding:"2px 8px",borderRadius:100,border:"1px solid #bbf7d0",fontWeight:700}}>{done.length}</span>
                </span>
                <button onClick={()=>switchTab("queue")} style={{fontSize:11,color:"#16a34a",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3,fontWeight:600}}>View Queue<CheckCheck size={11}/></button>
              </div>
              <div style={{display:"flex",flexWrap:"wrap" as const,gap:6,padding:"10px 14px"}}>
                {done.slice(0,16).map((d:any,i:number)=>(
                  <span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:"#f0fdf4",border:"1px solid #bbf7d0",fontSize:11,color:"#166534",fontWeight:600}}>
                    <CheckCheck size={10}/>{d.patient?.name||"—"}
                  </span>
                ))}
                {done.length > 16 && <span style={{fontSize:11,color:"#94a3b8",padding:"4px 6px"}}>+{done.length-16} more</span>}
              </div>
            </div>
          )}

          {/* Recent Activity Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {/* Recent Appointments */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}><CalendarDays size={15} color="#0891b2" />Recent Appointments</span>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{appointments.length} today</span>
              </div>
              <div style={{ padding: "10px 0" }}>
                {apptLoading ? (
                  <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Loader2 size={16} className="opd2-spin" />Loading...
                  </div>
                ) : appointments.length > 0 ? (
                  appointments.slice(0, 5).map((a: any) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 18px", borderBottom: "1px solid #f8fafc" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={14} color="#0891b2" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{a.patient?.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{a.doctor?.name} · {a.timeSlot}</div>
                      </div>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 100,
                        background: STATUS_CFG[a.status]?.bg || "#f1f5f9",
                        color: STATUS_CFG[a.status]?.color || "#475569",
                        fontWeight: 700, border: `1px solid ${STATUS_CFG[a.status]?.border || "#e2e8f0"}`
                      }}>
                        {STATUS_CFG[a.status]?.label || a.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No appointments found today</div>
                )}
                {appointments.length > 0 && (
                  <div style={{ padding: "10px 18px", fontSize: 11, color: "#0891b2", fontWeight: 600, cursor: "pointer" }} onClick={() => switchTab("appointments")}>View all appointments →</div>
                )}
              </div>
            </div>

            {/* Recent Records / Revenue */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}><Receipt size={15} color="#0891b2" />Recent Procedures</span>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{records.length} recent</span>
              </div>
              <div style={{ padding: "10px 0" }}>
                {recordsLoading ? (
                  <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Loader2 size={16} className="opd2-spin" />Loading...
                  </div>
                ) : records.length > 0 ? (
                  records.slice(0, 5).map((r: any) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 18px", borderBottom: "1px solid #f8fafc" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <IndianRupee size={14} color="#16a34a" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{r.patient?.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{r.procedure?.name} · {fmt(r.performedAt)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}>₹{(r.amount || 0).toLocaleString()}</div>
                        <div style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#16a34a",
                          background: "#f0fdf4",
                          padding: "2px 6px",
                          borderRadius: 4,
                          marginTop: 2,
                          display: "inline-block",
                          border: "1px solid #bbf7d0"
                        }}>
                          {r.status || "Completed"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No procedure records found</div>
                )}
                {records.length > 0 && (
                  <div style={{ padding: "10px 18px", fontSize: 11, color: "#0891b2", fontWeight: 600, cursor: "pointer" }} onClick={() => switchTab("records")}>Go to all records →</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ OTHER TABS ══ */}
      {tab !== "overview" && (
        <div style={tab !== "reports" ? { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20 } : {}}>
          {tab !== "reports" && (
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => switchTab("overview")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /></button>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Management
            </div>
          )}

          {tab === "appointments" && (
            <div style={{ minHeight: 400 }}>
              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                {/* Left: search + date filters */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", width: 240 }}>
                    <Search size={14} color="#94a3b8" />
                    <input style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "#334155", width: "100%" }}
                      placeholder="Search patient / UHID..." value={apptSearch} onChange={e => setApptSearch(e.target.value)} />
                  </div>
                  {/* Quick filter buttons */}
                  {(["all", "today", "tomorrow"] as const).map(f => (
                    <button key={f} onClick={() => setApptDateFilter(f)} style={{
                      padding: "7px 14px", borderRadius: 9, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      background: apptDateFilter === f ? "linear-gradient(135deg, #0E898F, #0A6B70)" : "#f1f5f9",
                      color: apptDateFilter === f ? "#fff" : "#64748b",
                      transition: "all .15s"
                    }}>
                      {f === "all" ? "All Time" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                  <button onClick={() => setApptDateFilter("custom")} style={{
                    padding: "7px 14px", borderRadius: 9, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: apptDateFilter === "custom" ? "linear-gradient(135deg, #0E898F, #0A6B70)" : "#f1f5f9",
                    color: apptDateFilter === "custom" ? "#fff" : "#64748b",
                  }}>Custom</button>
                  {apptDateFilter === "custom" && (
                    <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)}
                      style={{ border: "1px solid #e2e8f0", borderRadius: 9, padding: "7px 12px", fontSize: 12, color: "#475569" }} />
                  )}
                </div>
                {/* Right: new + refresh */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowBooking(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0E898F, #0A6B70)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <Plus size={14} /> New Appointment
                  </button>
                  <button onClick={() => loadAppointments(apptDateParam)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11.5, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>
                    <RefreshCw size={13} className={apptLoading ? "opd2-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Count label */}
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>
                {apptLoading ? "Loading…" : `${filteredAppts.length} appointment${filteredAppts.length !== 1 ? "s" : ""} ${apptDateFilter === "all" ? "(all time)" : apptDateFilter === "custom" && apptDate ? `on ${fmt(apptDate)}` : `(${apptDateFilter})`}`}
              </div>

              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.03)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["#", "Patient", "UHID", "Doctor", "Date", "Time", "Status", "Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "11px 14px", borderBottom: "2px solid #f1f5f9", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apptLoading
                      ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 60 }}><Loader2 className="opd2-spin" size={24} style={{ color: "#94a3b8" }} /></td></tr>
                      : filteredAppts.length === 0
                        ? <tr><td colSpan={8} style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
                            <CalendarDays size={32} style={{ display: "block", margin: "0 auto 10px", opacity: .15 }} />
                            <div style={{ fontSize: 13 }}>No appointments found</div>
                          </td></tr>
                        : filteredAppts.map(a => {
                            const s = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
                            const SIcon = s.Icon;
                            return (
                              <tr key={a.id} style={{ borderBottom: "1px solid #f8fafc", transition: "background .15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <td style={{ padding: "11px 14px" }}>
                                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #0E898F, #0A6B70)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                                    {a.tokenNumber ? `#${a.tokenNumber}` : "—"}
                                  </div>
                                </td>
                                <td style={{ padding: "11px 14px" }}>
                                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12.5 }}>{a.patient?.name}</div>
                                  <div style={{ fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}><Phone size={8} />{a.patient?.phone}</div>
                                </td>
                                <td style={{ padding: "11px 14px", fontSize: 11, color: "#64748b", fontWeight: 600 }}>{a.patient?.patientId}</td>
                                <td style={{ padding: "11px 14px", fontSize: 12, color: "#475569" }}>Dr. {a.doctor?.name}</td>
                                <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{a.appointmentDate ? fmt(a.appointmentDate) : "—"}</td>
                                <td style={{ padding: "11px 14px", fontWeight: 700, color: "#334155", fontSize: 12 }}>{fmtTime(a.timeSlot)}</td>
                                <td style={{ padding: "11px 14px" }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color, border: `1px solid ${s.border}`, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <SIcon size={9} />{s.label}
                                  </span>
                                </td>
                                <td style={{ padding: "11px 14px" }}>
                                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                    {/* View */}
                                    <button title="View Details" onClick={() => setApptViewItem(a)}
                                      style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                      <Eye size={13} />
                                    </button>
                                    {/* Edit / Status */}
                                    <button title="Edit Status" onClick={() => { setApptEditItem(a); setApptEditStatus(a.status); setApptEditNotes(a.notes || ""); }}
                                      style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #fde68a", background: "#fffbeb", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                      <Pencil size={13} />
                                    </button>
                                    {/* Delete */}
                                    <button title="Cancel / Delete" onClick={() => setApptDeleteItem(a)} disabled={updatingId === a.id}
                                      style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff5f5", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                      {updatingId === a.id ? <Loader2 size={11} className="opd2-spin" /> : <Trash2 size={13} />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "queue" && (
            <div style={{ minHeight: 400 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setQType("pending")} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: qType === "pending" ? "#0891b2" : "#f1f5f9", color: qType === "pending" ? "#fff" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{qData?.isOPDMode ? "Today's Queue" : "Pending Referrals"} ({queue.length})</button>
                  <button onClick={() => setQType("completed")} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: qType === "completed" ? "#0891b2" : "#f1f5f9", color: qType === "completed" ? "#fff" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Completed ({qData?.completedCount || 0})</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", width: 260 }}>
                    <Search size={14} color="#94a3b8" />
                    <input style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "#334155", width: "100%" }}
                      placeholder="Search queue..." value={qSearch} onChange={e => setQSearch(e.target.value)} />
                  </div>
                  <button onClick={() => loadOverviewData()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                    <RefreshCw size={13} className={queueLoading ? "opd2-spin" : ""} /> Refresh
                  </button>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Token", "Patient", "Referring Doctor", "Referral Note", "Time", "Status", "Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "12px 14px", borderBottom: "2px solid #f1f5f9", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queueLoading ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40 }}><Loader2 className="opd2-spin" /></td></tr>
                      : (qType === "pending" ? filteredQueue : (qData?.completedList || [])).length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>{qType === "pending" ? (qData?.isOPDMode ? "No patients in queue today" : "No pending referrals") : (qData?.isOPDMode ? "No completed appointments today" : "No completed referrals")}</td></tr>
                        : (qType === "pending" ? filteredQueue : (qData?.completedList || [])).map((q: any) => {
                          const s = STATUS_CFG[q.status] || STATUS_CFG.SCHEDULED;
                          return (
                            <tr key={q.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                              <td style={{ padding: "12px 14px" }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "#0891b2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>#{q.tokenNumber || "—"}</div></td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12.5 }}>{q.patient?.name}</div>
                                <div style={{ fontSize: 10, color: "#94a3b8" }}>{q.patient?.patientId}</div>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{q.doctor?.name}</div>
                                <div style={{ fontSize: 10, color: "#94a3b8" }}>{q.doctor?.specialization}</div>
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 11, color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.subDeptNote || q.doctorNotes || "—"}</td>
                              <td style={{ padding: "12px 14px", fontWeight: 700, color: "#334155", fontSize: 12 }}>{fmtTime(q.timeSlot)}</td>
                              <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: s.bg, color: s.color, border: `1px solid ${s.border}`, display: "inline-flex", alignItems: "center", gap: 4 }}><s.Icon size={9} />{s.label}</span></td>
                              <td style={{ padding: "12px 14px" }}>
                                {qType === "pending" && (
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => updateQueueStatus(q.id, "IN_PROGRESS")} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#ecfeff", color: "#0891b2", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Start</button>
                                    <button onClick={() => updateQueueStatus(q.id, "COMPLETED")} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Finish</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "patients" && <PatientsManagementPanel departmentId={profile?.departmentId || undefined} />}

          {tab === "records" && (
            <div style={{ minHeight: 400 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", width: 300 }}>
                  <Search size={14} color="#94a3b8" />
                  <input style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "#334155", width: "100%" }}
                    placeholder="Search records..." value={recSearch} onChange={e => setRecSearch(e.target.value)} />
                </div>
                <button onClick={() => loadRecords(recSearch)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  <RefreshCw size={13} className={recordsLoading ? "opd2-spin" : ""} /> Refresh
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Date", "Patient", "Procedure", "Type", "Amount", "Status", "Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "12px 14px", borderBottom: "2px solid #f1f5f9", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recordsLoading ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40 }}><Loader2 className="opd2-spin" /></td></tr>
                      : filteredRecords.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No procedure records found</td></tr>
                        : filteredRecords.map((r: any) => (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: "12px 14px", fontSize: 12 }}>{fmt(r.performedAt)}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12.5 }}>{r.patient?.name}</div>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>{r.patient?.patientId}</div>
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569", fontWeight: 600 }}>{r.procedure?.name}</td>
                            <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: "#f1f5f9", color: "#64748b" }}>{r.procedure?.type}</span></td>
                            <td style={{ padding: "12px 14px", fontWeight: 800, color: "#16a34a", fontSize: 12 }}>₹{(r.amount || 0).toLocaleString()}</td>
                            <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>{r.status || "Completed"}</span></td>
                            <td style={{ padding: "12px 14px" }}>
                              <button onClick={() => deleteRecord(r.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#fff5f5", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "revenue" && (
            <div style={{ minHeight: 400 }}>
              {/* KPI row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "Total Bills", value: revenueData?.pagination?.total ?? "—", color: "#0891b2", bg: "#ecfeff" },
                  { label: "Today Revenue", value: `₹${(revenueData?.stats?.todayRevenue || 0).toLocaleString()}`, color: "#16a34a", bg: "#f0fdf4" },
                  { label: "This Month", value: `₹${(revenueData?.stats?.monthRevenue || 0).toLocaleString()}`, color: "#7c3aed", bg: "#f5f3ff" },
                  { label: "Pending Bills", value: revenueData?.stats?.pendingCount ?? "—", color: "#ea580c", bg: "#fff7ed" },
                ].map(k => (
                  <div key={k.label} style={{ background: k.bg, borderRadius: 12, padding: "14px 16px", border: `1px solid ${k.color}22` }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Bills — {deptName}</div>
                <button onClick={() => loadFinanceData()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  <RefreshCw size={13} className={revenueLoading ? "opd2-spin" : ""} /> Refresh
                </button>
              </div>

              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Bill No", "Patient", "Date", "Items", "Total", "Paid", "Status"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "12px 14px", borderBottom: "2px solid #f1f5f9", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {revenueLoading ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40 }}><Loader2 className="opd2-spin" /></td></tr>
                      : !(revenueData?.bills?.length) ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No bills found for this department</td></tr>
                        : (revenueData.bills as any[]).map((b: any) => {
                          const statusCfg: Record<string, { bg: string; color: string; border: string }> = {
                            PAID: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
                            PENDING: { bg: "#fff7ed", color: "#ea580c", border: "#fed7aa" },
                            PARTIALLY_PAID: { bg: "#fefce8", color: "#ca8a04", border: "#fde68a" },
                          };
                          const sc = statusCfg[b.status] || statusCfg.PENDING;
                          return (
                            <tr key={b.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                              <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0891b2", fontSize: 12 }}>{b.billNo}</td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12.5 }}>{b.patient?.name || "—"}</div>
                                <div style={{ fontSize: 10, color: "#94a3b8" }}>{b.patient?.patientId}</div>
                              </td>
                              <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>{fmt(b.createdAt)}</td>
                              <td style={{ padding: "12px 14px", fontSize: 11, color: "#475569" }}>{b.billItems?.length || 0} item{b.billItems?.length !== 1 ? "s" : ""}</td>
                              <td style={{ padding: "12px 14px", fontWeight: 800, color: "#1e293b", fontSize: 12 }}>₹{(b.total || 0).toLocaleString()}</td>
                              <td style={{ padding: "12px 14px", fontWeight: 700, color: "#16a34a", fontSize: 12 }}>₹{(b.paidAmount || 0).toLocaleString()}</td>
                              <td style={{ padding: "12px 14px" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{b.status}</span>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div style={{ minHeight: 400 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{deptName} Analytics & Reports</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Real-time performance metrics and appointment analysis</div>
                </div>
                <button onClick={() => loadOverviewData()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  <RefreshCw size={13} className={reportLoading ? "opd2-spin" : ""} /> Refresh
                </button>
              </div>
              {reportLoading || !reportData ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#94a3b8", gap: 8 }}>
                  <Loader2 size={18} className="opd2-spin" />Loading analytics...
                </div>
              ) : (
                <>
                  {/* KPI Summary Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                    {[
                      { label: "Total Appointments", value: reportData.summary?.totalAppointments || 0, Icon: CalendarDays, color: "#0891b2", bg: "#ecfeff" },
                      { label: "Total Revenue",       value: `₹${(reportData.summary?.totalRevenue || 0).toLocaleString("en-IN")}`, Icon: IndianRupee, color: "#16a34a", bg: "#f0fdf4" },
                      { label: "Unique Patients",     value: reportData.summary?.totalPatients || 0, Icon: Users, color: "#6366f1", bg: "#eef2ff" },
                      { label: "Completion Rate",     value: `${reportData.summary?.completionRate || 0}%`, Icon: CheckCircle2, color: "#10b981", bg: "#f0fdf4" },
                    ].map((s, i) => { const SI = s.Icon; return (
                      <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><SI size={18} color={s.color} /></div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: "#64748b" }}>{s.label}</div>
                        </div>
                      </div>
                    ); })}
                  </div>

                  {/* Monthly Trend + Status Split */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, marginBottom: 20 }}>
                    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>Monthly Appointment & Revenue Trend</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 14 }}>Last 6 months</div>
                      <div style={{ width: "100%", height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={reportData.monthlyTrend || []} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#f1f5f9" }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 10 }} />
                            <Bar yAxisId="left" dataKey="count" fill="#0891b2" opacity={0.85} radius={[4, 4, 0, 0]} name="Appointments" />
                            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} name="Revenue (₹)" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Appointment Status Split</div>
                      <div style={{ width: "100%", height: 150 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={(reportData.byStatus || []).map((d: any) => ({ name: d.status, value: d.count }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} strokeWidth={0}>
                              {(reportData.byStatus || []).map((_: any, i: number) => <Cell key={i} fill={["#0891b2","#10b981","#6366f1","#f59e0b","#ef4444","#ec4899"][i%6]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px", marginTop: 8 }}>
                        {(reportData.byStatus || []).map((d: any, i: number) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9, color: "#64748b" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: 1, background: ["#0891b2","#10b981","#6366f1","#f59e0b","#ef4444","#ec4899"][i%6], flexShrink: 0 }} />{d.status}
                            </span>
                            <span style={{ fontWeight: 700, color: "#1e293b" }}>{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Peak Hours + Gender Distribution */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
                    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>Peak Appointment Hours</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 14 }}>Appointments by time slot</div>
                      <div style={{ width: "100%", height: 160 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reportData.hourlyDistribution || []} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                            <XAxis dataKey="hour" tick={{ fontSize: 8, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#f1f5f9" }} />
                            <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 10 }} />
                            <Bar dataKey="count" fill="#0891b2" opacity={0.8} radius={[3, 3, 0, 0]} name="Appointments" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Patient Gender Distribution</div>
                      <div style={{ width: "100%", height: 150 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={(reportData.genderDistribution || []).map((d: any) => ({ name: d.gender, value: d.count }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={3} strokeWidth={0}>
                              {(reportData.genderDistribution || []).map((_: any, i: number) => <Cell key={i} fill={["#0891b2","#ec4899","#6366f1","#94a3b8"][i%4]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                        {(reportData.genderDistribution || []).map((d: any, i: number) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#64748b" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: ["#0891b2","#ec4899","#6366f1","#94a3b8"][i%4] }} />
                            {d.gender}: <strong style={{ color: "#1e293b", marginLeft: 2 }}>{d.count}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Completed Appointments Table */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={15} color="#0891b2" />Recent Completed Appointments
                      </span>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>{reportData.recentCompleted?.length || 0} records</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc" }}>
                            {["Patient","Patient ID","Type","Date","Time Slot","Fee (₹)"].map(h => (
                              <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "10px 14px", borderBottom: "1px solid #f1f5f9", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {!reportData.recentCompleted?.length ? (
                            <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 12 }}>No completed appointments yet</td></tr>
                          ) : reportData.recentCompleted.map((r: any) => (
                            <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                              <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{r.patientName}</td>
                              <td style={{ padding: "10px 14px", fontSize: 11, color: "#64748b" }}>{r.patientId}</td>
                              <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc" }}>{r.type}</span></td>
                              <td style={{ padding: "10px 14px", fontSize: 11, color: "#64748b" }}>{r.date ? fmt(r.date) : "—"}</td>
                              <td style={{ padding: "10px 14px", fontWeight: 700, color: "#334155", fontSize: 11 }}>{fmtTime(r.timeSlot)}</td>
                              <td style={{ padding: "10px 14px", fontWeight: 800, color: "#16a34a", fontSize: 12 }}>₹{(r.fee || 0).toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "expenses" && (
            <div style={{ minHeight: 400 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Expense Log (Supplies & Manual)</div>
                <button
                  onClick={() => setShowFinanceModal("expense")}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <Plus size={14} /> Add Manual Expense
                </button>
              </div>

              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Date", "Source / Title", "Category", "Remarks", "Amount"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "12px 14px", borderBottom: "2px solid #f1f5f9", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expensesLoading ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 40 }}><Loader2 className="opd2-spin" /></td></tr>
                      : !expenses.length ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No expense records found</td></tr>
                        : expenses.map((e: any) => (
                          <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>{fmt(e.createdAt || e.date)}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 12.5 }}>{e.supplier?.name || e.title || "Direct Expense"}</div>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>{e.purchaseNo ? `Order #${e.purchaseNo}` : e.category}</div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }}>
                                {e.purchaseNo ? "SUPPLIES" : (e.category || "OTHER")}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 11, color: "#64748b", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {e.description || e.remarks || "—"}
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 800, color: "#ef4444", fontSize: 13 }}>₹{(e.totalAmount || e.grandTotal || e.amount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW APPOINTMENT MODAL ── */}
      {apptViewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setApptViewItem(null)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "fadeUp .2s ease", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #0E898F, #0A6B70)", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Eye size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Appointment Details</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)" }}>#{apptViewItem.tokenNumber || "—"} · {apptViewItem.appointmentDate ? fmt(apptViewItem.appointmentDate) : "—"}</div>
                </div>
              </div>
              <button onClick={() => setApptViewItem(null)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            {/* Body */}
            <div style={{ padding: "22px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Patient */}
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Patient</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{apptViewItem.patient?.name}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{apptViewItem.patient?.patientId}</div>
                {apptViewItem.patient?.phone && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><Phone size={9} />{apptViewItem.patient.phone}</div>}
                {apptViewItem.patient?.gender && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{apptViewItem.patient.gender}{apptViewItem.patient?.dateOfBirth ? ` · ${new Date().getFullYear() - new Date(apptViewItem.patient.dateOfBirth).getFullYear()} yrs` : ""}</div>}
              </div>
              {/* Appointment */}
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Appointment</div>
                {[
                  ["Doctor", `Dr. ${apptViewItem.doctor?.name || "—"}`],
                  ["Date", apptViewItem.appointmentDate ? fmt(apptViewItem.appointmentDate) : "—"],
                  ["Time", fmtTime(apptViewItem.timeSlot)],
                  ["Type", apptViewItem.type?.replace(/_/g," ") || "OPD"],
                  ["Fee", apptViewItem.consultationFee > 0 ? `₹${apptViewItem.consultationFee}` : "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginBottom: 5 }}>
                    <span style={{ color: "#94a3b8" }}>{k}</span>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Status */}
              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "space-between", background: STATUS_CFG[apptViewItem.status]?.bg || "#f8fafc", borderRadius: 12, padding: "12px 16px", border: `1px solid ${STATUS_CFG[apptViewItem.status]?.border || "#e2e8f0"}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_CFG[apptViewItem.status]?.color || "#475569" }}>Status: {STATUS_CFG[apptViewItem.status]?.label || apptViewItem.status}</span>
                <button onClick={() => { setApptEditItem(apptViewItem); setApptEditStatus(apptViewItem.status); setApptEditNotes(apptViewItem.notes || ""); setApptViewItem(null); }}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Pencil size={11} /> Edit Status
                </button>
              </div>
              {/* Notes */}
              {(apptViewItem.notes || apptViewItem.subDeptNote) && (
                <div style={{ gridColumn: "1/-1", background: "#fffbeb", borderRadius: 12, padding: "12px 16px", border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Notes</div>
                  <div style={{ fontSize: 12, color: "#78350f" }}>{apptViewItem.notes || apptViewItem.subDeptNote}</div>
                </div>
              )}
            </div>
            <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setApptViewItem(null)} style={{ padding: "9px 22px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT / STATUS MODAL ── */}
      {apptEditItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setApptEditItem(null)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "fadeUp .2s ease" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "20px 20px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Edit Appointment</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)" }}>{apptEditItem.patient?.name}</div>
                </div>
              </div>
              <button onClick={() => setApptEditItem(null)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            {/* Body */}
            <div style={{ padding: "22px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Status</label>
                <select value={apptEditStatus} onChange={e => setApptEditStatus(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none" }}>
                  <option value="SCHEDULED">Waiting (Scheduled)</option>
                  <option value="CONFIRMED">In Consultation (Confirmed)</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 6 }}>Notes</label>
                <textarea value={apptEditNotes} onChange={e => setApptEditNotes(e.target.value)} rows={3}
                  placeholder="Add notes or instructions..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#334155", background: "#f8fafc", outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
              {/* Status preview */}
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: STATUS_CFG[apptEditStatus]?.bg || "#f8fafc", border: `1px solid ${STATUS_CFG[apptEditStatus]?.border || "#e2e8f0"}`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_CFG[apptEditStatus]?.color || "#475569" }}>Preview: {STATUS_CFG[apptEditStatus]?.label || apptEditStatus}</span>
              </div>
            </div>
            <div style={{ padding: "0 24px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setApptEditItem(null)} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveApptEdit} disabled={apptSaving}
                style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {apptSaving ? <><Loader2 size={13} className="opd2-spin" /> Saving…</> : <><Check size={13} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE / CANCEL CONFIRM MODAL ── */}
      {apptDeleteItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setApptDeleteItem(null)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,.18)", animation: "fadeUp .2s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "28px 28px 22px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fff5f5", border: "2px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Trash2 size={24} color="#ef4444" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Cancel Appointment?</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                <strong style={{ color: "#1e293b" }}>{apptDeleteItem.patient?.name}</strong> · {apptDeleteItem.appointmentDate ? fmt(apptDeleteItem.appointmentDate) : "—"} at {fmtTime(apptDeleteItem.timeSlot)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>This will permanently delete the appointment record.</div>
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
              <button onClick={() => setApptDeleteItem(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Keep</button>
              <button onClick={confirmDeleteAppt} disabled={updatingId === apptDeleteItem.id}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {updatingId === apptDeleteItem.id ? <><Loader2 size={13} className="opd2-spin" /> Deleting…</> : <><Trash2 size={13} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .opd2-spin { animation: opd2-spin .7s linear infinite; }
        @keyframes opd2-spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
