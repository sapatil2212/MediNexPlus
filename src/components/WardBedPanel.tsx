"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, Check, AlertTriangle,
  BedDouble, Building2, ChevronRight, ArrowLeft, Filter,
  Search, Users, Activity, Wrench, Lock, RefreshCw,
  LayoutGrid, List, Layers, UserPlus, LogOut, MoreVertical,
  Zap, ClipboardList, Home, Download, FileText, CheckSquare,
  ArrowUp, ArrowDown, Eye, MapPin, Calendar, IndianRupee
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Ward {
  id: string; hospitalId: string; name: string; type: string;
  floor?: string | null; description?: string | null; isActive: boolean;
  createdAt: string; updatedAt: string;
  rooms?: Room[];
  beds?: { id: string; status: string }[];
  _count?: { rooms: number; beds: number };
  stats?: { total: number; available: number; occupied: number; maintenance: number; reserved: number };
}

interface Room {
  id: string; wardId: string; hospitalId: string;
  roomNumber: string; roomType: string; capacity: number;
  description?: string | null; isActive: boolean;
  ward?: { name: string; type: string };
  beds?: Bed[];
  _count?: { beds: number };
}

interface Bed {
  id: string; wardId: string; roomId?: string | null; hospitalId: string;
  bedNumber: string; bedType: string; status: string; pricePerDay: number;
  ward?: { name: string; type: string };
  room?: { roomNumber: string };
  allocations?: Allocation[];
}

interface Allocation {
  id: string; bedId: string; hospitalId: string;
  patientName: string; patientAge?: number | null;
  patientGender?: string | null; patientPhone?: string | null;
  attendantName?: string | null; attendantPhone?: string | null;
  diagnosis?: string | null; admittingDoctorName?: string | null;
  admissionDate: string; expectedDischargeDate?: string | null;
  actualDischargeDate?: string | null; notes?: string | null;
  status: string;
}

interface Toast { id: number; type: "success" | "error" | "info"; message: string; }
interface Department { id: string; name: string; }
interface DoctorOption { id: string; name: string; specialization?: string; departmentId?: string; department?: { id: string; name: string }; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  return (await fetch(url, opts)).json();
};

const WARD_TYPES = ["GENERAL","PRIVATE","SEMI_PRIVATE","ICU","NICU","PICU","EMERGENCY","MATERNITY","ISOLATION"];
const ROOM_TYPES = ["SHARED","PRIVATE","SEMI_PRIVATE","ICU","ISOLATION"];
const BED_TYPES  = ["NORMAL","ICU","VENTILATOR","ELECTRIC","PEDIATRIC"];

const WARD_TYPE_COLOR: Record<string, string> = {
  ICU: "#ef4444", NICU: "#ec4899", PICU: "#f97316",
  EMERGENCY: "#dc2626", GENERAL: "#0E898F", PRIVATE: "#8b5cf6",
  SEMI_PRIVATE: "#6366f1", MATERNITY: "#ec4899", ISOLATION: "#f59e0b",
};

const BED_STATUS_CONFIG: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  AVAILABLE:   { label: "Available",   bg: "#f0fdf4", border: "#86efac", text: "#15803d", dot: "#22c55e" },
  OCCUPIED:    { label: "Occupied",    bg: "#fff5f5", border: "#fca5a5", text: "#b91c1c", dot: "#ef4444" },
  MAINTENANCE: { label: "Maintenance", bg: "#fffbeb", border: "#fcd34d", text: "#92400e", dot: "#f59e0b" },
  RESERVED:    { label: "Reserved",    bg: "#f5f3ff", border: "#c4b5fd", text: "#5b21b6", dot: "#8b5cf6" },
};

const BED_TYPE_LABEL: Record<string, string> = {
  NORMAL: "Normal", ICU: "ICU", VENTILATOR: "Ventilator", ELECTRIC: "Electric", PEDIATRIC: "Pediatric",
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes wbFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes wbIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes wbSpin{to{transform:rotate(360deg)}}
  @keyframes wbPulse{0%,100%{opacity:1}50%{opacity:.4}}
  .wb-spin{animation:wbSpin .7s linear infinite}
  .wb-pulse{animation:wbPulse 2s ease infinite}

  /* Toasts */
  .wb-toast-container{position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
  .wb-toast{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.15);animation:wbIn .3s ease;pointer-events:all;font-family:inherit;min-width:280px}
  .wb-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #86efac}
  .wb-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fca5a5}
  .wb-toast-info{background:#E6F4F4;color:#0A6B70;border:1px solid #80CCCC}
  .wb-toast-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.6;padding:0;margin-left:auto;display:flex;align-items:center}

  /* Overlay */
  .wb-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}
  .wb-modal{background:#fff;border-radius:18px;width:100%;max-width:520px;box-shadow:0 24px 64px rgba(0,0,0,.18);animation:wbFadeUp .25s ease;max-height:90vh;overflow-y:auto}
  .wb-modal-lg{max-width:680px}
  .wb-modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f1f5f9}
  .wb-modal-title{font-size:16px;font-weight:800;color:#1e293b}
  .wb-modal-body{padding:24px;display:flex;flex-direction:column;gap:16px}
  .wb-modal-foot{padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:10px;background:#f8fafc;border-radius:0 0 18px 18px}

  /* Buttons */
  .wb-btn{padding:10px 20px;border-radius:9px;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap;font-family:inherit}
  .wb-btn-primary{background:linear-gradient(135deg,#0E898F,#0A6B70);color:#fff;box-shadow:0 4px 12px rgba(59,130,246,.28)}
  .wb-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(59,130,246,.38)}
  .wb-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
  .wb-btn-green{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 4px 12px rgba(16,185,129,.28)}
  .wb-btn-green:hover{transform:translateY(-1px)}
  .wb-btn-green:disabled{opacity:.55;cursor:not-allowed;transform:none}
  .wb-btn-red{background:#ef4444;color:#fff}
  .wb-btn-red:hover{background:#dc2626}
  .wb-btn-red:disabled{opacity:.55;cursor:not-allowed}
  .wb-btn-ghost{background:#fff;border:1.5px solid #e2e8f0;color:#64748b}
  .wb-btn-ghost:hover{background:#f8fafc;border-color:#cbd5e1}
  .wb-btn-sm{padding:6px 12px;font-size:11px;border-radius:7px;font-weight:600}
  .wb-icon-btn{width:30px;height:30px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;font-family:inherit}
  .wb-icon-btn-blue{background:#E6F4F4;color:#0E898F}.wb-icon-btn-blue:hover{background:#B3E0E0}
  .wb-icon-btn-red{background:#fff5f5;color:#ef4444}.wb-icon-btn-red:hover{background:#fee2e2}
  .wb-icon-btn-gray{background:#f1f5f9;color:#64748b}.wb-icon-btn-gray:hover{background:#e2e8f0}

  /* Toolbar */
  .wb-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:20px}
  .wb-toolbar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .wb-toolbar-right{display:flex;align-items:center;gap:8px}
  .wb-search{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 13px;min-width:220px}
  .wb-search input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%;font-family:inherit}
  .wb-search input::placeholder{color:#94a3b8}

  /* Breadcrumb */
  .wb-breadcrumb{display:flex;align-items:center;gap:8px;margin-bottom:18px;font-size:13px;flex-wrap:wrap}
  .wb-bc-item{color:#94a3b8;cursor:pointer;font-weight:500;display:flex;align-items:center;gap:4px;transition:color .15s}
  .wb-bc-item:hover{color:#0E898F}
  .wb-bc-sep{color:#cbd5e1;font-size:11px}
  .wb-bc-cur{color:#1e293b;font-weight:700}

  /* Stats bar */
  .wb-stats-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
  .wb-stat-chip{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;font-size:12px;font-weight:600;border:1px solid transparent}
  .wb-stat-total{background:#E6F4F4;color:#0A6B70;border-color:#B3E0E0}
  .wb-stat-available{background:#f0fdf4;color:#16a34a;border-color:#86efac}
  .wb-stat-occupied{background:#fff5f5;color:#b91c1c;border-color:#fca5a5}
  .wb-stat-maintenance{background:#fffbeb;color:#92400e;border-color:#fcd34d}
  .wb-stat-reserved{background:#f5f3ff;color:#5b21b6;border-color:#c4b5fd}

  /* Ward Cards */
  .wb-ward-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;animation:wbFadeUp .25s ease}
  .wb-ward-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.05);overflow:hidden;transition:all .2s;cursor:pointer}
  .wb-ward-card:hover{box-shadow:0 8px 24px rgba(0,0,0,.1);transform:translateY(-2px);border-color:#B3E0E0}
  .wb-ward-card-head{padding:18px 18px 14px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  .wb-ward-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .wb-ward-name{font-size:15px;font-weight:800;color:#1e293b;margin-bottom:3px}
  .wb-ward-meta{font-size:11px;color:#94a3b8}
  .wb-ward-badge{padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;background:#f1f5f9;color:#475569}
  .wb-ward-stats{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #f1f5f9}
  .wb-ws-item{text-align:center;padding:10px 6px;border-right:1px solid #f1f5f9}
  .wb-ws-item:last-child{border-right:none}
  .wb-ws-val{font-size:16px;font-weight:800;color:#1e293b}
  .wb-ws-lbl{font-size:10px;color:#94a3b8;margin-top:1px;font-weight:500}
  .wb-ward-foot{padding:10px 18px;background:#f8fafc;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f1f5f9}

  /* Room Cards */
  .wb-room-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;animation:wbFadeUp .25s ease}
  .wb-room-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden;transition:all .2s;cursor:pointer}
  .wb-room-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.09);transform:translateY(-2px);border-color:#80CCCC}
  .wb-room-head{padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between}
  .wb-room-no{font-size:16px;font-weight:800;color:#1e293b}
  .wb-room-type{font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;background:#E6F4F4;color:#0A6B70;border:1px solid #B3E0E0}
  .wb-room-beds-strip{display:flex;gap:4px;padding:8px 16px;flex-wrap:wrap;min-height:36px;align-items:center}
  .wb-mini-bed{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;border:1px solid transparent;transition:all .15s}
  .wb-room-foot{padding:8px 16px;background:#f8fafc;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f1f5f9;font-size:11px;color:#64748b}

  /* Bed Cards */
  .wb-bed-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;animation:wbFadeUp .25s ease}
  .wb-bed-card{border-radius:14px;border:1.5px solid;overflow:hidden;transition:all .2s;position:relative}
  .wb-bed-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.1);transform:translateY(-2px)}
  .wb-bed-head{padding:14px 14px 10px;display:flex;align-items:flex-start;justify-content:space-between}
  .wb-bed-num{font-size:15px;font-weight:800;color:#1e293b}
  .wb-bed-type-lbl{font-size:10px;font-weight:600;color:#94a3b8;margin-top:2px}
  .wb-bed-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:3px}
  .wb-bed-status-lbl{font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;display:inline-flex;align-items:center;gap:5px}
  .wb-bed-patient{padding:0 14px 10px;font-size:12px;color:#334155}
  .wb-bed-patient-name{font-weight:700;color:#1e293b;margin-bottom:2px;font-size:13px}
  .wb-bed-actions{padding:10px 12px;border-top:1px solid rgba(0,0,0,.06);display:flex;gap:6px;flex-wrap:wrap}

  /* Form fields */
  .wb-field{display:flex;flex-direction:column;gap:5px}
  .wb-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .wb-full{grid-column:1/-1}
  .wb-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
  .wb-req{color:#ef4444}
  .wb-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;transition:border-color .2s;width:100%;font-family:inherit}
  .wb-input:focus{border-color:#80CCCC;box-shadow:0 0 0 3px rgba(147,197,253,.18)}
  .wb-input::placeholder{color:#94a3b8}
  .wb-input.err{border-color:#fca5a5}
  .wb-textarea{resize:vertical;min-height:72px}
  .wb-select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;width:100%;cursor:pointer;font-family:inherit}
  .wb-select:focus{border-color:#80CCCC}
  .wb-error{font-size:11px;color:#ef4444}

  /* Section header */
  .wb-sec-hd{display:flex;align-items:center;gap:10px;margin-bottom:16px}
  .wb-sec-ic{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .wb-sec-title{font-size:16px;font-weight:800;color:#1e293b}
  .wb-sec-count{font-size:12px;font-weight:600;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:100px}

  /* Empty / loading */
  .wb-loading{display:flex;align-items:center;justify-content:center;gap:12px;padding:80px;color:#94a3b8;font-size:14px}
  .wb-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:13px;background:#fff;border-radius:14px;border:1.5px dashed #e2e8f0}
  .wb-empty-icon{width:56px;height:56px;border-radius:16px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}

  /* Badge */
  .wb-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;border:1px solid}
  .wb-badge-blue{background:#E6F4F4;color:#0A6B70;border-color:#B3E0E0}
  .wb-badge-green{background:#f0fdf4;color:#16a34a;border-color:#86efac}
  .wb-badge-red{background:#fff5f5;color:#b91c1c;border-color:#fca5a5}
  .wb-badge-gray{background:#f8fafc;color:#475569;border-color:#e2e8f0}
  .wb-badge-amber{background:#fffbeb;color:#92400e;border-color:#fcd34d}

  /* Setup guide */
  .wb-setup-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.04)}
  .wb-setup-steps{display:flex;gap:0;margin:24px 0;align-items:stretch;flex-wrap:wrap}
  .wb-step{flex:1;min-width:160px;padding:20px 16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center;position:relative}
  .wb-step-num{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#0E898F,#0A6B70);color:#fff;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 8px}
  .wb-step-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:4px}
  .wb-step-desc{font-size:11px;color:#94a3b8}
  .wb-step-arr{display:flex;align-items:center;padding:0 6px;color:#94a3b8}

  /* Allocate confirm */
  .wb-confirm{background:#fff;border-radius:18px;padding:28px 24px;width:100%;max-width:400px;text-align:center}
  .wb-divider{height:1px;background:#f1f5f9;margin:16px 0}

  /* Toolbar heading */
  .wb-toolbar-heading{font-size:18px;font-weight:800;color:#1e293b}
  .wb-toolbar-subheading{font-size:12px;color:#94a3b8;margin-top:2px}
  .wb-toolbar-left-col{display:flex;flex-direction:column;gap:2px}

  /* Checkbox */
  .wb-checkbox{width:16px;height:16px;border-radius:4px;border:1.5px solid #cbd5e1;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
  .wb-checkbox.checked{background:#10b981;border-color:#10b981}
  .wb-checkbox:hover{border-color:#10b981}

  /* Export Dropdown */
  .wb-export-wrap{position:relative}
  .wb-export-dd{position:absolute;top:calc(100% + 6px);right:0;background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);border:1px solid #e2e8f0;min-width:160px;z-index:50;overflow:hidden}
  .wb-export-item{display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:13px;color:#475569;cursor:pointer;transition:all .12s;font-weight:500}
  .wb-export-item:hover{background:#f0fdf4;color:#059669}
  .wb-export-item.disabled{opacity:.5;cursor:not-allowed}

  /* Professional Delete Dialog */
  .wb-pro-delete{max-width:420px;text-align:center;padding:0}
  .wb-pro-delete-header{padding:24px 24px 20px}
  .wb-pro-delete-icon{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#fef2f2,#fee2e2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
  .wb-pro-delete-title{font-size:17px;font-weight:800;color:#1e293b;margin-bottom:4px}
  .wb-pro-delete-count{font-size:13px;color:#dc2626;font-weight:600;background:#fef2f2;padding:4px 12px;border-radius:100px;display:inline-block;margin-top:4px}
  .wb-pro-delete-list{max-height:120px;overflow-y:auto;margin:0 24px 20px;padding:12px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0}
  .wb-pro-delete-item{font-size:12px;color:#475569;padding:6px 0;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px}
  .wb-pro-delete-item:last-child{border-bottom:none}
  .wb-pro-delete-msg{font-size:13px;color:#64748b;line-height:1.5;margin:0 24px 20px}
  .wb-pro-delete-footer{padding:16px 24px;background:#f8fafc;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:center;border-radius:0 0 18px 18px}

  /* Ward card with checkbox */
  .wb-ward-card-wrapper{position:relative}
  .wb-ward-card-checkbox{position:absolute;top:12px;left:12px;z-index:10}
  .wb-ward-card.selected{border-color:#10b981;box-shadow:0 0 0 2px rgba(16,185,129,.2)}

  /* Room card with checkbox */
  .wb-room-card-wrapper{position:relative}
  .wb-room-card-checkbox{position:absolute;top:10px;left:10px;z-index:10}
  .wb-room-card.selected{border-color:#10b981;box-shadow:0 0 0 2px rgba(16,185,129,.2)}

  /* Bed card with checkbox */
  .wb-bed-card-wrapper{position:relative}
  .wb-bed-card-checkbox{position:absolute;top:10px;left:10px;z-index:10}
  .wb-bed-card.selected{border-color:#10b981;box-shadow:0 0 0 2px rgba(16,185,129,.2)}
`;

// ─── Sub-components ───────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="wb-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`wb-toast wb-toast-${t.type}`}>
          {t.type === "success" && <Check size={14} />}
          {t.type === "error" && <AlertTriangle size={14} />}
          <span>{t.message}</span>
          <button className="wb-toast-close" onClick={() => onRemove(t.id)}><X size={12} /></button>
        </div>
      ))}
    </div>
  );
}

function ModalWrap({ open, onClose, title, size, children }: {
  open: boolean; onClose: () => void; title: string; size?: "lg"; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="wb-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`wb-modal${size === "lg" ? " wb-modal-lg" : ""}`}>
        <div className="wb-modal-head">
          <span className="wb-modal-title">{title}</span>
          <button className="wb-icon-btn wb-icon-btn-gray" onClick={onClose}><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Checkbox Component ─────────────────────────────────────────────────────
function WbCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div className={`wb-checkbox${checked ? " checked" : ""}`} onClick={onChange}>
      {checked && <Check size={10} color="#fff" />}
    </div>
  );
}

// ─── Professional Delete Dialog ──────────────────────────────────────────────
function ProDeleteDialog({ open, type, items, onClose, onConfirm, loading }: {
  open: boolean; type: "ward" | "room" | "bed"; items: any[];
  onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  if (!open || !items.length) return null;
  const isBulk = items.length > 1;
  const getName = (item: any) => item.name || item.roomNumber || item.bedNumber;
  const getIcon = (item: any) => {
    if (type === "ward") return <BedDouble size={10} color={WARD_TYPE_COLOR[item.type] || "#0E898F"} />;
    if (type === "room") return <Building2 size={10} color="#0E898F" />;
    return <BedDouble size={10} color="#94a3b8" />;
  };
  return (
    <div className="wb-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wb-confirm wb-pro-delete">
        <div className="wb-pro-delete-header">
          <div className="wb-pro-delete-icon"><Trash2 size={24} color="#ef4444" /></div>
          <div className="wb-pro-delete-title">{isBulk ? `Delete ${items.length} ${type}s` : `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`}</div>
          {isBulk && <div className="wb-pro-delete-count">{items.length} selected</div>}
        </div>
        {isBulk && (
          <div className="wb-pro-delete-list">
            {items.map(item => (
              <div key={item.id} className="wb-pro-delete-item">
                <div style={{ width: 20, height: 20, borderRadius: 5, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>{getIcon(item)}</div>
                <span>{getName(item)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="wb-pro-delete-msg">
          {isBulk
            ? `Are you sure you want to delete these ${items.length} ${type}s? ${type === "ward" ? "All rooms and beds inside will also be deleted." : type === "room" ? "All beds inside will also be deleted." : ""} This action cannot be undone.`
            : `Are you sure you want to delete "${getName(items[0])}"? ${type === "ward" ? "All rooms and beds inside will also be deleted." : type === "room" ? "All beds inside will also be deleted." : ""} This action cannot be undone.`}
        </p>
        <div className="wb-pro-delete-footer">
          <button className="wb-btn wb-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="wb-btn wb-btn-red" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={13} className="wb-spin" />}
            {loading ? "Deleting..." : isBulk ? `Delete ${items.length}` : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ward Modal ───────────────────────────────────────────────────────────────
function WardModal({ open, onClose, editItem, onSuccess, addToast }: {
  open: boolean; onClose: () => void; editItem: Ward | null;
  onSuccess: () => void; addToast: (t: Toast["type"], m: string) => void;
}) {
  const [form, setForm] = useState({ name: "", type: "GENERAL", floor: "", description: "" });
  const [saving, setSaving] = useState(false);
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (editItem) setForm({ name: editItem.name, type: editItem.type, floor: editItem.floor || "", description: editItem.description || "" });
    else setForm({ name: "", type: "GENERAL", floor: "", description: "" });
  }, [editItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const res = editItem
      ? await api(`/api/config/wards/${editItem.id}`, "PUT", { ...form, floor: form.floor || null, description: form.description || null })
      : await api("/api/config/wards", "POST", { ...form, floor: form.floor || null, description: form.description || null });
    setSaving(false);
    if (res.success) { addToast("success", editItem ? "Ward updated" : "Ward created"); onSuccess(); }
    else addToast("error", res.message || "Failed");
  };

  return (
    <ModalWrap open={open} onClose={onClose} title={editItem ? "Edit Ward" : "Add New Ward"}>
      <form onSubmit={handleSubmit}>
        <div className="wb-modal-body">
          <div className="wb-grid-2">
            <div className="wb-field wb-full">
              <label className="wb-lbl">Ward Name <span className="wb-req">*</span></label>
              <input className="wb-input" placeholder="e.g. ICU Block A" value={form.name} onChange={e => sf("name", e.target.value)} required />
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Ward Type <span className="wb-req">*</span></label>
              <select className="wb-select" value={form.type} onChange={e => sf("type", e.target.value)}>
                {WARD_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Floor / Location</label>
              <input className="wb-input" placeholder="e.g. Ground, 2nd Floor" value={form.floor} onChange={e => sf("floor", e.target.value)} />
            </div>
            <div className="wb-field wb-full">
              <label className="wb-lbl">Description</label>
              <textarea className="wb-input wb-textarea" placeholder="Brief description of this ward..." value={form.description} onChange={e => sf("description", e.target.value)} rows={2} />
            </div>
          </div>
        </div>
        <div className="wb-modal-foot">
          <button type="button" className="wb-btn wb-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="wb-btn wb-btn-primary" disabled={saving}>
            {saving && <Loader2 size={13} className="wb-spin" />}
            {saving ? "Saving..." : editItem ? "Update Ward" : "Create Ward"}
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

// ─── Room Modal ───────────────────────────────────────────────────────────────
function RoomModal({ open, onClose, editItem, wards, defaultWardId, onSuccess, addToast }: {
  open: boolean; onClose: () => void; editItem: Room | null;
  wards: Ward[]; defaultWardId?: string;
  onSuccess: () => void; addToast: (t: Toast["type"], m: string) => void;
}) {
  const [form, setForm] = useState({ wardId: defaultWardId || "", roomNumber: "", roomType: "SHARED", capacity: "1", description: "" });
  const [saving, setSaving] = useState(false);
  const [customRoomType, setCustomRoomType] = useState(false);
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (editItem) {
      const isCustom = !ROOM_TYPES.includes(editItem.roomType);
      setCustomRoomType(isCustom);
      setForm({ wardId: editItem.wardId, roomNumber: editItem.roomNumber, roomType: editItem.roomType, capacity: String(editItem.capacity), description: editItem.description || "" });
    } else {
      setCustomRoomType(false);
      setForm({ wardId: defaultWardId || "", roomNumber: "", roomType: "SHARED", capacity: "1", description: "" });
    }
  }, [editItem, open, defaultWardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { wardId: form.wardId, roomNumber: form.roomNumber, roomType: form.roomType, capacity: parseInt(form.capacity) || 1, description: form.description || null };
    const res = editItem
      ? await api(`/api/config/rooms/${editItem.id}`, "PUT", payload)
      : await api("/api/config/rooms", "POST", payload);
    setSaving(false);
    if (res.success) { addToast("success", editItem ? "Room updated" : "Room created"); onSuccess(); }
    else addToast("error", res.message || "Failed");
  };

  return (
    <ModalWrap open={open} onClose={onClose} title={editItem ? "Edit Room" : "Add New Room"}>
      <form onSubmit={handleSubmit}>
        <div className="wb-modal-body">
          <div className="wb-grid-2">
            <div className="wb-field">
              <label className="wb-lbl">Ward <span className="wb-req">*</span></label>
              <select className="wb-select" value={form.wardId} onChange={e => sf("wardId", e.target.value)} required>
                <option value="">— Select Ward —</option>
                {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Room Number <span className="wb-req">*</span></label>
              <input className="wb-input" placeholder="e.g. R-101, 201-A" value={form.roomNumber} onChange={e => sf("roomNumber", e.target.value)} required />
            </div>
            <div className="wb-field wb-full">
              <label className="wb-lbl">Room Type</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {ROOM_TYPES.map(t => (
                  <button
                    type="button" key={t}
                    onClick={() => { sf("roomType", t); setCustomRoomType(false); }}
                    style={{
                      padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
                      border: `1.5px solid ${!customRoomType && form.roomType === t ? "#0E898F" : "#e2e8f0"}`,
                      background: !customRoomType && form.roomType === t ? "#E6F4F4" : "#f8fafc",
                      color: !customRoomType && form.roomType === t ? "#0A6B70" : "#64748b",
                      boxShadow: !customRoomType && form.roomType === t ? "0 0 0 3px rgba(59,130,246,.1)" : "none",
                    }}
                  >
                    {t.replace("_", " ")}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setCustomRoomType(true); if (!customRoomType) sf("roomType", ""); }}
                  style={{
                    padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
                    border: `1.5px dashed ${customRoomType ? "#8b5cf6" : "#cbd5e1"}`,
                    background: customRoomType ? "#f5f3ff" : "transparent",
                    color: customRoomType ? "#7c3aed" : "#94a3b8",
                  }}
                >
                  ✏ Custom
                </button>
              </div>
              {customRoomType && (
                <input
                  className="wb-input"
                  placeholder="e.g. VIP Suite, Deluxe, Observation…"
                  value={form.roomType}
                  onChange={e => sf("roomType", e.target.value)}
                  autoFocus
                  style={{ marginTop: 10 }}
                />
              )}
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Bed Capacity</label>
              <input className="wb-input" type="number" min="1" max="50" value={form.capacity} onChange={e => sf("capacity", e.target.value)} />
            </div>
            <div className="wb-field wb-full">
              <label className="wb-lbl">Description</label>
              <textarea className="wb-input wb-textarea" placeholder="Optional notes about this room..." value={form.description} onChange={e => sf("description", e.target.value)} rows={2} />
            </div>
          </div>
        </div>
        <div className="wb-modal-foot">
          <button type="button" className="wb-btn wb-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="wb-btn wb-btn-primary" disabled={saving || !form.wardId}>
            {saving && <Loader2 size={13} className="wb-spin" />}
            {saving ? "Saving..." : editItem ? "Update Room" : "Create Room"}
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

// ─── Bed Modal ────────────────────────────────────────────────────────────────
function BedModal({ open, onClose, editItem, wards, rooms, defaultWardId, defaultRoomId, onSuccess, addToast }: {
  open: boolean; onClose: () => void; editItem: Bed | null;
  wards: Ward[]; rooms: Room[];
  defaultWardId?: string; defaultRoomId?: string;
  onSuccess: () => void; addToast: (t: Toast["type"], m: string) => void;
}) {
  const [form, setForm] = useState({ wardId: defaultWardId || "", roomId: defaultRoomId || "", bedNumber: "", bedType: "NORMAL", pricePerDay: "0" });
  const [saving, setSaving] = useState(false);
  const [customBedType, setCustomBedType] = useState(false);
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (editItem) {
      const isCustom = !BED_TYPES.includes(editItem.bedType);
      setCustomBedType(isCustom);
      setForm({ wardId: editItem.wardId, roomId: editItem.roomId || "", bedNumber: editItem.bedNumber, bedType: editItem.bedType, pricePerDay: String(editItem.pricePerDay) });
    } else {
      setCustomBedType(false);
      setForm({ wardId: defaultWardId || "", roomId: defaultRoomId || "", bedNumber: "", bedType: "NORMAL", pricePerDay: "0" });
    }
  }, [editItem, open, defaultWardId, defaultRoomId]);

  const filteredRooms = rooms.filter(r => r.wardId === form.wardId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { wardId: form.wardId, roomId: form.roomId || null, bedNumber: form.bedNumber, bedType: form.bedType, pricePerDay: parseFloat(form.pricePerDay) || 0 };
    const res = editItem
      ? await api(`/api/config/beds/${editItem.id}`, "PUT", payload)
      : await api("/api/config/beds", "POST", payload);
    setSaving(false);
    if (res.success) { addToast("success", editItem ? "Bed updated" : "Bed added"); onSuccess(); }
    else addToast("error", res.message || "Failed");
  };

  return (
    <ModalWrap open={open} onClose={onClose} title={editItem ? "Edit Bed" : "Add Bed"}>
      <form onSubmit={handleSubmit}>
        <div className="wb-modal-body">
          <div className="wb-grid-2">
            <div className="wb-field">
              <label className="wb-lbl">Ward <span className="wb-req">*</span></label>
              <select className="wb-select" value={form.wardId} onChange={e => sf("wardId", e.target.value)} required>
                <option value="">— Select Ward —</option>
                {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Room</label>
              <select className="wb-select" value={form.roomId} onChange={e => sf("roomId", e.target.value)}>
                <option value="">— No Room —</option>
                {filteredRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
              </select>
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Bed Number <span className="wb-req">*</span></label>
              <input className="wb-input" placeholder="e.g. B-01, ICU-3" value={form.bedNumber} onChange={e => sf("bedNumber", e.target.value)} required />
            </div>
            <div className="wb-field wb-full">
              <label className="wb-lbl">Bed Type</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {BED_TYPES.map(t => (
                  <button
                    type="button" key={t}
                    onClick={() => { sf("bedType", t); setCustomBedType(false); }}
                    style={{
                      padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
                      border: `1.5px solid ${!customBedType && form.bedType === t ? "#0E898F" : "#e2e8f0"}`,
                      background: !customBedType && form.bedType === t ? "#E6F4F4" : "#f8fafc",
                      color: !customBedType && form.bedType === t ? "#0A6B70" : "#64748b",
                      boxShadow: !customBedType && form.bedType === t ? "0 0 0 3px rgba(59,130,246,.1)" : "none",
                    }}
                  >
                    {BED_TYPE_LABEL[t]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setCustomBedType(true); if (!customBedType) sf("bedType", ""); }}
                  style={{
                    padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
                    border: `1.5px dashed ${customBedType ? "#8b5cf6" : "#cbd5e1"}`,
                    background: customBedType ? "#f5f3ff" : "transparent",
                    color: customBedType ? "#7c3aed" : "#94a3b8",
                  }}
                >
                  ✏ Custom
                </button>
              </div>
              {customBedType && (
                <input
                  className="wb-input"
                  placeholder="e.g. Bariatric, Recliner, Cot…"
                  value={form.bedType}
                  onChange={e => sf("bedType", e.target.value)}
                  autoFocus
                  style={{ marginTop: 10 }}
                />
              )}
            </div>
            <div className="wb-field wb-full">
              <label className="wb-lbl">Price Per Day (₹)</label>
              <input className="wb-input" type="number" min="0" step="1" value={form.pricePerDay} onChange={e => sf("pricePerDay", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="wb-modal-foot">
          <button type="button" className="wb-btn wb-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="wb-btn wb-btn-primary" disabled={saving || !form.wardId}>
            {saving && <Loader2 size={13} className="wb-spin" />}
            {saving ? "Saving..." : editItem ? "Update Bed" : "Add Bed"}
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

// ─── Bulk Bed Modal ───────────────────────────────────────────────────────────
function BulkBedModal({ open, onClose, wards, rooms, defaultWardId, defaultRoomId, onSuccess, addToast }: {
  open: boolean; onClose: () => void;
  wards: Ward[]; rooms: Room[];
  defaultWardId?: string; defaultRoomId?: string;
  onSuccess: () => void; addToast: (t: Toast["type"], m: string) => void;
}) {
  const [form, setForm] = useState({ wardId: defaultWardId || "", roomId: defaultRoomId || "", count: "4", prefix: "Bed", startFrom: "1", bedType: "NORMAL", pricePerDay: "0" });
  const [saving, setSaving] = useState(false);
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const filteredRooms = rooms.filter(r => r.wardId === form.wardId);

  const preview = Array.from({ length: Math.min(parseInt(form.count) || 0, 8) }, (_, i) =>
    `${form.prefix}-${(parseInt(form.startFrom) || 1) + i}`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api("/api/config/beds", "POST", {
      bulk: true,
      wardId: form.wardId, roomId: form.roomId,
      count: parseInt(form.count), prefix: form.prefix,
      startFrom: parseInt(form.startFrom), bedType: form.bedType,
      pricePerDay: parseFloat(form.pricePerDay) || 0,
    });
    setSaving(false);
    if (res.success) { addToast("success", `${form.count} beds created successfully`); onSuccess(); }
    else addToast("error", res.message || "Failed");
  };

  return (
    <ModalWrap open={open} onClose={onClose} title="Bulk Add Beds" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="wb-modal-body">
          <div className="wb-grid-2">
            <div className="wb-field">
              <label className="wb-lbl">Ward <span className="wb-req">*</span></label>
              <select className="wb-select" value={form.wardId} onChange={e => sf("wardId", e.target.value)} required>
                <option value="">— Select Ward —</option>
                {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Room <span className="wb-req">*</span></label>
              <select className="wb-select" value={form.roomId} onChange={e => sf("roomId", e.target.value)} required>
                <option value="">— Select Room —</option>
                {filteredRooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
              </select>
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Number of Beds <span className="wb-req">*</span></label>
              <input className="wb-input" type="number" min="1" max="50" value={form.count} onChange={e => sf("count", e.target.value)} required />
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Bed Number Prefix</label>
              <input className="wb-input" placeholder="e.g. Bed, ICU, B" value={form.prefix} onChange={e => sf("prefix", e.target.value)} />
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Start Numbering From</label>
              <input className="wb-input" type="number" min="1" value={form.startFrom} onChange={e => sf("startFrom", e.target.value)} />
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Bed Type</label>
              <select className="wb-select" value={form.bedType} onChange={e => sf("bedType", e.target.value)}>
                {BED_TYPES.map(t => <option key={t} value={t}>{BED_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div className="wb-field wb-full">
              <label className="wb-lbl">Price Per Day (₹)</label>
              <input className="wb-input" type="number" min="0" step="1" value={form.pricePerDay} onChange={e => sf("pricePerDay", e.target.value)} />
            </div>
          </div>
          {preview.length > 0 && (
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Preview — {form.count} beds will be created
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {preview.map(n => (
                  <span key={n} style={{ fontSize: 12, fontWeight: 600, background: "#E6F4F4", color: "#0A6B70", border: "1px solid #B3E0E0", borderRadius: 6, padding: "3px 8px" }}>{n}</span>
                ))}
                {parseInt(form.count) > 8 && <span style={{ fontSize: 12, color: "#94a3b8" }}>+{parseInt(form.count) - 8} more</span>}
              </div>
            </div>
          )}
        </div>
        <div className="wb-modal-foot">
          <button type="button" className="wb-btn wb-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="wb-btn wb-btn-green" disabled={saving || !form.wardId || !form.roomId}>
            {saving && <Loader2 size={13} className="wb-spin" />}
            {saving ? "Creating..." : `Create ${form.count} Beds`}
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

// ─── Allocate Modal ───────────────────────────────────────────────────────────
function AllocateModal({ open, onClose, bed, onSuccess, addToast }: {
  open: boolean; onClose: () => void; bed: Bed | null;
  onSuccess: () => void; addToast: (t: Toast["type"], m: string) => void;
}) {
  const [form, setForm] = useState({ patientName: "", patientAge: "", patientGender: "Male", patientPhone: "", attendantName: "", attendantPhone: "", diagnosis: "", admittingDoctorName: "", admissionDate: new Date().toISOString().split("T")[0], expectedDischargeDate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorOption[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm(p => ({ ...p, admissionDate: new Date().toISOString().split("T")[0], admittingDoctorName: "" }));
      setSelectedDeptId("");
      Promise.all([
        api("/api/config/departments?simple=true"),
        api("/api/config/doctors?simple=true"),
      ]).then(([dRes, docRes]) => {
        if (dRes.success) setDepartments(dRes.data || []);
        if (docRes.success) setAllDoctors(docRes.data || []);
      });
    }
  }, [open]);

  const filteredDoctors = selectedDeptId
    ? allDoctors.filter(d => d.department?.id === selectedDeptId || d.departmentId === selectedDeptId)
    : allDoctors;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bed) return;
    setSaving(true);
    const res = await api("/api/ipd/allocate-bed", "POST", {
      bedId: bed.id,
      patientName: form.patientName,
      patientAge: form.patientAge ? parseInt(form.patientAge) : null,
      patientGender: form.patientGender || null,
      patientPhone: form.patientPhone || null,
      attendantName: form.attendantName || null,
      attendantPhone: form.attendantPhone || null,
      diagnosis: form.diagnosis || null,
      admittingDoctorName: form.admittingDoctorName || null,
      admissionDate: form.admissionDate,
      expectedDischargeDate: form.expectedDischargeDate || null,
      notes: form.notes || null,
    });
    setSaving(false);
    if (res.success) { addToast("success", `Bed ${bed.bedNumber} allocated to ${form.patientName}`); onSuccess(); }
    else addToast("error", res.message || "Allocation failed");
  };

  return (
    <ModalWrap open={open} onClose={onClose} title={`Allocate Bed — ${bed?.bedNumber || ""}`} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="wb-modal-body">
          <div style={{ fontSize: 12, color: "#64748b", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px", marginBottom: 4 }}>
            <strong style={{ color: "#16a34a" }}>📋 Patient Admission</strong> — {bed?.ward?.name} {bed?.room ? `· Room ${bed.room.roomNumber}` : ""}
          </div>
          <div className="wb-grid-2">
            <div className="wb-field wb-full">
              <label className="wb-lbl">Patient Name <span className="wb-req">*</span></label>
              <input className="wb-input" placeholder="Full name of patient" value={form.patientName} onChange={e => sf("patientName", e.target.value)} required />
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Age</label>
              <input className="wb-input" type="number" min="0" max="150" placeholder="Years" value={form.patientAge} onChange={e => sf("patientAge", e.target.value)} />
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Gender</label>
              <select className="wb-select" value={form.patientGender} onChange={e => sf("patientGender", e.target.value)}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Patient Phone</label>
              <input className="wb-input" placeholder="+91 98765 43210" value={form.patientPhone} onChange={e => sf("patientPhone", e.target.value)} />
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Department</label>
              <select
                className="wb-select"
                value={selectedDeptId}
                onChange={e => { setSelectedDeptId(e.target.value); sf("admittingDoctorName", ""); }}
              >
                <option value="">— All Departments —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Admitting Doctor</label>
              <select
                className="wb-select"
                value={form.admittingDoctorName}
                onChange={e => sf("admittingDoctorName", e.target.value)}
              >
                <option value="">— Select Doctor —</option>
                {filteredDoctors.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}{d.specialization ? ` — ${d.specialization}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Admission Date</label>
              <input className="wb-input" type="date" value={form.admissionDate} onChange={e => sf("admissionDate", e.target.value)} />
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Expected Discharge</label>
              <input className="wb-input" type="date" value={form.expectedDischargeDate} onChange={e => sf("expectedDischargeDate", e.target.value)} />
            </div>
            <div className="wb-field">
              <label className="wb-lbl">Attendant Name</label>
              <input className="wb-input" placeholder="Attendant / guardian" value={form.attendantName} onChange={e => sf("attendantName", e.target.value)} />
            </div>
            <div className="wb-field wb-full">
              <label className="wb-lbl">Diagnosis / Reason</label>
              <textarea className="wb-input wb-textarea" placeholder="Reason for admission..." value={form.diagnosis} onChange={e => sf("diagnosis", e.target.value)} rows={2} />
            </div>
          </div>
        </div>
        <div className="wb-modal-foot">
          <button type="button" className="wb-btn wb-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="wb-btn wb-btn-green" disabled={saving}>
            {saving && <Loader2 size={13} className="wb-spin" />}
            {saving ? "Admitting..." : "Admit Patient"}
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

// ─── Discharge Modal ──────────────────────────────────────────────────────────
function DischargeModal({ open, onClose, bed, onSuccess, addToast }: {
  open: boolean; onClose: () => void; bed: Bed | null;
  onSuccess: () => void; addToast: (t: Toast["type"], m: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const allocation = bed?.allocations?.[0];

  const handleDischarge = async () => {
    if (!allocation) return;
    setSaving(true);
    const res = await api("/api/ipd/discharge-bed", "POST", {
      allocationId: allocation.id,
      actualDischargeDate: new Date().toISOString(),
      notes: notes || null,
    });
    setSaving(false);
    if (res.success) { addToast("success", `${allocation.patientName} discharged successfully`); onSuccess(); }
    else addToast("error", res.message || "Discharge failed");
  };

  if (!open || !bed || !allocation) return null;
  return (
    <div className="wb-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wb-confirm">
        <div style={{ marginBottom: 14 }}><LogOut size={36} color="#ef4444" /></div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>Discharge Patient</h3>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
          Discharge <strong>{allocation.patientName}</strong> from <strong>Bed {bed.bedNumber}</strong>?
          The bed will become available immediately.
        </p>
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 16, textAlign: "left" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Patient Details</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{allocation.patientName}</div>
          {allocation.patientAge && <div style={{ fontSize: 12, color: "#64748b" }}>Age: {allocation.patientAge} • {allocation.patientGender}</div>}
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Admitted: {fmt(allocation.admissionDate)}</div>
          {allocation.diagnosis && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{allocation.diagnosis}</div>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <textarea
            className="wb-input wb-textarea"
            placeholder="Discharge notes (optional)..."
            value={notes} onChange={e => setNotes(e.target.value)}
            rows={2}
            style={{ fontSize: 13 }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="wb-btn wb-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="wb-btn wb-btn-red" onClick={handleDischarge} disabled={saving}>
            {saving && <Loader2 size={13} className="wb-spin" />} Confirm Discharge
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BED CARD ─────────────────────────────────────────────────────────────────
function BedCard({ bed, onAllocate, onDischarge, onStatusChange, onEdit, onDelete }: {
  bed: Bed;
  onAllocate: (b: Bed) => void;
  onDischarge: (b: Bed) => void;
  onStatusChange: (b: Bed, status: string) => void;
  onEdit: (b: Bed) => void;
  onDelete: (b: Bed) => void;
}) {
  const cfg = BED_STATUS_CONFIG[bed.status] || BED_STATUS_CONFIG.AVAILABLE;
  const allocation = bed.allocations?.[0];

  return (
    <div className="wb-bed-card" style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="wb-bed-head">
        <div>
          <div className="wb-bed-num">{bed.bedNumber}</div>
          <div className="wb-bed-type-lbl">{BED_TYPE_LABEL[bed.bedType] || bed.bedType}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div className="wb-bed-dot" style={{ background: cfg.dot }} />
          <span className="wb-bed-status-lbl" style={{ background: "rgba(255,255,255,.7)", color: cfg.text, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {bed.status === "OCCUPIED" && allocation && (
        <div className="wb-bed-patient">
          <div className="wb-bed-patient-name">{allocation.patientName}</div>
          {allocation.patientAge && <div style={{ fontSize: 11, color: "#94a3b8" }}>{allocation.patientAge}y · {allocation.patientGender}</div>}
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>In: {fmt(allocation.admissionDate)}</div>
          {allocation.expectedDischargeDate && (
            <div style={{ fontSize: 11, color: "#b45309", marginTop: 1 }}>Exp. out: {fmt(allocation.expectedDischargeDate)}</div>
          )}
          {allocation.admittingDoctorName && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Dr. {allocation.admittingDoctorName}</div>}
        </div>
      )}

      {bed.pricePerDay > 0 && (
        <div style={{ padding: "0 14px 6px", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>₹{bed.pricePerDay}/day</div>
      )}

      <div className="wb-bed-actions">
        {bed.status === "AVAILABLE" && (
          <button className="wb-btn wb-btn-green wb-btn-sm" onClick={() => onAllocate(bed)}>
            <UserPlus size={11} /> Admit
          </button>
        )}
        {bed.status === "OCCUPIED" && (
          <button className="wb-btn wb-btn-red wb-btn-sm" onClick={() => onDischarge(bed)}>
            <LogOut size={11} /> Discharge
          </button>
        )}
        {bed.status === "AVAILABLE" && (
          <button className="wb-btn wb-btn-ghost wb-btn-sm" onClick={() => onStatusChange(bed, "MAINTENANCE")}
            style={{ padding: "5px 8px", fontSize: 11 }}>
            <Wrench size={10} />
          </button>
        )}
        {bed.status === "AVAILABLE" && (
          <button className="wb-btn wb-btn-ghost wb-btn-sm" onClick={() => onStatusChange(bed, "RESERVED")}
            style={{ padding: "5px 8px", fontSize: 11 }}>
            <Lock size={10} />
          </button>
        )}
        {(bed.status === "MAINTENANCE" || bed.status === "RESERVED") && (
          <button className="wb-btn wb-btn-ghost wb-btn-sm" onClick={() => onStatusChange(bed, "AVAILABLE")}
            style={{ padding: "5px 8px", fontSize: 11, color: "#16a34a", borderColor: "#86efac" }}>
            <Check size={10} /> Free
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button className="wb-icon-btn wb-icon-btn-blue" title="Edit" onClick={() => onEdit(bed)}>
            <Pencil size={11} />
          </button>
          <button className="wb-icon-btn wb-icon-btn-red" title="Delete" onClick={() => onDelete(bed)}>
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
export default function WardBedPanel() {
  // Navigation
  const [view, setView] = useState<"wards" | "rooms" | "beds">("wards");
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Data
  const [wards, setWards] = useState<Ward[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [wardModal, setWardModal] = useState<{ open: boolean; item: Ward | null }>({ open: false, item: null });
  const [roomModal, setRoomModal] = useState<{ open: boolean; item: Room | null }>({ open: false, item: null });
  const [bedModal, setBedModal]   = useState<{ open: boolean; item: Bed | null }>({ open: false, item: null });
  const [bulkModal, setBulkModal] = useState(false);
  const [allocateModal, setAllocateModal] = useState<{ open: boolean; bed: Bed | null }>({ open: false, bed: null });
  const [dischargeModal, setDischargeModal] = useState<{ open: boolean; bed: Bed | null }>({ open: false, bed: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: "ward"|"room"|"bed"; item: any }>({ open: false, type: "ward", item: null });

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const removeToast = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  // Search
  const [search, setSearch] = useState("");

  // Selection & Sorting State
  const [selectedWardIds, setSelectedWardIds] = useState<Set<string>>(new Set());
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [selectedBedIds, setSelectedBedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Bulk delete state
  const [bulkDelete, setBulkDelete] = useState<{ open: boolean; type: "ward" | "room" | "bed"; items: any[] }>({ open: false, type: "ward", items: [] });

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
  const handleSelectAllWards = () => {
    if (selectedWardIds.size === wards.length) setSelectedWardIds(new Set());
    else setSelectedWardIds(new Set(wards.map(w => w.id)));
  };

  const handleSelectOneWard = (id: string) => {
    const newSet = new Set(selectedWardIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedWardIds(newSet);
  };

  const handleSelectAllRooms = () => {
    const roomList = rooms.filter(r => r.wardId === selectedWard?.id);
    if (selectedRoomIds.size === roomList.length) setSelectedRoomIds(new Set());
    else setSelectedRoomIds(new Set(roomList.map(r => r.id)));
  };

  const handleSelectOneRoom = (id: string) => {
    const newSet = new Set(selectedRoomIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRoomIds(newSet);
  };

  const handleSelectAllBeds = () => {
    const bedList = beds.filter(b => b.roomId === selectedRoom?.id);
    if (selectedBedIds.size === bedList.length) setSelectedBedIds(new Set());
    else setSelectedBedIds(new Set(bedList.map(b => b.id)));
  };

  const handleSelectOneBed = (id: string) => {
    const newSet = new Set(selectedBedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedBedIds(newSet);
  };

  // ── Sorting Helpers ──
  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  // Sorting will be applied inline where filtered data is rendered
  const sortData = <T,>(data: T[], field: keyof T): T[] => {
    return [...data].sort((a, b) => {
      let aVal: any = a[field];
      let bVal: any = b[field];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  // ── Export Helpers ──
  const exportWardsToCSV = (data: Ward[]) => {
    const headers = ["Name", "Type", "Floor", "Total Beds", "Available", "Occupied", "Status"];
    const rows = data.map(w => [
      w.name, w.type.replace("_", " "), w.floor || "",
      w.stats?.total?.toString() || "0", w.stats?.available?.toString() || "0",
      w.stats?.occupied?.toString() || "0", w.isActive ? "Active" : "Inactive"
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `wards_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllWards = () => {
    exportWardsToCSV(wards);
    setShowExportDropdown(false);
  };

  const handleExportSelectedWards = () => {
    const selected = wards.filter(w => selectedWardIds.has(w.id));
    exportWardsToCSV(selected);
    setShowExportDropdown(false);
  };

  // ── Bulk Delete Handler ──
  const handleBulkDelete = async () => {
    const { type, items } = bulkDelete;
    if (!items.length) return;
    let successCount = 0;
    for (const item of items) {
      let res;
      if (type === "ward") res = await api(`/api/config/wards/${item.id}`, "DELETE");
      else if (type === "room") res = await api(`/api/config/rooms/${item.id}`, "DELETE");
      else res = await api(`/api/config/beds/${item.id}`, "DELETE");
      if (res?.success) successCount++;
    }
    setBulkDelete({ open: false, type: "ward", items: [] });
    if (type === "ward") { setSelectedWardIds(new Set()); loadWards(); }
    else if (type === "room") { setSelectedRoomIds(new Set()); loadRooms(selectedWard?.id); }
    else { setSelectedBedIds(new Set()); loadBeds(selectedWard?.id, selectedRoom?.id); }
    addToast("success", `${successCount} ${type}${successCount !== 1 ? "s" : ""} deleted`);
  };

  // ── Load functions ──
  const loadWards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/api/config/wards");
      if (res.success) setWards(res.data || []);
    } catch { addToast("error", "Failed to load wards"); }
    finally { setLoading(false); }
  }, [addToast]);

  const loadRooms = useCallback(async (wardId?: string) => {
    setLoading(true);
    try {
      const url = wardId ? `/api/config/rooms?wardId=${wardId}` : "/api/config/rooms";
      const res = await api(url);
      if (res.success) setRooms(res.data || []);
    } catch { addToast("error", "Failed to load rooms"); }
    finally { setLoading(false); }
  }, [addToast]);

  const loadBeds = useCallback(async (wardId?: string, roomId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (wardId) params.set("wardId", wardId);
      if (roomId) params.set("roomId", roomId);
      const res = await api(`/api/config/beds?${params}`);
      if (res.success) setBeds(res.data || []);
    } catch { addToast("error", "Failed to load beds"); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { loadWards(); loadRooms(); }, [loadWards, loadRooms]);

  // ── Navigation ──
  const goToRooms = async (ward: Ward) => {
    setSelectedWard(ward);
    setView("rooms");
    await loadRooms(ward.id);
    setSearch("");
  };

  const goToBeds = async (room: Room) => {
    setSelectedRoom(room);
    setView("beds");
    await loadBeds(room.wardId, room.id);
    setSearch("");
  };

  const goToWards = () => { setView("wards"); setSelectedWard(null); setSelectedRoom(null); loadWards(); setSearch(""); };
  const goBackToRooms = () => { setView("rooms"); setSelectedRoom(null); if (selectedWard) loadRooms(selectedWard.id); setSearch(""); };

  // ── Actions ──
  const handleStatusChange = async (bed: Bed, status: string) => {
    const res = await api("/api/ipd/bed-status", "PATCH", { bedId: bed.id, status });
    if (res.success) {
      addToast("success", `Bed ${bed.bedNumber} marked as ${status.toLowerCase()}`);
      if (view === "beds") loadBeds(selectedWard?.id, selectedRoom?.id);
    } else addToast("error", res.message || "Failed to update status");
  };

  const handleDelete = async () => {
    const { type, item } = deleteConfirm;
    let res;
    if (type === "ward") res = await api(`/api/config/wards/${item.id}`, "DELETE");
    else if (type === "room") res = await api(`/api/config/rooms/${item.id}`, "DELETE");
    else res = await api(`/api/config/beds/${item.id}`, "DELETE");
    setDeleteConfirm({ open: false, type: "ward", item: null });
    if (res.success) {
      addToast("success", `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
      if (type === "ward") loadWards();
      else if (type === "room") loadRooms(selectedWard?.id);
      else loadBeds(selectedWard?.id, selectedRoom?.id);
    } else addToast("error", res.message || "Delete failed");
  };

  // ── Compute stats ──
  const globalStats = wards.reduce((acc, w) => {
    const b = w.beds || [];
    acc.total += b.length;
    acc.available += b.filter((x: any) => x.status === "AVAILABLE").length;
    acc.occupied += b.filter((x: any) => x.status === "OCCUPIED").length;
    acc.maintenance += b.filter((x: any) => x.status === "MAINTENANCE").length;
    acc.reserved += b.filter((x: any) => x.status === "RESERVED").length;
    return acc;
  }, { total: 0, available: 0, occupied: 0, maintenance: 0, reserved: 0 });

  const wardRooms = rooms.filter(r => r.wardId === selectedWard?.id);
  const roomBeds  = beds.filter(b => b.roomId === selectedRoom?.id);
  const bedStats  = roomBeds.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; acc.total++; return acc; }, { total: 0 } as Record<string, number>);

  // ── Filtered data ──
  const filteredWards = wards.filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.type.toLowerCase().includes(search.toLowerCase()));
  const filteredRooms = wardRooms.filter(r => r.roomNumber.toLowerCase().includes(search.toLowerCase()) || r.roomType.toLowerCase().includes(search.toLowerCase()));
  const filteredBeds  = roomBeds.filter(b => b.bedNumber.toLowerCase().includes(search.toLowerCase()) || b.status.toLowerCase().includes(search.toLowerCase()));

  // ── Render ──
  return (
    <>
      <style>{CSS}</style>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── STATS BAR (always visible) ── */}
      {wards.length > 0 && (
        <div className="wb-stats-bar">
          <div className="wb-stat-chip wb-stat-total"><BedDouble size={14} /> {globalStats.total} Total Beds</div>
          <div className="wb-stat-chip wb-stat-available"><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> {globalStats.available} Available</div>
          <div className="wb-stat-chip wb-stat-occupied"><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} /> {globalStats.occupied} Occupied</div>
          {globalStats.maintenance > 0 && <div className="wb-stat-chip wb-stat-maintenance"><Wrench size={12} /> {globalStats.maintenance} Maintenance</div>}
          {globalStats.reserved > 0 && <div className="wb-stat-chip wb-stat-reserved"><Lock size={12} /> {globalStats.reserved} Reserved</div>}
          {globalStats.total > 0 && (
            <div className="wb-stat-chip" style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>
              <Activity size={12} /> {globalStats.total > 0 ? Math.round((globalStats.occupied / globalStats.total) * 100) : 0}% Occupancy
            </div>
          )}
        </div>
      )}

      {/* ── BREADCRUMB ── */}
      <div className="wb-breadcrumb">
        <button className="wb-bc-item" onClick={goToWards}><Home size={13} /> Wards</button>
        {selectedWard && <>
          <span className="wb-bc-sep"><ChevronRight size={12} /></span>
          {view === "rooms" ? <span className="wb-bc-cur">{selectedWard.name}</span>
            : <button className="wb-bc-item" onClick={goBackToRooms}>{selectedWard.name}</button>}
        </>}
        {selectedRoom && <>
          <span className="wb-bc-sep"><ChevronRight size={12} /></span>
          <span className="wb-bc-cur">Room {selectedRoom.roomNumber}</span>
        </>}
      </div>

      {/* ═══════════════════════════════════════════════════
          VIEW 1: WARDS
      ═══════════════════════════════════════════════════ */}
      {view === "wards" && (
        <>
          <div className="wb-toolbar">
            <div className="wb-toolbar-left-col">
              <div className="wb-toolbar-heading">Wards</div>
              <div className="wb-toolbar-subheading">Configure hospital wards, rooms, and beds</div>
            </div>
            <div className="wb-toolbar-right">
              <div className="wb-search">
                <Search size={14} color="#94a3b8" />
                <input placeholder="Search wards..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }} onClick={() => setSearch("")}><X size={13} /></button>}
              </div>
              <div className="wb-export-wrap" ref={exportDropdownRef}>
                <button className="wb-btn wb-btn-ghost" onClick={() => setShowExportDropdown(d => !d)}>
                  <Download size={13} /> Export
                </button>
                {showExportDropdown && (
                  <div className="wb-export-dd">
                    <div className="wb-export-item" onClick={handleExportAllWards}>
                      <FileText size={13} /> Export All ({wards.length})
                    </div>
                    <div className={`wb-export-item${selectedWardIds.size === 0 ? " disabled" : ""}`}
                      onClick={selectedWardIds.size > 0 ? handleExportSelectedWards : undefined}>
                      <CheckSquare size={13} /> Export Selected ({selectedWardIds.size})
                    </div>
                  </div>
                )}
              </div>
              <button className="wb-btn wb-btn-ghost" onClick={loadWards} title="Refresh"><RefreshCw size={13} /></button>
              {selectedWardIds.size > 0 && (
                <button className="wb-btn wb-btn-red" onClick={() => setBulkDelete({ open: true, type: "ward", items: wards.filter(w => selectedWardIds.has(w.id)) })}>
                  <Trash2 size={13} /> Delete ({selectedWardIds.size})
                </button>
              )}
              <button className="wb-btn wb-btn-primary" onClick={() => setWardModal({ open: true, item: null })}>
                <Plus size={14} /> Add Ward
              </button>
            </div>
          </div>

          {loading ? (
            <div className="wb-loading"><Loader2 size={22} className="wb-spin" /> Loading wards...</div>
          ) : wards.length === 0 ? (
            <div className="wb-setup-card">
              <BedDouble size={48} color="#94a3b8" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Set Up Your Hospital Wards</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24, lineHeight: 1.6 }}>
                Configure wards, rooms, and beds to manage patient admissions and bed occupancy.
              </p>
              <div className="wb-setup-steps">
                {[
                  { n: 1, t: "Create Wards", d: "ICU, General, Private etc." },
                  { n: 2, t: "Add Rooms", d: "Rooms within each ward" },
                  { n: 3, t: "Add Beds", d: "Beds in each room" },
                ].map((s, i, arr) => (
                  <div key={s.n} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
                    <div className="wb-step">
                      <div className="wb-step-num">{s.n}</div>
                      <div className="wb-step-title">{s.t}</div>
                      <div className="wb-step-desc">{s.d}</div>
                    </div>
                    {i < arr.length - 1 && <div className="wb-step-arr"><ChevronRight size={16} /></div>}
                  </div>
                ))}
              </div>
              <button className="wb-btn wb-btn-primary" style={{ margin: "0 auto" }} onClick={() => setWardModal({ open: true, item: null })}>
                <Plus size={14} /> Create First Ward
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <WbCheckbox checked={selectedWardIds.size === wards.length && wards.length > 0} onChange={handleSelectAllWards} />
                <span style={{ fontSize: 12, color: "#64748b" }}>Select All ({wards.length})</span>
                {selectedWardIds.size > 0 && (
                  <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{selectedWardIds.size} selected</span>
                )}
              </div>
              <div className="wb-ward-grid">
                {filteredWards.map(ward => {
                  const s = ward.stats || { total: 0, available: 0, occupied: 0, maintenance: 0, reserved: 0 };
                  const color = WARD_TYPE_COLOR[ward.type] || "#0E898F";
                  const isSelected = selectedWardIds.has(ward.id);
                  return (
                    <div key={ward.id} className={`wb-ward-card-wrapper`}>
                      <div className={`wb-ward-card${isSelected ? " selected" : ""}`} onClick={() => goToRooms(ward)}>
                        <div className="wb-ward-card-checkbox" onClick={e => e.stopPropagation()}>
                          <WbCheckbox checked={isSelected} onChange={() => handleSelectOneWard(ward.id)} />
                        </div>
                        <div className="wb-ward-card-head">
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div className="wb-ward-icon" style={{ background: `${color}18`, color }}>
                              <BedDouble size={20} />
                            </div>
                            <div>
                              <div className="wb-ward-name">{ward.name}</div>
                              <div className="wb-ward-meta">{ward.floor ? `Floor: ${ward.floor}` : "Floor not set"} · {ward._count?.rooms || 0} rooms</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <span className="wb-ward-badge" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                              {ward.type.replace("_", " ")}
                            </span>
                            <button className="wb-icon-btn wb-icon-btn-blue" onClick={e => { e.stopPropagation(); setWardModal({ open: true, item: ward }); }}>
                              <Pencil size={12} />
                            </button>
                            <button className="wb-icon-btn wb-icon-btn-red" onClick={e => { e.stopPropagation(); setDeleteConfirm({ open: true, type: "ward", item: ward }); }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                    {ward.description && (
                      <div style={{ padding: "0 18px 10px", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{ward.description}</div>
                    )}
                    <div className="wb-ward-stats">
                      {[
                        { val: s.total, lbl: "Total", color: "#0A6B70" },
                        { val: s.available, lbl: "Free", color: "#16a34a" },
                        { val: s.occupied, lbl: "Busy", color: "#b91c1c" },
                        { val: s.maintenance + s.reserved, lbl: "Other", color: "#92400e" },
                      ].map(item => (
                        <div key={item.lbl} className="wb-ws-item">
                          <div className="wb-ws-val" style={{ color: item.color }}>{item.val}</div>
                          <div className="wb-ws-lbl">{item.lbl}</div>
                        </div>
                      ))}
                    </div>
                    <div className="wb-ward-foot">
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        {s.total > 0 ? `${Math.round((s.occupied / s.total) * 100)}% occupied` : "No beds yet"}
                      </span>
                      <span style={{ fontSize: 12, color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        View Rooms <ChevronRight size={13} />
                      </span>
                    </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          VIEW 2: ROOMS
      ═══════════════════════════════════════════════════ */}
      {view === "rooms" && selectedWard && (
        <>
          <div className="wb-toolbar">
            <div className="wb-toolbar-left-col">
              <div className="wb-toolbar-heading">Rooms</div>
              <div className="wb-toolbar-subheading">{selectedWard.name} · {filteredRooms.length} rooms</div>
            </div>
            <div className="wb-toolbar-right">
              <button className="wb-btn wb-btn-ghost" onClick={goToWards}><ArrowLeft size={13} /> Wards</button>
              <div className="wb-search">
                <Search size={14} color="#94a3b8" />
                <input placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="wb-btn wb-btn-ghost" onClick={() => loadRooms(selectedWard.id)}><RefreshCw size={13} /></button>
              {selectedRoomIds.size > 0 && (
                <button className="wb-btn wb-btn-red" onClick={() => setBulkDelete({ open: true, type: "room", items: wardRooms.filter(r => selectedRoomIds.has(r.id)) })}>
                  <Trash2 size={13} /> Delete ({selectedRoomIds.size})
                </button>
              )}
              <button className="wb-btn wb-btn-primary" onClick={() => setRoomModal({ open: true, item: null })}>
                <Plus size={14} /> Add Room
              </button>
            </div>
          </div>

          {loading ? (
            <div className="wb-loading"><Loader2 size={22} className="wb-spin" /> Loading rooms...</div>
          ) : wardRooms.length === 0 ? (
            <div className="wb-empty">
              <div className="wb-empty-icon"><Building2 size={24} color="#94a3b8" /></div>
              <div style={{ fontWeight: 700, color: "#475569", marginBottom: 4 }}>No rooms in {selectedWard.name}</div>
              <div style={{ marginBottom: 16 }}>Add rooms to organise beds within this ward.</div>
              <button className="wb-btn wb-btn-primary" style={{ margin: "0 auto" }} onClick={() => setRoomModal({ open: true, item: null })}>
                <Plus size={14} /> Add First Room
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <WbCheckbox checked={selectedRoomIds.size === wardRooms.length && wardRooms.length > 0} onChange={handleSelectAllRooms} />
                <span style={{ fontSize: 12, color: "#64748b" }}>Select All ({wardRooms.length})</span>
                {selectedRoomIds.size > 0 && (
                  <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{selectedRoomIds.size} selected</span>
                )}
              </div>
              <div className="wb-room-grid">
                {filteredRooms.map(room => {
                  const roomBedsData = room.beds || [];
                  const avail = roomBedsData.filter((b: any) => b.status === "AVAILABLE").length;
                  const occup = roomBedsData.filter((b: any) => b.status === "OCCUPIED").length;
                  const isSelected = selectedRoomIds.has(room.id);
                  return (
                    <div key={room.id} className="wb-room-card-wrapper">
                      <div className={`wb-room-card${isSelected ? " selected" : ""}`} onClick={() => goToBeds(room)}>
                        <div className="wb-room-card-checkbox" onClick={e => e.stopPropagation()}>
                          <WbCheckbox checked={isSelected} onChange={() => handleSelectOneRoom(room.id)} />
                        </div>
                        <div className="wb-room-head">
                          <div>
                            <div className="wb-room-no">Room {room.roomNumber}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Cap: {room.capacity} beds</div>
                          </div>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <span className="wb-room-type">{room.roomType.replace("_", " ")}</span>
                            <button className="wb-icon-btn wb-icon-btn-blue" style={{ width: 24, height: 24 }} onClick={e => { e.stopPropagation(); setRoomModal({ open: true, item: room }); }}><Pencil size={11} /></button>
                            <button className="wb-icon-btn wb-icon-btn-red" style={{ width: 24, height: 24 }} onClick={e => { e.stopPropagation(); setDeleteConfirm({ open: true, type: "room", item: room }); }}><Trash2 size={11} /></button>
                          </div>
                        </div>
                        <div className="wb-room-beds-strip">
                          {roomBedsData.length === 0 ? (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>No beds — click to add</span>
                          ) : (
                            roomBedsData.slice(0, 12).map((b: any) => {
                              const sc = BED_STATUS_CONFIG[b.status] || BED_STATUS_CONFIG.AVAILABLE;
                              return (
                                <div key={b.id} className="wb-mini-bed" title={`${b.bedNumber}: ${b.status}`}
                                  style={{ background: sc.bg, borderColor: sc.border }}>
                                  <BedDouble size={11} color={sc.text} />
                                </div>
                              );
                            })
                          )}
                          {roomBedsData.length > 12 && <span style={{ fontSize: 10, color: "#94a3b8" }}>+{roomBedsData.length - 12}</span>}
                        </div>
                        <div className="wb-room-foot">
                          <span>{roomBedsData.length} beds · <span style={{ color: "#16a34a", fontWeight: 600 }}>{avail} free</span></span>
                          <span style={{ color: occup > 0 ? "#b91c1c" : "#94a3b8", fontWeight: occup > 0 ? 600 : 400 }}>{occup} occupied</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════
          VIEW 3: BEDS
      ═══════════════════════════════════════════════════ */}
      {view === "beds" && selectedRoom && (
        <>
          <div className="wb-toolbar">
            <div className="wb-toolbar-left-col">
              <div className="wb-toolbar-heading">Beds</div>
              <div className="wb-toolbar-subheading">Room {selectedRoom.roomNumber} · {roomBeds.length} beds</div>
            </div>
            <div className="wb-toolbar-right">
              <button className="wb-btn wb-btn-ghost" onClick={goBackToRooms}><ArrowLeft size={13} /> Rooms</button>
              <div className="wb-search">
                <Search size={14} color="#94a3b8" />
                <input placeholder="Search beds or status..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="wb-btn wb-btn-ghost" onClick={() => loadBeds(selectedWard?.id, selectedRoom.id)}><RefreshCw size={13} /></button>
              <button className="wb-btn wb-btn-ghost" onClick={() => setBulkModal(true)}>
                <Zap size={13} /> Bulk Add
              </button>
              {selectedBedIds.size > 0 && (
                <button className="wb-btn wb-btn-red" onClick={() => setBulkDelete({ open: true, type: "bed", items: roomBeds.filter(b => selectedBedIds.has(b.id)) })}>
                  <Trash2 size={13} /> Delete ({selectedBedIds.size})
                </button>
              )}
              <button className="wb-btn wb-btn-primary" onClick={() => setBedModal({ open: true, item: null })}>
                <Plus size={14} /> Add Bed
              </button>
            </div>
          </div>

          <div className="wb-sec-hd">
            <div className="wb-sec-ic" style={{ background: "#E6F4F4", color: "#0A6B70" }}><BedDouble size={16} /></div>
            <div className="wb-sec-title">Room {selectedRoom.roomNumber}</div>
            <span className="wb-sec-count">{roomBeds.length} beds</span>
            {Object.entries({ AVAILABLE: bedStats.AVAILABLE, OCCUPIED: bedStats.OCCUPIED, MAINTENANCE: bedStats.MAINTENANCE, RESERVED: bedStats.RESERVED }).filter(([, v]) => v > 0).map(([k, v]) => {
              const sc = BED_STATUS_CONFIG[k];
              return (
                <span key={k} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                  {v} {sc.label}
                </span>
              );
            })}
          </div>

          {loading ? (
            <div className="wb-loading"><Loader2 size={22} className="wb-spin" /> Loading beds...</div>
          ) : roomBeds.length === 0 ? (
            <div className="wb-empty">
              <div className="wb-empty-icon"><BedDouble size={24} color="#94a3b8" /></div>
              <div style={{ fontWeight: 700, color: "#475569", marginBottom: 4 }}>No beds in Room {selectedRoom.roomNumber}</div>
              <div style={{ marginBottom: 16 }}>Add individual beds or use bulk add to create multiple at once.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="wb-btn wb-btn-ghost" onClick={() => setBulkModal(true)}><Zap size={13} /> Bulk Add</button>
                <button className="wb-btn wb-btn-primary" onClick={() => setBedModal({ open: true, item: null })}><Plus size={14} /> Add Bed</button>
              </div>
            </div>
          ) : (
            <div className="wb-bed-grid">
              {filteredBeds.map(bed => (
                <BedCard
                  key={bed.id}
                  bed={bed}
                  onAllocate={b => setAllocateModal({ open: true, bed: b })}
                  onDischarge={b => setDischargeModal({ open: true, bed: b })}
                  onStatusChange={handleStatusChange}
                  onEdit={b => setBedModal({ open: true, item: b })}
                  onDelete={b => setDeleteConfirm({ open: true, type: "bed", item: b })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MODALS ── */}
      <WardModal
        open={wardModal.open} onClose={() => setWardModal({ open: false, item: null })}
        editItem={wardModal.item} addToast={addToast}
        onSuccess={() => { setWardModal({ open: false, item: null }); loadWards(); }}
      />
      <RoomModal
        open={roomModal.open} onClose={() => setRoomModal({ open: false, item: null })}
        editItem={roomModal.item} wards={wards} defaultWardId={selectedWard?.id}
        addToast={addToast}
        onSuccess={() => { setRoomModal({ open: false, item: null }); loadRooms(selectedWard?.id); }}
      />
      <BedModal
        open={bedModal.open} onClose={() => setBedModal({ open: false, item: null })}
        editItem={bedModal.item} wards={wards} rooms={rooms}
        defaultWardId={selectedWard?.id} defaultRoomId={selectedRoom?.id}
        addToast={addToast}
        onSuccess={() => { setBedModal({ open: false, item: null }); loadBeds(selectedWard?.id, selectedRoom?.id); if (view === "rooms") loadRooms(selectedWard?.id); }}
      />
      <BulkBedModal
        open={bulkModal} onClose={() => setBulkModal(false)}
        wards={wards} rooms={rooms}
        defaultWardId={selectedWard?.id} defaultRoomId={selectedRoom?.id}
        addToast={addToast}
        onSuccess={() => { setBulkModal(false); loadBeds(selectedWard?.id, selectedRoom?.id); }}
      />
      <AllocateModal
        open={allocateModal.open} onClose={() => setAllocateModal({ open: false, bed: null })}
        bed={allocateModal.bed} addToast={addToast}
        onSuccess={() => { setAllocateModal({ open: false, bed: null }); loadBeds(selectedWard?.id, selectedRoom?.id); }}
      />
      <DischargeModal
        open={dischargeModal.open} onClose={() => setDischargeModal({ open: false, bed: null })}
        bed={dischargeModal.bed} addToast={addToast}
        onSuccess={() => { setDischargeModal({ open: false, bed: null }); loadBeds(selectedWard?.id, selectedRoom?.id); }}
      />

      {/* ── SINGLE DELETE CONFIRM ── */}
      <ProDeleteDialog
        open={deleteConfirm.open}
        type={deleteConfirm.type}
        items={deleteConfirm.item ? [deleteConfirm.item] : []}
        onClose={() => setDeleteConfirm({ open: false, type: "ward", item: null })}
        onConfirm={handleDelete}
        loading={false}
      />

      {/* ── BULK DELETE DIALOG ── */}
      <ProDeleteDialog
        open={bulkDelete.open}
        type={bulkDelete.type}
        items={bulkDelete.items}
        onClose={() => setBulkDelete({ open: false, type: "ward", items: [] })}
        onConfirm={handleBulkDelete}
        loading={false}
      />
    </>
  );
}
