"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Activity, AlertCircle, BedDouble, Heart, RefreshCw, Loader2,
  CheckCircle2, Clock, X, IndianRupee, ClipboardList, Users,
  BarChart2, Layers, Search, ChevronRight, TrendingUp, Shield,
  Thermometer, Zap, FileText, Eye, Plus, UserCheck
} from "lucide-react";

const TYPE_CFG: Record<string, { label: string; g1: string; g2: string; accent: string; light: string; border: string; Icon: any; queueLabel: string }> = {
  ICU:       { label:"Intensive Care Unit", g1:"#ef4444", g2:"#b91c1c", accent:"#b91c1c", light:"#fff5f5", border:"#fecaca", Icon:Heart,       queueLabel:"ICU Patients"     },
  EMERGENCY: { label:"Emergency",           g1:"#f97316", g2:"#c2410c", accent:"#c2410c", light:"#fff7ed", border:"#fed7aa", Icon:Zap,         queueLabel:"Emergency Queue"   },
  IPD:       { label:"In-Patient Dept",     g1:"#3b82f6", g2:"#1d4ed8", accent:"#1d4ed8", light:"#eff6ff", border:"#bfdbfe", Icon:BedDouble,   queueLabel:"Admitted Patients" },
};
const DEF = TYPE_CFG.ICU;

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; border: string }> = {
  SCHEDULED:  { label:"Admitted",    bg:"#eff6ff", color:"#2563eb", border:"#bfdbfe" },
  CONFIRMED:  { label:"Under Care",  bg:"#fffbeb", color:"#b45309", border:"#fde68a" },
  COMPLETED:  { label:"Discharged",  bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" },
  CANCELLED:  { label:"Transferred", bg:"#faf5ff", color:"#7c3aed", border:"#ddd6fe" },
  NO_SHOW:    { label:"Missed",      bg:"#f8fafc", color:"#64748b", border:"#e2e8f0" },
};

const fmt     = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtTime = (t?: string) => t ? t.slice(0, 5) : "—";

export default function CriticalCareDashboard({ profile, user, activeTab, onTabChange }: { profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void }) {
  const c = TYPE_CFG[profile?.type] || DEF;
  const { Icon } = c;

  const [tab, setTab]       = useState<"overview"|"patients"|"records"|"reports"|"dept">((activeTab as any) || "overview");
  useEffect(() => { if (activeTab) setTab(activeTab as any); }, [activeTab]);
  const switchTab = (t: string) => { setTab(t as any); onTabChange?.(t); };
  const [queue, setQueue]   = useState<any[]>([]);
  const [done,  setDone]    = useState<any[]>([]);
  const [qLoad, setQLoad]   = useState(false);
  const [recs,  setRecs]    = useState<any[]>([]);
  const [rMeta, setRMeta]   = useState<any>({});
  const [rLoad, setRLoad]   = useState(false);
  const [repData, setRepData] = useState<any>(null);
  const [repLoad, setRepLoad] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadQueue = useCallback(async () => {
    setQLoad(true);
    const d = await fetch("/api/subdept/queue", { credentials: "include" }).then(r => r.json());
    if (d.success) { setQueue(d.data?.queue || []); setDone(d.data?.completedList || []); }
    setQLoad(false);
  }, []);

  const loadRecords = useCallback(async () => {
    setRLoad(true);
    const d = await fetch("/api/subdept/records?limit=30", { credentials: "include" }).then(r => r.json());
    if (d.success) { setRecs(d.data?.data || []); setRMeta(d.data?.stats || {}); }
    setRLoad(false);
  }, []);

  const loadReports = useCallback(async () => {
    setRepLoad(true);
    const d = await fetch("/api/subdept/reports", { credentials: "include" }).then(r => r.json());
    if (d.success) setRepData(d.data);
    setRepLoad(false);
  }, []);

  useEffect(() => {
    if (tab === "overview")  { loadQueue(); loadRecords(); }
    if (tab === "patients")  loadQueue();
    if (tab === "records")   loadRecords();
    if (tab === "reports")   loadReports();
  }, [tab]); // eslint-disable-line

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/appointments/${id}`, { method:"PUT", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) });
    await loadQueue();
    setUpdating(null);
  };

  const todayRev  = recs.filter(r => new Date(r.performedAt).toDateString() === new Date().toDateString()).reduce((s,r) => s+(r.amount||0), 0);
  const active    = queue.filter(q => ["SCHEDULED","CONFIRMED"].includes(q.status)).length;
  const critical  = queue.filter(q => q.status === "SCHEDULED").length;
  const dischargedToday = done.filter(d => d.status === "COMPLETED").length;

  const filtered = [...queue, ...done].filter(p =>
    !search || (p.patient?.name||"").toLowerCase().includes(search.toLowerCase()) ||
    String(p.tokenNumber||"").includes(search)
  );

  const TABS = [
    { id:"overview",  label:"Overview",      icon:<BarChart2 size={13}/> },
    { id:"patients",  label:c.queueLabel,    icon:<Users size={13}/>, badge:queue.length||null },
    { id:"records",   label:"Treatment Records", icon:<ClipboardList size={13}/>, badge:rMeta.todayRecords||null },
    { id:"reports",   label:"Reports",       icon:<TrendingUp size={13}/> },
    { id:"dept",      label:"Department",    icon:<Layers size={13}/> },
  ];

  return (
    <>
      <style>{`
        .cc-tabs{display:flex;gap:4px;padding:0 0 16px;border-bottom:1px solid #f1f5f9;margin-bottom:20px;flex-wrap:wrap}
        .cc-tab{padding:7px 14px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .15s;position:relative}
        .cc-tab.on{background:${c.light};border-color:${c.border};color:${c.accent}}
        .cc-tab:hover:not(.on){background:#f8fafc}
        .cc-badge{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;border-radius:8px;background:${c.accent};color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 3px}
        .cc-sc{background:#fff;border-radius:14px;padding:16px 18px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:12px}
        .cc-sc-ic{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .cc-sc-lbl{font-size:10px;color:#94a3b8;font-weight:500;margin-bottom:2px}
        .cc-sc-val{font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
        .cc-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:16px}
        .cc-card-hd{padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
        .cc-card-title{font-size:12.5px;font-weight:700;color:#1e293b}
        .cc-tbl{width:100%;border-collapse:collapse}
        .cc-tbl th{text-align:left;font-size:9.5px;font-weight:700;color:#94a3b8;padding:8px 12px;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.04em}
        .cc-tbl td{padding:10px 12px;font-size:11.5px;color:#475569;border-bottom:1px solid #f8fafc}
        .cc-tbl tr:last-child td{border-bottom:none}
        .cc-tbl tbody tr:hover td{background:#fafafa}
        .cc-status{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:9px;font-weight:700}
        .cc-btn{padding:5px 11px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid;transition:all .15s;display:inline-flex;align-items:center;gap:4px}
        .cc-section{font-size:12.5px;font-weight:700;color:#1e293b;margin-bottom:12px;display:flex;align-items:center;gap:8px}
        .cc-dot{width:4px;height:16px;border-radius:4px;background:linear-gradient(180deg,${c.g1},${c.g2});flex-shrink:0}
        .cc-empty{text-align:center;padding:36px;color:#94a3b8;font-size:12px}
        .cc-search{display:flex;align-items:center;gap:7px;background:${c.light};border:1.5px solid ${c.border};border-radius:9px;padding:7px 12px;width:220px}
        .cc-search input{background:none;border:none;outline:none;font-size:12px;color:#334155;width:100%}
        @keyframes cc-spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Banner */}
      <div style={{ background:`linear-gradient(135deg,${c.g1},${c.g2})`, borderRadius:16, padding:"18px 24px", marginBottom:20, display:"flex", alignItems:"center", gap:16, color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-20, top:-20, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.06)" }} />
        <div style={{ width:50, height:50, borderRadius:13, background:"rgba(255,255,255,.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon size={24} color="#fff" />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-.01em" }}>{profile?.name || c.label}</div>
          <div style={{ fontSize:11, opacity:.8, marginTop:2 }}>{c.label} · Sub-Department Dashboard</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {[
            { val:active,           lbl:"Active"    },
            { val:critical,         lbl:"Critical"  },
            { val:dischargedToday,  lbl:"Discharged"},
          ].map((s,i) => (
            <div key={i} style={{ textAlign:"center", background:"rgba(255,255,255,.15)", borderRadius:10, padding:"8px 14px" }}>
              <div style={{ fontSize:18, fontWeight:800 }}>{s.val}</div>
              <div style={{ fontSize:9, opacity:.8, textTransform:"uppercase", letterSpacing:".06em" }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === "overview" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
            {[
              { lbl:"Active Patients",   val:qLoad?"—":active,           ic:<Users size={18}/>,        bg:c.light,   col:c.accent },
              { lbl:"Critical Cases",    val:qLoad?"—":critical,          ic:<AlertCircle size={18}/>,  bg:"#fff5f5",  col:"#ef4444" },
              { lbl:"Discharged Today",  val:qLoad?"—":dischargedToday,   ic:<CheckCircle2 size={18}/>, bg:"#f0fdf4",  col:"#15803d" },
              { lbl:"Today Revenue",     val:`₹${todayRev.toLocaleString("en-IN")}`, ic:<IndianRupee size={18}/>, bg:"#faf5ff", col:"#7c3aed" },
            ].map((s,i) => (
              <div key={i} className="cc-sc">
                <div className="cc-sc-ic" style={{ background:s.bg }}><span style={{ color:s.col }}>{s.ic}</span></div>
                <div><div className="cc-sc-lbl">{s.lbl}</div><div className="cc-sc-val">{s.val}</div></div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div className="cc-card">
              <div className="cc-card-hd">
                <span className="cc-card-title">Active Patients</span>
                <button onClick={() => setTab("patients")} style={{ fontSize:11, color:c.accent, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:3, fontWeight:600 }}>
                  View all <ChevronRight size={11} />
                </button>
              </div>
              <table className="cc-tbl">
                <thead><tr><th>#</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>
                  {qLoad ? <tr><td colSpan={5} className="cc-empty"><Loader2 size={14} style={{ animation:"cc-spin .7s linear infinite", verticalAlign:"middle" }} /></td></tr>
                  : queue.length === 0 ? <tr><td colSpan={5} className="cc-empty">No active patients</td></tr>
                  : queue.slice(0,5).map((q:any) => {
                    const st = STATUS_MAP[q.status] || STATUS_MAP.SCHEDULED;
                    return (
                      <tr key={q.id}>
                        <td style={{ fontWeight:800, color:c.accent, fontSize:12 }}>#{q.tokenNumber||"—"}</td>
                        <td><div style={{ fontWeight:600, color:"#1e293b", fontSize:12 }}>{q.patient?.name||"—"}</div></td>
                        <td style={{ color:"#64748b", fontSize:11 }}>Dr. {q.doctor?.name?.split(" ").pop()||"—"}</td>
                        <td>{fmtTime(q.timeSlot)}</td>
                        <td><span className="cc-status" style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>{st.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="cc-card">
              <div className="cc-card-hd">
                <span className="cc-card-title">Recent Procedures</span>
                <button onClick={() => setTab("records")} style={{ fontSize:11, color:c.accent, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:3, fontWeight:600 }}>
                  View all <ChevronRight size={11} />
                </button>
              </div>
              <table className="cc-tbl">
                <thead><tr><th>Patient</th><th>Procedure</th><th>Amount</th><th>Date</th></tr></thead>
                <tbody>
                  {rLoad ? <tr><td colSpan={4} className="cc-empty"><Loader2 size={14} style={{ animation:"cc-spin .7s linear infinite", verticalAlign:"middle" }} /></td></tr>
                  : recs.length === 0 ? <tr><td colSpan={4} className="cc-empty">No records</td></tr>
                  : recs.slice(0,5).map((r:any) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight:600, color:"#1e293b", fontSize:12 }}>{r.patient?.name||"—"}</td>
                      <td style={{ color:"#64748b", fontSize:11 }}>{r.procedure?.name||"—"}</td>
                      <td style={{ fontWeight:700, color:c.accent }}>₹{r.amount||0}</td>
                      <td style={{ color:"#94a3b8", fontSize:11 }}>{r.performedAt ? fmt(r.performedAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══ PATIENTS ══ */}
      {tab === "patients" && (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div className="cc-section"><div className="cc-dot"/>{c.queueLabel}
              <span style={{ fontSize:10, background:c.light, color:c.accent, padding:"2px 8px", borderRadius:100, border:`1px solid ${c.border}`, fontWeight:700, marginLeft:4 }}>{queue.length} active</span>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div className="cc-search"><Search size={12} color="#94a3b8" /><input placeholder="Search patient…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <button onClick={loadQueue} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#fff", fontSize:11, color:"#64748b", cursor:"pointer", fontWeight:600 }}>
                <RefreshCw size={12} style={qLoad ? { animation:"cc-spin .7s linear infinite" } : {}} />
              </button>
            </div>
          </div>

          <div className="cc-card">
            <table className="cc-tbl">
              <thead><tr><th>#</th><th>Patient</th><th>Referring Doctor</th><th>Time</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {qLoad ? <tr><td colSpan={7} className="cc-empty"><Loader2 size={14} style={{ animation:"cc-spin .7s linear infinite", verticalAlign:"middle" }} /> Loading…</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={7} className="cc-empty">No patients found</td></tr>
                : filtered.map((q:any) => {
                  const st = STATUS_MAP[q.status] || STATUS_MAP.SCHEDULED;
                  const isPending = ["SCHEDULED","CONFIRMED"].includes(q.status);
                  return (
                    <tr key={q.id}>
                      <td style={{ fontWeight:800, color:c.accent }}>#{q.tokenNumber||"—"}</td>
                      <td><div style={{ fontWeight:600, color:"#1e293b", fontSize:12 }}>{q.patient?.name||"—"}</div><div style={{ fontSize:10, color:"#94a3b8" }}>{q.patient?.patientId}</div></td>
                      <td style={{ color:"#64748b", fontSize:11 }}>Dr. {q.doctor?.name||"—"}</td>
                      <td style={{ fontWeight:600 }}>{fmtTime(q.timeSlot)}</td>
                      <td style={{ fontSize:11, color:"#64748b", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.subDeptNote||"—"}</td>
                      <td><span className="cc-status" style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>{st.label}</span></td>
                      <td>
                        <div style={{ display:"flex", gap:4 }}>
                          {q.status === "SCHEDULED" && (
                            <button className="cc-btn" disabled={updating===q.id} onClick={() => updateStatus(q.id,"CONFIRMED")}
                              style={{ background:c.light, color:c.accent, borderColor:c.border }}>
                              {updating===q.id ? <Loader2 size={10} style={{ animation:"cc-spin .7s linear infinite" }} /> : "Admit"}
                            </button>
                          )}
                          {q.status === "CONFIRMED" && (
                            <button className="cc-btn" disabled={updating===q.id} onClick={() => updateStatus(q.id,"COMPLETED")}
                              style={{ background:"#f0fdf4", color:"#15803d", borderColor:"#bbf7d0" }}>
                              {updating===q.id ? <Loader2 size={10} style={{ animation:"cc-spin .7s linear infinite" }} /> : "Discharge"}
                            </button>
                          )}
                          {!isPending && <span style={{ fontSize:10, color:"#94a3b8", fontStyle:"italic" }}>—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══ RECORDS ══ */}
      {tab === "records" && (
        <>
          <div className="cc-section" style={{ marginBottom:16 }}><div className="cc-dot"/>Treatment Records</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
            {[
              { lbl:"Today's Records", val:rMeta.todayRecords||0,  bg:c.light,   col:c.accent },
              { lbl:"Total Records",   val:rMeta.total||0,          bg:"#eff6ff",  col:"#2563eb" },
              { lbl:"Today Revenue",   val:`₹${(rMeta.todayRevenue||0).toLocaleString("en-IN")}`, bg:"#f0fdf4", col:"#15803d" },
              { lbl:"Total Revenue",   val:`₹${(rMeta.totalRevenue||0).toLocaleString("en-IN")}`, bg:"#faf5ff", col:"#7c3aed" },
            ].map((s,i) => (
              <div key={i} style={{ background:s.bg, borderRadius:12, padding:"14px 16px", border:`1px solid ${s.col}22` }}>
                <div style={{ fontSize:18, fontWeight:800, color:s.col }}>{s.val}</div>
                <div style={{ fontSize:10, color:s.col, opacity:.8, marginTop:2, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:".05em" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
          <div className="cc-card">
            <table className="cc-tbl">
              <thead><tr><th>Patient</th><th>Procedure</th><th>Performed By</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {rLoad ? <tr><td colSpan={6} className="cc-empty"><Loader2 size={14} style={{ animation:"cc-spin .7s linear infinite", verticalAlign:"middle" }} /> Loading…</td></tr>
                : recs.length === 0 ? <tr><td colSpan={6} className="cc-empty">No records found</td></tr>
                : recs.map((r:any) => (
                  <tr key={r.id}>
                    <td><div style={{ fontWeight:600, color:"#1e293b", fontSize:12 }}>{r.patient?.name||"—"}</div><div style={{ fontSize:10, color:"#94a3b8" }}>{r.patient?.patientId}</div></td>
                    <td style={{ color:"#475569" }}>{r.procedure?.name||"—"}</td>
                    <td style={{ color:"#64748b", fontSize:11 }}>{r.performedBy||"—"}</td>
                    <td style={{ color:"#94a3b8", fontSize:11 }}>{r.performedAt ? fmt(r.performedAt) : "—"}</td>
                    <td style={{ fontWeight:700, color:c.accent }}>₹{r.amount||0}</td>
                    <td><span className="cc-status" style={{ background:"#f0fdf4", color:"#15803d", border:"1px solid #bbf7d0" }}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══ REPORTS ══ */}
      {tab === "reports" && (
        <>
          <div className="cc-section"><div className="cc-dot"/>Analytics & Reports</div>
          {repLoad ? <div className="cc-empty"><Loader2 size={20} style={{ animation:"cc-spin .7s linear infinite", display:"block", margin:"0 auto 10px" }} /><div>Loading…</div></div>
          : !repData ? <div className="cc-empty"><BarChart2 size={36} style={{ display:"block", margin:"0 auto 10px", opacity:.2 }} /><div>No data yet</div></div>
          : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div className="cc-card">
                <div className="cc-card-hd"><span className="cc-card-title">Procedure Summary</span></div>
                <div style={{ padding:"12px 16px" }}>
                  {(repData.procedureBreakdown||[]).slice(0,8).map((p:any,i:number) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f8fafc" }}>
                      <span style={{ fontSize:12, color:"#475569" }}>{p.name||p.procedure}</span>
                      <div style={{ display:"flex", gap:8 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:c.accent }}>₹{(p.revenue||0).toLocaleString("en-IN")}</span>
                        <span style={{ fontSize:10, color:"#94a3b8" }}>{p.count}</span>
                      </div>
                    </div>
                  ))}
                  {!repData.procedureBreakdown?.length && <div style={{ textAlign:"center", padding:20, color:"#94a3b8", fontSize:12 }}>No data</div>}
                </div>
              </div>
              <div className="cc-card">
                <div className="cc-card-hd"><span className="cc-card-title">Revenue Summary</span></div>
                <div style={{ padding:"12px 16px" }}>
                  {[
                    { lbl:"Today",      val:repData.revenue?.today||0 },
                    { lbl:"This Week",  val:repData.revenue?.thisWeek||0 },
                    { lbl:"This Month", val:repData.revenue?.thisMonth||0 },
                    { lbl:"Total",      val:repData.revenue?.total||0 },
                  ].map((r,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #f8fafc" }}>
                      <span style={{ fontSize:12, color:"#475569" }}>{r.lbl}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:c.accent }}>₹{r.val.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ DEPT ══ */}
      {tab === "dept" && (
        <>
          <div className="cc-section"><div className="cc-dot"/>Department Information</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div className="cc-card">
              <div className="cc-card-hd"><span className="cc-card-title">Basic Details</span></div>
              <div style={{ padding:"12px 16px" }}>
                {[["Name",profile?.name],["Type",profile?.type?.replace(/_/g," ")],["Code",profile?.code],["Login Email",profile?.loginEmail||user?.email],["Status",profile?.isActive?"Active":"Inactive"]].map(([k,v]) => v ? (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f8fafc" }}>
                    <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{k}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:k==="Status"?(profile?.isActive?"#16a34a":"#ef4444"):"#1e293b" }}>{v as string}</span>
                  </div>
                ) : null)}
              </div>
            </div>
            <div className="cc-card">
              <div className="cc-card-hd"><span className="cc-card-title">Head of Department</span></div>
              <div style={{ padding:"12px 16px" }}>
                {profile?.hodName ? (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, padding:"12px", background:c.light, borderRadius:10, border:`1px solid ${c.border}` }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${c.g1},${c.g2})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, color:"#fff", flexShrink:0 }}>
                        {(profile.hodName||"H").split(" ").map((x:string)=>x[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div><div style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{profile.hodName}</div><div style={{ fontSize:10, color:"#94a3b8" }}>Head of Department</div></div>
                    </div>
                    {profile.hodEmail && <div style={{ fontSize:12, color:"#475569", padding:"6px 0" }}>📧 {profile.hodEmail}</div>}
                    {profile.hodPhone && <div style={{ fontSize:12, color:"#475569", padding:"6px 0" }}>📞 {profile.hodPhone}</div>}
                  </>
                ) : <div style={{ textAlign:"center", padding:24, color:"#94a3b8", fontSize:12 }}>No HOD assigned</div>}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
