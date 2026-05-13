"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Search, RefreshCw, Loader2, X, Check, AlertTriangle, Clock,
  BarChart2, Users, ChevronDown, ChevronUp, CheckCircle2, Plus,
  ClipboardList, Calendar, User, Bell, Eye, FileText, BedDouble,
  Sparkles, ShieldCheck, AlertCircle, Filter
} from "lucide-react";

const ACCENT = "#c2410c";
const LIGHT_BG = "#fff7ed";
const BORDER = "#fed7aa";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

export default function HousekeepingDashboard({ profile, user }: { profile: any; user: any }) {
  const [tab, setTab] = useState<"overview" | "rooms" | "tasks" | "schedule" | "complaints" | "audit" | "reports">("overview");
  const [loading, setLoading] = useState(false);

  // Tasks
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");

  // Rooms
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    const res = await api("/api/config/inventory?search=room&limit=50");
    if (res.success) setRooms(res.data?.data || []);
    setRoomsLoading(false);
  }, []);

  useEffect(() => { if (tab === "rooms" || tab === "overview") loadRooms(); }, [tab, loadRooms]);

  return (
    <>
      <style>{hkStyles}</style>

      <div className="hk-nav">
        {([
          { id: "overview", label: "Overview", Icon: BarChart2 },
          { id: "rooms", label: "Room Status", Icon: BedDouble },
          { id: "tasks", label: "Task Assignment", Icon: ClipboardList },
          { id: "schedule", label: "Schedule", Icon: Calendar },
          { id: "complaints", label: "Complaints", Icon: AlertCircle },
          { id: "audit", label: "Audit Checklist", Icon: ShieldCheck },
          { id: "reports", label: "Reports", Icon: FileText },
        ] as const).map(t => (
          <button key={t.id} className={`hk-nav-btn${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            <t.Icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="hk-section">
          <div className="hk-stats-grid">
            <div className="hk-stat-card">
              <div className="hk-stat-icon" style={{ background: LIGHT_BG }}><BedDouble size={18} color={ACCENT} /></div>
              <div className="hk-stat-info">
                <div className="hk-stat-value">{rooms.length}</div>
                <div className="hk-stat-label">Total Rooms</div>
              </div>
            </div>
            <div className="hk-stat-card">
              <div className="hk-stat-icon" style={{ background: "#f0fdf4" }}><CheckCircle2 size={18} color="#16a34a" /></div>
              <div className="hk-stat-info">
                <div className="hk-stat-value">0</div>
                <div className="hk-stat-label">Clean & Ready</div>
              </div>
            </div>
            <div className="hk-stat-card">
              <div className="hk-stat-icon" style={{ background: "#fff7ed" }}><Clock size={18} color="#ea580c" /></div>
              <div className="hk-stat-info">
                <div className="hk-stat-value">{tasks.filter(t => t.status !== "COMPLETED").length}</div>
                <div className="hk-stat-label">Pending Tasks</div>
              </div>
            </div>
            <div className="hk-stat-card">
              <div className="hk-stat-icon" style={{ background: "#fff5f5" }}><AlertTriangle size={18} color="#ef4444" /></div>
              <div className="hk-stat-info">
                <div className="hk-stat-value">0</div>
                <div className="hk-stat-label">Open Complaints</div>
              </div>
            </div>
          </div>

          <div className="hk-quick-grid">
            <button className="hk-quick-btn" onClick={() => setTab("rooms")}><BedDouble size={20} color={ACCENT} /><span>Room Status Board</span></button>
            <button className="hk-quick-btn" onClick={() => setTab("tasks")}><ClipboardList size={20} color="#6366f1" /><span>Assign Cleaning Task</span></button>
            <button className="hk-quick-btn" onClick={() => setTab("schedule")}><Calendar size={20} color="#16a34a" /><span>Daily Schedule</span></button>
            <button className="hk-quick-btn" onClick={() => setTab("audit")}><ShieldCheck size={20} color="#0E898F" /><span>Audit Checklist</span></button>
          </div>
        </div>
      )}

      {/* Room Status */}
      {tab === "rooms" && (
        <div className="hk-section">
          <div className="hk-toolbar">
            <div className="hk-chart-title">Room / Bed Status</div>
            <button className="hk-btn-ghost" onClick={loadRooms}><RefreshCw size={13} /> Refresh</button>
          </div>
          {roomsLoading ? (
            <div className="hk-loading"><Loader2 size={20} className="hk-spin" /> Loading rooms...</div>
          ) : (
            <div className="hk-empty">
              <BedDouble size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>Room status board</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Room status tracking (Clean / Dirty / Occupied / Ready) will be managed here. Connect with the ward/bed management module for real-time updates.</div>
            </div>
          )}
        </div>
      )}

      {/* Tasks */}
      {tab === "tasks" && (
        <div className="hk-section">
          <div className="hk-toolbar">
            <div className="hk-chart-title">Cleaning Task Assignment</div>
            <button className="hk-btn-primary"><Plus size={13} /> Assign Task</button>
          </div>
          <div className="hk-empty">
            <ClipboardList size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Cleaning task management</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Assign staff to rooms, track task status (Pending / In Progress / Completed)</div>
          </div>
        </div>
      )}

      {/* Schedule */}
      {tab === "schedule" && (
        <div className="hk-section">
          <div className="hk-toolbar"><div className="hk-chart-title">Daily Cleaning Schedule</div></div>
          <div className="hk-empty">
            <Calendar size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Schedule management</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Daily cleaning schedules with ICU / OT priority cleaning support</div>
          </div>
        </div>
      )}

      {/* Complaints */}
      {tab === "complaints" && (
        <div className="hk-section">
          <div className="hk-toolbar"><div className="hk-chart-title">Complaint Management</div></div>
          <div className="hk-empty">
            <AlertCircle size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>No complaints</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Patient complaints about room cleanliness will appear here</div>
          </div>
        </div>
      )}

      {/* Audit */}
      {tab === "audit" && (
        <div className="hk-section">
          <div className="hk-toolbar"><div className="hk-chart-title">Hygiene Audit Checklist</div></div>
          <div className="hk-empty">
            <ShieldCheck size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Audit compliance tracking</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Hygiene checklist compliance and inspection records</div>
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === "reports" && (
        <div className="hk-section">
          <div className="hk-toolbar"><div className="hk-chart-title">Reports</div></div>
          <div className="hk-empty">
            <FileText size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Cleaning logs and staff performance reports</div>
          </div>
        </div>
      )}
    </>
  );
}

const hkStyles = `
  .hk-nav{display:flex;gap:0;padding:6px 0;margin-bottom:20px;border-bottom:2px solid #f1f5f9;flex-wrap:wrap}
  .hk-nav-btn{padding:9px 16px;border:none;background:none;color:#64748b;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;white-space:nowrap}
  .hk-nav-btn:hover{color:#334155;background:#f8fafc}
  .hk-nav-btn.on{color:${ACCENT};border-bottom-color:${ACCENT};background:${LIGHT_BG}}
  .hk-section{animation:hkFadeIn .2s ease}
  @keyframes hkFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  .hk-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px}
  .hk-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;transition:all .15s}
  .hk-stat-card:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(194,65,12,.08)}
  .hk-stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .hk-stat-info{min-width:0}
  .hk-stat-value{font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
  .hk-stat-label{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px}
  .hk-quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
  .hk-quick-btn{display:flex;align-items:center;gap:10px;padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;cursor:pointer;font-size:13px;font-weight:600;color:#334155;transition:all .15s}
  .hk-quick-btn:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(194,65,12,.08);transform:translateY(-1px)}
  .hk-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}
  .hk-chart-title{font-size:14px;font-weight:700;color:#1e293b}
  .hk-btn-primary{padding:9px 18px;border-radius:9px;border:none;background:${ACCENT};color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap}
  .hk-btn-primary:hover{opacity:.9;transform:translateY(-1px)}
  .hk-btn-ghost{padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px}
  .hk-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}
  .hk-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:13px}
  .hk-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:13px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;display:flex;flex-direction:column;align-items:center}
  @keyframes hkSpin{to{transform:rotate(360deg)}}
  .hk-spin{animation:hkSpin .7s linear infinite}
`;
