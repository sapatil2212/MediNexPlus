"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  IndianRupee, TrendingUp, TrendingDown, FileText, CreditCard, Receipt,
  Plus, Search, Loader2, LogOut, Bell, X, Check, AlertCircle, Printer,
  ChevronDown, ChevronUp, Save, Trash2, Pencil, BarChart3,
  Wallet, Activity, ArrowUpRight, ArrowDownRight, RefreshCw,
  CalendarDays, Filter, Download, Users, CheckCircle2, Clock,
  Settings, Menu
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const api = async (url: string, method = "GET", body?: any) => {
  const opts: any = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
};

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_CFG: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:        { bg: "#fffbeb", color: "#b45309", label: "Pending" },
  PAID:           { bg: "#f0fdf4", color: "#16a34a", label: "Paid" },
  PARTIALLY_PAID: { bg: "#E6F4F4", color: "#0A6B70", label: "Partial" },
  CANCELLED:      { bg: "#fff5f5", color: "#ef4444", label: "Cancelled" },
};

const EXPENSE_CATS = [
  "SALARY","EQUIPMENT","MAINTENANCE","UTILITY","MEDICINE","INVENTORY",
  "HOUSEKEEPING","MARKETING","INSURANCE_EXPENSE","OTHER",
];
const PAYMENT_METHODS = ["CASH","UPI","CARD","INSURANCE","CHEQUE","ONLINE"];

type DashTab = "overview"|"bills"|"payments"|"expenses"|"reports";

// ── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ bill, onClose, onDone }: { bill: any; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount]   = useState("");
  const [method, setMethod]   = useState("CASH");
  const [txnId,  setTxnId]    = useState("");
  const [notes,  setNotes]    = useState("");
  const [saving, setSaving]   = useState(false);
  const [msg,    setMsg]      = useState("");
  const remaining = ((bill.total || 0) - (bill.paidAmount || 0)).toFixed(2);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    const d = await api(`/api/billing/${bill.id}`, "PATCH", { amount: parseFloat(amount), method, transactionId: txnId, notes });
    if (d.success) onDone();
    else setMsg(d.message || "Payment failed");
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize:17, fontWeight: 800, color: "#1e293b" }}>Collect Payment</div>
            <div style={{ fontSize:11, color: "#94a3b8", marginTop: 2 }}>{bill.billNo} · {bill.patient?.name}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize:12 }}>
            <span style={{ color: "#78350f" }}>Total Bill</span><strong style={{ color: "#1e293b" }}>₹{fmt(bill.total)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize:12, marginTop: 4 }}>
            <span style={{ color: "#78350f" }}>Paid So Far</span><strong style={{ color: "#16a34a" }}>₹{fmt(bill.paidAmount)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize:13, marginTop: 6, paddingTop: 6, borderTop: "1px solid #fde68a", fontWeight: 700 }}>
            <span style={{ color: "#b45309" }}>Remaining</span><span style={{ color: "#dc2626" }}>₹{remaining}</span>
          </div>
        </div>

        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="fin-lbl">Amount (₹) *</label>
              <input className="fin-input" type="number" step="0.01" max={remaining} value={amount} onChange={e => setAmount(e.target.value)} placeholder={remaining} required />
            </div>
            <div>
              <label className="fin-lbl">Payment Method *</label>
              <select className="fin-input" value={method} onChange={e => setMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="fin-lbl">Transaction ID</label>
              <input className="fin-input" value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="UPI/Card ref no." />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="fin-lbl">Notes</label>
              <input className="fin-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          {msg && <div style={{ fontSize:11, color: "#ef4444", marginTop: 12, fontWeight: 600 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <Check size={14} />} Confirm Payment
            </button>
            <button type="button" onClick={onClose} style={{ padding: "11px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bill Detail Modal ────────────────────────────────────────────────────────
function BillDetailModal({ billId, onClose, onPayment }: { billId: string; onClose: () => void; onPayment: (bill: any) => void }) {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState("");
  const [tax, setTax] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api(`/api/billing/${billId}`).then(d => {
      if (d.success) { setBill(d.data); setDiscount(String(d.data.discount || 0)); setTax(String(d.data.tax || 0)); }
      setLoading(false);
    });
  }, [billId]);

  const updateBill = async () => {
    setSaving(true);
    const d = await api(`/api/billing/${billId}`, "PUT", { discount: parseFloat(discount) || 0, tax: parseFloat(tax) || 0 });
    if (d.success) setBill(d.data);
    setSaving(false);
  };

  if (loading) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={28} color="#fff" style={{ animation: "spin .7s linear infinite" }} />
    </div>
  );

  const sc = STATUS_CFG[bill?.status] || STATUS_CFG.PENDING;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 640, boxShadow: "0 24px 60px rgba(0,0,0,.18)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>{bill?.billNo}</div>
              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize:10, fontWeight: 700, background: sc.bg, color: sc.color }}>{sc.label}</span>
            </div>
            <div style={{ fontSize:11, color: "#94a3b8" }}>{bill?.patient?.name} · {bill?.patient?.patientId} · {fmtDate(bill?.createdAt)}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>

        {/* Bill Items */}
        <div style={{ background: "#f8fafc", borderRadius: 12, overflow: "hidden", marginBottom: 18 }}>
          <div style={{ padding: "10px 14px", background: "#f1f5f9", fontSize:10, fontWeight: 700, color: "#64748b", display: "grid", gridTemplateColumns: "1fr 80px 80px 90px", gap: 8 }}>
            <span>ITEM</span><span style={{ textAlign: "center" }}>QTY</span><span style={{ textAlign: "right" }}>UNIT</span><span style={{ textAlign: "right" }}>AMOUNT</span>
          </div>
          {bill?.billItems?.map((item: any) => (
            <div key={item.id} style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 80px 80px 90px", gap: 8, borderBottom: "1px solid #e2e8f0", alignItems: "center" }}>
              <div>
                <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{item.name}</div>
                <span style={{ fontSize:10, padding: "1px 7px", borderRadius: 100, background: "#E6F4F4", color: "#0A6B70", fontWeight: 700 }}>{item.type.replace(/_/g, " ")}</span>
              </div>
              <div style={{ textAlign: "center", fontSize:12, color: "#64748b" }}>{item.quantity}</div>
              <div style={{ textAlign: "right", fontSize:12, color: "#64748b" }}>₹{fmt(item.unitPrice)}</div>
              <div style={{ textAlign: "right", fontSize:12, fontWeight: 700, color: "#1e293b" }}>₹{fmt(item.amount)}</div>
            </div>
          ))}
        </div>

        {/* Totals + Discount/Tax Editor */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize:11, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>ADJUST</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>DISCOUNT (₹)</label>
                <input value={discount} onChange={e => setDiscount(e.target.value)} type="number" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>TAX (₹)</label>
                <input value={tax} onChange={e => setTax(e.target.value)} type="number" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
              </div>
            </div>
            <button onClick={updateBill} disabled={saving} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#0E898F", color: "#fff", fontSize:11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              {saving ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={12} />} Update
            </button>
          </div>
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize:11, fontWeight: 700, color: "#16a34a", marginBottom: 10 }}>SUMMARY</div>
            {[["Subtotal", `₹${fmt(bill?.subtotal)}`], ["Discount", `- ₹${fmt(bill?.discount)}`], ["Tax", `+ ₹${fmt(bill?.tax)}`]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize:11, marginBottom: 5, color: "#475569" }}>
                <span>{k}</span><span>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize:14, fontWeight: 800, color: "#1e293b", paddingTop: 8, borderTop: "1px solid #bbf7d0", marginTop: 4 }}>
              <span>Total</span><span>₹{fmt(bill?.total)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize:11, marginTop: 6, color: "#16a34a", fontWeight: 600 }}>
              <span>Paid</span><span>₹{fmt(bill?.paidAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize:12, marginTop: 4, color: "#dc2626", fontWeight: 700 }}>
              <span>Balance</span><span>₹{fmt((bill?.total || 0) - (bill?.paidAmount || 0))}</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {bill?.payments?.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize:11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>PAYMENT HISTORY</div>
            {bill.payments.map((p: any) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Check size={14} color="#16a34a" />
                  <div>
                    <div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>₹{fmt(p.amount)}</div>
                    <div style={{ fontSize:10, color: "#64748b" }}>{p.method} · {fmtDate(p.paidAt)}</div>
                  </div>
                </div>
                {p.transactionId && <div style={{ fontSize:10, color: "#94a3b8" }}>{p.transactionId}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
          {bill?.status !== "PAID" && bill?.status !== "CANCELLED" && (
            <button onClick={() => onPayment(bill)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CreditCard size={14} /> Collect Payment
            </button>
          )}
          <button onClick={() => window.print()} style={{ padding: "11px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Printer size={14} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Bill Modal ───────────────────────────────────────────────────────────
function NewBillModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<"patient"|"items">("patient");
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPt, setSelectedPt] = useState<any>(null);
  const [items, setItems] = useState([{ type: "CONSULTATION", name: "", quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const searchPts = async (q: string) => {
    if (!q || q.length < 2) { setPatients([]); return; }
    const d = await api(`/api/patients?search=${encodeURIComponent(q)}&limit=8`);
    if (d.success) setPatients(d.data?.patients || d.data || []);
  };

  const addItem = () => setItems(i => [...i, { type: "OTHER", name: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(i => i.filter((_, j) => j !== idx));
  const updateItem = (idx: number, field: string, val: any) => setItems(items.map((it, j) => j === idx ? { ...it, [field]: val } : it));

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const total = Math.max(0, subtotal + tax - discount);

  const submit = async () => {
    if (!selectedPt) { setMsg("Select a patient"); return; }
    if (items.some(i => !i.name || i.unitPrice <= 0)) { setMsg("All items need a name and price"); return; }
    setSaving(true); setMsg("");
    const d = await api("/api/billing", "POST", { patientId: selectedPt.id, items, discount, tax, notes });
    if (d.success) onDone();
    else setMsg(d.message || "Failed");
    setSaving(false);
  };

  const ITEM_TYPES = ["CONSULTATION","PROCEDURE","LAB_TEST","BED_CHARGE","PHARMACY","OTHER"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 680, boxShadow: "0 24px 60px rgba(0,0,0,.18)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize:18, fontWeight: 800, color: "#1e293b" }}>Generate New Bill</div>
            <div style={{ fontSize:11, color: "#94a3b8", marginTop: 2 }}>{step === "patient" ? "Step 1: Select patient" : `Step 2: Add items · ${selectedPt?.name}`}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>

        {step === "patient" ? (
          <div>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input value={patientSearch} onChange={e => { setPatientSearch(e.target.value); searchPts(e.target.value); }} placeholder="Search by name, ID or phone…"
                style={{ width: "100%", padding: "11px 12px 11px 36px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
              {patients.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", overflow: "hidden", zIndex: 50, maxHeight: 260, overflowY: "auto" }}>
                  {patients.map((pt: any) => (
                    <div key={pt.id} onClick={() => { setSelectedPt(pt); setPatients([]); setPatientSearch(`${pt.name} (${pt.patientId})`); }} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 10 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#f59e0b,#b45309)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize:12, flexShrink: 0 }}>{pt.name?.charAt(0)}</div>
                      <div><div style={{ fontSize:12, fontWeight: 600, color: "#1e293b" }}>{pt.name}</div><div style={{ fontSize:10, color: "#94a3b8" }}>{pt.patientId} · {pt.phone}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedPt && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#b45309)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize:14 }}>{selectedPt.name?.charAt(0)}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>{selectedPt.name}</div>
                  <div style={{ fontSize:10, color: "#78350f" }}>{selectedPt.patientId} · {selectedPt.phone}</div>
                </div>
              </div>
            )}
            <button onClick={() => { if (selectedPt) setStep("items"); else setMsg("Select a patient first"); }} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f59e0b,#b45309)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer" }}>
              Next: Add Items →
            </button>
            {msg && <div style={{ fontSize:11, color: "#ef4444", marginTop: 10 }}>{msg}</div>}
          </div>
        ) : (
          <div>
            {/* Items */}
            <div style={{ marginBottom: 18 }}>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "140px 1fr 70px 90px 36px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <select value={it.type} onChange={e => updateItem(idx, "type", e.target.value)} style={{ padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:11, outline: "none" }}>
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                  </select>
                  <input value={it.name} onChange={e => updateItem(idx, "name", e.target.value)} placeholder="Item description" style={{ padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                  <input type="number" min={1} value={it.quantity} onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} style={{ padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:12, textAlign: "center", outline: "none" }} />
                  <input type="number" min={0} value={it.unitPrice} onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} placeholder="₹" style={{ padding: "9px 10px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                  <button onClick={() => removeItem(idx)} disabled={items.length === 1} style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #fecaca", background: "#fff5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} color="#ef4444" /></button>
                </div>
              ))}
              <button onClick={addItem} style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px dashed #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Plus size={13} /> Add Item
              </button>
            </div>

            {/* Totals */}
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>DISCOUNT (₹)</label>
                  <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>TAX (₹)</label>
                  <input type="number" value={tax} onChange={e => setTax(parseFloat(e.target.value) || 0)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
                </div>
              </div>
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize:13, fontWeight: 700, color: "#1e293b" }}>Grand Total</span>
                <span style={{ fontSize:17, fontWeight: 800, color: "#f59e0b" }}>₹{fmt(total)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize:10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>NOTES</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional bill notes" style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize:12, outline: "none" }} />
            </div>

            {msg && <div style={{ fontSize:11, color: "#ef4444", marginBottom: 10 }}>{msg}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("patient")} style={{ padding: "11px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>← Back</button>
              <button onClick={submit} disabled={saving} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f59e0b,#b45309)", color: "#fff", fontSize:12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {saving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <FileText size={14} />} Generate Bill
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN FINANCE DASHBOARD ───────────────────────────────────────────────────
export default function FinanceDashboard() {
  const router = useRouter();
  const [user,        setUser]        = useState<any>(null);
  const [profile,     setProfile]     = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<DashTab>("overview");

  // Overview
  const [stats, setStats] = useState<any>(null);

  // Bills
  const [bills, setBills]           = useState<any[]>([]);
  const [billsMeta, setBillsMeta]   = useState<any>({});
  const [billsLoading, setBillsLoading] = useState(false);
  const [billSearch, setBillSearch] = useState("");
  const [billStatus, setBillStatus] = useState("");
  const [billDateFrom, setBillDateFrom] = useState("");
  const [billDateTo,   setBillDateTo]   = useState("");
  const [viewBillId, setViewBillId] = useState<string | null>(null);
  const [payBill,    setPayBill]    = useState<any>(null);
  const [showNewBill, setShowNewBill] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Expenses
  const [expenses, setExpenses]           = useState<any[]>([]);
  const [expMeta,  setExpMeta]            = useState<any>({});
  const [expLoading, setExpLoading]       = useState(false);
  const [showExpForm, setShowExpForm]     = useState(false);
  const [editExp,  setEditExp]            = useState<any>(null);
  const [expForm,  setExpForm]            = useState({ title: "", category: "OTHER", amount: "", date: new Date().toISOString().split("T")[0], description: "" });
  const [expSaving, setExpSaving]         = useState(false);
  const [expMsg, setExpMsg]               = useState("");

  // Reports
  const [revenue, setRevenue] = useState<any[]>([]);
  const [revMeta, setRevMeta] = useState<any>({});

  const loadStats = useCallback(async () => {
    const d = await api("/api/finance/dashboard");
    if (d.success) setStats(d.data);
  }, []);

  const loadBills = useCallback(async () => {
    setBillsLoading(true);
    const qs = new URLSearchParams({ limit: "50" });
    if (billSearch)   qs.set("search",   billSearch);
    if (billStatus)   qs.set("status",   billStatus);
    if (billDateFrom) qs.set("dateFrom", billDateFrom);
    if (billDateTo)   qs.set("dateTo",   billDateTo);
    const d = await api(`/api/billing?${qs}`);
    if (d.success) { setBills(d.data.bills || []); setBillsMeta(d.data); }
    setBillsLoading(false);
  }, [billSearch, billStatus, billDateFrom, billDateTo]);

  const loadExpenses = useCallback(async () => {
    setExpLoading(true);
    const d = await api("/api/finance/expenses");
    if (d.success) { 
      setExpenses(d.data.expenses || []); 
      setExpMeta({ 
        ...d.data, 
        stats: {
          ...d.data.stats,
          monthTotal: d.data.stats?.month || 0,
          categoryBreakdown: d.data.stats?.categoryBreakdown || []
        }
      }); 
    }
    setExpLoading(false);
  }, []);

  const loadRevenue = useCallback(async () => {
    const d = await api("/api/finance/revenue");
    if (d.success) { setRevenue(d.data.revenues || []); setRevMeta(d.data); }
  }, []);

  useEffect(() => {
    (async () => {
      const me = await api("/api/auth/me");
      if (!me.success) { router.push("/login"); return; }
      if (me.data?.role !== "FINANCE_HEAD" && me.data?.role !== "HOSPITAL_ADMIN") { router.push("/login"); return; }
      setUser(me.data);
      if (me.data.profilePhoto) setProfilePhoto(me.data.profilePhoto);
      const prof = await api("/api/finance/me");
      if (prof.success) setProfile(prof.data);
      await loadStats();
      setLoading(false);
    })();
  }, [router, loadStats]);

  useEffect(() => { if (tab === "bills")    loadBills();    }, [tab, loadBills]);
  useEffect(() => { if (tab === "expenses") loadExpenses(); }, [tab, loadExpenses]);
  useEffect(() => { if (tab === "reports")  loadRevenue();  }, [tab, loadRevenue]);
  useEffect(() => {
    if (tab === "overview") loadStats();
  }, [tab, loadStats]);

  const saveExpense = async () => {
    if (!expForm.title || !expForm.amount || !expForm.date) { setExpMsg("Title, amount and date required"); return; }
    setExpSaving(true); setExpMsg("");
    const url    = editExp ? `/api/expense/${editExp.id}` : "/api/expense";
    const method = editExp ? "PUT" : "POST";
    const d = await api(url, method, expForm);
    if (d.success) { setShowExpForm(false); setEditExp(null); setExpForm({ title: "", category: "OTHER", amount: "", date: new Date().toISOString().split("T")[0], description: "" }); await loadExpenses(); await loadStats(); }
    else setExpMsg(d.message || "Failed");
    setExpSaving(false);
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await api(`/api/expense/${id}`, "DELETE");
    await loadExpenses(); await loadStats();
  };

  const logout = async () => { await api("/api/auth/logout", "POST"); router.push("/login"); };
  const initials = (n: string) => (n || "FH").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#f59e0b,#b45309)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(245,158,11,.3)" }}>
          <Loader2 size={24} color="#fff" style={{ animation: "spin .7s linear infinite" }} />
        </div>
        <div style={{ fontSize:13, fontWeight: 600, color: "#475569" }}>Loading Finance Portal…</div>
      </div>
    </div>
  );

  const navItems: { id: DashTab; label: string; icon: any }[] = [
    { id: "overview",  label: "Overview",       icon: BarChart3 },
    { id: "bills",     label: "Bills & Invoices", icon: FileText },
    { id: "payments",  label: "Payments",         icon: CreditCard },
    { id: "expenses",  label: "Expenses",          icon: TrendingDown },
    { id: "reports",   label: "Revenue Reports",   icon: TrendingUp },
  ];

  const deptName = profile?.name || "Finance Department";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}
        body,input,select,button,textarea{font-family:'Inter',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fin-wrap{display:flex;height:100vh;overflow:hidden;background:#f0f4f8}
        .fin-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:45;backdrop-filter:blur(2px)}
        .fin-overlay.open{display:block}
        .fin-sb{width:228px;background:#fff;border-right:1px solid #fde68a;display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:50;box-shadow:2px 0 8px rgba(245,158,11,.08);transition:transform .25s cubic-bezier(.4,0,.2,1)}
        .fin-burger{display:none;width:36px;height:36px;border-radius:10px;background:#fffbeb;border:1px solid #fde68a;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
        .fin-logo{padding:20px 20px 16px;border-bottom:1px solid #fef3c7;display:flex;align-items:center;gap:10px}
        .fin-nav{flex:1;padding:12px;overflow-y:auto}
        .fin-nav-sec{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;padding:0 8px;margin:10px 0 5px}
        .fin-nb{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:10px;border:none;background:none;color:#64748b;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;text-align:left;position:relative}
        .fin-nb:hover{background:#fffbeb;color:#b45309}
        .fin-nb.on{background:#fffbeb;color:#b45309;font-weight:600}
        .fin-nb.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:#f59e0b;border-radius:4px}
        .fin-nb svg{color:#94a3b8;flex-shrink:0}
        .fin-nb.on svg,.fin-nb:hover svg{color:#f59e0b}
        .fin-foot{padding:14px 16px 18px;border-top:1px solid #fef3c7}
        .fin-main{margin-left:228px;flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden}
        .fin-topbar{height:64px;background:#fff;border-bottom:1px solid #fde68a;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:relative;z-index:40;flex-shrink:0;box-shadow:0 1px 4px rgba(245,158,11,.08)}
        .fin-body{padding:24px;overflow-y:auto;flex:1;animation:fadeUp .35s ease}
        .fin-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.04);overflow:hidden;margin-bottom:18px}
        .fin-card-hd{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9}
        .fin-card-title{font-size:13px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:8px}
        .fin-stat{background:#fff;border-radius:14px;padding:18px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:14px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .fin-tbl{width:100%;border-collapse:collapse}
        .fin-tbl th{text-align:left;font-size:10px;font-weight:600;color:#94a3b8;padding:10px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap}
        .fin-tbl td{padding:11px 14px;font-size:12px;color:#475569;border-bottom:1px solid #f8fafc;vertical-align:middle}
        .fin-tbl tbody tr:hover td{background:#fffbeb}
        .fin-tbl tbody tr:last-child td{border-bottom:none}
        .fin-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:8px;border:none;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
        .fin-lbl{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;display:block;margin-bottom:5px}
        .fin-input{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:9px;padding:10px 13px;font-size:12px;color:#1e293b;outline:none;transition:border-color .2s;width:100%}
        .fin-input:focus{border-color:#fcd34d;box-shadow:0 0 0 3px rgba(252,211,77,.2)}
        .fin-primary{padding:10px 20px;border-radius:9px;border:none;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(245,158,11,.3)}
        .fin-av{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#f59e0b,#b45309);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
        @media(max-width:900px){
          .fin-sb{transform:translateX(-100%)}
          .fin-sb.open{transform:translateX(0)}
          .fin-main{margin-left:0}
          .fin-burger{display:flex}
        }
        @media(max-width:600px){
          .fin-topbar{padding:0 14px;gap:8px}
          .fin-body{padding:16px 12px}
        }
      `}</style>

      {/* Modals */}
      {viewBillId && (
        <BillDetailModal billId={viewBillId} onClose={() => setViewBillId(null)} onPayment={b => { setViewBillId(null); setPayBill(b); }} />
      )}
      {payBill && (
        <PaymentModal bill={payBill} onClose={() => setPayBill(null)} onDone={() => { setPayBill(null); loadBills(); loadStats(); }} />
      )}
      {showNewBill && (
        <NewBillModal onClose={() => setShowNewBill(false)} onDone={() => { setShowNewBill(false); loadBills(); loadStats(); setTab("bills"); }} />
      )}

      <div className="fin-wrap">
        {sidebarOpen && <div className="fin-overlay open" onClick={() => setSidebarOpen(false)} />}
        {/* Sidebar */}
        <aside className={`fin-sb${sidebarOpen ? " open" : ""}`}>
          <div className="fin-logo">
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#f59e0b,#b45309)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IndianRupee size={19} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>{deptName}</div>
              <div style={{ fontSize:10, color: "#94a3b8", marginTop: 1 }}>Finance Portal</div>
            </div>
          </div>
          <nav className="fin-nav">
            <div className="fin-nav-sec">Navigation</div>
            {navItems.map(n => {
              const Icon = n.icon;
              return (
                <button key={n.id} className={`fin-nb${tab === n.id ? " on" : ""}`} onClick={() => { setTab(n.id); setSidebarOpen(false); }}>
                  <Icon size={15} />{n.label}
                </button>
              );
            })}
            <div className="fin-nav-sec">Actions</div>
            <button className="fin-nb" onClick={() => setShowNewBill(true)}><Plus size={15} />New Bill</button>
            <button className="fin-nb" onClick={() => { setShowExpForm(true); setEditExp(null); setExpForm({ title: "", category: "OTHER", amount: "", date: new Date().toISOString().split("T")[0], description: "" }); setTab("expenses"); }}>
              <TrendingDown size={15} />Add Expense
            </button>
          </nav>
          <div className="fin-foot">
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 10 }}>
              <div className="fin-av" style={profilePhoto ? { padding: 0, overflow: "hidden" } : {}}>
                {profilePhoto ? <img src={profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(user?.name || "FH")}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize:11, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "Finance Head"}</div>
                <div style={{ fontSize:10, color: "#f59e0b", fontWeight: 600 }}>Finance Head</div>
              </div>
            </div>
            <button onClick={logout} style={{ width: "100%", padding: 8, borderRadius: 9, background: "#fff5f5", border: "1px solid #fee2e2", color: "#ef4444", fontSize:11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <LogOut size={13} />Log Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="fin-main">
          <header className="fin-topbar">
            <button className="fin-burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={18} color="#f59e0b" /> : <Menu size={18} color="#64748b" />}
            </button>
            <div>
              <div style={{ fontSize:15, fontWeight: 800, color: "#1e293b" }}>
                {tab === "overview" ? "Financial Overview" : tab === "bills" ? "Bills & Invoices" : tab === "payments" ? "Payment History" : tab === "expenses" ? "Expense Management" : "Revenue Reports"}
              </div>
              <div style={{ fontSize:10, color: "#94a3b8", marginTop: 1 }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => { loadStats(); if (tab === "bills") loadBills(); if (tab === "expenses") loadExpenses(); }} style={{ width: 36, height: 36, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <RefreshCw size={15} color="#f59e0b" />
              </button>
              <NotificationBell accentColor="#f59e0b" bgColor="#fffbeb" borderColor="#fde68a" types={["BILLING_TRANSFER","PAYMENT_RECEIVED"]} />
              <button onClick={() => setShowNewBill(true)} className="fin-primary"><Plus size={14} />New Bill</button>
              <div 
                className="fin-av" 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{ cursor: "pointer", position: "relative", ...(profilePhoto ? { padding: 0, overflow: "hidden" } : {}) }}
              >
                {profilePhoto ? <img src={profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 9 }} /> : initials(user?.name || "FH")}
                
                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <>
                    <div 
                      style={{ position: "fixed", inset: 0, zIndex: 60 }} 
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: 200,
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #fde68a",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                      zIndex: 70,
                      overflow: "hidden",
                    }}>
                      <div style={{ padding: 16, borderBottom: "1px solid #fef3c7" }}>
                        <div style={{ fontSize:13, fontWeight: 600, color: "#1e293b" }}>{user?.name || "Finance Head"}</div>
                        <div style={{ fontSize:11, color: "#64748b", marginTop: 2 }}>{user?.email}</div>
                      </div>
                      <div style={{ padding: 8 }}>
                        <button 
                          onClick={() => { setProfileDropdownOpen(false); router.push("/finance/profile"); }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#475569",
                            fontSize:12,
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#fffbeb"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <Settings size={16} color="#64748b" />
                          Account Settings
                        </button>
                        <button 
                          onClick={() => { setProfileDropdownOpen(false); logout(); }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "transparent",
                            color: "#ef4444",
                            fontSize:12,
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            transition: "all 0.15s",
                            marginTop: 4,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <LogOut size={16} color="#ef4444" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="fin-body">

            {/* ═══ OVERVIEW ═══ */}
            {tab === "overview" && stats && (<>
              {/* Hero */}
              <div style={{ background: "linear-gradient(135deg,#f59e0b,#b45309)", borderRadius: 18, padding: "24px 28px", marginBottom: 20, color: "#fff", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: -20, top: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ width: 58, height: 58, borderRadius: 16, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IndianRupee size={28} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize:10, textTransform: "uppercase", letterSpacing: ".1em", opacity: .75, marginBottom: 3 }}>This Month</div>
                    <div style={{ fontSize:30, fontWeight: 800, letterSpacing: "-.5px" }}>₹{fmt(stats.revenue?.month)}</div>
                    <div style={{ fontSize:11, opacity: .8 }}>Revenue collected · Profit: ₹{fmt(stats.revenue?.profit)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize:10, opacity: .7, marginBottom: 6 }}>Today</div>
                    <div style={{ fontSize:20, fontWeight: 800 }}>₹{fmt(stats.revenue?.today)}</div>
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "Today Revenue",   value: `₹${fmt(stats.revenue?.today)}`,   color: "#f59e0b", bg: "#fffbeb", Icon: IndianRupee, trend: "up" },
                  { label: "Month Revenue",   value: `₹${fmt(stats.revenue?.month)}`,   color: "#10b981", bg: "#f0fdf4", Icon: TrendingUp, trend: "up" },
                  { label: "Pending Bills",   value: stats.bills?.pending,               color: "#ef4444", bg: "#fff5f5", Icon: Clock, trend: null },
                  { label: "Month Expenses",  value: `₹${fmt(stats.expenses?.month)}`,  color: "#6366f1", bg: "#eef2ff", Icon: TrendingDown, trend: "down" },
                ].map((s, i) => (
                  <div key={i} className="fin-stat">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <s.Icon size={20} color={s.color} />
                    </div>
                    <div>
                      <div style={{ fontSize:20, fontWeight: 800, color: "#1e293b" }}>{s.value}</div>
                      <div style={{ fontSize:10, color: "#94a3b8", marginTop: 1 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Status Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Bills",  value: stats.bills?.total,   color: "#334155", bg: "#f8fafc" },
                  { label: "Paid",         value: stats.bills?.paid,    color: "#16a34a", bg: "#f0fdf4" },
                  { label: "Partial",      value: stats.bills?.partial, color: "#0A6B70", bg: "#E6F4F4" },
                  { label: "Pending",      value: stats.bills?.pending, color: "#ef4444", bg: "#fff5f5" },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize:24, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize:10, color: "#64748b" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Expense Breakdown */}
              {stats.expenses && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div style={{ background: "#E6F4F4", borderRadius: 14, padding: "16px 20px", border: "1px solid #B3E0E0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0A6B70", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <TrendingDown size={18} color="#fff" />
                      </div>
                      <div style={{ fontSize:10, color: "#1e40af", fontWeight: 700, letterSpacing: ".05em" }}>OPERATIONAL EXPENSES</div>
                    </div>
                    <div style={{ fontSize:22, fontWeight: 800, color: "#1e293b" }}>₹{fmt(stats.expenses.breakdown?.fromExpenseTable || 0)}</div>
                    <div style={{ fontSize:10, color: "#64748b", marginTop: 4 }}>Salary, utilities, maintenance, etc.</div>
                  </div>
                  <div style={{ background: "#fef3c7", borderRadius: 14, padding: "16px 20px", border: "1px solid #fde68a" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Wallet size={18} color="#fff" />
                      </div>
                      <div style={{ fontSize:10, color: "#b45309", fontWeight: 700, letterSpacing: ".05em" }}>INVENTORY PURCHASES</div>
                    </div>
                    <div style={{ fontSize:22, fontWeight: 800, color: "#1e293b" }}>₹{fmt(stats.expenses.breakdown?.fromInventoryPurchases || 0)}</div>
                    <div style={{ fontSize:10, color: "#64748b", marginTop: 4 }}>Medicine & supplies procurement</div>
                  </div>
                </div>
              )}

              {/* Recent Bills + Revenue by Source */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
                <div className="fin-card">
                  <div className="fin-card-hd">
                    <span className="fin-card-title"><FileText size={14} color="#f59e0b" />Recent Bills</span>
                    <button onClick={() => setTab("bills")} style={{ fontSize:10, color: "#f59e0b", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View All →</button>
                  </div>
                  <table className="fin-tbl">
                    <thead><tr><th>Bill No</th><th>Patient</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {(stats.recentBills || []).slice(0, 6).map((b: any) => {
                        const sc = STATUS_CFG[b.status] || STATUS_CFG.PENDING;
                        return (
                          <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setViewBillId(b.id)}>
                            <td style={{ fontWeight: 700, color: "#f59e0b" }}>{b.billNo}</td>
                            <td>{b.patient?.name}<div style={{ fontSize:10, color: "#94a3b8" }}>{b.patient?.patientId}</div></td>
                            <td style={{ fontWeight: 700 }}>₹{fmt(b.total)}</td>
                            <td><span style={{ padding: "3px 8px", borderRadius: 100, fontSize:10, fontWeight: 700, background: sc.bg, color: sc.color }}>{sc.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="fin-card">
                  <div className="fin-card-hd">
                    <span className="fin-card-title"><BarChart3 size={14} color="#f59e0b" />Revenue by Source</span>
                    <span style={{ fontSize:10, color: "#94a3b8" }}>This Month</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {(stats.revenueBySource || []).map((s: any) => {
                      const maxVal = Math.max(...(stats.revenueBySource || []).map((x: any) => x._sum.amount || 0), 1);
                      const pct = ((s._sum.amount || 0) / maxVal) * 100;
                      const colors: Record<string, string> = { CONSULTATION: "#f59e0b", PROCEDURE: "#10b981", BED_CHARGE: "#6366f1", PHARMACY: "#0E898F", LAB_TEST: "#8b5cf6", OTHER: "#94a3b8" };
                      const c = colors[s.sourceType] || "#94a3b8";
                      return (
                        <div key={s.sourceType} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize:11, marginBottom: 4 }}>
                            <span style={{ color: "#475569", fontWeight: 500 }}>{s.sourceType.replace(/_/g, " ")}</span>
                            <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{fmt(s._sum.amount)}</span>
                          </div>
                          <div style={{ height: 6, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 100, transition: "width .5s" }} />
                          </div>
                        </div>
                      );
                    })}
                    {(!stats.revenueBySource || stats.revenueBySource.length === 0) && (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize:11 }}>No revenue data this month</div>
                    )}
                  </div>
                </div>
              </div>
            </>)}
            {tab === "overview" && !stats && (
              <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}><Loader2 size={24} style={{ animation: "spin .7s linear infinite" }} /></div>
            )}

            {/* ═══ BILLS ═══ */}
            {tab === "bills" && (<>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", flex: 1, minWidth: 200 }}>
                  <input value={billSearch} onChange={e => setBillSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadBills()} placeholder="Search bill no, patient…" style={{ border: "none", outline: "none", fontSize:12, color: "#334155", background: "none", width: "100%" }} />
                </div>
                <input type="date" value={billDateFrom} onChange={e => setBillDateFrom(e.target.value)}
                  title="From date" style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize:12, color: "#334155", outline: "none", background: "#fff" }} />
                <span style={{ color: "#94a3b8", fontSize:11 }}>–</span>
                <input type="date" value={billDateTo} onChange={e => setBillDateTo(e.target.value)}
                  title="To date" style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize:12, color: "#334155", outline: "none", background: "#fff" }} />
                <select value={billStatus} onChange={e => { setBillStatus(e.target.value); }} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize:12, background: "#fff", color: "#334155", outline: "none" }}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIALLY_PAID">Partial</option>
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <button onClick={loadBills} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid #fde68a", background: "#fffbeb", color: "#b45309", fontSize:12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Filter size={13} />Filter
                </button>
                {(billDateFrom || billDateTo || billStatus || billSearch) && (
                  <button onClick={() => { setBillDateFrom(""); setBillDateTo(""); setBillStatus(""); setBillSearch(""); }} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize:11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <X size={12} />Clear
                  </button>
                )}
                <a
                  href={`/api/export/billing${(() => { const p = new URLSearchParams(); if (billStatus) p.set("status",billStatus); if (billSearch) p.set("search",billSearch); if (billDateFrom) p.set("dateFrom",billDateFrom); if (billDateTo) p.set("dateTo",billDateTo); const s = p.toString(); return s ? `?${s}` : ""; })()}`}
                  download title="Export bills as CSV"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
                ><Download size={13} />Export CSV</a>
                <button onClick={() => setShowNewBill(true)} className="fin-primary"><Plus size={14} />New Bill</button>
              </div>

              {/* Summary bar */}
              {billsMeta.stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
                  {[
                    { label: "Today Revenue",  value: `₹${fmt(billsMeta.stats.todayRevenue)}`,  color: "#f59e0b" },
                    { label: "Month Revenue",   value: `₹${fmt(billsMeta.stats.monthRevenue)}`,  color: "#10b981" },
                    { label: "Pending Bills",   value: billsMeta.stats.pendingCount,              color: "#ef4444" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize:11, color: "#64748b" }}>{s.label}</span>
                      <span style={{ fontSize:17, fontWeight: 800, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="fin-card" style={{ marginBottom: 0 }}>
                <div className="fin-card-hd">
                  <span className="fin-card-title"><FileText size={14} color="#f59e0b" />All Bills</span>
                  {billsLoading && <Loader2 size={14} color="#f59e0b" style={{ animation: "spin .7s linear infinite" }} />}
                </div>
                {billsLoading && bills.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}><Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} /></div>
                ) : bills.length === 0 ? (
                  <div style={{ padding: 56, textAlign: "center", color: "#94a3b8" }}><FileText size={36} color="#e2e8f0" style={{ marginBottom: 10 }} /><div style={{ fontWeight: 600, fontSize:13 }}>No bills found</div></div>
                ) : (
                  <table className="fin-tbl">
                    <thead><tr><th>Bill No</th><th>Patient</th><th>Date</th><th>Items</th><th>Total</th><th>Paid</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {bills.map((b: any) => {
                        const sc = STATUS_CFG[b.status] || STATUS_CFG.PENDING;
                        return (
                          <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setViewBillId(b.id)}>
                            <td style={{ fontWeight: 700, color: "#f59e0b" }}>{b.billNo}</td>
                            <td><div style={{ fontWeight: 600, color: "#1e293b" }}>{b.patient?.name}</div><div style={{ fontSize:10, color: "#94a3b8" }}>{b.patient?.patientId}</div></td>
                            <td style={{ fontSize:10, color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(b.createdAt)}</td>
                            <td style={{ color: "#64748b" }}>{b.billItems?.length || "—"}</td>
                            <td style={{ fontWeight: 700, color: "#1e293b" }}>₹{fmt(b.total)}</td>
                            <td style={{ fontWeight: 600, color: "#16a34a" }}>₹{fmt(b.paidAmount)}</td>
                            <td><span style={{ padding: "3px 10px", borderRadius: 100, fontSize:10, fontWeight: 700, background: sc.bg, color: sc.color }}>{sc.label}</span></td>
                            <td onClick={e => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: 5 }}>
                                {b.status !== "PAID" && b.status !== "CANCELLED" && (
                                  <button onClick={() => setPayBill(b)} className="fin-btn" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}><CreditCard size={11} />Pay</button>
                                )}
                                <button onClick={() => setViewBillId(b.id)} className="fin-btn" style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}><FileText size={11} />View</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>)}

            {/* ═══ PAYMENTS ═══ */}
            {tab === "payments" && (<>
              <PaymentsTab />
            </>)}

            {/* ═══ EXPENSES ═══ */}
            {tab === "expenses" && (<>
              {showExpForm && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) { setShowExpForm(false); setEditExp(null); } }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 24px 60px rgba(0,0,0,.18)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <div style={{ fontSize:17, fontWeight: 800, color: "#1e293b" }}>{editExp ? "Edit Expense" : "Add Expense"}</div>
                      <button onClick={() => { setShowExpForm(false); setEditExp(null); }} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div style={{ gridColumn: "1/-1" }}>
                        <label className="fin-lbl">Title *</label>
                        <input className="fin-input" value={expForm.title} onChange={e => setExpForm(f => ({ ...f, title: e.target.value }))} placeholder="Expense title" />
                      </div>
                      <div>
                        <label className="fin-lbl">Category *</label>
                        <select className="fin-input" value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}>
                          {EXPENSE_CATS.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="fin-lbl">Amount (₹) *</label>
                        <input className="fin-input" type="number" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                      </div>
                      <div style={{ gridColumn: "1/-1" }}>
                        <label className="fin-lbl">Date *</label>
                        <input className="fin-input" type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: "1/-1" }}>
                        <label className="fin-lbl">Description</label>
                        <input className="fin-input" value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details" />
                      </div>
                    </div>
                    {expMsg && <div style={{ fontSize:11, color: "#ef4444", marginTop: 12 }}>{expMsg}</div>}
                    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                      <button onClick={saveExpense} disabled={expSaving} className="fin-primary">
                        {expSaving ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={14} />}
                        {editExp ? "Update" : "Add Expense"}
                      </button>
                      <button onClick={() => { setShowExpForm(false); setEditExp(null); }} style={{ padding: "10px 18px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize:12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Expense Category Summary */}
              {expMeta.stats?.categoryBreakdown?.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 18 }}>
                  {expMeta.stats.categoryBreakdown.slice(0, 5).map((c: any) => (
                    <div key={c.category} style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize:10, color: "#64748b", marginBottom: 4 }}>{c.category.replace(/_/g, " ")}</div>
                      <div style={{ fontSize:17, fontWeight: 800, color: "#6366f1" }}>₹{fmt(c._sum.amount)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expense Breakdown Info */}
              {expMeta.stats && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                  <div style={{ background: "#E6F4F4", borderRadius: 12, padding: "14px 18px", border: "1px solid #B3E0E0" }}>
                    <div style={{ fontSize:10, color: "#1e40af", marginBottom: 4, fontWeight: 600 }}>OPERATIONAL EXPENSES</div>
                    <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>₹{fmt(expMeta.stats.fromExpenseTable || 0)}</div>
                    <div style={{ fontSize:10, color: "#64748b", marginTop: 2 }}>Salary, utilities, maintenance, etc.</div>
                  </div>
                  <div style={{ background: "#fef3c7", borderRadius: 12, padding: "14px 18px", border: "1px solid #fde68a" }}>
                    <div style={{ fontSize:10, color: "#b45309", marginBottom: 4, fontWeight: 600 }}>INVENTORY PURCHASES</div>
                    <div style={{ fontSize:19, fontWeight: 800, color: "#1e293b" }}>₹{fmt(expMeta.stats.fromInventoryPurchases || 0)}</div>
                    <div style={{ fontSize:10, color: "#64748b", marginTop: 2 }}>Medicine & supplies procurement</div>
                  </div>
                </div>
              )}

              <div className="fin-card" style={{ marginBottom: 0 }}>
                <div className="fin-card-hd">
                  <span className="fin-card-title"><TrendingDown size={14} color="#6366f1" />Expenses</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize:12, fontWeight: 700, color: "#6366f1" }}>Month: ₹{fmt(expMeta.stats?.monthTotal)}</span>
                    <a href="/api/export/expenses" download title="Export expenses as CSV"
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:11, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
                    ><Download size={12} />Export</a>
                    <button onClick={() => { setShowExpForm(true); setEditExp(null); }} className="fin-primary" style={{ padding: "6px 14px", fontSize:11 }}><Plus size={13} />Add</button>
                  </div>
                </div>
                {expLoading ? (
                  <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}><Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} /></div>
                ) : expenses.length === 0 ? (
                  <div style={{ padding: 56, textAlign: "center", color: "#94a3b8" }}><TrendingDown size={36} color="#e2e8f0" style={{ marginBottom: 10 }} /><div>No expenses recorded</div></div>
                ) : (
                  <table className="fin-tbl">
                    <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Description</th><th>Actions</th></tr></thead>
                    <tbody>
                      {expenses.map((ex: any) => (
                        <tr key={ex.id}>
                          <td style={{ whiteSpace: "nowrap", fontSize:10 }}>{fmtDate(ex.date)}</td>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>{ex.title}</td>
                          <td><span style={{ padding: "2px 8px", borderRadius: 100, background: "#eef2ff", color: "#4338ca", fontSize:10, fontWeight: 700 }}>{ex.category.replace(/_/g, " ")}</span></td>
                          <td style={{ fontWeight: 700, color: "#6366f1" }}>₹{fmt(ex.amount)}</td>
                          <td style={{ color: "#94a3b8", fontSize:11 }}>{ex.description || "—"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button onClick={() => { setEditExp(ex); setExpForm({ title: ex.title, category: ex.category, amount: String(ex.amount), date: ex.date?.split("T")[0] || new Date().toISOString().split("T")[0], description: ex.description || "" }); setShowExpForm(true); }} className="fin-btn" style={{ background: "#E6F4F4", color: "#0A6B70", border: "1px solid #B3E0E0" }}><Pencil size={11} /></button>
                              <button onClick={() => deleteExpense(ex.id)} className="fin-btn" style={{ background: "#fff5f5", color: "#ef4444", border: "1px solid #fecaca" }}><Trash2 size={11} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>)}

            {/* ═══ REPORTS ═══ */}
            {tab === "reports" && (<>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "Today Revenue",  value: `₹${fmt(revMeta.stats?.today)}`,  color: "#f59e0b", Icon: IndianRupee },
                  { label: "Month Revenue",  value: `₹${fmt(revMeta.stats?.month)}`,  color: "#10b981", Icon: TrendingUp },
                ].map((s, i) => (
                  <div key={i} className="fin-stat">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.Icon size={20} color={s.color} />
                    </div>
                    <div>
                      <div style={{ fontSize:22, fontWeight: 800, color: "#1e293b" }}>{s.value}</div>
                      <div style={{ fontSize:10, color: "#94a3b8" }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue by source chart */}
              {revMeta.stats?.bySource?.length > 0 && (
                <div className="fin-card" style={{ marginBottom: 18 }}>
                  <div className="fin-card-hd">
                    <span className="fin-card-title"><BarChart3 size={14} color="#f59e0b" />Revenue by Source (This Month)</span>
                  </div>
                  <div style={{ padding: 20 }}>
                    {revMeta.stats.bySource.map((s: any) => {
                      const maxVal = Math.max(...revMeta.stats.bySource.map((x: any) => x._sum.amount || 0), 1);
                      const pct = ((s._sum.amount || 0) / maxVal) * 100;
                      const colors: Record<string, string> = { CONSULTATION: "#f59e0b", PROCEDURE: "#10b981", BED_CHARGE: "#6366f1", PHARMACY: "#0E898F", LAB_TEST: "#8b5cf6", OTHER: "#94a3b8" };
                      const c = colors[s.sourceType] || "#94a3b8";
                      return (
                        <div key={s.sourceType} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize:11 }}>
                            <span style={{ fontWeight: 600, color: "#334155" }}>{s.sourceType.replace(/_/g, " ")}</span>
                            <span style={{ fontWeight: 800, color: "#1e293b" }}>₹{fmt(s._sum.amount)}</span>
                          </div>
                          <div style={{ height: 10, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 100 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="fin-card" style={{ marginBottom: 0 }}>
                <div className="fin-card-hd">
                  <span className="fin-card-title"><Activity size={14} color="#f59e0b" />Revenue Log</span>
                  <a href="/api/export/revenue" download title="Export revenue as CSV"
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, border: "1px solid #d1fae5", background: "#f0fdf4", color: "#059669", fontSize:11, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
                  ><Download size={12} />Export</a>
                </div>
                <table className="fin-tbl">
                  <thead><tr><th>Date</th><th>Source</th><th>Description</th><th>Amount</th></tr></thead>
                  <tbody>
                    {revenue.map((r: any) => (
                      <tr key={r.id}>
                        <td style={{ fontSize:10, whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</td>
                        <td><span style={{ padding: "2px 8px", borderRadius: 100, background: "#fffbeb", color: "#b45309", fontSize:10, fontWeight: 700 }}>{r.sourceType.replace(/_/g, " ")}</span></td>
                        <td style={{ color: "#64748b", fontSize:11 }}>{r.description || "—"}</td>
                        <td style={{ fontWeight: 700, color: "#10b981" }}>₹{fmt(r.amount)}</td>
                      </tr>
                    ))}
                    {revenue.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No revenue entries yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>)}

          </div>
        </main>
      </div>
    </>
  );
}

// ── Payments Tab (separate component to avoid hook issues) ───────────────────
function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/billing?limit=50&status=PAID", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const allPayments: any[] = [];
          (d.data?.bills || []).forEach((b: any) => {
            (b.payments || []).forEach((p: any) => allPayments.push({ ...p, bill: b }));
          });
          allPayments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
          setPayments(allPayments);
        }
        setLoading(false);
      });
  }, []);

  const fmt2 = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

  return (
    <>
      <div className="fin-card" style={{ marginBottom: 0 }}>
        <div className="fin-card-hd">
          <span className="fin-card-title"><CreditCard size={14} color="#f59e0b" />Payment History</span>
          {loading && <Loader2 size={14} color="#f59e0b" style={{ animation: "spin .7s linear infinite" }} />}
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}><Loader2 size={22} style={{ animation: "spin .7s linear infinite" }} /></div>
        ) : payments.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center", color: "#94a3b8" }}><CreditCard size={36} color="#e2e8f0" style={{ marginBottom: 10 }} /><div>No payments yet</div></div>
        ) : (
          <table className="fin-tbl">
            <thead><tr><th>Date</th><th>Bill</th><th>Patient</th><th>Amount</th><th>Method</th><th>Transaction ID</th></tr></thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontSize:10, whiteSpace: "nowrap" }}>{new Date(p.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td style={{ fontWeight: 700, color: "#f59e0b" }}>{p.bill?.billNo}</td>
                  <td>{p.bill?.patient?.name}<div style={{ fontSize:10, color: "#94a3b8" }}>{p.bill?.patient?.patientId}</div></td>
                  <td style={{ fontWeight: 800, color: "#10b981" }}>₹{fmt2(p.amount)}</td>
                  <td><span style={{ padding: "3px 10px", borderRadius: 100, background: "#f0fdf4", color: "#16a34a", fontSize:10, fontWeight: 700 }}>{p.method}</span></td>
                  <td style={{ color: "#94a3b8", fontSize:11 }}>{p.transactionId || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
