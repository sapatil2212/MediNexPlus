"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2, CalendarDays, Users, Activity,
  RefreshCw, Loader2, ChevronRight, UserCheck, IndianRupee,
  Power, ClipboardList, CheckCircle2, Info,
  MapPin, Phone, Mail, Pencil, Trash2, Eye, Download,
  ChevronUp, ChevronDown, X, ArrowLeft, Stethoscope, User,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";

/* ─── Config ─── */
export interface DeptDashCfg {
  accent: string;       // e.g. "#2563eb"
  accent2: string;      // darker shade
  accentLight: string;  // light bg
  accentBorder: string; // border colour
  label: string;        // "Administrative" | "Support" | "Diagnostic"
  basePath: string;     // e.g. "/administrative/dashboard"
  icon?: React.ReactNode;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  SCHEDULED:   { label: "Scheduled",   cls: "dd-badge-blue"  },
  CONFIRMED:   { label: "Confirmed",   cls: "dd-badge-teal"  },
  COMPLETED:   { label: "Completed",   cls: "dd-badge-green" },
  CANCELLED:   { label: "Cancelled",   cls: "dd-badge-red"   },
  NO_SHOW:     { label: "No Show",     cls: "dd-badge-amber" },
  RESCHEDULED: { label: "Rescheduled", cls: "dd-badge-gray"  },
};

const PIE_COLORS = ["#2563eb","#059669","#0E898F","#8b5cf6","#6366f1","#10b981"];

const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtTime = (t?: string) => t ? t.slice(0, 5) : "—";

type Tab = "overview" | "subdepts" | "appointments" | "queue" | "dept-info";

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
export default function DeptDashboardPage({ cfg }: { cfg: DeptDashCfg }) {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>}>
      <DeptDashboard cfg={cfg} />
    </Suspense>
  );
}

function DeptDashboard({ cfg }: { cfg: DeptDashCfg }) {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const tab  = (searchParams.get("tab") as Tab) || "overview";
  const sdId = searchParams.get("subdept");
  const [deptProfile, setDeptProfile] = useState<any>(null);

  useEffect(() => {
    fetch("/api/parentdept/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setDeptProfile(d.data); })
      .catch(() => {});
  }, []);

  const go = (t: Tab) => router.push(`${cfg.basePath}${t !== "overview" ? `?tab=${t}` : ""}`, { scroll: false });

  if (tab === "subdepts" && sdId) {
    return <SubDeptDetail subDeptId={sdId} cfg={cfg} onBack={() => router.push(`${cfg.basePath}?tab=subdepts`, { scroll: false })} />;
  }

  return (
    <>
      {tab === "overview"     && <OverviewTab     deptProfile={deptProfile} cfg={cfg} onNavTo={go} />}
      {tab === "subdepts"     && !sdId && <SubDeptsTab cfg={cfg} onView={id => router.push(`${cfg.basePath}?tab=subdepts&subdept=${id}`, { scroll: false })} />}
      {tab === "appointments" && <AppointmentsTab deptProfile={deptProfile} cfg={cfg} />}
      {tab === "queue"        && <QueueTab        deptProfile={deptProfile} cfg={cfg} />}
      {tab === "dept-info"    && <DeptInfoTab     deptProfile={deptProfile} cfg={cfg} />}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   OVERVIEW TAB
═══════════════════════════════════════════════════════════ */
function OverviewTab({ deptProfile, cfg, onNavTo }: { deptProfile: any; cfg: DeptDashCfg; onNavTo: (t: Tab) => void }) {
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [appts, setAppts]       = useState<any[]>([]);
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
      const [sdRes, apRes] = await Promise.all([
        fetch("/api/parentdept/subdepartments", { credentials: "include" }).then(r => r.json()),
        fetch(`/api/appointments?limit=50&departmentId=${id}&sortBy=appointmentDate&sortOrder=desc`, { credentials: "include" }).then(r => r.json()),
      ]);
      if (sdRes.success) setSubDepts(sdRes.data || []);
      if (apRes.success) setAppts(apRes.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (deptId) load(deptId); }, [deptId, load]);

  const todayStr      = new Date().toISOString().slice(0, 10);
  const todayAppts    = appts.filter(a => (a.appointmentDate || "").slice(0, 10) === todayStr);
  const todayComplete = todayAppts.filter(a => a.status === "COMPLETED").length;
  const todayRevenue  = todayAppts.reduce((s, a) => s + (a.consultationFee || 0), 0);
  const activeSD      = subDepts.filter(s => s.isActive).length;

  const statusCount: Record<string, number> = {};
  for (const a of appts) { statusCount[a.status] = (statusCount[a.status] || 0) + 1; }

  const pieData = subDepts.filter(s => (s._count?.appointments || 0) > 0)
    .map(s => ({ name: s.name, value: s._count?.appointments || 0 }));
  if (pieData.length === 0) pieData.push({ name: "No data", value: 1 });

  const STAT_CARDS = [
    { label: "Sub-Departments", value: loading ? "—" : activeSD, Icon: Building2, color: cfg.accent, bg: cfg.accentLight, badge: { text: "ACTIVE", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" } },
    { label: "Today's Appointments", value: loading ? "—" : todayAppts.length, Icon: CalendarDays, color: "#0891b2", bg: "#ecfeff", badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" } },
    { label: "Completed Today", value: loading ? "—" : todayComplete, Icon: CheckCircle2, color: "#10b981", bg: "#f0fdf4", badge: { text: "DONE", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" } },
    { label: "Revenue Today", value: loading ? "—" : `₹${todayRevenue.toLocaleString("en-IN")}`, Icon: IndianRupee, color: "#16a34a", bg: "#f0fdf4", badge: { text: "TODAY", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" } },
    { label: "Total Appointments", value: loading ? "—" : appts.length, Icon: ClipboardList, color: "#059669", bg: "#f0fdf4" },
  ];

  return (
    <>
      {/* Header: title + live indicator + refresh */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>
            {deptProfile?.name || `${cfg.label} Department`} Overview
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 3px #dcfce7", flexShrink: 0 }} />
            Live &middot; Updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <button
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}
          onClick={() => deptId && load(deptId)}
        >
          <RefreshCw size={13} className={loading ? "opd2-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Grid - 5 Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        {STAT_CARDS.map((s, i) => {
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

      {/* Charts Row */}
      {loading ? (
        <div style={{ height: 280, background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: "#94a3b8", fontSize: 12, gap: 8 }}>
          <Loader2 size={16} className="opd2-spin" />Loading {cfg.label.toLowerCase()} analytics...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 20 }}>
          {/* Status Breakdown Chart */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{cfg.label} Department Activity</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Appointment status distribution</div>
              </div>
            </div>
            <div style={{ width: "100%", height: 220 }}>
              {Object.keys(statusCount).length > 0 ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {Object.entries(statusCount).map(([st, count]) => {
                    const m = STATUS_META[st] || { label: st, cls: "dd-badge-gray" };
                    const pct = Math.round((count / appts.length) * 100);
                    return (
                      <div key={st} style={{ flex: "1 1 110px", background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span className={`dd-badge ${m.cls}`} style={{ fontSize: 10 }}>{m.label}</span>
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>{pct}%</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{count}</div>
                        <div style={{ height: 3, background: "#e2e8f0", borderRadius: 3, marginTop: 8 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: cfg.accent, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 12 }}>No appointment data available</div>
              )}
            </div>
          </div>

          {/* Sub-Dept Distribution */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Sub-Department Distribution</div>
            <div style={{ width: "100%", height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} strokeWidth={0}
                  >
                    {pieData.map((_: any, idx: number) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginTop: 10 }}>
              {pieData.filter(d => d.name !== "No data").slice(0, 6).map((d: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9, color: "#64748b" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    {d.name}
                  </span>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Recent Appointments */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarDays size={15} color={cfg.accent} />Recent Appointments
            </span>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{todayAppts.length} today</span>
          </div>
          <div style={{ padding: "10px 0" }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Loader2 size={16} className="opd2-spin" />Loading...
              </div>
            ) : appts.length > 0 ? (
              appts.slice(0, 5).map((a: any) => {
                const sm = STATUS_META[a.status] || { label: a.status, cls: "dd-badge-gray" };
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 18px", borderBottom: "1px solid #f8fafc" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <User size={14} color={cfg.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{a.patient?.name}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{a.doctor?.name} · {fmtTime(a.timeSlot)}</div>
                    </div>
                    <span className={`dd-badge ${sm.cls}`} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>
                      {sm.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No appointments found today</div>
            )}
            {appts.length > 0 && (
              <div style={{ padding: "10px 18px", fontSize: 11, color: cfg.accent, fontWeight: 600, cursor: "pointer" }} onClick={() => onNavTo("appointments")}>
                View all appointments →
              </div>
            )}
          </div>
        </div>

        {/* Sub-Departments */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={15} color={cfg.accent} />Sub-Departments
            </span>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{activeSD} active</span>
          </div>
          <div style={{ padding: "10px 0" }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Loader2 size={16} className="opd2-spin" />Loading...
              </div>
            ) : subDepts.filter(s => s.isActive).length > 0 ? (
              subDepts.filter(s => s.isActive).slice(0, 5).map((sd: any) => (
                <div key={sd.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 18px", borderBottom: "1px solid #f8fafc", cursor: "pointer" }}
                  onClick={() => onNavTo("subdepts")}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Stethoscope size={14} color={cfg.accent} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{sd.name}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{sd.type?.replace(/_/g, " ")} · {sd._count?.procedures || 0} procedures</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}>{sd._count?.appointments || 0}</div>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: cfg.accent,
                      background: cfg.accentLight,
                      padding: "2px 6px",
                      borderRadius: 4,
                      marginTop: 2,
                      display: "inline-block",
                      border: `1px solid ${cfg.accentBorder}`
                    }}>
                      Referrals
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No sub-departments found</div>
            )}
            {subDepts.filter(s => s.isActive).length > 0 && (
              <div style={{ padding: "10px 18px", fontSize: 11, color: cfg.accent, fontWeight: 600, cursor: "pointer" }} onClick={() => onNavTo("subdepts")}>
                View all sub-departments →
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUB-DEPARTMENTS TAB
═══════════════════════════════════════════════════════════ */
function SubDeptsTab({ cfg, onView }: { cfg: DeptDashCfg; onView: (id: string) => void }) {
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/parentdept/subdepartments", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setSubDepts(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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
        <div className="dd-section-title" style={{ marginBottom: 0 }}>
          <div className="dd-section-dot" />Sub-Departments
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>({subDepts.filter(s => s.isActive).length} active)</span>
        </div>
        <button className="dd-btn-ghost" onClick={load}>
          <RefreshCw size={12} style={loading ? { animation: "dd-spin .7s linear infinite" } : {}} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="dd-empty"><Loader2 size={24} style={{ animation: "dd-spin .7s linear infinite", display: "block", margin: "0 auto 10px" }} /><div>Loading…</div></div>
      ) : subDepts.length === 0 ? (
        <div className="dd-empty"><Building2 size={36} style={{ display: "block", margin: "0 auto 10px", opacity: .25 }} /><div>No sub-departments found</div></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {subDepts.map(sd => {
            const off = !sd.isActive;
            return (
              <div key={sd.id} onClick={() => onView(sd.id)}
                style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${off ? "#e2e8f0" : cfg.accentBorder}`, padding: 0, cursor: "pointer", overflow: "hidden", transition: "border-color .2s" }}>
                <div style={{ height: 4, background: off ? "#e2e8f0" : `linear-gradient(90deg,${cfg.accent},${cfg.accent2})` }} />
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: off ? "#e2e8f0" : cfg.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Stethoscope size={17} color={off ? "#94a3b8" : cfg.accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: off ? "#94a3b8" : "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sd.name}</div>
                      <div style={{ fontSize: 10, color: off ? "#cbd5e1" : cfg.accent, fontWeight: 600 }}>{sd.code ? `${sd.code} · ` : ""}{sd.type?.replace(/_/g, " ")}</div>
                    </div>
                    <button onClick={e => toggle(e, sd)} disabled={toggling === sd.id}
                      style={{ background: "none", border: "none", cursor: "pointer", color: sd.isActive ? cfg.accent : "#94a3b8", padding: 4 }}>
                      {toggling === sd.id ? <Loader2 size={16} style={{ animation: "dd-spin .7s linear infinite" }} /> : <Power size={16} style={{ opacity: sd.isActive ? 1 : 0.4 }} />}
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {[
                      { v: sd._count?.procedures || 0,      l: "Procedures" },
                      { v: sd._count?.procedureRecords || 0, l: "Records" },
                      { v: sd._count?.appointments || 0,    l: "Referrals" },
                    ].map((s, i) => (
                      <div key={i} style={{ background: off ? "#f8fafc" : cfg.accentLight, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: off ? "#cbd5e1" : cfg.accent }}>{s.v}</div>
                        <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", marginTop: 2 }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  {sd.hodStaffName && (
                    <div style={{ marginTop: 10, fontSize: 10, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                      <UserCheck size={10} color="#94a3b8" /> {sd.hodStaffName}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUB-DEPT DETAIL
═══════════════════════════════════════════════════════════ */
function SubDeptDetail({ subDeptId, cfg, onBack }: { subDeptId: string; cfg: DeptDashCfg; onBack: () => void }) {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<"overview"|"procedures"|"records">("overview");

  useEffect(() => {
    fetch(`/api/config/subdepartments/${subDeptId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [subDeptId]);

  if (loading) return <div className="dd-empty"><Loader2 size={24} style={{ animation: "dd-spin .7s linear infinite", display: "block", margin: "0 auto 10px" }} /><div>Loading…</div></div>;
  if (!data) return <div className="dd-empty"><div>Sub-department not found</div></div>;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} className="dd-btn-ghost" style={{ padding: "7px 10px" }}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{data.name}</div>
        <span className={`dd-badge ${data.isActive ? "dd-badge-green" : "dd-badge-gray"}`}>{data.isActive ? "Active" : "Inactive"}</span>
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Code", v: data.code },
          { l: "Type", v: data.type?.replace(/_/g, " ") },
          { l: "HOD", v: data.hodStaffName },
          { l: "Login Email", v: data.loginEmail },
        ].map((r, i) => r.v ? (
          <div key={i} className="dd-card" style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{r.l}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{r.v}</div>
          </div>
        ) : null)}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["overview","procedures","records"] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${section === s ? cfg.accent : "#e2e8f0"}`, background: section === s ? cfg.accentLight : "#fff", color: section === s ? cfg.accent2 : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {section === "overview" && (
        <div className="dd-card">
          <div className="dd-card-head"><div className="dd-card-title">Description</div></div>
          <div className="dd-card-body" style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
            {data.description || "No description provided."}
          </div>
        </div>
      )}

      {section === "procedures" && (
        <div className="dd-card">
          <div className="dd-tbl-wrap">
            <table className="dd-tbl">
              <thead><tr><th>Name</th><th>Type</th><th>Fee</th><th>Duration</th><th>Status</th></tr></thead>
              <tbody>
                {(data.procedures || []).length === 0
                  ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 28, color: "#94a3b8" }}>No procedures</td></tr>
                  : (data.procedures || []).map((p: any) => (
                    <tr key={p.id}>
                      <td className="dd-td-name">{p.name}</td>
                      <td style={{ color: "#64748b" }}>{p.type?.replace(/_/g, " ")}</td>
                      <td style={{ fontWeight: 600 }}>₹{p.fee}</td>
                      <td style={{ color: "#64748b" }}>{p.duration} min</td>
                      <td><span className={`dd-badge ${p.isActive ? "dd-badge-green" : "dd-badge-gray"}`}>{p.isActive ? "Active" : "Inactive"}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "records" && (
        <div className="dd-card">
          <div className="dd-tbl-wrap">
            <table className="dd-tbl">
              <thead><tr><th>Patient</th><th>Procedure</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {(data.records || []).length === 0
                  ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 28, color: "#94a3b8" }}>No records</td></tr>
                  : (data.records || []).map((r: any) => (
                    <tr key={r.id}>
                      <td className="dd-td-name">{r.patient?.name || "—"}</td>
                      <td style={{ color: "#64748b" }}>{r.procedure?.name || "—"}</td>
                      <td style={{ fontWeight: 600 }}>₹{r.amount}</td>
                      <td><span className={`dd-badge ${r.status === "COMPLETED" ? "dd-badge-green" : "dd-badge-amber"}`}>{r.status}</span></td>
                      <td style={{ color: "#94a3b8" }}>{r.performedAt ? fmt(r.performedAt) : "—"}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   APPOINTMENTS TAB
═══════════════════════════════════════════════════════════ */
function AppointmentsTab({ deptProfile, cfg }: { deptProfile: any; cfg: DeptDashCfg }) {
  const [appts, setAppts]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deptId, setDeptId]       = useState<string | null>(deptProfile?.id || null);
  const [filter, setFilter]       = useState("ALL");
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState("appointmentDate");
  const [sortDir, setSortDir]     = useState<"asc"|"desc">("desc");
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [viewAppt, setViewAppt]   = useState<any>(null);
  const [editAppt, setEditAppt]   = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<Set<string>>(new Set());

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
      if (sortBy === "patient") { va = a.patient?.name || ""; vb = b.patient?.name || ""; }
      else if (sortBy === "doctor") { va = a.doctor?.name || ""; vb = b.doctor?.name || ""; }
      else if (sortBy === "status") { va = a.status || ""; vb = b.status || ""; }
      else if (sortBy === "fee")    { va = a.consultationFee || 0; vb = b.consultationFee || 0; }
      else { va = a.appointmentDate || ""; vb = b.appointmentDate || ""; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return list;
  }, [appts, filter, search, dateFrom, dateTo, sortBy, sortDir]);

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };
  const SortIco = ({ col }: { col: string }) => sortBy !== col
    ? <span style={{ opacity: .3 }}><ChevronUp size={10} /></span>
    : sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />;

  const allSel   = filtered.length > 0 && filtered.every(a => selected.has(a.id));
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(filtered.map(a => a.id)));
  const toggleOne = (id: string) => setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const exportCSV = (rows: any[]) => {
    const hdr  = "Token,Patient,Patient ID,Doctor,Date,Time,Type,Status,Fee\n";
    const body = rows.map(a => [
      a.tokenNumber || "", `"${a.patient?.name || ""}"`, a.patient?.patientId || "",
      `"${a.doctor?.name || ""}"`, a.appointmentDate ? fmt(a.appointmentDate) : "",
      fmtTime(a.timeSlot), a.type || "", a.status || "", a.consultationFee || 0,
    ].join(",")).join("\n");
    const blob = new Blob([hdr + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url; el.download = `appointments-${new Date().toISOString().slice(0,10)}.csv`; el.click();
    URL.revokeObjectURL(url);
  };

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

  const bulkCancel = async () => { await Promise.all([...selected].map(id => cancelOne(id))); setSelected(new Set()); };

  const STAT_CARDS = [
    { label: "Total",               value: counts.total,     Icon: CalendarDays,  bg: cfg.accentLight, color: cfg.accent },
    { label: "Scheduled",           value: counts.scheduled, Icon: ClipboardList, bg: "#eff6ff",       color: "#3b82f6" },
    { label: "Completed",           value: counts.completed, Icon: CheckCircle2,  bg: "#f0fdf4",       color: "#16a34a" },
    { label: "Cancelled / No-Show", value: counts.cancelled, Icon: X,             bg: "#fef2f2",       color: "#ef4444" },
  ];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div className="dd-section-title" style={{ marginBottom: 0 }}>
          <div className="dd-section-dot" />Appointments
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {selected.size > 0 && (
            <>
              <button className="dd-btn-ghost" style={{ color: "#ef4444", border: "1px solid #fecaca" }} onClick={bulkCancel}>
                <Trash2 size={12} /> Cancel {selected.size}
              </button>
              <button className="dd-btn-ghost" onClick={() => exportCSV(filtered.filter(a => selected.has(a.id)))}>
                <Download size={12} /> Export {selected.size}
              </button>
            </>
          )}
          <button className="dd-btn-ghost" onClick={() => exportCSV(filtered)}><Download size={12} /> Export CSV</button>
          <button className="dd-btn-ghost" onClick={() => deptId && load(deptId)}>
            <RefreshCw size={12} style={loading ? { animation: "dd-spin .7s linear infinite" } : {}} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {STAT_CARDS.map((s, i) => (
          <div
            key={i}
            style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12, transition: "box-shadow .2s, transform .15s", cursor: "default" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}22`; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: `linear-gradient(135deg,${s.color},${s.color}cc)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.Icon size={20} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 2 }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {["ALL","SCHEDULED","CONFIRMED","COMPLETED","CANCELLED"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "5px 11px", borderRadius: 7, border: `1.5px solid ${filter===f ? cfg.accent : "#e2e8f0"}`, background: filter===f ? cfg.accentLight : "#fff", color: filter===f ? cfg.accent2 : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            {f === "ALL" ? `All (${appts.length})` : `${f[0]+f.slice(1).toLowerCase()} (${appts.filter(a => a.status===f).length})`}
          </button>
        ))}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Patient / doctor / ID…"
            style={{ padding: "7px 12px 7px 28px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", width: 190 }}
            onFocus={e => (e.target.style.borderColor = cfg.accent)} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
          <Users size={11} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none" }}
          onFocus={e => (e.target.style.borderColor = cfg.accent)} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
        <span style={{ fontSize: 11, color: "#94a3b8" }}>–</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none" }}
          onFocus={e => (e.target.style.borderColor = cfg.accent)} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
        {(dateFrom || dateTo) && (
          <button className="dd-btn-ghost" style={{ padding: "5px 7px" }} onClick={() => { setDateFrom(""); setDateTo(""); }}><X size={11} /></button>
        )}
      </div>

      <div className="dd-card">
        <div className="dd-tbl-wrap">
          <table className="dd-tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={allSel} onChange={toggleAll} style={{ accentColor: cfg.accent, width: 14, height: 14 }} /></th>
                <th style={{ cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => toggleSort("appointmentDate")}>Date &amp; Time <SortIco col="appointmentDate" /></th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("patient")}>Patient <SortIco col="patient" /></th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("doctor")}>Doctor <SortIco col="doctor" /></th>
                <th>Type</th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("status")}>Status <SortIco col="status" /></th>
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("fee")}>Fee <SortIco col="fee" /></th>
                <th>#Token</th>
                <th style={{ width: 96, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                  <Loader2 size={16} style={{ animation: "dd-spin .7s linear infinite", verticalAlign: "middle", marginRight: 6 }} />Loading…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>No appointments found</td></tr>
              ) : filtered.map(a => {
                const sm = STATUS_META[a.status] || { label: a.status, cls: "dd-badge-gray" };
                return (
                  <tr key={a.id} style={{ background: selected.has(a.id) ? cfg.accentLight : undefined }}>
                    <td><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleOne(a.id)} style={{ accentColor: cfg.accent, width: 14, height: 14 }} /></td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{a.appointmentDate ? fmt(a.appointmentDate) : "—"}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtTime(a.timeSlot)}</div>
                    </td>
                    <td><div className="dd-td-name">{a.patient?.name || "—"}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{a.patient?.patientId}</div></td>
                    <td style={{ fontSize: 12, color: "#475569" }}>{a.doctor?.name || "—"}</td>
                    <td><span className="dd-badge dd-badge-gray" style={{ fontSize: 10 }}>{a.type?.replace(/_/g," ") || "—"}</span></td>
                    <td><span className={`dd-badge ${sm.cls}`}>{sm.label}</span></td>
                    <td style={{ fontWeight: 600, color: "#1e293b" }}>{a.consultationFee ? `₹${a.consultationFee}` : "—"}</td>
                    <td style={{ color: "#94a3b8", fontSize: 12 }}>#{a.tokenNumber || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                        <button title="View" onClick={() => setViewAppt(a)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px 5px" }}><Eye size={14} /></button>
                        <button title="Edit" onClick={() => { setEditAppt(a); setEditStatus(a.status); }} style={{ background: "none", border: "none", cursor: "pointer", color: cfg.accent, padding: "4px 5px" }}><Pencil size={14} /></button>
                        <button title="Cancel" onClick={() => cancelOne(a.id)} disabled={deleting.has(a.id) || a.status === "CANCELLED"}
                          style={{ background: "none", border: "none", cursor: a.status==="CANCELLED"?"default":"pointer", color: deleting.has(a.id)?"#94a3b8":"#ef4444", padding: "4px 5px", opacity: a.status==="CANCELLED"?0.3:1 }}>
                          {deleting.has(a.id) ? <Loader2 size={14} style={{ animation: "dd-spin .7s linear infinite" }} /> : <Trash2 size={14} />}
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
          <div style={{ padding: "9px 18px", borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
            <span>Showing {filtered.length} of {appts.length}</span>
            {selected.size > 0 && <span style={{ color: cfg.accent, fontWeight: 600 }}>{selected.size} selected</span>}
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewAppt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewAppt(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Appointment Details</div>
              <button onClick={() => setViewAppt(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
            </div>
            {([
              ["Patient", viewAppt.patient?.name], ["Patient ID", viewAppt.patient?.patientId],
              ["Doctor", viewAppt.doctor?.name], ["Date", viewAppt.appointmentDate ? fmt(viewAppt.appointmentDate) : null],
              ["Time", fmtTime(viewAppt.timeSlot)], ["Token", viewAppt.tokenNumber ? `#${viewAppt.tokenNumber}` : null],
              ["Type", viewAppt.type?.replace(/_/g," ")], ["Status", viewAppt.status],
              ["Fee", viewAppt.consultationFee ? `₹${viewAppt.consultationFee}` : null], ["Notes", viewAppt.notes],
            ] as [string, string | null | undefined][]).map(([k, v]) => v ? (
              <div key={k} style={{ display: "flex", padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ width: 100, fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{v}</div>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editAppt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setEditAppt(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Change Status</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 18 }}>{editAppt.patient?.name} — {editAppt.appointmentDate ? fmt(editAppt.appointmentDate) : "—"}</div>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", marginBottom: 18, background: "#fff", cursor: "pointer" }}>
              {["SCHEDULED","CONFIRMED","COMPLETED","CANCELLED","NO_SHOW","RESCHEDULED"].map(s => (
                <option key={s} value={s}>{s[0]+s.slice(1).toLowerCase().replace(/_/g," ")}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="dd-btn-ghost" onClick={() => setEditAppt(null)}>Cancel</button>
              <button onClick={saveStatus} disabled={saving}
                style={{ padding: "8px 20px", borderRadius: 9, background: cfg.accent, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   QUEUE TAB
═══════════════════════════════════════════════════════════ */
function QueueTab({ deptProfile, cfg }: { deptProfile: any; cfg: DeptDashCfg }) {
  const [all, setAll]           = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deptId, setDeptId]     = useState<string | null>(deptProfile?.id || null);
  const [search, setSearch]     = useState("");
  const [view, setView]         = useState<"pending"|"completed"|"all">("pending");
  const [updating, setUpdating] = useState<Record<string, string>>({});

  useEffect(() => {
    if (deptProfile?.id) { setDeptId(deptProfile.id); return; }
    fetch("/api/parentdept/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.id) setDeptId(d.data.id); })
      .catch(() => {});
  }, [deptProfile?.id]);

  const load = useCallback((id: string) => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/appointments?limit=200&departmentId=${id}&date=${today}&sortBy=tokenNumber&sortOrder=asc`, { credentials: "include" })
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

  const waiting   = all.filter(a => a.status === "SCHEDULED").length;
  const confirmed = all.filter(a => a.status === "CONFIRMED").length;
  const completed = all.filter(a => a.status === "COMPLETED").length;
  const noShow    = all.filter(a => a.status === "NO_SHOW").length;

  const filtered = useMemo(() => {
    let list = [...all];
    if (view === "pending")    list = list.filter(a => ["SCHEDULED","CONFIRMED"].includes(a.status));
    else if (view === "completed") list = list.filter(a => ["COMPLETED","NO_SHOW","CANCELLED"].includes(a.status));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.patient?.name || "").toLowerCase().includes(q) ||
        (a.doctor?.name  || "").toLowerCase().includes(q) ||
        String(a.tokenNumber || "").includes(q)
      );
    }
    return list;
  }, [all, view, search]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const STAT_CARDS = [
    { label: "Waiting",   value: waiting,   gradient: `linear-gradient(135deg,${cfg.accent},${cfg.accent2})`,      Icon: ClipboardList, color: cfg.accent },
    { label: "Confirmed", value: confirmed, gradient: `linear-gradient(135deg,${cfg.accent},${cfg.accent2})`,      Icon: CheckCircle2,  color: cfg.accent },
    { label: "Completed", value: completed, gradient: "linear-gradient(135deg,#10b981,#059669)",                   Icon: CheckCircle2,  color: "#059669"  },
    { label: "No-Show",   value: noShow,    gradient: "linear-gradient(135deg,#ef4444,#dc2626)",                   Icon: X,             color: "#dc2626"  },
  ];

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="dd-section-title" style={{ marginBottom: 4 }}>
            <div className="dd-section-dot" />Today&apos;s Patient Queue
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", paddingLeft: 14 }}>{today}</div>
        </div>
        <button className="dd-btn-ghost" onClick={() => deptId && load(deptId)}>
          <RefreshCw size={12} style={loading ? { animation: "dd-spin .7s linear infinite" } : {}} /> Refresh
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {STAT_CARDS.map((s, i) => (
          <div
            key={i}
            style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12, transition: "box-shadow .2s, transform .15s", cursor: "default" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}22`; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: s.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.Icon size={20} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1, marginBottom: 2 }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        {(["pending","completed","all"] as const).map(v => {
          const label = v === "pending" ? `Pending (${waiting+confirmed})` : v === "completed" ? `Done (${completed+noShow})` : `All (${all.length})`;
          return (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "5px 12px", borderRadius: 7, border: `1.5px solid ${view===v ? cfg.accent : "#e2e8f0"}`, background: view===v ? cfg.accentLight : "#fff", color: view===v ? cfg.accent2 : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {label}
            </button>
          );
        })}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Patient / token / doctor…"
            style={{ padding: "7px 12px 7px 28px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", width: 200 }}
            onFocus={e => (e.target.style.borderColor = cfg.accent)} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
          <Users size={11} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        </div>
      </div>

      <div className="dd-card">
        <div className="dd-tbl-wrap">
          <table className="dd-tbl">
            <thead>
              <tr><th style={{ width: 56 }}>Token</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Type</th><th>Status</th><th style={{ width: 200 }}>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
                  <Loader2 size={16} style={{ animation: "dd-spin .7s linear infinite", verticalAlign: "middle", marginRight: 6 }} />Loading queue…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <CheckCircle2 size={36} color={cfg.accent} style={{ display: "block", margin: "0 auto 10px" }} />
                    <div style={{ fontSize: 13, color: "#64748b" }}>{view === "pending" ? "Queue is clear — no pending patients" : "No records for this filter"}</div>
                  </div>
                </td></tr>
              ) : filtered.map((a, i) => {
                const sm        = STATUS_META[a.status] || { label: a.status, cls: "dd-badge-gray" };
                const isPending = ["SCHEDULED","CONFIRMED"].includes(a.status);
                const isFirst   = view === "pending" && i === 0 && isPending;
                return (
                  <tr key={a.id} style={{ background: isFirst ? cfg.accentLight : undefined }}>
                    <td>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: isFirst ? `linear-gradient(135deg,${cfg.accent},${cfg.accent2})` : cfg.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: isFirst ? "#fff" : cfg.accent }}>
                        {a.tokenNumber || "—"}
                      </div>
                    </td>
                    <td><div className="dd-td-name">{a.patient?.name || "—"}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{a.patient?.patientId}</div></td>
                    <td style={{ fontSize: 12, color: "#475569" }}>Dr. {a.doctor?.name || "—"}</td>
                    <td style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{fmtTime(a.timeSlot)}</td>
                    <td><span className="dd-badge dd-badge-gray" style={{ fontSize: 10 }}>{a.type?.replace(/_/g," ") || "—"}</span></td>
                    <td><span className={`dd-badge ${sm.cls}`}>{sm.label}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {a.status === "SCHEDULED" && (
                          <button onClick={() => updateStatus(a.id,"CONFIRMED")} disabled={!!updating[a.id]}
                            style={{ padding: "4px 10px", borderRadius: 6, background: cfg.accentLight, color: cfg.accent2, border: `1px solid ${cfg.accentBorder}`, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            {updating[a.id]==="CONFIRMED" ? <Loader2 size={10} style={{ animation: "dd-spin .7s linear infinite", verticalAlign: "middle" }} /> : "Confirm"}
                          </button>
                        )}
                        {isPending && (
                          <>
                            <button onClick={() => updateStatus(a.id,"COMPLETED")} disabled={!!updating[a.id]}
                              style={{ padding: "4px 10px", borderRadius: 6, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              {updating[a.id]==="COMPLETED" ? <Loader2 size={10} style={{ animation: "dd-spin .7s linear infinite", verticalAlign: "middle" }} /> : "Complete"}
                            </button>
                            <button onClick={() => updateStatus(a.id,"NO_SHOW")} disabled={!!updating[a.id]}
                              style={{ padding: "4px 10px", borderRadius: 6, background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              No-Show
                            </button>
                          </>
                        )}
                        {!isPending && <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {all.length > 0 && (
          <div style={{ padding: "9px 18px", borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8" }}>
            Showing {filtered.length} of {all.length} appointments today
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   DEPT INFO TAB
═══════════════════════════════════════════════════════════ */
function DeptInfoTab({ deptProfile, cfg }: { deptProfile: any; cfg: DeptDashCfg }) {
  const [profile, setProfile] = useState<any>(deptProfile);

  useEffect(() => {
    fetch("/api/parentdept/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.success) setProfile(d.data); })
      .catch(() => {});
  }, []);

  const p = profile;

  const InfoRow = ({ label, value, icon }: { label: string; value?: string | null; icon: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: value ? "#1e293b" : "#cbd5e1" }}>{value || "Not set"}</div>
      </div>
    </div>
  );

  return (
    <>
      <div className="dd-section-title" style={{ marginBottom: 20 }}>
        <div className="dd-section-dot" />Department Information
      </div>
      {!p ? (
        <div className="dd-empty"><Loader2 size={24} style={{ animation: "dd-spin .7s linear infinite", display: "block", margin: "0 auto" }} /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="dd-card" style={{ gridColumn: "1 / -1" }}>
            <div className="dd-card-head">
              <div><div className="dd-card-title">Basic Information</div><div className="dd-card-sub">Core department details</div></div>
              <span className={`dd-badge ${p.isActive ? "dd-badge-green" : "dd-badge-red"}`}>{p.isActive ? "● Active" : "● Inactive"}</span>
            </div>
            <div className="dd-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                <InfoRow label="Department Name" value={p.name}                    icon={<Info size={14} color={cfg.accent} />} />
                <InfoRow label="Department Code" value={p.code}                    icon={<Info size={14} color={cfg.accent} />} />
                <InfoRow label="Type"            value={p.type?.replace(/_/g," ")} icon={<Activity size={14} color={cfg.accent} />} />
                <InfoRow label="Status"          value={p.isActive ? "Active — Accepting patients" : "Inactive"} icon={<Activity size={14} color={cfg.accent} />} />
              </div>
              {p.description && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{p.description}</div>
                </div>
              )}
            </div>
          </div>
          <div className="dd-card">
            <div className="dd-card-head"><div className="dd-card-title">Head of Department</div></div>
            <div className="dd-card-body" style={{ paddingTop: 4 }}>
              <InfoRow label="HOD Name"    value={p.hodName || p.hodStaffName}  icon={<UserCheck size={14} color={cfg.accent} />} />
              <InfoRow label="HOD Email"   value={p.hodEmail}                   icon={<Mail size={14} color={cfg.accent} />} />
              <InfoRow label="HOD Phone"   value={p.hodPhone}                   icon={<Phone size={14} color={cfg.accent} />} />
              <InfoRow label="Login Email" value={p.loginEmail}                 icon={<Mail size={14} color={cfg.accent} />} />
            </div>
          </div>
          <div className="dd-card">
            <div className="dd-card-head"><div className="dd-card-title">Operational Details</div></div>
            <div className="dd-card-body" style={{ paddingTop: 4 }}>
              <InfoRow label="Location / Wing" value={p.location || p.wing}       icon={<MapPin size={14} color={cfg.accent} />} />
              <InfoRow label="Floor / Room"    value={p.floor || p.room}          icon={<Building2 size={14} color={cfg.accent} />} />
              <InfoRow label="Contact Number"  value={p.contactNumber || p.phone} icon={<Phone size={14} color={cfg.accent} />} />
              <InfoRow label="Created On"      value={p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined} icon={<Activity size={14} color={cfg.accent} />} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED CSS (injected by consuming layout — kept here for reference)
   Consuming layouts should include .dd-* styles using their accent colours.
═══════════════════════════════════════════════════════════ */
export function getDeptDashCSS(cfg: DeptDashCfg): string {
  return `
    .dd-banner{border-radius:16px;padding:20px 24px;color:#fff;display:flex;align-items:center;gap:16px;position:relative;overflow:hidden;margin-bottom:0}
    .dd-banner::before{content:"";position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.06)}
    .dd-banner-ic{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .dd-banner-name{font-size:20px;font-weight:800;letter-spacing:-.02em}
    .dd-banner-sub{font-size:12px;opacity:.75;margin-top:3px}
    .dd-badge-pill{font-size:10px;font-weight:700;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);padding:3px 10px;border-radius:100px;display:inline-flex;align-items:center;gap:4px;margin-top:6px}
    .dd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:0}
    @media(max-width:1200px){.dd-stats{grid-template-columns:repeat(2,1fr)}}
    .dd-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #e8f4f4;display:flex;align-items:center;gap:14px;cursor:default}
    .dd-sc-ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .dd-sc-lbl{font-size:10px;color:#94a3b8;font-weight:500;margin-bottom:3px}
    .dd-sc-val{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
    .dd-sc-sub{font-size:9px;color:#94a3b8;margin-top:3px}
    .dd-card{background:#fff;border-radius:14px;border:1px solid #e8f4f4;overflow:hidden}
    .dd-card-head{padding:14px 18px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
    .dd-card-title{font-size:13px;font-weight:700;color:#1e293b}
    .dd-card-sub{font-size:10px;color:#94a3b8;margin-top:2px}
    .dd-card-body{padding:16px 18px}
    .dd-tbl-wrap{overflow-x:auto}
    .dd-tbl{width:100%;border-collapse:collapse;min-width:480px}
    .dd-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;padding:8px 12px;border-bottom:2px solid #f1f5f9;letter-spacing:.04em;text-transform:uppercase}
    .dd-tbl td{padding:12px;font-size:12px;color:#475569;border-bottom:1px solid #f8fafc}
    .dd-tbl tr:last-child td{border-bottom:none}
    .dd-tbl tbody tr:hover td{background:#f8fafc}
    .dd-td-name{font-weight:600;color:#1e293b}
    .dd-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:9px;font-weight:700}
    .dd-badge-green{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
    .dd-badge-blue{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
    .dd-badge-amber{background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe}
    .dd-badge-red{background:#fff5f5;color:#dc2626;border:1px solid #fecaca}
    .dd-badge-teal{background:${cfg.accentLight};color:${cfg.accent2};border:1px solid ${cfg.accentBorder}}
    .dd-badge-gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
    .dd-btn-ghost{padding:7px 14px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .15s}
    .dd-btn-ghost:hover{background:${cfg.accentLight};border-color:${cfg.accentBorder};color:${cfg.accent}}
    .dd-section-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:14px;display:flex;align-items:center;gap:8px}
    .dd-section-dot{width:4px;height:18px;background:linear-gradient(180deg,${cfg.accent},${cfg.accent2});border-radius:4px;flex-shrink:0}
    .dd-empty{padding:48px;text-align:center;color:#94a3b8}
    @keyframes dd-spin{to{transform:rotate(360deg)}}
  `;
}
