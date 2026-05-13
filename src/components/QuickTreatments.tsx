"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import styles from "./QuickTreatments.module.css";

const quickTreatments = [
  {
    id: "skin",
    title: "SKIN",
    href: "/treatments/skin",
    image: "/images/Quick-Treatments/Skin.png",
  },
  {
    id: "hair",
    title: "HAIR",
    href: "/treatments/hair",
    image: "/images/Quick-Treatments/Hair.png",
  },
  {
    id: "dental",
    title: "DENTAL",
    href: "/treatments/dental",
    image: "/images/Quick-Treatments/Dental.png",
  },
  {
    id: "trauma",
    title: "TRAUMA",
    href: "/treatments/facial-trauma",
    image: "/images/Quick-Treatments/Trauma.png",
  },
  {
    id: "hnf-cancer",
    title: "HNF CANCER",
    href: "/treatments/oncology",
    image: "/images/Quick-Treatments/Hnfcancer.png",
  },
  {
    id: "body-shaping",
    title: "BODY SHAPING",
    href: "/treatments/body-shaping",
    image: "/images/Quick-Treatments/BodyShaping.png",
  },
   {
    id: "premium-aesthetic",
    title: "PREMIUM AESTHETIC",
    href: "/treatments/premium-aesthetic",
    image: "/images/Quick-Treatments/Premiumaesthetic.png",
  },
  {
    id: "nutrition",
    title: "NUTRITION",
    href: "/treatments/nutrition",
    image: "/images/Quick-Treatments/Nutrition.png",
  },

  {
    id: "sexual-health",
    title: "SEXUAL HEALTH",
    href: "/treatments/sexual-health",
    image: "/images/Quick-Treatments/Sexualhealth.png",
  },
   {
    id: "medical-tourism",
    title: "MEDICAL TOURISM",
    href: "/treatments/medical-tourism",
    image: "/images/Quick-Treatments/Medicaltourism.png",
  },
];

export default function QuickTreatments() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.cardsContainer}>
          {quickTreatments.map((treatment, index) => (
            <motion.div
              key={treatment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href={treatment.href} className={styles.cardLink}>
                <div className={styles.card}>
                  <Image
                    src={treatment.image}
                    alt={treatment.title}
                    fill
                    className={styles.cardImage}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
