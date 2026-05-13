"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Calendar, Search, Clock, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./blog.module.css";

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  Technology: { color: "#0E898F", bg: "#E6F4F4" },
  "Patient Care": { color: "#10B981", bg: "#D1FAE5" },
  Wellness: { color: "#8B5CF6", bg: "#EDE9FE" },
  Research: { color: "#F97316", bg: "#FFF7ED" },
  "Health Tips": { color: "#EC4899", bg: "#FCE7F3" },
  "Medical News": { color: "#0EA5E9", bg: "#E0F2FE" },
};

interface BlogPost {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  category: string;
  publishedAt?: string;
  readTime?: number;
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blogs?public=true&limit=50")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.data) {
          setPosts(d.data.data);
          if (d.data.categories?.length > 1) setCategories(d.data.categories);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter((p) => {
    const matchCategory = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <>
      <Navbar />
      <main>
        <section className={styles.section}>
          <div className="container">
            {/* Filters */}
            <div className={styles.filters}>
              <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <input type="text" placeholder="Search articles..." className={styles.searchInput} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className={styles.categoryTabs}>
                {categories.map((cat) => (
                  <button key={cat} className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ""}`} onClick={() => setActiveCategory(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                <Loader2 size={28} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }} />
                <p>Loading articles...</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : (
              <motion.div className={styles.grid} layout>
                <AnimatePresence mode="popLayout">
                  {filtered.map((post, i) => {
                    const catStyle = CATEGORY_COLORS[post.category] || { color: "#64748b", bg: "#f1f5f9" };
                    const dateStr = post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "";
                    return (
                      <motion.article
                        key={post.slug}
                        className={styles.card}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        whileHover={{ y: -6 }}
                      >
                        <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
                          <div className={styles.imageWrapper}>
                            <img src={post.coverImage || "/images/blog-medtech.png"} alt={post.title} className={styles.cardImage} style={{ width: "100%", height: 220, objectFit: "cover" }} />
                            <span className={styles.categoryBadge} style={{ color: catStyle.color, background: catStyle.bg }}>
                              <TrendingUp size={12} />
                              {post.category || "Blog"}
                            </span>
                          </div>
                          <div className={styles.cardBody}>
                            <div className={styles.meta}>
                              <span className={styles.metaItem}><Calendar size={14} />{dateStr}</span>
                              <span className={styles.metaItem}><Clock size={14} />{post.readTime ? `${post.readTime} min read` : ""}</span>
                            </div>
                            <h3 className={styles.cardTitle}>{post.title}</h3>
                            <p className={styles.cardExcerpt}>{post.excerpt}</p>
                            <span className={styles.readMore}>Read Article <ArrowRight size={16} /></span>
                          </div>
                        </Link>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

            {!loading && filtered.length === 0 && (
              <div className={styles.empty}>
                <p>No articles found. Try a different search or category.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
