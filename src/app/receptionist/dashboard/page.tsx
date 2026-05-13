"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, CalendarDays, UserRound, LogOut, Search, Bell,
  MessageSquare, HelpCircle, Plus, Check, X, Play, ChevronRight,
  Clock, TrendingUp, Users, BarChart2, Pencil, Trash2, Menu, Stethoscope
} from "lucide-react";
import AppointmentAlertModal from "@/components/AppointmentAlertModal";
import SupportModal from "@/components/SupportModal";

const todayQueue = [
  { token:"T001", name:"Rajesh Verma", doctor:"Dr. Priya Sharma", dept:"Cardiology", time:"09:00 AM", status:"in-progress", mobile:"+91 98765 43210" },
  { token:"T002", name:"Meena Joshi", doctor:"Dr. Rajan Mehta", dept:"Neurology", time:"09:30 AM", status:"waiting", mobile:"+91 87654 32109" },
  { token:"T003", name:"Suresh Das", doctor:"Dr. Sunita Rao", dept:"Pediatrics", time:"10:00 AM", status:"waiting", mobile:"+91 76543 21098" },
  { token:"T004", name:"Kavita Singh", doctor:"Dr. Priya Sharma", dept:"Cardiology", time:"11:00 AM", status:"confirmed", mobile:"+91 98765 11223" },
  { token:"T005", name:"Walk-in", doctor:"Dr. Rajan Mehta", dept:"Neurology", time:"11:30 AM", status:"confirmed", mobile:"—" },
];
const recentPat = [
  { id:"P0041", name:"Harish Gupta", age:59, mobile:"+91 90001 11234", dept:"Cardiology", visited:"Today" },
  { id:"P0042", name:"Sunita Bose", age:33, mobile:"+91 99887 76655", dept:"Cardiology", visited:"Today" },
  { id:"P0043", name:"Ankit Tiwari", age:29, mobile:"+91 77889 90011", dept:"Neurology", visited:"Yesterday" },
];
const barData = [
  {month:"Jan",val:18},{month:"Feb",val:22},{month:"Mar",val:30},{month:"Apr",val:25},{month:"May",val:20},{month:"Jun",val:28},{month:"Jul",val:35},{month:"Aug",val:24},{month:"Sep",val:29},
];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_H = ["M","T","W","T","F","S","S"];

function MiniCalendar({ accent = "#eab308" }: { accent?: string }) {
  const today = new Date();
  const [cur, setCur] = useState({ y:today.getFullYear(), m:today.getMonth() });
  const firstDay = new Date(cur.y,cur.m,1).getDay();
  const offset = firstDay===0?6:firstDay-1;
  const days = new Date(cur.y,cur.m+1,0).getDate();
  const cells:(number|null)[] = [...Array(offset).fill(null),...Array.from({length:days},(_,i)=>i+1)];
  while(cells.length%7!==0) cells.push(null);
  const isToday = (d:number|null) => d===today.getDate()&&cur.m===today.getMonth()&&cur.y===today.getFullYear();
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{MONTHS[cur.m]} {cur.y}</span>
        <div style={{display:"flex",gap:4}}>
          {["‹","›"].map((a,i)=>(
            <button key={i} onClick={()=>setCur(c=>{const nm=c.m+(i?1:-1);return nm<0?{y:c.y-1,m:11}:nm>11?{y:c.y+1,m:0}:{...c,m:nm};})}
              style={{width:26,height:26,borderRadius:8,border:"none",background:i?accent:"#e2e8f0",color:i?"#fff":"#64748b",cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{a}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
        {DAYS_H.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:600,color:"#94a3b8",padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:11,fontWeight:isToday(d)?700:400,padding:"5px 0",borderRadius:8,cursor:d?"pointer":"default",background:isToday(d)?accent:"transparent",color:isToday(d)?"#fff":d?"#334155":"transparent"}}>{d||""}</div>
        ))}
      </div>
    </div>
  );
}

type Tab = "queue"|"book"|"patients";

export default function ReceptionistDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("queue");
  const [queue, setQueue] = useState(todayQueue);
  const [booking, setBooking] = useState({patientName:"",mobile:"",dept:"Cardiology",doctor:"Dr. Priya Sharma",timeSlot:"09:00 AM",type:"OPD"});
  const [booked, setBooked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);

  useEffect(()=>{
    fetch("/api/auth/me",{credentials:"include"}).then(r=>r.json()).then(d=>{
      if(!d.success){router.push("/login");return;}
      setUser(d.data);
      setLoading(false);
      fetch("/api/config/settings",{credentials:"include"}).then(r=>r.json()).then(s=>{
        if(s.success && s.data?.settings) setHospitalSettings(s.data.settings);
      }).catch(()=>{});
    }).catch(()=>router.push("/login"));
  },[router]);

  const logout = async()=>{await fetch("/api/auth/logout",{method:"POST",credentials:"include"});router.push("/login");};
  const updateStatus = (token:string, status:string) => setQueue(q=>q.map(a=>a.token===token?{...a,status}:a));
  const handleBook = (e:React.FormEvent)=>{
    e.preventDefault();
    setQueue(q=>[...q,{token:`T00${q.length+1}`,name:booking.patientName,doctor:booking.doctor,dept:booking.dept,time:booking.timeSlot,status:"confirmed",mobile:booking.mobile}]);
    setBooked(true);
    setTimeout(()=>{setBooked(false);setBooking({patientName:"",mobile:"",dept:"Cardiology",doctor:"Dr. Priya Sharma",timeSlot:"09:00 AM",type:"OPD"});setTab("queue");},1500);
  };
  const initials = (n:string) => n.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
  const maxBar = Math.max(...barData.map(b=>b.val));

  if(loading) return <div style={{minHeight:"100vh",background:"#fefce8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",color:"#64748b",fontSize:13,gap:14}}>
    <div style={{width:32,height:32,border:"3px solid #fef08a",borderTop:"3px solid #eab308",borderRadius:"50%",animation:"sp .8s linear infinite"}}/>
    <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>Loading Receptionist Portal...
  </div>;

  const navItems = [
    {id:"queue" as Tab,   label:"Today's Queue",      icon:<ClipboardList size={16}/>},
    {id:"book" as Tab,    label:"Book Appointment",   icon:<CalendarDays size={16}/>},
    {id:"patients" as Tab,label:"Patients",           icon:<UserRound size={16}/>},
  ];

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#fefce8}::-webkit-scrollbar-thumb{background:#fef08a;border-radius:4px}
      input,select,button{font-family:'Inter',sans-serif}
      .rec{display:flex;height:100vh;overflow:hidden;font-family:'Inter',sans-serif;background:#fefdf0}
      .rec-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:45;backdrop-filter:blur(2px)}
      .rec-overlay.open{display:block}
      .rec-sb{width:220px;background:#fff;border-right:1px solid #fef08a;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(234,179,8,0.07);transition:transform .25s cubic-bezier(.4,0,.2,1)}
      .rec-burger{display:none;width:36px;height:36px;border-radius:10px;background:#fefce8;border:1px solid #fef08a;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
      .rec-logo{padding:20px 20px 16px;border-bottom:1px solid #fefce8;display:flex;align-items:center;gap:10px}
      .rec-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#0E898F,#07595D);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(14,137,143,0.3)}
      .rec-logo-tx{font-size:14px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
      .rec-logo-sub{font-size:10px;color:#94a3b8;margin-top:0px}
      .rec-nav{flex:1;padding:12px 12px;overflow-y:auto}
      .rec-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:12px 0 6px}
      .rec-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
      .rec-nb:hover{background:#fefce8;color:#92400e}
      .rec-nb.on{background:#fef9c3;color:#854d0e;font-weight:600}
      .rec-nb-dot{display:none;width:3px;height:20px;background:#eab308;border-radius:4px;position:absolute;left:0}
      .rec-nb.on .rec-nb-dot{display:block}
      .rec-nb svg{color:#94a3b8;flex-shrink:0}
      .rec-nb.on svg{color:#ca8a04}
      .rec-sb-foot{padding:14px 16px 18px;border-top:1px solid #fefce8}
      .rec-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#fefce8;border:1px solid #fef08a;margin-bottom:10px}
      .rec-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#eab308,#f97316);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
      .rec-uname{font-size:11px;font-weight:600;color:#1e293b}
      .rec-urole{font-size:10px;font-weight:500;color:#ca8a04}
      .rec-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
      .rec-logout:hover{background:#fee2e2}
      .rec-main{margin-left:220px;flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden}
      .rec-topbar{height:64px;background:#fff;border-bottom:1px solid #fef08a;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:relative;z-index:40;flex-shrink:0;box-shadow:0 1px 4px rgba(234,179,8,0.07)}
      .rec-search-wrap{display:flex;align-items:center;gap:8px;background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:8px 14px;width:280px}
      .rec-search-wrap:focus-within{border-color:#fcd34d}
      .rec-search{background:none;border:none;outline:none;font-size:12px;color:#334155;width:100%}
      .rec-search::placeholder{color:#94a3b8}
      .rec-tb-right{display:flex;align-items:center;gap:12px}
      .rec-notif{width:36px;height:36px;border-radius:10px;background:#fefce8;border:1px solid #fef08a;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
      .rec-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#eab308;border:1.5px solid #fff}
      .rec-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#fefce8;border:1px solid #fef08a;cursor:pointer}
      .rec-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#eab308,#f97316);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff}
      .rec-profile-name{font-size:11px;font-weight:600;color:#1e293b}
      .rec-profile-role{font-size:10px;color:#ca8a04}
      .rec-body{display:grid;grid-template-columns:1fr 260px;flex:1;overflow:hidden}
      .rec-center{padding:22px 20px;overflow-y:auto}
      .rec-right{background:#fff;border-left:1px solid #fef08a;padding:22px 18px;overflow-y:auto}
      .rec-pg-title{font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-.02em;margin-bottom:18px}
      .rec-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
      .rec-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #fef08a;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(234,179,8,0.07);transition:transform .2s,box-shadow .2s}
      .rec-sc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.08)}
      .rec-sc-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}
      .rec-sc-lbl{font-size:10px;font-weight:500;color:#94a3b8;margin-bottom:2px}
      .rec-sc-val{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.02em;line-height:1}
      .rec-sc-sub{font-size:10px;color:#94a3b8;margin-top:3px}
      .rec-mid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
      .rec-card{background:#fff;border-radius:14px;border:1px solid #fef08a;box-shadow:0 1px 4px rgba(234,179,8,0.06);overflow:hidden;margin-bottom:16px}
      .rec-card-head{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #fefce8}
      .rec-card-title{font-size:13px;font-weight:700;color:#1e293b}
      .rec-card-sub{font-size:10px;color:#94a3b8;margin-top:2px}
      .rec-card-body{padding:16px 18px}
      .rec-tbl{width:100%;border-collapse:collapse}
      .rec-tbl th{text-align:left;font-size:10px;font-weight:600;color:#94a3b8;padding:10px 12px;border-bottom:2px solid #fefce8}
      .rec-tbl td{padding:11px 12px;font-size:12px;color:#475569;border-bottom:1px solid #fefdf0}
      .rec-tbl tr:last-child td{border-bottom:none}
      .rec-tbl tbody tr:hover td{background:#fffdf0}
      .rec-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
      .rec-action-btn{padding:4px 10px;border-radius:7px;border:none;font-size:10px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:3px;transition:opacity .15s}
      .rec-action-btn:hover{opacity:.8}
      .rec-chart{display:flex;align-items:flex-end;gap:8px;height:120px}
      .rec-bar-wrap{display:flex;flex-direction:column;align-items:center;gap:5px;flex:1}
      .rec-bar{width:100%;border-radius:5px 5px 0 0;transition:opacity .2s;cursor:pointer;min-width:14px}
      .rec-bar:hover{opacity:.8}
      .rec-bar-lbl{font-size:10px;color:#94a3b8;font-weight:500}
      .rec-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      @media(max-width:700px){.rec-form{grid-template-columns:1fr}}
      .rec-field{display:flex;flex-direction:column;gap:6px}
      .rec-lbl{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
      .rec-input{background:#fefce8;border:1.5px solid #fef08a;border-radius:9px;padding:10px 13px;font-size:12px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
      .rec-input::placeholder{color:#94a3b8}
      .rec-input:focus{border-color:#fcd34d;box-shadow:0 0 0 3px rgba(252,211,77,0.25)}
      .rec-submit{padding:12px 28px;border-radius:9px;border:none;background:linear-gradient(135deg,#eab308,#d97706);color:#fff;font-size:12px;font-weight:700;cursor:pointer;margin-top:6px;box-shadow:0 4px 14px rgba(234,179,8,0.3);transition:all .15s}
      .rec-submit:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(234,179,8,0.4)}
      .rec-success{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:9px;background:#f0fdf4;border:1px solid #bbf7d0;font-size:12px;color:#16a34a;font-weight:600;margin-top:10px}
      .rec-right-title{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:12px}
      @media(max-width:900px){
        .rec-sb{transform:translateX(-100%)}
        .rec-sb.open{transform:translateX(0)}
        .rec-main{margin-left:0}
        .rec-burger{display:flex}
        .rec-search-wrap{width:160px}
        .rec-body{grid-template-columns:1fr}
        .rec-right{display:none}
      }
      @media(max-width:600px){
        .rec-topbar{padding:0 14px}
        .rec-search-wrap{width:120px}
        .rec-profile-name,.rec-profile-role{display:none}
        .rec-stats{grid-template-columns:repeat(2,1fr)}
      }
    `}</style>

    <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    <div className="rec">
      {sidebarOpen && <div className="rec-overlay open" onClick={() => setSidebarOpen(false)} />}
      <aside className={`rec-sb${sidebarOpen ? " open" : ""}`}>
        <div className="rec-logo">
          {hospitalSettings?.logo ? (
            <img src={hospitalSettings.logo} alt="Hospital Logo" style={{ width: "100%", maxHeight: 44, objectFit: "contain", display: "block" }} />
          ) : (
            <>
              <div className="rec-logo-ic"><Stethoscope size={18} color="white"/></div>
              <div><div className="rec-logo-tx">{hospitalSettings?.hospitalName || user?.hospital?.name || "MediCare+"}</div><div className="rec-logo-sub">Front Desk</div></div>
            </>
          )}
        </div>
        <nav className="rec-nav">
          <div className="rec-nav-sec">Front Desk</div>
          {navItems.map(n=>(
            <button key={n.id} className={`rec-nb${tab===n.id?" on":""}`} onClick={()=>{setTab(n.id);setSidebarOpen(false);}}>
              <div className="rec-nb-dot"/>
              <span style={{color:tab===n.id?"#854d0e":"#94a3b8",display:"flex"}}>{n.icon}</span>
              {n.label}
            </button>
          ))}
          <div className="rec-nav-sec">Settings</div>
          <button className="rec-nb" onClick={() => setSupportOpen(true)}><span style={{color:"#94a3b8",display:"flex"}}><HelpCircle size={16}/></span>Support</button>
        </nav>
        <div className="rec-sb-foot">
          <div className="rec-user">
            <div className="rec-av">{user?.name?initials(user.name):"RC"}</div>
            <div><div className="rec-uname">{user?.name||"Receptionist"}</div><div className="rec-urole">Receptionist</div></div>
          </div>
          <button className="rec-logout" onClick={logout}><LogOut size={13}/>Log Out</button>
        </div>
      </aside>

      <main className="rec-main">
        <header className="rec-topbar">
          <button className="rec-burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
            {sidebarOpen ? <X size={18} color="#eab308" /> : <Menu size={18} color="#64748b" />}
          </button>
          <div className="rec-search-wrap"><input className="rec-search" placeholder="Search appointments, patients..."/></div>
          <div className="rec-tb-right">
            <div className="rec-notif"><Bell size={16} color="#64748b"/><span className="rec-notif-dot"/></div>
            <div className="rec-profile">
              <div className="rec-profile-av">{user?.name?initials(user.name):"RC"}</div>
              <div><div className="rec-profile-name">{user?.name?.split(" ")[0]||"Receptionist"}</div><div className="rec-profile-role">Front Desk 📋</div></div>
            </div>
          </div>
        </header>

        <div className="rec-body">
          <div className="rec-center">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div className="rec-pg-title" style={{marginBottom:0}}>
                {tab==="queue"?"Today's Appointment Queue":tab==="book"?"Book New Appointment":"Patient Registry"}
              </div>
              <span style={{fontSize:11,color:"#64748b",background:"#fefce8",border:"1px solid #fef08a",padding:"5px 12px",borderRadius:8,fontWeight:500}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long"})}</span>
            </div>

            <div className="rec-stats">
              {[
                {icon:<ClipboardList size={20} color="#fff"/>,  label:"Total Today",  val:queue.length,                                      sub:"appointments", bg:"#fefce8", iconBg:"#eab308"},
                {icon:<Clock size={20} color="#fff"/>,           label:"Waiting",      val:queue.filter(q=>q.status==="waiting").length,       sub:"in queue",     bg:"#fff7ed", iconBg:"#f97316"},
                {icon:<Play size={20} color="#fff"/>,            label:"In Progress",  val:queue.filter(q=>q.status==="in-progress").length,   sub:"with doctor",  bg:"#f0fdf4", iconBg:"#10b981"},
                {icon:<Check size={20} color="#fff"/>,           label:"Completed",    val:queue.filter(q=>q.status==="completed").length,      sub:"done today",   bg:"#E6F4F4", iconBg:"#0E898F"},
              ].map((s,i)=>(
                <div key={i} className="rec-sc" style={{background:s.bg}}>
                  <div className="rec-sc-icon" style={{background:s.iconBg}}>{s.icon}</div>
                  <div><div className="rec-sc-lbl">{s.label}</div><div className="rec-sc-val">{s.val}</div><div className="rec-sc-sub">{s.sub}</div></div>
                </div>
              ))}
            </div>

            {tab==="queue"&&(
              <div className="rec-card">
                <div className="rec-card-head">
                  <div><div className="rec-card-title">Live Queue</div><div className="rec-card-sub">Click actions to update status</div></div>
                  <button onClick={()=>setTab("book")} style={{padding:"7px 14px",borderRadius:9,border:"none",background:"#eab308",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",boxShadow:"0 3px 10px rgba(234,179,8,0.3)"}}>+ New Appointment</button>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table className="rec-tbl">
                    <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {queue.map(a=>(
                        <tr key={a.token}>
                          <td style={{fontFamily:"monospace",color:"#94a3b8",fontSize:10}}>{a.token}</td>
                          <td>
                            <div style={{fontWeight:600,color:"#1e293b",fontSize:12}}>{a.name}</div>
                            <div style={{fontSize:10,color:"#94a3b8"}}>{a.mobile}</div>
                          </td>
                          <td>
                            <div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{a.doctor}</div>
                            <div style={{fontSize:10,color:"#94a3b8"}}>{a.dept}</div>
                          </td>
                          <td style={{fontWeight:700,fontSize:11,color:"#334155"}}>{a.time}</td>
                          <td><span className="rec-badge" style={a.status==="in-progress"?{background:"#E6F4F4",color:"#0A6B70",border:"1px solid #B3E0E0"}:a.status==="waiting"?{background:"#fefce8",color:"#ca8a04",border:"1px solid #fde68a"}:a.status==="completed"?{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}:a.status==="cancelled"?{background:"#fff5f5",color:"#ef4444",border:"1px solid #fecaca"}:{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}}>{a.status.replace("-"," ")}</span></td>
                          <td>
                            <div style={{display:"flex",gap:6}}>
                              {a.status!=="completed"&&a.status!=="cancelled"&&(
                                <button className="rec-action-btn" onClick={()=>updateStatus(a.token,"completed")} style={{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",gap:3}}><Check size={11}/>Done</button>
                              )}
                              {a.status==="waiting"&&(
                                <button className="rec-action-btn" onClick={()=>updateStatus(a.token,"in-progress")} style={{background:"#E6F4F4",color:"#0A6B70",border:"1px solid #B3E0E0",display:"flex",alignItems:"center",gap:3}}><Play size={11}/>Call</button>
                              )}
                              {a.status!=="cancelled"&&a.status!=="completed"&&(
                                <button className="rec-action-btn" onClick={()=>updateStatus(a.token,"cancelled")} style={{background:"#fff5f5",color:"#ef4444",border:"1px solid #fecaca",display:"flex",alignItems:"center",gap:3}}><X size={11}/></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab==="book"&&(
              <div className="rec-card">
                <div className="rec-card-head"><div><div className="rec-card-title">Book Appointment</div><div className="rec-card-sub">Schedule for a new or existing patient</div></div></div>
                <div className="rec-card-body">
                  <form onSubmit={handleBook}>
                    <div className="rec-form">
                      <div className="rec-field"><label className="rec-lbl">Patient Name</label><input className="rec-input" placeholder="Full name" required value={booking.patientName} onChange={e=>setBooking(b=>({...b,patientName:e.target.value}))}/></div>
                      <div className="rec-field"><label className="rec-lbl">Mobile Number</label><input className="rec-input" placeholder="+91 98765 43210" value={booking.mobile} onChange={e=>setBooking(b=>({...b,mobile:e.target.value}))}/></div>
                      <div className="rec-field"><label className="rec-lbl">Department</label>
                        <select className="rec-input" style={{cursor:"pointer"}} value={booking.dept} onChange={e=>setBooking(b=>({...b,dept:e.target.value}))}>
                          <option>Cardiology</option><option>Neurology</option><option>Pediatrics</option><option>Radiology</option><option>General</option>
                        </select>
                      </div>
                      <div className="rec-field"><label className="rec-lbl">Doctor</label>
                        <select className="rec-input" style={{cursor:"pointer"}} value={booking.doctor} onChange={e=>setBooking(b=>({...b,doctor:e.target.value}))}>
                          <option>Dr. Priya Sharma</option><option>Dr. Rajan Mehta</option><option>Dr. Sunita Rao</option>
                        </select>
                      </div>
                      <div className="rec-field"><label className="rec-lbl">Time Slot</label>
                        <select className="rec-input" style={{cursor:"pointer"}} value={booking.timeSlot} onChange={e=>setBooking(b=>({...b,timeSlot:e.target.value}))}>
                          {["09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","02:00 PM","03:00 PM","04:00 PM"].map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="rec-field"><label className="rec-lbl">Visit Type</label>
                        <select className="rec-input" style={{cursor:"pointer"}} value={booking.type} onChange={e=>setBooking(b=>({...b,type:e.target.value}))}>
                          <option>OPD</option><option>Follow-up</option><option>Emergency</option><option>Lab Test</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="rec-submit">Book Appointment →</button>
                  </form>
                  {booked&&<div className="rec-success"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Appointment booked! Redirecting to queue...</div>}
                </div>
              </div>
            )}

            {tab==="patients"&&(
              <div className="rec-card">
                <div className="rec-card-head"><div><div className="rec-card-title">Recent Patients</div><div className="rec-card-sub">Last visited</div></div></div>
                <table className="rec-tbl">
                  <thead><tr><th>Patient ID</th><th>Name</th><th>Age</th><th>Mobile</th><th>Department</th><th>Last Visit</th></tr></thead>
                  <tbody>
                    {recentPat.map(p=>(
                      <tr key={p.id}>
                        <td style={{fontFamily:"monospace",color:"#94a3b8",fontSize:10}}>{p.id}</td>
                        <td style={{fontWeight:600,color:"#1e293b"}}>{p.name}</td>
                        <td>{p.age}</td>
                        <td style={{fontSize:11}}>{p.mobile}</td>
                        <td>{p.dept}</td>
                        <td><span className="rec-badge" style={{background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0"}}>{p.visited}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quick stats chart */}
            {tab==="queue"&&(
              <div className="rec-card">
                <div className="rec-card-head"><div><div className="rec-card-title">Monthly Appointment Trends</div></div></div>
                <div className="rec-card-body">
                  <div style={{display:"flex",alignItems:"flex-end",gap:0}}>
                    <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",height:120,paddingRight:8,alignItems:"flex-end"}}>
                      {[40,30,20,10,0].map(v=><span key={v} style={{fontSize:9,color:"#cbd5e1"}}>{v}</span>)}
                    </div>
                    <div className="rec-chart" style={{flex:1}}>
                      {barData.map((b,i)=>(
                        <div key={i} className="rec-bar-wrap">
                          <div className="rec-bar" style={{height:`${(b.val/maxBar)*110}px`,background:i===6?"linear-gradient(180deg,#eab308,#fcd34d)":"linear-gradient(180deg,#fef08a,#fefce8)"}}/>
                          <span className="rec-bar-lbl">{b.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rec-right">
            <div style={{marginBottom:22}}>
              <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Date</div>
              <MiniCalendar accent="#eab308"/>
            </div>
            <div>
              <div className="rec-right-title">Quick Stats</div>
              {[
                {label:"Avg. Wait Time",val:"12 min",icon:"⏱"},
                {label:"Walk-ins Today",val:"3",icon:"🚶"},
                {label:"No-shows",val:"1",icon:"❌"},
                {label:"Rescheduled",val:"2",icon:"🔄"},
              ].map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px",borderRadius:10,background:"#fefce8",border:"1px solid #fef08a",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:15}}>{s.icon}</span>
                    <span style={{fontSize:11,color:"#64748b"}}>{s.label}</span>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:"#854d0e"}}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
      <AppointmentAlertModal />
  </>);
}
