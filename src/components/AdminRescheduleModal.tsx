"use client";
import React, { useState, useEffect } from "react";
import { X, Loader2, RefreshCw } from "lucide-react";

interface Dept { id: string; name: string; }
interface Doc { id: string; name: string; specialization?: string; }
interface Appt {
  id: string; appointmentDate: string; timeSlot: string; status: string;
  patient?: { name: string; patientId: string } | null;
  doctor?: { name: string } | null;
  department?: { name: string } | null;
  doctorId?: string; departmentId?: string;
}

function api(path: string, method?: string, body?: any) {
  return fetch(path, {
    method: method || "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());
}

function toLocalDateStr(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmt12(t: string) {
  if (!t) return t;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function AdminRescheduleModal({ appt, onClose, onConfirm }: {
  appt: Appt; onClose: () => void;
  onConfirm: (payload: { doctorId: string; departmentId: string; appointmentDate: string; timeSlot: string }) => void;
}) {
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [doctors, setDoctors] = useState<Doc[]>([]);
  const [departmentId, setDepartmentId] = useState(appt.departmentId || "");
  const [doctorId, setDoctorId] = useState(appt.doctorId || "");
  const [appointmentDate, setAppointmentDate] = useState(toLocalDateStr(new Date()));
  const [slots, setSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { api("/api/config/departments?simple=true").then(d => setDepartments(d.data || [])); }, []);
  useEffect(() => {
    const url = departmentId ? `/api/config/doctors?simple=true&departmentId=${departmentId}` : "/api/config/doctors?simple=true";
    api(url).then(d => setDoctors(d.data || []));
  }, [departmentId]);
  useEffect(() => {
    if (!doctorId || !appointmentDate) { setSlots([]); setBookedSlots([]); setSelectedTime(""); return; }
    setSlotsLoading(true);
    api(`/api/appointments/slots?doctorId=${doctorId}&date=${appointmentDate}`)
      .then(d => { setSlots(d.data?.slots || []); setBookedSlots(d.data?.bookedSlots || []); })
      .finally(() => setSlotsLoading(false));
  }, [doctorId, appointmentDate]);

  const handleConfirm = () => {
    if (!doctorId) { setErr("Please select a doctor."); return; }
    if (!departmentId) { setErr("Please select a department."); return; }
    if (!appointmentDate) { setErr("Please select a date."); return; }
    if (!selectedTime) { setErr("Please select a time slot."); return; }
    setSaving(true);
    onConfirm({ doctorId, departmentId, appointmentDate, timeSlot: selectedTime });
  };

  const availableSlots = slots.filter(s => !bookedSlots.includes(s));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 24px 60px rgba(0,0,0,.18)", fontFamily: "'Inter',sans-serif", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>Reschedule Appointment</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{appt.patient?.name} · {appt.patient?.patientId}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}><X size={14} /></button>
        </div>
        <div style={{ background: "#E6F4F4", borderRadius: 12, padding: "12px 14px", marginBottom: 20, border: "1px solid #B3E0E0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Current Appointment</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#07595D" }}>
            {new Date(appt.appointmentDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at {fmt12(appt.timeSlot)} · Dr. {appt.doctor?.name} · {appt.department?.name}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Department</label>
              <select value={departmentId} onChange={e => { setDepartmentId(e.target.value); setDoctorId(""); }}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#334155", outline: "none", fontFamily: "'Inter',sans-serif" }}>
                <option value="">Select department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Doctor</label>
              <select value={doctorId} onChange={e => { setDoctorId(e.target.value); setSelectedTime(""); }}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#334155", outline: "none", fontFamily: "'Inter',sans-serif" }}>
                <option value="">Select doctor...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}{d.specialization ? ` — ${d.specialization}` : ""}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>New Date</label>
            <input type="date" value={appointmentDate} min={toLocalDateStr(new Date())}
              onChange={e => { setAppointmentDate(e.target.value); setSelectedTime(""); }}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 14, color: "#334155", outline: "none", fontFamily: "'Inter',sans-serif", cursor: "pointer" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Available Time Slots</label>
              {!slotsLoading && slots.length > 0 && (
                <span style={{ fontSize: 10, color: "#0E898F", fontWeight: 600, background: "#E6F4F4", padding: "2px 8px", borderRadius: 100, border: "1px solid #B3E0E0" }}>
                  {availableSlots.length} available
                </span>
              )}
            </div>
            {slotsLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 0", color: "#94a3b8", fontSize: 13 }}>
                <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> Loading schedule...
              </div>
            ) : !doctorId ? (
              <div style={{ fontSize: 13, color: "#94a3b8", padding: "14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", textAlign: "center" }}>Select a doctor and date to view slots</div>
            ) : slots.length === 0 ? (
              <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600, padding: "14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", textAlign: "center" }}>No slots available for this doctor on selected date.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {slots.map(slot => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedTime === slot;
                  return (
                    <button key={slot} disabled={isBooked}
                      onClick={() => { if (!isBooked) { setSelectedTime(slot); setErr(""); } }}
                      style={{
                        padding: "9px 6px", borderRadius: 9,
                        border: isSelected ? "2px solid #0E898F" : isBooked ? "1px solid #e2e8f0" : "1.5px solid #B3E0E0",
                        background: isSelected ? "#0E898F" : isBooked ? "#f1f5f9" : "#E6F4F4",
                        color: isSelected ? "#fff" : isBooked ? "#cbd5e1" : "#0A6B70",
                        fontSize: 12, fontWeight: 700,
                        cursor: isBooked ? "not-allowed" : "pointer",
                        textDecoration: isBooked ? "line-through" : "none",
                        fontFamily: "'Inter',sans-serif", transition: "all .15s", position: "relative",
                      }}>
                      {slot}
                      {isBooked && (
                        <span style={{ position: "absolute", top: -6, right: -4, fontSize: 8, background: "#ef4444", color: "#fff", borderRadius: 100, padding: "1px 4px", fontWeight: 700 }}>Full</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedTime && (
              <div style={{ fontSize: 12, color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                Selected: {fmt12(selectedTime)}
              </div>
            )}
          </div>
          {err && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, background: "#fff5f5", padding: "10px 14px", borderRadius: 9, border: "1px solid #fecaca" }}>{err}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} disabled={saving}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "2px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>Cancel</button>
            <button onClick={handleConfirm} disabled={saving || !selectedTime}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: saving || !selectedTime ? "#94a3b8" : "#0E898F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving || !selectedTime ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: saving || !selectedTime ? "none" : "0 4px 14px rgba(14,137,143,.35)" }}>
              {saving ? <><Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} /> Saving…</> : <><RefreshCw size={13} /> Confirm Reschedule</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
