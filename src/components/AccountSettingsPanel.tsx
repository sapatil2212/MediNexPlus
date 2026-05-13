"use client";

import { useEffect, useState, useRef } from "react";
import {
  Building2, User, Mail, Save, Loader2, CheckCircle, AlertCircle,
  Shield, Key, Camera, Lock, Eye, EyeOff, Phone, FileText, Palette,
} from "lucide-react";

interface Props {
  user: any;
}

export default function AccountSettingsPanel({ user: parentUser }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Department info state
  const [deptData, setDeptData] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", hodPhone: "", hodEmail: "", hodName: "" });
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptMessage, setDeptMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Change password state
  const [cpOld, setCpOld] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpShowOld, setCpShowOld] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);
  const [cpSaving, setCpSaving] = useState(false);
  const [cpMessage, setCpMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadUser = async () => {
    try {
      const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      const d = await r.json();
      if (!d.success) { setLoading(false); return; }
      setUserData(d.data);
      setFormData({ name: d.data.name || "", email: d.data.email || "" });
      setProfilePhoto(d.data.profilePhoto || null);
      if (d.data.role === "SUB_DEPT_HEAD") loadDeptProfile();
    } catch {} finally { setLoading(false); }
  };

  const loadDeptProfile = async () => {
    try {
      const r = await fetch("/api/subdept/me", { credentials: "include" });
      const d = await r.json();
      if (d.success) {
        setDeptData(d.data);
        setDeptForm({
          name: d.data.name || "",
          description: d.data.description || "",
          hodPhone: d.data.hodPhone || "",
          hodEmail: d.data.hodEmail || "",
          hodName: d.data.hodName || "",
        });
      }
    } catch {}
  };

  useEffect(() => { loadUser(); }, []);

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "profile");
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (data.success) {
        setProfilePhoto(data.data.url);
      } else {
        setMessage({ type: "error", text: data.message || "Upload failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = { name: formData.name.trim(), email: formData.email.trim(), profilePhoto: profilePhoto || null };
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        // Re-fetch fresh data from DB to confirm persistence
        await loadUser();
        window.dispatchEvent(new Event("profileUpdated"));
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    const colors = ["", "#ef4444", "#0E898F", "#0E898F", "#10b981", "#059669"];
    return { score, label: labels[score] || "", color: colors[score] || "" };
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpOld) { setCpMessage({ type: "error", text: "Current password is required" }); return; }
    if (cpNew.length < 8) { setCpMessage({ type: "error", text: "New password must be at least 8 characters" }); return; }
    if (cpNew !== cpConfirm) { setCpMessage({ type: "error", text: "Passwords do not match" }); return; }
    setCpSaving(true);
    setCpMessage(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword: cpOld, newPassword: cpNew, confirmPassword: cpConfirm }),
      });
      const data = await res.json();
      if (data.success) {
        setCpMessage({ type: "success", text: "Password changed successfully!" });
        setCpOld(""); setCpNew(""); setCpConfirm("");
      } else {
        setCpMessage({ type: "error", text: data.message || "Failed to change password" });
      }
    } catch {
      setCpMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setCpSaving(false);
    }
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptSaving(true);
    setDeptMessage(null);
    try {
      const res = await fetch("/api/subdept/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(deptForm),
      });
      const data = await res.json();
      if (data.success) {
        setDeptMessage({ type: "success", text: "Department information updated successfully!" });
        await loadDeptProfile();
      } else {
        setDeptMessage({ type: "error", text: data.message || "Failed to update department" });
      }
    } catch {
      setDeptMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setDeptSaving(false);
    }
  };

  const initials = (name: string) => name?.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "U";
  const u = userData || parentUser;

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Loader2 size={22} color="#0E898F" style={{ animation: "spin .7s linear infinite" }} />
        <span style={{ fontSize: 13, color: "#94a3b8" }}>Loading account settings...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 10px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>Account Settings</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Manage your personal profile, department information, and account security</p>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24, alignItems: "start" }}>
        
        {/* Left Column: Profile Summary & Security */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* User Info Card (Summary) */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 24, transition: "transform .2s, box-shadow .2s" }}
               onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
               onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
              <div
                onClick={!uploading ? handlePhotoClick : undefined}
                style={{
                  width: 100, height: 100, borderRadius: 20,
                  background: profilePhoto ? "transparent" : "linear-gradient(135deg, #0E898F, #0b7075)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 700, color: "#fff",
                  cursor: uploading ? "default" : "pointer",
                  position: "relative", boxShadow: "0 8px 24px rgba(14,137,143,0.2)",
                  overflow: "hidden", flexShrink: 0,
                }}
              >
                {profilePhoto
                  ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span>{initials(u?.name || "")}</span>
                }
                {uploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 size={24} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                )}
                <div style={{
                  position: "absolute", bottom: 0, right: 0, width: 32, height: 32,
                  borderRadius: "50%", background: "#0E898F",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "4px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}>
                  <Camera size={14} color="#fff" />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
              
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", letterSpacing: "-.01em" }}>{u?.name}</h2>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{u?.email}</p>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 100, background: "#E6F4F4", color: "#0E898F", fontSize: 11, fontWeight: 700 }}>
                    <Shield size={12} />Sub-Dept Head
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 100, background: "#f0fdf4", color: "#10b981", fontSize: 11, fontWeight: 700 }}>
                    <Building2 size={12} />{u?.hospital?.name || "Hospital"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Key size={18} color="#0E898F" />Account Security
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Choose a strong, unique password to protect your account</p>

            {cpMessage && (
              <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, background: cpMessage.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${cpMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: cpMessage.type === "success" ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 500 }}>
                {cpMessage.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {cpMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Current Password</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input type={cpShowOld ? "text" : "password"} value={cpOld} onChange={(e) => setCpOld(e.target.value)} placeholder="Enter current password" style={{ width: "100%", padding: "11px 40px 11px 38px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "border-color .15s" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    <button type="button" onClick={() => setCpShowOld(!cpShowOld)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                      {cpShowOld ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input type={cpShowNew ? "text" : "password"} value={cpNew} onChange={(e) => setCpNew(e.target.value)} placeholder="Choose a strong password" style={{ width: "100%", padding: "11px 40px 11px 38px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "border-color .15s" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    <button type="button" onClick={() => setCpShowNew(!cpShowNew)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                      {cpShowNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {cpNew && (() => { const s = getPasswordStrength(cpNew); return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>{[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= s.score ? s.color : "#e2e8f0" }} />)}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
                    </div>
                  )})()}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Confirm New Password</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input type={cpShowConfirm ? "text" : "password"} value={cpConfirm} onChange={(e) => setCpConfirm(e.target.value)} placeholder="Repeat your new password" style={{ width: "100%", padding: "11px 40px 11px 38px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "border-color .15s" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} />
                    <button type="button" onClick={() => setCpShowConfirm(!cpShowConfirm)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                      {cpShowConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <button type="submit" disabled={cpSaving} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#0E898F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: cpSaving ? "not-allowed" : "pointer", opacity: cpSaving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(14,137,143,0.2)", transition: "all .15s" }}>
                  {cpSaving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Updating...</> : <><Shield size={16} />Update Password</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Personal & Department Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Personal Settings Card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <User size={18} color="#0E898F" />Personal Information
            </h3>

            {message && (
              <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, background: message.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: message.type === "success" ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 500 }}>
                {message.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Full Name</label>
                  <div style={{ position: "relative" }}>
                    <User size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "11px 11px 11px 40px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "border-color .15s" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} placeholder="Enter your full name" required />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: "100%", padding: "11px 11px 11px 40px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none", boxSizing: "border-box", transition: "border-color .15s" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} placeholder="Enter your email address" required />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" disabled={saving} style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: "#0E898F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(14,137,143,0.25)", transition: "all .15s" }}>
                  {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Saving...</> : <><Save size={16} />Save Changes</>}
                </button>
              </div>
            </form>
          </div>

          {/* Department Information Card */}
          {(u?.role === "SUB_DEPT_HEAD" || deptData) && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                    <Building2 size={18} color="#0E898F" />Department Profile
                  </h3>
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Administrative details and contact information for your department</p>
                </div>
                {deptData && (
                  <span style={{ padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: deptData.isActive ? "#f0fdf4" : "#fef2f2", color: deptData.isActive ? "#16a34a" : "#dc2626", border: `1px solid ${deptData.isActive ? "#bbf7d0" : "#fecaca"}` }}>
                    {deptData.isActive ? "Active" : "Inactive"}
                  </span>
                )}
              </div>

              {deptMessage && (
                <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, background: deptMessage.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${deptMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: deptMessage.type === "success" ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 500 }}>
                  {deptMessage.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {deptMessage.text}
                </div>
              )}

              <form onSubmit={handleDeptSubmit}>
                <div style={{ display: "grid", gap: 20 }}>
                  
                  <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#0E898F,#0b7075)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(14,137,143,0.15)" }}>
                      <Building2 size={22} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Current Department</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{deptData?.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{deptData?.type?.replace(/_/g, " ")} · Code: <strong style={{ color: "#0E898F" }}>{deptData?.code}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Display Name</label>
                      <div style={{ position: "relative" }}>
                        <Building2 size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} style={{ width: "100%", padding: "11px 11px 11px 38px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color .15s" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} placeholder="Department display name" />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>HOD Name</label>
                      <div style={{ position: "relative" }}>
                        <User size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input value={deptForm.hodName} onChange={(e) => setDeptForm({ ...deptForm, hodName: e.target.value })} style={{ width: "100%", padding: "11px 11px 11px 38px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color .15s" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} placeholder="Head of Department name" />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Contact Phone</label>
                      <div style={{ position: "relative" }}>
                        <Phone size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input value={deptForm.hodPhone} onChange={(e) => setDeptForm({ ...deptForm, hodPhone: e.target.value })} style={{ width: "100%", padding: "11px 11px 11px 38px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color .15s" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} placeholder="Contact phone number" />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Contact Email</label>
                      <div style={{ position: "relative" }}>
                        <Mail size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input type="email" value={deptForm.hodEmail} onChange={(e) => setDeptForm({ ...deptForm, hodEmail: e.target.value })} style={{ width: "100%", padding: "11px 11px 11px 38px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color .15s" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} placeholder="HOD email address" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Department Description</label>
                    <div style={{ position: "relative" }}>
                      <FileText size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: 12 }} />
                      <textarea value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} rows={3} style={{ width: "100%", padding: "11px 11px 11px 38px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", transition: "border-color .15s", fontFamily: "inherit" }} onFocus={e => e.currentTarget.style.borderColor = "#0E898F"} onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"} placeholder="Brief description of the department and its services" />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" disabled={deptSaving} style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: "#0E898F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: deptSaving ? "not-allowed" : "pointer", opacity: deptSaving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(14,137,143,0.25)", transition: "all .15s" }}>
                    {deptSaving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Saving...</> : <><Save size={16} />Save Department Info</>}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
