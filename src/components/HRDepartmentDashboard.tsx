"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Users, UserCheck, UserX, Stethoscope, Loader2, RefreshCw,
  ArrowUpRight, BarChart2, Shield, Briefcase, Activity
} from "lucide-react";

const StaffPage = dynamic(() => import("@/app/hospitaladmin/staff/page"), { ssr: false, loading: () => <LoadingPlaceholder label="Staff Management" /> });
const DoctorsPage = dynamic(() => import("@/app/hospitaladmin/doctors/page"), { ssr: false, loading: () => <LoadingPlaceholder label="Doctors Management" /> });

function LoadingPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ padding: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <Loader2 size={22} color="#0E898F" style={{ animation: "spin .7s linear infinite" }} />
      <span style={{ fontSize: 13, color: "#94a3b8" }}>Loading {label}...</span>
    </div>
  );
}

interface HRDeptProps {
  profile: any;
  user: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  meta: { gradient: string; accent: string; lightBg: string; borderColor: string };
}

type HRTab = "overview" | "staff" | "doctors";

const fmtCur = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const apiFetch = async (url: string) => {
  const r = await fetch(url, { credentials: "include" });
  return r.json();
};

export default function HRDepartmentDashboard({ profile, user, activeTab, onTabChange, meta }: HRDeptProps) {
  const tab = (activeTab || "overview") as HRTab;
  const setTab = (t: HRTab) => onTabChange(t);

  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, byRole: {} as Record<string, number> });
  const [doctorStats, setDoctorStats] = useState({ total: 0, active: 0, available: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [staffRes, doctorRes] = await Promise.all([
        apiFetch("/api/config/staff?stats=true"),
        apiFetch("/api/config/doctors?stats=true").catch(() => ({ success: false })),
      ]);
      if (staffRes.success && staffRes.data) {
        setStats({
          total: staffRes.data.total || 0,
          active: staffRes.data.active || 0,
          inactive: staffRes.data.inactive || 0,
          byRole: staffRes.data.byRole || {},
        });
      }
      if (doctorRes.success && doctorRes.data) {
        setDoctorStats({
          total: doctorRes.data.total || 0,
          active: doctorRes.data.active || 0,
          available: doctorRes.data.available || 0,
        });
      }
    } catch {}
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "overview") loadStats();
  }, [tab, loadStats]);

  const isHandledLocally = ["overview", "staff", "doctors"].includes(tab);
  if (!isHandledLocally) return null;

  const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
    NURSE: { color: "#0A6B70", bg: "#E6F4F4" },
    TECHNICIAN: { color: "#07595D", bg: "#B3E0E0" },
    PHARMACIST: { color: "#0E898F", bg: "#E6F4F4" },
    RECEPTIONIST: { color: "#0A6B70", bg: "#E6F4F4" },
    LAB_TECHNICIAN: { color: "#07595D", bg: "#B3E0E0" },
    ACCOUNTANT: { color: "#0E898F", bg: "#E6F4F4" },
    ADMIN: { color: "#0A6B70", bg: "#E6F4F4" },
    SUPPORT: { color: "#07595D", bg: "#B3E0E0" },
    OTHER: { color: "#64748b", bg: "#f8fafc" },
  };

  return (
    <>
      {/* ═══ Overview ═══ */}
      {tab === "overview" && (
        <>
          {/* Hero Banner */}
          <div style={{
            background: meta.gradient, borderRadius: 18, padding: "28px 30px", marginBottom: 22,
            color: "#fff", position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", right: -20, top: -20, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
            <div style={{ position: "absolute", right: 70, bottom: -35, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Users size={28} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", opacity: .75, marginBottom: 4 }}>HR Department</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, lineHeight: 1.2 }}>{profile?.name || "Human Resources"}</h1>
                {profile?.description && <p style={{ fontSize: 13, opacity: .82, maxWidth: 520 }}>{profile.description}</p>}
              </div>
              <div style={{ flexShrink: 0 }}>
                <button onClick={() => setTab("staff")} style={{
                  background: "rgba(255,255,255,.2)", padding: "10px 18px", borderRadius: 100,
                  fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,.3)",
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  backdropFilter: "blur(4px)"
                }}>
                  <Briefcase size={16} /> Manage Staff & Doctors
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Total Staff", value: stats.total, Icon: Users, color: "#0E898F", bg: "#E6F4F4", click: () => setTab("staff") },
              { label: "Active Staff", value: stats.active, Icon: UserCheck, color: "#0E898F", bg: "#E6F4F4", click: () => setTab("staff") },
              { label: "Total Doctors", value: doctorStats.total, Icon: Stethoscope, color: "#0E898F", bg: "#E6F4F4", click: () => setTab("doctors") },
              { label: "Available Doctors", value: doctorStats.available, Icon: Activity, color: "#0E898F", bg: "#E6F4F4", click: () => setTab("doctors") },
            ].map((s, i) => {
              const SI = s.Icon;
              return (
                <div key={i} onClick={s.click} className="sd2-sc" style={{ cursor: "pointer", padding: 16, gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SI size={20} color={s.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
                      {statsLoading ? <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> : s.value}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
            {/* Staff Management Card */}
            <div className="sd2-card">
              <div className="sd2-card-hd">
                <span className="sd2-card-title"><Users size={15} color={meta.accent} /> Staff Management</span>
                <button onClick={() => setTab("staff")} style={{
                  fontSize: 12, fontWeight: 600, color: meta.accent, background: meta.lightBg,
                  border: `1px solid ${meta.borderColor}`, borderRadius: 8, padding: "5px 12px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                }}>
                  Open <ArrowUpRight size={12} />
                </button>
              </div>
              <div style={{ padding: "20px 18px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Users size={24} color="#0E898F" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                  {statsLoading ? <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} /> : stats.total}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Total staff members</div>
                <button onClick={() => setTab("staff")} style={{
                  background: meta.gradient, color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 8
                }}>
                  <Briefcase size={15} /> Manage Staff
                </button>
              </div>
            </div>

            {/* Doctors Management Card */}
            <div className="sd2-card">
              <div className="sd2-card-hd">
                <span className="sd2-card-title"><Stethoscope size={15} color={meta.accent} /> Doctors Management</span>
                <button onClick={() => setTab("doctors")} style={{
                  fontSize: 12, fontWeight: 600, color: meta.accent, background: meta.lightBg,
                  border: `1px solid ${meta.borderColor}`, borderRadius: 8, padding: "5px 12px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                }}>
                  Open <ArrowUpRight size={12} />
                </button>
              </div>
              <div style={{ padding: "20px 18px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Stethoscope size={24} color="#0E898F" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                  {statsLoading ? <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} /> : doctorStats.total}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Total doctors registered</div>
                <button onClick={() => setTab("doctors")} style={{
                  background: meta.gradient, color: "#fff", border: "none", borderRadius: 10,
                  padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 8
                }}>
                  <Stethoscope size={15} /> Manage Doctors
                </button>
              </div>
            </div>

            {/* Role Distribution Card */}
            <div className="sd2-card">
              <div className="sd2-card-hd">
                <span className="sd2-card-title"><BarChart2 size={15} color={meta.accent} /> Role Distribution</span>
              </div>
              <div style={{ padding: "16px 18px" }}>
                {statsLoading ? (
                  <div style={{ textAlign: "center", padding: 30 }}><Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} /></div>
                ) : Object.keys(stats.byRole).length === 0 ? (
                  <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 13 }}>No staff members yet</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.entries(stats.byRole).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([role, count]) => {
                      const rc = ROLE_COLORS[role] || { color: "#475569", bg: "#f8fafc" };
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={role} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            display: "inline-flex", padding: "3px 10px", borderRadius: 100,
                            fontSize: 10, fontWeight: 700, background: rc.bg, color: rc.color,
                            minWidth: 90, justifyContent: "center"
                          }}>
                            {role.replace(/_/g, " ")}
                          </span>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: rc.color, transition: "width .3s" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", minWidth: 24, textAlign: "right" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Refresh */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <button onClick={loadStats} disabled={statsLoading} style={{
              display: "flex", alignItems: "center", gap: 6, background: "#f8fafc",
              border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 16px",
              fontSize: 12, fontWeight: 600, color: "#64748b", cursor: statsLoading ? "not-allowed" : "pointer"
            }}>
              <RefreshCw size={13} style={statsLoading ? { animation: "spin .7s linear infinite" } : {}} />
              {statsLoading ? "Loading..." : "Refresh Stats"}
            </button>
          </div>
        </>
      )}

      {/* ═══ Staff Management - Full Hospital Admin Staff Page ═══ */}
      {tab === "staff" && <StaffPage />}

      {/* ═══ Doctors Management - Full Hospital Admin Doctors Page ═══ */}
      {tab === "doctors" && <DoctorsPage />}
    </>
  );
}
