"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Search, RefreshCw, Loader2, CreditCard,
  Receipt, CheckCircle2, Clock, Building2, Eye, X, Plus, Trash2,
  Printer, Phone, Mail, MapPin, IndianRupee, ChevronRight, ChevronDown, ArrowUpDown,
  Stethoscope, CheckCircle, Tag, PercentIcon, Download, CalendarDays,
  FileText, Table2, FileEdit, FileSpreadsheet,
  Banknote, Smartphone, ShieldCheck, Settings2, Send, XCircle, AlertTriangle
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QueueItem {
  id: string;
  patient: { id: string; name: string; patientId: string; phone?: string; email?: string };
  doctor: { id: string; name: string; specialization?: string };
  department?: { id: string; name: string };
  subDepartment?: { id: string; name: string; type: string };
  appointmentDate: string;
  timeSlot: string;
  consultationFee: number;
  bill?: {
    id: string;
    billNo: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paidAmount: number;
    paidAt?: string | null;
    paymentMethod?: string | null;
    status: string;
    isGst: boolean;
    cgst: number;
    sgst: number;
    igst: number;
    billItems: Array<{ id: string; name: string; quantity: number; unitPrice: number; amount: number; type: string; referenceId?: string }>;
    prescription?: { prescriptionNo?: string; diagnosis?: string; medications?: string; doctor?: { name: string } };
    notes?: string | null;
    payments?: Array<{ id: string; amount: number; method: string; notes?: string | null; paidAt: string }>;
  };
  billingNote?: string;
}

interface HospitalInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  gstNumber?: string;
  registrationNo?: string;
  letterhead?: string;
  letterheadType?: string;
  letterheadSize?: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "#E6F4F4", color: "#0E898F", label: "Pending" },
  PARTIALLY_PAID: { bg: "#fffbeb", color: "#b45309", label: "Partially Paid" },
  PAID: { bg: "#f0fdf4", color: "#166534", label: "Paid" },
  CANCELLED: { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
  DRAFT: { bg: "#f1f5f9", color: "#475569", label: "Draft" },
};

const fmtCur = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Split billItems into non-pharmacy charges and enriched pharmacy medicine rows
function splitBillItems(bill: any) {
  const allItems = bill?.billItems || [];
  const rx = bill?.prescription;
  const pharmacyItems = allItems.filter((it: any) => it.type === "PHARMACY");
  const nonPharmacyItems = allItems.filter((it: any) => it.type !== "PHARMACY");
  // Parse medications JSON for dosage/frequency enrichment
  let medsMap: Record<string, any> = {};
  if (rx?.medications) {
    try {
      const meds = typeof rx.medications === "string" ? JSON.parse(rx.medications) : rx.medications;
      if (Array.isArray(meds)) meds.forEach((m: any) => { medsMap[(m.name || "").toLowerCase().trim()] = m; });
    } catch {}
  }
  // Enrich pharmacy items with dosage/frequency from medications JSON
  const enrichedPharmacy = pharmacyItems.map((it: any) => {
    const key = (it.name || "").toLowerCase().trim();
    const med = medsMap[key] || {};
    return { ...it, dosage: med.dosage || "—", frequency: med.frequency || "—" };
  });
  const pharmacyTotal = enrichedPharmacy.reduce((s: number, it: any) => s + (it.amount || 0), 0);
  return { nonPharmacyItems, enrichedPharmacy, pharmacyTotal, rxNo: rx?.prescriptionNo, diagnosis: rx?.diagnosis, rxDoctor: rx?.doctor?.name };
}
const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; } };
function getPharmacyItemsTotal(bill: any): number {
  return (bill?.billItems || []).filter((it: any) => it.type === "PHARMACY").reduce((s: number, it: any) => s + (it.amount || 0), 0);
}
function getProcedureItemsTotal(bill: any): number {
  return (bill?.billItems || []).filter((it: any) => it.type === "PROCEDURE").reduce((s: number, it: any) => s + (it.amount || 0), 0);
}
function getProcedureScopedBill(bill: any, scope?: string): any {
  if (scope !== "procedure" || !bill) return bill;
  const procedureItems = (bill.billItems || []).filter((it: any) => it.type === "PROCEDURE");
  const subtotal = procedureItems.reduce((s: number, it: any) => s + (it.amount || 0), 0);
  return { ...bill, billItems: procedureItems, subtotal, total: subtotal };
}
// Returns bill scoped to items still needing collection (non-procedure, when sub-dept already collected procedure charges)
function getRemainingChargesBill(bill: any, scope?: string): any {
  if (!bill || scope === "procedure") return bill;
  const paid = bill.paidAmount || 0;
  // Only filter procedure items if a sub-dept has already collected them (indicated by notes)
  const subDeptAlreadyCollected = paid > 0
    && (bill.billItems || []).some((bi: any) => bi.type === "PROCEDURE")
    && (bill.notes || "").includes("Collected by");
  if (!subDeptAlreadyCollected) return bill;
  const remainingItems = (bill.billItems || []).filter((bi: any) => bi.type !== "PROCEDURE");
  const subtotal = remainingItems.reduce((s: number, bi: any) => s + (bi.amount || 0), 0);
  return { ...bill, billItems: remainingItems, subtotal, total: subtotal };
}
const fmtTime = (t: string) => {
  try {
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    const ampm = hr >= 12 ? "PM" : "AM";
    const hr12 = hr % 12 || 12;
    return `${hr12}:${m} ${ampm}`;
  } catch { return t; }
};

const api = async (url: string, opts?: RequestInit) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const r = await fetch(url, { credentials: "include", signal: controller.signal, ...opts });
    clearTimeout(timer);
    const text = await r.text();
    try { return JSON.parse(text); } catch { return { success: false, message: text || "Invalid response" }; }
  } catch (e: any) {
    clearTimeout(timer);
    return { success: false, message: e.name === "AbortError" ? "Request timed out" : (e.message || "Network error") };
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EMPTY_COLLECT = {
  isGst: false, cgst: 9, sgst: 9, igst: 0, discount: 0, discountRemark: "",
  newChargeName: "", newChargeQty: 1, newChargeRate: 0,
  addedCharges: [] as Array<{name: string; quantity: number; unitPrice: number; amount: number}>,
  method: "CASH", amount: "", transactionId: "", notes: ""
};

export default function BillingQueue({ scope, subDeptId, deptName, defaultCollectBillId, onDefaultCollectConsumed }: { scope?: "lab" | "pharmacy" | "procedure"; subDeptId?: string; deptName?: string; defaultCollectBillId?: string; onDefaultCollectConsumed?: () => void } = {}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "collect" | null>(null);
  const [collectStep, setCollectStep] = useState<"billing" | "receipt">("billing");
  const [collectForm, setCollectForm] = useState(EMPTY_COLLECT);
  const [paidBill, setPaidBill] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; item: QueueItem | null }>({ show: false, item: null });
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>({ name: "Hospital", address: "", phone: "", email: "", logo: "", gstNumber: "", registrationNo: "", letterhead: "", letterheadType: "IMAGE", letterheadSize: "A4" });
  const printRef = useRef<HTMLDivElement>(null);

  // Caches for PDF generation performance
  const imgCache = useRef<Record<string, string | null>>({});
  const jsPdfCache = useRef<{ jsPDF: any; autoTable: any } | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error" | "warning"; title: string; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (type: "success" | "error" | "warning", title: string, message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, type, title, message });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });

  // Global all-time stats (independent of date filter)
  const [globalStats, setGlobalStats] = useState({ queueCount: 0, pendingCount: 0, pendingAmount: 0, totalCollected: 0, todayCollected: 0, totalDiscount: 0 });

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams();
      if (scope === "pharmacy") params.set("pharmacyOnly", "true");
      if (scope === "lab") params.set("labOnly", "true");
      if (scope === "procedure") { params.set("procedureOnly", "true"); if (subDeptId) params.set("subDeptId", subDeptId); }
      const d = await api(`/api/billing/queue?${params}`);
      const items: QueueItem[] = d.data || [];
      const todayStr = new Date().toISOString().split("T")[0];
      const getAmt = (q: QueueItem) => scope === "pharmacy" ? getPharmacyItemsTotal(q.bill) : scope === "procedure" ? getProcedureItemsTotal(q.bill) : (q.bill?.total || 0);
      const getRemainingAmt = (q: QueueItem) => {
        if (scope !== "procedure" && q.bill?.status === "PARTIALLY_PAID") return Math.max(0, (q.bill?.total || 0) - (q.bill?.paidAmount || 0));
        return getAmt(q);
      };
      setGlobalStats({
        queueCount: items.length,
        pendingCount: items.filter(q => q.bill?.status === "PENDING" || q.bill?.status === "PARTIALLY_PAID").length,
        pendingAmount: items.reduce((s, q) => s + (q.bill?.status !== "PAID" && q.bill?.status !== "CANCELLED" ? getRemainingAmt(q) : 0), 0),
        totalCollected: items.reduce((s, q) => s + (q.bill?.status === "PAID" ? getAmt(q) : 0), 0),
        todayCollected: items.filter(q => q.bill?.paidAt && new Date(q.bill.paidAt).toISOString().slice(0, 10) === todayStr && q.bill?.status === "PAID").reduce((s, q) => s + getAmt(q), 0),
        totalDiscount: items.reduce((s, q) => s + (q.bill?.discount || 0), 0),
      });
    })();
  }, [scope, subDeptId]);

  // Status filter
  const [statusFilter, setStatusFilter] = useState<"all" | "PAID" | "PENDING">("all");

  // Sort state
  const [sortBy, setSortBy] = useState<string>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const selectableItems = useMemo(() => queue.filter(q => q.bill), [queue]);
  const emailableItems = useMemo(() => queue.filter(q => q.bill && q.patient.email), [queue]);
  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => {
    const allIds = selectableItems.map(q => q.id);
    setSelectedIds(prev => allIds.every(id => prev.has(id)) ? new Set() : new Set(allIds));
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (dateFilter) params.set("date", dateFilter);
    if (scope === "lab") params.set("labOnly", "true");
    if (scope === "pharmacy") params.set("pharmacyOnly", "true");
    if (scope === "procedure") { params.set("procedureOnly", "true"); if (subDeptId) params.set("subDeptId", subDeptId); }
    const d = await api(`/api/billing/queue?${params}`);
    let items = d.data || [];
    if (scope === "lab") items = items.filter((q: any) => q.source === "lab_order" || q.bill?.billItems?.some((bi: any) => bi.type === "LAB_TEST") || q.bill?.notes?.includes("Lab Order") || q.bill?.billNo?.startsWith("LAB-"));
    if (scope === "pharmacy") items = items.filter((q: any) => q.source === "pharmacy" || q.source === "pharmacy_counter" || q.bill?.billItems?.some((bi: any) => bi.type === "PHARMACY"));
    if (scope === "procedure") items = items.filter((q: any) => q.bill?.billItems?.some((bi: any) => bi.type === "PROCEDURE"));
    if (d.success) setQueue(items);
    setLoading(false);
  }, [search, dateFilter, scope, subDeptId]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  // Auto-open collect modal when defaultCollectBillId is provided and queue has loaded
  useEffect(() => {
    if (!defaultCollectBillId || loading || queue.length === 0) return;
    const item = queue.find(q => q.bill?.id === defaultCollectBillId);
    if (item) {
      handleCollect(item);
      onDefaultCollectConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCollectBillId, loading, queue]);

  useEffect(() => {
    // Load hospital info from settings (has logo + all configured details)
    (async () => {
      try {
        const settingsRes = await api("/api/config/settings");
        if (settingsRes.success && settingsRes.data?.settings) {
          const s = settingsRes.data.settings;
          setHospitalInfo({
            name: s.hospitalName || "Hospital",
            address: s.address || "",
            phone: s.phone || "",
            email: s.email || "",
            logo: s.logo || "",
            gstNumber: s.gstNumber || "",
            registrationNo: s.registrationNo || "",
            letterhead: s.letterhead || "",
            letterheadType: s.letterheadType || "IMAGE",
            letterheadSize: s.letterheadSize || "A4",
          });
          return;
        }
      } catch {}
      // Fallback to hospital details
      try {
        const detailsRes = await api("/api/hospital/details");
        if (detailsRes.success && detailsRes.data) {
          const h = detailsRes.data;
          const s = h.settings;
          setHospitalInfo({
            name: s?.hospitalName || h.name || "Hospital",
            address: s?.address || "",
            phone: s?.phone || h.mobile || "",
            email: s?.email || h.email || "",
            logo: s?.logo || "",
            gstNumber: s?.gstNumber || "",
            registrationNo: s?.registrationNo || "",
            letterhead: s?.letterhead || "",
            letterheadType: s?.letterheadType || "IMAGE",
            letterheadSize: s?.letterheadSize || "A4",
          });
        }
      } catch {}
    })();
  }, []);

  const handleView = (item: QueueItem) => {
    setSelectedItem(item);
    setViewMode("view");
  };

  const handleCollect = (item: QueueItem) => {
    setSelectedItem(item);
    setCollectForm({
      ...EMPTY_COLLECT,
      isGst: item.bill?.isGst || false,
      cgst: item.bill?.cgst || 9,
      sgst: item.bill?.sgst || 9,
      igst: item.bill?.igst || 0,
      discount: item.bill?.discount || 0,
    });
    setCollectStep("billing");
    setPaidBill(null);
    setViewMode("collect");
  };

  const handleDelete = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    setDeleting(billId);
    const d = await api(`/api/billing/${billId}`, { method: "DELETE" });
    if (d.success) loadQueue();
    else showToast("error", "Delete Failed", d.message || "Failed to delete bill");
    setDeleting(null);
  };

  const handleRegenerate = async (item: QueueItem) => {
    if (!item?.bill?.id) return;
    setConfirmModal({ show: true, item });
  };

  const confirmRegenerate = async () => {
    const item = confirmModal.item;
    if (!item?.bill?.id) return;
    setConfirmModal({ show: false, item: null });
    setReverting(item.bill.id);
    const res = await api(`/api/billing/${item.bill.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revert: true }),
    });
    if (res.success) {
      const revertedBill = res.data || res;
      const updatedItem = { ...item, bill: { ...item.bill, ...revertedBill, status: "PENDING", paidAmount: 0 } };
      setSelectedItem(updatedItem);
      setCollectForm({
        ...EMPTY_COLLECT,
        isGst: revertedBill.isGst || false,
        cgst: revertedBill.cgst || 9,
        sgst: revertedBill.sgst || 9,
        igst: revertedBill.igst || 0,
        discount: revertedBill.discount || 0,
      });
      setCollectStep("billing");
      setPaidBill(null);
      setViewMode("collect");
      loadQueue();
      showToast("success", "Bill Reverted", "Bill reverted to pending. You can now edit and re-collect.");
    } else {
      showToast("error", "Revert Failed", res.message || "Failed to revert bill");
    }
    setReverting(null);
  };

  const handleAddCharge = () => {
    const name = (collectForm.newChargeName || "").trim();
    const qty = Math.max(1, Number(collectForm.newChargeQty) || 1);
    const rate = Number(collectForm.newChargeRate) || 0;
    if (!name || rate <= 0) return;
    const amount = qty * rate;
    const newCharge = { name, quantity: qty, unitPrice: rate, amount };
    setCollectForm(f => ({
      ...f,
      addedCharges: [...(f.addedCharges || []), newCharge],
      newChargeName: "", newChargeQty: 1, newChargeRate: 0
    }));
  };

  const handleRemoveCharge = (idx: number) => {
    setCollectForm(f => ({ ...f, addedCharges: f.addedCharges.filter((_, i) => i !== idx) }));
  };

  const generateBillPDFBase64 = async (item: QueueItem): Promise<string | null> => {
    if (!item?.bill) return null;
    const { jsPDF, autoTable } = await getJsPdf();

    const pageSize = (hospitalInfo.letterheadSize || 'A4').toLowerCase() as 'a4' | 'a5' | 'letter';
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageSize });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const mx = 18;
    const cw = pw - mx * 2;
    const rs = (v: number) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const letterheadDataUrl = await loadImageAsBase64(hospitalInfo.letterhead || '');
    const logoDataUrl = letterheadDataUrl ? null : await loadImageAsBase64(hospitalInfo.logo || '');
    const hasLetterhead = !!letterheadDataUrl;

    let y: number;
    if (hasLetterhead) {
      try { doc.addImage(letterheadDataUrl!, 'PNG', 0, 0, pw, ph); } catch {}
      y = 80;
      const rx = pw - mx;
      doc.setFillColor(14, 137, 143);
      doc.roundedRect(rx - 32, 52, 32, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
      doc.text('INVOICE', rx - 16, 57, { align: 'center' });
      doc.setFontSize(12); doc.setTextColor(30, 41, 59);
      doc.text(item.bill.billNo || 'BILL', rx, 68, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.text('Date: ' + fmtDate(item.appointmentDate), rx, 74, { align: 'right' });
    } else {
      y = 16;
      doc.setFillColor(248, 250, 252); doc.rect(0, 0, pw, 52, 'F');
      doc.setDrawColor(14, 165, 233); doc.setLineWidth(0.8); doc.line(0, 52, pw, 52);
      const infoX = logoDataUrl ? mx + 28 : mx;
      if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', mx, y, 22, 22); } catch {} }
      if (!logoDataUrl) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(14, 165, 233);
        doc.text(hospitalInfo.name || 'Hospital', infoX, y + 6);
      }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      let hy = y + 12;
      if (hospitalInfo.address) { doc.text(hospitalInfo.address, infoX, hy); hy += 4; }
      if (hospitalInfo.phone) { doc.text('Phone: ' + hospitalInfo.phone, infoX, hy); hy += 4; }
      if (hospitalInfo.email) { doc.text('Email: ' + hospitalInfo.email, infoX, hy); hy += 4; }
      if (hospitalInfo.gstNumber) { doc.text('GSTIN: ' + hospitalInfo.gstNumber, infoX, hy); hy += 4; }
      if (hospitalInfo.registrationNo) { doc.text('Reg: ' + hospitalInfo.registrationNo, infoX, hy); }
      const rx = pw - mx;
      doc.setFillColor(14, 165, 233); doc.roundedRect(rx - 32, y, 32, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
      doc.text('INVOICE', rx - 16, y + 5, { align: 'center' });
      doc.setFontSize(12); doc.setTextColor(30, 41, 59);
      doc.text(item.bill.billNo || 'BILL', rx, y + 16, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.text('Date: ' + fmtDate(item.appointmentDate), rx, y + 22, { align: 'right' });
      y = 58;
    }

    // Patient info
    doc.setFillColor(248, 250, 252); doc.roundedRect(mx, y, cw, 24, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2); doc.roundedRect(mx, y, cw, 24, 2, 2, 'S');
    const metaItems = [
      { label: 'Patient Name', value: item.patient.name },
      { label: 'Patient ID', value: item.patient.patientId },
      { label: 'Date & Time', value: fmtDate(item.appointmentDate) + ' | ' + (item.timeSlot ? fmtTime(item.timeSlot) : 'Walk-in') },
      { label: 'Consultation By', value: item.doctor ? 'Dr. ' + item.doctor.name + (item.doctor.specialization ? ' - ' + item.doctor.specialization : '') : 'Walk-in Patient' },
      { label: 'Department', value: item.department?.name || item.subDepartment?.name || '-' },
    ];
    const metaCols = 3; const mColW = cw / metaCols;
    metaItems.forEach((m, i) => {
      const col = i % metaCols; const row = Math.floor(i / metaCols);
      const mX = mx + 4 + col * mColW; const mY = y + 5 + row * 11;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(148, 163, 184);
      doc.text(m.label.toUpperCase(), mX, mY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59);
      doc.text(m.value, mX, mY + 4.5);
    });
    y += 30;

    // Items table (split pharmacy items out)
    const pdf1Bill = getProcedureScopedBill(item.bill, scope);
    const { nonPharmacyItems: npPdf1, enrichedPharmacy: epPdf1, pharmacyTotal: ptPdf1, rxNo: rnPdf1, diagnosis: dgPdf1 } = splitBillItems(pdf1Bill);
    const items = npPdf1.map((it: any, i: number) => [String(i + 1), it.name, String(it.quantity), rs(it.unitPrice), rs(it.amount)]);
    if (items.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['#', 'Description', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']],
        body: items,
        theme: 'striped',
        headStyles: { fillColor: [14, 137, 143], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'left', cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
        bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' } },
        margin: { left: mx, right: mx },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Pharmacy Medicines Detail (PDF)
    if (epPdf1.length > 0) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(190, 24, 93);
      doc.text('Pharmacy — Medicine Details', mx, y + 2);
      if (rnPdf1) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.text('Rx #' + rnPdf1, pw - mx, y + 2, { align: 'right' }); }
      y += 5;
      if (dgPdf1) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139); doc.text('Diagnosis: ' + dgPdf1, mx, y + 2); y += 5; }
      const medRows = epPdf1.map((m: any, i: number) => [String(i + 1), m.name, m.dosage, m.frequency, String(m.quantity), rs(m.unitPrice), rs(m.amount)]);
      medRows.push(['', '', '', '', '', 'Medicine Total:', rs(ptPdf1)]);
      autoTable(doc, {
        startY: y,
        head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Qty', 'Unit Price', 'Amount']],
        body: medRows,
        theme: 'striped',
        headStyles: { fillColor: [252, 231, 243], textColor: [190, 24, 93], fontSize: 7.5, fontStyle: 'bold', halign: 'left', cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 } },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
        alternateRowStyles: { fillColor: [253, 242, 248] },
        columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 }, 4: { cellWidth: 12, halign: 'center' }, 5: { cellWidth: 24, halign: 'right' }, 6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' } },
        margin: { left: mx, right: mx },
        didParseCell: (data: any) => { if (data.section === 'body' && data.row.index === medRows.length - 1) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.textColor = [190, 24, 93]; data.cell.styles.fillColor = [252, 231, 243]; } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Summary
    const sW = 78; const sX = pw - mx - sW;
    const summaryLines: Array<{ label: string; value: string; color?: number[] }> = [];
    summaryLines.push({ label: 'Subtotal', value: rs(pdf1Bill.subtotal || 0) });
    if (pdf1Bill.isGst && pdf1Bill.cgst > 0) summaryLines.push({ label: `CGST (${pdf1Bill.cgst}%)`, value: rs((pdf1Bill.subtotal * pdf1Bill.cgst) / 100) });
    if (pdf1Bill.isGst && pdf1Bill.sgst > 0) summaryLines.push({ label: `SGST (${pdf1Bill.sgst}%)`, value: rs((pdf1Bill.subtotal * pdf1Bill.sgst) / 100) });
    if (pdf1Bill.isGst && pdf1Bill.igst > 0) summaryLines.push({ label: `IGST (${pdf1Bill.igst}%)`, value: rs((pdf1Bill.subtotal * pdf1Bill.igst) / 100) });
    if (pdf1Bill.discount > 0) summaryLines.push({ label: 'Discount', value: '- ' + rs(pdf1Bill.discount), color: [5, 150, 105] });
    const lineH = 6; const boxH = (summaryLines.length * lineH) + lineH + 14;
    doc.setFillColor(248, 250, 252); doc.roundedRect(sX, y, sW, boxH, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2); doc.roundedRect(sX, y, sW, boxH, 2, 2, 'S');
    let sY = y + 6;
    summaryLines.forEach(row => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      doc.setTextColor(...(row.color || [71, 85, 105]) as [number, number, number]);
      doc.text(row.label, sX + 4, sY); doc.text(row.value, sX + sW - 4, sY, { align: 'right' }); sY += lineH;
    });
    doc.setDrawColor(14, 137, 143); doc.setLineWidth(0.4); doc.line(sX + 4, sY - 1, sX + sW - 4, sY - 1); sY += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59);
    doc.text('Total Amount', sX + 4, sY);
    doc.setTextColor(14, 137, 143); doc.setFontSize(11);
    doc.text(rs(pdf1Bill.total || 0), sX + sW - 4, sY, { align: 'right' });
    y += boxH + 8;

    // Payment History section
    if (item.bill.status === 'PAID' || item.bill.status === 'PARTIALLY_PAID') {
      const isPaid = item.bill.status === 'PAID';
      const remaining = Math.max(0, (item.bill.total || 0) - (item.bill.paidAmount || 0));
      const payments: any[] = item.bill.payments || [];
      // Section heading
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
      doc.text('PAYMENT HISTORY', mx, y + 4);
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2);
      doc.line(mx + 40, y + 2, pw - mx, y + 2);
      y += 8;
      // Build table rows from payments array; fallback to bill.notes remark
      const payRows: string[][] = payments.length > 0
        ? payments.map(p => {
            const label = (p.notes || '').match(/Collected by [^—\n]+/)?.[0]?.trim() || 'Payment Received';
            const dateStr = p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            return [label, p.method || '', dateStr, rs(p.amount || 0)];
          })
        : [[
            (item.bill.notes || '').match(/Collected by [^|]+/)?.[0]?.trim() || 'Payment Received',
            item.bill.paymentMethod || '',
            item.bill.paidAt ? new Date(item.bill.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            rs(item.bill.paidAmount || item.bill.total || 0),
          ]];
      // Remaining row for partial
      if (!isPaid && remaining > 0) payRows.push(['Remaining Balance', '', '', rs(remaining)]);
      autoTable(doc, {
        startY: y,
        head: [['Collected By / Remark', 'Method', 'Date', 'Amount']],
        body: payRows,
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontSize: 7.5, fontStyle: 'bold', cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 } },
        columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold' }, 1: { cellWidth: 28 }, 2: { cellWidth: 32 }, 3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' } },
        margin: { left: mx, right: mx },
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            const isRemaining = !isPaid && data.row.index === payRows.length - 1;
            if (isRemaining) {
              data.cell.styles.fillColor = [255, 251, 235];
              data.cell.styles.textColor = [180, 83, 9];
            } else {
              data.cell.styles.fillColor = data.row.index % 2 === 0 ? [240, 253, 244] : [255, 255, 255];
              data.cell.styles.textColor = [22, 101, 52];
            }
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Signature
    const sigY = Math.max(y + 10, ph - (hasLetterhead ? 60 : 50));
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    doc.line(mx, sigY, mx + 55, sigY);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text('Patient / Attendant Signature', mx, sigY + 5);
    doc.line(pw - mx - 55, sigY, pw - mx, sigY);
    doc.text('Authorized Signatory', pw - mx - 55, sigY + 5);

    // Footer
    const footerY = sigY + 14;
    if (!hasLetterhead) {
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.15); doc.line(mx, footerY, pw - mx, footerY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.text('Thank you for choosing ' + (hospitalInfo.name || 'our hospital'), pw / 2, footerY + 5, { align: 'center' });
      doc.setFontSize(7); doc.setTextColor(148, 163, 184);
      doc.text('This is a computer-generated invoice.', pw / 2, footerY + 9, { align: 'center' });
    } else {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
      doc.text('This is a computer-generated invoice.', pw / 2, footerY + 3, { align: 'center' });
    }

    // Return base64 string (strip data URI prefix)
    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1];
  };

  const handleSendEmail = async (item: QueueItem) => {
    if (!item?.bill) return;
    setSendingEmail(item.bill.id);
    try {
      const pdfBase64 = await generateBillPDFBase64(item);
      if (!pdfBase64) { showToast("error", "PDF Error", "Failed to generate PDF for email attachment."); setSendingEmail(null); return; }

      const res = await api(`/api/billing/${item.bill.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64 }),
      });
      console.log("[send-email client] Response:", res);
      if (res.success) {
        showToast("success", "Email Sent!", `Invoice emailed to ${res.data?.email || item.patient.email}`);
      } else {
        showToast("error", "Send Failed", res.message || "Failed to send email");
      }
    } catch (err) {
      console.error('Send email error:', err);
      showToast("error", "Send Failed", "Failed to send email. Please try again.");
    }
    setSendingEmail(null);
  };

  const handleBulkSendEmail = async () => {
    const items = queue.filter(q => selectedIds.has(q.id) && q.bill && q.patient.email);
    if (items.length === 0) { showToast("warning", "No Selection", "Select bills with patient emails to send."); return; }

    setBulkSending(true);
    setBulkProgress({ current: 0, total: items.length, success: 0, failed: 0 });

    let success = 0, failed = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setBulkProgress(p => ({ ...p, current: i + 1 }));
      try {
        const pdfBase64 = await generateBillPDFBase64(item);
        if (!pdfBase64) { failed++; continue; }
        const res = await api(`/api/billing/${item.bill!.id}/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64 }),
        });
        if (res.success) success++; else failed++;
      } catch { failed++; }
      setBulkProgress(p => ({ ...p, success, failed }));
    }

    setBulkSending(false);
    setSelectedIds(new Set());
    if (failed === 0) {
      showToast("success", "Bulk Send Complete!", `Successfully emailed ${success} invoice${success > 1 ? "s" : ""}.`);
    } else {
      showToast("warning", "Bulk Send Done", `${success} sent, ${failed} failed out of ${items.length} invoices.`);
    }
  };

  const liveTotals = useMemo(() => {
    const paidAmount = selectedItem?.bill?.paidAmount || 0;
    const hasPaidProcedures = paidAmount > 0
      && (selectedItem?.bill?.billItems || []).some((bi: any) => bi.type === "PROCEDURE")
      && (selectedItem?.bill?.notes || "").includes("Collected by");
    const base = scope === "procedure"
      ? getProcedureItemsTotal(selectedItem?.bill)
      : hasPaidProcedures
        ? (selectedItem?.bill?.billItems || []).filter((bi: any) => bi.type !== "PROCEDURE").reduce((s: number, bi: any) => s + (bi.amount || 0), 0)
        : (selectedItem?.bill?.subtotal || 0);
    const added = (collectForm.addedCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
    const gross = base + added;
    const gstTotal = collectForm.isGst ? (gross * (collectForm.cgst + collectForm.sgst + collectForm.igst)) / 100 : 0;
    const cgstAmt = collectForm.isGst ? (gross * collectForm.cgst) / 100 : 0;
    const sgstAmt = collectForm.isGst ? (gross * collectForm.sgst) / 100 : 0;
    const igstAmt = collectForm.isGst ? (gross * collectForm.igst) / 100 : 0;
    const total = Math.max(0, gross + gstTotal - (collectForm.discount || 0));
    const remaining = scope === "procedure" ? total : Math.max(0, total);
    return { base, added, gross, gstTotal, cgstAmt, sgstAmt, igstAmt, total, remaining, paidAmount, hasPaidProcedures };
  }, [selectedItem, collectForm]);

  const handleCollectAndGenerate = async () => {
    if (!selectedItem?.bill?.id) return;
    setProcessing(true);
    try {
      // Batch update: add all items + GST/discount in parallel
      const billId = selectedItem.bill!.id;
      const updatePromises = collectForm.addedCharges.map(charge =>
        api(`/api/billing/${billId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addItem: { name: charge.name, unitPrice: charge.unitPrice, quantity: charge.quantity, type: "OTHER" } })
        })
      );
      
      // Wait for all items to be added
      if (updatePromises.length > 0) await Promise.all(updatePromises);
      
      // Apply GST/discount
      await api(`/api/billing/${billId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          discount: collectForm.discount || 0, 
          isGst: collectForm.isGst, 
          cgst: collectForm.cgst, 
          sgst: collectForm.sgst, 
          igst: collectForm.igst 
        })
      });
      
      // Fetch final total from server
      const updatedBill = await api(`/api/billing/${billId}`);
      const fullBillTotal = updatedBill?.data?.total ?? updatedBill?.total ?? liveTotals.total;
      const alreadyPaid = updatedBill?.data?.paidAmount ?? updatedBill?.paidAmount ?? (selectedItem?.bill?.paidAmount || 0);
      // Procedure scope: collect only procedure portion; others: collect only remaining unpaid balance
      const payableTotal = scope === "procedure"
        ? liveTotals.total
        : Math.max(0, fullBillTotal - alreadyPaid);
      
      // Record payment
      const payRes = await api(`/api/billing/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: collectForm.method,
          amount: payableTotal,
          transactionId: collectForm.transactionId || undefined,
          notes: collectForm.notes || undefined,
          collectedBy: deptName || undefined
        })
      });
      
      if (payRes.success) {
        const billRes = await api(`/api/billing/${billId}`);
        const freshBill = billRes.data || billRes;
        setPaidBill(freshBill);
        setCollectStep("receipt");
        setProcessing(false);
        loadQueue();
        
        // Auto-send email entirely in background — never blocks UI
        if (selectedItem?.patient?.email && selectedItem?.bill) {
          (async () => {
            try {
              const emailItem = { ...selectedItem, bill: { ...selectedItem.bill, ...freshBill, status: 'PAID', paidAmount: freshBill.total } };
              const pdfBase64 = await generateBillPDFBase64(emailItem);
              if (pdfBase64) {
                await api(`/api/billing/${billId}/send-email`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pdfBase64 }),
                });
              }
            } catch {}
          })();
        }
      } else {
        setProcessing(false);
        showToast("error", "Payment Failed", payRes.message || "Payment failed");
      }
    } catch (err) {
      console.error('Billing error:', err);
      showToast("error", "Error", "Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const billNo = paidBill?.billNo || selectedItem?.bill?.billNo || "BILL";
    const w = window.open("", "", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Bill ${billNo}</title><style>
      *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#1e293b;background:#fff}
      .bill-print{max-width:780px;margin:0 auto;background-size:100% 100%;background-position:center;background-repeat:no-repeat}.bill-ph{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #0ea5e9;margin-bottom:20px}
      .bill-ph-left h1{font-size:22px;font-weight:800;color:#0ea5e9;margin-bottom:6px}.bill-ph-left p{font-size:12px;color:#64748b;margin-top:3px}
      .bill-ph-right{text-align:right}.bill-ph-right h2{font-size:18px;font-weight:700;color:#1e293b}.bill-ph-right p{font-size:11px;color:#64748b;margin-top:3px}
      .bill-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:20px}
      .bill-meta-item label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:3px}
      .bill-meta-item span{font-size:13px;font-weight:600;color:#1e293b}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      thead{background:#f1f5f9}th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #e2e8f0}
      td{padding:10px 12px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}.text-right{text-align:right}.text-center{text-align:center}
      .summary{max-width:320px;margin-left:auto;background:#f8fafc;padding:16px;border-radius:8px}.summary-row{display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:8px}
      .summary-total{display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1e293b;padding-top:12px;border-top:2px solid #0ea5e9;margin-top:8px}
      .badge{display:inline-block;padding:3px 10px;border-radius:100px;background:#dcfce7;color:#166534;font-size:11px;font-weight:700}
      .payment-strip{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:13px;color:#166534;display:flex;gap:20px}
      .footer{text-align:center;margin-top:28px;padding-top:16px;border-top:1px dashed #e2e8f0;color:#94a3b8;font-size:11px}
      @media print{@page{margin:15mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.bill-print,.bill-print-wrap{-webkit-print-color-adjust:exact;print-color-adjust:exact;background-size:100% 100%!important;background-position:center!important;background-repeat:no-repeat!important}}
    </style></head><body><div class="bill-print">${printContent}</div></body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  // ── Shared: load an image URL as base64 data URL via canvas (cached) ──
  const loadImageAsBase64 = (url: string): Promise<string | null> => {
    if (!url) return Promise.resolve(null);
    if (imgCache.current[url] !== undefined) return Promise.resolve(imgCache.current[url]);
    return new Promise((resolve) => {
      let imgUrl = url;
      if (url.match(/\.pdf$/i) || url.includes('/raw/upload/')) {
        imgUrl = url.replace('/upload/', '/upload/f_png,pg_1/').replace(/\.pdf$/i, '.png');
      }
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext('2d');
            if (ctx) { ctx.drawImage(img, 0, 0); const d = c.toDataURL('image/png'); imgCache.current[url] = d; resolve(d); return; }
          } catch {}
          imgCache.current[url] = null; resolve(null);
        };
        img.onerror = () => { imgCache.current[url] = null; resolve(null); };
        img.src = imgUrl;
      } catch { imgCache.current[url] = null; resolve(null); }
    });
  };

  const getJsPdf = async () => {
    if (jsPdfCache.current) return jsPdfCache.current;
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    jsPdfCache.current = { jsPDF, autoTable };
    return jsPdfCache.current;
  };

  const handleDownloadBillPDF = async (item: QueueItem) => {
    if (!item?.bill) return;
    const { jsPDF, autoTable } = await getJsPdf();

    const pageSize = (hospitalInfo.letterheadSize || 'A4').toLowerCase() as 'a4' | 'a5' | 'letter';
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageSize });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const mx = 18;
    const cw = pw - mx * 2;
    const rs = (v: number) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // ── Load letterhead (or logo as fallback) ──
    const letterheadDataUrl = await loadImageAsBase64(hospitalInfo.letterhead || '');
    const logoDataUrl = letterheadDataUrl ? null : await loadImageAsBase64(hospitalInfo.logo || '');
    const hasLetterhead = !!letterheadDataUrl;

    let y: number;

    if (hasLetterhead) {
      // ── Full-page letterhead background ──
      try { doc.addImage(letterheadDataUrl!, 'PNG', 0, 0, pw, ph); } catch {}
      y = 80; // content starts below letterhead header area

      // Invoice badge + Bill No (overlaid on letterhead, top-right)
      const rx = pw - mx;
      doc.setFillColor(14, 137, 143);
      doc.roundedRect(rx - 32, 52, 32, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('INVOICE', rx - 16, 57, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(item.bill.billNo || 'BILL', rx, 68, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Date: ' + fmtDate(item.appointmentDate), rx, 74, { align: 'right' });
    } else {
      // ── Fallback: programmatic header ──
      y = 16;
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pw, 52, 'F');
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(0.8);
      doc.line(0, 52, pw, 52);

      const infoX = logoDataUrl ? mx + 28 : mx;
      if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', mx, y, 22, 22); } catch {} }
      if (!logoDataUrl) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(14, 165, 233);
        doc.text(hospitalInfo.name || 'Hospital', infoX, y + 6);
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      let hy = y + 12;
      if (hospitalInfo.address) { doc.text(hospitalInfo.address, infoX, hy); hy += 4; }
      if (hospitalInfo.phone) { doc.text('Phone: ' + hospitalInfo.phone, infoX, hy); hy += 4; }
      if (hospitalInfo.email) { doc.text('Email: ' + hospitalInfo.email, infoX, hy); hy += 4; }
      if (hospitalInfo.gstNumber) { doc.text('GSTIN: ' + hospitalInfo.gstNumber, infoX, hy); hy += 4; }
      if (hospitalInfo.registrationNo) { doc.text('Reg: ' + hospitalInfo.registrationNo, infoX, hy); }

      const rx = pw - mx;
      doc.setFillColor(14, 165, 233);
      doc.roundedRect(rx - 32, y, 32, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('INVOICE', rx - 16, y + 5, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(item.bill.billNo || 'BILL', rx, y + 16, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Date: ' + fmtDate(item.appointmentDate), rx, y + 22, { align: 'right' });

      y = 58;
    }

    // ── Patient info ──
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(mx, y, cw, 24, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(mx, y, cw, 24, 2, 2, 'S');

    const metaItems = [
      { label: 'Patient Name', value: item.patient.name },
      { label: 'Patient ID', value: item.patient.patientId },
      { label: 'Date & Time', value: fmtDate(item.appointmentDate) + ' | ' + (item.timeSlot ? fmtTime(item.timeSlot) : 'Walk-in') },
      { label: 'Consultation By', value: item.doctor ? 'Dr. ' + item.doctor.name + (item.doctor.specialization ? ' - ' + item.doctor.specialization : '') : 'Walk-in Patient' },
      { label: 'Department', value: item.department?.name || item.subDepartment?.name || '-' },
    ];
    const metaCols = 3;
    const mColW = cw / metaCols;
    metaItems.forEach((m, i) => {
      const col = i % metaCols;
      const row = Math.floor(i / metaCols);
      const mX = mx + 4 + col * mColW;
      const mY = y + 5 + row * 11;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(m.label.toUpperCase(), mX, mY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(m.value, mX, mY + 4.5);
    });

    y += 30;

    // ── Items table (split pharmacy items out) ──
    const pdf2Bill = getProcedureScopedBill(item.bill, scope);
    const { nonPharmacyItems: npPdf2, enrichedPharmacy: epPdf2, pharmacyTotal: ptPdf2, rxNo: rnPdf2, diagnosis: dgPdf2 } = splitBillItems(pdf2Bill);
    const items = npPdf2.map((it: any, i: number) => [String(i + 1), it.name, String(it.quantity), rs(it.unitPrice), rs(it.amount)]);
    if (items.length > 0) {
      autoTable(doc, {
        startY: y, head: [['#', 'Description', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']], body: items, theme: 'striped',
        headStyles: { fillColor: [14, 137, 143], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'left', cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
        bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' } },
        margin: { left: mx, right: mx },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    // ── Pharmacy Medicines Detail ──
    if (epPdf2.length > 0) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(190, 24, 93);
      doc.text('Pharmacy — Medicine Details', mx, y + 2);
      if (rnPdf2) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.text('Rx #' + rnPdf2, pw - mx, y + 2, { align: 'right' }); }
      y += 5;
      if (dgPdf2) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139); doc.text('Diagnosis: ' + dgPdf2, mx, y + 2); y += 5; }
      const medR = epPdf2.map((m: any, i: number) => [String(i + 1), m.name, m.dosage, m.frequency, String(m.quantity), rs(m.unitPrice), rs(m.amount)]);
      medR.push(['', '', '', '', '', 'Medicine Total:', rs(ptPdf2)]);
      autoTable(doc, {
        startY: y, head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Qty', 'Unit Price', 'Amount']], body: medR, theme: 'striped',
        headStyles: { fillColor: [252, 231, 243], textColor: [190, 24, 93], fontSize: 7.5, fontStyle: 'bold', halign: 'left', cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 } },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
        alternateRowStyles: { fillColor: [253, 242, 248] },
        columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 }, 4: { cellWidth: 12, halign: 'center' }, 5: { cellWidth: 24, halign: 'right' }, 6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' } },
        margin: { left: mx, right: mx },
        didParseCell: (data: any) => { if (data.section === 'body' && data.row.index === medR.length - 1) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.textColor = [190, 24, 93]; data.cell.styles.fillColor = [252, 231, 243]; } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ── Summary ──
    const sW = 78;
    const sX = pw - mx - sW;
    const summaryLines: Array<{ label: string; value: string; color?: number[] }> = [];
    summaryLines.push({ label: 'Subtotal', value: rs(pdf2Bill.subtotal || 0) });
    if (pdf2Bill.isGst && pdf2Bill.cgst > 0) summaryLines.push({ label: `CGST (${pdf2Bill.cgst}%)`, value: rs((pdf2Bill.subtotal * pdf2Bill.cgst) / 100) });
    if (pdf2Bill.isGst && pdf2Bill.sgst > 0) summaryLines.push({ label: `SGST (${pdf2Bill.sgst}%)`, value: rs((pdf2Bill.subtotal * pdf2Bill.sgst) / 100) });
    if (pdf2Bill.isGst && pdf2Bill.igst > 0) summaryLines.push({ label: `IGST (${pdf2Bill.igst}%)`, value: rs((pdf2Bill.subtotal * pdf2Bill.igst) / 100) });
    if (pdf2Bill.discount > 0) summaryLines.push({ label: 'Discount', value: '- ' + rs(pdf2Bill.discount), color: [5, 150, 105] });

    const lineH = 6;
    const boxH = (summaryLines.length * lineH) + lineH + 14;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(sX, y, sW, boxH, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(sX, y, sW, boxH, 2, 2, 'S');

    let sY = y + 6;
    summaryLines.forEach(row => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...(row.color || [71, 85, 105]) as [number, number, number]);
      doc.text(row.label, sX + 4, sY);
      doc.text(row.value, sX + sW - 4, sY, { align: 'right' });
      sY += lineH;
    });

    doc.setDrawColor(14, 137, 143);
    doc.setLineWidth(0.4);
    doc.line(sX + 4, sY - 1, sX + sW - 4, sY - 1);
    sY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Total Amount', sX + 4, sY);
    doc.setTextColor(14, 137, 143);
    doc.setFontSize(11);
    doc.text(rs(pdf2Bill.total || 0), sX + sW - 4, sY, { align: 'right' });

    y += boxH + 8;

    // ── Payment History section ──
    if (item.bill.status === 'PAID' || item.bill.status === 'PARTIALLY_PAID') {
      const isPaid2 = item.bill.status === 'PAID';
      const remaining2 = Math.max(0, (item.bill.total || 0) - (item.bill.paidAmount || 0));
      const payments2: any[] = item.bill.payments || [];
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
      doc.text('PAYMENT HISTORY', mx, y + 4);
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2);
      doc.line(mx + 40, y + 2, pw - mx, y + 2);
      y += 8;
      const payRows2: string[][] = payments2.length > 0
        ? payments2.map((p: any) => {
            const label2 = (p.notes || '').match(/Collected by [^—\n]+/)?.[0]?.trim() || 'Payment Received';
            const dateStr2 = p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            return [label2, p.method || '', dateStr2, rs(p.amount || 0)];
          })
        : [[
            (item.bill.notes || '').match(/Collected by [^|]+/)?.[0]?.trim() || 'Payment Received',
            item.bill.paymentMethod || '',
            item.bill.paidAt ? new Date(item.bill.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
            rs(item.bill.paidAmount || item.bill.total || 0),
          ]];
      if (!isPaid2 && remaining2 > 0) payRows2.push(['Remaining Balance', '', '', rs(remaining2)]);
      autoTable(doc, {
        startY: y,
        head: [['Collected By / Remark', 'Method', 'Date', 'Amount']],
        body: payRows2,
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontSize: 7.5, fontStyle: 'bold', cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 } },
        columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold' }, 1: { cellWidth: 28 }, 2: { cellWidth: 32 }, 3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' } },
        margin: { left: mx, right: mx },
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            const isRem2 = !isPaid2 && data.row.index === payRows2.length - 1;
            if (isRem2) {
              data.cell.styles.fillColor = [255, 251, 235];
              data.cell.styles.textColor = [180, 83, 9];
            } else {
              data.cell.styles.fillColor = data.row.index % 2 === 0 ? [240, 253, 244] : [255, 255, 255];
              data.cell.styles.textColor = [22, 101, 52];
            }
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Signature section ──
    const sigY = Math.max(y + 10, ph - (hasLetterhead ? 60 : 50));
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    // Patient signature (left)
    doc.line(mx, sigY, mx + 55, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Patient / Attendant Signature', mx, sigY + 5);
    // Authorized signatory (right)
    doc.line(pw - mx - 55, sigY, pw - mx, sigY);
    doc.text('Authorized Signatory', pw - mx - 55, sigY + 5);

    // ── Footer ──
    const footerY = sigY + 14;
    if (!hasLetterhead) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.line(mx, footerY, pw - mx, footerY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Thank you for choosing ' + (hospitalInfo.name || 'our hospital'), pw / 2, footerY + 5, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('This is a computer-generated invoice.', pw / 2, footerY + 9, { align: 'center' });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('This is a computer-generated invoice.', pw / 2, footerY + 3, { align: 'center' });
    }

    const fileName = `Invoice_${(item.bill.billNo || 'BILL').replace(/\s+/g, '-')}_${item.patient.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const handleDownloadPDF = async () => {
    if (!selectedItem) return;
    const { jsPDF, autoTable } = await getJsPdf();

    const pageSize = (hospitalInfo.letterheadSize || 'A4').toLowerCase() as 'a4' | 'a5' | 'letter';
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pageSize });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const mx = 18;
    const cw = pw - mx * 2;
    const rs = (v: number) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // ── Load letterhead (or logo as fallback) ──
    const letterheadDataUrl = await loadImageAsBase64(hospitalInfo.letterhead || '');
    const logoDataUrl = letterheadDataUrl ? null : await loadImageAsBase64(hospitalInfo.logo || '');
    const hasLetterhead = !!letterheadDataUrl;

    let y: number;

    if (hasLetterhead) {
      // ── Full-page letterhead background ──
      try { doc.addImage(letterheadDataUrl!, 'PNG', 0, 0, pw, ph); } catch {}
      y = 80;

      const rx = pw - mx;
      doc.setFillColor(14, 137, 143);
      doc.roundedRect(rx - 32, 52, 32, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('INVOICE', rx - 16, 57, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(paidBill?.billNo || selectedItem.bill?.billNo || 'BILL', rx, 68, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Date: ' + fmtDate(selectedItem.appointmentDate), rx, 74, { align: 'right' });
    } else {
      // ── Fallback: programmatic header ──
      y = 16;
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pw, 52, 'F');
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(0.8);
      doc.line(0, 52, pw, 52);

      const infoX = logoDataUrl ? mx + 28 : mx;
      if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', mx, y, 22, 22); } catch {} }
      if (!logoDataUrl) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(14, 165, 233);
        doc.text(hospitalInfo.name || 'Hospital', infoX, y + 6);
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      let hy = y + 12;
      if (hospitalInfo.address) { doc.text(hospitalInfo.address, infoX, hy); hy += 4; }
      if (hospitalInfo.phone) { doc.text('Phone: ' + hospitalInfo.phone, infoX, hy); hy += 4; }
      if (hospitalInfo.email) { doc.text('Email: ' + hospitalInfo.email, infoX, hy); hy += 4; }
      if (hospitalInfo.gstNumber) { doc.text('GSTIN: ' + hospitalInfo.gstNumber, infoX, hy); hy += 4; }
      if (hospitalInfo.registrationNo) { doc.text('Reg: ' + hospitalInfo.registrationNo, infoX, hy); }

      const rx = pw - mx;
      doc.setFillColor(14, 165, 233);
      doc.roundedRect(rx - 32, y, 32, 7, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('INVOICE', rx - 16, y + 5, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(paidBill?.billNo || selectedItem.bill?.billNo || 'BILL', rx, y + 16, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Date: ' + fmtDate(selectedItem.appointmentDate), rx, y + 22, { align: 'right' });

      y = 58;
    }

    // ── Patient & Consultation Info ──
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(mx, y, cw, 24, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(mx, y, cw, 24, 2, 2, 'S');

    const metaItems = [
      { label: 'Patient Name', value: selectedItem.patient.name },
      { label: 'Patient ID', value: selectedItem.patient.patientId },
      { label: 'Date & Time', value: fmtDate(selectedItem.appointmentDate) + ' | ' + (selectedItem.timeSlot ? fmtTime(selectedItem.timeSlot) : 'Walk-in') },
      { label: 'Consultation By', value: selectedItem.doctor ? 'Dr. ' + selectedItem.doctor.name + (selectedItem.doctor.specialization ? ' - ' + selectedItem.doctor.specialization : '') : 'Walk-in Patient' },
      { label: 'Department', value: selectedItem.department?.name || selectedItem.subDepartment?.name || '-' },
    ];
    const metaCols = 3;
    const mColW = cw / metaCols;
    metaItems.forEach((m, i) => {
      const col = i % metaCols;
      const row = Math.floor(i / metaCols);
      const mX = mx + 4 + col * mColW;
      const mY = y + 5 + row * 11;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(m.label.toUpperCase(), mX, mY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(m.value, mX, mY + 4.5);
    });

    y += 30;

    // ── Itemised Table (split pharmacy items out) ──
    const billForSplit3 = paidBill ? { ...selectedItem.bill, billItems: paidBill.billItems || selectedItem.bill?.billItems } : selectedItem.bill;
    const { nonPharmacyItems: npPdf3, enrichedPharmacy: epPdf3, pharmacyTotal: ptPdf3, rxNo: rnPdf3, diagnosis: dgPdf3 } = splitBillItems(getProcedureScopedBill(billForSplit3, scope));
    const items = npPdf3.map((it: any, i: number) => [String(i + 1), it.name, String(it.quantity), rs(it.unitPrice), rs(it.amount)]);
    if (items.length > 0) {
      autoTable(doc, {
        startY: y, head: [['#', 'Description', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']], body: items, theme: 'striped',
        headStyles: { fillColor: [14, 137, 143], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'left', cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
        bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' } },
        margin: { left: mx, right: mx },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    // ── Pharmacy Medicines Detail ──
    if (epPdf3.length > 0) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(190, 24, 93);
      doc.text('Pharmacy — Medicine Details', mx, y + 2);
      if (rnPdf3) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.text('Rx #' + rnPdf3, pw - mx, y + 2, { align: 'right' }); }
      y += 5;
      if (dgPdf3) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139); doc.text('Diagnosis: ' + dgPdf3, mx, y + 2); y += 5; }
      const mR = epPdf3.map((m: any, i: number) => [String(i + 1), m.name, m.dosage, m.frequency, String(m.quantity), rs(m.unitPrice), rs(m.amount)]);
      mR.push(['', '', '', '', '', 'Medicine Total:', rs(ptPdf3)]);
      autoTable(doc, {
        startY: y, head: [['#', 'Medicine Name', 'Dosage', 'Frequency', 'Qty', 'Unit Price', 'Amount']], body: mR, theme: 'striped',
        headStyles: { fillColor: [252, 231, 243], textColor: [190, 24, 93], fontSize: 7.5, fontStyle: 'bold', halign: 'left', cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 } },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
        alternateRowStyles: { fillColor: [253, 242, 248] },
        columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 }, 4: { cellWidth: 12, halign: 'center' }, 5: { cellWidth: 24, halign: 'right' }, 6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' } },
        margin: { left: mx, right: mx },
        didParseCell: (data: any) => { if (data.section === 'body' && data.row.index === mR.length - 1) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.textColor = [190, 24, 93]; data.cell.styles.fillColor = [252, 231, 243]; } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // ── Summary Section (right-aligned) ──
    const sW = 78;
    const sX = pw - mx - sW;
    const summaryLines: Array<{ label: string; value: string; color?: number[]; bold?: boolean }> = [];
    summaryLines.push({ label: 'Subtotal', value: rs(paidBill?.subtotal ?? liveTotals.gross) });
    if (collectForm.isGst && liveTotals.cgstAmt > 0) summaryLines.push({ label: `CGST (${collectForm.cgst}%)`, value: rs(liveTotals.cgstAmt) });
    if (collectForm.isGst && liveTotals.sgstAmt > 0) summaryLines.push({ label: `SGST (${collectForm.sgst}%)`, value: rs(liveTotals.sgstAmt) });
    if (collectForm.isGst && liveTotals.igstAmt > 0) summaryLines.push({ label: `IGST (${collectForm.igst}%)`, value: rs(liveTotals.igstAmt) });
    if ((paidBill?.discount > 0 || (collectForm.discount || 0) > 0)) {
      summaryLines.push({ label: 'Discount', value: '- ' + rs(paidBill?.discount ?? collectForm.discount), color: [5, 150, 105] });
    }

    const lineH = 6;
    const boxH = (summaryLines.length * lineH) + lineH + 14;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(sX, y, sW, boxH, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(sX, y, sW, boxH, 2, 2, 'S');

    let sY = y + 6;
    summaryLines.forEach(row => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...(row.color || [71, 85, 105]) as [number, number, number]);
      doc.text(row.label, sX + 4, sY);
      doc.text(row.value, sX + sW - 4, sY, { align: 'right' });
      sY += lineH;
    });

    doc.setDrawColor(14, 137, 143);
    doc.setLineWidth(0.4);
    doc.line(sX + 4, sY - 1, sX + sW - 4, sY - 1);
    sY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Total Amount', sX + 4, sY);
    doc.setTextColor(14, 137, 143);
    doc.setFontSize(11);
    doc.text(rs(paidBill?.total ?? liveTotals.total), sX + sW - 4, sY, { align: 'right' });

    y += boxH + 8;

    // ── Payment Info Strip ──
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.3);
    doc.roundedRect(mx, y, cw, 14, 2, 2, 'FD');

    const payItems = [
      { label: 'PAYMENT METHOD', value: collectForm.method },
      { label: 'AMOUNT PAID', value: rs(paidBill?.total ?? liveTotals.total) },
      { label: 'STATUS', value: 'PAID' },
    ];
    if (collectForm.transactionId) payItems.push({ label: 'TXN ID', value: collectForm.transactionId });
    if (deptName) payItems.push({ label: 'COLLECTED BY', value: deptName });
    const pColW = cw / payItems.length;
    payItems.forEach((p, i) => {
      const pX = mx + 4 + i * pColW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(p.label, pX, y + 5);
      doc.setFontSize(8.5);
      doc.setTextColor(22, 101, 52);
      doc.text(p.value, pX, y + 10);
    });

    y += 20;

    // ── Signature section ──
    const sigY = Math.max(y + 10, ph - (hasLetterhead ? 60 : 50));
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(mx, sigY, mx + 55, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Patient / Attendant Signature', mx, sigY + 5);
    doc.line(pw - mx - 55, sigY, pw - mx, sigY);
    doc.text('Authorized Signatory', pw - mx - 55, sigY + 5);

    // ── Footer ──
    const footerY = sigY + 14;
    if (!hasLetterhead) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.line(mx, footerY, pw - mx, footerY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Thank you for choosing ' + (hospitalInfo.name || 'our hospital'), pw / 2, footerY + 5, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('This is a computer-generated invoice.', pw / 2, footerY + 9, { align: 'center' });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('This is a computer-generated invoice.', pw / 2, footerY + 3, { align: 'center' });
    }

    const fileName = `Invoice_${(paidBill?.billNo || selectedItem.bill?.billNo || 'BILL').replace(/\s+/g, '-')}_${selectedItem.patient.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const getAmt = (q: QueueItem) => scope === "pharmacy" ? getPharmacyItemsTotal(q.bill) : scope === "procedure" ? getProcedureItemsTotal(q.bill) : (q.bill?.total || 0);
  const stats = {
    queueCount: queue.length,
    totalPending: queue.reduce((sum, q) => sum + (q.bill?.status === "PENDING" ? getAmt(q) : 0), 0),
    totalCollected: queue.reduce((sum, q) => sum + (q.bill?.status === "PAID" ? getAmt(q) : 0), 0),
    totalDiscount: queue.reduce((sum, q) => sum + (q.bill?.status === "PAID" ? (q.bill?.discount || 0) : 0), 0),
  };

  const SORT_OPTIONS = [
    { value: "newest", label: "Newest First", icon: "↓" },
    { value: "oldest", label: "Oldest First", icon: "↑" },
    { value: "name_asc", label: "Patient A → Z", icon: "A" },
    { value: "name_desc", label: "Patient Z → A", icon: "Z" },
    { value: "total_high", label: "Amount: High → Low", icon: "₹" },
    { value: "total_low", label: "Amount: Low → High", icon: "₹" },
    { value: "status_paid", label: "Status: Paid First", icon: "✓" },
    { value: "status_pending", label: "Status: Pending First", icon: "○" },
  ];

  const statusFilteredQueue = useMemo(() => {
    if (statusFilter === "all") return queue;
    if (statusFilter === "PAID") return queue.filter(q => q.bill?.status === "PAID");
    if (statusFilter === "PENDING") return queue.filter(q => q.bill?.status === "PENDING" || q.bill?.status === "PARTIALLY_PAID");
    return queue;
  }, [queue, statusFilter]);

  const sortedQueue = useMemo(() => {
    const sorted = [...statusFilteredQueue];
    switch (sortBy) {
      case "oldest": sorted.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()); break;
      case "newest": sorted.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()); break;
      case "name_asc": sorted.sort((a, b) => a.patient.name.localeCompare(b.patient.name)); break;
      case "name_desc": sorted.sort((a, b) => b.patient.name.localeCompare(a.patient.name)); break;
      case "total_high": sorted.sort((a, b) => (b.bill?.total || 0) - (a.bill?.total || 0)); break;
      case "total_low": sorted.sort((a, b) => (a.bill?.total || 0) - (b.bill?.total || 0)); break;
      case "status_paid": sorted.sort((a, b) => (a.bill?.status === "PAID" ? -1 : 1) - (b.bill?.status === "PAID" ? -1 : 1)); break;
      case "status_pending": sorted.sort((a, b) => (a.bill?.status === "PENDING" ? -1 : 1) - (b.bill?.status === "PENDING" ? -1 : 1)); break;
    }
    return sorted;
  }, [statusFilteredQueue, sortBy]);

  const exportPDF = async () => {
    const { jsPDF, autoTable } = await getJsPdf();
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(14, 137, 143);
    doc.text("Billing Queue Report", 14, 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | ${sortedQueue.length} bill${sortedQueue.length !== 1 ? "s" : ""}${dateFilter ? ` on ${fmtDate(dateFilter)}` : " (all time)"}`, 14, 21);
    const rows = sortedQueue.map(item => [
      item.bill?.billNo || "—", item.patient.name, item.patient.patientId,
      item.doctor?.name || "Walk-in", fmtDate(item.appointmentDate),
      item.timeSlot ? fmtTime(item.timeSlot) : "Walk-in",
      item.subDepartment?.name || (item as any).source || "—",
      fmtCur(item.bill?.total || 0), item.bill?.status || "—",
    ]);
    autoTable(doc, {
      startY: 26, head: [["Bill No","Patient","Patient ID","Doctor","Date","Time","Sub-Dept","Total","Status"]],
      body: rows, theme: "striped",
      headStyles: { fillColor: [14, 137, 143], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    doc.save(`billing_queue_${dateFilter || "all"}.pdf`);
    setExportOpen(false);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const headers = ["Bill No","Patient","Patient ID","Doctor","Date","Time","Sub-Dept","Fee","Bill Total","Status"];
    const rows = sortedQueue.map(item => [
      item.bill?.billNo || "", item.patient.name, item.patient.patientId,
      item.doctor?.name || "Walk-in", fmtDate(item.appointmentDate),
      item.timeSlot ? fmtTime(item.timeSlot) : "Walk-in",
      item.subDepartment?.name || (item as any).source || "",
      item.consultationFee, item.bill?.total || 0, item.bill?.status || "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [10,20,12,18,12,10,14,10,12,10].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Billing Queue");
    XLSX.writeFile(wb, `billing_queue_${dateFilter || "all"}.xlsx`);
    setExportOpen(false);
  };

  const exportWord = async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle } = await import("docx");
    const { saveAs } = await import("file-saver");
    const headers = ["Bill No","Patient","Patient ID","Doctor","Date","Sub-Dept","Total","Status"];
    const dataRows = sortedQueue.map(item => [
      item.bill?.billNo || "—", item.patient.name, item.patient.patientId,
      item.doctor?.name || "Walk-in", fmtDate(item.appointmentDate),
      item.subDepartment?.name || (item as any).source || "—",
      fmtCur(item.bill?.total || 0), item.bill?.status || "—",
    ]);
    const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "e2e8f0" };
    const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
    const mkCell = (text: string, bold = false) => new TableCell({ borders, children: [new Paragraph({ children: [new TextRun({ text, bold, size: 18, font: "Calibri" })] })] });
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ children: [new TextRun({ text: "Billing Queue Report", bold: true, size: 28, color: "0E898F", font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-IN")} | ${sortedQueue.length} bills${dateFilter ? ` on ${fmtDate(dateFilter)}` : " (all time)"}`, size: 18, color: "64748b", font: "Calibri" })], alignment: AlignmentType.CENTER }),
      new Paragraph({ children: [] }),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
        new TableRow({ children: headers.map(h => mkCell(h, true)), tableHeader: true }),
        ...dataRows.map(row => new TableRow({ children: row.map(c => mkCell(String(c))) })),
      ]}),
    ]}] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `billing_queue_${dateFilter || "all"}.docx`);
    setExportOpen(false);
  };

  const exportCSV = () => {
    const headers = ["Bill No","Patient","Patient ID","Doctor","Date","Time","Sub-Dept","Fee","Bill Total","Status"];
    const rows = sortedQueue.map(item => [
      item.bill?.billNo || "—",
      item.patient.name,
      item.patient.patientId,
      item.doctor?.name || "Walk-in",
      fmtDate(item.appointmentDate),
      item.timeSlot ? fmtTime(item.timeSlot) : "Walk-in",
      item.subDepartment?.name || (item as any).source || "—",
      item.consultationFee,
      item.bill?.total || 0,
      item.bill?.status || "—",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `billing_queue_${dateFilter || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkDelete = async () => {
    const billIds = queue.filter(q => selectedIds.has(q.id) && q.bill).map(q => q.bill!.id);
    if (billIds.length === 0) { showToast("warning", "No Selection", "Select bills to delete."); return; }
    if (!confirm(`Are you sure you want to delete ${billIds.length} bill${billIds.length > 1 ? "s" : ""}? This cannot be undone.`)) return;

    let success = 0, failed = 0;
    for (const id of billIds) {
      try {
        const r = await api(`/api/billing/${id}`, { method: "DELETE" });
        if (r.success) success++; else failed++;
      } catch { failed++; }
    }
    setSelectedIds(new Set());
    loadQueue();
    if (failed === 0) showToast("success", "Deleted!", `${success} bill${success > 1 ? "s" : ""} deleted successfully.`);
    else showToast("warning", "Partial Delete", `${success} deleted, ${failed} failed (may have payments).`);
  };

  return (
    <>
      <style>{BQ_CSS}</style>
      <div className="bq-wrap">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>Billing Queue</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 3px #dcfce7", flexShrink: 0 }} />
              Live &middot; {sortedQueue.length} bill{sortedQueue.length !== 1 ? "s" : ""}{dateFilter ? ` on ${fmtDate(dateFilter)}` : " (all time)"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setDateFilter(new Date().toISOString().split("T")[0]); setSortBy("newest"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
              <CalendarDays size={13} /> Today
            </button>
            <button onClick={loadQueue} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
              <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} /> Refresh
            </button>
            <div ref={exportRef} style={{ position: "relative" }}>
              <button onClick={() => setExportOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10, border: "none", background: "#0E898F", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <Download size={13} /> Export <ChevronDown size={12} style={{ marginLeft: 2, transition: "transform .2s", transform: exportOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
              {exportOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 12px 36px rgba(0,0,0,.1)", minWidth: 160, padding: 6, animation: "bq-fade .15s ease" }}>
                  {[
                    { label: "PDF",          icon: <FileText   size={15} color="#ef4444" />, iconBg: "#fef2f2", action: exportPDF },
                    { label: "Excel (.xlsx)", icon: <Table2     size={15} color="#16a34a" />, iconBg: "#f0fdf4", action: exportExcel },
                    { label: "Word (.docx)",  icon: <FileEdit   size={15} color="#2563eb" />, iconBg: "#eff6ff", action: exportWord },
                    { label: "CSV",           icon: <FileSpreadsheet size={15} color="#d97706" />, iconBg: "#fffbeb", action: () => { exportCSV(); setExportOpen(false); } },
                  ].map(opt => (
                    <button key={opt.label} onClick={opt.action}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", border: "none", background: "none", fontSize: 13, color: "#334155", cursor: "pointer", borderRadius: 8, textAlign: "left", fontFamily: "inherit", fontWeight: 500, transition: "background .12s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <span style={{ width: 28, height: 28, borderRadius: 7, background: opt.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards — 5 all-time cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { icon: <Receipt size={20} color="#0E898F" />, bg: "#E6F4F4", value: String(globalStats.queueCount), label: "Total In Queue", badge: null as string | null, badgeBg: "", badgeColor: "", badgeBorder: "" },
            { icon: <Clock size={20} color={globalStats.pendingCount > 0 ? "#ea580c" : "#94a3b8"} />, bg: globalStats.pendingCount > 0 ? "#fff3e6" : "#f8fafc", value: String(globalStats.pendingCount), label: "Pending Bills", badge: globalStats.pendingCount > 0 ? "PENDING" : null as string | null, badgeBg: "#fff3e6", badgeColor: "#ea580c", badgeBorder: "#fed7aa" },
            { icon: <IndianRupee size={20} color="#ea580c" />, bg: "#fff3e6", value: fmtCur(globalStats.pendingAmount), label: "Pending Amount", badge: null as string | null, badgeBg: "", badgeColor: "", badgeBorder: "" },
            { icon: <CheckCircle2 size={20} color="#16a34a" />, bg: "#f0fdf4", value: fmtCur(globalStats.totalCollected), label: "Total Collected", badge: null as string | null, badgeBg: "", badgeColor: "", badgeBorder: "" },
            scope === "pharmacy" 
              ? { icon: <IndianRupee size={20} color="#16a34a" />, bg: "#f0fdf4", value: fmtCur(globalStats.todayCollected), label: "Today's Collection", badge: "TODAY" as string | null, badgeBg: "#f0fdf4", badgeColor: "#16a34a", badgeBorder: "#bbf7d0" }
              : { icon: <Tag size={20} color="#8b5cf6" />, bg: "#f5f3ff", value: fmtCur(globalStats.totalDiscount), label: "Discount Given", badge: null as string | null, badgeBg: "", badgeColor: "", badgeBorder: "" },
          ].map((c, i) => (
            <div key={i}
              style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{c.value}</div>
                  {c.badge && <span style={{ fontSize: 8, fontWeight: 700, color: c.badgeColor, background: c.badgeBg, padding: "2px 6px", borderRadius: 10, border: `1px solid ${c.badgeBorder}` }}>{c.badge}</span>}
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Status filter pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          {(["all", "PENDING", "PAID"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: "6px 16px", borderRadius: 100, border: `1px solid ${statusFilter === s ? (s === "PAID" ? "#bbf7d0" : s === "PENDING" ? "#fed7aa" : "#cbd5e1") : "#e2e8f0"}`, background: statusFilter === s ? (s === "PAID" ? "#f0fdf4" : s === "PENDING" ? "#fff3e6" : "#f1f5f9") : "#fff", color: statusFilter === s ? (s === "PAID" ? "#16a34a" : s === "PENDING" ? "#ea580c" : "#1e293b") : "#64748b", fontSize: 12, fontWeight: statusFilter === s ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>
              {s === "all" ? "All Bills" : s === "PAID" ? "Paid" : "Pending"}
            </button>
          ))}
          {statusFilter !== "all" && (
            <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{sortedQueue.length} result{sortedQueue.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Filters */}
        <div className="bq-filters">
          <div className="bq-search">
            <Search size={14} color="#94a3b8" />
            <input placeholder="Search patient, doctor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input type="date" className="bq-date-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          {/* Custom Sort Dropdown */}
          <div className="bq-sort-wrap" ref={sortRef}>
            <button className="bq-sort-trigger" onClick={() => setSortOpen(o => !o)}>
              <ArrowUpDown size={14} />
              <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Sort"}</span>
              <ChevronDown size={14} className={`bq-sort-chevron ${sortOpen ? "bq-sort-chevron-open" : ""}`} />
            </button>
            {sortOpen && (
              <div className="bq-sort-dropdown">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`bq-sort-option ${sortBy === opt.value ? "bq-sort-option-active" : ""}`}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                  >
                    <span className="bq-sort-option-icon">{opt.icon}</span>
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <CheckCircle size={14} className="bq-sort-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="bq-btn-secondary" onClick={() => { setSearch(""); setDateFilter(""); setSortBy("newest"); }}>
            <X size={14} />Clear
          </button>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bq-bulk-bar">
            <div className="bq-bulk-info">
              <CheckCircle size={16} />
              <span><strong>{selectedIds.size}</strong> bill{selectedIds.size > 1 ? "s" : ""} selected</span>
            </div>
            {bulkSending ? (
              <div className="bq-bulk-progress">
                <div className="bq-bulk-progress-bar">
                  <div className="bq-bulk-progress-fill" style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }} />
                </div>
                <span className="bq-bulk-progress-text">Sending {bulkProgress.current}/{bulkProgress.total} — {bulkProgress.success} sent{bulkProgress.failed > 0 ? `, ${bulkProgress.failed} failed` : ""}</span>
              </div>
            ) : (
              <div className="bq-bulk-actions">
                <button className="bq-btn-bulk-email" onClick={handleBulkSendEmail}>
                  <Send size={14} /> Send {selectedIds.size} Email{selectedIds.size > 1 ? "s" : ""}
                </button>
                <button className="bq-btn-bulk-delete" onClick={handleBulkDelete}>
                  <Trash2 size={14} /> Delete {selectedIds.size}
                </button>
                <button className="bq-btn-secondary" onClick={() => setSelectedIds(new Set())} style={{padding: "6px 12px", fontSize: 12}}>
                  <X size={14} /> Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Queue Table */}
        <div className="bq-card">
          {loading ? (
            <div className="bq-loading">
              <Loader2 size={24} style={{ animation: "spin .7s linear infinite" }} />
              <span>Loading billing queue...</span>
            </div>
          ) : sortedQueue.length === 0 ? (
            <div className="bq-empty">
              <Receipt size={40} color="#cbd5e1" />
              <div className="bq-empty-title">No bills in queue</div>
              <div className="bq-empty-sub">Transferred appointments will appear here</div>
            </div>
          ) : (
            <table className="bq-table">
              <thead>
                <tr>
                  <th style={{width: 36, textAlign: "center"}}>
                    <input type="checkbox" className="bq-checkbox" checked={selectableItems.length > 0 && selectableItems.every(q => selectedIds.has(q.id))} onChange={toggleSelectAll} title="Select all" />
                  </th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Fee</th>
                  <th>Sub-Dept</th>
                  <th>Bill Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedQueue.map(item => {
                  const sc = STATUS_COLORS[item.bill?.status || "PENDING"] || STATUS_COLORS.PENDING;
                  return (
                    <tr key={item.id} className={selectedIds.has(item.id) ? "bq-row-selected" : ""}>
                      <td style={{textAlign: "center"}}>
                        <input type="checkbox" className="bq-checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} />
                      </td>
                      <td>
                        <div className="bq-patient">
                          <div>
                            <div className="bq-patient-name">{item.patient.name}</div>
                            <div className="bq-patient-id">{item.patient.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="bq-doctor-name">{item.doctor?.name || ((item as any).source === "pharmacy" || (item as any).source === "pharmacy_counter" ? "Walk-in Patient" : (item as any).source === "lab_order" ? "Lab Order" : "—")}</div>
                        <div className="bq-doctor-spec">{item.doctor?.specialization || item.department?.name || ((item as any).source === "pharmacy_counter" ? `Bill: ${(item as any).prescriptionNo}` : (item as any).source === "lab_order" ? `Bill: ${item.bill?.billNo || "—"}` : (item as any).prescriptionNo ? `Rx: ${(item as any).prescriptionNo}` : "—")}</div>
                      </td>
                      <td>
                        <div className="bq-date">{fmtDate(item.appointmentDate)}</div>
                        <div className="bq-time">{item.timeSlot ? fmtTime(item.timeSlot) : ((item as any).source === "pharmacy" || (item as any).source === "pharmacy_counter") ? "Counter Sale" : (item as any).source === "lab_order" ? "Lab Test" : "—"}</div>
                      </td>
                      <td className="bq-fee">{scope === "pharmacy" ? fmtCur(getPharmacyItemsTotal(item.bill)) : scope === "procedure" ? fmtCur(getProcedureItemsTotal(item.bill)) : ((item as any).source === "pharmacy" || (item as any).source === "pharmacy_counter" || (item as any).source === "lab_order" ? fmtCur(item.bill?.total || 0) : fmtCur(item.consultationFee))}</td>
                      <td>
                        {(item as any).source === "lab_order" ? (
                          <span className="bq-badge" style={{ background: "#f0fdf4", color: "#047857", border: "1px solid #a7f3d0" }}>
                            Lab Order
                          </span>
                        ) : (item as any).source === "pharmacy_counter" ? (
                          <span className="bq-badge" style={{ background: "#E6F4F4", color: "#0b7075", border: "1px solid #b2d8da" }}>
                            Pharmacy Sale
                          </span>
                        ) : (item as any).source === "pharmacy" ? (
                          <span className="bq-badge" style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                            Pharmacy Rx
                          </span>
                        ) : item.subDepartment ? (
                          <span className="bq-badge" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                            {item.subDepartment.name}
                          </span>
                        ) : <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td>
                        <span className="bq-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
                          {sc.label}
                        </span>
                        {item.bill?.status === "PARTIALLY_PAID" && item.bill?.notes?.includes("Collected by") && (
                          <div style={{fontSize:10,color:"#b45309",marginTop:3,fontWeight:600}}>
                            {item.bill.notes.match(/Collected by [^|]+/)?.[0]?.trim()}
                          </div>
                        )}
                      </td>
                      <td className="bq-total">
                        {item.bill?.status === "PARTIALLY_PAID" && scope !== "procedure" ? (
                          <div>
                            <div style={{fontWeight:700,color:"#b45309"}}>{fmtCur((item.bill?.total || 0) - (item.bill?.paidAmount || 0))}</div>
                            <div style={{fontSize:10,color:"#94a3b8",textDecoration:"line-through"}}>{fmtCur(item.bill?.total || 0)}</div>
                          </div>
                        ) : fmtCur(scope === "pharmacy" ? getPharmacyItemsTotal(item.bill) : scope === "procedure" ? getProcedureItemsTotal(item.bill) : (item.bill?.total || 0))}
                      </td>
                      <td>
                        <div className="bq-actions">
                          <button className="bq-action-btn bq-action-view" onClick={() => handleView(item)} title="View Bill">
                            <Eye size={14} />
                          </button>
                          <button className="bq-action-btn bq-action-download" onClick={() => handleDownloadBillPDF(item)} title="Download PDF">
                            <Download size={14} />
                          </button>
                          <button 
                            className="bq-action-btn bq-action-email" 
                            onClick={() => item.patient.email ? handleSendEmail(item) : showToast("warning", "No Email", "Patient does not have an email address on file.")} 
                            disabled={sendingEmail === item.bill?.id}
                            title={item.patient.email ? `Send Invoice to ${item.patient.email}` : "No patient email on file"}
                            style={{background: item.patient.email ? "#f0f9ff" : "#f8fafc", color: item.patient.email ? "#0369a1" : "#94a3b8", border: `1px solid ${item.patient.email ? "#bae6fd" : "#e2e8f0"}`}}
                          >
                            {sendingEmail === item.bill?.id ? <Loader2 size={14} style={{animation: "spin .7s linear infinite"}} /> : <Send size={14} />}
                          </button>
                          {item.bill?.status !== "PAID" ? (
                            <button 
                              className="bq-action-btn bq-action-collect" 
                              onClick={() => {
                                if (scope === "pharmacy" && item.bill?.billItems?.some((bi: any) => bi.type !== "PHARMACY")) {
                                  showToast("warning", "Restricted Action", "This bill contains non-pharmacy charges. It must be collected at the main billing desk.");
                                  return;
                                }
                                handleCollect(item);
                              }} 
                              title={item.bill?.status === "PARTIALLY_PAID" ? `Collect Remaining ${fmtCur((item.bill?.total || 0) - (item.bill?.paidAmount || 0))}` : "Collect & Generate Bill"}
                              style={{
                                ...(scope === "pharmacy" && item.bill?.billItems?.some((bi: any) => bi.type !== "PHARMACY") ? { opacity: 0.5, cursor: "not-allowed", filter: "grayscale(100%)" } : {}),
                                ...(item.bill?.status === "PARTIALLY_PAID" ? { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" } : {}),
                              }}
                            >
                              <CreditCard size={14} />
                            </button>
                          ) : (
                            <button
                              className="bq-action-btn bq-action-regenerate"
                              onClick={() => {
                                if (scope === "pharmacy" && item.bill?.billItems?.some((bi: any) => bi.type !== "PHARMACY")) {
                                  showToast("warning", "Restricted Action", "This bill contains non-pharmacy charges. It must be modified at the main billing desk.");
                                  return;
                                }
                                handleRegenerate(item);
                              }}
                              disabled={reverting === item.bill?.id}
                              title={scope === "pharmacy" && item.bill?.billItems?.some((bi: any) => bi.type !== "PHARMACY") ? "Contains non-pharmacy charges. Modify at main desk." : "Regenerate Bill"}
                              style={scope === "pharmacy" && item.bill?.billItems?.some((bi: any) => bi.type !== "PHARMACY") ? { opacity: 0.5, cursor: "not-allowed", filter: "grayscale(100%)" } : {}}
                            >
                              {reverting === item.bill?.id ? <Loader2 size={14} style={{animation: "spin .7s linear infinite"}} /> : <RefreshCw size={14} />}
                            </button>
                          )}
                          <button 
                            className="bq-action-btn bq-action-delete" 
                            onClick={() => handleDelete(item.bill!.id)} 
                            disabled={deleting === item.bill?.id}
                            title="Delete Bill"
                          >
                            {deleting === item.bill?.id ? <Loader2 size={14} style={{animation: "spin .7s linear infinite"}} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* View Bill Modal */}
        {viewMode === "view" && selectedItem?.bill && (
          <div className="bq-modal-overlay" onClick={() => setViewMode(null)}>
            <div className="bq-modal bq-modal-large" onClick={e => e.stopPropagation()}>
              <div className="bq-modal-header">
                <h3>Bill Details - {selectedItem.bill?.billNo}</h3>
                <div style={{display: "flex", gap: 8}}>
                  {selectedItem.bill?.status === "PAID" && (
                      <button
                        className="bq-btn-secondary"
                        style={scope === "pharmacy" && selectedItem.bill?.billItems?.some((bi: any) => bi.type !== "PHARMACY") ? {padding:"6px 12px",fontSize:12, opacity: 0.5, cursor: "not-allowed"} : {padding:"6px 12px",fontSize:12}}
                        onClick={() => {
                          if (scope === "pharmacy" && selectedItem.bill?.billItems?.some((bi: any) => bi.type !== "PHARMACY")) {
                            showToast("warning", "Restricted Action", "This bill contains non-pharmacy charges. It must be modified at the main billing desk.");
                            return;
                          }
                          handleRegenerate(selectedItem);
                        }}
                        disabled={reverting === selectedItem.bill?.id}
                        title={scope === "pharmacy" && selectedItem.bill?.billItems?.some((bi: any) => bi.type !== "PHARMACY") ? "Contains non-pharmacy charges. Modify at main desk." : "Regenerate Bill"}
                      >
                        {reverting === selectedItem.bill?.id ? <Loader2 size={14} style={{animation:"spin .7s linear infinite"}}/> : <RefreshCw size={14}/>}
                        <span style={{marginLeft:4}}>Regenerate</span>
                      </button>
                  )}
                  <button className="bq-btn-icon" onClick={() => handleDownloadBillPDF(selectedItem)} title="Download PDF">
                    <Download size={16} />
                  </button>
                  <button className="bq-btn-icon" onClick={handlePrint} title="Print">
                    <Printer size={16} />
                  </button>
                  <button className="bq-btn-icon" onClick={() => setViewMode(null)}>
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="bq-modal-body">
                <div ref={printRef} className="bill-container" style={hospitalInfo.letterhead ? {
                  backgroundImage: `url(${hospitalInfo.letterhead.match(/\.pdf$/i) || hospitalInfo.letterhead.includes('/raw/upload/')
                    ? hospitalInfo.letterhead.replace('/upload/', '/upload/f_png,pg_1/').replace(/\.pdf$/i, '.png')
                    : hospitalInfo.letterhead})`,
                  backgroundSize: "100% 100%",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  minHeight: "100vh",
                } : undefined}>
                  {/* Bill Header - only shown when no letterhead */}
                  {!hospitalInfo.letterhead ? (
                  <>
                  <div className="bill-header">
                    {hospitalInfo.logo && (
                      <div className="bill-logo">
                        <img src={hospitalInfo.logo} alt={hospitalInfo.name} style={{maxHeight: 60}} />
                      </div>
                    )}
                    <div className="bill-hospital-info">
                      {!hospitalInfo.logo && <h2>{hospitalInfo.name}</h2>}
                      {hospitalInfo.address && <div className="bill-info-row"><MapPin size={14} />{hospitalInfo.address}</div>}
                      {hospitalInfo.phone && <div className="bill-info-row"><Phone size={14} />{hospitalInfo.phone}</div>}
                      {hospitalInfo.email && <div className="bill-info-row"><Mail size={14} />{hospitalInfo.email}</div>}
                    </div>
                  </div>
                  <div className="bill-divider" />
                  </>
                  ) : (
                  <div style={{display:"flex",justifyContent:"flex-end",padding:"70px 28px 0",marginBottom:20}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{display:"inline-block",padding:"4px 16px",borderRadius:6,background:"#0E898F",color:"#fff",fontSize:11,fontWeight:700,letterSpacing:"0.04em",marginBottom:6}}>INVOICE</div>
                      <h2 style={{fontSize:18,fontWeight:700,color:"#1e293b",margin:"4px 0"}}>{selectedItem.bill?.billNo}</h2>
                      <p style={{fontSize:12,color:"#64748b"}}>{fmtDate(selectedItem.appointmentDate)}</p>
                    </div>
                  </div>
                  )}
                  
                  {/* Bill Info */}
                  <div className="bill-info-grid">
                    <div>
                      <div className="bill-label">Bill No:</div>
                      <div className="bill-value">{selectedItem.bill?.billNo}</div>
                    </div>
                    <div>
                      <div className="bill-label">Date:</div>
                      <div className="bill-value">{fmtDate(selectedItem.appointmentDate)}</div>
                    </div>
                    <div>
                      <div className="bill-label">Patient:</div>
                      <div className="bill-value">{selectedItem.patient.name} ({selectedItem.patient.patientId})</div>
                    </div>
                    <div>
                      <div className="bill-label">Doctor:</div>
                      <div className="bill-value">{selectedItem.doctor ? `Dr. ${selectedItem.doctor.name}` : "Walk-in Patient"}</div>
                    </div>
                  </div>

                  {/* Bill Items + Pharmacy Detail */}
                  {(() => {
                    const { nonPharmacyItems, enrichedPharmacy, pharmacyTotal, rxNo, diagnosis, rxDoctor } = splitBillItems(getProcedureScopedBill(selectedItem.bill, scope));
                    return (<>
                      {/* Non-pharmacy charges */}
                      {nonPharmacyItems.length > 0 && (
                        <table className="bill-table">
                          <thead><tr><th>Description</th><th className="text-center">Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr></thead>
                          <tbody>
                            {nonPharmacyItems.map((item: any) => (
                              <tr key={item.id}><td>{item.name}</td><td className="text-center">{item.quantity}</td><td className="text-right">{fmtCur(item.unitPrice)}</td><td className="text-right">{fmtCur(item.amount)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {/* Pharmacy medicines detail */}
                      {enrichedPharmacy.length > 0 && (
                        <div style={{margin:"20px 0",padding:16,background:"#fdf2f8",borderRadius:12,border:"1px solid #fce7f3"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                            <div style={{fontSize:13,fontWeight:700,color:"#be185d"}}>💊 Pharmacy — Medicine Details</div>
                            {rxNo && <span style={{fontSize:11,fontWeight:600,color:"#be185d",background:"#fff",padding:"3px 10px",borderRadius:6,border:"1px solid #fce7f3"}}>Rx #{rxNo}</span>}
                          </div>
                          {diagnosis && (<div style={{fontSize:12,color:"#64748b",marginBottom:8,padding:"6px 10px",background:"#fff",borderRadius:6,border:"1px solid #fce7f3"}}><b style={{color:"#be185d"}}>Diagnosis:</b> {diagnosis}</div>)}
                          {rxDoctor && (<div style={{fontSize:12,color:"#64748b",marginBottom:10}}><b>Prescribed by:</b> Dr. {rxDoctor}</div>)}
                          <table className="bill-table" style={{margin:0,background:"#fff",borderRadius:8,overflow:"hidden"}}>
                            <thead>
                              <tr style={{background:"#fce7f3"}}>
                                <th style={{color:"#be185d",width:32}}>#</th>
                                <th style={{color:"#be185d"}}>Medicine Name</th>
                                <th style={{color:"#be185d"}}>Dosage</th>
                                <th style={{color:"#be185d"}}>Frequency</th>
                                <th style={{color:"#be185d"}} className="text-center">Qty</th>
                                <th style={{color:"#be185d"}} className="text-right">Unit Price</th>
                                <th style={{color:"#be185d"}} className="text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {enrichedPharmacy.map((m: any, idx: number) => (
                                <tr key={m.id || idx}>
                                  <td style={{color:"#94a3b8",textAlign:"center"}}>{idx + 1}</td>
                                  <td style={{fontWeight:600,color:"#1e293b"}}>{m.name}</td>
                                  <td style={{color:"#475569",fontSize:12}}>{m.dosage}</td>
                                  <td style={{color:"#475569",fontSize:12}}>{m.frequency}</td>
                                  <td className="text-center">{m.quantity}</td>
                                  <td className="text-right">{fmtCur(m.unitPrice)}</td>
                                  <td className="text-right" style={{fontWeight:700}}>{fmtCur(m.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{borderTop:"2px solid #fce7f3"}}>
                                <td colSpan={6} style={{textAlign:"right",fontWeight:700,fontSize:13,color:"#be185d",paddingRight:12}}>Medicine Total</td>
                                <td className="text-right" style={{fontWeight:800,fontSize:14,color:"#be185d"}}>{fmtCur(pharmacyTotal)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </>);
                  })()}

                  {/* Bill Summary */}
                  {(() => {
                    const vBill = getProcedureScopedBill(selectedItem.bill, scope);
                    return (
                  <div className="bill-summary">
                    <div className="bill-summary-row">
                      <span>Subtotal:</span>
                      <span>{fmtCur(vBill?.subtotal)}</span>
                    </div>
                    {vBill?.isGst && (
                      <>
                        {vBill?.cgst > 0 && (
                          <div className="bill-summary-row">
                            <span>CGST ({vBill?.cgst}%):</span>
                            <span>{fmtCur((vBill?.subtotal * vBill?.cgst) / 100)}</span>
                          </div>
                        )}
                        {vBill?.sgst > 0 && (
                          <div className="bill-summary-row">
                            <span>SGST ({vBill?.sgst}%):</span>
                            <span>{fmtCur((vBill?.subtotal * vBill?.sgst) / 100)}</span>
                          </div>
                        )}
                        {vBill?.igst > 0 && (
                          <div className="bill-summary-row">
                            <span>IGST ({vBill?.igst}%):</span>
                            <span>{fmtCur((vBill?.subtotal * vBill?.igst) / 100)}</span>
                          </div>
                        )}
                      </>
                    )}
                    {vBill?.tax > 0 && !vBill?.isGst && (
                      <div className="bill-summary-row">
                        <span>Tax:</span>
                        <span>{fmtCur(vBill?.tax)}</span>
                      </div>
                    )}
                    {vBill?.discount > 0 && (
                      <div className="bill-summary-row">
                        <span>Discount:</span>
                        <span className="text-success">-{fmtCur(vBill?.discount)}</span>
                      </div>
                    )}
                    <div className="bill-summary-row bill-total">
                      <span>Total Amount:</span>
                      <strong>{fmtCur(vBill?.total)}</strong>
                    </div>
                  </div>
                    );
                  })()}

                  {/* Payment History Section */}
                  {(selectedItem.bill?.status === "PAID" || selectedItem.bill?.status === "PARTIALLY_PAID") && (
                    <div style={{marginTop:14,border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
                      <div style={{padding:"8px 14px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:700,color:"#475569"}}>
                        <IndianRupee size={12}/> Payment History
                      </div>
                      {(selectedItem.bill?.payments || []).length > 0 ? (
                        (selectedItem.bill.payments || []).map((p: any, i: number) => {
                          const collectedByLabel = (p.notes || "").match(/Collected by [^—]+/)?.[0]?.trim();
                          return (
                            <div key={i} style={{padding:"8px 14px",borderBottom:i < (selectedItem.bill!.payments!.length - 1) ? "1px solid #f1f5f9" : "none",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,fontSize:11}}>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <CheckCircle size={12} color="#16a34a"/>
                                <div>
                                  <div style={{fontWeight:600,color:"#166534"}}>{collectedByLabel || "Payment Received"}</div>
                                  <div style={{color:"#64748b",marginTop:1}}>{p.method}{p.transactionId ? ` · Ref: ${p.transactionId}` : ""} · {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : ""}</div>
                                </div>
                              </div>
                              <strong style={{color:"#166534",fontSize:12,whiteSpace:"nowrap"}}>{fmtCur(p.amount)}</strong>
                            </div>
                          );
                        })
                      ) : (
                        selectedItem.bill?.notes?.includes("Collected by") && (
                          <div style={{padding:"8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:11}}>
                            <CheckCircle size={12} color="#16a34a"/>
                            <span style={{fontWeight:600,color:"#166534"}}>{selectedItem.bill.notes.match(/Collected by [^|]+/)?.[0]?.trim()}</span>
                            <span style={{color:"#64748b",marginLeft:"auto"}}>{fmtCur(selectedItem.bill.paidAmount || 0)}</span>
                          </div>
                        )
                      )}
                      {selectedItem.bill?.status === "PARTIALLY_PAID" && (
                        <div style={{padding:"8px 14px",background:"#fffbeb",borderTop:"1px solid #fde68a",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11}}>
                          <span style={{fontWeight:600,color:"#92400e",display:"flex",alignItems:"center",gap:5}}>
                            <IndianRupee size={11}/>Remaining Balance
                          </span>
                          <strong style={{color:"#b45309",fontSize:12}}>{fmtCur(Math.max(0,(selectedItem.bill.total||0)-(selectedItem.bill.paidAmount||0)))}</strong>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="bill-footer">
                    <p>Thank you for choosing {hospitalInfo.name}</p>
                    <p style={{fontSize: 11, color: "#94a3b8", marginTop: 8}}>This is a computer-generated bill</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Comprehensive Collect & Generate Bill Modal ─────────────────────── */}
        {viewMode === "collect" && selectedItem?.bill && (
          <div className="bq-modal-overlay" onClick={() => !processing && collectStep === "billing" && setViewMode(null)}>
            <div className="bq-modal bq-modal-xl" onClick={e => e.stopPropagation()}>

              {/* ── Header ── */}
              <div className="bq-modal-header">
                {collectStep === "billing" ? (
                  <>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="cm-header-icon"><CreditCard size={18} color="#0ea5e9" /></div>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,color:"#1e293b"}}>Collect &amp; Generate Bill</div>
                        <div style={{fontSize:12,color:"#94a3b8"}}>{selectedItem.bill?.billNo}</div>
                      </div>
                    </div>
                    <button className="bq-btn-icon" onClick={() => setViewMode(null)} disabled={processing}><X size={18}/></button>
                  </>
                ) : (
                  <>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="cm-header-icon cm-header-paid"><CheckCircle size={18} color="#059669" /></div>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,color:"#166534"}}>Payment Successful</div>
                        <div style={{fontSize:12,color:"#94a3b8"}}>{paidBill?.billNo || selectedItem.bill?.billNo} — Receipt Generated</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="bq-btn-secondary" style={{padding:"8px 14px",fontSize:12}}
                        onClick={() => handleRegenerate(selectedItem)}
                        disabled={reverting === selectedItem.bill?.id}
                        title="Regenerate Bill"
                      >
                        {reverting === selectedItem.bill?.id ? <Loader2 size={14} style={{animation:"spin .7s linear infinite"}}/> : <RefreshCw size={14}/>}
                        <span style={{marginLeft:4}}>Regenerate</span>
                      </button>
                      <button className="bq-btn-secondary" style={{padding:"8px 14px",fontSize:12}} onClick={handleDownloadPDF}>
                        <Download size={14}/>Download PDF
                      </button>
                      <button className="bq-btn-secondary" style={{padding:"8px 14px",fontSize:12}} onClick={handlePrint}>
                        <Printer size={14}/>Print
                      </button>
                      <button className="bq-btn-icon" onClick={() => setViewMode(null)}><X size={18}/></button>
                    </div>
                  </>
                )}
              </div>

              {/* ── Body: Billing Step ── */}
              {collectStep === "billing" && (
                <div className="bq-modal-body">
                  {/* Patient strip */}
                  <div className="cm-patient-strip">
                    <div className="cm-patient-avatar">{(selectedItem.patient.name||"?")[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div className="cm-patient-name">{selectedItem.patient.name}</div>
                      <div className="cm-patient-meta">{selectedItem.patient.patientId}{selectedItem.patient.phone ? ` · ${selectedItem.patient.phone}` : ""}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div className="cm-patient-meta"><Stethoscope size={12} style={{display:"inline",marginRight:4}}/>{selectedItem.doctor ? `Dr. ${selectedItem.doctor.name}` : "Walk-in"}</div>
                      <div className="cm-patient-meta">{selectedItem.doctor?.specialization || selectedItem.department?.name || ""}</div>
                    </div>
                  </div>

                  <div className="cm-layout">
                    {/* ── Left Column: Charges ── */}
                    <div className="cm-left">
                      {/* Previously Collected Banner — shown when sub-dept already collected procedure charges */}
                      {scope !== "procedure" && liveTotals.hasPaidProcedures && (
                        <div style={{marginBottom:12,padding:"10px 14px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:9,display:"flex",alignItems:"flex-start",gap:8,fontSize:11}}>
                          <IndianRupee size={13} color="#b45309" style={{marginTop:1,flexShrink:0}}/>
                          <div>
                            <div style={{fontWeight:700,color:"#92400e",marginBottom:2}}>Partial Collection Already Done</div>
                            <div style={{color:"#78350f"}}>
                              {selectedItem.bill?.notes?.match(/Collected by [^|]+/)?.[0]?.trim() || "Procedure charges"}: <strong>{fmtCur(liveTotals.paidAmount)}</strong>
                            </div>
                            <div style={{color:"#b45309",marginTop:3}}>Remaining balance to collect: <strong>{fmtCur(liveTotals.remaining)}</strong></div>
                          </div>
                        </div>
                      )}
                      {/* Charges + Pharmacy Detail (Collect modal) */}
                      {(() => {
                        const billForCollect = getRemainingChargesBill(selectedItem.bill, scope);
                        const { nonPharmacyItems: npItems, enrichedPharmacy: epItems, pharmacyTotal: pTotal, rxNo: rNo, diagnosis: diag } = splitBillItems(scope === "procedure" ? getProcedureScopedBill(selectedItem.bill, scope) : billForCollect);
                        return (<>
                          <div className="cm-section-title"><Receipt size={14}/>Charges Summary</div>
                          <table className="cm-charges-table">
                            <thead>
                              <tr><th>#</th><th>Description</th><th className="text-center">Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr>
                            </thead>
                            <tbody>
                              {npItems.map((it: any, i: number) => (
                                <tr key={it.id}>
                                  <td className="text-center" style={{color:"#94a3b8"}}>{i+1}</td>
                                  <td>
                                    <div style={{fontWeight:600,color:"#1e293b",fontSize:13}}>{it.name}</div>
                                    <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase"}}>{it.type}</div>
                                  </td>
                                  <td className="text-center">{it.quantity}</td>
                                  <td className="text-right">{fmtCur(it.unitPrice)}</td>
                                  <td className="text-right" style={{fontWeight:700}}>{fmtCur(it.amount)}</td>
                                </tr>
                              ))}
                              {collectForm.addedCharges.map((ch, i) => (
                                <tr key={`added-${i}`} className="cm-added-row">
                                  <td className="text-center" style={{color:"#94a3b8"}}>{npItems.length + i + 1}</td>
                                  <td>
                                    <div style={{fontWeight:600,color:"#0369a1",fontSize:13}}>{ch.name}</div>
                                    <div style={{fontSize:10,color:"#94a3b8"}}>ADDED CHARGE</div>
                                  </td>
                                  <td className="text-center">{ch.quantity}</td>
                                  <td className="text-right">{fmtCur(ch.unitPrice)}</td>
                                  <td className="text-right" style={{fontWeight:700,color:"#0369a1"}}>{fmtCur(ch.amount)}</td>
                                  <td>
                                    <button className="cm-remove-btn" onClick={() => handleRemoveCharge(i)} title="Remove"><X size={12}/></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {epItems.length > 0 && (
                            <div style={{margin:"14px 0",padding:14,background:"#fdf2f8",borderRadius:10,border:"1px solid #fce7f3"}}>
                              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                                <div style={{fontSize:12,fontWeight:700,color:"#be185d"}}>💊 Medicine Details</div>
                                {rNo && <span style={{fontSize:10,fontWeight:600,color:"#be185d",background:"#fff",padding:"2px 8px",borderRadius:5,border:"1px solid #fce7f3"}}>Rx #{rNo}</span>}
                              </div>
                              {diag && (<div style={{fontSize:11,color:"#64748b",marginBottom:8,padding:"5px 8px",background:"#fff",borderRadius:5,border:"1px solid #fce7f3"}}><b style={{color:"#be185d"}}>Diagnosis:</b> {diag}</div>)}
                              <table className="cm-charges-table" style={{background:"#fff",borderRadius:6,overflow:"hidden"}}>
                                <thead>
                                  <tr style={{background:"#fce7f3"}}>
                                    <th style={{color:"#be185d"}}>#</th><th style={{color:"#be185d"}}>Medicine</th><th style={{color:"#be185d"}}>Dosage</th><th style={{color:"#be185d"}}>Freq</th>
                                    <th style={{color:"#be185d"}} className="text-center">Qty</th><th style={{color:"#be185d"}} className="text-right">Price</th><th style={{color:"#be185d"}} className="text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {epItems.map((m: any, idx: number) => (
                                    <tr key={m.id || idx}>
                                      <td style={{color:"#94a3b8",textAlign:"center"}}>{idx + 1}</td>
                                      <td style={{fontWeight:600,color:"#1e293b",fontSize:12}}>{m.name}</td>
                                      <td style={{color:"#475569",fontSize:11}}>{m.dosage}</td>
                                      <td style={{color:"#475569",fontSize:11}}>{m.frequency}</td>
                                      <td className="text-center">{m.quantity}</td>
                                      <td className="text-right">{fmtCur(m.unitPrice)}</td>
                                      <td className="text-right" style={{fontWeight:700}}>{fmtCur(m.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr style={{borderTop:"2px solid #fce7f3"}}>
                                    <td colSpan={6} style={{textAlign:"right",fontWeight:700,fontSize:12,color:"#be185d",paddingRight:10}}>Medicine Total</td>
                                    <td className="text-right" style={{fontWeight:800,fontSize:13,color:"#be185d"}}>{fmtCur(pTotal)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </>);
                      })()}

                      {/* Add extra charge form */}
                      {scope !== "pharmacy" && scope !== "lab" && (
                      <div className="cm-add-charge">
                        <div className="cm-section-title" style={{marginBottom:10}}><Plus size={14}/>Add Extra Charge</div>
                        <div className="cm-add-charge-row">
                          <input
                            className="cm-input cm-input-md"
                            placeholder="Charge name (e.g. Dressing, X-Ray)"
                            value={collectForm.newChargeName}
                            onChange={e => setCollectForm(f => ({...f, newChargeName: e.target.value}))}
                            onKeyDown={e => e.key === "Enter" && handleAddCharge()}
                          />
                          <input
                            className="cm-input cm-input-sm"
                            type="number" min="1" placeholder="Qty"
                            value={collectForm.newChargeQty}
                            onChange={e => setCollectForm(f => ({...f, newChargeQty: parseInt(e.target.value)||1}))}
                          />
                          <div className="cm-rate-wrap">
                            <span className="cm-rate-prefix">₹</span>
                            <input
                              className="cm-input cm-input-rate"
                              type="number" step="0.01" placeholder="Rate"
                              value={collectForm.newChargeRate > 0 ? collectForm.newChargeRate : ""}
                              onChange={e => { const v = parseFloat(e.target.value); setCollectForm(f => ({...f, newChargeRate: isNaN(v) ? 0 : v})); }}
                              onKeyDown={e => e.key === "Enter" && handleAddCharge()}
                            />
                          </div>
                          <button type="button" className="cm-add-btn" onClick={handleAddCharge} disabled={!(collectForm.newChargeName || "").trim() || (Number(collectForm.newChargeRate) || 0) <= 0}>
                            <Plus size={14}/>Add
                          </button>
                        </div>
                      </div>
                      )}

                      {/* GST */}
                      <div className="cm-section-title" style={{marginTop:16}}><PercentIcon size={14}/>Tax &amp; GST</div>
                      <div className="cm-gst-toggle">
                        <label className="cm-toggle-label">
                          <div className={`cm-toggle ${collectForm.isGst ? "cm-toggle-on" : ""}`} onClick={() => setCollectForm(f => ({...f, isGst: !f.isGst}))}>
                            <div className="cm-toggle-knob"/>
                          </div>
                          <span style={{fontWeight:600,color: collectForm.isGst ? "#0369a1" : "#64748b"}}>Apply GST</span>
                        </label>
                      </div>
                      {collectForm.isGst && (
                        <div className="cm-gst-fields">
                          <div className="cm-field-group">
                            <label>CGST (%)</label>
                            <input className="cm-input" type="number" step="0.01" value={collectForm.cgst}
                              onChange={e => setCollectForm(f => ({...f, cgst: parseFloat(e.target.value)||0}))} />
                          </div>
                          <div className="cm-field-group">
                            <label>SGST (%)</label>
                            <input className="cm-input" type="number" step="0.01" value={collectForm.sgst}
                              onChange={e => setCollectForm(f => ({...f, sgst: parseFloat(e.target.value)||0}))} />
                          </div>
                          <div className="cm-field-group">
                            <label>IGST (%)</label>
                            <input className="cm-input" type="number" step="0.01" value={collectForm.igst}
                              onChange={e => setCollectForm(f => ({...f, igst: parseFloat(e.target.value)||0}))} />
                          </div>
                        </div>
                      )}

                      {/* Discount */}
                      <div className="cm-field-group" style={{marginTop:16}}>
                        <div className="cm-section-title" style={{marginBottom:8}}><Tag size={14}/>Discount</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <div className="cm-rate-wrap">
                            <span className="cm-rate-prefix">₹</span>
                            <input className="cm-input" type="number" step="0.01" placeholder="0.00"
                              value={collectForm.discount || ""}
                              onChange={e => setCollectForm(f => ({...f, discount: parseFloat(e.target.value)||0}))} />
                          </div>
                          <input className="cm-input" type="text" placeholder="Remark (optional)"
                            value={collectForm.discountRemark}
                            onChange={e => setCollectForm(f => ({...f, discountRemark: e.target.value}))} />
                        </div>
                      </div>
                    </div>

                    {/* ── Right Column: Total + Payment ── */}
                    <div className="cm-right">
                      {/* Live Total Box */}
                      <div className="cm-total-box">
                        <div className="cm-total-row"><span>{liveTotals.hasPaidProcedures && scope !== "procedure" ? "Remaining Charges" : "Base Charges"}</span><span>{fmtCur(liveTotals.base)}</span></div>
                        {liveTotals.added > 0 && <div className="cm-total-row"><span>Extra Charges</span><span style={{color:"#0369a1"}}>+{fmtCur(liveTotals.added)}</span></div>}
                        {collectForm.isGst && liveTotals.cgstAmt > 0 && <div className="cm-total-row"><span>CGST ({collectForm.cgst}%)</span><span>{fmtCur(liveTotals.cgstAmt)}</span></div>}
                        {collectForm.isGst && liveTotals.sgstAmt > 0 && <div className="cm-total-row"><span>SGST ({collectForm.sgst}%)</span><span>{fmtCur(liveTotals.sgstAmt)}</span></div>}
                        {collectForm.isGst && liveTotals.igstAmt > 0 && <div className="cm-total-row"><span>IGST ({collectForm.igst}%)</span><span>{fmtCur(liveTotals.igstAmt)}</span></div>}
                        {(collectForm.discount||0) > 0 && <div className="cm-total-row"><span>Discount</span><span style={{color:"#059669"}}>-{fmtCur(collectForm.discount)}</span></div>}
                        {liveTotals.hasPaidProcedures && scope !== "procedure" && (
                          <div className="cm-total-row" style={{color:"#b45309",borderTop:"1px dashed #fde68a",paddingTop:6,marginTop:6}}>
                            <span>Already Collected (Procedure)</span>
                            <span style={{fontWeight:700}}>- {fmtCur(liveTotals.paidAmount)}</span>
                          </div>
                        )}
                        <div className="cm-total-final">
                          <span>{liveTotals.hasPaidProcedures && scope !== "procedure" ? "Remaining Balance" : "Total Payable"}</span>
                          <strong>{fmtCur(liveTotals.total)}</strong>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="cm-section-title" style={{marginTop:16,marginBottom:10}}><IndianRupee size={14}/>Payment</div>
                      <div className="cm-pay-methods">
                        {["CASH","CARD","UPI","INSURANCE","OTHER"].map(m => (
                          <button key={m} className={`cm-pay-method ${collectForm.method === m ? "active" : ""}`}
                            onClick={() => setCollectForm(f => ({...f, method: m}))}>
                            {m === "CASH" ? <Banknote size={14} /> : m === "CARD" ? <CreditCard size={14} /> : m === "UPI" ? <Smartphone size={14} /> : m === "INSURANCE" ? <ShieldCheck size={14} /> : <Settings2 size={14} />} {m}
                          </button>
                        ))}
                      </div>
                      {collectForm.method !== "CASH" && (
                        <div className="cm-field-group" style={{marginTop:10}}>
                          <label>Transaction / Ref ID</label>
                          <input className="cm-input" type="text" placeholder="Optional reference number"
                            value={collectForm.transactionId}
                            onChange={e => setCollectForm(f => ({...f, transactionId: e.target.value}))} />
                        </div>
                      )}
                      <div className="cm-field-group" style={{marginTop:10}}>
                        <label>Notes (optional)</label>
                        <textarea className="cm-input cm-textarea" rows={2} placeholder="Any remarks..."
                          value={collectForm.notes}
                          onChange={e => setCollectForm(f => ({...f, notes: e.target.value}))} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Body: Receipt Step ── */}
              {collectStep === "receipt" && selectedItem && (
                <div className="bq-modal-body">
                  <div className="cm-success-banner">
                    <CheckCircle size={22} color="#059669"/>
                    <span>Payment of <strong>{fmtCur(liveTotals.total)}</strong> collected via {collectForm.method}{deptName ? ` · Collected by ${deptName}` : ""}</span>
                  </div>
                  {/* ── Professional Bill ── */}
                  <div ref={printRef} className="bill-print-wrap" style={hospitalInfo.letterhead ? {
                    backgroundImage: `url(${hospitalInfo.letterhead.match(/\.pdf$/i) || hospitalInfo.letterhead.includes('/raw/upload/')
                      ? hospitalInfo.letterhead.replace('/upload/', '/upload/f_png,pg_1/').replace(/\.pdf$/i, '.png')
                      : hospitalInfo.letterhead})`,
                    backgroundSize: "100% 100%",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  } : undefined}>
                    {/* Hospital Header — only shown when no letterhead */}
                    {!hospitalInfo.letterhead ? (
                    <div className="bill-ph">
                      <div className="bill-ph-left">
                        {hospitalInfo.logo && <img src={hospitalInfo.logo} alt={hospitalInfo.name} style={{maxHeight:56,maxWidth:120,objectFit:"contain",marginBottom:8}}/>}
                        {!hospitalInfo.logo && <h1>{hospitalInfo.name}</h1>}
                        {hospitalInfo.address && <p><MapPin size={11} style={{display:"inline",marginRight:3}}/>{hospitalInfo.address}</p>}
                      </div>
                      <div className="bill-ph-right">
                        <div className="bill-ph-badge">INVOICE</div>
                        <h2>{paidBill?.billNo || selectedItem.bill?.billNo}</h2>
                        <p><Phone size={11} style={{display:"inline",marginRight:3}}/>{hospitalInfo.phone || "—"}</p>
                        <p><Mail size={11} style={{display:"inline",marginRight:3}}/>{hospitalInfo.email || "—"}</p>
                      </div>
                    </div>
                    ) : (
                    <div style={{display:"flex",justifyContent:"flex-end",padding:"70px 28px 0"}}>
                      <div style={{textAlign:"right"}}>
                        <div className="bill-ph-badge">INVOICE</div>
                        <h2 style={{fontSize:18,fontWeight:700,color:"#1e293b",margin:"4px 0"}}>{paidBill?.billNo || selectedItem.bill?.billNo}</h2>
                        <p style={{fontSize:12,color:"#64748b"}}>{fmtDate(selectedItem.appointmentDate)}</p>
                      </div>
                    </div>
                    )}

                    {/* Bill Meta */}
                    <div className="bill-meta-grid">
                      <div className="bill-meta-item">
                        <label>Patient Name</label>
                        <span>{selectedItem.patient.name}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Patient ID</label>
                        <span>{selectedItem.patient.patientId}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Date</label>
                        <span>{fmtDate(selectedItem.appointmentDate)}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Time</label>
                        <span>{selectedItem.timeSlot ? fmtTime(selectedItem.timeSlot) : "Walk-in"}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Consultation By</label>
                        <span>{selectedItem.doctor ? `Dr. ${selectedItem.doctor.name}${selectedItem.doctor.specialization ? ` · ${selectedItem.doctor.specialization}` : ""}` : "Walk-in Patient"}</span>
                      </div>
                      <div className="bill-meta-item">
                        <label>Department</label>
                        <span>{selectedItem.department?.name || selectedItem.subDepartment?.name || "—"}</span>
                      </div>
                    </div>

                    {/* Items + Pharmacy Detail (Receipt HTML) */}
                    {(() => {
                      const rcptBill = paidBill ? { ...selectedItem.bill, billItems: paidBill.billItems || selectedItem.bill?.billItems } : selectedItem.bill;
                      const scopedRcptBill = scope === "procedure" ? getProcedureScopedBill(rcptBill, scope) : getRemainingChargesBill(rcptBill, scope);
                      const { nonPharmacyItems: npR, enrichedPharmacy: epR, pharmacyTotal: ptR, rxNo: rnR, diagnosis: dgR } = splitBillItems(scopedRcptBill);
                      return (<>
                        {npR.length > 0 && (
                          <table className="bill-items-table">
                            <thead><tr><th style={{width:36}}>#</th><th>Description</th><th className="text-center">Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr></thead>
                            <tbody>
                              {npR.map((it: any, i: number) => (
                                <tr key={it.id || i}>
                                  <td className="text-center" style={{color:"#94a3b8",fontSize:12}}>{i+1}</td>
                                  <td><span style={{fontWeight:600}}>{it.name}</span>{it.type && it.type !== "CONSULTATION" && <span style={{fontSize:10,color:"#94a3b8",marginLeft:6,textTransform:"uppercase"}}>{it.type}</span>}</td>
                                  <td className="text-center">{it.quantity}</td>
                                  <td className="text-right">{fmtCur(it.unitPrice)}</td>
                                  <td className="text-right" style={{fontWeight:700}}>{fmtCur(it.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {epR.length > 0 && (
                          <div style={{margin:"20px 0",padding:16,background:"#fdf2f8",borderRadius:10,border:"1px solid #fce7f3"}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                              <div style={{fontSize:13,fontWeight:700,color:"#be185d"}}>💊 Pharmacy — Medicine Details</div>
                              {rnR && <span style={{fontSize:11,fontWeight:600,color:"#be185d",background:"#fff",padding:"3px 10px",borderRadius:6,border:"1px solid #fce7f3"}}>Rx #{rnR}</span>}
                            </div>
                            {dgR && (<div style={{fontSize:12,color:"#64748b",marginBottom:8,padding:"6px 10px",background:"#fff",borderRadius:6,border:"1px solid #fce7f3"}}><b style={{color:"#be185d"}}>Diagnosis:</b> {dgR}</div>)}
                            <table className="bill-items-table" style={{margin:0}}>
                              <thead>
                                <tr style={{background:"#fce7f3"}}>
                                  <th style={{width:32,color:"#be185d"}}>#</th><th style={{color:"#be185d"}}>Medicine Name</th><th style={{color:"#be185d"}}>Dosage</th>
                                  <th style={{color:"#be185d"}}>Frequency</th><th style={{color:"#be185d"}} className="text-center">Qty</th>
                                  <th style={{color:"#be185d"}} className="text-right">Unit Price</th><th style={{color:"#be185d"}} className="text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {epR.map((m: any, idx: number) => (
                                  <tr key={m.id || idx}>
                                    <td style={{color:"#94a3b8",textAlign:"center"}}>{idx + 1}</td>
                                    <td style={{fontWeight:600,color:"#1e293b"}}>{m.name}</td>
                                    <td style={{color:"#475569",fontSize:12}}>{m.dosage}</td>
                                    <td style={{color:"#475569",fontSize:12}}>{m.frequency}</td>
                                    <td className="text-center">{m.quantity}</td>
                                    <td className="text-right">{fmtCur(m.unitPrice)}</td>
                                    <td className="text-right" style={{fontWeight:700}}>{fmtCur(m.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr style={{borderTop:"2px solid #fce7f3"}}>
                                  <td colSpan={6} style={{textAlign:"right",fontWeight:700,fontSize:13,color:"#be185d",paddingRight:12}}>Medicine Total</td>
                                  <td className="text-right" style={{fontWeight:800,fontSize:14,color:"#be185d"}}>{fmtCur(ptR)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </>);
                    })()}

                    {/* Summary */}
                    <div className="bill-summary-wrap">
                      <div className="bill-summary-inner">
                        <div className="bill-sum-row"><span>Subtotal</span><span>{fmtCur(liveTotals.gross)}</span></div>
                        {collectForm.isGst && liveTotals.cgstAmt > 0 && <div className="bill-sum-row"><span>CGST ({collectForm.cgst}%)</span><span>{fmtCur(liveTotals.cgstAmt)}</span></div>}
                        {collectForm.isGst && liveTotals.sgstAmt > 0 && <div className="bill-sum-row"><span>SGST ({collectForm.sgst}%)</span><span>{fmtCur(liveTotals.sgstAmt)}</span></div>}
                        {collectForm.isGst && liveTotals.igstAmt > 0 && <div className="bill-sum-row"><span>IGST ({collectForm.igst}%)</span><span>{fmtCur(liveTotals.igstAmt)}</span></div>}
                        {((collectForm.discount||0) > 0) && (
                          <div className="bill-sum-row" style={{color:"#059669"}}>
                            <span>Discount</span><span>−{fmtCur(collectForm.discount)}</span>
                          </div>
                        )}
                        {liveTotals.hasPaidProcedures && scope !== "procedure" && (
                          <div className="bill-sum-row" style={{color:"#b45309",borderTop:"1px dashed #fde68a",paddingTop:6,marginTop:4}}>
                            <span style={{fontSize:11}}>{selectedItem.bill?.notes?.match(/Collected by [^|]+/)?.[0]?.trim() || "Procedure charges collected"}</span>
                            <span>✓ {fmtCur(liveTotals.paidAmount)}</span>
                          </div>
                        )}
                        <div className="bill-sum-total">
                          <span>{liveTotals.hasPaidProcedures && scope !== "procedure" ? "Now Collecting" : "Total Amount"}</span>
                          <strong>{fmtCur(liveTotals.total)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Payment strip */}
                    <div className="bill-pay-strip">
                      <div className="bill-pay-item"><span>Payment Method</span><strong>{collectForm.method}</strong></div>
                      <div className="bill-pay-item"><span>Amount Collected</span><strong>{fmtCur(liveTotals.total)}</strong></div>
                      <div className="bill-pay-item"><span>Status</span><span className="bill-paid-badge">{liveTotals.hasPaidProcedures && scope !== "procedure" ? "FULLY PAID" : scope === "procedure" ? "PARTIAL" : "PAID"}</span></div>
                      {collectForm.transactionId && <div className="bill-pay-item"><span>Txn ID</span><strong>{collectForm.transactionId}</strong></div>}
                      {deptName && <div className="bill-pay-item"><span>Collected By</span><strong>{deptName}</strong></div>}
                    </div>

                    <div className="bill-footer-note">
                      <p>Thank you for choosing <strong>{hospitalInfo.name}</strong></p>
                      <p>This is a computer-generated invoice. No signature required.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Footer ── */}
              <div className="bq-modal-footer">
                {collectStep === "billing" ? (
                  <>
                    <button className="bq-btn-secondary" onClick={() => setViewMode(null)} disabled={processing}>Cancel</button>
                    <button className="bq-btn-collect-main" onClick={handleCollectAndGenerate} disabled={processing}>
                      {processing ? <><Loader2 size={15} style={{animation:"spin .7s linear infinite"}}/>Processing...</> : <><ChevronRight size={15}/>Collect &amp; Generate Bill</>}
                    </button>
                  </>
                ) : (
                  <button className="bq-btn-primary" onClick={() => setViewMode(null)}>Close</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="bq-modal-overlay" onClick={() => setConfirmModal({ show: false, item: null })}>
          <div className="bq-modal bq-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="bq-modal-body">
              <div className="bq-confirm-icon">
                <AlertTriangle size={28} color="#a16207" />
              </div>
              <div className="bq-confirm-title">Regenerate Bill?</div>
              <div className="bq-confirm-message">
                This will revert the bill to PENDING status, remove all existing payments, and allow you to edit charges and re-collect payment. This action cannot be undone.
              </div>
              <div className="bq-confirm-actions">
                <button className="bq-confirm-cancel" onClick={() => setConfirmModal({ show: false, item: null })}>
                  Cancel
                </button>
                <button className="bq-confirm-proceed" onClick={confirmRegenerate}>
                  Yes, Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Toast Notification */}
      {toast && (
        <div className={`bq-toast bq-toast-${toast.type}`}>
          <div className="bq-toast-icon-wrap">
            {toast.type === "success" && (
              <svg className="bq-toast-checkmark" viewBox="0 0 52 52" width="32" height="32">
                <circle className="bq-toast-circle" cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="bq-toast-check" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" />
              </svg>
            )}
            {toast.type === "error" && <XCircle size={32} />}
            {toast.type === "warning" && <AlertTriangle size={32} />}
          </div>
          <div className="bq-toast-content">
            <div className="bq-toast-title">{toast.title}</div>
            <div className="bq-toast-msg">{toast.message}</div>
          </div>
          <button className="bq-toast-close" onClick={() => setToast(null)}><X size={16} /></button>
          <div className="bq-toast-timer" />
        </div>
      )}
    </>
  );
}

const BQ_CSS = `
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* ── Layout ── */
.bq-wrap{font-family:'Inter',system-ui,sans-serif;padding:24px;background:#fff;min-height:100%;box-sizing:border-box}
.bq-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:20px}
.bq-stat-card{padding:18px 20px;border-radius:12px;display:flex;align-items:center;gap:14px;border:1px solid;transition:all .2s}
.bq-stat-card:hover{transform:translateY(-1px)}
.bq-stat-blue{background:#f0f9ff;border-color:#bae6fd}.bq-stat-blue .bq-stat-icon{background:#dbeafe;color:#0284c7}.bq-stat-blue .bq-stat-value{color:#0369a1}.bq-stat-blue .bq-stat-label{color:#0284c7}
.bq-stat-amber{background:#E6F4F4;border-color:#b2d8da}.bq-stat-amber .bq-stat-icon{background:#cce8ea;color:#0E898F}.bq-stat-amber .bq-stat-value{color:#0b7075}.bq-stat-amber .bq-stat-label{color:#0E898F}
.bq-stat-green{background:#f0fdf4;border-color:#bbf7d0}.bq-stat-green .bq-stat-icon{background:#dcfce7;color:#059669}.bq-stat-green .bq-stat-value{color:#166534}.bq-stat-green .bq-stat-label{color:#059669}
.bq-stat-icon{width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.bq-stat-value{font-size:22px;font-weight:800;line-height:1}
.bq-stat-label{font-size:12px;margin-top:3px;font-weight:600}

/* ── Filters ── */
.bq-filters{display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.bq-search{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;flex:1;min-width:220px}
.bq-search input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%;font-family:inherit}
.bq-date-input{padding:10px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-size:13px;color:#334155;outline:none;font-family:inherit}

/* ── Sort Dropdown ── */
.bq-sort-wrap{position:relative}
.bq-sort-trigger{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:600;color:#334155;cursor:pointer;transition:all .2s;white-space:nowrap;font-family:inherit}
.bq-sort-trigger:hover{border-color:#93c5fd;background:#f8fafc}
.bq-sort-chevron{transition:transform .2s ease;color:#94a3b8}
.bq-sort-chevron-open{transform:rotate(180deg)}
.bq-sort-dropdown{position:absolute;top:calc(100% + 6px);right:0;z-index:100;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 12px 36px rgba(0,0,0,.1),0 2px 8px rgba(0,0,0,.04);min-width:220px;padding:6px;animation:fadeSlideIn .15s ease;overflow:hidden}
.bq-sort-option{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border:none;background:none;font-size:13px;color:#475569;cursor:pointer;border-radius:8px;transition:all .15s;font-family:inherit;text-align:left}
.bq-sort-option:hover{background:#f0f9ff;color:#0369a1}
.bq-sort-option-active{background:#eff6ff;color:#0369a1;font-weight:700}
.bq-sort-option-icon{width:22px;height:22px;border-radius:6px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#64748b;flex-shrink:0}
.bq-sort-option-active .bq-sort-option-icon{background:#dbeafe;color:#0369a1}
.bq-sort-check{color:#0ea5e9;margin-left:auto;flex-shrink:0}

/* ── Buttons ── */
.bq-btn-primary,.bq-btn-secondary{padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;border:none;transition:all .2s}
.bq-btn-primary{background:#0ea5e9;color:#fff}.bq-btn-primary:hover{background:#0284c7}.bq-btn-primary:disabled{opacity:.6;cursor:not-allowed}
.bq-btn-secondary{background:#fff;color:#64748b;border:1px solid #e2e8f0}.bq-btn-secondary:hover{background:#f8fafc}.bq-btn-secondary:disabled{opacity:.6;cursor:not-allowed}
.bq-btn-icon{background:none;border:none;cursor:pointer;color:#64748b;padding:6px;border-radius:6px;transition:all .2s;display:flex;align-items:center;justify-content:center}
.bq-btn-icon:hover{background:#f1f5f9;color:#334155}
.bq-btn-collect-main{padding:11px 22px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;border:none;background:#10b981;color:#fff;transition:all .2s}
.bq-btn-collect-main:hover{background:#059669}
.bq-btn-collect-main:disabled{opacity:.6;cursor:not-allowed}

/* ── Table Card ── */
.bq-card{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:none}
.bq-loading{padding:60px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;color:#94a3b8;font-size:14px}
.bq-empty{padding:60px 20px;text-align:center;color:#94a3b8}
.bq-empty-title{font-size:15px;font-weight:600;margin-top:12px;color:#64748b}
.bq-empty-sub{font-size:13px;margin-top:4px}
.bq-table{width:100%;border-collapse:collapse}
.bq-table thead{background:#f8fafc}
.bq-table th{text-align:left;font-size:11px;font-weight:600;color:#94a3b8;padding:14px 16px;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.05em}
.bq-table td{padding:12px 16px;border-bottom:1px solid #f8fafc;font-size:13px;color:#475569;vertical-align:middle}
.bq-table tbody tr:hover{background:#fafbfc}
.bq-patient{display:flex;align-items:center;gap:10px}
.bq-patient-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#0ea5e9,#0284c7);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0}
.bq-patient-name{font-weight:700;color:#1e293b;font-size:13px}
.bq-patient-id{font-size:11px;color:#94a3b8;margin-top:2px}
.bq-doctor-name{font-weight:600;color:#334155;font-size:13px}
.bq-doctor-spec{font-size:11px;color:#94a3b8;margin-top:2px}
.bq-date{font-weight:600;color:#334155;font-size:13px}
.bq-time{font-size:11px;color:#94a3b8;margin-top:2px}
.bq-fee{font-weight:700;color:#1e293b}
.bq-total{font-weight:800;color:#0ea5e9;font-size:14px}
.bq-badge{font-size:11px;padding:4px 10px;border-radius:100px;font-weight:700;display:inline-block}
.bq-actions{display:flex;gap:6px;align-items:center}
.bq-action-btn{padding:6px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
.bq-action-btn:disabled{opacity:.5;cursor:not-allowed}
.bq-action-view{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}.bq-action-view:hover:not(:disabled){background:#e2e8f0}
.bq-action-download{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}.bq-action-download:hover:not(:disabled){background:#e2e8f0}
.bq-action-email{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}.bq-action-email:hover:not(:disabled){background:#e2e8f0}
.bq-action-collect{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}.bq-action-collect:hover:not(:disabled){background:#e2e8f0}
.bq-action-regenerate{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}.bq-action-regenerate:hover:not(:disabled){background:#e2e8f0}
.bq-action-delete{background:#fee2e2;color:#dc2626;border:1px solid #fecaca}.bq-action-delete:hover:not(:disabled){background:#fecaca}
.text-center{text-align:center}.text-right{text-align:right}

/* ── Modal Overlay & Shell ── */
.bq-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(3px);padding:16px}
.bq-modal{background:#fff;border-radius:18px;width:100%;max-width:520px;box-shadow:0 24px 80px rgba(0,0,0,.22);max-height:92vh;overflow:hidden;display:flex;flex-direction:column;animation:fadeSlideIn .2s ease}
.bq-modal-large{max-width:860px}
.bq-modal-xl{max-width:1080px}
.bq-modal-header{padding:18px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.bq-modal-header h3{font-size:16px;font-weight:700;color:#1e293b;margin:0}
.bq-modal-body{padding:24px;overflow-y:auto;flex:1}
.bq-modal-footer{padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;background:#fafbfc}

/* ── Collect Modal — Patient Strip ── */
.cm-header-icon{width:36px;height:36px;border-radius:10px;background:#f0f9ff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cm-header-paid{background:#f0fdf4}
.cm-patient-strip{display:flex;align-items:center;gap:14px;padding:14px 18px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:12px;margin-bottom:20px;border:1px solid #bae6fd}
.cm-patient-avatar{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#0ea5e9,#0284c7);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;flex-shrink:0}
.cm-patient-name{font-size:15px;font-weight:700;color:#1e293b}
.cm-patient-meta{font-size:12px;color:#64748b;margin-top:2px;display:flex;align-items:center;gap:4px}

/* ── Collect Modal — Layout ── */
.cm-layout{display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start}
@media(max-width:780px){.cm-layout{grid-template-columns:1fr}}

/* ── Collect Modal — Left: Charges ── */
.cm-section-title{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
.cm-charges-table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:0}
.cm-charges-table thead{background:#f8fafc}
.cm-charges-table th{padding:9px 10px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #f1f5f9;text-align:left}
.cm-charges-table td{padding:9px 10px;border-bottom:1px solid #f8fafc;color:#334155;vertical-align:middle}
.cm-charges-table tbody tr:hover{background:#fafbfc}
.cm-added-row td{background:#f0f9ff!important}
.cm-remove-btn{background:none;border:none;cursor:pointer;color:#94a3b8;padding:3px;border-radius:4px;display:flex;align-items:center;transition:all .15s}
.cm-remove-btn:hover{background:#fee2e2;color:#dc2626}

/* ── Collect Modal — Add Charge Form ── */
.cm-add-charge{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:16px;margin-top:12px}
.cm-add-charge-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.cm-input{padding:9px 12px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:13px;color:#334155;outline:none;font-family:inherit;transition:border-color .2s}
.cm-input:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.1)}
.cm-input-flex{flex:1;min-width:140px}
.cm-input-md{width:200px}
.cm-input-sm{width:72px}
.cm-input-rate{width:100px}
.cm-textarea{resize:none;width:100%}
.cm-rate-wrap{position:relative;display:flex;align-items:center}
.cm-rate-prefix{position:absolute;left:9px;font-size:13px;color:#94a3b8;pointer-events:none;z-index:1}
.cm-rate-wrap .cm-input{padding-left:22px}
.cm-add-btn{padding:9px 16px;border-radius:8px;background:#0ea5e9;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s;white-space:nowrap}
.cm-add-btn:hover:not(:disabled){background:#0284c7}
.cm-add-btn:disabled{opacity:.4;cursor:not-allowed}

/* ── Collect Modal — Right: GST + Total + Payment ── */
.cm-field-group label{display:block;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.cm-gst-toggle{margin-bottom:12px}
.cm-toggle-label{display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
.cm-toggle{width:40px;height:22px;border-radius:100px;background:#e2e8f0;position:relative;transition:background .2s;flex-shrink:0;cursor:pointer}
.cm-toggle-on{background:#0ea5e9}
.cm-toggle-knob{width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.cm-toggle-on .cm-toggle-knob{left:20px}
.cm-gst-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:4px}
.cm-total-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-top:14px}
.cm-total-row{display:flex;justify-content:space-between;font-size:13px;color:#64748b;margin-bottom:8px}
.cm-total-final{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #e2e8f0;margin-top:4px;font-size:14px;color:#1e293b}
.cm-total-final strong{font-size:22px;font-weight:800;color:#0ea5e9}
.cm-pay-methods{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:4px}
.cm-pay-method{padding:7px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;transition:all .2s}
.cm-pay-method:hover{border-color:#0ea5e9;color:#0ea5e9}
.cm-pay-method.active{border-color:#0ea5e9;background:#f0f9ff;color:#0369a1;font-weight:700}

/* ── Success Banner ── */
.cm-success-banner{display:flex;align-items:center;gap:12px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:14px 18px;margin-bottom:24px;font-size:14px;color:#166534;animation:fadeSlideIn .3s ease}

/* ── Professional Bill Format ── */
.bill-print-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;animation:fadeSlideIn .3s ease}
.bill-ph{display:flex;justify-content:space-between;align-items:flex-start;padding:24px 28px;background:linear-gradient(135deg,#f8fafc,#f0f9ff);border-bottom:3px solid #0ea5e9}
.bill-ph-left h1{font-size:20px;font-weight:800;color:#0ea5e9;margin:8px 0 4px}
.bill-ph-left p{font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px;margin-top:3px}
.bill-ph-right{text-align:right}
.bill-ph-badge{display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;font-size:10px;font-weight:800;letter-spacing:.12em;padding:4px 12px;border-radius:100px;margin-bottom:8px}
.bill-ph-right h2{font-size:18px;font-weight:700;color:#1e293b;margin:4px 0}
.bill-ph-right p{font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:3px}
.bill-logo-sq{width:64px;height:64px;border-radius:14px;background:#e0f2fe;display:flex;align-items:center;justify-content:center}
.bill-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid #f1f5f9}
.bill-meta-item{padding:14px 20px;border-right:1px solid #f1f5f9}
.bill-meta-item:last-child{border-right:none}
.bill-meta-item label{display:block;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.bill-meta-item span{font-size:13px;font-weight:600;color:#1e293b}
.bill-items-table{width:100%;border-collapse:collapse;margin:0}
.bill-items-table thead{background:#f8fafc}
.bill-items-table th{padding:12px 20px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #f1f5f9;text-align:left}
.bill-items-table td{padding:12px 20px;font-size:13px;color:#334155;border-bottom:1px solid #f8fafc}
.bill-items-table tbody tr:last-child td{border-bottom:none}
.bill-summary-wrap{padding:20px;background:#f8fafc;border-top:1px solid #f1f5f9}
.bill-summary-inner{max-width:320px;margin-left:auto}
.bill-sum-row{display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:8px}
.bill-sum-total{display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #0ea5e9;margin-top:8px;font-size:16px;color:#1e293b}
.bill-sum-total strong{font-size:20px;font-weight:800;color:#0ea5e9}
.bill-pay-strip{display:flex;align-items:center;flex-wrap:wrap;gap:0;background:#f0fdf4;border-top:1px solid #bbf7d0;padding:14px 20px}
.bill-pay-item{display:flex;flex-direction:column;margin-right:32px}
.bill-pay-item span:first-child{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.bill-pay-item strong{font-size:13px;font-weight:700;color:#166534}
.bill-paid-badge{display:inline-block;background:#dcfce7;color:#166534;font-size:11px;font-weight:800;padding:3px 10px;border-radius:100px;border:1px solid #86efac}
.bill-footer-note{padding:16px 20px;text-align:center;border-top:1px dashed #e2e8f0}
.bill-footer-note p{font-size:12px;color:#94a3b8;margin:0;line-height:1.8}

/* ── View Modal — Bill block ── */
.bill-container{padding:20px;background:#fff}
.bill-header{display:flex;justify-content:space-between;align-items:start;margin-bottom:20px;padding-bottom:20px;border-bottom:2px solid #e2e8f0}
.bill-logo-placeholder{width:80px;height:80px;border-radius:12px;background:#f0f9ff;display:flex;align-items:center;justify-content:center}
.bill-hospital-info{text-align:right}
.bill-hospital-info h2{font-size:20px;font-weight:800;color:#1e293b;margin:0 0 8px}
.bill-info-row{display:flex;align-items:center;gap:6px;justify-content:flex-end;font-size:12px;color:#64748b;margin-top:4px}
.bill-divider{height:2px;background:linear-gradient(90deg,#0ea5e9,#0284c7);margin:20px 0}
.bill-info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px}
.bill-label{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.bill-value{font-size:14px;font-weight:600;color:#1e293b}
.bill-table{width:100%;border-collapse:collapse;margin:20px 0}
.bill-table thead{background:#f8fafc}
.bill-table th{padding:12px;text-align:left;font-size:12px;font-weight:600;color:#64748b;border-bottom:2px solid #e2e8f0}
.bill-table td{padding:12px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}
.bill-summary{background:#f8fafc;border-radius:10px;padding:16px;margin-top:24px}
.bill-summary-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#475569;margin-bottom:8px}
.bill-summary-row:last-child{margin-bottom:0}
.bill-total{padding-top:12px;border-top:2px solid #e2e8f0;margin-top:8px;font-size:16px;font-weight:700;color:#1e293b}
.text-success{color:#059669}
.bill-footer{margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center}
.bill-footer p{margin:0;font-size:13px;color:#64748b}

/* ── Checkbox ── */
.bq-checkbox{width:16px;height:16px;accent-color:#0ea5e9;cursor:pointer;border-radius:4px}
.bq-row-selected{background:#f0f9ff !important}
.bq-row-selected td{background:#f0f9ff !important}

/* ── Bulk Action Bar ── */
.bq-bulk-bar{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #93c5fd;border-radius:12px;padding:12px 20px;margin-bottom:16px;animation:fadeSlideIn .25s ease}
.bq-bulk-info{display:flex;align-items:center;gap:8px;font-size:13px;color:#1e40af;font-weight:600}
.bq-bulk-actions{display:flex;align-items:center;gap:8px}
.bq-btn-bulk-email{padding:8px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;border:none;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;box-shadow:0 2px 8px rgba(14,165,233,.3);transition:all .2s}
.bq-btn-bulk-email:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(14,165,233,.4)}
.bq-btn-bulk-email:disabled{opacity:.6;cursor:not-allowed;transform:none}
.bq-btn-bulk-delete{padding:8px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;border:none;background:#fee2e2;color:#dc2626;transition:all .2s}
.bq-btn-bulk-delete:hover{background:#fecaca;transform:translateY(-1px)}
.bq-btn-bulk-delete:disabled{opacity:.6;cursor:not-allowed;transform:none}
.bq-bulk-progress{display:flex;align-items:center;gap:12px;flex:1;margin-left:20px}
.bq-bulk-progress-bar{flex:1;height:8px;background:#e2e8f0;border-radius:100px;overflow:hidden}
.bq-bulk-progress-fill{height:100%;background:linear-gradient(90deg,#0ea5e9,#06b6d4);border-radius:100px;transition:width .3s ease}
.bq-bulk-progress-text{font-size:12px;color:#475569;font-weight:600;white-space:nowrap}

/* ── Toast Notification ── */
@keyframes toastSlideIn{from{opacity:0;transform:translateX(40px) scale(.95)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes toastTimerShrink{from{width:100%}to{width:0%}}
@keyframes checkCircleDraw{0%{stroke-dashoffset:166}100%{stroke-dashoffset:0}}
@keyframes checkDraw{0%{stroke-dashoffset:48}100%{stroke-dashoffset:0}}
@keyframes toastPop{0%{transform:scale(0)}50%{transform:scale(1.15)}100%{transform:scale(1)}}

.bq-toast{position:fixed;top:28px;right:28px;z-index:10000;display:flex;align-items:center;gap:14px;padding:16px 20px;border-radius:14px;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);animation:toastSlideIn .35s cubic-bezier(.21,1.02,.73,1);max-width:420px;min-width:320px;border-left:4px solid #10b981;overflow:hidden}
.bq-toast-success{border-left-color:#10b981}
.bq-toast-error{border-left-color:#ef4444}
.bq-toast-warning{border-left-color:#f59e0b}

.bq-toast-icon-wrap{flex-shrink:0;width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;animation:toastPop .4s cubic-bezier(.21,1.02,.73,1) .1s both}
.bq-toast-success .bq-toast-icon-wrap{background:#f0fdf4;color:#10b981}
.bq-toast-error .bq-toast-icon-wrap{background:#fef2f2;color:#ef4444}
.bq-toast-warning .bq-toast-icon-wrap{background:#fffbeb;color:#f59e0b}

.bq-toast-checkmark{color:#10b981}
.bq-toast-circle{stroke-dasharray:166;stroke-dashoffset:166;animation:checkCircleDraw .5s cubic-bezier(.65,0,.45,1) .15s forwards}
.bq-toast-check{stroke-dasharray:48;stroke-dashoffset:48;animation:checkDraw .35s cubic-bezier(.65,0,.45,1) .45s forwards}

.bq-toast-content{flex:1;min-width:0}
.bq-toast-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:2px}
.bq-toast-msg{font-size:12px;color:#64748b;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.bq-toast-close{flex-shrink:0;background:none;border:none;cursor:pointer;color:#94a3b8;padding:4px;border-radius:6px;transition:all .2s;display:flex;align-items:center;justify-content:center}
.bq-toast-close:hover{background:#f1f5f9;color:#475569}

.bq-toast-timer{position:absolute;bottom:0;left:0;height:3px;border-radius:0 0 0 14px;animation:toastTimerShrink 4s linear forwards}
.bq-toast-success .bq-toast-timer{background:linear-gradient(90deg,#10b981,#34d399)}
.bq-toast-error .bq-toast-timer{background:linear-gradient(90deg,#ef4444,#f87171)}
.bq-toast-warning .bq-toast-timer{background:linear-gradient(90deg,#f59e0b,#fbbf24)}

/* ── Confirmation Modal ── */
.bq-confirm-modal{max-width:480px}
.bq-confirm-icon{width:56px;height:56px;border-radius:14px;background:#E6F4F4;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;flex-shrink:0}
.bq-confirm-title{font-size:18px;font-weight:700;color:#1e293b;text-align:center;margin-bottom:8px}
.bq-confirm-message{font-size:14px;color:#64748b;text-align:center;line-height:1.6;margin-bottom:24px}
.bq-confirm-actions{display:flex;gap:10px;justify-content:center}
.bq-confirm-cancel{padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;background:#fff;color:#64748b;border:1px solid #e2e8f0;transition:all .2s}
.bq-confirm-cancel:hover{background:#f8fafc}
.bq-confirm-proceed{padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;background:#a16207;color:#fff;border:none;transition:all .2s}
.bq-confirm-proceed:hover{background:#92570a}
`;
