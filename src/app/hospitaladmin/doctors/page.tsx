"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope, BarChart2, LayoutDashboard, Settings,
  LogOut, Bell, ArrowLeft, Loader2, UserCheck, UserX,
  Users, Activity, CheckCircle2, User,
  Send, ChevronRight, Calendar, Building2, IndianRupee,
} from "lucide-react";
import DoctorPanel from "@/components/DoctorPanel";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

type Tab = "doctors" | "overview";

const DEPT_COLORS = [
  { color: "#0E898F", bg: "#E6F4F4", border: "#B3E0E0" },
  { color: "#6d28d9", bg: "#faf5ff", border: "#ede9fe" },
  { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  { color: "#be185d", bg: "#fdf2f8", border: "#fbcfe8" },
  { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { color: "#3730a3", bg: "#eef2ff", border: "#c7d2fe" },
  { color: "#b91c1c", bg: "#fff5f5", border: "#fecaca" },
  { color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
];

const AVATAR_GRADS = [
  "linear-gradient(135deg,#B3E0E0,#7fcfcf)",
  "linear-gradient(135deg,#ede9fe,#ddd6fe)",
  "linear-gradient(135deg,#dcfce7,#bbf7d0)",
  "linear-gradient(135deg,#fce7f3,#fbcfe8)",
  "linear-gradient(135deg,#fef9c3,#fde68a)",
];

const initials = (n: string) =>
  n.split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase();

export default function DoctorsPage() {
  const [tab, setTab] = useState<Tab>("doctors");

  const TABS = [
    { id: "doctors" as Tab,  label: "Doctors",  icon: Stethoscope },
    { id: "overview" as Tab, label: "Overview", icon: BarChart2 },
  ];

  return (
    <div className="hd-center">
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${active ? "#0E898F" : "#e2e8f0"}`, background: active ? "#E6F4F4" : "#fff", color: active ? "#0A6B70" : "#64748b", fontSize:12, fontWeight: active ? 600 : 500, cursor: "pointer" }}>
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>
      {tab === "overview" && (
        <div style={{ fontSize:12, color: "#94a3b8", marginBottom: 20 }}>
          Summary of doctor distribution, department breakdown, on-duty stats, and recent additions
        </div>
      )}
      {tab === "doctors"  && <DoctorPanel />}
      {tab === "overview" && <DoctorsOverviewPanel onManageDoctors={() => setTab("doctors")} />}
    </div>
  );
}

// ─── Doctors Overview Panel ───────────────────────────────────────────────────
function DoctorsOverviewPanel({ onManageDoctors }: { onManageDoctors: () => void }) {
  const router = useRouter();
  const [doctors, setDoctors]         = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptCounts, setDeptCounts]   = useState<Record<string, number>>({});
  const [dutyToday, setDutyToday]     = useState<any[]>([]);
  const [stats, setStats]             = useState({ total: 0, active: 0, available: 0, credSent: 0 });
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [listRes, deptRes, dashRes] = await Promise.all([
          api("/api/config/doctors?limit=200"),
          api("/api/config/departments?simple=true"),
          api("/api/dashboard/overview").catch(() => ({ success: false })),
        ]);

        let members: any[] = [];
        if (listRes.success) {
          members = listRes.data?.data || [];
          setDoctors(members.slice(0, 8));

          const counts: Record<string, number> = {};
          members.forEach((d: any) => {
            const key = d.department?.name || "Unassigned";
            counts[key] = (counts[key] || 0) + 1;
          });
          setDeptCounts(counts);

          setStats({
            total:    listRes.data?.pagination?.total ?? members.length,
            active:   members.filter((d: any) => d.isActive).length,
            available: members.filter((d: any) => d.isAvailable).length,
            credSent: members.filter((d: any) => d.credentialsSent).length,
          });
        }

        if (deptRes.success) {
          setDepartments(Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.data || []);
        }

        if (dashRes.success && dashRes.data?.doctorsOnDuty) {
          setDutyToday(dashRes.data.doctorsOnDuty);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "80px 0", color: "#94a3b8" }}>
      <Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} />Loading overview...
    </div>
  );

  const summaryCards = [
    { label: "Total Doctors",      val: stats.total,    icon: <Stethoscope size={20} color="#fff" />, iconBg: "#7c3aed", bg: "#faf5ff" },
    { label: "Active Doctors",     val: stats.active,   icon: <UserCheck size={20} color="#fff" />,   iconBg: "#0E898F", bg: "#E6F4F4" },
    { label: "Available to Book",  val: stats.available, icon: <CheckCircle2 size={20} color="#fff" />,iconBg: "#10b981", bg: "#f0fdf4" },
    { label: "Portal Access Sent", val: stats.credSent, icon: <Send size={20} color="#fff" />,        iconBg: "#f59e0b", bg: "#fffbeb" },
  ];

  const deptEntries = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Light professional header — consistent with inventory tab */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Stethoscope size={22} color="#0E898F" />
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight: 800, color: "#1e293b", marginBottom: 2 }}>Doctors Overview</div>
            <div style={{ fontSize:11, color: "#64748b" }}>
              {stats.total} registered · {stats.active} active · {stats.available} available for booking
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onManageDoctors}
            style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#334155", fontSize:11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Stethoscope size={13} /> Manage Doctors
          </button>
          <button onClick={() => router.push("/hospitaladmin/appointments")}
            style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #B3E0E0", background: "#E6F4F4", color: "#0A6B70", fontSize:11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={13} /> Appointments
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {summaryCards.map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 14, padding: "18px 20px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{c.val}</div>
              <div style={{ fontSize:10, color: "#94a3b8", marginTop: 4 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Department Breakdown */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>Doctors by Department</div>
              <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>Distribution across all departments</div>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={15} color="#7c3aed" />
            </div>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {deptEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize:12 }}>No department data available</div>
            ) : (
              deptEntries.map(([dept, count], idx) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                const palette = DEPT_COLORS[idx % DEPT_COLORS.length];
                return (
                  <div key={dept}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 100, fontSize:10, fontWeight: 700, background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}>
                        {dept}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize:11, fontWeight: 700, color: "#1e293b" }}>{count}</span>
                        <span style={{ fontSize:10, color: "#94a3b8" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: palette.color, borderRadius: 100, transition: "width .5s ease" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recently Added */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>Recently Added</div>
              <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>Latest doctors onboarded</div>
            </div>
            <button onClick={onManageDoctors}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize:10, fontWeight: 600, color: "#7c3aed", background: "#faf5ff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {doctors.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize:12 }}>
                <User size={26} style={{ margin: "0 auto 8px", display: "block", opacity: .3 }} />
                No doctors yet
              </div>
            ) : doctors.map((d: any, idx: number) => (
              <div key={d.id}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f8fafc" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: AVATAR_GRADS[idx % AVATAR_GRADS.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize:12, color: "#0A6B70", flexShrink: 0, overflow: "hidden" }}>
                  {d.profileImage ? <img src={d.profileImage} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(d.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                  <div style={{ fontSize:10, color: "#94a3b8" }}>{d.department?.name || d.specialization || "—"}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize:10, padding: "2px 8px", borderRadius: 100, background: d.isActive ? "#f0fdf4" : "#f8fafc", color: d.isActive ? "#16a34a" : "#94a3b8", fontWeight: 600, border: `1px solid ${d.isActive ? "#bbf7d0" : "#e2e8f0"}` }}>
                    {d.isActive ? "Active" : "Inactive"}
                  </span>
                  <span style={{ fontSize:10, color: "#16a34a", fontWeight: 600 }}>₹{(d.consultationFee || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Doctors on Duty Today */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>Doctors on Duty Today</div>
            <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>{dutyToday.length} doctors with scheduled appointments</div>
          </div>
          <button onClick={() => router.push("/hospitaladmin/appointments")}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize:10, fontWeight: 600, color: "#0E898F", background: "#E6F4F4", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
            View Appointments <ChevronRight size={12} />
          </button>
        </div>
        {dutyToday.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize:12 }}>
            <Stethoscope size={28} style={{ margin: "0 auto 10px", display: "block", opacity: .3 }} />
            No doctors have appointments scheduled today
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Doctor", "Department / Specialization", "First Slot", "Last Slot", "Appointments Today"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dutyToday.map((d: any) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#6d28d9,#0E898F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize:11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {initials(d.name)}
                        </div>
                        <div>
                          <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{d.name}</div>
                          <div style={{ fontSize:10, color: "#94a3b8" }}>{d.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize:10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: "#faf5ff", color: "#7c3aed", border: "1px solid #ede9fe" }}>
                        {d.department || d.specialization || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize:11, color: "#64748b" }}>{d.firstSlot || "—"}</td>
                    <td style={{ padding: "14px 16px", fontSize:11, color: "#64748b" }}>{d.lastSlot || "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontWeight: 800, fontSize:17, color: "#7c3aed" }}>{d.appointmentCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fee Insights */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>Fee Structure Overview</div>
            <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>Consultation fees across active doctors</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {(() => {
            const fees = doctors.filter(d => d.consultationFee > 0).map(d => d.consultationFee);
            const avg  = fees.length ? Math.round(fees.reduce((a, b) => a + b, 0) / fees.length) : 0;
            const min  = fees.length ? Math.min(...fees) : 0;
            const max  = fees.length ? Math.max(...fees) : 0;
            return [
              { label: "Avg. Consultation Fee", val: `₹${avg.toLocaleString()}`, color: "#7c3aed", bg: "#faf5ff", border: "#ede9fe", icon: <IndianRupee size={18} /> },
              { label: "Lowest Fee",             val: `₹${min.toLocaleString()}`, color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", icon: <Activity size={18} /> },
              { label: "Highest Fee",            val: `₹${max.toLocaleString()}`, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: <IndianRupee size={18} /> },
            ].map((c, i) => (
              <div key={i} style={{ padding: "14px 18px", borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ color: c.color }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{c.val}</div>
                  <div style={{ fontSize:10, color: "#94a3b8", marginTop: 3 }}>{c.label}</div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          {
            title: "Add New Doctor",
            desc: "Register a new doctor with full profile and credentials",
            icon: <Stethoscope size={22} color="#fff" />,
            bg: "linear-gradient(135deg,#6d28d9,#7c3aed)",
            action: onManageDoctors,
            label: "Add Doctor",
          },
          {
            title: "Manage Staff",
            desc: "View and manage all non-doctor hospital staff members",
            icon: <Users size={22} color="#fff" />,
            bg: "linear-gradient(135deg,#0E898F,#07595D)",
            action: () => router.push("/hospitaladmin/staff"),
            label: "Go to Staff",
          },
          {
            title: "View Appointments",
            desc: "Check today's appointments and doctor schedules",
            icon: <Calendar size={22} color="#fff" />,
            bg: "linear-gradient(135deg,#10b981,#059669)",
            action: () => router.push("/hospitaladmin/appointments"),
            label: "Appointments",
          },
        ].map((card, i) => (
          <div key={i} style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid #e2e8f0" }}>
            <div style={{ background: card.bg, padding: "20px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {card.icon}
              </div>
              <div style={{ color: "#fff" }}>
                <div style={{ fontSize:14, fontWeight: 700 }}>{card.title}</div>
                <div style={{ fontSize:10, opacity: .8, marginTop: 2 }}>{card.desc}</div>
              </div>
            </div>
            <div style={{ padding: "14px 22px" }}>
              <button onClick={card.action}
                style={{ width: "100%", padding: "9px 0", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#334155", fontSize:11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {card.label} <ChevronRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
