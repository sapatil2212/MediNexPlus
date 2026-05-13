"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Calendar,
  HeartPulse,
  Users,
  Phone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppointment } from "./AppointmentProvider";
import styles from "./Hero.module.css";

const slides = [
  {
    headline: "India's First",
    headlineAccent: "AI-Based Robotic",
    headlineSuffix: "Aesthetic Hospital",
    subtext:
      "Experience the future of aesthetics with AI-powered diagnostics and robotic precision. We deliver highly personalized, safe, and result-driven treatments designed to enhance your natural beauty with minimal downtime and maximum accuracy.",
    image: "/images/home-ai.png",
    imageAlt: "AI-Based Robotic Aesthetic Hospital",
  },
  {
    headline: "Advanced AI",
    headlineAccent: "Skin",
    headlineSuffix: "Treatments",
    subtext:
      "Get flawless, radiant skin with intelligent AI-based analysis that understands your skin at a deeper level. Our treatments are tailored for precision, safety, and long-lasting visible results, ensuring natural enhancement without over-treatment.",
    image: "/images/home-skin.png",
    imageAlt: "AI Skin Treatments",
  },
  {
    headline: "AI-Driven",
    headlineAccent: "Hair",
    headlineSuffix: "Restoration",
    subtext:
      "Restore your confidence with AI-driven hair diagnostics and cutting-edge restoration techniques. From early-stage hair fall to advanced solutions, we provide customized treatments that ensure natural growth, density, and long-term results.",
    image: "/images/home-hair.png",
    imageAlt: "AI Hair Restoration",
  },
  {
    headline: "Next-Gen",
    headlineAccent: "Dental Care",
    headlineSuffix: "& Surgery",
    subtext:
      "Redefining dental care with next-generation technology, advanced imaging, and precision-driven procedures. Our modular OT setup ensures the highest standards of safety, hygiene, and comfort for every treatment and surgical need.",
    image: "/images/home-dental.png",
    imageAlt: "Advanced Dental Care",
  },
];


export default function Hero() {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 3000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = slides[current];
  const { openAppointment } = useAppointment();

  return (
    <section id="home" className={styles.hero}>
      {/* Hospital Blur Background */}
      <div className={styles.heroBg}>
        <Image
          src="/images/hero-bg.jpg"
          alt="Hospital Background"
          fill
          className={styles.heroBgImage}
          priority
        />
        <div className={styles.heroBgOverlay} />
      </div>

      {/* Background decorations */}
      <div className={styles.bgDecor1} />
      <div className={styles.bgDecor2} />
      <div className={styles.bgDecor3} />

      <div className={`container ${styles.heroInner}`}>
        {/* Left Content */}
        <div className={styles.heroContent}>
          <motion.div
            className={styles.badge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <HeartPulse size={16} />
            <span>AI-Powered Aesthetic Care</span>
          </motion.div>

          <div className={styles.textSlideWrap}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${current}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h1 className={styles.headline}>
                  {slide.headline}{" "}
                  <span className={styles.headlineAccent}>
                    {slide.headlineAccent}
                  </span>{" "}
                  {slide.headlineSuffix}
                </h1>

                <p className={styles.subtext}>{slide.subtext}</p>
              </motion.div>
            </AnimatePresence>
          </div>

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

          {/* Progress Dots */}
          <div className={styles.slideDots}>
            {slides.map((_, i) => (
              <button
                key={i}
                className={`${styles.slideDot} ${i === current ? styles.slideDotActive : ""
                  }`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Google Rating */}
          <motion.div
            className={styles.ratingRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
              ))}
            </div>
            <span className={styles.ratingText}>
              <strong>Google Rating 5.0</strong>
            </span>
          </motion.div>
        </div>

        {/* Right - Image Carousel + Floating Cards */}
        <div className={styles.heroVisual}>
          {/* Image Carousel */}
          <div className={styles.imageWrapper}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`image-${current}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={styles.imageSlide}
              >
                <Image
                  src={slide.image}
                  alt={slide.imageAlt}
                  width={580}
                  height={640}
                  className={styles.heroImage}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Floating Card: Satisfied Clients */}
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
              <Users size={20} />
            </div>
            <div>
              <div className={styles.satisfiedCount}>9K+</div>
              <div className={styles.satisfiedLabel}>Happy Patients</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
