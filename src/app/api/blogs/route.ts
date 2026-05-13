import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../backend/utils/response";
import { createBlogSchema } from "../../../../backend/validations/blog.validation";
import * as blogService from "../../../../backend/services/blog.service";

// GET /api/blogs — list blogs (admin: all statuses; public: published only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPublic = searchParams.get("public") === "true";
    const stats = searchParams.get("stats") === "true";

    if (isPublic) {
      // Public endpoint — get first hospital's published blogs
      const hospitalId = searchParams.get("hospitalId") || "";
      const category = searchParams.get("category") || undefined;
      const limit = parseInt(searchParams.get("limit") || "20");
      const page = parseInt(searchParams.get("page") || "1");

      if (!hospitalId) {
        // If no hospitalId, get blogs from any hospital (for landing page)
        const prisma = (await import("../../../../backend/config/db")).default;
        const blogs = await (prisma as any).blog.findMany({
          where: { status: "PUBLISHED", ...(category && category !== "All" ? { category } : {}) },
          orderBy: { publishedAt: "desc" },
          take: limit,
          skip: (page - 1) * limit,
          select: {
            id: true, title: true, slug: true, excerpt: true, coverImage: true,
            category: true, tags: true, author: true, readTime: true, publishedAt: true,
            metaTitle: true, metaDesc: true, hospitalId: true,
          },
        });
        const total = await (prisma as any).blog.count({
          where: { status: "PUBLISHED", ...(category && category !== "All" ? { category } : {}) },
        });
        // Get unique categories
        const cats = await (prisma as any).blog.findMany({
          where: { status: "PUBLISHED" },
          select: { category: true },
          distinct: ["category"],
        });
        return successResponse({
          data: blogs,
          total,
          categories: ["All", ...cats.map((c: any) => c.category).filter(Boolean)],
        });
      }

      const result = await blogService.getPublishedBlogs(hospitalId, { category, limit, page });
      return successResponse(result);
    }

    // Admin endpoint — requires auth
    const auth = await requireHospitalAdmin(req);
    if (auth.error) return auth.error;

    if (stats) {
      const blogStats = await blogService.getBlogStats(auth.hospitalId);
      return successResponse(blogStats);
    }

    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await blogService.getBlogs(auth.hospitalId, { status, category, search, page, limit });
    return successResponse(result);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch blogs", 500);
  }
}

// POST /api/blogs — create a new blog
export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = createBlogSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.flatten().fieldErrors);
    }

    const blog = await blogService.createBlog(auth.hospitalId, {
      ...parsed.data,
      author: parsed.data.author || (auth.user as any).name || "Admin",
    });
    return successResponse(blog, "Blog created successfully", 201);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to create blog", 500);
  }
}
