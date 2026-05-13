"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, Loader2, Search, ChevronDown } from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./contact.module.css";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden",
  "Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago",
  "Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const DEPARTMENTS = [
  "Dental","Skin","Hair","HNF Cancer","Facial Trauma",
  "Body Shaping","Nutrition","Sexual Health","Premium Aesthetic","Medical Tourism",
];

const ENQUIRY_TYPES = [
  "General Inquiry","Appointment Booking","Treatment Information","Cost Estimate","Feedback","Complaint","Other",
];

/* ── Searchable Country Dropdown ── */
function CountryDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.dropdownWrap} ref={ref}>
      <button type="button" className={styles.dropdownTrigger} onClick={() => setOpen(o => !o)}>
        <span className={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {value || "Select country"}
        </span>
        <ChevronDown size={14} className={styles.dropdownChevron} />
      </button>
      {open && (
        <div className={styles.dropdownPanel}>
          <div className={styles.dropdownSearch}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.dropdownSearchInput}
              autoFocus
            />
          </div>
          <ul className={styles.dropdownList}>
            {filtered.length === 0 && <li className={styles.dropdownEmpty}>No results</li>}
            {filtered.map(c => (
              <li
                key={c}
                className={`${styles.dropdownOption} ${c === value ? styles.dropdownOptionActive : ""}`}
                onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function ContactPage() {
  const [form, setForm] = useState({
    fullName: "", mobile: "", email: "",
    gender: "", city: "", state: "", country: "",
    pincode: "", department: "", enquiryType: "", details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus("success");
        setShowModal(true);
        setForm({ fullName: "", mobile: "", email: "", gender: "", city: "", state: "", country: "", pincode: "", department: "", enquiryType: "", details: "" });
        setTimeout(() => { setShowModal(false); setSubmitStatus("idle"); }, 5000);
      } else {
        setSubmitStatus("error");
        setTimeout(() => setSubmitStatus("idle"), 4000);
      }
    } catch {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 4000);
    }
    setIsSubmitting(false);
  };

  const set = (name: string, value: string) => setForm(prev => ({ ...prev, [name]: value }));
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(e.target.name, e.target.value);

  return (
    <>
      <Navbar />
      <main>
        {/* Contact Form & Info — directly below navbar */}
        <section className={styles.contactSection}>
          <div className="container">
            <div className={styles.contactGrid}>
              {/* Left — Form */}
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
                <div className={styles.formCard}>
                  <h3 className={styles.formTitle}>Enquiry Form</h3>

                  {submitStatus === "error" && (
                    <div className={styles.alertError}>
                      <p>Failed to submit enquiry. Please try again.</p>
                    </div>
                  )}

                  <form className={styles.form} onSubmit={handleSubmit}>
                    {/* Row 1: Full Name & Mobile */}
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label htmlFor="fullName" className={styles.label}>Full Name <span className={styles.required}>*</span></label>
                        <input type="text" id="fullName" name="fullName" required value={form.fullName} onChange={handleChange} placeholder="Your full name" className={styles.input} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label htmlFor="mobile" className={styles.label}>Mobile Number <span className={styles.required}>*</span></label>
                        <input type="tel" id="mobile" name="mobile" required value={form.mobile} onChange={handleChange} placeholder="+91 98765 43210" className={styles.input} />
                      </div>
                    </div>

                    {/* Row 2: Email */}
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Email Address</label>
                        <input type="email" id="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className={styles.input} />
                      </div>
                    </div>

                    {/* Row 3: Gender & City */}
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label htmlFor="gender" className={styles.label}>Gender</label>
                        <select id="gender" name="gender" value={form.gender} onChange={handleChange} className={styles.select}>
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <label htmlFor="city" className={styles.label}>City</label>
                        <input type="text" id="city" name="city" value={form.city} onChange={handleChange} placeholder="Your city" className={styles.input} />
                      </div>
                    </div>

                    {/* Row 4: State & Country */}
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label htmlFor="state" className={styles.label}>State</label>
                        <input type="text" id="state" name="state" value={form.state} onChange={handleChange} placeholder="Your state" className={styles.input} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Country</label>
                        <CountryDropdown value={form.country} onChange={v => set("country", v)} />
                      </div>
                    </div>

                    {/* Row 5: Pincode & Department */}
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label htmlFor="pincode" className={styles.label}>Pincode / Zip Code</label>
                        <input type="text" id="pincode" name="pincode" value={form.pincode} onChange={handleChange} placeholder="e.g. 411052" className={styles.input} />
                      </div>
                      <div className={styles.inputGroup}>
                        <label htmlFor="department" className={styles.label}>Department <span className={styles.required}>*</span></label>
                        <select id="department" name="department" required value={form.department} onChange={handleChange} className={styles.select}>
                          <option value="">Select department</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Row 6: Enquiry Type */}
                    <div className={styles.inputGroup}>
                      <label htmlFor="enquiryType" className={styles.label}>Enquiry Type</label>
                      <select id="enquiryType" name="enquiryType" value={form.enquiryType} onChange={handleChange} className={styles.select}>
                        <option value="">Select enquiry type</option>
                        {ENQUIRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* Details */}
                    <div className={styles.inputGroup}>
                      <label htmlFor="details" className={styles.label}>Details</label>
                      <textarea id="details" name="details" value={form.details} onChange={e => set("details", e.target.value)} placeholder="Please describe your enquiry in detail..." rows={4} className={styles.textarea} />
                    </div>

                    <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                      {isSubmitting ? (
                        <><Loader2 size={16} className="spin-anim" /> Submitting...</>
                      ) : (
                        <><Send size={16} /> Submit Enquiry</>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>

              {/* Right — Image & Contact Info */}
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
                <div className={styles.rightCol}>
                  <div className={styles.imageWrapper}>
                    <Image src="/about/about-hero.webp" alt="Rajashree Hospital" width={640} height={300} priority />
                  </div>

                  <div className={styles.infoCard}>
                    <div className={styles.infoRow}>
                      <a href="tel:+919059053938" className={styles.infoItem}>
                        <div className={styles.infoIcon} style={{ background: "#D1FAE5", color: "#10B981" }}>
                          <Phone size={16} />
                        </div>
                        <div>
                          <p className={styles.infoLabel}>Phone</p>
                          <p className={styles.infoValue}>+91 90590 53938</p>
                        </div>
                      </a>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon} style={{ background: "#FEF3C7", color: "#F59E0B" }}>
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className={styles.infoLabel}>Working Hours</p>
                          <p className={styles.infoValue}>Mon – Sat: 8 AM – 8 PM</p>
                        </div>
                      </div>
                    </div>

                    <a href="mailto:medinexplus666@gmail.com" className={styles.infoItem}>
                      <div className={styles.infoIcon} style={{ background: "#EDE9FE", color: "#8B5CF6" }}>
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className={styles.infoLabel}>Email</p>
                        <p className={styles.infoValueLg}>medinexplus666@gmail.com</p>
                      </div>
                    </a>

                    <a href="https://maps.google.com/?q=3+Alampat+Business+Centre+Krushi+Nagar+College+Road+Nashik+422001" target="_blank" rel="noopener noreferrer" className={styles.infoItem}>
                      <div className={styles.infoIcon} style={{ background: "#E6F4F4", color: "#0E898F" }}>
                        <MapPin size={16} />
                      </div>
                      <div>
                        <p className={styles.infoLabel}>Address</p>
                        <p className={styles.infoValueLg}>
                          3/Alampat Business Centre, Near Cycle Circle,<br />
                          Krushi Nagar, College Road, Nashik 422001
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Mobile Contact Info */}
              <div className={styles.mobileInfoCard}>
                <a href="tel:+919059053938" className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ background: "#D1FAE5", color: "#10B981" }}>
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className={styles.infoLabel}>Phone</p>
                    <p className={styles.infoValue}>+91 90590 53938</p>
                  </div>
                </a>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ background: "#FEF3C7", color: "#F59E0B" }}>
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className={styles.infoLabel}>Working Hours</p>
                    <p className={styles.infoValue}>Mon – Sat: 8 AM – 8 PM</p>
                  </div>
                </div>
                <a href="mailto:medinexplus666@gmail.com" className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ background: "#EDE9FE", color: "#8B5CF6" }}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className={styles.infoLabel}>Email</p>
                    <p className={styles.infoValue}>medinexplus666@gmail.com</p>
                  </div>
                </a>
                <a href="https://maps.google.com/?q=3+Alampat+Business+Centre+Krushi+Nagar+College+Road+Nashik+422001" target="_blank" rel="noopener noreferrer" className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ background: "#E6F4F4", color: "#0E898F" }}>
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className={styles.infoLabel}>Address</p>
                    <p className={styles.infoValue}>3/Alampat Business Centre, Near Cycle Circle, Krushi Nagar, College Road, Nashik 422001</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* ── Success Modal ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowModal(false); setSubmitStatus("idle"); }}>
          <motion.div
            className={styles.modalCard}
            initial={{ opacity: 0, scale: 0.75, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: 30 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Animated Tick */}
            <div className={styles.tickCircle}>
              <svg viewBox="0 0 52 52" className={styles.tickSvg}>
                <circle className={styles.tickCircleBg} cx="26" cy="26" r="25" fill="none" />
                <path className={styles.tickCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>

            <h3 className={styles.modalTitle}>Enquiry Submitted!</h3>
            <p className={styles.modalText}>Thank you for reaching out. Our team will get back to you shortly.</p>

            <button className={styles.modalBtn} onClick={() => { setShowModal(false); setSubmitStatus("idle"); }}>
              Close
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
