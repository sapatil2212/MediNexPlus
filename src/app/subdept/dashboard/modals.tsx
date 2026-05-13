"use client";
import * as React from "react";
import { X, Loader2, Save, ArrowRight, FileText, Pill, Activity } from "lucide-react";

// View Record Modal
export function ViewRecordModal({ record, onClose, meta }: any) {
  if (!record) return null;
  
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize:17, fontWeight: 800, color: "#1e293b" }}>Procedure Record Details</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Patient Information</div>
            <div style={{ fontSize:14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{record.patient?.name || "Unknown"}</div>
            <div style={{ fontSize:12, color: "#64748b" }}>{record.patient?.patientId} • {record.patient?.phone}</div>
            {record.patient?.email && <div style={{ fontSize:12, color: "#64748b" }}>{record.patient.email}</div>}
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Procedure Details</div>
            <div style={{ fontSize:14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{record.procedure?.name || "—"}</div>
            <div style={{ fontSize:12, color: "#64748b" }}>{record.procedure?.description || "No description"}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize:10, padding: "3px 9px", borderRadius: 100, background: `${meta.accent}18`, color: meta.accent, fontWeight: 700 }}>{record.procedure?.type || "—"}</span>
              {record.procedure?.duration && <span style={{ fontSize:10, color: "#94a3b8" }}>Duration: {record.procedure.duration} min</span>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Amount Charged</div>
              <div style={{ fontSize:22, fontWeight: 800, color: "#10b981" }}>₹{record.amount}</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Status</div>
              <div style={{ fontSize:12, fontWeight: 700, color: record.status === "COMPLETED" ? "#16a34a" : record.status === "CANCELLED" ? "#ef4444" : "#b45309" }}>{record.status.replace(/_/g, " ")}</div>
            </div>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Performed Details</div>
            <div style={{ fontSize:12, color: "#334155", marginBottom: 4 }}>
              <strong>Date:</strong> {new Date(record.performedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize:12, color: "#334155" }}>
              <strong>Performed By:</strong> {record.performedBy || "—"}
            </div>
          </div>

          {record.notes && (
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Notes</div>
              <div style={{ fontSize:12, color: "#334155", lineHeight: 1.6 }}>{record.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit Record Modal
export function EditRecordModal({ record, onClose, onSave, meta }: any) {
  const [form, setForm] = React.useState({
    amount: record?.amount?.toString() || "",
    performedBy: record?.performedBy || "",
    status: record?.status || "COMPLETED",
    notes: record?.notes || "",
  });
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(record.id, form);
    setSaving(false);
  };

  if (!record) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize:17, fontWeight: 800, color: "#1e293b" }}>Edit Procedure Record</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>

        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 12, marginBottom: 18, fontSize:11, color: "#0369a1" }}>
          <strong>{record.patient?.name}</strong> • {record.procedure?.name}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Amount (₹)</label>
              <input type="number" min="0" step="0.01" required
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize:12, color: "#1e293b", outline: "none" }}
                value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Status</label>
              <select
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize:12, color: "#1e293b", outline: "none" }}
                value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Performed By</label>
            <input type="text"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize:12, color: "#1e293b", outline: "none" }}
              placeholder="Technician/Staff name" value={form.performedBy} onChange={e => setForm(p => ({ ...p, performedBy: e.target.value }))} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Notes</label>
            <textarea rows={3}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize:12, color: "#1e293b", outline: "none", resize: "none", fontFamily: "Inter, sans-serif" }}
              placeholder="Additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={saving}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .5 : 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: meta.gradient, color: "#fff", fontSize:12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Transfer Patient Modal
export function TransferPatientModal({ record, subDepts, onClose, onTransfer, meta }: any) {
  const [form, setForm] = React.useState({ subDeptId: "", notes: "" });
  const [transferring, setTransferring] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subDeptId) return;
    setTransferring(true);
    await onTransfer(record, form);
    setTransferring(false);
  };

  if (!record) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize:17, fontWeight: 800, color: "#1e293b" }}>Transfer Patient</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 12, marginBottom: 18, fontSize:11, color: "#166534" }}>
          Transferring <strong>{record.patient?.name}</strong> to another sub-department for further procedures
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Transfer To Sub-Department *</label>
            <select required
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize:12, color: "#1e293b", outline: "none" }}
              value={form.subDeptId} onChange={e => setForm(p => ({ ...p, subDeptId: e.target.value }))}>
              <option value="">Select Sub-Department...</option>
              {subDepts.map((sd: any) => (
                <option key={sd.id} value={sd.id}>{sd.name} ({sd.type})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>Transfer Notes</label>
            <textarea rows={3}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "10px 13px", fontSize:12, color: "#1e293b", outline: "none", resize: "none", fontFamily: "Inter, sans-serif" }}
              placeholder="Reason for transfer, instructions for next department..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={transferring}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 600, cursor: transferring ? "not-allowed" : "pointer", opacity: transferring ? .5 : 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={transferring}
              style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "#10b981", color: "#fff", fontSize:12, fontWeight: 700, cursor: transferring ? "not-allowed" : "pointer", opacity: transferring ? .7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {transferring && <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />}
              <ArrowRight size={13} />
              {transferring ? "Transferring..." : "Transfer Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Prescription Modal
export function ViewPrescriptionModal({ appointment, onClose, meta }: any) {
  const [prescription, setPrescription] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [dlPdf, setDlPdf] = React.useState(false);
  const [lhSize, setLhSize] = React.useState<{w: number, h: number} | null>(null);
  const pdfRef = React.useRef<HTMLDivElement>(null);

  // Auto-detect letterhead image dimensions
  React.useEffect(() => {
    const s = prescription?.doctor?.hospital?.settings;
    if (!s?.letterhead || s?.letterheadType === "PDF") { setLhSize(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLhSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => setLhSize(null);
    img.src = s.letterhead;
  }, [prescription]);

  React.useEffect(() => {
    if (!appointment?.id) return;
    setLoading(true);

    const parseJ = (v: any, fb: any) => {
      if (!v) return fb;
      if (typeof v === "string") { try { return JSON.parse(v); } catch { return fb; } }
      return v;
    };
    const applyRx = (raw: any) => {
      const p = { ...raw };
      p.medications = parseJ(p.medications, []);
      p.labTests    = parseJ(p.labTests, []);
      p.vitals      = parseJ(p.vitals, {});
      p.icdCodes    = parseJ(p.icdCodes, []);
      p.referrals   = parseJ(p.referrals, []);
      return p;
    };

    const fetchFull = async (rxId: string) => {
      const d = await fetch(`/api/prescriptions/${rxId}`, { credentials: "include" }).then(r => r.json());
      return (d.success && d.data) ? applyRx(d.data) : null;
    };

    (async () => {
      try {
        // Step 1: try by appointment ID
        const d1 = await fetch(`/api/prescriptions/by-appointment/${appointment.id}`, { credentials: "include" }).then(r => r.json());
        if (d1.success && d1.data) { setPrescription(applyRx(d1.data)); setLoading(false); return; }

        // Step 2: fallback — fetch all prescriptions for this patient
        const pid = appointment.patientId || appointment.patient?.id;
        if (!pid) { setLoading(false); return; }

        const d2 = await fetch(`/api/prescriptions?patientId=${pid}&limit=50`, { credentials: "include" }).then(r => r.json());
        if (d2.success && d2.data?.data?.length > 0) {
          const list: any[] = d2.data.data;
          // Sort by closest to appointment date, else most recent
          const apptTime = appointment.appointmentDate ? new Date(appointment.appointmentDate).getTime() : 0;
          const sorted = [...list].sort((a, b) => {
            if (apptTime) {
              const da = Math.abs(new Date(a.createdAt).getTime() - apptTime);
              const db = Math.abs(new Date(b.createdAt).getTime() - apptTime);
              return da - db;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          // Fetch full details (includes doctor, hospital, settings relations)
          const full = await fetchFull(sorted[0].id);
          if (full) { setPrescription(full); setLoading(false); return; }
          // Fallback if full fetch failed — use list item (limited fields)
          setPrescription(applyRx(sorted[0]));
        }
      } catch {}
      setLoading(false);
    })();
  }, [appointment]);

  if (!appointment) return null;

  const meds  = Array.isArray(prescription?.medications) ? prescription.medications : [];
  const tests = Array.isArray(prescription?.labTests)    ? prescription.labTests    : [];
  const refs  = Array.isArray(prescription?.referrals)   ? prescription.referrals   : [];
  const vitals: any = prescription?.vitals || {};
  const hasVitals = Object.values(vitals).some((v: any) => v);

  const doctor  = prescription?.doctor;
  const patient = prescription?.patient;
  const h       = doctor?.hospital;
  const hs      = h?.settings;

  const patientAge = patient?.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000)
    : null;

  const hasLh = !!(hs?.letterhead && hs?.letterheadType !== "PDF");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.65)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Outer shell: close button + scrollable document */}
      <div style={{ width: "100%", maxWidth: 780, maxHeight: "94vh", display: "flex", flexDirection: "column", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,.35)" }}>

        {/* Toolbar */}
        <div style={{ background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", flexShrink: 0, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="#64748b" />
            <span style={{ fontSize:12, fontWeight: 700, color: "#1e293b" }}>Doctor&apos;s Prescription</span>
            {prescription?.prescriptionNo && (
              <span style={{ fontSize:10, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                {prescription.prescriptionNo}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={async () => {
                if (!prescription || !pdfRef.current) return;
                setDlPdf(true);
                try {
                  const html2canvas = (await import("html2canvas")).default;
                  const { jsPDF } = await import("jspdf");
                  const el = pdfRef.current;
                  const fname = `Rx_${prescription.prescriptionNo || appointment?.id || "document"}.pdf`;

                  if (hasLh && lhSize) {
                    // Multi-page: letterhead on every page
                    const saved = { pt: el.style.paddingTop, pb: el.style.paddingBottom, bi: el.style.backgroundImage };
                    el.style.paddingTop = "0px";
                    el.style.paddingBottom = "0px";
                    el.style.backgroundImage = "none";
                    const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: "#ffffff" });
                    el.style.paddingTop = saved.pt;
                    el.style.paddingBottom = saved.pb;
                    el.style.backgroundImage = saved.bi;

                    const pgW = 210;
                    const pgH = pgW * (lhSize.h / lhSize.w);
                    const topM = pgW * 0.16;
                    const botM = pgW * 0.13;
                    const cH = pgH - topM - botM;
                    const scaledH = (canvas.height * pgW) / canvas.width;

                    const lhUrl: string = await new Promise(r => {
                      const cv = document.createElement("canvas");
                      const im = new Image();
                      im.crossOrigin = "anonymous";
                      im.onload = () => { cv.width = im.naturalWidth; cv.height = im.naturalHeight; cv.getContext("2d")!.drawImage(im, 0, 0); r(cv.toDataURL("image/jpeg", 0.95)); };
                      im.onerror = () => r("");
                      im.src = hs!.letterhead;
                    });

                    // Smart page-break: scan for white rows to avoid cutting content
                    const findSafeCut = (tgt: number): number => {
                      const ctx = canvas.getContext("2d");
                      if (!ctx) return tgt;
                      const sL = Math.round(canvas.width * 0.1), sR = Math.round(canvas.width * 0.9);
                      const step = Math.max(1, Math.floor((sR - sL) / 40));
                      for (let y = Math.min(tgt, canvas.height - 1); y > Math.max(0, tgt - 250); y--) {
                        const row = ctx.getImageData(sL, y, sR - sL, 1).data;
                        let w = 0, t = 0;
                        for (let x = 0; x < (sR - sL) * 4; x += step * 4) { if (row[x] > 240 && row[x+1] > 240 && row[x+2] > 240) w++; t++; }
                        if (t > 0 && w / t > 0.95) return y;
                      }
                      return tgt;
                    };

                    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pgW, pgH] });
                    const pageHPx = Math.round((cH / scaledH) * canvas.height);
                    let cut = 0, pg = 0;
                    while (cut < canvas.height) {
                      if (pg > 0) pdf.addPage([pgW, pgH]);
                      if (lhUrl) pdf.addImage(lhUrl, "JPEG", 0, 0, pgW, pgH);
                      const rawEnd = Math.min(cut + pageHPx, canvas.height);
                      const safeCut = rawEnd >= canvas.height ? canvas.height : findSafeCut(rawEnd);
                      const srcHt = safeCut - cut;
                      if (srcHt <= 0) break;
                      const sc = document.createElement("canvas");
                      sc.width = canvas.width; sc.height = srcHt;
                      sc.getContext("2d")!.drawImage(canvas, 0, cut, canvas.width, srcHt, 0, 0, canvas.width, srcHt);
                      pdf.addImage(sc.toDataURL("image/jpeg", 0.95), "JPEG", 0, topM, pgW, (srcHt * pgW) / canvas.width);
                      cut = safeCut;
                      pg++;
                      if (pg > 20) break;
                    }
                    pdf.save(fname);
                  } else {
                    const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, logging: false });
                    const imgData = canvas.toDataURL("image/jpeg", 0.95);
                    const pdfW = 210;
                    const pdfH = (canvas.height * pdfW) / canvas.width;
                    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfW, pdfH] });
                    pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
                    pdf.save(fname);
                  }
                } catch (err) { console.error("PDF error:", err); }
                setDlPdf(false);
              }}
              disabled={dlPdf}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: dlPdf ? "#f0fdf4" : "#fff", color: dlPdf ? "#16a34a" : "#1e293b", fontSize:11, fontWeight: 700, cursor: dlPdf ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
              title="Download PDF"
            >
              {dlPdf ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={14} />}
              {dlPdf ? "Generating..." : "Download"}
            </button>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable prescription body */}
        <div style={{ background: "#f1f5f9", overflowY: "auto", flex: 1, padding: "24px 20px" }}>
          {loading ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <Loader2 size={36} color={meta.accent} style={{ animation: "spin .7s linear infinite", marginBottom: 14 }} />
              <div style={{ fontSize:12, color: "#94a3b8" }}>Loading prescription...</div>
            </div>
          ) : !prescription ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <FileText size={44} color="#cbd5e1" style={{ marginBottom: 14 }} />
              <div style={{ fontSize:14, fontWeight: 700, color: "#94a3b8" }}>No prescription found</div>
              <div style={{ fontSize:11, color: "#cbd5e1", marginTop: 6 }}>No prescription was found for this appointment or patient record</div>
            </div>
          ) : (
            /* ─── Prescription Document ──────────────── */
            <div ref={pdfRef} style={{ background: "#fff", borderRadius: 12, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", color: "#1a1a1a", fontSize: 11, lineHeight: 1.5, boxShadow: "0 2px 12px rgba(0,0,0,.08)", paddingTop: hasLh ? "16%" : 28, paddingBottom: hasLh ? "13%" : 28, paddingLeft: hasLh ? "5%" : 32, paddingRight: hasLh ? "5%" : 32 }}>

              {/* ── Header (only when no letterhead) ── */}
              {hasLh ? null : (
                /* Fallback — rendered header when no letterhead */
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2.5px solid #1e293b", paddingBottom: 14, marginBottom: 18, gap: 16 }}>
                  {hs?.logo && (
                    <img src={hs.logo} alt="Logo" style={{ height: 56, objectFit: "contain", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize:19, fontWeight: 800, color: "#0f172a", fontFamily: "Inter, sans-serif", letterSpacing: "-.02em" }}>
                      {hs?.hospitalName || h?.name || "Medical Center"}
                    </div>
                    {hs?.address && <div style={{ fontSize:10, color: "#475569", marginTop: 2 }}>{hs.address}</div>}
                    <div style={{ display: "flex", gap: 18, marginTop: 3, fontSize:10, color: "#475569" }}>
                      {(hs?.phone || h?.mobile) && <span>Tel: {hs?.phone || h?.mobile}</span>}
                      {hs?.email && <span>Email: {hs.email}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize:10, color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>Prescription No.</div>
                    <div style={{ fontSize:13, fontWeight: 800, color: "#1e293b", fontFamily: "Inter, sans-serif" }}>{prescription.prescriptionNo || "—"}</div>
                    <div style={{ fontSize:10, color: "#64748b", marginTop: 4 }}>
                      {new Date(prescription.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Doctor + Patient ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16, padding: "10px 0", borderBottom: "1px solid #eee" }}>
                <div>
                  <div style={{ fontSize: "12pt", fontWeight: 800 }}>Dr. {doctor?.name}</div>
                  <div style={{ fontSize: "9pt", color: "#000", fontWeight: 600 }}>{doctor?.specialization}</div>
                  {doctor?.qualification && <div style={{ fontSize: "9pt", color: "#444" }}>{doctor.qualification}</div>}
                  <div style={{ fontSize: "9pt", color: "#666" }}>Reg No: {doctor?.registrationNo || "—"}</div>
                  {doctor?.department?.name && <div style={{ fontSize: "9pt", color: "#666" }}>Dept: {doctor.department.name}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "10pt" }}>Patient: {patient?.name}</div>
                  <div style={{ fontSize: "9pt" }}>
                    ID: {patient?.patientId}
                    {patient?.gender && ` | ${patient.gender}`}
                    {patientAge !== null && ` | ${patientAge} yrs`}
                  </div>
                  {patient?.phone && <div style={{ fontSize: "9pt", color: "#666" }}>Ph: {patient.phone}</div>}
                  {patient?.bloodGroup && <div style={{ fontSize: "9pt", color: "#666" }}>Blood: {patient.bloodGroup}</div>}
                  <div style={{ fontSize: "9pt", fontWeight: 600, marginTop: 4 }}>Date: {new Date(prescription.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  <div style={{ fontSize: "9pt", fontWeight: 600 }}>Rx No: {prescription.prescriptionNo || "—"}</div>
                </div>
              </div>

              {/* ── Vitals ── */}
              {hasVitals && (
                <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 14 }}>
                  {[["BP", vitals.bp], ["Pulse", vitals.pulse], ["Temp", vitals.temp], ["Weight", vitals.weight], ["Height", vitals.height], ["SpO2", vitals.spo2], ["RR", vitals.rr || vitals.respiratoryRate]].map(([k, v]) => v ? (
                    <div key={k}>
                      <span style={{ fontSize:8, fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>{k}: </span>
                      <span style={{ fontSize:9, fontWeight: 600 }}>{v}</span>
                    </div>
                  ) : null)}
                </div>
              )}

              {/* ── Chief Complaint + Diagnosis (side by side) ── */}
              {(prescription.chiefComplaint || prescription.diagnosis) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                  <div>
                    {prescription.chiefComplaint && (
                      <>
                        <div style={{ fontSize:9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#475569", marginBottom: 2 }}>Chief Complaint</div>
                        <div style={{ whiteSpace: "pre-wrap", fontSize:10, color: "#1e293b" }}>{prescription.chiefComplaint}</div>
                      </>
                    )}
                  </div>
                  <div>
                    {prescription.diagnosis && (
                      <>
                        <div style={{ fontSize:9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#475569", marginBottom: 2 }}>Diagnosis</div>
                        <div>
                          <span style={{ fontSize:10, fontWeight: 700 }}>{prescription.diagnosis}</span>
                          {Array.isArray(prescription.icdCodes) && prescription.icdCodes.length > 0 && (
                            <div style={{ fontSize:9, color: "#64748b", marginTop: 2 }}>(ICD: {prescription.icdCodes.join(", ")})</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Medications (Rx) ── */}
              {meds.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize:13, marginBottom: 8, borderBottom: "1.5px solid #000", paddingBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize:15, fontStyle: "italic" }}>Rx</span>
                    <span style={{ fontSize:9, fontWeight: 600, color: "#64748b" }}>Medications</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize:9 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #000" }}>
                        {["Medication", "Dosage", "Frequency", "Duration", "Route"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "4px 6px", fontSize:8, textTransform: "uppercase", letterSpacing: ".04em", color: "#475569", fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {meds.map((m: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "5px 6px" }}>
                            <div style={{ fontWeight: 700, fontSize:10 }}>{m.name}</div>
                            {m.instructions && <div style={{ fontSize:8, color: "#64748b", marginTop: 1 }}>{m.instructions}</div>}
                          </td>
                          <td style={{ padding: "5px 6px", fontSize:9 }}>{m.dosage || "—"}</td>
                          <td style={{ padding: "5px 6px", fontSize:9 }}>{m.frequency || "—"}</td>
                          <td style={{ padding: "5px 6px", fontSize:9, whiteSpace: "nowrap" }}>{m.duration || "—"}</td>
                          <td style={{ padding: "5px 6px", fontSize:9, color: "#555", whiteSpace: "nowrap" }}>{m.route || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Investigations ── */}
              {tests.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize:9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4, color: "#475569" }}>Investigations</div>
                  {tests.map((t: any, i: number) => (
                    <div key={i} style={{ fontSize: 9, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                      {t.urgency && <span style={{ fontSize:8, color: "#64748b", marginLeft: 5 }}>({t.urgency})</span>}
                      {t.notes && <span style={{ fontSize:8, color: "#64748b" }}> — {t.notes}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Advice ── */}
              {prescription.advice && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize:9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2, color: "#475569" }}>Advice</div>
                  <div style={{ fontSize:9, whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#1e293b" }}>{prescription.advice}</div>
                </div>
              )}

              {/* ── Follow-up ── */}
              {prescription.followUpDate && (
                <div style={{ marginBottom: 10, fontSize: 9 }}>
                  <span style={{ fontWeight: 700, color: "#475569" }}>Next Follow-up: </span>
                  <span style={{ fontWeight: 600 }}>{new Date(prescription.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                  {prescription.followUpNotes && <span style={{ color: "#64748b" }}> — {prescription.followUpNotes}</span>}
                </div>
              )}

              {/* ── Doctor’s Notes ── */}
              {prescription.doctorNotes && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize:9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2, color: "#475569" }}>Doctor&apos;s Notes</div>
                  <div style={{ fontSize:9, whiteSpace: "pre-wrap", color: "#1e293b" }}>{prescription.doctorNotes}</div>
                </div>
              )}

              {/* ── Signature ── */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, marginTop: 10, paddingBottom: 8 }}>
                <div style={{ textAlign: "center", minWidth: 160, maxWidth: 220 }}>
                  <div style={{ height: 90, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 4 }}>
                    {doctor?.signature && (
                      <img src={doctor.signature} alt="Doctor Signature" style={{ maxHeight: 85, maxWidth: 200, objectFit: "contain", mixBlendMode: "multiply", display: "block" }} />
                    )}
                  </div>
                  <div style={{ borderTop: "1.5px solid #000", paddingTop: 5 }}>
                    <div style={{ fontWeight: 700, fontSize: 11 }}>Dr. {doctor?.name}</div>
                    {doctor?.specialization && <div style={{ fontSize: 9, color: "#475569" }}>{doctor.specialization}</div>}
                    <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>Digital Signature</div>
                  </div>
                </div>
              </div>

              {/* ── Document Footer (no letterhead only) ── */}
              {!hasLh && (
                <div style={{ paddingTop: 10, borderTop: "1px solid #f1f5f9", fontSize:9, color: "#94a3b8", textAlign: "center", marginTop: 16 }}>
                  This is a computer-generated prescription. Issued on {new Date(prescription.createdAt || Date.now()).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

