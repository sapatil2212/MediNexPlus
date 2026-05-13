"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Pencil, Trash2, Eye, Search, Filter, Loader2, X, Save,
  FileText, Upload, Sparkles, ChevronRight, Calendar, Clock, Tag,
  Globe, ArrowLeft, CheckCircle, AlertCircle, Image as ImageIcon,
  BookOpen, BarChart2, Send
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const CATEGORIES = ["Technology", "Patient Care", "Wellness", "Research", "Health Tips", "Medical News"];
const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  Technology: { color: "#0E898F", bg: "#E6F4F4" },
  "Patient Care": { color: "#10B981", bg: "#D1FAE5" },
  Wellness: { color: "#8B5CF6", bg: "#EDE9FE" },
  Research: { color: "#F97316", bg: "#FFF7ED" },
  "Health Tips": { color: "#EC4899", bg: "#FCE7F3" },
  "Medical News": { color: "#0EA5E9", bg: "#E0F2FE" },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    DRAFT: { bg: "#f1f5f9", color: "#64748b", label: "Draft" },
    PUBLISHED: { bg: "#d1fae5", color: "#059669", label: "Published" },
    ARCHIVED: { bg: "#fef3c7", color: "#d97706", label: "Archived" },
  };
  const s = map[status] || map.DRAFT;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default function BlogPanel() {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [blogs, setBlogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", coverImage: "",
    category: "", tags: "", author: "", status: "DRAFT",
    metaTitle: "", metaDesc: "",
  });

  // AI state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiLength, setAiLength] = useState("medium");
  const [aiLoading, setAiLoading] = useState(false);

  // Image upload
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadBlogs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    params.set("limit", "50");
    const d = await api(`/api/blogs?${params}`);
    if (d.success) setBlogs(d.data?.data || []);
    setLoading(false);
  };

  const loadStats = async () => {
    const d = await api("/api/blogs?stats=true");
    if (d.success) setStats(d.data);
  };

  useEffect(() => { loadBlogs(); loadStats(); }, []);
  useEffect(() => { loadBlogs(); }, [search, filterStatus]);

  const resetForm = () => {
    setForm({ title: "", slug: "", excerpt: "", content: "", coverImage: "", category: "", tags: "", author: "", status: "DRAFT", metaTitle: "", metaDesc: "" });
    setEditId(null);
    setMsg(null);
  };

  const openAdd = () => { resetForm(); setView("add"); };
  const openEdit = async (id: string) => {
    const d = await api(`/api/blogs/${id}`);
    if (d.success) {
      const b = d.data;
      setForm({
        title: b.title || "", slug: b.slug || "", excerpt: b.excerpt || "", content: b.content || "",
        coverImage: b.coverImage || "", category: b.category || "", tags: b.tags || "",
        author: b.author || "", status: b.status || "DRAFT", metaTitle: b.metaTitle || "", metaDesc: b.metaDesc || "",
      });
      setEditId(id);
      setView("edit");
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setMsg({ type: "error", text: "Title is required" }); return; }
    setSaving(true);
    setMsg(null);
    const payload = { ...form };
    if (!payload.slug) delete (payload as any).slug;

    let d;
    if (editId) {
      d = await api(`/api/blogs/${editId}`, "PUT", payload);
    } else {
      d = await api("/api/blogs", "POST", payload);
    }

    if (d.success) {
      setMsg({ type: "success", text: editId ? "Blog updated!" : "Blog created!" });
      loadBlogs();
      loadStats();
      setTimeout(() => { setView("list"); resetForm(); }, 1000);
    } else {
      setMsg({ type: "error", text: d.message || "Failed to save" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const d = await api(`/api/blogs/${deleteTarget.id}`, "DELETE");
    if (d.success) {
      loadBlogs();
      loadStats();
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "image");
    try {
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      const d = await res.json();
      if (d.success) {
        setForm(f => ({ ...f, coverImage: d.data.url }));
      } else {
        setMsg({ type: "error", text: d.message || "Upload failed" });
      }
    } catch {
      setMsg({ type: "error", text: "Upload failed" });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    setMsg(null);
    const d = await api("/api/blogs/generate", "POST", { topic: aiTopic, tone: aiTone, length: aiLength });
    if (d.success && d.data) {
      setForm(f => ({
        ...f,
        title: d.data.title || f.title,
        excerpt: d.data.excerpt || f.excerpt,
        content: d.data.content || f.content,
        category: d.data.category || f.category,
        tags: d.data.tags || f.tags,
        metaTitle: d.data.metaTitle || f.metaTitle,
        metaDesc: d.data.metaDesc || f.metaDesc,
      }));
      setAiOpen(false);
      setMsg({ type: "success", text: "AI content generated! Review and edit as needed." });
    } else {
      setMsg({ type: "error", text: d.message || "AI generation failed" });
    }
    setAiLoading(false);
  };

  const generateSlug = () => {
    const slug = form.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
    setForm(f => ({ ...f, slug }));
  };

  // ─── LIST VIEW ───
  if (view === "list") {
    return (
      <div>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Total Blogs", val: stats?.total ?? "—", icon: BookOpen },
            { label: "Published", val: stats?.published ?? "—", icon: Globe },
            { label: "Drafts", val: stats?.drafts ?? "—", icon: FileText },
            { label: "Categories", val: stats?.categories?.length ?? "—", icon: Tag },
          ].map((s, i) => {
            const SI = s.icon;
            return (
              <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <SI size={16} color="#0A6B70" />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="hd-card" style={{ marginBottom: 16 }}>
          <div className="hd-card-head">
            <div>
              <div className="hd-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={16} color="#0E898F" /> Blog Management
              </div>
              <div className="hd-card-sub">{blogs.length} blog{blogs.length !== 1 ? "s" : ""} found</div>
            </div>
            <button className="hd-btn-primary" onClick={openAdd}><Plus size={14} /> New Blog</button>
          </div>

          {/* Filters */}
          <div style={{ padding: "12px 18px", display: "flex", gap: 10, alignItems: "center", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                placeholder="Search blogs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", background: "#f8fafc" }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, background: "#f8fafc", cursor: "pointer" }}
            >
              <option value="">All Status</option>
              <option value="DRAFT">Drafts</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Table */}
          <div className="hd-tbl-wrap">
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                <Loader2 size={20} className="hd-spin" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 12 }}>Loading blogs...</div>
              </div>
            ) : blogs.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                <BookOpen size={28} style={{ margin: "0 auto 10px", display: "block", opacity: .3 }} />
                <div style={{ fontSize: 13 }}>No blogs yet. Create your first blog!</div>
              </div>
            ) : (
              <table className="hd-tbl">
                <thead>
                  <tr>
                    <th>Blog</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((b: any) => {
                    const catStyle = CATEGORY_COLORS[b.category] || { color: "#64748b", bg: "#f1f5f9" };
                    return (
                      <tr key={b.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {b.coverImage ? (
                              <img src={b.coverImage} alt="" style={{ width: 44, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 44, height: 32, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <ImageIcon size={14} color="#94a3b8" />
                              </div>
                            )}
                            <div style={{ overflow: "hidden" }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280 }}>{b.title}</div>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>by {b.author || "Admin"} {b.readTime ? `· ${b.readTime} min read` : ""}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {b.category ? (
                            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, color: catStyle.color, background: catStyle.bg }}>
                              {b.category}
                            </span>
                          ) : <span style={{ color: "#cbd5e1", fontSize: 11 }}>—</span>}
                        </td>
                        <td><StatusBadge status={b.status} /></td>
                        <td style={{ fontSize: 11, color: "#64748b" }}>
                          {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="hd-card-icon-btn" title="Edit" onClick={() => openEdit(b.id)} style={{ background: "#E6F4F4", color: "#0E898F", border: "none" }}><Pencil size={12} /></button>
                            {b.status === "PUBLISHED" && (
                              <button className="hd-card-icon-btn" title="View" onClick={() => window.open(`/blog/${b.slug}`, "_blank")} style={{ background: "#e0f2fe", color: "#0369a1", border: "none" }}><Eye size={12} /></button>
                            )}
                            <button className="hd-card-icon-btn" title="Delete" onClick={() => setDeleteTarget(b)} style={{ background: "#fee2e2", color: "#ef4444", border: "none" }}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Delete confirm */}
        {deleteTarget && (
          <div className="hd-modal-bg" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
            <div className="hd-modal" style={{ maxWidth: 380 }}>
              <div className="hd-modal-title">Delete Blog</div>
              <div className="hd-modal-sub">Are you sure you want to delete &quot;{deleteTarget.title}&quot;? This cannot be undone.</div>
              <div className="hd-ma">
                <button className="hd-mcancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 2, padding: 10, borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {deleting ? <span className="hd-spin" /> : <><Trash2 size={13} /> Delete</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── ADD / EDIT VIEW ───
  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => { setView("list"); resetForm(); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b" }}>
          <ArrowLeft size={16} /> Back to Blogs
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setAiOpen(true)} style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid #a855f7", background: "#faf5ff", color: "#9333ea", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={14} /> AI Write
          </button>
          <button onClick={handleSave} disabled={saving} className="hd-btn-primary">
            {saving ? <span className="hd-spin" /> : <><Save size={14} /> {editId ? "Update" : "Save"} Blog</>}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#16a34a" : "#dc2626", border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* Main editor */}
        <div>
          {/* Title */}
          <div className="hd-card" style={{ marginBottom: 14 }}>
            <div style={{ padding: 18 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>Title</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Enter blog title..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600, outline: "none", color: "#1e293b" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b" }}>Slug</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated-from-title"
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 11, outline: "none", color: "#475569", background: "#f8fafc" }}
                />
                <button onClick={generateSlug} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 10, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="hd-card" style={{ marginBottom: 14 }}>
            <div style={{ padding: 18 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder="Brief summary of the blog post..."
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", resize: "vertical", color: "#475569", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="hd-card" style={{ marginBottom: 14 }}>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b" }}>Content (HTML)</label>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>Supports HTML: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, etc.</span>
              </div>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write your blog content in HTML..."
                rows={16}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", resize: "vertical", color: "#475569", fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace", lineHeight: 1.6, background: "#fafafa" }}
              />
            </div>
          </div>

          {/* Content Preview */}
          {form.content && (
            <div className="hd-card" style={{ marginBottom: 14 }}>
              <div className="hd-card-head">
                <div className="hd-card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}><Eye size={14} /> Content Preview</div>
              </div>
              <div style={{ padding: 18, fontSize: 13, lineHeight: 1.8, color: "#334155" }} dangerouslySetInnerHTML={{ __html: form.content }} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Publish settings */}
          <div className="hd-card" style={{ marginBottom: 14 }}>
            <div className="hd-card-head">
              <div className="hd-card-title">Publish</div>
            </div>
            <div style={{ padding: 16 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, cursor: "pointer", background: "#f8fafc" }}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginTop: 14, marginBottom: 6 }}>Author</label>
              <input
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                placeholder="Author name"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", background: "#f8fafc" }}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="hd-card" style={{ marginBottom: 14 }}>
            <div className="hd-card-head">
              <div className="hd-card-title">Cover Image</div>
            </div>
            <div style={{ padding: 16 }}>
              {form.coverImage ? (
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <img src={form.coverImage} alt="Cover" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }} />
                  <button onClick={() => setForm(f => ({ ...f, coverImage: "" }))} style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 6, background: "rgba(0,0,0,.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ height: 120, borderRadius: 10, border: "2px dashed #cbd5e1", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6 }}
                >
                  {uploading ? (
                    <Loader2 size={20} className="hd-spin" style={{ color: "#0E898F" }} />
                  ) : (
                    <>
                      <Upload size={20} color="#94a3b8" />
                      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Click to upload image</span>
                    </>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>Or paste image URL</label>
                <input
                  value={form.coverImage}
                  onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                  placeholder="https://..."
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 11, outline: "none", marginTop: 4, background: "#f8fafc" }}
                />
              </div>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="hd-card" style={{ marginBottom: 14 }}>
            <div className="hd-card-head">
              <div className="hd-card-title">Category & Tags</div>
            </div>
            <div style={{ padding: 16 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, cursor: "pointer", background: "#f8fafc" }}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginTop: 14, marginBottom: 6 }}>Tags</label>
              <input
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="health, wellness, tips (comma separated)"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", background: "#f8fafc" }}
              />
            </div>
          </div>

          {/* SEO */}
          <div className="hd-card" style={{ marginBottom: 14 }}>
            <div className="hd-card-head">
              <div className="hd-card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}><BarChart2 size={14} color="#0E898F" /> SEO Settings</div>
            </div>
            <div style={{ padding: 16 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>Meta Title</label>
              <input
                value={form.metaTitle}
                onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                placeholder="SEO title (max 60 chars)"
                maxLength={120}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", background: "#f8fafc" }}
              />
              <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "right", marginTop: 2 }}>{form.metaTitle.length}/120</div>

              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>Meta Description</label>
              <textarea
                value={form.metaDesc}
                onChange={e => setForm(f => ({ ...f, metaDesc: e.target.value }))}
                placeholder="SEO description (max 155 chars)"
                maxLength={300}
                rows={3}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit", background: "#f8fafc" }}
              />
              <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "right", marginTop: 2 }}>{form.metaDesc.length}/300</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {aiOpen && (
        <div className="hd-modal-bg" onClick={e => { if (e.target === e.currentTarget) setAiOpen(false); }}>
          <div className="hd-modal" style={{ maxWidth: 480 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="hd-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color="#9333ea" /> AI Blog Writer
              </div>
              <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}><X size={18} /></button>
            </div>
            <div className="hd-modal-sub">Describe the topic and let AI generate SEO-friendly blog content for you.</div>

            <div className="hd-mf">
              <label className="hd-ml">Topic / Title Idea</label>
              <textarea
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                placeholder="e.g., Benefits of regular health checkups for early disease detection"
                rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="hd-mf">
                <label className="hd-ml">Tone</label>
                <select value={aiTone} onChange={e => setAiTone(e.target.value)} className="hd-mi" style={{ cursor: "pointer" }}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="educational">Educational</option>
                  <option value="empathetic">Empathetic</option>
                </select>
              </div>
              <div className="hd-mf">
                <label className="hd-ml">Length</label>
                <select value={aiLength} onChange={e => setAiLength(e.target.value)} className="hd-mi" style={{ cursor: "pointer" }}>
                  <option value="short">Short (400-600 words)</option>
                  <option value="medium">Medium (700-1000 words)</option>
                  <option value="long">Long (1200-1800 words)</option>
                </select>
              </div>
            </div>

            <div className="hd-ma">
              <button className="hd-mcancel" onClick={() => setAiOpen(false)}>Cancel</button>
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiTopic.trim()}
                style={{ flex: 2, padding: 10, borderRadius: 9, border: "none", background: "linear-gradient(135deg,#9333ea,#7c3aed)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: aiLoading || !aiTopic.trim() ? .55 : 1 }}
              >
                {aiLoading ? <><span className="hd-spin" /> Generating...</> : <><Sparkles size={14} /> Generate Content</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
