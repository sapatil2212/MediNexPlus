"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Stethoscope } from "lucide-react";

export default function SubDeptLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/subdept/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        // Fetch subdept profile to get name for slug-based URL
        try {
          const prof = await fetch("/api/subdept/me", { credentials: "include" }).then(r => r.json());
          if (prof.success && prof.data?.name) {
            const slug = (prof.data.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "dept";
            router.push(`/subdept/${slug}/dashboard`);
          } else {
            router.push("/subdept/dashboard");
          }
        } catch {
          router.push("/subdept/dashboard");
        }
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sl-spin{animation:spin .7s linear infinite}
      `}</style>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Inter',sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Stethoscope size={26} color="#fff" />
            </div>
            <h1 style={{ fontSize:20, fontWeight: 800, color: "#1e293b" }}>Department Portal</h1>
            <p style={{ fontSize:12, color: "#94a3b8", marginTop: 6 }}>Sign in to your sub-department dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize:10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dept@hospital.com"
                required
                style={{ width: "100%", padding: "11px 14px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize:13, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }}
                onFocus={e => (e.target.style.borderColor = "#80CCCC")}
                onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize:10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: "100%", padding: "11px 42px 11px 14px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize:13, color: "#1e293b", outline: "none", fontFamily: "'Inter',sans-serif" }}
                  onFocus={e => (e.target.style.borderColor = "#80CCCC")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", fontSize:12, color: "#ef4444", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#667eea,#764ba2)", border: "none", borderRadius: 10, color: "#fff", fontSize:13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1, fontFamily: "'Inter',sans-serif" }}
            >
              {loading && <Loader2 size={16} className="sl-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize:11, color: "#94a3b8" }}>
            Credentials are provided by the hospital administrator
          </div>
        </div>
      </div>
    </>
  );
}
