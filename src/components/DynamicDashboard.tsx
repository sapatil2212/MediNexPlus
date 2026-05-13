"use client";
import { useState, useEffect, useCallback } from "react";
import { Activity, Package, Users, Building2, TrendingUp, CheckCircle2, Clock, Loader2, RefreshCw, IndianRupee, BarChart2, AlertCircle } from "lucide-react";

interface DashboardStats {
  services: { total: number; active: number; inactive: number; byCategory: { category: string; count: number; totalValue: number }[] };
  treatmentPlans: { total: number; active: number; completed: number; other: number; totalRevenue: number; collectedRevenue: number };
  sessions: { total: number; completed: number; scheduled: number; completionRate: number };
  departments: { total: number; active: number };
  today: { appointments: number };
  recentPlans: any[];
}

const STATUS_COLOR: Record<string, [string, string, string]> = {
  ACTIVE:    ["#e0f2fe", "#0369a1", "#bae6fd"],
  COMPLETED: ["#f0fdf4", "#16a34a", "#bbf7d0"],
  CANCELLED: ["#fff5f5", "#ef4444", "#fecaca"],
  ON_HOLD:   ["#fefce8", "#ca8a04", "#fef08a"],
};

export default function DynamicDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/config/dashboard-stats", { credentials: "include" });
      const d = await r.json();
      if (d.success) setStats(d.data);
      else setError(d.message || "Failed to load stats");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "80px 0", color: "#94a3b8", fontSize: 14 }}>
      <Loader2 size={20} style={{ animation: "spin .8s linear infinite" }} />
      Loading dashboard...
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12 }}>
      <AlertCircle size={32} color="#ef4444" />
      <div style={{ fontSize: 14, color: "#ef4444", fontWeight: 600 }}>{error}</div>
      <button onClick={load} style={{ padding: "8px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#475569", cursor: "pointer", fontWeight: 600 }}>Retry</button>
    </div>
  );

  if (!stats) return null;

  const pending = stats.treatmentPlans.totalRevenue - stats.treatmentPlans.collectedRevenue;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ddb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 14px; margin-bottom: 24px; }
        .ddb-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 18px 20px; }
        .ddb-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
        .ddb-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .ddb-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
        .ddb-value { font-size: 28px; font-weight: 800; color: #1e293b; line-height: 1; }
        .ddb-sub { font-size: 11px; color: #64748b; margin-top: 5px; }
        .ddb-progress { height: 6px; background: #f1f5f9; border-radius: 100px; overflow: hidden; margin-top: 10px; }
        .ddb-progress-fill { height: 100%; border-radius: 100px; transition: width .4s; }
        .ddb-section-title { font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .ddb-table-wrap { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
        .ddb-tbl { width: 100%; border-collapse: collapse; }
        .ddb-tbl th { font-size: 11px; font-weight: 700; color: #94a3b8; padding: 11px 14px; border-bottom: 2px solid #f1f5f9; text-align: left; }
        .ddb-tbl td { font-size: 13px; color: #475569; padding: 11px 14px; border-bottom: 1px solid #f8fafc; }
        .ddb-tbl tr:last-child td { border-bottom: none; }
        .ddb-badge { display: inline-flex; padding: 3px 9px; border-radius: 100px; font-size: 10px; font-weight: 700; }
        .ddb-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .ddb-bar-label { font-size: 12px; color: #475569; width: 100px; font-weight: 600; flex-shrink: 0; }
        .ddb-bar-track { flex: 1; height: 8px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
        .ddb-bar-fill { height: 100%; border-radius: 100px; }
        .ddb-bar-count { font-size: 12px; color: #64748b; width: 30px; text-align: right; flex-shrink: 0; }
        .ddb-refresh { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; margin-bottom: 20px; }
        .ddb-refresh button { background: none; border: none; cursor: pointer; color: #0E898F; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px; padding: 0; }
        .ddb-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        @media (max-width: 700px) { .ddb-two-col { grid-template-columns: 1fr; } }
      `}</style>

      <div className="ddb-refresh">
        Last updated: {lastRefresh.toLocaleTimeString()}
        <button onClick={load}><RefreshCw size={11} /> Refresh</button>
      </div>

      {/* KPI Cards */}
      <div className="ddb-grid">
        <div className="ddb-card">
          <div className="ddb-card-top">
            <div>
              <div className="ddb-label">Service Packages</div>
              <div className="ddb-value">{stats.services.total}</div>
              <div className="ddb-sub">{stats.services.active} active · {stats.services.inactive} inactive</div>
            </div>
            <div className="ddb-icon" style={{ background: "#f0f9ff" }}><Package size={20} color="#0369a1" /></div>
          </div>
          <div className="ddb-progress">
            <div className="ddb-progress-fill" style={{ width: stats.services.total > 0 ? `${(stats.services.active / stats.services.total) * 100}%` : "0%", background: "#0369a1" }} />
          </div>
        </div>

        <div className="ddb-card">
          <div className="ddb-card-top">
            <div>
              <div className="ddb-label">Treatment Plans</div>
              <div className="ddb-value">{stats.treatmentPlans.total}</div>
              <div className="ddb-sub">{stats.treatmentPlans.active} active · {stats.treatmentPlans.completed} completed</div>
            </div>
            <div className="ddb-icon" style={{ background: "#f0fdf4" }}><Activity size={20} color="#16a34a" /></div>
          </div>
          <div className="ddb-progress">
            <div className="ddb-progress-fill" style={{ width: stats.treatmentPlans.total > 0 ? `${(stats.treatmentPlans.completed / stats.treatmentPlans.total) * 100}%` : "0%", background: "#16a34a" }} />
          </div>
        </div>

        <div className="ddb-card">
          <div className="ddb-card-top">
            <div>
              <div className="ddb-label">Session Completion</div>
              <div className="ddb-value">{stats.sessions.completionRate}%</div>
              <div className="ddb-sub">{stats.sessions.completed}/{stats.sessions.total} sessions done</div>
            </div>
            <div className="ddb-icon" style={{ background: "#fef9c3" }}><CheckCircle2 size={20} color="#ca8a04" /></div>
          </div>
          <div className="ddb-progress">
            <div className="ddb-progress-fill" style={{ width: `${stats.sessions.completionRate}%`, background: "#ca8a04" }} />
          </div>
        </div>

        <div className="ddb-card">
          <div className="ddb-card-top">
            <div>
              <div className="ddb-label">Revenue (Plans)</div>
              <div className="ddb-value" style={{ fontSize: 22 }}>₹{(stats.treatmentPlans.collectedRevenue / 1000).toFixed(1)}K</div>
              <div className="ddb-sub">₹{(pending / 1000).toFixed(1)}K pending</div>
            </div>
            <div className="ddb-icon" style={{ background: "#fdf4ff" }}><IndianRupee size={20} color="#9333ea" /></div>
          </div>
          <div className="ddb-progress">
            <div className="ddb-progress-fill" style={{ width: stats.treatmentPlans.totalRevenue > 0 ? `${(stats.treatmentPlans.collectedRevenue / stats.treatmentPlans.totalRevenue) * 100}%` : "0%", background: "#9333ea" }} />
          </div>
        </div>

        <div className="ddb-card">
          <div className="ddb-card-top">
            <div>
              <div className="ddb-label">Today's Appointments</div>
              <div className="ddb-value">{stats.today.appointments}</div>
              <div className="ddb-sub">Across all departments</div>
            </div>
            <div className="ddb-icon" style={{ background: "#fff7ed" }}><Clock size={20} color="#ea580c" /></div>
          </div>
        </div>

        <div className="ddb-card">
          <div className="ddb-card-top">
            <div>
              <div className="ddb-label">Departments</div>
              <div className="ddb-value">{stats.departments.active}</div>
              <div className="ddb-sub">of {stats.departments.total} configured</div>
            </div>
            <div className="ddb-icon" style={{ background: "#f0f9ff" }}><Building2 size={20} color="#0E898F" /></div>
          </div>
          <div className="ddb-progress">
            <div className="ddb-progress-fill" style={{ width: stats.departments.total > 0 ? `${(stats.departments.active / stats.departments.total) * 100}%` : "0%", background: "#0E898F" }} />
          </div>
        </div>
      </div>

      <div className="ddb-two-col">
        {/* Services by Category */}
        <div>
          <div className="ddb-section-title"><BarChart2 size={16} color="#0E898F" />Services by Category</div>
          <div className="ddb-card" style={{ padding: "16px 18px" }}>
            {stats.services.byCategory.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>No services configured yet</div>
            ) : (
              stats.services.byCategory.map((cat, i) => {
                const colors = ["#0E898F", "#3b82f6", "#a855f7", "#f59e0b", "#10b981", "#ef4444"];
                const pct = stats.services.total > 0 ? (cat.count / stats.services.total) * 100 : 0;
                return (
                  <div key={cat.category} className="ddb-bar-row">
                    <span className="ddb-bar-label">{cat.category}</span>
                    <div className="ddb-bar-track">
                      <div className="ddb-bar-fill" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                    <span className="ddb-bar-count">{cat.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Session Status Breakdown */}
        <div>
          <div className="ddb-section-title"><Activity size={16} color="#0E898F" />Session Status</div>
          <div className="ddb-card" style={{ padding: "16px 18px" }}>
            {[
              { label: "Completed", value: stats.sessions.completed, color: "#16a34a" },
              { label: "Scheduled", value: stats.sessions.scheduled, color: "#3b82f6" },
              { label: "Other", value: stats.sessions.total - stats.sessions.completed - stats.sessions.scheduled, color: "#94a3b8" },
            ].map((row) => {
              const pct = stats.sessions.total > 0 ? (row.value / stats.sessions.total) * 100 : 0;
              return (
                <div key={row.label} className="ddb-bar-row">
                  <span className="ddb-bar-label">{row.label}</span>
                  <div className="ddb-bar-track">
                    <div className="ddb-bar-fill" style={{ width: `${pct}%`, background: row.color }} />
                  </div>
                  <span className="ddb-bar-count">{row.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Treatment Plans */}
      <div className="ddb-section-title"><TrendingUp size={16} color="#0E898F" />Recent Treatment Plans</div>
      {stats.recentPlans.length === 0 ? (
        <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          No treatment plans yet. They are auto-created when a doctor assigns a service package during consultation.
        </div>
      ) : (
        <div className="ddb-table-wrap">
          <table className="ddb-tbl">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Plan</th>
                <th>Progress</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPlans.map((plan: any) => {
                const pct = plan.totalSessions > 0 ? (plan.completedSessions / plan.totalSessions) * 100 : 0;
                const colors = STATUS_COLOR[plan.status] || STATUS_COLOR.ON_HOLD;
                return (
                  <tr key={plan.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{plan.patient?.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{plan.patient?.patientId}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{plan.planName}</div>
                      {plan.service && <div style={{ fontSize: 11, color: "#94a3b8" }}>{plan.service.name}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                        {plan.completedSessions}/{plan.totalSessions}
                      </div>
                      <div style={{ width: 80, height: 5, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#0E898F", borderRadius: 100 }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>₹{(plan.totalCost || 0).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: "#16a34a" }}>Paid: ₹{(plan.paidAmount || 0).toLocaleString()}</div>
                    </td>
                    <td>
                      <span className="ddb-badge" style={{ background: colors[0], color: colors[1], border: `1px solid ${colors[2]}` }}>
                        {plan.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
