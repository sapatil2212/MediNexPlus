"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, Zap, Copy, Save, Plus, Trash2, X, ChevronLeft, ChevronRight,
  AlertTriangle, Settings, Check, Loader2, RefreshCw, Sun, Moon,
  Coffee, CalendarDays, LayoutGrid, CheckCircle2, ArrowRight, ArrowLeft,
  Eye, Pencil, FileText, ChevronDown, ChevronUp
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
interface Break { start: string; end: string }
interface DaySchedule { enabled: boolean; startTime: string; endTime: string; slotDuration: number; bufferTime: number; maxPatientsPerSlot: number; breaks: Break[] }
interface WeekSchedule { [key: string]: DaySchedule }
interface DateOverride { id?: string; date: string; isOff: boolean; startTime?: string | null; endTime?: string | null; slotDuration?: number | null; bufferTime?: number | null; maxPatientsPerSlot?: number | null; breaks?: string | null; note?: string | null }
interface Template { id: string; name: string; description?: string; scheduleData: any }
interface ScheduleBuilderProps { doctorId: string; doctorName: string; accent?: string; apiBase: string; onSuccess?: () => void }

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };
const DAY_FULL: Record<string, string> = { MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday" };
const SLOT_OPTS = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const JS_DAY_MAP: Record<number, DayOfWeek> = { 0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY", 4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY" };
const defaultDay: DaySchedule = { enabled: false, startTime: "09:00", endTime: "17:00", slotDuration: 30, bufferTime: 5, maxPatientsPerSlot: 1, breaks: [] };

const PRESETS: Record<string, { label: string; icon: any; desc: string; data: Omit<DaySchedule, "enabled"> & { enabled: true } }> = {
  fullDay:   { label: "Full Day",       icon: Sun,           desc: "9 AM – 5 PM, 30 min, 1 hr lunch", data: { enabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 30, bufferTime: 5, maxPatientsPerSlot: 1, breaks: [{ start: "13:00", end: "14:00" }] } },
  morning:   { label: "Morning Shift",  icon: Coffee,        desc: "8 AM – 2 PM, 20 min",             data: { enabled: true, startTime: "08:00", endTime: "14:00", slotDuration: 20, bufferTime: 5, maxPatientsPerSlot: 1, breaks: [{ start: "11:00", end: "11:15" }] } },
  evening:   { label: "Evening Shift",  icon: Moon,          desc: "2 PM – 8 PM, 20 min",             data: { enabled: true, startTime: "14:00", endTime: "20:00", slotDuration: 20, bufferTime: 5, maxPatientsPerSlot: 1, breaks: [{ start: "17:00", end: "17:15" }] } },
  halfDay:   { label: "Half Day",       icon: Clock,         desc: "9 AM – 1 PM, 20 min",             data: { enabled: true, startTime: "09:00", endTime: "13:00", slotDuration: 20, bufferTime: 5, maxPatientsPerSlot: 1, breaks: [] } },
  emergency: { label: "24/7 Emergency", icon: AlertTriangle, desc: "Round-the-clock, 15 min",         data: { enabled: true, startTime: "00:00", endTime: "23:59", slotDuration: 15, bufferTime: 0, maxPatientsPerSlot: 2, breaks: [] } },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const fmtTime12 = (t: string) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${ap}`; };

function generateSlots(ds: { startTime: string; endTime: string; slotDuration: number; bufferTime?: number; breaks?: Break[] }): string[] {
  const st = ds.startTime, et = ds.endTime, dur = ds.slotDuration;
  if (!st || !et || !dur) return [];
  const slots: string[] = [];
  const [sh, sm] = st.split(":").map(Number);
  const [eh, em] = et.split(":").map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  const buf = ds.bufferTime || 0;
  const brks = ds.breaks || [];
  while (cur + dur <= end) {
    const t = `${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`;
    const inBreak = brks.some(b => { const [bs, bsm] = b.start.split(":").map(Number); const [be, bem] = b.end.split(":").map(Number); return cur >= bs * 60 + bsm && cur < be * 60 + bem; });
    if (!inBreak) slots.push(t);
    cur += dur + buf;
  }
  return slots;
}

function getMonthDays(date: Date): (Date | null)[] {
  const y = date.getFullYear(), m = date.getMonth();
  const first = new Date(y, m, 1);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) days.push(new Date(y, m, d));
  return days;
}

function parseBreaks(b: any): Break[] {
  if (!b) return [];
  try { return typeof b === "string" ? JSON.parse(b) : b; } catch { return []; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT — Step-based: ① Weekly ② Apply to Months ③ Date Overrides
// ═══════════════════════════════════════════════════════════════════════════════
type Step = 1 | 2 | 3;

export default function ScheduleBuilder({ doctorId, doctorName, accent = "#0E898F", apiBase, onSuccess }: ScheduleBuilderProps) {
  const [step, setStep] = useState<Step>(1);
  const [schedule, setSchedule] = useState<WeekSchedule>({});
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Step 2
  const [applyMonths, setApplyMonths] = useState<number[]>([]);
  const [applyDays, setApplyDays] = useState<DayOfWeek[]>(["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"]);
  const [applySource, setApplySource] = useState<"weekly" | "preset">("weekly");
  const [applyPresetKey, setApplyPresetKey] = useState<string>("fullDay");
  const [applyYear, setApplyYear] = useState(new Date().getFullYear());

  // Step 3
  const [calMonth, setCalMonth] = useState(new Date());
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editDateForm, setEditDateForm] = useState<any>(null);

  // Template management
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [viewTemplateId, setViewTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkSlot, setBulkSlot] = useState(30);
  const [bulkBuffer, setBulkBuffer] = useState(5);
  const [bulkMax, setBulkMax] = useState(1);

  const showToast = (type: "success" | "error", msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  // ─── DATA LOADING ────────────────────────────────────────────────────────
  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/availability`, { credentials: "include" });
      const data = await res.json();
      const ws: WeekSchedule = {};
      if (data.success && data.data) {
        const raw = data.data;
        const isArr = Array.isArray(raw);
        DAYS.forEach(day => {
          const ex = isArr ? raw.find((a: any) => a.day === day) : raw[day];
          if (ex && ex.startTime) {
            ws[day] = { enabled: ex.isActive !== false, startTime: ex.startTime, endTime: ex.endTime, slotDuration: ex.slotDuration || 30, bufferTime: ex.bufferTime ?? 0, maxPatientsPerSlot: ex.maxPatientsPerSlot || 1, breaks: parseBreaks(ex.breaks) };
          } else { ws[day] = { ...defaultDay }; }
        });
      } else { DAYS.forEach(d => (ws[d] = { ...defaultDay })); }
      setSchedule(ws);
    } catch { const ws: WeekSchedule = {}; DAYS.forEach(d => (ws[d] = { ...defaultDay })); setSchedule(ws); }
    setLoading(false);
  }, [apiBase]);

  const loadOverrides = useCallback(async (month?: string, year?: string) => {
    try {
      const q = year ? `?year=${year}` : month ? `?month=${month}` : "";
      const res = await fetch(`${apiBase}/schedule-overrides${q}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setOverrides(data.data || []);
    } catch { /* ignore */ }
  }, [apiBase]);

  const loadTemplates = useCallback(async () => {
    try {
      const ep = apiBase === "/api/doctor" ? "/api/doctor/schedule-templates" : "/api/config/schedule-templates";
      const res = await fetch(ep, { credentials: "include" });
      const data = await res.json();
      if (data.success) setTemplates(data.data || []);
    } catch { /* ignore */ }
  }, [apiBase]);

  useEffect(() => { loadSchedule(); loadTemplates(); }, [loadSchedule, loadTemplates]);
  useEffect(() => { if (step === 3) loadOverrides(fmtMonth(calMonth)); }, [step, calMonth, loadOverrides]);
  useEffect(() => { if (step === 2) loadOverrides(undefined, String(applyYear)); }, [step, applyYear, loadOverrides]);

  // ─── WEEKLY HELPERS ──────────────────────────────────────────────────────
  const updateDay = (day: DayOfWeek, u: Partial<DaySchedule>) => {
    setSchedule(p => ({ ...p, [day]: { ...p[day], ...u, breaks: u.breaks !== undefined ? u.breaks : (p[day]?.breaks || []) } }));
  };
  const addBreak = (day: DayOfWeek) => { const ds = schedule[day] || defaultDay; updateDay(day, { breaks: [...(ds.breaks || []), { start: "12:00", end: "13:00" }] }); };
  const removeBreak = (day: DayOfWeek, idx: number) => { const ds = schedule[day] || defaultDay; updateDay(day, { breaks: (ds.breaks || []).filter((_, i) => i !== idx) }); };
  const updateBreak = (day: DayOfWeek, idx: number, field: "start" | "end", val: string) => { const ds = schedule[day] || defaultDay; const nb = [...(ds.breaks || [])]; if (nb[idx]) { nb[idx] = { ...nb[idx], [field]: val }; updateDay(day, { breaks: nb }); } };
  const copyToAll = (src: DayOfWeek) => { const s = schedule[src]; const u: WeekSchedule = {}; DAYS.forEach(d => (u[d] = { ...s, breaks: [...(s.breaks || [])] })); setSchedule(u); };
  const applyPreset = (key: string, target: "all" | "weekdays" | "weekend") => { const p = PRESETS[key].data; const u = { ...schedule }; const targets = target === "all" ? DAYS : target === "weekdays" ? DAYS.slice(0, 5) : DAYS.slice(5); targets.forEach(d => (u[d] = { ...p, breaks: [...(p.breaks || [])] })); setSchedule(u); };
  const quickFullWeek = () => { const u: WeekSchedule = {}; DAYS.forEach(d => { u[d] = d === "SATURDAY" || d === "SUNDAY" ? { ...PRESETS.halfDay.data, breaks: [...PRESETS.halfDay.data.breaks] } : { ...PRESETS.fullDay.data, breaks: [...PRESETS.fullDay.data.breaks] }; }); setSchedule(u); };
  const applyBulkEdit = () => { const u = { ...schedule }; DAYS.forEach(d => { if (u[d]?.enabled) u[d] = { ...u[d], slotDuration: bulkSlot, bufferTime: bulkBuffer, maxPatientsPerSlot: bulkMax }; }); setSchedule(u); setShowBulkEdit(false); showToast("success", "Bulk settings applied"); };
  const applyTemplate = (tid: string) => { const t = templates.find(x => x.id === tid); if (t) { const d = typeof t.scheduleData === "string" ? JSON.parse(t.scheduleData) : t.scheduleData; setSchedule(d); showToast("success", `Template "${t.name}" applied`); } };

  const getStats = () => {
    let slots = 0, days = 0, hours = 0;
    DAYS.forEach(d => { const ds = schedule[d]; if (ds?.enabled) { days++; slots += generateSlots(ds).length; const [sh, sm] = ds.startTime.split(":").map(Number); const [eh, em] = ds.endTime.split(":").map(Number); hours += (eh * 60 + em - sh * 60 - sm) / 60; } });
    return { slots, days, hours, avg: days > 0 ? Math.round(slots / days) : 0 };
  };

  // ─── SAVE WEEKLY ─────────────────────────────────────────────────────────
  const saveWeekly = async (thenGoStep2 = false) => {
    const errs: string[] = [];
    DAYS.forEach(d => { const ds = schedule[d]; if (ds?.enabled) { if (!ds.startTime || !ds.endTime) errs.push(`${DAY_LABELS[d]}: Missing time`); else { const [sh, sm] = ds.startTime.split(":").map(Number); const [eh, em] = ds.endTime.split(":").map(Number); if (sh * 60 + sm >= eh * 60 + em) errs.push(`${DAY_LABELS[d]}: End must be after start`); } } });
    if (errs.length) { showToast("error", errs.join("; ")); return; }
    setSaving(true);
    try {
      const payload = DAYS.filter(d => schedule[d]?.enabled).map(d => ({
        day: d, startTime: schedule[d].startTime, endTime: schedule[d].endTime,
        slotDuration: schedule[d].slotDuration, bufferTime: schedule[d].bufferTime,
        maxPatientsPerSlot: schedule[d].maxPatientsPerSlot,
        breaks: JSON.stringify(schedule[d].breaks || []),
        generatedSlots: JSON.stringify(generateSlots(schedule[d])),
        isActive: true,
      }));
      const res = await fetch(`${apiBase}/availability`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedules: payload }) });
      const data = await res.json();
      if (data.success) { showToast("success", `Weekly schedule saved — ${payload.length} day(s)`); onSuccess?.(); if (thenGoStep2) setStep(2); }
      else showToast("error", data.message || "Failed to save");
    } catch (e: any) { showToast("error", e.message || "Save failed"); }
    setSaving(false);
  };

  // ─── SAVE TEMPLATE ───────────────────────────────────────────────────────
  const saveTemplate = async () => {
    if (!newTemplateName.trim()) { showToast("error", "Enter a template name"); return; }
    try {
      const ep = apiBase === "/api/doctor" ? "/api/doctor/schedule-templates" : "/api/config/schedule-templates";
      const res = await fetch(ep, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTemplateName, scheduleData: JSON.stringify(schedule) }) });
      const data = await res.json();
      if (data.success) { setNewTemplateName(""); setShowSaveTemplate(false); loadTemplates(); showToast("success", "Template saved!"); }
      else showToast("error", data.message || "Failed");
    } catch { showToast("error", "Failed to save template"); }
  };

  // ─── UPDATE TEMPLATE ──────────────────────────────────────────────────────
  const getTemplateIdEndpoint = (id: string) => apiBase === "/api/doctor" ? `/api/doctor/schedule-templates/${id}` : `/api/config/schedule-templates/${id}`;

  const updateTemplate = async (id: string) => {
    if (!editTemplateName.trim()) { showToast("error", "Enter a template name"); return; }
    try {
      const res = await fetch(getTemplateIdEndpoint(id), { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editTemplateName, scheduleData: JSON.stringify(schedule) }) });
      const data = await res.json();
      if (data.success) { setEditingTemplateId(null); setEditTemplateName(""); loadTemplates(); showToast("success", "Template updated!"); }
      else showToast("error", data.message || "Failed");
    } catch { showToast("error", "Failed to update template"); }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetch(getTemplateIdEndpoint(id), { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) { loadTemplates(); showToast("success", "Template deleted"); if (viewTemplateId === id) setViewTemplateId(null); }
      else showToast("error", data.message || "Failed");
    } catch { showToast("error", "Failed to delete template"); }
  };

  const loadTemplateForEdit = (tid: string) => {
    const t = templates.find(x => x.id === tid);
    if (t) {
      const d = typeof t.scheduleData === "string" ? JSON.parse(t.scheduleData) : t.scheduleData;
      setSchedule(d);
      setEditingTemplateId(tid);
      setEditTemplateName(t.name);
      showToast("success", `Loaded "${t.name}" for editing — modify and click Update`);
    }
  };

  const getTemplateStats = (t: Template) => {
    try {
      const d: WeekSchedule = typeof t.scheduleData === "string" ? JSON.parse(t.scheduleData) : t.scheduleData;
      let days = 0, slots = 0;
      DAYS.forEach(day => { const ds = d[day]; if (ds?.enabled) { days++; slots += generateSlots(ds).length; } });
      return { days, slots, schedule: d };
    } catch { return { days: 0, slots: 0, schedule: {} as WeekSchedule }; }
  };

  // ─── DATE OVERRIDE HELPERS ───────────────────────────────────────────────
  const getDayForDate = (d: Date): DaySchedule | null => { const day = JS_DAY_MAP[d.getDay()]; const ds = schedule[day]; return ds?.enabled ? ds : null; };
  const getOverrideForDate = (d: Date): DateOverride | undefined => { const ds = fmtDate(d); return overrides.find(o => fmtDate(new Date(o.date)) === ds); };

  const saveOverride = async (ov: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/schedule-overrides`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ov) });
      const data = await res.json();
      if (data.success) {
        showToast("success", ov.overrides ? `${ov.overrides.length} date overrides saved` : "Date override saved");
        if (step === 3) loadOverrides(fmtMonth(calMonth));
        else loadOverrides(undefined, String(applyYear));
      } else showToast("error", data.message || "Failed");
    } catch { showToast("error", "Failed to save override"); }
    setSaving(false);
  };

  const deleteOverride = async (date: string) => {
    try {
      const res = await fetch(`${apiBase}/schedule-overrides?date=${date}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) { showToast("success", "Override removed"); loadOverrides(fmtMonth(calMonth)); }
    } catch { showToast("error", "Failed to delete"); }
  };

  // ─── STEP 2: APPLY WEEKLY/PRESET TO MONTHS ──────────────────────────────
  const applyToMonths = async () => {
    if (!applyMonths.length) { showToast("error", "Select at least one month"); return; }
    setSaving(true);
    const allOvs: any[] = [];
    for (const m of applyMonths) {
      const daysInMonth = new Date(applyYear, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(applyYear, m, d);
        const dayName = JS_DAY_MAP[date.getDay()];
        if (!applyDays.includes(dayName)) {
          allOvs.push({ date: fmtDate(date), isOff: true, note: "Off day — bulk" });
          continue;
        }
        let src: DaySchedule | null = null;
        if (applySource === "weekly") { src = schedule[dayName]?.enabled ? schedule[dayName] : null; }
        else if (applySource === "preset" && PRESETS[applyPresetKey]) { src = PRESETS[applyPresetKey].data; }
        if (src) {
          allOvs.push({ date: fmtDate(date), isOff: false, startTime: src.startTime, endTime: src.endTime, slotDuration: src.slotDuration, bufferTime: src.bufferTime, maxPatientsPerSlot: src.maxPatientsPerSlot, breaks: JSON.stringify(src.breaks || []), note: applySource === "weekly" ? `Weekly ${DAY_LABELS[dayName]}` : `${PRESETS[applyPresetKey]?.label} — bulk` });
        } else {
          allOvs.push({ date: fmtDate(date), isOff: true, note: "No schedule" });
        }
      }
    }
    await saveOverride({ overrides: allOvs });
    setApplyMonths([]);
    setSaving(false);
  };

  // ─── OPEN DATE EDITOR ────────────────────────────────────────────────────
  const openDateEditor = (date: Date) => {
    const ov = getOverrideForDate(date);
    const base = getDayForDate(date);
    if (ov) {
      setEditDateForm({ isOff: ov.isOff, startTime: ov.startTime || "09:00", endTime: ov.endTime || "17:00", slotDuration: ov.slotDuration || 30, bufferTime: ov.bufferTime ?? 5, maxPatientsPerSlot: ov.maxPatientsPerSlot ?? 1, breaks: parseBreaks(ov.breaks), note: ov.note || "" });
    } else if (base) {
      setEditDateForm({ isOff: false, startTime: base.startTime, endTime: base.endTime, slotDuration: base.slotDuration, bufferTime: base.bufferTime, maxPatientsPerSlot: base.maxPatientsPerSlot, breaks: [...(base.breaks || [])], note: "" });
    } else {
      setEditDateForm({ isOff: true, startTime: "09:00", endTime: "17:00", slotDuration: 30, bufferTime: 5, maxPatientsPerSlot: 1, breaks: [], note: "" });
    }
    setEditDate(date);
  };

  const saveCurrentDateOverride = async () => {
    if (!editDate || !editDateForm) return;
    await saveOverride({
      date: fmtDate(editDate), isOff: editDateForm.isOff,
      startTime: editDateForm.isOff ? null : editDateForm.startTime,
      endTime: editDateForm.isOff ? null : editDateForm.endTime,
      slotDuration: editDateForm.isOff ? null : editDateForm.slotDuration,
      bufferTime: editDateForm.isOff ? null : editDateForm.bufferTime,
      maxPatientsPerSlot: editDateForm.isOff ? null : editDateForm.maxPatientsPerSlot,
      breaks: editDateForm.isOff ? null : JSON.stringify(editDateForm.breaks || []),
      note: editDateForm.note || null,
    });
    setEditDate(null); setEditDateForm(null);
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  const stats = getStats();

  return (
    <div className="sb-root">
      <style>{scheduleBuilderStyles(accent)}</style>

      {toast && (
        <div className={`sb-toast sb-toast-${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {toast.msg}
          <button className="sb-toast-close" onClick={() => setToast(null)}><X size={12} /></button>
        </div>
      )}

      {/* Header */}
      <div className="sb-header">
        <div>
          <div className="sb-title">Schedule Management</div>
          <div className="sb-subtitle">{doctorName}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="sb-btn" style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }} onClick={() => {
            const today = new Date();
            setStep(3);
            setCalMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            openDateEditor(today);
          }}>
            <Zap size={14} /> Manage Today
          </button>
          <button className="sb-btn" style={{ background: "#fdf4ff", color: "#c026d3", border: "1px solid #f5d0fe" }} onClick={() => {
            const tmrw = new Date();
            tmrw.setDate(tmrw.getDate() + 1);
            setStep(3);
            setCalMonth(new Date(tmrw.getFullYear(), tmrw.getMonth(), 1));
            openDateEditor(tmrw);
          }}>
            <Zap size={14} /> Manage Tomorrow
          </button>
          <button className="sb-btn sb-btn-ghost" onClick={() => { loadSchedule(); if (step === 3) loadOverrides(fmtMonth(calMonth)); if (step === 2) loadOverrides(undefined, String(applyYear)); }}>
            <RefreshCw size={13} /> Reload
          </button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="sb-steps">
        {([
          { n: 1 as Step, label: "Weekly Schedule", icon: Calendar, desc: "Set recurring timetable" },
          { n: 2 as Step, label: "Apply to Months", icon: LayoutGrid, desc: "Bulk apply to months" },
          { n: 3 as Step, label: "Modify Dates", icon: CalendarDays, desc: "Override specific dates" },
        ]).map((s, i) => (
          <button key={s.n} className={`sb-step ${step === s.n ? "active" : ""} ${step > s.n ? "done" : ""}`} onClick={() => setStep(s.n)}>
            <div className="sb-step-num">{step > s.n ? <Check size={12} /> : s.n}</div>
            <div>
              <div className="sb-step-label">{s.label}</div>
              <div className="sb-step-desc">{s.desc}</div>
            </div>
            {i < 2 && <div className="sb-step-arrow"><ArrowRight size={14} /></div>}
          </button>
        ))}
      </div>

      <div className="sb-body">
        {loading ? (
          <div className="sb-loading"><Loader2 size={20} className="sb-spin" /> Loading schedule...</div>

        ) : step === 1 ? (
          /* ═══════ STEP 1: WEEKLY SCHEDULE ═══════ */
          <>
            <div className="sb-section">
              <div className="sb-section-head"><Zap size={14} /> Quick Setup</div>
              <div className="sb-presets">
                <button className="sb-preset-btn sb-preset-highlight" onClick={quickFullWeek}>
                  <Zap size={15} /><div><strong>Full Week</strong><span>Mon–Fri: 9–5, Sat–Sun: 9–1</span></div>
                </button>
                {Object.entries(PRESETS).map(([k, p]) => (
                  <button key={k} className="sb-preset-btn" onClick={() => applyPreset(k, "all")}>
                    <p.icon size={15} /><div><strong>{p.label}</strong><span>{p.desc}</span></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editing Template Banner */}
            {editingTemplateId && (
              <div className="sb-edit-banner">
                <Pencil size={13} />
                <span>Editing template: <strong>{editTemplateName}</strong> — modify the schedule below and click Update</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <div className="sb-field" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <label style={{ margin: 0, whiteSpace: "nowrap" }}>Name</label>
                    <input type="text" value={editTemplateName} onChange={e => setEditTemplateName(e.target.value)} style={{ width: 160 }} />
                  </div>
                  <button className="sb-btn sb-btn-primary" onClick={() => updateTemplate(editingTemplateId)}>Update Template</button>
                  <button className="sb-btn sb-btn-ghost" onClick={() => { setEditingTemplateId(null); setEditTemplateName(""); loadSchedule(); }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Saved Schedules Section */}
            <div className="sb-section">
              <div className="sb-section-head" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setShowTemplates(!showTemplates)}>
                <FileText size={14} /> Saved Schedules ({templates.length})
                {showTemplates ? <ChevronUp size={14} style={{ marginLeft: "auto" }} /> : <ChevronDown size={14} style={{ marginLeft: "auto" }} />}
              </div>
              {showTemplates && (
                <div className="sb-tpl-list">
                  {templates.length === 0 ? (
                    <div className="sb-tpl-empty">No saved schedules yet. Configure a weekly schedule and click "Save as Template" to save it.</div>
                  ) : templates.map(t => {
                    const st = getTemplateStats(t);
                    const isViewing = viewTemplateId === t.id;
                    return (
                      <div key={t.id} className={`sb-tpl-card ${editingTemplateId === t.id ? "editing" : ""}`}>
                        <div className="sb-tpl-row">
                          <div className="sb-tpl-info">
                            <div className="sb-tpl-name">{t.name}</div>
                            <div className="sb-tpl-meta">{st.days} day{st.days !== 1 ? "s" : ""} · {st.slots} slots/week{t.description ? ` · ${t.description}` : ""}</div>
                          </div>
                          <div className="sb-tpl-actions">
                            <button className="sb-tpl-action" title="View details" onClick={(e) => { e.stopPropagation(); setViewTemplateId(isViewing ? null : t.id); }}><Eye size={13} /></button>
                            <button className="sb-tpl-action" title="Load & Edit" onClick={(e) => { e.stopPropagation(); loadTemplateForEdit(t.id); }}><Pencil size={13} /></button>
                            <button className="sb-tpl-action" title="Apply to current" onClick={(e) => { e.stopPropagation(); applyTemplate(t.id); }}><Zap size={13} /></button>
                            <button className="sb-tpl-action sb-tpl-action-danger" title="Delete" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete template "${t.name}"?`)) deleteTemplate(t.id); }}><Trash2 size={13} /></button>
                          </div>
                        </div>
                        {isViewing && (
                          <div className="sb-tpl-detail">
                            {DAYS.map(day => {
                              const ds = st.schedule[day];
                              if (!ds) return null;
                              return (
                                <div key={day} className={`sb-tpl-day ${ds.enabled ? "on" : "off"}`}>
                                  <strong>{DAY_LABELS[day]}</strong>
                                  {ds.enabled ? (
                                    <span>{fmtTime12(ds.startTime)} – {fmtTime12(ds.endTime)} · {ds.slotDuration}min · {generateSlots(ds).length} slots{(ds.breaks?.length || 0) > 0 ? ` · ${ds.breaks.length} break${ds.breaks.length > 1 ? "s" : ""}` : ""}</span>
                                  ) : <span>Off</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button className="sb-btn sb-btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowSaveTemplate(true)}><Plus size={13} /> Save Current as New Template</button>
                </div>
              )}
            </div>

            {stats.days > 0 && (
              <div className="sb-stats">
                {[
                  { v: stats.days, l: "Active Days", c: accent },
                  { v: stats.slots, l: "Slots / Week", c: "#16a34a" },
                  { v: stats.avg, l: "Avg / Day", c: "#d97706" },
                  { v: `${stats.hours.toFixed(1)}h`, l: "Hours / Week", c: "#a855f7" },
                ].map((s, i) => (
                  <div key={i} className="sb-stat">
                    <div className="sb-stat-val" style={{ color: s.c }}>{s.v}</div>
                    <div className="sb-stat-lbl">{s.l}</div>
                  </div>
                ))}
                <button className="sb-bulk-btn" onClick={() => setShowBulkEdit(!showBulkEdit)}><Settings size={13} /> Bulk Edit</button>
              </div>
            )}

            {showBulkEdit && (
              <div className="sb-bulk-panel">
                <div className="sb-bulk-head">Bulk Edit — apply to all active days</div>
                <div className="sb-bulk-fields">
                  <label>Slot <input type="number" value={bulkSlot} min={5} max={120} onChange={e => setBulkSlot(+e.target.value || 30)} /> min</label>
                  <label>Buffer <input type="number" value={bulkBuffer} min={0} max={30} onChange={e => setBulkBuffer(+e.target.value || 0)} /> min</label>
                  <label>Max <input type="number" value={bulkMax} min={1} max={10} onChange={e => setBulkMax(+e.target.value || 1)} /> pt</label>
                  <button className="sb-btn sb-btn-primary" onClick={applyBulkEdit}>Apply</button>
                  <button className="sb-btn sb-btn-ghost" onClick={() => setShowBulkEdit(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="sb-day-grid">
              {DAYS.map(day => {
                const ds = schedule[day] || defaultDay;
                const slots = generateSlots(ds);
                return (
                  <div key={day} className={`sb-day-card ${ds.enabled ? "active" : "off"}`}>
                    <div className="sb-day-left" onClick={() => updateDay(day, { enabled: !ds.enabled })}>
                      <div className="sb-toggle" data-on={ds.enabled}><div className="sb-toggle-knob" /></div>
                      <div className="sb-day-name">{DAY_FULL[day]}</div>
                    </div>
                    {ds.enabled ? (
                      <div className="sb-day-right">
                        <div className="sb-day-fields">
                          <div className="sb-field"><label>Start</label><input type="time" value={ds.startTime} onChange={e => updateDay(day, { startTime: e.target.value })} /></div>
                          <div className="sb-field"><label>End</label><input type="time" value={ds.endTime} onChange={e => updateDay(day, { endTime: e.target.value })} /></div>
                          <div className="sb-field"><label>Slot</label><select value={ds.slotDuration} onChange={e => updateDay(day, { slotDuration: +e.target.value })}>{SLOT_OPTS.map(v => <option key={v} value={v}>{v} min</option>)}</select></div>
                          <div className="sb-field"><label>Buffer</label><input type="number" value={ds.bufferTime} min={0} max={30} onChange={e => updateDay(day, { bufferTime: +e.target.value || 0 })} /></div>
                          <div className="sb-field"><label>Max/Slot</label><input type="number" value={ds.maxPatientsPerSlot} min={1} max={10} onChange={e => updateDay(day, { maxPatientsPerSlot: +e.target.value || 1 })} /></div>
                        </div>
                        <div className="sb-breaks">
                          {(ds.breaks || []).map((b, i) => (
                            <div key={i} className="sb-break-row">
                              <Coffee size={11} />
                              <input type="time" value={b.start} onChange={e => updateBreak(day, i, "start", e.target.value)} />
                              <span>–</span>
                              <input type="time" value={b.end} onChange={e => updateBreak(day, i, "end", e.target.value)} />
                              <button className="sb-break-rm" onClick={() => removeBreak(day, i)}><X size={10} /></button>
                            </div>
                          ))}
                          <button className="sb-break-add" onClick={() => addBreak(day)}><Plus size={11} /> Break</button>
                        </div>
                        <div className="sb-day-footer">
                          <span className="sb-slot-badge">{slots.length} slots</span>
                          <button className="sb-copy-btn" onClick={() => copyToAll(day)}><Copy size={12} /> Copy to all</button>
                        </div>
                      </div>
                    ) : (
                      <div className="sb-day-off-label">Day Off</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="sb-footer">
              <button className="sb-btn sb-btn-ghost" onClick={() => setShowSaveTemplate(true)}><Save size={13} /> Save as Template</button>
              <button className="sb-btn sb-btn-primary" disabled={saving} onClick={() => saveWeekly(false)}>
                {saving ? <><Loader2 size={13} className="sb-spin" /> Saving...</> : <>Save Weekly Schedule</>}
              </button>
              <button className="sb-btn sb-btn-primary" disabled={saving} onClick={() => saveWeekly(true)}>
                {saving ? <><Loader2 size={13} className="sb-spin" /></> : <>Save & Apply to Months <ArrowRight size={13} /></>}
              </button>
            </div>

            {showSaveTemplate && (
              <div className="sb-mini-modal">
                <div className="sb-mini-head">Save as Template</div>
                <input placeholder="Template name" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveTemplate()} />
                <div className="sb-mini-actions">
                  <button className="sb-btn sb-btn-ghost" onClick={() => setShowSaveTemplate(false)}>Cancel</button>
                  <button className="sb-btn sb-btn-primary" onClick={saveTemplate}>Save</button>
                </div>
              </div>
            )}
          </>

        ) : step === 2 ? (
          /* ═══════ STEP 2: APPLY TO MONTHS ═══════ */
          <>
            <div className="sb-s2-info">
              <div className="sb-s2-info-title">Apply schedule to specific months</div>
              <div className="sb-s2-info-desc">Select months below, choose a source (your weekly schedule or a preset), pick working days, then apply. This creates date-specific overrides for every date in those months.</div>
            </div>

            <div className="sb-year-nav">
              <button className="sb-nav-btn" onClick={() => setApplyYear(y => y - 1)}><ChevronLeft size={18} /></button>
              <h3 className="sb-year-title">{applyYear}</h3>
              <button className="sb-nav-btn" onClick={() => setApplyYear(y => y + 1)}><ChevronRight size={18} /></button>
            </div>

            <div className="sb-year-grid">
              {MONTH_NAMES.map((mn, idx) => {
                const isSelected = applyMonths.includes(idx);
                const monthOvs = overrides.filter(o => { const d = new Date(o.date); return d.getMonth() === idx && d.getFullYear() === applyYear; });
                const workingOvs = monthOvs.filter(o => !o.isOff).length;
                const offOvs = monthOvs.filter(o => o.isOff).length;
                return (
                  <div key={idx} className={`sb-year-month ${isSelected ? "selected" : ""}`} onClick={() => setApplyMonths(p => p.includes(idx) ? p.filter(x => x !== idx) : [...p, idx])}>
                    <div className="sb-ym-head">
                      <div className="sb-ym-check">{isSelected && <Check size={12} />}</div>
                      <div className="sb-ym-name">{mn}</div>
                    </div>
                    {monthOvs.length > 0 ? (
                      <div className="sb-ym-info">
                        <span className="sb-ym-tag green">{workingOvs} work</span>
                        {offOvs > 0 && <span className="sb-ym-tag red">{offOvs} off</span>}
                      </div>
                    ) : <div className="sb-ym-empty">Uses weekly schedule</div>}
                  </div>
                );
              })}
            </div>

            <div className="sb-year-apply">
              <div className="sb-ya-head">Configure &amp; Apply</div>
              <div className="sb-ya-row">
                <div className="sb-field" style={{ minWidth: 180 }}>
                  <label>Source Schedule</label>
                  <select value={applySource} onChange={e => setApplySource(e.target.value as any)}>
                    <option value="weekly">Use My Weekly Schedule</option>
                    <option value="preset">Use a Preset</option>
                  </select>
                </div>
                {applySource === "preset" && (
                  <div className="sb-field" style={{ minWidth: 220 }}>
                    <label>Preset</label>
                    <select value={applyPresetKey} onChange={e => setApplyPresetKey(e.target.value)}>
                      {Object.entries(PRESETS).map(([k, p]) => <option key={k} value={k}>{p.label} — {p.desc}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {applySource === "weekly" && (
                <div className="sb-s2-preview">
                  <div className="sb-s2-preview-title">Current weekly schedule:</div>
                  <div className="sb-s2-preview-days">
                    {DAYS.map(d => {
                      const ds = schedule[d];
                      return (
                        <div key={d} className={`sb-s2-pd ${ds?.enabled ? "on" : "off"}`}>
                          <strong>{DAY_LABELS[d]}</strong>
                          {ds?.enabled ? <span>{fmtTime12(ds.startTime)} – {fmtTime12(ds.endTime)} · {generateSlots(ds).length} slots</span> : <span>Off</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="sb-ya-row">
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Working Days:</label>
                <div className="sb-ya-days">
                  {DAYS.map(d => (
                    <button key={d} className={`sb-ya-day ${applyDays.includes(d) ? "on" : ""}`} onClick={() => setApplyDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])}>{DAY_LABELS[d]}</button>
                  ))}
                </div>
              </div>
              <button className="sb-btn sb-btn-primary sb-btn-lg" disabled={saving || !applyMonths.length} onClick={applyToMonths}>
                {saving ? <><Loader2 size={14} className="sb-spin" /> Applying...</> : <><Zap size={14} /> Apply to {applyMonths.length} Month{applyMonths.length !== 1 ? "s" : ""}</>}
              </button>
            </div>

            <div className="sb-footer" style={{ marginTop: 16 }}>
              <button className="sb-btn sb-btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={13} /> Back to Weekly</button>
              <button className="sb-btn sb-btn-primary" onClick={() => setStep(3)}>Modify Specific Dates <ArrowRight size={13} /></button>
            </div>
          </>

        ) : (
          /* ═══════ STEP 3: DATE-SPECIFIC OVERRIDES ═══════ */
          <>
            <div className="sb-month-nav">
              <button className="sb-nav-btn" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
              <h3 className="sb-month-title">{MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}</h3>
              <button className="sb-nav-btn" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
            </div>

            {(() => {
              const totalDays = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
              let working = 0, offDays = 0, overridden = 0, totalSlots = 0;
              for (let d = 1; d <= totalDays; d++) {
                const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), d);
                const ov = getOverrideForDate(date); const base = getDayForDate(date);
                if (ov) { overridden++; if (ov.isOff) offDays++; else { working++; if (ov.startTime && ov.endTime && ov.slotDuration) totalSlots += generateSlots({ startTime: ov.startTime, endTime: ov.endTime, slotDuration: ov.slotDuration, bufferTime: ov.bufferTime || 0, breaks: parseBreaks(ov.breaks) }).length; } }
                else if (base) { working++; totalSlots += generateSlots(base).length; }
                else offDays++;
              }
              return (
                <div className="sb-month-stats">
                  <div className="sb-mstat"><span className="sb-mstat-v" style={{ color: accent }}>{working}</span><span className="sb-mstat-l">Working</span></div>
                  <div className="sb-mstat"><span className="sb-mstat-v" style={{ color: "#ef4444" }}>{offDays}</span><span className="sb-mstat-l">Off</span></div>
                  <div className="sb-mstat"><span className="sb-mstat-v" style={{ color: "#7c3aed" }}>{overridden}</span><span className="sb-mstat-l">Overrides</span></div>
                  <div className="sb-mstat"><span className="sb-mstat-v" style={{ color: "#16a34a" }}>{totalSlots}</span><span className="sb-mstat-l">Total Slots</span></div>
                </div>
              );
            })()}

            <div className="sb-cal-dow">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}</div>
            <div className="sb-cal-grid">
              {getMonthDays(calMonth).map((date, i) => {
                if (!date) return <div key={`e${i}`} className="sb-cal-cell sb-cal-empty" />;
                const ov = getOverrideForDate(date); const base = getDayForDate(date);
                const isToday = fmtDate(date) === fmtDate(new Date());
                const isOff = ov ? ov.isOff : !base;
                const hasOverride = !!ov;
                let slots = 0;
                if (ov && !ov.isOff && ov.startTime && ov.endTime && ov.slotDuration) {
                  slots = generateSlots({ startTime: ov.startTime, endTime: ov.endTime, slotDuration: ov.slotDuration, bufferTime: ov.bufferTime || 0, breaks: parseBreaks(ov.breaks) }).length;
                } else if (!ov && base) { slots = generateSlots(base).length; }
                const timeDisplay = ov && !ov.isOff && ov.startTime ? `${ov.startTime}–${ov.endTime}` : (!ov && base ? `${base.startTime}–${base.endTime}` : null);
                const ovBreaks = ov ? parseBreaks(ov.breaks) : [];
                return (
                  <div key={fmtDate(date)} className={`sb-cal-cell ${isOff ? "sb-cal-off" : "sb-cal-on"} ${isToday ? "sb-cal-today" : ""} ${hasOverride ? "sb-cal-override" : ""} ${editDate && fmtDate(editDate) === fmtDate(date) ? "sb-cal-sel" : ""}`} onClick={() => openDateEditor(date)}>
                    <div className="sb-cal-date">{date.getDate()}</div>
                    {hasOverride && <div className="sb-cal-badge">override</div>}
                    {isOff ? <div className="sb-cal-off-lbl">Off</div> : (
                      <>
                        {timeDisplay && <div className="sb-cal-time">{timeDisplay}</div>}
                        {slots > 0 && <div className="sb-cal-slots">{slots} slots</div>}
                        {ovBreaks.length > 0 && <div className="sb-cal-brk">{ovBreaks.length} brk</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="sb-cal-legend">
              <span><span className="sb-dot" style={{ background: accent }} /> Weekly</span>
              <span><span className="sb-dot" style={{ background: "#7c3aed" }} /> Override</span>
              <span><span className="sb-dot" style={{ background: "#e2e8f0" }} /> Off</span>
            </div>

            {/* Date Edit Modal */}
            {editDate && editDateForm && (
              <div className="sb-modal-overlay" onClick={() => { setEditDate(null); setEditDateForm(null); }}>
                <div className="sb-modal" onClick={e => e.stopPropagation()}>
                  <div className="sb-de-head">
                    <div>
                      <div className="sb-de-title">{editDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
                      <div className="sb-de-note">Override schedule for this date</div>
                    </div>
                    <button className="sb-icon-btn" onClick={() => { setEditDate(null); setEditDateForm(null); }}><X size={16} /></button>
                  </div>
                  <div className="sb-de-body">
                    <label className="sb-de-toggle">
                      <input type="checkbox" checked={!editDateForm.isOff} onChange={e => setEditDateForm((p: any) => ({ ...p, isOff: !e.target.checked }))} />
                      <span style={{ color: editDateForm.isOff ? "#ef4444" : "#16a34a", fontWeight: 700 }}>{editDateForm.isOff ? "Day Off" : "Working Day"}</span>
                    </label>

                    {!editDateForm.isOff && (
                      <>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", alignSelf: "center" }}>Quick:</span>
                          {Object.entries(PRESETS).map(([k, p]) => (
                            <button key={k} className="sb-btn sb-btn-ghost" style={{ padding: "3px 10px", fontSize: 10 }} onClick={() => setEditDateForm((prev: any) => ({ ...prev, isOff: false, startTime: p.data.startTime, endTime: p.data.endTime, slotDuration: p.data.slotDuration, bufferTime: p.data.bufferTime, maxPatientsPerSlot: p.data.maxPatientsPerSlot, breaks: [...p.data.breaks] }))}>
                              <p.icon size={10} /> {p.label}
                            </button>
                          ))}
                        </div>

                        <div className="sb-de-fields">
                          <div className="sb-field"><label>Start</label><input type="time" value={editDateForm.startTime} onChange={e => setEditDateForm((p: any) => ({ ...p, startTime: e.target.value }))} /></div>
                          <div className="sb-field"><label>End</label><input type="time" value={editDateForm.endTime} onChange={e => setEditDateForm((p: any) => ({ ...p, endTime: e.target.value }))} /></div>
                          <div className="sb-field"><label>Slot</label><select value={editDateForm.slotDuration} onChange={e => setEditDateForm((p: any) => ({ ...p, slotDuration: +e.target.value }))}>{SLOT_OPTS.map(v => <option key={v} value={v}>{v} min</option>)}</select></div>
                          <div className="sb-field"><label>Buffer</label><input type="number" value={editDateForm.bufferTime} min={0} max={30} onChange={e => setEditDateForm((p: any) => ({ ...p, bufferTime: +e.target.value }))} /></div>
                          <div className="sb-field"><label>Max/Slot</label><input type="number" value={editDateForm.maxPatientsPerSlot} min={1} max={10} onChange={e => setEditDateForm((p: any) => ({ ...p, maxPatientsPerSlot: +e.target.value }))} /></div>
                        </div>

                        {/* BREAKS */}
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Breaks</div>
                          <div className="sb-breaks">
                            {(editDateForm.breaks || []).map((b: Break, i: number) => (
                              <div key={i} className="sb-break-row">
                                <Coffee size={11} />
                                <input type="time" value={b.start} onChange={e => { const nb = [...editDateForm.breaks]; nb[i] = { ...nb[i], start: e.target.value }; setEditDateForm((p: any) => ({ ...p, breaks: nb })); }} />
                                <span>–</span>
                                <input type="time" value={b.end} onChange={e => { const nb = [...editDateForm.breaks]; nb[i] = { ...nb[i], end: e.target.value }; setEditDateForm((p: any) => ({ ...p, breaks: nb })); }} />
                                <button className="sb-break-rm" onClick={() => { const nb = editDateForm.breaks.filter((_: any, j: number) => j !== i); setEditDateForm((p: any) => ({ ...p, breaks: nb })); }}><X size={10} /></button>
                              </div>
                            ))}
                            <button className="sb-break-add" onClick={() => setEditDateForm((p: any) => ({ ...p, breaks: [...(p.breaks || []), { start: "12:00", end: "13:00" }] }))}><Plus size={11} /> Add Break</button>
                          </div>
                        </div>

                        {/* Slot Preview */}
                        {editDateForm.startTime && editDateForm.endTime && editDateForm.slotDuration && (
                          <div className="sb-de-preview">
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>Preview:</span>
                            <span className="sb-slot-badge">{generateSlots({ startTime: editDateForm.startTime, endTime: editDateForm.endTime, slotDuration: editDateForm.slotDuration, bufferTime: editDateForm.bufferTime || 0, breaks: editDateForm.breaks || [] }).length} slots</span>
                            <span style={{ fontSize: 10, color: "#64748b" }}>{fmtTime12(editDateForm.startTime)} – {fmtTime12(editDateForm.endTime)}</span>
                            {(editDateForm.breaks || []).length > 0 && <span style={{ fontSize: 10, color: "#d97706" }}> · {editDateForm.breaks.length} break{editDateForm.breaks.length > 1 ? "s" : ""}</span>}
                          </div>
                        )}
                      </>
                    )}

                    <div className="sb-field" style={{ marginTop: 4 }}>
                      <label>Note</label>
                      <input type="text" placeholder="e.g. Holiday, Conference, Half day..." value={editDateForm.note} onChange={e => setEditDateForm((p: any) => ({ ...p, note: e.target.value }))} style={{ width: "100%" }} />
                    </div>
                  </div>

                  <div className="sb-de-footer">
                    {getOverrideForDate(editDate) && (
                      <button className="sb-btn sb-btn-danger" onClick={async () => { await deleteOverride(fmtDate(editDate)); setEditDate(null); setEditDateForm(null); }}>
                        <Trash2 size={12} /> Remove Override
                      </button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button className="sb-btn sb-btn-ghost" onClick={() => { setEditDate(null); setEditDateForm(null); }}>Cancel</button>
                    <button className="sb-btn sb-btn-primary" disabled={saving} onClick={saveCurrentDateOverride}>
                      {saving ? <Loader2 size={13} className="sb-spin" /> : <Check size={13} />} Save Override
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="sb-footer" style={{ marginTop: 16 }}>
              <button className="sb-btn sb-btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={13} /> Back to Months</button>
              <button className="sb-btn sb-btn-ghost" onClick={() => setStep(1)}><Calendar size={13} /> Edit Weekly</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
function scheduleBuilderStyles(accent: string) {
  return `
  .sb-root{font-family:'Inter',system-ui,sans-serif;background:#fff;border-radius:16px;border:1px solid #e8edf2;overflow:hidden;position:relative}
  .sb-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f1f5f9;background:linear-gradient(135deg,${accent}08,${accent}04)}
  .sb-title{font-size:17px;font-weight:800;color:#1e293b}.sb-subtitle{font-size:12px;color:#64748b;margin-top:2px}

  .sb-steps{display:flex;border-bottom:1px solid #f1f5f9;background:#fafbfc;padding:0}
  .sb-step{flex:1;display:flex;align-items:center;gap:10px;padding:14px 18px;border:none;background:none;cursor:pointer;border-bottom:2.5px solid transparent;transition:all .2s;text-align:left;position:relative}
  .sb-step:hover{background:${accent}06}
  .sb-step.active{border-bottom-color:${accent};background:${accent}08}
  .sb-step.done{background:#f0fdf408}
  .sb-step-num{width:26px;height:26px;border-radius:50%;border:2px solid #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#94a3b8;flex-shrink:0}
  .sb-step.active .sb-step-num{border-color:${accent};color:#fff;background:${accent}}
  .sb-step.done .sb-step-num{border-color:#16a34a;color:#fff;background:#16a34a}
  .sb-step-label{font-size:12px;font-weight:700;color:#1e293b}.sb-step-desc{font-size:10px;color:#94a3b8;margin-top:1px}
  .sb-step.active .sb-step-label{color:${accent}}
  .sb-step-arrow{color:#cbd5e1;position:absolute;right:4px;top:50%;transform:translateY(-50%)}

  .sb-body{padding:20px 24px}
  .sb-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:48px 0;color:#94a3b8;font-size:13px}
  @keyframes sbSpin{to{transform:rotate(360deg)}}.sb-spin{animation:sbSpin .7s linear infinite}

  .sb-toast{position:fixed;top:20px;right:20px;z-index:10000;display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.15);animation:sbSlideIn .3s}
  .sb-toast-success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
  .sb-toast-error{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}
  .sb-toast-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.6;margin-left:8px}
  @keyframes sbSlideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}

  .sb-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all .15s}
  .sb-btn:disabled{opacity:.5;cursor:not-allowed}
  .sb-btn-primary{background:linear-gradient(135deg,${accent},${accent}dd);color:#fff;box-shadow:0 4px 12px ${accent}30}
  .sb-btn-primary:hover:not(:disabled){filter:brightness(.92)}
  .sb-btn-ghost{background:#fff;border:1.5px solid #e2e8f0;color:#64748b}.sb-btn-ghost:hover{background:#f8fafc}
  .sb-btn-danger{background:#fff5f5;border:1px solid #fecaca;color:#ef4444}.sb-btn-danger:hover{background:#fef2f2}
  .sb-btn-lg{padding:12px 24px;font-size:13px}
  .sb-icon-btn{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b}

  .sb-section{margin-bottom:20px}.sb-section-head{font-size:13px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:6px;margin-bottom:12px}
  .sb-section-head svg{color:${accent}}

  .sb-presets{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
  .sb-preset-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 12px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;text-align:center;transition:all .15s;min-width:140px;max-width:140px;flex-shrink:0}
  .sb-preset-btn:hover{border-color:${accent};background:${accent}06}
  .sb-preset-btn svg{color:${accent};flex-shrink:0}
  .sb-preset-btn strong{font-size:11px;color:#1e293b;display:block;white-space:nowrap}.sb-preset-btn span{font-size:9px;color:#94a3b8;line-height:1.3}
  .sb-preset-highlight{border-color:${accent}55;background:${accent}08}
  .sb-preset-highlight strong{color:${accent}}

  .sb-template-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:16px;font-size:12px;color:#64748b}
  .sb-template-bar select{padding:6px 10px;border-radius:7px;border:1px solid #e2e8f0;font-size:12px;flex:1;max-width:300px}

  .sb-stats{display:flex;align-items:center;gap:16px;padding:14px 18px;background:#fafbfc;border-radius:12px;border:1px solid #e8edf2;margin-bottom:16px;flex-wrap:wrap}
  .sb-stat{text-align:center;min-width:70px}
  .sb-stat-val{font-size:22px;font-weight:800;line-height:1}.sb-stat-lbl{font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
  .sb-bulk-btn{margin-left:auto;display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:11px;font-weight:600;color:#64748b;cursor:pointer}
  .sb-bulk-btn:hover{background:#f1f5f9}

  .sb-bulk-panel{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:16px}
  .sb-bulk-head{font-size:12px;font-weight:700;color:#92400e;margin-bottom:10px}
  .sb-bulk-fields{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .sb-bulk-fields label{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#64748b}
  .sb-bulk-fields input{width:60px;padding:5px 8px;border:1px solid #fde68a;border-radius:7px;font-size:12px}

  .sb-day-grid{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
  .sb-day-card{display:flex;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;transition:all .2s;background:#f8fafc}
  .sb-day-card.active{border-color:${accent}44;background:${accent}04}
  .sb-day-left{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 16px;gap:6px;cursor:pointer;user-select:none;min-width:90px;border-right:1px solid #e2e8f020}
  .sb-day-card.active .sb-day-left{background:${accent}10;border-right-color:${accent}15}
  .sb-day-name{font-size:11px;font-weight:700;color:#94a3b8}.sb-day-card.active .sb-day-name{color:${accent}}

  .sb-toggle{width:36px;height:20px;border-radius:100px;background:#cbd5e1;position:relative;transition:background .2s}
  .sb-toggle[data-on="true"]{background:${accent}}
  .sb-toggle-knob{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:left .2s}
  .sb-toggle[data-on="true"] .sb-toggle-knob{left:18px}

  .sb-day-right{flex:1;padding:12px 16px;display:flex;flex-direction:column;gap:8px}
  .sb-day-fields{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
  .sb-field{display:flex;flex-direction:column;gap:3px}
  .sb-field label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em}
  .sb-field input,.sb-field select{padding:6px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:12px;color:#334155;background:#fff;outline:none;font-family:inherit;min-width:0}
  .sb-field input:focus,.sb-field select:focus{border-color:${accent};box-shadow:0 0 0 3px ${accent}15}
  .sb-field input[type="number"]{width:60px}.sb-field input[type="time"]{width:110px}

  .sb-day-off-label{flex:1;display:flex;align-items:center;padding:0 20px;font-size:12px;color:#94a3b8;font-weight:600}

  .sb-breaks{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  .sb-break-row{display:flex;align-items:center;gap:5px;padding:4px 8px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px}
  .sb-break-row svg{color:#d97706}.sb-break-row input{width:80px;padding:3px 6px;border:1px solid #fde68a;border-radius:6px;font-size:11px;background:#fff}
  .sb-break-row span{color:#94a3b8;font-size:11px}
  .sb-break-rm{width:20px;height:20px;border:none;background:#fef2f2;color:#ef4444;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .sb-break-add{display:flex;align-items:center;gap:4px;padding:4px 10px;border:1px dashed #fde68a;background:#fffbeb;color:#d97706;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer}

  .sb-day-footer{display:flex;align-items:center;gap:10px;margin-top:2px}
  .sb-slot-badge{padding:3px 10px;border-radius:100px;background:${accent}15;color:${accent};font-size:11px;font-weight:700}
  .sb-copy-btn{display:flex;align-items:center;gap:4px;padding:3px 10px;border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer}
  .sb-copy-btn:hover{border-color:${accent};color:${accent}}

  .sb-footer{display:flex;justify-content:flex-end;gap:8px;padding-top:16px;border-top:1px solid #f1f5f9}

  .sb-mini-modal{margin-top:12px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
  .sb-mini-head{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:10px}
  .sb-mini-modal input{width:100%;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;margin-bottom:10px}
  .sb-mini-actions{display:flex;gap:8px;justify-content:flex-end}

  /* STEP 2 */
  .sb-s2-info{background:linear-gradient(135deg,${accent}08,${accent}04);border:1px solid ${accent}20;border-radius:12px;padding:16px 20px;margin-bottom:18px}
  .sb-s2-info-title{font-size:14px;font-weight:800;color:#1e293b;margin-bottom:4px}
  .sb-s2-info-desc{font-size:12px;color:#64748b;line-height:1.5}
  .sb-s2-preview{background:#f8fafc;border:1px solid #e8edf2;border-radius:10px;padding:12px 16px;margin-bottom:4px}
  .sb-s2-preview-title{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}
  .sb-s2-preview-days{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
  .sb-s2-pd{padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff}
  .sb-s2-pd.on{border-color:${accent}30;background:${accent}04}
  .sb-s2-pd.off{opacity:.5}
  .sb-s2-pd strong{font-size:11px;color:#1e293b;display:block}.sb-s2-pd span{font-size:10px;color:#64748b}

  .sb-year-nav{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:10px}
  .sb-year-title{font-size:20px;font-weight:800;color:#1e293b;min-width:80px;text-align:center}
  .sb-nav-btn{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b}
  .sb-nav-btn:hover{background:#f1f5f9}

  .sb-year-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}
  @media(max-width:700px){.sb-year-grid{grid-template-columns:repeat(3,1fr)}}
  .sb-year-month{border:1.5px solid #e2e8f0;border-radius:12px;padding:14px;cursor:pointer;transition:all .15s;background:#fff}
  .sb-year-month:hover{border-color:${accent}55;background:${accent}04}
  .sb-year-month.selected{border-color:${accent};background:${accent}08;box-shadow:0 0 0 3px ${accent}15}
  .sb-ym-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .sb-ym-check{width:20px;height:20px;border-radius:6px;border:1.5px solid #cbd5e1;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
  .sb-year-month.selected .sb-ym-check{background:${accent};border-color:${accent}}
  .sb-ym-name{font-size:13px;font-weight:700;color:#1e293b}
  .sb-ym-info{display:flex;gap:6px;flex-wrap:wrap}
  .sb-ym-tag{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700}
  .sb-ym-tag.green{background:#f0fdf4;color:#16a34a}.sb-ym-tag.red{background:#fff5f5;color:#ef4444}
  .sb-ym-empty{font-size:10px;color:#94a3b8}

  .sb-year-apply{background:#fafbfc;border:1px solid #e8edf2;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:12px}
  .sb-ya-head{font-size:14px;font-weight:700;color:#1e293b}
  .sb-ya-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .sb-ya-row .sb-field{flex:1;min-width:200px}
  .sb-ya-row .sb-field select{width:100%}
  .sb-ya-days{display:flex;gap:4px;flex-wrap:wrap}
  .sb-ya-day{padding:5px 10px;border-radius:7px;border:1.5px solid #e2e8f0;background:#fff;font-size:11px;font-weight:600;color:#64748b;cursor:pointer}
  .sb-ya-day:hover{border-color:${accent}55}.sb-ya-day.on{border-color:${accent};background:${accent}12;color:${accent}}

  /* STEP 3 */
  .sb-month-nav{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:16px}
  .sb-month-title{font-size:16px;font-weight:800;color:#1e293b;min-width:180px;text-align:center}

  .sb-month-stats{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
  .sb-mstat{flex:1;min-width:80px;text-align:center;padding:10px;background:#fafbfc;border-radius:10px;border:1px solid #e8edf2}
  .sb-mstat-v{font-size:20px;font-weight:800;display:block;line-height:1}.sb-mstat-l{font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-top:3px}

  .sb-cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px}
  .sb-cal-dow div{text-align:center;font-size:10px;font-weight:700;color:#94a3b8;padding:6px 0;text-transform:uppercase}

  .sb-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:16px}
  .sb-cal-cell{min-height:72px;border-radius:8px;padding:6px 8px;cursor:pointer;transition:all .15s;border:1.5px solid transparent;position:relative}
  .sb-cal-empty{background:transparent;cursor:default}
  .sb-cal-on{background:${accent}06;border-color:${accent}20}.sb-cal-on:hover{border-color:${accent}55}
  .sb-cal-off{background:#f8fafc;border-color:#e2e8f0}.sb-cal-off:hover{border-color:#cbd5e1}
  .sb-cal-today{box-shadow:inset 0 0 0 2px ${accent}}
  .sb-cal-override{border-color:#7c3aed66!important;background:#f5f3ff!important}
  .sb-cal-sel{border-color:${accent}!important;box-shadow:0 0 0 3px ${accent}25!important}
  .sb-cal-date{font-size:12px;font-weight:700;color:#1e293b}
  .sb-cal-badge{position:absolute;top:3px;right:4px;font-size:7px;font-weight:700;color:#7c3aed;background:#ede9fe;padding:1px 5px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em}
  .sb-cal-time{font-size:9px;color:#64748b;margin-top:2px}.sb-cal-slots{font-size:9px;color:${accent};font-weight:700}
  .sb-cal-off-lbl{font-size:10px;color:#94a3b8;margin-top:4px}
  .sb-cal-brk{font-size:8px;color:#d97706;font-weight:600}
  .sb-cal-legend{display:flex;gap:16px;font-size:11px;color:#64748b;align-items:center}
  .sb-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}

  /* MODAL OVERLAY */
  .sb-modal-overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:sbFadeIn .2s}
  @keyframes sbFadeIn{from{opacity:0}to{opacity:1}}
  .sb-modal{background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.2),0 0 0 1px ${accent}15;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;animation:sbModalIn .25s}
  @keyframes sbModalIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

  .sb-de-head{display:flex;align-items:flex-start;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #f1f5f9;background:${accent}06;border-radius:16px 16px 0 0}
  .sb-de-title{font-size:15px;font-weight:800;color:#1e293b}.sb-de-note{font-size:11px;color:${accent};margin-top:2px}
  .sb-de-body{padding:18px 22px;display:flex;flex-direction:column;gap:12px}
  .sb-de-toggle{display:flex;align-items:center;gap:10px;cursor:pointer}.sb-de-toggle input{width:17px;height:17px;accent-color:${accent}}
  .sb-de-fields{display:flex;gap:10px;flex-wrap:wrap}
  .sb-de-footer{display:flex;gap:8px;padding:16px 22px;border-top:1px solid #f1f5f9;align-items:center;border-radius:0 0 16px 16px}
  .sb-de-preview{display:flex;align-items:center;gap:8px;margin-top:6px;padding:8px 12px;background:#fafbfc;border-radius:8px;border:1px solid #e8edf2}

  /* TEMPLATE MANAGEMENT */
  .sb-edit-banner{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;margin-bottom:16px;font-size:12px;color:#92400e;flex-wrap:wrap}
  .sb-edit-banner svg{flex-shrink:0;color:#d97706}
  .sb-edit-banner strong{color:#78350f}

  .sb-tpl-list{display:flex;flex-direction:column;gap:6px}
  .sb-tpl-empty{font-size:12px;color:#94a3b8;padding:16px;text-align:center;background:#fafbfc;border-radius:10px;border:1px dashed #e2e8f0}
  .sb-tpl-card{border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;transition:all .15s;overflow:hidden}
  .sb-tpl-card:hover{border-color:${accent}40}
  .sb-tpl-card.editing{border-color:#d97706;background:#fffbeb}
  .sb-tpl-row{display:flex;align-items:center;gap:12px;padding:10px 14px}
  .sb-tpl-info{flex:1;min-width:0}
  .sb-tpl-name{font-size:13px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sb-tpl-meta{font-size:10px;color:#94a3b8;margin-top:1px}
  .sb-tpl-actions{display:flex;gap:4px;flex-shrink:0}
  .sb-tpl-action{width:28px;height:28px;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all .15s}
  .sb-tpl-action:hover{border-color:${accent};color:${accent};background:${accent}08}
  .sb-tpl-action-danger:hover{border-color:#ef4444;color:#ef4444;background:#fff5f5}
  .sb-tpl-detail{padding:8px 14px 12px;border-top:1px solid #f1f5f9;display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:4px}
  .sb-tpl-day{padding:5px 10px;border-radius:7px;border:1px solid #e2e8f0;background:#fff}
  .sb-tpl-day.on{border-color:${accent}25;background:${accent}04}
  .sb-tpl-day.off{opacity:.45}
  .sb-tpl-day strong{font-size:11px;color:#1e293b;display:block}.sb-tpl-day span{font-size:9px;color:#64748b}
  `;
}
