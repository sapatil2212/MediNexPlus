import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Calendar } from "lucide-react";
import styles from "../policy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | MediNex+",
  description:
    "Learn how MediNex+ collects, uses, and protects your personal information. Our privacy policy outlines your rights and our commitments to data security.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <div className={styles.heroBadge}>
                <Shield size={16} />
                Privacy Policy
              </div>
              <h1 className={styles.heroTitle}>Your Privacy Matters to Us</h1>
              <p className={styles.heroSubtitle}>
                At MediNex+, we are committed to protecting your personal
                information and ensuring transparency about how we collect, use, and
                safeguard your data.
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
                  <li className={styles.tocItem}><a href="#info-collect" className={styles.tocLink}>Information We Collect</a></li>
                  <li className={styles.tocItem}><a href="#how-use" className={styles.tocLink}>How We Use Your Information</a></li>
                  <li className={styles.tocItem}><a href="#info-share" className={styles.tocLink}>How We Share Your Information</a></li>
                  <li className={styles.tocItem}><a href="#data-security" className={styles.tocLink}>Data Security</a></li>
                  <li className={styles.tocItem}><a href="#data-retention" className={styles.tocLink}>Data Retention</a></li>
                  <li className={styles.tocItem}><a href="#your-rights" className={styles.tocLink}>Your Rights</a></li>
                  <li className={styles.tocItem}><a href="#cookies" className={styles.tocLink}>Cookies & Tracking</a></li>
                  <li className={styles.tocItem}><a href="#third-party" className={styles.tocLink}>Third-Party Links</a></li>
                  <li className={styles.tocItem}><a href="#children" className={styles.tocLink}>Children&apos;s Privacy</a></li>
                  <li className={styles.tocItem}><a href="#changes" className={styles.tocLink}>Changes to This Policy</a></li>
                  <li className={styles.tocItem}><a href="#contact" className={styles.tocLink}>Contact Us</a></li>
                </ul>
              </div>

              {/* 1. Information We Collect */}
              <div id="info-collect" className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
                <p className={styles.sectionText}>
                  We collect information that you provide directly to us, as well as information
                  that is gathered automatically when you interact with our services.
                </p>
                <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--gray-800)", marginBottom: "var(--space-3)" }}>
                  Personal Information You Provide
                </h3>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Name, email address, phone number, and contact details</li>
                  <li className={styles.listItem}>Date of birth, gender, and demographic information</li>
                  <li className={styles.listItem}>Medical history, treatment records, and health-related information</li>
                  <li className={styles.listItem}>Appointment bookings and consultation requests</li>
                  <li className={styles.listItem}>Payment and billing information</li>
                  <li className={styles.listItem}>Photographs or medical images shared for treatment purposes</li>
                  <li className={styles.listItem}>Feedback, reviews, and correspondence with our team</li>
                </ul>
                <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--gray-800)", marginBottom: "var(--space-3)", marginTop: "var(--space-6)" }}>
                  Information Collected Automatically
                </h3>
                <ul className={styles.list}>
                  <li className={styles.listItem}>IP address, browser type, and device information</li>
                  <li className={styles.listItem}>Pages visited, time spent, and navigation patterns</li>
                  <li className={styles.listItem}>Referring website addresses and search queries</li>
                  <li className={styles.listItem}>Location data (with your consent)</li>
                  <li className={styles.listItem}>Cookie and tracking pixel data</li>
                </ul>
              </div>

              {/* 2. How We Use Your Information */}
              <div id="how-use" className={styles.section}>
                <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
                <p className={styles.sectionText}>
                  We use the information we collect to provide, maintain, and improve our
                  services, as well as to communicate with you about your care.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Providing and managing your medical treatments and appointments</li>
                  <li className={styles.listItem}>Processing billing and insurance claims</li>
                  <li className={styles.listItem}>Sending appointment reminders, follow-up notifications, and care updates</li>
                  <li className={styles.listItem}>Responding to your inquiries and providing customer support</li>
                  <li className={styles.listItem}>Improving our website, services, and patient experience</li>
                  <li className={styles.listItem}>Conducting research and analytics to enhance treatment outcomes</li>
                  <li className={styles.listItem}>Complying with legal and regulatory requirements</li>
                  <li className={styles.listItem}>Sending promotional communications (with your consent)</li>
                </ul>
              </div>

              {/* 3. How We Share Your Information */}
              <div id="info-share" className={styles.section}>
                <h2 className={styles.sectionTitle}>3. How We Share Your Information</h2>
                <p className={styles.sectionText}>
                  We do not sell your personal information. We may share your information only in the following circumstances:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <strong>Healthcare Providers:</strong> With your treating physicians, specialists, and medical staff involved in your care
                  </li>
                  <li className={styles.listItem}>
                    <strong>Service Partners:</strong> With trusted vendors who assist in operating our website, processing payments, or delivering services on our behalf
                  </li>
                  <li className={styles.listItem}>
                    <strong>Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request
                  </li>
                  <li className={styles.listItem}>
                    <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets
                  </li>
                  <li className={styles.listItem}>
                    <strong>With Your Consent:</strong> When you have given us explicit permission to share your information
                  </li>
                </ul>
              </div>

              {/* 4. Data Security */}
              <div id="data-security" className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Data Security</h2>
                <p className={styles.sectionText}>
                  We implement robust security measures to protect your personal information
                  from unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Encryption of data in transit and at rest (SSL/TLS protocols)</li>
                  <li className={styles.listItem}>Regular security audits and vulnerability assessments</li>
                  <li className={styles.listItem}>Access controls limiting data access to authorized personnel only</li>
                  <li className={styles.listItem}>Secure data storage with industry-standard protections</li>
                  <li className={styles.listItem}>Employee training on data privacy and security best practices</li>
                </ul>
                <div className={styles.callout}>
                  <p className={styles.calloutText}>
                    While we strive to protect your information, no method of transmission over the
                    Internet or electronic storage is 100% secure. We cannot guarantee absolute security
                    but are committed to maintaining the highest industry standards.
                  </p>
                </div>
              </div>

              {/* 5. Data Retention */}
              <div id="data-retention" className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Data Retention</h2>
                <p className={styles.sectionText}>
                  We retain your personal information for as long as necessary to fulfill the purposes
                  described in this policy, unless a longer retention period is required by law.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Medical records are retained in accordance with healthcare regulations</li>
                  <li className={styles.listItem}>Account information is kept for the duration of your active relationship with us</li>
                  <li className={styles.listItem}>Analytics and usage data are typically retained for up to 2 years</li>
                  <li className={styles.listItem}>You may request deletion of your data, subject to legal obligations</li>
                </ul>
              </div>

              {/* 6. Your Rights */}
              <div id="your-rights" className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Your Rights</h2>
                <p className={styles.sectionText}>
                  Depending on your jurisdiction, you may have the following rights regarding your personal information:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li className={styles.listItem}><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li className={styles.listItem}><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                  <li className={styles.listItem}><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
                  <li className={styles.listItem}><strong>Objection:</strong> Object to the processing of your information for certain purposes</li>
                  <li className={styles.listItem}><strong>Withdraw Consent:</strong> Withdraw consent for data processing where consent was the legal basis</li>
                </ul>
                <p className={styles.sectionText}>
                  To exercise any of these rights, please contact us at{" "}
                  <a href="mailto:medinexplus666@gmail.com" className={styles.contactLink}>
                    medinexplus666@gmail.com
                  </a>
                  .
                </p>
              </div>

              {/* 7. Cookies & Tracking */}
              <div id="cookies" className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Cookies &amp; Tracking</h2>
                <p className={styles.sectionText}>
                  We use cookies and similar tracking technologies to enhance your browsing
                  experience and collect usage information. For detailed information about our
                  cookie practices, please refer to our{" "}
                  <a href="/cookie-policy" className={styles.contactLink}>Cookie Policy</a>.
                </p>
              </div>

              {/* 8. Third-Party Links */}
              <div id="third-party" className={styles.section}>
                <h2 className={styles.sectionTitle}>8. Third-Party Links</h2>
                <p className={styles.sectionText}>
                  Our website may contain links to third-party websites or services. We are not
                  responsible for the privacy practices of these external sites. We encourage you
                  to read the privacy policies of any third-party sites you visit.
                </p>
              </div>

              {/* 9. Children's Privacy */}
              <div id="children" className={styles.section}>
                <h2 className={styles.sectionTitle}>9. Children&apos;s Privacy</h2>
                <p className={styles.sectionText}>
                  Our services are not directed to children under the age of 16. We do not
                  knowingly collect personal information from children. If we become aware that we
                  have inadvertently collected data from a child, we will take steps to delete that
                  information promptly.
                </p>
              </div>

              {/* 10. Changes to This Policy */}
              <div id="changes" className={styles.section}>
                <h2 className={styles.sectionTitle}>10. Changes to This Policy</h2>
                <p className={styles.sectionText}>
                  We may update this Privacy Policy from time to time to reflect changes in our
                  practices, technology, or legal requirements. We will notify you of significant
                  changes by posting the updated policy on our website with a revised &quot;Last
                  Updated&quot; date. Your continued use of our services after such changes constitutes
                  acceptance of the updated policy.
                </p>
              </div>

              {/* 11. Contact Us */}
              <div id="contact" className={styles.section}>
                <h2 className={styles.sectionTitle}>11. Contact Us</h2>
                <p className={styles.sectionText}>
                  If you have any questions, concerns, or requests regarding this Privacy Policy,
                  please reach out to us:
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
