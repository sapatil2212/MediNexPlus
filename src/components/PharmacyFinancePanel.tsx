"use client";
import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Plus, Download, Loader2, IndianRupee, CreditCard,
  RefreshCw, Eye, X, User as UserIcon, ArrowUpDown, ChevronDown, FileSpreadsheet, Printer, FileJson,
  Banknote, Smartphone, Wallet, BarChart2, Activity, CheckCircle2, AlertCircle,
  ShoppingCart, Package, Calendar
} from "lucide-react";

const fmtINR  = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate  = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtShort = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
const nowStr   = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

type FinanceTab = "overview" | "expenses" | "revenue";
type Period     = "today" | "week" | "month" | "all";

const PERIOD_LABELS: Record<Period, string> = { today: "Today", week: "7 Days", month: "This Month", all: "All Time" };

const METHOD_META: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  CASH:   { label: "Cash",   color: "#16a34a", bg: "#f0fdf4", Icon: Banknote },
  UPI:    { label: "UPI",    color: "#2563eb", bg: "#eff6ff", Icon: Smartphone },
  CARD:   { label: "Card",   color: "#9333ea", bg: "#faf5ff", Icon: CreditCard },
  ONLINE: { label: "Online", color: "#c2410c", bg: "#fff7ed", Icon: Wallet },
  OTHER:  { label: "Other",  color: "#64748b", bg: "#f8fafc", Icon: IndianRupee },
};

// ── Build 7-day chart data from raw bills/purchases ──────────────────────────
function build7DayData(bills: any[], purchases: any[]) {
  const days: { label: string; date: string; rev: number; exp: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const dStr = d.toISOString().slice(0, 10);
    days.push({ label: d.toLocaleDateString("en-IN", { weekday: "short" }), date: dStr, rev: 0, exp: 0 });
  }
  for (const b of bills) {
    const d = (b.paidAt || b.createdAt || "").slice(0, 10);
    const slot = days.find(x => x.date === d);
    if (slot) slot.rev += (b.paidAmount || 0);
  }
  for (const p of purchases) {
    const d = (p.createdAt || "").slice(0, 10);
    const slot = days.find(x => x.date === d);
    if (slot) slot.exp += (p.grandTotal || p.totalAmount || 0);
  }
  return days;
}

export default function PharmacyFinancePanel() {
  const [search, setSearch]   = useState("");
  const [tab, setTab]         = useState<FinanceTab>("overview");
  const [period, setPeriod]   = useState<Period>("month");
  
  const [loading, setLoading] = useState(true);
  const [revExpData, setRevExpData] = useState<any>(null);
  
  const [viewBill, setViewBill] = useState<any>(null);
  const [viewExpense, setViewExpense] = useState<any>(null);
  
  // Add Expense form
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState({ title: "", category: "OTHER", amount: "", date: new Date().toISOString().split("T")[0], description: "" });
  const [expSaving, setExpSaving] = useState(false);
  const [expMsg, setExpMsg] = useState("");

  // Add Revenue form
  const [showRevForm, setShowRevForm] = useState(false);
  const [revForm, setRevForm] = useState({ sourceType: "PHARMACY", amount: "", description: "" });
  const [revSaving, setRevSaving] = useState(false);
  const [revMsg, setRevMsg] = useState("");

  const [expSort, setExpSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const [revSort, setRevSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });

  const [showExportMenu, setShowExportMenu] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacy/revenue-expense?period=${period}`, { credentials: "include" }).then(r => r.json());
      if (res.success) setRevExpData(res.data);
    } catch(err) {}
    setLoading(false);
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveExpense = async () => {
    const expAmt = parseFloat(expForm.amount);
    if (!expForm.title.trim()) { setExpMsg("Please enter a title"); return; }
    if (!expForm.amount || isNaN(expAmt) || expAmt <= 0) { setExpMsg("Please enter a valid amount greater than 0"); return; }
    if (!expForm.date) { setExpMsg("Please select a date"); return; }
    setExpSaving(true); setExpMsg("");
    try {
      const d = await fetch("/api/pharmacy/revenue-expense", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expForm, amount: expAmt })
      }).then(r => r.json());
      if (d.success) {
        setShowExpForm(false);
        setExpForm({ title: "", category: "OTHER", amount: "", date: new Date().toISOString().split("T")[0], description: "" });
        loadData();
      } else { setExpMsg(d.message || "Failed to add expense"); }
    } catch (err: any) { setExpMsg(err?.message || "Network error — please try again"); }
    setExpSaving(false);
  };

  const saveRevenue = async () => {
    const amt = parseFloat(revForm.amount);
    if (!revForm.amount || isNaN(amt) || amt <= 0) { setRevMsg("Please enter a valid amount greater than 0"); return; }
    setRevSaving(true); setRevMsg("");
    try {
      const d = await fetch("/api/revenue", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...revForm, amount: amt })
      }).then(r => r.json());
      if (d.success) {
        setShowRevForm(false);
        setRevForm({ sourceType: "PHARMACY", amount: "", description: "" });
        loadData();
      } else { setRevMsg(d.message || "Failed to add revenue"); }
    } catch (err: any) { setRevMsg(err?.message || "Network error — please try again"); }
    setRevSaving(false);
  };

  const toggleExpSort = (key: string) => setExpSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));
  const toggleRevSort = (key: string) => setRevSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));

  const rawPurchases = revExpData?.expenses?.items || [];
  const expensesList = rawPurchases.map((p: any) => ({
    _isPurchase: true,
    id: p.id,
    date: p.createdAt,
    category: "INVENTORY",
    title: `Purchase Order: ${p.purchaseNo}`,
    description: `Purchase Order: ${p.purchaseNo} — ${p.supplier?.name || "Supplier"}`,
    amount: p.totalAmount,
    status: p.paymentStatus,
    _raw: p
  }));

  const rawBills = revExpData?.revenue?.items || [];
  const revenueList = rawBills.map((b: any) => ({
    _type: "bill",
    id: b.id,
    date: b.paidAt || b.createdAt,
    description: b.patient?.name || "—",
    subText: b.patient?.patientId,
    amount: b.paidAmount || 0,
    source: "PHARMACY_BILLING",
    billNo: b.billNo,
    billItems: b.billItems,
    _raw: b,
  }));

  const filteredExpenses = expensesList.filter((r: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.id || "").toLowerCase().includes(q) ||
      (r.category || "").toLowerCase().includes(q) ||
      (r.title || r.description || "").toLowerCase().includes(q) ||
      String(r.amount || 0).includes(q)
    );
  }).sort((a: any, b: any) => {
    const dir = expSort.dir === "asc" ? 1 : -1;
    if (expSort.key === "date") return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
    if (expSort.key === "amount") return dir * ((a.amount || 0) - (b.amount || 0));
    if (expSort.key === "category") return dir * ((a.category || "").localeCompare(b.category || ""));
    return 0;
  });

  const filteredRevenues = revenueList.filter((r: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.description || "").toLowerCase().includes(q) ||
      (r.source || "").toLowerCase().includes(q) ||
      (r.billNo || "").toLowerCase().includes(q) ||
      String(r.amount || 0).includes(q)
    );
  }).sort((a: any, b: any) => {
    const dir = revSort.dir === "asc" ? 1 : -1;
    if (revSort.key === "date") return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
    if (revSort.key === "amount") return dir * ((a.amount || 0) - (b.amount || 0));
    if (revSort.key === "source") return dir * ((a.source || "").localeCompare(b.source || ""));
    return 0;
  });

  const buildRows = () => {
    if (tab === "expenses") {
      return filteredExpenses.map((r: any) => ({
        Date: fmtDate(r.date), Category: (r.category || "OTHER").replace(/_/g, " "),
        Description: r.title || r.description || "", Amount: r.amount,
        Type: r._isPurchase ? "Purchase" : "Expense",
      }));
    }
    return filteredRevenues.map((r: any) => ({
      Type: r._type === "bill" ? "Billing" : "Manual",
      Date: fmtDate(r.date),
      "Bill No": r.billNo || "—",
      Description: r.description || "—",
      Source: r.source || "—",
      Amount: r.amount,
    }));
  };

  const downloadBlob = (content: string, mime: string, ext: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tab}-${new Date().toISOString().split("T")[0]}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAs = (format: "csv" | "json" | "print") => {
    setShowExportMenu(false);
    const rows = buildRows();
    if (format === "csv") {
      if (rows.length === 0) return;
      const keys = Object.keys(rows[0]);
      const csv = keys.join(",") + "\n" + rows.map((r: any) => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      downloadBlob(csv, "text/csv", "csv");
    } else if (format === "json") {
      downloadBlob(JSON.stringify(rows, null, 2), "application/json", "json");
    } else {
      const keys = rows.length ? Object.keys(rows[0]) : [];
      const html = `<html><head><title>${tab} export</title><style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:12px}th{background:#f1f5f9;font-weight:700}</style></head><body><h2>${tab === "expenses" ? "Pharmacy Expenses" : "Pharmacy Revenue"}</h2><table><thead><tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows.map((r: any) => `<tr>${keys.map(k => `<td>${r[k]}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
      const w = window.open("", "_blank");
      if (w) { w.document.write(html); w.document.close(); w.print(); }
    }
  };

  const totalRevenue  = revExpData?.revenue?.total || 0;
  const totalExpenses = revExpData?.expenses?.total || 0;
  const net           = revExpData?.net || 0;
  const pendingBills  = (revExpData?.revenue?.items || []).filter((b: any) => b.status === "PENDING").length;
  const pendingExp    = revExpData?.expenses?.pendingPayouts || 0;
  const byMethod      = revExpData?.revenue?.byMethod || {};
  const chart7        = build7DayData(revExpData?.revenue?.items || [], revExpData?.expenses?.items || []);
  const chart7MaxRev  = Math.max(...chart7.map(d => d.rev), 1);
  const chart7MaxExp  = Math.max(...chart7.map(d => d.exp), 1);
  const chart7Max     = Math.max(chart7MaxRev, chart7MaxExp, 1);

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 4, animation: "fadeUp .25s ease" }}>
      <style>{`
        @keyframes finFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes finSpin{to{transform:rotate(360deg)}}
        .fin-spin{animation:finSpin .7s linear infinite}
        .fin-fade{animation:finFadeUp .25s ease}
        .fin-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px;flex-wrap:wrap}
        .fin-title{font-size:20px;font-weight:900;color:#0f172a;letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
        .fin-sub{font-size:11px;color:#94a3b8;margin-top:4px}
        .fin-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .fin-btn{display:flex;align-items:center;gap:8px;border:none;border-radius:10px;padding:9px 14px;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap}
        .fin-btn.primary{background:linear-gradient(135deg,#0E898F,#07595D);color:#fff;box-shadow:0 2px 8px rgba(14,137,143,.3)}
        .fin-btn.primary:hover{background:linear-gradient(135deg,#0A7A80,#065254)}
        .fin-btn.ghost{background:#fff;border:1.5px solid #e2e8f0;color:#475569}
        .fin-btn.ghost:hover{background:#f8fafc;border-color:#B3E0E0;color:#0E898F}
        .fin-period{display:flex;gap:4px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:3px}
        .fin-period-btn{padding:6px 12px;border-radius:8px;border:none;background:transparent;font-size:11px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s}
        .fin-period-btn.on{background:#E6F4F4;color:#0A6B70;font-weight:700}
        .fin-kpi{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px}
        @media(max-width:1200px){.fin-kpi{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:800px){.fin-kpi{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:500px){.fin-kpi{grid-template-columns:1fr}}
        .fin-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;display:flex;gap:12px;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,.04);transition:box-shadow .2s,transform .2s}
        .fin-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08);transform:translateY(-1px)}
        .fin-ic{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .fin-lbl{font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
        .fin-val{font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-.02em;margin-top:2px}
        .fin-mini{font-size:10px;color:#64748b;margin-top:2px}
        .fin-charts-row{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px}
        @media(max-width:900px){.fin-charts-row{grid-template-columns:1fr}}
        .fin-chart-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .fin-chart-title{font-size:13px;font-weight:800;color:#1e293b;margin-bottom:4px}
        .fin-chart-sub{font-size:10px;color:#94a3b8;margin-bottom:14px}
        .fin-bar-area{display:flex;align-items:flex-end;gap:6px;height:130px}
        .fin-bar-grp{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%}
        .fin-bar-tracks{flex:1;width:100%;display:flex;gap:3px;align-items:flex-end}
        .fin-bar-track{flex:1;display:flex;flex-direction:column;justify-content:flex-end;background:#f1f5f9;border-radius:4px 4px 0 0;min-height:2px;overflow:hidden}
        .fin-bar-fill-rev{background:linear-gradient(to top,#0E898F,#10b981);border-radius:4px 4px 0 0}
        .fin-bar-fill-exp{background:linear-gradient(to top,#f97316,#ef4444);border-radius:4px 4px 0 0}
        .fin-bar-lbl{font-size:9px;color:#94a3b8;font-weight:600;white-space:nowrap}
        .fin-legend{display:flex;gap:14px;margin-top:10px}
        .fin-leg-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
        .fin-leg-lbl{font-size:10px;color:#64748b;font-weight:600}
        .fin-method-list{display:flex;flex-direction:column;gap:8px}
        .fin-method-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;border:1px solid #f1f5f9;background:#fafbfc}
        .fin-method-bar-track{flex:1;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden}
        .fin-method-bar-fill{height:100%;border-radius:3px;transition:width .5s ease}
        .fin-panel{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .fin-tabs{display:flex;gap:4px;padding:10px 14px;border-bottom:1px solid #f1f5f9;background:#fff}
        .fin-tab{border:none;background:none;padding:9px 14px;border-radius:10px;font-size:12px;font-weight:700;color:#64748b;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px}
        .fin-tab.on{background:#E6F4F4;color:#0A6B70}
        .fin-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f5f9;flex-wrap:wrap}
        .fin-table-wrap{overflow:auto}
        .fin-table{width:100%;border-collapse:collapse}
        .fin-table th{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;text-align:left;padding:11px 16px;background:#fff;white-space:nowrap;border-bottom:1.5px solid #f1f5f9;cursor:pointer}
        .fin-table th:hover{color:#0E898F}
        .fin-table td{padding:11px 16px;border-bottom:1px solid #f8fafc;font-size:12px;color:#334155;white-space:nowrap;vertical-align:middle}
        .fin-table tbody tr:hover td{background:#f8fbff}
        .fin-amt{font-weight:900;color:#0f172a}
        .fin-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
        .fin-badge.ok{background:#dcfce7;color:#166534}
        .fin-badge.warn{background:#ffedd5;color:#9a3412}
        .fin-badge.blue{background:#E6F4F4;color:#0A6B70}
        .fin-empty{padding:56px 24px;text-align:center;color:#94a3b8}
        .fin-search{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:7px 12px;transition:border .15s}
        .fin-search:focus-within{border-color:#B3E0E0}
        .fin-search input{background:none;border:none;outline:none;font-size:12px;color:#334155;width:200px;font-family:inherit}
      `}</style>

      {/* ── Page Header ── */}
      <div className="fin-head">
        <div>
          <div className="fin-title">
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#0E898F,#07595D)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={20} color="#fff" />
            </div>
            Pharmacy Finance
          </div>
          <div className="fin-sub">Revenue, expenses &amp; profit overview for {PERIOD_LABELS[period].toLowerCase()}</div>
        </div>
        <div className="fin-actions">
          {/* Period Filter */}
          <div className="fin-period">
            {(["today","week","month","all"] as Period[]).map(p => (
              <button key={p} className={`fin-period-btn${period === p ? " on" : ""}`} type="button" onClick={() => setPeriod(p)}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button className="fin-btn ghost" type="button" onClick={loadData} disabled={loading}>
            <RefreshCw size={13} className={loading ? "fin-spin" : ""} /> Refresh
          </button>
          <div style={{ position: "relative" }}>
            <button className="fin-btn ghost" type="button" onClick={() => setShowExportMenu(!showExportMenu)}><Download size={13} /> Export <ChevronDown size={11} /></button>
            {showExportMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setShowExportMenu(false)} />
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 12px 40px rgba(0,0,0,.12)", zIndex: 91, minWidth: 180, overflow: "hidden" }}>
                  <button type="button" onClick={() => exportAs("csv")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize:12, fontWeight: 500, color: "#334155" }}><FileSpreadsheet size={14} color="#16a34a" /> Export as CSV</button>
                  <button type="button" onClick={() => exportAs("json")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize:12, fontWeight: 500, color: "#334155" }}><FileJson size={14} color="#0A6B70" /> Export as JSON</button>
                  <div style={{ height: 1, background: "#f1f5f9" }} />
                  <button type="button" onClick={() => exportAs("print")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize:12, fontWeight: 500, color: "#334155" }}><Printer size={14} color="#8b5cf6" /> Print / PDF</button>
                </div>
              </>
            )}
          </div>
          <button className="fin-btn primary" type="button" onClick={() => { setShowExpForm(true); setExpMsg(""); }}><Plus size={14} /> Add Expense</button>
          <button className="fin-btn primary" type="button" style={{ background: "linear-gradient(135deg,#16a34a,#14532d)" }} onClick={() => { setShowRevForm(true); setRevMsg(""); }}><Plus size={14} /> Add Revenue</button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px", color: "#94a3b8", fontSize: 13 }}>
          <Loader2 size={18} className="fin-spin" /> Loading financials…
        </div>
      )}

      {!loading && (
        <div className="fin-fade">
          {/* ── KPI Cards ── */}
          <div className="fin-kpi">
            <div className="fin-card">
              <div className="fin-ic" style={{ background: "#E6F4F4" }}><TrendingUp size={20} color="#0E898F" /></div>
              <div>
                <div className="fin-lbl">Revenue</div>
                <div className="fin-val" style={{ color: "#0A6B70" }}>{fmtINR(totalRevenue)}</div>
                <div className="fin-mini">{(revExpData?.revenue?.items || []).length} transactions</div>
              </div>
            </div>
            <div className="fin-card">
              <div className="fin-ic" style={{ background: "#fff7ed" }}><TrendingDown size={20} color="#ea580c" /></div>
              <div>
                <div className="fin-lbl">Expenses</div>
                <div className="fin-val" style={{ color: "#ea580c" }}>{fmtINR(totalExpenses)}</div>
                <div className="fin-mini">{(revExpData?.expenses?.items || []).length} purchase orders</div>
              </div>
            </div>
            <div className="fin-card">
              <div className="fin-ic" style={{ background: net >= 0 ? "#f0fdf4" : "#fff5f5" }}>
                <IndianRupee size={20} color={net >= 0 ? "#16a34a" : "#dc2626"} />
              </div>
              <div>
                <div className="fin-lbl">Net P&amp;L</div>
                <div className="fin-val" style={{ color: net >= 0 ? "#16a34a" : "#dc2626" }}>{fmtINR(Math.abs(net))}</div>
                <div className="fin-mini">{net >= 0 ? "✓ Profit" : "▼ Loss"}</div>
              </div>
            </div>
            <div className="fin-card">
              <div className="fin-ic" style={{ background: "#fdf4ff" }}><CreditCard size={20} color="#9333ea" /></div>
              <div>
                <div className="fin-lbl">Pending Bills</div>
                <div className="fin-val">{pendingBills}</div>
                <div className="fin-mini">Awaiting collection</div>
              </div>
            </div>
            <div className="fin-card">
              <div className="fin-ic" style={{ background: "#fffbeb" }}><Package size={20} color="#d97706" /></div>
              <div>
                <div className="fin-lbl">Pending Payables</div>
                <div className="fin-val" style={{ color: "#d97706" }}>{fmtINR(pendingExp)}</div>
                <div className="fin-mini">Unpaid purchase orders</div>
              </div>
            </div>
          </div>

          {/* ── Charts Row ── */}
          <div className="fin-charts-row">
            {/* Revenue vs Expense Bar Chart */}
            <div className="fin-chart-card">
              <div className="fin-chart-title">Revenue vs Expenses — Last 7 Days</div>
              <div className="fin-chart-sub">Daily comparison of income and outgo</div>
              <div className="fin-bar-area">
                {chart7.map((d, i) => (
                  <div key={i} className="fin-bar-grp">
                    <div className="fin-bar-tracks" style={{ height: "100%" }}>
                      <div className="fin-bar-track" style={{ height: "100%" }}>
                        <div className="fin-bar-fill-rev" style={{ height: `${Math.max((d.rev / chart7Max) * 100, d.rev > 0 ? 4 : 0)}%`, width: "100%", minHeight: d.rev > 0 ? 4 : 0 }} />
                      </div>
                      <div className="fin-bar-track" style={{ height: "100%" }}>
                        <div className="fin-bar-fill-exp" style={{ height: `${Math.max((d.exp / chart7Max) * 100, d.exp > 0 ? 4 : 0)}%`, width: "100%", minHeight: d.exp > 0 ? 4 : 0 }} />
                      </div>
                    </div>
                    <div className="fin-bar-lbl">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="fin-legend">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="fin-leg-dot" style={{ background: "#0E898F" }} />
                  <span className="fin-leg-lbl">Revenue</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="fin-leg-dot" style={{ background: "#f97316" }} />
                  <span className="fin-leg-lbl">Expenses</span>
                </div>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="fin-chart-card">
              <div className="fin-chart-title">Revenue by Payment Method</div>
              <div className="fin-chart-sub">{PERIOD_LABELS[period]}</div>
              {Object.keys(byMethod).length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No payment data</div>
              ) : (
                <div className="fin-method-list">
                  {Object.entries(byMethod)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([method, amt]) => {
                      const meta = METHOD_META[method] || METHOD_META.OTHER;
                      const pct = totalRevenue > 0 ? ((amt as number) / totalRevenue) * 100 : 0;
                      return (
                        <div key={method} className="fin-method-row">
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <meta.Icon size={14} color={meta.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}>{meta.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: meta.color }}>{fmtINR(amt as number)}</span>
                            </div>
                            <div className="fin-method-bar-track">
                              <div className="fin-method-bar-fill" style={{ width: `${pct}%`, background: meta.color }} />
                            </div>
                          </div>
                          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, minWidth: 32, textAlign: "right" }}>{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* ── Tabbed Table ── */}
          <div className="fin-panel">
            <div className="fin-tabs">
              <button type="button" className={`fin-tab${tab === "overview" ? " on" : ""}`} onClick={() => setTab("overview")}>
                <Activity size={13} /> Overview
              </button>
              <button type="button" className={`fin-tab${tab === "revenue" ? " on" : ""}`} onClick={() => setTab("revenue")}>
                <TrendingUp size={13} /> Revenue ({(revExpData?.revenue?.items || []).length})
              </button>
              <button type="button" className={`fin-tab${tab === "expenses" ? " on" : ""}`} onClick={() => setTab("expenses")}>
                <TrendingDown size={13} /> Expenses ({(revExpData?.expenses?.items || []).length})
              </button>
            </div>

            <div className="fin-toolbar">
              <div className="fin-search">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}><X size={11} color="#94a3b8" /></button>}
              </div>
              {tab === "expenses" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Sort:</span>
                  {[{ k: "date", l: "Date" }, { k: "amount", l: "Amount" }, { k: "category", l: "Category" }].map(s => (
                    <button key={s.k} type="button" onClick={() => toggleExpSort(s.k)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, border: `1px solid ${expSort.key === s.k ? "#B3E0E0" : "#e2e8f0"}`, background: expSort.key === s.k ? "#E6F4F4" : "#f8fafc", color: expSort.key === s.k ? "#0A6B70" : "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                      {s.l} <ArrowUpDown size={9} />
                    </button>
                  ))}
                </div>
              )}
              {tab === "revenue" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Sort:</span>
                  {[{ k: "date", l: "Date" }, { k: "amount", l: "Amount" }, { k: "source", l: "Source" }].map(s => (
                    <button key={s.k} type="button" onClick={() => toggleRevSort(s.k)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, border: `1px solid ${revSort.key === s.k ? "#B3E0E0" : "#e2e8f0"}`, background: revSort.key === s.k ? "#E6F4F4" : "#f8fafc", color: revSort.key === s.k ? "#0A6B70" : "#64748b", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                      {s.l} <ArrowUpDown size={9} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="fin-table-wrap">

              {/* Overview tab — summary breakdown */}
              {tab === "overview" && (
                <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {/* Revenue summary */}
                  <div style={{ background: "#f8fbff", borderRadius: 14, padding: 18, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#0A6B70", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      <TrendingUp size={14} /> Revenue Summary
                    </div>
                    {[
                      { label: "Total Collected", val: fmtINR(totalRevenue), color: "#0A6B70" },
                      { label: "Pending Bills", val: String(pendingBills), color: "#9333ea" },
                      { label: "Transactions", val: String((revExpData?.revenue?.items || []).length), color: "#334155" },
                    ].map((r, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 2 ? "1px solid #f1f5f9" : "none" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: r.color }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                  {/* Expense summary */}
                  <div style={{ background: "#fffbf5", borderRadius: 14, padding: 18, border: "1px solid #fed7aa" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#ea580c", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      <TrendingDown size={14} /> Expense Summary
                    </div>
                    {[
                      { label: "Total Spent", val: fmtINR(totalExpenses), color: "#ea580c" },
                      { label: "Pending Payables", val: fmtINR(pendingExp), color: "#d97706" },
                      { label: "Purchase Orders", val: String((revExpData?.expenses?.items || []).length), color: "#334155" },
                    ].map((r, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 2 ? "1px solid #fef3c7" : "none" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: r.color }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                  {/* Net P&L */}
                  <div style={{ gridColumn: "1 / -1", padding: "16px 20px", borderRadius: 14, background: net >= 0 ? "#f0fdf4" : "#fff5f5", border: `1px solid ${net >= 0 ? "#bbf7d0" : "#fecaca"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: net >= 0 ? "#16a34a" : "#dc2626", textTransform: "uppercase", letterSpacing: ".05em" }}>Net {net >= 0 ? "Profit" : "Loss"} — {PERIOD_LABELS[period]}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: net >= 0 ? "#16a34a" : "#dc2626", marginTop: 2 }}>{fmtINR(Math.abs(net))}</div>
                    </div>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: net >= 0 ? "#dcfce7" : "#fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {net >= 0 ? <CheckCircle2 size={26} color="#16a34a" /> : <AlertCircle size={26} color="#dc2626" />}
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue table */}
              {tab === "revenue" && (
                filteredRevenues.length === 0 ? (
                  <div className="fin-empty">
                    <TrendingUp size={32} color="#e2e8f0" style={{ marginBottom: 10 }} />
                    <div style={{ fontWeight: 700, color: "#334155" }}>No revenue entries</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>for {PERIOD_LABELS[period].toLowerCase()}</div>
                  </div>
                ) : (
                  <table className="fin-table">
                    <thead>
                      <tr>
                        <th onClick={() => toggleRevSort("date")} style={{ cursor: "pointer" }}>Date <ArrowUpDown size={9} style={{ display: "inline", verticalAlign: "middle" }} /></th>
                        <th>Bill No</th>
                        <th>Patient</th>
                        <th>Source</th>
                        <th onClick={() => toggleRevSort("amount")} style={{ cursor: "pointer" }}>Amount <ArrowUpDown size={9} style={{ display: "inline", verticalAlign: "middle" }} /></th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRevenues.map((r: any) => (
                        <tr key={r.id}>
                          <td>
                            <div style={{ color: "#334155", fontSize: 12 }}>{fmtShort(r.date)}</div>
                          </td>
                          <td><span style={{ fontWeight: 700, color: "#0A6B70", fontSize: 11 }}>{r.billNo || "—"}</span></td>
                          <td>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{r.description || "—"}</div>
                            {r.subText && <div style={{ fontSize: 10, color: "#94a3b8" }}>{r.subText}</div>}
                          </td>
                          <td><span className="fin-badge blue">{(r.source || "PHARMACY").replace(/_/g," ")}</span></td>
                          <td><span style={{ fontWeight: 900, color: "#16a34a", fontSize: 13 }}>{fmtINR(r.amount)}</span></td>
                          <td>
                            <button type="button" onClick={() => setViewBill(r._raw)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Eye size={13} color="#0E898F" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {/* Expenses table */}
              {tab === "expenses" && (
                filteredExpenses.length === 0 ? (
                  <div className="fin-empty">
                    <Package size={32} color="#e2e8f0" style={{ marginBottom: 10 }} />
                    <div style={{ fontWeight: 700, color: "#334155" }}>No expense entries</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>for {PERIOD_LABELS[period].toLowerCase()}</div>
                  </div>
                ) : (
                  <table className="fin-table">
                    <thead>
                      <tr>
                        <th onClick={() => toggleExpSort("date")} style={{ cursor: "pointer" }}>Date <ArrowUpDown size={9} style={{ display: "inline", verticalAlign: "middle" }} /></th>
                        <th onClick={() => toggleExpSort("category")} style={{ cursor: "pointer" }}>Category <ArrowUpDown size={9} style={{ display: "inline", verticalAlign: "middle" }} /></th>
                        <th>Description</th>
                        <th>Type</th>
                        <th onClick={() => toggleExpSort("amount")} style={{ cursor: "pointer" }}>Amount <ArrowUpDown size={9} style={{ display: "inline", verticalAlign: "middle" }} /></th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((r: any) => (
                        <tr key={r.id}>
                          <td style={{ color: "#64748b", fontSize: 11 }}>{fmtShort(r.date)}</td>
                          <td><span className="fin-badge blue">{(r.category || "OTHER").replace(/_/g," ")}</span></td>
                          <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{r.title || r.description || "—"}</td>
                          <td><span className={`fin-badge ${r._isPurchase ? "warn" : "ok"}`}>{r._isPurchase ? "Purchase" : "Expense"}</span></td>
                          <td><span style={{ fontWeight: 900, color: "#ea580c", fontSize: 13 }}>{fmtINR(r.amount)}</span></td>
                          <td>
                            <button type="button" onClick={() => setViewExpense(r)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Eye size={13} color="#0E898F" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowExpForm(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 20, width: "95%", maxWidth: 520 }}>
            <div style={{ background: "#E6F4F4", borderBottom: "1px solid #B3E0E0", padding: "20px 24px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", color: "#0A6B70", fontWeight: 700, marginBottom: 2 }}>New Entry</div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>Add Pharmacy Expense</div>
              </div>
              <button type="button" onClick={() => setShowExpForm(false)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(10,107,112,.08)", border: "none", cursor: "pointer" }}><X size={16} color="#0A6B70" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 5, display: "block" }}>Title *</label>
                <input value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} placeholder="e.g. Stock Delivery Charge" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 5, display: "block" }}>Category</label>
                  <select value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", background: "#fff" }}>
                    {["INVENTORY","MAINTENANCE","UTILITY","OTHER"].map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 5, display: "block" }}>Amount (₹) *</label>
                  <input type="number" min="1" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} placeholder="0" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 5, display: "block" }}>Date *</label>
                <input type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
              </div>
              {expMsg && <div style={{ fontSize:12, color: "#fff", fontWeight: 700, background: "#ef4444", padding: "10px 14px", borderRadius: 10, textAlign: "center" }}>{expMsg}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => setShowExpForm(false)} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={saveExpense} disabled={expSaving} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#0A6B70", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", opacity: expSaving ? .6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {expSaving && <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />}{expSaving ? "Saving…" : "Add Expense"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Revenue Modal */}
      {showRevForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowRevForm(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 20, width: "95%", maxWidth: 480 }}>
            <div style={{ background: "#E6F4F4", borderBottom: "1px solid #B3E0E0", padding: "20px 24px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", color: "#0A6B70", fontWeight: 700, marginBottom: 2 }}>New Entry</div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>Add Pharmacy Revenue</div>
              </div>
              <button type="button" onClick={() => setShowRevForm(false)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(10,107,112,.08)", border: "none", cursor: "pointer" }}><X size={16} color="#0A6B70" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 5, display: "block" }}>Source Type</label>
                  <select disabled value="PHARMACY" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", background: "#f8fafc" }}>
                    <option value="PHARMACY">Pharmacy</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 5, display: "block" }}>Amount (₹) *</label>
                  <input type="number" min="1" value={revForm.amount} onChange={e => setRevForm({ ...revForm, amount: e.target.value })} placeholder="0" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 5, display: "block" }}>Description</label>
                <textarea value={revForm.description} onChange={e => setRevForm({ ...revForm, description: e.target.value })} placeholder="e.g. Counter sale" rows={2} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", resize: "vertical" }} />
              </div>
              {revMsg && <div style={{ fontSize:12, color: "#fff", fontWeight: 700, background: "#ef4444", padding: "10px 14px", borderRadius: 10, textAlign: "center" }}>{revMsg}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => setShowRevForm(false)} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={saveRevenue} disabled={revSaving} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#0A6B70", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", opacity: revSaving ? .6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {revSaving && <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />}{revSaving ? "Saving…" : "Add Revenue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill View Modal */}
      {viewBill && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} onClick={() => setViewBill(null)} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 20, width: "95%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ background: "#E6F4F4", borderBottom: "1px solid #B3E0E0", padding: "22px 24px 18px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", color: "#0A6B70", fontWeight: 700, marginBottom: 4 }}>Transaction Details</div>
                <div style={{ fontSize:20, fontWeight: 800, color: "#1e293b" }}>{viewBill.billNo}</div>
              </div>
              <button type="button" onClick={() => setViewBill(null)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(10,107,112,.08)", border: "none", cursor: "pointer" }}><X size={16} color="#0A6B70" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center" }}><UserIcon size={18} color="#0A6B70" /></div>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize:13 }}>{viewBill.patient?.name || "Counter Patient"}</div>
                  <div style={{ fontSize:10, color: "#94a3b8" }}>{viewBill.patient?.patientId || "No ID"}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize:10, color: "#16a34a", fontWeight: 700, textTransform: "uppercase" }}>Total Paid</div>
                  <div style={{ fontSize:17, fontWeight: 800, color: "#166534" }}>{fmtINR(viewBill.paidAmount)}</div>
                </div>
                <div style={{ background: "#fefce8", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize:10, color: "#a16207", fontWeight: 700, textTransform: "uppercase" }}>Date</div>
                  <div style={{ fontSize:12, fontWeight: 700, color: "#854d0e" }}>{fmtDate(viewBill.createdAt)}</div>
                </div>
              </div>
              {viewBill.billItems?.length > 0 && (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize:11 }}>
                    <thead><tr style={{ background: "#f8fafc" }}><th style={{ padding: "8px 12px", textAlign: "left", color: "#94a3b8" }}>Item</th><th style={{ padding: "8px 12px", textAlign: "right", color: "#94a3b8" }}>Amount</th></tr></thead>
                    <tbody>
                      {viewBill.billItems.map((item: any, i: number) => (
                        <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 12px" }}>{item.name || item.description || "Pharmacy Item"}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>{fmtINR(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Expense View Modal */}
      {viewExpense && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setViewExpense(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", background: "#fff", borderRadius: 20, width: "95%", maxWidth: 480 }}>
            <div style={{ background: "#E6F4F4", borderBottom: "1px solid #B3E0E0", padding: "20px 24px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", color: "#0A6B70", fontWeight: 700, marginBottom: 2 }}>Expense Details</div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>{viewExpense.title}</div>
              </div>
              <button type="button" onClick={() => setViewExpense(null)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(10,107,112,.08)", border: "none", cursor: "pointer" }}><X size={16} color="#0A6B70" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Date</div>
                  <div style={{ fontSize:13, fontWeight: 600, color: "#1e293b" }}>{fmtDate(viewExpense.date)}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Amount</div>
                  <div style={{ fontSize:17, fontWeight: 800, color: "#0A6B70" }}>{fmtINR(viewExpense.amount)}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Type</div>
                <span className={`fin-badge ${viewExpense._isPurchase ? "warn" : "ok"}`}>{viewExpense._isPurchase ? "Purchase Order" : "Expense"}</span>
              </div>
              {viewExpense.description && (
                <div>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Description</div>
                  <div style={{ fontSize:12, color: "#475569", lineHeight: 1.5 }}>{viewExpense.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
