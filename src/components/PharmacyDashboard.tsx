"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";

import {

  Pill, Search, RefreshCw, Loader2, X, Check, AlertTriangle, Clock,

  Package, TrendingUp, ShoppingCart, FileText, BarChart2, Users,

  ChevronDown, ChevronUp, ChevronRight, Eye, Download, Filter,

  AlertCircle, CheckCircle2, DollarSign, IndianRupee, ArrowUpDown,

  Layers, Activity, Plus, Trash2, Edit2, Boxes, Truck, Bell,

  ClipboardList, Calendar, User, Phone, Stethoscope, Receipt,

  ArrowRight, Ban, PlayCircle, Archive, ShieldCheck, CreditCard,

  Banknote, Wallet, Hash, BadgeAlert, CircleDot, Zap, Info, History, Send, Smartphone, UserCheck,

  FileSpreadsheet, FileType, Table, TrendingDown,

  UserPlus, Activity as ActivityIcon, FlaskConical, TestTube2, Layers as LayersIcon, RotateCcw, Printer

} from "lucide-react";

import { 

  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 

  ResponsiveContainer, PieChart, Pie, Cell 

} from "recharts";

import AdminInventoryPanel from "./AdminInventoryPanel";

import PharmacyCounterSellPanel from "./PharmacyCounterSellPanel";

import BillingModule from "./BillingModule";

import CounterSaleModal from "./CounterSaleModal";

import BillingQueue from "./BillingQueue";





// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€



interface QueueItem {

  id: string;

  prescriptionNo: string;

  patient: { id: string; name: string; patientId: string; phone?: string; gender?: string; dateOfBirth?: string };

  doctor: { id: string; name: string; specialization?: string };

  appointment?: { id: string; appointmentDate: string; timeSlot: string; type: string; tokenNumber?: number };

  medications: any[];

  diagnosis?: string;

  chiefComplaint?: string;

  status: string;

  workflowStatus: string | null;

  workflowId: string | null;

  workflowNotes: string | null;

  workflowCharges: any[];

  dispensed: boolean;

  totalCharge: number;

  createdAt: string;

  bill?: any;

}



interface Stats {

  todayRxCount: number;

  todayDispensed: number;

  pendingCount: number;

  lowStockCount: number;

  expiringCount: number;

  totalItems: number;

  todayRevenue: number;

  yesterdayRevenue: number;

  totalRevenue: number;

  weekRevenue: number;

  prevWeekRevenue: number;

  revenueGrowth: number | null;

  stockHealthPct: number;

  chartData: { date: string; label: string; count: number; revenue: number }[];

  topMedicines: { name: string; category: string; qty: number; revenue: number }[];

}



interface InventoryItem {

  id: string;

  name: string;

  category: string;

  genericName?: string;

  brandName?: string;

  subCategory?: string;

  sku?: string;

  barcode?: string;

  mrp: number;

  sellingPrice: number;

  purchasePrice: number;

  gst: number;

  discount?: number;

  hsnCode?: string;

  unit: string;

  packSize?: string;

  minStock: number;

  maxStock?: number;

  reorderLevel?: number;

  reorderQty?: number;

  requiresRx: boolean;

  isActive: boolean;

  location?: string;

  rackNumber?: string;

  tempRequirement?: string;

  drugSchedule?: string;

  description?: string;

  totalStock?: number;

  batches?: { id: string; batchNumber?: string; remainingQty: number; expiryDate?: string; purchasePrice: number; sellingPrice?: number }[];

}



// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€



const ACCENT = "#0E898F";

const LIGHT_BG = "#E6F4F4";

const BORDER = "#B3E0E0";



const api = async (url: string, method = "GET", body?: any) => {

  const opts: RequestInit = { method, credentials: "include", headers: { "Content-Type": "application/json" } };

  if (body) opts.body = JSON.stringify(body);

  const r = await fetch(url, opts);

  return r.json();

};



const calcAge = (dob: string) => dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : null;

const fmtCurrency = (n: number) => "\u20B9" + (n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtTime = (d: string) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });



// â”€â”€â”€ Export Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const exportToCSV = (data: any[], filename: string) => {

  if (data.length === 0) return;

  const headers = Object.keys(data[0]);

  const csv = [

    headers.join(","),

    ...data.map(row => headers.map(h => {

      const val = row[h];

      if (val === null || val === undefined) return "";

      const str = String(val).replace(/"/g, '""');

      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;

    }).join(","))

  ].join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;

  link.click();

};



const exportToPDF = (title: string, headers: string[], rows: any[][], filename: string) => {

  const printWindow = window.open("", "_blank");

  if (!printWindow) return;

  const html = `

    <!DOCTYPE html>

    <html>

    <head>

      <title>${title}</title>

      <style>

        body { font-family: Arial, sans-serif; margin: 20px; }

        h2 { color: #0E898F; margin-bottom: 10px; }

        .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }

        table { width: 100%; border-collapse: collapse; font-size: 11px; }

        th { background: #0E898F; color: white; padding: 10px; text-align: left; }

        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }

        tr:nth-child(even) { background: #f8fafc; }

        .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; }

      </style>

    </head>

    <body>

      <h2>${title}</h2>

      <div class="meta">Generated on: ${new Date().toLocaleString("en-IN")}</div>

      <table>

        <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>

        <tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>

      </table>

      <div class="footer">Pharmacy Management System</div>

    </body>

    </html>

  `;

  printWindow.document.write(html);

  printWindow.document.close();

  printWindow.print();

};



const exportToWord = (title: string, headers: string[], rows: any[][], filename: string) => {

  const html = `

    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>

    <head><meta charset='utf-8'><title>${title}</title></head>

    <body>

      <h2 style="color:#0E898F">${title}</h2>

      <p style="color:#64748b;font-size:12px">Generated on: ${new Date().toLocaleString("en-IN")}</p>

      <table border="1" style="border-collapse:collapse;width:100%;font-size:11px">

        <tr style="background:#0E898F;color:white">${headers.map(h => `<th style="padding:8px">${h}</th>`).join("")}</tr>

        ${rows.map(row => `<tr>${row.map(c => `<td style="padding:6px 8px">${c}</td>`).join("")}</tr>`).join("")}

      </table>

      <p style="font-size:10px;color:#94a3b8;margin-top:20px">Pharmacy Management System</p>

    </body>

    </html>

  `;

  const blob = new Blob(["\ufeff" + html], { type: "application/msword" });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = `${filename}_${new Date().toISOString().slice(0,10)}.doc`;

  link.click();

};



const loadImageAsBase64 = (url: string): Promise<string | null> => {

  if (!url) return Promise.resolve(null);

  return new Promise(resolve => {

    const img = new Image(); img.crossOrigin = "anonymous";

    img.onload = () => { try { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; c.getContext("2d")!.drawImage(img, 0, 0); resolve(c.toDataURL("image/png")); } catch { resolve(null); } };

    img.onerror = () => resolve(null);

    img.src = url;

  });

};



const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {

  EMERGENCY: { label: "Emergency", color: "#dc2626", bg: "#fef2f2" },

  ICU: { label: "ICU", color: "#9333ea", bg: "#faf5ff" },

  IPD: { label: "IPD", color: "#2563eb", bg: "#eff6ff" },

  URGENT: { label: "Urgent", color: "#ea580c", bg: "#fff7ed" },

};



// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€



export default function PharmacyDashboard({ profile, user, activeTab, onReady }: { profile: any; user: any; activeTab?: string; onReady?: () => void }) {

  const [tab, setTab] = useState<"overview" | "queue" | "inventory" | "billing" | "reports" | "counter-sell" | "revenue" | "expense">("overview");



  // Signal parent that this component has mounted (used to dismiss the Preloader)

  React.useEffect(() => { onReady?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps



  // Sync external activeTab into internal state

  React.useEffect(() => {

    if (activeTab && ["overview","queue","inventory","billing","reports","counter-sell","revenue","expense"].includes(activeTab)) {

      setTab(activeTab as any);

    }

  }, [activeTab]);

  const [stats, setStats] = useState<Stats | null>(null);

  const [statsLoading, setStatsLoading] = useState(false);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [refreshCountdown, setRefreshCountdown] = useState(30);



  // Expense tab state

  const [expenses, setExpenses] = useState<any[]>([]);

  const [expenseStats, setExpenseStats] = useState<{ monthTotal: number; categoryBreakdown: any[] } | null>(null);

  const [expLoading, setExpLoading] = useState(false);

  const [expModal, setExpModal] = useState(false);

  const [expForm, setExpForm] = useState({ title: "", category: "MEDICINE", amount: "", date: new Date().toISOString().slice(0, 10), description: "" });

  const [expSaving, setExpSaving] = useState(false);

  const [expMsg, setExpMsg] = useState("");

  const [expSearch, setExpSearch] = useState("");

  const [expEditId, setExpEditId] = useState<string | null>(null);

  const [expDelConfirm, setExpDelConfirm] = useState<string | null>(null);

  const [expDeleting, setExpDeleting] = useState(false);



  // Hospital info for PDF generation

  const [hospitalInfo, setHospitalInfo] = useState<any>({ name: "Hospital", address: "", phone: "", email: "", logo: "", letterhead: "", letterheadSize: "A4" });

  useEffect(() => {

    (async () => {

      try {

        const s = await api("/api/config/settings");

        if (s.success && s.data?.settings) {

          const d = s.data.settings;

          setHospitalInfo({ name: d.hospitalName || "Hospital", address: d.address || "", phone: d.phone || "", email: d.email || "", logo: d.logo || "", letterhead: d.letterhead || "", letterheadSize: d.letterheadSize || "A4", gstNumber: d.gstNumber || "", registrationNo: d.registrationNo || "" });

          return;

        }

      } catch {}

      try {

        const h = await api("/api/hospital/details");

        if (h.success && h.data) {

          const d = h.data; const s2 = d.settings || {};

          setHospitalInfo({ name: s2.hospitalName || d.name || "Hospital", address: s2.address || "", phone: s2.phone || d.mobile || "", email: s2.email || d.email || "", logo: s2.logo || "", letterhead: s2.letterhead || "", letterheadSize: s2.letterheadSize || "A4", gstNumber: s2.gstNumber || "", registrationNo: s2.registrationNo || "" });

        }

      } catch {}

    })();

  }, []);



  // Queue bill view modal

  const [queueBillViewItem, setQueueBillViewItem] = useState<QueueItem | null>(null);

  const queueBillPrintRef = useRef<HTMLDivElement>(null);

  const jsPdfCacheQ = useRef<any>(null);



  // Queue

  const [queue, setQueue] = useState<QueueItem[]>([]);

  const [queueStats, setQueueStats] = useState({ pending: 0, dispensed: 0, total: 0 });

  const [queueBillingStats, setQueueBillingStats] = useState({ todayRevenue: 0, monthRevenue: 0, pendingBills: 0 });

  const [queueLoading, setQueueLoading] = useState(false);

  const [queueSearch, setQueueSearch] = useState("");

  const [queueFilter, setQueueFilter] = useState<"all" | "pending" | "dispensed" | "HOLD" | "SKIPPED">("all");

  const [queueSourceFilter, setQueueSourceFilter] = useState<"all" | "OPD" | "IPD" | "EMERGENCY">("all");

  const [queueDate, setQueueDate] = useState("");

  const [queueExportOpen, setQueueExportOpen] = useState(false);

  const queueExportRef = useRef<HTMLDivElement>(null);

  const [expandedRx, setExpandedRx] = useState<string | null>(null);

  // Queue Multi-select

  const [selectedQueue, setSelectedQueue] = useState<Set<string>>(new Set());

  const [queueBulkDeleting, setQueueBulkDeleting] = useState(false);

  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  const [bulkDeleteRemark, setBulkDeleteRemark] = useState("");

  const [dispensingId, setDispensingId] = useState<string | null>(null);

  // Queue CRUD extras

  const [queueViewModal, setQueueViewModal] = useState<any>(null);

  const [rxActionTarget, setRxActionTarget] = useState<any>(null);

  const [rxActionType, setRxActionType] = useState<"skip" | "hold" | "resume">("skip");

  const [rxActionNotes, setRxActionNotes] = useState("");

  const [rxActioning, setRxActioning] = useState(false);

  const [rxDeleteRemark, setRxDeleteRemark] = useState("");

  // Manual Rx creation

  const [rxCreateModal, setRxCreateModal] = useState(false);

  const [rxCreateForm, setRxCreateForm] = useState({ patientId:"", patientName:"", doctorId:"", diagnosis:"", notes:"", paymentAction:"none" as "collect"|"send_to_billing"|"none", paymentMethod:"CASH", discount:"0", billingNote:"", transactionId:"", medications:[{ name:"", dosage:"", frequency:"", duration:"", quantity:"1", price:"0", instructions:"" }] });

  const [rxCreateSaving, setRxCreateSaving] = useState(false);

  const [rxCreateError, setRxCreateError] = useState("");

  const [rxCreatePatientSearch, setRxCreatePatientSearch] = useState("");

  const [rxCreatePatients, setRxCreatePatients] = useState<any[]>([]);

  const [rxCreateDoctors, setRxCreateDoctors] = useState<any[]>([]);

  const [rxPatientSearching, setRxPatientSearching] = useState(false);

  const [rxCreateManualPatient, setRxCreateManualPatient] = useState(false);

  const [rxManualPatientForm, setRxManualPatientForm] = useState({ name:"", phone:"", gender:"MALE" });

  // Dispense modal

  const [dispenseModalItem, setDispenseModalItem] = useState<QueueItem | null>(null);

  // Counter Sale modal

  const [counterSaleModal, setCounterSaleModal] = useState(false);

  const [csItems, setCsItems] = useState<{ inventoryItemId: string; name: string; quantity: string; unitPrice: string; gst: string; availableStock: number }[]>([{ inventoryItemId: "", name: "", quantity: "1", unitPrice: "0", gst: "0", availableStock: 0 }]);

  const [csPatientId, setCsPatientId] = useState("");

  const [csPatientSearch, setCsPatientSearch] = useState("");

  const [csPatients, setCsPatients] = useState<any[]>([]);

  const [csPatientSearching, setCsPatientSearching] = useState(false);

  const [csSearchNoResults, setCsSearchNoResults] = useState(false);

  const [csPaymentMethod, setCsPaymentMethod] = useState("CASH");

  const [csDiscount, setCsDiscount] = useState("0");

  const [csRemarks, setCsRemarks] = useState("");

  const [csTaxPct, setCsTaxPct] = useState("0");

  const [csTransactionId, setCsTransactionId] = useState("");

  const [csSaving, setCsSaving] = useState(false);

  const [csError, setCsError] = useState("");

  const [csSuccessMsg, setCsSuccessMsg] = useState("");

  const [csManualPatient, setCsManualPatient] = useState(false);

  const [csManualForm, setCsManualForm] = useState({ name: "", phone: "", gender: "MALE" });

  // Counter Sale History

  const [csHistoryModal, setCsHistoryModal] = useState(false);

  const [csHistory, setCsHistory] = useState<any[]>([]);

  const [csHistoryLoading, setCsHistoryLoading] = useState(false);

  // Counter Sale Purchase Request

  const [csPurchaseRequestModal, setCsPurchaseRequestModal] = useState(false);

  const [csPurchaseRequestItem, setCsPurchaseRequestItem] = useState<{ name: string; quantity: number } | null>(null);

  // Counter Sale Item Search

  const [csItemSearch, setCsItemSearch] = useState<Record<number, string>>({});

  const [csItemSearchFocused, setCsItemSearchFocused] = useState<Record<number, boolean>>({});

  // Success Modal (replaces alert())

  const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; message: string; details: string[] }>({ open: false, title: "", message: "", details: [] });

  // Delete queue item

  const [rxDeleteTarget, setRxDeleteTarget] = useState<any>(null);

  const [rxDeleting, setRxDeleting] = useState(false);

  // Revoke dispense

  const [revokeDispenseTarget, setRevokeDispenseTarget] = useState<any>(null);

  const [revokeReason, setRevokeReason] = useState("");

  const [revoking, setRevoking] = useState(false);

  // Substitute modal

  const [substituteModal, setSubstituteModal] = useState<{ itemId: string; name: string; rxId: string; medIdx: number } | null>(null);

  const [substituteResults, setSubstituteResults] = useState<any[]>([]);

  const [substituteLoading, setSubstituteLoading] = useState(false);



  // Real-time Prescription Notifications

  const [newRxNotification, setNewRxNotification] = useState<any>(null);

  const [rxNotificationSound] = useState(() => typeof Audio !== "undefined" ? new Audio("/notification.mp3") : null);

  const notificationEsRef = useRef<EventSource | null>(null);



  // Department Stock (from Central Store transfers)

  const [deptStock, setDeptStock] = useState<any>(null);

  const [deptStockLoading, setDeptStockLoading] = useState(false);



  // Inventory

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [invLoading, setInvLoading] = useState(false);

  const [invSearch, setInvSearch] = useState("");

  const [invFilter, setInvFilter] = useState<"all" | "low" | "expiring">("all");

  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Inventory Multi-select

  const [selectedInventory, setSelectedInventory] = useState<Set<string>>(new Set());

  const [invBulkDeleting, setInvBulkDeleting] = useState(false);

  // Inventory CRUD

  const [invModalOpen, setInvModalOpen] = useState(false);

  const [invEditing, setInvEditing] = useState<InventoryItem | null>(null);

  const [invForm, setInvForm] = useState<any>({

    name: "", genericName: "", brandName: "", category: "Medicine", subCategory: "",

    unit: "pcs", packSize: "", sku: "", barcode: "", hsnCode: "",

    minStock: 5, maxStock: null, reorderLevel: null, reorderQty: null,

    purchasePrice: 0, mrp: 0, sellingPrice: 0, discount: 0, gst: 0,

    location: "Pharmacy Store", rackNumber: "", tempRequirement: "Room Temp",

    drugSchedule: "OTC", requiresRx: false, isActive: true, description: ""

  });

  const [invSaving, setInvSaving] = useState(false);

  const [invDeleteTarget, setInvDeleteTarget] = useState<InventoryItem | null>(null);

  const [invDeleting, setInvDeleting] = useState(false);



  // Purchases

  const [purchases, setPurchases] = useState<any[]>([]);

  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Purchase CRUD

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  const [purchaseForm, setPurchaseForm] = useState<any>({

    supplierId: "",

    purchaseNo: "",

    orderDate: new Date().toISOString().split('T')[0],

    expectedDeliveryDate: "",

    notes: "",

    discount: 0,

    taxPercent: 0,

    shippingCharges: 0,

    items: [{ itemId: "", quantity: 1, price: 0, sellingPrice: 0, mrp: 0, batchNumber: "", expiryDate: "" }]

  });

  const [purchaseSaving, setPurchaseSaving] = useState(false);



  // Suppliers CRUD

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);

  const [supplierEditing, setSupplierEditing] = useState<any>(null);

  const [supplierForm, setSupplierForm] = useState<any>({

    name: "", contactPerson: "", phone: "", email: "", gstNumber: "",

    address1: "", city: "", state: "", pincode: "", notes: ""

  });

  const [supplierSaving, setSupplierSaving] = useState(false);

  const [supplierDeleteTarget, setSupplierDeleteTarget] = useState<any>(null);

  const [supplierDeleting, setSupplierDeleting] = useState(false);



  // Appointments CRUD

  const [appointments, setAppointments] = useState<any[]>([]);

  const [apptLoading, setApptLoading] = useState(false);

  const [apptSearch, setApptSearch] = useState("");

  const [apptStatusFilter, setApptStatusFilter] = useState<"all"|"SCHEDULED"|"CONFIRMED"|"IN_PROGRESS"|"COMPLETED"|"CANCELLED">("all");

  const [apptDateFilter, setApptDateFilter] = useState("");

  const [apptPagination, setApptPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [apptPage, setApptPage] = useState(1);

  // Appt view/edit

  const [apptViewModal, setApptViewModal] = useState<any>(null);

  const [apptEditModal, setApptEditModal] = useState<any>(null);

  const [apptEditForm, setApptEditForm] = useState<any>({});

  const [apptEditSaving, setApptEditSaving] = useState(false);

  const [apptCancelTarget, setApptCancelTarget] = useState<any>(null);

  const [apptCancelling, setApptCancelling] = useState(false);

  // Appt booking

  const [apptBookModal, setApptBookModal] = useState(false);

  const [apptBookForm, setApptBookForm] = useState({ patientId:"", patientName:"", doctorId:"", appointmentDate:"", timeSlot:"", type:"OPD", consultationFee:"", notes:"" });

  const [apptBookSaving, setApptBookSaving] = useState(false);

  const [apptBookError, setApptBookError] = useState("");

  const [apptDoctors, setApptDoctors] = useState<any[]>([]);

  const [apptPatientSearch, setApptPatientSearch] = useState("");

  const [apptPatients, setApptPatients] = useState<any[]>([]);

  const [apptSlots, setApptSlots] = useState<string[]>([]);

  const [apptSlotsLoading, setApptSlotsLoading] = useState(false);



  // Dispense Form & Transfer

  const [subDepts, setSubDepts] = useState<any[]>([]);

  const [dspItems, setDspItems] = useState<any[]>([]);

  const [dspAction, setDspAction] = useState<"close"|"collect"|"transfer">("close");

  const [dspPayMethod, setDspPayMethod] = useState("CASH");

  const [dspDiscount, setDspDiscount] = useState(0);

  const [dspTxnId, setDspTxnId] = useState("");

  const [dspTransferTarget, setDspTransferTarget] = useState("");

  const [dspTransferNote, setDspTransferNote] = useState("");

  const [dspNotes, setDspNotes] = useState("");



  useEffect(() => {

    api("/api/config/subdepartments?limit=50").then(d => {

      if (d.success) setSubDepts(d.data?.data || d.data || []);

    });

  }, []);



  // Initialize dsp state when dispense modal opens/closes

  useEffect(() => {

    if (!dispenseModalItem) {

      setDspItems([]);

      setDspAction("close");

      setDspPayMethod("CASH");

      setDspDiscount(0);

      setDspTxnId("");

      setDspTransferTarget("");

      setDspTransferNote("");

      setDspNotes("");

      return;

    }

    const raw = dispenseModalItem.medications;

    const meds: any[] = (() => { try { return typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : []; } catch { return []; } })();

    const items = meds.map((m: any) => {

      const medName = (m.name || m.medicine || "").toLowerCase().trim();

      const matched = medName

        ? (inventory.find((i: any) => i.isActive && i.name.toLowerCase() === medName)

          || inventory.find((i: any) => i.isActive && i.genericName?.toLowerCase() === medName)

          || inventory.find((i: any) => i.isActive && medName.length > 3 && i.name.toLowerCase().includes(medName)))

        : null;

      return {

        prescribedName: m.name || m.medicine || "",

        dosage: m.dosage || "",

        frequency: m.frequency || "",

        inventoryItemId: matched?.id || "",

        name: matched?.name || m.name || m.medicine || "",

        quantity: parseInt(m.quantity) || 1,

        unitPrice: matched ? (matched.sellingPrice || matched.mrp || 0) : (parseFloat(m.price) || 0),

      };

    });

    setDspItems(items);

  }, [dispenseModalItem]);



  // â”€â”€ Load Stats â”€â”€

  const loadStats = useCallback(async () => {

    setStatsLoading(true);

    const res = await api("/api/pharmacy/stats");

    if (res.success) setStats(res.data);

    setStatsLoading(false);

  }, []);



  const loadExpenses = useCallback(async () => {

    setExpLoading(true);

    const res = await api("/api/expense?limit=100&department=Pharmacy");

    if (res.success) {

      setExpenses(res.data?.expenses || []);

      setExpenseStats(res.data?.stats || null);

    }

    setExpLoading(false);

  }, []);



  const saveExpense = async () => {

    const amt = parseFloat(expForm.amount);

    if (!expForm.title.trim()) { setExpMsg("Title is required"); return; }

    if (!expForm.amount || isNaN(amt) || amt <= 0) { setExpMsg("Enter a valid amount"); return; }

    if (!expForm.date) { setExpMsg("Date is required"); return; }

    setExpSaving(true); setExpMsg("");

    const res = expEditId

      ? await api(`/api/expense/${expEditId}`, "PUT", { ...expForm, amount: amt, department: "Pharmacy" })

      : await api("/api/expense", "POST", { ...expForm, amount: amt, department: "Pharmacy" });

    if (res.success) {

      setExpModal(false); setExpEditId(null);

      setExpForm({ title: "", category: "MEDICINE", amount: "", date: new Date().toISOString().slice(0, 10), description: "" });

      loadExpenses();

    } else { setExpMsg(res.message || "Failed to save expense"); }

    setExpSaving(false);

  };



  const deleteExpense = async (id: string) => {

    setExpDeleting(true);

    const res = await api(`/api/expense/${id}`, "DELETE");

    if (res.success) { setExpDelConfirm(null); loadExpenses(); }

    setExpDeleting(false);

  };



  // Auto-refresh every 30 seconds on overview tab

  useEffect(() => {

    if (tab !== "overview") return;

    const tick = setInterval(() => {

      setRefreshCountdown(prev => {

        if (prev <= 1) {

          loadStats();

          setLastRefresh(new Date());

          return 30;

        }

        return prev - 1;

      });

    }, 1000);

    return () => clearInterval(tick);

  }, [tab, loadStats]);



  // â”€â”€ Load Queue â”€â”€

  const loadQueue = useCallback(async () => {

    setQueueLoading(true);

    const statusParam = queueFilter === "all" ? "all" : queueFilter === "dispensed" ? "COMPLETED" : queueFilter === "HOLD" ? "HOLD" : queueFilter === "SKIPPED" ? "SKIPPED" : "";

    const params = new URLSearchParams({ status: statusParam, search: queueSearch });

    if (queueDate) { params.set("date", queueDate); } else { params.set("allDates", "true"); }

    const [res, billingRes] = await Promise.all([

      api(`/api/pharmacy/queue?${params}`),

      fetch("/api/billing?pharmacyOnly=true&limit=1", { credentials: "include" }).then(r => r.json()).catch(() => null),

    ]);

    if (res.success) {

      setQueue(res.data.queue || []);

      setQueueStats(res.data.stats || { pending: 0, dispensed: 0, total: 0 });

    }

    if (billingRes?.success) {

      setQueueBillingStats({

        todayRevenue: billingRes.data?.stats?.todayRevenue || 0,

        monthRevenue: billingRes.data?.stats?.monthRevenue || 0,

        pendingBills: billingRes.data?.stats?.pendingCount || 0,

      });

    }

    setQueueLoading(false);

  }, [queueFilter, queueSearch, queueDate]);



  // â”€â”€ Skip / Hold / Resume Rx â”€â”€

  const handleRxAction = async () => {

    if (!rxActionTarget) return;

    setRxActioning(true);

    const res = await api("/api/pharmacy/queue", "PATCH", {

      prescriptionId: rxActionTarget.id,

      workflowId: rxActionTarget.workflowId,

      action: rxActionType,

      notes: rxActionNotes || undefined,

    });

    setRxActioning(false);

    if (res.success) {

      setRxActionTarget(null);

      setRxActionNotes("");

      loadQueue();

    }

  };



  // â”€â”€ Create Manual Rx â”€â”€

  const handleCreateRx = async () => {

    setRxCreateError("");

    let patientId = rxCreateForm.patientId;



    // If manual patient mode, register the patient first

    if (rxCreateManualPatient) {

      if (!rxManualPatientForm.name.trim()) { setRxCreateError("Patient name is required"); return; }

      if (!rxManualPatientForm.phone.trim()) { setRxCreateError("Patient phone is required"); return; }

      setRxCreateSaving(true);

      const pRes = await api("/api/patients", "POST", {

        name: rxManualPatientForm.name.trim(),

        phone: rxManualPatientForm.phone.trim(),

        gender: rxManualPatientForm.gender || "MALE",

      });

      if (!pRes.success) {

        setRxCreateSaving(false);

        setRxCreateError(pRes.message || "Failed to register patient");

        return;

      }

      patientId = pRes.data?.patient?.id || pRes.data?.id;

      if (!patientId) { setRxCreateSaving(false); setRxCreateError("Patient registered but ID not returned"); return; }

    }



    if (!patientId) { setRxCreateError("Please select or enter a patient"); return; }

    const validMeds = rxCreateForm.medications.filter(m => m.name.trim());

    if (validMeds.length === 0) { setRxCreateError("Add at least one medication"); return; }

    if (!rxCreateManualPatient) setRxCreateSaving(true);

    const res = await api("/api/pharmacy/queue", "POST", {

      patientId,

      doctorId: rxCreateForm.doctorId || null,

      diagnosis: rxCreateForm.diagnosis || null,

      notes: rxCreateForm.notes || null,

      paymentAction: rxCreateForm.paymentAction,

      paymentMethod: rxCreateForm.paymentMethod,

      discount: rxCreateForm.discount,

      billingNote: rxCreateForm.billingNote,

      transactionId: rxCreateForm.transactionId,

      medications: validMeds.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration, quantity: parseInt(m.quantity) || 1, price: parseFloat(m.price) || 0, instructions: m.instructions })),

    });

    setRxCreateSaving(false);

    if (res.success) {

      setRxCreateModal(false);

      setRxCreateForm({ patientId:"", patientName:"", doctorId:"", diagnosis:"", notes:"", paymentAction:"none", paymentMethod:"CASH", discount:"0", billingNote:"", transactionId:"", medications:[{ name:"", dosage:"", frequency:"", duration:"", quantity:"1", price:"0", instructions:"" }] });

      setRxCreatePatients([]);

      setRxCreatePatientSearch("");

      setRxCreateManualPatient(false);

      setRxManualPatientForm({ name:"", phone:"", gender:"MALE" });

      loadQueue();

      loadStats();

    } else {

      setRxCreateError(res.message || "Failed to create prescription");

    }

  };



  // â”€â”€ Patient search for Walk-in Rx (useEffect-based) â”€â”€

  // Loads recent patients on modal open, then searches as user types

  useEffect(() => {

    if (!rxCreateModal || rxCreateManualPatient || rxCreateForm.patientId) return;

    const query = rxCreatePatientSearch.trim();

    // If search is empty â†’ load recent patients; if < 2 chars â†’ clear

    if (!query) {

      // Load recent patients when modal first opens

      setRxPatientSearching(true);

      const controller = new AbortController();

      fetch(`/api/patients?limit=15&sortBy=createdAt&sortOrder=desc`, { credentials: "include", signal: controller.signal })

        .then(r => r.json())

        .then(res => {

          const patients = res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : [];

          setRxCreatePatients(patients);

        })

        .catch(() => {})

        .finally(() => setRxPatientSearching(false));

      return () => controller.abort();

    }

    if (query.length < 2) { setRxCreatePatients([]); return; }



    // Debounced search

    setRxPatientSearching(true);

    const controller = new AbortController();

    const timer = setTimeout(async () => {

      try {

        // Try autocomplete endpoint first

        const r = await fetch(`/api/patients?q=${encodeURIComponent(query)}`, { credentials: "include", signal: controller.signal });

        const res = await r.json();

        let patients = res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : [];

        // Fallback to paginated search

        if (patients.length === 0) {

          const r2 = await fetch(`/api/patients?search=${encodeURIComponent(query)}&limit=15`, { credentials: "include", signal: controller.signal });

          const res2 = await r2.json();

          patients = res2.success ? (Array.isArray(res2.data) ? res2.data : res2.data?.data || []) : [];

        }

        setRxCreatePatients(patients);

      } catch (err: any) {

        if (err.name !== "AbortError") console.error("[Rx patient search]", err);

      }

      setRxPatientSearching(false);

    }, 250);

    return () => { clearTimeout(timer); controller.abort(); };

  }, [rxCreatePatientSearch, rxCreateModal, rxCreateManualPatient, rxCreateForm.patientId]);



  // â”€â”€ Counter Sale: patient search (useEffect-based) â”€â”€

  useEffect(() => {

    if (!counterSaleModal || csManualPatient || csPatientId) return;

    const query = csPatientSearch.trim();

    setCsSearchNoResults(false);

    if (!query) {

      setCsPatientSearching(true);

      const controller = new AbortController();

      fetch(`/api/patients?limit=15&sortBy=createdAt&sortOrder=desc`, { credentials: "include", signal: controller.signal })

        .then(r => r.json())

        .then(res => { setCsPatients(res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : []); })

        .catch(() => {})

        .finally(() => setCsPatientSearching(false));

      return () => controller.abort();

    }

    if (query.length < 2) { setCsPatients([]); return; }

    setCsPatientSearching(true);

    const controller = new AbortController();

    const timer = setTimeout(async () => {

      try {

        const r = await fetch(`/api/patients?search=${encodeURIComponent(query)}&limit=15`, { credentials: "include", signal: controller.signal });

        const res = await r.json();

        const patients = res.success ? (Array.isArray(res.data) ? res.data : res.data?.data || []) : [];

        setCsPatients(patients);

        if (patients.length === 0) setCsSearchNoResults(true);

      } catch (err: any) { if (err.name !== "AbortError") console.error("[CS patient search]", err); }

      setCsPatientSearching(false);

    }, 250);

    return () => { clearTimeout(timer); controller.abort(); };

  }, [csPatientSearch, counterSaleModal, csManualPatient, csPatientId]);



  // â”€â”€ Counter Sale: submit â”€â”€

  const handleCounterSale = async () => {

    setCsError("");

    let patientId = csPatientId;



    // If manual patient, register first

    if (csManualPatient) {

      if (!csManualForm.name.trim()) { setCsError("Patient name is required"); return; }

      if (!csManualForm.phone.trim()) { setCsError("Patient phone is required"); return; }

      setCsSaving(true);

      const pRes = await api("/api/patients", "POST", { name: csManualForm.name.trim(), phone: csManualForm.phone.trim(), gender: csManualForm.gender || "MALE" });

      if (!pRes.success) { setCsSaving(false); setCsError(pRes.message || "Failed to register patient"); return; }

      patientId = pRes.data?.patient?.id || pRes.data?.id;

      if (!patientId) { setCsSaving(false); setCsError("Patient registered but ID not returned"); return; }

    }



    if (!patientId) { setCsError("Please select or enter a patient"); return; }

    const validItems = csItems.filter(i => i.inventoryItemId && i.name.trim());

    if (validItems.length === 0) { setCsError("Add at least one item from inventory"); return; }



    // Validate stock availability â€” account for combined quantities of same item across rows

    const combinedQty: Record<string, number> = {};

    validItems.forEach(i => {

      combinedQty[i.inventoryItemId] = (combinedQty[i.inventoryItemId] || 0) + (parseInt(i.quantity) || 0);

    });

    const stockIssues = Object.entries(combinedQty).filter(([itemId, totalQty]) => {

      const item = validItems.find(i => i.inventoryItemId === itemId);

      return item && totalQty > item.availableStock;

    });

    if (stockIssues.length > 0) {

      const itemNames = stockIssues.map(([itemId]) => validItems.find(i => i.inventoryItemId === itemId)?.name || itemId).join(", ");

      setCsError(`Combined quantity exceeds available stock for: ${itemNames}. Please adjust.`);

      return;

    }



    if (!csManualPatient) setCsSaving(true);

    const res = await api("/api/pharmacy/counter-sale", "POST", {

      patientId,

      items: validItems.map(i => ({ 

        inventoryItemId: i.inventoryItemId,

        name: i.name, 

        quantity: parseInt(i.quantity) || 1, 

        unitPrice: parseFloat(i.unitPrice) || 0 

      })),

      paymentMethod: csPaymentMethod,

      transactionId: csTransactionId || null,

      discount: parseFloat(csDiscount) || 0,

      taxPercent: parseFloat(csTaxPct) || 0,

      remarks: csRemarks || null,

      notifyAdmin: true,

      notifyReception: true,

    });

    setCsSaving(false);

    if (res.success) {

      setCsSuccessMsg("Sale complete - " + (res.data?.billNo || "") + " - Rs." + (res.data?.total || 0));

      loadStats(); loadInventory();

      setTimeout(() => {

        setCounterSaleModal(false); setCsSuccessMsg("");

        setCsItems([{ inventoryItemId: "", name: "", quantity: "1", unitPrice: "0", gst: "0", availableStock: 0 }]);

        setCsPatientId(""); setCsPatientSearch(""); setCsPatients([]); setCsSearchNoResults(false);

        setCsPaymentMethod("CASH"); setCsDiscount("0"); setCsTaxPct("0"); setCsRemarks(""); setCsTransactionId("");

        setCsManualPatient(false); setCsManualForm({ name: "", phone: "", gender: "MALE" });

        setCsError(""); setCsItemSearch({}); setCsItemSearchFocused({});

      }, 1800);

    } else {

      setCsError(res.message || "Failed to process counter sale");

    }

  };



  // â”€â”€ Reset CS Modal â”€â”€

  const resetCsModal = () => {

    setCsItems([{ inventoryItemId: "", name: "", quantity: "1", unitPrice: "0", gst: "0", availableStock: 0 }]);

    setCsPatientId(""); setCsPatientSearch(""); setCsPatients([]); setCsSearchNoResults(false);

    setCsPaymentMethod("CASH"); setCsDiscount("0"); setCsTaxPct("0"); setCsRemarks(""); setCsTransactionId("");

    setCsManualPatient(false); setCsManualForm({ name: "", phone: "", gender: "MALE" });

    setCsError(""); setCsItemSearch({}); setCsItemSearchFocused({});

  };



  // â”€â”€ Load Counter Sale History â”€â”€

  const loadCsHistory = useCallback(async () => {

    setCsHistoryLoading(true);

    const res = await api("/api/pharmacy/counter-sale/history?limit=50");

    if (res.success) setCsHistory(res.data || []);

    setCsHistoryLoading(false);

  }, []);



  // â”€â”€ Create Purchase Request from Counter Sale â”€â”€

  const handleCreatePurchaseRequest = async (itemName: string, quantity: number, supplierId?: string) => {

    const res = await api("/api/subdept/inventory/purchase-request", "POST", {

      itemName,

      quantity,

      supplierId,

      source: "Counter Sale - Out of Stock",

      priority: "HIGH",

    });

    if (res.success) {

      setCsPurchaseRequestModal(false);

      setCsPurchaseRequestItem(null);

      setSuccessModal({ open: true, title: "Purchase Request Created!", message: `Request created for ${itemName}. You'll be notified when stock arrives.`, details: [] });

    } else {

      setSuccessModal({ open: true, title: "Purchase Request Failed", message: res.message || "Failed to create purchase request", details: [] });

    }

  };



  // ── Revoke Dispense ──

  const handleRevokeDispense = async () => {

    if (!revokeDispenseTarget) return;

    setRevoking(true);

    const res = await api("/api/pharmacy/queue", "PATCH", {

      prescriptionId: revokeDispenseTarget.id,

      workflowId: revokeDispenseTarget.workflowId,

      action: "revoke_dispense",

    });

    setRevoking(false);

    if (res.success) {

      setRevokeDispenseTarget(null);

      setRevokeReason("");

      loadQueue();

      loadStats();

    } else {

      alert(res.message || "Failed to revoke dispense");

    }

  };



  // ── Queue Bill PDF Download ──

  const getJsPdfQ = async () => {

    if (jsPdfCacheQ.current) return jsPdfCacheQ.current;

    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

    jsPdfCacheQ.current = { jsPDF, autoTable };

    return jsPdfCacheQ.current;

  };



  const handleQueueBillDownload = async (item: QueueItem) => {

    if (!item?.bill) return;

    const { jsPDF, autoTable } = await getJsPdfQ();

    const pageSize = (hospitalInfo.letterheadSize || "A4").toLowerCase() as "a4" | "a5" | "letter";

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: pageSize });

    const pw = doc.internal.pageSize.getWidth(); const ph = doc.internal.pageSize.getHeight();

    const mx = 18; const cw = pw - mx * 2;

    const rs = (v: number) => `Rs. ${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const lhDU = await loadImageAsBase64(hospitalInfo.letterhead || "");

    const lgDU = lhDU ? null : await loadImageAsBase64(hospitalInfo.logo || "");

    const hasLH = !!lhDU;

    let y: number;

    const dateStr = item.appointment?.appointmentDate ? fmtDate(item.appointment.appointmentDate) : fmtDate(item.createdAt);

    if (hasLH) {

      try { doc.addImage(lhDU!, "PNG", 0, 0, pw, ph); } catch {}

      y = 80;

      const rx = pw - mx;

      doc.setFillColor(14,137,143); doc.roundedRect(rx-32,52,32,7,1.5,1.5,"F");

      doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(255,255,255); doc.text("INVOICE", rx-16, 57, {align:"center"});

      doc.setFontSize(12); doc.setTextColor(30,41,59); doc.text(item.bill.billNo||"BILL", rx, 68, {align:"right"});

      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(100,116,139); doc.text("Date: "+dateStr, rx, 74, {align:"right"});

    } else {

      y = 16;

      doc.setFillColor(248,250,252); doc.rect(0,0,pw,52,"F");

      doc.setDrawColor(14,165,233); doc.setLineWidth(0.8); doc.line(0,52,pw,52);

      const infoX = lgDU ? mx+28 : mx;

      if (lgDU) { try { doc.addImage(lgDU,"PNG",mx,y,22,22); } catch {} }

      if (!lgDU) { doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.setTextColor(14,165,233); doc.text(hospitalInfo.name||"Hospital", infoX, y+6); }

      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(100,116,139);

      let hy = y+12;

      if (hospitalInfo.address) { doc.text(hospitalInfo.address, infoX, hy); hy+=4; }

      if (hospitalInfo.phone) { doc.text("Phone: "+hospitalInfo.phone, infoX, hy); hy+=4; }

      if (hospitalInfo.email) { doc.text("Email: "+hospitalInfo.email, infoX, hy); hy+=4; }

      if (hospitalInfo.gstNumber) { doc.text("GSTIN: "+hospitalInfo.gstNumber, infoX, hy); }

      const rx = pw - mx;

      doc.setFillColor(14,165,233); doc.roundedRect(rx-32,y,32,7,1.5,1.5,"F");

      doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(255,255,255); doc.text("INVOICE", rx-16, y+5, {align:"center"});

      doc.setFontSize(12); doc.setTextColor(30,41,59); doc.text(item.bill.billNo||"BILL", rx, y+16, {align:"right"});

      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(100,116,139); doc.text("Date: "+dateStr, rx, y+22, {align:"right"});

      y = 58;

    }

    doc.setFillColor(248,250,252); doc.roundedRect(mx,y,cw,24,2,2,"F");

    doc.setDrawColor(226,232,240); doc.setLineWidth(0.2); doc.roundedRect(mx,y,cw,24,2,2,"S");

    const meta = [

      {label:"Patient Name",value:item.patient?.name||""},{label:"Patient ID",value:item.patient?.patientId||""},

      {label:"Date",value:dateStr},{label:"Doctor",value:item.doctor?.name?"Dr. "+item.doctor.name:"Walk-in"},{label:"Rx No",value:item.prescriptionNo||""},

    ];

    const mColW = cw/3;

    meta.forEach((m,i) => {

      const col=i%3; const row=Math.floor(i/3); const mX=mx+4+col*mColW; const mY=y+5+row*11;

      doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(148,163,184); doc.text(m.label.toUpperCase(), mX, mY);

      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(30,41,59); doc.text(m.value, mX, mY+4.5);

    });

    y+=30;

    const pharmItems = (item.bill.billItems||[]).filter((it:any)=>it.type==="PHARMACY");

    const pharmTotal = pharmItems.reduce((s:number,it:any)=>s+(it.amount||0),0);

    if (pharmItems.length>0) {

      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(190,24,93); doc.text("Pharmacy — Medicine Details", mx, y+2);

      if (item.prescriptionNo) { doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(148,163,184); doc.text("Rx #"+item.prescriptionNo, pw-mx, y+2, {align:"right"}); }

      y+=5;

      if (item.diagnosis) { doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(100,116,139); doc.text("Diagnosis: "+item.diagnosis, mx, y+2); y+=5; }

      const medRows = pharmItems.map((it:any,i:number)=>[String(i+1),it.name,String(it.quantity||1),rs(it.unitPrice||0),rs(it.amount||0)]);

      medRows.push(["","","","Medicine Total:",rs(pharmTotal)]);

      autoTable(doc,{startY:y,head:[["#","Medicine","Qty","Unit Price","Amount"]],body:medRows,theme:"striped",headStyles:{fillColor:[252,231,243],textColor:[190,24,93],fontSize:7.5,fontStyle:"bold",cellPadding:{top:2.5,bottom:2.5,left:3,right:3}},bodyStyles:{fontSize:8,textColor:[51,65,85],cellPadding:{top:2,bottom:2,left:3,right:3}},alternateRowStyles:{fillColor:[253,242,248]},columnStyles:{0:{cellWidth:8,halign:"center"},1:{cellWidth:"auto"},2:{cellWidth:12,halign:"center"},3:{cellWidth:26,halign:"right"},4:{cellWidth:28,halign:"right",fontStyle:"bold"}},margin:{left:mx,right:mx},didParseCell:(data:any)=>{if(data.section==="body"&&data.row.index===medRows.length-1){data.cell.styles.fontStyle="bold";data.cell.styles.textColor=[190,24,93];data.cell.styles.fillColor=[252,231,243];}}});

      y=(doc as any).lastAutoTable.finalY+6;

    }

    const sW=78; const sX=pw-mx-sW;

    const sLines:any[]=[{label:"Subtotal",value:rs(pharmTotal)}];

    const lineH=6; const boxH=(sLines.length*lineH)+lineH+14;

    doc.setFillColor(248,250,252); doc.roundedRect(sX,y,sW,boxH,2,2,"F");

    doc.setDrawColor(226,232,240); doc.setLineWidth(0.2); doc.roundedRect(sX,y,sW,boxH,2,2,"S");

    let sY=y+6;

    sLines.forEach((row:any)=>{doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(...(row.color||[71,85,105]) as [number,number,number]);doc.text(row.label,sX+4,sY);doc.text(row.value,sX+sW-4,sY,{align:"right"});sY+=lineH;});

    doc.setDrawColor(14,137,143);doc.setLineWidth(0.4);doc.line(sX+4,sY-1,sX+sW-4,sY-1);sY+=4;

    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(30,41,59);doc.text("Pharmacy Total",sX+4,sY);

    doc.setTextColor(14,137,143);doc.setFontSize(11);doc.text(rs(pharmTotal),sX+sW-4,sY,{align:"right"});

    y+=boxH+8;

    if(item.bill.status==="PAID"){

      doc.setFillColor(240,253,244);doc.setDrawColor(187,247,208);doc.setLineWidth(0.3);doc.roundedRect(mx,y,cw,14,2,2,"FD");

      doc.setFont("helvetica","bold");doc.setFontSize(6.5);doc.setTextColor(148,163,184);doc.text("STATUS",mx+4,y+5);

      doc.setFontSize(8.5);doc.setTextColor(22,101,52);doc.text("PAID",mx+4,y+10);

      doc.setFontSize(6.5);doc.setTextColor(148,163,184);doc.text("PHARMACY AMOUNT",mx+40,y+5);

      doc.setFontSize(8.5);doc.setTextColor(22,101,52);doc.text(rs(pharmTotal),mx+40,y+10);

      y+=20;

    }

    const sigY=Math.max(y+10,ph-(hasLH?60:50));

    doc.setDrawColor(180,180,180);doc.setLineWidth(0.3);

    doc.line(mx,sigY,mx+55,sigY);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(100,116,139);doc.text("Patient / Attendant Signature",mx,sigY+5);

    doc.line(pw-mx-55,sigY,pw-mx,sigY);doc.text("Authorized Signatory",pw-mx-55,sigY+5);

    const footerY=sigY+14;

    if(!hasLH){doc.setDrawColor(226,232,240);doc.setLineWidth(0.15);doc.line(mx,footerY,pw-mx,footerY);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(100,116,139);doc.text("Thank you for choosing "+(hospitalInfo.name||"our hospital"),pw/2,footerY+5,{align:"center"});doc.setFontSize(7);doc.setTextColor(148,163,184);doc.text("This is a computer-generated invoice.",pw/2,footerY+9,{align:"center"});}

    else{doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(100,116,139);doc.text("This is a computer-generated invoice.",pw/2,footerY+3,{align:"center"});}

    doc.save(`Invoice_${(item.bill.billNo||"BILL").replace(/\s+/g,"-")}_${(item.patient?.name||"patient").replace(/\s+/g,"_")}.pdf`);

  };



  // ── Delete Rx from Queue ──

  const handleDeleteRx = async () => {

    if (!rxDeleteTarget) return;

    if (!rxDeleteRemark.trim()) {

      alert("Please enter a remark/reason for deletion");

      return;

    }

    setRxDeleting(true);

    const res = await api(`/api/pharmacy/queue?id=${rxDeleteTarget.id}&workflowId=${rxDeleteTarget.workflowId || ""}&remark=${encodeURIComponent(rxDeleteRemark)}`, "DELETE");

    setRxDeleting(false);

    if (res.success) {

      setRxDeleteTarget(null);

      setRxDeleteRemark("");

      loadQueue();

      loadStats();

    }

  };



  // â”€â”€ Search Substitute Inventory â”€â”€

  const openSubstitute = useCallback(async (medName: string, rxId: string, medIdx: number) => {

    setSubstituteModal({ itemId: "", name: medName, rxId, medIdx });

    setSubstituteLoading(true);

    setSubstituteResults([]);

    const nameWords = medName.split(" ").filter(Boolean).slice(0, 2).join(" ");

    const res = await api(`/api/config/inventory?search=${encodeURIComponent(nameWords)}&limit=20`);

    if (res.success) setSubstituteResults(res.data?.data || res.data || []);

    setSubstituteLoading(false);

  }, []);



  // â”€â”€ Load Department Stock (from Central Store transfers) â”€â”€

  const loadDeptStock = useCallback(async () => {

    setDeptStockLoading(true);

    const res = await api("/api/dept-inventory");

    if (res.success) setDeptStock(res.data);

    setDeptStockLoading(false);

  }, []);



  // â”€â”€ Load Inventory â”€â”€

  const loadInventory = useCallback(async () => {

    setInvLoading(true);

    const res = await api(`/api/subdept/inventory?search=${encodeURIComponent(invSearch)}&limit=200`);

    if (res.success) {

      const items = res.data?.data || res.data || [];

      setInventory(items);

    }

    setInvLoading(false);

  }, [invSearch]);



  // â”€â”€ Load Suppliers â”€â”€

  const loadSuppliers = useCallback(async () => {

    const res = await api("/api/subdept/inventory/supplier");

    if (res.success) setSuppliers(res.data || []);

  }, []);



  // â”€â”€ Inventory CRUD â”€â”€

  const openInvModal = (item?: InventoryItem) => {

    if (item) {

      setInvEditing(item);

      setInvForm({

        name: item.name || "", genericName: item.genericName || "", brandName: item.brandName || "",

        category: item.category || "Medicine", subCategory: item.subCategory || "",

        unit: item.unit || "pcs", packSize: item.packSize || "", sku: item.sku || "",

        barcode: item.barcode || "", hsnCode: item.hsnCode || "",

        minStock: item.minStock ?? 5, maxStock: item.maxStock || null,

        reorderLevel: item.reorderLevel || null, reorderQty: item.reorderQty || null,

        purchasePrice: item.purchasePrice || 0, mrp: item.mrp || 0,

        sellingPrice: item.sellingPrice || 0, discount: item.discount || 0, gst: item.gst || 0,

        location: item.location || "Pharmacy Store", rackNumber: item.rackNumber || "",

        tempRequirement: item.tempRequirement || "Room Temp",

        drugSchedule: item.drugSchedule || "OTC", requiresRx: item.requiresRx || false,

        isActive: item.isActive !== false, description: item.description || ""

      });

    } else {

      setInvEditing(null);

      setInvForm({

        name: "", genericName: "", brandName: "", category: "Medicine", subCategory: "",

        unit: "pcs", packSize: "", sku: "", barcode: "", hsnCode: "",

        minStock: 5, maxStock: null, reorderLevel: null, reorderQty: null,

        purchasePrice: 0, mrp: 0, sellingPrice: 0, discount: 0, gst: 0,

        location: "Pharmacy Store", rackNumber: "", tempRequirement: "Room Temp",

        drugSchedule: "OTC", requiresRx: false, isActive: true, description: ""

      });

    }

    setInvModalOpen(true);

  };



  const saveInventory = async () => {

    setInvSaving(true);

    const payload = { ...invForm };

    

    // Validation

    if (!payload.name || payload.name.trim().length < 2) {

      alert("Medicine name is required (min 2 characters)");

      setInvSaving(false);

      return;

    }

    

    // Clean up empty strings to null for optional fields

    Object.keys(payload).forEach(key => {

      if (payload[key] === "") payload[key] = null;

    });

    

    // Ensure numeric fields are numbers

    payload.purchasePrice = Number(payload.purchasePrice) || 0;

    payload.mrp = Number(payload.mrp) || 0;

    payload.sellingPrice = Number(payload.sellingPrice) || 0;

    payload.gst = Number(payload.gst) || 0;

    payload.discount = Number(payload.discount) || 0;

    payload.minStock = Number(payload.minStock) || 0;

    payload.maxStock = payload.maxStock ? Number(payload.maxStock) : null;

    payload.reorderLevel = payload.reorderLevel ? Number(payload.reorderLevel) : null;

    payload.reorderQty = payload.reorderQty ? Number(payload.reorderQty) : null;

    

    const url = "/api/subdept/inventory";

    const method = invEditing ? "PUT" : "POST";

    const body = invEditing ? { id: invEditing.id, ...payload } : payload;

    

    try {

      const res = await api(url, method, body);

      setInvSaving(false);

      

      if (res.success) {

        setInvModalOpen(false);

        loadInventory();

      } else {

        alert(res.message || "Failed to save medicine");

      }

    } catch (e: any) {

      setInvSaving(false);

      alert("Error saving medicine: " + (e.message || "Unknown error"));

    }

  };



  const deleteInventory = async () => {

    if (!invDeleteTarget) return;

    setInvDeleting(true);

    const res = await api(`/api/subdept/inventory?id=${invDeleteTarget.id}`, "DELETE");

    setInvDeleting(false);

    if (res.success) {

      setInvDeleteTarget(null);

      loadInventory();

    }

  };



  // â”€â”€ Purchase CRUD â”€â”€

  const openPurchaseModal = () => {

    const today = new Date().toISOString().split('T')[0];

    setPurchaseForm({

      supplierId: "",

      purchaseNo: `PO-${Date.now().toString(36).toUpperCase()}`,

      orderDate: today,

      expectedDeliveryDate: "",

      notes: "",

      discount: 0,

      taxPercent: 0,

      shippingCharges: 0,

      items: [{ itemId: "", quantity: 1, price: 0, sellingPrice: 0, mrp: 0, batchNumber: "", expiryDate: "" }]

    });

    setPurchaseModalOpen(true);

    loadSuppliers();

  };



  const addPurchaseItem = () => {

    setPurchaseForm((prev: any) => ({

      ...prev,

      items: [...prev.items, { itemId: "", quantity: 1, price: 0, sellingPrice: 0, mrp: 0, batchNumber: "", expiryDate: "" }]

    }));

  };



  const removePurchaseItem = (idx: number) => {

    setPurchaseForm((prev: any) => ({

      ...prev,

      items: prev.items.filter((_: any, i: number) => i !== idx)

    }));

  };



  const updatePurchaseItem = (idx: number, field: string, value: any) => {

    setPurchaseForm((prev: any) => ({

      ...prev,

      items: prev.items.map((item: any, i: number) => i === idx ? { ...item, [field]: value } : item)

    }));

  };



  const savePurchase = async () => {

    setPurchaseSaving(true);

    

    // Build payload with proper calculations

    const payload = {

      supplierId: purchaseForm.supplierId,

      purchaseNo: purchaseForm.purchaseNo,

      notes: purchaseForm.notes || undefined,

      items: purchaseForm.items.map((item: any) => ({

        itemId: item.itemId,

        quantity: Number(item.quantity) || 0,

        price: Number(item.price) || 0,

        sellingPrice: Number(item.sellingPrice) || 0,

        batchNumber: item.batchNumber || undefined,

        expiryDate: item.expiryDate || undefined,

      })).filter((item: any) => item.itemId && item.quantity > 0),

    };

    

    // Validation

    if (!payload.supplierId) {

      alert("Please select a supplier");

      setPurchaseSaving(false);

      return;

    }

    if (payload.items.length === 0) {

      alert("Please add at least one item with valid quantity");

      setPurchaseSaving(false);

      return;

    }

    

    try {

      const res = await api("/api/subdept/inventory/purchase", "POST", payload);

      setPurchaseSaving(false);

      if (res.success) {

        setPurchaseModalOpen(false);

        loadPurchases();

        loadInventory();

      } else {

        alert(res.message || "Failed to create purchase");

      }

    } catch (e: any) {

      setPurchaseSaving(false);

      alert("Error creating purchase: " + (e.message || "Unknown error"));

    }

  };



  // â”€â”€ Supplier CRUD â”€â”€

  const openSupplierModal = (supplier?: any) => {

    if (supplier) {

      setSupplierEditing(supplier);

      setSupplierForm({

        name: supplier.name || "", contactPerson: supplier.contactPerson || "",

        phone: supplier.phone || "", email: supplier.email || "", gstNumber: supplier.gstNumber || "",

        address1: supplier.address1 || "", city: supplier.city || "",

        state: supplier.state || "", pincode: supplier.pincode || "", notes: supplier.notes || ""

      });

    } else {

      setSupplierEditing(null);

      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", gstNumber: "", address1: "", city: "", state: "", pincode: "", notes: "" });

    }

    setSupplierModalOpen(true);

  };



  const saveSupplier = async () => {

    setSupplierSaving(true);

    const url = "/api/subdept/inventory/supplier";

    const method = supplierEditing ? "PUT" : "POST";

    const body = supplierEditing ? { id: supplierEditing.id, ...supplierForm } : supplierForm;

    const res = await api(url, method, body);

    setSupplierSaving(false);

    if (res.success) {

      setSupplierModalOpen(false);

      loadSuppliers();

    } else {

      alert(res.message || "Failed to save supplier");

    }

  };



  const deleteSupplier = async () => {

    if (!supplierDeleteTarget) return;

    setSupplierDeleting(true);

    const res = await api(`/api/subdept/inventory/supplier?id=${supplierDeleteTarget.id}`, "DELETE");

    setSupplierDeleting(false);

    if (res.success) {

      setSupplierDeleteTarget(null);

      loadSuppliers();

    }

  };



  // â”€â”€ Load Purchases â”€â”€

  const loadPurchases = useCallback(async () => {

    setPurchasesLoading(true);

    const [pRes, sRes] = await Promise.all([

      api("/api/pharmacy/purchases"),

      api("/api/pharmacy/suppliers"),

    ]);

    if (pRes.success) setPurchases(pRes.data?.data || pRes.data || []);

    if (sRes.success) setSuppliers(sRes.data || []);

    setPurchasesLoading(false);

  }, []);



  // â”€â”€ Load Appointments â”€â”€

  const loadAppointments = useCallback(async () => {

    setApptLoading(true);

    const params = new URLSearchParams({ limit: "50", page: String(apptPage), sortBy: "appointmentDate", sortOrder: "desc" });

    if (apptSearch) params.set("search", apptSearch);

    if (apptStatusFilter !== "all") params.set("status", apptStatusFilter);

    if (apptDateFilter) params.set("date", apptDateFilter);

    const res = await api(`/api/appointments?${params.toString()}`);

    if (res.success) {

      setAppointments(res.data?.data || []);

      setApptPagination({ total: res.data?.pagination?.total || 0, page: res.data?.pagination?.page || 1, totalPages: res.data?.pagination?.totalPages || 1 });

    }

    setApptLoading(false);

  }, [apptSearch, apptStatusFilter, apptDateFilter, apptPage]);



  // â”€â”€ Load Doctors (for booking form) â”€â”€

  const loadApptDoctors = useCallback(async () => {

    const res = await api("/api/config/doctors?simple=true");

    if (res.success) setApptDoctors(Array.isArray(res.data) ? res.data : res.data?.data || []);

  }, []);



  // â”€â”€ Search Patients (for booking form) â”€â”€

  const searchApptPatients = useCallback(async (q: string) => {

    if (!q || q.length < 2) { setApptPatients([]); return; }

    const res = await api(`/api/patients?q=${encodeURIComponent(q)}`);

    if (res.success) setApptPatients(Array.isArray(res.data) ? res.data : res.data?.data || []);

  }, []);



  // â”€â”€ Load Time Slots â”€â”€

  const loadApptSlots = useCallback(async (doctorId: string, date: string) => {

    if (!doctorId || !date) return;

    setApptSlotsLoading(true);

    const res = await api(`/api/appointments/slots?doctorId=${doctorId}&date=${date}`);

    if (res.success) setApptSlots(res.data?.available || []);

    setApptSlotsLoading(false);

  }, []);



  // â”€â”€ Book Appointment â”€â”€

  const handleBookAppointment = async () => {

    setApptBookError("");

    if (!apptBookForm.patientId) { setApptBookError("Please select a patient"); return; }

    if (!apptBookForm.doctorId) { setApptBookError("Please select a doctor"); return; }

    if (!apptBookForm.appointmentDate) { setApptBookError("Please select a date"); return; }

    if (!apptBookForm.timeSlot) { setApptBookError("Please select a time slot"); return; }

    setApptBookSaving(true);

    const res = await api("/api/appointments", "POST", {

      patientId: apptBookForm.patientId,

      doctorId: apptBookForm.doctorId,

      appointmentDate: apptBookForm.appointmentDate,

      timeSlot: apptBookForm.timeSlot,

      type: apptBookForm.type,

      consultationFee: apptBookForm.consultationFee ? parseFloat(apptBookForm.consultationFee) : null,

      notes: apptBookForm.notes || null,

    });

    setApptBookSaving(false);

    if (res.success) {

      setApptBookModal(false);

      setApptBookForm({ patientId:"", patientName:"", doctorId:"", appointmentDate:"", timeSlot:"", type:"OPD", consultationFee:"", notes:"" });

      setApptPatients([]);

      setApptPatientSearch("");

      setApptSlots([]);

      loadAppointments();

    } else {

      setApptBookError(res.message || "Failed to book appointment");

    }

  };



  // â”€â”€ Update Appointment â”€â”€

  const handleUpdateAppointment = async () => {

    if (!apptEditModal) return;

    setApptEditSaving(true);

    const payload: any = {};

    if (apptEditForm.status) payload.status = apptEditForm.status;

    if (apptEditForm.appointmentDate) payload.appointmentDate = apptEditForm.appointmentDate;

    if (apptEditForm.timeSlot) payload.timeSlot = apptEditForm.timeSlot;

    if (apptEditForm.notes !== undefined) payload.notes = apptEditForm.notes;

    if (apptEditForm.consultationFee !== undefined) payload.consultationFee = apptEditForm.consultationFee ? parseFloat(apptEditForm.consultationFee) : null;

    const res = await api(`/api/appointments/${apptEditModal.id}`, "PUT", payload);

    setApptEditSaving(false);

    if (res.success) {

      setApptEditModal(null);

      loadAppointments();

    }

  };



  // â”€â”€ Cancel Appointment â”€â”€

  const handleCancelAppointment = async () => {

    if (!apptCancelTarget) return;

    setApptCancelling(true);

    const res = await api(`/api/appointments/${apptCancelTarget.id}`, "DELETE");

    setApptCancelling(false);

    if (res.success) {

      setApptCancelTarget(null);

      loadAppointments();

    }

  };



  // â”€â”€ Load Bills â”€â”€

  // â”€â”€ Auto-load on tab change â”€â”€

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => { if (tab === "queue") { loadQueue(); if (inventory.length === 0) loadInventory(); } }, [tab, loadQueue]);

  useEffect(() => { if (tab === "reports") { loadStats(); } }, [tab]);

  useEffect(() => { if (tab === "expense") loadExpenses(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {

    if (!queueExportOpen) return;

    const handler = (e: MouseEvent) => {

      if (queueExportRef.current && !queueExportRef.current.contains(e.target as Node)) setQueueExportOpen(false);

    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);

  }, [queueExportOpen]);



  // â”€â”€ Real-time Prescription Notifications (SSE) â”€â”€

  useEffect(() => {

    const connectSSE = () => {

      const es = new EventSource("/api/pharmacy/notifications/stream", { withCredentials: true });

      notificationEsRef.current = es;



      es.onmessage = (e: MessageEvent) => {

        try {

          const data = JSON.parse(e.data);

          if (data.type === "NEW_PRESCRIPTION" && data.prescription) {

            // Play notification sound

            if (rxNotificationSound) {

              rxNotificationSound.play().catch(() => {});

            }

            // Show notification popup

            setNewRxNotification(data.prescription);

            // Refresh queue to show new prescription

            loadQueue();

            loadStats();

          }

        } catch {}

      };



      es.onerror = () => {

        es.close();

        // Retry connection after 10 seconds

        setTimeout(connectSSE, 10000);

      };

    };



    connectSSE();



    return () => {

      notificationEsRef.current?.close();

    };

  }, [loadQueue, loadStats, rxNotificationSound]);



  // â”€â”€ Sync csItems availableStock when inventory data refreshes â”€â”€

  useEffect(() => {

    if (!counterSaleModal || inventory.length === 0) return;

    setCsItems(prev => prev.map(item => {

      if (!item.inventoryItemId) return item;

      const invItem = inventory.find((i: any) => i.id === item.inventoryItemId);

      if (!invItem) return { ...item, availableStock: 0 };

      const stock = invItem.totalStock || invItem.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;

      return { ...item, availableStock: stock };

    }));

  }, [inventory, counterSaleModal]);



  // â”€â”€ Dispense Handler â”€â”€

  const handleDispenseSubmit = async () => {

    if (!dispenseModalItem) return;

    const item = dispenseModalItem;



    const validItems = dspItems.filter((m: any) => m.inventoryItemId && m.quantity > 0);

    if (validItems.length === 0) {

      setSuccessModal({ open: true, title: "No Items Selected", message: "Select at least one inventory item before dispensing.", details: [] });

      return;

    }



    const overStock = validItems.filter((m: any) => {

      const inv = inventory.find((i: any) => i.id === m.inventoryItemId);

      const avail = inv ? (inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0) : 0;

      return m.quantity > avail;

    });

    if (overStock.length > 0) {

      setSuccessModal({ open: true, title: "Insufficient Stock", message: `${overStock.length} item(s) exceed available stock. Adjust quantities.`, details: [] });

      return;

    }



    if (dspAction === "transfer" && !dspTransferTarget) {

      setSuccessModal({ open: true, title: "Select Department", message: "Choose a department to transfer the patient to.", details: [] });

      return;

    }



    setDispensingId(item.id);

    const subtotal = dspItems.reduce((s: number, m: any) => s + (m.quantity * m.unitPrice), 0);

    const total = Math.max(0, subtotal - (dspDiscount || 0));



    const res = await api("/api/pharmacy/queue", "PATCH", {

      prescriptionId: item.id,

      workflowId: item.workflowId || null,

      notes: dspNotes || "Dispensed from pharmacy counter",

      dispensedItems: validItems.map((m: any) => ({ name: m.name, inventoryItemId: m.inventoryItemId, quantity: m.quantity, price: m.unitPrice })),

      totalCharge: total,

      paymentAction: dspAction === "collect" ? "collect" : dspAction === "transfer" ? (dspTransferTarget === "BILLING" ? "transfer_billing" : "transfer_dept") : null,

      paymentMethod: dspAction === "collect" ? dspPayMethod : undefined,

      transactionId: dspTxnId || undefined,

      discount: dspDiscount || 0,

      transferDeptId: dspAction === "transfer" ? dspTransferTarget : undefined,

      transferNote: dspAction === "transfer" ? (dspTransferNote || "Transferred from Pharmacy after dispensing") : undefined,

    });



    setDispensingId(null);

    setDispenseModalItem(null);

    if (res.success) {

      setExpandedRx(null);

      loadQueue();

      loadStats();

      loadInventory();

      setSuccessModal({

        open: true,

        title: dspAction === "collect" ? "Dispensed & Paid!" : dspAction === "transfer" ? "Dispensed & Transferred!" : "Dispensed!",

        message: dspAction === "collect"

          ? `Medicines dispensed and payment of \u20B9${total.toFixed(2)} collected.`

          : dspAction === "transfer"

            ? `Medicines dispensed. Patient transferred to ${dspTransferTarget === "BILLING" ? "Billing Counter" : subDepts.find((s: any) => s.id === dspTransferTarget)?.name || "department"}.`

            : "Medicines dispensed successfully.",

        details: [],

      });

    } else {

      setSuccessModal({ open: true, title: "Error", message: res.message || "Failed to dispense. Please try again.", details: [] });

    }

  };



  // â”€â”€ Filter logic â”€â”€

  const filteredQueue = queue

    .filter(q => {

      if (queueFilter === "pending" && q.dispensed) return false;

      if (queueFilter === "dispensed" && !q.dispensed) return false;

      if (queueSourceFilter !== "all" && q.appointment?.type !== queueSourceFilter) return false;

      return true;

    })

    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());



  const filteredInventory = inventory.filter(i => {

    if (invFilter === "low" && (i.totalStock || 0) > i.minStock) return false;

    if (invFilter === "expiring") {

      const thirtyDays = new Date();

      thirtyDays.setDate(thirtyDays.getDate() + 30);

      const hasExpiring = i.batches?.some(b => b.expiryDate && new Date(b.expiryDate) <= thirtyDays);

      if (!hasExpiring) return false;

    }

    return true;

  });



  // â”€â”€ Inventory helpers â”€â”€

  const getStockStatus = (item: InventoryItem) => {

    const total = item.totalStock || item.batches?.reduce((s, b) => s + b.remainingQty, 0) || 0;

    if (total === 0) return { label: "Out of Stock", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };

    if (total <= item.minStock) return { label: "Low Stock", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" };

    return { label: "In Stock", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };

  };



  const deptName = profile?.name || "Pharmacy";



  // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€



  return (

    <>

      <style>{pharmacyStyles}</style>



      {/* â”€â”€ Overview Tab â”€â”€ */}

      {tab === "overview" && (

        <div className="ph-section" style={{ minHeight: "100%" }}>

          {statsLoading && !stats ? (

            <div className="ph-loading"><Loader2 size={20} className="ph-spin" /> Loading dashboard...</div>

          ) : stats ? (

            <>

              {/* ── Header: title + live indicator + refresh countdown ── */}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>

                <div>

                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>{deptName} Dashboard</div>

                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>

                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 3px #dcfce7", flexShrink: 0 }} />

                    Live &middot; Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}

                  </div>

                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "#fff", border: "1px solid #e2e8f0", fontSize: 11, color: "#64748b" }}>

                    <svg width="18" height="18" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>

                      <circle cx="9" cy="9" r="7" fill="none" stroke="#e2e8f0" strokeWidth="2" />

                      <circle cx="9" cy="9" r="7" fill="none" stroke={ACCENT} strokeWidth="2"

                        strokeDasharray={`${(refreshCountdown / 30) * 44} 44`} strokeLinecap="round" style={{ transition: "stroke-dasharray .5s linear" }} />

                    </svg>

                    Refresh in {refreshCountdown}s

                  </div>

                  <button

                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}

                    onClick={() => { loadStats(); loadQueue(); setRefreshCountdown(30); setLastRefresh(new Date()); }}

                  >

                    <RefreshCw size={13} style={statsLoading ? { animation: "ph-spin-anim 1s linear infinite" } : {}} /> Refresh

                  </button>

                </div>

              </div>



              {/* ── Row 1: 4 Main KPI Cards ── */}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>



                {/* Dispensing Today */}

                <div

                  style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}

                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(14,137,143,.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}

                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}

                  onClick={() => setTab("queue")}

                >

                  <div style={{ width: 44, height: 44, borderRadius: 11, background: `${ACCENT}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>

                    <Pill size={20} color={ACCENT} />

                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>

                      <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>

                        {stats.todayDispensed}

                        <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", marginLeft: 3 }}>/ {stats.todayRxCount}</span>

                      </div>

                      <span style={{ fontSize: 8, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 6px", borderRadius: 10, border: "1px solid #bbf7d0" }}>TODAY</span>

                    </div>

                    <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>Prescriptions Dispensed</div>

                  </div>

                </div>



                {/* Pending Queue */}

                <div

                  style={{ background: stats.pendingCount > 0 ? "#fff7ed" : "#fff", borderRadius: 12, padding: 12, border: `1px solid ${stats.pendingCount > 0 ? "#fed7aa" : "#e2e8f0"}`, cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}

                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(234,88,12,.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}

                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}

                  onClick={() => setTab("queue")}

                >

                  <div style={{ width: 44, height: 44, borderRadius: 11, background: stats.pendingCount > 0 ? "#fff3e6" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>

                    <ClipboardList size={20} color={stats.pendingCount > 0 ? "#ea580c" : "#94a3b8"} />

                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>

                      <div style={{ fontSize: 22, fontWeight: 800, color: stats.pendingCount > 0 ? "#ea580c" : "#0f172a", lineHeight: 1 }}>{stats.pendingCount}</div>

                      {stats.pendingCount > 0 ? (

                        <span style={{ fontSize: 8, fontWeight: 700, color: "#ea580c", background: "#fff3e6", padding: "2px 6px", borderRadius: 10, border: "1px solid #fed7aa", display: "flex", alignItems: "center", gap: 2 }}>

                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#ea580c", display: "inline-block", animation: "ph-pulse 1.5s ease-in-out infinite" }} />

                          URGENT

                        </span>

                      ) : (

                        <span style={{ fontSize: 8, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 6px", borderRadius: 10, border: "1px solid #bbf7d0" }}>CLEAR</span>

                      )}

                    </div>

                    <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>Pending Prescriptions</div>

                  </div>

                </div>



                {/* Today's Revenue */}

                <div

                  style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}

                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(22,163,74,.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}

                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}

                  onClick={() => setTab("billing")}

                >

                  <div style={{ width: 44, height: 44, borderRadius: 11, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>

                    <IndianRupee size={20} color="#16a34a" />

                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>

                      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{fmtCurrency(stats.todayRevenue)}</div>

                      {stats.yesterdayRevenue > 0 ? (

                        <span style={{ fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 2, padding: "2px 6px", borderRadius: 10, border: "1px solid", color: stats.todayRevenue >= stats.yesterdayRevenue ? "#16a34a" : "#ef4444", background: stats.todayRevenue >= stats.yesterdayRevenue ? "#f0fdf4" : "#fff5f5", borderColor: stats.todayRevenue >= stats.yesterdayRevenue ? "#bbf7d0" : "#fecaca" }}>

                          {stats.todayRevenue >= stats.yesterdayRevenue ? <TrendingUp size={8} /> : <TrendingDown size={8} />}

                          {Math.abs(Math.round((stats.todayRevenue - stats.yesterdayRevenue) / Math.max(stats.yesterdayRevenue, 1) * 100))}%

                        </span>

                      ) : (

                        <span style={{ fontSize: 8, fontWeight: 700, color: "#64748b", background: "#f8fafc", padding: "2px 6px", borderRadius: 10, border: "1px solid #e2e8f0" }}>TODAY</span>

                      )}

                    </div>

                    <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>Today&apos;s Revenue</div>

                  </div>

                </div>



                {/* Inventory Health */}

                <div

                  style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", cursor: "pointer", transition: "box-shadow .2s, transform .15s", display: "flex", alignItems: "center", gap: 12 }}

                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}

                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}

                  onClick={() => setTab("inventory")}

                >

                  <div style={{ width: 44, height: 44, borderRadius: 11, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>

                    <Package size={20} color="#2563eb" />

                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>

                      <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>

                        {stats.stockHealthPct}<span style={{ fontSize: 13, color: "#94a3b8" }}>%</span>

                      </div>

                      <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 10, border: "1px solid", color: stats.stockHealthPct >= 90 ? "#16a34a" : stats.stockHealthPct >= 70 ? "#ea580c" : "#ef4444", background: stats.stockHealthPct >= 90 ? "#f0fdf4" : stats.stockHealthPct >= 70 ? "#fff7ed" : "#fff5f5", borderColor: stats.stockHealthPct >= 90 ? "#bbf7d0" : stats.stockHealthPct >= 70 ? "#fed7aa" : "#fecaca" }}>

                        {stats.stockHealthPct >= 90 ? "HEALTHY" : stats.stockHealthPct >= 70 ? "MODERATE" : "CRITICAL"}

                      </span>

                    </div>

                    <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}>Inventory Health</div>

                  </div>

                </div>

              </div>



              {/* ── Row 2: 4 Secondary Stat Chips ── */}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>

                {[

                  { icon: <ClipboardList size={16} color={ACCENT} />, value: stats.todayRxCount, label: "Prescriptions Today", bg: `${ACCENT}10`, action: () => setTab("queue") },

                  { icon: <AlertTriangle size={16} color={stats.lowStockCount > 0 ? "#ea580c" : "#94a3b8"} />, value: stats.lowStockCount, label: "Low Stock", bg: stats.lowStockCount > 0 ? "#fff7ed" : "#f8fafc", action: () => { setTab("inventory"); setInvFilter("low"); }, urgent: stats.lowStockCount > 0 },

                  { icon: <Clock size={16} color={stats.expiringCount > 0 ? "#ef4444" : "#94a3b8"} />, value: stats.expiringCount, label: "Expiring Soon", bg: stats.expiringCount > 0 ? "#fff5f5" : "#f8fafc", action: () => { setTab("inventory"); setInvFilter("expiring"); }, urgent: stats.expiringCount > 0 },

                  { icon: <TrendingUp size={16} color="#9333ea" />, value: fmtCurrency(stats.totalRevenue), label: "All-time Revenue", bg: "#faf5ff", action: () => setTab("revenue") },

                ].map((chip, i) => (

                  <div key={i}

                    style={{ background: chip.bg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${(chip as any).urgent ? "#fed7aa" : "#e2e8f0"}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all .15s" }}

                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.06)"; }}

                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}

                    onClick={chip.action}

                  >

                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>{chip.icon}</div>

                    <div>

                      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{chip.value}</div>

                      <div style={{ fontSize: 11, color: "#64748b" }}>{chip.label}</div>

                    </div>

                  </div>

                ))}

              </div>



              {/* ── Row 3: Charts (3fr + 2fr) ── */}

              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14, marginBottom: 14 }}>



                {/* 7-Day Dual Area Line Chart */}

                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0" }}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>

                    <div>

                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>7-Day Performance</div>

                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Revenue &amp; dispensing trend</div>

                    </div>

                  </div>

                  {/* SVG Dual Area Line Chart */}

                  {(() => {

                    const cd = stats.chartData;

                    const W = 520, H = 160, PL = 44, PR = 12, PT = 10, PB = 28;

                    const cW = W - PL - PR, cH = H - PT - PB;

                    const n = cd.length;

                    if (n < 2) return <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No data yet</div>;

                    const maxRev = Math.max(...cd.map(d => d.revenue), 1);

                    const maxCnt = Math.max(...cd.map(d => d.count), 1);

                    const step = cW / (n - 1);

                    const xOf = (i: number) => PL + i * step;

                    const yR = (v: number) => PT + cH - (v / maxRev) * cH;

                    const yC = (v: number) => PT + cH - (v / maxCnt) * cH;

                    const revLine = cd.map((d, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yR(d.revenue)}`).join(" ");

                    const cntLine = cd.map((d, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yC(d.count)}`).join(" ");

                    const revArea = `${revLine} L ${xOf(n - 1)} ${PT + cH} L ${PL} ${PT + cH} Z`;

                    const cntArea = `${cntLine} L ${xOf(n - 1)} ${PT + cH} L ${PL} ${PT + cH} Z`;

                    const yTicks = [0, 0.33, 0.66, 1];

                    const todayIdx = cd.findIndex(d => d.date === new Date().toISOString().slice(0, 10));

                    return (

                      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>

                        <defs>

                          <linearGradient id="ph-rev-grad" x1="0" y1="0" x2="0" y2="1">

                            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.32" />

                            <stop offset="100%" stopColor={ACCENT} stopOpacity="0.02" />

                          </linearGradient>

                          <linearGradient id="ph-cnt-grad" x1="0" y1="0" x2="0" y2="1">

                            <stop offset="0%" stopColor="#86efac" stopOpacity="0.45" />

                            <stop offset="100%" stopColor="#86efac" stopOpacity="0.02" />

                          </linearGradient>

                        </defs>

                        {/* Grid lines + Y labels */}

                        {yTicks.map((t, i) => {

                          const y = PT + cH - t * cH;

                          const val = maxRev * t;

                          const lbl = val === 0 ? "0" : val >= 1000 ? `${Math.round(val / 1000)}k` : String(Math.round(val));

                          return (

                            <g key={i}>

                              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke={i === 0 ? "#e2e8f0" : "#f1f5f9"} strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 3"} />

                              <text x={PL - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{lbl}</text>

                            </g>

                          );

                        })}

                        {/* Today highlight */}

                        {todayIdx >= 0 && (

                          <line x1={xOf(todayIdx)} y1={PT} x2={xOf(todayIdx)} y2={PT + cH} stroke={ACCENT} strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4" />

                        )}

                        {/* Area fills (count behind revenue) */}

                        <path d={cntArea} fill="url(#ph-cnt-grad)" />

                        <path d={revArea} fill="url(#ph-rev-grad)" />

                        {/* Lines */}

                        <path d={cntLine} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                        <path d={revLine} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

                        {/* Dots + tooltips via title */}

                        {cd.map((d, i) => (

                          <g key={i}>

                            <circle cx={xOf(i)} cy={yC(d.count)} r="3.5" fill="#fff" stroke="#4ade80" strokeWidth="2" />

                            <circle cx={xOf(i)} cy={yR(d.revenue)} r="4" fill="#fff" stroke={ACCENT} strokeWidth="2.5">

                              <title>{d.label}: {fmtCurrency(d.revenue)} · {d.count} dispensed</title>

                            </circle>

                            {/* X labels */}

                            <text x={xOf(i)} y={H - 5} textAnchor="middle" fontSize="9" fill={i === todayIdx ? ACCENT : "#94a3b8"} fontWeight={i === todayIdx ? "700" : "400"}>{d.label}</text>

                          </g>

                        ))}

                      </svg>

                    );

                  })()}

                  {/* Legend + footer */}

                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                    <div style={{ display: "flex", gap: 16 }}>

                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>

                        <svg width="24" height="3"><line x1="0" y1="1.5" x2="24" y2="1.5" stroke={ACCENT} strokeWidth="2.5" /></svg>

                        Revenue

                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>

                        <svg width="24" height="3"><line x1="0" y1="1.5" x2="24" y2="1.5" stroke="#4ade80" strokeWidth="2" /></svg>

                        Dispensed

                      </div>

                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                      <span style={{ fontSize: 11, color: "#64748b" }}>7-day: <strong style={{ color: "#0f172a" }}>{fmtCurrency(stats.weekRevenue)}</strong></span>

                      {stats.revenueGrowth !== null && (

                        <span style={{ fontSize: 11, fontWeight: 600, color: (stats.revenueGrowth ?? 0) >= 0 ? "#16a34a" : "#ef4444", display: "flex", alignItems: "center", gap: 3 }}>

                          {(stats.revenueGrowth ?? 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}

                          {(stats.revenueGrowth ?? 0) >= 0 ? "+" : ""}{stats.revenueGrowth}%

                        </span>

                      )}

                    </div>

                  </div>

                </div>



                {/* Top Medicines Horizontal Bar Chart */}

                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0" }}>

                  <div style={{ marginBottom: 16 }}>

                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Top Medicines</div>

                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Last 30 days &middot; by quantity</div>

                  </div>

                  {stats.topMedicines.length === 0 ? (

                    <div className="ph-empty-sm" style={{ height: 160 }}>No dispensing data yet</div>

                  ) : (

                    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>

                      {stats.topMedicines.slice(0, 6).map((m, i) => {

                        const colors = [ACCENT, "#2563eb", "#9333ea", "#ea580c", "#16a34a", "#0891b2"];

                        const pct = (m.qty / stats.topMedicines[0].qty) * 100;

                        return (

                          <div key={i}>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>

                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

                                <span style={{ fontSize: 10, fontWeight: 700, color: colors[i], width: 18, flexShrink: 0 }}>#{i + 1}</span>

                                <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.name}>{m.name}</span>

                              </div>

                              <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", flexShrink: 0 }}>{m.qty} <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 400 }}>units</span></span>

                            </div>

                            <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>

                              <div style={{ height: "100%", borderRadius: 3, background: colors[i], width: `${pct}%`, transition: "width .7s ease" }} />

                            </div>

                            <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2, textAlign: "right" }}>{fmtCurrency(m.revenue)}</div>

                          </div>

                        );

                      })}

                    </div>

                  )}

                </div>

              </div>



              {/* ── Row 4: Alerts + Quick Actions ── */}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>



                {/* Alerts */}

                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0" }}>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Alerts &amp; Notifications</div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                    {stats.lowStockCount === 0 && stats.expiringCount === 0 && stats.pendingCount === 0 ? (

                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>

                        <CheckCircle2 size={18} color="#16a34a" />

                        <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>All clear! No active alerts.</span>

                      </div>

                    ) : (

                      <>

                        {stats.pendingCount > 0 && (

                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fff7ed", borderRadius: 12, border: "1px solid #fed7aa", cursor: "pointer" }} onClick={() => setTab("queue")}>

                            <ClipboardList size={16} color="#ea580c" style={{ flexShrink: 0 }} />

                            <div style={{ flex: 1 }}>

                              <div style={{ fontSize: 13, fontWeight: 600, color: "#c2410c" }}>{stats.pendingCount} prescription{stats.pendingCount !== 1 ? "s" : ""} waiting</div>

                              <div style={{ fontSize: 11, color: "#9a3412" }}>Click to open queue</div>

                            </div>

                            <ChevronRight size={14} color="#ea580c" />

                          </div>

                        )}

                        {stats.lowStockCount > 0 && (

                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fffbeb", borderRadius: 12, border: "1px solid #fde68a", cursor: "pointer" }} onClick={() => { setTab("inventory"); setInvFilter("low"); }}>

                            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />

                            <div style={{ flex: 1 }}>

                              <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>{stats.lowStockCount} item{stats.lowStockCount !== 1 ? "s" : ""} below minimum stock</div>

                              <div style={{ fontSize: 11, color: "#78350f" }}>Click to review inventory</div>

                            </div>

                            <ChevronRight size={14} color="#d97706" />

                          </div>

                        )}

                        {stats.expiringCount > 0 && (

                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fff5f5", borderRadius: 12, border: "1px solid #fecaca", cursor: "pointer" }} onClick={() => { setTab("inventory"); setInvFilter("expiring"); }}>

                            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />

                            <div style={{ flex: 1 }}>

                              <div style={{ fontSize: 13, fontWeight: 600, color: "#b91c1c" }}>{stats.expiringCount} item{stats.expiringCount !== 1 ? "s" : ""} expiring within 30 days</div>

                              <div style={{ fontSize: 11, color: "#991b1b" }}>Click to review items</div>

                            </div>

                            <ChevronRight size={14} color="#ef4444" />

                          </div>

                        )}

                      </>

                    )}

                  </div>

                </div>



                {/* Quick Actions */}

                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0" }}>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Quick Actions</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>

                    {([

                      { icon: <ClipboardList size={17} color={ACCENT} />, label: "Rx Queue", sub: `${stats.pendingCount} pending`, action: () => setTab("queue"), bg: `${ACCENT}10`, urgent: stats.pendingCount > 0 },

                      { icon: <ShoppingCart size={17} color="#ea580c" />, label: "Counter Sale", sub: "Walk-in", action: () => setCounterSaleModal(true), bg: "#fff3e6", urgent: false },

                      { icon: <Package size={17} color="#2563eb" />, label: "Inventory", sub: `${stats.totalItems} items`, action: () => setTab("inventory"), bg: "#eff6ff", urgent: false },

                      { icon: <AlertTriangle size={17} color={stats.lowStockCount > 0 ? "#ea580c" : "#94a3b8"} />, label: "Low Stock", sub: `${stats.lowStockCount} items`, action: () => { setTab("inventory"); setInvFilter("low"); }, bg: stats.lowStockCount > 0 ? "#fff7ed" : "#f8fafc", urgent: stats.lowStockCount > 0 },

                      { icon: <Receipt size={17} color="#6366f1" />, label: "Billing", sub: "View & collect", action: () => setTab("billing"), bg: "#eef2ff", urgent: false },

                      { icon: <BarChart2 size={17} color="#10b981" />, label: "Reports", sub: "Analytics", action: () => setTab("reports"), bg: "#ecfdf5", urgent: false },

                    ] as const).map((qa, i) => (

                      <button key={i}

                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${qa.urgent ? "#fed7aa" : "#f1f5f9"}`, background: qa.bg, cursor: "pointer", textAlign: "left", transition: "all .15s", position: "relative", overflow: "hidden" }}

                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)"; }}

                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}

                        onClick={qa.action}

                      >

                        <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>{qa.icon}</div>

                        <div>

                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{qa.label}</div>

                          <div style={{ fontSize: 10, color: "#64748b" }}>{qa.sub}</div>

                        </div>

                        {qa.urgent && <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: "50%", background: "#ea580c", animation: "ph-pulse 1.5s ease-in-out infinite" }} />}

                      </button>

                    ))}

                  </div>

                </div>

              </div>

            </>

          ) : (

            <div className="ph-empty">Failed to load stats. <button className="ph-link" onClick={loadStats}>Retry</button></div>

          )}

        </div>

      )}



      {/* ── Rx Queue Tab ── */}

      {tab === "queue" && (

        <div className="ph-section">



          {/* ── Page Header ── */}

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>

            <div>

              <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: "-.02em", display: "flex", alignItems: "center", gap: 10 }}>

                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${ACCENT},#07595D)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>

                  <Pill size={18} color="#fff" />

                </div>

                Prescription Queue

              </div>

              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, marginLeft: 46 }}>All prescriptions — pending dispensing, dispensed &amp; collected</div>

            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

              <button className="ph-btn-ghost" onClick={loadQueue} disabled={queueLoading}><RefreshCw size={13} className={queueLoading ? "ph-spin" : ""} /> Refresh</button>

              <button className="ph-btn-primary" style={{ background: ACCENT }} onClick={() => { setCounterSaleModal(true); setCsError(""); }}>

                <ShoppingCart size={14} /> New Transaction

              </button>

              <button className="ph-btn-primary" onClick={() => { setRxCreateModal(true); setRxCreateError(""); if (rxCreateDoctors.length === 0) api("/api/config/doctors?simple=true").then(r => { if (r.success) setRxCreateDoctors(Array.isArray(r.data) ? r.data : r.data?.data || []); }); }}>

                <Plus size={14} /> Add Walk-in Rx

              </button>

            </div>

          </div>



          {/* ── KPI Cards ── */}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>

            {([

              { label: "Today's Collection", val: `₹${Number(queueBillingStats.todayRevenue||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`, icon: <IndianRupee size={20} color={ACCENT}/>, bg: "#E6F4F4" },

              { label: "Month Revenue",       val: `₹${Number(queueBillingStats.monthRevenue||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`, icon: <TrendingUp size={20} color="#10b981"/>, bg: "#f0fdf4" },

              { label: "Pending Dispensing",  val: String(queueStats.pending),  icon: <Clock size={20} color="#ea580c"/>,         bg: "#fff3e6" },

              { label: "Total Prescriptions", val: String(queueStats.total),    icon: <ClipboardList size={20} color="#a855f7"/>, bg: "#fdf4ff" },

            ] as { label:string; val:string; icon:React.ReactNode; bg:string }[]).map((s, i) => (

              <div key={i}

                style={{ background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", transition: "box-shadow .2s,transform .15s", display: "flex", alignItems: "center", gap: 12 }}

                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}

                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}>

                <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.val}</div>

                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{s.label}</div>

                </div>

              </div>

            ))}

          </div>



          {/* ── Filter Bar (same as billing module) ── */}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap", padding: "12px 16px", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>

            {/* Search */}

            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "7px 12px", flex: "1 1 180px", minWidth: 160 }}>

              <Search size={14} color="#94a3b8" />

              <input style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "#334155", width: "100%", fontFamily: "inherit" }}

                placeholder="Search patient, Rx number…" value={queueSearch} onChange={e => setQueueSearch(e.target.value)} />

              {queueSearch && <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }} onClick={() => setQueueSearch("")}><X size={11} color="#94a3b8" /></button>}

            </div>

            {/* Status */}

            <select value={queueFilter} onChange={e => setQueueFilter(e.target.value as any)}

              style={{ padding: "8px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#334155", background: "#fff", outline: "none", cursor: "pointer" }}>

              <option value="all">All Status</option>

              <option value="pending">Pending Dispensing</option>

              <option value="dispensed">Dispensed</option>

              <option value="HOLD">On Hold</option>

              <option value="SKIPPED">Skipped</option>

            </select>

            {/* Source */}

            <select value={queueSourceFilter} onChange={e => setQueueSourceFilter(e.target.value as any)}

              style={{ padding: "8px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#334155", background: "#fff", outline: "none", cursor: "pointer" }}>

              <option value="all">All Sources</option>

              <option value="OPD">OPD</option>

              <option value="IPD">IPD</option>

              <option value="EMERGENCY">Emergency</option>

            </select>

            {/* Date filter (optional — empty = all dates) */}

            <input type="date" value={queueDate} onChange={e => setQueueDate(e.target.value)} title="Filter by date (leave empty for all)"

              style={{ padding: "7px 10px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: queueDate ? "#334155" : "#94a3b8", background: "#fff", outline: "none" }} />

            {queueDate && (

              <button title="Clear date — show all" onClick={() => setQueueDate("")}

                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>

                <X size={11} /> All Dates

              </button>

            )}

            <div style={{ flex: 1 }} />

            {/* Refresh */}

            <button onClick={loadQueue} disabled={queueLoading}

              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>

              <RefreshCw size={13} className={queueLoading ? "ph-spin" : ""} />

            </button>

            {/* Export Dropdown */}

            <div style={{ position: "relative" }} ref={queueExportRef}>

              <button onClick={() => setQueueExportOpen(o => !o)}

                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#059669", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>

                <Download size={13} /> Export <ChevronDown size={13} />

              </button>

              {queueExportOpen && (() => {

                const getRows = () => filteredQueue.map(q => ({

                  "Rx No": q.prescriptionNo, "Patient": q.patient?.name || "", "Patient ID": q.patient?.patientId || "",

                  "Doctor": q.doctor?.name || "Walk-in", "Source": q.appointment?.type || "Walk-in",

                  "Meds": (q.medications || []).length, "Status": q.dispensed ? "Dispensed" : q.workflowStatus || "Pending",

                  "Time": q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN") : ""

                }));

                const headers = ["Rx No", "Patient", "Patient ID", "Doctor", "Source", "Meds", "Status", "Time"];

                const tableRows = filteredQueue.map(q => [q.prescriptionNo, q.patient?.name || "", q.patient?.patientId || "", q.doctor?.name || "Walk-in", q.appointment?.type || "Walk-in", String((q.medications || []).length), q.dispensed ? "Dispensed" : q.workflowStatus || "Pending", q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN") : ""]);

                return (

                  <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.1)", zIndex: 100, minWidth: 160 }}>

                    <button onClick={() => { exportToCSV(getRows(), "pharmacy-queue"); setQueueExportOpen(false); }}

                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12, color: "#475569", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", width: "100%", textAlign: "left", cursor: "pointer" }}

                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "none"}>

                      <FileSpreadsheet size={14} color="#10b981" /> Excel (CSV)

                    </button>

                    <button onClick={() => { exportToPDF("Pharmacy Queue Report", headers, tableRows, "pharmacy-queue"); setQueueExportOpen(false); }}

                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12, color: "#475569", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", width: "100%", textAlign: "left", cursor: "pointer" }}

                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "none"}>

                      <FileText size={14} color="#ef4444" /> PDF

                    </button>

                    <button onClick={() => { exportToWord("Pharmacy Queue Report", headers, tableRows, "pharmacy-queue"); setQueueExportOpen(false); }}

                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12, color: "#475569", background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}

                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "none"}>

                      <FileType size={14} color="#2563eb" /> Word (DOCX)

                    </button>

                  </div>

                );

              })()}

            </div>

          </div>



          {/* Bulk Actions Toolbar */}

          {selectedQueue.size > 0 && (

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fffe", border: `1px solid ${ACCENT}40`, borderRadius: 10, marginBottom: 12 }}>

              <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{selectedQueue.size} selected</span>

              <div style={{ width: 1, height: 16, background: "#e2e8f0" }} />

              <button 

                className="ph-btn-ghost" 

                style={{ fontSize: 11, padding: "5px 10px" }}

                onClick={() => {

                  const data = filteredQueue.filter(q => selectedQueue.has(q.id)).map(q => ({

                    "Rx Number": q.prescriptionNo,

                    "Patient": q.patient?.name || "",

                    "Patient ID": q.patient?.patientId || "",

                    "Doctor": q.doctor?.name || "",

                    "Status": q.workflowStatus || "PENDING",

                    "Medications": (q.medications || []).map((m: any) => m.name || m.medicine).join("; "),

                    "Created At": q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN") : ""

                  }));

                  exportToCSV(data, "pharmacy_queue");

                }}

              >

                <FileSpreadsheet size={12} /> Export Excel

              </button>

              <button 

                className="ph-btn-ghost" 

                style={{ fontSize: 11, padding: "5px 10px" }}

                onClick={() => {

                  const selected = filteredQueue.filter(q => selectedQueue.has(q.id));

                  exportToPDF(

                    "Pharmacy Queue Report",

                    ["Rx Number", "Patient", "Patient ID", "Doctor", "Status", "Medications", "Created At"],

                    selected.map(q => [

                      q.prescriptionNo,

                      q.patient?.name || "",

                      q.patient?.patientId || "",

                      q.doctor?.name || "",

                      q.workflowStatus || "PENDING",

                      (q.medications || []).map((m: any) => m.name || m.medicine).join("; "),

                      q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN") : ""

                    ]),

                    "pharmacy_queue"

                  );

                }}

              >

                <FileType size={12} /> Export PDF

              </button>

              <button 

                className="ph-btn-ghost" 

                style={{ fontSize: 11, padding: "5px 10px" }}

                onClick={() => {

                  const selected = filteredQueue.filter(q => selectedQueue.has(q.id));

                  exportToWord(

                    "Pharmacy Queue Report",

                    ["Rx Number", "Patient", "Patient ID", "Doctor", "Status", "Medications", "Created At"],

                    selected.map(q => [

                      q.prescriptionNo,

                      q.patient?.name || "",

                      q.patient?.patientId || "",

                      q.doctor?.name || "",

                      q.workflowStatus || "PENDING",

                      (q.medications || []).map((m: any) => m.name || m.medicine).join("; "),

                      q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN") : ""

                    ]),

                    "pharmacy_queue"

                  );

                }}

              >

                <FileText size={12} /> Export Word

              </button>

              <div style={{ flex: 1 }} />

              <button 

                className="ph-btn-ghost" 

                style={{ fontSize: 11, padding: "5px 10px", color: "#ef4444" }}

                onClick={() => { setBulkDeleteModalOpen(true); setBulkDeleteRemark(""); }}

              >

                <Trash2 size={12} /> Delete Selected

              </button>

              <button 

                className="ph-icon-btn-sm" 

                onClick={() => setSelectedQueue(new Set())}

                title="Clear selection"

              >

                <X size={12} />

              </button>

            </div>

          )}



          {/* Queue Table */}

          {queueLoading ? (

            <div className="ph-loading"><Loader2 size={20} className="ph-spin" /> Loading prescriptions...</div>

          ) : filteredQueue.length === 0 ? (

            <div className="ph-empty">

              <Pill size={32} color="#cbd5e1" />

              <div style={{ marginTop: 8 }}>No {queueFilter === "pending" ? "pending" : queueFilter === "dispensed" ? "dispensed" : ""} prescriptions found</div>

            </div>

          ) : (

            <div className="ph-tbl-wrap">

              <table className="ph-tbl">

                <thead>

                  <tr>

                    <th style={{ width: 32 }}>

                      <input 

                        type="checkbox" 

                        checked={filteredQueue.length > 0 && filteredQueue.every(q => selectedQueue.has(q.id))}

                        onChange={(e) => {

                          if (e.target.checked) {

                            setSelectedQueue(new Set(filteredQueue.map(q => q.id)));

                          } else {

                            setSelectedQueue(new Set());

                          }

                        }}

                        style={{ cursor: "pointer" }}

                      />

                    </th>

                    <th style={{ width: 40 }}>#</th>

                    <th>Patient</th>

                    <th>Rx No.</th>

                    <th>Doctor</th>

                    <th>Source</th>

                    <th>Meds</th>

                    <th>Status</th>

                    <th>Time</th>

                    <th style={{ textAlign: "right" }}>Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredQueue.map((item, idx) => {

                    const meds = item.medications || [];

                    const age = item.patient?.dateOfBirth ? calcAge(item.patient.dateOfBirth) : null;

                    const isExpanded = expandedRx === item.id;

                    const isHold = item.workflowStatus === "HOLD";

                    const isSkipped = item.workflowStatus === "SKIPPED";

          

                    return (

                      <React.Fragment key={item.id}>

                        <tr

                          className={`ph-queue-row${isExpanded ? " expanded" : ""}`}

                          style={{ cursor: "pointer", background: isExpanded ? "#f8fffe" : selectedQueue.has(item.id) ? "#f0f9ff" : undefined }}

                          onClick={() => setExpandedRx(isExpanded ? null : item.id)}

                        >

                          <td onClick={e => e.stopPropagation()}>

                            <input 

                              type="checkbox" 

                              checked={selectedQueue.has(item.id)}

                              onChange={(e) => {

                                const newSet = new Set(selectedQueue);

                                if (e.target.checked) {

                                  newSet.add(item.id);

                                } else {

                                  newSet.delete(item.id);

                                }

                                setSelectedQueue(newSet);

                              }}

                              style={{ cursor: "pointer" }}

                            />

                          </td>

                          <td>

                            {item.appointment?.tokenNumber ? (

                              <span className="ph-rank">T{item.appointment.tokenNumber}</span>

                            ) : (

                              <span style={{ color: "#cbd5e1", fontSize: 11 }}>{idx + 1}</span>

                            )}

                          </td>

                          <td>

                            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{item.patient?.name || "Unknown"}</div>

                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>

                              {item.patient?.patientId}{age ? ` \u00b7 ${age}y` : ""}{item.patient?.gender ? ` \u00b7 ${item.patient.gender}` : ""}

                            </div>

                          </td>

                          <td><span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#0A6B70" }}>{item.prescriptionNo}</span></td>

                          <td style={{ fontSize: 12, color: "#64748b" }}>

                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Stethoscope size={11} /> Dr. {item.doctor?.name || "\u2014"}</div>

                          </td>

                          <td>

                            {item.appointment?.type ? (

                              <span className="ph-badge" style={{

                                background: PRIORITY_MAP[item.appointment.type]?.bg || LIGHT_BG,

                                color: PRIORITY_MAP[item.appointment.type]?.color || ACCENT,

                                border: `1px solid ${PRIORITY_MAP[item.appointment.type]?.color || ACCENT}30`,

                              }}>

                                {item.appointment.type}

                              </span>

                            ) : (

                              <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>

                            )}

                          </td>

                          <td><span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{meds.length}</span><span style={{ fontSize: 11, color: "#94a3b8" }}> med{meds.length !== 1 ? "s" : ""}</span></td>

                          <td>

                            {isHold ? (

                              <span className="ph-badge" style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}><Archive size={10} /> On Hold</span>

                            ) : isSkipped ? (

                              <span className="ph-badge" style={{ background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0" }}><Ban size={10} /> Skipped</span>

                            ) : item.dispensed ? (

                              <span className="ph-badge green"><CheckCircle2 size={10} /> Dispensed</span>

                            ) : (

                              <span className="ph-badge orange"><Clock size={10} /> Pending</span>

                            )}

                          </td>

                          <td style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{fmtTime(item.createdAt)}</td>

                          <td style={{ textAlign: "right" }}>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>

                              {!item.dispensed && !isSkipped && !isHold && (

                                <>

                                  <button className="ph-tbl-action" title="Dispense & Bill" onClick={e => { e.stopPropagation(); setDispenseModalItem(item); setDispensingId(null); }}>

                                    <Pill size={13} color="#16a34a" />

                                  </button>

                                  <button className="ph-tbl-action" title="View" onClick={e => { e.stopPropagation(); setQueueViewModal(item); }}>

                                    <Eye size={13} />

                                  </button>

                                  <button className="ph-tbl-action" title="Hold" style={{ color: "#7c3aed" }} onClick={e => { e.stopPropagation(); setRxActionTarget(item); setRxActionType("hold"); setRxActionNotes(""); }}>

                                    <Archive size={13} />

                                  </button>

                                  <button className="ph-tbl-action" title="Skip" style={{ color: "#ea580c" }} onClick={e => { e.stopPropagation(); setRxActionTarget(item); setRxActionType("skip"); setRxActionNotes(""); }}>

                                    <Ban size={13} />

                                  </button>

                                </>

                              )}

                              {(isHold || isSkipped) && (

                                <button className="ph-tbl-action" title="Resume" style={{ color: ACCENT }} onClick={e => { e.stopPropagation(); setRxActionTarget(item); setRxActionType("resume"); setRxActionNotes(""); }}>

                                  <PlayCircle size={13} />

                                </button>

                              )}

                              {item.dispensed && (

                                <>

                                  <button className="ph-tbl-action" title="View Rx" onClick={e => { e.stopPropagation(); setQueueViewModal(item); }}>

                                    <Eye size={13} />

                                  </button>

                                  {item.bill && (

                                    <>

                                      <button className="ph-tbl-action" title="View Bill" style={{ color: "#0E898F" }} onClick={e => { e.stopPropagation(); setQueueBillViewItem(item); }}>

                                        <Receipt size={13} />

                                      </button>

                                      <button className="ph-tbl-action" title="Download Bill PDF" style={{ color: "#2563eb" }} onClick={e => { e.stopPropagation(); handleQueueBillDownload(item); }}>

                                        <Download size={13} />

                                      </button>

                                    </>

                                  )}

                                  <button className="ph-tbl-action" title="Revoke Dispense — undo &amp; re-dispense" style={{ color: "#dc2626" }} onClick={e => { e.stopPropagation(); setRevokeDispenseTarget(item); setRevokeReason(""); }}>

                                    <RotateCcw size={13} />

                                  </button>

                                </>

                              )}

                              {!item.dispensed && (

                                <button className="ph-tbl-action" title="Remove" style={{ color: "#ef4444" }} onClick={e => { e.stopPropagation(); setRxDeleteTarget(item); setRxDeleteRemark(""); }}>

                                  <Trash2 size={13} />

                                </button>

                              )}

                              <button className="ph-tbl-action" title={isExpanded ? "Collapse" : "Expand"} onClick={e => { e.stopPropagation(); setExpandedRx(isExpanded ? null : item.id); }}>

                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}

                              </button>

                            </div>

                          </td>

                        </tr>

                        {/* Expanded Row */}

                        {isExpanded && (

                          <tr>

                            <td colSpan={9} style={{ padding: 0, background: "#f8fffe" }}>

                              <div style={{ padding: "16px 20px", borderTop: `2px solid ${BORDER}` }}>

                                {item.diagnosis && (

                                  <div className="ph-rx-info">

                                    <span className="ph-rx-label">Diagnosis:</span>

                                    <span>{item.diagnosis}</span>

                                  </div>

                                )}

          

                                <div className="ph-meds-header">Prescribed Medications</div>

                                {meds.length === 0 ? (

                                  <div className="ph-empty-sm">No medications in this prescription</div>

                                ) : (

                                  <div className="ph-meds-table-wrap">

                                    <table className="ph-meds-table">

                                      <thead>

                                        <tr>

                                          <th>#</th>

                                          <th>Medicine</th>

                                          <th>Dosage</th>

                                          <th>Frequency</th>

                                          <th>Duration</th>

                                          <th>Qty</th>

                                          <th>Instructions</th>

                                        </tr>

                                      </thead>

                                      <tbody>

                                        {meds.map((med: any, midx: number) => (

                                          <tr key={midx}>

                                            <td>{midx + 1}</td>

                                            <td>

                                              <div className="ph-med-name">{med.name || med.medicine || "\u2014"}</div>

                                              {med.genericName && <div className="ph-med-generic">{med.genericName}</div>}

                                            </td>

                                            <td>{med.dosage || med.dose || "\u2014"}</td>

                                            <td>{med.frequency || "\u2014"}</td>

                                            <td>{med.duration || "\u2014"}</td>

                                            <td><strong>{med.quantity || "\u2014"}</strong></td>

                                            <td>{med.instructions || med.notes || "\u2014"}</td>

                                          </tr>

                                        ))}

                                      </tbody>

                                    </table>

                                  </div>

                                )}

          

                                {/* Action buttons for expanded row */}

                                {!item.dispensed && !isSkipped && !isHold && (

                                  <div style={{ marginTop: 14 }}>

                                    <button className="ph-btn-primary" style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9 }}

                                      onClick={() => { setDispenseModalItem(item); setDispensingId(null); }}>

                                      <Pill size={14} /> Dispense & Bill

                                    </button>

                                  </div>

                                )}

          

                                {(isHold || isSkipped) && (

                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>

                                    <div style={{ padding: "6px 12px", background: isHold ? "#faf5ff" : "#f8fafc", border: `1px solid ${isHold ? "#e9d5ff" : "#e2e8f0"}`, borderRadius: 8, fontSize: 12, color: isHold ? "#7c3aed" : "#94a3b8", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>

                                      {isHold ? <Archive size={13} /> : <Ban size={13} />}

                                      {isHold ? "On Hold" : "Skipped"}

                                      {item.workflowNotes && <span style={{ fontWeight: 400, color: "#64748b" }}>— {item.workflowNotes}</span>}

                                    </div>

                                    <button className="ph-btn-primary" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => { setRxActionTarget(item); setRxActionType("resume"); setRxActionNotes(""); }}>

                                      <PlayCircle size={12} /> Resume

                                    </button>

                                  </div>

                                )}

          

                                {item.dispensed && (

                                  <div className="ph-dispensed-badge" style={{ justifyContent: "space-between", marginTop: 14 }}>

                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} /> Dispensed successfully{item.bill && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 400 }}>· Bill: {item.bill.billNo} · <span style={{ color: item.bill.status === "PAID" ? "#16a34a" : "#ea580c", fontWeight: 700 }}>{item.bill.status}</span></span>}</div>

                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>

                                      <button className="ph-btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setQueueViewModal(item)}><Eye size={12} /> View Rx</button>

                                      {item.bill && (

                                        <>

                                          <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #b2d8da", background: "#E6F4F4", color: "#0E898F", fontWeight: 700, cursor: "pointer" }} onClick={() => setQueueBillViewItem(item)}>

                                            <Receipt size={11} /> View Bill

                                          </button>

                                          <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #bae6fd", background: "#f0f9ff", color: "#0284c7", fontWeight: 700, cursor: "pointer" }} onClick={() => handleQueueBillDownload(item)}>

                                            <Download size={11} /> Download

                                          </button>

                                        </>

                                      )}

                                      <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", fontWeight: 700, cursor: "pointer" }} onClick={() => { setRevokeDispenseTarget(item); setRevokeReason(""); }}>

                                        <RotateCcw size={11} /> Revoke &amp; Re-dispense

                                      </button>

                                    </div>

                                  </div>

                                )}

                              </div>

                            </td>

                          </tr>

                        )}

                      </React.Fragment>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}



      {/* ── Queue: Bill View Modal ── */}

      {queueBillViewItem?.bill && (

        <div className="ph-modal-overlay" onClick={() => setQueueBillViewItem(null)}>

          <div className="ph-modal" style={{ width: 760, maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                <Receipt size={18} color={ACCENT} />

                <div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Bill — {queueBillViewItem.bill.billNo}</div>

                  <div style={{ fontSize: 11, color: "#64748b" }}>{queueBillViewItem.patient?.name} · {queueBillViewItem.prescriptionNo}</div>

                </div>

              </div>

              <div style={{ display: "flex", gap: 8 }}>

                <button style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#475569",fontSize:12,fontWeight:600,cursor:"pointer" }}

                  onClick={() => { const w=window.open("","_blank"); if(!w)return; const c=queueBillPrintRef.current?.innerHTML||""; w.document.write(`<html><head><title>Bill ${queueBillViewItem.bill.billNo}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{padding:8px;border:1px solid #e2e8f0;font-size:12px;}th{background:#f1f5f9;}</style></head><body>${c}</body></html>`); w.document.close(); w.print(); }}>

                  <Printer size={14} /> Print

                </button>

                <button style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"1px solid #bae6fd",background:"#f0f9ff",color:"#0284c7",fontSize:12,fontWeight:600,cursor:"pointer" }}

                  onClick={() => handleQueueBillDownload(queueBillViewItem)}>

                  <Download size={14} /> Download PDF

                </button>

                <button className="ph-btn-ghost" style={{ padding:"6px 10px" }} onClick={() => setQueueBillViewItem(null)}><X size={16} /></button>

              </div>

            </div>

            <div style={{ overflowY: "auto", padding: 24 }} ref={queueBillPrintRef}>

              {/* Bill Header */}

              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,paddingBottom:16,borderBottom:"2px solid #e2e8f0" }}>

                <div>

                  <div style={{ fontSize:18,fontWeight:900,color:"#0f172a" }}>{hospitalInfo.name||"Hospital"}</div>

                  {hospitalInfo.address && <div style={{ fontSize:11,color:"#64748b",marginTop:2 }}>{hospitalInfo.address}</div>}

                  {hospitalInfo.phone && <div style={{ fontSize:11,color:"#64748b" }}>Phone: {hospitalInfo.phone}</div>}

                  {hospitalInfo.email && <div style={{ fontSize:11,color:"#64748b" }}>{hospitalInfo.email}</div>}

                </div>

                <div style={{ textAlign:"right" }}>

                  <div style={{ display:"inline-block",background:"#0E898F",color:"#fff",fontSize:10,fontWeight:800,letterSpacing:".08em",padding:"3px 10px",borderRadius:6,marginBottom:6 }}>INVOICE</div>

                  <div style={{ fontSize:16,fontWeight:800,color:"#0f172a" }}>{queueBillViewItem.bill.billNo}</div>

                  <div style={{ fontSize:11,color:"#64748b" }}>{queueBillViewItem.appointment?.appointmentDate ? fmtDate(queueBillViewItem.appointment.appointmentDate) : fmtDate(queueBillViewItem.createdAt)}</div>

                </div>

              </div>

              {/* Patient Info */}

              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,background:"#f8fafc",borderRadius:10,padding:"12px 16px",marginBottom:20,border:"1px solid #e2e8f0" }}>

                {[{label:"Patient",value:queueBillViewItem.patient?.name},{label:"Patient ID",value:queueBillViewItem.patient?.patientId},{label:"Doctor",value:queueBillViewItem.doctor?.name?"Dr. "+queueBillViewItem.doctor.name:"Walk-in"},{label:"Rx No",value:queueBillViewItem.prescriptionNo},{label:"Date",value:queueBillViewItem.appointment?.appointmentDate?fmtDate(queueBillViewItem.appointment.appointmentDate):fmtDate(queueBillViewItem.createdAt)},{label:"Status",value:queueBillViewItem.bill.status}].map((f,i)=>(

                  <div key={i}><div style={{ fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em" }}>{f.label}</div><div style={{ fontSize:12,fontWeight:600,color:f.label==="Status"?(queueBillViewItem.bill.status==="PAID"?"#16a34a":"#ea580c"):"#1e293b",marginTop:2 }}>{f.value||"—"}</div></div>

                ))}

              </div>

              {/* Pharmacy Items only */}

              {(() => {

                const phItems = (queueBillViewItem.bill.billItems||[]).filter((it:any)=>it.type==="PHARMACY");

                const phTotal = phItems.reduce((s:number,it:any)=>s+(it.amount||0),0);

                return (

                  <>

                    {phItems.length > 0 ? (

                      <>

                        <div style={{ fontSize:11,fontWeight:700,color:"#be185d",marginBottom:8,display:"flex",alignItems:"center",gap:6 }}>

                          <Pill size={13} color="#be185d" /> Pharmacy — Dispensed Medicines

                          {queueBillViewItem.prescriptionNo && <span style={{ fontWeight:400,color:"#94a3b8",fontSize:10 }}>· Rx #{queueBillViewItem.prescriptionNo}</span>}

                        </div>

                        <table style={{ width:"100%",borderCollapse:"collapse",marginBottom:16 }}>

                          <thead>

                            <tr style={{ background:"#fce7f3" }}>

                              {["#","Medicine","Qty","Unit Price","Amount"].map(h=>(

                                <th key={h} style={{ padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700,color:"#be185d" }}>{h}</th>

                              ))}

                            </tr>

                          </thead>

                          <tbody>

                            {phItems.map((it:any,i:number)=>(

                              <tr key={i} style={{ background:i%2===0?"#fff":"#fdf2f8",borderBottom:"1px solid #fce7f3" }}>

                                <td style={{ padding:"7px 10px",fontSize:12,color:"#94a3b8" }}>{i+1}</td>

                                <td style={{ padding:"7px 10px",fontSize:12,fontWeight:600,color:"#1e293b" }}>{it.name}</td>

                                <td style={{ padding:"7px 10px",fontSize:12,color:"#475569",textAlign:"center" }}>{it.quantity||1}</td>

                                <td style={{ padding:"7px 10px",fontSize:12,color:"#475569",textAlign:"right" }}>₹{Number(it.unitPrice||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>

                                <td style={{ padding:"7px 10px",fontSize:12,fontWeight:700,color:"#1e293b",textAlign:"right" }}>₹{Number(it.amount||0).toLocaleString("en-IN",{minimumFractionDigits:2})}</td>

                              </tr>

                            ))}

                          </tbody>

                        </table>

                      </>

                    ) : <div style={{ color:"#94a3b8",fontSize:12,textAlign:"center",padding:20 }}>No pharmacy items dispensed</div>}

                    {/* Totals — pharmacy only */}

                    <div style={{ display:"flex",justifyContent:"flex-end" }}>

                      <div style={{ minWidth:240,background:"#f8fafc",borderRadius:10,padding:"12px 16px",border:"1px solid #e2e8f0" }}>

                        <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b",marginBottom:6 }}>

                          <span>Subtotal</span><span>₹{phTotal.toLocaleString("en-IN",{minimumFractionDigits:2})}</span>

                        </div>

                        <div style={{ borderTop:"2px solid #0E898F",paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:800,color:"#0f172a" }}>

                          <span>Pharmacy Total</span><span style={{ color:"#0E898F" }}>₹{phTotal.toLocaleString("en-IN",{minimumFractionDigits:2})}</span>

                        </div>

                        {queueBillViewItem.bill.status==="PAID" && (

                          <div style={{ marginTop:8,padding:"6px 10px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0",display:"flex",alignItems:"center",gap:6 }}>

                            <CheckCircle2 size={14} color="#16a34a"/><span style={{ fontSize:12,fontWeight:700,color:"#16a34a" }}>PAID</span>

                            <span style={{ fontSize:11,color:"#64748b",marginLeft:"auto" }}>₹{phTotal.toLocaleString("en-IN",{minimumFractionDigits:2})}</span>

                          </div>

                        )}

                      </div>

                    </div>

                  </>

                );

              })()}

            </div>

          </div>

        </div>

      )}



      {/* â"€â"€ Queue: Dispense & Bill Modal â"€â"€ */}

      {dispenseModalItem && (

        <div className="ph-modal-overlay" onClick={() => !dispensingId && setDispenseModalItem(null)}>

          <div className="ph-modal" style={{ width: 820, maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>



            {/* Header */}

            <div className="ph-modal-header" style={{ background: `linear-gradient(135deg, ${ACCENT}14, ${ACCENT}06)`, borderBottom: `1px solid ${ACCENT}28` }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                <div style={{ width: 38, height: 38, borderRadius: 10, background: ACCENT + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>

                  <Pill size={18} color={ACCENT} />

                </div>

                <div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Dispense Medicines</div>

                  <div style={{ fontSize: 11, color: "#64748b" }}>

                    {dispenseModalItem.prescriptionNo} &middot; <strong>{dispenseModalItem.patient?.name}</strong> ({dispenseModalItem.patient?.patientId})

                    {dispenseModalItem.doctor ? ` &middot; Dr. ${dispenseModalItem.doctor.name}` : " &middot; Walk-in"}

                    {dispenseModalItem.diagnosis ? ` &mdash; ${dispenseModalItem.diagnosis}` : ""}

                  </div>

                </div>

              </div>

              <button className="ph-icon-btn-sm" onClick={() => setDispenseModalItem(null)}><X size={16} /></button>

            </div>



            <div className="ph-modal-body" style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>



              {/* Section 1: Medicines Table */}

              <div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>

                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 6 }}>

                    <Package size={13} /> Medicines to Dispense

                  </div>

                  <button

                    style={{ fontSize: 11, padding: "4px 12px", borderRadius: 7, border: `1px solid ${ACCENT}`, background: "#fff", color: ACCENT, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}

                    onClick={() => setDspItems(prev => [...prev, { prescribedName: "", dosage: "", frequency: "", inventoryItemId: "", name: "", quantity: 1, unitPrice: 0 }])}

                  >

                    <Plus size={11} /> Add Item

                  </button>

                </div>



                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>

                  <thead>

                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>

                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11 }}>Medicine / Item</th>

                      <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#64748b", fontSize: 11, width: 70 }}>Qty</th>

                      <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 11, width: 100 }}>Unit Price (&#8377;)</th>

                      <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 11, width: 90 }}>Total (&#8377;)</th>

                      <th style={{ padding: "8px 10px", width: 36 }}></th>

                    </tr>

                  </thead>

                  <tbody>

                    {dspItems.map((med, idx) => {

                      const inv = inventory.find((i: any) => i.id === med.inventoryItemId);

                      const stock = inv ? (inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0) : 0;

                      const stockOk = !inv || stock >= med.quantity;

                      return (

                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", background: !med.inventoryItemId ? "#fffbeb" : !stockOk ? "#fff5f5" : "#fff" }}>

                          <td style={{ padding: "8px 10px" }}>

                            {med.prescribedName && (

                              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>

                                Rx: <strong style={{ color: "#475569" }}>{med.prescribedName}</strong>

                                {med.dosage && <span> &middot; {med.dosage}</span>}

                                {med.frequency && <span> &middot; {med.frequency}</span>}

                              </div>

                            )}

                            <select

                              style={{ width: "100%", padding: "6px 8px", borderRadius: 7, border: `1px solid ${!med.inventoryItemId ? "#f59e0b" : !stockOk ? "#fca5a5" : "#cbd5e1"}`, fontSize: 12, background: "#fff", outline: "none" }}

                              value={med.inventoryItemId}

                              onChange={e => {

                                const sel = inventory.find((i: any) => i.id === e.target.value);

                                setDspItems(prev => prev.map((m, i) => i === idx ? { ...m, inventoryItemId: e.target.value, name: sel?.name || m.name, unitPrice: sel?.sellingPrice || sel?.mrp || m.unitPrice } : m));

                              }}

                            >

                              <option value="">-- Select from Inventory --</option>

                              {inventory.filter((i: any) => i.isActive).map((i: any) => {

                                const s = i.totalStock || i.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;

                                return <option key={i.id} value={i.id}>{i.name}{i.genericName ? ` (${i.genericName})` : ""} — Stock: {s} {i.unit}{s === 0 ? " [OUT]" : ""}</option>;

                              })}

                            </select>

                            {inv && (

                              <div style={{ fontSize: 10, marginTop: 2, color: stockOk ? "#16a34a" : "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>

                                {stockOk ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}

                                {stock} {inv.unit} in stock {!stockOk && `(need ${med.quantity})`}

                              </div>

                            )}

                          </td>

                          <td style={{ padding: "8px 10px", textAlign: "center" }}>

                            <input type="number" min="1" value={med.quantity}

                              onChange={e => setDspItems(prev => prev.map((m, i) => i === idx ? { ...m, quantity: Math.max(1, parseInt(e.target.value) || 1) } : m))}

                              style={{ width: 55, padding: "6px", borderRadius: 7, border: `1px solid ${!stockOk ? "#fca5a5" : "#cbd5e1"}`, fontSize: 12, textAlign: "center" }}

                            />

                          </td>

                          <td style={{ padding: "8px 10px" }}>

                            <input type="number" min="0" step="0.01" value={med.unitPrice}

                              onChange={e => setDspItems(prev => prev.map((m, i) => i === idx ? { ...m, unitPrice: parseFloat(e.target.value) || 0 } : m))}

                              style={{ width: 85, padding: "6px 8px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 12, textAlign: "right" }}

                            />

                          </td>

                          <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>

                            {(med.quantity * med.unitPrice).toFixed(2)}

                          </td>

                          <td style={{ padding: "8px 10px", textAlign: "center" }}>

                            <button onClick={() => setDspItems(prev => prev.filter((_, i) => i !== idx))}

                              style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4, borderRadius: 5 }}>

                              <Trash2 size={13} />

                            </button>

                          </td>

                        </tr>

                      );

                    })}

                    {dspItems.length === 0 && (

                      <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>

                        No medicines. Click <strong>Add Item</strong> to add from inventory.

                      </td></tr>

                    )}

                  </tbody>

                </table>

              </div>



              {/* Section 2: Bill Summary */}

              {dspItems.length > 0 && (() => {

                const subtotal = dspItems.reduce((s, m) => s + (m.quantity * m.unitPrice), 0);

                const total = Math.max(0, subtotal - (dspDiscount || 0));

                return (

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>

                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", minWidth: 260 }}>

                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#64748b" }}>

                        <span>Subtotal</span><span>&#8377; {subtotal.toFixed(2)}</span>

                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 12, color: "#64748b" }}>

                        <span>Discount (&#8377;)</span>

                        <input type="number" min="0" value={dspDiscount} onChange={e => setDspDiscount(parseFloat(e.target.value) || 0)}

                          style={{ width: 80, padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, textAlign: "right" }} />

                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1.5px solid #e2e8f0", fontSize: 15, fontWeight: 800, color: "#1e293b" }}>

                        <span>Total</span>

                        <span style={{ color: ACCENT }}>&#8377; {total.toFixed(2)}</span>

                      </div>

                    </div>

                  </div>

                );

              })()}



              {/* Section 3: Notes */}

              <div>

                <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Dispensing Notes <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>

                <input value={dspNotes} onChange={e => setDspNotes(e.target.value)}

                  placeholder="Add remarks about dispensing..."

                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontFamily: "inherit" }} />

              </div>



              {/* Section 4: After Dispensing Action */}

              <div style={{ background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px" }}>

                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 12 }}>After Dispensing — What&apos;s Next?</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>

                  {([

                    { key: "close", label: "Close Visit", desc: "Mark as done, no billing", icon: <CheckCircle2 size={16} />, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },

                    { key: "collect", label: "Collect Payment", desc: "Collect payment right here", icon: <IndianRupee size={16} />, color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },

                    { key: "transfer", label: "Transfer Patient", desc: "Send to billing or another dept", icon: <Send size={16} />, color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },

                  ] as const).map(opt => (

                    <button key={opt.key} onClick={() => setDspAction(opt.key)}

                      style={{ padding: "12px 10px", borderRadius: 10, border: `2px solid ${dspAction === opt.key ? opt.color : "#e2e8f0"}`, background: dspAction === opt.key ? opt.bg : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "all .15s" }}>

                      <div style={{ color: dspAction === opt.key ? opt.color : "#94a3b8" }}>{opt.icon}</div>

                      <div style={{ fontSize: 12, fontWeight: 700, color: dspAction === opt.key ? opt.color : "#64748b" }}>{opt.label}</div>

                      <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center" }}>{opt.desc}</div>

                    </button>

                  ))}

                </div>



                {/* Collect Payment fields */}

                {dspAction === "collect" && (

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 0 0" }}>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Payment Method</label>

                      <select value={dspPayMethod} onChange={e => setDspPayMethod(e.target.value)}

                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, background: "#fff" }}>

                        <option value="CASH">Cash</option>

                        <option value="UPI">UPI / QR</option>

                        <option value="CARD">Card</option>

                        <option value="ONLINE">Online Transfer</option>

                      </select>

                    </div>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Transaction / Reference ID <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>

                      <input value={dspTxnId} onChange={e => setDspTxnId(e.target.value)}

                        placeholder="UPI ref / card last 4..."

                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, fontFamily: "inherit" }} />

                    </div>

                  </div>

                )}



                {/* Transfer fields */}

                {dspAction === "transfer" && (

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0 0" }}>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Transfer To <span style={{ color: "#ef4444" }}>*</span></label>

                      <select value={dspTransferTarget} onChange={e => setDspTransferTarget(e.target.value)}

                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${!dspTransferTarget ? "#f59e0b" : "#cbd5e1"}`, fontSize: 12, background: "#fff" }}>

                        <option value="">-- Select Department --</option>

                        <option value="BILLING" style={{ fontWeight: "bold", color: "#0ea5e9" }}>Central Billing Counter</option>

                        {subDepts.filter((sd: any) => sd.type !== "PHARMACY").map((sd: any) => (

                          <option key={sd.id} value={sd.id}>{sd.name} ({sd.type})</option>

                        ))}

                      </select>

                    </div>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Transfer Remark</label>

                      <textarea value={dspTransferNote} onChange={e => setDspTransferNote(e.target.value)}

                        placeholder="Reason for transfer, instructions for next dept..."

                        rows={2}

                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 12, resize: "vertical", fontFamily: "inherit" }} />

                    </div>

                  </div>

                )}

              </div>

            </div>



            {/* Footer */}

            <div className="ph-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", padding: "14px 20px" }}>

              <button className="ph-btn-ghost" onClick={() => setDispenseModalItem(null)} disabled={!!dispensingId}>Cancel</button>

              <button

                style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: dispensingId ? "#94a3b8" : `linear-gradient(135deg, ${ACCENT}, #0A6B70)`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: dispensingId ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: (dspAction === "transfer" && !dspTransferTarget) ? 0.6 : 1 }}

                onClick={handleDispenseSubmit}

                disabled={!!dispensingId || dspItems.length === 0 || (dspAction === "transfer" && !dspTransferTarget)}

              >

                {dispensingId ? <Loader2 size={14} className="ph-spin" /> : <CheckCircle2 size={14} />}

                {dispensingId ? "Processing..." : dspAction === "collect" ? "Dispense & Collect Payment" : dspAction === "transfer" ? "Dispense & Transfer Patient" : "Dispense & Close Visit"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* ── Counter Sell Tab ── */}

      {tab === "counter-sell" && (

        <div className="ph-section">

          <PharmacyCounterSellPanel profile={profile} user={user} />

        </div>

      )}



      {/* ── Revenue / Finance Tab ── */}

      {tab === "revenue" && (

        <div className="ph-section" style={{ padding: 24 }}>

          <BillingModule scope="pharmacy" />

        </div>

      )}



      {/* ── Expense Tab ── */}

      {tab === "expense" && (() => {

        const EXP_CATS: { value: string; label: string; color: string; bg: string }[] = [

          { value: "MEDICINE",          label: "Medicine",          color: "#0E898F", bg: "#E6F4F4" },

          { value: "INVENTORY",         label: "Inventory",         color: "#7c3aed", bg: "#f5f3ff" },

          { value: "EQUIPMENT",         label: "Equipment",         color: "#2563eb", bg: "#eff6ff" },

          { value: "MAINTENANCE",       label: "Maintenance",       color: "#d97706", bg: "#fffbeb" },

          { value: "SALARY",            label: "Salary",            color: "#16a34a", bg: "#f0fdf4" },

          { value: "UTILITY",           label: "Utility",           color: "#0891b2", bg: "#ecfeff" },

          { value: "HOUSEKEEPING",      label: "Housekeeping",      color: "#9333ea", bg: "#faf5ff" },

          { value: "MARKETING",         label: "Marketing",         color: "#ea580c", bg: "#fff7ed" },

          { value: "INSURANCE_EXPENSE", label: "Insurance",         color: "#dc2626", bg: "#fef2f2" },

          { value: "OTHER",             label: "Other",             color: "#64748b", bg: "#f8fafc" },

        ];

        const getCat = (v: string) => EXP_CATS.find(c => c.value === v) || EXP_CATS[EXP_CATS.length - 1];

        const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }};

        const totalAll = expenses.reduce((s, e) => s + (e.amount || 0), 0);

        const filtered = expenses.filter(e =>

          !expSearch || e.title?.toLowerCase().includes(expSearch.toLowerCase()) ||

          e.description?.toLowerCase().includes(expSearch.toLowerCase()) ||

          e.category?.toLowerCase().includes(expSearch.toLowerCase())

        );

        return (

          <div className="ph-section" style={{ padding: 24, background: "#fff" }}>

            {/* Header */}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>

              <div>

                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em" }}>Expense Tracker</div>

                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Pharmacy expenses · synced with hospital accounts</div>

              </div>

              <button onClick={() => { setExpEditId(null); setExpForm({ title: "", category: "MEDICINE", amount: "", date: new Date().toISOString().slice(0,10), description: "" }); setExpMsg(""); setExpModal(true); }}

                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#ea580c", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(234,88,12,.25)" }}>

                <Plus size={15} /> Add Expense

              </button>

            </div>



            {/* KPI Cards */}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>

              {[

                { label: "This Month", value: fmtCurrency(expenseStats?.monthTotal || 0), icon: <Calendar size={18} color="#ea580c" />, bg: "#fff7ed", border: "#fed7aa", color: "#ea580c" },

                { label: "All-time Total", value: fmtCurrency(totalAll), icon: <TrendingDown size={18} color="#7c3aed" />, bg: "#f5f3ff", border: "#ddd6fe", color: "#7c3aed" },

                { label: "Entries", value: String(expenses.length), icon: <ClipboardList size={18} color={ACCENT} />, bg: "#E6F4F4", border: "#B3E0E0", color: ACCENT },

              ].map((c, i) => (

                <div key={i} style={{ background: c.bg, borderRadius: 14, padding: "16px 20px", border: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 14 }}>

                  <div style={{ width: 44, height: 44, borderRadius: 11, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>{c.icon}</div>

                  <div>

                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{c.value}</div>

                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{c.label}</div>

                  </div>

                </div>

              ))}

            </div>



            {/* Toolbar */}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>

              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", flex: 1, maxWidth: 320 }}>

                <Search size={14} color="#94a3b8" />

                <input value={expSearch} onChange={e => setExpSearch(e.target.value)} placeholder="Search expenses…"

                  style={{ border: "none", outline: "none", background: "none", fontSize: 12, color: "#334155", width: "100%" }} />

                {expSearch && <button onClick={() => setExpSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}><X size={12} color="#94a3b8" /></button>}

              </div>

              <button onClick={loadExpenses} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>

                <RefreshCw size={13} /> Refresh

              </button>

            </div>



            {/* Table */}

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>

              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Expense Records</span>

                <span style={{ fontSize: 11, color: "#94a3b8" }}>{filtered.length} entries</span>

              </div>

              {expLoading ? (

                <div style={{ padding: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8" }}>

                  <Loader2 size={16} className="ph-spin" /> Loading expenses…

                </div>

              ) : filtered.length === 0 ? (

                <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>

                  <TrendingDown size={36} style={{ marginBottom: 10, opacity: .4 }} />

                  <div style={{ fontWeight: 600, color: "#475569" }}>No expenses found</div>

                  <div style={{ fontSize: 11, marginTop: 4 }}>Click "Add Expense" to record one</div>

                </div>

              ) : (

                <table style={{ width: "100%", borderCollapse: "collapse" }}>

                  <thead>

                    <tr>

                      {["Date","Title","Category","Amount","Remark",""].map((h,i) => (

                        <th key={i} style={{ textAlign: i === 5 ? "right" : "left", fontSize: 10, fontWeight: 600, color: "#94a3b8", padding: "10px 16px", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>

                      ))}

                    </tr>

                  </thead>

                  <tbody>

                    {filtered.map((e: any, i: number) => {

                      const cat = getCat(e.category);

                      return (

                        <tr key={e.id || i} style={{ borderBottom: expDelConfirm === e.id ? "none" : "1px solid #f8fafc" }}

                          onMouseEnter={ev => (ev.currentTarget.style.background = expDelConfirm === e.id ? "#fef2f2" : "#fafbff")}

                          onMouseLeave={ev => (ev.currentTarget.style.background = expDelConfirm === e.id ? "#fef2f2" : "")}>

                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(e.date || e.createdAt)}</td>

                          <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{e.title}</td>

                          <td style={{ padding: "12px 16px" }}>

                            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700, background: cat.bg, color: cat.color }}>{cat.label}</span>

                          </td>

                          <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#ea580c", whiteSpace: "nowrap" }}>{fmtCurrency(e.amount)}</td>

                          <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748b", maxWidth: 200 }}>{e.description || "—"}</td>

                          <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>

                            {expDelConfirm === e.id ? (

                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>

                                <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>Delete?</span>

                                <button onClick={() => deleteExpense(e.id)} disabled={expDeleting}

                                  style={{ padding: "3px 10px", borderRadius: 6, background: "#dc2626", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>

                                  {expDeleting ? "..." : "Yes"}

                                </button>

                                <button onClick={() => setExpDelConfirm(null)}

                                  style={{ padding: "3px 10px", borderRadius: 6, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>No</button>

                              </span>

                            ) : (

                              <span style={{ display: "inline-flex", gap: 6 }}>

                                <button onClick={() => {

                                    setExpEditId(e.id);

                                    setExpForm({ title: e.title, category: e.category || "OTHER", amount: String(e.amount), date: (e.date || e.createdAt || "").slice(0,10), description: e.description || "" });

                                    setExpMsg(""); setExpModal(true);

                                  }}

                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>

                                  <Edit2 size={11} /> Edit

                                </button>

                                <button onClick={() => setExpDelConfirm(e.id)}

                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>

                                  <Trash2 size={11} /> Delete

                                </button>

                              </span>

                            )}

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              )}

            </div>



            {/* Add Expense Modal */}

            {expModal && (

              <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(2px)" }}

                onClick={e => { if (e.target === e.currentTarget) setExpModal(false); }}>

                <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: "min(480px,95vw)", boxShadow: "0 20px 60px rgba(0,0,0,.18)" }}>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingDown size={18} color="#ea580c" /></div>

                      <div>

                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{expEditId ? "Edit Expense" : "Add Expense"}</div>

                        <div style={{ fontSize: 11, color: "#64748b" }}>{expEditId ? "Update this expense record" : "Recorded to hospital accounts"}</div>

                      </div>

                    </div>

                    <button onClick={() => { setExpModal(false); setExpEditId(null); }} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}><X size={14} color="#64748b" /></button>

                  </div>



                  {expMsg && (

                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#dc2626", marginBottom: 16 }}>{expMsg}</div>

                  )}



                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Title <span style={{ color: "#ef4444" }}>*</span></label>

                      <input value={expForm.title} onChange={e => setExpForm(f => ({ ...f, title: e.target.value }))}

                        placeholder="e.g. Monthly medicine restock"

                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />

                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                      <div>

                        <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Category</label>

                        <select value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}

                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}>

                          {EXP_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}

                        </select>

                      </div>

                      <div>

                        <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Amount (₹) <span style={{ color: "#ef4444" }}>*</span></label>

                        <input type="number" min="0" step="0.01" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}

                          placeholder="0.00"

                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }} />

                      </div>

                    </div>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Date <span style={{ color: "#ef4444" }}>*</span></label>

                      <input type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}

                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }} />

                    </div>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Remark / Description</label>

                      <textarea value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}

                        rows={3} placeholder="Optional notes about this expense…"

                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />

                    </div>

                  </div>



                  <div style={{ display: "flex", gap: 10, marginTop: 22 }}>

                    <button onClick={() => setExpModal(false)}

                      style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>

                    <button onClick={saveExpense} disabled={expSaving}

                      style={{ flex: 2, padding: "10px", border: "none", borderRadius: 10, background: expSaving ? "#f97316" : "#ea580c", color: "#fff", fontSize: 13, fontWeight: 700, cursor: expSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>

                      {expSaving ? <><Loader2 size={14} className="ph-spin" /> Saving…</> : <><Check size={14} /> {expEditId ? "Update" : "Save Expense"}</>}

                    </button>

                  </div>

                </div>

              </div>

            )}

          </div>

        );

      })()}



      {/* â”€â”€ Queue: View Rx Detail Modal â”€â”€ */}

      {queueViewModal && (

        <div className="ph-modal-overlay" onClick={() => setQueueViewModal(null)}>

          <div className="ph-modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div>

                <div className="ph-modal-title">Prescription Detail - {queueViewModal.prescriptionNo}</div>

                <div style={{ fontSize: 12, color: "#64748b" }}>{queueViewModal.patient?.name} &middot; Dr. {queueViewModal.doctor?.name || "Walk-in"}</div>

              </div>

              <button className="ph-icon-btn-sm" onClick={() => setQueueViewModal(null)}><X size={16} /></button>

            </div>

            <div className="ph-modal-body">

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>

                {[

                  { label: "Patient", value: `${queueViewModal.patient?.name || "-"} (${queueViewModal.patient?.patientId || ""})` },

                  { label: "Phone", value: queueViewModal.patient?.phone || "-" },

                  { label: "Doctor", value: queueViewModal.doctor ? `Dr. ${queueViewModal.doctor.name}` : "Walk-in / Manual" },

                  { label: "Appointment Type", value: queueViewModal.appointment?.type || "-" },

                  { label: "Diagnosis", value: queueViewModal.diagnosis || "-" },

                  { label: "Chief Complaint", value: queueViewModal.chiefComplaint || "-" },

                  { label: "Status", value: queueViewModal.workflowStatus || queueViewModal.status || "-" },

                  { label: "Total Charge", value: queueViewModal.totalCharge ? fmtCurrency(queueViewModal.totalCharge) : "-" },

                ].map((row, i) => (

                  <div key={i} style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>

                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{row.label}</div>

                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{row.value}</div>

                  </div>

                ))}

              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>Prescribed Medications</div>

              {(queueViewModal.medications || []).length === 0 ? (

                <div className="ph-empty-sm">No medications recorded</div>

              ) : (

                <div className="ph-tbl-wrap">

                  <table className="ph-tbl">

                    <thead>

                      <tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Qty</th><th>Instructions</th></tr>

                    </thead>

                    <tbody>

                      {(queueViewModal.medications || []).map((m: any, i: number) => (

                        <tr key={i}>

                          <td>{i + 1}</td>

                          <td><strong>{m.name || m.medicine || "\u2014"}</strong>{m.genericName && <div style={{ fontSize: 10, color: "#94a3b8" }}>{m.genericName}</div>}</td>

                          <td>{m.dosage || m.dose || "\u2014"}</td>

                          <td>{m.frequency || "\u2014"}</td>

                          <td>{m.duration || "\u2014"}</td>

                          <td><strong>{m.quantity || "\u2014"}</strong></td>

                          <td>{m.instructions || m.notes || "\u2014"}</td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

              {queueViewModal.workflowNotes && (

                <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 12, color: "#92400e" }}>

                  <strong>Notes:</strong> {queueViewModal.workflowNotes}

                </div>

              )}

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => setQueueViewModal(null)}>Close</button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Queue: Skip / Hold / Resume Confirm Modal â”€â”€ */}

      {rxActionTarget && (

        <div className="ph-modal-overlay" onClick={() => setRxActionTarget(null)}>

          <div className="ph-modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div className="ph-modal-title" style={{ color: rxActionType === "resume" ? ACCENT : rxActionType === "hold" ? "#7c3aed" : "#ef4444" }}>

                {rxActionType === "skip" ? "Skip Prescription" : rxActionType === "hold" ? "Put on Hold" : "Resume Prescription"}

              </div>

              <button className="ph-icon-btn-sm" onClick={() => setRxActionTarget(null)}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}>

                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{rxActionTarget.patient?.name}</div>

                <div style={{ color: "#64748b" }}>Rx: {rxActionTarget.prescriptionNo} &middot; Dr. {rxActionTarget.doctor?.name || "Walk-in"}</div>

                {rxActionTarget.diagnosis && <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>Diagnosis: {rxActionTarget.diagnosis}</div>}

              </div>

              <div>

                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Reason / Notes (optional)</label>

                <textarea className="ph-modal-input" rows={3} placeholder={rxActionType === "skip" ? "Reason for skipping..." : rxActionType === "hold" ? "Reason for hold (e.g. waiting for stock)..." : "Notes for resuming..."} value={rxActionNotes} onChange={e => setRxActionNotes(e.target.value)} style={{ resize: "vertical" }} />

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => setRxActionTarget(null)}>Cancel</button>

              <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: rxActionType === "resume" ? ACCENT : rxActionType === "hold" ? "#7c3aed" : "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={handleRxAction} disabled={rxActioning}>

                {rxActioning ? <Loader2 size={13} className="ph-spin" /> : rxActionType === "resume" ? <PlayCircle size={13} /> : rxActionType === "hold" ? <Archive size={13} /> : <Ban size={13} />}

                {rxActionType === "skip" ? "Skip It" : rxActionType === "hold" ? "Put on Hold" : "Resume"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Counter Sale Modal (New Design) â”€â”€ */}

      {counterSaleModal && (

        <CounterSaleModal

          onClose={() => setCounterSaleModal(false)}

          user={user}

          onSuccess={() => { loadStats(); loadInventory(); loadQueue(); }}

        />

      )}



      {/* â”€â”€ Old Counter Sale Modal (disabled) â”€â”€ */}

      {false && (

        <div className="ph-modal-overlay" onClick={() => setCounterSaleModal(false)}>

          <div className="ph-modal" style={{ width: 720, maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header" style={{ background: "linear-gradient(135deg, #ea580c12, #ea580c06)", borderBottom: "1px solid #ea580c25" }}>

              <div>

                <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>

                  <ShoppingCart size={18} color="#ea580c" /> Pharmacy Counter Sale

                </div>

                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Direct sale â€” bill is sent to Hospital Admin & Reception billing</div>

              </div>

              <button className="ph-icon-btn-sm" onClick={() => setCounterSaleModal(false)}><X size={16} /></button>

            </div>



            <div className="ph-modal-body" style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

              {csError && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 12, color: "#dc2626", fontWeight: 600 }}><AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />{csError}</div>}



              {/* Patient Section */}

              <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Patient</div>



                {/* â”€â”€ Selected patient confirmed â”€â”€ */}

                {csPatientId && !csManualPatient ? (

                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>

                    <CheckCircle2 size={16} color="#16a34a" />

                    <span style={{ fontSize: 13, fontWeight: 600, color: "#15803d", flex: 1 }}>{csPatientSearch}</span>

                    <button className="ph-btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => { setCsPatientId(""); setCsPatientSearch(""); setCsSearchNoResults(false); }}>Change</button>

                  </div>



                ) : csManualPatient ? (

                  /* â”€â”€ Manual new-patient form â”€â”€ */

                  <div>

                    <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>

                      <Plus size={12} /> New patient â€” not found in records

                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>

                      <input className="ph-input" placeholder="Full Name *" value={csManualForm.name} onChange={e => setCsManualForm({ ...csManualForm, name: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ea580c55", fontSize: 13 }} />

                      <input className="ph-input" placeholder="Phone * (min 7 digits)" value={csManualForm.phone} onChange={e => setCsManualForm({ ...csManualForm, phone: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ea580c55", fontSize: 13 }} />

                      <select className="ph-select" value={csManualForm.gender} onChange={e => setCsManualForm({ ...csManualForm, gender: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ea580c55", fontSize: 13 }}>

                        <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>

                      </select>

                    </div>

                    <button className="ph-btn-ghost" style={{ fontSize: 11, marginTop: 6 }} onClick={() => { setCsManualPatient(false); setCsManualForm({ name: "", phone: "", gender: "MALE" }); setCsSearchNoResults(false); }}>

                      <Search size={11} /> Back to search

                    </button>

                  </div>



                ) : (

                  /* â”€â”€ Search mode â”€â”€ */

                  <div style={{ position: "relative" }}>

                    <input

                      className="ph-input"

                      placeholder="Search by name, phone, or Patient ID..."

                      value={csPatientSearch}

                      onChange={e => { setCsPatientSearch(e.target.value); setCsSearchNoResults(false); }}

                      style={{ width: "100%", padding: "8px 36px 8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}

                    />

                    {csPatientSearching

                      ? <Loader2 size={14} className="ph-spin" style={{ position: "absolute", right: 12, top: 10, color: "#94a3b8" }} />

                      : csPatientSearch.trim() && <Search size={13} style={{ position: "absolute", right: 12, top: 11, color: "#94a3b8" }} />

                    }



                    {/* Dropdown: results OR no-results create option */}

                    {(csPatients.length > 0 || csSearchNoResults) && csPatientSearch.trim() && (

                      <div style={{ position: "absolute", zIndex: 20, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, maxHeight: 220, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.1)", marginTop: 4 }}>

                        {csPatients.length > 0 ? (

                          <>

                            <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>

                              Search Results

                            </div>

                            {csPatients.map((p: any) => (

                              <div key={p.id}

                                style={{ padding: "9px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}

                                onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}

                                onMouseLeave={e => (e.currentTarget.style.background = "")}

                                onClick={() => { setCsPatientId(p.id); setCsPatientSearch(p.name); setCsPatients([]); setCsSearchNoResults(false); }}>

                                <span><strong>{p.name}</strong><span style={{ color: "#94a3b8", marginLeft: 6 }}>#{p.patientId}</span></span>

                                <span style={{ color: "#64748b", fontSize: 11 }}>{p.phone || ""}</span>

                              </div>

                            ))}

                            {/* Always offer create option at the bottom */}

                            <div

                              style={{ padding: "9px 12px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 8, color: "#ea580c", fontWeight: 600, borderTop: "1px solid #f1f5f9", background: "#fff7ed" }}

                              onMouseEnter={e => (e.currentTarget.style.background = "#ffedd5")}

                              onMouseLeave={e => (e.currentTarget.style.background = "#fff7ed")}

                              onClick={() => { setCsManualPatient(true); setCsManualForm({ name: csPatientSearch.trim(), phone: "", gender: "MALE" }); setCsPatients([]); }}>

                              <Plus size={13} /> Create new patient &quot;{csPatientSearch.trim()}&quot;

                            </div>

                          </>

                        ) : (

                          /* No results found */

                          <div>

                            <div style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 6 }}>

                              <AlertCircle size={13} /> No patient found for &quot;{csPatientSearch.trim()}&quot;

                            </div>

                            <div

                              style={{ padding: "11px 14px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "#ea580c", fontWeight: 700, background: "#fff7ed" }}

                              onMouseEnter={e => (e.currentTarget.style.background = "#ffedd5")}

                              onMouseLeave={e => (e.currentTarget.style.background = "#fff7ed")}

                              onClick={() => { setCsManualPatient(true); setCsManualForm({ name: csPatientSearch.trim(), phone: "", gender: "MALE" }); setCsPatients([]); }}>

                              <Plus size={14} /> Create new patient &quot;{csPatientSearch.trim()}&quot;

                            </div>

                          </div>

                        )}

                      </div>

                    )}



                    {/* Recent patients (shown when input is empty) */}

                    {csPatients.length > 0 && !csPatientSearch.trim() && (

                      <div style={{ position: "absolute", zIndex: 20, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.1)", marginTop: 4 }}>

                        <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9" }}>Recent Patients</div>

                        {csPatients.map((p: any) => (

                          <div key={p.id}

                            style={{ padding: "9px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}

                            onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}

                            onMouseLeave={e => (e.currentTarget.style.background = "")}

                            onClick={() => { setCsPatientId(p.id); setCsPatientSearch(p.name); setCsPatients([]); }}>

                            <span><strong>{p.name}</strong><span style={{ color: "#94a3b8", marginLeft: 6 }}>#{p.patientId}</span></span>

                            <span style={{ color: "#64748b", fontSize: 11 }}>{p.phone || ""}</span>

                          </div>

                        ))}

                      </div>

                    )}

                  </div>

                )}

              </div>



              {/* Items Table with Inventory Selection */}

              <div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>

                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 6 }}>

                    <Package size={14} /> Items <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(Select from inventory)</span>

                  </div>

                  <div style={{ display: "flex", gap: 8 }}>

                    <button className="ph-btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => { setCsHistoryModal(true); loadCsHistory(); }}>

                      <Clock size={11} /> History

                    </button>

                    <button className="ph-btn-ghost" style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => setCsItems([...csItems, { inventoryItemId: "", name: "", quantity: "1", unitPrice: "0", gst: "0", availableStock: 0 }])}>

                      <Plus size={11} /> Add Item

                    </button>

                  </div>

                </div>

                

                {/* Stock Issues Alert â€” accounts for combined quantities of duplicate items */}

                {(() => {

                  const combined: Record<string, number> = {};

                  csItems.filter(i => i.inventoryItemId).forEach(item => {

                    combined[item.inventoryItemId] = (combined[item.inventoryItemId] || 0) + (parseInt(item.quantity) || 0);

                  });

                  const outOfStock = csItems.filter(item => item.inventoryItemId && item.availableStock === 0);

                  const issues = Object.entries(combined).filter(([itemId, totalQty]) => {

                    const item = csItems.find(i => i.inventoryItemId === itemId);

                    return item && totalQty > item.availableStock;

                  });

                  const duplicates = csItems.filter((item, i, arr) => item.inventoryItemId && arr.findIndex(x => x.inventoryItemId === item.inventoryItemId) !== i);

                  if (issues.length === 0 && outOfStock.length === 0 && duplicates.length === 0) return null;

                  return (

                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 12 }}>

                      <AlertCircle size={18} color="#dc2626" />

                      <div style={{ flex: 1 }}>

                        <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Stock Issues</div>

                        <div style={{ fontSize: 11, color: "#7f1d1d", lineHeight: 1.5 }}>

                          {outOfStock.length > 0 && <div>{outOfStock.length} item(s) out of stock.</div>}

                          {issues.length > 0 && <div>Combined quantity exceeds stock for: {issues.map(([itemId]) => csItems.find(i => i.inventoryItemId === itemId)?.name || itemId).join(", ")}.</div>}

                          {duplicates.length > 0 && <div style={{ color: "#b45309" }}>Same item added multiple times â€” quantities are combined for stock check.</div>}

                          Adjust quantities or request purchase.

                        </div>

                      </div>

                    </div>

                  );

                })()}



                <div className="ph-tbl-wrap">

                  <table className="ph-tbl">

                    <thead>

                      <tr>

                        <th style={{ minWidth: 220 }}>Inventory Item <span style={{ color: "#ef4444" }}>*</span></th>

                        <th style={{ width: 70 }}>Qty</th>

                        <th style={{ width: 90 }}>Unit Price (Rs.)</th>

                        <th style={{ width: 80 }}>Amount (Rs.)</th>

                        <th style={{ width: 100 }}>Stock Status</th>

                        <th style={{ width: 50 }}></th>

                      </tr>

                    </thead>

                    <tbody>

                      {csItems.map((item, idx) => {

                        const amt = (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);

                        const qty = parseInt(item.quantity) || 0;

                        // Combined quantity: sum all rows for the same inventory item

                        const combinedQtyForItem = item.inventoryItemId

                          ? csItems.filter(i => i.inventoryItemId === item.inventoryItemId).reduce((sum, i) => sum + (parseInt(i.quantity) || 0), 0)

                          : qty;

                        const isDuplicate = item.inventoryItemId && csItems.filter(i => i.inventoryItemId === item.inventoryItemId).length > 1;

                        const exceedsStock = item.inventoryItemId && combinedQtyForItem > item.availableStock;

                        const isOutOfStock = item.inventoryItemId && item.availableStock === 0;

                        const selectedInv = inventory.find((i: any) => i.id === item.inventoryItemId);

                        

                        return (

                          <tr key={idx} style={{ background: isOutOfStock ? "#fff5f5" : exceedsStock ? "#fffbeb" : "#fff" }}>

                            <td>

                              <div style={{ position: "relative" }}>

                                {/* Show selected item chip or search input */}

                                {item.inventoryItemId ? (

                                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 6, border: `1px solid ${isOutOfStock ? "#fecaca" : exceedsStock ? "#fde68a" : "#bbf7d0"}`, background: isOutOfStock ? "#fef2f2" : exceedsStock ? "#fffbeb" : "#f0fdf4", fontSize: 12 }}>

                                    <Package size={13} color={isOutOfStock ? "#dc2626" : exceedsStock ? "#ea580c" : "#16a34a"} style={{ flexShrink: 0 }} />

                                    <div style={{ flex: 1, minWidth: 0 }}>

                                      <div style={{ fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>

                                      <div style={{ fontSize: 9, color: "#64748b" }}>{selectedInv?.genericName || ""} {selectedInv?.sku ? `· SKU: ${selectedInv.sku}` : ""}</div>

                                    </div>

                                    <button 

                                      className="ph-icon-btn-sm" 

                                      style={{ color: "#94a3b8", flexShrink: 0 }} 

                                      onClick={() => {

                                        const newItems = [...csItems]; 

                                        newItems[idx] = { ...newItems[idx], inventoryItemId: "", name: "", unitPrice: "0", availableStock: 0 }; 

                                        setCsItems(newItems); 

                                        setCsItemSearch({ ...csItemSearch, [idx]: "" });

                                      }}

                                    ><X size={12} /></button>

                                  </div>

                                ) : (

                                  <>

                                    <input 

                                      className="ph-input" 

                                      placeholder="Search medicine / item..."

                                      value={csItemSearch[idx] || ""}

                                      onChange={e => setCsItemSearch({ ...csItemSearch, [idx]: e.target.value })}

                                      onFocus={() => setCsItemSearchFocused({ ...csItemSearchFocused, [idx]: true })}

                                      onBlur={() => setTimeout(() => setCsItemSearchFocused({ ...csItemSearchFocused, [idx]: false }), 200)}

                                      style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12 }}

                                    />

                                    {/* Dropdown results */}

                                    {csItemSearchFocused[idx] && (csItemSearch[idx] || "").trim().length > 0 && (

                                      <div style={{ position: "absolute", zIndex: 50, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, maxHeight: 240, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.12)", marginTop: 2 }}>

                                        {(() => {

                                          const query = (csItemSearch[idx] || "").toLowerCase().trim();

                                          if (!query) return null;

                                          const matched = inventory

                                            .filter((inv: any) => inv.isActive && (

                                              inv.name.toLowerCase().includes(query) ||

                                              (inv.genericName || "").toLowerCase().includes(query) ||

                                              (inv.brandName || "").toLowerCase().includes(query) ||

                                              (inv.sku || "").toLowerCase().includes(query)

                                            ))

                                            .sort((a: any, b: any) => {

                                              // In-stock items first

                                              const stockA = a.totalStock || a.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;

                                              const stockB = b.totalStock || b.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;

                                              if (stockA > 0 && stockB === 0) return -1;

                                              if (stockA === 0 && stockB > 0) return 1;

                                              return 0;

                                            });



                                          if (matched.length === 0) {

                                            return (

                                              <div style={{ padding: 14, textAlign: "center" }}>

                                                <Search size={18} color="#cbd5e1" style={{ marginBottom: 4 }} />

                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>No items found</div>

                                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>"{csItemSearch[idx]}" not in inventory</div>

                                                <button 

                                                  className="ph-btn-ghost" 

                                                  style={{ fontSize: 10, padding: "3px 10px", color: "#0ea5e9", marginTop: 8 }}

                                                  onClick={() => { setCsPurchaseRequestItem({ name: csItemSearch[idx] || "", quantity: 1 }); setCsPurchaseRequestModal(true); }}

                                                >

                                                  <ShoppingCart size={10} /> Request Purchase from Supplier

                                                </button>

                                              </div>

                                            );

                                          }



                                          return matched.map((inv: any) => {

                                            const stock = inv.totalStock || inv.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;

                                            const isInStock = stock > 0;

                                            const isAlreadyAdded = csItems.some((ci, ciIdx) => ciIdx !== idx && ci.inventoryItemId === inv.id);

                                            return (

                                              <div 

                                                key={inv.id}

                                                style={{ 

                                                  padding: "8px 12px", 

                                                  cursor: isInStock ? "pointer" : "default", 

                                                  borderBottom: "1px solid #f8fafc",

                                                  display: "flex", 

                                                  alignItems: "center", 

                                                  gap: 8,

                                                  opacity: isInStock ? 1 : 0.6,

                                                  background: isAlreadyAdded ? "#f8fafc" : "#fff",

                                                }}

                                                onMouseEnter={e => { if (isInStock) (e.currentTarget as HTMLDivElement).style.background = "#f0f9ff"; }}

                                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isAlreadyAdded ? "#f8fafc" : "#fff"; }}

                                                onClick={() => {

                                                  if (!isInStock) return;

                                                  const newItems = [...csItems];

                                                  newItems[idx] = { 

                                                    ...newItems[idx], 

                                                    inventoryItemId: inv.id,

                                                    name: inv.name,

                                                    unitPrice: String(inv.sellingPrice || 0),

                                                    availableStock: stock

                                                  };

                                                  setCsItems(newItems);

                                                  setCsItemSearch({ ...csItemSearch, [idx]: "" });

                                                  setCsItemSearchFocused({ ...csItemSearchFocused, [idx]: false });

                                                }}

                                              >

                                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isInStock ? "#16a34a" : "#dc2626", flexShrink: 0 }} />

                                                <div style={{ flex: 1, minWidth: 0 }}>

                                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>

                                                    {inv.name}

                                                    {isAlreadyAdded && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#fef3c7", color: "#92400e", fontWeight: 600 }}>Already added</span>}

                                                  </div>

                                                  <div style={{ fontSize: 10, color: "#94a3b8" }}>

                                                    {inv.genericName && <span>{inv.genericName}</span>}

                                                    {inv.brandName && <span> &middot; {inv.brandName}</span>}

                                                    {inv.sku && <span> &middot; SKU: {inv.sku}</span>}

                                                  </div>

                                                </div>

                                                <div style={{ flexShrink: 0, textAlign: "right" }}>

                                                  {isInStock ? (

                                                    <>

                                                      <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>{stock} {inv.unit}</div>

                                                      <div style={{ fontSize: 9, color: "#64748b" }}>{fmtCurrency(inv.sellingPrice || 0)}</div>

                                                    </>

                                                  ) : (

                                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", padding: "2px 6px", background: "#fef2f2", borderRadius: 4 }}>OUT OF STOCK</span>

                                                  )}

                                                </div>

                                              </div>

                                            );

                                          });

                                        })()}

                                      </div>

                                    )}

                                  </>

                                )}

                              </div>

                            </td>

                            <td>

                              <input 

                                type="number" 

                                min="1" 

                                max={item.availableStock || undefined}

                                className="ph-input" 

                                value={item.quantity} 

                                onChange={e => { 

                                  const newItems = [...csItems]; 

                                  newItems[idx] = { ...newItems[idx], quantity: e.target.value }; 

                                  setCsItems(newItems); 

                                }}

                                style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: `1px solid ${exceedsStock ? "#f59e0b" : "#cbd5e1"}`, fontSize: 12, textAlign: "center" }} 

                              />

                            </td>

                            <td>

                              <input 

                                type="number" 

                                min="0" 

                                className="ph-input" 

                                value={item.unitPrice} 

                                onChange={e => { 

                                  const newItems = [...csItems]; 

                                  newItems[idx] = { ...newItems[idx], unitPrice: e.target.value }; 

                                  setCsItems(newItems); 

                                }}

                                style={{ width: 80, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, textAlign: "right" }} 

                              />

                            </td>

                            <td><strong style={{ color: "#1e293b", fontSize: 12 }}>{amt.toFixed(2)}</strong></td>

                            <td>

                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>

                                {item.inventoryItemId ? (

                                  <>

                                    <span style={{ fontWeight: 700, fontSize: 11, color: isOutOfStock ? "#dc2626" : exceedsStock ? "#ea580c" : "#16a34a" }}>

                                      {item.availableStock} {selectedInv?.unit || "units"}

                                    </span>

                                    {isOutOfStock && <span style={{ fontSize: 9, fontWeight: 700, color: "#dc2626" }}><Ban size={9} /> OUT</span>}

                                    {!isOutOfStock && exceedsStock && <span style={{ fontSize: 9, fontWeight: 700, color: "#ea580c" }}><AlertTriangle size={9} /> Need {combinedQtyForItem}, only {item.availableStock}</span>}

                                    {isDuplicate && !exceedsStock && <span style={{ fontSize: 9, color: "#b45309" }}><AlertTriangle size={9} /> Combined: {combinedQtyForItem}</span>}

                                  </>

                                ) : (

                                  <span style={{ fontSize: 10, color: "#94a3b8" }}>--</span>

                                )}

                              </div>

                            </td>

                            <td>

                              {csItems.length > 1 && (

                                <button className="ph-icon-btn-sm" style={{ color: "#ef4444" }} onClick={() => setCsItems(csItems.filter((_, i) => i !== idx))}><Trash2 size={13} /></button>

                              )}

                            </td>

                          </tr>

                        );

                      })}

                    </tbody>

                  </table>

                </div>

                {/* Running Total */}

                {(() => {

                  const subtotal = csItems.reduce((s, i) => s + (parseInt(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0);

                  const disc = parseFloat(csDiscount) || 0;

                  const total = Math.max(subtotal - disc, 0);

                  return (

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 10, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>

                      <span>Subtotal: {fmtCurrency(subtotal)}</span>

                      {disc > 0 && <span style={{ color: "#ea580c" }}>Discount: -{fmtCurrency(disc)}</span>}

                      <span style={{ fontSize: 15, color: "#ea580c" }}>Total: {fmtCurrency(total)}</span>

                    </div>

                  );

                })()}

              </div>



              {/* Payment Section */}

              <div style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Payment</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Payment Method</label>

                    <div style={{ display: "flex", gap: 6 }}>

                      {(["CASH", "UPI", "CARD", "ONLINE"] as const).map(m => (

                        <button key={m} onClick={() => setCsPaymentMethod(m)} style={{

                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1.5px solid",

                          cursor: "pointer", transition: "all .15s",

                          background: csPaymentMethod === m ? "#ea580c" : "#fff",

                          color: csPaymentMethod === m ? "#fff" : "#64748b",

                          borderColor: csPaymentMethod === m ? "#ea580c" : "#e2e8f0",

                        }}>{m}</button>

                      ))}

                    </div>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Discount (Rs.)</label>

                    <input type="number" min="0" className="ph-input" value={csDiscount} onChange={e => setCsDiscount(e.target.value)}

                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />

                  </div>

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Tax % (optional)</label>

                    <input type="number" min="0" max="100" className="ph-input" placeholder="0" value={csTaxPct} onChange={e => setCsTaxPct(e.target.value)}

                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Transaction ID (optional)</label>

                    <input className="ph-input" placeholder="UPI ref / Card auth" value={csTransactionId} onChange={e => setCsTransactionId(e.target.value)}

                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Remarks</label>

                    <input className="ph-input" placeholder="Any additional notes..." value={csRemarks} onChange={e => setCsRemarks(e.target.value)}

                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />

                  </div>

                </div>

              </div>

            </div>



            <div className="ph-modal-footer" style={{ borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

              <button className="ph-btn-ghost" onClick={() => setCounterSaleModal(false)}>Cancel</button>

              <button className="ph-btn-primary" style={{ padding: "10px 24px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, borderRadius: 10, background: "#ea580c" }}

                disabled={csSaving || (() => { const combined: Record<string, number> = {}; csItems.filter(i => i.inventoryItemId).forEach(i => { combined[i.inventoryItemId] = (combined[i.inventoryItemId] || 0) + (parseInt(i.quantity) || 0); }); return csItems.some(i => !i.inventoryItemId) || Object.entries(combined).some(([itemId, totalQty]) => { const item = csItems.find(i => i.inventoryItemId === itemId); return item && totalQty > item.availableStock; }); })()} onClick={handleCounterSale}>

                {csSaving ? <Loader2 size={14} className="ph-spin" /> : <Banknote size={14} />}

                Collect Payment & Generate Bill

              </button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Counter Sale History Modal â”€â”€ */}

      {csHistoryModal && (

        <div className="ph-modal-overlay" onClick={() => setCsHistoryModal(false)}>

          <div className="ph-modal" style={{ width: 900, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header" style={{ background: "linear-gradient(135deg, #0ea5e912, #0ea5e906)", borderBottom: "1px solid #0ea5e925" }}>

              <div>

                <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>

                  <History size={18} color="#0ea5e9" /> Counter Sale History

                </div>

                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Recent direct sales with billing details</div>

              </div>

              <button className="ph-icon-btn-sm" onClick={() => setCsHistoryModal(false)}><X size={16} /></button>

            </div>



            <div className="ph-modal-body" style={{ overflowY: "auto", flex: 1 }}>

              {csHistoryLoading ? (

                <div className="ph-loading"><Loader2 size={20} className="ph-spin" /> Loading history...</div>

              ) : csHistory.length === 0 ? (

                <div className="ph-empty" style={{ padding: 40 }}>

                  <Receipt size={36} color="#cbd5e1" />

                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: "#64748b" }}>No counter sales yet</div>

                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Sales history will appear here after you complete transactions</div>

                </div>

              ) : (

                <div className="ph-tbl-wrap">

                  <table className="ph-tbl">

                    <thead>

                      <tr>

                        <th>Bill #</th>

                        <th>Date</th>

                        <th>Patient</th>

                        <th>Items</th>

                        <th>Payment</th>

                        <th>Total</th>

                        <th>Status</th>

                      </tr>

                    </thead>

                    <tbody>

                      {csHistory.map((sale: any) => (

                        <tr key={sale.id}>

                          <td><span className="ph-badge">{sale.billNo}</span></td>

                          <td style={{ fontSize: 11, color: "#64748b" }}>{new Date(sale.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>

                          <td>

                            <div style={{ fontWeight: 600, fontSize: 12 }}>{sale.patient?.name || "Walk-in"}</div>

                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{sale.patient?.phone || ""}</div>

                          </td>

                          <td>

                            <div style={{ fontSize: 11 }}>

                              {sale.items?.slice(0, 2).map((it: any, i: number) => (

                                <div key={i} style={{ color: "#475569" }}>{it.name} x {it.quantity}</div>

                              ))}

                              {sale.items?.length > 2 && <div style={{ color: "#94a3b8" }}>+{sale.items.length - 2} more</div>}

                            </div>

                          </td>

                          <td>

                            <span className="ph-badge blue">{sale.paymentMethod}</span>

                            {sale.transactionId && <div style={{ fontSize: 9, color: "#94a3b8" }}>{sale.transactionId}</div>}

                          </td>

                          <td style={{ fontWeight: 700, color: ACCENT }}>{fmtCurrency(sale.total || 0)}</td>

                          <td>

                            <span className={`ph-badge ${sale.status === "PAID" ? "green" : sale.status === "PENDING" ? "yellow" : "gray"}`}>

                              {sale.status}

                            </span>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>



            <div className="ph-modal-footer" style={{ borderTop: "1px solid #e2e8f0" }}>

              <button className="ph-btn-ghost" onClick={() => setCsHistoryModal(false)}>Close</button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Counter Sale Purchase Request Modal â”€â”€ */}

      {csPurchaseRequestModal && csPurchaseRequestItem && (

        <div className="ph-modal-overlay" onClick={() => setCsPurchaseRequestModal(false)}>

          <div className="ph-modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header" style={{ background: "linear-gradient(135deg, #0ea5e912, #0ea5e906)", borderBottom: "1px solid #0ea5e925" }}>

              <div>

                <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>

                  <ShoppingCart size={18} color="#0ea5e9" /> Request Purchase

                </div>

                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Create purchase request for out-of-stock item</div>

              </div>

              <button className="ph-icon-btn-sm" onClick={() => setCsPurchaseRequestModal(false)}><X size={16} /></button>

            </div>



            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ padding: "14px 16px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10 }}>

                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>Item Not Available</div>

                <div style={{ fontSize: 13, color: "#78350f" }}>

                  <strong>{csPurchaseRequestItem.name}</strong> is not in inventory or out of stock.

                  Create a purchase request to order from supplier.

                </div>

              </div>



              <div>

                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Item Name <span style={{ color: "#ef4444" }}>*</span></label>

                <input className="ph-input" value={csPurchaseRequestItem.name} placeholder="Enter item name to order..." onChange={e => setCsPurchaseRequestItem({ ...csPurchaseRequestItem, name: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />

              </div>



              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

                <div>

                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Quantity Needed</label>

                  <input type="number" min="1" className="ph-input" value={csPurchaseRequestItem.quantity} 

                    onChange={e => setCsPurchaseRequestItem({ ...csPurchaseRequestItem, quantity: parseInt(e.target.value) || 1 })}

                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }} />

                </div>

                <div>

                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Priority</label>

                  <select className="ph-select" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}>

                    <option value="HIGH">High - Urgent</option>

                    <option value="NORMAL">Normal</option>

                    <option value="LOW">Low</option>

                  </select>

                </div>

              </div>



              <div>

                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Preferred Supplier (Optional)</label>

                <select className="ph-select" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}>

                  <option value="">-- Select Supplier --</option>

                  {suppliers.filter((s: any) => s.isActive).map((s: any) => (

                    <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</option>

                  ))}

                </select>

              </div>



              <div>

                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Notes</label>

                <textarea className="ph-input" placeholder="Any specific requirements..." rows={3}

                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, resize: "vertical" }} />

              </div>

            </div>



            <div className="ph-modal-footer" style={{ borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

              <button className="ph-btn-ghost" onClick={() => setCsPurchaseRequestModal(false)}>Cancel</button>

              <button className="ph-btn-primary" style={{ background: "#0ea5e9" }}

                disabled={!csPurchaseRequestItem.name.trim()}

                onClick={() => handleCreatePurchaseRequest(csPurchaseRequestItem.name, csPurchaseRequestItem.quantity)}>

                <Send size={14} /> Submit Purchase Request

              </button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Success Modal (replaces alert()) â”€â”€ */}

      {successModal.open && (

        <div className="ph-modal-overlay" onClick={() => setSuccessModal({ open: false, title: "", message: "", details: [] })} style={{ zIndex: 9999 }}>

          <div className="ph-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>

            <div style={{ padding: "30px 24px", textAlign: "center" }}>

              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#16a34a" }}>

                <CheckCircle2 size={28} />

              </div>

              <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>{successModal.title}</div>

              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: successModal.details.length ? 14 : 0 }}>{successModal.message}</div>

              {successModal.details.length > 0 && (

                <div style={{ textAlign: "left", padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", marginTop: 10 }}>

                  {successModal.details.map((d, i) => (

                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12, color: "#475569" }}>

                      <Check size={13} color="#16a34a" style={{ flexShrink: 0 }} />

                      {d}

                    </div>

                  ))}

                </div>

              )}

            </div>

            <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "center" }}>

              <button className="ph-btn-primary" style={{ padding: "10px 32px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}

                onClick={() => setSuccessModal({ open: false, title: "", message: "", details: [] })}>

                OK

              </button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Queue: Create Manual (Walk-in) Rx Modal â”€â”€ */}

      {rxCreateModal && (

        <div className="ph-modal-overlay" onClick={() => { setRxCreateModal(false); setRxCreateManualPatient(false); }}>

          <div className="ph-modal" style={{ width: 680 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div>

                <div className="ph-modal-title">Add Walk-in Prescription</div>

                <div style={{ fontSize: 12, color: "#64748b" }}>Manually add a prescription to the pharmacy queue</div>

              </div>

              <button className="ph-icon-btn-sm" onClick={() => { setRxCreateModal(false); setRxCreateManualPatient(false); }}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {rxCreateError && (

                <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, fontSize: 12, color: "#dc2626", fontWeight: 600 }}>

                  <AlertCircle size={14} style={{ flexShrink: 0 }} /> {rxCreateError}

                </div>

              )}

              {/* Patient â€” toggle between Search and Manual */}

              <div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>

                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Patient <span style={{ color: "#ef4444" }}>*</span></label>

                  {!rxCreateForm.patientId && (

                    <button type="button" className="ph-btn-ghost" style={{ padding: "3px 10px", fontSize: 11 }}

                      onClick={() => { setRxCreateManualPatient(m => !m); setRxCreatePatients([]); setRxCreatePatientSearch(""); }}>

                      {rxCreateManualPatient ? <><Search size={11} /> Search Existing</> : <><Edit2 size={11} /> Enter Manually</>}

                    </button>

                  )}

                </div>



                {/* â”€â”€ Patient selected â”€â”€ */}

                {rxCreateForm.patientId ? (

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>

                    <div><div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{rxCreateForm.patientName}</div><div style={{ fontSize: 11, color: "#16a34a" }}>Patient selected</div></div>

                    <button className="ph-icon-btn-sm" onClick={() => setRxCreateForm(f => ({ ...f, patientId: "", patientName: "" }))}><X size={14} /></button>

                  </div>



                /* â”€â”€ Manual entry mode â”€â”€ */

                ) : rxCreateManualPatient ? (

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 10, padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12 }}>

                    <div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 3 }}>Name *</div>

                      <input className="ph-modal-input" placeholder="Patient full name" value={rxManualPatientForm.name} onChange={e => setRxManualPatientForm(f => ({ ...f, name: e.target.value }))} />

                    </div>

                    <div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 3 }}>Phone *</div>

                      <input className="ph-modal-input" placeholder="10-digit phone" value={rxManualPatientForm.phone} onChange={e => setRxManualPatientForm(f => ({ ...f, phone: e.target.value }))} />

                    </div>

                    <div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", marginBottom: 3 }}>Gender</div>

                      <select className="ph-modal-input" value={rxManualPatientForm.gender} onChange={e => setRxManualPatientForm(f => ({ ...f, gender: e.target.value }))}>

                        <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>

                      </select>

                    </div>

                    <div style={{ gridColumn: "1/-1", fontSize: 11, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>

                      <User size={12} /> Patient will be auto-registered when you submit

                    </div>

                  </div>



                /* â”€â”€ Search mode â”€â”€ */

                ) : (

                  <div style={{ position: "relative" }}>

                    <div className="ph-search-wrap" style={{ width: "100%" }}>

                      <Search size={14} color="#94a3b8" />

                      <input className="ph-search-input" placeholder="Type patient name, phone or ID..." value={rxCreatePatientSearch} onChange={e => setRxCreatePatientSearch(e.target.value)} />

                      {rxPatientSearching && <Loader2 size={14} className="ph-spin" style={{ color: "#94a3b8" }} />}

                    </div>

                    {/* Patient results list (shown on modal open + on search) */}

                    {rxCreatePatients.length > 0 && (

                      <div style={{ marginTop: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,.12)", maxHeight: 240, overflowY: "auto" }}>

                        <div style={{ padding: "6px 14px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #f1f5f9" }}>

                          {rxCreatePatientSearch.trim().length >= 2 ? "Search Results" : "Recent Patients"} ({rxCreatePatients.length})

                        </div>

                        {rxCreatePatients.map((p: any) => (

                          <button key={p.id} style={{ width: "100%", padding: "10px 14px", border: "none", background: "none", textAlign: "left", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #f8fafc" }}

                            onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")} onMouseLeave={e => (e.currentTarget.style.background = "none")}

                            onClick={() => { setRxCreateForm(f => ({ ...f, patientId: p.id, patientName: p.name })); setRxCreatePatients([]); setRxCreatePatientSearch(""); }}>

                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: LIGHT_BG, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>

                              <User size={13} color={ACCENT} />

                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>

                              <div style={{ fontWeight: 700, color: "#1e293b" }}>{p.name}</div>

                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.patientId || ""} {p.phone ? `· ${p.phone}` : ""} {p.gender ? `· ${p.gender}` : ""}</div>

                            </div>

                          </button>

                        ))}

                      </div>

                    )}

                    {/* No results hint */}

                    {!rxPatientSearching && rxCreatePatientSearch.trim().length >= 2 && rxCreatePatients.length === 0 && (

                      <div style={{ marginTop: 6, fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>

                        <AlertCircle size={12} /> No patients found.

                        <button type="button" style={{ background: "none", border: "none", color: ACCENT, fontWeight: 700, cursor: "pointer", fontSize: 11, padding: 0 }}

                          onClick={() => { setRxCreateManualPatient(true); setRxManualPatientForm(f => ({ ...f, name: rxCreatePatientSearch })); setRxCreatePatientSearch(""); setRxCreatePatients([]); }}>

                          Enter manually instead

                        </button>

                      </div>

                    )}

                  </div>

                )}

              </div>

              {/* Doctor + Diagnosis */}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                <div>

                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Doctor (optional)</label>

                  <select className="ph-modal-input" value={rxCreateForm.doctorId} onChange={e => setRxCreateForm(f => ({ ...f, doctorId: e.target.value }))}>

                    <option value="">— Walk-in / No Doctor —</option>

                    {rxCreateDoctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.name}{d.specialization ? ` (${d.specialization})` : ""}</option>)}

                  </select>

                </div>

                <div>

                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Diagnosis</label>

                  <input className="ph-modal-input" placeholder="e.g. Hypertension, Diabetes..." value={rxCreateForm.diagnosis} onChange={e => setRxCreateForm((f: any) => ({ ...f, diagnosis: e.target.value }))} />

                </div>

              </div>

              {/* Medications with Price */}

              <div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>

                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Medications <span style={{ color: "#ef4444" }}>*</span></label>

                  <button className="ph-btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => setRxCreateForm(f => ({ ...f, medications: [...f.medications, { name: "", dosage: "", frequency: "", duration: "", quantity: "1", price: "0", instructions: "" }] }))}>

                    <Plus size={12} /> Add Row

                  </button>

                </div>

                <div className="ph-tbl-wrap">

                  <table className="ph-tbl">

                    <thead><tr><th>Medicine Name</th><th>Dosage</th><th>Freq</th><th>Qty</th><th>Price (Rs.)</th><th>Amount</th><th></th></tr></thead>

                    <tbody>

                      {rxCreateForm.medications.map((m, idx) => {

                        const amt = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);

                        return (

                        <tr key={idx}>

                          <td><input className="ph-modal-input" style={{ width: "100%", padding: "5px 8px" }} placeholder="Medicine name" value={m.name} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], name: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>

                          <td><input className="ph-modal-input" style={{ width: 70, padding: "5px 8px" }} placeholder="500mg" value={m.dosage} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], dosage: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>

                          <td><input className="ph-modal-input" style={{ width: 70, padding: "5px 8px" }} placeholder="1-0-1" value={m.frequency} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], frequency: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>

                          <td><input type="number" min="1" className="ph-modal-input" style={{ width: 50, padding: "5px 8px" }} value={m.quantity} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], quantity: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>

                          <td><input type="number" min="0" step="0.01" className="ph-modal-input" style={{ width: 75, padding: "5px 8px" }} placeholder="0" value={m.price} onChange={e => { const meds = [...rxCreateForm.medications]; meds[idx] = { ...meds[idx], price: e.target.value }; setRxCreateForm(f => ({ ...f, medications: meds })); }} /></td>

                          <td style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", textAlign: "right", whiteSpace: "nowrap" }}>{fmtCurrency(amt)}</td>

                          <td><button className="ph-icon-btn-sm" style={{ color: "#ef4444" }} onClick={() => setRxCreateForm(f => ({ ...f, medications: f.medications.filter((_, i) => i !== idx) }))} disabled={rxCreateForm.medications.length === 1}><Trash2 size={13} /></button></td>

                        </tr>

                        );

                      })}

                    </tbody>

                  </table>

                </div>

                {/* Running total */}

                {(() => {

                  const sub = rxCreateForm.medications.reduce((s, m) => s + (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1), 0);

                  const disc = parseFloat(rxCreateForm.discount) || 0;

                  const grand = Math.max(0, sub - disc);

                  return (

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginTop: 8, fontSize: 12, fontWeight: 600, color: "#475569" }}>

                      <span>Subtotal: <strong style={{ color: "#1e293b" }}>{fmtCurrency(sub)}</strong></span>

                      {disc > 0 && <span>Discount: <strong style={{ color: "#ef4444" }}>-{fmtCurrency(disc)}</strong></span>}

                      <span>Total: <strong style={{ color: ACCENT, fontSize: 14 }}>{fmtCurrency(grand)}</strong></span>

                    </div>

                  );

                })()}

              </div>



              {/* Notes */}

              <div>

                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 }}>Notes</label>

                <input className="ph-modal-input" placeholder="Pharmacist notes..." value={rxCreateForm.notes} onChange={e => setRxCreateForm(f => ({ ...f, notes: e.target.value }))} />

              </div>



              {/* â”€â”€ Payment / Billing Section â”€â”€ */}

              <div style={{ padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>

                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>Payment Action</label>

                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>

                  {([

                    { v: "none" as const, label: "Add to Queue Only", icon: <ClipboardList size={13} />, desc: "No billing now" },

                    { v: "collect" as const, label: "Collect Payment", icon: <Banknote size={13} />, desc: "Pay at pharmacy" },

                    { v: "send_to_billing" as const, label: "Send to Billing", icon: <CreditCard size={13} />, desc: "Bill later" },

                  ]).map(opt => (

                    <button key={opt.v} type="button" style={{

                      flex: 1, padding: "10px 10px", borderRadius: 10, border: rxCreateForm.paymentAction === opt.v ? `2px solid ${ACCENT}` : "1px solid #e2e8f0",

                      background: rxCreateForm.paymentAction === opt.v ? LIGHT_BG : "#fff", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 2,

                    }} onClick={() => setRxCreateForm(f => ({ ...f, paymentAction: opt.v }))}>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: rxCreateForm.paymentAction === opt.v ? ACCENT : "#475569" }}>{opt.icon} {opt.label}</div>

                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{opt.desc}</div>

                    </button>

                  ))}

                </div>



                {/* Collect payment fields */}

                {rxCreateForm.paymentAction === "collect" && (

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>

                    <div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Payment Method</div>

                      <select className="ph-modal-input" value={rxCreateForm.paymentMethod} onChange={e => setRxCreateForm(f => ({ ...f, paymentMethod: e.target.value }))}>

                        <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="ONLINE">Online</option>

                      </select>

                    </div>

                    <div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Discount (Rs.)</div>

                      <input type="number" min="0" className="ph-modal-input" placeholder="0" value={rxCreateForm.discount} onChange={e => setRxCreateForm(f => ({ ...f, discount: e.target.value }))} />

                    </div>

                    <div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Txn ID (optional)</div>

                      <input className="ph-modal-input" placeholder="Transaction ref" value={rxCreateForm.transactionId} onChange={e => setRxCreateForm(f => ({ ...f, transactionId: e.target.value }))} />

                    </div>

                  </div>

                )}



                {/* Send to billing fields */}

                {rxCreateForm.paymentAction === "send_to_billing" && (

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>

                    <div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Discount (Rs.)</div>

                      <input type="number" min="0" className="ph-modal-input" placeholder="0" value={rxCreateForm.discount} onChange={e => setRxCreateForm(f => ({ ...f, discount: e.target.value }))} />

                    </div>

                    <div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 3 }}>Billing Remark</div>

                      <input className="ph-modal-input" placeholder="Note for billing counter" value={rxCreateForm.billingNote} onChange={e => setRxCreateForm(f => ({ ...f, billingNote: e.target.value }))} />

                    </div>

                  </div>

                )}

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => { setRxCreateModal(false); setRxCreateManualPatient(false); }}>Cancel</button>

              <button className="ph-btn-primary" onClick={handleCreateRx} disabled={rxCreateSaving} style={{ background: rxCreateForm.paymentAction === "collect" ? "#16a34a" : undefined }}>

                {rxCreateSaving ? <Loader2 size={13} className="ph-spin" /> : rxCreateForm.paymentAction === "collect" ? <Banknote size={13} /> : rxCreateForm.paymentAction === "send_to_billing" ? <CreditCard size={13} /> : <Plus size={13} />}

                {rxCreateForm.paymentAction === "collect" ? " Collect & Add" : rxCreateForm.paymentAction === "send_to_billing" ? " Add & Send to Billing" : " Add to Queue"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Queue: Substitute Medicine Modal â”€â”€ */}

      {substituteModal && (

        <div className="ph-modal-overlay" onClick={() => setSubstituteModal(null)}>

          <div className="ph-modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div>

                <div className="ph-modal-title">Find Substitute</div>

                <div style={{ fontSize: 12, color: "#64748b" }}>Alternatives for: <strong>{substituteModal.name}</strong></div>

              </div>

              <button className="ph-icon-btn-sm" onClick={() => setSubstituteModal(null)}><X size={16} /></button>

            </div>

            <div className="ph-modal-body">

              {substituteLoading ? (

                <div className="ph-loading"><Loader2 size={18} className="ph-spin" /> Searching inventory...</div>

              ) : substituteResults.length === 0 ? (

                <div className="ph-empty">

                  <Package size={28} color="#cbd5e1" />

                  <div style={{ marginTop: 6 }}>No alternatives found in inventory</div>

                  <div className="ph-empty-sub">Try searching by generic name or category</div>

                </div>

              ) : (

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                  {substituteResults.map((item: any) => {

                    const stock = item.totalStock || item.batches?.reduce((s: number, b: any) => s + b.remainingQty, 0) || 0;

                    const st = getStockStatus(item);

                    return (

                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>

                        <div style={{ flex: 1, minWidth: 0 }}>

                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{item.name}</div>

                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>

                            {item.genericName && <span>{item.genericName} &middot; </span>}

                            {item.category && <span>{item.category} &middot; </span>}

                            {item.strength || ""}

                          </div>

                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>

                          <div style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{stock} {item.unit || "units"}</div>

                          <div style={{ fontSize: 10, padding: "2px 8px", background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 100, marginTop: 3 }}>{st.label}</div>

                        </div>

                        <button className="ph-btn-primary" style={{ padding: "6px 12px", fontSize: 11 }} onClick={() => {

                          setDspItems(prev => prev.map((m, i) => i === substituteModal.medIdx ? { ...m, name: item.name, inventoryItemId: item.id, unitPrice: item.sellingPrice || item.mrp || 0 } : m));

                          setSubstituteModal(null);

                        }}>

                          Use This

                        </button>

                      </div>

                    );

                  })}

                </div>

              )}

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => setSubstituteModal(null)}>Close</button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Queue: Delete / Remove Confirm Modal â”€â”€ */}

      {rxDeleteTarget && (

        <div className="ph-modal-overlay" onClick={() => { setRxDeleteTarget(null); setRxDeleteRemark(""); }}>

          <div className="ph-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div className="ph-modal-title" style={{ color: "#ef4444" }}>Remove from Queue</div>

              <button className="ph-icon-btn-sm" onClick={() => { setRxDeleteTarget(null); setRxDeleteRemark(""); }}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12 }}>

                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />

                <div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>

                    {rxDeleteTarget.prescriptionNo?.startsWith("RX-") ? "Delete Walk-in Prescription" : "Remove from Pharmacy Queue"}

                  </div>

                  <div style={{ fontSize: 12, color: "#64748b" }}>

                    {rxDeleteTarget.prescriptionNo?.startsWith("RX-")

                      ? "This is a manually added prescription. It will be permanently deleted."

                      : "This will remove the prescription from pharmacy queue. Doctor can prescribe again if needed."}

                  </div>

                </div>

              </div>

              <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{rxDeleteTarget.patient?.name}</div>

                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>

                  Rx: {rxDeleteTarget.prescriptionNo} &middot; {rxDeleteTarget.medications?.length || 0} medication{rxDeleteTarget.medications?.length !== 1 ? "s" : ""}

                  {rxDeleteTarget.doctor?.name && ` - Dr. ${rxDeleteTarget.doctor.name}`}

                </div>

              </div>

              

              {/* Remark Input */}

              <div>

                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>

                  Remark / Reason <span style={{ color: "#ef4444" }}>*</span>

                </label>

                <textarea

                  value={rxDeleteRemark}

                  onChange={e => setRxDeleteRemark(e.target.value)}

                  placeholder="Enter reason (e.g., Patient cancelled, Wrong prescription, etc.)"

                  rows={2}

                  style={{

                    width: "100%",

                    padding: "10px 12px",

                    borderRadius: 8,

                    border: "1px solid #e2e8f0",

                    fontSize: 13,

                    resize: "vertical",

                    outline: "none",

                    fontFamily: "inherit"

                  }}

                />

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => { setRxDeleteTarget(null); setRxDeleteRemark(""); }}>Cancel</button>

              <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={handleDeleteRx} disabled={rxDeleting}>

                {rxDeleting ? <Loader2 size={13} className="ph-spin" /> : <Trash2 size={13} />}

                {rxDeleting ? "Removing..." : "Yes, Remove"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Queue: Revoke Dispense Confirm Modal â”€â”€ */}

      {revokeDispenseTarget && (

        <div className="ph-modal-overlay" onClick={() => { if (!revoking) { setRevokeDispenseTarget(null); setRevokeReason(""); } }}>

          <div className="ph-modal" style={{ width: 460 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>

                  <RotateCcw size={16} color="#dc2626" />

                </div>

                <div className="ph-modal-title" style={{ color: "#dc2626" }}>Revoke Dispense</div>

              </div>

              <button className="ph-icon-btn-sm" onClick={() => { setRevokeDispenseTarget(null); setRevokeReason(""); }} disabled={revoking}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Warning banner */}

              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12 }}>

                <AlertCircle size={20} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />

                <div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412", marginBottom: 4 }}>This will completely undo the dispense</div>

                  <div style={{ fontSize: 12, color: "#7c2d12", lineHeight: 1.5 }}>

                    The following will be <strong>permanently reverted</strong>:<br />

                    • Dispense workflow reset to Pending<br />

                    • PHARMACY bill items removed from invoice<br />

                    • Revenue record deleted<br />

                    • Payment record deleted &amp; bill set to Pending<br />

                    • Stock quantities restored to inventory

                  </div>

                </div>

              </div>

              {/* Prescription info */}

              <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{revokeDispenseTarget.patient?.name}</div>

                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>

                  Rx: <strong>{revokeDispenseTarget.prescriptionNo}</strong>

                  {revokeDispenseTarget.doctor?.name && ` · Dr. ${revokeDispenseTarget.doctor.name}`}

                  {` · ${revokeDispenseTarget.medications?.length || 0} medication${revokeDispenseTarget.medications?.length !== 1 ? "s" : ""}`}

                </div>

              </div>

              <div style={{ fontSize: 12, color: "#64748b", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>

                <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />

                After revoking, the prescription returns to <strong>Pending</strong> and can be dispensed again normally.

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => { setRevokeDispenseTarget(null); setRevokeReason(""); }} disabled={revoking}>Cancel</button>

              <button

                style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 700, cursor: revoking ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: revoking ? 0.7 : 1 }}

                onClick={handleRevokeDispense}

                disabled={revoking}

              >

                {revoking ? <Loader2 size={13} className="ph-spin" /> : <RotateCcw size={13} />}

                {revoking ? "Revoking..." : "Yes, Revoke Dispense"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* â”€â”€ Queue: Bulk Delete Confirm Modal â”€â”€ */}

      {bulkDeleteModalOpen && (

        <div className="ph-modal-overlay" onClick={() => setBulkDeleteModalOpen(false)}>

          <div className="ph-modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div className="ph-modal-title" style={{ color: "#ef4444" }}>Delete {selectedQueue.size} Prescriptions</div>

              <button className="ph-icon-btn-sm" onClick={() => setBulkDeleteModalOpen(false)}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12 }}>

                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />

                <div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>

                    Remove from Pharmacy Queue

                  </div>

                  <div style={{ fontSize: 12, color: "#64748b" }}>

                    These prescriptions will be removed from the pharmacy queue. 

                    Doctors can prescribe again for these patients if needed.

                  </div>

                </div>

              </div>

              

              {/* Remark Input */}

              <div>

                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>

                  Remark / Reason <span style={{ color: "#ef4444" }}>*</span>

                </label>

                <textarea

                  value={bulkDeleteRemark}

                  onChange={e => setBulkDeleteRemark(e.target.value)}

                  placeholder="Enter reason for deletion (e.g., Patient cancelled, Wrong prescription, etc.)"

                  rows={3}

                  style={{

                    width: "100%",

                    padding: "10px 12px",

                    borderRadius: 8,

                    border: "1px solid #e2e8f0",

                    fontSize: 13,

                    resize: "vertical",

                    outline: "none",

                    fontFamily: "inherit"

                  }}

                />

              </div>



              {/* Selected Items Summary */}

              <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>

                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Selected Prescriptions:</div>

                {filteredQueue.filter(q => selectedQueue.has(q.id)).map(q => (

                  <div key={q.id} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>

                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{q.patient?.name}</span>

                    <span style={{ color: "#64748b" }}>{q.prescriptionNo}</span>

                  </div>

                ))}

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => setBulkDeleteModalOpen(false)}>Cancel</button>

              <button 

                style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} 

                onClick={async () => {

                  if (!bulkDeleteRemark.trim()) {

                    alert("Please enter a remark/reason for deletion");

                    return;

                  }

                  setQueueBulkDeleting(true);

                  try {

                    for (const id of selectedQueue) {

                      const item = filteredQueue.find(q => q.id === id);

                      await api(`/api/pharmacy/queue?id=${id}&workflowId=${item?.workflowId || ""}&remark=${encodeURIComponent(bulkDeleteRemark)}`, "DELETE");

                    }

                    setSelectedQueue(new Set());

                    setBulkDeleteModalOpen(false);

                    setBulkDeleteRemark("");

                    loadQueue();

                  } finally {

                    setQueueBulkDeleting(false);

                  }

                }} 

                disabled={queueBulkDeleting}

              >

                {queueBulkDeleting ? <Loader2 size={13} className="ph-spin" /> : <Trash2 size={13} />}

                {queueBulkDeleting ? "Deleting..." : "Yes, Delete All"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* ── Inventory Tab ── */}

      {tab === "inventory" && <AdminInventoryPanel allowDeptTransfers={false} />}





      {/* ── Billing Tab ── */}

      {tab === "billing" && (

        <div className="ph-section" style={{ padding: 0 }}>

          <BillingQueue scope="pharmacy" />

        </div>

      )}



      {tab === "reports" && (

        <div style={{padding:24,background:"#fff",minHeight:"100%",boxSizing:"border-box"}}>

          {statsLoading || !stats ? (

            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"80px 0",color:"#94a3b8"}}>

              <Loader2 size={22} style={{animation:"spin .7s linear infinite"}}/>Loading pharmacy reports...

            </div>

          ) : ((()=>{

            const fmtC = (v:number) => `₹${Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:0})}`;

            

            // Define KPI Cards for Pharmacy (matching Reception style)

            const kpiCards = [

              {icon:<IndianRupee size={20} color="#16a34a"/>,bg:"#f0fdf4",value:fmtC(stats.todayRevenue),label:"Today's Revenue",badge:"TODAY",badgeBg:"#f0fdf4",badgeColor:"#16a34a",badgeBorder:"#bbf7d0"},

              {icon:<TrendingUp size={20} color={ACCENT}/>,bg:LIGHT_BG,value:fmtC(stats.weekRevenue),label:"This Week's Revenue",badge:null as null,badgeBg:"",badgeColor:"",badgeBorder:""},

              {icon:<ClipboardList size={20} color="#3b82f6"/>,bg:"#eff6ff",value:String(stats.todayRxCount),label:"Today's Prescriptions",badge:null as null,badgeBg:"",badgeColor:"",badgeBorder:""},

              {icon:<Clock size={20} color={stats.pendingCount>0?"#ea580c":"#94a3b8"}/>,bg:stats.pendingCount>0?"#fff7ed":"#f8fafc",value:String(stats.pendingCount),label:"Pending in Queue",badge:stats.pendingCount>0?"PENDING":null as null,badgeBg:"#fff7ed",badgeColor:"#ea580c",badgeBorder:"#fed7aa"},

            ];



            const secondaryChips = [

              {icon:<CheckCircle2 size={16} color="#10b981"/>,value:String(stats.todayDispensed),label:"Today's Dispensed",bg:"#f0fdf4"},

              {icon:<IndianRupee size={16} color="#3b82f6"/>,value:fmtC(stats.yesterdayRevenue),label:"Yesterday's Revenue",bg:"#eff6ff"},

              {icon:<ActivityIcon size={16} color={stats.revenueGrowth!==null&&stats.revenueGrowth>0?"#10b981":"#ef4444"}/>,value:stats.revenueGrowth!==null?`${stats.revenueGrowth>0?"+":""}${stats.revenueGrowth}%`:"—",label:"Week-on-Week Growth",bg:stats.revenueGrowth!==null&&stats.revenueGrowth>0?"#f0fdf4":"#fef2f2"},

              {icon:<TrendingUp size={16} color={ACCENT}/>,value:fmtC(stats.totalRevenue),label:"Total Revenue",bg:LIGHT_BG},

            ];



            const chartData = stats.chartData || [];

            const pieData = (stats.topMedicines || []).slice(0, 6).map((m, i) => ({

              name: m.name,

              value: m.qty,

              fill: ["#0E898F", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][i % 6]

            }));



            return (<>

              {/* Header */}

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>

                <div>

                  <div style={{fontSize:22,fontWeight:800,color:"#0f172a",letterSpacing:"-.02em"}}>Pharmacy Reports & Analytics</div>

                  <div style={{fontSize:12,color:"#64748b",marginTop:3,display:"flex",alignItems:"center",gap:6}}>

                    <span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block",boxShadow:"0 0 0 3px #dcfce7",flexShrink:0}}/>

                    Live &middot; Dispensing analytics and inventory insights

                  </div>

                </div>

                <button onClick={loadStats} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",fontSize:12,fontWeight:600,color:"#475569",cursor:"pointer"}}>

                  <RefreshCw size={13}/>Refresh

                </button>

              </div>



              {/* Row 1: 4 KPI Cards */}

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>

                {kpiCards.map((c,i)=>(

                  <div key={i}

                    style={{background:"#fff",borderRadius:12,padding:12,border:"1px solid #e2e8f0",transition:"box-shadow .2s,transform .15s",display:"flex",alignItems:"center",gap:12}}

                    onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.08)";e.currentTarget.style.transform="translateY(-1px)"}}

                    onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform=""}}>

                    <div style={{width:44,height:44,borderRadius:11,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{c.icon}</div>

                    <div style={{flex:1,minWidth:0}}>

                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>

                        <div style={{fontSize:20,fontWeight:800,color:"#0f172a",lineHeight:1}}>{c.value}</div>

                        {c.badge && <span style={{fontSize:8,fontWeight:700,color:c.badgeColor,background:c.badgeBg,padding:"2px 6px",borderRadius:10,border:`1px solid ${c.badgeBorder}`}}>{c.badge}</span>}

                      </div>

                      <div style={{fontSize:10,color:"#64748b"}}>{c.label}</div>

                    </div>

                  </div>

                ))}

              </div>



              {/* Row 2: 4 Secondary Chips */}

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>

                {secondaryChips.map((chip,i)=>(

                  <div key={i} style={{background:chip.bg,borderRadius:12,padding:"12px 16px",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:12}}>

                    <div style={{width:36,height:36,borderRadius:10,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>{chip.icon}</div>

                    <div>

                      <div style={{fontSize:18,fontWeight:800,color:"#0f172a",lineHeight:1.2}}>{chip.value}</div>

                      <div style={{fontSize:11,color:"#64748b"}}>{chip.label}</div>

                    </div>

                  </div>

                ))}

              </div>



              {/* Charts side by side */}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:20}}>

                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px 20px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>

                  <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>Daily Revenue & Dispensing (Last 7 Days)</div>

                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>Hover for details</div>

                  <div style={{width:"100%",height:260}}>

                    <ResponsiveContainer width="100%" height="100%">

                      <AreaChart data={chartData} margin={{top:5,right:10,left:-10,bottom:0}}>

                        <defs>

                          <linearGradient id="chartGrad1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={.3}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>

                          <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ACCENT} stopOpacity={.25}/><stop offset="100%" stopColor={ACCENT} stopOpacity={0}/></linearGradient>

                        </defs>

                        <XAxis dataKey="label" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={{stroke:"#f1f5f9"}}/>

                        <YAxis yAxisId="left" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>

                        <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:"#94a3b8"}} tickLine={false} axisLine={false}/>

                        <Tooltip contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:11,boxShadow:"0 4px 12px rgba(0,0,0,.08)"}} formatter={(val:any,name:any)=>[name==="Revenue (₹)"?`₹${Number(val).toLocaleString("en-IN")}`:val,name]}/>

                        <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#chartGrad1)" strokeWidth={2.5} name="Revenue (₹)" dot={{r:4,fill:"#10b981",strokeWidth:2,stroke:"#fff"}} activeDot={{r:6}}/>

                        <Area yAxisId="right" type="monotone" dataKey="count" stroke={ACCENT} fill="url(#chartGrad2)" strokeWidth={2.5} name="Dispensed" dot={{r:4,fill:ACCENT,strokeWidth:2,stroke:"#fff"}} activeDot={{r:6}}/>

                      </AreaChart>

                    </ResponsiveContainer>

                  </div>

                  <div style={{display:"flex",gap:16,marginTop:10}}>

                    {[{color:"#10b981",label:"Revenue"},{color:ACCENT,label:"Dispensed"}].map((l,i)=>(

                      <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#64748b",fontWeight:600}}>

                        <span style={{width:10,height:3,borderRadius:2,background:l.color,display:"inline-block"}}/>{l.label}

                      </div>

                    ))}

                  </div>

                </div>



                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)",display:"flex",flexDirection:"column"}}>

                  <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>Top Medicines by Quantity</div>

                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>Top {pieData.length} medicines dispensed</div>

                  <div style={{flex:1,width:"100%"}}>

                    <ResponsiveContainer width="100%" height={220}>

                      <PieChart>

                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} paddingAngle={3} strokeWidth={0}>

                          {pieData.map((s,i)=>(

                            <Cell key={i} fill={s.fill}/>

                          ))}

                        </Pie>

                        <Tooltip contentStyle={{borderRadius:8,border:"1px solid #e2e8f0",fontSize:11}}/>

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",marginTop:10}}>

                    {pieData.map((s,i)=>(

                      <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#64748b",fontWeight:600}}>

                        <span style={{width:8,height:8,borderRadius:2,background:s.fill,flexShrink:0}}/>{s.name}: {s.value}

                      </div>

                    ))}

                  </div>

                </div>

              </div>



              {/* Row 3: Pharmacy Specific Insights */}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>

                {/* Profit Margin */}

                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>

                  <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>Profit Margin Analysis</div>

                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>Based on inventory pricing</div>

                  {inventory.length === 0 ? (

                    <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8",fontSize:12}}>Load inventory data to see margin analysis</div>

                  ) : (

                    <div style={{display:"flex",flexDirection:"column",gap:8}}>

                      {inventory.filter(i => i.sellingPrice > 0 && i.purchasePrice > 0).slice(0, 5).map((item, idx) => {

                        const margin = ((item.sellingPrice - item.purchasePrice) / item.sellingPrice * 100);

                        return (

                          <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:10,borderRadius:10,background:"#fafbfc",border:"1px solid #f1f5f9"}}>

                            <div style={{width:32,height:32,borderRadius:50,background:margin>=30?"#f0fdf4":margin>=15?"#fffbeb":"#fff5f5",color:margin>=30?"#16a34a":margin>=15?"#ea580c":"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>

                              {margin.toFixed(0)}%

                            </div>

                            <div style={{flex:1,minWidth:0}}>

                              <div style={{fontSize:12,fontWeight:600,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>

                              <div style={{fontSize:10,color:"#94a3b8"}}>Margin: {fmtCurrency(item.sellingPrice - item.purchasePrice)}</div>

                            </div>

                          </div>

                        );

                      })}

                    </div>

                  )}

                </div>



                {/* Expiry Loss Risk */}

                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>

                  <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>Expiry Loss Risk</div>

                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>Items expiring within 30 days</div>

                  {(() => {

                    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);

                    const expiringItems = inventory.flatMap(item =>

                      (item.batches || []).filter(b => b.expiryDate && new Date(b.expiryDate) <= thirtyDays && b.remainingQty > 0).map(b => ({

                        name: item.name, batch: b.batchNumber || "â€”", qty: b.remainingQty,

                        expiry: b.expiryDate!, lossValue: b.remainingQty * (b.purchasePrice || item.purchasePrice),

                        isExpired: new Date(b.expiryDate!) <= new Date(),

                      }))

                    ).sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());

                    const totalLoss = expiringItems.reduce((s, e) => s + e.lossValue, 0);



                    return expiringItems.length === 0 ? (

                      <div style={{textAlign:"center",padding:"40px 0",color:"#16a34a",fontSize:12}}>

                        <CheckCircle2 size={24} color="#16a34a" style={{marginBottom:8}}/>

                        No items at risk of expiry loss

                      </div>

                    ) : (

                      <div style={{display:"flex",flexDirection:"column",gap:8}}>

                        <div style={{padding:"10px 14px",background:"#fff5f5",border:"1px solid #fecaca",borderRadius:10,fontSize:12,fontWeight:700,color:"#dc2626",marginBottom:4}}>

                          Potential Loss: {fmtCurrency(totalLoss)}

                        </div>

                        {expiringItems.slice(0, 4).map((e, idx) => (

                          <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:10,borderRadius:10,background:e.isExpired?"#fff5f5":"#fff7ed",border:"1px solid "+(e.isExpired?"#fecaca":"#fed7aa")}}>

                            <div style={{width:32,height:32,borderRadius:50,background:e.isExpired?"#dc2626":"#ea580c",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,flexShrink:0}}>

                              {e.isExpired?"EXP":"SOON"}

                            </div>

                            <div style={{flex:1,minWidth:0}}>

                              <div style={{fontSize:12,fontWeight:600,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.name}</div>

                              <div style={{fontSize:10,color:e.isExpired?"#dc2626":"#ea580c"}}>Loss: -{fmtCurrency(e.lossValue)}</div>

                            </div>

                          </div>

                        ))}

                      </div>

                    );

                  })()}

                </div>

              </div>

            </>);

          })())}

        </div>

      )}



      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• INVENTORY MODALS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}



      {/* Add/Edit Medicine Modal */}

      {invModalOpen && (

        <div className="ph-modal-overlay" onClick={() => setInvModalOpen(false)}>

          <div className="ph-modal" style={{ width: 800, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div className="ph-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>

                <Pill size={20} /> {invEditing ? "Edit Medicine" : "Add New Medicine"}

              </div>

              <button className="ph-icon-btn-sm" onClick={() => setInvModalOpen(false)}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              

              {/* Basic Information Section */}

              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>

                  <Package size={14} /> Basic Information

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Medicine Name <span style={{ color: "#ef4444" }}>*</span></label>

                    <input className="ph-modal-input" placeholder="e.g. Paracetamol 500mg Tablet" value={invForm.name} onChange={e => setInvForm((f: any) => ({ ...f, name: e.target.value }))} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Category <span style={{ color: "#ef4444" }}>*</span></label>

                    <select className="ph-modal-input" value={invForm.category} onChange={e => setInvForm((f: any) => ({ ...f, category: e.target.value }))}>

                      <option value="Medicine">Medicine</option>

                      <option value="Consumables">Consumables</option>

                      <option value="Surgical Items">Surgical Items</option>

                      <option value="Equipment">Equipment</option>

                      <option value="Lab Items">Lab Items</option>

                    </select>

                  </div>

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Generic Name</label>

                    <input className="ph-modal-input" placeholder="e.g. Paracetamol (Active ingredient)" value={invForm.genericName} onChange={e => setInvForm((f: any) => ({ ...f, genericName: e.target.value }))} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Brand Name</label>

                    <input className="ph-modal-input" placeholder="e.g. Crocin, Dolo-650" value={invForm.brandName} onChange={e => setInvForm((f: any) => ({ ...f, brandName: e.target.value }))} />

                  </div>

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>SKU Code</label>

                    <input className="ph-modal-input" placeholder="e.g. MED-001" value={invForm.sku} onChange={e => setInvForm((f: any) => ({ ...f, sku: e.target.value }))} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Barcode</label>

                    <input className="ph-modal-input" placeholder="Scan or enter barcode" value={invForm.barcode} onChange={e => setInvForm((f: any) => ({ ...f, barcode: e.target.value }))} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Pack Size</label>

                    <input className="ph-modal-input" placeholder="e.g. 10 tablets/strip" value={invForm.packSize} onChange={e => setInvForm((f: any) => ({ ...f, packSize: e.target.value }))} />

                  </div>

                </div>

              </div>



              {/* Pricing Section */}

              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>

                  <IndianRupee size={14} /> Pricing Details

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Purchase Price (Rs.)</label>

                    <input className="ph-modal-input" type="number" step="0.01" placeholder="0.00" value={invForm.purchasePrice} onChange={e => setInvForm((f: any) => ({ ...f, purchasePrice: parseFloat(e.target.value) || 0 }))} />

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Cost price from supplier</div>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>MRP (Rs.)</label>

                    <input className="ph-modal-input" type="number" step="0.01" placeholder="0.00" value={invForm.mrp} onChange={e => setInvForm((f: any) => ({ ...f, mrp: parseFloat(e.target.value) || 0 }))} />

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Maximum Retail Price</div>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Selling Price (Rs.)</label>

                    <input className="ph-modal-input" type="number" step="0.01" placeholder="0.00" value={invForm.sellingPrice} onChange={e => setInvForm((f: any) => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))} />

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Your selling price</div>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Discount (%)</label>

                    <input className="ph-modal-input" type="number" min={0} max={100} placeholder="0" value={invForm.discount} onChange={e => setInvForm((f: any) => ({ ...f, discount: parseFloat(e.target.value) || 0 }))} />

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Default discount %</div>

                  </div>

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>GST / Tax (%)</label>

                    <input className="ph-modal-input" type="number" min={0} max={100} placeholder="0" value={invForm.gst} onChange={e => setInvForm((f: any) => ({ ...f, gst: parseFloat(e.target.value) || 0 }))} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>HSN Code</label>

                    <input className="ph-modal-input" placeholder="e.g. 3004 (for medicines)" value={invForm.hsnCode} onChange={e => setInvForm((f: any) => ({ ...f, hsnCode: e.target.value }))} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Unit of Measurement</label>

                    <input className="ph-modal-input" placeholder="e.g. Strip, Bottle, Vial" value={invForm.unit} onChange={e => setInvForm((f: any) => ({ ...f, unit: e.target.value }))} />

                  </div>

                </div>

              </div>



              {/* Stock Management Section */}

              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>

                  <Boxes size={14} /> Stock Management

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Min Stock Level</label>

                    <input className="ph-modal-input" type="number" min={0} placeholder="5" value={invForm.minStock} onChange={e => setInvForm((f: any) => ({ ...f, minStock: parseInt(e.target.value) || 0 }))} />

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Low stock alert threshold</div>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Max Stock Level</label>

                    <input className="ph-modal-input" type="number" min={0} placeholder="100" value={invForm.maxStock || ""} onChange={e => setInvForm((f: any) => ({ ...f, maxStock: parseInt(e.target.value) || null }))} />

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Maximum stock to maintain</div>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Reorder Level</label>

                    <input className="ph-modal-input" type="number" min={0} placeholder="10" value={invForm.reorderLevel || ""} onChange={e => setInvForm((f: any) => ({ ...f, reorderLevel: parseInt(e.target.value) || null }))} />

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Trigger purchase order at</div>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Reorder Quantity</label>

                    <input className="ph-modal-input" type="number" min={0} placeholder="50" value={invForm.reorderQty || ""} onChange={e => setInvForm((f: any) => ({ ...f, reorderQty: parseInt(e.target.value) || null }))} />

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Quantity to reorder</div>

                  </div>

                </div>

              </div>



              {/* Storage & Location Section */}

              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>

                  <Archive size={14} /> Storage & Location

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Storage Location</label>

                    <select className="ph-modal-input" value={invForm.location} onChange={e => setInvForm((f: any) => ({ ...f, location: e.target.value }))}>

                      <option value="Pharmacy Store">Pharmacy Store</option>

                      <option value="OT Store">OT Store</option>

                      <option value="Ward Stock">Ward Stock</option>

                    </select>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Rack / Shelf Number</label>

                    <input className="ph-modal-input" placeholder="e.g. A-12, B-05" value={invForm.rackNumber} onChange={e => setInvForm((f: any) => ({ ...f, rackNumber: e.target.value }))} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Temperature Requirement</label>

                    <select className="ph-modal-input" value={invForm.tempRequirement} onChange={e => setInvForm((f: any) => ({ ...f, tempRequirement: e.target.value }))}>

                      <option value="Room Temp">Room Temperature (15-25Â°C)</option>

                      <option value="Refrigerated">Refrigerated (2-8Â°C)</option>

                    </select>

                  </div>

                </div>

              </div>



              {/* Regulatory & Compliance Section */}

              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>

                  <ShieldCheck size={14} /> Regulatory & Compliance

                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Drug Schedule</label>

                    <select className="ph-modal-input" value={invForm.drugSchedule} onChange={e => setInvForm((f: any) => ({ ...f, drugSchedule: e.target.value }))}>

                      <option value="OTC">OTC (Over The Counter)</option>

                      <option value="Schedule H">Schedule H (Prescription Required)</option>

                      <option value="Schedule X">Schedule X (Narcotics)</option>

                    </select>

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Regulatory classification</div>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Sub Category</label>

                    <input className="ph-modal-input" placeholder="e.g. Tablet, Injection, Syrup" value={invForm.subCategory} onChange={e => setInvForm((f: any) => ({ ...f, subCategory: e.target.value }))} />

                  </div>

                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#475569" }}>

                    <input type="checkbox" checked={invForm.requiresRx} onChange={e => setInvForm((f: any) => ({ ...f, requiresRx: e.target.checked }))} style={{ width: 18, height: 18, accentColor: ACCENT }} />

                    <span>Requires Doctor's Prescription (Rx)</span>

                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#475569" }}>

                    <input type="checkbox" checked={invForm.isActive} onChange={e => setInvForm((f: any) => ({ ...f, isActive: e.target.checked }))} style={{ width: 18, height: 18, accentColor: ACCENT }} />

                    <span>Active / Available for Sale</span>

                  </label>

                </div>

              </div>



              {/* Description Section */}

              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>

                  <FileText size={14} /> Additional Information

                </div>

                <div>

                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Description / Notes</label>

                  <textarea 

                    className="ph-modal-input" 

                    rows={3}

                    placeholder="Enter additional details about the medicine, usage instructions, side effects, etc."

                    value={invForm.description} 

                    onChange={e => setInvForm((f: any) => ({ ...f, description: e.target.value }))}

                    style={{ resize: "vertical", minHeight: 60 }}

                  />

                </div>

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => setInvModalOpen(false)}>Cancel</button>

              <button className="ph-btn-primary" onClick={saveInventory} disabled={invSaving || !invForm.name.trim()}>

                {invSaving ? <><Loader2 size={14} className="ph-spin" /> Saving...</> : <><Check size={14} /> {invEditing ? "Update" : "Save"} Medicine</>}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Delete Medicine Confirmation */}

      {invDeleteTarget && (

        <div className="ph-modal-overlay" onClick={() => setInvDeleteTarget(null)}>

          <div className="ph-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div className="ph-modal-title" style={{ color: "#ef4444" }}>Delete Medicine</div>

              <button className="ph-icon-btn-sm" onClick={() => setInvDeleteTarget(null)}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12 }}>

                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />

                <div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Are you sure?</div>

                  <div style={{ fontSize: 12, color: "#64748b" }}>This will permanently delete <strong>{invDeleteTarget.name}</strong> from the inventory. This action cannot be undone.</div>

                </div>

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => setInvDeleteTarget(null)}>Cancel</button>

              <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={deleteInventory} disabled={invDeleting}>

                {invDeleting ? <Loader2 size={13} className="ph-spin" /> : <Trash2 size={13} />}

                {invDeleting ? "Deleting..." : "Delete Medicine"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PURCHASE MODALS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}



      {/* Create Purchase Order Modal */}

      {purchaseModalOpen && (

        <div className="ph-modal-overlay" onClick={() => setPurchaseModalOpen(false)}>

          <div className="ph-modal" style={{ width: 900, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div className="ph-modal-title"><ShoppingCart size={18} style={{ marginRight: 8 }} /> Create Purchase Order</div>

              <button className="ph-icon-btn-sm" onClick={() => setPurchaseModalOpen(false)}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              

              {/* PO Header Information */}

              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Order Information</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>PO Number <span style={{ color: "#ef4444" }}>*</span></label>

                    <input className="ph-modal-input" placeholder="e.g. PO-001" value={purchaseForm.purchaseNo} onChange={e => setPurchaseForm((f: any) => ({ ...f, purchaseNo: e.target.value }))} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Supplier <span style={{ color: "#ef4444" }}>*</span></label>

                    <select className="ph-modal-input" value={purchaseForm.supplierId} onChange={e => setPurchaseForm((f: any) => ({ ...f, supplierId: e.target.value }))}>

                      <option value="">-- Select Supplier --</option>

                      {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name} {s.gstNumber ? `(GST: ${s.gstNumber})` : ""}</option>)}

                    </select>

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Order Date</label>

                    <input className="ph-modal-input" type="date" value={purchaseForm.orderDate} onChange={e => setPurchaseForm((f: any) => ({ ...f, orderDate: e.target.value }))} />

                  </div>

                  <div>

                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Expected Delivery</label>

                    <input className="ph-modal-input" type="date" value={purchaseForm.expectedDeliveryDate} onChange={e => setPurchaseForm((f: any) => ({ ...f, expectedDeliveryDate: e.target.value }))} />

                  </div>

                </div>

                <div style={{ marginTop: 12 }}>

                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Order Notes / Terms</label>

                  <input className="ph-modal-input" placeholder="Enter any special instructions, payment terms, or delivery notes..." value={purchaseForm.notes} onChange={e => setPurchaseForm((f: any) => ({ ...f, notes: e.target.value }))} />

                </div>

              </div>



              {/* Items Section */}

              <div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>

                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>

                    <Package size={16} /> Purchase Items

                  </div>

                  <button className="ph-btn-primary" onClick={addPurchaseItem} style={{ fontSize: 12, padding: "6px 12px" }}><Plus size={14} /> Add Item</button>

                </div>

                

                {/* Items Table Header */}

                <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) 70px 90px 90px 100px 140px 36px", gap: 10, padding: "10px 12px", background: "#f1f5f9", borderRadius: "8px 8px 0 0", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", alignItems: "center" }}>

                  <div>Medicine / Product</div>

                  <div style={{ textAlign: "center" }}>Qty</div>

                  <div style={{ textAlign: "right" }}>Unit Price</div>

                  <div style={{ textAlign: "right" }}>MRP</div>

                  <div style={{ textAlign: "right" }}>Total</div>

                  <div style={{ textAlign: "center" }}>Batch & Expiry</div>

                  <div></div>

                </div>

                

                {/* Items Rows */}

                <div style={{ display: "flex", flexDirection: "column" }}>

                  {purchaseForm.items.map((item: any, idx: number) => (

                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) 70px 90px 90px 100px 140px 36px", gap: 10, padding: "10px 12px", background: "#fff", border: "1px solid #e2e8f0", borderTop: "none", alignItems: "center" }}>

                      <select className="ph-modal-input" style={{ fontSize: 12, width: "100%" }} value={item.itemId} onChange={e => updatePurchaseItem(idx, "itemId", e.target.value)}>

                        <option value="">-- Select Medicine --</option>

                        {inventory.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.name} {inv.genericName ? `(${inv.genericName})` : ""}</option>)}

                      </select>

                      <input className="ph-modal-input" style={{ fontSize: 12, textAlign: "center", width: "100%" }} type="number" min={1} placeholder="Qty" value={item.quantity} onChange={e => updatePurchaseItem(idx, "quantity", parseInt(e.target.value) || 0)} />

                      <input className="ph-modal-input" style={{ fontSize: 12, textAlign: "right", width: "100%" }} type="number" step="0.01" placeholder="0.00" value={item.price} onChange={e => updatePurchaseItem(idx, "price", parseFloat(e.target.value) || 0)} />

                      <input className="ph-modal-input" style={{ fontSize: 12, textAlign: "right", width: "100%" }} type="number" step="0.01" placeholder="0.00" value={item.sellingPrice} onChange={e => updatePurchaseItem(idx, "sellingPrice", parseFloat(e.target.value) || 0)} />

                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", textAlign: "right", paddingRight: 4 }}>

                        {fmtCurrency((item.price || 0) * (item.quantity || 0))}

                      </div>

                      <div style={{ display: "flex", gap: 4, width: "100%" }}>

                        <input className="ph-modal-input" style={{ fontSize: 11, width: "50%" }} placeholder="Batch#" value={item.batchNumber} onChange={e => updatePurchaseItem(idx, "batchNumber", e.target.value)} />

                        <input className="ph-modal-input" style={{ fontSize: 11, width: "50%" }} type="date" value={item.expiryDate} onChange={e => updatePurchaseItem(idx, "expiryDate", e.target.value)} />

                      </div>

                      <button className="ph-icon-btn-sm" onClick={() => removePurchaseItem(idx)} disabled={purchaseForm.items.length === 1} style={{ color: "#ef4444" }}><Trash2 size={14} /></button>

                    </div>

                  ))}

                </div>

              </div>



              {/* Order Summary */}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Additional Charges */}

                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>

                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Additional Charges</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Discount (%)</label>

                      <input className="ph-modal-input" type="number" min={0} max={100} placeholder="0" value={purchaseForm.discount} onChange={e => setPurchaseForm((f: any) => ({ ...f, discount: parseFloat(e.target.value) || 0 }))} />

                    </div>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Tax (%)</label>

                      <input className="ph-modal-input" type="number" min={0} placeholder="0" value={purchaseForm.taxPercent} onChange={e => setPurchaseForm((f: any) => ({ ...f, taxPercent: parseFloat(e.target.value) || 0 }))} />

                    </div>

                    <div>

                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Shipping (Rs.)</label>

                      <input className="ph-modal-input" type="number" min={0} placeholder="0" value={purchaseForm.shippingCharges} onChange={e => setPurchaseForm((f: any) => ({ ...f, shippingCharges: parseFloat(e.target.value) || 0 }))} />

                    </div>

                  </div>

                </div>

                

                {/* Total Summary */}

                <div style={{ background: "#0E898F", padding: 16, borderRadius: 12, color: "#fff" }}>

                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.9 }}>Order Summary</div>

                  {(() => {

                    const subtotal = purchaseForm.items.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

                    const discountAmount = subtotal * (purchaseForm.discount || 0) / 100;

                    const afterDiscount = subtotal - discountAmount;

                    const taxAmount = afterDiscount * (purchaseForm.taxPercent || 0) / 100;

                    const shipping = purchaseForm.shippingCharges || 0;

                    const total = afterDiscount + taxAmount + shipping;

                    return (

                      <>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>

                          <span>Subtotal:</span>

                          <span>{fmtCurrency(subtotal)}</span>

                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, opacity: purchaseForm.discount ? 1 : 0.7 }}>

                          <span>Discount ({purchaseForm.discount || 0}%):</span>

                          <span>-{fmtCurrency(discountAmount)}</span>

                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, opacity: purchaseForm.taxPercent ? 1 : 0.7 }}>

                          <span>Tax ({purchaseForm.taxPercent || 0}%):</span>

                          <span>+{fmtCurrency(taxAmount)}</span>

                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, opacity: shipping ? 1 : 0.7 }}>

                          <span>Shipping:</span>

                          <span>+{fmtCurrency(shipping)}</span>

                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.3)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}>

                          <span>Grand Total:</span>

                          <span>{fmtCurrency(total)}</span>

                        </div>

                      </>

                    );

                  })()}

                </div>

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => setPurchaseModalOpen(false)}>Cancel</button>

              <button className="ph-btn-primary" onClick={savePurchase} disabled={purchaseSaving || !purchaseForm.supplierId || !purchaseForm.purchaseNo || purchaseForm.items.some((i: any) => !i.itemId || i.quantity <= 0)}>

                {purchaseSaving ? <><Loader2 size={14} className="ph-spin" /> Creating...</> : <><Check size={14} /> Create Purchase Order</>}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SUPPLIER MODALS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}



      {/* Add/Edit Supplier Modal */}

      {supplierModalOpen && (

        <div className="ph-modal-overlay" onClick={() => setSupplierModalOpen(false)}>

          <div className="ph-modal" style={{ width: 560, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div className="ph-modal-title">{supplierEditing ? "Edit Supplier" : "Add New Supplier"}</div>

              <button className="ph-icon-btn-sm" onClick={() => setSupplierModalOpen(false)}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                <div>

                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Supplier Name *</label>

                  <input className="ph-modal-input" placeholder="e.g. ABC Pharma Ltd" value={supplierForm.name} onChange={e => setSupplierForm((f: any) => ({ ...f, name: e.target.value }))} />

                </div>

                <div>

                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Contact Person</label>

                  <input className="ph-modal-input" placeholder="e.g. John Doe" value={supplierForm.contactPerson} onChange={e => setSupplierForm((f: any) => ({ ...f, contactPerson: e.target.value }))} />

                </div>

              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                <div>

                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Phone</label>

                  <input className="ph-modal-input" placeholder="e.g. +91 98765 43210" value={supplierForm.phone} onChange={e => setSupplierForm((f: any) => ({ ...f, phone: e.target.value }))} />

                </div>

                <div>

                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Email</label>

                  <input className="ph-modal-input" placeholder="e.g. contact@abcpharma.com" value={supplierForm.email} onChange={e => setSupplierForm((f: any) => ({ ...f, email: e.target.value }))} />

                </div>

              </div>

              <div>

                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>GST Number</label>

                <input className="ph-modal-input" placeholder="e.g. 27AABCU9603R1ZX" value={supplierForm.gstNumber} onChange={e => setSupplierForm((f: any) => ({ ...f, gstNumber: e.target.value }))} />

              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Address</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  <input className="ph-modal-input" placeholder="Address Line 1" value={supplierForm.address1} onChange={e => setSupplierForm((f: any) => ({ ...f, address1: e.target.value }))} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

                    <input className="ph-modal-input" placeholder="City" value={supplierForm.city} onChange={e => setSupplierForm((f: any) => ({ ...f, city: e.target.value }))} />

                    <input className="ph-modal-input" placeholder="State" value={supplierForm.state} onChange={e => setSupplierForm((f: any) => ({ ...f, state: e.target.value }))} />

                    <input className="ph-modal-input" placeholder="Pincode" value={supplierForm.pincode} onChange={e => setSupplierForm((f: any) => ({ ...f, pincode: e.target.value }))} />

                  </div>

                </div>

              </div>

              <div>

                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Notes</label>

                <textarea className="ph-modal-input" rows={3} placeholder="Additional notes..." value={supplierForm.notes} onChange={e => setSupplierForm((f: any) => ({ ...f, notes: e.target.value }))} />

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => setSupplierModalOpen(false)}>Cancel</button>

              <button className="ph-btn-primary" onClick={saveSupplier} disabled={supplierSaving || !supplierForm.name.trim()}>

                {supplierSaving ? <><Loader2 size={14} className="ph-spin" /> Saving...</> : <><Check size={14} /> {supplierEditing ? "Update" : "Save"} Supplier</>}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Delete Supplier Confirmation */}

      {supplierDeleteTarget && (

        <div className="ph-modal-overlay" onClick={() => setSupplierDeleteTarget(null)}>

          <div className="ph-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>

            <div className="ph-modal-header">

              <div className="ph-modal-title" style={{ color: "#ef4444" }}>Delete Supplier</div>

              <button className="ph-icon-btn-sm" onClick={() => setSupplierDeleteTarget(null)}><X size={16} /></button>

            </div>

            <div className="ph-modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12 }}>

                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />

                <div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>Are you sure?</div>

                  <div style={{ fontSize: 12, color: "#64748b" }}>This will delete <strong>{supplierDeleteTarget.name}</strong> from the suppliers list.</div>

                </div>

              </div>

            </div>

            <div className="ph-modal-footer">

              <button className="ph-btn-ghost" onClick={() => setSupplierDeleteTarget(null)}>Cancel</button>

              <button style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={deleteSupplier} disabled={supplierDeleting}>

                {supplierDeleting ? <Loader2 size={13} className="ph-spin" /> : <Trash2 size={13} />}

                {supplierDeleting ? "Deleting..." : "Delete Supplier"}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* ── Real-time New Prescription Notification Modal ── */}

      {newRxNotification && (

        <div className="ph-modal-overlay" style={{ zIndex: 10000 }} onClick={e => e.stopPropagation()}>

          <div className="ph-modal" style={{ width: 480, maxHeight: "85vh", animation: "phSlideIn .3s ease", background: "#fff" }}>

            {/* Header — plain white */}

            <div className="ph-modal-header" style={{ background: "#fff", borderBottom: "1px solid #f1f5f9" }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>

                  <Bell size={18} color="#16a34a" />

                </div>

                <div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>New Prescription Received</div>

                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>

                    From Dr. {newRxNotification.doctor?.name || "—"} &middot; {newRxNotification.prescriptionNo}

                  </div>

                </div>

              </div>

              <button className="ph-icon-btn-sm" onClick={() => setNewRxNotification(null)}><X size={16} /></button>

            </div>



            <div className="ph-modal-body" style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Patient Info */}

              <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>

                <div style={{ width: 44, height: 44, borderRadius: 11, background: ACCENT, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>

                  {(newRxNotification.patient?.name || "P")[0].toUpperCase()}

                </div>

                <div style={{ flex: 1 }}>

                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{newRxNotification.patient?.name}</div>

                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>

                    {newRxNotification.patient?.patientId} &middot; {newRxNotification.patient?.phone || "No phone"}

                  </div>

                  {newRxNotification.appointment?.tokenNumber && (

                    <span style={{ display: "inline-block", marginTop: 6, padding: "2px 9px", background: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 700, color: ACCENT, border: `1px solid ${BORDER}` }}>

                      Token #{newRxNotification.appointment.tokenNumber}

                    </span>

                  )}

                </div>

              </div>



              {/* Diagnosis */}

              {newRxNotification.diagnosis && (

                <div>

                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>Diagnosis</div>

                  <div style={{ padding: "9px 13px", background: "#f8fafc", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13, color: "#334155" }}>

                    {newRxNotification.diagnosis}

                  </div>

                </div>

              )}



              {/* Medications — no prices */}

              {newRxNotification.medications?.length > 0 && (

                <div>

                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>

                    Medications ({newRxNotification.medications.length})

                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>

                    {newRxNotification.medications.map((med: any, idx: number) => (

                      <div key={idx} style={{ padding: "10px 14px", borderBottom: idx < newRxNotification.medications.length - 1 ? "1px solid #f1f5f9" : "none", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                        <div>

                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{med.name || med.medicine}</div>

                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>

                            {[med.dosage || med.dose, med.frequency, med.duration].filter(Boolean).join(" · ")}

                          </div>

                        </div>

                        <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", marginLeft: 12 }}>Qty: {med.quantity || 1}</div>

                      </div>

                    ))}

                  </div>

                </div>

              )}

            </div>

            <div className="ph-modal-footer" style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>

              <button 

                className="ph-btn-ghost" 

                onClick={() => setNewRxNotification(null)}

                style={{ padding: "10px 20px" }}

              >

                Dismiss

              </button>

              <div style={{ display: "flex", gap: 10 }}>

                <button 

                  className="ph-btn-primary"

                  style={{ background: "#16a34a", padding: "10px 20px" }}

                  onClick={() => {

                    setNewRxNotification(null);

                    setTab("queue");

                    setExpandedRx(newRxNotification.id);

                  }}

                >

                  <Eye size={14} /> View in Queue

                </button>

                <button 

                  className="ph-btn-primary"

                  style={{ padding: "10px 20px" }}

                  onClick={() => {

                    setNewRxNotification(null);

                    // Find the queue item and open dispense modal

                    const item = queue.find((q: any) => q.id === newRxNotification.id);

                    if (item) {

                      setDispenseModalItem(item);

                      setDispensingId(null);

                    } else {

                      // If not in queue yet, refresh and then open

                      loadQueue().then(() => {

                        setTimeout(() => {

                          const refreshedItem = queue.find((q: any) => q.id === newRxNotification.id);

                          if (refreshedItem) {

                            setDispenseModalItem(refreshedItem);

                            setDispensingId(null);

                          }

                        }, 500);

                      });

                    }

                  }}

                >

                  <Pill size={14} /> Dispense & Bill

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </>

  );

}



// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€



const pharmacyStyles = `

  /* Navigation */

  .ph-nav{display:flex;gap:0;padding:6px 0;margin-bottom:20px;border-bottom:2px solid #f1f5f9;flex-wrap:wrap}

  .ph-nav-btn{padding:9px 16px;border:none;background:none;color:#64748b;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .15s;white-space:nowrap}

  .ph-nav-btn:hover{color:#334155;background:#f8fafc}

  .ph-nav-btn.on{color:${ACCENT};border-bottom-color:${ACCENT};background:${LIGHT_BG}}



  /* Section */

  .ph-section{animation:phFadeIn .2s ease}

  @keyframes phFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}



  /* Stats Grid */

  .ph-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px}

  .ph-stats-grid-6{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}

  @media(max-width:1100px){.ph-stats-grid-6{grid-template-columns:repeat(2,1fr)}}

  @media(max-width:600px){.ph-stats-grid-6{grid-template-columns:1fr}}

  .ph-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;transition:all .15s}

  .ph-stat-card:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(14,137,143,.08)}

  .ph-stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}

  .ph-stat-info{min-width:0}

  .ph-stat-value{font-size:22px;font-weight:800;color:#1e293b;line-height:1.2}

  .ph-stat-label{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px}



  /* Alerts */

  .ph-alerts-row{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}

  .ph-alert-card{flex:1;min-width:240px;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;font-size:13px;font-weight:500}

  .ph-alert-card.warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e}

  .ph-alert-card.danger{background:#fff5f5;border:1px solid #fecaca;color:#991b1b}

  .ph-alert-card.info{background:${LIGHT_BG};border:1px solid ${BORDER};color:#0A6B70}

  .ph-alert-action{margin-left:auto;padding:5px 12px;border-radius:8px;border:1px solid currentColor;background:none;color:inherit;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap}

  .ph-alert-action:hover{opacity:.8}



  /* Flow Card */

  .ph-flow-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:20px}

  .ph-flow-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:14px}

  .ph-flow-steps{display:flex;align-items:center;gap:6px;flex-wrap:wrap}

  .ph-flow-step{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;transition:all .15s}

  .ph-flow-step.active{background:#f0fdf4;border-color:#bbf7d0;color:#16a34a}

  .ph-flow-step.highlight{background:${LIGHT_BG};border-color:${BORDER};color:${ACCENT};box-shadow:0 2px 8px rgba(14,137,143,.12)}

  .ph-flow-num{width:22px;height:22px;border-radius:50%;background:currentColor;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}

  .ph-flow-step.active .ph-flow-num{background:#16a34a}

  .ph-flow-step.highlight .ph-flow-num{background:${ACCENT}}

  .ph-flow-text{white-space:nowrap}

  .ph-flow-arrow{color:#cbd5e1;display:flex;align-items:center}



  /* Charts Row */

  .ph-charts-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}

  @media(max-width:900px){.ph-charts-row{grid-template-columns:1fr}}

  .ph-chart-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px}

  .ph-chart-header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px;gap:8px}

  .ph-chart-title{font-size:14px;font-weight:700;color:#1e293b}

  .ph-chart-subtitle{font-size:11px;color:#94a3b8}



  /* Bar Chart */

  .ph-bar-chart{display:flex;align-items:flex-end;gap:8px;height:160px;padding-top:10px}

  .ph-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%}

  .ph-bar-value{font-size:10px;font-weight:700;color:#475569;white-space:nowrap}

  .ph-bar-track{flex:1;width:100%;max-width:36px;background:#f1f5f9;border-radius:6px 6px 0 0;position:relative;overflow:hidden;display:flex;align-items:flex-end}

  .ph-bar-fill{width:100%;background:linear-gradient(to top,${ACCENT},#10b981);border-radius:6px 6px 0 0;transition:height .4s ease;min-height:2px}

  .ph-bar-fill.revenue{background:linear-gradient(to top,#f59e0b,#f97316)}

  .ph-bar-label{font-size:9px;color:#94a3b8;font-weight:600;white-space:nowrap}



  /* Notification Modal Animation */

  @keyframes phSlideIn{from{opacity:0;transform:translateY(-20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}



  /* Top List */

  .ph-top-list{display:flex;flex-direction:column;gap:8px}

  .ph-top-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:#fafbfc;border:1px solid #f1f5f9}

  .ph-top-rank{width:24px;height:24px;border-radius:50%;background:${LIGHT_BG};color:${ACCENT};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0}

  .ph-top-info{flex:1;min-width:0}

  .ph-top-name{font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  .ph-top-meta{font-size:10px;color:#94a3b8}

  .ph-top-revenue{font-size:12px;font-weight:700;color:${ACCENT};white-space:nowrap}



  /* Quick Actions */

  .ph-quick-actions{margin-bottom:20px}

  .ph-quick-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px}

  .ph-quick-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}

  .ph-quick-btn{display:flex;align-items:center;gap:10px;padding:16px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;cursor:pointer;font-size:13px;font-weight:600;color:#334155;transition:all .15s;position:relative}

  .ph-quick-btn:hover{border-color:${BORDER};box-shadow:0 2px 12px rgba(14,137,143,.08);transform:translateY(-1px)}

  .ph-quick-badge{position:absolute;top:8px;right:8px;min-width:20px;height:20px;border-radius:50%;background:#ef4444;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px}

  .ph-quick-badge.warn{background:#f59e0b}



  /* Toolbar */

  .ph-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}

  .ph-toolbar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}

  .ph-search-wrap{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 14px;width:260px}

  .ph-search-input{background:none;border:none;outline:none;font-size:13px;color:#334155;width:100%}

  .ph-search-input::placeholder{color:#94a3b8}

  .ph-icon-btn-sm{width:20px;height:20px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;border-radius:4px}

  .ph-icon-btn-sm:hover{background:#e2e8f0}



  /* Filter Pills */

  .ph-filter-pills{display:flex;gap:6px}

  .ph-pill{padding:6px 12px;border-radius:100px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s;white-space:nowrap}

  .ph-pill:hover{border-color:#cbd5e1}

  .ph-pill.on{background:${LIGHT_BG};border-color:${BORDER};color:${ACCENT}}

  .ph-pill-count{background:${ACCENT};color:#fff;font-size:9px;font-weight:800;padding:1px 6px;border-radius:50px;min-width:16px;text-align:center}



  /* Buttons */

  .ph-btn-primary{padding:9px 18px;border-radius:9px;border:none;background:${ACCENT};color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap}

  .ph-btn-primary:hover{background:#0A6B70;transform:translateY(-1px)}

  .ph-btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none}

  .ph-btn-ghost{padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px}

  .ph-btn-ghost:hover{border-color:#cbd5e1;background:#f8fafc}



  /* Badge */

  .ph-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700;white-space:nowrap}

  .ph-badge.green{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}

  .ph-badge.red{background:#fff5f5;color:#ef4444;border:1px solid #fecaca}

  .ph-badge.orange{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}

  .ph-badge.blue{background:${LIGHT_BG};color:#0A6B70;border:1px solid ${BORDER}}



  /* Queue */

  .ph-queue-list{display:flex;flex-direction:column;gap:10px}

  .ph-queue-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;transition:all .15s}

  .ph-queue-card:hover{border-color:#cbd5e1}

  .ph-queue-card.dispensed{opacity:.75}

  .ph-queue-card.expanded{border-color:${BORDER};box-shadow:0 2px 16px rgba(14,137,143,.08)}

  .ph-queue-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;cursor:pointer;gap:12px}

  .ph-queue-left{display:flex;align-items:center;gap:12px;min-width:0}

  .ph-token{width:36px;height:36px;border-radius:10px;background:${LIGHT_BG};color:${ACCENT};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}

  .ph-queue-patient{font-size:14px;font-weight:700;color:#1e293b}

  .ph-queue-meta{font-size:11px;color:#94a3b8;margin-top:2px}

  .ph-queue-right{display:flex;align-items:center;gap:10px;flex-shrink:0}

  .ph-queue-doctor{font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px;white-space:nowrap}

  .ph-queue-meds-count{font-size:11px;color:#94a3b8;font-weight:600;background:#f8fafc;padding:3px 8px;border-radius:6px;white-space:nowrap}



  /* Queue Body */

  .ph-queue-body{padding:0 18px 18px;border-top:1px solid #f1f5f9}

  .ph-rx-info{font-size:12px;color:#475569;padding:10px 0 6px;display:flex;gap:6px}

  .ph-rx-label{font-weight:700;color:#64748b;flex-shrink:0}

  .ph-meds-header{font-size:12px;font-weight:700;color:#1e293b;margin:10px 0 8px;text-transform:uppercase;letter-spacing:.05em}

  .ph-meds-table-wrap{overflow-x:auto;border:1px solid #f1f5f9;border-radius:10px}

  .ph-meds-table{width:100%;border-collapse:collapse;font-size:12px}

  .ph-meds-table th{text-align:left;padding:8px 12px;background:#fafbfc;color:#64748b;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #f1f5f9;white-space:nowrap}

  .ph-meds-table td{padding:8px 12px;color:#475569;border-bottom:1px solid #fafbfc}

  .ph-meds-table tr:last-child td{border-bottom:none}

  .ph-med-name{font-weight:600;color:#1e293b}

  .ph-med-generic{font-size:10px;color:#94a3b8;margin-top:1px}



  /* Dispense Bar */

  .ph-dispense-bar{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #f1f5f9}

  .ph-dispense-notes{flex:1;padding:9px 14px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:12px;outline:none;background:#f8fafc;color:#334155;font-family:inherit}

  .ph-dispense-notes:focus{border-color:${BORDER};box-shadow:0 0 0 3px rgba(14,137,143,.1)}

  .ph-dispensed-badge{display:flex;align-items:center;gap:6px;padding:10px 14px;margin-top:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;color:#16a34a;font-size:12px;font-weight:700}



  /* Inventory Stats */

  .ph-inv-stats{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}

  .ph-inv-stat{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-size:12px;color:#475569}

  .ph-inv-stat.warn{background:#fffbeb;border-color:#fde68a;color:#92400e}



  /* Table Action Buttons */

  .ph-tbl-action{width:30px;height:30px;border:1px solid transparent;background:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:#94a3b8;border-radius:7px;transition:all .12s;padding:0}

  .ph-tbl-action:hover{background:#f1f5f9;border-color:#e2e8f0;color:#475569}



  /* Queue Row */

  .ph-queue-row{transition:background .15s}

  .ph-queue-row:hover td{background:#fafbfc}

  .ph-queue-row.expanded td{background:#f8fffe}



  /* Table */

  .ph-tbl-wrap{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}

  .ph-tbl{width:100%;border-collapse:collapse}

  .ph-tbl th{text-align:left;font-size:10px;font-weight:700;color:#94a3b8;padding:12px 14px;border-bottom:2px solid #f1f5f9;white-space:nowrap;text-transform:uppercase;letter-spacing:.05em}

  .ph-tbl td{padding:12px 14px;font-size:12px;color:#475569;border-bottom:1px solid #fafbfc}

  .ph-tbl tr:last-child td{border-bottom:none}

  .ph-tbl tbody tr:hover td{background:#fafbfc}

  .ph-row-warn{background:#fffbeb !important}

  .ph-row-warn td{background:#fffbeb !important}

  .ph-med-cell{min-width:0}

  .ph-rank{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${LIGHT_BG};color:${ACCENT};font-size:10px;font-weight:800}



  /* Supplier Grid */

  .ph-supplier-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:12px}

  .ph-supplier-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;transition:all .15s}

  .ph-supplier-card:hover{border-color:${BORDER}}

  .ph-supplier-name{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px}

  .ph-supplier-meta{font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px;margin-top:3px}



  /* Loading / Empty */

  .ph-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px;color:#94a3b8;font-size:13px}

  .ph-empty{text-align:center;padding:60px 20px;color:#94a3b8;font-size:13px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;display:flex;flex-direction:column;align-items:center}

  .ph-empty-sm{text-align:center;padding:20px;color:#94a3b8;font-size:12px}

  .ph-empty-sub{font-size:11px;color:#cbd5e1;margin-top:4px}

  .ph-link{color:${ACCENT};font-weight:700;background:none;border:none;cursor:pointer;text-decoration:underline}



  /* Modal */

  .ph-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;animation:phFadeIn .15s ease}

  .ph-modal{background:#fff;border-radius:18px;width:520px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}

  .ph-modal-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #f1f5f9}

  .ph-modal-title{font-size:16px;font-weight:700;color:#1e293b}

  .ph-modal-body{padding:20px 22px}

  .ph-modal-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid #f1f5f9}

  .ph-modal-input{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;color:#334155;outline:none;font-family:inherit;background:#f8fafc}

  .ph-modal-input:focus{border-color:${BORDER};box-shadow:0 0 0 3px rgba(14,137,143,.1)}



  /* Payment Method Buttons */

  .ph-method-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit}

  .ph-method-btn:hover{border-color:#cbd5e1;background:#f8fafc}

  .ph-method-btn.on{border-color:${BORDER};background:${LIGHT_BG};color:${ACCENT};font-weight:700}



  /* Appointment Slot Picker */

  .ph-appt-slots{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0}

  .ph-slot-btn{padding:6px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#475569;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit}

  .ph-slot-btn:hover{border-color:${BORDER};background:${LIGHT_BG};color:${ACCENT}}

  .ph-slot-btn.on{border-color:${ACCENT};background:${ACCENT};color:#fff}



  /* Spinner */

  @keyframes phSpin{to{transform:rotate(360deg)}}

  .ph-spin{animation:phSpin .7s linear infinite}

`;

