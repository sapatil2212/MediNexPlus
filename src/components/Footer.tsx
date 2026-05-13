"use client";

import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Treatments", href: "/treatments" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
];

const treatmentLinks = [
  { label: "Dental", href: "/treatments/dental" },
  { label: "Skin", href: "/treatments/skin" },
  { label: "Hair", href: "/treatments/hair" },
  { label: "HNF Cancer", href: "/treatments/oncology" },
  { label: "Facial Trauma", href: "/treatments/facial-trauma" },
  { label: "Body Shaping", href: "/treatments/body-shaping" },
  { label: "Nutrition", href: "/treatments/nutrition" },
  { label: "Sexual Health", href: "/treatments/sexual-health" },
  { label: "Premium Aesthetic", href: "/treatments/premium-aesthetic" },
  { label: "Dental and Medical Tourism", href: "/treatments/medical-tourism" },
];

const socialLinks = [
  { icon: <Facebook size={18} />, label: "Facebook", href: "#" },
  { icon: <Twitter size={18} />, label: "Twitter", href: "#" },
  { icon: <Instagram size={18} />, label: "Instagram", href: "#" },
  { icon: <Linkedin size={18} />, label: "LinkedIn", href: "#" },
];

export default function Footer() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <footer id="contact" className={styles.footer}>
      {/* Footer Content */}
      <div className={`container ${styles.footerContent} ${!isHomePage ? styles.footerNoNewsletter : ""}`}>
        {/* About Column */}
        <div className={styles.footerCol}>
          <Link href="/" className={styles.footerLogo} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/logo/medinexplus-logo-white.png" alt="MediNexPlus" style={{ height: 40, width: "auto", objectFit: "contain" }} />
          </Link>
          <h5 className={styles.footerTagline}>Smarter Healthcare Platform</h5>
          <p className={styles.footerAbout}>
            MediNex+ is a multi-tenant Hospital Management SaaS platform connecting doctors, patients, and administrators in one secure ecosystem.
          </p>
          <div className={styles.socialLinks}>
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className={styles.socialLink}
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <ul className={styles.linkList}>
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className={styles.footerLink}>
                  <ArrowRight size={14} />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Treatments */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Our Treatments</h4>
          <ul className={styles.linkList}>
            {treatmentLinks.map((treatment) => (
              <li key={treatment.label}>
                <Link href={treatment.href} className={styles.footerLink}>
                  <ArrowRight size={14} />
                  {treatment.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className={styles.footerCol}>
          <h4 className={styles.colTitle}>Contact Info</h4>
          <div className={styles.contactList}>
            <div className={styles.contactItem}>
              <MapPin size={18} className={styles.contactIcon} />
              <span>
                3/Alampat Business Centre, Near cycle circle,
                <br />
                Krushi Nagar, college road, Nashik 422001
              </span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={18} className={styles.contactIcon} />
              <span>+91 90590 53938</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={18} className={styles.contactIcon} />
              <span>support@medinexplus.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} MediNex+. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/cookie-policy">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
