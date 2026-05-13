"use client";
import React, { useEffect, useState, useCallback } from "react";
import { BookingWizard } from "@/components/AppointmentPanel";
import {
  Stethoscope, Users, RefreshCw, Loader2,
  CheckCircle2, Clock,
  BarChart2, Search, TrendingUp,
  FileText, UserCheck, Building2,
  AlertCircle, CheckCheck, Timer, User2, ArrowRight,
  CalendarDays, UserPlus, ClipboardList,
  Phone, X, ChevronDown, ChevronUp, Edit3, Check
} from "lucide-react";

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string; Icon: any }> = {
  SCHEDULED:  { label:"Waiting",        bg:"#eff6ff", color:"#2563eb", border:"#bfdbfe", Icon:Clock       },
  CONFIRMED:  { label:"In Consultation", bg:"#fffbeb", color:"#b45309", border:"#fde68a", Icon:Timer       },
  COMPLETED:  { label:"Completed",      bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0", Icon:CheckCheck  },
  CANCELLED:  { label:"Cancelled",      bg:"#fff5f5", color:"#ef4444", border:"#fecaca", Icon:AlertCircle },
  NO_SHOW:    { label:"No Show",        bg:"#f8fafc", color:"#64748b", border:"#e2e8f0", Icon:User2       },
  RESCHEDULED:{ label:"Rescheduled",    bg:"#fef3c7", color:"#92400e", border:"#fcd34d", Icon:CalendarDays},
};

const fmt     = (d: string) => new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"2-digit" });
const fmtTime = (t?: string) => t ? t.slice(0,5) : "—";
const todayISO = () => new Date().toISOString().slice(0,10);

const BLANK_PT = { name:"", phone:"", email:"", gender:"MALE", dateOfBirth:"", bloodGroup:"", address:"" };

export default function OPDDashboard({ profile, user, activeTab, onTabChange, meta: parentMeta }: {
  profile: any; user: any; activeTab?: string; onTabChange?: (t: string) => void; meta?: any
}) {
  const m = parentMeta || { gradient:"linear-gradient(135deg,#0E898F,#07595D)", accent:"#0E898F", lightBg:"#E6F4F4", borderColor:"#B3E0E0" };
  const Icon = profile?.type === "GENERAL_MEDICINE" ? Stethoscope : Building2;

  const [tab, setTab] = useState<string>((activeTab as any) || "overview");
  useEffect(() => { if (activeTab) setTab(activeTab); }, [activeTab]);
  const switchTab = (t: string) => { setTab(t); onTabChange?.(t); };

  /* ── Queue/Token state ── */
  const [queue,    setQueue]    = useState<any[]>([]);
  const [done,     setDone]     = useState<any[]>([]);
  const [qLoad,    setQLoad]    = useState(false);
  const [updating, setUpdating] = useState<string|null>(null);
  const [qSearch,  setQSearch]  = useState("");
  const [qExpand,  setQExpand]  = useState<string|null>(null);

  /* ── Appointments state ── */
  const [appts,      setAppts]      = useState<any[]>([]);
  const [apptLoad,   setApptLoad]   = useState(false);
  const [apptDate,   setApptDate]   = useState(todayISO());
  const [apptStatus, setApptStatus] = useState("ALL");
  const [apptSearch, setApptSearch] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [apptExpand, setApptExpand] = useState<string|null>(null);

  /* ── Patients state ── */
  const [ptSearch, setPtSearch]   = useState("");
  const [ptResults,setPtResults]  = useState<any[]>([]);
  const [ptLoad,   setPtLoad]     = useState(false);
  const [ptView,   setPtView]     = useState<any>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [regForm,  setRegForm]    = useState({...BLANK_PT});
  const [regSaving,setRegSaving]  = useState(false);
  const [regMsg,   setRegMsg]     = useState("");

  /* ── Consultations state ── */
  const [consults,   setConsults]   = useState<any[]>([]);
  const [consLoad,   setConsLoad]   = useState(false);
  const [consExpand, setConsExpand] = useState<string|null>(null);
  const [noteEdit,   setNoteEdit]   = useState<{id:string;val:string}|null>(null);
  const [noteSaving, setNoteSaving] = useState(false);

  /* ── Records state ── */
  const [recs,    setRecs]    = useState<any[]>([]);
  const [rMeta,   setRMeta]   = useState<any>({});
  const [rLoad,   setRLoad]   = useState(false);
  const [rSearch, setRSearch] = useState("");

  /* ── Reports state ── */
  const [repData, setRepData] = useState<any>(null);
  const [repLoad, setRepLoad] = useState(false);

  /* ── API helpers ── */
  const loadQueue = useCallback(async () => {
    setQLoad(true);
    const d = await fetch("/api/subdept/queue", { credentials:"include" }).then(r=>r.json()).catch(()=>({}));
    if (d.success) { setQueue(d.data?.queue||[]); setDone(d.data?.completedList||[]); }
    setQLoad(false);
  }, []);

  const loadAppts = useCallback(async (date: string, status: string) => {
    setApptLoad(true);
    const qs = `date=${date}${status!=="ALL"?`&status=${status}`:""}&limit=100`;
    const d = await fetch(`/api/appointments?${qs}`, { credentials:"include" }).then(r=>r.json()).catch(()=>({}));
    if (d.success) setAppts(Array.isArray(d.data) ? d.data : (d.data?.data||d.data?.appointments||[]));
    setApptLoad(false);
  }, []);

  const searchPatients = useCallback(async (q: string) => {
    if (!q.trim()) { setPtResults([]); return; }
    setPtLoad(true);
    const d = await fetch(`/api/patients?search=${encodeURIComponent(q)}&limit=20`, { credentials:"include" }).then(r=>r.json()).catch(()=>({}));
    setPtResults(Array.isArray(d.data) ? d.data : (d.data?.patients||d.data?.data||[]));
    setPtLoad(false);
  }, []);

  const loadConsults = useCallback(async () => {
    setConsLoad(true);
    const d = await fetch(`/api/appointments?date=${todayISO()}&status=COMPLETED&limit=50`, { credentials:"include" }).then(r=>r.json()).catch(()=>({}));
    setConsults(Array.isArray(d.data) ? d.data : (d.data?.data||d.data?.appointments||[]));
    setConsLoad(false);
  }, []);

  const loadRecords = useCallback(async (s="") => {
    setRLoad(true);
    const d = await fetch(`/api/subdept/records?limit=50${s?`&search=${encodeURIComponent(s)}`:""}`, { credentials:"include" }).then(r=>r.json()).catch(()=>({}));
    if (d.success) { setRecs(d.data?.data||[]); setRMeta(d.data?.stats||{}); }
    setRLoad(false);
  }, []);

  const loadReports = useCallback(async () => {
    setRepLoad(true);
    const d = await fetch("/api/subdept/reports", { credentials:"include" }).then(r=>r.json()).catch(()=>({}));
    if (d.success) setRepData(d.data);
    setRepLoad(false);
  }, []);

  useEffect(() => {
    if (tab==="overview")      { loadQueue(); loadRecords(); }
    if (tab==="appointments")  loadAppts(apptDate, apptStatus);
    if (tab==="queue")         loadQueue();
    if (tab==="consultations") loadConsults();
    if (tab==="records")       loadRecords();
    if (tab==="reports")       loadReports();
  }, [tab]); // eslint-disable-line

  useEffect(() => { if (tab==="appointments") loadAppts(apptDate, apptStatus); }, [apptDate, apptStatus]); // eslint-disable-line

  const updateStatus = async (id: string, status: string, reload: ()=>void) => {
    setUpdating(id);
    await fetch(`/api/appointments/${id}`, { method:"PUT", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status }) });
    reload();
    setUpdating(null);
  };

  const registerPatient = async () => {
    if (!regForm.name || !regForm.phone) { setRegMsg("Name and phone are required."); return; }
    setRegSaving(true); setRegMsg("");
    const d = await fetch("/api/patients", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify(regForm) }).then(r=>r.json()).catch(()=>({}));
    if (d.success||d.data) {
      setRegMsg(`✓ Patient registered: ${d.data?.patientId||""}`);
      setRegForm({...BLANK_PT});
      setPtResults(prev=>[d.data,...prev].slice(0,20));
    } else { setRegMsg(d.message||"Registration failed"); }
    setRegSaving(false);
  };

  const saveNote = async (id: string, notes: string) => {
    setNoteSaving(true);
    await fetch(`/api/appointments/${id}`, { method:"PUT", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ notes }) });
    setConsults(prev => prev.map(c => c.id===id ? {...c, notes} : c));
    setNoteEdit(null);
    setNoteSaving(false);
  };

  /* ── Derived ── */
  const qWaiting   = queue.filter(q => q.status==="SCHEDULED").length;
  const qInConsult = queue.filter(q => q.status==="CONFIRMED").length;
  const qDone      = [...queue,...done].filter(q => q.status==="COMPLETED").length;
  const qTotal     = queue.length + done.length;

  const fQueue = queue.filter(q => !qSearch ||
    (q.patient?.name||"").toLowerCase().includes(qSearch.toLowerCase()) ||
    String(q.tokenNumber||"").includes(qSearch) ||
    (q.patient?.patientId||"").toLowerCase().includes(qSearch.toLowerCase())
  );
  const fAppts = appts.filter(a => !apptSearch ||
    (a.patient?.name||"").toLowerCase().includes(apptSearch.toLowerCase()) ||
    (a.patient?.patientId||"").toLowerCase().includes(apptSearch.toLowerCase()) ||
    (a.patient?.phone||"").includes(apptSearch)
  );

  /* ─ styles ─ */
  const css = `
    .opd2-spin{animation:opd2-spin .7s linear infinite}
    @keyframes opd2-spin{to{transform:rotate(360deg)}}
    .opd2-sc{background:#fff;border-radius:16px;padding:18px 20px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.04);transition:transform .18s,box-shadow .18s}
    .opd2-sc:hover{transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,0,0,.08)}
    .opd2-sc-ic{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .opd2-sc-lbl{font-size:10.5px;color:#94a3b8;font-weight:600;margin-bottom:3px;letter-spacing:.03em;text-transform:uppercase}
    .opd2-sc-val{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.03em;line-height:1}
    .opd2-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.03)}
    .opd2-card-hd{padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:#fafbfc}
    .opd2-card-title{font-size:13px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:7px}
    .opd2-tbl{width:100%;border-collapse:collapse}
    .opd2-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;padding:10px 14px;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
    .opd2-tbl td{padding:11px 14px;font-size:12.5px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
    .opd2-tbl tr:last-child td{border-bottom:none}
    .opd2-tbl tbody tr:hover td{background:#f8faff}
    .opd2-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;gap:4px}
    .opd2-btn{padding:5px 13px;border-radius:8px;font-size:11.5px;font-weight:600;cursor:pointer;border:1.5px solid;transition:all .15s;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
    .opd2-btn:disabled{opacity:.5;cursor:not-allowed}
    .opd2-section{font-size:13.5px;font-weight:700;color:#0f172a;margin-bottom:14px;display:flex;align-items:center;gap:9px}
    .opd2-dot{width:4px;height:18px;border-radius:4px;flex-shrink:0;background:${m.gradient}}
    .opd2-empty{text-align:center;padding:48px 16px;color:#94a3b8;font-size:13px}
    .opd2-search{display:flex;align-items:center;gap:8px;background:${m.lightBg};border:1.5px solid ${m.borderColor};border-radius:10px;padding:8px 13px;min-width:220px}
    .opd2-search input{background:none;border:none;outline:none;font-size:12.5px;color:#334155;width:100%}
    .opd2-token{min-width:28px;height:28px;border-radius:8px;background:${m.gradient};color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 6px;flex-shrink:0}
    .opd2-note{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:7px 11px;font-size:11px;color:#166534;margin-top:6px;line-height:1.5}
    .opd2-expand-row{background:#f8faff;border-top:1px dashed #d1fae5}
    .opd2-expand-row td{padding:14px 18px}
    .opd2-stat-bar{display:flex;gap:0;border-radius:12px;overflow:hidden;margin-bottom:16px;border:1px solid #e2e8f0}
    .opd2-stat-seg{flex:1;padding:14px;text-align:center;border-right:1px solid #e2e8f0}
    .opd2-stat-seg:last-child{border-right:none}
    .opd2-rev-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9}
    .opd2-rev-row:last-child{border-bottom:none}
    .opd2-input{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:12.5px;color:#334155;outline:none;transition:border .15s}
    .opd2-input:focus{border-color:${m.accent}}
    .opd2-select{width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:12.5px;color:#334155;outline:none;background:#fff}
    .opd2-label{font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
    .opd2-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:24px}
    .opd2-modal{background:#fff;border-radius:20px;padding:28px;width:100%;max-width:760px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.18)}
  `;

  const deptLabel = profile?.type === "GENERAL_MEDICINE" ? "General Medicine" : "OPD";

  return (
    <>
      <style>{css}</style>

      {/* ── BookingWizard Modal ── */}
      {showBooking && <BookingWizard onSuccess={(_name:string)=>{setShowBooking(false);loadAppts(apptDate,apptStatus);}} onClose={()=>setShowBooking(false)}/>}

      {/* ── Banner ── */}
      <div style={{ background:m.gradient, borderRadius:20, padding:"22px 28px", marginBottom:22, display:"flex", alignItems:"center", gap:18, color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-30, top:-30, width:150, height:150, borderRadius:"50%", background:"rgba(255,255,255,.06)" }}/>
        <div style={{ position:"absolute", right:90, bottom:-50, width:110, height:110, borderRadius:"50%", background:"rgba(255,255,255,.04)" }}/>
        <div style={{ width:56, height:56, borderRadius:16, background:"rgba(255,255,255,.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"1.5px solid rgba(255,255,255,.3)" }}>
          <Icon size={26} color="#fff" />
        </div>
        <div style={{ flex:1, position:"relative" }}>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:"-.02em", marginBottom:3 }}>{profile?.name || deptLabel}</div>
          <div style={{ fontSize:11.5, opacity:.75, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ background:"rgba(255,255,255,.18)", padding:"2px 8px", borderRadius:100, fontWeight:600 }}>{deptLabel}</span>
            <span>·</span>
            <span>Outpatient Department Dashboard</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:12, position:"relative" }}>
          {[
            { val:qTotal,     lbl:"Total Today", ic:<Users size={14}/> },
            { val:qWaiting,   lbl:"Waiting",     ic:<Clock size={14}/> },
            { val:qInConsult, lbl:"In Consult",  ic:<Timer size={14}/> },
            { val:qDone,      lbl:"Done",        ic:<CheckCheck size={14}/> },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:"center", background:"rgba(255,255,255,.14)", border:"1px solid rgba(255,255,255,.2)", borderRadius:12, padding:"10px 14px", minWidth:64 }}>
              <div style={{ display:"flex", justifyContent:"center", opacity:.75, marginBottom:4 }}>{s.ic}</div>
              <div style={{ fontSize:18, fontWeight:800, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:9, opacity:.7, textTransform:"uppercase" as const, letterSpacing:".07em", marginTop:3 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === "overview" && (<>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
          {[
            { lbl:"Today's Patients", val:qTotal,     ic:<Users size={20}/>,      bg:m.lightBg,  col:m.accent  },
            { lbl:"Waiting",          val:qWaiting,   ic:<Clock size={20}/>,      bg:"#fffbeb",  col:"#d97706" },
            { lbl:"In Consultation",  val:qInConsult, ic:<Timer size={20}/>,      bg:"#fef3c7",  col:"#b45309" },
            { lbl:"Completed Today",  val:qDone,      ic:<CheckCheck size={20}/>, bg:"#f0fdf4",  col:"#16a34a" },
          ].map((s,i) => (
            <div key={i} className="opd2-sc">
              <div className="opd2-sc-ic" style={{ background:s.bg }}><span style={{ color:s.col }}>{s.ic}</span></div>
              <div><div className="opd2-sc-lbl">{s.lbl}</div><div className="opd2-sc-val">{s.val}</div></div>
            </div>
          ))}
        </div>

        {/* Overview: Queue Preview */}
        <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:16,marginBottom:16}}>
          <div className="opd2-card">
            <div className="opd2-card-hd">
              <span className="opd2-card-title"><UserCheck size={14} color={m.accent}/>Today's Queue</span>
              <button onClick={()=>switchTab("queue")} style={{fontSize:11.5,color:m.accent,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3,fontWeight:600}}>View All<ArrowRight size={12}/></button>
            </div>
            <table className="opd2-tbl">
              <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {qLoad ? <tr><td colSpan={5} className="opd2-empty"><Loader2 size={14} className="opd2-spin" style={{verticalAlign:"middle"}}/> Loading…</td></tr>
                : queue.length===0 ? <tr><td colSpan={5} className="opd2-empty">Queue is empty today</td></tr>
                : [...queue,...done].slice(0,6).map((q:any)=>{
                  const s=STATUS_CFG[q.status]||STATUS_CFG.SCHEDULED;
                  return <tr key={q.id}>
                    <td><div className="opd2-token">#{q.tokenNumber||"—"}</div></td>
                    <td><div style={{fontWeight:700,color:"#0f172a",fontSize:12.5}}>{q.patient?.name||"—"}</div><div style={{fontSize:10,color:"#94a3b8"}}>{q.patient?.patientId}</div></td>
                    <td style={{fontSize:12,color:"#64748b"}}>Dr. {q.doctor?.name?.split(" ").pop()||"—"}</td>
                    <td style={{fontWeight:600,fontSize:12}}>{fmtTime(q.timeSlot)}</td>
                    <td><span className="opd2-badge" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{s.label}</span></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <div className="opd2-card">
            <div className="opd2-card-hd"><span className="opd2-card-title"><CalendarDays size={14} color={m.accent}/>Today's Appointments</span>
              <button onClick={()=>switchTab("appointments")} style={{fontSize:11.5,color:m.accent,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3,fontWeight:600}}>Manage<ArrowRight size={12}/></button>
            </div>
            <div style={{padding:"8px 14px"}}>
              {[
                {lbl:"Total Appointments", val:appts.length,  col:m.accent},
                {lbl:"Scheduled",          val:appts.filter((a:any)=>a.status==="SCHEDULED").length, col:"#2563eb"},
                {lbl:"Completed",          val:appts.filter((a:any)=>a.status==="COMPLETED").length, col:"#16a34a"},
                {lbl:"Cancelled",          val:appts.filter((a:any)=>a.status==="CANCELLED").length, col:"#ef4444"},
              ].map((r,i)=>(
                <div key={i} className="opd2-rev-row">
                  <span style={{fontSize:12.5,color:"#475569"}}>{r.lbl}</span>
                  <span style={{fontSize:14,fontWeight:800,color:r.col}}>{r.val}</span>
                </div>
              ))}
              <button onClick={()=>setShowBooking(true)} style={{marginTop:12,width:"100%",padding:"9px",borderRadius:9,background:m.gradient,color:"#fff",border:"none",fontWeight:700,fontSize:12.5,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <UserPlus size={13}/>Book New Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Completed strip */}
        {done.length>0 && (
          <div className="opd2-card">
            <div className="opd2-card-hd">
              <span className="opd2-card-title"><CheckCircle2 size={14} color="#16a34a"/>Completed Today
                <span style={{fontSize:10,background:"#f0fdf4",color:"#15803d",padding:"2px 8px",borderRadius:100,border:"1px solid #bbf7d0",fontWeight:700}}>{done.length}</span>
              </span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap" as const,gap:6,padding:"10px 14px"}}>
              {done.slice(0,12).map((d:any,i:number)=>(
                <span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:"#f0fdf4",border:"1px solid #bbf7d0",fontSize:11.5,color:"#166534",fontWeight:600}}>
                  <CheckCheck size={10}/>{d.patient?.name||"—"}
                </span>
              ))}
            </div>
          </div>
        )}
      </>)}

      {/* ══ APPOINTMENTS MANAGEMENT ══ */}
      {tab === "appointments" && (<>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap" as const,gap:10}}>
          <div className="opd2-section" style={{marginBottom:0}}><div className="opd2-dot"/>Appointment Management
            <span style={{fontSize:10,background:m.lightBg,color:m.accent,padding:"2px 8px",borderRadius:100,border:`1px solid ${m.borderColor}`,fontWeight:700,marginLeft:4}}>{fAppts.length}</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap" as const}}>
            <input type="date" value={apptDate} onChange={e=>setApptDate(e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:9,padding:"7px 10px",fontSize:12.5,color:"#334155",outline:"none"}}/>
            <select value={apptStatus} onChange={e=>setApptStatus(e.target.value)} className="opd2-select" style={{width:"auto",minWidth:130}}>
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Waiting</option>
              <option value="CONFIRMED">In Consultation</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <div className="opd2-search" style={{minWidth:190}}><Search size={13} color="#94a3b8"/><input placeholder="Search patient…" value={apptSearch} onChange={e=>setApptSearch(e.target.value)}/></div>
            <button onClick={()=>setShowBooking(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:9,border:"none",background:m.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              <UserPlus size={13}/>Book New
            </button>
            <button onClick={()=>loadAppts(apptDate,apptStatus)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",fontSize:11.5,color:"#64748b",cursor:"pointer",fontWeight:600}}>
              <RefreshCw size={13} className={apptLoad?"opd2-spin":""}/>
            </button>
          </div>
        </div>

        <div className="opd2-card">
          <table className="opd2-tbl">
            <thead><tr><th>Token</th><th>Patient</th><th>UHID</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th style={{textAlign:"right"}}>Action</th></tr></thead>
            <tbody>
              {apptLoad ? <tr><td colSpan={9} className="opd2-empty"><Loader2 size={16} className="opd2-spin" style={{verticalAlign:"middle",marginRight:8}}/>Loading…</td></tr>
              : fAppts.length===0 ? <tr><td colSpan={9} className="opd2-empty"><CalendarDays size={32} style={{display:"block",margin:"0 auto 10px",opacity:.15}}/><div>No appointments for this date</div></td></tr>
              : fAppts.map((a:any)=>{
                const s=STATUS_CFG[a.status]||STATUS_CFG.SCHEDULED;
                const SIcon=s.Icon;
                const isExp=apptExpand===a.id;
                return (
                  <React.Fragment key={a.id}>
                    <tr style={{cursor:"pointer"}} onClick={()=>setApptExpand(isExp?null:a.id)}>
                      <td><div className="opd2-token">#{a.tokenNumber||"—"}</div></td>
                      <td><div style={{fontWeight:700,color:"#0f172a",fontSize:12.5}}>{a.patient?.name||"—"}</div><div style={{fontSize:10,color:"#94a3b8"}}><Phone size={8}/> {a.patient?.phone||"—"}</div></td>
                      <td style={{fontSize:11,color:"#64748b",fontWeight:600}}>{a.patient?.patientId||"—"}</td>
                      <td style={{fontSize:12,color:"#475569"}}>Dr. {a.doctor?.name||"—"}</td>
                      <td style={{fontSize:12,color:"#64748b"}}>{a.appointmentDate ? fmt(a.appointmentDate) : "—"}</td>
                      <td style={{fontWeight:700,color:"#334155",fontSize:12}}>{fmtTime(a.timeSlot)}</td>
                      <td><span style={{fontSize:10,background:m.lightBg,color:m.accent,padding:"2px 7px",borderRadius:100,fontWeight:700}}>{a.type?.replace(/_/g," ")||"OPD"}</span></td>
                      <td><span className="opd2-badge" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}><SIcon size={9}/>{s.label}</span></td>
                      <td style={{textAlign:"right"}}>
                        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                          {a.status==="SCHEDULED" && <button className="opd2-btn" disabled={updating===a.id} onClick={e=>{e.stopPropagation();updateStatus(a.id,"CONFIRMED",()=>loadAppts(apptDate,apptStatus));}} style={{background:m.lightBg,color:m.accent,borderColor:m.borderColor}}>{updating===a.id?<Loader2 size={10} className="opd2-spin"/>:<Timer size={10}/>}Check-In</button>}
                          {a.status==="CONFIRMED" && <button className="opd2-btn" disabled={updating===a.id} onClick={e=>{e.stopPropagation();updateStatus(a.id,"COMPLETED",()=>loadAppts(apptDate,apptStatus));}} style={{background:"#f0fdf4",color:"#16a34a",borderColor:"#bbf7d0"}}>{updating===a.id?<Loader2 size={10} className="opd2-spin"/>:<CheckCheck size={10}/>}Done</button>}
                          {a.status==="COMPLETED" && <span style={{fontSize:11,color:"#16a34a",fontWeight:700,display:"flex",alignItems:"center",gap:3}}><CheckCircle2 size={11}/>Done</span>}
                          {isExp ? <ChevronUp size={14} color="#94a3b8"/> : <ChevronDown size={14} color="#94a3b8"/>}
                        </div>
                      </td>
                    </tr>
                    {isExp && (
                      <tr className="opd2-expand-row">
                        <td colSpan={9}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                            <div>
                              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>Patient Info</div>
                              <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{a.patient?.name}</div>
                              <div style={{fontSize:11,color:"#64748b",marginTop:3}}>{a.patient?.gender}{a.patient?.dateOfBirth?` · ${new Date().getFullYear()-new Date(a.patient.dateOfBirth).getFullYear()} yrs`:""}</div>
                              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>📞 {a.patient?.phone||"—"}</div>
                              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>📧 {a.patient?.email||"—"}</div>
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>Appointment Details</div>
                              <div style={{fontSize:12,color:"#475569"}}>Date: <strong>{a.appointmentDate ? fmt(a.appointmentDate) : "—"}</strong></div>
                              <div style={{fontSize:12,color:"#475569",marginTop:3}}>Slot: <strong>{fmtTime(a.timeSlot)}</strong></div>
                              <div style={{fontSize:12,color:"#475569",marginTop:3}}>Type: <strong>{a.type?.replace(/_/g," ")||"—"}</strong></div>
                              {a.consultationFee>0 && <div style={{fontSize:12,color:m.accent,fontWeight:700,marginTop:3}}>Fee: ₹{a.consultationFee}</div>}
                            </div>
                            <div>
                              {a.subDeptNote && <><div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>Referral Note</div><div className="opd2-note">{a.subDeptNote}</div></>}
                              {a.notes && <div style={{marginTop:8,fontSize:11,color:"#64748b"}}>Notes: {a.notes}</div>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ══ QUEUE / TOKEN MANAGEMENT ══ */}
      {tab === "queue" && (<>
        <div className="opd2-stat-bar">
          {[
            {lbl:"Waiting",        val:qWaiting,   bg:"#eff6ff",   col:"#2563eb"},
            {lbl:"In Consultation", val:qInConsult,  bg:"#fffbeb",   col:"#b45309"},
            {lbl:"Completed",      val:qDone,       bg:"#f0fdf4",   col:"#16a34a"},
            {lbl:"Total Today",    val:qTotal,      bg:m.lightBg,   col:m.accent },
          ].map((s,i)=>(
            <div key={i} className="opd2-stat-seg" style={{background:s.bg}}>
              <div style={{fontSize:20,fontWeight:800,color:s.col}}>{s.val}</div>
              <div style={{fontSize:10,color:s.col,opacity:.75,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:".05em",marginTop:2}}>{s.lbl}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div className="opd2-section" style={{marginBottom:0}}><div className="opd2-dot"/>Queue / Token Management
            <span style={{fontSize:10,background:m.lightBg,color:m.accent,padding:"2px 8px",borderRadius:100,border:`1px solid ${m.borderColor}`,fontWeight:700,marginLeft:4}}>{queue.length} active</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div className="opd2-search"><Search size={13} color="#94a3b8"/><input placeholder="Token / name / UHID…" value={qSearch} onChange={e=>setQSearch(e.target.value)}/></div>
            <button onClick={loadQueue} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",fontSize:11.5,color:"#64748b",cursor:"pointer",fontWeight:600}}>
              <RefreshCw size={13} className={qLoad?"opd2-spin":""}/>Refresh
            </button>
          </div>
        </div>

        <div className="opd2-card">
          <table className="opd2-tbl">
            <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Slot</th><th>Referral Note</th><th>Status</th><th style={{textAlign:"right"}}>Action</th></tr></thead>
            <tbody>
              {qLoad ? <tr><td colSpan={7} className="opd2-empty"><Loader2 size={16} className="opd2-spin" style={{verticalAlign:"middle",marginRight:8}}/>Loading…</td></tr>
              : fQueue.length===0 ? <tr><td colSpan={7} className="opd2-empty"><UserCheck size={32} style={{display:"block",margin:"0 auto 10px",opacity:.15}}/><div>No patients in queue</div></td></tr>
              : fQueue.map((q:any)=>{
                const s=STATUS_CFG[q.status]||STATUS_CFG.SCHEDULED;
                const SIcon=s.Icon;
                const isExp=qExpand===q.id;
                return (
                  <React.Fragment key={q.id}>
                    <tr style={{cursor:"pointer"}} onClick={()=>setQExpand(isExp?null:q.id)}>
                      <td><div className="opd2-token">#{q.tokenNumber||"—"}</div></td>
                      <td>
                        <div style={{fontWeight:700,color:"#0f172a",fontSize:12.5}}>{q.patient?.name||"—"}</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>{q.patient?.patientId}{q.patient?.phone?` · ${q.patient.phone}`:""}</div>
                      </td>
                      <td><div style={{fontSize:12,color:"#475569"}}>Dr. {q.doctor?.name||"—"}</div><div style={{fontSize:10,color:"#94a3b8"}}>{q.doctor?.department?.name||""}</div></td>
                      <td style={{fontWeight:700,color:"#334155",fontSize:12}}>{fmtTime(q.timeSlot)}</td>
                      <td style={{maxWidth:160}}>{q.subDeptNote?<span style={{fontSize:11,color:"#166534",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:6,padding:"2px 8px"}}>{q.subDeptNote.slice(0,35)}{q.subDeptNote.length>35?"…":""}</span>:<span style={{color:"#cbd5e1",fontSize:11}}>—</span>}</td>
                      <td><span className="opd2-badge" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}><SIcon size={9}/>{s.label}</span></td>
                      <td style={{textAlign:"right"}}>
                        <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                          {q.status==="SCHEDULED" && <button className="opd2-btn" disabled={updating===q.id} onClick={e=>{e.stopPropagation();updateStatus(q.id,"CONFIRMED",loadQueue);}} style={{background:m.lightBg,color:m.accent,borderColor:m.borderColor}}>{updating===q.id?<Loader2 size={10} className="opd2-spin"/>:<Timer size={10}/>}Start</button>}
                          {q.status==="CONFIRMED" && <button className="opd2-btn" disabled={updating===q.id} onClick={e=>{e.stopPropagation();updateStatus(q.id,"COMPLETED",loadQueue);}} style={{background:"#f0fdf4",color:"#16a34a",borderColor:"#bbf7d0"}}>{updating===q.id?<Loader2 size={10} className="opd2-spin"/>:<CheckCheck size={10}/>}Done</button>}
                          {q.status==="COMPLETED" && <span style={{fontSize:11,color:"#16a34a",fontWeight:700,display:"flex",alignItems:"center",gap:3}}><CheckCircle2 size={11}/>Done</span>}
                          {isExp?<ChevronUp size={13} color="#94a3b8"/>:<ChevronDown size={13} color="#94a3b8"/>}
                        </div>
                      </td>
                    </tr>
                    {isExp && (
                      <tr className="opd2-expand-row">
                        <td colSpan={7}>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                            <div>
                              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>Patient</div>
                              <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{q.patient?.name}</div>
                              {q.patient?.gender && <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{q.patient.gender}{q.patient.dateOfBirth?` · ${new Date().getFullYear()-new Date(q.patient.dateOfBirth).getFullYear()} yrs`:""}</div>}
                              {q.patient?.phone && <div style={{fontSize:11,color:"#64748b",marginTop:2}}>📞 {q.patient.phone}</div>}
                              {q.patient?.bloodGroup && <div style={{fontSize:11,color:"#64748b",marginTop:2}}>🩸 {q.patient.bloodGroup}</div>}
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>Appointment</div>
                              <div style={{fontSize:12,color:"#475569"}}>Date: <strong>{q.appointmentDate?fmt(q.appointmentDate):"Today"}</strong></div>
                              <div style={{fontSize:12,color:"#475569",marginTop:3}}>Slot: <strong>{fmtTime(q.timeSlot)}</strong></div>
                              {q.type && <div style={{fontSize:12,color:"#475569",marginTop:3}}>Type: <strong>{q.type.replace(/_/g," ")}</strong></div>}
                            </div>
                            <div>
                              {q.subDeptNote && <><div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>Referral Instructions</div><div className="opd2-note">{q.subDeptNote}</div></>}
                              {q.notes && <div style={{marginTop:8,fontSize:11,color:"#64748b"}}>Notes: {q.notes}</div>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {done.length>0 && (<>
          <div className="opd2-section" style={{marginTop:20}}><div className="opd2-dot"/>Completed Today
            <span style={{fontSize:10,background:"#f0fdf4",color:"#15803d",padding:"2px 8px",borderRadius:100,border:"1px solid #bbf7d0",fontWeight:700}}>{done.length}</span>
          </div>
          <div className="opd2-card">
            <table className="opd2-tbl">
              <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Slot</th><th>Status</th></tr></thead>
              <tbody>
                {done.slice(0,10).map((d:any)=>{
                  const s=STATUS_CFG[d.status]||STATUS_CFG.COMPLETED;
                  return <tr key={d.id}>
                    <td><div className="opd2-token" style={{opacity:.7}}>#{d.tokenNumber||"—"}</div></td>
                    <td><div style={{fontWeight:600,color:"#1e293b"}}>{d.patient?.name||"—"}</div><div style={{fontSize:10,color:"#94a3b8"}}>{d.patient?.patientId}</div></td>
                    <td style={{color:"#64748b",fontSize:12}}>Dr. {d.doctor?.name||"—"}</td>
                    <td style={{color:"#64748b"}}>{fmtTime(d.timeSlot)}</td>
                    <td><span className="opd2-badge" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}><CheckCheck size={9}/>{s.label}</span></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </>)}
      </>)}

      {/* ══ PATIENT REGISTRATION & SEARCH ══ */}
      {tab === "patients" && (<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* Left: Search */}
          <div>
            <div className="opd2-section"><div className="opd2-dot"/>Search Patient (UHID / Mobile)</div>
            <div className="opd2-card">
              <div style={{padding:"16px 18px"}}>
                <div className="opd2-search" style={{minWidth:"auto",marginBottom:12}}>
                  <Search size={14} color={m.accent}/>
                  <input placeholder="Search by UHID (PT-0001), name or mobile…" value={ptSearch}
                    onChange={e=>{setPtSearch(e.target.value);searchPatients(e.target.value);}}/>
                  {ptLoad && <Loader2 size={13} className="opd2-spin" color="#94a3b8"/>}
                </div>
                {ptView ? (
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>Patient Details</div>
                      <button onClick={()=>setPtView(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:12,background:m.lightBg,borderRadius:10,border:`1px solid ${m.borderColor}`}}>
                      <div style={{width:42,height:42,borderRadius:10,background:m.gradient,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,flexShrink:0}}>
                        {(ptView.name||"P").split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{ptView.name}</div>
                        <div style={{fontSize:11,color:m.accent,fontWeight:600}}>{ptView.patientId}</div>
                      </div>
                    </div>
                    {[["Phone",ptView.phone],["Email",ptView.email],["Gender",ptView.gender],["Blood Group",ptView.bloodGroup],["Address",ptView.address]].filter(([,v])=>v).map(([k,v])=>(
                      <div key={k as string} className="opd2-rev-row">
                        <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{k}</span>
                        <span style={{fontSize:12.5,fontWeight:600,color:"#0f172a"}}>{v}</span>
                      </div>
                    ))}
                    <button onClick={()=>{setShowBooking(true);}} style={{marginTop:12,width:"100%",padding:"9px",borderRadius:9,background:m.gradient,color:"#fff",border:"none",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <CalendarDays size={13}/>Book Appointment
                    </button>
                  </div>
                ) : ptResults.length>0 ? (
                  <div>
                    {ptResults.map((p:any)=>(
                      <div key={p.id} onClick={()=>setPtView(p)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:9,cursor:"pointer",border:"1px solid #f1f5f9",marginBottom:6,background:"#fafbfc",transition:"all .15s"}}
                        onMouseEnter={e=>(e.currentTarget.style.background=m.lightBg)} onMouseLeave={e=>(e.currentTarget.style.background="#fafbfc")}>
                        <div style={{width:32,height:32,borderRadius:8,background:m.gradient,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:11,flexShrink:0}}>
                          {(p.name||"P").split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12.5,fontWeight:700,color:"#0f172a"}}>{p.name}</div>
                          <div style={{fontSize:10,color:"#64748b"}}>{p.patientId} · {p.phone}</div>
                        </div>
                        <ArrowRight size={13} color="#94a3b8"/>
                      </div>
                    ))}
                  </div>
                ) : ptSearch ? (
                  <div style={{textAlign:"center",padding:"24px 16px",color:"#94a3b8",fontSize:12}}>
                    <Users size={28} style={{display:"block",margin:"0 auto 8px",opacity:.2}}/> No patients found
                    <button onClick={()=>setShowRegForm(true)} style={{display:"block",margin:"10px auto 0",padding:"7px 16px",borderRadius:8,background:m.gradient,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer"}}>Register New Patient</button>
                  </div>
                ) : (
                  <div style={{textAlign:"center",padding:"24px 16px",color:"#94a3b8",fontSize:12}}>
                    <Search size={28} style={{display:"block",margin:"0 auto 8px",opacity:.2}}/> Type UHID or mobile to search
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Registration */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div className="opd2-section" style={{marginBottom:0}}><div className="opd2-dot"/>Patient Registration</div>
              {!showRegForm && <button onClick={()=>setShowRegForm(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:9,border:"none",background:m.gradient,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}><UserPlus size={13}/>New Patient</button>}
            </div>
            {showRegForm ? (
              <div className="opd2-card">
                <div className="opd2-card-hd">
                  <span className="opd2-card-title"><UserPlus size={13} color={m.accent}/>Register New Patient</span>
                  <button onClick={()=>{setShowRegForm(false);setRegMsg("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button>
                </div>
                <div style={{padding:"16px 18px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[
                      {key:"name",    label:"Full Name *",   placeholder:"Patient full name",  type:"text"},
                      {key:"phone",   label:"Mobile No. *",  placeholder:"10-digit mobile",    type:"tel"},
                      {key:"email",   label:"Email",         placeholder:"email@example.com",  type:"email"},
                      {key:"dateOfBirth",label:"Date of Birth",placeholder:"",                 type:"date"},
                      {key:"bloodGroup",label:"Blood Group", placeholder:"A+, B-, O+ etc.",    type:"text"},
                      {key:"address", label:"Address",       placeholder:"Full address",       type:"text"},
                    ].map(({key,label,placeholder,type})=>(
                      <div key={key}>
                        <div className="opd2-label">{label}</div>
                        <input type={type} className="opd2-input" placeholder={placeholder}
                          value={(regForm as any)[key]} onChange={e=>setRegForm(f=>({...f,[key]:e.target.value}))}/>
                      </div>
                    ))}
                    <div>
                      <div className="opd2-label">Gender</div>
                      <select className="opd2-select" value={regForm.gender} onChange={e=>setRegForm(f=>({...f,gender:e.target.value}))}>
                        <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                  {regMsg && <div style={{marginTop:10,padding:"8px 12px",borderRadius:8,background:regMsg.startsWith("✓")?"#f0fdf4":"#fff5f5",color:regMsg.startsWith("✓")?"#16a34a":"#ef4444",fontSize:12,fontWeight:600}}>{regMsg}</div>}
                  <button onClick={registerPatient} disabled={regSaving} style={{marginTop:14,width:"100%",padding:"10px",borderRadius:9,background:m.gradient,color:"#fff",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {regSaving?<Loader2 size={14} className="opd2-spin"/>:<Check size={14}/>}
                    {regSaving?"Registering…":"Register Patient"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="opd2-card" style={{padding:"32px 24px",textAlign:"center"}}>
                <UserPlus size={40} style={{display:"block",margin:"0 auto 12px",color:m.accent,opacity:.4}}/>
                <div style={{fontSize:13,color:"#64748b",marginBottom:16}}>Register a new OPD patient</div>
                <button onClick={()=>setShowRegForm(true)} style={{padding:"10px 24px",borderRadius:10,background:m.gradient,color:"#fff",border:"none",fontWeight:700,fontSize:13,cursor:"pointer"}}>Start Registration</button>
              </div>
            )}
          </div>
        </div>
      </>)}

      {/* ══ CONSULTATION MANAGEMENT ══ */}
      {tab === "consultations" && (<>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div className="opd2-section" style={{marginBottom:0}}><div className="opd2-dot"/>Consultation Management — Today
            <span style={{fontSize:10,background:"#f0fdf4",color:"#15803d",padding:"2px 8px",borderRadius:100,border:"1px solid #bbf7d0",fontWeight:700,marginLeft:4}}>{consults.length} completed</span>
          </div>
          <button onClick={loadConsults} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",fontSize:11.5,color:"#64748b",cursor:"pointer",fontWeight:600}}>
            <RefreshCw size={13} className={consLoad?"opd2-spin":""}/>Refresh
          </button>
        </div>
        <div className="opd2-card">
          <table className="opd2-tbl">
            <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Slot</th><th>Type</th><th>Fee</th><th>Consultation Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {consLoad ? <tr><td colSpan={8} className="opd2-empty"><Loader2 size={16} className="opd2-spin" style={{verticalAlign:"middle",marginRight:8}}/>Loading…</td></tr>
              : consults.length===0 ? <tr><td colSpan={8} className="opd2-empty"><ClipboardList size={32} style={{display:"block",margin:"0 auto 10px",opacity:.15}}/><div>No completed consultations today</div></td></tr>
              : consults.map((c:any)=>{
                const isEditing=noteEdit?.id===c.id;
                const isExp=consExpand===c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr style={{cursor:"pointer"}} onClick={()=>setConsExpand(isExp?null:c.id)}>
                      <td><div className="opd2-token" style={{opacity:.85}}>#{c.tokenNumber||"—"}</div></td>
                      <td><div style={{fontWeight:700,color:"#0f172a",fontSize:12.5}}>{c.patient?.name||"—"}</div><div style={{fontSize:10,color:"#94a3b8"}}>{c.patient?.patientId}</div></td>
                      <td style={{fontSize:12,color:"#475569"}}>Dr. {c.doctor?.name||"—"}</td>
                      <td style={{fontWeight:600,fontSize:12}}>{fmtTime(c.timeSlot)}</td>
                      <td><span style={{fontSize:10,background:m.lightBg,color:m.accent,padding:"2px 7px",borderRadius:100,fontWeight:700}}>{c.type?.replace(/_/g," ")||"OPD"}</span></td>
                      <td style={{fontWeight:700,color:m.accent,fontSize:12}}>₹{c.consultationFee||0}</td>
                      <td style={{maxWidth:200}}>
                        {isEditing ? (
                          <div style={{display:"flex",gap:5}} onClick={e=>e.stopPropagation()}>
                            <input className="opd2-input" value={noteEdit!.val} onChange={e=>setNoteEdit({id:c.id,val:e.target.value})} style={{fontSize:11.5}} placeholder="Add notes…"/>
                            <button onClick={()=>saveNote(c.id,noteEdit!.val)} disabled={noteSaving} style={{padding:"4px 10px",borderRadius:7,background:m.gradient,color:"#fff",border:"none",fontSize:11,cursor:"pointer",flexShrink:0}}>{noteSaving?<Loader2 size={10} className="opd2-spin"/>:<Check size={10}/>}</button>
                            <button onClick={e=>{e.stopPropagation();setNoteEdit(null);}} style={{padding:"4px 8px",borderRadius:7,background:"#f1f5f9",color:"#64748b",border:"none",fontSize:11,cursor:"pointer",flexShrink:0}}><X size={10}/></button>
                          </div>
                        ) : c.notes ? (
                          <div style={{fontSize:11,color:"#475569",display:"flex",alignItems:"flex-start",gap:5}}>
                            <span style={{flex:1,lineHeight:1.4}}>{c.notes.slice(0,60)}{c.notes.length>60?"…":""}</span>
                          </div>
                        ) : <span style={{color:"#cbd5e1",fontSize:11}}>No notes</span>}
                      </td>
                      <td>
                        <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                          {!isEditing && <button onClick={()=>setNoteEdit({id:c.id,val:c.notes||""})} style={{padding:"4px 9px",borderRadius:7,background:m.lightBg,color:m.accent,border:`1px solid ${m.borderColor}`,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontWeight:600}}><Edit3 size={10}/>{c.notes?"Edit":"Add"}</button>}
                          {isExp?<ChevronUp size={13} color="#94a3b8"/>:<ChevronDown size={13} color="#94a3b8"/>}
                        </div>
                      </td>
                    </tr>
                    {isExp && (
                      <tr className="opd2-expand-row">
                        <td colSpan={8}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                            <div>
                              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>Patient</div>
                              <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{c.patient?.name}</div>
                              {c.patient?.phone && <div style={{fontSize:11,color:"#64748b",marginTop:2}}>📞 {c.patient.phone}</div>}
                              {c.patient?.gender && <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{c.patient.gender}{c.patient.dateOfBirth?` · ${new Date().getFullYear()-new Date(c.patient.dateOfBirth).getFullYear()} yrs`:""}</div>}
                            </div>
                            <div>
                              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".05em",marginBottom:6}}>Full Notes</div>
                              {c.notes ? <div style={{fontSize:12,color:"#334155",lineHeight:1.6}}>{c.notes}</div> : <span style={{color:"#94a3b8",fontSize:12}}>No consultation notes added yet.</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ══ PATIENT RECORDS ══ */}
      {tab === "records" && (<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          {[
            {lbl:"Today's Records",  val:rMeta.todayRecords||0,  bg:m.lightBg, col:m.accent  },
            {lbl:"Total Records",    val:rMeta.total||0,          bg:"#eff6ff",  col:"#2563eb" },
            {lbl:"Today Revenue",    val:`₹${(rMeta.todayRevenue||0).toLocaleString("en-IN")}`, bg:"#f0fdf4",  col:"#16a34a"},
            {lbl:"Total Revenue",    val:`₹${(rMeta.totalRevenue||0).toLocaleString("en-IN")}`, bg:"#faf5ff",  col:"#7c3aed"},
          ].map((s,i)=>(
            <div key={i} style={{background:s.bg,borderRadius:14,padding:"16px 18px",border:`1px solid ${s.col}22`}}>
              <div style={{fontSize:20,fontWeight:800,color:s.col}}>{s.val}</div>
              <div style={{fontSize:10,color:s.col,opacity:.8,marginTop:3,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:".05em"}}>{s.lbl}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div className="opd2-section" style={{marginBottom:0}}><div className="opd2-dot"/>Patient Records</div>
          <div style={{display:"flex",gap:8}}>
            <div className="opd2-search"><Search size={13} color="#94a3b8"/><input placeholder="Search patient, service…" value={rSearch} onChange={e=>{setRSearch(e.target.value);loadRecords(e.target.value);}}/></div>
            <button onClick={()=>loadRecords(rSearch)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",fontSize:11.5,color:"#64748b",cursor:"pointer",fontWeight:600}}><RefreshCw size={13} className={rLoad?"opd2-spin":""}/></button>
          </div>
        </div>
        <div className="opd2-card">
          <table className="opd2-tbl">
            <thead><tr><th>Patient</th><th>Service</th><th>Performed By</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {rLoad ? <tr><td colSpan={6} className="opd2-empty"><Loader2 size={16} className="opd2-spin" style={{verticalAlign:"middle",marginRight:8}}/>Loading…</td></tr>
              : recs.length===0 ? <tr><td colSpan={6} className="opd2-empty"><FileText size={32} style={{display:"block",margin:"0 auto 10px",opacity:.15}}/><div>No records found</div></td></tr>
              : recs.map((r:any)=>(
                <tr key={r.id}>
                  <td><div style={{fontWeight:700,color:"#0f172a",fontSize:12.5}}>{r.patient?.name||"—"}</div><div style={{fontSize:10,color:"#94a3b8"}}>{r.patient?.patientId}</div></td>
                  <td><div style={{color:"#334155",fontWeight:500}}>{r.procedure?.name||"—"}</div>{r.procedure?.type&&<div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{r.procedure.type.replace(/_/g," ")}</div>}</td>
                  <td style={{color:"#64748b",fontSize:12}}>{r.performedBy||"—"}</td>
                  <td style={{color:"#94a3b8",fontSize:12}}>{r.performedAt?fmt(r.performedAt):"—"}</td>
                  <td style={{fontWeight:700,color:m.accent,fontSize:12}}>₹{(r.amount||0).toLocaleString("en-IN")}</td>
                  <td><span className="opd2-badge" style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0"}}><CheckCheck size={9}/>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ══ REPORTS ══ */}
      {tab === "reports" && (<>
        <div className="opd2-section"><div className="opd2-dot"/>OPD Analytics & Reports</div>
        {repLoad ? <div className="opd2-empty"><Loader2 size={28} className="opd2-spin" style={{display:"block",margin:"0 auto 14px"}}/><div>Loading…</div></div>
        : !repData ? <div className="opd2-empty"><BarChart2 size={40} style={{display:"block",margin:"0 auto 12px",opacity:.15}}/><div>No analytics data yet</div></div>
        : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div className="opd2-card">
              <div className="opd2-card-hd"><span className="opd2-card-title"><BarChart2 size={13} color={m.accent}/>Top Services</span></div>
              <div style={{padding:"12px 18px"}}>
                {(repData.procedureBreakdown||[]).slice(0,8).map((p:any,i:number)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #f1f5f9"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:10,fontWeight:700,color:"#94a3b8",width:16,textAlign:"right"}}>{i+1}</span>
                      <span style={{fontSize:12.5,color:"#334155"}}>{p.name||p.procedure}</span>
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:12,fontWeight:700,color:m.accent}}>₹{(p.revenue||0).toLocaleString("en-IN")}</span>
                      <span style={{fontSize:10,background:m.lightBg,color:m.accent,padding:"1px 7px",borderRadius:100,border:`1px solid ${m.borderColor}`,fontWeight:700}}>{p.count}</span>
                    </div>
                  </div>
                ))}
                {!(repData.procedureBreakdown||[]).length && <div style={{textAlign:"center",padding:24,color:"#94a3b8",fontSize:12}}>No service data yet</div>}
              </div>
            </div>
            <div>
              <div className="opd2-card" style={{marginBottom:14}}>
                <div className="opd2-card-hd"><span className="opd2-card-title"><TrendingUp size={13} color={m.accent}/>Revenue Summary</span></div>
                <div style={{padding:"12px 18px"}}>
                  {[
                    {lbl:"Today",      val:repData.revenue?.today||0,    col:m.accent },
                    {lbl:"This Week",  val:repData.revenue?.thisWeek||0,  col:"#2563eb"},
                    {lbl:"This Month", val:repData.revenue?.thisMonth||0, col:"#7c3aed"},
                    {lbl:"Total",      val:repData.revenue?.total||0,     col:"#16a34a"},
                  ].map((r,i)=>(
                    <div key={i} className="opd2-rev-row">
                      <span style={{fontSize:13,color:"#475569"}}>{r.lbl}</span>
                      <span style={{fontSize:14,fontWeight:800,color:r.col}}>₹{r.val.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>)}

      {/* ══ DEPARTMENT ══ */}
      {tab === "dept" && (<>
        <div className="opd2-section"><div className="opd2-dot"/>Department Information</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div className="opd2-card">
            <div className="opd2-card-hd"><span className="opd2-card-title"><Building2 size={13} color={m.accent}/>Basic Details</span></div>
            <div style={{padding:"12px 18px"}}>
              {([["Name",profile?.name],["Type",profile?.type?.replace(/_/g," ")],["Code",profile?.code],["Login Email",profile?.loginEmail||user?.email],["Description",profile?.description],["Status",profile?.isActive?"Active":"Inactive"]] as [string,any][]).filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 0",borderBottom:"1px solid #f1f5f9",gap:12}}>
                  <span style={{fontSize:11,color:"#94a3b8",fontWeight:600,flexShrink:0}}>{k}</span>
                  <span style={{fontSize:12.5,fontWeight:600,color:k==="Status"?(profile?.isActive?"#16a34a":"#ef4444"):"#0f172a",textAlign:"right"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="opd2-card">
            <div className="opd2-card-hd"><span className="opd2-card-title"><User2 size={13} color={m.accent}/>Head of Department</span></div>
            <div style={{padding:"16px 18px"}}>
              {profile?.hodName ? (
                <>
                  <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,padding:14,background:m.lightBg,borderRadius:12,border:`1px solid ${m.borderColor}`}}>
                    <div style={{width:46,height:46,borderRadius:12,background:m.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff",flexShrink:0}}>
                      {(profile.hodName||"H").split(" ").map((x:string)=>x[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{profile.hodName}</div>
                      <div style={{fontSize:11,color:m.accent,fontWeight:600,marginTop:2}}>Head of Department</div>
                    </div>
                  </div>
                  {profile.hodEmail && <div style={{fontSize:12.5,color:"#475569",padding:"7px 0",display:"flex",alignItems:"center",gap:8,borderBottom:"1px solid #f1f5f9"}}>📧 <span>{profile.hodEmail}</span></div>}
                  {profile.hodPhone && <div style={{fontSize:12.5,color:"#475569",padding:"7px 0",display:"flex",alignItems:"center",gap:8}}>📞 <span>{profile.hodPhone}</span></div>}
                </>
              ) : (
                <div style={{textAlign:"center",padding:32,color:"#94a3b8",fontSize:13}}>
                  <User2 size={32} style={{display:"block",margin:"0 auto 10px",opacity:.2}}/>No HOD assigned
                </div>
              )}
            </div>
          </div>
        </div>
      </>)}
    </>
  );
}
