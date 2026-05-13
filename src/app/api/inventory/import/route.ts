import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "google/gemma-3-12b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

const VALID_CATEGORIES = ["Medicine", "Consumables", "Surgical Items", "Equipment", "Lab Items"];
const VALID_UNITS = ["pcs", "strip", "box", "bottle", "vial", "ampoule", "tube", "kg", "gm", "ml", "ltr", "pair", "set"];

const EXTRACT_PROMPT = `You are an inventory data extraction assistant for a hospital management system.
Extract ALL inventory items from the provided data and map them to these fields:

Fields:
- name (required): Item name e.g. "Paracetamol 500mg"
- genericName: Generic/chemical name e.g. "Acetaminophen"
- brandName: Brand/trade name
- category (required, MUST be one of: "Medicine", "Consumables", "Surgical Items", "Equipment", "Lab Items")
- subCategory: Sub-category
- unit (MUST be one of: "pcs", "strip", "box", "bottle", "vial", "ampoule", "tube", "kg", "gm", "ml", "ltr", "pair", "set")
- purchasePrice: Purchase/cost price (number)
- mrp: Maximum Retail Price (number)
- sellingPrice: Selling price (number)
- gst: GST percentage 0-100 (number)
- openingStock: Opening stock quantity (integer)
- minStock: Minimum stock alert level (integer, default 5)
- hsnCode: HSN code (string)
- barcode: Barcode/SKU (string)
- description: Description
- preferredVendorName: Supplier/vendor name

Rules:
- Infer category: medicines/drugs/tablets/capsules/injections → "Medicine"; syringes/gloves/cotton/bandages → "Consumables"; scalpels/forceps/clamps → "Surgical Items"; machines/devices/monitors → "Equipment"; reagents/chemicals/test kits → "Lab Items"
- Infer unit: tablets/capsules → "strip"; liquids/solutions → "ml" or "bottle"; powders → "gm"; pieces/items → "pcs"
- Return ONLY a valid JSON array, no markdown fences, no extra text
- Skip rows that are clearly headers, totals, or empty
- Handle any column header variations (e.g. "Item Name", "Product", "Medicine", "Drug Name", "Particulars")

Return format: [{"name":"...","category":"Medicine","unit":"strip","purchasePrice":0,"mrp":0,"gst":5,...}]`;

const RESTOCK_PROMPT = `You are a purchase order data extraction assistant for a hospital pharmacy.
Extract restock entries (purchase line items) from the provided data and map them to these fields:

Fields per entry:
- name (required): Item/product name to restock e.g. "Paracetamol 500mg"
- quantity (required, integer): Quantity / units to purchase
- unitPrice: Purchase price per unit (number, in INR)
- gst: GST percentage 0-100 (number)
- batchNumber: Batch / lot number (string)
- expiryDate: Expiry date in YYYY-MM-DD format
- mfgDate: Manufacturing date in YYYY-MM-DD format

Rules:
- Return ONLY a valid JSON array, no markdown fences, no extra text
- Skip rows that are clearly headers, totals, footers, or empty
- Handle any column header variations (e.g. "Item", "Product", "Medicine", "Drug", "Particulars", "Qty", "Quantity", "Units", "Rate", "Price", "Cost", "Purchase Price", "Batch", "Lot", "Exp", "Expiry", "Mfg", "GST", "Tax")
- Parse dates flexibly: convert DD-MM-YYYY, MM/YYYY, MMM-YYYY, DD/MM/YY etc. to YYYY-MM-DD; if only month/year given, use 01 as day
- All numeric fields default to 0 if missing
- quantity must be a positive integer; skip rows where quantity cannot be determined

Return format: [{"name":"...","quantity":10,"unitPrice":25,"gst":12,"batchNumber":"B1234","expiryDate":"2026-12-01","mfgDate":""}]`;

async function callGeminiText(textContent: string, prompt: string = EXTRACT_PROMPT): Promise<any[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt + "\n\nData to extract from:\n" + textContent }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in Gemini response");
  return JSON.parse(match[0]);
}

async function callGeminiDocument(base64: string, mimeType: string, prompt: string = EXTRACT_PROMPT): Promise<any[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt + "\n\nExtract ALL entries from this document. Return ONLY a JSON array." },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini document error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in Gemini document response");
  return JSON.parse(match[0]);
}

async function callOpenRouterText(textContent: string, prompt: string = EXTRACT_PROMPT): Promise<any[]> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  for (const model of OPENROUTER_MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://hospital-management-system.com",
          "X-Title": "Hospital Inventory Import",
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: "user",
            content: "Return ONLY a valid JSON array, no markdown, no extra text.\n\n" + prompt + "\n\nData:\n" + textContent,
          }],
          temperature: 0.1,
          max_tokens: 8192,
        }),
      });

      if (!res.ok) { console.error(`OpenRouter ${model} status ${res.status}`); continue; }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (!text) continue;

      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } catch (err: any) {
      console.error(`OpenRouter ${model} error:`, err.message);
    }
  }
  throw new Error("All OpenRouter models failed");
}

function normalizeRestockEntries(raw: any[]): any[] {
  return raw
    .filter((it) => it && it.name && typeof it.name === "string" && it.name.trim().length > 1)
    .map((it) => {
      const qty = parseInt(it.quantity || it.qty || it.units || it.unit_count || 0) || 0;
      return {
        name: String(it.name || it.itemName || it.item || it.product || "").trim(),
        quantity: Math.max(0, qty),
        unitPrice: Math.max(0, parseFloat(it.unitPrice || it.unit_price || it.price || it.rate || it.purchasePrice || it.cost || 0) || 0),
        gst: Math.max(0, Math.min(100, parseFloat(it.gst || it.GST || it.tax || it.taxPercent || 0) || 0)),
        batchNumber: String(it.batchNumber || it.batch_number || it.batch || it.lot || it.lotNumber || "").trim(),
        expiryDate: normalizeDate(it.expiryDate || it.expiry_date || it.expiry || it.exp || it.expDate),
        mfgDate: normalizeDate(it.mfgDate || it.mfg_date || it.mfg || it.manufactureDate || it.manufacturing_date),
      };
    })
    .filter((it) => it.quantity > 0);
}

function normalizeDate(input: any): string {
  if (!input) return "";
  const s = String(input).trim();
  if (!s) return "";
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  // MM/YYYY or MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}-01`;
  // DD/MM/YYYY or DD-MM-YYYY
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // DD/MM/YY or DD-MM-YY
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) return `20${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // Try Date parser as last resort
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return "";
}

function normalizeItems(raw: any[]): any[] {
  return raw
    .filter((item) => item && item.name && typeof item.name === "string" && item.name.trim().length > 1)
    .map((item) => ({
      name: String(item.name || "").trim(),
      genericName: String(item.genericName || item.generic_name || item.generic || "").trim(),
      brandName: String(item.brandName || item.brand_name || item.brand || "").trim(),
      category: VALID_CATEGORIES.includes(item.category) ? item.category : inferCategory(item.name),
      subCategory: String(item.subCategory || item.sub_category || "").trim(),
      unit: VALID_UNITS.includes(item.unit) ? item.unit : inferUnit(item.name, item.unit),
      purchasePrice: Math.max(0, parseFloat(item.purchasePrice || item.purchase_price || item.costPrice || item.cost || 0) || 0),
      mrp: Math.max(0, parseFloat(item.mrp || item.MRP || item.maxPrice || item.retail_price || 0) || 0),
      sellingPrice: Math.max(0, parseFloat(item.sellingPrice || item.selling_price || item.salePrice || 0) || 0),
      gst: Math.max(0, Math.min(100, parseFloat(item.gst || item.GST || item.gstPercent || item.tax || 0) || 0)),
      openingStock: Math.max(0, parseInt(item.openingStock || item.opening_stock || item.stock || item.qty || item.quantity || 0) || 0),
      minStock: Math.max(0, parseInt(item.minStock || item.min_stock || item.reorderLevel || 5) || 5),
      hsnCode: String(item.hsnCode || item.hsn_code || item.HSN || item.hsn || "").trim(),
      barcode: String(item.barcode || item.sku || item.SKU || "").trim(),
      description: String(item.description || item.remarks || item.notes || "").trim(),
      preferredVendorName: String(item.preferredVendorName || item.supplier || item.vendor || item.supplierName || "").trim(),
    }));
}

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (/tablet|capsule|syrup|injection|drops|cream|ointment|gel|patch|inhaler|spray|suppository|mg|ml|mcg|iu\b/.test(n)) return "Medicine";
  if (/syringe|glove|cotton|bandage|mask|catheter|gauze|dressing|iv set|cannula|tape|swab/.test(n)) return "Consumables";
  if (/scalpel|forceps|clamp|retractor|scissors|needle|suture|trocar|speculum/.test(n)) return "Surgical Items";
  if (/monitor|machine|ventilator|pump|device|equipment|scanner|thermometer|oximeter|bp/.test(n)) return "Equipment";
  if (/reagent|chemical|test kit|culture|stain|buffer|solution|lab/.test(n)) return "Lab Items";
  return "Medicine";
}

function inferUnit(name: string, rawUnit?: string): string {
  if (rawUnit) {
    const u = String(rawUnit).toLowerCase().trim();
    if (u.includes("strip") || u.includes("blister")) return "strip";
    if (u.includes("bottle") || u.includes("btl")) return "bottle";
    if (u.includes("box")) return "box";
    if (u.includes("vial")) return "vial";
    if (u.includes("ampoule") || u.includes("amp")) return "ampoule";
    if (u.includes("tube")) return "tube";
    if (u.includes("ml") || u.includes("millilitre")) return "ml";
    if (u.includes("ltr") || u.includes("litre") || u.includes("liter")) return "ltr";
    if (u.includes("kg") || u.includes("kilogram")) return "kg";
    if (u.includes("gm") || u.includes("gram") || u.includes("grams")) return "gm";
    if (u.includes("pair")) return "pair";
    if (u.includes("set")) return "set";
  }
  const n = name.toLowerCase();
  if (/tablet|capsule/.test(n)) return "strip";
  if (/syrup|suspension|solution|drops/.test(n)) return "bottle";
  if (/injection|vial/.test(n)) return "vial";
  if (/ointment|cream|gel/.test(n)) return "tube";
  return "pcs";
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { type, rows, base64, mimeType, rawText, intent } = body;
    const isRestock = intent === "restock";
    const prompt = isRestock ? RESTOCK_PROMPT : EXTRACT_PROMPT;

    let rawItems: any[] = [];

    if (type === "structured" && Array.isArray(rows) && rows.length > 0) {
      // Excel/CSV: OpenRouter first (free, no quota issues), Gemini fallback
      const dataStr = JSON.stringify(rows.slice(0, 150));
      const orKey = process.env.OPENROUTER_API_KEY;
      if (orKey) {
        try {
          rawItems = await callOpenRouterText(dataStr, prompt);
        } catch (e1: any) {
          console.warn("OpenRouter failed, trying Gemini fallback:", e1.message);
          rawItems = await callGeminiText(dataStr, prompt);
        }
      } else {
        rawItems = await callGeminiText(dataStr, prompt);
      }
    } else if (type === "document" && base64 && mimeType) {
      // PDF/Word: Gemini is the only provider with vision/document support
      try {
        rawItems = await callGeminiDocument(base64, mimeType, prompt);
      } catch (e1: any) {
        console.warn("Gemini document failed:", e1.message);
        if (rawText) {
          const orKey = process.env.OPENROUTER_API_KEY;
          if (orKey) {
            try {
              rawItems = await callOpenRouterText(rawText.slice(0, 10000), prompt);
            } catch {
              rawItems = await callGeminiText(rawText.slice(0, 10000), prompt);
            }
          } else {
            rawItems = await callGeminiText(rawText.slice(0, 10000), prompt);
          }
        } else if (e1.message?.includes("429")) {
          throw new Error("Gemini quota exceeded and no text could be extracted from this file. Try uploading an Excel/CSV version instead, or check your Gemini billing at https://ai.google.dev");
        } else {
          throw e1;
        }
      }
    } else if (type === "text" && rawText) {
      const orKey = process.env.OPENROUTER_API_KEY;
      if (orKey) {
        try {
          rawItems = await callOpenRouterText(rawText.slice(0, 10000), prompt);
        } catch (e1: any) {
          console.warn("OpenRouter failed, trying Gemini fallback:", e1.message);
          rawItems = await callGeminiText(rawText.slice(0, 10000), prompt);
        }
      } else {
        rawItems = await callGeminiText(rawText.slice(0, 10000), prompt);
      }
    } else {
      return errorResponse("Invalid request: provide type + rows OR base64+mimeType OR rawText", 400);
    }

    const items = isRestock ? normalizeRestockEntries(rawItems) : normalizeItems(rawItems);
    return successResponse({ items, total: items.length }, `Extracted ${items.length} ${isRestock ? "restock entries" : "items"}`);
  } catch (e: any) {
    console.error("Inventory import error:", e);
    return errorResponse(e.message || "AI extraction failed", 500);
  }
}
