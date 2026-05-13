import type { Metadata } from "next";
import { 
  CheckCircle, 
  ArrowRight, 
  Apple, 
  Activity, 
  HeartPulse, 
  Sparkles, 
  Shield, 
  Microscope, 
  Users,
  Target,
  RefreshCw,
  Zap,
  Stethoscope
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTASection from "../CTASection";
import styles from "../treatments.module.css";
import NutritionHero from "./NutritionHero";

export const metadata: Metadata = {
  title: "Clinical Nutrition & Metabolic Wellness | MediNex+",
  description:
    "Science-based nutrition and lifestyle care at MediNex+. Personalized diet planning, weight management, and metabolic wellness for sustainable health transformation.",
  keywords: [
    "clinical nutrition India",
    "metabolic wellness",
    "personalized diet planning",
    "PCOS thyroid diet",
    "diabetic nutrition",
    "lifestyle disease reversal",
  ],
};

export default function NutritionPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <NutritionHero />

        {/* 1. Personalized Diet Planning */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Apple size={16} />
                  <span>Personalized Diet Planning</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Nutrition Tailored to Your <span className={styles.titleAccent}>Body & Goals</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Every individual is unique—and so should be their diet. We provide customized meal plans based on body type, lifestyle, and health conditions.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Customized meal plans based on body type and lifestyle",
                    "Balanced nutrition using practical Indian diet habits",
                    "Easy-to-follow, sustainable eating plans",
                  ].map((approach, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{approach}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>No crash diets—only realistic and long-term solutions.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/nutrition/healthy_indian_thali.png" 
                    alt="Personalized Diet Planning" 
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

        {/* 2. Weight Loss & Weight Gain Programs */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Target size={16} />
                  <span>Weight Loss & Weight Gain Programs</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Achieve Your Ideal Weight <span className={styles.titleAccent}>Safely & Effectively</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Whether your goal is weight loss or healthy weight gain, our programs are scientifically designed for lasting results without muscle loss.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Fat loss without muscle loss",
                    "Healthy weight gain with proper nutrition",
                    "Regular monitoring and guidance",
                  ].map((feature, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Transform your body the healthy way.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/nutrition/indian_wellness_lifestyle.png" 
                    alt="Weight Management" 
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

        {/* 3. PCOS / Thyroid Diet Management */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Activity size={16} />
                  <span>PCOS / Thyroid Diet Management</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Balance Hormones with <span className={styles.titleAccent}>Targeted Nutrition</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Hormonal imbalances require specialized care and nutrition planning to manage symptoms and improve metabolism naturally.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Improved hormonal balance",
                    "Better metabolism and weight control",
                    "Reduction in PCOS and thyroid-related symptoms",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Manage your condition naturally with expert guidance.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/nutrition/indian_pcos_wellness.png" 
                    alt="Hormonal Diet Management" 
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

        {/* 4. Diabetic & Cardiac Nutrition */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <HeartPulse size={16} />
                  <span>Diabetic & Cardiac Nutrition</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Medical Nutrition for Better <span className={styles.titleAccent}>Disease Management</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We provide clinically guided nutrition plans for managing chronic conditions like diabetes and heart disease.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Blood sugar control through diet",
                    "Heart-healthy nutrition plans",
                    "Reduction of risk factors",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Control your health without compromising your lifestyle.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/nutrition/indian_diet_planning.png" 
                    alt="Medical Nutrition" 
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

        {/* 5. Skin & Hair Nutrition Therapy */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Sparkles size={16} />
                  <span>Skin & Hair Nutrition Therapy</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Nourish Beauty <span className={styles.titleAccent}>from Within</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Healthy skin and hair start with the right nutrition. Enhance your natural beauty through a nutrient-rich diet.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Improved skin glow and texture",
                    "Reduced hair fall and better hair growth",
                    "Nutrient-rich diet for overall beauty",
                  ].map((benefit, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Enhance your natural beauty through nutrition.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/nutrition/indian_beauty_nutrition.png" 
                    alt="Beauty Nutrition" 
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

        {/* 6. Detox & Wellness Programs */}
        <section className={styles.about}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <RefreshCw size={16} />
                  <span>Detox & Wellness Programs</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Cleanse, Rejuvenate & <span className={styles.titleAccent}>Recharge Your Body</span>
                </h2>
                <p className={styles.aboutDescription}>
                  Our detox programs help eliminate toxins and restore internal balance for improved digestion and increased energy.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Improved digestion and metabolism",
                    "Increased energy levels",
                    "Better overall wellbeing",
                  ].map((result, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{result}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Feel lighter, healthier, and more energized.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/nutrition/indian_detox_drinks.png" 
                    alt="Detox Programs" 
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

        {/* 7. Lifestyle Disease Reversal Plans */}
        <section className={`${styles.about} ${styles.reversedLayout}`}>
          <div className="container">
            <div className={styles.aboutInner}>
              <div className={styles.aboutContent}>
                <div className={styles.heroBadge}>
                  <Zap size={16} />
                  <span>Lifestyle Disease Reversal Plans</span>
                </div>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                  Reverse Lifestyle Disorders <span className={styles.titleAccent}>Naturally</span>
                </h2>
                <p className={styles.aboutDescription}>
                  We focus on addressing the root cause of lifestyle diseases through structured programs for obesity, diabetes, and hypertension.
                </p>
                <div className={`${styles.aboutFeatures} ${styles.leftAlignMobile}`}>
                  {[
                    "Obesity and Metabolic disorders",
                    "Diabetes management and reversal",
                    "Hypertension and stress management",
                  ].map((item, i) => (
                    <div key={i} className={styles.aboutFeatureItem}>
                      <CheckCircle className={styles.aboutFeatureIcon} size={18} />
                      <span className={styles.aboutFeatureText}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.aboutIdeal}>
                  <ArrowRight size={20} className={styles.aboutFeatureIcon} />
                  <span>Sustainable health transformation through diet and lifestyle.</span>
                </div>
              </div>
              <div className={styles.aboutVisual}>
                <div className={styles.aboutImageWrapper}>
                  <Image 
                    src="/images/nutrition/indian_disease_reversal.png" 
                    alt="Disease Reversal" 
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
            <h2 className={styles.sectionTitle}>Why Choose MediNex+ for Clinical Nutrition?</h2>
            <div className={styles.featuresGrid}>
              {[
                { icon: <Microscope size={24} />, text: "Personalized, science-based diet plans" },
                { icon: <Users size={24} />, text: "Expert clinical nutritionists and wellness specialists" },
                { icon: <RefreshCw size={24} />, text: "Focus on sustainable and long-term results" },
                { icon: <Stethoscope size={24} />, text: "Integrated approach with medical and lifestyle care" },
                { icon: <Activity size={24} />, text: "Customized programs for every health condition" },
                { icon: <Shield size={24} />, text: "Patient-first, ethical, and result-oriented care" },
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
          title="Start Your Wellness Journey <br /> Today"
          description="Take control of your health, weight, and lifestyle with expert guidance. Book your consultation and begin your journey toward a healthier, more balanced life."
          imageSrc="/images/nutrition/indian_wellness_cta.png"
          imageAlt="Start Wellness Journey"
        />
      </main>
      <Footer />
    </>
  );
}
