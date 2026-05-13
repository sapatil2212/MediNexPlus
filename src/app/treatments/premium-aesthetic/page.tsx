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
  Star,
  Gem
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "../CTASection";
import styles from "../treatments.module.css";
import PremiumAestheticHero from "./PremiumAestheticHero";

export const metadata: Metadata = {
  title: "Premium Aesthetic & Cosmetic Center | MediNex+",
  description:
    "Luxury aesthetic care at MediNex+. Subtle, elegant, and long-lasting results for facial rejuvenation, profile enhancement, and more.",
  keywords: [
    "premium aesthetics India",
    "luxury skin care",
    "non-surgical facelift",
    "jawline contouring",
    "lip augmentation",
    "bridal makeover",
  ],
};

export default function PremiumAestheticPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <PremiumAestheticHero />

        {/* 1. Luxury Facial Aesthetics */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Gem size={16} />
                  <span>Luxury Facial Aesthetics</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Indulge in <span className={styles.titleAccent}>High-End Skin Rejuvenation</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Experience next-level facial treatments that deeply nourish, repair, and rejuvenate your skin for a radiant and youthful glow.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Instant glow and hydration",
                    "Improved skin tone and texture",
                    "Customized luxury facial protocols",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Perfect for achieving radiant, healthy, and youthful skin.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/premium-aesthetic/facial.png" 
                    alt="Luxury Facial Aesthetics" 
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

        {/* 2. Non-Surgical Face Lift */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Zap size={16} />
                  <span>Non-Surgical Face Lift</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Lift & Tighten Without <span className={styles.titleAccent}>Surgery or Downtime</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Achieve a naturally lifted appearance using advanced non-invasive techniques for skin tightening and lifting.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Thread lift procedures",
                    "Skin tightening technologies",
                    "Collagen stimulation therapies",
                  ].map((treatment, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{treatment}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Look younger without surgery, scars, or recovery time.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/premium-aesthetic/lift.png" 
                    alt="Non-Surgical Face Lift" 
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

        {/* 3. Jawline & Profile Enhancement */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Target size={16} />
                  <span>Jawline & Profile Enhancement</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Define Your Features with <span className={styles.titleAccent}>Precision</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Enhance your facial contours and achieve a well-balanced profile with scientifically planned aesthetic treatments.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Jawline contouring with fillers",
                    "Chin and profile enhancement",
                    "Facial symmetry correction",
                  ].map((solution, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{solution}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Sharper, well-balanced facial features with natural results.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/premium-aesthetic/jawline.png" 
                    alt="Profile Enhancement" 
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

        {/* 4. Lip Augmentation */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Star size={16} />
                  <span>Lip Augmentation</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Enhance Volume, Shape & <span className={styles.titleAccent}>Symmetry</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We create beautifully proportioned lips that complement your overall facial aesthetics with subtle, natural-looking volume.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Natural-looking volume enhancement",
                    "Improved symmetry and definition",
                    "Customized lip design",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Subtle enhancement that elevates your smile.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/premium-aesthetic/lip.png" 
                    alt="Lip Augmentation" 
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

        {/* 5. Full Face Rejuvenation */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Sparkles size={16} />
                  <span>Full Face Rejuvenation</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Comprehensive Facial <span className={styles.titleAccent}>Transformation</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our full-face approach addresses multiple concerns like wrinkles and volume loss to restore youthful balance.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Wrinkle reduction",
                    "Volume restoration",
                    "Skin tightening and glow enhancement",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Holistic rejuvenation for a refreshed and youthful appearance.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/premium-aesthetic/fullface.png" 
                    alt="Full Face Rejuvenation" 
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

        {/* 6. Bridal & Celebrity Makeover Packages */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Users size={16} />
                  <span>Bridal & Celebrity Makeover Packages</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Look Flawless for Life’s <span className={styles.titleAccent}>Most Important Moments</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Exclusive makeover packages tailored for weddings and events, ensuring you are camera-ready with confidence.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Personalized pre-event treatment planning",
                    "Skin, face, and aesthetic enhancements",
                    "Timed treatments for peak results",
                  ].map((highlight, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{highlight}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Be camera-ready with confidence and elegance.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/premium-aesthetic/makeover.png" 
                    alt="Makeover Packages" 
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

        {/* 7. Advanced Anti-Aging Protocols */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Activity size={16} />
                  <span>Advanced Anti-Aging Protocols</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Age Gracefully with <span className={styles.titleAccent}>Scientific Precision</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our anti-aging solutions focus on maintaining youthful skin while preserving your natural beauty without overcorrection.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Botox for fine lines and wrinkles",
                    "Dermal fillers for volume restoration",
                    "Skin boosters and collagen therapies",
                  ].map((treatment, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{treatment}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Natural anti-aging results without overcorrection.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/premium-aesthetic/antiaging.png" 
                    alt="Anti-Aging Protocols" 
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

        {/* 8. Personalized Aesthetic Planning (AI-Based) */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Microscope size={16} />
                  <span>Personalized Aesthetic Planning (AI-Based)</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Smart, Data-Driven <span className={styles.titleAccent}>Beauty Solutions</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Advanced AI technology analyzes your facial structure and skin condition for precise and predictable treatment planning.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Personalized treatment roadmap",
                    "Accurate facial analysis",
                    "Predictable, safe, and effective results",
                  ].map((advantage, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{advantage}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Aesthetic treatments guided by science, not guesswork.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/premium-aesthetic/ai.png" 
                    alt="AI Aesthetic Planning" 
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
            <h2 className={styles.sectionTitle}>Why Choose MediNex+ for Premium Aesthetics?</h2>
            <div className={styles.featuresGrid}>
              {[
                { icon: <Microscope size={24} />, text: "AI-based personalized aesthetic planning" },
                { icon: <Zap size={24} />, text: "Advanced FDA-approved & CE-certified technologies" },
                { icon: <Users size={24} />, text: "Expert aesthetic doctors with precision techniques" },
                { icon: <Gem size={24} />, text: "Luxury, comfortable, and premium environment" },
                { icon: <Star size={24} />, text: "Natural, subtle, and long-lasting results" },
                { icon: <Shield size={24} />, text: "Strong focus on safety, ethics, and patient satisfaction" },
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
          title="Book Your Aesthetic Consultation <br /> Today"
          description="Enhance your natural beauty with luxury aesthetic treatments at MediNex+. Experience the perfect blend of science and art."
          imageSrc="/images/premium-aesthetic/hero.png"
          imageAlt="Expert Aesthetic Care"
        />
      </main>
      <Footer />
    </>
  );
}
