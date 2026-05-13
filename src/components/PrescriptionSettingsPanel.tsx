"use client";
import { useEffect, useState, useRef } from "react";
import {
  FileText, Upload, Save, CheckCircle2, AlertCircle, Loader2,
  Image as ImageIcon, Trash2, Eye, Info, ExternalLink,
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

export default function PrescriptionSettingsPanel() {
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ t: "", c: "" });
  const [signature, setSignature] = useState<string | null>(null);

  const sigInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const d = await api("/api/doctor/me");
      if (d.success) {
        setDoctor(d.data);
        setSignature(d.data.signature || null);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "signature");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const d = await res.json();
      if (d.success) {
        setSignature(d.data.url);
        setMsg({ t: "Signature uploaded. Click Save to apply.", c: "s" });
      } else {
        setMsg({ t: d.message || "Upload failed", c: "e" });
      }
    } catch {
      setMsg({ t: "Upload error", c: "e" });
    }
    setSaving(false);
    if (e.target) e.target.value = "";
  };

  const saveSettings = async () => {
    setSaving(true);
    setMsg({ t: "", c: "" });
    const d = await api("/api/doctor/me", "PUT", { signature });
    if (d.success) {
      setMsg({ t: "Signature saved successfully", c: "s" });
    } else {
      setMsg({ t: d.message || "Failed to save", c: "e" });
    }
    setSaving(false);
  };

  const hs = doctor?.hospital?.settings;
  const letterhead = hs?.letterhead || null;
  const letterheadType = hs?.letterheadType || "IMAGE";

  if (loading) return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Loader2 size={24} style={{ animation: "spin .7s linear infinite", marginBottom: 10 }} />
      <div>Loading settings...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 40, animation: "fadeIn .4s ease-out" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", letterSpacing: "-.02em" }}>Prescription Format</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            Hospital letterhead is managed by admin. Upload your digital signature to appear on prescriptions.
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 24px",
            borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)",
            color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
            opacity: saving ? 0.7 : 1, transition: "transform .2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
        >
          {saving ? <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={16} />}
          Save Signature
        </button>
      </div>

      {msg.t && (
        <div style={{
          padding: "12px 16px", borderRadius: 12, marginBottom: 24,
          display: "flex", alignItems: "center", gap: 12,
          background: msg.c === "s" ? "#f0fdf4" : "#fff5f5",
          border: `1px solid ${msg.c === "s" ? "#bbf7d0" : "#fecaca"}`,
          color: msg.c === "s" ? "#166534" : "#991b1b",
          fontSize: 14, fontWeight: 500, animation: "fadeIn .3s ease-out",
        }}>
          {msg.c === "s" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.t}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Hospital Letterhead — read-only */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ color: "#0E898F" }}><FileText size={18} /></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Hospital Prescription Letterhead</div>
            </div>
            <div style={{ padding: 20 }}>
              {letterhead ? (
                <div>
                  {letterheadType === "IMAGE" ? (
                    <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
                      <img
                        src={letterhead}
                        alt="Letterhead"
                        style={{ width: "100%", display: "block", maxHeight: 200, objectFit: "cover", objectPosition: "top" }}
                      />
                    </div>
                  ) : (
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "16px 20px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                      <FileText size={20} color="#0E898F" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>PDF Letterhead configured</div>
                        <a
                          href={letterhead}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, color: "#0E898F", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}
                        >
                          <ExternalLink size={12} /> View PDF
                        </a>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>
                      Set by hospital admin · applied automatically to all printed prescriptions
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "18px 20px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Info size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 4 }}>No letterhead configured yet</div>
                    <p style={{ fontSize: 12, color: "#b45309", lineHeight: 1.6, margin: 0 }}>
                      Ask your hospital administrator to upload a letterhead under{" "}
                      <strong>Settings → Prescription Letterhead</strong>. Until then, prescriptions
                      will print with default hospital details in the header.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Doctor's Digital Signature */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ color: "#0E898F" }}><ImageIcon size={18} /></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Doctor&apos;s Digital Signature</div>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
                Your signature will appear at the bottom-right of every printed prescription on top of the hospital letterhead.
              </p>

              {signature ? (
                <div>
                  <div style={{
                    position: "relative", width: 280, height: 140, background: "#f8fafc",
                    borderRadius: 12, border: "1.5px solid #e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  }}>
                    <img
                      src={signature}
                      alt="Signature"
                      style={{ maxHeight: "80%", maxWidth: "80%", objectFit: "contain", mixBlendMode: "multiply" }}
                    />
                    <button
                      onClick={() => setSignature(null)}
                      style={{
                        position: "absolute", top: 8, right: 8, background: "#ef4444",
                        color: "#fff", border: "none", borderRadius: 6,
                        padding: "4px 8px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600,
                      }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                  <button
                    onClick={() => sigInputRef.current?.click()}
                    style={{
                      marginTop: 12, display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                      background: "#f8fafc", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <Upload size={14} /> Replace Signature
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => sigInputRef.current?.click()}
                  style={{
                    width: 280, height: 140, background: "#f8fafc", borderRadius: 12,
                    border: "1.5px dashed #cbd5e1",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 10, color: "#94a3b8", cursor: "pointer", transition: "border-color .2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#0E898F")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#cbd5e1")}
                >
                  <Upload size={28} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Click to Upload Signature</span>
                  <span style={{ fontSize: 11, color: "#cbd5e1" }}>PNG with transparent background preferred</span>
                </button>
              )}
              <input type="file" ref={sigInputRef} hidden onChange={handleSignatureUpload} accept="image/*" />
            </div>
          </div>
        </div>

        {/* Right column — Live Preview */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={18} color="#0E898F" />
            Live Preview
          </div>
          <LetterheadPreview
            doctor={doctor}
            signature={signature}
            letterhead={letterhead}
            letterheadType={letterheadType}
          />
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#E6F4F4", borderRadius: 12, border: "1px solid #B3E0E0", fontSize: 12, color: "#0E898F", lineHeight: 1.6 }}>
            <strong style={{ color: "#0c6e73" }}>Preview</strong> shows how your prescription letterhead + signature will look when printed.
          </div>
        </div>
      </div>
    </div>
  );
}

function LetterheadPreview({ doctor, signature, letterhead, letterheadType }: {
  doctor: any; signature: string | null; letterhead: string | null; letterheadType: string;
}) {
  const hs = doctor?.hospital?.settings;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 8,
      boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)",
      width: "100%",
      aspectRatio: "1 / 1.414",
      overflow: "hidden",
      position: "relative",
      fontSize: "7px",
      color: "#000",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Letterhead image as background */}
      {letterhead && letterheadType === "IMAGE" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: 0 }}>
          <img src={letterhead} alt="Letterhead" style={{ width: "100%", display: "block" }} />
        </div>
      )}

      {/* Default header when no letterhead */}
      {!letterhead && (
        <div style={{ padding: "12px 16px 8px", borderBottom: "1.5px solid #000", position: "relative", zIndex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "10px" }}>{hs?.hospitalName || doctor?.hospital?.name || "Hospital Name"}</div>
          <div style={{ fontSize: "6px", opacity: 0.7 }}>{hs?.address || "Hospital Address"}</div>
          <div style={{ fontSize: "6px", opacity: 0.7 }}>Ph: {hs?.phone || doctor?.hospital?.mobile || ""}</div>
        </div>
      )}

      {/* Content area */}
      <div style={{ flex: 1, padding: "16px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
        {/* Spacer for letterhead area */}
        {letterhead && letterheadType === "IMAGE" && <div style={{ height: "80px" }} />}

        {/* Doctor & patient strip */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6, borderBottom: "0.5px solid #e2e8f0", marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "8px" }}>Dr. {doctor?.name || "Doctor Name"}</div>
            <div style={{ fontSize: "5.5px", opacity: 0.7 }}>{doctor?.specialization || "Specialization"} · {doctor?.qualification || "Qualification"}</div>
            <div style={{ fontSize: "5.5px", opacity: 0.7 }}>Reg No: {doctor?.registrationNo || "—"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: "7px" }}>Patient: Sample Patient</div>
            <div style={{ fontSize: "5.5px", opacity: 0.7 }}>Date: {new Date().toLocaleDateString("en-IN")}</div>
          </div>
        </div>

        {/* Rx placeholder */}
        <div style={{ fontWeight: 800, fontSize: "11px", color: "#0E898F", marginBottom: 8 }}>Rx</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {["Medication 1 500mg — 1-0-1 · 5 Days", "Medication 2 10mg — Once daily · 7 Days"].map((m, i) => (
            <div key={i} style={{ padding: "3px 5px", background: "#f8fafc", borderRadius: 3, fontSize: "5.5px", fontWeight: 600 }}>{m}</div>
          ))}
        </div>

        {/* Signature at bottom */}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "0.5px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ textAlign: "center", minWidth: 60 }}>
            {signature ? (
              <img src={signature} style={{ height: 20, marginBottom: 3, mixBlendMode: "multiply", display: "block", margin: "0 auto 3px" }} alt="Sig" />
            ) : (
              <div style={{ height: 20, marginBottom: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "5px", color: "#94a3b8", fontStyle: "italic" }}>no signature</span>
              </div>
            )}
            <div style={{ borderTop: "1px solid #000", paddingTop: 3 }}>
              <div style={{ fontWeight: 800, fontSize: "7px" }}>Dr. {doctor?.name?.split(" ").pop() || "Doctor"}</div>
              <div style={{ fontSize: "5px", opacity: 0.6 }}>Digital Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
