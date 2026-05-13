import prisma from "../config/db";

const blog = (prisma as any).blog;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]+>/g, "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function createBlog(hospitalId: string, data: any) {
  const slug = data.slug || generateSlug(data.title);

  // Ensure slug uniqueness per hospital
  const existing = await blog.findUnique({ where: { hospitalId_slug: { hospitalId, slug } } });
  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

  const readTime = data.content ? estimateReadTime(data.content) : null;

  return blog.create({
    data: {
      hospitalId,
      title: data.title,
      slug: finalSlug,
      excerpt: data.excerpt || null,
      content: data.content || null,
      coverImage: data.coverImage || null,
      category: data.category || null,
      tags: data.tags || null,
      author: data.author || null,
      status: data.status || "DRAFT",
      metaTitle: data.metaTitle || null,
      metaDesc: data.metaDesc || null,
      readTime,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });
}

export async function getBlogs(
  hospitalId: string,
  opts: { status?: string; category?: string; search?: string; page?: number; limit?: number } = {}
) {
  const { status, category, search, page = 1, limit = 20 } = opts;
  const where: any = { hospitalId };
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { excerpt: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    blog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    blog.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublishedBlogs(hospitalId: string, opts: { category?: string; limit?: number; page?: number } = {}) {
  const { category, limit = 20, page = 1 } = opts;
  const where: any = { hospitalId, status: "PUBLISHED" };
  if (category && category !== "All") where.category = category;

  const [data, total] = await Promise.all([
    blog.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        tags: true,
        author: true,
        readTime: true,
        publishedAt: true,
        metaTitle: true,
        metaDesc: true,
      },
    }),
    blog.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getBlogById(id: string, hospitalId: string) {
  return blog.findFirst({ where: { id, hospitalId } });
}

export async function getBlogBySlug(slug: string, hospitalId: string) {
  return blog.findUnique({ where: { hospitalId_slug: { hospitalId, slug } } });
}

export async function getPublicBlogBySlug(slug: string) {
  return blog.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function updateBlog(id: string, hospitalId: string, data: any) {
  const existing = await blog.findFirst({ where: { id, hospitalId } });
  if (!existing) return null;

  const update: any = { ...data, updatedAt: new Date() };

  if (data.content) {
    update.readTime = estimateReadTime(data.content);
  }

  // If status changed to PUBLISHED and wasn't published before
  if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    update.publishedAt = new Date();
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await blog.findUnique({
      where: { hospitalId_slug: { hospitalId, slug: data.slug } },
    });
    if (slugExists && slugExists.id !== id) {
      update.slug = `${data.slug}-${Date.now().toString(36)}`;
    }
  }

  return blog.update({ where: { id }, data: update });
}

export async function deleteBlog(id: string, hospitalId: string) {
  const existing = await blog.findFirst({ where: { id, hospitalId } });
  if (!existing) return null;
  return blog.delete({ where: { id } });
}

export async function getBlogStats(hospitalId: string) {
  const [total, published, drafts, categories] = await Promise.all([
    blog.count({ where: { hospitalId } }),
    blog.count({ where: { hospitalId, status: "PUBLISHED" } }),
    blog.count({ where: { hospitalId, status: "DRAFT" } }),
    blog.findMany({
      where: { hospitalId },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  return {
    total,
    published,
    drafts,
    archived: total - published - drafts,
    categories: categories.map((c: any) => c.category).filter(Boolean),
  };
}
