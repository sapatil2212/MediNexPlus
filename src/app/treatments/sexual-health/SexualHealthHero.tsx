"use client";

import { motion } from "framer-motion";
import { HeartPulse, Calendar, Phone, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "../treatments.module.css";
import { useAppointment } from "@/components/AppointmentProvider";

export default function SexualHealthHero() {
  const { openAppointment } = useAppointment();
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroContainer}>
          <div className={styles.heroGrid}>
          {/* Left Content */}
          <div className={styles.heroContent}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1 className={styles.heroTitle}>
                Confidential, Compassionate & <span className={styles.accent}>Result-Oriented Care</span> for Intimate Health
              </h1>

              <p className={styles.heroDescription}>
                At MediNex+, we understand that sexual health is a deeply personal and important aspect of overall wellbeing. Our specialized clinic offers confidential, ethical, and medically advanced treatments.
              </p>

           
            </motion.div>

            <motion.div
              className={styles.ctaGroup}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <button
                onClick={openAppointment}
                className={`btn btn-primary btn-sm ${styles.ctaPrimary}`}
              >
                <Calendar size={16} />
                Book Private Consultation
              </button>
              <Link
                href="/contact"
                className={`btn btn-secondary btn-sm ${styles.ctaSecondary}`}
              >
                <Phone size={16} />
                Contact Us
              </Link>
            </motion.div>
          </div>

          {/* Right Visual */}
          <div className={styles.heroVisual}>
            <div className={styles.imageWrapper}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Image
                  src="/images/sexual-health/hero.png"
                  alt="Sexual Health & Wellness"
                  width={480}
                  height={530}
                  className={styles.heroImage}
                  style={{ borderRadius: '24px', objectFit: 'cover' }}
                  priority
                />
              </motion.div>
            </div>

            {/* Floating Card: Specialists */}
            <motion.div
              className={`${styles.floatingCard} ${styles.doctorsCard}`}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className={styles.doctorInfo}>
                <span className={styles.doctorCount}>
                  Expert Sexual Health Specialists
                </span>
              </div>
            </motion.div>

            {/* Floating Card: Privacy */}
            <motion.div
              className={`${styles.floatingCard} ${styles.satisfiedCard}`}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            >
              <div className={styles.satisfiedIcon}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className={styles.satisfiedCount}>9K+</div>
                <div className={styles.satisfiedLabel}>Confidential Care</div>
              </div>
            </motion.div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
