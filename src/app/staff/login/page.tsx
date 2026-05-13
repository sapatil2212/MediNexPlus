"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StaffLoginPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        const mustChange = data.data?.staff?.mustChangePassword;
        setTimeout(() => {
          if (mustChange) {
            router.push("/staff/change-password");
          } else {
            router.push("/staff/dashboard");
          }
        }, 800);
      } else {
        setApiError(data.message || "Invalid email or password.");
      }
    } catch {
      setApiError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const t = dark ? "dark" : "light";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .sp.dark { --bg:#0f0f19; --brand-from:#0f172a; --brand-to:#064e3b; --card-bg:#0f0f19; --input-bg:rgba(255,255,255,0.04); --input-border:rgba(255,255,255,0.1); --input-focus-border:rgba(16,185,129,0.55); --input-focus-shadow:rgba(16,185,129,0.12); --input-color:#fff; --placeholder:rgba(255,255,255,0.18); --label:#9ca3af; --heading:#fff; --sub:rgba(255,255,255,0.35); --err-bg:rgba(239,68,68,0.08); --err-border:rgba(239,68,68,0.22); --err-color:#fca5a5; --ferr:#f87171; --suc-bg:rgba(16,185,129,0.1); --suc-border:rgba(16,185,129,0.25); --suc-color:#6ee7b7; --toggle-bg:rgba(255,255,255,0.08); --toggle-color:rgba(255,255,255,0.5); --toggle-hover:rgba(255,255,255,0.14); --footer-color:rgba(255,255,255,0.3); --footer-link:#34d399; --eye-color:rgba(255,255,255,0.25); --eye-hover:rgba(255,255,255,0.55); --brand-grid:rgba(255,255,255,0.025); --stat-num:#34d399; --stat-label:rgba(255,255,255,0.4); --stat-div:rgba(255,255,255,0.12); --pill-bg:rgba(255,255,255,0.05); --pill-border:rgba(255,255,255,0.12); --pill-color:rgba(255,255,255,0.6); --brand-title:#fff; --brand-sub:rgba(255,255,255,0.5); }

        .sp.light { --bg:#ecfdf5; --brand-from:#d1fae5; --brand-to:#a7f3d0; --card-bg:#ffffff; --input-bg:#f9fafb; --input-border:#d1d5db; --input-focus-border:#10b981; --input-focus-shadow:rgba(16,185,129,0.15); --input-color:#111827; --placeholder:#9ca3af; --label:#6b7280; --heading:#111827; --sub:#6b7280; --err-bg:#fef2f2; --err-border:#fecaca; --err-color:#dc2626; --ferr:#dc2626; --suc-bg:#f0fdf4; --suc-border:#bbf7d0; --suc-color:#059669; --toggle-bg:rgba(0,0,0,0.07); --toggle-color:#374151; --toggle-hover:rgba(0,0,0,0.12); --footer-color:#6b7280; --footer-link:#059669; --eye-color:#9ca3af; --eye-hover:#374151; --brand-grid:rgba(16,185,129,0.06); --stat-num:#059669; --stat-label:#6b7280; --stat-div:#d1d5db; --pill-bg:rgba(16,185,129,0.06); --pill-border:rgba(16,185,129,0.18); --pill-color:#065f46; --brand-title:#14532d; --brand-sub:#374151; }

        .sp { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; font-family:'Inter',sans-serif; overflow:hidden; transition:background 0.3s; background:var(--bg); }
        @media(max-width:768px){ .sp{ grid-template-columns:1fr; } .sp-brand{ display:none; } }

        .sp-toggle { position:fixed; top:20px; right:20px; z-index:100; width:40px; height:40px; border-radius:50%; border:none; cursor:pointer; background:var(--toggle-bg); color:var(--toggle-color); display:flex; align-items:center; justify-content:center; transition:background 0.2s, transform 0.2s; box-shadow:0 2px 12px rgba(0,0,0,0.12); backdrop-filter:blur(8px); }
        .sp-toggle:hover { background:var(--toggle-hover); transform:scale(1.1); }

        .sp-brand { background:linear-gradient(155deg, var(--brand-from) 0%, #6ee7b7 50%, var(--brand-to) 100%); display:flex; align-items:center; justify-content:center; padding:48px; position:relative; overflow:hidden; transition:background 0.3s; }
        .sp-brand-grid { position:absolute; inset:0; background-image:linear-gradient(var(--brand-grid) 1px, transparent 1px), linear-gradient(90deg, var(--brand-grid) 1px, transparent 1px); background-size:40px 40px; }
        .sp-brand-glow { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse at 10% 30%, rgba(16,185,129,0.25) 0%, transparent 55%), radial-gradient(ellipse at 85% 70%, rgba(5,150,105,0.2) 0%, transparent 55%); }
        .sp-brand-content { position:relative; z-index:2; max-width:420px; }
        .sp-logo { display:flex; align-items:center; gap:12px; margin-bottom:48px; text-decoration:none; }
        .sp-logo-icon { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg, #10b981, #059669); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(16,185,129,0.4); }
        .sp-logo-text { font-size:22px; font-weight:800; color:var(--brand-title); letter-spacing:-0.02em; }
        .sp-logo-accent { color:#059669; }
        .sp.light .sp-logo-accent { color:#047857; }
        .sp-brand-title { font-size:38px; font-weight:800; line-height:1.15; letter-spacing:-0.03em; margin-bottom:16px; color:var(--brand-title); }
        .sp-brand-title span { background:linear-gradient(135deg, #059669, #34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .sp-brand-sub { font-size:15px; color:var(--brand-sub); line-height:1.7; margin-bottom:40px; }
        .sp-stats { display:flex; gap:24px; margin-bottom:40px; }
        .sp-stat { text-align:center; }
        .sp-stat-num { font-size:28px; font-weight:800; color:var(--stat-num); display:block; letter-spacing:-0.02em; }
        .sp-stat-label { font-size:12px; color:var(--stat-label); font-weight:500; }
        .sp-stat-div { width:1px; background:var(--stat-div); }
        .sp-pills { display:flex; flex-wrap:wrap; gap:8px; }
        .sp-pill { padding:5px 12px; border-radius:100px; font-size:12px; font-weight:600; border:1px solid var(--pill-border); color:var(--pill-color); background:var(--pill-bg); }

        .sp-form-side { background:var(--card-bg); display:flex; align-items:center; justify-content:center; padding:32px; transition:background 0.3s; }
        .sp-form-box { width:100%; max-width:420px; }
        .sp-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:100px; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; background:rgba(16,185,129,0.1); color:#059669; border:1px solid rgba(16,185,129,0.22); margin-bottom:12px; }
        .sp-heading { font-size:28px; font-weight:800; color:var(--heading); letter-spacing:-0.02em; margin-bottom:6px; }
        .sp-sub { font-size:14px; color:var(--sub); line-height:1.6; margin-bottom:24px; }

        .sp-err { display:flex; align-items:flex-start; gap:10px; background:var(--err-bg); border:1px solid var(--err-border); border-radius:12px; padding:12px 14px; margin-bottom:18px; font-size:13px; color:var(--err-color); line-height:1.5; animation:sp-shake 0.3s ease; }
        @keyframes sp-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        .sp-suc { display:flex; align-items:center; gap:10px; background:var(--suc-bg); border:1px solid var(--suc-border); border-radius:12px; padding:12px 14px; margin-bottom:18px; font-size:13px; color:var(--suc-color); font-weight:600; }

        .sp-field { margin-bottom:16px; }
        .sp-label-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:7px; }
        .sp-label { font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--label); }
        .sp-wrap { position:relative; }
        .sp-input { width:100%; background:var(--input-bg); border:1.5px solid var(--input-border); border-radius:11px; padding:13px 42px 13px 14px; font-size:14px; color:var(--input-color); font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s, box-shadow 0.2s; }
        .sp-input::placeholder { color:var(--placeholder); }
        .sp-input:focus { border-color:var(--input-focus-border); box-shadow:0 0 0 3px var(--input-focus-shadow); }
        .sp-input.err { border-color:#ef4444; }
        .sp-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--eye-color); display:flex; align-items:center; padding:0; transition:color 0.2s; }
        .sp-eye:hover { color:var(--eye-hover); }
        .sp-ferr { font-size:12px; color:var(--ferr); margin-top:5px; display:block; }

        .sp-btn { width:100%; padding:14px; border:none; border-radius:12px; font-size:15px; font-weight:700; font-family:'Inter',sans-serif; cursor:pointer; position:relative; overflow:hidden; transition:transform 0.15s, box-shadow 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg, #10b981, #059669); color:#fff; box-shadow:0 4px 18px rgba(16,185,129,0.3); margin-bottom:0; }
        .sp-btn:hover:not(:disabled){ transform:translateY(-1px); box-shadow:0 8px 26px rgba(16,185,129,0.42); }
        .sp-btn:active:not(:disabled){ transform:translateY(0); }
        .sp-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .sp-btn-shine { position:absolute; inset:0; background:linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%); background-size:200% 100%; animation:sp-shine 3s infinite; }
        @keyframes sp-shine { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .sp-spinner { display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:sp-spin 0.7s linear infinite; }
        @keyframes sp-spin { to{ transform:rotate(360deg); } }

        .sp-footer { text-align:center; margin-top:20px; font-size:13px; color:var(--footer-color); }
        .sp-footer a { color:var(--footer-link); text-decoration:none; font-weight:600; }
        .sp-footer a:hover { opacity:0.8; }
        .sp-notice { margin-top:16px; padding:12px 16px; border-radius:10px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.18); font-size:12px; color:#065f46; line-height:1.6; }
        .sp.dark .sp-notice { background:rgba(16,185,129,0.08); border-color:rgba(16,185,129,0.2); color:#6ee7b7; }
      `}</style>

      <button className="sp-toggle" onClick={() => setDark(!dark)} title={dark ? "Light Mode" : "Dark Mode"}>
        {dark
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        }
      </button>

      <div className={`sp ${t}`}>
        {/* ── BRAND ── */}
        <div className="sp-brand">
          <div className="sp-brand-grid"/>
          <div className="sp-brand-glow"/>
          <div className="sp-brand-content">
            <Link href="/" className="sp-logo">
              <div className="sp-logo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <span className="sp-logo-text">Medi<span className="sp-logo-accent">Care+</span></span>
            </Link>
            <h1 className="sp-brand-title">Staff<br /><span>Portal</span></h1>
            <p className="sp-brand-sub">Access your hospital staff dashboard. Manage your tasks, view schedules, and stay connected with the hospital team.</p>
            <div className="sp-stats">
              <div className="sp-stat"><span className="sp-stat-num">24/7</span><span className="sp-stat-label">Access</span></div>
              <div className="sp-stat-div"/>
              <div className="sp-stat"><span className="sp-stat-num">100%</span><span className="sp-stat-label">Secure</span></div>
              <div className="sp-stat-div"/>
              <div className="sp-stat"><span className="sp-stat-num">Live</span><span className="sp-stat-label">Updates</span></div>
            </div>
            <div className="sp-pills">
              {["Nurse","Receptionist","Pharmacist","Lab Technician","Accountant"].map(r=><span key={r} className="sp-pill">{r}</span>)}
            </div>
          </div>
        </div>

        {/* ── FORM SIDE ── */}
        <div className="sp-form-side">
          <div className="sp-form-box">
            <div className="sp-badge">
              <span style={{width:6,height:6,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 6px #10b981"}}/>
              Staff Access
            </div>
            <h2 className="sp-heading">Staff Sign In</h2>
            <p className="sp-sub">Enter the credentials sent to your email by the hospital administrator.</p>

            {apiError && (
              <div className="sp-err">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {apiError}
              </div>
            )}
            {success && (
              <div className="sp-suc">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Login successful! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="sp-field">
                <label className="sp-label" htmlFor="staff-email">Email Address</label>
                <div className="sp-wrap">
                  <input
                    id="staff-email"
                    type="email"
                    className={`sp-input${fieldErrors.email ? " err" : ""}`}
                    placeholder="your.email@hospital.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({...f, email: undefined})); setApiError(""); }}
                    autoComplete="email"
                    autoFocus
                  />
                  <button type="button" className="sp-eye" tabIndex={-1}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </button>
                </div>
                {fieldErrors.email && <span className="sp-ferr">{fieldErrors.email}</span>}
              </div>

              <div className="sp-field">
                <div className="sp-label-row">
                  <label className="sp-label" htmlFor="staff-pw">Password</label>
                </div>
                <div className="sp-wrap">
                  <input
                    id="staff-pw"
                    type={showPw ? "text" : "password"}
                    className={`sp-input${fieldErrors.password ? " err" : ""}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({...f, password: undefined})); setApiError(""); }}
                    autoComplete="current-password"
                  />
                  <button type="button" className="sp-eye" onClick={() => setShowPw(!showPw)}>
                    {showPw
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {fieldErrors.password && <span className="sp-ferr">{fieldErrors.password}</span>}
              </div>

              <button type="submit" className="sp-btn" disabled={loading || success}>
                <span className="sp-btn-shine"/>
                {loading
                  ? <span className="sp-spinner"/>
                  : success
                  ? "Redirecting..."
                  : <>Sign In <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                }
              </button>
            </form>

            <div className="sp-notice">
              <strong>First time logging in?</strong> Use the temporary password sent to your email. You will be asked to change it immediately after login.
            </div>

            <p className="sp-footer">
              Not a staff member? <Link href="/login">Hospital Admin Login</Link> · <Link href="/">Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
