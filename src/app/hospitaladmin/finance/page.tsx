"use client";
import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Plus, Download, Loader2, IndianRupee, CreditCard,
  RefreshCw, ShoppingCart, Eye, X, FileText, User as UserIcon, Receipt,
  Trash2, ArrowUpDown, ChevronDown, CheckSquare, Square, MinusSquare,
  FileSpreadsheet, Printer, FileJson, AlertTriangle, Pencil, Building2, Clock
} from "lucide-react";

type ApiResponse<T> = { success: boolean; data?: T; message?: string };
type SessionUser = { name?: string | null } | null;

const api = async <T,>(url: string, method: string = "GET", body?: unknown): Promise<T> => {
  const opts: RequestInit = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
  const r = await fetch(url, opts);
  return (await r.json()) as T;
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
const fmtINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

type FinanceTab = "expenses" | "revenue";

export default function HospitalAdminFinancePage() {
  const [user, setUser] = useState<SessionUser>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FinanceTab>("expenses");

  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expLoading, setExpLoading] = useState(false);

  const [allRevenue, setAllRevenue] = useState<any[]>([]);
  const [revLoading, setRevLoading] = useState(false);
  const [viewBill, setViewBill] = useState<any>(null);
  const [viewExpense, setViewExpense] = useState<any>(null);
  const [viewManualRev, setViewManualRev] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "expense" | "revenue" | "bulk-expense" | "bulk-revenue"; id?: string; count?: number } | null>(null);

  // Add Expense form
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState({ title: "", category: "OTHER", amount: "", date: new Date().toISOString().split("T")[0], description: "", department: "Hospital Administration" });
  const [expSaving, setExpSaving] = useState(false);
  const [expMsg, setExpMsg] = useState("");

  // Add Revenue form
  const [showRevForm, setShowRevForm] = useState(false);
  const [revForm, setRevForm] = useState({ sourceType: "OTHER", amount: "", description: "", department: "Hospital Administration" });
  const [revSaving, setRevSaving] = useState(false);
  const [revMsg, setRevMsg] = useState("");

  // Edit Expense
  const [editExpense, setEditExpense] = useState<any>(null);
  const [editExpForm, setEditExpForm] = useState({ title: "", category: "OTHER", amount: "", date: "", description: "", department: "Hospital Administration" });
  const [editExpSaving, setEditExpSaving] = useState(false);

  // Edit Revenue
  const [editRevenue, setEditRevenue] = useState<any>(null);
  const [editRevForm, setEditRevForm] = useState({ sourceType: "OTHER", amount: "", description: "", department: "Hospital Administration" });
  const [editRevSaving, setEditRevSaving] = useState(false);

  // Sorting
  const [expSort, setExpSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const [revSort, setRevSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });

  // Multi-select
  const [selectedExp, setSelectedExp] = useState<Set<string>>(new Set());
  const [selectedRev, setSelectedRev] = useState<Set<string>>(new Set());

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    api<ApiResponse<SessionUser>>("/api/auth/me").then(d => { if (d.success) setUser(d.data ?? null); });
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const d = await api<ApiResponse<any>>("/api/finance/dashboard");
    if (d.success) setStats(d.data);
    setStatsLoading(false);
  }, []);

  const loadExpenses = useCallback(async () => {
    setExpLoading(true);
    const [expRes, purchaseRes] = await Promise.all([
      api<ApiResponse<any>>("/api/expense?limit=100"),
      api<ApiResponse<any>>("/api/inventory/purchase"),
    ]);
    if (expRes.success) setExpenses(expRes.data?.expenses || []);
    if (purchaseRes.success) setPurchases(Array.isArray(purchaseRes.data) ? purchaseRes.data : []);
    setExpLoading(false);
  }, []);

  const loadRevenue = useCallback(async () => {
    setRevLoading(true);
    const [billsRes, manualRes] = await Promise.all([
      api<ApiResponse<any>>("/api/billing?status=PAID&limit=100"),
      api<ApiResponse<any>>("/api/revenue?limit=100"),
    ]);
    const bills = (billsRes.success ? billsRes.data?.bills || [] : []).map((b: any) => ({
      _type: "bill",
      id: b.id,
      date: b.paidAt || b.createdAt,
      description: b.patient?.name || "—",
      subText: b.patient?.patientId,
      amount: b.total,
      source: b.payments?.[0]?.method || "PAID",
      billNo: b.billNo,
      billItems: b.billItems,
      _raw: b,
    }));
    const manual = (manualRes.success ? manualRes.data?.revenues || [] : []).map((r: any) => ({
      _type: "manual",
      id: r.id,
      date: r.createdAt,
      description: r.description || "—",
      subText: null,
      amount: r.amount,
      source: (r.sourceType || "OTHER").replace(/_/g, " "),
      billNo: null,
      _raw: r,
    }));
    const merged = [...bills, ...manual].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllRevenue(merged);
    setRevLoading(false);
  }, []);

  const saveExpense = async () => {
    const expAmt = parseFloat(expForm.amount);
    if (!expForm.title.trim()) { setExpMsg("Please enter a title"); return; }
    if (!expForm.amount || isNaN(expAmt) || expAmt <= 0) { setExpMsg("Please enter a valid amount greater than 0"); return; }
    if (!expForm.date) { setExpMsg("Please select a date"); return; }
    setExpSaving(true); setExpMsg("");
    try {
      const d = await api<ApiResponse<any>>("/api/expense", "POST", { ...expForm, amount: expAmt, addedByName: (user as any)?.name || "Admin" });
      if (d.success) {
        setShowExpForm(false);
        setExpForm({ title: "", category: "OTHER", amount: "", date: new Date().toISOString().split("T")[0], description: "", department: "Hospital Administration" });
        loadExpenses(); loadStats();
      } else { setExpMsg(d.message || "Failed to add expense"); }
    } catch (err: any) { setExpMsg(err?.message || "Network error — please try again"); }
    setExpSaving(false);
  };

  const saveEditExpense = async () => {
    const expAmt = parseFloat(editExpForm.amount);
    if (!editExpForm.title.trim() || isNaN(expAmt) || expAmt <= 0) return;
    setEditExpSaving(true);
    try {
      const d = await api<ApiResponse<any>>(`/api/expense/${editExpense.id}`, "PUT", { ...editExpForm, amount: expAmt });
      if (d.success) { setEditExpense(null); loadExpenses(); loadStats(); }
    } catch {}
    setEditExpSaving(false);
  };

  const openEditExpense = (r: any) => {
    setEditExpForm({
      title: r.title || "",
      category: r.category || "OTHER",
      amount: String(r.amount || ""),
      date: r.date ? new Date(r.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      description: r.description || "",
      department: r.department || "Hospital Administration",
    });
    setEditExpense(r);
  };

  const saveRevenue = async () => {
    const amt = parseFloat(revForm.amount);
    if (!revForm.amount || isNaN(amt) || amt <= 0) { setRevMsg("Please enter a valid amount greater than 0"); return; }
    setRevSaving(true); setRevMsg("");
    try {
      const d = await api<ApiResponse<any>>("/api/revenue", "POST", { ...revForm, amount: amt, addedBy: (user as any)?.name || "Admin" });
      if (d.success) {
        setShowRevForm(false);
        setRevForm({ sourceType: "OTHER", amount: "", description: "", department: "Hospital Administration" });
        loadRevenue();
        loadStats();
      } else { setRevMsg(d.message || "Failed to add revenue"); }
    } catch (err: any) { setRevMsg(err?.message || "Network error — please try again"); }
    setRevSaving(false);
  };

  const saveEditRevenue = async () => {
    const amt = parseFloat(editRevForm.amount);
    if (isNaN(amt) || amt <= 0) return;
    setEditRevSaving(true);
    try {
      const d = await api<ApiResponse<any>>(`/api/revenue/${editRevenue.id}`, "PUT", { ...editRevForm, amount: amt });
      if (d.success) { setEditRevenue(null); loadRevenue(); loadStats(); }
    } catch {}
    setEditRevSaving(false);
  };

  const openEditRevenue = (r: any) => {
    setEditRevForm({
      sourceType: r._raw?.sourceType || "OTHER",
      amount: String(r.amount || ""),
      description: r._raw?.description || r.description || "",
      department: r._raw?.department || "Hospital Administration",
    });
    setEditRevenue(r);
  };

  const deleteExpense = async (id: string) => {
    setDeleteConfirm({ type: "expense", id });
  };

  const confirmDeleteExpense = async (id: string) => {
    await api<ApiResponse<any>>(`/api/expense/${id}`, "DELETE");
    setDeleteConfirm(null);
    loadExpenses(); loadStats();
  };

  const deleteRevenue = async (id: string) => {
    setDeleteConfirm({ type: "revenue", id });
  };

  const confirmDeleteRevenue = async (id: string) => {
    await api<ApiResponse<any>>(`/api/revenue/${id}`, "DELETE");
    setDeleteConfirm(null);
    loadRevenue(); loadStats();
  };

  const bulkDeleteRevenues = async () => {
    if (selectedRev.size === 0) return;
    const deletable = [...selectedRev].filter(id => allRevenue.find(r => r.id === id)?._type === "manual");
    if (deletable.length === 0) { alert("Only manually-added revenue entries can be deleted. Billing revenue is managed from the Billing page."); return; }
    setDeleteConfirm({ type: "bulk-revenue", count: deletable.length });
  };

  const confirmBulkDeleteRevenues = async () => {
    const deletable = [...selectedRev].filter(id => allRevenue.find(r => r.id === id)?._type === "manual");
    await Promise.all(deletable.map(id => api<ApiResponse<any>>(`/api/revenue/${id}`, "DELETE")));
    setSelectedRev(new Set());
    setDeleteConfirm(null);
    await loadRevenue();
    await loadStats();
  };

  const bulkDeleteExpenses = async () => {
    if (selectedExp.size === 0) return;
    const deletable = [...selectedExp].filter(id => {
      const row = filteredExpenses.find((r: any) => r.id === id);
      return row && !(row as any)._isPurchase;
    });
    setDeleteConfirm({ type: "bulk-expense", count: deletable.length });
  };

  const confirmBulkDeleteExpenses = async () => {
    const deletable = [...selectedExp].filter(id => {
      const row = filteredExpenses.find((r: any) => r.id === id);
      return row && !(row as any)._isPurchase;
    });
    await Promise.all(deletable.map(id => api<ApiResponse<any>>(`/api/expense/${id}`, "DELETE")));
    setSelectedExp(new Set());
    setDeleteConfirm(null);
    loadExpenses(); loadStats();
  };

  const toggleExpSort = (key: string) => setExpSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));
  const toggleRevSort = (key: string) => setRevSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));

  const toggleExpSelect = (id: string) => setSelectedExp(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleRevSelect = (id: string) => setSelectedRev(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const buildRows = () => {
    if (tab === "expenses") {
      return filteredExpenses.map((r: any) => ({
        Date: fmtDate(r.date), Category: (r.category || "OTHER").replace(/_/g, " "),
        Description: r.title || r.description || "", Amount: r.amount,
        Type: (r as any)._isPurchase ? "Purchase" : "Expense",
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
      const csv = keys.join(",") + "\n" + rows.map(r => keys.map(k => `"${String((r as any)[k] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      downloadBlob(csv, "text/csv", "csv");
    } else if (format === "json") {
      downloadBlob(JSON.stringify(rows, null, 2), "application/json", "json");
    } else {
      const keys = rows.length ? Object.keys(rows[0]) : [];
      const html = `<html><head><title>${tab} export</title><style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:12px}th{background:#f1f5f9;font-weight:700}</style></head><body><h2>${tab === "expenses" ? "Expenses" : "Revenue (Paid Bills)"}</h2><table><thead><tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${keys.map(k => `<td>${(r as any)[k]}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
      const w = window.open("", "_blank");
      if (w) { w.document.write(html); w.document.close(); w.print(); }
    }
  };

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === "expenses") loadExpenses(); }, [tab, loadExpenses]);
  useEffect(() => { if (tab === "revenue") loadRevenue(); }, [tab, loadRevenue]);


  const totalRevenue = stats?.revenue?.month || 0;
  const totalExpenses = stats?.expenses?.month || 0;
  const net = totalRevenue - totalExpenses;
  const pendingBills = stats?.bills?.pending || 0;

  const filteredExpenses = [...expenses, ...purchases.map((p: any) => ({
    _isPurchase: true,
    id: p.id,
    date: p.createdAt,
    category: "MEDICINE",
    title: `Purchase Order: ${p.purchaseNo}`,
    description: `Purchase Order: ${p.purchaseNo} — ${p.supplier?.name || "Supplier"}`,
    amount: p.totalAmount,
    status: "Paid",
  }))].filter(r => {
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

  const filteredRevenues = allRevenue.filter((r: any) => {
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        @keyframes spin{to{transform:rotate(360deg)}}
        input,select,button{font-family:'Inter',sans-serif}

        .fin-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px}
        .fin-title{font-size:19px;font-weight:900;color:#0f172a;letter-spacing:-.02em}
        .fin-sub{font-size:11px;color:#94a3b8;margin-top:4px}
        .fin-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .fin-btn{display:flex;align-items:center;gap:8px;border:none;border-radius:12px;padding:10px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s}
        .fin-btn.primary{background:#0A6B70;color:#fff;border:1.5px solid #0A6B70}
        .fin-btn.primary:hover{background:#0E898F}
        .fin-btn.ghost{background:#fff;border:1px solid #e2e8f0;color:#334155}
        .fin-btn.ghost:hover{background:#f8fafc}

        .fin-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
        @media(max-width:1100px){.fin-stats{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:680px){.fin-stats{grid-template-columns:1fr}}
        .fin-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px 14px;display:flex;gap:12px;align-items:center}
        .fin-ic{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .fin-lbl{font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
        .fin-val{font-size:17px;font-weight:900;color:#0f172a;letter-spacing:-.02em;margin-top:2px}
        .fin-mini{font-size:10px;color:#64748b;margin-top:2px}

        .fin-panel{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
        .fin-tabs{display:flex;gap:6px;padding:10px;border-bottom:1px solid #f1f5f9;background:#fbfdff}
        .fin-tab{border:none;background:none;padding:9px 12px;border-radius:12px;font-size:12px;font-weight:800;color:#64748b;cursor:pointer;transition:all .15s}
        .fin-tab.on{background:#E6F4F4;color:#0A6B70}
        .fin-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #f1f5f9}
        .fin-hint{font-size:11px;color:#94a3b8}

        .fin-table-wrap{overflow:auto}
        .fin-table{width:100%;border-collapse:separate;border-spacing:0}
        .fin-table th{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;text-align:left;padding:12px 16px;background:#fff;white-space:nowrap;border-bottom:1px solid #f1f5f9}
        .fin-table td{padding:12px 16px;border-bottom:1px solid #f8fafc;font-size:12px;color:#334155;white-space:nowrap}
        .fin-id{font-size:10px;color:#94a3b8;font-weight:700}
        .fin-amt{font-weight:900;color:#0f172a}
        .fin-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;font-size:10px;font-weight:800}
        .fin-badge.ok{background:#dcfce7;color:#166534}
        .fin-badge.warn{background:#ffedd5;color:#9a3412}
      `}</style>

          <div className="hd-center">
            <div className="fin-head">
              <div>
                <div className="fin-title">Finance</div>
                <div className="fin-sub">Manage hospital expenses and revenue</div>
              </div>
              <div className="fin-actions">
                <div style={{ position: "relative" }}>
                  <button className="fin-btn ghost" type="button" onClick={() => setShowExportMenu(!showExportMenu)}><Download size={15} /> Export <ChevronDown size={12} /></button>
                  {showExportMenu && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setShowExportMenu(false)} />
                      <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 12px 40px rgba(0,0,0,.12)", zIndex: 91, minWidth: 180, overflow: "hidden" }}>
                        <button type="button" onClick={() => exportAs("csv")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize:12, fontWeight: 500, color: "#334155", transition: "background .1s" }} onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          <FileSpreadsheet size={15} color="#16a34a" /> Export as CSV
                        </button>
                        <button type="button" onClick={() => exportAs("json")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize:12, fontWeight: 500, color: "#334155", transition: "background .1s" }} onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          <FileJson size={15} color="#0A6B70" /> Export as JSON
                        </button>
                        <div style={{ height: 1, background: "#f1f5f9" }} />
                        <button type="button" onClick={() => exportAs("print")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", background: "none", cursor: "pointer", fontSize:12, fontWeight: 500, color: "#334155", transition: "background .1s" }} onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          <Printer size={15} color="#8b5cf6" /> Print / PDF
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button className="fin-btn primary" type="button" onClick={() => { tab === "expenses" ? (setShowExpForm(true), setExpMsg("")) : (setShowRevForm(true), setRevMsg("")); }}><Plus size={16} /> {tab === "expenses" ? "Add Expense" : "Add Revenue"}</button>
              </div>
            </div>

            {/* Stats Cards */}
            {statsLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 0", color: "#94a3b8", fontSize:12 }}>
                <Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> Loading financials…
              </div>
            ) : (
              <div className="fin-stats">
                <div className="fin-card">
                  <div className="fin-ic" style={{ background: "#E6F4F4", color: "#0A6B70" }}><TrendingUp size={18} /></div>
                  <div>
                    <div className="fin-lbl">Total Revenue</div>
                    <div className="fin-val">{fmtINR(totalRevenue)}</div>
                    <div className="fin-mini">This month · billing + manual</div>
                  </div>
                </div>
                <div className="fin-card">
                  <div className="fin-ic" style={{ background: "#fff7ed", color: "#c2410c" }}><TrendingDown size={18} /></div>
                  <div>
                    <div className="fin-lbl">Total Expenses</div>
                    <div className="fin-val">{fmtINR(totalExpenses)}</div>
                    <div className="fin-mini">Operational + inventory</div>
                  </div>
                </div>
                <div className="fin-card">
                  <div className="fin-ic" style={{ background: net >= 0 ? "#f0fdf4" : "#fff5f5", color: net >= 0 ? "#16a34a" : "#dc2626" }}><IndianRupee size={18} /></div>
                  <div>
                    <div className="fin-lbl">Net Profit / Loss</div>
                    <div className="fin-val" style={{ color: net >= 0 ? "#16a34a" : "#dc2626" }}>{fmtINR(net)}</div>
                    <div className="fin-mini">Revenue − expenses</div>
                  </div>
                </div>
                <div className="fin-card">
                  <div className="fin-ic" style={{ background: "#fdf4ff", color: "#a855f7" }}><CreditCard size={18} /></div>
                  <div>
                    <div className="fin-lbl">Pending Bills</div>
                    <div className="fin-val">{pendingBills}</div>
                    <div className="fin-mini">Awaiting payment</div>
                  </div>
                </div>
              </div>
            )}

            {/* Expense Breakdown sub-cards */}
            {!statsLoading && stats && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TrendingDown size={15} color="#0A6B70" />
                  </div>
                  <div>
                    <div style={{ fontSize:10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Operational Expenses</div>
                    <div style={{ fontSize:15, fontWeight: 800, color: "#0f172a" }}>{fmtINR(stats.expenses?.breakdown?.fromExpenseTable || 0)}</div>
                  </div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShoppingCart size={15} color="#b45309" />
                  </div>
                  <div>
                    <div style={{ fontSize:10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Inventory Purchases</div>
                    <div style={{ fontSize:15, fontWeight: 800, color: "#0f172a" }}>{fmtINR(stats.expenses?.breakdown?.fromInventoryPurchases || 0)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="fin-panel">
              <div className="fin-tabs">
                <button type="button" className={`fin-tab${tab === "expenses" ? " on" : ""}`} onClick={() => setTab("expenses")}>Expenses</button>
                <button type="button" className={`fin-tab${tab === "revenue" ? " on" : ""}`} onClick={() => setTab("revenue")}>Revenue</button>
              </div>
              <div className="fin-toolbar">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 12px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input
                      type="text"
                      placeholder={tab === "expenses" ? "Search expenses..." : "Search revenue..."}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ border: "none", background: "none", outline: "none", fontSize:11, color: "#334155", width: 180, fontFamily: "inherit" }}
                    />
                    {search && <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}><X size={12} color="#94a3b8" /></button>}
                  </div>
                  <span className="fin-hint" style={{ display: "none" }}>{tab === "expenses" ? "Operational expenses + inventory purchase orders." : "Billing revenue (paid bills) + manually added revenue entries."}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {selectedExp.size > 0 && tab === "expenses" && (
                    <button type="button" onClick={bulkDeleteExpenses} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize:11, fontWeight: 700, cursor: "pointer" }}>
                      <Trash2 size={12} /> Delete ({selectedExp.size})
                    </button>
                  )}
                  {selectedRev.size > 0 && tab === "revenue" && (
                    <button type="button" onClick={bulkDeleteRevenues} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize:11, fontWeight: 700, cursor: "pointer" }}>
                      <Trash2 size={12} /> Delete ({selectedRev.size})
                    </button>
                  )}
                  <span style={{ fontSize:10, color: "#94a3b8", fontWeight: 600 }}>Sort:</span>
                  {tab === "expenses" ? (
                    <>
                      {[{ k: "date", l: "Date" }, { k: "amount", l: "Amount" }, { k: "category", l: "Category" }].map(s => (
                        <button key={s.k} type="button" onClick={() => toggleExpSort(s.k)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, border: `1px solid ${expSort.key === s.k ? "#80CCCC" : "#e2e8f0"}`, background: expSort.key === s.k ? "#E6F4F4" : "#f8fafc", color: expSort.key === s.k ? "#0A6B70" : "#64748b", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                          {s.l} <ArrowUpDown size={10} />
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[{ k: "date", l: "Date" }, { k: "amount", l: "Amount" }, { k: "source", l: "Source" }].map(s => (
                        <button key={s.k} type="button" onClick={() => toggleRevSort(s.k)} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, border: `1px solid ${revSort.key === s.k ? "#80CCCC" : "#e2e8f0"}`, background: revSort.key === s.k ? "#E6F4F4" : "#f8fafc", color: revSort.key === s.k ? "#0A6B70" : "#64748b", fontSize:10, fontWeight: 700, cursor: "pointer" }}>
                          {s.l} <ArrowUpDown size={10} />
                        </button>
                      ))}
                    </>
                  )}
                  <button type="button" onClick={() => { loadStats(); tab === "expenses" ? loadExpenses() : loadRevenue(); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:10, fontWeight: 600, cursor: "pointer" }}>
                    <RefreshCw size={11} /> Refresh
                  </button>
                </div>
              </div>

              <div className="fin-table-wrap">
                {tab === "expenses" ? (
                  expLoading ? (
                    <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} /> Loading expenses…
                    </div>
                  ) : filteredExpenses.length === 0 ? (
                    <div style={{ padding: 56, textAlign: "center", color: "#94a3b8" }}>
                      <TrendingDown size={32} color="#e2e8f0" style={{ marginBottom: 8 }} />
                      <div style={{ fontWeight: 600 }}>No expenses found</div>
                    </div>
                  ) : (
                    <table className="fin-table">
                      <thead>
                        <tr>
                          <th style={{ width: 36 }}>
                            <button type="button" onClick={() => {
                              if (selectedExp.size === filteredExpenses.length) setSelectedExp(new Set());
                              else setSelectedExp(new Set(filteredExpenses.map((r: any) => r.id)));
                            }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
                              {selectedExp.size === 0 ? <Square size={15} color="#94a3b8" /> : selectedExp.size === filteredExpenses.length ? <CheckSquare size={15} color="#0A6B70" /> : <MinusSquare size={15} color="#0A6B70" />}
                            </button>
                          </th>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Type</th>
                          <th>Added By</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map((r: any) => (
                          <tr key={r.id} style={{ background: selectedExp.has(r.id) ? "#E6F4F4" : undefined }}>
                            <td>
                              <button type="button" onClick={() => toggleExpSelect(r.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
                                {selectedExp.has(r.id) ? <CheckSquare size={15} color="#0A6B70" /> : <Square size={15} color="#cbd5e1" />}
                              </button>
                            </td>
                            <td>{fmtDate(r.date)}</td>
                            <td><span style={{ padding: "3px 8px", borderRadius: 100, background: "#E6F4F4", color: "#0A6B70", fontSize:10, fontWeight: 700 }}>{(r.category || "OTHER").replace(/_/g, " ")}</span></td>
                            <td>{r.title || r.description || "—"}</td>
                            <td className="fin-amt">{fmtINR(r.amount)}</td>
                            <td>
                              <span className={`fin-badge ${(r as any)._isPurchase ? "warn" : "ok"}`}>
                                {(r as any)._isPurchase ? "Purchase" : "Expense"}
                              </span>
                            </td>
                            <td>
                              {(r as any)._isPurchase ? (
                                <span style={{ fontSize: 10, color: "#94a3b8" }}>Auto</span>
                              ) : (
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>{r.addedByName || "—"}</div>
                                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{r.department || "Hospital Administration"}</div>
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button type="button" onClick={() => setViewExpense(r)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="View Details">
                                  <Eye size={13} color="#0E898F" />
                                </button>
                                {!(r as any)._isPurchase && (
                                  <>
                                    <button type="button" onClick={() => openEditExpense(r)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #dbeafe", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Edit">
                                      <Pencil size={12} color="#2563eb" />
                                    </button>
                                    <button type="button" onClick={() => deleteExpense(r.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #fecaca", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Delete">
                                      <Trash2 size={13} color="#ef4444" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                ) : (
                  revLoading ? (
                    <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Loader2 size={18} style={{ animation: "spin .7s linear infinite" }} /> Loading revenue…
                    </div>
                  ) : filteredRevenues.length === 0 ? (
                    <div style={{ padding: 56, textAlign: "center", color: "#94a3b8" }}>
                      <TrendingUp size={32} color="#e2e8f0" style={{ marginBottom: 8 }} />
                      <div style={{ fontWeight: 600 }}>No revenue entries found</div>
                      <div style={{ fontSize:11, marginTop: 4 }}>Paid bills appear automatically · use "Add Revenue" for other income</div>
                    </div>
                  ) : (
                    <table className="fin-table">
                      <thead>
                        <tr>
                          <th style={{ width: 36 }}>
                            <button type="button" onClick={() => {
                              if (selectedRev.size === filteredRevenues.length) setSelectedRev(new Set());
                              else setSelectedRev(new Set(filteredRevenues.map((r: any) => r.id)));
                            }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
                              {selectedRev.size === 0 ? <Square size={15} color="#94a3b8" /> : selectedRev.size === filteredRevenues.length ? <CheckSquare size={15} color="#0A6B70" /> : <MinusSquare size={15} color="#0A6B70" />}
                            </button>
                          </th>
                          <th>Type</th>
                          <th>Date</th>
                          <th>Description / Patient</th>
                          <th>Source / Bill</th>
                          <th>Amount</th>
                          <th>Added By</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRevenues.map((r: any) => (
                          <tr key={`${r._type}-${r.id}`} style={{ background: selectedRev.has(r.id) ? "#f0fdf4" : undefined }}>
                            <td>
                              <button type="button" onClick={() => toggleRevSelect(r.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
                                {selectedRev.has(r.id) ? <CheckSquare size={15} color="#0A6B70" /> : <Square size={15} color="#cbd5e1" />}
                              </button>
                            </td>
                            <td>
                              {r._type === "bill" ? (
                                <span style={{ padding: "3px 9px", borderRadius: 100, background: "#E6F4F4", color: "#0A6B70", fontSize:10, fontWeight: 700, whiteSpace: "nowrap" }}>
                                  Billing
                                </span>
                              ) : (
                                <span style={{ padding: "3px 9px", borderRadius: 100, background: "#f0fdf4", color: "#16a34a", fontSize:10, fontWeight: 700, whiteSpace: "nowrap" }}>
                                  Manual
                                </span>
                              )}
                            </td>
                            <td style={{ color: "#64748b", fontSize:11 }}>{fmtDate(r.date)}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: "#1e293b", fontSize:12 }}>{r.description}</div>
                              {r.subText && <div style={{ fontSize:10, color: "#94a3b8", marginTop: 1 }}>{r.subText}</div>}
                              {r.billNo && <div style={{ fontSize:10, color: "#80CCCC", marginTop: 1, fontWeight: 700 }}>{r.billNo}</div>}
                            </td>
                            <td>
                              <span style={{ padding: "3px 8px", borderRadius: 100, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontSize:10, fontWeight: 600 }}>
                                {r.source}
                              </span>
                            </td>
                            <td className="fin-amt" style={{ color: "#16a34a", fontWeight: 700 }}>{fmtINR(r.amount)}</td>
                            <td>
                              {r._type === "bill" ? (
                                <span style={{ fontSize: 10, color: "#94a3b8" }}>Billing System</span>
                              ) : (
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>{r._raw?.addedBy || "—"}</div>
                                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{r._raw?.department || "Hospital Administration"}</div>
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: 4 }}>
                                {r._type === "bill" && (
                                  <button type="button" onClick={() => setViewBill(r._raw)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="View Bill Details">
                                    <Eye size={13} color="#0E898F" />
                                  </button>
                                )}
                                {r._type === "manual" && (
                                  <>
                                    <button type="button" onClick={() => setViewManualRev(r)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="View Details">
                                      <Eye size={13} color="#0E898F" />
                                    </button>
                                    <button type="button" onClick={() => openEditRevenue(r)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #dbeafe", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Edit">
                                      <Pencil size={12} color="#2563eb" />
                                    </button>
                                    <button type="button" onClick={() => deleteRevenue(r.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #fecaca", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Delete">
                                      <Trash2 size={13} color="#ef4444" />
                                    </button>
                                  </>
                                )}
                              </div>
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
      {/* ═══ Edit Expense Modal ═══ */}
      {editExpense && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setEditExpense(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 20, width: "95%", maxWidth: 520, boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#eff6ff", borderBottom: "1px solid #bfdbfe", padding: "20px 24px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", letterSpacing: ".1em", color: "#2563eb", fontWeight: 700, marginBottom: 2 }}>Edit Entry</div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>Edit Expense</div>
              </div>
              <button type="button" onClick={() => setEditExpense(null)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(37,99,235,.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#2563eb" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Title *</label>
                <input value={editExpForm.title} onChange={e => setEditExpForm({ ...editExpForm, title: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Category</label>
                  <select value={editExpForm.category} onChange={e => setEditExpForm({ ...editExpForm, category: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", background: "#fff" }}>
                    {["SALARY","EQUIPMENT","MAINTENANCE","UTILITY","MEDICINE","INVENTORY","HOUSEKEEPING","MARKETING","INSURANCE_EXPENSE","OTHER"].map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Amount (₹) *</label>
                  <input type="number" min="1" value={editExpForm.amount} onChange={e => setEditExpForm({ ...editExpForm, amount: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Date *</label>
                  <input type="date" value={editExpForm.date} onChange={e => setEditExpForm({ ...editExpForm, date: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Department</label>
                  <input value={editExpForm.department} onChange={e => setEditExpForm({ ...editExpForm, department: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Description / Remarks</label>
                <textarea value={editExpForm.description} onChange={e => setEditExpForm({ ...editExpForm, description: e.target.value })} rows={2} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => setEditExpense(null)} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={saveEditExpense} disabled={editExpSaving} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", opacity: editExpSaving ? .6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {editExpSaving && <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />}{editExpSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Edit Revenue Modal ═══ */}
      {editRevenue && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setEditRevenue(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 20, width: "95%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#eff6ff", borderBottom: "1px solid #bfdbfe", padding: "20px 24px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", letterSpacing: ".1em", color: "#2563eb", fontWeight: 700, marginBottom: 2 }}>Edit Entry</div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>Edit Revenue</div>
              </div>
              <button type="button" onClick={() => setEditRevenue(null)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(37,99,235,.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#2563eb" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Source Type</label>
                  <select value={editRevForm.sourceType} onChange={e => setEditRevForm({ ...editRevForm, sourceType: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", background: "#fff" }}>
                    {["CONSULTATION","PROCEDURE","BED_CHARGE","PHARMACY","LAB_TEST","OTHER"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Amount (₹) *</label>
                  <input type="number" min="1" value={editRevForm.amount} onChange={e => setEditRevForm({ ...editRevForm, amount: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Department</label>
                <input value={editRevForm.department} onChange={e => setEditRevForm({ ...editRevForm, department: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Description / Remarks</label>
                <textarea value={editRevForm.description} onChange={e => setEditRevForm({ ...editRevForm, description: e.target.value })} rows={2} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => setEditRevenue(null)} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={saveEditRevenue} disabled={editRevSaving} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", opacity: editRevSaving ? .6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {editRevSaving && <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />}{editRevSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add Expense Modal ═══ */}
      {showExpForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setShowExpForm(false); setExpMsg(""); }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 20, width: "95%", maxWidth: 520, boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#E6F4F4", borderBottom: "1px solid #B3E0E0", padding: "20px 24px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", letterSpacing: ".1em", color: "#0A6B70", fontWeight: 700, marginBottom: 2 }}>New Entry</div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>Add Expense</div>
              </div>
              <button type="button" onClick={() => { setShowExpForm(false); setExpMsg(""); }} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(10,107,112,.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#0A6B70" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Title *</label>
                <input value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} placeholder="e.g. Electricity bill" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Category</label>
                  <select value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", background: "#fff" }}>
                    {["SALARY","EQUIPMENT","MAINTENANCE","UTILITY","MEDICINE","INVENTORY","HOUSEKEEPING","MARKETING","INSURANCE_EXPENSE","OTHER"].map(c => <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Amount (₹) *</label>
                  <input type="number" min="1" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} placeholder="0" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Date *</label>
                <input type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Added By</label>
                  <input value={(user as any)?.name || "Admin"} readOnly style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", background: "#f8fafc", color: "#94a3b8" }} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Department</label>
                  <input value={expForm.department} onChange={e => setExpForm({ ...expForm, department: e.target.value })} placeholder="e.g. Hospital Administration" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Description / Remarks</label>
                <textarea value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder="Optional details…" rows={2} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", resize: "vertical" }} />
              </div>
              {expMsg && <div style={{ fontSize:12, color: "#fff", fontWeight: 700, background: "#ef4444", padding: "10px 14px", borderRadius: 10, textAlign: "center" }}>{expMsg}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => { setShowExpForm(false); setExpMsg(""); }} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={saveExpense} disabled={expSaving} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#0A6B70", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", opacity: expSaving ? .6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {expSaving && <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />}{expSaving ? "Saving…" : "Add Expense"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add Revenue Modal ═══ */}
      {showRevForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setShowRevForm(false); setRevMsg(""); }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 20, width: "95%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#E6F4F4", borderBottom: "1px solid #B3E0E0", padding: "20px 24px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", letterSpacing: ".1em", color: "#0A6B70", fontWeight: 700, marginBottom: 2 }}>New Entry</div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>Add Revenue</div>
              </div>
              <button type="button" onClick={() => { setShowRevForm(false); setRevMsg(""); }} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(10,107,112,.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#0A6B70" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Source Type</label>
                  <select value={revForm.sourceType} onChange={e => setRevForm({ ...revForm, sourceType: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", background: "#fff" }}>
                    {["CONSULTATION","PROCEDURE","BED_CHARGE","PHARMACY","LAB_TEST","OTHER"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Amount (₹) *</label>
                  <input type="number" min="1" value={revForm.amount} onChange={e => setRevForm({ ...revForm, amount: e.target.value })} placeholder="0" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Added By</label>
                  <input value={(user as any)?.name || "Admin"} readOnly style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", background: "#f8fafc", color: "#94a3b8" }} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Department</label>
                  <input value={revForm.department} onChange={e => setRevForm({ ...revForm, department: e.target.value })} placeholder="e.g. Hospital Administration" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5, display: "block" }}>Description / Remarks</label>
                <textarea value={revForm.description} onChange={e => setRevForm({ ...revForm, description: e.target.value })} placeholder="e.g. Payment received for consultation" rows={2} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none", resize: "vertical" }} />
              </div>
              {revMsg && <div style={{ fontSize:12, color: "#fff", fontWeight: 700, background: "#ef4444", padding: "10px 14px", borderRadius: 10, textAlign: "center" }}>{revMsg}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => { setShowRevForm(false); setRevMsg(""); }} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={saveRevenue} disabled={revSaving} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "#0A6B70", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", opacity: revSaving ? .6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {revSaving && <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />}{revSaving ? "Saving…" : "Add Revenue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Transaction Detail Modal ═══ */}
      {viewBill && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} onClick={() => setViewBill(null)} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 20, width: "95%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.2)", padding: "0" }}>
            {/* Header */}
            <div style={{ background: "#E6F4F4", borderBottom: "1px solid #B3E0E0", padding: "22px 24px 18px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", letterSpacing: ".1em", color: "#0A6B70", fontWeight: 700, marginBottom: 4 }}>Transaction Details</div>
                <div style={{ fontSize:20, fontWeight: 800, color: "#1e293b" }}>{viewBill.billNo}</div>
              </div>
              <button type="button" onClick={() => setViewBill(null)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(10,107,112,.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} color="#0A6B70" />
              </button>
            </div>

            <div style={{ padding: "20px 24px 24px" }}>
              {/* Patient Info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <UserIcon size={18} color="#0A6B70" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize:13 }}>{viewBill.patient?.name}</div>
                  <div style={{ fontSize:10, color: "#94a3b8" }}>{viewBill.patient?.patientId} · {viewBill.patient?.phone || "—"}</div>
                </div>
              </div>

              {/* Summary Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize:10, color: "#16a34a", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Total Paid</div>
                  <div style={{ fontSize:17, fontWeight: 800, color: "#166534" }}>{fmtINR(viewBill.total)}</div>
                </div>
                <div style={{ background: "#E6F4F4", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize:10, color: "#0A6B70", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Subtotal</div>
                  <div style={{ fontSize:17, fontWeight: 800, color: "#0A6B70" }}>{fmtINR(viewBill.subtotal)}</div>
                </div>
                <div style={{ background: "#fefce8", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ fontSize:10, color: "#a16207", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Paid At</div>
                  <div style={{ fontSize:12, fontWeight: 700, color: "#854d0e" }}>{viewBill.paidAt ? fmtDate(viewBill.paidAt) : "—"}</div>
                </div>
              </div>

              {/* Tax & Discount */}
              {(viewBill.tax > 0 || viewBill.discount > 0) && (
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  {viewBill.discount > 0 && (
                    <div style={{ flex: 1, background: "#fff7ed", borderRadius: 10, padding: "8px 12px", fontSize:11 }}>
                      <span style={{ color: "#9a3412", fontWeight: 700 }}>Discount:</span> <span style={{ fontWeight: 800, color: "#c2410c" }}>{fmtINR(viewBill.discount)}</span>
                    </div>
                  )}
                  {viewBill.tax > 0 && (
                    <div style={{ flex: 1, background: "#faf5ff", borderRadius: 10, padding: "8px 12px", fontSize:11 }}>
                      <span style={{ color: "#7e22ce", fontWeight: 700 }}>Tax:</span> <span style={{ fontWeight: 800, color: "#9333ea" }}>{fmtINR(viewBill.tax)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bill Items */}
              {viewBill.billItems?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize:11, fontWeight: 700, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <FileText size={13} color="#64748b" /> Bill Items
                  </div>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize:11 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#94a3b8", fontSize:10, textTransform: "uppercase", letterSpacing: ".06em" }}>Description</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#94a3b8", fontSize:10, textTransform: "uppercase", letterSpacing: ".06em" }}>Type</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#94a3b8", fontSize:10, textTransform: "uppercase", letterSpacing: ".06em" }}>Qty</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#94a3b8", fontSize:10, textTransform: "uppercase", letterSpacing: ".06em" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewBill.billItems.map((item: any, idx: number) => (
                          <tr key={item.id || idx} style={{ borderTop: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 12px", color: "#334155", fontWeight: 500 }}>{item.name || item.description || "—"}</td>
                            <td style={{ padding: "8px 12px" }}><span style={{ padding: "2px 7px", borderRadius: 100, background: "#eef2ff", color: "#4338ca", fontSize:10, fontWeight: 700 }}>{(item.type || "").replace(/_/g, " ")}</span></td>
                            <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>{item.quantity}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>{fmtINR(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {viewBill.payments?.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight: 700, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Receipt size={13} color="#64748b" /> Payment History
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {viewBill.payments.map((p: any, idx: number) => (
                      <div key={p.id || idx} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #dcfce7", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#166534", fontSize:12 }}>{fmtINR(p.amount)}</div>
                          <div style={{ fontSize:10, color: "#64748b", marginTop: 2 }}>
                            {fmtDate(p.paidAt)} · <span style={{ fontWeight: 600 }}>{p.method}</span>
                            {p.transactionId && <span> · TXN: {p.transactionId}</span>}
                          </div>
                          {p.notes && <div style={{ fontSize:10, color: "#94a3b8", marginTop: 2 }}>{p.notes}</div>}
                        </div>
                        <span style={{ padding: "3px 8px", borderRadius: 100, background: "#dcfce7", color: "#166534", fontSize:10, fontWeight: 700 }}>PAID</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewBill.notes && (
                <div style={{ marginTop: 16, padding: "10px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", fontSize:11, color: "#92400e" }}>
                  <span style={{ fontWeight: 700 }}>Notes:</span> {viewBill.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ View Expense Details Modal ═══ */}
      {viewExpense && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setViewExpense(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", background: "#fff", borderRadius: 20, width: "95%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#E6F4F4", borderBottom: "1px solid #B3E0E0", padding: "20px 24px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", letterSpacing: ".1em", color: "#0A6B70", fontWeight: 700, marginBottom: 2 }}>Expense Details</div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>{viewExpense.title || "Expense"}</div>
              </div>
              <button type="button" onClick={() => setViewExpense(null)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(10,107,112,.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#0A6B70" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Date</div>
                  <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{fmtDate(viewExpense.date)}</div>
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Amount</div>
                  <div style={{ fontSize:15, fontWeight: 800, color: "#166534" }}>{fmtINR(viewExpense.amount)}</div>
                </div>
                <div style={{ background: "#E6F4F4", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Category</div>
                  <div style={{ fontSize:11, fontWeight: 700, color: "#0A6B70" }}>{(viewExpense.category || "OTHER").replace(/_/g, " ")}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", alignItems: "center" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={16} color="#0A6B70" /></div>
                <div>
                  <div style={{ fontSize:12, fontWeight: 700, color: "#1e293b" }}>{viewExpense.addedByName || "—"}</div>
                  <div style={{ fontSize:10, color: "#94a3b8", marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                    <Building2 size={10} color="#94a3b8" /> {viewExpense.department || "Hospital Administration"}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize:10, color: "#94a3b8" }}>Created</div>
                  <div style={{ fontSize:10, fontWeight: 600, color: "#64748b" }}>{viewExpense.createdAt ? fmtDate(viewExpense.createdAt) : "—"}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Type</div>
                <span className={`fin-badge ${(viewExpense as any)._isPurchase ? "warn" : "ok"}`}>{(viewExpense as any)._isPurchase ? "Purchase Order" : "Manual Expense"}</span>
              </div>
              {viewExpense.description && (
                <div style={{ padding: "10px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><FileText size={10} /> Description / Remarks</div>
                  <div style={{ fontSize:12, color: "#475569", lineHeight: 1.5 }}>{viewExpense.description}</div>
                </div>
              )}
              {viewExpense.updatedAt && viewExpense.updatedAt !== viewExpense.createdAt && (
                <div style={{ fontSize:10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> Last updated: {fmtDate(viewExpense.updatedAt)}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ View Manual Revenue Details Modal ═══ */}
      {viewManualRev && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setViewManualRev(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", background: "#fff", borderRadius: 20, width: "95%", maxWidth: 480, boxShadow: "0 24px 80px rgba(0,0,0,.2)" }}>
            <div style={{ background: "#E6F4F4", borderBottom: "1px solid #B3E0E0", padding: "20px 24px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize:10, textTransform: "uppercase", letterSpacing: ".1em", color: "#0A6B70", fontWeight: 700, marginBottom: 2 }}>Revenue Details</div>
                <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>Manual Entry</div>
              </div>
              <button type="button" onClick={() => setViewManualRev(null)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(10,107,112,.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#0A6B70" /></button>
            </div>
            <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Date</div>
                  <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{fmtDate(viewManualRev.date)}</div>
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Amount</div>
                  <div style={{ fontSize:15, fontWeight: 800, color: "#166534" }}>{fmtINR(viewManualRev.amount)}</div>
                </div>
                <div style={{ background: "#E6F4F4", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#0A6B70", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Source</div>
                  <div style={{ fontSize:11, fontWeight: 700, color: "#0A6B70" }}>{viewManualRev.source}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", alignItems: "center" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#E6F4F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={16} color="#0A6B70" /></div>
                <div>
                  <div style={{ fontSize:12, fontWeight: 700, color: "#1e293b" }}>{viewManualRev._raw?.addedBy || "—"}</div>
                  <div style={{ fontSize:10, color: "#94a3b8", marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                    <Building2 size={10} color="#94a3b8" /> {viewManualRev._raw?.department || "Hospital Administration"}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize:10, color: "#94a3b8" }}>Created</div>
                  <div style={{ fontSize:10, fontWeight: 600, color: "#64748b" }}>{viewManualRev._raw?.createdAt ? fmtDate(viewManualRev._raw.createdAt) : "—"}</div>
                </div>
              </div>
              {(viewManualRev.description && viewManualRev.description !== "—") || (viewManualRev._raw?.description && viewManualRev._raw.description !== "—") ? (
                <div style={{ padding: "10px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" }}>
                  <div style={{ fontSize:10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><FileText size={10} /> Description / Remarks</div>
                  <div style={{ fontSize:12, color: "#475569", lineHeight: 1.5 }}>{viewManualRev._raw?.description || viewManualRev.description}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setDeleteConfirm(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }} />
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", background: "#fff", borderRadius: 18, width: "95%", maxWidth: 420, boxShadow: "0 24px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
            <div style={{ padding: "28px 24px 24px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #fef2f2, #fee2e2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Trash2 size={24} color="#ef4444" />
              </div>
              <div style={{ fontSize:16, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                {deleteConfirm.type.includes("bulk") ? `Delete ${deleteConfirm.count} ${deleteConfirm.type === "bulk-expense" ? "Expenses" : "Revenue Entries"}` : "Delete Entry"}
              </div>
              {deleteConfirm.type.includes("bulk") && (
                <div style={{ fontSize:12, color: "#dc2626", fontWeight: 600, background: "#fef2f2", padding: "4px 12px", borderRadius: 100, display: "inline-block", marginTop: 4 }}>
                  {deleteConfirm.count} selected
                </div>
              )}
            </div>
            <div style={{ fontSize:12, color: "#64748b", lineHeight: 1.5, padding: "0 24px 20px", textAlign: "center" }}>
              {deleteConfirm.type === "expense" && "Are you sure you want to delete this expense? This action cannot be undone."}
              {deleteConfirm.type === "revenue" && "Are you sure you want to delete this revenue entry? This action cannot be undone."}
              {deleteConfirm.type === "bulk-expense" && `Are you sure you want to delete ${deleteConfirm.count} selected expense${deleteConfirm.count === 1 ? "" : "s"}? This action cannot be undone.`}
              {deleteConfirm.type === "bulk-revenue" && `Are you sure you want to delete ${deleteConfirm.count} selected revenue entr${deleteConfirm.count === 1 ? "y" : "ies"}? Only manually-added revenue can be deleted.`}
            </div>
            <div style={{ display: "flex", gap: 10, padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", justifyContent: "center" }}>
              <button type="button" onClick={() => setDeleteConfirm(null)} style={{ padding: "10px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={() => {
                if (deleteConfirm.type === "expense" && deleteConfirm.id) confirmDeleteExpense(deleteConfirm.id);
                else if (deleteConfirm.type === "revenue" && deleteConfirm.id) confirmDeleteRevenue(deleteConfirm.id);
                else if (deleteConfirm.type === "bulk-expense") confirmBulkDeleteExpenses();
                else if (deleteConfirm.type === "bulk-revenue") confirmBulkDeleteRevenues();
              }} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
