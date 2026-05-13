import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Cookie, Calendar } from "lucide-react";
import styles from "../policy.module.css";

export const metadata: Metadata = {
  title: "Cookie Policy | MediNex+",
  description:
    "Learn about how MediNex+ uses cookies and tracking technologies to improve your browsing experience and deliver personalized content.",
};

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <div className={styles.heroBadge}>
                <Cookie size={16} />
                Cookie Policy
              </div>
              <h1 className={styles.heroTitle}>Cookie Policy</h1>
              <p className={styles.heroSubtitle}>
                This Cookie Policy explains what cookies are, how MediNex+ uses them,
                and how you can manage your cookie preferences when visiting our platform.
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
                  <li className={styles.tocItem}><a href="#what-are-cookies" className={styles.tocLink}>What Are Cookies?</a></li>
                  <li className={styles.tocItem}><a href="#how-we-use" className={styles.tocLink}>How We Use Cookies</a></li>
                  <li className={styles.tocItem}><a href="#types" className={styles.tocLink}>Types of Cookies We Use</a></li>
                  <li className={styles.tocItem}><a href="#third-party-cookies" className={styles.tocLink}>Third-Party Cookies</a></li>
                  <li className={styles.tocItem}><a href="#managing" className={styles.tocLink}>Managing Your Cookie Preferences</a></li>
                  <li className={styles.tocItem}><a href="#cookie-duration" className={styles.tocLink}>Cookie Duration</a></li>
                  <li className={styles.tocItem}><a href="#updates" className={styles.tocLink}>Updates to This Policy</a></li>
                  <li className={styles.tocItem}><a href="#contact" className={styles.tocLink}>Contact Us</a></li>
                </ul>
              </div>

              {/* 1. What Are Cookies */}
              <div id="what-are-cookies" className={styles.section}>
                <h2 className={styles.sectionTitle}>1. What Are Cookies?</h2>
                <p className={styles.sectionText}>
                  Cookies are small text files that are stored on your device (computer, tablet,
                  or mobile phone) when you visit a website. They are widely used to make websites
                  work more efficiently, provide a better browsing experience, and supply information
                  to the website owners.
                </p>
                <p className={styles.sectionText}>
                  Cookies can be &quot;persistent&quot; (remaining on your device until they expire or you
                  delete them) or &quot;session&quot; (deleted when you close your browser). They can also be
                  &quot;first-party&quot; (set by the website you are visiting) or &quot;third-party&quot; (set by a
                  different domain).
                </p>
              </div>

              {/* 2. How We Use Cookies */}
              <div id="how-we-use" className={styles.section}>
                <h2 className={styles.sectionTitle}>2. How We Use Cookies</h2>
                <p className={styles.sectionText}>
                  MediNex+ uses cookies for the following purposes:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}><strong>Essential Functionality:</strong> To enable core website features such as secure areas, navigation, and access to your account</li>
                  <li className={styles.listItem}><strong>Performance & Analytics:</strong> To understand how visitors interact with our website, helping us improve content and usability</li>
                  <li className={styles.listItem}><strong>Personalization:</strong> To remember your preferences, language settings, and customize your experience</li>
                  <li className={styles.listItem}><strong>Marketing & Advertising:</strong> To deliver relevant advertisements and track the effectiveness of our marketing campaigns</li>
                  <li className={styles.listItem}><strong>Security:</strong> To detect and prevent fraud, unauthorized access, and other illegal activities</li>
                </ul>
              </div>

              {/* 3. Types of Cookies We Use */}
              <div id="types" className={styles.section}>
                <h2 className={styles.sectionTitle}>3. Types of Cookies We Use</h2>

                <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--gray-800)", marginBottom: "var(--space-3)" }}>
                  A. Strictly Necessary Cookies
                </h3>
                <p className={styles.sectionText}>
                  These cookies are essential for the website to function properly. They cannot be
                  disabled as the website would not work without them. They are usually set in
                  response to your actions such as logging in, filling in forms, or setting privacy
                  preferences.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Session authentication cookies</li>
                  <li className={styles.listItem}>Security and anti-fraud cookies</li>
                  <li className={styles.listItem}>Load-balancing cookies</li>
                  <li className={styles.listItem}>Cookie consent preference cookies</li>
                </ul>

                <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--gray-800)", marginBottom: "var(--space-3)", marginTop: "var(--space-8)" }}>
                  B. Performance &amp; Analytics Cookies
                </h3>
                <p className={styles.sectionText}>
                  These cookies collect information about how visitors use our website, such as
                  which pages are visited most often and whether users receive error messages. All
                  data is aggregated and anonymized.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Google Analytics (_ga, _gid, _gat)</li>
                  <li className={styles.listItem}>Page view and session tracking</li>
                  <li className={styles.listItem}>Error and performance monitoring</li>
                </ul>

                <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--gray-800)", marginBottom: "var(--space-3)", marginTop: "var(--space-8)" }}>
                  C. Functionality Cookies
                </h3>
                <p className={styles.sectionText}>
                  These cookies allow the website to remember choices you make (such as language
                  or region preferences) and provide enhanced, personalized features.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Language and region preferences</li>
                  <li className={styles.listItem}>Font size and accessibility settings</li>
                  <li className={styles.listItem}>Recently viewed pages or services</li>
                </ul>

                <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--gray-800)", marginBottom: "var(--space-3)", marginTop: "var(--space-8)" }}>
                  D. Marketing &amp; Advertising Cookies
                </h3>
                <p className={styles.sectionText}>
                  These cookies are used to deliver advertisements that are relevant to your
                  interests. They also help limit the number of times you see an ad and measure
                  the effectiveness of advertising campaigns.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Social media platform cookies (Facebook, Instagram, LinkedIn)</li>
                  <li className={styles.listItem}>Retargeting and remarketing cookies</li>
                  <li className={styles.listItem}>Ad performance measurement cookies</li>
                </ul>
              </div>

              {/* 4. Third-Party Cookies */}
              <div id="third-party-cookies" className={styles.section}>
                <h2 className={styles.sectionTitle}>4. Third-Party Cookies</h2>
                <p className={styles.sectionText}>
                  Some cookies on our website are placed by third-party services that appear on our
                  pages. We do not control these cookies and recommend reviewing the privacy policies
                  of these third parties for more information.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <strong>Google Analytics:</strong> Web analytics service provided by Google, Inc.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Social Media Platforms:</strong> Facebook, Instagram, LinkedIn, and Twitter
                    integrate with our site to enable sharing and social features.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Payment Processors:</strong> Secure payment gateways may set cookies to
                    process transactions.
                  </li>
                </ul>
              </div>

              {/* 5. Managing Your Cookie Preferences */}
              <div id="managing" className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Managing Your Cookie Preferences</h2>
                <p className={styles.sectionText}>
                  You have the right to decide whether to accept or reject cookies. You can manage
                  your cookie preferences in the following ways:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <strong>Browser Settings:</strong> Most browsers allow you to refuse or accept
                    cookies, delete existing cookies, and set preferences for certain websites.
                    Consult your browser&apos;s help documentation for instructions.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Cookie Consent Banner:</strong> When you first visit our website, you
                    will see a cookie consent banner allowing you to accept or customize your cookie
                    preferences.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Opt-Out Tools:</strong> You can opt out of Google Analytics by installing
                    the Google Analytics Opt-out Browser Add-on, available at{" "}
                    <a
                      href="https://tools.google.com/dlpage/gaoptout"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactLink}
                    >
                      tools.google.com/dlpage/gaoptout
                    </a>
                  </li>
                  <li className={styles.listItem}>
                    <strong>Network Advertising Initiative:</strong> Opt out of interest-based
                    advertising at{" "}
                    <a
                      href="https://www.networkadvertising.org/choices/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactLink}
                    >
                      networkadvertising.org/choices
                    </a>
                  </li>
                </ul>
                <div className={styles.callout}>
                  <p className={styles.calloutText}>
                    Please note that disabling certain cookies may affect the functionality of our
                    website. Strictly necessary cookies cannot be disabled as they are essential for
                    the website to operate correctly.
                  </p>
                </div>
              </div>

              {/* 6. Cookie Duration */}
              <div id="cookie-duration" className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Cookie Duration</h2>
                <p className={styles.sectionText}>
                  The duration for which cookies remain on your device varies depending on the type:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <strong>Session Cookies:</strong> These are temporary and are deleted when you
                    close your browser.
                  </li>
                  <li className={styles.listItem}>
                    <strong>Persistent Cookies:</strong> These remain on your device for a set period
                    or until manually deleted. Typical durations range from a few days to up to 2 years.
                  </li>
                </ul>
              </div>

              {/* 7. Updates to This Policy */}
              <div id="updates" className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Updates to This Policy</h2>
                <p className={styles.sectionText}>
                  We may update this Cookie Policy from time to time to reflect changes in the
                  cookies we use or for legal, regulatory, or operational reasons. Any changes will
                  be posted on this page with an updated &quot;Last Updated&quot; date.
                </p>
                <p className={styles.sectionText}>
                  We encourage you to review this policy periodically to stay informed about how we
                  use cookies.
                </p>
              </div>

              {/* 8. Contact Us */}
              <div id="contact" className={styles.section}>
                <h2 className={styles.sectionTitle}>8. Contact Us</h2>
                <p className={styles.sectionText}>
                  If you have any questions about our use of cookies or this Cookie Policy, please
                  contact us:
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
                <p className={styles.sectionText}>
                  For more information about how we handle your personal data, please see our{" "}
                  <a href="/privacy-policy" className={styles.contactLink}>Privacy Policy</a>.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
