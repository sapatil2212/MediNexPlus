"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Search, X, Loader2, Package, DollarSign, Calendar, Clock, Pill, FlaskConical,
  Eye, Download, ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet, FileType,
  ShieldAlert, Info, Filter, Check, ChevronLeft, ChevronRight, AlertTriangle
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

interface Service {
  id: string; name: string; code?: string; description?: string; category: string;
  sessionCount: number; price: number; pricePerSession: number;
  duration?: number; validityDays?: number;
  requiresPharmacy: boolean; requiresLab: boolean; isActive: boolean;
  department?: { id: string; name: string };
  subDepartment?: { id: string; name: string };
  _count?: { treatmentPlans: number };
}

const CATEGORIES = [
  { value: "PACKAGE", label: "Package" },
  { value: "COURSE", label: "Course" },
  { value: "BUNDLE", label: "Bundle" },
  { value: "SINGLE", label: "Single Service" },
];

export default function ServicePanel() {
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState<any>({
    name: "", code: "", description: "", category: "PACKAGE",
    departmentId: "", subDepartmentId: "", sessionCount: 1,
    price: 0, pricePerSession: 0, duration: 30, validityDays: 180,
    requiresPharmacy: false, requiresLab: false, isActive: true,
  });

  // Enhanced state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewItem, setViewItem] = useState<Service | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showExport, setShowExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  // Custom category
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterCategory) params.set("category", filterCategory);
    if (filterStatus) params.set("isActive", filterStatus);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const [servicesRes, deptsRes] = await Promise.all([
      api(`/api/config/services${qs}`),
      api("/api/config/departments?simple=true"),
    ]);
    if (servicesRes.success) setServices(servicesRes.data.services || []);
    if (deptsRes.success) setDepartments(deptsRes.data || []);
    setLoading(false);
  }, [search, filterCategory, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (form.departmentId) {
      api(`/api/config/subdepartments?departmentId=${form.departmentId}&limit=100`).then((d) => {
        if (d.success) setSubDepartments(d.data?.data || d.data || []);
      });
    } else { setSubDepartments([]); }
  }, [form.departmentId]);

  useEffect(() => {
    if (form.price && form.sessionCount) {
      setForm((p: any) => ({ ...p, pricePerSession: p.price / p.sessionCount }));
    }
  }, [form.price, form.sessionCount]);

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === services.length ? new Set() : new Set(services.map(s => s.id)));
  };

  // Sort
  const handleSort = (col: string) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };

  const sorted = [...services].sort((a: any, b: any) => {
    let va = a[sortBy], vb = b[sortBy];
    if (sortBy === "department") { va = a.department?.name || ""; vb = b.department?.name || ""; }
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return sortOrder === "asc" ? -1 : 1;
    if (va > vb) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Export
  const getExportData = () => {
    const src = selectedIds.size > 0 ? services.filter(s => selectedIds.has(s.id)) : services;
    return src.map(s => ({
      Name: s.name, Code: s.code || "-", Category: s.category,
      Sessions: s.sessionCount, "Total Price": `₹${s.price}`,
      "Per Session": `₹${s.pricePerSession}`,
      Department: s.department?.name || "-", Status: s.isActive ? "Active" : "Inactive",
    }));
  };
  const exportPDF = () => {
    const doc = new jsPDF(); const rows = getExportData(); const keys = Object.keys(rows[0] || {});
    doc.setFontSize(16); doc.text("Services & Packages", 14, 18);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 25);
    autoTable(doc, { startY: 30, head: [keys], body: rows.map(r => keys.map(k => (r as any)[k])), styles: { fontSize: 9 }, headStyles: { fillColor: [14, 137, 143] } });
    doc.save("services.pdf"); setShowExport(false);
  };
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Services");
    XLSX.writeFile(wb, "services.xlsx"); setShowExport(false);
  };
  const exportWord = async () => {
    const rows = getExportData(); const keys = Object.keys(rows[0] || {});
    const headerRow = new TableRow({ children: keys.map(k => new TableCell({ width: { size: 100 / keys.length, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20, font: "Calibri" })] })] })) });
    const dataRows = rows.map(r => new TableRow({ children: keys.map(k => new TableCell({ width: { size: 100 / keys.length, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: String((r as any)[k] ?? "-"), size: 20, font: "Calibri" })] })] })) }));
    const doc = new Document({ sections: [{ children: [new Paragraph({ text: "Services & Packages", heading: HeadingLevel.HEADING_1 }), new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } })] }] });
    const blob = await Packer.toBlob(doc); saveAs(blob, "services.docx"); setShowExport(false);
  };

  // CRUD
  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", code: "", description: "", category: "PACKAGE", departmentId: "", subDepartmentId: "", sessionCount: 1, price: 0, pricePerSession: 0, duration: 30, validityDays: 180, requiresPharmacy: false, requiresLab: false, isActive: true });
    setShowCustomCat(false); setCustomCategory(""); setMsg(""); setModal(true);
  };
  const openEdit = (item: Service) => {
    setEditItem(item);
    const isCustom = !CATEGORIES.find(c => c.value === item.category) && !customCategories.includes(item.category);
    if (isCustom && item.category) {
      setCustomCategories(prev => prev.includes(item.category) ? prev : [...prev, item.category]);
    }
    setForm({ name: item.name, code: item.code || "", description: item.description || "", category: item.category, departmentId: item.department?.id || "", subDepartmentId: item.subDepartment?.id || "", sessionCount: item.sessionCount, price: item.price, pricePerSession: item.pricePerSession, duration: item.duration || 30, validityDays: item.validityDays || 180, requiresPharmacy: item.requiresPharmacy, requiresLab: item.requiresLab, isActive: item.isActive });
    setShowCustomCat(false); setCustomCategory(""); setMsg(""); setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg("");
    const method = editItem ? "PUT" : "POST";
    const url = editItem ? `/api/config/services/${editItem.id}` : "/api/config/services";
    const d = await api(url, method, form);
    if (d.success) { setModal(false); load(); } else { setMsg(d.message || "Error"); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await api(`/api/config/services/${deleteTarget.id}`, "DELETE");
    setDeleteTarget(null); setDeleting(false); load();
  };

  const handleCategoryChange = (val: string) => {
    if (val === "__CUSTOM__") { setShowCustomCat(true); }
    else { setForm((p: any) => ({ ...p, category: val })); setShowCustomCat(false); }
  };

  const addCustomCategory = () => {
    const trimmed = customCategory.trim().toUpperCase().replace(/\s+/g, "_");
    if (!trimmed) return;
    setCustomCategories(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setForm((p: any) => ({ ...p, category: trimmed }));
    setShowCustomCat(false); setCustomCategory("");
  };

  const SortIcon = ({ col }: { col: string }) => (
    <span className={`sp-sort-icon ${sortBy === col ? "active" : ""}`}>
      {sortBy === col ? (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
    </span>
  );

  const allCategories = [...CATEGORIES, ...customCategories.map(c => ({ value: c, label: c.replace(/_/g, " ") }))];

  return (
    <div>
      <style>{`
        .sp-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap}
        .sp-toolbar-left{display:flex;flex-direction:column;gap:2px;min-width:0}
        .sp-toolbar-left h2{margin:0;font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
        .sp-toolbar-left p{margin:0;font-size:13px;color:#94a3b8;line-height:1.3}
        .sp-toolbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .sp-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:220px}
        .sp-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .sp-search-input::placeholder{color:#94a3b8}
        .sp-btn-primary{padding:10px 20px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(14,137,143,.25);transition:all .15s;white-space:nowrap}
        .sp-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
        .sp-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .sp-btn-ghost{padding:8px 14px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px}
        .sp-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}
        .sp-filter-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;flex-wrap:wrap}
        .sp-filter-select{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:12px;color:#334155;background:#fff;outline:none;cursor:pointer}
        .sp-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .sp-tbl{width:100%;border-collapse:collapse}
        .sp-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
        .sp-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc}
        .sp-tbl tr:last-child td{border-bottom:none}
        .sp-tbl tbody tr:hover td{background:#fafbfc}
        .sp-th-sort{cursor:pointer;user-select:none}.sp-th-sort:hover{color:#0E898F}
        .sp-sort-icon{display:inline-flex;margin-left:4px;vertical-align:middle;color:#cbd5e1}.sp-sort-icon.active{color:#0E898F}
        .sp-checkbox{width:16px;height:16px;accent-color:#0E898F;cursor:pointer}
        .sp-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .sp-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .sp-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .sp-badge.blue{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
        .sp-badge.purple{background:#faf5ff;color:#9333ea;border:1px solid #e9d5ff}
        .sp-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
        .sp-view{background:#f0f9ff;color:#2563eb}.sp-view:hover{background:#dbeafe}
        .sp-edit{background:#E6F4F4;color:#0E898F}.sp-edit:hover{background:#B3E0E0}
        .sp-del{background:#fff5f5;color:#ef4444}.sp-del:hover{background:#fee2e2}
        .sp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.4);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .sp-modal{background:#fff;border-radius:18px;padding:24px;width:100%;max-width:620px;box-shadow:0 20px 60px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto}
        .sp-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
        .sp-modal-title{font-size:17px;font-weight:800;color:#1e293b}
        .sp-modal-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .sp-field{display:flex;flex-direction:column;gap:5px}
        .sp-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
        .sp-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
        .sp-input:focus{border-color:#80CCCC;box-shadow:0 0 0 3px rgba(147,197,253,.25)}
        .sp-checkbox-label{display:flex;align-items:center;gap:8px;padding:10px;background:#f8fafc;border-radius:9px;cursor:pointer}
        .sp-checkbox-label input{width:18px;height:18px;cursor:pointer}
        .sp-export-wrap{position:relative}
        .sp-export-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:500;cursor:pointer}
        .sp-export-btn:hover{border-color:#cbd5e1;background:#f8fafc}
        .sp-export-dd{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:50;min-width:180px;padding:6px}
        .sp-export-item{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:8px;border:none;background:none;width:100%;cursor:pointer;font-size:13px;color:#334155;font-weight:500}
        .sp-export-item:hover{background:#f1f5f9}
        .sp-export-item .eicon{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center}
        .sp-export-item .eicon.pdf{background:#fff5f5;color:#ef4444}
        .sp-export-item .eicon.xls{background:#f0fdf4;color:#16a34a}
        .sp-export-item .eicon.doc{background:#eff6ff;color:#2563eb}
        .sp-selected-bar{display:flex;align-items:center;gap:12px;padding:10px 16px;background:#E6F4F4;border:1px solid #B3E0E0;border-radius:10px;margin-bottom:12px;font-size:13px;color:#0A6B70;font-weight:600}
        .sp-view-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:4px 0}
        .sp-view-item{display:flex;flex-direction:column;gap:3px}
        .sp-view-item.full{grid-column:1/-1}
        .sp-view-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
        .sp-view-value{font-size:14px;color:#1e293b;font-weight:500}
        .sp-del-dialog{background:#fff;border-radius:16px;width:100%;max-width:520px;box-shadow:0 24px 48px rgba(0,0,0,.16);overflow:hidden;display:flex;flex-direction:column;animation:spDelFade .2s ease}
        @keyframes spDelFade{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .sp-del-header{display:flex;align-items:center;gap:12px;padding:20px 24px;border-bottom:1px solid #f1f5f9}
        .sp-del-header-icon{width:40px;height:40px;border-radius:10px;background:#fff5f5;color:#ef4444;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sp-del-header-text h3{margin:0;font-size:16px;font-weight:700;color:#1e293b}
        .sp-del-header-text p{margin:0;font-size:12px;color:#94a3b8;margin-top:1px}
        .sp-del-body{padding:20px 24px;display:flex;flex-direction:column;gap:16px}
        .sp-del-card{display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
        .sp-del-card-icon{width:36px;height:36px;border-radius:9px;background:#faf5ff;color:#9333ea;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sp-del-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #f1f5f9;background:#fafbfc}
        .sp-del-confirm{padding:10px 20px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s}
        .sp-del-confirm:hover{background:#dc2626;transform:translateY(-1px)}
        .sp-del-confirm:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .sp-custom-cat{display:flex;gap:6px;align-items:center;margin-top:6px}
        .sp-custom-cat input{flex:1}
        .sp-custom-cat-btn{padding:8px 14px;border-radius:8px;border:none;background:#0E898F;color:#fff;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sp-spin{animation:spin .7s linear infinite}
        .sp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
        .sp-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
        .sp-pagination{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-top:1px solid #f1f5f9}
        .sp-pagination-info{font-size:12px;color:#94a3b8}
      `}</style>

      {/* Toolbar */}
      <div className="sp-toolbar">
        <div className="sp-toolbar-left">
          <h2>Services & Packages</h2>
          <p>Manage your hospital services and packages configuration</p>
        </div>
        <div className="sp-toolbar-right">
          <button className="sp-btn-ghost" onClick={() => setShowFilters(f => !f)}>
            <Filter size={13} />{showFilters ? "Hide Filters" : "Filters"}
          </button>
          <div className="sp-search-wrap">
            <Search size={14} color="#94a3b8" />
            <input className="sp-search-input" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="sp-export-wrap">
            <button className="sp-export-btn" onClick={() => setShowExport(e => !e)}>
              <Download size={13} />Export
            </button>
            {showExport && (
              <div className="sp-export-dd">
                <button className="sp-export-item" onClick={exportPDF}><span className="eicon pdf"><FileText size={13} /></span>PDF Document</button>
                <button className="sp-export-item" onClick={exportExcel}><span className="eicon xls"><FileSpreadsheet size={13} /></span>Excel Spreadsheet</button>
                <button className="sp-export-item" onClick={exportWord}><span className="eicon doc"><FileType size={13} /></span>Word Document</button>
              </div>
            )}
          </div>
          <button className="sp-btn-primary" onClick={openAdd}>
            <Plus size={14} />Add Service/Package
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="sp-filter-row">
          <select className="sp-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {allCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="sp-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {(filterCategory || filterStatus) && (
            <button className="sp-btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => { setFilterCategory(""); setFilterStatus(""); }}>Clear</button>
          )}
        </div>
      )}

      {/* Selected bar */}
      {selectedIds.size > 0 && (
        <div className="sp-selected-bar">
          <Check size={14} />
          {selectedIds.size} service{selectedIds.size > 1 ? "s" : ""} selected
          <button className="sp-btn-ghost" style={{ padding: "4px 10px", fontSize: 12, marginLeft: "auto" }} onClick={() => setSelectedIds(new Set())}>Clear</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="sp-loading"><Loader2 size={20} className="sp-spin" />Loading...</div>
      ) : services.length === 0 ? (
        <div className="sp-empty">No services found. Click "+ Add Service/Package" to create one.</div>
      ) : (
        <div className="sp-tbl-wrap">
          <table className="sp-tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" className="sp-checkbox" checked={services.length > 0 && selectedIds.size === services.length} ref={(el: HTMLInputElement | null) => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < services.length; }} onChange={toggleSelectAll} />
                </th>
                <th className="sp-th-sort" onClick={() => handleSort("name")}>Service Name<SortIcon col="name" /></th>
                <th>Code</th>
                <th className="sp-th-sort" onClick={() => handleSort("category")}>Category<SortIcon col="category" /></th>
                <th className="sp-th-sort" onClick={() => handleSort("sessionCount")}>Sessions<SortIcon col="sessionCount" /></th>
                <th className="sp-th-sort" onClick={() => handleSort("price")}>Price<SortIcon col="price" /></th>
                <th>Per Session</th>
                <th className="sp-th-sort" onClick={() => handleSort("department")}>Department<SortIcon col="department" /></th>
                <th>Requirements</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(item => (
                <tr key={item.id} style={selectedIds.has(item.id) ? { background: "#f0fdfa" } : undefined}>
                  <td><input type="checkbox" className="sp-checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{item.description.slice(0, 50)}{item.description.length > 50 ? "..." : ""}</div>}
                  </td>
                  <td>{item.code ? <span style={{ fontFamily: "monospace", fontSize: 12, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#64748b" }}>{item.code}</span> : <span style={{ color: "#94a3b8" }}>-</span>}</td>
                  <td><span className="sp-badge purple">{item.category}</span></td>
                  <td>{item.sessionCount}</td>
                  <td style={{ fontWeight: 600 }}>₹{item.price.toLocaleString()}</td>
                  <td>₹{item.pricePerSession.toLocaleString()}</td>
                  <td>
                    <div style={{ fontSize: 12 }}>{item.department?.name || <span style={{ color: "#94a3b8" }}>-</span>}</div>
                    {item.subDepartment && <div style={{ fontSize: 10, color: "#94a3b8" }}>{item.subDepartment.name}</div>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {item.requiresPharmacy && <span title="Requires Pharmacy"><Pill size={14} color="#10b981" /></span>}
                      {item.requiresLab && <span title="Requires Lab"><FlaskConical size={14} color="#3b82f6" /></span>}
                      {!item.requiresPharmacy && !item.requiresLab && <span style={{ color: "#94a3b8" }}>-</span>}
                    </div>
                  </td>
                  <td><span className={`sp-badge ${item.isActive ? "green" : "red"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="sp-icon-btn sp-view" onClick={() => setViewItem(item)} title="View details"><Eye size={13} /></button>
                      <button className="sp-icon-btn sp-edit" onClick={() => openEdit(item)}><Pencil size={13} /></button>
                      <button className="sp-icon-btn sp-del" onClick={() => setDeleteTarget(item)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="sp-overlay" onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div className="sp-modal" style={{ maxWidth: 560 }}>
            <div className="sp-modal-head">
              <span className="sp-modal-title">Service Details</span>
              <button onClick={() => setViewItem(null)} className="sp-icon-btn"><X size={16} /></button>
            </div>
            <div className="sp-view-grid">
              <div className="sp-view-item"><span className="sp-view-label">Name</span><span className="sp-view-value">{viewItem.name}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Code</span><span className="sp-view-value">{viewItem.code || "-"}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Category</span><span className="sp-view-value"><span className="sp-badge purple">{viewItem.category}</span></span></div>
              <div className="sp-view-item"><span className="sp-view-label">Status</span><span className="sp-view-value"><span className={`sp-badge ${viewItem.isActive ? "green" : "red"}`}>{viewItem.isActive ? "Active" : "Inactive"}</span></span></div>
              <div className="sp-view-item"><span className="sp-view-label">Sessions</span><span className="sp-view-value">{viewItem.sessionCount}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Total Price</span><span className="sp-view-value">₹{viewItem.price.toLocaleString()}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Per Session</span><span className="sp-view-value">₹{viewItem.pricePerSession.toLocaleString()}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Duration</span><span className="sp-view-value">{viewItem.duration ? `${viewItem.duration} min` : "-"}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Validity</span><span className="sp-view-value">{viewItem.validityDays ? `${viewItem.validityDays} days` : "-"}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Department</span><span className="sp-view-value">{viewItem.department?.name || "-"}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Sub-Department</span><span className="sp-view-value">{viewItem.subDepartment?.name || "-"}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Treatment Plans</span><span className="sp-view-value">{viewItem._count?.treatmentPlans || 0}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Pharmacy</span><span className="sp-view-value">{viewItem.requiresPharmacy ? "Required" : "Not required"}</span></div>
              <div className="sp-view-item"><span className="sp-view-label">Lab Tests</span><span className="sp-view-value">{viewItem.requiresLab ? "Required" : "Not required"}</span></div>
              {viewItem.description && <div className="sp-view-item full"><span className="sp-view-label">Description</span><span className="sp-view-value">{viewItem.description}</span></div>}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button className="sp-btn-primary" onClick={() => { openEdit(viewItem); setViewItem(null); }}>
                <Pencil size={13} />Edit Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <div className="sp-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="sp-del-dialog">
            <div className="sp-del-header">
              <div className="sp-del-header-icon"><ShieldAlert size={20} /></div>
              <div className="sp-del-header-text" style={{ flex: 1 }}>
                <h3>Delete Service</h3>
                <p>This action cannot be undone</p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="sp-icon-btn"><X size={16} /></button>
            </div>
            <div className="sp-del-body">
              <div className="sp-del-card">
                <div className="sp-del-card-icon"><Package size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{deleteTarget.name}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    {deleteTarget.code && <span style={{ fontFamily: "monospace", fontSize: 11, background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, color: "#64748b" }}>{deleteTarget.code}</span>}
                    <span className="sp-badge purple" style={{ fontSize: 10 }}>{deleteTarget.category}</span>
                  </div>
                </div>
              </div>
              {(deleteTarget._count?.treatmentPlans || 0) > 0 ? (
                <div style={{ border: "1px solid #fde68a", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fffbeb", fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: ".04em" }}>
                    <AlertTriangle size={14} />Impact Analysis
                  </div>
                  <div style={{ padding: "14px 16px", fontSize: 13, color: "#64748b" }}>
                    This service is used in <strong>{deleteTarget._count?.treatmentPlans}</strong> treatment plan{(deleteTarget._count?.treatmentPlans || 0) > 1 ? "s" : ""}. Deletion may be blocked.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#E6F4F4", border: "1px solid #B3E0E0", borderRadius: 10, fontSize: 13, color: "#0A6B70", fontWeight: 500 }}>
                  <Info size={16} />No dependent treatment plans. Safe to delete.
                </div>
              )}
            </div>
            <div className="sp-del-footer">
              <button className="sp-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="sp-del-confirm" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 size={13} className="sp-spin" />}
                <Trash2 size={13} />Delete Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="sp-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="sp-modal">
            <div className="sp-modal-head">
              <span className="sp-modal-title">{editItem ? "Edit" : "Add"} Service/Package</span>
              <button onClick={() => setModal(false)} className="sp-icon-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="sp-modal-form">
              <div className="sp-field" style={{ gridColumn: "1/-1" }}>
                <label className="sp-lbl">Service/Package Name *</label>
                <input className="sp-input" placeholder="e.g., PRP Hair Treatment (6 Sessions)" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="sp-field">
                <label className="sp-lbl">Service Code</label>
                <input className="sp-input" placeholder="e.g., PRP-HAIR-6" value={form.code} onChange={(e) => setForm((p: any) => ({ ...p, code: e.target.value }))} />
              </div>
              <div className="sp-field">
                <label className="sp-lbl">Category</label>
                <select className="sp-input" value={allCategories.find(c => c.value === form.category) ? form.category : "__CUSTOM__"} onChange={(e) => handleCategoryChange(e.target.value)}>
                  {allCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  <option value="__CUSTOM__">+ Add Custom Category</option>
                </select>
                {showCustomCat && (
                  <div className="sp-custom-cat">
                    <input className="sp-input" placeholder="Enter category name..." value={customCategory} onChange={e => setCustomCategory(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }} autoFocus />
                    <button type="button" className="sp-custom-cat-btn" onClick={addCustomCategory}>Add</button>
                    <button type="button" className="sp-btn-ghost" style={{ padding: "8px 10px" }} onClick={() => { setShowCustomCat(false); setCustomCategory(""); }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="sp-field">
                <label className="sp-lbl">Department</label>
                <select className="sp-input" value={form.departmentId} onChange={(e) => setForm((p: any) => ({ ...p, departmentId: e.target.value, subDepartmentId: "" }))}>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="sp-field">
                <label className="sp-lbl">Sub-Department</label>
                <select className="sp-input" value={form.subDepartmentId} onChange={(e) => setForm((p: any) => ({ ...p, subDepartmentId: e.target.value }))} disabled={!form.departmentId}>
                  <option value="">Select Sub-Department</option>
                  {subDepartments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="sp-field">
                <label className="sp-lbl">Number of Sessions *</label>
                <input className="sp-input" type="number" min="1" value={form.sessionCount} onChange={(e) => setForm((p: any) => ({ ...p, sessionCount: parseInt(e.target.value) }))} required />
              </div>
              <div className="sp-field">
                <label className="sp-lbl">Total Package Price (₹) *</label>
                <input className="sp-input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p: any) => ({ ...p, price: parseFloat(e.target.value) }))} required />
              </div>
              <div className="sp-field">
                <label className="sp-lbl">Price Per Session (₹)</label>
                <input className="sp-input" type="number" value={form.pricePerSession.toFixed(2)} disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
              </div>
              <div className="sp-field">
                <label className="sp-lbl">Duration (minutes)</label>
                <input className="sp-input" type="number" min="0" value={form.duration} onChange={(e) => setForm((p: any) => ({ ...p, duration: parseInt(e.target.value) }))} />
              </div>
              <div className="sp-field">
                <label className="sp-lbl">Validity (days)</label>
                <input className="sp-input" type="number" min="0" value={form.validityDays} onChange={(e) => setForm((p: any) => ({ ...p, validityDays: parseInt(e.target.value) }))} />
              </div>
              <div className="sp-field" style={{ gridColumn: "1/-1" }}>
                <label className="sp-lbl">Description</label>
                <textarea className="sp-input" rows={3} placeholder="Service description..." value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="sp-field">
                <label className="sp-checkbox-label">
                  <input type="checkbox" checked={form.requiresPharmacy} onChange={(e) => setForm((p: any) => ({ ...p, requiresPharmacy: e.target.checked }))} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Requires Pharmacy</span>
                </label>
              </div>
              <div className="sp-field">
                <label className="sp-checkbox-label">
                  <input type="checkbox" checked={form.requiresLab} onChange={(e) => setForm((p: any) => ({ ...p, requiresLab: e.target.checked }))} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Requires Lab Tests</span>
                </label>
              </div>
              <div className="sp-field">
                <label className="sp-checkbox-label">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Active</span>
                </label>
              </div>
              {msg && <div style={{ gridColumn: "1/-1", fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{msg}</div>}
              <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" className="sp-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="sp-btn-primary" disabled={saving}>
                  {saving && <Loader2 size={14} className="sp-spin" />}
                  {editItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
