"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "form" | "otp" | "success";

interface FormData {
  hospitalName: string;
  adminName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

export default function HospitalSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<FormData & { otp: string }>>({});

  const [form, setForm] = useState<FormData>({
    hospitalName: "", adminName: "", email: "", mobile: "", password: "", confirmPassword: "",
  });

  const passwordStrength = useMemo(() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [form.password]);

  const strengthMeta = [
    { label: "", color: "#94A3B8" },
    { label: "Weak", color: "#EF4444" },
    { label: "Fair", color: "#F59E0B" },
    { label: "Good", color: "#0EA5E9" },
    { label: "Strong", color: "#10B981" },
    { label: "Excellent", color: "#059669" },
  ][passwordStrength] || { label: "", color: "#94A3B8" };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    setApiError("");
  };

  const validateForm = () => {
    const errs: Partial<FormData> = {};
    if (!form.hospitalName.trim() || form.hospitalName.trim().length < 2) errs.hospitalName = "Minimum 2 characters";
    if (!form.adminName.trim() || form.adminName.trim().length < 2) errs.adminName = "Minimum 2 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (!form.mobile || form.mobile.replace(/\D/g, "").length < 10) errs.mobile = "Valid mobile required";
    if (!form.password || form.password.length < 6) errs.password = "Minimum 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true); setApiError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, mobile: form.mobile }),
      });
      const data = await res.json();
      if (res.ok && data.success) setStep("otp");
      else setApiError(data.message || "Failed to send OTP.");
    } catch { setApiError("Network error."); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp]; next[index] = value.replace(/\D/g, ""); setOtp(next);
    setApiError("");
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); document.getElementById("otp-5")?.focus(); }
    e.preventDefault();
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) { setApiError("Enter the complete 6-digit OTP"); return; }
    setLoading(true); setApiError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalName: form.hospitalName, adminName: form.adminName, email: form.email, mobile: form.mobile, password: form.password, otp: otpString }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setStep("success"); setTimeout(() => router.push("/login"), 3000); }
      else setApiError(data.message || "OTP verification failed.");
    } catch { setApiError("Network error."); }
    finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setLoading(true); setApiError("");
    try {
      await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.email, mobile: form.mobile }) });
    } catch { setApiError("Network error."); }
    finally { setLoading(false); }
  };

  const eyeIcon = (show: boolean) => show
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }

        .mn-sp-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; background: linear-gradient(160deg, #F5F3FF 0%, #F8FAFF 50%, #EFF6FF 100%); position: relative; overflow: hidden; }
        .mn-sp-bg1 { position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%); pointer-events: none; }
        .mn-sp-bg2 { position: absolute; bottom: -80px; left: -80px; width: 350px; height: 350px; background: radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%); pointer-events: none; }

        .mn-sp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; margin-bottom: 28px; }
        .mn-sp-logo-icon { width: 40px; height: 40px; border-radius: 11px; background: linear-gradient(135deg, #7C3AED, #6D28D9); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(124,58,237,0.35); }
        .mn-sp-logo-text { font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.03em; }
        .mn-sp-logo-plus { color: #7C3AED; }

        .mn-sp-steps-nav { display: flex; align-items: center; gap: 0; margin-bottom: 24px; }
        .mn-sp-step-item { display: flex; align-items: center; gap: 6px; }
        .mn-sp-step-num { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; transition: all 0.3s; }
        .mn-sp-step-item.active .mn-sp-step-num { background: #7C3AED; color: #fff; box-shadow: 0 2px 8px rgba(124,58,237,0.35); }
        .mn-sp-step-item.done .mn-sp-step-num { background: #ECFDF5; color: #059669; border: 1px solid #BBF7D0; }
        .mn-sp-step-item.inactive .mn-sp-step-num { background: #F1F5F9; color: #94A3B8; }
        .mn-sp-step-label { font-size: 12px; font-weight: 600; }
        .mn-sp-step-item.active .mn-sp-step-label { color: #7C3AED; }
        .mn-sp-step-item.done .mn-sp-step-label { color: #059669; }
        .mn-sp-step-item.inactive .mn-sp-step-label { color: #94A3B8; }
        .mn-sp-step-line { width: 40px; height: 1.5px; background: #E2E8F0; margin: 0 8px; }
        .mn-sp-step-line.done { background: #10B981; }

        .mn-sp-card { width: 100%; max-width: 520px; background: #fff; border: 1.5px solid #EDE9FE; border-radius: 20px; padding: 36px 32px; box-shadow: 0 4px 32px rgba(124,58,237,0.08), 0 1px 4px rgba(0,0,0,0.04); position: relative; z-index: 1; }
        @media (max-width: 560px) { .mn-sp-card { padding: 24px 18px; border-radius: 16px; max-width: 100%; } }

        .mn-sp-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px; }
        .mn-sp-badge.s1 { background: #EDE9FE; border: 1px solid #DDD6FE; color: #7C3AED; }
        .mn-sp-badge.s2 { background: #FFF7ED; border: 1px solid #FED7AA; color: #D97706; }
        .mn-sp-badge.s3 { background: #F0FDF4; border: 1px solid #BBF7D0; color: #059669; }
        .mn-sp-title { font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.03em; margin-bottom: 6px; }
        .mn-sp-sub { font-size: 14px; color: #64748B; line-height: 1.6; margin-bottom: 6px; }
        .mn-sp-progress { height: 3px; background: #F1F5F9; border-radius: 10px; margin: 18px 0 24px; overflow: hidden; }
        .mn-sp-progress-fill { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #7C3AED, #8B5CF6); transition: width 0.4s ease; }

        .mn-sp-err { display: flex; align-items: flex-start; gap: 10px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 11px 14px; margin-bottom: 18px; font-size: 13px; color: #DC2626; line-height: 1.5; animation: mn-shake 0.3s ease; }
        @keyframes mn-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }

        .mn-sp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 480px) { .mn-sp-grid2 { grid-template-columns: 1fr; gap: 0; } }

        .mn-field { margin-bottom: 16px; }
        .mn-label { display: block; font-size: 12px; font-weight: 600; color: #475569; letter-spacing: 0.01em; margin-bottom: 7px; }
        .mn-input-wrap { position: relative; }
        .mn-input { width: 100%; background: #FAFAFA; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 12px 42px 12px 14px; font-size: 14px; color: #0F172A; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .mn-input::placeholder { color: #94A3B8; }
        .mn-input:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); background: #fff; }
        .mn-input.err { border-color: #EF4444; }
        .mn-input-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; pointer-events: none; display: flex; align-items: center; }
        .mn-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8; display: flex; align-items: center; padding: 2px; transition: color 0.2s; }
        .mn-eye:hover { color: #475569; }
        .mn-ferr { font-size: 12px; color: #EF4444; margin-top: 5px; display: block; }

        .mn-str { margin-top: 8px; }
        .mn-str-track { display: flex; gap: 4px; margin-bottom: 4px; }
        .mn-str-seg { height: 3px; flex: 1; border-radius: 4px; transition: background 0.3s; }
        .mn-str-label { font-size: 11px; font-weight: 600; }

        .mn-sp-btn { width: 100%; padding: 13px; border: none; border-radius: 11px; font-size: 15px; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #7C3AED, #6D28D9); color: #fff; box-shadow: 0 4px 16px rgba(124,58,237,0.3); transition: transform 0.15s, box-shadow 0.15s; position: relative; overflow: hidden; margin-top: 4px; }
        .mn-sp-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%); background-size: 200% 100%; animation: mn-shine 3s infinite; }
        @keyframes mn-shine { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .mn-sp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
        .mn-sp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .mn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: mn-spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes mn-spin { to { transform: rotate(360deg); } }

        .mn-sp-otp-wrap { display: flex; justify-content: center; margin-bottom: 8px; }
        .mn-sp-otp-grid { display: flex; gap: 10px; width: 100%; max-width: 340px; }
        .mn-sp-otp-in { flex: 1; min-width: 0; text-align: center; font-size: 22px; font-weight: 800; padding: 12px 0; border-radius: 12px; background: #F8FAFC; border: 1.5px solid #E2E8F0; color: #0F172A; font-family: 'Inter', sans-serif; outline: none; transition: all 0.2s; caret-color: #7C3AED; }
        .mn-sp-otp-in:focus { border-color: #7C3AED; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); background: #fff; }
        .mn-sp-otp-in.filled { border-color: #C4B5FD; background: #EDE9FE; }
        .mn-sp-otp-hint { font-size: 12px; color: #94A3B8; text-align: center; margin-bottom: 18px; }

        .mn-sp-resend { font-size: 13px; color: #94A3B8; text-align: center; margin-top: 14px; }
        .mn-sp-resend-btn { background: none; border: none; color: #7C3AED; cursor: pointer; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; }
        .mn-sp-resend-btn:hover { opacity: 0.8; }
        .mn-sp-back { display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: #64748B; font-size: 13px; font-family: 'Inter', sans-serif; font-weight: 500; margin-bottom: 20px; padding: 0; transition: color 0.2s; }
        .mn-sp-back:hover { color: #0F172A; }

        .mn-sp-success { text-align: center; padding: 16px 0; }
        .mn-sp-suc-icon { width: 72px; height: 72px; border-radius: 50%; background: #F0FDF4; border: 2px solid #BBF7D0; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; animation: mn-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
        @keyframes mn-pop { 0%{transform:scale(0) rotate(-15deg)} 100%{transform:scale(1) rotate(0)} }
        .mn-sp-suc-title { font-size: 24px; font-weight: 800; color: #0F172A; margin-bottom: 10px; }
        .mn-sp-suc-sub { font-size: 14px; color: #64748B; line-height: 1.7; margin-bottom: 24px; }
        .mn-sp-redir-bar { height: 3px; background: #F1F5F9; border-radius: 10px; overflow: hidden; }
        .mn-sp-redir-fill { height: 100%; background: linear-gradient(90deg, #10B981, #059669); animation: mn-fill 3s linear forwards; }
        @keyframes mn-fill { 0%{width:0%} 100%{width:100%} }

        .mn-sp-footer { text-align: center; margin-top: 20px; font-size: 13px; color: #64748B; }
        .mn-sp-footer a { color: #7C3AED; text-decoration: none; font-weight: 600; }
        .mn-sp-footer a:hover { opacity: 0.8; }
      ` }} />

      <div className="mn-sp-page">
        <div className="mn-sp-bg1" />
        <div className="mn-sp-bg2" />

        <Link href="/" className="mn-sp-logo">
          <img src="/logo/medinexplus-logo-normal.png" alt="MediNexPlus" style={{ height: 42, width: "auto", objectFit: "contain" }} />
        </Link>

        {/* Step indicator */}
        {step !== "success" && (
          <div className="mn-sp-steps-nav">
            {[{label:"Hospital Details",n:1,key:"form"},{label:"Verify OTP",n:2,key:"otp"}].map((s, idx, arr) => {
              const order: Step[] = ["form","otp","success"];
              const curIdx = order.indexOf(step);
              const myIdx = order.indexOf(s.key as Step);
              const cls = myIdx < curIdx ? "done" : myIdx === curIdx ? "active" : "inactive";
              return (
                <div key={s.key} style={{display:"flex",alignItems:"center"}}>
                  <div className={`mn-sp-step-item ${cls}`}>
                    <div className="mn-sp-step-num">{cls === "done" ? "✓" : s.n}</div>
                    <span className="mn-sp-step-label">{s.label}</span>
                  </div>
                  {idx < arr.length - 1 && <div className={`mn-sp-step-line${cls === "done" ? " done" : ""}`} />}
                </div>
              );
            })}
          </div>
        )}

        <div className="mn-sp-card">

          {/* STEP 1: FORM */}
          {step === "form" && (
            <>
              <div className="mn-sp-badge s1">Step 1 of 2 · Hospital Details</div>
              <h1 className="mn-sp-title">Register Your Hospital</h1>
              <p className="mn-sp-sub">Fill in your hospital and admin details. We&apos;ll send a verification OTP to confirm your email.</p>
              <div className="mn-sp-progress"><div className="mn-sp-progress-fill" style={{width:"50%"}} /></div>

              {apiError && (
                <div className="mn-sp-err">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {apiError}
                </div>
              )}

              <form onSubmit={handleRequestOTP}>
                <div className="mn-sp-grid2">
                  <div className="mn-field">
                    <label className="mn-label">Hospital Name</label>
                    <div className="mn-input-wrap">
                      <input
                        type="text"
                        className={`mn-input${fieldErrors.hospitalName ? " err" : ""}`}
                        placeholder="e.g. City Medical Center"
                        value={form.hospitalName}
                        onChange={e => updateField("hospitalName", e.target.value)}
                        autoComplete="organization"
                        autoFocus
                      />
                      <span className="mn-input-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      </span>
                    </div>
                    {fieldErrors.hospitalName && <span className="mn-ferr">{fieldErrors.hospitalName}</span>}
                  </div>
                  <div className="mn-field">
                    <label className="mn-label">Admin Full Name</label>
                    <div className="mn-input-wrap">
                      <input
                        type="text"
                        className={`mn-input${fieldErrors.adminName ? " err" : ""}`}
                        placeholder="Your full name"
                        value={form.adminName}
                        onChange={e => updateField("adminName", e.target.value)}
                        autoComplete="name"
                      />
                      <span className="mn-input-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </span>
                    </div>
                    {fieldErrors.adminName && <span className="mn-ferr">{fieldErrors.adminName}</span>}
                  </div>
                </div>

                <div className="mn-sp-grid2">
                  <div className="mn-field">
                    <label className="mn-label">Email Address</label>
                    <div className="mn-input-wrap">
                      <input
                        type="email"
                        className={`mn-input${fieldErrors.email ? " err" : ""}`}
                        placeholder="admin@hospital.com"
                        value={form.email}
                        onChange={e => updateField("email", e.target.value)}
                        autoComplete="email"
                      />
                      <span className="mn-input-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </span>
                    </div>
                    {fieldErrors.email && <span className="mn-ferr">{fieldErrors.email}</span>}
                  </div>
                  <div className="mn-field">
                    <label className="mn-label">Mobile Number</label>
                    <div className="mn-input-wrap">
                      <input
                        type="tel"
                        className={`mn-input${fieldErrors.mobile ? " err" : ""}`}
                        placeholder="10-digit mobile"
                        value={form.mobile}
                        onChange={e => updateField("mobile", e.target.value)}
                        autoComplete="tel"
                      />
                      <span className="mn-input-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      </span>
                    </div>
                    {fieldErrors.mobile && <span className="mn-ferr">{fieldErrors.mobile}</span>}
                  </div>
                </div>

                <div className="mn-field">
                  <label className="mn-label">Password</label>
                  <div className="mn-input-wrap">
                    <input
                      type={showPw ? "text" : "password"}
                      className={`mn-input${fieldErrors.password ? " err" : ""}`}
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={e => updateField("password", e.target.value)}
                      autoComplete="new-password"
                    />
                    <button type="button" className="mn-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                      {eyeIcon(showPw)}
                    </button>
                  </div>
                  {fieldErrors.password && <span className="mn-ferr">{fieldErrors.password}</span>}
                  {form.password && (
                    <div className="mn-str">
                      <div className="mn-str-track">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="mn-str-seg" style={{background: i <= passwordStrength ? strengthMeta.color : "#E2E8F0"}} />
                        ))}
                      </div>
                      <span className="mn-str-label" style={{color: strengthMeta.color}}>{strengthMeta.label}</span>
                    </div>
                  )}
                </div>

                <div className="mn-field">
                  <label className="mn-label">Confirm Password</label>
                  <div className="mn-input-wrap">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={`mn-input${fieldErrors.confirmPassword ? " err" : ""}`}
                      placeholder="Re-enter your password"
                      value={form.confirmPassword}
                      onChange={e => updateField("confirmPassword", e.target.value)}
                      autoComplete="new-password"
                    />
                    <button type="button" className="mn-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                      {eyeIcon(showConfirm)}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <span className="mn-ferr">{fieldErrors.confirmPassword}</span>}
                </div>

                <button type="submit" className="mn-sp-btn" disabled={loading}>
                  {loading ? <span className="mn-spinner" /> : (
                    <>Send Verification OTP <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                  )}
                </button>
              </form>

              <div className="mn-sp-footer">
                Already registered? <Link href="/login">Sign In</Link>
                {" · "}
                <Link href="/">Back to Home</Link>
              </div>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <>
              <button className="mn-sp-back" onClick={() => setStep("form")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to Details
              </button>
              <div className="mn-sp-badge s2">Step 2 of 2 · OTP Verification</div>
              <h1 className="mn-sp-title">Check Your Email</h1>
              <p className="mn-sp-sub">We sent a 6-digit OTP to <strong style={{color:"#0F172A"}}>{form.email}</strong>. Enter it below to verify your account.</p>
              <div className="mn-sp-progress"><div className="mn-sp-progress-fill" style={{width:"100%"}} /></div>

              {apiError && (
                <div className="mn-sp-err">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {apiError}
                </div>
              )}

              <form onSubmit={handleVerifyAndCreate}>
                <div className="mn-field">
                  <label className="mn-label">Enter 6-digit OTP</label>
                  <div className="mn-sp-otp-wrap" style={{marginTop:10}}>
                    <div className="mn-sp-otp-grid" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`mn-sp-otp-in${digit ? " filled" : ""}`}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          autoFocus={i === 0}
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mn-sp-otp-hint">OTP is valid for 10 minutes</p>
                </div>

                <button type="submit" className="mn-sp-btn" disabled={loading || otp.join("").length !== 6}>
                  {loading ? <span className="mn-spinner" /> : (
                    <>Verify &amp; Create Account <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                  )}
                </button>
              </form>

              <p className="mn-sp-resend">
                Didn&apos;t receive the code?{" "}
                <button className="mn-sp-resend-btn" onClick={handleResendOTP} disabled={loading}>Resend OTP</button>
              </p>
            </>
          )}

          {/* STEP 3: SUCCESS */}
          {step === "success" && (
            <div className="mn-sp-success">
              <div className="mn-sp-suc-icon">🎉</div>
              <h2 className="mn-sp-suc-title">Hospital Registered!</h2>
              <p className="mn-sp-suc-sub">
                <strong style={{color:"#0F172A"}}>{form.hospitalName}</strong> has been successfully onboarded on MediNex+. Your admin account is ready. Redirecting to sign in...
              </p>
              <div className="mn-sp-redir-bar"><div className="mn-sp-redir-fill" /></div>
              <p style={{marginTop:16,fontSize:13,color:"#94A3B8"}}>
                Not redirecting? <Link href="/login" style={{color:"#7C3AED",fontWeight:600,textDecoration:"none"}}>Click here</Link>
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
