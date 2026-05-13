"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Heart, Search, RefreshCw, Loader2, X, Check, AlertTriangle, Clock,
  Activity, TrendingUp, FileText, BarChart2, Users, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, IndianRupee, Layers, Plus, Trash2, Edit2,
  ClipboardList, Calendar, User, Stethoscope, Thermometer, Droplets,
  BedDouble, Bell, Eye, ShieldCheck, MessageSquare, ArrowRight, Pill
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PatientAssignment {
  id: string;
  patient: { id: string; name: string; patientId: string; phone?: string; gender?: string; dateOfBirth?: string; bloodGroup?: string };
  ward?: string;
  bed?: string;
  doctor: { name: string; specialization?: string };
  admissionDate?: string;
  diagnosis?: string;
  status: string;
}

interface VitalRecord {
  id: string;
  patientId: string;
  patientName: string;
  bp?: string;
  pulse?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  recordedAt: string;
  recordedBy: string;
  notes?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = "#be185d";
const LIGHT_BG = "#fdf2f8";
const BORDER = "#fbcfe8";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function NursingDashboard({ profile, user }: { profile: any; user: any }) {
  const [tab, setTab] = useState<"overview" | "patients" | "vitals" | "medications" | "notes" | "alerts">("overview");
  const [loading, setLoading] = useState(false);

  // Patient assignments
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  // Vitals
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [vitalForm, setVitalForm] = useState({ patientId: "", bp: "", pulse: "", temperature: "", spo2: "", respiratoryRate: "", notes: "" });

  // Medication schedule
  const [medications, setMedications] = useState<any[]>([]);
  const [medsLoading, setMedsLoading] = useState(false);

  // Nursing notes
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<any[]>([]);

  // ── Load patients (from queue/appointments) ──
  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    const res = await api("/api/subdept/queue");
    if (res.success) {
      setPatients(res.data?.queue || []);
    }
    setPatientsLoading(false);
  }, []);

  // ── Load vitals (from procedure records) ──
  const loadVitals = useCallback(async () => {
    setVitalsLoading(true);
    const res = await api("/api/subdept/records?limit=50");
    if (res.success) {
      setVitals(res.data?.data || []);
    }
    setVitalsLoading(false);
  }, []);

  // ── Load medication schedule (prescriptions with medications) ──
  const loadMedications = useCallback(async () => {
    setMedsLoading(true);
    const res = await api("/api/subdept/queue");
    if (res.success) {
      const q = res.data?.queue || [];
      // Extract medication data from queued patients
      const meds = q.filter((p: any) => {
        try {
          const rxData = p.prescription || p;
          const medications = rxData.medications ? JSON.parse(rxData.medications) : [];
          return medications.length > 0;
        } catch { return false; }
      });
      setMedications(meds);
    }
    setMedsLoading(false);
  }, []);

  useEffect(() => { if (tab === "patients" || tab === "overview") loadPatients(); }, [tab, loadPatients]);
  useEffect(() => { if (tab === "vitals") loadVitals(); }, [tab, loadVitals]);
  useEffect(() => { if (tab === "medications") loadMedications(); }, [tab, loadMedications]);

  const filteredPatients = patients.filter(p => {
    if (!patientSearch) return true;
    const s = patientSearch.toLowerCase();
    return p.patient?.name?.toLowerCase().includes(s) || p.patient?.patientId?.toLowerCase().includes(s);
  });

  const deptName = profile?.name || "Nursing";

  return (
    <>
      <style>{nursingStyles}</style>

      {/* Navigation */}
      <div className="ns-nav">
        {([
          { id: "overview", label: "Overview", Icon: BarChart2 },
          { id: "patients", label: "Patient List", Icon: BedDouble },
          { id: "vitals", label: "Vitals", Icon: Activity },
          { id: "medications", label: "Medications", Icon: Pill },
          { id: "notes", label: "Nursing Notes", Icon: FileText },
          { id: "alerts", label: "Alerts", Icon: Bell },
        ] as const).map(t => (
          <button key={t.id} className={`ns-nav-btn${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            <t.Icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="ns-section">
          <div className="ns-stats-grid">
            <div className="ns-stat-card">
              <div className="ns-stat-icon" style={{ background: LIGHT_BG }}><BedDouble size={18} color={ACCENT} /></div>
              <div className="ns-stat-info">
                <div className="ns-stat-value">{patients.length}</div>
                <div className="ns-stat-label">Assigned Patients</div>
              </div>
            </div>
            <div className="ns-stat-card">
              <div className="ns-stat-icon" style={{ background: "#f0fdf4" }}><Activity size={18} color="#16a34a" /></div>
              <div className="ns-stat-info">
                <div className="ns-stat-value">{vitals.length}</div>
                <div className="ns-stat-label">Vitals Recorded Today</div>
              </div>
            </div>
            <div className="ns-stat-card">
              <div className="ns-stat-icon" style={{ background: "#fff7ed" }}><Pill size={18} color="#ea580c" /></div>
              <div className="ns-stat-info">
                <div className="ns-stat-value">{medications.length}</div>
                <div className="ns-stat-label">Pending Medications</div>
              </div>
            </div>
            <div className="ns-stat-card">
              <div className="ns-stat-icon" style={{ background: "#fff5f5" }}><AlertTriangle size={18} color="#ef4444" /></div>
              <div className="ns-stat-info">
                <div className="ns-stat-value">{alerts.length}</div>
                <div className="ns-stat-label">Active Alerts</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ns-quick-grid">
            <button className="ns-quick-btn" onClick={() => setTab("patients")}>
              <BedDouble size={20} color={ACCENT} />
              <span>View Patient List</span>
            </button>
            <button className="ns-quick-btn" onClick={() => setTab("vitals")}>
              <Activity size={20} color="#16a34a" />
              <span>Record Vitals</span>
            </button>
            <button className="ns-quick-btn" onClick={() => setTab("medications")}>
              <Pill size={20} color="#ea580c" />
              <span>Medication Schedule</span>
            </button>
            <button className="ns-quick-btn" onClick={() => setTab("notes")}>
              <FileText size={20} color="#6366f1" />
              <span>Add Nursing Notes</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Patient List ── */}
      {tab === "patients" && (
        <div className="ns-section">
          <div className="ns-toolbar">
            <div className="ns-search-wrap">
              <Search size={14} color="#94a3b8" />
              <input className="ns-search-input" placeholder="Search patients..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
            </div>
            <button className="ns-btn-ghost" onClick={loadPatients}><RefreshCw size={13} /> Refresh</button>
          </div>

          {patientsLoading ? (
            <div className="ns-loading"><Loader2 size={20} className="ns-spin" /> Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="ns-empty"><BedDouble size={32} color="#cbd5e1" /><div style={{ marginTop: 8 }}>No patients assigned</div></div>
          ) : (
            <div className="ns-patient-grid">
              {filteredPatients.map((p: any) => (
                <div key={p.id} className="ns-patient-card">
                  <div className="ns-patient-header">
                    <div className="ns-patient-avatar">{(p.patient?.name || "?")[0]}</div>
                    <div>
                      <div className="ns-patient-name">{p.patient?.name || "Unknown"}</div>
                      <div className="ns-patient-meta">{p.patient?.patientId} &middot; {p.patient?.gender || ""}</div>
                    </div>
                    <span className={`ns-badge ${p.status === "COMPLETED" ? "green" : "orange"}`}>{p.status || "Active"}</span>
                  </div>
                  <div className="ns-patient-details">
                    {p.doctor && <div className="ns-detail-row"><Stethoscope size={11} /> Dr. {p.doctor?.name}</div>}
                    {p.subDeptNote && <div className="ns-detail-row"><MessageSquare size={11} /> {p.subDeptNote}</div>}
                    {p.appointmentDate && <div className="ns-detail-row"><Calendar size={11} /> {new Date(p.appointmentDate).toLocaleDateString("en-IN")}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Vitals Monitoring ── */}
      {tab === "vitals" && (
        <div className="ns-section">
          <div className="ns-toolbar">
            <div className="ns-chart-title">Vitals Monitoring</div>
            <button className="ns-btn-primary" onClick={() => setShowVitalForm(true)}><Plus size={13} /> Record Vitals</button>
          </div>

          {vitalsLoading ? (
            <div className="ns-loading"><Loader2 size={20} className="ns-spin" /> Loading vitals...</div>
          ) : vitals.length === 0 ? (
            <div className="ns-empty">
              <Activity size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>No vitals recorded yet</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Use "Record Vitals" to start monitoring patient vitals</div>
            </div>
          ) : (
            <div className="ns-tbl-wrap">
              <table className="ns-tbl">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>BP</th>
                    <th>Pulse</th>
                    <th>Temp</th>
                    <th>SpO2</th>
                    <th>Recorded At</th>
                    <th>By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.map((v: any) => (
                    <tr key={v.id}>
                      <td><strong>{v.patient?.name || v.patientName || "—"}</strong></td>
                      <td>{v.bp || "—"}</td>
                      <td>{v.pulse || "—"}</td>
                      <td>{v.temperature ? `${v.temperature}°F` : "—"}</td>
                      <td>{v.spo2 ? `${v.spo2}%` : "—"}</td>
                      <td>{v.performedAt ? new Date(v.performedAt).toLocaleString("en-IN") : "—"}</td>
                      <td>{v.performedBy || "—"}</td>
                      <td>{v.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Medication Administration ── */}
      {tab === "medications" && (
        <div className="ns-section">
          <div className="ns-toolbar">
            <div className="ns-chart-title">Medication Administration</div>
            <button className="ns-btn-ghost" onClick={loadMedications}><RefreshCw size={13} /> Refresh</button>
          </div>

          {medsLoading ? (
            <div className="ns-loading"><Loader2 size={20} className="ns-spin" /> Loading medication schedule...</div>
          ) : medications.length === 0 ? (
            <div className="ns-empty">
              <Pill size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>No pending medications</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Medication schedules from doctor prescriptions will appear here</div>
            </div>
          ) : (
            <div className="ns-med-list">
              {medications.map((m: any, i: number) => {
                let meds: any[] = [];
                try { meds = m.prescription?.medications ? JSON.parse(m.prescription.medications) : (m.medications ? JSON.parse(m.medications) : []); } catch {}
                return (
                  <div key={m.id || i} className="ns-med-card">
                    <div className="ns-med-patient">
                      <User size={14} color={ACCENT} />
                      <strong>{m.patient?.name || "Unknown Patient"}</strong>
                      <span className="ns-badge blue">{m.patient?.patientId}</span>
                    </div>
                    {meds.length > 0 && (
                      <div className="ns-med-items">
                        {meds.map((med: any, j: number) => (
                          <div key={j} className="ns-med-item">
                            <Pill size={12} color="#64748b" />
                            <span className="ns-med-name">{med.name || med.medicine}</span>
                            <span className="ns-med-dose">{med.dosage || med.dose || ""}</span>
                            <span className="ns-med-freq">{med.frequency || ""}</span>
                            <button className="ns-med-btn given">Mark Given</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Nursing Notes ── */}
      {tab === "notes" && (
        <div className="ns-section">
          <div className="ns-toolbar">
            <div className="ns-chart-title">Nursing Notes</div>
            <button className="ns-btn-primary"><Plus size={13} /> Add Note</button>
          </div>
          <div className="ns-empty">
            <FileText size={32} color="#cbd5e1" />
            <div style={{ marginTop: 8 }}>Nursing notes feature</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Add daily observations and nursing notes for patients</div>
          </div>
        </div>
      )}

      {/* ── Alerts ── */}
      {tab === "alerts" && (
        <div className="ns-section">
          <div className="ns-toolbar">
            <div className="ns-chart-title">Alerts & Notifications</div>
          </div>
          {alerts.length === 0 ? (
            <div className="ns-empty">
              <Bell size={32} color="#cbd5e1" />
              <div style={{ marginTop: 8 }}>No active alerts</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Critical patient and missed medication alerts will appear here</div>
            </div>
          ) : (
            <div className="ns-alert-list">
              {alerts.map((a: any, i: number) => (
                <div key={i} className="ns-alert-item">
                  <AlertTriangle size={16} color="#ef4444" />
                  <span>{a.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const nursingStyles = `
  .ns-nav{display:flex;gap:0;padding:6px 0;margin-bottom:20px;border-bottom:2px solid #f1f5f9;flex-wrap:wrap}
  .ns-nav-btn{padding:9px 16px;border:none;background:none;color:#64748b;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;white-space:nowrap}
  .ns-nav-btn:hover{color:#334155;background:#f8fafc}
  .ns-nav-btn.on{color:${ACCENT};border-bottom-color:${ACCENT};background:${LIGHT_BG}}
  .ns-section{animation:nsFadeIn .2s ease}
  @keyframes nsFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  .ns-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px}
  .ns-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;transition:all .15s}
  .ns-stat-card:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(190,24,93,.08)}
  .ns-stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .ns-stat-info{min-width:0}
  .ns-stat-value{font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}
  .ns-stat-label{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px}
  .ns-quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
  .ns-quick-btn{display:flex;align-items:center;gap:10px;padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;cursor:pointer;font-size:13px;font-weight:600;color:#334155;transition:all .15s}
  .ns-quick-btn:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(190,24,93,.08);transform:translateY(-1px)}
  .ns-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}
  .ns-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:260px}
  .ns-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
  .ns-search-input::placeholder{color:#94a3b8}
  .ns-btn-primary{padding:9px 18px;border-radius:9px;border:none;background:${ACCENT};color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap}
  .ns-btn-primary:hover{opacity:.9;transform:translateY(-1px)}
  .ns-btn-ghost{padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px}
  .ns-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}
  .ns-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;white-space:nowrap}
  .ns-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
  .ns-badge.orange{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}
  .ns-badge.blue{background:${LIGHT_BG};color:${ACCENT};border:1px solid ${BORDER}}
  .ns-patient-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
  .ns-patient-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;transition:all .15s}
  .ns-patient-card:hover{border-color:${BORDER}}
  .ns-patient-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}
  .ns-patient-avatar{width:36px;height:36px;border-radius:10px;background:${LIGHT_BG};color:${ACCENT};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0}
  .ns-patient-name{font-size:14px;font-weight:700;color:#1e293b}
  .ns-patient-meta{font-size:11px;color:#94a3b8;margin-top:1px}
  .ns-patient-details{display:flex;flex-direction:column;gap:4px}
  .ns-detail-row{font-size:11px;color:#64748b;display:flex;align-items:center;gap:5px}
  .ns-chart-title{font-size:14px;font-weight:700;color:#1e293b}
  .ns-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
  .ns-tbl{width:100%;border-collapse:collapse}
  .ns-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
  .ns-tbl td{padding:12px 14px;font-size:12px;color:#475569;border-bottom:1px solid #fafbfc}
  .ns-tbl tr:last-child td{border-bottom:none}
  .ns-tbl tbody tr:hover td{background:#fafbfc}
  .ns-med-list{display:flex;flex-direction:column;gap:10px}
  .ns-med-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px}
  .ns-med-patient{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:13px;color:#1e293b}
  .ns-med-items{display:flex;flex-direction:column;gap:6px}
  .ns-med-item{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fafbfc;border:1px solid #f1f5f9;border-radius:8px;font-size:12px;color:#475569}
  .ns-med-name{font-weight:600;color:#1e293b;flex:1}
  .ns-med-dose{color:#64748b;font-size:11px}
  .ns-med-freq{color:#94a3b8;font-size:11px}
  .ns-med-btn{padding:4px 10px;border-radius:6px;border:1px solid #bbf7d0;background:#f0fdf4;color:#16a34a;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap}
  .ns-med-btn:hover{background:#dcfce7}
  .ns-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:13px}
  .ns-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:13px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;display:flex;flex-direction:column;align-items:center}
  .ns-alert-list{display:flex;flex-direction:column;gap:8px}
  .ns-alert-item{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#fff5f5;border:1px solid #fecaca;border-radius:10px;font-size:13px;color:#991b1b}
  @keyframes nsSpin{to{transform:rotate(360deg)}}
  .ns-spin{animation:nsSpin .7s linear infinite}
`;
