"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, Search, X, Loader2, Check, AlertTriangle,
  ChevronLeft, ChevronRight, User, DollarSign, Briefcase, Calendar,
  Clock, Filter, Stethoscope, Upload, FileText, ArrowLeft, Send, Download,
  Eye, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, FileType, ShieldAlert, Info
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document as DocxDocument, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType, TextRun, HeadingLevel } from "docx";
import ScheduleBuilder from "./ScheduleBuilder";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  profileImage?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  specialization?: string | null;
  qualification?: string | null;
  experience: number;
  registrationNo?: string | null;
  licenseNo?: string | null;
  agreementDoc?: string | null;
  govtIdCard?: string | null;
  signature?: string | null;
  hospitalStamp?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  consultationFee: number;
  followUpFee?: number | null;
  isActive: boolean;
  isAvailable: boolean;
  credentialsSent?: boolean;
  userId?: string | null;
  _count?: { availability: number };
}

interface Department {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  profileImage: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  specialization: string;
  qualification: string;
  experience: string;
  registrationNo: string;
  licenseNo: string;
  agreementDoc: string;
  govtIdCard: string;
  signature: string;
  hospitalStamp: string;
  departmentId: string;
  consultationFee: string;
  followUpFee: string;
  isActive: boolean;
  isAvailable: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const GENDERS = [
  { value: "", label: "Select Gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

const emptyForm: FormData = {
  name: "", email: "", phone: "", gender: "", profileImage: "",
  dateOfBirth: "", bloodGroup: "", address: "",
  specialization: "", qualification: "", experience: "0",
  registrationNo: "", licenseNo: "",
  agreementDoc: "", govtIdCard: "", signature: "", hospitalStamp: "",
  departmentId: "", consultationFee: "0", followUpFee: "",
  isActive: true, isAvailable: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="dp-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`dp-toast dp-toast-${t.type}`}>
          {t.type === "success" && <Check size={16} />}
          {t.type === "error" && <AlertTriangle size={16} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="dp-toast-close"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Delete", loading = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmText?: string; loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="dp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dp-confirm">
        <div style={{ marginBottom: 16 }}><AlertTriangle size={32} color="#ef4444" /></div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="dp-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="dp-btn-danger" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={14} className="dp-spin" />}{confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" className={`dp-toggle ${checked ? "on" : ""} ${disabled ? "disabled" : ""}`}
      onClick={() => !disabled && onChange(!checked)}>
      <span className="dp-toggle-thumb" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD FIELD
// ─────────────────────────────────────────────────────────────────────────────

function UploadField({ label, value, fieldKey, uploadType, accept, onChange, hint }: {
  label: string; value: string; fieldKey: string;
  uploadType: "image" | "document"; accept: string;
  onChange: (url: string) => void; hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", uploadType);
    try {
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (data.success) onChange(data.data.url);
      else setErr(data.message || "Upload failed");
    } catch { setErr("Upload failed. Try again."); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  const isPDF = value?.includes(".pdf") || (value && !value.match(/\.(jpg|jpeg|png|webp|gif)$/i));

  return (
    <div className="dp-upload-field">
      <label className="dp-lbl">{label}</label>
      {value ? (
        <div className="dp-upload-preview">
          {!isPDF ? (
            <img src={value} alt={label} className="dp-upload-img" />
          ) : (
            <div className="dp-upload-doc-prev">
              <FileText size={30} color="#0E898F" />
              <span>Document uploaded</span>
              <a href={value} target="_blank" rel="noreferrer" className="dp-upload-view-link">View</a>
            </div>
          )}
          <button type="button" className="dp-upload-remove" onClick={() => onChange("")}><X size={13} /></button>
        </div>
      ) : (
        <label className={`dp-upload-zone${uploading ? " loading" : ""}`}>
          {uploading ? (
            <div className="dp-upload-inner"><Loader2 size={22} className="dp-spin" /><span>Uploading...</span></div>
          ) : (
            <div className="dp-upload-inner">
              <Upload size={22} color="#94a3b8" />
              <span className="dp-upload-txt">Click to upload</span>
              {hint && <span className="dp-upload-hint">{hint}</span>}
            </div>
          )}
          <input ref={inputRef} type="file" accept={accept} onChange={handleFile} disabled={uploading} style={{ display: "none" }} />
        </label>
      )}
      {err && <span className="dp-error">{err}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR FORM (dedicated page view - replaces modal)
// ─────────────────────────────────────────────────────────────────────────────

function DoctorForm({ editItem, departments, onSuccess, onCancel, addToast }: {
  editItem: Doctor | null;
  departments: Department[];
  onSuccess: () => void;
  onCancel: () => void;
  addToast: (type: Toast["type"], msg: string) => void;
}) {
  const [form, setForm] = useState<FormData>(() => {
    if (!editItem) return emptyForm;
    return {
      name: editItem.name, email: editItem.email, phone: editItem.phone || "",
      gender: editItem.gender || "", profileImage: editItem.profileImage || "",
      dateOfBirth: editItem.dateOfBirth ? editItem.dateOfBirth.slice(0, 10) : "",
      bloodGroup: editItem.bloodGroup || "", address: editItem.address || "",
      specialization: editItem.specialization || "", qualification: editItem.qualification || "",
      experience: editItem.experience.toString(), registrationNo: editItem.registrationNo || "",
      licenseNo: editItem.licenseNo || "", agreementDoc: editItem.agreementDoc || "",
      govtIdCard: editItem.govtIdCard || "", signature: editItem.signature || "",
      hospitalStamp: editItem.hospitalStamp || "", departmentId: editItem.departmentId || "",
      consultationFee: editItem.consultationFee.toString(),
      followUpFee: editItem.followUpFee?.toString() || "",
      isActive: editItem.isActive, isAvailable: editItem.isAvailable,
    };
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sf = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name || form.name.length < 2) e.name = "Name must be at least 2 characters";
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (form.phone && form.phone.replace(/\D/g, "").length < 10) e.phone = "Min 10 digits";
    if (isNaN(parseInt(form.experience)) || parseInt(form.experience) < 0) e.experience = "Must be ≥ 0";
    if (isNaN(parseFloat(form.consultationFee))) e.consultationFee = "Must be a number";
    if (form.followUpFee && isNaN(parseFloat(form.followUpFee))) e.followUpFee = "Must be a number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload: any = {
      name: form.name, email: form.email.toLowerCase(), phone: form.phone || null,
      gender: form.gender || null, profileImage: form.profileImage || null,
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
      bloodGroup: form.bloodGroup || null, address: form.address || null,
      specialization: form.specialization || null, qualification: form.qualification || null,
      experience: parseInt(form.experience) || 0,
      registrationNo: form.registrationNo || null, licenseNo: form.licenseNo || null,
      agreementDoc: form.agreementDoc || null, govtIdCard: form.govtIdCard || null,
      signature: form.signature || null, hospitalStamp: form.hospitalStamp || null,
      departmentId: form.departmentId || null,
      consultationFee: parseFloat(form.consultationFee) || 0,
      followUpFee: form.followUpFee ? parseFloat(form.followUpFee) : null,
      isActive: form.isActive, isAvailable: form.isAvailable,
    };
    const res = editItem
      ? await api(`/api/config/doctors/${editItem.id}`, "PUT", payload)
      : await api("/api/config/doctors", "POST", payload);
    setSaving(false);
    if (res.success) { addToast("success", editItem ? "Doctor updated" : "Doctor added successfully"); onSuccess(); }
    else { addToast("error", res.message || "Operation failed"); if (res.errors?.code === "DUPLICATE_EMAIL") setErrors({ email: "Email already exists" }); }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="dp-form-header">
        <button type="button" className="dp-back-btn" onClick={onCancel}>
          <ArrowLeft size={15} /> Back to Doctors
        </button>
        <div>
          <div className="dp-form-title">{editItem ? "Edit Doctor Profile" : "Add New Doctor"}</div>
          <div className="dp-form-subtitle">{editItem ? `Editing ${editItem.name}` : "Fill in all required information below"}</div>
        </div>
      </div>

      <div className="dp-form-body">
        {/* ── Section 1: Basic Info ── */}
        <div className="dp-section">
          <div className="dp-section-hd"><span className="dp-sec-ic blue"><User size={15} /></span>Basic Information</div>
          <div className="dp-grid-2">
            <div className="dp-field">
              <label className="dp-lbl">Full Name <span className="dp-req">*</span></label>
              <input className={`dp-input${errors.name ? " err" : ""}`} placeholder="Dr. John Smith" value={form.name} onChange={e => sf("name", e.target.value)} />
              {errors.name && <span className="dp-error">{errors.name}</span>}
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Email Address <span className="dp-req">*</span></label>
              <input className={`dp-input${errors.email ? " err" : ""}`} type="email" placeholder="doctor@hospital.com" value={form.email} onChange={e => sf("email", e.target.value)} />
              {errors.email && <span className="dp-error">{errors.email}</span>}
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Phone Number</label>
              <input className={`dp-input${errors.phone ? " err" : ""}`} placeholder="+91 9876543210" value={form.phone} onChange={e => sf("phone", e.target.value)} />
              {errors.phone && <span className="dp-error">{errors.phone}</span>}
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Gender</label>
              <select className="dp-select" value={form.gender} onChange={e => sf("gender", e.target.value)}>
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Date of Birth</label>
              <input className="dp-input" type="date" value={form.dateOfBirth} onChange={e => sf("dateOfBirth", e.target.value)} />
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Blood Group</label>
              <select className="dp-select" value={form.bloodGroup} onChange={e => sf("bloodGroup", e.target.value)}>
                <option value="">Select...</option>
                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="dp-field dp-full">
              <label className="dp-lbl">Address</label>
              <textarea className="dp-input dp-textarea" placeholder="Full address..." rows={2} value={form.address} onChange={e => sf("address", e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Professional Info ── */}
        <div className="dp-section">
          <div className="dp-section-hd"><span className="dp-sec-ic purple"><Briefcase size={15} /></span>Professional Information</div>
          <div className="dp-grid-2">
            <div className="dp-field">
              <label className="dp-lbl">Specialization</label>
              <input className="dp-input" placeholder="e.g. Cardiology, Ortho" value={form.specialization} onChange={e => sf("specialization", e.target.value)} />
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Qualification</label>
              <input className="dp-input" placeholder="e.g. MBBS, MD, MS" value={form.qualification} onChange={e => sf("qualification", e.target.value)} />
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Experience (Years)</label>
              <input className={`dp-input${errors.experience ? " err" : ""}`} type="number" min="0" max="70" value={form.experience} onChange={e => sf("experience", e.target.value)} />
              {errors.experience && <span className="dp-error">{errors.experience}</span>}
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Medical Registration No.</label>
              <input className="dp-input" placeholder="e.g. MCI-12345" value={form.registrationNo} onChange={e => sf("registrationNo", e.target.value)} />
            </div>
            <div className="dp-field dp-full">
              <label className="dp-lbl">License Number</label>
              <input className="dp-input" placeholder="e.g. LIC-67890" value={form.licenseNo} onChange={e => sf("licenseNo", e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Section 3: Department & Fees ── */}
        <div className="dp-section">
          <div className="dp-section-hd"><span className="dp-sec-ic green"><DollarSign size={15} /></span>Department & Fees</div>
          <div className="dp-grid-2">
            <div className="dp-field dp-full">
              <label className="dp-lbl">Department</label>
              <select className="dp-select" value={form.departmentId} onChange={e => sf("departmentId", e.target.value)}>
                <option value="">— Select Department —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Consultation Fee (₹) <span className="dp-req">*</span></label>
              <input className={`dp-input${errors.consultationFee ? " err" : ""}`} type="number" min="0" step="0.01" placeholder="500" value={form.consultationFee} onChange={e => sf("consultationFee", e.target.value)} />
              {errors.consultationFee && <span className="dp-error">{errors.consultationFee}</span>}
            </div>
            <div className="dp-field">
              <label className="dp-lbl">Follow-up Fee (₹)</label>
              <input className={`dp-input${errors.followUpFee ? " err" : ""}`} type="number" min="0" step="0.01" placeholder="300" value={form.followUpFee} onChange={e => sf("followUpFee", e.target.value)} />
              {errors.followUpFee && <span className="dp-error">{errors.followUpFee}</span>}
            </div>
          </div>
        </div>

        {/* ── Section 4: Document Uploads ── */}
        <div className="dp-section">
          <div className="dp-section-hd"><span className="dp-sec-ic orange"><FileText size={15} /></span>Documents &amp; Media</div>
          <div className="dp-uploads-grid">
            <UploadField label="Doctor Photo" fieldKey="profileImage" value={form.profileImage} uploadType="image"
              accept="image/jpeg,image/png,image/webp" hint="JPG, PNG or WebP • Max 5MB" onChange={url => sf("profileImage", url)} />
            <UploadField label="Agreement Document" fieldKey="agreementDoc" value={form.agreementDoc} uploadType="document"
              accept="application/pdf,image/jpeg,image/png" hint="PDF, JPG or PNG • Max 10MB" onChange={url => sf("agreementDoc", url)} />
            <UploadField label="Government ID Card" fieldKey="govtIdCard" value={form.govtIdCard} uploadType="document"
              accept="application/pdf,image/jpeg,image/png" hint="Aadhaar / PAN / Passport" onChange={url => sf("govtIdCard", url)} />
            <UploadField label="Doctor Signature" fieldKey="signature" value={form.signature} uploadType="image"
              accept="image/jpeg,image/png,image/webp" hint="Clear sig on white background" onChange={url => sf("signature", url)} />
            <UploadField label="Hospital Stamp" fieldKey="hospitalStamp" value={form.hospitalStamp} uploadType="image"
              accept="image/jpeg,image/png,image/webp" hint="Official hospital stamp image" onChange={url => sf("hospitalStamp", url)} />
          </div>
        </div>

        {/* ── Section 5: Status ── */}
        <div className="dp-section">
          <div className="dp-section-hd"><span className="dp-sec-ic red"><Stethoscope size={15} /></span>Status Settings</div>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="dp-toggle-row">
              <div><div className="dp-toggle-lbl">Active Status</div><div className="dp-toggle-desc">Doctor can accept and manage appointments</div></div>
              <Toggle checked={form.isActive} onChange={v => sf("isActive", v)} />
            </div>
            <div className="dp-toggle-row">
              <div><div className="dp-toggle-lbl">Available for Booking</div><div className="dp-toggle-desc">Show in available list for new bookings</div></div>
              <Toggle checked={form.isAvailable} onChange={v => sf("isAvailable", v)} />
            </div>
          </div>
        </div>
      </div>

      <div className="dp-form-footer">
        <button type="button" className="dp-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="dp-btn-primary" disabled={saving}>
          {saving && <Loader2 size={14} className="dp-spin" />}
          {editItem ? "Update Doctor" : "Add Doctor"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface DoctorPanelProps {
  onOpenAvailability?: (doctor: Doctor) => void;
  onOpenLeave?: (doctor: Doctor) => void;
}

type View = "list" | "add" | "edit";

export default function DoctorPanel({ onOpenAvailability, onOpenLeave }: DoctorPanelProps) {
  const [view, setView] = useState<View>("list");
  const [data, setData] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editItem, setEditItem] = useState<Doctor | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deleteItem, setDeleteItem] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sendingCreds, setSendingCreds] = useState<string | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{ open: boolean; doctor: Doctor | null; mode: "create" | "view" | "edit" }>({ open: false, doctor: null, mode: "create" });
  const [deletingSchedule, setDeletingSchedule] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  // Enhanced state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showExport, setShowExport] = useState(false);
  const [viewItem, setViewItem] = useState<Doctor | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const handleBulkSendCredentials = async () => {
    if (!confirm("Send credentials to all doctors who haven't received them yet?")) return;
    setBulkSending(true);
    try {
      const res = await fetch("/api/config/doctors/send-credentials-bulk", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        addToast("success", data.message || "Bulk credentials sent");
        load();
      } else {
        addToast("error", data.message || "Bulk send failed");
      }
    } catch {
      addToast("error", "Failed to send bulk credentials");
    }
    setBulkSending(false);
  };

  const handleDeleteSchedule = async (doctor: Doctor) => {
    if (!confirm(`Delete the entire schedule for ${doctor.name}? This cannot be undone.`)) return;
    setDeletingSchedule(doctor.id);
    try {
      const res = await fetch(`/api/config/doctors/${doctor.id}/availability`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        addToast("success", `Schedule deleted for ${doctor.name}`);
        load();
      } else {
        addToast("error", data.message || "Failed to delete schedule");
      }
    } catch {
      addToast("error", "Failed to delete schedule");
    }
    setDeletingSchedule(null);
  };

  const addToast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
  };
  const removeToast = (id: number) => setToasts(t => t.filter(x => x.id !== id));

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filterDept) params.append("departmentId", filterDept);
    if (filterStatus) params.append("isActive", filterStatus);
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    const res = await api(`/api/config/doctors?${params}`);
    if (res.success && res.data) {
      setData(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [search, filterDept, filterStatus, pagination.page, pagination.limit]);

  const loadDepts = async () => {
    const res = await api("/api/config/departments?simple=true");
    if (res.success && res.data) setDepartments(Array.isArray(res.data) ? res.data : res.data.data || []);
  };

  useEffect(() => { load(); loadDepts(); }, [load]);

  const handleToggleStatus = async (item: Doctor, field: "isActive" | "isAvailable") => {
    const res = await api(`/api/config/doctors/${item.id}`, "PATCH", { [field]: !item[field] });
    if (res.success) { addToast("success", "Status updated"); load(); }
    else addToast("error", res.message || "Failed");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    const res = await api(`/api/config/doctors/${deleteItem.id}`, "DELETE");
    setDeleting(false);
    if (res.success) { addToast("success", "Doctor deleted"); setDeleteItem(null); load(); }
    else addToast("error", res.message || "Delete failed");
  };

  const handleSendCredentials = async (doctor: Doctor) => {
    setSendingCreds(doctor.id);
    const res = await api(`/api/config/doctors/${doctor.id}/send-credentials`, "POST");
    setSendingCreds(null);
    if (res.success) { addToast("success", `Credentials sent to ${doctor.email}`); load(); }
    else addToast("error", res.message || "Failed to send credentials");
  };

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === data.length ? new Set() : new Set(data.map(d => d.id)));
  };

  // Sort
  const handleSort = (col: string) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };
  const sorted = [...data].sort((a: any, b: any) => {
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
    const src = selectedIds.size > 0 ? data.filter(d => selectedIds.has(d.id)) : data;
    return src.map(d => ({
      Name: d.name, Email: d.email, Phone: d.phone || "-",
      Department: d.department?.name || "-", Specialization: d.specialization || "-",
      Qualification: d.qualification || "-", Experience: `${d.experience} yrs`,
      "Consultation Fee": `₹${d.consultationFee}`, "Follow-up Fee": d.followUpFee ? `₹${d.followUpFee}` : "-",
      Status: d.isActive ? "Active" : "Inactive", Available: d.isAvailable ? "Yes" : "No",
    }));
  };
  const exportPDF = () => {
    const doc = new jsPDF("landscape"); const rows = getExportData(); const keys = Object.keys(rows[0] || {});
    doc.setFontSize(16); doc.text("Doctors Report", 14, 16);
    doc.setFontSize(9); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
    autoTable(doc, { startY: 28, head: [keys], body: rows.map(r => keys.map(k => (r as any)[k])), styles: { fontSize: 7 }, headStyles: { fillColor: [14, 137, 143] } });
    doc.save(`doctors-${new Date().toISOString().slice(0, 10)}.pdf`); setShowExport(false);
  };
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Doctors");
    XLSX.writeFile(wb, `doctors-${new Date().toISOString().slice(0, 10)}.xlsx`); setShowExport(false);
  };
  const exportWord = async () => {
    const rows = getExportData(); const keys = Object.keys(rows[0] || {});
    const headerRow = new TableRow({ children: keys.map(k => new TableCell({ width: { size: 100 / keys.length, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 18, font: "Calibri" })] })] })) });
    const dataRows = rows.map(r => new TableRow({ children: keys.map(k => new TableCell({ width: { size: 100 / keys.length, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: String((r as any)[k] ?? "-"), size: 18, font: "Calibri" })] })] })) }));
    const doc = new DocxDocument({ sections: [{ children: [new Paragraph({ text: "Doctors Report", heading: HeadingLevel.HEADING_1 }), new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-IN")}`, size: 18, color: "888888" })] }), new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } })] }] });
    const blob = await Packer.toBlob(doc); saveAs(blob, `doctors-${new Date().toISOString().slice(0, 10)}.docx`); setShowExport(false);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await api(`/api/config/doctors/${id}`, "DELETE");
    }
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
    setBulkDeleting(false);
    load();
  };

  const goToPage = (page: number) => setPagination(p => ({ ...p, page }));

  const CSS = `
    .dp-toast-container{position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
    .dp-toast{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.12);animation:dpIn .3s ease;pointer-events:all}
    @keyframes dpIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
    .dp-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
    .dp-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
    .dp-toast-info{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
    .dp-toast-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.7;padding:0;margin-left:4px}
    .dp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
    .dp-confirm{background:#fff;border-radius:18px;padding:28px 24px;width:100%;max-width:400px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2)}
    .dp-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
    .dp-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px}
    .dp-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
    .dp-search-input::placeholder{color:#94a3b8}
    .dp-toolbar-right{display:flex;align-items:center;gap:10px}
    .dp-filter-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:500;cursor:pointer}
    .dp-filter-btn.active{background:#E6F4F4;border-color:#0E898F;color:#0E898F}
    .dp-filters{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
    .dp-filter-select{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;color:#334155;background:#fff;cursor:pointer}
    .dp-btn-primary{padding:10px 20px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,.25);transition:all .15s;white-space:nowrap}
    .dp-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
    .dp-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
    .dp-btn-ghost{padding:10px 20px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
    .dp-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}
    .dp-btn-danger{padding:10px 20px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px}
    .dp-btn-sm{padding:5px 10px;font-size:11px;border-radius:7px;border:1px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;display:flex;align-items:center;gap:4px;font-weight:500;white-space:nowrap;transition:all .12s}
    .dp-btn-sm.blue{background:#E6F4F4;border-color:#B3E0E0;color:#0A6B70}
    .dp-btn-sm.green{background:#f0fdf4;border-color:#bbf7d0;color:#16a34a}
    .dp-btn-sm.amber{background:#fffbeb;border-color:#fde68a;color:#b45309}
    .dp-btn-sm.gray{background:#f8fafc;border-color:#cbd5e1;color:#475569}
    .dp-btn-sm.red{background:#fff5f5;border-color:#fecaca;color:#dc2626}
    .dp-btn-sm.red:hover{background:#fee2e2}
    .dp-btn-sm:disabled{opacity:.5;cursor:not-allowed}
    .dp-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
    .dp-tbl{width:100%;border-collapse:collapse}
    .dp-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
    .dp-tbl td{padding:11px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
    .dp-tbl tr:last-child td{border-bottom:none}
    .dp-tbl tbody tr:hover td{background:#fafbfc}
    .dp-doc-info{display:flex;align-items:center;gap:10px}
    .dp-avatar{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#e0f2fe,#B3E0E0);display:flex;align-items:center;justify-content:center;color:#0A6B70;font-weight:700;font-size:14px;overflow:hidden;flex-shrink:0}
    .dp-avatar img{width:100%;height:100%;object-fit:cover}
    .dp-doc-name{font-weight:600;color:#1e293b;font-size:13px}
    .dp-doc-meta{font-size:11px;color:#94a3b8;margin-top:1px}
    .dp-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
    .dp-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
    .dp-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
    .dp-badge.blue{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
    .dp-badge.gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
    .dp-icon-btn{width:29px;height:29px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
    .dp-edit{background:#E6F4F4;color:#0E898F}.dp-edit:hover{background:#B3E0E0}
    .dp-del{background:#fff5f5;color:#ef4444}.dp-del:hover{background:#fee2e2}
    .dp-actions{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
    .dp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
    .dp-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
    .dp-pagination{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff;border-top:1px solid #f1f5f9}
    .dp-pagination-info{font-size:13px;color:#64748b}
    .dp-pagination-btns{display:flex;gap:6px}
    .dp-page-btn{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .dp-page-btn:hover:not(:disabled){background:#f8fafc}
    .dp-page-btn:disabled{opacity:.4;cursor:not-allowed}
    .dp-page-btn.active{background:#0E898F;border-color:#0E898F;color:#fff}
    .dp-toggle{width:44px;height:24px;border-radius:100px;background:#e2e8f0;border:none;cursor:pointer;position:relative;transition:background .2s}
    .dp-toggle.on{background:#0E898F}.dp-toggle.disabled{opacity:.5;cursor:not-allowed}
    .dp-toggle-thumb{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}
    .dp-toggle.on .dp-toggle-thumb{transform:translateX(20px)}
    .dp-creds-sent{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#16a34a;font-weight:600;background:#f0fdf4;padding:4px 10px;border-radius:100px;border:1px solid #bbf7d0}
    .dp-form-header{display:flex;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid #f1f5f9;background:#f8fafc}
    .dp-back-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s}
    .dp-back-btn:hover{background:#f8fafc;border-color:#cbd5e1}
    .dp-form-title{font-size:18px;font-weight:800;color:#1e293b}
    .dp-form-subtitle{font-size:12px;color:#94a3b8;margin-top:2px}
    .dp-form-body{padding:24px;display:flex;flex-direction:column;gap:20px}
    .dp-form-footer{padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc}
    .dp-section{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}
    .dp-section-hd{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;color:#1e293b;padding:13px 18px;background:#f8fafc;border-bottom:1px solid #f1f5f9}
    .dp-sec-ic{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .dp-sec-ic.blue{background:#E6F4F4;color:#0E898F}.dp-sec-ic.purple{background:#faf5ff;color:#7c3aed}
    .dp-sec-ic.green{background:#f0fdf4;color:#16a34a}.dp-sec-ic.orange{background:#fff7ed;color:#ea580c}
    .dp-sec-ic.red{background:#fff5f5;color:#ef4444}
    .dp-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:18px}
    .dp-field{display:flex;flex-direction:column;gap:5px}
    .dp-full{grid-column:1/-1}
    .dp-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
    .dp-req{color:#ef4444}
    .dp-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s;width:100%;font-family:inherit}
    .dp-input:focus{border-color:#80CCCC;box-shadow:0 0 0 3px rgba(147,197,253,.2)}
    .dp-input::placeholder{color:#94a3b8}
    .dp-input.err{border-color:#fca5a5}
    .dp-textarea{resize:vertical;min-height:68px}
    .dp-select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;width:100%;cursor:pointer;font-family:inherit}
    .dp-select:focus{border-color:#80CCCC}
    .dp-error{font-size:11px;color:#ef4444;margin-top:2px}
    .dp-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0}
    .dp-toggle-lbl{font-size:13px;color:#334155;font-weight:600}
    .dp-toggle-desc{font-size:11px;color:#94a3b8;margin-top:2px}
    .dp-uploads-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px;padding:18px}
    .dp-upload-field{display:flex;flex-direction:column;gap:6px}
    .dp-upload-zone{display:flex;align-items:center;justify-content:center;border:1.5px dashed #cbd5e1;border-radius:10px;cursor:pointer;background:#fafbfc;transition:all .15s;min-height:120px}
    .dp-upload-zone:hover{border-color:#80CCCC;background:#E6F4F4}
    .dp-upload-zone.loading{opacity:.7;cursor:not-allowed}
    .dp-upload-inner{display:flex;flex-direction:column;align-items:center;gap:7px;padding:16px;text-align:center}
    .dp-upload-txt{font-size:12px;color:#64748b;font-weight:500}
    .dp-upload-hint{font-size:10px;color:#94a3b8}
    .dp-upload-preview{position:relative;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#f8fafc}
    .dp-upload-img{width:100%;height:130px;object-fit:cover;display:block}
    .dp-upload-doc-prev{height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#64748b;font-size:12px}
    .dp-upload-view-link{font-size:11px;color:#0E898F;text-decoration:none;font-weight:600}
    .dp-upload-remove{position:absolute;top:7px;right:7px;background:rgba(239,68,68,.9);border:none;border-radius:6px;color:#fff;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .dp-toolbar-left{display:flex;flex-direction:column;gap:2px;min-width:0}
    .dp-toolbar-left h2{margin:0;font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
    .dp-toolbar-left p{margin:0;font-size:13px;color:#94a3b8;line-height:1.3}
    .dp-export-wrap{position:relative}
    .dp-export-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:500;cursor:pointer}
    .dp-export-btn:hover{border-color:#cbd5e1;background:#f8fafc}
    .dp-export-dd{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:50;min-width:180px;padding:6px}
    .dp-export-item{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:8px;border:none;background:none;width:100%;cursor:pointer;font-size:13px;color:#334155;font-weight:500}
    .dp-export-item:hover{background:#f1f5f9}
    .dp-export-item .eicon{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center}
    .dp-export-item .eicon.pdf{background:#fff5f5;color:#ef4444}
    .dp-export-item .eicon.xls{background:#f0fdf4;color:#16a34a}
    .dp-export-item .eicon.doc{background:#eff6ff;color:#2563eb}
    .dp-export-item .eicon.csv{background:#fefce8;color:#ca8a04}
    .dp-th-sort{cursor:pointer;user-select:none}
    .dp-th-sort:hover{color:#0E898F}
    .dp-sort-icon{display:inline-flex;margin-left:4px;vertical-align:middle;color:#cbd5e1}
    .dp-sort-icon.active{color:#0E898F}
    .dp-checkbox{width:16px;height:16px;accent-color:#0E898F;cursor:pointer}
    .dp-selected-bar{display:flex;align-items:center;gap:12px;padding:10px 16px;background:#E6F4F4;border:1px solid #B3E0E0;border-radius:10px;margin-bottom:12px;font-size:13px;color:#0A6B70;font-weight:600}
    .dp-view{background:#f0f9ff;color:#2563eb}
    .dp-view:hover{background:#dbeafe}
    .dp-view-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:4px 0}
    .dp-view-item{display:flex;flex-direction:column;gap:3px}
    .dp-view-item.full{grid-column:1/-1}
    .dp-view-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
    .dp-view-value{font-size:14px;color:#1e293b;font-weight:500}
    @keyframes dpSpin{to{transform:rotate(360deg)}}
    .dp-spin{animation:dpSpin .7s linear infinite}
  `;

  // ── FORM VIEW ──
  if (view === "add" || view === "edit") {
    return (
      <>
        <style>{CSS}</style>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
          <DoctorForm
            editItem={view === "edit" ? editItem : null}
            departments={departments}
            addToast={addToast}
            onCancel={() => { setView("list"); setEditItem(null); }}
            onSuccess={() => { setView("list"); setEditItem(null); load(); }}
          />
        </div>
      </>
    );
  }

  // ── LIST VIEW ──
  return (
    <>
      <style>{CSS}</style>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Toolbar */}
      <div className="dp-toolbar">
        <div className="dp-toolbar-left">
          <h2>Doctors</h2>
          <p>Manage doctor profiles, schedules and credentials</p>
        </div>
        <div className="dp-toolbar-right">
          <button className={`dp-filter-btn${showFilters ? " active" : ""}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} />{showFilters ? "Hide" : "Filters"}
          </button>
          <div className="dp-search-wrap">
            <Search size={14} color="#94a3b8" />
            <input className="dp-search-input" placeholder="Search doctors..." value={search}
              onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} />
            {search && <button className="dp-icon-btn" onClick={() => setSearch("")}><X size={14} /></button>}
          </div>
          {selectedIds.size > 0 && (
            <button onClick={() => setShowBulkConfirm(true)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 10, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Trash2 size={12} />Delete ({selectedIds.size})
            </button>
          )}
          <div className="dp-export-wrap">
            <button className="dp-export-btn" onClick={() => setShowExport(e => !e)}>
              <Download size={13} />Export
            </button>
            {showExport && (
              <div className="dp-export-dd">
                <button className="dp-export-item" onClick={exportPDF}><span className="eicon pdf"><FileText size={13} /></span>PDF Document</button>
                <button className="dp-export-item" onClick={exportExcel}><span className="eicon xls"><FileSpreadsheet size={13} /></span>Excel Spreadsheet</button>
                <button className="dp-export-item" onClick={exportWord}><span className="eicon doc"><FileType size={13} /></span>Word Document</button>
                <a className="dp-export-item" href={`/api/export/doctors${[search && `search=${encodeURIComponent(search)}`, filterDept && `departmentId=${filterDept}`, filterStatus && `isActive=${filterStatus}`].filter(Boolean).join("&") ? `?${[search && `search=${encodeURIComponent(search)}`, filterDept && `departmentId=${filterDept}`, filterStatus && `isActive=${filterStatus}`].filter(Boolean).join("&")}` : ""}`} download style={{ textDecoration: "none" }}><span className="eicon csv"><Download size={13} /></span>CSV Export</a>
              </div>
            )}
          </div>
          <button
            onClick={handleBulkSendCredentials}
            disabled={bulkSending}
            title="Send credentials to all doctors who haven't received them"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #dbeafe", background: bulkSending ? "#f1f5f9" : "#eff6ff", color: bulkSending ? "#94a3b8" : "#2563eb", fontSize: 13, fontWeight: 600, cursor: bulkSending ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
          >
            {bulkSending ? <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> : <Send size={13} />}
            Send All
          </button>
          <button className="dp-btn-primary" onClick={() => setView("add")}>
            <Plus size={14} /> Add Doctor
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="dp-filters">
          <select className="dp-filter-select" value={filterDept} onChange={e => { setFilterDept(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="dp-filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {(filterDept || filterStatus) && (
            <button className="dp-btn-ghost" style={{ padding: "8px 12px" }} onClick={() => { setFilterDept(""); setFilterStatus(""); }}>Clear</button>
          )}
        </div>
      )}

      {/* Selected bar */}
      {selectedIds.size > 0 && (
        <div className="dp-selected-bar">
          <Check size={14} />
          {selectedIds.size} doctor{selectedIds.size > 1 ? "s" : ""} selected
          <button className="dp-btn-ghost" style={{ padding: "4px 10px", fontSize: 12, marginLeft: "auto" }} onClick={() => setSelectedIds(new Set())}>Clear</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="dp-loading"><Loader2 size={20} className="dp-spin" /> Loading doctors...</div>
      ) : data.length === 0 ? (
        <div className="dp-empty">No doctors found. Click "+ Add Doctor" to create one.</div>
      ) : (
        <div className="dp-tbl-wrap">
          <table className="dp-tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" className="dp-checkbox" checked={data.length > 0 && selectedIds.size === data.length} ref={(el: HTMLInputElement | null) => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < data.length; }} onChange={toggleSelectAll} />
                </th>
                <th className="dp-th-sort" onClick={() => handleSort("name")}>Doctor<span className={`dp-sort-icon ${sortBy === "name" ? "active" : ""}`}>{sortBy === "name" ? (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}</span></th>
                <th className="dp-th-sort" onClick={() => handleSort("department")}>Department<span className={`dp-sort-icon ${sortBy === "department" ? "active" : ""}`}>{sortBy === "department" ? (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}</span></th>
                <th>Specialization</th>
                <th className="dp-th-sort" onClick={() => handleSort("experience")}>Exp / Fee<span className={`dp-sort-icon ${sortBy === "experience" ? "active" : ""}`}>{sortBy === "experience" ? (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}</span></th>
                <th>Status</th>
                <th>Credentials</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(row => (
                <tr key={row.id} style={selectedIds.has(row.id) ? { background: "#f0fdfa" } : undefined}>
                  <td><input type="checkbox" className="dp-checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} /></td>
                  <td>
                    <div className="dp-doc-info">
                      <div className="dp-avatar">
                        {row.profileImage ? <img src={row.profileImage} alt={row.name} /> : row.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="dp-doc-name">{row.name}</div>
                        <div className="dp-doc-meta">{row.email}</div>
                        {row.phone && <div className="dp-doc-meta">{row.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{row.department?.name || <span style={{ color: "#94a3b8" }}>-</span>}</td>
                  <td>
                    {row.specialization || <span style={{ color: "#94a3b8" }}>-</span>}
                    {row.qualification && <div className="dp-doc-meta">{row.qualification}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{row.experience} yrs</div>
                    <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>₹{row.consultationFee}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className={`dp-badge ${row.isActive ? "green" : "red"}`}>{row.isActive ? "Active" : "Inactive"}</span>
                        <Toggle checked={row.isActive} onChange={() => handleToggleStatus(row, "isActive")} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className={`dp-badge ${row.isAvailable ? "blue" : "gray"}`}>{row.isAvailable ? "Available" : "Unavailable"}</span>
                        <Toggle checked={row.isAvailable} onChange={() => handleToggleStatus(row, "isAvailable")} />
                      </div>
                    </div>
                  </td>
                  <td>
                    {row.credentialsSent ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                        <span className="dp-creds-sent"><Check size={12} /> Sent</span>
                        <button className="dp-btn-sm gray" disabled={sendingCreds === row.id} onClick={() => handleSendCredentials(row)} title="Resend Credentials">
                          {sendingCreds === row.id ? <Loader2 size={11} className="dp-spin" /> : <Send size={10} />}
                          {sendingCreds === row.id ? "Resending..." : "Resend"}
                        </button>
                      </div>
                    ) : (
                      <button className="dp-btn-sm amber" disabled={sendingCreds === row.id} onClick={() => handleSendCredentials(row)}>
                        {sendingCreds === row.id ? <Loader2 size={11} className="dp-spin" /> : <Send size={11} />}
                        {sendingCreds === row.id ? "Sending..." : "Send Credentials"}
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="dp-actions">
                      <button className="dp-icon-btn dp-view" title="Quick View" onClick={() => setViewItem(row)}>
                        <Eye size={13} />
                      </button>
                      <button className="dp-icon-btn dp-edit" title="Edit Profile" onClick={() => { setEditItem(row); setView("edit"); }}>
                        <Pencil size={13} />
                      </button>
                      <button className="dp-icon-btn dp-del" title="Delete" onClick={() => setDeleteItem(row)}>
                        <Trash2 size={13} />
                      </button>
                      <button className="dp-btn-sm blue" title="Manage Schedule" onClick={() => setScheduleModal({ open: true, doctor: row, mode: "edit" })}>
                        <Clock size={11} /> Schedule
                      </button>
                      {onOpenLeave && (
                        <button className="dp-btn-sm green" onClick={() => onOpenLeave(row)}>
                          <Calendar size={11} /> Leave
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="dp-pagination">
            <div className="dp-pagination-info">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} –{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="dp-pagination-btns">
              <button className="dp-page-btn" disabled={pagination.page === 1} onClick={() => goToPage(pagination.page - 1)}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: "0 4px", color: "#94a3b8" }}>…</span>}
                    <button className={`dp-page-btn${pagination.page === p ? " active" : ""}`} onClick={() => goToPage(p)}>{p}</button>
                  </span>
                ))}
              <button className="dp-page-btn" disabled={pagination.page === pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Doctor"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />

      {scheduleModal.open && scheduleModal.doctor && (
        <div className="dp-overlay" onClick={e => { if (e.target === e.currentTarget) setScheduleModal({ open: false, doctor: null, mode: "create" }); }}>
          <div style={{ background: "#fff", borderRadius: 18, width: "95%", maxWidth: 1100, maxHeight: "92vh", overflow: "auto", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <button onClick={() => setScheduleModal({ open: false, doctor: null, mode: "create" })} style={{ position: "absolute", top: 14, right: 14, zIndex: 10, width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><X size={16} /></button>
            <ScheduleBuilder
              doctorId={scheduleModal.doctor.id}
              doctorName={scheduleModal.doctor.name}
              accent="#0E898F"
              apiBase={`/api/config/doctors/${scheduleModal.doctor.id}`}
              onSuccess={() => { load(); }}
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="dp-overlay" onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div className="dp-confirm" style={{ maxWidth: 560, textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#1e293b" }}>Doctor Details</span>
              <button className="dp-icon-btn" onClick={() => setViewItem(null)}><X size={16} /></button>
            </div>
            <div className="dp-view-grid">
              <div className="dp-view-item">
                <span className="dp-view-label">Name</span>
                <span className="dp-view-value">{viewItem.name}</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Email</span>
                <span className="dp-view-value">{viewItem.email}</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Phone</span>
                <span className="dp-view-value">{viewItem.phone || "-"}</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Gender</span>
                <span className="dp-view-value">{viewItem.gender || "-"}</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Department</span>
                <span className="dp-view-value">{viewItem.department?.name || "-"}</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Specialization</span>
                <span className="dp-view-value">{viewItem.specialization || "-"}</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Qualification</span>
                <span className="dp-view-value">{viewItem.qualification || "-"}</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Experience</span>
                <span className="dp-view-value">{viewItem.experience} years</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Consultation Fee</span>
                <span className="dp-view-value">₹{viewItem.consultationFee}</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Follow-up Fee</span>
                <span className="dp-view-value">{viewItem.followUpFee ? `₹${viewItem.followUpFee}` : "-"}</span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Status</span>
                <span className="dp-view-value"><span className={`dp-badge ${viewItem.isActive ? "green" : "red"}`}>{viewItem.isActive ? "Active" : "Inactive"}</span></span>
              </div>
              <div className="dp-view-item">
                <span className="dp-view-label">Available</span>
                <span className="dp-view-value"><span className={`dp-badge ${viewItem.isAvailable ? "blue" : "gray"}`}>{viewItem.isAvailable ? "Yes" : "No"}</span></span>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button className="dp-btn-primary" onClick={() => { setEditItem(viewItem); setView("edit"); setViewItem(null); }}>
                <Pencil size={13} />Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm */}
      {showBulkConfirm && (
        <div className="dp-overlay" onClick={e => e.target === e.currentTarget && !bulkDeleting && setShowBulkConfirm(false)}>
          <div className="dp-confirm" style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Delete {selectedIds.size} Doctors?</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  Are you sure you want to delete <strong>{selectedIds.size}</strong> selected doctor(s)? This action cannot be undone.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="dp-btn-ghost" onClick={() => setShowBulkConfirm(false)} disabled={bulkDeleting}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={bulkDeleting}
                style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: bulkDeleting ? "not-allowed" : "pointer", opacity: bulkDeleting ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                {bulkDeleting && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
                {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size} Doctors`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
