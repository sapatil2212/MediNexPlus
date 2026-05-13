import { z } from "zod";

export const createBlogSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens").optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  metaTitle: z.string().max(120).optional(),
  metaDesc: z.string().max(300).optional(),
});

export const updateBlogSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  metaTitle: z.string().max(120).optional().nullable(),
  metaDesc: z.string().max(300).optional().nullable(),
});

export const aiGenerateSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  tone: z.enum(["professional", "friendly", "educational", "empathetic"]).optional().default("professional"),
  length: z.enum(["short", "medium", "long"]).optional().default("medium"),
});
