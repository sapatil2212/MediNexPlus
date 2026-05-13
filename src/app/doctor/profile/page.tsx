"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, HelpCircle, LogOut, Search, Bell,
  Stethoscope, User, Mail, Save, Loader2, CheckCircle, AlertCircle,
  Shield, Key, ChevronDown, Camera, Building2, Settings,
} from "lucide-react";
import SupportModal from "@/components/SupportModal";

interface DoctorData {
  id: string;
  name: string;
  email?: string;
  specialization?: string;
  department?: { name: string };
  user?: { email: string };
}

export default function DoctorProfilePage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || d.data.role !== "DOCTOR") { router.push("/login"); return; }
        if (d.data.hospital?.name) setHospitalName(d.data.hospital.name);
        // Fetch doctor details
        fetch("/api/doctors/me", { credentials: "include" })
          .then(r => r.json())
          .then(doc => {
            if (doc.success) {
              setDoctor(doc.data);
              setFormData({ name: doc.data.name || "", email: doc.data.email || doc.data.user?.email || "", phone: "" });
            }
            setLoading(false);
          });
      })
      .catch(() => router.push("/login"));
  }, [router]);

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
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  const initials = (name: string) => name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <style suppressHydrationWarning>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const doctorName = doctor?.name || "Doctor";
  const deptName = doctor?.department?.name || "Department";

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f0fdf4}::-webkit-scrollbar-thumb{background:#86efac;border-radius:4px}
        input,select,button{font-family:'Inter',sans-serif}
        .doc{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f0fdf4}
        .doc-sb{width:220px;background:#fff;border-right:1px solid #d1fae5;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(16,185,129,0.04)}
        .doc-sb-logo{padding:20px 20px 16px;border-bottom:1px solid #ecfdf5;display:flex;align-items:center;gap:10px}
        .doc-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.3)}
        .doc-logo-tx{font-size:14px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
        .doc-logo-sub{font-size:10px;color:#94a3b8}
        .doc-nav{flex:1;padding:12px 12px;overflow-y:auto}
        .doc-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 6px}
        .doc-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left}
        .doc-nb:hover{background:#ecfdf5;color:#334155}
        .doc-sb-foot{padding:14px 16px 18px;border-top:1px solid #ecfdf5}
        .doc-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#ecfdf5;border:1px solid #d1fae5;margin-bottom:10px}
        .doc-av{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
        .doc-uname{font-size:11px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .doc-urole{font-size:10px;font-weight:500}
        .doc-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .doc-logout:hover{background:#fee2e2}
        .doc-main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .doc-topbar{height:64px;background:#fff;border-bottom:1px solid #d1fae5;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(16,185,129,0.04)}
        .doc-search-wrap{display:flex;align-items:center;gap:8px;background:#f0fdf4;border:1px solid #d1fae5;border-radius:10px;padding:8px 14px;width:280px}
        .doc-search{background:none;border:none;outline:none;font-size:12px;color:#334155;width:100%}
        .doc-search::placeholder{color:#94a3b8}
        .doc-tb-right{display:flex;align-items:center;gap:12px}
        .doc-notif{width:36px;height:36px;border-radius:10px;background:#f0fdf4;border:1px solid #d1fae5;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
        .doc-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#10b981;border:1.5px solid #fff}
        .doc-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#f0fdf4;border:1px solid #d1fae5;cursor:pointer}
        .doc-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#10b981,#0E898F);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff}
        .doc-profile-name{font-size:11px;font-weight:600;color:#1e293b}
        .doc-profile-role{font-size:10px;color:#059669}
        .doc-center{padding:32px 24px;overflow-y:auto;flex:1}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <div className="doc">
        {/* Sidebar */}
        <aside className="doc-sb">
          <div className="doc-sb-logo">
            <div className="doc-logo-ic"><Stethoscope size={18} color="white"/></div>
            <div><div className="doc-logo-tx">{hospitalName || "MediNexPlus"}</div><div className="doc-logo-sub">Doctor Portal</div></div>
          </div>
          <nav className="doc-nav">
            <div className="doc-nav-sec">Main</div>
            <button className="doc-nb" onClick={() => router.push("/doctor/dashboard")}>
              <span style={{color:"#94a3b8",display:"flex"}}><LayoutDashboard size={16}/></span>Dashboard
            </button>
            <button className="doc-nb" onClick={() => router.push("/doctor/dashboard")}>
              <span style={{color:"#94a3b8",display:"flex"}}><CalendarDays size={16}/></span>Appointments
            </button>
            <button className="doc-nb" onClick={() => router.push("/doctor/dashboard")}>
              <span style={{color:"#94a3b8",display:"flex"}}><Users size={16}/></span>Patients
            </button>
            <div className="doc-nav-sec">Settings</div>
            <button className="doc-nb" onClick={() => setSupportOpen(true)}><span style={{color:"#94a3b8",display:"flex"}}><HelpCircle size={16}/></span>Support</button>
          </nav>
          <div className="doc-sb-foot">
            <div className="doc-user">
              <div className="doc-av" style={{background:"linear-gradient(135deg,#10b981,#0E898F)"}}>{initials(doctorName)}</div>
              <div><div className="doc-uname">{doctorName}</div><div className="doc-urole" style={{color:"#059669"}}>Doctor · {deptName}</div></div>
            </div>
            <button className="doc-logout" onClick={logout}>
              <LogOut size={14}/>Log Out
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <div className="doc-main">
          <header className="doc-topbar">
            <div className="doc-search-wrap">
              <input className="doc-search" placeholder="Search..."/>
            </div>
            <div className="doc-tb-right">
              <div className="doc-notif"><Bell size={16} color="#64748b"/><span className="doc-notif-dot"/></div>
              <div className="doc-profile" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} style={{ position: "relative" }}>
                <div className="doc-profile-av">{initials(doctorName)}</div>
                <div><div className="doc-profile-name">{doctorName.split(" ")[0]}</div><div className="doc-profile-role">{deptName}</div></div>
                <ChevronDown size={14} color="#64748b" style={{ marginLeft: 6 }} />
                {profileDropdownOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setProfileDropdownOpen(false)} />
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 200, background: "#fff", borderRadius: 12, border: "1px solid #d1fae5", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", zIndex: 70, overflow: "hidden" }}>
                      <div style={{ padding: 16, borderBottom: "1px solid #ecfdf5" }}>
                        <div style={{ fontSize:13, fontWeight: 600, color: "#1e293b" }}>{doctorName}</div>
                        <div style={{ fontSize:11, color: "#64748b", marginTop: 2 }}>{doctor?.email || doctor?.user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button onClick={() => setProfileDropdownOpen(false)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "#ecfdf5", color: "#059669", fontSize:12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                          <Settings size={16} color="#059669" />Account Settings
                        </button>
                        <button onClick={() => { setProfileDropdownOpen(false); logout(); }} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#ef4444", fontSize:12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                          <LogOut size={16} color="#ef4444" />Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="doc-center">
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize:20, fontWeight: 800, color: "#0f172a" }}>My Profile</h1>
                <p style={{ fontSize:12, color: "#64748b", marginTop: 4 }}>Manage your account settings and personal information</p>
              </div>

              {/* User Info Card */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #d1fae5", boxShadow: "0 1px 4px rgba(16,185,129,0.04)", padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div onClick={handlePhotoClick} style={{ width: 80, height: 80, borderRadius: 16, background: profilePhoto ? `url(${profilePhoto}) center/cover` : "linear-gradient(135deg, #10b981, #0E898F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize:26, fontWeight: 700, color: "#fff", cursor: "pointer", position: "relative", boxShadow: "0 4px 12px rgba(16,185,129,0.25)" }}>
                    {!profilePhoto && initials(doctorName)}
                    <div style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                      <Camera size={12} color="#fff" />
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                  <div>
                    <h2 style={{ fontSize:17, fontWeight: 700, color: "#1e293b" }}>{doctorName}</h2>
                    <p style={{ fontSize:12, color: "#64748b", marginTop: 2 }}>{doctor?.email || doctor?.user?.email}</p>
                    <p style={{ fontSize:10, color: "#94a3b8", marginTop: 4 }}>Click on avatar to upload photo</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14, background: "#ecfdf5", color: "#059669", fontSize:10, fontWeight: 600 }}>
                        <Shield size={12} />Doctor
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14, background: "#E6F4F4", color: "#0E898F", fontSize:10, fontWeight: 600 }}>
                        <Building2 size={12} />{deptName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #d1fae5", boxShadow: "0 1px 4px rgba(16,185,129,0.04)", padding: 28 }}>
                <h3 style={{ fontSize:14, fontWeight: 700, color: "#1e293b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={16} color="#10b981" />Account Settings
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
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: 8, border: "1.5px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none" }} placeholder="Enter your full name" required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize:10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Email Address</label>
                      <div style={{ position: "relative" }}>
                        <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: 8, border: "1.5px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none" }} placeholder="Enter your email address" required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize:10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Phone Number</label>
                      <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d1fae5", fontSize:12, color: "#1e293b", outline: "none" }} placeholder="Enter your phone number" />
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <button type="submit" disabled={saving} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize:12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(16,185,129,0.25)" }}>
                      {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Saving...</> : <><Save size={16} />Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Section */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #d1fae5", boxShadow: "0 1px 4px rgba(16,185,129,0.04)", padding: 28, marginTop: 20 }}>
                <h3 style={{ fontSize:14, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <Key size={16} color="#f59e0b" />Security
                </h3>
                <p style={{ fontSize:12, color: "#64748b", marginBottom: 14 }}>Manage your password and account security settings.</p>
                <button onClick={() => router.push("/doctor/change-password")} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #d1fae5", background: "#fff", color: "#64748b", fontSize:11, fontWeight: 600, cursor: "pointer" }}>
                  Change Password
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
