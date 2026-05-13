"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, Search, X, Loader2, Check, AlertTriangle,
  ChevronLeft, ChevronRight, Mail, Key, Eye, EyeOff, User, Phone,
  Activity, FlaskConical, Layers, Filter, Heart, Microscope,
  Stethoscope, Scissors, Receipt, Pill, Scan, TestTube2,
  Smile, Sparkles, Wind, Building2, Copy, RefreshCw, ExternalLink,
  Lock, ShieldCheck, UserPlus, ChevronDown, Send, Users,
  Download, FileText, FileSpreadsheet, FileType, ShieldAlert, Info,
  ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType, TextRun, HeadingLevel } from "docx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HODResult {
  id: string;
  kind: "DOCTOR" | "STAFF";
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

interface SubDept {
  id: string;
  name: string;
  code?: string | null;
  type: string;
  description?: string | null;
  color?: string | null;
  flow?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  hodName?: string | null;
  hodEmail?: string | null;
  hodPhone?: string | null;
  loginEmail?: string | null;
  loginPasswordPlain?: string | null;
  credentialsSent: boolean;
  isActive: boolean;
  procedures?: Procedure[];
  _count?: { procedures: number };
  accessFeatures?: string | null;
  customName?: string | null;
}

interface Procedure {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  fee?: number | null;
  duration?: number | null;
  sequence: number;
  isActive: boolean;
}

interface Department { id: string; name: string; type?: string; }
interface Toast { id: number; type: "success" | "error" | "info"; message: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const SUB_DEPT_TYPES = [
  { value: "DENTAL",      label: "Dental Clinic",    Icon: Smile,       color: "#06b6d4" },
  { value: "DERMATOLOGY", label: "Dermatology",       Icon: Sparkles,    color: "#ec4899" },
  { value: "HAIR",        label: "Hair / Trichology", Icon: Scissors,    color: "#8b5cf6" },
  { value: "ONCOLOGY",    label: "Cancer / Oncology", Icon: Activity,    color: "#f97316" },
  { value: "CARDIOLOGY",  label: "Cardiology",        Icon: Heart,       color: "#ef4444" },
  { value: "PATHOLOGY",   label: "Pathology Lab",     Icon: Microscope,  color: "#10b981" },
  { value: "PHARMACY",    label: "Pharmacy Store",    Icon: Pill,        color: "#0E898F" },
  { value: "BILLING",     label: "Billing Dept",      Icon: Receipt,     color: "#f59e0b" },
  { value: "RADIOLOGY",   label: "Radiology",         Icon: Scan,        color: "#6366f1" },
  { value: "LABORATORY",  label: "Laboratory",        Icon: TestTube2,   color: "#14b8a6" },
  { value: "PROCEDURE",          label: "Procedure Room",    Icon: Stethoscope, color: "#84cc16" },
  { value: "CLINICAL_PROCEDURE",  label: "Clinical Procedure", Icon: Stethoscope, color: "#0ea5e9" },
  { value: "RECEPTION",          label: "Reception",          Icon: Users,       color: "#3b82f6" },
  { value: "OTHER",              label: "Other",              Icon: Layers,      color: "#94a3b8" },
];

const DEPT_SUBDEPT_MAP: Record<string, Array<{value: string; label: string; color: string}>> = {
  CLINICAL: [
    { value: "OPD",                label: "OPD (Outpatient Department)",  color: "#0ea5e9" },
    { value: "IPD",                label: "IPD (Inpatient Department)",   color: "#8b5cf6" },
    { value: "CLINICAL_PROCEDURE", label: "Clinical Procedures",          color: "#0ea5e9" },
  ],
  ADMINISTRATIVE: [
    { value: "RECEPTION", label: "Reception",  color: "#3b82f6" },
    { value: "BILLING",   label: "Billing",    color: "#f59e0b" },
  ],
  SUPPORT: [
    { value: "PHARMACY",     label: "Pharmacy",     color: "#0E898F" },
    { value: "AMBULANCE",    label: "Ambulance",    color: "#ef4444" },
    { value: "HOUSEKEEPING", label: "Housekeeping", color: "#f97316" },
  ],
  DIAGNOSTIC: [
    { value: "PATHOLOGY",  label: "Pathology Lab",  color: "#10b981" },
    { value: "BLOOD_BANK", label: "Blood Bank",     color: "#ef4444" },
  ],
};

const ALL_SUBDEPT_OPTIONS = Object.values(DEPT_SUBDEPT_MAP)
  .flat()
  .filter((t, i, arr) => arr.findIndex(x => x.value === t.value) === i);

const TYPE_EXTRA: Record<string, {label: string; Icon: any; color: string}> = {
  HR:              { label: "HR",                     Icon: UserPlus,    color: "#8b5cf6" },
  ACCOUNTS:        { label: "Accounts",               Icon: Receipt,     color: "#10b981" },
  NURSING:         { label: "Nursing",                Icon: Heart,       color: "#ec4899" },
  HOUSEKEEPING:    { label: "Housekeeping",            Icon: Wind,        color: "#f97316" },
  AMBULANCE:       { label: "Ambulance",              Icon: Activity,    color: "#ef4444" },
  BIOMEDICAL:      { label: "Biomedical / Equipment", Icon: Stethoscope, color: "#6366f1" },
  OT:              { label: "Operation Theatre (OT)", Icon: Scissors,    color: "#ef4444" },
  DIALYSIS:        { label: "Dialysis Unit",          Icon: FlaskConical,color: "#6366f1" },
  PHYSIOTHERAPY:   { label: "Physiotherapy",          Icon: Activity,    color: "#84cc16" },
  COSMETIC:        { label: "Cosmetic / Aesthetic",   Icon: Sparkles,    color: "#ec4899" },
  ENDOSCOPY:       { label: "Endoscopy",              Icon: Scan,        color: "#f97316" },
  BLOOD_BANK:      { label: "Blood Bank",             Icon: Heart,       color: "#ef4444" },
  ECG:             { label: "ECG / EEG",              Icon: Activity,    color: "#f59e0b" },
  OPD:             { label: "OPD (Outpatient)",       Icon: Stethoscope, color: "#0ea5e9" },
  IPD:             { label: "IPD (Inpatient)",        Icon: Building2,   color: "#8b5cf6" },
  EMERGENCY:       { label: "Emergency / Casualty",   Icon: Activity,    color: "#ef4444" },
  ICU:             { label: "ICU / NICU",             Icon: Heart,       color: "#f97316" },
  GENERAL_MEDICINE:{ label: "General Medicine",       Icon: Stethoscope, color: "#10b981" },
  SURGERY:         { label: "Surgery",                Icon: Scissors,    color: "#64748b" },
  GYNECOLOGY:      { label: "Gynecology",             Icon: Heart,       color: "#ec4899" },
  PEDIATRICS:      { label: "Pediatrics",             Icon: Smile,       color: "#06b6d4" },
  CLINICAL_PROCEDURE: { label: "Clinical Procedure",  Icon: Stethoscope, color: "#0ea5e9" },
  CUSTOM:              { label: "Custom",              Icon: Layers,      color: "#94a3b8" },
};

const PROCEDURE_TYPES = [
  { value: "DIAGNOSTIC", label: "Diagnostic" },
  { value: "TREATMENT", label: "Treatment" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "SURGERY", label: "Surgery" },
  { value: "THERAPY", label: "Therapy" },
  { value: "MEDICATION", label: "Medication" },
  { value: "OTHER", label: "Other" },
];

const PROC_TYPE_COLORS: Record<string, string> = {
  DIAGNOSTIC: "blue", TREATMENT: "green", CONSULTATION: "purple",
  SURGERY: "red", THERAPY: "orange", MEDICATION: "teal", OTHER: "gray",
};

const PREDEFINED_ACCESS: Record<string, string[]> = {
  DENTAL:          ["appointments", "procedures", "patients"],
  DERMATOLOGY:     ["appointments", "procedures", "patients"],
  HAIR:            ["appointments", "procedures", "patients"],
  ONCOLOGY:        ["appointments", "procedures", "patients"],
  CARDIOLOGY:      ["appointments", "procedures", "patients"],
  RECEPTION:       ["appointments", "billing", "patients", "inventory", "doctors"],
  PHARMACY:        ["procedures", "inventory", "patients", "billing", "reports"],
  BILLING:         ["billing", "finance", "patients"],
  PATHOLOGY:       ["procedures", "patients", "reports"],
  RADIOLOGY:       ["procedures", "patients", "reports"],
  LABORATORY:      ["procedures", "patients", "reports"],
  PROCEDURE:       ["procedures", "patients", "appointments"],
  OTHER:           ["appointments", "procedures", "patients", "billing", "doctors", "inventory", "reports"],
  HR:              ["doctors", "patients"],
  ACCOUNTS:        ["billing", "finance"],
  NURSING:         ["appointments", "patients", "procedures", "reports"],
  HOUSEKEEPING:    ["reports"],
  AMBULANCE:       ["patients", "billing", "reports"],
  BIOMEDICAL:      ["procedures", "inventory", "reports"],
  OT:              ["procedures", "patients", "appointments"],
  DIALYSIS:        ["procedures", "patients", "appointments"],
  PHYSIOTHERAPY:   ["procedures", "patients", "appointments"],
  COSMETIC:        ["appointments", "procedures", "patients"],
  ENDOSCOPY:       ["procedures", "patients", "reports"],
  BLOOD_BANK:      ["procedures", "patients", "reports"],
  ECG:             ["procedures", "patients", "reports"],
  OPD:             ["appointments", "patients", "doctors", "billing"],
  IPD:             ["appointments", "patients", "doctors", "billing"],
  EMERGENCY:       ["appointments", "patients", "procedures", "billing"],
  ICU:             ["patients", "procedures"],
  GENERAL_MEDICINE:["appointments", "patients", "doctors"],
  SURGERY:         ["procedures", "patients", "appointments"],
  GYNECOLOGY:      ["appointments", "procedures", "patients"],
  PEDIATRICS:      ["appointments", "procedures", "patients"],
  CLINICAL_PROCEDURE: ["appointments", "procedures", "patients", "billing", "doctors"],
  CUSTOM:          ["appointments", "procedures", "patients", "billing", "doctors", "inventory", "reports"],
};
const FEATURE_LABELS: Record<string, string> = {
  billing: "Billing", finance: "Finance", appointments: "Appointments",
  doctors: "Doctors Management", patients: "Patient Management",
  procedures: "Procedures", inventory: "Inventory", reports: "Reports",
};

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

function SearchableSelect({
  value, onChange, options, placeholder = "Select...",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; desc?: string; color?: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => { setOpen(o => !o); setSearch(""); }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", border: `1.5px solid ${open ? "#80CCCC" : "#e2e8f0"}`, borderRadius: 9, padding: "8px 11px", cursor: "pointer", fontSize: 12, color: selected ? "#1e293b" : "#94a3b8", fontWeight: selected ? 600 : 400, userSelect: "none", boxShadow: open ? "0 0 0 3px rgba(147,197,253,.2)" : "none" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
          {selected?.color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: selected.color, flexShrink: 0 }} />}
          <span>{selected?.label || placeholder}</span>
        </div>
        <ChevronDown size={12} style={{ color: "#94a3b8", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 9, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 200 }}>
          <div style={{ padding: "7px 9px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 5 }}>
            <Search size={11} color="#94a3b8" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ border: "none", outline: "none", fontSize: 11, color: "#334155", background: "transparent", width: "100%" }} />
            {search && <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, lineHeight: 1 }}><X size={10} /></button>}
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "10px 12px", fontSize: 11, color: "#94a3b8" }}>No results</div>
            ) : filtered.map(o => (
              <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                style={{ padding: "8px 12px", cursor: "pointer", background: o.value === value ? "#E6F4F4" : "#fff", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 7 }}
                onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = o.value === value ? "#E6F4F4" : "#fff"; }}>
                {o.color && <span style={{ width: 7, height: 7, borderRadius: "50%", background: o.color, flexShrink: 0 }} />}
                <span style={{ fontSize: 12, fontWeight: 600, color: o.value === value ? "#0E898F" : "#1e293b" }}>{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const getTypeInfo = (type: string) => {
  const legacy = SUB_DEPT_TYPES.find(t => t.value === type);
  if (legacy) return legacy;
  const extra = TYPE_EXTRA[type];
  if (extra) return extra;
  return { label: type, Icon: Layers, color: "#94a3b8" };
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="sd-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`sd-toast sd-toast-${t.type}`}>
          {t.type === "success" && <Check size={15} />}
          {t.type === "error" && <AlertTriangle size={15} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="sd-icon-btn"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Procedure Row ────────────────────────────────────────────────────────────

function ProcedureRow({ proc, onEdit, onDelete }: { proc: Procedure; onEdit: (p: Procedure) => void; onDelete: (p: Procedure) => void }) {
  const color = PROC_TYPE_COLORS[proc.type] || "gray";
  return (
    <div className="sd-proc-row">
      <div className="sd-proc-info">
        <div className="sd-proc-name">{proc.name}</div>
        {proc.description && <div className="sd-proc-desc">{proc.description}</div>}
      </div>
      <div className="sd-proc-meta">
        <span className={`sd-badge ${color}`}>{proc.type}</span>
        {proc.fee != null && <span className="sd-proc-fee">₹{proc.fee}</span>}
        {proc.duration && <span className="sd-proc-dur">{proc.duration}m</span>}
        <span className={`sd-badge ${proc.isActive ? "green" : "red"}`}>{proc.isActive ? "Active" : "Off"}</span>
      </div>
      <div className="sd-proc-actions">
        <button className="sd-icon-btn sd-edit" onClick={() => onEdit(proc)}><Pencil size={12} /></button>
        <button className="sd-icon-btn sd-del" onClick={() => onDelete(proc)}><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function SubDepartmentPanel() {
  const [data, setData] = useState<SubDept[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Main modal
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<SubDept | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    name: "", code: "", type: "DENTAL", description: "", color: "", flow: "",
    departmentId: "", hodName: "", hodEmail: "", hodPhone: "", loginEmail: "", isActive: true,
    accessFeatures: [], customName: "",
  });

  // Procedures modal (view/manage procedures for a sub-dept)
  const [procModal, setProcModal] = useState(false);
  const [selectedSubDept, setSelectedSubDept] = useState<SubDept | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [procLoading, setProcLoading] = useState(false);
  const [procForm, setProcForm] = useState<any>({ name: "", type: "OTHER", description: "", fee: "", duration: "", sequence: 0, isActive: true });
  const [editProc, setEditProc] = useState<Procedure | null>(null);
  const [procFormOpen, setProcFormOpen] = useState(false);
  const [savingProc, setSavingProc] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SubDept | null>(null);
  const [deletingProc, setDeletingProc] = useState<Procedure | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // View details
  const [viewItem, setViewItem] = useState<SubDept | null>(null);

  // Sort
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Export
  const [showExport, setShowExport] = useState(false);

  // Credentials
  const [sendingCreds, setSendingCreds] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);

  const handleBulkSend = async () => {
    if (!confirm("Send credentials to all sub-departments that haven't received them yet?")) return;
    setBulkSending(true);
    try {
      const res = await api("/api/config/subdepartments/send-credentials-bulk", "POST");
      if (res.success) { addToast("success", res.message || "Bulk credentials sent"); load(); }
      else addToast("error", res.message || "Bulk send failed");
    } catch {
      addToast("error", "Failed to send bulk credentials");
    }
    setBulkSending(false);
  };

  // HOD search
  const [hodSearch, setHodSearch] = useState("");
  const [hodResults, setHodResults] = useState<HODResult[]>([]);
  const [hodDropdownOpen, setHodDropdownOpen] = useState(false);
  const [hodLoading, setHodLoading] = useState(false);
  const hodRef = useRef<HTMLDivElement>(null);

  // Password
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);

  // Auto-generate DeptName@Year password
  const generatePassword = (name: string) => {
    const year = new Date().getFullYear();
    const prefix = (name || "Dept").split(" ")[0].replace(/[^a-zA-Z0-9]/g, "") || "Dept";
    return `${prefix}@${year}`;
  };

  // Debounced HOD search
  useEffect(() => {
    if (!hodDropdownOpen) return;
    const t = setTimeout(async () => {
      setHodLoading(true);
      try {
        const q = hodSearch ? `&search=${encodeURIComponent(hodSearch)}` : "";
        const [docRes, staffRes] = await Promise.all([
          api(`/api/config/doctors?limit=8${q}`),
          api(`/api/config/staff?limit=8${q}`),
        ]);
        const doctors: HODResult[] = (docRes.data?.data || []).map((d: any) => ({
          id: d.id, kind: "DOCTOR" as const, name: d.name, email: d.email, phone: d.phone,
          role: d.specialization || d.department?.name || "Doctor",
        }));
        const staffs: HODResult[] = (staffRes.data?.data || []).map((s: any) => ({
          id: s.id, kind: "STAFF" as const, name: s.name, email: s.email, phone: s.phone,
          role: s.role,
        }));
        setHodResults([...doctors, ...staffs]);
      } catch { setHodResults([]); }
      setHodLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [hodSearch, hodDropdownOpen]);

  // Close HOD dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (hodRef.current && !hodRef.current.contains(e.target as Node)) setHodDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectHOD = (hod: HODResult) => {
    setForm((f: any) => ({ ...f, hodName: hod.name, hodEmail: hod.email || "", hodPhone: hod.phone || "", hodStaffId: hod.id }));
    setHodSearch(hod.name);
    setHodDropdownOpen(false);
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
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  // Load
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filterType) params.append("type", filterType);
    if (filterStatus) params.append("isActive", filterStatus);
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    const res = await api(`/api/config/subdepartments?${params}`);
    if (res.success && res.data) {
      setData(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [search, filterType, filterStatus, pagination.page, pagination.limit]);

  const loadDepartments = async () => {
    const res = await api("/api/config/departments?limit=100");
    if (res.success) setDepartments(res.data?.data || []);
  };

  const loadProcedures = useCallback(async (subDeptId: string) => {
    setProcLoading(true);
    const res = await api(`/api/config/procedures?subDepartmentId=${subDeptId}`);
    if (res.success) setProcedures(res.data || []);
    setProcLoading(false);
  }, []);

  useEffect(() => { load(); loadDepartments(); }, [load]);

  // Handle parent department change — resets sub-dept type to first valid option
  const handleParentDeptChange = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    const newParentType = dept?.type || "";
    const options = DEPT_SUBDEPT_MAP[newParentType] || ALL_SUBDEPT_OPTIONS;
    const isSupport = ["SUPPORT", "ADMINISTRATIVE"].includes(newParentType);
    setForm((f: any) => {
      const currentValid = options.some((t: any) => t.value === f.type);
      const newType = currentValid ? f.type : (options[0]?.value || ALL_SUBDEPT_OPTIONS[0]?.value || "OPD");
      const typeColor = options.find((o: any) => o.value === newType)?.color || f.color;
      return {
        ...f,
        departmentId: deptId,
        parentDeptType: newParentType,
        type: newType,
        customName: "",
        ...(isSupport ? { color: typeColor, flow: "", isActive: true, accessFeatures: PREDEFINED_ACCESS[newType] || [] } : {}),
      };
    });
  };

  // Open add/edit modal
  const openAdd = () => {
    setEditItem(null);
    const pw = generatePassword("Dept");
    setForm({ name: "", code: "", type: "RECEPTION", parentDeptType: "", description: "", color: "#3b82f6", flow: "", departmentId: "", hodName: "", hodEmail: "", hodPhone: "", hodStaffId: "", loginEmail: "", loginPassword: pw, isActive: true, accessFeatures: PREDEFINED_ACCESS["RECEPTION"] || [], customName: "" });
    setHodSearch(""); setHodResults([]); setHodDropdownOpen(false);
    setModal(true);
  };

  const openEdit = (item: SubDept) => {
    setEditItem(item);
    const pw = item.loginPasswordPlain || generatePassword(item.hodName || item.name);
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = item.accessFeatures ? JSON.parse(item.accessFeatures) : [];
    } catch { parsedFeatures = []; }
    const parentDept = departments.find(d => d.id === item.departmentId);
    setForm({
      name: item.name,
      code: item.code || "",
      type: item.type,
      parentDeptType: parentDept?.type || "",
      description: item.description || "",
      color: item.color || "",
      flow: item.flow || "",
      departmentId: item.departmentId || "",
      hodName: item.hodName || "",
      hodEmail: item.hodEmail || "",
      hodPhone: item.hodPhone || "",
      hodStaffId: "",
      loginEmail: item.loginEmail || "",
      loginPassword: pw,
      // loginPasswordPlain is read-only — shown from DB, not editable
      isActive: item.isActive,
      accessFeatures: parsedFeatures,
      customName: item.customName || "",
    });
    setHodSearch(item.hodName || "");
    setHodResults([]); setHodDropdownOpen(false);
    setModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { loginPassword, hodStaffId, consultationFee, accessFeatures, parentDeptType, ...rest } = form;
    const payload = {
      ...rest,
      color: form.color || undefined,
      flow: form.flow || undefined,
      departmentId: form.departmentId || null,
      hodName: form.hodName || null,
      hodEmail: form.hodEmail || null,
      hodPhone: form.hodPhone || null,
      loginEmail: form.loginEmail || null,
      accessFeatures: JSON.stringify(form.accessFeatures || []),
      customName: form.type === "CUSTOM" ? form.customName || null : null,
    };
    let res;
    if (editItem) res = await api(`/api/config/subdepartments/${editItem.id}`, "PUT", payload);
    else res = await api("/api/config/subdepartments", "POST", payload);
    setSaving(false);
    if (res.success) {
      addToast("success", editItem ? "Sub-department updated" : "Sub-department created (procedures auto-seeded)");
      setModal(false);
      load();
    } else addToast("error", res.message || "Operation failed");
  };

  const handleToggleStatus = async (item: SubDept) => {
    const res = await api(`/api/config/subdepartments/${item.id}`, "PATCH", { isActive: !item.isActive });
    if (res.success) { addToast("success", `Status updated`); load(); }
    else addToast("error", res.message || "Failed");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api(`/api/config/subdepartments/${deleteTarget.id}`, "DELETE");
    setDeleting(false);
    if (res.success) { addToast("success", "Deleted successfully"); setDeleteTarget(null); load(); }
    else addToast("error", res.message || "Failed to delete");
  };

  const sendCredentials = async (item: SubDept) => {
    if (!item.loginEmail) return addToast("error", "Set a login email first");
    const isResend = item.credentialsSent;
    setSendingCreds(item.id);
    const res = await api(`/api/config/subdepartments/${item.id}/send-credentials${isResend ? "?resend=true" : ""}`, "POST");
    setSendingCreds(null);
    if (res.success) { addToast("success", isResend ? "Credentials resent!" : "Credentials sent!"); load(); }
    else addToast("error", res.message || "Failed to send");
  };

  // Procedures management
  const openProcModal = (item: SubDept) => {
    setSelectedSubDept(item);
    loadProcedures(item.id);
    setProcFormOpen(false);
    setEditProc(null);
    setProcModal(true);
  };

  const openAddProc = () => {
    setEditProc(null);
    setProcForm({ name: "", type: "OTHER", description: "", fee: "", duration: "", sequence: procedures.length, isActive: true });
    setProcFormOpen(true);
  };

  const openEditProc = (p: Procedure) => {
    setEditProc(p);
    setProcForm({ name: p.name, type: p.type, description: p.description || "", fee: p.fee?.toString() || "", duration: p.duration?.toString() || "", sequence: p.sequence, isActive: p.isActive });
    setProcFormOpen(true);
  };

  const handleProcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubDept) return;
    setSavingProc(true);
    const payload = {
      ...procForm,
      subDepartmentId: selectedSubDept.id,
      fee: procForm.fee ? parseFloat(procForm.fee) : null,
      duration: procForm.duration ? parseInt(procForm.duration) : null,
      sequence: parseInt(procForm.sequence) || 0,
    };
    let res;
    if (editProc) res = await api(`/api/config/procedures/${editProc.id}`, "PUT", payload);
    else res = await api("/api/config/procedures", "POST", payload);
    setSavingProc(false);
    if (res.success) {
      addToast("success", editProc ? "Procedure updated" : "Procedure added");
      setProcFormOpen(false);
      setEditProc(null);
      loadProcedures(selectedSubDept.id);
      load();
    } else addToast("error", res.message || "Failed");
  };

  const handleDeleteProc = async (p: Procedure) => {
    if (!selectedSubDept) return;
    setDeleting(true);
    const res = await api(`/api/config/procedures/${p.id}`, "DELETE");
    setDeleting(false);
    if (res.success) { addToast("success", "Procedure removed"); setDeletingProc(null); loadProcedures(selectedSubDept.id); load(); }
    else addToast("error", res.message || "Failed");
  };

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(data.map(d => d.id)));
  };

  // Sort handler
  const handleSort = (col: string) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };

  // Export helpers
  const getExportData = () => {
    const rows = selectedIds.size > 0 ? data.filter(d => selectedIds.has(d.id)) : data;
    return rows.map(d => {
      const typeInfo = getTypeInfo(d.type);
      return {
        Name: d.name,
        Code: d.code || "-",
        Type: d.type === "CUSTOM" && d.customName ? d.customName : typeInfo.label,
        Department: d.department?.name || "-",
        Status: d.isActive ? "Active" : "Inactive",
        HOD: d.hodName || "-",
        Procedures: d._count?.procedures || 0,
        Description: d.description || "-",
      };
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sub-Departments Report", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
    const rows = getExportData();
    autoTable(doc, {
      startY: 28,
      head: [["Name", "Code", "Type", "Department", "Status", "HOD", "Procedures"]],
      body: rows.map(r => [r.Name, r.Code, r.Type, r.Department, r.Status, r.HOD, String(r.Procedures)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [14, 137, 143] },
    });
    doc.save(`sub-departments-${new Date().toISOString().slice(0, 10)}.pdf`);
    setShowExport(false);
  };

  const exportExcel = () => {
    const rows = getExportData();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sub-Departments");
    XLSX.writeFile(wb, `sub-departments-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExport(false);
  };

  const exportWord = async () => {
    const rows = getExportData();
    const keys = ["Name", "Code", "Type", "Department", "Status", "HOD", "Procedures"] as const;
    const headerRow = new TableRow({
      children: keys.map(k => new TableCell({
        width: { size: 100 / keys.length, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20, font: "Calibri" })] })],
      })),
    });
    const dataRows = rows.map(r => new TableRow({
      children: keys.map(k => new TableCell({
        width: { size: 100 / keys.length, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: String(r[k] ?? "-"), size: 20, font: "Calibri" })] })],
      })),
    }));
    const docx = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "Sub-Departments Report", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-IN")}`, size: 18, color: "888888" })] }),
          new Paragraph({ text: "" }),
          new DocxTable({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
        ],
      }],
    });
    const blob = await Packer.toBlob(docx);
    saveAs(blob, `sub-departments-${new Date().toISOString().slice(0, 10)}.docx`);
    setShowExport(false);
  };

  const SD_STYLES = `
        .sd-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
        .sd-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;min-width:260px}
        .sd-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .sd-search-input::placeholder{color:#94a3b8}
        .sd-toolbar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .sd-filter-btn{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:500;cursor:pointer}
        .sd-filter-btn.active{background:#E6F4F4;border-color:#0E898F;color:#0E898F}
        .sd-filters{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
        .sd-filter-select{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:12px;color:#334155;background:#fff;cursor:pointer}
        .sd-btn-primary{padding:9px 18px;border-radius:9px;border:none;background:#0E898F;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(59,130,246,.25);transition:all .15s;white-space:nowrap}
        .sd-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
        .sd-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .sd-btn-ghost{padding:9px 18px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer}
        .sd-btn-ghost:hover{background:#f8fafc}
        .sd-btn-danger{padding:9px 18px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px}
        .sd-btn-danger:hover{background:#dc2626}
        .sd-btn-sm{padding:6px 12px;border-radius:8px;border:none;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .15s;white-space:nowrap}
        .sd-btn-creds{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}.sd-btn-creds:hover{background:#dcfce7}
        .sd-btn-resend{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}.sd-btn-resend:hover{background:#ffedd5}
        .sd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
        .sd-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;transition:box-shadow .2s}
        .sd-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)}
        .sd-card-head{padding:16px;display:flex;align-items:flex-start;gap:12px;border-bottom:1px solid #f1f5f9}
        .sd-card-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
        .sd-card-info{flex:1;min-width:0}
        .sd-card-name{font-size:15px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sd-card-type{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px}
        .sd-card-body{padding:14px 16px;display:flex;flex-direction:column;gap:8px}
        .sd-card-row{display:flex;align-items:center;gap:8px;font-size:12px;color:#64748b}
        .sd-card-row svg{flex-shrink:0}
        .sd-card-flow{font-size:11px;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;line-height:1.4;font-style:italic}
        .sd-card-foot{padding:12px 16px;border-top:1px solid #f8fafc;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
        .sd-card-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .sd-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
        .sd-edit{background:#E6F4F4;color:#0E898F}.sd-edit:hover{background:#B3E0E0}
        .sd-del{background:#fff5f5;color:#ef4444}.sd-del:hover{background:#fee2e2}
        .sd-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700}
        .sd-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .sd-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .sd-badge.blue{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
        .sd-badge.purple{background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe}
        .sd-badge.orange{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
        .sd-badge.teal{background:#f0fdfa;color:#0d9488;border:1px solid #99f6e4}
        .sd-badge.gray{background:#f8fafc;color:#64748b;border:1px solid #e2e8f0}
        .sd-proc-count{font-size:11px;color:#94a3b8;display:flex;align-items:center;gap:4px;cursor:pointer}
        .sd-proc-count:hover{color:#0E898F}
        .sd-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
        .sd-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
        .sd-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 0;margin-top:12px}
        .sd-pagination-info{font-size:12px;color:#64748b}
        .sd-pagination-btns{display:flex;gap:5px}
        .sd-page-btn{width:30px;height:30px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .sd-page-btn:hover:not(:disabled){background:#f8fafc}
        .sd-page-btn:disabled{opacity:.4;cursor:not-allowed}
        .sd-page-btn.active{background:#0E898F;border-color:#0E898F;color:#fff}
        .sd-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .sd-modal{background:#fff;border-radius:18px;width:100%;max-width:640px;box-shadow:0 20px 60px rgba(0,0,0,.2);max-height:92vh;overflow:hidden;display:flex;flex-direction:column}
        .sd-modal-lg{max-width:720px}
        .sd-modal-sm{max-width:420px;padding:28px;text-align:center}
        .sd-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #e2e8f0;background:#fff;flex-shrink:0}
        .sd-modal-title{font-size:13px;font-weight:700;color:#1e293b}
        .sd-modal-body{padding:14px 18px;overflow-y:auto;flex:1}
        .sd-modal-foot{padding:12px 20px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:8px;background:#fff;flex-shrink:0}
        .sd-section{margin-bottom:14px}
        .sd-section:last-child{margin-bottom:0}
        .sd-section-title{font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:5px}
        .sd-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .sd-field{display:flex;flex-direction:column;gap:3px}
        .sd-field.full{grid-column:1/-1}
        .sd-lbl{font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8}
        .sd-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:12px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
        .sd-input:focus{border-color:#80CCCC;box-shadow:0 0 0 3px rgba(147,197,253,.2)}
        .sd-input::placeholder{color:#94a3b8}
        .sd-textarea{min-height:72px;resize:vertical}
        .sd-select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:12px;color:#1e293b;outline:none;width:100%;cursor:pointer}
        .sd-select:focus{border-color:#80CCCC}
        .sd-type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
        .sd-type-card{padding:10px 8px;border-radius:10px;border:1.5px solid #e2e8f0;background:#f8fafc;cursor:pointer;text-align:center;transition:all .15s;font-size:11px;font-weight:600;color:#64748b}
        .sd-type-card.selected{border-color:var(--type-color);background:var(--type-bg);color:var(--type-color)}
        .sd-type-card:hover:not(.selected){border-color:#cbd5e1;background:#f1f5f9}
        .sd-type-icon{font-size:18px;margin-bottom:4px}
        .sd-toggle-wrap{display:flex;align-items:center;justify-content:space-between;padding:10px 13px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0}
        .sd-toggle{width:40px;height:22px;border-radius:100px;background:#e2e8f0;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
        .sd-toggle.on{background:#0E898F}
        .sd-toggle-thumb{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}
        .sd-toggle.on .sd-toggle-thumb{transform:translateX(18px)}
        .sd-confirm-icon{margin-bottom:14px}
        .sd-confirm-title{font-size:17px;font-weight:700;color:#1e293b;margin-bottom:6px}
        .sd-confirm-msg{font-size:13px;color:#64748b;margin-bottom:18px;line-height:1.5}
        .sd-confirm-actions{display:flex;gap:10px;justify-content:center}
        .sd-toast-container{position:fixed;top:20px;right:20px;z-index:300;display:flex;flex-direction:column;gap:8px}
        .sd-toast{display:flex;align-items:center;gap:9px;padding:11px 15px;border-radius:10px;font-size:12px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.15);animation:sdSlide .3s ease}
        @keyframes sdSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        .sd-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .sd-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .sd-toast-info{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sd-spin{animation:spin .7s linear infinite}
        .sd-proc-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:6px}
        .sd-proc-row:last-child{margin-bottom:0}
        .sd-proc-info{flex:1;min-width:0}
        .sd-proc-name{font-size:13px;font-weight:600;color:#1e293b}
        .sd-proc-desc{font-size:11px;color:#94a3b8;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sd-proc-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;flex-shrink:0}
        .sd-proc-fee{font-size:11px;font-weight:700;color:#16a34a}
        .sd-proc-dur{font-size:11px;color:#94a3b8}
        .sd-proc-actions{display:flex;gap:4px;flex-shrink:0}
        .sd-proc-form{background:#fff;border:1.5px solid #0E898F;border-radius:12px;padding:16px;margin-bottom:12px}
        .sd-flow-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600}
        .sd-creds-sent{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .sd-toolbar-left{display:flex;flex-direction:column;gap:2px;min-width:0}
        .sd-toolbar-left h2{margin:0;font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
        .sd-toolbar-left p{margin:0;font-size:13px;color:#94a3b8;line-height:1.3}
        .sd-checkbox{width:16px;height:16px;accent-color:#0E898F;cursor:pointer}
        .sd-card-check{position:absolute;top:12px;left:12px;z-index:2}
        .sd-card{position:relative}
        .sd-card.selected{border-color:#0E898F;box-shadow:0 0 0 1px #0E898F}
        .sd-view{background:#f0f9ff;color:#2563eb}.sd-view:hover{background:#dbeafe}
        .sd-export-wrap{position:relative}
        .sd-export-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:500;cursor:pointer}
        .sd-export-btn:hover{border-color:#cbd5e1;background:#f8fafc}
        .sd-export-dd{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:50;min-width:180px;padding:6px}
        .sd-export-item{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:8px;border:none;background:none;width:100%;cursor:pointer;font-size:13px;color:#334155;font-weight:500}
        .sd-export-item:hover{background:#f1f5f9}
        .sd-export-item .eicon{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center}
        .sd-export-item .eicon.pdf{background:#fff5f5;color:#ef4444}
        .sd-export-item .eicon.xls{background:#f0fdf4;color:#16a34a}
        .sd-export-item .eicon.doc{background:#eff6ff;color:#2563eb}
        .sd-selected-bar{display:flex;align-items:center;gap:12px;padding:10px 16px;background:#E6F4F4;border:1px solid #B3E0E0;border-radius:10px;margin-bottom:12px;font-size:13px;color:#0A6B70;font-weight:600}
        .sd-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .sd-tbl{width:100%;border-collapse:collapse}
        .sd-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
        .sd-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc}
        .sd-tbl tr:last-child td{border-bottom:none}
        .sd-tbl tbody tr:hover td{background:#fafbfc}
        .sd-tbl-name{font-weight:600;color:#1e293b}
        .sd-tbl-code{font-family:monospace;font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#64748b}
        .sd-th-sort{cursor:pointer;user-select:none;white-space:nowrap}
        .sd-th-sort:hover{color:#0E898F}
        .sd-sort-icon{display:inline-flex;margin-left:4px;vertical-align:middle;color:#cbd5e1;cursor:pointer}
        .sd-sort-icon.active{color:#0E898F}
        .sd-tbl-actions{display:flex;gap:6px;align-items:center}
        .sd-view-modal-body{padding:24px;overflow-y:auto}
        .sd-view-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .sd-view-item{display:flex;flex-direction:column;gap:3px}
        .sd-view-item.full{grid-column:1/-1}
        .sd-view-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
        .sd-view-value{font-size:14px;color:#1e293b;font-weight:500}
        .sd-del-dialog{background:#fff;border-radius:16px;width:100%;max-width:520px;box-shadow:0 24px 48px rgba(0,0,0,.16);overflow:hidden;display:flex;flex-direction:column;animation:sdDelFadeIn .2s ease}
        @keyframes sdDelFadeIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .sd-del-header{display:flex;align-items:center;gap:12px;padding:20px 24px;border-bottom:1px solid #f1f5f9}
        .sd-del-header-icon{width:40px;height:40px;border-radius:10px;background:#fff5f5;color:#ef4444;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sd-del-header-text h3{margin:0;font-size:16px;font-weight:700;color:#1e293b}
        .sd-del-header-text p{margin:0;font-size:12px;color:#94a3b8;margin-top:1px}
        .sd-del-body{padding:20px 24px;display:flex;flex-direction:column;gap:16px}
        .sd-del-card{display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
        .sd-del-card-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sd-del-card-name{font-size:14px;font-weight:700;color:#1e293b}
        .sd-del-card-meta{display:flex;align-items:center;gap:4px;margin-top:4px}
        .sd-del-impact{border:1px solid #fde68a;border-radius:12px;overflow:hidden}
        .sd-del-impact-header{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#fffbeb;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.04em}
        .sd-del-impact-body{padding:14px 16px}
        .sd-del-impact-body p{margin:0 0 12px;font-size:13px;color:#64748b;line-height:1.5}
        .sd-del-impact-item{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px}
        .sd-del-impact-item-icon{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#f5f3ff;color:#7c3aed}
        .sd-del-impact-item-count{font-size:16px;font-weight:800;color:#1e293b;line-height:1}
        .sd-del-impact-item-label{font-size:11px;color:#94a3b8;margin-top:2px}
        .sd-del-info{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#E6F4F4;border:1px solid #B3E0E0;border-radius:10px;font-size:13px;color:#0A6B70;font-weight:500}
        .sd-del-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #f1f5f9;background:#fafbfc}
        .sd-del-confirm-btn{padding:10px 20px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s}
        .sd-del-confirm-btn:hover{background:#dc2626;transform:translateY(-1px)}
        .sd-del-confirm-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
  `;
  return (
    <>
      <style>{SD_STYLES}</style>

      <ToastContainer toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />

      {/* Toolbar */}
      <div className="sd-toolbar">
        <div className="sd-toolbar-left">
          <h2>Sub-Depts / Procedures</h2>
          <p>Manage your hospital sub-departments configuration</p>
        </div>
        <div className="sd-toolbar-right">
          <button className={`sd-filter-btn ${showFilters ? "active" : ""}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={13} />Filters
          </button>
          <div className="sd-search-wrap">
            <Search size={14} color="#94a3b8" />
            <input className="sd-search-input" placeholder="Search sub-departments..." value={search}
              onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} />
            {search && <button className="sd-icon-btn" onClick={() => setSearch("")}><X size={13} /></button>}
          </div>
          <div className="sd-export-wrap">
            <button className="sd-export-btn" onClick={() => setShowExport(!showExport)}>
              <Download size={13} />
              Export{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
            {showExport && (
              <div className="sd-export-dd">
                <button className="sd-export-item" onClick={exportPDF}>
                  <span className="eicon pdf"><FileText size={13} /></span>Export as PDF
                </button>
                <button className="sd-export-item" onClick={exportExcel}>
                  <span className="eicon xls"><FileSpreadsheet size={13} /></span>Export as Excel
                </button>
                <button className="sd-export-item" onClick={exportWord}>
                  <span className="eicon doc"><FileType size={13} /></span>Export as Word
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleBulkSend}
            disabled={bulkSending}
            title="Send credentials to all sub-departments who haven't received them"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #dbeafe", background: bulkSending ? "#f1f5f9" : "#eff6ff", color: bulkSending ? "#94a3b8" : "#2563eb", fontSize: 13, fontWeight: 600, cursor: bulkSending ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
          >
            {bulkSending ? <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> : <Send size={13} />}
            Send All
          </button>
          <button className="sd-btn-primary" onClick={openAdd}><Plus size={14} />Add Sub-Department</button>
        </div>
      </div>

      {showFilters && (
        <div className="sd-filters">
          <select className="sd-filter-select" value={filterType} onChange={e => { setFilterType(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
            <option value="">All Types</option>
            {ALL_SUBDEPT_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="sd-filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {(filterType || filterStatus) && (
            <button className="sd-btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => { setFilterType(""); setFilterStatus(""); }}>Clear</button>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="sd-loading"><Loader2 size={20} className="sd-spin" />Loading sub-departments...</div>
      ) : data.length === 0 ? (
        <div className="sd-empty">No sub-departments found. Click "+ Add Sub-Department" to create one.</div>
      ) : (
        <>
          {selectedIds.size > 0 && (
            <div className="sd-selected-bar">
              <Check size={14} />
              {selectedIds.size} sub-department{selectedIds.size > 1 ? "s" : ""} selected
              <button className="sd-btn-ghost" style={{padding:"4px 10px",fontSize:12,marginLeft:"auto"}} onClick={() => setSelectedIds(new Set())}>Clear</button>
            </div>
          )}
          <div className="sd-tbl-wrap">
            <table className="sd-tbl">
              <thead>
                <tr>
                  <th style={{width:40}}>
                    <input type="checkbox" className="sd-checkbox" checked={data.length > 0 && selectedIds.size === data.length} ref={(el:HTMLInputElement|null)=>{if(el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < data.length;}} onChange={toggleSelectAll} />
                  </th>
                  <th className="sd-th-sort" onClick={()=>handleSort("name")}>
                    Sub-Department
                    <span className={`sd-sort-icon ${sortBy==="name"?"active":""}`}>
                      {sortBy==="name"?(sortOrder==="asc"?<ArrowUp size={12}/>:<ArrowDown size={12}/>):<ArrowUpDown size={12}/>}
                    </span>
                  </th>
                  <th>Code</th>
                  <th className="sd-th-sort" onClick={()=>handleSort("type")}>
                    Type
                    <span className={`sd-sort-icon ${sortBy==="type"?"active":""}`}>
                      {sortBy==="type"?(sortOrder==="asc"?<ArrowUp size={12}/>:<ArrowDown size={12}/>):<ArrowUpDown size={12}/>}
                    </span>
                  </th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>HOD</th>
                  <th>Procedures</th>
                  <th>Credentials</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...data].sort((a,b)=>{
                  let va:any=a[sortBy as keyof SubDept], vb:any=b[sortBy as keyof SubDept];
                  if(typeof va==="string") va=va.toLowerCase();
                  if(typeof vb==="string") vb=vb.toLowerCase();
                  if(va<vb) return sortOrder==="asc"?-1:1;
                  if(va>vb) return sortOrder==="asc"?1:-1;
                  return 0;
                }).map(item => {
                  const typeInfo = getTypeInfo(item.type);
                  const hexColor = item.color || typeInfo.color;
                  return (
                    <tr key={item.id} style={selectedIds.has(item.id)?{background:"#f0fdfa"}:undefined}>
                      <td>
                        <input type="checkbox" className="sd-checkbox" checked={selectedIds.has(item.id)} onChange={()=>toggleSelect(item.id)} />
                      </td>
                      <td>
                        <div className="sd-tbl-name">{item.name}</div>
                        {item.description && <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{item.description.slice(0,50)}{item.description.length>50?"...":""}</div>}
                      </td>
                      <td>{item.code ? <span className="sd-tbl-code">{item.code}</span> : <span style={{color:"#94a3b8"}}>-</span>}</td>
                      <td>
                        <span className="sd-badge" style={{background:hexColor+"20",color:hexColor,border:`1px solid ${hexColor}40`}}>
                          {item.type==="CUSTOM"&&item.customName?item.customName:typeInfo.label}
                        </span>
                      </td>
                      <td>{item.department?.name||<span style={{color:"#94a3b8"}}>-</span>}</td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span className={`sd-badge ${item.isActive?"green":"red"}`}>{item.isActive?"Active":"Inactive"}</span>
                          <button type="button" className={`sd-toggle ${item.isActive?"on":""}`} onClick={()=>handleToggleStatus(item)} style={{width:36,height:20}}>
                            <span className="sd-toggle-thumb" style={{width:16,height:16}} />
                          </button>
                        </div>
                      </td>
                      <td>
                        {item.hodName ? (
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:"#1e293b"}}>{item.hodName}</div>
                            {item.hodPhone && <div style={{fontSize:11,color:"#94a3b8"}}>{item.hodPhone}</div>}
                          </div>
                        ) : <span style={{color:"#94a3b8"}}>-</span>}
                      </td>
                      <td>
                        <button className="sd-proc-count" onClick={() => openProcModal(item)} style={{fontSize:12}}>
                          <Layers size={12} />{item._count?.procedures || 0}
                        </button>
                      </td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          {item.credentialsSent && <span className="sd-creds-sent"><Check size={10} />Sent</span>}
                          {item.loginEmail && (
                            <button
                              className={`sd-btn-sm ${item.credentialsSent ? "sd-btn-resend" : "sd-btn-creds"}`}
                              onClick={() => sendCredentials(item)}
                              disabled={sendingCreds === item.id}
                            >
                              {sendingCreds === item.id ? <Loader2 size={11} className="sd-spin" /> : <Key size={11} />}
                              {item.credentialsSent ? "Resend" : "Send"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="sd-tbl-actions">
                          <button className="sd-icon-btn sd-view" onClick={() => setViewItem(item)} title="View details"><Eye size={13} /></button>
                          <button className="sd-icon-btn sd-edit" onClick={() => openEdit(item)}><Pencil size={13} /></button>
                          <button className="sd-icon-btn sd-del" onClick={() => setDeleteTarget(item)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="sd-pagination" style={{padding:"14px 16px",background:"#fff",borderTop:"1px solid #f1f5f9"}}>
              <div className="sd-pagination-info">Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</div>
              <div className="sd-pagination-btns">
                <button className="sd-page-btn" disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}><ChevronLeft size={14} /></button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .map((p, i, arr) => (
                    <span key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: "0 4px", color: "#94a3b8" }}>...</span>}
                      <button className={`sd-page-btn ${pagination.page === p ? "active" : ""}`} onClick={() => setPagination(prev => ({ ...prev, page: p }))}>{p}</button>
                    </span>
                  ))}
                <button className="sd-page-btn" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="sd-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="sd-modal sd-modal-lg">
            <div className="sd-modal-head">
              <span className="sd-modal-title">{editItem ? "Edit Sub-Department" : "Add Sub-Department"}</span>
              <button className="sd-icon-btn" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minHeight: 0 }}>
              <div className="sd-modal-body">
                {/* Section 1+2: Parent Department + Sub-Department Type side by side */}
                <div className="sd-section">
                  <div className="sd-section-title"><Building2 size={10}/>Department Setup</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="sd-field">
                      <label className="sd-lbl">Parent Department</label>
                      <SearchableSelect
                        value={form.departmentId}
                        onChange={v => handleParentDeptChange(v)}
                        options={[
                          { value: "", label: "— None / Independent —" },
                          ...departments.map(d => ({ value: d.id, label: d.name + (d.type ? ` · ${d.type.charAt(0) + d.type.slice(1).toLowerCase()}` : "") }))
                        ]}
                        placeholder="Select parent department..."
                      />
                    </div>
                    <div className="sd-field">
                      <label className="sd-lbl">Sub-Department Type *</label>
                      {(() => {
                        const options = DEPT_SUBDEPT_MAP[form.parentDeptType] || ALL_SUBDEPT_OPTIONS;
                        return (
                          <SearchableSelect
                            value={form.type}
                            onChange={v => {
                              const t = options.find((o: any) => o.value === v);
                              setForm((f: any) => ({ ...f, type: v, color: t?.color || f.color, customName: "", accessFeatures: PREDEFINED_ACCESS[v] || [] }));
                            }}
                            options={options}
                            placeholder="Select sub-dept type..."
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Section 3: Basic Info */}
                <div className="sd-section">
                  <div className="sd-section-title"><FlaskConical size={10}/>Basic Info</div>
                  <div className="sd-form-grid">
                    <div className="sd-field">
                      <label className="sd-lbl">Name *</label>
                      <input className="sd-input" placeholder="e.g., Dental Clinic" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value, loginPassword: generatePassword(e.target.value) }))} required />
                    </div>
                    <div className="sd-field">
                      <label className="sd-lbl">Short Code</label>
                      <input className="sd-input" placeholder="e.g., DEN" value={form.code} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))} maxLength={10} />
                    </div>
                    <div className="sd-field full">
                      <label className="sd-lbl">Description</label>
                      <textarea className="sd-input sd-textarea" placeholder="Brief description..." value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="sd-field full">
                      <div className="sd-toggle-wrap">
                        <div><div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>Active</div><div style={{ fontSize: 10, color: "#94a3b8" }}>Accept patients and appointments</div></div>
                        <button type="button" className={`sd-toggle ${form.isActive ? "on" : ""}`} onClick={() => setForm((f: any) => ({ ...f, isActive: !f.isActive }))}><span className="sd-toggle-thumb" /></button>
                      </div>
                    </div>
                  </div>
                </div>


                {/* HOD */}
                <div className="sd-section">
                  <div className="sd-section-title" style={{ justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><User size={10}/>Head of Department (HOD)</span>
                    <a href="/hospitaladmin/configure?tab=staff" target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#0E898F", textDecoration: "none", padding: "2px 7px", borderRadius: 5, background: "#E6F4F4", border: "1px solid #B3E0E0" }}>
                      <UserPlus size={10}/>Create New<ExternalLink size={8}/>
                    </a>
                  </div>

                  {/* HOD Searchable Dropdown */}
                  <div ref={hodRef} style={{ position: "relative", marginBottom: 12 }}>
                    <label className="sd-lbl" style={{ display: "block", marginBottom: 4 }}>Search Doctor / Staff</label>
                    <div style={{ position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                      <input
                        className="sd-input"
                        style={{ paddingLeft: 32 }}
                        placeholder="Search by name..."
                        value={hodSearch}
                        onChange={e => { setHodSearch(e.target.value); setHodDropdownOpen(true); }}
                        onFocus={() => setHodDropdownOpen(true)}
                      />
                      {form.hodName && <button type="button" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }} onClick={() => { setForm((f: any) => ({ ...f, hodName: "", hodEmail: "", hodPhone: "", hodStaffId: "" })); setHodSearch(""); }}><X size={12} /></button>}
                    </div>
                    {hodDropdownOpen && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.1)", zIndex: 50, maxHeight: 220, overflowY: "auto", marginTop: 4 }}>
                        {hodLoading ? (
                          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8" }}><Loader2 size={13} className="sd-spin" />Searching...</div>
                        ) : hodResults.length === 0 ? (
                          <div style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>No results. Use "Create New" above to add staff.</div>
                        ) : hodResults.map(h => (
                          <div key={h.id} onClick={() => selectHOD(h)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: h.kind === "DOCTOR" ? "#E6F4F4" : "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {h.kind === "DOCTOR" ? <Stethoscope size={14} color="#0E898F" /> : <User size={14} color="#8b5cf6" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{h.name}</div>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>{h.role}{h.email ? ` · ${h.email}` : ""}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: h.kind === "DOCTOR" ? "#E6F4F4" : "#f5f3ff", color: h.kind === "DOCTOR" ? "#0E898F" : "#8b5cf6", border: "1px solid", borderColor: h.kind === "DOCTOR" ? "#B3E0E0" : "#ddd6fe" }}>{h.kind}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sd-form-grid">
                    <div className="sd-field">
                      <label className="sd-lbl">HOD Name</label>
                      <input className="sd-input" placeholder="Full name" value={form.hodName} onChange={e => { setForm((f: any) => ({ ...f, hodName: e.target.value })); setHodSearch(e.target.value); }} />
                    </div>
                    <div className="sd-field">
                      <label className="sd-lbl">HOD Phone</label>
                      <input className="sd-input" placeholder="+91 99999 99999" value={form.hodPhone} onChange={e => setForm((f: any) => ({ ...f, hodPhone: e.target.value }))} />
                    </div>
                    <div className="sd-field full">
                      <label className="sd-lbl">HOD Email</label>
                      <input className="sd-input" type="email" placeholder="hod@hospital.com" value={form.hodEmail} onChange={e => setForm((f: any) => ({ ...f, hodEmail: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Login Credentials (Admin only) */}
                <div className="sd-section">
                  <div className="sd-section-title"><ShieldCheck size={10}/>Dashboard Login Credentials
                    <span style={{ marginLeft: "auto", fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "2px 7px", borderRadius: 100, fontWeight: 700, border: "1px solid #fde68a" }}>Admin Only</span>
                  </div>
                  <div className="sd-form-grid">
                    <div className="sd-field full">
                      <label className="sd-lbl">Login Email / Department ID</label>
                      <input className="sd-input" type="email"
                        placeholder="e.g. dental@yourhospital.com"
                        value={form.loginEmail}
                        onChange={e => setForm((f: any) => ({ ...f, loginEmail: e.target.value }))}
                      />
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <Lock size={9}/>Login at <strong>http://localhost:3000/login</strong> · Credentials created automatically on save
                      </div>
                    </div>
                    <div className="sd-field full">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <label className="sd-lbl" style={{ margin: 0 }}>Password</label>
                        <button type="button" onClick={() => setForm((f: any) => ({ ...f, loginPassword: generatePassword(f.hodName || f.name || "Dept") }))}
                          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
                          <RefreshCw size={10}/>Regenerate
                        </button>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input className="sd-input"
                          type={showPassword ? "text" : "password"}
                          value={form.loginPassword || ""}
                          onChange={e => setForm((f: any) => ({ ...f, loginPassword: e.target.value }))}
                          placeholder="Auto-generated"
                          style={{ paddingRight: 72, fontFamily: showPassword ? "inherit" : "monospace", letterSpacing: showPassword ? "normal" : "0.1em" }}
                        />
                        <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
                          <button type="button" onClick={() => setShowPassword(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}>
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button type="button" onClick={copyPassword} style={{ background: "none", border: "none", cursor: "pointer", color: copiedPw ? "#10b981" : "#94a3b8", padding: 2 }} title="Copy password">
                            {copiedPw ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Pattern: <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, color: "#334155", fontSize: 10 }}>DeptName@Year</code> · e.g. <em>Dental@2026</em></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sd-modal-foot">
                <button type="button" className="sd-btn-ghost" style={{padding:"7px 14px",fontSize:12}} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="sd-btn-primary" style={{padding:"7px 14px",fontSize:12}} disabled={saving}>
                  {saving && <Loader2 size={13} className="sd-spin" />}{editItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Procedures Modal */}
      {procModal && selectedSubDept && (
        <div className="sd-overlay" onClick={e => e.target === e.currentTarget && setProcModal(false)}>
          <div className="sd-modal sd-modal-lg">
            <div className="sd-modal-head">
              <div>
                <div className="sd-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>{(() => { const TI = getTypeInfo(selectedSubDept.type); return <TI.Icon size={16} style={{ color: TI.color }} />; })()} {selectedSubDept.name} — Procedures</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{selectedSubDept.flow || "Manage post-OPD procedures"}</div>
              </div>
              <button className="sd-icon-btn" onClick={() => setProcModal(false)}><X size={16} /></button>
            </div>
            <div className="sd-modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{procedures.length} procedure{procedures.length !== 1 ? "s" : ""}</div>
                <button className="sd-btn-primary" onClick={openAddProc}><Plus size={13} />Add Procedure</button>
              </div>

              {procFormOpen && (
                <div className="sd-proc-form">
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 12 }}>{editProc ? "Edit Procedure" : "New Procedure"}</div>
                  <form onSubmit={handleProcSubmit}>
                    <div className="sd-form-grid">
                      <div className="sd-field full">
                        <label className="sd-lbl">Procedure Name *</label>
                        <input className="sd-input" placeholder="e.g., Root Canal Treatment" value={procForm.name} onChange={e => setProcForm((f: any) => ({ ...f, name: e.target.value }))} required />
                      </div>
                      <div className="sd-field">
                        <label className="sd-lbl">Type</label>
                        <select className="sd-select" value={procForm.type} onChange={e => setProcForm((f: any) => ({ ...f, type: e.target.value }))}>
                          {PROCEDURE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="sd-field">
                        <label className="sd-lbl">Fee (₹)</label>
                        <input className="sd-input" type="number" min="0" placeholder="0" value={procForm.fee} onChange={e => setProcForm((f: any) => ({ ...f, fee: e.target.value }))} />
                      </div>
                      <div className="sd-field">
                        <label className="sd-lbl">Duration (min)</label>
                        <input className="sd-input" type="number" min="1" placeholder="30" value={procForm.duration} onChange={e => setProcForm((f: any) => ({ ...f, duration: e.target.value }))} />
                      </div>
                      <div className="sd-field">
                        <label className="sd-lbl">Sequence</label>
                        <input className="sd-input" type="number" min="0" value={procForm.sequence} onChange={e => setProcForm((f: any) => ({ ...f, sequence: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <div className="sd-field full">
                        <label className="sd-lbl">Description</label>
                        <input className="sd-input" placeholder="Brief description..." value={procForm.description} onChange={e => setProcForm((f: any) => ({ ...f, description: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                      <button type="button" className="sd-btn-ghost" onClick={() => { setProcFormOpen(false); setEditProc(null); }}>Cancel</button>
                      <button type="submit" className="sd-btn-primary" disabled={savingProc}>
                        {savingProc && <Loader2 size={13} className="sd-spin" />}{editProc ? "Update" : "Add"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {procLoading ? (
                <div className="sd-loading"><Loader2 size={18} className="sd-spin" />Loading...</div>
              ) : procedures.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 13 }}>No procedures yet. Click "+ Add Procedure" to add one.</div>
              ) : (
                <div>
                  {procedures.map(p => (
                    deletingProc?.id === p.id ? (
                      <div key={p.id} className="sd-proc-row" style={{ background: "#fff5f5", borderColor: "#fecaca" }}>
                        <div style={{ flex: 1, fontSize: 13, color: "#ef4444" }}>Delete "{p.name}"?</div>
                        <button className="sd-btn-sm sd-btn-danger" style={{ background: "#ef4444", color: "#fff", border: "none", padding: "4px 10px", fontSize: 11 }} onClick={() => handleDeleteProc(p)} disabled={deleting}>
                          {deleting ? <Loader2 size={11} className="sd-spin" /> : null}Confirm
                        </button>
                        <button className="sd-btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setDeletingProc(null)}>Cancel</button>
                      </div>
                    ) : (
                      <ProcedureRow key={p.id} proc={p} onEdit={openEditProc} onDelete={proc => setDeletingProc(proc)} />
                    )
                  ))}
                </div>
              )}
            </div>
            <div className="sd-modal-foot">
              <button className="sd-btn-ghost" onClick={() => setProcModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewItem && (() => {
        const typeInfo = getTypeInfo(viewItem.type);
        const accentColor = viewItem.color || typeInfo.color;
        const TypeIcon = typeInfo.Icon;
        let parsedFeatures: string[] = [];
        try { parsedFeatures = viewItem.accessFeatures ? JSON.parse(viewItem.accessFeatures) : []; } catch { parsedFeatures = []; }
        return (
          <div className="sd-overlay" onClick={e => e.target === e.currentTarget && setViewItem(null)}>
            <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:660,boxShadow:"0 8px 32px rgba(0,0,0,.12)",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",animation:"sdDelFadeIn .2s ease"}}>

              {/* Header */}
              <div style={{padding:"16px 20px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:12,flexShrink:0,background:"#fff"}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <TypeIcon size={18} style={{color:accentColor}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{viewItem.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontWeight:600,color:"#64748b",background:"#f1f5f9",padding:"2px 7px",borderRadius:4,border:"1px solid #e2e8f0"}}>
                      {viewItem.type==="CUSTOM"&&viewItem.customName?viewItem.customName:typeInfo.label}
                    </span>
                    <span className={`sd-badge ${viewItem.isActive?"green":"red"}`} style={{fontSize:10}}>{viewItem.isActive?"Active":"Inactive"}</span>
                    {viewItem.code&&<span style={{fontFamily:"monospace",fontSize:10,color:"#94a3b8",background:"#f8fafc",padding:"2px 6px",borderRadius:4,border:"1px solid #e2e8f0"}}>{viewItem.code}</span>}
                  </div>
                </div>
                <button className="sd-icon-btn" onClick={()=>setViewItem(null)}><X size={15}/></button>
              </div>

              {/* Body */}
              <div style={{overflowY:"auto",flex:1,padding:"16px 20px",display:"flex",flexDirection:"column",gap:16}}>

                {/* Identity */}
                <div>
                  <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#94a3b8",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                    <Building2 size={10}/> Identity
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[
                      {label:"Name", val:viewItem.name},
                      {label:"Short Code", val:viewItem.code||"—", mono:!!viewItem.code},
                      {label:"Parent Department", val:viewItem.department?.name||"None / Independent"},
                      {label:"Accent Color", val:(
                        <span style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{width:12,height:12,borderRadius:3,background:accentColor,display:"inline-block",border:"1px solid rgba(0,0,0,.1)",flexShrink:0}}/>
                          <span style={{fontFamily:"monospace",fontSize:10,color:"#475569"}}>{accentColor}</span>
                        </span>
                      )},
                    ].map(({label,val,mono})=>(
                      <div key={label} style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                        <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{label}</div>
                        <div style={{fontSize:11,fontWeight:600,color:"#334155",fontFamily:mono?"monospace":"inherit"}}>{val}</div>
                      </div>
                    ))}
                    {viewItem.description&&(
                      <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0",gridColumn:"1/-1"}}>
                        <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Description</div>
                        <div style={{fontSize:11,color:"#475569",lineHeight:1.6}}>{viewItem.description}</div>
                      </div>
                    )}
                    {viewItem.flow&&(
                      <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0",gridColumn:"1/-1"}}>
                        <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Patient Flow / Notes</div>
                        <div style={{fontSize:11,color:"#475569",lineHeight:1.6,fontStyle:"italic"}}>{viewItem.flow}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* HOD */}
                <div>
                  <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#94a3b8",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                    <User size={10}/> Head of Department
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                      <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Name</div>
                      <div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{viewItem.hodName||<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}</div>
                    </div>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                      <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Email</div>
                      <div style={{fontSize:11,color:"#334155",wordBreak:"break-all"}}>
                        {viewItem.hodEmail?<a href={`mailto:${viewItem.hodEmail}`} style={{color:"#0E898F",textDecoration:"none",fontWeight:600}}>{viewItem.hodEmail}</a>:<span style={{color:"#cbd5e1"}}>—</span>}
                      </div>
                    </div>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                      <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Phone</div>
                      <div style={{fontSize:11,fontWeight:600,color:"#334155"}}>{viewItem.hodPhone||<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}</div>
                    </div>
                  </div>
                </div>

                {/* Credentials */}
                <div>
                  <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:"#94a3b8",marginBottom:8,display:"flex",alignItems:"center",gap:5}}>
                    <ShieldCheck size={10}/> Access & Credentials
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                      <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Login Email</div>
                      <div style={{fontSize:11,fontWeight:600,color:"#334155",wordBreak:"break-all"}}>{viewItem.loginEmail||<span style={{color:"#cbd5e1",fontWeight:400}}>Not configured</span>}</div>
                    </div>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0"}}>
                      <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Credentials</div>
                      <span className={`sd-badge ${viewItem.credentialsSent?"green":"red"}`} style={{fontSize:10}}>{viewItem.credentialsSent?"Sent":"Pending"}</span>
                    </div>
                    {parsedFeatures.length>0&&(
                      <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 11px",border:"1px solid #e2e8f0",gridColumn:"1/-1"}}>
                        <div style={{fontSize:9,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Access Features</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {parsedFeatures.map((f:string)=>(
                            <span key={f} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:"#f1f5f9",color:"#475569",border:"1px solid #e2e8f0"}}>
                              <Check size={8}/>{FEATURE_LABELS[f]||f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary strip */}
                <div style={{display:"flex",gap:0,border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
                  <div style={{flex:1,padding:"10px 14px",textAlign:"center",borderRight:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{viewItem._count?.procedures||viewItem.procedures?.length||0}</div>
                    <div style={{fontSize:9,color:"#94a3b8",marginTop:2,fontWeight:500,textTransform:"uppercase",letterSpacing:".04em"}}>Procedures</div>
                  </div>
                  <div style={{flex:1,padding:"10px 14px",textAlign:"center",borderRight:"1px solid #e2e8f0"}}>
                    <div style={{fontSize:11,fontWeight:700,color:viewItem.isActive?"#16a34a":"#ef4444",marginTop:2}}>{viewItem.isActive?"Active":"Inactive"}</div>
                    <div style={{fontSize:9,color:"#94a3b8",marginTop:2,fontWeight:500,textTransform:"uppercase",letterSpacing:".04em"}}>Status</div>
                  </div>
                  <div style={{flex:1,padding:"10px 14px",textAlign:"center"}}>
                    <div style={{fontSize:11,fontWeight:700,color:viewItem.credentialsSent?"#16a34a":"#92400e",marginTop:2}}>{viewItem.credentialsSent?"Sent":"Pending"}</div>
                    <div style={{fontSize:9,color:"#94a3b8",marginTop:2,fontWeight:500,textTransform:"uppercase",letterSpacing:".04em"}}>Credentials</div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{padding:"12px 20px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
                <button className="sd-btn-ghost" style={{padding:"7px 14px",fontSize:12}} onClick={()=>setViewItem(null)}>Close</button>
                <button className="sd-btn-primary" style={{padding:"7px 14px",fontSize:12}} onClick={()=>{openEdit(viewItem);setViewItem(null);}}>
                  <Pencil size={12}/>Edit
                </button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="sd-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="sd-del-dialog">
            <div className="sd-del-header">
              <div className="sd-del-header-icon"><ShieldAlert size={20} /></div>
              <div className="sd-del-header-text">
                <h3>Delete Sub-Department</h3>
                <p>This action cannot be undone</p>
              </div>
              <button className="sd-icon-btn" onClick={() => setDeleteTarget(null)} style={{marginLeft:"auto"}}><X size={16} /></button>
            </div>
            <div className="sd-del-body">
              <div className="sd-del-card">
                <div className="sd-del-card-icon" style={{background:(deleteTarget.color||getTypeInfo(deleteTarget.type).color)+"20"}}>
                  {(()=>{const TI=getTypeInfo(deleteTarget.type);return <TI.Icon size={18} style={{color:deleteTarget.color||TI.color}} />;})()}
                </div>
                <div>
                  <div className="sd-del-card-name">{deleteTarget.name}</div>
                  <div className="sd-del-card-meta">
                    {deleteTarget.code && <span style={{fontFamily:"monospace",fontSize:11,background:"#f1f5f9",padding:"2px 6px",borderRadius:4,color:"#64748b"}}>{deleteTarget.code}</span>}
                    <span className={`sd-badge`} style={{background:getTypeInfo(deleteTarget.type).color+"20",color:getTypeInfo(deleteTarget.type).color,border:`1px solid ${getTypeInfo(deleteTarget.type).color}40`,marginLeft:4}}>
                      {deleteTarget.type==="CUSTOM"&&deleteTarget.customName?deleteTarget.customName:getTypeInfo(deleteTarget.type).label}
                    </span>
                  </div>
                </div>
              </div>

              {(deleteTarget._count?.procedures||0) > 0 ? (
                <div className="sd-del-impact">
                  <div className="sd-del-impact-header"><AlertTriangle size={14} /><span>Impact Analysis</span></div>
                  <div className="sd-del-impact-body">
                    <p>Deleting this sub-department will permanently remove all linked resources:</p>
                    <div className="sd-del-impact-item">
                      <div className="sd-del-impact-item-icon"><Layers size={14}/></div>
                      <div style={{display:"flex",flexDirection:"column"}}>
                        <span className="sd-del-impact-item-count">{deleteTarget._count?.procedures}</span>
                        <span className="sd-del-impact-item-label">Procedure{(deleteTarget._count?.procedures||0)!==1?"s":""}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sd-del-info">
                  <Info size={16} />
                  <span>This sub-department has no linked procedures. It can be safely removed.</span>
                </div>
              )}
            </div>
            <div className="sd-del-footer">
              <button className="sd-btn-ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="sd-del-confirm-btn" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 size={14} className="sd-spin" />}
                <Trash2 size={14} />
                Delete Sub-Department
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
