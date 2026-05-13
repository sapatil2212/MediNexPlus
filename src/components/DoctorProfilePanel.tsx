"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Save, Loader2, CheckCircle, AlertCircle,
  Shield, Key, Camera, ArrowLeft, Phone,
} from "lucide-react";

interface DoctorProfilePanelProps {
  doctor: any;
  onBack: () => void;
  onProfileUpdated?: (data: any) => void;
}

export default function DoctorProfilePanel({ doctor, onBack, onProfileUpdated }: DoctorProfilePanelProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: doctor?.name || "",
    email: doctor?.email || doctor?.user?.email || "",
    phone: doctor?.phone || "",
  });
  const [profilePhoto, setProfilePhoto] = useState<string | null>(doctor?.profileImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || "",
        email: doctor.email || doctor.user?.email || "",
        phone: doctor.phone || "",
      });
      setProfilePhoto(doctor.profileImage || null);
    }
  }, [doctor]);

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhoto(reader.result as string);
      reader.readAsDataURL(file);
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
        if (onProfileUpdated) onProfileUpdated(data.data);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const initials = (name: string) => name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  const doctorName = doctor?.name || "Doctor";
  const deptName = doctor?.department?.name || "General";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style suppressHydrationWarning>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 10,
            border: "1.5px solid #d1fae5",
            background: "#fff",
            color: "#64748b",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Account Settings</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Manage your profile information and security settings</p>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: message.type === "success" ? "#059669" : "#dc2626",
          }}
        >
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: 13, fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
        {/* Profile Card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #d1fae5", overflow: "hidden", boxShadow: "0 1px 4px rgba(16,185,129,0.04)" }}>
          <div style={{ background: "linear-gradient(135deg,#10b981,#0ea5e9)", padding: "28px 24px", textAlign: "center" }}>
            <div
              onClick={handlePhotoClick}
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: profilePhoto ? `url(${profilePhoto}) center/cover` : "rgba(255,255,255,.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
                color: "#fff",
                margin: "0 auto 12px",
                backdropFilter: "blur(4px)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {!profilePhoto && initials(doctorName)}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                <Camera size={24} color="#fff" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>Dr. {doctorName}</div>
            <div style={{ fontSize: 13, color: "#bae6fd", marginTop: 4 }}>{deptName}</div>
            {doctor?.specialization && (
              <div style={{ fontSize: 12, color: "#7dd3fc", marginTop: 2 }}>{doctor.specialization}</div>
            )}
          </div>
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 12, color: "#64748b", textAlign: "center", margin: 0 }}>
              Click the avatar to change your profile photo
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div>
          {/* Profile Information */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #d1fae5", boxShadow: "0 1px 4px rgba(16,185,129,0.04)", padding: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <User size={16} color="#10b981" />
              Profile Information
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    Full Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 10px 10px 40px",
                        borderRadius: 8,
                        border: "1.5px solid #d1fae5",
                        fontSize: 13,
                        color: "#1e293b",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 10px 10px 40px",
                        borderRadius: 8,
                        border: "1.5px solid #d1fae5",
                        fontSize: 13,
                        color: "#1e293b",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    Phone Number
                  </label>
                  <div style={{ position: "relative" }}>
                    <Phone size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 10px 10px 40px",
                        borderRadius: 8,
                        border: "1.5px solid #d1fae5",
                        fontSize: 13,
                        color: "#1e293b",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Section */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #d1fae5", boxShadow: "0 1px 4px rgba(16,185,129,0.04)", padding: 28, marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={16} color="#f59e0b" />
              Security
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
              Manage your password and account security settings.
            </p>
            <button
              onClick={() => router.push("/doctor/change-password")}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "1.5px solid #d1fae5",
                background: "#fff",
                color: "#64748b",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Key size={14} />
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
