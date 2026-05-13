"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, ArrowRight, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";
import styles from "./Blog.module.css";

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  Technology: { color: "#0E898F", bg: "#E6F4F4" },
  "Patient Care": { color: "#10B981", bg: "#D1FAE5" },
  Wellness: { color: "#8B5CF6", bg: "#EDE9FE" },
  Research: { color: "#F97316", bg: "#FFF7ED" },
  "Health Tips": { color: "#EC4899", bg: "#FCE7F3" },
  "Medical News": { color: "#0EA5E9", bg: "#E0F2FE" },
};

export default function Blog() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [posts, setPosts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/blogs?public=true&limit=3")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.data) {
          setPosts(d.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Don't render the section at all if no published blogs
  if (loaded && posts.length === 0) return null;

  return (
    <section id="blog" className={styles.blog} ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">
            <BookOpen size={16} />
            Latest Insights
          </span>
          <h2 className="section-title">
            Health Tips & <span className={styles.titleAccent}>Insights</span>
          </h2>
          <p className="section-subtitle">
            Stay informed with the latest medical research, health tips, and
            wellness advice from our expert team of physicians.
          </p>
        </motion.div>

        {/* Posts Grid */}
        <div className={styles.grid}>
          {posts.map((post, i) => {
            const catStyle = CATEGORY_COLORS[post.category] || { color: "#64748b", bg: "#f1f5f9" };
            const dateStr = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "";
            return (
              <motion.article
                key={post.slug || post.title}
                className={styles.card}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -6 }}
              >
                <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <div className={styles.imageWrapper}>
                    <img
                      src={post.coverImage || "/images/blog-medtech.png"}
                      alt={post.title}
                      className={styles.cardImage}
                      style={{ width: "100%", height: 240, objectFit: "cover" }}
                    />
                    <span
                      className={styles.category}
                      style={{ color: catStyle.color, background: catStyle.bg }}
                    >
                      {post.category || "Blog"}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.meta}>
                      <span className={styles.metaItem}>
                        <Calendar size={14} />
                        {dateStr}
                      </span>
                      <span className={styles.metaItem}>
                        <Clock size={14} />
                        {post.readTime ? `${post.readTime} min read` : ""}
                      </span>
                    </div>

                    <h3 className={styles.cardTitle}>{post.title}</h3>
                    <p className={styles.cardExcerpt}>{post.excerpt}</p>

                    <span className={styles.readMore}>
                      Read Article
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
