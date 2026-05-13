"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, Settings, HelpCircle,
  LogOut, Search, MessageSquare, Building2, Stethoscope, ClipboardList,
  IndianRupee, CreditCard, ChevronDown, User, LogIn, BedDouble, BarChart2, FileQuestion, BookOpen, Globe, Menu, X
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import AppointmentAlertModal from "@/components/AppointmentAlertModal";
import SupportModal from "@/components/SupportModal";

const initials = (n: string) => n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", Icon: LayoutDashboard, section: "General", route: "/hospitaladmin/dashboard" },
  { id: "appointments", label: "Appointments", Icon: CalendarDays, section: "General", route: "/hospitaladmin/appointments" },
  { id: "billing", label: "Billing", Icon: CreditCard, section: "General", route: "/hospitaladmin/dashboard?tab=billing" },
  { id: "inventory", label: "Inventory", Icon: ClipboardList, section: "General", route: "/hospitaladmin/dashboard?tab=inventory" },
  { id: "ipd", label: "IPD / Wards", Icon: BedDouble, section: "General", route: "/hospitaladmin/dashboard?tab=ipd" },
  { id: "staff", label: "Staff", Icon: Users, section: "General", route: "/hospitaladmin/staff" },
  { id: "doctors", label: "Doctors", Icon: Stethoscope, section: "General", route: "/hospitaladmin/doctors" },
  { id: "patients", label: "Patients", Icon: UserRound, section: "General", route: "/hospitaladmin/dashboard?tab=patients" },
  { id: "departments", label: "Departments", Icon: Building2, section: "General", route: "/hospitaladmin/dashboard?tab=departments" },
  { id: "enquiries", label: "Enquiries", Icon: FileQuestion, section: "General", route: "/hospitaladmin/dashboard?tab=enquiries" },
  { id: "tourism", label: "Medical Tourism", Icon: Globe, section: "General", route: "/hospitaladmin/dashboard?tab=tourism" },
  { id: "blogs", label: "Blogs", Icon: BookOpen, section: "General", route: "/hospitaladmin/dashboard?tab=blogs" },
  { id: "reports", label: "Reports", Icon: BarChart2, section: "System", route: "/hospitaladmin/dashboard?tab=reports" },
  { id: "finance", label: "Finance", Icon: IndianRupee, section: "System", route: "/hospitaladmin/finance" },
];

function getActiveId(pathname: string, tab: string | null): string {
  if (pathname.startsWith("/hospitaladmin/appointments")) return "appointments";
  if (pathname.startsWith("/hospitaladmin/finance")) return "finance";
  if (pathname.startsWith("/hospitaladmin/staff")) return "staff";
  if (pathname.startsWith("/hospitaladmin/doctors")) return "doctors";
  if (pathname.startsWith("/hospitaladmin/configure")) return "configure";
  if (pathname.startsWith("/hospitaladmin/profile")) return "profile";
  if (pathname.startsWith("/hospitaladmin/dashboard")) {
    if (tab === "inventory") return "inventory";
    if (tab === "billing") return "billing";
    if (tab === "ipd") return "ipd";
    if (tab === "departments") return "departments";
    if (tab === "enquiries") return "enquiries";
    if (tab === "tourism") return "tourism";
    if (tab === "blogs") return "blogs";
    if (tab === "reports") return "reports";
    if (tab === "finance") return "finance";
    if (tab === "settings") return "settings";
    if (tab === "patients") return "patients";
    return "overview";
  }
  return "overview";
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", gap: 14, color: "#64748b", fontSize: 13 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #B3E0E0", borderTop: "3px solid #0E898F", borderRadius: "50%", animation: "sp 0.8s linear infinite" }} />
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      Loading...
    </div>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const tab = searchParams.get("tab");
  const activeId = getActiveId(pathname, tab);

  const fetchUser = () => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.success) { router.push("/login"); return; }
        if (d.data.role === "DOCTOR") { router.push("/doctor/dashboard"); return; }
        if (d.data.role === "STAFF" || d.data.role === "RECEPTIONIST") { router.push("/staff/dashboard"); return; }
        if (d.data.role === "SUB_DEPT_HEAD") { router.push("/subdept/dashboard"); return; }
        if (d.data.role === "FINANCE_HEAD") { router.push("/finance/dashboard"); return; }
        if (d.data.role !== "HOSPITAL_ADMIN") { router.push("/login"); return; }
        setUser(d.data);
        setLoading(false);
        // Fetch hospital settings for logo and name
        fetch("/api/config/settings", { credentials: "include" })
          .then(r => r.json())
          .then(settingsData => {
            if (settingsData.success && settingsData.data?.settings) {
              setHospitalSettings(settingsData.data.settings);
            }
          })
          .catch(() => { });
      })
      .catch(() => router.push("/login"));
  };

  useEffect(() => {
    fetchUser();
  }, [router]);

  // Re-fetch user data when profile is updated from the profile page
  useEffect(() => {
    const handleProfileUpdate = () => fetchUser();
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  const navigate = (item: typeof NAV_ITEMS[0]) => {
    router.push(item.route);
    setSidebarOpen(false);
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (loading) return <LoadingScreen />;

  const generalItems = NAV_ITEMS.filter(n => n.section === "General");
  const systemItems = NAV_ITEMS.filter(n => n.section === "System");

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        input,select,button,textarea{font-family:'Inter',sans-serif}
        .hd{display:flex;height:100vh;overflow:hidden;font-family:'Inter',sans-serif;background:#f0f4f8}
        .hd-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:45;backdrop-filter:blur(2px)}
        .hd-overlay.open{display:block}
        .hd-sb{width:220px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(0,0,0,0.04);transition:transform .25s cubic-bezier(.4,0,.2,1)}
        .hd-sb-logo{padding:20px 20px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px}
        .hd-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#0E898F,#07595D);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
        .hd-logo-tx{font-size:14px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
        .hd-logo-sub{font-size:10px;color:#94a3b8}
        .hd-nav{flex:1;padding:12px;overflow-y:auto}
        .hd-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 6px}
        .hd-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .hd-nb:hover{background:#f8fafc;color:#334155}
        .hd-nb.on{background:#E6F4F4;color:#0A6B70;font-weight:600}
        .hd-nb-dot{display:none;width:3px;border-radius:4px;height:22px;background:#0E898F;position:absolute;left:0}
        .hd-nb.on .hd-nb-dot{display:block}
        .hd-sb-foot{padding:14px 16px 18px;border-top:1px solid #f1f5f9}
        .hd-user-chip{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:10px}
        .hd-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#0E898F,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden}
        .hd-uname{font-size:11px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hd-urole{font-size:10px;font-weight:500;color:#0E898F}
        .hd-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .hd-logout:hover{background:#fee2e2}
        .hd-burger{display:none;width:36px;height:36px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .15s}
        .hd-burger:hover{background:#E6F4F4}
        .hd-main{margin-left:220px;flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden}
        .hd-topbar{height:64px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:relative;z-index:40;flex-shrink:0}
        .hd-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px;transition:border-color .2s}
        .hd-search-wrap:focus-within{border-color:#80CCCC}
        .hd-search{background:none;border:none;outline:none;font-size:12px;color:#334155;width:100%}
        .hd-search::placeholder{color:#94a3b8}
        .hd-topbar-right{display:flex;align-items:center;gap:12px}
        .hd-notif{width:36px;height:36px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:background .15s}
        .hd-notif:hover{background:#E6F4F4}
        .hd-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#ef4444;border:1.5px solid #fff}
        .hd-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer}
        .hd-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#0E898F,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;overflow:hidden}
        .hd-profile-name{font-size:10px;font-weight:600;color:#1e293b}
        .hd-profile-role{font-size:9px;color:#64748b}
        .hd-body{display:grid;grid-template-columns:1fr 260px;flex:1;min-height:0}
        .hd-center{padding:32px 20px;overflow-y:auto}
        .hd-right{background:#fff;border-left:1px solid #e2e8f0;padding:32px 18px;overflow-y:auto}
        .hd-pg-title{font-size:17px;font-weight:800;color:#1e293b;letter-spacing:-.02em;margin-bottom:18px}
        .hd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
        .hd-activity-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 18px; }
        .hd-quick-access { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
        .hd-appt-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .hd-staff-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .hd-settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media(max-width:1100px){
          .hd-stats{grid-template-columns:repeat(2,1fr)}
          .hd-activity-grid { grid-template-columns: repeat(4, 1fr); }
          .hd-staff-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width:900px){
          .hd-sb{transform:translateX(-100%)}
          .hd-sb.open{transform:translateX(0)}
          .hd-main{margin-left:0}
          .hd-burger{display:flex}
          .hd-search-wrap{width:180px}
          .hd-body{grid-template-columns:1fr}
          .hd-right{display:none}
          .hd-activity-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media(max-width:600px){
          .hd-topbar{padding:0 14px;gap:8px}
          .hd-search-wrap{width:140px}
          .hd-profile-name,.hd-profile-role{display:none}
          .hd-center{padding:16px 12px}
          .hd-stats{grid-template-columns:1fr}
          .hd-mid{grid-template-columns:1fr}
          .hd-activity-grid { grid-template-columns: repeat(2, 1fr); }
          .hd-quick-access { grid-template-columns: 1fr; }
          .hd-appt-grid { grid-template-columns: 1fr; }
          .hd-staff-grid { grid-template-columns: 1fr; }
          .hd-settings-grid { grid-template-columns: 1fr; }
          .hd-banner { flex-direction: column; align-items: flex-start; padding: 20px; }
          .hd-page-header { flex-direction: column; align-items: flex-start; }
        }
        @media(max-width:400px){
          .hd-activity-grid { grid-template-columns: 1fr; }
        }
        .hd-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;transition:transform .2s,border-color .2s;cursor:default}
        .hd-sc:hover{transform:translateY(-1px);border-color:#b3d9da}
        .hd-sc-icon{width:40px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .hd-sc-lbl{font-size:10px;font-weight:500;color:#94a3b8;margin-bottom:2px}
        .hd-sc-val{font-size:19px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
        .hd-sc-sub{font-size:9px;color:#94a3b8;margin-top:3px}
        .hd-mid{display:grid;grid-template-columns:1fr 220px;gap:14px;margin-bottom:18px}
        .hd-banner { display: flex; align-items: center; justify-content: space-between; gap: 16px; background: linear-gradient(135deg,#0E898F,#07595D); border-radius: 16px; padding: 24px 28px; color: #fff; }
        .hd-page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .hd-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden}
        .hd-card-head{padding:14px 18px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #f1f5f9}
        .hd-card-title{font-size:12px;font-weight:700;color:#1e293b}
        .hd-card-sub{font-size:10px;color:#94a3b8;margin-top:2px}
        .hd-card-body{padding:16px 18px}
        .hd-card-icon-btn{width:28px;height:28px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:background .15s}
        .hd-card-icon-btn:hover{background:#E6F4F4;color:#0E898F}
        .hd-chart{display:flex;align-items:flex-end;gap:10px;height:140px}
        .hd-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1}
        .hd-bar{width:100%;border-radius:6px 6px 0 0;transition:opacity .2s;cursor:pointer;min-width:18px}
        .hd-bar:hover{opacity:.8}
        .hd-bar-lbl{font-size:9px;color:#94a3b8;font-weight:500}
        .hd-report-item{padding:10px;border-radius:10px;margin-bottom:8px;cursor:pointer}
        .hd-ri-msg{font-size:10px;font-weight:500;color:#334155;line-height:1.4}
        .hd-ri-time{font-size:9px;color:#94a3b8;margin-top:4px}
        .hd-tbl-wrap{overflow-x:auto}
        .hd-tbl{width:100%;border-collapse:collapse;min-width:500px}
        .hd-tbl th{text-align:left;font-size:10px;font-weight:600;color:#94a3b8;padding:10px 12px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .hd-tbl td{padding:14px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f8fafc}
        .hd-tbl tr:last-child td{border-bottom:none}
        .hd-tbl tbody tr:hover td{background:#fafbfc}
        .hd-td-name{font-weight:600;color:#1e293b}
        .hd-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:9px;font-weight:700;white-space:nowrap}
        .hd-right-sec{margin-bottom:22px}
        .hd-right-title{font-size:11px;font-weight:700;color:#1e293b;margin-bottom:12px}
        .hd-appt-item{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;cursor:pointer;transition:all .15s;background:#fff}
        .hd-appt-item.active{background:#0E898F;border-color:#0E898F}
        .hd-appt-item.active .hd-appt-name{color:#fff}
        .hd-appt-item.active .hd-appt-doc{color:rgba(255,255,255,0.75)}
        .hd-appt-item.active .hd-appt-time{color:rgba(255,255,255,0.7)}
        .hd-appt-ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#E6F4F4}
        .hd-appt-item.active .hd-appt-ic{background:rgba(255,255,255,0.18)}
        .hd-appt-name{font-size:11px;font-weight:700;color:#1e293b;flex:1}
        .hd-appt-doc{font-size:10px;color:#64748b;margin-top:1px}
        .hd-appt-time{font-size:9px;color:#94a3b8;white-space:nowrap}
        .hd-btn-primary{padding:8px 16px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:10px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;box-shadow:0 4px 12px rgba(59,130,246,0.25)}
        .hd-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
        .hd-filter-btn{padding:6px 14px;border-radius:8px;background:#f1f5f9;border:1px solid #e2e8f0;color:#64748b;font-size:10px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px}
        .hd-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .hd-modal{background:#fff;border-radius:18px;padding:32px 28px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.15)}
        .hd-modal-title{font-size:15px;font-weight:800;color:#1e293b;margin-bottom:4px}
        .hd-modal-sub{font-size:11px;color:#64748b;margin-bottom:20px}
        .hd-mf{margin-bottom:13px}
        .hd-ml{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:5px}
        .hd-mi{width:100%;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:10px;color:#1e293b;outline:none;transition:border-color .2s}
        .hd-mi:focus{border-color:#80CCCC;box-shadow:0 0 0 3px rgba(147,197,253,0.25)}
        .hd-mi::placeholder{color:#cbd5e1}
        .hd-ma{display:flex;gap:10px;margin-top:18px}
        .hd-mcancel{flex:1;padding:10px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer}
        .hd-mcancel:hover{background:#f8fafc}
        .hd-msubmit{flex:2;padding:10px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,0.25)}
        .hd-msubmit:disabled{opacity:.55;cursor:not-allowed}
        .hd-spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite}
        @keyframes sp{to{transform:rotate(360deg)}}
        .hd-msg-ok{font-size:10px;color:#10b981;margin-top:8px;text-align:center;font-weight:600}
        .hd-msg-err{font-size:10px;color:#ef4444;margin-top:8px;text-align:center}
        .mb16{margin-bottom:16px}
      `}</style>

      <div className="hd">
        {/* ── Overlay ── */}
        {sidebarOpen && <div className="hd-overlay open" onClick={closeSidebar} />}
        {/* ── Sidebar ── */}
        <aside className={`hd-sb${sidebarOpen ? " open" : ""}`}>
          <div className="hd-sb-logo">
            {hospitalSettings?.logo ? (
              <img src={hospitalSettings.logo} alt="Hospital Logo" style={{ width: "100%", maxHeight: 52, objectFit: "contain", display: "block" }} />
            ) : (
              <>
                <div className="hd-logo-ic"><Stethoscope size={18} color="white" /></div>
                <div><div className="hd-logo-tx">{hospitalSettings?.hospitalName || user?.hospital?.name || "MediNexPlus"}</div><div className="hd-logo-sub">Hospital Admin</div></div>
              </>
            )}
          </div>

          <nav className="hd-nav">
            <div className="hd-nav-sec">General</div>
            {generalItems.map(n => (
              <button
                key={n.id}
                className={`hd-nb${activeId === n.id ? " on" : ""}`}
                onClick={() => navigate(n)}
                style={{ position: "relative" }}
              >
                {activeId === n.id && <div className="hd-nb-dot" />}
                <span style={{ color: activeId === n.id ? "#0A6B70" : "#94a3b8", display: "flex" }}>
                  <n.Icon size={16} />
                </span>
                {n.label}
              </button>
            ))}

            <div className="hd-nav-sec">System</div>
            {systemItems.map(n => (
              <button
                key={n.id}
                className={`hd-nb${activeId === n.id ? " on" : ""}`}
                onClick={() => navigate(n)}
                style={{ position: "relative" }}
              >
                {activeId === n.id && <div className="hd-nb-dot" />}
                <span style={{ color: activeId === n.id ? "#0A6B70" : "#94a3b8", display: "flex" }}>
                  <n.Icon size={16} />
                </span>
                {n.label}
              </button>
            ))}

            <button
              className={`hd-nb${activeId === "configure" ? " on" : ""}`}
              onClick={() => router.push("/hospitaladmin/configure")}
              style={{ position: "relative" }}
            >
              {activeId === "configure" && <div className="hd-nb-dot" />}
              <span style={{ color: activeId === "configure" ? "#0A6B70" : "#94a3b8", display: "flex" }}>
                <Building2 size={16} />
              </span>
              Configure Hospital
            </button>

            <button className="hd-nb" onClick={() => setSupportOpen(true)}>
              <span style={{ color: "#94a3b8", display: "flex" }}><HelpCircle size={16} /></span>
              Support
            </button>
          </nav>

          <div className="hd-sb-foot">
            <div className="hd-user-chip">
              <div className="hd-av">{user?.profilePhoto ? <img src={user.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }} /> : (user?.name ? initials(user.name) : "HA")}</div>
              <div style={{ overflow: "hidden" }}>
                <div className="hd-uname">{user?.name || "Hospital Admin"}</div>
                <div className="hd-urole">Hospital Admin</div>
              </div>
            </div>
            <button className="hd-logout" onClick={logout}>
              <LogOut size={13} /> Log Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="hd-main">
          <header className="hd-topbar">
            <button className="hd-burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={18} color="#0E898F" /> : <Menu size={18} color="#64748b" />}
            </button>
            <div className="hd-search-wrap">
              <input
                className="hd-search"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    router.push(`/hospitaladmin/dashboard?tab=patients&q=${encodeURIComponent(search.trim())}`);
                  }
                }}
              />
            </div>
            <div className="hd-topbar-right">
              <NotificationBell accentColor="#0E898F" bgColor="#f8fafc" borderColor="#e2e8f0" />
              <div
                className="hd-profile"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{ position: "relative" }}
              >
                <div className="hd-profile-av">{user?.profilePhoto ? <img src={user.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /> : (user?.name ? initials(user.name) : "HA")}</div>
                <div>
                  <div className="hd-profile-name">{user?.name?.split(" ")[0] || "Admin"}</div>
                  <div className="hd-profile-role">Hosp. Admin</div>
                </div>
                <ChevronDown size={14} color="#64748b" style={{ marginLeft: 6 }} />

                {profileDropdownOpen && (
                  <>
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 60 }}
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220,
                      background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)", zIndex: 70, overflow: "hidden",
                    }}>
                      <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{user?.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button
                          onClick={() => { setProfileDropdownOpen(false); router.push("/hospitaladmin/profile"); }}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#475569", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <User size={16} color="#64748b" />
                          Account Settings
                        </button>
                        <button
                          onClick={() => { setProfileDropdownOpen(false); logout(); }}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#ef4444", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s", marginTop: 4 }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <LogOut size={16} color="#ef4444" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
      <AppointmentAlertModal />
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </>
  );
}

export default function HospitalAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}
