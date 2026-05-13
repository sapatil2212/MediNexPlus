"use client";

import { motion } from "framer-motion";
import { HeartPulse, Calendar, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "../treatments.module.css";
import { useAppointment } from "@/components/AppointmentProvider";

export default function OncologyHero() {
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
                Advanced Cancer Care with <span className={styles.accent}>Early Detection, Precision & Compassion</span>
              </h1>

              <p className={styles.heroDescription}>
                At MediNex+, we provide comprehensive head, neck, and facial oncology care, focusing on early detection, accurate diagnosis, advanced surgical treatment, and holistic rehabilitation.
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
                  src="/treatments/hnf/hnf-hero.png"
                  alt="Advanced Cancer Care"
                  width={480}
                  height={530}
                  className={styles.heroImage}
                  priority
                />
              </motion.div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
