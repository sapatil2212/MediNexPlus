"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Globe, 
  MapPin, 
  Clock, 
  IndianRupee, 
  ArrowRight,
  Check,
  Mountain, 
  Palmtree, 
  Waves, 
  Trees, 
  Compass,
  HeartPulse,
  Shield,
  Plane,
  Hotel,
  Stethoscope,
  ChevronDown,
  Search,
  X,
  User,
  Mail,
  Phone,
  Paperclip,
  Users,
  Send
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { medicalTourismData } from "./tourismData";
import styles from "./medical-tourism.module.css";
import heroStyles from "../treatments.module.css";
import MedicalTourismHero from "./MedicalTourismHero";
import BookingModal from "./BookingModal";
import newsletterStyles from "@/components/Newsletter.module.css";

const IconMap: Record<string, any> = {
  Mountain,
  Palmtree,
  Waves,
  Trees,
  Compass
};

export default function MedicalTourismPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const aboutRef = useRef(null);
  const isAboutInView = useInView(aboutRef, { once: true, margin: "-100px" });
  const zonesRef = useRef(null);
  const isZonesInView = useInView(zonesRef, { once: true, margin: "-100px" });

  const openBookingModal = (zoneId?: string) => {
    setSelectedZone(zoneId || "");
    setIsBookingModalOpen(true);
  };

  const features = [
    { icon: Stethoscope, title: "World-Class Healthcare", desc: "Access to JCI-accredited hospitals and renowned specialists" },
    { icon: Plane, title: "Complete Travel Support", desc: "Visa assistance, airport transfers, and flight bookings" },
    { icon: Hotel, title: "Premium Accommodation", desc: "5-star hotels and recovery suites near medical facilities" },
    { icon: Shield, title: "Comprehensive Insurance", desc: "Medical travel insurance and 24/7 emergency support" },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* HERO SECTION - Same as other treatment pages */}
        <MedicalTourismHero onBookNow={() => openBookingModal()} />

        {/* ABOUT SECTION - Basic details about medical tourism */}
        <section className={styles.aboutSection} ref={aboutRef}>
          <div className="container">
            <div className={styles.aboutGrid}>
              {/* Left: Content */}
              <motion.div 
                className={styles.aboutContent}
                initial={{ opacity: 0, x: -30 }}
                animate={isAboutInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <span className="section-label">
                  <Globe size={16} />
                  Medical Tourism
                </span>
                <h2 className="section-title">
                  World-Class Healthcare <span className={styles.accent}>in India</span>
                </h2>
                <p className={styles.aboutText}>
                  Experience the perfect blend of advanced medical care and unforgettable travel. 
                  At MediNex+, we specialize in providing international patients with 
                  seamless medical tourism experiences across India's most iconic destinations.
                </p>
                <p className={styles.aboutText}>
                  From state-of-the-art hospitals to serene recovery environments, we handle 
                  every aspect of your journey — medical consultations, travel arrangements, 
                  accommodation, and post-treatment care — ensuring a stress-free healing experience.
                </p>

                <div className={styles.featuresGrid}>
                  {features.map((feature, idx) => (
                    <motion.div 
                      key={feature.title}
                      className={styles.featureItem}
                      initial={{ opacity: 0, y: 20 }}
                      animate={isAboutInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                    >
                      <div className={styles.featureIcon}>
                        <feature.icon size={20} />
                      </div>
                      <div>
                        <h4 className={styles.featureTitle}>{feature.title}</h4>
                        <p className={styles.featureDesc}>{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right: Image */}
              <motion.div 
                className={styles.aboutImageContainer}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Image
                  src="/images/medical-tourism/medical-tourism-about.png"
                  alt="Medical Tourism in India"
                  fill
                  className={styles.aboutImage}
                  style={{ objectFit: "cover" }}
                />
              </motion.div>
            </div>


          </div>
        </section>

        {/* REGIONAL CIRCUITS SECTION - Cards like homepage treatments */}
        <section className={styles.circuitsSection} ref={zonesRef}>
          <div className="container">
            {/* Header */}
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              animate={isZonesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <button className={styles.sectionLabelBtn} onClick={() => openBookingModal()}>
                <HeartPulse size={16} />
                Explore Destinations
              </button>
              <h2 className="section-title">
                Regional <span className={styles.accent}>Circuits</span>
              </h2>
              <p className="section-subtitle">
                Choose from our carefully curated regional circuits, each offering unique 
                healthcare and travel experiences across India&apos;s most sought-after destinations.
              </p>
            </motion.div>

            {/* Cards Grid - Homepage Services style */}
            <div className={styles.circuitsGrid}>
              {medicalTourismData.map((zone, i) => {
                const ZoneIcon = IconMap[zone.icon] || Globe;
                return (
                  <motion.div
                    key={zone.id}
                    className={styles.circuitCard}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isZonesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    {/* Card Image - Half */}
                    <div className={styles.circuitImageContainer}>
                      <Image
                        src={zone.image}
                        alt={zone.name}
                        fill
                        className={styles.circuitImage}
                        onError={(e: any) => {
                          e.target.src = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop";
                        }}
                      />
                    </div>
                    
                    {/* Card Content - Half */}
                    <div className={styles.circuitContent}>
                      <div className={styles.circuitIcon}>
                        <ZoneIcon size={20} />
                      </div>
                      <h3 className={styles.circuitTitle}>{zone.name}</h3>
                      <p className={styles.circuitDesc}>{zone.shortDescription}</p>
                      
                      <div className={styles.benefitsSection}>
                        <h4 className={styles.benefitsLabel}>Coverage:</h4>
                        <div className={styles.benefitsGrid}>
                          {zone.coverage.slice(0, 3).map((item) => (
                            <span key={item} className={styles.benefitBadge}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className={styles.circuitMeta}>
                        <div className={styles.metaItem}>
                          <IndianRupee size={12} />
                          <span>{zone.startingPackage}</span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <Link 
                          href={`/treatments/medical-tourism/${zone.id}`}
                          className={styles.viewMoreBtn}
                        >
                          View Details <ArrowRight size={14} />
                        </Link>
                        <button 
                          className={styles.bookNowBtn}
                          onClick={() => openBookingModal(zone.id)}
                        >
                          Book Now <Check size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TOP STATES SECTION */}
        <section className={`${styles.circuitsSection} ${styles.statesSection}`}>
          <div className="container">
            <motion.div
              className={styles.sectionHeader}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <button className={styles.sectionLabelBtn} onClick={() => openBookingModal()}>
                <MapPin size={16} />
                Popular Destinations
              </button>
              <h2 className="section-title">
                Explore Top <span className={styles.accent}>Healing Destinations</span>
              </h2>
              <p className="section-subtitle">
                Discover our handpicked states offering world-class medical facilities and breathtaking beauty.
              </p>
            </motion.div>

            <div className={styles.statesGrid}>
              {medicalTourismData.flatMap(z => z.states).map((state, i) => (
                <motion.div
                  key={state.id}
                  className={styles.stateCard}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div className={styles.stateImageContainer}>
                    <Image
                      src={state.image}
                      alt={state.name}
                      fill
                      className={styles.stateImage}
                      onError={(e: any) => {
                        e.target.src = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop";
                      }}
                    />
                    <div className={styles.statePriceBadge}>From {state.startingPrice}</div>
                  </div>
                  <div className={styles.circuitContent}>
                    <h3 className={styles.circuitTitle}>{state.name}</h3>
                    <p className={styles.circuitDesc}>{state.experience}</p>
                    
                    <div className={styles.vibeTagsGroup}>
                      {state.vibe.slice(0, 3).map(v => (
                        <span key={v} className={styles.vibeTagBadge}>{v}</span>
                      ))}
                    </div>

                    <div className={styles.cardActions} style={{ marginTop: 'auto' }}>
                      <Link 
                        href={`/treatments/medical-tourism/${state.id}`}
                        className={styles.viewMoreBtn}
                      >
                        Explore {state.name} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className={newsletterStyles.newsletterSection}>
          <div className={newsletterStyles.container}>
            <div className={newsletterStyles.content}>
              <h2 className={newsletterStyles.title}>
                Ready to Begin Your <br /> Medical Journey?
              </h2>
              <p className={newsletterStyles.subtitle}>
                Get a personalized medical tourism package tailored to your healthcare needs and travel preferences.
              </p>
              
              <div className={newsletterStyles.form}>
                <button 
                  type="button" 
                  className={newsletterStyles.button}
                  onClick={() => openBookingModal()}
                >
                  Plan Your Journey
                  <ArrowRight size={18} className={newsletterStyles.buttonIcon} />
                </button>
              </div>
            </div>
            
            <div className={newsletterStyles.imageWrapper}>
              <Image 
                src="/images/medical-tourism/medical-tourism-cta.png" 
                alt="Medical Tourism Support" 
                width={500} 
                height={600} 
                className={newsletterStyles.image}
                priority
              />
            </div>
          </div>
        </section>
      </main>
      
      <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} preSelectedZone={selectedZone} />
      <Footer />
    </>
  );
}
