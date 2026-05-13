"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Settings, Building2, Stethoscope, Users, BedDouble, CreditCard, Package, Activity, BarChart2, Shield,
  Plus, Pencil, Trash2, Search, X, ChevronRight, Check, AlertTriangle,
  LogOut, Bell, HelpCircle, FlaskConical, LayoutDashboard, Loader2, Layers,
  MessageSquare, CalendarDays, UserRound, ClipboardList, IndianRupee, Download,
  QrCode, Copy, Link2, ExternalLink
} from "lucide-react";
import DepartmentPanel from "@/components/DepartmentPanel";
import DoctorPanel from "@/components/DoctorPanel";
import LeaveModal from "@/components/LeaveModal";
import StaffPanel from "@/components/StaffPanel";
import WardBedPanel from "@/components/WardBedPanel";
import SubDepartmentPanel from "@/components/SubDepartmentPanel";
import ServicePanel from "@/components/ServicePanel";
import TreatmentPlanPanel from "@/components/TreatmentPlanPanel";
import DynamicDashboard from "@/components/DynamicDashboard";
import PermissionPanel from "@/components/PermissionPanel";

type Tab = "settings"|"departments"|"subdepts"|"services"|"treatments"|"clinical"|"doctors"|"staff"|"wards"|"billing"|"inventory"|"permissions";

const TABS:{id:Tab;label:string;icon:any}[] = [
  {id:"settings",label:"General Settings",icon:Settings},
  {id:"departments",label:"Departments",icon:Building2},
  {id:"subdepts",label:"Sub-Depts / Procedures",icon:Layers},
  {id:"services",label:"Services & Packages",icon:Package},
  {id:"treatments",label:"Treatment Plans",icon:Activity},
  {id:"doctors",label:"Doctors Setup",icon:Stethoscope},
  {id:"staff",label:"Staff Setup",icon:Users},
  {id:"wards",label:"Ward & Bed Setup",icon:BedDouble},
  {id:"permissions",label:"Permissions",icon:Shield},
];

const api = async (url:string,method="GET",body?:any) => {
  const opts:any = {method,credentials:"include",headers:{"Content-Type":"application/json"}};
  if(body) opts.body = JSON.stringify(body);
  const r = await fetch(url,opts);
  return r.json();
};

/* ─── MODAL ─── */
function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:React.ReactNode}){
  if(!open) return null;
  return(<div className="cfg-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="cfg-modal">
      <div className="cfg-modal-head"><span className="cfg-modal-title">{title}</span><button onClick={onClose} className="cfg-icon-btn"><X size={16}/></button></div>
      {children}
    </div>
  </div>);
}

/* ─── SETTINGS PANEL ─── */
function SectionCard({icon,title,desc,children}:{icon:React.ReactNode;title:string;desc:string;children:React.ReactNode}){
  return(
    <div style={{background:"#fff",border:"1px solid #e8edf2",borderRadius:16,overflow:"hidden",marginBottom:18}}>
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 22px",borderBottom:"1px solid #f1f5f9",background:"#fafbfc"}}>
        <div style={{width:36,height:36,borderRadius:10,background:"#E6F4F4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
        <div><div style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{title}</div><div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{desc}</div></div>
      </div>
      <div style={{padding:"20px 22px"}}>{children}</div>
    </div>
  );
}

function QrCodeSection({ hospitalId }: { hospitalId: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  if (!hospitalId || !origin) return null;

  const bookingUrl = `${origin}/appointment?hid=${hospitalId}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(bookingUrl)}&color=0E898F&bgcolor=ffffff&margin=12`;

  const copyUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = async () => {
    const dlUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(bookingUrl)}&color=0E898F&bgcolor=ffffff&margin=16`;
    const a = document.createElement("a");
    a.href = dlUrl;
    a.target = "_blank";
    a.download = "booking-qr.png";
    a.click();
  };

  return (
    <SectionCard icon={<QrCode size={17} color="#0E898F" />} title="Appointment Booking QR Code" desc="Share this QR code so patients can scan and book appointments online">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 28, flexWrap: "wrap" }}>
        {/* QR Image */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ padding: 10, border: "2px solid #e2e8f0", borderRadius: 16, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="Booking QR Code" width={160} height={160} style={{ display: "block", borderRadius: 8 }} />
          </div>
          <button type="button" onClick={downloadQr}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize:11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
            onMouseOver={e => (e.currentTarget.style.borderColor = "#0E898F")}
            onMouseOut={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
            <Download size={12} /> Download QR
          </button>
        </div>

        {/* URL + Actions */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Booking URL</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
            <Link2 size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
            <span style={{ fontSize:11, color: "#475569", wordBreak: "break-all", flex: 1 }}>{bookingUrl}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={copyUrl}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "none", background: copied ? "#f0fdf4" : "#0E898F", color: copied ? "#16a34a" : "#fff", fontSize:11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy URL"}
            </button>
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:11, fontWeight: 700, textDecoration: "none", transition: "all 0.15s" }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "#0E898F")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
              <ExternalLink size={12} /> Preview Form
            </a>
          </div>
          <p style={{ fontSize:10, color: "#94a3b8", marginTop: 12, lineHeight: 1.6 }}>
            Print or display this QR at your reception. Patients scan it to access the appointment booking form and book directly.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function SettingsPanel({hospitalId}:{hospitalId:string}){
  const [f,setF]=useState({hospitalName:"",address:"",phone:"",email:"",website:"",timezone:"Asia/Kolkata",currency:"INR",gstNumber:"",registrationNo:"",letterhead:"",letterheadType:"IMAGE",letterheadSize:"A4",logo:""});
  const [saving,setSaving]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [uploadingLogo,setUploadingLogo]=useState(false);
  const [msg,setMsg]=useState("");

  useEffect(()=>{
    api("/api/config/settings").then(d=>{
      if(d.data?.settings){
        const s=d.data.settings;
        setF({
          hospitalName:s.hospitalName||"",address:s.address||"",phone:s.phone||"",email:s.email||"",
          website:s.website||"",timezone:s.timezone||"Asia/Kolkata",currency:s.currency||"INR",
          gstNumber:s.gstNumber||"",registrationNo:s.registrationNo||"",letterhead:s.letterhead||"",
          letterheadType:s.letterheadType||"IMAGE",letterheadSize:s.letterheadSize||"A4",logo:s.logo||""
        });
      }
    });
  },[]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("type", file.type.includes("pdf") ? "document" : "image");
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd }); const d = await r.json();
      if (d.success) { setF(p => ({ ...p, letterhead: d.data.url, letterheadType: file.type.includes("pdf") ? "PDF" : "IMAGE" })); setMsg("✓ Letterhead uploaded!"); }
      else setMsg("Error: " + d.message);
    } catch { setMsg("Upload failed"); } finally { setUploading(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg("Please upload an image file for the logo"); return; }
    setUploadingLogo(true);
    const fd = new FormData(); fd.append("file", file); fd.append("type", "logo");
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd }); const d = await r.json();
      if (d.success) { setF(p => ({ ...p, logo: d.data.url })); setMsg("✓ Logo uploaded!"); }
      else setMsg("Error: " + d.message);
    } catch { setMsg("Upload failed"); } finally { setUploadingLogo(false); }
  };

  const save=async(e:React.FormEvent)=>{
    e.preventDefault(); setSaving(true); setMsg("");
    const d=await api("/api/config/settings","POST",f);
    setMsg(d.success?"✓ Settings saved successfully!":d.message||"Error saving settings");
    setSaving(false);
  };

  const field=(k:string,l:string,ph:string,req?:boolean,type?:string)=>(
    <div className="cfg-field" key={k}>
      <label className="cfg-lbl">{l}</label>
      <input className="cfg-input" type={type||"text"} placeholder={ph} value={(f as any)[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} required={!!req}/>
    </div>
  );

  return(
    <form onSubmit={save} style={{maxWidth:860,margin:"0 auto"}}>

      {/* Identity & Branding */}
      <SectionCard icon={<Building2 size={17} color="#0E898F"/>} title="Identity & Branding" desc="Hospital name, logo and public-facing details">
        <div style={{display:"flex",alignItems:"flex-start",gap:20,marginBottom:18}}>
          <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <div style={{width:76,height:76,borderRadius:14,border:"2px dashed #cbd5e1",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc",overflow:"hidden"}}>
              {f.logo?<img src={f.logo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:<Building2 size={28} color="#cbd5e1"/>}
            </div>
            <label style={{fontSize:10,color:"#0E898F",fontWeight:700,cursor:"pointer",textAlign:"center",letterSpacing:".05em"}}>
              {uploadingLogo?"Uploading...":"CHANGE LOGO"}
              <input type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoUpload} disabled={uploadingLogo}/>
            </label>
            {f.logo&&<a href={f.logo} target="_blank" rel="noreferrer" style={{fontSize:10,color:"#94a3b8"}}>Preview</a>}
          </div>
          <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {field("hospitalName","Hospital Name *","City General Hospital",true)}
            {field("website","Website","https://hospital.com")}
            <div className="cfg-field" style={{gridColumn:"1/-1"}}>
              <label className="cfg-lbl">Address</label>
              <input className="cfg-input" placeholder="123 Medical Lane, City" value={f.address} onChange={e=>setF(p=>({...p,address:e.target.value}))}/>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Contact Information */}
      <SectionCard icon={<MessageSquare size={17} color="#0E898F"/>} title="Contact Information" desc="Phone, email and regional preferences">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          {field("phone","Phone Number","+91 98765 43210")}
          {field("email","Email Address","info@hospital.com",false,"email")}
          <div className="cfg-field" style={{gridColumn:"1/-1"}}>
            <label className="cfg-lbl">Timezone</label>
            <select className="cfg-input" value={f.timezone} onChange={e=>setF(p=>({...p,timezone:e.target.value}))}>
              <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {/* Legal & Compliance */}
      <SectionCard icon={<Shield size={17} color="#0E898F"/>} title="Legal & Compliance" desc="GST number, registration and statutory identifiers">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {field("gstNumber","GST Number","22AAAAA0000A1Z5")}
          {field("registrationNo","Registration No","HOSP/2026/001")}
        </div>
      </SectionCard>

      {/* Prescription Letterhead */}
      <SectionCard icon={<ClipboardList size={17} color="#0E898F"/>} title="Prescription Letterhead" desc="Letterhead template used when printing prescriptions">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
          <div className="cfg-field">
            <label className="cfg-lbl">Upload Letterhead</label>
            <input type="file" accept="image/*,application/pdf" className="cfg-input" onChange={handleUpload} disabled={uploading}/>
            {uploading&&<span style={{fontSize:10,color:"#0E898F",marginTop:4,display:"block"}}>Uploading…</span>}
            {f.letterhead&&<a href={f.letterhead} target="_blank" rel="noreferrer" style={{fontSize:10,color:"#10b981",marginTop:4,display:"block"}}>View current</a>}
            <span style={{fontSize:10,color:"#94a3b8",marginTop:3,display:"block"}}>Image or PDF accepted</span>
          </div>
          <div className="cfg-field">
            <label className="cfg-lbl">Page Size</label>
            <select className="cfg-input" value={f.letterheadSize} onChange={e=>setF(p=>({...p,letterheadSize:e.target.value}))}>
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
          <div className="cfg-field">
            <label className="cfg-lbl">Format (auto-detected)</label>
            <div style={{display:"flex",alignItems:"center",height:42,padding:"0 13px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:12,color:"#94a3b8",gap:6}}>
              <Check size={13} color="#10b981"/>{f.letterheadType}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* QR Code Section */}
      <QrCodeSection hospitalId={hospitalId} />

      {/* Save Bar */}
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 22px",background:"#fff",border:"1px solid #e8edf2",borderRadius:14}}>
        <button type="submit" className="cfg-btn-primary" disabled={saving||uploading||uploadingLogo} style={{minWidth:140}}>
          {saving?<Loader2 size={14} className="cfg-spin"/>:<Check size={14}/>}
          {saving?"Saving…":"Save Settings"}
        </button>
        {msg&&<span style={{fontSize:12,fontWeight:600,color:msg.startsWith("✓")?"#10b981":"#ef4444",display:"flex",alignItems:"center",gap:6}}>
          {msg.startsWith("✓")?<Check size={13}/>:<AlertTriangle size={13}/>}{msg}
        </span>}
        <span style={{marginLeft:"auto",fontSize:10,color:"#94a3b8"}}>Changes apply immediately across the platform</span>
      </div>

    </form>
  );
}

/* ─── GENERIC CRUD PANEL ─── */
function CrudPanel({endpoint,columns,formFields,entityName,searchable=true}:{
  endpoint:string;columns:{key:string;label:string;render?:(v:any,row:any)=>React.ReactNode}[];
  formFields:{key:string;label:string;type?:string;options?:{v:string;l:string}[];required?:boolean}[];
  entityName:string;searchable?:boolean;
}){
  const [data,setData]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(false);
  const [editItem,setEditItem]=useState<any>(null);
  const [form,setForm]=useState<any>({});
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);
    const d=await api(`${endpoint}${search?`?search=${search}`:""}`);
    if(d.success) setData(d.data||[]);
    setLoading(false);
  },[endpoint,search]);

  useEffect(()=>{load();},[load]);

  const openAdd=()=>{setEditItem(null);setForm({});setMsg("");setModal(true);};
  const openEdit=(item:any)=>{setEditItem(item);setForm({...item});setMsg("");setModal(true);};

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();setSaving(true);setMsg("");
    const method=editItem?"PUT":"POST";
    const body=editItem?{id:editItem.id,...form}:form;
    const d=await api(endpoint,method,body);
    if(d.success){setModal(false);load();}else setMsg(d.message||"Error");
    setSaving(false);
  };

  const handleDelete=async(id:string)=>{
    if(!confirm(`Delete this ${entityName}?`))return;
    await api(`${endpoint}?id=${id}`,"DELETE");
    load();
  };

  return(<div>
    <div className="cfg-toolbar">
      {searchable&&<div className="cfg-search-wrap"><input className="cfg-search-input" placeholder={`Search ${entityName}s...`} value={search} onChange={e=>setSearch(e.target.value)}/></div>}
      <button className="cfg-btn-primary" onClick={openAdd}><Plus size={14}/>Add {entityName}</button>
    </div>

    {loading?<div className="cfg-loading"><Loader2 size={20} className="cfg-spin"/>Loading...</div>:
    data.length===0?<div className="cfg-empty">No {entityName.toLowerCase()}s found. Click "+ Add {entityName}" to create one.</div>:
    <div className="cfg-tbl-wrap"><table className="cfg-tbl">
      <thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}<th>Actions</th></tr></thead>
      <tbody>{data.map((row,i)=><tr key={row.id||i}>
        {columns.map(c=><td key={c.key}>{c.render?c.render((row as any)[c.key],row):(row as any)[c.key]??"-"}</td>)}
        <td><div style={{display:"flex",gap:6}}>
          <button className="cfg-icon-btn cfg-edit" onClick={()=>openEdit(row)}><Pencil size={13}/></button>
          <button className="cfg-icon-btn cfg-del" onClick={()=>handleDelete(row.id)}><Trash2 size={13}/></button>
        </div></td>
      </tr>)}</tbody>
    </table></div>}

    <Modal open={modal} onClose={()=>setModal(false)} title={`${editItem?"Edit":"Add"} ${entityName}`}>
      <form onSubmit={handleSubmit} className="cfg-modal-form">
        {formFields.map(f=>(
          <div key={f.key} className="cfg-field">
            <label className="cfg-lbl">{f.label}</label>
            {f.options?<select className="cfg-input" value={form[f.key]||""} onChange={e=>setForm((p:any)=>({...p,[f.key]:e.target.value}))}><option value="">Select...</option>{f.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
            :<input className="cfg-input" type={f.type||"text"} placeholder={f.label} value={form[f.key]||""} onChange={e=>setForm((p:any)=>({...p,[f.key]:f.type==="number"?Number(e.target.value):e.target.value}))} required={f.required}/>}
          </div>
        ))}
        {msg&&<div style={{gridColumn:"1/-1",fontSize:12,color:"#ef4444",fontWeight:600}}>{msg}</div>}
        <div style={{gridColumn:"1/-1",display:"flex",gap:10,marginTop:4}}>
          <button type="button" className="cfg-btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
          <button type="submit" className="cfg-btn-primary" disabled={saving}>{saving?<Loader2 size={14} className="cfg-spin"/>:null}{editItem?"Update":"Create"}</button>
        </div>
      </form>
    </Modal>
  </div>);
}

/* ─── MAIN PAGE CONTENT ─── */
function ConfigureContent(){
  const router=useRouter();
  const searchParams=useSearchParams();
  const [user,setUser]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const initialTab=(searchParams.get("tab") as Tab)||"settings";
  const [tab,setTabState]=useState<Tab>(TABS.some(t=>t.id===initialTab)?initialTab:"settings");
  const setTab=(t:Tab)=>{setTabState(t);router.replace(`?tab=${t}`,{scroll:false});};

  // Doctor modals state (must be before any conditional returns)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  // Inventory low-stock state
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [sendingStockAlert, setSendingStockAlert] = useState(false);
  const [stockAlertMsg, setStockAlertMsg] = useState<string | null>(null);

  const sendStockAlerts = async () => {
    setSendingStockAlert(true);
    setStockAlertMsg(null);
    const res = await api("/api/inventory/low-stock", "POST");
    setSendingStockAlert(false);
    if (res.success) setStockAlertMsg(`✓ ${res.data?.fired || 0} alert(s) sent`);
    else setStockAlertMsg("Failed to send alerts");
    setTimeout(() => setStockAlertMsg(null), 5000);
  };

  const checkLowStock = useCallback(async () => {
    const res = await api("/api/inventory/low-stock");
    if (res.success) setLowStockCount(res.data?.count ?? 0);
  }, []);

  useEffect(() => { if (tab === "inventory") checkLowStock(); }, [tab, checkLowStock]);

  useEffect(()=>{
    api("/api/auth/me").then(d=>{
      if(!d.success){router.push("/login");return;}
      if(d.data.role==="DOCTOR"){router.push("/doctor/dashboard");return;}
      if(d.data.role==="STAFF"||d.data.role==="RECEPTIONIST"){router.push("/staff/dashboard");return;}
      if(d.data.role==="SUB_DEPT_HEAD"){router.push("/subdept/dashboard");return;}
      if(d.data.role!=="HOSPITAL_ADMIN"){router.push("/login");return;}
      setUser(d.data);setLoading(false);
    }).catch(()=>router.push("/login"));
  },[router]);

  const logout=async()=>{await api("/api/auth/logout","POST");router.push("/login");};

  const navItems = [
    { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={16} />, route: "/hospitaladmin/dashboard" },
    { id: "appointments", label: "Appointments", icon: <CalendarDays size={16} />, route: "/hospitaladmin/appointments" },
    { id: "staff", label: "Staff", icon: <Users size={16} />, route: "/hospitaladmin/staff" },
    { id: "doctors", label: "Doctors", icon: <Stethoscope size={16} />, route: "/hospitaladmin/doctors" },
    { id: "patients", label: "Patients", icon: <UserRound size={16} />, route: "/hospitaladmin/dashboard?tab=patients" },
    { id: "inventory", label: "Inventory", icon: <ClipboardList size={16} />, route: "/hospitaladmin/dashboard?tab=inventory" },
    { id: "billing", label: "Billing", icon: <CreditCard size={16} />, route: "/hospitaladmin/billing" },
    { id: "finance", label: "Finance", icon: <IndianRupee size={16} />, route: "/hospitaladmin/finance" },
    { id: "settings", label: "Settings", icon: <Settings size={16} />, route: "/hospitaladmin/configure" },
  ];
  const initials=(n:string)=>n.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();

  const openLeaveModal = (doctor: any) => {
    setSelectedDoctor(doctor);
    setLeaveModalOpen(true);
  };

  if(loading) return <div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",gap:12,color:"#64748b"}}><Loader2 size={24} className="cfg-spin"/>Loading...</div>;

  const clinicalColumns=[{key:"name",label:"Name"},{key:"type",label:"Type",render:(v:string)=><span className="cfg-badge blue">{v}</span>},{key:"department",label:"Department",render:(v:any)=>v?.name||"—"},{key:"isActive",label:"Status",render:(v:boolean)=><span className={`cfg-badge ${v?"green":"red"}`}>{v?"Active":"Inactive"}</span>}];
  const clinicalFields=[{key:"name",label:"Unit Name",required:true},{key:"type",label:"Type",options:[{v:"PHARMACY",l:"Pharmacy"},{v:"PATHOLOGY",l:"Pathology"},{v:"RADIOLOGY",l:"Radiology"},{v:"PROCEDURE",l:"Procedure"},{v:"LABORATORY",l:"Laboratory"},{v:"OTHER",l:"Other"}],required:true}];

  const staffColumns=[{key:"name",label:"Name"},{key:"role",label:"Role",render:(v:string)=><span className="cfg-badge blue">{v?.replace("_"," ")}</span>},{key:"department",label:"Dept",render:(v:any)=>v?.name||"—"},{key:"salary",label:"Salary",render:(v:number)=>`₹${v||0}`},{key:"isActive",label:"Status",render:(v:boolean)=><span className={`cfg-badge ${v?"green":"red"}`}>{v?"Active":"Inactive"}</span>}];
  const staffFields=[{key:"name",label:"Staff Name",required:true},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"role",label:"Role",options:[{v:"NURSE",l:"Nurse"},{v:"TECHNICIAN",l:"Technician"},{v:"PHARMACIST",l:"Pharmacist"},{v:"RECEPTIONIST",l:"Receptionist"},{v:"LAB_TECHNICIAN",l:"Lab Technician"},{v:"ACCOUNTANT",l:"Accountant"},{v:"SUPPORT",l:"Support"},{v:"OTHER",l:"Other"}],required:true},{key:"salary",label:"Salary",type:"number"}];

  const wardColumns=[{key:"name",label:"Ward Name"},{key:"type",label:"Type",render:(v:string)=><span className="cfg-badge blue">{v?.replace("_"," ")}</span>},{key:"floor",label:"Floor",render:(v:string)=>v||"—"},{key:"capacity",label:"Capacity"},{key:"_count",label:"Beds",render:(v:any)=>v?.beds??0}];
  const wardFields=[{key:"name",label:"Ward Name",required:true},{key:"type",label:"Type",options:[{v:"GENERAL",l:"General"},{v:"PRIVATE",l:"Private"},{v:"SEMI_PRIVATE",l:"Semi-Private"},{v:"ICU",l:"ICU"},{v:"NICU",l:"NICU"},{v:"EMERGENCY",l:"Emergency"},{v:"MATERNITY",l:"Maternity"},{v:"ISOLATION",l:"Isolation"}],required:true},{key:"floor",label:"Floor"},{key:"capacity",label:"Capacity",type:"number"}];

  const billingColumns=[{key:"name",label:"Charge Name"},{key:"type",label:"Type",render:(v:string)=><span className="cfg-badge blue">{v?.replace("_"," ")}</span>},{key:"amount",label:"Amount",render:(v:number)=>`₹${v}`},{key:"department",label:"Dept",render:(v:any)=>v?.name||"All"},{key:"isActive",label:"Status",render:(v:boolean)=><span className={`cfg-badge ${v?"green":"red"}`}>{v?"Active":"Inactive"}</span>}];
  const billingFields=[{key:"name",label:"Charge Name",required:true},{key:"type",label:"Type",options:[{v:"CONSULTATION",l:"Consultation"},{v:"PROCEDURE",l:"Procedure"},{v:"LAB_TEST",l:"Lab Test"},{v:"RADIOLOGY",l:"Radiology"},{v:"PHARMACY",l:"Pharmacy"},{v:"ROOM_CHARGE",l:"Room Charge"},{v:"SURGERY",l:"Surgery"},{v:"OTHER",l:"Other"}],required:true},{key:"amount",label:"Amount (₹)",type:"number",required:true},{key:"description",label:"Description"}];

  const invColumns=[{key:"name",label:"Item Name"},{key:"category",label:"Category"},{key:"stock",label:"Stock",render:(v:number,row:any)=><span style={{color:v<=row.minStock?"#ef4444":"#10b981",fontWeight:700}}>{v}</span>},{key:"minStock",label:"Min Stock"},{key:"unit",label:"Unit"},{key:"pricePerUnit",label:"Price",render:(v:number)=>`₹${v}`},{key:"supplier",label:"Supplier",render:(v:string)=>v||"—"}];
  const invFields=[{key:"name",label:"Item Name",required:true},{key:"category",label:"Category",required:true},{key:"stock",label:"Current Stock",type:"number"},{key:"minStock",label:"Min Stock Alert",type:"number"},{key:"unit",label:"Unit (pcs/ml/kg)"},{key:"pricePerUnit",label:"Price Per Unit",type:"number"},{key:"supplier",label:"Supplier"}];

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
      input,select,button,textarea{font-family:'Inter',sans-serif}
      @keyframes spin{to{transform:rotate(360deg)}}
      .cfg-spin{animation:spin .7s linear infinite}
      .cfg-wrap{display:contents}
      .cfg-tabs{display:flex;flex-wrap:wrap;gap:0;padding:6px 8px;background:#fff;border-bottom:1px solid #e2e8f0;margin-bottom:20px;max-width:100%}
      .cfg-tab{padding:7px 13px;border-radius:8px;border:none;background:none;color:#64748b;font-size:11.5px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:5px;flex-shrink:0;position:relative}
      .cfg-tab+.cfg-tab::before{content:"";position:absolute;left:0;top:20%;height:60%;width:1px;background:#e2e8f0}
      .cfg-tab:hover{background:#f8fafc;color:#334155}
      .cfg-tab.on{background:#E6F4F4;color:#0A6B70}
      .cfg-onboard{background:#fff;border:1px solid #fde68a;border-radius:16px;padding:22px;margin-bottom:22px;box-shadow:0 1px 4px rgba(234,179,8,.1)}
      .cfg-onboard-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}
      .cfg-progress-bar{height:8px;background:#f1f5f9;border-radius:100px;overflow:hidden;margin-bottom:8px}
      .cfg-progress-fill{height:100%;background:linear-gradient(90deg,#0E898F,#10b981);border-radius:100px;transition:width .5s}
      .cfg-steps{display:flex;flex-wrap:wrap;gap:8px}
      .cfg-step{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:500;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b}
      .cfg-step.done{background:#f0fdf4;border-color:#bbf7d0;color:#16a34a}
      .cfg-step-num{width:18px;height:18px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#94a3b8}
      .cfg-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .cfg-field{display:flex;flex-direction:column;gap:5px}
      .cfg-lbl{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
      .cfg-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:12px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
      .cfg-input:focus{border-color:#80CCCC;box-shadow:0 0 0 3px rgba(147,197,253,.25)}
      .cfg-input::placeholder{color:#94a3b8}
      .cfg-btn-primary{padding:10px 20px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,.25);transition:all .15s;white-space:nowrap}
      .cfg-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
      .cfg-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
      .cfg-btn-ghost{padding:10px 20px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer}
      .cfg-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap}
      .cfg-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px}
      .cfg-search-input{background:none;border:none;outline:none;font-size:12px;color:#334155;width:100%}
      .cfg-search-input::placeholder{color:#94a3b8}
      .cfg-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
      .cfg-tbl{width:100%;border-collapse:collapse}
      .cfg-tbl th{text-align:left;font-size:10px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
      .cfg-tbl td{padding:12px 14px;font-size:12px;color:#475569;border-bottom:1px solid #f8fafc}
      .cfg-tbl tr:last-child td{border-bottom:none}
      .cfg-tbl tbody tr:hover td{background:#fafbfc}
      .cfg-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
      .cfg-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
      .cfg-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
      .cfg-badge.blue{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
      .cfg-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
      .cfg-edit{background:#E6F4F4;color:#0E898F}.cfg-edit:hover{background:#B3E0E0}
      .cfg-del{background:#fff5f5;color:#ef4444}.cfg-del:hover{background:#fee2e2}
      .cfg-overlay{position:fixed;inset:0;background:rgba(15,23,42,.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
      .cfg-modal{background:#fff;border-radius:18px;padding:24px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto}
      .cfg-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
      .cfg-modal-title{font-size:16px;font-weight:800;color:#1e293b}
      .cfg-modal-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .cfg-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:13px}
      .cfg-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:13px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
    `}</style>

    <>

        <div className="cfg-tabs">
          {TABS.map(t=>{const Icon=t.icon;return(
            <button key={t.id} className={`cfg-tab${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
              <Icon size={13}/>{t.label}
            </button>
          );})}
        </div>

        <div className="hd-center">
          {tab==="settings"&&<SettingsPanel hospitalId={user?.hospitalId||""}/>}
          {tab==="departments"&&<DepartmentPanel/>}
          {tab==="subdepts"&&<SubDepartmentPanel/>}
          {tab==="services"&&<ServicePanel/>}
          {tab==="treatments"&&<TreatmentPlanPanel/>}
          {tab==="permissions"&&<PermissionPanel/>}
          {tab==="clinical"&&<CrudPanel endpoint="/api/config/departments?sub=true" columns={clinicalColumns} formFields={clinicalFields} entityName="Clinical Unit"/>}
          {tab==="doctors"&&<DoctorPanel onOpenLeave={openLeaveModal}/>}
          
          {/* Doctor Modals */}
          <LeaveModal
            open={leaveModalOpen}
            onClose={() => setLeaveModalOpen(false)}
            doctor={selectedDoctor}
          />
          {tab==="staff"&&<StaffPanel/>}
          {tab==="wards"&&<WardBedPanel/>}
          {tab==="billing"&&(<>
            <div style={{fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:4}}>Charge Catalog</div>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>Define standard charges that will auto-populate bills</div>
            <CrudPanel endpoint="/api/config/pricing" columns={billingColumns} formFields={billingFields} entityName="Charge"/>
          </>)}
          {tab==="inventory"&&(<>
            {lowStockCount !== null && lowStockCount > 0 && (
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <AlertTriangle size={16} color="#d97706"/>
                  <span style={{fontSize:12,fontWeight:700,color:"#92400e"}}>{lowStockCount} item{lowStockCount>1?"s":""} at or below reorder level</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {stockAlertMsg && <span style={{fontSize:11,color:stockAlertMsg.startsWith("✓")?"#16a34a":"#ef4444",fontWeight:600}}>{stockAlertMsg}</span>}
                  <button onClick={sendStockAlerts} disabled={sendingStockAlert} className="cfg-btn-primary" style={{padding:"7px 14px",fontSize:11}}>
                    {sendingStockAlert?<Loader2 size={12} className="cfg-spin"/>:<Bell size={12}/>}
                    {sendingStockAlert?"Sending...":"Send Stock Alerts"}
                  </button>
                </div>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
              <a href="/api/export/inventory" download title="Export inventory as CSV"
                style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid #d1fae5",background:"#f0fdf4",color:"#059669",fontSize:12,fontWeight:600,textDecoration:"none"}}>
                <Download size={13}/>Export CSV
              </a>
            </div>
            <CrudPanel endpoint="/api/config/inventory" columns={invColumns} formFields={invFields} entityName="Inventory Item"/>
          </>)}
        </div>
    </>
  </>);
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",gap:12,color:"#64748b"}}><Loader2 size={24} className="cfg-spin"/>Loading...</div>}>
      <ConfigureContent />
    </Suspense>
  );
}
