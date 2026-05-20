"use client";
import React,{useEffect,useState,useCallback,useRef}from"react";
import dynamic from"next/dynamic";
import{PieChart,Pie,Cell,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend}from"recharts";
import{FlaskConical,TestTube2,Activity,Plus,X,RefreshCw,Loader2,CheckCircle2,Clock,AlertTriangle,FileText,Mail,MessageSquare,Eye,Edit2,Trash2,Check,TrendingUp,IndianRupee,ClipboardList,ShieldCheck,ToggleLeft,ToggleRight,Save,ArrowRight,BarChart2,Bell,ChevronRight,Download,FileSpreadsheet,FileType,ChevronDown,Send,Pencil,Receipt,CreditCard,Sparkles,Mic,MicOff,Wand2}from"lucide-react";
const LabBillingQueue=dynamic(()=>import("@/components/BillingQueue"),{ssr:false,loading:()=><div style={{padding:40,textAlign:"center"}}><Loader2 size={18} style={{animation:"spin .7s linear infinite",display:"inline"}}/><div style={{fontSize:12,color:"#94a3b8",marginTop:8}}>Loading Billing Queue...</div></div>});
const LabBillingModule=dynamic(()=>import("@/components/BillingModule"),{ssr:false,loading:()=><div style={{padding:40,textAlign:"center"}}><Loader2 size={18} style={{animation:"spin .7s linear infinite",display:"inline"}}/><div style={{fontSize:12,color:"#94a3b8",marginTop:8}}>Loading Bills...</div></div>});
const A="#047857",G1="#10b981",G2="#047857",L="#f0fdf4",B="#a7f3d0",GR=`linear-gradient(135deg,${G1},${G2})`;
const ST=["BLOOD","URINE","STOOL","SPUTUM","CSF","SWAB","TISSUE","SERUM","OTHER"];
const CA=["HEMATOLOGY","BIOCHEMISTRY","MICROBIOLOGY","SEROLOGY","PATHOLOGY","URINE","IMMUNOLOGY","HORMONES","COAGULATION","OTHER"];
const PR:any={ROUTINE:{label:"Routine",bg:"#f8fafc",c:"#475569",bd:"#e2e8f0"},URGENT:{label:"Urgent",bg:"#fff7ed",c:"#c2410c",bd:"#fed7aa"},STAT:{label:"STAT",bg:"#fff5f5",c:"#b91c1c",bd:"#fecaca"}};
const OS:any={PENDING:{label:"Pending",bg:"#eff6ff",c:"#2563eb",bd:"#bfdbfe"},SAMPLE_COLLECTED:{label:"Sample Collected",bg:"#fffbeb",c:"#b45309",bd:"#fde68a"},IN_PROCESS:{label:"In Process",bg:"#faf5ff",c:"#7c3aed",bd:"#e9d5ff"},RESULT_ENTERED:{label:"Result Entered",bg:"#fff1f2",c:"#be123c",bd:"#fecdd3"},VERIFIED:{label:"Verified",bg:"#f0fdf4",c:"#15803d",bd:"#bbf7d0"},REPORTED:{label:"Reported",bg:"#ecfdf5",c:"#047857",bd:"#a7f3d0"},DELIVERED:{label:"Delivered",bg:"#f0fdf4",c:"#065f46",bd:"#6ee7b7"},CANCELLED:{label:"Cancelled",bg:"#fff5f5",c:"#ef4444",bd:"#fecaca"}};
const SS:any={COLLECTED:{l:"Collected",bg:"#eff6ff",c:"#2563eb"},RECEIVED:{l:"Received",bg:"#faf5ff",c:"#7c3aed"},IN_PROCESS:{l:"In Process",bg:"#fff7ed",c:"#b45309"},REJECTED:{l:"Rejected",bg:"#fff5f5",c:"#ef4444"},DISPOSED:{l:"Disposed",bg:"#f8fafc",c:"#94a3b8"}};
const BO={patientSearch:"",patientId:"",patientName:"",dob:"",age:"",gender:"",phone:"",email:"",address:"",patientType:"NEW",orderType:"MANUAL",visitType:"WALKIN",visitId:"",referringDoctor:"",referringDoctorId:"",referringDept:"",referringHospital:"",appointmentId:"",priority:"ROUTINE",sampleDate:"",sampleTime:"",homeCollection:false,specimenType:"BLOOD",numSamples:"1",collectionCenter:"",collectorName:"",sampleHandling:"",discount:"",discountRemark:"",taxPercent:"0",billingAction:"defer",billingSubdeptId:"",packageApplied:"",paymentStatus:"UNPAID",paymentMode:"CASH",referenceId:"",upiId:"",insuranceProvider:"",tpaName:"",policyNo:"",corporateName:"",approvalStatus:"",clinicalNotes:"",symptoms:"",diagnosis:"",history:"",sendSMS:true,sendEmail:false,sendWhatsApp:false,collectionAddress:"",landmark:"",collectionDate:"",collectionTime:"",collectionAgentName:"",contactPerson:"",remarks:"",consent:false,items:[] as any[]};
const BT={name:"",code:"",category:"HEMATOLOGY",specimenType:"BLOOD",price:"",unit:"",normalRangeMin:"",normalRangeMax:"",normalRangeText:"",method:"",turnaroundHrs:"24",machineId:""};
const BP={name:"",code:"",description:"",price:"",testIds:[] as string[]};
const fd=(d:string)=>new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short"});
const ff=(d:string)=>new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const Bdg=({bg,c,bd,children}:any)=><span style={{display:"inline-flex",alignItems:"center",padding:"1px 7px",borderRadius:100,fontSize:9,fontWeight:700,background:bg,color:c,border:`1px solid ${bd||bg}`}}>{children}</span>;
const Btn=({onClick,style,disabled,children}:any)=><button onClick={onClick} disabled={disabled} style={{padding:"4px 9px",borderRadius:6,fontSize:11,fontWeight:600,cursor:disabled?"not-allowed":"pointer",border:"1px solid",transition:"all .15s",display:"inline-flex",alignItems:"center",gap:4,opacity:disabled?.6:1,...style}}>{children}</button>;
const Lbl=({children}:any)=><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>{children}</label>;
const Inp=({style,...p}:any)=><input style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none",boxSizing:"border-box" as any,...style}} {...p}/>;
const Sel=({children,...p}:any)=><select style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none",background:"#fff",boxSizing:"border-box" as any}} {...p}>{children}</select>;

export default function PathologyDashboard({profile,user,activeTab,onTabChange}:{profile:any;user:any;activeTab?:string;onTabChange?:(t:string)=>void}){
  const[tab,setTab]=useState(activeTab||"overview");
  useEffect(()=>{if(activeTab)setTab(activeTab);},[activeTab]);
  const sw=(t:string)=>{setTab(t);onTabChange?.(t);};
  const[stats,setStats]=useState<any>(null);const[sL,setSL]=useState(false);
  const[referralQueue,setReferralQueue]=useState<any[]>([]);
  const[orders,setOrders]=useState<any[]>([]);const[oTotal,setOTotal]=useState(0);const[oL,setOL]=useState(false);
  const[oFilter,setOFilter]=useState({status:"",priority:"",search:"",date:""});
  const[selOrder,setSelOrder]=useState<any>(null);
  const[showOM,setShowOM]=useState(false);const[oForm,setOForm]=useState<any>(BO);const[oSaving,setOSaving]=useState(false);const[oMsg,setOMsg]=useState("");const[newOrderTab,setNewOrderTab]=useState(0);
  const[patR,setPatR]=useState<any[]>([]);
  const[tests,setTests]=useState<any[]>([]);const[panels,setPanels]=useState<any[]>([]);const[tL,setTL]=useState(false);const[pL,setPL]=useState(false);
  const[showTF,setShowTF]=useState(false);const[editT,setEditT]=useState<any>(null);const[tForm,setTForm]=useState<any>(BT);const[tSav,setTSav]=useState(false);const[tMsg,setTMsg]=useState("");
  const[showPF,setShowPF]=useState(false);const[editP,setEditP]=useState<any>(null);const[pForm,setPForm]=useState<any>(BP);const[pSav,setPSav]=useState(false);const[pMsg,setPMsg]=useState("");
  const[samples,setSamples]=useState<any[]>([]);const[smL,setSmL]=useState(false);
  const[showSM,setShowSM]=useState(false);const[smOrder,setSmOrder]=useState<any>(null);const[smForm,setSmForm]=useState({specimenType:"BLOOD",collectedBy:"",notes:""});const[smSav,setSmSav]=useState(false);
  const[reports,setReports]=useState<any[]>([]);const[rL,setRL]=useState(false);const[vRep,setVRep]=useState<any>(null);const[rActL,setRActL]=useState(false);
  const[resOrder,setResOrder]=useState<any>(null);const[resItems,setResItems]=useState<any[]>([]);const[resSav,setResSav]=useState(false);const[resMsg,setResMsg]=useState("");
  const[aiResL,setAiResL]=useState(false);const[aiResMsg,setAiResMsg]=useState("");const[isListening,setIsListening]=useState(false);const[listenIdx,setListenIdx]=useState(-1);
  const[finSearch,setFinSearch]=useState("");
  const[resSearch,setResSearch]=useState("");const[resFilter,setResFilter]=useState("");const[resSort,setResSort]=useState("newest");const[resSortOpen,setResSortOpen]=useState(false);
  const[resExtra,setResExtra]=useState<any>({specimenCondition:"NORMAL",fastingStatus:"",collectedAt:"",receivedAt:"",reportedAt:"",pathRemarks:"",interpretation:"",impression:"",recommendation:"",verifiedBy:"",qualification:"",approvedBy:"",reportVersion:"ORIGINAL",amendmentNotes:"",deliveryMode:"PRINT"});
  const[srch,setSrch]=useState("");const[delT,setDelT]=useState<any>(null);const[delL,setDelL]=useState(false);
  // Referral Wizard state
  const[refWiz,setRefWiz]=useState<any>(null);
  const[wizStep,setWizStep]=useState(1);
  const[wizItems,setWizItems]=useState<any[]>([]);
  const[wizPriority,setWizPriority]=useState("ROUTINE");
  const[wizNotes,setWizNotes]=useState("");
  const[wizSaving,setWizSaving]=useState(false);
  const[wizTestSearch,setWizTestSearch]=useState("");
  const[wizBillingAction,setWizBillingAction]=useState("send_to_billing");
  const[wizPayMethod,setWizPayMethod]=useState("CASH");
  const[hospitalInfo,setHospitalInfo]=useState<any>(null);
  const[repExportOpen,setRepExportOpen]=useState(false);
  const[ordExportOpen,setOrdExportOpen]=useState(false);
  const[ordSearch,setOrdSearch]=useState("");
  const[ordFilter,setOrdFilter]=useState("");
  const[ordSort,setOrdSort]=useState("newest");
  const[ordSortOpen,setOrdSortOpen]=useState(false);
  const[vOrd,setVOrd]=useState<any>(null);
  const[editOrd,setEditOrd]=useState<any>(null);
  const[editOrdSaving,setEditOrdSaving]=useState(false);
  const[editOrdMsg,setEditOrdMsg]=useState("");
  const[delOrd,setDelOrd]=useState<any>(null);
  const[delOrdL,setDelOrdL]=useState(false);
  const[repSearch,setRepSearch]=useState("");
  const[repFilter,setRepFilter]=useState("");
  const[repSort,setRepSort]=useState("newest");
  const[repSortOpen,setRepSortOpen]=useState(false);
  const[editRep,setEditRep]=useState<any>(null);
  const[editRepItems,setEditRepItems]=useState<any[]>([]);
  const[editRepForm,setEditRepForm]=useState({verifiedBy:"",notes:""});
  const[editRepSaving,setEditRepSaving]=useState(false);
  const[editRepMsg,setEditRepMsg]=useState("");
  const[delRep,setDelRep]=useState<any>(null);const[delRepL,setDelRepL]=useState(false);
  const[subdepts,setSubdepts]=useState<any[]>([]);
  const[docSearch,setDocSearch]=useState("");
  const[docR,setDocR]=useState<any[]>([]);
  const[showConsent,setShowConsent]=useState(false);
  const[testSearch,setTestSearch]=useState("");
  const[revenue,setRevenue]=useState<any[]>([]);
  const[revL,setRevL]=useState(false);
  const[revStats,setRevStats]=useState<any>({total:0,collected:0,pending:0,today:0});
  const[revSubTab,setRevSubTab]=useState<"overview"|"billing-queue"|"all-bills"|"finance">("overview");
  const imgCache=useRef<Record<string,string|null>>({});
  const recogRef=useRef<any>(null);
  const srchAbort=useRef<AbortController|null>(null);
  const loadImageAsBase64=(url:string):Promise<string|null>=>{if(!url)return Promise.resolve(null);if(imgCache.current[url]!==undefined)return Promise.resolve(imgCache.current[url]);return new Promise((resolve)=>{let imgUrl=url;if(url.match(/\.pdf$/i)||url.includes('/raw/upload/')){imgUrl=url.replace('/upload/','/upload/f_png,pg_1/').replace(/\.pdf$/i,'.png');}try{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>{try{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');if(ctx){ctx.drawImage(img,0,0);const d=c.toDataURL('image/png');imgCache.current[url]=d;resolve(d);return;}}catch{}imgCache.current[url]=null;resolve(null);};img.onerror=()=>{imgCache.current[url]=null;resolve(null);};img.src=imgUrl;}catch{imgCache.current[url]=null;resolve(null);}});};

  // Helpers
  const calcAge=(dob:string)=>{if(!dob)return"—";return Math.floor((Date.now()-new Date(dob).getTime())/(365.25*24*60*60*1000));};
  const parseLabTestsText=(str:string):string[]=>{if(!str)return[];try{const arr=JSON.parse(str);if(Array.isArray(arr))return arr.map((t:any)=>(typeof t==="string"?t:t.name||t.test||"")).filter(Boolean);}catch{}return str.split(/[,;\n|]+/).map((t:string)=>t.trim()).filter((t:string)=>t.length>1);};
  const fmtVitals=(v:string)=>{try{const obj=JSON.parse(v);const map:Record<string,string>={bp:"BP",pulse:"Pulse",temp:"Temp",weight:"Weight",height:"Height",spo2:"SpO2",rr:"RR",sugar:"Sugar"};const items=Object.entries(obj).filter(([,val])=>val&&String(val).trim()).map(([k,val])=>({label:map[k]||k,val:String(val)}));return items;}catch{return null;}};
  const autoMatch=(ref:any,allTests:any[]):any[]=>{
    const haystack=[ref.referralNote,ref.appointmentNotes,ref.prescription?.labTests,ref.prescription?.diagnosis,ref.prescription?.chiefComplaint,ref.prescription?.aiSuggestions,ref.prescription?.doctorNotes].filter(Boolean).join(" ").toLowerCase();
    const prescribedNames=parseLabTestsText(ref.prescription?.labTests||"");
    return allTests.filter((t:any)=>{
      const n=t.name.toLowerCase();const c=t.code.toLowerCase();
      if(prescribedNames.some((pn:string)=>{const pl=pn.toLowerCase();return pl.includes(n)||n.includes(pl)||c===pl||pl.includes(c)||new RegExp(`\\b${c}\\b`,"i").test(pl);}))return true;
      if(c.length>=2&&new RegExp(`\\b${c}\\b`,"i").test(haystack))return true;
      if(n.length>=3&&new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(haystack))return true;
      return n.split(" ").filter((w:string)=>w.length>=3).some((w:string)=>haystack.includes(w));
    });
  };
  const openWizard=(ref:any)=>{
    const matched=autoMatch(ref,tests.filter((t:any)=>t.isActive));
    setWizItems(matched.map((t:any)=>({testId:t.id,panelId:null,name:t.name,code:t.code,price:t.price||0,isAuto:true})));
    setWizPriority("ROUTINE");
    setWizNotes(ref.prescription?.diagnosis||ref.referralNote||"");
    setWizStep(1);setWizTestSearch("");setRefWiz(ref);
  };
  const wizToggleTest=(t:any)=>{const has=wizItems.find((i:any)=>i.testId===t.id);if(has)setWizItems((f:any[])=>f.filter((i:any)=>i.testId!==t.id));else setWizItems((f:any[])=>[...f,{testId:t.id,panelId:null,name:t.name,code:t.code,price:t.price||0,isAuto:false}]);};
  const wizTogglePanel=(p:any)=>{const has=wizItems.find((i:any)=>i.panelId===p.id);if(has)setWizItems((f:any[])=>f.filter((i:any)=>i.panelId!==p.id));else setWizItems((f:any[])=>[...f,{testId:null,panelId:p.id,name:p.name,code:p.code,price:p.price||0,isAuto:false}]);};
  const createOrderFromWizard=async()=>{if(!refWiz||!wizItems.length)return;setWizSaving(true);try{const res=await fetch("/api/pathology/orders",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({patientId:refWiz.patientId,priority:wizPriority,orderType:"DOCTOR_REFERRAL",clinicalNotes:wizNotes,referralNotes:refWiz.referralNote,appointmentId:refWiz.appointmentId,items:wizItems,billingAction:wizBillingAction,paymentMethod:wizPayMethod})}).then(r=>r.json());if(res.success){const billCreated=res.data?.bill;setRefWiz(null);if(billCreated&&wizBillingAction==="send_to_billing")alert(`✅ Lab Order created. Bill #${billCreated.billNo} sent to Billing/Reception.`);await Promise.all([ldStats(),ldOrders()]);}else alert(res.message||"Failed to create order");}catch(e:any){alert("Network error: "+(e.message||"Please try again"));}finally{setWizSaving(false);};};

  const ldStats=useCallback(async()=>{setSL(true);const d=await fetch("/api/pathology/stats",{credentials:"include"}).then(r=>r.json());if(d.success){setStats(d.data);setReferralQueue(d.data.referralQueue||[]);if(d.data.hospital)setHospitalInfo(d.data.hospital);}setSL(false);},[]);
  const ldOrders=useCallback(async(f?:any)=>{setOL(true);const p=new URLSearchParams();const fl=f||oFilter;if(fl.status)p.set("status",fl.status);if(fl.priority)p.set("priority",fl.priority);if(fl.search)p.set("search",fl.search);if(fl.date)p.set("date",fl.date);p.set("limit","50");const d=await fetch(`/api/pathology/orders?${p}`,{credentials:"include"}).then(r=>r.json());if(d.success){setOrders(d.data.data||[]);setOTotal(d.data.total||0);}setOL(false);},[oFilter]);
  const ldTests=useCallback(async()=>{setTL(true);const d=await fetch("/api/pathology/tests",{credentials:"include"}).then(r=>r.json());if(d.success)setTests(d.data||[]);setTL(false);},[]);
  const ldPanels=useCallback(async()=>{setPL(true);const d=await fetch("/api/pathology/panels",{credentials:"include"}).then(r=>r.json());if(d.success)setPanels(d.data||[]);setPL(false);},[]);
  const ldSamples=useCallback(async()=>{setSmL(true);const d=await fetch("/api/pathology/samples?limit=50",{credentials:"include"}).then(r=>r.json());if(d.success)setSamples(d.data||[]);setSmL(false);},[]);
  const ldReports=useCallback(async()=>{setRL(true);const d=await fetch("/api/pathology/reports?limit=30",{credentials:"include"}).then(r=>r.json());if(d.success)setReports(d.data||[]);setRL(false);},[]);
  const srchDoc=useCallback(async(q:string)=>{if(q.length<2){setDocR([]);return;}try{const d=await fetch(`/api/doctors?q=${encodeURIComponent(q)}`,{credentials:"include"}).then(r=>r.json());if(d.success)setDocR(Array.isArray(d.data)?d.data:(d.data?.doctors||d.data?.data||[]));}catch{setDocR([]);}},[]);
  const printConsentPDF=useCallback(()=>{
    const logoUrl=hospitalInfo?.letterhead||hospitalInfo?.logo||"";
    const hName=hospitalInfo?.name||"Hospital";
    const hAddr=hospitalInfo?.address||"";
    const hPhone=hospitalInfo?.phone||"";
    const dateStr=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
    const testList=(oForm.items||[]).map((i:any)=>i.name).filter(Boolean).join(", ")||"—";
    const headerHtml=logoUrl
      ?`<div class="lh"><img src="${logoUrl}" style="max-height:90px;max-width:100%;object-fit:contain"/></div>`
      :`<div class="lh"><div class="hname">${hName}</div><div class="haddr">${[hAddr,hPhone].filter(Boolean).join(" · ")}</div></div>`;
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Patient Consent Form</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12pt;color:#222}.page{max-width:210mm;margin:0 auto;padding:15mm 20mm;min-height:297mm}.lh{text-align:center;border-bottom:2.5px solid #047857;padding-bottom:12px;margin-bottom:18px}.hname{font-size:20pt;font-weight:800;color:#047857}.haddr{font-size:10pt;color:#555;margin-top:4px}h2{font-size:14pt;color:#047857;text-align:center;margin:14px 0 12px;text-transform:uppercase;letter-spacing:.04em}table.info{width:100%;border-collapse:collapse;margin:10px 0 14px;font-size:11pt}table.info td{padding:6px 10px;border:1px solid #ccc}table.info td:first-child{font-weight:700;width:32%;background:#f5f5f5}.sec{font-weight:700;font-size:11pt;margin:14px 0 4px;color:#047857}p{margin:6px 0;line-height:1.7;font-size:11pt}ul{padding-left:20px;margin:4px 0 10px;line-height:1.7;font-size:11pt}.sig-section{margin-top:40px}.sig-row{display:flex;gap:24px;margin-top:28px}.sig-box{flex:1}.sig-line{border-bottom:1.5px solid #222;height:55px;margin-bottom:6px}.sig-lbl{font-size:9.5pt;color:#555}.footer{margin-top:28px;border-top:1px solid #ccc;padding-top:8px;font-size:9pt;color:#888;text-align:center}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:10mm 15mm}}</style></head><body><div class="page">${headerHtml}<h2>Informed Consent for Laboratory Testing</h2><table class="info"><tr><td>Patient Name</td><td>${oForm.patientName||"—"}</td></tr><tr><td>Date</td><td>${dateStr}</td></tr><tr><td>Tests Ordered</td><td>${testList}</td></tr>${oForm.referringDoctor?`<tr><td>Referring Doctor</td><td>Dr. ${oForm.referringDoctor}</td></tr>`:""}</table><div class="sec">I. Purpose of Consent</div><p>I, the patient (or authorised representative), hereby provide informed consent for the following:</p><ul><li>Collection of biological specimens (blood, urine, swab, tissue, etc.) as required for the prescribed laboratory tests.</li><li>Analysis and processing of specimens in the laboratory using standard diagnostic procedures.</li><li>Storage of anonymised data for quality improvement and research purposes.</li><li>Sharing of results with the referring physician and treating healthcare team.</li></ul><div class="sec">II. Understanding of Risks and Rights</div><p>I understand and acknowledge that:</p><ul><li>Specimen collection involves minimal risk (e.g., slight discomfort, bruising at venipuncture site).</li><li>My personal health information will be handled in accordance with applicable privacy and data protection regulations.</li><li>I may withdraw this consent at any time before specimen collection without affecting my care.</li><li>Laboratory results are for diagnostic purposes only and must be interpreted by a qualified physician.</li></ul><div class="sec">III. Confirmation</div><p>By signing below, I confirm that I have read and fully understood the above, all my questions have been answered satisfactorily, and I voluntarily consent to the described laboratory procedures.</p><div class="sig-section"><div class="sig-row"><div class="sig-box"><div class="sig-line"></div><div class="sig-lbl">Patient / Guardian Signature</div></div><div class="sig-box"><div class="sig-line"></div><div class="sig-lbl">Patient / Guardian Name (Print)</div></div><div class="sig-box" style="flex:.5"><div class="sig-line"></div><div class="sig-lbl">Date</div></div></div><div class="sig-row" style="margin-top:22px"><div class="sig-box"><div class="sig-line"></div><div class="sig-lbl">Witness / Lab Staff Signature</div></div><div class="sig-box" style="flex:.5"><div class="sig-line"></div><div class="sig-lbl">Date</div></div></div></div><div class="footer">${hName} &middot; Patient Consent Form &middot; Printed: ${dateStr}</div></div></body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const iframe=document.createElement("iframe");
    iframe.style.cssText="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;";
    iframe.src=url;
    document.body.appendChild(iframe);
    iframe.onload=()=>{try{iframe.contentWindow?.focus();iframe.contentWindow?.print();}catch{}setTimeout(()=>{try{document.body.removeChild(iframe);}catch{}URL.revokeObjectURL(url);},120000);};
  },[hospitalInfo,oForm]);
  const ldSubdepts=useCallback(async()=>{const d=await fetch("/api/config/subdepartments?limit=50&isActive=true",{credentials:"include"}).then(r=>r.json());if(d.success)setSubdepts(d.data?.data||d.data||[]);},[]);
  const ldRevenue=useCallback(async()=>{setRevL(true);try{const[bRes,oRes]=await Promise.all([fetch("/api/billing?labOnly=true&limit=200",{credentials:"include"}).then(r=>r.json()),fetch("/api/pathology/orders?limit=100",{credentials:"include"}).then(r=>r.json())]);const bills=bRes.success?(bRes.data?.bills||bRes.data?.data||[]):[];const apiStats=bRes.success?bRes.data?.stats:null;const allOrds=oRes.success?(oRes.data?.data||oRes.data||[]):[];if(apiStats){const today=new Date().toDateString();const collected=bills.filter((b:any)=>b.status==="PAID").reduce((s:number,b:any)=>s+parseFloat(b.total||0),0);const pending=bills.filter((b:any)=>b.status!=="PAID"&&b.status!=="CANCELLED").reduce((s:number,b:any)=>s+parseFloat(b.total||0),0);const total=bills.reduce((s:number,b:any)=>s+parseFloat(b.total||0),0);setRevStats({total,collected,pending,today:apiStats.todayRevenue||0});}else{const today=new Date().toDateString();const rs={total:0,collected:0,pending:0,today:0};bills.forEach((b:any)=>{rs.total+=parseFloat(b.total||b.amount||0);if(b.status==="PAID"||b.paymentStatus==="PAID"){rs.collected+=parseFloat(b.total||b.amount||0);if(new Date(b.createdAt).toDateString()===today)rs.today+=parseFloat(b.total||b.amount||0);}else rs.pending+=parseFloat(b.total||b.amount||0);});setRevStats(rs);}const enriched=bills.map((b:any)=>{const ord=allOrds.find((o:any)=>o.id===b.labOrderId||(b.notes&&b.notes.includes(o.orderNo)));return{...b,order:ord||null};});setRevenue(enriched);}catch{}finally{setRevL(false);}},[]);

  // Fetch hospital settings directly from config (like billing does) — letterhead, logo, address etc.
  useEffect(()=>{(async()=>{try{const r=await fetch("/api/config/settings",{credentials:"include"}).then(r=>r.json());if(r.success&&r.data?.settings){const s=r.data.settings;setHospitalInfo({name:s.hospitalName||"",logo:s.logo||"",address:s.address||"",phone:s.phone||"",email:s.email||"",website:s.website||"",gstNumber:s.gstNumber||"",registrationNo:s.registrationNo||"",letterhead:s.letterhead||"",letterheadType:s.letterheadType||"IMAGE",letterheadSize:s.letterheadSize||"A4"});return;}}catch{}ldStats();})();},[]);// eslint-disable-line
  useEffect(()=>{
    if(tab==="overview"){ldStats();ldOrders();ldTests();ldPanels();}
    if(tab==="orders")ldOrders();
    if(tab==="samples"){ldSamples();ldOrders();}
    if(tab==="results")ldOrders();
    if(tab==="reports"){ldReports();ldOrders();}
    if(tab==="revenue"){ldRevenue();ldOrders();}
    if(tab==="tests"){ldTests();ldPanels();}
    if(tab==="panels"){ldTests();ldPanels();}
    if(tab==="analytics")ldStats();
  },[tab]);// eslint-disable-line

  const srchPat=useCallback(async(q:string)=>{if(srchAbort.current)srchAbort.current.abort();if(q.length<2){setPatR([]);return;}srchAbort.current=new AbortController();try{const d=await fetch(`/api/patients?q=${encodeURIComponent(q)}`,{credentials:"include",signal:srchAbort.current.signal}).then(r=>r.json());if(d.success)setPatR(Array.isArray(d.data)?d.data:(d.data?.patients||d.data?.data||[]));}catch(e:any){if(e.name!=="AbortError")setPatR([]);}},[]);
  const createOrder=async()=>{if(!oForm.patientId&&!oForm.patientName){setOMsg("Select or enter a patient");return;}if(!oForm.items.length){setOMsg("Add at least one test");return;}setOSaving(true);setOMsg("");const res=await fetch("/api/pathology/orders",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({...oForm,billingAction:oForm.billingAction||"defer",paymentMethod:oForm.paymentMode,discount:oForm.discount,taxPercent:oForm.taxPercent,billingSubdeptId:oForm.billingSubdeptId||undefined})}).then(r=>r.json());if(res.success){const bInfo=res.data?.bill;setShowOM(false);setOForm(BO);setPatR([]);setNewOrderTab(0);await ldOrders();if(bInfo?.billNo){if(oForm.billingAction==="collect_at_lab")alert(`✅ Order ${res.data?.orderNo||""} created.\nPayment collected — Bill: ${bInfo.billNo}`);else if(oForm.billingAction==="send_to_billing")alert(`✅ Order ${res.data?.orderNo||""} created.\nBill ${bInfo.billNo} sent to billing queue.`);}}else setOMsg(res.message||"Failed");setOSaving(false);};
  const addTest=(t:any)=>{if(oForm.items.find((i:any)=>i.testId===t.id))return;setOForm((f:any)=>({...f,items:[...f.items,{testId:t.id,panelId:null,name:t.name,code:t.code,price:t.price||0}]}));};
  const addPanel=(p:any)=>{if(oForm.items.find((i:any)=>i.panelId===p.id))return;setOForm((f:any)=>({...f,items:[...f.items,{testId:null,panelId:p.id,name:p.name,code:p.code,price:p.price||0}]}));};
  const createOrderFromRef=async(ref:any)=>{const[tRes,pRes]=await Promise.all([fetch("/api/pathology/tests",{credentials:"include"}).then(r=>r.json()),fetch("/api/pathology/panels",{credentials:"include"}).then(r=>r.json())]);const allT=tRes.success?(tRes.data||[]):tests;const allP=pRes.success?(pRes.data||[]):panels;if(tRes.success)setTests(allT);if(pRes.success)setPanels(allP);const matched=autoMatch(ref,allT.filter((t:any)=>t.isActive));const autoItems=matched.map((t:any)=>({testId:t.id,panelId:null,name:t.name,code:t.code,price:t.price||0,isAuto:true}));setOForm({...BO,sampleDate:new Date().toISOString().slice(0,10),patientSearch:ref.patientName||ref.patient?.name||"",patientId:ref.patientId||ref.patient?.id||"",patientName:ref.patientName||ref.patient?.name||"",age:ref.patient?.age?String(ref.patient.age):"",phone:ref.patientPhone||ref.patient?.phone||"",gender:ref.patientGender||ref.patient?.gender||"",dob:ref.patientDOB||ref.patient?.dateOfBirth||"",email:ref.patient?.email||"",address:ref.patient?.address||"",clinicalNotes:ref.prescription?.diagnosis||ref.referralNote||"",diagnosis:ref.prescription?.diagnosis||"",symptoms:ref.prescription?.chiefComplaint||"",orderType:"DOCTOR_REFERRAL",visitType:"OPD",referringDoctor:ref.doctorName||ref.doctor?.name||"",referringDept:ref.doctorSpecialization||ref.doctor?.specialization||"",appointmentId:ref.appointmentId||ref.id||"",items:autoItems});setNewOrderTab(0);setOMsg("");ldSubdepts();setShowOM(true);};
  const rmItem=(idx:number)=>setOForm((f:any)=>({...f,items:f.items.filter((_:any,i:number)=>i!==idx)}));
  const collectSample=async()=>{if(!smOrder)return;setSmSav(true);const res=await fetch("/api/pathology/samples",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:smOrder.id,...smForm})}).then(r=>r.json());if(res.success){setShowSM(false);setSmOrder(null);setSmForm({specimenType:"BLOOD",collectedBy:"",notes:""});await Promise.all([ldOrders(),ldSamples()]);}setSmSav(false);};
  const updSample=async(id:string,status:string,rr?:string)=>{await fetch("/api/pathology/samples",{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sampleId:id,status,rejectionReason:rr})});await ldSamples();};
  const openRes=(o:any)=>{const tmpl:any=(()=>{try{return JSON.parse(localStorage.getItem("lab_res_templates")||"{}")}catch{return{};}})();setResOrder(o);setResItems((o.items||[]).map((i:any)=>{const t=tmpl[i.test?.name]||{};return({id:i.id,testName:i.test?.name||i.panel?.name||"—",testCode:i.test?.code||"",unit:i.unit||i.test?.unit||t.unit||"",normalRange:i.normalRange||i.test?.normalRangeText||t.normalRange||"",result:i.result||"",isAbnormal:i.isAbnormal||false,isCritical:i.isCritical||false,notes:i.notes||"",enteredBy:i.enteredBy||t.enteredBy||"",method:i.method||i.test?.method||""});}));setResExtra({specimenCondition:"NORMAL",fastingStatus:"",collectedAt:o.sample?.collectedAt?new Date(o.sample.collectedAt).toISOString().slice(0,16):"",receivedAt:"",reportedAt:new Date().toISOString().slice(0,16),pathRemarks:"",interpretation:"",impression:"",recommendation:"",verifiedBy:"",qualification:"",approvedBy:"",reportVersion:"ORIGINAL",amendmentNotes:"",deliveryMode:"PRINT"});setResMsg("");window.scrollTo({top:0,behavior:"smooth"});};
  const saveRes=async()=>{if(!resOrder)return;setResSav(true);setResMsg("");const res=await fetch(`/api/pathology/orders/${resOrder.id}`,{method:"PUT",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"RESULT_ENTERED",pathologistRemarks:resExtra.pathRemarks,interpretation:resExtra.interpretation,impression:resExtra.impression,verifiedBy:resExtra.verifiedBy,deliveryMode:resExtra.deliveryMode,items:resItems.map(i=>({id:i.id,result:i.result,isAbnormal:i.isAbnormal,isCritical:i.isCritical,notes:i.notes,enteredBy:i.enteredBy,method:i.method,status:"RESULT_ENTERED"}))})}).then(r=>r.json());if(res.success){try{const tmpl:any=JSON.parse(localStorage.getItem("lab_res_templates")||"{}" );resItems.forEach(item=>{if(item.result)tmpl[item.testName]={unit:item.unit,normalRange:item.normalRange,enteredBy:item.enteredBy};});localStorage.setItem("lab_res_templates",JSON.stringify(tmpl));}catch{}setResOrder(null);await ldOrders();}else setResMsg(res.message||"Failed");setResSav(false);};
  const generateAiResults=async()=>{
    if(!resOrder||!resItems.length)return;
    setAiResL(true);setAiResMsg("");
    try{
      const age=resOrder.patient?.dateOfBirth?Math.floor((Date.now()-new Date(resOrder.patient.dateOfBirth).getTime())/(365.25*24*60*60*1000)):undefined;
      const body={
        tests:resItems.map((i:any)=>({name:i.testName,code:i.testCode,unit:i.unit,normalRange:i.normalRange,specimenType:resOrder.sample?.specimenType})),
        patientAge:age,
        patientGender:resOrder.patient?.gender,
        clinicalNotes:resOrder.clinicalNotes||resOrder.diagnosis||"",
        diagnosis:resOrder.diagnosis||"",
        specimenType:resOrder.sample?.specimenType||resOrder.specimenType||"",
      };
      const res=await fetch("/api/pathology/ai-results",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(r=>r.json());
      if(res.success&&res.data){
        const d=res.data;
        setResItems((prev:any[])=>prev.map((item:any)=>{
          const match=d.results?.find((r:any)=>{
            const rn=r.testName.toLowerCase();const tn=item.testName.toLowerCase();
            return rn===tn||rn.includes(tn)||tn.includes(rn);
          });
          if(match)return{...item,result:match.result||item.result,unit:match.unit||item.unit,isAbnormal:!!match.isAbnormal,isCritical:!!match.isCritical,notes:match.notes||item.notes};
          return item;
        }));
        if(d.interpretation)setResExtra((x:any)=>({...x,interpretation:d.interpretation}));
        if(d.impression)setResExtra((x:any)=>({...x,impression:d.impression}));
        if(d.recommendation)setResExtra((x:any)=>({...x,recommendation:d.recommendation}));
        if(d.pathRemarks)setResExtra((x:any)=>({...x,pathRemarks:d.pathRemarks}));
        setAiResMsg("✅ AI suggestions applied — review carefully and replace with actual measured values before saving.");
      }else{
        setAiResMsg("⚠ "+( res.message||"AI did not return results. Check API keys in .env."));
      }
    }catch(e:any){
      setAiResMsg("⚠ AI error: "+e.message);
    }finally{
      setAiResL(false);
    }
  };
  const startVoice=(idx:number)=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR){alert("Voice input is not supported in this browser. Please use Chrome or Edge.");return;}
    if(recogRef.current){recogRef.current.abort();}
    const r=new SR();
    r.lang="en-IN";r.continuous=false;r.interimResults=false;
    r.onstart=()=>{setIsListening(true);setListenIdx(idx);};
    r.onresult=(e:any)=>{
      const transcript=e.results[0][0].transcript.trim();
      setResItems((prev:any[])=>{const u=[...prev];u[idx]={...u[idx],result:transcript};return u;});
    };
    r.onend=()=>{setIsListening(false);setListenIdx(-1);};
    r.onerror=()=>{setIsListening(false);setListenIdx(-1);};
    recogRef.current=r;
    r.start();
  };
  const stopVoice=()=>{if(recogRef.current)try{recogRef.current.stop();}catch{}setIsListening(false);setListenIdx(-1);};
  const doRep=async(orderId:string,action:string,dm?:string)=>{setRActL(true);const res=await fetch("/api/pathology/reports",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId,action,deliveryMethod:dm})}).then(r=>r.json());if(res.success){setVRep(null);await Promise.all([ldReports(),ldOrders()]);}else alert(res.message||"Failed");setRActL(false);};
  const deleteReport=async()=>{if(!delRep)return;setDelRepL(true);try{const r=await fetch(`/api/pathology/reports?reportId=${delRep.id}`,{method:"DELETE",credentials:"include"}).then(r=>r.json());if(r.success){setDelRep(null);await Promise.all([ldReports(),ldOrders()]);}else alert(r.message||"Failed to delete");}catch(e:any){alert(e.message||"Error");}finally{setDelRepL(false);};};
  const saveEditReport=async()=>{if(!editRep)return;setEditRepSaving(true);setEditRepMsg("");try{const r=await fetch("/api/pathology/reports",{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({reportId:editRep.id,verifiedBy:editRepForm.verifiedBy,notes:editRepForm.notes,items:editRepItems})}).then(r=>r.json());if(r.success){setEditRep(null);await ldReports();}else setEditRepMsg(r.message||"Failed");}catch(e:any){setEditRepMsg(e.message||"Error");}finally{setEditRepSaving(false);};};
  const sendRepEmail=async(r:any)=>{if(!r.order?.patient?.email){alert("No email on file for this patient");return;}if(!confirm(`Send report to ${r.order.patient.email}?`))return;setRActL(true);const res=await fetch("/api/pathology/reports",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:r.orderId,action:"deliver",deliveryMethod:"EMAIL"})}).then(x=>x.json());if(res.success)await Promise.all([ldReports(),ldOrders()]);else alert(res.message||"Failed");setRActL(false);};
  const genRep=async(oid:string)=>{setRActL(true);const res=await fetch("/api/pathology/reports",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:oid,action:"generate"})}).then(r=>r.json());if(res.success){await Promise.all([ldOrders(),ldReports()]);const ord=orders.find((o:any)=>o.id===oid);if(ord?.patient?.email){const send=confirm(`✅ Report generated!\n\nSend to patient email?\n${ord.patient.email}`);if(send)await doRep(oid,"deliver","EMAIL");}}else alert(res.message||"All results must be entered first.");setRActL(false);};
  const saveTest=async()=>{if(!tForm.name||!tForm.code){setTMsg("Name and code required");return;}setTSav(true);setTMsg("");const url=editT?`/api/pathology/tests/${editT.id}`:"/api/pathology/tests";const res=await fetch(url,{method:editT?"PUT":"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(tForm)}).then(r=>r.json());if(res.success){setShowTF(false);setEditT(null);setTForm(BT);await ldTests();}else setTMsg(res.message||"Failed");setTSav(false);};
  const savePnl=async()=>{if(!pForm.name||!pForm.code){setPMsg("Name and code required");return;}setPSav(true);setPMsg("");const url=editP?`/api/pathology/panels/${editP.id}`:"/api/pathology/panels";const res=await fetch(url,{method:editP?"PUT":"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(pForm)}).then(r=>r.json());if(res.success){setShowPF(false);setEditP(null);setPForm(BP);await ldPanels();}else setPMsg(res.message||"Failed");setPSav(false);};
  const delItem=async()=>{if(!delT)return;setDelL(true);await fetch(`/api/pathology/${delT.type==="test"?"tests":"panels"}/${delT.item.id}`,{method:"DELETE",credentials:"include"});setDelT(null);setDelL(false);delT.type==="test"?await ldTests():await ldPanels();};

  const exportCSV=(data:any[],filename:string,cols:{key:string,label:string,fn?:(r:any)=>string}[])=>{if(!data.length)return;const hdr=cols.map(c=>c.label).join(",");const rows=data.map(r=>cols.map(c=>`"${((c.fn?c.fn(r):r[c.key])||"—").toString().replace(/"/g,'""')}"`).join(","));const csv=[hdr,...rows].join("\n");const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=filename;a.click();};
  const hn=(hospitalInfo?.name||profile?.name||"Hospital Lab");
  const haddr=(hospitalInfo?.address||"");
  const hphone=(hospitalInfo?.phone||"");
  const hemail=(hospitalInfo?.email||"");

  const printReport=async(rep:any)=>{
    const{default:jsPDF}=await import("jspdf");
    const autoTable=(await import("jspdf-autotable")).default;
    const pageSize=(hospitalInfo?.letterheadSize||"A4").toLowerCase() as "a4"|"a5"|"letter";
    const doc=new jsPDF({orientation:"portrait",unit:"mm",format:pageSize});
    const pw=doc.internal.pageSize.getWidth();const ph=doc.internal.pageSize.getHeight();
    const mx=14;
    const accent:[number,number,number]=[4,120,87];const gray:[number,number,number]=[100,116,139];const dark:[number,number,number]=[30,41,59];const green:[number,number,number]=[4,120,87];

    // --- Load letterhead image (or logo as fallback) — exactly like billing ---
    const letterheadDataUrl=await loadImageAsBase64(hospitalInfo?.letterhead||"");
    const logoDataUrl=letterheadDataUrl?null:await loadImageAsBase64(hospitalInfo?.logo||"");
    const hasLetterhead=!!letterheadDataUrl;
    let y:number;

    const repDate=rep.generatedAt?new Date(rep.generatedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";

    if(hasLetterhead){
      try{doc.addImage(letterheadDataUrl!,"PNG",0,0,pw,ph);}catch{}
      // Hospital name + logo on top of letterhead
      y=14;
      const lhLogoUrl=await loadImageAsBase64(hospitalInfo?.logo||"");
      const lhInfoX=lhLogoUrl?mx+28:mx;
      if(lhLogoUrl){try{doc.addImage(lhLogoUrl,"PNG",mx,y,22,22);}catch{}}
      doc.setFont("helvetica","bold");doc.setFontSize(16);doc.setTextColor(...green);
      doc.text(hn,lhInfoX,y+6);
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...gray);
      let lhY=y+12;
      if(haddr){doc.text(haddr,lhInfoX,lhY);lhY+=4;}
      if(hphone){doc.text("Phone: "+hphone,lhInfoX,lhY);lhY+=4;}
      if(hemail){doc.text("Email: "+hemail,lhInfoX,lhY);lhY+=4;}
      if(hospitalInfo?.gstNumber){doc.text("GSTIN: "+hospitalInfo.gstNumber,lhInfoX,lhY);lhY+=4;}
      if(hospitalInfo?.registrationNo){doc.text("Reg: "+hospitalInfo.registrationNo,lhInfoX,lhY);}
      y=50;
      // Centered title — plain text, no background
      doc.setFont("helvetica","bold");doc.setFontSize(13);doc.setTextColor(...dark);
      doc.text("LABORATORY TEST REPORT",pw/2,y,{align:"center"});
      y+=4;
      // Order No + Date in a bordered box below the title
      const bw=62;const bh=12;const bx=(pw-bw)/2;
      doc.setFillColor(248,250,252);doc.roundedRect(bx,y,bw,bh,1.5,1.5,"F");
      doc.setDrawColor(226,232,240);doc.setLineWidth(0.2);doc.roundedRect(bx,y,bw,bh,1.5,1.5,"S");
      doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(...accent);
      doc.text(rep.order?.orderNo||"—",pw/2,y+4.5,{align:"center"});
      doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(...gray);
      doc.text("Date: "+repDate,pw/2,y+9.5,{align:"center"});
      y+=bh+1;
    }else{
      y=14;
      doc.setFillColor(248,250,252);doc.rect(0,0,pw,48,"F");
      doc.setDrawColor(...accent);doc.setLineWidth(0.8);doc.line(0,48,pw,48);
      const infoX=logoDataUrl?mx+28:mx;
      if(logoDataUrl){try{doc.addImage(logoDataUrl,"PNG",mx,y,22,22);}catch{}}
      doc.setFont("helvetica","bold");doc.setFontSize(16);doc.setTextColor(...green);
      doc.text(hn,infoX,y+6);
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...gray);
      let hy=y+12;
      if(haddr){doc.text(haddr,infoX,hy);hy+=4;}
      if(hphone){doc.text("Phone: "+hphone,infoX,hy);hy+=4;}
      if(hemail){doc.text("Email: "+hemail,infoX,hy);hy+=4;}
      if(hospitalInfo?.gstNumber){doc.text("GSTIN: "+hospitalInfo.gstNumber,infoX,hy);hy+=4;}
      if(hospitalInfo?.registrationNo){doc.text("Reg: "+hospitalInfo.registrationNo,infoX,hy);}
      y=52;
      // Centered title — plain text, no background
      doc.setFont("helvetica","bold");doc.setFontSize(13);doc.setTextColor(...dark);
      doc.text("LABORATORY TEST REPORT",pw/2,y,{align:"center"});
      y+=6;
      // Order No + Date in a bordered box
      const bw=62;const bh=12;const bx=(pw-bw)/2;
      doc.setFillColor(248,250,252);doc.roundedRect(bx,y,bw,bh,1.5,1.5,"F");
      doc.setDrawColor(226,232,240);doc.setLineWidth(0.2);doc.roundedRect(bx,y,bw,bh,1.5,1.5,"S");
      doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(...accent);
      doc.text(rep.order?.orderNo||"—",pw/2,y+4.5,{align:"center"});
      doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(...gray);
      doc.text("Date: "+repDate,pw/2,y+9.5,{align:"center"});
      y+=bh+4;
    }

    // --- 3-COLUMN INFO BLOCK: Patient | Sample | Doctor/Client ---
    const cw=pw-2*mx;const colW=(cw-4)/3;const boxY=y;
    const infoBlock=(x:number,title:string,lines:{l:string,v:string}[])=>{
      doc.setFillColor(248,250,252);doc.roundedRect(x,boxY,colW,36,2,2,"F");
      doc.setDrawColor(226,232,240);doc.setLineWidth(0.2);doc.roundedRect(x,boxY,colW,36,2,2,"S");
      doc.setFontSize(7);doc.setTextColor(...accent);doc.setFont("helvetica","bold");
      doc.text(title,x+3,boxY+5);
      doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(...dark);
      let ly=boxY+10;
      lines.forEach(({l,v})=>{doc.setFont("helvetica","bold");doc.setTextColor(...gray);doc.text(l,x+3,ly);doc.setFont("helvetica","normal");doc.setTextColor(...dark);doc.text(`:  ${v}`,x+3+doc.getTextWidth(l)+1,ly);ly+=4.5;});
    };
    const pat=rep.order?.patient;const ord=rep.order;
    infoBlock(mx,"Patient Information",[{l:"Name",v:pat?.name||"—"},{l:"UHID",v:pat?.patientId||"—"},{l:"Phone",v:pat?.phone||"—"},{l:"Email",v:pat?.email||"—"},{l:"Gender",v:pat?.gender||"—"}]);
    infoBlock(mx+colW+2,"Sample Information",[{l:"Order No",v:ord?.orderNo||"—"},{l:"Priority",v:ord?.priority||"Routine"},{l:"Order Type",v:ord?.orderType||"—"},{l:"Registered",v:rep.generatedAt?new Date(rep.generatedAt).toLocaleDateString("en-IN"):"—"},{l:"Sample Type",v:ord?.sample?.specimenType||"—"}]);
    infoBlock(mx+2*(colW+2),"Referring Doctor / Client",[{l:"Doctor",v:ord?.doctor?.name?`Dr. ${ord.doctor.name}`:"—"},{l:"Hospital",v:hn},{l:"Status",v:rep.status||"—"},{l:"Verified",v:rep.verifiedBy||"—"},{l:"Printed",v:new Date().toLocaleDateString("en-IN")}]);
    y=boxY+40;

    // --- TEST RESULTS TABLE ---
    // Group items by category
    const items=(ord?.items||[]) as any[];
    const catGroups:Record<string,any[]>={};
    items.forEach((i:any)=>{const cat=i.test?.category||"General";if(!catGroups[cat])catGroups[cat]=[];catGroups[cat].push(i);});
    const catNames=Object.keys(catGroups);

    const tableRows:any[]=[];
    catNames.forEach((cat,ci)=>{
      // Section header row
      tableRows.push([{content:cat.replace(/_/g," "),colSpan:6,styles:{fontStyle:"bold" as const,fillColor:[230,245,240] as [number,number,number],textColor:accent,fontSize:8,cellPadding:{top:3,bottom:3,left:4,right:2}}}]);
      catGroups[cat].forEach((i:any)=>{
        const test=i.test||{};const name=test.name||i.panel?.name||"—";
        const method=test.method||"";const result=i.result||"—";
        const unit=i.unit||test.unit||"";const ref=i.normalRange||test.normalRangeText||"";
        let flag="";
        if(i.isCritical)flag="H !!";else if(i.isAbnormal){
          const rn=parseFloat(result);const mn=parseFloat(test.normalRangeMin);const mxn=parseFloat(test.normalRangeMax);
          if(!isNaN(rn)&&!isNaN(mn)&&!isNaN(mxn))flag=rn>mxn?"H":rn<mn?"L":"";else flag="*";
        }
        const rColor:[number,number,number]=i.isCritical?[220,38,38]:i.isAbnormal?[217,119,6]:[5,150,105];
        tableRows.push([
          {content:name,styles:{fontStyle:"normal" as const,fontSize:7.5}},
          {content:method,styles:{fontSize:7,textColor:[148,163,184] as [number,number,number]}},
          {content:result,styles:{fontStyle:"bold" as const,fontSize:8,textColor:rColor}},
          {content:unit,styles:{fontSize:7}},
          {content:ref,styles:{fontSize:7,textColor:gray as [number,number,number]}},
          {content:flag,styles:{fontStyle:"bold" as const,fontSize:7.5,textColor:(flag.includes("H")?[220,38,38]:flag==="L"?[37,99,235]:[148,163,184]) as [number,number,number],halign:"center" as const}},
        ]);
      });
    });

    autoTable(doc,{
      startY:y,
      head:[[
        {content:"Test / Investigation",styles:{fillColor:accent as [number,number,number],textColor:[255,255,255] as [number,number,number],fontStyle:"bold" as const}},
        {content:"Method",styles:{fillColor:accent as [number,number,number],textColor:[255,255,255] as [number,number,number],fontStyle:"bold" as const}},
        {content:"Result",styles:{fillColor:accent as [number,number,number],textColor:[255,255,255] as [number,number,number],fontStyle:"bold" as const}},
        {content:"Unit",styles:{fillColor:accent as [number,number,number],textColor:[255,255,255] as [number,number,number],fontStyle:"bold" as const}},
        {content:"Biological Ref. Interval",styles:{fillColor:accent as [number,number,number],textColor:[255,255,255] as [number,number,number],fontStyle:"bold" as const}},
        {content:"Flag",styles:{fillColor:accent as [number,number,number],textColor:[255,255,255] as [number,number,number],fontStyle:"bold" as const,halign:"center" as const}},
      ]],
      body:tableRows,
      styles:{fontSize:7.5,cellPadding:{top:2,bottom:2,left:3,right:2},lineColor:[226,232,240] as [number,number,number],lineWidth:0.2},
      headStyles:{fontSize:7.5,cellPadding:3},
      columnStyles:{0:{cellWidth:48},1:{cellWidth:24},2:{cellWidth:20},3:{cellWidth:18},4:{cellWidth:42},5:{cellWidth:14}},
      alternateRowStyles:{fillColor:[250,253,250] as [number,number,number]},
      margin:{left:mx,right:mx},
      didDrawPage:()=>{
        // Page number only
        doc.setFontSize(7);doc.setTextColor(...gray);
        doc.text(`Page ${(doc as any).internal.getCurrentPageInfo().pageNumber}`,pw/2,ph-6,{align:"center"});
      },
    });

    const finalY=(doc as any).lastAutoTable?.finalY||y+50;let sy=finalY+10;

    // --- CLINICAL FINDINGS BLOCK ---
    const clinBlocks:any[]=[
      {label:"Pathologist Remarks / Gross Description",val:rep.order?.pathologistRemarks},
      {label:"Clinical Interpretation",val:rep.order?.interpretation},
      {label:"Impression / Diagnosis",val:rep.order?.impression},
      {label:"Recommendation",val:rep.order?.recommendation},
    ].filter((b:any)=>b.val&&b.val.trim());
    clinBlocks.forEach((b:any)=>{
      if(sy+18>ph-30){doc.addPage();sy=20;}
      doc.setFillColor(240,253,244);doc.roundedRect(mx,sy,pw-2*mx,14+Math.ceil(b.val.length/90)*4.5,2,2,"F");
      doc.setDrawColor(167,243,208);doc.setLineWidth(0.2);doc.roundedRect(mx,sy,pw-2*mx,14+Math.ceil(b.val.length/90)*4.5,2,2,"S");
      doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...accent);
      doc.text(b.label.toUpperCase(),mx+3,sy+5);
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...dark);
      const wrapped=doc.splitTextToSize(b.val,pw-2*mx-6);
      doc.text(wrapped,mx+3,sy+10);
      sy+=16+wrapped.length*4.5;
    });
    if(clinBlocks.length>0)sy+=4;

    // --- SIGNATORY BLOCK ---
    if(sy+30>ph-20){doc.addPage();sy=20;}
    const sigY=Math.max(sy,ph-(hasLetterhead?60:50));
    doc.setDrawColor(180,180,180);doc.setLineWidth(0.3);
    doc.line(mx,sigY,mx+55,sigY);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...gray);
    doc.text(rep.verifiedBy||"Pathologist",mx,sigY+5);
    doc.setFontSize(6.5);doc.text("M.D. Pathology",mx,sigY+9);
    doc.line(pw-mx-55,sigY,pw-mx,sigY);
    doc.setFontSize(8);doc.text("Authorised Signatory",pw-mx-55,sigY+5);

    doc.save(`${(rep.order?.orderNo||"lab-report").replace(/\s+/g,"-")}-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const repGetExportData=()=>{
    const headers=["Order No","Patient","UHID","Phone","Doctor","Tests","Priority","Status","Generated","Verified By","Delivery"];
    const rows=reports.map((r:any)=>[r.order?.orderNo||"",r.order?.patient?.name||"",r.order?.patient?.patientId||"",r.order?.patient?.phone||"",r.order?.doctor?.name||"",(r.order?.items||[]).map((i:any)=>i.test?.name||i.panel?.name).filter(Boolean).join("; ")||"",r.order?.priority||"",r.status,r.generatedAt?new Date(r.generatedAt).toLocaleDateString("en-IN"):"",r.verifiedBy||"",r.deliveryMethod||""]);
    return{headers,rows,count:reports.length};
  };
  const repExportPDF=async()=>{
    const{default:jsPDF}=await import("jspdf");const autoTable=(await import("jspdf-autotable")).default;
    const{headers,rows,count}=repGetExportData();
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(18);doc.setTextColor("#047857");doc.text(hn,14,18);
    if(haddr){doc.setFontSize(9);doc.setTextColor("#6b7280");doc.text(haddr,14,25);}
    if(hphone){doc.setFontSize(9);doc.setTextColor("#6b7280");doc.text(hphone+(hemail?" | "+hemail:""),14,30);}
    doc.setFontSize(13);doc.setTextColor("#1e293b");doc.text("Lab Reports",14,40);
    doc.setFontSize(9);doc.setTextColor("#94a3b8");doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} report(s)`,14,47);
    autoTable(doc,{head:[headers],body:rows,startY:52,styles:{fontSize:8,cellPadding:3},headStyles:{fillColor:[4,120,87],textColor:255,fontStyle:"bold"},alternateRowStyles:{fillColor:[240,253,244]},didDrawPage:(d:any)=>{doc.setFontSize(8);doc.setTextColor("#94a3b8");doc.text(hn+" — Confidential Lab Report",14,doc.internal.pageSize.height-8);}});
    doc.save(`lab-reports-${new Date().toISOString().slice(0,10)}.pdf`);setRepExportOpen(false);
  };
  const repExportExcel=async()=>{
    const XLSX=(await import("xlsx")).default||await import("xlsx");
    const{headers,rows}=repGetExportData();
    const ws=XLSX.utils.aoa_to_sheet([headers,...rows]);
    ws["!cols"]=headers.map((_:any,i:number)=>({wch:[14,22,14,14,20,40,10,12,12,16,12][i]||14}));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Lab Reports");
    XLSX.writeFile(wb,`lab-reports-${new Date().toISOString().slice(0,10)}.xlsx`);setRepExportOpen(false);
  };
  const repExportWord=async()=>{
    const{Document,Packer,Paragraph,Table,TableRow,TableCell,WidthType,TextRun,AlignmentType,BorderStyle}=await import("docx");
    const{saveAs}=await import("file-saver");
    const{headers,rows,count}=repGetExportData();
    const bo={top:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"},bottom:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"},left:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"},right:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"}};
    const mkCell=(text:string,bold=false)=>new TableCell({borders:bo,children:[new Paragraph({alignment:AlignmentType.LEFT,children:[new TextRun({text:String(text),bold,size:18})]})]});
    const doc=new Document({sections:[{children:[
      new Paragraph({children:[new TextRun({text:hn,bold:true,size:32,color:"047857"})]}),
      ...(haddr?[new Paragraph({children:[new TextRun({text:haddr,size:18,color:"6b7280"})]})]:[]),
      new Paragraph({children:[new TextRun({text:`Lab Reports | Exported: ${new Date().toLocaleString("en-IN")} | ${count} record(s)`,size:18,color:"94a3b8"})]}),
      new Paragraph({text:""}),
      new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
        new TableRow({tableHeader:true,children:headers.map((h:string)=>mkCell(h,true))}),
        ...rows.map((row:any[])=>new TableRow({children:row.map((c:any)=>mkCell(String(c)))})),
      ]}),
    ]}]});
    saveAs(await Packer.toBlob(doc),`lab-reports-${new Date().toISOString().slice(0,10)}.docx`);setRepExportOpen(false);
  };
  const ordGetExportData=()=>{
    const headers=["Order No","Patient","UHID","Phone","Doctor","Tests","Priority","Status","Total (₹)","Date"];
    const rows=orders.map((o:any)=>[o.orderNo||"",o.patient?.name||"",o.patient?.patientId||"",o.patient?.phone||"",o.doctor?.name||"",(o.items||[]).map((i:any)=>i.test?.name||i.panel?.name).filter(Boolean).join("; ")||"",o.priority||"",o.status||"",o.totalAmount||"",o.createdAt?new Date(o.createdAt).toLocaleDateString("en-IN"):""]);
    return{headers,rows,count:orders.length};
  };
  const ordExportPDF=async()=>{
    const{default:jsPDF}=await import("jspdf");const autoTable=(await import("jspdf-autotable")).default;
    const{headers,rows,count}=ordGetExportData();
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(18);doc.setTextColor("#047857");doc.text(hn,14,18);
    if(haddr){doc.setFontSize(9);doc.setTextColor("#6b7280");doc.text(haddr,14,25);}
    doc.setFontSize(13);doc.setTextColor("#1e293b");doc.text("Lab Orders",14,36);
    doc.setFontSize(9);doc.setTextColor("#94a3b8");doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} order(s)`,14,43);
    autoTable(doc,{head:[headers],body:rows,startY:48,styles:{fontSize:8,cellPadding:3},headStyles:{fillColor:[4,120,87],textColor:255,fontStyle:"bold"},alternateRowStyles:{fillColor:[240,253,244]},didDrawPage:(d:any)=>{doc.setFontSize(8);doc.setTextColor("#94a3b8");doc.text(hn+" — Lab Orders",14,doc.internal.pageSize.height-8);}});
    doc.save(`lab-orders-${new Date().toISOString().slice(0,10)}.pdf`);setOrdExportOpen(false);
  };
  const ordExportExcel=async()=>{
    const XLSX=(await import("xlsx")).default||await import("xlsx");
    const{headers,rows}=ordGetExportData();
    const ws=XLSX.utils.aoa_to_sheet([headers,...rows]);
    ws["!cols"]=headers.map((_:any,i:number)=>({wch:[14,22,14,14,20,40,10,14,10,12][i]||14}));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Lab Orders");
    XLSX.writeFile(wb,`lab-orders-${new Date().toISOString().slice(0,10)}.xlsx`);setOrdExportOpen(false);
  };
  const ordExportWord=async()=>{
    const{Document,Packer,Paragraph,Table,TableRow,TableCell,WidthType,TextRun,AlignmentType,BorderStyle}=await import("docx");
    const{saveAs}=await import("file-saver");
    const{headers,rows,count}=ordGetExportData();
    const bo={top:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"},bottom:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"},left:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"},right:{style:BorderStyle.SINGLE,size:1,color:"e2e8f0"}};
    const mkCell=(text:string,bold=false)=>new TableCell({borders:bo,children:[new Paragraph({alignment:AlignmentType.LEFT,children:[new TextRun({text:String(text),bold,size:18})]})]});
    const doc=new Document({sections:[{children:[
      new Paragraph({children:[new TextRun({text:hn,bold:true,size:32,color:"047857"})]}),
      ...(haddr?[new Paragraph({children:[new TextRun({text:haddr,size:18,color:"6b7280"})]})]:[]),
      new Paragraph({children:[new TextRun({text:`Lab Orders | Exported: ${new Date().toLocaleString("en-IN")} | ${count} record(s)`,size:18,color:"94a3b8"})]}),
      new Paragraph({text:""}),
      new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
        new TableRow({tableHeader:true,children:headers.map((h:string)=>mkCell(h,true))}),
        ...rows.map((row:any[])=>new TableRow({children:row.map((c:any)=>mkCell(String(c)))})),
      ]}),
    ]}]});
    saveAs(await Packer.toBlob(doc),`lab-orders-${new Date().toISOString().slice(0,10)}.docx`);setOrdExportOpen(false);
  };
  const fTests=tests.filter(t=>!srch||t.name.toLowerCase().includes(srch.toLowerCase())||t.code.toLowerCase().includes(srch.toLowerCase()));
  const resCand=orders.filter(o=>["SAMPLE_COLLECTED","IN_PROCESS","RESULT_ENTERED"].includes(o.status));

  const cs=`
    .pd-body{min-height:600px;font-family:inherit;padding:14px 18px}
    .card{background:#fff;border-radius:11px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:12px}
    .chd{padding:10px 14px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between}
    .ct{font-size:12px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:5px}
    .pt{width:100%;border-collapse:collapse}
    .pt th{text-align:left;font-size:8.5px;font-weight:700;color:#94a3b8;padding:7px 10px;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:.05em}
    .pt td{padding:8px 10px;font-size:11px;color:#475569;border-bottom:1px solid #e2e8f0}
    .pt tbody tr:hover td{background:#fafafa}
    .pt tr:last-child td{border-bottom:none}
    .empty{text-align:center;padding:28px;color:#94a3b8;font-size:11px}
    .sec{font-size:12.5px;font-weight:700;color:#1e293b;margin-bottom:10px;display:flex;align-items:center;gap:7px}
    .dot{width:3px;height:14px;border-radius:3px;background:${GR};flex-shrink:0}
    .kpi{background:#fff;border-radius:11px;border:1px solid #e2e8f0;padding:12px;display:flex;align-items:center;gap:10px}
    .kpi-i{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .ov{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px}
    .mo{background:#fff;border-radius:14px;width:100%;border:1px solid #e2e8f0;box-shadow:0 20px 60px rgba(0,0,0,.18);display:flex;flex-direction:column;max-height:90vh}
    .mo-hd{padding:12px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
    .mo-b{padding:14px 18px;overflow-y:auto;flex:1}
    .mo-ft{padding:10px 18px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:7px;flex-shrink:0}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .spin{animation:spin .7s linear infinite}
    .crit{background:#fff;color:#dc2626;border:2px solid #fca5a5;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:800}
    .abn{background:#fff5f5;color:#b91c1c;border:1px solid #fecaca;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:700}
  `;

  return(<>
    <style>{cs}</style>
    <div className="pd-body">
        {/* OVERVIEW */}
        {tab==="overview"&&(()=>{
          const pendingOrders=orders.filter((o:any)=>o.status==="PENDING").length;
          const awaitSample=orders.filter((o:any)=>o.status==="PENDING").length;
          const awaitResult=orders.filter((o:any)=>["SAMPLE_COLLECTED","IN_PROCESS"].includes(o.status)).length;
          const awaitReport=orders.filter((o:any)=>o.status==="RESULT_ENTERED").length;
          const awaitVerify=orders.filter((o:any)=>o.status==="REPORTED").length;
          const awaitDeliver=orders.filter((o:any)=>o.status==="VERIFIED").length;
          const steps=[
            {n:"Referrals",count:referralQueue.length,tab:"overview",icon:<Bell size={15}/>,bg:"#f0fdf4",bc:A,desc:"Doctor referred"},
            {n:"Lab Orders",count:pendingOrders,tab:"orders",icon:<ClipboardList size={15}/>,bg:"#eff6ff",bc:"#2563eb",desc:"Create & manage"},
            {n:"Samples",count:awaitSample,tab:"samples",icon:<TestTube2 size={15}/>,bg:"#fffbeb",bc:"#b45309",desc:"Collect samples"},
            {n:"Results",count:awaitResult,tab:"results",icon:<Edit2 size={15}/>,bg:"#faf5ff",bc:"#7c3aed",desc:"Enter test results"},
            {n:"Reports",count:awaitReport+awaitVerify,tab:"reports",icon:<FileText size={15}/>,bg:"#ecfdf5",bc:"#047857",desc:"Generate & verify"},
            {n:"Deliver",count:awaitDeliver,tab:"reports",icon:<Send size={15}/>,bg:"#f0fdf4",bc:"#065f46",desc:"Email / print"},
          ];
          return(<>
          {/* Header */}
          <div style={{marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:30,height:30,borderRadius:8,background:GR,display:"flex",alignItems:"center",justifyContent:"center"}}><FlaskConical size={16} color="#fff"/></div>
                Pathology Lab Dashboard
              </div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2,marginLeft:38}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <Btn onClick={()=>{setOForm({...BO,sampleDate:new Date().toISOString().slice(0,10)});setOMsg("");setNewOrderTab(0);setPatR([]);ldTests();ldPanels();ldSubdepts();setShowOM(true);}} style={{background:A,color:"#fff",borderColor:A}}><Plus size={11}/>New Order</Btn>
              <Btn onClick={()=>{ldStats();ldOrders();}} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}><RefreshCw size={10} className={sL?"spin":""}/></Btn>
            </div>
          </div>

          {/* ── WORKFLOW PIPELINE ── */}
          <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,padding:"14px 10px",marginBottom:14}}>
            <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as any,letterSpacing:".08em",marginBottom:10,paddingLeft:4}}>WORKFLOW PIPELINE</div>
            <div style={{display:"flex",alignItems:"center",gap:0}}>
              {steps.map((step,i)=>{
                const active=step.count>0;
                return(<React.Fragment key={step.n}>
                  <button onClick={()=>sw(step.tab)} style={{flex:1,padding:"10px 6px 8px",borderRadius:11,border:`1px solid #e2e8f0`,background:"#fff",cursor:"pointer",textAlign:"center" as any,transition:"all .18s",position:"relative" as any,minWidth:0}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=step.bc;}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor="#e2e8f0";}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:4}}>
                      <div style={{width:24,height:24,borderRadius:7,background:active?step.bc:"#e2e8f0",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{i+1}</div>
                    </div>
                    <div style={{color:active?step.bc:"#94a3b8",marginBottom:2}}>{step.icon}</div>
                    <div style={{fontSize:22,fontWeight:800,color:active?step.bc:"#cbd5e1",lineHeight:1}}>{sL?"…":step.count}</div>
                    <div style={{fontSize:9,fontWeight:700,color:active?step.bc:"#94a3b8",marginTop:2,whiteSpace:"nowrap" as any,overflow:"hidden",textOverflow:"ellipsis"}}>{step.n}</div>
                    <div style={{fontSize:7.5,color:"#94a3b8",marginTop:1}}>{step.desc}</div>
                  </button>
                  {i<steps.length-1&&<div style={{width:24,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><ChevronRight size={14} color={steps[i].count>0&&steps[i+1].count>0?A:"#d1d5db"}/></div>}
                </React.Fragment>);
              })}
            </div>
          </div>

          {/* ── ALERTS ── */}
          {referralQueue.length>0&&<div style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1.5px solid #a7f3d0",borderRadius:11,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:9,background:A,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bell size={16}/></div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:A}}>{referralQueue.length} Doctor Referral{referralQueue.length>1?"s":""} Awaiting Lab Order</div><div style={{fontSize:10,color:"#047857"}}>Patients referred by doctors — scroll down to create lab orders</div></div>
            <Btn onClick={()=>{const el=document.getElementById("ref-queue");if(el)el.scrollIntoView({behavior:"smooth"});}} style={{background:A,color:"#fff",borderColor:A}}>View <ArrowRight size={10}/></Btn>
          </div>}

          {(stats?.kpis?.criticalCases||0)>0&&<div style={{background:"linear-gradient(135deg,#fff5f5,#fef2f2)",border:"1.5px solid #fca5a5",borderRadius:11,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:9,background:"#ef4444",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><AlertTriangle size={16}/></div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:"#b91c1c"}}>⚠ {stats.kpis.criticalCases} Critical Value{stats.kpis.criticalCases>1?"s":""} Detected</div><div style={{fontSize:10,color:"#ef4444"}}>Notify attending physician immediately</div></div>
            <Btn onClick={()=>sw("results")} style={{background:"#ef4444",color:"#fff",borderColor:"#ef4444"}}>View <ArrowRight size={10}/></Btn>
          </div>}

          {/* ── PENDING WORK — actionable cards ── */}
          {(awaitSample>0||awaitResult>0||awaitReport>0||awaitVerify>0)&&<div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as any,letterSpacing:".08em",marginBottom:8}}>NEEDS YOUR ATTENTION</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {[
                {show:awaitSample>0,label:"Pending Collection",count:awaitSample,icon:<TestTube2 size={14}/>,bg:"#fffbeb",bc:"#fde68a",c:"#b45309",tab:"samples",btn:"Collect"},
                {show:awaitResult>0,label:"Awaiting Results",count:awaitResult,icon:<Edit2 size={14}/>,bg:"#faf5ff",bc:"#e9d5ff",c:"#7c3aed",tab:"results",btn:"Enter"},
                {show:awaitReport>0,label:"Ready for Report",count:awaitReport,icon:<FileText size={14}/>,bg:"#ecfdf5",bc:"#a7f3d0",c:A,tab:"reports",btn:"Generate"},
                {show:awaitVerify>0,label:"Awaiting Verify",count:awaitVerify,icon:<ShieldCheck size={14}/>,bg:"#f0f9ff",bc:"#bae6fd",c:"#0284c7",tab:"reports",btn:"Verify"},
              ].filter(c=>c.show).map(c=>(
                <div key={c.label} style={{background:"#fff",border:`1px solid #e2e8f0`,borderRadius:10,padding:"10px 12px",display:"flex",flexDirection:"column" as any,gap:6,transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=c.bc;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.transform="none";}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{color:c.c}}>{c.icon}</span>
                    <span style={{fontSize:20,fontWeight:800,color:c.c}}>{c.count}</span>
                  </div>
                  <div style={{fontSize:10,fontWeight:700,color:c.c}}>{c.label}</div>
                  <Btn onClick={()=>sw(c.tab)} style={{background:c.c,color:"#fff",borderColor:c.c,fontSize:9,alignSelf:"flex-start",padding:"3px 10px"}}>{c.btn} <ArrowRight size={9}/></Btn>
                </div>
              ))}
            </div>
          </div>}

          {/* ── KPI GRID ── */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
            {[
              {l:"Tests Today",v:stats?.kpis?.totalToday??0,ic:<ClipboardList size={15}/>,bg:"#f0fdf4",c:A},
              {l:"Completed",v:stats?.kpis?.completedReports??0,ic:<CheckCircle2 size={15}/>,bg:"#f0fdf4",c:"#15803d"},
              {l:"Revenue Today",v:`₹${(stats?.kpis?.revenueToday||0).toLocaleString("en-IN")}`,ic:<IndianRupee size={15}/>,bg:"#faf5ff",c:"#7c3aed"},
              {l:"Avg TAT",v:stats?.kpis?.avgTat?`${stats.kpis.avgTat}h`:"—",ic:<TrendingUp size={15}/>,bg:"#f8fafc",c:"#475569"},
            ].map((k,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:8,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:k.c}}>{k.ic}</span></div>
                <div><div style={{fontSize:8,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as any,letterSpacing:".05em"}}>{k.l}</div><div style={{fontSize:16,fontWeight:800,color:k.c,lineHeight:1.2,marginTop:1}}>{sL?"…":k.v}</div></div>
              </div>
            ))}
          </div>

          {/* ── REFERRAL QUEUE ── */}
          {referralQueue.length>0&&<div id="ref-queue" className="card" style={{marginBottom:14}}>
            <div className="chd"><span className="ct"><Bell size={12} color={A}/>Doctor Referrals<span style={{marginLeft:6,background:A,color:"#fff",borderRadius:100,fontSize:9,fontWeight:800,padding:"1px 7px"}}>{referralQueue.length}</span></span><Btn onClick={()=>ldStats()} style={{background:L,color:A,borderColor:B,fontSize:9}}><RefreshCw size={9}/></Btn></div>
            <table className="pt"><thead><tr><th>Patient</th><th>UHID</th><th>Referred By</th><th>Date</th><th>Referral Note</th><th>Action</th></tr></thead><tbody>
              {referralQueue.map((ref:any,i:number)=>(
                <tr key={ref.appointmentId||i}>
                  <td><div style={{fontWeight:600,color:"#1e293b",fontSize:11}}>{ref.patientName}</div><div style={{fontSize:9,color:"#94a3b8"}}>{ref.patientPhone}</div></td>
                  <td style={{fontWeight:700,color:A,fontSize:10}}>{ref.patientUHID}</td>
                  <td style={{fontSize:10,color:"#475569"}}>Dr. {ref.doctorName}</td>
                  <td style={{fontSize:9,color:"#94a3b8"}}>{ref.appointmentDate?new Date(ref.appointmentDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):"—"}</td>
                  <td style={{fontSize:10,color:"#64748b",maxWidth:180}}>{ref.referralNote||<span style={{color:"#cbd5e1"}}>No notes</span>}</td>
                  <td><Btn onClick={()=>openWizard(ref)} style={{background:A,color:"#fff",borderColor:A,padding:"3px 9px"}}><Plus size={9}/>Create Order</Btn></td>
                </tr>
              ))}
            </tbody></table>
          </div>}

          {/* ── BOTTOM GRID: Recent Orders + Status Breakdown ── */}
          <div className="g2">
            <div className="card">
              <div className="chd"><span className="ct"><ClipboardList size={12} color={A}/>Recent Orders</span><Btn onClick={()=>sw("orders")} style={{background:L,color:A,borderColor:B,fontSize:9}}>All <ChevronRight size={9}/></Btn></div>
              <table className="pt"><thead><tr><th>No</th><th>Patient</th><th>Priority</th><th>Status</th><th style={{textAlign:"center" as any}}>Action</th></tr></thead><tbody>
                {oL?<tr><td colSpan={5} className="empty"><Loader2 size={13} className="spin" style={{verticalAlign:"middle"}}/></td></tr>:orders.length===0?<tr><td colSpan={5} className="empty">No orders yet</td></tr>:orders.slice(0,6).map((o:any)=>{const st=OS[o.status]||OS.PENDING;const p=PR[o.priority]||PR.ROUTINE;return(<tr key={o.id}><td style={{fontWeight:700,color:A,fontSize:10}}>{o.orderNo}</td><td><div style={{fontWeight:600,color:"#1e293b",fontSize:11}}>{o.patient?.name||"—"}</div><div style={{fontSize:9,color:"#94a3b8"}}>{o.patient?.patientId}</div></td><td><Bdg bg={p.bg} c={p.c} bd={p.bd}>{p.label}</Bdg></td><td><Bdg bg={st.bg} c={st.c} bd={st.bd}>{st.label}</Bdg></td>
                  <td style={{textAlign:"center" as any}}>
                    {o.status==="PENDING"&&<Btn onClick={()=>{setSmOrder(o);setSmForm({specimenType:"BLOOD",collectedBy:"",notes:""});setShowSM(true);}} style={{background:"#fffbeb",color:"#b45309",borderColor:"#fde68a",fontSize:9,padding:"2px 7px"}}><TestTube2 size={9}/></Btn>}
                    {["SAMPLE_COLLECTED","IN_PROCESS"].includes(o.status)&&<Btn onClick={()=>{openRes(o);sw("results");}} style={{background:"#faf5ff",color:"#7c3aed",borderColor:"#e9d5ff",fontSize:9,padding:"2px 7px"}}><Edit2 size={9}/></Btn>}
                    {o.status==="RESULT_ENTERED"&&<Btn onClick={()=>genRep(o.id)} disabled={rActL} style={{background:L,color:A,borderColor:B,fontSize:9,padding:"2px 7px"}}><FileText size={9}/></Btn>}
                    {o.status==="REPORTED"&&<Btn onClick={()=>doRep(o.id,"verify")} disabled={rActL} style={{background:"#f0f9ff",color:"#0284c7",borderColor:"#bae6fd",fontSize:9,padding:"2px 7px"}}><ShieldCheck size={9}/></Btn>}
                    {["VERIFIED","DELIVERED","CANCELLED"].includes(o.status)&&<span style={{fontSize:9,color:"#94a3b8"}}>—</span>}
                  </td>
                </tr>);})}
              </tbody></table>
            </div>
            <div className="card">
              <div className="chd"><span className="ct"><Activity size={12} color={A}/>Status Breakdown</span></div>
              <div style={{padding:"10px 14px"}}>
                {(stats?.ordersByStatus||[]).map((s:any)=>{const cfg=OS[s.status]||OS.PENDING;const pct=Math.round((s.count/Math.max(stats?.kpis?.totalOrders||1,1))*100);return(<div key={s.status} style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><Bdg bg={cfg.bg} c={cfg.c} bd={cfg.bd}>{cfg.label}</Bdg><span style={{fontSize:10,fontWeight:700,color:"#1e293b"}}>{s.count}</span></div><div style={{background:"#f1f5f9",borderRadius:100,height:4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:cfg.c,borderRadius:100}}/></div></div>);})}
                {!stats?.ordersByStatus?.length&&<div className="empty">No data yet</div>}
              </div>
            </div>
          </div>
        </>);
        })()}

        {/* ORDERS */}
        {tab==="orders"&&(()=>{
          const filtOrd=orders.filter((o:any)=>{
            if(ordFilter&&o.status!==ordFilter)return false;
            if(ordSearch){const q=ordSearch.toLowerCase();if(!(o.orderNo?.toLowerCase().includes(q)||o.patient?.name?.toLowerCase().includes(q)||o.patient?.patientId?.toLowerCase().includes(q)||o.doctor?.name?.toLowerCase().includes(q)))return false;}
            return true;
          }).sort((a:any,b:any)=>{
            if(ordSort==="oldest")return new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime();
            if(ordSort==="name_asc")return(a.patient?.name||"").localeCompare(b.patient?.name||"");
            if(ordSort==="name_desc")return(b.patient?.name||"").localeCompare(a.patient?.name||"");
            return new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime();
          });
          const pending=orders.filter((o:any)=>o.status==="PENDING").length;
          const sampleCollected=orders.filter((o:any)=>o.status==="SAMPLE_COLLECTED").length;
          const inProcess=orders.filter((o:any)=>o.status==="IN_PROCESS").length;
          const resultEntered=orders.filter((o:any)=>o.status==="RESULT_ENTERED").length;
          return(<>

          {/* ── DOCTOR REFERRALS — Cards ── */}
          {referralQueue.length>0&&<div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:7,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center"}}><Bell size={14} color={A}/></div>
                <div><div style={{fontSize:13,fontWeight:800,color:"#1e293b"}}>Doctor Referrals</div><div style={{fontSize:10,color:"#64748b"}}>{referralQueue.length} patient{referralQueue.length>1?"s":""} referred — create lab orders to begin</div></div>
              </div>
              <Btn onClick={()=>ldStats()} style={{background:"#f8fafc",color:"#64748b",borderColor:"#e2e8f0",fontSize:10}}><RefreshCw size={9} className={sL?"spin":""}/>Refresh</Btn>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
              {referralQueue.map((ref:any,i:number)=>(
                <div key={ref.appointmentId||i} style={{background:"#fff",border:"1.5px solid #a7f3d0",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(4,120,87,.08)",display:"flex",flexDirection:"column" as any,gap:8}}>
                  {/* Patient row */}
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:36,height:36,borderRadius:10,background:"#f0fdf4",border:"1.5px solid #a7f3d0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,fontWeight:800,color:A}}>{(ref.patientName||"?")[0].toUpperCase()}</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:800,color:"#1e293b"}}>{ref.patientName}</div>
                        <div style={{fontSize:10,color:"#64748b"}}>{ref.patientUHID||"Walk-in"}{ref.patientPhone?` · ${ref.patientPhone}`:""}</div>
                      </div>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,background:L,color:A,border:`1px solid ${B}`,borderRadius:20,padding:"2px 8px",flexShrink:0}}>REFERRED</span>
                  </div>
                  {/* Doctor + date */}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap" as any}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#475569",background:"#f8fafc",borderRadius:6,padding:"3px 8px"}}><Check size={9} color={A}/>Dr. {ref.doctorName||"Unknown"}</div>
                    {ref.appointmentDate&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#475569",background:"#f8fafc",borderRadius:6,padding:"3px 8px"}}><Clock size={9} color="#94a3b8"/>{new Date(ref.appointmentDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</div>}
                  </div>
                  {/* Referral note */}
                  {ref.referralNote&&<div style={{fontSize:10,color:"#64748b",background:"#f8fafc",borderRadius:7,padding:"6px 10px",borderLeft:"3px solid #a7f3d0",fontStyle:"italic" as any}}>{ref.referralNote}</div>}
                  {/* Action */}
                  <button onClick={()=>openWizard(ref)} style={{width:"100%",padding:"7px 0",borderRadius:8,border:`1.5px solid ${A}`,background:A,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Plus size={12}/>Create Lab Order</button>
                </div>
              ))}
              {/* Walk-in new order card */}
              <div style={{background:"#fafafa",border:"1.5px dashed #e2e8f0",borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",gap:8,minHeight:140,cursor:"pointer"}} onClick={()=>{setOForm({...BO,sampleDate:new Date().toISOString().slice(0,10)});setOMsg("");setNewOrderTab(0);setPatR([]);ldTests();ldPanels();ldSubdepts();setShowOM(true);}}>
                <div style={{width:40,height:40,borderRadius:12,background:"#f0fdf4",border:"1.5px solid #a7f3d0",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={18} color={A}/></div>
                <div style={{textAlign:"center" as any}}><div style={{fontSize:12,fontWeight:700,color:"#475569"}}>Walk-in Patient</div><div style={{fontSize:10,color:"#94a3b8"}}>New order without referral</div></div>
              </div>
            </div>
          </div>}

          {/* No referrals — show new order prompt */}
          {!referralQueue.length&&orders.length===0&&<div style={{background:"#f8fafc",border:"1.5px dashed #e2e8f0",borderRadius:12,padding:"28px",textAlign:"center" as any,marginBottom:14}}>
            <div style={{width:48,height:48,borderRadius:14,background:L,border:`1.5px solid ${B}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}><FlaskConical size={22} color={A}/></div>
            <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>No orders yet</div>
            <div style={{fontSize:11,color:"#64748b",marginBottom:12}}>Doctor referrals will appear here. You can also create a walk-in order.</div>
            <button onClick={()=>{setOForm({...BO,sampleDate:new Date().toISOString().slice(0,10)});setOMsg("");setNewOrderTab(0);setPatR([]);ldTests();ldPanels();ldSubdepts();setShowOM(true);}} style={{padding:"8px 20px",borderRadius:9,background:A,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}><Plus size={13}/>New Walk-in Order</button>
          </div>}

          {/* Stats bar */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:12}}>
            {[{l:"Total Orders",v:orders.length,bg:"#f8fafc",c:"#475569"},{l:"Pending",v:pending,bg:"#fffbeb",c:"#b45309"},{l:"Sample Collected",v:sampleCollected,bg:"#faf5ff",c:"#7c3aed"},{l:"In Process",v:inProcess,bg:"#f0f9ff",c:"#0369a1"},{l:"Result Entered",v:resultEntered,bg:"#f0fdf4",c:"#15803d"}].map(k=>(
              <div key={k.l} onClick={()=>setOrdFilter(k.l==="Total Orders"?"":k.l.replace(" ","_").toUpperCase())} style={{background:k.bg,borderRadius:10,padding:"10px 14px",border:`1.5px solid ${ordFilter===(k.l==="Total Orders"?"":k.l.replace(" ","_").toUpperCase())?"#047857":"#e2e8f0"}`,cursor:"pointer"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as any,letterSpacing:".05em"}}>{k.l}</div>
                <div style={{fontSize:20,fontWeight:800,color:k.c,lineHeight:1.2,marginTop:2}}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Pending Alerts */}
          {(()=>{
            const ov=orders.filter((o:any)=>o.status==="PENDING"&&(Date.now()-new Date(o.createdAt).getTime())>4*3600*1000);
            const nr=orders.filter((o:any)=>["SAMPLE_COLLECTED","IN_PROCESS"].includes(o.status)&&(Date.now()-new Date(o.createdAt).getTime())>24*3600*1000);
            if(!ov.length&&!nr.length)return null;
            return(<div style={{marginBottom:10}}>
              {ov.length>0&&<div style={{background:"#fff7ed",border:"1.5px solid #fde68a",borderRadius:9,padding:"9px 14px",marginBottom:6,display:"flex",alignItems:"center",gap:9}}>
                <AlertTriangle size={14} color="#b45309"/>
                <div style={{flex:1}}><b style={{color:"#b45309",fontSize:12}}>⚠ {ov.length} order{ov.length>1?"s":""} pending sample collection for over 4 hours</b><span style={{fontSize:10,color:"#92400e",marginLeft:8}}>— Go to Samples tab to collect</span></div>
                <Btn onClick={()=>sw("samples")} style={{background:"#b45309",color:"#fff",borderColor:"#b45309",fontSize:10}}>Collect <ArrowRight size={9}/></Btn>
              </div>}
              {nr.length>0&&<div style={{background:"#faf5ff",border:"1.5px solid #c4b5fd",borderRadius:9,padding:"9px 14px",display:"flex",alignItems:"center",gap:9}}>
                <AlertTriangle size={14} color="#7c3aed"/>
                <div style={{flex:1}}><b style={{color:"#7c3aed",fontSize:12}}>⚠ {nr.length} order{nr.length>1?"s":""} awaiting result entry for over 24 hours</b><span style={{fontSize:10,color:"#6d28d9",marginLeft:8}}>— Go to Results tab</span></div>
                <Btn onClick={()=>sw("results")} style={{background:"#7c3aed",color:"#fff",borderColor:"#7c3aed",fontSize:10}}>Enter Results <ArrowRight size={9}/></Btn>
              </div>}
            </div>);
          })()}

          {/* Toolbar */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap" as any}}>
            {/* Search */}
            <div style={{display:"flex",alignItems:"center",gap:6,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:9,padding:"6px 12px",flex:1,minWidth:200}}>
              <Eye size={12} color="#94a3b8"/>
              <input style={{background:"none",border:"none",outline:"none",fontSize:12,color:"#334155",width:"100%"}} placeholder="Search by order no, patient, UHID…" value={ordSearch} onChange={(e:any)=>setOrdSearch(e.target.value)}/>
              {ordSearch&&<button onClick={()=>setOrdSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={11} color="#94a3b8"/></button>}
            </div>
            {/* Filter pills */}
            <div style={{display:"flex",gap:5}}>
              {(["","PENDING","SAMPLE_COLLECTED","IN_PROCESS","RESULT_ENTERED"] as const).map((f:any)=>(
                <button key={f} onClick={()=>setOrdFilter(f)} style={{padding:"5px 11px",borderRadius:20,border:`1.5px solid ${ordFilter===f?A:"#e2e8f0"}`,background:ordFilter===f?L:"#fff",color:ordFilter===f?A:"#64748b",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                  {!f?"All":f.split("_").map((w:string)=>w.charAt(0)+w.slice(1).toLowerCase()).join(" ")}
                </button>
              ))}
            </div>
            {/* Sort */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setOrdSortOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <ArrowRight size={11} style={{transform:"rotate(-45deg)"}}/>
                {[{v:"newest",l:"Newest"},{v:"oldest",l:"Oldest"},{v:"name_asc",l:"Name A-Z"},{v:"name_desc",l:"Name Z-A"}].find(o=>o.v===ordSort)?.l||"Sort"}<ChevronDown size={10}/>
              </button>
              {ordSortOpen&&(<>
                <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setOrdSortOpen(false)}/>
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:70,minWidth:160,overflow:"hidden"}}>
                  {[{v:"newest",l:"Newest First"},{v:"oldest",l:"Oldest First"},{v:"name_asc",l:"Name A–Z"},{v:"name_desc",l:"Name Z–A"}].map(opt=>(
                    <button key={opt.v} onClick={()=>{setOrdSort(opt.v);setOrdSortOpen(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 14px",background:ordSort===opt.v?L:"transparent",border:"none",cursor:"pointer",fontSize:12,color:ordSort===opt.v?A:"#475569",fontWeight:ordSort===opt.v?700:400}}>
                      {opt.l}{ordSort===opt.v&&<CheckCircle2 size={12} color={A}/>}
                    </button>
                  ))}
                </div>
              </>)}
            </div>
            {/* Export */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setOrdExportOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <Download size={12}/> Export <ChevronDown size={10}/>
              </button>
              {ordExportOpen&&(<>
                <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setOrdExportOpen(false)}/>
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:70,minWidth:178,padding:5}}>
                  {[
                    {label:"Export as PDF",   icon:<FileText size={13}/>,        bg:"#fff5f5",col:"#ef4444",fn:ordExportPDF},
                    {label:"Export as Excel",  icon:<FileSpreadsheet size={13}/>, bg:"#f0fdf4",col:"#16a34a",fn:ordExportExcel},
                    {label:"Export as Word",   icon:<FileType size={13}/>,        bg:"#eff6ff",col:"#2563eb",fn:ordExportWord},
                  ].map(({label,icon,bg,col,fn})=>(
                    <button key={label} onClick={fn} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:7,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500,textAlign:"left" as any}}
                      onMouseEnter={e=>{e.currentTarget.style.background="#f1f5f9";}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
                      <span style={{width:22,height:22,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:bg,color:col,flexShrink:0}}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </>)}
            </div>
            {/* Refresh / Clear */}
            <button onClick={()=>ldOrders()} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:11,cursor:"pointer"}}><RefreshCw size={11} className={oL?"spin":""}/></button>
            {(ordSearch||ordFilter)&&<button onClick={()=>{setOrdSearch("");setOrdFilter("");}} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #fecaca",background:"#fff5f5",color:"#ef4444",fontSize:11,fontWeight:600,cursor:"pointer"}}><X size={11}/>Clear</button>}
            <Btn onClick={()=>{setOForm({...BO,sampleDate:new Date().toISOString().slice(0,10)});setOMsg("");setNewOrderTab(0);setPatR([]);ldTests();ldPanels();setShowOM(true);}} style={{background:A,color:"#fff",borderColor:A,marginLeft:"auto"}}><Plus size={12}/>New Order</Btn>
          </div>

          {/* Table */}
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"#f8fafc"}}>
                  {["Order No","Patient","Tests","Doctor","Priority","Status","Date","Actions"].map(h=>(
                    <th key={h} style={{textAlign:"left",fontSize:10,fontWeight:700,color:"#94a3b8",padding:"9px 12px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap" as any,letterSpacing:".04em"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {oL?(<tr><td colSpan={8} style={{textAlign:"center" as any,padding:32,color:"#94a3b8"}}><Loader2 size={16} className="spin" style={{display:"inline"}}/></td></tr>)
                  :filtOrd.length===0?(<tr><td colSpan={8} style={{textAlign:"center" as any,padding:40,color:"#94a3b8",fontSize:12}}>{orders.length===0?"No orders yet.":"No orders match your search."}</td></tr>)
                  :filtOrd.map((o:any)=>{
                    const st=OS[o.status]||OS.PENDING;const p=PR[o.priority]||PR.ROUTINE;const hc=o.items?.some((i:any)=>i.isCritical);
                    return(<tr key={o.id} style={{borderBottom:"1px solid #f8fafc"}} onMouseEnter={e=>{e.currentTarget.style.background="#fafbfc";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                      <td style={{padding:"10px 12px",fontWeight:700,color:A,fontSize:11,whiteSpace:"nowrap" as any}}>{o.orderNo}{hc&&<span className="crit" style={{marginLeft:4}}>CRIT</span>}</td>
                      <td style={{padding:"10px 12px"}}>
                        <div style={{fontWeight:700,fontSize:12,color:"#1e293b"}}>{o.patient?.name||"—"}</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>{o.patient?.patientId||""}</div>
                        {o.patient?.phone&&<div style={{fontSize:10,color:"#94a3b8"}}>{o.patient.phone}</div>}
                      </td>
                      <td style={{padding:"10px 12px",maxWidth:130,fontSize:10,color:"#475569"}}>
                        {(o.items||[]).slice(0,2).map((i:any)=>i.test?.name||i.panel?.name).filter(Boolean).join(", ")||"—"}
                        {(o.items||[]).length>2&&<span style={{color:"#94a3b8"}}> +{(o.items.length-2)}</span>}
                      </td>
                      <td style={{padding:"10px 12px",fontSize:10,color:"#475569",whiteSpace:"nowrap" as any}}>Dr. {o.doctor?.name||"—"}</td>
                      <td style={{padding:"10px 12px"}}><span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:p.bg,color:p.c,border:`1px solid ${p.bd}`}}>{p.label}</span></td>
                      <td style={{padding:"10px 12px"}}><span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:st.bg,color:st.c,border:`1px solid ${st.bd}`}}>{st.label}</span></td>
                      <td style={{padding:"10px 12px",fontSize:10,color:"#64748b",whiteSpace:"nowrap" as any}}>{fd(o.createdAt)}</td>
                      <td style={{padding:"10px 12px"}}>
                        {(()=>{
                          const AB=({title,onClick,bg,col,disabled,children}:any)=>(
                            <button title={title} onClick={onClick} disabled={disabled} style={{width:32,height:32,borderRadius:8,border:"1px solid",borderColor:bg==="red"?"#fecaca":bg==="blue"?"#bfdbfe":bg==="purple"?"#e9d5ff":bg==="orange"?"#fed7aa":"#e2e8f0",background:bg==="red"?"#fff5f5":bg==="blue"?"#eff6ff":bg==="purple"?"#faf5ff":bg==="orange"?"#fff7ed":"#f8fafc",color:col||"#475569",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .12s"}}
                              onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity="0.8";}} onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>
                              {children}
                            </button>
                          );
                          return(<div style={{display:"flex",gap:4}}>
                            {o.status==="PENDING"&&<AB title="Collect Sample" onClick={()=>{setSmOrder(o);setSmForm({specimenType:o.items?.[0]?.test?.specimenType||"BLOOD",collectedBy:"",notes:""});setShowSM(true);}} bg="orange" col="#b45309"><TestTube2 size={13}/></AB>}
                            {["SAMPLE_COLLECTED","IN_PROCESS"].includes(o.status)&&<AB title="Enter Results" onClick={()=>{openRes(o);sw("results");}} bg="purple" col="#7c3aed"><Edit2 size={13}/></AB>}
                            {o.status==="RESULT_ENTERED"&&<AB title="Generate Report" onClick={()=>genRep(o.id)} disabled={rActL} bg="green" col="#15803d"><FileText size={13}/></AB>}
                            {o.status==="REPORTED"&&<AB title="Verify Report" onClick={()=>doRep(o.id,"verify")} disabled={rActL} bg="green" col="#047857"><ShieldCheck size={13}/></AB>}
                            <AB title="View Order" onClick={()=>setVOrd(o)} bg="green" col={A}><Eye size={13}/></AB>
                            <AB title="Download PDF" onClick={()=>printReport({order:o,status:"DRAFT",generatedAt:new Date()})} bg="blue" col="#2563eb"><Download size={13}/></AB>
                            <AB title="Edit Order" onClick={()=>setEditOrd(o)} bg="orange" col="#ea580c"><Pencil size={13}/></AB>
                            <AB title="Delete Order" onClick={()=>setDelOrd(o)} bg="red" col="#dc2626"><Trash2 size={13}/></AB>
                          </div>);
                        })()}
                      </td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>);
        })()}

        {/* SAMPLES */}
        {tab==="samples"&&<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div className="sec" style={{margin:0}}><div className="dot"/>Sample Tracking</div><Btn onClick={()=>{ldSamples();ldOrders();}} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}><RefreshCw size={10} className={(smL||oL)?"spin":""}/> Refresh</Btn></div>
          <div className="card" style={{marginBottom:12}}>
            <div className="chd"><span className="ct"><Clock size={12} color="#b45309"/>Awaiting Collection</span></div>
            <table className="pt"><thead><tr><th>Order</th><th>Patient</th><th>Tests</th><th>Priority</th><th>Action</th></tr></thead><tbody>
              {orders.filter(o=>o.status==="PENDING").length===0?<tr><td colSpan={5} className="empty">No pending collections</td></tr>:orders.filter(o=>o.status==="PENDING").map((o:any)=>{const p=PR[o.priority]||PR.ROUTINE;return(<tr key={o.id}><td style={{fontWeight:700,color:A,fontSize:10}}>{o.orderNo}</td><td style={{fontWeight:600,color:"#1e293b",fontSize:11}}>{o.patient?.name||"—"}</td><td style={{fontSize:10,color:"#475569"}}>{(o.items||[]).map((i:any)=>i.test?.name||i.panel?.name).filter(Boolean).join(", ")||"—"}</td><td><Bdg bg={p.bg} c={p.c} bd={p.bd}>{p.label}</Bdg></td><td><Btn onClick={()=>{setSmOrder(o);setSmForm({specimenType:"BLOOD",collectedBy:"",notes:""});setShowSM(true);}} style={{background:"#fffbeb",color:"#b45309",borderColor:"#fde68a"}}><TestTube2 size={9}/>Collect</Btn></td></tr>);})}
            </tbody></table>
          </div>
          <div className="card">
            <div className="chd"><span className="ct"><TestTube2 size={12} color={A}/>Samples ({samples.length})</span></div>
            <table className="pt"><thead><tr><th>Barcode</th><th>Order</th><th>Patient</th><th>Specimen</th><th>Collected By</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead><tbody>
              {smL?<tr><td colSpan={8} className="empty"><Loader2 size={13} className="spin" style={{verticalAlign:"middle"}}/></td></tr>:samples.length===0?<tr><td colSpan={8} className="empty">No samples yet</td></tr>:samples.map((s:any)=>{const ss=SS[s.status]||SS.COLLECTED;return(<tr key={s.id}>
                <td><code style={{fontSize:9,fontWeight:700,color:"#1e293b",background:"#f8fafc",padding:"1px 5px",borderRadius:3}}>{s.barcodeId}</code></td>
                <td style={{fontWeight:600,color:A,fontSize:10}}>{s.order?.orderNo||"—"}</td>
                <td><div style={{fontWeight:600,color:"#1e293b",fontSize:11}}>{s.order?.patient?.name||"—"}</div></td>
                <td><Bdg bg={L} c={A} bd={B}>{s.specimenType}</Bdg></td>
                <td style={{fontSize:10,color:"#64748b"}}>{s.collectedBy||"—"}</td>
                <td style={{fontSize:9,color:"#94a3b8",whiteSpace:"nowrap" as any}}>{ff(s.collectedAt)}</td>
                <td><Bdg bg={ss.bg} c={ss.c} bd={ss.bg}>{ss.l}</Bdg></td>
                <td><div style={{display:"flex",gap:2}}>
                  {s.status==="COLLECTED"&&<Btn onClick={()=>updSample(s.id,"RECEIVED")} style={{background:"#faf5ff",color:"#7c3aed",borderColor:"#e9d5ff",fontSize:9}}>Recv</Btn>}
                  {s.status==="RECEIVED"&&<Btn onClick={()=>updSample(s.id,"IN_PROCESS")} style={{background:"#fffbeb",color:"#b45309",borderColor:"#fde68a",fontSize:9}}>Proc</Btn>}
                  {["COLLECTED","RECEIVED"].includes(s.status)&&<Btn onClick={()=>{const r=prompt("Rejection reason:");if(r)updSample(s.id,"REJECTED",r);}} style={{background:"#fff5f5",color:"#ef4444",borderColor:"#fecaca",fontSize:9}}>Rej</Btn>}
                </div></td>
              </tr>);})}
            </tbody></table>
          </div>
        </>}

        {/* RESULTS */}
        {tab==="results"&&(()=>{
          const filtRes=resCand.filter((o:any)=>{
            if(resFilter&&o.status!==resFilter)return false;
            if(resSearch){const q=resSearch.toLowerCase();if(!(o.orderNo?.toLowerCase().includes(q)||o.patient?.name?.toLowerCase().includes(q)||o.patient?.patientId?.toLowerCase().includes(q)||o.doctor?.name?.toLowerCase().includes(q)))return false;}
            return true;
          }).sort((a:any,b:any)=>{
            if(resSort==="oldest")return new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime();
            if(resSort==="name_asc")return(a.patient?.name||"").localeCompare(b.patient?.name||"");
            if(resSort==="name_desc")return(b.patient?.name||"").localeCompare(a.patient?.name||"");
            return new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime();
          });
          const cntSC=resCand.filter((o:any)=>o.status==="SAMPLE_COLLECTED").length;
          const cntIP=resCand.filter((o:any)=>o.status==="IN_PROCESS").length;
          const cntRE=resCand.filter((o:any)=>o.status==="RESULT_ENTERED").length;
          return(<>

          {/* ── RESULT ENTRY PANEL (inline, top) ── */}
          {resOrder&&(
            <div style={{background:"#fff",border:"1.5px solid #e9d5ff",borderRadius:14,marginBottom:16,overflow:"hidden",boxShadow:"0 4px 20px rgba(124,58,237,.08)"}}>
              {/* Panel Header */}
              <div style={{background:"linear-gradient(135deg,#faf5ff,#f5f3ff)",borderBottom:"1px solid #e9d5ff",padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:34,height:34,borderRadius:9,background:"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Edit2 size={15} color="#fff"/></div>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:"#1e293b"}}>Result Entry — {resOrder.orderNo}</div>
                    <div style={{fontSize:10,color:"#64748b"}}>{resOrder.patient?.name||"—"} · {resOrder.patient?.patientId||"—"} · Dr. {resOrder.doctor?.name||"—"}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:9,fontWeight:700,background:"#faf5ff",color:"#7c3aed",border:"1px solid #e9d5ff",borderRadius:20,padding:"2px 10px"}}>{resExtra.reportVersion}</span>
                  <button onClick={generateAiResults} disabled={aiResL} title="AI auto-fill result values and interpretation" style={{display:"flex",alignItems:"center",gap:5,padding:"5px 13px",borderRadius:8,border:"1.5px solid #a78bfa",background:aiResL?"#ede9fe":"linear-gradient(135deg,#8b5cf6,#7c3aed)",color:"#fff",fontSize:11,fontWeight:700,cursor:aiResL?"not-allowed":"pointer",opacity:aiResL?.7:1,transition:"all .2s"}}>{aiResL?<><Loader2 size={12} style={{animation:"spin .7s linear infinite"}}/>&nbsp;Generating…</>:<><Sparkles size={12}/>&nbsp;AI Fill</>}</button>
                  <button onClick={()=>setResOrder(null)} title="Back to orders list" style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:11,fontWeight:700,cursor:"pointer"}}><ArrowRight size={12} style={{transform:"rotate(180deg)"}}/> Back</button>
                </div>
              </div>

              {aiResMsg&&(
                <div style={{padding:"9px 18px",background:aiResMsg.startsWith("✅")?"#f0fdf4":"#fff7ed",borderBottom:"1px solid",borderBottomColor:aiResMsg.startsWith("✅")?"#a7f3d0":"#fed7aa",display:"flex",alignItems:"center",gap:10}}>
                  {aiResMsg.startsWith("✅")?<CheckCircle2 size={13} color="#15803d"/>:<AlertTriangle size={13} color="#b45309"/>}
                  <span style={{fontSize:11,fontWeight:600,color:aiResMsg.startsWith("✅")?"#15803d":"#b45309",flex:1}}>{aiResMsg}</span>
                  <button onClick={()=>setAiResMsg("")} style={{background:"none",border:"none",cursor:"pointer",padding:2,display:"flex"}}><X size={11} color="#94a3b8"/></button>
                </div>
              )}

              <div style={{padding:"16px 18px"}}>
                {/* ── Section 1: Patient Info + Sample Details ── */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                  {/* Patient & Visit Information */}
                  <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#7c3aed",textTransform:"uppercase" as any,letterSpacing:".06em",marginBottom:9,display:"flex",alignItems:"center",gap:5}}><span style={{width:5,height:14,borderRadius:2,background:"#7c3aed",display:"inline-block"}}/>Patient & Visit Information</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:1}}>PATIENT NAME</div><div style={{fontSize:12,fontWeight:800,color:"#1e293b"}}>{resOrder.patient?.name||"—"}</div></div>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:1}}>UHID / PATIENT ID</div><div style={{fontSize:11,color:"#475569",fontWeight:600}}>{resOrder.patient?.patientId||"—"}</div></div>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:1}}>AGE / GENDER</div><div style={{fontSize:11,color:"#475569"}}>{resOrder.patient?.dateOfBirth?`${calcAge(resOrder.patient.dateOfBirth)} yrs`:"—"} / {resOrder.patient?.gender||"—"}</div></div>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:1}}>CONTACT</div><div style={{fontSize:11,color:"#475569"}}>{resOrder.patient?.phone||"—"}</div></div>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:1}}>REFERRING DOCTOR</div><div style={{fontSize:11,color:"#475569",fontWeight:600}}>Dr. {resOrder.doctor?.name||"—"}</div></div>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:1}}>ORDER DATE</div><div style={{fontSize:11,color:"#475569"}}>{resOrder.createdAt?new Date(resOrder.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}</div></div>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:1}}>PATIENT TYPE</div><div style={{fontSize:11,color:"#475569"}}>{resOrder.visitType||resOrder.patientType||"OPD"}</div></div>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:1}}>PRIORITY</div><div style={{fontSize:11,color:"#475569",fontWeight:600}}>{resOrder.priority||"ROUTINE"}</div></div>
                      {resOrder.clinicalNotes&&<div style={{gridColumn:"1/-1"}}><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:2}}>CLINICAL NOTES / DIAGNOSIS</div><div style={{fontSize:10,color:"#475569",background:"#fff",borderRadius:6,padding:"5px 9px",border:"1px solid #e2e8f0",fontStyle:"italic" as any}}>{resOrder.clinicalNotes}</div></div>}
                    </div>
                  </div>

                  {/* Sample / Specimen Details */}
                  <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#7c3aed",textTransform:"uppercase" as any,letterSpacing:".06em",marginBottom:9,display:"flex",alignItems:"center",gap:5}}><span style={{width:5,height:14,borderRadius:2,background:"#7c3aed",display:"inline-block"}}/>Sample / Specimen Details</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:2}}>SPECIMEN TYPE</div><div style={{fontSize:11,color:"#475569",fontWeight:600}}>{resOrder.sample?.specimenType||"—"}</div></div>
                      <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:2}}>BARCODE / SAMPLE ID</div><code style={{fontSize:11,fontFamily:"monospace",color:"#1e293b",fontWeight:700,background:"#f1f5f9",padding:"1px 6px",borderRadius:4}}>{resOrder.sample?.barcodeId||"—"}</code></div>
                      <div>
                        <div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:2}}>COLLECTED AT</div>
                        <input type="datetime-local" value={resExtra.collectedAt} onChange={e=>setResExtra((x:any)=>({...x,collectedAt:e.target.value}))} style={{width:"100%",fontSize:10,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 6px",color:"#334155",background:"#fff",outline:"none"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:2}}>RECEIVED AT LAB</div>
                        <input type="datetime-local" value={resExtra.receivedAt} onChange={e=>setResExtra((x:any)=>({...x,receivedAt:e.target.value}))} style={{width:"100%",fontSize:10,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 6px",color:"#334155",background:"#fff",outline:"none"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:2}}>SPECIMEN CONDITION</div>
                        <select value={resExtra.specimenCondition} onChange={e=>setResExtra((x:any)=>({...x,specimenCondition:e.target.value}))} style={{width:"100%",fontSize:10,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 6px",color:"#334155",background:"#fff"}}>
                          {["NORMAL","HAEMOLYSED","LIPEMIC","ICTERIC","INSUFFICIENT","CONTAMINATED"].map(v=><option key={v} value={v}>{v.charAt(0)+v.slice(1).toLowerCase()}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginBottom:2}}>FASTING STATUS</div>
                        <select value={resExtra.fastingStatus} onChange={e=>setResExtra((x:any)=>({...x,fastingStatus:e.target.value}))} style={{width:"100%",fontSize:10,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 6px",color:"#334155",background:"#fff"}}>
                          <option value="">Unknown</option><option value="FASTING">Fasting</option><option value="NON_FASTING">Non-Fasting</option><option value="RANDOM">Random</option><option value="POST_PRANDIAL">Post-Prandial</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Test Results ── */}
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#7c3aed",textTransform:"uppercase" as any,letterSpacing:".06em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}><FlaskConical size={12} color="#7c3aed"/>Test Results ({resItems.length} test{resItems.length!==1?"s":""})</div>
                  {resItems.length===0&&<div style={{textAlign:"center" as any,padding:"20px",color:"#94a3b8",fontSize:12,background:"#f8fafc",borderRadius:10,border:"1px dashed #e2e8f0"}}>No test items found for this order.</div>}
                  {resItems.map((item,idx)=>{
                    const isC=item.isCritical,isA=item.isAbnormal&&!item.isCritical;
                    const flagC=isC?"#ef4444":isA?"#f59e0b":"#10b981";
                    const flagBg=isC?"#fff5f5":isA?"#fffbeb":"#f0fdf4";
                    const flagBd=isC?"#fca5a5":isA?"#fde68a":"#a7f3d0";
                    const flagL=isC?"CRITICAL":isA?"ABNORMAL":"NORMAL";
                    return(
                    <div key={item.id} style={{marginBottom:10,padding:"12px 14px",background:isC?"#fff5f5":isA?"#fffbeb":"#f8fafc",borderRadius:10,border:`1.5px solid ${isC?"#fca5a5":isA?"#fde68a":"#e2e8f0"}`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:flagC,flexShrink:0}}/>
                          <div style={{fontWeight:800,fontSize:12,color:"#1e293b"}}>{item.testName}</div>
                          {item.testCode&&<code style={{fontSize:9,color:"#94a3b8",background:"#f1f5f9",padding:"1px 5px",borderRadius:3}}>{item.testCode}</code>}
                        </div>
                        <span style={{fontSize:9,fontWeight:800,padding:"2px 10px",borderRadius:20,background:flagBg,color:flagC,border:`1px solid ${flagBd}`}}>{flagL}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 0.8fr 1.5fr",gap:8,alignItems:"end",marginBottom:8}}>
                        <div>
                          <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>RESULT VALUE *{item.normalRange&&<span style={{fontWeight:400,color:"#94a3b8"}}> (ref: {item.normalRange})</span>}</div>
                          <div style={{display:"flex",gap:3}}>
                            <input value={item.result} onChange={e=>{const u=[...resItems];u[idx]={...item,result:e.target.value};setResItems(u);}} placeholder="Enter value…" style={{flex:1,fontSize:12,fontWeight:700,border:`1.5px solid ${isC?"#fca5a5":isA?"#fde68a":"#d1d5db"}`,borderRadius:6,padding:"5px 9px",outline:"none",background:"#fff",color:"#1e293b"}}/>
                            {item.normalRange&&<button title="Auto-fill midpoint of reference range" onClick={()=>{const r=item.normalRange;let s="";if(/negative/i.test(r))s="Negative";else if(/absent/i.test(r))s="Absent";else{const m=r.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);if(m)s=((parseFloat(m[1])+parseFloat(m[2]))/2).toFixed(1);}if(s){const u=[...resItems];u[idx]={...item,result:s};setResItems(u);}}} style={{width:28,height:34,borderRadius:6,border:"1px solid #a7f3d0",background:"#f0fdf4",color:A,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>⚡</button>}
                            <button title={listenIdx===idx&&isListening?"Stop voice input (click to stop)":"Speak result value (voice input)"} onClick={()=>{if(listenIdx===idx&&isListening)stopVoice();else startVoice(idx);}} style={{width:28,height:34,borderRadius:6,border:`1px solid ${listenIdx===idx&&isListening?"#fca5a5":"#bfdbfe"}`,background:listenIdx===idx&&isListening?"#fff5f5":"#eff6ff",color:listenIdx===idx&&isListening?"#ef4444":"#2563eb",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,animation:listenIdx===idx&&isListening?"pulse 1s ease-in-out infinite":""}}>{listenIdx===idx&&isListening?<MicOff size={12}/>:<Mic size={12}/>}</button>
                          </div>
                        </div>
                        <div>
                          <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>UNIT</div>
                          <input value={item.unit} onChange={e=>{const u=[...resItems];u[idx]={...item,unit:e.target.value};setResItems(u);}} placeholder="mg/dL" style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",outline:"none",background:"#fff",color:"#334155"}}/>
                        </div>
                        <div>
                          <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>REFERENCE RANGE</div>
                          <input value={item.normalRange} readOnly style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",background:"#f1f5f9",color:"#94a3b8"}}/>
                        </div>
                        <div>
                          <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:5}}>FLAG</div>
                          <div style={{display:"flex",flexDirection:"column" as any,gap:3}}>
                            <label style={{display:"flex",alignItems:"center",gap:4,fontSize:9,fontWeight:700,color:"#f59e0b",cursor:"pointer"}}><input type="checkbox" checked={item.isAbnormal&&!item.isCritical} onChange={e=>{const u=[...resItems];u[idx]={...item,isAbnormal:e.target.checked,isCritical:e.target.checked?false:item.isCritical};setResItems(u);}}/> ABNORMAL</label>
                            <label style={{display:"flex",alignItems:"center",gap:4,fontSize:9,fontWeight:700,color:"#ef4444",cursor:"pointer"}}><input type="checkbox" checked={item.isCritical} onChange={e=>{const u=[...resItems];u[idx]={...item,isCritical:e.target.checked,isAbnormal:e.target.checked?true:item.isAbnormal};setResItems(u);}}/> CRITICAL</label>
                          </div>
                        </div>
                        <div>
                          <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>COMMENTS / REMARKS</div>
                          <input value={item.notes} onChange={e=>{const u=[...resItems];u[idx]={...item,notes:e.target.value};setResItems(u);}} placeholder="Optional remarks for this test" style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",outline:"none",background:"#fff",color:"#334155"}}/>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <div>
                          <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>METHOD / INSTRUMENT / ANALYSER</div>
                          <input value={item.method||""} onChange={e=>{const u=[...resItems];u[idx]={...item,method:e.target.value};setResItems(u);}} placeholder="e.g. Spectrophotometry, ELISA, PCR, Auto-analyser" style={{width:"100%",fontSize:10,border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 9px",outline:"none",background:"#fff",color:"#334155"}}/>
                        </div>
                        <div>
                          <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>ENTERED BY (TECHNICIAN)</div>
                          <input value={item.enteredBy} onChange={e=>{const u=[...resItems];u[idx]={...item,enteredBy:e.target.value};setResItems(u);}} placeholder="Lab technician name" style={{width:"100%",fontSize:10,border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 9px",outline:"none",background:"#fff",color:"#334155"}}/>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* ── Critical Alert Banner ── */}
                {resItems.some(i=>i.isCritical)&&(
                  <div style={{background:"linear-gradient(135deg,#fff5f5,#fef2f2)",border:"2px solid #fca5a5",borderRadius:10,padding:"11px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:34,height:34,borderRadius:8,background:"#ef4444",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><AlertTriangle size={15}/></div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:800,color:"#b91c1c"}}>⚠ CRITICAL VALUES DETECTED — Notify Attending Physician Immediately</div>
                      <div style={{fontSize:10,color:"#ef4444",marginTop:3}}>{resItems.filter(i=>i.isCritical).map(i=>`${i.testName}: ${i.result||"—"} ${i.unit||""}`).join("  ·  ")}</div>
                    </div>
                  </div>
                )}

                {/* ── Section 3: Interpretation & Pathologist Remarks ── */}
                <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#7c3aed",textTransform:"uppercase" as any,letterSpacing:".06em",marginBottom:10,display:"flex",alignItems:"center",gap:5}}><span style={{width:5,height:14,borderRadius:2,background:"#7c3aed",display:"inline-block"}}/>Interpretation & Pathologist Remarks</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>PATHOLOGIST REMARKS / MACRO DESCRIPTION</div>
                      <textarea value={resExtra.pathRemarks} onChange={e=>setResExtra((x:any)=>({...x,pathRemarks:e.target.value}))} placeholder="Enter pathologist remarks, macroscopic description, or gross findings…" rows={3} style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:7,padding:"6px 10px",outline:"none",resize:"vertical" as any,fontFamily:"inherit",color:"#334155",background:"#fff"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>CLINICAL INTERPRETATION</div>
                      <textarea value={resExtra.interpretation} onChange={e=>setResExtra((x:any)=>({...x,interpretation:e.target.value}))} placeholder="Clinical interpretation of test results in context of patient's condition…" rows={3} style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:7,padding:"6px 10px",outline:"none",resize:"vertical" as any,fontFamily:"inherit",color:"#334155",background:"#fff"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>IMPRESSION / SUMMARY</div>
                      <textarea value={resExtra.impression} onChange={e=>setResExtra((x:any)=>({...x,impression:e.target.value}))} placeholder="Overall impression, diagnosis suggestion, or summary…" rows={2} style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:7,padding:"6px 10px",outline:"none",resize:"vertical" as any,fontFamily:"inherit",color:"#334155",background:"#fff"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>RECOMMENDATIONS</div>
                      <textarea value={resExtra.recommendation} onChange={e=>setResExtra((x:any)=>({...x,recommendation:e.target.value}))} placeholder="Recommended follow-up tests, repeat intervals, or clinical actions…" rows={2} style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:7,padding:"6px 10px",outline:"none",resize:"vertical" as any,fontFamily:"inherit",color:"#334155",background:"#fff"}}/>
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Authorization & Verification ── */}
                <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#7c3aed",textTransform:"uppercase" as any,letterSpacing:".06em",marginBottom:10,display:"flex",alignItems:"center",gap:5}}><ShieldCheck size={12} color="#7c3aed"/>Authorization & Verification</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:10}}>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>VERIFIED / AUTHORIZED BY</div>
                      <input value={resExtra.verifiedBy} onChange={e=>setResExtra((x:any)=>({...x,verifiedBy:e.target.value}))} placeholder="Pathologist / HOD name" style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",outline:"none",background:"#fff",color:"#334155"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>QUALIFICATION / DESIGNATION</div>
                      <input value={resExtra.qualification} onChange={e=>setResExtra((x:any)=>({...x,qualification:e.target.value}))} placeholder="e.g. MD (Path), MBBS, DCP" style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",outline:"none",background:"#fff",color:"#334155"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>APPROVED BY (SENIOR)</div>
                      <input value={resExtra.approvedBy} onChange={e=>setResExtra((x:any)=>({...x,approvedBy:e.target.value}))} placeholder="Consultant pathologist / HOD" style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",outline:"none",background:"#fff",color:"#334155"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>REPORTED AT</div>
                      <input type="datetime-local" value={resExtra.reportedAt} onChange={e=>setResExtra((x:any)=>({...x,reportedAt:e.target.value}))} style={{width:"100%",fontSize:10,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",background:"#fff",color:"#334155",outline:"none"}}/>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>REPORT VERSION</div>
                      <select value={resExtra.reportVersion} onChange={e=>setResExtra((x:any)=>({...x,reportVersion:e.target.value}))} style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",background:"#fff",color:"#334155"}}>
                        <option value="ORIGINAL">Original</option><option value="PRELIMINARY">Preliminary</option><option value="AMENDED">Amended</option><option value="CORRECTED">Corrected</option><option value="FINAL">Final</option>
                      </select>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>AMENDMENT / CORRECTION NOTES</div>
                      <input value={resExtra.amendmentNotes} onChange={e=>setResExtra((x:any)=>({...x,amendmentNotes:e.target.value}))} placeholder="Reason for amendment or correction, if any" style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",outline:"none",background:"#fff",color:"#334155"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>DELIVERY MODE</div>
                      <select value={resExtra.deliveryMode} onChange={e=>setResExtra((x:any)=>({...x,deliveryMode:e.target.value}))} style={{width:"100%",fontSize:11,border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 9px",background:"#fff",color:"#334155"}}>
                        <option value="PRINT">Print</option><option value="EMAIL">Email</option><option value="BOTH">Print + Email</option><option value="PORTAL">Patient Portal</option><option value="COUNTER">Counter Pickup</option><option value="COURIER">Courier</option>
                      </select>
                    </div>
                  </div>
                </div>

                {resMsg&&<div style={{color:"#ef4444",fontSize:11,marginBottom:10,padding:"7px 12px",background:"#fff5f5",borderRadius:7,border:"1px solid #fecaca"}}>{resMsg}</div>}
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #f1f5f9",paddingTop:12}}>
                  <Btn onClick={()=>setResOrder(null)} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}>Cancel</Btn>
                  <Btn onClick={saveRes} disabled={resSav} style={{background:resSav?"#94a3b8":"#7c3aed",color:"#fff",borderColor:"#7c3aed"}}>{resSav?<><Loader2 size={12} className="spin"/>Saving…</>:<><Save size={12}/>Save Results</>}</Btn>
                </div>
              </div>
            </div>
          )}

          {!resOrder&&<>
          {/* ── Stats Bar ── */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
            {([{l:"Total Awaiting",v:resCand.length,bg:"#f8fafc",c:"#475569",k:""},{l:"Sample Collected",v:cntSC,bg:"#faf5ff",c:"#7c3aed",k:"SAMPLE_COLLECTED"},{l:"In Process",v:cntIP,bg:"#fff7ed",c:"#b45309",k:"IN_PROCESS"},{l:"Results Entered",v:cntRE,bg:"#f0fdf4",c:"#15803d",k:"RESULT_ENTERED"}] as any[]).map((k:any)=>(
              <div key={k.l} onClick={()=>setResFilter(k.k)} style={{background:k.bg,borderRadius:10,padding:"10px 14px",border:`1.5px solid ${resFilter===k.k?"#7c3aed":"#e2e8f0"}`,cursor:"pointer"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as any,letterSpacing:".05em"}}>{k.l}</div>
                <div style={{fontSize:20,fontWeight:800,color:k.c,lineHeight:1.2,marginTop:2}}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap" as any}}>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:9,padding:"6px 12px",flex:1,minWidth:200}}>
              <Eye size={12} color="#94a3b8"/>
              <input style={{background:"none",border:"none",outline:"none",fontSize:12,color:"#334155",width:"100%"}} placeholder="Search by order no, patient, UHID, doctor…" value={resSearch} onChange={e=>setResSearch(e.target.value)}/>
              {resSearch&&<button onClick={()=>setResSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={11} color="#94a3b8"/></button>}
            </div>
            <div style={{display:"flex",gap:5}}>
              {(["","SAMPLE_COLLECTED","IN_PROCESS","RESULT_ENTERED"] as const).map((f:any)=>(
                <button key={f} onClick={()=>setResFilter(f)} style={{padding:"5px 11px",borderRadius:20,border:`1.5px solid ${resFilter===f?"#7c3aed":"#e2e8f0"}`,background:resFilter===f?"#faf5ff":"#fff",color:resFilter===f?"#7c3aed":"#64748b",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                  {!f?"All":f.split("_").map((w:string)=>w.charAt(0)+w.slice(1).toLowerCase()).join(" ")}
                </button>
              ))}
            </div>
            <div style={{position:"relative"}}>
              <button onClick={()=>setResSortOpen((o:boolean)=>!o)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <ArrowRight size={11} style={{transform:"rotate(-45deg)"}}/>
                {[{v:"newest",l:"Newest"},{v:"oldest",l:"Oldest"},{v:"name_asc",l:"Name A-Z"},{v:"name_desc",l:"Name Z-A"}].find(o=>o.v===resSort)?.l||"Sort"}<ChevronDown size={10}/>
              </button>
              {resSortOpen&&(<>
                <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setResSortOpen(false)}/>
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:70,minWidth:160,overflow:"hidden"}}>
                  {[{v:"newest",l:"Newest First"},{v:"oldest",l:"Oldest First"},{v:"name_asc",l:"Name A–Z"},{v:"name_desc",l:"Name Z–A"}].map(opt=>(
                    <button key={opt.v} onClick={()=>{setResSort(opt.v);setResSortOpen(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 14px",background:resSort===opt.v?"#faf5ff":"transparent",border:"none",cursor:"pointer",fontSize:12,color:resSort===opt.v?"#7c3aed":"#475569",fontWeight:resSort===opt.v?700:400}}>
                      {opt.l}{resSort===opt.v&&<CheckCircle2 size={12} color="#7c3aed"/>}
                    </button>
                  ))}
                </div>
              </>)}
            </div>
            <button onClick={()=>ldOrders()} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:11,cursor:"pointer"}}><RefreshCw size={11} className={oL?"spin":""}/></button>
            {(resSearch||resFilter)&&<button onClick={()=>{setResSearch("");setResFilter("");}} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #fecaca",background:"#fff5f5",color:"#ef4444",fontSize:11,fontWeight:600,cursor:"pointer"}}><X size={11}/>Clear</button>}
          </div>

          {/* ── Table ── */}
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"#f8fafc"}}>
                  {["Order No","Patient","Tests / Panels","Barcode","Specimen","Priority","Status","Date","Actions"].map(h=>(
                    <th key={h} style={{textAlign:"left",fontSize:10,fontWeight:700,color:"#94a3b8",padding:"9px 12px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap" as any,letterSpacing:".04em"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {oL?(<tr><td colSpan={9} style={{textAlign:"center" as any,padding:32,color:"#94a3b8"}}><Loader2 size={16} className="spin" style={{display:"inline"}}/></td></tr>)
                  :filtRes.length===0?(<tr><td colSpan={9} style={{textAlign:"center" as any,padding:40,color:"#94a3b8",fontSize:12}}>{resCand.length===0?"No orders pending result entry.":"No orders match your search."}</td></tr>)
                  :filtRes.map((o:any)=>{
                    const st=OS[o.status]||OS.PENDING;const p=PR[o.priority]||PR.ROUTINE;const hc=o.items?.some((i:any)=>i.isCritical);const isActive=resOrder?.id===o.id;
                    return(<tr key={o.id} style={{borderBottom:"1px solid #f8fafc",background:isActive?"#faf5ff":"transparent"}} onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="#fafbfc";}} onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background=isActive?"#faf5ff":"transparent";}}>
                      <td style={{padding:"10px 12px",fontWeight:700,color:"#7c3aed",fontSize:11,whiteSpace:"nowrap" as any}}>{o.orderNo}{hc&&<span className="crit" style={{marginLeft:4}}>CRIT</span>}{isActive&&<span style={{marginLeft:4,fontSize:8,fontWeight:700,background:"#7c3aed",color:"#fff",borderRadius:10,padding:"1px 6px"}}>ACTIVE</span>}</td>
                      <td style={{padding:"10px 12px"}}>
                        <div style={{fontWeight:700,fontSize:12,color:"#1e293b"}}>{o.patient?.name||"—"}</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>{o.patient?.patientId||""}</div>
                        {o.patient?.phone&&<div style={{fontSize:10,color:"#94a3b8"}}>{o.patient.phone}</div>}
                      </td>
                      <td style={{padding:"10px 12px",maxWidth:140,fontSize:10,color:"#475569"}}>
                        {(o.items||[]).slice(0,2).map((i:any)=>i.test?.name||i.panel?.name).filter(Boolean).join(", ")||"—"}
                        {(o.items||[]).length>2&&<span style={{color:"#94a3b8"}}> +{(o.items.length-2)}</span>}
                      </td>
                      <td style={{padding:"10px 12px"}}>{o.sample?.barcodeId?<code style={{fontSize:9,fontWeight:700,color:"#1e293b",background:"#f8fafc",padding:"2px 6px",borderRadius:3,border:"1px solid #e2e8f0"}}>{o.sample.barcodeId}</code>:<span style={{fontSize:9,color:"#ef4444"}}>No Sample</span>}</td>
                      <td style={{padding:"10px 12px"}}><span style={{fontSize:9,color:"#64748b",background:"#f1f5f9",padding:"2px 8px",borderRadius:5}}>{o.sample?.specimenType||"—"}</span></td>
                      <td style={{padding:"10px 12px"}}><span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:p.bg,color:p.c,border:`1px solid ${p.bd}`}}>{p.label}</span></td>
                      <td style={{padding:"10px 12px"}}><span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:st.bg,color:st.c,border:`1px solid ${st.bd}`}}>{st.label}</span></td>
                      <td style={{padding:"10px 12px",fontSize:10,color:"#64748b",whiteSpace:"nowrap" as any}}>{fd(o.createdAt)}</td>
                      <td style={{padding:"10px 12px"}}>
                        {(()=>{
                          const AB=({title,onClick,bg,col,disabled,children}:any)=>(
                            <button title={title} onClick={onClick} disabled={disabled} style={{width:32,height:32,borderRadius:8,border:"1px solid",borderColor:bg==="red"?"#fecaca":bg==="blue"?"#bfdbfe":bg==="purple"?"#e9d5ff":bg==="orange"?"#fed7aa":"#e2e8f0",background:bg==="red"?"#fff5f5":bg==="blue"?"#eff6ff":bg==="purple"?"#faf5ff":bg==="orange"?"#fff7ed":"#f8fafc",color:col||"#475569",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .12s"}}
                              onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity="0.8";}} onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>
                              {children}
                            </button>
                          );
                          return(<div style={{display:"flex",gap:4}}>
                            {["SAMPLE_COLLECTED","IN_PROCESS"].includes(o.status)&&<AB title="Enter Results" onClick={()=>openRes(o)} bg="purple" col="#7c3aed"><Edit2 size={13}/></AB>}
                            {o.status==="RESULT_ENTERED"&&<AB title="Generate Report" onClick={()=>genRep(o.id)} disabled={rActL} bg="green" col="#15803d"><FileText size={13}/></AB>}
                            <AB title="Download Draft PDF" onClick={()=>printReport({order:o,status:"DRAFT",generatedAt:new Date()})} bg="blue" col="#2563eb"><Download size={13}/></AB>
                            <AB title="View Order" onClick={()=>setVOrd(o)} bg="green" col={A}><Eye size={13}/></AB>
                          </div>);
                        })()}
                      </td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderTop:"1px solid #f1f5f9",fontSize:11,color:"#94a3b8"}}>
              <span>Showing {filtRes.length} of {resCand.length} orders</span>
              <span>{cntSC} collected · {cntIP} in process · {cntRE} results entered</span>
            </div>
          </div>
          </>}
          </>);
        })()}

        {/* REPORTS */}
        {tab==="reports"&&(()=>{
          const RS:any={DRAFT:{bg:"#fff1f2",c:"#be123c",bd:"#fecdd3",label:"Draft"},VERIFIED:{bg:"#ecfdf5",c:"#047857",bd:"#a7f3d0",label:"Verified"},DELIVERED:{bg:"#f0fdf4",c:"#065f46",bd:"#6ee7b7",label:"Delivered"}};
          const filtRep=reports.filter((r:any)=>{
            if(repFilter&&r.status!==repFilter)return false;
            if(repSearch){const q=repSearch.toLowerCase();if(!(r.order?.orderNo?.toLowerCase().includes(q)||r.order?.patient?.name?.toLowerCase().includes(q)||r.order?.patient?.patientId?.toLowerCase().includes(q)||r.verifiedBy?.toLowerCase().includes(q)))return false;}
            return true;
          }).sort((a:any,b:any)=>{
            if(repSort==="oldest")return new Date(a.generatedAt).getTime()-new Date(b.generatedAt).getTime();
            if(repSort==="name_asc")return(a.order?.patient?.name||"").localeCompare(b.order?.patient?.name||"");
            if(repSort==="name_desc")return(b.order?.patient?.name||"").localeCompare(a.order?.patient?.name||"");
            return new Date(b.generatedAt||0).getTime()-new Date(a.generatedAt||0).getTime();
          });
          const draft=reports.filter((r:any)=>r.status==="DRAFT").length;
          const verified=reports.filter((r:any)=>r.status==="VERIFIED").length;
          const delivered=reports.filter((r:any)=>r.status==="DELIVERED").length;
          return(<>
          {/* Stats bar */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
            {[{l:"Total Reports",v:reports.length,bg:"#f8fafc",c:"#475569"},{l:"Draft",v:draft,bg:"#fff1f2",c:"#be123c"},{l:"Verified",v:verified,bg:"#ecfdf5",c:"#047857"},{l:"Delivered",v:delivered,bg:"#f0fdf4",c:"#065f46"}].map(k=>(
              <div key={k.l} onClick={()=>setRepFilter(k.l==="Total Reports"?"":k.l.toUpperCase())} style={{background:k.bg,borderRadius:10,padding:"10px 14px",border:`1.5px solid ${repFilter===(k.l==="Total Reports"?"":k.l.toUpperCase())?"#047857":"#e2e8f0"}`,cursor:"pointer"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase" as any,letterSpacing:".05em"}}>{k.l}</div>
                <div style={{fontSize:20,fontWeight:800,color:k.c,lineHeight:1.2,marginTop:2}}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Generate Reports queue */}
          {orders.filter((o:any)=>o.status==="RESULT_ENTERED").length>0&&<div className="card" style={{marginBottom:12}}>
            <div className="chd"><span className="ct"><FileText size={12} color="#7c3aed"/>Ready to Generate ({orders.filter((o:any)=>o.status==="RESULT_ENTERED").length})</span></div>
            <table className="pt"><thead><tr><th>Order No</th><th>Patient</th><th>Doctor</th><th>Tests</th><th>Action</th></tr></thead><tbody>
              {orders.filter((o:any)=>o.status==="RESULT_ENTERED").map((o:any)=>(<tr key={o.id}>
                <td style={{fontWeight:700,color:A,fontSize:10}}>{o.orderNo}</td>
                <td><div style={{fontWeight:600,color:"#1e293b",fontSize:11}}>{o.patient?.name||"—"}</div><div style={{fontSize:9,color:"#94a3b8"}}>{o.patient?.patientId}</div></td>
                <td style={{fontSize:10,color:"#64748b"}}>Dr. {o.doctor?.name||"—"}</td>
                <td style={{fontSize:10,color:"#475569",maxWidth:140}}>{(o.items||[]).slice(0,3).map((i:any)=>i.test?.name||i.panel?.name).filter(Boolean).join(", ")||"—"}{(o.items||[]).length>3&&<span style={{color:"#94a3b8"}}> +{(o.items||[]).length-3}</span>}</td>
                <td><Btn onClick={()=>genRep(o.id)} disabled={rActL} style={{background:"#f0fdf4",color:"#15803d",borderColor:"#bbf7d0"}}>{rActL?<Loader2 size={9} className="spin"/>:<FileText size={9}/>}Generate</Btn></td>
              </tr>))}
            </tbody></table>
          </div>}

          {/* Toolbar */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap" as any}}>
            {/* Search */}
            <div style={{display:"flex",alignItems:"center",gap:6,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:9,padding:"6px 12px",flex:1,minWidth:200}}>
              <Eye size={12} color="#94a3b8"/>
              <input style={{background:"none",border:"none",outline:"none",fontSize:12,color:"#334155",width:"100%"}} placeholder="Search by order no, patient, UHID…" value={repSearch} onChange={(e:any)=>setRepSearch(e.target.value)}/>
              {repSearch&&<button onClick={()=>setRepSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={11} color="#94a3b8"/></button>}
            </div>
            {/* Filter pills */}
            <div style={{display:"flex",gap:5}}>
              {(["","DRAFT","VERIFIED","DELIVERED"] as const).map((f:any)=>(
                <button key={f} onClick={()=>setRepFilter(f)} style={{padding:"5px 11px",borderRadius:20,border:`1.5px solid ${repFilter===f?A:"#e2e8f0"}`,background:repFilter===f?L:"#fff",color:repFilter===f?A:"#64748b",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                  {!f?"All":f.charAt(0)+f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {/* Sort */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setRepSortOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <ArrowRight size={11} style={{transform:"rotate(-45deg)"}}/>
                {[{v:"newest",l:"Newest"},{v:"oldest",l:"Oldest"},{v:"name_asc",l:"Name A-Z"},{v:"name_desc",l:"Name Z-A"}].find(o=>o.v===repSort)?.l||"Sort"}<ChevronDown size={10}/>
              </button>
              {repSortOpen&&(<>
                <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setRepSortOpen(false)}/>
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:70,minWidth:160,overflow:"hidden"}}>
                  {[{v:"newest",l:"Newest First"},{v:"oldest",l:"Oldest First"},{v:"name_asc",l:"Name A–Z"},{v:"name_desc",l:"Name Z–A"}].map(opt=>(
                    <button key={opt.v} onClick={()=>{setRepSort(opt.v);setRepSortOpen(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"8px 14px",background:repSort===opt.v?L:"transparent",border:"none",cursor:"pointer",fontSize:12,color:repSort===opt.v?A:"#475569",fontWeight:repSort===opt.v?700:400}}>
                      {opt.l}{repSort===opt.v&&<CheckCircle2 size={12} color={A}/>}
                    </button>
                  ))}
                </div>
              </>)}
            </div>
            {/* Export */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setRepExportOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                <Download size={12}/> Export <ChevronDown size={10}/>
              </button>
              {repExportOpen&&(<>
                <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setRepExportOpen(false)}/>
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:70,minWidth:178,padding:5}}>
                  {[
                    {label:"Export as PDF",   icon:<FileText size={13}/>,        bg:"#fff5f5",col:"#ef4444",fn:repExportPDF},
                    {label:"Export as Excel",  icon:<FileSpreadsheet size={13}/>, bg:"#f0fdf4",col:"#16a34a",fn:repExportExcel},
                    {label:"Export as Word",   icon:<FileType size={13}/>,        bg:"#eff6ff",col:"#2563eb",fn:repExportWord},
                  ].map(({label,icon,bg,col,fn})=>(
                    <button key={label} onClick={fn} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:7,border:"none",background:"none",width:"100%",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:500,textAlign:"left" as any}}
                      onMouseEnter={e=>{e.currentTarget.style.background="#f1f5f9";}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
                      <span style={{width:22,height:22,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",background:bg,color:col,flexShrink:0}}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </>)}
            </div>
            {/* Refresh / Clear */}
            <button onClick={()=>{ldReports();ldOrders();}} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:11,cursor:"pointer"}}><RefreshCw size={11} className={rL?"spin":""}/></button>
            {(repSearch||repFilter)&&<button onClick={()=>{setRepSearch("");setRepFilter("");}} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,border:"1px solid #fecaca",background:"#fff5f5",color:"#ef4444",fontSize:11,fontWeight:600,cursor:"pointer"}}><X size={11}/>Clear</button>}
          </div>

          {/* Table */}
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"#f8fafc"}}>
                  {["Order No","Patient","Tests","Doctor","Status","Generated","Verified By","Delivery","Actions"].map(h=>(
                    <th key={h} style={{textAlign:"left",fontSize:10,fontWeight:700,color:"#94a3b8",padding:"9px 12px",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap" as any,letterSpacing:".04em"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {rL?(<tr><td colSpan={9} style={{textAlign:"center" as any,padding:32,color:"#94a3b8"}}><Loader2 size={16} className="spin" style={{display:"inline"}}/></td></tr>)
                  :filtRep.length===0?(<tr><td colSpan={9} style={{textAlign:"center" as any,padding:40,color:"#94a3b8",fontSize:12}}>{reports.length===0?"No reports generated yet.":"No reports match your search."}</td></tr>)
                  :filtRep.map((r:any)=>{
                    const sb=RS[r.status]||RS.DRAFT;
                    return(<tr key={r.id} style={{borderBottom:"1px solid #f8fafc"}} onMouseEnter={e=>{e.currentTarget.style.background="#fafbfc";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                      <td style={{padding:"10px 12px",fontWeight:700,color:A,fontSize:11,whiteSpace:"nowrap" as any}}>{r.order?.orderNo||"—"}</td>
                      <td style={{padding:"10px 12px"}}>
                        <div style={{fontWeight:700,fontSize:12,color:"#1e293b"}}>{r.order?.patient?.name||"—"}</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>{r.order?.patient?.patientId||""}</div>
                        {r.order?.patient?.phone&&<div style={{fontSize:10,color:"#94a3b8"}}>{r.order.patient.phone}</div>}
                      </td>
                      <td style={{padding:"10px 12px",maxWidth:130,fontSize:10,color:"#475569"}}>
                        {(r.order?.items||[]).slice(0,2).map((i:any)=>i.test?.name||i.panel?.name).filter(Boolean).join(", ")||"—"}
                        {(r.order?.items||[]).length>2&&<span style={{color:"#94a3b8"}}> +{(r.order.items.length-2)}</span>}
                      </td>
                      <td style={{padding:"10px 12px",fontSize:10,color:"#475569",whiteSpace:"nowrap" as any}}>Dr. {r.order?.doctor?.name||"—"}</td>
                      <td style={{padding:"10px 12px"}}><span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,background:sb.bg,color:sb.c,border:`1px solid ${sb.bd}`}}>{sb.label}</span></td>
                      <td style={{padding:"10px 12px",fontSize:10,color:"#64748b",whiteSpace:"nowrap" as any}}>{r.generatedAt?new Date(r.generatedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}</td>
                      <td style={{padding:"10px 12px",fontSize:10,color:"#64748b"}}>{r.verifiedBy||<span style={{color:"#cbd5e1"}}>—</span>}</td>
                      <td style={{padding:"10px 12px",fontSize:10,color:"#64748b"}}>{r.deliveryMethod||<span style={{color:"#cbd5e1"}}>—</span>}</td>
                      <td style={{padding:"10px 12px"}}>
                        {(()=>{
                          const AB=({title,onClick,bg,col,disabled,children}:any)=>(
                            <button title={title} onClick={onClick} disabled={disabled} style={{width:32,height:32,borderRadius:8,border:"1px solid",borderColor:bg==="red"?"#fecaca":bg==="blue"?"#bfdbfe":bg==="purple"?"#e9d5ff":bg==="orange"?"#fed7aa":"#e2e8f0",background:bg==="red"?"#fff5f5":bg==="blue"?"#eff6ff":bg==="purple"?"#faf5ff":bg==="orange"?"#fff7ed":"#f8fafc",color:col||"#475569",cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .12s"}}
                              onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity="0.8";}} onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>
                              {children}
                            </button>
                          );
                          return(<div style={{display:"flex",gap:5,alignItems:"center"}}>
                            <AB title="View full report on letterhead" bg="#green" col={A} onClick={()=>setVRep(r)}><Eye size={13}/></AB>
                            <AB title="Download PDF with letterhead" bg="#gray" col="#475569" onClick={()=>printReport(r)}><Download size={13}/></AB>
                            <AB title="Send PDF to patient email" bg="blue" col="#2563eb" disabled={rActL} onClick={()=>sendRepEmail(r)}><Send size={13}/></AB>
                            {r.status!=="DELIVERED"&&<AB title="Edit report" bg="purple" col="#7c3aed" onClick={()=>{setEditRep(r);setEditRepForm({verifiedBy:r.verifiedBy||"",notes:r.notes||""});setEditRepItems((r.order?.items||[]).map((i:any)=>({id:i.id,testName:i.test?.name||i.panel?.name||"—",result:i.result||"",unit:i.unit||i.test?.unit||"",normalRange:i.normalRange||i.test?.normalRangeText||"",isAbnormal:!!i.isAbnormal,isCritical:!!i.isCritical,notes:i.notes||"",enteredBy:i.enteredBy||""})));setEditRepMsg("");}}><Pencil size={13}/></AB>}
                            {r.status==="DRAFT"&&<AB title="Verify report" bg="orange" col="#b45309" disabled={rActL} onClick={()=>doRep(r.orderId,"verify")}><ShieldCheck size={13}/></AB>}
                            <AB title="Delete report (returns to result-entry)" bg="red" col="#ef4444" onClick={()=>setDelRep(r)}><Trash2 size={13}/></AB>
                          </div>);
                        })()}
                      </td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderTop:"1px solid #f1f5f9",fontSize:11,color:"#94a3b8"}}>
              <span>Showing {filtRep.length} of {reports.length} reports</span>
              <span>{draft} draft · {verified} verified · {delivered} delivered</span>
            </div>
          </div>
          </>);
        })()}

        {/* REVENUE / BILLING MANAGEMENT — Pathology Lab Only */}
        {tab==="revenue"&&(()=>{
          const fmtCur=(v:number)=>`₹${Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
          const rst=revSubTab;
          const stBtn=(t:"overview"|"billing-queue"|"all-bills"|"finance",label:string,Icon:any)=>(
            <button key={t} onClick={()=>setRevSubTab(t)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:`1.5px solid ${rst===t?A:"#e2e8f0"}`,background:rst===t?L:"#fff",color:rst===t?A:"#64748b",fontSize:12,fontWeight:rst===t?700:500,cursor:"pointer",transition:"all .15s"}}><Icon size={14}/>{label}</button>
          );
          return(<>
          {/* Sub-tab Navigation */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap" as any}}>
            {stBtn("overview","Overview",BarChart2)}
            {stBtn("billing-queue","Payment Queue",CreditCard)}
            {stBtn("all-bills","All Lab Bills",Receipt)}
            {stBtn("finance","Finance",TrendingUp)}
          </div>

          {/* ═══ OVERVIEW ═══ */}
          {rst==="overview"&&(<>
            {/* Hero Banner */}
            <div style={{background:GR,borderRadius:16,padding:"24px 28px",marginBottom:18,color:"#fff",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:-20,top:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
              <div style={{position:"absolute",right:60,bottom:-30,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
              <div style={{position:"relative",display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:50,height:50,borderRadius:14,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IndianRupee size={24} color="#fff"/></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase" as any,letterSpacing:".08em",opacity:.75,marginBottom:3}}>Pathology Lab</div>
                  <h2 style={{fontSize:20,fontWeight:800,marginBottom:3,lineHeight:1.2}}>Billing & Revenue Management</h2>
                  <p style={{fontSize:12,opacity:.8}}>Lab test billing, payment collection & financial overview — scoped to pathology department only</p>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  <button onClick={()=>setRevSubTab("billing-queue")} style={{background:"rgba(255,255,255,.2)",padding:"8px 16px",borderRadius:100,fontSize:12,fontWeight:700,border:"1px solid rgba(255,255,255,.3)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:6,backdropFilter:"blur(4px)"}}><CreditCard size={14}/>Collect Payment</button>
                  <button onClick={()=>setRevSubTab("all-bills")} style={{background:A,padding:"8px 16px",borderRadius:100,fontSize:12,fontWeight:700,border:"1px solid rgba(255,255,255,.3)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}><Plus size={14}/>View All Bills</button>
                </div>
              </div>
            </div>

            {/* KPI Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:18}}>
              {[
                {l:"Today's Revenue",v:fmtCur(revStats.today),Icon:IndianRupee,c:"#10b981",bg:"#f0fdf4",click:()=>setRevSubTab("all-bills")},
                {l:"Total Collected",v:fmtCur(revStats.collected),Icon:TrendingUp,c:A,bg:L,click:()=>setRevSubTab("all-bills")},
                {l:"Pending Bills",v:fmtCur(revStats.pending),Icon:Clock,c:"#b45309",bg:"#fffbeb",click:()=>setRevSubTab("billing-queue")},
                {l:"Total Billed",v:fmtCur(revStats.total),Icon:Receipt,c:"#7c3aed",bg:"#faf5ff",click:()=>setRevSubTab("all-bills")},
              ].map((s,i)=>{const SI=s.Icon;return(
                <div key={i} onClick={s.click} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=A} onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}>
                  <div style={{width:42,height:42,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><SI size={20} color={s.c}/></div>
                  <div>
                    <div style={{fontSize:20,fontWeight:800,color:"#1e293b"}}>{revL?<Loader2 size={14} className="spin" style={{display:"inline"}}/>:s.v}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{s.l}</div>
                  </div>
                </div>
              );})}
            </div>

            {/* Quick Actions — Payment Queue & Bill Management with live data */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {/* Payment Queue */}
              <div style={{background:"#fff",border:`1px solid ${B}`,borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${B}`,background:L,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:700,color:A,display:"flex",alignItems:"center",gap:6}}><CreditCard size={14} color={A}/>Payment Queue</span>
                  <button onClick={()=>setRevSubTab("billing-queue")} style={{fontSize:11,fontWeight:600,color:A,background:"#fff",border:`1px solid ${B}`,borderRadius:7,padding:"4px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>View All <ArrowRight size={11}/></button>
                </div>
                <div style={{maxHeight:260,overflowY:"auto" as any}}>
                  {(()=>{const pending=revenue.filter((b:any)=>b.status!=="PAID"&&b.status!=="CANCELLED");
                  if(revL)return<div style={{padding:"20px",textAlign:"center" as any,color:"#94a3b8",fontSize:12}}><Loader2 size={14} className="spin" style={{display:"inline",marginRight:6}}/>Loading…</div>;
                  if(!pending.length)return(<div style={{padding:"24px",textAlign:"center" as any}}>
                    <div style={{width:40,height:40,borderRadius:10,background:L,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}><Clock size={18} color={A}/></div>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>No pending payments</div>
                    <button onClick={()=>setRevSubTab("billing-queue")} style={{background:GR,color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontSize:11,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}><CreditCard size={12}/>Collect Payment</button>
                  </div>);
                  return pending.slice(0,8).map((b:any,i:number)=>{
                    const isPaid=b.status==="PAID";
                    const stC=isPaid?"#15803d":b.status==="CANCELLED"?"#94a3b8":"#b45309";
                    const stBg=isPaid?"#f0fdf4":b.status==="CANCELLED"?"#f8fafc":"#fffbeb";
                    return(<div key={b.id||i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",borderBottom:`1px solid ${B}`,gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{b.patient?.name||b.order?.patient?.name||"Patient"}</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>{b.billNo||b.order?.orderNo||"—"}</div>
                      </div>
                      <div style={{textAlign:"right" as any,flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:800,color:A}}>{fmtCur(parseFloat(b.total||b.amount||0))}</div>
                        <span style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20,background:stBg,color:stC}}>{b.status||"PENDING"}</span>
                      </div>
                    </div>);
                  });})()} 
                </div>
                {revenue.filter((b:any)=>b.status!=="PAID"&&b.status!=="CANCELLED").length>8&&(
                  <div style={{padding:"8px 14px",borderTop:`1px solid ${B}`,textAlign:"center" as any}}>
                    <button onClick={()=>setRevSubTab("billing-queue")} style={{fontSize:11,color:A,fontWeight:600,background:"none",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>View all pending <ArrowRight size={11}/></button>
                  </div>
                )}
              </div>

              {/* Bill Management */}
              <div style={{background:"#fff",border:`1px solid ${B}`,borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${B}`,background:L,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:700,color:A,display:"flex",alignItems:"center",gap:6}}><FileText size={14} color={A}/>Bill Management</span>
                  <button onClick={()=>setRevSubTab("all-bills")} style={{fontSize:11,fontWeight:600,color:A,background:"#fff",border:`1px solid ${B}`,borderRadius:7,padding:"4px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>View All <ArrowRight size={11}/></button>
                </div>
                <div style={{maxHeight:260,overflowY:"auto" as any}}>
                  {(()=>{
                  if(revL)return<div style={{padding:"20px",textAlign:"center" as any,color:"#94a3b8",fontSize:12}}><Loader2 size={14} className="spin" style={{display:"inline",marginRight:6}}/>Loading…</div>;
                  if(!revenue.length)return(<div style={{padding:"24px",textAlign:"center" as any}}>
                    <div style={{width:40,height:40,borderRadius:10,background:L,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}><FileText size={18} color={A}/></div>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>No bills yet</div>
                    <button onClick={()=>setRevSubTab("all-bills")} style={{background:GR,color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontSize:11,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}><Receipt size={12}/>View Bills</button>
                  </div>);
                  return revenue.slice(0,8).map((b:any,i:number)=>{
                    const isPaid=b.status==="PAID";
                    const stC=isPaid?"#15803d":b.status==="CANCELLED"?"#94a3b8":"#b45309";
                    const stBg=isPaid?"#f0fdf4":b.status==="CANCELLED"?"#f8fafc":"#fffbeb";
                    return(<div key={b.id||i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",borderBottom:`1px solid ${B}`,gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{b.patient?.name||b.order?.patient?.name||"Patient"}</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>{b.billNo||"—"} · {b.createdAt?new Date(b.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):""}</div>
                      </div>
                      <div style={{textAlign:"right" as any,flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:800,color:A}}>{fmtCur(parseFloat(b.total||b.amount||0))}</div>
                        <span style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20,background:stBg,color:stC}}>{b.status||"PENDING"}</span>
                      </div>
                    </div>);
                  });})()} 
                </div>
                {revenue.length>8&&(
                  <div style={{padding:"8px 14px",borderTop:`1px solid ${B}`,textAlign:"center" as any}}>
                    <button onClick={()=>setRevSubTab("all-bills")} style={{fontSize:11,color:A,fontWeight:600,background:"none",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>View all bills <ArrowRight size={11}/></button>
                  </div>
                )}
              </div>
            </div>

            {/* Refresh */}
            <div style={{display:"flex",justifyContent:"center",marginTop:16}}>
              <button onClick={()=>ldRevenue()} disabled={revL} style={{display:"flex",alignItems:"center",gap:6,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:600,color:"#64748b",cursor:revL?"not-allowed":"pointer"}}>
                <RefreshCw size={12} className={revL?"spin":""}/>
                {revL?"Loading...":"Refresh Stats"}
              </button>
            </div>
          </>)}

          {/* ═══ BILLING QUEUE — Lab scoped ═══ */}
          {rst==="billing-queue"&&<LabBillingQueue scope="lab"/>}

          {/* ═══ ALL BILLS — Lab scoped ═══ */}
          {rst==="all-bills"&&<LabBillingModule scope="lab"/>}

          {/* ═══ FINANCE — Pathology Lab scoped ═══ */}
          {rst==="finance"&&(()=>{
            const fmtCurF=(v:number)=>`₹${Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
            const filt=revenue.filter((b:any)=>{
              if(!finSearch.trim())return true;
              const q=finSearch.toLowerCase();
              return(b.patient?.name||b.order?.patient?.name||"").toLowerCase().includes(q)||(b.billNo||"").toLowerCase().includes(q)||(b.order?.orderNo||"").toLowerCase().includes(q)||(b.status||"").toLowerCase().includes(q);
            });
            const collected=revenue.filter((b:any)=>b.status==="PAID").reduce((s:number,b:any)=>s+parseFloat(b.total||b.amount||0),0);
            const pending=revenue.filter((b:any)=>b.status!=="PAID"&&b.status!=="CANCELLED").reduce((s:number,b:any)=>s+parseFloat(b.total||b.amount||0),0);
            const total=revenue.reduce((s:number,b:any)=>s+parseFloat(b.total||b.amount||0),0);
            return(<>
            {/* Header */}
            <div style={{background:GR,borderRadius:14,padding:"18px 22px",marginBottom:16,color:"#fff",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IndianRupee size={22} color="#fff"/></div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase" as any,letterSpacing:".08em",opacity:.8,marginBottom:2}}>Pathology Lab · Scoped View</div>
                <div style={{fontSize:16,fontWeight:800,lineHeight:1.2}}>Lab Financial Summary</div>
                <div style={{fontSize:11,opacity:.75,marginTop:2}}>Showing only pathology department revenue — {revenue.length} transactions</div>
              </div>
              <button onClick={()=>ldRevenue()} disabled={revL} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:9,padding:"7px 14px",fontSize:11,fontWeight:700,color:"#fff",cursor:revL?"not-allowed":"pointer",backdropFilter:"blur(4px)"}}><RefreshCw size={12} className={revL?"spin":""}/>Refresh</button>
            </div>

            {/* KPI Cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
              {[
                {l:"Total Billed",v:fmtCurF(total),c:A,bg:L,Icon:Receipt},
                {l:"Collected",v:fmtCurF(collected),c:"#15803d",bg:"#f0fdf4",Icon:CheckCircle2},
                {l:"Pending",v:fmtCurF(pending),c:"#b45309",bg:"#fffbeb",Icon:Clock},
                {l:"Today's Revenue",v:fmtCurF(revStats.today||0),c:A,bg:L,Icon:TrendingUp},
              ].map((k,i)=>{const KI=k.Icon;return(
                <div key={i} style={{background:"#fff",border:`1px solid ${B}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:38,height:38,borderRadius:10,background:k.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><KI size={18} color={k.c}/></div>
                  <div>
                    <div style={{fontSize:18,fontWeight:800,color:k.c,lineHeight:1.1}}>{revL?<Loader2 size={13} className="spin" style={{display:"inline"}}/>:k.v}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{k.l}</div>
                  </div>
                </div>
              );})}
            </div>

            {/* Revenue Transactions Table */}
            <div style={{background:"#fff",border:`1px solid ${B}`,borderRadius:14,overflow:"hidden"}}>
              {/* Toolbar */}
              <div style={{padding:"10px 14px",borderBottom:`1px solid ${B}`,background:L,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:`1px solid ${B}`,borderRadius:9,padding:"6px 12px",flex:1,maxWidth:320}}>
                  <Eye size={12} color="#94a3b8"/>
                  <input style={{background:"none",border:"none",outline:"none",fontSize:12,color:"#334155",width:"100%"}} placeholder="Search patient, bill no, order no, status…" value={finSearch} onChange={e=>setFinSearch(e.target.value)}/>
                  {finSearch&&<button onClick={()=>setFinSearch("")} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><X size={11} color="#94a3b8"/></button>}
                </div>
                <div style={{fontSize:11,color:A,fontWeight:600,background:"#fff",border:`1px solid ${B}`,borderRadius:7,padding:"4px 10px"}}>{filt.length} of {revenue.length} records</div>
              </div>
              {/* Table */}
              <div style={{overflowX:"auto" as any}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"#f8fafc"}}>
                    {["Patient","Bill No / Order No","Date","Amount","Status","Payment Method"].map(h=>(
                      <th key={h} style={{textAlign:"left" as any,fontSize:10,fontWeight:700,color:"#94a3b8",padding:"9px 12px",borderBottom:`2px solid ${B}`,whiteSpace:"nowrap" as any,letterSpacing:".04em"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {revL?<tr><td colSpan={6} style={{textAlign:"center" as any,padding:32,color:"#94a3b8",fontSize:12}}><Loader2 size={14} className="spin" style={{display:"inline",marginRight:6}}/>Loading…</td></tr>
                    :!filt.length?<tr><td colSpan={6} style={{textAlign:"center" as any,padding:40,color:"#94a3b8",fontSize:12}}>
                      <IndianRupee size={28} color={B} style={{display:"block",margin:"0 auto 8px"}}/>
                      {revenue.length===0?"No lab revenue records yet":"No records match your search"}
                    </td></tr>
                    :filt.map((b:any,i:number)=>{
                      const isPaid=b.status==="PAID";
                      const isCancelled=b.status==="CANCELLED";
                      const stC=isPaid?"#15803d":isCancelled?"#94a3b8":"#b45309";
                      const stBg=isPaid?"#f0fdf4":isCancelled?"#f8fafc":"#fffbeb";
                      const stBd=isPaid?"#a7f3d0":isCancelled?"#e2e8f0":"#fde68a";
                      const patName=b.patient?.name||b.order?.patient?.name||"—";
                      const billNo=b.billNo||"—";
                      const orderNo=b.order?.orderNo||"—";
                      const dt=b.paidAt||b.createdAt;
                      const pm=b.payments?.[0]?.method||b.paymentMode||"—";
                      return(<tr key={b.id||i} style={{borderBottom:`1px solid ${B}`}}>
                        <td style={{padding:"9px 12px"}}>
                          <div style={{fontWeight:700,fontSize:12,color:"#1e293b"}}>{patName}</div>
                          <div style={{fontSize:10,color:"#94a3b8"}}>{b.patient?.patientId||b.order?.patient?.patientId||""}</div>
                        </td>
                        <td style={{padding:"9px 12px"}}>
                          <div style={{fontWeight:700,fontSize:11,color:A}}>{billNo}</div>
                          {orderNo!=="—"&&<div style={{fontSize:10,color:"#94a3b8"}}>{orderNo}</div>}
                        </td>
                        <td style={{padding:"9px 12px",fontSize:11,color:"#64748b",whiteSpace:"nowrap" as any}}>{dt?new Date(dt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}</td>
                        <td style={{padding:"9px 12px",fontWeight:800,fontSize:13,color:A}}>{fmtCurF(parseFloat(b.total||b.amount||0))}</td>
                        <td style={{padding:"9px 12px"}}>
                          <span style={{fontSize:9,fontWeight:700,padding:"2px 9px",borderRadius:20,background:stBg,color:stC,border:`1px solid ${stBd}`}}>{b.status||"PENDING"}</span>
                        </td>
                        <td style={{padding:"9px 12px",fontSize:11,color:"#64748b"}}>{pm!=="—"?pm.replace(/_/g," "):"—"}</td>
                      </tr>);
                    })}
                  </tbody>
                </table>
              </div>
              {/* Footer */}
              {filt.length>0&&<div style={{padding:"8px 14px",borderTop:`1px solid ${B}`,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,color:"#94a3b8"}}>
                <span>Showing {filt.length} pathology lab records</span>
                <span style={{fontWeight:700,color:A}}>Total: {fmtCurF(filt.reduce((s:number,b:any)=>s+parseFloat(b.total||b.amount||0),0))}</span>
              </div>}
            </div>
            </>);
          })()}
          </>);
        })()}

        {/* TEST MASTER */}
        {tab==="tests"&&<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap" as any,gap:6}}>
            <div className="sec" style={{margin:0}}><div className="dot"/>Test Master ({tests.length})</div>
            <div style={{display:"flex",gap:5}}><Inp placeholder="Search tests…" value={srch} onChange={(e:any)=>setSrch(e.target.value)} style={{width:160,padding:"5px 9px"}}/><Btn onClick={()=>exportCSV(tests,"lab-tests.csv",[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"category",label:"Category"},{key:"specimenType",label:"Specimen"},{key:"price",label:"Price"},{key:"turnaroundHrs",label:"TAT(hrs)"},{key:"unit",label:"Unit"},{key:"normalRangeText",label:"Normal Range"}])} style={{background:"#f8fafc",color:"#64748b",borderColor:"#e2e8f0",fontSize:10}}>↓ CSV</Btn><Btn onClick={()=>{setEditT(null);setTForm(BT);setTMsg("");setShowTF(true);}} style={{background:A,color:"#fff",borderColor:A}}><Plus size={12}/>Add Test</Btn></div>
          </div>
          <div className="card"><table className="pt"><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Specimen</th><th>Normal Range</th><th>Price</th><th>TAT</th><th>Active</th><th></th></tr></thead><tbody>
            {tL?<tr><td colSpan={9} className="empty"><Loader2 size={13} className="spin" style={{verticalAlign:"middle"}}/></td></tr>:fTests.length===0?<tr><td colSpan={9} className="empty">No tests — click "Add Test"</td></tr>:fTests.map((t:any)=>(
              <tr key={t.id}>
                <td><code style={{fontSize:9,fontWeight:700,color:A,background:"#f8fafc",border:"1px solid #e2e8f0",padding:"1px 5px",borderRadius:3}}>{t.code}</code></td>
                <td style={{fontWeight:600,color:"#1e293b",fontSize:11}}>{t.name}</td>
                <td><Bdg bg="#fff" c="#475569" bd="#e2e8f0">{t.category}</Bdg></td>
                <td style={{fontSize:10,color:"#64748b"}}>{t.specimenType}</td>
                <td style={{fontSize:10,color:"#64748b"}}>{t.normalRangeText||((t.normalRangeMin!=null&&t.normalRangeMax!=null)?`${t.normalRangeMin}–${t.normalRangeMax} ${t.unit||""}`:"—")}</td>
                <td style={{fontWeight:700,color:A,fontSize:11}}>₹{t.price||0}</td>
                <td style={{fontSize:10,color:"#64748b"}}>{t.turnaroundHrs}h</td>
                <td><button onClick={()=>fetch(`/api/pathology/tests/${t.id}`,{method:"PUT",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({isActive:!t.isActive})}).then(()=>ldTests())} style={{background:"none",border:"none",cursor:"pointer",color:t.isActive?A:"#cbd5e1",padding:0}}>{t.isActive?<ToggleRight size={16}/>:<ToggleLeft size={16}/>}</button></td>
                <td><div style={{display:"flex",gap:2}}>
                  <Btn onClick={()=>{setEditT(t);setTForm({name:t.name,code:t.code,category:t.category,specimenType:t.specimenType,price:t.price,unit:t.unit||"",normalRangeMin:t.normalRangeMin??"",normalRangeMax:t.normalRangeMax??"",normalRangeText:t.normalRangeText||"",method:t.method||"",turnaroundHrs:t.turnaroundHrs,machineId:t.machineId||""});setTMsg("");setShowTF(true);}} style={{background:"#eff6ff",color:"#2563eb",borderColor:"#bfdbfe",padding:"2px 5px"}}><Edit2 size={9}/></Btn>
                  <Btn onClick={()=>setDelT({type:"test",item:t})} style={{background:"#fff5f5",color:"#ef4444",borderColor:"#fecaca",padding:"2px 5px"}}><Trash2 size={9}/></Btn>
                </div></td>
              </tr>
            ))}
          </tbody></table></div>
        </>}

        {/* PANELS */}
        {tab==="panels"&&<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><div className="sec" style={{margin:0}}><div className="dot"/>Test Panels ({panels.length})</div><Btn onClick={()=>{setEditP(null);setPForm(BP);setPMsg("");setShowPF(true);}} style={{background:A,color:"#fff",borderColor:A}}><Plus size={12}/>Add Panel</Btn></div>
          <div className="g2">
            {pL?<div className="empty" style={{gridColumn:"1/-1"}}><Loader2 size={18} className="spin"/></div>:panels.length===0?<div className="card" style={{gridColumn:"1/-1"}}><div className="empty">No panels yet — group tests (CBC, LFT, KFT, etc.)</div></div>:panels.map((p:any)=>(
              <div key={p.id} className="card">
                <div className="chd">
                  <div><span className="ct"><code style={{fontSize:9,color:A,background:"#f8fafc",border:"1px solid #e2e8f0",padding:"1px 4px",borderRadius:3,marginRight:5}}>{p.code}</code>{p.name}</span>{p.description&&<div style={{fontSize:9,color:"#94a3b8",marginTop:1}}>{p.description}</div>}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:12,fontWeight:800,color:A}}>₹{p.price||0}</span><Btn onClick={()=>{setEditP(p);setPForm({name:p.name,code:p.code,description:p.description||"",price:p.price,testIds:p.items.map((i:any)=>i.testId)});setPMsg("");setShowPF(true);}} style={{background:"#fff",color:"#2563eb",borderColor:"#e2e8f0",padding:"2px 5px"}}><Edit2 size={9}/></Btn><Btn onClick={()=>setDelT({type:"panel",item:p})} style={{background:"#fff",color:"#ef4444",borderColor:"#e2e8f0",padding:"2px 5px"}}><Trash2 size={9}/></Btn></div>
                </div>
                <div style={{padding:"8px 14px"}}>
                  {(p.items||[]).length===0?<div style={{fontSize:10,color:"#94a3b8",fontStyle:"italic"}}>No tests</div>:(p.items||[]).map((pi:any)=>(
                    <div key={pi.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f8fafc"}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:5,height:5,borderRadius:"50%",background:A}}/><span style={{fontSize:11,fontWeight:500,color:"#1e293b"}}>{pi.test?.name||"—"}</span></div>
                      <code style={{fontSize:8,color:"#64748b",background:"#f8fafc",padding:"1px 4px",borderRadius:3}}>{pi.test?.code||""}</code>
                    </div>
                  ))}
                  <div style={{marginTop:5,fontSize:9,color:"#94a3b8"}}>{(p.items||[]).length} test{(p.items||[]).length!==1?"s":""}</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ANALYTICS */}
        {tab==="analytics"&&(()=>{
          const pieData=(stats?.ordersByStatus||[]).map((s:any)=>({name:OS[s.status]?.label||s.status,value:s.count,color:OS[s.status]?.c||"#94a3b8"}));
          const barData=(stats?.ordersByPriority||[]).map((p:any)=>({name:PR[p.priority]?.label||p.priority,count:p.count,fill:PR[p.priority]?.c||"#94a3b8"}));
          const total=stats?.kpis?.totalOrders||0;

          const exportExcel=async()=>{
            try{
              const XLSX=await import("xlsx");
              const wb=XLSX.utils.book_new();
              const kpiRows=[["Metric","Value"],["Total Orders",total],["Total Revenue",`₹${(stats?.kpis?.revenueTotal||0).toLocaleString("en-IN")}`],["Tests Configured",tests.length],["Avg TAT (hrs)",stats?.kpis?.avgTat||0],["Today's Orders",stats?.kpis?.totalToday||0],["Today's Revenue",`₹${(stats?.kpis?.revenueToday||0).toLocaleString("en-IN")}`],["Pending Samples",stats?.kpis?.pendingSamples||0],["In Process",stats?.kpis?.inProcess||0],["Critical Cases",stats?.kpis?.criticalCases||0]];
              XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(kpiRows),"KPI Summary");
              const statusRows=[["Status","Count"],..."ordersByStatus" in (stats||{})?(stats.ordersByStatus||[]).map((s:any)=>[OS[s.status]?.label||s.status,s.count]):[]];
              XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(statusRows),"Status Breakdown");
              const priorityRows=[["Priority","Count"],..."ordersByPriority" in (stats||{})?(stats.ordersByPriority||[]).map((p:any)=>[PR[p.priority]?.label||p.priority,p.count]):[]];
              XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(priorityRows),"Priority Breakdown");
              XLSX.writeFile(wb,`Pathology_Analytics_${new Date().toISOString().slice(0,10)}.xlsx`);
            }catch(e){console.error(e);}
          };

          const exportPDF=async()=>{
            try{
              const{default:jsPDF}=await import("jspdf");
              const{default:autoTable}=await import("jspdf-autotable");
              const doc=new jsPDF();
              doc.setFontSize(16);doc.setFont("helvetica","bold");
              doc.text("Pathology Lab — Analytics Report",14,18);
              doc.setFontSize(10);doc.setFont("helvetica","normal");doc.setTextColor(100);
              doc.text(`Generated: ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}`,14,26);
              autoTable(doc,{startY:32,head:[["Metric","Value"]],body:[[" Total Orders",String(total)],[" Total Revenue",`₹${(stats?.kpis?.revenueTotal||0).toLocaleString("en-IN")}`],[" Tests Configured",String(tests.length)],[" Avg TAT",`${stats?.kpis?.avgTat||0} hrs`],[" Today's Orders",String(stats?.kpis?.totalToday||0)],[" Today's Revenue",`₹${(stats?.kpis?.revenueToday||0).toLocaleString("en-IN")}`],[" Pending Samples",String(stats?.kpis?.pendingSamples||0)],[" In Process",String(stats?.kpis?.inProcess||0)]],styles:{fontSize:10},headStyles:{fillColor:[4,120,87]}});
              const y1=(doc as any).lastAutoTable.finalY+10;
              autoTable(doc,{startY:y1,head:[["Status","Count"]],body:(stats?.ordersByStatus||[]).map((s:any)=>[OS[s.status]?.label||s.status,String(s.count)]),styles:{fontSize:10},headStyles:{fillColor:[4,120,87]}});
              const y2=(doc as any).lastAutoTable.finalY+10;
              autoTable(doc,{startY:y2,head:[["Priority","Count"]],body:(stats?.ordersByPriority||[]).map((p:any)=>[PR[p.priority]?.label||p.priority,String(p.count)]),styles:{fontSize:10},headStyles:{fillColor:[4,120,87]}});
              doc.save(`Pathology_Analytics_${new Date().toISOString().slice(0,10)}.pdf`);
            }catch(e){console.error(e);}
          };

          const exportWord=async()=>{
            try{
              const{Document,Paragraph,Table,TableRow,TableCell,HeadingLevel,TextRun,WidthType,Packer}=await import("docx");
              const makeRow=(cells:string[],bold=false)=>new TableRow({children:cells.map(t=>new TableCell({children:[new Paragraph({children:[new TextRun({text:t,bold,size:20})]})]}))} );
              const kpiTable=new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[makeRow(["Metric","Value"],true),makeRow(["Total Orders",String(total)]),makeRow(["Total Revenue",`₹${(stats?.kpis?.revenueTotal||0).toLocaleString("en-IN")}`]),makeRow(["Tests Configured",String(tests.length)]),makeRow(["Avg TAT",`${stats?.kpis?.avgTat||0} hrs`]),makeRow(["Today's Orders",String(stats?.kpis?.totalToday||0)]),makeRow(["Today's Revenue",`₹${(stats?.kpis?.revenueToday||0).toLocaleString("en-IN")}`]),makeRow(["Pending Samples",String(stats?.kpis?.pendingSamples||0)]),makeRow(["In Process",String(stats?.kpis?.inProcess||0)])]});
              const statusTable=new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[makeRow(["Status","Count"],true),...(stats?.ordersByStatus||[]).map((s:any)=>makeRow([OS[s.status]?.label||s.status,String(s.count)]))]});
              const priorityTable=new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[makeRow(["Priority","Count"],true),...(stats?.ordersByPriority||[]).map((p:any)=>makeRow([PR[p.priority]?.label||p.priority,String(p.count)]))]});
              const doc=new Document({sections:[{children:[new Paragraph({text:"Pathology Lab — Analytics Report",heading:HeadingLevel.HEADING_1}),new Paragraph({text:`Generated: ${new Date().toLocaleDateString("en-IN")}`,children:[new TextRun({text:`Generated: ${new Date().toLocaleDateString("en-IN")}`,color:"888888",size:18})]}),new Paragraph(""),new Paragraph({text:"KPI Summary",heading:HeadingLevel.HEADING_2}),kpiTable,new Paragraph(""),new Paragraph({text:"Order Status Breakdown",heading:HeadingLevel.HEADING_2}),statusTable,new Paragraph(""),new Paragraph({text:"Priority Breakdown",heading:HeadingLevel.HEADING_2}),priorityTable]}]});
              const blob=await Packer.toBlob(doc);
              const url=URL.createObjectURL(blob);
              const a=document.createElement("a");a.href=url;a.download=`Pathology_Analytics_${new Date().toISOString().slice(0,10)}.docx`;a.click();
              URL.revokeObjectURL(url);
            }catch(e){console.error(e);}
          };

          return(<>
            {/* Header row with export */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div className="sec" style={{marginBottom:0}}><div className="dot"/>Analytics Dashboard</div>
              <div style={{display:"flex",gap:6}}>
                <Btn onClick={()=>{ldStats();}} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0",fontSize:10}}><RefreshCw size={10} className={sL?"spin":""}/> Refresh</Btn>
                <Btn onClick={exportExcel} style={{background:"#f0fdf4",color:"#16a34a",borderColor:"#bbf7d0",fontSize:10}}><FileSpreadsheet size={10}/> Excel</Btn>
                <Btn onClick={exportPDF} style={{background:"#fff5f5",color:"#ef4444",borderColor:"#fecaca",fontSize:10}}><FileText size={10}/> PDF</Btn>
                <Btn onClick={exportWord} style={{background:"#eff6ff",color:"#2563eb",borderColor:"#bfdbfe",fontSize:10}}><FileType size={10}/> Word</Btn>
              </div>
            </div>

            {/* KPI Cards — faint borders, no shadows */}
            <div className="g4" style={{marginBottom:14}}>
              {[
                {l:"Total Orders",v:total,c:A,bg:"#fff",ic:<ClipboardList size={14}/>},
                {l:"Total Revenue",v:`₹${(stats?.kpis?.revenueTotal||0).toLocaleString("en-IN")}`,c:"#7c3aed",bg:"#fff",ic:<IndianRupee size={14}/>},
                {l:"Tests Configured",v:tests.length,c:"#2563eb",bg:"#fff",ic:<TestTube2 size={14}/>},
                {l:"Avg TAT",v:stats?.kpis?.avgTat?`${stats.kpis.avgTat}h`:"—",c:"#b45309",bg:"#fff",ic:<Clock size={14}/>},
                {l:"Today's Orders",v:stats?.kpis?.totalToday||0,c:"#0891b2",bg:"#fff",ic:<Activity size={14}/>},
                {l:"Today's Revenue",v:`₹${(stats?.kpis?.revenueToday||0).toLocaleString("en-IN")}`,c:"#047857",bg:"#fff",ic:<TrendingUp size={14}/>},
                {l:"Pending Samples",v:stats?.kpis?.pendingSamples||0,c:"#b45309",bg:"#fff",ic:<FlaskConical size={14}/>},
                {l:"Critical Cases",v:stats?.kpis?.criticalCases||0,c:"#b91c1c",bg:"#fff",ic:<AlertTriangle size={14}/>},
              ].map((k,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:11,border:"1px solid #e2e8f0",padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:9,background:"#f8fafc",border:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:k.c}}>{k.ic}</div>
                  <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textTransform:"uppercase" as any,letterSpacing:".05em"}}>{k.l}</div><div style={{fontSize:17,fontWeight:800,color:k.c,marginTop:2}}>{sL?<Loader2 size={12} className="spin"/>:k.v}</div></div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="g2" style={{marginBottom:14}}>
              {/* Status Pie Chart */}
              <div style={{background:"#fff",borderRadius:11,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                <div className="chd"><span className="ct"><Activity size={12} color={A}/>Order Status Distribution</span><span style={{fontSize:10,color:"#94a3b8"}}>{total} total</span></div>
                <div style={{padding:"14px 10px"}}>
                  {pieData.length>0?(
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" label={({name,percent}:any)=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                          {pieData.map((entry:any,i:number)=><Cell key={i} fill={entry.color}/>)}
                        </Pie>
                        <Tooltip formatter={(v:any,n:any)=>[v,n]} contentStyle={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:11}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ):<div className="empty" style={{height:220,display:"flex",alignItems:"center",justifyContent:"center"}}>No data yet</div>}
                  {pieData.length>0&&<div style={{display:"flex",flexWrap:"wrap" as any,gap:"4px 10px",padding:"0 8px",marginTop:4}}>
                    {pieData.map((d:any,i:number)=>(
                      <span key={i} style={{fontSize:10,color:"#475569",display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:d.color,display:"inline-block"}}/>  {d.name}: <b>{d.value}</b></span>
                    ))}
                  </div>}
                </div>
              </div>

              {/* Priority Bar Chart */}
              <div style={{background:"#fff",borderRadius:11,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                <div className="chd"><span className="ct"><BarChart2 size={12} color={A}/>Orders by Priority</span></div>
                <div style={{padding:"14px 10px"}}>
                  {barData.length>0?(
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData} margin={{top:4,right:8,left:-16,bottom:4}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                        <XAxis dataKey="name" tick={{fontSize:11,fill:"#64748b"}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                        <Tooltip contentStyle={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:11}} cursor={{fill:"#f8fafc"}}/>
                        <Bar dataKey="count" radius={[6,6,0,0]}>
                          {barData.map((entry:any,i:number)=><Cell key={i} fill={entry.fill}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ):<div className="empty" style={{height:220,display:"flex",alignItems:"center",justifyContent:"center"}}>No data yet</div>}
                </div>
              </div>
            </div>

            {/* Status detail table */}
            <div style={{background:"#fff",borderRadius:11,border:"1px solid #e2e8f0",overflow:"hidden",marginBottom:14}}>
              <div className="chd"><span className="ct"><BarChart2 size={12} color={A}/>Status Breakdown — Detail</span></div>
              <div style={{padding:"10px 14px"}}>
                {(stats?.ordersByStatus||[]).length>0?(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
                    {(stats.ordersByStatus||[]).map((s:any)=>{const c=OS[s.status]||OS.PENDING;const pct=Math.round((s.count/Math.max(total,1))*100);return(
                      <div key={s.status} style={{padding:"10px 12px",borderRadius:9,background:c.bg,border:`1px solid ${c.bd}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <span style={{fontSize:11,fontWeight:700,color:c.c}}>{c.label}</span>
                          <span style={{fontSize:16,fontWeight:800,color:c.c}}>{s.count}</span>
                        </div>
                        <div style={{background:"rgba(255,255,255,.6)",borderRadius:100,height:4,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:c.c,borderRadius:100,transition:"width .4s"}}/></div>
                        <div style={{fontSize:9,color:c.c,marginTop:4,fontWeight:600}}>{pct}% of total</div>
                      </div>
                    );})}
                  </div>
                ):<div className="empty">No order data yet</div>}
              </div>
            </div>
          </>);
        })()}
    </div>

    {/* Modal: New Order */}
    {showOM&&<div className="ov" onClick={()=>{setShowOM(false);setNewOrderTab(0);setPatR([]);}}>
      <div className="mo" style={{maxWidth:720,maxHeight:"94vh",display:"flex",flexDirection:"column" as any,padding:0}} onClick={(e:any)=>e.stopPropagation()}>

        {/* Header */}
        <div className="mo-hd" style={{flexShrink:0,padding:"14px 18px"}}>
          <span style={{fontSize:14,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}>
            <Plus size={14} color={A}/>New Lab Order
            {oForm.appointmentId&&<span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:L,color:A,border:`1px solid ${B}`}}>Doctor Referral</span>}
            {(tL||pL)&&<Loader2 size={12} className="spin" color="#94a3b8"/>}
          </span>
          <button onClick={()=>{setShowOM(false);setNewOrderTab(0);setPatR([]);}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",display:"flex"}}><X size={15}/></button>
        </div>

        {/* Step indicator */}
        <div style={{display:"flex",background:"#f8fafc",borderBottom:"2px solid #e2e8f0",flexShrink:0,padding:"0 18px"}}>
          {[{i:0,l:"Step 1: Patient & Tests",done:newOrderTab>0},{i:1,l:"Step 2: Billing & Notes",done:false}].map((t,idx)=>(
            <div key={t.i} style={{display:"flex",alignItems:"center",gap:6,padding:"11px 14px",cursor:newOrderTab>t.i?"pointer":"default",borderBottom:`2.5px solid ${newOrderTab===t.i?A:"transparent"}`,marginBottom:-2}} onClick={()=>newOrderTab>t.i&&setNewOrderTab(t.i)}>
              <div style={{width:20,height:20,borderRadius:"50%",background:t.done?A:newOrderTab===t.i?A:"#e2e8f0",color:t.done||newOrderTab===t.i?"#fff":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{t.done?"✓":t.i+1}</div>
              <span style={{fontSize:11,fontWeight:600,color:newOrderTab===t.i?A:"#94a3b8"}}>{t.l}</span>
              {idx===0&&<span style={{fontSize:9,color:"#94a3b8",marginLeft:2}}>→</span>}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="mo-b" style={{flex:1,overflowY:"auto" as any,padding:"16px 18px"}}>

          {/* ── TAB 0: Patient & Tests ── */}
          {newOrderTab===0&&<>

            {/* Visit Type — auto-set top banner */}
            <div style={{display:"grid",gridTemplateColumns:oForm.appointmentId?"1fr":"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <Lbl>Visit Type</Lbl>
                {oForm.appointmentId?(
                  <div style={{padding:"7px 10px",borderRadius:8,background:L,border:`1.5px solid ${B}`,fontSize:12,fontWeight:700,color:A,display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={12}/>Doctor Referral (OPD)</div>
                ):(
                  <Sel value={oForm.visitType} onChange={(e:any)=>setOForm((f:any)=>({...f,visitType:e.target.value}))}>
                    <option value="WALKIN">Walk-in</option>
                    <option value="OPD">OPD</option>
                    <option value="IPD">IPD</option>
                    <option value="EMERGENCY">Emergency</option>
                  </Sel>
                )}
              </div>
              {!oForm.appointmentId&&<div>
                <Lbl>Patient Type</Lbl>
                <Sel value={oForm.patientType} onChange={(e:any)=>setOForm((f:any)=>({...f,patientType:e.target.value}))}>
                  <option value="NEW">New Patient</option>
                  <option value="EXISTING">Existing Patient</option>
                  <option value="WALKIN">Walk-in</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="INSURANCE">Insurance</option>
                </Sel>
              </div>}
            </div>

            {/* Referred patient auto-fill card */}
            {oForm.appointmentId?(
              <div style={{background:L,border:`1.5px solid ${B}`,borderRadius:10,padding:"12px 16px",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{fontSize:11,fontWeight:800,color:A,display:"flex",alignItems:"center",gap:5}}><CheckCircle2 size={13}/>Auto-filled from Doctor Referral</span>
                  <button onClick={()=>setOForm((f:any)=>({...f,appointmentId:"",orderType:"MANUAL"}))} style={{fontSize:10,color:"#ef4444",background:"none",border:"1px solid #fecaca",borderRadius:6,padding:"2px 8px",cursor:"pointer"}}>Clear</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[{l:"Patient",v:oForm.patientName||"—"},{l:"Phone",v:oForm.phone||"—"},{l:"Gender",v:oForm.gender||"—"},{l:"DOB",v:oForm.dob||"—"},{l:"Referred by",v:oForm.referringDoctor?`Dr. ${oForm.referringDoctor}`:"—"},{l:"Department",v:oForm.referringDept||"—"}].map(r=>(
                    <div key={r.l}><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,textTransform:"uppercase" as any,letterSpacing:".04em"}}>{r.l}</div><div style={{fontSize:12,fontWeight:700,color:"#1e293b",marginTop:2}}>{r.v}</div></div>
                  ))}
                </div>
                {oForm.clinicalNotes&&<div style={{marginTop:8,fontSize:11,color:"#475569",background:"#fff",borderRadius:7,padding:"6px 10px",border:"1px solid #d1fae5"}}><b>Clinical notes:</b> {oForm.clinicalNotes}</div>}
              </div>
            ):(
              <div style={{marginBottom:14}}>
                {/* Search existing patient */}
                <Lbl>Search Patient (UHID / Name / Phone)</Lbl>
                <div style={{position:"relative",marginBottom:10}}>
                  <Inp placeholder="Type name, UHID or phone to search…" value={oForm.patientSearch}
                    onChange={(e:any)=>{const v=e.target.value;setOForm((f:any)=>{const hadPatient=!!f.patientId;return{...f,patientSearch:v,patientId:"",...(hadPatient?{patientName:"",phone:"",gender:"",age:"",dob:"",email:""}:{})};});srchPat(v);}}
                    onBlur={()=>setTimeout(()=>setPatR([]),180)}/>
                  {patR.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,.1)",zIndex:50,maxHeight:180,overflowY:"auto"}}>
                    {patR.map((p:any)=>(
                      <div key={p.id} style={{padding:"8px 14px",cursor:"pointer",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={()=>{const computedAge=p.dateOfBirth?String(Math.floor((Date.now()-new Date(p.dateOfBirth).getTime())/(365.25*24*3600*1000))):"";setOForm((f:any)=>({...f,patientId:p.id,patientSearch:`${p.name} (${p.patientId})`,patientName:p.name,phone:p.phone||"",gender:p.gender||"",age:computedAge,dob:p.dateOfBirth||"",email:p.email||"",patientType:"EXISTING"}));setPatR([]);}}>
                        <div><div style={{fontWeight:700,fontSize:12,color:"#1e293b"}}>{p.name}</div><div style={{fontSize:10,color:"#94a3b8"}}>{p.patientId} · {p.phone||"—"} · {p.gender||"—"}</div></div>
                        <span style={{fontSize:9,padding:"2px 7px",background:L,color:A,borderRadius:20,border:`1px solid ${B}`,flexShrink:0}}>EXISTING</span>
                      </div>
                    ))}
                  </div>}
                </div>
                {/* Patient details form */}
                <div style={{background:"#fafafa",borderRadius:9,border:"1px dashed #e2e8f0",padding:"10px 12px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:8}}>PATIENT DETAILS {oForm.patientId&&<span style={{color:A,marginLeft:6}}>✓ Existing patient selected</span>}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                    <div style={{gridColumn:"span 2"}}><Lbl>Full Name *</Lbl><Inp value={oForm.patientName} onChange={(e:any)=>setOForm((f:any)=>{const hadPatient=!!f.patientId&&f.patientName!==e.target.value;return{...f,patientName:e.target.value,...(hadPatient?{patientId:"",phone:"",gender:"",age:"",dob:"",email:"",patientSearch:""}:{})};})}
                      placeholder="Patient full name"/></div>
                    <div><Lbl>Mobile</Lbl><Inp value={oForm.phone} onChange={(e:any)=>setOForm((f:any)=>({...f,phone:e.target.value}))} placeholder="Phone"/></div>
                    <div><Lbl>Age</Lbl><Inp type="number" value={oForm.age} onChange={(e:any)=>setOForm((f:any)=>({...f,age:e.target.value}))} placeholder="yrs"/></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8}}>
                    <div><Lbl>Gender</Lbl><Sel value={oForm.gender} onChange={(e:any)=>setOForm((f:any)=>({...f,gender:e.target.value}))}><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></Sel></div>
                    <div><Lbl>Date of Birth</Lbl><Inp type="date" value={oForm.dob} onChange={(e:any)=>{const v=e.target.value;const a=v?String(Math.floor((Date.now()-new Date(v).getTime())/(365.25*24*3600*1000))):"";setOForm((f:any)=>({...f,dob:v,age:a}));}}/></div>
                    <div><Lbl>Email</Lbl><Inp type="email" value={oForm.email} onChange={(e:any)=>setOForm((f:any)=>({...f,email:e.target.value}))} placeholder="email@…"/></div>
                  </div>
                </div>
              </div>
            )}

            {/* Referring Doctor searchable */}
            <div style={{marginBottom:14}}>
              <Lbl>Referring Doctor (optional)</Lbl>
              {oForm.appointmentId?(
                <div style={{padding:"7px 10px",borderRadius:8,background:L,border:`1.5px solid ${B}`,fontSize:12,fontWeight:600,color:"#1e293b"}}>{oForm.referringDoctor?`Dr. ${oForm.referringDoctor}`:"—"}</div>
              ):(
                <div style={{position:"relative"}}>
                  <Inp placeholder="Search doctor name…" value={docSearch} onChange={(e:any)=>{setDocSearch(e.target.value);srchDoc(e.target.value);}}/>
                  {docR.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,.1)",zIndex:50,maxHeight:140,overflowY:"auto"}}>
                    {docR.map((d:any)=>(
                      <div key={d.id} style={{padding:"7px 12px",cursor:"pointer",borderBottom:"1px solid #f8fafc"}} onClick={()=>{setOForm((f:any)=>({...f,referringDoctor:d.name,referringDoctorId:d.id,referringDept:d.department?.name||""}));setDocSearch(`Dr. ${d.name}`);setDocR([]);}}>
                        <div style={{fontWeight:700,fontSize:12,color:"#1e293b"}}>Dr. {d.name}</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>{d.specialization||d.department?.name||"—"}</div>
                      </div>
                    ))}
                  </div>}
                  {oForm.referringDoctor&&!docR.length&&<div style={{fontSize:10,color:A,marginTop:3}}>✓ Dr. {oForm.referringDoctor} selected</div>}
                </div>
              )}
            </div>

            {/* Priority + Specimen + Date row */}
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr",gap:10,marginBottom:14,alignItems:"end"}}>
              <div>
                <Lbl>Priority *</Lbl>
                <div style={{display:"flex",gap:4}}>
                  {[{v:"ROUTINE",l:"Routine",c:"#475569"},{v:"URGENT",l:"Urgent",c:"#c2410c"},{v:"STAT",l:"STAT",c:"#b91c1c"}].map(({v,l,c})=>(
                    <button key={v} onClick={()=>setOForm((f:any)=>({...f,priority:v}))} style={{padding:"6px 10px",borderRadius:8,border:`1.5px solid ${oForm.priority===v?c:"#e2e8f0"}`,background:oForm.priority===v?PR[v].bg:"#fff",color:oForm.priority===v?c:"#94a3b8",fontSize:10,fontWeight:700,cursor:"pointer"}}>{l}</button>
                  ))}
                </div>
              </div>
              <div><Lbl>Specimen</Lbl><Sel value={oForm.specimenType} onChange={(e:any)=>setOForm((f:any)=>({...f,specimenType:e.target.value}))}>{ST.map(s=><option key={s} value={s}>{s.charAt(0)+s.slice(1).toLowerCase()}</option>)}</Sel></div>
              <div><Lbl>Collection Date</Lbl><Inp type="date" value={oForm.sampleDate} onChange={(e:any)=>setOForm((f:any)=>({...f,sampleDate:e.target.value}))}/></div>
              <div><Lbl>Collection Time</Lbl><Inp type="time" value={oForm.sampleTime} onChange={(e:any)=>setOForm((f:any)=>({...f,sampleTime:e.target.value}))}/></div>
            </div>

            {/* Tests — searchable dropdown */}
            {(tL||pL)?<div style={{textAlign:"center" as any,padding:16,color:"#94a3b8",fontSize:12}}><Loader2 size={14} className="spin" style={{display:"inline",verticalAlign:"middle",marginRight:6}}/>Loading tests…</div>:(
              <div style={{marginBottom:4}}>
                <Lbl>Add Tests / Panels *</Lbl>
                <div style={{position:"relative",marginBottom:8}}>
                  <Inp placeholder="Search test or panel name…" value={testSearch} onChange={(e:any)=>setTestSearch(e.target.value)} style={{paddingRight:32}}/>
                  {testSearch&&<button onClick={()=>setTestSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={11}/></button>}
                  {/* Dropdown */}
                  {testSearch.length>0&&(()=>{
                    const q=testSearch.toLowerCase();
                    const matchT=tests.filter((t:any)=>t.isActive&&(t.name.toLowerCase().includes(q)||t.code?.toLowerCase().includes(q)||t.category?.toLowerCase().includes(q)));
                    const matchP=panels.filter((p:any)=>p.isActive&&(p.name.toLowerCase().includes(q)||p.code?.toLowerCase().includes(q)));
                    if(!matchT.length&&!matchP.length)return<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,zIndex:50,padding:"12px",textAlign:"center" as any,fontSize:11,color:"#94a3b8"}}>No tests found</div>;
                    return(
                      <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,.1)",zIndex:50,maxHeight:200,overflowY:"auto"}}>
                        {matchT.length>0&&<div style={{padding:"4px 10px",fontSize:9,fontWeight:700,color:"#94a3b8",background:"#f8fafc",letterSpacing:".04em"}}>TESTS</div>}
                        {matchT.map((t:any)=>{
                          const sel=!!oForm.items.find((i:any)=>i.testId===t.id);
                          return(<div key={t.id} onClick={()=>{if(!sel)addTest(t);setTestSearch("");}} style={{padding:"8px 12px",cursor:sel?"default":"pointer",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center",background:sel?"#f0fdf4":"#fff"}}>
                            <div><div style={{fontSize:12,fontWeight:600,color:sel?A:"#1e293b"}}>{t.name} {sel&&<Check size={9} color={A}/>}</div><div style={{fontSize:9,color:"#94a3b8"}}>{t.category||""}{t.specimenType?` · ${t.specimenType}`:""}</div></div>
                            <span style={{fontSize:11,fontWeight:700,color:A}}>₹{t.price||0}</span>
                          </div>);
                        })}
                        {matchP.length>0&&<div style={{padding:"4px 10px",fontSize:9,fontWeight:700,color:"#94a3b8",background:"#f8fafc",letterSpacing:".04em",marginTop:2}}>PANELS / PROFILES</div>}
                        {matchP.map((p:any)=>{
                          const sel=!!oForm.items.find((i:any)=>i.panelId===p.id);
                          return(<div key={p.id} onClick={()=>{if(!sel)addPanel(p);setTestSearch("");}} style={{padding:"8px 12px",cursor:sel?"default":"pointer",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center",background:sel?"#faf5ff":"#fff"}}>
                            <div><div style={{fontSize:12,fontWeight:600,color:sel?"#7c3aed":"#1e293b"}}>{p.name} {sel&&<Check size={9} color="#7c3aed"/>}</div><div style={{fontSize:9,color:"#94a3b8"}}>Panel · {(p.testIds||[]).length||"?"} tests</div></div>
                            <span style={{fontSize:11,fontWeight:700,color:"#7c3aed"}}>₹{p.price||0}</span>
                          </div>);
                        })}
                      </div>
                    );
                  })()}
                </div>
                {/* Quick badges for first 8 active tests */}
                {!testSearch&&<div style={{display:"flex",flexWrap:"wrap" as any,gap:5}}>
                  {tests.filter((t:any)=>t.isActive).slice(0,10).map((t:any)=>{const sel=!!oForm.items.find((i:any)=>i.testId===t.id);return(
                    <button key={t.id} onClick={()=>sel?rmItem(oForm.items.findIndex((i:any)=>i.testId===t.id)):addTest(t)} style={{padding:"3px 9px",borderRadius:20,border:`1.5px solid ${sel?A:"#e2e8f0"}`,background:sel?L:"#f8fafc",color:sel?A:"#475569",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
                      {sel&&<Check size={8}/>}{t.name}
                    </button>
                  );})
                  }
                  {tests.filter((t:any)=>t.isActive).length>10&&<span style={{fontSize:10,color:"#94a3b8",padding:"3px 6px"}}>+{tests.filter((t:any)=>t.isActive).length-10} more — search above</span>}
                </div>}
              </div>
            )}

            {/* Selected items */}
            {oForm.items.length>0&&<div style={{background:"#f8fafc",borderRadius:9,padding:"10px 12px",border:"1px solid #e2e8f0",marginTop:4}}>
              <div style={{fontSize:9,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase" as any}}>Selected ({oForm.items.length})</div>
              {oForm.items.map((item:any,idx:number)=>(
                <div key={idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid #f1f5f9"}}>
                  <span style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{item.name}{item.isAuto&&<span style={{marginLeft:5,fontSize:9,color:A,background:L,padding:"1px 5px",borderRadius:3}}>auto</span>}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:12,fontWeight:800,color:A}}>₹{item.price}</span>
                    <button onClick={()=>rmItem(idx)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",display:"flex",padding:0}}><X size={11}/></button>
                  </div>
                </div>
              ))}
              <div style={{marginTop:8,display:"flex",justifyContent:"flex-end",fontSize:14,fontWeight:800,color:A}}>Total: ₹{oForm.items.reduce((s:number,i:any)=>s+(parseFloat(i.price)||0),0).toFixed(2)}</div>
            </div>}
          </>}

          {/* ── TAB 1: Billing & Notes ── */}
          {newOrderTab===1&&(()=>{
            const gross=oForm.items.reduce((s:number,i:any)=>s+(parseFloat(i.price)||0),0);
            const disc=parseFloat(oForm.discount||"0")||0;
            const tax=parseFloat(oForm.taxPercent||"0")||0;
            const afterDiscount=gross-(gross*disc/100);
            const taxAmt=afterDiscount*(tax/100);
            const net=Math.max(0,afterDiscount+taxAmt);
            return(<>

            {/* Amount summary card */}
            <div style={{background:L,border:`1.5px solid ${B}`,borderRadius:10,padding:"12px 16px",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",marginBottom:8,letterSpacing:".05em"}}>ORDER SUMMARY</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#475569",marginBottom:4}}><span>{oForm.items.length} test(s) &middot; Gross Amount</span><span style={{fontWeight:700}}>₹{gross.toFixed(2)}</span></div>
              {disc>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#b45309",marginBottom:4}}><span>Discount ({disc}%){oForm.discountRemark?` — ${oForm.discountRemark}`:""}</span><span style={{fontWeight:700}}>−₹{(gross*disc/100).toFixed(2)}</span></div>}
              {tax>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#7c3aed",marginBottom:4}}><span>Tax / GST ({tax}%)</span><span style={{fontWeight:700}}>+₹{taxAmt.toFixed(2)}</span></div>}
              <div style={{borderTop:"1px solid #a7f3d0",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,fontWeight:700,color:"#047857"}}>Net Payable</span><span style={{fontSize:18,fontWeight:800,color:A}}>₹{net.toFixed(2)}</span></div>
            </div>

            {/* Billing action */}
            <div style={{marginBottom:14}}>
              <Lbl>How to handle payment?</Lbl>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                {[
                  {v:"collect_at_lab",l:"💰 Collect at Lab",d:"Accept payment here & now",bg:"#f0fdf4",bc:A,tc:A},
                  {v:"send_to_billing",l:"🏥 Send to Billing",d:"Transfer bill to reception counter",bg:"#eff6ff",bc:"#2563eb",tc:"#2563eb"},
                  {v:"defer",l:"⏳ Defer / Later",d:"Handle billing separately",bg:"#f8fafc",bc:"#e2e8f0",tc:"#475569"},
                ].map(({v,l,d,bg,bc,tc})=>(
                  <button key={v} onClick={()=>setOForm((f:any)=>({...f,billingAction:v}))} style={{padding:"10px",borderRadius:10,border:`2px solid ${oForm.billingAction===v?bc:"#e2e8f0"}`,background:oForm.billingAction===v?bg:"#fff",cursor:"pointer",textAlign:"left" as any}}>
                    <div style={{fontSize:11,fontWeight:700,color:oForm.billingAction===v?tc:"#475569",marginBottom:2}}>{l}</div>
                    <div style={{fontSize:9,color:"#94a3b8"}}>{d}</div>
                  </button>
                ))}
              </div>

              {/* Collect at Lab — full payment details */}
              {oForm.billingAction==="collect_at_lab"&&<div style={{background:"#f0fdf4",border:"1px solid #a7f3d0",borderRadius:9,padding:"12px 14px",marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:A,marginBottom:10}}>PAYMENT DETAILS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
                  <div><Lbl>Discount (%)</Lbl><Inp type="number" min="0" max="100" value={oForm.discount} onChange={(e:any)=>setOForm((f:any)=>({...f,discount:e.target.value}))} placeholder="0"/></div>
                  <div><Lbl>Tax / GST (%)</Lbl><Inp type="number" min="0" value={oForm.taxPercent} onChange={(e:any)=>setOForm((f:any)=>({...f,taxPercent:e.target.value}))} placeholder="0"/></div>
                  <div><Lbl>Payment Mode</Lbl><Sel value={oForm.paymentMode} onChange={(e:any)=>setOForm((f:any)=>({...f,paymentMode:e.target.value}))}><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card/POS</option><option value="CHEQUE">Cheque</option><option value="NEFT">NEFT/RTGS</option><option value="INSURANCE">Insurance</option><option value="ONLINE">Online</option></Sel></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><Lbl>Discount Remark</Lbl><Inp value={oForm.discountRemark} onChange={(e:any)=>setOForm((f:any)=>({...f,discountRemark:e.target.value}))} placeholder="e.g. Staff discount, charity…"/></div>
                  <div><Lbl>Reference ID</Lbl><Inp value={oForm.referenceId} onChange={(e:any)=>setOForm((f:any)=>({...f,referenceId:e.target.value}))} placeholder="Cheque/NEFT ref no."/></div>
                </div>
                {["UPI","ONLINE"].includes(oForm.paymentMode)&&<div style={{marginBottom:8}}><Lbl>UPI ID / Transaction ID</Lbl><Inp value={oForm.upiId} onChange={(e:any)=>setOForm((f:any)=>({...f,upiId:e.target.value}))} placeholder="UPI ID or transaction ref…"/></div>}
                <div style={{display:"flex",justifyContent:"flex-end",padding:"7px 12px",background:"#dcfce7",borderRadius:7}}><span style={{fontSize:14,fontWeight:800,color:A}}>Collect: ₹{net.toFixed(2)}</span></div>
              </div>}

              {/* Send to Billing */}
              {oForm.billingAction==="send_to_billing"&&<div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,padding:"12px 14px",marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:"#2563eb",marginBottom:8}}>BILLING TRANSFER</div>
                <div style={{marginBottom:8}}><Lbl>Transfer to Department</Lbl>
                  <Sel value={oForm.billingSubdeptId} onChange={(e:any)=>setOForm((f:any)=>({...f,billingSubdeptId:e.target.value}))}>
                    <option value="">— Main Billing / Reception Counter —</option>
                    {subdepts.filter((s:any)=>["BILLING","RECEPTION","ACCOUNTS","PHARMACY"].includes(s.type)||s.type?.toLowerCase().includes("billing")||s.type?.toLowerCase().includes("reception")).map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                    {subdepts.filter((s:any)=>!["BILLING","RECEPTION","ACCOUNTS","PHARMACY"].includes(s.type)&&!s.type?.toLowerCase().includes("billing")&&!s.type?.toLowerCase().includes("reception")).length>0&&<optgroup label="─ Other Departments ─">{subdepts.filter((s:any)=>!["BILLING","RECEPTION","ACCOUNTS","PHARMACY"].includes(s.type)&&!s.type?.toLowerCase().includes("billing")&&!s.type?.toLowerCase().includes("reception")).map((s:any)=><option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}</optgroup>}
                  </Sel>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
                  <div><Lbl>Discount (%)</Lbl><Inp type="number" min="0" max="100" value={oForm.discount} onChange={(e:any)=>setOForm((f:any)=>({...f,discount:e.target.value}))} placeholder="0"/></div>
                  <div><Lbl>Tax / GST (%)</Lbl><Inp type="number" min="0" value={oForm.taxPercent} onChange={(e:any)=>setOForm((f:any)=>({...f,taxPercent:e.target.value}))} placeholder="0"/></div>
                  <div><Lbl>Discount Remark</Lbl><Inp value={oForm.discountRemark} onChange={(e:any)=>setOForm((f:any)=>({...f,discountRemark:e.target.value}))} placeholder="Reason…"/></div>
                </div>
                <div style={{fontSize:10,color:"#3b82f6",padding:"6px 8px",background:"#dbeafe",borderRadius:6}}>📋 Bill ₹{net.toFixed(2)} will appear in the billing/reception queue as PENDING.</div>
              </div>}

              {oForm.billingAction==="defer"&&<div style={{fontSize:10,color:"#64748b",padding:"8px 12px",background:"#f8fafc",borderRadius:7,border:"1px dashed #e2e8f0"}}>ℹ Bill will not be created now. You can collect payment from the Revenue tab later.</div>}
            </div>

            {/* Clinical notes + remarks */}
            <div style={{marginBottom:10}}>
              <Lbl>Clinical Notes / Diagnosis</Lbl>
              <textarea style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,outline:"none",resize:"vertical" as any,boxSizing:"border-box" as any}} rows={2} value={oForm.clinicalNotes} onChange={(e:any)=>setOForm((f:any)=>({...f,clinicalNotes:e.target.value}))} placeholder="Symptoms, provisional diagnosis, history, special instructions…"/>
            </div>
            <div style={{marginBottom:12}}><Lbl>Remarks (optional)</Lbl><Inp value={oForm.remarks} onChange={(e:any)=>setOForm((f:any)=>({...f,remarks:e.target.value}))} placeholder="Any additional notes…"/></div>

            {/* Consent */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:9,background:oForm.consent?L:"#f8fafc",border:`1.5px solid ${oForm.consent?A:"#e2e8f0"}`}}>
              <input type="checkbox" checked={oForm.consent} onChange={(e:any)=>setOForm((f:any)=>({...f,consent:e.target.checked}))} style={{width:15,height:15,accentColor:A,flexShrink:0,cursor:"pointer"}}/>
              <div style={{flex:1,fontSize:12,fontWeight:600,color:"#475569"}}>Patient has given consent for data collection and laboratory testing</div>
              <button onClick={()=>setShowConsent(true)} type="button" style={{fontSize:10,color:"#2563eb",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:6,padding:"3px 9px",cursor:"pointer",flexShrink:0,fontWeight:600}}>View / Sign</button>
            </div>
            </>);
          })()}

          {oMsg&&<div style={{color:"#ef4444",fontSize:11,marginTop:12,padding:"7px 12px",background:"#fff5f5",borderRadius:7,border:"1px solid #fecaca"}}>{oMsg}</div>}
        </div>

        {/* Footer */}
        <div className="mo-ft" style={{flexShrink:0,justifyContent:"space-between" as any,padding:"10px 18px",background:"#f8fafc",borderTop:"1.5px solid #e2e8f0"}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {newOrderTab===1&&<button onClick={()=>setNewOrderTab(0)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer",fontWeight:600}}>← Back</button>}
            <Btn onClick={()=>{setShowOM(false);setNewOrderTab(0);setPatR([]);setDocSearch("");setDocR([]);setTestSearch("");}} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}>Cancel</Btn>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {newOrderTab===0&&<button onClick={()=>{if(!oForm.patientId&&!oForm.patientName.trim()){setOMsg("Please enter or select a patient");return;}if(!oForm.items.length){setOMsg("Add at least one test");return;}setOMsg("");setNewOrderTab(1);ldSubdepts();}} style={{padding:"8px 20px",borderRadius:9,background:A,color:"#fff",border:`1.5px solid ${A}`,fontSize:13,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>Next: Billing <ArrowRight size={13}/></button>}
            {newOrderTab===1&&<Btn onClick={createOrder} disabled={oSaving} style={{background:oSaving?"#94a3b8":A,color:"#fff",borderColor:A,fontSize:12,padding:"7px 18px"}}>{oSaving?<><Loader2 size={12} className="spin"/>Creating…</>:<><CheckCircle2 size={12}/>Create Order</>}</Btn>}
          </div>
        </div>
      </div>
    </div>}

    {/* Modal: Consent */}
    {showConsent&&<div className="ov" onClick={()=>setShowConsent(false)}>
      <div className="mo" style={{maxWidth:560,maxHeight:"92vh",display:"flex",flexDirection:"column" as any,padding:0}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd" style={{padding:"14px 18px",flexShrink:0}}>
          <span style={{fontSize:14,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:7}}><ShieldCheck size={14} color={A}/>Patient Consent Form</span>
          <button onClick={()=>setShowConsent(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button>
        </div>
        <div className="mo-b" style={{flex:1,overflowY:"auto" as any,padding:"16px 20px"}}>
          {/* Consent text */}
          <div style={{background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",padding:"14px 16px",marginBottom:16,fontSize:12,color:"#374151",lineHeight:1.7}}>
            <div style={{fontWeight:800,fontSize:13,color:"#1e293b",marginBottom:10}}>INFORMED CONSENT FOR LABORATORY TESTING</div>
            <p style={{margin:"0 0 10px"}}>I, the patient (or authorised representative), hereby provide consent for:</p>
            <ul style={{margin:"0 0 10px",paddingLeft:18}}>
              <li>Collection of biological specimens (blood, urine, swab, etc.) as required for the prescribed tests.</li>
              <li>Analysis and processing of specimens in the laboratory.</li>
              <li>Storage of anonymised data for quality improvement and research purposes.</li>
              <li>Sharing of results with the referring physician and treating healthcare team.</li>
            </ul>
            <p style={{margin:"0 0 10px"}}>I understand that:</p>
            <ul style={{margin:"0 0 10px",paddingLeft:18}}>
              <li>Specimen collection involves minimal risk (e.g., slight discomfort, bruising at venipuncture site).</li>
              <li>My personal data will be handled in accordance with applicable privacy regulations.</li>
              <li>I may withdraw consent at any time before specimen collection.</li>
              <li>Laboratory results are for diagnostic purposes and must be interpreted by a qualified physician.</li>
            </ul>
            <p style={{margin:0,fontWeight:600}}>By signing below, I confirm that I have read and understood the above and consent to the described procedures.</p>
          </div>
          {/* Patient info row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14,fontSize:11}}>
            <div><div style={{color:"#94a3b8",fontSize:9,fontWeight:700,marginBottom:2}}>PATIENT NAME</div><div style={{fontWeight:700,color:"#1e293b"}}>{oForm.patientName||"—"}</div></div>
            <div><div style={{color:"#94a3b8",fontSize:9,fontWeight:700,marginBottom:2}}>DATE</div><div style={{fontWeight:700,color:"#1e293b"}}>{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div></div>
            <div><div style={{color:"#94a3b8",fontSize:9,fontWeight:700,marginBottom:2}}>TESTS</div><div style={{fontWeight:700,color:"#1e293b"}}>{oForm.items.length} test(s)</div></div>
          </div>
          {/* Signature pad */}
          <div style={{marginBottom:14}}>
            <Lbl>Patient / Guardian Signature</Lbl>
            <div style={{border:"1.5px solid #e2e8f0",borderRadius:9,background:"#fafafa",overflow:"hidden",position:"relative"}}>
              <canvas id="consent-sig-canvas" width={500} height={120} style={{width:"100%",height:120,cursor:"crosshair",display:"block",touchAction:"none"}}
                onMouseDown={(e:any)=>{const c=e.target as HTMLCanvasElement;const ctx=c.getContext("2d");if(!ctx)return;ctx.strokeStyle="#1e293b";ctx.lineWidth=2;ctx.lineCap="round";const r=c.getBoundingClientRect();ctx.beginPath();ctx.moveTo(e.clientX-r.left,e.clientY-r.top);(c as any)._drawing=true;(c as any)._ctx=ctx;(c as any)._r=r;}}
                onMouseMove={(e:any)=>{const c=e.target as HTMLCanvasElement;if(!(c as any)._drawing)return;const ctx=(c as any)._ctx;const r=(c as any)._r;ctx.lineTo(e.clientX-r.left,e.clientY-r.top);ctx.stroke();}}
                onMouseUp={(e:any)=>{(e.target as any)._drawing=false;}}
                onMouseLeave={(e:any)=>{(e.target as any)._drawing=false;}}
              />
              <button onClick={()=>{const c=document.getElementById("consent-sig-canvas") as HTMLCanvasElement;if(c){const ctx=c.getContext("2d");if(ctx)ctx.clearRect(0,0,c.width,c.height);}}} style={{position:"absolute",top:6,right:8,fontSize:9,background:"#fff",border:"1px solid #e2e8f0",borderRadius:5,padding:"2px 8px",cursor:"pointer",color:"#94a3b8"}}>Clear</button>
            </div>
            <div style={{fontSize:9,color:"#94a3b8",marginTop:3}}>Sign above with mouse/touch</div>
          </div>
        </div>
        <div className="mo-ft" style={{flexShrink:0,padding:"10px 18px",justifyContent:"space-between" as any}}>
          <button onClick={printConsentPDF} style={{fontSize:11,color:"#2563eb",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:5}}><Download size={11}/>Download / Print PDF</button>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>setShowConsent(false)} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}>Cancel</Btn>
            <Btn onClick={()=>{setOForm((f:any)=>({...f,consent:true}));setShowConsent(false);}} style={{background:A,color:"#fff",borderColor:A}}><CheckCircle2 size={11}/>Confirm Consent</Btn>
          </div>
        </div>
      </div>
    </div>}

    {/* Modal: Collect Sample */}
    {showSM&&smOrder&&<div className="ov" onClick={()=>setShowSM(false)}>
      <div className="mo" style={{maxWidth:440}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:7}}><TestTube2 size={13} color="#b45309"/>Collect — {smOrder.orderNo}</span><button onClick={()=>setShowSM(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b">
          <div style={{background:"#fffbeb",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#92400e"}}><strong>{smOrder.patient?.name}</strong> ({smOrder.patient?.patientId}) · {(smOrder.items||[]).map((i:any)=>i.test?.name||i.panel?.name).filter(Boolean).join(", ")||"—"}</div>
          <div style={{marginBottom:10}}><Lbl>Specimen Type</Lbl><Sel value={smForm.specimenType} onChange={(e:any)=>setSmForm(f=>({...f,specimenType:e.target.value}))}>{ST.map(s=><option key={s} value={s}>{s}</option>)}</Sel></div>
          <div style={{marginBottom:10}}><Lbl>Collected By</Lbl><Inp value={smForm.collectedBy} onChange={(e:any)=>setSmForm(f=>({...f,collectedBy:e.target.value}))} placeholder="Phlebotomist name"/></div>
          <div style={{marginBottom:10}}><Lbl>Notes</Lbl><Inp value={smForm.notes} onChange={(e:any)=>setSmForm(f=>({...f,notes:e.target.value}))} placeholder="Optional"/></div>
          <div style={{background:"#f0fdf4",borderRadius:7,padding:"6px 10px",fontSize:10,color:"#047857"}}>Barcode will be auto-generated.</div>
        </div>
        <div className="mo-ft"><Btn onClick={()=>setShowSM(false)} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}>Cancel</Btn><Btn onClick={collectSample} disabled={smSav} style={{background:smSav?"#94a3b8":"#b45309",color:"#fff",borderColor:"#b45309"}}>{smSav?<><Loader2 size={12} className="spin"/>Saving…</>:<><TestTube2 size={12}/>Confirm</>}</Btn></div>
      </div>
    </div>}

    {/* Modal: Test Form */}
    {showTF&&<div className="ov" onClick={()=>setShowTF(false)}>
      <div className="mo" style={{maxWidth:560}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#1e293b"}}>{editT?"Edit Test":"Add Lab Test"}</span><button onClick={()=>setShowTF(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:8}}>
            <div><Lbl>Name *</Lbl><Inp value={tForm.name} onChange={(e:any)=>setTForm((f:any)=>({...f,name:e.target.value}))} placeholder="e.g. CBC"/></div>
            <div><Lbl>Code *</Lbl><Inp value={tForm.code} onChange={(e:any)=>setTForm((f:any)=>({...f,code:e.target.value.toUpperCase()}))} placeholder="e.g. CBC"/></div>
            <div><Lbl>Category</Lbl><Sel value={tForm.category} onChange={(e:any)=>setTForm((f:any)=>({...f,category:e.target.value}))}>{CA.map(c=><option key={c} value={c}>{c}</option>)}</Sel></div>
            <div><Lbl>Specimen</Lbl><Sel value={tForm.specimenType} onChange={(e:any)=>setTForm((f:any)=>({...f,specimenType:e.target.value}))}>{ST.map(s=><option key={s} value={s}>{s}</option>)}</Sel></div>
            <div><Lbl>Price (₹)</Lbl><Inp type="number" value={tForm.price} onChange={(e:any)=>setTForm((f:any)=>({...f,price:e.target.value}))} min="0"/></div>
            <div><Lbl>Unit</Lbl><Inp value={tForm.unit} onChange={(e:any)=>setTForm((f:any)=>({...f,unit:e.target.value}))} placeholder="mg/dL"/></div>
            <div><Lbl>Normal Min</Lbl><Inp type="number" value={tForm.normalRangeMin} onChange={(e:any)=>setTForm((f:any)=>({...f,normalRangeMin:e.target.value}))} placeholder="4.5"/></div>
            <div><Lbl>Normal Max</Lbl><Inp type="number" value={tForm.normalRangeMax} onChange={(e:any)=>setTForm((f:any)=>({...f,normalRangeMax:e.target.value}))} placeholder="11.0"/></div>
            <div><Lbl>Range Text</Lbl><Inp value={tForm.normalRangeText} onChange={(e:any)=>setTForm((f:any)=>({...f,normalRangeText:e.target.value}))} placeholder="Negative / &lt;200"/></div>
            <div><Lbl>Method</Lbl><Inp value={tForm.method} onChange={(e:any)=>setTForm((f:any)=>({...f,method:e.target.value}))} placeholder="Automated"/></div>
            <div><Lbl>TAT (hrs)</Lbl><Inp type="number" value={tForm.turnaroundHrs} onChange={(e:any)=>setTForm((f:any)=>({...f,turnaroundHrs:e.target.value}))} min="1"/></div>
            <div><Lbl>Machine ID</Lbl><Inp value={tForm.machineId} onChange={(e:any)=>setTForm((f:any)=>({...f,machineId:e.target.value}))} placeholder="Analyzer code"/></div>
          </div>
          {tMsg&&<div style={{color:"#ef4444",fontSize:11}}>{tMsg}</div>}
        </div>
        <div className="mo-ft"><Btn onClick={()=>setShowTF(false)} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}>Cancel</Btn><Btn onClick={saveTest} disabled={tSav} style={{background:tSav?"#94a3b8":A,color:"#fff",borderColor:A}}>{tSav?<><Loader2 size={12} className="spin"/>Saving…</>:<><Save size={12}/>{editT?"Update":"Add"}</>}</Btn></div>
      </div>
    </div>}

    {/* Modal: Panel Form */}
    {showPF&&<div className="ov" onClick={()=>setShowPF(false)}>
      <div className="mo" style={{maxWidth:540}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#1e293b"}}>{editP?"Edit Panel":"Add Panel"}</span><button onClick={()=>setShowPF(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
            <div><Lbl>Name *</Lbl><Inp value={pForm.name} onChange={(e:any)=>setPForm((f:any)=>({...f,name:e.target.value}))} placeholder="e.g. CBC Panel"/></div>
            <div><Lbl>Code *</Lbl><Inp value={pForm.code} onChange={(e:any)=>setPForm((f:any)=>({...f,code:e.target.value.toUpperCase()}))} placeholder="e.g. CBC"/></div>
            <div><Lbl>Price (₹)</Lbl><Inp type="number" value={pForm.price} onChange={(e:any)=>setPForm((f:any)=>({...f,price:e.target.value}))} min="0"/></div>
            <div><Lbl>Description</Lbl><Inp value={pForm.description} onChange={(e:any)=>setPForm((f:any)=>({...f,description:e.target.value}))} placeholder="Optional"/></div>
          </div>
          <Lbl>Tests in this panel</Lbl>
          <div style={{display:"flex",gap:5,flexWrap:"wrap" as any,maxHeight:130,overflowY:"auto",paddingBottom:4}}>
            {tests.map((t:any)=><button key={t.id} onClick={()=>setPForm((f:any)=>({...f,testIds:f.testIds.includes(t.id)?f.testIds.filter((id:string)=>id!==t.id):[...f.testIds,t.id]}))} style={{padding:"2px 8px",borderRadius:5,border:`1.5px solid ${pForm.testIds.includes(t.id)?A:"#e2e8f0"}`,background:pForm.testIds.includes(t.id)?L:"#fff",color:pForm.testIds.includes(t.id)?A:"#475569",fontSize:10,fontWeight:600,cursor:"pointer"}}>{t.name}</button>)}
          </div>
          {pMsg&&<div style={{color:"#ef4444",fontSize:11,marginTop:8}}>{pMsg}</div>}
        </div>
        <div className="mo-ft"><Btn onClick={()=>setShowPF(false)} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}>Cancel</Btn><Btn onClick={savePnl} disabled={pSav} style={{background:pSav?"#94a3b8":A,color:"#fff",borderColor:A}}>{pSav?<><Loader2 size={12} className="spin"/>Saving…</>:<><Save size={12}/>{editP?"Update":"Create"}</>}</Btn></div>
      </div>
    </div>}

    {/* Modal: View Report — Full Letterhead */}
    {vRep&&<div className="ov" onClick={()=>setVRep(null)}>
      <div className="mo" style={{maxWidth:720,maxHeight:"92vh",display:"flex",flexDirection:"column" as any}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:7}}><FileText size={14} color={A}/>Report — {vRep.order?.orderNo}</span><button onClick={()=>setVRep(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b" style={{overflowY:"auto" as any,...(hospitalInfo?.letterhead?{backgroundImage:`url(${hospitalInfo.letterhead.match(/\.pdf$/i)||hospitalInfo.letterhead.includes("/raw/upload/")?hospitalInfo.letterhead.replace("/upload/","/upload/f_png,pg_1/").replace(/\.pdf$/i,".png"):hospitalInfo.letterhead})`,backgroundSize:"100% 100%",backgroundPosition:"center",backgroundRepeat:"no-repeat",minHeight:"100vh"}:{})}}>
          {/* Hospital Letterhead Header */}
          {hospitalInfo?.letterhead?(
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"70px 24px 0",marginBottom:20}}>
              <div>
                {hospitalInfo?.logo&&<img src={hospitalInfo.logo} alt="logo" style={{height:44,marginBottom:6,display:"block"}}/>}
                <div style={{fontSize:17,fontWeight:800,color:"#047857"}}>{hn}</div>
                {haddr&&<div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{haddr}</div>}
                {hphone&&<div style={{fontSize:10,color:"#6b7280"}}>{hphone}{hemail?` · ${hemail}`:""}</div>}
              </div>
              <div style={{textAlign:"right" as any}}>
                <div style={{display:"inline-block",padding:"4px 14px",borderRadius:6,background:"#047857",color:"#fff",fontSize:11,fontWeight:700,letterSpacing:"0.04em",marginBottom:6}}>LAB REPORT</div>
                <div style={{fontSize:15,fontWeight:700,color:"#1e293b",margin:"4px 0"}}>{vRep.order?.orderNo}</div>
                <div style={{fontSize:11,color:"#64748b"}}>{vRep.generatedAt?new Date(vRep.generatedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}):""}</div>
                <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:vRep.status==="DELIVERED"?"#f0fdf4":vRep.status==="VERIFIED"?"#ecfdf5":"#fff1f2",color:vRep.status==="DELIVERED"?"#065f46":vRep.status==="VERIFIED"?"#047857":"#be123c",border:`1px solid ${vRep.status==="DELIVERED"?"#6ee7b7":vRep.status==="VERIFIED"?"#a7f3d0":"#fecdd3"}`,display:"inline-block",marginTop:5}}>{vRep.status}</span>
              </div>
            </div>
          ):(
            <div style={{borderBottom:"3px solid #047857",paddingBottom:14,marginBottom:16,display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div>
                {hospitalInfo?.logo&&<img src={hospitalInfo.logo} alt="logo" style={{height:44,marginBottom:6,display:"block"}}/>}
                <div style={{fontSize:17,fontWeight:800,color:"#047857"}}>{hn}</div>
                {haddr&&<div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{haddr}</div>}
                {hphone&&<div style={{fontSize:10,color:"#6b7280"}}>{hphone}{hemail?` · ${hemail}`:""}</div>}
              </div>
              <div style={{textAlign:"right" as any}}>
                <div style={{fontSize:16,fontWeight:800,color:"#1e293b",letterSpacing:".04em"}}>LAB REPORT</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:3,fontWeight:600}}>{vRep.order?.orderNo}</div>
                <div style={{fontSize:10,color:"#94a3b8"}}>{vRep.generatedAt?new Date(vRep.generatedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}):""}</div>
                <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:vRep.status==="DELIVERED"?"#f0fdf4":vRep.status==="VERIFIED"?"#ecfdf5":"#fff1f2",color:vRep.status==="DELIVERED"?"#065f46":vRep.status==="VERIFIED"?"#047857":"#be123c",border:`1px solid ${vRep.status==="DELIVERED"?"#6ee7b7":vRep.status==="VERIFIED"?"#a7f3d0":"#fecdd3"}`,display:"inline-block",marginTop:5}}>{vRep.status}</span>
              </div>
            </div>
          )}
          {/* 3-Column Info Block: Patient | Sample | Doctor/Client */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[
              {title:"Patient Information",rows:[{l:"Name",v:vRep.order?.patient?.name||"—"},{l:"UHID",v:vRep.order?.patient?.patientId||"—"},{l:"Phone",v:vRep.order?.patient?.phone||"—"},{l:"Email",v:vRep.order?.patient?.email||"—"}]},
              {title:"Sample Information",rows:[{l:"Order No",v:vRep.order?.orderNo||"—"},{l:"Priority",v:vRep.order?.priority||"Routine"},{l:"Order Type",v:vRep.order?.orderType||"—"},{l:"Sample Type",v:vRep.order?.sample?.specimenType||"—"}]},
              {title:"Referring Doctor / Client",rows:[{l:"Doctor",v:vRep.order?.doctor?.name?`Dr. ${vRep.order.doctor.name}`:"—"},{l:"Hospital",v:hn},{l:"Verified",v:vRep.verifiedBy||"—"},{l:"Printed",v:new Date().toLocaleDateString("en-IN")}]},
            ].map(block=>(
              <div key={block.title} style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:8,fontWeight:700,color:A,textTransform:"uppercase" as any,letterSpacing:".05em",marginBottom:5,borderBottom:"1px solid #e5e7eb",paddingBottom:3}}>{block.title}</div>
                {block.rows.map(r=>(<div key={r.l} style={{display:"flex",gap:4,fontSize:10,marginBottom:2}}><span style={{fontWeight:600,color:"#94a3b8",minWidth:48}}>{r.l}</span><span style={{color:"#1e293b",fontWeight:500}}>: {r.v}</span></div>))}
              </div>
            ))}
          </div>
          {/* Grouped Results Table with Method + Flag columns */}
          {(()=>{
            const itms=(vRep.order?.items||[]) as any[];
            const grps:Record<string,any[]>={};
            itms.forEach((i:any)=>{const c=i.test?.category||"General";if(!grps[c])grps[c]=[];grps[c].push(i);});
            return(<div style={{border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden",marginBottom:14}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"#f0fdf4",borderBottom:"2px solid #a7f3d0"}}>
                  {["Test / Investigation","Method","Result","Unit","Biological Ref. Interval","Flag"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:h==="Flag"?"center" as any:"left" as any,fontSize:9,color:"#047857",fontWeight:700,letterSpacing:".04em"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {Object.entries(grps).map(([cat,items])=>(<React.Fragment key={cat}>
                    <tr><td colSpan={6} style={{padding:"6px 10px",background:"#e6f5f0",fontWeight:700,fontSize:11,color:A,letterSpacing:".03em"}}>{cat.replace(/_/g," ")}</td></tr>
                    {items.map((item:any)=>{
                      let flag="";
                      if(item.isCritical)flag="H !!";else if(item.isAbnormal){const rn=parseFloat(item.result);const mn=parseFloat(item.test?.normalRangeMin);const mxVal=parseFloat(item.test?.normalRangeMax);if(!isNaN(rn)&&!isNaN(mn)&&!isNaN(mxVal))flag=rn>mxVal?"H":rn<mn?"L":"";else flag="*";}
                      return(<tr key={item.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{padding:"7px 10px",fontWeight:600,fontSize:11,color:"#1e293b"}}>{item.test?.name||item.panel?.name||"—"}</td>
                        <td style={{padding:"7px 10px",fontSize:10,color:"#94a3b8"}}>{item.test?.method||""}</td>
                        <td style={{padding:"7px 10px",fontWeight:700,fontSize:12,color:item.isCritical?"#dc2626":item.isAbnormal?"#d97706":"#059669"}}>{item.result||<span style={{color:"#cbd5e1"}}>—</span>}</td>
                        <td style={{padding:"7px 10px",fontSize:10,color:"#64748b"}}>{item.unit||item.test?.unit||"—"}</td>
                        <td style={{padding:"7px 10px",fontSize:10,color:"#64748b"}}>{item.normalRange||item.test?.normalRangeText||"—"}</td>
                        <td style={{padding:"7px 10px",textAlign:"center" as any}}>
                          {flag.includes("H")?<span style={{fontSize:9,fontWeight:800,background:"#fee2e2",color:"#dc2626",padding:"2px 8px",borderRadius:20}}>{flag}</span>
                          :flag==="L"?<span style={{fontSize:9,fontWeight:800,background:"#dbeafe",color:"#2563eb",padding:"2px 8px",borderRadius:20}}>L</span>
                          :flag==="*"?<span style={{fontSize:9,fontWeight:700,background:"#fef3c7",color:"#d97706",padding:"2px 8px",borderRadius:20}}>*</span>
                          :<span style={{fontSize:9,color:"#cbd5e1"}}>—</span>}
                        </td>
                      </tr>);
                    })}
                  </React.Fragment>))}
                </tbody>
              </table>
            </div>);
          })()}
          {/* Clinical Findings — pathologistRemarks / interpretation / impression / recommendation */}
          {(vRep.order?.pathologistRemarks||vRep.order?.interpretation||vRep.order?.impression||vRep.order?.recommendation)&&(
            <div style={{marginBottom:14}}>
              {([{k:"pathologistRemarks",label:"Pathologist Remarks / Gross Description",bg:"#f8fafc",bc:"#e2e8f0",tc:"#475569"},{k:"interpretation",label:"Clinical Interpretation",bg:"#f0fdf4",bc:"#a7f3d0",tc:"#065f46"},{k:"impression",label:"Impression / Diagnosis",bg:"#faf5ff",bc:"#e9d5ff",tc:"#6b21a8"},{k:"recommendation",label:"Recommendation / Follow-up",bg:"#eff6ff",bc:"#bfdbfe",tc:"#1d4ed8"}] as any[]).map((s:any)=>vRep.order?.[s.k]?(
                <div key={s.k} style={{padding:"10px 14px",background:s.bg,borderRadius:9,border:`1px solid ${s.bc}`,marginBottom:8}}>
                  <div style={{fontSize:9,fontWeight:700,color:s.tc,textTransform:"uppercase" as any,letterSpacing:".05em",marginBottom:4}}>{s.label}</div>
                  <div style={{fontSize:12,color:"#1e293b",lineHeight:1.6,whiteSpace:"pre-wrap" as any}}>{vRep.order[s.k]}</div>
                </div>
              ):null)}
            </div>
          )}
          {vRep.notes&&<div style={{padding:"10px 14px",background:"#f8fafc",borderRadius:9,border:"1px solid #e2e8f0",marginBottom:10,fontSize:12,color:"#475569"}}><div style={{fontSize:9,fontWeight:700,color:"#94a3b8",marginBottom:3}}>NOTES</div>{vRep.notes}</div>}
          {vRep.verifiedBy&&<div style={{padding:"10px 14px",background:"#f0fdf4",border:"1px solid #a7f3d0",borderRadius:9,marginBottom:10,fontSize:12}}><b>Electronically Verified by:</b> {vRep.verifiedBy}{vRep.verifiedAt?` on ${new Date(vRep.verifiedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}`:""}</div>}
          {vRep.deliveredAt&&<div style={{padding:"8px 14px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,fontSize:11,color:"#2563eb"}}><Send size={10} style={{display:"inline",marginRight:5}}/>Delivered via {vRep.deliveryMethod} on {new Date(vRep.deliveredAt).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</div>}
        </div>
        <div className="mo-ft">
          <button onClick={()=>setVRep(null)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer"}}>Close</button>
          <button onClick={()=>printReport(vRep)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#475569",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Download size={12}/>Download PDF</button>
          <button onClick={()=>sendRepEmail(vRep)} disabled={rActL} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #bfdbfe",background:"#eff6ff",color:"#2563eb",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5,opacity:rActL?.6:1}}><Send size={12}/>Send to Patient</button>
          {vRep.status==="DRAFT"&&<button onClick={()=>doRep(vRep.orderId,"verify")} disabled={rActL} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #a7f3d0",background:"#ecfdf5",color:"#047857",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5,opacity:rActL?.6:1}}><ShieldCheck size={12}/>Verify</button>}
        </div>
      </div>
    </div>}

    {/* Modal: Edit Report */}
    {editRep&&<div className="ov" onClick={()=>setEditRep(null)}>
      <div className="mo" style={{maxWidth:640,maxHeight:"92vh",display:"flex",flexDirection:"column" as any}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:7}}><Pencil size={13} color="#7c3aed"/>Edit Report — {editRep.order?.orderNo}</span><button onClick={()=>setEditRep(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b" style={{overflowY:"auto" as any}}>
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:9,padding:"10px 14px",marginBottom:12,fontSize:11,color:"#475569",display:"flex",gap:12,flexWrap:"wrap" as any}}>
            <div><span style={{fontWeight:700,color:"#94a3b8",fontSize:9}}>PATIENT</span><br/><span style={{fontWeight:700,color:"#1e293b"}}>{editRep.order?.patient?.name||"—"}</span></div>
            <div><span style={{fontWeight:700,color:"#94a3b8",fontSize:9}}>ORDER</span><br/><span style={{color:A,fontWeight:700}}>{editRep.order?.orderNo}</span></div>
            <div><span style={{fontWeight:700,color:"#94a3b8",fontSize:9}}>STATUS</span><br/><span style={{fontWeight:700,color:"#1e293b"}}>{editRep.status}</span></div>
          </div>
          {/* Verified By */}
          <div style={{marginBottom:12}}><Lbl>Verified By (Pathologist Name)</Lbl><Inp value={editRepForm.verifiedBy} onChange={(e:any)=>setEditRepForm(f=>({...f,verifiedBy:e.target.value}))} placeholder="e.g. Dr. Rajan Mehta"/></div>
          <div style={{marginBottom:14}}><Lbl>Report Notes</Lbl><textarea rows={3} value={editRepForm.notes} onChange={(e:any)=>setEditRepForm(f=>({...f,notes:e.target.value}))} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:11,outline:"none",resize:"vertical" as any,boxSizing:"border-box" as any}} placeholder="Any additional clinical notes…"/></div>
          {/* Test results edit */}
          <div style={{fontWeight:700,fontSize:11,color:"#1e293b",marginBottom:8}}>Test Results</div>
          {editRepItems.map((item:any,idx:number)=>(
            <div key={item.id} style={{marginBottom:10,padding:"10px 12px",background:"#f8fafc",borderRadius:9,border:"1.5px solid #e2e8f0"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#1e293b",marginBottom:7}}>{item.testName}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:7}}>
                <div><Lbl>Result *</Lbl><Inp value={item.result} onChange={(e:any)=>{const u=[...editRepItems];u[idx]={...u[idx],result:e.target.value};setEditRepItems(u);}}/></div>
                <div><Lbl>Unit</Lbl><Inp value={item.unit} onChange={(e:any)=>{const u=[...editRepItems];u[idx]={...u[idx],unit:e.target.value};setEditRepItems(u);}}/></div>
                <div><Lbl>Normal Range</Lbl><Inp value={item.normalRange} onChange={(e:any)=>{const u=[...editRepItems];u[idx]={...u[idx],normalRange:e.target.value};setEditRepItems(u);}}/></div>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <label style={{display:"flex",alignItems:"center",gap:5,fontSize:11,cursor:"pointer"}}><input type="checkbox" checked={item.isAbnormal} onChange={(e:any)=>{const u=[...editRepItems];u[idx]={...u[idx],isAbnormal:e.target.checked};setEditRepItems(u);}}/> Abnormal</label>
                <label style={{display:"flex",alignItems:"center",gap:5,fontSize:11,cursor:"pointer"}}><input type="checkbox" checked={item.isCritical} onChange={(e:any)=>{const u=[...editRepItems];u[idx]={...u[idx],isCritical:e.target.checked};setEditRepItems(u);}}/> Critical</label>
                <div style={{flex:1}}><Inp value={item.enteredBy} onChange={(e:any)=>{const u=[...editRepItems];u[idx]={...u[idx],enteredBy:e.target.value};setEditRepItems(u);}} placeholder="Entered by…" style={{padding:"4px 8px",fontSize:10}}/></div>
              </div>
            </div>
          ))}
          {editRepMsg&&<div style={{color:"#ef4444",fontSize:11,marginBottom:6}}>{editRepMsg}</div>}
        </div>
        <div className="mo-ft">
          <button onClick={()=>setEditRep(null)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer"}}>Cancel</button>
          <button onClick={saveEditReport} disabled={editRepSaving} style={{padding:"7px 16px",borderRadius:8,border:"none",background:editRepSaving?"#94a3b8":A,color:"#fff",fontSize:12,cursor:editRepSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
            {editRepSaving?<><Loader2 size={12} className="spin"/>Saving…</>:<><Save size={12}/>Save Changes</>}
          </button>
        </div>
      </div>
    </div>}

    {/* Modal: Delete Report Confirm */}
    {delRep&&<div className="ov" onClick={()=>setDelRep(null)}>
      <div className="mo" style={{maxWidth:400}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#b91c1c",display:"flex",alignItems:"center",gap:7}}><Trash2 size={14}/>Delete Report</span><button onClick={()=>setDelRep(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b">
          <div style={{background:"#fff5f5",border:"1.5px solid #fecaca",borderRadius:10,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:"#1e293b",marginBottom:4}}>{delRep.order?.orderNo} — {delRep.order?.patient?.name||"—"}</div>
            <div style={{fontSize:11,color:"#ef4444",fontWeight:600,marginBottom:4}}>⚠️ This will delete the lab report permanently.</div>
            <div style={{fontSize:11,color:"#475569"}}>The lab order will be reset to <strong>Result Entry</strong> stage so a new report can be generated. Patient data and test results are <strong>not</strong> deleted.</div>
          </div>
        </div>
        <div className="mo-ft">
          <button onClick={()=>setDelRep(null)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer"}}>Cancel</button>
          <button onClick={deleteReport} disabled={delRepL} style={{padding:"7px 16px",borderRadius:8,border:"none",background:delRepL?"#94a3b8":"#ef4444",color:"#fff",fontSize:12,cursor:delRepL?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
            {delRepL?<><Loader2 size={12} className="spin"/>Deleting…</>:<><Trash2 size={12}/>Delete Report</>}
          </button>
        </div>
      </div>
    </div>}

    {/* Modal: View Order (with letterhead - matching View Report) */}
    {vOrd&&<div className="ov" onClick={()=>setVOrd(null)}>
      <div className="mo" style={{maxWidth:720,maxHeight:"92vh",display:"flex",flexDirection:"column" as any}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:7}}><ClipboardList size={14} color={A}/>Order — {vOrd.orderNo}</span><button onClick={()=>setVOrd(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b" style={{overflowY:"auto" as any,...(hospitalInfo?.letterhead?{backgroundImage:`url(${hospitalInfo.letterhead.match(/\.pdf$/i)||hospitalInfo.letterhead.includes("/raw/upload/")?hospitalInfo.letterhead.replace("/upload/","/upload/f_png,pg_1/").replace(/\.pdf$/i,".png"):hospitalInfo.letterhead})`,backgroundSize:"100% 100%",backgroundPosition:"center",backgroundRepeat:"no-repeat",minHeight:"100vh"}:{})}}>
          {hospitalInfo?.letterhead?(
            <div style={{display:"flex",justifyContent:"flex-end",padding:"70px 24px 0",marginBottom:20}}>
              <div style={{textAlign:"right" as any}}>
                <div style={{display:"inline-block",padding:"4px 14px",borderRadius:6,background:"#047857",color:"#fff",fontSize:11,fontWeight:700,letterSpacing:"0.04em",marginBottom:6}}>LAB ORDER</div>
                <div style={{fontSize:15,fontWeight:700,color:"#1e293b",margin:"4px 0"}}>{vOrd.orderNo}</div>
                <div style={{fontSize:11,color:"#64748b"}}>{vOrd.createdAt?new Date(vOrd.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}):""}</div>
                <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:OS[vOrd.status]?.bg||"#f8fafc",color:OS[vOrd.status]?.c||"#64748b",border:`1px solid ${OS[vOrd.status]?.bd||"#e2e8f0"}`,display:"inline-block",marginTop:5}}>{OS[vOrd.status]?.label||vOrd.status}</span>
              </div>
            </div>
          ):(
            <div style={{borderBottom:"3px solid #047857",paddingBottom:14,marginBottom:16,display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div>
                {hospitalInfo?.logo&&<img src={hospitalInfo.logo} alt="logo" style={{height:44,marginBottom:6,display:"block"}}/>}
                <div style={{fontSize:17,fontWeight:800,color:"#047857"}}>{hn}</div>
                {haddr&&<div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{haddr}</div>}
                {hphone&&<div style={{fontSize:10,color:"#6b7280"}}>{hphone}{hemail?` · ${hemail}`:""}</div>}
              </div>
              <div style={{textAlign:"right" as any}}>
                <div style={{fontSize:16,fontWeight:800,color:"#1e293b",letterSpacing:".04em"}}>LAB ORDER</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:3,fontWeight:600}}>{vOrd.orderNo}</div>
                <div style={{fontSize:10,color:"#94a3b8"}}>{vOrd.createdAt?new Date(vOrd.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}):""}</div>
                <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,background:OS[vOrd.status]?.bg||"#f8fafc",color:OS[vOrd.status]?.c||"#64748b",border:`1px solid ${OS[vOrd.status]?.bd||"#e2e8f0"}`,display:"inline-block",marginTop:5}}>{OS[vOrd.status]?.label||vOrd.status}</span>
              </div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[
              {title:"Patient Information",rows:[{l:"Name",v:vOrd.patient?.name||"—"},{l:"UHID",v:vOrd.patient?.patientId||"—"},{l:"Phone",v:vOrd.patient?.phone||"—"},{l:"Email",v:vOrd.patient?.email||"—"}]},
              {title:"Order Information",rows:[{l:"Order No",v:vOrd.orderNo||"—"},{l:"Priority",v:PR[vOrd.priority]?.label||vOrd.priority||"Routine"},{l:"Order Type",v:vOrd.orderType||"—"},{l:"Created",v:vOrd.createdAt?new Date(vOrd.createdAt).toLocaleDateString("en-IN"):"—"}]},
              {title:"Referring Doctor",rows:[{l:"Doctor",v:vOrd.doctor?.name?`Dr. ${vOrd.doctor.name}`:"—"},{l:"Hospital",v:hn},{l:"Status",v:OS[vOrd.status]?.label||vOrd.status||"—"},{l:"Sample",v:vOrd.sample?.barcodeId||"Not collected"}]},
            ].map(block=>(
              <div key={block.title} style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:8,fontWeight:700,color:A,textTransform:"uppercase" as any,letterSpacing:".05em",marginBottom:5,borderBottom:"1px solid #e5e7eb",paddingBottom:3}}>{block.title}</div>
                {block.rows.map(r=>(<div key={r.l} style={{display:"flex",gap:4,fontSize:10,marginBottom:2}}><span style={{fontWeight:600,color:"#94a3b8",minWidth:48}}>{r.l}</span><span style={{color:"#1e293b",fontWeight:500}}>: {r.v}</span></div>))}
              </div>
            ))}
          </div>
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",marginBottom:8,letterSpacing:".05em"}}>TESTS ORDERED</div>
            {(vOrd.items||[]).map((item:any)=>(
              <div key={item.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #e5e7eb"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:A}}/><span style={{fontSize:11,fontWeight:600,color:"#1e293b"}}>{item.test?.name||item.panel?.name||"—"}</span></div>
                <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:12,background:OS[item.status]?.bg||"#f8fafc",color:OS[item.status]?.c||"#64748b"}}>{item.status}</span>
              </div>
            ))}
          </div>
          {vOrd.clinicalNotes&&<div style={{padding:"10px 14px",background:"#f0fdf4",borderRadius:9,border:"1px solid #a7f3d0",marginBottom:10,fontSize:11,color:"#475569"}}><div style={{fontSize:9,fontWeight:700,color:A,marginBottom:3}}>CLINICAL NOTES</div>{vOrd.clinicalNotes}</div>}
        </div>
        <div className="mo-ft">
          <button onClick={()=>setVOrd(null)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer"}}>Close</button>
          <button onClick={()=>printReport({order:vOrd,status:"DRAFT",generatedAt:new Date()})} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#475569",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Download size={12}/>Download PDF</button>
        </div>
      </div>
    </div>}

    {/* Modal: Edit Order */}
    {editOrd&&<div className="ov" onClick={()=>setEditOrd(null)}>
      <div className="mo" style={{maxWidth:540}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#1e293b",display:"flex",alignItems:"center",gap:7}}><Pencil size={13} color="#ea580c"/>Edit Order — {editOrd.orderNo}</span><button onClick={()=>setEditOrd(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b">
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:9,padding:"10px 14px",marginBottom:12,fontSize:11,color:"#475569"}}>
            <div style={{fontWeight:700,color:"#1e293b",marginBottom:4}}>{editOrd.patient?.name||"—"} · {editOrd.orderNo}</div>
            <div style={{fontSize:10,color:"#94a3b8"}}>Edit order priority and clinical notes. To modify tests, please create a new order.</div>
          </div>
          <div style={{marginBottom:12}}>
            <Lbl>Priority</Lbl>
            <select value={editOrd.priority} onChange={(e:any)=>setEditOrd({...editOrd,priority:e.target.value})} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:11,outline:"none"}}>
              {Object.entries(PR).map(([k,v]:any)=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{marginBottom:12}}>
            <Lbl>Clinical Notes</Lbl>
            <textarea rows={4} value={editOrd.clinicalNotes||""} onChange={(e:any)=>setEditOrd({...editOrd,clinicalNotes:e.target.value})} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:11,outline:"none",resize:"vertical" as any,boxSizing:"border-box" as any}} placeholder="Add clinical notes or special instructions…"/>
          </div>
          {editOrdMsg&&<div style={{color:"#ef4444",fontSize:11,marginBottom:6}}>{editOrdMsg}</div>}
        </div>
        <div className="mo-ft">
          <button onClick={()=>setEditOrd(null)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer"}}>Cancel</button>
          <button onClick={async()=>{setEditOrdSaving(true);setEditOrdMsg("");try{const r=await fetch(`/api/pathology/orders/${editOrd.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({priority:editOrd.priority,clinicalNotes:editOrd.clinicalNotes})});if(!r.ok)throw new Error("Failed");await ldOrders();setEditOrd(null);}catch{setEditOrdMsg("Failed to update order");}finally{setEditOrdSaving(false);}}} disabled={editOrdSaving} style={{padding:"7px 16px",borderRadius:8,border:"none",background:editOrdSaving?"#94a3b8":"#ea580c",color:"#fff",fontSize:12,cursor:editOrdSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
            {editOrdSaving?<><Loader2 size={12} className="spin"/>Saving…</>:<><Save size={12}/>Save Changes</>}
          </button>
        </div>
      </div>
    </div>}

    {/* Modal: Delete Order Confirm */}
    {delOrd&&<div className="ov" onClick={()=>setDelOrd(null)}>
      <div className="mo" style={{maxWidth:400}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#b91c1c",display:"flex",alignItems:"center",gap:7}}><Trash2 size={14}/>Delete Order</span><button onClick={()=>setDelOrd(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b">
          <div style={{background:"#fff5f5",border:"1.5px solid #fecaca",borderRadius:10,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:"#1e293b",marginBottom:4}}>{delOrd.orderNo} — {delOrd.patient?.name||"—"}</div>
            <div style={{fontSize:11,color:"#ef4444",fontWeight:600,marginBottom:4}}>⚠️ This will permanently delete the lab order.</div>
            <div style={{fontSize:11,color:"#475569"}}>All associated test items, samples, and reports will be deleted. Patient data is <strong>not</strong> affected. This action cannot be undone.</div>
          </div>
        </div>
        <div className="mo-ft">
          <button onClick={()=>setDelOrd(null)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:12,cursor:"pointer"}}>Cancel</button>
          <button onClick={async()=>{setDelOrdL(true);try{const r=await fetch(`/api/pathology/orders/${delOrd.id}`,{method:"DELETE"});if(!r.ok)throw new Error("Failed");await ldOrders();setDelOrd(null);}catch{alert("Failed to delete order");}finally{setDelOrdL(false);}}} disabled={delOrdL} style={{padding:"7px 16px",borderRadius:8,border:"none",background:delOrdL?"#94a3b8":"#ef4444",color:"#fff",fontSize:12,cursor:delOrdL?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
            {delOrdL?<><Loader2 size={12} className="spin"/>Deleting…</>:<><Trash2 size={12}/>Delete Order</>}
          </button>
        </div>
      </div>
    </div>}

    {/* Modal: View Order Detail */}
    {selOrder&&<div className="ov" onClick={()=>setSelOrder(null)}>
      <div className="mo" style={{maxWidth:500}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#1e293b"}}>Order — {selOrder.orderNo}</span><button onClick={()=>setSelOrder(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b">
          <div className="g2" style={{marginBottom:10}}>
            <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>PATIENT</div><div style={{fontWeight:700,color:"#1e293b"}}>{selOrder.patient?.name||"—"}</div><div style={{fontSize:10,color:"#94a3b8"}}>{selOrder.patient?.patientId} · {selOrder.patient?.phone}</div></div>
            <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>STATUS</div><Bdg bg={OS[selOrder.status]?.bg} c={OS[selOrder.status]?.c} bd={OS[selOrder.status]?.bd}>{OS[selOrder.status]?.label||selOrder.status}</Bdg></div>
            <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>PRIORITY</div><Bdg bg={PR[selOrder.priority]?.bg} c={PR[selOrder.priority]?.c} bd={PR[selOrder.priority]?.bd}>{PR[selOrder.priority]?.label||selOrder.priority}</Bdg></div>
            <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>DOCTOR</div><div style={{fontSize:11,fontWeight:600,color:"#1e293b"}}>Dr. {selOrder.doctor?.name||"—"}</div></div>
          </div>
          {selOrder.clinicalNotes&&<div style={{marginBottom:10,padding:"8px 10px",background:"#f8fafc",borderRadius:8,fontSize:11,color:"#475569"}}><div style={{fontSize:9,fontWeight:700,color:"#94a3b8",marginBottom:3}}>CLINICAL NOTES</div>{selOrder.clinicalNotes}</div>}
          <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",marginBottom:6}}>TESTS ORDERED</div>
          {(selOrder.items||[]).map((item:any)=>(
            <div key={item.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f8fafc"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:A}}/><span style={{fontSize:11,fontWeight:600,color:"#1e293b"}}>{item.test?.name||item.panel?.name||"—"}</span></div>
              <Bdg bg={OS[item.status]?.bg||"#f8fafc"} c={OS[item.status]?.c||"#64748b"} bd={OS[item.status]?.bd||"#e2e8f0"}>{item.status}</Bdg>
            </div>
          ))}
          {selOrder.sample&&<div style={{marginTop:10,padding:"8px 10px",background:"#fffbeb",borderRadius:8}}><div style={{fontSize:9,fontWeight:700,color:"#94a3b8",marginBottom:3}}>SAMPLE</div><code style={{fontSize:10,fontWeight:700,color:"#b45309"}}>{selOrder.sample.barcodeId}</code> · {selOrder.sample.specimenType} · {SS[selOrder.sample.status]?.l||selOrder.sample.status}</div>}
        </div>
        <div className="mo-ft"><Btn onClick={()=>setSelOrder(null)} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}>Close</Btn></div>
      </div>
    </div>}

    {/* REFERRAL ORDER WIZARD */}
    {refWiz&&<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setRefWiz(null)}>
      <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:720,maxHeight:"90vh",display:"flex",flexDirection:"column" as any,overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,.22)"}} onClick={(e:any)=>e.stopPropagation()}>
        {/* Wizard header */}
        <div style={{padding:"14px 18px",background:GR,color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontSize:13,fontWeight:800}}>Lab Order Wizard — Doctor Referral</div>
            <div style={{fontSize:10,opacity:.85,marginTop:1}}>Dr. {refWiz.doctorName}{refWiz.doctorSpecialization?` · ${refWiz.doctorSpecialization}`:""}</div>
          </div>
          <button onClick={()=>setRefWiz(null)} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:6,padding:"4px 8px",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center"}}><X size={14}/></button>
        </div>
        {/* Step indicator */}
        <div style={{display:"flex",background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0",flexShrink:0}}>
          {[{n:1,l:"Patient & Referral"},{n:2,l:"Select Tests"},{n:3,l:"Confirm & Submit"}].map(s=>(
            <div key={s.n} onClick={()=>{if(s.n<wizStep||s.n===wizStep)setWizStep(s.n);}} style={{flex:1,padding:"10px 12px",display:"flex",alignItems:"center",gap:7,cursor:"pointer",borderBottom:`2.5px solid ${wizStep===s.n?A:"transparent"}`,background:wizStep===s.n?"#fff":"transparent"}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:wizStep>=s.n?A:"#e2e8f0",color:wizStep>=s.n?"#fff":"#94a3b8",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s.n}</div>
              <span style={{fontSize:10,fontWeight:700,color:wizStep===s.n?A:"#94a3b8"}}>{s.l}</span>
            </div>
          ))}
        </div>
        {/* Step content */}
        <div style={{flex:1,overflowY:"auto" as any,padding:"14px 18px"}}>

          {/* STEP 1: Patient & Referral Info */}
          {wizStep===1&&<>
            {/* Patient card */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1.5px solid #e2e8f0"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",marginBottom:6,letterSpacing:".06em"}}>PATIENT</div>
                <div style={{fontSize:14,fontWeight:800,color:"#1e293b",marginBottom:2}}>{refWiz.patientName}</div>
                <div style={{fontSize:10,fontWeight:700,color:A,marginBottom:4}}>{refWiz.patientUHID}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap" as any}}>
                  {refWiz.patientGender&&<span style={{fontSize:9,background:L,color:A,padding:"1px 6px",borderRadius:20,border:`1px solid ${B}`}}>{refWiz.patientGender}</span>}
                  {refWiz.patientDob&&<span style={{fontSize:9,background:L,color:A,padding:"1px 6px",borderRadius:20,border:`1px solid ${B}`}}>{calcAge(refWiz.patientDob)} yrs</span>}
                  {refWiz.patientBloodGroup&&<span style={{fontSize:9,background:"#fff5f5",color:"#b91c1c",padding:"1px 6px",borderRadius:20,border:"1px solid #fecaca"}}>{refWiz.patientBloodGroup}</span>}
                  {refWiz.patientPhone&&<span style={{fontSize:9,color:"#64748b"}}>{refWiz.patientPhone}</span>}
                </div>
              </div>
              <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1.5px solid #e2e8f0"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",marginBottom:6,letterSpacing:".06em"}}>REFERRAL INFO</div>
                <div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>Dr. {refWiz.doctorName}</div>
                {refWiz.doctorSpecialization&&<div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{refWiz.doctorSpecialization}</div>}
                <div style={{fontSize:10,color:"#475569"}}>Date: {refWiz.appointmentDate?new Date(refWiz.appointmentDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}</div>
              </div>
            </div>

            {/* Referral note */}
            {refWiz.referralNote&&<div style={{background:"#f0fdf4",border:"1.5px solid #a7f3d0",borderRadius:10,padding:"10px 14px",marginBottom:10}}>
              <div style={{fontSize:9,fontWeight:700,color:A,marginBottom:4,letterSpacing:".06em"}}>DOCTOR'S REFERRAL NOTE</div>
              <div style={{fontSize:11,color:"#1e293b",lineHeight:1.5}}>{refWiz.referralNote}</div>
            </div>}

            {/* Prescription block */}
            {refWiz.prescription&&<>
              {refWiz.prescription.chiefComplaint&&<div style={{marginBottom:8,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:9,padding:"9px 12px"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",marginBottom:2}}>CHIEF COMPLAINT</div>
                <div style={{fontSize:11,color:"#475569"}}>{refWiz.prescription.chiefComplaint}</div>
              </div>}
              {refWiz.prescription.diagnosis&&<div style={{marginBottom:8,background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:9,padding:"9px 12px"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#b45309",marginBottom:2}}>DIAGNOSIS</div>
                <div style={{fontSize:11,color:"#92400e",fontWeight:600}}>{refWiz.prescription.diagnosis}</div>
              </div>}
              {refWiz.prescription.vitals&&(()=>{const vt=fmtVitals(refWiz.prescription.vitals);return vt&&vt.length>0?(<div style={{marginBottom:8,background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:9,padding:"9px 12px"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#0369a1",marginBottom:6}}>VITALS</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:4}}>{vt.map(({label,val}:any)=>(<div key={label} style={{background:"#fff",border:"1px solid #bae6fd",borderRadius:7,padding:"4px 8px",textAlign:"center" as any}}><div style={{fontSize:8,color:"#0369a1",fontWeight:700,textTransform:"uppercase" as any}}>{label}</div><div style={{fontSize:12,fontWeight:800,color:"#0c4a6e"}}>{val}</div></div>))}</div>
              </div>):null;})()}
              {refWiz.prescription.labTests&&<div style={{marginBottom:8,background:"#faf5ff",border:"1.5px solid #e9d5ff",borderRadius:9,padding:"9px 12px"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#7c3aed",marginBottom:4}}>PRESCRIBED LAB TESTS</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap" as any}}>
                  {parseLabTestsText(refWiz.prescription.labTests).map((t:string,i:number)=>(
                    <span key={i} style={{fontSize:10,fontWeight:700,background:"#ede9fe",color:"#6d28d9",padding:"2px 8px",borderRadius:20,border:"1px solid #ddd6fe"}}>{t}</span>
                  ))}
                  {!parseLabTestsText(refWiz.prescription.labTests).length&&<span style={{fontSize:10,color:"#7c3aed"}}>{refWiz.prescription.labTests}</span>}
                </div>
              </div>}
              {refWiz.prescription.advice&&<div style={{marginBottom:8,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:9,padding:"9px 12px"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#94a3b8",marginBottom:2}}>DOCTOR'S ADVICE</div>
                <div style={{fontSize:11,color:"#475569"}}>{refWiz.prescription.advice}</div>
              </div>}
            </>}
            {!refWiz.prescription&&<div style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:9,padding:"10px 14px",fontSize:11,color:"#92400e"}}>No prescription linked to this referral. Tests will be selected manually in the next step.</div>}
          </>}

          {/* STEP 2: Test Selection */}
          {wizStep===2&&<>
            {/* Auto-suggested */}
            {wizItems.filter((i:any)=>i.isAuto).length>0&&<div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:800,color:A,marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                <span style={{background:A,color:"#fff",fontSize:8,fontWeight:800,padding:"1px 5px",borderRadius:3}}>AI</span>
                Auto-matched from prescription ({wizItems.filter((i:any)=>i.isAuto).length} tests)
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap" as any}}>
                {tests.filter((t:any)=>t.isActive).map((t:any)=>{const sel=!!wizItems.find((i:any)=>i.testId===t.id);const isAuto=!!wizItems.find((i:any)=>i.testId===t.id&&i.isAuto);return(
                  <button key={t.id} onClick={()=>wizToggleTest(t)} style={{padding:"4px 10px",borderRadius:6,border:`1.5px solid ${sel?(isAuto?A:"#7c3aed"):"#e2e8f0"}`,background:sel?(isAuto?L:"#faf5ff"):"#fff",color:sel?(isAuto?A:"#7c3aed"):"#64748b",fontSize:10,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>
                    {sel&&<Check size={9}/>}{t.name} <span style={{fontSize:8,color:sel?(isAuto?A:"#7c3aed"):"#94a3b8"}}>₹{t.price}</span>
                    {isAuto&&<span style={{fontSize:7,background:A,color:"#fff",padding:"0 4px",borderRadius:3}}>AUTO</span>}
                  </button>
                );})}
              </div>
            </div>}

            {/* All tests search */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#64748b",marginBottom:5}}>Add More Tests</div>
              <Inp placeholder="Search tests by name or code…" value={wizTestSearch} onChange={(e:any)=>setWizTestSearch(e.target.value)} style={{marginBottom:7}}/>
              <div style={{display:"flex",gap:5,flexWrap:"wrap" as any,maxHeight:120,overflowY:"auto" as any}}>
                {tests.filter((t:any)=>t.isActive&&(!wizTestSearch||(t.name.toLowerCase().includes(wizTestSearch.toLowerCase())||t.code.toLowerCase().includes(wizTestSearch.toLowerCase())))).map((t:any)=>{const sel=!!wizItems.find((i:any)=>i.testId===t.id);return(
                  <button key={t.id} onClick={()=>wizToggleTest(t)} style={{padding:"3px 8px",borderRadius:5,border:`1.5px solid ${sel?A:"#e2e8f0"}`,background:sel?L:"#fff",color:sel?A:"#475569",fontSize:10,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:3}}>
                    {sel&&<Check size={8}/>}{t.name}<span style={{fontSize:8,color:"#94a3b8"}}>({t.code}) ₹{t.price}</span>
                  </button>
                );})}
              </div>
            </div>

            {/* Panels */}
            {panels.filter((p:any)=>p.isActive).length>0&&<div style={{marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#64748b",marginBottom:5}}>Test Panels</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap" as any}}>
                {panels.filter((p:any)=>p.isActive).map((p:any)=>{const sel=!!wizItems.find((i:any)=>i.panelId===p.id);return(
                  <button key={p.id} onClick={()=>wizTogglePanel(p)} style={{padding:"4px 10px",borderRadius:6,border:`1.5px solid ${sel?"#7c3aed":"#e2e8f0"}`,background:sel?"#faf5ff":"#fff",color:sel?"#7c3aed":"#475569",fontSize:10,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>
                    {sel&&<Check size={9}/>}📋 {p.name} <span style={{fontSize:8,color:"#94a3b8"}}>₹{p.price}</span>
                  </button>
                );})}
              </div>
            </div>}

            {/* Selected summary */}
            {wizItems.length>0&&<div style={{background:"#f8fafc",borderRadius:9,padding:"8px 12px",border:"1.5px solid #e2e8f0"}}>
              <div style={{fontSize:9,fontWeight:700,color:"#64748b",marginBottom:5}}>SELECTED ({wizItems.length})</div>
              <div style={{display:"flex",flexDirection:"column" as any,gap:3}}>
                {wizItems.map((item:any,idx:number)=>(
                  <div key={idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",borderBottom:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:5,height:5,borderRadius:"50%",background:item.isAuto?A:"#7c3aed"}}/><span style={{fontSize:11,fontWeight:600,color:"#1e293b"}}>{item.name}</span>{item.isAuto&&<span style={{fontSize:7,background:A,color:"#fff",padding:"0 4px",borderRadius:3}}>AUTO</span>}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:11,fontWeight:700,color:A}}>₹{item.price}</span><button onClick={()=>{if(item.testId)wizToggleTest({id:item.testId,name:item.name,code:item.code,price:item.price});else wizTogglePanel({id:item.panelId,name:item.name,code:item.code,price:item.price});}} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:1}}><X size={10}/></button></div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:5,display:"flex",justifyContent:"flex-end",fontSize:12,fontWeight:800,color:A}}>Total: ₹{wizItems.reduce((s:number,i:any)=>s+(parseFloat(i.price)||0),0).toLocaleString("en-IN")}</div>
            </div>}
            {wizItems.length===0&&<div style={{textAlign:"center" as any,padding:20,color:"#94a3b8",fontSize:11}}>No tests selected yet. Check auto-suggestions above or search and add tests.</div>}
          </>}

          {/* STEP 3: Priority, Notes & Confirm */}
          {wizStep===3&&<>
            <div style={{marginBottom:12}}>
              <Lbl>Priority *</Lbl>
              <div style={{display:"flex",gap:7}}>
                {Object.entries(PR).map(([k,v]:any)=>(
                  <button key={k} onClick={()=>setWizPriority(k)} style={{flex:1,padding:"9px 10px",borderRadius:8,border:`2px solid ${wizPriority===k?v.c:v.bd}`,background:wizPriority===k?v.bg:"#fff",color:v.c,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                    {v.label}
                    {k==="STAT"&&<div style={{fontSize:8,color:v.c,marginTop:1}}>Immediate</div>}
                    {k==="URGENT"&&<div style={{fontSize:8,color:v.c,marginTop:1}}>{"<"}4 hrs</div>}
                    {k==="ROUTINE"&&<div style={{fontSize:8,color:"#94a3b8",marginTop:1}}>Standard</div>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:12}}><Lbl>Clinical Notes (pre-filled from prescription)</Lbl><textarea style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:11,outline:"none",resize:"vertical" as any,boxSizing:"border-box" as any}} rows={3} value={wizNotes} onChange={(e:any)=>setWizNotes(e.target.value)}/></div>

            {/* Billing Section */}
            <div style={{marginBottom:12}}>
              <Lbl>Billing / Payment Action</Lbl>
              <div style={{display:"flex",gap:7,marginBottom:8}}>
                {[
                  {k:"send_to_billing",l:"Send to Billing",d:"Reception/Admin will collect",bg:"#eff6ff",c:"#2563eb",bd:"#bfdbfe"},
                  {k:"collect_at_lab",l:"Collect at Lab",d:"Payment collected here",bg:"#f0fdf4",c:"#047857",bd:"#a7f3d0"},
                  {k:"defer",l:"Defer Billing",d:"Bill later",bg:"#f8fafc",c:"#64748b",bd:"#e2e8f0"},
                ].map(opt=>(
                  <button key={opt.k} onClick={()=>setWizBillingAction(opt.k)} style={{flex:1,padding:"8px 10px",borderRadius:8,border:`2px solid ${wizBillingAction===opt.k?opt.c:opt.bd}`,background:wizBillingAction===opt.k?opt.bg:"#fff",color:opt.c,fontSize:10,fontWeight:700,cursor:"pointer",textAlign:"left" as any}}>
                    <div>{opt.l}</div><div style={{fontSize:8,fontWeight:500,color:"#94a3b8",marginTop:2}}>{opt.d}</div>
                  </button>
                ))}
              </div>
              {wizBillingAction==="collect_at_lab"&&<div style={{display:"flex",gap:7}}>
                {["CASH","UPI","CARD","ONLINE"].map(m=>(
                  <button key={m} onClick={()=>setWizPayMethod(m)} style={{flex:1,padding:"6px",borderRadius:6,border:`1.5px solid ${wizPayMethod===m?A:B}`,background:wizPayMethod===m?L:"#fff",color:wizPayMethod===m?A:"#64748b",fontSize:10,fontWeight:600,cursor:"pointer"}}>{m}</button>
                ))}
              </div>}
              {wizBillingAction==="send_to_billing"&&<div style={{background:"#eff6ff",borderRadius:8,padding:"7px 10px",fontSize:10,color:"#2563eb"}}>Bill will be auto-created in the Billing section visible to Reception/Admin.</div>}
            </div>

            {/* Order summary */}
            <div style={{background:L,border:`1.5px solid ${B}`,borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:10,fontWeight:800,color:A,marginBottom:8}}>ORDER SUMMARY</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:8}}>
                <div><div style={{fontSize:8,color:"#94a3b8",fontWeight:700}}>PATIENT</div><div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>{refWiz.patientName} ({refWiz.patientUHID})</div></div>
                <div><div style={{fontSize:8,color:"#94a3b8",fontWeight:700}}>REFERRED BY</div><div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>Dr. {refWiz.doctorName}</div></div>
                <div><div style={{fontSize:8,color:"#94a3b8",fontWeight:700}}>PRIORITY</div><Bdg bg={PR[wizPriority]?.bg} c={PR[wizPriority]?.c} bd={PR[wizPriority]?.bd}>{PR[wizPriority]?.label}</Bdg></div>
                <div><div style={{fontSize:8,color:"#94a3b8",fontWeight:700}}>TESTS</div><div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>{wizItems.length} test{wizItems.length!==1?"s":""}</div></div>
              </div>
              <div style={{borderTop:"1px solid #a7f3d0",paddingTop:8}}>
                {wizItems.map((item:any,i:number)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#475569",padding:"1px 0"}}><span>{item.name}{item.isAuto&&<span style={{fontSize:7,background:A,color:"#fff",padding:"0 4px",borderRadius:3,marginLeft:4}}>AUTO</span>}</span><span style={{fontWeight:700}}>₹{item.price}</span></div>)}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:800,color:A,marginTop:6,borderTop:`1px solid ${B}`,paddingTop:5}}><span>Total</span><span>₹{wizItems.reduce((s:number,i:any)=>s+(parseFloat(i.price)||0),0).toLocaleString("en-IN")}</span></div>
              </div>
            </div>
          </>}
        </div>
        {/* Wizard footer */}
        <div style={{padding:"10px 18px",borderTop:"1.5px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"#f8fafc"}}>
          <Btn onClick={()=>wizStep>1?setWizStep(wizStep-1):setRefWiz(null)} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}>
            {wizStep===1?"Cancel":"← Back"}
          </Btn>
          <div style={{fontSize:10,color:"#94a3b8"}}>{wizItems.length} test{wizItems.length!==1?"s":""} · ₹{wizItems.reduce((s:number,i:any)=>s+(parseFloat(i.price)||0),0).toLocaleString("en-IN")}</div>
          {wizStep<3
            ?<Btn onClick={()=>{if(wizStep===2&&!wizItems.length)return alert("Select at least one test");setWizStep(wizStep+1);}} style={{background:A,color:"#fff",borderColor:A}}>Next →</Btn>
            :<Btn onClick={createOrderFromWizard} disabled={wizSaving||!wizItems.length} style={{background:wizSaving?"#94a3b8":A,color:"#fff",borderColor:A}}>{wizSaving?<><Loader2 size={12} className="spin"/>Creating Order…</>:<><CheckCircle2 size={12}/>Confirm &amp; Create Order</>}</Btn>
          }
        </div>
      </div>
    </div>}

    {/* Modal: Delete Confirm */}
    {delT&&<div className="ov" onClick={()=>setDelT(null)}>
      <div className="mo" style={{maxWidth:360}} onClick={(e:any)=>e.stopPropagation()}>
        <div className="mo-hd"><span style={{fontSize:14,fontWeight:800,color:"#b91c1c"}}>Confirm Delete</span><button onClick={()=>setDelT(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8"}}><X size={14}/></button></div>
        <div className="mo-b"><div style={{fontSize:12,color:"#475569"}}>Delete <strong>{delT.item.name}</strong>? This cannot be undone.</div></div>
        <div className="mo-ft"><Btn onClick={()=>setDelT(null)} style={{background:"#fff",color:"#64748b",borderColor:"#e2e8f0"}}>Cancel</Btn><Btn onClick={delItem} disabled={delL} style={{background:"#ef4444",color:"#fff",borderColor:"#ef4444"}}>{delL?<><Loader2 size={12} className="spin"/>Deleting…</>:"Delete"}</Btn></div>
      </div>
    </div>}
  </>);
}
