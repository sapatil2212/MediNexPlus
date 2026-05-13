"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  HeartPulse,
  ArrowRight,
  SmilePlus,
  Sparkles,
  Ribbon,
  Stethoscope,
  Scissors,
  Apple,
  Gem,
  Plane,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Services.module.css";
import { useAppointment } from "./AppointmentProvider";

const servicesList = [
  {
    label: "Dental",
    href: "/treatments/dental",
    icon: SmilePlus,
    image: "/images/Quick-Treatments/Dental.png",
    description: "Experience world-class dental care with AI-powered diagnostics, digital smile design, and pain-free procedures that restore your smile's natural beauty and strength.",
    features: ["Teeth Cleaning", "Root Canal", "Dental Implants", "Smile Design"],
  },
  {
    label: "Skin",
    href: "/treatments/skin",
    icon: Sparkles,
    image: "/images/Quick-Treatments/Skin.png",
    description: "Our expert dermatologists combine AI skin analysis with advanced laser therapy and medical-grade treatments to deliver visible, long-lasting results for all skin types.",
    features: ["Acne Treatment", "Laser Therapy", "Anti-aging", "Skin Brightening"],
  },
  {
    label: "Hair",
    href: "/treatments/hair",
    icon: Ribbon,
    image: "/images/Quick-Treatments/Hair.png",
    description: "Revitalize your hair with precision-based PRP therapy, GFC treatments, and advanced hair transplant procedures tailored to your unique hair restoration goals.",
    features: ["PRP Therapy", "Hair Transplant", "GFC Treatment", "Trichology"],
  },
  {
    label: "HNF Cancer",
    href: "/treatments/oncology",
    icon: HeartPulse,
    image: "/images/Quick-Treatments/Hnfcancer.png",
    description: "Our specialist oncologists provide early detection screening, targeted therapies, and compassionate care for head, neck, and facial cancers with proven outcomes.",
    features: ["Early Screening", "Targeted Therapy", "Immunotherapy", "Laser Care"],
  },
  {
    label: "Facial Trauma",
    href: "/treatments/general-opd",
    icon: Stethoscope,
    image: "/images/Quick-Treatments/Trauma.png",
    description: "Expert trauma care for facial injuries and emergency treatments.",
    features: ["Emergency Care", "Fracture Repair", "Reconstruction"],
  },
  {
    label: "Body Shaping",
    href: "/treatments",
    icon: Scissors,
    image: "/images/Quick-Treatments/BodyShaping.png",
    description: "Non-invasive body contouring and aesthetic shaping procedures.",
    features: ["Liposuction", "Tummy Tuck", "Body Contouring"],
  },
  {
    label: "Nutrition",
    href: "/treatments",
    icon: Apple,
    image: "/images/Quick-Treatments/Nutrition.png",
    description: "Personalized nutrition plans and dietary counseling for optimal health.",
    features: ["Diet Plans", "Weight Management", "Nutritional Counseling"],
  },
  {
    label: "Sexual Health",
    href: "/treatments",
    icon: HeartPulse,
    image: "/images/Quick-Treatments/Sexualhealth.png",
    description: "Confidential sexual health services and treatments.",
    features: ["Consultation", "Treatment", "Counseling"],
  },
  {
    label: "Premium Aesthetic",
    href: "/treatments",
    icon: Gem,
    image: "/images/Quick-Treatments/Premiumaesthetic.png",
    description: "Luxury aesthetic treatments for premium beauty care.",
    features: ["Facial Rejuvenation", "Skin Tightening", "Luxury Care"],
  },
  {
    label: "Dental and Medical Tourism",
    href: "/treatments",
    icon: Plane,
    image: "/images/Quick-Treatments/Medicaltourism.png",
    description: "World-class healthcare services for international patients.",
    features: ["Travel Assistance", "Accommodation", "Treatment Packages"],
  },
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { openAppointment } = useAppointment();

  return (
    <section id="services" className={styles.services} ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">
            <HeartPulse size={16} />
            Our Services
          </span>
          <h2 className="section-title">
            Healthcare Services <span className={styles.titleAccent}>We Provide</span>
          </h2>
          <p className="section-subtitle">
            We offer a wide range of medical services designed to meet your healthcare needs with the highest standards of medical excellence.
          </p>
        </motion.div>

        {/* Cards Grid - Show 8 */}
        <div className={styles.grid}>
          {servicesList.slice(0, 8).map((service, i) => (
            <motion.div
              key={service.label}
              className={styles.card}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className={styles.cardImage}>
                <Image
                  src={service.image}
                  alt={service.label}
                  fill
                  className={styles.image}
                />
              </div>
              
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{service.label}</h3>
                <p className={styles.cardDesc}>{service.description}</p>
                
                <div className={styles.benefitsSection}>
                  <h4 className={styles.benefitsLabel}>Key Benefits:</h4>
                  <div className={styles.benefitsGrid}>
                    {service.features.map((feature, idx) => (
                      <span key={idx} className={styles.benefitBadge}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <Link 
                    href={service.href}
                    className={styles.viewMoreBtn}
                  >
                    View More <ArrowRight size={14} />
                  </Link>
                  <button 
                    className={styles.bookNowBtn}
                    onClick={openAppointment}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          className={styles.viewAllContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Link href="/treatments" className={styles.viewAllBtn}>
            View All Treatments <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
