"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FpStep = "email" | "otp" | "password" | "done";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [success, setSuccess] = useState(false);
  const [trialPopup, setTrialPopup] = useState<{ type: string; message: string } | null>(null);

  const [fpOpen, setFpOpen] = useState(false);
  const [fpStep, setFpStep] = useState<FpStep>("email");
  const [fpEmail, setFpEmail] = useState("");
  const [fpEmailError, setFpEmailError] = useState("");
  const [fpOtp, setFpOtp] = useState(["", "", "", "", "", ""]);
  const [fpOtpError, setFpOtpError] = useState("");
  const [fpNewPw, setFpNewPw] = useState("");
  const [fpConfirmPw, setFpConfirmPw] = useState("");
  const [fpPwError, setFpPwError] = useState("");
  const [fpConfirmError, setFpConfirmError] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpApiError, setFpApiError] = useState("");
  const [showFpPw, setShowFpPw] = useState(false);
  const [showFpConfirm, setShowFpConfirm] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Minimum 6 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setApiError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        const role = data.data?.user?.role;
        setTimeout(() => {
          if (role === "SUPER_ADMIN") router.push("/superadmin/dashboard");
          else if (role === "DOCTOR") router.push("/doctor/dashboard");
          else if (role === "RECEPTIONIST" || role === "STAFF") router.push("/staff/dashboard");
          else if (role === "SUB_DEPT_HEAD") router.push("/subdept/dashboard");
          else if (role === "FINANCE_HEAD") router.push("/finance/dashboard");
          else if (role === "DEPT_HEAD") router.push("/parentdept/dashboard");
          else router.push("/hospitaladmin/dashboard");
        }, 800);
      } else {
        const msg = data.message || "Invalid email or password.";
        const trialCodes = ["TRIAL_EXPIRED", "SUBSCRIPTION_EXPIRED", "ACCOUNT_SUSPENDED", "ACCOUNT_CANCELLED"];
        const matchedCode = trialCodes.find(code => msg.startsWith(code + "::"));
        if (matchedCode) {
          setTrialPopup({ type: matchedCode, message: msg.split("::")[1] });
        } else {
          setApiError(msg);
        }
      }
    } catch { setApiError("No internet connection. Please try again."); }
    finally { setLoading(false); }
  };

  const openFp = () => {
    setFpOpen(true); setFpStep("email"); setFpEmail(""); setFpEmailError("");
    setFpOtp(["","","","","",""]); setFpOtpError(""); setFpNewPw(""); setFpConfirmPw("");
    setFpPwError(""); setFpConfirmError(""); setFpApiError(""); setFpLoading(false);
  };
  const closeFp = () => setFpOpen(false);

  const handleFpSendOtp = async () => {
    if (!fpEmail) { setFpEmailError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(fpEmail)) { setFpEmailError("Enter a valid email address"); return; }
    setFpEmailError(""); setFpLoading(true); setFpApiError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setFpStep("otp"); }
      else setFpApiError(data.message || "Failed to send OTP.");
    } catch { setFpApiError("Network error."); }
    finally { setFpLoading(false); }
  };

  const handleFpOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...fpOtp]; next[index] = value.replace(/\D/g, ""); setFpOtp(next);
    setFpOtpError(""); setFpApiError("");
    if (value && index < 5) document.getElementById(`fp-otp-${index + 1}`)?.focus();
  };
  const handleFpOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !fpOtp[index] && index > 0)
      document.getElementById(`fp-otp-${index - 1}`)?.focus();
  };
  const handleFpOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setFpOtp(pasted.split("")); document.getElementById("fp-otp-5")?.focus(); }
    e.preventDefault();
  };

  const handleFpVerifyOtp = async () => {
    const otpStr = fpOtp.join("");
    if (otpStr.length !== 6) { setFpOtpError("Enter the complete 6-digit OTP"); return; }
    setFpLoading(true);
    try { setFpStep("password"); }
    finally { setFpLoading(false); }
  };

  const handleFpResetPassword = async () => {
    let hasErr = false;
    if (!fpNewPw || fpNewPw.length < 6) { setFpPwError("Minimum 6 characters"); hasErr = true; } else setFpPwError("");
    if (fpNewPw !== fpConfirmPw) { setFpConfirmError("Passwords do not match"); hasErr = true; } else setFpConfirmError("");
    if (hasErr) return;
    setFpLoading(true); setFpApiError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp.join(""), newPassword: fpNewPw }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setFpStep("done"); }
      else setFpApiError(data.message || "Password reset failed.");
    } catch { setFpApiError("Network error."); }
    finally { setFpLoading(false); }
  };

  const eyeIcon = (show: boolean) => show
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #F8FAFF; }

        .mn-auth-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px; background: linear-gradient(160deg, #F5F3FF 0%, #F8FAFF 50%, #EFF6FF 100%); position: relative; overflow: hidden; }
        .mn-auth-bg1 { position: absolute; top: -120px; right: -120px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%); pointer-events: none; }
        .mn-auth-bg2 { position: absolute; bottom: -100px; left: -80px; width: 350px; height: 350px; background: radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%); pointer-events: none; }

        .mn-auth-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; margin-bottom: 32px; }
        .mn-auth-logo-icon { width: 40px; height: 40px; border-radius: 11px; background: linear-gradient(135deg, #7C3AED, #6D28D9); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(124,58,237,0.35); }
        .mn-auth-logo-text { font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.03em; }
        .mn-auth-logo-plus { color: #7C3AED; }

        .mn-auth-card { width: 100%; max-width: 440px; background: #fff; border: 1.5px solid #EDE9FE; border-radius: 20px; padding: 40px 36px; box-shadow: 0 4px 32px rgba(124,58,237,0.08), 0 1px 4px rgba(0,0,0,0.04); position: relative; z-index: 1; }
        @media (max-width: 480px) { .mn-auth-card { padding: 28px 20px; border-radius: 16px; } }

        .mn-auth-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #EDE9FE; border: 1px solid #DDD6FE; border-radius: 100px; font-size: 11px; font-weight: 700; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
        .mn-auth-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #7C3AED; box-shadow: 0 0 6px #7C3AED; }
        .mn-auth-title { font-size: 26px; font-weight: 800; color: #0F172A; letter-spacing: -0.03em; margin-bottom: 6px; line-height: 1.2; }
        .mn-auth-sub { font-size: 14px; color: #64748B; line-height: 1.6; margin-bottom: 28px; }

        .mn-auth-err { display: flex; align-items: flex-start; gap: 10px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 11px 14px; margin-bottom: 18px; font-size: 13px; color: #DC2626; line-height: 1.5; animation: mn-shake 0.3s ease; }
        @keyframes mn-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        .mn-auth-suc { display: flex; align-items: center; gap: 10px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 11px 14px; margin-bottom: 18px; font-size: 13px; color: #059669; font-weight: 600; }

        .mn-field { margin-bottom: 18px; }
        .mn-field-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
        .mn-label { font-size: 12px; font-weight: 600; color: #475569; letter-spacing: 0.01em; }
        .mn-forgot-btn { font-size: 12px; font-weight: 600; color: #7C3AED; background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; transition: opacity 0.2s; padding: 0; }
        .mn-forgot-btn:hover { opacity: 0.75; }
        .mn-input-wrap { position: relative; }
        .mn-input { width: 100%; background: #FAFAFA; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 12px 42px 12px 14px; font-size: 14px; color: #0F172A; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .mn-input::placeholder { color: #94A3B8; }
        .mn-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); background: #fff; }
        .mn-input.err { border-color: #EF4444; }
        .mn-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8; display: flex; align-items: center; padding: 2px; transition: color 0.2s; }
        .mn-eye:hover { color: #475569; }
        .mn-ferr { font-size: 12px; color: #EF4444; margin-top: 5px; display: block; }

        .mn-auth-btn { width: 100%; padding: 13px; border: none; border-radius: 11px; font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #7C3AED, #6D28D9); color: #fff; box-shadow: 0 4px 16px rgba(124,58,237,0.3); transition: transform 0.15s, box-shadow 0.15s; position: relative; overflow: hidden; margin-top: 4px; }
        .mn-auth-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%); background-size: 200% 100%; animation: mn-shine 3s infinite; }
        @keyframes mn-shine { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .mn-auth-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
        .mn-auth-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .mn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: mn-spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes mn-spin { to { transform: rotate(360deg); } }

        .mn-auth-footer { text-align: center; margin-top: 22px; font-size: 13px; color: #64748B; }
        .mn-auth-footer a { color: #7C3AED; text-decoration: none; font-weight: 600; }
        .mn-auth-footer a:hover { opacity: 0.8; }
        .mn-auth-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0 0; }
        .mn-auth-divider-line { flex: 1; height: 1px; background: #F1F5F9; }
        .mn-auth-divider-text { font-size: 12px; color: #94A3B8; }

        /* MODAL */
        .mn-fp-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; animation: mn-fade 0.2s ease; }
        .mn-fp-backdrop { position: absolute; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(6px); }
        @keyframes mn-fade { from{opacity:0} to{opacity:1} }
        .mn-fp-modal { position: relative; z-index: 1; background: #fff; border: 1.5px solid #EDE9FE; border-radius: 18px; width: 100%; max-width: 400px; box-shadow: 0 16px 48px rgba(124,58,237,0.15); animation: mn-slideup 0.25s cubic-bezier(0.175,0.885,0.32,1.275); overflow: hidden; }
        @keyframes mn-slideup { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .mn-fp-topbar { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 16px; border-bottom: 1px solid #F1F5F9; }
        .mn-fp-topbar-left { display: flex; align-items: center; gap: 10px; }
        .mn-fp-icon { width: 32px; height: 32px; border-radius: 9px; background: #EDE9FE; display: flex; align-items: center; justify-content: center; }
        .mn-fp-title { font-size: 15px; font-weight: 700; color: #0F172A; }
        .mn-fp-close { width: 28px; height: 28px; border-radius: 8px; background: #F8FAFC; border: 1px solid #E2E8F0; cursor: pointer; color: #64748B; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .mn-fp-close:hover { background: #F1F5F9; color: #0F172A; }
        .mn-fp-steps { display: flex; align-items: center; padding: 14px 22px 0; gap: 0; }
        .mn-fp-step { display: flex; align-items: center; gap: 5px; }
        .mn-fp-step-dot { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; transition: all 0.25s; }
        .mn-fp-step.active .mn-fp-step-dot { background: #7C3AED; color: #fff; }
        .mn-fp-step.done .mn-fp-step-dot { background: #ECFDF5; color: #059669; border: 1px solid #BBF7D0; }
        .mn-fp-step.inactive .mn-fp-step-dot { background: #F1F5F9; color: #94A3B8; }
        .mn-fp-step-label { font-size: 11px; font-weight: 600; color: #94A3B8; }
        .mn-fp-step.active .mn-fp-step-label { color: #7C3AED; }
        .mn-fp-step.done .mn-fp-step-label { color: #059669; }
        .mn-fp-connector { flex: 1; height: 1px; background: #E2E8F0; margin: 0 8px; }
        .mn-fp-connector.done { background: #10B981; }
        .mn-fp-body { padding: 20px 22px 24px; }
        .mn-fp-hint { font-size: 13px; color: #64748B; margin-bottom: 16px; line-height: 1.6; }
        .mn-fp-api-err { display: flex; align-items: flex-start; gap: 8px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 9px 12px; margin-bottom: 14px; font-size: 12px; color: #DC2626; line-height: 1.5; }
        .mn-fp-otp-wrap { display: flex; justify-content: center; margin-bottom: 6px; }
        .mn-fp-otp-grid { display: flex; gap: 8px; width: 100%; max-width: 300px; }
        .mn-fp-otp-in { flex: 1; min-width: 0; text-align: center; font-size: 20px; font-weight: 800; padding: 10px 0; border-radius: 10px; background: #F8FAFC; border: 1.5px solid #E2E8F0; color: #0F172A; font-family: 'Inter', sans-serif; outline: none; transition: all 0.2s; caret-color: #7C3AED; }
        .mn-fp-otp-in:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); background: #fff; }
        .mn-fp-otp-in.filled { border-color: #C4B5FD; background: #EDE9FE; }
        .mn-fp-otp-hint { font-size: 11px; color: #94A3B8; text-align: center; margin-bottom: 16px; }
        .mn-fp-pw-wrap { position: relative; margin-bottom: 4px; }
        .mn-fp-pw-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8; display: flex; align-items: center; padding: 0; transition: color 0.2s; }
        .mn-fp-pw-eye:hover { color: #475569; }
        .mn-fp-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg, #7C3AED, #6D28D9); color: #fff; transition: all 0.15s; margin-top: 16px; box-shadow: 0 3px 12px rgba(124,58,237,0.25); }
        .mn-fp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }
        .mn-fp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .mn-fp-resend { font-size: 12px; color: #94A3B8; text-align: center; margin-top: 12px; }
        .mn-fp-resend-btn { background: none; border: none; color: #7C3AED; cursor: pointer; font-size: 12px; font-weight: 600; font-family: 'Inter', sans-serif; }
        .mn-fp-resend-btn:hover { opacity: 0.8; }
        .mn-fp-success { text-align: center; padding: 8px 0 4px; }
        .mn-fp-suc-icon { width: 56px; height: 56px; border-radius: 50%; background: #F0FDF4; border: 2px solid #BBF7D0; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 26px; animation: mn-pop 0.35s cubic-bezier(0.175,0.885,0.32,1.275); }
        @keyframes mn-pop { 0%{transform:scale(0)} 100%{transform:scale(1)} }
        .mn-fp-suc-title { font-size: 17px; font-weight: 800; color: #0F172A; margin-bottom: 8px; }
        .mn-fp-suc-sub { font-size: 13px; color: #64748B; line-height: 1.6; margin-bottom: 20px; }
        .mn-fp-suc-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: 9px; background: linear-gradient(135deg, #7C3AED, #6D28D9); color: #fff; border: none; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.15s; }
        .mn-fp-suc-btn:hover { transform: translateY(-1px); }
      ` }} />

      <div className="mn-auth-page">
        <div className="mn-auth-bg1" />
        <div className="mn-auth-bg2" />

        <Link href="/" className="mn-auth-logo">
          <img src="/logo/medinexplus-logo-normal.png" alt="MediNexPlus" style={{ height: 42, width: "auto", objectFit: "contain" }} />
        </Link>

        <div className="mn-auth-card">
          <div className="mn-auth-badge">
            <span className="mn-auth-badge-dot" />
            Secure Access
          </div>
          <h1 className="mn-auth-title">Welcome back</h1>
          <p className="mn-auth-sub">Sign in to your hospital dashboard to continue managing your healthcare platform.</p>

          {apiError && (
            <div className="mn-auth-err">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {apiError}
            </div>
          )}
          {success && (
            <div className="mn-auth-suc">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Login successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mn-field">
              <label className="mn-label" htmlFor="login-email">Email Address</label>
              <div className="mn-input-wrap">
                <input
                  id="login-email"
                  type="email"
                  className={`mn-input${fieldErrors.email ? " err" : ""}`}
                  placeholder="admin@hospital.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErrors(f => ({...f, email: undefined})); setApiError(""); }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {fieldErrors.email && <span className="mn-ferr">{fieldErrors.email}</span>}
            </div>

            <div className="mn-field">
              <div className="mn-field-row">
                <label className="mn-label" htmlFor="login-pw">Password</label>
                <button type="button" className="mn-forgot-btn" onClick={openFp}>Forgot password?</button>
              </div>
              <div className="mn-input-wrap">
                <input
                  id="login-pw"
                  type={showPw ? "text" : "password"}
                  className={`mn-input${fieldErrors.password ? " err" : ""}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(f => ({...f, password: undefined})); setApiError(""); }}
                  autoComplete="current-password"
                />
                <button type="button" className="mn-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {eyeIcon(showPw)}
                </button>
              </div>
              {fieldErrors.password && <span className="mn-ferr">{fieldErrors.password}</span>}
            </div>

            <button type="submit" className="mn-auth-btn" disabled={loading || success}>
              {loading ? <span className="mn-spinner" /> : success ? "Redirecting..." : (
                <>Sign In <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
              )}
            </button>
          </form>

          <div className="mn-auth-divider">
            <div className="mn-auth-divider-line" />
            <span className="mn-auth-divider-text">New to MediNex+?</span>
            <div className="mn-auth-divider-line" />
          </div>

          <div className="mn-auth-footer" style={{marginTop: 14}}>
            <Link href="/signup">Register your hospital</Link>
            {" · "}
            <Link href="/">Back to Home</Link>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {fpOpen && (
        <div className="mn-fp-overlay">
          <div className="mn-fp-backdrop" onClick={closeFp} />
          <div className="mn-fp-modal">
            <div className="mn-fp-topbar">
              <div className="mn-fp-topbar-left">
                <div className="mn-fp-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <span className="mn-fp-title">Reset Password</span>
              </div>
              <button className="mn-fp-close" onClick={closeFp}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {fpStep !== "done" && (
              <div className="mn-fp-steps">
                {[{label:"Email",n:1,key:"email"},{label:"OTP",n:2,key:"otp"},{label:"Password",n:3,key:"password"}].map((s, idx, arr) => {
                  const order: FpStep[] = ["email","otp","password","done"];
                  const curIdx = order.indexOf(fpStep);
                  const myIdx = order.indexOf(s.key as FpStep);
                  const cls = myIdx < curIdx ? "done" : myIdx === curIdx ? "active" : "inactive";
                  return (
                    <div key={s.key} style={{display:"flex",alignItems:"center",flex: idx < arr.length-1 ? 1 : 0}}>
                      <div className={`mn-fp-step ${cls}`}>
                        <div className="mn-fp-step-dot">{cls === "done" ? "✓" : s.n}</div>
                        <span className="mn-fp-step-label">{s.label}</span>
                      </div>
                      {idx < arr.length - 1 && <div className={`mn-fp-connector${cls === "done" ? " done" : ""}`} />}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mn-fp-body">
              {fpApiError && (
                <div className="mn-fp-api-err">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {fpApiError}
                </div>
              )}

              {fpStep === "email" && (
                <>
                  <p className="mn-fp-hint">Enter the email address linked to your account and we will send you a reset code.</p>
                  <label className="mn-label">Email Address</label>
                  <input
                    type="email"
                    className={`mn-input${fpEmailError ? " err" : ""}`}
                    style={{marginTop:6}}
                    placeholder="admin@hospital.com"
                    value={fpEmail}
                    onChange={e => { setFpEmail(e.target.value); setFpEmailError(""); setFpApiError(""); }}
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleFpSendOtp(); }}
                  />
                  {fpEmailError && <span className="mn-ferr">{fpEmailError}</span>}
                  <button className="mn-fp-btn" onClick={handleFpSendOtp} disabled={fpLoading}>
                    {fpLoading ? <span className="mn-spinner" /> : <>Send OTP <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </button>
                </>
              )}

              {fpStep === "otp" && (
                <>
                  <p className="mn-fp-hint">A 6-digit code was sent to <strong style={{color:"#0F172A"}}>{fpEmail}</strong>.</p>
                  <label className="mn-label">Enter 6-digit OTP</label>
                  <div className="mn-fp-otp-wrap" style={{marginTop:10}}>
                    <div className="mn-fp-otp-grid" onPaste={handleFpOtpPaste}>
                      {fpOtp.map((digit, i) => (
                        <input
                          key={i}
                          id={`fp-otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`mn-fp-otp-in${digit ? " filled" : ""}`}
                          value={digit}
                          onChange={e => handleFpOtpChange(i, e.target.value)}
                          onKeyDown={e => handleFpOtpKeyDown(i, e)}
                          autoFocus={i === 0}
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                  </div>
                  {fpOtpError && <span className="mn-ferr" style={{textAlign:"center",display:"block"}}>{fpOtpError}</span>}
                  <p className="mn-fp-otp-hint">Code is valid for 10 minutes</p>
                  <button className="mn-fp-btn" onClick={handleFpVerifyOtp} disabled={fpLoading || fpOtp.join("").length !== 6}>
                    {fpLoading ? <span className="mn-spinner" /> : <>Verify OTP <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </button>
                  <p className="mn-fp-resend">
                    Didn&apos;t receive it?{" "}
                    <button className="mn-fp-resend-btn" onClick={() => { setFpOtp(["","","","","",""]); handleFpSendOtp(); }} disabled={fpLoading}>Resend OTP</button>
                  </p>
                </>
              )}

              {fpStep === "password" && (
                <>
                  <p className="mn-fp-hint">OTP verified ✓ — choose a new secure password.</p>
                  <div style={{marginBottom:14}}>
                    <label className="mn-label">New Password</label>
                    <div className="mn-fp-pw-wrap" style={{marginTop:6}}>
                      <input
                        type={showFpPw ? "text" : "password"}
                        className={`mn-input${fpPwError ? " err" : ""}`}
                        style={{paddingRight:42}}
                        placeholder="Minimum 6 characters"
                        value={fpNewPw}
                        onChange={e => { setFpNewPw(e.target.value); setFpPwError(""); setFpApiError(""); }}
                        autoFocus
                      />
                      <button type="button" className="mn-fp-pw-eye" onClick={() => setShowFpPw(!showFpPw)}>{eyeIcon(showFpPw)}</button>
                    </div>
                    {fpPwError && <span className="mn-ferr">{fpPwError}</span>}
                  </div>
                  <div>
                    <label className="mn-label">Confirm New Password</label>
                    <div className="mn-fp-pw-wrap" style={{marginTop:6}}>
                      <input
                        type={showFpConfirm ? "text" : "password"}
                        className={`mn-input${fpConfirmError ? " err" : ""}`}
                        style={{paddingRight:42}}
                        placeholder="Re-enter new password"
                        value={fpConfirmPw}
                        onChange={e => { setFpConfirmPw(e.target.value); setFpConfirmError(""); setFpApiError(""); }}
                        onKeyDown={e => { if (e.key === "Enter") handleFpResetPassword(); }}
                      />
                      <button type="button" className="mn-fp-pw-eye" onClick={() => setShowFpConfirm(!showFpConfirm)}>{eyeIcon(showFpConfirm)}</button>
                    </div>
                    {fpConfirmError && <span className="mn-ferr">{fpConfirmError}</span>}
                  </div>
                  <button className="mn-fp-btn" onClick={handleFpResetPassword} disabled={fpLoading}>
                    {fpLoading ? <span className="mn-spinner" /> : <>Reset Password <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                  </button>
                </>
              )}

              {fpStep === "done" && (
                <div className="mn-fp-success">
                  <div className="mn-fp-suc-icon">🎉</div>
                  <div className="mn-fp-suc-title">Password Reset!</div>
                  <p className="mn-fp-suc-sub">Your password has been updated successfully. You can now sign in with your new password.</p>
                  <button className="mn-fp-suc-btn" onClick={closeFp}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    Go to Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRIAL / SUBSCRIPTION EXPIRED POPUP */}
      {trialPopup && (
        <div className="mn-fp-overlay">
          <div className="mn-fp-backdrop" onClick={() => setTrialPopup(null)} />
          <div className="mn-fp-modal" style={{ maxWidth: 420 }}>
            <div className="mn-fp-topbar" style={{ borderBottom: "1px solid #FEE2E2" }}>
              <div className="mn-fp-topbar-left">
                <div className="mn-fp-icon" style={{ background: trialPopup.type === "TRIAL_EXPIRED" ? "#FEF3C7" : "#FEE2E2" }}>
                  {trialPopup.type === "TRIAL_EXPIRED" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  )}
                </div>
                <span className="mn-fp-title" style={{ color: trialPopup.type === "TRIAL_EXPIRED" ? "#92400E" : "#991B1B" }}>
                  {trialPopup.type === "TRIAL_EXPIRED" && "Free Trial Ended"}
                  {trialPopup.type === "SUBSCRIPTION_EXPIRED" && "Subscription Expired"}
                  {trialPopup.type === "ACCOUNT_SUSPENDED" && "Account Suspended"}
                  {trialPopup.type === "ACCOUNT_CANCELLED" && "Account Cancelled"}
                </span>
              </div>
              <button className="mn-fp-close" onClick={() => setTrialPopup(null)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="mn-fp-body" style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: trialPopup.type === "TRIAL_EXPIRED" ? "#FEF3C7" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
                {trialPopup.type === "TRIAL_EXPIRED" ? "⏰" : trialPopup.type === "ACCOUNT_SUSPENDED" ? "🔒" : "⚠️"}
              </div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 20 }}>
                {trialPopup.message}
              </p>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, textAlign: "left", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Contact Support</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>
                  <a href="mailto:support@medinexplus.com" style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>support@medinexplus.com</a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  <a href="tel:+919876543210" style={{ fontSize: 13, color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>+91-9876543210</a>
                </div>
              </div>
              <button onClick={() => setTrialPopup(null)} style={{ width: "100%", padding: 12, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif", cursor: "pointer", background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff", boxShadow: "0 3px 12px rgba(124,58,237,0.25)", transition: "all 0.15s" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
