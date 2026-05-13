"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Award,
  Heart,
} from "lucide-react";
import Image from "next/image";
import styles from "./AboutHero.module.css";

const features = [
  {
    icon: <ShieldCheck size={20} />,
    text: "Enhanced patient safety",
    variant: "safety",
  },
  {
    icon: <Award size={20} />,
    text: "Highly qualified nurses",
    variant: "qualified",
  },
  {
    icon: <Heart size={20} />,
    text: "Personal care",
    variant: "personal",
  },
];

// Duplicate the array multiple times for seamless infinite scroll
const marqueeFeatures = [...features, ...features, ...features, ...features, ...features, ...features];

export default function AboutHero() {
  return (
    <section className={styles.heroSection}>
      {/* Background Image */}
      <Image
        src="/about/about-hero.webp"
        alt="Compassionate home nursing care - nurse attending to elderly patient"
        fill
        className={styles.heroBackground}
        priority
      />

      {/* Overlay */}
      <div className={styles.heroOverlay} />

      {/* Content Container */}
      <div className={styles.heroInner}>
        {/* Main Content */}
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Tagline */}
          <motion.p
            className={styles.heroTagline}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Where Aesthetics Meet Medical Excellence
          </motion.p>

          <motion.h1
            className={styles.heroHeading}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Healthcare Designed <br /> Around You
          </motion.h1>

          <motion.p
            className={styles.heroDescription}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            We combine state-of-the-art medical technology with a compassionate, human-centered approach. 
            <br /><br />
            MediNex+ isn&apos;t just a clinic; it&apos;s your partner in lifelong wellness. Our commitment to excellence ensures that every patient receives the highest quality of care tailored to their unique needs.
          </motion.p>

          {/* Removed Learn More Button as per user request */}
        </motion.div>

        {/* Infinite Scrolling Features Marquee */}
        <motion.div
          className={styles.featuresBar}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className={styles.marqueeTrack}>
            <div className={styles.marqueeContent}>
              {marqueeFeatures.map((feature, index) => (
                <div key={index} className={styles.featureItem}>
                  <div className={`${styles.featureIcon} ${styles[feature.variant]}`}>
                    {feature.icon}
                  </div>
                  <span className={styles.featureText}>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
