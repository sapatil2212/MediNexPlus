"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { Users, RefreshCw, Loader2, Trash2, AlertTriangle, Download, Plus } from "lucide-react";
import { Search, FileText, FileSpreadsheet, FileType, Eye } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType, TextRun, HeadingLevel } from "docx";
import AppointmentPanel from "@/components/AppointmentPanel";
import FollowUpDashboard from "@/components/FollowUpDashboard";
import PatientProfilePanel from "@/components/PatientProfilePanel";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

type Tab = "appointments" | "followups";

const TABS = [
  { id: "appointments" as Tab, label: "Appointments", icon: CalendarCheck },
  { id: "followups"    as Tab, label: "Follow-ups",   icon: RefreshCw },
];

export default function AppointmentsPage() {
  const [tab, setTab] = useState<Tab>("appointments");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [bookTrigger, setBookTrigger] = useState(0);

  return (
    <div style={{ padding: 24, flex: 1, overflowY: "auto", minHeight: 0 }}>
      {/* Sub-tabs + Book button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 6, background: "#fff", borderRadius: 12, padding: 6, border: "1px solid #e2e8f0", width: "fit-content" }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedPatientId(null); }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8, border: "none", background: active ? "#0E898F" : "transparent", color: active ? "#fff" : "#64748b", fontSize:12, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>
        <button onClick={() => { setTab("appointments"); setSelectedPatientId(null); setBookTrigger(k => k + 1); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
          <Plus size={15} />Book Appointment
        </button>
      </div>

      {selectedPatientId ? (
        <PatientProfilePanel patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />
      ) : (
        <>
          {tab === "appointments" && <AppointmentPanel onViewPatient={setSelectedPatientId} openTrigger={bookTrigger} />}
          {tab === "followups"    && <FollowUpDashboard onViewPatient={setSelectedPatientId} />}
        </>
      )}
    </div>
  );
}

// ─── Inline Patients List Panel ───
function PatientsListPanel({ onSelectPatient }: { onSelectPatient: (id: string) => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    const d = await api(`/api/patients?${params}`);
    if (d.success) { setPatients(d.data?.data || []); setPagination(d.data?.pagination || { total: 0, totalPages: 1 }); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const d = await api(`/api/patients/${deleteTarget.id}`, "DELETE");
    if (d.success) {
      setDeleteTarget(null);
      selectedIds.delete(deleteTarget.id);
      setSelectedIds(new Set(selectedIds));
      load();
    } else {
      alert(d.message || "Failed to delete patient");
    }
    setDeleting(false);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    for (const id of Array.from(selectedIds)) {
      await api(`/api/patients/${id}`, "DELETE");
    }
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
    setBulkDeleting(false);
    load();
  };

  const toggleSelect = (id: string) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
  const toggleAll = () => { if (selectedIds.size === patients.length) setSelectedIds(new Set()); else setSelectedIds(new Set(patients.map(p => p.id))); };

  const getExportData = () => patients.map(p => ({
    "Patient ID": p.patientId, Name: p.name, Phone: p.phone, Email: p.email || "—",
    Gender: p.gender || "—", Visits: p._count?.appointments || 0, "Follow-ups": p._count?.followUps || 0,
  }));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Patients Report", 14, 16);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
    const rows = getExportData();
    autoTable(doc, {
      startY: 28,
      head: [["Patient ID", "Name", "Phone", "Email", "Gender", "Visits", "Follow-ups"]],
      body: rows.map(r => [r["Patient ID"], r.Name, r.Phone, r.Email, r.Gender, r.Visits, r["Follow-ups"]]),
      styles: { fontSize:9 }, headStyles: { fillColor: [14, 137, 143] },
    });
    doc.save(`patients-${new Date().toISOString().slice(0, 10)}.pdf`); setShowExport(false);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Patients");
    XLSX.writeFile(wb, `patients-${new Date().toISOString().slice(0, 10)}.xlsx`); setShowExport(false);
  };

  const exportWord = async () => {
    const rows = getExportData();
    const keys = ["Patient ID", "Name", "Phone", "Email", "Gender", "Visits", "Follow-ups"] as const;
    const headerRow = new TableRow({ children: keys.map(k => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 18, font: "Calibri" })] })], width: { size: 100 / keys.length, type: WidthType.PERCENTAGE }, shading: { fill: "0E898F" } })) });
    const dataRows = rows.map(r => new TableRow({ children: keys.map(k => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String((r as any)[k] ?? ""), size: 18, font: "Calibri" })] })] })) }));
    const doc = new DocxDocument({ sections: [{ children: [
      new Paragraph({ text: "Patients Report", heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-IN")}`, size: 18, color: "888888" })] }),
      new Paragraph({ text: "" }),
      new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
    ] }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `patients-${new Date().toISOString().slice(0, 10)}.docx`); setShowExport(false);
  };

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", flex: 1, minWidth: 200 }}>
          <input style={{ background: "none", border: "none", outline: "none", fontSize:12, color: "#334155", width: "100%" }}
            placeholder="Search by name, phone, patient ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ fontSize:11, color: "#94a3b8", fontWeight: 600 }}>{pagination.total} patients</div>
        {selectedIds.size > 0 && (
          <button onClick={() => setShowBulkConfirm(true)}
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #fecaca", background: "#fff5f5", fontSize:11, color: "#ef4444", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Trash2 size={12} />Delete ({selectedIds.size})
          </button>
        )}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <button onClick={() => setShowExport(!showExport)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 500, cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.background = "#f8fafc"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}>
            <Download size={14} />Export
          </button>
          {showExport && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 50, minWidth: 180, padding: 6 }}>
              <button onClick={exportPDF} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize:12, color: "#334155", fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff5f5", color: "#ef4444" }}><FileText size={13} /></span>Export as PDF
              </button>
              <button onClick={exportExcel} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize:12, color: "#334155", fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", color: "#16a34a" }}><FileSpreadsheet size={13} /></span>Export as Excel
              </button>
              <button onClick={exportWord} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize:12, color: "#334155", fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "#eff6ff", color: "#2563eb" }}><FileType size={13} /></span>Export as Word
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 0", color: "#94a3b8" }}>
          <Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} />Loading...
        </div>
      ) : patients.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", color: "#94a3b8" }}>
          <Users size={32} style={{ marginBottom: 10, opacity: .4 }} />
          <div style={{ fontSize:13, fontWeight: 600 }}>No patients found</div>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #ffffff, #f8fafc)", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "12px 10px 12px 14px", borderBottom: "2px solid #f1f5f9", width: 36 }}>
                  <input type="checkbox" checked={patients.length > 0 && selectedIds.size === patients.length}
                    onChange={toggleAll} style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#0E898F" }} />
                </th>
                {["Patient ID", "Name", "Phone", "Email", "Gender", "Visits", "Follow-ups", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", fontSize:10, fontWeight: 600, color: "#94a3b8", padding: "12px 14px", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f8fafc", background: selectedIds.has(p.id) ? "#f0fdfa" : "transparent" }}
                  onMouseEnter={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = "#fafbfc"; }}
                  onMouseLeave={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding: "12px 10px 12px 14px", width: 36 }}>
                    <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)}
                      style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#0E898F" }} />
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize:11, fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "3px 8px", borderRadius: 6 }}>{p.patientId}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize:11, flexShrink: 0 }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize:12, color: "#64748b" }}>{p.phone}</td>
                  <td style={{ padding: "12px 14px", fontSize:12, color: "#64748b" }}>{p.email || "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {p.gender ? (
                      <span style={{ fontSize:10, padding: "3px 8px", borderRadius: 100, background: "#f1f5f9", color: "#64748b", fontWeight: 600 }}>{p.gender}</span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize:12, fontWeight: 700, color: "#0A6B70" }}>{p._count?.appointments || 0}</td>
                  <td style={{ padding: "12px 14px", fontSize:12, fontWeight: 700, color: "#10b981" }}>{p._count?.followUps || 0}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/hospitaladmin/dashboard?tab=patients&patientId=${p.id}`); }}
                        style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#E6F4F4", color: "#0E898F", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="View Patient"><Eye size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                        style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#fff5f5", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Delete Patient"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize:11, color: "#94a3b8" }}>Showing {patients.length} of {pagination.total}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize:11, color: "#64748b", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? .5 : 1 }}>
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize:11, color: "#64748b", cursor: page === pagination.totalPages ? "not-allowed" : "pointer", opacity: page === pagination.totalPages ? .5 : 1 }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Delete Modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize:15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Delete Patient?</div>
                <div style={{ fontSize:12, color: "#64748b", lineHeight: 1.5 }}>
                  Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.patientId})? This action cannot be undone.
                </div>
              </div>
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12, marginBottom: 18 }}>
              <div style={{ fontSize:11, color: "#92400e", fontWeight: 600, marginBottom: 4 }}>⚠️ Warning</div>
              <div style={{ fontSize:10, color: "#a16207" }}>
                This will delete {deleteTarget._count?.appointments || 0} appointment(s) and {deleteTarget._count?.followUps || 0} follow-up(s) associated with this patient.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? .5 : 1 }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize:12, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? .7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                {deleting && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
                {deleting ? "Deleting..." : "Delete Patient"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget && !bulkDeleting) setShowBulkConfirm(false); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize:15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Delete {selectedIds.size} Patients?</div>
                <div style={{ fontSize:12, color: "#64748b", lineHeight: 1.5 }}>
                  Are you sure you want to delete <strong>{selectedIds.size}</strong> selected patient(s)? This will also delete all their appointments and follow-ups.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowBulkConfirm(false)} disabled={bulkDeleting}
                style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 600, cursor: bulkDeleting ? "not-allowed" : "pointer", opacity: bulkDeleting ? .5 : 1 }}>
                Cancel
              </button>
              <button onClick={handleBulkDelete} disabled={bulkDeleting}
                style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize:12, fontWeight: 700, cursor: bulkDeleting ? "not-allowed" : "pointer", opacity: bulkDeleting ? .7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                {bulkDeleting && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
                {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size} Patients`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
