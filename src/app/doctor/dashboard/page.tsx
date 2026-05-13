"use client";
import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  UserRound, Loader2, PlayCircle, CheckCircle2, X, FileText, Clock, RefreshCw, Pencil, Activity, ClipboardCheck,
  BarChart2, TrendingUp, IndianRupee, Users, ArrowRight, Search, Download, FileSpreadsheet, FileType, ArrowUpDown, LogOut
} from "lucide-react";
import {
  ResponsiveContainer as RechartsResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area as RechartsArea,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell as RechartsCell,
  ComposedChart as RechartsComposedChart,
  Bar as RechartsBar,
  Line as RechartsLine,
  BarChart as RechartsBarChart,
} from "recharts";

import PatientProfilePanel from "@/components/PatientProfilePanel";
import PrescriptionSettingsPanel from "@/components/PrescriptionSettingsPanel";
import ScheduleBuilder from "@/components/ScheduleBuilder";
import { DoctorAttendancePanel } from "@/components/DoctorAttendancePanel";
import { useDoctorDashboard } from "./DoctorDashboardContext";
import dynamic from "next/dynamic";

const PatientsManagementPanelLazy = dynamic(() => import("@/app/subdept/dashboard/PatientsManagementPanel").then(mod => mod.PatientsManagementPanel), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Patient Management...</span></div> });

const RxManagementPanelLazy = dynamic(() => import("./RxManagementPanel").then(mod => mod.RxManagementPanel), { ssr: false, loading: () => <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",width:"100%"}}><span style={{fontSize:13,color:"#94a3b8",display:"flex",alignItems:"center",gap:8}}><Loader2 size={16} style={{animation:"spin .7s linear infinite"}}/>Loading Rx Panel...</span></div> });

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_H = ["M", "T", "W", "T", "F", "S", "S"];

const TYPE_LABEL: Record<string, string> = {
  OPD: "OPD", ONLINE: "Online", FOLLOW_UP: "Follow-up", EMERGENCY: "Emergency",
};
const STATUS_CFG: Record<string, { label: string; dot: string; badge: [string, string, string] }> = {
  SCHEDULED: { label: "Scheduled", dot: "#94a3b8", badge: ["#f8fafc", "#475569", "#e2e8f0"] },
  CONFIRMED: { label: "Confirmed", dot: "#10b981", badge: ["#f0fdf4", "#16a34a", "#bbf7d0"] },
  IN_PROGRESS: { label: "In Progress", dot: "#0E898F", badge: ["#E6F4F4", "#0A6B70", "#B3E0E0"] },
  COMPLETED: { label: "Completed", dot: "#059669", badge: ["#f0fdf4", "#059669", "#a7f3d0"] },
  CANCELLED: { label: "Cancelled", dot: "#ef4444", badge: ["#fff5f5", "#ef4444", "#fecaca"] },
  NO_SHOW: { label: "No Show", dot: "#f97316", badge: ["#fff7ed", "#c2410c", "#fed7aa"] },
  RESCHEDULED: { label: "Rescheduled", dot: "#a855f7", badge: ["#faf5ff", "#7c3aed", "#e9d5ff"] },
};

function RescheduleModal({ appt, onClose, onConfirm }: { appt: any; onClose: () => void; onConfirm: (date: string, time: string) => void }) {
  const fmtD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);

  const [newDate, setNewDate] = useState(fmtD(tomorrow));
  const [selectedTime, setSelectedTime] = useState("");
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [noAvailability, setNoAvailability] = useState(false);
  const [slotErr, setSlotErr] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const isSameDateAsAppt = (date: string) => {
    const apptDate = appt.appointmentDate ? fmtD(new Date(appt.appointmentDate)) : "";
    return date === apptDate;
  };

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setAllSlots([]);
    setBookedSlots([]);
    setSelectedTime("");
    setNoAvailability(false);
    setSlotErr("");
    setErr("");
    try {
      const r = await fetch(
        `/api/appointments/slots?doctorId=${appt.doctorId}&date=${date}`,
        { credentials: "include" }
      ).then(x => x.json());
      if (r.success) {
        let all: string[] = r.data?.allSlots || [];
        let booked: string[] = r.data?.bookedSlots || [];
        if (isSameDateAsAppt(date)) {
          booked = booked.filter((s: string) => s !== appt.timeSlot);
        }
        // Hide past slots when the selected date is today
        const isToday = date === fmtD(new Date());
        if (isToday) {
          const now = new Date();
          const nowMins = now.getHours() * 60 + now.getMinutes();
          all = all.filter(s => {
            const [h, m] = s.split(":").map(Number);
            return h * 60 + m > nowMins;
          });
          booked = booked.filter(s => {
            const [h, m] = s.split(":").map(Number);
            return h * 60 + m > nowMins;
          });
        }
        if (!all.length) {
          setNoAvailability(true);
        } else {
          setAllSlots(all);
          setBookedSlots(booked);
        }
      } else {
        setSlotErr(r.message || "Could not load slots.");
      }
    } catch {
      setSlotErr("Network error loading slots.");
    } finally {
      setSlotsLoading(false);
    }
  }, [appt.doctorId, appt.timeSlot, appt.appointmentDate]);

  useEffect(() => {
    if (newDate) fetchSlots(newDate);
  }, [newDate, fetchSlots]);

  const handleConfirm = () => {
    if (!newDate) { setErr("Please select a date."); return; }
    if (!selectedTime) { setErr("Please select a time slot."); return; }
    setSaving(true);
    onConfirm(newDate, selectedTime);
  };

  const availableSlots = allSlots.filter(s => !bookedSlots.includes(s));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,.18)", fontFamily: "'Inter',sans-serif", maxHeight: "90vh", overflowY: "auto" }}>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>Reschedule Appointment</div>
            <div style={{ fontSize:11, color: "#64748b" }}>{appt.patient?.name} &nbsp;·&nbsp; Token #{appt.tokenNumber}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexShrink: 0 }}><X size={14} /></button>
        </div>

        <div style={{ background: "#E6F4F4", borderRadius: 12, padding: "12px 14px", marginBottom: 20, border: "1px solid #B3E0E0" }}>
          <div style={{ fontSize:10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Current Appointment</div>
          <div style={{ fontSize:12, fontWeight: 600, color: "#07595D" }}>
            {new Date(appt.appointmentDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} &nbsp;at&nbsp; {appt.timeSlot}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Select New Date</label>
          <input
            type="date"
            value={newDate}
            min={fmtD(new Date())}
            onChange={e => { setNewDate(e.target.value); setErr(""); }}
            style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #B3E0E0", background: "#f8fafc", fontSize:13, color: "#334155", outline: "none", fontFamily: "'Inter',sans-serif", boxSizing: "border-box", cursor: "pointer" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Available Time Slots</label>
            {!slotsLoading && allSlots.length > 0 && (
              <span style={{ fontSize:10, color: "#0E898F", fontWeight: 600, background: "#E6F4F4", padding: "2px 8px", borderRadius: 100, border: "1px solid #B3E0E0" }}>
                {availableSlots.length} available
              </span>
            )}
          </div>

          {slotsLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 0", color: "#94a3b8", fontSize:12 }}>
              <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> Loading doctor schedule...
            </div>
          ) : slotErr ? (
            <div style={{ fontSize:11, color: "#ef4444", fontWeight: 600, padding: "12px", background: "#fff5f5", borderRadius: 9, border: "1px solid #fecaca" }}>{slotErr}</div>
          ) : noAvailability ? (
            <div style={{ fontSize:12, color: "#f59e0b", fontWeight: 600, padding: "14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", textAlign: "center" }}>
              Doctor is not available on this day. Please choose another date.
            </div>
          ) : allSlots.length === 0 ? null : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {allSlots.map(slot => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    disabled={isBooked}
                    onClick={() => { if (!isBooked) { setSelectedTime(slot); setErr(""); } }}
                    style={{
                      padding: "9px 6px",
                      borderRadius: 9,
                      border: isSelected ? "2px solid #0E898F" : isBooked ? "1px solid #e2e8f0" : "1.5px solid #B3E0E0",
                      background: isSelected ? "#0E898F" : isBooked ? "#f1f5f9" : "#E6F4F4",
                      color: isSelected ? "#fff" : isBooked ? "#cbd5e1" : "#0A6B70",
                      fontSize:11,
                      fontWeight: 700,
                      cursor: isBooked ? "not-allowed" : "pointer",
                      textDecoration: isBooked ? "line-through" : "none",
                      fontFamily: "'Inter',sans-serif",
                      transition: "all .15s",
                      position: "relative",
                    }}
                  >
                    {slot}
                    {isBooked && (
                      <span style={{ position: "absolute", top: -6, right: -4, fontSize:9, background: "#ef4444", color: "#fff", borderRadius: 100, padding: "1px 4px", fontWeight: 700 }}>Full</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedTime && (
            <div style={{ marginTop: 10, fontSize:11, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <CheckCircle2 size={13} /> Selected: {selectedTime}
            </div>
          )}
        </div>

        {err && <div style={{ fontSize:11, color: "#ef4444", marginBottom: 12, fontWeight: 600 }}>{err}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={saving}
            style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "2px solid #0E898F", background: "#fff", color: "#0E898F", fontSize:12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={saving || !selectedTime}
            style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: saving || !selectedTime ? "#94a3b8" : "#0E898F", color: "#fff", fontSize:12, fontWeight: 700, cursor: saving || !selectedTime ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: saving || !selectedTime ? "none" : "0 4px 14px rgba(14,137,143,.35)" }}>
            {saving ? <><Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> Saving…</> : <><RefreshCw size={13} /> Confirm Reschedule</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsultModal({ appt, onClose, onDone, onStartPrescription, setSelectedPatientId }: { appt: any; onClose: () => void; onDone: () => void; onStartPrescription: (id: string) => void; setSelectedPatientId: (id: string) => void }) {
  const [notes, setNotes] = useState(appt.notes || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [subDepts, setSubDepts] = useState<any[]>([]);
  const [subDeptId, setSubDeptId] = useState<string>(appt.subDepartmentId || "");
  const [subDeptNote, setSubDeptNote] = useState<string>(appt.subDeptNote || "");
  const [showReferral, setShowReferral] = useState(!!(appt.subDepartmentId));
  const [transferToBilling, setTransferToBilling] = useState(false);
  const [billingNote, setBillingNote] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [showServicePlan, setShowServicePlan] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [planCreated, setPlanCreated] = useState(false);
  const [subDeptsLoaded, setSubDeptsLoaded] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  useEffect(() => {
    if (showReferral && !subDeptsLoaded) {
      api("/api/config/subdepartments?limit=50").then(r => {
        if (r.success) setSubDepts(r.data?.data || r.data || []);
      }).catch(() => { }).finally(() => setSubDeptsLoaded(true));
    }
  }, [showReferral, subDeptsLoaded]);

  useEffect(() => {
    if (showServicePlan && !servicesLoaded) {
      api("/api/config/services?isActive=true&limit=100").then(r => {
        if (r.success) setServices(r.data?.services || r.data?.data || []);
      }).catch(() => { }).finally(() => setServicesLoaded(true));
    }
  }, [showServicePlan, servicesLoaded]);

  const doBillingTransfer = async () => {
    const r = await api("/api/billing/transfer", "POST", {
      appointmentId: appt.id,
      note: billingNote || "Transferred from consultation"
    });
    if (!r.success) {
      setMsg(r.message || "Failed to transfer to billing");
      return false;
    }
    return true;
  };

  const handleStartPrescription = async () => {
    if (transferToBilling) {
      setSaving(true);
      const ok = await doBillingTransfer();
      setSaving(false);
      if (!ok) return;
    }
    onStartPrescription(appt.id);
  };

  const handleCompleteAndBill = async () => {
    setSaving(true);
    const body: any = { status: "COMPLETED", notes: notes || undefined };
    if (showReferral && subDeptId) {
      body.subDepartmentId = subDeptId;
      body.subDeptNote = subDeptNote || undefined;
    }
    const d = await api(`/api/appointments/${appt.id}`, "PUT", body);
    if (d.success) {
      await doBillingTransfer();
      onDone(); onClose();
    } else {
      setMsg(d.message || "Failed to complete");
    }
    setSaving(false);
  };

  const update = async (status: string) => {
    setSaving(true);
    const body: any = { status, notes: notes || undefined };
    if (showReferral && subDeptId) {
      body.subDepartmentId = subDeptId;
      body.subDeptNote = subDeptNote || undefined;
    } else if (!showReferral) {
      body.subDepartmentId = null;
      body.subDeptNote = null;
    }

    // Transfer to billing if selected
    if (transferToBilling) {
      const ok = await doBillingTransfer();
      if (!ok) { setSaving(false); return; }
    }

    const d = await api(`/api/appointments/${appt.id}`, "PUT", body);
    if (d.success) {
      if (status === "COMPLETED" && showServicePlan && selectedServiceId && appt.patient?.id && !planCreated) {
        const svc = services.find((s: any) => s.id === selectedServiceId);
        api("/api/treatment-plans", "POST", {
          patientId: appt.patient.id,
          serviceId: selectedServiceId,
          doctorId: appt.doctorId,
          departmentId: appt.departmentId,
          planName: svc?.name || "Treatment Plan",
          totalSessions: svc?.sessionCount || 1,
          totalCost: svc?.price || 0,
        }).then(() => setPlanCreated(true)).catch(() => { });
      }
      onDone(); onClose();
    }
    else setMsg(d.message || "Failed to update");
    setSaving(false);
  };

  const sc = STATUS_CFG[appt.status] || STATUS_CFG.SCHEDULED;
  const patientName = appt.patient?.name || "Patient";
  const apptDate = new Date(appt.appointmentDate);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 24px 60px rgba(0,0,0,.18)", fontFamily: "'Inter',sans-serif", margin: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize:17, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>Patient Consultation</div>
            <div style={{ fontSize:12, color: "#64748b" }}>{apptDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {appt.timeSlot}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}><X size={14} /></button>
        </div>

        <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginBottom: 18, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize:15 }}>
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight: 700, color: "#1e293b" }}>{patientName}</div>
              <div style={{ fontSize:11, color: "#64748b", display: "flex", gap: 8, marginTop: 2 }}>
                <span>{appt.patient?.patientId}</span>
                {appt.patient?.phone && <><span>·</span><span>{appt.patient.phone}</span></>}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{ fontSize:10, padding: "4px 10px", borderRadius: 100, background: sc.badge[0], color: sc.badge[1], border: `1px solid ${sc.badge[2]}`, fontWeight: 700 }}>{sc.label}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {[
              ["Type", TYPE_LABEL[appt.type] || appt.type],
              ["Token", appt.tokenNumber ? `#${appt.tokenNumber}` : "—"],
              ["Fee", appt.consultationFee ? `₹${appt.consultationFee}` : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ flex: 1, background: "#fff", borderRadius: 9, padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize:10, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize:12, fontWeight: 700, color: "#334155" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Consultation Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Diagnosis, prescription, follow-up instructions..."
            style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize:12, color: "#334155", outline: "none", resize: "vertical", fontFamily: "'Inter',sans-serif" }} />
        </div>

        <div style={{ marginBottom: 18, background: showReferral ? "#f0fdf4" : "#f8fafc", borderRadius: 12, border: `1.5px solid ${showReferral ? "#bbf7d0" : "#e2e8f0"}`, overflow: "hidden" }}>
          <button onClick={() => setShowReferral(v => !v)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: showReferral ? "#22c55e" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={showReferral ? "#fff" : "#94a3b8"} style={{ transform: showReferral ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </div>
              <span style={{ fontSize:11, fontWeight: 700, color: showReferral ? "#166534" : "#64748b" }}>
                {showReferral ? "Referring to Sub-Department" : "Refer to Sub-Department (optional)"}
              </span>
            </div>
            {appt.subDepartmentId && <span style={{ fontSize:10, background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Previously Referred</span>}
          </button>
          {showReferral && (
            <div style={{ padding: "0 14px 14px" }}>
              <select value={subDeptId} onChange={e => setSubDeptId(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #bbf7d0", background: "#fff", fontSize:12, color: "#334155", outline: "none", marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>
                <option value="">— Select Sub-Department —</option>
                {subDepts.map((sd: any) => (
                  <option key={sd.id} value={sd.id}>{sd.name} ({sd.type})</option>
                ))}
              </select>
              <textarea value={subDeptNote} onChange={e => setSubDeptNote(e.target.value)} rows={2}
                placeholder="Referral instructions for sub-dept"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #bbf7d0", background: "#fff", fontSize:11, color: "#334155", outline: "none", resize: "none", fontFamily: "'Inter',sans-serif" }} />
              {!subDeptId && <p style={{ fontSize:10, color: "#f59e0b", marginTop: 5, fontWeight: 600 }}>Select a sub-department to save the referral.</p>}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14, background: transferToBilling ? "#fef3c7" : "#f8fafc", borderRadius: 12, border: `1.5px solid ${transferToBilling ? "#fde68a" : "#e2e8f0"}`, overflow: "hidden" }}>
          <button onClick={() => setTransferToBilling(v => !v)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: transferToBilling ? "#f59e0b" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={transferToBilling ? "#fff" : "#94a3b8"} style={{ transform: transferToBilling ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </div>
              <span style={{ fontSize:11, fontWeight: 700, color: transferToBilling ? "#92400e" : "#64748b" }}>
                {transferToBilling ? "Transferring to Billing" : "Transfer to Billing (optional)"}
              </span>
            </div>
          </button>
          {transferToBilling && (
            <div style={{ padding: "0 14px 14px" }}>
              <textarea value={billingNote} onChange={e => setBillingNote(e.target.value)} rows={2}
                placeholder="Billing notes (optional)..."
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #fde68a", background: "#fff", fontSize:11, color: "#334155", outline: "none", resize: "none", fontFamily: "'Inter',sans-serif" }} />
              <div style={{ fontSize:10, color: "#92400e", marginTop: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                ✓ Patient will be sent to billing queue with consultation fee
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14, background: showServicePlan ? "#eff6ff" : "#f8fafc", borderRadius: 12, border: `1.5px solid ${showServicePlan ? "#bfdbfe" : "#e2e8f0"}`, overflow: "hidden" }}>
          <button onClick={() => setShowServicePlan(v => !v)}
            style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'Inter',sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: showServicePlan ? "#3b82f6" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={12} color={showServicePlan ? "#fff" : "#94a3b8"} style={{ transform: showServicePlan ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </div>
              <span style={{ fontSize:11, fontWeight: 700, color: showServicePlan ? "#1d4ed8" : "#64748b" }}>Assign Service Package (optional)</span>
            </div>
            {planCreated && <span style={{ fontSize:10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>Plan Created</span>}
          </button>
          {showServicePlan && (
            <div style={{ padding: "0 14px 14px" }}>
              <select value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #bfdbfe", background: "#fff", fontSize:12, color: "#334155", outline: "none", fontFamily: "'Inter',sans-serif" }}>
                <option value="">— Select Package —</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.sessionCount} sessions · ₹{s.price?.toLocaleString()}</option>
                ))}
              </select>
              {selectedServiceId && (
                <div style={{ fontSize:10, color: "#1d4ed8", marginTop: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  ✓ Treatment plan will be auto-created when consultation is completed
                </div>
              )}
              {services.length === 0 && (
                <div style={{ fontSize:10, color: "#94a3b8", marginTop: 8 }}>No service packages configured yet. Add them in Configure → Services & Packages.</div>
              )}
            </div>
          )}
        </div>

        {msg && <div style={{ fontSize:11, color: "#ef4444", marginBottom: 10, fontWeight: 600 }}>{msg}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (
            <button onClick={handleStartPrescription} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(59,130,246,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <PlayCircle size={15} />}
              Start Consultation
            </button>
          )}
          {appt.status === "IN_PROGRESS" && (
            <button onClick={handleStartPrescription} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(59,130,246,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <PlayCircle size={15} />}
              Continue Prescription
            </button>
          )}
          {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS") && transferToBilling && (
            <button onClick={handleCompleteAndBill} disabled={saving}
              style={{ padding: "11px 16px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(245,158,11,.3)" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <CheckCircle2 size={15} />}
              Complete & Bill
            </button>
          )}
          {appt.status === "COMPLETED" && (
            <button onClick={() => update("COMPLETED")} disabled={saving || (showReferral && !subDeptId)}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, background: "#f0fdf4", color: "#059669", fontSize:12, fontWeight: 700, cursor: "pointer", border: "1.5px solid #bbf7d0" }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : "Update Notes & Referral"}
            </button>
          )}
          {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (
            <button onClick={() => update("NO_SHOW")} disabled={saving}
              style={{ padding: "11px 16px", borderRadius: 11, border: "1.5px solid #fed7aa", background: "#fff7ed", color: "#c2410c", fontSize:12, fontWeight: 700, cursor: "pointer" }}>
              No Show
            </button>
          )}
        </div>

        {appt.patient?.id && (
          <button
            onClick={() => { setSelectedPatientId(appt.patient.id); onClose(); }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12, fontSize:11, color: "#0E898F", fontWeight: 600, background: "none", border: "none", cursor: "pointer", width: "100%" }}
          >
            <FileText size={12} />View Full Patient Profile
          </button>
        )}
      </div>
    </div>
  );
}

function MiniCalendar({ accent = "#10b981", selectedDate, onDateSelect }: { accent?: string; selectedDate?: Date; onDateSelect?: (d: Date) => void }) {
  const today = new Date();
  const [cur, setCur] = useState({ y: selectedDate?.getFullYear() || today.getFullYear(), m: selectedDate?.getMonth() ?? today.getMonth() });
  const firstDay = new Date(cur.y, cur.m, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const isTodayCell = (d: number | null) => d === today.getDate() && cur.m === today.getMonth() && cur.y === today.getFullYear();
  const isSelected = (d: number | null) => selectedDate && d === selectedDate.getDate() && cur.m === selectedDate.getMonth() && cur.y === selectedDate.getFullYear();
  const handleClick = (d: number | null) => { if (d && onDateSelect) onDateSelect(new Date(cur.y, cur.m, d)); };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize:14, fontWeight: 700, color: "#1e293b" }}>{MONTHS[cur.m]} {cur.y}</span>
        <div style={{ display: "flex", gap: 4 }}>
          {["‹", "›"].map((a, i) => (
            <button key={i} onClick={() => setCur(c => { const nm = c.m + (i ? 1 : -1); return nm < 0 ? { y: c.y - 1, m: 11 } : nm > 11 ? { y: c.y + 1, m: 0 } : { ...c, m: nm }; })}
              style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: i ? accent : "#e2e8f0", color: i ? "#fff" : "#64748b", cursor: "pointer", fontSize:13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{a}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
        {DAYS_H.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize:10, fontWeight: 600, color: "#94a3b8", padding: "2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => {
          const sel = isSelected(d);
          const tod = isTodayCell(d);
          return (
            <div key={i} onClick={() => handleClick(d)} style={{ textAlign: "center", fontSize:11, fontWeight: (sel || tod) ? 700 : 400, padding: "5px 0", borderRadius: 8, cursor: d ? "pointer" : "default", background: sel ? accent : tod ? accent + "33" : "transparent", color: sel ? "#fff" : tod ? accent : d ? "#334155" : "transparent", border: tod && !sel ? `1px solid ${accent}` : '1px solid transparent' }}>{d || ""}</div>
          );
        })}
      </div>
    </div>
  );
}

const SCHED_DURATIONS = [10, 15, 20, 30, 45, 60];
const SCHED_DAY_LABELS: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };
const ALL_SCHED_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function ScheduleMgmtTab({ accent, localSchedule, setLocalSchedule, scheduleLoading, scheduleSaving, setScheduleSaving, scheduleMsg, setScheduleMsg, fetchWeeklySchedule }: {
  accent: string;
  localSchedule: Record<string, { startTime: string; endTime: string; slotDuration: number; isActive: boolean }>;
  setLocalSchedule: React.Dispatch<React.SetStateAction<Record<string, { startTime: string; endTime: string; slotDuration: number; isActive: boolean }>>>;
  scheduleLoading: boolean;
  scheduleSaving: boolean;
  setScheduleSaving: (v: boolean) => void;
  scheduleMsg: { type: "success" | "error"; text: string } | null;
  setScheduleMsg: (v: { type: "success" | "error"; text: string } | null) => void;
  fetchWeeklySchedule: () => void;
}) {
  const setDay = (day: string, field: string, val: any) =>
    setLocalSchedule(p => ({ ...p, [day]: { ...p[day], [field]: val } }));

  const applyTemplate = (activeDays: string[]) =>
    setLocalSchedule(p => { const n = { ...p }; ALL_SCHED_DAYS.forEach(d => { n[d] = { ...n[d], isActive: activeDays.includes(d) }; }); return n; });

  const slotsFor = (start: string, end: string, dur: number) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return mins > 0 ? Math.floor(mins / dur) : 0;
  };

  const saveAll = async () => {
    setScheduleSaving(true);
    setScheduleMsg(null);
    const schedules = ALL_SCHED_DAYS.filter(d => localSchedule[d]?.isActive).map(d => ({
      day: d, startTime: localSchedule[d].startTime, endTime: localSchedule[d].endTime,
      slotDuration: localSchedule[d].slotDuration, isActive: true,
    }));
    const res = await fetch("/api/doctor/availability", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedules }) }).then(r => r.json());
    setScheduleSaving(false);
    if (res.success) { setScheduleMsg({ type: "success", text: `Schedule saved — ${schedules.length} working day(s) configured` }); fetchWeeklySchedule(); }
    else setScheduleMsg({ type: "error", text: res.message || "Failed to save schedule" });
  };

  return (
    <div className="doc-card">
      <div className="doc-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="doc-card-title">Schedule Setup</div>
          <div className="doc-card-sub">Configure weekly availability and appointment slot durations</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchWeeklySchedule} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:10, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={11} />Reload
          </button>
          <button onClick={saveAll} disabled={scheduleSaving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${accent},#059669)`, color: "#fff", fontSize:11, fontWeight: 700, cursor: scheduleSaving ? "not-allowed" : "pointer", opacity: scheduleSaving ? .7 : 1 }}>
            {scheduleSaving ? <><Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} />Saving...</> : <>Save Schedule</>}
          </button>
        </div>
      </div>

      {scheduleMsg && (
        <div style={{ margin: "14px 18px 0", padding: "10px 14px", borderRadius: 9, background: scheduleMsg.type === "success" ? "#f0fdf4" : "#fff5f5", color: scheduleMsg.type === "success" ? "#16a34a" : "#dc2626", fontSize:12, fontWeight: 600, border: `1px solid ${scheduleMsg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {scheduleMsg.text}
        </div>
      )}

      {scheduleLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: "#94a3b8" }}>
          <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} />Loading schedule...
        </div>
      ) : (
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize:10, color: "#94a3b8", fontWeight: 600 }}>Quick set:</span>
            {[
              { label: "Mon–Fri", days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] },
              { label: "Mon–Sat", days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] },
              { label: "All Week", days: ALL_SCHED_DAYS },
            ].map(tmpl => (
              <button key={tmpl.label} onClick={() => applyTemplate(tmpl.days)}
                style={{ padding: "4px 11px", borderRadius: 7, border: `1px solid ${accent}44`, background: `${accent}11`, color: accent, fontSize:10, fontWeight: 600, cursor: "pointer" }}>
                {tmpl.label}
              </button>
            ))}
            <button onClick={() => applyTemplate([])}
              style={{ padding: "4px 11px", borderRadius: 7, border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", fontSize:10, fontWeight: 600, cursor: "pointer" }}>
              Clear All
            </button>
          </div>

          {ALL_SCHED_DAYS.map(day => {
            const s = localSchedule[day] || { startTime: "09:00", endTime: "17:00", slotDuration: 30, isActive: false };
            const slots = slotsFor(s.startTime, s.endTime, s.slotDuration);
            return (
              <div key={day} style={{ display: "grid", gridTemplateColumns: "80px 1fr", background: s.isActive ? `${accent}08` : "#f8fafc", borderRadius: 12, border: `1.5px solid ${s.isActive ? accent + "33" : "#e2e8f0"}`, overflow: "hidden", transition: "all .2s" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 10px", borderRight: `1px solid ${s.isActive ? accent + "22" : "#e2e8f0"}`, background: s.isActive ? `${accent}15` : "#f1f5f9", cursor: "pointer", userSelect: "none" }}
                  onClick={() => setDay(day, "isActive", !s.isActive)}>
                  <div style={{ width: 36, height: 20, borderRadius: 100, background: s.isActive ? accent : "#cbd5e1", position: "relative", transition: "background .2s", marginBottom: 6 }}>
                    <div style={{ position: "absolute", top: 2, left: s.isActive ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left .2s" }} />
                  </div>
                  <span style={{ fontSize:10, fontWeight: 700, color: s.isActive ? accent : "#94a3b8" }}>{SCHED_DAY_LABELS[day]}</span>
                </div>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, opacity: s.isActive ? 1 : .45, transition: "opacity .2s", flexWrap: "wrap" }}>
                  {[
                    { label: "Start", field: "startTime", value: s.startTime, type: "time" },
                    { label: "End", field: "endTime", value: s.endTime, type: "time" },
                  ].map(inp => (
                    <div key={inp.field} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize:10, color: "#64748b", fontWeight: 600 }}>{inp.label}</span>
                      <input type={inp.type} value={inp.value} disabled={!s.isActive}
                        onChange={e => setDay(day, inp.field, e.target.value)}
                        style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #d1fae5", fontSize:11, color: "#334155", background: "#fff", outline: "none", fontFamily: "inherit" }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize:10, color: "#64748b", fontWeight: 600 }}>Slot</span>
                    <select value={s.slotDuration} disabled={!s.isActive} onChange={e => setDay(day, "slotDuration", Number(e.target.value))}
                      style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #d1fae5", fontSize:11, color: "#334155", background: "#fff", outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
                      {SCHED_DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                  {s.isActive && (slots > 0
                    ? <span style={{ fontSize:10, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: `${accent}15`, color: accent }}>{slots} slots/day</span>
                    : <span style={{ fontSize:10, color: "#ef4444", fontWeight: 600 }}>⚠ Invalid range</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Tab = "schedule" | "appointments" | "patients" | "rx" | "prescription-settings" | "treatment-plans" | "attendance" | "schedule-mgmt" | "reports";

const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function DoctorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { doctor, accent, doctorName } = useDoctorDashboard();

  const [tab, setTab] = useState<Tab>("schedule");

  useEffect(() => {
    const urlTab = (searchParams.get("tab") as Tab) || "schedule";
    setTab(urlTab);
  }, [searchParams]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [consultAppt, setConsultAppt] = useState<any>(null);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<any>(null);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [activePlansCount, setActivePlansCount] = useState<number | null>(null);
  const [myPlans, setMyPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansFilter, setPlansFilter] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, any>>({});
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const SCHED_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  const initLocalSchedule = () => {
    const init: Record<string, { startTime: string; endTime: string; slotDuration: number; isActive: boolean }> = {};
    SCHED_DAYS.forEach(d => { init[d] = { startTime: "09:00", endTime: "17:00", slotDuration: 30, isActive: false }; });
    return init;
  };
  const [localSchedule, setLocalSchedule] = useState<Record<string, { startTime: string; endTime: string; slotDuration: number; isActive: boolean }>>(initLocalSchedule);

  const [showAddPlan, setShowAddPlan] = useState(false);
  const [addPlanForm, setAddPlanForm] = useState({ planName: "", totalSessions: 1, totalCost: 0, startDate: "", endDate: "", notes: "" });
  const [addPlanSaving, setAddPlanSaving] = useState(false);
  const [addPlanErr, setAddPlanErr] = useState("");
  const [editPlan, setEditPlan] = useState<any>(null);
  const [editPlanForm, setEditPlanForm] = useState({ planName: "", status: "ACTIVE", totalSessions: 1, completedSessions: 0, totalCost: 0, paidAmount: 0, startDate: "", endDate: "", notes: "" });
  const [editPlanSaving, setEditPlanSaving] = useState(false);
  const [editPlanErr, setEditPlanErr] = useState("");
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // Reports
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Search / Sort / Export state for all tables
  const [apptSearch, setApptSearch] = useState("");
  const [apptSortField, setApptSortField] = useState("tokenNumber");
  const [apptSortDir, setApptSortDir] = useState<"asc" | "desc">("asc");
  const [apptExportOpen, setApptExportOpen] = useState(false);
  const [showAllApptStatuses, setShowAllApptStatuses] = useState(false);
  const [apptTypeFilter, setApptTypeFilter] = useState("");
  const [apptStatusFilter, setApptStatusFilter] = useState("");

  const [patientSearch, setPatientSearch] = useState("");
  const [patientSortField, setPatientSortField] = useState("name");
  const [patientSortDir, setPatientSortDir] = useState<"asc" | "desc">("asc");
  const [patientExportOpen, setPatientExportOpen] = useState(false);

  const [planSearch, setPlanSearch] = useState("");
  const [planSortField, setPlanSortField] = useState("planName");
  const [planSortDir, setPlanSortDir] = useState<"asc" | "desc">("asc");
  const [planExportOpen, setPlanExportOpen] = useState(false);

  const [attendSearch, setAttendSearch] = useState("");
  const [attendSortField, setAttendSortField] = useState("date");
  const [attendSortDir, setAttendSortDir] = useState<"asc" | "desc">("desc");
  const [attendExportOpen, setAttendExportOpen] = useState(false);
  const attendancePostedRef = useRef(false);

  const [recentSearch, setRecentSearch] = useState("");
  const [recentSortField, setRecentSortField] = useState("date");
  const [recentSortDir, setRecentSortDir] = useState<"asc" | "desc">("desc");
  const [recentExportOpen, setRecentExportOpen] = useState(false);

  // All Appointments state
  const [allAppts, setAllAppts] = useState<any[]>([]);
  const [allApptsLoading, setAllApptsLoading] = useState(false);
  const [allApptSearch, setAllApptSearch] = useState("");
  const [allApptSortField, setAllApptSortField] = useState("appointmentDate");
  const [allApptSortDir, setAllApptSortDir] = useState<"asc" | "desc">("desc");
  const [allApptExportOpen, setAllApptExportOpen] = useState(false);
  const [allApptDateFilter, setAllApptDateFilter] = useState<"all" | "today" | "tomorrow" | "custom">("all");
  const [allApptCustomDate, setAllApptCustomDate] = useState(fmtDate(new Date()));

  // ── Slot Alert (auto-popup when appointment time arrives) ──
  const [slotAlertAppt, setSlotAlertAppt] = useState<any>(null);
  const [slotAlertRescheduleAppt, setSlotAlertRescheduleAppt] = useState<any>(null);
  const [dismissedSlotIds, setDismissedSlotIds] = useState<Set<string>>(new Set());

  const isToday = isSameDay(selectedDate, new Date());
  const goDate = (offset: number) => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + offset); return d; });

  const fetchAppointments = useCallback(async (doctorId: string, departmentId?: string, date?: string) => {
    setLoadingAppts(true);
    let url = `/api/appointments?doctorId=${doctorId}&date=${date || fmtDate(new Date())}&limit=50&sortBy=timeSlot&sortOrder=asc`;
    if (departmentId) url += `&departmentId=${departmentId}`;
    const d = await api(url);
    if (d.success) setAppointments(d.data?.data || []);
    setLoadingAppts(false);
  }, []);

  const fetchAllAppointments = useCallback(async (doctorId: string, departmentId?: string) => {
    setAllApptsLoading(true);
    const base = `/api/appointments?doctorId=${doctorId}&limit=1000&sortBy=appointmentDate&sortOrder=desc${departmentId ? `&departmentId=${departmentId}` : ""}`;
    let page = 1;
    let collected: any[] = [];
    let hasMore = true;
    while (hasMore) {
      const d = await api(`${base}&page=${page}`);
      if (!d.success) break;
      const batch: any[] = d.data?.data || [];
      collected = [...collected, ...batch];
      const total: number = d.data?.total ?? d.data?.pagination?.total ?? batch.length;
      hasMore = collected.length < total && batch.length === 1000;
      page++;
    }
    setAllAppts(collected);
    setAllApptsLoading(false);
  }, []);

  const fetchAllPatients = useCallback(async (doctorId: string, departmentId?: string) => {
    let url = `/api/appointments?doctorId=${doctorId}&limit=200&sortBy=appointmentDate&sortOrder=desc`;
    if (departmentId) url += `&departmentId=${departmentId}`;
    const d = await api(url);
    if (d.success) {
      const seen = new Set<string>();
      const unique: any[] = [];
      for (const a of (d.data?.data || [])) {
        if (a.patient && !seen.has(a.patient.id)) {
          seen.add(a.patient.id);
          unique.push({ ...a.patient, lastVisit: a.appointmentDate, lastType: a.type });
        }
      }
      setAllPatients(unique);
    }
  }, []);

  const getLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      return {
        location: `${data.city}, ${data.region}, ${data.country_name}`,
        ip: data.ip
      };
    } catch {
      return { location: "Unknown Location", ip: "Unknown IP" };
    }
  };

  useEffect(() => {
    if (doctor) {
      if (!attendancePostedRef.current) {
        attendancePostedRef.current = true;
        getLocation().then(info => {
          fetch("/api/doctor/attendance", { 
            method: "POST", 
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(info)
          }).catch(() => { });
        });
      }
      if (tab === "schedule") {
        fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate));
      }
      if (tab === "schedule" || tab === "patients") {
        fetchAllPatients(doctor.id, doctor.department?.id);
      }
      if (tab === "appointments") {
        fetchAllAppointments(doctor.id, doctor.department?.id);
      }
      if (tab === "schedule" || tab === "treatment-plans") {
        api(`/api/treatment-plans?doctorId=${doctor.id}&status=ACTIVE&limit=1`).then(r => {
          if (r.success) setActivePlansCount(r.data?.total ?? r.data?.plans?.length ?? 0);
        }).catch(() => { });
      }
    }
  }, [doctor, tab, fetchAppointments, fetchAllPatients]);

  const fetchMyPlans = useCallback(async (doctorId: string, filter = "") => {
    setPlansLoading(true);
    const url = `/api/treatment-plans?doctorId=${doctorId}&limit=50${filter ? `&status=${filter}` : ""}`;
    const d = await api(url);
    if (d.success) setMyPlans(d.data?.plans || []);
    setPlansLoading(false);
  }, []);

  useEffect(() => {
    if (doctor && tab === "treatment-plans") {
      fetchMyPlans(doctor.id, plansFilter);
    }
  }, [tab, doctor, plansFilter, fetchMyPlans]);

  const fetchAttendance = useCallback(async (month: string) => {
    setAttendanceLoading(true);
    const d = await api(`/api/doctor/attendance?month=${month}`);
    if (d.success) setAttendance(d.data || []);
    setAttendanceLoading(false);
  }, []);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const info = await getLocation();
      const res = await fetch("/api/doctor/attendance", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info)
      }).then(r => r.json());
      if (res.success) {
        fetchAttendance(attendanceMonth);
      } else {
        alert(res.message || "Failed to check out");
      }
    } catch (e) {
      alert("Error recording check-out");
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    if (doctor && tab === "attendance") {
      fetchAttendance(attendanceMonth);
    }
  }, [tab, doctor, attendanceMonth, fetchAttendance]);

  const fetchWeeklySchedule = useCallback(async () => {
    setScheduleLoading(true);
    const d = await api("/api/doctor/availability");
    if (d.success) {
      setWeeklySchedule(d.data || {});
      const sdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      setLocalSchedule(prev => {
        const next = { ...prev };
        sdays.forEach(day => {
          const ex = (d.data || {})[day];
          next[day] = ex
            ? { startTime: ex.startTime || "09:00", endTime: ex.endTime || "17:00", slotDuration: ex.slotDuration || 30, isActive: ex.isActive !== false }
            : { startTime: "09:00", endTime: "17:00", slotDuration: 30, isActive: false };
        });
        return next;
      });
    }
    setScheduleLoading(false);
  }, []);

  useEffect(() => {
    if (doctor && tab === "schedule-mgmt") {
      fetchWeeklySchedule();
    }
  }, [tab, doctor, fetchWeeklySchedule]);

  // ── Load reports ──
  const loadReports = useCallback(async () => {
    setReportLoading(true);
    const res = await api("/api/doctor/reports");
    if (res.success) setReportData(res.data);
    setReportLoading(false);
  }, []);

  useEffect(() => {
    if (doctor && tab === "reports") loadReports();
  }, [tab, doctor, loadReports]);

  useEffect(() => {
    if (doctor && tab === "schedule") {
      fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate));
    }
  }, [selectedDate, doctor, tab, fetchAppointments]);

  // ── Prefetch prescription routes for active appointments ──
  useEffect(() => {
    if (tab === "schedule" && appointments.length > 0) {
      const active = appointments
        .filter(a => ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status))
        .slice(0, 5);
      active.forEach(a => {
        router.prefetch(`/doctor/dashboard/prescription/${a.id}`);
      });
    }
  }, [tab, appointments, router]);

  // ── Slot Alert Timer ──
  // Every 30s, check if any SCHEDULED/CONFIRMED appointment's slot time has arrived (within ±2 min)
  useEffect(() => {
    if (!doctor || tab !== "schedule" || !isToday) return;
    if (slotAlertAppt || slotAlertRescheduleAppt) return; // don't interrupt existing modal

    const check = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const upcoming = appointments.find((a: any) => {
        if (!a.timeSlot || dismissedSlotIds.has(a.id)) return false;
        if (!["SCHEDULED", "CONFIRMED"].includes(a.status)) return false;
        const [h, m] = a.timeSlot.split(":").map(Number);
        if (h == null || m == null) return false;
        const slotMins = h * 60 + m;
        // Trigger if current time is within 2 minutes after slot time OR within 1 minute before
        return nowMins >= slotMins - 1 && nowMins <= slotMins + 2;
      });
      if (upcoming && !slotAlertAppt && !slotAlertRescheduleAppt) {
        setSlotAlertAppt(upcoming);
      }
    };

    check(); // immediate check on mount/change
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [doctor, tab, isToday, appointments, dismissedSlotIds, slotAlertAppt, slotAlertRescheduleAppt]);

  // ── Generic sort handler ──
  const mkSort = (setField: (f: string) => void, setDir: (d: "asc" | "desc") => void, curField: string, curDir: "asc" | "desc") =>
    (field: string) => { if (curField === field) setDir(curDir === "asc" ? "desc" : "asc"); else { setField(field); setDir("desc"); } };
  const handleApptSort = mkSort(setApptSortField, setApptSortDir, apptSortField, apptSortDir);
  const handleAllApptSort = mkSort(setAllApptSortField, setAllApptSortDir, allApptSortField, allApptSortDir);
  const handlePatientSort = mkSort(setPatientSortField, setPatientSortDir, patientSortField, patientSortDir);
  const handlePlanSort = mkSort(setPlanSortField, setPlanSortDir, planSortField, planSortDir);
  const handleAttendSort = mkSort(setAttendSortField, setAttendSortDir, attendSortField, attendSortDir);
  const handleRecentSort = mkSort(setRecentSortField, setRecentSortDir, recentSortField, recentSortDir);

  // ── Sort icon ──
  const sortIcon = (field: string, curField: string, curDir: "asc" | "desc") =>
    curField === field ? (curDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} style={{ opacity: .35 }} />;

  // ── Filtered + sorted appointments ──
  const filteredAppts = appointments.filter((a: any) => {
    if (!showAllApptStatuses && !["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status)) return false;
    if (apptTypeFilter && a.type !== apptTypeFilter) return false;
    if (apptStatusFilter && a.status !== apptStatusFilter) return false;
    if (!apptSearch) return true;
    const q = apptSearch.toLowerCase();
    return (a.patient?.name || "").toLowerCase().includes(q) || (a.patient?.patientId || "").toLowerCase().includes(q) || (a.timeSlot || "").includes(q) || (a.type || "").toLowerCase().includes(q) || (STATUS_CFG[a.status]?.label || "").toLowerCase().includes(q);
  });
  const sortedAppts = [...filteredAppts].sort((a: any, b: any) => {
    const d = apptSortDir === "asc" ? 1 : -1;
    if (apptSortField === "tokenNumber") return d * ((a.tokenNumber || 0) - (b.tokenNumber || 0));
    if (apptSortField === "timeSlot") return d * ((a.timeSlot || "").localeCompare(b.timeSlot || ""));
    if (apptSortField === "patient") return d * ((a.patient?.name || "").localeCompare(b.patient?.name || ""));
    if (apptSortField === "type") return d * ((a.type || "").localeCompare(b.type || ""));
    if (apptSortField === "status") return d * ((a.status || "").localeCompare(b.status || ""));
    return 0;
  });

  const filteredAllAppts = allAppts.filter((a: any) => {
    // Date Filtering
    if (allApptDateFilter !== "all") {
      const apptDateStr = fmtDate(new Date(a.appointmentDate));
      if (allApptDateFilter === "today") {
        if (apptDateStr !== fmtDate(new Date())) return false;
      } else if (allApptDateFilter === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (apptDateStr !== fmtDate(tomorrow)) return false;
      } else if (allApptDateFilter === "custom") {
        if (apptDateStr !== allApptCustomDate) return false;
      }
    }

    if (!allApptSearch) return true;
    const q = allApptSearch.toLowerCase();
    return (a.patient?.name || "").toLowerCase().includes(q) || (a.patient?.patientId || "").toLowerCase().includes(q) || (a.type || "").toLowerCase().includes(q) || (STATUS_CFG[a.status]?.label || "").toLowerCase().includes(q);
  });
  const sortedAllAppts = [...filteredAllAppts].sort((a: any, b: any) => {
    const d = allApptSortDir === "asc" ? 1 : -1;
    if (allApptSortField === "appointmentDate") return d * (new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    if (allApptSortField === "timeSlot") return d * ((a.timeSlot || "").localeCompare(b.timeSlot || ""));
    if (allApptSortField === "patient") return d * ((a.patient?.name || "").localeCompare(b.patient?.name || ""));
    if (allApptSortField === "type") return d * ((a.type || "").localeCompare(b.type || ""));
    if (allApptSortField === "status") return d * ((a.status || "").localeCompare(b.status || ""));
    return 0;
  });

  // ── Filtered + sorted patients ──
  const filteredPatients = allPatients.filter((p: any) => {
    if (!patientSearch) return true;
    const q = patientSearch.toLowerCase();
    return (p.name || "").toLowerCase().includes(q) || (p.patientId || "").toLowerCase().includes(q) || (p.phone || "").includes(q) || (p.gender || "").toLowerCase().includes(q);
  });
  const sortedPatients = [...filteredPatients].sort((a: any, b: any) => {
    const d = patientSortDir === "asc" ? 1 : -1;
    if (patientSortField === "patientId") return d * ((a.patientId || "").localeCompare(b.patientId || ""));
    if (patientSortField === "name") return d * ((a.name || "").localeCompare(b.name || ""));
    if (patientSortField === "phone") return d * ((a.phone || "").localeCompare(b.phone || ""));
    if (patientSortField === "gender") return d * ((a.gender || "").localeCompare(b.gender || ""));
    if (patientSortField === "lastVisit") return d * (new Date(a.lastVisit || 0).getTime() - new Date(b.lastVisit || 0).getTime());
    if (patientSortField === "lastType") return d * ((a.lastType || "").localeCompare(b.lastType || ""));
    return 0;
  });

  // ── Filtered + sorted plans ──
  const filteredPlans = myPlans.filter((p: any) => {
    if (!planSearch) return true;
    const q = planSearch.toLowerCase();
    return (p.planName || "").toLowerCase().includes(q) || (p.patient?.name || "").toLowerCase().includes(q) || (p.service?.name || "").toLowerCase().includes(q) || (p.status || "").toLowerCase().includes(q);
  });
  const sortedPlans = [...filteredPlans].sort((a: any, b: any) => {
    const d = planSortDir === "asc" ? 1 : -1;
    if (planSortField === "planName") return d * ((a.planName || "").localeCompare(b.planName || ""));
    if (planSortField === "patient") return d * ((a.patient?.name || "").localeCompare(b.patient?.name || ""));
    if (planSortField === "status") return d * ((a.status || "").localeCompare(b.status || ""));
    if (planSortField === "sessions") return d * ((a.completedSessions || 0) - (b.completedSessions || 0));
    if (planSortField === "cost") return d * ((a.totalCost || 0) - (b.totalCost || 0));
    return 0;
  });

  // ── Filtered + sorted attendance ──
  const filteredAttendance = attendance.filter((r: any) => {
    if (!attendSearch) return true;
    const q = attendSearch.toLowerCase();
    const d = new Date(r.date);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }).toLowerCase().includes(q)
      || d.toLocaleDateString("en-IN", { weekday: "short" }).toLowerCase().includes(q)
      || (r.status || "").toLowerCase().includes(q) || (r.notes || "").toLowerCase().includes(q);
  });
  const sortedAttendance = [...filteredAttendance].sort((a: any, b: any) => {
    const d = attendSortDir === "asc" ? 1 : -1;
    if (attendSortField === "date") return d * (new Date(a.date).getTime() - new Date(b.date).getTime());
    if (attendSortField === "status") return d * ((a.status || "").localeCompare(b.status || ""));
    if (attendSortField === "loginTime") return d * (new Date(a.loginTime || 0).getTime() - new Date(b.loginTime || 0).getTime());
    return 0;
  });

  // ── Generic export helpers ──
  const doExportExcel = async (headers: string[], rows: any[][], filename: string) => {
    const XLSX = (await import("xlsx")).default || await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, filename);
  };
  const doExportPDF = async (title: string, headers: string[], rows: any[][], count: number, filename: string) => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16); doc.text(title, 14, 18);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} record(s)`, 14, 26);
    autoTable(doc, { head: [headers], body: rows, startY: 32, styles: { fontSize:9, cellPadding: 3 }, headStyles: { fillColor: [14, 137, 143], textColor: 255, fontStyle: "bold" }, alternateRowStyles: { fillColor: [248, 250, 252] } });
    doc.save(filename);
  };
  const doExportWord = async (title: string, headers: string[], rows: any[][], count: number, filename: string) => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, BorderStyle } = await import("docx");
    const { saveAs } = await import("file-saver");
    const tb = { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" }, right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } };
    const hRow = new TableRow({ children: headers.map(h => new TableCell({ borders: tb, shading: { fill: "0E898F" }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18, font: "Calibri" })], alignment: AlignmentType.CENTER })], width: { size: 100 / headers.length, type: WidthType.PERCENTAGE } })) });
    const dRows = rows.map((row: any[]) => new TableRow({ children: row.map((c: any) => new TableCell({ borders: tb, children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 18, font: "Calibri" })], alignment: AlignmentType.LEFT })] })) }));
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32, font: "Calibri" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: `Exported: ${new Date().toLocaleString("en-IN")}  |  ${count} record(s)`, size: 20, color: "64748B", font: "Calibri" })], spacing: { after: 300 } }),
          new Table({ rows: [hRow, ...dRows], width: { size: 100, type: WidthType.PERCENTAGE } }),
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
  };

  // Table-specific export functions
  const exportAppts = (fmt: "pdf" | "excel" | "word") => {
    const h = ["Token", "Time", "Patient", "Patient ID", "Type", "Status", "Fee"];
    const r = sortedAppts.map((a: any) => [a.tokenNumber || "—", a.timeSlot || "", a.patient?.name || "", a.patient?.patientId || "", TYPE_LABEL[a.type] || a.type, STATUS_CFG[a.status]?.label || a.status, a.consultationFee || 0]);
    const t = `Dr. ${doctorName} — Appointments (${selectedDate.toLocaleDateString("en-IN")})`;
    const fn = `appointments-${fmtDate(selectedDate)}`;
    if (fmt === "pdf") doExportPDF(t, h, r, r.length, fn + ".pdf");
    else if (fmt === "excel") doExportExcel(h, r, fn + ".xlsx");
    else doExportWord(t, h, r, r.length, fn + ".docx");
    setApptExportOpen(false);
  };

  const exportAllAppts = (fmt: "pdf" | "excel" | "word") => {
    const h = ["Date", "Time", "Patient", "Patient ID", "Type", "Status", "Fee"];
    const r = sortedAllAppts.map((a: any) => [new Date(a.appointmentDate).toLocaleDateString("en-IN"), a.timeSlot || "", a.patient?.name || "", a.patient?.patientId || "", TYPE_LABEL[a.type] || a.type, STATUS_CFG[a.status]?.label || a.status, a.consultationFee || 0]);
    const t = `Dr. ${doctorName} — Complete Appointment List`;
    const fn = `all-appointments-${new Date().toISOString().slice(0, 10)}`;
    if (fmt === "pdf") doExportPDF(t, h, r, r.length, fn + ".pdf");
    else if (fmt === "excel") doExportExcel(h, r, fn + ".xlsx");
    else doExportWord(t, h, r, r.length, fn + ".docx");
    setAllApptExportOpen(false);
  };
  const exportPatients = (fmt: "pdf" | "excel" | "word") => {
    const h = ["Patient ID", "Name", "Phone", "Gender", "Last Visit", "Last Type"];
    const r = sortedPatients.map((p: any) => [p.patientId || "", p.name || "", p.phone || "", p.gender || "", p.lastVisit ? new Date(p.lastVisit).toLocaleDateString("en-IN") : "", TYPE_LABEL[p.lastType] || p.lastType || ""]);
    const t = `Dr. ${doctorName} — My Patients`;
    const fn = `patients-${new Date().toISOString().slice(0, 10)}`;
    if (fmt === "pdf") doExportPDF(t, h, r, r.length, fn + ".pdf");
    else if (fmt === "excel") doExportExcel(h, r, fn + ".xlsx");
    else doExportWord(t, h, r, r.length, fn + ".docx");
    setPatientExportOpen(false);
  };
  const exportPlans = (fmt: "pdf" | "excel" | "word") => {
    const h = ["Plan Name", "Patient", "Status", "Sessions", "Cost (₹)", "Paid (₹)"];
    const r = sortedPlans.map((p: any) => [p.planName || "", p.patient?.name || "", p.status || "", `${p.completedSessions || 0}/${p.totalSessions || 0}`, p.totalCost || 0, p.paidAmount || 0]);
    const t = `Dr. ${doctorName} — Treatment Plans`;
    const fn = `treatment-plans-${new Date().toISOString().slice(0, 10)}`;
    if (fmt === "pdf") doExportPDF(t, h, r, r.length, fn + ".pdf");
    else if (fmt === "excel") doExportExcel(h, r, fn + ".xlsx");
    else doExportWord(t, h, r, r.length, fn + ".docx");
    setPlanExportOpen(false);
  };
  const exportAttendance = (fmt: "pdf" | "excel" | "word") => {
    const h = ["Date", "Day", "Status", "Login Time", "Notes"];
    const r = sortedAttendance.map((rec: any) => { const d = new Date(rec.date); return [d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), d.toLocaleDateString("en-IN", { weekday: "short" }), rec.status || "", rec.loginTime ? new Date(rec.loginTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—", rec.notes || ""]; });
    const t = `Dr. ${doctorName} — Attendance (${attendanceMonth})`;
    const fn = `attendance-${attendanceMonth}`;
    if (fmt === "pdf") doExportPDF(t, h, r, r.length, fn + ".pdf");
    else if (fmt === "excel") doExportExcel(h, r, fn + ".xlsx");
    else doExportWord(t, h, r, r.length, fn + ".docx");
    setAttendExportOpen(false);
  };
  const exportRecent = (fmt: "pdf" | "excel" | "word") => {
    const src = (reportData?.recentCompleted || []).filter((r: any) => { if (!recentSearch) return true; const q = recentSearch.toLowerCase(); return (r.patientName || "").toLowerCase().includes(q) || (r.patientId || "").toLowerCase().includes(q) || (r.type || "").toLowerCase().includes(q); });
    const h = ["Patient", "Patient ID", "Type", "Date", "Time", "Fee (₹)"];
    const r = src.map((x: any) => [x.patientName || "", x.patientId || "", TYPE_LABEL[x.type] || x.type || "", x.date ? new Date(x.date).toLocaleDateString("en-IN") : "", x.timeSlot || "", x.fee || 0]);
    const t = `Dr. ${doctorName} — Recent Consultations`;
    const fn = `recent-consultations-${new Date().toISOString().slice(0, 10)}`;
    if (fmt === "pdf") doExportPDF(t, h, r, r.length, fn + ".pdf");
    else if (fmt === "excel") doExportExcel(h, r, fn + ".xlsx");
    else doExportWord(t, h, r, r.length, fn + ".docx");
    setRecentExportOpen(false);
  };

  // ── Reusable export dropdown component ──
  const ExportDropdown = ({ open, onClose, onExport }: { open: boolean; onClose: () => void; onExport: (fmt: "pdf" | "excel" | "word") => void }) => {
    if (!open) return null;
    return (<>
      <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={onClose} />
      <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, zIndex: 70, minWidth: 180, padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,.1)" }}>
        <button onClick={() => onExport("pdf")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize:12, color: "#334155", fontWeight: 500 }}
          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff5f5", color: "#ef4444" }}><FileText size={13} /></span>Export as PDF
        </button>
        <button onClick={() => onExport("excel")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize:12, color: "#334155", fontWeight: 500 }}
          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", color: "#16a34a" }}><FileSpreadsheet size={13} /></span>Export as Excel
        </button>
        <button onClick={() => onExport("word")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "none", background: "none", width: "100%", cursor: "pointer", fontSize:12, color: "#334155", fontWeight: 500 }}
          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <span style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "#eff6ff", color: "#2563eb" }}><FileType size={13} /></span>Export as Word
        </button>
      </div>
    </>);
  };

  const handleStartPrescription = (appointmentId: string) => {
    router.push(`/doctor/dashboard/prescription/${appointmentId}`);
  };

  const handleViewPrescription = (appointmentId: string) => {
    router.push(`/doctor/dashboard/prescription/${appointmentId}?mode=view`);
  };

  const handleEditPrescription = (appointmentId: string) => {
    router.push(`/doctor/dashboard/prescription/${appointmentId}?edit=1`);
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string, extra?: { appointmentDate?: string; timeSlot?: string }) => {
    if (!doctor) return;
    setUpdatingStatusId(appointmentId);
    const body: any = { status, ...extra };
    const r = await api(`/api/appointments/${appointmentId}`, "PUT", body);
    if (r?.success) {
      await fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate));
      await fetchAllPatients(doctor.id, doctor.department?.id);
      if (tab === "appointments") await fetchAllAppointments(doctor.id, doctor.department?.id);
    }
    setUpdatingStatusId(null);
  };

  const handleStatusChange = (appt: any, newStatus: string) => {
    if (newStatus === "RESCHEDULED") {
      setRescheduleAppt(appt);
    } else {
      updateAppointmentStatus(appt.id, newStatus);
    }
  };

  const handleRescheduleConfirm = async (newDate: string, newTime: string) => {
    if (!rescheduleAppt) return;
    setRescheduleSaving(true);
    await updateAppointmentStatus(rescheduleAppt.id, "RESCHEDULED", {
      appointmentDate: newDate,
      timeSlot: newTime,
    });
    setRescheduleSaving(false);
    setRescheduleAppt(null);
  };

  const handleSlotAlertRescheduleConfirm = async (newDate: string, newTime: string) => {
    if (!slotAlertRescheduleAppt) return;
    setRescheduleSaving(true);
    await updateAppointmentStatus(slotAlertRescheduleAppt.id, "RESCHEDULED", {
      appointmentDate: newDate,
      timeSlot: newTime,
    });
    // Fire-and-forget email notification
    api("/api/appointments/reschedule-email", "POST", { appointmentId: slotAlertRescheduleAppt.id }).catch(() => { });
    setRescheduleSaving(false);
    setSlotAlertRescheduleAppt(null);
    setDismissedSlotIds(prev => new Set(prev).add(slotAlertRescheduleAppt.id));
  };

  const todayTotal = appointments.length;
  const todayDone = appointments.filter(a => a.status === "COMPLETED").length;
  const todayRemaining = appointments.filter(a => ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status)).length;
  const inProgress = appointments.find(a => a.status === "IN_PROGRESS");

  return (
    <>
      {rescheduleAppt && (
        <RescheduleModal
          appt={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onConfirm={handleRescheduleConfirm}
        />
      )}
      {slotAlertRescheduleAppt && (
        <RescheduleModal
          appt={slotAlertRescheduleAppt}
          onClose={() => { setSlotAlertRescheduleAppt(null); setDismissedSlotIds(prev => new Set(prev).add(slotAlertRescheduleAppt.id)); }}
          onConfirm={handleSlotAlertRescheduleConfirm}
        />
      )}
      {slotAlertAppt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,.18)", fontFamily: "'Inter',sans-serif", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>⏰ Appointment Time</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{slotAlertAppt.patient?.name} &nbsp;·&nbsp; Token #{slotAlertAppt.tokenNumber}</div>
              </div>
              <button onClick={() => { setDismissedSlotIds(prev => new Set(prev).add(slotAlertAppt.id)); setSlotAlertAppt(null); }}
                style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ background: "#E6F4F4", borderRadius: 12, padding: "12px 14px", marginBottom: 20, border: "1px solid #B3E0E0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Slot Details</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#07595D" }}>
                {new Date(slotAlertAppt.appointmentDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} &nbsp;at&nbsp; {slotAlertAppt.timeSlot}
              </div>
              <div style={{ fontSize: 10, color: "#0E898F", marginTop: 4 }}>
                Patient: {slotAlertAppt.patient?.name} · {slotAlertAppt.patient?.patientId} · {slotAlertAppt.patient?.phone}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setDismissedSlotIds(prev => new Set(prev).add(slotAlertAppt.id)); setSlotAlertAppt(null); }}
                style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "2px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Dismiss
              </button>
              <button onClick={() => { setSlotAlertRescheduleAppt(slotAlertAppt); setSlotAlertAppt(null); }}
                style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "2px solid #f59e0b", background: "#fff", color: "#f59e0b", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <RefreshCw size={13} /> Reschedule
              </button>
              <button onClick={() => { setDismissedSlotIds(prev => new Set(prev).add(slotAlertAppt.id)); setSlotAlertAppt(null); router.push(`/doctor/dashboard/prescription/${slotAlertAppt.id}`); }}
                style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(14,137,143,.35)" }}>
                <PlayCircle size={13} /> Consult
              </button>
            </div>
          </div>
        </div>
      )}
      {consultAppt && (
        <ConsultModal
          appt={consultAppt}
          onClose={() => setConsultAppt(null)}
          onDone={() => doctor && fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate))}
          onStartPrescription={handleStartPrescription}
          setSelectedPatientId={setSelectedPatientId}
        />
      )}
      <style>{`
        .doc-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:22px}
        .doc-sc{background:#fff;border-radius:14px;padding:18px;border:1px solid #f1f5f9;display:flex;align-items:center;gap:14px;box-shadow:none;transition:transform .2s,box-shadow .2s}
        .doc-sc:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.04)}
        .doc-sc-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}
        .doc-sc-lbl{font-size:10px;font-weight:700;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em}
        .doc-sc-val{font-size:20px;font-weight:800;letter-spacing:-.02em;line-height:1}
        .doc-sc-sub{font-size:10px;color:#94a3b8;margin-top:3px;display:none}
        .doc-card{background:#fff;border-radius:14px;border:1px solid #d1fae5;box-shadow:0 1px 4px rgba(16,185,129,0.05);overflow:hidden;margin-bottom:16px}
        .doc-card-head{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ecfdf5}
        .doc-card-title{font-size:13px;font-weight:700;color:#1e293b}
        .doc-card-sub{font-size:10px;color:#94a3b8;margin-top:2px}
        .doc-tbl{width:100%;border-collapse:collapse}
        .doc-tbl th{text-align:left;font-size:10px;font-weight:600;color:#94a3b8;padding:10px 12px;border-bottom:2px solid #ecfdf5}
        .doc-tbl td{padding:11px 12px;font-size:12px;color:#475569;border-bottom:1px solid #f0fdf4}
        .doc-tbl tr:last-child td{border-bottom:none}
        .doc-tbl tbody tr:hover td{background:#f0fdf9}
        .doc-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .doc-right{background:#fff;border-left:1px solid #d1fae5;padding:22px 18px;overflow-y:auto;position:fixed;right:0;top:64px;bottom:0;width:260px}
        .doc-right-title{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:12px}
        .doc-critical-card{padding:12px;border-radius:10px;margin-bottom:10px;cursor:pointer;transition:box-shadow .2s}
        .doc-critical-card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.08)}
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: tab === "schedule" ? "1fr 260px" : "1fr", gap: 0 }}>
        <div>
          {selectedPatientId ? (
            <PatientProfilePanel
              patientId={selectedPatientId}
              onBack={() => setSelectedPatientId(null)}
            />
          ) : (
            <>
              {tab === "schedule" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div className="doc-pg-title" style={{ marginBottom: 0 }}>Good morning, Dr. {doctorName.split(" ").slice(-1)[0]} 👋</div>
                  <span style={{ fontSize:11, color: "#64748b", background: "#f0fdf4", border: "1px solid #d1fae5", padding: "5px 12px", borderRadius: 8, fontWeight: 500 }}>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</span>
                </div>
              )}

              {tab === "schedule" && (
                <div className="doc-stats">
                  {[
                    { icon: <CalendarDays size={20} color="#10b981" />, label: isToday ? "TODAY'S APPOINTMENTS" : "APPOINTMENTS", val: todayTotal, sub: `${todayRemaining} remaining`, bg: "#fff", iconBg: "#f0fdf4" },
                    { icon: <CheckCircle2 size={20} color="#0E898F" />, label: "COMPLETED", val: todayDone, sub: isToday ? "today so far" : "on this day", bg: "#fff", iconBg: "#E6F4F4" },
                    { icon: <Clock size={20} color="#f59e0b" />, label: "REMAINING", val: todayRemaining, sub: "scheduled / confirmed", bg: "#fff", iconBg: "#fffbeb" },
                    { icon: <UserRound size={20} color="#8b5cf6" />, label: "TOTAL PATIENTS", val: allPatients.length, sub: "all time", bg: "#fff", iconBg: "#f5f3ff" },
                    { icon: <Activity size={20} color="#ef4444" />, label: "ACTIVE PLANS", val: activePlansCount ?? "—", sub: "treatment plans", bg: "#fff", iconBg: "#fef2f2" },
                  ].map((s, i) => (
                    <div key={i} className="doc-sc" style={{ background: s.bg }}>
                      <div className="doc-sc-icon" style={{ background: s.iconBg }}>{s.icon}</div>
                      <div><div className="doc-sc-lbl">{s.label}</div><div className="doc-sc-val" style={{ color: s.icon.props.color }}>{s.val}</div><div className="doc-sc-sub">{s.sub}</div></div>
                    </div>
                  ))}
                </div>
              )}

              {inProgress && (
                <div style={{ background: "linear-gradient(135deg,#0E898F,#07595D)", borderRadius: 14, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s ease-in-out infinite" }} />
                    <div>
                      <div style={{ fontSize:12, fontWeight: 700 }}>Consultation in progress — {inProgress.patient?.name}</div>
                      <div style={{ fontSize:10, color: "rgba(255,255,255,.75)" }}>Token #{inProgress.tokenNumber} · {inProgress.timeSlot} · {TYPE_LABEL[inProgress.type]}</div>
                    </div>
                  </div>
                  <button onClick={() => handleStartPrescription(inProgress.id)}
                    style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "rgba(255,255,255,.2)", color: "#fff", fontSize:11, fontWeight: 700, cursor: "pointer" }}>
                    Continue →
                  </button>
                </div>
              )}

              {tab === "schedule" && (
                <div className="doc-card">
                  <div className="doc-card-head">
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <button onClick={() => goDate(-1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><ChevronLeft size={14} /></button>
                      <div style={{ textAlign: "center", minWidth: 140 }}>
                        <div className="doc-card-title">{isToday ? "Today's Appointments" : "Appointments"}</div>
                        <div className="doc-card-sub">{selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                      </div>
                      <button onClick={() => goDate(1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><ChevronRight size={14} /></button>
                      {!isToday && <button onClick={() => setSelectedDate(new Date())} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:10, fontWeight: 600, cursor: "pointer" }}>Today</button>}
                      <input type="date" value={fmtDate(selectedDate)} onChange={e => { if (e.target.value) setSelectedDate(new Date(e.target.value + "T00:00:00")) }} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize:11, color: "#334155", cursor: "pointer", fontFamily: "'Inter',sans-serif" }} />
                    </div>
                    <button onClick={() => doctor && fetchAppointments(doctor.id, doctor.department?.id, fmtDate(selectedDate))}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:11, fontWeight: 600, cursor: "pointer" }}>
                      <RefreshCw size={12} />Refresh
                    </button>
                  </div>
                  {/* Search / Filter / Export toolbar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderBottom: "1px solid #ecfdf5", flexWrap: "wrap" }}>
                    {/* Show All checkbox */}
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, color: showAllApptStatuses ? accent : "#64748b", background: showAllApptStatuses ? accent + "12" : "#f8fafc", border: `1px solid ${showAllApptStatuses ? accent : "#e2e8f0"}`, borderRadius: 8, padding: "6px 10px", flexShrink: 0, transition: "all .15s" }}>
                      <input type="checkbox" checked={showAllApptStatuses} onChange={e => { setShowAllApptStatuses(e.target.checked); setApptStatusFilter(""); }} style={{ accentColor: accent, width: 13, height: 13 }} />
                      Show All
                    </label>
                    {/* Filter by Type */}
                    <select value={apptTypeFilter} onChange={e => setApptTypeFilter(e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${apptTypeFilter ? accent : "#e2e8f0"}`, background: apptTypeFilter ? accent + "12" : "#f8fafc", fontSize: 11, color: apptTypeFilter ? accent : "#64748b", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
                      <option value="">All Types</option>
                      <option value="OPD">OPD</option>
                      <option value="ONLINE">Online</option>
                      <option value="FOLLOW_UP">Follow-up</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                    {/* Filter by Status (only when Show All is checked) */}
                    {showAllApptStatuses && (
                      <select value={apptStatusFilter} onChange={e => setApptStatusFilter(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${apptStatusFilter ? accent : "#e2e8f0"}`, background: apptStatusFilter ? accent + "12" : "#f8fafc", fontSize: 11, color: apptStatusFilter ? accent : "#64748b", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
                        <option value="">All Statuses</option>
                        {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 12px", flex: 1, minWidth: 160 }}>
                      <Search size={12} color="#94a3b8" />
                      <input style={{ background: "none", border: "none", outline: "none", fontSize:12, color: "#334155", width: "100%", fontFamily: "inherit" }} placeholder="Search patient, time..." value={apptSearch} onChange={e => setApptSearch(e.target.value)} />
                      {apptSearch && <button onClick={() => setApptSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={12} color="#94a3b8" /></button>}
                    </div>
                    {loadingAppts && <Loader2 size={14} color={accent} style={{ animation: "spin .7s linear infinite" }} />}
                    <div style={{ fontSize:11, color: "#94a3b8", fontWeight: 600 }}>{sortedAppts.length} of {appointments.length}</div>
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setApptExportOpen(!apptExportOpen)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 500, cursor: "pointer" }}><Download size={14} />Export</button>
                      <ExportDropdown open={apptExportOpen} onClose={() => setApptExportOpen(false)} onExport={exportAppts} />
                    </div>
                  </div>
                  {loadingAppts ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: "#94a3b8" }}>
                      <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} />Loading appointments...
                    </div>
                  ) : sortedAppts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                      <CalendarDays size={32} style={{ marginBottom: 10, opacity: .4 }} />
                      <div style={{ fontSize:13, fontWeight: 600, color: "#64748b" }}>{apptSearch ? "No matching appointments" : `No appointments ${isToday ? "today" : "on this day"}`}</div>
                      <div style={{ fontSize:11, marginTop: 4 }}>{apptSearch ? "Try a different search term" : `Your schedule is clear ${isToday ? "for today" : "for " + selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}</div>
                    </div>
                  ) : (
                    <table className="doc-tbl">
                      <thead><tr>
                        {[{ k: "tokenNumber", l: "Token" }, { k: "timeSlot", l: "Time" }, { k: "patient", l: "Patient" }, { k: "type", l: "Type" }, { k: "status", l: "Status" }].map(c => (
                          <th key={c.k} onClick={() => handleApptSort(c.k)} style={{ cursor: "pointer", userSelect: "none" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{c.l} {sortIcon(c.k, apptSortField, apptSortDir)}</span></th>
                        ))}
                        <th>Action</th>
                      </tr></thead>
                      <tbody>
                        {sortedAppts.map((a: any) => {
                          const sc = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
                          const canConsult = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status);
                          return (
                            <tr key={a.id}>
                              <td><span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "3px 8px", borderRadius: 6, fontSize:11 }}>#{a.tokenNumber || "—"}</span></td>
                              <td style={{ fontWeight: 600, color: "#334155" }}>{a.timeSlot}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => a.patient?.id && setSelectedPatientId(a.patient.id)}>
                                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${accent},#0ea5e9)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize:10, flexShrink: 0 }}>
                                    {(a.patient?.name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize:12 }}>{a.patient?.name || "—"}</div>
                                    <div style={{ fontSize:10, color: "#94a3b8" }}>{a.patient?.patientId}</div>
                                  </div>
                                </div>
                              </td>
                              <td><span style={{ fontSize:10, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{TYPE_LABEL[a.type] || a.type}</span></td>
                              <td><span className="doc-badge" style={{ background: sc.badge[0], color: sc.badge[1], border: `1px solid ${sc.badge[2]}` }}>{sc.label}</span></td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  {canConsult && (
                                    <button onClick={() => handleStartPrescription(a.id)}
                                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize:10, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(14,137,143,.3)" }}>
                                      <PlayCircle size={12} />{a.status === "IN_PROGRESS" ? "Continue" : "Consult"}
                                    </button>
                                  )}
                                  {a.status === "COMPLETED" && (
                                    <>
                                      <button onClick={() => handleViewPrescription(a.id)}
                                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                                        <FileText size={12} />View Rx
                                      </button>
                                      <button onClick={() => handleEditPrescription(a.id)}
                                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #B3E0E0", background: "#E6F4F4", color: "#0A6B70", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                                        <Pencil size={12} />Edit Rx
                                      </button>
                                    </>
                                  )}
                                  {!canConsult && a.status !== "COMPLETED" && <span style={{ fontSize:10, color: "#94a3b8" }}>—</span>}
                                  <select
                                    value={a.status}
                                    disabled={updatingStatusId === a.id}
                                    onChange={(e) => handleStatusChange(a, e.target.value)}
                                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize:10, color: "#334155", cursor: updatingStatusId === a.id ? "not-allowed" : "pointer" }}
                                  >
                                    {["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELLED", "RESCHEDULED"].map(s => (
                                      <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  {sortedAppts.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderTop: "1px solid #ecfdf5" }}>
                      <div style={{ fontSize:11, color: "#94a3b8" }}>Showing {sortedAppts.length} of {appointments.length}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>Sorted by {apptSortField === "tokenNumber" ? "Token" : apptSortField === "timeSlot" ? "Time" : apptSortField.charAt(0).toUpperCase() + apptSortField.slice(1)} · {apptSortDir === "asc" ? "Ascending" : "Descending"}</div>
                    </div>
                  )}
                </div>
              )}

              {tab === "appointments" && (
                <div className="doc-card">
                  <div className="doc-card-head">
                    <div>
                      <div className="doc-card-title">All Related Appointments</div>
                      <div className="doc-card-sub">Complete list of your past and future appointments</div>
                    </div>
                    <button onClick={() => doctor && fetchAllAppointments(doctor.id, doctor.department?.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:11, fontWeight: 600, cursor: "pointer" }}>
                      <RefreshCw size={12} />Refresh
                    </button>
                  </div>
                  {/* Search / Export toolbar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: "1px solid #ecfdf5", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 6, marginRight: 10 }}>
                      {[
                        { id: "all", label: "All" },
                        { id: "today", label: "Today" },
                        { id: "tomorrow", label: "Tomorrow" },
                        { id: "custom", label: "Custom" }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setAllApptDateFilter(f.id as any)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "1px solid",
                            borderColor: allApptDateFilter === f.id ? accent : "#e2e8f0",
                            background: allApptDateFilter === f.id ? accent + "15" : "#fff",
                            color: allApptDateFilter === f.id ? accent : "#64748b",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all .15s"
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {allApptDateFilter === "custom" && (
                      <input
                        type="date"
                        value={allApptCustomDate}
                        onChange={e => setAllApptCustomDate(e.target.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          background: "#fff",
                          fontSize: 11,
                          color: "#334155",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          marginRight: 10
                        }}
                      />
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 12px", flex: 1, minWidth: 180 }}>
                      <input style={{ background: "none", border: "none", outline: "none", fontSize:12, color: "#334155", width: "100%", fontFamily: "inherit" }} placeholder="Search patient, ID, type, status..." value={allApptSearch} onChange={e => setAllApptSearch(e.target.value)} />
                      {allApptSearch && <button onClick={() => setAllApptSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={12} color="#94a3b8" /></button>}
                    </div>
                    {allApptsLoading && <Loader2 size={14} color={accent} style={{ animation: "spin .7s linear infinite" }} />}
                    <div style={{ fontSize:11, color: "#94a3b8", fontWeight: 600 }}>{sortedAllAppts.length} of {allAppts.length}</div>
                    <div style={{ position: "relative", marginLeft: "auto" }}>
                      <button onClick={() => setAllApptExportOpen(!allApptExportOpen)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 500, cursor: "pointer" }}><Download size={14} />Export</button>
                      <ExportDropdown open={allApptExportOpen} onClose={() => setAllApptExportOpen(false)} onExport={exportAllAppts} />
                    </div>
                  </div>
                  {allApptsLoading ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: "#94a3b8" }}>
                      <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} />Loading all appointments...
                    </div>
                  ) : sortedAllAppts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                      <CalendarDays size={32} style={{ marginBottom: 10, opacity: .4 }} />
                      <div style={{ fontSize:13, fontWeight: 600, color: "#64748b" }}>{allApptSearch ? "No matching appointments" : "No appointments found"}</div>
                    </div>
                  ) : (
                    <table className="doc-tbl">
                      <thead><tr>
                        {[{ k: "appointmentDate", l: "Date" }, { k: "timeSlot", l: "Time" }, { k: "patient", l: "Patient" }, { k: "type", l: "Type" }, { k: "status", l: "Status" }].map(c => (
                          <th key={c.k} onClick={() => handleAllApptSort(c.k)} style={{ cursor: "pointer", userSelect: "none" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{c.l} {sortIcon(c.k, allApptSortField, allApptSortDir)}</span></th>
                        ))}
                        <th>Action</th>
                      </tr></thead>
                      <tbody>
                        {sortedAllAppts.map((a: any) => {
                          const sc = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
                          return (
                            <tr key={a.id}>
                              <td style={{ fontWeight: 600, color: "#334155" }}>{new Date(a.appointmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                              <td style={{ fontWeight: 600, color: "#334155" }}>{a.timeSlot}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => a.patient?.id && setSelectedPatientId(a.patient.id)}>
                                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${accent},#0ea5e9)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize:10, flexShrink: 0 }}>
                                    {(a.patient?.name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize:12 }}>{a.patient?.name || "—"}</div>
                                    <div style={{ fontSize:10, color: "#94a3b8" }}>{a.patient?.patientId}</div>
                                  </div>
                                </div>
                              </td>
                              <td><span style={{ fontSize:10, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{TYPE_LABEL[a.type] || a.type}</span></td>
                              <td><span className="doc-badge" style={{ background: sc.badge[0], color: sc.badge[1], border: `1px solid ${sc.badge[2]}` }}>{sc.label}</span></td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  {["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status) && (
                                    <button onClick={() => handleStartPrescription(a.id)}
                                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#0E898F,#0A6B70)", color: "#fff", fontSize:10, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(14,137,143,.3)" }}>
                                      <PlayCircle size={12} />{a.status === "IN_PROGRESS" ? "Continue" : "Consult"}
                                    </button>
                                  )}
                                  {a.status === "COMPLETED" && (
                                    <>
                                      <button onClick={() => handleViewPrescription(a.id)}
                                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                                        <FileText size={12} />Rx
                                      </button>
                                      <button onClick={() => handleEditPrescription(a.id)}
                                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #B3E0E0", background: "#E6F4F4", color: "#0A6B70", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                                        <Pencil size={12} />Edit Rx
                                      </button>
                                    </>
                                  )}
                                  <button onClick={() => a.patient?.id && setSelectedPatientId(a.patient.id)}
                                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                                    <UserRound size={12} />Profile
                                  </button>
                                  <select
                                    value={a.status}
                                    disabled={updatingStatusId === a.id}
                                    onChange={(e) => handleStatusChange(a, e.target.value)}
                                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize:10, color: "#334155", cursor: updatingStatusId === a.id ? "not-allowed" : "pointer" }}
                                  >
                                    {["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELLED", "RESCHEDULED"].map(s => (
                                      <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>
                                    ))}
                                  </select>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  {sortedAllAppts.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderTop: "1px solid #ecfdf5" }}>
                      <div style={{ fontSize:11, color: "#94a3b8" }}>Showing {sortedAllAppts.length} of {allAppts.length}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>Sorted by {allApptSortField === "appointmentDate" ? "Date" : allApptSortField.charAt(0).toUpperCase() + allApptSortField.slice(1)} · {allApptSortDir === "asc" ? "Oldest" : "Newest"}</div>
                    </div>
                  )}
                </div>
              )}

              {tab === "patients" && (
                <PatientsManagementPanelLazy />
              )}

              {tab === "rx" && <RxManagementPanelLazy />}

              {tab === "prescription-settings" && <PrescriptionSettingsPanel />}

              {tab === "treatment-plans" && (
                <>
                  {/* Add Plan Modal */}
                  {showAddPlan && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
                      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid #d1fae5" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid #ecfdf5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize:15, fontWeight: 800, color: "#1e293b" }}>New Treatment Plan</div>
                            <div style={{ fontSize:11, color: "#94a3b8", marginTop: 2 }}>Create a reusable plan template — assign to patients later</div>
                          </div>
                          <button onClick={() => { setShowAddPlan(false); setAddPlanErr(""); }} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} color="#64748b" /></button>
                        </div>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          if (!addPlanForm.planName.trim()) { setAddPlanErr("Plan name is required"); return; }
                          if (!doctor) { return; }
                          setAddPlanSaving(true); setAddPlanErr("");
                          const body: any = { planName: addPlanForm.planName.trim(), doctorId: doctor.id, departmentId: doctor.department?.id, totalSessions: addPlanForm.totalSessions, totalCost: addPlanForm.totalCost };
                          if (addPlanForm.startDate) body.startDate = addPlanForm.startDate;
                          if (addPlanForm.endDate) body.endDate = addPlanForm.endDate;
                          if (addPlanForm.notes.trim()) body.notes = addPlanForm.notes.trim();
                          const r = await api("/api/treatment-plans", "POST", body);
                          setAddPlanSaving(false);
                          if (r.success) {
                            setShowAddPlan(false);
                            setAddPlanForm({ planName: "", totalSessions: 1, totalCost: 0, startDate: "", endDate: "", notes: "" });
                            fetchMyPlans(doctor.id, plansFilter);
                            api(`/api/treatment-plans?doctorId=${doctor.id}&status=ACTIVE&limit=1`).then(res => { if (res.success) setActivePlansCount(res.data?.total ?? res.data?.plans?.length ?? 0); }).catch(() => { });
                          } else {
                            setAddPlanErr(r.message || "Failed to create plan");
                          }
                        }} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                          {/* Plan Name */}
                          <div>
                            <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Plan Name <span style={{ color: "#ef4444" }}>*</span></label>
                            <input value={addPlanForm.planName} onChange={e => setAddPlanForm(p => ({ ...p, planName: e.target.value }))} placeholder="e.g. 6-Week Physiotherapy Program"
                              style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }} />
                          </div>

                          {/* Sessions + Cost */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Total Sessions</label>
                              <input type="number" min={1} value={addPlanForm.totalSessions} onChange={e => setAddPlanForm(p => ({ ...p, totalSessions: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Total Cost (₹)</label>
                              <input type="number" min={0} step={0.01} value={addPlanForm.totalCost} onChange={e => setAddPlanForm(p => ({ ...p, totalCost: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }} />
                            </div>
                          </div>

                          {/* Start + End Date */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Start Date</label>
                              <input type="date" value={addPlanForm.startDate} onChange={e => setAddPlanForm(p => ({ ...p, startDate: e.target.value }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif", cursor: "pointer" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>End Date</label>
                              <input type="date" value={addPlanForm.endDate} onChange={e => setAddPlanForm(p => ({ ...p, endDate: e.target.value }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif", cursor: "pointer" }} />
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Clinical Notes</label>
                            <textarea value={addPlanForm.notes} onChange={e => setAddPlanForm(p => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Diagnosis, treatment protocol, goals…"
                              style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", resize: "vertical", fontFamily: "'Inter',sans-serif" }} />
                          </div>

                          {addPlanErr && <div style={{ padding: "9px 13px", borderRadius: 9, background: "#fff5f5", color: "#dc2626", fontSize:12, fontWeight: 600, border: "1px solid #fecaca" }}>{addPlanErr}</div>}

                          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                            <button type="button" onClick={() => { setShowAddPlan(false); setAddPlanErr(""); }} style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" disabled={addPlanSaving} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 24px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${accent},#059669)`, color: "#fff", fontSize:12, fontWeight: 700, cursor: addPlanSaving ? "not-allowed" : "pointer", opacity: addPlanSaving ? .7 : 1 }}>
                              {addPlanSaving ? <><Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />Creating…</> : <>+ Create Plan</>}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  <div className="doc-card">
                    <div className="doc-card-head">
                      <div>
                        <div className="doc-card-title">My Treatment Plans</div>
                        <div className="doc-card-sub">{activePlansCount ?? "—"} active · {myPlans.length} shown</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {["", ("ACTIVE"), ("COMPLETED"), ("ON_HOLD"), ("CANCELLED")].map(f => (
                          <button key={f} onClick={() => setPlansFilter(f)}
                            style={{
                              padding: "5px 12px", borderRadius: 8, border: "none", fontSize:10, fontWeight: 700, cursor: "pointer",
                              background: plansFilter === f ? accent + "22" : "#f8fafc", color: plansFilter === f ? accent : "#64748b"
                            }}>
                            {f || "All"}
                          </button>
                        ))}
                        <button onClick={() => doctor && fetchMyPlans(doctor.id, plansFilter)}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:10, fontWeight: 600, cursor: "pointer" }}>
                          <RefreshCw size={11} />Refresh
                        </button>
                        <button onClick={() => setShowAddPlan(true)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${accent},#059669)`, color: "#fff", fontSize:11, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }}>
                          + Add Plan
                        </button>
                      </div>
                    </div>
                    {/* Search / Sort / Export toolbar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: "1px solid #ecfdf5", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "7px 12px", flex: 1, minWidth: 180 }}>
                        <input style={{ background: "none", border: "none", outline: "none", fontSize:12, color: "#334155", width: "100%", fontFamily: "inherit" }} placeholder="Search plan, patient, status..." value={planSearch} onChange={e => setPlanSearch(e.target.value)} />
                        {planSearch && <button onClick={() => setPlanSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={12} color="#94a3b8" /></button>}
                      </div>
                      {plansLoading && <Loader2 size={14} color={accent} style={{ animation: "spin .7s linear infinite" }} />}
                      <div style={{ fontSize:11, color: "#94a3b8", fontWeight: 600 }}>{sortedPlans.length} plans</div>
                      {/* Sort buttons */}
                      {[{ k: "planName", l: "Name" }, { k: "status", l: "Status" }, { k: "sessions", l: "Sessions" }, { k: "cost", l: "Cost" }].map(c => (
                        <button key={c.k} onClick={() => handlePlanSort(c.k)} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "5px 10px", borderRadius: 7, border: "1px solid #e2e8f0", background: planSortField === c.k ? "#f0fdf4" : "#fff", color: planSortField === c.k ? accent : "#64748b", fontSize:10, fontWeight: 600, cursor: "pointer" }}>
                          {c.l} {sortIcon(c.k, planSortField, planSortDir)}
                        </button>
                      ))}
                      <div style={{ position: "relative", marginLeft: "auto" }}>
                        <button onClick={() => setPlanExportOpen(!planExportOpen)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 500, cursor: "pointer" }}><Download size={14} />Export</button>
                        <ExportDropdown open={planExportOpen} onClose={() => setPlanExportOpen(false)} onExport={exportPlans} />
                      </div>
                    </div>
                    {plansLoading ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: "#94a3b8" }}>
                        <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} />Loading treatment plans...
                      </div>
                    ) : sortedPlans.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                        <Activity size={32} style={{ marginBottom: 10, opacity: .4 }} />
                        <div style={{ fontSize:13, fontWeight: 600, color: "#64748b" }}>{planSearch ? "No matching plans" : "No treatment plans found"}</div>
                      </div>
                    ) : (
                      <div style={{ padding: "0 0 4px" }}>
                        {sortedPlans.map((plan: any) => {
                          const pct = plan.totalSessions > 0 ? Math.round((plan.completedSessions / plan.totalSessions) * 100) : 0;
                          const STATUS_SC: any = { ACTIVE: { bg: "#E6F4F4", c: "#0A6B70" }, COMPLETED: { bg: "#f0fdf4", c: "#16a34a" }, CANCELLED: { bg: "#fff5f5", c: "#ef4444" }, ON_HOLD: { bg: "#fefce8", c: "#ca8a04" } };
                          const sc = STATUS_SC[plan.status] || { bg: "#f8fafc", c: "#64748b" };
                          const bal = (plan.totalCost || 0) - (plan.paidAmount || 0);
                          return (
                            <div key={plan.id} style={{ padding: "14px 18px", borderBottom: "1px solid #f0fdf4" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <div>
                                  <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>{plan.planName}</div>
                                  <div style={{ fontSize:11, color: "#64748b", marginTop: 2 }}>
                                    {plan.patient?.name ? plan.patient.name : "No patient assigned"}{plan.service?.name ? " · " + plan.service.name : ""}
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                                  <span style={{ ...sc, padding: "3px 10px", borderRadius: 100, fontSize:10, fontWeight: 700, border: `1px solid ${sc.c}33` }}>{plan.status}</span>
                                  {bal > 0 && <span style={{ fontSize:10, color: "#ef4444", fontWeight: 600 }}>₹{bal.toLocaleString()} due</span>}
                                  <button
                                    onClick={() => {
                                      setEditPlan(plan);
                                      const toDate = (v: any) => v ? new Date(v).toISOString().slice(0, 10) : "";
                                      setEditPlanForm({ planName: plan.planName || "...", status: plan.status || "ACTIVE", totalSessions: plan.totalSessions || 1, completedSessions: plan.completedSessions || 0, totalCost: plan.totalCost || 0, paidAmount: plan.paidAmount || 0, startDate: toDate(plan.startDate), endDate: toDate(plan.endDate), notes: plan.notes || "", });
                                      setEditPlanErr("");
                                    }}
                                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:10, fontWeight: 600, cursor: "pointer" }}>
                                    <Pencil size={11} />Edit
                                  </button>
                                  <button
                                    disabled={deletingPlanId === plan.id}
                                    onClick={async () => {
                                      if (!confirm(`Delete "${plan.planName}"? This cannot be undone.`)) return;
                                      setDeletingPlanId(plan.id);
                                      await api(`/api/treatment-plans/${plan.id}`, "DELETE");
                                      setDeletingPlanId(null);
                                      if (doctor) fetchMyPlans(doctor.id, plansFilter);
                                      api(`/api/treatment-plans?doctorId=${doctor?.id}&status=ACTIVE&limit=1`).then(res => { if (res.success) setActivePlansCount(res.data?.total ?? res.data?.plans?.length ?? 0); }).catch(() => { });
                                    }}
                                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize:10, fontWeight: 600, cursor: deletingPlanId === plan.id ? "not-allowed" : "pointer", opacity: deletingPlanId === plan.id ? .6 : 1 }}>
                                    {deletingPlanId === plan.id ? <Loader2 size={11} style={{ animation: "spin .7s linear infinite" }} /> : <X size={11} />}Delete
                                  </button>
                                </div>
                              </div>
                              <div style={{ height: 5, background: "#e2e8f0", borderRadius: 100, overflow: "hidden", marginBottom: 6 }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${accent},#10b981)`, borderRadius: 100 }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize:10, color: "#94a3b8" }}>
                                <span>{plan.completedSessions}/{plan.totalSessions} sessions ({pct}%)</span>
                                <span>₹{(plan.paidAmount || 0).toLocaleString()} paid of ₹{(plan.totalCost || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {sortedPlans.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderTop: "1px solid #ecfdf5" }}>
                        <div style={{ fontSize:11, color: "#94a3b8" }}>Showing {sortedPlans.length} of {myPlans.length} plans</div>
                        <div style={{ fontSize:10, color: "#94a3b8" }}>Sorted by {planSortField === "planName" ? "Name" : planSortField === "sessions" ? "Sessions" : planSortField === "cost" ? "Cost" : planSortField.charAt(0).toUpperCase() + planSortField.slice(1)} · {planSortDir === "asc" ? "Ascending" : "Descending"}</div>
                      </div>
                    )}
                  </div>

                  {/* Edit Plan Modal */}
                  {editPlan && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
                      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid #d1fae5" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid #ecfdf5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize:15, fontWeight: 800, color: "#1e293b" }}>Edit Treatment Plan</div>
                            <div style={{ fontSize:11, color: "#94a3b8", marginTop: 2 }}>{editPlan.planName}</div>
                          </div>
                          <button onClick={() => { setEditPlan(null); setEditPlanErr(""); }} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} color="#64748b" /></button>
                        </div>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          if (!editPlanForm.planName.trim()) { setEditPlanErr("Plan name is required"); return; }
                          setEditPlanSaving(true); setEditPlanErr("");
                          const body: any = { planName: editPlanForm.planName.trim(), status: editPlanForm.status, totalSessions: editPlanForm.totalSessions, completedSessions: editPlanForm.completedSessions, totalCost: editPlanForm.totalCost, paidAmount: editPlanForm.paidAmount };
                          if (editPlanForm.startDate) body.startDate = editPlanForm.startDate;
                          if (editPlanForm.endDate) body.endDate = editPlanForm.endDate;
                          if (editPlanForm.notes.trim()) body.notes = editPlanForm.notes.trim();
                          const r = await api(`/api/treatment-plans/${editPlan.id}`, "PUT", body);
                          setEditPlanSaving(false);
                          if (r.success) {
                            setEditPlan(null);
                            if (doctor) fetchMyPlans(doctor.id, plansFilter);
                            api(`/api/treatment-plans?doctorId=${doctor?.id}&status=ACTIVE&limit=1`).then(res => { if (res.success) setActivePlansCount(res.data?.total ?? res.data?.plans?.length ?? 0); }).catch(() => { });
                          } else {
                            setEditPlanErr(r.message || "Failed to update plan");
                          }
                        }} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                          <div>
                            <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Plan Name <span style={{ color: "#ef4444" }}>*</span></label>
                            <input value={editPlanForm.planName} onChange={e => setEditPlanForm(p => ({ ...p, planName: e.target.value }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }} />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Status</label>
                            <select value={editPlanForm.status} onChange={e => setEditPlanForm(p => ({ ...p, status: e.target.value }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif", background: "#fff", cursor: "pointer" }}>
                              {["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                            </select>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Total Sessions</label>
                              <input type="number" min={1} value={editPlanForm.totalSessions} onChange={e => setEditPlanForm(p => ({ ...p, totalSessions: Math.max(1, parseInt(e.target.value) || 1) }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Completed Sessions</label>
                              <input type="number" min={0} value={editPlanForm.completedSessions} onChange={e => setEditPlanForm(p => ({ ...p, completedSessions: Math.max(0, parseInt(e.target.value) || 0) }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }} />
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Total Cost (₹)</label>
                              <input type="number" min={0} step={0.01} value={editPlanForm.totalCost} onChange={e => setEditPlanForm(p => ({ ...p, totalCost: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Paid Amount (₹)</label>
                              <input type="number" min={0} step={0.01} value={editPlanForm.paidAmount} onChange={e => setEditPlanForm(p => ({ ...p, paidAmount: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }} />
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Start Date</label>
                              <input type="date" value={editPlanForm.startDate} onChange={e => setEditPlanForm(p => ({ ...p, startDate: e.target.value }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif", cursor: "pointer" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>End Date</label>
                              <input type="date" value={editPlanForm.endDate} onChange={e => setEditPlanForm(p => ({ ...p, endDate: e.target.value }))} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif", cursor: "pointer" }} />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize:11, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Clinical Notes</label>
                            <textarea value={editPlanForm.notes} onChange={e => setEditPlanForm(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ width: "100%", padding: "10px 13px", borderRadius: 9, border: "1px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none", resize: "vertical", fontFamily: "'Inter',sans-serif" }} />
                          </div>

                          {editPlanErr && <div style={{ padding: "9px 13px", borderRadius: 9, background: "#fff5f5", color: "#dc2626", fontSize:12, fontWeight: 600, border: "1px solid #fecaca" }}>{editPlanErr}</div>}

                          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                            <button type="button" onClick={() => { setEditPlan(null); setEditPlanErr(""); }} style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" disabled={editPlanSaving} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 24px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${accent},#059669)`, color: "#fff", fontSize:12, fontWeight: 700, cursor: editPlanSaving ? "not-allowed" : "pointer", opacity: editPlanSaving ? .7 : 1 }}>
                              {editPlanSaving ? <><Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />Saving…</> : <>Save Changes</>}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {tab === "attendance" && (
            <div className="doc-card">
              <div className="doc-card-head">
                <div className="doc-card-title">My Attendance</div>
                <div className="doc-card-sub">Auto-tracked login · logout · location · work hours</div>
              </div>

              {doctor && <DoctorAttendancePanel doctor={doctor} accent={accent} />}
            </div>
          )}

          {tab === "schedule-mgmt" && doctor && (
            <ScheduleBuilder
              doctorId={doctor.id}
              doctorName={doctorName}
              accent={accent}
              apiBase="/api/doctor"
            />
          )}

          {/* ═══════════════════ REPORTS ═══════════════════ */}
          {tab === "reports" && (<>
            {reportLoading || !reportData ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "80px 0", color: "#94a3b8" }}>
                <Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} />Loading reports...
              </div>
            ) : (() => {
              const s = reportData.summary || {};
              const STATUS_COLORS: Record<string, string> = { SCHEDULED: "#94a3b8", CONFIRMED: "#10b981", IN_PROGRESS: "#0E898F", COMPLETED: "#059669", CANCELLED: "#ef4444", NO_SHOW: "#f97316", RESCHEDULED: "#a855f7" };
              const TYPE_COLORS: Record<string, string> = { OPD: "#0E898F", ONLINE: "#6366f1", FOLLOW_UP: "#f59e0b", EMERGENCY: "#ef4444" };
              const GENDER_COLORS: Record<string, string> = { MALE: "#3b82f6", FEMALE: "#ec4899", OTHER: "#8b5cf6", Unknown: "#94a3b8" };
              const CHART_COLORS = [accent, "#6366f1", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#8b5cf6", "#06b6d4"];

              return (<>
                {/* Header + Refresh */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize:17, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}><BarChart2 size={20} color={accent} />Reports & Analytics</div>
                    <div style={{ fontSize:11, color: "#94a3b8", marginTop: 2 }}>Comprehensive overview of appointments, patients, and revenue</div>
                  </div>
                  <button onClick={loadReports} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${accent},#059669)`, color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 12px ${accent}44` }}>
                    <RefreshCw size={14} />Refresh
                  </button>
                </div>

                {/* Summary Cards Row 1 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: "Total Appointments", value: s.totalAppointments, icon: <CalendarDays size={18} />, color: accent, bg: "#E6F4F4", border: "#B3E0E0" },
                    { label: "Total Revenue", value: `₹${(s.totalRevenue || 0).toLocaleString("en-IN")}`, icon: <IndianRupee size={18} />, color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
                    { label: "Today's Appointments", value: s.todayAppointments, icon: <Activity size={18} />, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
                    { label: "Today's Revenue", value: `₹${(s.todayRevenue || 0).toLocaleString("en-IN")}`, icon: <TrendingUp size={18} />, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
                  ].map((c, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: `1px solid ${c.border}`, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.color }}>{c.icon}</div>
                      </div>
                      <div style={{ fontSize:22, fontWeight: 800, color: c.color }}>{c.value}</div>
                      <div style={{ fontSize:10, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>{c.label}</div>
                    </div>
                  ))}
                </div>

                {/* Summary Cards Row 2 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                  {[
                    { label: "Total Patients", value: s.totalPatients, color: accent },
                    { label: "Completion Rate", value: `${s.completionRate}%`, color: "#10b981" },
                    { label: "Avg Revenue / Visit", value: `₹${(s.avgRevenuePerVisit || 0).toLocaleString("en-IN")}`, color: "#6366f1" },
                    { label: "Active Treatment Plans", value: s.activePlans, color: "#f59e0b" },
                  ].map((c, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1px solid #d1fae5", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 8, height: 32, borderRadius: 4, background: c.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize:17, fontWeight: 800, color: "#1e293b" }}>{c.value}</div>
                        <div style={{ fontSize:10, color: "#94a3b8", fontWeight: 600 }}>{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Row 1: Daily Trend + Appointment Types */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 24 }}>
                  {/* Daily Trend */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d1fae5", padding: "20px 20px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Daily Appointments & Revenue (Last 30 Days)</div>
                    <div style={{ fontSize:10, color: "#94a3b8", marginBottom: 14 }}>Hover for details</div>
                    <div style={{ width: "100%", height: 260 }}>
                      <RechartsResponsiveContainer width="100%" height="100%">
                        <RechartsAreaChart data={reportData.dailyTrend || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="docGradCount" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity={.3} /><stop offset="100%" stopColor={accent} stopOpacity={0} /></linearGradient>
                            <linearGradient id="docGradRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={.25} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                          </defs>
                          <RechartsXAxis dataKey="label" tick={{ fontSize:10, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#f1f5f9" }} interval={4} />
                          <RechartsYAxis yAxisId="left" tick={{ fontSize:10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                          <RechartsYAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: 10, border: "1px solid #d1fae5", fontSize:11, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }} />
                          <RechartsArea yAxisId="left" type="monotone" dataKey="count" stroke={accent} fill="url(#docGradCount)" strokeWidth={2} name="Appointments" dot={false} />
                          <RechartsArea yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#docGradRev)" strokeWidth={2} name="Revenue (₹)" dot={false} />
                        </RechartsAreaChart>
                      </RechartsResponsiveContainer>
                    </div>
                  </div>

                  {/* Appointment Types Pie */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d1fae5", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>By Appointment Type</div>
                    <div style={{ width: "100%", height: 180 }}>
                      <RechartsResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <RechartsPie data={(reportData.byType || [])} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                            {(reportData.byType || []).map((t: any, i: number) => (
                              <RechartsCell key={i} fill={TYPE_COLORS[t.type] || CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </RechartsPie>
                          <RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #d1fae5", fontSize:10 }} />
                        </RechartsPieChart>
                      </RechartsResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {(reportData.byType || []).map((t: any, i: number) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize:10, fontWeight: 600, color: "#64748b" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[t.type] || CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                          {TYPE_LABEL[t.type] || t.type} ({t.count})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Charts Row 2: Monthly Revenue + Status Distribution */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 24 }}>
                  {/* Monthly Revenue Bar */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d1fae5", padding: "20px 20px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Monthly Revenue & Appointments (Last 6 Months)</div>
                    <div style={{ fontSize:10, color: "#94a3b8", marginBottom: 14 }}>Bar = Revenue, Line = Appointments</div>
                    <div style={{ width: "100%", height: 240 }}>
                      <RechartsResponsiveContainer width="100%" height="100%">
                        <RechartsComposedChart data={reportData.monthlyTrend || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <RechartsXAxis dataKey="label" tick={{ fontSize:10, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#f1f5f9" }} />
                          <RechartsYAxis yAxisId="left" tick={{ fontSize:10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                          <RechartsYAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: 10, border: "1px solid #d1fae5", fontSize:11, boxShadow: "0 4px 12px rgba(0,0,0,.08)" }} />
                          <RechartsBar yAxisId="left" dataKey="revenue" fill={accent} radius={[6, 6, 0, 0]} name="Revenue (₹)" opacity={0.85} barSize={32} />
                          <RechartsLine yAxisId="right" type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }} name="Appointments" />
                        </RechartsComposedChart>
                      </RechartsResponsiveContainer>
                    </div>
                  </div>

                  {/* Status Distribution */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d1fae5", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Appointment Status</div>
                    {(reportData.byStatus || []).map((st: any, i: number) => {
                      const total = (reportData.byStatus || []).reduce((sum: number, x: any) => sum + x.count, 0);
                      const pct = total ? Math.round((st.count / total) * 100) : 0;
                      const clr = STATUS_COLORS[st.status] || "#94a3b8";
                      return (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize:11, fontWeight: 600, color: "#334155" }}>{STATUS_CFG[st.status]?.label || st.status}</span>
                            <span style={{ fontSize:11, fontWeight: 700, color: clr }}>{st.count} ({pct}%)</span>
                          </div>
                          <div style={{ height: 8, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 4, background: clr, width: `${pct}%`, transition: "width .5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                    {(reportData.byStatus || []).length === 0 && <div style={{ color: "#94a3b8", fontSize:11 }}>No data</div>}
                  </div>
                </div>

                {/* Charts Row 3: Hourly Distribution + Gender Distribution */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 24 }}>
                  {/* Hourly Distribution Bar */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d1fae5", padding: "20px 20px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Peak Hours Distribution</div>
                    <div style={{ fontSize:10, color: "#94a3b8", marginBottom: 14 }}>When patients visit most</div>
                    <div style={{ width: "100%", height: 200 }}>
                      <RechartsResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={reportData.hourlyDistribution || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <RechartsXAxis dataKey="hour" tick={{ fontSize:10, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#f1f5f9" }} />
                          <RechartsYAxis tick={{ fontSize:10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #d1fae5", fontSize:10 }} />
                          <RechartsBar dataKey="count" fill={accent} radius={[4, 4, 0, 0]} name="Appointments" opacity={0.85} barSize={24} />
                        </RechartsBarChart>
                      </RechartsResponsiveContainer>
                    </div>
                  </div>

                  {/* Gender Distribution */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d1fae5", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Patient Demographics</div>
                    <div style={{ width: "100%", height: 160 }}>
                      <RechartsResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <RechartsPie data={(reportData.genderDistribution || [])} dataKey="count" nameKey="gender" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} strokeWidth={0}>
                            {(reportData.genderDistribution || []).map((g: any, i: number) => (
                              <RechartsCell key={i} fill={GENDER_COLORS[g.gender] || CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </RechartsPie>
                          <RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #d1fae5", fontSize:10 }} />
                        </RechartsPieChart>
                      </RechartsResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, justifyContent: "center" }}>
                      {(reportData.genderDistribution || []).map((g: any, i: number) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize:10, fontWeight: 600, color: "#64748b" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: GENDER_COLORS[g.gender] || CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                          {g.gender} ({g.count})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Completed Appointments Table */}
                {(() => {
                  const recentFiltered = (reportData.recentCompleted || []).filter((r: any) => {
                    if (!recentSearch) return true;
                    const q = recentSearch.toLowerCase();
                    return (r.patientName || "").toLowerCase().includes(q) || (r.patientId || "").toLowerCase().includes(q) || (r.type || "").toLowerCase().includes(q) || (r.timeSlot || "").includes(q);
                  });
                  const recentSorted = [...recentFiltered].sort((a: any, b: any) => {
                    const d = recentSortDir === "asc" ? 1 : -1;
                    if (recentSortField === "patient") return d * ((a.patientName || "").localeCompare(b.patientName || ""));
                    if (recentSortField === "patientId") return d * ((a.patientId || "").localeCompare(b.patientId || ""));
                    if (recentSortField === "type") return d * ((a.type || "").localeCompare(b.type || ""));
                    if (recentSortField === "date") return d * (new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
                    if (recentSortField === "timeSlot") return d * ((a.timeSlot || "").localeCompare(b.timeSlot || ""));
                    if (recentSortField === "fee") return d * ((a.fee || 0) - (b.fee || 0));
                    return 0;
                  });
                  return (
                    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d1fae5", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                      <div style={{ padding: "16px 18px", borderBottom: "1px solid #ecfdf5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}><Clock size={15} color="#f59e0b" />Recent Completed Consultations</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ position: "relative" }}>
                            <button onClick={() => setRecentExportOpen(!recentExportOpen)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:11, fontWeight: 500, cursor: "pointer" }}><Download size={13} />Export</button>
                            <ExportDropdown open={recentExportOpen} onClose={() => setRecentExportOpen(false)} onExport={exportRecent} />
                          </div>
                        </div>
                      </div>
                      {/* Search toolbar */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: "1px solid #ecfdf5", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 12px", flex: 1, minWidth: 160 }}>
                          <input style={{ background: "none", border: "none", outline: "none", fontSize:11, color: "#334155", width: "100%", fontFamily: "inherit" }} placeholder="Search patient, ID, type..." value={recentSearch} onChange={e => setRecentSearch(e.target.value)} />
                          {recentSearch && <button onClick={() => setRecentSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={11} color="#94a3b8" /></button>}
                        </div>
                        <div style={{ fontSize:10, color: "#94a3b8", fontWeight: 600 }}>{recentSorted.length} records</div>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table className="doc-tbl">
                          <thead>
                            <tr>
                              {[{ k: "patient", l: "Patient" }, { k: "patientId", l: "Patient ID" }, { k: "type", l: "Type" }, { k: "date", l: "Date" }, { k: "timeSlot", l: "Time" }, { k: "fee", l: "Fee" }].map(c => (
                                <th key={c.k} onClick={() => handleRecentSort(c.k)} style={{ cursor: "pointer", userSelect: "none" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{c.l} {sortIcon(c.k, recentSortField, recentSortDir)}</span></th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {recentSorted.map((r: any, i: number) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600, color: "#1e293b" }}>{r.patientName}</td>
                                <td><span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", padding: "3px 8px", borderRadius: 6, fontSize:10 }}>{r.patientId}</span></td>
                                <td><span style={{ fontSize:10, background: TYPE_COLORS[r.type] ? TYPE_COLORS[r.type] + "18" : "#f1f5f9", color: TYPE_COLORS[r.type] || "#475569", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>{TYPE_LABEL[r.type] || r.type}</span></td>
                                <td style={{ fontSize:11, color: "#64748b" }}>{r.date ? new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                                <td style={{ fontWeight: 600, color: "#334155" }}>{r.timeSlot || "—"}</td>
                                <td style={{ fontWeight: 700, color: "#059669" }}>₹{(r.fee || 0).toLocaleString("en-IN")}</td>
                              </tr>
                            ))}
                            {recentSorted.length === 0 && <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize:11 }}>{recentSearch ? "No matching consultations" : "No completed consultations yet"}</td></tr>}
                          </tbody>
                        </table>
                      </div>
                      {recentSorted.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderTop: "1px solid #ecfdf5" }}>
                          <div style={{ fontSize:11, color: "#94a3b8" }}>Showing {recentSorted.length} of {(reportData.recentCompleted || []).length}</div>
                          <div style={{ fontSize:10, color: "#94a3b8" }}>Sorted by {recentSortField === "patient" ? "Patient" : recentSortField === "patientId" ? "ID" : recentSortField === "timeSlot" ? "Time" : recentSortField.charAt(0).toUpperCase() + recentSortField.slice(1)} · {recentSortDir === "desc" ? "Newest" : "Oldest"}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>);
            })()}
          </>)}
        </div>

        {/* Right Sidebar */}
        {tab === "schedule" && (
          <div className="doc-right">
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize:10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Date</div>
              <MiniCalendar accent={accent} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            </div>
            <div>
              <div className="doc-right-title" style={{ marginBottom: 10 }}>{isToday ? "Today's Queue" : "Queue · " + selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
              {appointments.length === 0 ? (
                <div style={{ fontSize:11, color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>No appointments {isToday ? "today" : "on this day"}</div>
              ) : appointments.slice(0, 6).map((a: any) => {
                const sc = STATUS_CFG[a.status] || STATUS_CFG.SCHEDULED;
                return (
                  <div key={a.id} className="doc-critical-card" style={{ background: a.status === "IN_PROGRESS" ? "#E6F4F4" : a.status === "COMPLETED" ? "#f0fdf4" : "#f8fafc", border: `1px solid ${a.status === "IN_PROGRESS" ? "#B3E0E0" : a.status === "COMPLETED" ? "#bbf7d0" : "#e2e8f0"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <div style={{ fontSize:12, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{a.patient?.name || "—"}</div>
                      <span className="doc-badge" style={{ background: sc.badge[0], color: sc.badge[1], border: `1px solid ${sc.badge[2]}` }}>{sc.label}</span>
                    </div>
                    <div style={{ fontSize:10, color: "#64748b" }}>{a.timeSlot} · Token #{a.tokenNumber || "—"}</div>
                    {["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status) && (
                      <button onClick={() => setConsultAppt(a)}
                        style={{ marginTop: 7, width: "100%", padding: "5px 0", borderRadius: 7, border: "none", background: a.status === "IN_PROGRESS" ? "#0E898F" : accent, color: "#fff", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                        {a.status === "IN_PROGRESS" ? "Continue" : "Consult"}
                      </button>
                    )}
                    {a.status === "COMPLETED" && (
                      <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                        <button onClick={() => handleViewPrescription(a.id)}
                          style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                          View Rx
                        </button>
                        <button onClick={() => handleEditPrescription(a.id)}
                          style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: "1px solid #B3E0E0", background: "#E6F4F4", color: "#0A6B70", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function DoctorDashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", color: "#64748b", fontSize:13, gap: 14 }}>
        <Loader2 size={24} style={{ animation: "spin .7s linear infinite" }} />
        Loading dashboard...
      </div>
    }>
      <DoctorDashboardContent />
    </Suspense>
  );
}
