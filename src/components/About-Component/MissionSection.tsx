"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Activity,
  Clock,
  Award,
  Heart,
} from "lucide-react";
import Image from "next/image";
import styles from "./MissionSection.module.css";

const features = [
  {
    icon: <Activity size={24} />,
    title: "Advanced Diagnostics",
    description: "Precision imaging and rapid lab results.",
    variant: "diagnostics",
  },
  {
    icon: <Clock size={24} />,
    title: "24/7 Availability",
    description: "Emergency care whenever you need it.",
    variant: "availability",
  },
  {
    icon: <Award size={24} />,
    title: "Top Specialists",
    description: "Board-certified experts in every field.",
    variant: "specialists",
  },
  {
    icon: <Heart size={24} />,
    title: "Patient Focused",
    description: "Personalized care plans for everyone.",
    variant: "patientFocused",
  },
];

export default function MissionSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={styles.missionSection} ref={ref}>
      <div className="container">
        <div className={styles.missionContainer}>
          {/* Left Side - Image */}
          <motion.div
            className={styles.imageSection}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.imageWrapper}>
              <Image
                src="/about/about.png"
                alt="Healthcare Professional"
                width={520}
                height={600}
                className={styles.doctorImage}
                priority
              />
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
              Healthcare Designed Around <span className={styles.headingAccent}>You</span>
            </h2>
            <div className={styles.descriptionWrapper}>
              <p className={styles.descriptionText}>
                We combine state-of-the-art medical technology with a compassionate,
                human-centered approach.
              </p>
              <p className={styles.descriptionText}>
                MediNex+ isn't just a clinic; it's your partner in lifelong wellness. Our commitment to excellence ensures that every patient receives the highest quality of care tailored to their unique needs.
              </p>
            </div>

            {/* Features Grid */}
            <div className={styles.featuresGrid}>
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={styles.featureCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <div className={`${styles.featureIcon} ${styles[feature.variant]}`}>
                    {feature.icon}
                  </div>
                  <div className={styles.featureContent}>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <p className={styles.featureDesc}>{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
