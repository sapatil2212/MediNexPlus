"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart2, Users, CalendarCheck, IndianRupee, RefreshCw,
  TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle,
  Loader2, Download, Stethoscope, CalendarClock,
} from "lucide-react";

const api = async (url: string) => {
  const r = await fetch(url, { credentials: "include" });
  return r.json();
};

function fmt(n: number) {
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function StatCard({ icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  const Icon = icon;
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 7, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 100, transition: "width .5s" }} />
      </div>
    </div>
  );
}

function SparkChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  if (!data.length) return <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No data</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56, paddingTop: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div
            style={{
              width: "100%", background: color, borderRadius: "4px 4px 0 0",
              height: `${Math.max(4, Math.round((d.count / max) * 44))}px`,
              opacity: 0.85, transition: "height .4s",
            }}
            title={`${d.date}: ${d.count}`}
          />
          <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" }}>{d.date}</span>
        </div>
      ))}
    </div>
  );
}

function RateRing({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={70} height={70} viewBox="0 0 70 70">
        <circle cx={35} cy={35} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
        <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 35 35)" style={{ transition: "stroke-dasharray .6s" }} />
        <text x={35} y={39} textAnchor="middle" fontSize={13} fontWeight={800} fill="#1e293b">{pct}%</text>
      </svg>
      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textAlign: "center" }}>{label}</span>
    </div>
  );
}

export default function ReportsPanel() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const res = await api("/api/reports/summary");
    if (res.success) setData(res.data);
    else setError(res.message || "Failed to load reports");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "80px 0", color: "#94a3b8" }}>
      <Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} />Loading reports...
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <AlertCircle size={28} color="#ef4444" style={{ marginBottom: 10 }} />
      <div style={{ color: "#ef4444", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{error}</div>
      <button onClick={load} style={{ padding: "8px 18px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, cursor: "pointer" }}>Retry</button>
    </div>
  );

  if (!data) return null;

  const { appointments: ap, patients: pt, followUps: fu, billing: bl, doctors: dr, topDoctors } = data;

  const STATUS_COLOR: Record<string, string> = {
    SCHEDULED: "#3b82f6", CONFIRMED: "#0ea5e9", COMPLETED: "#10b981",
    CANCELLED: "#ef4444", NO_SHOW: "#f97316", RESCHEDULED: "#8b5cf6",
  };
  const TYPE_COLOR: Record<string, string> = {
    OPD: "#0E898F", ONLINE: "#6366f1", FOLLOW_UP: "#f59e0b", EMERGENCY: "#ef4444",
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>Reports & Analytics</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>Live summary across appointments, patients, billing &amp; follow-ups</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/api/export/appointments" download
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #d1fae5", background: "#f0fdf4", fontSize: 12, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            <Download size={13} />Export Appts
          </a>
          <a href="/api/export/patients" download
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #dbeafe", background: "#eff6ff", fontSize: 12, color: "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            <Download size={13} />Export Patients
          </a>
          <a href="/api/export/billing" download
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #ede9fe", background: "#f5f3ff", fontSize: 12, color: "#7c3aed", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            <Download size={13} />Export Billing
          </a>
          <a href="/api/export/staff" download
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #fde68a", background: "#fffbeb", fontSize: 12, color: "#d97706", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            <Download size={13} />Export Staff
          </a>
          <a href="/api/export/doctors" download
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e9d5ff", background: "#faf5ff", fontSize: 12, color: "#9333ea", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            <Download size={13} />Export Doctors
          </a>
          <a href="/api/export/inventory" download
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #cffafe", background: "#ecfeff", fontSize: 12, color: "#0891b2", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            <Download size={13} />Export Inventory
          </a>
          <a href="/api/export/ipd" download
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #fed7aa", background: "#fff7ed", fontSize: 12, color: "#c2410c", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
            <Download size={13} />Export IPD
          </a>
          <button onClick={load} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <RefreshCw size={12} />Refresh
          </button>
        </div>
      </div>

      {/* Top KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon={CalendarCheck} label="Total Appointments" value={ap.total} sub={`${ap.today} today · ${ap.last7days} this week`} color="#0E898F" />
        <StatCard icon={Users} label="Total Patients" value={pt.total} sub={`${pt.newToday} new today · ${pt.newThisMonth} this month`} color="#3b82f6" />
        <StatCard icon={IndianRupee} label="Total Revenue" value={fmt(bl.totalRevenue)} sub={`Collected: ${fmt(bl.collectedRevenue)}`} color="#10b981" />
        <StatCard icon={CalendarClock} label="Follow-ups" value={fu.total} sub={`${fu.overdue} overdue · ${fu.today} today`} color={fu.overdue > 0 ? "#f97316" : "#10b981"} />
        <StatCard icon={Stethoscope} label="Active Doctors" value={dr.active} sub={`${dr.total} total registered`} color="#8b5cf6" />
        <StatCard icon={BarChart2} label="This Month" value={fmt(bl.monthRevenue)} sub={`Collected: ${fmt(bl.monthCollected)}`} color="#0ea5e9" />
      </div>

      {/* Middle Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>

        {/* Appointments 7-day spark */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Appointments — Last 7 Days</div>
          <SparkChart data={ap.daily} color="#0E898F" />
        </div>

        {/* Rate rings */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Completion Rates</div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <RateRing pct={ap.completionRate}  color="#0E898F" label="Appt Completion" />
            <RateRing pct={fu.completionRate}  color="#f59e0b" label="Follow-up Done" />
            <RateRing pct={bl.collectionRate}  color="#10b981" label="Bill Collected" />
          </div>
        </div>

        {/* Billing breakdown */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Billing Status</div>
          <MiniBar label="Paid" value={bl.paidBills} max={bl.totalBills} color="#10b981" />
          <MiniBar label="Pending" value={bl.pendingBills} max={bl.totalBills} color="#f97316" />
          <MiniBar label="Total Bills" value={bl.totalBills} max={bl.totalBills} color="#0E898F" />
          <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>Total discount given: {fmt(bl.totalDiscount)}</div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Appointment by status */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Appointments by Status</div>
          {ap.byStatus.length === 0
            ? <div style={{ fontSize: 12, color: "#94a3b8" }}>No data</div>
            : ap.byStatus.map((s: any) => (
              <MiniBar key={s.status} label={s.status} value={s.count} max={ap.total} color={STATUS_COLOR[s.status] ?? "#64748b"} />
            ))
          }
        </div>

        {/* Appointment by type */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Appointments by Type</div>
          {ap.byType.length === 0
            ? <div style={{ fontSize: 12, color: "#94a3b8" }}>No data</div>
            : ap.byType.map((t: any) => (
              <MiniBar key={t.type} label={t.type} value={t.count} max={ap.total} color={TYPE_COLOR[t.type] ?? "#64748b"} />
            ))
          }
        </div>

        {/* Top doctors */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Top Doctors (Last 30 Days)</div>
          {topDoctors.length === 0
            ? <div style={{ fontSize: 12, color: "#94a3b8" }}>No appointment data yet</div>
            : topDoctors.map((d: any, i: number) => (
              <div key={d.doctorId} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{d.specialization ?? "General"}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0E898F", flexShrink: 0 }}>{d.count} appts</div>
              </div>
            ))
          }
        </div>

      </div>

    </div>
  );
}
