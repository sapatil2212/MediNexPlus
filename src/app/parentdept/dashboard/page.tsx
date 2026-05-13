"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2, Package, TrendingUp, Users, Activity, BarChart2,
  RefreshCw, Loader2, ToggleLeft, ToggleRight, ShoppingCart,
  ClipboardList, Receipt, AlertTriangle, Clock, ArrowLeft,
  ChevronRight, UserCheck, IndianRupee, Layers, Eye,
  Smile, Sparkles, Scissors, Heart, Microscope, Pill, Scan,
  TestTube2, Stethoscope, FlaskConical, ExternalLink, CheckCircle2,
  CalendarDays,
} from "lucide-react";
import dynamic from "next/dynamic";

const ReportsPanel = dynamic(() => import("@/components/ReportsPanel"), { ssr: false });
const PharmacyDashboard = dynamic(() => import("@/components/PharmacyDashboard"), { ssr: false });

type NavTab = "overview" | "subdepts" | "queue" | "inventory" | "purchases" | "billing" | "reports" | "analytics";

const ALL_TABS: NavTab[] = ["overview", "subdepts", "queue", "inventory", "purchases", "billing", "reports", "analytics"];

/* ─── Sub-dept type metadata (icons + colors) ─── */
type DeptMeta = { Icon: any; gradient: string; accent: string; lightBg: string; borderColor: string };
const SUB_DEPT_META: Record<string, DeptMeta> = {
  DENTAL:      { Icon: Smile,       gradient: "linear-gradient(135deg,#06b6d4,#0891b2)", accent: "#0891b2", lightBg: "#ecfeff", borderColor: "#a5f3fc" },
  DERMATOLOGY: { Icon: Sparkles,    gradient: "linear-gradient(135deg,#ec4899,#be185d)", accent: "#be185d", lightBg: "#fdf2f8", borderColor: "#fbcfe8" },
  HAIR:        { Icon: Scissors,    gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)", accent: "#6d28d9", lightBg: "#f5f3ff", borderColor: "#ddd6fe" },
  ONCOLOGY:    { Icon: Activity,    gradient: "linear-gradient(135deg,#f97316,#c2410c)", accent: "#c2410c", lightBg: "#fff7ed", borderColor: "#fed7aa" },
  CARDIOLOGY:  { Icon: Heart,       gradient: "linear-gradient(135deg,#ef4444,#b91c1c)", accent: "#b91c1c", lightBg: "#fff5f5", borderColor: "#fecaca" },
  PATHOLOGY:   { Icon: Microscope,  gradient: "linear-gradient(135deg,#10b981,#047857)", accent: "#047857", lightBg: "#f0fdf4", borderColor: "#a7f3d0" },
  PHARMACY:    { Icon: Pill,        gradient: "linear-gradient(135deg,#0E898F,#07595D)", accent: "#07595D", lightBg: "#E6F4F4", borderColor: "#B3E0E0" },
  BILLING:     { Icon: Receipt,     gradient: "linear-gradient(135deg,#f59e0b,#b45309)", accent: "#b45309", lightBg: "#fffbeb", borderColor: "#fde68a" },
  RADIOLOGY:   { Icon: Scan,        gradient: "linear-gradient(135deg,#6366f1,#4338ca)", accent: "#4338ca", lightBg: "#eef2ff", borderColor: "#c7d2fe" },
  LABORATORY:  { Icon: TestTube2,   gradient: "linear-gradient(135deg,#14b8a6,#0f766e)", accent: "#0f766e", lightBg: "#f0fdfa", borderColor: "#99f6e4" },
  PROCEDURE:   { Icon: Stethoscope, gradient: "linear-gradient(135deg,#84cc16,#4d7c0f)", accent: "#4d7c0f", lightBg: "#f7fee7", borderColor: "#d9f99d" },
  RECEPTION:   { Icon: Users,       gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)", accent: "#1d4ed8", lightBg: "#eff6ff", borderColor: "#bfdbfe" },
  NURSING:     { Icon: Heart,       gradient: "linear-gradient(135deg,#ec4899,#be185d)", accent: "#be185d", lightBg: "#fdf2f8", borderColor: "#fbcfe8" },
  HOUSEKEEPING:{ Icon: ClipboardList,gradient: "linear-gradient(135deg,#f97316,#c2410c)", accent: "#c2410c", lightBg: "#fff7ed", borderColor: "#fed7aa" },
  AMBULANCE:   { Icon: Activity,    gradient: "linear-gradient(135deg,#ef4444,#b91c1c)", accent: "#b91c1c", lightBg: "#fff5f5", borderColor: "#fecaca" },
  BIOMEDICAL:  { Icon: FlaskConical,gradient: "linear-gradient(135deg,#6366f1,#4338ca)", accent: "#4338ca", lightBg: "#eef2ff", borderColor: "#c7d2fe" },
  OTHER:       { Icon: Layers,      gradient: "linear-gradient(135deg,#64748b,#334155)", accent: "#334155", lightBg: "#f8fafc", borderColor: "#e2e8f0" },
};

const getSubDeptMeta = (type: string) => SUB_DEPT_META[type] || SUB_DEPT_META.OTHER;

export default function ParentDeptDashboard() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deptProfile, setDeptProfile] = useState<any>(null);
  const [tab, setTab] = useState<NavTab>("overview");
  const [viewingSubDept, setViewingSubDept] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("tab");
    const sdId = searchParams.get("subdept");
    if (sdId) {
      setTab("subdepts");
      setViewingSubDept(sdId);
    } else if (t && ALL_TABS.includes(t as NavTab)) {
      setTab(t as NavTab);
      setViewingSubDept(null);
    } else {
      setTab("overview");
      setViewingSubDept(null);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (!d.success) { router.push("/login"); return; }
        if (d.data.role === "HOSPITAL_ADMIN") { router.push("/hospitaladmin/dashboard"); return; }
        if (d.data.role === "DOCTOR") { router.push("/doctor/dashboard"); return; }
        if (d.data.role === "STAFF" || d.data.role === "RECEPTIONIST") { router.push("/staff/dashboard"); return; }
        if (d.data.role === "SUB_DEPT_HEAD") { router.push("/subdept/dashboard"); return; }
        if (d.data.role === "FINANCE_HEAD") { router.push("/finance/dashboard"); return; }
        if (d.data.role !== "DEPT_HEAD") { router.push("/login"); return; }
        setUser(d.data);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!loading && user) {
      fetch("/api/parentdept/me", { credentials: "include" })
        .then(r => r.json())
        .then(d => { if (d.success) setDeptProfile(d.data); })
        .catch(() => {});
    }
  }, [loading, user]);

  const openSubDeptDashboard = (sdId: string) => {
    setViewingSubDept(sdId);
    router.push(`/parentdept/dashboard?tab=subdepts&subdept=${sdId}`, { scroll: false });
  };

  const closeSubDeptDashboard = () => {
    setViewingSubDept(null);
    router.push("/parentdept/dashboard?tab=subdepts", { scroll: false });
  };

  if (loading) return null;

  /* If viewing a sub-dept dashboard */
  if (viewingSubDept && tab === "subdepts") {
    return (
      <div className="hd-body">
        <div className="hd-center">
          <SubDeptDetailView subDeptId={viewingSubDept} onBack={closeSubDeptDashboard} />
        </div>
      </div>
    );
  }

  /* Pharmacy-specific tabs render the PharmacyDashboard with the active tab */
  const pharmacyTabs: NavTab[] = ["queue", "inventory", "purchases", "billing"];
  if (pharmacyTabs.includes(tab)) {
    return (
      <div className="hd-body">
        <div className="hd-center">
          <PharmacyDashboard profile={deptProfile} user={user} activeTab={tab} />
        </div>
      </div>
    );
  }

  return (
    <div className="hd-body">
      <div className="hd-center">
        {tab === "overview" && <OverviewTab deptProfile={deptProfile} onOpenSubDept={openSubDeptDashboard} />}
        {tab === "subdepts" && !viewingSubDept && <SubDeptsTab onOpenSubDept={openSubDeptDashboard} />}
        {(tab === "reports" || tab === "analytics") && <ReportsPanel />}
      </div>
    </div>
  );
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab({ deptProfile, onOpenSubDept }: { deptProfile: any; onOpenSubDept: (id: string) => void }) {
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [pharmStats, setPharmStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/parentdept/subdepartments", { credentials: "include" }).then(r => r.json()),
      fetch("/api/pharmacy/stats", { credentials: "include" }).then(r => r.json()),
    ]).then(([sd, ps]) => {
      if (sd.success) setSubDepts(sd.data || []);
      if (ps.success) setPharmStats(ps.data);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, []);

  const activeSubDepts = subDepts.filter((s: any) => s.isActive).length;

  const statCards = [
    { label: "Sub-Departments", value: loadingData ? "—" : activeSubDepts, Icon: Building2, color: "#0E898F", bg: "#E6F4F4", badge: { text: "ACTIVE", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" } },
    { label: "Prescriptions Today", value: pharmStats?.todayRxCount ?? "—", Icon: ClipboardList, color: "#f59e0b", bg: "#fffbeb", badge: pharmStats?.pendingCount > 0 ? { text: `${pharmStats.pendingCount} PENDING`, bg: "#fff3e6", color: "#ea580c", border: "#fed7aa" } : { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" } },
    { label: "Inventory Items", value: pharmStats?.totalItems ?? "—", Icon: Package, color: "#3b82f6", bg: "#eff6ff", badge: pharmStats?.lowStockCount > 0 ? { text: `${pharmStats.lowStockCount} LOW`, bg: "#fff5f5", color: "#ef4444", border: "#fecaca" } : undefined },
    { label: "Revenue Today", value: pharmStats?.todayRevenue ? `₹${pharmStats.todayRevenue.toLocaleString("en-IN")}` : "₹0", Icon: IndianRupee, color: "#10b981", bg: "#f0fdf4", badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" } },
    { label: "Total Records", value: pharmStats?.totalRecords ?? "—", Icon: CheckCircle2, color: "#059669", bg: "#f0fdf4" },
  ];

  return (
    <>
      {/* Header: title + live indicator + refresh */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>
            {deptProfile?.name || "Pharmacy"} Overview
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 3px #dcfce7", flexShrink: 0 }} />
            Live &middot; Updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <button
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={13} className={loadingData ? "opd2-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Grid - 5 Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        {statCards.map((s, i) => {
          const SI = s.Icon;
          return (
            <div key={i} style={{
              cursor: "default",
              padding: "10px 12px",
              gap: 10,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
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

      {/* Alerts Row */}
      {pharmStats && (pharmStats.lowStockCount > 0 || pharmStats.expiringCount > 0) && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {pharmStats.lowStockCount > 0 && (
            <div style={{ flex: 1, minWidth: 260, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize:12, fontWeight: 500 }}>
              <AlertTriangle size={16} />
              <span><strong>{pharmStats.lowStockCount}</strong> item{pharmStats.lowStockCount !== 1 ? "s" : ""} below minimum stock</span>
            </div>
          )}
          {pharmStats.expiringCount > 0 && (
            <div style={{ flex: 1, minWidth: 260, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "#fff5f5", border: "1px solid #fecaca", color: "#991b1b", fontSize:12, fontWeight: 500 }}>
              <Clock size={16} />
              <span><strong>{pharmStats.expiringCount}</strong> item{pharmStats.expiringCount !== 1 ? "s" : ""} expiring within 30 days</span>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
        {/* Department Info Card */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={15} color="#0E898F" />Department Information
            </span>
          </div>
          <div style={{ padding: "14px 18px" }}>
            <div style={{ display: "grid", gap: 12 }}>
              <InfoRow label="Department Name" value={deptProfile?.name} />
              <InfoRow label="Department Code" value={deptProfile?.code} />
              <InfoRow label="Type" value={deptProfile?.type} />
              <InfoRow label="Status" value={deptProfile?.isActive ? "Active" : "Inactive"} valueColor={deptProfile?.isActive ? "#10b981" : "#ef4444"} />
            </div>
            {deptProfile?.description && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{deptProfile.description}</div>
              </div>
            )}
          </div>
        </div>

        {/* Alerts Card */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={15} color="#f59e0b" />Alerts & Notifications
            </span>
          </div>
          <div style={{ padding: "10px 0" }}>
            {pharmStats && (pharmStats.lowStockCount > 0 || pharmStats.expiringCount > 0) ? (
              <>
                {pharmStats.lowStockCount > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 18px", borderBottom: "1px solid #f8fafc" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AlertTriangle size={14} color="#f59e0b" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>Low Stock Alert</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{pharmStats.lowStockCount} item{pharmStats.lowStockCount !== 1 ? "s" : ""} below minimum</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "#fffbeb", color: "#f59e0b", fontWeight: 700, border: "1px solid #fde68a" }}>
                      {pharmStats.lowStockCount}
                    </span>
                  </div>
                )}
                {pharmStats.expiringCount > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 18px", borderBottom: "1px solid #f8fafc" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Clock size={14} color="#ef4444" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>Expiring Soon</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{pharmStats.expiringCount} item{pharmStats.expiringCount !== 1 ? "s" : ""} within 30 days</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "#fff5f5", color: "#ef4444", fontWeight: 700, border: "1px solid #fecaca" }}>
                      {pharmStats.expiringCount}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No alerts at this time</div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Departments Section */}
      {subDepts.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Sub-Departments</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{subDepts.length} unit{subDepts.length !== 1 ? "s" : ""} — click to view dashboard</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
            {subDepts.filter((s: any) => s.isActive).map((sd: any) => {
              const m = getSubDeptMeta(sd.type);
              const DI = m.Icon;
              return (
                <div
                  key={sd.id}
                  onClick={() => onOpenSubDept(sd.id)}
                  style={{
                    background: "#fff", borderRadius: 14, border: `1px solid ${m.borderColor}`,
                    padding: 18, cursor: "pointer", transition: "all .2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.04)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: m.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <DI size={18} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sd.name}</div>
                      <div style={{ fontSize: 10, color: m.accent, fontWeight: 600 }}>{sd.type?.replace(/_/g, " ")}</div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ background: m.lightBg, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: m.accent }}>{sd._count?.procedures || 0}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 500 }}>Procedures</div>
                    </div>
                    <div style={{ background: m.lightBg, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: m.accent }}>{sd._count?.procedureRecords || 0}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 500 }}>Records</div>
                    </div>
                  </div>
                  {sd.hodStaffName && (
                    <div style={{ marginTop: 10, fontSize: 10, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={12} color="#94a3b8" /> HOD: {sd.hodStaffName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── SUB-DEPARTMENTS TAB (Card-based) ─── */
function SubDeptsTab({ onOpenSubDept }: { onOpenSubDept: (id: string) => void }) {
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

  const toggleActive = async (e: React.MouseEvent, sd: any) => {
    e.stopPropagation();
    setToggling(sd.id);
    await fetch("/api/parentdept/subdepartments", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sd.id, isActive: !sd.isActive }),
    });
    setToggling(null);
    load();
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div className="hd-pg-title" style={{ marginBottom: 0 }}>Sub-Departments</div>
          <div style={{ fontSize:11, color: "#94a3b8", marginTop: 2 }}>Click any card to view the sub-department&apos;s live dashboard</div>
        </div>
        <button className="hd-btn-primary" onClick={load} style={{ gap: 6, fontSize:11 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading sub-departments…
        </div>
      ) : subDepts.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
          <Building2 size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <div style={{ fontSize:14, fontWeight: 600 }}>No sub-departments found</div>
          <div style={{ fontSize:11, marginTop: 4 }}>Contact the hospital admin to add sub-departments</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {subDepts.map((sd: any) => {
            const m = getSubDeptMeta(sd.type);
            const DI = m.Icon;
            const isInactive = !sd.isActive;

            return (
              <div
                key={sd.id}
                onClick={() => sd.isActive && onOpenSubDept(sd.id)}
                style={{
                  background: isInactive ? "#fafafa" : "#fff",
                  borderRadius: 16, border: `1.5px solid ${isInactive ? "#e2e8f0" : m.borderColor}`,
                  overflow: "hidden", cursor: isInactive ? "default" : "pointer",
                  transition: "all .2s", boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                  opacity: isInactive ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!isInactive) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.1)"; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.04)"; }}
              >
                {/* Card header gradient strip */}
                <div style={{ height: 4, background: isInactive ? "#e2e8f0" : m.gradient }} />

                <div style={{ padding: "16px 18px" }}>
                  {/* Top row: icon + name + toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isInactive ? "#e2e8f0" : m.gradient,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: isInactive ? "none" : `0 4px 12px ${m.accent}33`,
                    }}>
                      <DI size={20} color={isInactive ? "#94a3b8" : "#fff"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize:14, fontWeight: 700, color: isInactive ? "#94a3b8" : "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sd.name}
                      </div>
                      <div style={{ fontSize:10, color: isInactive ? "#cbd5e1" : m.accent, fontWeight: 600, marginTop: 1 }}>
                        {sd.code ? `${sd.code} · ` : ""}{sd.type?.replace(/_/g, " ")}
                      </div>
                    </div>
                    <button
                      onClick={(e) => toggleActive(e, sd)}
                      disabled={toggling === sd.id}
                      title={sd.isActive ? "Deactivate" : "Activate"}
                      style={{ background: "none", border: "none", cursor: toggling === sd.id ? "not-allowed" : "pointer", color: sd.isActive ? m.accent : "#94a3b8", padding: 4, flexShrink: 0 }}
                    >
                      {toggling === sd.id
                        ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                        : sd.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />
                      }
                    </button>
                  </div>

                  {/* Description */}
                  {sd.description && (
                    <div style={{ fontSize:11, color: "#64748b", marginBottom: 14, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {sd.description}
                    </div>
                  )}

                  {/* Stats grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <div style={{ background: m.lightBg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize:17, fontWeight: 800, color: m.accent }}>{sd._count?.procedures || 0}</div>
                      <div style={{ fontSize:9, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" }}>Procedures</div>
                    </div>
                    <div style={{ background: m.lightBg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize:17, fontWeight: 800, color: m.accent }}>{sd._count?.procedureRecords || 0}</div>
                      <div style={{ fontSize:9, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" }}>Records</div>
                    </div>
                    <div style={{ background: m.lightBg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize:17, fontWeight: 800, color: m.accent }}>{sd._count?.appointments || 0}</div>
                      <div style={{ fontSize:9, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" }}>Referrals</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                    {sd.hodStaffName ? (
                      <div style={{ fontSize:10, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
                        <Users size={12} color="#94a3b8" /> {sd.hodStaffName}
                      </div>
                    ) : (
                      <div style={{ fontSize:10, color: "#cbd5e1" }}>No HOD assigned</div>
                    )}
                    {sd.isActive && (
                      <div style={{ fontSize:10, fontWeight: 600, color: m.accent, display: "flex", alignItems: "center", gap: 4 }}>
                        View Dashboard <ChevronRight size={13} />
                      </div>
                    )}
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

/* ═══════════════════════════════════════════════════════════════════════════════
   SUB-DEPARTMENT DETAIL VIEW — Embedded full dashboard (no login needed)
   ═══════════════════════════════════════════════════════════════════════════════ */
function SubDeptDetailView({ subDeptId, onBack }: { subDeptId: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<"overview" | "queue" | "completed" | "procedures" | "records">("overview");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/parentdept/subdepartments/${subDeptId}/dashboard`, { credentials: "include" }).then(r => r.json());
      if (res.success) { setData(res.data); setError(""); }
      else setError(res.message || "Failed to load");
    } catch { setError("Network error"); }
    setLoading(false);
    setRefreshing(false);
  }, [subDeptId]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Auto-refresh every 30s
  useEffect(() => {
    const iv = setInterval(() => loadDashboard(true), 30000);
    return () => clearInterval(iv);
  }, [loadDashboard]);

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <Loader2 size={24} color="#0E898F" style={{ animation: "spin .7s linear infinite", margin: "0 auto 12px", display: "block" }} />
      <div style={{ fontSize:12, color: "#94a3b8" }}>Loading sub-department dashboard…</div>
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize:13, color: "#ef4444", marginBottom: 12 }}>{error || "Failed to load dashboard"}</div>
      <button onClick={onBack} className="hd-btn-primary">← Back to Sub-Departments</button>
    </div>
  );

  const profile = data.profile;
  const stats = data.stats;
  const m = getSubDeptMeta(profile?.type);
  const DI = m.Icon;

  const sections = [
    { id: "overview", label: "Overview", icon: <Eye size={14} /> },
    { id: "queue", label: `Queue (${stats.pendingQueue})`, icon: <UserCheck size={14} /> },
    { id: "completed", label: `Completed (${data.completedList?.length || 0})`, icon: <Activity size={14} /> },
    { id: "procedures", label: `Procedures (${stats.totalProcedures})`, icon: <ClipboardList size={14} /> },
    { id: "records", label: `Records (${stats.totalRecords})`, icon: <IndianRupee size={14} /> },
  ];

  return (
    <>
      {/* Back button + Header */}
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          cursor: "pointer", color: "#64748b", fontSize:12, fontWeight: 500, marginBottom: 16,
          padding: "6px 0", transition: "color .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = m.accent; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; }}
      >
        <ArrowLeft size={16} /> Back to Sub-Departments
      </button>

      {/* Hero Banner */}
      <div style={{ background: m.gradient, borderRadius: 18, padding: "24px 26px", marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <DI size={26} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize:10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", opacity: .75, marginBottom: 3 }}>{profile.type?.replace(/_/g, " ")} Sub-Department</div>
            <h2 style={{ fontSize:20, fontWeight: 800, marginBottom: 3, lineHeight: 1.2 }}>{profile.name}</h2>
            {profile.description && <p style={{ fontSize:11, opacity: .8, maxWidth: 480, margin: 0 }}>{profile.description}</p>}
          </div>
          <div style={{ flexShrink: 0, display: "flex", gap: 8 }}>
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              style={{
                background: "rgba(255,255,255,.2)", padding: "8px 16px", borderRadius: 10,
                fontSize:11, fontWeight: 600, border: "1px solid rgba(255,255,255,.3)",
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <RefreshCw size={14} style={refreshing ? { animation: "spin .7s linear infinite" } : {}} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        {profile.flow && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
            {profile.flow.split("→").map((step: string, i: number, arr: string[]) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ background: "rgba(255,255,255,.15)", padding: "3px 10px", borderRadius: 8, fontSize:10, fontWeight: 600, whiteSpace: "nowrap" }}>{step.trim()}</span>
                {i < arr.length - 1 && <ChevronRight size={11} color="rgba(255,255,255,.6)" />}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Pending Queue", value: stats.pendingQueue, Icon: UserCheck, color: "#f59e0b", bg: "#fffbeb", gradient: "linear-gradient(135deg,#f59e0b,#d97706)" },
          { label: "Today Referrals", value: stats.todayReferrals, Icon: ClipboardList, color: m.accent, bg: m.lightBg, gradient: m.gradient },
          { label: "Completed Today", value: stats.completedToday, Icon: Activity, color: "#10b981", bg: "#f0fdf4", gradient: "linear-gradient(135deg,#10b981,#059669)" },
          { label: "Active Procedures", value: stats.activeProcedures, Icon: Layers, color: "#6366f1", bg: "#eef2ff", gradient: "linear-gradient(135deg,#6366f1,#4338ca)" },
          { label: "Today Revenue", value: `₹${(stats.todayRevenue || 0).toLocaleString("en-IN")}`, Icon: IndianRupee, color: "#059669", bg: "#f0fdf4", gradient: "linear-gradient(135deg,#10b981,#059669)" },
          { label: "Total Revenue", value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`, Icon: TrendingUp, color: m.accent, bg: m.lightBg, gradient: m.gradient },
        ].map((s, i) => {
          const SI = s.Icon;
          return (
            <div
              key={i}
              style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}20`; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 11, background: s.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SI size={20} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id as any)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 10, border: "1.5px solid",
              borderColor: activeSection === s.id ? m.accent : "#e2e8f0",
              background: activeSection === s.id ? m.lightBg : "#fff",
              color: activeSection === s.id ? m.accent : "#64748b",
              fontSize:11, fontWeight: 600, cursor: "pointer", transition: "all .15s",
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === "overview" && <SubDeptOverview data={data} meta={m} />}
      {activeSection === "queue" && <SubDeptQueue queue={data.queue} meta={m} />}
      {activeSection === "completed" && <SubDeptCompleted list={data.completedList} meta={m} />}
      {activeSection === "procedures" && <SubDeptProcedures procedures={data.procedures} meta={m} />}
      {activeSection === "records" && <SubDeptRecords records={data.recentRecords} stats={data.stats} meta={m} />}
    </>
  );
}

/* ─── SubDept Overview Section ─── */
function SubDeptOverview({ data, meta }: { data: any; meta: DeptMeta }) {
  const trend = data.dailyTrend || [];
  const maxCount = Math.max(...trend.map((d: any) => d.count), 1);
  const profile = data.profile;

  return (
    <>
      {/* Daily Trend Chart */}
      {trend.length > 0 && (
        <div className="hd-card" style={{ marginBottom: 18 }}>
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">14-Day Activity Trend</div>
              <div className="hd-card-sub">Procedure records per day</div>
            </div>
          </div>
          <div className="hd-card-body">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
              {trend.map((d: any, i: number) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize:9, fontWeight: 700, color: "#1e293b" }}>{d.count || ""}</div>
                  <div
                    style={{
                      width: "100%", minHeight: 4, borderRadius: "4px 4px 0 0",
                      background: d.count > 0 ? meta.gradient : "#f1f5f9",
                      height: `${Math.max((d.count / maxCount) * 100, 4)}%`,
                      transition: "height .3s",
                    }}
                    title={`${d.label}: ${d.count} records, ₹${d.revenue.toLocaleString("en-IN")}`}
                  />
                  <div style={{ fontSize:9, color: "#94a3b8", whiteSpace: "nowrap" }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Department Info */}
      <div className="hd-card" style={{ marginBottom: 18 }}>
        <div className="hd-card-head">
          <div>
            <div className="hd-card-title">Department Details</div>
            <div className="hd-card-sub">Sub-department profile information</div>
          </div>
        </div>
        <div className="hd-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            <InfoRow label="Name" value={profile.name} />
            <InfoRow label="Code" value={profile.code} />
            <InfoRow label="Type" value={profile.type?.replace(/_/g, " ")} />
            <InfoRow label="Status" value={profile.isActive ? "Active" : "Inactive"} valueColor={profile.isActive ? "#10b981" : "#ef4444"} />
            <InfoRow label="HOD" value={profile.hodStaffName} />
            <InfoRow label="Contact" value={profile.hodStaffEmail || profile.hodStaffPhone} />
          </div>
        </div>
      </div>

      {/* Recent Records Quick View */}
      {data.recentRecords?.length > 0 && (
        <div className="hd-card">
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">Recent Procedure Records</div>
              <div className="hd-card-sub">Last {Math.min(data.recentRecords.length, 10)} records</div>
            </div>
          </div>
          <div className="hd-card-body" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Patient", "Procedure", "Amount", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentRecords.slice(0, 10).map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontSize:11, fontWeight: 600, color: "#1e293b" }}>{r.patientName}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>{r.patientId}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontSize:11, color: "#1e293b" }}>{r.procedureName}</div>
                      <div style={{ fontSize:10, color: meta.accent }}>{r.procedureType}</div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize:12, fontWeight: 700, color: "#059669" }}>₹{(r.amount || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize:10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: r.status === "COMPLETED" ? "#d1fae5" : "#fef3c7", color: r.status === "COMPLETED" ? "#059669" : "#92400e" }}>
                        {r.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize:10, color: "#64748b" }}>
                      {new Date(r.performedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
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

/* ─── SubDept Queue Section ─── */
function SubDeptQueue({ queue, meta }: { queue: any[]; meta: DeptMeta }) {
  if (!queue || queue.length === 0) return (
    <div className="hd-card">
      <div className="hd-card-body" style={{ padding: 40, textAlign: "center" }}>
        <UserCheck size={32} color="#94a3b8" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
        <div style={{ fontSize:13, fontWeight: 600, color: "#94a3b8" }}>No pending referrals</div>
        <div style={{ fontSize:11, color: "#cbd5e1", marginTop: 4 }}>All referred patients have been attended to</div>
      </div>
    </div>
  );

  return (
    <div className="hd-card">
      <div className="hd-card-head">
        <div>
          <div className="hd-card-title">Pending Referral Queue</div>
          <div className="hd-card-sub">{queue.length} patient{queue.length !== 1 ? "s" : ""} awaiting procedure</div>
        </div>
      </div>
      <div className="hd-card-body" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["#", "Patient", "Referred By", "Date", "Referral Note", "Fee"].map(h => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queue.map((q: any, i: number) => (
              <tr key={q.id} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                <td style={{ padding: "10px 14px", fontSize:11, fontWeight: 700, color: meta.accent }}>{q.tokenNumber || i + 1}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{q.patient?.name}</div>
                  <div style={{ fontSize:10, color: "#94a3b8" }}>{q.patient?.patientId} · {q.patient?.gender}</div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontSize:11, color: "#1e293b" }}>{q.doctor?.name}</div>
                  <div style={{ fontSize:10, color: "#94a3b8" }}>{q.doctor?.specialization}</div>
                </td>
                <td style={{ padding: "10px 14px", fontSize:10, color: "#64748b" }}>
                  {q.appointmentDate ? new Date(q.appointmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {q.subDeptNote ? (
                    <div style={{ fontSize:10, color: "#047857", background: "#f0fdf4", padding: "4px 8px", borderRadius: 6, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.subDeptNote}
                    </div>
                  ) : <span style={{ color: "#cbd5e1", fontSize:10 }}>—</span>}
                </td>
                <td style={{ padding: "10px 14px", fontSize:11, fontWeight: 600, color: "#1e293b" }}>₹{q.consultationFee || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── SubDept Completed Section ─── */
function SubDeptCompleted({ list, meta }: { list: any[]; meta: DeptMeta }) {
  if (!list || list.length === 0) return (
    <div className="hd-card">
      <div className="hd-card-body" style={{ padding: 40, textAlign: "center" }}>
        <Activity size={32} color="#94a3b8" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
        <div style={{ fontSize:13, fontWeight: 600, color: "#94a3b8" }}>No completed referrals yet</div>
      </div>
    </div>
  );

  return (
    <div className="hd-card">
      <div className="hd-card-head">
        <div>
          <div className="hd-card-title">Completed Referrals</div>
          <div className="hd-card-sub">{list.length} referral{list.length !== 1 ? "s" : ""} with procedure records</div>
        </div>
      </div>
      <div className="hd-card-body" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Patient", "Doctor", "Procedure", "Amount", "Performed By", "Date"].map(h => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((c: any) => {
              const pr = c.procedureRecords?.[0];
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize:11, fontWeight: 600, color: "#1e293b" }}>{c.patient?.name}</div>
                    <div style={{ fontSize:10, color: "#94a3b8" }}>{c.patient?.patientId}</div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize:11, color: "#64748b" }}>{c.doctor?.name || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize:11, color: "#1e293b" }}>{pr?.procedureName || "—"}</div>
                    <div style={{ fontSize:10, color: meta.accent }}>{pr?.procedureType}</div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize:12, fontWeight: 700, color: "#059669" }}>₹{(pr?.amount || 0).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "10px 14px", fontSize:11, color: "#64748b" }}>{pr?.performedBy || "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize:10, color: "#64748b" }}>
                    {pr?.performedAt ? new Date(pr.performedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── SubDept Procedures Section ─── */
function SubDeptProcedures({ procedures, meta }: { procedures: any[]; meta: DeptMeta }) {
  const PROC_TYPE_COLOR: Record<string, string> = {
    DIAGNOSTIC: "#0E898F", TREATMENT: "#10b981", CONSULTATION: "#8b5cf6",
    SURGERY: "#ef4444", THERAPY: "#f97316", MEDICATION: "#06b6d4", OTHER: "#94a3b8",
  };

  if (!procedures || procedures.length === 0) return (
    <div className="hd-card">
      <div className="hd-card-body" style={{ padding: 40, textAlign: "center" }}>
        <ClipboardList size={32} color="#94a3b8" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
        <div style={{ fontSize:13, fontWeight: 600, color: "#94a3b8" }}>No procedures configured</div>
      </div>
    </div>
  );

  const active = procedures.filter((p: any) => p.isActive);
  const inactive = procedures.filter((p: any) => !p.isActive);

  return (
    <div className="hd-card">
      <div className="hd-card-head">
        <div>
          <div className="hd-card-title">Procedure Catalog</div>
          <div className="hd-card-sub">{active.length} active, {inactive.length} inactive</div>
        </div>
      </div>
      <div className="hd-card-body" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["#", "Name", "Type", "Fee", "Duration", "Status"].map(h => (
                <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {procedures.map((p: any, i: number) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc", opacity: p.isActive ? 1 : 0.55 }}>
                <td style={{ padding: "10px 14px", fontSize:11, fontWeight: 600, color: "#94a3b8" }}>{i + 1}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{p.name}</div>
                  {p.description && <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>{p.description}</div>}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize:10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${PROC_TYPE_COLOR[p.type] || "#94a3b8"}15`, color: PROC_TYPE_COLOR[p.type] || "#94a3b8" }}>
                    {p.type}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", fontSize:12, fontWeight: 700, color: "#1e293b" }}>
                  {p.fee != null ? `₹${p.fee.toLocaleString("en-IN")}` : "—"}
                </td>
                <td style={{ padding: "10px 14px", fontSize:11, color: "#64748b" }}>
                  {p.duration ? `${p.duration} min` : "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize:10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: p.isActive ? "#d1fae5" : "#fee2e2", color: p.isActive ? "#059669" : "#dc2626" }}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── SubDept Records Section ─── */
function SubDeptRecords({ records, stats, meta }: { records: any[]; stats: any; meta: DeptMeta }) {
  return (
    <>
      {/* Mini stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Today Records", value: stats.todayRecords, color: meta.accent },
          { label: "Today Revenue", value: `₹${(stats.todayRevenue || 0).toLocaleString("en-IN")}`, color: "#059669" },
          { label: "Total Records", value: stats.totalRecords, color: "#6366f1" },
          { label: "Total Revenue", value: `₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`, color: "#0E898F" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ fontSize:19, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Records table */}
      {(!records || records.length === 0) ? (
        <div className="hd-card">
          <div className="hd-card-body" style={{ padding: 40, textAlign: "center" }}>
            <IndianRupee size={32} color="#94a3b8" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div style={{ fontSize:13, fontWeight: 600, color: "#94a3b8" }}>No procedure records found</div>
          </div>
        </div>
      ) : (
        <div className="hd-card">
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title">Recent Procedure Records</div>
              <div className="hd-card-sub">Showing latest {records.length} records</div>
            </div>
          </div>
          <div className="hd-card-body" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Patient", "Procedure", "Amount", "Performed By", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontSize:11, fontWeight: 600, color: "#1e293b" }}>{r.patientName}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>{r.patientId}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontSize:11, color: "#1e293b" }}>{r.procedureName}</div>
                      <div style={{ fontSize:10, color: meta.accent }}>{r.procedureType}</div>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize:12, fontWeight: 700, color: "#059669" }}>₹{(r.amount || 0).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "10px 14px", fontSize:11, color: "#64748b" }}>{r.performedBy}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize:10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: r.status === "COMPLETED" ? "#d1fae5" : "#fef3c7", color: r.status === "COMPLETED" ? "#059669" : "#92400e" }}>
                        {r.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize:10, color: "#64748b" }}>
                      {new Date(r.performedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
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

/* ─── HELPERS ─── */
function InfoRow({ label, value, valueColor }: { label: string; value?: string | null; valueColor?: string }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight: 600, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize:12, fontWeight: 600, color: valueColor || "#1e293b" }}>{value || "—"}</div>
    </div>
  );
}
