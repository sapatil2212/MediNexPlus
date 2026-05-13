"use client";

import { motion } from "framer-motion";
import { Stethoscope, ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { treatments } from "./treatmentData";
import styles from "./treatments.module.css";
import { useAppointment } from "@/components/AppointmentProvider";

export default function TreatmentsPage() {
  const { openAppointment } = useAppointment();

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Page Hero */}
        <section className={styles.pageHero}>
          <div className="container">
            <motion.div
              className={styles.listingHeroContent}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-label">
                <Stethoscope size={16} />
                Our Treatments
              </span>
              <h1 className={styles.listingHeroTitle}>
                Specialized <span className={styles.accent}>Treatments</span>{" "}
                for Every Need
              </h1>
              <p className={styles.listingHeroSubtext}>
                We offer a wide range of medical services designed to meet your
                healthcare needs with the highest standards of medical excellence.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Treatments Grid */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.treatmentsGrid}>
              {treatments
                .filter(t => !["medical-tourism", "nutrition", "cardiology"].includes(t.slug))
                .map((t, i) => {
                return (
                  <motion.div
                    key={t.slug}
                    className={styles.treatmentCard}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  >
                    <div className={styles.cardImageWrapper}>
                      <Image
                        src={t.image}
                        alt={t.label}
                        fill
                        className={styles.cardImage}
                      />
                    </div>
                    
                    <div className={styles.cardContent}>
                      <h2 className={styles.cardTitle}>{t.label}</h2>
                      <p className={styles.cardDesc}>{t.heroDesc}</p>

                      <div className={styles.benefitsSection}>
                        <div className={styles.benefitsLabel}>Core Benefits</div>
                        <div className={styles.benefitsGrid}>
                          {t.features.slice(0, 3).map((f) => (
                            <span key={f} className={styles.benefitBadge}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <Link
                          href={`/treatments/${t.slug}`}
                          className={styles.viewMoreBtn}
                        >
                          View Details
                        </Link>
                        <button
                          onClick={openAppointment}
                          className={styles.bookNowBtn}
                        >
                          Book Now <Check size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
