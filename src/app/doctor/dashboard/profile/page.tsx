"use client";

import { useState, useRef, useEffect } from "react";
import {
  User, Mail, Save, Loader2, CheckCircle, AlertCircle,
  Shield, Key, Camera, Stethoscope,
  FileText, CreditCard, Eye, EyeOff,
  Lock, Upload, ExternalLink, BadgeCheck,
} from "lucide-react";
import { useDoctorDashboard } from "../DoctorDashboardContext";

type UploadType = "profile" | "document" | "signature" | "stamp";

interface DocFieldProps {
  label: string;
  value: string | null;
  fieldKey: string;
  uploadType: UploadType;
  accept?: string;
  accent: string;
  uploading: string | null;
  onChange: (key: string, url: string) => void;
  onUploadStart: (key: string) => void;
  onUploadEnd: () => void;
  onError: (msg: string) => void;
}

function DocUploadField({ label, value, fieldKey, uploadType, accept = "image/*,.pdf", accent, uploading, onChange, onUploadStart, onUploadEnd, onError }: DocFieldProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadStart(fieldKey);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", uploadType);
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (data.success) onChange(fieldKey, data.data.url);
      else onError(data.message || "Upload failed");
    } catch { onError("Upload failed"); }
    finally { onUploadEnd(); }
  };

  const isUploading = uploading === fieldKey;
  const isImg = value && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(value);

  return (
    <div>
      <label style={{ display: "block", fontSize:10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${value ? accent + "60" : "#e2e8f0"}`, background: value ? accent + "08" : "#f8fafc", fontSize:11, color: value ? "#1e293b" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ? (isImg ? "Image uploaded ✓" : "Document uploaded ✓") : "No file uploaded"}
        </div>
        {value && (
          <a href={value} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", padding: "9px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", textDecoration: "none" }}>
            <ExternalLink size={13} />
          </a>
        )}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={isUploading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${accent}`, background: "#fff", color: accent, fontSize:11, fontWeight: 600, cursor: isUploading ? "default" : "pointer", whiteSpace: "nowrap" }}
        >
          {isUploading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={13} />}
          {isUploading ? "Uploading..." : value ? "Replace" : "Upload"}
        </button>
        <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={handleFile} />
      </div>
      {value && isImg && (
        <img src={value} alt={label} style={{ marginTop: 6, width: 80, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" }} />
      )}
    </div>
  );
}

export default function DoctorProfilePage() {
  const { doctor, setDoctor, accent, doctorName, deptName, initials, refreshDoctor } = useDoctorDashboard();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", phone: "", gender: "", specialization: "", qualification: "",
    experience: "", consultationFee: "", followUpFee: "", address: "",
    bloodGroup: "", dateOfBirth: "", registrationNo: "", licenseNo: "",
    isAvailable: true,
    profileImage: "" as string | null,
    agreementDoc: "" as string | null,
    govtIdCard: "" as string | null,
    signature: "" as string | null,
    hospitalStamp: "" as string | null,
  });

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
    if (doctor) {
      setForm({
        name: doctor.name || "",
        phone: doctor.phone || "",
        gender: doctor.gender || "",
        specialization: doctor.specialization || "",
        qualification: doctor.qualification || "",
        experience: doctor.experience?.toString() || "0",
        consultationFee: doctor.consultationFee?.toString() || "0",
        followUpFee: doctor.followUpFee?.toString() || "",
        address: doctor.address || "",
        bloodGroup: doctor.bloodGroup || "",
        dateOfBirth: doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toISOString().split("T")[0] : "",
        registrationNo: doctor.registrationNo || "",
        licenseNo: doctor.licenseNo || "",
        isAvailable: doctor.isAvailable ?? true,
        profileImage: doctor.profileImage || null,
        agreementDoc: doctor.agreementDoc || null,
        govtIdCard: doctor.govtIdCard || null,
        signature: doctor.signature || null,
        hospitalStamp: doctor.hospitalStamp || null,
      });
    }
  }, [doctor]);

  const fld = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField("profileImage");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "profile");
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (data.success) setForm(f => ({ ...f, profileImage: data.data.url }));
      else setMessage({ type: "error", text: data.message || "Upload failed" });
    } catch { setMessage({ type: "error", text: "Upload failed" }); }
    finally { setUploadingField(null); }
  };

  const handleDocChange = (key: string, url: string) => setForm(f => ({ ...f, [key]: url }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload: any = {
        name: form.name,
        phone: form.phone || null,
        gender: form.gender || null,
        specialization: form.specialization || null,
        qualification: form.qualification || null,
        experience: parseInt(form.experience) || 0,
        consultationFee: parseFloat(form.consultationFee) || 0,
        followUpFee: form.followUpFee ? parseFloat(form.followUpFee) : null,
        address: form.address || null,
        bloodGroup: form.bloodGroup || null,
        dateOfBirth: form.dateOfBirth || null,
        registrationNo: form.registrationNo || null,
        licenseNo: form.licenseNo || null,
        isAvailable: form.isAvailable,
        profileImage: form.profileImage,
        agreementDoc: form.agreementDoc,
        govtIdCard: form.govtIdCard,
        signature: form.signature,
        hospitalStamp: form.hospitalStamp,
      };
      const res = await fetch("/api/doctors/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setDoctor({ ...doctor, ...data.data });
        await refreshDoctor();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch { setMessage({ type: "error", text: "Network error. Please try again." }); }
    finally { setSaving(false); }
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
    } catch { setCpMessage({ type: "error", text: "Network error." }); }
    finally { setCpSaving(false); }
  };

  const inputStyle = (ac = accent): React.CSSProperties => ({
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1.5px solid ${ac}30`, fontSize:12, color: "#1e293b",
    outline: "none", boxSizing: "border-box", background: "#fafafa",
  });

  const sectionCard = (borderColor = accent + "30"): React.CSSProperties => ({
    background: "#fff", borderRadius: 16, border: `1px solid ${borderColor}`,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 24, marginBottom: 20,
  });

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize:10, fontWeight: 600, color: "#64748b",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
  };

  const pw = getPasswordStrength(cpNew);
  const isUploadingPhoto = uploadingField === "profileImage";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 960, margin: "0 auto" }}>
      <style suppressHydrationWarning>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize:20, fontWeight: 800, color: "#1e293b", margin: 0 }}>My Profile</h2>
        <p style={{ fontSize:12, color: "#64748b", margin: "4px 0 0" }}>View and update your professional information</p>
      </div>

      {message && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, background: message.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: message.type === "success" ? "#059669" : "#dc2626" }}>
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize:12, fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
          {/* Left: Profile Photo Card */}
          <div>
            <div style={{ ...sectionCard(accent + "30"), padding: 0, overflow: "hidden" }}>
              <div style={{ background: `linear-gradient(135deg,${accent},#0ea5e9)`, padding: "28px 20px", textAlign: "center" }}>
                <div
                  onClick={!isUploadingPhoto ? () => photoRef.current?.click() : undefined}
                  style={{ width: 80, height: 80, borderRadius: 20, margin: "0 auto 12px", cursor: isUploadingPhoto ? "default" : "pointer", position: "relative", overflow: "hidden", background: form.profileImage ? "transparent" : "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize:26, fontWeight: 800, color: "#fff" }}
                >
                  {form.profileImage
                    ? <img src={form.profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials(form.name || doctorName)
                  }
                  {isUploadingPhoto && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Loader2 size={20} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: -4, right: -4, width: 26, height: 26, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
                    <Camera size={12} color={accent} />
                  </div>
                </div>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleProfilePhotoChange} />
                <div style={{ fontWeight: 800, fontSize:15, color: "#fff" }}>Dr. {form.name || doctorName}</div>
                <div style={{ fontSize:11, color: "#bae6fd", marginTop: 3 }}>{deptName}</div>
                {form.specialization && <div style={{ fontSize:10, color: "#7dd3fc", marginTop: 2 }}>{form.specialization}</div>}
              </div>
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize:10, color: "#94a3b8", textAlign: "center", margin: "0 0 12px" }}>
                  {isUploadingPhoto ? "Uploading..." : "Click avatar to change photo"}
                </p>
                {/* Quick Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: <Mail size={12} />, val: doctor?.email || doctor?.user?.email },
                    { icon: <Stethoscope size={12} />, val: form.specialization || "—" },
                    { icon: <BadgeCheck size={12} />, val: `${form.experience || 0} yrs experience` },
                    { icon: <CreditCard size={12} />, val: form.consultationFee ? `₹${form.consultationFee} fee` : "—" },
                  ].map((item, i) => item.val ? (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize:10, color: "#64748b" }}>
                      <span style={{ color: accent }}>{item.icon}</span>{item.val}
                    </div>
                  ) : null)}
                </div>
                {/* Availability Toggle */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize:11, fontWeight: 600, color: "#64748b" }}>Available for appointments</span>
                  <div
                    onClick={() => setForm(f => ({ ...f, isAvailable: !f.isAvailable }))}
                    style={{ width: 38, height: 22, borderRadius: 11, background: form.isAvailable ? accent : "#e2e8f0", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: form.isAvailable ? 19 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Read-only Info */}
            <div style={sectionCard(accent + "20")}>
              <h4 style={{ fontSize:11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>System Info</h4>
              {[
                { label: "Doctor ID", val: doctor?.doctorCode || "Not assigned" },
                { label: "User ID", val: doctor?.user?.userCode || (doctor?.userId ? "Not assigned" : "Not linked") },
                { label: "Credentials Sent", val: doctor?.credentialsSent ? "Yes" : "No" },
                { label: "Account Active", val: doctor?.isActive ? "Yes" : "No" },
                { label: "Joined", val: doctor?.createdAt ? new Date(doctor.createdAt).toLocaleDateString("en-IN") : "—" },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize:10, color: "#94a3b8" }}>{label}</span>
                  <span style={{
                    fontSize:10, fontWeight: 700,
                    color: (label === "Doctor ID" || label === "User ID") && val && val !== "Not assigned" && val !== "Not linked"
                      ? accent : "#475569",
                    background: (label === "Doctor ID" || label === "User ID") && val && val !== "Not assigned" && val !== "Not linked"
                      ? accent + "15" : "transparent",
                    padding: (label === "Doctor ID" || label === "User ID") && val && val !== "Not assigned" && val !== "Not linked"
                      ? "2px 8px" : "0",
                    borderRadius: 6,
                  }}>{val || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Forms */}
          <div>
            {/* Personal Information */}
            <div style={sectionCard(accent + "30")}>
              <h3 style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <User size={15} color={accent} />Personal Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" value={form.name} onChange={fld("name")} style={inputStyle()} placeholder="Dr. Full Name" required />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" value={form.phone} onChange={fld("phone")} style={inputStyle()} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select value={form.gender} onChange={fld("gender")} style={{ ...inputStyle(), cursor: "pointer" }}>
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={fld("dateOfBirth")} style={inputStyle()} />
                </div>
                <div>
                  <label style={labelStyle}>Blood Group</label>
                  <select value={form.bloodGroup} onChange={fld("bloodGroup")} style={{ ...inputStyle(), cursor: "pointer" }}>
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Address</label>
                  <textarea value={form.address} onChange={fld("address")} rows={2} style={{ ...inputStyle(), resize: "vertical" }} placeholder="Full address" />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div style={sectionCard(accent + "30")}>
              <h3 style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <Stethoscope size={15} color={accent} />Professional Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Specialization</label>
                  <input type="text" value={form.specialization} onChange={fld("specialization")} style={inputStyle()} placeholder="e.g. Cardiologist" />
                </div>
                <div>
                  <label style={labelStyle}>Experience (years)</label>
                  <input type="number" min="0" max="70" value={form.experience} onChange={fld("experience")} style={inputStyle()} placeholder="0" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Qualification</label>
                  <input type="text" value={form.qualification} onChange={fld("qualification")} style={inputStyle()} placeholder="e.g. MBBS, MD Cardiology" />
                </div>
                <div>
                  <label style={labelStyle}>Consultation Fee (₹)</label>
                  <input type="number" min="0" value={form.consultationFee} onChange={fld("consultationFee")} style={inputStyle()} placeholder="500" />
                </div>
                <div>
                  <label style={labelStyle}>Follow-up Fee (₹)</label>
                  <input type="number" min="0" value={form.followUpFee} onChange={fld("followUpFee")} style={inputStyle()} placeholder="200" />
                </div>
                <div>
                  <label style={labelStyle}>Registration No.</label>
                  <input type="text" value={form.registrationNo} onChange={fld("registrationNo")} style={inputStyle()} placeholder="MCI / State Reg No." />
                </div>
                <div>
                  <label style={labelStyle}>License No.</label>
                  <input type="text" value={form.licenseNo} onChange={fld("licenseNo")} style={inputStyle()} placeholder="License number" />
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input type="text" value={doctor?.department?.name || "—"} disabled style={{ ...inputStyle(), background: "#f1f5f9", color: "#94a3b8" }} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="text" value={doctor?.email || doctor?.user?.email || ""} disabled style={{ ...inputStyle(), background: "#f1f5f9", color: "#94a3b8" }} />
                </div>
              </div>
            </div>

            {/* Documents & Credentials */}
            <div style={sectionCard(accent + "30")}>
              <h3 style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={15} color={accent} />Documents & Credentials
              </h3>
              <div style={{ display: "grid", gap: 14 }}>
                <DocUploadField
                  label="Agreement Document"
                  value={form.agreementDoc}
                  fieldKey="agreementDoc"
                  uploadType="document"
                  accent={accent}
                  uploading={uploadingField}
                  onChange={handleDocChange}
                  onUploadStart={setUploadingField}
                  onUploadEnd={() => setUploadingField(null)}
                  onError={(m) => setMessage({ type: "error", text: m })}
                />
                <DocUploadField
                  label="Government ID Card"
                  value={form.govtIdCard}
                  fieldKey="govtIdCard"
                  uploadType="document"
                  accent={accent}
                  uploading={uploadingField}
                  onChange={handleDocChange}
                  onUploadStart={setUploadingField}
                  onUploadEnd={() => setUploadingField(null)}
                  onError={(m) => setMessage({ type: "error", text: m })}
                />
                <DocUploadField
                  label="Signature"
                  value={form.signature}
                  fieldKey="signature"
                  uploadType="signature"
                  accept="image/*"
                  accent={accent}
                  uploading={uploadingField}
                  onChange={handleDocChange}
                  onUploadStart={setUploadingField}
                  onUploadEnd={() => setUploadingField(null)}
                  onError={(m) => setMessage({ type: "error", text: m })}
                />
                <DocUploadField
                  label="Hospital Stamp"
                  value={form.hospitalStamp}
                  fieldKey="hospitalStamp"
                  uploadType="stamp"
                  accept="image/*"
                  accent={accent}
                  uploading={uploadingField}
                  onChange={handleDocChange}
                  onUploadStart={setUploadingField}
                  onUploadEnd={() => setUploadingField(null)}
                  onError={(m) => setMessage({ type: "error", text: m })}
                />
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: accent, color: "#fff", fontSize:13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.75 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: `0 4px 14px ${accent}40` }}
              >
                {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Saving...</> : <><Save size={16} />Save Profile</>}
              </button>
            </div>

            {/* Change Password */}
            <div style={sectionCard("#fef3c710")}>
              <h3 style={{ fontSize:13, fontWeight: 700, color: "#1e293b", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <Key size={15} color="#f59e0b" />Change Password
              </h3>
              <p style={{ fontSize:11, color: "#64748b", marginBottom: 18 }}>Update your login password.</p>

              {cpMessage && (
                <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, background: cpMessage.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${cpMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: cpMessage.type === "success" ? "#16a34a" : "#dc2626", fontSize:11, fontWeight: 500 }}>
                  {cpMessage.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {cpMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Current Password", val: cpOld, set: setCpOld, show: cpShowOld, toggleShow: setCpShowOld },
                    { label: "New Password", val: cpNew, set: setCpNew, show: cpShowNew, toggleShow: setCpShowNew },
                    { label: "Confirm Password", val: cpConfirm, set: setCpConfirm, show: cpShowConfirm, toggleShow: setCpShowConfirm },
                  ].map(({ label, val, set, show, toggleShow }) => (
                    <div key={label}>
                      <label style={labelStyle}>{label}</label>
                      <div style={{ position: "relative" }}>
                        <Lock size={13} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type={show ? "text" : "password"}
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder="••••••••"
                          style={{ width: "100%", padding: "10px 36px 10px 32px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, color: "#1e293b", outline: "none", boxSizing: "border-box", background: "#fafafa" }}
                        />
                        <button type="button" onClick={() => toggleShow(!show)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                          {show ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {cpNew && (
                  <div style={{ marginTop: 8, display: "flex", gap: 3 }}>
                    {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pw.score ? pw.color : "#e2e8f0" }} />)}
                  </div>
                )}
                {cpConfirm && cpNew && cpConfirm === cpNew && <p style={{ fontSize:10, color: "#10b981", fontWeight: 600, margin: "6px 0 0" }}>✓ Passwords match</p>}
                <div style={{ marginTop: 14 }}>
                  <button
                    type="submit"
                    disabled={cpSaving}
                    style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", fontSize:12, fontWeight: 600, cursor: cpSaving ? "not-allowed" : "pointer", opacity: cpSaving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}
                  >
                    {cpSaving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Updating...</> : <><Shield size={14} />Update Password</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
