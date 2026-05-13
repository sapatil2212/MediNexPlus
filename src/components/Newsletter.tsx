"use client";

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useAppointment } from './AppointmentProvider';
import styles from './Newsletter.module.css';

const Newsletter: React.FC = () => {
  const { openAppointment } = useAppointment();

  return (
    <section className={styles.newsletterSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>
            Start Your Transformation <br /> with Expert Care
          </h2>
          <p className={styles.subtitle}>
            Book your consultation today and experience advanced, ethical, and personalized treatment designed for your health, confidence, and long-term results.
          </p>
          
          <div className={styles.ctaButtons}>
            <button 
              type="button" 
              className={styles.button}
              onClick={openAppointment}
            >
              Book Appointment
              <ArrowRight size={18} className={styles.buttonIcon} />
            </button>
            <a 
              href="/contact" 
              className={styles.secondaryButton}
            >
              Contact Us
            </a>
          </div>
        </div>
        
        <div className={styles.imageWrapper}>
          <Image 
            src="/images/home-cta.webp" 
            alt="Healthcare professional" 
            width={500} 
            height={600} 
            className={styles.image}
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
