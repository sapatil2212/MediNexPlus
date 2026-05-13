"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, ArrowLeft, Search, Heart } from "lucide-react";

const SUGGESTIONS = [
  { label: "Home", href: "/" },
  { label: "Book Appointment", href: "/#services" },
  { label: "Our Doctors", href: "/doctors" },
  { label: "Treatments", href: "/treatments" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function NotFound() {
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-6)",
      background: "var(--white)",
    }}>
      <div style={{
        maxWidth: 520,
        width: "100%",
        textAlign: "center",
      }}>
        {/* 404 Illustration */}
        <div style={{
          fontSize: 120,
          fontWeight: 800,
          lineHeight: 1,
          background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: 8,
          userSelect: "none",
        }}>
          404
        </div>

        {/* Divider line */}
        <div style={{
          width: 60,
          height: 4,
          borderRadius: 2,
          background: "var(--primary)",
          margin: "0 auto var(--space-6)",
          opacity: 0.6,
        }} />

        {/* Heading */}
        <h1 style={{
          fontSize: "var(--font-size-2xl)",
          fontWeight: 700,
          color: "var(--gray-900)",
          marginBottom: "var(--space-3)",
        }}>
          Page Not Found
        </h1>

        {/* Description */}
        <p style={{
          fontSize: "var(--font-size-base)",
          color: "var(--gray-500)",
          lineHeight: 1.6,
          marginBottom: "var(--space-8)",
          maxWidth: 400,
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          The page you are looking for doesn&apos;t exist or has been moved. Let us help you find your way back.
        </p>

        {/* Quick Navigation Buttons */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          justifyContent: "center",
          marginBottom: "var(--space-8)",
        }}>
          {SUGGESTIONS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredBtn(i)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                borderRadius: "var(--radius-lg)",
                border: `1px solid ${hoveredBtn === i ? "var(--primary)" : "var(--gray-200)"}`,
                background: hoveredBtn === i ? "var(--primary-50)" : "var(--white)",
                color: hoveredBtn === i ? "var(--primary)" : "var(--gray-600)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Primary CTA */}
        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              color: "var(--white)",
              fontSize: "var(--font-size-base)",
              fontWeight: 600,
              textDecoration: "none",
              transition: "opacity 0.2s ease",
              boxShadow: "0 4px 14px rgba(14, 137, 143, 0.3)",
            }}
          >
            <Home size={18} />
            Back to Home
          </Link>

          <button
            onClick={() => window.history.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: "var(--radius-lg)",
              background: "var(--white)",
              border: "1px solid var(--gray-200)",
              color: "var(--gray-700)",
              fontSize: "var(--font-size-base)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: "var(--space-10)",
          fontSize: "var(--font-size-xs)",
          color: "var(--gray-400)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}>
          Need help? <Search size={12} /> Visit our <Link href="/contact" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>contact page</Link>
          <Heart size={10} style={{ marginLeft: 4 }} />
        </p>
      </div>
    </div>
  );
}
