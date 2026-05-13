"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck, Clock, CheckCircle, AlertCircle, Loader2,
  Search, Filter, User, Phone, Stethoscope, X, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Bell,
} from "lucide-react";

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: "Pending", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  COMPLETED: { label: "Completed", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  CANCELLED: { label: "Cancelled", color: "#dc2626", bg: "#fff5f5", border: "#fecaca" },
};

interface FollowUp {
  id: string; patientId: string; appointmentId?: string;
  followUpDate: string; reason?: string; notes?: string; status: string;
  patient?: { id: string; patientId: string; name: string; phone: string; email?: string };
  appointment?: { id: string; appointmentDate: string; doctor?: { name: string; specialization?: string } };
}

// ─── Stats Bar ───
function StatsBar({ stats }: { stats: any }) {
  if (!stats) return null;
  const items = [
    { label: "Today", value: stats.today, color: "#0A6B70", bg: "#E6F4F4", icon: Clock },
    { label: "Pending", value: stats.pending, color: "#d97706", bg: "#fffbeb", icon: AlertCircle },
    { label: "Overdue", value: stats.overdue, color: "#dc2626", bg: "#fff5f5", icon: AlertCircle },
    { label: "Completed", value: stats.completed, color: "#059669", bg: "#f0fdf4", icon: CheckCircle },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
      {items.map(i => (
        <div key={i.label} style={{ background: "linear-gradient(135deg, #ffffff, #f8fafc)", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: i.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i.icon size={20} color={i.color} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>{i.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: i.color, lineHeight: 1 }}>{i.value ?? 0}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Follow-Up Card ───
function FollowUpCard({
  fu, onStatusChange, onViewPatient, onRemind, reminding,
}: { fu: FollowUp; onStatusChange: (id: string, status: string) => void; onViewPatient: (id: string) => void; onRemind?: (id: string) => void; reminding?: boolean }) {
  const router = useRouter();
  const sc = STATUS_CFG[fu.status] || STATUS_CFG.PENDING;
  const fuDate = new Date(fu.followUpDate);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isToday = fuDate.toDateString() === now.toDateString();
  const isOverdue = fuDate < todayStart && fu.status === "PENDING";
  const isUpcoming = fuDate > now && fu.status === "PENDING";

  return (
    <div style={{
      background: isOverdue ? "linear-gradient(135deg, #ffffff, #fef2f2)" : isToday ? "linear-gradient(135deg, #ffffff, #f0fdfa)" : "linear-gradient(135deg, #ffffff, #f8fafc)",
      borderRadius: 14,
      border: `1px solid ${isOverdue ? "#fecaca" : isToday ? "#B3E0E0" : "#e2e8f0"}`,
      padding: "16px 20px",
      transition: "all .15s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
          {/* Date Badge */}
          <div style={{
            width: 52, height: 52, borderRadius: 12, flexShrink: 0,
            background: isOverdue ? "linear-gradient(135deg,#ef4444,#dc2626)" : isToday ? "linear-gradient(135deg,#0E898F,#0A6B70)" : "linear-gradient(135deg,#10b981,#059669)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{fuDate.getDate()}</div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
              {fuDate.toLocaleDateString("en-IN", { month: "short" })}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              {isOverdue && <span style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", background: "#fff5f5", border: "1px solid #fecaca", padding: "2px 7px", borderRadius: 100 }}>OVERDUE</span>}
              {isToday && <span style={{ fontSize: 9, fontWeight: 700, color: "#0A6B70", background: "#E6F4F4", border: "1px solid #B3E0E0", padding: "2px 7px", borderRadius: 100 }}>TODAY</span>}
              {isUpcoming && fuDate.getTime() - now.getTime() < 86400000 * 3 && (
                <span style={{ fontSize: 9, fontWeight: 700, color: "#0891b2", background: "#ecfeff", border: "1px solid #a5f3fc", padding: "2px 7px", borderRadius: 100 }}>IN {Math.ceil((fuDate.getTime() - now.getTime()) / 86400000)} DAY(S)</span>
              )}
            </div>

            {/* Patient Info */}
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {fu.patient?.name}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 8 }}>
              <span>{fu.patient?.patientId}</span>
              <span>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Phone size={9} />{fu.patient?.phone}</span>
            </div>

            {fu.reason && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", background: "#f8fafc", padding: "5px 10px", borderRadius: 7 }}>
                {fu.reason}
              </div>
            )}

            {fu.appointment?.doctor && (
              <div style={{ marginTop: 5, fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                <Stethoscope size={10} />
                {fu.appointment.doctor.name}
                {fu.appointment.doctor.specialization ? ` · ${fu.appointment.doctor.specialization}` : ""}
              </div>
            )}
          </div>
        </div>

        {/* Status + Actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, padding: "4px 10px", borderRadius: 100, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 700 }}>
            {sc.label}
          </span>

          {fu.status === "PENDING" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onStatusChange(fu.id, "COMPLETED")}
                style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#f0fdf4", color: "#059669", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle size={11} />Done
              </button>
              {onRemind && (
                <button onClick={() => onRemind(fu.id)} disabled={reminding} title="Send Reminder Notification"
                  style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: reminding ? "#f1f5f9" : "#fffbeb", color: reminding ? "#94a3b8" : "#d97706", fontSize: 11, cursor: reminding ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}>
                  {reminding ? <Loader2 size={11} style={{ animation: "spin .7s linear infinite" }} /> : <Bell size={11} />}
                </button>
              )}
              <button onClick={() => onStatusChange(fu.id, "CANCELLED")}
                style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#fff5f5", color: "#dc2626", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X size={11} />
              </button>
            </div>
          )}

          <button 
            onClick={() => router.push(`/hospitaladmin/dashboard?tab=patients&patientId=${fu.patient?.id || fu.patientId}`)}
            style={{ fontSize: 11, color: "#0E898F", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "right", marginTop: "auto" }}
          >
            View Profile →
          </button>
        </div>
      </div>

      {fu.notes && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, borderLeft: "3px solid #e2e8f0" }}>
          📋 {fu.notes}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───
export default function FollowUpDashboard({ onViewPatient }: { onViewPatient?: (id: string) => void }) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "today" | "all" | "overdue">("upcoming");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const [rowReminding, setRowReminding] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12" });

    if (activeFilter === "today") params.set("today", "true");
    else if (activeFilter === "upcoming") params.set("upcoming", "true");
    else if (activeFilter === "overdue") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      params.set("dateTo", toLocalDateStr(yesterday));
      params.set("status", "PENDING");
    }

    if (statusFilter && activeFilter !== "overdue") params.set("status", statusFilter);
    if (search) params.set("patientId", search); // search by patientId could be added

    const [fu, st] = await Promise.all([
      api(`/api/followups?${params}`),
      api("/api/followups?stats=true"),
    ]);

    if (fu.success) {
      setFollowUps(fu.data?.data || []);
      setPagination(fu.data?.pagination || { total: 0, totalPages: 1 });
    }
    if (st.success) setStats(st.data);
    setLoading(false);
  }, [page, activeFilter, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    await api(`/api/followups/${id}`, "PUT", { status });
    load();
  };

  const handleRowRemind = async (id: string) => {
    setRowReminding(s => new Set(s).add(id));
    const res = await api("/api/followups/reminders", "POST", { followUpId: id });
    setRowReminding(s => { const n = new Set(s); n.delete(id); return n; });
    if (res.success) { setReminderMsg("✓ Reminder sent"); setTimeout(() => setReminderMsg(null), 3000); }
    else { setReminderMsg("Failed to send reminder"); setTimeout(() => setReminderMsg(null), 3000); }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    setReminderMsg(null);
    const res = await api("/api/followups/reminders", "POST", { type: "both" });
    setSendingReminders(false);
    if (res.success) setReminderMsg(`✓ ${res.data?.fired || 0} reminder(s) sent`);
    else setReminderMsg("Failed to send reminders");
    setTimeout(() => setReminderMsg(null), 4000);
  };

  const FILTER_TABS = [
    { id: "today" as const, label: "Today", count: stats?.today },
    { id: "upcoming" as const, label: "Upcoming", count: null },
    { id: "overdue" as const, label: "Overdue", count: stats?.overdue },
    { id: "all" as const, label: "All", count: stats?.total },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <StatsBar stats={stats} />

      {/* Filter Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", padding: 4, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          {FILTER_TABS.map(t => (
            <button key={t.id} onClick={() => { setActiveFilter(t.id); setPage(1); }}
              style={{ padding: "7px 16px", borderRadius: 9, border: "none", background: activeFilter === t.id ? "#0E898F" : "none", color: activeFilter === t.id ? "#fff" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}>
              {t.label}
              {t.count !== null && t.count !== undefined && (
                <span style={{ minWidth: 18, height: 18, borderRadius: 100, background: activeFilter === t.id ? "rgba(255,255,255,.3)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, padding: "0 5px" }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#334155", outline: "none" }}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button onClick={() => { setStatusFilter(""); setPage(1); load(); }}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <RefreshCw size={12} />Refresh
          </button>
          <button onClick={handleSendReminders} disabled={sendingReminders}
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #fde68a", background: sendingReminders ? "#fffbeb" : "#fffbeb", fontSize: 12, color: "#d97706", fontWeight: 700, cursor: sendingReminders ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, opacity: sendingReminders ? .6 : 1 }}>
            {sendingReminders ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <Bell size={12} />}
            {sendingReminders ? "Sending..." : "Send Reminders"}
          </button>
        </div>
      </div>
      {reminderMsg && (
        <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 9, background: reminderMsg.startsWith("✓") ? "#f0fdf4" : "#fff5f5", color: reminderMsg.startsWith("✓") ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 600, border: `1px solid ${reminderMsg.startsWith("✓") ? "#bbf7d0" : "#fecaca"}` }}>
          {reminderMsg}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 0", color: "#94a3b8" }}>
          <Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} />Loading follow-ups...
        </div>
      ) : followUps.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0" }}>
          <CalendarCheck size={36} style={{ marginBottom: 12, color: "#10b981", opacity: .5 }} />
          <div style={{ fontWeight: 700, fontSize: 15, color: "#334155", marginBottom: 4 }}>
            {activeFilter === "today" ? "No follow-ups today" : activeFilter === "overdue" ? "No overdue follow-ups" : "No follow-ups found"}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Follow-ups will appear here when scheduled from appointment records</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 14 }}>
          {followUps.map(fu => (
            <FollowUpCard 
              key={fu.id} 
              fu={fu} 
              onStatusChange={handleStatusChange} 
              onViewPatient={(id) => onViewPatient?.(id)}
              onRemind={handleRowRemind}
              reminding={rowReminding.has(fu.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, padding: "12px 0" }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{pagination.total} follow-ups</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, padding: "0 8px" }}>{page} / {pagination.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: page === pagination.totalPages ? "not-allowed" : "pointer", opacity: page === pagination.totalPages ? .4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
