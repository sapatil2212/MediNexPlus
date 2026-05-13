"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import styles from "./WhoWeAre.module.css";

export default function WhoWeAre() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={styles.whoWeAreSection} ref={ref}>
      <div className="container">
        <div className={styles.container}>
          {/* Left Side - Image */}
          <motion.div
            className={styles.imageSection}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.imageWrapper}>
              <Image
                src="/images/indian_ai_healthcare.png"
                alt="Indian Doctor using AI Interface"
                width={480}
                height={380}
                className={styles.mainImage}
              />

              {/* Rotating Experience Badge */}
              <motion.div
                className={styles.experienceBadge}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className={styles.badgeInner}>
                  <span className={styles.badgeNumber}>9+</span>
                  <div className={styles.badgeText}>
                    <svg viewBox="0 0 140 140">
                      <defs>
                        <path
                          id="circlePath"
                          d="M 70, 70 m -55, 0 a 55,55 0 1,1 110,0 a 55,55 0 1,1 -110,0"
                        />
                      </defs>
                      <text>
                        <textPath href="#circlePath" startOffset="0%">
                          YEARS OF EXPERIENCE • YEARS OF EXPERIENCE •
                        </textPath>
                      </text>
                    </svg>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Content */}
          <motion.div
            className={styles.contentSection}
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="section-title">
              Redefining Healthcare with AI
            </h2>
            <p className="section-subtitle" style={{ textAlign: "left", margin: 0, maxWidth: "100%", marginBottom: "var(--space-4)" }}>
              Pioneering the future of medical technology with ethical, patient-first care.
            </p>
            <p className={styles.description}>
              MediNex+ is proudly recognized as India's first AI-based robotic aesthetic hospital, specializing in skin, hair, dental, and head & neck oncology (HNF oncology). We are at the forefront of modern healthcare, where advanced technology seamlessly integrates with ethical, patient-first care to deliver exceptional clinical outcomes.
            </p>

            <p className={styles.description}>
              Our mission is to transform the healthcare experience by combining Artificial Intelligence (AI), robotic precision, and globally approved medical technologies—ensuring accurate diagnosis, personalized treatment planning, and safe, long-lasting results.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
