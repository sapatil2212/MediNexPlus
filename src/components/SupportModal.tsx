"use client";
import { X, Phone, MessageCircle, Mail, Headphones } from "lucide-react";

const PHONE = "7745868073";
const EMAIL = "infotheblueintellect@gmail.com";
const WA_LINK = `https://wa.me/91${PHONE}?text=${encodeURIComponent("Hi, I need support regarding the Hospital Management System.")}`;
const CALL_LINK = `tel:+91${PHONE}`;
const MAIL_LINK = `mailto:${EMAIL}?subject=${encodeURIComponent("Support Request — Hospital Management System")}`;

export default function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        fontFamily: "'Inter',sans-serif",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        overflow: "hidden", animation: "supportFadeIn .25s ease",
      }}>
        <style>{`@keyframes supportFadeIn{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#0E898F,#07595D)", padding: "24px 24px 20px",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Headphones size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>Need Help?</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>We're here to assist you 24/7</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6, marginBottom: 20 }}>
            For any queries, technical issues, or feedback related to the Hospital Management System, feel free to reach out to our support team through any of the channels below.
          </p>

          {/* Call */}
          <a
            href={CALL_LINK}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14,
              background: "#f0fdf4", border: "1.5px solid #bbf7d0", textDecoration: "none",
              marginBottom: 10, transition: "all .15s", cursor: "pointer",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#22c55e,#16a34a)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Phone size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Call Us Directly</div>
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>+91 {PHONE}</div>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14,
              background: "#f0fdf4", border: "1.5px solid #bbf7d0", textDecoration: "none",
              marginBottom: 10, transition: "all .15s", cursor: "pointer",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#25d366,#128c7e)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <MessageCircle size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>WhatsApp Chat</div>
              <div style={{ fontSize: 12, color: "#128c7e", fontWeight: 600, marginTop: 2 }}>+91 {PHONE}</div>
            </div>
          </a>

          {/* Email */}
          <a
            href={MAIL_LINK}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14,
              background: "#eff6ff", border: "1.5px solid #bfdbfe", textDecoration: "none",
              marginBottom: 0, transition: "all .15s", cursor: "pointer",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Mail size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Email Support</div>
              <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, marginTop: 2 }}>{EMAIL}</div>
            </div>
          </a>

          {/* Footer note */}
          <div style={{
            marginTop: 18, padding: "10px 14px", borderRadius: 10, background: "#f8fafc",
            border: "1px solid #e2e8f0", textAlign: "center",
          }}>
            <div style={{ fontSize: 10.5, color: "#64748b", lineHeight: 1.5 }}>
              Powered by <strong style={{ color: "#0E898F" }}>The Blue Intellect</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
