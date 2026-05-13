"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  HeartHandshake,
  Stethoscope,
  Clock,
  Award,
  Users,
  Shield,
  Target,
  TrendingUp,
  CheckCircle2,
  Cpu,
  Zap,
  Microscope,
  FlaskConical,
  Activity,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MissionSection, AboutHero, WhoWeAre } from "@/components/About-Component";
import styles from "./about.module.css";

const doctors = [
  {
    name: "Dr Rutuja Borde",
    role: "Chief Executive Officer I co-founder",
    specialty: "Chief Executive Director & Cofounder",
    experience: "6+ Years",
    qualifications: "",
    expertise: [
      "Advanced Implantology",
      "Full mouth rehabilitation and reconstruction",
      "Digital smile designing",
      "Cosmetic and aesthetic dentistry",
      "Venners and ultra thin laminates",
      "Minimally invasive conservative dentistry",
      "Painless root canal treatment",
      "Advanced Laser therapies in dentistry",
    ],
    image: "/doctors/dr-rutuja.png",
    color: "#0E898F",
    bgColor: "#E6F4F4",
  },
  {
    name: "Dr Sandiip Jaibhave",
    role: "Managing Director I founder",
    specialty: "Managing Director & Founder",
    experience: "9+ Years",
    qualifications: "",
    expertise: [
      "Head and neck oncology",
      "Preventive oral, Head, neck, face cancer care",
      "Advanced Dermato-cosmetology",
      "Tricology and hair regeneration",
      "Hair transplant and restoration",
      "Laser therapies for skin, hair and HNF cancers",
      "Injecteble aesthetics- IV/botox/fillers",
      "Tobacco cessation and drugs De addiction programs",
    ],
    image: "/doctors/doctor-sandiip.png",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
];

const features = [
  {
    title: "AI-Based Diagnosis",
    description: "Latest AI-powered machines for skin, hair, and dental diagnosis.",
    image: "/why-choose-us/1.webp",
  },
  {
    title: "Modular OT",
    description: "India's first dental surgery in a fully equipped modular operation theatre.",
    image: "/why-choose-us/2.webp",
  },
  {
    title: "In-House Lab",
    description: "Advanced dental, pharmacy, and pathology labs for complete care.",
    image: "/why-choose-us/3.webp",
  },
  {
    title: "Patient First",
    description: "Ethical and transparent practices with personalized recovery care.",
    image: "/why-choose-us/4.webp",
  },
];

export default function AboutPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const ref2 = useRef(null);
  const isInView2 = useInView(ref2, { once: true, margin: "-100px" });
  const ref3 = useRef(null);
  const isInView3 = useInView(ref3, { once: true, margin: "-100px" });
  const ref4 = useRef(null);
  const isInView4 = useInView(ref4, { once: true, margin: "-100px" });

  return (
    <>
      <Navbar />
      <main>
        {/* About Hero Banner - hidden on mobile */}
        <div className={`container ${styles.heroWrapper}`}>
          <AboutHero />
        </div>

        {/* New Mission Section Component */}
        <MissionSection />

        {/* Who We Are Section */}
        <WhoWeAre />

        {/* Meet Our Doctors */}
        <section className={styles.doctorsSection} ref={ref4}>
          <div className="container">
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView4 ? { opacity: 1, y: 0 } : {}}
            >
              <h2 className="section-title">
                Meet Our <span className={styles.accent}>Experts</span>
              </h2>
              <p className="section-subtitle">
                The visionary leaders behind India's most advanced aesthetic hospital.
              </p>
            </motion.div>
            <div className={styles.doctorsGrid}>
              {doctors.map((doctor, i) => (
                <motion.div
                  key={doctor.name}
                  className={styles.doctorCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView4 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.2 }}
                >
                  {/* Left Side - Image */}
                  <div className={styles.doctorImageWrapper} style={{ background: doctor.bgColor }}>
                    <div className={styles.doctorImageInner}>
                      <Image
                        src={doctor.image}
                        alt={doctor.name}
                        width={200}
                        height={240}
                        className={styles.doctorImage}
                      />
                    </div>
                    <div className={styles.verifiedBadge}>
                      <Shield size={16} color={doctor.color} />
                    </div>
                  </div>

                  {/* Right Side - Content */}
                  <div className={styles.doctorContent}>
                    <h3 className={styles.doctorName}>{doctor.name}</h3>
                    <p className={styles.doctorSpecialty} style={{ color: doctor.color }}>{doctor.specialty}</p>
                    
                    <div className={styles.doctorMeta}>
                      <span
                        className={styles.experienceBadge}
                        style={{ background: doctor.bgColor, color: doctor.color }}
                      >
                        {doctor.experience} Experience
                      </span>
                      {doctor.qualifications && <span className={styles.qualificationBadge}>{doctor.qualifications}</span>}
                    </div>

                    <ul className={styles.expertiseList}>
                      {doctor.expertise.map((item, idx) => (
                        <li key={idx} className={styles.expertiseItem}>
                          <CheckCircle2 size={14} color={doctor.color} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Stand Apart */}
        <section className={styles.valuesSection} ref={ref2}>
          <div className="container">
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView2 ? { opacity: 1, y: 0 } : {}}
            >
              <h2 className="section-title">
                Why <span className={styles.accent}>MediNex+</span>
              </h2>
              <p className={`section-subtitle ${styles.valuesSubtitle}`}>
                Pioneering the future of aesthetic healthcare in India.
              </p>
            </motion.div>
            <div className={styles.valuesGrid}>
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className={styles.valueCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView2 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                >
                  <div className={styles.valueImageWrap}>
                    <Image
                      src={f.image}
                      alt={f.title}
                      fill
                      className={styles.valueImage}
                    />
                  </div>
                  <div className={styles.valueContent}>
                    <h3 className={styles.valueTitle}>{f.title}</h3>
                    <p className={styles.valueDesc}>{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Infrastructure */}
        <section className={styles.infraSection} ref={ref3}>
          <div className="container">
            <div className={styles.infraHeader}>
              <h2 className="section-title">
                World-Class <span className={styles.accent}>Infrastructure</span>
              </h2>
              <p className="section-subtitle">
                Complete in-house care with surgical-grade hygiene and advanced diagnostics.
              </p>
            </div>
            <div className={styles.infraGrid}>
              {[
                "Dedicated CBCT & OPG X-ray Room",
                "Advanced Dental Laboratory",
                "In-House Pharmacy & Pathology",
                "3-Bedded Recovery Room",
                "Modular Operation Theatre",
                "B-Class Autoclave System",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  className={styles.infraItem}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <CheckCircle2 size={20} className={styles.infraIcon} />
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


      </main>
      <Footer />
    </>
  );
}
