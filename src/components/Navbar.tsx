"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Phone, LogIn, ChevronDown,
  Stethoscope, SmilePlus, Sparkles, Ribbon, HeartPulse, PhoneCall,
  Scissors, Apple, Gem, Plane,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppointment } from "./AppointmentProvider";
import styles from "./Navbar.module.css";

const treatmentsLeft = [
  { label: "Dental", href: "/treatments/dental", icon: <SmilePlus size={18} /> },
  { label: "Skin", href: "/treatments/skin", icon: <Sparkles size={18} /> },
  { label: "Hair", href: "/treatments/hair", icon: <Ribbon size={18} /> },
  { label: "HNF Cancer", href: "/treatments/oncology", icon: <HeartPulse size={18} /> },
  { label: "Facial Trauma", href: "/treatments/facial-trauma", icon: <Stethoscope size={18} /> },
];

const treatmentsRight = [
  { label: "Body Shaping", href: "/treatments/body-shaping", icon: <Scissors size={18} /> },
  { label: "Nutrition", href: "/treatments/nutrition", icon: <Apple size={18} /> },
  { label: "Sexual Health", href: "/treatments/sexual-health", icon: <HeartPulse size={18} /> },
  { label: "Premium Aesthetic", href: "/treatments/premium-aesthetic", icon: <Gem size={18} /> },
  { label: "Dental and Medical Tourism", href: "/treatments/medical-tourism", icon: <Plane size={18} /> },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Treatments", href: "/treatments", hasDropdown: true },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { openAppointment } = useAppointment();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => setIsDropdownOpen(false), 200);
  };

  return (
    <>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarInner}`}>
          <div className={styles.topBarLeft}>
            <span className={styles.topBarItem}>
              <Phone size={14} />
              <span>+91 90590 53938</span>
            </span>
            <span className={styles.topBarDivider}>|</span>
            <span className={styles.topBarItem}>
              Mon – Sat: 9:00 AM – 9:00 PM
            </span>
          </div>
          <div className={styles.topBarRight}>
            <Link href="/login" className={styles.topBarLink}>
              <LogIn size={14} />
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <motion.nav
        className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}
      >
        <div className={`container ${styles.navInner}`}>
          {/* Logo */}
          <Link href="/" className={styles.logo} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(124,58,237,0.3)", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>MediNex<span style={{ color: "#7C3AED" }}>+</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className={styles.desktopNav}>
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.label}
                  className={styles.dropdownTrigger}
                  ref={dropdownRef}
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className={`${styles.navLink} ${styles.dropdownBtn} ${pathname.startsWith("/treatments") ? styles.navLinkActive : ""
                      }`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ""}`}
                    />
                  </button>

                  {/* Mega Dropdown */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        className={styles.megaDropdown}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <div className={styles.dropdownInner}>
                          {/* Left Column */}
                          <div className={styles.dropdownLinks}>
                            {treatmentsLeft.map((item, i) => (
                              <motion.div
                                key={item.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Link
                                  href={item.href}
                                  className={`${styles.dropdownItem} ${pathname === item.href ? styles.dropdownItemActive : ""
                                    }`}
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <span className={styles.dropdownItemIcon}>
                                    {item.icon}
                                  </span>
                                  <span className={styles.dropdownItemLabel}>
                                    {item.label}
                                  </span>
                                </Link>
                              </motion.div>
                            ))}
                            <Link
                              href="/treatments"
                              className={styles.viewAllLink}
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              View All Treatments →
                            </Link>
                          </div>

                          {/* Right Column */}
                          <div className={styles.dropdownLinks}>
                            {treatmentsRight.map((item, i) => (
                              <motion.div
                                key={item.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Link
                                  href={item.href}
                                  className={`${styles.dropdownItem} ${pathname === item.href ? styles.dropdownItemActive : ""
                                    }`}
                                  onClick={() => setIsDropdownOpen(false)}
                                >
                                  <span className={styles.dropdownItemIcon}>
                                    {item.icon}
                                  </span>
                                  <span className={styles.dropdownItemLabel}>
                                    {item.label}
                                  </span>
                                </Link>
                              </motion.div>
                            ))}
                          </div>

                          {/* Image Column */}
                          <motion.div
                            className={styles.dropdownImage}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 }}
                          >
                            <Image
                              src="/images/treatment-dropdown-new.png"
                              alt="Aesthetic clinic consultation"
                              width={260}
                              height={260}
                              className={styles.dropdownImg}
                            />


                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.navLinkActive : ""
                    }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* CTA */}
          <div className={styles.navActions}>
            <a
              href="tel:+919059053938"
              className={`${styles.navBtn} ${styles.navContact}`}
            >
              <PhoneCall size={15} />
              +91 90590 53938
            </a>
            <button
              onClick={openAppointment}
              className={`${styles.navBtn} ${styles.navCta}`}
            >
              Book Appointment
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className={styles.hamburger}
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              className={styles.mobileMenu}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {navLinks.map((link, i) =>
                link.hasDropdown ? (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      className={`${styles.mobileLink} ${styles.mobileDropdownBtn}`}
                      onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                    >
                      {link.label}
                      <ChevronDown
                        size={16}
                        className={`${styles.chevron} ${mobileDropdownOpen ? styles.chevronOpen : ""
                          }`}
                      />
                    </button>
                    <AnimatePresence>
                      {mobileDropdownOpen && (
                        <motion.div
                          className={styles.mobileSubMenu}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {[...treatmentsLeft, ...treatmentsRight].map((t) => (
                            <Link
                              key={t.label}
                              href={t.href}
                              className={styles.mobileSubLink}
                              onClick={() => {
                                setIsMobileOpen(false);
                                setMobileDropdownOpen(false);
                              }}
                            >
                              {t.icon}
                              {t.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={`${styles.mobileLink} ${pathname === link.href ? styles.mobileLinkActive : ""
                        }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                )
              )}
              <div className={styles.mobileActions}>
                <a
                  href="tel:+919059053938"
                  className={`${styles.navBtn} ${styles.navContact} ${styles.mobileCta}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <PhoneCall size={14} />
                  +91 90590 53938
                </a>
                <button
                  className={`${styles.navBtn} ${styles.navCta} ${styles.mobileCta}`}
                  onClick={() => { setIsMobileOpen(false); openAppointment(); }}
                >
                  Book Appointment
                </button>
              </div>
              <Link
                href="/login"
                className={styles.mobileLoginLink}
                onClick={() => setIsMobileOpen(false)}
              >
                <LogIn size={14} />
                Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
