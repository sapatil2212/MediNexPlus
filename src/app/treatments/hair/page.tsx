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
  Users,
  Scissors
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "../CTASection";
import styles from "../treatments.module.css";
import HairHero from "./HairHero";

export const metadata: Metadata = {
  title: "AI Hair Restoration & Advanced Trichology | MediNex+",
  description:
    "Advanced AI-based hair restoration, PRP therapy, and hair transplant services at MediNex+. Personalized care for hair loss and scalp health.",
  keywords: [
    "AI hair restoration",
    "trichology India",
    "hair transplant FUE FUT",
    "PRP hair treatment",
    "GFC therapy hair",
    "beard transplant",
  ],
};

export default function HairTreatmentsPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <HairHero />

        {/* 1. AI-Based Hair & Scalp Analysis */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Microscope size={16} />
                  <span>AI-Based Hair & Scalp Analysis</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Precision Diagnosis for <span className={styles.titleAccent}>Effective Treatment</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We utilize advanced AI technology to analyze your scalp condition, hair density, and follicle health to identify the root cause of hair loss.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Detailed scalp and follicle analysis",
                    "Identification of underlying causes (genetic, hormonal, lifestyle)",
                    "Personalized treatment planning",
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
                  <span>Accurate diagnosis is the first step toward successful hair restoration.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/hair/1.png" 
                    alt="AI Hair Analysis" 
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

        {/* 2. Hair Loss Treatments (Male & Female) */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Stethoscope size={16} />
                  <span>Hair Loss Treatments (Male & Female)</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Target the Root Cause, <span className={styles.titleAccent}>Not Just the Symptoms</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer customized solutions for different types of hair loss, including androgenetic alopecia, stress-related hair fall, and hormonal imbalances.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Medical management and therapies",
                    "Nutritional and lifestyle guidance",
                    "Combination treatments for better results",
                  ].map((approach, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{approach}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Designed to control hair fall and promote natural regrowth.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/hair/2.png" 
                    alt="Hair Loss Treatments" 
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

        {/* 3. PRP / GFC Therapy */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <HeartPulse size={16} />
                  <span>PRP / GFC Therapy</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Natural Hair Regrowth with <span className={styles.titleAccent}>Regenerative Science</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Platelet-Rich Plasma (PRP) and Growth Factor Concentrate (GFC) therapies use your body’s natural growth factors to stimulate hair follicles.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Strengthens weak hair roots",
                    "Promotes new hair growth",
                    "Improves hair thickness and density",
                    "Safe, non-surgical procedure",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>A proven, natural solution for early to moderate hair loss.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/hair/3.png" 
                    alt="PRP GFC Therapy" 
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

        {/* 4. Mesotherapy for Hair */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Zap size={16} />
                  <span>Mesotherapy for Hair</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Nutrient-Rich Therapy for <span className={styles.titleAccent}>Stronger Hair</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Mesotherapy delivers essential vitamins, minerals, and growth factors directly into the scalp for deep nourishment.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Nourishes hair follicles",
                    "Reduces hair fall",
                    "Improves scalp health",
                    "Enhances hair quality",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Revitalize your scalp with targeted nourishment.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/hair/4.png" 
                    alt="Mesotherapy Hair" 
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

        {/* 5. Hair Transplant (FUE / FUT) */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Scissors size={16} />
                  <span>Hair Transplant (FUE / FUT)</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Permanent Solution for <span className={styles.titleAccent}>Hair Loss</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer advanced hair transplant procedures using FUE (Follicular Unit Extraction) and FUT (Follicular Unit Transplantation) techniques.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Natural hairline design",
                    "Minimally invasive procedures",
                    "High graft survival rate",
                    "Permanent and natural-looking results",
                  ].map((feature, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Restore your hair and confidence with precision transplant techniques.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/hair/5.png" 
                    alt="Hair Transplant" 
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

        {/* 6. Beard & Eyebrow Transplant */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Target size={16} />
                  <span>Beard & Eyebrow Transplant</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Enhance Facial Aesthetics <span className={styles.titleAccent}>Naturally</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide specialized transplant procedures to improve beard and eyebrow density with natural growth patterns.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Natural growth pattern",
                    "Customized design for facial harmony",
                    "Long-lasting results",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Perfect solution for patchy or thin beard and eyebrows.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/hair/6.png" 
                    alt="Beard Eyebrow Transplant" 
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

        {/* 7. Dandruff & Scalp Disorders */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Shield size={16} />
                  <span>Dandruff & Scalp Disorders</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Healthy Scalp for <span className={styles.titleAccent}>Healthy Hair</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We diagnose and treat various scalp conditions that contribute to hair loss and discomfort.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Dandruff and flaky scalp",
                    "Fungal infections",
                    "Itching and irritation",
                    "Seborrheic dermatitis",
                  ].map((condition, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{condition}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>A healthy scalp is essential for strong and healthy hair.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/hair/7.png" 
                    alt="Scalp Disorders" 
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

        {/* 8. Regenerative Hair Therapies */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Sparkles size={16} />
                  <span>Regenerative Hair Therapies</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Advanced Solutions for <span className={styles.titleAccent}>Hair Revival</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer cutting-edge regenerative treatments to repair and rejuvenate damaged hair follicles for sustainable regrowth.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Combination therapies (PRP + GFC + Mesotherapy)",
                    "Collagen stimulation and follicle activation",
                    "Long-term hair strengthening protocols",
                  ].map((approach, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{approach}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Innovative treatments for sustainable hair regrowth.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/hair/8.png" 
                    alt="Regenerative Hair Therapies" 
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
            <h2 className={styles.sectionTitle}>Why Choose MediNex+ for Hair Treatments?</h2>
            <div className={styles.featuresGrid}>
              {[
                { icon: <Microscope size={24} />, text: "AI-based hair and scalp diagnosis" },
                { icon: <Zap size={24} />, text: "Advanced regenerative and transplant technologies" },
                { icon: <Users size={24} />, text: "Personalized treatment plans for every patient" },
                { icon: <Target size={24} />, text: "Expert trichologists and hair specialists" },
                { icon: <Shield size={24} />, text: "Safe, minimally invasive procedures" },
                { icon: <Sparkles size={24} />, text: "Natural, long-lasting, and visible results" },
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
          title="Transform Your Hair with Expert Care"
          description="Take the first step toward stronger, healthier, and fuller hair with expert care at MediNex+. Start your hair restoration journey with confidence."
          imageSrc="/treatments/hair/hair-cta.png"
          imageAlt="Expert hair care"
        />
      </main>
      <Footer />
    </>
  );
}
