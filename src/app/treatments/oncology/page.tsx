import type { Metadata } from "next";
import { 
  HeartPulse, 
  CheckCircle, 
  ArrowRight, 
  Microscope, 
  Shield, 
  Activity, 
  Sparkles, 
  Users,
  Stethoscope,
  Target,
  Search,
  Zap
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "../CTASection";
import styles from "../treatments.module.css";
import OncologyHero from "./OncologyHero";

export const metadata: Metadata = {
  title: "Head, Neck & Facial (HNF) Oncology | MediNex+",
  description:
    "Comprehensive head, neck, and facial oncology care at MediNex+. Early detection, advanced surgical oncology, and holistic rehabilitation.",
  keywords: [
    "HNF oncology",
    "head and neck cancer treatment",
    "oral cancer screening",
    "surgical oncology India",
    "facial reconstruction surgery",
    "palliative care oncology",
  ],
};

export default function OncologyPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <OncologyHero />

        {/* 1. Oral Cancer Screening & Early Detection */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Search size={16} />
                  <span>Oral Cancer Screening & Early Detection</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Early Diagnosis Can <span className={styles.titleAccent}>Save Lives</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We emphasize routine screening and early detection, especially for high-risk individuals, using AI-assisted technology.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "AI-assisted oral cancer screening",
                    "Identification of precancerous lesions",
                    "Risk assessment for tobacco and alcohol users",
                    "Preventive guidance and regular monitoring",
                  ].map((highlight, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{highlight}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Early detection significantly increases treatment success rates.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/screening.png" 
                    alt="Oral Cancer Screening" 
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

        {/* 2. Head & Neck Tumor Diagnosis */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Stethoscope size={16} />
                  <span>Head & Neck Tumor Diagnosis</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Accurate Diagnosis for <span className={styles.titleAccent}>Effective Treatment Planning</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We use advanced diagnostic tools to identify and evaluate tumors in the head and neck region accurately.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Clinical examination by oncology specialists",
                    "Advanced imaging and investigations",
                    "Tumor staging and risk assessment",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Precise diagnosis ensures the right treatment at the right time.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/diagnosis.png" 
                    alt="Head & Neck Tumor Diagnosis" 
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

        {/* 3. Biopsy & Histopathology */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Microscope size={16} />
                  <span>Biopsy & Histopathology</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Confirming Diagnosis with <span className={styles.titleAccent}>Scientific Precision</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We perform detailed biopsy procedures followed by histopathological analysis to confirm cancer diagnosis and guide treatment.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Accurate identification of cancer type and stage",
                    "Guidance for personalized treatment planning",
                    "Reliable and evidence-based reporting",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>A critical step in designing effective cancer treatment strategies.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/screening.png" 
                    alt="Biopsy & Histopathology" 
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

        {/* 4. Surgical Oncology (Tumor Resection) */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Activity size={16} />
                  <span>Surgical Oncology (Tumor Resection)</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Advanced Surgical Treatment with <span className={styles.titleAccent}>Maximum Precision</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our expert surgeons perform tumor removal procedures with a focus on safety, precision, and complete disease control.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Advanced surgical techniques",
                    "Modular OT setup for maximum safety",
                    "Focus on complete tumor removal with minimal complications",
                  ].map((feature, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Delivering effective treatment with patient safety as the highest priority.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/surgery.png" 
                    alt="Surgical Oncology" 
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

        {/* 5. Reconstruction Surgeries */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Sparkles size={16} />
                  <span>Reconstruction Surgeries</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Restoring Form, Function & <span className={styles.titleAccent}>Confidence</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Post-tumor removal, we provide advanced reconstructive procedures to restore both function and appearance.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Facial reconstruction",
                    "Jaw and oral structure restoration",
                    "Functional rehabilitation (speech, chewing)",
                  ].map((focus, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{focus}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Helping patients regain confidence and quality of life.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/surgery.png" 
                    alt="Reconstruction Surgeries" 
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

        {/* 6. Multidisciplinary Cancer Care */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Users size={16} />
                  <span>Multidisciplinary Cancer Care</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Collaborative Approach for <span className={styles.titleAccent}>Better Outcomes</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our oncology care involves a team of specialists working together to provide comprehensive treatment.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Oncologists and Surgeons",
                    "Dermatologists and Pathologists",
                    "Rehabilitation experts and Nutritionists",
                  ].map((member, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{member}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>A coordinated approach ensures complete and effective care.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/diagnosis.png" 
                    alt="Multidisciplinary Care" 
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

        {/* 7. Palliative & Rehabilitation Support */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <HeartPulse size={16} />
                  <span>Palliative & Rehabilitation Support</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Care Beyond <span className={styles.titleAccent}>Treatment</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide supportive care to improve quality of life during and after cancer treatment.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Pain management and symptom control",
                    "Nutritional guidance and physical therapy",
                    "Emotional and psychological support",
                    "Post-treatment rehabilitation",
                  ].map((support, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{support}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Focused on comfort, dignity, and recovery.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/rehab.png" 
                    alt="Palliative Support" 
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

        {/* 8. Tobacco & Alcohol De-Addiction Programs */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Shield size={16} />
                  <span>Tobacco & Alcohol De-Addiction Programs</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Prevent, Recover & <span className={styles.titleAccent}>Stay Healthy</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer structured programs to help patients quit harmful habits that increase cancer risk.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Medical and behavioral counseling",
                    "Personalized de-addiction plans",
                    "Long-term lifestyle support",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Prevention is the first step toward a healthier future.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/rehab.png" 
                    alt="De-Addiction Programs" 
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
            <h2 className={styles.sectionTitle}>Why Choose MediNex+ for HNF Oncology?</h2>
            <div className={styles.featuresGrid}>
              {[
                { icon: <Microscope size={24} />, text: "AI-assisted early detection and diagnosis" },
                { icon: <Activity size={24} />, text: "Experienced oncology and surgical specialists" },
                { icon: <Shield size={24} />, text: "Advanced modular OT for safe surgeries" },
                { icon: <Users size={24} />, text: "Multidisciplinary treatment approach" },
                { icon: <HeartPulse size={24} />, text: "Comprehensive rehabilitation and support care" },
                { icon: <Target size={24} />, text: "Strong focus on prevention and awareness" },
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
          title="chedule Your Cancer Screening Consultation"
          description="Early detection can make a life-saving difference. Take the first step toward timely diagnosis and expert care at MediNex+."
          imageSrc="/treatments/oncology/hnf-cta.png"
          imageAlt="Expert Oncology Care"
        />
      </main>
      <Footer />
    </>
  );
}
