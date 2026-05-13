"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Building2, LogOut,
  CalendarDays, Users, ClipboardList,
  ChevronDown, Search, Info, Stethoscope, Menu, X,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const ACCENT       = "#059669";
const ACCENT2      = "#047857";
const ACCENT_LIGHT = "#ecfdf5";
const ACCENT_BDR   = "#a7f3d0";

const initials = (n: string) =>
  n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

const NAV_SECTIONS = [
  {
    label: "Management",
    items: [
      { id: "overview",  label: "Overview",               Icon: LayoutDashboard },
      { id: "subdepts",  label: "Sub-Departments",        Icon: Building2 },
      { id: "dept-info", label: "Department Information", Icon: Info },
    ],
  },
  {
    label: "Support Operations",
    items: [
      { id: "appointments", label: "Appointments",  Icon: CalendarDays  },
      { id: "queue",        label: "Patient Queue", Icon: ClipboardList },
      { id: "patients",     label: "Patients",      Icon: Users         },
    ],
  },
];

const ALL_IDS = NAV_SECTIONS.flatMap(s => s.items.map(i => i.id));
function getActiveId(tab: string | null) { return (tab && ALL_IDS.includes(tab)) ? tab : "overview"; }

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", background: ACCENT_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", gap: 14, color: "#64748b", fontSize:13 }}>
      <div style={{ width: 30, height: 30, border: `3px solid ${ACCENT_BDR}`, borderTop: `3px solid ${ACCENT}`, borderRadius: "50%", animation: "sspin 0.8s linear infinite" }} />
      <style>{`@keyframes sspin{to{transform:rotate(360deg)}}`}</style>
      Loading Support Dashboard…
    </div>
  );
}

function SupportLayoutContent({ children }: { children: React.ReactNode }) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [deptProfile, setDeptProfile] = useState<any>(null);
  const [hospitalLogo, setHospitalLogo] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState("Hospital");
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch]           = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const tab      = searchParams.get("tab");
  const activeId = getActiveId(tab);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.success || d.data.role !== "DEPT_HEAD") { router.push("/login"); return; }
        setUser(d.data);
        fetch("/api/parentdept/me", { credentials: "include" })
          .then(r => r.json())
          .then(pd => {
            if (!pd.success) { router.push("/login"); return; }
            const type = pd.data?.type;
            if (type === "CLINICAL")        { router.push("/clinical/dashboard");        return; }
            if (type === "ADMINISTRATIVE")  { router.push("/administrative/dashboard");  return; }
            if (type === "DIAGNOSTIC")      { router.push("/diagnostic/dashboard");      return; }
            if (type !== "SUPPORT")         { router.push("/parentdept/dashboard");      return; }
            setDeptProfile(pd.data);
            setLoading(false);
          })
          .catch(() => router.push("/login"));
        fetch("/api/config/settings", { credentials: "include" })
          .then(r => r.json())
          .then(s => {
            if (s.success && s.data?.settings) {
              setHospitalName(s.data.settings.hospitalName || "Hospital");
              setHospitalLogo(s.data.settings.logo || null);
            }
          })
          .catch(() => {});
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  const go = (id: string) => {
    const base = "/support/dashboard";
    router.push(id === "overview" ? base : `${base}?tab=${id}`);
    setSidebarOpen(false);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:${ACCENT_BDR};border-radius:4px}
        body{font-family:'Inter',sans-serif}
        input,select,button,textarea{font-family:inherit}

        .sp-wrap{display:flex;height:100vh;overflow:hidden;background:#f0fdf9}
        .sp-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:45;backdrop-filter:blur(2px)}
        .sp-overlay.open{display:block}
        .sp-sb{width:224px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 10px rgba(5,150,105,.06);transition:transform .25s cubic-bezier(.4,0,.2,1)}
        .sp-burger{display:none;width:36px;height:36px;border-radius:10px;background:${ACCENT_LIGHT};border:1.5px solid ${ACCENT_BDR};align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        .sp-sb-logo{padding:18px 20px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;min-height:64px}
        .sp-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,${ACCENT},${ACCENT2});border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(5,150,105,.3);flex-shrink:0}
        .sp-logo-tx{font-size:13px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sp-logo-sub{font-size:10px;color:${ACCENT};font-weight:600;margin-top:1px}
        .sp-nav{flex:1;padding:10px;overflow-y:auto}
        .sp-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 5px}
        .sp-nb{display:flex;align-items:center;gap:9px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .sp-nb:hover{background:${ACCENT_LIGHT};color:#334155}
        .sp-nb.on{background:linear-gradient(135deg,${ACCENT_LIGHT},#d1fae5);color:${ACCENT2};font-weight:700}
        .sp-nb-bar{display:none;width:3px;height:22px;background:linear-gradient(180deg,${ACCENT},${ACCENT2});border-radius:0 3px 3px 0;position:absolute;left:0;top:50%;transform:translateY(-50%)}
        .sp-nb.on .sp-nb-bar{display:block}
        .sp-sb-foot{padding:12px 14px 16px;border-top:1px solid #f1f5f9}
        .sp-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:11.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .sp-logout:hover{background:#fee2e2}

        .sp-main{margin-left:224px;flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden}
        .sp-topbar{height:64px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:relative;z-index:40;flex-shrink:0;box-shadow:0 1px 6px rgba(5,150,105,.06)}
        .sp-search{display:flex;align-items:center;gap:8px;background:${ACCENT_LIGHT};border:1.5px solid ${ACCENT_BDR};border-radius:10px;padding:8px 14px;width:280px;transition:border-color .2s}
        .sp-search:focus-within{border-color:${ACCENT};box-shadow:0 0 0 3px rgba(5,150,105,.1)}
        .sp-search input{background:none;border:none;outline:none;font-size:12.5px;color:#334155;width:100%}
        .sp-search input::placeholder{color:#94a3b8}
        .sp-topbar-r{display:flex;align-items:center;gap:10px}
        .sp-profile-btn{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:${ACCENT_LIGHT};border:1.5px solid ${ACCENT_BDR};cursor:pointer;transition:background .15s}
        .sp-profile-btn:hover{background:#d1fae5}
        .sp-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${ACCENT},#3b82f6);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;overflow:hidden}
        .sp-profile-name{font-size:11.5px;font-weight:600;color:#1e293b}
        .sp-profile-role{font-size:9px;color:${ACCENT};font-weight:500}
        .sp-content{flex:1;padding:28px 28px 40px;overflow-y:auto}

        /* ── Shared dd-* styles ── */
        .dd-banner{border-radius:16px;padding:20px 24px;color:#fff;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden}
        .dd-banner::before{content:"";position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.06)}
        .dd-banner-ic{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .dd-banner-name{font-size:19px;font-weight:800;letter-spacing:-.02em}
        .dd-banner-sub{font-size:11px;opacity:.75;margin-top:3px}
        .dd-badge-pill{font-size:10px;font-weight:700;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);padding:3px 10px;border-radius:100px;display:inline-flex;align-items:center;gap:4px;margin-top:6px}
        .dd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        @media(max-width:1200px){.dd-stats{grid-template-columns:repeat(2,1fr)}}
        .dd-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #e6fdf5;display:flex;align-items:center;gap:14px;cursor:default}
        .dd-sc-ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .dd-sc-lbl{font-size:10px;color:#94a3b8;font-weight:500;margin-bottom:3px}
        .dd-sc-val{font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
        .dd-sc-sub{font-size:9px;color:#94a3b8;margin-top:3px}
        .dd-card{background:#fff;border-radius:14px;border:1px solid #e6fdf5;overflow:hidden}
        .dd-card-head{padding:14px 18px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .dd-card-title{font-size:12px;font-weight:700;color:#1e293b}
        .dd-card-sub{font-size:10px;color:#94a3b8;margin-top:2px}
        .dd-card-body{padding:16px 18px}
        .dd-tbl-wrap{overflow-x:auto}
        .dd-tbl{width:100%;border-collapse:collapse;min-width:480px}
        .dd-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;padding:8px 12px;border-bottom:2px solid #f1f5f9;letter-spacing:.04em;text-transform:uppercase}
        .dd-tbl td{padding:12px;font-size:11px;color:#475569;border-bottom:1px solid #f8fafc}
        .dd-tbl tr:last-child td{border-bottom:none}
        .dd-tbl tbody tr:hover td{background:#f8fafc}
        .dd-td-name{font-weight:600;color:#1e293b}
        .dd-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:9px;font-weight:700}
        .dd-badge-green{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
        .dd-badge-blue{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
        .dd-badge-amber{background:#fffbeb;color:#b45309;border:1px solid #fde68a}
        .dd-badge-red{background:#fff5f5;color:#dc2626;border:1px solid #fecaca}
        .dd-badge-teal{background:${ACCENT_LIGHT};color:${ACCENT2};border:1px solid ${ACCENT_BDR}}
        .dd-badge-gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
        .dd-btn-ghost{padding:7px 14px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .15s}
        .dd-btn-ghost:hover{background:${ACCENT_LIGHT};border-color:${ACCENT_BDR};color:${ACCENT}}
        .dd-section-title{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .dd-section-dot{width:4px;height:18px;background:linear-gradient(180deg,${ACCENT},${ACCENT2});border-radius:4px;flex-shrink:0}
        .dd-empty{padding:48px;text-align:center;color:#94a3b8}
        @keyframes dd-spin{to{transform:rotate(360deg)}}
        @media(max-width:900px){
          .sp-sb{transform:translateX(-100%)}
          .sp-sb.open{transform:translateX(0)}
          .sp-main{margin-left:0}
          .sp-burger{display:flex}
          .sp-search{width:160px}
        }
        @media(max-width:600px){
          .sp-topbar{padding:0 14px}
          .sp-search{width:120px}
          .sp-profile-name,.sp-profile-role{display:none}
          .sp-content{padding:16px 12px 24px}
          .dd-stats{grid-template-columns:repeat(2,1fr)}
        }
      `}</style>

      <div className="sp-wrap">
        {sidebarOpen && <div className="sp-overlay open" onClick={closeSidebar} />}
        <aside className={`sp-sb${sidebarOpen ? " open" : ""}`}>
          <div className="sp-sb-logo">
            {hospitalLogo ? (
              <img src={hospitalLogo} alt="Logo" style={{ width: "100%", maxHeight: 52, objectFit: "contain", display: "block" }} />
            ) : (
              <>
                <div className="sp-logo-ic"><Stethoscope size={18} color="#fff" /></div>
                <div style={{ overflow: "hidden" }}>
                  <div className="sp-logo-tx">{hospitalName}</div>
                  <div className="sp-logo-sub">{deptProfile?.name || "Support Dept."}</div>
                </div>
              </>
            )}
          </div>

          <nav className="sp-nav">
            {NAV_SECTIONS.map(sec => (
              <div key={sec.label}>
                <div className="sp-nav-sec">{sec.label}</div>
                {sec.items.map(item => {
                  const isOn = activeId === item.id;
                  return (
                    <button key={item.id} className={`sp-nb${isOn ? " on" : ""}`} onClick={() => go(item.id)}>
                      <div className="sp-nb-bar" />
                      <item.Icon size={15} color={isOn ? ACCENT2 : "#94a3b8"} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="sp-sb-foot">
            <button className="sp-logout" onClick={logout}><LogOut size={13} /> Log Out</button>
          </div>
        </aside>

        <main className="sp-main">
          <header className="sp-topbar">
            <button className="sp-burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={18} color={ACCENT} /> : <Menu size={18} color="#64748b" />}
            </button>
            <div className="sp-search">
              <input placeholder="Search patients, appointments…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="sp-topbar-r">
              <NotificationBell accentColor={ACCENT} bgColor={ACCENT_LIGHT} borderColor={ACCENT_BDR} />
              <div className="sp-profile-btn" onClick={() => setProfileOpen(o => !o)} style={{ position: "relative" }}>
                <div className="sp-profile-av">
                  {user?.profilePhoto
                    ? <img src={user.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                    : (user?.name ? initials(user.name) : "SH")}
                </div>
                <div>
                  <div className="sp-profile-name">{user?.name?.split(" ")[0] || "Dept. Head"}</div>
                  <div className="sp-profile-role">Support Head</div>
                </div>
                <ChevronDown size={13} color="#64748b" style={{ marginLeft: 4 }} />
                {profileOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setProfileOpen(false)} />
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,.12)", zIndex: 70, overflow: "hidden" }}>
                      <div style={{ padding: 14, borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{user?.name}</div>
                        <div style={{ fontSize:10, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                        {deptProfile && <div style={{ fontSize:10, color: ACCENT, marginTop: 4, fontWeight: 600 }}>{deptProfile.name} · SUPPORT</div>}
                      </div>
                      <div style={{ padding: 8 }}>
                        <button onClick={() => { setProfileOpen(false); logout(); }}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#ef4444", fontSize:11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          <LogOut size={14} color="#ef4444" /> Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
          <div className="sp-content">{children}</div>
        </main>
      </div>
    </>
  );
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <SupportLayoutContent>{children}</SupportLayoutContent>
    </Suspense>
  );
}
