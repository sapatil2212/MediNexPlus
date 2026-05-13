import * as blogRepo from "../repositories/blog.repo";

export async function createBlog(hospitalId: string, data: any) {
  return blogRepo.createBlog(hospitalId, data);
}

export async function getBlogs(hospitalId: string, opts: any) {
  return blogRepo.getBlogs(hospitalId, opts);
}

export async function getPublishedBlogs(hospitalId: string, opts: any) {
  return blogRepo.getPublishedBlogs(hospitalId, opts);
}

export async function getBlogById(id: string, hospitalId: string) {
  return blogRepo.getBlogById(id, hospitalId);
}

export async function getBlogBySlug(slug: string, hospitalId: string) {
  return blogRepo.getBlogBySlug(slug, hospitalId);
}

export async function getPublicBlogBySlug(slug: string) {
  return blogRepo.getPublicBlogBySlug(slug);
}

export async function updateBlog(id: string, hospitalId: string, data: any) {
  return blogRepo.updateBlog(id, hospitalId, data);
}

export async function deleteBlog(id: string, hospitalId: string) {
  return blogRepo.deleteBlog(id, hospitalId);
}

export async function getBlogStats(hospitalId: string) {
  return blogRepo.getBlogStats(hospitalId);
}

export async function generateBlogWithAI(topic: string, tone: string, length: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const wordCount = length === "short" ? "400-600" : length === "long" ? "1200-1800" : "700-1000";

  const prompt = `You are an expert healthcare blog writer and SEO specialist. Write an SEO-optimized blog post for a hospital/healthcare website.

Topic: ${topic}
Tone: ${tone}
Target word count: ${wordCount} words

Return a JSON object with these exact fields:
{
  "title": "SEO-optimized title (max 70 chars)",
  "metaTitle": "Meta title for search engines (max 60 chars)",
  "metaDesc": "Meta description (max 155 chars)",
  "excerpt": "Engaging excerpt/summary (max 200 chars)",
  "content": "Full HTML blog content using <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. Include proper headings, subheadings, and paragraphs. Make it informative, SEO-friendly with relevant medical keywords naturally integrated.",
  "category": "One of: Technology, Patient Care, Wellness, Research, Health Tips, Medical News",
  "tags": "comma-separated relevant tags"
}

Important:
- Use proper HTML formatting in content
- Include relevant medical/health keywords naturally
- Make the content educational and trustworthy
- Do NOT include <html>, <head>, <body> tags
- Return ONLY valid JSON, no markdown code fences`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content || "";

  // Parse JSON from the response (strip markdown code fences if any)
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON from the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse AI response as JSON");
  }
}
