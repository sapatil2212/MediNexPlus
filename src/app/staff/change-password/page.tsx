"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StaffChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

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

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!oldPassword) errs.oldPassword = "Current password is required";
    if (!newPassword) errs.newPassword = "New password is required";
    else if (newPassword.length < 8) errs.newPassword = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(newPassword)) errs.newPassword = "Must contain at least one uppercase letter";
    else if (!/[a-z]/.test(newPassword)) errs.newPassword = "Must contain at least one lowercase letter";
    else if (!/[0-9]/.test(newPassword)) errs.newPassword = "Must contain at least one number";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your new password";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/staff/dashboard"), 1500);
      } else {
        setApiError(data.message || "Failed to change password.");
      }
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(newPassword);

  const EyeIcon = ({ show }: { show: boolean }) => show
    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      padding: "24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .cp-card { background: #fff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.10); padding: 40px; width: 100%; max-width: 460px; }
        .cp-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; text-decoration: none; }
        .cp-logo-icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(16,185,129,0.35); }
        .cp-logo-text { font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em; }
        .cp-logo-accent { color: #059669; }
        .cp-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(245,158,11,0.1); color: #d97706; border: 1px solid rgba(245,158,11,0.25); margin-bottom: 12px; }
        .cp-heading { font-size: 26px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em; margin-bottom: 6px; }
        .cp-sub { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 28px; }
        .cp-err { display: flex; align-items: flex-start; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; color: #dc2626; line-height: 1.5; }
        .cp-suc { display: flex; align-items: center; gap: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; color: #059669; font-weight: 600; }
        .cp-field { margin-bottom: 16px; }
        .cp-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; display: block; margin-bottom: 7px; }
        .cp-wrap { position: relative; }
        .cp-input { width: 100%; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 11px; padding: 13px 42px 13px 14px; font-size: 14px; color: #111827; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .cp-input::placeholder { color: #9ca3af; }
        .cp-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
        .cp-input.err { border-color: #ef4444; }
        .cp-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; padding: 0; transition: color 0.2s; }
        .cp-eye:hover { color: #374151; }
        .cp-ferr { font-size: 12px; color: #dc2626; margin-top: 5px; display: block; }
        .cp-strength-bar { display: flex; gap: 4px; margin-top: 8px; }
        .cp-strength-seg { flex: 1; height: 4px; border-radius: 2px; background: #e5e7eb; transition: background 0.3s; }
        .cp-strength-label { font-size: 11px; font-weight: 600; margin-top: 4px; }
        .cp-requirements { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
        .cp-req { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; }
        .cp-req.met { color: #10b981; }
        .cp-req-dot { width: 6px; height: 6px; border-radius: 50%; background: #e5e7eb; flex-shrink: 0; }
        .cp-req.met .cp-req-dot { background: #10b981; }
        .cp-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; position: relative; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 4px 18px rgba(16,185,129,0.3); margin-top: 8px; }
        .cp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(16,185,129,0.42); }
        .cp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .cp-btn-shine { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%); background-size: 200% 100%; animation: cp-shine 3s infinite; }
        @keyframes cp-shine { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .cp-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: cp-spin 0.7s linear infinite; }
        @keyframes cp-spin { to{ transform: rotate(360deg); } }
        .cp-footer { text-align: center; margin-top: 20px; font-size: 13px; color: #6b7280; }
        .cp-footer a { color: #059669; text-decoration: none; font-weight: 600; }
        .cp-footer a:hover { opacity: 0.8; }
        .cp-divider { height: 1px; background: #f1f5f9; margin: 20px 0; }
      `}</style>

      <div className="cp-card">
        <Link href="/" className="cp-logo">
          <div className="cp-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span className="cp-logo-text">Medi<span className="cp-logo-accent">Care+</span></span>
        </Link>

        <div className="cp-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Security Required
        </div>
        <h2 className="cp-heading">Change Your Password</h2>
        <p className="cp-sub">You must change your temporary password before accessing the staff portal. Choose a strong, unique password.</p>

        {apiError && (
          <div className="cp-err">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {apiError}
          </div>
        )}
        {success && (
          <div className="cp-suc">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Password changed successfully! Redirecting to dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="cp-field">
            <label className="cp-label" htmlFor="old-pw">Current Password</label>
            <div className="cp-wrap">
              <input
                id="old-pw"
                type={showOld ? "text" : "password"}
                className={`cp-input${fieldErrors.oldPassword ? " err" : ""}`}
                placeholder="Enter your current password"
                value={oldPassword}
                onChange={e => { setOldPassword(e.target.value); setFieldErrors(f => ({...f, oldPassword: ""})); setApiError(""); }}
                autoComplete="current-password"
                autoFocus
              />
              <button type="button" className="cp-eye" onClick={() => setShowOld(!showOld)}>
                <EyeIcon show={showOld} />
              </button>
            </div>
            {fieldErrors.oldPassword && <span className="cp-ferr">{fieldErrors.oldPassword}</span>}
          </div>

          <div className="cp-field">
            <label className="cp-label" htmlFor="new-pw">New Password</label>
            <div className="cp-wrap">
              <input
                id="new-pw"
                type={showNew ? "text" : "password"}
                className={`cp-input${fieldErrors.newPassword ? " err" : ""}`}
                placeholder="Choose a strong password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setFieldErrors(f => ({...f, newPassword: ""})); }}
                autoComplete="new-password"
              />
              <button type="button" className="cp-eye" onClick={() => setShowNew(!showNew)}>
                <EyeIcon show={showNew} />
              </button>
            </div>
            {newPassword && (
              <>
                <div className="cp-strength-bar">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="cp-strength-seg" style={{ background: i <= strength.score ? strength.color : "#e5e7eb" }} />
                  ))}
                </div>
                <div className="cp-strength-label" style={{ color: strength.color }}>{strength.label}</div>
                <div className="cp-requirements">
                  {[
                    { label: "At least 8 characters", met: newPassword.length >= 8 },
                    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(newPassword) },
                    { label: "One lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
                    { label: "One number (0-9)", met: /[0-9]/.test(newPassword) },
                  ].map(req => (
                    <div key={req.label} className={`cp-req${req.met ? " met" : ""}`}>
                      <div className="cp-req-dot"/>
                      {req.label}
                    </div>
                  ))}
                </div>
              </>
            )}
            {fieldErrors.newPassword && <span className="cp-ferr">{fieldErrors.newPassword}</span>}
          </div>

          <div className="cp-field">
            <label className="cp-label" htmlFor="confirm-pw">Confirm New Password</label>
            <div className="cp-wrap">
              <input
                id="confirm-pw"
                type={showConfirm ? "text" : "password"}
                className={`cp-input${fieldErrors.confirmPassword ? " err" : ""}`}
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(f => ({...f, confirmPassword: ""})); }}
                autoComplete="new-password"
              />
              <button type="button" className="cp-eye" onClick={() => setShowConfirm(!showConfirm)}>
                <EyeIcon show={showConfirm} />
              </button>
            </div>
            {confirmPassword && newPassword && confirmPassword === newPassword && (
              <span style={{ fontSize: 12, color: "#10b981", marginTop: 4, display: "block", fontWeight: 600 }}>✓ Passwords match</span>
            )}
            {fieldErrors.confirmPassword && <span className="cp-ferr">{fieldErrors.confirmPassword}</span>}
          </div>

          <button type="submit" className="cp-btn" disabled={loading || success}>
            <span className="cp-btn-shine"/>
            {loading
              ? <span className="cp-spinner"/>
              : success
              ? "Redirecting..."
              : <>Set New Password <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
            }
          </button>
        </form>

        <div className="cp-divider"/>
        <p className="cp-footer">
          <Link href="/staff/login">← Back to Staff Login</Link>
        </p>
      </div>
    </div>
  );
}
