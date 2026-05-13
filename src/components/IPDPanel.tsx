"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BedDouble, Plus, Search, RefreshCw, Loader2, X, CheckCircle2,
  User, Phone, Stethoscope, Calendar, Clock, AlertTriangle, LogOut, Download,
  ArrowUpDown, Filter
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const daysSince = (d: string | Date | null | undefined) => {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
};

const CSS = `
  @keyframes ipdFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ipdSpin{to{transform:rotate(360deg)}}
  .ipd-spin{animation:ipdSpin .7s linear infinite}
  .ipd-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
  .ipd-modal{background:#fff;border-radius:18px;width:100%;max-width:560px;box-shadow:0 24px 64px rgba(0,0,0,.18);animation:ipdFadeUp .25s ease;max-height:90vh;overflow-y:auto}
  .ipd-modal-hd{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #f1f5f9;background:#f8fafc;border-radius:18px 18px 0 0;position:sticky;top:0;z-index:1}
  .ipd-modal-title{font-size:17px;font-weight:800;color:#1e293b}
  .ipd-modal-body{padding:24px;display:flex;flex-direction:column;gap:16px}
  .ipd-modal-foot{padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;background:#f8fafc;border-radius:0 0 18px 18px}
  .ipd-field{display:flex;flex-direction:column;gap:5px}
  .ipd-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .ipd-lbl{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
  .ipd-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;width:100%;font-family:inherit;transition:border-color .2s}
  .ipd-input:focus{border-color:#0E898F;box-shadow:0 0 0 3px rgba(14,137,143,.1)}
  .ipd-input::placeholder{color:#94a3b8}
  .ipd-select{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:13px;color:#1e293b;outline:none;width:100%;font-family:inherit;cursor:pointer}
  .ipd-btn-primary{padding:10px 22px;border-radius:9px;border:none;background:linear-gradient(135deg,#0E898F,#07595D);color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(14,137,143,.28);transition:all .15s;font-family:inherit}
  .ipd-btn-primary:hover{transform:translateY(-1px)}
  .ipd-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
  .ipd-btn-ghost{padding:10px 18px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}
  .ipd-btn-ghost:hover{background:#f8fafc}
  .ipd-btn-danger{padding:8px 14px;border-radius:8px;border:none;background:#ef4444;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px}
  .ipd-btn-sm{padding:6px 12px;border-radius:7px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit;transition:all .12s;white-space:nowrap}
  .ipd-btn-sm:hover{background:#f8fafc}
  .ipd-btn-sm.teal{background:#E6F4F4;border-color:#B3E0E0;color:#0A6B70}
  .ipd-btn-sm.red{background:#fff5f5;border-color:#fecaca;color:#dc2626}
  .ipd-search-wrap{display:flex;align-items:center;gap:8;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:6px 12px}
  .ipd-search-input{border:none;background:none;outline:none;font-size:12px;color:#334155;width:180;font-family:inherit}
  .ipd-filter-btn{display:flex;align-items:center;gap:5;padding:6px 14px;border-radius:8;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:700;cursor:pointer;transition:all .12s}
  .ipd-filter-btn:hover{background:#f8fafc}
  .ipd-filter-btn.active{background:#E6F4F4;border-color:#B3E0E0;color:#0A6B70}
  .ipd-sort-btn{display:flex;align-items:center;gap:3;padding:4px 8px;border-radius:6;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:11px;font-weight:700;cursor:pointer;transition:all .12s}
  .ipd-sort-btn:hover{background:#fff}
  .ipd-sort-btn.active{background:#E6F4F4;border-color:#B3E0E0;color:#0A6B70}
  .ipd-patient-search{position:relative}
  .ipd-patient-dropdown{position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #e2e8f0;border-radius:9px;box-shadow:0 12px 32px rgba(0,0,0,.12);max-height:200px;overflow-y:auto;z-index:10}
  .ipd-patient-item{padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid #f1f5f9;transition:background .1s}
  .ipd-patient-item:hover{background:#f8fafc}
  .ipd-patient-item:last-child{border-bottom:none}
  .ipd-entry-type{display:flex;background:#f1f5f9;border-radius:8px;padding:3px;margin-bottom:16px}
  .ipd-entry-type-btn{flex:1;padding:7px 12px;border-radius:6;border:none;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;background:transparent;color:#64748b}
  .ipd-entry-type-btn.active{background:#fff;color:#0E898F;box-shadow:0 1px 3px rgba(0,0,0,.08)}
`;

interface BedOverview {
  wards: Ward[];
  summary: { total: number; available: number; occupied: number; maintenance: number; reserved: number };
}
interface Ward {
  id: string;
  name: string;
  type: string;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  beds: Bed[];
}
interface Bed {
  id: string;
  bedNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
  type?: string;
  activeAllocation?: Allocation | null;
}
interface Allocation {
  id: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  diagnosis?: string;
  admittingDoctorName?: string;
  admissionDate: string;
  expectedDischargeDate?: string;
  status: string;
}

const BED_STATUS_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  AVAILABLE:   { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Available" },
  OCCUPIED:    { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", label: "Occupied" },
  MAINTENANCE: { bg: "#fef3c7", color: "#b45309", border: "#fde68a", label: "Maintenance" },
  RESERVED:    { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd", label: "Reserved" },
};

function AllocateModal({ bed, ward, wards, onClose, onDone }: { bed?: Bed; ward?: { id: string; name: string }; wards?: Ward[]; onClose: () => void; onDone: () => void }) {
  const [selectedWardId, setSelectedWardId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [entryType, setEntryType] = useState<"search" | "manual">("search");
  const [form, setForm] = useState({
    patientId: "", patientName: "", patientAge: "", patientGender: "Male", patientPhone: "",
    attendantName: "", attendantPhone: "", diagnosis: "", admittingDoctorName: "",
    admissionDate: new Date().toISOString().split("T")[0],
    expectedDischargeDate: "", notes: "", departmentId: "",
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/departments").then(d => {
      if (d.success) setDepartments(d.data?.departments || d.data || []);
    });
  }, []);

  useEffect(() => {
    if (entryType === "search" && patientSearch.length >= 2) {
      setSearching(true);
      api(`/api/patients?q=${encodeURIComponent(patientSearch)}&limit=10`)
        .then(d => {
          const results = d.data?.data || d.data || [];
          setPatientResults(results);
          setShowDropdown(true);
        })
        .finally(() => setSearching(false));
    } else {
      setPatientResults([]);
      setShowDropdown(false);
    }
  }, [patientSearch, entryType]);

  const selectPatient = (patient: any) => {
    setForm({
      ...form,
      patientId: patient.id,
      patientName: patient.name || "",
      patientAge: patient.age ? String(patient.age) : "",
      patientGender: patient.gender || "Male",
      patientPhone: patient.phone || "",
    });
    setPatientSearch("");
    setShowDropdown(false);
  };

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bed && !selectedBedId) { setError("Please select a bed"); return; }
    if (!form.patientName.trim()) { setError("Patient name is required"); return; }
    if (!form.departmentId) { setError("Please select a department"); return; }
    setSaving(true);
    setError("");
    const payload: any = {
      bedId: bed ? bed.id : selectedBedId,
      patientId: entryType === "search" && form.patientId ? form.patientId : undefined,
      patientName: form.patientName.trim(),
      patientAge: form.patientAge ? parseInt(form.patientAge) : undefined,
      patientGender: form.patientGender || undefined,
      patientPhone: form.patientPhone || undefined,
      attendantName: form.attendantName || undefined,
      attendantPhone: form.attendantPhone || undefined,
      diagnosis: form.diagnosis || undefined,
      admittingDoctorName: form.admittingDoctorName || undefined,
      admissionDate: form.admissionDate || undefined,
      expectedDischargeDate: form.expectedDischargeDate || undefined,
      notes: form.notes || undefined,
      departmentId: form.departmentId || undefined,
      entryType: entryType === "manual" ? "MANUAL" : "PATIENT",
    };
    const res = await api("/api/ipd/allocate-bed", "POST", payload);
    setSaving(false);
    if (res.success) { onDone(); onClose(); }
    else setError(res.message || "Failed to allocate bed");
  };

  return (
    <div className="ipd-overlay" onClick={onClose}>
      <div className="ipd-modal" onClick={e => e.stopPropagation()}>
        <div className="ipd-modal-hd">
          <div>
            <div className="ipd-modal-title">Admit Patient {bed ? `— Bed ${bed.bedNumber}` : ""}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{ward ? ward.name : bed ? "" : "Select bed and fill patient details"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="ipd-modal-body">
            {/* Entry Type Toggle */}
            <div className="ipd-entry-type">
              <button type="button" className={`ipd-entry-type-btn ${entryType === "search" ? "active" : ""}`} onClick={() => setEntryType("search")}>
                <User size={11} style={{ display: "inline", marginRight: 4 }} /> Search Patient
              </button>
              <button type="button" className={`ipd-entry-type-btn ${entryType === "manual" ? "active" : ""}`} onClick={() => setEntryType("manual")}>
                <Plus size={11} style={{ display: "inline", marginRight: 4 }} /> Manual Entry
              </button>
            </div>

            {error && <div style={{ background: "#fff5f5", color: "#dc2626", padding: "10px 14px", borderRadius: 9, fontSize: 13, border: "1px solid #fecaca" }}>{error}</div>}

            {entryType === "search" && (
              <div className="ipd-field ipd-patient-search">
                <label className="ipd-lbl">Search Existing Patient</label>
                <input className="ipd-input" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="Type patient name or phone..." />
                {searching && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}><Loader2 size={11} className="ipd-spin" style={{ display: "inline", marginRight: 4 }} />Searching...</div>}
                {showDropdown && patientResults.length > 0 && (
                  <div className="ipd-patient-dropdown">
                    {patientResults.map((p: any) => (
                      <div key={p.id} className="ipd-patient-item" onClick={() => selectPatient(p)}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {p.age ? `${p.age}y` : ""} {p.gender || ""} {p.phone ? `· ${p.phone}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {entryType === "manual" && (
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 9, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", marginBottom: 4 }}>Manual Patient Entry</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>A new patient record will be created in the database with remark "Manual IPD entry".</div>
              </div>
            )}

            <div className="ipd-grid-2">
              {!bed && (
                <>
                  <div className="ipd-field">
                    <label className="ipd-lbl">Ward / Room *</label>
                    <select className="ipd-select" value={selectedWardId} onChange={e => { setSelectedWardId(e.target.value); setSelectedBedId(""); }} required>
                      <option value="">Select Ward</option>
                      {wards?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="ipd-field">
                    <label className="ipd-lbl">Available Bed *</label>
                    <select className="ipd-select" value={selectedBedId} onChange={e => setSelectedBedId(e.target.value)} required disabled={!selectedWardId}>
                      <option value="">Select Bed</option>
                      {wards?.find(w => w.id === selectedWardId)?.beds.filter(b => b.status === "AVAILABLE").map(b => (
                        <option key={b.id} value={b.id}>Bed {b.bedNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1/-1", height: 1, background: "#f1f5f9", margin: "4px 0" }} />
                </>
              )}
              <div className="ipd-field" style={{ gridColumn: "1/-1" }}>
                <label className="ipd-lbl">Patient Name * {entryType === "manual" && <span style={{ color: "#dc2626", fontSize: 10 }}>(Manual Entry)</span>}</label>
                <input className="ipd-input" value={form.patientName} onChange={e => set("patientName", e.target.value)} placeholder={entryType === "manual" ? "Enter patient full name" : "Select from search or enter manually"} required />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Age</label>
                <input className="ipd-input" type="number" min="0" max="150" value={form.patientAge} onChange={e => set("patientAge", e.target.value)} placeholder="e.g. 35" />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Gender</label>
                <select className="ipd-select" value={form.patientGender} onChange={e => set("patientGender", e.target.value)}>
                  {["Male","Female","Other"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Patient Phone {entryType === "manual" && <span style={{ color: "#dc2626" }}>*</span>}</label>
                <input className="ipd-input" value={form.patientPhone} onChange={e => set("patientPhone", e.target.value)} placeholder="Phone number" required={entryType === "manual"} />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Department *</label>
                <select className="ipd-select" value={form.departmentId} onChange={e => set("departmentId", e.target.value)} required>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Admitting Doctor</label>
                <input className="ipd-input" value={form.admittingDoctorName} onChange={e => set("admittingDoctorName", e.target.value)} placeholder="Doctor name" />
              </div>
              <div className="ipd-field" style={{ gridColumn: "1/-1" }}>
                <label className="ipd-lbl">Diagnosis / Reason</label>
                <input className="ipd-input" value={form.diagnosis} onChange={e => set("diagnosis", e.target.value)} placeholder="Primary diagnosis" />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Admission Date</label>
                <input className="ipd-input" type="date" value={form.admissionDate} onChange={e => set("admissionDate", e.target.value)} />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Expected Discharge</label>
                <input className="ipd-input" type="date" value={form.expectedDischargeDate} onChange={e => set("expectedDischargeDate", e.target.value)} />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Attendant Name</label>
                <input className="ipd-input" value={form.attendantName} onChange={e => set("attendantName", e.target.value)} placeholder="Attendant" />
              </div>
              <div className="ipd-field">
                <label className="ipd-lbl">Attendant Phone</label>
                <input className="ipd-input" value={form.attendantPhone} onChange={e => set("attendantPhone", e.target.value)} placeholder="Phone" />
              </div>
              <div className="ipd-field" style={{ gridColumn: "1/-1" }}>
                <label className="ipd-lbl">Notes</label>
                <textarea className="ipd-input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional notes..." style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>
          <div className="ipd-modal-foot">
            <button type="button" className="ipd-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ipd-btn-primary" disabled={saving}>
              {saving && <Loader2 size={13} className="ipd-spin" />}
              {saving ? "Admitting..." : "Admit Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DischargeModal({ allocation, bedNumber, onClose, onDone }: { allocation: Allocation; bedNumber: string; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState("");
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api("/api/ipd/discharge-bed", "POST", {
      allocationId: allocation.id,
      actualDischargeDate: dischargeDate || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    if (res.success) { onDone(); onClose(); }
    else alert(res.message || "Failed to discharge");
  };

  return (
    <div className="ipd-overlay" onClick={onClose}>
      <div className="ipd-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="ipd-modal-hd">
          <div>
            <div className="ipd-modal-title">Discharge Patient</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Bed {bedNumber} · {allocation.patientName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="ipd-modal-body">
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c2410c", marginBottom: 6 }}>Confirm Discharge</div>
              <div style={{ fontSize: 12, color: "#7c3aed" }}>
                Admitting: {fmtDate(allocation.admissionDate)} ({daysSince(allocation.admissionDate)} days) ·
                {allocation.diagnosis && ` ${allocation.diagnosis}`}
              </div>
            </div>
            <div className="ipd-field">
              <label className="ipd-lbl">Discharge Date</label>
              <input className="ipd-input" type="date" value={dischargeDate} onChange={e => setDischargeDate(e.target.value)} />
            </div>
            <div className="ipd-field">
              <label className="ipd-lbl">Discharge Notes</label>
              <textarea className="ipd-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Discharge summary / instructions..." style={{ resize: "vertical" }} />
            </div>
          </div>
          <div className="ipd-modal-foot">
            <button type="button" className="ipd-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ipd-btn-danger" disabled={saving}>
              {saving && <Loader2 size={13} className="ipd-spin" />}
              {saving ? "Discharging..." : "Discharge Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IPDPanel() {
  const [overview, setOverview] = useState<BedOverview | null>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"beds" | "admissions">("beds");
  const [search, setSearch] = useState("");
  const [allocateBed, setAllocateBed] = useState<{ bed?: Bed; ward?: { id: string; name: string }; isGlobal?: boolean } | null>(null);
  const [dischargingAlloc, setDischargingAlloc] = useState<{ allocation: Allocation; bedNumber: string } | null>(null);
  const [updatingBedId, setUpdatingBedId] = useState<string | null>(null);

  // Sorting & Filtering
  const [deptFilter, setDeptFilter] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [allocSort, setAllocSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "admissionDate", dir: "desc" });
  const [bedSort, setBedSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "bedNumber", dir: "asc" });

  useEffect(() => {
    api("/api/departments").then(d => {
      if (d.success) setDepartments(d.data?.departments || d.data || []);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [ov, al] = await Promise.all([
      api("/api/ipd/bed-status"),
      api("/api/ipd/bed-status?type=allocations&status=ACTIVE"),
    ]);
    if (ov.success) setOverview(ov.data);
    if (al.success) setAllocations(al.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBedStatusChange = async (bedId: string, status: "AVAILABLE" | "MAINTENANCE" | "RESERVED") => {
    setUpdatingBedId(bedId);
    await api("/api/ipd/bed-status", "PATCH", { bedId, status });
    setUpdatingBedId(null);
    load();
  };

  const toggleAllocSort = (key: string) => setAllocSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));
  const toggleBedSort = (key: string) => setBedSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));

  const filteredWards = overview?.wards?.filter(w => {
    if (search) {
      const q = search.toLowerCase();
      return w.name.toLowerCase().includes(q) ||
        w.beds.some(b => b.bedNumber.toLowerCase().includes(q) ||
          b.activeAllocation?.patientName?.toLowerCase().includes(q));
    }
    return true;
  }) || [];

  const sortedWards = filteredWards.sort((a, b) => {
    const dir = bedSort.dir === "asc" ? 1 : -1;
    if (bedSort.key === "name") return dir * a.name.localeCompare(b.name);
    if (bedSort.key === "available") return dir * (a.availableBeds - b.availableBeds);
    if (bedSort.key === "occupied") return dir * (a.occupiedBeds - b.occupiedBeds);
    if (bedSort.key === "type") return dir * (a.type || "").localeCompare(b.type || "");
    return 0;
  });

  const deptAllocations = allocations.filter(a => {
    if (deptFilter && a.departmentId !== deptFilter) return false;
    return true;
  });

  const filteredAllocations = deptAllocations.filter(a =>
    !search ||
    a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    a.bed?.bedNumber?.toLowerCase().includes(search.toLowerCase()) ||
    a.bed?.ward?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedAllocations = [...filteredAllocations].sort((a, b) => {
    const dir = allocSort.dir === "asc" ? 1 : -1;
    if (allocSort.key === "admissionDate") return dir * (new Date(a.admissionDate).getTime() - new Date(b.admissionDate).getTime());
    if (allocSort.key === "patientName") return dir * (a.patientName || "").localeCompare(b.patientName || "");
    if (allocSort.key === "days") {
      const daysA = daysSince(a.admissionDate);
      const daysB = daysSince(b.admissionDate);
      return dir * (daysA - daysB);
    }
    if (allocSort.key === "wardType") return dir * ((a.bed?.ward?.type || "").localeCompare(b.bed?.ward?.type || ""));
    return 0;
  });

  const summary = overview?.summary;

  return (
    <>
      <style>{CSS}</style>

      {allocateBed && (
        <AllocateModal bed={allocateBed.bed} ward={allocateBed.ward} wards={overview?.wards} onClose={() => setAllocateBed(null)} onDone={load} />
      )}
      {dischargingAlloc && (
        <DischargeModal
          allocation={dischargingAlloc.allocation}
          bedNumber={dischargingAlloc.bedNumber}
          onClose={() => setDischargingAlloc(null)}
          onDone={load}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: 0 }}>IPD — Ward & Bed Management</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
            {summary ? `${summary.total} beds · ${summary.occupied} occupied · ${summary.available} available` : "Loading..."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 9, padding: 3 }}>
            {[{ id: "beds", label: "Bed Map" }, { id: "admissions", label: "Admissions" }].map(v => (
              <button key={v.id} onClick={() => setView(v.id as any)}
                style={{ padding: "6px 14px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: view === v.id ? "#fff" : "transparent", color: view === v.id ? "#0E898F" : "#64748b", boxShadow: view === v.id ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}>
                {v.label}
              </button>
            ))}
          </div>
          <button onClick={() => setAllocateBed({ isGlobal: true })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#0E898F,#07595D)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(14,137,143,.28)", whiteSpace: "nowrap" }}>
            <Plus size={13} /> Admit Patient
          </button>
          <a href="/api/export/ipd" download title="Export IPD admissions as CSV"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            <Download size={13} />Export CSV
          </a>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary chips */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Beds", val: summary.total, bg: "#f1f5f9", color: "#475569" },
            { label: "Occupied", val: summary.occupied, bg: "#fff7ed", color: "#c2410c" },
            { label: "Available", val: summary.available, bg: "#f0fdf4", color: "#16a34a" },
            { label: "Maintenance", val: summary.maintenance + summary.reserved, bg: "#fef3c7", color: "#b45309" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${s.color}22` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", marginBottom: 18 }}>
        <Search size={15} color="#94a3b8" />
        <input
          placeholder={view === "beds" ? "Search ward or bed number..." : "Search patient or bed..."}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#334155", background: "transparent" }}
        />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={14} /></button>}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 0", color: "#94a3b8" }}>
          <Loader2 size={22} color="#0E898F" className="ipd-spin" /> Loading ward data...
        </div>
      ) : view === "beds" ? (
        /* ── BED MAP VIEW ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Sort:</span>
              {[{ k: "name", l: "Name" }, { k: "type", l: "Type" }, { k: "available", l: "Available" }, { k: "occupied", l: "Occupied" }].map(s => (
                <button key={s.k} type="button" onClick={() => toggleBedSort(s.k)} className={`ipd-sort-btn ${bedSort.key === s.k ? "active" : ""}`}>
                  {s.l} <ArrowUpDown size={10} />
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{sortedWards.length} ward{sortedWards.length !== 1 ? "s" : ""}</div>
          </div>

          {sortedWards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <BedDouble size={36} style={{ margin: "0 auto 12px", display: "block", opacity: .3 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>No wards configured</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Add wards & beds in Configure → Ward & Bed Setup</div>
            </div>
          ) : sortedWards.map(ward => (
            <div key={ward.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <BedDouble size={18} color="#0E898F" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{ward.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{ward.type} · {ward.totalBeds} beds</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>{ward.availableBeds} available</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>{ward.occupiedBeds} occupied</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, padding: 16 }}>
                {ward.beds.map((bed: Bed) => {
                  const sc = BED_STATUS_CFG[bed.status] || BED_STATUS_CFG.AVAILABLE;
                  const alloc = bed.activeAllocation;
                  const days = alloc ? daysSince(alloc.admissionDate) : 0;
                  return (
                    <div key={bed.id} style={{ background: sc.bg, border: `1.5px solid ${sc.border}`, borderRadius: 12, padding: 14, position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>Bed {bed.bedNumber}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                      </div>

                      {bed.status === "AVAILABLE" && (
                        <button className="ipd-btn-sm teal" onClick={() => setAllocateBed({ bed, ward: { id: ward.id, name: ward.name } })} style={{ width: "100%", justifyContent: "center" }}>
                          <Plus size={11} /> Admit Patient
                        </button>
                      )}

                      {bed.status === "OCCUPIED" && alloc && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>{alloc.patientName}</div>
                          {alloc.patientAge && <div style={{ fontSize: 11, color: "#64748b" }}>{alloc.patientAge}y {alloc.patientGender}</div>}
                          {alloc.diagnosis && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontStyle: "italic" }}>{alloc.diagnosis}</div>}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>{days}d admitted</span>
                            <button className="ipd-btn-sm red" onClick={() => setDischargingAlloc({ allocation: alloc, bedNumber: bed.bedNumber })}>
                              <LogOut size={10} /> Discharge
                            </button>
                          </div>
                        </>
                      )}

                      {(bed.status === "MAINTENANCE" || bed.status === "RESERVED") && (
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                          <button className="ipd-btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 10 }}
                            disabled={updatingBedId === bed.id}
                            onClick={() => handleBedStatusChange(bed.id, "AVAILABLE")}>
                            {updatingBedId === bed.id ? <Loader2 size={9} className="ipd-spin" /> : <CheckCircle2 size={10} />}
                            Mark Available
                          </button>
                        </div>
                      )}

                      {bed.status === "AVAILABLE" && (
                        <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                          <button className="ipd-btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 10 }}
                            onClick={() => handleBedStatusChange(bed.id, "MAINTENANCE")}>
                            <AlertTriangle size={9} /> Maint.
                          </button>
                          <button className="ipd-btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 10 }}
                            onClick={() => handleBedStatusChange(bed.id, "RESERVED")}>
                            <Clock size={9} /> Reserve
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── ADMISSIONS LIST VIEW ── */
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Sort:</span>
              {[{ k: "admissionDate", l: "Date" }, { k: "patientName", l: "Patient" }, { k: "days", l: "Days" }, { k: "wardType", l: "Ward Type" }].map(s => (
                <button key={s.k} type="button" onClick={() => toggleAllocSort(s.k)} className={`ipd-sort-btn ${allocSort.key === s.k ? "active" : ""}`}>
                  {s.l} <ArrowUpDown size={10} />
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {departments.length > 0 && (
                <>
                  <Filter size={13} color="#64748b" />
                  <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="ipd-select" style={{ width: "auto", padding: "6px 10px", fontSize: 12 }}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </>
              )}
              <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{sortedAllocations.length} admission{sortedAllocations.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Active Admissions</div>
          </div>
          {sortedAllocations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <User size={32} style={{ margin: "0 auto 10px", display: "block", opacity: .3 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>No active admissions</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    {["Bed", "Patient", "Department", "Ward Type", "Age/Gender", "Diagnosis", "Doctor", "Admitted", "Days", "Exp. Discharge", "Action"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedAllocations.map((a: any) => {
                    const days = daysSince(a.admissionDate);
                    const overdue = a.expectedDischargeDate && new Date(a.expectedDischargeDate) < new Date();
                    return (
                      <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "13px 14px" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0E898F" }}>{a.bed?.bedNumber || "—"}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.bed?.ward?.name || ""}</div>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{a.patientName}</div>
                          {a.patientPhone && <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}><Phone size={9} />{a.patientPhone}</div>}
                          {a.entryType === "MANUAL" && <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 600, marginTop: 2 }}>Manual Entry</div>}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          {a.department?.name ? (
                            <span style={{ padding: "3px 9px", borderRadius: 100, background: "#E6F4F4", color: "#0A6B70", fontSize: 11, fontWeight: 700 }}>{a.department.name}</span>
                          ) : (
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#64748b" }}>
                          {a.bed?.ward?.type || "—"}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#64748b" }}>
                          {a.patientAge ? `${a.patientAge}y` : "—"} {a.patientGender || ""}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#475569", maxWidth: 160 }}>
                          {a.diagnosis || "—"}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#64748b" }}>
                          {a.admittingDoctorName ? <><Stethoscope size={11} style={{ display: "inline", marginRight: 4 }} />{a.admittingDoctorName}</> : "—"}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                          {fmtDate(a.admissionDate)}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: days > 7 ? "#fff7ed" : "#f0fdf4", color: days > 7 ? "#c2410c" : "#16a34a" }}>{days}d</span>
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: 12, whiteSpace: "nowrap", color: overdue ? "#dc2626" : "#64748b", fontWeight: overdue ? 700 : 400 }}>
                          {overdue && <AlertTriangle size={11} style={{ display: "inline", marginRight: 4 }} />}
                          {fmtDate(a.expectedDischargeDate)}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <button className="ipd-btn-sm red"
                            onClick={() => setDischargingAlloc({ allocation: a, bedNumber: a.bed?.bedNumber || "" })}>
                            <LogOut size={11} /> Discharge
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
