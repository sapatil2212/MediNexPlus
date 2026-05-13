"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, HelpCircle, LogOut, Search, Bell,
  User, Mail, Save, Loader2, CheckCircle, AlertCircle,
  Shield, Key, ChevronDown, Camera, Building2, Settings, Heart,
} from "lucide-react";
import SupportModal from "@/components/SupportModal";

interface StaffData {
  id: string;
  name: string;
  email: string;
  role: string;
  hospital?: { name: string };
}

export default function StaffProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !["STAFF", "RECEPTIONIST"].includes(d.data.role)) { router.push("/login"); return; }
        setUser(d.data);
        setFormData({ name: d.data.name || "", email: d.data.email || "", phone: "" });
        if (d.data.profilePhoto) setProfilePhoto(d.data.profilePhoto);
        setLoading(false);
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
        setUser((prev) => prev ? { ...prev, name: formData.name, email: formData.email } : null);
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
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <style suppressHydrationWarning>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748b" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        input,select,button{font-family:'Inter',sans-serif}
        .sd{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f8fafc}
        .sd-sb{width:220px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(0,0,0,0.04)}
        .sd-sb-logo{padding:20px 20px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px}
        .sd-logo-ic{width:36px;height:36px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.3)}
        .sd-logo-tx{font-size:15px;font-weight:800;color:#1e293b;letter-spacing:-.02em}
        .sd-logo-sub{font-size:10px;color:#94a3b8}
        .sd-nav{flex:1;padding:12px 12px;overflow-y:auto}
        .sd-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:14px 0 6px}
        .sd-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left}
        .sd-nb:hover{background:#f8fafc;color:#334155}
        .sd-sb-foot{padding:14px 16px 18px;border-top:1px solid #f1f5f9}
        .sd-user{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:10px}
        .sd-av{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#10b981,#0E898F);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
        .sd-uname{font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .sd-urole{font-size:10px;font-weight:500;color:#10b981}
        .sd-logout{width:100%;padding:8px;border-radius:9px;background:#fff5f5;border:1px solid #fee2e2;color:#ef4444;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .15s}
        .sd-logout:hover{background:#fee2e2}
        .sd-main{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh}
        .sd-topbar{height:64px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:40;box-shadow:0 1px 4px rgba(0,0,0,0.04)}
        .sd-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:280px}
        .sd-search{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}
        .sd-search::placeholder{color:#94a3b8}
        .sd-tb-right{display:flex;align-items:center;gap:12px}
        .sd-notif{width:36px;height:36px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
        .sd-notif-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:#10b981;border:1.5px solid #fff}
        .sd-profile{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer}
        .sd-profile-av{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#10b981,#0E898F);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
        .sd-profile-name{font-size:12px;font-weight:600;color:#1e293b}
        .sd-profile-role{font-size:10px;color:#10b981}
        .sd-center{padding:32px 24px;overflow-y:auto;flex:1}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
      <div className="sd">
        {/* Sidebar */}
        <aside className="sd-sb">
          <div className="sd-sb-logo">
            <div className="sd-logo-ic"><Heart size={18} color="white"/></div>
            <div><div className="sd-logo-tx">MediCare+</div><div className="sd-logo-sub">Staff Portal</div></div>
          </div>
          <nav className="sd-nav">
            <div className="sd-nav-sec">Main</div>
            <button className="sd-nb" onClick={() => router.push("/staff/dashboard")}>
              <span style={{color:"#94a3b8",display:"flex"}}><LayoutDashboard size={16}/></span>Dashboard
            </button>
            <button className="sd-nb" onClick={() => router.push("/staff/dashboard")}>
              <span style={{color:"#94a3b8",display:"flex"}}><CalendarDays size={16}/></span>Appointments
            </button>
            <button className="sd-nb" onClick={() => router.push("/staff/dashboard")}>
              <span style={{color:"#94a3b8",display:"flex"}}><Users size={16}/></span>Patients
            </button>
            <div className="sd-nav-sec">Settings</div>
            <button className="sd-nb" onClick={() => setSupportOpen(true)}><span style={{color:"#94a3b8",display:"flex"}}><HelpCircle size={16}/></span>Support</button>
          </nav>
          <div className="sd-sb-foot">
            <div className="sd-user">
              <div className="sd-av">{initials(user?.name || "")}</div>
              <div><div className="sd-uname">{user?.name}</div><div className="sd-urole">{user?.role?.replace("_", " ")}</div></div>
            </div>
            <button className="sd-logout" onClick={logout}>
              <LogOut size={14}/>Log Out
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <div className="sd-main">
          <header className="sd-topbar">
            <div className="sd-search-wrap">
              <Search size={14} color="#94a3b8"/>
              <input className="sd-search" placeholder="Search..."/>
            </div>
            <div className="sd-tb-right">
              <div className="sd-notif"><Bell size={16} color="#64748b"/><span className="sd-notif-dot"/></div>
              <div className="sd-profile" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} style={{ position: "relative" }}>
                <div className="sd-profile-av">{initials(user?.name || "")}</div>
                <div><div className="sd-profile-name">{user?.name?.split(" ")[0]}</div><div className="sd-profile-role">{user?.role?.replace("_", " ")}</div></div>
                <ChevronDown size={14} color="#64748b" style={{ marginLeft: 6 }} />
                {profileDropdownOpen && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setProfileDropdownOpen(false)} />
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 200, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", zIndex: 70, overflow: "hidden" }}>
                      <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{user?.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button onClick={() => setProfileDropdownOpen(false)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "#f0fdf4", color: "#059669", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                          <Settings size={16} color="#059669" />Account Settings
                        </button>
                        <button onClick={() => { setProfileDropdownOpen(false); logout(); }} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                          <LogOut size={16} color="#ef4444" />Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="sd-center">
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>My Profile</h1>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Manage your account settings and personal information</p>
              </div>

              {/* User Info Card */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div onClick={handlePhotoClick} style={{ width: 80, height: 80, borderRadius: 16, background: profilePhoto ? `url(${profilePhoto}) center/cover` : "linear-gradient(135deg, #10b981, #0E898F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", cursor: "pointer", position: "relative", boxShadow: "0 4px 12px rgba(16,185,129,0.25)" }}>
                    {!profilePhoto && initials(user?.name || "")}
                    <div style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                      <Camera size={12} color="#fff" />
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{user?.name}</h2>
                    <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{user?.email}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Click on avatar to upload photo</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14, background: "#f0fdf4", color: "#059669", fontSize: 11, fontWeight: 600 }}>
                        <Shield size={12} />{user?.role?.replace("_", " ")}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 14, background: "#E6F4F4", color: "#0E898F", fontSize: 11, fontWeight: 600 }}>
                        <Building2 size={12} />{user?.hospital?.name || "Hospital"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  <User size={16} color="#10b981" />Account Settings
                </h3>

                {message && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, background: message.type === "success" ? "#f0fdf4" : "#fef2f2", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`, color: message.type === "success" ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 500 }}>
                    {message.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Full Name</label>
                      <div style={{ position: "relative" }}>
                        <User size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none" }} placeholder="Enter your full name" required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Email Address</label>
                      <div style={{ position: "relative" }}>
                        <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none" }} placeholder="Enter your email address" required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Phone Number</label>
                      <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", outline: "none" }} placeholder="Enter your phone number" />
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <button type="submit" disabled={saving} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(16,185,129,0.25)" }}>
                      {saving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Saving...</> : <><Save size={16} />Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Section */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: 28, marginTop: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <Key size={16} color="#f59e0b" />Security
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Manage your password and account security settings.</p>
                <button onClick={() => router.push("/staff/change-password")} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
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
