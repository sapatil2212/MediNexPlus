import type { Metadata } from "next";
import { 
  CheckCircle, 
  ArrowRight, 
  Zap, 
  Target,
  Users,
  Activity,
  Sparkles,
  Shield,
  Microscope,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Clock,
  MessageCircle
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "../CTASection";
import styles from "../treatments.module.css";
import SexualHealthHero from "./SexualHealthHero";

export const metadata: Metadata = {
  title: "Sexual Health & Wellness | MediNex+",
  description:
    "Confidential, compassionate, and result-oriented sexual health care for men and women at MediNex+. Advanced medical and regenerative therapies.",
  keywords: [
    "sexual health India",
    "erectile dysfunction treatment",
    "premature ejaculation management",
    "hormonal therapy",
    "female sexual wellness",
    "confidential clinic",
  ],
};

export default function SexualHealthPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <SexualHealthHero />

        {/* 1. Erectile Dysfunction Treatment */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Target size={16} />
                  <span>Erectile Dysfunction Treatment</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Restore <span className={styles.titleAccent}>Confidence & Performance</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide advanced medical solutions to help men overcome erectile dysfunction safely and effectively through personalized evaluation.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Detailed evaluation of underlying causes",
                    "Medical and regenerative therapies",
                    "Lifestyle and hormonal assessment",
                  ].map((approach, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{approach}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Regain confidence with safe and effective treatment solutions.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/sexual-health/ed.png" 
                    alt="Erectile Dysfunction Treatment" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 2. Premature Ejaculation Management */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Clock size={16} />
                  <span>Premature Ejaculation Management</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Improve <span className={styles.titleAccent}>Control & Satisfaction</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our expert-led treatments focus on improving control and enhancing overall sexual performance through behavioral and medical therapies.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Personalized therapy plans",
                    "Behavioral and medical treatments",
                    "Long-term performance improvement strategies",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Achieve better control and confidence in your intimate life.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/sexual-health/pe.png" 
                    alt="Premature Ejaculation Management" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 3. Libido & Performance Enhancement */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Zap size={16} />
                  <span>Libido & Performance Enhancement</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Boost Energy, <span className={styles.titleAccent}>Desire & Vitality</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We address low libido and performance concerns with scientifically designed treatments to improve stamina and overall wellbeing.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Improved stamina and energy",
                    "Enhanced sexual desire",
                    "Better overall wellbeing",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Feel more energetic, confident, and balanced.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/sexual-health/libido.png" 
                    alt="Libido Enhancement" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 4. Hormonal Therapy */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Activity size={16} />
                  <span>Hormonal Therapy</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Balance Hormones for <span className={styles.titleAccent}>Better Health</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Restore balance for optimal physical and emotional health through personalized hormone correction therapies and diagnosis.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Hormonal evaluation and diagnosis",
                    "Personalized hormone correction therapies",
                    "Continuous monitoring and guidance",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Restore balance for optimal physical and emotional health.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/sexual-health/hormonal.png" 
                    alt="Hormonal Therapy" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 5. Couple Counseling */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <MessageCircle size={16} />
                  <span>Couple Counseling</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Strengthen Communication & <span className={styles.titleAccent}>Relationships</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer professional counseling to help couples address intimacy concerns and improve emotional connection and understanding.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Communication and emotional connection",
                    "Relationship challenges",
                    "Guided therapy sessions",
                  ].map((focus, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{focus}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Build stronger, healthier relationships.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/sexual-health/counseling.png" 
                    alt="Couple Counseling" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 6. Female Sexual Wellness */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Sparkles size={16} />
                  <span>Female Sexual Wellness</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Specialized Care for <span className={styles.titleAccent}>Women’s Intimate Health</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide dedicated solutions for women’s sexual and reproductive health concerns with safe, respectful, and effective care.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Hormonal balance and wellness",
                    "Intimate health treatments",
                    "Regenerative therapies",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Empowering women with safe, respectful, and effective care.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/sexual-health/wellness.png" 
                    alt="Female Sexual Wellness" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 7. Regenerative & Non-Surgical Treatments */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Activity size={16} />
                  <span>Regenerative & Non-Surgical Treatments</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Advanced, Safe & <span className={styles.titleAccent}>Minimally Invasive Solutions</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Modern, non-surgical treatments focusing on natural healing and improvement with minimal recovery time.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Minimally invasive procedures",
                    "Faster recovery",
                    "Natural and long-lasting results",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Advanced solutions without surgery or downtime.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/sexual-health/regenerative.png" 
                    alt="Regenerative Treatments" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* 8. Confidential & Ethical Care Protocols */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <ShieldCheck size={16} />
                  <span>Confidential & Ethical Care Protocols</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Your <span className={styles.titleAccent}>Privacy is Our Priority</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We maintain the highest standards of confidentiality and professionalism in a safe, non-judgmental environment.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "100% private consultations",
                    "Respectful and non-judgmental approach",
                    "Ethical and transparent medical practices",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>A safe space to discuss and treat your concerns.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/sexual-health/confidential.png" 
                    alt="Confidential Care" 
                    width={500} 
                    height={600} 
                    className={styles.aboutImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Why Choose Section */}
        <section className={styles.whyChooseSection}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Why Choose MediNex+ for Sexual Wellness?</h2>
            <div className={styles.featuresGrid}>
              {[
                { icon: <ShieldCheck size={24} />, text: "Complete privacy and confidential consultations" },
                { icon: <Stethoscope size={24} />, text: "Expert doctors with specialized experience" },
                { icon: <Users size={24} />, text: "Personalized, patient-centric treatment plans" },
                { icon: <Activity size={24} />, text: "Advanced regenerative and non-surgical therapies" },
                { icon: <HeartPulse size={24} />, text: "Ethical, respectful, and professional care" },
                { icon: <Shield size={24} />, text: "Holistic approach to physical and emotional wellbeing" },
              ].map((feature, index) => (
                <div key={index} className={styles.featureItem}>
                  <div className={styles.featureIcon}>{feature.icon}</div>
                  <span className={styles.featureTitle}>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section — Home Page Style */}
        <CTASection
          title="Book a Confidential <br /> Consultation"
          description="Take the first step toward better health, confidence, and relationships with expert care in a safe and supportive environment."
          imageSrc="/images/sexual-health/hero.png"
          imageAlt="Expert Sexual Health Care"
        />
      </main>
      <Footer />
    </>
  );
}
