"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Award, Users, ThumbsUp } from "lucide-react";
import styles from "./Stats.module.css";

const stats = [
  {
    icon: <Award size={28} />,
    value: "9+",
    label: "Years of Experience",
    color: "#0E898F",
    bgColor: "#E6F4F4",
  },
  {
    icon: <Users size={28} />,
    value: "9K+",
    label: "Patients",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
  },
  {
    icon: <ThumbsUp size={28} />,
    value: "100%",
    label: "Patient Satisfaction",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
];

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className={styles.stats} ref={ref}>
      <div className={`container ${styles.statsInner}`}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={styles.statCard}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <div
              className={styles.statIcon}
              style={{ background: stat.bgColor, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue} style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
