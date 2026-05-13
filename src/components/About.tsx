"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BrainCircuit,
  Cpu,
  ArrowRight,
  Award,
  Star,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./About.module.css";

const features = [
  {
    icon: <BrainCircuit size={22} />,
    title: "AI-Powered Diagnostics",
    description:
      "Cutting-edge AI for accurate, personalized diagnoses and precise treatment planning.",
    color: "#0E898F",
    bgColor: "#E6F4F4",
    accent: "#0E898F",
  },
  {
    icon: <Cpu size={22} />,
    title: "Robotic Precision",
    description:
      "Advanced robotic technology with globally approved techniques for safe, effective procedures.",
    color: "#10B981",
    bgColor: "#D1FAE5",
    accent: "#10B981",
  },
  {
    icon: <Award size={22} />,
    title: "Specialized Expertise",
    description:
      "Dedicated specialists in skin, hair, dental & head-neck oncology delivering lasting results.",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
    accent: "#8B5CF6",
  },
];

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className={styles.about} ref={ref}>
      {/* Background decorations */}
      <div className={styles.bgBlob1} />
      <div className={styles.bgBlob2} />

      <div className={`container ${styles.aboutInner}`}>
        {/* Left Content */}
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">
            Professionals dedicated <br />
            to your <span className={styles.titleAccent}>health</span>
          </h2>

          <p className={styles.description}>
            India&apos;s first AI-based robotic aesthetic hospital, redefining modern healthcare with advanced technology and ethical, patient-first care.
          </p>

          {/* Features */}
          <div className={styles.features}>
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className={styles.featureItem}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                style={{ "--accent-color": feature.accent } as React.CSSProperties}
              >
                <div
                  className={styles.featureIcon}
                  style={{ background: feature.bgColor, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <div className={styles.featureText}>
                  <h4 className={styles.featureTitle}>{feature.title}</h4>
                  <p className={styles.featureDesc}>{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Row */}
          <motion.div
            className={styles.ctaRow}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7 }}
          >
            <Link href="/about" className={`btn btn-primary btn-sm ${styles.aboutCta}`}>
              <ArrowRight size={16} />
              Discover Our Approach
            </Link>
            <Link href="/contact" className={`btn btn-secondary btn-sm ${styles.secondaryCta}`}>
              <ChevronRight size={16} />
              Book Consultation
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Visual */}
        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.imageGrid}>
            <div className={styles.mainImage}>
              <Image
                src="/about/home-about.png"
                alt="MediNex+ medical team"
                width={480}
                height={540}
                className={styles.aboutImage}
              />
            </div>
          </div>

          {/* Rating Badge */}
          <motion.div
            className={styles.ratingBadge}
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Star size={13} fill="currentColor" />
            <span className={styles.ratingNum}>4.9</span>
            <span className={styles.ratingLabel}>Patient Rating</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
