"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Save, Clock, Plus, Trash2, Calendar, Zap, FileText, AlertTriangle, Activity, Settings, ChevronLeft, ChevronRight, Pencil, Check } from "lucide-react";

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

interface Break {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  maxPatientsPerSlot: number;
  breaks: Break[];
}

interface WeekSchedule {
  [key: string]: DaySchedule;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  scheduleData: any;
}

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
  onSuccess: () => void;
  mode?: "create" | "view" | "edit";
}

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };

const defaultDaySchedule: DaySchedule = {
  enabled: false,
  startTime: "09:00",
  endTime: "17:00",
  slotDuration: 30,
  bufferTime: 5,
  maxPatientsPerSlot: 1,
  breaks: [],
};

// Quick Setup Presets
const QUICK_PRESETS = {
  morningShift: {
    enabled: true,
    startTime: "08:00",
    endTime: "14:00",
    slotDuration: 20,
    bufferTime: 5,
    maxPatientsPerSlot: 1,
    breaks: [{ start: "11:00", end: "11:15" }],
  },
  eveningShift: {
    enabled: true,
    startTime: "14:00",
    endTime: "20:00",
    slotDuration: 20,
    bufferTime: 5,
    maxPatientsPerSlot: 1,
    breaks: [{ start: "17:00", end: "17:15" }],
  },
  fullDay: {
    enabled: true,
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    bufferTime: 5,
    maxPatientsPerSlot: 1,
    breaks: [{ start: "13:00", end: "14:00" }],
  },
  emergency24x7: {
    enabled: true,
    startTime: "00:00",
    endTime: "23:59",
    slotDuration: 15,
    bufferTime: 0,
    maxPatientsPerSlot: 2,
    breaks: [],
  },
  halfDay: {
    enabled: true,
    startTime: "09:00",
    endTime: "13:00",
    slotDuration: 20,
    bufferTime: 5,
    maxPatientsPerSlot: 1,
    breaks: [],
  },
};

export default function ScheduleModal({ open, onClose, doctorId, doctorName, onSuccess, mode = "create" }: ScheduleModalProps) {
  const [editMode, setEditMode] = useState<"view" | "edit" | "create">(mode);
  // Sync editMode when modal reopens with a different mode
  useEffect(() => { setEditMode(mode); }, [open, mode]);
  const [schedule, setSchedule] = useState<WeekSchedule>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "monthly" | "templates">("schedule");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [showSavedConfirm, setShowSavedConfirm] = useState(false);
  const [viewTab, setViewTab] = useState<"week" | "month">("week");
  const [viewMonth, setViewMonth] = useState(new Date());
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };
  const [bulkSlotDuration, setBulkSlotDuration] = useState(30);
  const [bulkBufferTime, setBulkBufferTime] = useState(5);
  const [bulkMaxPatients, setBulkMaxPatients] = useState(1);

  useEffect(() => {
    if (open) {
      loadSchedule();
      loadTemplates();
    }
  }, [open, doctorId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/config/doctors/${doctorId}/availability`, { credentials: "include" });
      const data = await res.json();
      const weekSchedule: WeekSchedule = {};

      if (data.success && data.data) {
        const raw = data.data;
        // API returns keyed object { MONDAY: {...}, TUESDAY: null, ... }
        // OR may return array (legacy) — handle both
        const isArray = Array.isArray(raw);
        DAYS.forEach(day => {
          const existing = isArray
            ? raw.find((a: any) => a.day === day)
            : raw[day];
          if (existing && existing.startTime) {
            weekSchedule[day] = {
              enabled: existing.isActive !== false,
              startTime: existing.startTime,
              endTime: existing.endTime,
              slotDuration: existing.slotDuration || 30,
              bufferTime: existing.bufferTime ?? 0,
              maxPatientsPerSlot: existing.maxPatientsPerSlot || 1,
              breaks: existing.breaks
                ? (typeof existing.breaks === "string" ? JSON.parse(existing.breaks) : existing.breaks)
                : [],
            };
          } else {
            weekSchedule[day] = { ...defaultDaySchedule };
          }
        });
      } else {
        DAYS.forEach(day => (weekSchedule[day] = { ...defaultDaySchedule }));
      }
      setSchedule(weekSchedule);
    } catch (err) {
      console.error("Failed to load schedule", err);
      const emptySchedule: WeekSchedule = {};
      DAYS.forEach(day => (emptySchedule[day] = { ...defaultDaySchedule }));
      setSchedule(emptySchedule);
    }
    setLoading(false);
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch(`/api/config/schedule-templates`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setTemplates(data.data || []);
    } catch (err) {
      console.error("Failed to load templates", err);
    }
  };

  const updateDay = (day: DayOfWeek, updates: Partial<DaySchedule>) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates, breaks: updates.breaks !== undefined ? updates.breaks : (prev[day]?.breaks || []) },
    }));
  };

  const copyToAll = (sourceDay: DayOfWeek) => {
    const source = schedule[sourceDay];
    const updated: WeekSchedule = {};
    DAYS.forEach(day => {
      updated[day] = { ...source };
    });
    setSchedule(updated);
  };

  const applyPresetToWeekdays = (preset: keyof typeof QUICK_PRESETS) => {
    const presetData = QUICK_PRESETS[preset];
    const updated: WeekSchedule = { ...schedule };
    ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].forEach(day => {
      updated[day as DayOfWeek] = { ...presetData };
    });
    setSchedule(updated);
  };

  const applyPresetToWeekend = (preset: keyof typeof QUICK_PRESETS) => {
    const presetData = QUICK_PRESETS[preset];
    const updated: WeekSchedule = { ...schedule };
    ["SATURDAY", "SUNDAY"].forEach(day => {
      updated[day as DayOfWeek] = { ...presetData };
    });
    setSchedule(updated);
  };

  const applyPresetToAllDays = (preset: keyof typeof QUICK_PRESETS) => {
    const presetData = QUICK_PRESETS[preset];
    const updated: WeekSchedule = {};
    DAYS.forEach(day => {
      updated[day] = { ...presetData };
    });
    setSchedule(updated);
  };

  const quickSetupFullWeek = () => {
    const updated: WeekSchedule = {};
    DAYS.forEach(day => {
      if (day === "SATURDAY" || day === "SUNDAY") {
        updated[day] = { ...QUICK_PRESETS.halfDay };
      } else {
        updated[day] = { ...QUICK_PRESETS.fullDay };
      }
    });
    setSchedule(updated);
  };

  const applyBulkEdit = () => {
    const updated: WeekSchedule = { ...schedule };
    DAYS.forEach(day => {
      if (updated[day]?.enabled) {
        updated[day] = {
          ...updated[day],
          slotDuration: bulkSlotDuration,
          bufferTime: bulkBufferTime,
          maxPatientsPerSlot: bulkMaxPatients,
        };
      }
    });
    setSchedule(updated);
    setShowBulkEdit(false);
  };

  const getScheduleStats = () => {
    let totalSlots = 0;
    let enabledDays = 0;
    let totalHours = 0;

    DAYS.forEach(day => {
      const daySchedule = schedule[day];
      if (daySchedule?.enabled && daySchedule.startTime && daySchedule.endTime) {
        enabledDays++;
        const slots = generateSlots(daySchedule);
        totalSlots += slots.length;
        
        const [startH, startM] = daySchedule.startTime.split(":").map(Number);
        const [endH, endM] = daySchedule.endTime.split(":").map(Number);
        const hours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
        totalHours += hours;
      }
    });

    return { totalSlots, enabledDays, totalHours, avgSlotsPerDay: enabledDays > 0 ? Math.round(totalSlots / enabledDays) : 0 };
  };

  const validateSchedule = (): string[] => {
    const errors: string[] = [];
    DAYS.forEach(day => {
      const daySchedule = schedule[day];
      if (daySchedule?.enabled) {
        if (!daySchedule.startTime || !daySchedule.endTime) {
          errors.push(`${DAY_LABELS[day]}: Missing start or end time`);
        } else {
          const [startH, startM] = daySchedule.startTime.split(":").map(Number);
          const [endH, endM] = daySchedule.endTime.split(":").map(Number);
          if (startH * 60 + startM >= endH * 60 + endM) {
            errors.push(`${DAY_LABELS[day]}: End time must be after start time`);
          }
        }
        if (daySchedule.slotDuration < 5 || daySchedule.slotDuration > 120) {
          errors.push(`${DAY_LABELS[day]}: Slot duration must be 5-120 minutes`);
        }
        // Check break overlaps
        (daySchedule.breaks || []).forEach((brk, idx) => {
          const [bStartH, bStartM] = brk.start.split(":").map(Number);
          const [bEndH, bEndM] = brk.end.split(":").map(Number);
          if (bStartH * 60 + bStartM >= bEndH * 60 + bEndM) {
            errors.push(`${DAY_LABELS[day]}: Break ${idx + 1} end must be after start`);
          }
        });
      }
    });
    return errors;
  };

  const addBreak = (day: DayOfWeek) => {
    const daySchedule = schedule[day] || defaultDaySchedule;
    updateDay(day, {
      breaks: [...(daySchedule.breaks || []), { start: "12:00", end: "13:00" }],
    });
  };

  const removeBreak = (day: DayOfWeek, index: number) => {
    const daySchedule = schedule[day] || defaultDaySchedule;
    updateDay(day, {
      breaks: (daySchedule.breaks || []).filter((_, i) => i !== index),
    });
  };

  const updateBreak = (day: DayOfWeek, index: number, field: "start" | "end", value: string) => {
    const daySchedule = schedule[day] || defaultDaySchedule;
    const newBreaks = [...(daySchedule.breaks || [])];
    if (newBreaks[index]) {
      newBreaks[index][field] = value;
      updateDay(day, { breaks: newBreaks });
    }
  };

  const generateSlots = (daySchedule: DaySchedule): string[] => {
    if (!daySchedule.enabled || !daySchedule.startTime || !daySchedule.endTime) return [];
    const slots: string[] = [];
    const [startH, startM] = daySchedule.startTime.split(":").map(Number);
    const [endH, endM] = daySchedule.endTime.split(":").map(Number);
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + daySchedule.slotDuration <= endMinutes) {
      const slotTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, "0")}:${String(currentMinutes % 60).padStart(2, "0")}`;
      
      // Check if slot overlaps with any break
      const isInBreak = (daySchedule.breaks || []).some(brk => {
        const [bStartH, bStartM] = brk.start.split(":").map(Number);
        const [bEndH, bEndM] = brk.end.split(":").map(Number);
        const breakStart = bStartH * 60 + bStartM;
        const breakEnd = bEndH * 60 + bEndM;
        return currentMinutes >= breakStart && currentMinutes < breakEnd;
      });

      if (!isInBreak) {
        slots.push(slotTime);
      }

      currentMinutes += daySchedule.slotDuration + daySchedule.bufferTime;
    }

    return slots;
  };

  const handleSave = async () => {
    const errors = validateSchedule();
    if (errors.length > 0) {
      alert("Please fix the following errors:\n\n" + errors.join("\n"));
      return;
    }

    setSaving(true);
    try {
      const payload = DAYS.filter(day => schedule[day]?.enabled).map(day => ({
        day,
        startTime: schedule[day].startTime,
        endTime: schedule[day].endTime,
        slotDuration: schedule[day].slotDuration,
        bufferTime: schedule[day].bufferTime,
        maxPatientsPerSlot: schedule[day].maxPatientsPerSlot,
        breaks: JSON.stringify(schedule[day].breaks || []),
        generatedSlots: JSON.stringify(generateSlots(schedule[day])),
        isActive: true,
      }));

      const res = await fetch(`/api/config/doctors/${doctorId}/availability`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: payload }),
      });

      const data = await res.json();
      if (data.success) {
        setShowSavedConfirm(true);
      } else {
        showToast("error", data.message || "Failed to save schedule");
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to save schedule");
    }
    setSaving(false);
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      showToast("error", "Please enter a template name");
      return;
    }

    try {
      const res = await fetch(`/api/config/schedule-templates`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName,
          scheduleData: JSON.stringify(schedule),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewTemplateName("");
        setShowSaveTemplate(false);
        loadTemplates();
        showToast("success", "Template saved!");
      } else {
        showToast("error", data.message || "Failed to save template");
      }
    } catch {
      showToast("error", "Failed to save template");
    }
  };

  const JS_DAY_TO_PRISMA: Record<number, DayOfWeek> = { 0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY", 4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY" };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const getDayScheduleForDate = (date: Date): DaySchedule | null => {
    const prismaDay = JS_DAY_TO_PRISMA[date.getDay()];
    const ds = schedule[prismaDay];
    return ds?.enabled ? ds : null;
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Delete this template?")) return;
    setDeletingTemplate(templateId);
    try {
      const res = await fetch(`/api/config/schedule-templates/${templateId}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      } else {
        showToast("error", data.message || "Failed to delete template");
      }
    } catch {
      showToast("error", "Failed to delete template");
    }
    setDeletingTemplate(null);
  };

  const handleRenameTemplate = async (templateId: string) => {
    if (!editTemplateName.trim()) return;
    try {
      const res = await fetch(`/api/config/schedule-templates/${templateId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editTemplateName }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, name: editTemplateName } : t));
        setEditingTemplate(null);
        setEditTemplateName("");
      } else {
        alert(data.message || "Failed to rename template");
      }
    } catch (err: any) {
      alert("Failed to rename template");
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const templateSchedule = JSON.parse(template.scheduleData);
      setSchedule(templateSchedule);
      setSelectedTemplate(templateId);
    }
  };

  const renderDayEditPopup = () => {
    if (!selectedCalendarDate || typeof document === "undefined") return null;
    const editDay = JS_DAY_TO_PRISMA[selectedCalendarDate.getDay()];
    const editDs = schedule[editDay] || { ...defaultDaySchedule };
    const editLabel = selectedCalendarDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    const dayOfWeekLabel = selectedCalendarDate.toLocaleDateString("en", { weekday: "long" });
    const editSlots = generateSlots(editDs);
    return createPortal(
      <>
        <style>{`
          .dep-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99998;}
          .dep-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:16px;width:92%;max-width:520px;max-height:88vh;overflow-y:auto;z-index:99999;box-shadow:0 24px 64px rgba(0,0,0,0.3);display:flex;flex-direction:column;font-family:'Inter',sans-serif;}
          .dep-head{padding:20px 20px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
          .dep-title{font-size:16px;font-weight:700;color:#1e293b;}
          .dep-note{font-size:12px;color:#7c3aed;margin-top:4px;}
          .dep-close{width:32px;height:32px;border:none;background:#f1f5f9;border-radius:8px;cursor:pointer;font-size:16px;color:#64748b;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
          .dep-close:hover{background:#e2e8f0;}
          .dep-body{padding:20px;display:flex;flex-direction:column;gap:18px;flex:1;}
          .dep-toggle{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;background:#f8fafc;cursor:pointer;}
          .dep-toggle input{width:17px;height:17px;cursor:pointer;accent-color:#7c3aed;}
          .dep-on{font-size:14px;font-weight:600;color:#16a34a;}
          .dep-off{font-size:14px;font-weight:600;color:#ef4444;}
          .dep-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
          .dep-field{display:flex;flex-direction:column;gap:5px;}
          .dep-field label{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;}
          .dep-field input{padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;width:100%;transition:border-color .15s;}
          .dep-field input:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.15);}
          .dep-breaks{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;}
          .dep-breaks-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:12px;font-weight:700;color:#92400e;}
          .dep-add-break{padding:4px 12px;background:#fef3c7;color:#d97706;border:1px solid #fde68a;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;}
          .dep-add-break:hover{background:#fde68a;}
          .dep-no-breaks{font-size:12px;color:#94a3b8;text-align:center;padding:8px 0;}
          .dep-break-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
          .dep-break-row input{padding:7px 10px;border:1px solid #fde68a;border-radius:7px;font-size:13px;flex:1;background:#fff;}
          .dep-break-row span{font-size:12px;color:#94a3b8;}
          .dep-rm-break{width:26px;height:26px;border:none;background:#fef2f2;color:#ef4444;border-radius:6px;cursor:pointer;font-size:12px;flex-shrink:0;}
          .dep-rm-break:hover{background:#fee2e2;}
          .dep-preview{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:14px;}
          .dep-preview-title{font-size:12px;font-weight:700;color:#6d28d9;margin-bottom:8px;}
          .dep-chips{display:flex;flex-wrap:wrap;gap:5px;}
          .dep-chip{padding:4px 10px;background:#ede9fe;color:#5b21b6;border-radius:5px;font-size:11px;font-weight:600;}
          .dep-chip-more{padding:4px 10px;background:#f1f5f9;color:#64748b;border-radius:5px;font-size:11px;font-weight:600;}
          .dep-footer{padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;gap:8px;justify-content:flex-end;}
          .dep-cancel{padding:9px 20px;border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;}
          .dep-cancel:hover{background:#f8fafc;}
          .dep-save{padding:9px 24px;border:none;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(124,58,237,.3);}
          .dep-save:hover{background:linear-gradient(135deg,#6d28d9,#5b21b6);}
        `}</style>
        <div className="dep-overlay" onClick={() => setSelectedCalendarDate(null)} />
        <div className="dep-popup">
          <div className="dep-head">
            <div>
              <div className="dep-title">✏️ {editLabel}</div>
              <div className="dep-note">Applies to all <strong>{dayOfWeekLabel}s</strong> in the schedule</div>
            </div>
            <button className="dep-close" onClick={() => setSelectedCalendarDate(null)}>✕</button>
          </div>
          <div className="dep-body">
            <label className="dep-toggle">
              <input type="checkbox" checked={editDs.enabled} onChange={e => updateDay(editDay, { enabled: e.target.checked })} />
              <span className={editDs.enabled ? "dep-on" : "dep-off"}>{editDs.enabled ? `✅ ${dayOfWeekLabel} — Working Day` : `❌ ${dayOfWeekLabel} — Day Off`}</span>
            </label>
            {editDs.enabled && (
              <>
                <div className="dep-grid">
                  <div className="dep-field"><label>Start Time</label><input type="time" value={editDs.startTime} onChange={e => updateDay(editDay, { startTime: e.target.value })} /></div>
                  <div className="dep-field"><label>End Time</label><input type="time" value={editDs.endTime} onChange={e => updateDay(editDay, { endTime: e.target.value })} /></div>
                  <div className="dep-field"><label>Slot Duration (min)</label><input type="number" value={editDs.slotDuration} min="5" max="120" onChange={e => updateDay(editDay, { slotDuration: parseInt(e.target.value) || 30 })} /></div>
                  <div className="dep-field"><label>Buffer Time (min)</label><input type="number" value={editDs.bufferTime} min="0" max="30" onChange={e => updateDay(editDay, { bufferTime: parseInt(e.target.value) || 0 })} /></div>
                  <div className="dep-field"><label>Max Patients / Slot</label><input type="number" value={editDs.maxPatientsPerSlot} min="1" max="10" onChange={e => updateDay(editDay, { maxPatientsPerSlot: parseInt(e.target.value) || 1 })} /></div>
                </div>
                <div className="dep-breaks">
                  <div className="dep-breaks-head"><span>☕ Break Times</span><button className="dep-add-break" onClick={() => addBreak(editDay)}>+ Add Break</button></div>
                  {(editDs.breaks || []).length === 0 && <div className="dep-no-breaks">No breaks configured</div>}
                  {(editDs.breaks || []).map((brk, idx) => (
                    <div key={idx} className="dep-break-row">
                      <input type="time" value={brk.start} onChange={e => updateBreak(editDay, idx, "start", e.target.value)} />
                      <span>to</span>
                      <input type="time" value={brk.end} onChange={e => updateBreak(editDay, idx, "end", e.target.value)} />
                      <button className="dep-rm-break" onClick={() => removeBreak(editDay, idx)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="dep-preview">
                  <div className="dep-preview-title">⚡ {editSlots.length} Slots Generated</div>
                  <div className="dep-chips">
                    {editSlots.slice(0, 10).map((s, i) => <span key={i} className="dep-chip">{s}</span>)}
                    {editSlots.length > 10 && <span className="dep-chip-more">+{editSlots.length - 10} more</span>}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="dep-footer">
            <button className="dep-cancel" onClick={() => setSelectedCalendarDate(null)}>Close</button>
            <button className="dep-save" onClick={() => setSelectedCalendarDate(null)}>Done</button>
          </div>
        </div>
      </>,
      document.body
    );
  };

  const getScheduleSummary = () => {
    const activeDays = DAYS.filter(d => schedule[d]?.enabled);
    const totalSlots = activeDays.reduce((acc, d) => acc + generateSlots(schedule[d]).length, 0);
    const totalMinutes = activeDays.reduce((acc, d) => {
      const ds = schedule[d];
      const [sh, sm] = ds.startTime.split(":").map(Number);
      const [eh, em] = ds.endTime.split(":").map(Number);
      return acc + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }, 0);
    return { activeDays, totalSlots, totalHours: (totalMinutes / 60).toFixed(1) };
  };

  if (!open) return null;

  return (
    <>
      <div className="sched-overlay" onClick={onClose} />
      <div className="sched-modal">
        {toast && (
          <div className={`sched-toast ${toast.type}`}>
            <span>{toast.type === "success" ? "✓" : "✕"}</span>
            {toast.msg}
          </div>
        )}
        <div className="sched-header">
          <div>
            <h2 className="sched-title">{editMode === "view" ? "View Schedule" : editMode === "create" ? "Create Schedule" : "Edit Schedule"}</h2>
            <p className="sched-subtitle">{doctorName}</p>
          </div>
          <button className="sched-close" onClick={onClose}><X size={20} /></button>
        </div>

        {editMode !== "view" && (
        <div className="sched-tabs">
          <button className={`sched-tab ${activeTab === "schedule" ? "active" : ""}`} onClick={() => setActiveTab("schedule")}>
            <Calendar size={16} /> Weekly Schedule
          </button>
          <button className={`sched-tab ${activeTab === "monthly" ? "active" : ""}`} onClick={() => setActiveTab("monthly")}>
            <Activity size={16} /> Monthly View
          </button>
          <button className={`sched-tab ${activeTab === "templates" ? "active" : ""}`} onClick={() => setActiveTab("templates")}>
            <FileText size={16} /> Templates
          </button>
        </div>
        )}

        {editMode !== "view" && (
        <div className="sched-body">
          {loading ? (
            <div className="sched-loading">Loading schedule...</div>
          ) : activeTab === "schedule" ? (
            <>
              {/* Quick Setup Section */}
              <div className="sched-quick-setup">
                <h3 className="sched-section-title"><Zap size={15} style={{display:'inline',verticalAlign:'middle',marginRight:6}} /> Quick Setup</h3>
                <div className="sched-quick-grid">
                  <button className="sched-quick-btn" onClick={quickSetupFullWeek}>
                    <Zap size={16} />
                    <div>
                      <strong>Full Week Setup</strong>
                      <span>Mon-Fri: 9AM-5PM, Sat-Sun: 9AM-1PM</span>
                    </div>
                  </button>
                  <button className="sched-quick-btn" onClick={() => applyPresetToWeekdays("fullDay")}>
                    <Calendar size={16} />
                    <div>
                      <strong>Weekdays Only</strong>
                      <span>Mon-Fri: 9AM-5PM (1hr lunch)</span>
                    </div>
                  </button>
                  <button className="sched-quick-btn" onClick={() => applyPresetToAllDays("morningShift")}>
                    <Clock size={16} />
                    <div>
                      <strong>Morning Shift</strong>
                      <span>All days: 8AM-2PM</span>
                    </div>
                  </button>
                  <button className="sched-quick-btn" onClick={() => applyPresetToAllDays("eveningShift")}>
                    <Clock size={16} />
                    <div>
                      <strong>Evening Shift</strong>
                      <span>All days: 2PM-8PM</span>
                    </div>
                  </button>
                  <button className="sched-quick-btn" onClick={() => applyPresetToAllDays("emergency24x7")}>
                    <AlertTriangle size={16} />
                    <div>
                      <strong>24/7 Emergency</strong>
                      <span>Round-the-clock availability</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="sched-template-select">
                <label>Or Apply Saved Template:</label>
                <select value={selectedTemplate} onChange={(e) => applyTemplate(e.target.value)}>
                  <option value="">-- Select Template --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Statistics Dashboard */}
              {(() => {
                const stats = getScheduleStats();
                return stats.enabledDays > 0 ? (
                  <div className="sched-stats-panel">
                    <div className="sched-stat-card">
                      <div className="sched-stat-icon" style={{background: "#E6F4F4", color: "#0E898F"}}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <div className="sched-stat-value">{stats.enabledDays}</div>
                        <div className="sched-stat-label">Active Days</div>
                      </div>
                    </div>
                    <div className="sched-stat-card">
                      <div className="sched-stat-icon" style={{background: "#f0fdf4", color: "#16a34a"}}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <div className="sched-stat-value">{stats.totalSlots}</div>
                        <div className="sched-stat-label">Total Slots/Week</div>
                      </div>
                    </div>
                    <div className="sched-stat-card">
                      <div className="sched-stat-icon" style={{background: "#fef3c7", color: "#d97706"}}>
                        <Zap size={18} />
                      </div>
                      <div>
                        <div className="sched-stat-value">{stats.avgSlotsPerDay}</div>
                        <div className="sched-stat-label">Avg Slots/Day</div>
                      </div>
                    </div>
                    <div className="sched-stat-card">
                      <div className="sched-stat-icon" style={{background: "#fae8ff", color: "#a855f7"}}>
                        <Activity size={18} />
                      </div>
                      <div>
                        <div className="sched-stat-value">{stats.totalHours.toFixed(1)}h</div>
                        <div className="sched-stat-label">Coverage/Week</div>
                      </div>
                    </div>
                    <button className="sched-bulk-edit-btn" onClick={() => setShowBulkEdit(!showBulkEdit)}>
                      <Settings size={14} /> Bulk Edit
                    </button>
                  </div>
                ) : null;
              })()}

              {/* Bulk Edit Panel */}
              {showBulkEdit && (
                <div className="sched-bulk-panel">
                  <div className="sched-bulk-header">
                    <strong>⚙️ Bulk Edit Settings</strong>
                    <span>Apply to all enabled days</span>
                  </div>
                  <div className="sched-bulk-fields">
                    <div className="sched-bulk-field">
                      <label>Slot Duration (min)</label>
                      <input type="number" value={bulkSlotDuration} onChange={(e) => setBulkSlotDuration(parseInt(e.target.value) || 30)} min="5" max="120" />
                    </div>
                    <div className="sched-bulk-field">
                      <label>Buffer Time (min)</label>
                      <input type="number" value={bulkBufferTime} onChange={(e) => setBulkBufferTime(parseInt(e.target.value) || 0)} min="0" max="30" />
                    </div>
                    <div className="sched-bulk-field">
                      <label>Max Patients/Slot</label>
                      <input type="number" value={bulkMaxPatients} onChange={(e) => setBulkMaxPatients(parseInt(e.target.value) || 1)} min="1" max="10" />
                    </div>
                    <button className="sched-btn-primary" onClick={applyBulkEdit}>Apply to All</button>
                    <button className="sched-btn-secondary" onClick={() => setShowBulkEdit(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="sched-table">
                <div className="sched-table-head">
                  <div>Day</div>
                  <div>Working Hours</div>
                  <div>Slot</div>
                  <div>Buffer</div>
                  <div>Max/Slot</div>
                  <div>Breaks</div>
                  <div>Generated</div>
                  <div></div>
                </div>
                {DAYS.map(day => {
                  const daySchedule = schedule[day] || defaultDaySchedule;
                  const slots = generateSlots(daySchedule);
                  return (
                    <div key={day} className={`sched-tr ${daySchedule.enabled ? "str-on" : "str-off"}`}>
                      <div className="std-day">
                        <label className="std-toggle-label">
                          <input type="checkbox" checked={daySchedule.enabled} onChange={(e) => updateDay(day, { enabled: e.target.checked })} />
                          <span className={`std-dayname ${daySchedule.enabled ? "on" : ""}`}>{DAY_LABELS[day]}</span>
                        </label>
                      </div>
                      {daySchedule.enabled ? (
                        <>
                          <div className="std-times">
                            <input type="time" className="std-time" value={daySchedule.startTime} onChange={(e) => updateDay(day, { startTime: e.target.value })} />
                            <span className="std-sep">–</span>
                            <input type="time" className="std-time" value={daySchedule.endTime} onChange={(e) => updateDay(day, { endTime: e.target.value })} />
                          </div>
                          <div className="std-num">
                            <input type="number" className="std-ninput" value={daySchedule.slotDuration} min="5" max="120" onChange={(e) => updateDay(day, { slotDuration: parseInt(e.target.value) || 30 })} />
                            <span className="std-unit">min</span>
                          </div>
                          <div className="std-num">
                            <input type="number" className="std-ninput" value={daySchedule.bufferTime} min="0" max="30" onChange={(e) => updateDay(day, { bufferTime: parseInt(e.target.value) || 0 })} />
                            <span className="std-unit">min</span>
                          </div>
                          <div className="std-num">
                            <input type="number" className="std-ninput" value={daySchedule.maxPatientsPerSlot} min="1" max="10" onChange={(e) => updateDay(day, { maxPatientsPerSlot: parseInt(e.target.value) || 1 })} />
                            <span className="std-unit">pt</span>
                          </div>
                          <div className="std-breaks">
                            {(daySchedule.breaks || []).map((brk, idx) => (
                              <div key={idx} className="std-break-row">
                                <input type="time" className="std-time sm" value={brk.start} onChange={(e) => updateBreak(day, idx, "start", e.target.value)} />
                                <span className="std-sep">–</span>
                                <input type="time" className="std-time sm" value={brk.end} onChange={(e) => updateBreak(day, idx, "end", e.target.value)} />
                                <button className="std-rm-brk" onClick={() => removeBreak(day, idx)}><X size={10} /></button>
                              </div>
                            ))}
                            <button className="std-add-brk" onClick={() => addBreak(day)}><Plus size={11} /> Break</button>
                          </div>
                          <div className="std-slots-count">
                            <div className="stsc-top"><span className="stsc-num">{slots.length}</span><span className="stsc-lbl">slots</span></div>
                            {slots.length > 0 && <div className="stsc-chips">{slots.slice(0,3).map((s,i)=><span key={i} className="stsc-chip">{s}</span>)}{slots.length > 3 && <span className="stsc-more">+{slots.length-3}</span>}</div>}
                          </div>
                          <button className="std-copy" onClick={() => copyToAll(day)} title="Copy to all days"><Copy size={13} /></button>
                        </>
                      ) : (
                        <div className="std-off-label">Day Off — not available for bookings</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeTab === "monthly" ? (() => {
            const days = getMonthDays(calendarMonth);
            const monthName = calendarMonth.toLocaleString("default", { month: "long", year: "numeric" });
            const today = new Date();
            const scheduledDays = days.filter(d => d && getDayScheduleForDate(d));
            const totalSlotsMonth = scheduledDays.reduce((acc, d) => {
              const ds = getDayScheduleForDate(d!);
              return acc + (ds ? generateSlots(ds).length : 0);
            }, 0);
            const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
            return (
              <div className="sched-monthly">
                <div className="sched-month-nav">
                  <button className="sched-month-arrow" onClick={() => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
                  <h3 className="sched-month-title">{monthName}</h3>
                  <button className="sched-month-arrow" onClick={() => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
                </div>
                <div className="sched-month-stats-row">
                  <div className="sched-month-stat-box"><span className="smv">{scheduledDays.length}</span><span className="sml">Working Days</span></div>
                  <div className="sched-month-stat-box"><span className="smv">{daysInMonth - scheduledDays.length}</span><span className="sml">Off Days</span></div>
                  <div className="sched-month-stat-box green"><span className="smv">{totalSlotsMonth}</span><span className="sml">Total Slots</span></div>
                  <div className="sched-month-stat-box purple"><span className="smv">{scheduledDays.length > 0 ? Math.round(totalSlotsMonth / scheduledDays.length) : 0}</span><span className="sml">Avg/Day</span></div>
                </div>
                <div className="sched-cal-dow-row">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="sched-cal-dow">{d}</div>)}</div>
                <div className="sched-cal-grid">
                  {days.map((date, i) => {
                    if (!date) return <div key={`e${i}`} className="sched-cal-cell scc-empty" />;
                    const ds = getDayScheduleForDate(date);
                    const slots = ds ? generateSlots(ds) : [];
                    const isToday = date.toDateString() === today.toDateString();
                    const isSelected = selectedCalendarDate?.toDateString() === date.toDateString();
                    return (
                      <div
                        key={date.toISOString()}
                        className={`sched-cal-cell ${ds ? "scc-active" : "scc-off"} ${isToday ? "scc-today" : ""} ${isSelected ? "scc-selected" : ""}`}
                        onClick={() => setSelectedCalendarDate(isSelected ? null : date)}
                        title={`Edit ${date.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}`}
                      >
                        <div className="scc-date">{date.getDate()}</div>
                        {ds ? (
                          <>
                            <div className="scc-time">{ds.startTime}–{ds.endTime}</div>
                            <div className="scc-slots">{slots.length} slots</div>
                            {(ds.breaks || []).length > 0 && <div className="scc-breaks">{ds.breaks.length} break{ds.breaks.length > 1 ? "s" : ""}</div>}
                          </>
                        ) : (
                          <div className="scc-off-label">+ Add</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="sched-cal-legend">
                  <span className="scl-item"><span className="scl-dot active" />Working Day</span>
                  <span className="scl-item"><span className="scl-dot off" />Off Day</span>
                  <span className="scl-item"><span className="scl-dot today" />Today</span>
                </div>
              </div>
            );
          })() : (
            <div className="sched-templates">
              <div className="sched-template-actions">
                <button className="sched-btn-secondary" onClick={() => setShowSaveTemplate(!showSaveTemplate)}>
                  <Save size={14} /> Save Current as Template
                </button>
              </div>

              {showSaveTemplate && (
                <div className="sched-save-template">
                  <input
                    type="text"
                    placeholder="Template name (e.g., Morning Shift)"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                  />
                  <button className="sched-btn-primary" onClick={handleSaveAsTemplate}>Save</button>
                  <button className="sched-btn-secondary" onClick={() => setShowSaveTemplate(false)}>Cancel</button>
                </div>
              )}

              <div className="sched-template-list">
                {templates.length === 0 ? (
                  <div className="sched-empty">No templates saved yet.<br/>Configure a schedule and click "Save as Template" above.</div>
                ) : (
                  templates.map(t => (
                    <div key={t.id} className="sched-template-item">
                      {editingTemplate === t.id ? (
                        <div className="sched-template-edit-row">
                          <input className="sched-template-edit-input" value={editTemplateName} onChange={e => setEditTemplateName(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && handleRenameTemplate(t.id)} />
                          <button className="sched-tpl-btn green" onClick={() => handleRenameTemplate(t.id)}><Check size={13} /></button>
                          <button className="sched-tpl-btn gray" onClick={() => setEditingTemplate(null)}><X size={13} /></button>
                        </div>
                      ) : (
                        <div className="sched-template-info">
                          <div className="sched-template-name">{t.name}</div>
                          {t.description && <div className="sched-template-desc">{t.description}</div>}
                        </div>
                      )}
                      <div className="sched-template-btns">
                        <button className="sched-tpl-btn blue" title="Apply" onClick={() => { applyTemplate(t.id); setActiveTab("schedule"); }}>Apply</button>
                        <button className="sched-tpl-btn gray" title="Rename" onClick={() => { setEditingTemplate(t.id); setEditTemplateName(t.name); }}><Pencil size={12} /></button>
                        <button className="sched-tpl-btn red" title="Delete" disabled={deletingTemplate === t.id} onClick={() => handleDeleteTemplate(t.id)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {editMode === "view" ? (
          <>
            {/* View mode sub-tabs */}
            <div className="vm-tabs">
              <button className={`vm-tab ${viewTab === "week" ? "active" : ""}`} onClick={() => setViewTab("week")}>
                <Calendar size={14} /> Weekly Summary
              </button>
              <button className={`vm-tab ${viewTab === "month" ? "active" : ""}`} onClick={() => setViewTab("month")}>
                <Activity size={14} /> Monthly View
              </button>
              {viewTab === "month" && (
                <div className="vm-month-nav">
                  <button className="vm-nav-btn" onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
                  <span className="vm-month-label">{viewMonth.toLocaleString("default", { month: "long", year: "numeric" })}</span>
                  <button className="vm-nav-btn" onClick={() => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
                </div>
              )}
            </div>

            <div className="sched-body">
              {loading ? (
                <div className="sched-loading">Loading schedule...</div>
              ) : DAYS.filter(d => schedule[d]?.enabled).length === 0 ? (
                <div className="vm-empty">
                  <div className="vm-empty-icon">📅</div>
                  <div className="vm-empty-title">No schedule configured yet</div>
                  <div className="vm-empty-sub">Click &quot;Edit Schedule&quot; below to set up this doctor&apos;s availability</div>
                </div>
              ) : viewTab === "week" ? (
                <div className="view-mode">
                  {(() => {
                    const activeDays = DAYS.filter(d => schedule[d]?.enabled);
                    const totalSlots = activeDays.reduce((acc, d) => acc + generateSlots(schedule[d]).length, 0);
                    const totalHours = (activeDays.reduce((acc, d) => {
                      const ds = schedule[d];
                      const [sh, sm] = ds.startTime.split(":").map(Number);
                      const [eh, em] = ds.endTime.split(":").map(Number);
                      return acc + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
                    }, 0) / 60).toFixed(1);
                    return (
                      <>
                        <div className="view-stats">
                          <div className="view-stat">
                            <span className="view-stat-v">{activeDays.length}<span className="view-stat-of">/ 7</span></span>
                            <span className="view-stat-l">Working Days</span>
                          </div>
                          <div className="view-stat green">
                            <span className="view-stat-v">{totalSlots}</span>
                            <span className="view-stat-l">Slots / Week</span>
                          </div>
                          <div className="view-stat blue">
                            <span className="view-stat-v">{totalHours}h</span>
                            <span className="view-stat-l">Coverage / Week</span>
                          </div>
                          <div className="view-stat purple">
                            <span className="view-stat-v">{activeDays.length > 0 ? Math.round(totalSlots / activeDays.length) : 0}</span>
                            <span className="view-stat-l">Avg Slots / Day</span>
                          </div>
                        </div>
                        <div className="vw-table">
                          {DAYS.map(day => {
                            const ds = schedule[day];
                            const isActive = ds?.enabled;
                            const slots = isActive ? generateSlots(ds) : [];
                            return (
                              <div key={day} className={`vw-tr ${isActive ? "vwtr-on" : "vwtr-off"}`}>
                                <div className="vw-day">
                                  <span className={`vw-day-pill ${isActive ? "on" : "off"}`}>{DAY_LABELS[day]}</span>
                                </div>
                                {isActive ? (
                                  <>
                                    <div className="vw-time">
                                      <Clock size={12} style={{color:'#0E898F',flexShrink:0}} />
                                      <span>{ds.startTime} – {ds.endTime}</span>
                                    </div>
                                    <div className="vw-meta">
                                      <span className="vwm-tag">{ds.slotDuration}min/slot</span>
                                      {ds.bufferTime > 0 && <span className="vwm-tag">{ds.bufferTime}min buf</span>}
                                      {ds.maxPatientsPerSlot > 1 && <span className="vwm-tag">{ds.maxPatientsPerSlot} pt/slot</span>}
                                      {(ds.breaks || []).length > 0 && <span className="vwm-tag brk">{ds.breaks.length} break{ds.breaks.length > 1 ? "s" : ""}</span>}
                                    </div>
                                    <div className="vw-slots">
                                      <span className="vws-count">{slots.length}</span>
                                      <span className="vws-lbl">slots</span>
                                    </div>
                                    <div className="vw-chips">
                                      {slots.slice(0, 5).map((s, i) => <span key={i} className="vwc-chip">{s}</span>)}
                                      {slots.length > 5 && <span className="vwc-more">+{slots.length - 5}</span>}
                                    </div>
                                  </>
                                ) : (
                                  <div className="vw-off">Day Off</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (() => {
                // Monthly view
                const year = viewMonth.getFullYear();
                const month = viewMonth.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = new Date();
                const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
                // pad to full rows
                while (cells.length % 7 !== 0) cells.push(null);

                const getDsForDay = (dayNum: number) => {
                  const jsDay = new Date(year, month, dayNum).getDay();
                  const prismaDay = (["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"] as DayOfWeek[])[jsDay];
                  const ds = schedule[prismaDay];
                  return ds?.enabled ? ds : null;
                };

                const workingDaysInMonth = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => getDsForDay(d));
                const totalMonthSlots = workingDaysInMonth.reduce((acc, d) => {
                  const ds = getDsForDay(d)!;
                  return acc + generateSlots(ds).length;
                }, 0);

                return (
                  <div className="vm-cal">
                    <div className="vm-cal-stats">
                      <div className="vm-cal-stat"><span className="vmcs-v">{workingDaysInMonth.length}</span><span className="vmcs-l">Working Days</span></div>
                      <div className="vm-cal-stat off"><span className="vmcs-v">{daysInMonth - workingDaysInMonth.length}</span><span className="vmcs-l">Days Off</span></div>
                      <div className="vm-cal-stat green"><span className="vmcs-v">{totalMonthSlots}</span><span className="vmcs-l">Total Slots</span></div>
                      <div className="vm-cal-stat purple"><span className="vmcs-v">{workingDaysInMonth.length > 0 ? Math.round(totalMonthSlots / workingDaysInMonth.length) : 0}</span><span className="vmcs-l">Avg / Day</span></div>
                    </div>
                    <div className="vm-cal-dow">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}</div>
                    <div className="vm-cal-grid">
                      {cells.map((day, i) => {
                        if (!day) return <div key={`e${i}`} className="vm-cell empty" />;
                        const ds = getDsForDay(day);
                        const slots = ds ? generateSlots(ds) : [];
                        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                        return (
                          <div key={day} className={`vm-cell ${ds ? "working" : "off"} ${isToday ? "today" : ""}`}>
                            <div className="vm-cell-date">{day}</div>
                            {ds ? (
                              <>
                                <div className="vm-cell-time">{ds.startTime}–{ds.endTime}</div>
                                <div className="vm-cell-slots">{slots.length} slots</div>
                                {(ds.breaks || []).length > 0 && <div className="vm-cell-break">{ds.breaks.length}brk</div>}
                              </>
                            ) : (
                              <div className="vm-cell-off">Off</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="vm-cal-legend">
                      <span><span className="vmcl-dot working"/>Working</span>
                      <span><span className="vmcl-dot off"/>Day Off</span>
                      <span><span className="vmcl-dot today"/>Today</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="sched-footer">
              <button className="sched-btn-secondary" onClick={onClose}>Close</button>
              <button className="sched-btn-primary" onClick={() => setEditMode("edit")}>
                ✏️ Edit Schedule
              </button>
            </div>
          </>
        ) : showSavedConfirm ? (
          <div className="saved-confirm">
            <div className="saved-confirm-body">
              <div className="saved-check">
                <div className="saved-check-circle">✓</div>
                <div>
                  <div className="saved-check-title">Schedule Saved Successfully!</div>
                  <div className="saved-check-sub">for Dr. {doctorName}</div>
                </div>
              </div>

              {(() => {
                const { activeDays, totalSlots, totalHours } = getScheduleSummary();
                const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                const nextMonthName = nextMonth.toLocaleString("default", { month: "long", year: "numeric" });
                return (
                  <>
                    <div className="saved-stats">
                      <div className="saved-stat-box">
                        <span className="saved-stat-val">{activeDays.length}</span>
                        <span className="saved-stat-lbl">Days / Week</span>
                      </div>
                      <div className="saved-stat-box green">
                        <span className="saved-stat-val">{totalSlots}</span>
                        <span className="saved-stat-lbl">Slots / Week</span>
                      </div>
                      <div className="saved-stat-box purple">
                        <span className="saved-stat-val">{totalHours}h</span>
                        <span className="saved-stat-lbl">Coverage / Week</span>
                      </div>
                    </div>

                    <div className="saved-days-list">
                      {activeDays.map(day => {
                        const ds = schedule[day];
                        const slots = generateSlots(ds);
                        return (
                          <div key={day} className="saved-day-row">
                            <span className="saved-day-name">{day.slice(0,3)}</span>
                            <span className="saved-day-time">{ds.startTime} – {ds.endTime}</span>
                            <span className="saved-day-slots">{slots.length} slots</span>
                            {(ds.breaks||[]).length > 0 && <span className="saved-day-break">{ds.breaks.length} break{ds.breaks.length>1?"s":""}</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="saved-question">What would you like to do for <strong>{nextMonthName}</strong>?</div>

                    <div className="saved-actions">
                      <button className="saved-btn-carry" onClick={() => {
                        onSuccess();
                        setCalendarMonth(nextMonth);
                        setActiveTab("monthly");
                        setShowSavedConfirm(false);
                      }}>
                        <span className="saved-btn-icon">📅</span>
                        <div>
                          <div className="saved-btn-title">Carry Same Schedule</div>
                          <div className="saved-btn-sub">Same weekly pattern continues for {nextMonthName}</div>
                        </div>
                      </button>
                      <button className="saved-btn-new" onClick={() => {
                        onSuccess();
                        setCalendarMonth(nextMonth);
                        setActiveTab("schedule");
                        setShowSavedConfirm(false);
                      }}>
                        <span className="saved-btn-icon">✏️</span>
                        <div>
                          <div className="saved-btn-title">Modify for {nextMonthName}</div>
                          <div className="saved-btn-sub">Edit weekly schedule for next month</div>
                        </div>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="saved-confirm-footer">
              <button className="sched-btn-primary" onClick={() => { onSuccess(); onClose(); }}>Done — Close</button>
            </div>
          </div>
        ) : (
          <div className="sched-footer">
            <button className="sched-btn-secondary" onClick={onClose}>Cancel</button>
            <button className="sched-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        )}
      </div>

      {renderDayEditPopup()}

      <style jsx>{`
        .sched-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; }
        .sched-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; border-radius: 16px; width: 95%; max-width: 1200px; max-height: 90vh; display: flex; flex-direction: column; z-index: 1000; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .sched-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; }
        .sched-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
        .sched-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0; }
        .sched-close { width: 32px; height: 32px; border-radius: 8px; border: none; background: #f1f5f9; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .sched-close:hover { background: #e2e8f0; }
        .sched-tabs { display: flex; gap: 4px; padding: 0 24px; border-bottom: 1px solid #e2e8f0; }
        .sched-tab { padding: 12px 16px; border: none; background: none; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 6px; }
        .sched-tab.active { color: #0E898F; border-bottom-color: #0E898F; }
        .sched-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
        .sched-loading { text-align: center; padding: 40px; color: #64748b; }
        .sched-quick-setup { background: #f8fafc; border: 1px solid #e8edf2; border-radius: 12px; padding: 16px 18px; margin-bottom: 20px; }
        .sched-section-title { font-size: 13px; font-weight: 700; color: #475569; margin: 0 0 12px; display: flex; align-items: center; }
        .sched-quick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
        .sched-quick-btn { padding: 10px 12px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.15s; text-align: left; }
        .sched-quick-btn:hover { border-color: #0E898F; background: #f0fdf9; box-shadow: 0 2px 8px rgba(14,137,143,.1); }
        .sched-quick-btn svg { color: #0E898F; flex-shrink: 0; }
        .sched-quick-btn strong { display: block; font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 1px; }
        .sched-quick-btn span { display: block; font-size: 10px; color: #94a3b8; }
        .sched-template-select { margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
        .sched-template-select label { font-size: 13px; font-weight: 600; color: #475569; }
        .sched-template-select select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; }
        .sched-stats-panel { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
        .sched-stat-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; }
        .sched-stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sched-stat-value { font-size: 20px; font-weight: 800; color: #1e293b; line-height: 1; }
        .sched-stat-label { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 500; }
        .sched-bulk-edit-btn { padding: 10px 16px; border: 1px solid #cbd5e1; background: #fff; color: #475569; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .sched-bulk-edit-btn:hover { background: #f8fafc; border-color: #94a3b8; }
        .sched-bulk-panel { background: #fff; border: 2px solid #e0e7ff; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
        .sched-bulk-header { margin-bottom: 12px; }
        .sched-bulk-header strong { display: block; font-size: 14px; color: #1e293b; margin-bottom: 2px; }
        .sched-bulk-header span { font-size: 12px; color: #64748b; }
        .sched-bulk-fields { display: flex; gap: 12px; align-items: flex-end; }
        .sched-bulk-field { display: flex; flex-direction: column; gap: 4px; }
        .sched-bulk-field label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
        .sched-bulk-field input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; width: 120px; }
        /* ── Schedule table (horizontal row layout) ── */
        .sched-table { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-top: 4px; }
        .sched-table-head { display: grid; grid-template-columns: 82px 220px 90px 82px 82px 1fr 120px 38px; align-items: center; gap: 0; padding: 8px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .sched-table-head > div { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }
        .sched-tr { display: grid; grid-template-columns: 82px 220px 90px 82px 82px 1fr 120px 38px; align-items: center; gap: 0; padding: 9px 14px; border-bottom: 1px solid #f1f5f9; min-height: 54px; transition: background .1s; }
        .sched-tr:last-child { border-bottom: none; }
        .sched-tr.str-on { background: #fff; }
        .sched-tr.str-off { background: #fbfcfd; }
        .sched-tr.str-on:hover { background: #fafeff; }
        .std-day { display: flex; align-items: center; }
        .std-toggle-label { display: flex; align-items: center; gap: 7px; cursor: pointer; user-select: none; }
        .std-toggle-label input { width: 15px; height: 15px; cursor: pointer; accent-color: #0E898F; }
        .std-dayname { font-size: 12px; font-weight: 700; color: #cbd5e1; letter-spacing: .02em; }
        .std-dayname.on { color: #0E898F; }
        .std-times { display: flex; align-items: center; gap: 5px; }
        .std-time { padding: 5px 8px; border: 1.5px solid #e2e8f0; border-radius: 7px; font-size: 12px; font-weight: 600; color: #1e293b; background: #fff; outline: none; width: 90px; }
        .std-time:focus { border-color: #0E898F; box-shadow: 0 0 0 2px rgba(14,137,143,.12); }
        .std-time.sm { width: 80px; font-size: 11px; }
        .std-sep { font-size: 11px; color: #cbd5e1; flex-shrink: 0; }
        .std-num { display: flex; align-items: center; gap: 4px; }
        .std-ninput { width: 46px; padding: 5px 6px; border: 1.5px solid #e2e8f0; border-radius: 7px; font-size: 12px; font-weight: 600; color: #1e293b; text-align: center; outline: none; background: #fff; }
        .std-ninput:focus { border-color: #0E898F; box-shadow: 0 0 0 2px rgba(14,137,143,.12); }
        .std-unit { font-size: 10px; color: #94a3b8; font-weight: 600; }
        .std-breaks { display: flex; flex-direction: column; gap: 4px; }
        .std-break-row { display: flex; align-items: center; gap: 4px; }
        .std-rm-brk { width: 20px; height: 20px; border: none; background: #fef2f2; color: #ef4444; border-radius: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .std-rm-brk:hover { background: #fee2e2; }
        .std-add-brk { padding: 3px 7px; background: none; border: 1px dashed #cbd5e1; color: #94a3b8; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 3px; transition: all .12s; width: fit-content; margin-top: 2px; }
        .std-add-brk:hover { border-color: #0E898F; color: #0E898F; background: #f0fdf9; }
        .std-slots-count { display: flex; flex-direction: column; gap: 2px; }
        .stsc-top { display: flex; align-items: baseline; gap: 4px; }
        .stsc-num { font-size: 20px; font-weight: 800; color: #0E898F; line-height: 1; }
        .stsc-lbl { font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
        .stsc-chips { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 3px; }
        .stsc-chip { padding: 2px 6px; background: #E6F4F4; color: #0A6B70; border-radius: 4px; font-size: 9px; font-weight: 700; }
        .stsc-more { padding: 2px 5px; background: #f1f5f9; color: #94a3b8; border-radius: 4px; font-size: 9px; font-weight: 600; }
        .std-copy { width: 30px; height: 30px; border: 1px solid #e2e8f0; background: #fff; color: #94a3b8; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .12s; }
        .std-copy:hover { background: #E6F4F4; border-color: #B3E0E0; color: #0E898F; }
        .std-off-label { grid-column: 2 / -1; font-size: 12px; color: #cbd5e1; font-style: italic; }
        .sched-templates { display: flex; flex-direction: column; gap: 16px; }
        .sched-template-actions { display: flex; gap: 8px; }
        .sched-save-template { display: flex; gap: 8px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .sched-save-template input { flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
        .sched-template-list { display: flex; flex-direction: column; gap: 12px; }
        .sched-template-item { padding: 14px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .sched-template-info { flex: 1; }
        .sched-template-name { font-size: 14px; font-weight: 600; color: #1e293b; }
        .sched-template-desc { font-size: 12px; color: #64748b; margin-top: 2px; }
        .sched-template-btns { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
        .sched-template-edit-row { flex: 1; display: flex; gap: 6px; align-items: center; }
        .sched-template-edit-input { flex: 1; padding: 7px 10px; border: 1.5px solid #80CCCC; border-radius: 6px; font-size: 13px; outline: none; }
        .sched-tpl-btn { padding: 6px 12px; border-radius: 7px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.15s; }
        .sched-tpl-btn.blue { background: #E6F4F4; color: #0A6B70; } .sched-tpl-btn.blue:hover { background: #B3E0E0; }
        .sched-tpl-btn.gray { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; } .sched-tpl-btn.gray:hover { background: #f1f5f9; }
        .sched-tpl-btn.green { background: #f0fdf4; color: #16a34a; } .sched-tpl-btn.green:hover { background: #dcfce7; }
        .sched-tpl-btn.red { background: #fff5f5; color: #ef4444; } .sched-tpl-btn.red:hover { background: #fee2e2; }
        .sched-tpl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sched-empty { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; line-height: 1.8; }
        .sched-monthly { display: flex; flex-direction: column; gap: 20px; }
        .sched-month-nav { display: flex; align-items: center; justify-content: center; gap: 20px; }
        .sched-month-arrow { width: 36px; height: 36px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #475569; } .sched-month-arrow:hover { background: #f8fafc; }
        .sched-month-title { font-size: 18px; font-weight: 700; color: #1e293b; min-width: 220px; text-align: center; }
        .sched-month-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .sched-month-stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
        .sched-month-stat-box.green { background: #f0fdf4; border-color: #bbf7d0; }
        .sched-month-stat-box.purple { background: #faf5ff; border-color: #e9d5ff; }
        .smv { display: block; font-size: 24px; font-weight: 800; color: #1e293b; }
        .sml { display: block; font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 500; }
        .sched-cal-dow-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .sched-cal-dow { text-align: center; font-size: 11px; font-weight: 700; color: #94a3b8; padding: 6px 0; text-transform: uppercase; }
        .sched-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .sched-cal-cell { border-radius: 8px; padding: 8px 6px; min-height: 80px; display: flex; flex-direction: column; gap: 2px; }
        .scc-empty { background: transparent; }
        .scc-active { background: #E6F4F4; border: 1.5px solid #B3E0E0; }
        .scc-off { background: #f8fafc; border: 1.5px solid #e2e8f0; }
        .scc-today { border-color: #0E898F !important; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .scc-date { font-size: 13px; font-weight: 700; color: #1e293b; }
        .scc-active .scc-date { color: #07595D; }
        .scc-time { font-size: 10px; color: #0E898F; font-weight: 600; }
        .scc-slots { font-size: 10px; color: #16a34a; font-weight: 700; background: #dcfce7; border-radius: 4px; padding: 1px 4px; display: inline-block; }
        .scc-breaks { font-size: 9px; color: #f59e0b; font-weight: 600; }
        .scc-off-label { font-size: 10px; color: #94a3b8; font-style: italic; }
        .sched-cal-legend { display: flex; gap: 20px; justify-content: center; padding: 8px 0; }
        .scl-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
        .scl-dot { width: 12px; height: 12px; border-radius: 3px; }
        .scl-dot.active { background: #B3E0E0; border: 1.5px solid #0E898F; }
        .scl-dot.off { background: #e2e8f0; border: 1.5px solid #cbd5e1; }
        .scl-dot.today { background: #fff; border: 2px solid #0E898F; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
        .sched-cal-cell { cursor: pointer; transition: all 0.15s; }
        .sched-cal-cell:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .scc-selected { border-color: #8b5cf6 !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.25) !important; background: #faf5ff !important; }
        .sched-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; justify-content: flex-end; }
        .sched-btn-primary { padding: 10px 20px; border: none; background: #0E898F; color: #fff; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .sched-btn-primary:hover { background: #0A6B70; }
        .sched-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .sched-btn-secondary { padding: 10px 20px; border: 1px solid #cbd5e1; background: #fff; color: #475569; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .sched-btn-secondary:hover { background: #f8fafc; }
        .sched-toast { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; z-index: 10; box-shadow: 0 4px 16px rgba(0,0,0,.15); white-space: nowrap; animation: toastIn .2s ease; }
        .sched-toast.success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .sched-toast.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        @keyframes toastIn { from { opacity:0; top:4px; } to { opacity:1; top:12px; } }
        .vm-tabs { display: flex; align-items: center; gap: 4px; padding: 0 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
        .vm-tab { display: flex; align-items: center; gap: 6px; padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all .15s; margin-bottom: -1px; }
        .vm-tab:hover { color: #0E898F; }
        .vm-tab.active { color: #0E898F; border-bottom-color: #0E898F; }
        .vm-month-nav { display: flex; align-items: center; gap: 8px; margin-left: auto; padding: 6px 0; }
        .vm-nav-btn { width: 28px; height: 28px; border: 1px solid #e2e8f0; background: #fff; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #475569; transition: all .12s; }
        .vm-nav-btn:hover { background: #E6F4F4; border-color: #B3E0E0; color: #0E898F; }
        .vm-month-label { font-size: 13px; font-weight: 700; color: #1e293b; min-width: 140px; text-align: center; }
        .vm-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 10px; }
        .vm-empty-icon { font-size: 48px; }
        .vm-empty-title { font-size: 16px; font-weight: 700; color: #1e293b; }
        .vm-empty-sub { font-size: 13px; color: #94a3b8; }
        .view-mode { display: flex; flex-direction: column; gap: 20px; padding: 4px 0; }
        .view-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .view-stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
        .view-stat.green { background: #f0fdf4; border-color: #bbf7d0; }
        .view-stat.blue { background: #E6F4F4; border-color: #B3E0E0; }
        .view-stat.purple { background: #faf5ff; border-color: #e9d5ff; }
        .view-stat-v { display: block; font-size: 24px; font-weight: 800; color: #1e293b; }
        .view-stat-of { font-size: 14px; font-weight: 500; color: #94a3b8; margin-left: 2px; }
        .view-stat-l { display: block; font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 500; }
        /* ── View mode table ── */
        .vw-table { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .vw-tr { display: grid; grid-template-columns: 76px 160px 1fr 70px 1fr; align-items: center; gap: 0; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; min-height: 50px; }
        .vw-tr:last-child { border-bottom: none; }
        .vw-tr.vwtr-on { background: #fff; }
        .vw-tr.vwtr-off { background: #fbfcfd; }
        .vw-day { display: flex; align-items: center; }
        .vw-day-pill { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px; letter-spacing: .03em; }
        .vw-day-pill.on { background: #E6F4F4; color: #07595D; }
        .vw-day-pill.off { background: #f1f5f9; color: #cbd5e1; }
        .vw-time { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #0E898F; }
        .vw-meta { display: flex; flex-wrap: wrap; gap: 5px; }
        .vwm-tag { font-size: 10px; color: #64748b; background: #f1f5f9; padding: 2px 7px; border-radius: 5px; font-weight: 600; }
        .vwm-tag.brk { background: #fef3c7; color: #d97706; }
        .vw-slots { display: flex; align-items: baseline; gap: 4px; }
        .vws-count { font-size: 20px; font-weight: 800; color: #0E898F; }
        .vws-lbl { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
        .vw-chips { display: flex; flex-wrap: wrap; gap: 3px; }
        .vwc-chip { padding: 3px 7px; background: #E6F4F4; color: #07595D; border-radius: 4px; font-size: 10px; font-weight: 700; }
        .vwc-more { padding: 3px 7px; background: #f1f5f9; color: #94a3b8; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .vw-off { grid-column: 2 / -1; font-size: 12px; color: #e2e8f0; font-style: italic; }
        .vm-cal { display: flex; flex-direction: column; gap: 14px; }
        .vm-cal-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .vm-cal-stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
        .vm-cal-stat.off { background: #fff7ed; border-color: #fed7aa; }
        .vm-cal-stat.green { background: #f0fdf4; border-color: #bbf7d0; }
        .vm-cal-stat.purple { background: #faf5ff; border-color: #e9d5ff; }
        .vmcs-v { display: block; font-size: 22px; font-weight: 800; color: #1e293b; }
        .vmcs-l { display: block; font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 500; }
        .vm-cal-dow { display: grid; grid-template-columns: repeat(7,1fr); text-align: center; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
        .vm-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
        .vm-cell { border-radius: 8px; padding: 6px; min-height: 70px; display: flex; flex-direction: column; font-size: 10px; }
        .vm-cell.empty { background: transparent; }
        .vm-cell.working { background: #E6F4F4; border: 1.5px solid #B3E0E0; }
        .vm-cell.off { background: #f8fafc; border: 1px solid #f1f5f9; }
        .vm-cell.today { outline: 2px solid #0E898F; outline-offset: -1px; }
        .vm-cell-date { font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
        .vm-cell.today .vm-cell-date { color: #0E898F; }
        .vm-cell-time { font-size: 9px; font-weight: 600; color: #0A6B70; line-height: 1.3; }
        .vm-cell-slots { font-size: 9px; background: #dcfce7; color: #15803d; font-weight: 700; padding: 1px 5px; border-radius: 4px; margin-top: 2px; display: inline-block; }
        .vm-cell-break { font-size: 9px; color: #d97706; margin-top: 2px; }
        .vm-cell-off { font-size: 10px; color: #cbd5e1; font-style: italic; margin-top: auto; }
        .vm-cal-legend { display: flex; gap: 16px; justify-content: center; font-size: 12px; color: #64748b; align-items: center; padding-top: 4px; }
        .vm-cal-legend span { display: flex; align-items: center; gap: 5px; }
        .vmcl-dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
        .vmcl-dot.working { background: #B3E0E0; border: 1.5px solid #0E898F; }
        .vmcl-dot.off { background: #f1f5f9; border: 1px solid #e2e8f0; }
        .vmcl-dot.today { background: #fff; border: 2px solid #0E898F; box-shadow: 0 0 0 2px rgba(59,130,246,.2); }
        .saved-confirm { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .saved-confirm-body { flex: 1; overflow-y: auto; padding: 28px 28px 20px; display: flex; flex-direction: column; gap: 20px; }
        .saved-check { display: flex; align-items: center; gap: 16px; }
        .saved-check-circle { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg,#10b981,#059669); color: #fff; font-size: 24px; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; box-shadow: 0 4px 16px rgba(16,185,129,.3); }
        .saved-check-title { font-size: 20px; font-weight: 800; color: #1e293b; }
        .saved-check-sub { font-size: 13px; color: #64748b; margin-top: 3px; }
        .saved-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .saved-stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
        .saved-stat-box.green { background: #f0fdf4; border-color: #bbf7d0; }
        .saved-stat-box.purple { background: #faf5ff; border-color: #e9d5ff; }
        .saved-stat-val { display: block; font-size: 26px; font-weight: 800; color: #1e293b; }
        .saved-stat-lbl { display: block; font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 500; }
        .saved-days-list { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
        .saved-day-row { display: flex; align-items: center; gap: 12px; padding: 6px 8px; background: #fff; border-radius: 7px; border: 1px solid #f1f5f9; }
        .saved-day-name { font-size: 12px; font-weight: 800; color: #1e293b; width: 32px; text-transform: uppercase; }
        .saved-day-time { font-size: 12px; color: #0E898F; font-weight: 600; flex: 1; }
        .saved-day-slots { font-size: 11px; background: #dcfce7; color: #15803d; font-weight: 700; padding: 2px 8px; border-radius: 100px; }
        .saved-day-break { font-size: 11px; background: #fef3c7; color: #d97706; font-weight: 600; padding: 2px 8px; border-radius: 100px; }
        .saved-question { font-size: 14px; font-weight: 600; color: #475569; text-align: center; padding: 4px 0; }
        .saved-actions { display: flex; flex-direction: column; gap: 10px; }
        .saved-btn-carry, .saved-btn-new { display: flex; align-items: center; gap: 16px; padding: 16px 18px; border-radius: 12px; border: 2px solid; cursor: pointer; text-align: left; transition: all .15s; width: 100%; background: #fff; }
        .saved-btn-carry { border-color: #0E898F; } .saved-btn-carry:hover { background: #E6F4F4; }
        .saved-btn-new { border-color: #8b5cf6; } .saved-btn-new:hover { background: #faf5ff; }
        .saved-btn-icon { font-size: 24px; flex-shrink: 0; }
        .saved-btn-title { font-size: 14px; font-weight: 700; color: #1e293b; }
        .saved-btn-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
        .saved-confirm-footer { padding: 16px 28px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; }
      `}</style>
    </>
  );
}
