"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User, LogOut, Key, Shield, Briefcase, Building2,
  Phone, Mail, Calendar, CheckCircle, Clock, AlertTriangle,
  ChevronRight, CalendarDays, Users, ChevronDown, Settings, CreditCard, RefreshCw,
  Search, X, FileQuestion, Globe
} from "lucide-react";
import AppointmentPanel from "@/components/AppointmentPanel";
import FollowUpDashboard from "@/components/FollowUpDashboard";
import PatientProfilePanel from "@/components/PatientProfilePanel";
import NotificationBell from "@/components/NotificationBell";
import BillingModule from "@/components/BillingModule";
import BillingQueue from "@/components/BillingQueue";
import EnquiryPanel from "@/components/EnquiryPanel";

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  department?: { name: string; code: string } | null;
  salary: number;
  joinDate: string;
  isActive: boolean;
  mustChangePassword: boolean;
  hospital?: { id: string; name: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
  NURSE: "Nurse",
  TECHNICIAN: "Technician",
  PHARMACIST: "Pharmacist",
  RECEPTIONIST: "Receptionist",
  LAB_TECHNICIAN: "Lab Technician",
  ACCOUNTANT: "Accountant",
  ADMIN: "Admin",
  SUPPORT: "Support",
  OTHER: "Other",
};

const ROLE_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  NURSE: { bg: "#E6F4F4", text: "#07595D", accent: "#0E898F" },
  TECHNICIAN: { bg: "#f5f3ff", text: "#6d28d9", accent: "#8b5cf6" },
  PHARMACIST: { bg: "#f0fdf4", text: "#15803d", accent: "#22c55e" },
  RECEPTIONIST: { bg: "#fdf4ff", text: "#7e22ce", accent: "#a855f7" },
  LAB_TECHNICIAN: { bg: "#fefce8", text: "#854d0e", accent: "#eab308" },
  ACCOUNTANT: { bg: "#E6F4F4", text: "#1e40af", accent: "#0E898F" },
  ADMIN: { bg: "#fff1f2", text: "#be123c", accent: "#f43f5e" },
  SUPPORT: { bg: "#f8fafc", text: "#475569", accent: "#64748b" },
  OTHER: { bg: "#f8fafc", text: "#475569", accent: "#64748b" },
};

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

type Tab = "overview" | "appointments" | "followups" | "patients" | "billing" | "enquiries" | "tourism";

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <User size={16} /> },
  { id: "appointments", label: "Appointments", icon: <CalendarDays size={16} /> },
  { id: "followups", label: "Follow-ups", icon: <Clock size={16} /> },
  { id: "patients", label: "Patients", icon: <Users size={16} /> },
  { id: "billing", label: "Billing", icon: <CreditCard size={16} /> },
  { id: "enquiries", label: "Enquiries", icon: <FileQuestion size={16} /> },
  { id: "tourism", label: "Medical Tourism", icon: <Globe size={16} /> },
];

export default function StaffDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tab, setTab] = useState<Tab>("overview");
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [billingSubTab, setBillingSubTab] = useState<"bills"|"queue">("queue");
  const [liveStats, setLiveStats] = useState<{ todayAppts: number; pendingFollowUps: number; overdueFollowUps: number; totalPatients: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api("/api/auth/me").then((res) => {
      if (!res.success) { router.push("/staff/login"); return; }
      // Role-based guard: only STAFF and RECEPTIONIST can access this dashboard
      const role = res.data?.role;
      if (role === "HOSPITAL_ADMIN") { router.push("/hospitaladmin/dashboard"); return; }
      if (role === "DOCTOR") { router.push("/doctor/dashboard"); return; }
      if (role === "SUPER_ADMIN") { router.push("/superadmin/dashboard"); return; }
      if (role === "SUB_DEPT_HEAD") { router.push("/subdept/dashboard"); return; }
      if (role !== "STAFF" && role !== "RECEPTIONIST") { router.push("/staff/login"); return; }
      // Now fetch staff profile
      api("/api/staff/me").then((staffRes) => {
        if (!staffRes.success) { router.push("/staff/login"); return; }
        const staffData = staffRes.data;
        if (staffData?.mustChangePassword) { router.push("/staff/change-password"); return; }
        setProfile(staffData);
        setLoading(false);
      }).catch(() => router.push("/staff/login"));
    }).catch(() => router.push("/staff/login"));
  }, [router]);

  const fetchLiveStats = useCallback(async () => {
    setStatsLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const [apptRes, fuRes, ptRes] = await Promise.all([
      api(`/api/appointments?stats=true&date=${today}`),
      api(`/api/followups?stats=true`),
      api(`/api/patients?stats=true`),
    ]);
    setLiveStats({
      todayAppts:       apptRes?.data?.today   ?? 0,
      pendingFollowUps: fuRes?.data?.pending   ?? 0,
      overdueFollowUps: fuRes?.data?.overdue   ?? 0,
      totalPatients:    ptRes?.data?.total     ?? 0,
    });
    setStatsLoading(false);
  }, []);

  useEffect(() => { if (!loading) fetchLiveStats(); }, [loading, fetchLiveStats]);

  useEffect(() => {
    if (tab === "patients") {
      setPatientsLoading(true);
      setPatientSearch("");
      api("/api/patients?limit=200&sortBy=name&sortOrder=asc").then(d => {
        if (d.success) setPatients(d.data?.data || []);
      }).finally(() => setPatientsLoading(false));
    }
  }, [tab]);

  const filteredPatients = patients.filter(p => {
    if (!patientSearch) return true;
    const q = patientSearch.toLowerCase();
    return (p.name||'').toLowerCase().includes(q) || (p.patientId||'').toLowerCase().includes(q) || (p.phone||'').includes(q) || (p.email||'').toLowerCase().includes(q);
  });

  const handleLogout = async () => {
    await api("/api/auth/logout", "POST");
    router.push("/staff/login");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f4f8",
        fontFamily: "'Inter', sans-serif",
        flexDirection: "column",
        gap: 12,
        color: "#64748b",
      }}>
        <div style={{
          width: 40, height: 40, border: "3px solid #e2e8f0",
          borderTopColor: "#10b981", borderRadius: "50%",
          animation: "spin 0.7s linear infinite"
        }} />
        <span>Loading your dashboard...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!profile) return null;

  const joinDate = new Date(profile.joinDate);
  const monthsWorked = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const roleColors = ROLE_COLORS[profile.role] || ROLE_COLORS.OTHER;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .sd-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.04);animation:fadeIn .25s ease}
        .sd-stat-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .sd-info-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #f1f5f9}
        .sd-info-row:last-child{border-bottom:none}
        .sd-nav-btn{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:10px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:#64748b;width:100%;text-align:left;transition:all .15s;font-family:'Inter',sans-serif}
        .sd-nav-btn:hover{background:#f1f5f9;color:#1e293b}
        .sd-nav-btn.active{background:linear-gradient(135deg,#10b98118,#05966908);color:#059669;border:1px solid #10b98122}
        .sd-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s}
        .sd-btn-ghost{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
        .sd-btn-ghost:hover{background:#f1f5f9;color:#334155}
        .sd-btn-danger{background:#fff5f5;color:#ef4444;border:1px solid #fee2e2}
        .sd-btn-danger:hover{background:#fee2e2}
        .sd-pt-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px;align-items:center;padding:12px 16px;border-bottom:1px solid #f8fafc;font-size:13px;color:#475569}
        .sd-pt-row:last-child{border-bottom:none}
        .sd-pt-row:hover{background:#fafbfc}
      `}</style>

      {/* Top Header */}
      <header style={{ height: 64, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 1px 4px rgba(0,0,0,.04)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(16,185,129,.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{profile?.hospital?.name || "MediNexPlus"}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Staff Portal</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NotificationBell accentColor={roleColors.accent} bgColor="#f8fafc" borderColor="#e2e8f0" types={["APPOINTMENT_BOOKED","PATIENT_REGISTERED","BILLING_TRANSFER"]} />
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 8px", borderRadius: 10, transition: "background 0.15s" }}
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{profile.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{ROLE_LABELS[profile.role] || profile.role}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${roleColors.accent},${roleColors.accent}cc)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>
              {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <ChevronDown size={14} color="#64748b" />
          </div>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 60 }}
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div style={{
                position: "absolute",
                top: 56,
                right: 24,
                width: 200,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                zIndex: 70,
                overflow: "hidden",
              }}>
                <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{profile.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{profile.email}</div>
                </div>
                <div style={{ padding: 8 }}>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); router.push("/staff/profile"); }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: "#475569",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <Settings size={16} color="#64748b" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: "#ef4444",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.15s",
                      marginTop: 4,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <LogOut size={16} color="#ef4444" />
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <aside style={{ width: 220, background: "#fff", borderRight: "1px solid #e2e8f0", padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", padding: "0 6px", marginBottom: 8 }}>Navigation</div>
          {NAV_ITEMS.map(n => (
            <button key={n.id} className={`sd-nav-btn${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)}>
              <span style={{ color: tab === n.id ? "#059669" : "#94a3b8", display: "flex" }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 4 }}>
            <button className="sd-nav-btn" onClick={() => router.push("/staff/change-password")}>
              <span style={{ color: "#94a3b8", display: "flex" }}><Key size={16} /></span>
              Change Password
            </button>
            <button className="sd-nav-btn" onClick={handleLogout} style={{ color: "#ef4444" }}>
              <span style={{ color: "#ef4444", display: "flex" }}><LogOut size={16} /></span>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {selectedPatientId ? (
            <PatientProfilePanel
              patientId={selectedPatientId}
              onBack={() => setSelectedPatientId(null)}
            />
          ) : (
            <>
              {/* ── OVERVIEW TAB ── */}
              {tab === "overview" && (
                <div style={{ animation: "fadeIn .25s ease" }}>
                  {/* Welcome Banner */}
                  <div style={{ background: `linear-gradient(135deg,${roleColors.accent}15,${roleColors.accent}08)`, border: `1px solid ${roleColors.accent}25`, borderRadius: 16, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${roleColors.accent},${roleColors.accent}cc)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 20px ${roleColors.accent}30`, flexShrink: 0 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>Welcome, {profile.name.split(" ")[0]}!</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, background: roleColors.bg, color: roleColors.text, fontSize: 11, fontWeight: 700, border: `1px solid ${roleColors.accent}30` }}>
                            <Shield size={9} />{ROLE_LABELS[profile.role] || profile.role}
                          </span>
                          {profile.department && <span style={{ fontSize: 12, color: "#64748b" }}>· {profile.department.name}</span>}
                          <span style={{ fontSize: 12, color: "#64748b" }}>· {profile.hospital?.name}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{currentTime.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                      <button onClick={fetchLiveStats} disabled={statsLoading} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, color: "#64748b", cursor: "pointer", fontWeight: 600 }}>
                        <RefreshCw size={11} style={statsLoading ? { animation: "spin .7s linear infinite" } : undefined} />Refresh Stats
                      </button>
                    </div>
                  </div>

                  {/* Overdue follow-up alert */}
                  {liveStats && liveStats.overdueFollowUps > 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "10px 16px", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <AlertTriangle size={15} color="#d97706" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>{liveStats.overdueFollowUps} overdue follow-up{liveStats.overdueFollowUps > 1 ? "s" : ""} need attention</span>
                      </div>
                      <button onClick={() => setTab("followups")} style={{ fontSize: 12, fontWeight: 700, color: "#d97706", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        View Follow-ups <ChevronRight size={12} />
                      </button>
                    </div>
                  )}

                  {/* Live Stat Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                    {[
                      {
                        label: "Today's Appts",
                        value: statsLoading ? "…" : String(liveStats?.todayAppts ?? 0),
                        icon: <CalendarDays size={18} color="#0E898F" />,
                        bg: "#E6F4F4", textColor: "#07595D",
                        sub: "Scheduled today",
                      },
                      {
                        label: "Pending Follow-ups",
                        value: statsLoading ? "…" : String(liveStats?.pendingFollowUps ?? 0),
                        icon: <Clock size={18} color={liveStats && liveStats.pendingFollowUps > 0 ? "#f59e0b" : "#10b981"} />,
                        bg: liveStats && liveStats.pendingFollowUps > 0 ? "#fffbeb" : "#f0fdf4",
                        textColor: liveStats && liveStats.pendingFollowUps > 0 ? "#92400e" : "#15803d",
                        sub: liveStats && liveStats.overdueFollowUps > 0 ? `${liveStats.overdueFollowUps} overdue` : "All on track",
                      },
                      {
                        label: "Total Patients",
                        value: statsLoading ? "…" : String(liveStats?.totalPatients ?? 0),
                        icon: <Users size={18} color="#8b5cf6" />,
                        bg: "#f5f3ff", textColor: "#6d28d9",
                        sub: "Registered",
                      },
                      {
                        label: "Tenure",
                        value: monthsWorked < 1 ? "< 1 mo" : `${monthsWorked} mo`,
                        icon: <Calendar size={18} color={roleColors.accent} />,
                        bg: roleColors.bg, textColor: roleColors.text,
                        sub: joinDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
                      },
                    ].map(s => (
                      <div key={s.label} className="sd-stat-card" style={{ background: s.bg }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8" }}>{s.label}</div>
                          {s.icon}
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.textColor, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Profile + Quick Actions */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div className="sd-card" style={{ padding: 22 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>My Profile</h3>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>Staff Account</span>
                      </div>
                      {[
                        { icon: <User size={15} color={roleColors.accent} />, label: "Full Name", value: profile.name },
                        { icon: <Mail size={15} color={roleColors.accent} />, label: "Email", value: profile.email },
                        { icon: <Phone size={15} color={roleColors.accent} />, label: "Phone", value: profile.phone || "Not provided" },
                        { icon: <Briefcase size={15} color={roleColors.accent} />, label: "Role", value: ROLE_LABELS[profile.role] || profile.role },
                        { icon: <Building2 size={15} color={roleColors.accent} />, label: "Department", value: profile.department?.name || "Not assigned" },
                        { icon: <Calendar size={15} color={roleColors.accent} />, label: "Join Date", value: joinDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
                      ].map(item => (
                        <div key={item.label} className="sd-info-row">
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${roleColors.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em" }}>{item.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", marginTop: 1 }}>{item.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div className="sd-card" style={{ padding: 22 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Quick Actions</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {[
                            { label: "Appointments", icon: <CalendarDays size={15} />, onClick: () => setTab("appointments"), color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
                            { label: "Follow-ups", icon: <Clock size={15} />, onClick: () => setTab("followups"), color: "#0E898F", bg: "#E6F4F4", border: "#B3E0E0" },
                            { label: "Patients", icon: <Users size={15} />, onClick: () => setTab("patients"), color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
                          ].map(a => (
                            <button key={a.label} onClick={a.onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: a.bg, border: `1px solid ${a.border}`, cursor: "pointer", color: a.color, fontSize: 13, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{a.icon}{a.label}</div>
                              <ChevronRight size={13} />
                            </button>
                          ))}
                          <button onClick={() => router.push("/staff/change-password")} className="sd-btn sd-btn-ghost" style={{ justifyContent: "space-between", width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Key size={14} />Change Password</div>
                            <ChevronRight size={13} color="#94a3b8" />
                          </button>
                        </div>
                      </div>
                      <div className="sd-card" style={{ padding: 22, background: `linear-gradient(135deg,${roleColors.accent}10,${roleColors.accent}05)`, border: `1px solid ${roleColors.accent}20` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${roleColors.accent}20`, display: "flex", alignItems: "center", justifyContent: "center" }}><Clock size={14} color={roleColors.accent} /></div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Current Session</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
                          Logged in as <strong>{profile.name}</strong><br />
                          Role: <strong>{ROLE_LABELS[profile.role] || profile.role}</strong><br />
                          Hospital: <strong>{profile.hospital?.name || "Hospital"}</strong>
                        </div>
                      </div>
                      {profile.mustChangePassword && (
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10 }}>
                          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Change your password</div>
                            <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>You are using a temporary password.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── APPOINTMENTS TAB ── */}
              {tab === "appointments" && (
                <div style={{ animation: "fadeIn .25s ease" }}>
                  <AppointmentPanel onViewPatient={setSelectedPatientId} />
                </div>
              )}

              {/* ── FOLLOW-UPS TAB ── */}
              {tab === "followups" && (
                <div style={{ animation: "fadeIn .25s ease" }}>
                  <FollowUpDashboard onViewPatient={setSelectedPatientId} />
                </div>
              )}

              {/* ── PATIENTS TAB ── */}
              {tab === "patients" && (
                <div style={{ animation: "fadeIn .25s ease" }}>
                  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Patients</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{patients.length} registered</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 12px", minWidth: 240 }}>
                        <Search size={13} color="#94a3b8" />
                        <input
                          value={patientSearch}
                          onChange={e => setPatientSearch(e.target.value)}
                          placeholder="Search by name, ID, phone..."
                          style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: "#334155", width: "100%", fontFamily: "'Inter',sans-serif" }}
                        />
                        {patientSearch && <button onClick={() => setPatientSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 0 }}><X size={12} /></button>}
                      </div>
                    </div>
                    {patientsLoading ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 60, color: "#94a3b8", fontSize: 14 }}>
                        <div style={{ width: 20, height: 20, border: "2px solid #e2e8f0", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                        Loading patients...
                      </div>
                    ) : patients.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: 14 }}>No patients found.</div>
                    ) : filteredPatients.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                        <Search size={28} style={{ marginBottom: 10, opacity: .4 }} />
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>No patients match &ldquo;{patientSearch}&rdquo;</div>
                        <button onClick={() => setPatientSearch("")} style={{ marginTop: 10, fontSize: 12, color: "#0E898F", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear search</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}>
                          <span>Patient</span><span>Gender</span><span>Blood Group</span><span>Actions</span>
                        </div>
                        {filteredPatients.map(p => (
                          <div key={p.id} className="sd-pt-row">
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#e0e7ff,#c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3730a3", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.patientId} · {p.phone || p.email || "—"}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: "#475569" }}>{p.gender || "—"}</div>
                            <div>
                              {p.bloodGroup ? (
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 100, background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3" }}>{p.bloodGroup}</span>
                              ) : <span style={{ color: "#94a3b8" }}>—</span>}
                            </div>
                            <div>
                              <button
                                onClick={() => setSelectedPatientId(p.id)}
                                style={{ fontSize: 12, color: "#0E898F", fontWeight: 600, background: "#E6F4F4", border: "1px solid #B3E0E0", padding: "5px 10px", borderRadius: 7, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                View Profile
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── BILLING TAB ── */}
              {tab === "billing" && (
                <div style={{ animation: "fadeIn .25s ease" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    {([{ id: "queue" as const, label: "Billing Queue" }, { id: "bills" as const, label: "All Bills" }]).map(st => (
                      <button key={st.id} onClick={() => setBillingSubTab(st.id)}
                        style={{ padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1.5px solid",
                          cursor: "pointer", transition: "all .15s",
                          background: billingSubTab === st.id ? roleColors.accent : "#fff",
                          color: billingSubTab === st.id ? "#fff" : roleColors.accent,
                          borderColor: billingSubTab === st.id ? roleColors.accent : "#e2e8f0",
                        }}>{st.label}</button>
                    ))}
                  </div>
                  {billingSubTab === "queue" ? <BillingQueue deptName={profile?.department?.name || "Billing Counter"} /> : <BillingModule />}
                </div>
              )}

              {/* ── ENQUIRIES TAB ── */}
              {tab === "enquiries" && (
                <div style={{ animation: "fadeIn .25s ease" }}>
                  <EnquiryPanel />
                </div>
              )}

              {/* ── MEDICAL TOURISM TAB ── */}
              {tab === "tourism" && (
                <div style={{ animation: "fadeIn .25s ease" }}>
                  <EnquiryPanel typeFilter="MEDICAL_TOURISM" title="Medical Tourism Enquiries" />
                </div>
              )}
            </>)}

        </main>
      </div>
    </div>
  );
}
