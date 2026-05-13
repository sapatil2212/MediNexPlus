"use client";
import { useEffect, useState, useCallback } from "react";
import { 
  FileText, Loader2, Search, X, Eye, Pencil, Trash2, 
  Download, Mail, CheckCircle2, ChevronDown, AlertTriangle 
} from "lucide-react";
import { useDoctorDashboard } from "./DoctorDashboardContext";
import { useRouter } from "next/navigation";
import { ViewPrescriptionModal } from "@/app/subdept/dashboard/modals";

export function RxManagementPanel() {
  const { doctor, accent } = useDoctorDashboard();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState({ t: "", c: "" });

  const [viewRx, setViewRx] = useState<any | null>(null);
  const [modalType, setModalType] = useState<"edit" | null>(null);
  const [activeApptId, setActiveApptId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; type: "single" | "bulk"; id?: string; count?: number }>({ show: false, type: "single" });

  const fetchRx = useCallback(async () => {
    if (!doctor?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prescriptions?doctorId=${doctor.id}&limit=100`, {
        credentials: "include"
      }).then(r => r.json());
      if (res.success) {
        setPrescriptions(res.data?.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [doctor?.id]);

  useEffect(() => {
    fetchRx();
  }, [fetchRx]);

  const flash = (t: string, c: "s" | "e") => {
    setMsg({ t, c });
    setTimeout(() => setMsg({ t: "", c: "" }), 3000);
  };

  const handleDelete = async (id: string) => {
    setDeleteModal({ show: true, type: "single", id });
  };

  const confirmDelete = async () => {
    if (deleteModal.type === "single" && deleteModal.id) {
      try {
        const res = await fetch(`/api/prescriptions/${deleteModal.id}`, {
          method: "DELETE",
          credentials: "include"
        }).then(r => r.json());
        if (res.success) {
          flash("Prescription deleted", "s");
          fetchRx();
        } else {
          flash(res.message || "Failed to delete", "e");
        }
      } catch (e) {
        flash("Error deleting prescription", "e");
      }
    } else if (deleteModal.type === "bulk") {
      setLoading(true);
      let successCount = 0;
      for (const id of selectedIds) {
        try {
          const res = await fetch(`/api/prescriptions/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json());
          if (res.success) successCount++;
        } catch (e) { }
      }
      flash(`Successfully deleted ${successCount} prescription(s)`, "s");
      setSelectedIds([]);
      fetchRx();
    }
    setDeleteModal({ show: false, type: "single" });
  };

  const filteredRx = prescriptions.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.prescriptionNo?.toLowerCase().includes(q) ||
      r.patient?.name?.toLowerCase().includes(q) ||
      r.patient?.patientId?.toLowerCase().includes(q) ||
      r.diagnosis?.toLowerCase().includes(q)
    );
  });

  const handleBulkDelete = async () => {
    setDeleteModal({ show: true, type: "bulk", count: selectedIds.length });
  };

  const generateExportTableHTML = () => {
    const dataToExport = prescriptions.filter(r => selectedIds.includes(r.id));
    let html = `
      <table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="padding: 8px; text-align: left;">Rx Number</th>
            <th style="padding: 8px; text-align: left;">Date</th>
            <th style="padding: 8px; text-align: left;">Patient Name</th>
            <th style="padding: 8px; text-align: left;">Patient ID</th>
            <th style="padding: 8px; text-align: left;">Diagnosis</th>
            <th style="padding: 8px; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;
    dataToExport.forEach(r => {
      const date = new Date(r.createdAt).toLocaleString("en-IN");
      const name = r.patient?.name || "";
      const diag = r.diagnosis || "";
      html += `
        <tr>
          <td style="padding: 8px;">${r.prescriptionNo}</td>
          <td style="padding: 8px;">${date}</td>
          <td style="padding: 8px;">${name}</td>
          <td style="padding: 8px;">${r.patient?.patientId || ""}</td>
          <td style="padding: 8px;">${diag}</td>
          <td style="padding: 8px;">${r.status}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    return { html, count: dataToExport.length };
  };

  const handleExportExcel = () => {
    const { html, count } = generateExportTableHTML();
    if (count === 0) return;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Prescriptions_Export_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    flash(`Exported ${count} prescriptions to Excel`, "s");
  };

  const handleExportWord = () => {
    const { html, count } = generateExportTableHTML();
    if (count === 0) return;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title></head><body>";
    const footer = "</body></html>";
    const blob = new Blob(['\ufeff', header + html + footer], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Prescriptions_Export_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    flash(`Exported ${count} prescriptions to Word`, "s");
  };

  const handleExportPDF = async () => {
    const dataToExport = prescriptions.filter(r => selectedIds.includes(r.id));
    if (dataToExport.length === 0) return;
    setShowExportMenu(false);
    
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const pdf = new jsPDF({ orientation: "portrait" });
      
      pdf.setFontSize(16);
      pdf.text("Prescriptions Report", 14, 20);
      
      const head = [["Rx Number", "Date", "Patient", "Patient ID", "Diagnosis", "Status"]];
      const body = dataToExport.map(r => [
        r.prescriptionNo,
        new Date(r.createdAt).toLocaleString("en-IN"),
        r.patient?.name || "",
        r.patient?.patientId || "",
        r.diagnosis || "",
        r.status
      ]);
      
      autoTable(pdf, {
        startY: 28,
        head,
        body,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4, textColor: [30, 41, 59] },
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
        margin: { top: 20 },
      });
      
      pdf.save(`Prescriptions_Export_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.pdf`);
      
      flash(`Exported ${dataToExport.length} prescriptions to PDF`, "s");
    } catch (e) {
      flash("Failed to generate PDF", "e");
    }
  };

  return (
    <div style={{ padding: "0 4px" }}>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d1fae5", padding: "18px 24px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(16,185,129,0.05)" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={20} color={accent} />
            Prescriptions (Rx)
          </h2>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Manage and track all generated prescriptions for your patients</p>
        </div>
        {msg.t && (
          <div style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: msg.c === "s" ? "#f0fdf4" : "#fff5f5", color: msg.c === "s" ? "#16a34a" : "#ef4444", border: `1px solid ${msg.c === "s" ? "#bbf7d0" : "#fecaca"}` }}>
            {msg.t}
          </div>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "visible" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", flex: 1, maxWidth: 300 }}>
            <Search size={14} color="#94a3b8" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search Rx No, Patient, Diagnosis..." 
              style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "#334155", width: "100%", fontFamily: "inherit" }} 
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><X size={12} color="#94a3b8" /></button>}
          </div>
          {selectedIds.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 12, borderLeft: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{selectedIds.length} selected</span>
              <button 
                onClick={handleBulkDelete}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: "1px solid #fee2e2", background: "#fff5f5", color: "#ef4444", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
              >
                <Trash2 size={12} /> Delete
              </button>
              <div style={{ position: "relative" }}>
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                >
                  <Download size={12} /> Export <ChevronDown size={12} />
                </button>
                {showExportMenu && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)", overflow: "hidden", zIndex: 50, width: 120 }}>
                    <button onClick={handleExportExcel} style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontSize: 11, fontWeight: 600, color: "#334155", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={e => e.currentTarget.style.background="#f8fafc"} onMouseLeave={e => e.currentTarget.style.background="none"}>Excel (.xls)</button>
                    <button onClick={handleExportPDF} style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontSize: 11, fontWeight: 600, color: "#334155", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }} onMouseEnter={e => e.currentTarget.style.background="#f8fafc"} onMouseLeave={e => e.currentTarget.style.background="none"}>PDF Document</button>
                    <button onClick={handleExportWord} style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontSize: 11, fontWeight: 600, color: "#334155", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background="#f8fafc"} onMouseLeave={e => e.currentTarget.style.background="none"}>Word (.doc)</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "#94a3b8" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12, color: accent }} />
            <div style={{ fontSize: 12, fontWeight: 500 }}>Loading prescriptions...</div>
          </div>
        ) : filteredRx.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <FileText size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>No prescriptions found</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>{search ? "Try adjusting your search criteria" : "You haven't generated any prescriptions yet"}</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ width: 40, padding: "12px 18px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={filteredRx.length > 0 && selectedIds.length === filteredRx.length}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedIds(filteredRx.map(r => r.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", padding: "12px 18px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Rx Details</th>
                  <th style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", padding: "12px 18px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Patient</th>
                  <th style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", padding: "12px 18px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Diagnosis</th>
                  <th style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", padding: "12px 18px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                  <th style={{ textAlign: "right", fontSize: 10, fontWeight: 700, color: "#64748b", padding: "12px 18px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRx.map(rx => (
                  <tr key={rx.id} style={{ transition: "background 0.2s", background: selectedIds.includes(rx.id) ? "#f8fafc" : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = selectedIds.includes(rx.id) ? "#f8fafc" : "transparent"}>
                    <td style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(rx.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, rx.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== rx.id));
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: accent, background: `${accent}15`, padding: "4px 8px", borderRadius: 6, display: "inline-block", marginBottom: 4 }}>
                        {rx.prescriptionNo}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>
                        {new Date(rx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{rx.patient?.name}</div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{rx.patient?.patientId}</div>
                    </td>
                    <td style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 12, color: "#334155", fontWeight: 500, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {rx.diagnosis || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ 
                        fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 100, 
                        background: rx.status === "COMPLETED" ? "#f0fdf4" : rx.status === "DRAFT" ? "#fffbeb" : "#f1f5f9",
                        color: rx.status === "COMPLETED" ? "#16a34a" : rx.status === "DRAFT" ? "#d97706" : "#64748b",
                        border: `1px solid ${rx.status === "COMPLETED" ? "#bbf7d0" : rx.status === "DRAFT" ? "#fde68a" : "#e2e8f0"}`
                      }}>
                        {rx.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                        <button 
                          onClick={() => setViewRx(rx)}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#334155"; }}
                        >
                          <Eye size={12} /> View
                        </button>
                        <button 
                          onClick={() => { setActiveApptId(rx.appointmentId); setModalType("edit"); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: `1px solid ${accent}30`, background: `${accent}08`, color: accent, fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${accent}15`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${accent}08`; }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(rx.id)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 8, border: "1px solid #fee2e2", background: "#fff5f5", color: "#ef4444", cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#fff5f5"; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescription View Modal (clean layout + PDF download) */}
      {viewRx && (
        <ViewPrescriptionModal
          appointment={{ id: viewRx.appointmentId, patientId: viewRx.patient?.id, patient: viewRx.patient, appointmentDate: viewRx.createdAt }}
          onClose={() => { setViewRx(null); }}
          meta={{}}
        />
      )}

      {/* Edit Modal (iframe to full prescription builder) */}
      {modalType === "edit" && activeApptId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "95vw", maxWidth: 1400, height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
                  <Pencil size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Edit Prescription</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Modify prescription details</div>
                </div>
              </div>
              <button 
                onClick={() => { setModalType(null); setActiveApptId(null); fetchRx(); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                <X size={16} /> Close
              </button>
            </div>
            <iframe 
              src={`/doctor/prescription/${activeApptId}?mode=edit&isModal=1`}
              style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
              title="Prescription Builder"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal({ show: false, type: "single" }); }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440, padding: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={24} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Delete Prescription{deleteModal.type === "bulk" ? "s" : ""}?</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  {deleteModal.type === "single" 
                    ? "Are you sure you want to delete this prescription? This action cannot be undone."
                    : `Are you sure you want to delete ${deleteModal.count} prescription(s)? This action cannot be undone.`
                  }
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button 
                onClick={() => setDeleteModal({ show: false, type: "single" })}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#dc2626"}
                onMouseLeave={e => e.currentTarget.style.background = "#ef4444"}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
