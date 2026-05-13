import type { Metadata } from "next";
import { SmilePlus, CheckCircle, ArrowRight, Shield, Scissors, HeartPulse, Wrench, Ruler, Baby, Sparkles, Cpu, Gem, Zap, AlertCircle, Pill, Microscope } from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../treatments.module.css";
import DentalHero from "./DentalHero";
import CTASection from "../CTASection";

export const metadata: Metadata = {
  title: "Best Dental Clinic in India | Advanced Dental Care & Surgery",
  description:
    "Get advanced dental treatments including implants, RCT, and cosmetic dentistry at MediNex+. Safe procedures with modern technology and modular OT.",
  keywords: [
    "dental clinic India",
    "dental implants",
    "root canal treatment",
    "cosmetic dentistry",
    "teeth whitening",
    "dental surgery India",
  ],
};

export default function DentalTreatmentsPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <DentalHero />

        {/* General Dentistry Section */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              {/* Content Side */}
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <SmilePlus size={16} />
                  <span>General Dentistry</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Healthy Teeth Begin with <span className={styles.titleAccent}>Preventive Care</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our preventive dentistry focuses on maintaining optimal oral health and detecting issues early through AI-assisted diagnosis and routine care.
                </p>

                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "AI-based dental consultation & screening",
                    "Oral prophylaxis (scaling & polishing)",
                    "Fluoride therapy for cavity prevention",
                    "Pit & fissure sealants",
                    "Tooth-colored fillings",
                    "Tooth sensitivity treatment",
                    
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Ideal for maintaining long-term dental health and avoiding major treatments.</span>
                </div>
              </div>

              {/* Visual Side */}
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/treatments/dental/dental-1.png" 
                    alt="General Dentistry Care" 
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

        {/* Restorative Dentistry Section */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              {/* Content Side */}
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Shield size={16} />
                  <span>Restorative Dentistry</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Restore Strength, <span className={styles.titleAccent}>Function & Natural Appearance</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We repair damaged or decayed teeth using advanced materials and techniques that mimic natural teeth.
                </p>

                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Tooth-colored aesthetic fillings",
                    "Post & core build-up",
                    "Inlays & onlays (precision restorations)",
                    "Tooth reconstruction",
                    "Full mouth rehabilitation"
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Designed to restore both function and aesthetics seamlessly.</span>
                </div>
              </div>

              {/* Visual Side */}
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/treatment-dental-2.png" 
                    alt="Restorative Dentistry" 
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

        {/* Prosthodontics Section */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Wrench size={16} />
                  <span>Prosthodontics</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Rebuild Your Smile with <span className={styles.titleAccent}>Advanced Prosthetic Solutions</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer customized solutions to replace missing teeth and restore oral function.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Complete & partial dentures",
                    "Crown & bridge solutions",
                    "Implant-supported prosthesis",
                    "Full mouth rehabilitation",
                    "Maxillofacial prosthesis",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Regain confidence with natural-looking, durable restorations.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/prosthodontics.png" alt="Prosthodontics" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Oral & Maxillofacial Surgery Section */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Scissors size={16} />
                  <span>Oral & Maxillofacial Surgery</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Advanced Surgical Care with <span className={styles.titleAccent}>Maximum Safety</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our surgical procedures are performed in a modular OT setup, ensuring international safety standards.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Tooth extraction (simple & surgical)",
                    "Wisdom tooth removal",
                    "Dental implants",
                    "Bone grafting & sinus lift",
                    "Cyst & tumor removal",
                    "Facial trauma management",
                    "Minor & major oral surgeries",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Expert surgical care with precision and infection control.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/Maxillofacial-Surgery.png" alt="Oral & Maxillofacial Surgery" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Periodontics Section */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <HeartPulse size={16} />
                  <span>Periodontics</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Healthy Gums for <span className={styles.titleAccent}>Strong Teeth</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We treat gum diseases and bone loss using both conventional and laser techniques.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Deep scaling & root planing",
                    "Gum flap surgery",
                    "Laser gum treatment",
                    "Gingivectomy / gingivoplasty",
                    "Pyorrhea treatment",
                    "Bone regeneration procedures",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Essential for maintaining long-term oral health and preventing tooth loss.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/Periodontics.png" alt="Periodontics" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Orthodontics Section */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Ruler size={16} />
                  <span>Orthodontics</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Achieve a <span className={styles.titleAccent}>Perfectly Aligned Smile</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide modern orthodontic solutions for all age groups.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Metal, ceramic & self-ligating braces",
                    "Invisible aligners (clear aligners)",
                    "Lingual braces (hidden braces)",
                    "Growth modification appliances",
                    "Retainers",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Straighten your teeth comfortably with advanced solutions.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/Orthodontics.png" alt="Orthodontics" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Pedodontics Section */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Baby size={16} />
                  <span>Pedodontics</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Gentle Dental Care for <span className={styles.titleAccent}>Children</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We ensure a comfortable, child-friendly dental experience.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Pediatric dental check-ups",
                    "Fluoride application",
                    "Habit-breaking appliances",
                    "Space maintainers",
                    "Pediatric root canal treatment",
                    "Preventive dentistry for children",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Building healthy smiles from an early age.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/Pedodontics.png" alt="Pedodontics" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Cosmetic & Aesthetic Dentistry Section */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Sparkles size={16} />
                  <span>Cosmetic & Aesthetic Dentistry</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Design Your <span className={styles.titleAccent}>Perfect Smile</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Enhance your smile with advanced cosmetic dental treatments.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Digital smile design (DSD)",
                    "Teeth whitening (laser / Zoom)",
                    "Dental veneers (porcelain / composite)",
                    "Hollywood smile makeover",
                    "Tooth reshaping & contouring",
                    "Gap closure (diastema)",
                    "Gum depigmentation",
                    "Cosmetic bonding",
                    "Lip & smile harmony treatments",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Achieve a confident, radiant smile with natural results.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/Cosmetic.png" alt="Cosmetic Dentistry" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* CAD-CAM & Digital Dentistry Section */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Cpu size={16} />
                  <span>CAD-CAM & Digital Dentistry</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Next-Generation <span className={styles.titleAccent}>Digital Dental Solutions</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We utilize cutting-edge digital workflows for faster, more accurate treatments.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Same-day crowns (chairside CAD-CAM)",
                    "Digital impressions (intraoral scanning)",
                    "CAD-CAM veneers & bridges",
                    "AI-based smile designing",
                    "3D printing of prosthesis",
                    "Computer-guided implant surgery",
                    "In-house advanced dental lab",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Precision, speed, and superior outcomes with digital dentistry.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/cad.png" alt="CAD-CAM Digital Dentistry" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Oral Diagnostics & Radiology Section */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Microscope size={16} />
                  <span>Oral Diagnostics & Radiology</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Accurate Diagnosis for <span className={styles.titleAccent}>Better Treatment Outcomes</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Advanced imaging ensures precise treatment planning.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Digital OPG (panoramic X-ray)",
                    "CBCT scan (3D imaging)",
                    "IOPA X-rays",
                    "AI-based diagnosis",
                    "Oral cancer screening",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Early detection leads to better, safer results.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/oral.png" alt="Oral Diagnostics" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Implantology Section */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Gem size={16} />
                  <span>Implantology</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Permanent Solutions for <span className={styles.titleAccent}>Missing Teeth</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We offer world-class dental implant solutions with high success rates.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Single tooth implants",
                    "Full mouth implants (All-on-4 / All-on-6)",
                    "Immediate implants",
                    "Zygomatic implants",
                    "Fixed & removable implant prosthesis",
                    "Guided implant surgery",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Strong, natural-looking, and long-lasting tooth replacement.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/Implantology.png" alt="Implantology" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Laser Dentistry Section */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Zap size={16} />
                  <span>Laser Dentistry</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Minimally Invasive & <span className={styles.titleAccent}>Painless Treatments</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Laser technology ensures faster healing and reduced discomfort.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Laser fillings",
                    "Laser gum surgery",
                    "Laser teeth whitening",
                    "Ulcer treatment",
                    "Soft tissue surgeries",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Comfortable treatments with minimal downtime.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/Laser.png" alt="Laser Dentistry" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Emergency Dental Care Section */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <AlertCircle size={16} />
                  <span>Emergency Dental Care</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Immediate Relief <span className={styles.titleAccent}>When You Need It Most</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide quick and effective emergency dental care.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Toothache relief",
                    "Dental trauma & fracture management",
                    "Emergency extractions",
                    "Infection & abscess treatment",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Prompt care to relieve pain and prevent complications.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/Emergency.png" alt="Emergency Dental Care" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.sectionSeparator} />

        {/* Dental Support Services Section */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Pill size={16} />
                  <span>Dental Support Services</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Complete Care <span className={styles.titleAccent}>Beyond Treatment</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our integrated support services ensure seamless patient experience.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "In-house pharmacy",
                    "Advanced sterilization protocols (modular OT dentistry)",
                    "High-end dental laboratory support",
                    "AI-based patient records (EMR/EHR)",
                  ].map((service, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{service}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Ensuring safety, efficiency, and continuity of care.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image src="/treatments/dental/DentalSupport.png" alt="Dental Support Services" width={500} height={600} className={styles.aboutImage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section — Home Page Style */}
        <CTASection
          title="Ready for a Perfect Smile? <br /> Book Your Consultation Today"
          description="Experience advanced, ethical, and personalized dental treatment designed for your health, confidence, and long-term results."
          imageSrc="/treatments/dental/CTA.png"
          imageAlt="Expert dental care"
        />
      </main>
      <Footer />
    </>
  );
}
