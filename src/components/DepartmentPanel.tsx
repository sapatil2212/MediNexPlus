"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, Search, X, Loader2, Check, AlertTriangle,
  ChevronLeft, ChevronRight, Building2, DollarSign, MapPin, User,
  Settings2, ToggleLeft, ToggleRight, Filter, Eye, Download,
  ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet, FileType,
  ShieldAlert, Users, Layers, Info, Mail, Send, KeyRound,
  EyeOff, Copy, RefreshCw, Lock, ShieldCheck, ChevronDown
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType, TextRun, HeadingLevel, BorderStyle, AlignmentType } from "docx";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  type: "CLINICAL" | "DIAGNOSTIC" | "PROCEDURE" | "SUPPORT" | "ADMINISTRATIVE" | "CUSTOM";
  isActive: boolean;
  consultationFee?: number | null;
  allowAppointments: boolean;
  isIPD: boolean;
  hodDoctorId?: string | null;
  hodUserId?: string | null;
  customTypeName?: string | null;
  hodDoctor?: { id: string; name: string; specialization?: string } | null;
  hodUser?: { id: string; name: string; role?: string } | null;
  location?: string | null;
  billingCode?: string | null;
  loginEmail?: string | null;
  credentialsSent?: boolean;
  userId?: string | null;
  _count?: { doctors: number; staff: number; subDepartments: number };
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  type: "CLINICAL" | "DIAGNOSTIC" | "SUPPORT" | "ADMINISTRATIVE";
  customTypeName: string;
  consultationFee: string;
  allowAppointments: boolean;
  isIPD: boolean;
  showIPDOptions: boolean;
  showAppointmentOptions: boolean;
  showFinancialOptions: boolean;
  hodUserId: string;
  location: string;
  billingCode: string;
  isActive: boolean;
  loginEmail: string;
  loginPassword: string;
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

const DEPT_TYPES = [
  { value: "CLINICAL",       label: "Clinical",              desc: "OPD, IPD, ICU, Nursing, Clinical Procedures" },
  { value: "ADMINISTRATIVE", label: "Admin",                 desc: "Reception, Billing, HR" },
  { value: "SUPPORT",        label: "Support / Service",     desc: "Pharmacy, Ambulance, Housekeeping" },
  { value: "DIAGNOSTIC",     label: "Diagnosis / Pathology", desc: "Lab, Radiology, Blood Bank, ECG" },
];

const SUBDEPT_OPTIONS_BY_DEPT_TYPE: Record<string, Array<{ value: string; label: string }>> = {
  CLINICAL: [
    { value: "OPD",                label: "OPD (Outpatient Department)" },
    { value: "IPD",                label: "IPD (Inpatient Department)" },
    { value: "CLINICAL_PROCEDURE", label: "Clinical Procedures" },
    { value: "ICU",                label: "ICU / NICU" },
    { value: "NURSING",            label: "Nursing" },
  ],
  ADMINISTRATIVE: [
    { value: "RECEPTION", label: "Reception" },
    { value: "BILLING",   label: "Billing" },
    { value: "HR",        label: "HR" },
  ],
  SUPPORT: [
    { value: "PHARMACY",     label: "Pharmacy" },
    { value: "AMBULANCE",    label: "Ambulance" },
    { value: "HOUSEKEEPING", label: "Housekeeping" },
  ],
  DIAGNOSTIC: [
    { value: "PATHOLOGY",  label: "Pathology Lab" },
    { value: "RADIOLOGY",  label: "Radiology" },
    { value: "BLOOD_BANK", label: "Blood Bank" },
    { value: "ECG",        label: "ECG" },
  ],
};

const TYPE_COLORS: Record<string, string> = {
  CLINICAL:       "blue",
  DIAGNOSTIC:     "orange",
  SUPPORT:        "gray",
  ADMINISTRATIVE: "teal",
};

const emptyForm: FormData = {
  name: "",
  code: "",
  description: "",
  type: "CLINICAL",
  customTypeName: "",
  consultationFee: "",
  allowAppointments: false,
  isIPD: false,
  showIPDOptions: false,
  showAppointmentOptions: false,
  showFinancialOptions: false,
  hodUserId: "",
  location: "",
  billingCode: "",
  isActive: true,
  loginEmail: "",
  loginPassword: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="dept-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`dept-toast dept-toast-${t.type}`}>
          {t.type === "success" && <Check size={16} />}
          {t.type === "error" && <AlertTriangle size={16} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="dept-toast-close">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  children,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  if (!open) return null;
  return (
    <div className="dept-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dept-modal dept-modal-${size}`}>
        <div className="dept-modal-head">
          <span className="dept-modal-title">{title}</span>
          <button onClick={onClose} className="dept-icon-btn">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  department,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (mode: "force" | "cascade") => void;
  department: Department | null;
  loading?: boolean;
}) {
  const [mode, setMode] = useState<"force" | "cascade">("force");
  if (!open || !department) return null;

  const doctorCount = department._count?.doctors || 0;
  const staffCount = department._count?.staff || 0;
  const subDeptCount = department._count?.subDepartments || 0;
  const totalDeps = doctorCount + staffCount + subDeptCount;
  const hasDeps = totalDeps > 0;

  return (
    <div className="dept-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="del-dialog">
        {/* Header */}
        <div className="del-header">
          <div className="del-header-icon">
            <ShieldAlert size={20} />
          </div>
          <div className="del-header-text">
            <h3>Delete Department</h3>
            <p>This action cannot be undone</p>
          </div>
          <button className="dept-icon-btn" onClick={onClose} style={{marginLeft:"auto"}}><X size={16}/></button>
        </div>

        {/* Body */}
        <div className="del-body">
          {/* Department Info Card */}
          <div className="del-dept-card">
            <div className="del-dept-card-icon">
              <Building2 size={18} />
            </div>
            <div>
              <div className="del-dept-card-name">{department.name}</div>
              <div className="del-dept-card-meta">
                <span className="dept-dept-code">{department.code}</span>
                <span className={`dept-badge ${TYPE_COLORS[department.type] || "gray"}`} style={{marginLeft:6}}>
                  {department.type === "CUSTOM" && department.customTypeName ? department.customTypeName : department.type}
                </span>
              </div>
            </div>
          </div>

          {hasDeps ? (
            <>
              {/* Impact Summary */}
              <div className="del-impact">
                <div className="del-impact-header">
                  <AlertTriangle size={14} />
                  <span>Impact Analysis</span>
                </div>
                <div className="del-impact-body">
                  <p>Deleting this department will affect the following linked resources:</p>
                  <div className="del-impact-grid">
                    {doctorCount > 0 && (
                      <div className="del-impact-item">
                        <div className="del-impact-item-icon blue"><User size={14}/></div>
                        <div className="del-impact-item-info">
                          <span className="del-impact-item-count">{doctorCount}</span>
                          <span className="del-impact-item-label">Doctor{doctorCount !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    )}
                    {staffCount > 0 && (
                      <div className="del-impact-item">
                        <div className="del-impact-item-icon purple"><Users size={14}/></div>
                        <div className="del-impact-item-info">
                          <span className="del-impact-item-count">{staffCount}</span>
                          <span className="del-impact-item-label">Staff member{staffCount !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    )}
                    {subDeptCount > 0 && (
                      <div className="del-impact-item">
                        <div className="del-impact-item-icon teal"><Layers size={14}/></div>
                        <div className="del-impact-item-info">
                          <span className="del-impact-item-count">{subDeptCount}</span>
                          <span className="del-impact-item-label">Sub-dept{subDeptCount !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Deletion Mode Selection */}
              <div className="del-modes">
                <div className="del-modes-label">Choose deletion strategy:</div>
                <button
                  className={`del-mode-option ${mode === "force" ? "selected" : ""}`}
                  onClick={() => setMode("force")}
                >
                  <div className={`del-mode-radio ${mode === "force" ? "on" : ""}`}>
                    {mode === "force" && <div className="del-mode-radio-dot" />}
                  </div>
                  <div className="del-mode-content">
                    <div className="del-mode-title">Remove Department Only</div>
                    <div className="del-mode-desc">Delete the department but keep all linked doctors, staff, and sub-departments intact.</div>
                  </div>
                </button>
                <button
                  className={`del-mode-option ${mode === "cascade" ? "selected danger" : ""}`}
                  onClick={() => setMode("cascade")}
                >
                  <div className={`del-mode-radio ${mode === "cascade" ? "on danger" : ""}`}>
                    {mode === "cascade" && <div className="del-mode-radio-dot" />}
                  </div>
                  <div className="del-mode-content">
                    <div className="del-mode-title">Delete Everything</div>
                    <div className="del-mode-desc">Permanently remove the department and all {totalDeps} linked resource{totalDeps !== 1 ? "s" : ""}. This is irreversible.</div>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="del-no-deps">
              <Info size={16} color="#0E898F" />
              <span>This department has no linked resources. It can be safely removed.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="del-footer">
          <button className="dept-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`del-confirm-btn ${mode === "cascade" && hasDeps ? "cascade" : ""}`}
            onClick={() => onConfirm(hasDeps ? mode : "force")}
            disabled={loading}
          >
            {loading && <Loader2 size={14} className="dept-spin" />}
            <Trash2 size={14} />
            {hasDeps ? (mode === "cascade" ? "Delete All Permanently" : "Delete Department Only") : "Delete Department"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`dept-toggle ${checked ? "on" : ""} ${disabled ? "disabled" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="dept-toggle-thumb" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCHABLE SELECT
// ─────────────────────────────────────────────────────────────────────────────

function SearchableSelect({
  value, onChange, options, placeholder = "Select...",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; desc?: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.desc || "").toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", border: `1.5px solid ${open ? "#80CCCC" : "#e2e8f0"}`, borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontSize: 12, color: selected ? "#1e293b" : "#94a3b8", fontWeight: selected ? 600 : 400, userSelect: "none", boxShadow: open ? "0 0 0 3px rgba(147,197,253,.2)" : "none" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span>{selected?.label || placeholder}</span>
          {selected?.desc && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>— {selected.desc}</span>}
        </div>
        <ChevronDown size={13} style={{ color: "#94a3b8", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 200 }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 6 }}>
            <Search size={12} color="#94a3b8" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ border: "none", outline: "none", fontSize: 12, color: "#334155", background: "transparent", width: "100%" }}
            />
            {search && <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, lineHeight: 1 }}><X size={11} /></button>}
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>No results</div>
            ) : filtered.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                style={{ padding: "9px 14px", cursor: "pointer", background: o.value === value ? "#E6F4F4" : "#fff", borderBottom: "1px solid #f8fafc", transition: "background .1s" }}
                onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = o.value === value ? "#E6F4F4" : "#fff"; }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: o.value === value ? "#0E898F" : "#1e293b" }}>{o.label}</div>
                {o.desc && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{o.desc}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DepartmentPanel() {
  // State
  const [data, setData] = useState<Department[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Department | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Users for HOD dropdown
  const [users, setUsers] = useState<UserItem[]>([]);

  // Delete confirmation
  const [deleteItem, setDeleteItem] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Select checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // View details modal
  const [viewItem, setViewItem] = useState<Department | null>(null);

  // Sort
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Export dropdown
  const [showExport, setShowExport] = useState(false);

  // Send credentials
  const [sendingCredId, setSendingCredId] = useState<string | null>(null);

  // Sub-department creation alongside dept
  const [createSubDept, setCreateSubDept] = useState(false);
  const [subDeptForm, setSubDeptForm] = useState<any>({ name: "", type: "", loginEmail: "", loginPassword: "" });

  // Password helpers
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);
  const generatePassword = (name: string) => {
    const year = new Date().getFullYear();
    const prefix = (name || "Dept").split(" ")[0].replace(/[^a-zA-Z0-9]/g, "") || "Dept";
    return `${prefix}@${year}`;
  };
  const copyPassword = async () => {
    if (!form.loginPassword) return;
    await navigator.clipboard.writeText(form.loginPassword);
    setCopiedPw(true);
    setTimeout(() => setCopiedPw(false), 2000);
  };

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  // Load departments
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filterType) params.append("type", filterType);
    if (filterStatus) params.append("isActive", filterStatus);
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);

    const res = await api(`/api/config/departments?${params.toString()}`);
    if (res.success && res.data) {
      setData(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    }
    setLoading(false);
  }, [search, filterType, filterStatus, pagination.page, pagination.limit, sortBy, sortOrder]);

  // Load all users for HOD dropdown
  const loadUsers = async () => {
    const res = await api("/api/user/list");
    if (res.success && res.data) {
      setUsers(Array.isArray(res.data) ? res.data : []);
    }
  };

  useEffect(() => {
    load();
    loadUsers();
  }, [load]);

  // Auto-generate code from name
  const generateCode = async (name: string) => {
    if (!name || name.length < 2) return;
    const res = await api(`/api/config/departments?action=generate-code&name=${encodeURIComponent(name)}`, "POST");
    if (res.success && res.data?.code) {
      setForm((f) => ({ ...f, code: res.data.code }));
    }
  };

  // Open add modal
  const openAdd = () => {
    setEditItem(null);
    const pw = generatePassword("Dept");
    setForm({ ...emptyForm, loginPassword: pw });
    setErrors({});
    setCreateSubDept(false);
    setSubDeptForm({ name: "", type: SUBDEPT_OPTIONS_BY_DEPT_TYPE["CLINICAL"]?.[0]?.value || "", loginEmail: "", loginPassword: pw });
    setModal(true);
  };

  // Open edit modal
  const openEdit = (item: Department) => {
    setEditItem(item);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description || "",
      type: (item.type as FormData["type"]) || "CLINICAL",
      customTypeName: item.customTypeName || "",
      consultationFee: item.consultationFee?.toString() || "",
      allowAppointments: item.allowAppointments,
      isIPD: item.isIPD,
      showIPDOptions: false,
      showAppointmentOptions: false,
      showFinancialOptions: false,
      hodUserId: item.hodUserId || "",
      location: item.location || "",
      billingCode: item.billingCode || "",
      isActive: item.isActive,
      loginEmail: item.loginEmail || "",
      loginPassword: generatePassword(item.name),
    });
    setErrors({});
    setShowPassword(false);
    setModal(true);
  };

  // Validate form
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.length < 2) errs.name = "Name must be at least 2 characters";
    if (!form.code || form.code.length < 1) errs.code = "Code is required";
    if (form.code.length > 10) errs.code = "Code must be 10 characters or less";
    if (form.showFinancialOptions && form.consultationFee && isNaN(parseFloat(form.consultationFee))) {
      errs.consultationFee = "Must be a valid number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload: any = {
      name: form.name,
      code: form.code.toUpperCase(),
      description: form.description || null,
      type: form.type,
      consultationFee: form.showFinancialOptions && form.consultationFee ? parseFloat(form.consultationFee) : null,
      allowAppointments: form.showAppointmentOptions ? form.allowAppointments : false,
      isIPD: form.showIPDOptions ? form.isIPD : false,
      hodUserId: form.hodUserId || null,
      hodDoctorId: null,
      location: form.location || null,
      billingCode: form.showFinancialOptions ? (form.billingCode || null) : null,
      isActive: form.isActive,
      loginEmail: form.loginEmail || null,
      // Only send password if filled — on edit, empty = keep existing
      ...(form.loginPassword ? { loginPassword: form.loginPassword } : {}),
    };
    if (!form.showFinancialOptions) {
      delete payload.consultationFee;
      delete payload.billingCode;
    }
    if (!form.showAppointmentOptions) {
      delete payload.allowAppointments;
    }
    if (!form.showIPDOptions) {
      delete payload.isIPD;
    }

    let res;
    if (editItem) {
      res = await api(`/api/config/departments/${editItem.id}`, "PUT", payload);
    } else {
      res = await api("/api/config/departments", "POST", payload);
    }

    setSaving(false);
    if (res.success) {
      if (!editItem && createSubDept && subDeptForm.name && subDeptForm.type) {
        const deptId = res.data?.id || res.data?.data?.id;
        if (deptId) {
          await api("/api/config/subdepartments", "POST", {
            name: subDeptForm.name,
            type: subDeptForm.type,
            departmentId: deptId,
            loginEmail: subDeptForm.loginEmail || null,
            ...(subDeptForm.loginPassword ? { loginPassword: subDeptForm.loginPassword } : {}),
            accessFeatures: JSON.stringify([]),
            isActive: true,
          });
        }
      }
      const warn = res.data?.credentialWarning;
      if (warn) {
        addToast("error", `Saved but login setup failed: ${warn}`);
      } else {
        const credMsg = form.loginPassword
          ? " + login credentials set"
          : (editItem ? " (password unchanged)" : "");
        addToast("success", (editItem ? "Department updated" : "Department created") + credMsg);
      }
      setModal(false);
      load();
    } else {
      addToast("error", res.message || "Operation failed");
      if (res.errors?.code === "DUPLICATE_CODE") {
        setErrors({ code: "This code already exists" });
      }
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (item: Department) => {
    const res = await api(`/api/config/departments/${item.id}`, "PATCH", { isActive: !item.isActive });
    if (res.success) {
      addToast("success", `Department ${!item.isActive ? "activated" : "deactivated"}`);
      load();
    } else {
      addToast("error", res.message || "Failed to update status");
    }
  };

  // Handle delete
  const handleDelete = async (mode: "force" | "cascade") => {
    if (!deleteItem) return;
    setDeleting(true);
    
    const url = mode === "cascade" 
      ? `/api/config/departments/${deleteItem.id}?cascade=true`
      : `/api/config/departments/${deleteItem.id}?force=true`;
    
    const res = await api(url, "DELETE");
    setDeleting(false);
    
    if (res.success) {
      const msg = mode === "cascade" 
        ? "Department and all related items deleted successfully"
        : "Department deleted successfully (related items kept)";
      addToast("success", msg);
      setDeleteItem(null);
      load();
    } else {
      addToast("error", res.message || "Failed to delete department");
    }
  };

  // Send credentials (customPw passed only when called from modal context)
  const handleSendCredentials = async (item: Department, resend = false, customPw?: string) => {
    if (!item.loginEmail) {
      addToast("error", "Set a login email first (edit department)");
      return;
    }
    setSendingCredId(item.id);
    const url = `/api/config/departments/${item.id}/send-credentials${resend ? "?resend=true" : ""}`;
    const body = customPw ? { password: customPw } : {};
    const res = await api(url, "POST", body);
    setSendingCredId(null);
    if (res.success) {
      const pw = res.data?.password;
      addToast("success", `Credentials ${resend ? "resent" : "sent"} to ${res.data?.email || item.loginEmail}${pw ? ` (Password: ${pw})` : ""}`);
      load();
    } else {
      addToast("error", res.message || "Failed to send credentials");
    }
  };

  // Page change
  const goToPage = (page: number) => {
    setPagination((p) => ({ ...p, page }));
  };

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(data.map((d) => d.id)));
  };
  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  // Sort handler
  const handleSort = (col: string) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("asc"); }
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // Export helpers
  const getExportData = () => {
    const rows = (selectedIds.size > 0 ? data.filter((d) => selectedIds.has(d.id)) : data);
    return rows.map((d) => ({
      Name: d.name,
      Code: d.code,
      Type: d.type === "CUSTOM" && d.customTypeName ? d.customTypeName : d.type,
      Status: d.isActive ? "Active" : "Inactive",
      "Consultation Fee": d.consultationFee ? `₹${d.consultationFee}` : "—",
      Doctors: d._count?.doctors || 0,
      Description: d.description || "—",
      Location: d.location || "—",
    }));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Departments Report", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
    const rows = getExportData();
    autoTable(doc, {
      startY: 28,
      head: [["Name", "Code", "Type", "Status", "Fee", "Doctors"]],
      body: rows.map((r) => [r.Name, r.Code, r.Type, r.Status, r["Consultation Fee"], String(r.Doctors)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [14, 137, 143] },
    });
    doc.save(`departments-${new Date().toISOString().slice(0, 10)}.pdf`);
    setShowExport(false);
  };

  const exportExcel = () => {
    const rows = getExportData();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Departments");
    XLSX.writeFile(wb, `departments-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExport(false);
  };

  const exportWord = async () => {
    const rows = getExportData();
    const keys = ["Name", "Code", "Type", "Status", "Consultation Fee", "Doctors"] as const;
    const headerRow = new TableRow({
      children: keys.map((k) => new TableCell({
        width: { size: 100 / keys.length, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20, font: "Calibri" })] })],
      })),
    });
    const dataRows = rows.map((r) => new TableRow({
      children: keys.map((k) => new TableCell({
        width: { size: 100 / keys.length, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: String(r[k] ?? "—"), size: 20, font: "Calibri" })] })],
      })),
    }));
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Departments Report", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-IN")}`, size: 18, color: "888888" })] }),
          new Paragraph({ text: "" }),
          new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `departments-${new Date().toISOString().slice(0, 10)}.docx`);
    setShowExport(false);
  };

  return (
    <>
      <style>{`
        .dept-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
        .dept-toolbar-left{display:flex;flex-direction:column;gap:2px;min-width:0}
        .dept-toolbar-left h2{margin:0;font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
        .dept-toolbar-left p{margin:0;font-size:13px;color:#94a3b8;line-height:1.3}
        .dept-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px}
        .dept-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .dept-search-input::placeholder{color:#94a3b8}
        .dept-toolbar-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .dept-filter-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:500;cursor:pointer}
        .dept-filter-btn:hover{border-color:#cbd5e1}
        .dept-filter-btn.active{background:#E6F4F4;border-color:#0E898F;color:#0E898F}
        .dept-filters{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
        .dept-filter-select{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;color:#334155;background:#fff;cursor:pointer}
        .dept-btn-primary{padding:10px 20px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,.25);transition:all .15s;white-space:nowrap}
        .dept-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
        .dept-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .dept-btn-ghost{padding:10px 20px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer}
        .dept-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}
        .dept-btn-danger{padding:10px 20px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px}
        .dept-btn-danger:hover{background:#dc2626}
        .dept-btn-danger:disabled{opacity:.55;cursor:not-allowed}
        .dept-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .dept-tbl{width:100%;border-collapse:collapse}
        .dept-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
        .dept-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc}
        .dept-tbl tr:last-child td{border-bottom:none}
        .dept-tbl tbody tr:hover td{background:#fafbfc}
        .dept-dept-name{font-weight:600;color:#1e293b}
        .dept-dept-code{font-family:monospace;font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#64748b}
        .dept-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .dept-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .dept-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .dept-badge.blue{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
        .dept-badge.purple{background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe}
        .dept-badge.orange{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
        .dept-badge.gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
        .dept-badge.teal{background:#f0fdfa;color:#0d9488;border:1px solid #99f6e4}
        .dept-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
        .dept-edit{background:#E6F4F4;color:#0E898F}.dept-edit:hover{background:#B3E0E0}
        .dept-del{background:#fff5f5;color:#ef4444}.dept-del:hover{background:#fee2e2}
        .dept-cred{background:#eff6ff;color:#2563eb}.dept-cred:hover{background:#dbeafe}
        .dept-cred-sent{background:#f0fdf4;color:#16a34a}.dept-cred-sent:hover{background:#dcfce7}
        .dept-actions{display:flex;gap:6px;align-items:center}
        .dept-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
        .dept-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
        .dept-pagination{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff;border-top:1px solid #f1f5f9}
        .dept-pagination-info{font-size:13px;color:#64748b}
        .dept-pagination-btns{display:flex;gap:6px}
        .dept-page-btn{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .dept-page-btn:hover:not(:disabled){background:#f8fafc;border-color:#cbd5e1}
        .dept-page-btn:disabled{opacity:.4;cursor:not-allowed}
        .dept-page-btn.active{background:#0E898F;border-color:#0E898F;color:#fff}
        .dept-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .dept-modal{background:#fff;border-radius:18px;padding:0;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);max-height:90vh;overflow:hidden;display:flex;flex-direction:column}
        .dept-modal-lg{max-width:720px}
        .dept-modal-md{max-width:560px}
        .dept-modal-sm{max-width:400px;padding:24px;text-align:center}
        .dept-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #e2e8f0;background:#fff;flex-shrink:0}
        .dept-modal-title{font-size:13px;font-weight:700;color:#1e293b}
        .dept-modal-form{display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0}
        .dept-modal-body{padding:16px 20px;overflow-y:auto;flex:1}
        .dept-modal-footer{padding:12px 20px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:8px;background:#fff;flex-shrink:0}
        .dept-section{margin-bottom:14px}
        .dept-section:last-child{margin-bottom:0}
        .dept-section-title{display:flex;align-items:center;gap:5px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #f1f5f9}
        .dept-section-icon{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center}
        .dept-section-icon.blue{background:#E6F4F4;color:#0E898F}
        .dept-section-icon.green{background:#f0fdf4;color:#16a34a}
        .dept-section-icon.purple{background:#f5f3ff;color:#7c3aed}
        .dept-section-icon.orange{background:#fff7ed;color:#ea580c}
        .dept-section-icon.gray{background:#f8fafc;color:#64748b}
        .dept-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .dept-form-grid.cols-3{grid-template-columns:1fr 1fr 1fr}
        .dept-field{display:flex;flex-direction:column;gap:3px}
        .dept-field.full{grid-column:1/-1}
        .dept-lbl{font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8}
        .dept-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:12px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
        .dept-input:focus{border-color:#80CCCC;box-shadow:0 0 0 3px rgba(147,197,253,.25)}
        .dept-input::placeholder{color:#94a3b8}
        .dept-input.error{border-color:#fca5a5}
        .dept-textarea{min-height:80px;resize:vertical}
        .dept-select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:12px;color:#1e293b;outline:none;width:100%;cursor:pointer}
        .dept-error{font-size:10px;color:#ef4444;margin-top:2px}
        .dept-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}
        .dept-toggle-label{font-size:11px;color:#334155;font-weight:500}
        .dept-toggle-desc{font-size:10px;color:#94a3b8;margin-top:2px}
        .dept-toggle{width:44px;height:24px;border-radius:100px;background:#e2e8f0;border:none;cursor:pointer;position:relative;transition:background .2s}
        .dept-toggle.on{background:#0E898F}
        .dept-toggle.disabled{opacity:.5;cursor:not-allowed}
        .dept-toggle-thumb{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}
        .dept-toggle.on .dept-toggle-thumb{transform:translateX(20px)}
        .del-dialog{background:#fff;border-radius:16px;width:100%;max-width:520px;box-shadow:0 24px 48px rgba(0,0,0,.16);overflow:hidden;display:flex;flex-direction:column;animation:delFadeIn .2s ease}
        @keyframes delFadeIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .del-header{display:flex;align-items:center;gap:12px;padding:20px 24px;border-bottom:1px solid #f1f5f9}
        .del-header-icon{width:40px;height:40px;border-radius:10px;background:#fff5f5;color:#ef4444;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .del-header-text h3{margin:0;font-size:16px;font-weight:700;color:#1e293b}
        .del-header-text p{margin:0;font-size:12px;color:#94a3b8;margin-top:1px}
        .del-body{padding:20px 24px;display:flex;flex-direction:column;gap:16px}
        .del-dept-card{display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
        .del-dept-card-icon{width:36px;height:36px;border-radius:9px;background:#E6F4F4;color:#0E898F;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .del-dept-card-name{font-size:14px;font-weight:700;color:#1e293b}
        .del-dept-card-meta{display:flex;align-items:center;gap:4px;margin-top:4px}
        .del-impact{border:1px solid #fde68a;border-radius:12px;overflow:hidden}
        .del-impact-header{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#fffbeb;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.04em}
        .del-impact-body{padding:14px 16px}
        .del-impact-body p{margin:0 0 12px;font-size:13px;color:#64748b;line-height:1.5}
        .del-impact-grid{display:flex;gap:10px;flex-wrap:wrap}
        .del-impact-item{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;flex:1;min-width:120px}
        .del-impact-item-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .del-impact-item-icon.blue{background:#E6F4F4;color:#0E898F}
        .del-impact-item-icon.purple{background:#f5f3ff;color:#7c3aed}
        .del-impact-item-icon.teal{background:#f0fdfa;color:#0d9488}
        .del-impact-item-info{display:flex;flex-direction:column}
        .del-impact-item-count{font-size:16px;font-weight:800;color:#1e293b;line-height:1}
        .del-impact-item-label{font-size:11px;color:#94a3b8;margin-top:2px}
        .del-modes{display:flex;flex-direction:column;gap:8px}
        .del-modes-label{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
        .del-mode-option{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;text-align:left;transition:all .15s;width:100%}
        .del-mode-option:hover{border-color:#cbd5e1;background:#fafbfc}
        .del-mode-option.selected{border-color:#0E898F;background:#f0fdfa}
        .del-mode-option.selected.danger{border-color:#ef4444;background:#fff5f5}
        .del-mode-radio{width:18px;height:18px;border-radius:50%;border:2px solid #cbd5e1;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all .15s}
        .del-mode-radio.on{border-color:#0E898F}
        .del-mode-radio.on.danger{border-color:#ef4444}
        .del-mode-radio-dot{width:8px;height:8px;border-radius:50%;background:#0E898F}
        .del-mode-radio.on.danger .del-mode-radio-dot{background:#ef4444}
        .del-mode-content{flex:1;min-width:0}
        .del-mode-title{font-size:13px;font-weight:700;color:#1e293b}
        .del-mode-desc{font-size:12px;color:#94a3b8;margin-top:3px;line-height:1.4}
        .del-no-deps{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#E6F4F4;border:1px solid #B3E0E0;border-radius:10px;font-size:13px;color:#0A6B70;font-weight:500}
        .del-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #f1f5f9;background:#fafbfc}
        .del-confirm-btn{padding:10px 20px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s}
        .del-confirm-btn:hover{background:#dc2626;transform:translateY(-1px)}
        .del-confirm-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .del-confirm-btn.cascade{background:#991b1b;box-shadow:0 4px 12px rgba(239,68,68,.3)}
        .del-confirm-btn.cascade:hover{background:#7f1d1d}
        .dept-toast-container{position:fixed;top:20px;right:20px;z-index:300;display:flex;flex-direction:column;gap:8px}
        .dept-toast{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.15);animation:slideIn .3s ease}
        @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        .dept-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .dept-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .dept-toast-info{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
        .dept-toast-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.7;padding:0}
        .dept-toast-close:hover{opacity:1}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dept-spin{animation:spin .7s linear infinite}
        .dept-fee{font-weight:600;color:#16a34a}
        .dept-checkbox{width:16px;height:16px;accent-color:#0E898F;cursor:pointer}
        .dept-view{background:#f0f9ff;color:#2563eb}.dept-view:hover{background:#dbeafe}
        .dept-sort-icon{display:inline-flex;margin-left:4px;vertical-align:middle;color:#cbd5e1;cursor:pointer}
        .dept-sort-icon.active{color:#0E898F}
        .dept-th-sort{cursor:pointer;user-select:none;white-space:nowrap}
        .dept-th-sort:hover{color:#0E898F}
        .dept-export-wrap{position:relative}
        .dept-export-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:500;cursor:pointer}
        .dept-export-btn:hover{border-color:#cbd5e1;background:#f8fafc}
        .dept-export-dd{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:50;min-width:180px;padding:6px}
        .dept-export-item{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:8px;border:none;background:none;width:100%;cursor:pointer;font-size:13px;color:#334155;font-weight:500}
        .dept-export-item:hover{background:#f1f5f9}
        .dept-export-item .eicon{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center}
        .dept-export-item .eicon.pdf{background:#fff5f5;color:#ef4444}
        .dept-export-item .eicon.xls{background:#f0fdf4;color:#16a34a}
        .dept-export-item .eicon.doc{background:#eff6ff;color:#2563eb}
        .dept-view-modal-body{padding:24px;overflow-y:auto}
        .dept-view-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .dept-view-item{display:flex;flex-direction:column;gap:3px}
        .dept-view-item.full{grid-column:1/-1}
        .dept-view-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
        .dept-view-value{font-size:14px;color:#1e293b;font-weight:500}
        .dept-selected-bar{display:flex;align-items:center;gap:12px;padding:10px 16px;background:#E6F4F4;border:1px solid #B3E0E0;border-radius:10px;margin-bottom:12px;font-size:13px;color:#0A6B70;font-weight:600}
      `}</style>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Toolbar */}
      <div className="dept-toolbar">
        <div className="dept-toolbar-left">
          <h2>Departments</h2>
          <p>Manage your hospital departments configuration</p>
        </div>
        <div className="dept-toolbar-right">
          <button
            className={`dept-filter-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            Filters
          </button>
          <div className="dept-search-wrap">
            <Search size={14} color="#94a3b8" />
            <input
              className="dept-search-input"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
            {search && (
              <button className="dept-icon-btn" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="dept-export-wrap">
            <button className="dept-export-btn" onClick={() => setShowExport(!showExport)}>
              <Download size={14} />
              Export{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
            {showExport && (
              <div className="dept-export-dd">
                <button className="dept-export-item" onClick={exportPDF}>
                  <span className="eicon pdf"><FileText size={13} /></span>Export as PDF
                </button>
                <button className="dept-export-item" onClick={exportExcel}>
                  <span className="eicon xls"><FileSpreadsheet size={13} /></span>Export as Excel
                </button>
                <button className="dept-export-item" onClick={exportWord}>
                  <span className="eicon doc"><FileType size={13} /></span>Export as Word
                </button>
              </div>
            )}
          </div>
          <button className="dept-btn-primary" onClick={openAdd}>
            <Plus size={14} />
            Add Department
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="dept-filters">
          <select
            className="dept-filter-select"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">All Types</option>
            {DEPT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className="dept-filter-select"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {(filterType || filterStatus) && (
            <button
              className="dept-btn-ghost"
              style={{ padding: "8px 12px" }}
              onClick={() => {
                setFilterType("");
                setFilterStatus("");
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="dept-loading">
          <Loader2 size={20} className="dept-spin" />
          Loading departments...
        </div>
      ) : data.length === 0 ? (
        <div className="dept-empty">
          No departments found. Click "+ Add Department" to create one.
        </div>
      ) : (
        <>
        {selectedIds.size > 0 && (
          <div className="dept-selected-bar">
            <Check size={14} />
            {selectedIds.size} department{selectedIds.size > 1 ? "s" : ""} selected
            <button className="dept-btn-ghost" style={{padding:"4px 10px",fontSize:12,marginLeft:"auto"}} onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        )}
        <div className="dept-tbl-wrap">
          <table className="dept-tbl">
            <thead>
              <tr>
                <th style={{width:40}}>
                  <input type="checkbox" className="dept-checkbox" checked={allSelected} ref={(el)=>{if(el) el.indeterminate = someSelected;}} onChange={toggleSelectAll} />
                </th>
                <th className="dept-th-sort" onClick={()=>handleSort("name")}>
                  Department
                  <span className={`dept-sort-icon ${sortBy==="name"?"active":""}`}>
                    {sortBy==="name"?(sortOrder==="asc"?<ArrowUp size={12}/>:<ArrowDown size={12}/>):<ArrowUpDown size={12}/>}
                  </span>
                </th>
                <th className="dept-th-sort" onClick={()=>handleSort("code")}>
                  Code
                  <span className={`dept-sort-icon ${sortBy==="code"?"active":""}`}>
                    {sortBy==="code"?(sortOrder==="asc"?<ArrowUp size={12}/>:<ArrowDown size={12}/>):<ArrowUpDown size={12}/>}
                  </span>
                </th>
                <th className="dept-th-sort" onClick={()=>handleSort("type")}>
                  Type
                  <span className={`dept-sort-icon ${sortBy==="type"?"active":""}`}>
                    {sortBy==="type"?(sortOrder==="asc"?<ArrowUp size={12}/>:<ArrowDown size={12}/>):<ArrowUpDown size={12}/>}
                  </span>
                </th>
                <th>Status</th>
                <th className="dept-th-sort" onClick={()=>handleSort("consultationFee")}>
                  Consultation Fee
                  <span className={`dept-sort-icon ${sortBy==="consultationFee"?"active":""}`}>
                    {sortBy==="consultationFee"?(sortOrder==="asc"?<ArrowUp size={12}/>:<ArrowDown size={12}/>):<ArrowUpDown size={12}/>}
                  </span>
                </th>
                <th>Doctors</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} style={selectedIds.has(row.id)?{background:"#f0fdfa"}:undefined}>
                  <td>
                    <input type="checkbox" className="dept-checkbox" checked={selectedIds.has(row.id)} onChange={()=>toggleSelect(row.id)} />
                  </td>
                  <td>
                    <div className="dept-dept-name">{row.name}</div>
                    {row.description && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {row.description.slice(0, 50)}
                        {row.description.length > 50 ? "..." : ""}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="dept-dept-code">{row.code}</span>
                  </td>
                  <td>
                    <span className={`dept-badge ${TYPE_COLORS[row.type] || "gray"}`}>
                      {row.type === "CUSTOM" && row.customTypeName ? row.customTypeName : row.type}
                    </span>
                  </td>
                  <td>
                    <div className="dept-actions">
                      <span className={`dept-badge ${row.isActive ? "green" : "red"}`}>
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                      <Toggle checked={row.isActive} onChange={() => handleToggleStatus(row)} />
                    </div>
                  </td>
                  <td>
                    {row.consultationFee ? (
                      <span className="dept-fee">₹{row.consultationFee}</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td>{row._count?.doctors || 0}</td>
                  <td>
                    <div className="dept-actions">
                      {row.loginEmail && (
                        row.credentialsSent ? (
                          <button
                            className="dept-icon-btn dept-cred-sent"
                            onClick={() => handleSendCredentials(row, true)}
                            disabled={sendingCredId === row.id}
                            title="Resend credentials"
                          >
                            {sendingCredId === row.id ? <Loader2 size={13} className="dept-spin" /> : <Check size={13} />}
                          </button>
                        ) : (
                          <button
                            className="dept-icon-btn dept-cred"
                            onClick={() => handleSendCredentials(row)}
                            disabled={sendingCredId === row.id}
                            title="Send login credentials"
                          >
                            {sendingCredId === row.id ? <Loader2 size={13} className="dept-spin" /> : <Send size={13} />}
                          </button>
                        )
                      )}
                      <button className="dept-icon-btn dept-view" onClick={() => setViewItem(row)} title="View details">
                        <Eye size={13} />
                      </button>
                      <button className="dept-icon-btn dept-edit" onClick={() => openEdit(row)}>
                        <Pencil size={13} />
                      </button>
                      <button className="dept-icon-btn dept-del" onClick={() => setDeleteItem(row)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="dept-pagination">
            <div className="dept-pagination-info">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="dept-pagination-btns">
              <button
                className="dept-page-btn"
                disabled={pagination.page === 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: "0 4px" }}>...</span>}
                    <button
                      className={`dept-page-btn ${pagination.page === p ? "active" : ""}`}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                className="dept-page-btn"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Department" : "Add Department"}>
        <form onSubmit={handleSubmit} className="dept-modal-form">
          <div className="dept-modal-body">
            {/* Section 1: Basic Info */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon blue"><Building2 size={11}/></span>
                Basic Information
              </div>
              <div className="dept-form-grid">
                <div className="dept-field">
                  <label className="dept-lbl">Department Name *</label>
                  <input
                    className={`dept-input ${errors.name ? "error" : ""}`}
                    placeholder="e.g., General OPD"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    onBlur={() => !editItem && !form.code && generateCode(form.name)}
                  />
                  {errors.name && <span className="dept-error">{errors.name}</span>}
                </div>
                <div className="dept-field">
                  <label className="dept-lbl">Department Code *</label>
                  <input
                    className={`dept-input ${errors.code ? "error" : ""}`}
                    placeholder="e.g., GENOPD"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    maxLength={10}
                  />
                  {errors.code && <span className="dept-error">{errors.code}</span>}
                </div>
                <div className="dept-field full">
                  <label className="dept-lbl">Description</label>
                  <textarea
                    className="dept-input dept-textarea"
                    placeholder="Brief description of the department..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Department Type */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon purple"><Settings2 size={11}/></span>
                Department Type
              </div>
              <div className="dept-form-grid">
                <div className="dept-field full">
                  <label className="dept-lbl">Type *</label>
                  <SearchableSelect
                    value={form.type}
                    onChange={(v) => {
                      setForm((f) => ({ ...f, type: v as FormData["type"] }));
                      if (createSubDept) {
                        const opts = SUBDEPT_OPTIONS_BY_DEPT_TYPE[v] || [];
                        setSubDeptForm((f: any) => ({ ...f, type: opts[0]?.value || "" }));
                      }
                    }}
                    options={DEPT_TYPES}
                    placeholder="Select department type..."
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Management */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon orange"><User size={11}/></span>
                Management
              </div>
              <div className="dept-form-grid">
                <div className="dept-field full">
                  <label className="dept-lbl">Head of Department (HOD)</label>
                  <select
                    className="dept-select"
                    value={form.hodUserId}
                    onChange={(e) => setForm((f) => ({ ...f, hodUserId: e.target.value }))}
                  >
                    <option value="">— Select User —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role}){u.email ? ` · ${u.email}` : ""}
                      </option>
                    ))}
                  </select>
                  {users.length === 0 && (
                  <span style={{fontSize:10,color:"#94a3b8",marginTop:3}}>No users found. Users are created when credentials are sent to doctors or staff.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Login Credentials */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon blue"><ShieldCheck size={11}/></span>
                Department Head Login Credentials
                <span style={{ marginLeft: "auto", fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "2px 7px", borderRadius: 100, fontWeight: 700, border: "1px solid #fde68a" }}>Admin Only</span>
              </div>
              <div className="dept-form-grid">
                <div className="dept-field full">
                  <label className="dept-lbl">Login Email / Department ID</label>
                  <input
                    className={`dept-input ${errors.loginEmail ? "error" : ""}`}
                    type="email"
                    placeholder="e.g., support-head@hospital.com"
                    value={form.loginEmail}
                    onChange={(e) => setForm((f) => ({ ...f, loginEmail: e.target.value }))}
                  />
                  {errors.loginEmail && <span className="dept-error">{errors.loginEmail}</span>}
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Lock size={9}/>Login at <strong>http://localhost:3000/parentdept/login</strong> · Credentials sent via email on "Send Credentials"
                  </div>
                </div>
                <div className="dept-field full">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <label className="dept-lbl" style={{ margin: 0 }}>Password</label>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, loginPassword: generatePassword(f.name || "Dept") }))}
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
                      <RefreshCw size={10}/>Regenerate
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="dept-input"
                      type={showPassword ? "text" : "password"}
                      value={form.loginPassword || ""}
                      onChange={(e) => setForm((f) => ({ ...f, loginPassword: e.target.value }))}
                      placeholder={editItem ? "Leave blank to keep existing password" : "Auto-generated or enter custom"}
                      style={{ paddingRight: 72, fontFamily: (showPassword || !form.loginPassword) ? "inherit" : "monospace", letterSpacing: (showPassword || !form.loginPassword) ? "normal" : "0.1em" }}
                    />
                    <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
                      <button type="button" onClick={() => setShowPassword((p) => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button type="button" onClick={copyPassword} style={{ background: "none", border: "none", cursor: "pointer", color: copiedPw ? "#10b981" : "#94a3b8", padding: 2 }} title="Copy password">
                        {copiedPw ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  {editItem
                    ? <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Suggested password shown — edit or leave as-is. Only saved if you change it or it&apos;s new.</div>
                    : <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Pattern: <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, color: "#334155", fontSize: 10 }}>DeptName@Year</code> · e.g. <em>Pharmacy@2026</em> — or type a custom password</div>
                  }
                </div>
                {editItem && form.loginEmail && (
                  <div className="dept-field full" style={{ marginTop: 4 }}>
                    <button
                      type="button"
                      className="dept-btn-outline"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "1.5px solid #B3E0E0", background: "#E6F4F4", color: "#0A6B70", cursor: sendingCredId ? "not-allowed" : "pointer", opacity: sendingCredId ? 0.6 : 1, fontFamily: "inherit" }}
                      disabled={!!sendingCredId}
                      onClick={() => handleSendCredentials(editItem, !!editItem.credentialsSent, form.loginPassword || undefined)}
                    >
                      {sendingCredId === editItem.id ? <Loader2 size={13} className="dept-spin" /> : <Send size={13} />}
                      {editItem.credentialsSent ? "Resend Credentials" : "Send Credentials"}
                    </button>
                    {editItem.credentialsSent && (
                      <span style={{ fontSize: 10, color: "#16a34a", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}><Check size={10}/> Credentials previously sent</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 6: Advanced */}
            <div className="dept-section">
              <div className="dept-section-title">
                <span className="dept-section-icon gray"><MapPin size={11}/></span>
                Advanced Settings
              </div>
              <div className="dept-form-grid">
                <div className="dept-field">
                  <label className="dept-lbl">Location</label>
                  <input
                    className="dept-input"
                    placeholder="e.g., Building A, Floor 2"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div className="dept-field">
                  <div className="dept-toggle-row" style={{ height: "100%" }}>
                    <div>
                      <div className="dept-toggle-label">Active Status</div>
                      <div className="dept-toggle-desc">Department is visible and operational</div>
                    </div>
                    <Toggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dept-modal-footer">
            <button type="button" className="dept-btn-ghost" style={{padding:"7px 14px",fontSize:12}} onClick={() => setModal(false)}>
              Cancel
            </button>
            <button type="submit" className="dept-btn-primary" style={{padding:"7px 14px",fontSize:12}} disabled={saving}>
              {saving && <Loader2 size={13} className="dept-spin" />}
              {editItem ? "Update Department" : "Create Department"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      {viewItem && (
        <div className="dept-overlay" onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:640,boxShadow:"0 8px 32px rgba(0,0,0,.12)",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>

            {/* Header */}
            <div style={{padding:"14px 20px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              <div style={{width:36,height:36,borderRadius:10,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Building2 size={18} color="#64748b"/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{viewItem.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,flexWrap:"wrap"}}>
                  <span className={`dept-badge ${TYPE_COLORS[viewItem.type]||"gray"}`} style={{fontSize:10}}>{viewItem.type==="CUSTOM"&&viewItem.customTypeName?viewItem.customTypeName:viewItem.type}</span>
                  <span className={`dept-badge ${viewItem.isActive?"green":"red"}`} style={{fontSize:10}}>{viewItem.isActive?"Active":"Inactive"}</span>
                  {viewItem.code&&<span style={{fontFamily:"monospace",fontSize:10,color:"#94a3b8",background:"#f8fafc",padding:"2px 6px",borderRadius:4,border:"1px solid #e2e8f0"}}>{viewItem.code}</span>}
                </div>
              </div>
              <button className="dept-icon-btn" onClick={()=>setViewItem(null)}><X size={15}/></button>
            </div>

            {/* Body */}
            <div style={{overflowY:"auto",flex:1,padding:"16px 20px",display:"flex",flexDirection:"column",gap:16}}>

              {/* Identity */}
              <div>
                <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#94a3b8",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                  <Building2 size={10}/> Identity
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Department Name</div>
                    <div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{viewItem.name}</div>
                  </div>
                  <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Code</div>
                    <div style={{fontSize:11,fontWeight:600,color:"#334155",fontFamily:"monospace"}}>{viewItem.code||<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}</div>
                  </div>
                  <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Location</div>
                    <div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{viewItem.location||<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}</div>
                  </div>
                  <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Billing Code</div>
                    <div style={{fontSize:11,fontWeight:600,color:"#334155",fontFamily:"monospace"}}>{viewItem.billingCode||<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}</div>
                  </div>
                  {viewItem.description&&(
                    <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0",gridColumn:"1/-1"}}>
                      <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Description</div>
                      <div style={{fontSize:11,color:"#475569",lineHeight:1.6}}>{viewItem.description}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Settings */}
              <div>
                <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#94a3b8",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                  <Settings2 size={10}/> Clinical Settings
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Consultation Fee</div>
                    <div style={{fontSize:11,fontWeight:700,color:viewItem.consultationFee?"#16a34a":"#334155"}}>
                      {viewItem.consultationFee?`₹${viewItem.consultationFee}`:<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}
                    </div>
                  </div>
                  <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Appointments</div>
                    <span className={`dept-badge ${viewItem.allowAppointments?"green":"gray"}`} style={{fontSize:10}}>{viewItem.allowAppointments?"Enabled":"Disabled"}</span>
                  </div>
                  <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>IPD</div>
                    <span className={`dept-badge ${viewItem.isIPD?"blue":"gray"}`} style={{fontSize:10}}>{viewItem.isIPD?"Yes":"No"}</span>
                  </div>
                  <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Head of Department</div>
                    <div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{viewItem.hodDoctor?.name||viewItem.hodUser?.name||<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}</div>
                  </div>
                </div>
              </div>

              {/* Stats Strip */}
              <div style={{display:"flex",gap:0,border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
                <div style={{flex:1,padding:"10px 14px",textAlign:"center",borderRight:"1px solid #e2e8f0"}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{viewItem._count?.doctors||0}</div>
                  <div style={{fontSize:9,color:"#94a3b8",marginTop:2,fontWeight:500,textTransform:"uppercase",letterSpacing:".04em"}}>Doctors</div>
                </div>
                <div style={{flex:1,padding:"10px 14px",textAlign:"center",borderRight:"1px solid #e2e8f0"}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{viewItem._count?.staff||0}</div>
                  <div style={{fontSize:9,color:"#94a3b8",marginTop:2,fontWeight:500,textTransform:"uppercase",letterSpacing:".04em"}}>Staff</div>
                </div>
                <div style={{flex:1,padding:"10px 14px",textAlign:"center",borderRight:"1px solid #e2e8f0"}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{viewItem._count?.subDepartments||0}</div>
                  <div style={{fontSize:9,color:"#94a3b8",marginTop:2,fontWeight:500,textTransform:"uppercase",letterSpacing:".04em"}}>Sub-Depts</div>
                </div>
                <div style={{flex:1,padding:"10px 14px",textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,color:viewItem.isActive?"#16a34a":"#ef4444",marginTop:2}}>{viewItem.isActive?"Active":"Inactive"}</div>
                  <div style={{fontSize:9,color:"#94a3b8",marginTop:2,fontWeight:500,textTransform:"uppercase",letterSpacing:".04em"}}>Status</div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{padding:"12px 20px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
              <button className="dept-btn-ghost" style={{padding:"7px 14px",fontSize:12}} onClick={()=>setViewItem(null)}>Close</button>
              <button className="dept-btn-primary" style={{padding:"7px 14px",fontSize:12}} onClick={()=>{openEdit(viewItem);setViewItem(null);}}>
                <Pencil size={12}/>Edit Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        department={deleteItem}
        loading={deleting}
      />
    </>
  );
}
