"use client";
import { useEffect, useState } from "react";
import {
  Building2, Mail, Phone, User, Send, Check, Loader2, Save,
  ShieldCheck, AlertCircle, IndianRupee, KeyRound, RefreshCw
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

export default function FinanceDeptPanel() {
  const [dept, setDept]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [sending, setSending]   = useState(false);
  const [msg, setMsg]           = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm]         = useState({
    name: "Finance Department",
    hodName: "",
    hodEmail: "",
    hodPhone: "",
    isActive: true,
  });

  const load = async () => {
    setLoading(true);
    const d = await api("/api/config/finance");
    if (d.success && d.data) {
      setDept(d.data);
      setForm({
        name:     d.data.name     || "Finance Department",
        hodName:  d.data.hodName  || "",
        hodEmail: d.data.hodEmail || "",
        hodPhone: d.data.hodPhone || "",
        isActive: d.data.isActive ?? true,
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const d = await api("/api/config/finance", "POST", form);
    if (d.success) {
      setDept(d.data);
      setMsg({ text: "Finance department saved!", ok: true });
    } else {
      setMsg({ text: d.message || "Failed to save", ok: false });
    }
    setSaving(false);
  };

  const sendCredentials = async () => {
    if (!dept?.hodEmail && !form.hodEmail) {
      setMsg({ text: "Please set the HOD email first and save.", ok: false }); return;
    }
    // Save first if unsaved
    if (!dept) {
      const d = await api("/api/config/finance", "POST", form);
      if (!d.success) { setMsg({ text: d.message || "Save failed", ok: false }); return; }
      setDept(d.data);
    }
    setSending(true); setMsg(null);
    const d = await api("/api/config/finance/send-credentials", "POST", {});
    if (d.success) {
      setMsg({ text: "✓ Finance credentials sent to " + (dept?.hodEmail || form.hodEmail), ok: true });
      await load();
    } else {
      setMsg({ text: d.message || "Failed to send", ok: false });
    }
    setSending(false);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "#94a3b8", gap: 10 }}>
      <Loader2 size={20} style={{ animation: "spin .7s linear infinite" }} /> Loading finance department…
    </div>
  );

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg,#f59e0b,#b45309)",
        borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "#fff",
        display: "flex", alignItems: "center", gap: 20, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IndianRupee size={26} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", opacity: .75, marginBottom: 3 }}>Finance & Billing</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{form.name}</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 2 }}>Configure the Finance Department portal and manage login credentials</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, opacity: .7, marginBottom: 4 }}>Status</div>
          <span style={{ background: dept?.isActive ? "rgba(255,255,255,.25)" : "rgba(255,100,100,.3)", padding: "4px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
            {dept ? (dept.isActive ? "● Active" : "○ Inactive") : "Not Configured"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Left: Config Form */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={16} color="#f59e0b" /> Department Configuration
          </div>
          <form onSubmit={save}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="cfg-lbl">Department Name</label>
                <input className="cfg-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Finance Department" />
              </div>
              <div>
                <label className="cfg-lbl">HOD Name</label>
                <input className="cfg-input" value={form.hodName} onChange={e => setForm(f => ({ ...f, hodName: e.target.value }))} placeholder="Finance Head Name" />
              </div>
              <div>
                <label className="cfg-lbl">HOD Phone</label>
                <input className="cfg-input" value={form.hodPhone} onChange={e => setForm(f => ({ ...f, hodPhone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="cfg-lbl">HOD Email (used as login email) *</label>
                <input className="cfg-input" type="email" value={form.hodEmail} onChange={e => setForm(f => ({ ...f, hodEmail: e.target.value }))} placeholder="finance@hospital.com" required />
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>This email will be used to create the Finance Head login account</div>
              </div>
              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#f59e0b" }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>Department Active</span>
                </label>
              </div>
            </div>
            {msg && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13, fontWeight: 600, color: msg.ok ? "#16a34a" : "#ef4444" }}>
                {msg.ok ? <Check size={14} /> : <AlertCircle size={14} />} {msg.text}
              </div>
            )}
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <button type="submit" className="cfg-btn-primary" disabled={saving} style={{ background: "linear-gradient(135deg,#f59e0b,#b45309)" }}>
                {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={14} />}
                {dept ? "Update Department" : "Create Department"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Credentials Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <KeyRound size={15} color="#f59e0b" /> Login Credentials
            </div>
            {dept ? (
              <div>
                {dept.hodEmail && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", marginBottom: 6 }}>LOGIN EMAIL</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                      <Mail size={13} color="#f59e0b" /> {dept.hodEmail}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  {dept.credentialsSent ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 12, fontWeight: 700 }}>
                      <Check size={13} /> Credentials Sent
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c", fontSize: 12, fontWeight: 600 }}>
                      <AlertCircle size={13} /> Not Sent Yet
                    </span>
                  )}
                </div>
                {dept.loginEmail && (
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldCheck size={13} color="#10b981" /> Portal access active at <strong style={{ color: "#1e293b" }}>/finance/dashboard</strong>
                  </div>
                )}
                <button onClick={sendCredentials} disabled={sending} style={{
                  width: "100%", padding: "10px 16px", borderRadius: 10, border: "none",
                  background: dept.credentialsSent ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#f59e0b,#b45309)",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  boxShadow: "0 4px 12px rgba(245,158,11,.3)",
                }}>
                  {sending ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : dept.credentialsSent ? <RefreshCw size={14} /> : <Send size={14} />}
                  {sending ? "Sending…" : dept.credentialsSent ? "Resend Credentials" : "Send Credentials"}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
                <KeyRound size={32} color="#e2e8f0" style={{ marginBottom: 8 }} />
                <div>Save the department config first to manage credentials</div>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", marginBottom: 10 }}>How it works</div>
            {[
              "Configure dept name and HOD details",
              "Click Save to create the Finance Dept",
              'Click "Send Credentials" to email login',
              "Finance Head logs in at /finance/dashboard",
              "Access billing, payments, expenses & reports",
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#78350f", marginBottom: 7, alignItems: "flex-start" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#f59e0b", color: "#fff", fontWeight: 800, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
