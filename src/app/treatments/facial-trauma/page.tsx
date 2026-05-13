import type { Metadata } from "next";
import { 
  Activity, 
  CheckCircle, 
  ArrowRight, 
  Shield, 
  Zap, 
  HeartPulse, 
  Star, 
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
import FacialTraumaHero from "./FacialTraumaHero";

export const metadata: Metadata = {
  title: "Facial Trauma & Maxillofacial Surgery | MediNex+",
  description:
    "Advanced emergency care for facial injuries, jaw fractures, and facial bone reconstruction at MediNex+. Expert maxillofacial surgeons and 24/7 care.",
  keywords: [
    "facial trauma surgery",
    "maxillofacial surgery India",
    "jaw fracture treatment",
    "facial reconstruction",
    "emergency facial care",
    "RTA facial injury",
  ],
};

export default function FacialTraumaPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <FacialTraumaHero />

        {/* 1. Road Traffic Accident (RTA) Facial Injury Management */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Activity size={16} />
                  <span>RTA Facial Injury Management</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Immediate Care When <span className={styles.titleAccent}>Every Second Matters</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide urgent and structured management for facial injuries caused by road accidents, ensuring rapid stabilization and assessment.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Rapid assessment and stabilization",
                    "Management of complex facial injuries",
                    "Coordinated emergency care protocols",
                  ].map((focus, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{focus}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Timely intervention is critical for optimal recovery and outcomes.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/facial-trauma/rta.png" 
                    alt="RTA Facial Injury Care" 
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

        {/* 2. Jaw Fracture Fixation */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Shield size={16} />
                  <span>Jaw Fracture Fixation</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Restore Function with <span className={styles.titleAccent}>Precision Treatment</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We treat mandibular and maxillary fractures using advanced fixation techniques to restore proper bite and symmetry.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Rigid fixation with plates and screws",
                    "Alignment restoration for proper bite (occlusion)",
                    "Minimally invasive surgical approaches",
                  ].map((treatment, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{treatment}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Ensuring proper healing, function, and facial symmetry.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/facial-trauma/jaw.png" 
                    alt="Jaw Fracture Fixation" 
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

        {/* 3. Facial Bone Reconstruction */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Target size={16} />
                  <span>Facial Bone Reconstruction</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Rebuilding Facial Structure with <span className={styles.titleAccent}>Surgical Expertise</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Severe trauma can affect facial bones and structure. We offer advanced reconstructive solutions to restore normal anatomy.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Reconstruction of cheekbones, jaw, and facial contours",
                    "Correction of deformities post-injury",
                    "Use of advanced surgical materials and techniques",
                  ].map((scope, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{scope}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Restoring both appearance and structural integrity.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/facial-trauma/reconstruction.png" 
                    alt="Facial Bone Reconstruction" 
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

        {/* 4. Soft Tissue Repair */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Scissors size={16} />
                  <span>Soft Tissue Repair</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Precision Healing for <span className={styles.titleAccent}>Skin & Facial Tissues</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide expert repair of facial soft tissues including skin, muscles, and nerves with a focus on minimal scarring.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Suturing and wound management",
                    "Minimizing scars and tissue damage",
                    "Functional and aesthetic restoration",
                  ].map((focus, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{focus}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Careful repair for better healing and minimal scarring.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/facial-trauma/softtissue.png" 
                    alt="Soft Tissue Repair" 
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

        {/* 5. Orbital & Nasal Fracture Treatment */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Stethoscope size={16} />
                  <span>Orbital & Nasal Fracture Treatment</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Specialized Care for <span className={styles.titleAccent}>Delicate Facial Areas</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We manage fractures involving the eye socket (orbit) and nasal bones with precision to protect vision and breathing.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Restoration of facial symmetry",
                    "Protection of vision and breathing function",
                    "Minimally invasive correction techniques",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Ensuring both functional and cosmetic recovery.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/screening.png" 
                    alt="Orbital & Nasal Fracture Treatment" 
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

        {/* 6. Post-Trauma Cosmetic Rehabilitation */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Star size={16} />
                  <span>Post-Trauma Cosmetic Rehabilitation</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Regain Confidence <span className={styles.titleAccent}>After Recovery</span>
                </h2>
                <p className={styles.aboutDescription}>
                  After initial healing, we offer aesthetic treatments to improve appearance and restore confidence.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Scar revision treatments",
                    "Facial contour correction",
                    "Skin and soft tissue enhancement",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Helping patients look and feel like themselves again.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/reconstruction.png" 
                    alt="Post-Trauma Cosmetic Rehabilitation" 
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

        {/* 7. Emergency Surgical Care (Modular OT) */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <HeartPulse size={16} />
                  <span>Emergency Surgical Care (Modular OT)</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Hospital-Grade Safety for <span className={styles.titleAccent}>Critical Procedures</span>
                </h2>
                <p className={styles.aboutDescription}>
                  All major trauma surgeries are performed in our state-of-the-art modular operation theatre, ensuring international safety standards.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "International sterilization protocols",
                    "Advanced infection control systems",
                    "High-precision surgical environment",
                  ].map((advantage, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{advantage}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Delivering safe, efficient, and reliable surgical outcomes.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/oncology/surgery.png" 
                    alt="Modular OT" 
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
            <h2 className={styles.sectionTitle}>Why Choose MediNex+ for Facial Trauma Care?</h2>
            <div className={styles.featuresGrid}>
              {[
                { icon: <Activity size={24} />, text: "24/7 emergency response for facial injuries" },
                { icon: <Shield size={24} />, text: "Advanced modular OT for trauma surgeries" },
                { icon: <Users size={24} />, text: "Expert maxillofacial surgeons" },
                { icon: <Target size={24} />, text: "Precision-driven reconstruction techniques" },
                { icon: <Star size={24} />, text: "Focus on both functional recovery and aesthetics" },
                { icon: <HeartPulse size={24} />, text: "Comprehensive post-trauma rehabilitation support" },
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
          title="Seek Immediate Care for Facial Injuries"
          description="In case of facial trauma or emergency, timely care is crucial. Trust the experts at MediNex+ for rapid, safe, and effective treatment."
          imageSrc="/treatments/facial-trauma/facialtrauma-cta.png"
          imageAlt="Emergency facial care"
        />
      </main>
      <Footer />
    </>
  );
}
