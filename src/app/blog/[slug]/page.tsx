"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, Bookmark, Heart,
  ChevronUp, Twitter, Linkedin, Facebook, Link as LinkIcon,
  Check, Sparkles, BookOpen, Tag, Loader2
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./blog-post.module.css";

/* ── colour map ── */
const CAT: Record<string, { c: string; bg: string }> = {
  Technology: { c: "#0E898F", bg: "#e8f5f5" },
  "Patient Care": { c: "#10B981", bg: "#ecfdf5" },
  Wellness: { c: "#8B5CF6", bg: "#f3f0ff" },
  Research: { c: "#F97316", bg: "#fff7ed" },
  "Health Tips": { c: "#EC4899", bg: "#fdf2f8" },
  "Medical News": { c: "#0EA5E9", bg: "#f0f9ff" },
};

/* ── helpers ── */
function processContent(html: string) {
  return html.replace(/<h([23])([^>]*)>([^<]+)<\/h[23]>/g, (_m, lvl, attrs, txt) => {
    const id = txt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `<h${lvl} id="${id}"${attrs}>${txt}</h${lvl}>`;
  });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── sub-components ── */

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return <motion.div className={styles.progressBar} style={{ scaleX, transformOrigin: "0%" }} />;
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button className={styles.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
          <ChevronUp size={22} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function TableOfContents({ content }: { content: string }) {
  const [active, setActive] = useState("");
  const headings = useMemo(() => {
    return (content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/g) || []).map(h => {
      const text = h.replace(/<[^>]+>/g, "");
      return { text, id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), level: h.startsWith("<h3") ? 3 : 2 };
    });
  }, [content]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-20% 0px -75% 0px" }
    );
    headings.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [headings]);

  if (!headings.length) return null;
  return (
    <nav className={styles.toc}>
      <h3 className={styles.tocTitle}><BookOpen size={16} /> Contents</h3>
      <ul className={styles.tocList}>
        {headings.map(({ text, id, level }) => (
          <li key={id} className={level === 3 ? styles.tocItemSub : styles.tocItem}>
            <button onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={`${styles.tocLink} ${active === id ? styles.tocLinkActive : ""}`}>
              {text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const links = [
    { icon: <Twitter size={16} />, label: "Twitter", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { icon: <Linkedin size={16} />, label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { icon: <Facebook size={16} />, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  ];
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className={styles.shareButtons}>
      <span className={styles.shareLabel}>Share</span>
      <div className={styles.shareIcons}>
        {links.map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={styles.shareBtn} aria-label={l.label}>{l.icon}</a>
        ))}
        <button onClick={copy} className={styles.shareBtn} aria-label="Copy link">
          {copied ? <Check size={16} className={styles.copiedIcon} /> : <LinkIcon size={16} />}
        </button>
      </div>
    </div>
  );
}

function EngagementButtons() {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  return (
    <div className={styles.engagement}>
      <motion.button className={`${styles.engagementBtn} ${liked ? styles.liked : ""}`}
        onClick={() => { setLiked(!liked); setLikes(l => liked ? l - 1 : l + 1); }} whileTap={{ scale: 0.92 }}>
        <Heart size={18} fill={liked ? "currentColor" : "none"} /><span>{likes || ""}</span>
      </motion.button>
      <motion.button className={`${styles.engagementBtn} ${saved ? styles.bookmarked : ""}`}
        onClick={() => setSaved(!saved)} whileTap={{ scale: 0.92 }}>
        <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
      </motion.button>
    </div>
  );
}

interface BlogPost {
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  category: string;
  author?: string;
  publishedAt?: string;
  createdAt?: string;
  readTime?: number;
  tags?: string;
}

function RelatedPosts({ currentSlug, posts }: { currentSlug: string; posts: BlogPost[] }) {
  const items = posts.filter(p => p.slug !== currentSlug).slice(0, 2);
  if (!items.length) return null;
  return (
    <div className={styles.relatedGrid}>
      {items.map((p, i) => {
        const cat = CAT[p.category] || { c: "#64748b", bg: "#f1f5f9" };
        return (
          <motion.article key={p.slug} className={styles.relatedCard}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <Link href={`/blog/${p.slug}`} className={styles.relatedLink}>
              <div className={styles.relatedImageWrapper}>
                <img src={p.coverImage || "/images/blog-medtech.png"} alt={p.title} className={styles.relatedImage} />
                <span className={styles.relatedCategory} style={{ color: cat.c, background: cat.bg }}>{p.category}</span>
              </div>
              <div className={styles.relatedContent}>
                <h4 className={styles.relatedTitle}>{p.title}</h4>
                <div className={styles.relatedMeta}>
                  <Calendar size={13} />
                  <span>{p.publishedAt ? fmtDate(p.publishedAt) : ""}</span>
                </div>
              </div>
            </Link>
          </motion.article>
        );
      })}
    </div>
  );
}

/* ===== MAIN PAGE ===== */

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (!slug) return;
    
    fetch(`/api/blogs/${slug}?public=true`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setPost(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/blogs?public=true&limit=5")
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.data) setRelated(d.data.data); })
      .catch(() => {});
  }, [slug]);

  /* Loading */
  if (loading) {
    return (
      <div className={styles.blogPage}>
        <Navbar />
        <main className={styles.loading}>
          <div style={{ textAlign: "center" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#0E898F", marginBottom: 10 }} />
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading article…</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* Not Found */
  if (!post) {
    return (
      <div className={styles.blogPage}>
        <Navbar />
        <main className={styles.notFound}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.notFoundContent}>
              <BookOpen size={56} className={styles.notFoundIcon} />
              <h1>Article Not Found</h1>
              <p>The blog post you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <Link href="/blog" className={styles.backLink}><ArrowLeft size={16} /> Back to Articles</Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* Derived */
  const html = processContent(post.content || "");
  const url = typeof window !== "undefined" ? window.location.href : "";
  const cat = CAT[post.category] || { c: "#64748b", bg: "#f1f5f9" };
  const date = post.publishedAt ? fmtDate(post.publishedAt) : post.createdAt ? fmtDate(post.createdAt) : "";
  const tags = post.tags ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [post.category, "Healthcare"].filter(Boolean);

  return (
    <div className={styles.blogPage}>
      <Navbar />
      <ReadingProgress />

      <main className={styles.main}>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className="container">
            <motion.div className={styles.heroContent} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              <nav className={styles.breadcrumb}>
                <Link href="/blog" className={styles.breadcrumbLink}><ArrowLeft size={15} /> Back to Articles</Link>
              </nav>

              <div className={styles.heroMeta}>
                <span className={styles.category} style={{ color: cat.c, background: cat.bg }}>{post.category || "Insight"}</span>
                <div className={styles.metaItems}>
                  {date && <span className={styles.metaItem}><Calendar size={14} /> {date}</span>}
                  {post.readTime && <span className={styles.metaItem}><Clock size={14} /> {post.readTime} min read</span>}
                </div>
              </div>

              <h1 className={styles.title}>{post.title}</h1>

              {post.author && (
                <div className={styles.author}>
                  <div className={styles.authorAvatar} style={{ background: cat.bg, color: cat.c }}>
                    {post.author.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.authorInfo}>
                    <span className={styles.authorName}>{post.author}</span>
                    <span className={styles.authorRole}>Medical Expert</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── Featured Image ── */}
        {post.coverImage && (
          <section className={styles.featuredImageSection}>
            <div className="container">
              <motion.div className={styles.featuredImageWrapper}
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
                <img src={post.coverImage} alt={post.title} className={styles.featuredImage} />
              </motion.div>
            </div>
          </section>
        )}

        {/* ── Article + Sidebar ── */}
        <section className={styles.articleSection}>
          <div className="container">
            <div className={styles.articleLayout}>

              {/* Content */}
              <article className={styles.article}>
                <motion.div className={styles.content} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }} dangerouslySetInnerHTML={{ __html: html }} />

                {/* Tags + Share */}
                <div className={styles.articleFooter}>
                  <div className={styles.tags}>
                    <span className={styles.tagsLabel}><Tag size={14} /> Tags:</span>
                    <div className={styles.tagList}>
                      {tags.map((t: string) => <span key={t} className={styles.tag}>{t}</span>)}
                    </div>
                  </div>
                  <ShareButtons title={post.title} url={url} />
                </div>

                {/* Author card */}
                {post.author && (
                  <div className={styles.authorBox}>
                    <div className={styles.authorBoxAvatar} style={{ background: cat.bg, color: cat.c }}>
                      {post.author.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.authorBoxInfo}>
                      <span className={styles.authorBoxLabel}>Expert Author</span>
                      <h3 className={styles.authorBoxName}>{post.author}</h3>
                      <p className={styles.authorBoxRole}>Medical Professional</p>
                      <p className={styles.authorBoxBio}>
                        Dedicated to providing accurate, evidence-based health information to help patients make informed decisions about their wellness.
                      </p>
                    </div>
                  </div>
                )}
              </article>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.stickySidebar}>
                  <TableOfContents content={post.content || ""} />
                  <div className={styles.sidebarEngagement}>
                    <EngagementButtons />
                    <ShareButtons title={post.title} url={url} />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Related ── */}
        {related.length > 1 && (
          <section className={styles.relatedSection}>
            <div className="container">
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className={styles.relatedSectionTitle}>Related Articles</h2>
                <RelatedPosts currentSlug={post.slug} posts={related} />
              </motion.div>
            </div>
          </section>
        )}

        {/* ── Newsletter ── */}
        <section className={styles.newsletterSection}>
          <div className="container">
            <motion.div className={styles.newsletter} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className={styles.newsletterContent}>
                <Sparkles size={28} className={styles.newsletterIcon} />
                <h2 className={styles.newsletterTitle}>Stay Updated</h2>
                <p className={styles.newsletterText}>
                  Get the latest health tips and medical insights delivered straight to your inbox.
                </p>
                <form className={styles.newsletterForm} onSubmit={e => e.preventDefault()}>
                  <input type="email" placeholder="Enter your email" className={styles.newsletterInput} />
                  <button type="submit" className={styles.newsletterBtn}>Subscribe</button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BackToTop />
      <Footer />
    </div>
  );
}
