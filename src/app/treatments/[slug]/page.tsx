"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  Award,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useAppointment } from "@/components/AppointmentProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { treatments } from "../treatmentData";
import styles from "./treatment.module.css";

export default function TreatmentPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const treatment = treatments.find((t) => t.slug === slug);

  if (!treatment) {
    notFound();
  }

  const { openAppointment } = useAppointment();

  const IconComp = treatment.icon;
  const otherTreatments = treatments.filter((t) => t.slug !== slug);

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section
          className={styles.hero}
          style={
            {
              "--treatment-color": treatment.color,
              "--treatment-bg": treatment.bgColor,
            } as React.CSSProperties
          }
        >
          <div className={`container ${styles.heroGrid}`}>
            {/* Left - Content */}
            <motion.div
              className={styles.heroContent}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div
                className={styles.breadcrumb}
              >
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/treatments">Treatments</Link>
                <span>/</span>
                <span className={styles.breadcrumbActive}>
                  {treatment.label}
                </span>
              </div>

              <div
                className={styles.iconPill}
                style={{
                  background: treatment.bgColor,
                  color: treatment.color,
                }}
              >
                <IconComp size={18} />
                <span>{treatment.label}</span>
              </div>

              <h1 className={styles.heroTitle}>{treatment.fullTitle}</h1>
              <p className={styles.heroDesc}>{treatment.heroDesc}</p>

              <div className={styles.heroActions}>
                <button
                  onClick={openAppointment}
                  className={`btn btn-primary ${styles.heroBtn}`}
                  style={{
                    background: `linear-gradient(135deg, ${treatment.color}, ${treatment.color}cc)`,
                  }}
                >
                  <Calendar size={16} />
                  Book Appointment
                </button>
                <a href="tel:+919059053938" className={`btn btn-secondary ${styles.heroBtn}`}>
                  Call Now
                </a>
              </div>

              {/* Stats */}
              <div className={styles.heroStats}>
                <div className={styles.statBlock}>
                  <Users size={18} style={{ color: treatment.color }} />
                  <div>
                    <span className={styles.statValue}>
                      {treatment.stats.doctors}
                    </span>
                    <span className={styles.statLabel}>Specialists</span>
                  </div>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statBlock}>
                  <Award size={18} style={{ color: treatment.color }} />
                  <div>
                    <span className={styles.statValue}>
                      {treatment.stats.patients}
                    </span>
                    <span className={styles.statLabel}>Patients Treated</span>
                  </div>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statBlock}>
                  <Clock size={18} style={{ color: treatment.color }} />
                  <div>
                    <span className={styles.statValue}>
                      {treatment.stats.experience}
                    </span>
                    <span className={styles.statLabel}>Experience</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right - Image */}
            <motion.div
              className={styles.heroImageCol}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className={styles.imageFrame}>
                <Image
                  src={treatment.image}
                  alt={treatment.fullTitle}
                  width={560}
                  height={440}
                  className={styles.heroImage}
                  priority
                />
                <div
                  className={styles.imageAccent}
                  style={{ background: `${treatment.color}20` }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Details Section */}
        <section className={styles.detailsSection}>
          <div className={`container ${styles.detailsGrid}`}>
            {/* Left: Details */}
            <motion.div
              className={styles.detailsContent}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className={styles.detailsTitle}>
                About Our{" "}
                <span style={{ color: treatment.color }}>
                  {treatment.label}
                </span>{" "}
                Department
              </h2>
              <p className={styles.detailsText}>{treatment.description}</p>

              <h3 className={styles.featuresHeading}>What We Offer</h3>
              <div className={styles.featuresGrid}>
                {treatment.features.map((f, i) => (
                  <motion.div
                    key={f}
                    className={styles.featureCard}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <CheckCircle2
                      size={20}
                      style={{ color: treatment.color }}
                    />
                    <span>{f}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Other Treatments Sidebar */}
            <motion.aside
              className={styles.sidebar}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className={styles.sidebarCard}>
                <h3 className={styles.sidebarTitle}>Other Treatments</h3>
                <div className={styles.sidebarList}>
                  {otherTreatments.map((other) => {
                    const OtherIcon = other.icon;
                    return (
                      <Link
                        key={other.slug}
                        href={`/treatments/${other.slug}`}
                        className={styles.sidebarItem}
                      >
                        <div
                          className={styles.sidebarIcon}
                          style={{
                            background: other.bgColor,
                            color: other.color,
                          }}
                        >
                          <OtherIcon size={18} />
                        </div>
                        <div>
                          <span className={styles.sidebarLabel}>
                            {other.label}
                          </span>
                          <span className={styles.sidebarDesc}>
                            {other.heroDesc.slice(0, 50)}...
                          </span>
                        </div>
                        <ArrowRight size={16} className={styles.sidebarArrow} />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* CTA Card */}
              <div
                className={styles.ctaCard}
                style={{
                  background: `linear-gradient(135deg, ${treatment.color}, ${treatment.color}dd)`,
                }}
              >
                <h3>Need Help Choosing?</h3>
                <p>
                  Talk to our specialists to find the right treatment for you.
                </p>
                <Link href="/contact" className={styles.ctaBtn}>
                  Contact Us <ArrowRight size={16} />
                </Link>
              </div>
            </motion.aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
