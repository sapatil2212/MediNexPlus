"use client";
import { useEffect, useState } from "react";
import { X, Loader2, Check, AlertTriangle, Clock, Copy, Trash2, Plus } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Doctor {
  id: string;
  name: string;
}

interface AvailabilitySlot {
  id?: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  generatedSlots?: string[];
  totalSlots?: number;
}

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

type WeeklySchedule = Record<DayOfWeek, AvailabilitySlot | null>;

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

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: "MONDAY", label: "Monday", short: "Mon" },
  { key: "TUESDAY", label: "Tuesday", short: "Tue" },
  { key: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { key: "THURSDAY", label: "Thursday", short: "Thu" },
  { key: "FRIDAY", label: "Friday", short: "Fri" },
  { key: "SATURDAY", label: "Saturday", short: "Sat" },
  { key: "SUNDAY", label: "Sunday", short: "Sun" },
];

const SLOT_DURATIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
];

const emptySchedule: WeeklySchedule = {
  MONDAY: null,
  TUESDAY: null,
  WEDNESDAY: null,
  THURSDAY: null,
  FRIDAY: null,
  SATURDAY: null,
  SUNDAY: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="avail-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`avail-toast avail-toast-${t.type}`}>
          {t.type === "success" && <Check size={16} />}
          {t.type === "error" && <AlertTriangle size={16} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="avail-toast-close">
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

interface AvailabilityModalProps {
  open: boolean;
  onClose: () => void;
  doctor: Doctor | null;
}

export default function AvailabilityModal({ open, onClose, doctor }: AvailabilityModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<WeeklySchedule>(emptySchedule);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [editForm, setEditForm] = useState({ startTime: "09:00", endTime: "17:00", slotDuration: 30 });
  const [copyMode, setCopyMode] = useState(false);
  const [copyTargets, setCopyTargets] = useState<DayOfWeek[]>([]);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  // Load schedule
  const loadSchedule = async () => {
    if (!doctor) return;
    setLoading(true);
    const res = await api(`/api/config/doctors/${doctor.id}/availability`);
    if (res.success && res.data) {
      setSchedule(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && doctor) {
      loadSchedule();
      setSelectedDay(null);
      setCopyMode(false);
      setCopyTargets([]);
    }
  }, [open, doctor]);

  // Handle set availability for a day
  const handleSetAvailability = async () => {
    if (!doctor || !selectedDay) return;
    setSaving(true);
    const res = await api(`/api/config/doctors/${doctor.id}/availability`, "POST", {
      day: selectedDay,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      slotDuration: editForm.slotDuration,
      isActive: true,
    });
    setSaving(false);
    if (res.success) {
      addToast("success", `${selectedDay} schedule updated`);
      loadSchedule();
      setSelectedDay(null);
    } else {
      addToast("error", res.message || "Failed to update");
    }
  };

  // Handle remove day
  const handleRemoveDay = async (day: DayOfWeek) => {
    if (!doctor) return;
    const res = await api(`/api/config/doctors/${doctor.id}/availability?day=${day}`, "DELETE");
    if (res.success) {
      addToast("success", `${day} schedule removed`);
      loadSchedule();
    } else {
      addToast("error", res.message || "Failed to remove");
    }
  };

  // Handle copy to selected days
  const handleCopySchedule = async () => {
    if (!doctor || !selectedDay || copyTargets.length === 0) return;
    setSaving(true);
    const res = await api(`/api/config/doctors/${doctor.id}/availability?copy=true`, "POST", {
      sourceDay: selectedDay,
      targetDays: copyTargets,
    });
    setSaving(false);
    if (res.success) {
      addToast("success", `Schedule copied to ${copyTargets.length} days`);
      loadSchedule();
      setCopyMode(false);
      setCopyTargets([]);
      setSelectedDay(null);
    } else {
      addToast("error", res.message || "Failed to copy");
    }
  };

  // Toggle copy target
  const toggleCopyTarget = (day: DayOfWeek) => {
    setCopyTargets((t) => (t.includes(day) ? t.filter((d) => d !== day) : [...t, day]));
  };

  // Open edit form for a day
  const openEditDay = (day: DayOfWeek) => {
    const slot = schedule[day];
    if (slot) {
      setEditForm({
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotDuration: slot.slotDuration,
      });
    } else {
      setEditForm({ startTime: "09:00", endTime: "17:00", slotDuration: 30 });
    }
    setSelectedDay(day);
    setCopyMode(false);
  };

  // Start copy mode
  const startCopyMode = (day: DayOfWeek) => {
    setSelectedDay(day);
    setCopyMode(true);
    setCopyTargets([]);
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        .avail-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
        .avail-modal{background:#fff;border-radius:18px;width:100%;max-width:800px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.2)}
        .avail-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #f1f5f9;background:#f8fafc;flex-shrink:0}
        .avail-modal-title{font-size:17px;font-weight:800;color:#1e293b}
        .avail-modal-subtitle{font-size:12px;color:#64748b;margin-top:2px}
        .avail-icon-btn{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:none;color:#94a3b8}
        .avail-icon-btn:hover{background:#f1f5f9}
        .avail-body{padding:24px;overflow-y:auto;flex:1}
        .avail-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:40px;color:#94a3b8}
        .avail-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
        .avail-day{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px;text-align:center;cursor:pointer;transition:all .15s}
        .avail-day:hover{border-color:#80CCCC;background:#E6F4F4}
        .avail-day.selected{border-color:#0E898F;background:#E6F4F4}
        .avail-day.has-schedule{border-color:#bbf7d0;background:#f0fdf4}
        .avail-day.copy-target{border-color:#fbbf24;background:#fef9c3}
        .avail-day-label{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:8px}
        .avail-day-time{font-size:12px;color:#16a34a;font-weight:600}
        .avail-day-slots{font-size:10px;color:#94a3b8;margin-top:4px}
        .avail-day-empty{font-size:11px;color:#94a3b8}
        .avail-day-actions{display:flex;gap:4px;justify-content:center;margin-top:8px}
        .avail-day-btn{width:24px;height:24px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:#fff;color:#64748b;font-size:10px}
        .avail-day-btn.edit{color:#0E898F}.avail-day-btn.edit:hover{background:#B3E0E0}
        .avail-day-btn.copy{color:#f59e0b}.avail-day-btn.copy:hover{background:#fef3c7}
        .avail-day-btn.del{color:#ef4444}.avail-day-btn.del:hover{background:#fee2e2}
        .avail-edit-panel{margin-top:20px;padding:20px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0}
        .avail-edit-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .avail-edit-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
        .avail-field{display:flex;flex-direction:column;gap:5px}
        .avail-lbl{font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b}
        .avail-input{background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b}
        .avail-input:focus{border-color:#80CCCC;outline:none}
        .avail-select{background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;cursor:pointer}
        .avail-edit-actions{display:flex;gap:10px;margin-top:16px}
        .avail-btn{padding:10px 20px;border-radius:9px;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px}
        .avail-btn-primary{background:#0E898F;color:#fff}.avail-btn-primary:hover{background:#0A6B70}
        .avail-btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .avail-btn-ghost{background:#fff;border:1.5px solid #e2e8f0;color:#64748b}.avail-btn-ghost:hover{background:#f8fafc}
        .avail-btn-warning{background:#f59e0b;color:#fff}.avail-btn-warning:hover{background:#d97706}
        .avail-copy-panel{margin-top:16px;padding:16px;background:#fef9c3;border-radius:12px;border:1px solid #fde047}
        .avail-copy-title{font-size:13px;font-weight:700;color:#92400e;margin-bottom:12px}
        .avail-copy-days{display:flex;flex-wrap:wrap;gap:8px}
        .avail-copy-day{padding:6px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:12px;color:#64748b;cursor:pointer}
        .avail-copy-day.selected{border-color:#f59e0b;background:#fef3c7;color:#92400e}
        .avail-copy-day:disabled{opacity:.5;cursor:not-allowed}
        @keyframes availSpin{to{transform:rotate(360deg)}}
        .avail-spin{animation:availSpin .7s linear infinite}
        .avail-toast-container{position:fixed;top:20px;right:20px;z-index:300;display:flex;flex-direction:column;gap:8px}
        .avail-toast{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.15)}
        .avail-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        .avail-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
        .avail-toast-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.7}
      `}</style>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="avail-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="avail-modal">
          <div className="avail-modal-head">
            <div>
              <div className="avail-modal-title">Weekly Schedule</div>
              <div className="avail-modal-subtitle">{doctor?.name}</div>
            </div>
            <button className="avail-icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="avail-body">
            {loading ? (
              <div className="avail-loading">
                <Loader2 size={20} className="avail-spin" />
                Loading schedule...
              </div>
            ) : (
              <>
                {/* Weekly Grid */}
                <div className="avail-grid">
                  {DAYS.map(({ key, short }) => {
                    const slot = schedule[key];
                    const isSelected = selectedDay === key;
                    const isCopyTarget = copyMode && copyTargets.includes(key);
                    return (
                      <div
                        key={key}
                        className={`avail-day ${slot ? "has-schedule" : ""} ${isSelected ? "selected" : ""} ${isCopyTarget ? "copy-target" : ""}`}
                        onClick={() => (copyMode && key !== selectedDay ? toggleCopyTarget(key) : openEditDay(key))}
                      >
                        <div className="avail-day-label">{short}</div>
                        {slot ? (
                          <>
                            <div className="avail-day-time">
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <div className="avail-day-slots">{slot.totalSlots || 0} slots</div>
                            {!copyMode && (
                              <div className="avail-day-actions">
                                <button
                                  className="avail-day-btn edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDay(key);
                                  }}
                                >
                                  <Clock size={12} />
                                </button>
                                <button
                                  className="avail-day-btn copy"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startCopyMode(key);
                                  }}
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  className="avail-day-btn del"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDay(key);
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="avail-day-empty">No schedule</div>
                            {!copyMode && (
                              <div className="avail-day-actions">
                                <button
                                  className="avail-day-btn edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDay(key);
                                  }}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Copy Mode Panel */}
                {copyMode && selectedDay && (
                  <div className="avail-copy-panel">
                    <div className="avail-copy-title">
                      Copy {selectedDay}'s schedule to:
                    </div>
                    <div className="avail-copy-days">
                      {DAYS.filter((d) => d.key !== selectedDay).map(({ key, label }) => (
                        <button
                          key={key}
                          className={`avail-copy-day ${copyTargets.includes(key) ? "selected" : ""}`}
                          onClick={() => toggleCopyTarget(key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="avail-edit-actions">
                      <button className="avail-btn avail-btn-ghost" onClick={() => setCopyMode(false)}>
                        Cancel
                      </button>
                      <button
                        className="avail-btn avail-btn-warning"
                        disabled={copyTargets.length === 0 || saving}
                        onClick={handleCopySchedule}
                      >
                        {saving && <Loader2 size={14} className="avail-spin" />}
                        Copy to {copyTargets.length} Day{copyTargets.length !== 1 ? "s" : ""}
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Panel */}
                {selectedDay && !copyMode && (
                  <div className="avail-edit-panel">
                    <div className="avail-edit-title">
                      <Clock size={16} />
                      {schedule[selectedDay] ? "Edit" : "Add"} {selectedDay} Schedule
                    </div>
                    <div className="avail-edit-grid">
                      <div className="avail-field">
                        <label className="avail-lbl">Start Time</label>
                        <input
                          type="time"
                          className="avail-input"
                          value={editForm.startTime}
                          onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                        />
                      </div>
                      <div className="avail-field">
                        <label className="avail-lbl">End Time</label>
                        <input
                          type="time"
                          className="avail-input"
                          value={editForm.endTime}
                          onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                        />
                      </div>
                      <div className="avail-field">
                        <label className="avail-lbl">Slot Duration</label>
                        <select
                          className="avail-select"
                          value={editForm.slotDuration}
                          onChange={(e) => setEditForm((f) => ({ ...f, slotDuration: parseInt(e.target.value) }))}
                        >
                          {SLOT_DURATIONS.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="avail-edit-actions">
                      <button className="avail-btn avail-btn-ghost" onClick={() => setSelectedDay(null)}>
                        Cancel
                      </button>
                      <button className="avail-btn avail-btn-primary" disabled={saving} onClick={handleSetAvailability}>
                        {saving && <Loader2 size={14} className="avail-spin" />}
                        Save Schedule
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
