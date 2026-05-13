"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Search, X, Loader2, CheckCircle2, RefreshCw, IndianRupee, Activity, Calendar, Download,
  Eye, Pencil, Trash2, Plus, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  FileText, FileSpreadsheet, FileType, ShieldAlert, Info, Check,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType, TextRun, HeadingLevel } from "docx";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

interface TreatmentPlan {
  id: string; planName: string; totalSessions: number; completedSessions: number;
  status: string; totalCost: number; paidAmount: number; billingStatus: string;
  patient?: { id: string; patientId: string; name: string; phone: string } | null;
  service?: { id: string; name: string };
  doctor?: { id: string; name: string };
  department?: { id: string; name: string };
  sessions?: any[];
  createdAt: string;
}

export default function TreatmentPlanPanel() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [sessionUpdating, setSessionUpdating] = useState<string | null>(null);
  const [planUpdating, setPlanUpdating] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMsg, setPaymentMsg] = useState("");
  const [schedulingSession, setSchedulingSession] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  // Enhanced state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewItem, setViewItem] = useState<TreatmentPlan | null>(null);
  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ planName: "", serviceId: "", departmentId: "", doctorId: "", totalSessions: 1, totalCost: 0, startDate: "", endDate: "", notes: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter) params.append("status", statusFilter);
    const d = await api(`/api/treatment-plans?${params.toString()}`);
    if (d.success) setPlans(d.data.plans || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Load dropdown data when add modal opens
  useEffect(() => {
    if (!showAdd) return;
    api("/api/services").then(d => { if (d.success) setServices(d.data?.services || d.data || []); });
    api("/api/departments").then(d => { if (d.success) setDepartments(d.data?.departments || d.data || []); });
    api("/api/doctors").then(d => { if (d.success) setDoctors(d.data?.doctors || d.data || []); });
  }, [showAdd]);

  const openAddModal = () => {
    setAddForm({ planName: "", serviceId: "", departmentId: "", doctorId: "", totalSessions: 1, totalCost: 0, startDate: "", endDate: "", notes: "" });
    setAddError("");
    setShowAdd(true);
  };

  const handleServiceSelect = (serviceId: string) => {
    setAddForm(f => ({ ...f, serviceId }));
    const svc = services.find((s: any) => s.id === serviceId);
    if (svc) {
      setAddForm(f => ({ ...f, planName: f.planName || svc.name, totalSessions: svc.sessionCount || f.totalSessions, totalCost: svc.price || f.totalCost }));
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.planName.trim()) { setAddError("Plan name is required"); return; }
    setAddSaving(true); setAddError("");
    const body: any = { ...addForm, totalSessions: Number(addForm.totalSessions), totalCost: Number(addForm.totalCost) };
    if (!body.serviceId) delete body.serviceId;
    if (!body.departmentId) delete body.departmentId;
    if (!body.doctorId) delete body.doctorId;
    if (!body.startDate) delete body.startDate;
    if (!body.endDate) delete body.endDate;
    if (!body.notes) delete body.notes;
    const d = await api("/api/treatment-plans", "POST", body);
    if (d.success) { setShowAdd(false); load(); }
    else setAddError(d.message || "Failed to create plan");
    setAddSaving(false);
  };

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === plans.length ? new Set() : new Set(plans.map(p => p.id)));
  };

  // Sort
  const handleSort = (col: string) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };
  const sorted = [...plans].sort((a: any, b: any) => {
    let va = a[sortBy], vb = b[sortBy];
    if (sortBy === "patient") { va = a.patient?.name || ""; vb = b.patient?.name || ""; }
    if (sortBy === "doctor") { va = a.doctor?.name || ""; vb = b.doctor?.name || ""; }
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return sortOrder === "asc" ? -1 : 1;
    if (va > vb) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Export
  const getExportData = () => {
    const src = selectedIds.size > 0 ? plans.filter(p => selectedIds.has(p.id)) : plans;
    return src.map(p => ({
      Patient: p.patient?.name || "-", "Patient ID": p.patient?.patientId || "-",
      "Plan Name": p.planName, Service: p.service?.name || "-",
      Progress: `${p.completedSessions}/${p.totalSessions}`,
      "Total Cost": `₹${p.totalCost}`, Paid: `₹${p.paidAmount}`,
      Billing: p.billingStatus, Status: p.status, Doctor: p.doctor?.name || "-",
    }));
  };
  const exportPDF = () => {
    const doc = new jsPDF(); const rows = getExportData(); const keys = Object.keys(rows[0] || {});
    doc.setFontSize(16); doc.text("Treatment Plans", 14, 18);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 25);
    autoTable(doc, { startY: 30, head: [keys], body: rows.map(r => keys.map(k => (r as any)[k])), styles: { fontSize: 8 }, headStyles: { fillColor: [14, 137, 143] } });
    doc.save("treatment-plans.pdf"); setShowExport(false);
  };
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Treatment Plans");
    XLSX.writeFile(wb, "treatment-plans.xlsx"); setShowExport(false);
  };
  const exportWord = async () => {
    const rows = getExportData(); const keys = Object.keys(rows[0] || {});
    const headerRow = new TableRow({ children: keys.map(k => new TableCell({ width: { size: 100 / keys.length, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 18, font: "Calibri" })] })] })) });
    const dataRows = rows.map(r => new TableRow({ children: keys.map(k => new TableCell({ width: { size: 100 / keys.length, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: String((r as any)[k] ?? "-"), size: 18, font: "Calibri" })] })] })) }));
    const docx = new Document({ sections: [{ children: [new Paragraph({ text: "Treatment Plans", heading: HeadingLevel.HEADING_1 }), new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } })] }] });
    const blob = await Packer.toBlob(docx); saveAs(blob, "treatment-plans.docx"); setShowExport(false);
  };

  const viewDetails = async (plan: TreatmentPlan) => {
    const d = await api(`/api/treatment-plans/${plan.id}`);
    if (d.success) { setSelectedPlan(d.data); setDetailModal(true); setPaymentMsg(""); setPaymentAmount(""); }
  };
  const refreshPlan = async () => {
    if (!selectedPlan) return;
    const d = await api(`/api/treatment-plans/${selectedPlan.id}`);
    if (d.success) setSelectedPlan(d.data);
    load();
  };
  const markSession = async (sessionId: string, status: "COMPLETED" | "MISSED") => {
    setSessionUpdating(sessionId);
    await api(`/api/treatment-plans/${selectedPlan!.id}/sessions/${sessionId}`, "PUT", { status, completedDate: status === "COMPLETED" ? new Date().toISOString() : undefined });
    await refreshPlan(); setSessionUpdating(null);
  };
  const scheduleSession = async (sessionId: string, date: string) => {
    if (!date) return;
    setSessionUpdating(sessionId);
    const d = await api(`/api/treatment-plans/${selectedPlan!.id}/sessions/${sessionId}`, "PUT", { scheduledDate: date });
    if (d.success) { await refreshPlan(); setSchedulingSession(null); setScheduleDate(""); }
    setSessionUpdating(null);
  };
  const updatePlanStatus = async (status: string) => {
    if (!selectedPlan) return;
    setPlanUpdating(true);
    await api(`/api/treatment-plans/${selectedPlan.id}`, "PUT", { status });
    await refreshPlan(); setPlanUpdating(false);
  };
  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !paymentAmount) return;
    setPlanUpdating(true); setPaymentMsg("");
    const newPaid = (selectedPlan.paidAmount || 0) + Number(paymentAmount);
    const billingStatus = newPaid >= selectedPlan.totalCost ? "PAID" : "PARTIAL";
    const d = await api(`/api/treatment-plans/${selectedPlan.id}`, "PUT", { paidAmount: newPaid, billingStatus });
    if (d.success) { await refreshPlan(); setPaymentAmount(""); setPaymentMsg("Payment recorded"); }
    else setPaymentMsg(d.message || "Failed");
    setPlanUpdating(false);
  };

  const getStatusColor = (s: string) => ({ ACTIVE: "blue", COMPLETED: "green", CANCELLED: "red", ON_HOLD: "yellow" }[s] || "gray");
  const getBillingColor = (s: string) => ({ PAID: "green", PARTIAL: "yellow", PENDING: "red" }[s] || "gray");
  const progress = (p: TreatmentPlan) => p.totalSessions > 0 ? (p.completedSessions / p.totalSessions) * 100 : 0;

  const SortIcon = ({ col }: { col: string }) => (
    <span className={`tp-sort-icon ${sortBy === col ? "active" : ""}`}>
      {sortBy === col ? (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
    </span>
  );

  return (
    <div>
      <style>{`
        .tp-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap}
        .tp-toolbar-left{display:flex;flex-direction:column;gap:2px;min-width:0}
        .tp-toolbar-left h2{margin:0;font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
        .tp-toolbar-left p{margin:0;font-size:13px;color:#94a3b8;line-height:1.3}
        .tp-toolbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .tp-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:240px}
        .tp-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .tp-search-input::placeholder{color:#94a3b8}
        .tp-btn-primary{padding:10px 20px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(14,137,143,.25);transition:all .15s;white-space:nowrap}
        .tp-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
        .tp-btn-ghost{padding:8px 14px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px}
        .tp-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}
        .tp-filter-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;flex-wrap:wrap}
        .tp-filter-select{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:12px;color:#334155;background:#fff;outline:none;cursor:pointer}
        .tp-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .tp-tbl{width:100%;border-collapse:collapse}
        .tp-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
        .tp-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc}
        .tp-tbl tr:last-child td{border-bottom:none}
        .tp-tbl tbody tr:hover td{background:#fafbfc}
        .tp-th-sort{cursor:pointer;user-select:none}.tp-th-sort:hover{color:#0E898F}
        .tp-sort-icon{display:inline-flex;margin-left:4px;vertical-align:middle;color:#cbd5e1}.tp-sort-icon.active{color:#0E898F}
        .tp-checkbox{width:16px;height:16px;accent-color:#0E898F;cursor:pointer}
        .tp-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .tp-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .tp-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .tp-badge.blue{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
        .tp-badge.yellow{background:#fefce8;color:#ca8a04;border:1px solid #fef08a}
        .tp-badge.gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
        .tp-progress{width:100%;height:6px;background:#f1f5f9;border-radius:100px;overflow:hidden}
        .tp-progress-fill{height:100%;background:linear-gradient(90deg,#0E898F,#10b981);border-radius:100px;transition:width .3s}
        .tp-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
        .tp-view{background:#f0f9ff;color:#2563eb}.tp-view:hover{background:#dbeafe}
        .tp-edit{background:#E6F4F4;color:#0E898F}.tp-edit:hover{background:#B3E0E0}
        .tp-export-wrap{position:relative}
        .tp-export-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:500;cursor:pointer}
        .tp-export-btn:hover{border-color:#cbd5e1;background:#f8fafc}
        .tp-export-dd{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:50;min-width:180px;padding:6px}
        .tp-export-item{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:8px;border:none;background:none;width:100%;cursor:pointer;font-size:13px;color:#334155;font-weight:500}
        .tp-export-item:hover{background:#f1f5f9}
        .tp-export-item .eicon{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center}
        .tp-export-item .eicon.pdf{background:#fff5f5;color:#ef4444}
        .tp-export-item .eicon.xls{background:#f0fdf4;color:#16a34a}
        .tp-export-item .eicon.doc{background:#eff6ff;color:#2563eb}
        .tp-export-item .eicon.csv{background:#fefce8;color:#ca8a04}
        .tp-selected-bar{display:flex;align-items:center;gap:12px;padding:10px 16px;background:#E6F4F4;border:1px solid #B3E0E0;border-radius:10px;margin-bottom:12px;font-size:13px;color:#0A6B70;font-weight:600}
        .tp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .tp-modal{background:#fff;border-radius:18px;padding:24px;width:100%;max-width:800px;box-shadow:0 20px 60px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto}
        .tp-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
        .tp-modal-title{font-size:17px;font-weight:800;color:#1e293b}
        .tp-stat-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px}
        .tp-stat-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
        .tp-stat-label{font-size:12px;color:#64748b;font-weight:600}
        .tp-stat-value{font-size:16px;color:#1e293b;font-weight:700}
        .tp-session-list{margin-top:16px}
        .tp-session-item{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
        .tp-session-num{width:32px;height:32px;border-radius:50%;background:#E6F4F4;color:#0E898F;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px}
        .tp-action-btn{padding:5px 12px;border-radius:7px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s}
        .tp-section-title{font-size:13px;font-weight:700;color:#1e293b;margin:16px 0 10px}
        .tp-pay-form{display:flex;gap:8px;align-items:center;margin-top:8px}
        .tp-pay-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:13px;color:#1e293b;outline:none;flex:1}
        .tp-pay-btn{padding:8px 16px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:12px;font-weight:700;cursor:pointer}
        .tp-status-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
        .tp-view-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:4px 0}
        .tp-view-item{display:flex;flex-direction:column;gap:3px}
        .tp-view-item.full{grid-column:1/-1}
        .tp-view-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
        .tp-view-value{font-size:14px;color:#1e293b;font-weight:500}
        @keyframes spin{to{transform:rotate(360deg)}}
        .tp-spin{animation:spin .7s linear infinite}
        .tp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
        .tp-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
        .tp-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .tp-form-group{display:flex;flex-direction:column;gap:5px}
        .tp-form-group.full{grid-column:1/-1}
        .tp-form-label{font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.03em}
        .tp-form-input{padding:10px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;outline:none;background:#f8fafc;transition:border-color .15s}
        .tp-form-input:focus{border-color:#0E898F;background:#fff}
        .tp-form-textarea{padding:10px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;outline:none;background:#f8fafc;resize:vertical;min-height:70px;font-family:inherit;transition:border-color .15s}
        .tp-form-textarea:focus{border-color:#0E898F;background:#fff}
        .tp-form-select{padding:10px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:13px;color:#1e293b;outline:none;background:#f8fafc;cursor:pointer;transition:border-color .15s}
        .tp-form-select:focus{border-color:#0E898F;background:#fff}
        .tp-patient-search{position:relative}
        .tp-patient-dd{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:60;max-height:220px;overflow-y:auto}
        .tp-patient-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid #f8fafc;transition:background .1s}
        .tp-patient-item:hover{background:#f0fdfa}
        .tp-patient-item:last-child{border-bottom:none}
        .tp-patient-selected{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#E6F4F4;border:1.5px solid #B3E0E0;border-radius:10px}
        .tp-form-error{color:#ef4444;font-size:12px;font-weight:600;margin-top:4px;padding:8px 12px;background:#fff5f5;border:1px solid #fecaca;border-radius:8px}
        .tp-form-hint{font-size:11px;color:#94a3b8;margin-top:2px}
      `}</style>

      {/* Toolbar */}
      <div className="tp-toolbar">
        <div className="tp-toolbar-left">
          <h2>Treatment Plans</h2>
          <p>Manage patient treatment plans, sessions and billing</p>
        </div>
        <div className="tp-toolbar-right">
          <button className="tp-btn-ghost" onClick={() => setShowFilters(f => !f)}>
            <Filter size={13} />{showFilters ? "Hide Filters" : "Filters"}
          </button>
          <div className="tp-search-wrap">
            <Search size={14} color="#94a3b8" />
            <input className="tp-search-input" placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="tp-btn-primary" onClick={openAddModal}>
            <Plus size={14} />Add Plan
          </button>
          <div className="tp-export-wrap">
            <button className="tp-export-btn" onClick={() => setShowExport(e => !e)}>
              <Download size={13} />Export
            </button>
            {showExport && (
              <div className="tp-export-dd">
                <button className="tp-export-item" onClick={exportPDF}><span className="eicon pdf"><FileText size={13} /></span>PDF Document</button>
                <button className="tp-export-item" onClick={exportExcel}><span className="eicon xls"><FileSpreadsheet size={13} /></span>Excel Spreadsheet</button>
                <button className="tp-export-item" onClick={exportWord}><span className="eicon doc"><FileType size={13} /></span>Word Document</button>
                <button className="tp-export-item" onClick={() => {
                  const params = new URLSearchParams();
                  if (statusFilter) params.append("status", statusFilter);
                  window.open(`/api/treatment-plans/export?${params.toString()}`, "_blank");
                  setShowExport(false);
                }}><span className="eicon csv"><Download size={13} /></span>CSV Export</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="tp-filter-row">
          <select className="tp-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {statusFilter && (
            <button className="tp-btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => setStatusFilter("")}>Clear</button>
          )}
        </div>
      )}

      {/* Selected bar */}
      {selectedIds.size > 0 && (
        <div className="tp-selected-bar">
          <Check size={14} />
          {selectedIds.size} plan{selectedIds.size > 1 ? "s" : ""} selected
          <button className="tp-btn-ghost" style={{ padding: "4px 10px", fontSize: 12, marginLeft: "auto" }} onClick={() => setSelectedIds(new Set())}>Clear</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="tp-loading"><Loader2 size={20} className="tp-spin" />Loading treatment plans...</div>
      ) : plans.length === 0 ? (
        <div className="tp-empty">No treatment plans found.</div>
      ) : (
        <div className="tp-tbl-wrap">
          <table className="tp-tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" className="tp-checkbox" checked={plans.length > 0 && selectedIds.size === plans.length} ref={(el: HTMLInputElement | null) => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < plans.length; }} onChange={toggleSelectAll} />
                </th>
                <th className="tp-th-sort" onClick={() => handleSort("patient")}>Patient<SortIcon col="patient" /></th>
                <th className="tp-th-sort" onClick={() => handleSort("planName")}>Plan Name<SortIcon col="planName" /></th>
                <th>Progress</th>
                <th className="tp-th-sort" onClick={() => handleSort("totalCost")}>Cost<SortIcon col="totalCost" /></th>
                <th>Billing</th>
                <th className="tp-th-sort" onClick={() => handleSort("status")}>Status<SortIcon col="status" /></th>
                <th className="tp-th-sort" onClick={() => handleSort("doctor")}>Doctor<SortIcon col="doctor" /></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(plan => (
                <tr key={plan.id} style={selectedIds.has(plan.id) ? { background: "#f0fdfa" } : undefined}>
                  <td><input type="checkbox" className="tp-checkbox" checked={selectedIds.has(plan.id)} onChange={() => toggleSelect(plan.id)} /></td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{plan.patient?.name || <span style={{ color: "#94a3b8" }}>-</span>}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{plan.patient?.patientId || "-"}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{plan.planName}</div>
                    {plan.service && <div style={{ fontSize: 11, color: "#94a3b8" }}>{plan.service.name}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                      {plan.completedSessions}/{plan.totalSessions} sessions
                    </div>
                    <div className="tp-progress">
                      <div className="tp-progress-fill" style={{ width: `${progress(plan)}%` }} />
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>₹{plan.totalCost.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#10b981" }}>Paid: ₹{plan.paidAmount.toLocaleString()}</div>
                  </td>
                  <td><span className={`tp-badge ${getBillingColor(plan.billingStatus)}`}>{plan.billingStatus}</span></td>
                  <td><span className={`tp-badge ${getStatusColor(plan.status)}`}>{plan.status}</span></td>
                  <td><div style={{ fontSize: 12 }}>{plan.doctor?.name || <span style={{ color: "#94a3b8" }}>-</span>}</div></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="tp-icon-btn tp-view" onClick={() => setViewItem(plan)} title="Quick View"><Eye size={13} /></button>
                      <button className="tp-icon-btn tp-edit" onClick={() => viewDetails(plan)} title="Manage Plan"><Pencil size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick View Modal */}
      {viewItem && (
        <div className="tp-overlay" onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div className="tp-modal" style={{ maxWidth: 560 }}>
            <div className="tp-modal-head">
              <span className="tp-modal-title">Treatment Plan Details</span>
              <button onClick={() => setViewItem(null)} className="tp-icon-btn"><X size={16} /></button>
            </div>
            <div className="tp-view-grid">
              <div className="tp-view-item"><span className="tp-view-label">Patient</span><span className="tp-view-value">{viewItem.patient?.name || "-"}</span></div>
              <div className="tp-view-item"><span className="tp-view-label">Patient ID</span><span className="tp-view-value">{viewItem.patient?.patientId || "-"}</span></div>
              <div className="tp-view-item"><span className="tp-view-label">Plan Name</span><span className="tp-view-value">{viewItem.planName}</span></div>
              <div className="tp-view-item"><span className="tp-view-label">Service</span><span className="tp-view-value">{viewItem.service?.name || "-"}</span></div>
              <div className="tp-view-item"><span className="tp-view-label">Sessions</span><span className="tp-view-value">{viewItem.completedSessions}/{viewItem.totalSessions}</span></div>
              <div className="tp-view-item"><span className="tp-view-label">Status</span><span className="tp-view-value"><span className={`tp-badge ${getStatusColor(viewItem.status)}`}>{viewItem.status}</span></span></div>
              <div className="tp-view-item"><span className="tp-view-label">Total Cost</span><span className="tp-view-value">₹{viewItem.totalCost.toLocaleString()}</span></div>
              <div className="tp-view-item"><span className="tp-view-label">Paid</span><span className="tp-view-value" style={{ color: "#10b981" }}>₹{viewItem.paidAmount.toLocaleString()}</span></div>
              <div className="tp-view-item"><span className="tp-view-label">Balance</span><span className="tp-view-value" style={{ color: "#ef4444" }}>₹{(viewItem.totalCost - viewItem.paidAmount).toLocaleString()}</span></div>
              <div className="tp-view-item"><span className="tp-view-label">Billing</span><span className="tp-view-value"><span className={`tp-badge ${getBillingColor(viewItem.billingStatus)}`}>{viewItem.billingStatus}</span></span></div>
              <div className="tp-view-item"><span className="tp-view-label">Doctor</span><span className="tp-view-value">{viewItem.doctor?.name || "-"}</span></div>
              <div className="tp-view-item"><span className="tp-view-label">Department</span><span className="tp-view-value">{viewItem.department?.name || "-"}</span></div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button className="tp-btn-primary" onClick={() => { viewDetails(viewItem); setViewItem(null); }}>
                <Pencil size={13} />Manage Plan & Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail / Session Management Modal */}
      {detailModal && selectedPlan && (
        <div className="tp-overlay" onClick={(e) => e.target === e.currentTarget && setDetailModal(false)}>
          <div className="tp-modal">
            <div className="tp-modal-head">
              <span className="tp-modal-title">{selectedPlan.planName}</span>
              <button onClick={() => setDetailModal(false)} className="tp-icon-btn"><X size={16} /></button>
            </div>

            <div className="tp-stat-card">
              <div className="tp-stat-row"><span className="tp-stat-label">Patient</span><span className="tp-stat-value">{selectedPlan.patient?.name || "-"}</span></div>
              <div className="tp-stat-row"><span className="tp-stat-label">Patient ID</span><span className="tp-stat-value">{selectedPlan.patient?.patientId || "-"}</span></div>
              <div className="tp-stat-row"><span className="tp-stat-label">Phone</span><span className="tp-stat-value">{selectedPlan.patient?.phone || "-"}</span></div>
            </div>

            <div className="tp-stat-card">
              <div className="tp-stat-row"><span className="tp-stat-label">Total Sessions</span><span className="tp-stat-value">{selectedPlan.totalSessions}</span></div>
              <div className="tp-stat-row"><span className="tp-stat-label">Completed</span><span className="tp-stat-value" style={{ color: "#10b981" }}>{selectedPlan.completedSessions}</span></div>
              <div className="tp-stat-row"><span className="tp-stat-label">Remaining</span><span className="tp-stat-value" style={{ color: "#f59e0b" }}>{selectedPlan.totalSessions - selectedPlan.completedSessions}</span></div>
            </div>

            <div className="tp-stat-card">
              <div className="tp-stat-row"><span className="tp-stat-label">Total Cost</span><span className="tp-stat-value">₹{selectedPlan.totalCost.toLocaleString()}</span></div>
              <div className="tp-stat-row"><span className="tp-stat-label">Paid Amount</span><span className="tp-stat-value" style={{ color: "#10b981" }}>₹{selectedPlan.paidAmount.toLocaleString()}</span></div>
              <div className="tp-stat-row"><span className="tp-stat-label">Balance</span><span className="tp-stat-value" style={{ color: "#ef4444" }}>₹{(selectedPlan.totalCost - selectedPlan.paidAmount).toLocaleString()}</span></div>
            </div>

            <div className="tp-section-title">Plan Status</div>
            <div className="tp-status-bar">
              {["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"].map(s => (
                <button key={s} disabled={planUpdating || selectedPlan.status === s}
                  onClick={() => updatePlanStatus(s)}
                  className="tp-action-btn"
                  style={{ background: selectedPlan.status === s ? "#0E898F" : "#f8fafc", color: selectedPlan.status === s ? "#fff" : "#64748b", border: `1.5px solid ${selectedPlan.status === s ? "#0E898F" : "#e2e8f0"}` }}>
                  {planUpdating && selectedPlan.status !== s ? <Loader2 size={10} style={{ animation: "spin .7s linear infinite" }} /> : s}
                </button>
              ))}
            </div>

            <div className="tp-section-title"><IndianRupee size={13} style={{ display: "inline", marginRight: 4 }} />Record Payment</div>
            <form onSubmit={recordPayment} className="tp-pay-form">
              <input type="number" className="tp-pay-input" placeholder="Amount (₹)" min="1" max={selectedPlan.totalCost - selectedPlan.paidAmount} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              <button type="submit" className="tp-pay-btn" disabled={planUpdating || !paymentAmount}>
                {planUpdating ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : "Record"}
              </button>
            </form>
            {paymentMsg && <div style={{ fontSize: 11, color: paymentMsg === "Payment recorded" ? "#16a34a" : "#ef4444", marginTop: 6, fontWeight: 600 }}>{paymentMsg}</div>}

            {selectedPlan.sessions && selectedPlan.sessions.length > 0 && (
              <div className="tp-session-list">
                <div className="tp-section-title">Sessions</div>
                {selectedPlan.sessions.map((session: any) => (
                  <div key={session.id} className="tp-session-item">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <div className="tp-session-num">{session.sessionNumber}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Session {session.sessionNumber}</div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                          {session.scheduledDate && <span style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10}/>{new Date(session.scheduledDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</span>}
                          {session.completedDate && <span style={{ fontSize: 11, color: "#10b981" }}>✓ {new Date(session.completedDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</span>}
                          {session.performedBy && <span style={{ fontSize: 11, color: "#6366f1" }}>By: {session.performedBy}</span>}
                          {session.notes && <span style={{ fontSize: 11, color: "#94a3b8", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.notes}</span>}
                        </div>
                        {schedulingSession === session.id && (
                          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                              style={{ padding: "4px 8px", borderRadius: 7, border: "1.5px solid #bfdbfe", fontSize: 12, background: "#eff6ff", outline: "none", color: "#1d4ed8" }}/>
                            <button onClick={() => scheduleSession(session.id, scheduleDate)} disabled={!scheduleDate || sessionUpdating === session.id}
                              style={{ padding: "4px 10px", borderRadius: 7, border: "none", background: "#0E898F", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Set</button>
                            <button onClick={() => setSchedulingSession(null)} style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, cursor: "pointer", color: "#64748b" }}>✕</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span className={`tp-badge ${getStatusColor(session.status)}`}>{session.status}</span>
                      {session.status !== "COMPLETED" && session.status !== "CANCELLED" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button title="Mark Completed" disabled={sessionUpdating === session.id}
                            onClick={() => markSession(session.id, "COMPLETED")}
                            className="tp-action-btn" style={{ background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #bbf7d0" }}>
                            {sessionUpdating === session.id ? <Loader2 size={10} className="tp-spin" /> : <CheckCircle2 size={11} />}
                          </button>
                          <button title="Schedule Date" disabled={sessionUpdating === session.id}
                            onClick={() => { setSchedulingSession(session.id); setScheduleDate(session.scheduledDate ? session.scheduledDate.split("T")[0] : ""); }}
                            className="tp-action-btn" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1.5px solid #bfdbfe" }}>
                            <Calendar size={11} />
                          </button>
                          <button title="Mark Missed" disabled={sessionUpdating === session.id}
                            onClick={() => markSession(session.id, "MISSED")}
                            className="tp-action-btn" style={{ background: "#fff7ed", color: "#c2410c", border: "1.5px solid #fed7aa" }}>
                            {sessionUpdating === session.id ? <Loader2 size={10} className="tp-spin" /> : <RefreshCw size={11} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Add Treatment Plan Modal */}
      {showAdd && (
        <div className="tp-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="tp-modal" style={{ maxWidth: 640 }}>
            <div className="tp-modal-head">
              <span className="tp-modal-title">Add Treatment Plan</span>
              <button onClick={() => setShowAdd(false)} className="tp-icon-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="tp-form-grid">
                {/* Plan Name */}
                <div className="tp-form-group full">
                  <label className="tp-form-label">Plan Name *</label>
                  <input className="tp-form-input" placeholder="e.g. Root Canal Treatment" value={addForm.planName} onChange={e => setAddForm(f => ({ ...f, planName: e.target.value }))} />
                </div>

                {/* Service */}
                <div className="tp-form-group">
                  <label className="tp-form-label">Service</label>
                  <select className="tp-form-select" value={addForm.serviceId} onChange={e => handleServiceSelect(e.target.value)}>
                    <option value="">Select service...</option>
                    {services.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {/* Department */}
                <div className="tp-form-group">
                  <label className="tp-form-label">Department</label>
                  <select className="tp-form-select" value={addForm.departmentId} onChange={e => setAddForm(f => ({ ...f, departmentId: e.target.value }))}>
                    <option value="">Select department...</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Doctor */}
                <div className="tp-form-group">
                  <label className="tp-form-label">Doctor</label>
                  <select className="tp-form-select" value={addForm.doctorId} onChange={e => setAddForm(f => ({ ...f, doctorId: e.target.value }))}>
                    <option value="">Select doctor...</option>
                    {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Total Sessions */}
                <div className="tp-form-group">
                  <label className="tp-form-label">Total Sessions</label>
                  <input type="number" className="tp-form-input" min={1} value={addForm.totalSessions} onChange={e => setAddForm(f => ({ ...f, totalSessions: Number(e.target.value) || 1 }))} />
                </div>

                {/* Total Cost */}
                <div className="tp-form-group">
                  <label className="tp-form-label">Total Cost (₹)</label>
                  <input type="number" className="tp-form-input" min={0} value={addForm.totalCost} onChange={e => setAddForm(f => ({ ...f, totalCost: Number(e.target.value) || 0 }))} />
                </div>

                {/* Start Date */}
                <div className="tp-form-group">
                  <label className="tp-form-label">Start Date</label>
                  <input type="date" className="tp-form-input" value={addForm.startDate} onChange={e => setAddForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>

                {/* End Date */}
                <div className="tp-form-group">
                  <label className="tp-form-label">End Date</label>
                  <input type="date" className="tp-form-input" value={addForm.endDate} onChange={e => setAddForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>

                {/* Notes */}
                <div className="tp-form-group full">
                  <label className="tp-form-label">Notes</label>
                  <textarea className="tp-form-textarea" placeholder="Optional notes..." value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              {addError && <div className="tp-form-error">{addError}</div>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" className="tp-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="tp-btn-primary" disabled={addSaving}>
                  {addSaving ? <><Loader2 size={14} className="tp-spin" />Creating...</> : <><Plus size={14} />Create Plan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
