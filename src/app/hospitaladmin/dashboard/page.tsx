// Hot-reload trigger
"use client";
import { useEffect, useState, Suspense, Fragment, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, Settings, HelpCircle,
  LogOut, Search, Bell, MessageSquare, Building2, Activity, ChevronRight,
  Plus, Pencil, Trash2, Filter, Bed, CheckCircle2, AlertTriangle, Clock,
  TrendingUp, Stethoscope, ClipboardList, BarChart2, X, CalendarCheck, RefreshCw, Loader2,
  IndianRupee, Package, CreditCard, Info, MapPin, ShieldCheck, FileText, Upload,
  User, ChevronDown, Camera, Save, Mail, CheckCircle, AlertCircle, Key, Shield, Eye
} from "lucide-react";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import BillingQueue from "@/components/BillingQueue";
import IPDPanel from "@/components/IPDPanel";
import ReportsPanel from "@/components/ReportsPanel";
import EnquiryPanel from "@/components/EnquiryPanel";
import BlogPanel from "@/components/BlogPanel";
import AdminInventoryPanel from "@/components/AdminInventoryPanel";

const AdminDepartmentsPanel = dynamic(() => import("@/components/AdminDepartmentsPanel"), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Departments...</span></div> });

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

/* ── Mock Data ── */
const mockStaff = [
  { id: "1", name: "Dr. Priya Sharma", role: "DOCTOR", dept: "Cardiology", status: "active", patients: 24 },
  { id: "2", name: "Dr. Rajan Mehta", role: "DOCTOR", dept: "Neurology", status: "active", patients: 18 },
  { id: "3", name: "Neha Patil", role: "RECEPTIONIST", dept: "Front Desk", status: "active", patients: 0 },
  { id: "4", name: "Amit Kumar", role: "STAFF", dept: "Radiology", status: "inactive", patients: 0 },
  { id: "5", name: "Dr. Sunita Rao", role: "DOCTOR", dept: "Pediatrics", status: "active", patients: 31 },
];
const mockPatients = [
  { id: "P001", name: "Rajesh Verma", age: 54, blood: "O+", dept: "Cardiology", date: "20/03/26", gender: "Male", status: "OPD" },
  { id: "P002", name: "Meena Joshi", age: 38, blood: "A+", dept: "Neurology", date: "20/03/26", gender: "Female", status: "IPD" },
  { id: "P003", name: "Suresh Das", age: 8, blood: "B-", dept: "Pediatrics", date: "20/03/26", gender: "Male", status: "OPD" },
  { id: "P004", name: "Kavita Singh", age: 45, blood: "AB+", dept: "Cardiology", date: "19/03/26", gender: "Female", status: "OPD" },
  { id: "P005", name: "Ankit Tiwari", age: 29, blood: "O-", dept: "Neurology", date: "18/03/26", gender: "Male", status: "Discharged" },
];
const mockAppointments = [
  { id: "A001", patient: "Rajesh Verma", doctor: "Dr. Priya Sharma", dept: "Cardiology", time: "09:00 AM", status: "confirmed" },
  { id: "A002", patient: "Meena Joshi", doctor: "Dr. Rajan Mehta", dept: "Neurology", time: "09:30 AM", status: "waiting" },
  { id: "A003", patient: "Suresh Das", doctor: "Dr. Sunita Rao", dept: "Pediatrics", time: "10:00 AM", status: "in-progress" },
  { id: "A004", patient: "Kavita Singh", doctor: "Dr. Priya Sharma", dept: "Cardiology", time: "11:00 AM", status: "confirmed" },
  { id: "A005", patient: "Ankit Tiwari", doctor: "Dr. Rajan Mehta", dept: "Neurology", time: "11:30 AM", status: "cancelled" },
];
const PatientsManagementPanelLazy = dynamic(() => import("@/app/subdept/dashboard/PatientsManagementPanel").then(mod => mod.PatientsManagementPanel), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Patient Management...</span></div> });
const reports = [
  { icon: <Stethoscope size={14} />, msg: "Ventilator unit requires inspection in ICU", time: "5 minutes ago", highlight: true },
  { icon: <Settings size={14} />, msg: "Breakdown in elevator on 2nd floor", time: "18 minutes ago", highlight: false },
  { icon: <AlertTriangle size={14} />, msg: "Damage reported at the main entrance door", time: "2 hours ago", highlight: false },
];
const doctorAppts = [
  { name: "Cardiology", doctor: "Dr. Priya Sharma", time: "09:00 – 12:00", active: false },
  { name: "Pediatrics", doctor: "Dr. Sunita Rao", time: "10:00 – 13:00", active: true },
  { name: "Neurology", doctor: "Dr. Rajan Mehta", time: "11:00 – 14:00", active: false },
  { name: "Radiology", doctor: "Amit Kumar", time: "02:00 – 05:00", active: false },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_H = ["M", "T", "W", "T", "F", "S", "S"];

function MiniCalendar() {
  const today = new Date();
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const firstDay = new Date(cur.y, cur.m, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const isToday = (d: number | null) => d === today.getDate() && cur.m === today.getMonth() && cur.y === today.getFullYear();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize:15, fontWeight: 700, color: "#1e293b" }}>{MONTHS[cur.m]} {cur.y}</span>
        <div style={{ display: "flex", gap: 4 }}>
          {["‹", "›"].map((a, i) => (
            <button key={i} onClick={() => setCur(c => { const nm = c.m + (i ? 1 : -1); return nm < 0 ? { y: c.y - 1, m: 11 } : nm > 11 ? { y: c.y + 1, m: 0 } : { ...c, m: nm }; })}
              style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: i ? "#0E898F" : "#e2e8f0", color: i ? "#fff" : "#64748b", cursor: "pointer", fontSize:13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {a}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
        {DAYS_H.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize:10, fontWeight: 600, color: "#94a3b8", padding: "2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize:11, fontWeight: isToday(d) ? 700 : 400, padding: "5px 0", borderRadius: 8, cursor: d ? "pointer" : "default", background: isToday(d) ? "#0E898F" : "transparent", color: isToday(d) ? "#fff" : d ? "#334155" : "transparent", transition: "background .15s" }}>
            {d || ""}
          </div>
        ))}
      </div>
    </div>
  );
}

type NavTab = "overview" | "appointments" | "staff" | "doctors" | "patients" | "inventory" | "billing" | "ipd" | "departments" | "enquiries" | "tourism" | "blogs" | "reports" | "finance" | "settings" | "profile";

// Dead InventoryPanel removed — replaced by AdminInventoryPanel component

export default function HospitalAdminDashboard() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<NavTab>("overview");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "DOCTOR", password: "" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [search, setSearch] = useState("");
  const [apptStats, setApptStats] = useState<any>(null);
  const [patientStats, setPatientStats] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const fetchDashboard = async () => {
    setDashboardLoading(true);
    try {
      const d = await fetch("/api/dashboard/overview", { credentials: "include" }).then(r => r.json());
      if (d.success) setDashboardData(d.data);
    } catch {}
    setDashboardLoading(false);
  };
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  // Profile states
  const [profileFormData, setProfileFormData] = useState({ name: "", email: "", phone: "" });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = searchParams.get("tab") as NavTab;
    if (t === "finance") { router.push("/hospitaladmin/finance"); return; }
    if (t && ["overview", "appointments", "staff", "doctors", "patients", "inventory", "billing", "ipd", "departments", "enquiries", "tourism", "blogs", "settings", "profile"].includes(t)) {
      setTab(t);
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.success) { router.push("/login"); return; }
        if (d.data.role === "DOCTOR") { router.push("/doctor/dashboard"); return; }
        if (d.data.role === "STAFF" || d.data.role === "RECEPTIONIST") { router.push("/staff/dashboard"); return; }
        if (d.data.role !== "HOSPITAL_ADMIN") { router.push("/login"); return; }
        setUser(d.data); setProfileFormData({ name: d.data.name || "", email: d.data.email || "", phone: "" }); if (d.data.profilePhoto) setProfilePhoto(d.data.profilePhoto); setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!loading) {
      fetch("/api/appointments?stats=true", { credentials: "include" }).then(r => r.json()).then(d => { if (d.success) setApptStats(d.data); });
      fetch("/api/patients?stats=true", { credentials: "include" }).then(r => r.json()).then(d => { if (d.success) setPatientStats(d.data); });
      fetchDashboard();
      const interval = setInterval(fetchDashboard, 60000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); router.push("/login"); };

  // Profile handlers
  const handlePhotoClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: profileFormData.name, email: profileFormData.email, profilePhoto }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMessage({ type: "success", text: "Profile updated successfully!" });
        setUser((prev: any) => prev ? { ...prev, name: profileFormData.name, email: profileFormData.email } : null);
      } else {
        setProfileMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch {
      setProfileMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setCreateMsg("");
    try {
      const res = await fetch("/api/user/create", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(newStaff) });
      const d = await res.json();
      if (d.success) { setCreateMsg("✓ Staff added!"); setTimeout(() => setShowAddStaff(false), 1500); }
      else setCreateMsg(d.message || "Failed.");
    } catch { setCreateMsg("Network error."); }
    finally { setCreating(false); }
  };

  const initials = (n: string) => n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();


  const todayAppts = dashboardData?.appointments?.today ?? apptStats?.today ?? 0;
  const totalPatients = dashboardData?.patients?.total ?? patientStats?.total ?? 0;
  const newPatientsToday = dashboardData?.patients?.newToday ?? patientStats?.newToday ?? 0;
  const completedAppts = dashboardData?.appointments?.completed ?? apptStats?.completed ?? 0;
  const totalStaffCount = (dashboardData?.staff?.total ?? 0) + (dashboardData?.staff?.doctors ?? 0);
  const revenueToday = dashboardData?.finance?.revenueToday ?? 0;
  const revenueMonth = dashboardData?.finance?.revenueMonth ?? 0;

  const stats = [
    { label: "Staff & Doctors", val: dashboardData ? totalStaffCount : "–", sub: `${dashboardData?.staff?.activeDoctors ?? 0} active doctors`, icon: <Users size={20} color="#fff" />, bg: "#E6F4F4", iconBg: "#0E898F" },
    { label: "Total Patients", val: dashboardData ? totalPatients : "–", sub: newPatientsToday > 0 ? `+${newPatientsToday} new today` : `+${dashboardData?.patients?.newThisMonth ?? 0} this month`, icon: <UserRound size={20} color="#fff" />, bg: "#f0fdf4", iconBg: "#10b981" },
    { label: "Today Appointments", val: dashboardData ? todayAppts : "–", sub: `${completedAppts} completed`, icon: <CalendarDays size={20} color="#fff" />, bg: "#fdf4ff", iconBg: "#a855f7" },
    { label: "Revenue Today", val: dashboardData ? `₹${revenueToday >= 1000 ? (revenueToday / 1000).toFixed(1) + "K" : revenueToday}` : "–", sub: `₹${revenueMonth >= 1000 ? (revenueMonth / 1000).toFixed(1) + "K" : revenueMonth} this month`, icon: <IndianRupee size={20} color="#fff" />, bg: "#fff7ed", iconBg: "#f59e0b" },
  ];

  return (
    <>

      {showAddStaff && (
        <div className="hd-modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowAddStaff(false) }}>
          <div className="hd-modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div className="hd-modal-title">Add Staff Member</div>
              <button onClick={() => setShowAddStaff(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}><X size={18} /></button>
            </div>
            <div className="hd-modal-sub">Create a new user within your hospital.</div>
            <form onSubmit={handleAddStaff}>
              {[{ key: "name", lbl: "Full Name", ph: "Dr. John Doe" }, { key: "email", lbl: "Email", ph: "doctor@hospital.com" }, { key: "password", lbl: "Password", ph: "Min 6 characters" }].map(f => (
                <div key={f.key} className="hd-mf">
                  <label className="hd-ml">{f.lbl}</label>
                  <input type={f.key === "password" ? "password" : "text"} className="hd-mi" placeholder={f.ph} value={(newStaff as any)[f.key]} onChange={e => setNewStaff(n => ({ ...n, [f.key]: e.target.value }))} required />
                </div>
              ))}
              <div className="hd-mf">
                <label className="hd-ml">Role</label>
                <select className="hd-mi" style={{ cursor: "pointer" }} value={newStaff.role} onChange={e => setNewStaff(n => ({ ...n, role: e.target.value }))}>
                  <option value="DOCTOR">Doctor</option><option value="RECEPTIONIST">Receptionist</option><option value="STAFF">Staff</option>
                </select>
              </div>
              {createMsg && <div className={createMsg.startsWith("✓") ? "hd-msg-ok" : "hd-msg-err"}>{createMsg}</div>}
              <div className="hd-ma">
                <button type="button" className="hd-mcancel" onClick={() => setShowAddStaff(false)}>Cancel</button>
                <button type="submit" className="hd-msubmit" disabled={creating}>{creating ? <span className="hd-spin" /> : "Add Staff Member"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="hd-body" style={(tab === "inventory" || tab === "billing" || tab === "ipd" || tab === "departments" || tab === "reports" || tab === "enquiries" || tab === "tourism" || tab === "blogs" || tab === "patients") ? { gridTemplateColumns: "1fr" } : undefined}>
    <div className="hd-center" style={tab === "billing" ? { padding: 0 } : {}}>
      {tab === "overview" && (<>
        <div className="hd-page-header">
          <div>
            <div className="hd-pg-title" style={{ marginBottom: 2 }}>Dashboard</div>
            <div style={{ fontSize:10, color: "#94a3b8" }}>
              {dashboardData ? `Last updated ${new Date(dashboardData.generatedAt).toLocaleTimeString()}` : "Loading real-time data..."}
            </div>
          </div>
          <button className="hd-filter-btn" onClick={fetchDashboard} disabled={dashboardLoading}>
            <RefreshCw size={12} style={{ animation: dashboardLoading ? "sp 1s linear infinite" : "none" }} />
            {dashboardLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="hd-stats">
          {stats.map((s, i) => (
            <div key={i} className="hd-sc" style={{ background: s.bg }}>
              <div className="hd-sc-icon" style={{ background: s.iconBg }}>{s.icon}</div>
              <div>
                <div className="hd-sc-lbl">{s.label}</div>
                <div className="hd-sc-val">{s.val}</div>
                <div className="hd-sc-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's activity breakdown */}
        {dashboardData && (
          <div className="hd-activity-grid">
            {[
              { label: "Scheduled", val: dashboardData.appointments?.scheduled ?? 0, color: "#3b82f6", bg: "#eff6ff" },
              { label: "Confirmed", val: dashboardData.appointments?.pending ?? 0, color: "#8b5cf6", bg: "#f5f3ff" },
              { label: "Completed", val: dashboardData.appointments?.completed ?? 0, color: "#10b981", bg: "#f0fdf4" },
              { label: "Cancelled", val: dashboardData.appointments?.cancelled ?? 0, color: "#ef4444", bg: "#fff5f5" },
              { label: "Pending Bills", val: dashboardData.finance?.pendingBills ?? 0, color: "#f59e0b", bg: "#fffbeb" },
              { label: "Active Plans", val: dashboardData.treatmentPlans?.active ?? 0, color: "#0E898F", bg: "#E6F4F4" },
              { label: "Plans Done", val: dashboardData.treatmentPlans?.completed ?? 0, color: "#059669", bg: "#f0fdf4" },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${item.color}22` }}>
                <div style={{ fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize:20, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Charts row */}
        <div className="hd-mid" style={{ marginBottom: 18 }}>
          {/* Monthly Trend Chart */}
          <div className="hd-card">
            <div className="hd-card-head">
              <div>
                <div className="hd-card-title">Monthly Activity Trends</div>
                <div className="hd-card-sub">Appointments & new patients - last 9 months</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: "#0E898F" }} />
                  <span style={{ fontSize:10, color: "#64748b" }}>Appointments</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: "#10b981" }} />
                  <span style={{ fontSize:10, color: "#64748b" }}>New Patients</span>
                </div>
              </div>
            </div>
            <div className="hd-card-body" style={{ paddingTop: 8 }}>
              {dashboardLoading && !dashboardData ? (
                <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize:11 }}>
                  <Loader2 size={18} className="hd-spin" style={{ marginRight: 8, borderColor: "#0E898F" }} /> Loading chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={dashboardData?.monthlyTrends ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0E898F" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#0E898F" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize:10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize:11, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                      labelStyle={{ fontWeight: 700, color: "#1e293b" }}
                    />
                    <Area type="monotone" dataKey="appointments" stroke="#0E898F" strokeWidth={2} fill="url(#apptGrad)" name="Appointments" dot={{ r: 3, fill: "#0E898F", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={2} fill="url(#patGrad)" name="New Patients" dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Live Alerts / Inventory Status */}
          <div className="hd-card">
            <div className="hd-card-head">
              <div className="hd-card-title">Live Alerts</div>
              <div className="hd-card-icon-btn"><Activity size={14} /></div>
            </div>
            <div className="hd-card-body" style={{ padding: "12px 14px" }}>
              {dashboardLoading && !dashboardData ? (
                <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize:11 }}>Loading...</div>
              ) : (
                <>
                  {(dashboardData?.inventory?.lowStockCount ?? 0) > 0 && (
                    <div className="hd-report-item" style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 1, color: "#fff", display: "flex", flexShrink: 0 }}><AlertTriangle size={14} /></span>
                        <div>
                          <div className="hd-ri-msg" style={{ color: "#fff" }}>{dashboardData.inventory.lowStockCount} inventory items below minimum stock level</div>
                          <div className="hd-ri-time" style={{ color: "rgba(255,255,255,0.7)" }}>Go to Inventory &rarr; Check stock</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(dashboardData?.inventory?.expiringSoonCount ?? 0) > 0 && (
                    <div className="hd-report-item" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 1, color: "#fff", display: "flex", flexShrink: 0 }}><Clock size={14} /></span>
                        <div>
                          <div className="hd-ri-msg" style={{ color: "#fff" }}>{dashboardData.inventory.expiringSoonCount} batches expiring within 30 days</div>
                          <div className="hd-ri-time" style={{ color: "rgba(255,255,255,0.7)" }}>Review expiring inventory</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(dashboardData?.finance?.pendingBills ?? 0) > 0 && (
                    <div className="hd-report-item" style={{ background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 1, color: "#f59e0b", display: "flex", flexShrink: 0 }}><IndianRupee size={14} /></span>
                        <div>
                          <div className="hd-ri-msg">{dashboardData.finance.pendingBills} bills pending collection</div>
                          <div className="hd-ri-time" style={{ color: "#94a3b8" }}>Go to Billing &rarr; Pending queue</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(dashboardData?.followUps?.pending ?? 0) > 0 && (
                    <div className="hd-report-item" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 1, color: "#8b5cf6", display: "flex", flexShrink: 0 }}><CalendarCheck size={14} /></span>
                        <div>
                          <div className="hd-ri-msg">{dashboardData.followUps.pending} follow-ups scheduled for today</div>
                          <div className="hd-ri-time" style={{ color: "#94a3b8" }}>Review patient follow-ups</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {dashboardData && (dashboardData.inventory.lowStockCount === 0) && (dashboardData.finance.pendingBills === 0) && (dashboardData.followUps.pending === 0) && (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
                      <CheckCircle size={24} style={{ margin: "0 auto 8px", opacity: .4, display: "block" }} />
                      <div style={{ fontSize:11 }}>All systems normal</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recent Patients Table */}
        <div className="hd-card mb16">
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">Recently Registered Patients</div>
              <div className="hd-card-sub">{dashboardData ? `${dashboardData.patients.total} total · ${dashboardData.patients.newToday} registered today` : "Loading..."}</div>
            </div>
            <button className="hd-card-icon-btn" onClick={() => setTab("patients")} title="View all"><ChevronRight size={14} /></button>
          </div>
          <div className="hd-tbl-wrap">
            {dashboardLoading && !dashboardData ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
                <Loader2 size={20} className="hd-spin" style={{ margin: "0 auto 8px", borderColor: "#0E898F" }} />
                <div style={{ fontSize:11 }}>Loading patient data...</div>
              </div>
            ) : (dashboardData?.recentPatients?.length ?? 0) === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize:12 }}>No patients registered yet</div>
            ) : (
              <table className="hd-tbl">
                <thead>
                  <tr><th>ID</th><th>Registered</th><th>Name</th><th>Contact</th><th>Blood</th><th>Gender</th><th>Visits</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {(dashboardData?.recentPatients ?? []).map((p: any, i: number) => {
                    const age = p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31557600000) : null;
                    const regDate = new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                    return (
                      <tr key={p.id}>
                        <td><span style={{ fontSize:10, fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "2px 6px", borderRadius: 5 }}>{p.patientId}</span></td>
                        <td style={{ fontSize:11, color: "#64748b" }}>{regDate}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize:10, fontWeight: 700, flexShrink: 0 }}>{p.name.charAt(0).toUpperCase()}</div>
                            <span className="hd-td-name">{p.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize:10, color: "#64748b" }}>{p.phone}</td>
                        <td><span style={{ color: "#ef4444", fontWeight: 700, fontSize:11 }}>{p.bloodGroup || "-"}</span></td>
                        <td><span className="hd-badge" style={{ background: "#f1f5f9", color: "#64748b" }}>{p.gender ? p.gender.charAt(0) + p.gender.slice(1).toLowerCase() : "-"}{age !== null ? ` · ${age}y` : ""}</span></td>
                        <td><span style={{ fontSize:11, fontWeight: 700, color: "#0A6B70" }}>{p._count?.appointments ?? 0}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="hd-card-icon-btn" style={{ background: "#E6F4F4", color: "#0E898F", border: "none" }} onClick={() => router.push(`/hospitaladmin/appointments?patientId=${p.id}`)}><ChevronRight size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Access - Configure & Treatment Plans */}
        <div className="hd-quick-access">
          <div className="hd-card" style={{ cursor: "pointer" }} onClick={() => router.push("/hospitaladmin/configure?tab=overview")}>
            <div className="hd-card-head">
              <div>
                <div className="hd-card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}><BarChart2 size={15} color="#0E898F" />Services & Treatment Dashboard</div>
                <div className="hd-card-sub">Service packages, treatment plan stats, session completion</div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "0 16px 14px" }}>
              {[
                { label: "Service Packages", path: "services", color: "#0369a1", bg: "#e0f2fe" },
                { label: "Treatment Plans", path: "treatments", color: "#16a34a", bg: "#f0fdf4" },
                { label: "Permissions", path: "permissions", color: "#9333ea", bg: "#fdf4ff" },
              ].map(item => (
                <button key={item.label} onClick={e => { e.stopPropagation(); router.push(`/hospitaladmin/configure?tab=${item.path}`); }}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: item.bg, color: item.color, fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="hd-card" style={{ cursor: "pointer" }} onClick={() => router.push("/hospitaladmin/configure?tab=departments")}>
            <div className="hd-card-head">
              <div>
                <div className="hd-card-title" style={{ display: "flex", alignItems: "center", gap: 7 }}><Building2 size={15} color="#0E898F" />Departments & Sub-Depts</div>
                <div className="hd-card-sub">Manage departments, sub-departments and procedures</div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "0 16px 14px" }}>
              {[
                { label: "Departments", path: "departments", color: "#0369a1", bg: "#e0f2fe" },
                { label: "Sub-Depts", path: "subdepts", color: "#0f766e", bg: "#f0fdfa" },
                { label: "Staff", path: "staff", color: "#475569", bg: "#f1f5f9" },
              ].map(item => (
                <button key={item.label} onClick={e => { e.stopPropagation(); router.push(`/hospitaladmin/configure?tab=${item.path}`); }}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: item.bg, color: item.color, fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>)}

      {tab === "appointments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="hd-banner">
            <div>
              <div style={{ fontSize:20, fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}><CalendarCheck size={24} />Appointment Management</div>
              <div style={{ fontSize:12, color: "rgba(255,255,255,.75)", maxWidth: 440 }}>Book appointments, manage follow-ups, and view your full patient registry in the dedicated module.</div>
            </div>
            <button onClick={() => router.push("/hospitaladmin/appointments")} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>
              Open Module <ChevronRight size={16} />
            </button>
          </div>
          <div className="hd-appt-grid">
            {[
              { label: "Book Appointment", desc: "Search patient + pick doctor + select slot", color: "#0E898F", bg: "#E6F4F4", path: "/hospitaladmin/appointments", icon: <CalendarCheck size={18} /> },
              { label: "Follow-up Dashboard", desc: "Track pending, overdue and completed follow-ups", color: "#10b981", bg: "#f0fdf4", path: "/hospitaladmin/appointments", icon: <RefreshCw size={18} /> },
              { label: "Patient Registry", desc: "View full patient history and profiles", color: "#7c3aed", bg: "#f5f3ff", path: "/hospitaladmin/appointments", icon: <Users size={18} /> },
            ].map((card) => (
              <button key={card.label} onClick={() => router.push(card.path)}
                style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, marginBottom: 12 }}>{card.icon}</div>
                <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize:11, color: "#94a3b8" }}>{card.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "staff" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="hd-banner">
            <div>
              <div style={{ fontSize:19, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}><Users size={22} />Staff & Doctors</div>
              <div style={{ fontSize:11, color: "rgba(255,255,255,.75)" }}>
                {dashboardData ? `${dashboardData.staff.total} staff · ${dashboardData.staff.doctors} doctors · ${dashboardData.staff.activeDoctors} active` : "Loading..."}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button onClick={() => router.push("/hospitaladmin/configure?tab=staff")}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", fontSize:11, fontWeight: 700, cursor: "pointer" }}>
                Manage Staff
              </button>
              <button onClick={() => router.push("/hospitaladmin/configure?tab=doctors")}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.15)", color: "#fff", fontSize:11, fontWeight: 700, cursor: "pointer" }}>
                Manage Doctors
              </button>
            </div>
          </div>
          <div className="hd-staff-grid">
            {[
              { label: "Total Staff", val: dashboardData?.staff?.total ?? "-", icon: <Users size={18} />, color: "#0E898F", bg: "#E6F4F4" },
              { label: "Active Staff", val: dashboardData?.staff?.active ?? "-", icon: <CheckCircle2 size={18} />, color: "#10b981", bg: "#f0fdf4" },
              { label: "Total Doctors", val: dashboardData?.staff?.doctors ?? "-", icon: <Stethoscope size={18} />, color: "#8b5cf6", bg: "#f5f3ff" },
              { label: "Active Doctors", val: dashboardData?.staff?.activeDoctors ?? "-", icon: <Activity size={18} />, color: "#f59e0b", bg: "#fffbeb" },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
                <div style={{ color: item.color, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize:20, fontWeight: 800, color: "#1e293b", lineHeight: 1, marginBottom: 4 }}>{item.val}</div>
                <div style={{ fontSize:10, color: "#94a3b8" }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div className="hd-card mb16">
            <div className="hd-card-head">
              <div><div className="hd-card-title">Doctors on Duty Today</div><div className="hd-card-sub">{dashboardData?.doctorsOnDuty?.length ?? 0} doctors with appointments</div></div>
              <button className="hd-btn-primary" onClick={() => { setShowAddStaff(true); setCreateMsg(""); }}><Plus size={14} />Add User</button>
            </div>
            <div className="hd-tbl-wrap">
              {(dashboardData?.doctorsOnDuty?.length ?? 0) === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize:12 }}>
                  <Stethoscope size={28} style={{ margin: "0 auto 10px", display: "block", opacity: .3 }} />
                  No doctors have appointments scheduled today
                </div>
              ) : (
                <table className="hd-tbl">
                  <thead><tr><th>Doctor</th><th>Specialization / Dept</th><th>First Slot</th><th>Appointments</th></tr></thead>
                  <tbody>
                    {(dashboardData?.doctorsOnDuty ?? []).map((d: any) => (
                      <tr key={d.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#0E898F,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize:10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(d.name)}</div>
                            <span className="hd-td-name">{d.name}</span>
                          </div>
                        </td>
                        <td><span className="hd-badge" style={{ background: "#E6F4F4", color: "#0A6B70", border: "1px solid #B3E0E0" }}>{d.department || d.specialization}</span></td>
                        <td style={{ fontSize:11, color: "#64748b" }}>{d.firstSlot}{d.lastSlot !== d.firstSlot ? ` - ${d.lastSlot}` : ""}</td>
                        <td><span style={{ fontWeight: 700, color: "#0E898F" }}>{d.appointmentCount}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "patients" && (
        <PatientsManagementPanelLazy />
      )}

      {tab === "inventory" && (
        <AdminInventoryPanel />
      )}

      {tab === "billing" && (
        <BillingQueue deptName="Billing Counter" />
      )}

      {tab === "ipd" && (
        <IPDPanel />
      )}

      {tab === "departments" && (
        <AdminDepartmentsPanel />
      )}

      {tab === "reports" && (
        <div style={{ padding: "4px 0" }}><ReportsPanel /></div>
      )}

      {tab === "enquiries" && (
        <EnquiryPanel />
      )}

      {tab === "tourism" && (
        <EnquiryPanel typeFilter="MEDICAL_TOURISM" title="Medical Tourism Enquiries" />
      )}

      {tab === "blogs" && (
        <BlogPanel />
      )}

      {tab === "settings" && (
        <div className="hd-card mb16">
          <div className="hd-card-head"><div className="hd-card-title">System Settings</div></div>
          <div className="hd-card-body">
            <div className="hd-settings-grid">
              {[["Hospital Name", user?.hospital?.name || "-"], ["Admin Email", user?.email || "-"], ["Timezone", "IST (UTC+5:30)"], ["Auth", "JWT + HTTP-only Cookies"], ["Session TTL", "7 Days"], ["DB", "MySQL - TiDB Cloud"]].map(([k, v]) => (
                <div key={k} style={{ padding: "14px 16px", borderRadius: 11, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize:12, fontWeight: 600, color: "#334155" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

    {tab !== "inventory" && tab !== "billing" && tab !== "ipd" && tab !== "reports" && tab !== "enquiries" && tab !== "tourism" && tab !== "blogs" && tab !== "patients" && tab !== "departments" && (
      <div className="hd-right">
        <div className="hd-right-sec">
          <div style={{ fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Date</div>
          <MiniCalendar />
        </div>
        <div className="hd-right-sec" style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="hd-right-title">Doctors on Duty Today</div>
            <span style={{ fontSize:10, fontWeight: 700, color: "#0E898F", background: "#E6F4F4", padding: "2px 8px", borderRadius: 20 }}>
              {dashboardData?.doctorsOnDuty?.length ?? 0}
            </span>
          </div>
          {dashboardLoading && !dashboardData ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize:11 }}>
              <Loader2 size={16} className="hd-spin" style={{ margin: "0 auto 6px", borderColor: "#0E898F" }} />
              Loading...
            </div>
          ) : (dashboardData?.doctorsOnDuty?.length ?? 0) === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize:11 }}>
              <Stethoscope size={22} style={{ margin: "0 auto 6px", display: "block", opacity: .3 }} />
              No appointments today
            </div>
          ) : (
            (dashboardData?.doctorsOnDuty ?? []).map((d: any, i: number) => (
              <div key={d.id} className="hd-appt-item" style={{ marginBottom: 8 }}>
                <div className="hd-appt-ic">
                  <Stethoscope size={17} color="#0E898F" />
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div className="hd-appt-name">{d.name}</div>
                  <div className="hd-appt-doc">{d.department || d.specialization}</div>
                  <div className="hd-appt-time">{d.appointmentCount} appt{d.appointmentCount !== 1 ? "s" : ""} · {d.firstSlot}{d.lastSlot !== d.firstSlot ? ` - ${d.lastSlot}` : ""}</div>
                </div>
                <ChevronRight size={14} color="#94a3b8" />
              </div>
            ))
          )}
        </div>

        {/* Quick stats for right panel */}
        {dashboardData && (
          <div className="hd-right-sec" style={{ marginTop: 22 }}>
            <div className="hd-right-title" style={{ marginBottom: 10 }}>Today's Summary</div>
            {[
              { label: "Follow-ups", val: dashboardData.followUps?.today ?? 0, color: "#8b5cf6" },
              { label: "New Patients", val: dashboardData.patients?.newToday ?? 0, color: "#10b981" },
              { label: "Revenue", val: `Rs.${(dashboardData.finance?.revenueToday ?? 0) >= 1000 ? ((dashboardData.finance.revenueToday) / 1000).toFixed(1) + "K" : dashboardData.finance?.revenueToday ?? 0}`, color: "#f59e0b" },
              { label: "Low Stock", val: dashboardData.inventory?.lowStockCount ?? 0, color: (dashboardData.inventory?.lowStockCount ?? 0) > 0 ? "#ef4444" : "#10b981" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 9, background: "#f8fafc", border: "1px solid #f1f5f9", marginBottom: 6 }}>
                <span style={{ fontSize:10, color: "#64748b", fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize:12, fontWeight: 800, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
    </>
  );
}
