
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, UserRound, Settings, HelpCircle,
  LogOut, Search, Bell, MessageSquare, Building2, Stethoscope, ClipboardList,
  CreditCard, IndianRupee, Plus, Trash2, Eye, ChevronRight, ChevronLeft,
  Phone, Mail, Calendar, Droplet, User, Activity, RefreshCw, Loader2,
  UserCircle, AlertTriangle, Pencil, X, Download, FileText, FileSpreadsheet,
  FileType, Upload, Image, FileIcon, Camera, Check
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType, TextRun, HeadingLevel } from "docx";
import { BookingWizard } from "@/components/AppointmentPanel";
import { ViewPrescriptionModal } from "@/app/subdept/dashboard/modals";

const api = async (url: string, method = "GET", body?: any) => {
  try {
    const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    if (!r.ok) {
      const errorText = await r.text();
      try {
        return JSON.parse(errorText);
      } catch {
        return { success: false, message: `Server error: ${r.status} ${r.statusText}` };
      }
    }
    return r.json();
  } catch (error: any) {
    console.error("API call failed:", error);
    return { success: false, message: error.message || "Network error" };
  }
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

// ─── Patient Management Panel ───
export function PatientsManagementPanel({ departmentId }: { departmentId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get("patientId");

  const [user, setUser] = useState<any>(null);

  // ... (rest of the component)

  useEffect(() => {
    if (urlPatientId) {
      loadPatientDetails(urlPatientId);
      setSelectedPatient({ id: urlPatientId });
    }
  }, [urlPatientId]);

  // List view state
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const urlQ = searchParams.get("q");
  const [searchTerm, setSearchTerm] = useState(urlQ || "");

  useEffect(() => {
    if (urlQ !== null) {
      setSearchTerm(urlQ);
      setCurrentPage(1);
    }
  }, [urlQ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [patientEditId, setPatientEditId] = useState<string | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [bookingPatient, setBookingPatient] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const itemsPerPage = 15;

  // Detail view state
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "appointments" | "medical" | "billing" | "plans">("overview");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [selectedRxAppointment, setSelectedRxAppointment] = useState<any>(null);
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);
  const [completingApptId, setCompletingApptId] = useState<string | null>(null);

  // Upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const loadPatients = async () => {
    setLoading(true);
    const deptParam = departmentId ? `&departmentId=${departmentId}` : "";
    const res = await api(`/api/patients?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}${deptParam}`);
    if (res.success) {
      setPatients(res.data.data || []);
      setTotalPages(Math.ceil((res.data.total || 0) / itemsPerPage));
      setTotalCount(res.data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    api("/api/auth/me").then(data => {
      if (data.success) {
        setUser(data.data);
        console.log("User role:", data.data.role);
      }
    });
  }, []);

  const loadPatientDetails = async (id: string) => {
    setDetailsLoading(true);
    setDetailTab("overview");
    setAppointments([]);
    setBills([]);
    setProcedures([]);
    setTreatmentPlans([]);

    try {
      const [pRes, aRes, bRes, prRes, tpRes] = await Promise.all([
        api(`/api/patients/${id}`),
        api(`/api/appointments?patientId=${id}`),
        api(`/api/billing?patientId=${id}`),
        api(`/api/subdept/records?patientId=${id}`),
        api(`/api/treatment-plans?patientId=${id}&limit=50`),
      ]);

      if (!pRes.success) {
        throw new Error(pRes.message || "Could not fetch patient details.");
      }

      setPatientDetails(pRes.data);
      if (aRes.success) setAppointments(Array.isArray(aRes.data?.data) ? aRes.data.data : []);
      if (bRes.success) setBills(Array.isArray(bRes.data?.bills) ? bRes.data.bills : Array.isArray(bRes.data) ? bRes.data : []);
      if (prRes.success) setProcedures(Array.isArray(prRes.data?.data) ? prRes.data.data : []);
      if (tpRes.success) setTreatmentPlans(Array.isArray(tpRes.data?.plans) ? tpRes.data.plans : []);

    } catch (error: any) {
      alert(`Failed to load patient dashboard: ${error.message}`);
      setSelectedPatient(null); // Close the view if data loading fails
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => { loadPatients(); }, [currentPage, searchTerm]);

  const completeAppointment = async (apptId: string, patientId: string) => {
    setCompletingApptId(apptId);
    await api(`/api/appointments/${apptId}`, "PUT", { status: "COMPLETED" });
    await loadPatientDetails(patientId);
    setCompletingApptId(null);
  };

  const handleViewProfile = async (p: any) => {
    setLoadingProfileId(p.id);
    await loadPatientDetails(p.id);
    setSelectedPatient(p);
    setLoadingProfileId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api(`/api/patients/${deleteTarget.id}`, "DELETE");
    if (res.success) { setDeleteTarget(null); loadPatients(); }
    else alert(res.message || "Failed to delete patient");
    setDeleting(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selectedIds.size === patients.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(patients.map(p => p.id)));
  };
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    let ok = 0;
    for (const id of ids) {
      const r = await api(`/api/patients/${id}`, "DELETE");
      if (r.success) ok++;
    }
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
    setBulkDeleting(false);
    loadPatients();
    if (ok < ids.length) alert(`Deleted ${ok} of ${ids.length}. Some failed.`);
  };

  // ── Upload helpers ──
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Only image files are allowed for profile photo."); return; }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "patient-photo");
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (data.success) {
        const upd = await api(`/api/patients/${patientDetails.id}`, "PUT", { profilePhoto: data.data.url });
        if (upd.success) setPatientDetails({ ...patientDetails, profilePhoto: data.data.url });
        else alert(upd.message || "Failed to save photo");
      } else alert(data.message || "Upload failed");
    } catch { alert("Upload error"); }
    setUploadingPhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingDoc(true);
    const currentDocs: { name: string; url: string; type: string; uploadedAt: string }[] = (() => {
      try { return JSON.parse(patientDetails.documents || "[]"); } catch { return []; }
    })();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) { alert(`"${file.name}" skipped — only images and PDFs allowed.`); continue; }
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", "patient-document");
        const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
        const data = await res.json();
        if (data.success) {
          currentDocs.push({ name: file.name, url: data.data.url, type: data.data.format || (isPdf ? "pdf" : "image"), uploadedAt: new Date().toISOString() });
        } else alert(`Failed to upload ${file.name}`);
      } catch { alert(`Error uploading ${file.name}`); }
    }
    const upd = await api(`/api/patients/${patientDetails.id}`, "PUT", { documents: JSON.stringify(currentDocs) });
    if (upd.success) setPatientDetails({ ...patientDetails, documents: JSON.stringify(currentDocs) });
    else alert("Failed to save documents");
    setUploadingDoc(false);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleDeleteDoc = async (idx: number) => {
    const docs: any[] = (() => { try { return JSON.parse(patientDetails.documents || "[]"); } catch { return []; } })();
    docs.splice(idx, 1);
    const upd = await api(`/api/patients/${patientDetails.id}`, "PUT", { documents: JSON.stringify(docs) });
    if (upd.success) setPatientDetails({ ...patientDetails, documents: JSON.stringify(docs) });
    else alert("Failed to remove document");
  };

  // ── Export helpers ──
  const getExportData = () => {
    const rows = selectedIds.size > 0 ? patients.filter(p => selectedIds.has(p.id)) : patients;
    return rows.map(p => ({
      "Patient ID": p.patientId,
      "Name": p.name,
      "Phone": p.phone,
      "Email": p.email || "—",
      "Gender": p.gender || "—",
      "Blood Group": p.bloodGroup || "—",
      "Age": p.dateOfBirth ? String(Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31557600000)) : "—",
      "Visits": String(p._count?.appointments || 0),
      "Registered": new Date(p.createdAt).toLocaleDateString("en-IN"),
    }));
  };
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Patients Report", 14, 16);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
    const rows = getExportData();
    const keys = Object.keys(rows[0] || {});
    autoTable(doc, { startY: 28, head: [keys], body: rows.map(r => keys.map(k => (r as any)[k])), styles: { fontSize:9 }, headStyles: { fillColor: [14, 137, 143] } });
    doc.save(`patients-${new Date().toISOString().slice(0, 10)}.pdf`);
    setShowExport(false);
  };
  const exportExcel = () => {
    const rows = getExportData();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");
    XLSX.writeFile(wb, `patients-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExport(false);
  };
  const exportWord = async () => {
    const rows = getExportData();
    const keys = Object.keys(rows[0] || {});
    const headerRow = new TableRow({ children: keys.map(k => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 18, font: "Calibri" })] })], width: { size: 100 / keys.length, type: WidthType.PERCENTAGE }, shading: { fill: "0E898F" } })) });
    const dataRows = rows.map(r => new TableRow({ children: keys.map(k => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String((r as any)[k] ?? ""), size: 18, font: "Calibri" })] })] })) }));
    const doc = new DocxDocument({ sections: [{ children: [new Paragraph({ text: "Patients Report", heading: HeadingLevel.HEADING_1 }), new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-IN")}`, size: 18, color: "888888" })] }), new Paragraph({ text: "" }), new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } })] }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `patients-${new Date().toISOString().slice(0, 10)}.docx`);
    setShowExport(false);
  };

  const age = (dob?: string) => {
    if (!dob) return "—";
    return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  };

  const statusStyle = (s: string) => {
    const m: any = {
      SCHEDULED: { background: "#E6F4F4", color: "#0E898F" },
      CONFIRMED: { background: "#f0f9ff", color: "#0ea5e9" },
      COMPLETED: { background: "#dcfce7", color: "#16a34a" },
      CANCELLED: { background: "#fee2e2", color: "#dc2626" },
      NO_SHOW: { background: "#fef3c7", color: "#f59e0b" },
      PENDING: { background: "#fef3c7", color: "#f59e0b" },
      PAID: { background: "#dcfce7", color: "#16a34a" },
      PARTIAL: { background: "#fef3c7", color: "#f59e0b" },
    };
    return m[s] || { background: "#f1f5f9", color: "#64748b" };
  };

  const totalPaid = Array.isArray(bills) ? bills.reduce((s, b) => s + (b.paidAmount || 0), 0) : 0;
  const totalPending = Array.isArray(bills) ? bills.reduce((s, b) => s + ((b.total || 0) - (b.paidAmount || 0)), 0) : 0;

  // ── DETAIL VIEW ──
  if (selectedPatient && patientDetails) {
    return (
      <div>
        {/* Breadcrumb header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <button
            onClick={() => { 
              setSelectedPatient(null); 
              setPatientDetails(null); 
              router.push(`${window.location.pathname}?tab=patients`);
            }}
            style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, fontSize:12, color: "#64748b" }}
          >
            <ChevronLeft size={15} /> All Patients
          </button>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ fontSize:13, fontWeight: 600, color: "#1e293b" }}>{patientDetails.name}</span>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => loadPatientDetails(selectedPatient.id)}
              style={{ padding: "8px 14px", background: "#0E898F", color: "#fff", border: "none", borderRadius: 9, display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontWeight: 600, fontSize:12 }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {detailsLoading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Loader2 size={32} color="#0E898F" style={{ animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <p style={{ marginTop: 14, color: "#64748b", fontSize:13 }}>Loading patient records...</p>
          </div>
        ) : (
          <>
            {/* Hero card */}
            <input type="file" ref={photoInputRef} accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
            <input type="file" ref={docInputRef} accept="image/*,.pdf" multiple style={{ display: "none" }} onChange={handleDocUpload} />
            <div style={{ background: "linear-gradient(135deg, #E6F4F4 0%, #f0fdfa 100%)", border: "1px solid #B3E0E0", borderRadius: 16, padding: "28px 32px", marginBottom: 20, color: "#1e293b" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "2.5px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer", overflow: "hidden" }}
                    title="Click to upload photo"
                  >
                    {uploadingPhoto ? (
                      <Loader2 size={28} color="#0E898F" style={{ animation: "spin 1s linear infinite" }} />
                    ) : patientDetails.profilePhoto ? (
                      <img src={patientDetails.profilePhoto} alt={patientDetails.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <UserCircle size={42} color="#94a3b8" />
                    )}
                  </div>
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: "50%", background: "#0E898F", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    title="Change photo"
                  >
                    <Camera size={12} color="#fff" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize:20, fontWeight: 800, marginBottom: 2 }}>{patientDetails.name}</div>
                  <div style={{ fontSize:12, color: "#64748b", marginBottom: 14 }}>ID: {patientDetails.patientId}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
                    {[
                      { icon: <Phone size={13} />, val: patientDetails.phone },
                      patientDetails.email && { icon: <Mail size={13} />, val: patientDetails.email },
                      patientDetails.gender && { icon: <User size={13} />, val: patientDetails.gender },
                      patientDetails.dateOfBirth && { icon: <Calendar size={13} />, val: `${age(patientDetails.dateOfBirth)} yrs` },
                      patientDetails.bloodGroup && { icon: <Droplet size={13} />, val: patientDetails.bloodGroup },
                    ].filter(Boolean).map((item: any, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize:12, color: "#475569" }}>
                        <span style={{ color: "#0E898F" }}>{item.icon}</span> {item.val}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                  {[
                    { label: "Visits", val: appointments.length },
                    { label: "Total Paid", val: `₹${totalPaid.toLocaleString()}` },
                    { label: "Pending", val: `₹${totalPending.toLocaleString()}` },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 18px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                      <div style={{ fontSize:10, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize:19, fontWeight: 700, color: "#0E898F" }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stat chips */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { icon: <CalendarDays size={20} color="#0E898F" />, bg: "#E6F4F4", label: "Appointments", val: appointments.length },
                { icon: <Stethoscope size={20} color="#16a34a" />, bg: "#f0fdf4", label: "Procedures", val: procedures.length },
                { icon: <CreditCard size={20} color="#f59e0b" />, bg: "#fef3c7", label: "Pending Bills", val: `₹${totalPending.toLocaleString()}` },
                { icon: <IndianRupee size={20} color="#16a34a" />, bg: "#dcfce7", label: "Total Revenue", val: `₹${totalPaid.toLocaleString()}` },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 18, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize:10, color: "#64748b", marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize:19, fontWeight: 700, color: "#1e293b" }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                {[
                  { id: "overview", label: "Overview", icon: <Activity size={14} /> },
                  { id: "appointments", label: "Appointments", icon: <CalendarDays size={14} /> },
                  { id: "medical", label: "Medical History", icon: <Stethoscope size={14} /> },
                  { id: "billing", label: "Billing & Payments", icon: <CreditCard size={14} /> },
                  { id: "plans", label: `Treatment Plans (${treatmentPlans.length})`, icon: <Activity size={14} /> },
                ].map(t => (
                  <button key={t.id} onClick={() => setDetailTab(t.id as any)} style={{
                    flex: 1, padding: "14px 16px", border: "none",
                    background: detailTab === t.id ? "#fff" : "transparent",
                    borderBottom: detailTab === t.id ? "2px solid #0E898F" : "2px solid transparent",
                    color: detailTab === t.id ? "#0E898F" : "#64748b",
                    fontWeight: 600, fontSize:12, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.15s"
                  }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: 24 }}>
                {/* OVERVIEW TAB */}
                {detailTab === "overview" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Personal Information</div>
                        {[
                          ["Patient ID", patientDetails.patientId],
                          ["Full Name", patientDetails.name],
                          ["Phone", patientDetails.phone],
                          ["Email", patientDetails.email || "—"],
                          ["Gender", patientDetails.gender || "—"],
                          ["Date of Birth", patientDetails.dateOfBirth ? new Date(patientDetails.dateOfBirth).toLocaleDateString() : "—"],
                          ["Age", `${age(patientDetails.dateOfBirth)} years`],
                          ["Blood Group", patientDetails.bloodGroup || "—"],
                          ["Patient Type", patientDetails.patientType || "NEW"],
                          ["Allergies", patientDetails.allergies || "None"],
                          ["Address", patientDetails.address || "—"],
                          ["Registered", new Date(patientDetails.createdAt).toLocaleDateString()],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize:12 }}>{k}</span>
                            <span style={{ fontWeight: 600, fontSize:12, color: "#1e293b", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                          </div>
                        ))}

                        <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 14, marginTop: 24 }}>Emergency Contact</div>
                        {[
                          ["Contact Person", patientDetails.emergencyName || "—"],
                          ["Relation", patientDetails.emergencyRelation || "—"],
                          ["Contact Number", patientDetails.emergencyPhone || "—"],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ color: "#64748b", fontSize:12 }}>{k}</span>
                            <span style={{ fontWeight: 600, fontSize:12, color: "#1e293b", textAlign: "right", maxWidth: "60%" }}>{v}</span>
                          </div>
                        ))}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Recent Appointments</div>
                      {appointments.length === 0 ? (
                        <div style={{ color: "#94a3b8", fontSize:12, padding: "20px 0" }}>No appointments found</div>
                      ) : appointments.slice(0, 6).map((a: any) => (
                        <div key={a.id} style={{ padding: 12, background: "#f8fafc", borderRadius: 9, border: "1px solid #e2e8f0", marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize:12, color: "#1e293b" }}>{a.doctor?.name}</span>
                            <span style={{ fontSize:10, color: "#94a3b8" }}>{new Date(a.appointmentDate).toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize:11, color: "#64748b" }}>{a.department?.name || "General"}</span>
                            <span style={{ ...statusStyle(a.status), padding: "2px 8px", borderRadius: 6, fontSize:10, fontWeight: 600 }}>{a.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Documents section - full width */}
                    <div style={{ gridColumn: "span 2", marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>Documents & Files</div>
                        <button
                          onClick={() => docInputRef.current?.click()}
                          disabled={uploadingDoc}
                          style={{ padding: "7px 14px", background: "#0E898F", color: "#fff", border: "none", borderRadius: 8, fontSize:11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                        >
                          {uploadingDoc ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={13} />}
                          {uploadingDoc ? "Uploading..." : "Upload Documents"}
                        </button>
                      </div>
                      <div style={{ fontSize:10, color: "#94a3b8", marginBottom: 12 }}>Accepted formats: Images (JPG, PNG, WEBP) and PDF files</div>
                      {(() => {
                        const docs: { name: string; url: string; type: string; uploadedAt: string }[] = (() => { try { return JSON.parse(patientDetails.documents || "[]"); } catch { return []; } })();
                        if (docs.length === 0) return (
                          <div style={{ padding: "36px 0", textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "2px dashed #e2e8f0", cursor: "pointer" }}
                            onClick={() => docInputRef.current?.click()}>
                            <FileIcon size={28} style={{ margin: "0 auto 10px", display: "block", color: "#cbd5e1" }} />
                            <div style={{ fontSize:12, color: "#94a3b8", fontWeight: 500 }}>No documents uploaded yet</div>
                            <div style={{ fontSize:11, color: "#cbd5e1", marginTop: 4 }}>Click here or use the button above to upload</div>
                          </div>
                        );
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                            {docs.map((doc, idx) => {
                              const isPdf = doc.type === "pdf" || doc.url?.toLowerCase().endsWith(".pdf");
                              return (
                                <div key={idx} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", position: "relative" }}>
                                  {/* Preview */}
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", height: 120, background: "#f8fafc", overflow: "hidden" }}>
                                    {isPdf ? (
                                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                        <FileText size={32} color="#ef4444" />
                                        <span style={{ fontSize:10, color: "#64748b", fontWeight: 600 }}>PDF Document</span>
                                      </div>
                                    ) : (
                                      <img src={doc.url} alt={doc.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}
                                  </a>
                                  {/* Info + delete */}
                                  <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize:10, fontWeight: 600, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={doc.name}>{doc.name}</div>
                                      <div style={{ fontSize:10, color: "#94a3b8" }}>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ""}</div>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteDoc(idx)}
                                      style={{ background: "#fff5f5", border: "none", borderRadius: 6, padding: 4, cursor: "pointer", color: "#ef4444", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                                      title="Remove document"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            {/* Add more tile */}
                            <div
                              onClick={() => docInputRef.current?.click()}
                              style={{ border: "2px dashed #e2e8f0", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: 156, background: "#fafbfc" }}
                            >
                              <Plus size={20} color="#94a3b8" />
                              <span style={{ fontSize:10, color: "#94a3b8", marginTop: 6, fontWeight: 500 }}>Add More</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* APPOINTMENTS TAB */}
                {detailTab === "appointments" && (
                  <>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Appointment History ({appointments.length})</div>
                    {appointments.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No appointments found</div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              {["Date & Time", "Doctor", "Department", "Type", "Fee", "Status", "Actions"].map(h => (
                                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map((a: any) => (
                              <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "14px", fontSize:12 }}>
                                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{new Date(a.appointmentDate).toLocaleDateString()}</div>
                                  <div style={{ fontSize:10, color: "#94a3b8" }}>{a.timeSlot}</div>
                                </td>
                                <td style={{ padding: "14px" }}>
                                  <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{a.doctor?.name}</div>
                                  <div style={{ fontSize:10, color: "#94a3b8" }}>{a.doctor?.specialization || ""}</div>
                                </td>
                                <td style={{ padding: "14px", fontSize:12, color: "#64748b" }}>{a.department?.name || "General"}</td>
                                <td style={{ padding: "14px" }}><span style={{ background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: 6, fontSize:10, fontWeight: 600 }}>{a.type}</span></td>
                                <td style={{ padding: "14px", fontSize:12, fontWeight: 700, color: "#1e293b" }}>₹{(a.consultationFee || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px" }}><span style={{ ...statusStyle(a.status), padding: "4px 10px", borderRadius: 6, fontSize:10, fontWeight: 600 }}>{a.status}</span></td>
                                <td style={{ padding: "10px 14px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    {/* View Rx */}
                                    <button
                                      onClick={() => setSelectedRxAppointment(a)}
                                      title="View Rx"
                                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                                    >
                                      <Eye size={11} /> View Rx
                                    </button>
                                    {/* Complete */}
                                    {a.status !== "COMPLETED" && a.status !== "CANCELLED" && (
                                      <button
                                        onClick={() => completeAppointment(a.id, patientDetails.id)}
                                        disabled={completingApptId === a.id}
                                        title="Mark as Completed"
                                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: completingApptId === a.id ? "#f1f5f9" : "#fff7ed", color: completingApptId === a.id ? "#94a3b8" : "#ea580c", fontSize: 10, fontWeight: 600, cursor: completingApptId === a.id ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                                      >
                                        {completingApptId === a.id
                                          ? <Loader2 size={11} style={{ animation: "spin .7s linear infinite" }} />
                                          : <Check size={11} />}
                                        {completingApptId === a.id ? "..." : "Complete"}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* MEDICAL TAB */}
                {detailTab === "medical" && (
                  <>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Procedure Records ({procedures.length})</div>
                    {procedures.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No procedure records found</div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              {["Date", "Procedure", "Department", "Type", "Amount", "Performed By", "Status", "Prescription"].map(h => (
                                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {procedures.map((p: any) => (
                              <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "14px", fontSize:12, color: "#1e293b" }}>{new Date(p.performedAt).toLocaleDateString()}</td>
                                <td style={{ padding: "14px", fontSize:12, fontWeight: 600, color: "#1e293b" }}>{p.procedure?.name}</td>
                                <td style={{ padding: "14px", fontSize:12, color: "#64748b" }}>{p.subDepartment?.name}</td>
                                <td style={{ padding: "14px" }}><span style={{ background: "#f1f5f9", color: "#64748b", padding: "3px 8px", borderRadius: 6, fontSize:10 }}>{p.procedure?.type}</span></td>
                                <td style={{ padding: "14px", fontSize:12, fontWeight: 700, color: "#1e293b" }}>₹{(p.amount || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize:12, color: "#64748b" }}>{p.performedBy || "—"}</td>
                                <td style={{ padding: "14px" }}><span style={{ ...statusStyle(p.status), padding: "4px 10px", borderRadius: 6, fontSize:10, fontWeight: 600 }}>{p.status}</span></td>
                                <td style={{ padding: "14px" }}>
                                  {p.appointment?.id ? (
                                    <button
                                      onClick={() => setSelectedRxAppointment(p.appointment)}
                                      style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0E898F" }}
                                      title="View Prescription"
                                    >
                                      <FileText size={14} />
                                    </button>
                                  ) : (
                                    <span style={{ fontSize:11, color: "#cbd5e1" }}>—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* TREATMENT PLANS TAB */}
                {detailTab === "plans" && (
                  <>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Treatment Plans ({treatmentPlans.length})</div>
                    {treatmentPlans.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No treatment plans found</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {treatmentPlans.map((plan: any) => {
                          const pct = plan.totalSessions > 0 ? Math.round((plan.completedSessions / plan.totalSessions) * 100) : 0;
                          const statusColors: any = { ACTIVE: { bg: "#E6F4F4", c: "#0A6B70" }, COMPLETED: { bg: "#f0fdf4", c: "#16a34a" }, CANCELLED: { bg: "#fff5f5", c: "#ef4444" }, ON_HOLD: { bg: "#fefce8", c: "#ca8a04" } };
                          const sc = statusColors[plan.status] || { bg: "#f1f5f9", c: "#64748b" };
                          const balance = (plan.totalCost || 0) - (plan.paidAmount || 0);
                          return (
                            <div key={plan.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                <div>
                                  <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>{plan.planName}</div>
                                  <div style={{ fontSize:11, color: "#64748b", marginTop: 2 }}>{plan.service?.name || plan.doctor?.name || ""}</div>
                                </div>
                                <span style={{ ...sc, padding: "3px 10px", borderRadius: 100, fontSize:10, fontWeight: 700, border: `1px solid ${sc.c}33` }}>{plan.status}</span>
                              </div>
                              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 100, overflow: "hidden", marginBottom: 10 }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#0E898F,#10b981)", borderRadius: 100 }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize:11 }}>
                                <span style={{ color: "#64748b" }}>{plan.completedSessions}/{plan.totalSessions} sessions ({pct}%)</span>
                                <div style={{ display: "flex", gap: 14 }}>
                                  <span style={{ color: "#16a34a", fontWeight: 600 }}>₹{(plan.paidAmount || 0).toLocaleString()} paid</span>
                                  {balance > 0 && <span style={{ color: "#ef4444", fontWeight: 600 }}>₹{balance.toLocaleString()} due</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* BILLING TAB */}
                {detailTab === "billing" && (
                  <>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Billing & Payments ({bills.length})</div>
                    {bills.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No billing records found</div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                              {["Bill No", "Date", "Subtotal", "Discount", "Tax", "Total", "Paid", "Balance", "Status"].map(h => (
                                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bills.map((b: any) => (
                              <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "14px", fontSize:12, fontWeight: 700, color: "#0E898F", fontFamily: "monospace" }}>{b.billNo}</td>
                                <td style={{ padding: "14px", fontSize:12, color: "#64748b" }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                                <td style={{ padding: "14px", fontSize:12 }}>₹{(b.subtotal || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize:12, color: "#16a34a" }}>-₹{(b.discount || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize:12, color: "#64748b" }}>₹{(b.tax || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize:12, fontWeight: 700 }}>₹{(b.total || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize:12, fontWeight: 600, color: "#16a34a" }}>₹{(b.paidAmount || 0).toLocaleString()}</td>
                                <td style={{ padding: "14px", fontSize:12, fontWeight: 600, color: (b.total - b.paidAmount) > 0 ? "#dc2626" : "#16a34a" }}>
                                  ₹{((b.total || 0) - (b.paidAmount || 0)).toLocaleString()}
                                </td>
                                <td style={{ padding: "14px" }}><span style={{ ...statusStyle(b.status), padding: "4px 10px", borderRadius: 6, fontSize:10, fontWeight: 600 }}>{b.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Delete confirm modal for patient inside detail view - not needed here */}
        {selectedRxAppointment && (
          <ViewPrescriptionModal
            appointment={selectedRxAppointment}
            meta={{ accent: "#0E898F" }}
            onClose={() => setSelectedRxAppointment(null)}
          />
        )}
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight: 800, color: "#1e293b", margin: 0 }}>Patient Management</h1>
          {totalCount > 0 && (
            <p style={{ fontSize:12, color: "#64748b", margin: "4px 0 0 0" }}>{totalCount} registered patients</p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selectedIds.size > 0 && (
            <button onClick={() => setShowBulkConfirm(true)}
              style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize:11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Trash2 size={14} /> Delete ({selectedIds.size})
            </button>
          )}
          {/* Export dropdown */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowExport(!showExport)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 500, cursor: "pointer" }}>
              <Download size={14} /> Export
            </button>
            {showExport && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 50, minWidth: 180, padding: 6 }}>
                {[
                  { label: "PDF Document", icon: <FileText size={14} />, bg: "#fff5f5", color: "#ef4444", fn: exportPDF },
                  { label: "Excel Spreadsheet", icon: <FileSpreadsheet size={14} />, bg: "#f0fdf4", color: "#16a34a", fn: exportExcel },
                  { label: "Word Document", icon: <FileType size={14} />, bg: "#eff6ff", color: "#2563eb", fn: exportWord },
                ].map(item => (
                  <button key={item.label} onClick={item.fn}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize:12, color: "#334155", fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: item.bg, color: item.color }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddPatient(true)}
            style={{ padding: "8px 20px", background: "linear-gradient(135deg,#0E898F,#07595D)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize:12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={15} /> Register New
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <Search size={16} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search by name, phone number or patient ID..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          style={{ flex: 1, border: "none", outline: "none", fontSize:12, color: "#334155", background: "transparent" }}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize:11 }}>Clear</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "70px 0", textAlign: "center", color: "#94a3b8" }}>
            <Loader2 size={28} color="#0E898F" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontSize:12 }}>Loading patients...</div>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: "70px 0", textAlign: "center", color: "#94a3b8" }}>
            <UserRound size={40} style={{ opacity: 0.25, margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontSize:13, fontWeight: 600 }}>No patients found</div>
            <div style={{ fontSize:11, marginTop: 4 }}>{searchTerm ? "Try a different search term" : "Register your first patient to get started"}</div>
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "13px 10px 13px 16px", width: 36 }}>
                    <div onClick={toggleAll} style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${patients.length > 0 && selectedIds.size === patients.length ? "#0E898F" : "#cbd5e1"}`, background: patients.length > 0 && selectedIds.size === patients.length ? "#0E898F" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      {patients.length > 0 && selectedIds.size === patients.length && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                  </th>
                  {["Patient ID", "Patient", "Contact", "Gender", "Age", "Blood Group", "Visits", "Registered", "Actions"].map(h => (
                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s", background: selectedIds.has(p.id) ? "#f0fdfa" : undefined }}
                    onMouseEnter={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = "#fafbfc"; }}
                    onMouseLeave={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "15px 10px 15px 16px", width: 36 }}>
                      <div onClick={() => toggleSelect(p.id)} style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${selectedIds.has(p.id) ? "#0E898F" : "#cbd5e1"}`, background: selectedIds.has(p.id) ? "#0E898F" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                        {selectedIds.has(p.id) && <Check size={12} color="#fff" strokeWidth={3} />}
                      </div>
                    </td>
                    <td style={{ padding: "15px 16px" }}>
                      <span style={{ fontSize:10, fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "3px 8px", borderRadius: 6 }}>{p.patientId}</span>
                    </td>
                    <td style={{ padding: "15px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "15px 16px" }}>
                      <div style={{ fontSize:12, fontWeight: 500, color: "#334155" }}>{p.phone}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>{p.email || "—"}</div>
                    </td>
                    <td style={{ padding: "15px 16px" }}>
                      <span style={{ fontSize:11, color: "#64748b", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>{p.gender || "—"}</span>
                    </td>
                    <td style={{ padding: "15px 16px", fontSize:12, color: "#64748b" }}>{age(p.dateOfBirth)}</td>
                    <td style={{ padding: "15px 16px" }}>
                      <span style={{ fontSize:11, background: "#fef3c7", color: "#f59e0b", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{p.bloodGroup || "—"}</span>
                    </td>
                    <td style={{ padding: "15px 16px", fontSize:12, fontWeight: 700, color: "#0A6B70" }}>{p._count?.appointments || 0}</td>
                    <td style={{ padding: "15px 16px", fontSize:11, color: "#94a3b8" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "15px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleViewProfile(p)}
                          disabled={loadingProfileId === p.id}
                          style={{ padding: "6px 12px", background: "#E6F4F4", color: "#0E898F", border: "none", borderRadius: 8, cursor: loadingProfileId === p.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4, fontSize:11, fontWeight: 600, opacity: loadingProfileId === p.id ? 0.7 : 1 }}
                          title="View Profile"
                        >
                          {loadingProfileId === p.id ? (
                            <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading...</>
                          ) : (
                            <>View Profile <ChevronRight size={14} /></>
                          )}
                        </button>
                        <button
                          onClick={() => setBookingPatient(p)}
                          style={{ padding: "8px", background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Book Appointment"
                        >
                          <CalendarDays size={15} />
                        </button>
                        <button
                          onClick={() => setPatientEditId(p.id)}
                          style={{ padding: "8px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Edit Profile"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          style={{ padding: "8px", background: "#fff5f5", color: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Delete Patient"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize:11, color: "#94a3b8" }}>Page {currentPage} of {totalPages} · {totalCount} patients</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1, fontSize:11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pg = currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                    if (pg < 1 || pg > totalPages) return null;
                    return (
                      <button key={i} onClick={() => setCurrentPage(pg)}
                        style={{ width: 32, height: 32, border: "1px solid #e2e8f0", borderRadius: 7, background: currentPage === pg ? "#0E898F" : "#fff", color: currentPage === pg ? "#fff" : "#64748b", cursor: "pointer", fontSize:11, fontWeight: 600 }}>
                        {pg}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1, fontSize:11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={22} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Delete Patient?</div>
                <div style={{ fontSize:12, color: "#64748b", lineHeight: 1.5 }}>
                  This will permanently delete <b>{deleteTarget.name}</b> and all their medical history, appointments, and billing records.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 9, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize:12, color: "#64748b" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "9px 18px", background: "#ef4444", border: "none", borderRadius: 9, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize:12, display: "flex", alignItems: "center", gap: 7 }}>
                {deleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {patientEditId && (
        <PatientEditModal 
          patientId={patientEditId} 
          onClose={() => setPatientEditId(null)} 
          onUpdate={loadPatients} 
        />
      )}

      {/* Add Patient Modal */}
      {showAddPatient && (
        <AddPatientModal
          onClose={() => setShowAddPatient(false)}
          onSuccess={() => { setShowAddPatient(false); loadPatients(); }}
        />
      )}

      {/* Book Appointment Modal */}
      {bookingPatient && (
        <BookingWizard
          initialPatient={bookingPatient}
          onClose={() => setBookingPatient(null)}
          onSuccess={() => { setBookingPatient(null); loadPatients(); }}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowBulkConfirm(false)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={22} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Delete {selectedIds.size} Patients?</div>
                <div style={{ fontSize:12, color: "#64748b", lineHeight: 1.5 }}>
                  This will permanently delete the selected patients and all their associated records. This action cannot be undone.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowBulkConfirm(false)}
                style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 9, background: "#fff", cursor: "pointer", fontWeight: 600, fontSize:12, color: "#64748b" }}>
                Cancel
              </button>
              <button onClick={handleBulkDelete} disabled={bulkDeleting}
                style={{ padding: "9px 18px", background: "#ef4444", border: "none", borderRadius: 9, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize:12, display: "flex", alignItems: "center", gap: 7 }}>
                {bulkDeleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size} Patients`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Patient Edit Modal Component ───
function PatientEditModal({ patientId, onClose, onUpdate }: { patientId: string; onClose: () => void; onUpdate: () => void }) {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const d = await api(`/api/patients/${patientId}`);
        if (d.success) {
          const p = d.data;
          setForm({
            ...p,
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split("T")[0] : "",
          });
        } else {
          throw new Error(d.message || "Could not fetch patient details.");
        }
      } catch (error: any) {
        alert(`Failed to load patient for editing: ${error.message}`);
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const d = await api(`/api/patients/${patientId}`, "PUT", form);
    if (d.success) {
      onUpdate();
      onClose();
    } else {
      setMsg(d.message || "Failed to update patient");
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, textAlign: "center", width: 400 }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 10px", color: "#0E898F" }} />
        <div style={{ fontSize:12, color: "#64748b" }}>Loading patient profile...</div>
      </div>
    </div>
  );

  if (!form) return null;

  const LBL: React.CSSProperties = { display: "block", fontSize:10, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".03em" };
  const INP: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize:12, outline: "none" };
  const SEL: React.CSSProperties = { ...INP, background: "#fff" };
  const SECTION: React.CSSProperties = { fontSize:12, fontWeight: 700, color: "#0E898F", marginBottom: 10, marginTop: 16, display: "flex", alignItems: "center", gap: 6 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 0, width: 650, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <div style={{ fontSize:17, fontWeight: 700, color: "#1e293b" }}>Edit Patient Profile</div>
            <div style={{ fontSize:12, color: "#64748b", marginTop: 2 }}>Update complete information for {form.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: "auto", padding: "20px 28px" }}>
          <div style={SECTION}><User size={14} /> Basic Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={LBL}>Full Name *</label>
              <input 
                style={INP}
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label style={LBL}>Phone Number *</label>
              <input 
                style={INP}
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label style={LBL}>Email Address</label>
              <input 
                style={INP}
                type="email" 
                value={form.email || ""} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
              />
            </div>
            <div>
              <label style={LBL}>Gender *</label>
              <select 
                style={SEL}
                value={form.gender || ""} 
                onChange={e => setForm({ ...form, gender: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label style={LBL}>Date of Birth</label>
              <input 
                type="date"
                style={INP}
                value={form.dateOfBirth || ""} 
                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} 
              />
            </div>
            <div>
              <label style={LBL}>Blood Group</label>
              <select 
                style={SEL}
                value={form.bloodGroup || ""} 
                onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
              >
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={LBL}>Address</label>
              <input 
                style={INP}
                value={form.address || ""} 
                onChange={e => setForm({ ...form, address: e.target.value })} 
              />
            </div>
          </div>

          <div style={SECTION}><ClipboardList size={14} /> Medical Classification</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={LBL}>Patient Type</label>
              <select style={SEL} value={form.patientType || "NEW"} onChange={e => setForm({ ...form, patientType: e.target.value })}>
                <option value="NEW">New</option>
                <option value="EXISTING">Existing</option>
              </select>
            </div>
            <div>
              <label style={LBL}>Allergies</label>
              <input style={INP} value={form.allergies || ""} onChange={e => setForm({ ...form, allergies: e.target.value })} placeholder="e.g. Penicillin, Dust" />
            </div>
          </div>

          <div style={SECTION}><Phone size={14} /> Emergency Contact</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={LBL}>Contact Person</label>
              <input style={INP} value={form.emergencyName || ""} onChange={e => setForm({ ...form, emergencyName: e.target.value })} placeholder="Name" />
            </div>
            <div>
              <label style={LBL}>Relation</label>
              <select style={SEL} value={form.emergencyRelation || ""} onChange={e => setForm({ ...form, emergencyRelation: e.target.value })}>
                <option value="">Select</option>
                {["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Contact Number</label>
              <input style={INP} value={form.emergencyPhone || ""} onChange={e => setForm({ ...form, emergencyPhone: e.target.value })} placeholder="Phone" />
            </div>
          </div>

          {msg && <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "#fff5f5", color: "#ef4444", fontSize:11, fontWeight: 600 }}>{msg}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 32, paddingBottom: 10 }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: "#0E898F", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Save All Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Patient Modal Component (3-Step Wizard) ───
function AddPatientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [bookAppointmentNow, setBookAppointmentNow] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", gender: "", dateOfBirth: "", bloodGroup: "", email: "", address: "",
  });

  const [visit, setVisit] = useState({
    visitType: "OPD", customVisitType: "", departmentId: "", doctorId: "", complaint: "",
    appointmentType: "WALK_IN", appointmentDate: "", timeSlot: "", patientType: "NEW", allergies: "",
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    api("/api/config/departments?simple=true").then(d => {
      const EXCLUDE = ["ADMINISTRATIVE", "SUPPORT"];
      setDepartments((d.data || []).filter((dp: any) => !dp.type || !EXCLUDE.includes(dp.type)));
    });
  }, []);

  useEffect(() => {
    if (!visit.departmentId) { setDoctors([]); return; }
    api(`/api/config/doctors?simple=true&departmentId=${visit.departmentId}`).then(d => setDoctors(d.data || []));
  }, [visit.departmentId]);

  useEffect(() => {
    if (!visit.doctorId || !visit.appointmentDate) { setSlots([]); return; }
    setLoadingSlots(true);
    api(`/api/appointments/slots?doctorId=${visit.doctorId}&date=${visit.appointmentDate}`)
      .then(d => { setSlots(d.data?.slots || []); setBookedSlots(d.data?.bookedSlots || []); })
      .finally(() => setLoadingSlots(false));
  }, [visit.doctorId, visit.appointmentDate]);

  const today = new Date().toISOString().split("T")[0];

  const canSave = form.name.trim().length >= 2 && form.phone.trim().length >= 7 && !!form.gender && 
    (!bookAppointmentNow || (!!visit.departmentId && !!visit.doctorId && !!visit.appointmentDate && !!visit.timeSlot));

  const handleFinalSubmit = async () => {
    setSaving(true); setMsg(null);
    const patientPayload: any = {
      name: form.name.trim(), phone: form.phone.trim(), gender: form.gender,
      patientType: visit.patientType, allergies: visit.allergies,
    };
    if (form.dateOfBirth) patientPayload.dateOfBirth = form.dateOfBirth;
    if (form.bloodGroup) patientPayload.bloodGroup = form.bloodGroup;
    if (form.email) patientPayload.email = form.email;
    if (form.address) patientPayload.address = form.address;

    const pRes = await api("/api/patients", "POST", patientPayload);
    if (!pRes.success) { setMsg({ type: "error", text: pRes.message || "Failed to register patient" }); setSaving(false); return; }
    const patient = pRes.data?.patient || pRes.data;

    if (bookAppointmentNow && visit.doctorId && visit.appointmentDate && visit.timeSlot) {
      const resolvedType = visit.visitType === "OTHER" ? (visit.customVisitType || "OPD") : visit.visitType;
      const apptType = ["EMERGENCY", "FOLLOW_UP", "OPD", "ONLINE"].includes(resolvedType) ? resolvedType : "OPD";
      const apptPayload: any = {
        patientId: patient.id, doctorId: visit.doctorId, appointmentDate: visit.appointmentDate, 
        timeSlot: visit.timeSlot, type: apptType, notes: visit.complaint || null, departmentId: visit.departmentId,
      };

      const doc = doctors.find((d: any) => d.id === visit.doctorId);
      if (doc?.consultationFee) apptPayload.consultationFee = parseFloat(doc.consultationFee);

      const aRes = await api("/api/appointments", "POST", apptPayload);
      if (!aRes.success) { setMsg({ type: "error", text: `Patient registered but appointment failed: ${aRes.message}` }); setSaving(false); return; }
    }

    onSuccess();
  };

  const LBL: React.CSSProperties = { display: "block", fontSize:10, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".03em" };
  const INP: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize:12, outline: "none" };
  const SEL: React.CSSProperties = { ...INP, background: "#fff" };
  const SECTION: React.CSSProperties = { fontSize:12, fontWeight: 700, color: "#0E898F", marginBottom: 10, marginTop: 16, display: "flex", alignItems: "center", gap: 6 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 18, width: 680, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,.18)", overflow: "hidden" }} onClick={e => e.stopPropagation()}>

        <div style={{ background: "linear-gradient(135deg,#0E898F,#07595D)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <UserRound size={17} color="#fff" />
            <span style={{ fontSize:14, fontWeight: 800, color: "#fff" }}>Register New Patient</span>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, padding: "6px 10px", color: "#fff", cursor: "pointer" }}><X size={14} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 20px" }}>
          <div style={SECTION}><UserRound size={14} /> Basic Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={LBL}>Full Name *</label>
              <input style={INP} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Patient's full name" required />
            </div>
            <div>
              <label style={LBL}>Mobile Number *</label>
              <input style={INP} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" required />
            </div>
            <div>
              <label style={LBL}>Gender *</label>
              <select style={SEL} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} required>
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label style={LBL}>Date of Birth</label>
              <input type="date" style={INP} value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div>
              <label style={LBL}>Blood Group</label>
              <select style={SEL} value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
                <option value="">Select</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={LBL}>Address</label>
              <input style={INP} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
            </div>
          </div>

          <div style={{ marginTop: 24, padding: "14px", background: bookAppointmentNow ? "#E6F4F4" : "#f8fafc", borderRadius: 12, border: bookAppointmentNow ? "1px solid #0E898F" : "1px solid #e2e8f0", transition: "all .2s" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={bookAppointmentNow} onChange={e => setBookAppointmentNow(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#0E898F" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Book an appointment for this patient now</span>
            </label>
          </div>

          {bookAppointmentNow && (
            <div style={{ marginTop: 16, padding: "16px 20px", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <div style={{ ...SECTION, marginTop: 0 }}><Stethoscope size={14} /> Visit Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={LBL}>Department *</label>
                  <select style={SEL} value={visit.departmentId} onChange={e => setVisit({ ...visit, departmentId: e.target.value, doctorId: "", timeSlot: "" })}>
                    <option value="">Select Department</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Doctor *</label>
                  <select style={SEL} value={visit.doctorId} onChange={e => setVisit({ ...visit, doctorId: e.target.value, timeSlot: "" })}>
                    <option value="">Select Doctor</option>
                    {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` — ${d.specialization}` : ""}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={LBL}>Reason for Visit / Chief Complaint</label>
                  <input style={INP} value={visit.complaint} onChange={e => setVisit({ ...visit, complaint: e.target.value })} placeholder="e.g. Fever, Headache, Routine Checkup" />
                </div>
              </div>

              <div style={SECTION}><Calendar size={14} /> Appointment Schedule</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
                <div>
                  <label style={LBL}>Appointment Date *</label>
                  <input type="date" style={INP} min={today} value={visit.appointmentDate} onChange={e => setVisit({ ...visit, appointmentDate: e.target.value, timeSlot: "" })} />
                </div>
                <div>
                  <label style={LBL}>Selected Slot *</label>
                  <input style={{ ...INP, background: "#f8fafc", cursor: "default" }} readOnly value={visit.timeSlot || "Select from below"} />
                </div>
              </div>
              {visit.doctorId && visit.appointmentDate && (
                <div style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", padding: 14, marginBottom: 12 }}>
                  {loadingSlots ? (
                    <div style={{ textAlign: "center", padding: 16 }}><Loader2 size={18} color="#0E898F" style={{ animation: "spin 1s linear infinite" }} /></div>
                  ) : (() => {
                    const filteredSlots = slots.filter(s => {
                      if (!visit.appointmentDate) return true;
                      const now = new Date();
                      const [y, m, day] = visit.appointmentDate.split("-").map(Number);
                      const [h, min] = s.split(":").map(Number);
                      const slotDate = new Date(y, m - 1, day, h, min, 0);
                      return slotDate > now;
                    });
                    
                    if (filteredSlots.length === 0) {
                      return <div style={{ textAlign: "center", padding: 12, color: "#94a3b8", fontSize:11 }}>No slots available for this date</div>;
                    }
                    
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {filteredSlots.map(s => {
                          const booked = bookedSlots.includes(s);
                          const selected = visit.timeSlot === s;
                          const [h, m] = s.split(":").map(Number);
                          const ampm = h >= 12 ? "PM" : "AM";
                          const h12 = h % 12 || 12;
                          const formattedTime = `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;

                          return (
                            <button key={s} type="button" disabled={booked}
                              onClick={() => setVisit({ ...visit, timeSlot: s })}
                              style={{ padding: "8px 4px", borderRadius: 8, border: selected ? "2px solid #0E898F" : booked ? "1px solid #e2e8f0" : "1.5px solid #B3E0E0", background: selected ? "#0E898F" : booked ? "#f1f5f9" : "#E6F4F4", color: selected ? "#fff" : booked ? "#cbd5e1" : "#0A6B70", fontSize:11, fontWeight: 700, cursor: booked ? "not-allowed" : "pointer", textDecoration: booked ? "line-through" : "none", fontFamily: "'Inter',sans-serif" }}>
                              {formattedTime}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {msg && (
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: msg.type === "error" ? "#fff5f5" : "#f0fdf4", color: msg.type === "error" ? "#ef4444" : "#16a34a", fontSize:11, fontWeight: 600 }}>
              {msg.text}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 12, background: "#fafbfc" }}>
          <button onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleFinalSubmit} disabled={saving || !canSave}
            style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: canSave ? "#0E898F" : "#cbd5e1", color: "#fff", fontSize:12, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8 }}>
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : (bookAppointmentNow ? "Register & Book Appointment" : "Register Patient")}
          </button>
        </div>
      </div>
    </div>
  );
}
