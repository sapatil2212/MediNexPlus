"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ShoppingCart, Plus, Search, Loader2, X, Check, AlertCircle,
  Trash2, IndianRupee, User, CreditCard, Banknote, Wallet, Smartphone,
  ChevronRight, Package, CheckCircle2, Clock, UserCheck,
} from "lucide-react";

// ── Accent (teal) ──
const ACC   = "#0E898F";
const ACC_G = "linear-gradient(135deg,#0E898F,#07595D)";
const LIGHT = "#E6F4F4";
const BDR   = "#B3E0E0";

const PAYMENT_OPTS = [
  { v: "CASH",   label: "Cash",   Icon: Banknote },
  { v: "UPI",    label: "UPI",    Icon: Smartphone },
  { v: "CARD",   label: "Card",   Icon: CreditCard },
  { v: "ONLINE", label: "Online", Icon: Wallet },
];

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  return (await fetch(url, opts)).json();
};
const fmtINR = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const nowStr = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

interface CSItem { inventoryItemId: string; name: string; quantity: string; unitPrice: string; gst: string; availableStock: number; }

interface Props {
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export default function CounterSaleModal({ onClose, user, onSuccess }: Props) {
  // ── State ──
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Patient
  const [patSearch, setPatSearch]     = useState("");
  const [patResults, setPatResults]   = useState<any[]>([]);
  const [patSearching, setPatSearching] = useState(false);
  const [patId, setPatId]             = useState("");
  const [patName, setPatName]         = useState("");
  const [manualPat, setManualPat]     = useState(false);
  const [manualForm, setManualForm]   = useState({ name: "", phone: "", gender: "MALE" });

  // Items
  const blankItem = (): CSItem => ({ inventoryItemId: "", name: "", quantity: "1", unitPrice: "0", gst: "0", availableStock: 0 });
  const [items, setItems]             = useState<CSItem[]>([blankItem()]);
  const [itemSearch, setItemSearch]   = useState<Record<number, string>>({});
  const [itemResults, setItemResults] = useState<Record<number, any[]>>({});
  const [itemFocused, setItemFocused] = useState<Record<number, boolean>>({});

  // Payment
  const [payMethod, setPayMethod] = useState("CASH");
  const [txnId, setTxnId]         = useState("");
  const [discount, setDiscount]   = useState("0");
  const [discRemark, setDiscRemark] = useState("");
  const [taxPct, setTaxPct]       = useState("0");

  // Inventory
  const [inventory, setInventory] = useState<any[]>([]);

  // ── Load inventory ──
  useEffect(() => {
    api("/api/subdept/inventory?limit=300").then(res => {
      if (res.success) setInventory(res.data?.data || res.data || []);
    });
  }, []);

  // ── Patient search ──
  useEffect(() => {
    if (manualPat || patId) return;
    const q = patSearch.trim();
    if (!q) {
      setPatSearching(true);
      const ctrl = new AbortController();
      fetch("/api/patients?limit=10&sortBy=createdAt&sortOrder=desc", { credentials: "include", signal: ctrl.signal })
        .then(r => r.json()).then(res => setPatResults(res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : []))
        .catch(() => {}).finally(() => setPatSearching(false));
      return () => ctrl.abort();
    }
    if (q.length < 2) { setPatResults([]); return; }
    setPatSearching(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/patients?search=${encodeURIComponent(q)}&limit=10`, { credentials: "include", signal: ctrl.signal });
        const res = await r.json();
        setPatResults(res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : []);
      } catch {}
      setPatSearching(false);
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [patSearch, manualPat, patId]);

  // ── Item search (filter from loaded inventory) ──
  useEffect(() => {
    for (const [idxStr, q] of Object.entries(itemSearch)) {
      const idx = parseInt(idxStr);
      if (!q.trim()) { setItemResults(prev => ({ ...prev, [idx]: [] })); continue; }
      const filtered = inventory.filter(i => i.isActive !== false && (
        i.name?.toLowerCase().includes(q.toLowerCase()) ||
        (i.genericName || "").toLowerCase().includes(q.toLowerCase()) ||
        (i.brandName || "").toLowerCase().includes(q.toLowerCase()) ||
        (i.sku || "").toLowerCase().includes(q.toLowerCase())
      )).slice(0, 10);
      setItemResults(prev => ({ ...prev, [idx]: filtered }));
    }
  }, [itemSearch, inventory]);

  // ── Computed ──
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity) || 1), 0);
  const discAmt  = parseFloat(discount) || 0;
  const taxAmt   = ((subtotal - discAmt) * (parseFloat(taxPct) || 0)) / 100;
  const total    = Math.max(subtotal - discAmt + taxAmt, 0);

  // ── Handlers ──
  const selectPat = (p: any) => { setPatId(p.id); setPatName(p.name); setPatSearch(""); setPatResults([]); };
  const addRow    = () => setItems(prev => [...prev, blankItem()]);
  const removeRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, key: keyof CSItem, val: string | number) =>
    setItems(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  const selectInvItem = (idx: number, inv: any) => {
    const stock = inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], inventoryItemId: inv.id, name: inv.name, unitPrice: String(inv.sellingPrice || inv.mrp || 0), gst: String(inv.gst || 0), availableStock: stock };
    setItems(newItems);
    setItemSearch(prev => ({ ...prev, [idx]: "" }));
    setItemResults(prev => ({ ...prev, [idx]: [] }));
    setItemFocused(prev => ({ ...prev, [idx]: false }));
  };

  const handleSubmit = async () => {
    setError("");
    let pid = patId;

    if (manualPat) {
      if (!manualForm.name.trim()) { setError("Patient name is required"); return; }
      if (!manualForm.phone.trim()) { setError("Patient phone is required"); return; }
      setSaving(true);
      const pRes = await api("/api/patients", "POST", { name: manualForm.name.trim(), phone: manualForm.phone.trim(), gender: manualForm.gender });
      if (!pRes.success) { setSaving(false); setError(pRes.message || "Failed to register patient"); return; }
      pid = pRes.data?.patient?.id || pRes.data?.id;
      if (!pid) { setSaving(false); setError("Patient registered but ID not returned"); return; }
    }

    if (!pid) { setError("Please select or enter a patient"); return; }
    const validItems = items.filter(i => i.inventoryItemId && i.name.trim());
    if (validItems.length === 0) { setError("Add at least one item from inventory"); return; }

    // Stock check
    const combined: Record<string, number> = {};
    validItems.forEach(i => { combined[i.inventoryItemId] = (combined[i.inventoryItemId] || 0) + (parseInt(i.quantity) || 0); });
    const issues = Object.entries(combined).filter(([id, qty]) => { const it = validItems.find(i => i.inventoryItemId === id); return it && qty > it.availableStock; });
    if (issues.length > 0) { setError(`Quantity exceeds stock for: ${issues.map(([id]) => validItems.find(i => i.inventoryItemId === id)?.name).join(", ")}`); return; }

    if (!manualPat) setSaving(true);
    const res = await api("/api/pharmacy/counter-sale", "POST", {
      patientId: pid,
      items: validItems.map(i => ({ inventoryItemId: i.inventoryItemId, name: i.name, quantity: parseInt(i.quantity) || 1, unitPrice: parseFloat(i.unitPrice) || 0 })),
      paymentMethod: payMethod,
      transactionId: txnId || null,
      discount: discAmt,
      taxPercent: parseFloat(taxPct) || 0,
      remarks: discRemark || null,
      notifyAdmin: true,
      notifyReception: true,
    });
    setSaving(false);
    if (res.success) {
      setSuccessMsg(`✓ Sale complete — ${res.data?.billNo || ""} — ${fmtINR(res.data?.total || 0)}`);
      onSuccess();
      setTimeout(() => onClose(), 1800);
    } else {
      setError(res.message || "Failed to process sale");
    }
  };

  // ─── Render ───
  return (
    <>
      <style>{`
        .csm-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}
        .csm-bg{position:absolute;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)}
        .csm-modal{position:relative;z-index:1;background:#fff;border-radius:16px;width:95%;max-width:720px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.18);animation:csmSlide .25s ease}
        @keyframes csmSlide{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .csm-hd{background:${ACC_G};padding:14px 20px;display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0}
        .csm-body{flex:1;overflow-y:auto;padding:16px 20px}
        .csm-ft{padding:12px 20px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;background:#fff}
        .csm-divider{font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin:14px 0 10px;display:flex;align-items:center;gap:8px}
        .csm-divider::after{content:'';flex:1;height:1px;background:#f1f5f9}
        .csm-lbl{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;display:block}
        .csm-input{width:100%;padding:7px 10px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:11px;color:#1e293b;outline:none;font-family:inherit;background:#fff;transition:border .15s}
        .csm-input:focus{border-color:${BDR};box-shadow:0 0 0 3px rgba(14,137,143,.08)}
        .csm-select{width:100%;padding:7px 10px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:11px;color:#1e293b;outline:none;background:#fff;font-family:inherit;cursor:pointer}
        .csm-search{display:flex;align-items:center;gap:6px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;transition:border .15s}
        .csm-search:focus-within{border-color:${BDR}}
        .csm-search input{background:none;border:none;outline:none;font-size:11px;color:#334155;width:100%;font-family:inherit}
        .csm-sugg{position:absolute;z-index:200;bottom:calc(100% + 4px);top:auto;left:0;right:0;min-width:220px;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;box-shadow:0 -4px 20px rgba(0,0,0,.12);max-height:200px;overflow-y:auto}
        .csm-sugg-item{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;cursor:pointer;font-size:11px;border-bottom:1px solid #f8fafc;transition:background .1s}
        .csm-sugg-item:hover{background:${LIGHT}}
        .csm-items-tbl{width:100%;border-collapse:collapse}
        .csm-items-tbl th{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;padding:6px 8px;text-align:left;background:#f8fafc;border-bottom:1px solid #f1f5f9}
        .csm-items-tbl td{padding:5px 6px;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .csm-inv-badge{display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:5px;font-size:9px;font-weight:700}
        .csm-pay-opt{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 12px;border-radius:10px;border:2px solid #e2e8f0;cursor:pointer;transition:all .15s;background:#fff;min-width:70px;font-size:10px;font-weight:600;color:#64748b}
        .csm-pay-opt.on{border-color:${ACC};background:${LIGHT};color:${ACC}}
        .csm-pay-opt:hover{border-color:${BDR}}
        .csm-summary{background:#f8fafc;border-radius:10px;padding:10px 14px;margin-top:12px}
        .csm-sum-row{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:11px;color:#475569}
        .csm-sum-total{font-weight:900;color:#0f172a;font-size:13px;padding-top:6px;border-top:1.5px solid #e2e8f0;margin-top:4px}
        .csm-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;border:none;transition:all .15s;white-space:nowrap}
        .csm-btn.primary{background:${ACC_G};color:#fff;box-shadow:0 2px 8px rgba(14,137,143,.25)}
        .csm-btn.primary:hover{box-shadow:0 4px 16px rgba(14,137,143,.35)}
        .csm-btn.primary:disabled{opacity:.6;cursor:not-allowed}
        .csm-btn.ghost{background:#fff;border:1.5px solid #e2e8f0;color:#475569}
        .csm-btn.ghost:hover{background:#f8fafc;border-color:${BDR};color:${ACC}}
        .csm-spin{animation:csmSpin .7s linear infinite}
        @keyframes csmSpin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="csm-overlay" onClick={onClose}>
        <div className="csm-bg" />
        <div className="csm-modal" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="csm-hd">
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Counter Sell</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingCart size={18} /> New Transaction
              </div>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} color="#fff" />
            </button>
          </div>

          {/* Body */}
          <div className="csm-body">
            {successMsg ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 14 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={32} color="#16a34a" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Transaction Complete!</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{successMsg}</div>
              </div>
            ) : (
              <>
                {/* ── Patient Section ── */}
                <div className="csm-divider"><User size={12} /> Patient Information</div>

                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <button
                    onClick={() => { setManualPat(false); setManualForm({ name: "", phone: "", gender: "MALE" }); }}
                    style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${!manualPat ? ACC : "#e2e8f0"}`, background: !manualPat ? LIGHT : "#fff", color: !manualPat ? ACC : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    Search Existing
                  </button>
                  <button
                    onClick={() => { setManualPat(true); setPatId(""); setPatName(""); setPatResults([]); }}
                    style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${manualPat ? ACC : "#e2e8f0"}`, background: manualPat ? LIGHT : "#fff", color: manualPat ? ACC : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    Manual Entry
                  </button>
                </div>

                {!manualPat ? (
                  patId ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: LIGHT, borderRadius: 8, border: `1.5px solid ${BDR}` }}>
                      <UserCheck size={16} color={ACC} />
                      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{patName}</span>
                      <button onClick={() => { setPatId(""); setPatName(""); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><X size={14} color="#94a3b8" /></button>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <div className="csm-search">
                        <Search size={13} color="#94a3b8" />
                        <input placeholder="Search by name or phone..." value={patSearch} onChange={e => setPatSearch(e.target.value)} autoFocus />
                        {patSearching && <Loader2 size={12} color="#94a3b8" className="csm-spin" />}
                      </div>
                      {patResults.length > 0 && (
                        <div className="csm-sugg">
                          {patResults.map((p: any) => (
                            <div key={p.id} className="csm-sugg-item" onClick={() => selectPat(p)}>
                              <div>
                                <div style={{ fontWeight: 600, color: "#1e293b" }}>{p.name}</div>
                                <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.patientId} · {p.phone || "—"}</div>
                              </div>
                              <ChevronRight size={14} color="#94a3b8" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
                    <div>
                      <label className="csm-lbl">Name *</label>
                      <input className="csm-input" placeholder="Full name" value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="csm-lbl">Phone *</label>
                      <input className="csm-input" placeholder="10-digit mobile" value={manualForm.phone} onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="csm-lbl">Gender</label>
                      <select className="csm-select" value={manualForm.gender} onChange={e => setManualForm(f => ({ ...f, gender: e.target.value }))}>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ── Items Section ── */}
                <div className="csm-divider" style={{ marginTop: 20 }}><Package size={12} /> Items</div>

                <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
                  <table className="csm-items-tbl">
                    <thead>
                      <tr>
                        <th style={{ width: "38%" }}>Medicine / Item</th>
                        <th style={{ width: "12%" }}>Qty</th>
                        <th style={{ width: "16%" }}>Unit Price</th>
                        <th style={{ width: "10%" }}>GST %</th>
                        <th style={{ width: "16%" }}>Amount</th>
                        <th style={{ width: 36 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ position: "relative" }}>
                            {item.inventoryItemId ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontWeight: 600, fontSize: 12, color: "#1e293b" }}>{item.name}</span>
                                <span className="csm-inv-badge" style={{ background: item.availableStock > 0 ? "#f0fdf4" : "#fef2f2", color: item.availableStock > 0 ? "#16a34a" : "#dc2626" }}>
                                  {item.availableStock > 0 ? `✓ ${item.availableStock}` : "Out"}
                                </span>
                                <button onClick={() => updateRow(idx, "inventoryItemId", "")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                  <X size={10} color="#94a3b8" />
                                </button>
                              </div>
                            ) : (
                              <div style={{ position: "relative" }}>
                                <input
                                  className="csm-input"
                                  style={{ padding: "6px 10px", fontSize: 11 }}
                                  placeholder="Search medicine..."
                                  value={itemSearch[idx] || ""}
                                  onChange={e => setItemSearch(prev => ({ ...prev, [idx]: e.target.value }))}
                                  onFocus={() => setItemFocused(prev => ({ ...prev, [idx]: true }))}
                                  onBlur={() => setTimeout(() => setItemFocused(prev => ({ ...prev, [idx]: false })), 200)}
                                />
                                {itemFocused[idx] && (itemSearch[idx] || "").trim().length > 0 && (
                                  <div className="csm-sugg">
                                    {(itemResults[idx] || []).length > 0 ? (
                                      (itemResults[idx] || []).map((inv: any) => {
                                        const stock = inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
                                        return (
                                          <div key={inv.id} className="csm-sugg-item" onMouseDown={() => selectInvItem(idx, inv)}>
                                            <div>
                                              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 12 }}>{inv.name}</div>
                                              <div style={{ fontSize: 10, color: "#94a3b8" }}>
                                                {inv.genericName && <span>{inv.genericName}</span>}
                                                {inv.brandName && <span> · {inv.brandName}</span>}
                                                {inv.sku && <span> · SKU: {inv.sku}</span>}
                                              </div>
                                            </div>
                                            <span className="csm-inv-badge" style={{ background: stock > 0 ? "#f0fdf4" : "#fef2f2", color: stock > 0 ? "#16a34a" : "#dc2626" }}>
                                              {stock > 0 ? `${stock} in stock` : "Out of stock"}
                                            </span>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div style={{ padding: "12px 14px", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>No inventory item found</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <input type="number" min="1" className="csm-input" style={{ padding: "6px 8px", fontSize: 11, textAlign: "center" }}
                              value={item.quantity} onChange={e => updateRow(idx, "quantity", e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="0" step="0.01" className="csm-input" style={{ padding: "6px 8px", fontSize: 11 }}
                              value={item.unitPrice} onChange={e => updateRow(idx, "unitPrice", e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="0" max="100" className="csm-input" style={{ padding: "6px 8px", fontSize: 11, textAlign: "center" }}
                              value={item.gst} onChange={e => updateRow(idx, "gst", e.target.value)} />
                          </td>
                          <td style={{ fontWeight: 700, color: "#0f172a", fontSize: 12 }}>
                            ₹{((parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 1)).toFixed(0)}
                          </td>
                          <td>
                            {items.length > 1 && (
                              <button onClick={() => removeRow(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                                <X size={14} color="#94a3b8" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="csm-btn ghost" style={{ marginBottom: 4, fontSize: 11 }} onClick={addRow}>
                  <Plus size={13} /> Add Row
                </button>

                {/* ── Pricing ── */}
                <div className="csm-divider" style={{ marginTop: 16 }}><IndianRupee size={12} /> Pricing & Discount</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12 }}>
                  <div>
                    <label className="csm-lbl">Discount (₹)</label>
                    <input type="number" min="0" className="csm-input" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="csm-lbl">Discount Remark</label>
                    <input className="csm-input" placeholder="e.g. Senior citizen, Loyalty" value={discRemark} onChange={e => setDiscRemark(e.target.value)} />
                  </div>
                  <div>
                    <label className="csm-lbl">Tax / GST %</label>
                    <input type="number" min="0" max="100" className="csm-input" value={taxPct} onChange={e => setTaxPct(e.target.value)} placeholder="0" />
                  </div>
                </div>

                {/* ── Summary ── */}
                <div className="csm-summary">
                  <div className="csm-sum-row"><span>Subtotal</span><span>{fmtINR(subtotal)}</span></div>
                  {discAmt > 0 && <div className="csm-sum-row" style={{ color: ACC }}><span>Discount</span><span>-{fmtINR(discAmt)}</span></div>}
                  {taxAmt > 0 && <div className="csm-sum-row" style={{ color: "#6366f1" }}><span>Tax ({taxPct}%)</span><span>+{fmtINR(taxAmt)}</span></div>}
                  <div className="csm-sum-row csm-sum-total"><span>Total Payable</span><span style={{ color: "#16a34a" }}>{fmtINR(total)}</span></div>
                </div>

                {/* ── Payment ── */}
                <div className="csm-divider" style={{ marginTop: 18 }}><CreditCard size={12} /> Payment</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  {PAYMENT_OPTS.map(opt => (
                    <button key={opt.v} className={`csm-pay-opt${payMethod === opt.v ? " on" : ""}`} onClick={() => setPayMethod(opt.v)}>
                      <opt.Icon size={18} />
                      {opt.label}
                    </button>
                  ))}
                </div>
                {payMethod !== "CASH" && (
                  <div>
                    <label className="csm-lbl">Transaction / Reference ID</label>
                    <input className="csm-input" placeholder="UPI ref / Card last 4 / Order ID" value={txnId} onChange={e => setTxnId(e.target.value)} />
                  </div>
                )}

                {/* ── Meta ── */}
                <div className="csm-divider" style={{ marginTop: 18 }}><Clock size={12} /> Transaction Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="csm-lbl">Collected By</label>
                    <input className="csm-input" value={user?.name || user?.email || "Pharmacist"} readOnly style={{ background: "#f8fafc", color: "#64748b" }} />
                  </div>
                  <div>
                    <label className="csm-lbl">Date & Time</label>
                    <input className="csm-input" value={nowStr()} readOnly style={{ background: "#f8fafc", color: "#64748b" }} />
                  </div>
                </div>

                {error && (
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#dc2626" }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!successMsg && (
            <div className="csm-ft">
              <button className="csm-btn ghost" onClick={onClose}>Cancel</button>
              <button className="csm-btn primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 size={14} className="csm-spin" /> : <Check size={14} />}
                {saving ? "Processing..." : `Complete Sell · ${fmtINR(total)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
