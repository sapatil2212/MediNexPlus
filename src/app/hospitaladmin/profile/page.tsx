"use client";

import { useEffect, useState, useRef } from "react";
import {
  Building2,
  User, Mail, Save, Loader2, CheckCircle, AlertCircle,
  Shield, Key, Camera,
  Lock, Eye, EyeOff,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  hospitalId: string;
  profilePhoto?: string | null;
  hospital?: { name: string };
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change password state
  const [cpOld, setCpOld] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpShowOld, setCpShowOld] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);
  const [cpSaving, setCpSaving] = useState(false);
  const [cpMessage, setCpMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setUser(d.data);
        setFormData({ name: d.data.name || "", email: d.data.email || "" });
        setProfilePhoto(d.data.profilePhoto || null);
        setLoading(false);
      })
      .catch(() => {});
  }, []);

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
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: formData.name, email: formData.email, profilePhoto }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setUser((prev) => prev ? { ...prev, name: formData.name, email: formData.email, profilePhoto } : null);
        // Notify layout to refresh user data (updates navbar & sidebar photos)
        window.dispatchEvent(new Event("profileUpdated"));
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
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
    const colors = ["", "#ef4444", "#f59e0b", "#0E898F", "#10b981", "#059669"];
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

  const initials = (name: string) => name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <style suppressHydrationWarning>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="hd-center">
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              {/* Page Header */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize:20, fontWeight: 800, color: "#0f172a" }}>My Profile</h1>
                <p style={{ fontSize:12, color: "#64748b", marginTop: 4 }}>Manage your account settings and personal information</p>
              </div>

              {/* User Info Card */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    onClick={!uploading ? handlePhotoClick : undefined}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 16,
                      background: profilePhoto ? "transparent" : "linear-gradient(135deg, #0E898F, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize:26,
                      fontWeight: 700,
                      color: "#fff",
                      cursor: uploading ? "default" : "pointer",
                      position: "relative",
                      boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {profilePhoto
                      ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 16 }} />
                      : <span>{initials(user?.name || "")}</span>
                    }
                    {uploading && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16 }}>
                        <Loader2 size={20} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                      </div>
                    )}
                    <div style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#0E898F",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "3px solid #fff",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    }}>
                      <Camera size={12} color="#fff" />
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                  <div>
                    <h2 style={{ fontSize:17, fontWeight: 700, color: "#1e293b" }}>{user?.name}</h2>
                    <p style={{ fontSize:12, color: "#64748b", marginTop: 2 }}>{user?.email}</p>
                    <p style={{ fontSize:10, color: "#94a3b8", marginTop: 4 }}>{uploading ? "Uploading to Cloudinary..." : "Click avatar to upload photo"}</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14, background: "#E6F4F4", color: "#0E898F", fontSize:10, fontWeight: 600 }}>
                        <Shield size={12} />{user?.role?.replace("_", " ")}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14, background: "#f0fdf4", color: "#10b981", fontSize:10, fontWeight: 600 }}>
                        <Building2 size={12} />{user?.hospital?.name || "Hospital"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 28 }}>
                <h3 style={{ fontSize:14, fontWeight: 700, color: "#1e293b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={16} color="#0E898F" />Account Settings
                </h3>

                {message && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, background: message.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: message.type === "success" ? "#16a34a" : "#dc2626", fontSize:11, fontWeight: 500 }}>
                    {message.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize:10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Full Name</label>
                      <div style={{ position: "relative" }}>
                        <User size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, color: "#1e293b", outline: "none" }} placeholder="Enter your full name" required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize:10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Email Address</label>
                      <div style={{ position: "relative" }}>
                        <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, color: "#1e293b", outline: "none" }} placeholder="Enter your email address" required />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <button type="submit" disabled={saving} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0E898F", color: "#fff", fontSize:12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(59,130,246,0.25)" }}>
                      {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Saving...</> : <><Save size={16} />Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Change Password Section */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 28, marginTop: 20 }}>
                <h3 style={{ fontSize:14, fontWeight: 700, color: "#1e293b", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <Key size={16} color="#f59e0b" />Change Password
                </h3>
                <p style={{ fontSize:12, color: "#64748b", marginBottom: 20 }}>Update your account password. Choose a strong, unique password.</p>

                {cpMessage && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, background: cpMessage.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${cpMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: cpMessage.type === "success" ? "#16a34a" : "#dc2626", fontSize:11, fontWeight: 500 }}>
                    {cpMessage.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {cpMessage.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  <div style={{ display: "grid", gap: 14 }}>
                    {/* Current Password */}
                    <div>
                      <label style={{ display: "block", fontSize:10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Current Password</label>
                      <div style={{ position: "relative" }}>
                        <Lock size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type={cpShowOld ? "text" : "password"}
                          value={cpOld}
                          onChange={(e) => setCpOld(e.target.value)}
                          placeholder="Enter current password"
                          style={{ width: "100%", padding: "10px 40px 10px 38px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, color: "#1e293b", outline: "none", boxSizing: "border-box" }}
                        />
                        <button type="button" onClick={() => setCpShowOld(!cpShowOld)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                          {cpShowOld ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    {/* New Password */}
                    <div>
                      <label style={{ display: "block", fontSize:10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>New Password</label>
                      <div style={{ position: "relative" }}>
                        <Lock size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type={cpShowNew ? "text" : "password"}
                          value={cpNew}
                          onChange={(e) => setCpNew(e.target.value)}
                          placeholder="Choose a strong password"
                          style={{ width: "100%", padding: "10px 40px 10px 38px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, color: "#1e293b", outline: "none", boxSizing: "border-box" }}
                        />
                        <button type="button" onClick={() => setCpShowNew(!cpShowNew)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                          {cpShowNew ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {cpNew && (() => { const s = getPasswordStrength(cpNew); return (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>{[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= s.score ? s.color : "#e2e8f0" }} />)}</div>
                          <span style={{ fontSize:10, fontWeight: 600, color: s.color }}>{s.label}</span>
                        </div>
                      )})()}
                    </div>
                    {/* Confirm Password */}
                    <div>
                      <label style={{ display: "block", fontSize:10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Confirm New Password</label>
                      <div style={{ position: "relative" }}>
                        <Lock size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type={cpShowConfirm ? "text" : "password"}
                          value={cpConfirm}
                          onChange={(e) => setCpConfirm(e.target.value)}
                          placeholder="Repeat your new password"
                          style={{ width: "100%", padding: "10px 40px 10px 38px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, color: "#1e293b", outline: "none", boxSizing: "border-box" }}
                        />
                        <button type="button" onClick={() => setCpShowConfirm(!cpShowConfirm)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                          {cpShowConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {cpConfirm && cpNew && cpConfirm === cpNew && <span style={{ fontSize:10, color: "#10b981", fontWeight: 600, marginTop: 4, display: "block" }}>âœ“ Passwords match</span>}
                    </div>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <button type="submit" disabled={cpSaving} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", fontSize:12, fontWeight: 600, cursor: cpSaving ? "not-allowed" : "pointer", opacity: cpSaving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(245,158,11,0.25)" }}>
                      {cpSaving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Updating...</> : <><Shield size={16} />Update Password</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
    </main>
  );
}
