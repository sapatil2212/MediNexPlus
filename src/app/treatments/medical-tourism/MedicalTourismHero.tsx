"use client";

import { motion } from "framer-motion";
import { Plane, Calendar, Phone, Users, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import styles from "../treatments.module.css";
import { useAppointment } from "@/components/AppointmentProvider";

interface MedicalTourismHeroProps {
  onBookNow?: () => void;
}

export default function MedicalTourismHero({ onBookNow }: MedicalTourismHeroProps) {
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
                World-Class Healthcare in India with <span className={styles.accent}>Comfort, Care & Convenience</span>
              </h1>

              <p className={styles.heroDescription}>
                At MediNex+, we offer a seamless medical tourism experience for international patients, combining advanced treatments, personalized care, and premium hospitality.
              </p>

           
            </motion.div>

            <motion.div
              className={styles.ctaGroup}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <button
                onClick={onBookNow}
                className={`btn btn-primary btn-sm ${styles.ctaPrimary}`}
              >
                <Calendar size={16} />
                Plan Your Journey
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
                  src="/images/medical-tourism/medical-tourism-hero.png"
                  alt="Medical & Dental Tourism"
                  width={480}
                  height={530}
                  className={styles.heroImage}
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
                  International Care Team
                </span>
              </div>
            </motion.div>

            {/* Floating Card: Global Reach */}
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
                <Plane size={20} />
              </div>
              <div>
                <div className={styles.satisfiedCount}>9K+</div>
                <div className={styles.satisfiedLabel}>Patient Support</div>
              </div>
            </motion.div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
