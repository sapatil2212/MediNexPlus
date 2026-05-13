"use client";
import { useEffect, useState } from "react";
import { X, Loader2, Check, AlertTriangle, Calendar, Plus, Trash2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Doctor {
  id: string;
  name: string;
}

interface Leave {
  id: string;
  leaveFrom: string;
  leaveTo: string;
  reason?: string | null;
  isApproved: boolean;
  totalDays?: number;
}

interface Toast {
  id: number;
  type: "success" | "error";
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

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateInput = (date: Date) => {
  return date.toISOString().split("T")[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="leave-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`leave-toast leave-toast-${t.type}`}>
          {t.type === "success" && <Check size={16} />}
          {t.type === "error" && <AlertTriangle size={16} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="leave-toast-close">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface LeaveModalProps {
  open: boolean;
  onClose: () => void;
  doctor: Doctor | null;
}

export default function LeaveModal({ open, onClose, doctor }: LeaveModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    leaveFrom: formatDateInput(new Date()),
    leaveTo: formatDateInput(new Date()),
    reason: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  // Load leaves
  const loadLeaves = async () => {
    if (!doctor) return;
    setLoading(true);
    const res = await api(`/api/config/doctors/${doctor.id}/leave?upcoming=true`);
    if (res.success && res.data) {
      setLeaves(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && doctor) {
      loadLeaves();
      setShowForm(false);
      setForm({
        leaveFrom: formatDateInput(new Date()),
        leaveTo: formatDateInput(new Date()),
        reason: "",
      });
      setErrors({});
    }
  }, [open, doctor]);

  // Validate form
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const from = new Date(form.leaveFrom);
    const to = new Date(form.leaveTo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!form.leaveFrom) errs.leaveFrom = "Start date is required";
    if (!form.leaveTo) errs.leaveTo = "End date is required";
    if (from < today) errs.leaveFrom = "Start date cannot be in the past";
    if (to < from) errs.leaveTo = "End date must be after start date";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle create leave
  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !doctor) return;

    setSaving(true);
    const res = await api(`/api/config/doctors/${doctor.id}/leave`, "POST", {
      leaveFrom: new Date(form.leaveFrom).toISOString(),
      leaveTo: new Date(form.leaveTo).toISOString(),
      reason: form.reason || null,
    });
    setSaving(false);

    if (res.success) {
      addToast("success", "Leave created successfully");
      loadLeaves();
      setShowForm(false);
      setForm({
        leaveFrom: formatDateInput(new Date()),
        leaveTo: formatDateInput(new Date()),
        reason: "",
      });
    } else {
      addToast("error", res.message || "Failed to create leave");
    }
  };

  // Handle cancel leave
  const handleCancelLeave = async (leaveId: string) => {
    if (!doctor) return;
    const res = await api(`/api/config/doctors/${doctor.id}/leave?leaveId=${leaveId}`, "DELETE");
    if (res.success) {
      addToast("success", "Leave cancelled");
      loadLeaves();
    } else {
      addToast("error", res.message || "Failed to cancel leave");
    }
  };

  // Calculate days
  const calculateDays = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        .leave-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .leave-modal{background:#fff;border-radius:18px;width:100%;max-width:560px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.2)}
        .leave-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #f1f5f9;background:#f8fafc;flex-shrink:0}
        .leave-modal-title{font-size:17px;font-weight:800;color:#1e293b}
        .leave-modal-subtitle{font-size:12px;color:#64748b;margin-top:2px}
        .leave-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8}
        .leave-icon-btn:hover{background:#f1f5f9}
        .leave-body{padding:24px;overflow-y:auto;flex:1}
        .leave-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:40px;color:#94a3b8}
        .leave-empty{text-align:center;padding:40px;color:#94a3b8;font-size:14px}
        .leave-list{display:flex;flex-direction:column;gap:12px}
        .leave-item{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0}
        .leave-item-info{flex:1}
        .leave-item-dates{font-size:14px;font-weight:600;color:#1e293b;display:flex;align-items:center;gap:6px}
        .leave-item-reason{font-size:12px;color:#64748b;margin-top:4px}
        .leave-item-days{font-size:11px;background:#E6F4F4;color:#0A6B70;padding:2px 8px;border-radius:100px;font-weight:600}
        .leave-item-status{font-size:10px;padding:3px 8px;border-radius:100px;font-weight:700}
        .leave-item-status.approved{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .leave-item-status.pending{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
        .leave-item-actions{display:flex;gap:8px;align-items:center}
        .leave-del-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:#fff5f5;color:#ef4444}
        .leave-del-btn:hover{background:#fee2e2}
        .leave-add-btn{width:100%;padding:14px;border-radius:12px;border:2px dashed #e2e8f0;background:none;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px}
        .leave-add-btn:hover{border-color:#80CCCC;background:#E6F4F4;color:#0E898F}
        .leave-form{margin-top:16px;padding:20px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0}
        .leave-form-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .leave-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .leave-field{display:flex;flex-direction:column;gap:5px}
        .leave-field.full{grid-column:1/-1}
        .leave-lbl{font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b}
        .leave-input{background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b}
        .leave-input:focus{border-color:#80CCCC;outline:none}
        .leave-input.error{border-color:#fca5a5}
        .leave-textarea{min-height:80px;resize:vertical}
        .leave-error{font-size:11px;color:#ef4444;margin-top:2px}
        .leave-form-actions{display:flex;gap:10px;margin-top:16px}
        .leave-btn{padding:10px 20px;border-radius:9px;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px}
        .leave-btn-primary{background:#0E898F;color:#fff}.leave-btn-primary:hover{background:#0A6B70}
        .leave-btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .leave-btn-ghost{background:#fff;border:1.5px solid #e2e8f0;color:#64748b}.leave-btn-ghost:hover{background:#f8fafc}
        .leave-preview{margin-top:12px;padding:12px;background:#E6F4F4;border-radius:10px;font-size:13px;color:#0A6B70;display:flex;align-items:center;gap:8px}
        @keyframes leaveSpin{to{transform:rotate(360deg)}}
        .leave-spin{animation:leaveSpin .7s linear infinite}
        .leave-toast-container{position:fixed;top:20px;right:20px;z-index:300;display:flex;flex-direction:column;gap:8px}
        .leave-toast{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.15)}
        .leave-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .leave-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .leave-toast-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.7}
      `}</style>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="leave-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="leave-modal">
          <div className="leave-modal-head">
            <div>
              <div className="leave-modal-title">Manage Leave</div>
              <div className="leave-modal-subtitle">{doctor?.name}</div>
            </div>
            <button className="leave-icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="leave-body">
            {loading ? (
              <div className="leave-loading">
                <Loader2 size={20} className="leave-spin" />
                Loading leaves...
              </div>
            ) : (
              <>
                {/* Leaves List */}
                {leaves.length === 0 && !showForm ? (
                  <div className="leave-empty">
                    <Calendar size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
                    <div>No upcoming leaves scheduled</div>
                  </div>
                ) : (
                  <div className="leave-list">
                    {leaves.map((leave) => (
                      <div key={leave.id} className="leave-item">
                        <div className="leave-item-info">
                          <div className="leave-item-dates">
                            <Calendar size={14} />
                            {formatDate(leave.leaveFrom)} - {formatDate(leave.leaveTo)}
                            <span className="leave-item-days">
                              {leave.totalDays || calculateDays(leave.leaveFrom, leave.leaveTo)} days
                            </span>
                          </div>
                          {leave.reason && <div className="leave-item-reason">{leave.reason}</div>}
                        </div>
                        <div className="leave-item-actions">
                          <span className={`leave-item-status ${leave.isApproved ? "approved" : "pending"}`}>
                            {leave.isApproved ? "Approved" : "Pending"}
                          </span>
                          <button className="leave-del-btn" onClick={() => handleCancelLeave(leave.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Leave Button */}
                {!showForm && (
                  <button className="leave-add-btn" onClick={() => setShowForm(true)}>
                    <Plus size={16} />
                    Add New Leave
                  </button>
                )}

                {/* Add Leave Form */}
                {showForm && (
                  <form className="leave-form" onSubmit={handleCreateLeave}>
                    <div className="leave-form-title">
                      <Calendar size={16} />
                      New Leave Request
                    </div>
                    <div className="leave-form-grid">
                      <div className="leave-field">
                        <label className="leave-lbl">From Date *</label>
                        <input
                          type="date"
                          className={`leave-input ${errors.leaveFrom ? "error" : ""}`}
                          value={form.leaveFrom}
                          onChange={(e) => setForm((f) => ({ ...f, leaveFrom: e.target.value }))}
                          min={formatDateInput(new Date())}
                        />
                        {errors.leaveFrom && <span className="leave-error">{errors.leaveFrom}</span>}
                      </div>
                      <div className="leave-field">
                        <label className="leave-lbl">To Date *</label>
                        <input
                          type="date"
                          className={`leave-input ${errors.leaveTo ? "error" : ""}`}
                          value={form.leaveTo}
                          onChange={(e) => setForm((f) => ({ ...f, leaveTo: e.target.value }))}
                          min={form.leaveFrom || formatDateInput(new Date())}
                        />
                        {errors.leaveTo && <span className="leave-error">{errors.leaveTo}</span>}
                      </div>
                      <div className="leave-field full">
                        <label className="leave-lbl">Reason (Optional)</label>
                        <textarea
                          className="leave-input leave-textarea"
                          placeholder="e.g., Annual leave, Medical appointment..."
                          value={form.reason}
                          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                        />
                      </div>
                    </div>

                    {form.leaveFrom && form.leaveTo && new Date(form.leaveTo) >= new Date(form.leaveFrom) && (
                      <div className="leave-preview">
                        <Calendar size={16} />
                        {calculateDays(form.leaveFrom, form.leaveTo)} day(s) leave
                      </div>
                    )}

                    <div className="leave-form-actions">
                      <button type="button" className="leave-btn leave-btn-ghost" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="leave-btn leave-btn-primary" disabled={saving}>
                        {saving && <Loader2 size={14} className="leave-spin" />}
                        Create Leave
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
