"use client";

import { motion } from "framer-motion";
import { Calendar, Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "../treatments.module.css";
import { useAppointment } from "@/components/AppointmentProvider";

export default function BodyShapingHero() {
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
                Sculpt Your Body with Advanced <span className={styles.accent}>Non-Surgical Precision</span>
              </h1>

              <p className={styles.heroDescription}>
                At MediNex+, we offer advanced body contouring and fat reduction treatments that help you achieve a toned, sculpted, and confident appearance—without surgery or downtime.
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
                  src="/treatments/body-shaping/body-shaping-hero.png"
                  alt="Body Shaping & Contouring"
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
