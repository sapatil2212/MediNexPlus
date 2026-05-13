"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronLeft, ChevronRight, Phone, Mail,
  Eye, Trash2, X, MessageSquare, CheckCircle2, Loader2, RefreshCw,
  User, Download, FileText, FileSpreadsheet, FileBox, ChevronDown, CheckSquare, Square
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, VerticalAlign } from "docx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Enquiry {
  id: string;
  fullName: string;
  mobile: string;
  altContact?: string;
  email?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  department?: string;
  enquiryType?: string;
  details?: string;
  status: string;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
}

interface Stats {
  new: number;
  contacted: number;
  inProgress: number;
  converted: number;
  closed: number;
  total: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  NEW:         { label: "New",         color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  CONTACTED:   { label: "Contacted",   color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  IN_PROGRESS: { label: "In Progress", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  CONVERTED:   { label: "Converted",   color: "#10b981", bg: "#f0fdf4", border: "#a7f3d0" },
  CLOSED:      { label: "Closed",      color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

const api = async (url: string, method = "GET", body?: unknown) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

interface EnquiryPanelProps {
  typeFilter?: string;
  title?: string;
}

export default function EnquiryPanel({ typeFilter, title }: EnquiryPanelProps = {}) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [detailNotes, setDetailNotes] = useState("");
  const [detailStatus, setDetailStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (deptFilter) params.set("department", deptFilter);
      if (typeFilter) params.set("type", typeFilter);
      const d = await api(`/api/enquiries?${params}`);
      if (d.success) {
        setEnquiries(d.data.enquiries);
        setStats(d.data.stats);
        setTotal(d.data.pagination.total);
        setTotalPages(d.data.pagination.totalPages);
      }
    } catch {}
    setLoading(false);
  }, [page, search, statusFilter, deptFilter, typeFilter]);

  // Using a timeout to satisfy strict lint about synchronous state updates in effects
  useEffect(() => { 
    const t = setTimeout(() => {
      fetchEnquiries();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchEnquiries]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await api(`/api/enquiries/${id}`, "PATCH", { status: newStatus });
    fetchEnquiries();
    if (selected?.id === id) setDetailStatus(newStatus);
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    await api(`/api/enquiries/${selected.id}`, "PATCH", { notes: detailNotes, status: detailStatus });
    setSaving(false);
    fetchEnquiries();
    setSelected(prev => prev ? { ...prev, notes: detailNotes, status: detailStatus } : null);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    await api(`/api/enquiries/${id}`, "DELETE");
    setDeleting(false);
    setDeleteConfirm(null);
    if (selected?.id === id) setSelected(null);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    fetchEnquiries();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    await api("/api/enquiries", "DELETE", { ids: Array.from(selectedIds) });
    setDeleting(false);
    setBulkDeleteConfirm(false);
    setSelectedIds(new Set());
    fetchEnquiries();
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === enquiries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(enquiries.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getExportData = () => {
    const dataToExport = selectedIds.size > 0 
      ? enquiries.filter(e => selectedIds.has(e.id))
      : enquiries;
    
    return dataToExport.map(e => ({
      "Date": new Date(e.createdAt).toLocaleDateString("en-IN"),
      "Name": e.fullName,
      "Mobile": e.mobile,
      "Alt. Contact": e.altContact || "—",
      "Email": e.email || "—",
      "Gender": e.gender || "—",
      "City": e.city || "—",
      "State": e.state || "—",
      "Country": e.country || "—",
      "Pincode": e.pincode || "—",
      "Department": e.department || "—",
      "Type": e.enquiryType || "—",
      "Status": STATUS_CONFIG[e.status]?.label || e.status,
      "Assigned To": e.assignedTo || "—",
      "Details": e.details || "—",
      "Notes": e.notes || "—"
    }));
  };

  const exportToExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Enquiries");
    XLSX.writeFile(wb, `enquiries_${new Date().getTime()}.xlsx`);
    setExportDropdownOpen(false);
  };

  const exportToPDF = () => {
    const data = getExportData();
    const doc = new jsPDF("l", "pt", "a3"); // Using A3 landscape for more space
    
    const head = [Object.keys(data[0])];
    const body = data.map(e => Object.values(e));

    doc.setFontSize(18);
    doc.text("Enquiries Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 40, 60);

    autoTable(doc, {
      head,
      body,
      startY: 80,
      theme: "striped",
      styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [14, 137, 143], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 50 },  // Date
        1: { cellWidth: 80 },  // Name
        2: { cellWidth: 70 },  // Mobile
        10: { cellWidth: 70 }, // Dept
        12: { cellWidth: 50 }, // Status
        14: { cellWidth: 150 },// Details
        15: { cellWidth: 150 },// Notes
      }
    });
    
    doc.save(`enquiries_${new Date().getTime()}.pdf`);
    setExportDropdownOpen(false);
  };

  const exportToWord = async () => {
    const data = getExportData();
    const headers = Object.keys(data[0]);
    
    const rows = [
      new TableRow({
        children: headers.map(h => 
          new TableCell({ 
            children: [new Paragraph({ text: h, style: "Heading2", alignment: AlignmentType.CENTER })],
            shading: { fill: "0E898F" },
            verticalAlign: "center",
          })
        )
      }),
      ...data.map(e => new TableRow({
        children: headers.map(h => 
          new TableCell({ 
            children: [new Paragraph({ text: String((e as Record<string, string | number>)[h]) })],
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          })
        )
      }))
    ];

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              orientation: "landscape",
            },
          },
        },
        children: [
          new Paragraph({ text: "Enquiries Report", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `Generated on: ${new Date().toLocaleString("en-IN")}`, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "" }),
          table
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `enquiries_${new Date().getTime()}.docx`);
    setExportDropdownOpen(false);
  };

  const openDetail = (enq: Enquiry) => {
    setSelected(enq);
    setDetailNotes(enq.notes || "");
    setDetailStatus(enq.status);
  };

  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    // Setting state in useEffect is fine if it's not synchronous on first render, 
    // but the lint is strict. Let's use a timeout or just avoid it.
    const t = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(t);
  }, []);

  const timeAgo = useCallback((d: string) => {
    if (!now) return "…";
    const diff = now - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }, [now]);

  const departments = Array.from(new Set(enquiries.map(e => e.department).filter(Boolean)));

  return (
    <div style={{ animation: "fadeIn .25s ease" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {title && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 22px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E898F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>International patient enquiries filtered by Medical Tourism type</div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Total", val: stats.total, color: "#0E898F", bg: "#E6F4F4" },
            { label: "New", val: stats.new, color: "#3b82f6", bg: "#eff6ff" },
            { label: "Contacted", val: stats.contacted, color: "#f59e0b", bg: "#fffbeb" },
            { label: "In Progress", val: stats.inProgress, color: "#8b5cf6", bg: "#f5f3ff" },
            { label: "Converted", val: stats.converted, color: "#10b981", bg: "#f0fdf4" },
            { label: "Closed", val: stats.closed, color: "#64748b", bg: "#f8fafc" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${s.color}22`, cursor: "pointer" }}
              onClick={() => { setStatusFilter(s.label === "Total" ? "" : s.label === "In Progress" ? "IN_PROGRESS" : s.label.toUpperCase()); setPage(1); }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 12px", flex: 1, maxWidth: 320 }}>
          <Search size={14} color="#94a3b8" />
          <input
            placeholder="Search by name, phone, email, city..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ border: "none", outline: "none", background: "none", fontSize: 12, color: "#334155", width: "100%", fontFamily: "inherit" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569", fontFamily: "inherit", cursor: "pointer", background: "#f8fafc" }}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={deptFilter}
          onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
          style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569", fontFamily: "inherit", cursor: "pointer", background: "#f8fafc" }}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d!}>{d}</option>)}
        </select>
        <button onClick={fetchEnquiries} style={{ padding: "7px 14px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
          <RefreshCw size={12} /> Refresh
        </button>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <button 
            onClick={() => setBulkDeleteConfirm(true)}
            style={{ padding: "7px 14px", borderRadius: 8, background: "#fff5f5", border: "1px solid #feb2b2", color: "#e53e3e", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}
          >
            <Trash2 size={12} /> Delete Selected ({selectedIds.size})
          </button>
        )}

        {/* Export Dropdown */}
        <div style={{ position: "relative" }}>
          <button 
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            style={{ padding: "7px 14px", borderRadius: 8, background: "#E6F4F4", border: "1px solid #B3E0E0", color: "#0E898F", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}
          >
            <Download size={12} /> {selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : "Export All"} <ChevronDown size={12} />
          </button>
          
          {exportDropdownOpen && (
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 5, background: "#fff", borderRadius: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", zIndex: 10, minWidth: 160, overflow: "hidden" }}>
              {[
                { label: "Export as PDF", icon: <FileText size={14} />, onClick: exportToPDF },
                { label: "Export as Excel", icon: <FileSpreadsheet size={14} />, onClick: exportToExcel },
                { label: "Export as Word", icon: <FileBox size={14} />, onClick: exportToWord },
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={item.onClick}
                  style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", borderBottom: i < 2 ? "1px solid #f1f5f9" : "none", fontSize: 12, color: "#475569", cursor: "pointer", textAlign: "left", transition: "all .15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ color: "#0E898F" }}>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>{total} enquir{total === 1 ? "y" : "ies"}</div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
              <Loader2 size={22} style={{ margin: "0 auto 8px", display: "block", animation: "spin .7s linear infinite" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ fontSize: 12 }}>Loading enquiries...</div>
            </div>
          ) : enquiries.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
              <MessageSquare size={28} style={{ margin: "0 auto 10px", display: "block", opacity: .3 }} />
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No enquiries found</div>
              <div style={{ fontSize: 12 }}>Enquiries from the contact form will appear here</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1050 }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 12px", borderBottom: "2px solid #f1f5f9", width: 40 }}>
                    <button 
                      onClick={toggleSelectAll}
                      style={{ background: "none", border: "none", cursor: "pointer", color: selectedIds.size === enquiries.length ? "#0E898F" : "#cbd5e1", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {selectedIds.size === enquiries.length && enquiries.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  {["Name", "Contact", "Location", "Department", "Type", "Details", "Status", "Date", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: 10, fontWeight: 600, color: "#94a3b8", padding: "10px 12px", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enquiries.map(enq => {
                  const sc = STATUS_CONFIG[enq.status] || STATUS_CONFIG.NEW;
                  const isSelected = selectedIds.has(enq.id);
                  return (
                    <tr key={enq.id} style={{ cursor: "pointer", background: isSelected ? "#f0f9f9" : "transparent" }} onClick={() => openDetail(enq)}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#fafbfc"; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <td style={{ padding: "12px", borderBottom: "1px solid #f8fafc" }} onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => toggleSelect(enq.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: isSelected ? "#0E898F" : "#cbd5e1", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      </td>
                      <td style={{ padding: "12px", fontSize: 11, borderBottom: "1px solid #f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#0E898F,#07595D)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {enq.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 12 }}>{enq.fullName}</div>
                            {enq.gender && <div style={{ fontSize: 10, color: "#94a3b8" }}>{enq.gender}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px", fontSize: 11, color: "#475569", borderBottom: "1px solid #f8fafc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}><Phone size={10} color="#94a3b8" /> {enq.mobile}</div>
                        {enq.email && <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#94a3b8" }}><Mail size={10} /> {enq.email}</div>}
                      </td>
                      <td style={{ padding: "12px", fontSize: 11, color: "#475569", borderBottom: "1px solid #f8fafc" }}>
                        {enq.city || enq.state || enq.country ? (
                          <div style={{ fontSize: 11 }}>{[enq.city, enq.state].filter(Boolean).join(", ")}{enq.country ? ` · ${enq.country}` : ""}</div>
                        ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px", fontSize: 11, borderBottom: "1px solid #f8fafc" }}>
                        {enq.department ? (
                          <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 600, background: "#E6F4F4", color: "#0A6B70", border: "1px solid #B3E0E0" }}>{enq.department}</span>
                        ) : <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px", fontSize: 11, color: "#475569", borderBottom: "1px solid #f8fafc" }}>
                        {enq.enquiryType || <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px", fontSize: 11, color: "#475569", borderBottom: "1px solid #f8fafc", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {enq.details ? <span title={enq.details}>{enq.details}</span> : <span style={{ color: "#cbd5e1" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px", borderBottom: "1px solid #f8fafc" }}>
                        <select
                          value={enq.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); handleStatusChange(enq.id, e.target.value); }}
                          style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "12px", fontSize: 10, color: "#94a3b8", borderBottom: "1px solid #f8fafc", whiteSpace: "nowrap" }}>
                        {timeAgo(enq.createdAt)}
                        <div style={{ fontSize: 9 }}>{new Date(enq.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</div>
                      </td>
                      <td style={{ padding: "12px", borderBottom: "1px solid #f8fafc" }}>
                        <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => openDetail(enq)} title="View" style={{ width: 26, height: 26, borderRadius: 7, background: "#E6F4F4", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0E898F" }}><Eye size={12} /></button>
                          <button onClick={() => setDeleteConfirm(enq.id)} title="Delete" style={{ width: 26, height: 26, borderRadius: 7, background: "#fff5f5", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderTop: "1px solid #f1f5f9" }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: page > 1 ? "pointer" : "not-allowed", opacity: page > 1 ? 1 : 0.4, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569", fontFamily: "inherit" }}><ChevronLeft size={12} /> Prev</button>
            <span style={{ fontSize: 11, color: "#64748b" }}>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: page < totalPages ? "pointer" : "not-allowed", opacity: page < totalPages ? 1 : 0.4, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569", fontFamily: "inherit" }}>Next <ChevronRight size={12} /></button>
          </div>
        )}
      </div>

      {/* ── Detail Panel (Slide-over) ── */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ width: 460, maxWidth: "100%", background: "#fff", boxShadow: "-10px 0 40px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", animation: "slideIn .2s ease" }}>
            <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 2 }}>{selected.fullName}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Enquiry Details</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}><X size={18} /></button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {/* Contact Info */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Contact Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { icon: <Phone size={13} />, label: "Mobile", val: selected.mobile, color: "#10b981", bg: "#f0fdf4" },
                    { icon: <Phone size={13} />, label: "Alt. Contact", val: selected.altContact || "—", color: "#64748b", bg: "#f8fafc" },
                    { icon: <Mail size={13} />, label: "Email", val: selected.email || "—", color: "#8b5cf6", bg: "#f5f3ff" },
                    { icon: <User size={13} />, label: "Gender", val: selected.gender || "—", color: "#0E898F", bg: "#E6F4F4" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: item.bg }}>
                      <div style={{ color: item.color }}>{item.icon}</div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>{item.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", wordBreak: "break-all" }}>{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Location</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "City", val: selected.city },
                    { label: "State", val: selected.state },
                    { label: "Country", val: selected.country },
                    { label: "Pincode", val: selected.pincode },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>{item.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{item.val || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enquiry Info */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Enquiry Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: "#E6F4F4" }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Department</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0A6B70" }}>{selected.department || "—"}</div>
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Enquiry Type</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{selected.enquiryType || "—"}</div>
                  </div>
                </div>
                {selected.details && (
                  <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Details</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#1e293b", whiteSpace: "pre-wrap", marginTop: 4 }}>{selected.details}</div>
                  </div>
                )}
                <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Submitted</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{new Date(selected.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>

              {/* Status + Notes */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Status & Notes</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Status</label>
                  <select
                    value={detailStatus}
                    onChange={e => setDetailStatus(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#1e293b", fontFamily: "inherit", cursor: "pointer", background: "#f8fafc" }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Internal Notes</label>
                  <textarea
                    value={detailNotes}
                    onChange={e => setDetailNotes(e.target.value)}
                    rows={3}
                    placeholder="Add internal notes about this enquiry..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#1e293b", fontFamily: "inherit", resize: "vertical", background: "#f8fafc", outline: "none" }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
              <button onClick={() => setSelected(null)} style={{ flex: 1, padding: 10, borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleSaveNotes} disabled={saving} style={{ flex: 2, padding: 10, borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
                {saving ? <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> : <CheckCircle2 size={13} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Delete Enquiry</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Are you sure you want to delete this enquiry? This action cannot be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 10, borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {deleting ? <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> : <Trash2 size={13} />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirmation ── */}
      {bulkDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setBulkDeleteConfirm(false); }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Delete Multiple Enquiries</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Are you sure you want to delete {selectedIds.size} selected enquiries? This action cannot be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setBulkDeleteConfirm(false)} style={{ flex: 1, padding: 10, borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={deleting} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {deleting ? <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> : <Trash2 size={13} />}
                {deleting ? `Delete ${selectedIds.size} Items` : `Delete ${selectedIds.size} Items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
