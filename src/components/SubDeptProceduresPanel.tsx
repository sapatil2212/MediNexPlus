"use client";
import { useState, useCallback, useEffect } from "react";
import {
  Plus, Search, X, Loader2, Save, Ban,
  FlaskConical, Edit2, Trash2, AlertTriangle,
  Download, FileText, FileSpreadsheet, FileType,
  ToggleLeft, ToggleRight,
} from "lucide-react";

/* ─── types ─────────────────────────────────────────────── */
interface Meta { gradient: string; accent: string; lightBg: string; borderColor: string }

/* ─── constants ─────────────────────────────────────────── */
const PROC_TYPES = ["DIAGNOSTIC","TREATMENT","CONSULTATION","SURGERY","THERAPY","MEDICATION","OTHER"];
const PROC_TYPE_COLOR: Record<string,string> = {
  DIAGNOSTIC:"#0E898F", TREATMENT:"#10b981", CONSULTATION:"#8b5cf6",
  SURGERY:"#ef4444", THERAPY:"#f97316", MEDICATION:"#06b6d4", OTHER:"#94a3b8",
};
const BLANK = { name:"", description:"", type:"OTHER", fee:"", duration:"", sequence:"0", isActive:true };

/* ─── helpers ────────────────────────────────────────────── */
function fmtFee(fee: any) { return fee != null && fee !== "" ? `₹${fee}` : "—"; }

export default function SubDeptProceduresPanel({ meta, deptName }: { meta: Meta; deptName?: string }) {
  const [procs,     setProcs]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState("");

  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<any>(null);
  const [form,       setForm]       = useState<any>(BLANK);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState("");

  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);

  const [delTarget,  setDelTarget]  = useState<any>(null);
  const [deleting,   setDeleting]   = useState(false);

  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDel,     setBulkDel]     = useState(false);

  /* ── fetch ── */
  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/subdept/procedures", { credentials:"include" }).then(r => r.json());
    if (d.success) setProcs(d.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── derived ── */
  const filtered = search
    ? procs.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.type?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    : procs;
  const activeCount = procs.filter(p => p.isActive).length;

  /* ── selection ── */
  const toggleOne = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll = () => filtered.length > 0 && selected.size === filtered.length
    ? setSelected(new Set())
    : setSelected(new Set(filtered.map(p => p.id)));

  /* ── open forms ── */
  const openAdd  = () => { setEditing(null); setForm(BLANK); setMsg(""); setShowForm(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name:p.name, description:p.description||"", type:p.type, fee:p.fee??"", duration:p.duration??"", sequence:p.sequence??0, isActive:p.isActive });
    setMsg(""); setShowForm(true);
  };

  /* ── save ── */
  const save = async () => {
    if (!form.name.trim()) { setMsg("Name is required"); return; }
    setSaving(true); setMsg("");
    const url    = editing ? `/api/subdept/procedures/${editing.id}` : "/api/subdept/procedures";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) }).then(r => r.json());
    if (res.success) { setShowForm(false); await load(); }
    else setMsg(res.message || "Failed to save");
    setSaving(false);
  };

  /* ── toggle active ── */
  const toggleActive = async (p: any) => {
    await fetch(`/api/subdept/procedures/${p.id}`, { method:"PUT", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isActive:!p.isActive }) });
    await load();
  };

  /* ── single delete ── */
  const deleteSingle = async () => {
    if (!delTarget) return;
    setDeleting(true);
    await fetch(`/api/subdept/procedures/${delTarget.id}`, { method:"DELETE", credentials:"include" });
    selected.delete(delTarget.id);
    setSelected(new Set(selected));
    setDelTarget(null); setDeleting(false);
    await load();
  };

  /* ── bulk delete ── */
  const bulkDelete = async () => {
    setBulkDel(true);
    for (const id of selected) await fetch(`/api/subdept/procedures/${id}`, { method:"DELETE", credentials:"include" });
    setSelected(new Set()); setBulkConfirm(false); setBulkDel(false);
    await load();
  };

  /* ── export helpers ── */
  const getExportData = () => {
    const src = selected.size > 0 ? procs.filter(p => selected.has(p.id)) : filtered;
    const headers = ["#","Name","Description","Type","Fee (₹)","Duration (min)","Status"];
    const rows = src.map((p,i) => [i+1, p.name||"", p.description||"", p.type||"", p.fee??""  , p.duration||"", p.isActive?"Active":"Inactive"]);
    return { headers, rows, count:src.length };
  };
  const exportPDF = async () => {
    const { default:jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const { headers, rows, count } = getExportData();
    const doc = new jsPDF();
    doc.setFontSize(14); doc.setTextColor(20); doc.text(`${deptName||"Sub-Department"} — Procedures`, 14, 18);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} procedure(s)`, 14, 26);
    autoTable(doc, { head:[headers], body:rows, startY:32, styles:{fontSize:9,cellPadding:3}, headStyles:{fillColor:[14,137,143],textColor:255,fontStyle:"bold"}, alternateRowStyles:{fillColor:[248,250,252]} });
    doc.save(`procedures-${new Date().toISOString().slice(0,10)}.pdf`);
    setExportOpen(false);
  };
  const exportExcel = async () => {
    const XLSX = (await import("xlsx")).default || await import("xlsx");
    const { headers, rows } = getExportData();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map((_,i) => ({ wch: [4,24,28,14,10,12,10][i] }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Procedures");
    XLSX.writeFile(wb, `procedures-${new Date().toISOString().slice(0,10)}.xlsx`);
    setExportOpen(false);
  };
  const exportWord = async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle } = await import("docx");
    const { saveAs } = await import("file-saver");
    const { headers, rows, count } = getExportData();
    const borderOpts = { top:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"}, bottom:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"}, left:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"}, right:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"} };
    const mkCell = (text: string, bold=false) => new TableCell({ borders:borderOpts, children:[new Paragraph({ alignment:AlignmentType.LEFT, children:[new TextRun({text:String(text),bold,size:18})] })] });
    const doc = new Document({ sections:[{ children:[
      new Paragraph({ children:[new TextRun({text:`${deptName||"Sub-Department"} — Procedures`,bold:true,size:28,color:"0E898F"})] }),
      new Paragraph({ children:[new TextRun({text:`Exported: ${new Date().toLocaleString("en-IN")} | ${count} procedure(s)`,size:18,color:"64748b"})] }),
      new Paragraph({ text:"" }),
      new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows:[
        new TableRow({ tableHeader:true, children:headers.map(h => mkCell(h,true)) }),
        ...rows.map(row => new TableRow({ children:row.map(c => mkCell(String(c))) })),
      ]}),
    ]}] });
    saveAs(await Packer.toBlob(doc), `procedures-${new Date().toISOString().slice(0,10)}.docx`);
    setExportOpen(false);
  };

  /* ────────────────────────── RENDER ─────────────────────────── */
  return (
    <>
      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:540,boxShadow:"0 24px 60px rgba(0,0,0,.18)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:"#1e293b"}}>{editing ? "Edit Procedure" : "Add New Procedure"}</div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Fill in the procedure details below</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{width:32,height:32,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={14} color="#94a3b8"/>
              </button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{gridColumn:"1/-1"}}>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase" as const,letterSpacing:".06em",display:"block",marginBottom:5}}>Name *</label>
                <input value={form.name} onChange={e => setForm((f:any) => ({...f,name:e.target.value}))} placeholder="e.g. Root Canal Treatment"
                  style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none"}} />
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase" as const,letterSpacing:".06em",display:"block",marginBottom:5}}>Type</label>
                <select value={form.type} onChange={e => setForm((f:any) => ({...f,type:e.target.value}))}
                  style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none"}}>
                  {PROC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase" as const,letterSpacing:".06em",display:"block",marginBottom:5}}>Fee (₹)</label>
                <input type="number" value={form.fee} onChange={e => setForm((f:any) => ({...f,fee:e.target.value}))} placeholder="0"
                  style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none"}} />
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase" as const,letterSpacing:".06em",display:"block",marginBottom:5}}>Duration (min)</label>
                <input type="number" value={form.duration} onChange={e => setForm((f:any) => ({...f,duration:e.target.value}))} placeholder="30"
                  style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none"}} />
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase" as const,letterSpacing:".06em",display:"block",marginBottom:5}}>Description</label>
                <input value={form.description} onChange={e => setForm((f:any) => ({...f,description:e.target.value}))} placeholder="Optional description"
                  style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${meta.borderColor}`,background:"#f8fafc",fontSize:13,color:"#334155",outline:"none"}} />
              </div>
            </div>

            {msg && <div style={{fontSize:12,color:"#ef4444",marginTop:12,fontWeight:600}}>{msg}</div>}

            <div style={{display:"flex",gap:10,marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:18}}>
              <button onClick={save} disabled={saving}
                style={{padding:"10px 24px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 14px ${meta.accent}33`}}>
                {saving ? <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/> : <Save size={13}/>}
                {editing ? "Save Changes" : "Add Procedure"}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{padding:"10px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                <Ban size={13}/> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap" as const}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"8px 14px",flex:1,minWidth:200}}>
          <Search size={13} color="#94a3b8"/>
          <input style={{background:"none",border:"none",outline:"none",fontSize:13,color:"#334155",width:"100%"}}
            placeholder="Search by name, type…" value={search} onChange={e => setSearch(e.target.value)}/>
          {search && <button onClick={() => setSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={12} color="#94a3b8"/></button>}
        </div>

        {loading && <Loader2 size={16} color={meta.accent} style={{animation:"spin .7s linear infinite"}}/>}
        <div style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>{filtered.length} procedures · {activeCount} active</div>

        {selected.size > 0 && (
          <button onClick={() => setBulkConfirm(true)}
            style={{padding:"8px 14px",borderRadius:10,border:"1px solid #fecaca",background:"#fff5f5",fontSize:12,color:"#ef4444",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <Trash2 size={12}/> Delete ({selected.size})
          </button>
        )}

        {/* Export dropdown */}
        <div style={{position:"relative"}}>
          <button onClick={() => setExportOpen(!exportOpen)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:500,cursor:"pointer"}}>
            <Download size={14}/> Export
          </button>
          {exportOpen && (
            <>
              <div style={{position:"fixed",inset:0,zIndex:60}} onClick={() => setExportOpen(false)}/>
              <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,zIndex:70,minWidth:180,padding:6}}>
                {[
                  { label:"Export as PDF",   icon:<FileText size={13}/>,       bg:"#fff5f5", col:"#ef4444",  fn:exportPDF   },
                  { label:"Export as Excel", icon:<FileSpreadsheet size={13}/>, bg:"#f0fdf4", col:"#16a34a",  fn:exportExcel },
                  { label:"Export as Word",  icon:<FileType size={13}/>,        bg:"#eff6ff", col:"#2563eb",  fn:exportWord  },
                ].map(({ label, icon, bg, col, fn }) => (
                  <button key={label} onClick={fn}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:8,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:500,textAlign:"left" as const}}
                    onMouseEnter={e => e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background="none"}>
                    <span style={{width:20,height:20,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:bg,color:col,flexShrink:0}}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button onClick={openAdd}
          style={{display:"flex",alignItems:"center",gap:8,padding:"9px 20px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <Plus size={15}/> Add Procedure
        </button>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 20px",background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",color:"#94a3b8"}}>
          <FlaskConical size={32} style={{marginBottom:10,opacity:.4}}/>
          <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{procs.length === 0 ? "No procedures yet" : "No procedures match your search"}</div>
          <div style={{fontSize:12,marginBottom:16}}>{procs.length === 0 ? "Add your first procedure to get started." : `Searching for "${search}"`}</div>
          {procs.length === 0 && (
            <button onClick={openAdd} style={{padding:"9px 20px",borderRadius:10,border:"none",background:meta.gradient,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>
              <Plus size={14}/> Add First Procedure
            </button>
          )}
        </div>
      ) : (
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  <th style={{padding:"12px 10px 12px 14px",borderBottom:"2px solid #f1f5f9",width:36}}>
                    <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll}
                      style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                  </th>
                  {["#","Procedure Name","Type","Fee","Duration","Status","Actions"].map(h => (
                    <th key={h} style={{textAlign:"left",fontSize:11,fontWeight:600,color:"#94a3b8",padding:"12px 14px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const isSel = selected.has(p.id);
                  const typeCol = PROC_TYPE_COLOR[p.type] || "#94a3b8";
                  return (
                    <tr key={p.id} style={{borderBottom:"1px solid #f8fafc",background:isSel ? meta.lightBg : "transparent"}}
                      onMouseEnter={e => { if(!isSel) e.currentTarget.style.background="#fafbfc"; }}
                      onMouseLeave={e => { if(!isSel) e.currentTarget.style.background="transparent"; }}>
                      <td style={{padding:"12px 10px 12px 14px",width:36}}>
                        <input type="checkbox" checked={isSel} onChange={() => toggleOne(p.id)}
                          style={{width:15,height:15,cursor:"pointer",accentColor:meta.accent}}/>
                      </td>
                      <td style={{padding:"12px 14px",color:"#94a3b8",fontWeight:600,fontSize:12}}>{i+1}</td>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:32,height:32,borderRadius:9,background:`${typeCol}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <FlaskConical size={14} color={typeCol}/>
                          </div>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:p.isActive?"#1e293b":"#94a3b8"}}>{p.name}</div>
                            {p.description && <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{p.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{fontSize:10,padding:"3px 8px",borderRadius:100,background:`${typeCol}18`,color:typeCol,fontWeight:600}}>{p.type}</span>
                      </td>
                      <td style={{padding:"12px 14px",fontWeight:700,color:p.fee!=null?"#0A6B70":"#94a3b8",fontSize:13}}>{fmtFee(p.fee)}</td>
                      <td style={{padding:"12px 14px",fontSize:13,color:"#64748b"}}>{p.duration ? `${p.duration} min` : "—"}</td>
                      <td style={{padding:"12px 14px"}}>
                        <button onClick={() => toggleActive(p)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                          {p.isActive
                            ? <><ToggleRight size={18} color="#22c55e"/><span style={{fontSize:11,fontWeight:700,color:"#16a34a"}}>Active</span></>
                            : <><ToggleLeft  size={18} color="#94a3b8"/><span style={{fontSize:11,fontWeight:600,color:"#94a3b8"}}>Inactive</span></>}
                        </button>
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={() => openEdit(p)} title="Edit"
                            style={{width:28,height:28,borderRadius:8,border:"none",background:"#E6F4F4",color:"#0E898F",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <Edit2 size={13}/>
                          </button>
                          <button onClick={() => setDelTarget(p)} title="Delete"
                            style={{width:28,height:28,borderRadius:8,border:"none",background:"#fff5f5",color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderTop:"1px solid #f1f5f9"}}>
            <div style={{fontSize:12,color:"#94a3b8"}}>Showing {filtered.length} of {procs.length} procedures</div>
            <div style={{fontSize:11,color:"#94a3b8"}}>{activeCount} active · {procs.length - activeCount} inactive</div>
          </div>
        </div>
      )}

      {/* ── Single Delete Confirm ── */}
      {delTarget && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={e => { if(e.target===e.currentTarget && !deleting) setDelTarget(null); }}>
          <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
              <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <AlertTriangle size={20} color="#ef4444"/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete Procedure?</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>
                  Are you sure you want to delete <strong>{delTarget.name}</strong> ({delTarget.type})? This cannot be undone.
                </div>
              </div>
            </div>
            {delTarget.fee != null && (
              <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:12,marginBottom:18}}>
                <div style={{fontSize:12,color:"#92400e",fontWeight:600,marginBottom:4}}>⚠️ Warning</div>
                <div style={{fontSize:11,color:"#a16207"}}>This procedure with fee ₹{delTarget.fee} will be permanently removed from your catalog.</div>
              </div>
            )}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={() => setDelTarget(null)} disabled={deleting}
                style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:600,cursor:deleting?"not-allowed":"pointer",opacity:deleting?.5:1}}>
                Cancel
              </button>
              <button onClick={deleteSingle} disabled={deleting}
                style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:deleting?"not-allowed":"pointer",opacity:deleting?.7:1,display:"flex",alignItems:"center",gap:6}}>
                {deleting && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                {deleting ? "Deleting…" : "Delete Procedure"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirm ── */}
      {bulkConfirm && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={e => { if(e.target===e.currentTarget && !bulkDel) setBulkConfirm(false); }}>
          <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:440,border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18}}>
              <div style={{width:40,height:40,borderRadius:10,background:"#fff5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <AlertTriangle size={20} color="#ef4444"/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:700,color:"#1e293b",marginBottom:4}}>Delete {selected.size} Procedures?</div>
                <div style={{fontSize:13,color:"#64748b",lineHeight:1.5}}>
                  Are you sure you want to delete <strong>{selected.size}</strong> selected procedure(s)? This action cannot be undone.
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={() => setBulkConfirm(false)} disabled={bulkDel}
                style={{padding:"9px 18px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:13,fontWeight:600,cursor:bulkDel?"not-allowed":"pointer",opacity:bulkDel?.5:1}}>
                Cancel
              </button>
              <button onClick={bulkDelete} disabled={bulkDel}
                style={{padding:"9px 18px",borderRadius:9,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:bulkDel?"not-allowed":"pointer",opacity:bulkDel?.7:1,display:"flex",alignItems:"center",gap:6}}>
                {bulkDel && <Loader2 size={13} style={{animation:"spin .7s linear infinite"}}/>}
                {bulkDel ? "Deleting…" : `Delete ${selected.size} Procedures`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
