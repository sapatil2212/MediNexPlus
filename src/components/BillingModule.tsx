"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, Search, X, ChevronLeft, Printer, Download, CreditCard,
  Receipt, IndianRupee, User, Calendar, FileText, CheckCircle2,
  Clock, AlertCircle, Filter, RefreshCw, Loader2, Tag, Stethoscope,
  FlaskConical, Pill, Scan, BedDouble, Scissors, MoreHorizontal,
  Trash2, Pencil, Check, ChevronDown, Package, Eye, Edit, FileSpreadsheet,
  FileJson, FileText as FileTextIcon, AlertTriangle
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type BillView = "list" | "create" | "detail";
interface LineItem {
  id: string;
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  referenceId?: string;
}
const ITEM_TYPES = [
  { value: "CONSULTATION", label: "Consultation", icon: Stethoscope, color: "#0E898F" },
  { value: "PROCEDURE",    label: "Procedure",    icon: Scissors,   color: "#8b5cf6" },
  { value: "LAB_TEST",     label: "Lab Test",     icon: FlaskConical,color: "#10b981" },
  { value: "RADIOLOGY",    label: "Radiology",    icon: Scan,       color: "#0E898F" },
  { value: "PHARMACY",     label: "Pharmacy",     icon: Pill,       color: "#ec4899" },
  { value: "ROOM_CHARGE",  label: "Room Charge",  icon: BedDouble,  color: "#06b6d4" },
  { value: "SURGERY",      label: "Surgery",      icon: Scissors,   color: "#ef4444" },
  { value: "OTHER",        label: "Other",        icon: Tag,        color: "#64748b" },
];
const PAYMENT_METHODS = ["CASH","CARD","UPI","NETBANKING","CHEQUE","DD","INSURANCE","OTHER"];
const STATUS_COLORS: Record<string,{bg:string;color:string;label:string}> = {
  PENDING:       { bg:"#E6F4F4", color:"#0E898F", label:"Pending"       },
  PARTIALLY_PAID:{ bg:"#E6F4F4", color:"#0b7075", label:"Partial"       },
  PAID:          { bg:"#f0fdf4", color:"#166534", label:"Paid"          },
  CANCELLED:     { bg:"#fef2f2", color:"#dc2626", label:"Cancelled"     },
  DRAFT:         { bg:"#f1f5f9", color:"#475569", label:"Draft"         },
};
const fmtCur = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string | Date) => { try { return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); } catch{ return "—"; }};
const fmtDateTime = (d: string | Date) => { try { return new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); } catch{ return "—"; }};

// ─── API Helper ───────────────────────────────────────────────────────────────
const apiFetch = async (url: string, opts?: RequestInit) => {
  const r = await fetch(url, { credentials: "include", ...opts });
  return r.json();
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillingModule({ scope }: { scope?: "lab" | "pharmacy" } = {}) {
  const [view, setView] = useState<BillView>("list");
  const [bills, setBills] = useState<any[]>([]);
  const [stats, setStats] = useState({ todayRevenue: 0, monthRevenue: 0, pendingCount: 0 });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    // Try settings first (has letterhead), fall back to hospital details
    (async () => {
      try {
        const sr = await apiFetch("/api/config/settings");
        if (sr.success && sr.data?.settings) {
          setHospitalInfo({ settings: sr.data.settings });
          return;
        }
      } catch {}
      apiFetch("/api/hospital/details").then(d => { if (d.success) setHospitalInfo(d.data); });
    })();
  }, []);

  const fetchBills = useCallback(async (page = 1) => {
    setListLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search)       params.set("search",   search);
    if (statusFilter) params.set("status",   statusFilter);
    if (dateFrom)     params.set("dateFrom", dateFrom);
    if (dateTo)       params.set("dateTo",   dateTo);
    if (scope === "lab") params.set("labOnly", "true");
    if (scope === "pharmacy") params.set("pharmacyOnly", "true");
    const d = await apiFetch(`/api/billing?${params}`);
    if (d.success) {
      setBills(d.data.bills || []);
      setPagination(d.data.pagination || { page:1, total:0, pages:1 });
      setStats(d.data.stats || { todayRevenue:0, monthRevenue:0, pendingCount:0 });
    }
    setListLoading(false);
  }, [search, statusFilter, dateFrom, dateTo, scope]);

  useEffect(() => { fetchBills(1); }, [fetchBills]);

  const openBill = async (id: string) => {
    setDetailLoading(true);
    setView("detail");
    const d = await apiFetch(`/api/billing/${id}`);
    if (d.success) setSelectedBill(d.data);
    setDetailLoading(false);
  };

  return (
    <>
      <style>{BM_CSS}</style>
      <div className="bm-wrap">
        {view === "list"   && (
          <BillsList
            bills={bills} stats={stats} pagination={pagination} loading={listLoading}
            search={search} setSearch={setSearch}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            dateFrom={dateFrom} setDateFrom={setDateFrom}
            dateTo={dateTo} setDateTo={setDateTo}
            onRefresh={()=>fetchBills(1)} onPageChange={fetchBills}
            onNew={()=>setView("create")} onOpen={openBill}
            scope={scope}
          />
        )}
        {view === "create" && (
          <NewBill
            hospitalInfo={hospitalInfo}
            onBack={()=>setView("list")}
            onCreated={(id)=>{ fetchBills(1); openBill(id); }}
          />
        )}
        {view === "detail" && (
          <BillDetail
            bill={selectedBill} loading={detailLoading} hospitalInfo={hospitalInfo}
            onBack={()=>{ setView("list"); setSelectedBill(null); }}
            onRefresh={()=>selectedBill && openBill(selectedBill.id)}
          />
        )}
      </div>
    </>
  );
}

// ─── Bills List ───────────────────────────────────────────────────────────────
function getPharmacyTotal(b: any): number {
  return (b?.billItems || []).filter((it: any) => it.type === "PHARMACY").reduce((s: number, it: any) => s + (it.amount || 0), 0);
}
function BillsList({ bills,stats,pagination,loading,search,setSearch,statusFilter,setStatusFilter,
  dateFrom,setDateFrom,dateTo,setDateTo,onRefresh,onPageChange,onNew,onOpen,scope }:any) {
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [exportDropdown, setExportDropdown] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportDropdown(false);
      }
    };
    if (exportDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [exportDropdown]);

  const toggleSelectAll = () => {
    if (selectedBills.length === bills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(bills.map((b:any) => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedBills(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDownload = () => {
    if (selectedBills.length === 0) {
      alert("Please select bills to download");
      return;
    }
    // Open each bill in a new window for PDF download
    selectedBills.forEach((id, index) => {
      setTimeout(() => {
        onOpen(id);
      }, index * 500); // Stagger opening to avoid browser blocking
    });
    alert(`Opening ${selectedBills.length} bill(s) for PDF download. Click "Download PDF" button in each window.`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const r = await apiFetch(`/api/billing/${id}`, { method: "DELETE" });
      if (r.success) {
        onRefresh();
        setSelectedBills(prev => prev.filter(x => x !== id));
      } else {
        alert(r.message || "Failed to delete bill");
      }
    } catch (err) {
      alert("Error deleting bill");
    }
    setDeleting(false);
  };

  const exportUrl = `/api/export/billing${[statusFilter && `status=${statusFilter}`, dateFrom && `dateFrom=${dateFrom}`, dateTo && `dateTo=${dateTo}`].filter(Boolean).join("&") ? `?${[statusFilter && `status=${statusFilter}`, dateFrom && `dateFrom=${dateFrom}`, dateTo && `dateTo=${dateTo}`].filter(Boolean).join("&")}` : ""}`;

  return (
    <div>
      <div className="bm-page-header">
        <div>
          <div className="bm-page-title">Billing &amp; Payments</div>
          <div className="bm-page-sub">Manage patient bills, charges &amp; payment collection</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          {selectedBills.length > 0 && (
            <button className="bm-btn-secondary" onClick={handleBulkDownload}>
              <Download size={15}/>
              Download Selected ({selectedBills.length})
            </button>
          )}
          {scope !== "pharmacy" && <button className="bm-btn-primary" onClick={onNew}><Plus size={15}/>New Bill</button>}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[
          { label:"Today's Collection", val:fmtCur(stats.todayRevenue),  icon:<IndianRupee size={20} color="#0E898F"/>, bg:"#E6F4F4" },
          { label:"Month Revenue",       val:fmtCur(stats.monthRevenue),  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, bg:"#f0fdf4" },
          { label:"Pending Bills",       val:String(stats.pendingCount),  icon:<Clock size={20} color="#ea580c"/>,         bg:"#fff3e6" },
          { label:"Total Bills",         val:String(pagination.total),    icon:<Receipt size={20} color="#a855f7"/>,        bg:"#fdf4ff" },
        ].map((s,i)=>(
          <div key={i}
            style={{background:"#fff",borderRadius:12,padding:12,border:"1px solid #e2e8f0",transition:"box-shadow .2s,transform .15s",display:"flex",alignItems:"center",gap:12}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.08)";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="";}}>
            <div style={{width:44,height:44,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:18,fontWeight:800,color:"#0f172a",lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:10,color:"#64748b",marginTop:3}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bm-filters">
        <div className="bm-search-wrap">
          <Search size={14} color="#94a3b8"/>
          <input className="bm-search" placeholder="Search by patient name, bill number…" value={search}
            onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onRefresh()}/>
          {search && <button className="bm-clear-btn" onClick={()=>setSearch("")}><X size={12}/></button>}
        </div>
        <select className="bm-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {Object.entries(STATUS_COLORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" className="bm-select" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} title="Date From"/>
        <input type="date" className="bm-select" value={dateTo}   onChange={e=>setDateTo(e.target.value)}   title="Date To"/>
        <button className="bm-icon-btn" onClick={onRefresh} title="Refresh"><RefreshCw size={14}/></button>
        <div style={{position:"relative"}} ref={exportRef}>
          <button
            onClick={()=>setExportDropdown(!exportDropdown)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"#f0fdf4",border:"1px solid #bbf7d0",color:"#059669",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}
          >
            <Download size={13}/>Export<ChevronDown size={13}/>
          </button>
          {exportDropdown && (
            <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,.1)",zIndex:100,minWidth:140}}>
              <a href={exportUrl} download onClick={()=>setExportDropdown(false)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",fontSize:12,color:"#475569",textDecoration:"none",borderBottom:"1px solid #f1f5f9",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <FileSpreadsheet size={14} color="#10b981"/>Excel (CSV)
              </a>
              <button onClick={()=>{alert("PDF export coming soon");setExportDropdown(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",fontSize:12,color:"#475569",background:"none",border:"none",width:"100%",textAlign:"left",cursor:"pointer",borderBottom:"1px solid #f1f5f9",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <FileTextIcon size={14} color="#ef4444"/>PDF
              </button>
              <button onClick={()=>{alert("Word export coming soon");setExportDropdown(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",fontSize:12,color:"#475569",background:"none",border:"none",width:"100%",textAlign:"left",cursor:"pointer",transition:"background .15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <FileJson size={14} color="#2563eb"/>Word (DOCX)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bm-table-card">
        {loading ? (
          <div className="bm-loader"><Loader2 size={22} className="bm-spin"/><span>Loading bills…</span></div>
        ) : bills.length === 0 ? (
          <div className="bm-empty">
            <Receipt size={40} color="#cbd5e1"/>
            <div style={{marginTop:12,fontWeight:700,color:"#64748b"}}>No bills found</div>
            <div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>Create a new bill to get started</div>
          </div>
        ) : (
          <div className="bm-tbl-wrap">
            <table className="bm-tbl">
              <thead>
                <tr>
                  <th style={{width:40}}>
                    <input 
                      type="checkbox" 
                      checked={selectedBills.length === bills.length && bills.length > 0}
                      onChange={toggleSelectAll}
                      style={{cursor:"pointer",width:16,height:16}}
                    />
                  </th>
                  <th>Bill No.</th><th>Patient</th><th>Date</th>
                  <th>Items</th><th>Amount</th><th>Paid</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b:any)=>{
                  const sc = STATUS_COLORS[b.status] || STATUS_COLORS.PENDING;
                  const isSelected = selectedBills.includes(b.id);
                  return (
                    <tr key={b.id} className="bm-tbl-row" onClick={()=>onOpen(b.id)} style={isSelected?{background:"#E6F4F4"}:{}}>
                      <td onClick={e=>e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(b.id)}
                          style={{cursor:"pointer",width:16,height:16}}
                        />
                      </td>
                      <td><span className="bm-bill-no">{b.billNo}</span></td>
                      <td>
                        <div className="bm-pt-name">{b.patient?.name || "—"}</div>
                        <div className="bm-pt-id">{b.patient?.patientId}</div>
                      </td>
                      <td style={{fontSize:12,color:"#64748b"}}>{fmtDate(b.createdAt)}</td>
                      <td style={{fontSize:12,color:"#64748b"}}>{b.billItems?.length || 0} item{(b.billItems?.length||0)!==1?"s":""}</td>
                      <td style={{fontWeight:700,color:"#1e293b"}}>{fmtCur(scope==="pharmacy" ? getPharmacyTotal(b) : b.total)}</td>
                      <td style={{fontSize:12,color:"#10b981",fontWeight:600}}>{fmtCur(scope==="pharmacy" ? (b.status==="PAID" ? getPharmacyTotal(b) : 0) : b.paidAmount)}</td>
                      <td onClick={e=>e.stopPropagation()}>
                        <span className="bm-badge" style={{background:sc.bg,color:sc.color}}>{sc.label}</span>
                      </td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{display:"flex",gap:6}}>
                          <button className="bm-action-btn" onClick={()=>onOpen(b.id)} title="View Bill"><Eye size={13}/></button>
                          {b.status !== "PAID" && b.status !== "CANCELLED" && (
                            <>
                              <button className="bm-action-btn" onClick={()=>onOpen(b.id)} title="Edit Bill" style={{color:"#0E898F"}}><Edit size={13}/></button>
                              <button className="bm-action-btn" onClick={()=>onOpen(b.id)} title="Record Payment" style={{color:"#10b981"}}><CreditCard size={13}/></button>
                            </>
                          )}
                          <button 
                            className="bm-action-btn" 
                            onClick={()=>handleDelete(b.id)} 
                            title="Delete Bill" 
                            style={{color:"#ef4444"}}
                            disabled={deleting}
                          >
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
        )}
        {/* Pagination */}
        {pagination.pages > 1 && !loading && (
          <div className="bm-pagination">
            <span style={{fontSize:12,color:"#64748b"}}>
              Showing {((pagination.page-1)*15)+1}–{Math.min(pagination.page*15, pagination.total)} of {pagination.total}
            </span>
            <div style={{display:"flex",gap:4}}>
              {Array.from({length:pagination.pages},(_,i)=>i+1).map(p=>(
                <button key={p} className={`bm-pg-btn${p===pagination.page?" active":""}`} onClick={()=>onPageChange(p)}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Bill ─────────────────────────────────────────────────────────────────
function NewBill({ hospitalInfo, onBack, onCreated }:{ hospitalInfo:any; onBack:()=>void; onCreated:(id:string)=>void }) {
  const [patientQuery, setPatientQuery]   = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patient, setPatient]             = useState<any>(null);
  const [appointments, setAppointments]   = useState<any[]>([]);
  const [catalog, setCatalog]             = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [addMode, setAddMode]             = useState<"catalog"|"appointment"|"manual">("catalog");
  const [catalogType, setCatalogType]     = useState("ALL");
  const [lineItems, setLineItems]         = useState<LineItem[]>([]);
  const [discountType, setDiscountType]   = useState<"flat"|"percent">("flat");
  const [discountVal, setDiscountVal]     = useState(0);
  const [taxPercent, setTaxPercent]       = useState(0);
  const [cgst, setCgst]                   = useState(0);
  const [sgst, setSgst]                   = useState(0);
  const [taxMode, setTaxMode]             = useState<"gst"|"custom">("custom");
  const [additionalAmt, setAdditionalAmt] = useState(0);
  const [additionalNote, setAdditionalNote] = useState("");
  const [notes, setNotes]                 = useState("");
  const [manualItem, setManualItem]       = useState({ name:"", type:"OTHER", quantity:1, unitPrice:0 });
  const [creating, setCreating]           = useState(false);
  const [error, setError]                 = useState("");
  const [showDropdown, setShowDropdown]   = useState(false);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    setCatalogLoading(true);
    apiFetch("/api/config/pricing").then(d => {
      if (d.success) setCatalog(d.data || []);
      setCatalogLoading(false);
    });
  }, []);

  const searchPatients = (q: string) => {
    setPatientQuery(q); setShowDropdown(true);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setPatientResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setPatientLoading(true);
      const d = await apiFetch(`/api/patients?q=${encodeURIComponent(q)}`);
      setPatientResults(d.success ? d.data : []);
      setPatientLoading(false);
    }, 300);
  };

  const selectPatient = async (p: any) => {
    setPatient(p); setPatientQuery(p.name); setShowDropdown(false); setPatientResults([]);
    const d = await apiFetch(`/api/appointments?patientId=${p.id}&limit=20`);
    if (d.success) setAppointments(d.data.appointments || []);
  };

  const addFromCatalog = (item: any) => {
    const existing = lineItems.find(i => i.referenceId === item.id && i.type === item.type);
    if (existing) {
      setLineItems(li => li.map(i => i.referenceId === item.id && i.type === item.type
        ? { ...i, quantity: i.quantity+1, amount:(i.quantity+1)*i.unitPrice } : i));
    } else {
      setLineItems(li => [...li, {
        id: Date.now().toString(), type: item.type, name: item.name,
        quantity: 1, unitPrice: item.amount, amount: item.amount, referenceId: item.id,
      }]);
    }
  };

  const addFromAppointment = (appt: any) => {
    const fee = appt.consultationFee ?? appt.doctor?.consultationFee ?? 0;
    const alreadyAdded = lineItems.some(i => i.referenceId === appt.id && i.type === "CONSULTATION");
    if (alreadyAdded) return;
    setLineItems(li => [...li, {
      id: Date.now().toString(), type: "CONSULTATION",
      name: `Consultation — ${appt.doctor?.name || "Doctor"} (${fmtDate(appt.appointmentDate)})`,
      quantity: 1, unitPrice: fee, amount: fee, referenceId: appt.id,
    }]);
  };

  const addManualItem = () => {
    if (!manualItem.name.trim() || manualItem.unitPrice <= 0) return;
    setLineItems(li => [...li, {
      id: Date.now().toString(), type: manualItem.type, name: manualItem.name,
      quantity: manualItem.quantity, unitPrice: manualItem.unitPrice,
      amount: manualItem.quantity * manualItem.unitPrice,
    }]);
    setManualItem({ name:"", type:"OTHER", quantity:1, unitPrice:0 });
  };

  const updateQty = (id: string, qty: number) => {
    setLineItems(li => li.map(i => i.id===id ? {...i, quantity:qty, amount:qty*i.unitPrice} : i));
  };
  const removeItem = (id: string) => setLineItems(li => li.filter(i => i.id !== id));

  // Bill calculations
  const subtotal      = lineItems.reduce((s,i)=>s+i.amount, 0);
  const discountAmt   = discountType==="percent" ? subtotal*discountVal/100 : discountVal;
  const taxableAmt    = Math.max(0, subtotal - discountAmt);
  const effectiveTax  = taxMode==="gst" ? cgst+sgst : taxPercent;
  const taxAmt        = taxableAmt * effectiveTax / 100;
  const cgstAmt       = taxMode==="gst" ? taxableAmt*cgst/100 : 0;
  const sgstAmt       = taxMode==="gst" ? taxableAmt*sgst/100 : 0;
  const grandTotal    = taxableAmt + taxAmt + (additionalAmt||0);

  const createBill = async () => {
    if (!patient)             { setError("Please select a patient"); return; }
    if (lineItems.length===0) { setError("Please add at least one charge"); return; }
    setError(""); setCreating(true);
    const body = {
      patientId: patient.id,
      items: lineItems.map(i=>({ type:i.type, name:i.name, quantity:i.quantity, unitPrice:i.unitPrice, referenceId:i.referenceId })),
      discount: Math.round(discountAmt*100)/100,
      tax: Math.round(taxAmt*100)/100,
      notes: notes || undefined,
    };
    const d = await apiFetch("/api/billing", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    setCreating(false);
    if (d.success) { onCreated(d.data.id); }
    else setError(d.message || "Failed to create bill");
  };

  const filteredCatalog = catalogType==="ALL" ? catalog : catalog.filter((c:any)=>c.type===catalogType);
  const typeInfo = (t:string) => ITEM_TYPES.find(x=>x.value===t) || ITEM_TYPES[ITEM_TYPES.length-1];

  return (
    <div>
      <div className="bm-page-header">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="bm-back-btn" onClick={onBack}><ChevronLeft size={16}/></button>
          <div>
            <div className="bm-page-title">New Bill</div>
            <div className="bm-page-sub">Create a new patient bill</div>
          </div>
        </div>
      </div>

      <div className="bm-create-grid">
        {/* LEFT: Charge Selection */}
        <div>
          {/* Patient Search */}
          <div className="bm-section-card">
            <div className="bm-section-head"><User size={15} color="#0E898F"/><span>Patient</span></div>
            <div style={{position:"relative"}}>
              <div className="bm-search-wrap">
                <Search size={14} color="#94a3b8"/>
                <input className="bm-search" placeholder="Search by name, phone or Patient ID…"
                  value={patientQuery} onChange={e=>searchPatients(e.target.value)}
                  onFocus={()=>patientQuery&&setShowDropdown(true)}/>
                {patientLoading && <Loader2 size={13} className="bm-spin" color="#94a3b8"/>}
                {patientQuery && <button className="bm-clear-btn" onClick={()=>{setPatientQuery("");setPatient(null);setShowDropdown(false);}}><X size={12}/></button>}
              </div>
              {showDropdown && patientResults.length>0 && (
                <div className="bm-dropdown">
                  {patientResults.map((p:any)=>(
                    <div key={p.id} className="bm-dropdown-item" onClick={()=>selectPatient(p)}>
                      <div style={{fontWeight:600,fontSize:13,color:"#1e293b"}}>{p.name}</div>
                      <div style={{fontSize:11,color:"#94a3b8"}}>{p.patientId} · {p.phone} {p.gender?`· ${p.gender}`:""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {patient && (
              <div className="bm-patient-card">
                <div className="bm-patient-av">{patient.name?.split(" ").map((x:string)=>x[0]).join("").slice(0,2).toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:"#1e293b",fontSize:14}}>{patient.name}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:2,display:"flex",gap:12,flexWrap:"wrap"}}>
                    <span>{patient.patientId}</span>
                    {patient.gender && <span>{patient.gender}</span>}
                    {patient.dateOfBirth && <span>Age: {new Date().getFullYear()-new Date(patient.dateOfBirth).getFullYear()} yrs</span>}
                    {patient.phone && <span>{patient.phone}</span>}
                    {patient.bloodGroup && <span className="bm-blood">{patient.bloodGroup}</span>}
                  </div>
                </div>
                <CheckCircle2 size={18} color="#10b981"/>
              </div>
            )}
          </div>

          {/* Add Charges */}
          <div className="bm-section-card" style={{marginTop:16}}>
            <div className="bm-section-head"><Plus size={15} color="#0E898F"/><span>Add Charges</span></div>
            <div className="bm-add-tabs">
              {(["catalog","appointment","manual"] as const).map(m=>(
                <button key={m} className={`bm-add-tab${addMode===m?" active":""}`} onClick={()=>setAddMode(m)}>
                  {m==="catalog"?"Charge Catalog":m==="appointment"?"Appointments":"Manual Entry"}
                </button>
              ))}
            </div>

            {addMode==="catalog" && (
              <div>
                <div className="bm-type-tabs">
                  <button className={`bm-type-tab${catalogType==="ALL"?" active":""}`} onClick={()=>setCatalogType("ALL")}>All</button>
                  {ITEM_TYPES.map(t=>(
                    <button key={t.value} className={`bm-type-tab${catalogType===t.value?" active":""}`}
                      style={catalogType===t.value?{background:t.color,color:"#fff",borderColor:t.color}:{}}
                      onClick={()=>setCatalogType(t.value)}>{t.label}</button>
                  ))}
                </div>
                {catalogLoading ? <div className="bm-loader"><Loader2 size={16} className="bm-spin"/></div> : (
                  <div className="bm-catalog-grid">
                    {filteredCatalog.length===0 ? (
                      <div style={{gridColumn:"1/-1",textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:13}}>
                        No charges in catalog. Add them via Configure → Billing &amp; Charges.
                      </div>
                    ) : filteredCatalog.map((item:any)=>{
                      const ti = typeInfo(item.type);
                      return (
                        <div key={item.id} className="bm-catalog-item" onClick={()=>addFromCatalog(item)}>
                          <div className="bm-cat-icon" style={{background:ti.color+"20"}}><ti.icon size={13} color={ti.color}/></div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:600,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                            <div style={{fontSize:10,color:"#94a3b8"}}>{ti.label}</div>
                          </div>
                          <div style={{fontSize:12,fontWeight:700,color:"#0E898F",whiteSpace:"nowrap"}}>{fmtCur(item.amount)}</div>
                          <div className="bm-cat-add"><Plus size={10}/></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {addMode==="appointment" && (
              <div>
                {!patient ? (
                  <div style={{textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:13}}>Select a patient first to load appointments</div>
                ) : appointments.length===0 ? (
                  <div style={{textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:13}}>No appointments found for this patient</div>
                ) : (
                  <div className="bm-appt-list">
                    {appointments.map((a:any)=>{
                      const fee = a.consultationFee ?? a.doctor?.consultationFee ?? 0;
                      const added = lineItems.some(i=>i.referenceId===a.id&&i.type==="CONSULTATION");
                      return (
                        <div key={a.id} className={`bm-appt-row${added?" added":""}`}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>
                              {a.doctor?.name||"Doctor"} <span style={{fontWeight:400,color:"#64748b"}}>· {a.department?.name||a.type}</span>
                            </div>
                            <div style={{fontSize:11,color:"#94a3b8"}}>{fmtDate(a.appointmentDate)} · {a.timeSlot}</div>
                          </div>
                          <span className="bm-badge" style={STATUS_COLORS[a.status]?{background:STATUS_COLORS[a.status]?.bg,color:STATUS_COLORS[a.status]?.color}:{background:"#f1f5f9",color:"#64748b"}}>{a.status}</span>
                          <span style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{fmtCur(fee)}</span>
                          <button className={`bm-btn-sm${added?" added":""}`} onClick={()=>!added&&addFromAppointment(a)} disabled={added}>
                            {added?<Check size={11}/>:<Plus size={11}/>} {added?"Added":"Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {addMode==="manual" && (
              <div className="bm-manual-form">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div style={{gridColumn:"1/-1"}}>
                    <label className="bm-lbl">Item Name *</label>
                    <input className="bm-inp" placeholder="e.g. ECG, Dressing, MRI Scan" value={manualItem.name}
                      onChange={e=>setManualItem(m=>({...m,name:e.target.value}))}/>
                  </div>
                  <div>
                    <label className="bm-lbl">Type</label>
                    <select className="bm-inp" value={manualItem.type} onChange={e=>setManualItem(m=>({...m,type:e.target.value}))}>
                      {ITEM_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="bm-lbl">Unit Price (₹) *</label>
                    <input className="bm-inp" type="number" min="0" placeholder="0.00" value={manualItem.unitPrice||""}
                      onChange={e=>setManualItem(m=>({...m,unitPrice:parseFloat(e.target.value)||0}))}/>
                  </div>
                  <div>
                    <label className="bm-lbl">Quantity</label>
                    <input className="bm-inp" type="number" min="1" value={manualItem.quantity}
                      onChange={e=>setManualItem(m=>({...m,quantity:parseInt(e.target.value)||1}))}/>
                  </div>
                </div>
                <button className="bm-btn-primary" style={{width:"100%"}} onClick={addManualItem}
                  disabled={!manualItem.name.trim()||manualItem.unitPrice<=0}>
                  <Plus size={14}/> Add to Bill
                </button>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          {lineItems.length>0 && (
            <div className="bm-section-card" style={{marginTop:16}}>
              <div className="bm-section-head"><Receipt size={15} color="#0E898F"/><span>Bill Items ({lineItems.length})</span></div>
              <table className="bm-tbl" style={{marginTop:8}}>
                <thead>
                  <tr><th>Description</th><th>Type</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {lineItems.map(item=>{
                    const ti = typeInfo(item.type);
                    return (
                      <tr key={item.id}>
                        <td style={{fontSize:12,color:"#1e293b",fontWeight:500}}>{item.name}</td>
                        <td><span style={{fontSize:10,fontWeight:600,color:ti.color,background:ti.color+"15",padding:"2px 6px",borderRadius:4}}>{ti.label}</span></td>
                        <td>
                          <input className="bm-qty-inp" type="number" min="1" value={item.quantity}
                            onChange={e=>updateQty(item.id,parseInt(e.target.value)||1)}/>
                        </td>
                        <td style={{fontSize:12,color:"#475569"}}>{fmtCur(item.unitPrice)}</td>
                        <td style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{fmtCur(item.amount)}</td>
                        <td><button className="bm-del-btn" onClick={()=>removeItem(item.id)}><Trash2 size={13}/></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: Bill Summary */}
        <div>
          <div className="bm-summary-card">
            <div className="bm-section-head"><FileText size={15} color="#0E898F"/><span>Bill Summary</span></div>

            {/* Discount */}
            <div className="bm-sum-row-lbl">Discount</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:"1px solid #e2e8f0",flexShrink:0}}>
                <button className={`bm-disc-type${discountType==="flat"?" on":""}`} onClick={()=>setDiscountType("flat")}>₹</button>
                <button className={`bm-disc-type${discountType==="percent"?" on":""}`} onClick={()=>setDiscountType("percent")}>%</button>
              </div>
              <input className="bm-inp" type="number" min="0" placeholder="0"
                value={discountVal||""} onChange={e=>setDiscountVal(parseFloat(e.target.value)||0)} style={{flex:1}}/>
            </div>

            {/* Tax */}
            <div className="bm-sum-row-lbl">Tax</div>
            <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:"1px solid #e2e8f0",marginBottom:8}}>
              <button className={`bm-disc-type${taxMode==="custom"?" on":""}`} style={{flex:1}} onClick={()=>setTaxMode("custom")}>Custom %</button>
              <button className={`bm-disc-type${taxMode==="gst"?" on":""}`} style={{flex:1}} onClick={()=>setTaxMode("gst")}>GST</button>
            </div>
            {taxMode==="custom" ? (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <input className="bm-inp" type="number" min="0" max="100" placeholder="0" style={{flex:1}}
                  value={taxPercent||""} onChange={e=>setTaxPercent(parseFloat(e.target.value)||0)}/>
                <span style={{fontSize:12,color:"#64748b"}}>%</span>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <div>
                  <label className="bm-lbl">CGST %</label>
                  <input className="bm-inp" type="number" min="0" max="50" placeholder="9"
                    value={cgst||""} onChange={e=>setCgst(parseFloat(e.target.value)||0)}/>
                </div>
                <div>
                  <label className="bm-lbl">SGST %</label>
                  <input className="bm-inp" type="number" min="0" max="50" placeholder="9"
                    value={sgst||""} onChange={e=>setSgst(parseFloat(e.target.value)||0)}/>
                </div>
              </div>
            )}

            {/* Additional Charges */}
            <div className="bm-sum-row-lbl">Additional Charges</div>
            <input className="bm-inp" type="number" min="0" placeholder="0.00" style={{marginBottom:6}}
              value={additionalAmt||""} onChange={e=>setAdditionalAmt(parseFloat(e.target.value)||0)}/>
            {additionalAmt>0 && (
              <input className="bm-inp" placeholder="Description (e.g. Ambulance charge)" style={{marginBottom:12}}
                value={additionalNote} onChange={e=>setAdditionalNote(e.target.value)}/>
            )}

            {/* Notes */}
            <div className="bm-sum-row-lbl">Notes</div>
            <textarea className="bm-inp" rows={2} placeholder="Optional notes for this bill…" style={{marginBottom:16,resize:"vertical"}}
              value={notes} onChange={e=>setNotes(e.target.value)}/>

            {/* Totals */}
            <div className="bm-totals">
              <div className="bm-total-row"><span>Subtotal</span><span>{fmtCur(subtotal)}</span></div>
              {discountAmt>0 && <div className="bm-total-row" style={{color:"#10b981"}}><span>Discount {discountType==="percent"?`(${discountVal}%)`:""}</span><span>− {fmtCur(discountAmt)}</span></div>}
              {taxMode==="gst" && (cgstAmt>0||sgstAmt>0) && (<>
                <div className="bm-total-row"><span>CGST ({cgst}%)</span><span>{fmtCur(cgstAmt)}</span></div>
                <div className="bm-total-row"><span>SGST ({sgst}%)</span><span>{fmtCur(sgstAmt)}</span></div>
              </>)}
              {taxMode==="custom" && taxAmt>0 && (
                <div className="bm-total-row"><span>Tax ({taxPercent}%)</span><span>{fmtCur(taxAmt)}</span></div>
              )}
              {additionalAmt>0 && <div className="bm-total-row"><span>{additionalNote||"Additional Charges"}</span><span>{fmtCur(additionalAmt)}</span></div>}
              <div className="bm-grand-total"><span>Grand Total</span><span>{fmtCur(grandTotal)}</span></div>
            </div>

            {error && <div className="bm-error">{error}</div>}
            <button className="bm-btn-primary" style={{width:"100%",marginTop:14,padding:"12px 0",fontSize:14,justifyContent:"center"}}
              onClick={createBill} disabled={creating||!patient||lineItems.length===0}>
              {creating?<><Loader2 size={14} className="bm-spin"/>Generating…</>:<><FileText size={14}/>Generate Bill</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Bill Detail ──────────────────────────────────────────────────────────────
function BillDetail({ bill, loading, hospitalInfo, onBack, onRefresh }:any) {
  const [payModal, setPayModal]   = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payTxn, setPayTxn]       = useState("");
  const [payNote, setPayNote]     = useState("");
  const [paying, setPaying]       = useState(false);
  const [payError, setPayError]   = useState("");
  const printRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [itemsEdit, setItemsEdit] = useState<LineItem[]>([]);
  const [savingItems, setSavingItems] = useState(false);
  const [discEdit, setDiscEdit] = useState(0);
  const [taxEdit, setTaxEdit] = useState(0);
  const [notesEdit, setNotesEdit] = useState("");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const autoSaveTimerRef = useRef<any>(null);

  const handleRevert = () => {
    if (!bill?.id) return;
    setConfirmModal(true);
  };

  const confirmRevert = async () => {
    if (!bill?.id) return;
    setConfirmModal(false);
    setReverting(true);
    try {
      const res = await apiFetch(`/api/billing/${bill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revert: true }),
      });
      if (res.success) { onRefresh(); }
    } catch {}
    setReverting(false);
  };

  useEffect(() => {
    if (!bill) return;
    setEditMode(false);
    setItemsEdit((bill.billItems || []).map((i:any) => ({
      id: i.id,
      type: i.type,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.amount,
      referenceId: i.referenceId || undefined,
    })));
    setDiscEdit(Number(bill.discount || 0));
    setTaxEdit(Number(bill.tax || 0));
    setNotesEdit(bill.notes || "");
  }, [bill?.id]);

  // Real-time calculation of totals
  const calculatedSubtotal = useMemo(() => {
    return (editMode ? itemsEdit : (bill?.billItems || [])).reduce((sum:number, item:any) => sum + (Number(item.amount) || 0), 0);
  }, [editMode, itemsEdit, bill?.billItems]);

  const calculatedTotal = useMemo(() => {
    return Math.max(0, calculatedSubtotal - discEdit + taxEdit);
  }, [calculatedSubtotal, discEdit, taxEdit]);

  const calculatedRemaining = useMemo(() => {
    return Math.max(0, calculatedTotal - (bill?.paidAmount || 0));
  }, [calculatedTotal, bill?.paidAmount]);

  // Auto-save discount, tax, and notes with debouncing
  useEffect(() => {
    if (!editMode || !bill) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveSummary();
    }, 1000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [discEdit, taxEdit, notesEdit]);

  const recordPayment = async () => {
    const amt = parseFloat(payAmount);
    if (!amt || amt<=0) { setPayError("Enter valid amount"); return; }
    setPaying(true); setPayError("");
    const d = await apiFetch(`/api/billing/${bill.id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ amount:amt, method:payMethod, transactionId:payTxn||undefined, notes:payNote||undefined }),
    });
    setPaying(false);
    if (d.success) { setPayModal(false); setPayAmount(""); setPayTxn(""); setPayNote(""); onRefresh(); }
    else setPayError(d.message || "Payment failed");
  };

  const printBill = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open("","_blank","width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Bill - ${bill?.billNo}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter','Segoe UI',Arial,sans-serif;font-size:13px;color:#334155;background:#fff;padding:0}
.print-wrap{max-width:800px;margin:0 auto;padding:32px 40px 40px;background:#fff;background-size:100% 100%;background-position:center;background-repeat:no-repeat}
.hospital-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0E898F;padding-bottom:18px;margin-bottom:24px}
.h-logo-img{width:70px;height:70px;object-fit:contain}
.h-logo{width:70px;height:70px;background:linear-gradient(135deg,#0E898F,#07595D);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:900;box-shadow:0 4px 12px rgba(59,130,246,0.25)}
.h-name{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-0.02em}
.h-sub{font-size:12px;color:#64748b;margin-top:3px;line-height:1.5}
.bill-info-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;background:#f8fafc;border-radius:12px;padding:16px 18px;border:1px solid #e2e8f0}
.info-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:4px}
.info-val{font-size:13px;font-weight:600;color:#1e293b}
.status-badge{display:inline-flex;padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700}
.items-table{width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.items-table th{text-align:left;padding:12px 14px;background:#f1f5f9;color:#475569;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;border-bottom:2px solid #e2e8f0}
.items-table td{padding:11px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569}
.items-table tr:last-child td{border-bottom:none}
.items-table tbody tr:hover{background:#f8fafc}
.totals-section{width:300px;margin-left:auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
.total-row{display:flex;justify-content:space-between;padding:9px 16px;font-size:13px;border-bottom:1px solid #f1f5f9;color:#475569}
.grand-row{display:flex;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#0E898F,#0A6B70);color:#fff;font-size:15px;font-weight:800}
.payment-section{margin-top:24px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.pay-head{background:#f8fafc;padding:10px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b}
.pay-row{display:flex;gap:14px;padding:10px 16px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569}
.pay-row:last-child{border-bottom:none}
.footer{margin-top:36px;text-align:center;padding-top:16px;border-top:1px dashed #cbd5e1;font-size:11px;color:#94a3b8;line-height:1.6}
.sig-section{display:flex;justify-content:space-between;margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0}
.sig-box{text-align:center;width:180px}
.sig-line{border-top:1.5px solid #334155;margin-top:40px;padding-top:8px;font-size:11px;color:#64748b;font-weight:500}
.action-bar{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:2px solid #e2e8f0;padding:16px 24px;display:flex;justify-content:center;gap:12px;box-shadow:0 -4px 12px rgba(0,0,0,0.08);z-index:1000}
.action-btn{padding:10px 24px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .2s;font-family:'Inter',sans-serif}
.btn-download{background:linear-gradient(135deg,#0E898F,#0A6B70);color:#fff;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
.btn-download:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(59,130,246,0.4)}
.btn-print{background:#fff;color:#475569;border:1.5px solid #e2e8f0}
.btn-print:hover{background:#f8fafc;border-color:#cbd5e1}
@media print{.action-bar{display:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.print-wrap{-webkit-print-color-adjust:exact;print-color-adjust:exact;background-size:100% 100%!important;background-position:center!important;background-repeat:no-repeat!important}}
</style></head><body>
${printContent}
<div class="action-bar">
  <button class="action-btn btn-download" onclick="setTimeout(function(){window.print();},100);">📥 Download PDF</button>
  <button class="action-btn btn-print" onclick="window.print()">🖨️ Print</button>
</div>
</body></html>`);
    win.document.close();
  };

  const exportPDF = () => {
    printBill();
  };

  const exportCSV = (b:any) => {
    const rows = [
      ["Bill No", b.billNo],
      ["Date", fmtDateTime(b.createdAt)],
      ["Patient", b.patient?.name || ""],
      ["Patient ID", b.patient?.patientId || ""],
      [],
      ["#", "Description", "Type", "Qty", "Rate", "Amount"],
      ...(b.billItems||[]).map((it:any, i:number)=>[
        String(i+1), it.name, it.type, String(it.quantity), String(it.unitPrice), String(it.amount)
      ]),
      [],
      ["Subtotal", String(b.subtotal)],
      ["Discount", String(b.discount)],
      ["Tax", String(b.tax)],
      ["Total", String(b.total)],
    ];
    const csv = rows.map(r => r.map((cell: any) => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${b.billNo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = (b:any) => {
    const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${b.billNo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = (b:any) => {
    const esc = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const rows = (b.billItems||[]).map((it:any, idx:number) => (
      `<tr><td>${idx+1}</td><td>${esc(it.name)}</td><td>${esc(it.type)}</td><td>${esc(it.quantity)}</td><td>${esc(it.unitPrice)}</td><td>${esc(it.amount)}</td></tr>`
    )).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><th colspan="2">Bill</th></tr>
        <tr><td>Bill No</td><td>${esc(b.billNo)}</td></tr>
        <tr><td>Date</td><td>${esc(fmtDateTime(b.createdAt))}</td></tr>
        <tr><td>Patient</td><td>${esc(b.patient?.name)}</td></tr>
        <tr><td>Patient ID</td><td>${esc(b.patient?.patientId)}</td></tr>
      </table>
      <br/>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><th>#</th><th>Description</th><th>Type</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
        ${rows}
      </table>
      <br/>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><td>Subtotal</td><td>${esc(b.subtotal)}</td></tr>
        <tr><td>Discount</td><td>${esc(b.discount)}</td></tr>
        <tr><td>Tax</td><td>${esc(b.tax)}</td></tr>
        <tr><td><b>Total</b></td><td><b>${esc(b.total)}</b></td></tr>
      </table>
    </body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${b.billNo}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateItem = (idx:number, key:keyof LineItem, value:any) => {
    setItemsEdit(prev => {
      const arr = [...prev];
      const it: any = { ...arr[idx], [key]: value };
      it.amount = Number(it.quantity||0) * Number(it.unitPrice||0);
      arr[idx] = it;
      return arr;
    });
  };
  const addItem = () => {
    setItemsEdit(prev => [...prev, { id:"", type:"OTHER", name:"", quantity:1, unitPrice:0, amount:0 } as any ]);
  };
  const removeItem = (idx:number) => {
    setItemsEdit(prev => prev.filter((_,i)=>i!==idx));
  };
  const saveItems = async () => {
    setSavingItems(true);
    const payload = { items: itemsEdit.map(i => ({ type: i.type, name: i.name, quantity: Number(i.quantity||0), unitPrice: Number(i.unitPrice||0) })) };
    const r = await apiFetch(`/api/billing/${bill.id}/items`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (r.success) { onRefresh(); setEditMode(false); }
    setSavingItems(false);
  };
  const saveSummary = async () => {
    const r = await apiFetch(`/api/billing/${bill.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discount: discEdit, tax: taxEdit, notes: notesEdit }) });
    // Don't refresh to avoid interrupting user input - changes are saved in background
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:12,color:"#64748b"}}>
      <Loader2 size={22} className="bm-spin"/><span>Loading bill…</span>
    </div>
  );
  if (!bill) return null;

  const sc = STATUS_COLORS[bill.status] || STATUS_COLORS.PENDING;
  const remaining = Math.max(0, bill.total - (bill.paidAmount||0));
  const canEditBill = bill.status !== "PAID" && bill.status !== "CANCELLED" && Number(bill.paidAmount || 0) <= 0;

  return (
    <div>
      <div className="bm-page-header">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="bm-back-btn" onClick={onBack}><ChevronLeft size={16}/></button>
          <div>
            <div className="bm-page-title">{bill.billNo}</div>
            <div className="bm-page-sub">{fmtDateTime(bill.createdAt)}</div>
          </div>
          <span className="bm-badge" style={{background:sc.bg,color:sc.color,marginLeft:4,padding:"4px 12px",fontSize:12}}>{sc.label}</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="bm-icon-btn" onClick={onRefresh} title="Refresh"><RefreshCw size={14}/></button>
          <button className="bm-btn-secondary" onClick={printBill}><Printer size={14}/>Print</button>
          <div style={{position:"relative"}}>
            <button className="bm-btn-secondary" onClick={()=>setShowExportDropdown(!showExportDropdown)}>
              <Download size={14}/>Export<ChevronDown size={13}/>
            </button>
            {showExportDropdown && (
              <div className="bm-export-dropdown">
                <button onClick={()=>{printBill();setShowExportDropdown(false);}}><FileTextIcon size={14}/>Export as PDF</button>
                <button onClick={()=>{exportExcel(bill);setShowExportDropdown(false);}}><FileSpreadsheet size={14}/>Export as Excel</button>
                <button onClick={()=>{exportCSV(bill);setShowExportDropdown(false);}}><FileSpreadsheet size={14}/>Export as CSV</button>
                <button onClick={()=>{exportJSON(bill);setShowExportDropdown(false);}}><FileJson size={14}/>Export as JSON</button>
              </div>
            )}
          </div>
          <button className="bm-btn-secondary" disabled={!canEditBill} onClick={()=>canEditBill&&setEditMode(v=>!v)} style={!canEditBill?{opacity:.55,cursor:"not-allowed"}:undefined}><Pencil size={14}/>{editMode?"Finish Edit":"Edit Bill"}</button>
          {(bill.status === "PAID" || bill.status === "PARTIALLY_PAID") && (
            <button className="bm-btn-secondary" onClick={handleRevert} disabled={reverting}>
              {reverting ? <Loader2 size={14} className="bm-spin"/> : <RefreshCw size={14}/>}Regenerate
            </button>
          )}
          {bill.status!=="PAID" && bill.status!=="CANCELLED" && (
            <button className="bm-btn-primary" onClick={()=>setPayModal(true)}><CreditCard size={14}/>Record Payment</button>
          )}
        </div>
      </div>

      <div className="bm-detail-grid">
        {/* Bill Content */}
        <div>
          {/* Patient + Bill Info */}
          <div className="bm-section-card">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <div>
                <div className="bm-info-lbl">Patient</div>
                <div style={{fontWeight:700,fontSize:15,color:"#1e293b"}}>{bill.patient?.name}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{bill.patient?.patientId}</div>
                {bill.patient?.phone && <div style={{fontSize:12,color:"#64748b"}}>{bill.patient.phone}</div>}
                {bill.patient?.gender && <div style={{fontSize:12,color:"#64748b"}}>{bill.patient.gender}</div>}
              </div>
              <div>
                <div className="bm-info-lbl">Bill Details</div>
                <div style={{fontSize:12,color:"#64748b",lineHeight:1.9}}>
                  <div><b style={{color:"#1e293b"}}>Bill No:</b> {bill.billNo}</div>
                  <div><b style={{color:"#1e293b"}}>Date:</b> {fmtDate(bill.createdAt)}</div>
                  {bill.notes && <div><b style={{color:"#1e293b"}}>Notes:</b> {bill.notes}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bm-section-card" style={{marginTop:14}}>
            <div className="bm-section-head"><Receipt size={15} color="#0E898F"/><span>Charges</span></div>
            <table className="bm-tbl" style={{marginTop:8}}>
              <thead>
                <tr><th>#</th><th>Description</th><th>Type</th><th>Qty</th><th>Rate</th><th>Amount</th>{editMode && <th></th>}</tr>
              </thead>
              <tbody>
                {(editMode ? itemsEdit : (bill.billItems||[]).filter((it:any) => it.type !== "PHARMACY")).map((item:any, idx:number)=>{
                  const ti = typeInfo(item.type);
                  return (
                    <tr key={item.id||idx}>
                      <td style={{fontSize:11,color:"#94a3b8"}}>{idx+1}</td>
                      <td style={{fontSize:13,fontWeight:500,color:"#1e293b"}}>
                        {editMode ? <input className="bm-inp" value={item.name} onChange={e=>updateItem(idx,"name",e.target.value)}/> : item.name}
                      </td>
                      <td>
                        {editMode ? (
                          <select className="bm-inp" value={item.type} onChange={e=>updateItem(idx,"type",e.target.value)}>
                            {ITEM_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        ) : <span style={{fontSize:10,fontWeight:600,color:ti.color,background:ti.color+"15",padding:"2px 6px",borderRadius:4}}>{ti.label}</span>}
                      </td>
                      <td style={{fontSize:12,color:"#475569"}}>
                        {editMode ? <input type="number" className="bm-inp" value={item.quantity} onChange={e=>updateItem(idx,"quantity",Number(e.target.value)||0)}/> : item.quantity}
                      </td>
                      <td style={{fontSize:12,color:"#475569"}}>
                        {editMode ? <input type="number" className="bm-inp" value={item.unitPrice} onChange={e=>updateItem(idx,"unitPrice",Number(e.target.value)||0)}/> : fmtCur(item.unitPrice)}
                      </td>
                      <td style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{fmtCur(editMode ? (item.quantity*item.unitPrice) : item.amount)}</td>
                      {editMode && <td><button className="bm-icon-btn" onClick={()=>removeItem(idx)}><Trash2 size={14}/></button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {editMode && (
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button className="bm-btn-secondary" onClick={addItem}><Plus size={14}/>Add Item</button>
                <button className="bm-btn-primary" onClick={saveItems} disabled={savingItems}>
                  {savingItems ? <Loader2 size={14} className="bm-spin"/> : <Check size={14}/>} Save Items
                </button>
              </div>
            )}
          </div>

          {/* Pharmacy Medicines Detail — uses PHARMACY billItems for prices, enriched with dosage/frequency from medications JSON */}
          {(() => {
            const pharmaItems = (bill.billItems || []).filter((it: any) => it.type === "PHARMACY");
            if (pharmaItems.length === 0) return null;
            let medsMap: Record<string, any> = {};
            if (bill.prescription?.medications) {
              try {
                const raw = typeof bill.prescription.medications === "string" ? JSON.parse(bill.prescription.medications) : bill.prescription.medications;
                if (Array.isArray(raw)) raw.forEach((m: any) => { medsMap[(m.name || "").toLowerCase().trim()] = m; });
              } catch {}
            }
            const enriched = pharmaItems.map((it: any) => {
              const med = medsMap[(it.name || "").toLowerCase().trim()] || {};
              return { ...it, dosage: med.dosage || "—", frequency: med.frequency || "—" };
            });
            const pharmaTotal = enriched.reduce((s: number, it: any) => s + (it.amount || 0), 0);
            return (
              <div className="bm-section-card" style={{marginTop:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div className="bm-section-head"><Pill size={15} color="#ec4899"/><span>Pharmacy — Medicine Details</span></div>
                  {bill.prescription?.prescriptionNo && <span style={{fontSize:11,fontWeight:600,color:"#ec4899",background:"#fdf2f8",padding:"3px 10px",borderRadius:6}}>Rx #{bill.prescription.prescriptionNo}</span>}
                </div>
                {bill.prescription?.diagnosis && (
                  <div style={{fontSize:12,color:"#64748b",marginBottom:10,padding:"8px 12px",background:"#fdf2f8",borderRadius:8,border:"1px solid #fce7f3"}}>
                    <b style={{color:"#be185d"}}>Diagnosis:</b> {bill.prescription.diagnosis}
                  </div>
                )}
                {bill.prescription?.doctor?.name && (
                  <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>
                    <b style={{color:"#1e293b"}}>Prescribed by:</b> {bill.prescription.doctor.name}
                  </div>
                )}
                <table className="bm-tbl" style={{marginTop:4}}>
                  <thead>
                    <tr>
                      <th style={{width:30}}>#</th>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th style={{textAlign:"center"}}>Qty</th>
                      <th style={{textAlign:"right"}}>Unit Price</th>
                      <th style={{textAlign:"right"}}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map((m: any, idx: number) => (
                      <tr key={m.id || idx}>
                        <td style={{fontSize:11,color:"#94a3b8"}}>{idx + 1}</td>
                        <td style={{fontWeight:600,color:"#1e293b"}}>{m.name}</td>
                        <td style={{fontSize:12,color:"#475569"}}>{m.dosage}</td>
                        <td style={{fontSize:12,color:"#475569"}}>{m.frequency}</td>
                        <td style={{textAlign:"center",fontSize:12,color:"#475569"}}>{m.quantity}</td>
                        <td style={{textAlign:"right",fontSize:12,color:"#475569"}}>{fmtCur(m.unitPrice)}</td>
                        <td style={{textAlign:"right",fontWeight:700,color:"#1e293b"}}>{fmtCur(m.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:"2px solid #fce7f3"}}>
                      <td colSpan={6} style={{textAlign:"right",fontWeight:700,fontSize:13,color:"#be185d",paddingRight:12}}>Medicine Total</td>
                      <td style={{textAlign:"right",fontWeight:800,fontSize:14,color:"#be185d"}}>{fmtCur(pharmaTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}

          {/* Payments */}
          {(bill.payments||[]).length>0 && (
            <div className="bm-section-card" style={{marginTop:14}}>
              <div className="bm-section-head"><CreditCard size={15} color="#10b981"/><span>Payment History</span></div>
              <table className="bm-tbl" style={{marginTop:8}}>
                <thead><tr><th>Date</th><th>Method</th><th>Txn ID</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {bill.payments.map((p:any)=>(
                    <tr key={p.id}>
                      <td style={{fontSize:12,color:"#64748b"}}>{fmtDateTime(p.paidAt)}</td>
                      <td><span style={{fontSize:11,fontWeight:600,color:"#0E898F",background:"#E6F4F4",padding:"2px 8px",borderRadius:4}}>{p.method}</span></td>
                      <td style={{fontSize:11,color:"#94a3b8"}}>{p.transactionId||"—"}</td>
                      <td style={{fontWeight:700,color:"#10b981"}}>{fmtCur(p.amount)}</td>
                      <td><span style={{fontSize:10,fontWeight:700,color:"#166534",background:"#f0fdf4",padding:"2px 7px",borderRadius:4}}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div>
          <div className="bm-summary-card">
            <div className="bm-section-head"><IndianRupee size={15} color="#0E898F"/><span>Amount Summary</span></div>
            <div className="bm-totals">
              <div className="bm-total-row"><span>Subtotal</span><span>{fmtCur(calculatedSubtotal)}</span></div>
              <div className="bm-total-row" style={{color:"#10b981"}}>
                <span>Discount</span>
                <span>{editMode ? <input type="number" className="bm-inp" style={{width:120}} value={discEdit} onChange={e=>setDiscEdit(Number(e.target.value)||0)} placeholder="0"/> : `− ${fmtCur(bill.discount)}`}</span>
              </div>
              <div className="bm-total-row">
                <span>Tax / GST</span>
                <span>{editMode ? <input type="number" className="bm-inp" style={{width:120}} value={taxEdit} onChange={e=>setTaxEdit(Number(e.target.value)||0)} placeholder="0"/> : fmtCur(bill.tax)}</span>
              </div>
              <div className="bm-grand-total"><span>Total</span><span>{fmtCur(calculatedTotal)}</span></div>
            </div>
            <div className="bm-section-card" style={{marginTop:10}}>
              <div className="bm-section-head"><FileText size={15} color="#64748b"/><span>Notes</span></div>
              {editMode ? (
                <>
                  <textarea className="bm-inp" rows={3} value={notesEdit} onChange={e=>setNotesEdit(e.target.value)} placeholder="Add notes..."/>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:6,fontStyle:"italic"}}>Changes auto-save</div>
                </>
              ) : (
                <div style={{fontSize:12,color:"#64748b"}}>{bill.notes || "—"}</div>
              )}
            </div>
            <div style={{marginTop:14,padding:"12px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,color:"#64748b"}}>Paid Amount</span>
                <span style={{fontSize:13,fontWeight:700,color:"#10b981"}}>{fmtCur(bill.paidAmount)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:12,color:"#64748b"}}>Balance Due</span>
                <span style={{fontSize:13,fontWeight:700,color:calculatedRemaining>0?"#ef4444":"#10b981"}}>{fmtCur(calculatedRemaining)}</span>
              </div>
            </div>
            {bill.paymentMethod && (
              <div style={{marginTop:10,fontSize:12,color:"#64748b",textAlign:"center"}}>
                Last payment via <b style={{color:"#1e293b"}}>{bill.paymentMethod}</b>
              </div>
            )}
            {bill.status!=="PAID"&&bill.status!=="CANCELLED" && (
              <button className="bm-btn-primary" style={{width:"100%",marginTop:14,justifyContent:"center"}} onClick={()=>setPayModal(true)}>
                <CreditCard size={14}/> Record Payment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="bm-modal-bg" onClick={() => setConfirmModal(false)}>
          <div className="bm-modal" style={{maxWidth:480}} onClick={e => e.stopPropagation()}>
            <div style={{padding:24,textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:14,background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                <AlertTriangle size={28} color="#a16207" />
              </div>
              <div style={{fontSize:18,fontWeight:700,color:"#1e293b",marginBottom:8}}>Regenerate Bill?</div>
              <div style={{fontSize:14,color:"#64748b",lineHeight:1.6,marginBottom:24}}>
                This will revert the bill to PENDING status, remove all existing payments, and allow you to edit charges and re-collect payment. This action cannot be undone.
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button className="bm-btn-secondary" onClick={() => setConfirmModal(false)}>
                  Cancel
                </button>
                <button className="bm-btn-primary" style={{background:"#a16207"}} onClick={confirmRevert}>
                  Yes, Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="bm-modal-bg" onClick={e=>{if(e.target===e.currentTarget)setPayModal(false)}}>
          <div className="bm-modal">
            <div className="bm-modal-head">
              <div style={{fontWeight:800,fontSize:16,color:"#1e293b"}}>Record Payment</div>
              <button className="bm-icon-btn" onClick={()=>setPayModal(false)}><X size={16}/></button>
            </div>
            <div style={{padding:"0 24px 24px"}}>
              <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",marginBottom:16,border:"1px solid #e2e8f0"}}>
                <div style={{fontSize:12,color:"#64748b"}}>Balance due for <b style={{color:"#1e293b"}}>{bill.patient?.name}</b></div>
                <div style={{fontSize:20,fontWeight:800,color:"#ef4444",marginTop:2}}>{fmtCur(calculatedRemaining)}</div>
              </div>
              <div className="bm-mf">
                <label className="bm-lbl">Amount (₹) *</label>
                <input className="bm-inp" type="number" min="0.01" max={calculatedRemaining} step="0.01"
                  placeholder={`Max: ${fmtCur(calculatedRemaining)}`} value={payAmount}
                  onChange={e=>setPayAmount(e.target.value)} autoFocus/>
              </div>
              <div className="bm-mf">
                <label className="bm-lbl">Payment Method</label>
                <select className="bm-inp" value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
                  {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="bm-mf">
                <label className="bm-lbl">Transaction / Ref ID <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span></label>
                <input className="bm-inp" placeholder="UPI ref, cheque no, etc."
                  value={payTxn} onChange={e=>setPayTxn(e.target.value)}/>
              </div>
              <div className="bm-mf">
                <label className="bm-lbl">Notes <span style={{color:"#94a3b8",fontWeight:400}}>(optional)</span></label>
                <input className="bm-inp" placeholder="Any payment notes"
                  value={payNote} onChange={e=>setPayNote(e.target.value)}/>
              </div>
              {payError && <div className="bm-error">{payError}</div>}
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <button className="bm-btn-secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>setPayModal(false)}>Cancel</button>
                <button className="bm-btn-primary" style={{flex:2,justifyContent:"center"}} onClick={recordPayment} disabled={paying||!payAmount}>
                  {paying?<><Loader2 size={13} className="bm-spin"/>Processing…</>:<><CheckCircle2 size={14}/>Confirm Payment</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Section */}
      <div ref={printRef} style={{display:"none"}}>
        <PrintBill bill={bill} hospitalInfo={hospitalInfo}/>
      </div>
    </div>
  );
}

// ─── Print Bill Layout ────────────────────────────────────────────────────────
function PrintBill({ bill, hospitalInfo }:{ bill:any; hospitalInfo:any }) {
  if (!bill) return null;
  const sc = STATUS_COLORS[bill.status] || STATUS_COLORS.PENDING;
  const remaining = Math.max(0, bill.total - (bill.paidAmount||0));
  const hn = hospitalInfo?.settings?.hospitalName || hospitalInfo?.name || "Hospital";
  const addr = hospitalInfo?.settings?.address || "";
  const phone = hospitalInfo?.settings?.phone || "";
  const email = hospitalInfo?.settings?.email || "";
  const website = hospitalInfo?.settings?.website || "";
  const gst = hospitalInfo?.settings?.gstNumber || "";
  const regNo = hospitalInfo?.settings?.registrationNo || "";
  const logo = hospitalInfo?.settings?.logo || "";
  const letterhead = hospitalInfo?.settings?.letterhead || "";
  // For PDF letterheads on Cloudinary, convert to image via URL transformation
  const letterheadImg = letterhead
    ? (letterhead.match(/\.pdf$/i) || letterhead.includes('/raw/upload/'))
      ? letterhead.replace('/upload/', '/upload/f_png,pg_1/').replace(/\.pdf$/i, '.png')
      : letterhead
    : "";
  const hasLetterhead = !!letterheadImg;

  return (
    <div className="print-wrap" style={hasLetterhead ? {
      backgroundImage: `url(${letterheadImg})`,
      backgroundSize: "100% 100%",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      minHeight: "100vh",
      padding: "0",
    } : undefined}>
      {/* Hospital Header — only shown when no letterhead */}
      {!hasLetterhead && (
      <div className="hospital-header">
        <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
          {logo ? (
            <img src={logo} alt="Hospital Logo" className="h-logo-img"/>
          ) : (
            <div className="h-logo">+</div>
          )}
          <div>
            <div className="h-name">{hn}</div>
            {addr && <div className="h-sub">📍 {addr}</div>}
            <div style={{display:"flex",gap:16,marginTop:2}}>
              {phone && <div className="h-sub">📞 {phone}</div>}
              {email && <div className="h-sub">✉ {email}</div>}
            </div>
            {website && <div className="h-sub">🌐 {website}</div>}
            <div style={{display:"flex",gap:16,marginTop:4}}>
              {gst && <div className="h-sub" style={{fontWeight:600}}>GSTIN: {gst}</div>}
              {regNo && <div className="h-sub" style={{fontWeight:600}}>Reg: {regNo}</div>}
            </div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:20,fontWeight:900,color:"#0E898F",letterSpacing:"-0.02em"}}>TAX INVOICE</div>
          <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginTop:4,fontFamily:"monospace"}}>{bill.billNo}</div>
          <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{fmtDate(bill.createdAt)}</div>
          <div style={{marginTop:8,display:"inline-flex",padding:"4px 14px",borderRadius:100,background:sc.bg,border:`1.5px solid ${sc.color}`}}>
            <span style={{fontSize:11,fontWeight:700,color:sc.color}}>{sc.label}</span>
          </div>
        </div>
      </div>
      )}
      {/* When letterhead is used, add invoice badge + bill info overlaid on letterhead header area */}
      {hasLetterhead && (
        <div style={{display:"flex",justifyContent:"flex-end",padding:"70px 40px 0",marginBottom:20}}>
          <div style={{textAlign:"right"}}>
            <div style={{display:"inline-block",padding:"4px 16px",borderRadius:6,background:"#0E898F",color:"#fff",fontSize:11,fontWeight:700,letterSpacing:"0.04em",marginBottom:6}}>INVOICE</div>
            <div style={{fontSize:14,fontWeight:700,color:"#1e293b",fontFamily:"monospace"}}>{bill.billNo}</div>
            <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{fmtDate(bill.createdAt)}</div>
            <div style={{marginTop:6,display:"inline-flex",padding:"3px 12px",borderRadius:100,background:sc.bg,border:`1.5px solid ${sc.color}`}}>
              <span style={{fontSize:10,fontWeight:700,color:sc.color}}>{sc.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* Patient & Bill Info */}
      <div className="bill-info-row">
        <div>
          <div className="info-lbl">Bill To (Patient)</div>
          <div style={{fontWeight:700,fontSize:14}}>{bill.patient?.name}</div>
          <div style={{fontSize:12,color:"#475569",marginTop:2}}>{bill.patient?.patientId}</div>
          {bill.patient?.phone && <div style={{fontSize:12,color:"#475569"}}>{bill.patient.phone}</div>}
          {bill.patient?.gender && <div style={{fontSize:12,color:"#475569"}}>{bill.patient.gender}</div>}
          {bill.patient?.dateOfBirth && (
            <div style={{fontSize:12,color:"#475569"}}>Age: {new Date().getFullYear()-new Date(bill.patient.dateOfBirth).getFullYear()} yrs</div>
          )}
        </div>
        <div>
          <div className="info-lbl">Bill Information</div>
          <table style={{fontSize:12,color:"#475569",lineHeight:1.8}}>
            <tbody>
              <tr><td style={{paddingRight:10,color:"#94a3b8"}}>Bill No:</td><td style={{fontWeight:600,color:"#1e293b"}}>{bill.billNo}</td></tr>
              <tr><td style={{paddingRight:10,color:"#94a3b8"}}>Date:</td><td>{fmtDate(bill.createdAt)}</td></tr>
              <tr><td style={{paddingRight:10,color:"#94a3b8"}}>Time:</td><td>{new Date(bill.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</td></tr>
              {bill.paymentMethod && <tr><td style={{paddingRight:10,color:"#94a3b8"}}>Method:</td><td>{bill.paymentMethod}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Items Table + Pharmacy Detail (Print) */}
      {(() => {
        const allItems = bill.billItems || [];
        const npItems = allItems.filter((it: any) => it.type !== "PHARMACY");
        const pItems = allItems.filter((it: any) => it.type === "PHARMACY");
        let mMap: Record<string, any> = {};
        if (bill.prescription?.medications) {
          try {
            const raw = typeof bill.prescription.medications === "string" ? JSON.parse(bill.prescription.medications) : bill.prescription.medications;
            if (Array.isArray(raw)) raw.forEach((m: any) => { mMap[(m.name || "").toLowerCase().trim()] = m; });
          } catch {}
        }
        const enrichedP = pItems.map((it: any) => {
          const med = mMap[(it.name || "").toLowerCase().trim()] || {};
          return { ...it, dosage: med.dosage || "—", frequency: med.frequency || "—" };
        });
        const pTotal = enrichedP.reduce((s: number, it: any) => s + (it.amount || 0), 0);
        return (<>
          {npItems.length > 0 && (
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{width:32}}>#</th><th>Description</th><th style={{width:100}}>Type</th>
                  <th style={{width:50,textAlign:"center"}}>Qty</th><th style={{width:90,textAlign:"right"}}>Unit Price</th><th style={{width:100,textAlign:"right"}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {npItems.map((item: any, idx: number) => {
                  const ti = typeInfo(item.type);
                  return (
                    <tr key={item.id || idx}>
                      <td style={{color:"#94a3b8",textAlign:"center"}}>{idx+1}</td>
                      <td style={{fontWeight:500}}>{item.name}</td>
                      <td style={{color:"#64748b"}}>{ti.label}</td>
                      <td style={{textAlign:"center"}}>{item.quantity}</td>
                      <td style={{textAlign:"right"}}>₹{Number(item.unitPrice).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                      <td style={{textAlign:"right",fontWeight:600}}>₹{Number(item.amount).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {enrichedP.length > 0 && (
            <div style={{marginTop:20,marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:"#be185d",display:"flex",alignItems:"center",gap:6}}>💊 Pharmacy — Medicine Details</div>
                {bill.prescription?.prescriptionNo && <span style={{fontSize:11,fontWeight:600,color:"#be185d",background:"#fdf2f8",padding:"3px 10px",borderRadius:6,border:"1px solid #fce7f3"}}>Rx #{bill.prescription.prescriptionNo}</span>}
              </div>
              {bill.prescription?.diagnosis && (
                <div style={{fontSize:12,color:"#64748b",marginBottom:8,padding:"6px 12px",background:"#fdf2f8",borderRadius:6,border:"1px solid #fce7f3"}}>
                  <b style={{color:"#be185d"}}>Diagnosis:</b> {bill.prescription.diagnosis}
                </div>
              )}
              {bill.prescription?.doctor?.name && (
                <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>
                  <b style={{color:"#1e293b"}}>Prescribed by:</b> {bill.prescription.doctor.name}
                </div>
              )}
              <table className="items-table">
                <thead>
                  <tr style={{background:"#fdf2f8"}}>
                    <th style={{width:32,color:"#be185d"}}>#</th><th style={{color:"#be185d"}}>Medicine Name</th>
                    <th style={{width:90,color:"#be185d"}}>Dosage</th><th style={{width:90,color:"#be185d"}}>Frequency</th>
                    <th style={{width:50,textAlign:"center",color:"#be185d"}}>Qty</th><th style={{width:90,textAlign:"right",color:"#be185d"}}>Unit Price</th>
                    <th style={{width:100,textAlign:"right",color:"#be185d"}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedP.map((m: any, idx: number) => (
                    <tr key={m.id || idx}>
                      <td style={{color:"#94a3b8",textAlign:"center"}}>{idx + 1}</td>
                      <td style={{fontWeight:600}}>{m.name}</td>
                      <td style={{color:"#64748b",fontSize:12}}>{m.dosage}</td>
                      <td style={{color:"#64748b",fontSize:12}}>{m.frequency}</td>
                      <td style={{textAlign:"center"}}>{m.quantity}</td>
                      <td style={{textAlign:"right"}}>₹{Number(m.unitPrice).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                      <td style={{textAlign:"right",fontWeight:600}}>₹{Number(m.amount).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{borderTop:"2px solid #fce7f3"}}>
                    <td colSpan={6} style={{textAlign:"right",fontWeight:700,fontSize:13,color:"#be185d",paddingRight:12}}>Medicine Total</td>
                    <td style={{textAlign:"right",fontWeight:800,fontSize:14,color:"#be185d"}}>₹{pTotal.toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>);
      })()}

      {/* Totals */}
      <div className="totals-section">
        <div className="total-row"><span>Subtotal</span><span>₹{Number(bill.subtotal).toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>
        {bill.discount>0 && <div className="total-row" style={{color:"#10b981"}}><span>Discount</span><span>− ₹{Number(bill.discount).toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>}
        {bill.tax>0 && <div className="total-row"><span>Tax / GST</span><span>₹{Number(bill.tax).toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>}
        <div className="grand-row"><span>TOTAL</span><span>₹{Number(bill.total).toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>
      </div>

      {/* Payment History */}
      {(bill.payments||[]).length>0 && (
        <div className="payment-section" style={{marginTop:20}}>
          <div className="pay-head">Payment History</div>
          {bill.payments.map((p:any)=>(
            <div key={p.id} className="pay-row">
              <span style={{color:"#94a3b8",minWidth:130}}>{fmtDateTime(p.paidAt)}</span>
              <span style={{fontWeight:600,color:"#0E898F",minWidth:80}}>{p.method}</span>
              {p.transactionId && <span style={{color:"#64748b",flex:1}}>Ref: {p.transactionId}</span>}
              <span style={{fontWeight:700,color:"#10b981",marginLeft:"auto"}}>₹{Number(p.amount).toLocaleString("en-IN",{minimumFractionDigits:2})}</span>
            </div>
          ))}
          <div className="pay-row" style={{background:"#f8fafc"}}>
            <span style={{flex:1,fontWeight:600}}>Balance Due</span>
            <span style={{fontWeight:800,color:remaining>0?"#ef4444":"#10b981"}}>₹{Number(remaining).toLocaleString("en-IN",{minimumFractionDigits:2})}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {bill.notes && (
        <div style={{marginTop:16,padding:"10px 14px",background:"#E6F4F4",border:"1px solid #b2d8da",borderRadius:8,fontSize:12,color:"#0b7075"}}>
          <b>Notes:</b> {bill.notes}
        </div>
      )}

      {/* Signatures */}
      <div className="sig-section">
        <div className="sig-box">
          <div className="sig-line">Authorised Signatory</div>
        </div>
        <div className="sig-box">
          <div className="sig-line">Patient / Attendant Signature</div>
        </div>
        <div className="sig-box">
          <div className="sig-line">Cashier / Billing Staff</div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div>This is a computer-generated bill. No signature required unless stated.</div>
        <div style={{marginTop:4}}>Thank you for choosing <b>{hn}</b>. Wishing you good health!</div>
      </div>
    </div>
  );
}

// ─── Helper Icon ──────────────────────────────────────────────────────────────
function TrendingUpIcon(){ return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }
function typeInfo(t:string){ return ITEM_TYPES.find(x=>x.value===t)||ITEM_TYPES[ITEM_TYPES.length-1]; }

// ─── CSS ──────────────────────────────────────────────────────────────────────
const BM_CSS = `
.bm-wrap{padding:0;background:#fff}
.bm-page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;gap:12;flex-wrap:wrap;gap:12px}
.bm-page-title{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
.bm-page-sub{font-size:13px;color:#94a3b8;margin-top:2px}
.bm-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
@media(max-width:1100px){.bm-stats-row{grid-template-columns:repeat(2,1fr)}}
.bm-stat-card{background:#fff;border-radius:14px;padding:16px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
.bm-stat-icon{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.bm-stat-lbl{font-size:11px;color:#94a3b8;font-weight:500;margin-bottom:2px}
.bm-stat-val{font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-.01em}
.bm-filters{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.bm-search-wrap{flex:1;min-width:200px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 13px;transition:border-color .2s}
.bm-search-wrap:focus-within{border-color:#80CCCC}
.bm-search{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%;font-family:'Inter',sans-serif}
.bm-search::placeholder{color:#94a3b8}
.bm-clear-btn{background:none;border:none;cursor:pointer;display:flex;align-items:center;color:#94a3b8;padding:0}
.bm-clear-btn:hover{color:#475569}
.bm-select{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;font-size:13px;color:#475569;font-family:'Inter',sans-serif;cursor:pointer;outline:none}
.bm-select:focus{border-color:#80CCCC}
.bm-icon-btn{width:36px;height:36px;border-radius:10px;background:#fff;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;transition:all .15s;flex-shrink:0}
.bm-icon-btn:hover{background:#E6F4F4;color:#0E898F;border-color:#B3E0E0}
.bm-table-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);overflow:hidden}
.bm-tbl-wrap{overflow-x:auto}
.bm-tbl{width:100%;border-collapse:collapse}
.bm-tbl th{text-align:left;font-size:11px;font-weight:700;color:#94a3b8;padding:11px 14px;border-bottom:2px solid #f1f5f9;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
.bm-tbl td{padding:11px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
.bm-tbl tbody tr:last-child td{border-bottom:none}
.bm-tbl-row{cursor:pointer;transition:background .15s}
.bm-tbl-row:hover td{background:#f8fafc}
.bm-bill-no{font-weight:700;color:#0E898F;font-size:13px;font-family:monospace}
.bm-pt-name{font-weight:600;color:#1e293b;font-size:13px}
.bm-pt-id{font-size:11px;color:#94a3b8}
.bm-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;white-space:nowrap}
.bm-loader{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px 0;color:#94a3b8;font-size:13px}
.bm-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 0}
.bm-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f1f5f9}
.bm-pg-btn{width:28px;height:28px;border-radius:7px;border:1px solid #e2e8f0;background:#fff;font-size:12px;cursor:pointer;color:#64748b}
.bm-pg-btn.active{background:#0E898F;border-color:#0E898F;color:#fff;font-weight:700}
.bm-action-btn{width:28px;height:28px;border-radius:7px;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all .15s}
.bm-action-btn:hover{background:#E6F4F4;color:#0E898F}
.bm-btn-primary{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;border:none;background:#0E898F;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;box-shadow:0 4px 12px rgba(59,130,246,0.25);white-space:nowrap;font-family:'Inter',sans-serif}
.bm-btn-primary:hover:not(:disabled){background:#0A6B70;transform:translateY(-1px)}
.bm-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
.bm-btn-secondary{display:flex;align-items:center;gap:6px;padding:9px 14px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#475569;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:'Inter',sans-serif}
.bm-btn-secondary:hover{background:#f8fafc;border-color:#cbd5e1}
.bm-export-dropdown{position:absolute;top:calc(100% + 6px);right:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.12);z-index:100;min-width:180px;padding:4px;overflow:hidden}
.bm-export-dropdown button{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border:none;background:none;font-size:13px;font-weight:500;color:#475569;cursor:pointer;border-radius:8px;transition:all .15s;text-align:left;font-family:'Inter',sans-serif}
.bm-export-dropdown button:hover{background:#f0f9ff;color:#0E898F}
.bm-back-btn{width:34px;height:34px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;transition:all .15s;flex-shrink:0}
.bm-back-btn:hover{background:#f1f5f9}
.bm-create-grid{display:grid;grid-template-columns:1fr 300px;gap:18px;align-items:start}
@media(max-width:1000px){.bm-create-grid{grid-template-columns:1fr}}
.bm-section-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
.bm-section-head{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#1e293b;margin-bottom:14px}
.bm-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.12);z-index:100;max-height:220px;overflow-y:auto}
.bm-dropdown-item{padding:10px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:background .15s}
.bm-dropdown-item:last-child{border-bottom:none}
.bm-dropdown-item:hover{background:#f8fafc}
.bm-patient-card{display:flex;align-items:center;gap:12px;margin-top:12px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:11px}
.bm-patient-av{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0}
.bm-blood{background:#fee2e2;color:#dc2626;padding:1px 6px;border-radius:4px;font-weight:700;font-size:11px}
.bm-add-tabs{display:flex;gap:4px;margin-bottom:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:3px}
.bm-add-tab{flex:1;padding:7px 0;border-radius:8px;border:none;background:none;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif}
.bm-add-tab.active{background:#fff;color:#1e293b;box-shadow:0 1px 4px rgba(0,0,0,0.08)}
.bm-type-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.bm-type-tab{padding:4px 10px;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;font-size:11px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif}
.bm-type-tab.active{background:#0E898F;color:#fff;border-color:#0E898F}
.bm-catalog-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:280px;overflow-y:auto}
@media(max-width:900px){.bm-catalog-grid{grid-template-columns:1fr}}
.bm-catalog-item{display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;transition:all .15s;background:#fff}
.bm-catalog-item:hover{border-color:#80CCCC;background:#f0f9ff;transform:translateY(-1px)}
.bm-cat-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bm-cat-add{width:20px;height:20px;border-radius:5px;background:#E6F4F4;display:flex;align-items:center;justify-content:center;color:#0E898F;flex-shrink:0;opacity:0;transition:opacity .15s}
.bm-catalog-item:hover .bm-cat-add{opacity:1}
.bm-appt-list{display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto}
.bm-appt-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;transition:all .15s}
.bm-appt-row.added{background:#f0fdf4;border-color:#bbf7d0}
.bm-btn-sm{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:7px;border:1px solid #0E898F;background:#fff;color:#0E898F;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;flex-shrink:0;font-family:'Inter',sans-serif}
.bm-btn-sm.added{border-color:#10b981;color:#10b981;background:#f0fdf4}
.bm-btn-sm:disabled{opacity:.5;cursor:default}
.bm-manual-form{padding:4px 0}
.bm-lbl{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:5px}
.bm-inp{width:100%;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:9px 12px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s;font-family:'Inter',sans-serif;margin-bottom:10px}
.bm-inp:focus{border-color:#80CCCC;box-shadow:0 0 0 3px rgba(147,197,253,0.2)}
.bm-inp::placeholder{color:#94a3b8}
.bm-qty-inp{width:54px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:5px 8px;font-size:12px;color:#1e293b;outline:none;text-align:center;font-family:'Inter',sans-serif}
.bm-del-btn{width:26px;height:26px;border-radius:7px;background:#fff5f5;border:1px solid #fee2e2;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#ef4444;transition:all .15s}
.bm-del-btn:hover{background:#fee2e2}
.bm-summary-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,0.04);position:sticky;top:22px}
.bm-sum-row-lbl{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px;margin-top:2px}
.bm-disc-type{flex:1;padding:7px 12px;border:none;background:none;font-size:13px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif}
.bm-disc-type.on{background:#0E898F;color:#fff}
.bm-totals{border:1px solid #e2e8f0;border-radius:11px;overflow:hidden;margin-top:14px}
.bm-total-row{display:flex;justify-content:space-between;padding:8px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9}
.bm-total-row:last-child{border-bottom:none}
.bm-grand-total{display:flex;justify-content:space-between;padding:12px 14px;background:#1e3a8a;color:#fff;font-size:15px;font-weight:800}
.bm-error{background:#fff5f5;border:1px solid #fecaca;color:#dc2626;padding:9px 12px;border-radius:9px;font-size:12px;font-weight:500;margin-top:8px}
.bm-detail-grid{display:grid;grid-template-columns:1fr 280px;gap:18px;align-items:start}
@media(max-width:1000px){.bm-detail-grid{grid-template-columns:1fr}}
.bm-info-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:6px}
.bm-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px}
.bm-modal{background:#fff;border-radius:18px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.18);overflow:hidden}
.bm-modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid #f1f5f9}
.bm-mf{margin-bottom:12px}
.bm-spin{animation:bm-rotate .7s linear infinite}
@keyframes bm-rotate{to{transform:rotate(360deg)}}
`;
