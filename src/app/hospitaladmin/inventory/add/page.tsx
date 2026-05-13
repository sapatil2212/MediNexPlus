"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Save, Upload, Package,
  AlertTriangle, IndianRupee, ChevronDown, Loader2, CheckCircle2
} from "lucide-react";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const CATEGORIES = ["Medicine", "Consumables", "Surgical Items", "Equipment", "Lab Items"];
const UNITS = ["pcs", "strip", "box", "bottle", "vial", "ampoule", "tube", "kg", "gm", "ml", "ltr", "pair", "set"];
const DRUG_SCHEDULES = ["OTC", "Schedule H", "Schedule H1", "Schedule X"];
const TEMP_OPTIONS = ["Room Temp", "Refrigerated (2-8°C)", "Frozen (-20°C)"];

export default function AddInventoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState({
    name: "", genericName: "", brandName: "", category: "Medicine", subCategory: "", itemType: "Consumable",
    unit: "pcs", packSize: "", conversion: "",
    sku: "", barcode: "", hsnCode: "",
    openingStock: 0, minStock: 5, maxStock: 0, reorderLevel: 0, reorderQty: 0,
    purchasePrice: 0, supplierName: "", preferredVendor: "", purchaseUnit: "",
    mrp: 0, sellingPrice: 0, discount: 0, gst: 0, billingType: "Tax Inclusive",
    batchNumber: "", mfgDate: "", expiryDate: "", expiryAlertDays: 60,
    location: "Central Store", rackNumber: "", tempRequirement: "Room Temp",
    drugSchedule: "OTC", requiresRx: "No",
    status: "Active", isReturnable: "Yes", isCritical: "No",
    description: "", image: "", documents: [] as string[]
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "inventory");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setForm(prev => ({ ...prev, image: data.data.url }));
      } else {
        setError(data.message || "Failed to upload image");
      }
    } catch (err) {
      setError("An error occurred during image upload");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    // Format the form data to match the API's Zod schema requirements
    const formattedForm = {
      // Basic Info
      name: form.name,
      genericName: form.genericName || undefined,
      brandName: form.brandName || undefined,
      category: form.category,
      subCategory: form.subCategory || undefined,
      itemType: form.itemType,
      description: form.description || undefined,

      // Unit & Packaging
      unit: form.unit || "pcs",
      packSize: form.packSize || undefined,
      conversion: form.conversion || undefined,

      // Identification
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      hsnCode: form.hsnCode || undefined,

      // Stock & Alerts (Parsed as integers)
      minStock: parseInt(String(form.minStock)) || 0,
      maxStock: parseInt(String(form.maxStock)) || undefined,
      reorderLevel: parseInt(String(form.reorderLevel)) || undefined,
      reorderQty: parseInt(String(form.reorderQty)) || undefined,
      openingStock: parseInt(String(form.openingStock)) || 0,

      // Purchase Details
      purchasePrice: parseFloat(String(form.purchasePrice)) || 0,
      purchaseUnit: form.purchaseUnit || undefined,
      // Note: preferredVendorId expects UUID. Omitted for now as form provides string name.

      // Pricing & Billing
      mrp: parseFloat(String(form.mrp)) || 0,
      sellingPrice: parseFloat(String(form.sellingPrice)) || 0,
      discount: parseFloat(String(form.discount)) || 0,
      gst: parseFloat(String(form.gst)) || 0,
      billingType: form.billingType,

      // Storage & Location
      location: form.location,
      rackNumber: form.rackNumber || undefined,
      tempRequirement: form.tempRequirement,

      // Compliance & Safety
      drugSchedule: form.drugSchedule,
      requiresRx: form.requiresRx === "Yes",

      // Status & Control
      isActive: form.status === "Active",
      isReturnable: form.isReturnable === "Yes",
      isCritical: form.isCritical === "Yes",

      // Media
      image: form.image || undefined,
    };
    
    try {
      const res = await api("/api/config/inventory", "POST", formattedForm);
      if (res.success) {
        router.push("/hospitaladmin/dashboard?tab=inventory");
      } else {
        // If validation failed, display specific error messages if available
        const errorMsg = res.errors 
          ? res.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
          : res.message || "Validation failed. Please check your inputs.";
        setError(errorMsg);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const margin = () => parseFloat(String(form.mrp)) > 0 && parseFloat(String(form.purchasePrice)) > 0
    ? (((parseFloat(String(form.mrp)) - parseFloat(String(form.purchasePrice))) / parseFloat(String(form.mrp))) * 100).toFixed(1) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        input,select,button,textarea{font-family:'Inter',sans-serif}
        body{background:#f0f4f8;font-family:'Inter',sans-serif}
        .aip-wrap{min-height:100vh;padding:24px;max-width:820px;margin:0 auto}
        .aip-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
        .aip-topbar-left{display:flex;align-items:center;gap:14px}
        .aip-back{width:40px;height:40px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;transition:all .15s}
        .aip-back:hover{background:#f8fafc;color:#1e293b;border-color:#cbd5e1}
        .aip-title{font-size:19px;font-weight:800;color:#1e293b;letter-spacing:-.03em}
        .aip-sub{font-size:10px;color:#94a3b8;margin-top:1px}
        .aip-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.04);margin-bottom:20px;overflow:hidden}
        .aip-card-head{display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid #f1f5f9}
        .aip-card-icon{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .aip-card-title{font-size:13px;font-weight:700;color:#1e293b}
        .aip-card-sub{font-size:10px;color:#94a3b8;margin-top:1px}
        .aip-card-body{padding:20px 24px}
        .aip-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .aip-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
        @media(max-width:768px){.aip-grid,.aip-grid-2{grid-template-columns:1fr}}
        .aip-field{margin-bottom:0}
        .aip-label{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:5px}
        .aip-label span{color:#ef4444}
        .aip-input{width:100%;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-size:12px;color:#1e293b;outline:none;transition:all .2s}
        .aip-input:focus{border-color:#0E898F;background:#fff;box-shadow:0 0 0 3px rgba(14,137,143,0.08)}
        .aip-input::placeholder{color:#cbd5e1}
        .aip-input-money{padding-left:28px}
        .aip-money-sym{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:13px;font-weight:600}
        .aip-radio-row{display:flex;gap:6px;flex-wrap:wrap}
        .aip-radio-pill{padding:7px 16px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:11px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px}
        .aip-radio-pill:hover{border-color:#cbd5e1;background:#f8fafc}
        .aip-radio-pill.on{border-color:#0E898F;background:#E6F4F4;color:#0A6B70}
        .aip-btn-primary{padding:11px 28px;border-radius:12px;border:none;background:#0E898F;color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .15s;box-shadow:0 4px 14px rgba(14,137,143,0.25)}
        .aip-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}
        .aip-btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .aip-btn-ghost{padding:11px 20px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
        .aip-btn-ghost:hover{background:#f8fafc;color:#1e293b}
        .aip-expand-btn{width:100%;padding:12px 24px;background:none;border:none;border-top:1px solid #f1f5f9;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:11px;font-weight:600;color:#64748b;transition:all .15s}
        .aip-expand-btn:hover{background:#f8fafc;color:#0E898F}
        .aip-upload{border:2px dashed #e2e8f0;border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:all .2s}
        .aip-upload:hover{border-color:#0E898F;background:#E6F4F4}
        .aip-err{padding:12px 16px;background:#fef2f2;border:1px solid #fee2e2;border-radius:12px;color:#dc2626;font-size:11px;font-weight:500;margin-bottom:16px;display:flex;align-items:center;gap:10px}
        .aip-success{padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;color:#166534;font-size:12px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:10px}
        .aip-margin-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:6px;font-size:10px;font-weight:700}
        .aip-spin{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:aispin .7s linear infinite}
        @keyframes aispin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="aip-wrap">
        {/* Top Bar */}
        <div className="aip-topbar">
          <div className="aip-topbar-left">
            <button className="aip-back" onClick={() => router.back()}><ChevronLeft size={18} /></button>
            <div>
              <div className="aip-title">Add Inventory Item</div>
              <div className="aip-sub">Add a new product to the central inventory master</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="aip-btn-ghost" onClick={() => router.back()}>Cancel</button>
            <button type="button" className="aip-btn-primary" disabled={saving || !form.name} onClick={handleSubmit}>
              {saving ? <span className="aip-spin" /> : <Save size={15} />}
              {saving ? "Saving..." : "Save Item"}
            </button>
          </div>
        </div>

        {error && <div className="aip-err"><AlertTriangle size={16} /> {error}</div>}
        {success && <div className="aip-success"><CheckCircle2 size={16} /> Item saved successfully! Redirecting...</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Section 1: Essential Info ── */}
          <div className="aip-card">
            <div className="aip-card-head">
              <div className="aip-card-icon" style={{ background: "#E6F4F4", color: "#0E898F" }}><Package size={17} /></div>
              <div>
                <div className="aip-card-title">Item Details</div>
                <div className="aip-card-sub">Name, category, and unit information</div>
              </div>
            </div>
            <div className="aip-card-body">
              {/* Row 1: Name (full width) */}
              <div style={{ marginBottom: 16 }}>
                <label className="aip-label">Item Name <span>*</span></label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="e.g., Paracetamol 500mg Tablet" className="aip-input" autoFocus />
              </div>

              {/* Row 2: Generic, Brand */}
              <div className="aip-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label className="aip-label">Generic Name</label>
                  <input type="text" name="genericName" value={form.genericName} onChange={handleChange} placeholder="e.g., Paracetamol" className="aip-input" />
                </div>
                <div>
                  <label className="aip-label">Brand Name</label>
                  <input type="text" name="brandName" value={form.brandName} onChange={handleChange} placeholder="e.g., Crocin / Dolo" className="aip-input" />
                </div>
              </div>

              {/* Row 3: Category, Sub Cat, Unit */}
              <div className="aip-grid" style={{ marginBottom: 16 }}>
                <div>
                  <label className="aip-label">Category <span>*</span></label>
                  <select name="category" value={form.category} onChange={handleChange} required className="aip-input">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="aip-label">Sub Category</label>
                  <input type="text" name="subCategory" value={form.subCategory} onChange={handleChange} placeholder="Tablet / Syrup / Injection" className="aip-input" />
                </div>
                <div>
                  <label className="aip-label">Unit <span>*</span></label>
                  <select name="unit" value={form.unit} onChange={handleChange} required className="aip-input">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: Item Type */}
              <div>
                <label className="aip-label">Item Type</label>
                <div className="aip-radio-row">
                  {["Consumable", "Non-Consumable"].map(t => (
                    <button key={t} type="button" className={`aip-radio-pill${form.itemType === t ? " on" : ""}`} onClick={() => setForm({ ...form, itemType: t })}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Pricing & Stock ── */}
          <div className="aip-card">
            <div className="aip-card-head">
              <div className="aip-card-icon" style={{ background: "#fef3c7", color: "#d97706" }}><IndianRupee size={17} /></div>
              <div>
                <div className="aip-card-title">Pricing & Stock</div>
                <div className="aip-card-sub">Purchase price, MRP, GST, and stock levels</div>
              </div>
            </div>
            <div className="aip-card-body">
              {/* Pricing Row */}
              <div className="aip-grid" style={{ marginBottom: 16 }}>
                <div>
                  <label className="aip-label">Purchase Price (Cost)</label>
                  <div style={{ position: "relative" }}>
                    <span className="aip-money-sym">₹</span>
                    <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} className="aip-input aip-input-money" placeholder="0" min="0" step="0.01" />
                  </div>
                </div>
                <div>
                  <label className="aip-label">MRP</label>
                  <div style={{ position: "relative" }}>
                    <span className="aip-money-sym">₹</span>
                    <input type="number" name="mrp" value={form.mrp} onChange={handleChange} className="aip-input aip-input-money" placeholder="0" min="0" step="0.01" />
                  </div>
                </div>
                <div>
                  <label className="aip-label">GST %</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[0, 5, 12, 18, 28].map(g => (
                      <button key={g} type="button" className={`aip-radio-pill${parseFloat(String(form.gst)) === g ? " on" : ""}`}
                        style={{ padding: "6px 12px", fontSize:10 }}
                        onClick={() => setForm({ ...form, gst: g })}>
                        {g}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Margin indicator */}
              {margin() && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #dcfce7", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize:10, color: "#6b7280" }}>Profit Margin:</span>
                  <span className="aip-margin-badge" style={{ background: parseFloat(margin()!) > 20 ? "#dcfce7" : "#fef3c7", color: parseFloat(margin()!) > 20 ? "#166534" : "#92400e" }}>
                    {margin()}%
                  </span>
                  <span style={{ fontSize:10, color: "#94a3b8" }}>
                    (₹{(parseFloat(String(form.mrp)) - parseFloat(String(form.purchasePrice))).toFixed(2)} per unit)
                  </span>
                </div>
              )}

              {/* Stock Row */}
              <div className="aip-grid" style={{ marginBottom: 16 }}>
                <div>
                  <label className="aip-label">Opening Stock</label>
                  <input type="number" name="openingStock" value={form.openingStock} onChange={handleChange} className="aip-input" min="0" />
                </div>
                <div>
                  <label className="aip-label">Min Stock Alert <span>*</span></label>
                  <input type="number" name="minStock" value={form.minStock} onChange={handleChange} required className="aip-input" min="0" />
                </div>
                <div>
                  <label className="aip-label">Reorder Quantity</label>
                  <input type="number" name="reorderQty" value={form.reorderQty} onChange={handleChange} className="aip-input" min="0" />
                </div>
              </div>

              {/* Selling Price + Discount */}
              <div className="aip-grid-2">
                <div>
                  <label className="aip-label">Selling Price</label>
                  <div style={{ position: "relative" }}>
                    <span className="aip-money-sym">₹</span>
                    <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} className="aip-input aip-input-money" placeholder="0" min="0" step="0.01" />
                  </div>
                </div>
                <div>
                  <label className="aip-label">Discount %</label>
                  <input type="number" name="discount" value={form.discount} onChange={handleChange} className="aip-input" min="0" max="100" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Advanced (Collapsible) ── */}
          <div className="aip-card">
            <button type="button" className="aip-expand-btn" onClick={() => setShowAdvanced(!showAdvanced)} style={{ borderTop: "none", padding: "16px 24px" }}>
              <ChevronDown size={16} style={{ transform: showAdvanced ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              {showAdvanced ? "Hide" : "Show"} Advanced Details
              <span style={{ fontSize:10, color: "#94a3b8", fontWeight: 400 }}>(batch, storage, compliance, identifiers)</span>
            </button>

            {showAdvanced && (
              <div className="aip-card-body" style={{ borderTop: "1px solid #f1f5f9" }}>

                {/* Batch & Expiry */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Batch & Expiry</div>
                  <div className="aip-grid">
                    <div>
                      <label className="aip-label">Batch Number</label>
                      <input type="text" name="batchNumber" value={form.batchNumber} onChange={handleChange} placeholder="e.g., BT-2026-001" className="aip-input" />
                    </div>
                    <div>
                      <label className="aip-label">Manufacturing Date</label>
                      <input type="date" name="mfgDate" value={form.mfgDate} onChange={handleChange} className="aip-input" />
                    </div>
                    <div>
                      <label className="aip-label">Expiry Date</label>
                      <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className="aip-input" />
                    </div>
                  </div>
                </div>

                {/* Identification */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Identification</div>
                  <div className="aip-grid">
                    <div>
                      <label className="aip-label">SKU Code</label>
                      <input type="text" name="sku" value={form.sku} onChange={handleChange} placeholder="Auto or manual" className="aip-input" />
                    </div>
                    <div>
                      <label className="aip-label">Barcode</label>
                      <input type="text" name="barcode" value={form.barcode} onChange={handleChange} placeholder="Scan or enter" className="aip-input" />
                    </div>
                    <div>
                      <label className="aip-label">HSN Code</label>
                      <input type="text" name="hsnCode" value={form.hsnCode} onChange={handleChange} placeholder="For GST billing" className="aip-input" />
                    </div>
                  </div>
                </div>

                {/* Storage */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Storage</div>
                  <div className="aip-grid">
                    <div>
                      <label className="aip-label">Storage Location</label>
                      <input type="text" name="location" value={form.location} onChange={handleChange} className="aip-input" />
                    </div>
                    <div>
                      <label className="aip-label">Rack / Shelf</label>
                      <input type="text" name="rackNumber" value={form.rackNumber} onChange={handleChange} placeholder="e.g., A3-Shelf 2" className="aip-input" />
                    </div>
                    <div>
                      <label className="aip-label">Temperature</label>
                      <select name="tempRequirement" value={form.tempRequirement} onChange={handleChange} className="aip-input">
                        {TEMP_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Packaging */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Packaging</div>
                  <div className="aip-grid-2">
                    <div>
                      <label className="aip-label">Pack Size</label>
                      <input type="text" name="packSize" value={form.packSize} onChange={handleChange} placeholder="e.g., 10 tablets per strip" className="aip-input" />
                    </div>
                    <div>
                      <label className="aip-label">Unit Conversion</label>
                      <input type="text" name="conversion" value={form.conversion} onChange={handleChange} placeholder="e.g., 1 Box = 10 strips" className="aip-input" />
                    </div>
                  </div>
                </div>

                {/* Compliance & Flags */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Compliance & Flags</div>
                  <div className="aip-grid">
                    <div>
                      <label className="aip-label">Drug Schedule</label>
                      <select name="drugSchedule" value={form.drugSchedule} onChange={handleChange} className="aip-input">
                        {DRUG_SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="aip-label">Requires Prescription</label>
                      <div className="aip-radio-row">
                        {["Yes", "No"].map(o => (
                          <button key={o} type="button" className={`aip-radio-pill${form.requiresRx === o ? " on" : ""}`} onClick={() => setForm({ ...form, requiresRx: o })}>{o}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="aip-label">Is Critical</label>
                      <div className="aip-radio-row">
                        {["Yes", "No"].map(o => (
                          <button key={o} type="button" className={`aip-radio-pill${form.isCritical === o ? " on" : ""}`} onClick={() => setForm({ ...form, isCritical: o })}>{o}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing & Status */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Billing & Status</div>
                  <div className="aip-grid">
                    <div>
                      <label className="aip-label">Billing Type</label>
                      <div className="aip-radio-row">
                        {["Tax Inclusive", "Tax Exclusive"].map(t => (
                          <button key={t} type="button" className={`aip-radio-pill${form.billingType === t ? " on" : ""}`} onClick={() => setForm({ ...form, billingType: t })}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="aip-label">Status</label>
                      <div className="aip-radio-row">
                        {["Active", "Inactive"].map(s => (
                          <button key={s} type="button" className={`aip-radio-pill${form.status === s ? " on" : ""}`} onClick={() => setForm({ ...form, status: s })}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="aip-label">Returnable</label>
                      <div className="aip-radio-row">
                        {["Yes", "No"].map(o => (
                          <button key={o} type="button" className={`aip-radio-pill${form.isReturnable === o ? " on" : ""}`} onClick={() => setForm({ ...form, isReturnable: o })}>{o}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes & Image */}
                <div>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Notes & Image</div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="aip-label">Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="aip-input" style={{ resize: "none" }} placeholder="Optional notes about this item..." />
                  </div>
                  <div>
                    <label className="aip-label">Image</label>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: "none" }} />
                    <div className="aip-upload" onClick={() => fileInputRef.current?.click()}>
                      {uploading ? (
                        <div><Loader2 size={20} className="aip-spin" style={{ margin: "0 auto 8px", display: "block" }} /><div style={{ fontSize:11, color: "#475569" }}>Uploading...</div></div>
                      ) : form.image ? (
                        <div>
                          <img src={form.image} alt="Preview" style={{ height: 80, width: 80, objectFit: "cover", borderRadius: 12, border: "1px solid #e2e8f0", margin: "0 auto 8px", display: "block" }} />
                          <div style={{ fontSize:10, color: "#64748b" }}>Click to change</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ width: 40, height: 40, background: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: "#94a3b8" }}><Upload size={18} /></div>
                          <div style={{ fontSize:11, fontWeight: 600, color: "#475569" }}>Upload Image</div>
                          <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>PNG, JPG or WEBP (max 5MB)</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Sticky Footer ── */}
          <div style={{ position: "sticky", bottom: 0, background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", zIndex: 10 }}>
            <div style={{ fontSize:10, color: "#94a3b8" }}>
              {form.name ? <span style={{ color: "#1e293b", fontWeight: 600 }}>{form.name}</span> : "Fill in item details"}
              {form.category && <span> · {form.category}</span>}
              {parseFloat(String(form.mrp)) > 0 && <span> · ₹{form.mrp}</span>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="aip-btn-ghost" onClick={() => router.back()}>Cancel</button>
              <button type="submit" className="aip-btn-primary" disabled={saving || !form.name}>
                {saving ? <span className="aip-spin" /> : <Save size={15} />}
                {saving ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
