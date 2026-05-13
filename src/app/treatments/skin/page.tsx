import type { Metadata } from "next";
import { 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  Microscope, 
  Shield, 
  Zap, 
  HeartPulse, 
  Star, 
  Eraser, 
  Stethoscope, 
  Target,
  Users
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "../CTASection";
import styles from "../treatments.module.css";
import SkinHero from "./SkinHero";

export const metadata: Metadata = {
  title: "AI Skin Treatment & Advanced Dermatology | MediNex+",
  description:
    "Advanced AI-based skin treatments, laser therapy, and dermatology services at MediNex+. Personalized care for acne, anti-aging, and skin rejuvenation.",
  keywords: [
    "AI skin treatment",
    "dermatology India",
    "laser skin treatment",
    "acne scar reduction",
    "anti aging treatments",
    "medi facials",
  ],
};

export default function SkinTreatmentsPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <SkinHero />

        {/* 1. AI-Based Skin Diagnosis & Analysis */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Microscope size={16} />
                  <span>AI-Based Skin Diagnosis & Analysis</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Personalized Skin Care Begins with <span className={styles.titleAccent}>Precision</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our advanced AI systems analyze your skin in detail—identifying concerns like pigmentation, acne, aging signs, and hydration levels.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Accurate skin assessment using AI technology",
                    "Customized treatment plans based on real data",
                    "Early detection of underlying skin issues",
                    "Predictable and result-oriented outcomes",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>No guesswork—only precision-driven skincare.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/skin/ai-skin-diagnosis-indian.png" 
                    alt="AI Skin Diagnosis" 
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

        {/* 2. Clinical Dermatology */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Stethoscope size={16} />
                  <span>Clinical Dermatology</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Medical Solutions for <span className={styles.titleAccent}>Healthy Skin</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide expert treatment for a wide range of skin conditions using clinically proven methods.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Acne & acne scars",
                    "Psoriasis & eczema",
                    "Hyperpigmentation & melasma",
                    "Skin allergies & infections",
                  ].map((condition, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{condition}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Safe, dermatologist-guided treatments for long-term skin health.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/treatment-dermatology-2.png" 
                    alt="Clinical Dermatology" 
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

        {/* 3. Advanced Laser Treatments */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Zap size={16} />
                  <span>Advanced Laser Treatments</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  High-Precision Laser Technology for <span className={styles.titleAccent}>Visible Results</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We use FDA-approved and CE-certified laser systems for targeted and effective skin treatments.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "CO2 laser (resurfacing & scar reduction)",
                    "Q-Switch laser (pigmentation & tattoo removal)",
                    "Diode laser (hair reduction)",
                  ].map((tech, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{tech}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Minimally invasive procedures with faster recovery and superior outcomes.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/skin/Laser.png" 
                    alt="Laser Treatments" 
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

        {/* 4. Anti-Aging Treatments */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Star size={16} />
                  <span>Anti-Aging Treatments</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Restore Youthful, <span className={styles.titleAccent}>Natural-Looking Skin</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our anti-aging solutions focus on enhancing your natural beauty without overdoing it.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Botox for wrinkle reduction",
                    "Dermal fillers for volume restoration",
                    "Thread lift for non-surgical facelift",
                  ].map((treatment, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{treatment}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Achieve a youthful, refreshed appearance with subtle, natural results.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/skin/1.png" 
                    alt="Anti-Aging" 
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

        {/* 5. PRP, GFC & Mesotherapy */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <HeartPulse size={16} />
                  <span>PRP, GFC & Mesotherapy</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Regenerative Skin & <span className={styles.titleAccent}>Hair Therapies</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We use advanced regenerative treatments to stimulate collagen and skin repair naturally.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Improves skin texture and glow",
                    "Reduces fine lines and pigmentation",
                    "Promotes natural healing and rejuvenation",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Harness your body’s natural healing power for healthier skin.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/skin/Mesotherapy.png" 
                    alt="Regenerative Therapy" 
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

        {/* 6. Medi-Facials & Skin Treatments */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Sparkles size={16} />
                  <span>Medi-Facials & Skin Treatments</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Instant Glow with <span className={styles.titleAccent}>Medical-Grade Skincare</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our medical facials go beyond basic skincare to deliver deep nourishment and rejuvenation.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Chemical peels for exfoliation and renewal",
                    "HydraFacial for hydration and glow",
                    "Medi-facials tailored to your skin type",
                  ].map((treatment, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{treatment}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Perfect for achieving radiant, healthy-looking skin.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/skin/Medi-Facials.png" 
                    alt="Medi-Facials" 
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

        {/* 7. Skin Rejuvenation & Glass Skin Protocols */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Target size={16} />
                  <span>Skin Rejuvenation & Glass Skin Protocols</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Achieve Smooth, Radiant & <span className={styles.titleAccent}>Flawless Skin</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our advanced skin rejuvenation treatments focus on improving texture, tone, and overall skin quality.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Brighter and even skin tone",
                    "Improved skin texture",
                    "Long-lasting glow and hydration",
                  ].map((result, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{result}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Inspired by global beauty standards for flawless skin.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/skin/Rejuvenation.png" 
                    alt="Skin Rejuvenation" 
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

        {/* 8. Scar Revision & Pigmentation Correction */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Eraser size={16} />
                  <span>Scar Revision & Pigmentation Correction</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Clearer, Even-Toned Skin with <span className={styles.titleAccent}>Advanced Solutions</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide targeted treatments to reduce scars and pigmentation effectively.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Acne scar reduction",
                    "Stretch mark improvement",
                    "Pigmentation and melasma correction",
                  ].map((treatment, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{treatment}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Restore smooth, even-toned skin with expert care.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/skin/scar.png" 
                    alt="Scar Revision" 
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

        {/* 9. Dermatosurgery */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Shield size={16} />
                  <span>Dermatosurgery</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Safe & Precise <span className={styles.titleAccent}>Minor Skin Procedures</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our dermatosurgical procedures are performed with advanced techniques ensuring safety and minimal discomfort.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Mole removal",
                    "Wart removal",
                    "Cyst excision",
                  ].map((procedure, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{procedure}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Quick, safe, and effective solutions for skin concerns.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/skin/Dermatosurgery.png" 
                    alt="Dermatosurgery" 
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
            <h2 className={styles.sectionTitle}>Why Choose MediNex+ for Skin & Aesthetic Treatments?</h2>
            <div className={styles.featuresGrid}>
              {[
                { icon: <Microscope size={24} />, text: "AI-based skin analysis for precise diagnosis" },
                { icon: <Zap size={24} />, text: "Advanced FDA-approved & CE-certified technologies" },
                { icon: <Users size={24} />, text: "Experienced dermatologists and aesthetic experts" },
                { icon: <Target size={24} />, text: "Personalized treatment plans for every skin type" },
                { icon: <Shield size={24} />, text: "Safe, minimally invasive procedures" },
                { icon: <Sparkles size={24} />, text: "Premium, hygienic, and patient-friendly environment" },
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
          title="Book Your Skin Consultation <br /> Today"
          description="Take the first step toward healthy, glowing, and youthful skin with expert care at MediNex+. Experience advanced dermatology like never before."
          imageSrc="/images/treatment-dermatology.png"
          imageAlt="Expert skin care"
        />
      </main>
      <Footer />
    </>
  );
}
