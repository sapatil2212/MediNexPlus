"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, Search, X, Loader2, Check, AlertTriangle,
  ChevronLeft, ChevronRight, User, Filter, Send, Shield, ArrowLeft, Download,
  ArrowUpDown, ArrowUp, ArrowDown, Eye, CheckSquare, Square, MoreVertical, FileText, Mail, Phone, Calendar, Building2, Users, IndianRupee, Clock
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  departmentId?: string | null;
  department?: { name: string; code: string } | null;
  salary: number;
  joinDate: string;
  isActive: boolean;
  credentialsSent?: boolean;
  userId?: string | null;
  workingDays?: number;
  dateOfBirth?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  panNo?: string | null;
  pfAccountNo?: string | null;
  pfUan?: string | null;
  address?: string | null;
}

interface Department { id: string; name: string; }

interface FormData {
  name: string; email: string; phone: string; role: string;
  departmentId: string; salary: string; joinDate: string; isActive: boolean;
  workingDays: string; dateOfBirth: string; bankName: string; bankAccountNo: string;
  panNo: string; pfAccountNo: string; pfUan: string; address: string;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }
interface Toast { id: number; type: "success" | "error" | "info"; message: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  return (await fetch(url, opts)).json();
};

const STAFF_ROLES = [
  { value: "NURSE",          label: "Nurse",          color: "blue"   },
  { value: "TECHNICIAN",     label: "Technician",     color: "purple" },
  { value: "PHARMACIST",     label: "Pharmacist",     color: "green"  },
  { value: "RECEPTIONIST",   label: "Receptionist",   color: "pink"   },
  { value: "LAB_TECHNICIAN", label: "Lab Technician", color: "amber"  },
  { value: "ACCOUNTANT",     label: "Accountant",     color: "indigo" },
  { value: "ADMIN",          label: "Admin",          color: "red"    },
  { value: "SUPPORT",        label: "Support",        color: "gray"   },
  { value: "OTHER",          label: "Other",          color: "gray"   },
];

const ROLE_BADGE: Record<string, string> = {
  NURSE: "sp-badge blue", TECHNICIAN: "sp-badge purple", PHARMACIST: "sp-badge green",
  RECEPTIONIST: "sp-badge pink", LAB_TECHNICIAN: "sp-badge amber", ACCOUNTANT: "sp-badge indigo",
  ADMIN: "sp-badge red", SUPPORT: "sp-badge gray", OTHER: "sp-badge gray",
};

const AVATAR_GRAD: Record<string, string> = {
  NURSE: "linear-gradient(135deg,#B3E0E0,#B3E0E0)",
  TECHNICIAN: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
  PHARMACIST: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
  RECEPTIONIST: "linear-gradient(135deg,#fce7f3,#fbcfe8)",
  LAB_TECHNICIAN: "linear-gradient(135deg,#fef9c3,#fde68a)",
  ACCOUNTANT: "linear-gradient(135deg,#e0e7ff,#c7d2fe)",
  ADMIN: "linear-gradient(135deg,#fee2e2,#fecaca)",
  SUPPORT: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
  OTHER: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
};

const AVATAR_COLOR: Record<string, string> = {
  NURSE: "#07595D", TECHNICIAN: "#6d28d9", PHARMACIST: "#15803d",
  RECEPTIONIST: "#be185d", LAB_TECHNICIAN: "#92400e", ACCOUNTANT: "#3730a3",
  ADMIN: "#b91c1c", SUPPORT: "#475569", OTHER: "#475569",
};

const EMPTY_FORM: FormData = {
  name: "", email: "", phone: "", role: "NURSE",
  departmentId: "", salary: "0",
  joinDate: new Date().toISOString().split("T")[0],
  isActive: true,
  workingDays: "26", dateOfBirth: "", bankName: "", bankAccountNo: "",
  panNo: "", pfAccountNo: "", pfUan: "", address: "",
};

const initials = (name: string) =>
  name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const roleLabel = (role: string) => STAFF_ROLES.find(r => r.value === role)?.label || role;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes spIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes spFadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spSpin{to{transform:rotate(360deg)}}
  .sp-spin{animation:spSpin .7s linear infinite}

  /* Toasts */
  .sp-toast-container{position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
  .sp-toast{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.12);animation:spIn .3s ease;pointer-events:all;font-family:inherit}
  .sp-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
  .sp-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
  .sp-toast-info{background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
  .sp-toast-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.6;padding:0;margin-left:auto;display:flex;align-items:center}

  /* Overlay / confirm */
  .sp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
  .sp-confirm{background:#fff;border-radius:18px;padding:28px 24px;width:100%;max-width:400px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2)}

  /* Toolbar */
  .sp-toolbar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
  .sp-toolbar-left{display:flex;flex-direction:column;gap:2px}
  .sp-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px}
  .sp-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%;font-family:inherit}
  .sp-search-input::placeholder{color:#94a3b8}
  .sp-toolbar-right{display:flex;align-items:center;gap:10px}
  .sp-filter-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit}
  .sp-filter-btn.active{background:#E6F4F4;border-color:#0E898F;color:#0A6B70}
  .sp-filters{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
  .sp-filter-select{padding:8px 12px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;color:#334155;background:#fff;cursor:pointer;font-family:inherit;outline:none}
  .sp-filter-select:focus{border-color:#6ee7b7}

  /* Buttons */
  .sp-btn-primary{padding:10px 20px;border-radius:9px;border:none;background:linear-gradient(135deg,#0E898F,#0A6B70);color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(14,137,143,.28);transition:all .15s;white-space:nowrap;font-family:inherit}
  .sp-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(14,137,143,.38)}
  .sp-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
  .sp-btn-ghost{padding:10px 20px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit}
  .sp-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}
  .sp-btn-danger{padding:10px 20px;border-radius:9px;border:none;background:#ef4444;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit}
  .sp-btn-sm{padding:5px 10px;font-size:11px;border-radius:7px;border:1px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;display:flex;align-items:center;gap:4px;font-weight:500;white-space:nowrap;transition:all .12s;font-family:inherit}
  .sp-btn-sm.green{background:#f0fdf4;border-color:#bbf7d0;color:#16a34a}
  .sp-btn-sm.amber{background:#fffbeb;border-color:#fde68a;color:#b45309}
  .sp-btn-sm.amber:hover{background:#fef3c7}
  .sp-btn-sm:disabled{opacity:.5;cursor:not-allowed}
  .sp-icon-btn{width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8;transition:all .15s}
  .sp-edit{background:#E6F4F4;color:#0E898F}.sp-edit:hover{background:#B3E0E0}
  .sp-del{background:#fff5f5;color:#ef4444}.sp-del:hover{background:#fee2e2}

  /* Table */
  .sp-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
  .sp-tbl{width:100%;border-collapse:collapse}
  .sp-tbl th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
  .sp-tbl td{padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
  .sp-tbl tr:last-child td{border-bottom:none}
  .sp-tbl tbody tr:hover td{background:#fafbfc}
  .sp-staff-info{display:flex;align-items:center;gap:10px}
  .sp-avatar{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0}
  .sp-staff-name{font-weight:600;color:#1e293b;font-size:13px}
  .sp-staff-meta{font-size:11px;color:#94a3b8;margin-top:1px}
  .sp-actions{display:flex;gap:5px;align-items:center}

  /* Badges */
  .sp-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
  .sp-badge.blue{background:#E6F4F4;color:#07595D;border:1px solid #B3E0E0}
  .sp-badge.purple{background:#faf5ff;color:#6d28d9;border:1px solid #ede9fe}
  .sp-badge.green{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
  .sp-badge.pink{background:#fdf2f8;color:#be185d;border:1px solid #fbcfe8}
  .sp-badge.amber{background:#fffbeb;color:#92400e;border:1px solid #fde68a}
  .sp-badge.indigo{background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe}
  .sp-badge.red{background:#fff5f5;color:#b91c1c;border:1px solid #fecaca}
  .sp-badge.gray{background:#f8fafc;color:#475569;border:1px solid #e2e8f0}
  .sp-creds-sent{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#16a34a;font-weight:600;background:#f0fdf4;padding:4px 10px;border-radius:100px;border:1px solid #bbf7d0}

  /* Toggle */
  .sp-toggle{width:40px;height:22px;border-radius:100px;background:#e2e8f0;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
  .sp-toggle.on{background:#0E898F}
  .sp-toggle-thumb{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}
  .sp-toggle.on .sp-toggle-thumb{transform:translateX(18px)}

  /* Pagination */
  .sp-pagination{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff;border-top:1px solid #f1f5f9}
  .sp-pagination-info{font-size:13px;color:#64748b}
  .sp-pagination-btns{display:flex;gap:6px}
  .sp-page-btn{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit}
  .sp-page-btn:hover:not(:disabled){background:#f8fafc}
  .sp-page-btn:disabled{opacity:.4;cursor:not-allowed}
  .sp-page-btn.active{background:#0E898F;border-color:#0E898F;color:#fff}

  /* Loading / empty */
  .sp-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:14px}
  .sp-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:14px;background:#fff;border-radius:14px;border:1px solid #e2e8f0}
  .sp-empty-icon{width:52px;height:52px;border-radius:14px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}

  /* Form */
  .sp-form-header{display:flex;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid #f1f5f9;background:#f8fafc;border-radius:14px 14px 0 0}
  .sp-back-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:inherit}
  .sp-back-btn:hover{background:#f8fafc;border-color:#cbd5e1}
  .sp-form-title{font-size:18px;font-weight:800;color:#1e293b}
  .sp-form-subtitle{font-size:12px;color:#94a3b8;margin-top:2px}
  .sp-form-body{padding:24px;display:flex;flex-direction:column;gap:20px}
  .sp-form-footer{padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;background:#f8fafc;border-radius:0 0 14px 14px}
  .sp-section{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;animation:spFadeUp .25s ease}
  .sp-section-hd{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;color:#1e293b;padding:13px 18px;background:#f8fafc;border-bottom:1px solid #f1f5f9}
  .sp-sec-ic{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .sp-sec-ic.green{background:#E6F4F4;color:#0E898F}
  .sp-sec-ic.blue{background:#E6F4F4;color:#0E898F}
  .sp-sec-ic.purple{background:#faf5ff;color:#7c3aed}
  .sp-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:18px}
  .sp-field{display:flex;flex-direction:column;gap:5px}
  .sp-full{grid-column:1/-1}
  .sp-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
  .sp-req{color:#ef4444}
  .sp-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s;width:100%;font-family:inherit}
  .sp-input:focus{border-color:#B3E0E0;box-shadow:0 0 0 3px rgba(14,137,143,.12)}
  .sp-input::placeholder{color:#94a3b8}
  .sp-input.err{border-color:#fca5a5}
  .sp-select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;width:100%;cursor:pointer;font-family:inherit}
  .sp-select:focus{border-color:#B3E0E0}
  .sp-error{font-size:11px;color:#ef4444;margin-top:2px}
  .sp-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0}
  .sp-toggle-lbl{font-size:13px;color:#334155;font-weight:600}
  .sp-toggle-desc{font-size:11px;color:#94a3b8;margin-top:2px}

  /* Sortable Headers */
  .sp-th-sort{cursor:pointer;user-select:none;transition:color .15s}
  .sp-th-sort:hover{color:#B3E0E0}
  .sp-th-sort.active{color:#0E898F}
  .sp-th-inner{display:flex;align-items:center;gap:5px}

  /* Checkbox */
  .sp-checkbox{width:16px;height:16px;border-radius:4px;border:1.5px solid #cbd5e1;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
  .sp-checkbox.checked{background:#0E898F;border-color:#0E898F}
  .sp-checkbox:hover{border-color:#0E898F}

  /* Export Dropdown */
  .sp-export-wrap{position:relative}
  .sp-export-dd{position:absolute;top:calc(100% + 6px);right:0;background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);border:1px solid #e2e8f0;min-width:160px;z-index:50;overflow:hidden}
  .sp-export-item{display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:13px;color:#475569;cursor:pointer;transition:all .12s;font-weight:500}
  .sp-export-item:hover{background:#E6F4F4;color:#0A6B70}
  .sp-export-item.disabled{opacity:.5;cursor:not-allowed}

  /* View Modal */
  .sp-view-modal{max-width:560px;text-align:left}
  .sp-view-header{display:flex;align-items:flex-start;gap:16px;padding:20px 24px;border-bottom:1px solid #f1f5f9}
  .sp-view-avatar{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;flex-shrink:0}
  .sp-view-title{font-size:18px;font-weight:800;color:#1e293b}
  .sp-view-subtitle{font-size:12px;color:#94a3b8;margin-top:2px}
  .sp-view-body{padding:20px 24px}
  .sp-view-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .sp-view-item{display:flex;flex-direction:column;gap:4px}
  .sp-view-item-full{grid-column:1/-1}
  .sp-view-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8}
  .sp-view-val{font-size:13px;color:#334155;font-weight:500}
  .sp-view-section{padding:16px 20px;border:1px solid #e2e8f0;border-radius:12px;background:#fafbfc;margin-top:16px}
  .sp-view-section-title{font-size:12px;font-weight:700;color:#475569;margin-bottom:12px;display:flex;align-items:center;gap:6px}

  /* Professional Delete Dialog */
  .sp-pro-delete{max-width:420px;text-align:center;padding:0}
  .sp-pro-delete-header{padding:24px 24px 20px}
  .sp-pro-delete-icon{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#fef2f2,#fee2e2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
  .sp-pro-delete-title{font-size:17px;font-weight:800;color:#1e293b;margin-bottom:4}
  .sp-pro-delete-count{font-size:13px;color:#dc2626;font-weight:600;background:#fef2f2;padding:4px 12px;border-radius:100px;display:inline-block;margin-top:4}
  .sp-pro-delete-list{max-height:120px;overflow-y:auto;margin:0 24px 20px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0}
  .sp-pro-delete-item{font-size:12px;color:#475569;padding:6px 0;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px}
  .sp-pro-delete-item:last-child{border-bottom:none}
  .sp-pro-delete-msg{font-size:13px;color:#64748b;line-height:1.5;margin:0 24px 20px}
  .sp-pro-delete-footer{padding:16px 24px;background:#f8fafc;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:center;border-radius:0 0 18px 18px}

  /* Toolbar heading */
  .sp-toolbar-heading{font-size:18px;font-weight:800;color:#1e293b}
  .sp-toolbar-subheading{font-size:12px;color:#94a3b8;margin-top:2px}
`;

// ─── Sub-components ───────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="sp-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`sp-toast sp-toast-${t.type}`}>
          {t.type === "success" && <Check size={15} />}
          {t.type === "error" && <AlertTriangle size={15} />}
          <span>{t.message}</span>
          <button className="sp-toast-close" onClick={() => onRemove(t.id)}><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, message, loading = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="sp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sp-confirm">
        <div style={{ marginBottom: 14 }}><AlertTriangle size={32} color="#ef4444" /></div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="sp-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="sp-btn-danger" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={13} className="sp-spin" />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" className={`sp-toggle${checked ? " on" : ""}`} onClick={onChange}>
      <span className="sp-toggle-thumb" />
    </button>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div className={`sp-checkbox${checked ? " checked" : ""}`} onClick={onChange}>
      {checked && <Check size={10} color="#fff" />}
    </div>
  );
}

function ViewStaffModal({ staff, onClose }: { staff: Staff; onClose: () => void }) {
  return (
    <div className="sp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sp-confirm sp-view-modal">
        <div className="sp-view-header">
          <div className="sp-view-avatar"
            style={{ background: AVATAR_GRAD[staff.role] || AVATAR_GRAD.OTHER, color: AVATAR_COLOR[staff.role] || "#475569" }}>
            {initials(staff.name)}
          </div>
          <div>
            <div className="sp-view-title">{staff.name}</div>
            <div className="sp-view-subtitle">{staff.email}</div>
          </div>
        </div>
        <div className="sp-view-body">
          <div className="sp-view-grid">
            <div className="sp-view-item">
              <div className="sp-view-lbl"><Mail size={10} style={{ display: "inline", marginRight: 4 }} />Email</div>
              <div className="sp-view-val">{staff.email}</div>
            </div>
            <div className="sp-view-item">
              <div className="sp-view-lbl"><Phone size={10} style={{ display: "inline", marginRight: 4 }} />Phone</div>
              <div className="sp-view-val">{staff.phone || "—"}</div>
            </div>
            <div className="sp-view-item">
              <div className="sp-view-lbl"><Shield size={10} style={{ display: "inline", marginRight: 4 }} />Role</div>
              <div className="sp-view-val"><span className={ROLE_BADGE[staff.role] || "sp-badge gray"}>{roleLabel(staff.role)}</span></div>
            </div>
            <div className="sp-view-item">
              <div className="sp-view-lbl"><Building2 size={10} style={{ display: "inline", marginRight: 4 }} />Department</div>
              <div className="sp-view-val">{staff.department?.name || "—"}</div>
            </div>
            <div className="sp-view-item">
              <div className="sp-view-lbl"><IndianRupee size={10} style={{ display: "inline", marginRight: 4 }} />Salary</div>
              <div className="sp-view-val">₹{(staff.salary || 0).toLocaleString()}</div>
            </div>
            <div className="sp-view-item">
              <div className="sp-view-lbl"><Calendar size={10} style={{ display: "inline", marginRight: 4 }} />Join Date</div>
              <div className="sp-view-val">{staff.joinDate ? new Date(staff.joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
            </div>
            <div className="sp-view-item">
              <div className="sp-view-lbl"><Clock size={10} style={{ display: "inline", marginRight: 4 }} />Status</div>
              <div className="sp-view-val"><span className={`sp-badge ${staff.isActive ? "green" : "gray"}`}>{staff.isActive ? "Active" : "Inactive"}</span></div>
            </div>
            <div className="sp-view-item">
              <div className="sp-view-lbl"><Users size={10} style={{ display: "inline", marginRight: 4 }} />Portal Access</div>
              <div className="sp-view-val">{staff.credentialsSent ? <span className="sp-creds-sent"><Check size={10} /> Sent</span> : <span className="sp-badge amber">Pending</span>}</div>
            </div>
          </div>
        </div>
        <div className="sp-pro-delete-footer">
          <button className="sp-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ProDeleteDialog({ items, onClose, onConfirm, loading }: {
  items: Staff[]; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  if (!items.length) return null;
  const isBulk = items.length > 1;
  return (
    <div className="sp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sp-confirm sp-pro-delete">
        <div className="sp-pro-delete-header">
          <div className="sp-pro-delete-icon"><Trash2 size={24} color="#ef4444" /></div>
          <div className="sp-pro-delete-title">{isBulk ? "Delete Staff Members" : "Delete Staff Member"}</div>
          {isBulk && <div className="sp-pro-delete-count">{items.length} selected</div>}
        </div>
        {isBulk && (
          <div className="sp-pro-delete-list">
            {items.map(s => (
              <div key={s.id} className="sp-pro-delete-item">
                <div className="sp-avatar" style={{ width: 24, height: 24, fontSize: 9, background: AVATAR_GRAD[s.role] || AVATAR_GRAD.OTHER, color: AVATAR_COLOR[s.role] || "#475569" }}>{initials(s.name)}</div>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        )}
        <p className="sp-pro-delete-msg">
          {isBulk
            ? "Are you sure you want to delete these staff members? This action cannot be undone and will permanently remove their accounts."
            : `Are you sure you want to delete "${items[0].name}"? This action cannot be undone and will permanently remove their account.`}
        </p>
        <div className="sp-pro-delete-footer">
          <button className="sp-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="sp-btn-danger" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={13} className="sp-spin" />}
            {loading ? "Deleting..." : isBulk ? `Delete ${items.length} Staff` : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff Form ───────────────────────────────────────────────────────────────
function StaffForm({ editItem, departments, onSuccess, onCancel, addToast }: {
  editItem: Staff | null;
  departments: Department[];
  onSuccess: () => void;
  onCancel: () => void;
  addToast: (type: Toast["type"], msg: string) => void;
}) {
  const [form, setForm] = useState<FormData>(() =>
    editItem ? {
      name: editItem.name,
      email: editItem.email,
      phone: editItem.phone || "",
      role: editItem.role,
      departmentId: editItem.departmentId || "",
      salary: editItem.salary.toString(),
      joinDate: editItem.joinDate ? new Date(editItem.joinDate).toISOString().split("T")[0] : "",
      isActive: editItem.isActive,
      workingDays: String(editItem.workingDays ?? 26),
      dateOfBirth: editItem.dateOfBirth ? new Date(editItem.dateOfBirth).toISOString().split("T")[0] : "",
      bankName: editItem.bankName || "",
      bankAccountNo: editItem.bankAccountNo || "",
      panNo: editItem.panNo || "",
      pfAccountNo: editItem.pfAccountNo || "",
      pfUan: editItem.pfUan || "",
      address: editItem.address || "",
    } : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sf = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) e.name = "Name must be at least 2 characters";
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address";
    if (form.phone && form.phone.replace(/\D/g, "").length < 10) e.phone = "Enter at least 10 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      email: form.email.toLowerCase(),
      phone: form.phone || null,
      role: form.role,
      departmentId: form.departmentId || null,
      salary: parseFloat(form.salary) || 0,
      joinDate: form.joinDate ? new Date(form.joinDate).toISOString() : new Date().toISOString(),
      isActive: form.isActive,
      workingDays: parseInt(form.workingDays) || 26,
    };
    if (form.dateOfBirth) payload.dateOfBirth = new Date(form.dateOfBirth).toISOString();
    if (form.bankName) payload.bankName = form.bankName;
    if (form.bankAccountNo) payload.bankAccountNo = form.bankAccountNo;
    if (form.panNo) payload.panNo = form.panNo;
    if (form.pfAccountNo) payload.pfAccountNo = form.pfAccountNo;
    if (form.pfUan) payload.pfUan = form.pfUan;
    if (form.address) payload.address = form.address;
    const res = editItem
      ? await api(`/api/config/staff/${editItem.id}`, "PUT", payload)
      : await api("/api/config/staff", "POST", payload);
    setSaving(false);
    if (res.success) {
      addToast("success", editItem ? "Staff updated successfully" : "Staff member added successfully");
      onSuccess();
    } else {
      addToast("error", res.message || "Operation failed");
      if (res.errors?.code === "DUPLICATE_EMAIL") setErrors({ email: "This email already exists in this hospital" });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
      {/* Header */}
      <div className="sp-form-header">
        <button type="button" className="sp-back-btn" onClick={onCancel}>
          <ArrowLeft size={14} /> Back to Staff
        </button>
        <div>
          <div className="sp-form-title">{editItem ? "Edit Staff Member" : "Add New Staff Member"}</div>
          <div className="sp-form-subtitle">{editItem ? `Editing ${editItem.name}` : "Fill in all required information below"}</div>
        </div>
      </div>

      <div className="sp-form-body">
        {/* Section 1: Basic Info */}
        <div className="sp-section">
          <div className="sp-section-hd">
            <span className="sp-sec-ic blue"><User size={14} /></span>
            Basic Information
          </div>
          <div className="sp-grid-2">
            <div className="sp-field">
              <label className="sp-lbl">Full Name <span className="sp-req">*</span></label>
              <input className={`sp-input${errors.name ? " err" : ""}`} placeholder="e.g. Priya Sharma"
                value={form.name} onChange={e => sf("name", e.target.value)} />
              {errors.name && <span className="sp-error">{errors.name}</span>}
            </div>
            <div className="sp-field">
              <label className="sp-lbl">Email Address <span className="sp-req">*</span></label>
              <input className={`sp-input${errors.email ? " err" : ""}`} type="email"
                placeholder="staff@hospital.com" value={form.email}
                onChange={e => sf("email", e.target.value)} disabled={!!editItem} />
              {errors.email && <span className="sp-error">{errors.email}</span>}
            </div>
            <div className="sp-field">
              <label className="sp-lbl">Phone Number</label>
              <input className={`sp-input${errors.phone ? " err" : ""}`}
                placeholder="+91 98765 43210" value={form.phone}
                onChange={e => sf("phone", e.target.value)} />
              {errors.phone && <span className="sp-error">{errors.phone}</span>}
            </div>
            <div className="sp-field">
              <label className="sp-lbl">Join Date</label>
              <input className="sp-input" type="date" value={form.joinDate}
                onChange={e => sf("joinDate", e.target.value)} />
            </div>
            <div className="sp-field">
              <label className="sp-lbl">Date of Birth</label>
              <input className="sp-input" type="date" value={form.dateOfBirth}
                onChange={e => sf("dateOfBirth", e.target.value)} />
            </div>
            <div className="sp-field">
              <label className="sp-lbl">Working Days / Month</label>
              <input className="sp-input" type="number" min="1" max="31" placeholder="26"
                value={form.workingDays} onChange={e => sf("workingDays", e.target.value)} />
            </div>
            <div className="sp-field sp-full">
              <label className="sp-lbl">Address</label>
              <input className="sp-input" placeholder="Full address" value={form.address}
                onChange={e => sf("address", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 2: Role & Department */}
        <div className="sp-section">
          <div className="sp-section-hd">
            <span className="sp-sec-ic green"><Shield size={14} /></span>
            Role & Department
          </div>
          <div className="sp-grid-2">
            <div className="sp-field">
              <label className="sp-lbl">Staff Role <span className="sp-req">*</span></label>
              <select className="sp-select" value={form.role} onChange={e => sf("role", e.target.value)}>
                {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="sp-field">
              <label className="sp-lbl">Department</label>
              <select className="sp-select" value={form.departmentId} onChange={e => sf("departmentId", e.target.value)}>
                <option value="">— No Department —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="sp-field">
              <label className="sp-lbl">Monthly Salary (₹)</label>
              <input className="sp-input" type="number" min="0" step="1"
                placeholder="e.g. 35000" value={form.salary}
                onChange={e => sf("salary", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 3: Bank & PF Details */}
        <div className="sp-section">
          <div className="sp-section-hd">
            <span className="sp-sec-ic purple"><IndianRupee size={14} /></span>
            Bank & PF Details
          </div>
          <div className="sp-grid-2">
            <div className="sp-field">
              <label className="sp-lbl">Bank Name</label>
              <input className="sp-input" placeholder="e.g. State Bank of India" value={form.bankName}
                onChange={e => sf("bankName", e.target.value)} />
            </div>
            <div className="sp-field">
              <label className="sp-lbl">Bank Account No</label>
              <input className="sp-input" placeholder="Account number" value={form.bankAccountNo}
                onChange={e => sf("bankAccountNo", e.target.value)} />
            </div>
            <div className="sp-field">
              <label className="sp-lbl">PAN No</label>
              <input className="sp-input" placeholder="ABCDE1234F" value={form.panNo}
                onChange={e => sf("panNo", e.target.value)} />
            </div>
            <div className="sp-field">
              <label className="sp-lbl">PF Account No</label>
              <input className="sp-input" placeholder="PF A/c No" value={form.pfAccountNo}
                onChange={e => sf("pfAccountNo", e.target.value)} />
            </div>
            <div className="sp-field">
              <label className="sp-lbl">PF UAN</label>
              <input className="sp-input" placeholder="UAN number" value={form.pfUan}
                onChange={e => sf("pfUan", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="sp-section">
          <div className="sp-grid-2">
            <div className="sp-field sp-full">
              <div className="sp-toggle-row">
                <div>
                  <div className="sp-toggle-lbl">Account Status</div>
                  <div className="sp-toggle-desc">Toggle to activate or deactivate this staff account</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className={`sp-badge ${form.isActive ? "green" : "gray"}`}>
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                  <StatusToggle checked={form.isActive} onChange={() => sf("isActive", !form.isActive)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sp-form-footer">
        <button type="button" className="sp-btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="sp-btn-primary" disabled={saving}>
          {saving && <Loader2 size={13} className="sp-spin" />}
          {saving ? "Saving..." : editItem ? "Update Staff" : "Create Staff Member"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function StaffPanel() {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editItem, setEditItem] = useState<Staff | null>(null);
  const [deleteItem, setDeleteItem] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sendingCreds, setSendingCreds] = useState<string | null>(null);
  const [resendingCreds, setResendingCreds] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [bulkSending, setBulkSending] = useState(false);

  // Selection & Sorting State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof Staff | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [viewStaff, setViewStaff] = useState<Staff | null>(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<Staff[] | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const handleBulkSendCredentials = async () => {
    if (!confirm("Send credentials to all staff who haven't received them yet?")) return;
    setBulkSending(true);
    try {
      const res = await fetch("/api/config/staff/send-credentials-bulk", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) { addToast("success", data.message || "Bulk credentials sent"); load(); }
      else addToast("error", data.message || "Bulk send failed");
    } catch {
      addToast("error", "Failed to send bulk credentials");
    }
    setBulkSending(false);
  };

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(filterRole && { role: filterRole }),
        ...(filterDept && { departmentId: filterDept }),
        ...(filterStatus && { isActive: filterStatus }),
      });
      const res = await api(`/api/config/staff?${params}`);
      if (res.success) { setStaff(res.data.data || []); setPagination(res.data.pagination); }
      else addToast("error", res.message || "Failed to fetch staff");
    } catch { addToast("error", "Failed to fetch staff"); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, search, filterRole, filterDept, filterStatus, addToast]);

  const loadDepts = useCallback(async () => {
    try {
      const res = await api("/api/config/departments?simple=true");
      if (res.success) setDepartments(res.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadDepts(); }, [loadDepts]);

  // Click outside to close export dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Selection Helpers ──
  const handleSelectAll = () => {
    if (selectedIds.size === staff.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(staff.map(s => s.id)));
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // ── Sorting Helpers ──
  const handleSort = (field: keyof Staff) => {
    if (sortField === field) setSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  const getSortedStaff = useCallback(() => {
    if (!sortField) return staff;
    return [...staff].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal! < bVal!) return sortDirection === "asc" ? -1 : 1;
      if (aVal! > bVal!) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [staff, sortField, sortDirection]);

  // ── Export Helpers ──
  const exportToCSV = (data: Staff[], filename: string) => {
    const headers = ["Name", "Email", "Phone", "Role", "Department", "Salary", "Join Date", "Status", "Credentials Sent"];
    const rows = data.map(s => [
      s.name,
      s.email,
      s.phone || "",
      roleLabel(s.role),
      s.department?.name || "",
      s.salary?.toString() || "0",
      s.joinDate ? new Date(s.joinDate).toLocaleDateString() : "",
      s.isActive ? "Active" : "Inactive",
      s.credentialsSent ? "Yes" : "No"
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    exportToCSV(staff, `staff_${new Date().toISOString().split("T")[0]}.csv`);
    setShowExportDropdown(false);
  };

  const handleExportSelected = () => {
    const selected = staff.filter(s => selectedIds.has(s.id));
    exportToCSV(selected, `staff_selected_${new Date().toISOString().split("T")[0]}.csv`);
    setShowExportDropdown(false);
  };

  // ── Bulk Delete ──
  const handleBulkDelete = async () => {
    if (!bulkDeleteItems || bulkDeleteItems.length === 0) return;
    setDeleting(true);
    let successCount = 0;
    for (const item of bulkDeleteItems) {
      const res = await api(`/api/config/staff/${item.id}`, "DELETE");
      if (res.success) successCount++;
    }
    setDeleting(false);
    setBulkDeleteItems(null);
    setSelectedIds(new Set());
    addToast("success", `${successCount} staff member${successCount !== 1 ? "s" : ""} deleted`);
    load();
  };

  const handleToggleActive = async (member: Staff) => {
    const res = await api(`/api/config/staff/${member.id}`, "PATCH", { isActive: !member.isActive });
    if (res.success) { addToast("success", `${member.name} ${!member.isActive ? "activated" : "deactivated"}`); load(); }
    else addToast("error", res.message || "Failed to update status");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    const res = await api(`/api/config/staff/${deleteItem.id}`, "DELETE");
    setDeleting(false);
    if (res.success) { addToast("success", "Staff member deleted"); setDeleteItem(null); load(); }
    else addToast("error", res.message || "Delete failed");
  };

  const handleSendCredentials = async (member: Staff) => {
    setSendingCreds(member.id);
    const res = await api(`/api/config/staff/${member.id}/send-credentials`, "POST");
    setSendingCreds(null);
    if (res.success) { addToast("success", `Credentials sent to ${member.email}`); load(); }
    else addToast("error", res.message || "Failed to send credentials");
  };

  const handleResendCredentials = async (member: Staff) => {
    setResendingCreds(member.id);
    const res = await api(`/api/config/staff/${member.id}/send-credentials?resend=true`, "POST");
    setResendingCreds(null);
    if (res.success) { addToast("success", `New credentials resent to ${member.email}`); }
    else addToast("error", res.message || "Failed to resend credentials");
  };

  const goToPage = (page: number) => setPagination(p => ({ ...p, page }));

  // ── Form views ──
  if (view === "add" || view === "edit") {
    return (
      <>
        <style>{CSS}</style>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <StaffForm
          editItem={view === "edit" ? editItem : null}
          departments={departments}
          addToast={addToast}
          onCancel={() => { setView("list"); setEditItem(null); }}
          onSuccess={() => { setView("list"); setEditItem(null); load(); }}
        />
      </>
    );
  }

  // ── List view ──
  return (
    <>
      <style>{CSS}</style>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Toolbar */}
      <div className="sp-toolbar">
        <div className="sp-toolbar-left">
          <div className="sp-toolbar-heading">Staff Members</div>
          <div className="sp-toolbar-subheading">Manage your hospital staff and their access</div>
        </div>
        <div className="sp-toolbar-right">
          <div className="sp-search-wrap">
            <Search size={14} color="#94a3b8" />
            <input className="sp-search-input" placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} />
            {search && <button className="sp-icon-btn" style={{ flexShrink: 0 }} onClick={() => setSearch("")}><X size={13} /></button>}
          </div>
          <button className={`sp-filter-btn${showFilters ? " active" : ""}`} onClick={() => setShowFilters(s => !s)}>
            <Filter size={14} /> Filters {(filterRole || filterDept || filterStatus) ? `(${[filterRole, filterDept, filterStatus].filter(Boolean).length})` : ""}
          </button>
          <div className="sp-export-wrap" ref={exportDropdownRef}>
            <button
              className="sp-btn-ghost"
              onClick={() => setShowExportDropdown(d => !d)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Download size={14} /> Export
            </button>
            {showExportDropdown && (
              <div className="sp-export-dd">
                <div className="sp-export-item" onClick={handleExportAll}>
                  <FileText size={14} /> Export All ({staff.length})
                </div>
                <div className={`sp-export-item${selectedIds.size === 0 ? " disabled" : ""}`}
                  onClick={selectedIds.size > 0 ? handleExportSelected : undefined}>
                  <CheckSquare size={14} /> Export Selected ({selectedIds.size})
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleBulkSendCredentials}
            disabled={bulkSending}
            title="Send credentials to all staff who haven\'t received them"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #dbeafe", background: bulkSending ? "#f1f5f9" : "#eff6ff", color: bulkSending ? "#94a3b8" : "#2563eb", fontSize: 13, fontWeight: 600, cursor: bulkSending ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
          >
            {bulkSending ? <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> : <Send size={13} />}
            Send All
          </button>
          {selectedIds.size > 0 && (
            <button
              className="sp-btn-danger"
              onClick={() => setBulkDeleteItems(staff.filter(s => selectedIds.has(s.id)))}
            >
              <Trash2 size={13} /> Delete ({selectedIds.size})
            </button>
          )}
          <button className="sp-btn-primary" onClick={() => setView("add")}>
            <Plus size={14} /> Add Staff
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="sp-filters">
          <select className="sp-filter-select" value={filterRole}
            onChange={e => { setFilterRole(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
            <option value="">All Roles</option>
            {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select className="sp-filter-select" value={filterDept}
            onChange={e => { setFilterDept(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="sp-filter-select" value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {(filterRole || filterDept || filterStatus) && (
            <button className="sp-btn-ghost" style={{ padding: "8px 12px" }}
              onClick={() => { setFilterRole(""); setFilterDept(""); setFilterStatus(""); }}>
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Table / Empty / Loading */}
      {loading ? (
        <div className="sp-loading"><Loader2 size={20} className="sp-spin" /> Loading staff members...</div>
      ) : staff.length === 0 ? (
        <div className="sp-empty">
          <div className="sp-empty-icon"><User size={24} color="#94a3b8" /></div>
          <div style={{ fontWeight: 600, color: "#475569", marginBottom: 4 }}>No staff members found</div>
          <div>Click "+ Add Staff" to create your first staff member.</div>
        </div>
      ) : (
        <div className="sp-tbl-wrap">
          <table className="sp-tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}><Checkbox checked={selectedIds.size === staff.length && staff.length > 0} onChange={handleSelectAll} /></th>
                <th className={`sp-th-sort${sortField === "name" ? " active" : ""}`} onClick={() => handleSort("name")}>
                  <div className="sp-th-inner">Staff Member {sortField === "name" && (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                </th>
                <th className={`sp-th-sort${sortField === "role" ? " active" : ""}`} onClick={() => handleSort("role")}>
                  <div className="sp-th-inner">Role {sortField === "role" && (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                </th>
                <th>Department</th>
                <th className={`sp-th-sort${sortField === "salary" ? " active" : ""}`} onClick={() => handleSort("salary")}>
                  <div className="sp-th-inner">Salary / Joined {sortField === "salary" && (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                </th>
                <th className={`sp-th-sort${sortField === "isActive" ? " active" : ""}`} onClick={() => handleSort("isActive")}>
                  <div className="sp-th-inner">Status {sortField === "isActive" && (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                </th>
                <th>Portal Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedStaff().map(member => (
                <tr key={member.id}>
                  <td><Checkbox checked={selectedIds.has(member.id)} onChange={() => handleSelectOne(member.id)} /></td>
                  <td>
                    <div className="sp-staff-info">
                      <div className="sp-avatar"
                        style={{ background: AVATAR_GRAD[member.role] || AVATAR_GRAD.OTHER, color: AVATAR_COLOR[member.role] || "#475569" }}>
                        {initials(member.name)}
                      </div>
                      <div>
                        <div className="sp-staff-name">{member.name}</div>
                        <div className="sp-staff-meta">{member.email}</div>
                        {member.phone && <div className="sp-staff-meta">{member.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={ROLE_BADGE[member.role] || "sp-badge gray"}>
                      {roleLabel(member.role)}
                    </span>
                  </td>
                  <td style={{ color: member.department ? "#1e293b" : "#94a3b8" }}>
                    {member.department?.name || "—"}
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>₹{(member.salary || 0).toLocaleString()}</div>
                    <div className="sp-staff-meta">
                      {member.joinDate ? new Date(member.joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`sp-badge ${member.isActive ? "green" : "gray"}`}>
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                      <StatusToggle checked={member.isActive} onChange={() => handleToggleActive(member)} />
                    </div>
                  </td>
                  <td>
                    {member.credentialsSent ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span className="sp-creds-sent"><Check size={11} /> Sent</span>
                        <button className="sp-btn-sm" disabled={resendingCreds === member.id}
                          style={{ borderColor: "#B3E0E0", background: "#E6F4F4", color: "#0A6B70" }}
                          onClick={() => handleResendCredentials(member)}>
                          {resendingCreds === member.id
                            ? <><Loader2 size={11} className="sp-spin" /> Resending...</>
                            : <><Send size={11} /> Resend</>}
                        </button>
                      </div>
                    ) : (
                      <button className="sp-btn-sm amber" disabled={sendingCreds === member.id}
                        onClick={() => handleSendCredentials(member)}>
                        {sendingCreds === member.id
                          ? <><Loader2 size={11} className="sp-spin" /> Sending...</>
                          : <><Send size={11} /> Send Credentials</>}
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="sp-actions">
                      <button className="sp-icon-btn" style={{ background: "#eff6ff", color: "#2563eb" }} title="View Details" onClick={() => setViewStaff(member)}>
                        <Eye size={13} />
                      </button>
                      <button className="sp-icon-btn sp-edit" title="Edit" onClick={() => { setEditItem(member); setView("edit"); }}>
                        <Pencil size={13} />
                      </button>
                      <button className="sp-icon-btn sp-del" title="Delete" onClick={() => setDeleteItem(member)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="sp-pagination">
            <div className="sp-pagination-info">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} staff members
            </div>
            <div className="sp-pagination-btns">
              <button className="sp-page-btn" disabled={pagination.page === 1} onClick={() => goToPage(pagination.page - 1)}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: "0 4px", color: "#94a3b8" }}>…</span>}
                    <button className={`sp-page-btn${pagination.page === p ? " active" : ""}`} onClick={() => goToPage(p)}>{p}</button>
                  </span>
                ))}
              <button className="sp-page-btn" disabled={pagination.page === pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Staff Modal */}
      {viewStaff && <ViewStaffModal staff={viewStaff} onClose={() => setViewStaff(null)} />}

      {/* Single Delete Dialog */}
      {deleteItem && (
        <ProDeleteDialog
          items={[deleteItem]}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}

      {/* Bulk Delete Dialog */}
      {bulkDeleteItems && (
        <ProDeleteDialog
          items={bulkDeleteItems}
          onClose={() => setBulkDeleteItems(null)}
          onConfirm={handleBulkDelete}
          loading={deleting}
        />
      )}
    </>
  );
}
