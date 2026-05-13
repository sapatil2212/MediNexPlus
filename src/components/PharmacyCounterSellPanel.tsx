"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ShoppingCart, Plus, Search, RefreshCw, Loader2, X, Check, AlertTriangle,
  Trash2, Eye, Download, IndianRupee, TrendingUp, Star, Tag, User,
  CreditCard, Banknote, Wallet, Smartphone, ChevronDown, ChevronUp,
  Calendar, Clock, UserCheck, Package, CheckCircle2, AlertCircle,
  Filter, ArrowUpDown, FileSpreadsheet, Printer, FileText, Receipt,
  ChevronRight, BarChart2, Pill, Hash
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT  = "#0E898F";
const LIGHT   = "#E6F4F4";
const BORDER  = "#B3E0E0";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const fmtINR  = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const nowStr  = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const PAYMENT_OPTS = [
  { v: "CASH",   label: "Cash",     Icon: Banknote },
  { v: "UPI",    label: "UPI",      Icon: Smartphone },
  { v: "CARD",   label: "Card",     Icon: CreditCard },
  { v: "ONLINE", label: "Online",   Icon: Wallet },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface CSItem { inventoryItemId: string; name: string; quantity: string; unitPrice: string; gst: string; availableStock: number; }
interface Sale { id: string; billNo: string; patient: any; items: any[]; subtotal: number; discount: number; tax: number; total: number; paidAmount: number; status: string; paymentMethod: string; notes: string; createdAt: string; }
interface Stats { totalSales: number; totalRevenue: number; totalDiscount: number; bestMedicine: { name: string; qty: number; revenue: number } | null; }

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PharmacyCounterSellPanel({ profile, user, defaultOpen }: { profile: any; user: any; defaultOpen?: boolean }) {
  const [period, setPeriod]             = useState<"today"|"week"|"month"|"all">("month");
  const [sales, setSales]               = useState<Sale[]>([]);
  const [stats, setStats]               = useState<Stats | null>(null);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDS]        = useState("");
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState({ total: 0, totalPages: 1 });
  const [viewSale, setViewSale]         = useState<Sale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [bulkDelConf, setBulkDelConf]   = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [sortCol, setSortCol]           = useState<string>("createdAt");
  const [sortDir, setSortDir]           = useState<"asc"|"desc">("desc");

  // ── New Sale Modal ──
  const [modal, setModal]               = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [successMsg, setSuccessMsg]     = useState("");

  // Patient
  const [patSearch, setPatSearch]       = useState("");
  const [patResults, setPatResults]     = useState<any[]>([]);
  const [patSearching, setPatSearching] = useState(false);
  const [patId, setPatId]               = useState("");
  const [patName, setPatName]           = useState("");
  const [manualPat, setManualPat]       = useState(false);
  const [manualForm, setManualForm]     = useState({ name: "", phone: "", gender: "MALE" });

  // Items
  const blankItem = (): CSItem => ({ inventoryItemId: "", name: "", quantity: "1", unitPrice: "0", gst: "0", availableStock: 0 });
  const [items, setItems]               = useState<CSItem[]>([blankItem()]);
  const [itemSearch, setItemSearch]     = useState<Record<number, string>>({});
  const [itemResults, setItemResults]   = useState<Record<number, any[]>>({});
  const [itemSearching, setItemSearching] = useState<Record<number, boolean>>({});

  // Payment
  const [payMethod, setPayMethod]       = useState("CASH");
  const [txnId, setTxnId]               = useState("");
  const [discount, setDiscount]         = useState("0");
  const [discRemark, setDiscRemark]     = useState("");
  const [taxPct, setTaxPct]             = useState("0");

  // Inventory (for item search)
  const [inventory, setInventory]       = useState<any[]>([]);

  // Dropdown fixed-position refs (escape modal overflow clipping)
  const patWrapRef   = useRef<HTMLDivElement>(null);
  const itemWrapRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [patDropPos,  setPatDropPos]  = useState<{ top: number; left: number; width: number } | null>(null);
  const [itemDropPos, setItemDropPos] = useState<Record<number, { top: number; left: number; width: number }>>({});

  const updatePatDropPos = () => {
    if (patWrapRef.current) {
      const r = patWrapRef.current.getBoundingClientRect();
      setPatDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  };
  const updateItemDropPos = (idx: number) => {
    const el = itemWrapRefs.current[idx];
    if (el) {
      const r = el.getBoundingClientRect();
      setItemDropPos(prev => ({ ...prev, [idx]: { top: r.bottom + 4, left: r.left, width: r.width } }));
    }
  };

  // Auto-open modal when parent requests it
  useEffect(() => { if (defaultOpen) setModal(true); }, [defaultOpen]);

  // ── Load data ──
  const loadSales = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ period, search: debouncedSearch, page: String(page), limit: "50" });
    const res = await api(`/api/pharmacy/counter-sale?${q}`);
    if (res.success) {
      setSales(res.data.sales || []);
      setStats(res.data.stats || null);
      setPagination({ total: res.data.pagination?.total || 0, totalPages: res.data.pagination?.totalPages || 1 });
    }
    setLoading(false);
  }, [period, debouncedSearch, page]);

  const loadInventory = useCallback(async () => {
    const res = await api("/api/subdept/inventory?limit=300");
    if (res.success) setInventory(res.data?.data || res.data || []);
  }, []);

  useEffect(() => { loadSales(); }, [loadSales]);
  useEffect(() => { loadInventory(); }, [loadInventory]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDS(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Patient search ──
  useEffect(() => {
    if (!modal || manualPat || patId) return;
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
  }, [patSearch, modal, manualPat, patId]);

  // ── Item search ──
  useEffect(() => {
    const searches = Object.entries(itemSearch);
    for (const [idxStr, q] of searches) {
      const idx = parseInt(idxStr);
      if (!q.trim() || q.length < 1) { setItemResults(prev => ({ ...prev, [idx]: [] })); continue; }
      const filtered = inventory.filter(i => i.isActive !== false && i.name?.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
      setItemResults(prev => ({ ...prev, [idx]: filtered }));
    }
  }, [itemSearch, inventory]);

  // ── Computed totals ──
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity) || 1), 0);
  const discAmt  = parseFloat(discount) || 0;
  const taxAmt   = ((subtotal - discAmt) * (parseFloat(taxPct) || 0)) / 100;
  const total    = Math.max(subtotal - discAmt + taxAmt, 0);

  // ── Handlers ──
  const resetModal = () => {
    setModal(false); setError(""); setSuccessMsg("");
    setPatSearch(""); setPatResults([]); setPatId(""); setPatName(""); setManualPat(false);
    setManualForm({ name: "", phone: "", gender: "MALE" });
    setItems([blankItem()]); setItemSearch({}); setItemResults({}); setItemSearching({});
    setPayMethod("CASH"); setTxnId(""); setDiscount("0"); setDiscRemark(""); setTaxPct("0");
  };

  const selectPat = (p: any) => { setPatId(p.id); setPatName(p.name); setPatSearch(""); setPatResults([]); };

  const addRow = () => setItems(prev => [...prev, blankItem()]);
  const removeRow = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, key: keyof CSItem, val: string | number) =>
    setItems(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  const selectInvItem = (idx: number, invItem: any) => {
    const stock = invItem.totalStock || invItem.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
    updateRow(idx, "inventoryItemId", invItem.id);
    updateRow(idx, "name", invItem.name);
    updateRow(idx, "unitPrice", String(invItem.sellingPrice || invItem.mrp || 0));
    updateRow(idx, "gst", String(invItem.gst || 0));
    updateRow(idx, "availableStock", stock);
    setItemSearch(prev => ({ ...prev, [idx]: "" }));
    setItemResults(prev => ({ ...prev, [idx]: [] }));
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
    const stockIssues = validItems.filter(i => (parseInt(i.quantity) || 1) > i.availableStock && i.availableStock > 0);
    if (stockIssues.length > 0) { setError(`Quantity exceeds stock for: ${stockIssues.map(i => i.name).join(", ")}`); return; }

    if (!manualPat) setSaving(true);
    const res = await api("/api/pharmacy/counter-sale", "POST", {
      patientId: pid,
      items: validItems.map(i => ({ inventoryItemId: i.inventoryItemId, name: i.name, quantity: parseInt(i.quantity) || 1, unitPrice: parseFloat(i.unitPrice) || 0 })),
      paymentMethod: payMethod,
      transactionId: txnId || null,
      discount: discAmt,
      remarks: discRemark || "Direct pharmacy counter sale",
      taxPercent: parseFloat(taxPct) || 0,
    });
    setSaving(false);
    if (res.success) {
      setSuccessMsg(`✓ Sale complete — ${res.data?.billNo || ""} — ${fmtINR(res.data?.total || 0)}`);
      setTimeout(() => { resetModal(); loadSales(); loadInventory(); }, 1800);
    } else {
      setError(res.message || "Failed to process sale");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const res = await api(`/api/pharmacy/counter-sale?id=${id}`, "DELETE");
    setDeleting(false);
    if (res.success) { setDeleteTarget(null); loadSales(); }
    else setError(res.message || "Failed to delete");
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    for (const id of selected) await api(`/api/pharmacy/counter-sale?id=${id}`, "DELETE");
    setSelected(new Set()); setBulkDelConf(false); setBulkDeleting(false); loadSales();
  };

  const toggleSelect  = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll     = () => sales.length === selected.size ? setSelected(new Set()) : setSelected(new Set(sales.map(s => s.id)));
  const toggleSort    = (col: string) => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("desc"); } };

  const sortedSales = [...sales].sort((a: any, b: any) => {
    const d = sortDir === "asc" ? 1 : -1;
    if (sortCol === "createdAt") return d * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sortCol === "total") return d * ((a.total || 0) - (b.total || 0));
    if (sortCol === "billNo") return d * (a.billNo || "").localeCompare(b.billNo || "");
    if (sortCol === "patient") return d * ((a.patient?.name || "").localeCompare(b.patient?.name || ""));
    return 0;
  });

  // ── Export ──
  const exportCSV = () => {
    const rows = sortedSales.map(s => ({
      "Bill No": s.billNo, Patient: s.patient?.name || "—", "Patient ID": s.patient?.patientId || "—",
      Items: s.items.map((i: any) => `${i.name}×${i.quantity}`).join("; "),
      Subtotal: s.subtotal, Discount: s.discount, Tax: s.tax, Total: s.total,
      Payment: s.paymentMethod, Date: fmtDate(s.createdAt), Time: fmtTime(s.createdAt),
    }));
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${String((r as any)[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = `counter-sales-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const exportPrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Counter Sales</title><style>body{font-family:Arial,sans-serif;margin:20px}h2{color:#0E898F}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#0E898F;color:#fff;padding:8px 10px;text-align:left}td{padding:7px 10px;border-bottom:1px solid #e2e8f0}tr:nth-child(even){background:#f8fafc}</style></head><body>`);
    w.document.write(`<h2>Pharmacy Counter Sales — ${period.toUpperCase()}</h2><p style="color:#64748b;font-size:11px">Generated: ${nowStr()}</p>`);
    w.document.write(`<table><thead><tr><th>Bill No</th><th>Patient</th><th>Items</th><th>Total</th><th>Payment</th><th>Date/Time</th></tr></thead><tbody>`);
    sortedSales.forEach(s => {
      w.document.write(`<tr><td>${s.billNo}</td><td>${s.patient?.name || "—"}</td><td>${s.items.map((i: any) => `${i.name}×${i.quantity||1}`).join(", ")}</td><td>₹${s.total}</td><td>${s.paymentMethod}</td><td>${fmtDate(s.createdAt)} ${fmtTime(s.createdAt)}</td></tr>`);
    });
    w.document.write("</tbody></table></body></html>"); w.document.close(); w.print();
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes csSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes csSpin{to{transform:rotate(360deg)}}
        @keyframes csPulse{0%,100%{opacity:1}50%{opacity:.5}}
        .cs-spin{animation:csSpin .7s linear infinite}
        .cs-fade{animation:csSlideUp .25s ease}
        .cs-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
        @media(max-width:1100px){.cs-kpi{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.cs-kpi{grid-template-columns:1fr}}
        .cs-card{background:#fff;border-radius:16px;padding:18px 20px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.04);display:flex;gap:14px;align-items:center;transition:box-shadow .2s,transform .2s}
        .cs-card:hover{box-shadow:0 6px 24px rgba(0,0,0,.08);transform:translateY(-2px)}
        .cs-ic{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .cs-lbl{font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
        .cs-val{font-size:20px;font-weight:900;color:#0f172a;letter-spacing:-.02em;margin-top:2px}
        .cs-sub{font-size:10px;color:#64748b;margin-top:2px}
        .cs-panel{background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .cs-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;border-bottom:1px solid #f1f5f9;flex-wrap:wrap}
        .cs-search{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 14px;min-width:220px;transition:border .15s}
        .cs-search:focus-within{border-color:#B3E0E0}
        .cs-search input{background:none;border:none;outline:none;font-size:12px;color:#334155;width:100%;font-family:inherit}
        .cs-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;border:none;transition:all .15s;white-space:nowrap}
        .cs-btn.primary{background:linear-gradient(135deg,#0E898F,#07595D);color:#fff;box-shadow:0 2px 8px rgba(14,137,143,.3)}
        .cs-btn.primary:hover{background:linear-gradient(135deg,#0A7A80,#065254);box-shadow:0 4px 16px rgba(14,137,143,.4)}
        .cs-btn.ghost{background:#fff;border:1.5px solid #e2e8f0;color:#475569}
        .cs-btn.ghost:hover{background:#f8fafc;border-color:#B3E0E0;color:#0E898F}
        .cs-btn.danger{background:#fff5f5;border:1.5px solid #fecaca;color:#ef4444}
        .cs-btn.danger:hover{background:#fef2f2}
        .cs-tbl-wrap{overflow-x:auto}
        .cs-tbl{width:100%;border-collapse:collapse}
        .cs-tbl th{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;text-align:left;padding:11px 16px;background:#fff;white-space:nowrap;border-bottom:1.5px solid #f1f5f9;user-select:none}
        .cs-tbl th.sort{cursor:pointer}
        .cs-tbl th.sort:hover{color:#0E898F}
        .cs-tbl td{padding:12px 16px;font-size:12px;color:#334155;border-bottom:1px solid #f8fafc;white-space:nowrap;vertical-align:middle}
        .cs-tbl tbody tr:hover td{background:#f8fbff}
        .cs-tbl tbody tr.sel td{background:#E6F4F4}
        .cs-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .cs-empty{padding:64px 24px;text-align:center;color:#94a3b8}
        .cs-modal-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}
        .cs-modal-bg{position:absolute;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px)}
        .cs-modal{position:relative;z-index:1;background:#fff;border-radius:20px;width:95%;max-width:760px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.18)}
        .cs-modal-hd{background:linear-gradient(135deg,#0E898F,#07595D);padding:20px 24px;display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0}
        .cs-modal-body{flex:1;overflow-y:auto;padding:20px 24px}
        .cs-modal-ft{padding:16px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;background:#fff}
        .cs-field-lbl{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;display:block}
        .cs-input{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:12px;color:#1e293b;outline:none;font-family:inherit;background:#fff;transition:border .15s}
        .cs-input:focus{border-color:#B3E0E0;box-shadow:0 0 0 3px rgba(14,137,143,.08)}
        .cs-select{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:12px;color:#1e293b;outline:none;background:#fff;font-family:inherit;cursor:pointer}
        .cs-items-tbl{width:100%;border-collapse:collapse}
        .cs-items-tbl th{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;padding:8px 10px;text-align:left;background:#f8fafc;border-bottom:1px solid #f1f5f9}
        .cs-items-tbl td{padding:7px 8px;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .cs-pay-opt{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 14px;border-radius:12px;border:2px solid #e2e8f0;cursor:pointer;transition:all .15s;background:#fff;min-width:80px;font-size:11px;font-weight:600;color:#64748b}
        .cs-pay-opt.on{border-color:#0E898F;background:#E6F4F4;color:#0E898F}
        .cs-pay-opt:hover{border-color:#B3E0E0}
        .cs-divider{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 12px;display:flex;align-items:center;gap:8px}
        .cs-divider::after{content:'';flex:1;height:1px;background:#f1f5f9}
        .cs-summary{background:#f8fafc;border-radius:12px;padding:14px 16px;margin-top:14px}
        .cs-sum-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;color:#475569}
        .cs-sum-total{font-weight:900;color:#0f172a;font-size:15px;padding-top:8px;border-top:1.5px solid #e2e8f0;margin-top:4px}
        .cs-inv-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700}
        .cs-sugg{position:fixed;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:9999;max-height:220px;overflow-y:auto}
        .cs-sugg-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;font-size:12px;border-bottom:1px solid #f8fafc;transition:background .1s}
        .cs-sugg-item:hover{background:#E6F4F4}
        .cs-period-btn{padding:6px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:11px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s}
        .cs-period-btn.on{background:#E6F4F4;border-color:#B3E0E0;color:#0A6B70}
      `}</style>

      {/* ── Page Header ── */}
      <div className="cs-fade">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#0E898F,#07595D)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShoppingCart size={20} color="#fff" />
              </div>
              Counter Sell
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Manage direct over-the-counter pharmacy sales</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Period filters */}
            <div style={{ display: "flex", gap: 4, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 3 }}>
              {(["today","week","month","all"] as const).map(p => (
                <button key={p} className={`cs-period-btn${period === p ? " on" : ""}`} onClick={() => { setPeriod(p); setPage(1); }}>
                  {p === "today" ? "Today" : p === "week" ? "7 Days" : p === "month" ? "This Month" : "All Time"}
                </button>
              ))}
            </div>
            <button className="cs-btn ghost" onClick={loadSales} disabled={loading}>
              <RefreshCw size={13} className={loading ? "cs-spin" : ""} /> Refresh
            </button>
            <button className="cs-btn ghost" onClick={exportCSV}><FileSpreadsheet size={13} /> CSV</button>
            <button className="cs-btn ghost" onClick={exportPrint}><Printer size={13} /> Print</button>
            <button className="cs-btn primary" onClick={() => { setModal(true); }}>
              <Plus size={15} /> New Counter Sale
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="cs-kpi">
          <div className="cs-card">
            <div className="cs-ic" style={{ background: "#E6F4F4" }}><ShoppingCart size={22} color={ACCENT} /></div>
            <div>
              <div className="cs-lbl">Total Sales</div>
              <div className="cs-val">{loading ? "—" : (stats?.totalSales || 0)}</div>
              <div className="cs-sub">{period === "today" ? "Today" : period === "week" ? "Last 7 days" : period === "month" ? "This month" : "All time"}</div>
            </div>
          </div>
          <div className="cs-card">
            <div className="cs-ic" style={{ background: "#f0fdf4" }}><TrendingUp size={22} color="#16a34a" /></div>
            <div>
              <div className="cs-lbl">Total Revenue</div>
              <div className="cs-val" style={{ color: "#16a34a" }}>{loading ? "—" : fmtINR(stats?.totalRevenue || 0)}</div>
              <div className="cs-sub">Amount collected</div>
            </div>
          </div>
          <div className="cs-card">
            <div className="cs-ic" style={{ background: "#fffbeb" }}><Star size={22} color="#f59e0b" /></div>
            <div>
              <div className="cs-lbl">Best Performer</div>
              <div className="cs-val" style={{ fontSize: 13, fontWeight: 800 }}>{loading ? "—" : (stats?.bestMedicine?.name || "—")}</div>
              {stats?.bestMedicine && <div className="cs-sub">{stats.bestMedicine.qty} units · {fmtINR(stats.bestMedicine.revenue)}</div>}
            </div>
          </div>
          <div className="cs-card">
            <div className="cs-ic" style={{ background: "#fff7ed" }}><Tag size={22} color="#ea580c" /></div>
            <div>
              <div className="cs-lbl">Total Discount</div>
              <div className="cs-val" style={{ color: "#ea580c" }}>{loading ? "—" : fmtINR(stats?.totalDiscount || 0)}</div>
              <div className="cs-sub">Discount given</div>
            </div>
          </div>
        </div>

        {/* ── Table Panel ── */}
        <div className="cs-panel">
          <div className="cs-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="cs-search">
                <Search size={13} color="#94a3b8" />
                <input placeholder="Search bill no, patient..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }} onClick={() => setSearch("")}><X size={12} color="#94a3b8" /></button>}
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{pagination.total} record{pagination.total !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {selected.size > 0 && (
                <button className="cs-btn danger" onClick={() => setBulkDelConf(true)}>
                  <Trash2 size={12} /> Delete {selected.size} selected
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="cs-tbl-wrap">
            {loading ? (
              <div style={{ padding: 56, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8" }}>
                <Loader2 size={18} className="cs-spin" /> Loading counter sales...
              </div>
            ) : sortedSales.length === 0 ? (
              <div className="cs-empty">
                <ShoppingCart size={36} color="#e2e8f0" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: "#334155" }}>No counter sales found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Start by clicking "New Counter Sale"</div>
              </div>
            ) : (
              <table className="cs-tbl">
                <thead>
                  <tr>
                    <th style={{ width: 40, paddingLeft: 16 }}>
                      <input type="checkbox" checked={selected.size === sales.length && sales.length > 0} onChange={toggleAll} style={{ cursor: "pointer" }} />
                    </th>
                    <th className="sort" onClick={() => toggleSort("billNo")}>Bill No {sortCol === "billNo" && <ArrowUpDown size={10} style={{ display: "inline" }} />}</th>
                    <th className="sort" onClick={() => toggleSort("patient")}>Patient {sortCol === "patient" && <ArrowUpDown size={10} style={{ display: "inline" }} />}</th>
                    <th>Items</th>
                    <th className="sort" onClick={() => toggleSort("total")}>Amount {sortCol === "total" && <ArrowUpDown size={10} style={{ display: "inline" }} />}</th>
                    <th>Discount</th>
                    <th>Payment</th>
                    <th className="sort" onClick={() => toggleSort("createdAt")}>Date / Time {sortCol === "createdAt" && <ArrowUpDown size={10} style={{ display: "inline" }} />}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSales.map(s => (
                    <tr key={s.id} className={selected.has(s.id) ? "sel" : ""}>
                      <td style={{ paddingLeft: 16 }}>
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} style={{ cursor: "pointer" }} />
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: ACCENT }}>{s.billNo}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{s.patient?.name || "—"}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.patient?.patientId || ""}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 200 }}>
                          {(s.items || []).slice(0, 3).map((it: any, i: number) => (
                            <span key={i} style={{ padding: "2px 7px", borderRadius: 6, background: LIGHT, color: "#0A6B70", fontSize: 10, fontWeight: 600 }}>
                              {it.name} ×{it.quantity || 1}
                            </span>
                          ))}
                          {(s.items || []).length > 3 && <span style={{ fontSize: 10, color: "#94a3b8" }}>+{(s.items || []).length - 3} more</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: "#16a34a", fontSize: 13 }}>{fmtINR(s.total)}</span>
                        {s.tax > 0 && <div style={{ fontSize: 10, color: "#94a3b8" }}>Incl. tax {fmtINR(s.tax)}</div>}
                      </td>
                      <td>
                        {s.discount > 0
                          ? <span style={{ fontWeight: 700, color: "#ea580c" }}>-{fmtINR(s.discount)}</span>
                          : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td>
                        <span className="cs-badge" style={{
                          background: s.paymentMethod === "CASH" ? "#f0fdf4" : s.paymentMethod === "UPI" ? "#eff6ff" : s.paymentMethod === "CARD" ? "#fdf4ff" : "#fff7ed",
                          color: s.paymentMethod === "CASH" ? "#16a34a" : s.paymentMethod === "UPI" ? "#2563eb" : s.paymentMethod === "CARD" ? "#9333ea" : "#c2410c",
                        }}>
                          {s.paymentMethod || "CASH"}
                        </span>
                      </td>
                      <td>
                        <div style={{ color: "#334155", fontWeight: 500 }}>{fmtDate(s.createdAt)}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtTime(s.createdAt)}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="cs-btn ghost" style={{ padding: "5px 8px" }} onClick={() => setViewSale(s)} title="View Invoice">
                            <Eye size={13} color={ACCENT} />
                          </button>
                          <button className="cs-btn danger" style={{ padding: "5px 8px" }} onClick={() => setDeleteTarget(s)} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Page {page} of {pagination.totalPages}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="cs-btn ghost" style={{ padding: "5px 10px" }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <button className="cs-btn ghost" style={{ padding: "5px 10px" }} disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ New Counter Sale Modal ═══════ */}
      {modal && (
        <div className="cs-modal-overlay" onClick={resetModal}>
          <div className="cs-modal-bg" />
          <div className="cs-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="cs-modal-hd">
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>New Transaction</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  <ShoppingCart size={20} /> Counter Sale
                </div>
              </div>
              <button onClick={resetModal} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#fff" />
              </button>
            </div>

            {/* Body */}
            <div className="cs-modal-body">
              {successMsg ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 14 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={32} color="#16a34a" />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Sale Completed!</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{successMsg}</div>
                </div>
              ) : (
                <>
                  {/* ── Patient Section ── */}
                  <div className="cs-divider">
                    <User size={12} /> Patient Information
                  </div>

                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <button
                      onClick={() => { setManualPat(false); setManualForm({ name:"", phone:"", gender:"MALE" }); }}
                      style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${!manualPat ? "#0E898F" : "#e2e8f0"}`, background: !manualPat ? LIGHT : "#fff", color: !manualPat ? ACCENT : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Search Existing
                    </button>
                    <button
                      onClick={() => { setManualPat(true); setPatId(""); setPatName(""); setPatResults([]); }}
                      style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${manualPat ? "#0E898F" : "#e2e8f0"}`, background: manualPat ? LIGHT : "#fff", color: manualPat ? ACCENT : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Manual Entry
                    </button>
                  </div>

                  {!manualPat ? (
                    patId ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: LIGHT, borderRadius: 10, border: `1.5px solid ${BORDER}` }}>
                        <UserCheck size={16} color={ACCENT} />
                        <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 13 }}>{patName}</span>
                        <button onClick={() => { setPatId(""); setPatName(""); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}><X size={14} color="#94a3b8" /></button>
                      </div>
                    ) : (
                      <div ref={patWrapRef} style={{ position: "relative" }}>
                        <div className="cs-search">
                          <Search size={13} color="#94a3b8" />
                          <input placeholder="Search by name or phone..." value={patSearch} onChange={e => { setPatSearch(e.target.value); updatePatDropPos(); }} onFocus={updatePatDropPos} autoFocus />
                          {patSearching && <Loader2 size={12} color="#94a3b8" className="cs-spin" />}
                        </div>
                        {patResults.length > 0 && patDropPos && (
                          <div className="cs-sugg" style={{ top: patDropPos.top, left: patDropPos.left, width: patDropPos.width }}>
                            {patResults.map((p: any) => (
                              <div key={p.id} className="cs-sugg-item" onClick={() => selectPat(p)}>
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
                        <label className="cs-field-lbl">Name *</label>
                        <input className="cs-input" placeholder="Full name" value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="cs-field-lbl">Phone *</label>
                        <input className="cs-input" placeholder="10-digit mobile" value={manualForm.phone} onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="cs-field-lbl">Gender</label>
                        <select className="cs-select" value={manualForm.gender} onChange={e => setManualForm(f => ({ ...f, gender: e.target.value }))}>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* ── Items Section ── */}
                  <div className="cs-divider" style={{ marginTop: 20 }}>
                    <Package size={12} /> Items
                  </div>

                  <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
                    <table className="cs-items-tbl">
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
                                  <span className="cs-inv-badge" style={{ background: item.availableStock > 0 ? "#f0fdf4" : "#fef2f2", color: item.availableStock > 0 ? "#16a34a" : "#dc2626" }}>
                                    {item.availableStock > 0 ? `✓ ${item.availableStock}` : "Out"}
                                  </span>
                                  <button onClick={() => updateRow(idx, "inventoryItemId", "")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                    <X size={10} color="#94a3b8" />
                                  </button>
                                </div>
                              ) : (
                                <div ref={el => { itemWrapRefs.current[idx] = el; }} style={{ position: "relative" }}>
                                  <input
                                    className="cs-input"
                                    style={{ padding: "6px 10px", fontSize: 11 }}
                                    placeholder="Search medicine..."
                                    value={itemSearch[idx] || ""}
                                    onChange={e => { setItemSearch(prev => ({ ...prev, [idx]: e.target.value })); updateItemDropPos(idx); }}
                                    onFocus={() => { setItemSearching(prev => ({ ...prev, [idx]: true })); updateItemDropPos(idx); }}
                                    onBlur={() => setTimeout(() => setItemSearching(prev => ({ ...prev, [idx]: false })), 200)}
                                  />
                                  {(itemSearch[idx] || "").length > 0 && (itemResults[idx] || []).length > 0 && itemDropPos[idx] && (
                                    <div className="cs-sugg" style={{ top: itemDropPos[idx].top, left: itemDropPos[idx].left, width: itemDropPos[idx].width }}>
                                      {(itemResults[idx] || []).map((inv: any) => {
                                        const stock = inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;
                                        return (
                                          <div key={inv.id} className="cs-sugg-item" onMouseDown={() => selectInvItem(idx, inv)}>
                                            <div>
                                              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 12 }}>{inv.name}</div>
                                              <div style={{ fontSize: 10, color: "#94a3b8" }}>{inv.category} · MRP: ₹{inv.mrp || 0}</div>
                                            </div>
                                            <span className="cs-inv-badge" style={{ background: stock > 0 ? "#f0fdf4" : "#fef2f2", color: stock > 0 ? "#16a34a" : "#dc2626" }}>
                                              {stock > 0 ? `${stock} in stock` : "Out of stock"}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {(itemSearch[idx] || "").length > 0 && (itemResults[idx] || []).length === 0 && itemDropPos[idx] && (
                                    <div className="cs-sugg" style={{ top: itemDropPos[idx].top, left: itemDropPos[idx].left, width: itemDropPos[idx].width }}>
                                      <div style={{ padding: "12px 14px", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>No inventory item found</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                type="number" min="1"
                                className="cs-input" style={{ padding: "6px 8px", fontSize: 11, textAlign: "center" }}
                                value={item.quantity}
                                onChange={e => updateRow(idx, "quantity", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number" min="0" step="0.01"
                                className="cs-input" style={{ padding: "6px 8px", fontSize: 11 }}
                                value={item.unitPrice}
                                onChange={e => updateRow(idx, "unitPrice", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number" min="0" max="100"
                                className="cs-input" style={{ padding: "6px 8px", fontSize: 11, textAlign: "center" }}
                                value={item.gst}
                                onChange={e => updateRow(idx, "gst", e.target.value)}
                              />
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
                  <button className="cs-btn ghost" style={{ marginBottom: 4, fontSize: 11 }} onClick={addRow}>
                    <Plus size={13} /> Add Row
                  </button>

                  {/* ── Pricing ── */}
                  <div className="cs-divider" style={{ marginTop: 16 }}>
                    <IndianRupee size={12} /> Pricing & Discount
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12 }}>
                    <div>
                      <label className="cs-field-lbl">Discount (₹)</label>
                      <input type="number" min="0" className="cs-input" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="cs-field-lbl">Discount Remark</label>
                      <input className="cs-input" placeholder="e.g. Senior citizen, Loyalty" value={discRemark} onChange={e => setDiscRemark(e.target.value)} />
                    </div>
                    <div>
                      <label className="cs-field-lbl">Tax / GST %</label>
                      <input type="number" min="0" max="100" className="cs-input" value={taxPct} onChange={e => setTaxPct(e.target.value)} placeholder="0" />
                    </div>
                  </div>

                  {/* ── Summary ── */}
                  <div className="cs-summary">
                    <div className="cs-sum-row"><span>Subtotal</span><span>{fmtINR(subtotal)}</span></div>
                    {discAmt > 0 && <div className="cs-sum-row" style={{ color: "#ea580c" }}><span>Discount</span><span>-{fmtINR(discAmt)}</span></div>}
                    {taxAmt > 0 && <div className="cs-sum-row" style={{ color: "#6366f1" }}><span>Tax ({taxPct}%)</span><span>+{fmtINR(taxAmt)}</span></div>}
                    <div className="cs-sum-row cs-sum-total"><span>Total Payable</span><span style={{ color: "#16a34a" }}>{fmtINR(total)}</span></div>
                  </div>

                  {/* ── Payment ── */}
                  <div className="cs-divider" style={{ marginTop: 18 }}>
                    <CreditCard size={12} /> Payment
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                    {PAYMENT_OPTS.map(opt => (
                      <button key={opt.v} className={`cs-pay-opt${payMethod === opt.v ? " on" : ""}`} onClick={() => setPayMethod(opt.v)}>
                        <opt.Icon size={18} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {payMethod !== "CASH" && (
                    <div>
                      <label className="cs-field-lbl">Transaction / Reference ID</label>
                      <input className="cs-input" placeholder="UPI ref / Card last 4 / Order ID" value={txnId} onChange={e => setTxnId(e.target.value)} />
                    </div>
                  )}

                  {/* ── Meta ── */}
                  <div className="cs-divider" style={{ marginTop: 18 }}>
                    <Clock size={12} /> Transaction Details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label className="cs-field-lbl">Collected By</label>
                      <input className="cs-input" value={user?.name || user?.email || "Pharmacist"} readOnly style={{ background: "#f8fafc", color: "#64748b" }} />
                    </div>
                    <div>
                      <label className="cs-field-lbl">Date & Time</label>
                      <input className="cs-input" value={nowStr()} readOnly style={{ background: "#f8fafc", color: "#64748b" }} />
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
              <div className="cs-modal-ft">
                <button className="cs-btn ghost" onClick={resetModal}>Cancel</button>
                <button className="cs-btn primary" onClick={handleSubmit} disabled={saving}>
                  {saving ? <Loader2 size={14} className="cs-spin" /> : <Check size={14} />}
                  {saving ? "Processing..." : `Complete Sale · ${fmtINR(total)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ View Invoice Modal ═══════ */}
      {viewSale && (
        <div className="cs-modal-overlay" onClick={() => setViewSale(null)}>
          <div className="cs-modal-bg" />
          <div className="cs-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="cs-modal-hd">
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>Invoice</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: "#fff" }}>{viewSale.billNo}</div>
              </div>
              <button onClick={() => setViewSale(null)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#fff" />
              </button>
            </div>
            <div className="cs-modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: LIGHT, borderRadius: 12, border: `1px solid ${BORDER}`, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b" }}>{viewSale.patient?.name || "Counter Patient"}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{viewSale.patient?.patientId || ""} {viewSale.patient?.phone ? `· ${viewSale.patient.phone}` : ""}</div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtDate(viewSale.createdAt)}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtTime(viewSale.createdAt)}</div>
                </div>
              </div>

              {/* Items */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "#94a3b8", fontWeight: 700 }}>Item</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>Qty</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: "#94a3b8", fontWeight: 700 }}>Price</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: "#94a3b8", fontWeight: 700 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewSale.items || []).map((it: any, i: number) => (
                      <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 500, color: "#1e293b" }}>{it.name || it.description}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: "#64748b" }}>{it.quantity || 1}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>₹{it.unitPrice || 0}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>₹{it.amount || ((it.unitPrice || 0) * (it.quantity || 1))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="cs-summary">
                <div className="cs-sum-row"><span>Subtotal</span><span>{fmtINR(viewSale.subtotal)}</span></div>
                {viewSale.discount > 0 && <div className="cs-sum-row" style={{ color: "#ea580c" }}><span>Discount</span><span>-{fmtINR(viewSale.discount)}</span></div>}
                {viewSale.tax > 0 && <div className="cs-sum-row"><span>Tax</span><span>+{fmtINR(viewSale.tax)}</span></div>}
                <div className="cs-sum-row cs-sum-total"><span>Total</span><span style={{ color: "#16a34a" }}>{fmtINR(viewSale.total)}</span></div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
                <span className="cs-badge" style={{ background: "#E6F4F4", color: ACCENT }}>
                  {viewSale.paymentMethod || "CASH"}
                </span>
                <span className="cs-badge" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                  <CheckCircle2 size={10} style={{ marginRight: 3 }} /> PAID
                </span>
              </div>
            </div>
            <div className="cs-modal-ft">
              <button className="cs-btn ghost" onClick={() => setViewSale(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Delete Confirm Modal ═══════ */}
      {deleteTarget && (
        <div className="cs-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="cs-modal-bg" />
          <div className="cs-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "28px 28px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Trash2 size={24} color="#dc2626" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Delete Counter Sale</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                Delete <strong>{deleteTarget.billNo}</strong>? This will remove the bill, payment, and revenue record. This action cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="cs-btn ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="cs-btn danger" onClick={() => handleDelete(deleteTarget.id)} disabled={deleting}>
                  {deleting ? <Loader2 size={13} className="cs-spin" /> : <Trash2 size={13} />}
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Bulk Delete Confirm ═══════ */}
      {bulkDelConf && (
        <div className="cs-modal-overlay" onClick={() => setBulkDelConf(false)}>
          <div className="cs-modal-bg" />
          <div className="cs-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "28px 28px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Trash2 size={24} color="#dc2626" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Delete {selected.size} Sales</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>All selected counter sales and their associated bills and revenue records will be permanently deleted.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="cs-btn ghost" onClick={() => setBulkDelConf(false)}>Cancel</button>
                <button className="cs-btn danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                  {bulkDeleting ? <Loader2 size={13} className="cs-spin" /> : <Trash2 size={13} />}
                  {bulkDeleting ? "Deleting..." : `Delete ${selected.size}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
