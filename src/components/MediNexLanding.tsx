"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays, Stethoscope, ArrowRight, ChevronRight, CheckCircle,
  Sparkles, Star, Bell, MessageSquare, Activity, Pill, Users, TrendingUp,
  Building2, FlaskConical, BarChart3, Zap, Shield, Globe, Smartphone,
  Bot, RefreshCw, Settings, Rocket, Heart, Check,
  Search, AlertTriangle, Home, CreditCard, Package, User, FileText, RefreshCcw,
  Mic, Brain, ClipboardList, PenLine, Volume2, Waves, Wand2, Clock, ChevronDown
} from "lucide-react";
import Link from "next/link";

const PURPLE = "#7C3AED";
const PURPLE_DARK = "#6D28D9";
const PURPLE_LIGHT = "#8B5CF6";
const PURPLE_50 = "#F5F3FF";
const PURPLE_100 = "#EDE9FE";
const PURPLE_200 = "#DDD6FE";
const TEAL = "#0EA5E9";
const DARK = "#0F172A";
const GRAY = "#64748B";
const LIGHT_GRAY = "#F8FAFC";

export default function MediNexLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [aiTab, setAiTab] = useState<"smart" | "voice">("smart");
  const [rxStep, setRxStep] = useState(0);
  const [voiceActive, setVoiceActive] = useState(false);
  const [expandedPrice, setExpandedPrice] = useState<string | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingDemo(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      hospitalName: formData.get("hospitalName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      address: formData.get("address"),
      date: formData.get("date"),
      time: formData.get("time"),
    };

    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setDemoSuccess(true);
        setTimeout(() => {
          setIsDemoModalOpen(false);
          setTimeout(() => setDemoSuccess(false), 300); // reset state after closing
        }, 4000);
      } else {
        alert("Failed to request demo. Please try again later.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmittingDemo(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const faqs = [
    { q: "What is MediNex+ and who is it for?", a: "MediNex+ is a multi-tenant Hospital Management SaaS platform designed for hospitals, clinics, diagnostic labs, and pharmacies of any size. It connects doctors, patients, admins, and staff in one unified platform." },
    { q: "How do I onboard my hospital?", a: "Simply sign up, verify your email via OTP, and your hospital workspace is live in minutes. You can then invite doctors, staff, and configure your departments from the admin dashboard." },
    { q: "Is patient data secure and isolated per hospital?", a: "Absolutely. MediNex+ enforces strict multi-tenant data isolation — each hospital's data is completely separate. We use encrypted storage, secure JWT authentication, and role-based access control." },
    { q: "Can I manage multiple hospitals under one account?", a: "Yes. The Super Admin panel allows you to oversee multiple hospital tenants, monitor usage, manage subscriptions, and access consolidated analytics from a single dashboard." },
    { q: "Does MediNex+ support billing and pharmacy management?", a: "Yes — billing, pharmacy inventory, counter sales, IPD/OPD billing, lab reports, and finance dashboards are all built-in. No third-party integrations needed." },
    { q: "What support is included in all plans?", a: "All plans include email support and access to our knowledge base. Pro and Enterprise plans include priority support with dedicated account managers." },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      monthlyPrice: 499,
      annualPrice: 399,
      desc: "For small clinics & solo practitioners",
      badge: null as string | null,
      tag: "Get started free",
      websiteTag: "Clinic Profile Page + Booking",
      features: [
        { label: "Up to 3 Doctors", included: true },
        { label: "OPD & Appointments", included: true },
        { label: "Patient Registration & Records", included: true },
        { label: "Basic Billing & Invoicing", included: true },
        { label: "Department Configuration", included: true },
        { label: "Doctor Schedule Builder", included: true },
        { label: "Staff Management", included: true },
        { label: "Enquiry Management", included: true },
        { label: "Email Support", included: true },
        { label: "IPD & Ward Management", included: false },
        { label: "Pharmacy & Inventory", included: false },
        { label: "AI Smart Prescription", included: false },
      ],
      website: [
        { label: "1-Page Public Clinic Profile", included: true },
        { label: "Online Appointment Booking", included: true },
        { label: "Doctor Listing & Profiles", included: true },
        { label: "SEO Meta Tags & Structured Data", included: true },
        { label: "Contact & Enquiry Form", included: true },
        { label: "Multi-Page Website", included: false },
        { label: "Blog / Treatments Pages", included: false },
        { label: "Custom Domain & SSL", included: false },
      ],
    },
    {
      name: "Pro",
      monthlyPrice: 1299,
      annualPrice: 999,
      desc: "For growing hospitals with full clinical operations",
      badge: "Most Popular",
      tag: "Most chosen",
      websiteTag: "Multi-Page SEO Website + Booking Engine",
      features: [
        { label: "Up to 25 Doctors", included: true },
        { label: "OPD + IPD + Ward Management", included: true },
        { label: "Appointment & Follow-up System", included: true },
        { label: "Pharmacy Counter Sales & Inventory", included: true },
        { label: "Lab & Pathology Dashboard", included: true },
        { label: "Billing Queue & Finance Panel", included: true },
        { label: "AI Smart Prescription", included: true },
        { label: "Voice Prescription", included: true },
        { label: "Treatment Plans & Clinical Notes", included: true },
        { label: "Nursing Dashboard", included: true },
        { label: "WhatsApp Widget & Notifications", included: true },
        { label: "Reports & Analytics", included: true },
      ],
      website: [
        { label: "Multi-Page Hospital Website", included: true },
        { label: "Real-Time Online Booking Engine", included: true },
        { label: "Doctor Profiles & Specialty Pages", included: true },
        { label: "Services & Treatments Pages", included: true },
        { label: "SEO-Optimised Pages + XML Sitemap", included: true },
        { label: "About, Contact & Blog Pages", included: true },
        { label: "WhatsApp & Call-to-Action Widgets", included: true },
        { label: "Custom Domain & SSL", included: false },
      ],
    },
    {
      name: "Enterprise",
      monthlyPrice: 2999,
      annualPrice: 2399,
      desc: "For hospital networks, chains & multi-location care",
      badge: "Full Suite",
      tag: "Talk to us",
      websiteTag: "Custom-Branded Website + Full Booking Suite",
      features: [
        { label: "Unlimited Doctors & Staff", included: true },
        { label: "Multi-Hospital Super Admin", included: true },
        { label: "All Pro Features", included: true },
        { label: "Sub-department Dashboards", included: true },
        { label: "Ambulance / Biomedical / Housekeeping", included: true },
        { label: "Role-based Access (all roles)", included: true },
        { label: "AI Chatbot (Clinical Support)", included: true },
        { label: "Blog & Content Management", included: true },
        { label: "Medical Tourism Module", included: true },
        { label: "Receptionist & Nursing Admin Roles", included: true },
        { label: "Dedicated Account Manager", included: true },
        { label: "Priority SLA + 24/7 Phone Support", included: true },
      ],
      website: [
        { label: "Custom-Branded Multi-Page Website", included: true },
        { label: "Full Booking Engine + Patient Portal", included: true },
        { label: "Blog, Treatments & Medical Tourism Pages", included: true },
        { label: "Custom Domain & SSL Certificate", included: true },
        { label: "Advanced SEO + Schema Markup", included: true },
        { label: "Multi-Location Pages", included: true },
        { label: "Google Analytics Integration", included: true },
        { label: "Priority Website Support", included: true },
      ],
    },
  ];

  const testimonials = [
    { name: "Dr. Priya Sharma", role: "Cardiologist, Apollo Hospitals", avatar: "PS", rating: 5, text: "MediNex+ transformed how we manage patient flow. The appointment system and billing module saved us hours every day. Our staff productivity increased by 40%." },
    { name: "Rajesh Nair", role: "Hospital Administrator, Fortis Healthcare", avatar: "RN", rating: 5, text: "The multi-tenant architecture means all our branches run on one platform. Real-time analytics and the department management system are outstanding." },
    { name: "Dr. Amina Patel", role: "General Physician, City Clinic", avatar: "AP", rating: 5, text: "As a small clinic, the Starter plan gave us enterprise-level features at an affordable price. The OPD dashboard is intuitive and our patients love the experience." },
    { name: "Sanjay Mehta", role: "CEO, MedGroup Chain", avatar: "SM", rating: 5, text: "Managing 12 hospitals from a single Super Admin panel is a game-changer. Data isolation, role-based access, and consolidated reports — exactly what we needed." },
  ];

  const solutions = [
    { icon: <Building2 size={26} />, title: "Hospital Management", desc: "Complete OPD, IPD, ward, nursing, and administrative workflows under one roof.", color: "#EDE9FE", accent: PURPLE },
    { icon: <Pill size={26} />, title: "Pharmacy & Inventory", desc: "Counter sales, stock alerts, purchase orders, and pharmacy billing integrated seamlessly.", color: "#ECFDF5", accent: "#059669" },
    { icon: <FlaskConical size={26} />, title: "Lab & Diagnostics", desc: "Sample tracking, test reports, and pathology dashboards with smart result delivery.", color: "#FFF7ED", accent: "#EA580C" },
    { icon: <BarChart3 size={26} />, title: "Finance & Analytics", desc: "Real-time revenue analytics, billing queues, insurance claims, and financial reporting.", color: "#EFF6FF", accent: TEAL },
  ];

  const whyCards = [
    { icon: <CalendarDays size={22} />, title: "24/7 Online Booking", desc: "Patients can book appointments anytime, ensuring convenience without long calls or waiting lines." },
    { icon: <Bell size={22} />, title: "Automated Reminders", desc: "Smart SMS and email alerts reduce no-shows and keep both doctors and patients on schedule." },
    { icon: <Shield size={22} />, title: "Secure Digital Records", desc: "All patient histories, prescriptions, and reports are safely stored and easily accessible anytime." },
    { icon: <Smartphone size={22} />, title: "Seamless Multi-Device Access", desc: "Doctors and patients can use the platform on desktop, tablet, or mobile without limitations." },
    { icon: <CreditCard size={22} />, title: "Simplified Payments & Billing", desc: "Integrated payment options and billing systems make transactions faster and more transparent." },
  ];

  const steps = [
    { n: "01", title: "Register Your Hospital", desc: "Sign up with your hospital details, verify via OTP, and your secure workspace is ready.", icon: <Building2 size={28} /> },
    { n: "02", title: "Configure & Invite Team", desc: "Add departments, set up doctors, staff roles, schedules, and configure billing in minutes.", icon: <Settings size={28} /> },
    { n: "03", title: "Go Live & Manage", desc: "Start accepting patients, managing appointments, and accessing real-time dashboards.", icon: <Rocket size={28} /> },
  ];

  const trustedBy = ["Apollo Hospitals", "Fortis Healthcare", "AIIMS", "Max Healthcare", "Manipal Group", "Narayana Health"];

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital@1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; overflow-x: hidden; color: ${DARK}; }

        .mn-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 0 5%; transition: all 0.3s; }
        .mn-nav.scrolled { background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); box-shadow: 0 1px 32px rgba(124,58,237,0.08); }
        .mn-nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
        .mn-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .mn-logo-icon { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK}); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(124,58,237,0.35); flex-shrink: 0; }
        .mn-logo-text { font-size: 20px; font-weight: 800; color: ${DARK}; letter-spacing: -0.03em; }
        .mn-logo-plus { color: ${PURPLE}; }
        .mn-nav-links { display: flex; align-items: center; gap: 32px; }
        .mn-nav-links a { font-size: 14px; font-weight: 500; color: ${GRAY}; text-decoration: none; transition: color 0.2s; }
        .mn-nav-links a:hover { color: ${PURPLE}; }
        .mn-nav-cta { display: flex; align-items: center; gap: 12px; }
        .mn-btn-ghost { padding: 6px 18px; font-size: 13px; font-weight: 600; color: ${PURPLE}; background: transparent; border: 1.5px solid ${PURPLE_200}; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; text-decoration: none; }
        .mn-btn-ghost:hover { background: ${PURPLE_50}; border-color: ${PURPLE}; }
        .mn-btn-primary { padding: 6px 18px; font-size: 13px; font-weight: 600; color: #fff; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK}); border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; text-decoration: none; box-shadow: 0 2px 12px rgba(124,58,237,0.3); }
        .mn-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.4); }
        .mn-burger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 4px; }
        .mn-burger span { display: block; width: 22px; height: 2px; background: ${DARK}; border-radius: 2px; transition: all 0.3s; }
        @media (max-width: 768px) {
          .mn-nav-links, .mn-nav-cta { display: none; }
          .mn-burger { display: flex; }
          .mn-mobile-menu { position: fixed; top: 70px; left: 0; right: 0; background: #fff; padding: 20px 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); z-index: 999; display: flex; flex-direction: column; gap: 16px; border-top: 1px solid ${PURPLE_100}; }
          .mn-mobile-menu a { font-size: 15px; font-weight: 500; color: ${DARK}; text-decoration: none; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .mn-mobile-menu .mn-btn-primary, .mn-mobile-menu .mn-btn-ghost { width: 100%; text-align: center; padding: 12px; }
        }

        /* HERO */
        .mn-hero { min-height: 100vh; background: linear-gradient(170deg, #EDE8FF 0%, #F5F2FF 35%, #EAE6FF 65%, #F0ECFF 100%); display: flex; flex-direction: column; align-items: center; padding: 130px 5% 0; position: relative; overflow: hidden; text-align: center; }
        .mn-hero-orb1 { position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 900px; height: 550px; background: radial-gradient(ellipse, rgba(255,255,255,0.88) 0%, transparent 60%); pointer-events: none; z-index: 0; }
        .mn-hero-orb2 { position: absolute; top: 60px; right: -60px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 65%); pointer-events: none; z-index: 0; }
        .mn-hero-orb3 { position: absolute; top: 80px; left: -60px; width: 360px; height: 360px; background: radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 65%); pointer-events: none; z-index: 0; }
        .mn-hero-content { position: relative; z-index: 2; max-width: 820px; margin: 0 auto; width: 100%; }
        .mn-hero-badge { display: inline-flex; align-items: center; gap: 7px; padding: 6px 16px; background: rgba(255,255,255,0.9); border: 1px solid rgba(124,58,237,0.18); border-radius: 100px; font-size: 12px; font-weight: 600; color: ${PURPLE}; margin-bottom: 28px; backdrop-filter: blur(8px); box-shadow: 0 2px 10px rgba(124,58,237,0.08); }
        .mn-hero h1 { font-size: clamp(30px, 3.8vw, 52px); font-weight: 600; line-height: 1.12; letter-spacing: -0.022em; color: ${DARK}; margin-bottom: 16px; }
        .mn-hero h1 em { font-style: italic; font-family: 'Playfair Display', Georgia, serif; font-weight: 500; color: ${DARK}; }
        .mn-hero-sub { font-size: 15px; color: ${GRAY}; line-height: 1.7; margin: 0 auto 30px; max-width: 480px; font-weight: 400; }
        .mn-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        .mn-btn-hero-primary { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; font-size: 14px; font-weight: 600; color: #fff; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK}); border: none; border-radius: 100px; cursor: pointer; transition: all 0.25s; font-family: 'Inter', sans-serif; text-decoration: none; box-shadow: 0 3px 14px rgba(124,58,237,0.28); letter-spacing: 0.01em; }
        .mn-btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(124,58,237,0.4); }
        .mn-btn-hero-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 9px 24px; font-size: 14px; font-weight: 500; color: ${DARK}; background: rgba(255,255,255,0.92); border: 1.5px solid rgba(124,58,237,0.16); border-radius: 100px; cursor: pointer; transition: all 0.25s; font-family: 'Inter', sans-serif; text-decoration: none; backdrop-filter: blur(8px); letter-spacing: 0.01em; }
        .mn-btn-hero-ghost:hover { border-color: ${PURPLE}; color: ${PURPLE}; transform: translateY(-2px); }
        .mn-hero-stamp { position: absolute; right: calc(5% + 8px); top: 135px; width: 96px; height: 96px; z-index: 3; }
        .mn-stamp-ring { width: 96px; height: 96px; animation: stamp-spin 18s linear infinite; }
        .mn-stamp-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 36px; height: 36px; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK}); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(124,58,237,0.4); animation: stamp-counter 18s linear infinite; }
        @keyframes stamp-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes stamp-counter { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(-360deg)} }
        .mn-hero-dash-area { position: relative; width: 100%; max-width: 1040px; margin: 52px auto 0; z-index: 2; }
        .mn-hero-decos { display: flex; justify-content: space-between; padding: 0 56px; margin-bottom: -6px; }
        .mn-hero-deco { width: 50px; height: 50px; background: linear-gradient(145deg, ${PURPLE_LIGHT}, ${PURPLE}); border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
        .mn-hero-dash-window { background: #fff; border-radius: 18px 18px 0 0; box-shadow: 0 -4px 60px rgba(124,58,237,0.12), 0 24px 80px rgba(0,0,0,0.07); overflow: hidden; border: 1px solid rgba(124,58,237,0.08); border-bottom: none; }
        .mn-dash-topbar { display: flex; align-items: center; padding: 9px 16px; background: #fff; border-bottom: 1px solid #F1F5F9; gap: 10px; }
        .mn-dash-topbar-logo { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
        .mn-dash-topbar-logo-icon { width: 24px; height: 24px; border-radius: 6px; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK}); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mn-dash-topbar-logo-text { font-size: 13px; font-weight: 800; color: ${DARK}; letter-spacing: -0.02em; }
        .mn-dash-topbar-tabs { display: flex; gap: 2px; overflow: hidden; }
        .mn-dash-topbar-tab { padding: 5px 10px; border-radius: 7px; font-size: 11px; font-weight: 500; color: ${GRAY}; white-space: nowrap; }
        .mn-dash-topbar-tab.active { background: ${DARK}; color: #fff; }
        .mn-dash-topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .mn-dash-topbar-user { display: flex; align-items: center; gap: 6px; }
        .mn-dash-topbar-avatar { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT}); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
        .mn-dash-topbar-name { font-size: 11px; font-weight: 600; color: ${DARK}; }
        .mn-dash-body { display: grid; grid-template-columns: 18% 54% 28%; min-height: 340px; }
        .mn-dash-col { border-right: 1px solid #F1F5F9; padding: 14px; overflow: hidden; }
        .mn-dash-col:last-child { border-right: none; }
        .mn-dash-greet { background: linear-gradient(135deg, #5B21B6, #7C3AED); border-radius: 12px; padding: 14px; margin-bottom: 12px; position: relative; overflow: hidden; }
        .mn-dash-greet-bg { position: absolute; right: -12px; top: -12px; width: 70px; height: 70px; background: rgba(255,255,255,0.1); border-radius: 50%; }
        .mn-dash-greet-bg2 { position: absolute; right: 14px; bottom: -18px; width: 50px; height: 50px; background: rgba(255,255,255,0.07); border-radius: 50%; }
        .mn-dash-greet-name { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 3px; position: relative; z-index: 1; }
        .mn-dash-greet-sub { font-size: 10px; color: rgba(255,255,255,0.75); margin-bottom: 10px; position: relative; z-index: 1; }
        .mn-dash-greet-bar { height: 3px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden; position: relative; z-index: 1; }
        .mn-dash-greet-fill { height: 100%; width: 60%; background: rgba(255,255,255,0.65); border-radius: 4px; }
        .mn-dash-sec-title { font-size: 11px; font-weight: 700; color: ${DARK}; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
        .mn-dash-apt-item { display: flex; align-items: center; gap: 7px; padding: 8px; background: #F8FAFC; border-radius: 9px; margin-bottom: 6px; }
        .mn-dash-apt-item-av { width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
        .mn-dash-apt-item-name { font-size: 11px; font-weight: 600; color: ${DARK}; line-height: 1.3; }
        .mn-dash-apt-item-time { font-size: 9px; color: ${GRAY}; }
        .mn-dash-apt-item-dot { width: 6px; height: 6px; border-radius: 50%; margin-left: auto; flex-shrink: 0; }
        .mn-dash-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; margin-bottom: 12px; }
        .mn-dash-sc { border-radius: 10px; padding: 9px 7px; text-align: center; }
        .mn-dash-sc.purple { background: ${PURPLE_50}; } .mn-dash-sc.orange { background: #FFF7ED; } .mn-dash-sc.green { background: #F0FDF4; }
        .mn-dash-sc-iconw { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px; }
        .mn-dash-sc.purple .mn-dash-sc-iconw { background: ${PURPLE_100}; } .mn-dash-sc.orange .mn-dash-sc-iconw { background: #FEF3C7; } .mn-dash-sc.green .mn-dash-sc-iconw { background: #DCFCE7; }
        .mn-dash-sc-label { font-size: 8px; color: ${GRAY}; margin-bottom: 3px; line-height: 1.3; }
        .mn-dash-sc-val { font-size: 13px; font-weight: 800; color: ${DARK}; }
        .mn-dash-sc.orange .mn-dash-sc-val { color: #D97706; } .mn-dash-sc.green .mn-dash-sc-val { color: #059669; }
        .mn-dash-chart-area { background: #F8FAFC; border-radius: 10px; padding: 10px; margin-bottom: 10px; }
        .mn-dash-chart-title { font-size: 10px; font-weight: 600; color: ${DARK}; margin-bottom: 7px; }
        .mn-dash-bars { display: flex; align-items: flex-end; gap: 3px; height: 64px; }
        .mn-dash-bar { flex: 1; border-radius: 2px 2px 0 0; background: ${PURPLE_200}; }
        .mn-dash-bar.hi { background: ${PURPLE}; } .mn-dash-bar.gold { background: #F59E0B; }
        .mn-dash-progress-area { background: #F8FAFC; border-radius: 10px; padding: 10px; }
        .mn-dash-progress-title { font-size: 10px; font-weight: 600; color: ${DARK}; margin-bottom: 2px; }
        .mn-dash-progress-pct { font-size: 18px; font-weight: 800; color: ${DARK}; margin-bottom: 6px; }
        .mn-dash-doctor-card { display: flex; align-items: center; gap: 8px; padding: 9px; background: #F8FAFC; border-radius: 9px; margin-bottom: 10px; }
        .mn-dash-doctor-av { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, ${PURPLE_LIGHT}, ${PURPLE}); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .mn-dash-doctor-name { font-size: 11px; font-weight: 700; color: ${DARK}; }
        .mn-dash-doctor-sub { font-size: 9px; color: ${GRAY}; }
        .mn-dash-hist-item { display: flex; align-items: center; gap: 7px; padding: 7px 0; border-bottom: 1px solid #F1F5F9; }
        .mn-dash-hist-icon { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .mn-dash-hist-label { font-size: 10px; font-weight: 600; color: ${DARK}; }
        .mn-dash-hist-sub { font-size: 9px; color: ${GRAY}; }
        .mn-dash-msg-item { display: flex; align-items: center; gap: 7px; padding: 6px 0; border-bottom: 1px solid #F1F5F9; }
        .mn-dash-msg-av { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; }
        .mn-dash-msg-name { font-size: 10px; font-weight: 600; color: ${DARK}; }
        .mn-dash-msg-text { font-size: 9px; color: ${GRAY}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
        .mn-dash-msg-time { font-size: 9px; color: ${GRAY}; margin-left: auto; flex-shrink: 0; }
        .mn-dash-search { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 5px 9px; display: flex; align-items: center; gap: 5px; }
        .mn-dash-sidebar { background: #fff; border-right: 1px solid #F1F5F9; overflow: hidden; }
        .mn-dash-sidebar-gen { font-size: 7px; font-weight: 700; color: #94A3B8; letter-spacing: 0.1em; padding: 10px 12px 4px; text-transform: uppercase; }
        .mn-dash-nav-item { display: flex; align-items: center; gap: 6px; padding: 5px 10px; font-size: 10px; font-weight: 500; color: #64748B; border-left: 2.5px solid transparent; }
        .mn-dash-nav-item.active { background: linear-gradient(90deg,#EDE9FE,#F5F3FF); color: ${PURPLE}; font-weight: 600; border-left-color: ${PURPLE}; }
        .mn-dash-sidebar-footer { margin-top: auto; padding: 10px 12px; border-top: 1px solid #F1F5F9; display: flex; align-items: center; gap: 7px; }
        .mn-dash-sidebar-fav { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg,${PURPLE},${PURPLE_LIGHT}); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .mn-dash-main { padding: 12px; border-right: 1px solid #F1F5F9; overflow: hidden; }
        .mn-dash-pg-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
        .mn-dash-pg-title { font-size: 14px; font-weight: 700; color: ${DARK}; }
        .mn-dash-pg-sub { font-size: 8px; color: #94A3B8; margin-top: 2px; }
        .mn-dash-refresh-btn { display: flex; align-items: center; gap: 4px; font-size: 9px; color: #64748B; background: #F8FAFC; padding: 4px 8px; border-radius: 6px; border: 1px solid #E2E8F0; flex-shrink: 0; }
        .mn-dash-kpi-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-bottom: 8px; }
        .mn-dash-kpi-card { border-radius: 8px; padding: 8px 9px; border-width: 1px; border-style: solid; }
        .mn-dash-kpi-icon { width: 22px; height: 22px; border-radius: 7px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; }
        .mn-dash-kpi-lbl { font-size: 7.5px; font-weight: 500; color: #64748B; margin-bottom: 2px; line-height: 1.3; }
        .mn-dash-kpi-num { font-size: 17px; font-weight: 800; color: ${DARK}; line-height: 1; }
        .mn-dash-kpi-sub2 { font-size: 7.5px; color: #94A3B8; margin-top: 2px; }
        .mn-dash-mstats { display: flex; border: 1px solid #F1F5F9; border-radius: 7px; overflow: hidden; margin-bottom: 8px; }
        .mn-dash-mstat { flex: 1; padding: 5px 4px; border-right: 1px solid #F1F5F9; text-align: center; }
        .mn-dash-mstat:last-child { border-right: none; }
        .mn-dash-mstat-lbl { font-size: 7px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 2px; }
        .mn-dash-mstat-val { font-size: 14px; font-weight: 800; line-height: 1; }
        .mn-dash-chart-hd { font-size: 10px; font-weight: 700; color: ${DARK}; margin-bottom: 2px; }
        .mn-dash-chart-sub { font-size: 8px; color: #94A3B8; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
        .mn-dash-legend { display: flex; align-items: center; gap: 3px; font-size: 8px; color: #64748B; }
        .mn-dash-legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .mn-dash-right { padding: 12px; overflow: hidden; }
        .mn-dash-r-sec { font-size: 8px; font-weight: 700; color: #94A3B8; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; margin-top: 8px; }
        .mn-dash-r-sec:first-child { margin-top: 0; }
        .mn-dash-cal-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
        .mn-dash-cal-month { font-size: 12px; font-weight: 700; color: ${DARK}; }
        .mn-dash-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 1px; text-align: center; margin-bottom: 8px; }
        .mn-dash-cal-c { font-size: 8px; font-weight: 500; color: #475569; padding: 2px 0; }
        .mn-dash-cal-c.hd { color: #94A3B8; font-weight: 600; }
        .mn-dash-cal-c.td { background: ${PURPLE}; color: #fff; border-radius: 50%; font-weight: 700; }
        .mn-dash-cal-c.ot { visibility: hidden; }
        .mn-dash-alert-box { border-radius: 7px; padding: 6px 9px; margin-bottom: 5px; }
        .mn-dash-alert-box.red { background: #FEF2F2; border: 1px solid #FEE2E2; }
        .mn-dash-alert-box.ylw { background: #FFFBEB; border: 1px solid #FEF3C7; }
        .mn-dash-alert-ttl { font-size: 8.5px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .mn-dash-alert-box.red .mn-dash-alert-ttl { color: #DC2626; }
        .mn-dash-alert-box.ylw .mn-dash-alert-ttl { color: #D97706; }
        .mn-dash-alert-go { font-size: 7.5px; color: ${PURPLE}; margin-top: 2px; }
        .mn-dash-duty-hd { font-size: 10px; font-weight: 700; color: ${DARK}; display: flex; align-items: center; justify-content: space-between; }
        .mn-dash-duty-badge { background: #EDE9FE; color: ${PURPLE}; font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 8px; }
        .mn-dash-duty-row { display: flex; align-items: center; gap: 6px; padding: 4px 0; border-bottom: 1px solid #F8FAFC; }
        .mn-dash-duty-av { width: 22px; height: 22px; border-radius: 50%; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 700; color: #64748B; flex-shrink: 0; }
        .mn-dash-duty-nm { font-size: 9px; font-weight: 600; color: ${DARK}; }
        .mn-dash-duty-dp { font-size: 7.5px; color: #94A3B8; }
        .mn-dash-summary-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #F8FAFC; }
        .mn-hero-review { position: absolute; bottom: 30px; left: -28px; background: #fff; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.12); padding: 10px 14px; z-index: 10; border: 1px solid ${PURPLE_100}; animation: float-y 4s ease-in-out infinite; min-width: 155px; }
        .mn-hero-review-stars { display: flex; align-items: center; gap: 2px; margin-bottom: 4px; }
        .mn-hero-review-label { font-size: 11px; font-weight: 700; color: ${DARK}; margin-bottom: 5px; }
        .mn-hero-review-avatars { display: flex; }
        .mn-hero-review-av { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff; margin-left: -5px; display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 700; color: #fff; }
        .mn-hero-review-av:first-child { margin-left: 0; }
        .mn-hero-trusted { position: absolute; bottom: 140px; right: -32px; background: #fff; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.12); padding: 10px 14px; z-index: 10; border: 1px solid #FEF9C3; display: flex; align-items: center; gap: 9px; animation: float-y 4s ease-in-out infinite 1.5s; }
        .mn-hero-trusted-icon { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #F59E0B, #D97706); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mn-hero-trusted-label { font-size: 11px; font-weight: 700; color: ${DARK}; }
        .mn-hero-trusted-sub { font-size: 9px; color: ${GRAY}; }
        @keyframes float-y { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .mn-why-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: rgba(255,255,255,0.9); }
        .mn-how-step-icon { width: 64px; height: 64px; border-radius: 20px; background: ${PURPLE_50}; border: 2px solid ${PURPLE_200}; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: ${PURPLE}; }
        @media (max-width: 900px) { .mn-hero-stamp { display: none; } .mn-hero-review, .mn-hero-trusted { display: none; } }
        @media (max-width: 640px) { .mn-hero-decos { padding: 0 16px; } }

        /* TRUSTED */
        .mn-trusted { padding: 40px 5%; background: #fff; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
        .mn-trusted-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
        .mn-trusted-label { font-size: 12px; font-weight: 700; color: ${GRAY}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; }
        .mn-trusted-logos { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 32px; }
        .mn-trusted-logo { font-size: 14px; font-weight: 700; color: #94A3B8; letter-spacing: -0.01em; padding: 8px 20px; border: 1.5px solid #E2E8F0; border-radius: 8px; transition: all 0.2s; }
        .mn-trusted-logo:hover { color: ${PURPLE}; border-color: ${PURPLE_200}; background: ${PURPLE_50}; }

        /* SOLUTIONS */
        .mn-solutions { padding: 96px 5%; background: #F5F0FF; }
        .mn-solutions-inner { max-width: 1100px; margin: 0 auto; }
        .mn-solutions-hd { text-align: center; margin-bottom: 52px; }
        .mn-solutions-hd-title { font-size: clamp(28px, 3.5vw, 44px); font-weight: 800; color: ${DARK}; letter-spacing: -0.03em; margin-bottom: 14px; line-height: 1.15; }
        .mn-solutions-hd-sub { font-size: 16px; color: ${GRAY}; max-width: 500px; margin: 0 auto; line-height: 1.6; }
        .mn-section-tag { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: ${PURPLE_100}; border-radius: 100px; font-size: 12px; font-weight: 700; color: ${PURPLE}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
        .mn-section-title { font-size: clamp(28px, 3vw, 42px); font-weight: 800; color: ${DARK}; letter-spacing: -0.03em; margin-bottom: 12px; line-height: 1.2; }
        .mn-section-sub { font-size: 16px; color: ${GRAY}; line-height: 1.7; max-width: 600px; margin-bottom: 56px; }
        .mn-sol-big-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
        .mn-sol-big-card { border-radius: 22px; overflow: hidden; min-height: 480px; display: flex; flex-direction: column; }
        .mn-sol-big-card.pur { background: linear-gradient(150deg, ${PURPLE_DARK} 0%, ${PURPLE} 55%, ${PURPLE_LIGHT} 100%); }
        .mn-sol-big-card.wht { background: #fff; border: 1.5px solid ${PURPLE_100}; }
        .mn-sol-card-content { padding: 32px 32px 0; flex: 1; }
        .mn-sol-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; margin-bottom: 22px; }
        .mn-sol-big-card.pur .mn-sol-pill { background: rgba(255,255,255,0.18); color: rgba(255,255,255,0.92); }
        .mn-sol-big-card.wht .mn-sol-pill { background: ${PURPLE_100}; color: ${PURPLE}; }
        .mn-sol-pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .mn-sol-big-card.pur .mn-sol-pill-dot { background: rgba(255,255,255,0.55); }
        .mn-sol-big-card.wht .mn-sol-pill-dot { background: ${PURPLE}; }
        .mn-sol-card-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 22px; }
        .mn-sol-card-h { font-size: 22px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; flex: 1; }
        .mn-sol-big-card.pur .mn-sol-card-h { color: #fff; }
        .mn-sol-big-card.wht .mn-sol-card-h { color: ${DARK}; }
        .mn-sol-arrow-btn { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; }
        .mn-sol-big-card.pur .mn-sol-arrow-btn { background: rgba(255,255,255,0.22); }
        .mn-sol-big-card.wht .mn-sol-arrow-btn { background: ${PURPLE}; }
        .mn-sol-arrow-btn:hover { transform: scale(1.1) rotate(5deg); }
        .mn-sol-feat-list { display: flex; flex-direction: column; gap: 11px; }
        .mn-sol-feat { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; }
        .mn-sol-big-card.pur .mn-sol-feat { color: rgba(255,255,255,0.88); }
        .mn-sol-big-card.wht .mn-sol-feat { color: #334155; }
        .mn-sol-feat-check { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mn-sol-big-card.pur .mn-sol-feat-check { background: rgba(255,255,255,0.2); }
        .mn-sol-big-card.wht .mn-sol-feat-check { background: ${PURPLE_100}; }
        .mn-sol-card-mock { margin-top: 28px; height: 165px; overflow: hidden; }
        .mn-sol-mock-win { background: #fff; border-radius: 12px 12px 0 0; box-shadow: 0 -6px 28px rgba(0,0,0,0.13); padding: 10px 12px; height: 100%; overflow: hidden; }
        .mn-sol-big-card.wht .mn-sol-mock-win { background: #F8FAFC; border: 1px solid #E2E8F0; border-bottom: none; }
        .mn-sol-mock-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .mn-sol-mock-t { font-size: 10px; font-weight: 700; color: ${DARK}; }
        .mn-sol-mock-row { display: flex; align-items: center; gap: 7px; padding: 5px 0; border-bottom: 1px solid #F1F5F9; }
        .mn-sol-mock-av { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .mn-sol-mock-name { font-size: 9px; font-weight: 600; color: ${DARK}; flex: 1; min-width: 0; }
        .mn-sol-mock-bdg { font-size: 7.5px; font-weight: 600; padding: 2px 6px; border-radius: 10px; flex-shrink: 0; }
        @media (max-width: 768px) { .mn-sol-big-grid { grid-template-columns: 1fr; } .mn-sol-big-card { min-height: auto; } }

        /* WHY */
        .mn-why { padding: 72px 5%; background: #EDE9FE; }
        .mn-why-inner { max-width: 1100px; margin: 0 auto; }
        .mn-why-container { background: linear-gradient(140deg, #7C3AED 0%, #8B5CF6 50%, #A78BFA 100%); border-radius: 28px; padding: 56px 40px 48px; overflow: hidden; position: relative; }
        .mn-why-hd { text-align: center; margin-bottom: 36px; }
        .mn-why-hd-title { font-size: clamp(24px, 2.8vw, 38px); font-weight: 800; color: #fff; letter-spacing: -0.03em; margin-bottom: 10px; line-height: 1.2; }
        .mn-why-hd-sub { font-size: 14px; color: rgba(255,255,255,0.75); max-width: 520px; margin: 0 auto; line-height: 1.65; }
        .mn-why-grid-top { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 14px; }
        .mn-why-grid-bot { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .mn-why-card { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 26px 24px; transition: all 0.25s; }
        .mn-why-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.12); }
        .mn-why-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(124,58,237,0.07); border: 1.5px solid rgba(124,58,237,0.14); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #7C3AED; }
        .mn-why-title { font-size: 14.5px; font-weight: 700; color: ${DARK}; margin-bottom: 8px; }
        .mn-why-desc { font-size: 12.5px; color: ${GRAY}; line-height: 1.65; }
        @media (max-width: 768px) { .mn-why-container { padding: 36px 20px 32px; } .mn-why-grid-top { grid-template-columns: 1fr 1fr; } .mn-why-grid-bot { grid-template-columns: 1fr; } }
        @media (max-width: 520px) { .mn-why-grid-top { grid-template-columns: 1fr; } }

        /* HOW IT WORKS */
        .mn-how { padding: 96px 5%; background: #fff; }
        .mn-how-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
        .mn-how-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 32px; margin-top: 56px; position: relative; }
        .mn-how-step { position: relative; }
        .mn-how-step-num { font-size: 56px; font-weight: 900; color: ${PURPLE_100}; letter-spacing: -0.04em; line-height: 1; margin-bottom: 12px; }
        .mn-how-step-icon { width: 64px; height: 64px; border-radius: 20px; background: ${PURPLE_50}; border: 2px solid ${PURPLE_200}; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: ${PURPLE}; }
        .mn-how-step-title { font-size: 18px; font-weight: 700; color: ${DARK}; margin-bottom: 10px; }
        .mn-how-step-desc { font-size: 14px; color: ${GRAY}; line-height: 1.7; }
        .mn-how-connector { position: absolute; top: 80px; right: -16px; width: 32px; height: 2px; background: ${PURPLE_200}; display: none; }
        @media (min-width: 900px) { .mn-how-connector { display: block; } }

        /* TESTIMONIALS */
        .mn-testi { padding: 96px 5%; background: ${LIGHT_GRAY}; }
        .mn-testi-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
        .mn-testi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 56px; }
        .mn-testi-card { background: #fff; border-radius: 20px; padding: 28px; border: 1.5px solid ${PURPLE_100}; text-align: left; transition: all 0.3s; }
        .mn-testi-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(124,58,237,0.1); }
        .mn-testi-stars { display: flex; gap: 3px; margin-bottom: 16px; }
        .mn-star { color: #F59E0B; font-size: 16px; }
        .mn-testi-text { font-size: 14px; color: ${GRAY}; line-height: 1.8; margin-bottom: 20px; font-style: italic; }
        .mn-testi-author { display: flex; align-items: center; gap: 12px; }
        .mn-testi-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT}); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0; }
.mn-testi-name { font-size: 14px; font-weight: 700; color: ${DARK}; }
.mn-testi-role { font-size: 12px; color: ${GRAY}; }
        .mn-price-card.primary .mn-price-note { color: rgba(255,255,255,0.45); }
        .mn-price-web-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-radius: 10px; cursor: pointer; border: none; font-family: 'Inter',sans-serif; font-size: 12px; font-weight: 700; margin-top: 16px; transition: all 0.2s; }
        .mn-price-card:not(.primary) .mn-price-web-toggle { background: ${PURPLE_50}; color: ${PURPLE}; }
        .mn-price-card:not(.primary) .mn-price-web-toggle:hover { background: ${PURPLE_100}; }
        .mn-price-card.primary .mn-price-web-toggle { background: rgba(255,255,255,0.14); color: #fff; }
        .mn-price-card.primary .mn-price-web-toggle:hover { background: rgba(255,255,255,0.22); }
        .mn-price-web-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mn-price-card:not(.primary) .mn-price-web-icon { background: ${PURPLE_100}; color: ${PURPLE}; }
        .mn-price-card.primary .mn-price-web-icon { background: rgba(255,255,255,0.2); color: #fff; }
        .mn-price-web-tag { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 8px; }
        .mn-price-card:not(.primary) .mn-price-web-tag { background: #DCFCE7; color: #059669; }
        .mn-price-card.primary .mn-price-web-tag { background: rgba(255,255,255,0.18); color: rgba(255,255,255,0.85); }
        .mn-price-web-chevron { transition: transform 0.25s; display: flex; align-items: center; }
        .mn-price-web-chevron.open { transform: rotate(180deg); }
        .mn-price-web-list { list-style: none; display: flex; flex-direction: column; gap: 8px; padding: 14px 0 4px; }
        .mn-price-web-item { display: flex; align-items: center; gap: 9px; font-size: 12.5px; }
        .mn-price-card:not(.primary) .mn-price-web-item.on { color: ${DARK}; }
        .mn-price-card:not(.primary) .mn-price-web-item.off { color: #CBD5E1; }
        .mn-price-card.primary .mn-price-web-item { color: rgba(255,255,255,0.88); }
        .mn-price-web-dot { width: 17px; height: 17px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; }
        .mn-price-web-item.on .mn-price-web-dot { background: #DCFCE7; color: #059669; }
        .mn-price-card.primary .mn-price-web-item .mn-price-web-dot { background: rgba(255,255,255,0.18); color: #fff; }
        .mn-price-web-item.off .mn-price-web-dot { background: #F1F5F9; color: #CBD5E1; }

        /* FAQ */
        .mn-faq { padding: 96px 5%; background: #fff; }
        .mn-faq-inner { max-width: 800px; margin: 0 auto; text-align: center; }
        .mn-faq-list { margin-top: 48px; text-align: left; display: flex; flex-direction: column; gap: 12px; }
        .mn-faq-item { border: 1.5px solid ${PURPLE_100}; border-radius: 14px; overflow: hidden; transition: border-color 0.2s; }
        .mn-faq-item.open { border-color: ${PURPLE_200}; }
        .mn-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; text-align: left; }
        .mn-faq-q-text { font-size: 15px; font-weight: 600; color: ${DARK}; line-height: 1.5; }
        .mn-faq-item.open .mn-faq-q-text { color: ${PURPLE}; }
        .mn-faq-chevron { width: 28px; height: 28px; border-radius: 8px; background: ${PURPLE_50}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s; }
        .mn-faq-item.open .mn-faq-chevron { background: ${PURPLE}; transform: rotate(180deg); }
        .mn-faq-chevron svg { transition: stroke 0.2s; }
        .mn-faq-item.open .mn-faq-chevron svg { stroke: #fff; }
        .mn-faq-a { font-size: 14px; color: ${GRAY}; line-height: 1.8; padding: 0 24px 20px; }

        /* CTA */
        .mn-cta { padding: 88px 5%; background: linear-gradient(155deg, #EDE8FF 0%, #E4DCFF 45%, #EDE8FF 100%); position: relative; overflow: hidden; }
        .mn-cta-orb1 { position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 500px; height: 320px; background: radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, transparent 68%); pointer-events: none; }
        .mn-cta-orb2 { position: absolute; bottom: -80px; left: 50%; transform: translateX(-50%); width: 700px; height: 220px; background: radial-gradient(ellipse, rgba(124,58,237,0.14) 0%, transparent 68%); pointer-events: none; }
        .mn-cta-dots-l { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 260px; height: 300px; background-image: radial-gradient(circle, rgba(124,58,237,0.2) 1.5px, transparent 1.5px); background-size: 18px 18px; pointer-events: none; mask-image: linear-gradient(to right, black, transparent); -webkit-mask-image: linear-gradient(to right, black, transparent); }
        .mn-cta-dots-r { position: absolute; right: 0; top: 50%; transform: translateY(-50%); width: 260px; height: 300px; background-image: radial-gradient(circle, rgba(124,58,237,0.2) 1.5px, transparent 1.5px); background-size: 18px 18px; pointer-events: none; mask-image: linear-gradient(to left, black, transparent); -webkit-mask-image: linear-gradient(to left, black, transparent); }
        .mn-cta-inner { max-width: 720px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .mn-cta-icon { width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK}); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; box-shadow: 0 6px 22px rgba(124,58,237,0.35); }
        .mn-cta-badge { display: inline-flex; align-items: center; gap: 7px; padding: 5px 16px; background: rgba(255,255,255,0.78); border-radius: 100px; font-size: 12px; font-weight: 500; color: #334155; margin-bottom: 22px; border: 1px solid rgba(124,58,237,0.14); backdrop-filter: blur(8px); }
        .mn-cta-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: ${PURPLE}; flex-shrink: 0; }
        .mn-cta h2 { font-size: clamp(28px, 3.5vw, 50px); font-weight: 800; color: ${DARK}; letter-spacing: -0.03em; line-height: 1.12; margin-bottom: 16px; }
        .mn-cta h2 em { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 700; color: ${DARK}; }
        .mn-cta-sub { font-size: 16px; color: ${GRAY}; line-height: 1.65; margin-bottom: 36px; max-width: 620px; margin-left: auto; margin-right: auto; }
        .mn-cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .mn-btn-cta-primary { display: inline-flex; align-items: center; gap: 8px; padding: 10px 26px; font-size: 14px; font-weight: 600; color: #fff; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK}); border: none; border-radius: 100px; cursor: pointer; transition: all 0.25s; font-family: 'Inter', sans-serif; text-decoration: none; box-shadow: 0 4px 16px rgba(124,58,237,0.3); }
        .mn-btn-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
        .mn-btn-cta-outline { display: inline-flex; align-items: center; gap: 8px; padding: 9px 26px; font-size: 14px; font-weight: 500; color: ${DARK}; background: rgba(255,255,255,0.85); border: 1.5px solid rgba(124,58,237,0.2); border-radius: 100px; cursor: pointer; transition: all 0.25s; font-family: 'Inter', sans-serif; text-decoration: none; backdrop-filter: blur(8px); }
        .mn-btn-cta-outline:hover { border-color: ${PURPLE}; color: ${PURPLE}; transform: translateY(-2px); }

        /* DEMO MODAL */
        .mn-demo-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; padding: 20px; }
        .mn-demo-overlay.open { opacity: 1; pointer-events: auto; }
        .mn-demo-modal { background: #fff; width: 100%; max-width: 520px; border-radius: 20px; padding: 32px; position: relative; transform: translateY(20px) scale(0.95); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 24px 64px rgba(0,0,0,0.2); }
        .mn-demo-overlay.open .mn-demo-modal { transform: translateY(0) scale(1); }
        .mn-demo-close { position: absolute; top: 20px; right: 20px; background: #F1F5F9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${GRAY}; transition: all 0.2s; }
        .mn-demo-close:hover { background: #E2E8F0; color: ${DARK}; }
        .mn-demo-modal h3 { font-size: 22px; font-weight: 800; color: ${DARK}; margin-bottom: 8px; letter-spacing: -0.02em; }
        .mn-demo-modal p { font-size: 14px; color: ${GRAY}; margin-bottom: 24px; line-height: 1.5; }
        .mn-demo-form { display: grid; gap: 16px; }
        .mn-demo-form-group { display: flex; flex-direction: column; gap: 6px; text-align: left; }
        .mn-demo-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .mn-demo-form-group label { font-size: 12px; font-weight: 600; color: ${DARK}; }
        .mn-demo-form-group input { width: 100%; padding: 10px 14px; font-size: 14px; border: 1.5px solid #E2E8F0; border-radius: 10px; transition: border-color 0.2s; font-family: 'Inter', sans-serif; outline: none; }
        .mn-demo-form-group input:focus { border-color: ${PURPLE}; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        .mn-demo-submit { width: 100%; padding: 12px; background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK}); color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 8px; font-family: 'Inter', sans-serif; box-shadow: 0 4px 12px rgba(124,58,237,0.25); }
        .mn-demo-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124,58,237,0.35); }
        .mn-demo-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        @keyframes scaleIn { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }

        /* FREE TRIAL BUTTON */
        .mn-btn-free-trial { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 22px; font-size: 13px; font-weight: 600; color: #DC2626; background: transparent; border: 1.5px solid #DC2626; border-radius: 100px; cursor: pointer; text-decoration: none; position: relative; overflow: hidden; text-transform: lowercase; letter-spacing: 0.05em; transition: transform 0.2s; font-family: 'Inter', sans-serif; }
        .mn-btn-free-trial:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(220, 38, 38, 0.15); }

        /* FOOTER */
        .mn-footer { background: ${DARK}; padding: 72px 5% 32px; }
        .mn-footer-inner { max-width: 1200px; margin: 0 auto; }
        .mn-footer-top { display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 48px; margin-bottom: 56px; }
        @media (max-width: 900px) { .mn-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; } }
        @media (max-width: 500px) { .mn-footer-top { grid-template-columns: 1fr; } }
        .mn-footer-brand .mn-logo-text { color: #fff; }
        .mn-footer-brand p { font-size: 14px; color: #64748B; line-height: 1.7; margin-top: 16px; max-width: 280px; }
        .mn-footer-col-title { font-size: 13px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 20px; }
        .mn-footer-links { display: flex; flex-direction: column; gap: 12px; }
        .mn-footer-links a { font-size: 14px; color: #64748B; text-decoration: none; transition: color 0.2s; }
        .mn-footer-links a:hover { color: ${PURPLE_LIGHT}; }
        .mn-footer-divider { height: 1px; background: rgba(255,255,255,0.07); margin-bottom: 32px; }
        .mn-footer-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .mn-footer-copy { font-size: 13px; color: #475569; }
        .mn-footer-legal { display: flex; gap: 24px; }
        .mn-footer-legal a { font-size: 13px; color: #475569; text-decoration: none; transition: color 0.2s; }
        .mn-footer-legal a:hover { color: ${PURPLE_LIGHT}; }

        /* ── AI PRESCRIPTION SECTION ──────────────────────────────────── */
        .mn-ai-rx { padding: 100px 5%; background: linear-gradient(180deg, #0F0A1E 0%, #150D2E 55%, #0F172A 100%); position: relative; overflow: hidden; }
        .mn-ai-rx::before { content:''; position:absolute; top:-120px; left:50%; transform:translateX(-50%); width:900px; height:500px; background:radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 65%); pointer-events:none; }
        .mn-ai-rx::after  { content:''; position:absolute; bottom:-80px; right:-80px; width:420px; height:420px; background:radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%); pointer-events:none; }
        .mn-ai-rx-inner { max-width: 1140px; margin: 0 auto; position: relative; z-index: 1; }

        /* heading */
        .mn-ai-rx-header-area { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 56px; }
        .mn-ai-rx-hd { flex: 1; }
        .mn-ai-rx-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3); border-radius: 100px; font-size: 13px; font-weight: 600; color: #C4B5FD; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(124,58,237,0.1); }
        .mn-ai-rx-title { font-size: clamp(34px, 4.5vw, 52px); font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 18px; }
        .mn-ai-rx-title span { background: linear-gradient(135deg, #A78BFA, #60A5FA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .mn-ai-rx-sub { font-size: 17px; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 620px; margin: 0; font-weight: 400; }
        
        /* tab switcher */
        .mn-ai-tabs { display: flex; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 6px; flex-shrink: 0; }
        .mn-ai-tab { display: flex; align-items: center; gap: 9px; padding: 12px 28px; border-radius: 11px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; border: none; font-family: 'Inter',sans-serif; }
        .mn-ai-tab.off { background: transparent; color: rgba(255,255,255,0.45); }
        .mn-ai-tab.off:hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.04); }
        .mn-ai-tab.on.smart { background: linear-gradient(135deg, ${PURPLE}, #6D28D9); color: #fff; box-shadow: 0 4px 20px rgba(124,58,237,0.45); }
        .mn-ai-tab.on.voice { background: linear-gradient(135deg, #0EA5E9, #0284C7); color: #fff; box-shadow: 0 4px 20px rgba(14,165,233,0.45); }
        
        @media (max-width: 900px) { .mn-ai-rx-header-area { flex-direction: column; align-items: flex-start; gap: 32px; } }
        /* main layout */
        .mn-ai-body { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: start; }
        @media (max-width: 860px) { .mn-ai-body { grid-template-columns: 1fr; } }

        /* left: info panel */
        .mn-ai-info { display: flex; flex-direction: column; gap: 0; }
        .mn-ai-info-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px; }
        .mn-ai-info-label.smart { color: #A78BFA; }
        .mn-ai-info-label.voice { color: #38BDF8; }
        .mn-ai-info-h { font-size: clamp(22px, 2.2vw, 32px); font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 16px; }
        .mn-ai-info-p { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.75; margin-bottom: 32px; }

        /* benefit list */
        .mn-ai-benefits { display: flex; flex-direction: column; gap: 14px; margin-bottom: 36px; }
        .mn-ai-benefit { display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.07); transition: all 0.25s; cursor: default; }
        .mn-ai-benefit:hover { border-color: rgba(124,58,237,0.3); background: rgba(124,58,237,0.06); transform: translateX(4px); }
        .mn-ai-benefit.voice-b:hover { border-color: rgba(14,165,233,0.3); background: rgba(14,165,233,0.06); }
        .mn-ai-benefit-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mn-ai-benefit-icon.smart { background: rgba(124,58,237,0.2); color: #A78BFA; }
        .mn-ai-benefit-icon.voice { background: rgba(14,165,233,0.2); color: #38BDF8; }
        .mn-ai-benefit-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 3px; }
        .mn-ai-benefit-desc  { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; }

        /* stat row */
        .mn-ai-stats { display: flex; gap: 20px; flex-wrap: wrap; }
        .mn-ai-stat { display: flex; flex-direction: column; gap: 4px; }
        .mn-ai-stat-num { font-size: 28px; font-weight: 900; letter-spacing: -0.03em; line-height: 1; }
        .mn-ai-stat-num.smart { color: #A78BFA; }
        .mn-ai-stat-num.voice { color: #38BDF8; }
        .mn-ai-stat-lbl { font-size: 12px; color: rgba(255,255,255,0.45); font-weight: 500; }

        /* right: mockup card */
        .mn-ai-mock { background: #1A1035; border: 1px solid rgba(124,58,237,0.25); border-radius: 22px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04); }
        .mn-ai-mock.voice-mock { background: #0A1929; border-color: rgba(14,165,233,0.25); }
        .mn-ai-mock-topbar { display: flex; align-items: center; gap: 8px; padding: 14px 18px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .mn-ai-mock-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .mn-ai-mock-title { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); margin-left: 4px; }
        .mn-ai-mock-body { padding: 22px 20px; }

        /* smart rx mock elements */
        .mn-rx-patient-row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding: 12px 14px; background: rgba(255,255,255,0.04); border-radius: 11px; border: 1px solid rgba(255,255,255,0.06); }
        .mn-rx-pat-av { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, ${PURPLE}, #6D28D9); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .mn-rx-pat-name { font-size: 13px; font-weight: 700; color: #fff; }
        .mn-rx-pat-sub  { font-size: 11px; color: rgba(255,255,255,0.4); }
        .mn-rx-pat-badge { margin-left: auto; font-size: 10px; font-weight: 700; padding: 3px 9px; background: rgba(124,58,237,0.25); color: #C4B5FD; border-radius: 20px; border: 1px solid rgba(124,58,237,0.3); flex-shrink:0; }

        .mn-rx-section-lbl { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .mn-rx-diagnosis-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
        .mn-rx-diag-chip { font-size: 11px; font-weight: 600; padding: 4px 11px; border-radius: 20px; background: rgba(124,58,237,0.18); color: #C4B5FD; border: 1px solid rgba(124,58,237,0.28); }
        .mn-rx-ai-suggest { background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(109,40,217,0.08)); border: 1px solid rgba(124,58,237,0.3); border-radius: 13px; padding: 14px 15px; margin-bottom: 14px; position: relative; overflow:hidden; }
        .mn-rx-ai-suggest::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background: linear-gradient(90deg, ${PURPLE}, #60A5FA); border-radius: 13px 13px 0 0; }
        .mn-rx-ai-header { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
        .mn-rx-ai-hd-text { font-size: 11px; font-weight: 700; color: #A78BFA; }
        .mn-rx-med-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .mn-rx-med-row:last-child { border-bottom: none; }
        .mn-rx-med-dot { width: 6px; height: 6px; border-radius: 50%; background: #A78BFA; flex-shrink: 0; }
        .mn-rx-med-name { font-size: 12px; font-weight: 600; color: #fff; flex: 1; }
        .mn-rx-med-dose { font-size: 10px; color: rgba(255,255,255,0.45); flex-shrink: 0; }
        .mn-rx-typing-bar { display: flex; align-items: center; gap: 8px; padding: 10px 13px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; margin-top: 10px; }
        .mn-rx-typing-text { font-size: 11px; color: rgba(255,255,255,0.5); flex: 1; }
        .mn-rx-cursor { display: inline-block; width: 1.5px; height: 13px; background: #A78BFA; border-radius: 1px; animation: blink-cur 1s step-end infinite; margin-left: 2px; vertical-align: middle; }
        @keyframes blink-cur { 0%,100%{opacity:1} 50%{opacity:0} }
        .mn-rx-send-btn { width: 26px; height: 26px; border-radius: 7px; background: linear-gradient(135deg,${PURPLE},#6D28D9); display: flex; align-items: center; justify-content: center; flex-shrink:0; }
        .mn-rx-progress-steps { display: flex; align-items: center; gap: 0; margin-bottom: 16px; }
        .mn-rx-step { display: flex; align-items: center; gap: 6px; }
        .mn-rx-step-circle { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; flex-shrink:0; }
        .mn-rx-step-circle.done { background: #7C3AED; color: #fff; }
        .mn-rx-step-circle.active { background: rgba(124,58,237,0.25); color: #A78BFA; border: 1.5px solid #7C3AED; }
        .mn-rx-step-circle.idle { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.3); }
        .mn-rx-step-label { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.5); white-space:nowrap; }
        .mn-rx-step-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); margin: 0 6px; min-width: 14px; }

        /* voice mock elements */
        .mn-vr-waveform { display: flex; align-items: center; justify-content: center; gap: 3px; height: 60px; margin-bottom: 18px; }
        .mn-vr-bar { border-radius: 3px; background: linear-gradient(180deg, #38BDF8, #0EA5E9); animation: wave-bar 1.2s ease-in-out infinite; }
        @keyframes wave-bar { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
        .mn-vr-transcript { background: rgba(14,165,233,0.07); border: 1px solid rgba(14,165,233,0.2); border-radius: 13px; padding: 14px 15px; margin-bottom: 14px; }
        .mn-vr-transcript-lbl { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; color: #38BDF8; margin-bottom: 10px; }
        .mn-vr-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #38BDF8; flex-shrink:0; animation: pulse-dot 1s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
        .mn-vr-text { font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.7; }
        .mn-vr-text em { color: #38BDF8; font-style: normal; font-weight: 600; }
        .mn-vr-extracted { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }
        .mn-vr-ext-row { display: flex; align-items: center; gap: 9px; padding: 8px 11px; background: rgba(255,255,255,0.04); border-radius: 9px; border: 1px solid rgba(255,255,255,0.06); }
        .mn-vr-ext-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.07em; flex-shrink: 0; min-width: 80px; }
        .mn-vr-ext-val { font-size: 12px; font-weight: 600; color: #fff; }
        .mn-vr-ext-chip { margin-left: auto; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: rgba(14,165,233,0.2); color: #38BDF8; border: 1px solid rgba(14,165,233,0.3); flex-shrink:0; }
        .mn-vr-actions { display: flex; gap: 8px; }
        .mn-vr-btn { flex: 1; padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; font-family: 'Inter',sans-serif; transition: all 0.2s; }
        .mn-vr-btn.primary { background: linear-gradient(135deg, #0EA5E9, #0284C7); color: #fff; }
        .mn-vr-btn.outline { background: rgba(14,165,233,0.1); color: #38BDF8; border: 1px solid rgba(14,165,233,0.25); }
        .mn-vr-mic-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 18px; }
        .mn-vr-mic-ring { width: 72px; height: 72px; border-radius: 50%; background: rgba(14,165,233,0.1); border: 2px solid rgba(14,165,233,0.3); display: flex; align-items: center; justify-content: center; position:relative; }
        .mn-vr-mic-ring::before { content:''; position:absolute; inset:-8px; border-radius:50%; border: 1.5px solid rgba(14,165,233,0.15); animation: ring-pulse 2s ease-out infinite; }
        .mn-vr-mic-ring::after  { content:''; position:absolute; inset:-16px; border-radius:50%; border: 1px solid rgba(14,165,233,0.08); animation: ring-pulse 2s ease-out infinite 0.6s; }
        @keyframes ring-pulse { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.35)} }
        .mn-vr-status { font-size: 12px; font-weight: 600; color: #38BDF8; }
        .mn-vr-timer { font-size: 10px; color: rgba(255,255,255,0.35); }

        @media (max-width: 640px) { .mn-ai-tabs { flex-direction: column; width: 100%; } .mn-ai-tab { justify-content: center; } .mn-ai-stats { gap: 14px; } }

        /* ══════════════════════════════════════
           PRICING BASE STYLES
           ══════════════════════════════════════ */
        .mn-pricing { padding: 96px 5%; background: #F5F0FF; }
        .mn-pricing-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
        .mn-billing-toggle { display: inline-flex; background: #fff; border-radius: 12px; padding: 4px; border: 1.5px solid #EDE9FE; margin-bottom: 48px; }
        .mn-billing-opt { padding: 8px 20px; font-size: 13px; font-weight: 600; border: none; border-radius: 9px; cursor: pointer; transition: all 0.2s; font-family: 'Inter',sans-serif; }
        .mn-billing-opt.active { background: linear-gradient(135deg, ${PURPLE}, ${PURPLE_DARK}); color: #fff; box-shadow: 0 2px 10px rgba(124,58,237,0.3); }
        .mn-billing-opt.inactive { background: transparent; color: ${GRAY}; }
        .mn-billing-save { background: #DCFCE7; color: #059669; font-size: 10px; padding: 2px 6px; border-radius: 6px; margin-left: 6px; }
        .mn-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; text-align: left; }
        .mn-price-card { background: #fff; border-radius: 20px; padding: 32px 28px; border: 1.5px solid ${PURPLE_100}; position: relative; transition: all 0.3s; }
        .mn-price-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(124,58,237,0.12); }
        .mn-price-card.primary { background: linear-gradient(150deg, ${PURPLE}, #5B21B6); border-color: transparent; }
        .mn-price-card.primary:hover { box-shadow: 0 12px 40px rgba(124,58,237,0.35); }
        .mn-price-badge { position: absolute; top: -12px; right: 20px; background: linear-gradient(135deg, #F59E0B, #D97706); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 100px; }
        .mn-price-name { font-size: 20px; font-weight: 800; color: ${DARK}; margin-bottom: 6px; }
        .mn-price-card.primary .mn-price-name { color: #fff; }
        .mn-price-desc { font-size: 13px; color: ${GRAY}; margin-bottom: 20px; line-height: 1.5; }
        .mn-price-card.primary .mn-price-desc { color: rgba(255,255,255,0.7); }
        .mn-price-amount { display: flex; align-items: baseline; gap: 2px; margin-bottom: 4px; }
        .mn-price-currency { font-size: 20px; font-weight: 700; color: ${DARK}; }
        .mn-price-card.primary .mn-price-currency { color: #fff; }
        .mn-price-num { font-size: 42px; font-weight: 900; color: ${DARK}; letter-spacing: -0.03em; line-height: 1; }
        .mn-price-card.primary .mn-price-num { color: #fff; }
        .mn-price-per { font-size: 14px; color: ${GRAY}; font-weight: 500; margin-left: 2px; }
        .mn-price-card.primary .mn-price-per { color: rgba(255,255,255,0.6); }
        .mn-price-period-note { font-size: 12px; color: #94A3B8; margin-bottom: 20px; }
        .mn-price-card.primary .mn-price-period-note { color: rgba(255,255,255,0.5); }
        .mn-price-divider { height: 1px; background: ${PURPLE_100}; margin-bottom: 20px; }
        .mn-price-card.primary .mn-price-divider { background: rgba(255,255,255,0.15); }
        .mn-price-features { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .mn-price-feature { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; }
        .mn-price-feature.on { color: ${DARK}; }
        .mn-price-feature.off { color: #CBD5E1; }
        .mn-price-card.primary .mn-price-feature.on { color: rgba(255,255,255,0.9); }
        .mn-price-card.primary .mn-price-feature.off { color: rgba(255,255,255,0.3); }
        .mn-price-check { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
        .mn-price-feature.on .mn-price-check { background: #DCFCE7; color: #059669; }
        .mn-price-feature.off .mn-price-check { background: #F1F5F9; color: #CBD5E1; }
        .mn-price-card.primary .mn-price-feature .mn-price-check { background: rgba(255,255,255,0.15); color: #fff; }
        .mn-price-cta { width: 100%; padding: 12px; background: #fff; color: ${PURPLE}; border: 1.5px solid ${PURPLE_200}; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter',sans-serif; }
        .mn-price-cta:hover { background: ${PURPLE_50}; border-color: ${PURPLE}; }
        .mn-price-note { font-size: 11px; color: #94A3B8; text-align: center; margin-top: 12px; }

        /* ══════════════════════════════════════
           RESPONSIVE – TABLET (≤768px)
           ══════════════════════════════════════ */
        @media (max-width: 768px) {
          .mn-hero { padding: 100px 5% 0; min-height: auto; }
          .mn-hero h1 { font-size: clamp(24px, 5.5vw, 36px); }
          .mn-hero-sub { font-size: 13.5px; max-width: 400px; margin-bottom: 22px; }
          .mn-hero-badge { font-size: 11px; padding: 5px 12px; margin-bottom: 20px; }
          .mn-btn-hero-primary { padding: 9px 20px; font-size: 13px; }
          .mn-btn-free-trial { padding: 7px 16px; font-size: 12px; }
          .mn-hero-dash-area { transform: scale(0.82); transform-origin: top center; margin-bottom: -60px; }
          .mn-dash-body { min-height: 270px; }
          .mn-solutions { padding: 64px 5%; }
          .mn-solutions-hd-title { font-size: clamp(24px, 4vw, 32px); }
          .mn-solutions-hd-sub { font-size: 14px; }
          .mn-ai-rx { padding: 64px 5%; }
          .mn-ai-rx-title { font-size: clamp(28px, 4vw, 40px); }
          .mn-why { padding: 56px 5%; }
          .mn-how { padding: 64px 5%; }
          .mn-testi { padding: 64px 5%; }
          .mn-faq { padding: 64px 5%; }
          .mn-cta { padding: 56px 5%; }
          .mn-pricing { padding: 64px 5%; }
          .mn-pricing-grid { grid-template-columns: 1fr; max-width: 440px; margin: 0 auto; }
          .mn-section-title { font-size: clamp(24px, 4vw, 32px); }
          .mn-section-sub { font-size: 14px; }
          .mn-section-tag { font-size: 11px; padding: 4px 12px; }
        }

        /* ══════════════════════════════════════
           RESPONSIVE – MOBILE (≤640px)
           ══════════════════════════════════════ */
        @media (max-width: 640px) {
          .mn-hero { padding: 82px 4% 0; padding-bottom: 0; }
          .mn-hero h1 { font-size: clamp(22px, 5.8vw, 30px); margin-bottom: 10px; }
          .mn-hero-sub { font-size: 12.5px; line-height: 1.6; max-width: 340px; margin-bottom: 18px; }
          .mn-hero-badge { font-size: 10px; padding: 4px 10px; margin-bottom: 16px; gap: 5px; }
          .mn-btn-hero-primary { padding: 8px 18px; font-size: 12.5px; gap: 6px; }
          .mn-btn-free-trial { padding: 7px 14px; font-size: 11px; }
          .mn-hero-dash-area { margin-top: 20px; transform: scale(0.88); transform-origin: top center; margin-bottom: -60px; }
          .mn-hero-dash-window { border-radius: 14px 14px 0 0; }
          .mn-dash-body { min-height: 180px; max-height: 220px; overflow: hidden; grid-template-columns: 22% 78%; }
          .mn-dash-right { display: none; }
          .mn-dash-topbar { padding: 6px 10px; }
          .mn-dash-topbar-logo-text { display: none; }
          .mn-dash-pg-title { font-size: 12px; }
          .mn-dash-kpi-num { font-size: 14px; }
          .mn-dash-kpi-lbl { font-size: 6.5px; }
          .mn-solutions { padding: 48px 4%; }
          .mn-solutions-hd { margin-bottom: 32px; }
          .mn-solutions-hd-title { font-size: clamp(22px, 5vw, 28px); }
          .mn-solutions-hd-sub { font-size: 13px; }
          .mn-sol-card-content { padding: 24px 20px 0; }
          .mn-sol-card-h { font-size: 18px; }
          .mn-sol-feat { font-size: 12.5px; }
          .mn-sol-pill { font-size: 11px; padding: 4px 11px; }
          .mn-ai-rx { padding: 48px 4%; }
          .mn-ai-rx-badge { font-size: 11px; padding: 6px 14px; margin-bottom: 16px; }
          .mn-ai-rx-title { font-size: clamp(24px, 5vw, 34px); margin-bottom: 12px; }
          .mn-ai-rx-sub { font-size: 14px; }
          .mn-ai-info-h { font-size: clamp(20px, 4vw, 26px); }
          .mn-ai-info-p { font-size: 13px; }
          .mn-ai-benefit { padding: 12px 14px; }
          .mn-ai-benefit-title { font-size: 13px; }
          .mn-ai-benefit-desc { font-size: 12px; }
          .mn-ai-benefit-icon { width: 34px; height: 34px; }
          .mn-ai-stat-num { font-size: 22px; }
          .mn-ai-stat-lbl { font-size: 11px; }
          .mn-why { padding: 40px 4%; }
          .mn-why-container { padding: 28px 16px 24px; border-radius: 20px; }
          .mn-why-hd-title { font-size: clamp(20px, 4.5vw, 28px); }
          .mn-why-hd-sub { font-size: 12.5px; }
          .mn-why-card { padding: 20px 18px; border-radius: 14px; }
          .mn-why-icon { width: 32px; height: 32px; border-radius: 8px; margin-bottom: 12px; }
          .mn-why-title { font-size: 13px; }
          .mn-why-desc { font-size: 11.5px; }
          .mn-how { padding: 48px 4%; }
          .mn-how-step-num { font-size: 40px; }
          .mn-how-step-icon { width: 50px; height: 50px; border-radius: 14px; }
          .mn-how-step-title { font-size: 15px; }
          .mn-how-step-desc { font-size: 12.5px; }
          .mn-how-steps { gap: 24px; margin-top: 36px; }
          .mn-testi { padding: 48px 4%; }
          .mn-testi-card { padding: 22px; border-radius: 16px; }
          .mn-testi-text { font-size: 13px; margin-bottom: 16px; }
          .mn-testi-avatar { width: 36px; height: 36px; font-size: 12px; }
          .mn-testi-name { font-size: 13px; }
          .mn-testi-role { font-size: 11px; }
          .mn-star { font-size: 14px; }
          .mn-testi-grid { gap: 16px; margin-top: 36px; }
          .mn-pricing { padding: 48px 4%; }
          .mn-pricing-grid { gap: 18px; }
          .mn-price-card { padding: 24px 20px; border-radius: 16px; }
          .mn-price-name { font-size: 18px; }
          .mn-price-num { font-size: 34px; }
          .mn-price-desc { font-size: 12px; }
          .mn-price-feature { font-size: 12px; gap: 8px; }
          .mn-price-check { width: 16px; height: 16px; font-size: 9px; }
          .mn-billing-toggle { margin-bottom: 32px; }
          .mn-billing-opt { padding: 7px 16px; font-size: 12px; }
          .mn-faq { padding: 48px 4%; }
          .mn-faq-q { padding: 16px 18px; }
          .mn-faq-q-text { font-size: 13.5px; }
          .mn-faq-a { font-size: 13px; padding: 0 18px 16px; }
          .mn-faq-chevron { width: 24px; height: 24px; }
          .mn-faq-list { gap: 10px; margin-top: 36px; }
          .mn-cta { padding: 40px 4%; }
          .mn-cta h2 { font-size: clamp(22px, 5vw, 34px); }
          .mn-cta-sub { font-size: 14px; margin-bottom: 24px; }
          .mn-btn-cta-primary { padding: 9px 20px; font-size: 13px; }
          .mn-btn-cta-outline { padding: 8px 20px; font-size: 13px; }
          .mn-cta-badge { font-size: 11px; padding: 4px 12px; }
          .mn-footer { padding: 48px 4% 24px; }
          .mn-footer-brand p { font-size: 12.5px; }
          .mn-footer-col-title { font-size: 12px; margin-bottom: 14px; }
          .mn-footer-links a { font-size: 12.5px; }
          .mn-footer-copy { font-size: 11.5px; }
          .mn-footer-legal a { font-size: 11.5px; }
          .mn-trusted { padding: 28px 4%; }
          .mn-trusted-label { font-size: 10.5px; margin-bottom: 16px; }
          .mn-trusted-logos { gap: 12px; }
          .mn-trusted-logo { font-size: 11.5px; padding: 6px 14px; }
          .mn-section-title { font-size: clamp(22px, 4.5vw, 28px); }
          .mn-section-sub { font-size: 13px; margin-bottom: 32px; }
          .mn-section-tag { font-size: 10px; padding: 4px 10px; gap: 4px; }
          .mn-demo-modal { padding: 24px; border-radius: 16px; }
          .mn-demo-modal h3 { font-size: 18px; }
          .mn-demo-modal p { font-size: 13px; margin-bottom: 18px; }
          .mn-demo-form-row { grid-template-columns: 1fr; gap: 12px; }
          .mn-demo-form-group label { font-size: 11px; }
          .mn-demo-form-group input { padding: 8px 12px; font-size: 13px; }
          .mn-demo-submit { padding: 10px; font-size: 14px; }
          .mn-mobile-menu { top: 60px; padding: 16px; gap: 12px; }
          .mn-mobile-menu a { font-size: 13.5px; padding: 6px 0; }
        }

        /* ══════════════════════════════════════
           RESPONSIVE – SMALL MOBILE (≤420px)
           ══════════════════════════════════════ */
        @media (max-width: 420px) {
          .mn-nav-inner { padding: 14px 0; }
          .mn-nav { padding: 0 4%; }
          .mn-hero { padding: 74px 3.5% 0; padding-bottom: 0; }
          .mn-hero h1 { font-size: 21px; line-height: 1.18; letter-spacing: -0.015em; }
          .mn-hero-sub { font-size: 11.5px; line-height: 1.55; max-width: 280px; margin-bottom: 14px; }
          .mn-hero-badge { font-size: 9px; padding: 3px 9px; margin-bottom: 12px; }
          .mn-hero-actions { flex-direction: column; align-items: center; gap: 8px; width: 100%; max-width: 260px; margin: 0 auto; }
          .mn-btn-hero-primary { padding: 9px 22px; font-size: 12px; width: 100%; justify-content: center; }
          .mn-btn-free-trial { padding: 7px 18px; font-size: 10.5px; width: 100%; justify-content: center; }
          .mn-hero-dash-area { margin-top: 16px; transform: scale(0.82); transform-origin: top center; margin-bottom: -40px; }
          .mn-hero-decos { display: none; }
          .mn-dash-body { min-height: 160px; max-height: 190px; overflow: hidden; grid-template-columns: 100%; }
          .mn-dash-sidebar { display: none; }
          .mn-dash-right { display: none; }
          .mn-dash-main { border-right: none; }
          .mn-dash-nav-item { font-size: 8.5px; padding: 4px 8px; gap: 4px; }
          .mn-dash-sidebar-gen { font-size: 6px; padding: 8px 8px 3px; }
          .mn-dash-pg-title { font-size: 11px; }
          .mn-dash-pg-sub { font-size: 7px; }
          .mn-dash-kpi-row { grid-template-columns: repeat(2, 1fr); gap: 4px; }
          .mn-dash-kpi-num { font-size: 13px; }
          .mn-dash-kpi-lbl { font-size: 6px; }
          .mn-dash-kpi-card { padding: 6px; }
          .mn-dash-kpi-icon { width: 18px; height: 18px; margin-bottom: 3px; }
          .mn-dash-kpi-sub2 { font-size: 6px; }
          .mn-dash-mstat-lbl { font-size: 6px; }
          .mn-dash-mstat-val { font-size: 11px; }
          .mn-dash-chart-hd { font-size: 8px; }
          .mn-dash-chart-sub { font-size: 7px; }
          .mn-dash-cal-month { font-size: 10px; }
          .mn-dash-cal-c { font-size: 7px; }
          .mn-dash-alert-ttl { font-size: 7.5px; }
          .mn-dash-alert-go { font-size: 6.5px; }
          .mn-dash-duty-nm { font-size: 8px; }
          .mn-dash-duty-dp { font-size: 6.5px; }
          .mn-dash-duty-av { width: 18px; height: 18px; font-size: 6px; }
          .mn-dash-r-sec { font-size: 7px; }
          .mn-dash-refresh-btn { font-size: 8px; }
          .mn-solutions { padding: 40px 3.5%; }
          .mn-solutions-hd { margin-bottom: 24px; }
          .mn-solutions-hd-title { font-size: 21px; margin-bottom: 10px; }
          .mn-solutions-hd-sub { font-size: 12px; }
          .mn-sol-card-content { padding: 20px 16px 0; }
          .mn-sol-card-h { font-size: 16px; }
          .mn-sol-feat { font-size: 11.5px; gap: 8px; }
          .mn-sol-feat-check { width: 16px; height: 16px; }
          .mn-sol-pill { font-size: 10px; padding: 3px 10px; margin-bottom: 16px; }
          .mn-sol-arrow-btn { width: 34px; height: 34px; }
          .mn-sol-card-mock { margin-top: 20px; height: 140px; }
          .mn-sol-big-grid { gap: 16px; }
          .mn-ai-rx { padding: 40px 3.5%; }
          .mn-ai-rx-badge { font-size: 10px; padding: 5px 12px; letter-spacing: 0.06em; }
          .mn-ai-rx-title { font-size: 22px; margin-bottom: 10px; }
          .mn-ai-rx-sub { font-size: 13px; }
          .mn-ai-tab { padding: 10px 14px; font-size: 12px; gap: 6px; }
          .mn-ai-info-h { font-size: 19px; }
          .mn-ai-info-p { font-size: 12px; margin-bottom: 22px; }
          .mn-ai-benefit { padding: 10px 12px; gap: 10px; border-radius: 12px; }
          .mn-ai-benefit-icon { width: 30px; height: 30px; border-radius: 9px; }
          .mn-ai-benefit-title { font-size: 12px; }
          .mn-ai-benefit-desc { font-size: 11px; }
          .mn-ai-stat-num { font-size: 20px; }
          .mn-ai-stat-lbl { font-size: 10px; }
          .mn-ai-mock-body { padding: 16px 14px; }
          .mn-rx-pat-name { font-size: 12px; }
          .mn-rx-pat-sub { font-size: 10px; }
          .mn-rx-pat-badge { font-size: 9px; padding: 2px 7px; }
          .mn-rx-pat-av { width: 28px; height: 28px; font-size: 10px; }
          .mn-rx-diag-chip { font-size: 10px; padding: 3px 9px; }
          .mn-rx-med-name { font-size: 11px; }
          .mn-rx-med-dose { font-size: 9px; }
          .mn-vr-ext-label { font-size: 9px; min-width: 65px; }
          .mn-vr-ext-val { font-size: 11px; }
          .mn-vr-text { font-size: 11px; }
          .mn-vr-btn { font-size: 11px; padding: 8px; }
          .mn-why { padding: 32px 3.5%; }
          .mn-why-container { padding: 24px 14px 20px; border-radius: 18px; }
          .mn-why-hd { margin-bottom: 24px; }
          .mn-why-hd-title { font-size: 19px; }
          .mn-why-hd-sub { font-size: 11.5px; }
          .mn-why-card { padding: 16px 14px; border-radius: 12px; }
          .mn-why-icon { width: 28px; height: 28px; border-radius: 7px; margin-bottom: 10px; }
          .mn-why-title { font-size: 12px; margin-bottom: 5px; }
          .mn-why-desc { font-size: 10.5px; line-height: 1.6; }
          .mn-why-grid-top { gap: 10px; margin-bottom: 10px; }
          .mn-why-grid-bot { gap: 10px; }
          .mn-how { padding: 40px 3.5%; }
          .mn-how-step-num { font-size: 32px; margin-bottom: 8px; }
          .mn-how-step-icon { width: 44px; height: 44px; border-radius: 12px; margin-bottom: 14px; }
          .mn-how-step-title { font-size: 14px; margin-bottom: 6px; }
          .mn-how-step-desc { font-size: 11.5px; }
          .mn-how-steps { gap: 20px; margin-top: 28px; }
          .mn-testi { padding: 40px 3.5%; }
          .mn-testi-card { padding: 18px; border-radius: 14px; }
          .mn-testi-text { font-size: 12px; line-height: 1.7; margin-bottom: 14px; }
          .mn-testi-avatar { width: 32px; height: 32px; font-size: 11px; }
          .mn-testi-name { font-size: 12px; }
          .mn-testi-role { font-size: 10px; }
          .mn-star { font-size: 13px; }
          .mn-testi-grid { gap: 14px; margin-top: 28px; }
          .mn-pricing { padding: 40px 3.5%; }
          .mn-pricing-grid { gap: 14px; }
          .mn-price-card { padding: 20px 16px; border-radius: 14px; }
          .mn-price-name { font-size: 16px; }
          .mn-price-num { font-size: 28px; }
          .mn-price-currency { font-size: 16px; }
          .mn-price-per { font-size: 12px; }
          .mn-price-desc { font-size: 11px; margin-bottom: 16px; }
          .mn-price-feature { font-size: 11px; gap: 7px; }
          .mn-price-check { width: 15px; height: 15px; font-size: 8px; }
          .mn-price-features { gap: 8px; }
          .mn-price-web-toggle { font-size: 11px; padding: 9px 10px; }
          .mn-price-web-tag { font-size: 8px; padding: 2px 6px; }
          .mn-price-web-item { font-size: 11px; }
          .mn-price-web-dot { width: 15px; height: 15px; font-size: 8px; }
          .mn-billing-toggle { margin-bottom: 28px; }
          .mn-billing-opt { padding: 6px 14px; font-size: 11px; }
          .mn-billing-save { font-size: 9px; padding: 2px 5px; }
          .mn-price-period-note { font-size: 11px; }
          .mn-price-note { font-size: 10px; }
          .mn-faq { padding: 40px 3.5%; }
          .mn-faq-q { padding: 14px; }
          .mn-faq-q-text { font-size: 12.5px; }
          .mn-faq-a { font-size: 12px; padding: 0 14px 14px; line-height: 1.7; }
          .mn-faq-chevron { width: 22px; height: 22px; border-radius: 6px; }
          .mn-faq-list { gap: 8px; margin-top: 28px; }
          .mn-faq-item { border-radius: 12px; }
          .mn-cta { padding: 36px 3.5%; }
          .mn-cta h2 { font-size: 21px; margin-bottom: 10px; }
          .mn-cta-sub { font-size: 12.5px; margin-bottom: 20px; }
          .mn-cta-badge { font-size: 10px; padding: 3px 10px; margin-bottom: 14px; }
          .mn-cta-icon { width: 44px; height: 44px; }
          .mn-btn-cta-primary { padding: 9px 20px; font-size: 12px; }
          .mn-btn-cta-outline { padding: 8px 18px; font-size: 12px; }
          .mn-cta-actions { flex-direction: column; align-items: center; width: 100%; max-width: 260px; margin: 0 auto; }
          .mn-cta-actions > * { width: 100%; text-align: center; display: flex; justify-content: center; }
          .mn-footer { padding: 36px 3.5% 18px; }
          .mn-footer-top { gap: 24px; margin-bottom: 28px; }
          .mn-footer-brand p { font-size: 12px; max-width: 100%; }
          .mn-footer-col-title { font-size: 11px; margin-bottom: 10px; }
          .mn-footer-links { gap: 8px; }
          .mn-footer-links a { font-size: 12px; }
          .mn-footer-copy { font-size: 10.5px; }
          .mn-footer-legal a { font-size: 10.5px; }
          .mn-footer-legal { gap: 14px; }
          .mn-trusted { padding: 20px 3.5%; }
          .mn-trusted-label { font-size: 9.5px; margin-bottom: 12px; letter-spacing: 0.08em; }
          .mn-trusted-logos { gap: 7px; }
          .mn-trusted-logo { font-size: 10px; padding: 5px 10px; border-width: 1px; border-radius: 6px; }
          .mn-section-title { font-size: 21px; margin-bottom: 8px; }
          .mn-section-sub { font-size: 12px; margin-bottom: 24px; line-height: 1.6; }
          .mn-section-tag { font-size: 9px; padding: 3px 9px; gap: 4px; }
          .mn-demo-modal { padding: 18px; border-radius: 14px; max-height: 90vh; overflow-y: auto; }
          .mn-demo-modal h3 { font-size: 16px; }
          .mn-demo-modal p { font-size: 12px; margin-bottom: 14px; }
          .mn-demo-form { gap: 10px; }
          .mn-demo-form-group label { font-size: 10px; }
          .mn-demo-form-group input { padding: 7px 10px; font-size: 12px; border-radius: 8px; }
          .mn-demo-submit { padding: 9px; font-size: 13px; border-radius: 8px; }
          .mn-demo-close { width: 26px; height: 26px; top: 12px; right: 12px; }
          .mn-mobile-menu { top: 56px; padding: 14px; gap: 10px; }
          .mn-mobile-menu a { font-size: 13px; padding: 5px 0; }
          .mn-mobile-menu .mn-btn-primary, .mn-mobile-menu .mn-btn-ghost { padding: 10px; font-size: 12px; }
          .mn-logo img { height: 30px !important; }
          .mn-nav-inner { padding: 12px 0; }
        }
      ` }} />

      {/* NAVBAR */}
      <nav className={`mn-nav${scrolled ? " scrolled" : ""}`}>
        <div className="mn-nav-inner">
          <Link href="/" className="mn-logo">
            <img src="/logo/medinexplus-logo-normal.png" alt="MediNexPlus" className="mn-logo-img" style={{ height: 38, width: "auto", objectFit: "contain" }} />
          </Link>

          <div className="mn-nav-links">
            <a href="#solutions">Solutions</a>
            <a href="#ai-prescription">AI Rx</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="mn-nav-cta">
            <Link href="/login" className="mn-btn-ghost">Sign In</Link>
            <Link href="/signup" className="mn-btn-free-trial">free 14 days trial</Link>
          </div>

          <button className="mn-burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="mn-mobile-menu">
            <a href="#solutions" onClick={() => setMenuOpen(false)}>Solutions</a>
            <a href="#ai-prescription" onClick={() => setMenuOpen(false)}>AI Rx</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link href="/login" className="mn-btn-ghost" onClick={() => setMenuOpen(false)}>Sign In</Link>
            <Link href="/signup" className="mn-btn-free-trial" onClick={() => setMenuOpen(false)} style={{width: '100%'}}>free 14 days trial</Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="mn-hero" id="home">
        <div className="mn-hero-orb1" />
        <div className="mn-hero-orb2" />
        <div className="mn-hero-orb3" />

        {/* Rotating circular stamp */}
        <div className="mn-hero-stamp">
          <svg viewBox="0 0 96 96" width="96" height="96" className="mn-stamp-ring">
            <defs>
              <path id="mn-sp" d="M 48,48 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
            </defs>
            <text fill={PURPLE} fontSize="9" fontWeight="600" letterSpacing="1.6" fontFamily="Inter,sans-serif">
              <textPath href="#mn-sp">One Platform • Complete Care • Health •</textPath>
            </text>
          </svg>
          <div className="mn-stamp-center"><Sparkles size={15} color="#fff" /></div>
        </div>

        {/* Centered text */}
        <div className="mn-hero-content">
          <div className="mn-hero-badge">
            <Sparkles size={12} />
            Seamless healthcare
          </div>
          <h1>
            Smarter healthcare connecting doctors and patients <em>Anywhere!</em>
          </h1>
          <p className="mn-hero-sub">
            Connect doctors and patients with effortless scheduling, secure records, and smooth hospital operations — all in one platform.
          </p>
          <div className="mn-hero-actions">
            <button onClick={() => setIsDemoModalOpen(true)} className="mn-btn-hero-primary">
              <CalendarDays size={16} />
              Book Demo
            </button>
            <Link href="/signup" className="mn-btn-free-trial">
              free 14 days trial
            </Link>
          </div>
        </div>

        {/* Dashboard area */}
        <div className="mn-hero-dash-area">
          <div style={{ position: "relative" }}>
            {/* Floating review card */}
            <div className="mn-hero-review">
              <div className="mn-hero-review-stars">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} fill="#F59E0B" color="#F59E0B" />)}
                <span style={{ fontSize: 10, fontWeight: 700, color: DARK, marginLeft: 4 }}>4.9</span>
              </div>
              <div className="mn-hero-review-label">from client reviews</div>
              <div className="mn-hero-review-avatars">
                {([["PS", "#7C3AED"], ["RN", "#0EA5E9"], ["AP", "#059669"], ["SM", "#F59E0B"]] as [string, string][]).map(([init, bg], i) => (
                  <div key={i} className="mn-hero-review-av" style={{ background: bg }}>{init}</div>
                ))}
              </div>
            </div>
            {/* Trusted by doctors badge */}
            <div className="mn-hero-trusted">
              <div className="mn-hero-trusted-icon"><CheckCircle size={17} color="#fff" /></div>
              <div>
                <div className="mn-hero-trusted-label">Trusted by Doctors</div>
                <div className="mn-hero-trusted-sub">500+ hospitals onboard</div>
              </div>
            </div>
            {/* Dashboard window */}
            <div className="mn-hero-dash-window">
              {/* Top bar */}
              <div className="mn-dash-topbar">
                <div className="mn-dash-topbar-logo">
                  <div className="mn-dash-topbar-logo-icon"><Activity size={13} color="#fff" /></div>
                  <span className="mn-dash-topbar-logo-text">MediNex+</span>
                </div>
                <div className="mn-dash-search">
                  <Search size={10} color="#94A3B8" />
                  <span style={{ fontSize: 10, color: "#CBD5E1" }}>Search...</span>
                </div>
                <div className="mn-dash-topbar-right">
                  <div style={{ position: "relative", display: "flex" }}>
                    <Bell size={13} color="#94A3B8" />
                    <div style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, background: "#F59E0B", borderRadius: "50%", fontSize: 5, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>2</div>
                  </div>
                  <div className="mn-dash-topbar-user">
                    <div className="mn-dash-topbar-avatar">DJ</div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: DARK, lineHeight: 1.2 }}>Dr</div>
                      <div style={{ fontSize: 8, color: GRAY, lineHeight: 1 }}>Hosp. Admin</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dashboard body: sidebar + main + right */}
              <div className="mn-dash-body">
                {/* Sidebar */}
                <div className="mn-dash-sidebar">
                  <div className="mn-dash-sidebar-gen">General</div>
                  {([
                    { lbl: "Dashboard", icon: <Home size={10} />, active: true },
                    { lbl: "Appointments", icon: <CalendarDays size={10} />, active: false },
                    { lbl: "Billing", icon: <CreditCard size={10} />, active: false },
                    { lbl: "Inventory", icon: <Package size={10} />, active: false },
                    { lbl: "IPD / Wards", icon: <Building2 size={10} />, active: false },
                    { lbl: "Staff", icon: <Users size={10} />, active: false },
                    { lbl: "Doctors", icon: <Stethoscope size={10} />, active: false },
                    { lbl: "Patients", icon: <User size={10} />, active: false },
                    { lbl: "Departments", icon: <Settings size={10} />, active: false },
                    { lbl: "Enquiries", icon: <MessageSquare size={10} />, active: false },
                    { lbl: "Medical Tourism", icon: <Globe size={10} />, active: false },
                    { lbl: "Blogs", icon: <FileText size={10} />, active: false },
                  ] as { lbl: string, icon: React.ReactNode, active: boolean }[]).map((item, i) => (
                    <div key={i} className={`mn-dash-nav-item${item.active ? " active" : ""}`}>
                      {item.icon}{item.lbl}
                    </div>
                  ))}
                  <div className="mn-dash-sidebar-footer">
                    <div className="mn-dash-sidebar-fav">JB</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: DARK, lineHeight: 1.2 }}>Dr Jaybhave</div>
                      <div style={{ fontSize: 8, color: GRAY }}>Hospital Admin</div>
                    </div>
                  </div>
                </div>
                {/* Main */}
                <div className="mn-dash-main">
                  <div className="mn-dash-pg-hd">
                    <div>
                      <div className="mn-dash-pg-title">Dashboard</div>
                      <div className="mn-dash-pg-sub">Last updated 7:35:06 PM</div>
                    </div>
                    <div className="mn-dash-refresh-btn"><RefreshCcw size={9} /> Refresh</div>
                  </div>
                  <div className="mn-dash-kpi-row">
                    {([
                      { lbl: "Staff & Doctors", num: "2", sub: "2 active doctors", bg: "#F0FDF4", bc: "#DCFCE7", ib: "#22C55E", ic: <Users size={11} color="#fff" /> },
                      { lbl: "Total Patients", num: "6", sub: "+6 this month", bg: "#F0FDFA", bc: "#CCFBF1", ib: "#14B8A6", ic: <User size={11} color="#fff" /> },
                      { lbl: "Today Appointments", num: "1", sub: "0 completed", bg: "#EDE9FE", bc: "#DDD6FE", ib: PURPLE, ic: <CalendarDays size={11} color="#fff" /> },
                      { lbl: "Revenue Today", num: "₹0", sub: "₹2.5K this month", bg: "#FFF7ED", bc: "#FED7AA", ib: "#F59E0B", ic: <TrendingUp size={11} color="#fff" /> },
                    ] as { lbl: string, num: string, sub: string, bg: string, bc: string, ib: string, ic: React.ReactNode }[]).map((k, i) => (
                      <div key={i} className="mn-dash-kpi-card" style={{ background: k.bg, borderColor: k.bc }}>
                        <div className="mn-dash-kpi-icon" style={{ background: k.ib }}>{k.ic}</div>
                        <div className="mn-dash-kpi-lbl">{k.lbl}</div>
                        <div className="mn-dash-kpi-num">{k.num}</div>
                        <div className="mn-dash-kpi-sub2">{k.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mn-dash-mstats">
                    {([
                      { lbl: "Scheduled", val: "1", c: PURPLE },
                      { lbl: "Confirmed", val: "0", c: "#22C55E" },
                      { lbl: "Completed", val: "0", c: "#3B82F6" },
                      { lbl: "Cancelled", val: "0", c: "#EF4444" },
                      { lbl: "Pending Bills", val: "1", c: "#F59E0B" },
                      { lbl: "Active Plans", val: "0", c: "#14B8A6" },
                      { lbl: "Plans Done", val: "0", c: "#94A3B8" },
                    ] as { lbl: string, val: string, c: string }[]).map((s, i) => (
                      <div key={i} className="mn-dash-mstat">
                        <div className="mn-dash-mstat-lbl">{s.lbl}</div>
                        <div className="mn-dash-mstat-val" style={{ color: s.c }}>{s.val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mn-dash-chart-hd">Monthly Activity Trends</div>
                  <div className="mn-dash-chart-sub">
                    Appointments &amp; new patients · last 8 months
                    <div className="mn-dash-legend"><div className="mn-dash-legend-dot" style={{ background: PURPLE }} /> Appointments</div>
                    <div className="mn-dash-legend"><div className="mn-dash-legend-dot" style={{ background: "#22C55E" }} /> New Patients</div>
                  </div>
                  <svg width="100%" height="72" viewBox="0 0 260 72" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[16, 32, 48, 64].map(y => (
                      <line key={y} x1="0" y1={y} x2="260" y2={y} stroke="#F1F5F9" strokeWidth="0.5" />
                    ))}
                    <path d="M0,62 C40,60 80,58 120,56 C160,54 200,46 260,10" stroke={PURPLE} strokeWidth="1.5" fill="none" />
                    <path d="M0,62 C40,60 80,58 120,56 C160,54 200,46 260,10 L260,72 L0,72 Z" fill="url(#ag2)" />
                    <path d="M0,68 C40,67 80,66 120,65 C160,64 200,56 260,14" stroke="#22C55E" strokeWidth="1.5" fill="none" />
                    <circle cx="260" cy="10" r="3" fill={PURPLE} />
                    <circle cx="260" cy="14" r="3" fill="#22C55E" />
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    {["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"].map(m => (
                      <span key={m} style={{ fontSize: 7, color: "#94A3B8" }}>{m}</span>
                    ))}
                  </div>
                </div>
                {/* Right panel */}
                <div className="mn-dash-right">
                  <div className="mn-dash-r-sec" style={{ marginTop: 0 }}>Date</div>
                  <div className="mn-dash-cal-hd">
                    <div className="mn-dash-cal-month">May 2026</div>
                    <div style={{ display: "flex", gap: 3 }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={9} color="#64748B" style={{ transform: "rotate(180deg)" }} /></div>
                      <div style={{ width: 15, height: 15, borderRadius: 3, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={9} color="#64748B" /></div>
                    </div>
                  </div>
                  <div className="mn-dash-cal-grid">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <div key={i} className="mn-dash-cal-c hd">{d}</div>
                    ))}
                    {["", "", "", "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"].map((d, i) => (
                      <div key={i} className={`mn-dash-cal-c${d === "12" ? " td" : d === "" ? " ot" : ""}`}>{d}</div>
                    ))}
                  </div>
                  <div className="mn-dash-r-sec">Live Alerts</div>
                  <div className="mn-dash-alert-box red">
                    <div className="mn-dash-alert-ttl"><AlertTriangle size={9} />1 inventory item below minimum stock level</div>
                    <div className="mn-dash-alert-go">Go to Inventory → Check stock</div>
                  </div>
                  <div className="mn-dash-alert-box ylw">
                    <div className="mn-dash-alert-ttl"><AlertTriangle size={9} />1 bills pending collection</div>
                    <div className="mn-dash-alert-go">Go to Billing → Pending queue</div>
                  </div>
                  <div className="mn-dash-r-sec">Doctors on Duty Today</div>
                  <div className="mn-dash-duty-hd" style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 9, fontWeight: 500, color: GRAY }}>2 on duty</span>
                    <span className="mn-dash-duty-badge">2</span>
                  </div>
                  {([{ name: "Swapnil Pati", dept: "Dental Department", time: "08:00-13:00", init: "SP" }, { name: "Dr. Yogesh Salunke", dept: "Dermatology", time: "09:00-17:00", init: "YS" }] as { name: string, dept: string, time: string, init: string }[]).map((d, i) => (
                    <div key={i} className="mn-dash-duty-row">
                      <div className="mn-dash-duty-av">{d.init}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mn-dash-duty-nm">{d.name}</div>
                        <div className="mn-dash-duty-dp">{d.dept} · {d.time}</div>
                      </div>
                      <ChevronRight size={9} color="#CBD5E1" />
                    </div>
                  ))}
                  <div className="mn-dash-r-sec">Today&apos;s Summary</div>
                  {([{ lbl: "Follow-ups", val: "0" }, { lbl: "New Patients", val: "0" }] as { lbl: string, val: string }[]).map((s, i) => (
                    <div key={i} className="mn-dash-summary-row">
                      <span style={{ fontSize: 9, color: GRAY }}>{s.lbl}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: PURPLE }}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="mn-trusted">
        <div className="mn-trusted-inner">
          <p className="mn-trusted-label">Trusted by Leading Healthcare Providers</p>
          <div className="mn-trusted-logos">
            {trustedBy.map(name => (
              <div key={name} className="mn-trusted-logo">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTIONS */}
      <section className="mn-solutions" id="solutions">
        <div className="mn-solutions-inner">
          <div className="mn-solutions-hd">
            <h2 className="mn-solutions-hd-title">Smart solutions for every side of care</h2>
            <p className="mn-solutions-hd-sub">One platform to manage your entire healthcare ecosystem — from front desk to finance.</p>
          </div>
          <div className="mn-sol-big-grid">

            {/* Hospital Management — purple */}
            <div className="mn-sol-big-card pur">
              <div className="mn-sol-card-content">
                <div className="mn-sol-pill"><div className="mn-sol-pill-dot" />For hospital operations</div>
                <div className="mn-sol-card-title-row">
                  <div className="mn-sol-card-h">Hospital Management</div>
                  <div className="mn-sol-arrow-btn"><ArrowRight size={16} color="#fff" /></div>
                </div>
                <div className="mn-sol-feat-list">
                  {["Complete OPD & IPD workflows", "Ward & nursing management", "Administrative automation", "Staff & doctor scheduling", "Patient records & EMR"].map(f => (
                    <div key={f} className="mn-sol-feat">
                      <div className="mn-sol-feat-check"><Check size={10} color="rgba(255,255,255,0.9)" /></div>{f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mn-sol-card-mock">
                <div className="mn-sol-mock-win">
                  <div className="mn-sol-mock-topbar">
                    <div className="mn-sol-mock-t">OPD Dashboard</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <div style={{ background: "#EDE9FE", borderRadius: 4, padding: "2px 6px", fontSize: 8, fontWeight: 700, color: PURPLE }}>Today: 24</div>
                      <div style={{ background: "#F0FDF4", borderRadius: 4, padding: "2px 6px", fontSize: 8, fontWeight: 700, color: "#059669" }}>Beds: 12</div>
                    </div>
                  </div>
                  {([{ n: "Rahul Kumar", d: "General OPD", s: "In Progress", sb: "#EDE9FE", sc: PURPLE, ab: PURPLE }, { n: "Priya Sharma", d: "Cardiology", s: "Waiting", sb: "#FFF7ED", sc: "#D97706", ab: "#0EA5E9" }, { n: "Amit Singh", d: "Orthopedics", s: "Confirmed", sb: "#F0FDF4", sc: "#059669", ab: "#059669" }] as { n: string, d: string, s: string, sb: string, sc: string, ab: string }[]).map((r, i) => (
                    <div key={i} className="mn-sol-mock-row">
                      <div className="mn-sol-mock-av" style={{ background: r.ab }}>{r.n.split(" ").map((x: string) => x[0]).join("")}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="mn-sol-mock-name">{r.n}</div>
                        <div style={{ fontSize: 8, color: "#94A3B8" }}>{r.d}</div>
                      </div>
                      <div className="mn-sol-mock-bdg" style={{ background: r.sb, color: r.sc }}>{r.s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pharmacy & Inventory — white */}
            <div className="mn-sol-big-card wht">
              <div className="mn-sol-card-content">
                <div className="mn-sol-pill"><div className="mn-sol-pill-dot" />For pharmacy teams</div>
                <div className="mn-sol-card-title-row">
                  <div className="mn-sol-card-h">Pharmacy & Inventory</div>
                  <div className="mn-sol-arrow-btn"><ArrowRight size={16} color="#fff" /></div>
                </div>
                <div className="mn-sol-feat-list">
                  {["Counter sales & billing", "Real-time stock alerts", "Purchase order management", "Pharmacy billing integration", "Expiry & batch tracking"].map(f => (
                    <div key={f} className="mn-sol-feat">
                      <div className="mn-sol-feat-check"><Check size={10} color={PURPLE} /></div>{f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mn-sol-card-mock">
                <div className="mn-sol-mock-win">
                  <div className="mn-sol-mock-topbar">
                    <div className="mn-sol-mock-t">Pharmacy Stock</div>
                    <div style={{ background: "#FEF2F2", borderRadius: 4, padding: "2px 6px", fontSize: 8, fontWeight: 700, color: "#DC2626" }}>2 Low ⚠</div>
                  </div>
                  {([{ n: "Paracetamol 500mg", q: "245 units", ok: true }, { n: "Amoxicillin 250mg", q: "12 units", ok: false }, { n: "Metformin 500mg", q: "88 units", ok: true }] as { n: string, q: string, ok: boolean }[]).map((r, i) => (
                    <div key={i} className="mn-sol-mock-row">
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.ok ? "#22C55E" : "#EF4444", flexShrink: 0 }} />
                      <div className="mn-sol-mock-name">{r.n}</div>
                      <div style={{ fontSize: 8, fontWeight: 600, color: r.ok ? "#64748B" : "#EF4444", flexShrink: 0 }}>{r.q}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 6, background: "#FFFBEB", border: "1px solid #FEF3C7", borderRadius: 5, padding: "4px 7px", fontSize: 8, fontWeight: 600, color: "#D97706" }}>⚠ Amoxicillin below minimum stock level</div>
                </div>
              </div>
            </div>

            {/* Lab & Diagnostics — purple */}
            <div className="mn-sol-big-card pur">
              <div className="mn-sol-card-content">
                <div className="mn-sol-pill"><div className="mn-sol-pill-dot" />For lab teams</div>
                <div className="mn-sol-card-title-row">
                  <div className="mn-sol-card-h">Lab & Diagnostics</div>
                  <div className="mn-sol-arrow-btn"><ArrowRight size={16} color="#fff" /></div>
                </div>
                <div className="mn-sol-feat-list">
                  {["Sample collection & tracking", "Test report generation", "Pathology dashboards", "Smart result delivery", "Lab billing & invoicing"].map(f => (
                    <div key={f} className="mn-sol-feat">
                      <div className="mn-sol-feat-check"><Check size={10} color="rgba(255,255,255,0.9)" /></div>{f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mn-sol-card-mock">
                <div className="mn-sol-mock-win">
                  <div className="mn-sol-mock-topbar">
                    <div className="mn-sol-mock-t">Lab Reports</div>
                    <div style={{ background: "#F0FDF4", borderRadius: 4, padding: "2px 6px", fontSize: 8, fontWeight: 700, color: "#059669" }}>8 Completed</div>
                  </div>
                  {([{ t: "CBC — Complete Blood Count", s: "Complete", sb: "#F0FDF4", sc: "#059669" }, { t: "Liver Function Test (LFT)", s: "Pending", sb: "#FFF7ED", sc: "#D97706" }, { t: "Chest X-Ray", s: "Ready", sb: "#EDE9FE", sc: PURPLE }] as { t: string, s: string, sb: string, sc: string }[]).map((r, i) => (
                    <div key={i} className="mn-sol-mock-row">
                      <div style={{ flex: 1, minWidth: 0 }}><div className="mn-sol-mock-name">{r.t}</div></div>
                      <div className="mn-sol-mock-bdg" style={{ background: r.sb, color: r.sc }}>{r.s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Finance & Analytics — white */}
            <div className="mn-sol-big-card wht">
              <div className="mn-sol-card-content">
                <div className="mn-sol-pill"><div className="mn-sol-pill-dot" />For finance teams</div>
                <div className="mn-sol-card-title-row">
                  <div className="mn-sol-card-h">Finance & Analytics</div>
                  <div className="mn-sol-arrow-btn"><ArrowRight size={16} color="#fff" /></div>
                </div>
                <div className="mn-sol-feat-list">
                  {["Real-time revenue analytics", "Billing queue management", "Insurance claims processing", "Financial reporting", "Expense & payroll tracking"].map(f => (
                    <div key={f} className="mn-sol-feat">
                      <div className="mn-sol-feat-check"><Check size={10} color={PURPLE} /></div>{f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mn-sol-card-mock">
                <div className="mn-sol-mock-win">
                  <div className="mn-sol-mock-topbar">
                    <div className="mn-sol-mock-t">Revenue Analytics</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: DARK }}>₹1.24L <span style={{ fontSize: 8, color: "#22C55E", fontWeight: 600 }}>+18%</span></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 55, marginBottom: 6 }}>
                    {[35, 55, 42, 70, 58, 82, 65, 90, 76, 95, 68, 88].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: `${h}%`, background: i >= 9 ? PURPLE : "#EDE9FE", borderRadius: "3px 3px 0 0" }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map(m => (
                      <span key={m} style={{ fontSize: 7, color: "#94A3B8" }}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── AI PRESCRIPTION SECTION ── */}
      <section className="mn-ai-rx" id="ai-prescription">
        <div className="mn-ai-rx-inner">

          {/* Header Area */}
          <div className="mn-ai-rx-header-area">
            {/* Heading Text */}
            <div className="mn-ai-rx-hd">
              <div className="mn-ai-rx-badge"><Brain size={14} /> AI-Powered Innovation</div>
              <h2 className="mn-ai-rx-title">
                Prescription,<br /><span>reimagined by AI</span>
              </h2>
              <p className="mn-ai-rx-sub">
                Eliminate manual writing fatigue. Let AI draft complete prescriptions in seconds — or simply speak, and watch words become clinical records.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="mn-ai-tabs">
              <button
                className={`mn-ai-tab ${aiTab === "smart" ? "on smart" : "off"}`}
                onClick={() => setAiTab("smart")}
              >
                <Wand2 size={16} /> Smart Prescription
              </button>
              <button
                className={`mn-ai-tab ${aiTab === "voice" ? "on voice" : "off"}`}
                onClick={() => setAiTab("voice")}
              >
                <Mic size={16} /> Voice Prescription
              </button>
            </div>
          </div>

          {/* ── SMART PRESCRIPTION PANEL ── */}
          {aiTab === "smart" && (
            <div className="mn-ai-body">
              {/* LEFT: Info */}
              <div className="mn-ai-info">
                <div className="mn-ai-info-label smart">Smart Prescription</div>
                <h3 className="mn-ai-info-h">AI drafts prescriptions.<br />Doctors just review.</h3>
                <p className="mn-ai-info-p">
                  MediNex+ analyses patient history, vitals, and diagnosis in real-time to auto-generate accurate prescriptions — reducing the doctor&apos;s writing load by up to 80% while maintaining clinical precision.
                </p>

                <div className="mn-ai-benefits">
                  {([
                    { icon: <Brain size={18} />, title: "Context-Aware Suggestions", desc: "AI reads past diagnoses, allergies & medications to suggest the safest drug regimen instantly." },
                    { icon: <ClipboardList size={18} />, title: "Auto-fill Prescription Template", desc: "Complete Rx — medicine, dosage, frequency, duration — generated with one click from symptoms." },
                    { icon: <PenLine size={18} />, title: "Zero Handwriting Errors", desc: "Digital prescriptions eliminate illegible handwriting — improving pharmacy accuracy and patient safety." },
                    { icon: <Clock size={18} />, title: "Save 15+ Minutes Per Patient", desc: "Doctors spend more time on care, not paperwork. Prescription time drops from minutes to seconds." },
                  ] as { icon: React.ReactNode; title: string; desc: string }[]).map((b, i) => (
                    <div key={i} className="mn-ai-benefit">
                      <div className="mn-ai-benefit-icon smart">{b.icon}</div>
                      <div>
                        <div className="mn-ai-benefit-title">{b.title}</div>
                        <div className="mn-ai-benefit-desc">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mn-ai-stats">
                  {([
                    { num: "80%", lbl: "Less writing time" },
                    { num: "3x", lbl: "Faster prescription" },
                    { num: "99%", lbl: "Accuracy rate" },
                  ] as { num: string; lbl: string }[]).map((s, i) => (
                    <div key={i} className="mn-ai-stat">
                      <div className="mn-ai-stat-num smart">{s.num}</div>
                      <div className="mn-ai-stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Smart Rx Mockup */}
              <div className="mn-ai-mock">
                <div className="mn-ai-mock-topbar">
                  <div className="mn-ai-mock-dot" style={{ background: "#FF5F57" }} />
                  <div className="mn-ai-mock-dot" style={{ background: "#FEBC2E" }} />
                  <div className="mn-ai-mock-dot" style={{ background: "#28C840" }} />
                  <div className="mn-ai-mock-title">MediNex+ · Smart Prescription</div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "2px 9px", background: "rgba(124,58,237,0.2)", borderRadius: 20, border: "1px solid rgba(124,58,237,0.35)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA" }}>AI Active</span>
                  </div>
                </div>
                <div className="mn-ai-mock-body">
                  {/* Patient Row */}
                  <div className="mn-rx-patient-row">
                    <div className="mn-rx-pat-av">RK</div>
                    <div>
                      <div className="mn-rx-pat-name">Rahul Kumar</div>
                      <div className="mn-rx-pat-sub">Male, 34 yrs · OPD #2847</div>
                    </div>
                    <div className="mn-rx-pat-badge">AI Ready</div>
                  </div>

                  {/* Progress steps */}
                  <div className="mn-rx-progress-steps">
                    {([
                      { label: "Symptoms", state: "done" },
                      { label: "Diagnosis", state: "done" },
                      { label: "AI Rx", state: "active" },
                      { label: "Review", state: "idle" },
                    ] as { label: string; state: string }[]).map((s, i, arr) => (
                      <React.Fragment key={i}>
                        <div className="mn-rx-step">
                          <div className={`mn-rx-step-circle ${s.state}`}>
                            {s.state === "done" ? "✓" : i + 1}
                          </div>
                          <div className="mn-rx-step-label">{s.label}</div>
                        </div>
                        {i < arr.length - 1 && <div className="mn-rx-step-line" />}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Diagnosis chips */}
                  <div className="mn-rx-section-lbl">Diagnosis</div>
                  <div className="mn-rx-diagnosis-row">
                    {["Upper Respiratory Infection", "Mild Fever", "Pharyngitis"].map(d => (
                      <div key={d} className="mn-rx-diag-chip">{d}</div>
                    ))}
                  </div>

                  {/* AI Suggestion block */}
                  <div className="mn-rx-ai-suggest">
                    <div className="mn-rx-ai-header">
                      <Brain size={13} color="#A78BFA" />
                      <div className="mn-rx-ai-hd-text">AI-Generated Prescription</div>
                      <div style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Generated in 1.2s</div>
                    </div>
                    {([
                      { name: "Amoxicillin 500mg", dose: "1-0-1 · 5 days" },
                      { name: "Paracetamol 650mg", dose: "1-1-1 · SOS" },
                      { name: "Cetirizine 10mg", dose: "0-0-1 · 3 days" },
                      { name: "Vitamin C 500mg", dose: "1-0-0 · 7 days" },
                    ] as { name: string; dose: string }[]).map((m, i) => (
                      <div key={i} className="mn-rx-med-row">
                        <div className="mn-rx-med-dot" />
                        <div className="mn-rx-med-name">{m.name}</div>
                        <div className="mn-rx-med-dose">{m.dose}</div>
                      </div>
                    ))}
                  </div>

                  {/* Doctor notes typing bar */}
                  <div className="mn-rx-typing-bar">
                    <PenLine size={12} color="rgba(255,255,255,0.3)" />
                    <div className="mn-rx-typing-text">
                      Add doctor notes<span className="mn-rx-cursor" />
                    </div>
                    <div className="mn-rx-send-btn"><ArrowRight size={12} color="#fff" /></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── VOICE PRESCRIPTION PANEL ── */}
          {aiTab === "voice" && (
            <div className="mn-ai-body">
              {/* LEFT: Info */}
              <div className="mn-ai-info">
                <div className="mn-ai-info-label voice">Voice Prescription</div>
                <h3 className="mn-ai-info-h">Speak once.<br />AI writes it all.</h3>
                <p className="mn-ai-info-p">
                  Doctors dictate prescriptions naturally — just like talking to a colleague. MediNex+ transcribes speech in real-time, extracts medicines, dosage & instructions, and structures a complete digital Rx without typing a single character.
                </p>

                <div className="mn-ai-benefits">
                  {([
                    { icon: <Mic size={18} />, title: "Real-Time Voice Transcription", desc: "Industry-leading speech recognition converts every word to structured clinical text with 97% accuracy." },
                    { icon: <Waves size={18} />, title: "Natural Language Processing", desc: "AI understands medical terminology, dosage patterns and multi-drug dictation from natural conversation." },
                    { icon: <Volume2 size={18} />, title: "Hands-Free Workflow", desc: "Doctors never touch the keyboard during consultation — focus stays entirely on the patient." },
                    { icon: <Zap size={18} />, title: "Instant Structured Output", desc: "Voice input becomes a fully formatted Rx with medicine names, dosages & duration auto-extracted." },
                  ] as { icon: React.ReactNode; title: string; desc: string }[]).map((b, i) => (
                    <div key={i} className="mn-ai-benefit voice-b">
                      <div className="mn-ai-benefit-icon voice">{b.icon}</div>
                      <div>
                        <div className="mn-ai-benefit-title">{b.title}</div>
                        <div className="mn-ai-benefit-desc">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Voice Mockup */}
              <div className="mn-ai-mock voice-mock">
                <div className="mn-ai-mock-topbar">
                  <div className="mn-ai-mock-dot" style={{ background: "#FF5F57" }} />
                  <div className="mn-ai-mock-dot" style={{ background: "#FEBC2E" }} />
                  <div className="mn-ai-mock-dot" style={{ background: "#28C840" }} />
                  <div className="mn-ai-mock-title">MediNex+ · Voice Prescription</div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "2px 9px", background: "rgba(14,165,233,0.15)", borderRadius: 20, border: "1px solid rgba(14,165,233,0.3)" }}>
                    <div className="mn-vr-live-dot" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#38BDF8" }}>Recording</span>
                  </div>
                </div>
                <div className="mn-ai-mock-body">
                  {/* Mic + waveform */}
                  <div className="mn-vr-mic-wrap">
                    <div className="mn-vr-mic-ring">
                      <Mic size={28} color="#38BDF8" />
                    </div>
                    <div className="mn-vr-status">Listening to Doctor...</div>
                    <div className="mn-vr-timer">00:00:42</div>
                  </div>

                  {/* Waveform bars */}
                  <div className="mn-vr-waveform">
                    {[12, 28, 18, 42, 36, 52, 44, 60, 38, 54, 30, 46, 24, 40, 16, 34, 20, 48, 32, 56].map((h, i) => (
                      <div
                        key={i}
                        className="mn-vr-bar"
                        style={{
                          width: 4,
                          height: `${h}px`,
                          animationDelay: `${i * 0.06}s`,
                          opacity: voiceActive ? 1 : 0.5,
                        }}
                      />
                    ))}
                  </div>

                  {/* Live transcript */}
                  <div className="mn-vr-transcript">
                    <div className="mn-vr-transcript-lbl">
                      <div className="mn-vr-live-dot" />
                      Live Transcript
                    </div>
                    <div className="mn-vr-text">
                      "Patient has <em>upper respiratory infection</em>. Prescribe <em>Amoxicillin 500mg</em> twice daily for five days, <em>Paracetamol 650mg</em> as needed for fever, and <em>Vitamin C</em> once daily..."
                    </div>
                  </div>

                  {/* Extracted fields */}
                  <div className="mn-vr-extracted">
                    {([
                      { label: "Diagnosis", val: "URI, Pharyngitis" },
                      { label: "Medicine 1", val: "Amoxicillin 500mg · BD × 5d" },
                      { label: "Medicine 2", val: "Paracetamol 650mg · SOS" },
                      { label: "Supplement", val: "Vitamin C 500mg · OD × 7d" },
                    ] as { label: string; val: string }[]).map((r, i) => (
                      <div key={i} className="mn-vr-ext-row">
                        <div className="mn-vr-ext-label">{r.label}</div>
                        <div className="mn-vr-ext-val">{r.val}</div>
                        <div className="mn-vr-ext-chip">Auto ✓</div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="mn-vr-actions">
                    <button className="mn-vr-btn primary">Save Prescription</button>
                    <button className="mn-vr-btn outline">Re-record</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="mn-why" id="features">
        <div className="mn-why-inner">
          <div className="mn-why-container">
            <div className="mn-why-hd">
              <h2 className="mn-why-hd-title">Why choose our platform?</h2>
              <p className="mn-why-hd-sub">Streamline healthcare with effortless booking, secure records, and smarter management for doctors and patients.</p>
            </div>
            {/* top row — 3 cards */}
            <div className="mn-why-grid-top">
              {whyCards.slice(0, 3).map(c => (
                <div key={c.title} className="mn-why-card">
                  <div className="mn-why-icon">{c.icon}</div>
                  <h3 className="mn-why-title">{c.title}</h3>
                  <p className="mn-why-desc">{c.desc}</p>
                </div>
              ))}
            </div>
            {/* bottom row — 2 wider cards */}
            <div className="mn-why-grid-bot">
              {whyCards.slice(3).map(c => (
                <div key={c.title} className="mn-why-card">
                  <div className="mn-why-icon">{c.icon}</div>
                  <h3 className="mn-why-title">{c.title}</h3>
                  <p className="mn-why-desc">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mn-how">
        <div className="mn-how-inner">
          <div className="mn-section-tag" style={{ margin: "0 auto 16px" }}>
            <Settings size={12} />
            How It Works
          </div>
          <h2 className="mn-section-title">From booking to consultation</h2>
          <p className="mn-section-sub" style={{ margin: "0 auto 0" }}>Get your hospital live in 3 simple steps — no tech team required.</p>
          <div className="mn-how-steps">
            {steps.map((s, i) => (
              <div key={s.n} className="mn-how-step" style={{ position: "relative" }}>
                {i < steps.length - 1 && (
                  <div style={{ position: "absolute", top: 88, right: -16, width: 32, height: 2, background: PURPLE_200, display: "none" }} className="mn-how-connector" />
                )}
                <div className="mn-how-step-num">{s.n}</div>
                <div className="mn-how-step-icon">{s.icon}</div>
                <h3 className="mn-how-step-title">{s.title}</h3>
                <p className="mn-how-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mn-testi">
        <div className="mn-testi-inner">
          <div className="mn-section-tag" style={{ margin: "0 auto 16px" }}>
            <Heart size={12} fill="currentColor" />
            Testimonials
          </div>
          <h2 className="mn-section-title">Trusted by doctors and patients</h2>
          <p className="mn-section-sub" style={{ margin: "0 auto 0" }}>See what healthcare professionals say about managing their hospitals with MediNex+.</p>
          <div className="mn-testi-grid">
            {testimonials.map(t => (
              <div key={t.name} className="mn-testi-card">
                <div className="mn-testi-stars">
                  {Array.from({ length: t.rating }).map((_, i) => <span key={i} className="mn-star">★</span>)}
                </div>
                <p className="mn-testi-text">"{t.text}"</p>
                <div className="mn-testi-author">
                  <div className="mn-testi-avatar">{t.avatar}</div>
                  <div>
                    <div className="mn-testi-name">{t.name}</div>
                    <div className="mn-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mn-pricing" id="pricing">
        <div className="mn-pricing-inner">
          <div className="mn-section-tag" style={{ margin: "0 auto 16px" }}>
            <BarChart3 size={12} /> Pricing
          </div>
          <h2 className="mn-section-title">Simple, transparent pricing</h2>
          <p className="mn-section-sub" style={{ margin: "0 auto 32px" }}>Only pay for what you need. Every plan includes real, built features — no upsells, no surprises.</p>
          <div className="mn-billing-toggle">
            <button className={`mn-billing-opt ${!annualBilling ? "active" : "inactive"}`} onClick={() => setAnnualBilling(false)}>Monthly</button>
            <button className={`mn-billing-opt ${annualBilling ? "active" : "inactive"}`} onClick={() => setAnnualBilling(true)}>
              Annual <span className="mn-billing-save">Save 20%</span>
            </button>
          </div>
          <div className="mn-pricing-grid">
            {pricingPlans.map(p => {
              const price = annualBilling ? p.annualPrice : p.monthlyPrice;
              const isPro = p.name === "Pro";
              const cardClass = isPro ? "primary" : "";
              const webOpen = expandedPrice === p.name;
              return (
                <div key={p.name} className={`mn-price-card ${cardClass}`}>
                  {p.badge && <div className="mn-price-badge">{p.badge}</div>}
                  <div className="mn-price-name">{p.name}</div>
                  <div className="mn-price-desc">{p.desc}</div>
                  <div className="mn-price-amount">
                    <span className="mn-price-currency">₹</span>
                    <span className="mn-price-num">{price.toLocaleString("en-IN")}</span>
                    <span className="mn-price-per">/mo</span>
                  </div>
                  <div className="mn-price-period-note">
                    {annualBilling ? `Billed ₹${(price * 12).toLocaleString("en-IN")}/year` : "Billed monthly · cancel anytime"}
                  </div>
                  <div className="mn-price-divider" />
                  <ul className="mn-price-features">
                    {p.features.map(f => (
                      <li key={f.label} className={`mn-price-feature ${f.included ? "on" : "off"}`}>
                        <span className="mn-price-check">{f.included ? "✓" : "–"}</span>
                        {f.label}
                      </li>
                    ))}
                  </ul>

                  {/* Website & Booking accordion */}
                  <button
                    className="mn-price-web-toggle"
                    onClick={() => setExpandedPrice(webOpen ? null : p.name)}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span className="mn-price-web-icon">
                        <Globe size={12} />
                      </span>
                      <span>Website &amp; Booking Engine</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span className="mn-price-web-tag">{p.websiteTag}</span>
                      <span className={`mn-price-web-chevron${webOpen ? " open" : ""}`}>
                        <ChevronRight size={13} style={{ transform: "rotate(90deg)" }} />
                      </span>
                    </span>
                  </button>
                  {webOpen && (
                    <ul className="mn-price-web-list">
                      {p.website.map(w => (
                        <li key={w.label} className={`mn-price-web-item ${w.included ? "on" : "off"}`}>
                          <span className="mn-price-web-dot">{w.included ? "✓" : "–"}</span>
                          {w.label}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link href={p.name === "Enterprise" ? "/contact" : "/signup"} style={{ display: "block", textDecoration: "none", marginTop: 20 }}>
                    {p.name === "Enterprise" ? (
                      <button className="mn-price-cta">{p.tag}</button>
                    ) : (
                      <button className="mn-btn-free-trial" style={{ width: "100%", justifyContent: "center" }}>
                        free 14 days trial
                      </button>
                    )}
                  </Link>
                  <div className="mn-price-note">No credit card required</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mn-faq" id="faq">
        <div className="mn-faq-inner">
          <div className="mn-section-tag" style={{ margin: "0 auto 16px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            FAQ
          </div>
          <h2 className="mn-section-title">Frequently asked questions</h2>
          <p className="mn-section-sub" style={{ margin: "0 auto 0" }}>Everything you need to know about MediNex+.</p>
          <div className="mn-faq-list">
            {faqs.map((f, i) => (
              <div key={i} className={`mn-faq-item${openFaq === i ? " open" : ""}`}>
                <button className="mn-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="mn-faq-q-text">{f.q}</span>
                  <span className="mn-faq-chevron">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </span>
                </button>
                {openFaq === i && <p className="mn-faq-a">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mn-cta">
        <div className="mn-cta-orb1" />
        <div className="mn-cta-orb2" />
        <div className="mn-cta-dots-l" />
        <div className="mn-cta-dots-r" />
        <div className="mn-cta-inner">
          <div className="mn-cta-badge">
            <div className="mn-cta-badge-dot" />
            One step to better care
          </div>
          <h2>Take the next step in <em>Healthcare.</em></h2>
          <p className="mn-cta-sub">
            Whether you&apos;re a patient looking for care or a doctor managing appointments, our platform makes it simple, secure, and seamless for everyone.
          </p>
          <div className="mn-cta-actions">
            <button onClick={() => setIsDemoModalOpen(true)} className="mn-btn-cta-primary">Book Demo</button>
            <Link href="/signup" className="mn-btn-free-trial">free 14 days trial</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mn-footer">
        <div className="mn-footer-inner">
          <div className="mn-footer-top">
            <div className="mn-footer-brand">
              <Link href="/" className="mn-logo">
                <img src="/logo/medinexplus-logo-white.png" alt="MediNexPlus" style={{ height: 36, width: "auto", objectFit: "contain" }} />
              </Link>
              <p>Smarter healthcare connecting doctors and patients. The multi-tenant HMS SaaS platform for modern healthcare providers.</p>
            </div>
            <div>
              <div className="mn-footer-col-title">Product</div>
              <div className="mn-footer-links">
                <a href="#solutions">Solutions</a>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <Link href="/signup">Get Started</Link>
              </div>
            </div>
            <div>
              <div className="mn-footer-col-title">Company</div>
              <div className="mn-footer-links">
                <a href="#">About Us</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
                <a href="#">Contact</a>
              </div>
            </div>
            <div>
              <div className="mn-footer-col-title">Legal</div>
              <div className="mn-footer-links">
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/terms-of-service">Terms of Service</Link>
                <Link href="/cookie-policy">Cookie Policy</Link>
              </div>
            </div>
          </div>
          <div className="mn-footer-divider" />
          <div className="mn-footer-bottom">
            <p className="mn-footer-copy">© {new Date().getFullYear()} MediNex+. All rights reserved. | Product By <a href="https://theblueintellect.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#A78BFA', textDecoration: 'none', fontWeight: 600 }}>The Blue Intellect</a></p>
            <div className="mn-footer-legal">
              <Link href="/privacy-policy">Privacy</Link>
              <Link href="/terms-of-service">Terms</Link>
              <Link href="/cookie-policy">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* DEMO MODAL */}
      <div className={`mn-demo-overlay ${isDemoModalOpen ? 'open' : ''}`} onClick={() => setIsDemoModalOpen(false)}>
        <div className="mn-demo-modal" onClick={e => e.stopPropagation()}>
          <button className="mn-demo-close" onClick={() => setIsDemoModalOpen(false)}><ArrowRight size={16} style={{ transform: 'rotate(45deg)' }} /></button>
          
          {demoSuccess ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 80, height: 80, background: "#10B981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "scaleIn 0.5s ease-out" }}>
                <Check size={40} color="#fff" />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: DARK, marginBottom: 12 }}>Request Received!</h3>
              <p style={{ fontSize: 16, color: GRAY, lineHeight: 1.6 }}>Thank you. We have sent a confirmation email to your inbox. Our experts will contact you shortly to confirm your demo slot.</p>
            </div>
          ) : (
            <>
              <h3>Book a Personalized Demo</h3>
              <p>See how MediNex+ can transform your hospital's operations. Fill out the form below and our experts will reach out to confirm your slot.</p>
              <form className="mn-demo-form" onSubmit={handleDemoSubmit}>
                <div className="mn-demo-form-row">
                  <div className="mn-demo-form-group">
                    <label>Full Name</label>
                    <input type="text" name="name" placeholder="Dr. John Doe" required />
                  </div>
                  <div className="mn-demo-form-group">
                    <label>Hospital/Clinic Name</label>
                    <input type="text" name="hospitalName" placeholder="City General Hospital" required />
                  </div>
                </div>
                <div className="mn-demo-form-row">
                  <div className="mn-demo-form-group">
                    <label>Contact Number</label>
                    <input type="tel" name="phone" placeholder="+91 98765 43210" required />
                  </div>
                  <div className="mn-demo-form-group">
                    <label>Email ID</label>
                    <input type="email" name="email" placeholder="john@hospital.com" required />
                  </div>
                </div>
                <div className="mn-demo-form-group">
                  <label>Hospital Address</label>
                  <input type="text" name="address" placeholder="123 Health Ave, Mumbai" required />
                </div>
                <div className="mn-demo-form-row">
                  <div className="mn-demo-form-group">
                    <label>Preferred Date</label>
                    <input type="date" name="date" required />
                  </div>
                  <div className="mn-demo-form-group">
                    <label>Preferred Time</label>
                    <input type="time" name="time" required />
                  </div>
                </div>
                <button type="submit" className="mn-demo-submit" disabled={isSubmittingDemo}>
                  {isSubmittingDemo ? "Sending Request..." : "Request Demo"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
