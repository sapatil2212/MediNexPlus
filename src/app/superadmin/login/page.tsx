"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLogin() {
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    securityKey: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/superadmin/dashboard");
      } else {
        setError(data.message || "Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const t = dark ? "dark" : "light";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── DARK MODE VARIABLES ── */
        .sa-page.dark {
          --bg: #0a0a0f;
          --card-bg: rgba(15, 15, 25, 0.9);
          --card-border: rgba(220, 38, 38, 0.2);
          --card-shadow-1: rgba(255,255,255,0.05);
          --card-shadow-2: rgba(0,0,0,0.6);
          --card-shadow-3: rgba(220, 38, 38, 0.06);
          --badge-bg: rgba(220, 38, 38, 0.15);
          --badge-border: rgba(220, 38, 38, 0.3);
          --badge-color: #f87171;
          --badge-dot-bg: #dc2626;
          --badge-dot-shadow: #dc2626;
          --title-color: #ffffff;
          --title-gradient-from: #dc2626;
          --title-gradient-to: #f97316;
          --subtitle-color: rgba(255,255,255,0.35);
          --divider-bg: linear-gradient(90deg, transparent, rgba(220,38,38,0.3), transparent);
          --error-bg: rgba(220, 38, 38, 0.1);
          --error-border: rgba(220, 38, 38, 0.3);
          --error-color: #fca5a5;
          --error-icon-color: #dc2626;
          --label-color: rgba(255,255,255,0.4);
          --input-bg: rgba(255,255,255,0.04);
          --input-border: rgba(255,255,255,0.1);
          --input-color: #ffffff;
          --input-placeholder: rgba(255,255,255,0.2);
          --input-focus-border: rgba(220, 38, 38, 0.5);
          --input-focus-bg: rgba(220, 38, 38, 0.04);
          --input-focus-shadow: rgba(220, 38, 38, 0.1);
          --input-icon-color: rgba(255,255,255,0.2);
          --input-icon-hover: rgba(255,255,255,0.5);
          --btn-bg: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          --btn-shadow: rgba(220, 38, 38, 0.35);
          --btn-shadow-hover: rgba(220, 38, 38, 0.45);
          --footer-color: rgba(255,255,255,0.2);
          --footer-strong: rgba(255,255,255,0.35);
          --footer-border: rgba(255,255,255,0.06);
          --warning-bg: rgba(245, 158, 11, 0.08);
          --warning-border: rgba(245, 158, 11, 0.2);
          --warning-color: rgba(253, 224, 71, 0.7);
          --grid-color: rgba(220, 38, 38, 0.04);
          --glow-1: rgba(220, 38, 38, 0.12);
          --glow-2: rgba(139, 92, 246, 0.08);
          --toggle-bg: rgba(255,255,255,0.08);
          --toggle-color: rgba(255,255,255,0.5);
          --toggle-hover: rgba(255,255,255,0.14);
        }

        /* ── LIGHT MODE VARIABLES ── */
        .sa-page.light {
          --bg: #fef2f2;
          --card-bg: #ffffff;
          --card-border: rgba(220, 38, 38, 0.15);
          --card-shadow-1: rgba(0,0,0,0.05);
          --card-shadow-2: rgba(0,0,0,0.1);
          --card-shadow-3: rgba(220, 38, 38, 0.08);
          --badge-bg: rgba(220, 38, 38, 0.1);
          --badge-border: rgba(220, 38, 38, 0.25);
          --badge-color: #dc2626;
          --badge-dot-bg: #dc2626;
          --badge-dot-shadow: #dc2626;
          --title-color: #111827;
          --title-gradient-from: #dc2626;
          --title-gradient-to: #f97316;
          --subtitle-color: #6b7280;
          --divider-bg: linear-gradient(90deg, transparent, rgba(220,38,38,0.2), transparent);
          --error-bg: #fef2f2;
          --error-border: #fecaca;
          --error-color: #dc2626;
          --error-icon-color: #dc2626;
          --label-color: #6b7280;
          --input-bg: #f9fafb;
          --input-border: #d1d5db;
          --input-color: #111827;
          --input-placeholder: #9ca3af;
          --input-focus-border: #dc2626;
          --input-focus-bg: #ffffff;
          --input-focus-shadow: rgba(220, 38, 38, 0.12);
          --input-icon-color: #9ca3af;
          --input-icon-hover: #374151;
          --btn-bg: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          --btn-shadow: rgba(220, 38, 38, 0.25);
          --btn-shadow-hover: rgba(220, 38, 38, 0.35);
          --footer-color: #6b7280;
          --footer-strong: #374151;
          --footer-border: #e5e7eb;
          --warning-bg: #fffbeb;
          --warning-border: #fde68a;
          --warning-color: #92400e;
          --grid-color: rgba(220, 38, 38, 0.06);
          --glow-1: rgba(220, 38, 38, 0.08);
          --glow-2: rgba(139, 92, 246, 0.05);
          --toggle-bg: rgba(0,0,0,0.07);
          --toggle-color: #374151;
          --toggle-hover: rgba(0,0,0,0.12);
        }

        .sa-page {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }

        .sa-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 100;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: var(--toggle-bg);
          color: var(--toggle-color);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.2s;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
          backdrop-filter: blur(8px);
        }

        .sa-toggle:hover {
          background: var(--toggle-hover);
          transform: scale(1.1);
        }

        .sa-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--grid-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .sa-bg-glow-1 {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--glow-1) 0%, transparent 70%);
          top: -200px;
          right: -200px;
          pointer-events: none;
        }

        .sa-bg-glow-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--glow-2) 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          pointer-events: none;
        }

        .sa-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          margin: 24px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow:
            0 0 0 1px var(--card-shadow-1),
            0 24px 80px var(--card-shadow-2),
            0 0 60px var(--card-shadow-3);
          backdrop-filter: blur(20px);
          transition: background 0.3s, border-color 0.3s;
        }

        .sa-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--badge-bg);
          border: 1px solid var(--badge-border);
          border-radius: 100px;
          padding: 4px 12px;
          margin-bottom: 24px;
          font-size:10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--badge-color);
        }

        .sa-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--badge-dot-bg);
          box-shadow: 0 0 6px var(--badge-dot-shadow);
          animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .sa-title {
          font-size:26px;
          font-weight: 800;
          color: var(--title-color);
          line-height: 1.2;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .sa-title span {
          background: linear-gradient(135deg, var(--title-gradient-from), var(--title-gradient-to));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sa-subtitle {
          font-size:13px;
          color: var(--subtitle-color);
          margin-bottom: 36px;
          font-weight: 400;
          line-height: 1.5;
        }

        .sa-divider {
          height: 1px;
          background: var(--divider-bg);
          margin-bottom: 32px;
        }

        .sa-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: var(--error-bg);
          border: 1px solid var(--error-border);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 24px;
          color: var(--error-color);
          font-size:12px;
          line-height: 1.5;
          animation: shake 0.3s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .sa-error-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          color: var(--error-icon-color);
          margin-top: 1px;
        }

        .sa-field {
          margin-bottom: 20px;
        }

        .sa-label {
          display: block;
          font-size:11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--label-color);
          margin-bottom: 8px;
        }

        .sa-input-wrap {
          position: relative;
        }

        .sa-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 12px;
          padding: 14px 44px 14px 16px;
          font-size:13px;
          color: var(--input-color);
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .sa-input::placeholder {
          color: var(--input-placeholder);
        }

        .sa-input:focus {
          border-color: var(--input-focus-border);
          background: var(--input-focus-bg);
          box-shadow: 0 0 0 3px var(--input-focus-shadow);
        }

        .sa-input-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: var(--input-icon-color);
          cursor: pointer;
          transition: color 0.2s;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sa-input-icon:hover {
          color: var(--input-icon-hover);
        }

        .sa-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          font-size:14px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
          margin-top: 8px;
          background: var(--btn-bg);
          color: #ffffff;
          box-shadow: 0 4px 24px var(--btn-shadow);
          letter-spacing: 0.02em;
        }

        .sa-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px var(--btn-shadow-hover);
        }

        .sa-btn:not(:disabled):active {
          transform: translateY(0);
        }

        .sa-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sa-btn-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.15) 50%,
            transparent 60%
          );
          background-size: 200% 100%;
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .sa-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .sa-footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--footer-border);
          font-size:11px;
          color: var(--footer-color);
          line-height: 1.6;
        }

        .sa-footer strong {
          display: block;
          color: var(--footer-strong);
          font-weight: 500;
          margin-bottom: 4px;
        }

        .sa-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--warning-bg);
          border: 1px solid var(--warning-border);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 28px;
          font-size:11px;
          color: var(--warning-color);
          line-height: 1.4;
        }
      `}</style>

      {/* Theme Toggle */}
      <button className="sa-toggle" onClick={() => setDark(!dark)} title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
        {dark ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>

      <div className={`sa-page ${t}`}>
        <div className="sa-bg-grid" />
        <div className="sa-bg-glow-1" />
        <div className="sa-bg-glow-2" />

        <div className="sa-card">
          {/* Badge */}
          <div className="sa-badge">
            <span className="sa-badge-dot" />
            Restricted System Access
          </div>

          {/* Header */}
          <h1 className="sa-title">
            Hospital <span>Root</span> Portal
          </h1>
          <p className="sa-subtitle">
            Multi-tenant system administration. Three-factor authentication required.
          </p>

          <div className="sa-divider" />

          {/* Warning */}
          <div className="sa-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
              <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
            </svg>
            All login attempts are logged and monitored.
          </div>

          {/* Error */}
          {error && (
            <div className="sa-error">
              <svg className="sa-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="sa-field">
              <label className="sa-label">Admin Email</label>
              <div className="sa-input-wrap">
                <input
                  type="email"
                  id="sa-email"
                  required
                  autoComplete="email"
                  className="sa-input"
                  placeholder="systemadmin@hospital.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <button type="button" className="sa-input-icon" tabIndex={-1}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="sa-field">
              <label className="sa-label">Root Password</label>
              <div className="sa-input-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  id="sa-password"
                  required
                  autoComplete="current-password"
                  className="sa-input"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="sa-input-icon"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="sa-field">
              <label className="sa-label">Security Key</label>
              <div className="sa-input-wrap">
                <input
                  type={showKey ? "text" : "password"}
                  id="sa-security-key"
                  required
                  className="sa-input"
                  placeholder="••••••••"
                  value={formData.securityKey}
                  onChange={(e) => setFormData({ ...formData, securityKey: e.target.value })}
                />
                <button
                  type="button"
                  className="sa-input-icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="sa-btn" disabled={loading}>
              <span className="sa-btn-shine" />
              {loading ? (
                <>
                  <span className="sa-spinner" />
                  Authenticating...
                </>
              ) : (
                "Authenticate & Enter System"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="sa-footer">
            <strong>Hospital Management System v1.0</strong>
            © 2026 All rights reserved · Unauthorized access is prohibited
          </div>
        </div>
      </div>
    </>
  );
}
