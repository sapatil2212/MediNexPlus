"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IndianRupee, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export default function FinanceLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const role = data.data?.user?.role;
        if (role === "FINANCE_HEAD") router.push("/finance/dashboard");
        else if (role === "HOSPITAL_ADMIN") router.push("/finance/dashboard");
        else setError("You do not have Finance Department access.");
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#fffbeb 0%,#fef3c7 50%,#fde68a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp .4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#f59e0b,#b45309)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px rgba(245,158,11,.35)", marginBottom: 14 }}>
            <IndianRupee size={30} color="#fff" />
          </div>
          <div style={{ fontSize:22, fontWeight: 800, color: "#1e293b", letterSpacing: "-.5px" }}>Finance Portal</div>
          <div style={{ fontSize:12, color: "#78350f", marginTop: 4, fontWeight: 500 }}>Sign in to access billing & financial management</div>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 20px 60px rgba(245,158,11,.15)", border: "1px solid #fde68a" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="finance@hospital.com"
                autoComplete="email"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${error ? "#fecaca" : "#e2e8f0"}`, fontSize:13, outline: "none", color: "#1e293b", background: "#f8fafc", transition: "border-color .2s" }}
                onFocus={e => (e.target.style.borderColor = "#fcd34d")}
                onBlur={e => (e.target.style.borderColor = error ? "#fecaca" : "#e2e8f0")}
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ width: "100%", padding: "12px 42px 12px 14px", borderRadius: 10, border: `1.5px solid ${error ? "#fecaca" : "#e2e8f0"}`, fontSize:13, outline: "none", color: "#1e293b", background: "#f8fafc" }}
                  onFocus={e => (e.target.style.borderColor = "#fcd34d")}
                  onBlur={e => (e.target.style.borderColor = error ? "#fecaca" : "#e2e8f0")}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 9, background: "#fff5f5", border: "1px solid #fecaca", marginBottom: 18 }}>
                <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize:12, color: "#ef4444", fontWeight: 500 }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: 11, border: "none", background: loading ? "#fde68a" : "linear-gradient(135deg,#f59e0b,#b45309)", color: "#fff", fontSize:13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(245,158,11,.35)", transition: "opacity .2s" }}
            >
              {loading ? <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> : <ShieldCheck size={16} />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #fef3c7", textAlign: "center" }}>
            <div style={{ fontSize:11, color: "#94a3b8" }}>
              Login credentials are sent by the Hospital Admin.<br />Contact admin if you need access.
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize:11, color: "#b45309", opacity: .7 }}>
          Hospital Management System · Finance Department
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
