"use client";

import { motion } from "framer-motion";
import { Sparkles, Calendar, Phone, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "../treatments.module.css";
import { useAppointment } from "@/components/AppointmentProvider";

export default function PremiumAestheticHero() {
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
                Luxury Aesthetic Care Designed for <span className={styles.accent}>Natural, Refined & Timeless Beauty</span>
              </h1>

              <p className={styles.heroDescription}>
                At MediNex+, we offer a premium aesthetic experience where advanced medical science meets artistic precision. Our treatments enhance your natural features for subtle, elegant results.
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
                Book Appointment
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
                  src="/images/premium-aesthetic/hero.png"
                  alt="Premium Aesthetic Care"
                  width={480}
                  height={530}
                  className={styles.heroImage}
                  style={{ borderRadius: "24px", objectFit: "cover", overflow: "hidden" }}
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
                  Expert Aesthetic Doctors
                </span>
              </div>
            </motion.div>

            {/* Floating Card: Satisfied Clients */}
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
                <Users size={20} />
              </div>
              <div>
                <div className={styles.satisfiedCount}>9K+</div>
                <div className={styles.satisfiedLabel}>Happy Patients</div>
              </div>
            </motion.div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
