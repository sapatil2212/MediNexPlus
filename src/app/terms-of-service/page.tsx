import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, Calendar } from "lucide-react";
import styles from "../policy.module.css";

export const metadata: Metadata = {
  title: "Terms of Service | MediNex+",
  description:
    "Read the Terms of Service for MediNex+. Understand the terms and conditions that govern your use of our platform and hospital management services.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <div className={styles.heroBadge}>
                <FileText size={16} />
                Terms of Service
              </div>
              <h1 className={styles.heroTitle}>Terms of Service</h1>
              <p className={styles.heroSubtitle}>
                These Terms of Service govern your use of the MediNex+ platform and
                services. By accessing or using our services, you agree to be bound by these terms.
              </p>
              <div className={styles.lastUpdated}>
                <Calendar size={14} />
                Last updated: April 1, 2026
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className={styles.content}>
          <div className="container">
            <div className={styles.contentInner}>
              {/* Table of Contents */}
              <div className={styles.toc}>
                <h3 className={styles.tocTitle}>Table of Contents</h3>
                <ul className={styles.tocList}>
                  <li className={styles.tocItem}><a href="#acceptance" className={styles.tocLink}>Acceptance of Terms</a></li>
                  <li className={styles.tocItem}><a href="#services" className={styles.tocLink}>Our Services</a></li>
                  <li className={styles.tocItem}><a href="#user-obligations" className={styles.tocLink}>User Obligations</a></li>
                  <li className={styles.tocItem}><a href="#appointments" className={styles.tocLink}>Appointments & Cancellations</a></li>
                  <li className={styles.tocItem}><a href="#payment" className={styles.tocLink}>Payment & Billing</a></li>
                  <li className={styles.tocItem}><a href="#medical-disclaimer" className={styles.tocLink}>Medical Disclaimer</a></li>
                  <li className={styles.tocItem}><a href="#intellectual-property" className={styles.tocLink}>Intellectual Property</a></li>
                  <li className={styles.tocItem}><a href="#limitation" className={styles.tocLink}>Limitation of Liability</a></li>
                  <li className={styles.tocItem}><a href="#indemnification" className={styles.tocLink}>Indemnification</a></li>
                  <li className={styles.tocItem}><a href="#privacy" className={styles.tocLink}>Privacy</a></li>
                  <li className={styles.tocItem}><a href="#modifications" className={styles.tocLink}>Modifications to Terms</a></li>
                  <li className={styles.tocItem}><a href="#governing-law" className={styles.tocLink}>Governing Law</a></li>
                  <li className={styles.tocItem}><a href="#contact" className={styles.tocLink}>Contact Us</a></li>
                </ul>
              </div>

              {/* 1. Acceptance of Terms */}
              <div id="acceptance" className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
                <p className={styles.sectionText}>
                  By accessing or using the MediNex+ website, booking appointments, or
                  receiving any of our services, you acknowledge that you have read, understood,
                  and agree to be bound by these Terms of Service, as well as our{" "}
                  <a href="/privacy-policy" className={styles.contactLink}>Privacy Policy</a> and{" "}
                  <a href="/cookie-policy" className={styles.contactLink}>Cookie Policy</a>.
                </p>
                <p className={styles.sectionText}>
                  If you do not agree with any part of these terms, you must not use our website or services.
                </p>
              </div>

              {/* 2. Our Services */}
              <div id="services" className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Our Services</h2>
                <p className={styles.sectionText}>
                  MediNex+ provides a range of healthcare and aesthetic services including,
                  but not limited to:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Dental treatments and oral healthcare</li>
                  <li className={styles.listItem}>Dermatology and skin care treatments</li>
                  <li className={styles.listItem}>Hair restoration and trichology services</li>
                  <li className={styles.listItem}>Body contouring and shaping procedures</li>
                  <li className={styles.listItem}>Oncology and cancer care services</li>
                  <li className={styles.listItem}>Facial trauma and reconstructive surgery</li>
                  <li className={styles.listItem}>Nutrition and wellness counseling</li>
                  <li className={styles.listItem}>Sexual health consultations</li>
                  <li className={styles.listItem}>Premium aesthetic procedures</li>
                  <li className={styles.listItem}>Dental and medical tourism services</li>
                </ul>
                <p className={styles.sectionText}>
                  We reserve the right to modify, suspend, or discontinue any service at any time
                  without prior notice.
                </p>
              </div>

              {/* 3. User Obligations */}
              <div id="user-obligations" className={styles.section}>
                <h2 className={styles.sectionTitle}>3. User Obligations</h2>
                <p className={styles.sectionText}>
                  By using our services, you agree to:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Provide accurate, current, and complete information when creating an account or booking appointments</li>
                  <li className={styles.listItem}>Maintain the confidentiality of your account credentials</li>
                  <li className={styles.listItem}>Notify us immediately of any unauthorized use of your account</li>
                  <li className={styles.listItem}>Not use our services for any unlawful or unauthorized purpose</li>
                  <li className={styles.listItem}>Not attempt to gain unauthorized access to any part of our systems</li>
                  <li className={styles.listItem}>Not provide false or misleading medical information</li>
                  <li className={styles.listItem}>Comply with all applicable laws and regulations</li>
                </ul>
              </div>

              {/* 4. Appointments & Cancellations */}
              <div id="appointments" className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Appointments &amp; Cancellations</h2>
                <p className={styles.sectionText}>
                  When booking an appointment with MediNex+, the following terms apply:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Appointments are subject to availability and confirmation by our team</li>
                  <li className={styles.listItem}>You may reschedule or cancel an appointment with at least 24 hours&apos; notice</li>
                  <li className={styles.listItem}>Late cancellations or no-shows may be subject to a cancellation fee</li>
                  <li className={styles.listItem}>We reserve the right to reschedule appointments due to unforeseen circumstances</li>
                  <li className={styles.listItem}>Arriving more than 15 minutes late may result in rescheduling</li>
                </ul>
                <div className={styles.callout}>
                  <p className={styles.calloutText}>
                    We value your time and strive to maintain punctual schedules. We kindly request
                    that you arrive at least 10 minutes before your scheduled appointment time to
                    complete any necessary paperwork.
                  </p>
                </div>
              </div>

              {/* 5. Payment & Billing */}
              <div id="payment" className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Payment &amp; Billing</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}>All fees for services are quoted in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise</li>
                  <li className={styles.listItem}>Payment is due at the time of service unless a payment plan has been arranged in advance</li>
                  <li className={styles.listItem}>We accept various payment methods including cash, credit/debit cards, and digital wallets</li>
                  <li className={styles.listItem}>Treatment packages and promotions are subject to specific terms and may not be combined with other offers</li>
                  <li className={styles.listItem}>Refund policies vary by treatment type and are discussed prior to the procedure</li>
                </ul>
              </div>

              {/* 6. Medical Disclaimer */}
              <div id="medical-disclaimer" className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Medical Disclaimer</h2>
                <p className={styles.sectionText}>
                  The information provided on our website and during consultations is for general
                  informational purposes only and should not be considered a substitute for
                  professional medical advice, diagnosis, or treatment.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Treatment outcomes may vary from person to person</li>
                  <li className={styles.listItem}>Before-and-after images shown are for illustrative purposes and do not guarantee similar results</li>
                  <li className={styles.listItem}>All procedures carry inherent risks, which will be discussed during your consultation</li>
                  <li className={styles.listItem}>You should always seek the advice of a qualified healthcare provider with any questions regarding a medical condition</li>
                </ul>
                <div className={styles.callout}>
                  <p className={styles.calloutText}>
                    Never disregard professional medical advice or delay in seeking it because of
                    something you have read on our website. If you think you may have a medical
                    emergency, call your doctor or emergency services immediately.
                  </p>
                </div>
              </div>

              {/* 7. Intellectual Property */}
              <div id="intellectual-property" className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Intellectual Property</h2>
                <p className={styles.sectionText}>
                  All content on the MediNex+ website, including but not limited to text,
                  graphics, logos, images, audio clips, digital downloads, and data compilations,
                  is the property of MediNex+ or its content suppliers and is protected by
                  Indian and international copyright, trademark, and other intellectual property laws.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>You may not reproduce, distribute, modify, or create derivative works from our content without prior written consent</li>
                  <li className={styles.listItem}>The MediNex+ name, logo, and all related marks are trademarks of MediNex+</li>
                  <li className={styles.listItem}>Unauthorized use of any content or trademarks may violate copyright, trademark, and other laws</li>
                </ul>
              </div>

              {/* 8. Limitation of Liability */}
              <div id="limitation" className={styles.section}>
                <h2 className={styles.sectionTitle}>8. Limitation of Liability</h2>
                <p className={styles.sectionText}>
                  To the fullest extent permitted by applicable law, MediNex+ shall not be
                  liable for any indirect, incidental, special, consequential, or punitive damages,
                  including but not limited to loss of profits, data, or goodwill, arising out of or
                  in connection with your use of our services.
                </p>
                <p className={styles.sectionText}>
                  Our total liability for any claim arising from or related to these terms shall not
                  exceed the amount you paid to MediNex+ for the specific service giving rise
                  to the claim.
                </p>
              </div>

              {/* 9. Indemnification */}
              <div id="indemnification" className={styles.section}>
                <h2 className={styles.sectionTitle}>9. Indemnification</h2>
                <p className={styles.sectionText}>
                  You agree to indemnify, defend, and hold harmless MediNex+, its officers,
                  directors, employees, agents, and affiliates from and against any claims, liabilities,
                  damages, losses, or expenses arising out of or in any way connected with your access
                  to or use of our services, or your violation of these Terms of Service.
                </p>
              </div>

              {/* 10. Privacy */}
              <div id="privacy" className={styles.section}>
                <h2 className={styles.sectionTitle}>10. Privacy</h2>
                <p className={styles.sectionText}>
                  Your use of our services is also governed by our{" "}
                  <a href="/privacy-policy" className={styles.contactLink}>Privacy Policy</a>, which
                  describes how we collect, use, and protect your personal information. By using our
                  services, you consent to the data practices outlined in our Privacy Policy.
                </p>
              </div>

              {/* 11. Modifications to Terms */}
              <div id="modifications" className={styles.section}>
                <h2 className={styles.sectionTitle}>11. Modifications to Terms</h2>
                <p className={styles.sectionText}>
                  We reserve the right to modify these Terms of Service at any time. Changes will
                  be effective immediately upon posting on our website. Your continued use of our
                  services after any changes constitutes your acceptance of the new terms.
                </p>
                <p className={styles.sectionText}>
                  We encourage you to review these terms periodically for updates. Significant
                  changes will be communicated through a notice on our website.
                </p>
              </div>

              {/* 12. Governing Law */}
              <div id="governing-law" className={styles.section}>
                <h2 className={styles.sectionTitle}>12. Governing Law</h2>
                <p className={styles.sectionText}>
                  These Terms of Service shall be governed by and construed in accordance with the
                  laws of India, without regard to its conflict of law provisions. Any disputes
                  arising from these terms shall be subject to the exclusive jurisdiction of the
                  courts in Nashik, Maharashtra, India.
                </p>
              </div>

              {/* 13. Contact Us */}
              <div id="contact" className={styles.section}>
                <h2 className={styles.sectionTitle}>13. Contact Us</h2>
                <p className={styles.sectionText}>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}><strong>Email:</strong>{" "}
                    <a href="mailto:medinexplus666@gmail.com" className={styles.contactLink}>
                      medinexplus666@gmail.com
                    </a>
                  </li>
                  <li className={styles.listItem}><strong>Phone:</strong> +91 90590 53938</li>
                  <li className={styles.listItem}>
                    <strong>Address:</strong> 3/Alampat Business Centre, Near Cycle Circle,
                    Krushi Nagar, College Road, Nashik 422001
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
