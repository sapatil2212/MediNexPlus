"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Building2, LogOut,
  CalendarDays, Users,
  ClipboardList, ChevronDown, Search,
  Stethoscope, Info, Menu, X,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const initials = (n: string) =>
  n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

const NAV_SECTIONS = [
  {
    label: "Management",
    items: [
      { id: "overview", label: "Overview", Icon: LayoutDashboard, href: "/clinical/dashboard" },
      { id: "subdepts", label: "Sub-Departments", Icon: Building2, href: "/clinical/dashboard?tab=subdepts" },
      { id: "dept-info", label: "Department Information", Icon: Info, href: "/clinical/dashboard?tab=dept-info" },
    ],
  },
  {
    label: "Clinical Operations",
    items: [
      { id: "appointments", label: "Appointments", Icon: CalendarDays, href: "/clinical/dashboard?tab=appointments" },
      { id: "queue", label: "Patient Queue", Icon: ClipboardList, href: "/clinical/dashboard?tab=queue" },
      { id: "patients", label: "Patients", Icon: Users, href: "/clinical/dashboard?tab=patients" },
    ],
  },
];

const ALL_IDS = NAV_SECTIONS.flatMap(s => s.items.map(i => i.id));
// also accept "reports" and "analytics" for fallback compatibility

function getActiveId(tab: string | null): string {
  if (tab && ALL_IDS.includes(tab)) return tab;
  return "overview";
}

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", background: "#f0f9f9", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", gap: 14, color: "#64748b", fontSize: 13 }}>
      <div style={{ width: 30, height: 30, border: "3px solid #B3E0E0", borderTop: "3px solid #0E898F", borderRadius: "50%", animation: "cspin 0.8s linear infinite" }} />
      <style>{`@keyframes cspin{to{transform:rotate(360deg)}}`}</style>
      Loading Clinical Dashboard…
    </div>
  );
}

function ClinicalLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deptProfile, setDeptProfile] = useState<any>(null);
  const [hospitalName, setHospitalName] = useState("Hospital");
  const [hospitalLogo, setHospitalLogo] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const tab = searchParams.get("tab");
  const activeId = getActiveId(tab);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.success || d.data.role !== "DEPT_HEAD") {
          router.push("/login");
          return;
        }
        setUser(d.data);
        // Verify this is a CLINICAL dept
        fetch("/api/parentdept/me", { credentials: "include" })
          .then(r => r.json())
          .then(pd => {
            if (!pd.success) { router.push("/login"); return; }
            const type = pd.data?.type;
            if (type === "ADMINISTRATIVE") { router.push("/parentdept/dashboard"); return; }
            if (type === "SUPPORT") { router.push("/parentdept/dashboard"); return; }
            if (type === "DIAGNOSTIC") { router.push("/parentdept/dashboard"); return; }
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
          .catch(() => { });
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  if (loading) return <Spinner />;

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#B3E0E0;border-radius:4px}
        body{font-family:'Inter',sans-serif}
        input,select,button,textarea{font-family:inherit}

        /* ─── Layout shell ─── */
        .cl-wrap{display:flex;height:100vh;overflow:hidden;background:#f0f9f9}

        /* ─── Sidebar ─── */
        .cl-sb{width:224px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 10px rgba(14,137,143,.06);transition:transform .25s cubic-bezier(.4,0,.2,1)}
        .cl-sb-logo{padding:18px 20px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;min-height:64px}
        .cl-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#0E898F,#07595D);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(14,137,143,.3);flex-shrink:0}
        .cl-logo-tx{font-size:13px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cl-logo-sub{font-size:10px;color:#0E898F;font-weight:600;margin-top:1px}
        .cl-nav{flex:1;padding:10px;overflow-y:auto}
        .cl-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 5px}
        .cl-nb{display:flex;align-items:center;gap:9px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:12.5px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .cl-nb:hover{background:#f0f9f9;color:#334155}
        .cl-nb.on{background:linear-gradient(135deg,#E6F4F4,#CCE9E9);color:#0A6B70;font-weight:700}
        .cl-nb-bar{display:none;width:3px;height:22px;background:linear-gradient(180deg,#0E898F,#07595D);border-radius:0 3px 3px 0;position:absolute;left:0;top:50%;transform:translateY(-50%)}
        .cl-nb.on .cl-nb-bar{display:block}
        .cl-sb-foot{padding:12px 14px 16px;border-top:1px solid #f1f5f9}
        .cl-chip{display:flex;align-items:center;gap:9px;padding:10px;border-radius:10px;background:#f0f9f9;border:1px solid #B3E0E0;margin-bottom:8px}
        .cl-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#0E898F,#6366f1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden}
        .cl-uname{font-size:11px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cl-urole{font-size:10px;color:#0E898F;font-weight:500}
        .cl-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:11.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .cl-logout:hover{background:#fee2e2}

        /* ─── Main ─── */
        .cl-main{margin-left:224px;flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden}
        .cl-topbar{height:64px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:relative;z-index:40;flex-shrink:0;box-shadow:0 1px 6px rgba(14,137,143,.06)}
        .cl-search{display:flex;align-items:center;gap:8px;background:#f0f9f9;border:1.5px solid #B3E0E0;border-radius:10px;padding:8px 14px;width:280px;transition:border-color .2s}
        .cl-search:focus-within{border-color:#0E898F;box-shadow:0 0 0 3px rgba(14,137,143,.1)}
        .cl-search input{background:none;border:none;outline:none;font-size:12.5px;color:#334155;width:100%}
        .cl-search input::placeholder{color:#94a3b8}
        .cl-topbar-r{display:flex;align-items:center;gap:10px}
        .cl-notif-btn{width:36px;height:36px;border-radius:10px;background:#f0f9f9;border:1.5px solid #B3E0E0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s}
        .cl-notif-btn:hover{background:#E6F4F4}
        .cl-profile-btn{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#f0f9f9;border:1.5px solid #B3E0E0;cursor:pointer;transition:background .15s}
        .cl-profile-btn:hover{background:#E6F4F4}
        .cl-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#0E898F,#6366f1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;overflow:hidden}
        .cl-profile-name{font-size:11.5px;font-weight:600;color:#1e293b}
        .cl-profile-role{font-size:9px;color:#0E898F;font-weight:500}

        /* ─── Content area ─── */
        .cl-content{flex:1;padding:28px 28px 40px;overflow-y:auto}

        /* ─── Dept banner ─── */
        .cl-dept-banner{background:linear-gradient(135deg,#0E898F 0%,#07595D 100%);border-radius:16px;padding:20px 24px;margin-bottom:24px;color:#fff;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden}
        .cl-dept-banner::before{content:"";position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.06)}
        .cl-dept-banner::after{content:"";position:absolute;right:60px;bottom:-40px;width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,.04)}
        .cl-dept-banner-ic{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;backdrop-filter:blur(4px)}
        .cl-dept-banner-name{font-size:19px;font-weight:800;letter-spacing:-.02em;position:relative}
        .cl-dept-banner-sub{font-size:11px;opacity:.75;margin-top:3px;position:relative}
        .cl-dept-badge{font-size:10px;font-weight:700;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);padding:3px 10px;border-radius:100px;display:inline-flex;align-items:center;gap:4px;margin-top:6px;position:relative}

        /* ─── Stat cards ─── */
        .cl-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
        @media(max-width:1200px){.cl-stats{grid-template-columns:repeat(2,1fr)}}
        .cl-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #f0f4f4;display:flex;align-items:center;gap:14px;cursor:default;transition:border-color .2s}
        .cl-sc:hover{border-color:#daeaea}
        .cl-sc-ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .cl-sc-lbl{font-size:10px;color:#94a3b8;font-weight:500;margin-bottom:3px}
        .cl-sc-val{font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
        .cl-sc-sub{font-size:9px;color:#94a3b8;margin-top:3px}
        .cl-sc-trend{font-size:9px;font-weight:600;margin-top:4px;display:flex;align-items:center;gap:3px}

        /* ─── Chart cards ─── */
        .cl-charts{display:grid;grid-template-columns:1fr 360px;gap:16px;margin-bottom:22px}
        @media(max-width:1100px){.cl-charts{grid-template-columns:1fr}}
        .cl-card{background:#fff;border-radius:14px;border:1px solid #f0f4f4;overflow:hidden}
        .cl-card-head{padding:14px 18px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .cl-card-title{font-size:12px;font-weight:700;color:#1e293b}
        .cl-card-sub{font-size:10px;color:#94a3b8;margin-top:2px}
        .cl-card-body{padding:16px 18px}

        /* ─── Table ─── */
        .cl-tbl-wrap{overflow-x:auto}
        .cl-tbl{width:100%;border-collapse:collapse;min-width:480px}
        .cl-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;padding:8px 12px;border-bottom:2px solid #f1f5f9;letter-spacing:.04em;text-transform:uppercase}
        .cl-tbl td{padding:12px 12px;font-size:11px;color:#475569;border-bottom:1px solid #f8fafc}
        .cl-tbl tr:last-child td{border-bottom:none}
        .cl-tbl tbody tr:hover td{background:#f8fafc}
        .cl-td-name{font-weight:600;color:#1e293b}

        /* ─── Badges ─── */
        .cl-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:9px;font-weight:700}
        .cl-badge-green{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
        .cl-badge-blue{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
        .cl-badge-amber{background:#fffbeb;color:#b45309;border:1px solid #fde68a}
        .cl-badge-red{background:#fff5f5;color:#dc2626;border:1px solid #fecaca}
        .cl-badge-teal{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
        .cl-badge-gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}

        /* ─── Buttons ─── */
        .cl-btn-primary{padding:8px 16px;border-radius:9px;border:none;background:linear-gradient(135deg,#0E898F,#07595D);color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;box-shadow:0 4px 12px rgba(14,137,143,.25)}
        .cl-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(14,137,143,.35)}
        .cl-btn-ghost{padding:7px 14px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s}
        .cl-btn-ghost:hover{background:#f0f9f9;border-color:#B3E0E0;color:#0E898F}

        /* ─── Section title ─── */
        .cl-section-title{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .cl-section-title-dot{width:4px;height:18px;background:linear-gradient(180deg,#0E898F,#07595D);border-radius:4px}

        /* ─── Sub-dept grid ─── */
        .cl-sd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-bottom:24px}
        .cl-sd-card{background:#fff;border-radius:14px;border:1.5px solid #e8f4f4;overflow:hidden;cursor:pointer;transition:border-color .2s}
        .cl-sd-card:hover{border-color:#B3E0E0}
        .cl-sd-strip{height:4px}
        .cl-sd-body{padding:14px 16px}
        .cl-sd-name{font-size:12px;font-weight:700;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cl-sd-type{font-size:10px;font-weight:600;margin-top:2px}
        .cl-sd-stats{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}
        .cl-sd-stat{border-radius:8px;padding:8px;text-align:center}
        .cl-sd-stat-v{font-size:15px;font-weight:800}
        .cl-sd-stat-l{font-size:9px;color:#94a3b8;font-weight:500;text-transform:uppercase;letter-spacing:.03em;margin-top:2px}

        /* ─── Misc ─── */
        .cl-empty{padding:48px;text-align:center;color:#94a3b8}
        .cl-empty-icon{opacity:.25;margin:0 auto 12px;display:block}
        .cl-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:45;backdrop-filter:blur(2px)}
        .cl-overlay.open{display:block}
        .cl-burger{display:none;width:36px;height:36px;border-radius:10px;background:#f0f9f9;border:1.5px solid #B3E0E0;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        @media(max-width:900px){
          .cl-sb{transform:translateX(-100%)}
          .cl-sb.open{transform:translateX(0)}
          .cl-main{margin-left:0}
          .cl-burger{display:flex}
          .cl-search{width:160px}
        }
        @media(max-width:600px){
          .cl-topbar{padding:0 14px}
          .cl-search{width:120px}
          .cl-profile-name,.cl-profile-role{display:none}
          .cl-content{padding:16px 12px 24px}
          .cl-stats{grid-template-columns:repeat(2,1fr)}
        }
        @keyframes cl-spin{to{transform:rotate(360deg)}}
        .cl-spin{animation:cl-spin .7s linear infinite}
      `}</style>

      <div className="cl-wrap">
        {sidebarOpen && <div className="cl-overlay open" onClick={closeSidebar} />}
        {/* ── Sidebar ── */}
        <aside className={`cl-sb${sidebarOpen ? " open" : ""}`}>
          <div className="cl-sb-logo">
            {hospitalLogo ? (
              <img src={hospitalLogo} alt="Logo" style={{ width: "100%", maxHeight: 52, objectFit: "contain", display: "block" }} />
            ) : (
              <>
                <div className="cl-logo-ic"><Stethoscope size={18} color="#fff" /></div>
                <div style={{ overflow: "hidden" }}>
                  <div className="cl-logo-tx">{hospitalName}</div>
                  <div className="cl-logo-sub">{deptProfile?.name || "Clinical Dept."}</div>
                </div>
              </>
            )}
          </div>

          <nav className="cl-nav">
            {NAV_SECTIONS.map(sec => (
              <div key={sec.label}>
                <div className="cl-nav-sec">{sec.label}</div>
                {sec.items.map(item => {
                  const isOn = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`cl-nb${isOn ? " on" : ""}`}
                      onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                    >
                      <div className="cl-nb-bar" />
                      <item.Icon size={15} color={isOn ? "#0A6B70" : "#94a3b8"} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="cl-sb-foot">
            <button className="cl-logout" onClick={logout}>
              <LogOut size={13} /> Log Out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="cl-main">
          <header className="cl-topbar">
            <button className="cl-burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={18} color="#0E898F" /> : <Menu size={18} color="#64748b" />}
            </button>
            <div className="cl-search">
              <input
                placeholder="Search patients, appointments…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="cl-topbar-r">
              <NotificationBell accentColor="#0E898F" bgColor="#E6F4F4" borderColor="#B3E0E0" />

              <div
                className="cl-profile-btn"
                onClick={() => setProfileOpen(o => !o)}
                style={{ position: "relative" }}
              >
                <div className="cl-profile-av">
                  {user?.profilePhoto
                    ? <img src={user.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                    : (user?.name ? initials(user.name) : "CH")}
                </div>
                <div>
                  <div className="cl-profile-name">{user?.name?.split(" ")[0] || "Dept. Head"}</div>
                  <div className="cl-profile-role">Clinical Head</div>
                </div>
                <ChevronDown size={13} color="#64748b" style={{ marginLeft: 4 }} />

                {profileOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setProfileOpen(false)} />
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,.12)", zIndex: 70, overflow: "hidden" }}>
                      <div style={{ padding: 14, borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{user?.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                        {deptProfile && <div style={{ fontSize: 10, color: "#0E898F", marginTop: 4, fontWeight: 600 }}>{deptProfile.name} · CLINICAL</div>}
                      </div>
                      <div style={{ padding: 8 }}>
                        <button
                          onClick={() => { setProfileOpen(false); logout(); }}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#ef4444", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <LogOut size={14} color="#ef4444" /> Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="cl-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

export default function ClinicalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <ClinicalLayoutContent>{children}</ClinicalLayoutContent>
    </Suspense>
  );
}
